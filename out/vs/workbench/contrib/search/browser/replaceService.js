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
define(["require", "exports", "vs/nls", "vs/base/common/errors", "vs/base/common/network", "vs/base/common/lifecycle", "vs/workbench/contrib/search/common/replace", "vs/workbench/services/editor/common/editorService", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/workbench/contrib/search/common/searchModel", "vs/editor/common/services/resolverService", "vs/platform/instantiation/common/instantiation", "vs/editor/common/model/textModel", "vs/workbench/services/textfile/common/textfiles", "vs/editor/browser/services/bulkEditService", "vs/editor/common/core/range", "vs/editor/common/core/editOperation", "vs/base/common/arrays"], function (require, exports, nls, errors, network, lifecycle_1, replace_1, editorService_1, modelService_1, modeService_1, searchModel_1, resolverService_1, instantiation_1, textModel_1, textfiles_1, bulkEditService_1, range_1, editOperation_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const REPLACE_PREVIEW = 'replacePreview';
    const toReplaceResource = (fileResource) => {
        return fileResource.with({ scheme: network.Schemas.internal, fragment: REPLACE_PREVIEW, query: JSON.stringify({ scheme: fileResource.scheme }) });
    };
    const toFileResource = (replaceResource) => {
        return replaceResource.with({ scheme: JSON.parse(replaceResource.query)['scheme'], fragment: '', query: '' });
    };
    let ReplacePreviewContentProvider = class ReplacePreviewContentProvider {
        constructor(instantiationService, textModelResolverService) {
            this.instantiationService = instantiationService;
            this.textModelResolverService = textModelResolverService;
            this.textModelResolverService.registerTextModelContentProvider(network.Schemas.internal, this);
        }
        provideTextContent(uri) {
            if (uri.fragment === REPLACE_PREVIEW) {
                return this.instantiationService.createInstance(ReplacePreviewModel).resolve(uri);
            }
            return null;
        }
    };
    ReplacePreviewContentProvider = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, resolverService_1.ITextModelService)
    ], ReplacePreviewContentProvider);
    exports.ReplacePreviewContentProvider = ReplacePreviewContentProvider;
    let ReplacePreviewModel = class ReplacePreviewModel extends lifecycle_1.Disposable {
        constructor(modelService, modeService, textModelResolverService, replaceService, searchWorkbenchService) {
            super();
            this.modelService = modelService;
            this.modeService = modeService;
            this.textModelResolverService = textModelResolverService;
            this.replaceService = replaceService;
            this.searchWorkbenchService = searchWorkbenchService;
        }
        resolve(replacePreviewUri) {
            const fileResource = toFileResource(replacePreviewUri);
            const fileMatch = this.searchWorkbenchService.searchModel.searchResult.matches().filter(match => match.resource.toString() === fileResource.toString())[0];
            return this.textModelResolverService.createModelReference(fileResource).then(ref => {
                ref = this._register(ref);
                const sourceModel = ref.object.textEditorModel;
                const sourceModelModeId = sourceModel.getLanguageIdentifier().language;
                const replacePreviewModel = this.modelService.createModel(textModel_1.createTextBufferFactoryFromSnapshot(sourceModel.createSnapshot()), this.modeService.create(sourceModelModeId), replacePreviewUri);
                this._register(fileMatch.onChange(modelChange => this.update(sourceModel, replacePreviewModel, fileMatch, modelChange)));
                this._register(this.searchWorkbenchService.searchModel.onReplaceTermChanged(() => this.update(sourceModel, replacePreviewModel, fileMatch)));
                this._register(fileMatch.onDispose(() => replacePreviewModel.dispose())); // TODO@Sandeep we should not dispose a model directly but rather the reference (depends on https://github.com/Microsoft/vscode/issues/17073)
                this._register(replacePreviewModel.onWillDispose(() => this.dispose()));
                this._register(sourceModel.onWillDispose(() => this.dispose()));
                return replacePreviewModel;
            });
        }
        update(sourceModel, replacePreviewModel, fileMatch, override = false) {
            if (!sourceModel.isDisposed() && !replacePreviewModel.isDisposed()) {
                this.replaceService.updateReplacePreview(fileMatch, override);
            }
        }
    };
    ReplacePreviewModel = __decorate([
        __param(0, modelService_1.IModelService),
        __param(1, modeService_1.IModeService),
        __param(2, resolverService_1.ITextModelService),
        __param(3, replace_1.IReplaceService),
        __param(4, searchModel_1.ISearchWorkbenchService)
    ], ReplacePreviewModel);
    let ReplaceService = class ReplaceService {
        constructor(textFileService, editorService, textModelResolverService, bulkEditorService) {
            this.textFileService = textFileService;
            this.editorService = editorService;
            this.textModelResolverService = textModelResolverService;
            this.bulkEditorService = bulkEditorService;
        }
        replace(arg, progress = undefined, resource = null) {
            const edits = this.createEdits(arg, resource);
            return this.bulkEditorService.apply({ edits }, { progress }).then(() => this.textFileService.saveAll(edits.map(e => e.resource)));
        }
        openReplacePreview(element, preserveFocus, sideBySide, pinned) {
            const fileMatch = element instanceof searchModel_1.Match ? element.parent() : element;
            return this.editorService.openEditor({
                leftResource: fileMatch.resource,
                rightResource: toReplaceResource(fileMatch.resource),
                label: nls.localize('fileReplaceChanges', "{0} ↔ {1} (Replace Preview)", fileMatch.name(), fileMatch.name()),
                options: {
                    preserveFocus,
                    pinned,
                    revealIfVisible: true
                }
            }).then(editor => {
                const disposable = fileMatch.onDispose(() => {
                    if (editor && editor.input) {
                        editor.input.dispose();
                    }
                    disposable.dispose();
                });
                this.updateReplacePreview(fileMatch).then(() => {
                    if (editor) {
                        const editorControl = editor.getControl();
                        if (element instanceof searchModel_1.Match) {
                            editorControl.revealLineInCenter(element.range().startLineNumber, 1 /* Immediate */);
                        }
                    }
                });
            }, errors.onUnexpectedError);
        }
        updateReplacePreview(fileMatch, override = false) {
            const replacePreviewUri = toReplaceResource(fileMatch.resource);
            return Promise.all([this.textModelResolverService.createModelReference(fileMatch.resource), this.textModelResolverService.createModelReference(replacePreviewUri)])
                .then(([sourceModelRef, replaceModelRef]) => {
                const sourceModel = sourceModelRef.object.textEditorModel;
                const replaceModel = replaceModelRef.object.textEditorModel;
                const returnValue = Promise.resolve(null);
                // If model is disposed do not update
                if (sourceModel && replaceModel) {
                    if (override) {
                        replaceModel.setValue(sourceModel.getValue());
                    }
                    else {
                        replaceModel.undo();
                    }
                    this.applyEditsToPreview(fileMatch, replaceModel);
                }
                return returnValue.then(() => {
                    sourceModelRef.dispose();
                    replaceModelRef.dispose();
                });
            });
        }
        applyEditsToPreview(fileMatch, replaceModel) {
            const resourceEdits = this.createEdits(fileMatch, replaceModel.uri);
            const modelEdits = [];
            for (const resourceEdit of resourceEdits) {
                for (const edit of resourceEdit.edits) {
                    const range = range_1.Range.lift(edit.range);
                    modelEdits.push(editOperation_1.EditOperation.replaceMove(range, edit.text));
                }
            }
            replaceModel.pushEditOperations([], arrays_1.mergeSort(modelEdits, (a, b) => range_1.Range.compareRangesUsingStarts(a.range, b.range)), () => []);
        }
        createEdits(arg, resource = null) {
            const edits = [];
            if (arg instanceof searchModel_1.Match) {
                const match = arg;
                edits.push(this.createEdit(match, match.replaceString, resource));
            }
            if (arg instanceof searchModel_1.FileMatch) {
                arg = [arg];
            }
            if (arg instanceof Array) {
                arg.forEach(element => {
                    const fileMatch = element;
                    if (fileMatch.count() > 0) {
                        edits.push(...fileMatch.matches().map(match => this.createEdit(match, match.replaceString, resource)));
                    }
                });
            }
            return edits;
        }
        createEdit(match, text, resource = null) {
            const fileMatch = match.parent();
            const resourceEdit = {
                resource: resource !== null ? resource : fileMatch.resource,
                edits: [{
                        range: match.range(),
                        text: text
                    }]
            };
            return resourceEdit;
        }
    };
    ReplaceService = __decorate([
        __param(0, textfiles_1.ITextFileService),
        __param(1, editorService_1.IEditorService),
        __param(2, resolverService_1.ITextModelService),
        __param(3, bulkEditService_1.IBulkEditService)
    ], ReplaceService);
    exports.ReplaceService = ReplaceService;
});
//# sourceMappingURL=replaceService.js.map