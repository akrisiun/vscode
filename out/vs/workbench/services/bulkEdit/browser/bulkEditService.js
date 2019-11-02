/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/browser/editorBrowser", "vs/editor/browser/services/bulkEditService", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/modes", "vs/editor/common/services/modelService", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/files/common/files", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/platform/progress/common/progress", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/textfile/common/textfiles", "vs/platform/label/common/label", "vs/platform/configuration/common/configuration"], function (require, exports, arrays_1, lifecycle_1, uri_1, editorBrowser_1, bulkEditService_1, editOperation_1, range_1, modes_1, modelService_1, resolverService_1, nls_1, files_1, extensions_1, log_1, progress_1, editorService_1, textfiles_1, label_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Recording {
        static start(fileService) {
            let _changes = new Set();
            let subscription = fileService.onAfterOperation(e => {
                _changes.add(e.resource.toString());
            });
            return {
                stop() { return subscription.dispose(); },
                hasChanged(resource) { return _changes.has(resource.toString()); }
            };
        }
    }
    class ModelEditTask {
        constructor(_modelReference) {
            this._modelReference = _modelReference;
            this._model = this._modelReference.object.textEditorModel;
            this._edits = [];
        }
        dispose() {
            lifecycle_1.dispose(this._modelReference);
        }
        addEdit(resourceEdit) {
            this._expectedModelVersionId = resourceEdit.modelVersionId;
            for (const edit of resourceEdit.edits) {
                if (typeof edit.eol === 'number') {
                    // honor eol-change
                    this._newEol = edit.eol;
                }
                if (!edit.range && !edit.text) {
                    // lacks both a range and the text
                    continue;
                }
                if (range_1.Range.isEmpty(edit.range) && !edit.text) {
                    // no-op edit (replace empty range with empty text)
                    continue;
                }
                // create edit operation
                let range;
                if (!edit.range) {
                    range = this._model.getFullModelRange();
                }
                else {
                    range = range_1.Range.lift(edit.range);
                }
                this._edits.push(editOperation_1.EditOperation.replaceMove(range, edit.text));
            }
        }
        validate() {
            if (typeof this._expectedModelVersionId === 'undefined' || this._model.getVersionId() === this._expectedModelVersionId) {
                return { canApply: true };
            }
            return { canApply: false, reason: this._model.uri };
        }
        apply() {
            if (this._edits.length > 0) {
                this._edits = arrays_1.mergeSort(this._edits, (a, b) => range_1.Range.compareRangesUsingStarts(a.range, b.range));
                this._model.pushStackElement();
                this._model.pushEditOperations([], this._edits, () => []);
                this._model.pushStackElement();
            }
            if (this._newEol !== undefined) {
                this._model.pushStackElement();
                this._model.pushEOL(this._newEol);
                this._model.pushStackElement();
            }
        }
    }
    class EditorEditTask extends ModelEditTask {
        constructor(modelReference, editor) {
            super(modelReference);
            this._editor = editor;
        }
        apply() {
            if (this._edits.length > 0) {
                this._edits = arrays_1.mergeSort(this._edits, (a, b) => range_1.Range.compareRangesUsingStarts(a.range, b.range));
                this._editor.pushUndoStop();
                this._editor.executeEdits('', this._edits);
                this._editor.pushUndoStop();
            }
            if (this._newEol !== undefined) {
                if (this._editor.hasModel()) {
                    this._editor.pushUndoStop();
                    this._editor.getModel().pushEOL(this._newEol);
                    this._editor.pushUndoStop();
                }
            }
        }
    }
    class BulkEditModel {
        constructor(textModelResolverService, editor, edits, progress) {
            this._edits = new Map();
            this._textModelResolverService = textModelResolverService;
            this._editor = editor;
            this._progress = progress;
            edits.forEach(this.addEdit, this);
        }
        dispose() {
            this._tasks = lifecycle_1.dispose(this._tasks);
        }
        addEdit(edit) {
            let array = this._edits.get(edit.resource.toString());
            if (!array) {
                array = [];
                this._edits.set(edit.resource.toString(), array);
            }
            array.push(edit);
        }
        async prepare() {
            if (this._tasks) {
                throw new Error('illegal state - already prepared');
            }
            this._tasks = [];
            const promises = [];
            this._edits.forEach((value, key) => {
                const promise = this._textModelResolverService.createModelReference(uri_1.URI.parse(key)).then(ref => {
                    const model = ref.object;
                    if (!model || !model.textEditorModel) {
                        throw new Error(`Cannot load file ${key}`);
                    }
                    let task;
                    if (this._editor && this._editor.hasModel() && this._editor.getModel().uri.toString() === model.textEditorModel.uri.toString()) {
                        task = new EditorEditTask(ref, this._editor);
                    }
                    else {
                        task = new ModelEditTask(ref);
                    }
                    value.forEach(edit => task.addEdit(edit));
                    this._tasks.push(task);
                    this._progress.report(undefined);
                });
                promises.push(promise);
            });
            await Promise.all(promises);
            return this;
        }
        validate() {
            for (const task of this._tasks) {
                const result = task.validate();
                if (!result.canApply) {
                    return result;
                }
            }
            return { canApply: true };
        }
        apply() {
            for (const task of this._tasks) {
                task.apply();
                this._progress.report(undefined);
            }
        }
    }
    let BulkEdit = class BulkEdit {
        constructor(editor, progress, _logService, _textModelService, _fileService, _textFileService, _uriLabelServie, _configurationService) {
            this._logService = _logService;
            this._textModelService = _textModelService;
            this._fileService = _fileService;
            this._textFileService = _textFileService;
            this._uriLabelServie = _uriLabelServie;
            this._configurationService = _configurationService;
            this._edits = [];
            this._editor = editor;
            this._progress = progress || progress_1.emptyProgress;
        }
        add(edits) {
            if (Array.isArray(edits)) {
                this._edits.push(...edits);
            }
            else {
                this._edits.push(edits);
            }
        }
        ariaMessage() {
            const editCount = this._edits.reduce((prev, cur) => modes_1.isResourceFileEdit(cur) ? prev : prev + cur.edits.length, 0);
            const resourceCount = this._edits.length;
            if (editCount === 0) {
                return nls_1.localize('summary.0', "Made no edits");
            }
            else if (editCount > 1 && resourceCount > 1) {
                return nls_1.localize('summary.nm', "Made {0} text edits in {1} files", editCount, resourceCount);
            }
            else {
                return nls_1.localize('summary.n0', "Made {0} text edits in one file", editCount, resourceCount);
            }
        }
        async perform() {
            let seen = new Set();
            let total = 0;
            const groups = [];
            let group;
            for (const edit of this._edits) {
                if (!group
                    || (modes_1.isResourceFileEdit(group[0]) && !modes_1.isResourceFileEdit(edit))
                    || (modes_1.isResourceTextEdit(group[0]) && !modes_1.isResourceTextEdit(edit))) {
                    group = [];
                    groups.push(group);
                }
                group.push(edit);
                if (modes_1.isResourceFileEdit(edit)) {
                    total += 1;
                }
                else if (!seen.has(edit.resource.toString())) {
                    seen.add(edit.resource.toString());
                    total += 2;
                }
            }
            // define total work and progress callback
            // for child operations
            this._progress.report({ total });
            let progress = { report: _ => this._progress.report({ increment: 1 }) };
            // do it.
            for (const group of groups) {
                if (modes_1.isResourceFileEdit(group[0])) {
                    await this._performFileEdits(group, progress);
                }
                else {
                    await this._performTextEdits(group, progress);
                }
            }
        }
        async _performFileEdits(edits, progress) {
            this._logService.debug('_performFileEdits', JSON.stringify(edits));
            for (const edit of edits) {
                progress.report(undefined);
                let options = edit.options || {};
                if (edit.newUri && edit.oldUri) {
                    // rename
                    if (options.overwrite === undefined && options.ignoreIfExists && await this._fileService.exists(edit.newUri)) {
                        continue; // not overwriting, but ignoring, and the target file exists
                    }
                    await this._textFileService.move(edit.oldUri, edit.newUri, options.overwrite);
                }
                else if (!edit.newUri && edit.oldUri) {
                    // delete file
                    if (await this._fileService.exists(edit.oldUri)) {
                        let useTrash = this._configurationService.getValue('files.enableTrash');
                        if (useTrash && !(this._fileService.hasCapability(edit.oldUri, 4096 /* Trash */))) {
                            useTrash = false; // not supported by provider
                        }
                        await this._textFileService.delete(edit.oldUri, { useTrash, recursive: options.recursive });
                    }
                    else if (!options.ignoreIfNotExists) {
                        throw new Error(`${edit.oldUri} does not exist and can not be deleted`);
                    }
                }
                else if (edit.newUri && !edit.oldUri) {
                    // create file
                    if (options.overwrite === undefined && options.ignoreIfExists && await this._fileService.exists(edit.newUri)) {
                        continue; // not overwriting, but ignoring, and the target file exists
                    }
                    await this._textFileService.create(edit.newUri, undefined, { overwrite: options.overwrite });
                }
            }
        }
        async _performTextEdits(edits, progress) {
            this._logService.debug('_performTextEdits', JSON.stringify(edits));
            const recording = Recording.start(this._fileService);
            const model = new BulkEditModel(this._textModelService, this._editor, edits, progress);
            await model.prepare();
            const conflicts = edits
                .filter(edit => recording.hasChanged(edit.resource))
                .map(edit => this._uriLabelServie.getUriLabel(edit.resource, { relative: true }));
            recording.stop();
            if (conflicts.length > 0) {
                model.dispose();
                throw new Error(nls_1.localize('conflict', "These files have changed in the meantime: {0}", conflicts.join(', ')));
            }
            const validationResult = model.validate();
            if (validationResult.canApply === false) {
                throw new Error(`${validationResult.reason.toString()} has changed in the meantime`);
            }
            await model.apply();
            model.dispose();
        }
    };
    BulkEdit = __decorate([
        __param(2, log_1.ILogService),
        __param(3, resolverService_1.ITextModelService),
        __param(4, files_1.IFileService),
        __param(5, textfiles_1.ITextFileService),
        __param(6, label_1.ILabelService),
        __param(7, configuration_1.IConfigurationService)
    ], BulkEdit);
    exports.BulkEdit = BulkEdit;
    let BulkEditService = class BulkEditService {
        constructor(_logService, _modelService, _editorService, _textModelService, _fileService, _textFileService, _labelService, _configurationService) {
            this._logService = _logService;
            this._modelService = _modelService;
            this._editorService = _editorService;
            this._textModelService = _textModelService;
            this._fileService = _fileService;
            this._textFileService = _textFileService;
            this._labelService = _labelService;
            this._configurationService = _configurationService;
        }
        apply(edit, options = {}) {
            let { edits } = edit;
            let codeEditor = options.editor;
            // First check if loaded models were not changed in the meantime
            for (const edit of edits) {
                if (!modes_1.isResourceFileEdit(edit) && typeof edit.modelVersionId === 'number') {
                    let model = this._modelService.getModel(edit.resource);
                    if (model && model.getVersionId() !== edit.modelVersionId) {
                        // model changed in the meantime
                        return Promise.reject(new Error(`${model.uri.toString()} has changed in the meantime`));
                    }
                }
            }
            // try to find code editor
            // todo@joh, prefer edit that gets edited
            if (!codeEditor) {
                let candidate = this._editorService.activeTextEditorWidget;
                if (editorBrowser_1.isCodeEditor(candidate)) {
                    codeEditor = candidate;
                }
            }
            if (codeEditor && codeEditor.getOption(64 /* readOnly */)) {
                // If the code editor is readonly still allow bulk edits to be applied #68549
                codeEditor = undefined;
            }
            const bulkEdit = new BulkEdit(codeEditor, options.progress, this._logService, this._textModelService, this._fileService, this._textFileService, this._labelService, this._configurationService);
            bulkEdit.add(edits);
            return bulkEdit.perform().then(() => {
                return { ariaSummary: bulkEdit.ariaMessage() };
            }).catch(err => {
                // console.log('apply FAILED');
                // console.log(err);
                this._logService.error(err);
                throw err;
            });
        }
    };
    BulkEditService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, modelService_1.IModelService),
        __param(2, editorService_1.IEditorService),
        __param(3, resolverService_1.ITextModelService),
        __param(4, files_1.IFileService),
        __param(5, textfiles_1.ITextFileService),
        __param(6, label_1.ILabelService),
        __param(7, configuration_1.IConfigurationService)
    ], BulkEditService);
    exports.BulkEditService = BulkEditService;
    extensions_1.registerSingleton(bulkEditService_1.IBulkEditService, BulkEditService, true);
});
//# sourceMappingURL=bulkEditService.js.map