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
define(["require", "exports", "vs/base/common/decorators", "vs/base/common/path", "vs/base/common/iterator", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/collections", "vs/base/common/map"], function (require, exports, decorators_1, paths, iterator_1, resources_1, uri_1, collections_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Internals
    class Node {
        constructor(uri, relativePath, context) {
            this.uri = uri;
            this.relativePath = relativePath;
            this.context = context;
        }
        get name() { return paths.posix.basename(this.relativePath); }
    }
    __decorate([
        decorators_1.memoize
    ], Node.prototype, "name", null);
    class BranchNode extends Node {
        constructor(uri, relativePath, context, parent = undefined) {
            super(uri, relativePath, context);
            this.parent = parent;
            this._children = new Map();
        }
        get size() {
            return this._children.size;
        }
        get children() {
            return iterator_1.Iterator.fromArray(collections_1.mapValues(this._children));
        }
        get(path) {
            return this._children.get(path);
        }
        set(path, child) {
            this._children.set(path, child);
        }
        delete(path) {
            this._children.delete(path);
        }
        clear() {
            this._children.clear();
        }
    }
    class LeafNode extends Node {
        constructor(uri, path, context, element) {
            super(uri, path, context);
            this.element = element;
        }
    }
    function collect(node, result) {
        if (ResourceTree.isBranchNode(node)) {
            iterator_1.Iterator.forEach(node.children, child => collect(child, result));
        }
        else {
            result.push(node.element);
        }
        return result;
    }
    class ResourceTree {
        constructor(context, rootURI = uri_1.URI.file('/')) {
            this.root = new BranchNode(rootURI, '', context);
        }
        static isBranchNode(obj) {
            return obj instanceof BranchNode;
        }
        static getRoot(node) {
            while (node.parent) {
                node = node.parent;
            }
            return node;
        }
        static collect(node) {
            return collect(node, []);
        }
        add(uri, element) {
            const key = resources_1.relativePath(this.root.uri, uri) || uri.fsPath;
            const iterator = new map_1.PathIterator(false).reset(key);
            let node = this.root;
            let path = '';
            while (true) {
                const name = iterator.value();
                path = path + '/' + name;
                let child = node.get(name);
                if (!child) {
                    if (iterator.hasNext()) {
                        child = new BranchNode(resources_1.joinPath(this.root.uri, path), path, this.root.context, node);
                        node.set(name, child);
                    }
                    else {
                        child = new LeafNode(uri, path, this.root.context, element);
                        node.set(name, child);
                        return;
                    }
                }
                if (!(child instanceof BranchNode)) {
                    if (iterator.hasNext()) {
                        throw new Error('Inconsistent tree: can\'t override leaf with branch.');
                    }
                    // replace
                    node.set(name, new LeafNode(uri, path, this.root.context, element));
                    return;
                }
                else if (!iterator.hasNext()) {
                    throw new Error('Inconsistent tree: can\'t override branch with leaf.');
                }
                node = child;
                if (!iterator.hasNext()) {
                    return;
                }
                iterator.next();
            }
        }
        delete(uri) {
            const key = resources_1.relativePath(this.root.uri, uri) || uri.fsPath;
            const iterator = new map_1.PathIterator(false).reset(key);
            return this._delete(this.root, iterator);
        }
        _delete(node, iterator) {
            const name = iterator.value();
            const child = node.get(name);
            if (!child) {
                return undefined;
            }
            // not at end
            if (iterator.hasNext()) {
                if (child instanceof BranchNode) {
                    const result = this._delete(child, iterator.next());
                    if (typeof result !== 'undefined' && child.size === 0) {
                        node.delete(name);
                    }
                    return result;
                }
                else {
                    throw new Error('Inconsistent tree: Expected a branch, found a leaf instead.');
                }
            }
            //at end
            if (child instanceof BranchNode) {
                // TODO: maybe we can allow this
                throw new Error('Inconsistent tree: Expected a leaf, found a branch instead.');
            }
            node.delete(name);
            return child.element;
        }
        clear() {
            this.root.clear();
        }
    }
    exports.ResourceTree = ResourceTree;
});
//# sourceMappingURL=resourceTree.js.map