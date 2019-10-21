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
define(["require", "exports", "vs/base/worker/defaultWorkerFactory", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/buffer", "vs/workbench/services/extensions/common/extensionHostProtocol", "vs/workbench/api/common/extHost.protocol", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/base/common/platform", "vs/base/common/uri", "vs/platform/product/common/productService", "vs/workbench/services/environment/common/environmentService"], function (require, exports, defaultWorkerFactory_1, event_1, lifecycle_1, buffer_1, extensionHostProtocol_1, extHost_protocol_1, telemetry_1, workspace_1, label_1, log_1, platform, uri_1, productService_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let WebWorkerExtensionHostStarter = class WebWorkerExtensionHostStarter {
        constructor(_autoStart, _extensions, _extensionHostLogsLocation, _telemetryService, _contextService, _labelService, _logService, _environmentService, _productService) {
            this._autoStart = _autoStart;
            this._extensions = _extensions;
            this._extensionHostLogsLocation = _extensionHostLogsLocation;
            this._telemetryService = _telemetryService;
            this._contextService = _contextService;
            this._labelService = _labelService;
            this._logService = _logService;
            this._environmentService = _environmentService;
            this._productService = _productService;
            this._toDispose = new lifecycle_1.DisposableStore();
            this._isTerminating = false;
            this._onDidExit = new event_1.Emitter();
            this.onExit = this._onDidExit.event;
        }
        async start() {
            if (!this._protocol) {
                const emitter = new event_1.Emitter();
                const url = defaultWorkerFactory_1.getWorkerBootstrapUrl(require.toUrl('../worker/extensionHostWorkerMain.js'), 'WorkerExtensionHost');
                const worker = new Worker(url, { name: 'WorkerExtensionHost' });
                worker.onmessage = (event) => {
                    const { data } = event;
                    if (!(data instanceof ArrayBuffer)) {
                        console.warn('UNKNOWN data received', data);
                        this._onDidExit.fire([77, 'UNKNOWN data received']);
                        return;
                    }
                    emitter.fire(buffer_1.VSBuffer.wrap(new Uint8Array(data, 0, data.byteLength)));
                };
                worker.onerror = (event) => {
                    console.error(event.message, event.error);
                    this._onDidExit.fire([81, event.message || event.error]);
                };
                // keep for cleanup
                this._toDispose.add(emitter);
                this._toDispose.add(lifecycle_1.toDisposable(() => worker.terminate()));
                const protocol = {
                    onMessage: emitter.event,
                    send: vsbuf => {
                        const data = vsbuf.buffer.buffer.slice(vsbuf.buffer.byteOffset, vsbuf.buffer.byteOffset + vsbuf.buffer.byteLength);
                        worker.postMessage(data, [data]);
                    }
                };
                // extension host handshake happens below
                // (1) <== wait for: Ready
                // (2) ==> send: init data
                // (3) <== wait for: Initialized
                await event_1.Event.toPromise(event_1.Event.filter(protocol.onMessage, msg => extensionHostProtocol_1.isMessageOfType(msg, 1 /* Ready */)));
                protocol.send(buffer_1.VSBuffer.fromString(JSON.stringify(await this._createExtHostInitData())));
                await event_1.Event.toPromise(event_1.Event.filter(protocol.onMessage, msg => extensionHostProtocol_1.isMessageOfType(msg, 0 /* Initialized */)));
                this._protocol = protocol;
            }
            return this._protocol;
        }
        dispose() {
            if (!this._protocol) {
                this._toDispose.dispose();
                return;
            }
            if (this._isTerminating) {
                return;
            }
            this._isTerminating = true;
            this._protocol.send(extensionHostProtocol_1.createMessageOfType(2 /* Terminate */));
            setTimeout(() => this._toDispose.dispose(), 10 * 1000);
        }
        getInspectPort() {
            return undefined;
        }
        enableInspectPort() {
            return Promise.resolve(false);
        }
        async _createExtHostInitData() {
            const [telemetryInfo, extensionDescriptions] = await Promise.all([this._telemetryService.getTelemetryInfo(), this._extensions]);
            const workspace = this._contextService.getWorkspace();
            return {
                commit: this._productService.commit,
                version: this._productService.version,
                parentPid: -1,
                environment: {
                    isExtensionDevelopmentDebug: false,
                    appRoot: this._environmentService.appRoot ? uri_1.URI.file(this._environmentService.appRoot) : undefined,
                    appSettingsHome: this._environmentService.appSettingsHome ? this._environmentService.appSettingsHome : undefined,
                    appName: this._productService.nameLong,
                    appUriScheme: this._productService.urlProtocol,
                    appLanguage: platform.language,
                    extensionDevelopmentLocationURI: this._environmentService.extensionDevelopmentLocationURI,
                    extensionTestsLocationURI: this._environmentService.extensionTestsLocationURI,
                    globalStorageHome: uri_1.URI.parse('fake:globalStorageHome'),
                    userHome: uri_1.URI.parse('fake:userHome'),
                    webviewResourceRoot: this._environmentService.webviewResourceRoot,
                    webviewCspSource: this._environmentService.webviewCspSource,
                },
                workspace: this._contextService.getWorkbenchState() === 1 /* EMPTY */ ? undefined : {
                    configuration: workspace.configuration || undefined,
                    id: workspace.id,
                    name: this._labelService.getWorkspaceLabel(workspace)
                },
                resolvedExtensions: [],
                hostExtensions: [],
                extensions: extensionDescriptions,
                telemetryInfo,
                logLevel: this._logService.getLevel(),
                logsLocation: this._extensionHostLogsLocation,
                autoStart: this._autoStart,
                remote: {
                    authority: this._environmentService.configuration.remoteAuthority,
                    isRemote: false
                },
                uiKind: platform.isWeb ? extHost_protocol_1.UIKind.Web : extHost_protocol_1.UIKind.Desktop
            };
        }
    };
    WebWorkerExtensionHostStarter = __decorate([
        __param(3, telemetry_1.ITelemetryService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, label_1.ILabelService),
        __param(6, log_1.ILogService),
        __param(7, environmentService_1.IWorkbenchEnvironmentService),
        __param(8, productService_1.IProductService)
    ], WebWorkerExtensionHostStarter);
    exports.WebWorkerExtensionHostStarter = WebWorkerExtensionHostStarter;
});
//# sourceMappingURL=webWorkerExtensionHostStarter.js.map