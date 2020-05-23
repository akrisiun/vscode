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
define(["require", "exports", "vs/platform/userDataSync/common/userDataSync", "vs/platform/ipc/electron-browser/sharedProcessService", "vs/base/common/lifecycle", "vs/platform/instantiation/common/extensions", "vs/base/common/event"], function (require, exports, userDataSync_1, sharedProcessService_1, lifecycle_1, extensions_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataAutoSyncService = void 0;
    let UserDataAutoSyncService = /** @class */ (() => {
        let UserDataAutoSyncService = class UserDataAutoSyncService extends lifecycle_1.Disposable {
            constructor(sharedProcessService) {
                super();
                this.channel = sharedProcessService.getChannel('userDataAutoSync');
            }
            get onError() { return event_1.Event.map(this.channel.listen('onError'), e => userDataSync_1.UserDataSyncError.toUserDataSyncError(e)); }
            triggerAutoSync(sources) {
                return this.channel.call('triggerAutoSync', [sources]);
            }
        };
        UserDataAutoSyncService = __decorate([
            __param(0, sharedProcessService_1.ISharedProcessService)
        ], UserDataAutoSyncService);
        return UserDataAutoSyncService;
    })();
    exports.UserDataAutoSyncService = UserDataAutoSyncService;
    extensions_1.registerSingleton(userDataSync_1.IUserDataAutoSyncService, UserDataAutoSyncService);
});
//# sourceMappingURL=userDataAutoSyncService.js.map