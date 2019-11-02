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
define(["require", "exports", "vs/nls", "vs/base/browser/browser", "vs/base/common/strings", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/actions", "vs/base/parts/quickopen/browser/quickOpenModel", "vs/base/parts/quickopen/browser/quickOpenWidget", "vs/workbench/browser/actions", "vs/workbench/services/textfile/common/textfiles", "vs/platform/registry/common/platform", "vs/editor/common/services/modeService", "vs/editor/common/services/getIconClasses", "vs/editor/common/services/modelService", "vs/workbench/common/editor", "vs/workbench/common/component", "vs/base/common/event", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/browser/quickopen", "vs/base/common/errors", "vs/platform/quickOpen/common/quickOpen", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/history/common/history", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/platform/theme/common/styler", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/base/parts/quickopen/common/quickOpenScorer", "vs/platform/list/browser/listService", "vs/base/common/network", "vs/platform/notification/common/notification", "vs/base/browser/dom", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/label/common/label", "vs/base/common/async", "vs/platform/quickinput/common/quickInput", "vs/base/common/cancellation", "vs/platform/storage/common/storage", "vs/platform/instantiation/common/extensions", "vs/css!./media/quickopen"], function (require, exports, nls, browser, strings, resources, types, actions_1, quickOpenModel_1, quickOpenWidget_1, actions_2, textfiles_1, platform_1, modeService_1, getIconClasses_1, modelService_1, editor_1, component_1, event_1, layoutService_1, quickopen_1, errors, quickOpen_1, configuration_1, instantiation_1, contextkey_1, history_1, themeService_1, theme_1, styler_1, environment_1, files_1, quickOpenScorer_1, listService_1, network_1, notification_1, dom_1, editorService_1, editorGroupsService_1, label_1, async_1, quickInput_1, cancellation_1, storage_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const HELP_PREFIX = '?';
    let QuickOpenController = class QuickOpenController extends component_1.Component {
        constructor(editorGroupService, notificationService, contextKeyService, configurationService, instantiationService, layoutService, environmentService, themeService, storageService) {
            super(QuickOpenController.ID, themeService, storageService);
            this.editorGroupService = editorGroupService;
            this.notificationService = notificationService;
            this.contextKeyService = contextKeyService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.layoutService = layoutService;
            this.environmentService = environmentService;
            this._onShow = this._register(new event_1.Emitter());
            this.onShow = this._onShow.event;
            this._onHide = this._register(new event_1.Emitter());
            this.onHide = this._onHide.event;
            this.mapResolvedHandlersToPrefix = new Map();
            this.mapContextKeyToContext = new Map();
            this.handlerOnOpenCalled = new Set();
            this.promisesToCompleteOnHide = [];
            this.actionProvider = new actions_2.ContributableActionProvider();
            this.pendingGetResultsInvocation = null;
            this.editorHistoryHandler = this.instantiationService.createInstance(EditorHistoryHandler);
            this.updateConfiguration();
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(() => this.updateConfiguration()));
            this._register(this.layoutService.onPartVisibilityChange(() => this.positionQuickOpenWidget()));
            this._register(browser.onDidChangeZoomLevel(() => this.positionQuickOpenWidget()));
            this._register(this.layoutService.onLayout(dimension => this.layout(dimension)));
        }
        updateConfiguration() {
            if (this.environmentService.args['sticky-quickopen']) {
                this.closeOnFocusLost = false;
            }
            else {
                this.closeOnFocusLost = this.configurationService.getValue(quickopen_1.CLOSE_ON_FOCUS_LOST_CONFIG);
            }
            this.preserveInput = this.configurationService.getValue(quickopen_1.PRESERVE_INPUT_CONFIG);
            this.searchInEditorHistory = this.configurationService.getValue(quickopen_1.SEARCH_EDITOR_HISTORY);
        }
        navigate(next, quickNavigate) {
            if (this.quickOpenWidget) {
                this.quickOpenWidget.navigate(next, quickNavigate);
            }
        }
        accept() {
            if (this.quickOpenWidget && this.quickOpenWidget.isVisible()) {
                this.quickOpenWidget.accept();
            }
        }
        focus() {
            if (this.quickOpenWidget && this.quickOpenWidget.isVisible()) {
                this.quickOpenWidget.focus();
            }
        }
        close() {
            if (this.quickOpenWidget && this.quickOpenWidget.isVisible()) {
                this.quickOpenWidget.hide(2 /* CANCELED */);
            }
        }
        emitQuickOpenVisibilityChange(isVisible) {
            if (isVisible) {
                this._onShow.fire();
            }
            else {
                this._onHide.fire();
            }
        }
        show(prefix, options) {
            let quickNavigateConfiguration = options ? options.quickNavigateConfiguration : undefined;
            let inputSelection = options ? options.inputSelection : undefined;
            let autoFocus = options ? options.autoFocus : undefined;
            const promiseCompletedOnHide = new Promise(c => {
                this.promisesToCompleteOnHide.push(c);
            });
            // Telemetry: log that quick open is shown and log the mode
            const registry = platform_1.Registry.as(quickopen_1.Extensions.Quickopen);
            const handlerDescriptor = (prefix ? registry.getQuickOpenHandler(prefix) : undefined) || registry.getDefaultQuickOpenHandler();
            // Trigger onOpen
            this.resolveHandler(handlerDescriptor);
            // Create upon first open
            if (!this.quickOpenWidget) {
                const quickOpenWidget = this.quickOpenWidget = this._register(new quickOpenWidget_1.QuickOpenWidget(this.layoutService.getWorkbenchElement(), {
                    onOk: () => this.onOk(),
                    onCancel: () => { },
                    onType: (value) => this.onType(quickOpenWidget, value || ''),
                    onShow: () => this.handleOnShow(),
                    onHide: (reason) => this.handleOnHide(reason),
                    onFocusLost: () => !this.closeOnFocusLost
                }, {
                    inputPlaceHolder: this.hasHandler(HELP_PREFIX) ? nls.localize('quickOpenInput', "Type '?' to get help on the actions you can take from here") : '',
                    keyboardSupport: false,
                    treeCreator: (container, config, opts) => this.instantiationService.createInstance(listService_1.WorkbenchTree, container, config, opts)
                }));
                this._register(styler_1.attachQuickOpenStyler(this.quickOpenWidget, this.themeService, { background: theme_1.QUICK_INPUT_BACKGROUND, foreground: theme_1.QUICK_INPUT_FOREGROUND }));
                const quickOpenContainer = this.quickOpenWidget.create();
                dom_1.addClass(quickOpenContainer, 'show-file-icons');
                this.positionQuickOpenWidget();
            }
            // Layout
            this.quickOpenWidget.layout(this.layoutService.dimension);
            // Show quick open with prefix or editor history
            if (!this.quickOpenWidget.isVisible() || quickNavigateConfiguration) {
                if (prefix) {
                    this.quickOpenWidget.show(prefix, { quickNavigateConfiguration, inputSelection, autoFocus });
                }
                else {
                    const editorHistory = this.getEditorHistoryWithGroupLabel();
                    if (editorHistory.getEntries().length < 2) {
                        quickNavigateConfiguration = undefined; // If no entries can be shown, default to normal quick open mode
                    }
                    // Compute auto focus
                    if (!autoFocus) {
                        if (!quickNavigateConfiguration) {
                            autoFocus = { autoFocusFirstEntry: true };
                        }
                        else {
                            const autoFocusFirstEntry = this.editorGroupService.activeGroup.count === 0;
                            autoFocus = { autoFocusFirstEntry, autoFocusSecondEntry: !autoFocusFirstEntry };
                        }
                    }
                    // Update context
                    const registry = platform_1.Registry.as(quickopen_1.Extensions.Quickopen);
                    this.setQuickOpenContextKey(registry.getDefaultQuickOpenHandler().contextKey);
                    if (this.preserveInput) {
                        this.quickOpenWidget.show(editorHistory, { value: this.lastSubmittedInputValue, quickNavigateConfiguration, autoFocus, inputSelection });
                    }
                    else {
                        this.quickOpenWidget.show(editorHistory, { quickNavigateConfiguration, autoFocus, inputSelection });
                    }
                }
            }
            // Otherwise reset the widget to the prefix that is passed in
            else {
                this.quickOpenWidget.show(prefix || '', { inputSelection });
            }
            return promiseCompletedOnHide;
        }
        positionQuickOpenWidget() {
            const titlebarOffset = this.layoutService.getTitleBarOffset();
            if (this.quickOpenWidget) {
                this.quickOpenWidget.getElement().style.top = `${titlebarOffset}px`;
            }
        }
        handleOnShow() {
            this.emitQuickOpenVisibilityChange(true);
        }
        handleOnHide(reason) {
            // Clear state
            this.previousActiveHandlerDescriptor = null;
            // Cancel pending results calls
            this.cancelPendingGetResultsInvocation();
            // Pass to handlers
            this.mapResolvedHandlersToPrefix.forEach((promise, prefix) => {
                promise.then(handler => {
                    this.handlerOnOpenCalled.delete(prefix);
                    handler.onClose(reason === 2 /* CANCELED */); // Don't check if onOpen was called to preserve old behaviour for now
                });
            });
            // Complete promises that are waiting
            while (this.promisesToCompleteOnHide.length) {
                const callback = this.promisesToCompleteOnHide.pop();
                if (callback) {
                    callback(true);
                }
            }
            if (reason !== 1 /* FOCUS_LOST */) {
                this.editorGroupService.activeGroup.focus(); // focus back to editor group unless user clicked somewhere else
            }
            // Reset context keys
            this.resetQuickOpenContextKeys();
            // Events
            this.emitQuickOpenVisibilityChange(false);
        }
        cancelPendingGetResultsInvocation() {
            if (this.pendingGetResultsInvocation) {
                this.pendingGetResultsInvocation.cancel();
                this.pendingGetResultsInvocation.dispose();
                this.pendingGetResultsInvocation = null;
            }
        }
        resetQuickOpenContextKeys() {
            this.mapContextKeyToContext.forEach(context => context.reset());
        }
        setQuickOpenContextKey(id) {
            var _a;
            let key;
            if (id) {
                key = this.mapContextKeyToContext.get(id);
                if (!key) {
                    key = new contextkey_1.RawContextKey(id, false).bindTo(this.contextKeyService);
                    this.mapContextKeyToContext.set(id, key);
                }
            }
            if ((_a = key) === null || _a === void 0 ? void 0 : _a.get()) {
                return; // already active context
            }
            this.resetQuickOpenContextKeys();
            if (key) {
                key.set(true);
            }
        }
        hasHandler(prefix) {
            return !!platform_1.Registry.as(quickopen_1.Extensions.Quickopen).getQuickOpenHandler(prefix);
        }
        getEditorHistoryWithGroupLabel() {
            const entries = this.editorHistoryHandler.getResults();
            // Apply label to first entry
            if (entries.length > 0) {
                entries[0] = new EditorHistoryEntryGroup(entries[0], nls.localize('historyMatches', "recently opened"), false);
            }
            return new quickOpenModel_1.QuickOpenModel(entries, this.actionProvider);
        }
        onOk() {
            if (this.isQuickOpen) {
                this.lastSubmittedInputValue = this.lastInputValue;
            }
        }
        onType(quickOpenWidget, value) {
            var _a;
            // cancel any pending get results invocation and create new
            this.cancelPendingGetResultsInvocation();
            const pendingResultsInvocationTokenSource = new cancellation_1.CancellationTokenSource();
            const pendingResultsInvocationToken = pendingResultsInvocationTokenSource.token;
            this.pendingGetResultsInvocation = pendingResultsInvocationTokenSource;
            // look for a handler
            const registry = platform_1.Registry.as(quickopen_1.Extensions.Quickopen);
            const handlerDescriptor = registry.getQuickOpenHandler(value);
            const defaultHandlerDescriptor = registry.getDefaultQuickOpenHandler();
            const instantProgress = (_a = handlerDescriptor) === null || _a === void 0 ? void 0 : _a.instantProgress;
            const contextKey = handlerDescriptor ? handlerDescriptor.contextKey : defaultHandlerDescriptor.contextKey;
            // Reset Progress
            if (!instantProgress) {
                quickOpenWidget.getProgressBar().stop().hide();
            }
            // Reset Extra Class
            quickOpenWidget.setExtraClass(null);
            // Update context
            this.setQuickOpenContextKey(contextKey);
            // Remove leading and trailing whitespace
            const trimmedValue = strings.trim(value);
            // If no value provided, default to editor history
            if (!trimmedValue) {
                // Trigger onOpen
                this.resolveHandler(handlerDescriptor || defaultHandlerDescriptor);
                quickOpenWidget.setInput(this.getEditorHistoryWithGroupLabel(), { autoFocusFirstEntry: true });
                // If quickOpen entered empty we have to clear the prefill-cache
                this.lastInputValue = '';
                this.isQuickOpen = true;
                return;
            }
            let resultPromise;
            let resultPromiseDone = false;
            if (handlerDescriptor) {
                this.isQuickOpen = false;
                resultPromise = this.handleSpecificHandler(quickOpenWidget, handlerDescriptor, value, pendingResultsInvocationToken);
            }
            // Otherwise handle default handlers if no specific handler present
            else {
                this.isQuickOpen = true;
                // Cache the value for prefilling the quickOpen next time is opened
                this.lastInputValue = trimmedValue;
                resultPromise = this.handleDefaultHandler(quickOpenWidget, defaultHandlerDescriptor, value, pendingResultsInvocationToken);
            }
            // Remember as the active one
            this.previousActiveHandlerDescriptor = handlerDescriptor;
            // Progress if task takes a long time
            setTimeout(() => {
                if (!resultPromiseDone && !pendingResultsInvocationToken.isCancellationRequested) {
                    quickOpenWidget.getProgressBar().infinite().show();
                }
            }, instantProgress ? 0 : 800);
            // Promise done handling
            resultPromise.then(() => {
                resultPromiseDone = true;
                if (!pendingResultsInvocationToken.isCancellationRequested) {
                    quickOpenWidget.getProgressBar().hide();
                }
                pendingResultsInvocationTokenSource.dispose();
            }, (error) => {
                resultPromiseDone = true;
                pendingResultsInvocationTokenSource.dispose();
                errors.onUnexpectedError(error);
                this.notificationService.error(types.isString(error) ? new Error(error) : error);
            });
        }
        async handleDefaultHandler(quickOpenWidget, handler, value, token) {
            var _a, _b, _c;
            // Fill in history results if matching and we are configured to search in history
            let matchingHistoryEntries;
            if (value && !this.searchInEditorHistory) {
                matchingHistoryEntries = [];
            }
            else {
                matchingHistoryEntries = this.editorHistoryHandler.getResults(value, token);
            }
            if (matchingHistoryEntries.length > 0) {
                matchingHistoryEntries[0] = new EditorHistoryEntryGroup(matchingHistoryEntries[0], nls.localize('historyMatches', "recently opened"), false);
            }
            // Resolve
            const resolvedHandler = await this.resolveHandler(handler);
            const quickOpenModel = new quickOpenModel_1.QuickOpenModel(matchingHistoryEntries, this.actionProvider);
            let inputSet = false;
            // If we have matching entries from history we want to show them directly and not wait for the other results to come in
            // This also applies when we used to have entries from a previous run and now there are no more history results matching
            const previousInput = quickOpenWidget.getInput();
            const wasShowingHistory = (_b = (_a = previousInput) === null || _a === void 0 ? void 0 : _a.entries) === null || _b === void 0 ? void 0 : _b.some(e => e instanceof EditorHistoryEntry || e instanceof EditorHistoryEntryGroup);
            if (wasShowingHistory || matchingHistoryEntries.length > 0) {
                (async () => {
                    if (resolvedHandler.hasShortResponseTime()) {
                        await async_1.timeout(QuickOpenController.MAX_SHORT_RESPONSE_TIME);
                    }
                    if (!token.isCancellationRequested && !inputSet) {
                        quickOpenWidget.setInput(quickOpenModel, { autoFocusFirstEntry: true });
                        inputSet = true;
                    }
                })();
            }
            // Get results
            const result = await resolvedHandler.getResults(value, token);
            if (!token.isCancellationRequested) {
                // now is the time to show the input if we did not have set it before
                if (!inputSet) {
                    quickOpenWidget.setInput(quickOpenModel, { autoFocusFirstEntry: true });
                    inputSet = true;
                }
                // merge history and default handler results
                const handlerResults = ((_c = result) === null || _c === void 0 ? void 0 : _c.entries) || [];
                this.mergeResults(quickOpenWidget, quickOpenModel, handlerResults, types.withNullAsUndefined(resolvedHandler.getGroupLabel()));
            }
        }
        mergeResults(quickOpenWidget, quickOpenModel, handlerResults, groupLabel) {
            // Remove results already showing by checking for a "resource" property
            const mapEntryToResource = this.mapEntriesToResource(quickOpenModel);
            const additionalHandlerResults = [];
            for (const result of handlerResults) {
                const resource = result.getResource();
                if (!result.mergeWithEditorHistory() || !resource || !mapEntryToResource[resource.toString()]) {
                    additionalHandlerResults.push(result);
                }
            }
            // Show additional handler results below any existing results
            if (additionalHandlerResults.length > 0) {
                const autoFocusFirstEntry = (quickOpenModel.getEntries().length === 0); // the user might have selected another entry meanwhile in local history (see https://github.com/Microsoft/vscode/issues/20828)
                const useTopBorder = quickOpenModel.getEntries().length > 0;
                additionalHandlerResults[0] = new quickOpenModel_1.QuickOpenEntryGroup(additionalHandlerResults[0], groupLabel, useTopBorder);
                quickOpenModel.addEntries(additionalHandlerResults);
                quickOpenWidget.refresh(quickOpenModel, { autoFocusFirstEntry });
            }
            // Otherwise if no results are present (even from histoy) indicate this to the user
            else if (quickOpenModel.getEntries().length === 0) {
                quickOpenModel.addEntries([new PlaceholderQuickOpenEntry(nls.localize('noResultsFound1', "No results found"))]);
                quickOpenWidget.refresh(quickOpenModel, { autoFocusFirstEntry: true });
            }
        }
        async handleSpecificHandler(quickOpenWidget, handlerDescriptor, value, token) {
            const resolvedHandler = await this.resolveHandler(handlerDescriptor);
            // Remove handler prefix from search value
            value = value.substr(handlerDescriptor.prefix.length);
            // Return early if the handler can not run in the current environment and inform the user
            const canRun = resolvedHandler.canRun();
            if (types.isUndefinedOrNull(canRun) || (typeof canRun === 'boolean' && !canRun) || typeof canRun === 'string') {
                const placeHolderLabel = (typeof canRun === 'string') ? canRun : nls.localize('canNotRunPlaceholder', "This quick open handler can not be used in the current context");
                const model = new quickOpenModel_1.QuickOpenModel([new PlaceholderQuickOpenEntry(placeHolderLabel)], this.actionProvider);
                this.showModel(quickOpenWidget, model, resolvedHandler.getAutoFocus(value, { model, quickNavigateConfiguration: quickOpenWidget.getQuickNavigateConfiguration() }), types.withNullAsUndefined(resolvedHandler.getAriaLabel()));
                return;
            }
            // Support extra class from handler
            const extraClass = resolvedHandler.getClass();
            if (extraClass) {
                quickOpenWidget.setExtraClass(extraClass);
            }
            // When handlers change, clear the result list first before loading the new results
            if (this.previousActiveHandlerDescriptor !== handlerDescriptor) {
                this.clearModel(quickOpenWidget);
            }
            // Receive Results from Handler and apply
            const result = await resolvedHandler.getResults(value, token);
            if (!token.isCancellationRequested) {
                if (!result || !result.entries.length) {
                    const model = new quickOpenModel_1.QuickOpenModel([new PlaceholderQuickOpenEntry(resolvedHandler.getEmptyLabel(value))]);
                    this.showModel(quickOpenWidget, model, resolvedHandler.getAutoFocus(value, { model, quickNavigateConfiguration: quickOpenWidget.getQuickNavigateConfiguration() }), types.withNullAsUndefined(resolvedHandler.getAriaLabel()));
                }
                else {
                    this.showModel(quickOpenWidget, result, resolvedHandler.getAutoFocus(value, { model: result, quickNavigateConfiguration: quickOpenWidget.getQuickNavigateConfiguration() }), types.withNullAsUndefined(resolvedHandler.getAriaLabel()));
                }
            }
        }
        showModel(quickOpenWidget, model, autoFocus, ariaLabel) {
            // If the given model is already set in the widget, refresh and return early
            if (quickOpenWidget.getInput() === model) {
                quickOpenWidget.refresh(model, autoFocus);
                return;
            }
            // Otherwise just set it
            quickOpenWidget.setInput(model, autoFocus, ariaLabel);
        }
        clearModel(quickOpenWidget) {
            this.showModel(quickOpenWidget, new quickOpenModel_1.QuickOpenModel(), undefined);
        }
        mapEntriesToResource(model) {
            const entries = model.getEntries();
            const mapEntryToPath = {};
            entries.forEach((entry) => {
                const resource = entry.getResource();
                if (resource) {
                    mapEntryToPath[resource.toString()] = entry;
                }
            });
            return mapEntryToPath;
        }
        async resolveHandler(handler) {
            let result = this.doResolveHandler(handler);
            const id = handler.getId();
            if (!this.handlerOnOpenCalled.has(id)) {
                const original = result;
                this.handlerOnOpenCalled.add(id);
                result = original.then(resolved => {
                    this.mapResolvedHandlersToPrefix.set(id, original);
                    resolved.onOpen();
                    return resolved;
                });
                this.mapResolvedHandlersToPrefix.set(id, result);
            }
            try {
                return await result;
            }
            catch (error) {
                this.mapResolvedHandlersToPrefix.delete(id);
                throw new Error(`Unable to instantiate quick open handler ${handler.getId()}: ${JSON.stringify(error)}`);
            }
        }
        doResolveHandler(handler) {
            const id = handler.getId();
            // Return Cached
            if (this.mapResolvedHandlersToPrefix.has(id)) {
                return this.mapResolvedHandlersToPrefix.get(id);
            }
            // Otherwise load and create
            const result = Promise.resolve(handler.instantiate(this.instantiationService));
            this.mapResolvedHandlersToPrefix.set(id, result);
            return result;
        }
        layout(dimension) {
            if (this.quickOpenWidget) {
                this.quickOpenWidget.layout(dimension);
            }
        }
    };
    QuickOpenController.MAX_SHORT_RESPONSE_TIME = 500;
    QuickOpenController.ID = 'workbench.component.quickopen';
    QuickOpenController = __decorate([
        __param(0, editorGroupsService_1.IEditorGroupsService),
        __param(1, notification_1.INotificationService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, layoutService_1.IWorkbenchLayoutService),
        __param(6, environment_1.IEnvironmentService),
        __param(7, themeService_1.IThemeService),
        __param(8, storage_1.IStorageService)
    ], QuickOpenController);
    exports.QuickOpenController = QuickOpenController;
    class PlaceholderQuickOpenEntry extends quickOpenModel_1.QuickOpenEntryGroup {
        constructor(placeHolderLabel) {
            super();
            this.placeHolderLabel = placeHolderLabel;
        }
        getLabel() {
            return this.placeHolderLabel;
        }
    }
    let EditorHistoryHandler = class EditorHistoryHandler {
        constructor(historyService, instantiationService, fileService) {
            this.historyService = historyService;
            this.instantiationService = instantiationService;
            this.fileService = fileService;
            this.scorerCache = Object.create(null);
        }
        getResults(searchValue, token) {
            // Massage search for scoring
            const query = quickOpenScorer_1.prepareQuery(searchValue || '');
            // Just return all if we are not searching
            const history = this.historyService.getHistory();
            if (!query.value) {
                return history.map(input => this.instantiationService.createInstance(EditorHistoryEntry, input));
            }
            // Otherwise filter by search value and sort by score. Include matches on description
            // in case the user is explicitly including path separators.
            const accessor = query.containsPathSeparator ? MatchOnDescription : DoNotMatchOnDescription;
            return history
                // For now, only support to match on inputs that provide resource information
                .filter(input => {
                let resource;
                if (input instanceof editor_1.EditorInput) {
                    resource = resourceForEditorHistory(input, this.fileService);
                }
                else {
                    resource = input.resource;
                }
                return !!resource;
            })
                // Conver to quick open entries
                .map(input => this.instantiationService.createInstance(EditorHistoryEntry, input))
                // Make sure the search value is matching
                .filter(e => {
                const itemScore = quickOpenScorer_1.scoreItem(e, query, false, accessor, this.scorerCache);
                if (!itemScore.score) {
                    return false;
                }
                e.setHighlights(itemScore.labelMatch || [], itemScore.descriptionMatch);
                return true;
            })
                // Sort by score and provide a fallback sorter that keeps the
                // recency of items in case the score for items is the same
                .sort((e1, e2) => quickOpenScorer_1.compareItemsByScore(e1, e2, query, false, accessor, this.scorerCache, () => -1));
        }
    };
    EditorHistoryHandler = __decorate([
        __param(0, history_1.IHistoryService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, files_1.IFileService)
    ], EditorHistoryHandler);
    class EditorHistoryItemAccessorClass extends quickOpenModel_1.QuickOpenItemAccessorClass {
        constructor(allowMatchOnDescription) {
            super();
            this.allowMatchOnDescription = allowMatchOnDescription;
        }
        getItemDescription(entry) {
            return this.allowMatchOnDescription ? types.withUndefinedAsNull(entry.getDescription()) : null;
        }
    }
    const MatchOnDescription = new EditorHistoryItemAccessorClass(true);
    const DoNotMatchOnDescription = new EditorHistoryItemAccessorClass(false);
    class EditorHistoryEntryGroup extends quickOpenModel_1.QuickOpenEntryGroup {
    }
    exports.EditorHistoryEntryGroup = EditorHistoryEntryGroup;
    let EditorHistoryEntry = class EditorHistoryEntry extends quickopen_1.EditorQuickOpenEntry {
        constructor(input, editorService, modeService, modelService, textFileService, configurationService, labelService, fileService) {
            super(editorService);
            this.modeService = modeService;
            this.modelService = modelService;
            this.textFileService = textFileService;
            this.configurationService = configurationService;
            this.input = input;
            if (input instanceof editor_1.EditorInput) {
                this.resource = resourceForEditorHistory(input, fileService);
                this.label = types.withNullAsUndefined(input.getName());
                this.description = input.getDescription();
                this.dirty = input.isDirty();
            }
            else {
                const resourceInput = input;
                this.resource = resourceInput.resource;
                this.label = resources.basenameOrAuthority(resourceInput.resource);
                this.description = labelService.getUriLabel(resources.dirname(this.resource), { relative: true });
                this.dirty = this.resource && this.textFileService.isDirty(this.resource);
                if (this.dirty && this.textFileService.getAutoSaveMode() === 1 /* AFTER_SHORT_DELAY */) {
                    this.dirty = false; // no dirty decoration if auto save is on with a short timeout
                }
            }
        }
        getIcon() {
            return this.dirty ? 'dirty' : '';
        }
        getLabel() {
            return this.label;
        }
        getLabelOptions() {
            return {
                extraClasses: getIconClasses_1.getIconClasses(this.modelService, this.modeService, this.resource)
            };
        }
        getAriaLabel() {
            return nls.localize('entryAriaLabel', "{0}, recently opened", this.getLabel());
        }
        getDescription() {
            return this.description;
        }
        getResource() {
            return this.resource;
        }
        getInput() {
            return this.input;
        }
        run(mode, context) {
            if (mode === 1 /* OPEN */) {
                const sideBySide = !context.quickNavigateConfiguration && (context.keymods.alt || context.keymods.ctrlCmd);
                const pinned = !this.configurationService.getValue().workbench.editor.enablePreviewFromQuickOpen || context.keymods.alt;
                if (this.input instanceof editor_1.EditorInput) {
                    this.editorService.openEditor(this.input, { pinned }, sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
                }
                else {
                    this.editorService.openEditor({ resource: this.input.resource, options: { pinned } }, sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
                }
                return true;
            }
            return super.run(mode, context);
        }
    };
    EditorHistoryEntry = __decorate([
        __param(1, editorService_1.IEditorService),
        __param(2, modeService_1.IModeService),
        __param(3, modelService_1.IModelService),
        __param(4, textfiles_1.ITextFileService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, label_1.ILabelService),
        __param(7, files_1.IFileService)
    ], EditorHistoryEntry);
    exports.EditorHistoryEntry = EditorHistoryEntry;
    function resourceForEditorHistory(input, fileService) {
        const resource = input ? input.getResource() : undefined;
        // For the editor history we only prefer resources that are either untitled or
        // can be handled by the file service which indicates they are editable resources.
        if (resource && (fileService.canHandleResource(resource) || resource.scheme === network_1.Schemas.untitled)) {
            return resource;
        }
        return undefined;
    }
    let RemoveFromEditorHistoryAction = class RemoveFromEditorHistoryAction extends actions_1.Action {
        constructor(id, label, quickInputService, modelService, modeService, instantiationService, historyService) {
            super(id, label);
            this.quickInputService = quickInputService;
            this.modelService = modelService;
            this.modeService = modeService;
            this.instantiationService = instantiationService;
            this.historyService = historyService;
        }
        async run() {
            const history = this.historyService.getHistory();
            const picks = history.map(h => {
                const entry = this.instantiationService.createInstance(EditorHistoryEntry, h);
                return {
                    input: h,
                    iconClasses: getIconClasses_1.getIconClasses(this.modelService, this.modeService, entry.getResource()),
                    label: entry.getLabel(),
                    description: entry.getDescription()
                };
            });
            const pick = await this.quickInputService.pick(picks, { placeHolder: nls.localize('pickHistory', "Select an editor entry to remove from history"), matchOnDescription: true });
            if (pick) {
                this.historyService.remove(pick.input);
            }
        }
    };
    RemoveFromEditorHistoryAction.ID = 'workbench.action.removeFromEditorHistory';
    RemoveFromEditorHistoryAction.LABEL = nls.localize('removeFromEditorHistory', "Remove From History");
    RemoveFromEditorHistoryAction = __decorate([
        __param(2, quickInput_1.IQuickInputService),
        __param(3, modelService_1.IModelService),
        __param(4, modeService_1.IModeService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, history_1.IHistoryService)
    ], RemoveFromEditorHistoryAction);
    exports.RemoveFromEditorHistoryAction = RemoveFromEditorHistoryAction;
    extensions_1.registerSingleton(quickOpen_1.IQuickOpenService, QuickOpenController, true);
});
//# sourceMappingURL=quickOpenController.js.map