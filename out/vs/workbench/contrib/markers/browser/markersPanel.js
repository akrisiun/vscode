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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/platform/telemetry/common/telemetry", "vs/workbench/browser/panel", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/markers/browser/constants", "vs/workbench/contrib/markers/browser/markersModel", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/markers/browser/markersPanelActions", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/markers/browser/messages", "vs/workbench/browser/parts/editor/rangeDecorations", "vs/platform/theme/common/themeService", "vs/workbench/contrib/markers/browser/markers", "vs/platform/storage/common/storage", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/base/common/iterator", "vs/base/common/event", "vs/platform/list/browser/listService", "vs/workbench/contrib/markers/browser/markersFilterOptions", "vs/base/common/objects", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/markers/browser/markersTreeViewer", "vs/platform/contextview/browser/contextView", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/actions/common/actions", "vs/platform/keybinding/common/keybinding", "vs/base/browser/keyboardEvent", "vs/base/browser/event", "vs/workbench/browser/labels", "vs/base/common/types", "vs/platform/accessibility/common/accessibility", "vs/css!./media/markers"], function (require, exports, dom, actions_1, telemetry_1, panel_1, editorService_1, constants_1, markersModel_1, instantiation_1, markersPanelActions_1, configuration_1, messages_1, rangeDecorations_1, themeService_1, markers_1, storage_1, nls_1, contextkey_1, iterator_1, event_1, listService_1, markersFilterOptions_1, objects_1, workspace_1, markersTreeViewer_1, contextView_1, actionbar_1, actions_2, keybinding_1, keyboardEvent_1, event_2, labels_1, types_1, accessibility_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createModelIterator(model) {
        const resourcesIt = iterator_1.Iterator.fromArray(model.resourceMarkers);
        return iterator_1.Iterator.map(resourcesIt, m => ({ element: m, children: createResourceMarkersIterator(m) }));
    }
    function createResourceMarkersIterator(resourceMarkers) {
        const markersIt = iterator_1.Iterator.fromArray(resourceMarkers.markers);
        return iterator_1.Iterator.map(markersIt, m => {
            const relatedInformationIt = iterator_1.Iterator.from(m.relatedInformation);
            const children = iterator_1.Iterator.map(relatedInformationIt, r => ({ element: r }));
            return { element: m, children };
        });
    }
    let MarkersPanel = class MarkersPanel extends panel_1.Panel {
        constructor(instantiationService, editorService, configurationService, telemetryService, themeService, markersWorkbenchService, storageService, contextKeyService, workspaceContextService, contextMenuService, menuService, keybindingService) {
            super(constants_1.default.MARKERS_PANEL_ID, telemetryService, themeService, storageService);
            this.instantiationService = instantiationService;
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.markersWorkbenchService = markersWorkbenchService;
            this.workspaceContextService = workspaceContextService;
            this.contextMenuService = contextMenuService;
            this.menuService = menuService;
            this.keybindingService = keybindingService;
            this.lastSelectedRelativeTop = 0;
            this.currentActiveResource = null;
            this.filterInputActionViewItem = null;
            this._onDidFilter = this._register(new event_1.Emitter());
            this.onDidFilter = this._onDidFilter.event;
            this.cachedFilterStats = undefined;
            this.currentResourceGotAddedToMarkersData = false;
            this.panelFoucusContextKey = constants_1.default.MarkerPanelFocusContextKey.bindTo(contextKeyService);
            this.panelState = this.getMemento(1 /* WORKSPACE */);
            this.markersViewModel = this._register(instantiationService.createInstance(markersTreeViewer_1.MarkersViewModel, this.panelState['multiline']));
            this._register(this.markersViewModel.onDidChange(marker => this.onDidChangeViewState(marker)));
            this.setCurrentActiveEditor();
            this.filter = new markersTreeViewer_1.Filter(new markersFilterOptions_1.FilterOptions());
            this.rangeHighlightDecorations = this._register(this.instantiationService.createInstance(rangeDecorations_1.RangeHighlightDecorations));
            // actions
            this.collapseAllAction = this._register(new actions_1.Action('vs.tree.collapse', nls_1.localize('collapseAll', "Collapse All"), 'monaco-tree-action codicon-collapse-all', true, async () => this.collapseAll()));
            this.filterAction = this._register(this.instantiationService.createInstance(markersPanelActions_1.MarkersFilterAction, { filterText: this.panelState['filter'] || '', filterHistory: this.panelState['filterHistory'] || [], useFilesExclude: !!this.panelState['useFilesExclude'] }));
        }
        create(parent) {
            super.create(parent);
            dom.addClass(parent, 'markers-panel');
            const container = dom.append(parent, dom.$('.markers-panel-container'));
            this.createArialLabelElement(container);
            this.createMessageBox(container);
            this.createTree(container);
            this.createListeners();
            this.updateFilter();
            this._register(this.onDidFocus(() => this.panelFoucusContextKey.set(true)));
            this._register(this.onDidBlur(() => this.panelFoucusContextKey.set(false)));
            this._register(this.onDidChangeVisibility(visible => {
                if (visible) {
                    this.refreshPanel();
                }
                else {
                    this.rangeHighlightDecorations.removeHighlightRange();
                }
            }));
            this.render();
        }
        getTitle() {
            return messages_1.default.MARKERS_PANEL_TITLE_PROBLEMS;
        }
        layout(dimension) {
            this.tree.layout(dimension.height, dimension.width);
            if (this.filterInputActionViewItem) {
                this.filterInputActionViewItem.toggleLayout(dimension.width < 1200);
            }
        }
        focus() {
            if (this.tree.getHTMLElement() === document.activeElement) {
                return;
            }
            if (this.isEmpty()) {
                this.messageBoxContainer.focus();
            }
            else {
                this.tree.getHTMLElement().focus();
            }
        }
        focusFilter() {
            if (this.filterInputActionViewItem) {
                this.filterInputActionViewItem.focus();
            }
        }
        getActions() {
            return [this.filterAction, this.collapseAllAction];
        }
        showQuickFixes(marker) {
            const viewModel = this.markersViewModel.getViewModel(marker);
            if (viewModel) {
                viewModel.quickFixAction.run();
            }
        }
        openFileAtElement(element, preserveFocus, sideByside, pinned) {
            const { resource, selection, event, data } = element instanceof markersModel_1.Marker ? { resource: element.resource, selection: element.range, event: 'problems.selectDiagnostic', data: this.getTelemetryData(element.marker) } :
                element instanceof markersModel_1.RelatedInformation ? { resource: element.raw.resource, selection: element.raw, event: 'problems.selectRelatedInformation', data: this.getTelemetryData(element.marker) } : { resource: null, selection: null, event: null, data: null };
            if (resource && selection && event) {
                /* __GDPR__
                "problems.selectDiagnostic" : {
                    "source": { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" },
                    "code" : { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" }
                }
                */
                /* __GDPR__
                    "problems.selectRelatedInformation" : {
                        "source": { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" },
                        "code" : { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" }
                    }
                */
                this.telemetryService.publicLog(event, data);
                this.editorService.openEditor({
                    resource,
                    options: {
                        selection,
                        preserveFocus,
                        pinned,
                        revealIfVisible: true
                    },
                }, sideByside ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP).then(editor => {
                    if (editor && preserveFocus) {
                        this.rangeHighlightDecorations.highlightRange({ resource, range: selection }, editor.getControl());
                    }
                    else {
                        this.rangeHighlightDecorations.removeHighlightRange();
                    }
                });
                return true;
            }
            else {
                this.rangeHighlightDecorations.removeHighlightRange();
            }
            return false;
        }
        refreshPanel(markerOrChange) {
            if (this.isVisible()) {
                this.cachedFilterStats = undefined;
                if (markerOrChange) {
                    if (markerOrChange instanceof markersModel_1.Marker) {
                        this.tree.rerender(markerOrChange);
                    }
                    else {
                        if (markerOrChange.added.length || markerOrChange.removed.length) {
                            // Reset complete tree
                            this.tree.setChildren(null, createModelIterator(this.markersWorkbenchService.markersModel));
                        }
                        else {
                            // Update resource
                            for (const updated of markerOrChange.updated) {
                                this.tree.setChildren(updated, createResourceMarkersIterator(updated));
                            }
                        }
                    }
                }
                else {
                    // Reset complete tree
                    this.tree.setChildren(null, createModelIterator(this.markersWorkbenchService.markersModel));
                }
                const { total, filtered } = this.getFilterStats();
                this.tree.toggleVisibility(total === 0 || filtered === 0);
                this.renderMessage();
                this._onDidFilter.fire();
            }
        }
        onDidChangeViewState(marker) {
            this.refreshPanel(marker);
        }
        updateFilter() {
            this.cachedFilterStats = undefined;
            this.filter.options = new markersFilterOptions_1.FilterOptions(this.filterAction.filterText, this.getFilesExcludeExpressions());
            this.tree.refilter();
            this._onDidFilter.fire();
            const { total, filtered } = this.getFilterStats();
            this.tree.toggleVisibility(total === 0 || filtered === 0);
            this.renderMessage();
        }
        getFilesExcludeExpressions() {
            if (!this.filterAction.useFilesExclude) {
                return [];
            }
            const workspaceFolders = this.workspaceContextService.getWorkspace().folders;
            return workspaceFolders.length
                ? workspaceFolders.map(workspaceFolder => ({ root: workspaceFolder.uri, expression: this.getFilesExclude(workspaceFolder.uri) }))
                : this.getFilesExclude();
        }
        getFilesExclude(resource) {
            return objects_1.deepClone(this.configurationService.getValue('files.exclude', { resource })) || {};
        }
        createMessageBox(parent) {
            this.messageBoxContainer = dom.append(parent, dom.$('.message-box-container'));
            this.messageBoxContainer.setAttribute('aria-labelledby', 'markers-panel-arialabel');
        }
        createArialLabelElement(parent) {
            this.ariaLabelElement = dom.append(parent, dom.$(''));
            this.ariaLabelElement.setAttribute('id', 'markers-panel-arialabel');
            this.ariaLabelElement.setAttribute('aria-live', 'polite');
        }
        createTree(parent) {
            const onDidChangeRenderNodeCount = new event_1.Relay();
            const treeLabels = this._register(this.instantiationService.createInstance(labels_1.ResourceLabels, this));
            const virtualDelegate = new markersTreeViewer_1.VirtualDelegate(this.markersViewModel);
            const renderers = [
                this.instantiationService.createInstance(markersTreeViewer_1.ResourceMarkersRenderer, treeLabels, onDidChangeRenderNodeCount.event),
                this.instantiationService.createInstance(markersTreeViewer_1.MarkerRenderer, this.markersViewModel),
                this.instantiationService.createInstance(markersTreeViewer_1.RelatedInformationRenderer)
            ];
            const accessibilityProvider = this.instantiationService.createInstance(markersTreeViewer_1.MarkersTreeAccessibilityProvider);
            const identityProvider = {
                getId(element) {
                    return element.id;
                }
            };
            this.tree = this._register(this.instantiationService.createInstance(MarkersTree, 'MarkersPanel', dom.append(parent, dom.$('.tree-container.show-file-icons')), virtualDelegate, renderers, {
                filter: this.filter,
                accessibilityProvider,
                identityProvider,
                dnd: new markersTreeViewer_1.ResourceDragAndDrop(this.instantiationService),
                expandOnlyOnTwistieClick: (e) => e instanceof markersModel_1.Marker && e.relatedInformation.length > 0
            }));
            onDidChangeRenderNodeCount.input = this.tree.onDidChangeRenderNodeCount;
            const markerFocusContextKey = constants_1.default.MarkerFocusContextKey.bindTo(this.tree.contextKeyService);
            const relatedInformationFocusContextKey = constants_1.default.RelatedInformationFocusContextKey.bindTo(this.tree.contextKeyService);
            this._register(this.tree.onDidChangeFocus(focus => {
                markerFocusContextKey.set(focus.elements.some(e => e instanceof markersModel_1.Marker));
                relatedInformationFocusContextKey.set(focus.elements.some(e => e instanceof markersModel_1.RelatedInformation));
            }));
            const markersNavigator = this._register(new listService_1.TreeResourceNavigator2(this.tree, { openOnFocus: true }));
            this._register(event_1.Event.debounce(markersNavigator.onDidOpenResource, (last, event) => event, 75, true)(options => {
                this.openFileAtElement(options.element, !!options.editorOptions.preserveFocus, options.sideBySide, !!options.editorOptions.pinned);
            }));
            this._register(this.tree.onDidChangeCollapseState(({ node }) => {
                const { element } = node;
                if (element instanceof markersModel_1.RelatedInformation && !node.collapsed) {
                    /* __GDPR__
                    "problems.expandRelatedInformation" : {
                        "source": { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" },
                        "code" : { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" }
                    }
                    */
                    this.telemetryService.publicLog('problems.expandRelatedInformation', this.getTelemetryData(element.marker));
                }
            }));
            this._register(this.tree.onContextMenu(this.onContextMenu, this));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (this.filterAction.useFilesExclude && e.affectsConfiguration('files.exclude')) {
                    this.updateFilter();
                }
            }));
            // move focus to input, whenever a key is pressed in the panel container
            this._register(event_2.domEvent(parent, 'keydown')(e => {
                if (this.filterInputActionViewItem && this.keybindingService.mightProducePrintableCharacter(new keyboardEvent_1.StandardKeyboardEvent(e))) {
                    this.filterInputActionViewItem.focus();
                }
            }));
            this._register(event_1.Event.any(this.tree.onDidChangeSelection, this.tree.onDidChangeFocus)(() => {
                const elements = [...this.tree.getSelection(), ...this.tree.getFocus()];
                for (const element of elements) {
                    if (element instanceof markersModel_1.Marker) {
                        const viewModel = this.markersViewModel.getViewModel(element);
                        if (viewModel) {
                            viewModel.showLightBulb();
                        }
                    }
                }
            }));
        }
        collapseAll() {
            this.tree.collapseAll();
            this.tree.setSelection([]);
            this.tree.setFocus([]);
            this.tree.getHTMLElement().focus();
            this.tree.focusFirst();
        }
        createListeners() {
            this._register(event_1.Event.any(this.markersWorkbenchService.markersModel.onDidChange, this.editorService.onDidActiveEditorChange)(changes => {
                if (changes) {
                    this.onDidChangeModel(changes);
                }
                else {
                    this.onActiveEditorChanged();
                }
            }));
            this._register(this.tree.onDidChangeSelection(() => this.onSelected()));
            this._register(this.filterAction.onDidChange((event) => {
                if (event.filterText || event.useFilesExclude) {
                    this.updateFilter();
                }
            }));
        }
        onDidChangeModel(change) {
            const resourceMarkers = [...change.added, ...change.removed, ...change.updated];
            const resources = [];
            for (const { resource } of resourceMarkers) {
                this.markersViewModel.remove(resource);
                const resourceMarkers = this.markersWorkbenchService.markersModel.getResourceMarkers(resource);
                if (resourceMarkers) {
                    for (const marker of resourceMarkers.markers) {
                        this.markersViewModel.add(marker);
                    }
                }
                resources.push(resource);
            }
            this.currentResourceGotAddedToMarkersData = this.currentResourceGotAddedToMarkersData || this.isCurrentResourceGotAddedToMarkersData(resources);
            this.refreshPanel(change);
            this.updateRangeHighlights();
            if (this.currentResourceGotAddedToMarkersData) {
                this.autoReveal();
                this.currentResourceGotAddedToMarkersData = false;
            }
        }
        isCurrentResourceGotAddedToMarkersData(changedResources) {
            const currentlyActiveResource = this.currentActiveResource;
            if (!currentlyActiveResource) {
                return false;
            }
            const resourceForCurrentActiveResource = this.getResourceForCurrentActiveResource();
            if (resourceForCurrentActiveResource) {
                return false;
            }
            return changedResources.some(r => r.toString() === currentlyActiveResource.toString());
        }
        onActiveEditorChanged() {
            this.setCurrentActiveEditor();
            this.autoReveal();
        }
        setCurrentActiveEditor() {
            const activeEditor = this.editorService.activeEditor;
            this.currentActiveResource = activeEditor ? types_1.withUndefinedAsNull(activeEditor.getResource()) : null;
        }
        onSelected() {
            let selection = this.tree.getSelection();
            if (selection && selection.length > 0) {
                this.lastSelectedRelativeTop = this.tree.getRelativeTop(selection[0]) || 0;
            }
        }
        isEmpty() {
            const { total, filtered } = this.getFilterStats();
            return total === 0 || filtered === 0;
        }
        render() {
            this.cachedFilterStats = undefined;
            this.tree.setChildren(null, createModelIterator(this.markersWorkbenchService.markersModel));
            this.tree.toggleVisibility(this.isEmpty());
            this.renderMessage();
        }
        renderMessage() {
            dom.clearNode(this.messageBoxContainer);
            const { total, filtered } = this.getFilterStats();
            if (filtered === 0) {
                this.messageBoxContainer.style.display = 'block';
                this.messageBoxContainer.setAttribute('tabIndex', '0');
                if (total > 0) {
                    if (this.filter.options.filter) {
                        this.renderFilteredByFilterMessage(this.messageBoxContainer);
                    }
                    else {
                        this.renderFilteredByFilesExcludeMessage(this.messageBoxContainer);
                    }
                }
                else {
                    this.renderNoProblemsMessage(this.messageBoxContainer);
                }
            }
            else {
                this.messageBoxContainer.style.display = 'none';
                if (filtered === total) {
                    this.ariaLabelElement.setAttribute('aria-label', nls_1.localize('No problems filtered', "Showing {0} problems", total));
                }
                else {
                    this.ariaLabelElement.setAttribute('aria-label', nls_1.localize('problems filtered', "Showing {0} of {1} problems", filtered, total));
                }
                this.messageBoxContainer.removeAttribute('tabIndex');
            }
        }
        renderFilteredByFilesExcludeMessage(container) {
            const span1 = dom.append(container, dom.$('span'));
            span1.textContent = messages_1.default.MARKERS_PANEL_NO_PROBLEMS_FILE_EXCLUSIONS_FILTER;
            const link = dom.append(container, dom.$('a.messageAction'));
            link.textContent = nls_1.localize('disableFilesExclude', "Disable Files Exclude Filter.");
            link.setAttribute('tabIndex', '0');
            dom.addStandardDisposableListener(link, dom.EventType.CLICK, () => this.filterAction.useFilesExclude = false);
            dom.addStandardDisposableListener(link, dom.EventType.KEY_DOWN, (e) => {
                if (e.equals(3 /* Enter */) || e.equals(10 /* Space */)) {
                    this.filterAction.useFilesExclude = false;
                    e.stopPropagation();
                }
            });
            this.ariaLabelElement.setAttribute('aria-label', messages_1.default.MARKERS_PANEL_NO_PROBLEMS_FILE_EXCLUSIONS_FILTER);
        }
        renderFilteredByFilterMessage(container) {
            const span1 = dom.append(container, dom.$('span'));
            span1.textContent = messages_1.default.MARKERS_PANEL_NO_PROBLEMS_FILTERS;
            const link = dom.append(container, dom.$('a.messageAction'));
            link.textContent = nls_1.localize('clearFilter', "Clear Filter");
            link.setAttribute('tabIndex', '0');
            const span2 = dom.append(container, dom.$('span'));
            span2.textContent = '.';
            dom.addStandardDisposableListener(link, dom.EventType.CLICK, () => this.filterAction.filterText = '');
            dom.addStandardDisposableListener(link, dom.EventType.KEY_DOWN, (e) => {
                if (e.equals(3 /* Enter */) || e.equals(10 /* Space */)) {
                    this.filterAction.filterText = '';
                    e.stopPropagation();
                }
            });
            this.ariaLabelElement.setAttribute('aria-label', messages_1.default.MARKERS_PANEL_NO_PROBLEMS_FILTERS);
        }
        renderNoProblemsMessage(container) {
            const span = dom.append(container, dom.$('span'));
            span.textContent = messages_1.default.MARKERS_PANEL_NO_PROBLEMS_BUILT;
            this.ariaLabelElement.setAttribute('aria-label', messages_1.default.MARKERS_PANEL_NO_PROBLEMS_BUILT);
        }
        autoReveal(focus = false) {
            let autoReveal = this.configurationService.getValue('problems.autoReveal');
            if (typeof autoReveal === 'boolean' && autoReveal) {
                this.revealMarkersForCurrentActiveEditor(focus);
            }
        }
        revealMarkersForCurrentActiveEditor(focus = false) {
            let currentActiveResource = this.getResourceForCurrentActiveResource();
            if (currentActiveResource) {
                if (!this.tree.isCollapsed(currentActiveResource) && this.hasSelectedMarkerFor(currentActiveResource)) {
                    this.tree.reveal(this.tree.getSelection()[0], this.lastSelectedRelativeTop);
                    if (focus) {
                        this.tree.setFocus(this.tree.getSelection());
                    }
                }
                else {
                    this.tree.expand(currentActiveResource);
                    this.tree.reveal(currentActiveResource, 0);
                    if (focus) {
                        this.tree.setFocus([currentActiveResource]);
                        this.tree.setSelection([currentActiveResource]);
                    }
                }
            }
            else if (focus) {
                this.tree.setSelection([]);
                this.tree.focusFirst();
            }
        }
        getResourceForCurrentActiveResource() {
            return this.currentActiveResource ? this.markersWorkbenchService.markersModel.getResourceMarkers(this.currentActiveResource) : null;
        }
        hasSelectedMarkerFor(resource) {
            let selectedElement = this.tree.getSelection();
            if (selectedElement && selectedElement.length > 0) {
                if (selectedElement[0] instanceof markersModel_1.Marker) {
                    if (resource.resource.toString() === selectedElement[0].marker.resource.toString()) {
                        return true;
                    }
                }
            }
            return false;
        }
        updateRangeHighlights() {
            this.rangeHighlightDecorations.removeHighlightRange();
            if (this.tree.getHTMLElement() === document.activeElement) {
                this.highlightCurrentSelectedMarkerRange();
            }
        }
        highlightCurrentSelectedMarkerRange() {
            const selections = this.tree.getSelection();
            if (selections.length !== 1) {
                return;
            }
            const selection = selections[0];
            if (!(selection instanceof markersModel_1.Marker)) {
                return;
            }
            this.rangeHighlightDecorations.highlightRange(selection);
        }
        onContextMenu(e) {
            const element = e.element;
            if (!element) {
                return;
            }
            e.browserEvent.preventDefault();
            e.browserEvent.stopPropagation();
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => this.getMenuActions(element),
                getActionViewItem: (action) => {
                    const keybinding = this.keybindingService.lookupKeybinding(action.id);
                    if (keybinding) {
                        return new actionbar_1.ActionViewItem(action, action, { label: true, keybinding: keybinding.getLabel() });
                    }
                    return undefined;
                },
                onHide: (wasCancelled) => {
                    if (wasCancelled) {
                        this.tree.domFocus();
                    }
                }
            });
        }
        getMenuActions(element) {
            const result = [];
            if (element instanceof markersModel_1.Marker) {
                const viewModel = this.markersViewModel.getViewModel(element);
                if (viewModel) {
                    const quickFixActions = viewModel.quickFixAction.quickFixes;
                    if (quickFixActions.length) {
                        result.push(...quickFixActions);
                        result.push(new actionbar_1.Separator());
                    }
                }
            }
            const menu = this.menuService.createMenu(28 /* ProblemsPanelContext */, this.tree.contextKeyService);
            const groups = menu.getActions();
            menu.dispose();
            for (let group of groups) {
                const [, actions] = group;
                result.push(...actions);
                result.push(new actionbar_1.Separator());
            }
            result.pop(); // remove last separator
            return result;
        }
        getFocusElement() {
            return this.tree.getFocus()[0];
        }
        getActionViewItem(action) {
            if (action.id === markersPanelActions_1.MarkersFilterAction.ID) {
                this.filterInputActionViewItem = this.instantiationService.createInstance(markersPanelActions_1.MarkersFilterActionViewItem, this.filterAction, this);
                return this.filterInputActionViewItem;
            }
            return super.getActionViewItem(action);
        }
        getFilterOptions() {
            return this.filter.options;
        }
        getFilterStats() {
            if (!this.cachedFilterStats) {
                this.cachedFilterStats = this.computeFilterStats();
            }
            return this.cachedFilterStats;
        }
        computeFilterStats() {
            const root = this.tree.getNode();
            let total = 0;
            let filtered = 0;
            for (const resourceMarkerNode of root.children) {
                for (const markerNode of resourceMarkerNode.children) {
                    total++;
                    if (resourceMarkerNode.visible && markerNode.visible) {
                        filtered++;
                    }
                }
            }
            return { total, filtered };
        }
        getTelemetryData({ source, code }) {
            return { source, code };
        }
        saveState() {
            this.panelState['filter'] = this.filterAction.filterText;
            this.panelState['filterHistory'] = this.filterAction.filterHistory;
            this.panelState['useFilesExclude'] = this.filterAction.useFilesExclude;
            this.panelState['multiline'] = this.markersViewModel.multiline;
            super.saveState();
        }
    };
    MarkersPanel = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, editorService_1.IEditorService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, themeService_1.IThemeService),
        __param(5, markers_1.IMarkersWorkbenchService),
        __param(6, storage_1.IStorageService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, contextView_1.IContextMenuService),
        __param(10, actions_2.IMenuService),
        __param(11, keybinding_1.IKeybindingService)
    ], MarkersPanel);
    exports.MarkersPanel = MarkersPanel;
    let MarkersTree = class MarkersTree extends listService_1.WorkbenchObjectTree {
        constructor(user, container, delegate, renderers, options, contextKeyService, listService, themeService, configurationService, keybindingService, accessibilityService) {
            super(user, container, delegate, renderers, options, contextKeyService, listService, themeService, configurationService, keybindingService, accessibilityService);
            this.container = container;
        }
        layout(height, width) {
            this.container.style.height = `${height}px`;
            super.layout(height, width);
        }
        toggleVisibility(hide) {
            dom.toggleClass(this.container, 'hidden', hide);
        }
    };
    MarkersTree = __decorate([
        __param(5, contextkey_1.IContextKeyService),
        __param(6, listService_1.IListService),
        __param(7, themeService_1.IThemeService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, keybinding_1.IKeybindingService),
        __param(10, accessibility_1.IAccessibilityService)
    ], MarkersTree);
});
//# sourceMappingURL=markersPanel.js.map