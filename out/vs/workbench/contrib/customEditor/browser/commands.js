/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/workbench/contrib/customEditor/browser/customEditorInput", "vs/workbench/contrib/customEditor/common/customEditor", "vs/workbench/services/editor/common/editorService"], function (require, exports, editorExtensions_1, contextkey_1, contextkeys_1, customEditorInput_1, customEditor_1, editorService_1) {
    "use strict";
    var _a, _b;
    Object.defineProperty(exports, "__esModule", { value: true });
    (new (_a = class UndoCustomEditorCommand extends editorExtensions_1.Command {
            constructor() {
                super({
                    id: UndoCustomEditorCommand.ID,
                    precondition: contextkey_1.ContextKeyExpr.and(customEditor_1.CONTEXT_FOCUSED_CUSTOM_EDITOR_IS_EDITABLE, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    kbOpts: {
                        primary: 2048 /* CtrlCmd */ | 56 /* KEY_Z */,
                        weight: 100 /* EditorContrib */
                    }
                });
            }
            runCommand(accessor) {
                var _a;
                const editorService = accessor.get(editorService_1.IEditorService);
                const activeInput = (_a = editorService.activeEditorPane) === null || _a === void 0 ? void 0 : _a.input;
                if (activeInput instanceof customEditorInput_1.CustomEditorInput) {
                    activeInput.undo();
                }
            }
        },
        _a.ID = 'editor.action.customEditor.undo',
        _a)).register();
    (new (_b = class RedoWebviewEditorCommand extends editorExtensions_1.Command {
            constructor() {
                super({
                    id: RedoWebviewEditorCommand.ID,
                    precondition: contextkey_1.ContextKeyExpr.and(customEditor_1.CONTEXT_FOCUSED_CUSTOM_EDITOR_IS_EDITABLE, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    kbOpts: {
                        primary: 2048 /* CtrlCmd */ | 55 /* KEY_Y */,
                        secondary: [2048 /* CtrlCmd */ | 1024 /* Shift */ | 56 /* KEY_Z */],
                        mac: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 56 /* KEY_Z */ },
                        weight: 100 /* EditorContrib */
                    }
                });
            }
            runCommand(accessor) {
                var _a;
                const editorService = accessor.get(editorService_1.IEditorService);
                const activeInput = (_a = editorService.activeEditorPane) === null || _a === void 0 ? void 0 : _a.input;
                if (activeInput instanceof customEditorInput_1.CustomEditorInput) {
                    activeInput.redo();
                }
            }
        },
        _b.ID = 'editor.action.customEditor.redo',
        _b)).register();
});
//# sourceMappingURL=commands.js.map