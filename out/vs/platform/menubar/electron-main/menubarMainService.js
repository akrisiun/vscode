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
define(["require", "exports", "vs/platform/menubar/electron-main/menubar", "vs/platform/log/common/log", "vs/platform/instantiation/common/instantiation", "vs/platform/lifecycle/electron-main/lifecycleMainService"], function (require, exports, menubar_1, log_1, instantiation_1, lifecycleMainService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MenubarMainService = void 0;
    let MenubarMainService = /** @class */ (() => {
        let MenubarMainService = class MenubarMainService {
            constructor(instantiationService, lifecycleMainService, logService) {
                this.instantiationService = instantiationService;
                this.lifecycleMainService = lifecycleMainService;
                this.logService = logService;
                // Install Menu
                this.lifecycleMainService.when(3 /* AfterWindowOpen */).then(() => {
                    this._menubar = this.instantiationService.createInstance(menubar_1.Menubar);
                });
            }
            updateMenubar(windowId, menus) {
                return this.lifecycleMainService.when(3 /* AfterWindowOpen */).then(() => {
                    this.logService.trace('menubarService#updateMenubar', windowId);
                    if (this._menubar) {
                        this._menubar.updateMenu(menus, windowId);
                    }
                    return undefined;
                });
            }
        };
        MenubarMainService = __decorate([
            __param(0, instantiation_1.IInstantiationService),
            __param(1, lifecycleMainService_1.ILifecycleMainService),
            __param(2, log_1.ILogService)
        ], MenubarMainService);
        return MenubarMainService;
    })();
    exports.MenubarMainService = MenubarMainService;
});
//# sourceMappingURL=menubarMainService.js.map