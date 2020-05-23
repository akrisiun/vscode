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
define(["require", "exports", "vs/platform/userDataSync/common/userDataSync", "vs/platform/ipc/electron-browser/sharedProcessService", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/instantiation/common/extensions", "vs/base/common/uri"], function (require, exports, userDataSync_1, sharedProcessService_1, lifecycle_1, event_1, extensions_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncService = void 0;
    let UserDataSyncService = /** @class */ (() => {
        let UserDataSyncService = class UserDataSyncService extends lifecycle_1.Disposable {
            constructor(sharedProcessService) {
                super();
                this._status = "uninitialized" /* Uninitialized */;
                this._onDidChangeStatus = this._register(new event_1.Emitter());
                this.onDidChangeStatus = this._onDidChangeStatus.event;
                this._conflicts = [];
                this._onDidChangeConflicts = this._register(new event_1.Emitter());
                this.onDidChangeConflicts = this._onDidChangeConflicts.event;
                this._lastSyncTime = undefined;
                this._onDidChangeLastSyncTime = this._register(new event_1.Emitter());
                this.onDidChangeLastSyncTime = this._onDidChangeLastSyncTime.event;
                this._onSyncErrors = this._register(new event_1.Emitter());
                this.onSyncErrors = this._onSyncErrors.event;
                const userDataSyncChannel = sharedProcessService.getChannel('userDataSync');
                this.channel = {
                    call(command, arg, cancellationToken) {
                        return userDataSyncChannel.call(command, arg, cancellationToken)
                            .then(null, error => { throw userDataSync_1.UserDataSyncError.toUserDataSyncError(error); });
                    },
                    listen(event, arg) {
                        return userDataSyncChannel.listen(event, arg);
                    }
                };
                this.channel.call('_getInitialData').then(([status, conflicts, lastSyncTime]) => {
                    this.updateStatus(status);
                    this.updateConflicts(conflicts);
                    if (lastSyncTime) {
                        this.updateLastSyncTime(lastSyncTime);
                    }
                    this._register(this.channel.listen('onDidChangeStatus')(status => this.updateStatus(status)));
                    this._register(this.channel.listen('onDidChangeLastSyncTime')(lastSyncTime => this.updateLastSyncTime(lastSyncTime)));
                });
                this._register(this.channel.listen('onDidChangeConflicts')(conflicts => this.updateConflicts(conflicts)));
                this._register(this.channel.listen('onSyncErrors')(errors => this._onSyncErrors.fire(errors.map(([source, error]) => ([source, userDataSync_1.UserDataSyncError.toUserDataSyncError(error)])))));
            }
            get status() { return this._status; }
            get onDidChangeLocal() { return this.channel.listen('onDidChangeLocal'); }
            get conflicts() { return this._conflicts; }
            get lastSyncTime() { return this._lastSyncTime; }
            pull() {
                return this.channel.call('pull');
            }
            sync() {
                return this.channel.call('sync');
            }
            stop() {
                return this.channel.call('stop');
            }
            reset() {
                return this.channel.call('reset');
            }
            resetLocal() {
                return this.channel.call('resetLocal');
            }
            isFirstTimeSyncWithMerge() {
                return this.channel.call('isFirstTimeSyncWithMerge');
            }
            acceptConflict(conflict, content) {
                return this.channel.call('acceptConflict', [conflict, content]);
            }
            resolveContent(resource) {
                return this.channel.call('resolveContent', [resource]);
            }
            async getLocalSyncResourceHandles(resource) {
                const handles = await this.channel.call('getLocalSyncResourceHandles', [resource]);
                return handles.map(({ created, uri }) => ({ created, uri: uri_1.URI.revive(uri) }));
            }
            async getRemoteSyncResourceHandles(resource) {
                const handles = await this.channel.call('getRemoteSyncResourceHandles', [resource]);
                return handles.map(({ created, uri }) => ({ created, uri: uri_1.URI.revive(uri) }));
            }
            async getAssociatedResources(resource, syncResourceHandle) {
                const result = await this.channel.call('getAssociatedResources', [resource, syncResourceHandle]);
                return result.map(({ resource, comparableResource }) => ({ resource: uri_1.URI.revive(resource), comparableResource: uri_1.URI.revive(comparableResource) }));
            }
            async updateStatus(status) {
                this._status = status;
                this._onDidChangeStatus.fire(status);
            }
            async updateConflicts(conflicts) {
                // Revive URIs
                this._conflicts = conflicts.map(c => ({
                    syncResource: c.syncResource,
                    conflicts: c.conflicts.map(({ local, remote }) => ({ local: uri_1.URI.revive(local), remote: uri_1.URI.revive(remote) }))
                }));
                this._onDidChangeConflicts.fire(conflicts);
            }
            updateLastSyncTime(lastSyncTime) {
                if (this._lastSyncTime !== lastSyncTime) {
                    this._lastSyncTime = lastSyncTime;
                    this._onDidChangeLastSyncTime.fire(lastSyncTime);
                }
            }
        };
        UserDataSyncService = __decorate([
            __param(0, sharedProcessService_1.ISharedProcessService)
        ], UserDataSyncService);
        return UserDataSyncService;
    })();
    exports.UserDataSyncService = UserDataSyncService;
    extensions_1.registerSingleton(userDataSync_1.IUserDataSyncService, UserDataSyncService);
});
//# sourceMappingURL=userDataSyncService.js.map