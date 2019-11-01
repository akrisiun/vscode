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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/log/common/log", "vs/platform/environment/common/environment", "vs/base/parts/storage/node/storage", "vs/base/parts/storage/common/storage", "vs/base/common/path"], function (require, exports, instantiation_1, event_1, lifecycle_1, log_1, environment_1, storage_1, storage_2, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IStorageMainService = instantiation_1.createDecorator('storageMainService');
    let StorageMainService = class StorageMainService extends lifecycle_1.Disposable {
        constructor(logService, environmentService) {
            super();
            this.logService = logService;
            this.environmentService = environmentService;
            this._onDidChangeStorage = this._register(new event_1.Emitter());
            this.onDidChangeStorage = this._onDidChangeStorage.event;
            this._onWillSaveState = this._register(new event_1.Emitter());
            this.onWillSaveState = this._onWillSaveState.event;
            // Until the storage has been initialized, it can only be in memory
            this.storage = new storage_2.Storage(new storage_2.InMemoryStorageDatabase());
        }
        get items() { return this.storage.items; }
        get storagePath() {
            if (!!this.environmentService.extensionTestsLocationURI) {
                return storage_1.SQLiteStorageDatabase.IN_MEMORY_PATH; // no storage during extension tests!
            }
            return path_1.join(this.environmentService.globalStorageHome, StorageMainService.STORAGE_NAME);
        }
        createLogginOptions() {
            return {
                logTrace: (this.logService.getLevel() === log_1.LogLevel.Trace) ? msg => this.logService.trace(msg) : undefined,
                logError: error => this.logService.error(error)
            };
        }
        initialize() {
            if (!this.initializePromise) {
                this.initializePromise = this.doInitialize();
            }
            return this.initializePromise;
        }
        doInitialize() {
            this.storage.dispose();
            this.storage = new storage_2.Storage(new storage_1.SQLiteStorageDatabase(this.storagePath, {
                logging: this.createLogginOptions()
            }));
            this._register(this.storage.onDidChangeStorage(key => this._onDidChangeStorage.fire({ key })));
            return this.storage.init();
        }
        get(key, fallbackValue) {
            return this.storage.get(key, fallbackValue);
        }
        getBoolean(key, fallbackValue) {
            return this.storage.getBoolean(key, fallbackValue);
        }
        getNumber(key, fallbackValue) {
            return this.storage.getNumber(key, fallbackValue);
        }
        store(key, value) {
            return this.storage.set(key, value);
        }
        remove(key) {
            return this.storage.delete(key);
        }
        close() {
            // Signal as event so that clients can still store data
            this._onWillSaveState.fire();
            // Do it
            return this.storage.close();
        }
    };
    StorageMainService.STORAGE_NAME = 'state.vscdb';
    StorageMainService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, environment_1.IEnvironmentService)
    ], StorageMainService);
    exports.StorageMainService = StorageMainService;
});
//# sourceMappingURL=storageMainService.js.map