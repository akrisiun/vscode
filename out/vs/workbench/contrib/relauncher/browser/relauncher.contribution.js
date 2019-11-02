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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/workbench/services/host/browser/host", "vs/platform/configuration/common/configuration", "vs/nls", "vs/platform/workspace/common/workspace", "vs/workbench/services/extensions/common/extensions", "vs/base/common/async", "vs/base/common/resources", "vs/base/common/platform", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/environment/common/environmentService", "vs/platform/product/common/productService"], function (require, exports, lifecycle_1, contributions_1, platform_1, host_1, configuration_1, nls_1, workspace_1, extensions_1, async_1, resources_1, platform_2, dialogs_1, environmentService_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let SettingsChangeRelauncher = class SettingsChangeRelauncher extends lifecycle_1.Disposable {
        constructor(hostService, configurationService, productService, dialogService) {
            super();
            this.hostService = hostService;
            this.configurationService = configurationService;
            this.productService = productService;
            this.dialogService = dialogService;
            this.onConfigurationChange(configurationService.getValue(), false);
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationChange(this.configurationService.getValue(), true)));
        }
        onConfigurationChange(config, notify) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            let changed = false;
            // Tree horizontal scrolling support
            if (typeof ((_b = (_a = config.workbench) === null || _a === void 0 ? void 0 : _a.list) === null || _b === void 0 ? void 0 : _b.horizontalScrolling) === 'boolean' && config.workbench.list.horizontalScrolling !== this.treeHorizontalScrolling) {
                this.treeHorizontalScrolling = config.workbench.list.horizontalScrolling;
                changed = true;
            }
            // Debug console word wrap
            if (typeof ((_c = config.debug) === null || _c === void 0 ? void 0 : _c.console.wordWrap) === 'boolean' && config.debug.console.wordWrap !== this.debugConsoleWordWrap) {
                this.debugConsoleWordWrap = config.debug.console.wordWrap;
                changed = true;
            }
            if (platform_2.isNative) {
                // Titlebar style
                if (typeof ((_d = config.window) === null || _d === void 0 ? void 0 : _d.titleBarStyle) === 'string' && ((_e = config.window) === null || _e === void 0 ? void 0 : _e.titleBarStyle) !== this.titleBarStyle && (config.window.titleBarStyle === 'native' || config.window.titleBarStyle === 'custom')) {
                    this.titleBarStyle = config.window.titleBarStyle;
                    changed = true;
                }
                // macOS: Native tabs
                if (platform_2.isMacintosh && typeof ((_f = config.window) === null || _f === void 0 ? void 0 : _f.nativeTabs) === 'boolean' && config.window.nativeTabs !== this.nativeTabs) {
                    this.nativeTabs = config.window.nativeTabs;
                    changed = true;
                }
                // macOS: Native fullscreen
                if (platform_2.isMacintosh && typeof ((_g = config.window) === null || _g === void 0 ? void 0 : _g.nativeFullScreen) === 'boolean' && config.window.nativeFullScreen !== this.nativeFullScreen) {
                    this.nativeFullScreen = config.window.nativeFullScreen;
                    changed = true;
                }
                // macOS: Click through (accept first mouse)
                if (platform_2.isMacintosh && typeof ((_h = config.window) === null || _h === void 0 ? void 0 : _h.clickThroughInactive) === 'boolean' && config.window.clickThroughInactive !== this.clickThroughInactive) {
                    this.clickThroughInactive = config.window.clickThroughInactive;
                    changed = true;
                }
                // Update channel
                if (typeof ((_j = config.update) === null || _j === void 0 ? void 0 : _j.mode) === 'string' && config.update.mode !== this.updateMode) {
                    this.updateMode = config.update.mode;
                    changed = true;
                }
                // Crash reporter
                if (typeof ((_k = config.telemetry) === null || _k === void 0 ? void 0 : _k.enableCrashReporter) === 'boolean' && config.telemetry.enableCrashReporter !== this.enableCrashReporter) {
                    this.enableCrashReporter = config.telemetry.enableCrashReporter;
                    changed = true;
                }
            }
            // Configuration Sync Auth
            if (typeof ((_l = config.configurationSync) === null || _l === void 0 ? void 0 : _l.enableAuth) === 'boolean' && config.configurationSync.enableAuth !== this.enableConfigSyncAuth) {
                this.enableConfigSyncAuth = config.configurationSync.enableAuth;
                changed = true;
            }
            // Notify only when changed and we are the focused window (avoids notification spam across windows)
            if (notify && changed) {
                this.doConfirm(platform_2.isNative ?
                    nls_1.localize('relaunchSettingMessage', "A setting has changed that requires a restart to take effect.") :
                    nls_1.localize('relaunchSettingMessageWeb', "A setting has changed that requires a reload to take effect."), platform_2.isNative ?
                    nls_1.localize('relaunchSettingDetail', "Press the restart button to restart {0} and enable the setting.", this.productService.nameLong) :
                    nls_1.localize('relaunchSettingDetailWeb', "Press the reload button to reload {0} and enable the setting.", this.productService.nameLong), platform_2.isNative ?
                    nls_1.localize('restart', "&&Restart") :
                    nls_1.localize('restartWeb', "&&Reload"), () => this.hostService.restart());
            }
        }
        async doConfirm(message, detail, primaryButton, confirmed) {
            if (this.hostService.hasFocus) {
                const res = await this.dialogService.confirm({ type: 'info', message, detail, primaryButton });
                if (res.confirmed) {
                    confirmed();
                }
            }
        }
    };
    SettingsChangeRelauncher = __decorate([
        __param(0, host_1.IHostService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, productService_1.IProductService),
        __param(3, dialogs_1.IDialogService)
    ], SettingsChangeRelauncher);
    exports.SettingsChangeRelauncher = SettingsChangeRelauncher;
    let WorkspaceChangeExtHostRelauncher = class WorkspaceChangeExtHostRelauncher extends lifecycle_1.Disposable {
        constructor(contextService, extensionService, hostService, environmentService) {
            super();
            this.contextService = contextService;
            this.extensionHostRestarter = this._register(new async_1.RunOnceScheduler(() => {
                if (!!environmentService.extensionTestsLocationURI) {
                    return; // no restart when in tests: see https://github.com/Microsoft/vscode/issues/66936
                }
                if (environmentService.configuration.remoteAuthority) {
                    hostService.reload(); // TODO@aeschli, workaround
                }
                else if (platform_2.isNative) {
                    extensionService.restartExtensionHost();
                }
            }, 10));
            this.contextService.getCompleteWorkspace()
                .then(workspace => {
                this.firstFolderResource = workspace.folders.length > 0 ? workspace.folders[0].uri : undefined;
                this.handleWorkbenchState();
                this._register(this.contextService.onDidChangeWorkbenchState(() => setTimeout(() => this.handleWorkbenchState())));
            });
            this._register(lifecycle_1.toDisposable(() => {
                if (this.onDidChangeWorkspaceFoldersUnbind) {
                    this.onDidChangeWorkspaceFoldersUnbind.dispose();
                }
            }));
        }
        handleWorkbenchState() {
            // React to folder changes when we are in workspace state
            if (this.contextService.getWorkbenchState() === 3 /* WORKSPACE */) {
                // Update our known first folder path if we entered workspace
                const workspace = this.contextService.getWorkspace();
                this.firstFolderResource = workspace.folders.length > 0 ? workspace.folders[0].uri : undefined;
                // Install workspace folder listener
                if (!this.onDidChangeWorkspaceFoldersUnbind) {
                    this.onDidChangeWorkspaceFoldersUnbind = this.contextService.onDidChangeWorkspaceFolders(() => this.onDidChangeWorkspaceFolders());
                }
            }
            // Ignore the workspace folder changes in EMPTY or FOLDER state
            else {
                lifecycle_1.dispose(this.onDidChangeWorkspaceFoldersUnbind);
                this.onDidChangeWorkspaceFoldersUnbind = undefined;
            }
        }
        onDidChangeWorkspaceFolders() {
            const workspace = this.contextService.getWorkspace();
            // Restart extension host if first root folder changed (impact on deprecated workspace.rootPath API)
            const newFirstFolderResource = workspace.folders.length > 0 ? workspace.folders[0].uri : undefined;
            if (!resources_1.isEqual(this.firstFolderResource, newFirstFolderResource)) {
                this.firstFolderResource = newFirstFolderResource;
                this.extensionHostRestarter.schedule(); // buffer calls to extension host restart
            }
        }
    };
    WorkspaceChangeExtHostRelauncher = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, extensions_1.IExtensionService),
        __param(2, host_1.IHostService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService)
    ], WorkspaceChangeExtHostRelauncher);
    exports.WorkspaceChangeExtHostRelauncher = WorkspaceChangeExtHostRelauncher;
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(SettingsChangeRelauncher, 3 /* Restored */);
    workbenchRegistry.registerWorkbenchContribution(WorkspaceChangeExtHostRelauncher, 3 /* Restored */);
});
//# sourceMappingURL=relauncher.contribution.js.map