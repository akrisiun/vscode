/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/network", "vs/base/common/types", "vs/base/common/event", "./markers"], function (require, exports, arrays_1, network_1, types_1, event_1, markers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var MapMap;
    (function (MapMap) {
        function get(map, key1, key2) {
            if (map[key1]) {
                return map[key1][key2];
            }
            return undefined;
        }
        MapMap.get = get;
        function set(map, key1, key2, value) {
            if (!map[key1]) {
                map[key1] = Object.create(null);
            }
            map[key1][key2] = value;
        }
        MapMap.set = set;
        function remove(map, key1, key2) {
            if (map[key1] && map[key1][key2]) {
                delete map[key1][key2];
                if (types_1.isEmptyObject(map[key1])) {
                    delete map[key1];
                }
                return true;
            }
            return false;
        }
        MapMap.remove = remove;
    })(MapMap || (MapMap = {}));
    class MarkerStats {
        constructor(service) {
            this.errors = 0;
            this.infos = 0;
            this.warnings = 0;
            this.unknowns = 0;
            this._data = Object.create(null);
            this._service = service;
            this._subscription = service.onMarkerChanged(this._update, this);
        }
        dispose() {
            this._subscription.dispose();
            this._data = undefined;
        }
        _update(resources) {
            if (!this._data) {
                return;
            }
            for (const resource of resources) {
                const key = resource.toString();
                const oldStats = this._data[key];
                if (oldStats) {
                    this._substract(oldStats);
                }
                const newStats = this._resourceStats(resource);
                this._add(newStats);
                this._data[key] = newStats;
            }
        }
        _resourceStats(resource) {
            const result = { errors: 0, warnings: 0, infos: 0, unknowns: 0 };
            // TODO this is a hack
            if (resource.scheme === network_1.Schemas.inMemory || resource.scheme === network_1.Schemas.walkThrough || resource.scheme === network_1.Schemas.walkThroughSnippet) {
                return result;
            }
            for (const { severity } of this._service.read({ resource })) {
                if (severity === markers_1.MarkerSeverity.Error) {
                    result.errors += 1;
                }
                else if (severity === markers_1.MarkerSeverity.Warning) {
                    result.warnings += 1;
                }
                else if (severity === markers_1.MarkerSeverity.Info) {
                    result.infos += 1;
                }
                else {
                    result.unknowns += 1;
                }
            }
            return result;
        }
        _substract(op) {
            this.errors -= op.errors;
            this.warnings -= op.warnings;
            this.infos -= op.infos;
            this.unknowns -= op.unknowns;
        }
        _add(op) {
            this.errors += op.errors;
            this.warnings += op.warnings;
            this.infos += op.infos;
            this.unknowns += op.unknowns;
        }
    }
    class MarkerService {
        constructor() {
            this._onMarkerChanged = new event_1.Emitter();
            this._onMarkerChangedEvent = event_1.Event.debounce(this._onMarkerChanged.event, MarkerService._debouncer, 0);
            this._byResource = Object.create(null);
            this._byOwner = Object.create(null);
            this._stats = new MarkerStats(this);
        }
        dispose() {
            this._stats.dispose();
        }
        get onMarkerChanged() {
            return this._onMarkerChangedEvent;
        }
        getStatistics() {
            return this._stats;
        }
        remove(owner, resources) {
            for (const resource of resources || []) {
                this.changeOne(owner, resource, []);
            }
        }
        changeOne(owner, resource, markerData) {
            if (arrays_1.isFalsyOrEmpty(markerData)) {
                // remove marker for this (owner,resource)-tuple
                const a = MapMap.remove(this._byResource, resource.toString(), owner);
                const b = MapMap.remove(this._byOwner, owner, resource.toString());
                if (a !== b) {
                    throw new Error('invalid marker service state');
                }
                if (a && b) {
                    this._onMarkerChanged.fire([resource]);
                }
            }
            else {
                // insert marker for this (owner,resource)-tuple
                const markers = [];
                for (const data of markerData) {
                    const marker = MarkerService._toMarker(owner, resource, data);
                    if (marker) {
                        markers.push(marker);
                    }
                }
                MapMap.set(this._byResource, resource.toString(), owner, markers);
                MapMap.set(this._byOwner, owner, resource.toString(), markers);
                this._onMarkerChanged.fire([resource]);
            }
        }
        static _toMarker(owner, resource, data) {
            let { code, severity, message, source, startLineNumber, startColumn, endLineNumber, endColumn, relatedInformation, tags, } = data;
            if (!message) {
                return undefined;
            }
            // santize data
            startLineNumber = startLineNumber > 0 ? startLineNumber : 1;
            startColumn = startColumn > 0 ? startColumn : 1;
            endLineNumber = endLineNumber >= startLineNumber ? endLineNumber : startLineNumber;
            endColumn = endColumn > 0 ? endColumn : startColumn;
            return {
                resource,
                owner,
                code,
                severity,
                message,
                source,
                startLineNumber,
                startColumn,
                endLineNumber,
                endColumn,
                relatedInformation,
                tags,
            };
        }
        changeAll(owner, data) {
            const changes = [];
            const map = this._byOwner[owner];
            // remove old marker
            if (map) {
                delete this._byOwner[owner];
                for (const resource in map) {
                    const entry = MapMap.get(this._byResource, resource, owner);
                    if (entry) {
                        // remeber what we remove
                        const [first] = entry;
                        if (first) {
                            changes.push(first.resource);
                        }
                        // actual remove
                        MapMap.remove(this._byResource, resource, owner);
                    }
                }
            }
            // add new markers
            if (arrays_1.isNonEmptyArray(data)) {
                // group by resource
                const groups = Object.create(null);
                for (const { resource, marker: markerData } of data) {
                    const marker = MarkerService._toMarker(owner, resource, markerData);
                    if (!marker) {
                        // filter bad markers
                        continue;
                    }
                    const array = groups[resource.toString()];
                    if (!array) {
                        groups[resource.toString()] = [marker];
                        changes.push(resource);
                    }
                    else {
                        array.push(marker);
                    }
                }
                // insert all
                for (const resource in groups) {
                    MapMap.set(this._byResource, resource, owner, groups[resource]);
                    MapMap.set(this._byOwner, owner, resource, groups[resource]);
                }
            }
            if (changes.length > 0) {
                this._onMarkerChanged.fire(changes);
            }
        }
        read(filter = Object.create(null)) {
            let { owner, resource, severities, take } = filter;
            if (!take || take < 0) {
                take = -1;
            }
            if (owner && resource) {
                // exactly one owner AND resource
                const data = MapMap.get(this._byResource, resource.toString(), owner);
                if (!data) {
                    return [];
                }
                else {
                    const result = [];
                    for (const marker of data) {
                        if (MarkerService._accept(marker, severities)) {
                            const newLen = result.push(marker);
                            if (take > 0 && newLen === take) {
                                break;
                            }
                        }
                    }
                    return result;
                }
            }
            else if (!owner && !resource) {
                // all
                const result = [];
                for (const key1 in this._byResource) {
                    for (const key2 in this._byResource[key1]) {
                        for (const data of this._byResource[key1][key2]) {
                            if (MarkerService._accept(data, severities)) {
                                const newLen = result.push(data);
                                if (take > 0 && newLen === take) {
                                    return result;
                                }
                            }
                        }
                    }
                }
                return result;
            }
            else {
                // of one resource OR owner
                const map = owner
                    ? this._byOwner[owner]
                    : resource ? this._byResource[resource.toString()] : undefined;
                if (!map) {
                    return [];
                }
                const result = [];
                for (const key in map) {
                    for (const data of map[key]) {
                        if (MarkerService._accept(data, severities)) {
                            const newLen = result.push(data);
                            if (take > 0 && newLen === take) {
                                return result;
                            }
                        }
                    }
                }
                return result;
            }
        }
        static _accept(marker, severities) {
            return severities === undefined || (severities & marker.severity) === marker.severity;
        }
        static _debouncer(last, event) {
            if (!last) {
                MarkerService._dedupeMap = Object.create(null);
                last = [];
            }
            for (const uri of event) {
                if (MarkerService._dedupeMap[uri.toString()] === undefined) {
                    MarkerService._dedupeMap[uri.toString()] = true;
                    last.push(uri);
                }
            }
            return last;
        }
    }
    exports.MarkerService = MarkerService;
});
//# sourceMappingURL=markerService.js.map