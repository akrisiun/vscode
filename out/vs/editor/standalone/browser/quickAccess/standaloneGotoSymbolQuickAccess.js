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
define(["require", "exports", "vs/editor/contrib/quickAccess/gotoSymbolQuickAccess", "vs/platform/registry/common/platform", "vs/platform/quickinput/common/quickAccess", "vs/editor/browser/services/codeEditorService", "vs/base/common/types", "vs/editor/common/standaloneStrings", "vs/base/common/event", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/platform/quickinput/common/quickInput"], function (require, exports, gotoSymbolQuickAccess_1, platform_1, quickAccess_1, codeEditorService_1, types_1, standaloneStrings_1, event_1, editorExtensions_1, editorContextKeys_1, quickInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GotoLineAction = exports.StandaloneGotoSymbolQuickAccessProvider = void 0;
    let StandaloneGotoSymbolQuickAccessProvider = /** @class */ (() => {
        let StandaloneGotoSymbolQuickAccessProvider = class StandaloneGotoSymbolQuickAccessProvider extends gotoSymbolQuickAccess_1.AbstractGotoSymbolQuickAccessProvider {
            constructor(editorService) {
                super();
                this.editorService = editorService;
                this.onDidActiveTextEditorControlChange = event_1.Event.None;
            }
            get activeTextEditorControl() {
                return types_1.withNullAsUndefined(this.editorService.getFocusedCodeEditor());
            }
        };
        StandaloneGotoSymbolQuickAccessProvider = __decorate([
            __param(0, codeEditorService_1.ICodeEditorService)
        ], StandaloneGotoSymbolQuickAccessProvider);
        return StandaloneGotoSymbolQuickAccessProvider;
    })();
    exports.StandaloneGotoSymbolQuickAccessProvider = StandaloneGotoSymbolQuickAccessProvider;
    platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess).registerQuickAccessProvider({
        ctor: StandaloneGotoSymbolQuickAccessProvider,
        prefix: gotoSymbolQuickAccess_1.AbstractGotoSymbolQuickAccessProvider.PREFIX,
        helpEntries: [
            { description: standaloneStrings_1.QuickOutlineNLS.quickOutlineActionLabel, prefix: gotoSymbolQuickAccess_1.AbstractGotoSymbolQuickAccessProvider.PREFIX, needsEditor: true },
            { description: standaloneStrings_1.QuickOutlineNLS.quickOutlineByCategoryActionLabel, prefix: gotoSymbolQuickAccess_1.AbstractGotoSymbolQuickAccessProvider.PREFIX_BY_CATEGORY, needsEditor: true }
        ]
    });
    class GotoLineAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.quickOutline',
                label: standaloneStrings_1.QuickOutlineNLS.quickOutlineActionLabel,
                alias: 'Go to Symbol...',
                precondition: editorContextKeys_1.EditorContextKeys.hasDocumentSymbolProvider,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 45 /* KEY_O */,
                    weight: 100 /* EditorContrib */
                },
                contextMenuOpts: {
                    group: 'navigation',
                    order: 3
                }
            });
        }
        run(accessor) {
            accessor.get(quickInput_1.IQuickInputService).quickAccess.show(gotoSymbolQuickAccess_1.AbstractGotoSymbolQuickAccessProvider.PREFIX);
        }
    }
    exports.GotoLineAction = GotoLineAction;
    editorExtensions_1.registerEditorAction(GotoLineAction);
});
//# sourceMappingURL=standaloneGotoSymbolQuickAccess.js.map