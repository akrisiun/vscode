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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/strings", "vs/editor/browser/services/bulkEditService", "vs/editor/browser/services/codeEditorService", "vs/editor/common/commands/trimTrailingWhitespaceCommand", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/services/modelService", "vs/editor/contrib/codeAction/codeAction", "vs/editor/contrib/codeAction/codeActionCommands", "vs/editor/contrib/codeAction/codeActionTrigger", "vs/editor/contrib/format/format", "vs/editor/contrib/snippet/snippetController2", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/progress/common/progress", "vs/workbench/api/common/extHostCustomers", "vs/workbench/services/textfile/common/textFileEditorModel", "../common/extHost.protocol"], function (require, exports, async_1, cancellation_1, strings, bulkEditService_1, codeEditorService_1, trimTrailingWhitespaceCommand_1, editOperation_1, position_1, range_1, modelService_1, codeAction_1, codeActionCommands_1, codeActionTrigger_1, format_1, snippetController2_1, nls_1, commands_1, configuration_1, instantiation_1, log_1, progress_1, extHostCustomers_1, textFileEditorModel_1, extHost_protocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TrimWhitespaceParticipant = class TrimWhitespaceParticipant {
        constructor(configurationService, codeEditorService) {
            this.configurationService = configurationService;
            this.codeEditorService = codeEditorService;
            // Nothing
        }
        async participate(model, env) {
            if (this.configurationService.getValue('files.trimTrailingWhitespace', { overrideIdentifier: model.textEditorModel.getLanguageIdentifier().language, resource: model.getResource() })) {
                this.doTrimTrailingWhitespace(model.textEditorModel, env.reason === 2 /* AUTO */);
            }
        }
        doTrimTrailingWhitespace(model, isAutoSaved) {
            let prevSelection = [];
            let cursors = [];
            const editor = findEditor(model, this.codeEditorService);
            if (editor) {
                // Find `prevSelection` in any case do ensure a good undo stack when pushing the edit
                // Collect active cursors in `cursors` only if `isAutoSaved` to avoid having the cursors jump
                prevSelection = editor.getSelections();
                if (isAutoSaved) {
                    cursors = prevSelection.map(s => s.getPosition());
                    const snippetsRange = snippetController2_1.SnippetController2.get(editor).getSessionEnclosingRange();
                    if (snippetsRange) {
                        for (let lineNumber = snippetsRange.startLineNumber; lineNumber <= snippetsRange.endLineNumber; lineNumber++) {
                            cursors.push(new position_1.Position(lineNumber, model.getLineMaxColumn(lineNumber)));
                        }
                    }
                }
            }
            const ops = trimTrailingWhitespaceCommand_1.trimTrailingWhitespace(model, cursors);
            if (!ops.length) {
                return; // Nothing to do
            }
            model.pushEditOperations(prevSelection, ops, (edits) => prevSelection);
        }
    };
    TrimWhitespaceParticipant = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, codeEditorService_1.ICodeEditorService)
    ], TrimWhitespaceParticipant);
    function findEditor(model, codeEditorService) {
        let candidate = null;
        if (model.isAttachedToEditor()) {
            for (const editor of codeEditorService.listCodeEditors()) {
                if (editor.hasModel() && editor.getModel() === model) {
                    if (editor.hasTextFocus()) {
                        return editor; // favour focused editor if there are multiple
                    }
                    candidate = editor;
                }
            }
        }
        return candidate;
    }
    let FinalNewLineParticipant = class FinalNewLineParticipant {
        constructor(configurationService, codeEditorService) {
            this.configurationService = configurationService;
            this.codeEditorService = codeEditorService;
            // Nothing
        }
        async participate(model, env) {
            if (this.configurationService.getValue('files.insertFinalNewline', { overrideIdentifier: model.textEditorModel.getLanguageIdentifier().language, resource: model.getResource() })) {
                this.doInsertFinalNewLine(model.textEditorModel);
            }
        }
        doInsertFinalNewLine(model) {
            const lineCount = model.getLineCount();
            const lastLine = model.getLineContent(lineCount);
            const lastLineIsEmptyOrWhitespace = strings.lastNonWhitespaceIndex(lastLine) === -1;
            if (!lineCount || lastLineIsEmptyOrWhitespace) {
                return;
            }
            const edits = [editOperation_1.EditOperation.insert(new position_1.Position(lineCount, model.getLineMaxColumn(lineCount)), model.getEOL())];
            const editor = findEditor(model, this.codeEditorService);
            if (editor) {
                editor.executeEdits('insertFinalNewLine', edits, editor.getSelections());
            }
            else {
                model.pushEditOperations([], edits, () => null);
            }
        }
    };
    FinalNewLineParticipant = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, codeEditorService_1.ICodeEditorService)
    ], FinalNewLineParticipant);
    exports.FinalNewLineParticipant = FinalNewLineParticipant;
    let TrimFinalNewLinesParticipant = class TrimFinalNewLinesParticipant {
        constructor(configurationService, codeEditorService) {
            this.configurationService = configurationService;
            this.codeEditorService = codeEditorService;
            // Nothing
        }
        async participate(model, env) {
            if (this.configurationService.getValue('files.trimFinalNewlines', { overrideIdentifier: model.textEditorModel.getLanguageIdentifier().language, resource: model.getResource() })) {
                this.doTrimFinalNewLines(model.textEditorModel, env.reason === 2 /* AUTO */);
            }
        }
        /**
         * returns 0 if the entire file is empty or whitespace only
         */
        findLastLineWithContent(model) {
            for (let lineNumber = model.getLineCount(); lineNumber >= 1; lineNumber--) {
                const lineContent = model.getLineContent(lineNumber);
                if (strings.lastNonWhitespaceIndex(lineContent) !== -1) {
                    // this line has content
                    return lineNumber;
                }
            }
            // no line has content
            return 0;
        }
        doTrimFinalNewLines(model, isAutoSaved) {
            const lineCount = model.getLineCount();
            // Do not insert new line if file does not end with new line
            if (lineCount === 1) {
                return;
            }
            let prevSelection = [];
            let cannotTouchLineNumber = 0;
            const editor = findEditor(model, this.codeEditorService);
            if (editor) {
                prevSelection = editor.getSelections();
                if (isAutoSaved) {
                    for (let i = 0, len = prevSelection.length; i < len; i++) {
                        const positionLineNumber = prevSelection[i].positionLineNumber;
                        if (positionLineNumber > cannotTouchLineNumber) {
                            cannotTouchLineNumber = positionLineNumber;
                        }
                    }
                }
            }
            const lastLineNumberWithContent = this.findLastLineWithContent(model);
            const deleteFromLineNumber = Math.max(lastLineNumberWithContent + 1, cannotTouchLineNumber + 1);
            const deletionRange = model.validateRange(new range_1.Range(deleteFromLineNumber, 1, lineCount, model.getLineMaxColumn(lineCount)));
            if (deletionRange.isEmpty()) {
                return;
            }
            model.pushEditOperations(prevSelection, [editOperation_1.EditOperation.delete(deletionRange)], edits => prevSelection);
            if (editor) {
                editor.setSelections(prevSelection);
            }
        }
    };
    TrimFinalNewLinesParticipant = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, codeEditorService_1.ICodeEditorService)
    ], TrimFinalNewLinesParticipant);
    exports.TrimFinalNewLinesParticipant = TrimFinalNewLinesParticipant;
    let FormatOnSaveParticipant = class FormatOnSaveParticipant {
        constructor(_configurationService, _codeEditorService, _instantiationService) {
            this._configurationService = _configurationService;
            this._codeEditorService = _codeEditorService;
            this._instantiationService = _instantiationService;
            // Nothing
        }
        async participate(editorModel, env) {
            const model = editorModel.textEditorModel;
            const overrides = { overrideIdentifier: model.getLanguageIdentifier().language, resource: model.uri };
            if (env.reason === 2 /* AUTO */ || !this._configurationService.getValue('editor.formatOnSave', overrides)) {
                return undefined;
            }
            return new Promise((resolve, reject) => {
                const source = new cancellation_1.CancellationTokenSource();
                const editorOrModel = findEditor(model, this._codeEditorService) || model;
                const timeout = this._configurationService.getValue('editor.formatOnSaveTimeout', overrides);
                const request = this._instantiationService.invokeFunction(format_1.formatDocumentWithSelectedProvider, editorOrModel, 2 /* Silent */, source.token);
                setTimeout(() => {
                    reject(nls_1.localize('timeout.formatOnSave', "Aborted format on save after {0}ms", timeout));
                    source.cancel();
                }, timeout);
                request.then(resolve, reject);
            });
        }
    };
    FormatOnSaveParticipant = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, codeEditorService_1.ICodeEditorService),
        __param(2, instantiation_1.IInstantiationService)
    ], FormatOnSaveParticipant);
    let CodeActionOnSaveParticipant = class CodeActionOnSaveParticipant {
        constructor(_bulkEditService, _commandService, _configurationService, _instantiationService) {
            this._bulkEditService = _bulkEditService;
            this._commandService = _commandService;
            this._configurationService = _configurationService;
            this._instantiationService = _instantiationService;
        }
        async participate(editorModel, env) {
            if (env.reason === 2 /* AUTO */) {
                return undefined;
            }
            const model = editorModel.textEditorModel;
            const settingsOverrides = { overrideIdentifier: model.getLanguageIdentifier().language, resource: editorModel.getResource() };
            const setting = this._configurationService.getValue('editor.codeActionsOnSave', settingsOverrides);
            if (!setting) {
                return undefined;
            }
            const codeActionsOnSave = Object.keys(setting)
                .filter(x => setting[x]).map(x => new codeActionTrigger_1.CodeActionKind(x))
                .sort((a, b) => {
                if (codeActionTrigger_1.CodeActionKind.SourceFixAll.contains(a)) {
                    if (codeActionTrigger_1.CodeActionKind.SourceFixAll.contains(b)) {
                        return 0;
                    }
                    return -1;
                }
                if (codeActionTrigger_1.CodeActionKind.SourceFixAll.contains(b)) {
                    return 1;
                }
                return 0;
            });
            if (!codeActionsOnSave.length) {
                return undefined;
            }
            const tokenSource = new cancellation_1.CancellationTokenSource();
            const timeout = this._configurationService.getValue('editor.codeActionsOnSaveTimeout', settingsOverrides);
            return Promise.race([
                new Promise((_resolve, reject) => setTimeout(() => {
                    tokenSource.cancel();
                    reject(nls_1.localize('codeActionsOnSave.didTimeout', "Aborted codeActionsOnSave after {0}ms", timeout));
                }, timeout)),
                this.applyOnSaveActions(model, codeActionsOnSave, tokenSource.token)
            ]).finally(() => {
                tokenSource.cancel();
            });
        }
        async applyOnSaveActions(model, codeActionsOnSave, token) {
            for (const codeActionKind of codeActionsOnSave) {
                const actionsToRun = await this.getActionsToRun(model, codeActionKind, token);
                try {
                    await this.applyCodeActions(actionsToRun.actions);
                }
                catch (_a) {
                    // Failure to apply a code action should not block other on save actions
                }
                finally {
                    actionsToRun.dispose();
                }
            }
        }
        async applyCodeActions(actionsToRun) {
            for (const action of actionsToRun) {
                await this._instantiationService.invokeFunction(codeActionCommands_1.applyCodeAction, action, this._bulkEditService, this._commandService);
            }
        }
        getActionsToRun(model, codeActionKind, token) {
            return codeAction_1.getCodeActions(model, model.getFullModelRange(), {
                type: 'auto',
                filter: { kind: codeActionKind, includeSourceActions: true },
            }, token);
        }
    };
    CodeActionOnSaveParticipant = __decorate([
        __param(0, bulkEditService_1.IBulkEditService),
        __param(1, commands_1.ICommandService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, instantiation_1.IInstantiationService)
    ], CodeActionOnSaveParticipant);
    class ExtHostSaveParticipant {
        constructor(extHostContext) {
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostDocumentSaveParticipant);
        }
        async participate(editorModel, env) {
            if (!modelService_1.shouldSynchronizeModel(editorModel.textEditorModel)) {
                // the model never made it to the extension
                // host meaning we cannot participate in its save
                return undefined;
            }
            return new Promise((resolve, reject) => {
                setTimeout(() => reject(nls_1.localize('timeout.onWillSave', "Aborted onWillSaveTextDocument-event after 1750ms")), 1750);
                this._proxy.$participateInSave(editorModel.getResource(), env.reason).then(values => {
                    if (!values.every(success => success)) {
                        return Promise.reject(new Error('listener failed'));
                    }
                    return undefined;
                }).then(resolve, reject);
            });
        }
    }
    // The save participant can change a model before its saved to support various scenarios like trimming trailing whitespace
    let SaveParticipant = class SaveParticipant {
        constructor(extHostContext, instantiationService, _progressService, _logService) {
            this._progressService = _progressService;
            this._logService = _logService;
            this._saveParticipants = new async_1.IdleValue(() => [
                instantiationService.createInstance(TrimWhitespaceParticipant),
                instantiationService.createInstance(CodeActionOnSaveParticipant),
                instantiationService.createInstance(FormatOnSaveParticipant),
                instantiationService.createInstance(FinalNewLineParticipant),
                instantiationService.createInstance(TrimFinalNewLinesParticipant),
                instantiationService.createInstance(ExtHostSaveParticipant, extHostContext),
            ]);
            // Hook into model
            textFileEditorModel_1.TextFileEditorModel.setSaveParticipant(this);
        }
        dispose() {
            textFileEditorModel_1.TextFileEditorModel.setSaveParticipant(null);
            this._saveParticipants.dispose();
        }
        async participate(model, env) {
            return this._progressService.withProgress({ location: 10 /* Window */ }, progress => {
                progress.report({ message: nls_1.localize('saveParticipants', "Running Save Participants...") });
                const promiseFactory = this._saveParticipants.getValue().map(p => () => {
                    return p.participate(model, env);
                });
                return async_1.sequence(promiseFactory).then(() => { }, err => this._logService.warn(err));
            });
        }
    };
    SaveParticipant = __decorate([
        extHostCustomers_1.extHostCustomer,
        __param(1, instantiation_1.IInstantiationService),
        __param(2, progress_1.IProgressService),
        __param(3, log_1.ILogService)
    ], SaveParticipant);
    exports.SaveParticipant = SaveParticipant;
});
//# sourceMappingURL=mainThreadSaveParticipant.js.map