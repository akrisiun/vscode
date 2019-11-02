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
define(["require", "exports", "vs/platform/userDataSync/common/userDataSync", "vs/platform/ipc/electron-browser/sharedProcessService", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/instantiation/common/extensions"], function (require, exports, userDataSync_1, sharedProcessService_1, lifecycle_1, event_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let UserDataSyncService = class UserDataSyncService extends lifecycle_1.Disposable {
        constructor(sharedProcessService) {
            super();
            this._status = "uninitialized" /* Uninitialized */;
            this._onDidChangeStatus = this._register(new event_1.Emitter());
            this.onDidChangeStatus = this._onDidChangeStatus.event;
            this._conflictsSource = null;
            this.channel = sharedProcessService.getChannel('userDataSync');
            this.channel.call('_getInitialStatus').then(status => {
                this.updateStatus(status);
                this._register(this.channel.listen('onDidChangeStatus')(status => this.updateStatus(status)));
            });
        }
        get status() { return this._status; }
        get onDidChangeLocal() { return this.channel.listen('onDidChangeLocal'); }
        get conflictsSource() { return this._conflictsSource; }
        sync(_continue) {
            return this.channel.call('sync', [_continue]);
        }
        stop() {
            this.channel.call('stop');
        }
        removeExtension(identifier) {
            return this.channel.call('removeExtension', [identifier]);
        }
        async updateStatus(status) {
            this._conflictsSource = await this.channel.call('getConflictsSource');
            this._status = status;
            this._onDidChangeStatus.fire(status);
        }
    };
    UserDataSyncService = __decorate([
        __param(0, sharedProcessService_1.ISharedProcessService)
    ], UserDataSyncService);
    exports.UserDataSyncService = UserDataSyncService;
    extensions_1.registerSingleton(userDataSync_1.IUserDataSyncService, UserDataSyncService);
});
//# sourceMappingURL=userDataSyncService.js.map