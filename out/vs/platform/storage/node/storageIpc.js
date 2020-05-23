/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uuid", "vs/platform/telemetry/common/telemetry"], function (require, exports, event_1, lifecycle_1, uuid_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GlobalStorageDatabaseChannelClient = exports.GlobalStorageDatabaseChannel = void 0;
    let GlobalStorageDatabaseChannel = /** @class */ (() => {
        class GlobalStorageDatabaseChannel extends lifecycle_1.Disposable {
            constructor(logService, storageMainService) {
                super();
                this.logService = logService;
                this.storageMainService = storageMainService;
                this._onDidChangeItems = this._register(new event_1.Emitter());
                this.onDidChangeItems = this._onDidChangeItems.event;
                this.whenReady = this.init();
            }
            async init() {
                try {
                    await this.storageMainService.initialize();
                }
                catch (error) {
                    this.logService.error(`[storage] init(): Unable to init global storage due to ${error}`);
                }
                // This is unique to the application instance and thereby
                // should be written from the main process once.
                //
                // THIS SHOULD NEVER BE SENT TO TELEMETRY.
                //
                const crashReporterId = this.storageMainService.get(telemetry_1.crashReporterIdStorageKey, undefined);
                if (crashReporterId === undefined) {
                    this.storageMainService.store(telemetry_1.crashReporterIdStorageKey, uuid_1.generateUuid());
                }
                // Apply global telemetry values as part of the initialization
                // These are global across all windows and thereby should be
                // written from the main process once.
                this.initTelemetry();
                // Setup storage change listeners
                this.registerListeners();
            }
            initTelemetry() {
                const instanceId = this.storageMainService.get(telemetry_1.instanceStorageKey, undefined);
                if (instanceId === undefined) {
                    this.storageMainService.store(telemetry_1.instanceStorageKey, uuid_1.generateUuid());
                }
                const firstSessionDate = this.storageMainService.get(telemetry_1.firstSessionDateStorageKey, undefined);
                if (firstSessionDate === undefined) {
                    this.storageMainService.store(telemetry_1.firstSessionDateStorageKey, new Date().toUTCString());
                }
                const lastSessionDate = this.storageMainService.get(telemetry_1.currentSessionDateStorageKey, undefined); // previous session date was the "current" one at that time
                const currentSessionDate = new Date().toUTCString(); // current session date is "now"
                this.storageMainService.store(telemetry_1.lastSessionDateStorageKey, typeof lastSessionDate === 'undefined' ? null : lastSessionDate);
                this.storageMainService.store(telemetry_1.currentSessionDateStorageKey, currentSessionDate);
            }
            registerListeners() {
                // Listen for changes in global storage to send to listeners
                // that are listening. Use a debouncer to reduce IPC traffic.
                this._register(event_1.Event.debounce(this.storageMainService.onDidChangeStorage, (prev, cur) => {
                    if (!prev) {
                        prev = [cur];
                    }
                    else {
                        prev.push(cur);
                    }
                    return prev;
                }, GlobalStorageDatabaseChannel.STORAGE_CHANGE_DEBOUNCE_TIME)(events => {
                    if (events.length) {
                        this._onDidChangeItems.fire(this.serializeEvents(events));
                    }
                }));
            }
            serializeEvents(events) {
                const changed = new Map();
                const deleted = new Set();
                events.forEach(event => {
                    const existing = this.storageMainService.get(event.key);
                    if (typeof existing === 'string') {
                        changed.set(event.key, existing);
                    }
                    else {
                        deleted.add(event.key);
                    }
                });
                return {
                    changed: Array.from(changed.entries()),
                    deleted: Array.from(deleted.values())
                };
            }
            listen(_, event) {
                switch (event) {
                    case 'onDidChangeItems': return this.onDidChangeItems;
                }
                throw new Error(`Event not found: ${event}`);
            }
            async call(_, command, arg) {
                // ensure to always wait for ready
                await this.whenReady;
                // handle call
                switch (command) {
                    case 'getItems': {
                        return Array.from(this.storageMainService.items.entries());
                    }
                    case 'updateItems': {
                        const items = arg;
                        if (items.insert) {
                            for (const [key, value] of items.insert) {
                                this.storageMainService.store(key, value);
                            }
                        }
                        if (items.delete) {
                            items.delete.forEach(key => this.storageMainService.remove(key));
                        }
                        break;
                    }
                    default:
                        throw new Error(`Call not found: ${command}`);
                }
            }
        }
        GlobalStorageDatabaseChannel.STORAGE_CHANGE_DEBOUNCE_TIME = 100;
        return GlobalStorageDatabaseChannel;
    })();
    exports.GlobalStorageDatabaseChannel = GlobalStorageDatabaseChannel;
    class GlobalStorageDatabaseChannelClient extends lifecycle_1.Disposable {
        constructor(channel) {
            super();
            this.channel = channel;
            this._onDidChangeItemsExternal = this._register(new event_1.Emitter());
            this.onDidChangeItemsExternal = this._onDidChangeItemsExternal.event;
            this.registerListeners();
        }
        registerListeners() {
            this.onDidChangeItemsOnMainListener = this.channel.listen('onDidChangeItems')((e) => this.onDidChangeItemsOnMain(e));
        }
        onDidChangeItemsOnMain(e) {
            if (Array.isArray(e.changed) || Array.isArray(e.deleted)) {
                this._onDidChangeItemsExternal.fire({
                    changed: e.changed ? new Map(e.changed) : undefined,
                    deleted: e.deleted ? new Set(e.deleted) : undefined
                });
            }
        }
        async getItems() {
            const items = await this.channel.call('getItems');
            return new Map(items);
        }
        updateItems(request) {
            const serializableRequest = Object.create(null);
            if (request.insert) {
                serializableRequest.insert = Array.from(request.insert.entries());
            }
            if (request.delete) {
                serializableRequest.delete = Array.from(request.delete.values());
            }
            return this.channel.call('updateItems', serializableRequest);
        }
        close() {
            // when we are about to close, we start to ignore main-side changes since we close anyway
            lifecycle_1.dispose(this.onDidChangeItemsOnMainListener);
            return Promise.resolve(); // global storage is closed on the main side
        }
        dispose() {
            super.dispose();
            lifecycle_1.dispose(this.onDidChangeItemsOnMainListener);
        }
    }
    exports.GlobalStorageDatabaseChannelClient = GlobalStorageDatabaseChannelClient;
});
//# sourceMappingURL=storageIpc.js.map