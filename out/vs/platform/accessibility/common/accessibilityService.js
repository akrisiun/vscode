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
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration", "vs/platform/accessibility/common/abstractAccessibilityService"], function (require, exports, contextkey_1, configuration_1, abstractAccessibilityService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let BrowserAccessibilityService = class BrowserAccessibilityService extends abstractAccessibilityService_1.AbstractAccessibilityService {
        constructor(contextKeyService, configurationService) {
            super(contextKeyService, configurationService);
            this.contextKeyService = contextKeyService;
            this.configurationService = configurationService;
            this._accessibilitySupport = 0 /* Unknown */;
        }
        alwaysUnderlineAccessKeys() {
            return Promise.resolve(false);
        }
        setAccessibilitySupport(accessibilitySupport) {
            if (this._accessibilitySupport === accessibilitySupport) {
                return;
            }
            this._accessibilitySupport = accessibilitySupport;
            this._onDidChangeAccessibilitySupport.fire();
        }
        getAccessibilitySupport() {
            return this._accessibilitySupport;
        }
    };
    BrowserAccessibilityService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, configuration_1.IConfigurationService)
    ], BrowserAccessibilityService);
    exports.BrowserAccessibilityService = BrowserAccessibilityService;
});
//# sourceMappingURL=accessibilityService.js.map