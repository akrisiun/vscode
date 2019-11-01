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
define(["require", "exports", "vs/nls", "vs/base/common/errors", "vs/platform/contextkey/common/contextkey", "vs/platform/progress/common/progress", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "./renameInputField", "vs/platform/theme/common/themeService", "vs/editor/common/modes", "vs/editor/common/core/position", "vs/base/browser/ui/aria/aria", "vs/editor/common/core/range", "vs/editor/contrib/message/messageController", "vs/editor/browser/core/editorState", "vs/platform/notification/common/notification", "vs/editor/browser/services/bulkEditService", "vs/base/common/uri", "vs/editor/browser/services/codeEditorService", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/async", "vs/base/common/types"], function (require, exports, nls, errors_1, contextkey_1, progress_1, editorExtensions_1, editorContextKeys_1, renameInputField_1, themeService_1, modes_1, position_1, aria_1, range_1, messageController_1, editorState_1, notification_1, bulkEditService_1, uri_1, codeEditorService_1, cancellation_1, lifecycle_1, async_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RenameSkeleton {
        constructor(model, position) {
            this.model = model;
            this.position = position;
            this._providers = modes_1.RenameProviderRegistry.ordered(model);
        }
        hasProvider() {
            return this._providers.length > 0;
        }
        async resolveRenameLocation(token) {
            const firstProvider = this._providers[0];
            if (!firstProvider) {
                return undefined;
            }
            let res;
            if (firstProvider.resolveRenameLocation) {
                res = types_1.withNullAsUndefined(await firstProvider.resolveRenameLocation(this.model, this.position, token));
            }
            if (!res) {
                const word = this.model.getWordAtPosition(this.position);
                if (word) {
                    return {
                        range: new range_1.Range(this.position.lineNumber, word.startColumn, this.position.lineNumber, word.endColumn),
                        text: word.word
                    };
                }
            }
            return res;
        }
        async provideRenameEdits(newName, i, rejects, token) {
            const provider = this._providers[i];
            if (!provider) {
                return {
                    edits: [],
                    rejectReason: rejects.join('\n')
                };
            }
            const result = await provider.provideRenameEdits(this.model, this.position, newName, token);
            if (!result) {
                return this.provideRenameEdits(newName, i + 1, rejects.concat(nls.localize('no result', "No result.")), token);
            }
            else if (result.rejectReason) {
                return this.provideRenameEdits(newName, i + 1, rejects.concat(result.rejectReason), token);
            }
            return result;
        }
    }
    async function rename(model, position, newName) {
        return new RenameSkeleton(model, position).provideRenameEdits(newName, 0, [], cancellation_1.CancellationToken.None);
    }
    exports.rename = rename;
    // ---  register actions and commands
    let RenameController = class RenameController extends lifecycle_1.Disposable {
        constructor(editor, _notificationService, _bulkEditService, _progressService, _contextKeyService, _themeService) {
            super();
            this.editor = editor;
            this._notificationService = _notificationService;
            this._bulkEditService = _bulkEditService;
            this._progressService = _progressService;
            this._contextKeyService = _contextKeyService;
            this._themeService = _themeService;
            this._renameOperationIdPool = 1;
            this._register(this.editor.onDidChangeModel(() => this.onModelChanged()));
            this._register(this.editor.onDidChangeModelLanguage(() => this.onModelChanged()));
            this._register(this.editor.onDidChangeCursorSelection(() => this.onModelChanged()));
        }
        static get(editor) {
            return editor.getContribution(RenameController.ID);
        }
        get renameInputField() {
            if (!this._renameInputField) {
                this._renameInputField = this._register(new renameInputField_1.RenameInputField(this.editor, this._themeService, this._contextKeyService));
            }
            return this._renameInputField;
        }
        getId() {
            return RenameController.ID;
        }
        async run() {
            if (this._activeRename) {
                this._activeRename.operation.cancel();
            }
            const id = this._renameOperationIdPool++;
            this._activeRename = {
                id,
                operation: async_1.createCancelablePromise(token => this.doRename(token, id))
            };
            return this._activeRename.operation;
        }
        async doRename(token, id) {
            if (!this.editor.hasModel()) {
                return undefined;
            }
            const position = this.editor.getPosition();
            const skeleton = new RenameSkeleton(this.editor.getModel(), position);
            if (!skeleton.hasProvider()) {
                return undefined;
            }
            let loc;
            try {
                const resolveLocationOperation = skeleton.resolveRenameLocation(token);
                this._progressService.showWhile(resolveLocationOperation, 250);
                loc = await resolveLocationOperation;
            }
            catch (e) {
                messageController_1.MessageController.get(this.editor).showMessage(e || nls.localize('resolveRenameLocationFailed', "An unknown error occurred while resolving rename location"), position);
                return undefined;
            }
            if (!loc) {
                return undefined;
            }
            if (loc.rejectReason) {
                messageController_1.MessageController.get(this.editor).showMessage(loc.rejectReason, position);
                return undefined;
            }
            if (!this._activeRename || this._activeRename.id !== id) {
                return undefined;
            }
            let selection = this.editor.getSelection();
            let selectionStart = 0;
            let selectionEnd = loc.text.length;
            if (!range_1.Range.isEmpty(selection) && !range_1.Range.spansMultipleLines(selection) && range_1.Range.containsRange(loc.range, selection)) {
                selectionStart = Math.max(0, selection.startColumn - loc.range.startColumn);
                selectionEnd = Math.min(loc.range.endColumn, selection.endColumn) - loc.range.startColumn;
            }
            return this.renameInputField.getInput(loc.range, loc.text, selectionStart, selectionEnd).then(newNameOrFocusFlag => {
                if (typeof newNameOrFocusFlag === 'boolean') {
                    if (newNameOrFocusFlag) {
                        this.editor.focus();
                    }
                    return undefined;
                }
                this.editor.focus();
                const state = new editorState_1.EditorState(this.editor, 4 /* Position */ | 1 /* Value */ | 2 /* Selection */ | 8 /* Scroll */);
                const renameOperation = Promise.resolve(skeleton.provideRenameEdits(newNameOrFocusFlag, 0, [], token).then(result => {
                    if (!this.editor.hasModel()) {
                        return undefined;
                    }
                    if (result.rejectReason) {
                        if (state.validate(this.editor)) {
                            messageController_1.MessageController.get(this.editor).showMessage(result.rejectReason, this.editor.getPosition());
                        }
                        else {
                            this._notificationService.info(result.rejectReason);
                        }
                        return undefined;
                    }
                    return this._bulkEditService.apply(result, { editor: this.editor }).then(result => {
                        // alert
                        if (result.ariaSummary) {
                            aria_1.alert(nls.localize('aria', "Successfully renamed '{0}' to '{1}'. Summary: {2}", loc.text, newNameOrFocusFlag, result.ariaSummary));
                        }
                    });
                }, err => {
                    this._notificationService.error(nls.localize('rename.failed', "Rename failed to execute."));
                    return Promise.reject(err);
                }));
                this._progressService.showWhile(renameOperation, 250);
                return renameOperation;
            });
        }
        acceptRenameInput() {
            if (this._renameInputField) {
                this._renameInputField.acceptInput();
            }
        }
        cancelRenameInput() {
            if (this._renameInputField) {
                this._renameInputField.cancelInput(true);
            }
        }
        onModelChanged() {
            if (this._activeRename) {
                this._activeRename.operation.cancel();
                this._activeRename = undefined;
                this.cancelRenameInput();
            }
        }
    };
    RenameController.ID = 'editor.contrib.renameController';
    RenameController = __decorate([
        __param(1, notification_1.INotificationService),
        __param(2, bulkEditService_1.IBulkEditService),
        __param(3, progress_1.IEditorProgressService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, themeService_1.IThemeService)
    ], RenameController);
    // ---- action implementation
    class RenameAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.rename',
                label: nls.localize('rename.label', "Rename Symbol"),
                alias: 'Rename Symbol',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasRenameProvider),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 60 /* F2 */,
                    weight: 100 /* EditorContrib */
                },
                menuOpts: {
                    group: '1_modification',
                    order: 1.1
                }
            });
        }
        runCommand(accessor, args) {
            const editorService = accessor.get(codeEditorService_1.ICodeEditorService);
            const [uri, pos] = Array.isArray(args) && args || [undefined, undefined];
            if (uri_1.URI.isUri(uri) && position_1.Position.isIPosition(pos)) {
                return editorService.openCodeEditor({ resource: uri }, editorService.getActiveCodeEditor()).then(editor => {
                    if (!editor) {
                        return;
                    }
                    editor.setPosition(pos);
                    editor.invokeWithinContext(accessor => {
                        this.reportTelemetry(accessor, editor);
                        return this.run(accessor, editor);
                    });
                }, errors_1.onUnexpectedError);
            }
            return super.runCommand(accessor, args);
        }
        run(accessor, editor) {
            const controller = RenameController.get(editor);
            if (controller) {
                return controller.run();
            }
            return Promise.resolve();
        }
    }
    exports.RenameAction = RenameAction;
    editorExtensions_1.registerEditorContribution(RenameController);
    editorExtensions_1.registerEditorAction(RenameAction);
    const RenameCommand = editorExtensions_1.EditorCommand.bindToContribution(RenameController.get);
    editorExtensions_1.registerEditorCommand(new RenameCommand({
        id: 'acceptRenameInput',
        precondition: renameInputField_1.CONTEXT_RENAME_INPUT_VISIBLE,
        handler: x => x.acceptRenameInput(),
        kbOpts: {
            weight: 100 /* EditorContrib */ + 99,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 3 /* Enter */
        }
    }));
    editorExtensions_1.registerEditorCommand(new RenameCommand({
        id: 'cancelRenameInput',
        precondition: renameInputField_1.CONTEXT_RENAME_INPUT_VISIBLE,
        handler: x => x.cancelRenameInput(),
        kbOpts: {
            weight: 100 /* EditorContrib */ + 99,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 9 /* Escape */,
            secondary: [1024 /* Shift */ | 9 /* Escape */]
        }
    }));
    // ---- api bridge command
    editorExtensions_1.registerDefaultLanguageCommand('_executeDocumentRenameProvider', function (model, position, args) {
        let { newName } = args;
        if (typeof newName !== 'string') {
            throw errors_1.illegalArgument('newName');
        }
        return rename(model, position, newName);
    });
});
//# sourceMappingURL=rename.js.map