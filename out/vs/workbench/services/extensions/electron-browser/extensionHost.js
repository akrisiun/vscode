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
define(["require", "exports", "vs/nls", "child_process", "net", "vs/base/common/amd", "vs/base/common/async", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/platform", "vs/base/common/uri", "vs/base/common/console", "vs/workbench/services/extensions/common/remoteConsoleUtil", "vs/base/node/ports", "vs/base/parts/ipc/common/ipc.net", "vs/base/parts/ipc/node/ipc.net", "vs/workbench/services/environment/common/environmentService", "vs/platform/label/common/label", "vs/platform/lifecycle/common/lifecycle", "vs/platform/log/common/log", "vs/platform/product/common/product", "vs/platform/notification/common/notification", "vs/platform/telemetry/common/telemetry", "vs/platform/electron/node/electron", "vs/platform/workspace/common/workspace", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/extensionHostProtocol", "vs/base/common/types", "../common/extensionDevOptions", "vs/base/common/buffer", "vs/platform/debug/common/extensionHostDebug", "vs/platform/workspaces/common/workspaces", "vs/workbench/services/host/browser/host"], function (require, exports, nls, child_process_1, net_1, amd_1, async_1, errorMessage_1, event_1, lifecycle_1, objects, platform, uri_1, console_1, remoteConsoleUtil_1, ports_1, ipc_net_1, ipc_net_2, environmentService_1, label_1, lifecycle_2, log_1, product_1, notification_1, telemetry_1, electron_1, workspace_1, extHost_protocol_1, extensionHostProtocol_1, types_1, extensionDevOptions_1, buffer_1, extensionHostDebug_1, workspaces_1, host_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ExtensionHostProcessWorker = class ExtensionHostProcessWorker {
        constructor(_autoStart, _extensions, _extensionHostLogsLocation, _contextService, _notificationService, _electronService, _lifecycleService, _environmentService, _telemetryService, _logService, _labelService, _extensionHostDebugService, _hostService) {
            this._autoStart = _autoStart;
            this._extensions = _extensions;
            this._extensionHostLogsLocation = _extensionHostLogsLocation;
            this._contextService = _contextService;
            this._notificationService = _notificationService;
            this._electronService = _electronService;
            this._lifecycleService = _lifecycleService;
            this._environmentService = _environmentService;
            this._telemetryService = _telemetryService;
            this._logService = _logService;
            this._labelService = _labelService;
            this._extensionHostDebugService = _extensionHostDebugService;
            this._hostService = _hostService;
            this._onExit = new event_1.Emitter();
            this.onExit = this._onExit.event;
            this._onDidSetInspectPort = new event_1.Emitter();
            this._toDispose = new lifecycle_1.DisposableStore();
            const devOpts = extensionDevOptions_1.parseExtensionDevOptions(this._environmentService);
            this._isExtensionDevHost = devOpts.isExtensionDevHost;
            this._isExtensionDevDebug = devOpts.isExtensionDevDebug;
            this._isExtensionDevDebugBrk = devOpts.isExtensionDevDebugBrk;
            this._isExtensionDevTestFromCli = devOpts.isExtensionDevTestFromCli;
            this._lastExtensionHostError = null;
            this._terminating = false;
            this._namedPipeServer = null;
            this._inspectPort = null;
            this._extensionHostProcess = null;
            this._extensionHostConnection = null;
            this._messageProtocol = null;
            this._toDispose.add(this._onExit);
            this._toDispose.add(this._lifecycleService.onWillShutdown(e => this._onWillShutdown(e)));
            this._toDispose.add(this._lifecycleService.onShutdown(reason => this.terminate()));
            this._toDispose.add(this._extensionHostDebugService.onClose(event => {
                if (this._isExtensionDevHost && this._environmentService.debugExtensionHost.debugId === event.sessionId) {
                    this._electronService.closeWindow();
                }
            }));
            this._toDispose.add(this._extensionHostDebugService.onReload(event => {
                if (this._isExtensionDevHost && this._environmentService.debugExtensionHost.debugId === event.sessionId) {
                    this._hostService.reload();
                }
            }));
            const globalExitListener = () => this.terminate();
            process.once('exit', globalExitListener);
            this._toDispose.add(lifecycle_1.toDisposable(() => {
                process.removeListener('exit', globalExitListener);
            }));
        }
        dispose() {
            this.terminate();
        }
        start() {
            if (this._terminating) {
                // .terminate() was called
                return null;
            }
            if (!this._messageProtocol) {
                this._messageProtocol = Promise.all([
                    this._tryListenOnPipe(),
                    this._tryFindDebugPort()
                ]).then(data => {
                    const pipeName = data[0];
                    const portNumber = data[1];
                    const opts = {
                        env: objects.mixin(objects.deepClone(process.env), {
                            AMD_ENTRYPOINT: 'vs/workbench/services/extensions/node/extensionHostProcess',
                            PIPE_LOGGING: 'true',
                            VERBOSE_LOGGING: true,
                            VSCODE_IPC_HOOK_EXTHOST: pipeName,
                            VSCODE_HANDLES_UNCAUGHT_ERRORS: true,
                            VSCODE_LOG_STACK: !this._isExtensionDevTestFromCli && (this._isExtensionDevHost || !this._environmentService.isBuilt || product_1.default.quality !== 'stable' || this._environmentService.verbose),
                            VSCODE_LOG_LEVEL: this._environmentService.verbose ? 'trace' : this._environmentService.log
                        }),
                        // We only detach the extension host on windows. Linux and Mac orphan by default
                        // and detach under Linux and Mac create another process group.
                        // We detach because we have noticed that when the renderer exits, its child processes
                        // (i.e. extension host) are taken down in a brutal fashion by the OS
                        detached: !!platform.isWindows,
                        execArgv: undefined,
                        silent: true
                    };
                    if (portNumber !== 0) {
                        opts.execArgv = [
                            '--nolazy',
                            (this._isExtensionDevDebugBrk ? '--inspect-brk=' : '--inspect=') + portNumber
                        ];
                    }
                    const crashReporterOptions = undefined; // TODO@electron pass this in as options to the extension host after verifying this actually works
                    if (crashReporterOptions) {
                        opts.env.CRASH_REPORTER_START_OPTIONS = JSON.stringify(crashReporterOptions);
                    }
                    // Run Extension Host as fork of current process
                    this._extensionHostProcess = child_process_1.fork(amd_1.getPathFromAmdModule(require, 'bootstrap-fork'), ['--type=extensionHost'], opts);
                    this._extensionHostProcess.stdout.setEncoding('utf8');
                    this._extensionHostProcess.stderr.setEncoding('utf8');
                    const onStdout = event_1.Event.fromNodeEventEmitter(this._extensionHostProcess.stdout, 'data');
                    const onStderr = event_1.Event.fromNodeEventEmitter(this._extensionHostProcess.stderr, 'data');
                    const onOutput = event_1.Event.any(event_1.Event.map(onStdout, o => ({ data: `%c${o}`, format: [''] })), event_1.Event.map(onStderr, o => ({ data: `%c${o}`, format: ['color: red'] })));
                    // Debounce all output, so we can render it in the Chrome console as a group
                    const onDebouncedOutput = event_1.Event.debounce(onOutput, (r, o) => {
                        return r
                            ? { data: r.data + o.data, format: [...r.format, ...o.format] }
                            : { data: o.data, format: o.format };
                    }, 100);
                    // Print out extension host output
                    onDebouncedOutput(output => {
                        const inspectorUrlMatch = output.data && output.data.match(/ws:\/\/([^\s]+:(\d+)\/[^\s]+)/);
                        if (inspectorUrlMatch) {
                            if (!this._environmentService.isBuilt) {
                                console.log(`%c[Extension Host] %cdebugger inspector at chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=${inspectorUrlMatch[1]}`, 'color: blue', 'color:');
                            }
                            if (!this._inspectPort) {
                                this._inspectPort = Number(inspectorUrlMatch[2]);
                                this._onDidSetInspectPort.fire();
                            }
                        }
                        else {
                            console.group('Extension Host');
                            console.log(output.data, ...output.format);
                            console.groupEnd();
                        }
                    });
                    // Support logging from extension host
                    this._extensionHostProcess.on('message', msg => {
                        if (msg && msg.type === '__$console') {
                            this._logExtensionHostMessage(msg);
                        }
                    });
                    // Lifecycle
                    this._extensionHostProcess.on('error', (err) => this._onExtHostProcessError(err));
                    this._extensionHostProcess.on('exit', (code, signal) => this._onExtHostProcessExit(code, signal));
                    // Notify debugger that we are ready to attach to the process if we run a development extension
                    if (portNumber) {
                        if (this._isExtensionDevHost && portNumber && this._isExtensionDevDebug && this._environmentService.debugExtensionHost.debugId) {
                            this._extensionHostDebugService.attachSession(this._environmentService.debugExtensionHost.debugId, portNumber);
                        }
                        this._inspectPort = portNumber;
                        this._onDidSetInspectPort.fire();
                    }
                    // Help in case we fail to start it
                    let startupTimeoutHandle;
                    if (!this._environmentService.isBuilt && !this._environmentService.configuration.remoteAuthority || this._isExtensionDevHost) {
                        startupTimeoutHandle = setTimeout(() => {
                            const msg = this._isExtensionDevDebugBrk
                                ? nls.localize('extensionHost.startupFailDebug', "Extension host did not start in 10 seconds, it might be stopped on the first line and needs a debugger to continue.")
                                : nls.localize('extensionHost.startupFail', "Extension host did not start in 10 seconds, that might be a problem.");
                            this._notificationService.prompt(notification_1.Severity.Warning, msg, [{
                                    label: nls.localize('reloadWindow', "Reload Window"),
                                    run: () => this._hostService.reload()
                                }], { sticky: true });
                        }, 10000);
                    }
                    // Initialize extension host process with hand shakes
                    return this._tryExtHostHandshake().then((protocol) => {
                        clearTimeout(startupTimeoutHandle);
                        return protocol;
                    });
                });
            }
            return this._messageProtocol;
        }
        /**
         * Start a server (`this._namedPipeServer`) that listens on a named pipe and return the named pipe name.
         */
        _tryListenOnPipe() {
            return new Promise((resolve, reject) => {
                const pipeName = ipc_net_2.generateRandomPipeName();
                this._namedPipeServer = net_1.createServer();
                this._namedPipeServer.on('error', reject);
                this._namedPipeServer.listen(pipeName, () => {
                    if (this._namedPipeServer) {
                        this._namedPipeServer.removeListener('error', reject);
                    }
                    resolve(pipeName);
                });
            });
        }
        /**
         * Find a free port if extension host debugging is enabled.
         */
        async _tryFindDebugPort() {
            if (typeof this._environmentService.debugExtensionHost.port !== 'number') {
                return 0;
            }
            const expected = this._environmentService.debugExtensionHost.port;
            const port = await ports_1.findFreePort(expected, 10 /* try 10 ports */, 5000 /* try up to 5 seconds */);
            if (!port) {
                console.warn('%c[Extension Host] %cCould not find a free port for debugging', 'color: blue', 'color:');
                return 0;
            }
            if (port !== expected) {
                console.warn(`%c[Extension Host] %cProvided debugging port ${expected} is not free, using ${port} instead.`, 'color: blue', 'color:');
            }
            if (this._isExtensionDevDebugBrk) {
                console.warn(`%c[Extension Host] %cSTOPPED on first line for debugging on port ${port}`, 'color: blue', 'color:');
            }
            else {
                console.info(`%c[Extension Host] %cdebugger listening on port ${port}`, 'color: blue', 'color:');
            }
            return port;
        }
        _tryExtHostHandshake() {
            return new Promise((resolve, reject) => {
                // Wait for the extension host to connect to our named pipe
                // and wrap the socket in the message passing protocol
                let handle = setTimeout(() => {
                    if (this._namedPipeServer) {
                        this._namedPipeServer.close();
                        this._namedPipeServer = null;
                    }
                    reject('timeout');
                }, 60 * 1000);
                this._namedPipeServer.on('connection', socket => {
                    clearTimeout(handle);
                    if (this._namedPipeServer) {
                        this._namedPipeServer.close();
                        this._namedPipeServer = null;
                    }
                    this._extensionHostConnection = socket;
                    // using a buffered message protocol here because between now
                    // and the first time a `then` executes some messages might be lost
                    // unless we immediately register a listener for `onMessage`.
                    resolve(new ipc_net_1.PersistentProtocol(new ipc_net_2.NodeSocket(this._extensionHostConnection)));
                });
            }).then((protocol) => {
                // 1) wait for the incoming `ready` event and send the initialization data.
                // 2) wait for the incoming `initialized` event.
                return new Promise((resolve, reject) => {
                    let timeoutHandle;
                    const installTimeoutCheck = () => {
                        timeoutHandle = setTimeout(() => {
                            reject('timeout');
                        }, 60 * 1000);
                    };
                    const uninstallTimeoutCheck = () => {
                        clearTimeout(timeoutHandle);
                    };
                    // Wait 60s for the ready message
                    installTimeoutCheck();
                    const disposable = protocol.onMessage(msg => {
                        if (extensionHostProtocol_1.isMessageOfType(msg, 1 /* Ready */)) {
                            // 1) Extension Host is ready to receive messages, initialize it
                            uninstallTimeoutCheck();
                            this._createExtHostInitData().then(data => {
                                // Wait 60s for the initialized message
                                installTimeoutCheck();
                                protocol.send(buffer_1.VSBuffer.fromString(JSON.stringify(data)));
                            });
                            return;
                        }
                        if (extensionHostProtocol_1.isMessageOfType(msg, 0 /* Initialized */)) {
                            // 2) Extension Host is initialized
                            uninstallTimeoutCheck();
                            // stop listening for messages here
                            disposable.dispose();
                            // release this promise
                            resolve(protocol);
                            return;
                        }
                        console.error(`received unexpected message during handshake phase from the extension host: `, msg);
                    });
                });
            });
        }
        _createExtHostInitData() {
            return Promise.all([this._telemetryService.getTelemetryInfo(), this._extensions])
                .then(([telemetryInfo, extensionDescriptions]) => {
                const workspace = this._contextService.getWorkspace();
                const r = {
                    commit: product_1.default.commit,
                    version: product_1.default.version,
                    parentPid: process.pid,
                    environment: {
                        isExtensionDevelopmentDebug: this._isExtensionDevDebug,
                        appRoot: this._environmentService.appRoot ? uri_1.URI.file(this._environmentService.appRoot) : undefined,
                        appSettingsHome: this._environmentService.appSettingsHome ? this._environmentService.appSettingsHome : undefined,
                        appName: product_1.default.nameLong,
                        appUriScheme: product_1.default.urlProtocol,
                        appLanguage: platform.language,
                        extensionDevelopmentLocationURI: this._environmentService.extensionDevelopmentLocationURI,
                        extensionTestsLocationURI: this._environmentService.extensionTestsLocationURI,
                        globalStorageHome: uri_1.URI.file(this._environmentService.globalStorageHome),
                        userHome: uri_1.URI.file(this._environmentService.userHome),
                        webviewResourceRoot: this._environmentService.webviewResourceRoot,
                        webviewCspSource: this._environmentService.webviewCspSource,
                    },
                    workspace: this._contextService.getWorkbenchState() === 1 /* EMPTY */ ? undefined : {
                        configuration: types_1.withNullAsUndefined(workspace.configuration),
                        id: workspace.id,
                        name: this._labelService.getWorkspaceLabel(workspace),
                        isUntitled: workspace.configuration ? workspaces_1.isUntitledWorkspace(workspace.configuration, this._environmentService) : false
                    },
                    remote: {
                        authority: this._environmentService.configuration.remoteAuthority,
                        isRemote: false
                    },
                    resolvedExtensions: [],
                    hostExtensions: [],
                    extensions: extensionDescriptions,
                    telemetryInfo,
                    logLevel: this._logService.getLevel(),
                    logsLocation: this._extensionHostLogsLocation,
                    autoStart: this._autoStart,
                    uiKind: extHost_protocol_1.UIKind.Desktop
                };
                return r;
            });
        }
        _logExtensionHostMessage(entry) {
            if (this._isExtensionDevTestFromCli) {
                // Log on main side if running tests from cli
                remoteConsoleUtil_1.logRemoteEntry(this._logService, entry);
            }
            else {
                // Send to local console
                console_1.log(entry, 'Extension Host');
                // Broadcast to other windows if we are in development mode
                if (this._environmentService.debugExtensionHost.debugId && (!this._environmentService.isBuilt || this._isExtensionDevHost)) {
                    this._extensionHostDebugService.logToSession(this._environmentService.debugExtensionHost.debugId, entry);
                }
            }
        }
        _onExtHostProcessError(err) {
            let errorMessage = errorMessage_1.toErrorMessage(err);
            if (errorMessage === this._lastExtensionHostError) {
                return; // prevent error spam
            }
            this._lastExtensionHostError = errorMessage;
            this._notificationService.error(nls.localize('extensionHost.error', "Error from the extension host: {0}", errorMessage));
        }
        _onExtHostProcessExit(code, signal) {
            if (this._terminating) {
                // Expected termination path (we asked the process to terminate)
                return;
            }
            this._onExit.fire([code, signal]);
        }
        async enableInspectPort() {
            if (typeof this._inspectPort === 'number') {
                return true;
            }
            if (!this._extensionHostProcess) {
                return false;
            }
            if (typeof process._debugProcess === 'function') {
                // use (undocumented) _debugProcess feature of node
                process._debugProcess(this._extensionHostProcess.pid);
                await Promise.race([event_1.Event.toPromise(this._onDidSetInspectPort.event), async_1.timeout(1000)]);
                return typeof this._inspectPort === 'number';
            }
            else if (!platform.isWindows) {
                // use KILL USR1 on non-windows platforms (fallback)
                this._extensionHostProcess.kill('SIGUSR1');
                await Promise.race([event_1.Event.toPromise(this._onDidSetInspectPort.event), async_1.timeout(1000)]);
                return typeof this._inspectPort === 'number';
            }
            else {
                // not supported...
                return false;
            }
        }
        getInspectPort() {
            return types_1.withNullAsUndefined(this._inspectPort);
        }
        terminate() {
            if (this._terminating) {
                return;
            }
            this._terminating = true;
            this._toDispose.dispose();
            if (!this._messageProtocol) {
                // .start() was not called
                return;
            }
            this._messageProtocol.then((protocol) => {
                // Send the extension host a request to terminate itself
                // (graceful termination)
                protocol.send(extensionHostProtocol_1.createMessageOfType(2 /* Terminate */));
                protocol.dispose();
                // Give the extension host 10s, after which we will
                // try to kill the process and release any resources
                setTimeout(() => this._cleanResources(), 10 * 1000);
            }, (err) => {
                // Establishing a protocol with the extension host failed, so
                // try to kill the process and release any resources.
                this._cleanResources();
            });
        }
        _cleanResources() {
            if (this._namedPipeServer) {
                this._namedPipeServer.close();
                this._namedPipeServer = null;
            }
            if (this._extensionHostConnection) {
                this._extensionHostConnection.end();
                this._extensionHostConnection = null;
            }
            if (this._extensionHostProcess) {
                this._extensionHostProcess.kill();
                this._extensionHostProcess = null;
            }
        }
        _onWillShutdown(event) {
            // If the extension development host was started without debugger attached we need
            // to communicate this back to the main side to terminate the debug session
            if (this._isExtensionDevHost && !this._isExtensionDevTestFromCli && !this._isExtensionDevDebug && this._environmentService.debugExtensionHost.debugId) {
                this._extensionHostDebugService.terminateSession(this._environmentService.debugExtensionHost.debugId);
                event.join(async_1.timeout(100 /* wait a bit for IPC to get delivered */));
            }
        }
    };
    ExtensionHostProcessWorker = __decorate([
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, notification_1.INotificationService),
        __param(5, electron_1.IElectronService),
        __param(6, lifecycle_2.ILifecycleService),
        __param(7, environmentService_1.IWorkbenchEnvironmentService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, log_1.ILogService),
        __param(10, label_1.ILabelService),
        __param(11, extensionHostDebug_1.IExtensionHostDebugService),
        __param(12, host_1.IHostService)
    ], ExtensionHostProcessWorker);
    exports.ExtensionHostProcessWorker = ExtensionHostProcessWorker;
});
//# sourceMappingURL=extensionHost.js.map