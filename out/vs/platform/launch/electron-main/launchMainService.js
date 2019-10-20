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
define(["require", "exports", "vs/platform/log/common/log", "vs/platform/url/common/url", "vs/base/common/platform", "vs/platform/environment/common/environment", "vs/platform/instantiation/common/instantiation", "vs/platform/windows/electron-main/windows", "vs/base/node/pfs", "vs/platform/workspaces/electron-main/workspacesMainService", "vs/platform/configuration/common/configuration", "vs/base/common/uri", "electron", "vs/base/common/arrays"], function (require, exports, log_1, url_1, platform_1, environment_1, instantiation_1, windows_1, pfs_1, workspacesMainService_1, configuration_1, uri_1, electron_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ID = 'launchMainService';
    exports.ILaunchMainService = instantiation_1.createDecorator(exports.ID);
    function parseOpenUrl(args) {
        if (args['open-url'] && args._urls && args._urls.length > 0) {
            // --open-url must contain -- followed by the url(s)
            // process.argv is used over args._ as args._ are resolved to file paths at this point
            return arrays_1.coalesce(args._urls
                .map(url => {
                try {
                    return uri_1.URI.parse(url);
                }
                catch (err) {
                    return null;
                }
            }));
        }
        return [];
    }
    let LaunchMainService = class LaunchMainService {
        constructor(logService, windowsMainService, urlService, workspacesMainService, environmentService, configurationService) {
            this.logService = logService;
            this.windowsMainService = windowsMainService;
            this.urlService = urlService;
            this.workspacesMainService = workspacesMainService;
            this.environmentService = environmentService;
            this.configurationService = configurationService;
        }
        start(args, userEnv) {
            this.logService.trace('Received data from other instance: ', args, userEnv);
            const urlsToOpen = parseOpenUrl(args);
            // Check early for open-url which is handled in URL service
            if (urlsToOpen.length) {
                let whenWindowReady = Promise.resolve(null);
                // Create a window if there is none
                if (this.windowsMainService.getWindowCount() === 0) {
                    const window = this.windowsMainService.openEmptyWindow(4 /* DESKTOP */)[0];
                    whenWindowReady = window.ready();
                }
                // Make sure a window is open, ready to receive the url event
                whenWindowReady.then(() => {
                    for (const url of urlsToOpen) {
                        this.urlService.open(url);
                    }
                });
                return Promise.resolve(undefined);
            }
            // Otherwise handle in windows service
            return this.startOpenWindow(args, userEnv);
        }
        startOpenWindow(args, userEnv) {
            const context = !!userEnv['VSCODE_CLI'] ? 0 /* CLI */ : 4 /* DESKTOP */;
            let usedWindows = [];
            const waitMarkerFileURI = args.wait && args.waitMarkerFilePath ? uri_1.URI.file(args.waitMarkerFilePath) : undefined;
            // Special case extension development
            if (!!args.extensionDevelopmentPath) {
                this.windowsMainService.openExtensionDevelopmentHostWindow(args.extensionDevelopmentPath, { context, cli: args, userEnv, waitMarkerFileURI });
            }
            // Start without file/folder arguments
            else if (!args._.length && !args['folder-uri'] && !args['file-uri']) {
                let openNewWindow = false;
                // Force new window
                if (args['new-window'] || args['unity-launch']) {
                    openNewWindow = true;
                }
                // Force reuse window
                else if (args['reuse-window']) {
                    openNewWindow = false;
                }
                // Otherwise check for settings
                else {
                    const windowConfig = this.configurationService.getValue('window');
                    const openWithoutArgumentsInNewWindowConfig = (windowConfig && windowConfig.openWithoutArgumentsInNewWindow) || 'default' /* default */;
                    switch (openWithoutArgumentsInNewWindowConfig) {
                        case 'on':
                            openNewWindow = true;
                            break;
                        case 'off':
                            openNewWindow = false;
                            break;
                        default:
                            openNewWindow = !platform_1.isMacintosh; // prefer to restore running instance on macOS
                    }
                }
                // Open new Window
                if (openNewWindow) {
                    usedWindows = this.windowsMainService.open({
                        context,
                        cli: args,
                        userEnv,
                        forceNewWindow: true,
                        forceEmpty: true,
                        waitMarkerFileURI
                    });
                }
                // Focus existing window or open if none opened
                else {
                    const lastActive = this.windowsMainService.getLastActiveWindow();
                    if (lastActive) {
                        lastActive.focus();
                        usedWindows = [lastActive];
                    }
                    else {
                        usedWindows = this.windowsMainService.open({ context, cli: args, forceEmpty: true });
                    }
                }
            }
            // Start with file/folder arguments
            else {
                usedWindows = this.windowsMainService.open({
                    context,
                    cli: args,
                    userEnv,
                    forceNewWindow: args['new-window'],
                    preferNewWindow: !args['reuse-window'] && !args.wait,
                    forceReuseWindow: args['reuse-window'],
                    diffMode: args.diff,
                    addMode: args.add,
                    noRecentEntry: !!args['skip-add-to-recently-opened'],
                    waitMarkerFileURI,
                    gotoLineMode: args.goto
                });
            }
            // If the other instance is waiting to be killed, we hook up a window listener if one window
            // is being used and only then resolve the startup promise which will kill this second instance.
            // In addition, we poll for the wait marker file to be deleted to return.
            if (waitMarkerFileURI && usedWindows.length === 1 && usedWindows[0]) {
                return Promise.race([
                    usedWindows[0].whenClosedOrLoaded,
                    pfs_1.whenDeleted(waitMarkerFileURI.fsPath)
                ]).then(() => undefined, () => undefined);
            }
            return Promise.resolve(undefined);
        }
        getMainProcessId() {
            this.logService.trace('Received request for process ID from other instance.');
            return Promise.resolve(process.pid);
        }
        getMainProcessInfo() {
            this.logService.trace('Received request for main process info from other instance.');
            const windows = [];
            electron_1.BrowserWindow.getAllWindows().forEach(window => {
                const codeWindow = this.windowsMainService.getWindowById(window.id);
                if (codeWindow) {
                    windows.push(this.codeWindowToInfo(codeWindow));
                }
                else {
                    windows.push(this.browserWindowToInfo(window));
                }
            });
            return Promise.resolve({
                mainPID: process.pid,
                mainArguments: process.argv.slice(1),
                windows,
                screenReader: !!electron_1.app.accessibilitySupportEnabled,
                gpuFeatureStatus: electron_1.app.getGPUFeatureStatus()
            });
        }
        getLogsPath() {
            this.logService.trace('Received request for logs path from other instance.');
            return Promise.resolve(this.environmentService.logsPath);
        }
        getRemoteDiagnostics(options) {
            const windows = this.windowsMainService.getWindows();
            const promises = windows.map(window => {
                return new Promise((resolve, reject) => {
                    const remoteAuthority = window.remoteAuthority;
                    if (remoteAuthority) {
                        const replyChannel = `vscode:getDiagnosticInfoResponse${window.id}`;
                        const args = {
                            includeProcesses: options.includeProcesses,
                            folders: options.includeWorkspaceMetadata ? this.getFolderURIs(window) : undefined
                        };
                        window.sendWhenReady('vscode:getDiagnosticInfo', { replyChannel, args });
                        electron_1.ipcMain.once(replyChannel, (_, data) => {
                            // No data is returned if getting the connection fails.
                            if (!data) {
                                resolve({ hostName: remoteAuthority, errorMessage: `Unable to resolve connection to '${remoteAuthority}'.` });
                            }
                            resolve(data);
                        });
                        setTimeout(() => {
                            resolve({ hostName: remoteAuthority, errorMessage: `Fetching remote diagnostics for '${remoteAuthority}' timed out.` });
                        }, 5000);
                    }
                    else {
                        resolve();
                    }
                });
            });
            return Promise.all(promises).then(diagnostics => diagnostics.filter((x) => !!x));
        }
        getFolderURIs(window) {
            const folderURIs = [];
            if (window.openedFolderUri) {
                folderURIs.push(window.openedFolderUri);
            }
            else if (window.openedWorkspace) {
                // workspace folders can only be shown for local workspaces
                const workspaceConfigPath = window.openedWorkspace.configPath;
                const resolvedWorkspace = this.workspacesMainService.resolveLocalWorkspaceSync(workspaceConfigPath);
                if (resolvedWorkspace) {
                    const rootFolders = resolvedWorkspace.folders;
                    rootFolders.forEach(root => {
                        folderURIs.push(root.uri);
                    });
                }
                else {
                    //TODO: can we add the workspace file here?
                }
            }
            return folderURIs;
        }
        codeWindowToInfo(window) {
            const folderURIs = this.getFolderURIs(window);
            return this.browserWindowToInfo(window.win, folderURIs, window.remoteAuthority);
        }
        browserWindowToInfo(win, folderURIs = [], remoteAuthority) {
            return {
                pid: win.webContents.getOSProcessId(),
                title: win.getTitle(),
                folderURIs,
                remoteAuthority
            };
        }
    };
    LaunchMainService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, windows_1.IWindowsMainService),
        __param(2, url_1.IURLService),
        __param(3, workspacesMainService_1.IWorkspacesMainService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, configuration_1.IConfigurationService)
    ], LaunchMainService);
    exports.LaunchMainService = LaunchMainService;
});
//# sourceMappingURL=launchMainService.js.map