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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/aria/aria", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/uri", "vs/editor/browser/editorBrowser", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/dialogs/common/dialogs", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/list/browser/listService", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "vs/workbench/services/search/common/search", "vs/workbench/contrib/search/common/searchHistoryService", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/workbench/browser/actions/workspaceActions", "vs/workbench/browser/labels", "vs/workbench/contrib/search/browser/patternInputWidget", "vs/workbench/contrib/search/browser/searchActions", "vs/workbench/contrib/search/browser/searchResultsView", "vs/workbench/contrib/search/browser/searchWidget", "vs/workbench/contrib/search/common/constants", "vs/workbench/contrib/search/common/queryBuilder", "vs/workbench/contrib/search/common/replace", "vs/workbench/contrib/search/common/search", "vs/workbench/contrib/search/common/searchModel", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/untitled/common/untitledEditorService", "vs/base/common/resources", "vs/platform/accessibility/common/accessibility", "vs/workbench/browser/parts/views/panelViewlet", "vs/platform/keybinding/common/keybinding", "vs/workbench/common/memento", "vs/platform/storage/common/storage", "vs/platform/opener/common/opener", "vs/css!./media/searchview"], function (require, exports, dom, keyboardEvent_1, aria, async_1, errors, event_1, iterator_1, lifecycle_1, env, strings, uri_1, editorBrowser_1, nls, menuEntryActionViewItem_1, actions_1, configuration_1, contextkey_1, contextView_1, dialogs_1, files_1, instantiation_1, listService_1, notification_1, progress_1, search_1, searchHistoryService_1, colorRegistry_1, themeService_1, workspace_1, workspaceActions_1, labels_1, patternInputWidget_1, searchActions_1, searchResultsView_1, searchWidget_1, Constants, queryBuilder_1, replace_1, search_2, searchModel_1, editorService_1, preferences_1, untitledEditorService_1, resources_1, accessibility_1, panelViewlet_1, keybinding_1, memento_1, storage_1, opener_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const $ = dom.$;
    var SearchUIState;
    (function (SearchUIState) {
        SearchUIState[SearchUIState["Idle"] = 0] = "Idle";
        SearchUIState[SearchUIState["Searching"] = 1] = "Searching";
        SearchUIState[SearchUIState["SlowSearch"] = 2] = "SlowSearch";
    })(SearchUIState || (SearchUIState = {}));
    let SearchView = class SearchView extends panelViewlet_1.ViewletPanel {
        constructor(options, fileService, editorService, progressService, notificationService, dialogService, contextViewService, instantiationService, configurationService, contextService, searchWorkbenchService, contextKeyService, replaceService, untitledEditorService, preferencesService, themeService, searchHistoryService, contextMenuService, menuService, accessibilityService, keybindingService, storageService, openerService) {
            super(Object.assign(Object.assign({}, options), { id: search_1.VIEW_ID, ariaHeaderLabel: nls.localize('searchView', "Search") }), keybindingService, contextMenuService, configurationService, contextKeyService);
            this.fileService = fileService;
            this.editorService = editorService;
            this.progressService = progressService;
            this.notificationService = notificationService;
            this.dialogService = dialogService;
            this.contextViewService = contextViewService;
            this.instantiationService = instantiationService;
            this.contextService = contextService;
            this.searchWorkbenchService = searchWorkbenchService;
            this.contextKeyService = contextKeyService;
            this.replaceService = replaceService;
            this.untitledEditorService = untitledEditorService;
            this.preferencesService = preferencesService;
            this.themeService = themeService;
            this.searchHistoryService = searchHistoryService;
            this.menuService = menuService;
            this.accessibilityService = accessibilityService;
            this.openerService = openerService;
            this.isDisposed = false;
            this.state = SearchUIState.Idle;
            this.actions = [];
            this.contextMenu = null;
            this.messageDisposables = [];
            this.changedWhileHidden = false;
            this.currentSearchQ = Promise.resolve();
            this.addClickEvents = (element, handler) => {
                this.messageDisposables.push(dom.addDisposableListener(element, dom.EventType.CLICK, handler));
                this.messageDisposables.push(dom.addDisposableListener(element, dom.EventType.KEY_DOWN, e => {
                    const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                    let eventHandled = true;
                    if (event.equals(10 /* Space */) || event.equals(3 /* Enter */)) {
                        handler(e);
                    }
                    else {
                        eventHandled = false;
                    }
                    if (eventHandled) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                }));
            };
            this.onOpenSettings = (e) => {
                dom.EventHelper.stop(e, false);
                this.openSettings('.exclude');
            };
            this.onLearnMore = (e) => {
                dom.EventHelper.stop(e, false);
                this.openerService.open(uri_1.URI.parse('https://go.microsoft.com/fwlink/?linkid=853977'));
            };
            this.viewletVisible = Constants.SearchViewVisibleKey.bindTo(contextKeyService);
            this.viewletFocused = Constants.SearchViewFocusedKey.bindTo(contextKeyService);
            this.inputBoxFocused = Constants.InputBoxFocusedKey.bindTo(this.contextKeyService);
            this.inputPatternIncludesFocused = Constants.PatternIncludesFocusedKey.bindTo(this.contextKeyService);
            this.inputPatternExclusionsFocused = Constants.PatternExcludesFocusedKey.bindTo(this.contextKeyService);
            this.firstMatchFocused = Constants.FirstMatchFocusKey.bindTo(contextKeyService);
            this.fileMatchOrMatchFocused = Constants.FileMatchOrMatchFocusKey.bindTo(contextKeyService);
            this.fileMatchOrFolderMatchFocus = Constants.FileMatchOrFolderMatchFocusKey.bindTo(contextKeyService);
            this.fileMatchOrFolderMatchWithResourceFocus = Constants.FileMatchOrFolderMatchWithResourceFocusKey.bindTo(contextKeyService);
            this.fileMatchFocused = Constants.FileFocusKey.bindTo(contextKeyService);
            this.folderMatchFocused = Constants.FolderFocusKey.bindTo(contextKeyService);
            this.matchFocused = Constants.MatchFocusKey.bindTo(this.contextKeyService);
            this.hasSearchResultsKey = Constants.HasSearchResults.bindTo(this.contextKeyService);
            this.viewModel = this._register(this.searchWorkbenchService.searchModel);
            this.queryBuilder = this.instantiationService.createInstance(queryBuilder_1.QueryBuilder);
            this.memento = new memento_1.Memento(this.id, storageService);
            this.viewletState = this.memento.getMemento(1 /* WORKSPACE */);
            this._register(this.fileService.onFileChanges(e => this.onFilesChanged(e)));
            this._register(this.untitledEditorService.onDidChangeDirty(e => this.onUntitledDidChangeDirty(e)));
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.onDidChangeWorkbenchState()));
            this._register(this.searchHistoryService.onDidClearHistory(() => this.clearHistory()));
            this.delayedRefresh = this._register(new async_1.Delayer(250));
            this.actions = [
                this._register(this.instantiationService.createInstance(searchActions_1.ClearSearchResultsAction, searchActions_1.ClearSearchResultsAction.ID, searchActions_1.ClearSearchResultsAction.LABEL)),
                this._register(this.instantiationService.createInstance(searchActions_1.CollapseDeepestExpandedLevelAction, searchActions_1.CollapseDeepestExpandedLevelAction.ID, searchActions_1.CollapseDeepestExpandedLevelAction.LABEL))
            ];
            this.refreshAction = this._register(this.instantiationService.createInstance(searchActions_1.RefreshAction, searchActions_1.RefreshAction.ID, searchActions_1.RefreshAction.LABEL));
            this.cancelAction = this._register(this.instantiationService.createInstance(searchActions_1.CancelSearchAction, searchActions_1.CancelSearchAction.ID, searchActions_1.CancelSearchAction.LABEL));
        }
        getContainer() {
            return this.container;
        }
        get searchResult() {
            return this.viewModel && this.viewModel.searchResult;
        }
        onDidChangeWorkbenchState() {
            if (this.contextService.getWorkbenchState() !== 1 /* EMPTY */ && this.searchWithoutFolderMessageElement) {
                dom.hide(this.searchWithoutFolderMessageElement);
            }
        }
        renderBody(parent) {
            this.container = dom.append(parent, dom.$('.search-view'));
            this.searchWidgetsContainerElement = dom.append(this.container, $('.search-widgets-container'));
            this.createSearchWidget(this.searchWidgetsContainerElement);
            const history = this.searchHistoryService.load();
            const filePatterns = this.viewletState['query.filePatterns'] || '';
            const patternExclusions = this.viewletState['query.folderExclusions'] || '';
            const patternExclusionsHistory = history.exclude || [];
            const patternIncludes = this.viewletState['query.folderIncludes'] || '';
            const patternIncludesHistory = history.include || [];
            const queryDetailsExpanded = this.viewletState['query.queryDetailsExpanded'] || '';
            const useExcludesAndIgnoreFiles = typeof this.viewletState['query.useExcludesAndIgnoreFiles'] === 'boolean' ?
                this.viewletState['query.useExcludesAndIgnoreFiles'] : true;
            this.queryDetails = dom.append(this.searchWidgetsContainerElement, $('.query-details'));
            // Toggle query details button
            this.toggleQueryDetailsButton = dom.append(this.queryDetails, $('.more.codicon.codicon-ellipsis', { tabindex: 0, role: 'button', title: nls.localize('moreSearch', "Toggle Search Details") }));
            this._register(dom.addDisposableListener(this.toggleQueryDetailsButton, dom.EventType.CLICK, e => {
                dom.EventHelper.stop(e);
                this.toggleQueryDetails(!this.isScreenReaderOptimized());
            }));
            this._register(dom.addDisposableListener(this.toggleQueryDetailsButton, dom.EventType.KEY_UP, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(3 /* Enter */) || event.equals(10 /* Space */)) {
                    dom.EventHelper.stop(e);
                    this.toggleQueryDetails(false);
                }
            }));
            this._register(dom.addDisposableListener(this.toggleQueryDetailsButton, dom.EventType.KEY_DOWN, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(1024 /* Shift */ | 2 /* Tab */)) {
                    if (this.searchWidget.isReplaceActive()) {
                        this.searchWidget.focusReplaceAllAction();
                    }
                    else {
                        this.searchWidget.isReplaceShown() ? this.searchWidget.replaceInput.focusOnPreserve() : this.searchWidget.focusRegexAction();
                    }
                    dom.EventHelper.stop(e);
                }
            }));
            // folder includes list
            const folderIncludesList = dom.append(this.queryDetails, $('.file-types.includes'));
            const filesToIncludeTitle = nls.localize('searchScope.includes', "files to include");
            dom.append(folderIncludesList, $('h4', undefined, filesToIncludeTitle));
            this.inputPatternIncludes = this._register(this.instantiationService.createInstance(patternInputWidget_1.PatternInputWidget, folderIncludesList, this.contextViewService, {
                ariaLabel: nls.localize('label.includes', 'Search Include Patterns'),
                history: patternIncludesHistory,
            }));
            this.inputPatternIncludes.setValue(patternIncludes);
            this.inputPatternIncludes.onSubmit(() => this.onQueryChanged(true));
            this.inputPatternIncludes.onCancel(() => this.viewModel.cancelSearch()); // Cancel search without focusing the search widget
            this.trackInputBox(this.inputPatternIncludes.inputFocusTracker, this.inputPatternIncludesFocused);
            // excludes list
            const excludesList = dom.append(this.queryDetails, $('.file-types.excludes'));
            const excludesTitle = nls.localize('searchScope.excludes', "files to exclude");
            dom.append(excludesList, $('h4', undefined, excludesTitle));
            this.inputPatternExcludes = this._register(this.instantiationService.createInstance(patternInputWidget_1.ExcludePatternInputWidget, excludesList, this.contextViewService, {
                ariaLabel: nls.localize('label.excludes', 'Search Exclude Patterns'),
                history: patternExclusionsHistory,
            }));
            this.inputPatternExcludes.setValue(patternExclusions);
            this.inputPatternExcludes.setUseExcludesAndIgnoreFiles(useExcludesAndIgnoreFiles);
            this.inputPatternExcludes.onSubmit(() => this.onQueryChanged(true));
            this.inputPatternExcludes.onCancel(() => this.viewModel.cancelSearch()); // Cancel search without focusing the search widget
            this.trackInputBox(this.inputPatternExcludes.inputFocusTracker, this.inputPatternExclusionsFocused);
            this.messagesElement = dom.append(this.container, $('.messages'));
            if (this.contextService.getWorkbenchState() === 1 /* EMPTY */) {
                this.showSearchWithoutFolderMessage();
            }
            this.createSearchResultsView(this.container);
            if (filePatterns !== '' || patternExclusions !== '' || patternIncludes !== '' || queryDetailsExpanded !== '' || !useExcludesAndIgnoreFiles) {
                this.toggleQueryDetails(true, true, true);
            }
            this._register(this.viewModel.searchResult.onChange((event) => this.onSearchResultsChanged(event)));
            this._register(this.searchWidget.searchInput.onInput(() => this.updateActions()));
            this._register(this.searchWidget.replaceInput.onInput(() => this.updateActions()));
            this._register(this.onDidFocus(() => this.viewletFocused.set(true)));
            this._register(this.onDidBlur(() => this.viewletFocused.set(false)));
            this._register(this.onDidChangeBodyVisibility(visible => this.onVisibilityChanged(visible)));
        }
        onVisibilityChanged(visible) {
            this.viewletVisible.set(visible);
            if (visible) {
                if (this.changedWhileHidden) {
                    // Render if results changed while viewlet was hidden - #37818
                    this.refreshAndUpdateCount();
                    this.changedWhileHidden = false;
                }
            }
            // Enable highlights if there are searchresults
            if (this.viewModel) {
                this.viewModel.searchResult.toggleHighlights(visible);
            }
        }
        get searchAndReplaceWidget() {
            return this.searchWidget;
        }
        get searchIncludePattern() {
            return this.inputPatternIncludes;
        }
        get searchExcludePattern() {
            return this.inputPatternExcludes;
        }
        /**
         * Warning: a bit expensive due to updating the view title
         */
        updateActions() {
            for (const action of this.actions) {
                action.update();
            }
            this.refreshAction.update();
            this.cancelAction.update();
            super.updateActions();
        }
        isScreenReaderOptimized() {
            const detected = this.accessibilityService.getAccessibilitySupport() === 2 /* Enabled */;
            const config = this.configurationService.getValue('editor').accessibilitySupport;
            return config === 'on' || (config === 'auto' && detected);
        }
        createSearchWidget(container) {
            const contentPattern = this.viewletState['query.contentPattern'] || '';
            const replaceText = this.viewletState['query.replaceText'] || '';
            const isRegex = this.viewletState['query.regex'] === true;
            const isWholeWords = this.viewletState['query.wholeWords'] === true;
            const isCaseSensitive = this.viewletState['query.caseSensitive'] === true;
            const history = this.searchHistoryService.load();
            const searchHistory = history.search || this.viewletState['query.searchHistory'] || [];
            const replaceHistory = history.replace || this.viewletState['query.replaceHistory'] || [];
            const showReplace = typeof this.viewletState['view.showReplace'] === 'boolean' ? this.viewletState['view.showReplace'] : true;
            const preserveCase = this.viewletState['query.preserveCase'] === true;
            this.searchWidget = this._register(this.instantiationService.createInstance(searchWidget_1.SearchWidget, container, {
                value: contentPattern,
                replaceValue: replaceText,
                isRegex: isRegex,
                isCaseSensitive: isCaseSensitive,
                isWholeWords: isWholeWords,
                searchHistory: searchHistory,
                replaceHistory: replaceHistory,
                preserveCase: preserveCase
            }));
            if (showReplace) {
                this.searchWidget.toggleReplace(true);
            }
            this._register(this.searchWidget.onSearchSubmit(() => this.onQueryChanged()));
            this._register(this.searchWidget.onSearchCancel(() => this.cancelSearch()));
            this._register(this.searchWidget.searchInput.onDidOptionChange(() => this.onQueryChanged(true)));
            this._register(this.searchWidget.onDidHeightChange(() => this.reLayout()));
            this._register(this.searchWidget.onReplaceToggled(() => this.reLayout()));
            this._register(this.searchWidget.onReplaceStateChange((state) => {
                this.viewModel.replaceActive = state;
                this.refreshTree();
            }));
            this._register(this.searchWidget.onPreserveCaseChange((state) => {
                this.viewModel.preserveCase = state;
                this.refreshTree();
            }));
            this._register(this.searchWidget.onReplaceValueChanged((value) => {
                this.viewModel.replaceString = this.searchWidget.getReplaceValue();
                this.delayedRefresh.trigger(() => this.refreshTree());
            }));
            this._register(this.searchWidget.onBlur(() => {
                this.toggleQueryDetailsButton.focus();
            }));
            this._register(this.searchWidget.onReplaceAll(() => this.replaceAll()));
            this.trackInputBox(this.searchWidget.searchInputFocusTracker);
            this.trackInputBox(this.searchWidget.replaceInputFocusTracker);
        }
        trackInputBox(inputFocusTracker, contextKey) {
            this._register(inputFocusTracker.onDidFocus(() => {
                this.inputBoxFocused.set(true);
                if (contextKey) {
                    contextKey.set(true);
                }
            }));
            this._register(inputFocusTracker.onDidBlur(() => {
                this.inputBoxFocused.set(this.searchWidget.searchInputHasFocus()
                    || this.searchWidget.replaceInputHasFocus()
                    || this.inputPatternIncludes.inputHasFocus()
                    || this.inputPatternExcludes.inputHasFocus());
                if (contextKey) {
                    contextKey.set(false);
                }
            }));
        }
        onSearchResultsChanged(event) {
            if (this.isVisible()) {
                return this.refreshAndUpdateCount(event);
            }
            else {
                this.changedWhileHidden = true;
            }
        }
        refreshAndUpdateCount(event) {
            this.searchWidget.setReplaceAllActionState(!this.viewModel.searchResult.isEmpty());
            this.updateSearchResultCount(this.viewModel.searchResult.query.userDisabledExcludesAndIgnoreFiles);
            return this.refreshTree(event);
        }
        refreshTree(event) {
            const collapseResults = this.configurationService.getValue('search').collapseResults;
            if (!event || event.added || event.removed) {
                // Refresh whole tree
                this.tree.setChildren(null, this.createResultIterator(collapseResults));
            }
            else {
                // FileMatch modified, refresh those elements
                event.elements.forEach(element => {
                    this.tree.setChildren(element, this.createIterator(element, collapseResults));
                    this.tree.rerender(element);
                });
            }
        }
        createResultIterator(collapseResults) {
            const folderMatches = this.searchResult.folderMatches()
                .filter(fm => !fm.isEmpty())
                .sort(searchModel_1.searchMatchComparer);
            if (folderMatches.length === 1) {
                return this.createFolderIterator(folderMatches[0], collapseResults);
            }
            const foldersIt = iterator_1.Iterator.fromArray(folderMatches);
            return iterator_1.Iterator.map(foldersIt, folderMatch => {
                const children = this.createFolderIterator(folderMatch, collapseResults);
                return { element: folderMatch, children };
            });
        }
        createFolderIterator(folderMatch, collapseResults) {
            const filesIt = iterator_1.Iterator.fromArray(folderMatch.matches()
                .sort(searchModel_1.searchMatchComparer));
            return iterator_1.Iterator.map(filesIt, fileMatch => {
                const children = this.createFileIterator(fileMatch);
                let nodeExists = true;
                try {
                    this.tree.getNode(fileMatch);
                }
                catch (e) {
                    nodeExists = false;
                }
                const collapsed = nodeExists ? undefined :
                    (collapseResults === 'alwaysCollapse' || (fileMatch.matches().length > 10 && collapseResults !== 'alwaysExpand'));
                return { element: fileMatch, children, collapsed };
            });
        }
        createFileIterator(fileMatch) {
            const matchesIt = iterator_1.Iterator.from(fileMatch.matches()
                .sort(searchModel_1.searchMatchComparer));
            return iterator_1.Iterator.map(matchesIt, r => ({ element: r }));
        }
        createIterator(match, collapseResults) {
            return match instanceof searchModel_1.SearchResult ? this.createResultIterator(collapseResults) :
                match instanceof searchModel_1.FolderMatch ? this.createFolderIterator(match, collapseResults) :
                    this.createFileIterator(match);
        }
        replaceAll() {
            if (this.viewModel.searchResult.count() === 0) {
                return;
            }
            const occurrences = this.viewModel.searchResult.count();
            const fileCount = this.viewModel.searchResult.fileCount();
            const replaceValue = this.searchWidget.getReplaceValue() || '';
            const afterReplaceAllMessage = this.buildAfterReplaceAllMessage(occurrences, fileCount, replaceValue);
            let progressComplete;
            let progressReporter;
            this.progressService.withProgress({ location: search_1.VIEWLET_ID, delay: 100, total: occurrences }, p => {
                progressReporter = p;
                return new Promise(resolve => progressComplete = resolve);
            });
            const confirmation = {
                title: nls.localize('replaceAll.confirmation.title', "Replace All"),
                message: this.buildReplaceAllConfirmationMessage(occurrences, fileCount, replaceValue),
                primaryButton: nls.localize('replaceAll.confirm.button', "&&Replace"),
                type: 'question'
            };
            this.dialogService.confirm(confirmation).then(res => {
                if (res.confirmed) {
                    this.searchWidget.setReplaceAllActionState(false);
                    this.viewModel.searchResult.replaceAll(progressReporter).then(() => {
                        progressComplete();
                        const messageEl = this.clearMessage();
                        dom.append(messageEl, $('p', undefined, afterReplaceAllMessage));
                    }, (error) => {
                        progressComplete();
                        errors.isPromiseCanceledError(error);
                        this.notificationService.error(error);
                    });
                }
            });
        }
        buildAfterReplaceAllMessage(occurrences, fileCount, replaceValue) {
            if (occurrences === 1) {
                if (fileCount === 1) {
                    if (replaceValue) {
                        return nls.localize('replaceAll.occurrence.file.message', "Replaced {0} occurrence across {1} file with '{2}'.", occurrences, fileCount, replaceValue);
                    }
                    return nls.localize('removeAll.occurrence.file.message', "Replaced {0} occurrence across {1} file.", occurrences, fileCount);
                }
                if (replaceValue) {
                    return nls.localize('replaceAll.occurrence.files.message', "Replaced {0} occurrence across {1} files with '{2}'.", occurrences, fileCount, replaceValue);
                }
                return nls.localize('removeAll.occurrence.files.message', "Replaced {0} occurrence across {1} files.", occurrences, fileCount);
            }
            if (fileCount === 1) {
                if (replaceValue) {
                    return nls.localize('replaceAll.occurrences.file.message', "Replaced {0} occurrences across {1} file with '{2}'.", occurrences, fileCount, replaceValue);
                }
                return nls.localize('removeAll.occurrences.file.message', "Replaced {0} occurrences across {1} file.", occurrences, fileCount);
            }
            if (replaceValue) {
                return nls.localize('replaceAll.occurrences.files.message', "Replaced {0} occurrences across {1} files with '{2}'.", occurrences, fileCount, replaceValue);
            }
            return nls.localize('removeAll.occurrences.files.message', "Replaced {0} occurrences across {1} files.", occurrences, fileCount);
        }
        buildReplaceAllConfirmationMessage(occurrences, fileCount, replaceValue) {
            if (occurrences === 1) {
                if (fileCount === 1) {
                    if (replaceValue) {
                        return nls.localize('removeAll.occurrence.file.confirmation.message', "Replace {0} occurrence across {1} file with '{2}'?", occurrences, fileCount, replaceValue);
                    }
                    return nls.localize('replaceAll.occurrence.file.confirmation.message', "Replace {0} occurrence across {1} file?", occurrences, fileCount);
                }
                if (replaceValue) {
                    return nls.localize('removeAll.occurrence.files.confirmation.message', "Replace {0} occurrence across {1} files with '{2}'?", occurrences, fileCount, replaceValue);
                }
                return nls.localize('replaceAll.occurrence.files.confirmation.message', "Replace {0} occurrence across {1} files?", occurrences, fileCount);
            }
            if (fileCount === 1) {
                if (replaceValue) {
                    return nls.localize('removeAll.occurrences.file.confirmation.message', "Replace {0} occurrences across {1} file with '{2}'?", occurrences, fileCount, replaceValue);
                }
                return nls.localize('replaceAll.occurrences.file.confirmation.message', "Replace {0} occurrences across {1} file?", occurrences, fileCount);
            }
            if (replaceValue) {
                return nls.localize('removeAll.occurrences.files.confirmation.message', "Replace {0} occurrences across {1} files with '{2}'?", occurrences, fileCount, replaceValue);
            }
            return nls.localize('replaceAll.occurrences.files.confirmation.message', "Replace {0} occurrences across {1} files?", occurrences, fileCount);
        }
        clearMessage() {
            this.searchWithoutFolderMessageElement = undefined;
            dom.clearNode(this.messagesElement);
            dom.show(this.messagesElement);
            lifecycle_1.dispose(this.messageDisposables);
            this.messageDisposables = [];
            return dom.append(this.messagesElement, $('.message'));
        }
        createSearchResultsView(container) {
            this.resultsElement = dom.append(container, $('.results.show-file-icons'));
            const delegate = this.instantiationService.createInstance(searchResultsView_1.SearchDelegate);
            const identityProvider = {
                getId(element) {
                    return element.id();
                }
            };
            this.treeLabels = this._register(this.instantiationService.createInstance(labels_1.ResourceLabels, { onDidChangeVisibility: this.onDidChangeBodyVisibility }));
            this.tree = this._register(this.instantiationService.createInstance(listService_1.WorkbenchObjectTree, 'SearchView', this.resultsElement, delegate, [
                this._register(this.instantiationService.createInstance(searchResultsView_1.FolderMatchRenderer, this.viewModel, this, this.treeLabels)),
                this._register(this.instantiationService.createInstance(searchResultsView_1.FileMatchRenderer, this.viewModel, this, this.treeLabels)),
                this._register(this.instantiationService.createInstance(searchResultsView_1.MatchRenderer, this.viewModel, this)),
            ], {
                identityProvider,
                accessibilityProvider: this.instantiationService.createInstance(searchResultsView_1.SearchAccessibilityProvider, this.viewModel),
                dnd: this.instantiationService.createInstance(searchResultsView_1.SearchDND),
                multipleSelectionSupport: false
            }));
            this._register(this.tree.onContextMenu(e => this.onContextMenu(e)));
            const resourceNavigator = this._register(new listService_1.TreeResourceNavigator2(this.tree, { openOnFocus: true, openOnSelection: false }));
            this._register(event_1.Event.debounce(resourceNavigator.onDidOpenResource, (last, event) => event, 75, true)(options => {
                if (options.element instanceof searchModel_1.Match) {
                    const selectedMatch = options.element;
                    if (this.currentSelectedFileMatch) {
                        this.currentSelectedFileMatch.setSelectedMatch(null);
                    }
                    this.currentSelectedFileMatch = selectedMatch.parent();
                    this.currentSelectedFileMatch.setSelectedMatch(selectedMatch);
                    this.onFocus(selectedMatch, options.editorOptions.preserveFocus, options.sideBySide, options.editorOptions.pinned);
                }
            }));
            this._register(event_1.Event.any(this.tree.onDidFocus, this.tree.onDidChangeFocus)(() => {
                if (this.tree.isDOMFocused()) {
                    const focus = this.tree.getFocus()[0];
                    this.firstMatchFocused.set(this.tree.navigate().first() === focus);
                    this.fileMatchOrMatchFocused.set(!!focus);
                    this.fileMatchFocused.set(focus instanceof searchModel_1.FileMatch);
                    this.folderMatchFocused.set(focus instanceof searchModel_1.FolderMatch);
                    this.matchFocused.set(focus instanceof searchModel_1.Match);
                    this.fileMatchOrFolderMatchFocus.set(focus instanceof searchModel_1.FileMatch || focus instanceof searchModel_1.FolderMatch);
                    this.fileMatchOrFolderMatchWithResourceFocus.set(focus instanceof searchModel_1.FileMatch || focus instanceof searchModel_1.FolderMatchWithResource);
                }
            }));
            this._register(this.tree.onDidBlur(e => {
                this.firstMatchFocused.reset();
                this.fileMatchOrMatchFocused.reset();
                this.fileMatchFocused.reset();
                this.folderMatchFocused.reset();
                this.matchFocused.reset();
                this.fileMatchOrFolderMatchFocus.reset();
                this.fileMatchOrFolderMatchWithResourceFocus.reset();
            }));
        }
        onContextMenu(e) {
            if (!this.contextMenu) {
                this.contextMenu = this._register(this.menuService.createMenu(35 /* SearchContext */, this.contextKeyService));
            }
            e.browserEvent.preventDefault();
            e.browserEvent.stopPropagation();
            const actions = [];
            const actionsDisposable = menuEntryActionViewItem_1.createAndFillInContextMenuActions(this.contextMenu, { shouldForwardArgs: true }, actions, this.contextMenuService);
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => actions,
                getActionsContext: () => e.element,
                onHide: () => lifecycle_1.dispose(actionsDisposable)
            });
        }
        selectNextMatch() {
            const [selected] = this.tree.getSelection();
            // Expand the initial selected node, if needed
            if (selected && !(selected instanceof searchModel_1.Match)) {
                if (this.tree.isCollapsed(selected)) {
                    this.tree.expand(selected);
                }
            }
            let navigator = this.tree.navigate(selected);
            let next = navigator.next();
            if (!next) {
                next = navigator.first();
            }
            // Expand until first child is a Match
            while (!(next instanceof searchModel_1.Match)) {
                if (this.tree.isCollapsed(next)) {
                    this.tree.expand(next);
                }
                // Select the first child
                next = navigator.next();
            }
            // Reveal the newly selected element
            if (next) {
                if (next === selected) {
                    this.tree.setFocus([]);
                }
                this.tree.setFocus([next], listService_1.getSelectionKeyboardEvent(undefined, false));
                this.tree.reveal(next);
            }
        }
        selectPreviousMatch() {
            const [selected] = this.tree.getSelection();
            let navigator = this.tree.navigate(selected);
            let prev = navigator.previous();
            // Select previous until find a Match or a collapsed item
            while (!prev || (!(prev instanceof searchModel_1.Match) && !this.tree.isCollapsed(prev))) {
                prev = prev ? navigator.previous() : navigator.last();
            }
            // Expand until last child is a Match
            while (!(prev instanceof searchModel_1.Match)) {
                const nextItem = navigator.next();
                this.tree.expand(prev);
                navigator = this.tree.navigate(nextItem); // recreate navigator because modifying the tree can invalidate it
                prev = nextItem ? navigator.previous() : navigator.last(); // select last child
            }
            // Reveal the newly selected element
            if (prev) {
                if (prev === selected) {
                    this.tree.setFocus([]);
                }
                this.tree.setFocus([prev], listService_1.getSelectionKeyboardEvent(undefined, false));
                this.tree.reveal(prev);
            }
        }
        moveFocusToResults() {
            this.tree.domFocus();
        }
        focus() {
            super.focus();
            const updatedText = this.updateTextFromSelection();
            this.searchWidget.focus(undefined, undefined, updatedText);
        }
        updateTextFromSelection(allowUnselectedWord = true) {
            let updatedText = false;
            const seedSearchStringFromSelection = this.configurationService.getValue('editor').find.seedSearchStringFromSelection;
            if (seedSearchStringFromSelection) {
                let selectedText = this.getSearchTextFromEditor(allowUnselectedWord);
                if (selectedText) {
                    if (this.searchWidget.searchInput.getRegex()) {
                        selectedText = strings.escapeRegExpCharacters(selectedText);
                    }
                    this.searchWidget.searchInput.setValue(selectedText);
                    updatedText = true;
                }
            }
            return updatedText;
        }
        focusNextInputBox() {
            if (this.searchWidget.searchInputHasFocus()) {
                if (this.searchWidget.isReplaceShown()) {
                    this.searchWidget.focus(true, true);
                }
                else {
                    this.moveFocusFromSearchOrReplace();
                }
                return;
            }
            if (this.searchWidget.replaceInputHasFocus()) {
                this.moveFocusFromSearchOrReplace();
                return;
            }
            if (this.inputPatternIncludes.inputHasFocus()) {
                this.inputPatternExcludes.focus();
                this.inputPatternExcludes.select();
                return;
            }
            if (this.inputPatternExcludes.inputHasFocus()) {
                this.selectTreeIfNotSelected();
                return;
            }
        }
        moveFocusFromSearchOrReplace() {
            if (this.showsFileTypes()) {
                this.toggleQueryDetails(true, this.showsFileTypes());
            }
            else {
                this.selectTreeIfNotSelected();
            }
        }
        focusPreviousInputBox() {
            if (this.searchWidget.searchInputHasFocus()) {
                return;
            }
            if (this.searchWidget.replaceInputHasFocus()) {
                this.searchWidget.focus(true);
                return;
            }
            if (this.inputPatternIncludes.inputHasFocus()) {
                this.searchWidget.focus(true, true);
                return;
            }
            if (this.inputPatternExcludes.inputHasFocus()) {
                this.inputPatternIncludes.focus();
                this.inputPatternIncludes.select();
                return;
            }
            if (this.tree.isDOMFocused()) {
                this.moveFocusFromResults();
                return;
            }
        }
        moveFocusFromResults() {
            if (this.showsFileTypes()) {
                this.toggleQueryDetails(true, true, false, true);
            }
            else {
                this.searchWidget.focus(true, true);
            }
        }
        reLayout() {
            if (this.isDisposed) {
                return;
            }
            const actionsPosition = this.configurationService.getValue('search').actionsPosition;
            dom.toggleClass(this.getContainer(), SearchView.ACTIONS_RIGHT_CLASS_NAME, actionsPosition === 'right');
            dom.toggleClass(this.getContainer(), SearchView.WIDE_CLASS_NAME, this.size.width >= SearchView.WIDE_VIEW_SIZE);
            this.searchWidget.setWidth(this.size.width - 28 /* container margin */);
            this.inputPatternExcludes.setWidth(this.size.width - 28 /* container margin */);
            this.inputPatternIncludes.setWidth(this.size.width - 28 /* container margin */);
            const messagesSize = this.messagesElement.style.display === 'none' ?
                0 :
                dom.getTotalHeight(this.messagesElement);
            const searchResultContainerHeight = this.size.height -
                messagesSize -
                dom.getTotalHeight(this.searchWidgetsContainerElement);
            this.resultsElement.style.height = searchResultContainerHeight + 'px';
            this.tree.layout(searchResultContainerHeight, this.size.width);
        }
        layoutBody(height, width) {
            this.size = new dom.Dimension(width, height);
            this.reLayout();
        }
        getControl() {
            return this.tree;
        }
        isSlowSearch() {
            return this.state === SearchUIState.SlowSearch;
        }
        allSearchFieldsClear() {
            return this.searchWidget.getReplaceValue() === '' &&
                this.searchWidget.searchInput.getValue() === '';
        }
        hasSearchResults() {
            return !this.viewModel.searchResult.isEmpty();
        }
        clearSearchResults() {
            this.viewModel.searchResult.clear();
            this.showEmptyStage();
            if (this.contextService.getWorkbenchState() === 1 /* EMPTY */) {
                this.showSearchWithoutFolderMessage();
            }
            this.searchWidget.clear();
            this.viewModel.cancelSearch();
            this.updateActions();
            aria.status(nls.localize('ariaSearchResultsClearStatus', "The search results have been cleared"));
        }
        cancelSearch() {
            if (this.viewModel.cancelSearch()) {
                this.searchWidget.focus();
                return true;
            }
            return false;
        }
        selectTreeIfNotSelected() {
            if (this.tree.getNode(null)) {
                this.tree.domFocus();
                const selection = this.tree.getSelection();
                if (selection.length === 0) {
                    this.tree.focusNext();
                }
            }
        }
        getSearchTextFromEditor(allowUnselectedWord) {
            if (!this.editorService.activeEditor) {
                return null;
            }
            if (dom.isAncestor(document.activeElement, this.getContainer())) {
                return null;
            }
            let activeTextEditorWidget = this.editorService.activeTextEditorWidget;
            if (editorBrowser_1.isDiffEditor(activeTextEditorWidget)) {
                if (activeTextEditorWidget.getOriginalEditor().hasTextFocus()) {
                    activeTextEditorWidget = activeTextEditorWidget.getOriginalEditor();
                }
                else {
                    activeTextEditorWidget = activeTextEditorWidget.getModifiedEditor();
                }
            }
            if (!editorBrowser_1.isCodeEditor(activeTextEditorWidget) || !activeTextEditorWidget.hasModel()) {
                return null;
            }
            const range = activeTextEditorWidget.getSelection();
            if (!range) {
                return null;
            }
            if (range.isEmpty() && !this.searchWidget.searchInput.getValue() && allowUnselectedWord) {
                const wordAtPosition = activeTextEditorWidget.getModel().getWordAtPosition(range.getStartPosition());
                if (wordAtPosition) {
                    return wordAtPosition.word;
                }
            }
            if (!range.isEmpty()) {
                let searchText = '';
                for (let i = range.startLineNumber; i <= range.endLineNumber; i++) {
                    let lineText = activeTextEditorWidget.getModel().getLineContent(i);
                    if (i === range.endLineNumber) {
                        lineText = lineText.substring(0, range.endColumn - 1);
                    }
                    if (i === range.startLineNumber) {
                        lineText = lineText.substring(range.startColumn - 1);
                    }
                    if (i !== range.startLineNumber) {
                        lineText = '\n' + lineText;
                    }
                    searchText += lineText;
                }
                return searchText;
            }
            return null;
        }
        showsFileTypes() {
            return dom.hasClass(this.queryDetails, 'more');
        }
        toggleCaseSensitive() {
            this.searchWidget.searchInput.setCaseSensitive(!this.searchWidget.searchInput.getCaseSensitive());
            this.onQueryChanged(true);
        }
        toggleWholeWords() {
            this.searchWidget.searchInput.setWholeWords(!this.searchWidget.searchInput.getWholeWords());
            this.onQueryChanged(true);
        }
        toggleRegex() {
            this.searchWidget.searchInput.setRegex(!this.searchWidget.searchInput.getRegex());
            this.onQueryChanged(true);
        }
        setSearchParameters(args = {}) {
            if (typeof args.isCaseSensitive === 'boolean') {
                this.searchWidget.searchInput.setCaseSensitive(args.isCaseSensitive);
            }
            if (typeof args.matchWholeWord === 'boolean') {
                this.searchWidget.searchInput.setWholeWords(args.matchWholeWord);
            }
            if (typeof args.isRegex === 'boolean') {
                this.searchWidget.searchInput.setRegex(args.isRegex);
            }
            if (typeof args.filesToInclude === 'string') {
                this.searchIncludePattern.setValue(String(args.filesToInclude));
            }
            if (typeof args.filesToExclude === 'string') {
                this.searchExcludePattern.setValue(String(args.filesToExclude));
            }
            if (typeof args.query === 'string') {
                this.searchWidget.searchInput.setValue(args.query);
            }
            if (typeof args.replace === 'string') {
                this.searchWidget.replaceInput.setValue(args.replace);
            }
            else {
                if (this.searchWidget.replaceInput.getValue() !== '') {
                    this.searchWidget.replaceInput.setValue('');
                }
            }
            if (typeof args.triggerSearch === 'boolean' && args.triggerSearch) {
                this.onQueryChanged(true);
            }
        }
        toggleQueryDetails(moveFocus = true, show, skipLayout, reverse) {
            const cls = 'more';
            show = typeof show === 'undefined' ? !dom.hasClass(this.queryDetails, cls) : Boolean(show);
            this.viewletState['query.queryDetailsExpanded'] = show;
            skipLayout = Boolean(skipLayout);
            if (show) {
                this.toggleQueryDetailsButton.setAttribute('aria-expanded', 'true');
                dom.addClass(this.queryDetails, cls);
                if (moveFocus) {
                    if (reverse) {
                        this.inputPatternExcludes.focus();
                        this.inputPatternExcludes.select();
                    }
                    else {
                        this.inputPatternIncludes.focus();
                        this.inputPatternIncludes.select();
                    }
                }
            }
            else {
                this.toggleQueryDetailsButton.setAttribute('aria-expanded', 'false');
                dom.removeClass(this.queryDetails, cls);
                if (moveFocus) {
                    this.searchWidget.focus();
                }
            }
            if (!skipLayout && this.size) {
                this.layout(this.size.height);
            }
        }
        searchInFolders(resources) {
            const folderPaths = [];
            const workspace = this.contextService.getWorkspace();
            if (resources) {
                resources.forEach(resource => {
                    let folderPath;
                    if (this.contextService.getWorkbenchState() === 2 /* FOLDER */) {
                        // Show relative path from the root for single-root mode
                        folderPath = resources_1.relativePath(workspace.folders[0].uri, resource); // always uses forward slashes
                        if (folderPath && folderPath !== '.') {
                            folderPath = './' + folderPath;
                        }
                    }
                    else {
                        const owningFolder = this.contextService.getWorkspaceFolder(resource);
                        if (owningFolder) {
                            const owningRootName = owningFolder.name;
                            // If this root is the only one with its basename, use a relative ./ path. If there is another, use an absolute path
                            const isUniqueFolder = workspace.folders.filter(folder => folder.name === owningRootName).length === 1;
                            if (isUniqueFolder) {
                                const relPath = resources_1.relativePath(owningFolder.uri, resource); // always uses forward slashes
                                if (relPath === '') {
                                    folderPath = `./${owningFolder.name}`;
                                }
                                else {
                                    folderPath = `./${owningFolder.name}/${relPath}`;
                                }
                            }
                            else {
                                folderPath = resource.fsPath; // TODO rob: handle on-file URIs
                            }
                        }
                    }
                    if (folderPath) {
                        folderPaths.push(folderPath);
                    }
                });
            }
            if (!folderPaths.length || folderPaths.some(folderPath => folderPath === '.')) {
                this.inputPatternIncludes.setValue('');
                this.searchWidget.focus();
                return;
            }
            // Show 'files to include' box
            if (!this.showsFileTypes()) {
                this.toggleQueryDetails(true, true);
            }
            this.inputPatternIncludes.setValue(folderPaths.join(', '));
            this.searchWidget.focus(false);
        }
        onQueryChanged(preserveFocus) {
            if (!this.searchWidget.searchInput.inputBox.isInputValid()) {
                return;
            }
            const isRegex = this.searchWidget.searchInput.getRegex();
            const isWholeWords = this.searchWidget.searchInput.getWholeWords();
            const isCaseSensitive = this.searchWidget.searchInput.getCaseSensitive();
            const contentPattern = this.searchWidget.searchInput.getValue();
            const excludePatternText = this.inputPatternExcludes.getValue().trim();
            const includePatternText = this.inputPatternIncludes.getValue().trim();
            const useExcludesAndIgnoreFiles = this.inputPatternExcludes.useExcludesAndIgnoreFiles();
            if (contentPattern.length === 0) {
                return;
            }
            const content = {
                pattern: contentPattern,
                isRegExp: isRegex,
                isCaseSensitive: isCaseSensitive,
                isWordMatch: isWholeWords
            };
            const excludePattern = this.inputPatternExcludes.getValue();
            const includePattern = this.inputPatternIncludes.getValue();
            // Need the full match line to correctly calculate replace text, if this is a search/replace with regex group references ($1, $2, ...).
            // 10000 chars is enough to avoid sending huge amounts of text around, if you do a replace with a longer match, it may or may not resolve the group refs correctly.
            // https://github.com/Microsoft/vscode/issues/58374
            const charsPerLine = content.isRegExp ? 10000 :
                250;
            const options = {
                _reason: 'searchView',
                extraFileResources: this.instantiationService.invokeFunction(search_2.getOutOfWorkspaceEditorResources),
                maxResults: SearchView.MAX_TEXT_RESULTS,
                disregardIgnoreFiles: !useExcludesAndIgnoreFiles || undefined,
                disregardExcludeSettings: !useExcludesAndIgnoreFiles || undefined,
                excludePattern,
                includePattern,
                previewOptions: {
                    matchLines: 1,
                    charsPerLine
                },
                isSmartCase: this.configurationService.getValue().search.smartCase,
                expandPatterns: true
            };
            const folderResources = this.contextService.getWorkspace().folders;
            const onQueryValidationError = (err) => {
                this.searchWidget.searchInput.showMessage({ content: err.message, type: 3 /* ERROR */ });
                this.viewModel.searchResult.clear();
            };
            let query;
            try {
                query = this.queryBuilder.text(content, folderResources.map(folder => folder.uri), options);
            }
            catch (err) {
                onQueryValidationError(err);
                return;
            }
            this.validateQuery(query).then(() => {
                this.onQueryTriggered(query, options, excludePatternText, includePatternText);
                if (!preserveFocus) {
                    this.searchWidget.focus(false); // focus back to input field
                }
            }, onQueryValidationError);
        }
        validateQuery(query) {
            // Validate folderQueries
            const folderQueriesExistP = query.folderQueries.map(fq => {
                return this.fileService.exists(fq.folder);
            });
            return Promise.all(folderQueriesExistP).then(existResults => {
                // If no folders exist, show an error message about the first one
                const existingFolderQueries = query.folderQueries.filter((folderQuery, i) => existResults[i]);
                if (!query.folderQueries.length || existingFolderQueries.length) {
                    query.folderQueries = existingFolderQueries;
                }
                else {
                    const nonExistantPath = query.folderQueries[0].folder.fsPath;
                    const searchPathNotFoundError = nls.localize('searchPathNotFoundError', "Search path not found: {0}", nonExistantPath);
                    return Promise.reject(new Error(searchPathNotFoundError));
                }
                return undefined;
            });
        }
        onQueryTriggered(query, options, excludePatternText, includePatternText) {
            this.searchWidget.searchInput.onSearchSubmit();
            this.inputPatternExcludes.onSearchSubmit();
            this.inputPatternIncludes.onSearchSubmit();
            this.viewModel.cancelSearch();
            this.currentSearchQ = this.currentSearchQ
                .then(() => this.doSearch(query, options, excludePatternText, includePatternText))
                .then(() => undefined, () => undefined);
        }
        doSearch(query, options, excludePatternText, includePatternText) {
            let progressComplete;
            this.progressService.withProgress({ location: search_1.VIEWLET_ID }, _progress => {
                return new Promise(resolve => progressComplete = resolve);
            });
            this.searchWidget.searchInput.clearMessage();
            this.state = SearchUIState.Searching;
            this.showEmptyStage();
            const slowTimer = setTimeout(() => {
                this.state = SearchUIState.SlowSearch;
                this.updateActions();
            }, 2000);
            const onComplete = (completed) => {
                clearTimeout(slowTimer);
                this.state = SearchUIState.Idle;
                // Complete up to 100% as needed
                progressComplete();
                // Do final render, then expand if just 1 file with less than 50 matches
                this.onSearchResultsChanged();
                const collapseResults = this.configurationService.getValue('search').collapseResults;
                if (collapseResults !== 'alwaysCollapse' && this.viewModel.searchResult.matches().length === 1) {
                    const onlyMatch = this.viewModel.searchResult.matches()[0];
                    if (onlyMatch.count() < 50) {
                        this.tree.expand(onlyMatch);
                    }
                }
                this.viewModel.replaceString = this.searchWidget.getReplaceValue();
                this.updateActions();
                const hasResults = !this.viewModel.searchResult.isEmpty();
                if (completed && completed.limitHit) {
                    this.searchWidget.searchInput.showMessage({
                        content: nls.localize('searchMaxResultsWarning', "The result set only contains a subset of all matches. Please be more specific in your search to narrow down the results."),
                        type: 2 /* WARNING */
                    });
                }
                if (!hasResults) {
                    const hasExcludes = !!excludePatternText;
                    const hasIncludes = !!includePatternText;
                    let message;
                    if (!completed) {
                        message = nls.localize('searchCanceled', "Search was canceled before any results could be found - ");
                    }
                    else if (hasIncludes && hasExcludes) {
                        message = nls.localize('noResultsIncludesExcludes', "No results found in '{0}' excluding '{1}' - ", includePatternText, excludePatternText);
                    }
                    else if (hasIncludes) {
                        message = nls.localize('noResultsIncludes', "No results found in '{0}' - ", includePatternText);
                    }
                    else if (hasExcludes) {
                        message = nls.localize('noResultsExcludes', "No results found excluding '{0}' - ", excludePatternText);
                    }
                    else {
                        message = nls.localize('noResultsFound', "No results found. Review your settings for configured exclusions and check your gitignore files - ");
                    }
                    // Indicate as status to ARIA
                    aria.status(message);
                    const messageEl = this.clearMessage();
                    const p = dom.append(messageEl, $('p', undefined, message));
                    if (!completed) {
                        const searchAgainLink = dom.append(p, $('a.pointer.prominent', undefined, nls.localize('rerunSearch.message', "Search again")));
                        this.messageDisposables.push(dom.addDisposableListener(searchAgainLink, dom.EventType.CLICK, (e) => {
                            dom.EventHelper.stop(e, false);
                            this.onQueryChanged();
                        }));
                    }
                    else if (hasIncludes || hasExcludes) {
                        const searchAgainLink = dom.append(p, $('a.pointer.prominent', { tabindex: 0 }, nls.localize('rerunSearchInAll.message', "Search again in all files")));
                        this.messageDisposables.push(dom.addDisposableListener(searchAgainLink, dom.EventType.CLICK, (e) => {
                            dom.EventHelper.stop(e, false);
                            this.inputPatternExcludes.setValue('');
                            this.inputPatternIncludes.setValue('');
                            this.onQueryChanged();
                        }));
                    }
                    else {
                        const openSettingsLink = dom.append(p, $('a.pointer.prominent', { tabindex: 0 }, nls.localize('openSettings.message', "Open Settings")));
                        this.addClickEvents(openSettingsLink, this.onOpenSettings);
                    }
                    if (completed) {
                        dom.append(p, $('span', undefined, ' - '));
                        const learnMoreLink = dom.append(p, $('a.pointer.prominent', { tabindex: 0 }, nls.localize('openSettings.learnMore', "Learn More")));
                        this.addClickEvents(learnMoreLink, this.onLearnMore);
                    }
                    if (this.contextService.getWorkbenchState() === 1 /* EMPTY */) {
                        this.showSearchWithoutFolderMessage();
                    }
                    this.reLayout();
                }
                else {
                    this.viewModel.searchResult.toggleHighlights(this.isVisible()); // show highlights
                    // Indicate final search result count for ARIA
                    aria.status(nls.localize('ariaSearchResultsStatus', "Search returned {0} results in {1} files", this.viewModel.searchResult.count(), this.viewModel.searchResult.fileCount()));
                }
            };
            const onError = (e) => {
                clearTimeout(slowTimer);
                this.state = SearchUIState.Idle;
                if (errors.isPromiseCanceledError(e)) {
                    return onComplete(undefined);
                }
                else {
                    this.updateActions();
                    progressComplete();
                    this.searchWidget.searchInput.showMessage({ content: e.message, type: 3 /* ERROR */ });
                    this.viewModel.searchResult.clear();
                    return Promise.resolve();
                }
            };
            let visibleMatches = 0;
            let updatedActionsForFileCount = false;
            // Handle UI updates in an interval to show frequent progress and results
            const uiRefreshHandle = setInterval(() => {
                if (this.state === SearchUIState.Idle) {
                    window.clearInterval(uiRefreshHandle);
                    return;
                }
                // Search result tree update
                const fileCount = this.viewModel.searchResult.fileCount();
                if (visibleMatches !== fileCount) {
                    visibleMatches = fileCount;
                    this.refreshAndUpdateCount();
                }
                if (fileCount > 0 && !updatedActionsForFileCount) {
                    updatedActionsForFileCount = true;
                    this.updateActions();
                }
            }, 100);
            this.searchWidget.setReplaceAllActionState(false);
            return this.viewModel.search(query)
                .then(onComplete, onError);
        }
        openSettings(query) {
            const options = { query };
            return this.contextService.getWorkbenchState() !== 1 /* EMPTY */ ?
                this.preferencesService.openWorkspaceSettings(undefined, options) :
                this.preferencesService.openGlobalSettings(undefined, options);
        }
        updateSearchResultCount(disregardExcludesAndIgnores) {
            const fileCount = this.viewModel.searchResult.fileCount();
            this.hasSearchResultsKey.set(fileCount > 0);
            const msgWasHidden = this.messagesElement.style.display === 'none';
            if (fileCount > 0) {
                const messageEl = this.clearMessage();
                let resultMsg = this.buildResultCountMessage(this.viewModel.searchResult.count(), fileCount);
                if (disregardExcludesAndIgnores) {
                    resultMsg += nls.localize('useIgnoresAndExcludesDisabled', " - exclude settings and ignore files are disabled");
                }
                dom.append(messageEl, $('p', undefined, resultMsg));
                this.reLayout();
            }
            else if (!msgWasHidden) {
                dom.hide(this.messagesElement);
            }
        }
        buildResultCountMessage(resultCount, fileCount) {
            if (resultCount === 1 && fileCount === 1) {
                return nls.localize('search.file.result', "{0} result in {1} file", resultCount, fileCount);
            }
            else if (resultCount === 1) {
                return nls.localize('search.files.result', "{0} result in {1} files", resultCount, fileCount);
            }
            else if (fileCount === 1) {
                return nls.localize('search.file.results', "{0} results in {1} file", resultCount, fileCount);
            }
            else {
                return nls.localize('search.files.results', "{0} results in {1} files", resultCount, fileCount);
            }
        }
        showSearchWithoutFolderMessage() {
            this.searchWithoutFolderMessageElement = this.clearMessage();
            const textEl = dom.append(this.searchWithoutFolderMessageElement, $('p', undefined, nls.localize('searchWithoutFolder', "You have not opened or specified a folder. Only open files are currently searched - ")));
            const openFolderLink = dom.append(textEl, $('a.pointer.prominent', { tabindex: 0 }, nls.localize('openFolder', "Open Folder")));
            this.messageDisposables.push(dom.addDisposableListener(openFolderLink, dom.EventType.CLICK, (e) => {
                dom.EventHelper.stop(e, false);
                const action = env.isMacintosh ?
                    this.instantiationService.createInstance(workspaceActions_1.OpenFileFolderAction, workspaceActions_1.OpenFileFolderAction.ID, workspaceActions_1.OpenFileFolderAction.LABEL) :
                    this.instantiationService.createInstance(workspaceActions_1.OpenFolderAction, workspaceActions_1.OpenFolderAction.ID, workspaceActions_1.OpenFolderAction.LABEL);
                this.actionRunner.run(action).then(() => {
                    action.dispose();
                }, err => {
                    action.dispose();
                    errors.onUnexpectedError(err);
                });
            }));
        }
        showEmptyStage() {
            // disable 'result'-actions
            this.updateActions();
            // clean up ui
            // this.replaceService.disposeAllReplacePreviews();
            dom.hide(this.messagesElement);
            dom.show(this.resultsElement);
            this.currentSelectedFileMatch = undefined;
        }
        onFocus(lineMatch, preserveFocus, sideBySide, pinned) {
            const useReplacePreview = this.configurationService.getValue().search.useReplacePreview;
            return (useReplacePreview && this.viewModel.isReplaceActive() && !!this.viewModel.replaceString) ?
                this.replaceService.openReplacePreview(lineMatch, preserveFocus, sideBySide, pinned) :
                this.open(lineMatch, preserveFocus, sideBySide, pinned);
        }
        open(element, preserveFocus, sideBySide, pinned) {
            const selection = this.getSelectionFrom(element);
            const resource = element instanceof searchModel_1.Match ? element.parent().resource : element.resource;
            return this.editorService.openEditor({
                resource: resource,
                options: {
                    preserveFocus,
                    pinned,
                    selection,
                    revealIfVisible: true
                }
            }, sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP).then(editor => {
                if (editor && element instanceof searchModel_1.Match && preserveFocus) {
                    this.viewModel.searchResult.rangeHighlightDecorations.highlightRange(editor.getControl().getModel(), element.range());
                }
                else {
                    this.viewModel.searchResult.rangeHighlightDecorations.removeHighlightRange();
                }
            }, errors.onUnexpectedError);
        }
        getSelectionFrom(element) {
            let match = null;
            if (element instanceof searchModel_1.Match) {
                match = element;
            }
            if (element instanceof searchModel_1.FileMatch && element.count() > 0) {
                match = element.matches()[element.matches().length - 1];
            }
            if (match) {
                const range = match.range();
                if (this.viewModel.isReplaceActive() && !!this.viewModel.replaceString) {
                    const replaceString = match.replaceString;
                    return {
                        startLineNumber: range.startLineNumber,
                        startColumn: range.startColumn,
                        endLineNumber: range.startLineNumber,
                        endColumn: range.startColumn + replaceString.length
                    };
                }
                return range;
            }
            return undefined;
        }
        onUntitledDidChangeDirty(resource) {
            if (!this.viewModel) {
                return;
            }
            // remove search results from this resource as it got disposed
            if (!this.untitledEditorService.isDirty(resource)) {
                const matches = this.viewModel.searchResult.matches();
                for (let i = 0, len = matches.length; i < len; i++) {
                    if (resource.toString() === matches[i].resource.toString()) {
                        this.viewModel.searchResult.remove(matches[i]);
                    }
                }
            }
        }
        onFilesChanged(e) {
            if (!this.viewModel || !e.gotDeleted()) {
                return;
            }
            const matches = this.viewModel.searchResult.matches();
            const changedMatches = matches.filter(m => e.contains(m.resource, 2 /* DELETED */));
            this.viewModel.searchResult.remove(changedMatches);
        }
        getActions() {
            return [
                this.state === SearchUIState.SlowSearch ?
                    this.cancelAction :
                    this.refreshAction,
                ...this.actions
            ];
        }
        clearHistory() {
            this.searchWidget.clearHistory();
            this.inputPatternExcludes.clearHistory();
            this.inputPatternIncludes.clearHistory();
        }
        saveState() {
            const isRegex = this.searchWidget.searchInput.getRegex();
            const isWholeWords = this.searchWidget.searchInput.getWholeWords();
            const isCaseSensitive = this.searchWidget.searchInput.getCaseSensitive();
            const contentPattern = this.searchWidget.searchInput.getValue();
            const patternExcludes = this.inputPatternExcludes.getValue().trim();
            const patternIncludes = this.inputPatternIncludes.getValue().trim();
            const useExcludesAndIgnoreFiles = this.inputPatternExcludes.useExcludesAndIgnoreFiles();
            const preserveCase = this.viewModel.preserveCase;
            this.viewletState['query.contentPattern'] = contentPattern;
            this.viewletState['query.regex'] = isRegex;
            this.viewletState['query.wholeWords'] = isWholeWords;
            this.viewletState['query.caseSensitive'] = isCaseSensitive;
            this.viewletState['query.folderExclusions'] = patternExcludes;
            this.viewletState['query.folderIncludes'] = patternIncludes;
            this.viewletState['query.useExcludesAndIgnoreFiles'] = useExcludesAndIgnoreFiles;
            this.viewletState['query.preserveCase'] = preserveCase;
            const isReplaceShown = this.searchAndReplaceWidget.isReplaceShown();
            this.viewletState['view.showReplace'] = isReplaceShown;
            this.viewletState['query.replaceText'] = isReplaceShown && this.searchWidget.getReplaceValue();
            const history = Object.create(null);
            const searchHistory = this.searchWidget.getSearchHistory();
            if (searchHistory && searchHistory.length) {
                history.search = searchHistory;
            }
            const replaceHistory = this.searchWidget.getReplaceHistory();
            if (replaceHistory && replaceHistory.length) {
                history.replace = replaceHistory;
            }
            const patternExcludesHistory = this.inputPatternExcludes.getHistory();
            if (patternExcludesHistory && patternExcludesHistory.length) {
                history.exclude = patternExcludesHistory;
            }
            const patternIncludesHistory = this.inputPatternIncludes.getHistory();
            if (patternIncludesHistory && patternIncludesHistory.length) {
                history.include = patternIncludesHistory;
            }
            this.searchHistoryService.save(history);
            super.saveState();
        }
        dispose() {
            this.isDisposed = true;
            this.saveState();
            super.dispose();
        }
    };
    SearchView.MAX_TEXT_RESULTS = 10000;
    SearchView.WIDE_CLASS_NAME = 'wide';
    SearchView.WIDE_VIEW_SIZE = 1000;
    SearchView.ACTIONS_RIGHT_CLASS_NAME = 'actions-right';
    SearchView = __decorate([
        __param(1, files_1.IFileService),
        __param(2, editorService_1.IEditorService),
        __param(3, progress_1.IProgressService),
        __param(4, notification_1.INotificationService),
        __param(5, dialogs_1.IDialogService),
        __param(6, contextView_1.IContextViewService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, workspace_1.IWorkspaceContextService),
        __param(10, searchModel_1.ISearchWorkbenchService),
        __param(11, contextkey_1.IContextKeyService),
        __param(12, replace_1.IReplaceService),
        __param(13, untitledEditorService_1.IUntitledEditorService),
        __param(14, preferences_1.IPreferencesService),
        __param(15, themeService_1.IThemeService),
        __param(16, searchHistoryService_1.ISearchHistoryService),
        __param(17, contextView_1.IContextMenuService),
        __param(18, actions_1.IMenuService),
        __param(19, accessibility_1.IAccessibilityService),
        __param(20, keybinding_1.IKeybindingService),
        __param(21, storage_1.IStorageService),
        __param(22, opener_1.IOpenerService)
    ], SearchView);
    exports.SearchView = SearchView;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const matchHighlightColor = theme.getColor(colorRegistry_1.editorFindMatchHighlight);
        if (matchHighlightColor) {
            collector.addRule(`.monaco-workbench .search-view .findInFileMatch { background-color: ${matchHighlightColor}; }`);
        }
        const diffInsertedColor = theme.getColor(colorRegistry_1.diffInserted);
        if (diffInsertedColor) {
            collector.addRule(`.monaco-workbench .search-view .replaceMatch { background-color: ${diffInsertedColor}; }`);
        }
        const diffRemovedColor = theme.getColor(colorRegistry_1.diffRemoved);
        if (diffRemovedColor) {
            collector.addRule(`.monaco-workbench .search-view .replace.findInFileMatch { background-color: ${diffRemovedColor}; }`);
        }
        const diffInsertedOutlineColor = theme.getColor(colorRegistry_1.diffInsertedOutline);
        if (diffInsertedOutlineColor) {
            collector.addRule(`.monaco-workbench .search-view .replaceMatch:not(:empty) { border: 1px ${theme.type === 'hc' ? 'dashed' : 'solid'} ${diffInsertedOutlineColor}; }`);
        }
        const diffRemovedOutlineColor = theme.getColor(colorRegistry_1.diffRemovedOutline);
        if (diffRemovedOutlineColor) {
            collector.addRule(`.monaco-workbench .search-view .replace.findInFileMatch { border: 1px ${theme.type === 'hc' ? 'dashed' : 'solid'} ${diffRemovedOutlineColor}; }`);
        }
        const findMatchHighlightBorder = theme.getColor(colorRegistry_1.editorFindMatchHighlightBorder);
        if (findMatchHighlightBorder) {
            collector.addRule(`.monaco-workbench .search-view .findInFileMatch { border: 1px ${theme.type === 'hc' ? 'dashed' : 'solid'} ${findMatchHighlightBorder}; }`);
        }
        const outlineSelectionColor = theme.getColor(colorRegistry_1.listActiveSelectionForeground);
        if (outlineSelectionColor) {
            collector.addRule(`.monaco-workbench .search-view .monaco-list.element-focused .monaco-list-row.focused.selected:not(.highlighted) .action-label:focus { outline-color: ${outlineSelectionColor} }`);
        }
    });
});
//# sourceMappingURL=searchView.js.map