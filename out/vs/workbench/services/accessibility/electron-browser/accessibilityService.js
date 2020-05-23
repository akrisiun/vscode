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
define(["require", "exports", "vs/platform/accessibility/common/accessibility", "vs/base/common/platform", "vs/workbench/services/environment/common/environmentService", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration", "vs/platform/registry/common/platform", "vs/platform/accessibility/common/accessibilityService", "vs/platform/instantiation/common/extensions", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/configuration/common/jsonEditing", "vs/workbench/common/contributions", "vs/platform/environment/common/environment"], function (require, exports, accessibility_1, platform_1, environmentService_1, contextkey_1, configuration_1, platform_2, accessibilityService_1, extensions_1, telemetry_1, jsonEditing_1, contributions_1, environment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeAccessibilityService = void 0;
    let NativeAccessibilityService = /** @class */ (() => {
        let NativeAccessibilityService = class NativeAccessibilityService extends accessibilityService_1.AccessibilityService {
            constructor(environmentService, contextKeyService, configurationService, _telemetryService) {
                super(contextKeyService, configurationService);
                this._telemetryService = _telemetryService;
                this.didSendTelemetry = false;
                this.setAccessibilitySupport(environmentService.configuration.accessibilitySupport ? 2 /* Enabled */ : 1 /* Disabled */);
            }
            alwaysUnderlineAccessKeys() {
                if (!platform_1.isWindows) {
                    return Promise.resolve(false);
                }
                return new Promise(async (resolve) => {
                    const Registry = await new Promise((resolve_1, reject_1) => { require(['vscode-windows-registry'], resolve_1, reject_1); });
                    let value;
                    try {
                        value = Registry.GetStringRegKey('HKEY_CURRENT_USER', 'Control Panel\\Accessibility\\Keyboard Preference', 'On');
                    }
                    catch (_a) {
                        resolve(false);
                    }
                    resolve(value === '1');
                });
            }
            setAccessibilitySupport(accessibilitySupport) {
                super.setAccessibilitySupport(accessibilitySupport);
                if (!this.didSendTelemetry && accessibilitySupport === 2 /* Enabled */) {
                    this._telemetryService.publicLog2('accessibility', { enabled: true });
                    this.didSendTelemetry = true;
                }
            }
        };
        NativeAccessibilityService = __decorate([
            __param(0, environmentService_1.IWorkbenchEnvironmentService),
            __param(1, contextkey_1.IContextKeyService),
            __param(2, configuration_1.IConfigurationService),
            __param(3, telemetry_1.ITelemetryService)
        ], NativeAccessibilityService);
        return NativeAccessibilityService;
    })();
    exports.NativeAccessibilityService = NativeAccessibilityService;
    extensions_1.registerSingleton(accessibility_1.IAccessibilityService, NativeAccessibilityService, true);
    // On linux we do not automatically detect that a screen reader is detected, thus we have to implicitly notify the renderer to enable accessibility when user configures it in settings
    let LinuxAccessibilityContribution = /** @class */ (() => {
        let LinuxAccessibilityContribution = class LinuxAccessibilityContribution {
            constructor(jsonEditingService, accessibilityService, environmentService) {
                const forceRendererAccessibility = () => {
                    if (accessibilityService.isScreenReaderOptimized()) {
                        jsonEditingService.write(environmentService.argvResource, [{ key: 'force-renderer-accessibility', value: true }], true);
                    }
                };
                forceRendererAccessibility();
                accessibilityService.onDidChangeScreenReaderOptimized(forceRendererAccessibility);
            }
        };
        LinuxAccessibilityContribution = __decorate([
            __param(0, jsonEditing_1.IJSONEditingService),
            __param(1, accessibility_1.IAccessibilityService),
            __param(2, environment_1.IEnvironmentService)
        ], LinuxAccessibilityContribution);
        return LinuxAccessibilityContribution;
    })();
    if (platform_1.isLinux) {
        platform_2.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(LinuxAccessibilityContribution, 2 /* Ready */);
    }
});
//# sourceMappingURL=accessibilityService.js.map