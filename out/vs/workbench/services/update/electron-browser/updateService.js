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
define(["require", "exports", "vs/base/common/event", "vs/platform/update/common/update", "vs/platform/ipc/electron-browser/mainProcessService", "vs/platform/instantiation/common/extensions"], function (require, exports, event_1, update_1, mainProcessService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let NativeUpdateService = class NativeUpdateService {
        constructor(mainProcessService) {
            this._onStateChange = new event_1.Emitter();
            this.onStateChange = this._onStateChange.event;
            this._state = update_1.State.Uninitialized;
            this.channel = mainProcessService.getChannel('update');
            // always set this._state as the state changes
            this.onStateChange(state => this._state = state);
            this.channel.call('_getInitialState').then(state => {
                // fire initial state
                this._onStateChange.fire(state);
                // fire subsequent states as they come in from remote
                this.channel.listen('onStateChange')(state => this._onStateChange.fire(state));
            });
        }
        get state() { return this._state; }
        checkForUpdates(context) {
            return this.channel.call('checkForUpdates', context);
        }
        downloadUpdate() {
            return this.channel.call('downloadUpdate');
        }
        applyUpdate() {
            return this.channel.call('applyUpdate');
        }
        quitAndInstall() {
            return this.channel.call('quitAndInstall');
        }
        isLatestVersion() {
            return this.channel.call('isLatestVersion');
        }
    };
    NativeUpdateService = __decorate([
        __param(0, mainProcessService_1.IMainProcessService)
    ], NativeUpdateService);
    exports.NativeUpdateService = NativeUpdateService;
    extensions_1.registerSingleton(update_1.IUpdateService, NativeUpdateService);
});
//# sourceMappingURL=updateService.js.map