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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/accessibility/common/accessibility", "vs/base/common/event", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration"], function (require, exports, lifecycle_1, accessibility_1, event_1, contextkey_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let AbstractAccessibilityService = class AbstractAccessibilityService extends lifecycle_1.Disposable {
        constructor(_contextKeyService, _configurationService) {
            super();
            this._contextKeyService = _contextKeyService;
            this._configurationService = _configurationService;
            this._onDidChangeAccessibilitySupport = new event_1.Emitter();
            this.onDidChangeAccessibilitySupport = this._onDidChangeAccessibilitySupport.event;
            this._accessibilityModeEnabledContext = accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.bindTo(this._contextKeyService);
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('editor.accessibilitySupport')) {
                    this._updateContextKey();
                }
            }));
            this._updateContextKey();
            this.onDidChangeAccessibilitySupport(() => this._updateContextKey());
        }
        _updateContextKey() {
            const detected = this.getAccessibilitySupport() === 2 /* Enabled */;
            const config = this._configurationService.getValue('editor.accessibilitySupport');
            this._accessibilityModeEnabledContext.set(config === 'on' || (config === 'auto' && detected));
        }
    };
    AbstractAccessibilityService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, configuration_1.IConfigurationService)
    ], AbstractAccessibilityService);
    exports.AbstractAccessibilityService = AbstractAccessibilityService;
});
//# sourceMappingURL=abstractAccessibilityService.js.map