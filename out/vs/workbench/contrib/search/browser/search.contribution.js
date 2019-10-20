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
define(["require", "exports", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/objects", "vs/base/common/platform", "vs/base/common/resources", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/contrib/find/findController", "vs/editor/contrib/find/findModel", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/files/common/files", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/list/browser/listService", "vs/platform/quickOpen/common/quickOpen", "vs/platform/registry/common/platform", "vs/workbench/browser/panel", "vs/workbench/browser/parts/quickopen/quickopen", "vs/workbench/browser/quickopen", "vs/workbench/browser/viewlet", "vs/workbench/common/actions", "vs/workbench/common/contributions", "vs/workbench/common/views", "vs/workbench/contrib/files/browser/files", "vs/workbench/contrib/files/common/files", "vs/workbench/contrib/search/browser/openAnythingHandler", "vs/workbench/contrib/search/browser/openSymbolHandler", "vs/workbench/contrib/search/browser/replaceContributions", "vs/workbench/contrib/search/browser/searchActions", "vs/workbench/contrib/search/browser/searchPanel", "vs/workbench/contrib/search/browser/searchView", "vs/workbench/contrib/search/browser/searchViewlet", "vs/workbench/contrib/search/browser/searchWidget", "vs/workbench/contrib/search/common/constants", "vs/workbench/contrib/search/common/search", "vs/workbench/contrib/search/common/searchHistoryService", "vs/workbench/contrib/search/common/searchModel", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/panel/common/panelService", "vs/workbench/services/search/common/search", "vs/workbench/services/viewlet/browser/viewlet", "vs/platform/workspace/common/workspace", "vs/css!./media/search.contribution"], function (require, exports, actions_1, arrays_1, errors_1, objects, platform, resources_1, editorExtensions_1, codeEditorService_1, findController_1, findModel_1, nls, actions_2, commands_1, configuration_1, configurationRegistry_1, contextkey_1, files_1, extensions_1, instantiation_1, keybindingsRegistry_1, listService_1, quickOpen_1, platform_1, panel_1, quickopen_1, quickopen_2, viewlet_1, actions_3, contributions_1, views_1, files_2, files_3, openAnythingHandler_1, openSymbolHandler_1, replaceContributions_1, searchActions_1, searchPanel_1, searchView_1, searchViewlet_1, searchWidget_1, Constants, search_1, searchHistoryService_1, searchModel_1, editorService_1, panelService_1, search_2, viewlet_2, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    extensions_1.registerSingleton(searchModel_1.ISearchWorkbenchService, searchModel_1.SearchWorkbenchService, true);
    extensions_1.registerSingleton(searchHistoryService_1.ISearchHistoryService, searchHistoryService_1.SearchHistoryService, true);
    replaceContributions_1.registerContributions();
    searchWidget_1.registerContributions();
    const category = nls.localize('search', "Search");
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.action.search.toggleQueryDetails',
        weight: 200 /* WorkbenchContrib */,
        when: Constants.SearchViewVisibleKey,
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 40 /* KEY_J */,
        handler: accessor => {
            const searchView = searchActions_1.getSearchView(accessor.get(viewlet_2.IViewletService), accessor.get(panelService_1.IPanelService));
            if (searchView) {
                searchView.toggleQueryDetails();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: Constants.FocusSearchFromResults,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(Constants.SearchViewVisibleKey, Constants.FirstMatchFocusKey),
        primary: 2048 /* CtrlCmd */ | 16 /* UpArrow */,
        handler: (accessor, args) => {
            const searchView = searchActions_1.getSearchView(accessor.get(viewlet_2.IViewletService), accessor.get(panelService_1.IPanelService));
            if (searchView) {
                searchView.focusPreviousInputBox();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: Constants.OpenMatchToSide,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(Constants.SearchViewVisibleKey, Constants.FileMatchOrMatchFocusKey),
        primary: 2048 /* CtrlCmd */ | 3 /* Enter */,
        mac: {
            primary: 256 /* WinCtrl */ | 3 /* Enter */
        },
        handler: (accessor, args) => {
            const searchView = searchActions_1.getSearchView(accessor.get(viewlet_2.IViewletService), accessor.get(panelService_1.IPanelService));
            if (searchView) {
                const tree = searchView.getControl();
                searchView.open(tree.getFocus()[0], false, true, true);
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: Constants.CancelActionId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(Constants.SearchViewVisibleKey, listService_1.WorkbenchListFocusContextKey),
        primary: 9 /* Escape */,
        handler: (accessor, args) => {
            const searchView = searchActions_1.getSearchView(accessor.get(viewlet_2.IViewletService), accessor.get(panelService_1.IPanelService));
            if (searchView) {
                searchView.cancelSearch();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: Constants.RemoveActionId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(Constants.SearchViewVisibleKey, Constants.FileMatchOrMatchFocusKey),
        primary: 20 /* Delete */,
        mac: {
            primary: 2048 /* CtrlCmd */ | 1 /* Backspace */,
        },
        handler: (accessor, args) => {
            const searchView = searchActions_1.getSearchView(accessor.get(viewlet_2.IViewletService), accessor.get(panelService_1.IPanelService));
            if (searchView) {
                const tree = searchView.getControl();
                accessor.get(instantiation_1.IInstantiationService).createInstance(searchActions_1.RemoveAction, tree, tree.getFocus()[0]).run();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: Constants.ReplaceActionId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(Constants.SearchViewVisibleKey, Constants.ReplaceActiveKey, Constants.MatchFocusKey),
        primary: 1024 /* Shift */ | 2048 /* CtrlCmd */ | 22 /* KEY_1 */,
        handler: (accessor, args) => {
            const searchView = searchActions_1.getSearchView(accessor.get(viewlet_2.IViewletService), accessor.get(panelService_1.IPanelService));
            if (searchView) {
                const tree = searchView.getControl();
                accessor.get(instantiation_1.IInstantiationService).createInstance(searchActions_1.ReplaceAction, tree, tree.getFocus()[0], searchView).run();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: Constants.ReplaceAllInFileActionId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(Constants.SearchViewVisibleKey, Constants.ReplaceActiveKey, Constants.FileFocusKey),
        primary: 1024 /* Shift */ | 2048 /* CtrlCmd */ | 22 /* KEY_1 */,
        secondary: [2048 /* CtrlCmd */ | 1024 /* Shift */ | 3 /* Enter */],
        handler: (accessor, args) => {
            const searchView = searchActions_1.getSearchView(accessor.get(viewlet_2.IViewletService), accessor.get(panelService_1.IPanelService));
            if (searchView) {
                const tree = searchView.getControl();
                accessor.get(instantiation_1.IInstantiationService).createInstance(searchActions_1.ReplaceAllAction, searchView, tree.getFocus()[0]).run();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: Constants.ReplaceAllInFolderActionId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(Constants.SearchViewVisibleKey, Constants.ReplaceActiveKey, Constants.FolderFocusKey),
        primary: 1024 /* Shift */ | 2048 /* CtrlCmd */ | 22 /* KEY_1 */,
        secondary: [2048 /* CtrlCmd */ | 1024 /* Shift */ | 3 /* Enter */],
        handler: (accessor, args) => {
            const searchView = searchActions_1.getSearchView(accessor.get(viewlet_2.IViewletService), accessor.get(panelService_1.IPanelService));
            if (searchView) {
                const tree = searchView.getControl();
                accessor.get(instantiation_1.IInstantiationService).createInstance(searchActions_1.ReplaceAllInFolderAction, tree, tree.getFocus()[0]).run();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: Constants.CloseReplaceWidgetActionId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(Constants.SearchViewVisibleKey, Constants.ReplaceInputBoxFocusedKey),
        primary: 9 /* Escape */,
        handler: (accessor, args) => {
            accessor.get(instantiation_1.IInstantiationService).createInstance(searchActions_1.CloseReplaceAction, Constants.CloseReplaceWidgetActionId, '').run();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: searchActions_1.FocusNextInputAction.ID,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(Constants.SearchViewVisibleKey, Constants.InputBoxFocusedKey),
        primary: 2048 /* CtrlCmd */ | 18 /* DownArrow */,
        handler: (accessor, args) => {
            accessor.get(instantiation_1.IInstantiationService).createInstance(searchActions_1.FocusNextInputAction, searchActions_1.FocusNextInputAction.ID, '').run();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: searchActions_1.FocusPreviousInputAction.ID,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(Constants.SearchViewVisibleKey, Constants.InputBoxFocusedKey, Constants.SearchInputBoxFocusedKey.toNegated()),
        primary: 2048 /* CtrlCmd */ | 16 /* UpArrow */,
        handler: (accessor, args) => {
            accessor.get(instantiation_1.IInstantiationService).createInstance(searchActions_1.FocusPreviousInputAction, searchActions_1.FocusPreviousInputAction.ID, '').run();
        }
    });
    actions_2.MenuRegistry.appendMenuItem(35 /* SearchContext */, {
        command: {
            id: Constants.ReplaceActionId,
            title: searchActions_1.ReplaceAction.LABEL
        },
        when: contextkey_1.ContextKeyExpr.and(Constants.ReplaceActiveKey, Constants.MatchFocusKey),
        group: 'search',
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(35 /* SearchContext */, {
        command: {
            id: Constants.ReplaceAllInFolderActionId,
            title: searchActions_1.ReplaceAllInFolderAction.LABEL
        },
        when: contextkey_1.ContextKeyExpr.and(Constants.ReplaceActiveKey, Constants.FolderFocusKey),
        group: 'search',
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(35 /* SearchContext */, {
        command: {
            id: Constants.ReplaceAllInFileActionId,
            title: searchActions_1.ReplaceAllAction.LABEL
        },
        when: contextkey_1.ContextKeyExpr.and(Constants.ReplaceActiveKey, Constants.FileFocusKey),
        group: 'search',
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(35 /* SearchContext */, {
        command: {
            id: Constants.RemoveActionId,
            title: searchActions_1.RemoveAction.LABEL
        },
        when: Constants.FileMatchOrMatchFocusKey,
        group: 'search',
        order: 2
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: Constants.CopyMatchCommandId,
        weight: 200 /* WorkbenchContrib */,
        when: Constants.FileMatchOrMatchFocusKey,
        primary: 2048 /* CtrlCmd */ | 33 /* KEY_C */,
        handler: searchActions_1.copyMatchCommand
    });
    actions_2.MenuRegistry.appendMenuItem(35 /* SearchContext */, {
        command: {
            id: Constants.CopyMatchCommandId,
            title: nls.localize('copyMatchLabel', "Copy")
        },
        when: Constants.FileMatchOrMatchFocusKey,
        group: 'search_2',
        order: 1
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: Constants.CopyPathCommandId,
        weight: 200 /* WorkbenchContrib */,
        when: Constants.FileMatchOrFolderMatchWithResourceFocusKey,
        primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 33 /* KEY_C */,
        win: {
            primary: 1024 /* Shift */ | 512 /* Alt */ | 33 /* KEY_C */
        },
        handler: searchActions_1.copyPathCommand
    });
    actions_2.MenuRegistry.appendMenuItem(35 /* SearchContext */, {
        command: {
            id: Constants.CopyPathCommandId,
            title: nls.localize('copyPathLabel', "Copy Path")
        },
        when: Constants.FileMatchOrFolderMatchWithResourceFocusKey,
        group: 'search_2',
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(35 /* SearchContext */, {
        command: {
            id: Constants.CopyAllCommandId,
            title: nls.localize('copyAllLabel', "Copy All")
        },
        when: Constants.HasSearchResults,
        group: 'search_2',
        order: 3
    });
    commands_1.CommandsRegistry.registerCommand({
        id: Constants.CopyAllCommandId,
        handler: searchActions_1.copyAllCommand
    });
    commands_1.CommandsRegistry.registerCommand({
        id: Constants.ClearSearchHistoryCommandId,
        handler: searchActions_1.clearHistoryCommand
    });
    commands_1.CommandsRegistry.registerCommand({
        id: Constants.RevealInSideBarForSearchResults,
        handler: (accessor, fileMatch) => {
            const viewletService = accessor.get(viewlet_2.IViewletService);
            const explorerService = accessor.get(files_3.IExplorerService);
            const contextService = accessor.get(workspace_1.IWorkspaceContextService);
            const uri = fileMatch.resource;
            viewletService.openViewlet(files_3.VIEWLET_ID, false).then((viewlet) => {
                if (uri && contextService.isInsideWorkspace(uri)) {
                    const explorerView = viewlet.getExplorerView();
                    if (explorerView) {
                        explorerView.setExpanded(true);
                        explorerService.select(uri, true).then(() => explorerView.focus(), errors_1.onUnexpectedError);
                    }
                }
            });
        }
    });
    const RevealInSideBarForSearchResultsCommand = {
        id: Constants.RevealInSideBarForSearchResults,
        title: nls.localize('revealInSideBar', "Reveal in Explorer")
    };
    actions_2.MenuRegistry.appendMenuItem(35 /* SearchContext */, {
        command: RevealInSideBarForSearchResultsCommand,
        when: contextkey_1.ContextKeyExpr.and(Constants.FileFocusKey, Constants.HasSearchResults),
        group: 'search_3',
        order: 1
    });
    const clearSearchHistoryLabel = nls.localize('clearSearchHistoryLabel', "Clear Search History");
    const ClearSearchHistoryCommand = {
        id: Constants.ClearSearchHistoryCommandId,
        title: clearSearchHistoryLabel,
        category
    };
    actions_2.MenuRegistry.addCommand(ClearSearchHistoryCommand);
    commands_1.CommandsRegistry.registerCommand({
        id: Constants.ToggleSearchViewPositionCommandId,
        handler: (accessor) => {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const currentValue = configurationService.getValue('search').location;
            const toggleValue = currentValue === 'sidebar' ? 'panel' : 'sidebar';
            configurationService.updateValue('search.location', toggleValue);
        }
    });
    const toggleSearchViewPositionLabel = nls.localize('toggleSearchViewPositionLabel', "Toggle Search View Position");
    const ToggleSearchViewPositionCommand = {
        id: Constants.ToggleSearchViewPositionCommandId,
        title: toggleSearchViewPositionLabel,
        category
    };
    actions_2.MenuRegistry.addCommand(ToggleSearchViewPositionCommand);
    actions_2.MenuRegistry.appendMenuItem(35 /* SearchContext */, {
        command: ToggleSearchViewPositionCommand,
        when: Constants.SearchViewVisibleKey,
        group: 'search_9',
        order: 1
    });
    commands_1.CommandsRegistry.registerCommand({
        id: Constants.FocusSearchListCommandID,
        handler: searchActions_1.focusSearchListCommand
    });
    const focusSearchListCommandLabel = nls.localize('focusSearchListCommandLabel', "Focus List");
    const FocusSearchListCommand = {
        id: Constants.FocusSearchListCommandID,
        title: focusSearchListCommandLabel,
        category
    };
    actions_2.MenuRegistry.addCommand(FocusSearchListCommand);
    const searchInFolderCommand = (accessor, resource) => {
        const listService = accessor.get(listService_1.IListService);
        const viewletService = accessor.get(viewlet_2.IViewletService);
        const panelService = accessor.get(panelService_1.IPanelService);
        const fileService = accessor.get(files_1.IFileService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const resources = files_2.getMultiSelectedResources(resource, listService, accessor.get(editorService_1.IEditorService));
        return searchActions_1.openSearchView(viewletService, panelService, configurationService, true).then(searchView => {
            if (resources && resources.length && searchView) {
                return fileService.resolveAll(resources.map(resource => ({ resource }))).then(results => {
                    const folders = [];
                    results.forEach(result => {
                        if (result.success && result.stat) {
                            folders.push(result.stat.isDirectory ? result.stat.resource : resources_1.dirname(result.stat.resource));
                        }
                    });
                    searchView.searchInFolders(arrays_1.distinct(folders, folder => folder.toString()));
                });
            }
            return undefined;
        });
    };
    const FIND_IN_FOLDER_ID = 'filesExplorer.findInFolder';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: FIND_IN_FOLDER_ID,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(files_3.FilesExplorerFocusCondition, files_3.ExplorerFolderContext),
        primary: 1024 /* Shift */ | 512 /* Alt */ | 36 /* KEY_F */,
        handler: searchInFolderCommand
    });
    commands_1.CommandsRegistry.registerCommand({
        id: searchActions_1.ClearSearchResultsAction.ID,
        handler: (accessor, args) => {
            accessor.get(instantiation_1.IInstantiationService).createInstance(searchActions_1.ClearSearchResultsAction, searchActions_1.ClearSearchResultsAction.ID, '').run();
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: searchActions_1.RefreshAction.ID,
        handler: (accessor, args) => {
            accessor.get(instantiation_1.IInstantiationService).createInstance(searchActions_1.RefreshAction, searchActions_1.RefreshAction.ID, '').run();
        }
    });
    const FIND_IN_WORKSPACE_ID = 'filesExplorer.findInWorkspace';
    commands_1.CommandsRegistry.registerCommand({
        id: FIND_IN_WORKSPACE_ID,
        handler: (accessor) => {
            return searchActions_1.openSearchView(accessor.get(viewlet_2.IViewletService), accessor.get(panelService_1.IPanelService), accessor.get(configuration_1.IConfigurationService), true).then(searchView => {
                if (searchView) {
                    searchView.searchInFolders();
                }
            });
        }
    });
    actions_2.MenuRegistry.appendMenuItem(11 /* ExplorerContext */, {
        group: '4_search',
        order: 10,
        command: {
            id: FIND_IN_FOLDER_ID,
            title: nls.localize('findInFolder', "Find in Folder...")
        },
        when: contextkey_1.ContextKeyExpr.and(files_3.ExplorerFolderContext)
    });
    actions_2.MenuRegistry.appendMenuItem(11 /* ExplorerContext */, {
        group: '4_search',
        order: 10,
        command: {
            id: FIND_IN_WORKSPACE_ID,
            title: nls.localize('findInWorkspace', "Find in Workspace...")
        },
        when: contextkey_1.ContextKeyExpr.and(files_3.ExplorerRootContext, files_3.ExplorerFolderContext.toNegated())
    });
    let ShowAllSymbolsAction = class ShowAllSymbolsAction extends actions_1.Action {
        constructor(actionId, actionLabel, quickOpenService, editorService) {
            super(actionId, actionLabel);
            this.quickOpenService = quickOpenService;
            this.editorService = editorService;
            this.enabled = !!this.quickOpenService;
        }
        run(context) {
            let prefix = ShowAllSymbolsAction.ALL_SYMBOLS_PREFIX;
            let inputSelection = undefined;
            const editor = this.editorService.getFocusedCodeEditor();
            const word = editor && findController_1.getSelectionSearchString(editor);
            if (word) {
                prefix = prefix + word;
                inputSelection = { start: 1, end: word.length + 1 };
            }
            this.quickOpenService.show(prefix, { inputSelection });
            return Promise.resolve(undefined);
        }
    };
    ShowAllSymbolsAction.ID = 'workbench.action.showAllSymbols';
    ShowAllSymbolsAction.LABEL = nls.localize('showTriggerActions', "Go to Symbol in Workspace...");
    ShowAllSymbolsAction.ALL_SYMBOLS_PREFIX = '#';
    ShowAllSymbolsAction = __decorate([
        __param(2, quickOpen_1.IQuickOpenService),
        __param(3, codeEditorService_1.ICodeEditorService)
    ], ShowAllSymbolsAction);
    platform_1.Registry.as(viewlet_1.Extensions.Viewlets).registerViewlet(new viewlet_1.ViewletDescriptor(searchViewlet_1.SearchViewlet, search_2.VIEWLET_ID, nls.localize('name', "Search"), 'search', 1));
    platform_1.Registry.as(panel_1.Extensions.Panels).registerPanel(new panel_1.PanelDescriptor(searchPanel_1.SearchPanel, search_2.PANEL_ID, nls.localize('name', "Search"), 'search', 10));
    let RegisterSearchViewContribution = class RegisterSearchViewContribution {
        constructor(viewletService, panelService, configurationService) {
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            const updateSearchViewLocation = (open) => {
                const config = configurationService.getValue();
                if (config.search.location === 'panel') {
                    viewsRegistry.deregisterViews(viewsRegistry.getViews(search_2.VIEW_CONTAINER), search_2.VIEW_CONTAINER);
                    platform_1.Registry.as(panel_1.Extensions.Panels).registerPanel(new panel_1.PanelDescriptor(searchPanel_1.SearchPanel, search_2.PANEL_ID, nls.localize('name', "Search"), 'search', 10));
                    if (open) {
                        panelService.openPanel(search_2.PANEL_ID);
                    }
                }
                else {
                    platform_1.Registry.as(panel_1.Extensions.Panels).deregisterPanel(search_2.PANEL_ID);
                    viewsRegistry.registerViews([{ id: search_2.VIEW_ID, name: nls.localize('search', "Search"), ctorDescriptor: { ctor: searchView_1.SearchView }, canToggleVisibility: false }], search_2.VIEW_CONTAINER);
                    if (open) {
                        viewletService.openViewlet(search_2.VIEWLET_ID);
                    }
                }
            };
            configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('search.location')) {
                    updateSearchViewLocation(true);
                }
            });
            updateSearchViewLocation(false);
        }
    };
    RegisterSearchViewContribution = __decorate([
        __param(0, viewlet_2.IViewletService),
        __param(1, panelService_1.IPanelService),
        __param(2, configuration_1.IConfigurationService)
    ], RegisterSearchViewContribution);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(RegisterSearchViewContribution, 1 /* Starting */);
    // Actions
    const registry = platform_1.Registry.as(actions_3.Extensions.WorkbenchActions);
    // Show Search and Find in Files are redundant, but we can't break keybindings by removing one. So it's the same action, same keybinding, registered to different IDs.
    // Show Search 'when' is redundant but if the two conflict with exactly the same keybinding and 'when' clause, then they can show up as "unbound" - #51780
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(searchActions_1.OpenSearchViewletAction, search_2.VIEWLET_ID, searchActions_1.OpenSearchViewletAction.LABEL, { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 36 /* KEY_F */ }, Constants.SearchViewVisibleKey.toNegated()), 'View: Show Search', nls.localize('view', "View"));
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: Constants.FindInFilesActionId,
        weight: 200 /* WorkbenchContrib */,
        when: null,
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 36 /* KEY_F */,
        handler: searchActions_1.FindInFilesCommand
    });
    actions_2.MenuRegistry.appendMenuItem(0 /* CommandPalette */, { command: { id: Constants.FindInFilesActionId, title: { value: nls.localize('findInFiles', "Find in Files"), original: 'Find in Files' }, category } });
    actions_2.MenuRegistry.appendMenuItem(14 /* MenubarEditMenu */, {
        group: '4_find_global',
        command: {
            id: Constants.FindInFilesActionId,
            title: nls.localize({ key: 'miFindInFiles', comment: ['&& denotes a mnemonic'] }, "Find &&in Files")
        },
        order: 1
    });
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(searchActions_1.FocusNextSearchResultAction, searchActions_1.FocusNextSearchResultAction.ID, searchActions_1.FocusNextSearchResultAction.LABEL, { primary: 62 /* F4 */ }, contextkey_1.ContextKeyExpr.and(Constants.HasSearchResults)), 'Focus Next Search Result', category);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(searchActions_1.FocusPreviousSearchResultAction, searchActions_1.FocusPreviousSearchResultAction.ID, searchActions_1.FocusPreviousSearchResultAction.LABEL, { primary: 1024 /* Shift */ | 62 /* F4 */ }, contextkey_1.ContextKeyExpr.and(Constants.HasSearchResults)), 'Focus Previous Search Result', category);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(searchActions_1.ReplaceInFilesAction, searchActions_1.ReplaceInFilesAction.ID, searchActions_1.ReplaceInFilesAction.LABEL, { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 38 /* KEY_H */ }), 'Replace in Files', category);
    actions_2.MenuRegistry.appendMenuItem(14 /* MenubarEditMenu */, {
        group: '4_find_global',
        command: {
            id: searchActions_1.ReplaceInFilesAction.ID,
            title: nls.localize({ key: 'miReplaceInFiles', comment: ['&& denotes a mnemonic'] }, "Replace &&in Files")
        },
        order: 2
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule(objects.assign({
        id: Constants.ToggleCaseSensitiveCommandId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(Constants.SearchViewVisibleKey, Constants.SearchViewFocusedKey, Constants.FileMatchOrFolderMatchFocusKey.toNegated()),
        handler: searchActions_1.toggleCaseSensitiveCommand
    }, findModel_1.ToggleCaseSensitiveKeybinding));
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule(objects.assign({
        id: Constants.ToggleWholeWordCommandId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(Constants.SearchViewVisibleKey, Constants.SearchViewFocusedKey),
        handler: searchActions_1.toggleWholeWordCommand
    }, findModel_1.ToggleWholeWordKeybinding));
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule(objects.assign({
        id: Constants.ToggleRegexCommandId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(Constants.SearchViewVisibleKey, Constants.SearchViewFocusedKey),
        handler: searchActions_1.toggleRegexCommand
    }, findModel_1.ToggleRegexKeybinding));
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(searchActions_1.CollapseDeepestExpandedLevelAction, searchActions_1.CollapseDeepestExpandedLevelAction.ID, searchActions_1.CollapseDeepestExpandedLevelAction.LABEL), 'Search: Collapse All', category);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(ShowAllSymbolsAction, ShowAllSymbolsAction.ID, ShowAllSymbolsAction.LABEL, { primary: 2048 /* CtrlCmd */ | 50 /* KEY_T */ }), 'Go to Symbol in Workspace...');
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(searchActions_1.RefreshAction, searchActions_1.RefreshAction.ID, searchActions_1.RefreshAction.LABEL), 'Search: Refresh', category);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(searchActions_1.ClearSearchResultsAction, searchActions_1.ClearSearchResultsAction.ID, searchActions_1.ClearSearchResultsAction.LABEL), 'Search: Clear Search Results', category);
    // Register Quick Open Handler
    platform_1.Registry.as(quickopen_2.Extensions.Quickopen).registerDefaultQuickOpenHandler(new quickopen_2.QuickOpenHandlerDescriptor(openAnythingHandler_1.OpenAnythingHandler, openAnythingHandler_1.OpenAnythingHandler.ID, '', quickopen_1.defaultQuickOpenContextKey, nls.localize('openAnythingHandlerDescription', "Go to File")));
    platform_1.Registry.as(quickopen_2.Extensions.Quickopen).registerQuickOpenHandler(new quickopen_2.QuickOpenHandlerDescriptor(openSymbolHandler_1.OpenSymbolHandler, openSymbolHandler_1.OpenSymbolHandler.ID, ShowAllSymbolsAction.ALL_SYMBOLS_PREFIX, 'inWorkspaceSymbolsPicker', [
        {
            prefix: ShowAllSymbolsAction.ALL_SYMBOLS_PREFIX,
            needsEditor: false,
            description: nls.localize('openSymbolDescriptionNormal', "Go to Symbol in Workspace")
        }
    ]));
    // Configuration
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        id: 'search',
        order: 13,
        title: nls.localize('searchConfigurationTitle', "Search"),
        type: 'object',
        properties: {
            'search.exclude': {
                type: 'object',
                markdownDescription: nls.localize('exclude', "Configure glob patterns for excluding files and folders in searches. Inherits all glob patterns from the `#files.exclude#` setting. Read more about glob patterns [here](https://code.visualstudio.com/docs/editor/codebasics#_advanced-search-options)."),
                default: { '**/node_modules': true, '**/bower_components': true },
                additionalProperties: {
                    anyOf: [
                        {
                            type: 'boolean',
                            description: nls.localize('exclude.boolean', "The glob pattern to match file paths against. Set to true or false to enable or disable the pattern."),
                        },
                        {
                            type: 'object',
                            properties: {
                                when: {
                                    type: 'string',
                                    pattern: '\\w*\\$\\(basename\\)\\w*',
                                    default: '$(basename).ext',
                                    description: nls.localize('exclude.when', 'Additional check on the siblings of a matching file. Use $(basename) as variable for the matching file name.')
                                }
                            }
                        }
                    ]
                },
                scope: 4 /* RESOURCE */
            },
            'search.useRipgrep': {
                type: 'boolean',
                description: nls.localize('useRipgrep', "This setting is deprecated and now falls back on \"search.usePCRE2\"."),
                deprecationMessage: nls.localize('useRipgrepDeprecated', "Deprecated. Consider \"search.usePCRE2\" for advanced regex feature support."),
                default: true
            },
            'search.maintainFileSearchCache': {
                type: 'boolean',
                description: nls.localize('search.maintainFileSearchCache', "When enabled, the searchService process will be kept alive instead of being shut down after an hour of inactivity. This will keep the file search cache in memory."),
                default: false
            },
            'search.useIgnoreFiles': {
                type: 'boolean',
                markdownDescription: nls.localize('useIgnoreFiles', "Controls whether to use `.gitignore` and `.ignore` files when searching for files."),
                default: true,
                scope: 4 /* RESOURCE */
            },
            'search.useGlobalIgnoreFiles': {
                type: 'boolean',
                markdownDescription: nls.localize('useGlobalIgnoreFiles', "Controls whether to use global `.gitignore` and `.ignore` files when searching for files."),
                default: false,
                scope: 4 /* RESOURCE */
            },
            'search.quickOpen.includeSymbols': {
                type: 'boolean',
                description: nls.localize('search.quickOpen.includeSymbols', "Whether to include results from a global symbol search in the file results for Quick Open."),
                default: false
            },
            'search.quickOpen.includeHistory': {
                type: 'boolean',
                description: nls.localize('search.quickOpen.includeHistory', "Whether to include results from recently opened files in the file results for Quick Open."),
                default: true
            },
            'search.followSymlinks': {
                type: 'boolean',
                description: nls.localize('search.followSymlinks', "Controls whether to follow symlinks while searching."),
                default: true
            },
            'search.smartCase': {
                type: 'boolean',
                description: nls.localize('search.smartCase', "Search case-insensitively if the pattern is all lowercase, otherwise, search case-sensitively."),
                default: false
            },
            'search.globalFindClipboard': {
                type: 'boolean',
                default: false,
                description: nls.localize('search.globalFindClipboard', "Controls whether the search view should read or modify the shared find clipboard on macOS."),
                included: platform.isMacintosh
            },
            'search.location': {
                type: 'string',
                enum: ['sidebar', 'panel'],
                default: 'sidebar',
                description: nls.localize('search.location', "Controls whether the search will be shown as a view in the sidebar or as a panel in the panel area for more horizontal space."),
            },
            'search.collapseResults': {
                type: 'string',
                enum: ['auto', 'alwaysCollapse', 'alwaysExpand'],
                enumDescriptions: [
                    'Files with less than 10 results are expanded. Others are collapsed.',
                    '',
                    ''
                ],
                default: 'auto',
                description: nls.localize('search.collapseAllResults', "Controls whether the search results will be collapsed or expanded."),
            },
            'search.useReplacePreview': {
                type: 'boolean',
                default: true,
                description: nls.localize('search.useReplacePreview', "Controls whether to open Replace Preview when selecting or replacing a match."),
            },
            'search.showLineNumbers': {
                type: 'boolean',
                default: false,
                description: nls.localize('search.showLineNumbers', "Controls whether to show line numbers for search results."),
            },
            'search.usePCRE2': {
                type: 'boolean',
                default: false,
                description: nls.localize('search.usePCRE2', "Whether to use the PCRE2 regex engine in text search. This enables using some advanced regex features like lookahead and backreferences. However, not all PCRE2 features are supported - only features that are also supported by JavaScript."),
                deprecationMessage: nls.localize('usePCRE2Deprecated', "Deprecated. PCRE2 will be used automatically when using regex features that are only supported by PCRE2."),
            },
            'search.actionsPosition': {
                type: 'string',
                enum: ['auto', 'right'],
                enumDescriptions: [
                    nls.localize('search.actionsPositionAuto', "Position the actionbar to the right when the search view is narrow, and immediately after the content when the search view is wide."),
                    nls.localize('search.actionsPositionRight', "Always position the actionbar to the right."),
                ],
                default: 'auto',
                description: nls.localize('search.actionsPosition', "Controls the positioning of the actionbar on rows in the search view.")
            }
        }
    });
    editorExtensions_1.registerLanguageCommand('_executeWorkspaceSymbolProvider', function (accessor, args) {
        const { query } = args;
        if (typeof query !== 'string') {
            throw errors_1.illegalArgument();
        }
        return search_1.getWorkspaceSymbols(query);
    });
    // View menu
    actions_2.MenuRegistry.appendMenuItem(26 /* MenubarViewMenu */, {
        group: '3_views',
        command: {
            id: search_2.VIEWLET_ID,
            title: nls.localize({ key: 'miViewSearch', comment: ['&& denotes a mnemonic'] }, "&&Search")
        },
        order: 2
    });
    // Go to menu
    actions_2.MenuRegistry.appendMenuItem(16 /* MenubarGoMenu */, {
        group: '3_global_nav',
        command: {
            id: 'workbench.action.showAllSymbols',
            title: nls.localize({ key: 'miGotoSymbolInWorkspace', comment: ['&& denotes a mnemonic'] }, "Go to Symbol in &&Workspace...")
        },
        order: 2
    });
});
//# sourceMappingURL=search.contribution.js.map