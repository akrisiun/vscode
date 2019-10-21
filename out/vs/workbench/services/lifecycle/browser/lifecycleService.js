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
define(["require", "exports", "vs/platform/lifecycle/common/lifecycle", "vs/platform/log/common/log", "vs/platform/lifecycle/common/lifecycleService", "vs/nls", "vs/platform/instantiation/common/extensions"], function (require, exports, lifecycle_1, log_1, lifecycleService_1, nls_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let BrowserLifecycleService = class BrowserLifecycleService extends lifecycleService_1.AbstractLifecycleService {
        constructor(logService) {
            super(logService);
            this.logService = logService;
            this.registerListeners();
        }
        registerListeners() {
            // Note: we cannot change this to window.addEventListener('beforeUnload')
            // because it seems that mechanism does not allow for preventing the unload
            window.onbeforeunload = () => this.onBeforeUnload();
        }
        onBeforeUnload() {
            let veto = false;
            // Before Shutdown
            this._onBeforeShutdown.fire({
                veto(value) {
                    if (value === true) {
                        veto = true;
                    }
                    else if (value instanceof Promise && !veto) {
                        console.warn(new Error('Long running onBeforeShutdown currently not supported in the web'));
                        veto = true;
                    }
                },
                reason: 2 /* QUIT */
            });
            // Veto: signal back to browser by returning a non-falsify return value
            if (veto) {
                return nls_1.localize('lifecycleVeto', "Changes that you made may not be saved. Please check press 'Cancel' and try again.");
            }
            // No Veto: continue with Will Shutdown
            this._onWillShutdown.fire({
                join() {
                    console.warn(new Error('Long running onWillShutdown currently not supported in the web'));
                },
                reason: 2 /* QUIT */
            });
            // Finally end with Shutdown event
            this._onShutdown.fire();
            return null;
        }
    };
    BrowserLifecycleService = __decorate([
        __param(0, log_1.ILogService)
    ], BrowserLifecycleService);
    exports.BrowserLifecycleService = BrowserLifecycleService;
    extensions_1.registerSingleton(lifecycle_1.ILifecycleService, BrowserLifecycleService);
});
//# sourceMappingURL=lifecycleService.js.map