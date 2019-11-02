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
define(["require", "exports", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/uuid", "vs/platform/environment/common/environment", "vs/platform/product/common/product", "vs/base/common/map", "vs/base/common/decorators"], function (require, exports, network_1, resources_1, uri_1, uuid_1, environment_1, product_1, map_1, decorators_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BrowserWindowConfiguration {
        constructor(options, environment) {
            this.options = options;
            this.environment = environment;
        }
        //#region PROPERLY CONFIGURED IN DESKTOP + WEB
        get sessionId() { return uuid_1.generateUuid(); }
        get remoteAuthority() { return this.options.remoteAuthority; }
        get connectionToken() { return this.options.connectionToken || this.getCookieValue('vscode-tkn'); }
        get backupWorkspaceResource() { return resources_1.joinPath(this.environment.backupHome, this.options.workspaceId); }
        // Currently unsupported in web
        get filesToOpenOrCreate() { return undefined; }
        get filesToDiff() { return undefined; }
        //#endregion
        getCookieValue(name) {
            const m = document.cookie.match('(^|[^;]+)\\s*' + name + '\\s*=\\s*([^;]+)'); // See https://stackoverflow.com/a/25490531
            return m ? m.pop() : undefined;
        }
    }
    __decorate([
        decorators_1.memoize
    ], BrowserWindowConfiguration.prototype, "sessionId", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWindowConfiguration.prototype, "remoteAuthority", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWindowConfiguration.prototype, "connectionToken", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWindowConfiguration.prototype, "backupWorkspaceResource", null);
    exports.BrowserWindowConfiguration = BrowserWindowConfiguration;
    class BrowserWorkbenchEnvironmentService {
        //#endregion
        constructor(options) {
            this.options = options;
            this._extensionHostDebugEnvironment = undefined;
            //#endregion
            //#region TODO MOVE TO NODE LAYER
            this._configuration = undefined;
            this.args = { _: [] };
        }
        //#region PROPERLY CONFIGURED IN DESKTOP + WEB
        get isBuilt() { return !!product_1.default.commit; }
        get logsPath() { return this.options.logsPath.path; }
        get logFile() { return resources_1.joinPath(this.options.logsPath, 'window.log'); }
        get userRoamingDataHome() { return uri_1.URI.file('/User').with({ scheme: network_1.Schemas.userData }); }
        get settingsResource() { return resources_1.joinPath(this.userRoamingDataHome, 'settings.json'); }
        get settingsSyncPreviewResource() { return resources_1.joinPath(this.userRoamingDataHome, '.settings.json'); }
        get userDataSyncLogResource() { return resources_1.joinPath(this.options.logsPath, 'userDataSync.log'); }
        get keybindingsResource() { return resources_1.joinPath(this.userRoamingDataHome, 'keybindings.json'); }
        get keyboardLayoutResource() { return resources_1.joinPath(this.userRoamingDataHome, 'keyboardLayout.json'); }
        get backupHome() { return resources_1.joinPath(this.userRoamingDataHome, environment_1.BACKUPS); }
        get untitledWorkspacesHome() { return resources_1.joinPath(this.userRoamingDataHome, 'Workspaces'); }
        get debugExtensionHost() {
            if (!this._extensionHostDebugEnvironment) {
                this._extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this._extensionHostDebugEnvironment.params;
        }
        get isExtensionDevelopment() {
            if (!this._extensionHostDebugEnvironment) {
                this._extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this._extensionHostDebugEnvironment.isExtensionDevelopment;
        }
        get extensionDevelopmentLocationURI() {
            if (!this._extensionHostDebugEnvironment) {
                this._extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this._extensionHostDebugEnvironment.extensionDevelopmentLocationURI;
        }
        get extensionTestsLocationURI() {
            if (!this._extensionHostDebugEnvironment) {
                this._extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this._extensionHostDebugEnvironment.extensionTestsLocationURI;
        }
        get webviewExternalEndpoint() {
            // TODO: get fallback from product.json
            return (this.options.webviewEndpoint || 'https://{{uuid}}.vscode-webview-test.com/{{commit}}').replace('{{commit}}', product_1.default.commit || 'b53811e67e65c6a564a80e1c412ca2b13de02907');
        }
        get webviewResourceRoot() {
            return `${this.webviewExternalEndpoint}/vscode-resource/{{resource}}`;
        }
        get webviewCspSource() {
            return this.webviewExternalEndpoint.replace('{{uuid}}', '*');
        }
        // Currently not configurable in web
        get disableExtensions() { return false; }
        get extensionsPath() { return undefined; }
        get verbose() { return false; }
        get disableUpdates() { return false; }
        get logExtensionHostCommunication() { return false; }
        get configuration() {
            if (!this._configuration) {
                this._configuration = new BrowserWindowConfiguration(this.options, this);
            }
            return this._configuration;
        }
        resolveExtensionHostDebugEnvironment() {
            const extensionHostDebugEnvironment = {
                params: {
                    port: null,
                    break: false
                },
                isExtensionDevelopment: false,
                extensionDevelopmentLocationURI: []
            };
            // Fill in selected extra environmental properties
            if (this.options.workspaceProvider && Array.isArray(this.options.workspaceProvider.payload)) {
                const environment = map_1.serializableToMap(this.options.workspaceProvider.payload);
                for (const [key, value] of environment) {
                    switch (key) {
                        case 'extensionDevelopmentPath':
                            extensionHostDebugEnvironment.extensionDevelopmentLocationURI = [uri_1.URI.parse(value)];
                            extensionHostDebugEnvironment.isExtensionDevelopment = true;
                            break;
                        case 'extensionTestsPath':
                            extensionHostDebugEnvironment.extensionTestsLocationURI = uri_1.URI.parse(value);
                            break;
                        case 'debugId':
                            extensionHostDebugEnvironment.params.debugId = value;
                            break;
                        case 'inspect-brk-extensions':
                            extensionHostDebugEnvironment.params.port = parseInt(value);
                            extensionHostDebugEnvironment.params.break = false;
                            break;
                    }
                }
            }
            else {
                // TODO@Ben remove me once environment is adopted
                if (document && document.location && document.location.search) {
                    const map = new Map();
                    const query = document.location.search.substring(1);
                    const vars = query.split('&');
                    for (let p of vars) {
                        const pair = p.split('=');
                        if (pair.length >= 2) {
                            map.set(pair[0], decodeURIComponent(pair[1]));
                        }
                    }
                    const edp = map.get('extensionDevelopmentPath');
                    if (edp) {
                        extensionHostDebugEnvironment.extensionDevelopmentLocationURI = [uri_1.URI.parse(edp)];
                        extensionHostDebugEnvironment.isExtensionDevelopment = true;
                    }
                    const di = map.get('debugId');
                    if (di) {
                        extensionHostDebugEnvironment.params.debugId = di;
                    }
                    const ibe = map.get('inspect-brk-extensions');
                    if (ibe) {
                        extensionHostDebugEnvironment.params.port = parseInt(ibe);
                        extensionHostDebugEnvironment.params.break = false;
                    }
                }
            }
            return extensionHostDebugEnvironment;
        }
    }
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "isBuilt", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "logsPath", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "logFile", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "userRoamingDataHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "settingsResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "settingsSyncPreviewResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "userDataSyncLogResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "keybindingsResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "keyboardLayoutResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "backupHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "untitledWorkspacesHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "webviewExternalEndpoint", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "webviewResourceRoot", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "webviewCspSource", null);
    exports.BrowserWorkbenchEnvironmentService = BrowserWorkbenchEnvironmentService;
});
//# sourceMappingURL=environmentService.js.map