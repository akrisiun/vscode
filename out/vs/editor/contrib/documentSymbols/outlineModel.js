/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/collections", "vs/base/common/errors", "vs/base/common/map", "vs/base/common/strings", "vs/editor/common/core/range", "vs/editor/common/modes"], function (require, exports, arrays_1, cancellation_1, collections_1, errors_1, map_1, strings_1, range_1, modes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TreeElement {
        remove() {
            if (this.parent) {
                delete this.parent.children[this.id];
            }
        }
        static findId(candidate, container) {
            // complex id-computation which contains the origin/extension,
            // the parent path, and some dedupe logic when names collide
            let candidateId;
            if (typeof candidate === 'string') {
                candidateId = `${container.id}/${candidate}`;
            }
            else {
                candidateId = `${container.id}/${candidate.name}`;
                if (container.children[candidateId] !== undefined) {
                    candidateId = `${container.id}/${candidate.name}_${candidate.range.startLineNumber}_${candidate.range.startColumn}`;
                }
            }
            let id = candidateId;
            for (let i = 0; container.children[id] !== undefined; i++) {
                id = `${candidateId}_${i}`;
            }
            return id;
        }
        static getElementById(id, element) {
            if (!id) {
                return undefined;
            }
            let len = strings_1.commonPrefixLength(id, element.id);
            if (len === id.length) {
                return element;
            }
            if (len < element.id.length) {
                return undefined;
            }
            for (const key in element.children) {
                let candidate = TreeElement.getElementById(id, element.children[key]);
                if (candidate) {
                    return candidate;
                }
            }
            return undefined;
        }
        static size(element) {
            let res = 1;
            for (const key in element.children) {
                res += TreeElement.size(element.children[key]);
            }
            return res;
        }
        static empty(element) {
            for (const _key in element.children) {
                return false;
            }
            return true;
        }
    }
    exports.TreeElement = TreeElement;
    class OutlineElement extends TreeElement {
        constructor(id, parent, symbol) {
            super();
            this.id = id;
            this.parent = parent;
            this.symbol = symbol;
            this.children = Object.create(null);
        }
        adopt(parent) {
            let res = new OutlineElement(this.id, parent, this.symbol);
            collections_1.forEach(this.children, entry => res.children[entry.key] = entry.value.adopt(res));
            return res;
        }
    }
    exports.OutlineElement = OutlineElement;
    class OutlineGroup extends TreeElement {
        constructor(id, parent, provider, providerIndex) {
            super();
            this.id = id;
            this.parent = parent;
            this.provider = provider;
            this.providerIndex = providerIndex;
            this.children = Object.create(null);
        }
        adopt(parent) {
            let res = new OutlineGroup(this.id, parent, this.provider, this.providerIndex);
            collections_1.forEach(this.children, entry => res.children[entry.key] = entry.value.adopt(res));
            return res;
        }
        getItemEnclosingPosition(position) {
            return position ? this._getItemEnclosingPosition(position, this.children) : undefined;
        }
        _getItemEnclosingPosition(position, children) {
            for (let key in children) {
                let item = children[key];
                if (!item.symbol.range || !range_1.Range.containsPosition(item.symbol.range, position)) {
                    continue;
                }
                return this._getItemEnclosingPosition(position, item.children) || item;
            }
            return undefined;
        }
        updateMarker(marker) {
            for (const key in this.children) {
                this._updateMarker(marker, this.children[key]);
            }
        }
        _updateMarker(markers, item) {
            item.marker = undefined;
            // find the proper start index to check for item/marker overlap.
            let idx = arrays_1.binarySearch(markers, item.symbol.range, range_1.Range.compareRangesUsingStarts);
            let start;
            if (idx < 0) {
                start = ~idx;
                if (start > 0 && range_1.Range.areIntersecting(markers[start - 1], item.symbol.range)) {
                    start -= 1;
                }
            }
            else {
                start = idx;
            }
            let myMarkers = [];
            let myTopSev;
            for (; start < markers.length && range_1.Range.areIntersecting(item.symbol.range, markers[start]); start++) {
                // remove markers intersecting with this outline element
                // and store them in a 'private' array.
                let marker = markers[start];
                myMarkers.push(marker);
                markers[start] = undefined;
                if (!myTopSev || marker.severity > myTopSev) {
                    myTopSev = marker.severity;
                }
            }
            // Recurse into children and let them match markers that have matched
            // this outline element. This might remove markers from this element and
            // therefore we remember that we have had markers. That allows us to render
            // the dot, saying 'this element has children with markers'
            for (const key in item.children) {
                this._updateMarker(myMarkers, item.children[key]);
            }
            if (myTopSev) {
                item.marker = {
                    count: myMarkers.length,
                    topSev: myTopSev
                };
            }
            arrays_1.coalesceInPlace(markers);
        }
    }
    exports.OutlineGroup = OutlineGroup;
    class MovingAverage {
        constructor() {
            this._n = 1;
            this._val = 0;
        }
        update(value) {
            this._val = this._val + (value - this._val) / this._n;
            this._n += 1;
            return this;
        }
        get value() {
            return this._val;
        }
    }
    class OutlineModel extends TreeElement {
        constructor(textModel) {
            super();
            this.textModel = textModel;
            this.id = 'root';
            this.parent = undefined;
            this._groups = Object.create(null);
            this.children = Object.create(null);
            this.id = 'root';
            this.parent = undefined;
        }
        static create(textModel, token) {
            let key = this._keys.for(textModel, true);
            let data = OutlineModel._requests.get(key);
            if (!data) {
                let source = new cancellation_1.CancellationTokenSource();
                data = {
                    promiseCnt: 0,
                    source,
                    promise: OutlineModel._create(textModel, source.token),
                    model: undefined,
                };
                OutlineModel._requests.set(key, data);
                // keep moving average of request durations
                const now = Date.now();
                data.promise.then(() => {
                    let key = this._keys.for(textModel, false);
                    let avg = this._requestDurations.get(key);
                    if (!avg) {
                        avg = new MovingAverage();
                        this._requestDurations.set(key, avg);
                    }
                    avg.update(Date.now() - now);
                });
            }
            if (data.model) {
                // resolved -> return data
                return Promise.resolve(data.model);
            }
            // increase usage counter
            data.promiseCnt += 1;
            token.onCancellationRequested(() => {
                // last -> cancel provider request, remove cached promise
                if (--data.promiseCnt === 0) {
                    data.source.cancel();
                    OutlineModel._requests.delete(key);
                }
            });
            return new Promise((resolve, reject) => {
                data.promise.then(model => {
                    data.model = model;
                    resolve(model);
                }, err => {
                    OutlineModel._requests.delete(key);
                    reject(err);
                });
            });
        }
        static getRequestDelay(textModel) {
            if (!textModel) {
                return 350;
            }
            const avg = this._requestDurations.get(this._keys.for(textModel, false));
            if (!avg) {
                return 350;
            }
            return Math.max(350, Math.floor(1.3 * avg.value));
        }
        static _create(textModel, token) {
            const cts = new cancellation_1.CancellationTokenSource(token);
            const result = new OutlineModel(textModel);
            const provider = modes_1.DocumentSymbolProviderRegistry.ordered(textModel);
            const promises = provider.map((provider, index) => {
                let id = TreeElement.findId(`provider_${index}`, result);
                let group = new OutlineGroup(id, result, provider, index);
                return Promise.resolve(provider.provideDocumentSymbols(result.textModel, cts.token)).then(result => {
                    for (const info of result || []) {
                        OutlineModel._makeOutlineElement(info, group);
                    }
                    return group;
                }, err => {
                    errors_1.onUnexpectedExternalError(err);
                    return group;
                }).then(group => {
                    if (!TreeElement.empty(group)) {
                        result._groups[id] = group;
                    }
                    else {
                        group.remove();
                    }
                });
            });
            const listener = modes_1.DocumentSymbolProviderRegistry.onDidChange(() => {
                const newProvider = modes_1.DocumentSymbolProviderRegistry.ordered(textModel);
                if (!arrays_1.equals(newProvider, provider)) {
                    cts.cancel();
                }
            });
            return Promise.all(promises).then(() => {
                if (cts.token.isCancellationRequested && !token.isCancellationRequested) {
                    return OutlineModel._create(textModel, token);
                }
                else {
                    return result._compact();
                }
            }).finally(() => {
                listener.dispose();
            });
        }
        static _makeOutlineElement(info, container) {
            let id = TreeElement.findId(info, container);
            let res = new OutlineElement(id, container, info);
            if (info.children) {
                for (const childInfo of info.children) {
                    OutlineModel._makeOutlineElement(childInfo, res);
                }
            }
            container.children[res.id] = res;
        }
        static get(element) {
            while (element) {
                if (element instanceof OutlineModel) {
                    return element;
                }
                element = element.parent;
            }
            return undefined;
        }
        adopt() {
            let res = new OutlineModel(this.textModel);
            collections_1.forEach(this._groups, entry => res._groups[entry.key] = entry.value.adopt(res));
            return res._compact();
        }
        _compact() {
            let count = 0;
            for (const key in this._groups) {
                let group = this._groups[key];
                if (collections_1.first(group.children) === undefined) { // empty
                    delete this._groups[key];
                }
                else {
                    count += 1;
                }
            }
            if (count !== 1) {
                //
                this.children = this._groups;
            }
            else {
                // adopt all elements of the first group
                let group = collections_1.first(this._groups);
                for (let key in group.children) {
                    let child = group.children[key];
                    child.parent = this;
                    this.children[child.id] = child;
                }
            }
            return this;
        }
        merge(other) {
            if (this.textModel.uri.toString() !== other.textModel.uri.toString()) {
                return false;
            }
            if (collections_1.size(this._groups) !== collections_1.size(other._groups)) {
                return false;
            }
            this._groups = other._groups;
            this.children = other.children;
            return true;
        }
        getItemEnclosingPosition(position, context) {
            let preferredGroup;
            if (context) {
                let candidate = context.parent;
                while (candidate && !preferredGroup) {
                    if (candidate instanceof OutlineGroup) {
                        preferredGroup = candidate;
                    }
                    candidate = candidate.parent;
                }
            }
            let result = undefined;
            for (const key in this._groups) {
                const group = this._groups[key];
                result = group.getItemEnclosingPosition(position);
                if (result && (!preferredGroup || preferredGroup === group)) {
                    break;
                }
            }
            return result;
        }
        getItemById(id) {
            return TreeElement.getElementById(id, this);
        }
        updateMarker(marker) {
            // sort markers by start range so that we can use
            // outline element starts for quicker look up
            marker.sort(range_1.Range.compareRangesUsingStarts);
            for (const key in this._groups) {
                this._groups[key].updateMarker(marker.slice(0));
            }
        }
    }
    exports.OutlineModel = OutlineModel;
    OutlineModel._requestDurations = new map_1.LRUCache(50, 0.7);
    OutlineModel._requests = new map_1.LRUCache(9, 0.75);
    OutlineModel._keys = new class {
        constructor() {
            this._counter = 1;
            this._data = new WeakMap();
        }
        for(textModel, version) {
            return `${textModel.id}/${version ? textModel.getVersionId() : ''}/${this._hash(modes_1.DocumentSymbolProviderRegistry.all(textModel))}`;
        }
        _hash(providers) {
            let result = '';
            for (const provider of providers) {
                let n = this._data.get(provider);
                if (typeof n === 'undefined') {
                    n = this._counter++;
                    this._data.set(provider, n);
                }
                result += n;
            }
            return result;
        }
    };
});
//# sourceMappingURL=outlineModel.js.map