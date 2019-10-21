/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/parts/tree/browser/treeDefaults", "vs/base/parts/tree/browser/treeModel", "./treeView", "vs/base/common/iterator", "vs/base/common/event", "vs/base/common/color", "vs/base/common/objects", "vs/css!./tree"], function (require, exports, TreeDefaults, Model, View, iterator_1, event_1, color_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TreeContext {
        constructor(tree, configuration, options = {}) {
            this.tree = tree;
            this.configuration = configuration;
            this.options = options;
            if (!configuration.dataSource) {
                throw new Error('You must provide a Data Source to the tree.');
            }
            this.dataSource = configuration.dataSource;
            this.renderer = configuration.renderer;
            this.controller = configuration.controller || new TreeDefaults.DefaultController({ clickBehavior: 1 /* ON_MOUSE_UP */, keyboardSupport: typeof options.keyboardSupport !== 'boolean' || options.keyboardSupport });
            this.dnd = configuration.dnd || new TreeDefaults.DefaultDragAndDrop();
            this.filter = configuration.filter || new TreeDefaults.DefaultFilter();
            this.sorter = configuration.sorter;
            this.accessibilityProvider = configuration.accessibilityProvider || new TreeDefaults.DefaultAccessibilityProvider();
            this.styler = configuration.styler;
        }
    }
    exports.TreeContext = TreeContext;
    const defaultStyles = {
        listFocusBackground: color_1.Color.fromHex('#073655'),
        listActiveSelectionBackground: color_1.Color.fromHex('#0E639C'),
        listActiveSelectionForeground: color_1.Color.fromHex('#FFFFFF'),
        listFocusAndSelectionBackground: color_1.Color.fromHex('#094771'),
        listFocusAndSelectionForeground: color_1.Color.fromHex('#FFFFFF'),
        listInactiveSelectionBackground: color_1.Color.fromHex('#3F3F46'),
        listHoverBackground: color_1.Color.fromHex('#2A2D2E'),
        listDropBackground: color_1.Color.fromHex('#383B3D')
    };
    class Tree {
        constructor(container, configuration, options = {}) {
            this._onDidChangeFocus = new event_1.Relay();
            this.onDidChangeFocus = this._onDidChangeFocus.event;
            this._onDidChangeSelection = new event_1.Relay();
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this._onHighlightChange = new event_1.Relay();
            this.onDidChangeHighlight = this._onHighlightChange.event;
            this._onDidExpandItem = new event_1.Relay();
            this.onDidExpandItem = this._onDidExpandItem.event;
            this._onDidCollapseItem = new event_1.Relay();
            this.onDidCollapseItem = this._onDidCollapseItem.event;
            this._onDispose = new event_1.Emitter();
            this.onDidDispose = this._onDispose.event;
            this.container = container;
            objects_1.mixin(options, defaultStyles, false);
            options.twistiePixels = typeof options.twistiePixels === 'number' ? options.twistiePixels : 32;
            options.showTwistie = options.showTwistie === false ? false : true;
            options.indentPixels = typeof options.indentPixels === 'number' ? options.indentPixels : 12;
            options.alwaysFocused = options.alwaysFocused === true ? true : false;
            options.useShadows = options.useShadows === false ? false : true;
            options.paddingOnRow = options.paddingOnRow === false ? false : true;
            options.showLoading = options.showLoading === false ? false : true;
            this.context = new TreeContext(this, configuration, options);
            this.model = new Model.TreeModel(this.context);
            this.view = new View.TreeView(this.context, this.container);
            this.view.setModel(this.model);
            this._onDidChangeFocus.input = this.model.onDidFocus;
            this._onDidChangeSelection.input = this.model.onDidSelect;
            this._onHighlightChange.input = this.model.onDidHighlight;
            this._onDidExpandItem.input = this.model.onDidExpandItem;
            this._onDidCollapseItem.input = this.model.onDidCollapseItem;
        }
        style(styles) {
            this.view.applyStyles(styles);
        }
        get onDidFocus() {
            return this.view.onDOMFocus;
        }
        get onDidBlur() {
            return this.view.onDOMBlur;
        }
        get onDidScroll() {
            return this.view.onDidScroll;
        }
        getHTMLElement() {
            return this.view.getHTMLElement();
        }
        layout(height, width) {
            this.view.layout(height, width);
        }
        domFocus() {
            this.view.focus();
        }
        isDOMFocused() {
            return this.view.isFocused();
        }
        domBlur() {
            this.view.blur();
        }
        onVisible() {
            this.view.onVisible();
        }
        onHidden() {
            this.view.onHidden();
        }
        setInput(element) {
            return this.model.setInput(element);
        }
        getInput() {
            return this.model.getInput();
        }
        refresh(element = null, recursive = true) {
            return this.model.refresh(element, recursive);
        }
        expand(element) {
            return this.model.expand(element);
        }
        expandAll(elements) {
            return this.model.expandAll(elements);
        }
        collapse(element, recursive = false) {
            return this.model.collapse(element, recursive);
        }
        collapseAll(elements = null, recursive = false) {
            return this.model.collapseAll(elements, recursive);
        }
        toggleExpansion(element, recursive = false) {
            return this.model.toggleExpansion(element, recursive);
        }
        isExpanded(element) {
            return this.model.isExpanded(element);
        }
        reveal(element, relativeTop = null) {
            return this.model.reveal(element, relativeTop);
        }
        getHighlight() {
            return this.model.getHighlight();
        }
        clearHighlight(eventPayload) {
            this.model.setHighlight(null, eventPayload);
        }
        setSelection(elements, eventPayload) {
            this.model.setSelection(elements, eventPayload);
        }
        getSelection() {
            return this.model.getSelection();
        }
        clearSelection(eventPayload) {
            this.model.setSelection([], eventPayload);
        }
        setFocus(element, eventPayload) {
            this.model.setFocus(element, eventPayload);
        }
        getFocus() {
            return this.model.getFocus();
        }
        focusNext(count, eventPayload) {
            this.model.focusNext(count, eventPayload);
        }
        focusPrevious(count, eventPayload) {
            this.model.focusPrevious(count, eventPayload);
        }
        focusParent(eventPayload) {
            this.model.focusParent(eventPayload);
        }
        focusFirstChild(eventPayload) {
            this.model.focusFirstChild(eventPayload);
        }
        focusFirst(eventPayload, from) {
            this.model.focusFirst(eventPayload, from);
        }
        focusNth(index, eventPayload) {
            this.model.focusNth(index, eventPayload);
        }
        focusLast(eventPayload, from) {
            this.model.focusLast(eventPayload, from);
        }
        focusNextPage(eventPayload) {
            this.view.focusNextPage(eventPayload);
        }
        focusPreviousPage(eventPayload) {
            this.view.focusPreviousPage(eventPayload);
        }
        clearFocus(eventPayload) {
            this.model.setFocus(null, eventPayload);
        }
        getNavigator(fromElement, subTreeOnly) {
            return new iterator_1.MappedNavigator(this.model.getNavigator(fromElement, subTreeOnly), i => i && i.getElement());
        }
        dispose() {
            this._onDispose.fire();
            this.model.dispose();
            this.view.dispose();
            this._onDidChangeFocus.dispose();
            this._onDidChangeSelection.dispose();
            this._onHighlightChange.dispose();
            this._onDidExpandItem.dispose();
            this._onDidCollapseItem.dispose();
            this._onDispose.dispose();
        }
    }
    exports.Tree = Tree;
});
//# sourceMappingURL=treeImpl.js.map