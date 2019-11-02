/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/assert", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/event"], function (require, exports, Assert, errors_1, lifecycle_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class LockData {
        constructor(item) {
            this._onDispose = new event_1.Emitter();
            this.onDispose = this._onDispose.event;
            this._item = item;
        }
        get item() {
            return this._item;
        }
        dispose() {
            if (this._onDispose) {
                this._onDispose.fire();
                this._onDispose.dispose();
                this._onDispose = undefined;
            }
        }
    }
    exports.LockData = LockData;
    class Lock {
        constructor() {
            this.locks = Object.create({});
        }
        isLocked(item) {
            return !!this.locks[item.id];
        }
        run(item, fn) {
            const lock = this.getLock(item);
            if (lock) {
                return new Promise((c, e) => {
                    event_1.Event.once(lock.onDispose)(() => {
                        return this.run(item, fn).then(c, e);
                    });
                });
            }
            let result;
            return new Promise((c, e) => {
                if (item.isDisposed()) {
                    return e(new Error('Item is disposed.'));
                }
                let lock = this.locks[item.id] = new LockData(item);
                result = fn().then((r) => {
                    delete this.locks[item.id];
                    lock.dispose();
                    return r;
                }).then(c, e);
                return result;
            });
        }
        getLock(item) {
            let key;
            for (key in this.locks) {
                let lock = this.locks[key];
                if (item.intersects(lock.item)) {
                    return lock;
                }
            }
            return null;
        }
    }
    exports.Lock = Lock;
    class ItemRegistry {
        constructor() {
            this._isDisposed = false;
            this._onDidRevealItem = new event_1.EventMultiplexer();
            this.onDidRevealItem = this._onDidRevealItem.event;
            this._onExpandItem = new event_1.EventMultiplexer();
            this.onExpandItem = this._onExpandItem.event;
            this._onDidExpandItem = new event_1.EventMultiplexer();
            this.onDidExpandItem = this._onDidExpandItem.event;
            this._onCollapseItem = new event_1.EventMultiplexer();
            this.onCollapseItem = this._onCollapseItem.event;
            this._onDidCollapseItem = new event_1.EventMultiplexer();
            this.onDidCollapseItem = this._onDidCollapseItem.event;
            this._onDidAddTraitItem = new event_1.EventMultiplexer();
            this.onDidAddTraitItem = this._onDidAddTraitItem.event;
            this._onDidRemoveTraitItem = new event_1.EventMultiplexer();
            this.onDidRemoveTraitItem = this._onDidRemoveTraitItem.event;
            this._onDidRefreshItem = new event_1.EventMultiplexer();
            this.onDidRefreshItem = this._onDidRefreshItem.event;
            this._onRefreshItemChildren = new event_1.EventMultiplexer();
            this.onRefreshItemChildren = this._onRefreshItemChildren.event;
            this._onDidRefreshItemChildren = new event_1.EventMultiplexer();
            this.onDidRefreshItemChildren = this._onDidRefreshItemChildren.event;
            this._onDidDisposeItem = new event_1.EventMultiplexer();
            this.onDidDisposeItem = this._onDidDisposeItem.event;
            this.items = {};
        }
        register(item) {
            Assert.ok(!this.isRegistered(item.id), 'item already registered: ' + item.id);
            const disposable = lifecycle_1.combinedDisposable(this._onDidRevealItem.add(item.onDidReveal), this._onExpandItem.add(item.onExpand), this._onDidExpandItem.add(item.onDidExpand), this._onCollapseItem.add(item.onCollapse), this._onDidCollapseItem.add(item.onDidCollapse), this._onDidAddTraitItem.add(item.onDidAddTrait), this._onDidRemoveTraitItem.add(item.onDidRemoveTrait), this._onDidRefreshItem.add(item.onDidRefresh), this._onRefreshItemChildren.add(item.onRefreshChildren), this._onDidRefreshItemChildren.add(item.onDidRefreshChildren), this._onDidDisposeItem.add(item.onDidDispose));
            this.items[item.id] = { item, disposable };
        }
        deregister(item) {
            Assert.ok(this.isRegistered(item.id), 'item not registered: ' + item.id);
            this.items[item.id].disposable.dispose();
            delete this.items[item.id];
        }
        isRegistered(id) {
            return this.items.hasOwnProperty(id);
        }
        getItem(id) {
            const result = this.items[id];
            return result ? result.item : null;
        }
        dispose() {
            this.items = {};
            this._onDidRevealItem.dispose();
            this._onExpandItem.dispose();
            this._onDidExpandItem.dispose();
            this._onCollapseItem.dispose();
            this._onDidCollapseItem.dispose();
            this._onDidAddTraitItem.dispose();
            this._onDidRemoveTraitItem.dispose();
            this._onDidRefreshItem.dispose();
            this._onRefreshItemChildren.dispose();
            this._onDidRefreshItemChildren.dispose();
            this._isDisposed = true;
        }
        isDisposed() {
            return this._isDisposed;
        }
    }
    exports.ItemRegistry = ItemRegistry;
    class Item {
        constructor(id, registry, context, lock, element) {
            this._onDidCreate = new event_1.Emitter();
            this.onDidCreate = this._onDidCreate.event;
            this._onDidReveal = new event_1.Emitter();
            this.onDidReveal = this._onDidReveal.event;
            this._onExpand = new event_1.Emitter();
            this.onExpand = this._onExpand.event;
            this._onDidExpand = new event_1.Emitter();
            this.onDidExpand = this._onDidExpand.event;
            this._onCollapse = new event_1.Emitter();
            this.onCollapse = this._onCollapse.event;
            this._onDidCollapse = new event_1.Emitter();
            this.onDidCollapse = this._onDidCollapse.event;
            this._onDidAddTrait = new event_1.Emitter();
            this.onDidAddTrait = this._onDidAddTrait.event;
            this._onDidRemoveTrait = new event_1.Emitter();
            this.onDidRemoveTrait = this._onDidRemoveTrait.event;
            this._onDidRefresh = new event_1.Emitter();
            this.onDidRefresh = this._onDidRefresh.event;
            this._onRefreshChildren = new event_1.Emitter();
            this.onRefreshChildren = this._onRefreshChildren.event;
            this._onDidRefreshChildren = new event_1.Emitter();
            this.onDidRefreshChildren = this._onDidRefreshChildren.event;
            this._onDidDispose = new event_1.Emitter();
            this.onDidDispose = this._onDidDispose.event;
            this.registry = registry;
            this.context = context;
            this.lock = lock;
            this.element = element;
            this.id = id;
            this.registry.register(this);
            this.doesHaveChildren = this.context.dataSource.hasChildren(this.context.tree, this.element);
            this.needsChildrenRefresh = true;
            this.parent = null;
            this.previous = null;
            this.next = null;
            this.firstChild = null;
            this.lastChild = null;
            this.traits = {};
            this.depth = 0;
            this.expanded = !!(this.context.dataSource.shouldAutoexpand && this.context.dataSource.shouldAutoexpand(this.context.tree, element));
            this._onDidCreate.fire(this);
            this.visible = this._isVisible();
            this.height = this._getHeight();
            this._isDisposed = false;
        }
        getElement() {
            return this.element;
        }
        hasChildren() {
            return this.doesHaveChildren;
        }
        getDepth() {
            return this.depth;
        }
        isVisible() {
            return this.visible;
        }
        setVisible(value) {
            this.visible = value;
        }
        isExpanded() {
            return this.expanded;
        }
        /* protected */ _setExpanded(value) {
            this.expanded = value;
        }
        reveal(relativeTop = null) {
            let eventData = { item: this, relativeTop: relativeTop };
            this._onDidReveal.fire(eventData);
        }
        expand() {
            if (this.isExpanded() || !this.doesHaveChildren || this.lock.isLocked(this)) {
                return Promise.resolve(false);
            }
            let result = this.lock.run(this, () => {
                if (this.isExpanded() || !this.doesHaveChildren) {
                    return Promise.resolve(false);
                }
                let eventData = { item: this };
                let result;
                this._onExpand.fire(eventData);
                if (this.needsChildrenRefresh) {
                    result = this.refreshChildren(false, true, true);
                }
                else {
                    result = Promise.resolve(null);
                }
                return result.then(() => {
                    this._setExpanded(true);
                    this._onDidExpand.fire(eventData);
                    return true;
                });
            });
            return result.then((r) => {
                if (this.isDisposed()) {
                    return false;
                }
                // Auto expand single child folders
                if (this.context.options.autoExpandSingleChildren && r && this.firstChild !== null && this.firstChild === this.lastChild && this.firstChild.isVisible()) {
                    return this.firstChild.expand().then(() => { return true; });
                }
                return r;
            });
        }
        collapse(recursive = false) {
            if (recursive) {
                let collapseChildrenPromise = Promise.resolve(null);
                this.forEachChild((child) => {
                    collapseChildrenPromise = collapseChildrenPromise.then(() => child.collapse(true));
                });
                return collapseChildrenPromise.then(() => {
                    return this.collapse(false);
                });
            }
            else {
                if (!this.isExpanded() || this.lock.isLocked(this)) {
                    return Promise.resolve(false);
                }
                return this.lock.run(this, () => {
                    let eventData = { item: this };
                    this._onCollapse.fire(eventData);
                    this._setExpanded(false);
                    this._onDidCollapse.fire(eventData);
                    return Promise.resolve(true);
                });
            }
        }
        addTrait(trait) {
            let eventData = { item: this, trait: trait };
            this.traits[trait] = true;
            this._onDidAddTrait.fire(eventData);
        }
        removeTrait(trait) {
            let eventData = { item: this, trait: trait };
            delete this.traits[trait];
            this._onDidRemoveTrait.fire(eventData);
        }
        hasTrait(trait) {
            return this.traits[trait] || false;
        }
        getAllTraits() {
            let result = [];
            let trait;
            for (trait in this.traits) {
                if (this.traits.hasOwnProperty(trait) && this.traits[trait]) {
                    result.push(trait);
                }
            }
            return result;
        }
        getHeight() {
            return this.height;
        }
        refreshChildren(recursive, safe = false, force = false) {
            if (!force && !this.isExpanded()) {
                const setNeedsChildrenRefresh = (item) => {
                    item.needsChildrenRefresh = true;
                    item.forEachChild(setNeedsChildrenRefresh);
                };
                setNeedsChildrenRefresh(this);
                return Promise.resolve(this);
            }
            this.needsChildrenRefresh = false;
            let doRefresh = () => {
                let eventData = { item: this, isNested: safe };
                this._onRefreshChildren.fire(eventData);
                let childrenPromise;
                if (this.doesHaveChildren) {
                    childrenPromise = this.context.dataSource.getChildren(this.context.tree, this.element);
                }
                else {
                    childrenPromise = Promise.resolve([]);
                }
                const result = childrenPromise.then((elements) => {
                    if (this.isDisposed() || this.registry.isDisposed()) {
                        return Promise.resolve(null);
                    }
                    if (!Array.isArray(elements)) {
                        return Promise.reject(new Error('Please return an array of children.'));
                    }
                    elements = !elements ? [] : elements.slice(0);
                    elements = this.sort(elements);
                    let staleItems = {};
                    while (this.firstChild !== null) {
                        staleItems[this.firstChild.id] = this.firstChild;
                        this.removeChild(this.firstChild);
                    }
                    for (let i = 0, len = elements.length; i < len; i++) {
                        let element = elements[i];
                        let id = this.context.dataSource.getId(this.context.tree, element);
                        let item = staleItems[id] || new Item(id, this.registry, this.context, this.lock, element);
                        item.element = element;
                        if (recursive) {
                            item.needsChildrenRefresh = recursive;
                        }
                        delete staleItems[id];
                        this.addChild(item);
                    }
                    for (let staleItemId in staleItems) {
                        if (staleItems.hasOwnProperty(staleItemId)) {
                            staleItems[staleItemId].dispose();
                        }
                    }
                    if (recursive) {
                        return Promise.all(this.mapEachChild((child) => {
                            return child.doRefresh(recursive, true);
                        }));
                    }
                    else {
                        return Promise.all(this.mapEachChild((child) => {
                            if (child.isExpanded() && child.needsChildrenRefresh) {
                                return child.doRefresh(recursive, true);
                            }
                            else {
                                child.updateVisibility();
                                return Promise.resolve(null);
                            }
                        }));
                    }
                });
                return result
                    .then(undefined, errors_1.onUnexpectedError)
                    .then(() => this._onDidRefreshChildren.fire(eventData));
            };
            return safe ? doRefresh() : this.lock.run(this, doRefresh);
        }
        doRefresh(recursive, safe = false) {
            this.doesHaveChildren = this.context.dataSource.hasChildren(this.context.tree, this.element);
            this.height = this._getHeight();
            this.updateVisibility();
            this._onDidRefresh.fire(this);
            return this.refreshChildren(recursive, safe);
        }
        updateVisibility() {
            this.setVisible(this._isVisible());
        }
        refresh(recursive) {
            return this.doRefresh(recursive);
        }
        getNavigator() {
            return new TreeNavigator(this);
        }
        intersects(other) {
            return this.isAncestorOf(other) || other.isAncestorOf(this);
        }
        isAncestorOf(startItem) {
            let item = startItem;
            while (item) {
                if (item.id === this.id) {
                    return true;
                }
                item = item.parent;
            }
            return false;
        }
        addChild(item, afterItem = this.lastChild) {
            let isEmpty = this.firstChild === null;
            let atHead = afterItem === null;
            let atTail = afterItem === this.lastChild;
            if (isEmpty) {
                this.firstChild = this.lastChild = item;
                item.next = item.previous = null;
            }
            else if (atHead) {
                if (!this.firstChild) {
                    throw new Error('Invalid tree state');
                }
                this.firstChild.previous = item;
                item.next = this.firstChild;
                item.previous = null;
                this.firstChild = item;
            }
            else if (atTail) {
                if (!this.lastChild) {
                    throw new Error('Invalid tree state');
                }
                this.lastChild.next = item;
                item.next = null;
                item.previous = this.lastChild;
                this.lastChild = item;
            }
            else {
                item.previous = afterItem;
                if (!afterItem) {
                    throw new Error('Invalid tree state');
                }
                item.next = afterItem.next;
                if (!afterItem.next) {
                    throw new Error('Invalid tree state');
                }
                afterItem.next.previous = item;
                afterItem.next = item;
            }
            item.parent = this;
            item.depth = this.depth + 1;
        }
        removeChild(item) {
            let isFirstChild = this.firstChild === item;
            let isLastChild = this.lastChild === item;
            if (isFirstChild && isLastChild) {
                this.firstChild = this.lastChild = null;
            }
            else if (isFirstChild) {
                if (!item.next) {
                    throw new Error('Invalid tree state');
                }
                item.next.previous = null;
                this.firstChild = item.next;
            }
            else if (isLastChild) {
                if (!item.previous) {
                    throw new Error('Invalid tree state');
                }
                item.previous.next = null;
                this.lastChild = item.previous;
            }
            else {
                if (!item.next) {
                    throw new Error('Invalid tree state');
                }
                item.next.previous = item.previous;
                if (!item.previous) {
                    throw new Error('Invalid tree state');
                }
                item.previous.next = item.next;
            }
            item.parent = null;
            item.depth = NaN;
        }
        forEachChild(fn) {
            let child = this.firstChild;
            let next;
            while (child) {
                next = child.next;
                fn(child);
                child = next;
            }
        }
        mapEachChild(fn) {
            let result = [];
            this.forEachChild((child) => {
                result.push(fn(child));
            });
            return result;
        }
        sort(elements) {
            const sorter = this.context.sorter;
            if (sorter) {
                return elements.sort((element, otherElement) => {
                    return sorter.compare(this.context.tree, element, otherElement);
                });
            }
            return elements;
        }
        /* protected */ _getHeight() {
            if (!this.context.renderer) {
                return 0;
            }
            return this.context.renderer.getHeight(this.context.tree, this.element);
        }
        /* protected */ _isVisible() {
            if (!this.context.filter) {
                return false;
            }
            return this.context.filter.isVisible(this.context.tree, this.element);
        }
        isDisposed() {
            return this._isDisposed;
        }
        dispose() {
            this.forEachChild((child) => child.dispose());
            this.parent = null;
            this.previous = null;
            this.next = null;
            this.firstChild = null;
            this.lastChild = null;
            this._onDidDispose.fire(this);
            this.registry.deregister(this);
            this._onDidCreate.dispose();
            this._onDidReveal.dispose();
            this._onExpand.dispose();
            this._onDidExpand.dispose();
            this._onCollapse.dispose();
            this._onDidCollapse.dispose();
            this._onDidAddTrait.dispose();
            this._onDidRemoveTrait.dispose();
            this._onDidRefresh.dispose();
            this._onRefreshChildren.dispose();
            this._onDidRefreshChildren.dispose();
            this._onDidDispose.dispose();
            this._isDisposed = true;
        }
    }
    exports.Item = Item;
    class RootItem extends Item {
        constructor(id, registry, context, lock, element) {
            super(id, registry, context, lock, element);
        }
        isVisible() {
            return false;
        }
        setVisible(value) {
            // no-op
        }
        isExpanded() {
            return true;
        }
        /* protected */ _setExpanded(value) {
            // no-op
        }
        render() {
            // no-op
        }
        /* protected */ _getHeight() {
            return 0;
        }
        /* protected */ _isVisible() {
            return false;
        }
    }
    class TreeNavigator {
        constructor(item, subTreeOnly = true) {
            this.item = item;
            this.start = subTreeOnly ? item : null;
        }
        static lastDescendantOf(item) {
            if (!item) {
                return null;
            }
            if (item instanceof RootItem) {
                return TreeNavigator.lastDescendantOf(item.lastChild);
            }
            if (!item.isVisible()) {
                return TreeNavigator.lastDescendantOf(item.previous);
            }
            if (!item.isExpanded() || item.lastChild === null) {
                return item;
            }
            return TreeNavigator.lastDescendantOf(item.lastChild);
        }
        current() {
            return this.item || null;
        }
        next() {
            if (this.item) {
                do {
                    if ((this.item instanceof RootItem || (this.item.isVisible() && this.item.isExpanded())) && this.item.firstChild) {
                        this.item = this.item.firstChild;
                    }
                    else if (this.item === this.start) {
                        this.item = null;
                    }
                    else {
                        // select next brother, next uncle, next great-uncle, etc...
                        while (this.item && this.item !== this.start && !this.item.next) {
                            this.item = this.item.parent;
                        }
                        if (this.item === this.start) {
                            this.item = null;
                        }
                        this.item = !this.item ? null : this.item.next;
                    }
                } while (this.item && !this.item.isVisible());
            }
            return this.item || null;
        }
        previous() {
            if (this.item) {
                do {
                    let previous = TreeNavigator.lastDescendantOf(this.item.previous);
                    if (previous) {
                        this.item = previous;
                    }
                    else if (this.item.parent && this.item.parent !== this.start && this.item.parent.isVisible()) {
                        this.item = this.item.parent;
                    }
                    else {
                        this.item = null;
                    }
                } while (this.item && !this.item.isVisible());
            }
            return this.item || null;
        }
        parent() {
            if (this.item) {
                let parent = this.item.parent;
                if (parent && parent !== this.start && parent.isVisible()) {
                    this.item = parent;
                }
                else {
                    this.item = null;
                }
            }
            return this.item || null;
        }
        first() {
            this.item = this.start;
            this.next();
            return this.item || null;
        }
        last() {
            return TreeNavigator.lastDescendantOf(this.start);
        }
    }
    exports.TreeNavigator = TreeNavigator;
    class TreeModel {
        constructor(context) {
            this.registry = new ItemRegistry();
            this.registryDisposable = lifecycle_1.Disposable.None;
            this._onSetInput = new event_1.Emitter();
            this.onSetInput = this._onSetInput.event;
            this._onDidSetInput = new event_1.Emitter();
            this.onDidSetInput = this._onDidSetInput.event;
            this._onRefresh = new event_1.Emitter();
            this.onRefresh = this._onRefresh.event;
            this._onDidRefresh = new event_1.Emitter();
            this.onDidRefresh = this._onDidRefresh.event;
            this._onDidHighlight = new event_1.Emitter();
            this.onDidHighlight = this._onDidHighlight.event;
            this._onDidSelect = new event_1.Emitter();
            this.onDidSelect = this._onDidSelect.event;
            this._onDidFocus = new event_1.Emitter();
            this.onDidFocus = this._onDidFocus.event;
            this._onDidRevealItem = new event_1.Relay();
            this.onDidRevealItem = this._onDidRevealItem.event;
            this._onExpandItem = new event_1.Relay();
            this.onExpandItem = this._onExpandItem.event;
            this._onDidExpandItem = new event_1.Relay();
            this.onDidExpandItem = this._onDidExpandItem.event;
            this._onCollapseItem = new event_1.Relay();
            this.onCollapseItem = this._onCollapseItem.event;
            this._onDidCollapseItem = new event_1.Relay();
            this.onDidCollapseItem = this._onDidCollapseItem.event;
            this._onDidAddTraitItem = new event_1.Relay();
            this.onDidAddTraitItem = this._onDidAddTraitItem.event;
            this._onDidRemoveTraitItem = new event_1.Relay();
            this.onDidRemoveTraitItem = this._onDidRemoveTraitItem.event;
            this._onDidRefreshItem = new event_1.Relay();
            this.onDidRefreshItem = this._onDidRefreshItem.event;
            this._onRefreshItemChildren = new event_1.Relay();
            this.onRefreshItemChildren = this._onRefreshItemChildren.event;
            this._onDidRefreshItemChildren = new event_1.Relay();
            this.onDidRefreshItemChildren = this._onDidRefreshItemChildren.event;
            this._onDidDisposeItem = new event_1.Relay();
            this.onDidDisposeItem = this._onDidDisposeItem.event;
            this.context = context;
            this.input = null;
            this.traitsToItems = {};
        }
        setInput(element) {
            let eventData = { item: this.input };
            this._onSetInput.fire(eventData);
            this.setSelection([]);
            this.setFocus();
            this.setHighlight();
            this.lock = new Lock();
            if (this.input) {
                this.input.dispose();
            }
            if (this.registry) {
                this.registry.dispose();
                this.registryDisposable.dispose();
            }
            this.registry = new ItemRegistry();
            this._onDidRevealItem.input = this.registry.onDidRevealItem;
            this._onExpandItem.input = this.registry.onExpandItem;
            this._onDidExpandItem.input = this.registry.onDidExpandItem;
            this._onCollapseItem.input = this.registry.onCollapseItem;
            this._onDidCollapseItem.input = this.registry.onDidCollapseItem;
            this._onDidAddTraitItem.input = this.registry.onDidAddTraitItem;
            this._onDidRemoveTraitItem.input = this.registry.onDidRemoveTraitItem;
            this._onDidRefreshItem.input = this.registry.onDidRefreshItem;
            this._onRefreshItemChildren.input = this.registry.onRefreshItemChildren;
            this._onDidRefreshItemChildren.input = this.registry.onDidRefreshItemChildren;
            this._onDidDisposeItem.input = this.registry.onDidDisposeItem;
            this.registryDisposable = this.registry
                .onDidDisposeItem(item => item.getAllTraits().forEach(trait => delete this.traitsToItems[trait][item.id]));
            let id = this.context.dataSource.getId(this.context.tree, element);
            this.input = new RootItem(id, this.registry, this.context, this.lock, element);
            eventData = { item: this.input };
            this._onDidSetInput.fire(eventData);
            return this.refresh(this.input);
        }
        getInput() {
            return this.input ? this.input.getElement() : null;
        }
        refresh(element = null, recursive = true) {
            let item = this.getItem(element);
            if (!item) {
                return Promise.resolve(null);
            }
            let eventData = { item: item, recursive: recursive };
            this._onRefresh.fire(eventData);
            return item.refresh(recursive).then(() => {
                this._onDidRefresh.fire(eventData);
            });
        }
        expand(element) {
            let item = this.getItem(element);
            if (!item) {
                return Promise.resolve(false);
            }
            return item.expand();
        }
        expandAll(elements) {
            if (!elements) {
                elements = [];
                let item;
                let nav = this.getNavigator();
                while (item = nav.next()) {
                    elements.push(item);
                }
            }
            return this._expandAll(elements);
        }
        _expandAll(elements) {
            if (elements.length === 0) {
                return Promise.resolve(null);
            }
            const elementsToExpand = [];
            const elementsToDelay = [];
            for (const element of elements) {
                let item = this.getItem(element);
                if (item) {
                    elementsToExpand.push(element);
                }
                else {
                    elementsToDelay.push(element);
                }
            }
            if (elementsToExpand.length === 0) {
                return Promise.resolve(null);
            }
            return this.__expandAll(elementsToExpand)
                .then(() => this._expandAll(elementsToDelay));
        }
        __expandAll(elements) {
            const promises = [];
            for (let i = 0, len = elements.length; i < len; i++) {
                promises.push(this.expand(elements[i]));
            }
            return Promise.all(promises);
        }
        collapse(element, recursive = false) {
            const item = this.getItem(element);
            if (!item) {
                return Promise.resolve(false);
            }
            return item.collapse(recursive);
        }
        collapseAll(elements = null, recursive = false) {
            if (!elements) {
                elements = [this.input];
                recursive = true;
            }
            let promises = [];
            for (let i = 0, len = elements.length; i < len; i++) {
                promises.push(this.collapse(elements[i], recursive));
            }
            return Promise.all(promises);
        }
        toggleExpansion(element, recursive = false) {
            return this.isExpanded(element) ? this.collapse(element, recursive) : this.expand(element);
        }
        toggleExpansionAll(elements) {
            let promises = [];
            for (let i = 0, len = elements.length; i < len; i++) {
                promises.push(this.toggleExpansion(elements[i]));
            }
            return Promise.all(promises);
        }
        isExpanded(element) {
            let item = this.getItem(element);
            if (!item) {
                return false;
            }
            return item.isExpanded();
        }
        getExpandedElements() {
            let result = [];
            let item;
            let nav = this.getNavigator();
            while (item = nav.next()) {
                if (item.isExpanded()) {
                    result.push(item.getElement());
                }
            }
            return result;
        }
        reveal(element, relativeTop = null) {
            return this.resolveUnknownParentChain(element).then((chain) => {
                let result = Promise.resolve(null);
                chain.forEach((e) => {
                    result = result.then(() => this.expand(e));
                });
                return result;
            }).then(() => {
                let item = this.getItem(element);
                if (item) {
                    return item.reveal(relativeTop);
                }
            });
        }
        resolveUnknownParentChain(element) {
            return this.context.dataSource.getParent(this.context.tree, element).then((parent) => {
                if (!parent) {
                    return Promise.resolve([]);
                }
                return this.resolveUnknownParentChain(parent).then((result) => {
                    result.push(parent);
                    return result;
                });
            });
        }
        setHighlight(element, eventPayload) {
            this.setTraits('highlighted', element ? [element] : []);
            let eventData = { highlight: this.getHighlight(), payload: eventPayload };
            this._onDidHighlight.fire(eventData);
        }
        getHighlight(includeHidden = false) {
            let result = this.getElementsWithTrait('highlighted', includeHidden);
            return result.length === 0 ? null : result[0];
        }
        isHighlighted(element) {
            let item = this.getItem(element);
            if (!item) {
                return false;
            }
            return item.hasTrait('highlighted');
        }
        select(element, eventPayload) {
            this.selectAll([element], eventPayload);
        }
        selectAll(elements, eventPayload) {
            this.addTraits('selected', elements);
            let eventData = { selection: this.getSelection(), payload: eventPayload };
            this._onDidSelect.fire(eventData);
        }
        deselect(element, eventPayload) {
            this.deselectAll([element], eventPayload);
        }
        deselectAll(elements, eventPayload) {
            this.removeTraits('selected', elements);
            let eventData = { selection: this.getSelection(), payload: eventPayload };
            this._onDidSelect.fire(eventData);
        }
        setSelection(elements, eventPayload) {
            this.setTraits('selected', elements);
            let eventData = { selection: this.getSelection(), payload: eventPayload };
            this._onDidSelect.fire(eventData);
        }
        isSelected(element) {
            let item = this.getItem(element);
            if (!item) {
                return false;
            }
            return item.hasTrait('selected');
        }
        getSelection(includeHidden = false) {
            return this.getElementsWithTrait('selected', includeHidden);
        }
        selectNext(count = 1, clearSelection = true, eventPayload) {
            let selection = this.getSelection();
            let item = selection.length > 0 ? selection[0] : this.input;
            let nextItem;
            let nav = this.getNavigator(item, false);
            for (let i = 0; i < count; i++) {
                nextItem = nav.next();
                if (!nextItem) {
                    break;
                }
                item = nextItem;
            }
            if (clearSelection) {
                this.setSelection([item], eventPayload);
            }
            else {
                this.select(item, eventPayload);
            }
        }
        selectPrevious(count = 1, clearSelection = true, eventPayload) {
            let selection = this.getSelection(), item = null, previousItem = null;
            if (selection.length === 0) {
                let nav = this.getNavigator(this.input);
                while (item = nav.next()) {
                    previousItem = item;
                }
                item = previousItem;
            }
            else {
                item = selection[0];
                let nav = this.getNavigator(item, false);
                for (let i = 0; i < count; i++) {
                    previousItem = nav.previous();
                    if (!previousItem) {
                        break;
                    }
                    item = previousItem;
                }
            }
            if (clearSelection) {
                this.setSelection([item], eventPayload);
            }
            else {
                this.select(item, eventPayload);
            }
        }
        setFocus(element, eventPayload) {
            this.setTraits('focused', element ? [element] : []);
            let eventData = { focus: this.getFocus(), payload: eventPayload };
            this._onDidFocus.fire(eventData);
        }
        isFocused(element) {
            let item = this.getItem(element);
            if (!item) {
                return false;
            }
            return item.hasTrait('focused');
        }
        getFocus(includeHidden = false) {
            let result = this.getElementsWithTrait('focused', includeHidden);
            return result.length === 0 ? null : result[0];
        }
        focusNext(count = 1, eventPayload) {
            let item = this.getFocus() || this.input;
            let nextItem;
            let nav = this.getNavigator(item, false);
            for (let i = 0; i < count; i++) {
                nextItem = nav.next();
                if (!nextItem) {
                    break;
                }
                item = nextItem;
            }
            this.setFocus(item, eventPayload);
        }
        focusPrevious(count = 1, eventPayload) {
            let item = this.getFocus() || this.input;
            let previousItem;
            let nav = this.getNavigator(item, false);
            for (let i = 0; i < count; i++) {
                previousItem = nav.previous();
                if (!previousItem) {
                    break;
                }
                item = previousItem;
            }
            this.setFocus(item, eventPayload);
        }
        focusParent(eventPayload) {
            let item = this.getFocus() || this.input;
            let nav = this.getNavigator(item, false);
            let parent = nav.parent();
            if (parent) {
                this.setFocus(parent, eventPayload);
            }
        }
        focusFirstChild(eventPayload) {
            const item = this.getItem(this.getFocus() || this.input);
            const nav = this.getNavigator(item, false);
            const next = nav.next();
            const parent = nav.parent();
            if (parent === item) {
                this.setFocus(next, eventPayload);
            }
        }
        focusFirst(eventPayload, from) {
            this.focusNth(0, eventPayload, from);
        }
        focusNth(index, eventPayload, from) {
            let navItem = this.getParent(from);
            let nav = this.getNavigator(navItem);
            let item = nav.first();
            for (let i = 0; i < index; i++) {
                item = nav.next();
            }
            if (item) {
                this.setFocus(item, eventPayload);
            }
        }
        focusLast(eventPayload, from) {
            const navItem = this.getParent(from);
            let item;
            if (from && navItem) {
                item = navItem.lastChild;
            }
            else {
                const nav = this.getNavigator(navItem);
                item = nav.last();
            }
            if (item) {
                this.setFocus(item, eventPayload);
            }
        }
        getParent(from) {
            if (from) {
                const fromItem = this.getItem(from);
                if (fromItem && fromItem.parent) {
                    return fromItem.parent;
                }
            }
            return this.getItem(this.input);
        }
        getNavigator(element = null, subTreeOnly = true) {
            return new TreeNavigator(this.getItem(element), subTreeOnly);
        }
        getItem(element = null) {
            if (element === null) {
                return this.input;
            }
            else if (element instanceof Item) {
                return element;
            }
            else if (typeof element === 'string') {
                return this.registry.getItem(element);
            }
            else {
                return this.registry.getItem(this.context.dataSource.getId(this.context.tree, element));
            }
        }
        addTraits(trait, elements) {
            let items = this.traitsToItems[trait] || {};
            let item;
            for (let i = 0, len = elements.length; i < len; i++) {
                item = this.getItem(elements[i]);
                if (item) {
                    item.addTrait(trait);
                    items[item.id] = item;
                }
            }
            this.traitsToItems[trait] = items;
        }
        removeTraits(trait, elements) {
            let items = this.traitsToItems[trait] || {};
            let item;
            let id;
            if (elements.length === 0) {
                for (id in items) {
                    if (items.hasOwnProperty(id)) {
                        item = items[id];
                        item.removeTrait(trait);
                    }
                }
                delete this.traitsToItems[trait];
            }
            else {
                for (let i = 0, len = elements.length; i < len; i++) {
                    item = this.getItem(elements[i]);
                    if (item) {
                        item.removeTrait(trait);
                        delete items[item.id];
                    }
                }
            }
        }
        setTraits(trait, elements) {
            if (elements.length === 0) {
                this.removeTraits(trait, elements);
            }
            else {
                let items = {};
                let item;
                for (let i = 0, len = elements.length; i < len; i++) {
                    item = this.getItem(elements[i]);
                    if (item) {
                        items[item.id] = item;
                    }
                }
                let traitItems = this.traitsToItems[trait] || {};
                let itemsToRemoveTrait = [];
                let id;
                for (id in traitItems) {
                    if (traitItems.hasOwnProperty(id)) {
                        if (items.hasOwnProperty(id)) {
                            delete items[id];
                        }
                        else {
                            itemsToRemoveTrait.push(traitItems[id]);
                        }
                    }
                }
                for (let i = 0, len = itemsToRemoveTrait.length; i < len; i++) {
                    item = itemsToRemoveTrait[i];
                    item.removeTrait(trait);
                    delete traitItems[item.id];
                }
                for (id in items) {
                    if (items.hasOwnProperty(id)) {
                        item = items[id];
                        item.addTrait(trait);
                        traitItems[id] = item;
                    }
                }
                this.traitsToItems[trait] = traitItems;
            }
        }
        getElementsWithTrait(trait, includeHidden) {
            let elements = [];
            let items = this.traitsToItems[trait] || {};
            let id;
            for (id in items) {
                if (items.hasOwnProperty(id) && (items[id].isVisible() || includeHidden)) {
                    elements.push(items[id].getElement());
                }
            }
            return elements;
        }
        dispose() {
            this.registry.dispose();
            this._onSetInput.dispose();
            this._onDidSetInput.dispose();
            this._onRefresh.dispose();
            this._onDidRefresh.dispose();
            this._onDidHighlight.dispose();
            this._onDidSelect.dispose();
            this._onDidFocus.dispose();
            this._onDidRevealItem.dispose();
            this._onExpandItem.dispose();
            this._onDidExpandItem.dispose();
            this._onCollapseItem.dispose();
            this._onDidCollapseItem.dispose();
            this._onDidAddTraitItem.dispose();
            this._onDidRemoveTraitItem.dispose();
            this._onDidRefreshItem.dispose();
            this._onRefreshItemChildren.dispose();
            this._onDidRefreshItemChildren.dispose();
            this._onDidDisposeItem.dispose();
        }
    }
    exports.TreeModel = TreeModel;
});
//# sourceMappingURL=treeModel.js.map