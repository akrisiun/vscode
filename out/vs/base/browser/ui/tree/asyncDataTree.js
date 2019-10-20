/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/tree/abstractTree", "vs/base/browser/ui/tree/objectTree", "vs/base/browser/ui/tree/tree", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/async", "vs/base/common/iterator", "vs/base/browser/ui/list/listView", "vs/base/common/errors", "vs/base/browser/dom", "vs/base/common/map"], function (require, exports, abstractTree_1, objectTree_1, tree_1, lifecycle_1, event_1, async_1, iterator_1, listView_1, errors_1, dom_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createAsyncDataTreeNode(props) {
        return Object.assign(Object.assign({}, props), { children: [], refreshPromise: undefined, stale: true, slow: false, collapsedByDefault: undefined });
    }
    function isAncestor(ancestor, descendant) {
        if (!descendant.parent) {
            return false;
        }
        else if (descendant.parent === ancestor) {
            return true;
        }
        else {
            return isAncestor(ancestor, descendant.parent);
        }
    }
    function intersects(node, other) {
        return node === other || isAncestor(node, other) || isAncestor(other, node);
    }
    class AsyncDataTreeNodeWrapper {
        constructor(node) {
            this.node = node;
        }
        get element() { return this.node.element.element; }
        get children() { return this.node.children.map(node => new AsyncDataTreeNodeWrapper(node)); }
        get depth() { return this.node.depth; }
        get visibleChildrenCount() { return this.node.visibleChildrenCount; }
        get visibleChildIndex() { return this.node.visibleChildIndex; }
        get collapsible() { return this.node.collapsible; }
        get collapsed() { return this.node.collapsed; }
        get visible() { return this.node.visible; }
        get filterData() { return this.node.filterData; }
    }
    class AsyncDataTreeRenderer {
        constructor(renderer, nodeMapper, onDidChangeTwistieState) {
            this.renderer = renderer;
            this.nodeMapper = nodeMapper;
            this.onDidChangeTwistieState = onDidChangeTwistieState;
            this.renderedNodes = new Map();
            this.templateId = renderer.templateId;
        }
        renderTemplate(container) {
            const templateData = this.renderer.renderTemplate(container);
            return { templateData };
        }
        renderElement(node, index, templateData, height) {
            this.renderer.renderElement(this.nodeMapper.map(node), index, templateData.templateData, height);
        }
        renderTwistie(element, twistieElement) {
            dom_1.toggleClass(twistieElement, 'codicon-loading', element.slow);
            return false;
        }
        disposeElement(node, index, templateData, height) {
            if (this.renderer.disposeElement) {
                this.renderer.disposeElement(this.nodeMapper.map(node), index, templateData.templateData, height);
            }
        }
        disposeTemplate(templateData) {
            this.renderer.disposeTemplate(templateData.templateData);
        }
        dispose() {
            this.renderedNodes.clear();
        }
    }
    function asTreeEvent(e) {
        return {
            browserEvent: e.browserEvent,
            elements: e.elements.map(e => e.element)
        };
    }
    function asTreeMouseEvent(e) {
        return {
            browserEvent: e.browserEvent,
            element: e.element && e.element.element,
            target: e.target
        };
    }
    function asTreeContextMenuEvent(e) {
        return {
            browserEvent: e.browserEvent,
            element: e.element && e.element.element,
            anchor: e.anchor
        };
    }
    var ChildrenResolutionReason;
    (function (ChildrenResolutionReason) {
        ChildrenResolutionReason[ChildrenResolutionReason["Refresh"] = 0] = "Refresh";
        ChildrenResolutionReason[ChildrenResolutionReason["Expand"] = 1] = "Expand";
    })(ChildrenResolutionReason = exports.ChildrenResolutionReason || (exports.ChildrenResolutionReason = {}));
    function asAsyncDataTreeDragAndDropData(data) {
        if (data instanceof listView_1.ElementsDragAndDropData) {
            const nodes = data.elements;
            return new listView_1.ElementsDragAndDropData(nodes.map(node => node.element));
        }
        return data;
    }
    class AsyncDataTreeNodeListDragAndDrop {
        constructor(dnd) {
            this.dnd = dnd;
        }
        getDragURI(node) {
            return this.dnd.getDragURI(node.element);
        }
        getDragLabel(nodes) {
            if (this.dnd.getDragLabel) {
                return this.dnd.getDragLabel(nodes.map(node => node.element));
            }
            return undefined;
        }
        onDragStart(data, originalEvent) {
            if (this.dnd.onDragStart) {
                this.dnd.onDragStart(asAsyncDataTreeDragAndDropData(data), originalEvent);
            }
        }
        onDragOver(data, targetNode, targetIndex, originalEvent, raw = true) {
            return this.dnd.onDragOver(asAsyncDataTreeDragAndDropData(data), targetNode && targetNode.element, targetIndex, originalEvent);
        }
        drop(data, targetNode, targetIndex, originalEvent) {
            this.dnd.drop(asAsyncDataTreeDragAndDropData(data), targetNode && targetNode.element, targetIndex, originalEvent);
        }
    }
    function asObjectTreeOptions(options) {
        return options && Object.assign(Object.assign({}, options), { collapseByDefault: true, identityProvider: options.identityProvider && {
                getId(el) {
                    return options.identityProvider.getId(el.element);
                }
            }, dnd: options.dnd && new AsyncDataTreeNodeListDragAndDrop(options.dnd), multipleSelectionController: options.multipleSelectionController && {
                isSelectionSingleChangeEvent(e) {
                    return options.multipleSelectionController.isSelectionSingleChangeEvent(Object.assign(Object.assign({}, e), { element: e.element }));
                },
                isSelectionRangeChangeEvent(e) {
                    return options.multipleSelectionController.isSelectionRangeChangeEvent(Object.assign(Object.assign({}, e), { element: e.element }));
                }
            }, accessibilityProvider: options.accessibilityProvider && {
                getAriaLabel(e) {
                    return options.accessibilityProvider.getAriaLabel(e.element);
                }
            }, filter: options.filter && {
                filter(e, parentVisibility) {
                    return options.filter.filter(e.element, parentVisibility);
                }
            }, keyboardNavigationLabelProvider: options.keyboardNavigationLabelProvider && Object.assign(Object.assign({}, options.keyboardNavigationLabelProvider), { getKeyboardNavigationLabel(e) {
                    return options.keyboardNavigationLabelProvider.getKeyboardNavigationLabel(e.element);
                } }), sorter: undefined, expandOnlyOnTwistieClick: typeof options.expandOnlyOnTwistieClick === 'undefined' ? undefined : (typeof options.expandOnlyOnTwistieClick !== 'function' ? options.expandOnlyOnTwistieClick : (e => options.expandOnlyOnTwistieClick(e.element))), ariaProvider: undefined, additionalScrollHeight: options.additionalScrollHeight });
    }
    function dfs(node, fn) {
        fn(node);
        node.children.forEach(child => dfs(child, fn));
    }
    class AsyncDataTree {
        constructor(user, container, delegate, renderers, dataSource, options = {}) {
            this.user = user;
            this.dataSource = dataSource;
            this.nodes = new Map();
            this.subTreeRefreshPromises = new Map();
            this.refreshPromises = new Map();
            this._onDidRender = new event_1.Emitter();
            this._onDidChangeNodeSlowState = new event_1.Emitter();
            this.nodeMapper = new tree_1.WeakMapper(node => new AsyncDataTreeNodeWrapper(node));
            this.disposables = new lifecycle_1.DisposableStore();
            this.identityProvider = options.identityProvider;
            this.autoExpandSingleChildren = typeof options.autoExpandSingleChildren === 'undefined' ? false : options.autoExpandSingleChildren;
            this.sorter = options.sorter;
            this.collapseByDefault = options.collapseByDefault;
            this.tree = this.createTree(user, container, delegate, renderers, options);
            this.root = createAsyncDataTreeNode({
                element: undefined,
                parent: null,
                hasChildren: true
            });
            if (this.identityProvider) {
                this.root = Object.assign(Object.assign({}, this.root), { id: null });
            }
            this.nodes.set(null, this.root);
            this.tree.onDidChangeCollapseState(this._onDidChangeCollapseState, this, this.disposables);
        }
        get onDidScroll() { return this.tree.onDidScroll; }
        get onDidChangeFocus() { return event_1.Event.map(this.tree.onDidChangeFocus, asTreeEvent); }
        get onDidChangeSelection() { return event_1.Event.map(this.tree.onDidChangeSelection, asTreeEvent); }
        get onDidOpen() { return event_1.Event.map(this.tree.onDidOpen, asTreeEvent); }
        get onKeyDown() { return this.tree.onKeyDown; }
        get onMouseClick() { return event_1.Event.map(this.tree.onMouseClick, asTreeMouseEvent); }
        get onMouseDblClick() { return event_1.Event.map(this.tree.onMouseDblClick, asTreeMouseEvent); }
        get onContextMenu() { return event_1.Event.map(this.tree.onContextMenu, asTreeContextMenuEvent); }
        get onDidFocus() { return this.tree.onDidFocus; }
        get onDidBlur() { return this.tree.onDidBlur; }
        get onDidChangeCollapseState() { return this.tree.onDidChangeCollapseState; }
        get onDidUpdateOptions() { return this.tree.onDidUpdateOptions; }
        get filterOnType() { return this.tree.filterOnType; }
        get openOnSingleClick() { return this.tree.openOnSingleClick; }
        get expandOnlyOnTwistieClick() {
            if (typeof this.tree.expandOnlyOnTwistieClick === 'boolean') {
                return this.tree.expandOnlyOnTwistieClick;
            }
            const fn = this.tree.expandOnlyOnTwistieClick;
            return element => fn(this.nodes.get((element === this.root.element ? null : element)) || null);
        }
        get onDidDispose() { return this.tree.onDidDispose; }
        createTree(user, container, delegate, renderers, options) {
            const objectTreeDelegate = new abstractTree_1.ComposedTreeDelegate(delegate);
            const objectTreeRenderers = renderers.map(r => new AsyncDataTreeRenderer(r, this.nodeMapper, this._onDidChangeNodeSlowState.event));
            const objectTreeOptions = asObjectTreeOptions(options) || {};
            return new objectTree_1.ObjectTree(user, container, objectTreeDelegate, objectTreeRenderers, objectTreeOptions);
        }
        updateOptions(options = {}) {
            this.tree.updateOptions(options);
        }
        // Widget
        getHTMLElement() {
            return this.tree.getHTMLElement();
        }
        get contentHeight() {
            return this.tree.contentHeight;
        }
        get onDidChangeContentHeight() {
            return this.tree.onDidChangeContentHeight;
        }
        get scrollTop() {
            return this.tree.scrollTop;
        }
        set scrollTop(scrollTop) {
            this.tree.scrollTop = scrollTop;
        }
        get scrollLeft() {
            return this.tree.scrollLeft;
        }
        set scrollLeft(scrollLeft) {
            this.tree.scrollLeft = scrollLeft;
        }
        get scrollHeight() {
            return this.tree.scrollHeight;
        }
        get renderHeight() {
            return this.tree.renderHeight;
        }
        get firstVisibleElement() {
            return this.tree.firstVisibleElement.element;
        }
        get lastVisibleElement() {
            return this.tree.lastVisibleElement.element;
        }
        domFocus() {
            this.tree.domFocus();
        }
        layout(height, width) {
            this.tree.layout(height, width);
        }
        style(styles) {
            this.tree.style(styles);
        }
        // Model
        getInput() {
            return this.root.element;
        }
        async setInput(input, viewState) {
            this.refreshPromises.forEach(promise => promise.cancel());
            this.refreshPromises.clear();
            this.root.element = input;
            const viewStateContext = viewState && { viewState, focus: [], selection: [] };
            await this._updateChildren(input, true, viewStateContext);
            if (viewStateContext) {
                this.tree.setFocus(viewStateContext.focus);
                this.tree.setSelection(viewStateContext.selection);
            }
            if (viewState && typeof viewState.scrollTop === 'number') {
                this.scrollTop = viewState.scrollTop;
            }
        }
        async updateChildren(element = this.root.element, recursive = true) {
            await this._updateChildren(element, recursive);
        }
        async _updateChildren(element = this.root.element, recursive = true, viewStateContext) {
            if (typeof this.root.element === 'undefined') {
                throw new tree_1.TreeError(this.user, 'Tree input not set');
            }
            if (this.root.refreshPromise) {
                await this.root.refreshPromise;
                await event_1.Event.toPromise(this._onDidRender.event);
            }
            await this.refreshAndRenderNode(this.getDataNode(element), recursive, ChildrenResolutionReason.Refresh, viewStateContext);
        }
        resort(element = this.root.element, recursive = true) {
            this.tree.resort(this.getDataNode(element), recursive);
        }
        hasNode(element) {
            return element === this.root.element || this.nodes.has(element);
        }
        // View
        rerender(element) {
            if (element === undefined || element === this.root.element) {
                this.tree.rerender();
                return;
            }
            const node = this.getDataNode(element);
            this.tree.rerender(node);
        }
        updateWidth(element) {
            const node = this.getDataNode(element);
            this.tree.updateWidth(node);
        }
        // Tree
        getNode(element = this.root.element) {
            const dataNode = this.getDataNode(element);
            const node = this.tree.getNode(dataNode === this.root ? null : dataNode);
            return this.nodeMapper.map(node);
        }
        collapse(element, recursive = false) {
            const node = this.getDataNode(element);
            return this.tree.collapse(node === this.root ? null : node, recursive);
        }
        async expand(element, recursive = false) {
            if (typeof this.root.element === 'undefined') {
                throw new tree_1.TreeError(this.user, 'Tree input not set');
            }
            if (this.root.refreshPromise) {
                await this.root.refreshPromise;
                await event_1.Event.toPromise(this._onDidRender.event);
            }
            const node = this.getDataNode(element);
            if (node.refreshPromise) {
                await this.root.refreshPromise;
                await event_1.Event.toPromise(this._onDidRender.event);
            }
            if (node !== this.root && !node.refreshPromise && !this.tree.isCollapsed(node)) {
                return false;
            }
            const result = this.tree.expand(node === this.root ? null : node, recursive);
            if (node.refreshPromise) {
                await this.root.refreshPromise;
                await event_1.Event.toPromise(this._onDidRender.event);
            }
            return result;
        }
        toggleCollapsed(element, recursive = false) {
            return this.tree.toggleCollapsed(this.getDataNode(element), recursive);
        }
        expandAll() {
            this.tree.expandAll();
        }
        collapseAll() {
            this.tree.collapseAll();
        }
        isCollapsible(element) {
            return this.tree.isCollapsible(this.getDataNode(element));
        }
        isCollapsed(element) {
            return this.tree.isCollapsed(this.getDataNode(element));
        }
        toggleKeyboardNavigation() {
            this.tree.toggleKeyboardNavigation();
        }
        refilter() {
            this.tree.refilter();
        }
        setSelection(elements, browserEvent) {
            const nodes = elements.map(e => this.getDataNode(e));
            this.tree.setSelection(nodes, browserEvent);
        }
        getSelection() {
            const nodes = this.tree.getSelection();
            return nodes.map(n => n.element);
        }
        setFocus(elements, browserEvent) {
            const nodes = elements.map(e => this.getDataNode(e));
            this.tree.setFocus(nodes, browserEvent);
        }
        focusNext(n = 1, loop = false, browserEvent) {
            this.tree.focusNext(n, loop, browserEvent);
        }
        focusPrevious(n = 1, loop = false, browserEvent) {
            this.tree.focusPrevious(n, loop, browserEvent);
        }
        focusNextPage(browserEvent) {
            this.tree.focusNextPage(browserEvent);
        }
        focusPreviousPage(browserEvent) {
            this.tree.focusPreviousPage(browserEvent);
        }
        focusLast(browserEvent) {
            this.tree.focusLast(browserEvent);
        }
        focusFirst(browserEvent) {
            this.tree.focusFirst(browserEvent);
        }
        getFocus() {
            const nodes = this.tree.getFocus();
            return nodes.map(n => n.element);
        }
        open(elements, browserEvent) {
            const nodes = elements.map(e => this.getDataNode(e));
            this.tree.open(nodes, browserEvent);
        }
        reveal(element, relativeTop) {
            this.tree.reveal(this.getDataNode(element), relativeTop);
        }
        getRelativeTop(element) {
            return this.tree.getRelativeTop(this.getDataNode(element));
        }
        // Tree navigation
        getParentElement(element) {
            const node = this.tree.getParentElement(this.getDataNode(element));
            return (node && node.element);
        }
        getFirstElementChild(element = this.root.element) {
            const dataNode = this.getDataNode(element);
            const node = this.tree.getFirstElementChild(dataNode === this.root ? null : dataNode);
            return (node && node.element);
        }
        // Implementation
        getDataNode(element) {
            const node = this.nodes.get((element === this.root.element ? null : element));
            if (!node) {
                throw new tree_1.TreeError(this.user, `Data tree node not found: ${element}`);
            }
            return node;
        }
        async refreshAndRenderNode(node, recursive, reason, viewStateContext) {
            await this.refreshNode(node, recursive, viewStateContext);
            this.render(node, viewStateContext);
            if (node !== this.root && this.autoExpandSingleChildren && reason === ChildrenResolutionReason.Expand) {
                const treeNode = this.tree.getNode(node);
                const visibleChildren = treeNode.children.filter(node => node.visible);
                if (visibleChildren.length === 1) {
                    await this.tree.expand(visibleChildren[0].element, false);
                }
            }
        }
        async refreshNode(node, recursive, viewStateContext) {
            let result;
            this.subTreeRefreshPromises.forEach((refreshPromise, refreshNode) => {
                if (!result && intersects(refreshNode, node)) {
                    result = refreshPromise.then(() => this.refreshNode(node, recursive, viewStateContext));
                }
            });
            if (result) {
                return result;
            }
            return this.doRefreshSubTree(node, recursive, viewStateContext);
        }
        async doRefreshSubTree(node, recursive, viewStateContext) {
            let done;
            node.refreshPromise = new Promise(c => done = c);
            this.subTreeRefreshPromises.set(node, node.refreshPromise);
            node.refreshPromise.finally(() => {
                node.refreshPromise = undefined;
                this.subTreeRefreshPromises.delete(node);
            });
            try {
                const childrenToRefresh = await this.doRefreshNode(node, recursive, viewStateContext);
                node.stale = false;
                await Promise.all(childrenToRefresh.map(child => this.doRefreshSubTree(child, recursive, viewStateContext)));
            }
            finally {
                done();
            }
        }
        async doRefreshNode(node, recursive, viewStateContext) {
            node.hasChildren = !!this.dataSource.hasChildren(node.element);
            let childrenPromise;
            if (!node.hasChildren) {
                childrenPromise = Promise.resolve([]);
            }
            else {
                const slowTimeout = async_1.timeout(800);
                slowTimeout.then(() => {
                    node.slow = true;
                    this._onDidChangeNodeSlowState.fire(node);
                }, _ => null);
                childrenPromise = this.doGetChildren(node)
                    .finally(() => slowTimeout.cancel());
            }
            try {
                const children = await childrenPromise;
                return this.setChildren(node, children, recursive, viewStateContext);
            }
            catch (err) {
                if (node !== this.root) {
                    this.tree.collapse(node === this.root ? null : node);
                }
                if (errors_1.isPromiseCanceledError(err)) {
                    return [];
                }
                throw err;
            }
            finally {
                if (node.slow) {
                    node.slow = false;
                    this._onDidChangeNodeSlowState.fire(node);
                }
            }
        }
        doGetChildren(node) {
            let result = this.refreshPromises.get(node);
            if (result) {
                return result;
            }
            result = async_1.createCancelablePromise(async () => {
                const children = await this.dataSource.getChildren(node.element);
                if (this.sorter) {
                    children.sort(this.sorter.compare.bind(this.sorter));
                }
                return children;
            });
            this.refreshPromises.set(node, result);
            return result.finally(() => this.refreshPromises.delete(node));
        }
        _onDidChangeCollapseState({ node, deep }) {
            if (!node.collapsed && node.element.stale) {
                if (deep) {
                    this.collapse(node.element.element);
                }
                else {
                    this.refreshAndRenderNode(node.element, false, ChildrenResolutionReason.Expand)
                        .catch(errors_1.onUnexpectedError);
                }
            }
        }
        setChildren(node, childrenElements, recursive, viewStateContext) {
            // perf: if the node was and still is a leaf, avoid all this hassle
            if (node.children.length === 0 && childrenElements.length === 0) {
                return [];
            }
            const nodesToForget = new Map();
            const childrenTreeNodesById = new Map();
            for (const child of node.children) {
                nodesToForget.set(child.element, child);
                if (this.identityProvider) {
                    childrenTreeNodesById.set(child.id, this.tree.getNode(child));
                }
            }
            const childrenToRefresh = [];
            const children = childrenElements.map(element => {
                const hasChildren = !!this.dataSource.hasChildren(element);
                if (!this.identityProvider) {
                    const asyncDataTreeNode = createAsyncDataTreeNode({ element, parent: node, hasChildren });
                    if (hasChildren && this.collapseByDefault && !this.collapseByDefault(element)) {
                        asyncDataTreeNode.collapsedByDefault = false;
                        childrenToRefresh.push(asyncDataTreeNode);
                    }
                    return asyncDataTreeNode;
                }
                const id = this.identityProvider.getId(element).toString();
                const childNode = childrenTreeNodesById.get(id);
                if (childNode) {
                    const asyncDataTreeNode = childNode.element;
                    nodesToForget.delete(asyncDataTreeNode.element);
                    this.nodes.delete(asyncDataTreeNode.element);
                    this.nodes.set(element, asyncDataTreeNode);
                    asyncDataTreeNode.element = element;
                    asyncDataTreeNode.hasChildren = hasChildren;
                    if (recursive) {
                        if (childNode.collapsed) {
                            dfs(asyncDataTreeNode, node => node.stale = true);
                        }
                        else {
                            childrenToRefresh.push(asyncDataTreeNode);
                        }
                    }
                    else if (hasChildren && this.collapseByDefault && !this.collapseByDefault(element)) {
                        asyncDataTreeNode.collapsedByDefault = false;
                        childrenToRefresh.push(asyncDataTreeNode);
                    }
                    return asyncDataTreeNode;
                }
                const childAsyncDataTreeNode = createAsyncDataTreeNode({ element, parent: node, id, hasChildren });
                if (viewStateContext && viewStateContext.viewState.focus && viewStateContext.viewState.focus.indexOf(id) > -1) {
                    viewStateContext.focus.push(childAsyncDataTreeNode);
                }
                if (viewStateContext && viewStateContext.viewState.selection && viewStateContext.viewState.selection.indexOf(id) > -1) {
                    viewStateContext.selection.push(childAsyncDataTreeNode);
                }
                if (viewStateContext && viewStateContext.viewState.expanded && viewStateContext.viewState.expanded.indexOf(id) > -1) {
                    childrenToRefresh.push(childAsyncDataTreeNode);
                }
                else if (hasChildren && this.collapseByDefault && !this.collapseByDefault(element)) {
                    childAsyncDataTreeNode.collapsedByDefault = false;
                    childrenToRefresh.push(childAsyncDataTreeNode);
                }
                return childAsyncDataTreeNode;
            });
            for (const node of map_1.values(nodesToForget)) {
                dfs(node, node => this.nodes.delete(node.element));
            }
            for (const child of children) {
                this.nodes.set(child.element, child);
            }
            node.children.splice(0, node.children.length, ...children);
            return childrenToRefresh;
        }
        render(node, viewStateContext) {
            const children = node.children.map(node => this.asTreeElement(node, viewStateContext));
            this.tree.setChildren(node === this.root ? null : node, children);
            if (node !== this.root) {
                this.tree.setCollapsible(node, node.hasChildren);
            }
            this._onDidRender.fire();
        }
        asTreeElement(node, viewStateContext) {
            let collapsed;
            if (viewStateContext && viewStateContext.viewState.expanded && node.id && viewStateContext.viewState.expanded.indexOf(node.id) > -1) {
                collapsed = false;
            }
            else {
                collapsed = node.collapsedByDefault;
            }
            node.collapsedByDefault = undefined;
            return {
                element: node,
                children: node.hasChildren ? iterator_1.Iterator.map(iterator_1.Iterator.fromArray(node.children), child => this.asTreeElement(child, viewStateContext)) : [],
                collapsible: node.hasChildren,
                collapsed
            };
        }
        // view state
        getViewState() {
            if (!this.identityProvider) {
                throw new tree_1.TreeError(this.user, 'Can\'t get tree view state without an identity provider');
            }
            const getId = (element) => this.identityProvider.getId(element).toString();
            const focus = this.getFocus().map(getId);
            const selection = this.getSelection().map(getId);
            const expanded = [];
            const root = this.tree.getNode();
            const queue = [root];
            while (queue.length > 0) {
                const node = queue.shift();
                if (node !== root && node.collapsible && !node.collapsed) {
                    expanded.push(getId(node.element.element));
                }
                queue.push(...node.children);
            }
            return { focus, selection, expanded, scrollTop: this.scrollTop };
        }
        dispose() {
            this.disposables.dispose();
        }
    }
    exports.AsyncDataTree = AsyncDataTree;
    class CompressibleAsyncDataTreeNodeWrapper {
        constructor(node) {
            this.node = node;
        }
        get element() {
            return {
                elements: this.node.element.elements.map(e => e.element),
                incompressible: this.node.element.incompressible
            };
        }
        get children() { return this.node.children.map(node => new CompressibleAsyncDataTreeNodeWrapper(node)); }
        get depth() { return this.node.depth; }
        get visibleChildrenCount() { return this.node.visibleChildrenCount; }
        get visibleChildIndex() { return this.node.visibleChildIndex; }
        get collapsible() { return this.node.collapsible; }
        get collapsed() { return this.node.collapsed; }
        get visible() { return this.node.visible; }
        get filterData() { return this.node.filterData; }
    }
    class CompressibleAsyncDataTreeRenderer {
        constructor(renderer, nodeMapper, compressibleNodeMapperProvider, onDidChangeTwistieState) {
            this.renderer = renderer;
            this.nodeMapper = nodeMapper;
            this.compressibleNodeMapperProvider = compressibleNodeMapperProvider;
            this.onDidChangeTwistieState = onDidChangeTwistieState;
            this.renderedNodes = new Map();
            this.disposables = [];
            this.templateId = renderer.templateId;
        }
        renderTemplate(container) {
            const templateData = this.renderer.renderTemplate(container);
            return { templateData };
        }
        renderElement(node, index, templateData, height) {
            this.renderer.renderElement(this.nodeMapper.map(node), index, templateData.templateData, height);
        }
        renderCompressedElements(node, index, templateData, height) {
            this.renderer.renderCompressedElements(this.compressibleNodeMapperProvider().map(node), index, templateData.templateData, height);
        }
        renderTwistie(element, twistieElement) {
            dom_1.toggleClass(twistieElement, 'codicon-loading', element.slow);
            return false;
        }
        disposeElement(node, index, templateData, height) {
            if (this.renderer.disposeElement) {
                this.renderer.disposeElement(this.nodeMapper.map(node), index, templateData.templateData, height);
            }
        }
        disposeTemplate(templateData) {
            this.renderer.disposeTemplate(templateData.templateData);
        }
        dispose() {
            this.renderedNodes.clear();
            this.disposables = lifecycle_1.dispose(this.disposables);
        }
    }
    function asCompressibleObjectTreeOptions(options) {
        const objectTreeOptions = options && asObjectTreeOptions(options);
        return objectTreeOptions && Object.assign(Object.assign({}, objectTreeOptions), { keyboardNavigationLabelProvider: objectTreeOptions.keyboardNavigationLabelProvider && Object.assign(Object.assign({}, objectTreeOptions.keyboardNavigationLabelProvider), { getCompressedNodeKeyboardNavigationLabel(els) {
                    return options.keyboardNavigationLabelProvider.getCompressedNodeKeyboardNavigationLabel(els.map(e => e.element));
                } }) });
    }
    class CompressibleAsyncDataTree extends AsyncDataTree {
        constructor(user, container, virtualDelegate, compressionDelegate, renderers, dataSource, options = {}) {
            super(user, container, virtualDelegate, renderers, dataSource, options);
            this.compressionDelegate = compressionDelegate;
            this.compressibleNodeMapper = new tree_1.WeakMapper(node => new CompressibleAsyncDataTreeNodeWrapper(node));
        }
        createTree(user, container, delegate, renderers, options) {
            const objectTreeDelegate = new abstractTree_1.ComposedTreeDelegate(delegate);
            const objectTreeRenderers = renderers.map(r => new CompressibleAsyncDataTreeRenderer(r, this.nodeMapper, () => this.compressibleNodeMapper, this._onDidChangeNodeSlowState.event));
            const objectTreeOptions = asCompressibleObjectTreeOptions(options) || {};
            return new objectTree_1.CompressibleObjectTree(user, container, objectTreeDelegate, objectTreeRenderers, objectTreeOptions);
        }
        asTreeElement(node, viewStateContext) {
            return Object.assign({ incompressible: this.compressionDelegate.isIncompressible(node.element) }, super.asTreeElement(node, viewStateContext));
        }
    }
    exports.CompressibleAsyncDataTree = CompressibleAsyncDataTree;
});
//# sourceMappingURL=asyncDataTree.js.map