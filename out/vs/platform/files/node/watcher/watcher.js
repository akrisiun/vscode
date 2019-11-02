/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/platform/files/common/files", "vs/base/common/platform"], function (require, exports, uri_1, files_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function toFileChanges(changes) {
        return changes.map(change => ({
            type: change.type,
            resource: uri_1.URI.file(change.path)
        }));
    }
    exports.toFileChanges = toFileChanges;
    function normalizeFileChanges(changes) {
        // Build deltas
        const normalizer = new EventNormalizer();
        for (const event of changes) {
            normalizer.processEvent(event);
        }
        return normalizer.normalize();
    }
    exports.normalizeFileChanges = normalizeFileChanges;
    class EventNormalizer {
        constructor() {
            this.normalized = [];
            this.mapPathToChange = new Map();
        }
        processEvent(event) {
            const existingEvent = this.mapPathToChange.get(event.path);
            // Event path already exists
            if (existingEvent) {
                const currentChangeType = existingEvent.type;
                const newChangeType = event.type;
                // ignore CREATE followed by DELETE in one go
                if (currentChangeType === 1 /* ADDED */ && newChangeType === 2 /* DELETED */) {
                    this.mapPathToChange.delete(event.path);
                    this.normalized.splice(this.normalized.indexOf(existingEvent), 1);
                }
                // flatten DELETE followed by CREATE into CHANGE
                else if (currentChangeType === 2 /* DELETED */ && newChangeType === 1 /* ADDED */) {
                    existingEvent.type = 0 /* UPDATED */;
                }
                // Do nothing. Keep the created event
                else if (currentChangeType === 1 /* ADDED */ && newChangeType === 0 /* UPDATED */) { }
                // Otherwise apply change type
                else {
                    existingEvent.type = newChangeType;
                }
            }
            // Otherwise store new
            else {
                this.normalized.push(event);
                this.mapPathToChange.set(event.path, event);
            }
        }
        normalize() {
            const addedChangeEvents = [];
            const deletedPaths = [];
            // This algorithm will remove all DELETE events up to the root folder
            // that got deleted if any. This ensures that we are not producing
            // DELETE events for each file inside a folder that gets deleted.
            //
            // 1.) split ADD/CHANGE and DELETED events
            // 2.) sort short deleted paths to the top
            // 3.) for each DELETE, check if there is a deleted parent and ignore the event in that case
            return this.normalized.filter(e => {
                if (e.type !== 2 /* DELETED */) {
                    addedChangeEvents.push(e);
                    return false; // remove ADD / CHANGE
                }
                return true; // keep DELETE
            }).sort((e1, e2) => {
                return e1.path.length - e2.path.length; // shortest path first
            }).filter(e => {
                if (deletedPaths.some(d => files_1.isParent(e.path, d, !platform_1.isLinux /* ignorecase */))) {
                    return false; // DELETE is ignored if parent is deleted already
                }
                // otherwise mark as deleted
                deletedPaths.push(e.path);
                return true;
            }).concat(addedChangeEvents);
        }
    }
});
//# sourceMappingURL=watcher.js.map