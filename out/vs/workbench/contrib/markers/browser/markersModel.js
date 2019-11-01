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
define(["require", "exports", "vs/base/common/resources", "vs/editor/common/core/range", "vs/platform/markers/common/markers", "vs/base/common/arrays", "vs/base/common/map", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/hash", "vs/base/common/types"], function (require, exports, resources_1, range_1, markers_1, arrays_1, map_1, decorators_1, event_1, hash_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function compareUris(a, b) {
        const astr = a.toString();
        const bstr = b.toString();
        return astr === bstr ? 0 : (astr < bstr ? -1 : 1);
    }
    function compareMarkersByUri(a, b) {
        return compareUris(a.resource, b.resource);
    }
    exports.compareMarkersByUri = compareMarkersByUri;
    function compareResourceMarkers(a, b) {
        let [firstMarkerOfA] = a.markers;
        let [firstMarkerOfB] = b.markers;
        let res = 0;
        if (firstMarkerOfA && firstMarkerOfB) {
            res = markers_1.MarkerSeverity.compare(firstMarkerOfA.marker.severity, firstMarkerOfB.marker.severity);
        }
        if (res === 0) {
            res = a.path.localeCompare(b.path) || a.name.localeCompare(b.name);
        }
        return res;
    }
    function compareMarkers(a, b) {
        return markers_1.MarkerSeverity.compare(a.marker.severity, b.marker.severity)
            || range_1.Range.compareRangesUsingStarts(a.marker, b.marker);
    }
    class ResourceMarkers {
        constructor(id, resource, markers) {
            this.id = id;
            this.resource = resource;
            this.markers = markers;
        }
        get path() { return this.resource.fsPath; }
        get name() { return resources_1.basename(this.resource); }
    }
    __decorate([
        decorators_1.memoize
    ], ResourceMarkers.prototype, "path", null);
    __decorate([
        decorators_1.memoize
    ], ResourceMarkers.prototype, "name", null);
    exports.ResourceMarkers = ResourceMarkers;
    class Marker {
        constructor(id, marker, relatedInformation = []) {
            this.id = id;
            this.marker = marker;
            this.relatedInformation = relatedInformation;
        }
        get resource() { return this.marker.resource; }
        get range() { return this.marker; }
        get lines() {
            if (!this._lines) {
                this._lines = this.marker.message.split(/\r\n|\r|\n/g);
            }
            return this._lines;
        }
        toString() {
            return JSON.stringify(Object.assign(Object.assign({}, this.marker), { resource: this.marker.resource.path, relatedInformation: this.relatedInformation.length ? this.relatedInformation.map(r => (Object.assign(Object.assign({}, r.raw), { resource: r.raw.resource.path }))) : undefined }), null, '\t');
        }
    }
    exports.Marker = Marker;
    class RelatedInformation {
        constructor(id, marker, raw) {
            this.id = id;
            this.marker = marker;
            this.raw = raw;
        }
    }
    exports.RelatedInformation = RelatedInformation;
    class MarkersModel {
        constructor() {
            this.cachedSortedResources = undefined;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this.resourcesByUri = new Map();
        }
        get resourceMarkers() {
            if (!this.cachedSortedResources) {
                this.cachedSortedResources = map_1.values(this.resourcesByUri).sort(compareResourceMarkers);
            }
            return this.cachedSortedResources;
        }
        getResourceMarkers(resource) {
            return types_1.withUndefinedAsNull(this.resourcesByUri.get(resource.toString()));
        }
        setResourceMarkers(resourcesMarkers) {
            const change = { added: [], removed: [], updated: [] };
            for (const [resource, rawMarkers] of resourcesMarkers) {
                let resourceMarkers = this.resourcesByUri.get(resource.toString());
                if (arrays_1.isFalsyOrEmpty(rawMarkers)) {
                    if (resourceMarkers) {
                        this.resourcesByUri.delete(resource.toString());
                        change.removed.push(resourceMarkers);
                    }
                }
                else {
                    const resourceMarkersId = this.id(resource.toString());
                    const markersCountByKey = new Map();
                    const markers = arrays_1.mergeSort(rawMarkers.map((rawMarker) => {
                        const key = markers_1.IMarkerData.makeKey(rawMarker);
                        const index = markersCountByKey.get(key) || 0;
                        markersCountByKey.set(key, index + 1);
                        const markerId = this.id(resourceMarkersId, key, index);
                        let relatedInformation = undefined;
                        if (rawMarker.relatedInformation) {
                            relatedInformation = rawMarker.relatedInformation.map((r, index) => new RelatedInformation(this.id(markerId, r.resource.toString(), r.startLineNumber, r.startColumn, r.endLineNumber, r.endColumn, index), rawMarker, r));
                        }
                        return new Marker(markerId, rawMarker, relatedInformation);
                    }), compareMarkers);
                    if (resourceMarkers) {
                        resourceMarkers.markers = markers;
                        change.updated.push(resourceMarkers);
                    }
                    else {
                        resourceMarkers = new ResourceMarkers(resourceMarkersId, resource, markers);
                        change.added.push(resourceMarkers);
                    }
                    this.resourcesByUri.set(resource.toString(), resourceMarkers);
                }
            }
            this.cachedSortedResources = undefined;
            if (change.added.length || change.removed.length || change.updated.length) {
                this._onDidChange.fire(change);
            }
        }
        id(...values) {
            const hasher = new hash_1.Hasher();
            for (const value of values) {
                hasher.hash(value);
            }
            return `${hasher.value}`;
        }
        dispose() {
            this._onDidChange.dispose();
            this.resourcesByUri.clear();
        }
    }
    exports.MarkersModel = MarkersModel;
});
//# sourceMappingURL=markersModel.js.map