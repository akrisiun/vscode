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
define(["require", "exports", "vs/base/common/actions", "vs/nls", "vs/platform/electron/node/electron", "vs/platform/ipc/electron-browser/sharedProcessService"], function (require, exports, actions_1, nls, electron_1, sharedProcessService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ToggleDevToolsAction = class ToggleDevToolsAction extends actions_1.Action {
        constructor(id, label, electronService) {
            super(id, label);
            this.electronService = electronService;
        }
        run() {
            return this.electronService.toggleDevTools();
        }
    };
    ToggleDevToolsAction.ID = 'workbench.action.toggleDevTools';
    ToggleDevToolsAction.LABEL = nls.localize('toggleDevTools', "Toggle Developer Tools");
    ToggleDevToolsAction = __decorate([
        __param(2, electron_1.IElectronService)
    ], ToggleDevToolsAction);
    exports.ToggleDevToolsAction = ToggleDevToolsAction;
    let ToggleSharedProcessAction = class ToggleSharedProcessAction extends actions_1.Action {
        constructor(id, label, sharedProcessService) {
            super(id, label);
            this.sharedProcessService = sharedProcessService;
        }
        run() {
            return this.sharedProcessService.toggleSharedProcessWindow();
        }
    };
    ToggleSharedProcessAction.ID = 'workbench.action.toggleSharedProcess';
    ToggleSharedProcessAction.LABEL = nls.localize('toggleSharedProcess', "Toggle Shared Process");
    ToggleSharedProcessAction = __decorate([
        __param(2, sharedProcessService_1.ISharedProcessService)
    ], ToggleSharedProcessAction);
    exports.ToggleSharedProcessAction = ToggleSharedProcessAction;
});
//# sourceMappingURL=developerActions.js.map