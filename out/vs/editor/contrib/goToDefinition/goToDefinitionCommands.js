/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/aria/aria", "vs/base/common/async", "vs/base/common/keyCodes", "vs/base/common/platform", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/modes", "vs/editor/contrib/message/messageController", "vs/editor/contrib/referenceSearch/peekViewWidget", "vs/editor/contrib/referenceSearch/referencesController", "vs/editor/contrib/referenceSearch/referencesModel", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "./goToDefinition", "vs/platform/commands/common/commands", "vs/editor/browser/core/editorState", "vs/editor/contrib/goToDefinition/goToDefinitionResultsNavigation"], function (require, exports, aria_1, async_1, keyCodes_1, platform, editorExtensions_1, codeEditorService_1, range_1, editorContextKeys_1, modes_1, messageController_1, peekViewWidget_1, referencesController_1, referencesModel_1, nls, actions_1, contextkey_1, notification_1, progress_1, goToDefinition_1, commands_1, editorState_1, goToDefinitionResultsNavigation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DefinitionActionConfig {
        constructor(openToSide = false, openInPeek = false, filterCurrent = true, showMessage = true) {
            this.openToSide = openToSide;
            this.openInPeek = openInPeek;
            this.filterCurrent = filterCurrent;
            this.showMessage = showMessage;
            //
        }
    }
    exports.DefinitionActionConfig = DefinitionActionConfig;
    class DefinitionAction extends editorExtensions_1.EditorAction {
        constructor(configuration, opts) {
            super(opts);
            this._configuration = configuration;
        }
        run(accessor, editor) {
            if (!editor.hasModel()) {
                return Promise.resolve(undefined);
            }
            const notificationService = accessor.get(notification_1.INotificationService);
            const editorService = accessor.get(codeEditorService_1.ICodeEditorService);
            const progressService = accessor.get(progress_1.IEditorProgressService);
            const symbolNavService = accessor.get(goToDefinitionResultsNavigation_1.ISymbolNavigationService);
            const model = editor.getModel();
            const pos = editor.getPosition();
            const cts = new editorState_1.EditorStateCancellationTokenSource(editor, 1 /* Value */ | 4 /* Position */);
            const definitionPromise = async_1.raceCancellation(this._getTargetLocationForPosition(model, pos, cts.token), cts.token).then(async (references) => {
                if (!references || model.isDisposed()) {
                    // new model, no more model
                    return;
                }
                // * remove falsy references
                // * find reference at the current pos
                let idxOfCurrent = -1;
                const result = [];
                for (const reference of references) {
                    if (!reference || !reference.range) {
                        continue;
                    }
                    const newLen = result.push(reference);
                    if (this._configuration.filterCurrent
                        && reference.uri.toString() === model.uri.toString()
                        && range_1.Range.containsPosition(reference.range, pos)
                        && idxOfCurrent === -1) {
                        idxOfCurrent = newLen - 1;
                    }
                }
                if (result.length === 0) {
                    // no result -> show message
                    if (this._configuration.showMessage) {
                        const info = model.getWordAtPosition(pos);
                        messageController_1.MessageController.get(editor).showMessage(this._getNoResultFoundMessage(info), pos);
                    }
                }
                else if (result.length === 1 && idxOfCurrent !== -1) {
                    // only the position at which we are -> adjust selection
                    let [current] = result;
                    return this._openReference(editor, editorService, current, false).then(() => undefined);
                }
                else {
                    // handle multile results
                    return this._onResult(editorService, symbolNavService, editor, new referencesModel_1.ReferencesModel(result));
                }
            }, (err) => {
                // report an error
                notificationService.error(err);
            }).finally(() => {
                cts.dispose();
            });
            progressService.showWhile(definitionPromise, 250);
            return definitionPromise;
        }
        _getTargetLocationForPosition(model, position, token) {
            return goToDefinition_1.getDefinitionsAtPosition(model, position, token);
        }
        _getNoResultFoundMessage(info) {
            return info && info.word
                ? nls.localize('noResultWord', "No definition found for '{0}'", info.word)
                : nls.localize('generic.noResults', "No definition found");
        }
        _getMetaTitle(model) {
            return model.references.length > 1 ? nls.localize('meta.title', " – {0} definitions", model.references.length) : '';
        }
        async _onResult(editorService, symbolNavService, editor, model) {
            const msg = model.getAriaMessage();
            aria_1.alert(msg);
            const gotoLocation = editor.getOption(37 /* gotoLocation */);
            if (this._configuration.openInPeek || (gotoLocation.multiple === 'peek' && model.references.length > 1)) {
                this._openInPeek(editorService, editor, model);
            }
            else if (editor.hasModel()) {
                const next = model.firstReference();
                if (!next) {
                    return;
                }
                const targetEditor = await this._openReference(editor, editorService, next, this._configuration.openToSide);
                if (targetEditor && model.references.length > 1 && gotoLocation.multiple === 'gotoAndPeek') {
                    this._openInPeek(editorService, targetEditor, model);
                }
                else {
                    model.dispose();
                }
                // keep remaining locations around when using
                // 'goto'-mode
                if (gotoLocation.multiple === 'goto') {
                    symbolNavService.put(next);
                }
            }
        }
        _openReference(editor, editorService, reference, sideBySide) {
            // range is the target-selection-range when we have one
            // and the the fallback is the 'full' range
            let range = undefined;
            if (modes_1.isLocationLink(reference)) {
                range = reference.targetSelectionRange;
            }
            if (!range) {
                range = reference.range;
            }
            return editorService.openCodeEditor({
                resource: reference.uri,
                options: {
                    selection: range_1.Range.collapseToStart(range),
                    revealInCenterIfOutsideViewport: true
                }
            }, editor, sideBySide);
        }
        _openInPeek(editorService, target, model) {
            let controller = referencesController_1.ReferencesController.get(target);
            if (controller && target.hasModel()) {
                controller.toggleWidget(target.getSelection(), async_1.createCancelablePromise(_ => Promise.resolve(model)), {
                    getMetaTitle: (model) => {
                        return this._getMetaTitle(model);
                    },
                    onGoto: (reference) => {
                        controller.closeWidget();
                        return this._openReference(target, editorService, reference, false);
                    }
                });
            }
            else {
                model.dispose();
            }
        }
    }
    exports.DefinitionAction = DefinitionAction;
    const goToDefinitionKb = platform.isWeb
        ? 2048 /* CtrlCmd */ | 70 /* F12 */
        : 70 /* F12 */;
    class GoToDefinitionAction extends DefinitionAction {
        constructor() {
            super(new DefinitionActionConfig(), {
                id: GoToDefinitionAction.id,
                label: nls.localize('actions.goToDecl.label', "Go to Definition"),
                alias: 'Go to Definition',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.hasDefinitionProvider, editorContextKeys_1.EditorContextKeys.isInEmbeddedEditor.toNegated()),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: goToDefinitionKb,
                    weight: 100 /* EditorContrib */
                },
                menuOpts: {
                    group: 'navigation',
                    order: 1.1
                }
            });
            commands_1.CommandsRegistry.registerCommandAlias('editor.action.goToDeclaration', GoToDefinitionAction.id);
        }
    }
    exports.GoToDefinitionAction = GoToDefinitionAction;
    GoToDefinitionAction.id = 'editor.action.revealDefinition';
    class OpenDefinitionToSideAction extends DefinitionAction {
        constructor() {
            super(new DefinitionActionConfig(true), {
                id: OpenDefinitionToSideAction.id,
                label: nls.localize('actions.goToDeclToSide.label', "Open Definition to the Side"),
                alias: 'Open Definition to the Side',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.hasDefinitionProvider, editorContextKeys_1.EditorContextKeys.isInEmbeddedEditor.toNegated()),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, goToDefinitionKb),
                    weight: 100 /* EditorContrib */
                }
            });
            commands_1.CommandsRegistry.registerCommandAlias('editor.action.openDeclarationToTheSide', OpenDefinitionToSideAction.id);
        }
    }
    exports.OpenDefinitionToSideAction = OpenDefinitionToSideAction;
    OpenDefinitionToSideAction.id = 'editor.action.revealDefinitionAside';
    class PeekDefinitionAction extends DefinitionAction {
        constructor() {
            super(new DefinitionActionConfig(undefined, true, false), {
                id: PeekDefinitionAction.id,
                label: nls.localize('actions.previewDecl.label', "Peek Definition"),
                alias: 'Peek Definition',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.hasDefinitionProvider, peekViewWidget_1.PeekContext.notInPeekEditor, editorContextKeys_1.EditorContextKeys.isInEmbeddedEditor.toNegated()),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 512 /* Alt */ | 70 /* F12 */,
                    linux: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 68 /* F10 */ },
                    weight: 100 /* EditorContrib */
                },
                menuOpts: {
                    group: 'navigation',
                    order: 1.2
                }
            });
            commands_1.CommandsRegistry.registerCommandAlias('editor.action.previewDeclaration', PeekDefinitionAction.id);
        }
    }
    exports.PeekDefinitionAction = PeekDefinitionAction;
    PeekDefinitionAction.id = 'editor.action.peekDefinition';
    class DeclarationAction extends DefinitionAction {
        _getTargetLocationForPosition(model, position, token) {
            return goToDefinition_1.getDeclarationsAtPosition(model, position, token);
        }
        _getNoResultFoundMessage(info) {
            return info && info.word
                ? nls.localize('decl.noResultWord', "No declaration found for '{0}'", info.word)
                : nls.localize('decl.generic.noResults', "No declaration found");
        }
        _getMetaTitle(model) {
            return model.references.length > 1 ? nls.localize('decl.meta.title', " – {0} declarations", model.references.length) : '';
        }
    }
    exports.DeclarationAction = DeclarationAction;
    class GoToDeclarationAction extends DeclarationAction {
        constructor() {
            super(new DefinitionActionConfig(), {
                id: GoToDeclarationAction.id,
                label: nls.localize('actions.goToDeclaration.label', "Go to Declaration"),
                alias: 'Go to Declaration',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.hasDeclarationProvider, editorContextKeys_1.EditorContextKeys.isInEmbeddedEditor.toNegated()),
                menuOpts: {
                    group: 'navigation',
                    order: 1.3
                }
            });
        }
        _getNoResultFoundMessage(info) {
            return info && info.word
                ? nls.localize('decl.noResultWord', "No declaration found for '{0}'", info.word)
                : nls.localize('decl.generic.noResults', "No declaration found");
        }
        _getMetaTitle(model) {
            return model.references.length > 1 ? nls.localize('decl.meta.title', " – {0} declarations", model.references.length) : '';
        }
    }
    exports.GoToDeclarationAction = GoToDeclarationAction;
    GoToDeclarationAction.id = 'editor.action.revealDeclaration';
    class PeekDeclarationAction extends DeclarationAction {
        constructor() {
            super(new DefinitionActionConfig(undefined, true, false), {
                id: 'editor.action.peekDeclaration',
                label: nls.localize('actions.peekDecl.label', "Peek Declaration"),
                alias: 'Peek Declaration',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.hasDeclarationProvider, peekViewWidget_1.PeekContext.notInPeekEditor, editorContextKeys_1.EditorContextKeys.isInEmbeddedEditor.toNegated()),
                menuOpts: {
                    group: 'navigation',
                    order: 1.31
                }
            });
        }
    }
    exports.PeekDeclarationAction = PeekDeclarationAction;
    class ImplementationAction extends DefinitionAction {
        _getTargetLocationForPosition(model, position, token) {
            return goToDefinition_1.getImplementationsAtPosition(model, position, token);
        }
        _getNoResultFoundMessage(info) {
            return info && info.word
                ? nls.localize('goToImplementation.noResultWord', "No implementation found for '{0}'", info.word)
                : nls.localize('goToImplementation.generic.noResults', "No implementation found");
        }
        _getMetaTitle(model) {
            return model.references.length > 1 ? nls.localize('meta.implementations.title', " – {0} implementations", model.references.length) : '';
        }
    }
    exports.ImplementationAction = ImplementationAction;
    class GoToImplementationAction extends ImplementationAction {
        constructor() {
            super(new DefinitionActionConfig(), {
                id: GoToImplementationAction.ID,
                label: nls.localize('actions.goToImplementation.label', "Go to Implementation"),
                alias: 'Go to Implementation',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.hasImplementationProvider, editorContextKeys_1.EditorContextKeys.isInEmbeddedEditor.toNegated()),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* CtrlCmd */ | 70 /* F12 */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
    }
    exports.GoToImplementationAction = GoToImplementationAction;
    GoToImplementationAction.ID = 'editor.action.goToImplementation';
    class PeekImplementationAction extends ImplementationAction {
        constructor() {
            super(new DefinitionActionConfig(false, true, false), {
                id: PeekImplementationAction.ID,
                label: nls.localize('actions.peekImplementation.label', "Peek Implementation"),
                alias: 'Peek Implementation',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.hasImplementationProvider, editorContextKeys_1.EditorContextKeys.isInEmbeddedEditor.toNegated()),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 70 /* F12 */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
    }
    exports.PeekImplementationAction = PeekImplementationAction;
    PeekImplementationAction.ID = 'editor.action.peekImplementation';
    class TypeDefinitionAction extends DefinitionAction {
        _getTargetLocationForPosition(model, position, token) {
            return goToDefinition_1.getTypeDefinitionsAtPosition(model, position, token);
        }
        _getNoResultFoundMessage(info) {
            return info && info.word
                ? nls.localize('goToTypeDefinition.noResultWord', "No type definition found for '{0}'", info.word)
                : nls.localize('goToTypeDefinition.generic.noResults', "No type definition found");
        }
        _getMetaTitle(model) {
            return model.references.length > 1 ? nls.localize('meta.typeDefinitions.title', " – {0} type definitions", model.references.length) : '';
        }
    }
    exports.TypeDefinitionAction = TypeDefinitionAction;
    class GoToTypeDefinitionAction extends TypeDefinitionAction {
        constructor() {
            super(new DefinitionActionConfig(), {
                id: GoToTypeDefinitionAction.ID,
                label: nls.localize('actions.goToTypeDefinition.label', "Go to Type Definition"),
                alias: 'Go to Type Definition',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.hasTypeDefinitionProvider, editorContextKeys_1.EditorContextKeys.isInEmbeddedEditor.toNegated()),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 0,
                    weight: 100 /* EditorContrib */
                },
                menuOpts: {
                    group: 'navigation',
                    order: 1.4
                }
            });
        }
    }
    exports.GoToTypeDefinitionAction = GoToTypeDefinitionAction;
    GoToTypeDefinitionAction.ID = 'editor.action.goToTypeDefinition';
    class PeekTypeDefinitionAction extends TypeDefinitionAction {
        constructor() {
            super(new DefinitionActionConfig(false, true, false), {
                id: PeekTypeDefinitionAction.ID,
                label: nls.localize('actions.peekTypeDefinition.label', "Peek Type Definition"),
                alias: 'Peek Type Definition',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.hasTypeDefinitionProvider, editorContextKeys_1.EditorContextKeys.isInEmbeddedEditor.toNegated()),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 0,
                    weight: 100 /* EditorContrib */
                }
            });
        }
    }
    exports.PeekTypeDefinitionAction = PeekTypeDefinitionAction;
    PeekTypeDefinitionAction.ID = 'editor.action.peekTypeDefinition';
    editorExtensions_1.registerEditorAction(GoToDefinitionAction);
    editorExtensions_1.registerEditorAction(OpenDefinitionToSideAction);
    editorExtensions_1.registerEditorAction(PeekDefinitionAction);
    editorExtensions_1.registerEditorAction(GoToDeclarationAction);
    editorExtensions_1.registerEditorAction(PeekDeclarationAction);
    editorExtensions_1.registerEditorAction(GoToImplementationAction);
    editorExtensions_1.registerEditorAction(PeekImplementationAction);
    editorExtensions_1.registerEditorAction(GoToTypeDefinitionAction);
    editorExtensions_1.registerEditorAction(PeekTypeDefinitionAction);
    // Go to menu
    actions_1.MenuRegistry.appendMenuItem(16 /* MenubarGoMenu */, {
        group: '4_symbol_nav',
        command: {
            id: 'editor.action.goToDeclaration',
            title: nls.localize({ key: 'miGotoDefinition', comment: ['&& denotes a mnemonic'] }, "Go to &&Definition")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(16 /* MenubarGoMenu */, {
        group: '4_symbol_nav',
        command: {
            id: 'editor.action.goToTypeDefinition',
            title: nls.localize({ key: 'miGotoTypeDefinition', comment: ['&& denotes a mnemonic'] }, "Go to &&Type Definition")
        },
        order: 3
    });
    actions_1.MenuRegistry.appendMenuItem(16 /* MenubarGoMenu */, {
        group: '4_symbol_nav',
        command: {
            id: 'editor.action.goToImplementation',
            title: nls.localize({ key: 'miGotoImplementation', comment: ['&& denotes a mnemonic'] }, "Go to &&Implementation")
        },
        order: 4
    });
});
//# sourceMappingURL=goToDefinitionCommands.js.map