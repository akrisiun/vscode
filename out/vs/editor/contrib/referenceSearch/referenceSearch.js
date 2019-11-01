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
define(["require", "exports", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry", "vs/editor/common/core/position", "vs/editor/browser/editorExtensions", "vs/editor/common/modes", "vs/editor/common/core/range", "./peekViewWidget", "./referencesController", "./referencesModel", "vs/base/common/async", "vs/base/common/errors", "vs/editor/common/editorContextKeys", "vs/editor/browser/widget/embeddedCodeEditorWidget", "vs/editor/browser/editorBrowser", "vs/platform/list/browser/listService", "vs/editor/contrib/referenceSearch/referencesWidget", "vs/platform/commands/common/commands", "vs/base/common/uri", "vs/editor/browser/services/codeEditorService", "vs/base/common/cancellation", "vs/base/common/arrays"], function (require, exports, nls, contextkey_1, keybindingsRegistry_1, position_1, editorExtensions_1, modes_1, range_1, peekViewWidget_1, referencesController_1, referencesModel_1, async_1, errors_1, editorContextKeys_1, embeddedCodeEditorWidget_1, editorBrowser_1, listService_1, referencesWidget_1, commands_1, uri_1, codeEditorService_1, cancellation_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.defaultReferenceSearchOptions = {
        getMetaTitle(model) {
            return model.references.length > 1 ? nls.localize('meta.titleReference', " – {0} references", model.references.length) : '';
        }
    };
    let ReferenceController = class ReferenceController {
        constructor(editor, contextKeyService) {
            if (editor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget) {
                peekViewWidget_1.PeekContext.inPeekEditor.bindTo(contextKeyService);
            }
        }
        dispose() {
        }
        getId() {
            return ReferenceController.ID;
        }
    };
    ReferenceController.ID = 'editor.contrib.referenceController';
    ReferenceController = __decorate([
        __param(1, contextkey_1.IContextKeyService)
    ], ReferenceController);
    exports.ReferenceController = ReferenceController;
    class ReferenceAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.referenceSearch.trigger',
                label: nls.localize('references.action.label', "Peek References"),
                alias: 'Peek References',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.hasReferenceProvider, peekViewWidget_1.PeekContext.notInPeekEditor, editorContextKeys_1.EditorContextKeys.isInEmbeddedEditor.toNegated()),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 1024 /* Shift */ | 70 /* F12 */,
                    weight: 100 /* EditorContrib */
                },
                menuOpts: {
                    group: 'navigation',
                    order: 1.5
                }
            });
        }
        run(_accessor, editor) {
            let controller = referencesController_1.ReferencesController.get(editor);
            if (!controller) {
                return;
            }
            if (editor.hasModel()) {
                const range = editor.getSelection();
                const model = editor.getModel();
                const references = async_1.createCancelablePromise(token => provideReferences(model, range.getStartPosition(), token).then(references => new referencesModel_1.ReferencesModel(references)));
                controller.toggleWidget(range, references, exports.defaultReferenceSearchOptions);
            }
        }
    }
    exports.ReferenceAction = ReferenceAction;
    editorExtensions_1.registerEditorContribution(ReferenceController);
    editorExtensions_1.registerEditorAction(ReferenceAction);
    let findReferencesCommand = (accessor, resource, position) => {
        if (!(resource instanceof uri_1.URI)) {
            throw new Error('illegal argument, uri');
        }
        if (!position) {
            throw new Error('illegal argument, position');
        }
        const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
        return codeEditorService.openCodeEditor({ resource }, codeEditorService.getFocusedCodeEditor()).then(control => {
            if (!editorBrowser_1.isCodeEditor(control) || !control.hasModel()) {
                return undefined;
            }
            let controller = referencesController_1.ReferencesController.get(control);
            if (!controller) {
                return undefined;
            }
            let references = async_1.createCancelablePromise(token => provideReferences(control.getModel(), position_1.Position.lift(position), token).then(references => new referencesModel_1.ReferencesModel(references)));
            let range = new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column);
            return Promise.resolve(controller.toggleWidget(range, references, exports.defaultReferenceSearchOptions));
        });
    };
    let showReferencesCommand = (accessor, resource, position, references) => {
        if (!(resource instanceof uri_1.URI)) {
            throw new Error('illegal argument, uri expected');
        }
        if (!references) {
            throw new Error('missing references');
        }
        const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
        return codeEditorService.openCodeEditor({ resource }, codeEditorService.getFocusedCodeEditor()).then(control => {
            if (!editorBrowser_1.isCodeEditor(control)) {
                return undefined;
            }
            let controller = referencesController_1.ReferencesController.get(control);
            if (!controller) {
                return undefined;
            }
            return controller.toggleWidget(new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column), async_1.createCancelablePromise(_ => Promise.resolve(new referencesModel_1.ReferencesModel(references))), exports.defaultReferenceSearchOptions);
        });
    };
    // register commands
    commands_1.CommandsRegistry.registerCommand({
        id: 'editor.action.findReferences',
        handler: findReferencesCommand
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'editor.action.showReferences',
        handler: showReferencesCommand,
        description: {
            description: 'Show references at a position in a file',
            args: [
                { name: 'uri', description: 'The text document in which to show references', constraint: uri_1.URI },
                { name: 'position', description: 'The position at which to show', constraint: position_1.Position.isIPosition },
                { name: 'locations', description: 'An array of locations.', constraint: Array },
            ]
        }
    });
    function closeActiveReferenceSearch(accessor, args) {
        withController(accessor, controller => controller.closeWidget());
    }
    function openReferenceToSide(accessor, args) {
        const listService = accessor.get(listService_1.IListService);
        const focus = listService.lastFocusedList && listService.lastFocusedList.getFocus();
        if (focus instanceof referencesModel_1.OneReference) {
            withController(accessor, controller => controller.openReference(focus, true));
        }
    }
    function withController(accessor, fn) {
        const outerEditor = peekViewWidget_1.getOuterEditor(accessor);
        if (!outerEditor) {
            return;
        }
        let controller = referencesController_1.ReferencesController.get(outerEditor);
        if (!controller) {
            return;
        }
        fn(controller);
    }
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'goToNextReference',
        weight: 200 /* WorkbenchContrib */ + 50,
        primary: 62 /* F4 */,
        when: referencesController_1.ctxReferenceSearchVisible,
        handler(accessor) {
            withController(accessor, controller => {
                controller.goToNextOrPreviousReference(true);
            });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'goToNextReferenceFromEmbeddedEditor',
        weight: 100 /* EditorContrib */ + 50,
        primary: 62 /* F4 */,
        when: peekViewWidget_1.PeekContext.inPeekEditor,
        handler(accessor) {
            withController(accessor, controller => {
                controller.goToNextOrPreviousReference(true);
            });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'goToPreviousReference',
        weight: 200 /* WorkbenchContrib */ + 50,
        primary: 1024 /* Shift */ | 62 /* F4 */,
        when: referencesController_1.ctxReferenceSearchVisible,
        handler(accessor) {
            withController(accessor, controller => {
                controller.goToNextOrPreviousReference(false);
            });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'goToPreviousReferenceFromEmbeddedEditor',
        weight: 100 /* EditorContrib */ + 50,
        primary: 1024 /* Shift */ | 62 /* F4 */,
        when: peekViewWidget_1.PeekContext.inPeekEditor,
        handler(accessor) {
            withController(accessor, controller => {
                controller.goToNextOrPreviousReference(false);
            });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'closeReferenceSearch',
        weight: 200 /* WorkbenchContrib */ + 50,
        primary: 9 /* Escape */,
        secondary: [1024 /* Shift */ | 9 /* Escape */],
        when: contextkey_1.ContextKeyExpr.and(referencesController_1.ctxReferenceSearchVisible, contextkey_1.ContextKeyExpr.not('config.editor.stablePeek')),
        handler: closeActiveReferenceSearch
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'closeReferenceSearchEditor',
        weight: 100 /* EditorContrib */ - 101,
        primary: 9 /* Escape */,
        secondary: [1024 /* Shift */ | 9 /* Escape */],
        when: contextkey_1.ContextKeyExpr.and(peekViewWidget_1.PeekContext.inPeekEditor, contextkey_1.ContextKeyExpr.not('config.editor.stablePeek')),
        handler: closeActiveReferenceSearch
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'openReferenceToSide',
        weight: 100 /* EditorContrib */,
        primary: 2048 /* CtrlCmd */ | 3 /* Enter */,
        mac: {
            primary: 256 /* WinCtrl */ | 3 /* Enter */
        },
        when: contextkey_1.ContextKeyExpr.and(referencesController_1.ctxReferenceSearchVisible, referencesWidget_1.ctxReferenceWidgetSearchTreeFocused),
        handler: openReferenceToSide
    });
    function provideReferences(model, position, token) {
        // collect references from all providers
        const promises = modes_1.ReferenceProviderRegistry.ordered(model).map(provider => {
            return Promise.resolve(provider.provideReferences(model, position, { includeDeclaration: true }, token)).then(result => {
                if (Array.isArray(result)) {
                    return result;
                }
                return undefined;
            }, err => {
                errors_1.onUnexpectedExternalError(err);
            });
        });
        return Promise.all(promises).then(references => arrays_1.flatten(arrays_1.coalesce(references)));
    }
    exports.provideReferences = provideReferences;
    editorExtensions_1.registerDefaultLanguageCommand('_executeReferenceProvider', (model, position) => provideReferences(model, position, cancellation_1.CancellationToken.None));
});
//# sourceMappingURL=referenceSearch.js.map