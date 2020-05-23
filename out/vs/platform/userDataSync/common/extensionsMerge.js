/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/map", "vs/base/common/strings"], function (require, exports, map_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.merge = void 0;
    function merge(localExtensions, remoteExtensions, lastSyncExtensions, skippedExtensions, ignoredExtensions) {
        const added = [];
        const removed = [];
        const updated = [];
        if (!remoteExtensions) {
            return {
                added,
                removed,
                updated,
                remote: localExtensions.filter(({ identifier }) => ignoredExtensions.every(id => id.toLowerCase() !== identifier.id.toLowerCase()))
            };
        }
        // massage incoming extension - add disabled property
        const massageIncomingExtension = (extension) => (Object.assign(Object.assign({}, extension), { disabled: !!extension.disabled }));
        localExtensions = localExtensions.map(massageIncomingExtension);
        remoteExtensions = remoteExtensions.map(massageIncomingExtension);
        lastSyncExtensions = lastSyncExtensions ? lastSyncExtensions.map(massageIncomingExtension) : null;
        const uuids = new Map();
        const addUUID = (identifier) => { if (identifier.uuid) {
            uuids.set(identifier.id.toLowerCase(), identifier.uuid);
        } };
        localExtensions.forEach(({ identifier }) => addUUID(identifier));
        remoteExtensions.forEach(({ identifier }) => addUUID(identifier));
        if (lastSyncExtensions) {
            lastSyncExtensions.forEach(({ identifier }) => addUUID(identifier));
        }
        const getKey = (extension) => {
            const uuid = extension.identifier.uuid || uuids.get(extension.identifier.id.toLowerCase());
            return uuid ? `uuid:${uuid}` : `id:${extension.identifier.id.toLowerCase()}`;
        };
        const addExtensionToMap = (map, extension) => {
            map.set(getKey(extension), extension);
            return map;
        };
        const localExtensionsMap = localExtensions.reduce(addExtensionToMap, new Map());
        const remoteExtensionsMap = remoteExtensions.reduce(addExtensionToMap, new Map());
        const newRemoteExtensionsMap = remoteExtensions.reduce(addExtensionToMap, new Map());
        const lastSyncExtensionsMap = lastSyncExtensions ? lastSyncExtensions.reduce(addExtensionToMap, new Map()) : null;
        const skippedExtensionsMap = skippedExtensions.reduce(addExtensionToMap, new Map());
        const ignoredExtensionsSet = ignoredExtensions.reduce((set, id) => {
            const uuid = uuids.get(id.toLowerCase());
            return set.add(uuid ? `uuid:${uuid}` : `id:${id.toLowerCase()}`);
        }, new Set());
        const localToRemote = compare(localExtensionsMap, remoteExtensionsMap, ignoredExtensionsSet);
        if (localToRemote.added.size === 0 && localToRemote.removed.size === 0 && localToRemote.updated.size === 0) {
            // No changes found between local and remote.
            return { added: [], removed: [], updated: [], remote: null };
        }
        const baseToLocal = compare(lastSyncExtensionsMap, localExtensionsMap, ignoredExtensionsSet);
        const baseToRemote = compare(lastSyncExtensionsMap, remoteExtensionsMap, ignoredExtensionsSet);
        // massage outgoing extension - remove disabled property
        const massageOutgoingExtension = (extension, key) => {
            const massagedExtension = {
                identifier: {
                    id: extension.identifier.id,
                    uuid: strings_1.startsWith(key, 'uuid:') ? key.substring('uuid:'.length) : undefined
                },
            };
            if (extension.disabled) {
                massagedExtension.disabled = true;
            }
            if (extension.version) {
                massagedExtension.version = extension.version;
            }
            return massagedExtension;
        };
        // Remotely removed extension.
        for (const key of map_1.values(baseToRemote.removed)) {
            const e = localExtensionsMap.get(key);
            if (e) {
                removed.push(e.identifier);
            }
        }
        // Remotely added extension
        for (const key of map_1.values(baseToRemote.added)) {
            // Got added in local
            if (baseToLocal.added.has(key)) {
                // Is different from local to remote
                if (localToRemote.updated.has(key)) {
                    updated.push(massageOutgoingExtension(remoteExtensionsMap.get(key), key));
                }
            }
            else {
                // Add to local
                added.push(massageOutgoingExtension(remoteExtensionsMap.get(key), key));
            }
        }
        // Remotely updated extensions
        for (const key of map_1.values(baseToRemote.updated)) {
            // Update in local always
            updated.push(massageOutgoingExtension(remoteExtensionsMap.get(key), key));
        }
        // Locally added extensions
        for (const key of map_1.values(baseToLocal.added)) {
            // Not there in remote
            if (!baseToRemote.added.has(key)) {
                newRemoteExtensionsMap.set(key, localExtensionsMap.get(key));
            }
        }
        // Locally updated extensions
        for (const key of map_1.values(baseToLocal.updated)) {
            // If removed in remote
            if (baseToRemote.removed.has(key)) {
                continue;
            }
            // If not updated in remote
            if (!baseToRemote.updated.has(key)) {
                newRemoteExtensionsMap.set(key, localExtensionsMap.get(key));
            }
        }
        // Locally removed extensions
        for (const key of map_1.values(baseToLocal.removed)) {
            // If not skipped and not updated in remote
            if (!skippedExtensionsMap.has(key) && !baseToRemote.updated.has(key)) {
                newRemoteExtensionsMap.delete(key);
            }
        }
        const remote = [];
        const remoteChanges = compare(remoteExtensionsMap, newRemoteExtensionsMap, new Set());
        if (remoteChanges.added.size > 0 || remoteChanges.updated.size > 0 || remoteChanges.removed.size > 0) {
            newRemoteExtensionsMap.forEach((value, key) => remote.push(massageOutgoingExtension(value, key)));
        }
        return { added, removed, updated, remote: remote.length ? remote : null };
    }
    exports.merge = merge;
    function compare(from, to, ignoredExtensions) {
        const fromKeys = from ? map_1.keys(from).filter(key => !ignoredExtensions.has(key)) : [];
        const toKeys = map_1.keys(to).filter(key => !ignoredExtensions.has(key));
        const added = toKeys.filter(key => fromKeys.indexOf(key) === -1).reduce((r, key) => { r.add(key); return r; }, new Set());
        const removed = fromKeys.filter(key => toKeys.indexOf(key) === -1).reduce((r, key) => { r.add(key); return r; }, new Set());
        const updated = new Set();
        for (const key of fromKeys) {
            if (removed.has(key)) {
                continue;
            }
            const fromExtension = from.get(key);
            const toExtension = to.get(key);
            if (!toExtension
                || fromExtension.disabled !== toExtension.disabled
                || fromExtension.version !== toExtension.version) {
                updated.add(key);
            }
        }
        return { added, removed, updated };
    }
});
//# sourceMappingURL=extensionsMerge.js.map