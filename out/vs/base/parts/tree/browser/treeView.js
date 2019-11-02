/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/browser/browser", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/base/common/diff/diff", "vs/base/browser/touch", "vs/base/common/strings", "vs/base/browser/mouseEvent", "vs/base/browser/keyboardEvent", "./treeDnd", "vs/base/common/iterator", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/parts/tree/browser/treeViewModel", "vs/base/parts/tree/browser/tree", "vs/base/common/event", "vs/base/browser/dnd", "./treeDefaults", "vs/base/common/async"], function (require, exports, Platform, Browser, Lifecycle, DOM, Diff, Touch, strings, Mouse, Keyboard, dnd, iterator_1, scrollableElement_1, treeViewModel_1, _, event_1, dnd_1, treeDefaults_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function removeFromParent(element) {
        try {
            element.parentElement.removeChild(element);
        }
        catch (e) {
            // this will throw if this happens due to a blur event, nasty business
        }
    }
    class RowCache {
        constructor(context) {
            this.context = context;
            this._cache = { '': [] };
        }
        alloc(templateId) {
            let result = this.cache(templateId).pop();
            if (!result) {
                let content = document.createElement('div');
                content.className = 'content';
                let row = document.createElement('div');
                row.appendChild(content);
                let templateData = null;
                try {
                    templateData = this.context.renderer.renderTemplate(this.context.tree, templateId, content);
                }
                catch (err) {
                    console.error('Tree usage error: exception while rendering template');
                    console.error(err);
                }
                result = {
                    element: row,
                    templateId: templateId,
                    templateData
                };
            }
            return result;
        }
        release(templateId, row) {
            removeFromParent(row.element);
            this.cache(templateId).push(row);
        }
        cache(templateId) {
            return this._cache[templateId] || (this._cache[templateId] = []);
        }
        garbageCollect() {
            if (this._cache) {
                Object.keys(this._cache).forEach(templateId => {
                    this._cache[templateId].forEach(cachedRow => {
                        this.context.renderer.disposeTemplate(this.context.tree, templateId, cachedRow.templateData);
                        cachedRow.element = null;
                        cachedRow.templateData = null;
                    });
                    delete this._cache[templateId];
                });
            }
        }
        dispose() {
            this.garbageCollect();
            this._cache = null;
        }
    }
    exports.RowCache = RowCache;
    class ViewItem {
        constructor(context, model) {
            this.width = 0;
            this.needsRender = false;
            this.uri = null;
            this.unbindDragStart = Lifecycle.Disposable.None;
            this._draggable = false;
            this.context = context;
            this.model = model;
            this.id = this.model.id;
            this.row = null;
            this.top = 0;
            this.height = model.getHeight();
            this._styles = {};
            model.getAllTraits().forEach(t => this._styles[t] = true);
            if (model.isExpanded()) {
                this.addClass('expanded');
            }
        }
        set expanded(value) {
            value ? this.addClass('expanded') : this.removeClass('expanded');
        }
        set loading(value) {
            value ? this.addClass('codicon-loading') : this.removeClass('codicon-loading');
        }
        set draggable(value) {
            this._draggable = value;
            this.render(true);
        }
        get draggable() {
            return this._draggable;
        }
        set dropTarget(value) {
            value ? this.addClass('drop-target') : this.removeClass('drop-target');
        }
        get element() {
            return (this.row && this.row.element);
        }
        get templateId() {
            return this._templateId || (this._templateId = (this.context.renderer.getTemplateId && this.context.renderer.getTemplateId(this.context.tree, this.model.getElement())));
        }
        addClass(name) {
            this._styles[name] = true;
            this.render(true);
        }
        removeClass(name) {
            delete this._styles[name]; // is this slow?
            this.render(true);
        }
        render(skipUserRender = false) {
            if (!this.model || !this.element) {
                return;
            }
            let classes = ['monaco-tree-row'];
            classes.push.apply(classes, Object.keys(this._styles));
            if (this.model.hasChildren()) {
                classes.push('has-children');
            }
            this.element.className = classes.join(' ');
            this.element.draggable = this.draggable;
            this.element.style.height = this.height + 'px';
            // ARIA
            this.element.setAttribute('role', 'treeitem');
            const accessibility = this.context.accessibilityProvider;
            const ariaLabel = accessibility.getAriaLabel(this.context.tree, this.model.getElement());
            if (ariaLabel) {
                this.element.setAttribute('aria-label', ariaLabel);
            }
            if (accessibility.getPosInSet && accessibility.getSetSize) {
                this.element.setAttribute('aria-setsize', accessibility.getSetSize());
                this.element.setAttribute('aria-posinset', accessibility.getPosInSet(this.context.tree, this.model.getElement()));
            }
            if (this.model.hasTrait('focused')) {
                const base64Id = strings.safeBtoa(this.model.id);
                this.element.setAttribute('aria-selected', 'true');
                this.element.setAttribute('id', base64Id);
            }
            else {
                this.element.setAttribute('aria-selected', 'false');
                this.element.removeAttribute('id');
            }
            if (this.model.hasChildren()) {
                this.element.setAttribute('aria-expanded', String(!!this._styles['expanded']));
            }
            else {
                this.element.removeAttribute('aria-expanded');
            }
            this.element.setAttribute('aria-level', String(this.model.getDepth()));
            if (this.context.options.paddingOnRow) {
                this.element.style.paddingLeft = this.context.options.twistiePixels + ((this.model.getDepth() - 1) * this.context.options.indentPixels) + 'px';
            }
            else {
                this.element.style.paddingLeft = ((this.model.getDepth() - 1) * this.context.options.indentPixels) + 'px';
                this.row.element.firstElementChild.style.paddingLeft = this.context.options.twistiePixels + 'px';
            }
            let uri = this.context.dnd.getDragURI(this.context.tree, this.model.getElement());
            if (uri !== this.uri) {
                if (this.unbindDragStart) {
                    this.unbindDragStart.dispose();
                }
                if (uri) {
                    this.uri = uri;
                    this.draggable = true;
                    this.unbindDragStart = DOM.addDisposableListener(this.element, 'dragstart', (e) => {
                        this.onDragStart(e);
                    });
                }
                else {
                    this.uri = null;
                }
            }
            if (!skipUserRender && this.element) {
                let paddingLeft = 0;
                if (this.context.horizontalScrolling) {
                    const style = window.getComputedStyle(this.element);
                    paddingLeft = parseFloat(style.paddingLeft);
                }
                if (this.context.horizontalScrolling) {
                    this.element.style.width = Browser.isFirefox ? '-moz-fit-content' : 'fit-content';
                }
                try {
                    this.context.renderer.renderElement(this.context.tree, this.model.getElement(), this.templateId, this.row.templateData);
                }
                catch (err) {
                    console.error('Tree usage error: exception while rendering element');
                    console.error(err);
                }
                if (this.context.horizontalScrolling) {
                    this.width = DOM.getContentWidth(this.element) + paddingLeft;
                    this.element.style.width = '';
                }
            }
        }
        updateWidth() {
            if (!this.context.horizontalScrolling || !this.element) {
                return;
            }
            const style = window.getComputedStyle(this.element);
            const paddingLeft = parseFloat(style.paddingLeft);
            this.element.style.width = Browser.isFirefox ? '-moz-fit-content' : 'fit-content';
            this.width = DOM.getContentWidth(this.element) + paddingLeft;
            this.element.style.width = '';
        }
        insertInDOM(container, afterElement) {
            if (!this.row) {
                this.row = this.context.cache.alloc(this.templateId);
                // used in reverse lookup from HTMLElement to Item
                this.element[TreeView.BINDING] = this;
            }
            if (this.element.parentElement) {
                return;
            }
            if (afterElement === null) {
                container.appendChild(this.element);
            }
            else {
                try {
                    container.insertBefore(this.element, afterElement);
                }
                catch (e) {
                    console.warn('Failed to locate previous tree element');
                    container.appendChild(this.element);
                }
            }
            this.render();
        }
        removeFromDOM() {
            if (!this.row) {
                return;
            }
            this.unbindDragStart.dispose();
            this.uri = null;
            this.element[TreeView.BINDING] = null;
            this.context.cache.release(this.templateId, this.row);
            this.row = null;
        }
        dispose() {
            this.row = null;
        }
    }
    exports.ViewItem = ViewItem;
    class RootViewItem extends ViewItem {
        constructor(context, model, wrapper) {
            super(context, model);
            this.row = {
                element: wrapper,
                templateData: null,
                templateId: null
            };
        }
        render() {
            if (!this.model || !this.element) {
                return;
            }
            let classes = ['monaco-tree-wrapper'];
            classes.push.apply(classes, Object.keys(this._styles));
            if (this.model.hasChildren()) {
                classes.push('has-children');
            }
            this.element.className = classes.join(' ');
        }
        insertInDOM(container, afterElement) {
            // noop
        }
        removeFromDOM() {
            // noop
        }
    }
    function reactionEquals(one, other) {
        if (!one && !other) {
            return true;
        }
        else if (!one || !other) {
            return false;
        }
        else if (one.accept !== other.accept) {
            return false;
        }
        else if (one.bubble !== other.bubble) {
            return false;
        }
        else if (one.effect !== other.effect) {
            return false;
        }
        else {
            return true;
        }
    }
    class TreeView extends treeViewModel_1.HeightMap {
        constructor(context, container) {
            super();
            this.model = null;
            this.lastPointerType = '';
            this.lastClickTimeStamp = 0;
            this.contentWidthUpdateDelayer = new async_1.Delayer(50);
            this.isRefreshing = false;
            this.refreshingPreviousChildrenIds = {};
            this.currentDragAndDropData = null;
            this.currentDropTarget = null;
            this.currentDropTargets = null;
            this.currentDropDisposable = Lifecycle.Disposable.None;
            this.gestureDisposable = Lifecycle.Disposable.None;
            this.dragAndDropScrollInterval = null;
            this.dragAndDropScrollTimeout = null;
            this.dragAndDropMouseY = null;
            this.highlightedItemWasDraggable = false;
            this.onHiddenScrollTop = null;
            this._onDOMFocus = new event_1.Emitter();
            this.onDOMFocus = this._onDOMFocus.event;
            this._onDOMBlur = new event_1.Emitter();
            this.onDOMBlur = this._onDOMBlur.event;
            this._onDidScroll = new event_1.Emitter();
            this.onDidScroll = this._onDidScroll.event;
            TreeView.counter++;
            this.instance = TreeView.counter;
            const horizontalScrollMode = typeof context.options.horizontalScrollMode === 'undefined' ? 2 /* Hidden */ : context.options.horizontalScrollMode;
            this.horizontalScrolling = horizontalScrollMode !== 2 /* Hidden */;
            this.context = {
                dataSource: context.dataSource,
                renderer: context.renderer,
                controller: context.controller,
                dnd: context.dnd,
                filter: context.filter,
                sorter: context.sorter,
                tree: context.tree,
                accessibilityProvider: context.accessibilityProvider,
                options: context.options,
                cache: new RowCache(context),
                horizontalScrolling: this.horizontalScrolling
            };
            this.modelListeners = [];
            this.viewListeners = [];
            this.items = {};
            this.domNode = document.createElement('div');
            this.domNode.className = `monaco-tree no-focused-item monaco-tree-instance-${this.instance}`;
            // to allow direct tabbing into the tree instead of first focusing the tree
            this.domNode.tabIndex = context.options.preventRootFocus ? -1 : 0;
            this.styleElement = DOM.createStyleSheet(this.domNode);
            this.treeStyler = context.styler || new treeDefaults_1.DefaultTreestyler(this.styleElement, `monaco-tree-instance-${this.instance}`);
            // ARIA
            this.domNode.setAttribute('role', 'tree');
            if (this.context.options.ariaLabel) {
                this.domNode.setAttribute('aria-label', this.context.options.ariaLabel);
            }
            if (this.context.options.alwaysFocused) {
                DOM.addClass(this.domNode, 'focused');
            }
            if (!this.context.options.paddingOnRow) {
                DOM.addClass(this.domNode, 'no-row-padding');
            }
            this.wrapper = document.createElement('div');
            this.wrapper.className = 'monaco-tree-wrapper';
            this.scrollableElement = new scrollableElement_1.ScrollableElement(this.wrapper, {
                alwaysConsumeMouseWheel: true,
                horizontal: horizontalScrollMode,
                vertical: (typeof context.options.verticalScrollMode !== 'undefined' ? context.options.verticalScrollMode : 1 /* Auto */),
                useShadows: context.options.useShadows
            });
            this.scrollableElement.onScroll((e) => {
                this.render(e.scrollTop, e.height, e.scrollLeft, e.width, e.scrollWidth);
                this._onDidScroll.fire();
            });
            if (Browser.isIE) {
                this.wrapper.style.msTouchAction = 'none';
                this.wrapper.style.msContentZooming = 'none';
            }
            else {
                this.gestureDisposable = Touch.Gesture.addTarget(this.wrapper);
            }
            this.rowsContainer = document.createElement('div');
            this.rowsContainer.className = 'monaco-tree-rows';
            if (context.options.showTwistie) {
                this.rowsContainer.className += ' show-twisties';
            }
            let focusTracker = DOM.trackFocus(this.domNode);
            this.viewListeners.push(focusTracker.onDidFocus(() => this.onFocus()));
            this.viewListeners.push(focusTracker.onDidBlur(() => this.onBlur()));
            this.viewListeners.push(focusTracker);
            this.viewListeners.push(DOM.addDisposableListener(this.domNode, 'keydown', (e) => this.onKeyDown(e)));
            this.viewListeners.push(DOM.addDisposableListener(this.domNode, 'keyup', (e) => this.onKeyUp(e)));
            this.viewListeners.push(DOM.addDisposableListener(this.domNode, 'mousedown', (e) => this.onMouseDown(e)));
            this.viewListeners.push(DOM.addDisposableListener(this.domNode, 'mouseup', (e) => this.onMouseUp(e)));
            this.viewListeners.push(DOM.addDisposableListener(this.wrapper, 'auxclick', (e) => {
                if (e && e.button === 1) {
                    this.onMouseMiddleClick(e);
                }
            }));
            this.viewListeners.push(DOM.addDisposableListener(this.wrapper, 'click', (e) => this.onClick(e)));
            this.viewListeners.push(DOM.addDisposableListener(this.domNode, 'contextmenu', (e) => this.onContextMenu(e)));
            this.viewListeners.push(DOM.addDisposableListener(this.wrapper, Touch.EventType.Tap, (e) => this.onTap(e)));
            this.viewListeners.push(DOM.addDisposableListener(this.wrapper, Touch.EventType.Change, (e) => this.onTouchChange(e)));
            if (Browser.isIE) {
                this.viewListeners.push(DOM.addDisposableListener(this.wrapper, 'MSPointerDown', (e) => this.onMsPointerDown(e)));
                this.viewListeners.push(DOM.addDisposableListener(this.wrapper, 'MSGestureTap', (e) => this.onMsGestureTap(e)));
                // these events come too fast, we throttle them
                this.viewListeners.push(DOM.addDisposableThrottledListener(this.wrapper, 'MSGestureChange', (e) => this.onThrottledMsGestureChange(e), (lastEvent, event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    let result = { translationY: event.translationY, translationX: event.translationX };
                    if (lastEvent) {
                        result.translationY += lastEvent.translationY;
                        result.translationX += lastEvent.translationX;
                    }
                    return result;
                }));
            }
            this.viewListeners.push(DOM.addDisposableListener(window, 'dragover', (e) => this.onDragOver(e)));
            this.viewListeners.push(DOM.addDisposableListener(this.wrapper, 'drop', (e) => this.onDrop(e)));
            this.viewListeners.push(DOM.addDisposableListener(window, 'dragend', (e) => this.onDragEnd(e)));
            this.viewListeners.push(DOM.addDisposableListener(window, 'dragleave', (e) => this.onDragOver(e)));
            this.wrapper.appendChild(this.rowsContainer);
            this.domNode.appendChild(this.scrollableElement.getDomNode());
            container.appendChild(this.domNode);
            this.lastRenderTop = 0;
            this.lastRenderHeight = 0;
            this.didJustPressContextMenuKey = false;
            this.currentDropTarget = null;
            this.currentDropTargets = [];
            this.shouldInvalidateDropReaction = false;
            this.dragAndDropScrollInterval = null;
            this.dragAndDropScrollTimeout = null;
            this.onRowsChanged();
            this.layout();
            this.setupMSGesture();
            this.applyStyles(context.options);
        }
        applyStyles(styles) {
            this.treeStyler.style(styles);
        }
        createViewItem(item) {
            return new ViewItem(this.context, item);
        }
        getHTMLElement() {
            return this.domNode;
        }
        focus() {
            this.domNode.focus();
        }
        isFocused() {
            return document.activeElement === this.domNode;
        }
        blur() {
            this.domNode.blur();
        }
        onVisible() {
            this.scrollTop = this.onHiddenScrollTop;
            this.onHiddenScrollTop = null;
            this.setupMSGesture();
        }
        setupMSGesture() {
            if (window.MSGesture) {
                this.msGesture = new MSGesture();
                setTimeout(() => this.msGesture.target = this.wrapper, 100); // TODO@joh, TODO@IETeam
            }
        }
        onHidden() {
            this.onHiddenScrollTop = this.scrollTop;
        }
        isTreeVisible() {
            return this.onHiddenScrollTop === null;
        }
        layout(height, width) {
            if (!this.isTreeVisible()) {
                return;
            }
            this.viewHeight = height || DOM.getContentHeight(this.wrapper); // render
            this.scrollHeight = this.getContentHeight();
            if (this.horizontalScrolling) {
                this.viewWidth = width || DOM.getContentWidth(this.wrapper);
            }
        }
        render(scrollTop, viewHeight, scrollLeft, viewWidth, scrollWidth) {
            let i;
            let stop;
            let renderTop = scrollTop;
            let renderBottom = scrollTop + viewHeight;
            let thisRenderBottom = this.lastRenderTop + this.lastRenderHeight;
            // when view scrolls down, start rendering from the renderBottom
            for (i = this.indexAfter(renderBottom) - 1, stop = this.indexAt(Math.max(thisRenderBottom, renderTop)); i >= stop; i--) {
                this.insertItemInDOM(this.itemAtIndex(i));
            }
            // when view scrolls up, start rendering from either this.renderTop or renderBottom
            for (i = Math.min(this.indexAt(this.lastRenderTop), this.indexAfter(renderBottom)) - 1, stop = this.indexAt(renderTop); i >= stop; i--) {
                this.insertItemInDOM(this.itemAtIndex(i));
            }
            // when view scrolls down, start unrendering from renderTop
            for (i = this.indexAt(this.lastRenderTop), stop = Math.min(this.indexAt(renderTop), this.indexAfter(thisRenderBottom)); i < stop; i++) {
                this.removeItemFromDOM(this.itemAtIndex(i));
            }
            // when view scrolls up, start unrendering from either renderBottom this.renderTop
            for (i = Math.max(this.indexAfter(renderBottom), this.indexAt(this.lastRenderTop)), stop = this.indexAfter(thisRenderBottom); i < stop; i++) {
                this.removeItemFromDOM(this.itemAtIndex(i));
            }
            let topItem = this.itemAtIndex(this.indexAt(renderTop));
            if (topItem) {
                this.rowsContainer.style.top = (topItem.top - renderTop) + 'px';
            }
            if (this.horizontalScrolling) {
                this.rowsContainer.style.left = -scrollLeft + 'px';
                this.rowsContainer.style.width = `${Math.max(scrollWidth, viewWidth)}px`;
            }
            this.lastRenderTop = renderTop;
            this.lastRenderHeight = renderBottom - renderTop;
        }
        setModel(newModel) {
            this.releaseModel();
            this.model = newModel;
            this.model.onRefresh(this.onRefreshing, this, this.modelListeners);
            this.model.onDidRefresh(this.onRefreshed, this, this.modelListeners);
            this.model.onSetInput(this.onClearingInput, this, this.modelListeners);
            this.model.onDidSetInput(this.onSetInput, this, this.modelListeners);
            this.model.onDidFocus(this.onModelFocusChange, this, this.modelListeners);
            this.model.onRefreshItemChildren(this.onItemChildrenRefreshing, this, this.modelListeners);
            this.model.onDidRefreshItemChildren(this.onItemChildrenRefreshed, this, this.modelListeners);
            this.model.onDidRefreshItem(this.onItemRefresh, this, this.modelListeners);
            this.model.onExpandItem(this.onItemExpanding, this, this.modelListeners);
            this.model.onDidExpandItem(this.onItemExpanded, this, this.modelListeners);
            this.model.onCollapseItem(this.onItemCollapsing, this, this.modelListeners);
            this.model.onDidRevealItem(this.onItemReveal, this, this.modelListeners);
            this.model.onDidAddTraitItem(this.onItemAddTrait, this, this.modelListeners);
            this.model.onDidRemoveTraitItem(this.onItemRemoveTrait, this, this.modelListeners);
        }
        onRefreshing() {
            this.isRefreshing = true;
        }
        onRefreshed() {
            this.isRefreshing = false;
            this.onRowsChanged();
        }
        onRowsChanged(scrollTop = this.scrollTop) {
            if (this.isRefreshing) {
                return;
            }
            this.scrollTop = scrollTop;
            this.updateScrollWidth();
        }
        updateScrollWidth() {
            if (!this.horizontalScrolling) {
                return;
            }
            this.contentWidthUpdateDelayer.trigger(() => {
                const keys = Object.keys(this.items);
                let scrollWidth = 0;
                for (const key of keys) {
                    scrollWidth = Math.max(scrollWidth, this.items[key].width);
                }
                this.scrollWidth = scrollWidth + 10 /* scrollbar */;
            });
        }
        focusNextPage(eventPayload) {
            let lastPageIndex = this.indexAt(this.scrollTop + this.viewHeight);
            lastPageIndex = lastPageIndex === 0 ? 0 : lastPageIndex - 1;
            let lastPageElement = this.itemAtIndex(lastPageIndex).model.getElement();
            let currentlyFocusedElement = this.model.getFocus();
            if (currentlyFocusedElement !== lastPageElement) {
                this.model.setFocus(lastPageElement, eventPayload);
            }
            else {
                let previousScrollTop = this.scrollTop;
                this.scrollTop += this.viewHeight;
                if (this.scrollTop !== previousScrollTop) {
                    // Let the scroll event listener run
                    setTimeout(() => {
                        this.focusNextPage(eventPayload);
                    }, 0);
                }
            }
        }
        focusPreviousPage(eventPayload) {
            let firstPageIndex;
            if (this.scrollTop === 0) {
                firstPageIndex = this.indexAt(this.scrollTop);
            }
            else {
                firstPageIndex = this.indexAfter(this.scrollTop - 1);
            }
            let firstPageElement = this.itemAtIndex(firstPageIndex).model.getElement();
            let currentlyFocusedElement = this.model.getFocus();
            if (currentlyFocusedElement !== firstPageElement) {
                this.model.setFocus(firstPageElement, eventPayload);
            }
            else {
                let previousScrollTop = this.scrollTop;
                this.scrollTop -= this.viewHeight;
                if (this.scrollTop !== previousScrollTop) {
                    // Let the scroll event listener run
                    setTimeout(() => {
                        this.focusPreviousPage(eventPayload);
                    }, 0);
                }
            }
        }
        get viewHeight() {
            const scrollDimensions = this.scrollableElement.getScrollDimensions();
            return scrollDimensions.height;
        }
        set viewHeight(height) {
            this.scrollableElement.setScrollDimensions({ height });
        }
        set scrollHeight(scrollHeight) {
            scrollHeight = scrollHeight + (this.horizontalScrolling ? 10 : 0);
            this.scrollableElement.setScrollDimensions({ scrollHeight });
        }
        get viewWidth() {
            const scrollDimensions = this.scrollableElement.getScrollDimensions();
            return scrollDimensions.width;
        }
        set viewWidth(viewWidth) {
            this.scrollableElement.setScrollDimensions({ width: viewWidth });
        }
        set scrollWidth(scrollWidth) {
            this.scrollableElement.setScrollDimensions({ scrollWidth });
        }
        get scrollTop() {
            const scrollPosition = this.scrollableElement.getScrollPosition();
            return scrollPosition.scrollTop;
        }
        set scrollTop(scrollTop) {
            const scrollHeight = this.getContentHeight() + (this.horizontalScrolling ? 10 : 0);
            this.scrollableElement.setScrollDimensions({ scrollHeight });
            this.scrollableElement.setScrollPosition({ scrollTop });
        }
        getScrollPosition() {
            const height = this.getContentHeight() - this.viewHeight;
            return height <= 0 ? 1 : this.scrollTop / height;
        }
        setScrollPosition(pos) {
            const height = this.getContentHeight() - this.viewHeight;
            this.scrollTop = height * pos;
        }
        // Events
        onClearingInput(e) {
            let item = e.item;
            if (item) {
                this.onRemoveItems(new iterator_1.MappedIterator(item.getNavigator(), item => item && item.id));
                this.onRowsChanged();
            }
        }
        onSetInput(e) {
            this.context.cache.garbageCollect();
            this.inputItem = new RootViewItem(this.context, e.item, this.wrapper);
        }
        onItemChildrenRefreshing(e) {
            let item = e.item;
            let viewItem = this.items[item.id];
            if (viewItem && this.context.options.showLoading) {
                viewItem.loadingTimer = setTimeout(() => {
                    viewItem.loadingTimer = 0;
                    viewItem.loading = true;
                }, TreeView.LOADING_DECORATION_DELAY);
            }
            if (!e.isNested) {
                let childrenIds = [];
                let navigator = item.getNavigator();
                let childItem;
                while (childItem = navigator.next()) {
                    childrenIds.push(childItem.id);
                }
                this.refreshingPreviousChildrenIds[item.id] = childrenIds;
            }
        }
        onItemChildrenRefreshed(e) {
            let item = e.item;
            let viewItem = this.items[item.id];
            if (viewItem) {
                if (viewItem.loadingTimer) {
                    clearTimeout(viewItem.loadingTimer);
                    viewItem.loadingTimer = 0;
                }
                viewItem.loading = false;
            }
            if (!e.isNested) {
                let previousChildrenIds = this.refreshingPreviousChildrenIds[item.id];
                let afterModelItems = [];
                let navigator = item.getNavigator();
                let childItem;
                while (childItem = navigator.next()) {
                    afterModelItems.push(childItem);
                }
                let skipDiff = Math.abs(previousChildrenIds.length - afterModelItems.length) > 1000;
                let diff = [];
                let doToInsertItemsAlreadyExist = false;
                if (!skipDiff) {
                    const lcs = new Diff.LcsDiff({
                        getElements: () => previousChildrenIds
                    }, {
                        getElements: () => afterModelItems.map(item => item.id)
                    }, null);
                    diff = lcs.ComputeDiff(false).changes;
                    // this means that the result of the diff algorithm would result
                    // in inserting items that were already registered. this can only
                    // happen if the data provider returns bad ids OR if the sorting
                    // of the elements has changed
                    doToInsertItemsAlreadyExist = diff.some(d => {
                        if (d.modifiedLength > 0) {
                            for (let i = d.modifiedStart, len = d.modifiedStart + d.modifiedLength; i < len; i++) {
                                if (this.items.hasOwnProperty(afterModelItems[i].id)) {
                                    return true;
                                }
                            }
                        }
                        return false;
                    });
                }
                // 50 is an optimization number, at some point we're better off
                // just replacing everything
                if (!skipDiff && !doToInsertItemsAlreadyExist && diff.length < 50) {
                    for (const diffChange of diff) {
                        if (diffChange.originalLength > 0) {
                            this.onRemoveItems(new iterator_1.ArrayIterator(previousChildrenIds, diffChange.originalStart, diffChange.originalStart + diffChange.originalLength));
                        }
                        if (diffChange.modifiedLength > 0) {
                            let beforeItem = afterModelItems[diffChange.modifiedStart - 1] || item;
                            beforeItem = beforeItem.getDepth() > 0 ? beforeItem : null;
                            this.onInsertItems(new iterator_1.ArrayIterator(afterModelItems, diffChange.modifiedStart, diffChange.modifiedStart + diffChange.modifiedLength), beforeItem ? beforeItem.id : null);
                        }
                    }
                }
                else if (skipDiff || diff.length) {
                    this.onRemoveItems(new iterator_1.ArrayIterator(previousChildrenIds));
                    this.onInsertItems(new iterator_1.ArrayIterator(afterModelItems), item.getDepth() > 0 ? item.id : null);
                }
                if (skipDiff || diff.length) {
                    this.onRowsChanged();
                }
            }
        }
        onItemRefresh(item) {
            this.onItemsRefresh([item]);
        }
        onItemsRefresh(items) {
            this.onRefreshItemSet(items.filter(item => this.items.hasOwnProperty(item.id)));
            this.onRowsChanged();
        }
        onItemExpanding(e) {
            let viewItem = this.items[e.item.id];
            if (viewItem) {
                viewItem.expanded = true;
            }
        }
        onItemExpanded(e) {
            let item = e.item;
            let viewItem = this.items[item.id];
            if (viewItem) {
                viewItem.expanded = true;
                let height = this.onInsertItems(item.getNavigator(), item.id) || 0;
                let scrollTop = this.scrollTop;
                if (viewItem.top + viewItem.height <= this.scrollTop) {
                    scrollTop += height;
                }
                this.onRowsChanged(scrollTop);
            }
        }
        onItemCollapsing(e) {
            let item = e.item;
            let viewItem = this.items[item.id];
            if (viewItem) {
                viewItem.expanded = false;
                this.onRemoveItems(new iterator_1.MappedIterator(item.getNavigator(), item => item && item.id));
                this.onRowsChanged();
            }
        }
        onItemReveal(e) {
            let item = e.item;
            let relativeTop = e.relativeTop;
            let viewItem = this.items[item.id];
            if (viewItem) {
                if (relativeTop !== null) {
                    relativeTop = relativeTop < 0 ? 0 : relativeTop;
                    relativeTop = relativeTop > 1 ? 1 : relativeTop;
                    // y = mx + b
                    let m = viewItem.height - this.viewHeight;
                    this.scrollTop = m * relativeTop + viewItem.top;
                }
                else {
                    let viewItemBottom = viewItem.top + viewItem.height;
                    let wrapperBottom = this.scrollTop + this.viewHeight;
                    if (viewItem.top < this.scrollTop) {
                        this.scrollTop = viewItem.top;
                    }
                    else if (viewItemBottom >= wrapperBottom) {
                        this.scrollTop = viewItemBottom - this.viewHeight;
                    }
                }
            }
        }
        onItemAddTrait(e) {
            let item = e.item;
            let trait = e.trait;
            let viewItem = this.items[item.id];
            if (viewItem) {
                viewItem.addClass(trait);
            }
            if (trait === 'highlighted') {
                DOM.addClass(this.domNode, trait);
                // Ugly Firefox fix: input fields can't be selected if parent nodes are draggable
                if (viewItem) {
                    this.highlightedItemWasDraggable = !!viewItem.draggable;
                    if (viewItem.draggable) {
                        viewItem.draggable = false;
                    }
                }
            }
        }
        onItemRemoveTrait(e) {
            let item = e.item;
            let trait = e.trait;
            let viewItem = this.items[item.id];
            if (viewItem) {
                viewItem.removeClass(trait);
            }
            if (trait === 'highlighted') {
                DOM.removeClass(this.domNode, trait);
                // Ugly Firefox fix: input fields can't be selected if parent nodes are draggable
                if (this.highlightedItemWasDraggable) {
                    viewItem.draggable = true;
                }
                this.highlightedItemWasDraggable = false;
            }
        }
        onModelFocusChange() {
            const focus = this.model && this.model.getFocus();
            DOM.toggleClass(this.domNode, 'no-focused-item', !focus);
            // ARIA
            if (focus) {
                this.domNode.setAttribute('aria-activedescendant', strings.safeBtoa(this.context.dataSource.getId(this.context.tree, focus)));
            }
            else {
                this.domNode.removeAttribute('aria-activedescendant');
            }
        }
        // HeightMap "events"
        onInsertItem(item) {
            item.onDragStart = (e) => { this.onDragStart(item, e); };
            item.needsRender = true;
            this.refreshViewItem(item);
            this.items[item.id] = item;
        }
        onRefreshItem(item, needsRender = false) {
            item.needsRender = item.needsRender || needsRender;
            this.refreshViewItem(item);
        }
        onRemoveItem(item) {
            this.removeItemFromDOM(item);
            item.dispose();
            delete this.items[item.id];
        }
        // ViewItem refresh
        refreshViewItem(item) {
            item.render();
            if (this.shouldBeRendered(item)) {
                this.insertItemInDOM(item);
            }
            else {
                this.removeItemFromDOM(item);
            }
        }
        // DOM Events
        onClick(e) {
            if (this.lastPointerType && this.lastPointerType !== 'mouse') {
                return;
            }
            let event = new Mouse.StandardMouseEvent(e);
            let item = this.getItemAround(event.target);
            if (!item) {
                return;
            }
            if (Browser.isIE && Date.now() - this.lastClickTimeStamp < 300) {
                // IE10+ doesn't set the detail property correctly. While IE10 simply
                // counts the number of clicks, IE11 reports always 1. To align with
                // other browser, we set the value to 2 if clicks events come in a 300ms
                // sequence.
                event.detail = 2;
            }
            this.lastClickTimeStamp = Date.now();
            this.context.controller.onClick(this.context.tree, item.model.getElement(), event);
        }
        onMouseMiddleClick(e) {
            if (!this.context.controller.onMouseMiddleClick) {
                return;
            }
            let event = new Mouse.StandardMouseEvent(e);
            let item = this.getItemAround(event.target);
            if (!item) {
                return;
            }
            this.context.controller.onMouseMiddleClick(this.context.tree, item.model.getElement(), event);
        }
        onMouseDown(e) {
            this.didJustPressContextMenuKey = false;
            if (!this.context.controller.onMouseDown) {
                return;
            }
            if (this.lastPointerType && this.lastPointerType !== 'mouse') {
                return;
            }
            let event = new Mouse.StandardMouseEvent(e);
            if (event.ctrlKey && Platform.isNative && Platform.isMacintosh) {
                return;
            }
            let item = this.getItemAround(event.target);
            if (!item) {
                return;
            }
            this.context.controller.onMouseDown(this.context.tree, item.model.getElement(), event);
        }
        onMouseUp(e) {
            if (!this.context.controller.onMouseUp) {
                return;
            }
            if (this.lastPointerType && this.lastPointerType !== 'mouse') {
                return;
            }
            let event = new Mouse.StandardMouseEvent(e);
            if (event.ctrlKey && Platform.isNative && Platform.isMacintosh) {
                return;
            }
            let item = this.getItemAround(event.target);
            if (!item) {
                return;
            }
            this.context.controller.onMouseUp(this.context.tree, item.model.getElement(), event);
        }
        onTap(e) {
            let item = this.getItemAround(e.initialTarget);
            if (!item) {
                return;
            }
            this.context.controller.onTap(this.context.tree, item.model.getElement(), e);
        }
        onTouchChange(event) {
            event.preventDefault();
            event.stopPropagation();
            this.scrollTop -= event.translationY;
        }
        onContextMenu(event) {
            let resultEvent;
            let element;
            if (event instanceof KeyboardEvent || this.didJustPressContextMenuKey) {
                this.didJustPressContextMenuKey = false;
                let keyboardEvent = new Keyboard.StandardKeyboardEvent(event);
                element = this.model.getFocus();
                let position;
                if (!element) {
                    element = this.model.getInput();
                    position = DOM.getDomNodePagePosition(this.inputItem.element);
                }
                else {
                    const id = this.context.dataSource.getId(this.context.tree, element);
                    const viewItem = this.items[id];
                    position = DOM.getDomNodePagePosition(viewItem.element);
                }
                resultEvent = new _.KeyboardContextMenuEvent(position.left + position.width, position.top, keyboardEvent);
            }
            else {
                let mouseEvent = new Mouse.StandardMouseEvent(event);
                let item = this.getItemAround(mouseEvent.target);
                if (!item) {
                    return;
                }
                element = item.model.getElement();
                resultEvent = new _.MouseContextMenuEvent(mouseEvent);
            }
            this.context.controller.onContextMenu(this.context.tree, element, resultEvent);
        }
        onKeyDown(e) {
            let event = new Keyboard.StandardKeyboardEvent(e);
            this.didJustPressContextMenuKey = event.keyCode === 58 /* ContextMenu */ || (event.shiftKey && event.keyCode === 68 /* F10 */);
            if (event.target && event.target.tagName && event.target.tagName.toLowerCase() === 'input') {
                return; // Ignore event if target is a form input field (avoids browser specific issues)
            }
            if (this.didJustPressContextMenuKey) {
                event.preventDefault();
                event.stopPropagation();
            }
            this.context.controller.onKeyDown(this.context.tree, event);
        }
        onKeyUp(e) {
            if (this.didJustPressContextMenuKey) {
                this.onContextMenu(e);
            }
            this.didJustPressContextMenuKey = false;
            this.context.controller.onKeyUp(this.context.tree, new Keyboard.StandardKeyboardEvent(e));
        }
        onDragStart(item, e) {
            if (this.model.getHighlight()) {
                return;
            }
            let element = item.model.getElement();
            let selection = this.model.getSelection();
            let elements;
            if (selection.indexOf(element) > -1) {
                elements = selection;
            }
            else {
                elements = [element];
            }
            e.dataTransfer.effectAllowed = 'copyMove';
            e.dataTransfer.setData(dnd_1.DataTransfers.RESOURCES, JSON.stringify([item.uri]));
            if (e.dataTransfer.setDragImage) {
                let label;
                if (this.context.dnd.getDragLabel) {
                    label = this.context.dnd.getDragLabel(this.context.tree, elements);
                }
                else {
                    label = String(elements.length);
                }
                const dragImage = document.createElement('div');
                dragImage.className = 'monaco-tree-drag-image';
                dragImage.textContent = label;
                document.body.appendChild(dragImage);
                e.dataTransfer.setDragImage(dragImage, -10, -10);
                setTimeout(() => document.body.removeChild(dragImage), 0);
            }
            this.currentDragAndDropData = new dnd.ElementsDragAndDropData(elements);
            dnd_1.StaticDND.CurrentDragAndDropData = new dnd.ExternalElementsDragAndDropData(elements);
            this.context.dnd.onDragStart(this.context.tree, this.currentDragAndDropData, new Mouse.DragMouseEvent(e));
        }
        setupDragAndDropScrollInterval() {
            let viewTop = DOM.getTopLeftOffset(this.wrapper).top;
            if (!this.dragAndDropScrollInterval) {
                this.dragAndDropScrollInterval = window.setInterval(() => {
                    if (this.dragAndDropMouseY === null) {
                        return;
                    }
                    let diff = this.dragAndDropMouseY - viewTop;
                    let scrollDiff = 0;
                    let upperLimit = this.viewHeight - 35;
                    if (diff < 35) {
                        scrollDiff = Math.max(-14, 0.2 * (diff - 35));
                    }
                    else if (diff > upperLimit) {
                        scrollDiff = Math.min(14, 0.2 * (diff - upperLimit));
                    }
                    this.scrollTop += scrollDiff;
                }, 10);
                this.cancelDragAndDropScrollTimeout();
                this.dragAndDropScrollTimeout = window.setTimeout(() => {
                    this.cancelDragAndDropScrollInterval();
                    this.dragAndDropScrollTimeout = null;
                }, 1000);
            }
        }
        cancelDragAndDropScrollInterval() {
            if (this.dragAndDropScrollInterval) {
                window.clearInterval(this.dragAndDropScrollInterval);
                this.dragAndDropScrollInterval = null;
            }
            this.cancelDragAndDropScrollTimeout();
        }
        cancelDragAndDropScrollTimeout() {
            if (this.dragAndDropScrollTimeout) {
                window.clearTimeout(this.dragAndDropScrollTimeout);
                this.dragAndDropScrollTimeout = null;
            }
        }
        onDragOver(e) {
            e.preventDefault(); // needed so that the drop event fires (https://stackoverflow.com/questions/21339924/drop-event-not-firing-in-chrome)
            let event = new Mouse.DragMouseEvent(e);
            let viewItem = this.getItemAround(event.target);
            if (!viewItem || (event.posx === 0 && event.posy === 0 && event.browserEvent.type === DOM.EventType.DRAG_LEAVE)) {
                // dragging outside of tree
                if (this.currentDropTarget) {
                    // clear previously hovered element feedback
                    this.currentDropTargets.forEach(i => i.dropTarget = false);
                    this.currentDropTargets = [];
                    this.currentDropDisposable.dispose();
                }
                this.cancelDragAndDropScrollInterval();
                this.currentDropTarget = null;
                this.currentDropElement = null;
                this.dragAndDropMouseY = null;
                return false;
            }
            // dragging inside the tree
            this.setupDragAndDropScrollInterval();
            this.dragAndDropMouseY = event.posy;
            if (!this.currentDragAndDropData) {
                // just started dragging
                if (dnd_1.StaticDND.CurrentDragAndDropData) {
                    this.currentDragAndDropData = dnd_1.StaticDND.CurrentDragAndDropData;
                }
                else {
                    if (!event.dataTransfer.types) {
                        return false;
                    }
                    this.currentDragAndDropData = new dnd.DesktopDragAndDropData();
                }
            }
            this.currentDragAndDropData.update(event.browserEvent.dataTransfer);
            let element;
            let item = viewItem.model;
            let reaction;
            // check the bubble up behavior
            do {
                element = item ? item.getElement() : this.model.getInput();
                reaction = this.context.dnd.onDragOver(this.context.tree, this.currentDragAndDropData, element, event);
                if (!reaction || reaction.bubble !== 1 /* BUBBLE_UP */) {
                    break;
                }
                item = item && item.parent;
            } while (item);
            if (!item) {
                this.currentDropElement = null;
                return false;
            }
            let canDrop = reaction && reaction.accept;
            if (canDrop) {
                this.currentDropElement = item.getElement();
                event.preventDefault();
                event.dataTransfer.dropEffect = reaction.effect === 0 /* COPY */ ? 'copy' : 'move';
            }
            else {
                this.currentDropElement = null;
            }
            // item is the model item where drop() should be called
            // can be null
            let currentDropTarget = item.id === this.inputItem.id ? this.inputItem : this.items[item.id];
            if (this.shouldInvalidateDropReaction || this.currentDropTarget !== currentDropTarget || !reactionEquals(this.currentDropElementReaction, reaction)) {
                this.shouldInvalidateDropReaction = false;
                if (this.currentDropTarget) {
                    this.currentDropTargets.forEach(i => i.dropTarget = false);
                    this.currentDropTargets = [];
                    this.currentDropDisposable.dispose();
                }
                this.currentDropTarget = currentDropTarget;
                this.currentDropElementReaction = reaction;
                if (canDrop) {
                    // setup hover feedback for drop target
                    if (this.currentDropTarget) {
                        this.currentDropTarget.dropTarget = true;
                        this.currentDropTargets.push(this.currentDropTarget);
                    }
                    if (reaction.bubble === 0 /* BUBBLE_DOWN */) {
                        let nav = item.getNavigator();
                        let child;
                        while (child = nav.next()) {
                            viewItem = this.items[child.id];
                            if (viewItem) {
                                viewItem.dropTarget = true;
                                this.currentDropTargets.push(viewItem);
                            }
                        }
                    }
                    if (reaction.autoExpand) {
                        const timeoutPromise = async_1.timeout(500);
                        this.currentDropDisposable = Lifecycle.toDisposable(() => timeoutPromise.cancel());
                        timeoutPromise
                            .then(() => this.context.tree.expand(this.currentDropElement))
                            .then(() => this.shouldInvalidateDropReaction = true);
                    }
                }
            }
            return true;
        }
        onDrop(e) {
            if (this.currentDropElement) {
                let event = new Mouse.DragMouseEvent(e);
                event.preventDefault();
                this.currentDragAndDropData.update(event.browserEvent.dataTransfer);
                this.context.dnd.drop(this.context.tree, this.currentDragAndDropData, this.currentDropElement, event);
                this.onDragEnd(e);
            }
            this.cancelDragAndDropScrollInterval();
        }
        onDragEnd(e) {
            if (this.currentDropTarget) {
                this.currentDropTargets.forEach(i => i.dropTarget = false);
                this.currentDropTargets = [];
            }
            this.currentDropDisposable.dispose();
            this.cancelDragAndDropScrollInterval();
            this.currentDragAndDropData = null;
            dnd_1.StaticDND.CurrentDragAndDropData = undefined;
            this.currentDropElement = null;
            this.currentDropTarget = null;
            this.dragAndDropMouseY = null;
        }
        onFocus() {
            if (!this.context.options.alwaysFocused) {
                DOM.addClass(this.domNode, 'focused');
            }
            this._onDOMFocus.fire();
        }
        onBlur() {
            if (!this.context.options.alwaysFocused) {
                DOM.removeClass(this.domNode, 'focused');
            }
            this.domNode.removeAttribute('aria-activedescendant'); // ARIA
            this._onDOMBlur.fire();
        }
        // MS specific DOM Events
        onMsPointerDown(event) {
            if (!this.msGesture) {
                return;
            }
            // Circumvent IE11 breaking change in e.pointerType & TypeScript's stale definitions
            let pointerType = event.pointerType;
            if (pointerType === (event.MSPOINTER_TYPE_MOUSE || 'mouse')) {
                this.lastPointerType = 'mouse';
                return;
            }
            else if (pointerType === (event.MSPOINTER_TYPE_TOUCH || 'touch')) {
                this.lastPointerType = 'touch';
            }
            else {
                return;
            }
            event.stopPropagation();
            event.preventDefault();
            this.msGesture.addPointer(event.pointerId);
        }
        onThrottledMsGestureChange(event) {
            this.scrollTop -= event.translationY;
        }
        onMsGestureTap(event) {
            event.initialTarget = document.elementFromPoint(event.clientX, event.clientY);
            this.onTap(event);
        }
        // DOM changes
        insertItemInDOM(item) {
            let elementAfter = null;
            let itemAfter = this.itemAfter(item);
            if (itemAfter && itemAfter.element) {
                elementAfter = itemAfter.element;
            }
            item.insertInDOM(this.rowsContainer, elementAfter);
        }
        removeItemFromDOM(item) {
            if (!item) {
                return;
            }
            item.removeFromDOM();
        }
        // Helpers
        shouldBeRendered(item) {
            return item.top < this.lastRenderTop + this.lastRenderHeight && item.top + item.height > this.lastRenderTop;
        }
        getItemAround(element) {
            let candidate = this.inputItem;
            let el = element;
            do {
                if (el[TreeView.BINDING]) {
                    candidate = el[TreeView.BINDING];
                }
                if (el === this.wrapper || el === this.domNode) {
                    return candidate;
                }
                if (el === this.scrollableElement.getDomNode() || el === document.body) {
                    return undefined;
                }
            } while (el = el.parentElement);
            return undefined;
        }
        // Cleanup
        releaseModel() {
            if (this.model) {
                this.modelListeners = Lifecycle.dispose(this.modelListeners);
                this.model = null;
            }
        }
        dispose() {
            // TODO@joao: improve
            this.scrollableElement.dispose();
            this.releaseModel();
            this.viewListeners = Lifecycle.dispose(this.viewListeners);
            this._onDOMFocus.dispose();
            this._onDOMBlur.dispose();
            if (this.domNode.parentNode) {
                this.domNode.parentNode.removeChild(this.domNode);
            }
            if (this.items) {
                Object.keys(this.items).forEach(key => this.items[key].removeFromDOM());
            }
            if (this.context.cache) {
                this.context.cache.dispose();
            }
            this.gestureDisposable.dispose();
            super.dispose();
        }
    }
    exports.TreeView = TreeView;
    TreeView.BINDING = 'monaco-tree-row';
    TreeView.LOADING_DECORATION_DELAY = 800;
    TreeView.counter = 0;
});
//# sourceMappingURL=treeView.js.map