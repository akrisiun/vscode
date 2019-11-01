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
define(["require", "exports", "vs/nls", "vs/base/common/keyCodes", "vs/editor/common/modes/modesRegistry", "vs/platform/registry/common/platform", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/extensions", "vs/workbench/common/actions", "vs/workbench/contrib/output/browser/outputServices", "vs/workbench/contrib/output/browser/outputActions", "vs/workbench/contrib/output/common/output", "vs/workbench/browser/panel", "vs/workbench/contrib/output/browser/outputPanel", "vs/workbench/browser/editor", "vs/workbench/contrib/output/browser/logViewer", "vs/platform/instantiation/common/descriptors", "vs/workbench/common/contributions", "vs/platform/instantiation/common/instantiation", "vs/editor/common/services/resolverService"], function (require, exports, nls, keyCodes_1, modesRegistry_1, platform_1, actions_1, extensions_1, actions_2, outputServices_1, outputActions_1, output_1, panel_1, outputPanel_1, editor_1, logViewer_1, descriptors_1, contributions_1, instantiation_1, resolverService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Register Service
    extensions_1.registerSingleton(output_1.IOutputService, outputServices_1.OutputService);
    // Register Output Mode
    modesRegistry_1.ModesRegistry.registerLanguage({
        id: output_1.OUTPUT_MODE_ID,
        extensions: [],
        mimetypes: [output_1.OUTPUT_MIME]
    });
    // Register Log Output Mode
    modesRegistry_1.ModesRegistry.registerLanguage({
        id: output_1.LOG_MODE_ID,
        extensions: [],
        mimetypes: [output_1.LOG_MIME]
    });
    // Register Output Panel
    platform_1.Registry.as(panel_1.Extensions.Panels).registerPanel(new panel_1.PanelDescriptor(outputPanel_1.OutputPanel, output_1.OUTPUT_PANEL_ID, nls.localize('output', "Output"), 'output', 20, outputActions_1.ToggleOutputAction.ID));
    platform_1.Registry.as(editor_1.Extensions.Editors).registerEditor(new editor_1.EditorDescriptor(logViewer_1.LogViewer, logViewer_1.LogViewer.LOG_VIEWER_EDITOR_ID, nls.localize('logViewer', "Log Viewer")), [
        new descriptors_1.SyncDescriptor(logViewer_1.LogViewerInput)
    ]);
    let OutputContribution = class OutputContribution {
        constructor(instantiationService, textModelService) {
            textModelService.registerTextModelContentProvider(output_1.LOG_SCHEME, instantiationService.createInstance(outputServices_1.LogContentProvider));
        }
    };
    OutputContribution = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, resolverService_1.ITextModelService)
    ], OutputContribution);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(OutputContribution, 3 /* Restored */);
    // register toggle output action globally
    const actionRegistry = platform_1.Registry.as(actions_2.Extensions.WorkbenchActions);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(outputActions_1.ToggleOutputAction, outputActions_1.ToggleOutputAction.ID, outputActions_1.ToggleOutputAction.LABEL, {
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 51 /* KEY_U */,
        linux: {
            primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 38 /* KEY_H */) // On Ubuntu Ctrl+Shift+U is taken by some global OS command
        }
    }), 'View: Toggle Output', nls.localize('viewCategory', "View"));
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(outputActions_1.ClearOutputAction, outputActions_1.ClearOutputAction.ID, outputActions_1.ClearOutputAction.LABEL), 'View: Clear Output', nls.localize('viewCategory', "View"));
    const devCategory = nls.localize('developer', "Developer");
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(outputActions_1.ShowLogsOutputChannelAction, outputActions_1.ShowLogsOutputChannelAction.ID, outputActions_1.ShowLogsOutputChannelAction.LABEL), 'Developer: Show Logs...', devCategory);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(outputActions_1.OpenOutputLogFileAction, outputActions_1.OpenOutputLogFileAction.ID, outputActions_1.OpenOutputLogFileAction.LABEL), 'Developer: Open Log File...', devCategory);
    // Define clear command, contribute to editor context menu
    actions_1.registerAction({
        id: 'editor.action.clearoutput',
        title: { value: nls.localize('clearOutput.label', "Clear Output"), original: 'Clear Output' },
        menu: {
            menuId: 7 /* EditorContext */,
            when: output_1.CONTEXT_IN_OUTPUT
        },
        handler(accessor) {
            const activeChannel = accessor.get(output_1.IOutputService).getActiveChannel();
            if (activeChannel) {
                activeChannel.clear();
            }
        }
    });
    actions_1.registerAction({
        id: 'workbench.action.openActiveLogOutputFile',
        title: { value: nls.localize('openActiveLogOutputFile', "Open Active Log Output File"), original: 'Open Active Log Output File' },
        menu: {
            menuId: 0 /* CommandPalette */,
            when: output_1.CONTEXT_ACTIVE_LOG_OUTPUT
        },
        handler(accessor) {
            accessor.get(instantiation_1.IInstantiationService).createInstance(outputActions_1.OpenLogOutputFile).run();
        }
    });
    actions_1.MenuRegistry.appendMenuItem(26 /* MenubarViewMenu */, {
        group: '4_panels',
        command: {
            id: outputActions_1.ToggleOutputAction.ID,
            title: nls.localize({ key: 'miToggleOutput', comment: ['&& denotes a mnemonic'] }, "&&Output")
        },
        order: 1
    });
});
//# sourceMappingURL=output.contribution.js.map