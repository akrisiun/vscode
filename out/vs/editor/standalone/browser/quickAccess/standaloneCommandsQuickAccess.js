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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/platform/quickinput/common/quickAccess", "vs/editor/common/standaloneStrings", "vs/editor/browser/services/codeEditorService", "vs/editor/contrib/quickAccess/commandsQuickAccess", "vs/base/common/types", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/commands/common/commands", "vs/platform/telemetry/common/telemetry", "vs/platform/notification/common/notification", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/platform/quickinput/common/quickInput"], function (require, exports, platform_1, quickAccess_1, standaloneStrings_1, codeEditorService_1, commandsQuickAccess_1, types_1, instantiation_1, keybinding_1, commands_1, telemetry_1, notification_1, editorExtensions_1, editorContextKeys_1, quickInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GotoLineAction = exports.StandaloneCommandsQuickAccessProvider = void 0;
    let StandaloneCommandsQuickAccessProvider = /** @class */ (() => {
        let StandaloneCommandsQuickAccessProvider = class StandaloneCommandsQuickAccessProvider extends commandsQuickAccess_1.AbstractEditorCommandsQuickAccessProvider {
            constructor(instantiationService, codeEditorService, keybindingService, commandService, telemetryService, notificationService) {
                super({ showAlias: false }, instantiationService, keybindingService, commandService, telemetryService, notificationService);
                this.codeEditorService = codeEditorService;
            }
            get activeTextEditorControl() { return types_1.withNullAsUndefined(this.codeEditorService.getFocusedCodeEditor()); }
            async getCommandPicks() {
                return this.getCodeEditorCommandPicks();
            }
        };
        StandaloneCommandsQuickAccessProvider = __decorate([
            __param(0, instantiation_1.IInstantiationService),
            __param(1, codeEditorService_1.ICodeEditorService),
            __param(2, keybinding_1.IKeybindingService),
            __param(3, commands_1.ICommandService),
            __param(4, telemetry_1.ITelemetryService),
            __param(5, notification_1.INotificationService)
        ], StandaloneCommandsQuickAccessProvider);
        return StandaloneCommandsQuickAccessProvider;
    })();
    exports.StandaloneCommandsQuickAccessProvider = StandaloneCommandsQuickAccessProvider;
    platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess).registerQuickAccessProvider({
        ctor: StandaloneCommandsQuickAccessProvider,
        prefix: StandaloneCommandsQuickAccessProvider.PREFIX,
        helpEntries: [{ description: standaloneStrings_1.QuickCommandNLS.quickCommandHelp, needsEditor: true }]
    });
    class GotoLineAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.quickCommand',
                label: standaloneStrings_1.QuickCommandNLS.quickCommandActionLabel,
                alias: 'Command Palette',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 59 /* F1 */,
                    weight: 100 /* EditorContrib */
                },
                contextMenuOpts: {
                    group: 'z_commands',
                    order: 1
                }
            });
        }
        run(accessor) {
            accessor.get(quickInput_1.IQuickInputService).quickAccess.show(StandaloneCommandsQuickAccessProvider.PREFIX);
        }
    }
    exports.GotoLineAction = GotoLineAction;
    editorExtensions_1.registerEditorAction(GotoLineAction);
});
//# sourceMappingURL=standaloneCommandsQuickAccess.js.map