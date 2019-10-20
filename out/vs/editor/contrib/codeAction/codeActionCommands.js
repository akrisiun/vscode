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
define(["require", "exports", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/bulkEditService", "vs/editor/common/editorContextKeys", "vs/editor/contrib/codeAction/codeActionUi", "vs/editor/contrib/message/messageController", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/markers/common/markers", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "./codeActionModel", "./codeActionTrigger"], function (require, exports, lazy_1, lifecycle_1, strings_1, editorExtensions_1, bulkEditService_1, editorContextKeys_1, codeActionUi_1, messageController_1, nls, commands_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, markers_1, notification_1, progress_1, codeActionModel_1, codeActionTrigger_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function contextKeyForSupportedActions(kind) {
        return contextkey_1.ContextKeyExpr.regex(codeActionModel_1.SUPPORTED_CODE_ACTIONS.keys()[0], new RegExp('(\\s|^)' + strings_1.escapeRegExpCharacters(kind.value) + '\\b'));
    }
    let QuickFixController = class QuickFixController extends lifecycle_1.Disposable {
        constructor(editor, markerService, contextKeyService, progressService, contextMenuService, keybindingService, _commandService, _bulkEditService, _instantiationService) {
            super();
            this._commandService = _commandService;
            this._bulkEditService = _bulkEditService;
            this._instantiationService = _instantiationService;
            this._editor = editor;
            this._model = this._register(new codeActionModel_1.CodeActionModel(this._editor, markerService, contextKeyService, progressService));
            this._register(this._model.onDidChangeState(newState => this.update(newState)));
            this._ui = new lazy_1.Lazy(() => this._register(new codeActionUi_1.CodeActionUi(editor, QuickFixAction.Id, AutoFixAction.Id, {
                applyCodeAction: async (action, retrigger) => {
                    try {
                        await this._applyCodeAction(action);
                    }
                    finally {
                        if (retrigger) {
                            this._trigger({ type: 'auto', filter: {} });
                        }
                    }
                }
            }, contextMenuService, keybindingService)));
        }
        static get(editor) {
            return editor.getContribution(QuickFixController.ID);
        }
        update(newState) {
            this._ui.getValue().update(newState);
        }
        showCodeActions(actions, at) {
            return this._ui.getValue().showCodeActionList(actions, at);
        }
        manualTriggerAtCurrentPosition(notAvailableMessage, filter, autoApply) {
            if (!this._editor.hasModel()) {
                return;
            }
            messageController_1.MessageController.get(this._editor).closeMessage();
            const triggerPosition = this._editor.getPosition();
            this._trigger({ type: 'manual', filter, autoApply, context: { notAvailableMessage, position: triggerPosition } });
        }
        _trigger(trigger) {
            return this._model.trigger(trigger);
        }
        _applyCodeAction(action) {
            return this._instantiationService.invokeFunction(applyCodeAction, action, this._bulkEditService, this._commandService, this._editor);
        }
    };
    QuickFixController.ID = 'editor.contrib.quickFixController';
    QuickFixController = __decorate([
        __param(1, markers_1.IMarkerService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, progress_1.IEditorProgressService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, commands_1.ICommandService),
        __param(7, bulkEditService_1.IBulkEditService),
        __param(8, instantiation_1.IInstantiationService)
    ], QuickFixController);
    exports.QuickFixController = QuickFixController;
    async function applyCodeAction(accessor, action, bulkEditService, commandService, editor) {
        const notificationService = accessor.get(notification_1.INotificationService);
        if (action.edit) {
            await bulkEditService.apply(action.edit, { editor });
        }
        if (action.command) {
            try {
                await commandService.executeCommand(action.command.id, ...(action.command.arguments || []));
            }
            catch (err) {
                const message = asMessage(err);
                notificationService.error(typeof message === 'string'
                    ? message
                    : nls.localize('applyCodeActionFailed', "An unknown error occurred while applying the code action"));
            }
        }
    }
    exports.applyCodeAction = applyCodeAction;
    function asMessage(err) {
        if (typeof err === 'string') {
            return err;
        }
        else if (err instanceof Error && typeof err.message === 'string') {
            return err.message;
        }
        else {
            return undefined;
        }
    }
    function triggerCodeActionsForEditorSelection(editor, notAvailableMessage, filter, autoApply) {
        if (editor.hasModel()) {
            const controller = QuickFixController.get(editor);
            if (controller) {
                controller.manualTriggerAtCurrentPosition(notAvailableMessage, filter, autoApply);
            }
        }
    }
    class QuickFixAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: QuickFixAction.Id,
                label: nls.localize('quickfix.trigger.label', "Quick Fix..."),
                alias: 'Quick Fix...',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasCodeActionsProvider),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* CtrlCmd */ | 84 /* US_DOT */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(_accessor, editor) {
            return triggerCodeActionsForEditorSelection(editor, nls.localize('editor.action.quickFix.noneMessage', "No code actions available"), undefined, undefined);
        }
    }
    exports.QuickFixAction = QuickFixAction;
    QuickFixAction.Id = 'editor.action.quickFix';
    class CodeActionCommandArgs {
        constructor(kind, apply, preferred) {
            this.kind = kind;
            this.apply = apply;
            this.preferred = preferred;
        }
        static fromUser(arg, defaults) {
            if (!arg || typeof arg !== 'object') {
                return new CodeActionCommandArgs(defaults.kind, defaults.apply, false);
            }
            return new CodeActionCommandArgs(CodeActionCommandArgs.getKindFromUser(arg, defaults.kind), CodeActionCommandArgs.getApplyFromUser(arg, defaults.apply), CodeActionCommandArgs.getPreferredUser(arg));
        }
        static getApplyFromUser(arg, defaultAutoApply) {
            switch (typeof arg.apply === 'string' ? arg.apply.toLowerCase() : '') {
                case 'first': return 1 /* First */;
                case 'never': return 2 /* Never */;
                case 'ifsingle': return 0 /* IfSingle */;
                default: return defaultAutoApply;
            }
        }
        static getKindFromUser(arg, defaultKind) {
            return typeof arg.kind === 'string'
                ? new codeActionTrigger_1.CodeActionKind(arg.kind)
                : defaultKind;
        }
        static getPreferredUser(arg) {
            return typeof arg.preferred === 'boolean'
                ? arg.preferred
                : false;
        }
    }
    class CodeActionCommand extends editorExtensions_1.EditorCommand {
        constructor() {
            super({
                id: CodeActionCommand.Id,
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasCodeActionsProvider),
                description: {
                    description: `Trigger a code action`,
                    args: [{
                            name: 'args',
                            schema: {
                                'type': 'object',
                                'required': ['kind'],
                                'properties': {
                                    'kind': {
                                        'type': 'string'
                                    },
                                    'apply': {
                                        'type': 'string',
                                        'default': 'ifSingle',
                                        'enum': ['first', 'ifSingle', 'never']
                                    }
                                }
                            }
                        }]
                }
            });
        }
        runEditorCommand(_accessor, editor, userArg) {
            const args = CodeActionCommandArgs.fromUser(userArg, {
                kind: codeActionTrigger_1.CodeActionKind.Empty,
                apply: 0 /* IfSingle */,
            });
            return triggerCodeActionsForEditorSelection(editor, nls.localize('editor.action.quickFix.noneMessage', "No code actions available"), {
                kind: args.kind,
                includeSourceActions: true,
                onlyIncludePreferredActions: args.preferred,
            }, args.apply);
        }
    }
    exports.CodeActionCommand = CodeActionCommand;
    CodeActionCommand.Id = 'editor.action.codeAction';
    class RefactorAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: RefactorAction.Id,
                label: nls.localize('refactor.label', "Refactor..."),
                alias: 'Refactor...',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasCodeActionsProvider),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 48 /* KEY_R */,
                    mac: {
                        primary: 256 /* WinCtrl */ | 1024 /* Shift */ | 48 /* KEY_R */
                    },
                    weight: 100 /* EditorContrib */
                },
                menuOpts: {
                    group: '1_modification',
                    order: 2,
                    when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, contextKeyForSupportedActions(codeActionTrigger_1.CodeActionKind.Refactor)),
                },
                description: {
                    description: 'Refactor...',
                    args: [{
                            name: 'args',
                            schema: {
                                'type': 'object',
                                'properties': {
                                    'kind': {
                                        'type': 'string'
                                    },
                                    'apply': {
                                        'type': 'string',
                                        'default': 'never',
                                        'enum': ['first', 'ifSingle', 'never']
                                    }
                                }
                            }
                        }]
                }
            });
        }
        run(_accessor, editor, userArg) {
            const args = CodeActionCommandArgs.fromUser(userArg, {
                kind: codeActionTrigger_1.CodeActionKind.Refactor,
                apply: 2 /* Never */
            });
            return triggerCodeActionsForEditorSelection(editor, nls.localize('editor.action.refactor.noneMessage', "No refactorings available"), {
                kind: codeActionTrigger_1.CodeActionKind.Refactor.contains(args.kind) ? args.kind : codeActionTrigger_1.CodeActionKind.Empty,
                onlyIncludePreferredActions: args.preferred,
            }, args.apply);
        }
    }
    exports.RefactorAction = RefactorAction;
    RefactorAction.Id = 'editor.action.refactor';
    class SourceAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: SourceAction.Id,
                label: nls.localize('source.label', "Source Action..."),
                alias: 'Source Action...',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasCodeActionsProvider),
                menuOpts: {
                    group: '1_modification',
                    order: 2.1,
                    when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, contextKeyForSupportedActions(codeActionTrigger_1.CodeActionKind.Source)),
                },
                description: {
                    description: 'Source Action...',
                    args: [{
                            name: 'args',
                            schema: {
                                'type': 'object',
                                'properties': {
                                    'kind': {
                                        'type': 'string'
                                    },
                                    'apply': {
                                        'type': 'string',
                                        'default': 'never',
                                        'enum': ['first', 'ifSingle', 'never']
                                    }
                                }
                            }
                        }]
                }
            });
        }
        run(_accessor, editor, userArg) {
            const args = CodeActionCommandArgs.fromUser(userArg, {
                kind: codeActionTrigger_1.CodeActionKind.Source,
                apply: 2 /* Never */
            });
            return triggerCodeActionsForEditorSelection(editor, nls.localize('editor.action.source.noneMessage', "No source actions available"), {
                kind: codeActionTrigger_1.CodeActionKind.Source.contains(args.kind) ? args.kind : codeActionTrigger_1.CodeActionKind.Empty,
                includeSourceActions: true,
                onlyIncludePreferredActions: args.preferred,
            }, args.apply);
        }
    }
    exports.SourceAction = SourceAction;
    SourceAction.Id = 'editor.action.sourceAction';
    class OrganizeImportsAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: OrganizeImportsAction.Id,
                label: nls.localize('organizeImports.label', "Organize Imports"),
                alias: 'Organize Imports',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, contextKeyForSupportedActions(codeActionTrigger_1.CodeActionKind.SourceOrganizeImports)),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 1024 /* Shift */ | 512 /* Alt */ | 45 /* KEY_O */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(_accessor, editor) {
            return triggerCodeActionsForEditorSelection(editor, nls.localize('editor.action.organize.noneMessage', "No organize imports action available"), { kind: codeActionTrigger_1.CodeActionKind.SourceOrganizeImports, includeSourceActions: true }, 0 /* IfSingle */);
        }
    }
    exports.OrganizeImportsAction = OrganizeImportsAction;
    OrganizeImportsAction.Id = 'editor.action.organizeImports';
    class FixAllAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: FixAllAction.Id,
                label: nls.localize('fixAll.label', "Fix All"),
                alias: 'Fix All',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, contextKeyForSupportedActions(codeActionTrigger_1.CodeActionKind.SourceFixAll))
            });
        }
        run(_accessor, editor) {
            return triggerCodeActionsForEditorSelection(editor, nls.localize('fixAll.noneMessage', "No fix all action available"), { kind: codeActionTrigger_1.CodeActionKind.SourceFixAll, includeSourceActions: true }, 0 /* IfSingle */);
        }
    }
    exports.FixAllAction = FixAllAction;
    FixAllAction.Id = 'editor.action.fixAll';
    class AutoFixAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: AutoFixAction.Id,
                label: nls.localize('autoFix.label', "Auto Fix..."),
                alias: 'Auto Fix...',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, contextKeyForSupportedActions(codeActionTrigger_1.CodeActionKind.QuickFix)),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 512 /* Alt */ | 1024 /* Shift */ | 84 /* US_DOT */,
                    mac: {
                        primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 84 /* US_DOT */
                    },
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(_accessor, editor) {
            return triggerCodeActionsForEditorSelection(editor, nls.localize('editor.action.autoFix.noneMessage', "No auto fixes available"), {
                kind: codeActionTrigger_1.CodeActionKind.QuickFix,
                onlyIncludePreferredActions: true
            }, 0 /* IfSingle */);
        }
    }
    exports.AutoFixAction = AutoFixAction;
    AutoFixAction.Id = 'editor.action.autoFix';
});
//# sourceMappingURL=codeActionCommands.js.map