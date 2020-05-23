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
define(["require", "exports", "vs/base/common/objects", "vs/base/common/strings", "vs/base/common/uri", "vs/editor/contrib/find/findModel", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/workbench/browser/editor", "vs/workbench/common/actions", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/contrib/search/common/constants", "vs/workbench/contrib/searchEditor/browser/constants", "vs/workbench/contrib/searchEditor/browser/searchEditor", "vs/workbench/contrib/searchEditor/browser/searchEditorActions", "vs/workbench/contrib/searchEditor/browser/searchEditorInput", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/searchEditor/browser/searchEditorSerialization", "vs/workbench/contrib/search/browser/searchIcons"], function (require, exports, objects, strings_1, uri_1, findModel_1, nls_1, actions_1, commands_1, contextkey_1, descriptors_1, instantiation_1, keybindingsRegistry_1, platform_1, telemetry_1, editor_1, actions_2, contributions_1, editor_2, SearchConstants, SearchEditorConstants, searchEditor_1, searchEditorActions_1, searchEditorInput_1, editorService_1, searchEditorSerialization_1, searchIcons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //#region Editor Descriptior
    platform_1.Registry.as(editor_1.Extensions.Editors).registerEditor(editor_1.EditorDescriptor.create(searchEditor_1.SearchEditor, searchEditor_1.SearchEditor.ID, nls_1.localize('searchEditor', "Search Editor")), [
        new descriptors_1.SyncDescriptor(searchEditorInput_1.SearchEditorInput)
    ]);
    //#endregion
    //#region Startup Contribution
    let SearchEditorContribution = /** @class */ (() => {
        let SearchEditorContribution = class SearchEditorContribution {
            constructor(editorService, instantiationService, telemetryService, contextKeyService) {
                this.editorService = editorService;
                this.instantiationService = instantiationService;
                this.telemetryService = telemetryService;
                this.contextKeyService = contextKeyService;
                this.editorService.overrideOpenEditor({
                    open: (editor, options, group) => {
                        const resource = editor.resource;
                        if (!resource) {
                            return undefined;
                        }
                        if (!strings_1.endsWith(resource.path, '.code-search')) {
                            return undefined;
                        }
                        if (group.isOpened(editor) && editor instanceof searchEditorInput_1.SearchEditorInput) {
                            return undefined;
                        }
                        this.telemetryService.publicLog2('searchEditor/openSavedSearchEditor');
                        return {
                            override: (async () => {
                                const { config } = await instantiationService.invokeFunction(searchEditorSerialization_1.parseSavedSearchEditor, resource);
                                const input = instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { backingUri: resource, config });
                                return editorService.openEditor(input, Object.assign(Object.assign({}, options), { ignoreOverrides: true }), group);
                            })()
                        };
                    }
                });
            }
        };
        SearchEditorContribution = __decorate([
            __param(0, editorService_1.IEditorService),
            __param(1, instantiation_1.IInstantiationService),
            __param(2, telemetry_1.ITelemetryService),
            __param(3, contextkey_1.IContextKeyService)
        ], SearchEditorContribution);
        return SearchEditorContribution;
    })();
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(SearchEditorContribution, 1 /* Starting */);
    class SearchEditorInputFactory {
        canSerialize() { return true; }
        serialize(input) {
            let modelUri = undefined;
            if (input.modelUri.path || input.modelUri.fragment) {
                modelUri = input.modelUri.toString();
            }
            if (!modelUri) {
                return undefined;
            }
            const config = input.config;
            const dirty = input.isDirty();
            const matchRanges = input.getMatchRanges();
            const backingUri = input.backingUri;
            return JSON.stringify({ modelUri: modelUri.toString(), dirty, config, name: input.getName(), matchRanges, backingUri: backingUri === null || backingUri === void 0 ? void 0 : backingUri.toString() });
        }
        deserialize(instantiationService, serializedEditorInput) {
            const { modelUri, dirty, config, matchRanges, backingUri } = JSON.parse(serializedEditorInput);
            if (config && (config.query !== undefined) && (modelUri !== undefined)) {
                const input = instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { config, modelUri: uri_1.URI.parse(modelUri), backingUri: backingUri ? uri_1.URI.parse(backingUri) : undefined });
                input.setDirty(dirty);
                input.setMatchRanges(matchRanges);
                return input;
            }
            return undefined;
        }
    }
    platform_1.Registry.as(editor_2.Extensions.EditorInputFactories).registerEditorInputFactory(searchEditorInput_1.SearchEditorInput.ID, SearchEditorInputFactory);
    //#endregion
    //#region Commands
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule(objects.assign({
        id: SearchEditorConstants.ToggleSearchEditorCaseSensitiveCommandId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(SearchEditorConstants.InSearchEditor, SearchConstants.SearchInputBoxFocusedKey),
        handler: searchEditorActions_1.toggleSearchEditorCaseSensitiveCommand
    }, findModel_1.ToggleCaseSensitiveKeybinding));
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule(objects.assign({
        id: SearchEditorConstants.ToggleSearchEditorWholeWordCommandId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(SearchEditorConstants.InSearchEditor, SearchConstants.SearchInputBoxFocusedKey),
        handler: searchEditorActions_1.toggleSearchEditorWholeWordCommand
    }, findModel_1.ToggleWholeWordKeybinding));
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule(objects.assign({
        id: SearchEditorConstants.ToggleSearchEditorRegexCommandId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(SearchEditorConstants.InSearchEditor, SearchConstants.SearchInputBoxFocusedKey),
        handler: searchEditorActions_1.toggleSearchEditorRegexCommand
    }, findModel_1.ToggleRegexKeybinding));
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: SearchEditorConstants.ToggleSearchEditorContextLinesCommandId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(SearchEditorConstants.InSearchEditor),
        handler: searchEditorActions_1.toggleSearchEditorContextLinesCommand,
        primary: 512 /* Alt */ | 42 /* KEY_L */,
        mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 42 /* KEY_L */ }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: SearchEditorConstants.IncreaseSearchEditorContextLinesCommandId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(SearchEditorConstants.InSearchEditor),
        handler: (accessor) => searchEditorActions_1.modifySearchEditorContextLinesCommand(accessor, true),
        primary: 512 /* Alt */ | 81 /* US_EQUAL */
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: SearchEditorConstants.DecreaseSearchEditorContextLinesCommandId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(SearchEditorConstants.InSearchEditor),
        handler: (accessor) => searchEditorActions_1.modifySearchEditorContextLinesCommand(accessor, false),
        primary: 512 /* Alt */ | 83 /* US_MINUS */
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: SearchEditorConstants.SelectAllSearchEditorMatchesCommandId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(SearchEditorConstants.InSearchEditor),
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 42 /* KEY_L */,
        handler: searchEditorActions_1.selectAllSearchEditorMatchesCommand
    });
    commands_1.CommandsRegistry.registerCommand(SearchEditorConstants.CleanSearchEditorStateCommandId, (accessor) => {
        const activeEditorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
        if (activeEditorPane instanceof searchEditor_1.SearchEditor) {
            activeEditorPane.cleanState();
        }
    });
    //#endregion
    //#region Actions
    const registry = platform_1.Registry.as(actions_2.Extensions.WorkbenchActions);
    const category = nls_1.localize('search', "Search Editor");
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(searchEditorActions_1.OpenResultsInEditorAction, { mac: { primary: 2048 /* CtrlCmd */ | 3 /* Enter */ } }, contextkey_1.ContextKeyExpr.and(SearchConstants.HasSearchResults, SearchConstants.SearchViewFocusedKey)), 'Search Editor: Open Results in Editor', category);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(searchEditorActions_1.OpenSearchEditorAction), 'Search Editor: Open New Search Editor', category);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(searchEditorActions_1.OpenSearchEditorToSideAction), 'Search Editor: Open New Search Editor to Side', category);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(searchEditorActions_1.RerunSearchEditorSearchAction, { mac: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 48 /* KEY_R */ } }), 'Search Editor: Search Again', category, SearchEditorConstants.InSearchEditor);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(searchEditorActions_1.FocusQueryEditorWidgetAction, { primary: 9 /* Escape */ }), 'Search Editor: Focus Query Editor Widget', category, SearchEditorConstants.InSearchEditor);
    //#endregion
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        command: {
            id: searchEditorActions_1.RerunSearchEditorSearchAction.ID,
            title: searchEditorActions_1.RerunSearchEditorSearchAction.LABEL,
            icon: searchIcons_1.searchRefreshIcon,
        },
        group: 'navigation',
        when: contextkey_1.ContextKeyExpr.and(editor_2.ActiveEditorContext.isEqualTo(SearchEditorConstants.SearchEditorID))
    });
});
//# sourceMappingURL=searchEditor.contribution.js.map