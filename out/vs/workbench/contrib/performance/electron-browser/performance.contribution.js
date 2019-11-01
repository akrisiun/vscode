/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/contrib/performance/electron-browser/perfviewEditor", "vs/workbench/services/editor/common/editorService", "./startupProfiler", "./startupTimings"], function (require, exports, nls_1, actions_1, commands_1, instantiation_1, platform_1, contributions_1, editor_1, perfviewEditor_1, editorService_1, startupProfiler_1, startupTimings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // -- startup performance view
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(perfviewEditor_1.PerfviewContrib, 2 /* Ready */);
    platform_1.Registry.as(editor_1.Extensions.EditorInputFactories).registerEditorInputFactory(perfviewEditor_1.PerfviewInput.Id, class {
        serialize() {
            return '';
        }
        deserialize(instantiationService) {
            return instantiationService.createInstance(perfviewEditor_1.PerfviewInput);
        }
    });
    commands_1.CommandsRegistry.registerCommand('perfview.show', accessor => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const instaService = accessor.get(instantiation_1.IInstantiationService);
        return editorService.openEditor(instaService.createInstance(perfviewEditor_1.PerfviewInput));
    });
    actions_1.MenuRegistry.addCommand({
        id: 'perfview.show',
        category: nls_1.localize('show.cat', "Developer"),
        title: nls_1.localize('show.label', "Startup Performance")
    });
    // -- startup profiler
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(startupProfiler_1.StartupProfiler, 3 /* Restored */);
    // -- startup timings
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(startupTimings_1.StartupTimings, 4 /* Eventually */);
});
//# sourceMappingURL=performance.contribution.js.map