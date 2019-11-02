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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/list/listPaging", "vs/base/browser/ui/list/listWidget", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/types", "vs/base/parts/tree/browser/treeDefaults", "vs/base/parts/tree/browser/treeImpl", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/registry/common/platform", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/contextkey/common/contextkeys", "vs/base/browser/ui/tree/objectTree", "vs/base/browser/ui/tree/asyncDataTree", "vs/base/browser/ui/tree/dataTree", "vs/platform/accessibility/common/accessibility"], function (require, exports, dom_1, listPaging_1, listWidget_1, event_1, lifecycle_1, types_1, treeDefaults_1, treeImpl_1, nls_1, configuration_1, configurationRegistry_1, contextkey_1, instantiation_1, keybinding_1, platform_1, styler_1, themeService_1, contextkeys_1, objectTree_1, asyncDataTree_1, dataTree_1, accessibility_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IListService = instantiation_1.createDecorator('listService');
    let ListService = class ListService {
        constructor(contextKeyService) {
            this.lists = [];
            this._lastFocusedWidget = undefined;
        }
        get lastFocusedList() {
            return this._lastFocusedWidget;
        }
        register(widget, extraContextKeys) {
            if (this.lists.some(l => l.widget === widget)) {
                throw new Error('Cannot register the same widget multiple times');
            }
            // Keep in our lists list
            const registeredList = { widget, extraContextKeys };
            this.lists.push(registeredList);
            // Check for currently being focused
            if (widget.getHTMLElement() === document.activeElement) {
                this._lastFocusedWidget = widget;
            }
            return lifecycle_1.combinedDisposable(widget.onDidFocus(() => this._lastFocusedWidget = widget), lifecycle_1.toDisposable(() => this.lists.splice(this.lists.indexOf(registeredList), 1)), widget.onDidDispose(() => {
                this.lists = this.lists.filter(l => l !== registeredList);
                if (this._lastFocusedWidget === widget) {
                    this._lastFocusedWidget = undefined;
                }
            }));
        }
    };
    ListService = __decorate([
        __param(0, contextkey_1.IContextKeyService)
    ], ListService);
    exports.ListService = ListService;
    const RawWorkbenchListFocusContextKey = new contextkey_1.RawContextKey('listFocus', true);
    exports.WorkbenchListSupportsMultiSelectContextKey = new contextkey_1.RawContextKey('listSupportsMultiselect', true);
    exports.WorkbenchListFocusContextKey = contextkey_1.ContextKeyExpr.and(RawWorkbenchListFocusContextKey, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey));
    exports.WorkbenchListHasSelectionOrFocus = new contextkey_1.RawContextKey('listHasSelectionOrFocus', false);
    exports.WorkbenchListDoubleSelection = new contextkey_1.RawContextKey('listDoubleSelection', false);
    exports.WorkbenchListMultiSelection = new contextkey_1.RawContextKey('listMultiSelection', false);
    exports.WorkbenchListSupportsKeyboardNavigation = new contextkey_1.RawContextKey('listSupportsKeyboardNavigation', true);
    exports.WorkbenchListAutomaticKeyboardNavigationKey = 'listAutomaticKeyboardNavigation';
    exports.WorkbenchListAutomaticKeyboardNavigation = new contextkey_1.RawContextKey(exports.WorkbenchListAutomaticKeyboardNavigationKey, true);
    exports.didBindWorkbenchListAutomaticKeyboardNavigation = false;
    function createScopedContextKeyService(contextKeyService, widget) {
        const result = contextKeyService.createScoped(widget.getHTMLElement());
        RawWorkbenchListFocusContextKey.bindTo(result);
        return result;
    }
    exports.multiSelectModifierSettingKey = 'workbench.list.multiSelectModifier';
    exports.openModeSettingKey = 'workbench.list.openMode';
    exports.horizontalScrollingKey = 'workbench.list.horizontalScrolling';
    exports.keyboardNavigationSettingKey = 'workbench.list.keyboardNavigation';
    exports.automaticKeyboardNavigationSettingKey = 'workbench.list.automaticKeyboardNavigation';
    const treeIndentKey = 'workbench.tree.indent';
    const treeRenderIndentGuidesKey = 'workbench.tree.renderIndentGuides';
    function getHorizontalScrollingSetting(configurationService) {
        return configuration_1.getMigratedSettingValue(configurationService, exports.horizontalScrollingKey, 'workbench.tree.horizontalScrolling');
    }
    function useAltAsMultipleSelectionModifier(configurationService) {
        return configurationService.getValue(exports.multiSelectModifierSettingKey) === 'alt';
    }
    function useSingleClickToOpen(configurationService) {
        return configurationService.getValue(exports.openModeSettingKey) !== 'doubleClick';
    }
    class MultipleSelectionController extends lifecycle_1.Disposable {
        constructor(configurationService) {
            super();
            this.configurationService = configurationService;
            this.useAltAsMultipleSelectionModifier = useAltAsMultipleSelectionModifier(configurationService);
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(exports.multiSelectModifierSettingKey)) {
                    this.useAltAsMultipleSelectionModifier = useAltAsMultipleSelectionModifier(this.configurationService);
                }
            }));
        }
        isSelectionSingleChangeEvent(event) {
            if (this.useAltAsMultipleSelectionModifier) {
                return event.browserEvent.altKey;
            }
            return listWidget_1.isSelectionSingleChangeEvent(event);
        }
        isSelectionRangeChangeEvent(event) {
            return listWidget_1.isSelectionRangeChangeEvent(event);
        }
    }
    class WorkbenchOpenController extends lifecycle_1.Disposable {
        constructor(configurationService, existingOpenController) {
            super();
            this.configurationService = configurationService;
            this.existingOpenController = existingOpenController;
            this.openOnSingleClick = useSingleClickToOpen(configurationService);
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(exports.openModeSettingKey)) {
                    this.openOnSingleClick = useSingleClickToOpen(this.configurationService);
                }
            }));
        }
        shouldOpen(event) {
            if (event instanceof MouseEvent) {
                const isLeftButton = event.button === 0;
                const isDoubleClick = event.detail === 2;
                if (isLeftButton && !this.openOnSingleClick && !isDoubleClick) {
                    return false;
                }
                if (isLeftButton /* left mouse button */ || event.button === 1 /* middle mouse button */) {
                    return this.existingOpenController ? this.existingOpenController.shouldOpen(event) : true;
                }
                return false;
            }
            return this.existingOpenController ? this.existingOpenController.shouldOpen(event) : true;
        }
    }
    function toWorkbenchListOptions(options, configurationService, keybindingService) {
        const disposables = new lifecycle_1.DisposableStore();
        const result = Object.assign({}, options);
        if (options.multipleSelectionSupport !== false && !options.multipleSelectionController) {
            const multipleSelectionController = new MultipleSelectionController(configurationService);
            result.multipleSelectionController = multipleSelectionController;
            disposables.add(multipleSelectionController);
        }
        const openController = new WorkbenchOpenController(configurationService, options.openController);
        result.openController = openController;
        disposables.add(openController);
        result.keyboardNavigationDelegate = {
            mightProducePrintableCharacter(e) {
                return keybindingService.mightProducePrintableCharacter(e);
            }
        };
        return [result, disposables];
    }
    let sharedListStyleSheet;
    function getSharedListStyleSheet() {
        if (!sharedListStyleSheet) {
            sharedListStyleSheet = dom_1.createStyleSheet();
        }
        return sharedListStyleSheet;
    }
    let WorkbenchList = class WorkbenchList extends listWidget_1.List {
        constructor(user, container, delegate, renderers, options, contextKeyService, listService, themeService, configurationService, keybindingService) {
            const horizontalScrolling = typeof options.horizontalScrolling !== 'undefined' ? options.horizontalScrolling : getHorizontalScrollingSetting(configurationService);
            const [workbenchListOptions, workbenchListOptionsDisposable] = toWorkbenchListOptions(options, configurationService, keybindingService);
            super(user, container, delegate, renderers, Object.assign(Object.assign(Object.assign({ keyboardSupport: false, styleController: new listWidget_1.DefaultStyleController(getSharedListStyleSheet()) }, styler_1.computeStyles(themeService.getTheme(), styler_1.defaultListStyles)), workbenchListOptions), { horizontalScrolling }));
            this.disposables.add(workbenchListOptionsDisposable);
            this.contextKeyService = createScopedContextKeyService(contextKeyService, this);
            this.configurationService = configurationService;
            const listSupportsMultiSelect = exports.WorkbenchListSupportsMultiSelectContextKey.bindTo(this.contextKeyService);
            listSupportsMultiSelect.set(!(options.multipleSelectionSupport === false));
            this.listHasSelectionOrFocus = exports.WorkbenchListHasSelectionOrFocus.bindTo(this.contextKeyService);
            this.listDoubleSelection = exports.WorkbenchListDoubleSelection.bindTo(this.contextKeyService);
            this.listMultiSelection = exports.WorkbenchListMultiSelection.bindTo(this.contextKeyService);
            this._useAltAsMultipleSelectionModifier = useAltAsMultipleSelectionModifier(configurationService);
            this.disposables.add(this.contextKeyService);
            this.disposables.add(listService.register(this));
            this.disposables.add(styler_1.attachListStyler(this, themeService));
            this.disposables.add(this.onSelectionChange(() => {
                const selection = this.getSelection();
                const focus = this.getFocus();
                this.listHasSelectionOrFocus.set(selection.length > 0 || focus.length > 0);
                this.listMultiSelection.set(selection.length > 1);
                this.listDoubleSelection.set(selection.length === 2);
            }));
            this.disposables.add(this.onFocusChange(() => {
                const selection = this.getSelection();
                const focus = this.getFocus();
                this.listHasSelectionOrFocus.set(selection.length > 0 || focus.length > 0);
            }));
            this.registerListeners();
        }
        registerListeners() {
            this.disposables.add(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(exports.multiSelectModifierSettingKey)) {
                    this._useAltAsMultipleSelectionModifier = useAltAsMultipleSelectionModifier(this.configurationService);
                }
            }));
        }
        get useAltAsMultipleSelectionModifier() {
            return this._useAltAsMultipleSelectionModifier;
        }
    };
    WorkbenchList = __decorate([
        __param(5, contextkey_1.IContextKeyService),
        __param(6, exports.IListService),
        __param(7, themeService_1.IThemeService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, keybinding_1.IKeybindingService)
    ], WorkbenchList);
    exports.WorkbenchList = WorkbenchList;
    let WorkbenchPagedList = class WorkbenchPagedList extends listPaging_1.PagedList {
        constructor(user, container, delegate, renderers, options, contextKeyService, listService, themeService, configurationService, keybindingService) {
            const horizontalScrolling = typeof options.horizontalScrolling !== 'undefined' ? options.horizontalScrolling : getHorizontalScrollingSetting(configurationService);
            const [workbenchListOptions, workbenchListOptionsDisposable] = toWorkbenchListOptions(options, configurationService, keybindingService);
            super(user, container, delegate, renderers, Object.assign(Object.assign(Object.assign({ keyboardSupport: false, styleController: new listWidget_1.DefaultStyleController(getSharedListStyleSheet()) }, styler_1.computeStyles(themeService.getTheme(), styler_1.defaultListStyles)), workbenchListOptions), { horizontalScrolling }));
            this.disposables = new lifecycle_1.DisposableStore();
            this.disposables.add(workbenchListOptionsDisposable);
            this.contextKeyService = createScopedContextKeyService(contextKeyService, this);
            this.configurationService = configurationService;
            const listSupportsMultiSelect = exports.WorkbenchListSupportsMultiSelectContextKey.bindTo(this.contextKeyService);
            listSupportsMultiSelect.set(!(options.multipleSelectionSupport === false));
            this._useAltAsMultipleSelectionModifier = useAltAsMultipleSelectionModifier(configurationService);
            this.disposables.add(this.contextKeyService);
            this.disposables.add(listService.register(this));
            this.disposables.add(styler_1.attachListStyler(this, themeService));
            this.registerListeners();
        }
        registerListeners() {
            this.disposables.add(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(exports.multiSelectModifierSettingKey)) {
                    this._useAltAsMultipleSelectionModifier = useAltAsMultipleSelectionModifier(this.configurationService);
                }
            }));
        }
        get useAltAsMultipleSelectionModifier() {
            return this._useAltAsMultipleSelectionModifier;
        }
        dispose() {
            super.dispose();
            this.disposables.dispose();
        }
    };
    WorkbenchPagedList = __decorate([
        __param(5, contextkey_1.IContextKeyService),
        __param(6, exports.IListService),
        __param(7, themeService_1.IThemeService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, keybinding_1.IKeybindingService)
    ], WorkbenchPagedList);
    exports.WorkbenchPagedList = WorkbenchPagedList;
    /**
     * @deprecated
     */
    let sharedTreeStyleSheet;
    function getSharedTreeStyleSheet() {
        if (!sharedTreeStyleSheet) {
            sharedTreeStyleSheet = dom_1.createStyleSheet();
        }
        return sharedTreeStyleSheet;
    }
    /**
     * @deprecated
     */
    function handleTreeController(configuration, instantiationService) {
        if (!configuration.controller) {
            configuration.controller = instantiationService.createInstance(WorkbenchTreeController, {});
        }
        if (!configuration.styler) {
            configuration.styler = new treeDefaults_1.DefaultTreestyler(getSharedTreeStyleSheet());
        }
        return configuration;
    }
    /**
     * @deprecated
     */
    let WorkbenchTree = class WorkbenchTree extends treeImpl_1.Tree {
        constructor(container, configuration, options, contextKeyService, listService, themeService, instantiationService, configurationService) {
            const config = handleTreeController(configuration, instantiationService);
            const horizontalScrollMode = configurationService.getValue(exports.horizontalScrollingKey) ? 1 /* Auto */ : 2 /* Hidden */;
            const opts = Object.assign(Object.assign({ horizontalScrollMode, keyboardSupport: false }, styler_1.computeStyles(themeService.getTheme(), styler_1.defaultListStyles)), options);
            super(container, config, opts);
            this.disposables = [];
            this.contextKeyService = createScopedContextKeyService(contextKeyService, this);
            exports.WorkbenchListSupportsMultiSelectContextKey.bindTo(this.contextKeyService);
            this.listHasSelectionOrFocus = exports.WorkbenchListHasSelectionOrFocus.bindTo(this.contextKeyService);
            this.listDoubleSelection = exports.WorkbenchListDoubleSelection.bindTo(this.contextKeyService);
            this.listMultiSelection = exports.WorkbenchListMultiSelection.bindTo(this.contextKeyService);
            this._openOnSingleClick = useSingleClickToOpen(configurationService);
            this._useAltAsMultipleSelectionModifier = useAltAsMultipleSelectionModifier(configurationService);
            this.disposables.push(this.contextKeyService, listService.register(this), styler_1.attachListStyler(this, themeService));
            this.disposables.push(this.onDidChangeSelection(() => {
                const selection = this.getSelection();
                const focus = this.getFocus();
                this.listHasSelectionOrFocus.set((selection && selection.length > 0) || !!focus);
                this.listDoubleSelection.set(selection && selection.length === 2);
                this.listMultiSelection.set(selection && selection.length > 1);
            }));
            this.disposables.push(this.onDidChangeFocus(() => {
                const selection = this.getSelection();
                const focus = this.getFocus();
                this.listHasSelectionOrFocus.set((selection && selection.length > 0) || !!focus);
            }));
            this.disposables.push(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(exports.openModeSettingKey)) {
                    this._openOnSingleClick = useSingleClickToOpen(configurationService);
                }
                if (e.affectsConfiguration(exports.multiSelectModifierSettingKey)) {
                    this._useAltAsMultipleSelectionModifier = useAltAsMultipleSelectionModifier(configurationService);
                }
            }));
        }
        get openOnSingleClick() {
            return this._openOnSingleClick;
        }
        get useAltAsMultipleSelectionModifier() {
            return this._useAltAsMultipleSelectionModifier;
        }
        dispose() {
            super.dispose();
            this.disposables = lifecycle_1.dispose(this.disposables);
        }
    };
    WorkbenchTree = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, exports.IListService),
        __param(5, themeService_1.IThemeService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, configuration_1.IConfigurationService)
    ], WorkbenchTree);
    exports.WorkbenchTree = WorkbenchTree;
    /**
     * @deprecated
     */
    function massageControllerOptions(options) {
        if (typeof options.keyboardSupport !== 'boolean') {
            options.keyboardSupport = false;
        }
        if (typeof options.clickBehavior !== 'number') {
            options.clickBehavior = 0 /* ON_MOUSE_DOWN */;
        }
        return options;
    }
    /**
     * @deprecated
     */
    let WorkbenchTreeController = class WorkbenchTreeController extends treeDefaults_1.DefaultController {
        constructor(options, configurationService) {
            super(massageControllerOptions(options));
            this.configurationService = configurationService;
            this.disposables = new lifecycle_1.DisposableStore();
            // if the open mode is not set, we configure it based on settings
            if (types_1.isUndefinedOrNull(options.openMode)) {
                this.setOpenMode(this.getOpenModeSetting());
                this.registerListeners();
            }
        }
        registerListeners() {
            this.disposables.add(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(exports.openModeSettingKey)) {
                    this.setOpenMode(this.getOpenModeSetting());
                }
            }));
        }
        getOpenModeSetting() {
            return useSingleClickToOpen(this.configurationService) ? 0 /* SINGLE_CLICK */ : 1 /* DOUBLE_CLICK */;
        }
        dispose() {
            this.disposables.dispose();
        }
    };
    WorkbenchTreeController = __decorate([
        __param(1, configuration_1.IConfigurationService)
    ], WorkbenchTreeController);
    exports.WorkbenchTreeController = WorkbenchTreeController;
    /**
     * @deprecated
     */
    class TreeResourceNavigator extends lifecycle_1.Disposable {
        constructor(tree, options) {
            super();
            this.tree = tree;
            this.options = options;
            this._openResource = new event_1.Emitter();
            this.openResource = this._openResource.event;
            this.registerListeners();
        }
        registerListeners() {
            if (this.options && this.options.openOnFocus) {
                this._register(this.tree.onDidChangeFocus(e => this.onFocus(e)));
            }
            this._register(this.tree.onDidChangeSelection(e => this.onSelection(e)));
        }
        onFocus({ payload }) {
            const element = this.tree.getFocus();
            this.tree.setSelection([element], { fromFocus: true });
            const originalEvent = payload && payload.originalEvent;
            const isMouseEvent = payload && payload.origin === 'mouse';
            const isDoubleClick = isMouseEvent && originalEvent && originalEvent.detail === 2;
            const preventOpen = payload && payload.preventOpenOnFocus;
            if (!preventOpen && (!isMouseEvent || this.tree.openOnSingleClick || isDoubleClick)) {
                this._openResource.fire({
                    editorOptions: {
                        preserveFocus: true,
                        pinned: false,
                        revealIfVisible: true
                    },
                    sideBySide: false,
                    element,
                    payload
                });
            }
        }
        onSelection({ payload }) {
            if (payload && payload.fromFocus) {
                return;
            }
            const originalEvent = payload && payload.originalEvent;
            const isMouseEvent = payload && payload.origin === 'mouse';
            const isDoubleClick = isMouseEvent && originalEvent && originalEvent.detail === 2;
            if (!isMouseEvent || this.tree.openOnSingleClick || isDoubleClick) {
                if (isDoubleClick && originalEvent) {
                    originalEvent.preventDefault(); // focus moves to editor, we need to prevent default
                }
                const isFromKeyboard = payload && payload.origin === 'keyboard';
                const sideBySide = (originalEvent && (originalEvent.ctrlKey || originalEvent.metaKey || originalEvent.altKey));
                const preserveFocus = !((isFromKeyboard && (!payload || !payload.preserveFocus)) || isDoubleClick || (payload && payload.focusEditor));
                this._openResource.fire({
                    editorOptions: {
                        preserveFocus,
                        pinned: isDoubleClick,
                        revealIfVisible: true
                    },
                    sideBySide,
                    element: this.tree.getSelection()[0],
                    payload
                });
            }
        }
    }
    exports.TreeResourceNavigator = TreeResourceNavigator;
    function getSelectionKeyboardEvent(typeArg = 'keydown', preserveFocus) {
        const e = new KeyboardEvent(typeArg);
        e.preserveFocus = preserveFocus;
        return e;
    }
    exports.getSelectionKeyboardEvent = getSelectionKeyboardEvent;
    class TreeResourceNavigator2 extends lifecycle_1.Disposable {
        constructor(tree, options) {
            super();
            this.tree = tree;
            this._onDidOpenResource = new event_1.Emitter();
            this.onDidOpenResource = this._onDidOpenResource.event;
            this.options = Object.assign({
                openOnSelection: true
            }, (options || {}));
            this.registerListeners();
        }
        registerListeners() {
            if (this.options && this.options.openOnFocus) {
                this._register(this.tree.onDidChangeFocus(e => this.onFocus(e)));
            }
            if (this.options && this.options.openOnSelection) {
                this._register(this.tree.onDidChangeSelection(e => this.onSelection(e)));
            }
            this._register(this.tree.onDidOpen(e => this.onSelection(e)));
        }
        onFocus(e) {
            const focus = this.tree.getFocus();
            this.tree.setSelection(focus, e.browserEvent);
            if (!e.browserEvent) {
                return;
            }
            const isMouseEvent = e.browserEvent && e.browserEvent instanceof MouseEvent;
            if (!isMouseEvent) {
                const preserveFocus = (e.browserEvent instanceof KeyboardEvent && typeof e.browserEvent.preserveFocus === 'boolean') ?
                    !!e.browserEvent.preserveFocus :
                    true;
                this.open(preserveFocus, false, false, e.browserEvent);
            }
        }
        onSelection(e, doubleClick = false) {
            if (!e.browserEvent || e.browserEvent.type === 'contextmenu') {
                return;
            }
            const isKeyboardEvent = e.browserEvent instanceof KeyboardEvent;
            const isMiddleClick = e.browserEvent instanceof MouseEvent ? e.browserEvent.button === 1 : false;
            const isDoubleClick = e.browserEvent.detail === 2;
            const preserveFocus = (e.browserEvent instanceof KeyboardEvent && typeof e.browserEvent.preserveFocus === 'boolean') ?
                !!e.browserEvent.preserveFocus :
                !isDoubleClick;
            if (this.tree.openOnSingleClick || isDoubleClick || isKeyboardEvent) {
                const sideBySide = e.browserEvent instanceof MouseEvent && (e.browserEvent.ctrlKey || e.browserEvent.metaKey || e.browserEvent.altKey);
                this.open(preserveFocus, isDoubleClick || isMiddleClick, sideBySide, e.browserEvent);
            }
        }
        open(preserveFocus, pinned, sideBySide, browserEvent) {
            this._onDidOpenResource.fire({
                editorOptions: {
                    preserveFocus,
                    pinned,
                    revealIfVisible: true
                },
                sideBySide,
                element: this.tree.getSelection()[0],
                browserEvent
            });
        }
    }
    exports.TreeResourceNavigator2 = TreeResourceNavigator2;
    function createKeyboardNavigationEventFilter(container, keybindingService) {
        let inChord = false;
        return event => {
            if (inChord) {
                inChord = false;
                return false;
            }
            const result = keybindingService.softDispatch(event, container);
            if (result && result.enterChord) {
                inChord = true;
                return false;
            }
            inChord = false;
            return true;
        };
    }
    let WorkbenchObjectTree = class WorkbenchObjectTree extends objectTree_1.ObjectTree {
        constructor(user, container, delegate, renderers, options, contextKeyService, listService, themeService, configurationService, keybindingService, accessibilityService) {
            const { options: treeOptions, getAutomaticKeyboardNavigation, disposable } = workbenchTreeDataPreamble(container, options, contextKeyService, themeService, configurationService, keybindingService, accessibilityService);
            super(user, container, delegate, renderers, treeOptions);
            this.disposables.add(disposable);
            this.internals = new WorkbenchTreeInternals(this, treeOptions, getAutomaticKeyboardNavigation, contextKeyService, listService, themeService, configurationService, accessibilityService);
            this.disposables.add(this.internals);
        }
        get contextKeyService() { return this.internals.contextKeyService; }
        get useAltAsMultipleSelectionModifier() { return this.internals.useAltAsMultipleSelectionModifier; }
    };
    WorkbenchObjectTree = __decorate([
        __param(5, contextkey_1.IContextKeyService),
        __param(6, exports.IListService),
        __param(7, themeService_1.IThemeService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, keybinding_1.IKeybindingService),
        __param(10, accessibility_1.IAccessibilityService)
    ], WorkbenchObjectTree);
    exports.WorkbenchObjectTree = WorkbenchObjectTree;
    let WorkbenchCompressibleObjectTree = class WorkbenchCompressibleObjectTree extends objectTree_1.CompressibleObjectTree {
        constructor(user, container, delegate, renderers, options, contextKeyService, listService, themeService, configurationService, keybindingService, accessibilityService) {
            const { options: treeOptions, getAutomaticKeyboardNavigation, disposable } = workbenchTreeDataPreamble(container, options, contextKeyService, themeService, configurationService, keybindingService, accessibilityService);
            super(user, container, delegate, renderers, treeOptions);
            this.disposables.add(disposable);
            this.internals = new WorkbenchTreeInternals(this, treeOptions, getAutomaticKeyboardNavigation, contextKeyService, listService, themeService, configurationService, accessibilityService);
            this.disposables.add(this.internals);
        }
        get contextKeyService() { return this.internals.contextKeyService; }
        get useAltAsMultipleSelectionModifier() { return this.internals.useAltAsMultipleSelectionModifier; }
    };
    WorkbenchCompressibleObjectTree = __decorate([
        __param(5, contextkey_1.IContextKeyService),
        __param(6, exports.IListService),
        __param(7, themeService_1.IThemeService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, keybinding_1.IKeybindingService),
        __param(10, accessibility_1.IAccessibilityService)
    ], WorkbenchCompressibleObjectTree);
    exports.WorkbenchCompressibleObjectTree = WorkbenchCompressibleObjectTree;
    let WorkbenchDataTree = class WorkbenchDataTree extends dataTree_1.DataTree {
        constructor(user, container, delegate, renderers, dataSource, options, contextKeyService, listService, themeService, configurationService, keybindingService, accessibilityService) {
            const { options: treeOptions, getAutomaticKeyboardNavigation, disposable } = workbenchTreeDataPreamble(container, options, contextKeyService, themeService, configurationService, keybindingService, accessibilityService);
            super(user, container, delegate, renderers, dataSource, treeOptions);
            this.disposables.add(disposable);
            this.internals = new WorkbenchTreeInternals(this, treeOptions, getAutomaticKeyboardNavigation, contextKeyService, listService, themeService, configurationService, accessibilityService);
            this.disposables.add(this.internals);
        }
        get contextKeyService() { return this.internals.contextKeyService; }
        get useAltAsMultipleSelectionModifier() { return this.internals.useAltAsMultipleSelectionModifier; }
    };
    WorkbenchDataTree = __decorate([
        __param(6, contextkey_1.IContextKeyService),
        __param(7, exports.IListService),
        __param(8, themeService_1.IThemeService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, keybinding_1.IKeybindingService),
        __param(11, accessibility_1.IAccessibilityService)
    ], WorkbenchDataTree);
    exports.WorkbenchDataTree = WorkbenchDataTree;
    let WorkbenchAsyncDataTree = class WorkbenchAsyncDataTree extends asyncDataTree_1.AsyncDataTree {
        constructor(user, container, delegate, renderers, dataSource, options, contextKeyService, listService, themeService, configurationService, keybindingService, accessibilityService) {
            const { options: treeOptions, getAutomaticKeyboardNavigation, disposable } = workbenchTreeDataPreamble(container, options, contextKeyService, themeService, configurationService, keybindingService, accessibilityService);
            super(user, container, delegate, renderers, dataSource, treeOptions);
            this.disposables.add(disposable);
            this.internals = new WorkbenchTreeInternals(this, treeOptions, getAutomaticKeyboardNavigation, contextKeyService, listService, themeService, configurationService, accessibilityService);
            this.disposables.add(this.internals);
        }
        get contextKeyService() { return this.internals.contextKeyService; }
        get useAltAsMultipleSelectionModifier() { return this.internals.useAltAsMultipleSelectionModifier; }
    };
    WorkbenchAsyncDataTree = __decorate([
        __param(6, contextkey_1.IContextKeyService),
        __param(7, exports.IListService),
        __param(8, themeService_1.IThemeService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, keybinding_1.IKeybindingService),
        __param(11, accessibility_1.IAccessibilityService)
    ], WorkbenchAsyncDataTree);
    exports.WorkbenchAsyncDataTree = WorkbenchAsyncDataTree;
    let WorkbenchCompressibleAsyncDataTree = class WorkbenchCompressibleAsyncDataTree extends asyncDataTree_1.CompressibleAsyncDataTree {
        constructor(user, container, virtualDelegate, compressionDelegate, renderers, dataSource, options, contextKeyService, listService, themeService, configurationService, keybindingService, accessibilityService) {
            const { options: treeOptions, getAutomaticKeyboardNavigation, disposable } = workbenchTreeDataPreamble(container, options, contextKeyService, themeService, configurationService, keybindingService, accessibilityService);
            super(user, container, virtualDelegate, compressionDelegate, renderers, dataSource, treeOptions);
            this.disposables.add(disposable);
            this.internals = new WorkbenchTreeInternals(this, treeOptions, getAutomaticKeyboardNavigation, contextKeyService, listService, themeService, configurationService, accessibilityService);
            this.disposables.add(this.internals);
        }
        get contextKeyService() { return this.internals.contextKeyService; }
        get useAltAsMultipleSelectionModifier() { return this.internals.useAltAsMultipleSelectionModifier; }
    };
    WorkbenchCompressibleAsyncDataTree = __decorate([
        __param(7, contextkey_1.IContextKeyService),
        __param(8, exports.IListService),
        __param(9, themeService_1.IThemeService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, keybinding_1.IKeybindingService),
        __param(12, accessibility_1.IAccessibilityService)
    ], WorkbenchCompressibleAsyncDataTree);
    exports.WorkbenchCompressibleAsyncDataTree = WorkbenchCompressibleAsyncDataTree;
    function workbenchTreeDataPreamble(container, options, contextKeyService, themeService, configurationService, keybindingService, accessibilityService) {
        exports.WorkbenchListSupportsKeyboardNavigation.bindTo(contextKeyService);
        if (!exports.didBindWorkbenchListAutomaticKeyboardNavigation) {
            exports.WorkbenchListAutomaticKeyboardNavigation.bindTo(contextKeyService);
            exports.didBindWorkbenchListAutomaticKeyboardNavigation = true;
        }
        const getAutomaticKeyboardNavigation = () => {
            // give priority to the context key value to disable this completely
            let automaticKeyboardNavigation = contextKeyService.getContextKeyValue(exports.WorkbenchListAutomaticKeyboardNavigationKey);
            if (automaticKeyboardNavigation) {
                automaticKeyboardNavigation = configurationService.getValue(exports.automaticKeyboardNavigationSettingKey);
            }
            return automaticKeyboardNavigation;
        };
        const accessibilityOn = accessibilityService.getAccessibilitySupport() === 2 /* Enabled */;
        const keyboardNavigation = accessibilityOn ? 'simple' : configurationService.getValue(exports.keyboardNavigationSettingKey);
        const horizontalScrolling = typeof options.horizontalScrolling !== 'undefined' ? options.horizontalScrolling : getHorizontalScrollingSetting(configurationService);
        const openOnSingleClick = useSingleClickToOpen(configurationService);
        const [workbenchListOptions, disposable] = toWorkbenchListOptions(options, configurationService, keybindingService);
        const additionalScrollHeight = options.additionalScrollHeight;
        return {
            getAutomaticKeyboardNavigation,
            disposable,
            options: Object.assign(Object.assign(Object.assign({ 
                // ...options, // TODO@Joao why is this not splatted here?
                keyboardSupport: false, styleController: new listWidget_1.DefaultStyleController(getSharedListStyleSheet()) }, styler_1.computeStyles(themeService.getTheme(), styler_1.defaultListStyles)), workbenchListOptions), { indent: configurationService.getValue(treeIndentKey), renderIndentGuides: configurationService.getValue(treeRenderIndentGuidesKey), automaticKeyboardNavigation: getAutomaticKeyboardNavigation(), simpleKeyboardNavigation: keyboardNavigation === 'simple', filterOnType: keyboardNavigation === 'filter', horizontalScrolling,
                openOnSingleClick, keyboardNavigationEventFilter: createKeyboardNavigationEventFilter(container, keybindingService), additionalScrollHeight, hideTwistiesOfChildlessElements: options.hideTwistiesOfChildlessElements })
        };
    }
    let WorkbenchTreeInternals = class WorkbenchTreeInternals {
        constructor(tree, options, getAutomaticKeyboardNavigation, contextKeyService, listService, themeService, configurationService, accessibilityService) {
            this.disposables = [];
            this.contextKeyService = createScopedContextKeyService(contextKeyService, tree);
            const listSupportsMultiSelect = exports.WorkbenchListSupportsMultiSelectContextKey.bindTo(this.contextKeyService);
            listSupportsMultiSelect.set(!(options.multipleSelectionSupport === false));
            this.hasSelectionOrFocus = exports.WorkbenchListHasSelectionOrFocus.bindTo(this.contextKeyService);
            this.hasDoubleSelection = exports.WorkbenchListDoubleSelection.bindTo(this.contextKeyService);
            this.hasMultiSelection = exports.WorkbenchListMultiSelection.bindTo(this.contextKeyService);
            this._useAltAsMultipleSelectionModifier = useAltAsMultipleSelectionModifier(configurationService);
            const interestingContextKeys = new Set();
            interestingContextKeys.add(exports.WorkbenchListAutomaticKeyboardNavigationKey);
            const updateKeyboardNavigation = () => {
                const accessibilityOn = accessibilityService.getAccessibilitySupport() === 2 /* Enabled */;
                const keyboardNavigation = accessibilityOn ? 'simple' : configurationService.getValue(exports.keyboardNavigationSettingKey);
                tree.updateOptions({
                    simpleKeyboardNavigation: keyboardNavigation === 'simple',
                    filterOnType: keyboardNavigation === 'filter'
                });
            };
            this.disposables.push(this.contextKeyService, listService.register(tree), styler_1.attachListStyler(tree, themeService), tree.onDidChangeSelection(() => {
                const selection = tree.getSelection();
                const focus = tree.getFocus();
                this.hasSelectionOrFocus.set(selection.length > 0 || focus.length > 0);
                this.hasMultiSelection.set(selection.length > 1);
                this.hasDoubleSelection.set(selection.length === 2);
            }), tree.onDidChangeFocus(() => {
                const selection = tree.getSelection();
                const focus = tree.getFocus();
                this.hasSelectionOrFocus.set(selection.length > 0 || focus.length > 0);
            }), configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(exports.openModeSettingKey)) {
                    tree.updateOptions({ openOnSingleClick: useSingleClickToOpen(configurationService) });
                }
                if (e.affectsConfiguration(exports.multiSelectModifierSettingKey)) {
                    this._useAltAsMultipleSelectionModifier = useAltAsMultipleSelectionModifier(configurationService);
                }
                if (e.affectsConfiguration(treeIndentKey)) {
                    const indent = configurationService.getValue(treeIndentKey);
                    tree.updateOptions({ indent });
                }
                if (e.affectsConfiguration(treeRenderIndentGuidesKey)) {
                    const renderIndentGuides = configurationService.getValue(treeRenderIndentGuidesKey);
                    tree.updateOptions({ renderIndentGuides });
                }
                if (e.affectsConfiguration(exports.keyboardNavigationSettingKey)) {
                    updateKeyboardNavigation();
                }
                if (e.affectsConfiguration(exports.automaticKeyboardNavigationSettingKey)) {
                    tree.updateOptions({ automaticKeyboardNavigation: getAutomaticKeyboardNavigation() });
                }
            }), this.contextKeyService.onDidChangeContext(e => {
                if (e.affectsSome(interestingContextKeys)) {
                    tree.updateOptions({ automaticKeyboardNavigation: getAutomaticKeyboardNavigation() });
                }
            }), accessibilityService.onDidChangeAccessibilitySupport(() => updateKeyboardNavigation()));
        }
        get useAltAsMultipleSelectionModifier() {
            return this._useAltAsMultipleSelectionModifier;
        }
        dispose() {
            this.disposables = lifecycle_1.dispose(this.disposables);
        }
    };
    WorkbenchTreeInternals = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, exports.IListService),
        __param(5, themeService_1.IThemeService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, accessibility_1.IAccessibilityService)
    ], WorkbenchTreeInternals);
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        'id': 'workbench',
        'order': 7,
        'title': nls_1.localize('workbenchConfigurationTitle', "Workbench"),
        'type': 'object',
        'properties': {
            [exports.multiSelectModifierSettingKey]: {
                'type': 'string',
                'enum': ['ctrlCmd', 'alt'],
                'enumDescriptions': [
                    nls_1.localize('multiSelectModifier.ctrlCmd', "Maps to `Control` on Windows and Linux and to `Command` on macOS."),
                    nls_1.localize('multiSelectModifier.alt', "Maps to `Alt` on Windows and Linux and to `Option` on macOS.")
                ],
                'default': 'ctrlCmd',
                'description': nls_1.localize({
                    key: 'multiSelectModifier',
                    comment: [
                        '- `ctrlCmd` refers to a value the setting can take and should not be localized.',
                        '- `Control` and `Command` refer to the modifier keys Ctrl or Cmd on the keyboard and can be localized.'
                    ]
                }, "The modifier to be used to add an item in trees and lists to a multi-selection with the mouse (for example in the explorer, open editors and scm view). The 'Open to Side' mouse gestures - if supported - will adapt such that they do not conflict with the multiselect modifier.")
            },
            [exports.openModeSettingKey]: {
                'type': 'string',
                'enum': ['singleClick', 'doubleClick'],
                'default': 'singleClick',
                'description': nls_1.localize({
                    key: 'openModeModifier',
                    comment: ['`singleClick` and `doubleClick` refers to a value the setting can take and should not be localized.']
                }, "Controls how to open items in trees and lists using the mouse (if supported). For parents with children in trees, this setting will control if a single click expands the parent or a double click. Note that some trees and lists might choose to ignore this setting if it is not applicable. ")
            },
            [exports.horizontalScrollingKey]: {
                'type': 'boolean',
                'default': false,
                'description': nls_1.localize('horizontalScrolling setting', "Controls whether lists and trees support horizontal scrolling in the workbench.")
            },
            'workbench.tree.horizontalScrolling': {
                'type': 'boolean',
                'default': false,
                'description': nls_1.localize('tree horizontalScrolling setting', "Controls whether trees support horizontal scrolling in the workbench."),
                'deprecationMessage': nls_1.localize('deprecated', "This setting is deprecated, please use '{0}' instead.", exports.horizontalScrollingKey)
            },
            [treeIndentKey]: {
                'type': 'number',
                'default': 8,
                minimum: 0,
                maximum: 40,
                'description': nls_1.localize('tree indent setting', "Controls tree indentation in pixels.")
            },
            [treeRenderIndentGuidesKey]: {
                type: 'string',
                enum: ['none', 'onHover', 'always'],
                default: 'onHover',
                description: nls_1.localize('render tree indent guides', "Controls whether the tree should render indent guides.")
            },
            [exports.keyboardNavigationSettingKey]: {
                'type': 'string',
                'enum': ['simple', 'highlight', 'filter'],
                'enumDescriptions': [
                    nls_1.localize('keyboardNavigationSettingKey.simple', "Simple keyboard navigation focuses elements which match the keyboard input. Matching is done only on prefixes."),
                    nls_1.localize('keyboardNavigationSettingKey.highlight', "Highlight keyboard navigation highlights elements which match the keyboard input. Further up and down navigation will traverse only the highlighted elements."),
                    nls_1.localize('keyboardNavigationSettingKey.filter', "Filter keyboard navigation will filter out and hide all the elements which do not match the keyboard input.")
                ],
                'default': 'highlight',
                'description': nls_1.localize('keyboardNavigationSettingKey', "Controls the keyboard navigation style for lists and trees in the workbench. Can be simple, highlight and filter.")
            },
            [exports.automaticKeyboardNavigationSettingKey]: {
                'type': 'boolean',
                'default': true,
                markdownDescription: nls_1.localize('automatic keyboard navigation setting', "Controls whether keyboard navigation in lists and trees is automatically triggered simply by typing. If set to `false`, keyboard navigation is only triggered when executing the `list.toggleKeyboardNavigation` command, for which you can assign a keyboard shortcut.")
            }
        }
    });
});
//# sourceMappingURL=listService.js.map