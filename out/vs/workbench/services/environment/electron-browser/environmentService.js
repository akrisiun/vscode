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
define(["require", "exports", "vs/platform/environment/node/environmentService", "vs/base/common/decorators", "vs/base/common/uri", "vs/base/common/network", "vs/workbench/services/backup/electron-browser/backup", "vs/base/common/path", "vs/platform/product/common/product"], function (require, exports, environmentService_1, decorators_1, uri_1, network_1, backup_1, path_1, product_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeWorkbenchEnvironmentService = void 0;
    let NativeWorkbenchEnvironmentService = /** @class */ (() => {
        class NativeWorkbenchEnvironmentService extends environmentService_1.EnvironmentService {
            constructor(configuration, execPath) {
                super(configuration, execPath);
                this.configuration = configuration;
                this.configuration.backupWorkspaceResource = this.configuration.backupPath ? backup_1.toBackupWorkspaceResource(this.configuration.backupPath, this) : undefined;
            }
            get webviewExternalEndpoint() {
                const baseEndpoint = 'https://{{uuid}}.vscode-webview-test.com/{{commit}}';
                return baseEndpoint.replace('{{commit}}', product_1.default.commit || '0d728c31ebdf03869d2687d9be0b017667c9ff37');
            }
            get webviewResourceRoot() { return 'vscode-resource://{{resource}}'; }
            get webviewCspSource() { return 'vscode-resource:'; }
            get userRoamingDataHome() { return this.appSettingsHome.with({ scheme: network_1.Schemas.userData }); }
            get logFile() { return uri_1.URI.file(path_1.join(this.logsPath, `renderer${this.configuration.windowId}.log`)); }
            get extHostLogsPath() { return uri_1.URI.file(path_1.join(this.logsPath, `exthost${this.configuration.windowId}`)); }
            get skipReleaseNotes() { return !!this.args['skip-release-notes']; }
        }
        __decorate([
            decorators_1.memoize
        ], NativeWorkbenchEnvironmentService.prototype, "webviewExternalEndpoint", null);
        __decorate([
            decorators_1.memoize
        ], NativeWorkbenchEnvironmentService.prototype, "webviewResourceRoot", null);
        __decorate([
            decorators_1.memoize
        ], NativeWorkbenchEnvironmentService.prototype, "webviewCspSource", null);
        __decorate([
            decorators_1.memoize
        ], NativeWorkbenchEnvironmentService.prototype, "userRoamingDataHome", null);
        __decorate([
            decorators_1.memoize
        ], NativeWorkbenchEnvironmentService.prototype, "logFile", null);
        __decorate([
            decorators_1.memoize
        ], NativeWorkbenchEnvironmentService.prototype, "extHostLogsPath", null);
        __decorate([
            decorators_1.memoize
        ], NativeWorkbenchEnvironmentService.prototype, "skipReleaseNotes", null);
        return NativeWorkbenchEnvironmentService;
    })();
    exports.NativeWorkbenchEnvironmentService = NativeWorkbenchEnvironmentService;
});
//# sourceMappingURL=environmentService.js.map