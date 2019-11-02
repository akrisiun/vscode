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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/extpath", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/map", "vs/base/common/strings", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/base/common/decorators", "vs/base/common/event"], function (require, exports, uri_1, extpath_1, path_1, resources, map_1, strings_1, arrays_1, lifecycle_1, decorators_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExplorerModel {
        constructor(contextService) {
            this.contextService = contextService;
            this._onDidChangeRoots = new event_1.Emitter();
            const setRoots = () => this._roots = this.contextService.getWorkspace().folders
                .map(folder => new ExplorerItem(folder.uri, undefined, true, false, false, folder.name));
            setRoots();
            this._listener = this.contextService.onDidChangeWorkspaceFolders(() => {
                setRoots();
                this._onDidChangeRoots.fire();
            });
        }
        get roots() {
            return this._roots;
        }
        get onDidChangeRoots() {
            return this._onDidChangeRoots.event;
        }
        /**
         * Returns an array of child stat from this stat that matches with the provided path.
         * Starts matching from the first root.
         * Will return empty array in case the FileStat does not exist.
         */
        findAll(resource) {
            return arrays_1.coalesce(this.roots.map(root => root.find(resource)));
        }
        /**
         * Returns a FileStat that matches the passed resource.
         * In case multiple FileStat are matching the resource (same folder opened multiple times) returns the FileStat that has the closest root.
         * Will return undefined in case the FileStat does not exist.
         */
        findClosest(resource) {
            const folder = this.contextService.getWorkspaceFolder(resource);
            if (folder) {
                const root = this.roots.filter(r => r.resource.toString() === folder.uri.toString()).pop();
                if (root) {
                    return root.find(resource);
                }
            }
            return null;
        }
        dispose() {
            lifecycle_1.dispose(this._listener);
        }
    }
    exports.ExplorerModel = ExplorerModel;
    class ExplorerItem {
        constructor(resource, _parent, _isDirectory, _isSymbolicLink, _isReadonly, _name = resources.basenameOrAuthority(resource), _mtime) {
            this.resource = resource;
            this._parent = _parent;
            this._isDirectory = _isDirectory;
            this._isSymbolicLink = _isSymbolicLink;
            this._isReadonly = _isReadonly;
            this._name = _name;
            this._mtime = _mtime;
            this.isError = false;
            this._isDirectoryResolved = false;
        }
        get isDisposed() {
            return this._isDisposed;
        }
        get isDirectoryResolved() {
            return this._isDirectoryResolved;
        }
        get isSymbolicLink() {
            return !!this._isSymbolicLink;
        }
        get isDirectory() {
            return !!this._isDirectory;
        }
        get isReadonly() {
            return !!this._isReadonly;
        }
        get mtime() {
            return this._mtime;
        }
        get name() {
            return this._name;
        }
        get parent() {
            return this._parent;
        }
        get root() {
            if (!this._parent) {
                return this;
            }
            return this._parent.root;
        }
        get children() {
            return new Map();
        }
        updateName(value) {
            // Re-add to parent since the parent has a name map to children and the name might have changed
            if (this._parent) {
                this._parent.removeChild(this);
            }
            this._name = value;
            if (this._parent) {
                this._parent.addChild(this);
            }
        }
        getId() {
            return this.resource.toString();
        }
        get isRoot() {
            return this === this.root;
        }
        static create(raw, parent, resolveTo) {
            const stat = new ExplorerItem(raw.resource, parent, raw.isDirectory, raw.isSymbolicLink, raw.isReadonly, raw.name, raw.mtime);
            // Recursively add children if present
            if (stat.isDirectory) {
                // isDirectoryResolved is a very important indicator in the stat model that tells if the folder was fully resolved
                // the folder is fully resolved if either it has a list of children or the client requested this by using the resolveTo
                // array of resource path to resolve.
                stat._isDirectoryResolved = !!raw.children || (!!resolveTo && resolveTo.some((r) => {
                    return resources.isEqualOrParent(r, stat.resource);
                }));
                // Recurse into children
                if (raw.children) {
                    for (let i = 0, len = raw.children.length; i < len; i++) {
                        const child = ExplorerItem.create(raw.children[i], stat, resolveTo);
                        stat.addChild(child);
                    }
                }
            }
            return stat;
        }
        /**
         * Merges the stat which was resolved from the disk with the local stat by copying over properties
         * and children. The merge will only consider resolved stat elements to avoid overwriting data which
         * exists locally.
         */
        static mergeLocalWithDisk(disk, local) {
            if (disk.resource.toString() !== local.resource.toString()) {
                return; // Merging only supported for stats with the same resource
            }
            // Stop merging when a folder is not resolved to avoid loosing local data
            const mergingDirectories = disk.isDirectory || local.isDirectory;
            if (mergingDirectories && local._isDirectoryResolved && !disk._isDirectoryResolved) {
                return;
            }
            // Properties
            local.resource = disk.resource;
            local.updateName(disk.name);
            local._isDirectory = disk.isDirectory;
            local._mtime = disk.mtime;
            local._isDirectoryResolved = disk._isDirectoryResolved;
            local._isSymbolicLink = disk.isSymbolicLink;
            local._isReadonly = disk.isReadonly;
            local.isError = disk.isError;
            // Merge Children if resolved
            if (mergingDirectories && disk._isDirectoryResolved) {
                // Map resource => stat
                const oldLocalChildren = new map_1.ResourceMap();
                local.children.forEach(child => {
                    oldLocalChildren.set(child.resource, child);
                });
                // Clear current children
                local.children.clear();
                // Merge received children
                disk.children.forEach(diskChild => {
                    const formerLocalChild = oldLocalChildren.get(diskChild.resource);
                    // Existing child: merge
                    if (formerLocalChild) {
                        ExplorerItem.mergeLocalWithDisk(diskChild, formerLocalChild);
                        local.addChild(formerLocalChild);
                        oldLocalChildren.delete(diskChild.resource);
                    }
                    // New child: add
                    else {
                        local.addChild(diskChild);
                    }
                });
                for (let child of oldLocalChildren.values()) {
                    child._dispose();
                }
            }
        }
        /**
         * Adds a child element to this folder.
         */
        addChild(child) {
            // Inherit some parent properties to child
            child._parent = this;
            child.updateResource(false);
            this.children.set(this.getPlatformAwareName(child.name), child);
        }
        getChild(name) {
            return this.children.get(this.getPlatformAwareName(name));
        }
        async fetchChildren(fileService, explorerService) {
            if (!this._isDirectoryResolved) {
                // Resolve metadata only when the mtime is needed since this can be expensive
                // Mtime is only used when the sort order is 'modified'
                const resolveMetadata = explorerService.sortOrder === 'modified';
                try {
                    const stat = await fileService.resolve(this.resource, { resolveSingleChildDescendants: true, resolveMetadata });
                    const resolved = ExplorerItem.create(stat, this);
                    ExplorerItem.mergeLocalWithDisk(resolved, this);
                }
                catch (e) {
                    this.isError = true;
                    throw e;
                }
                this._isDirectoryResolved = true;
            }
            const items = [];
            this.children.forEach(child => {
                items.push(child);
            });
            return items;
        }
        /**
         * Removes a child element from this folder.
         */
        removeChild(child) {
            this.children.delete(this.getPlatformAwareName(child.name));
        }
        forgetChildren() {
            for (let c of this.children.values()) {
                c._dispose();
            }
            this.children.clear();
            this._isDirectoryResolved = false;
        }
        _dispose() {
            this._isDisposed = true;
            for (let child of this.children.values()) {
                child._dispose();
            }
        }
        getPlatformAwareName(name) {
            return (!name || !resources.hasToIgnoreCase(this.resource)) ? name : name.toLowerCase();
        }
        /**
         * Moves this element under a new parent element.
         */
        move(newParent) {
            if (this._parent) {
                this._parent.removeChild(this);
            }
            newParent.removeChild(this); // make sure to remove any previous version of the file if any
            newParent.addChild(this);
            this.updateResource(true);
        }
        updateResource(recursive) {
            if (this._parent) {
                this.resource = resources.joinPath(this._parent.resource, this.name);
            }
            if (recursive) {
                if (this.isDirectory) {
                    this.children.forEach(child => {
                        child.updateResource(true);
                    });
                }
            }
        }
        /**
         * Tells this stat that it was renamed. This requires changes to all children of this stat (if any)
         * so that the path property can be updated properly.
         */
        rename(renamedStat) {
            // Merge a subset of Properties that can change on rename
            this.updateName(renamedStat.name);
            this._mtime = renamedStat.mtime;
            // Update Paths including children
            this.updateResource(true);
        }
        /**
         * Returns a child stat from this stat that matches with the provided path.
         * Will return "null" in case the child does not exist.
         */
        find(resource) {
            // Return if path found
            // For performance reasons try to do the comparison as fast as possible
            if (resource && this.resource.scheme === resource.scheme && strings_1.equalsIgnoreCase(this.resource.authority, resource.authority) &&
                (resources.hasToIgnoreCase(resource) ? strings_1.startsWithIgnoreCase(resource.path, this.resource.path) : strings_1.startsWith(resource.path, this.resource.path))) {
                return this.findByPath(strings_1.rtrim(resource.path, path_1.posix.sep), this.resource.path.length);
            }
            return null; //Unable to find
        }
        findByPath(path, index) {
            if (extpath_1.isEqual(strings_1.rtrim(this.resource.path, path_1.posix.sep), path, resources.hasToIgnoreCase(this.resource))) {
                return this;
            }
            if (this.isDirectory) {
                // Ignore separtor to more easily deduct the next name to search
                while (index < path.length && path[index] === path_1.posix.sep) {
                    index++;
                }
                let indexOfNextSep = path.indexOf(path_1.posix.sep, index);
                if (indexOfNextSep === -1) {
                    // If there is no separator take the remainder of the path
                    indexOfNextSep = path.length;
                }
                // The name to search is between two separators
                const name = path.substring(index, indexOfNextSep);
                const child = this.children.get(this.getPlatformAwareName(name));
                if (child) {
                    // We found a child with the given name, search inside it
                    return child.findByPath(path, indexOfNextSep);
                }
            }
            return null;
        }
    }
    __decorate([
        decorators_1.memoize
    ], ExplorerItem.prototype, "children", null);
    exports.ExplorerItem = ExplorerItem;
    class NewExplorerItem extends ExplorerItem {
        constructor(parent, isDirectory) {
            super(uri_1.URI.file(''), parent, isDirectory);
        }
    }
    exports.NewExplorerItem = NewExplorerItem;
});
//# sourceMappingURL=explorerModel.js.map