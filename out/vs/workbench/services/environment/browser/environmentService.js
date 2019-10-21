/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/uuid", "vs/platform/environment/common/environment", "vs/platform/product/common/product"], function (require, exports, network_1, resources_1, uri_1, uuid_1, environment_1, product_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BrowserWindowConfiguration {
    }
    exports.BrowserWindowConfiguration = BrowserWindowConfiguration;
    class BrowserWorkbenchEnvironmentService {
        constructor(options) {
            this.options = options;
            this.configuration = new BrowserWindowConfiguration();
            this.args = { _: [] };
            this.logsPath = options.logsPath.path;
            this.logFile = resources_1.joinPath(options.logsPath, 'window.log');
            this.appRoot = '/web/';
            this.appNameLong = 'Visual Studio Code - Web';
            this.configuration.remoteAuthority = options.remoteAuthority;
            this.configuration.machineId = uuid_1.generateUuid();
            this.userRoamingDataHome = uri_1.URI.file('/User').with({ scheme: network_1.Schemas.userData });
            this.settingsResource = resources_1.joinPath(this.userRoamingDataHome, 'settings.json');
            this.settingsSyncPreviewResource = resources_1.joinPath(this.userRoamingDataHome, '.settings.json');
            this.userDataSyncLogResource = resources_1.joinPath(options.logsPath, 'userDataSync.log');
            this.keybindingsResource = resources_1.joinPath(this.userRoamingDataHome, 'keybindings.json');
            this.keyboardLayoutResource = resources_1.joinPath(this.userRoamingDataHome, 'keyboardLayout.json');
            this.argvResource = resources_1.joinPath(this.userRoamingDataHome, 'argv.json');
            this.backupHome = resources_1.joinPath(this.userRoamingDataHome, environment_1.BACKUPS);
            this.configuration.backupWorkspaceResource = resources_1.joinPath(this.backupHome, options.workspaceId);
            this.configuration.connectionToken = options.connectionToken || getCookieValue('vscode-tkn');
            this.debugExtensionHost = {
                port: null,
                break: false
            };
            this.untitledWorkspacesHome = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: 'Workspaces' });
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
                const edp = map.get('edp');
                if (edp) {
                    this.extensionDevelopmentLocationURI = [uri_1.URI.parse(edp)];
                    this.isExtensionDevelopment = true;
                }
                const di = map.get('di');
                if (di) {
                    this.debugExtensionHost.debugId = di;
                }
                const ibe = map.get('ibe');
                if (ibe) {
                    this.debugExtensionHost.port = parseInt(ibe);
                    this.debugExtensionHost.break = false;
                }
            }
        }
        get webviewExternalEndpoint() {
            // TODO: get fallback from product.json
            return (this.options.webviewEndpoint || 'https://{{uuid}}.vscode-webview-test.com/{{commit}}')
                .replace('{{commit}}', product_1.default.commit || '211fa02efe8c041fd7baa8ec3dce199d5185aa44');
        }
        get webviewResourceRoot() {
            return `${this.webviewExternalEndpoint}/vscode-resource/{{resource}}`;
        }
        get webviewCspSource() {
            return this.webviewExternalEndpoint
                .replace('{{uuid}}', '*');
        }
    }
    exports.BrowserWorkbenchEnvironmentService = BrowserWorkbenchEnvironmentService;
    /**
     * See https://stackoverflow.com/a/25490531
     */
    function getCookieValue(name) {
        const m = document.cookie.match('(^|[^;]+)\\s*' + name + '\\s*=\\s*([^;]+)');
        return m ? m.pop() : undefined;
    }
});
//# sourceMappingURL=environmentService.js.map