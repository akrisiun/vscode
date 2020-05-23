/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/uri", "vs/base/common/lifecycle"], function (require, exports, event_1, uri_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StorageKeysSyncRegistryChannelClient = exports.StorageKeysSyncRegistryChannel = exports.UserDataSyncUtilServiceClient = exports.UserDataSycnUtilServiceChannel = exports.UserDataAutoSyncChannel = exports.UserDataSyncChannel = void 0;
    class UserDataSyncChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            switch (event) {
                case 'onDidChangeStatus': return this.service.onDidChangeStatus;
                case 'onDidChangeConflicts': return this.service.onDidChangeConflicts;
                case 'onDidChangeLocal': return this.service.onDidChangeLocal;
                case 'onDidChangeLastSyncTime': return this.service.onDidChangeLastSyncTime;
                case 'onSyncErrors': return this.service.onSyncErrors;
            }
            throw new Error(`Event not found: ${event}`);
        }
        call(context, command, args) {
            switch (command) {
                case '_getInitialData': return Promise.resolve([this.service.status, this.service.conflicts, this.service.lastSyncTime]);
                case 'pull': return this.service.pull();
                case 'sync': return this.service.sync();
                case 'stop':
                    this.service.stop();
                    return Promise.resolve();
                case 'reset': return this.service.reset();
                case 'resetLocal': return this.service.resetLocal();
                case 'isFirstTimeSyncWithMerge': return this.service.isFirstTimeSyncWithMerge();
                case 'acceptConflict': return this.service.acceptConflict(uri_1.URI.revive(args[0]), args[1]);
                case 'resolveContent': return this.service.resolveContent(uri_1.URI.revive(args[0]));
                case 'getLocalSyncResourceHandles': return this.service.getLocalSyncResourceHandles(args[0]);
                case 'getRemoteSyncResourceHandles': return this.service.getRemoteSyncResourceHandles(args[0]);
                case 'getAssociatedResources': return this.service.getAssociatedResources(args[0], { created: args[1].created, uri: uri_1.URI.revive(args[1].uri) });
            }
            throw new Error('Invalid call');
        }
    }
    exports.UserDataSyncChannel = UserDataSyncChannel;
    class UserDataAutoSyncChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            switch (event) {
                case 'onError': return this.service.onError;
            }
            throw new Error(`Event not found: ${event}`);
        }
        call(context, command, args) {
            switch (command) {
                case 'triggerAutoSync': return this.service.triggerAutoSync(args[0]);
            }
            throw new Error('Invalid call');
        }
    }
    exports.UserDataAutoSyncChannel = UserDataAutoSyncChannel;
    class UserDataSycnUtilServiceChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            throw new Error(`Event not found: ${event}`);
        }
        call(context, command, args) {
            switch (command) {
                case 'resolveDefaultIgnoredSettings': return this.service.resolveDefaultIgnoredSettings();
                case 'resolveUserKeybindings': return this.service.resolveUserBindings(args[0]);
                case 'resolveFormattingOptions': return this.service.resolveFormattingOptions(uri_1.URI.revive(args[0]));
            }
            throw new Error('Invalid call');
        }
    }
    exports.UserDataSycnUtilServiceChannel = UserDataSycnUtilServiceChannel;
    class UserDataSyncUtilServiceClient {
        constructor(channel) {
            this.channel = channel;
        }
        async resolveDefaultIgnoredSettings() {
            return this.channel.call('resolveDefaultIgnoredSettings');
        }
        async resolveUserBindings(userbindings) {
            return this.channel.call('resolveUserKeybindings', [userbindings]);
        }
        async resolveFormattingOptions(file) {
            return this.channel.call('resolveFormattingOptions', [file]);
        }
    }
    exports.UserDataSyncUtilServiceClient = UserDataSyncUtilServiceClient;
    class StorageKeysSyncRegistryChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            switch (event) {
                case 'onDidChangeStorageKeys': return this.service.onDidChangeStorageKeys;
            }
            throw new Error(`Event not found: ${event}`);
        }
        call(context, command, args) {
            switch (command) {
                case '_getInitialData': return Promise.resolve(this.service.storageKeys);
                case 'registerStorageKey': return Promise.resolve(this.service.registerStorageKey(args[0]));
            }
            throw new Error('Invalid call');
        }
    }
    exports.StorageKeysSyncRegistryChannel = StorageKeysSyncRegistryChannel;
    class StorageKeysSyncRegistryChannelClient extends lifecycle_1.Disposable {
        constructor(channel) {
            super();
            this.channel = channel;
            this._storageKeys = [];
            this._onDidChangeStorageKeys = this._register(new event_1.Emitter());
            this.onDidChangeStorageKeys = this._onDidChangeStorageKeys.event;
            this.channel.call('_getInitialData').then(storageKeys => {
                this.updateStorageKeys(storageKeys);
                this._register(this.channel.listen('onDidChangeStorageKeys')(storageKeys => this.updateStorageKeys(storageKeys)));
            });
        }
        get storageKeys() { return this._storageKeys; }
        async updateStorageKeys(storageKeys) {
            this._storageKeys = storageKeys;
            this._onDidChangeStorageKeys.fire(this.storageKeys);
        }
        registerStorageKey(storageKey) {
            this.channel.call('registerStorageKey', [storageKey]);
        }
    }
    exports.StorageKeysSyncRegistryChannelClient = StorageKeysSyncRegistryChannelClient;
});
//# sourceMappingURL=userDataSyncIpc.js.map