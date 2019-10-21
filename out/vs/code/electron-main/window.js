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
define(["require", "exports", "vs/base/common/path", "vs/base/common/objects", "vs/nls", "vs/base/common/event", "vs/base/common/uri", "electron", "vs/platform/environment/common/environment", "vs/platform/log/common/log", "vs/platform/configuration/common/configuration", "vs/platform/environment/node/argv", "vs/platform/product/common/product", "vs/platform/windows/common/windows", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/platform/workspaces/electron-main/workspacesMainService", "vs/platform/backup/electron-main/backup", "vs/base/common/performance", "vs/platform/extensionManagement/common/extensionGalleryService", "vs/platform/theme/electron-main/themeMainService", "vs/base/common/strings", "vs/base/common/async", "vs/platform/files/common/files", "vs/platform/telemetry/common/telemetry", "vs/platform/dialogs/electron-main/dialogs", "vs/base/common/labels"], function (require, exports, path, objects, nls, event_1, uri_1, electron_1, environment_1, log_1, configuration_1, argv_1, product_1, windows_1, lifecycle_1, platform_1, workspacesMainService_1, backup_1, perf, extensionGalleryService_1, themeMainService_1, strings_1, async_1, files_1, telemetry_1, dialogs_1, labels_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const RUN_TEXTMATE_IN_WORKER = false;
    exports.defaultWindowState = function (mode = 1 /* Normal */) {
        return {
            width: 1024,
            height: 768,
            mode
        };
    };
    var WindowError;
    (function (WindowError) {
        WindowError[WindowError["UNRESPONSIVE"] = 1] = "UNRESPONSIVE";
        WindowError[WindowError["CRASHED"] = 2] = "CRASHED";
    })(WindowError || (WindowError = {}));
    let CodeWindow = class CodeWindow extends lifecycle_1.Disposable {
        constructor(config, logService, environmentService, fileService, configurationService, themeMainService, workspacesMainService, backupMainService, telemetryService, dialogMainService) {
            super();
            this.logService = logService;
            this.environmentService = environmentService;
            this.fileService = fileService;
            this.configurationService = configurationService;
            this.themeMainService = themeMainService;
            this.workspacesMainService = workspacesMainService;
            this.backupMainService = backupMainService;
            this.telemetryService = telemetryService;
            this.dialogMainService = dialogMainService;
            this._onClose = this._register(new event_1.Emitter());
            this.onClose = this._onClose.event;
            this._onDestroy = this._register(new event_1.Emitter());
            this.onDestroy = this._onDestroy.event;
            this._onLoad = this._register(new event_1.Emitter());
            this.onLoad = this._onLoad.event;
            this.touchBarGroups = [];
            this._lastFocusTime = -1;
            this._readyState = 0 /* NONE */;
            this.whenReadyCallbacks = [];
            //#region create browser window
            {
                // Load window state
                const [state, hasMultipleDisplays] = this.restoreWindowState(config.state);
                this.windowState = state;
                // in case we are maximized or fullscreen, only show later after the call to maximize/fullscreen (see below)
                const isFullscreenOrMaximized = (this.windowState.mode === 0 /* Maximized */ || this.windowState.mode === 3 /* Fullscreen */);
                const options = {
                    width: this.windowState.width,
                    height: this.windowState.height,
                    x: this.windowState.x,
                    y: this.windowState.y,
                    backgroundColor: this.themeMainService.getBackgroundColor(),
                    minWidth: CodeWindow.MIN_WIDTH,
                    minHeight: CodeWindow.MIN_HEIGHT,
                    show: !isFullscreenOrMaximized,
                    title: product_1.default.nameLong,
                    webPreferences: {
                        // By default if Code is in the background, intervals and timeouts get throttled, so we
                        // want to enforce that Code stays in the foreground. This triggers a disable_hidden_
                        // flag that Electron provides via patch:
                        // https://github.com/electron/libchromiumcontent/blob/master/patches/common/chromium/disable_hidden.patch
                        backgroundThrottling: false,
                        nodeIntegration: true,
                        nodeIntegrationInWorker: RUN_TEXTMATE_IN_WORKER,
                        webviewTag: true
                    }
                };
                if (platform_1.isLinux) {
                    options.icon = path.join(this.environmentService.appRoot, 'resources/linux/code.png'); // Windows and Mac are better off using the embedded icon(s)
                }
                const windowConfig = this.configurationService.getValue('window');
                if (platform_1.isMacintosh && !this.useNativeFullScreen()) {
                    options.fullscreenable = false; // enables simple fullscreen mode
                }
                if (platform_1.isMacintosh) {
                    options.acceptFirstMouse = true; // enabled by default
                    if (windowConfig && windowConfig.clickThroughInactive === false) {
                        options.acceptFirstMouse = false;
                    }
                }
                const useNativeTabs = platform_1.isMacintosh && windowConfig && windowConfig.nativeTabs === true;
                if (useNativeTabs) {
                    options.tabbingIdentifier = product_1.default.nameShort; // this opts in to sierra tabs
                }
                const useCustomTitleStyle = windows_1.getTitleBarStyle(this.configurationService, this.environmentService, !!config.extensionDevelopmentPath) === 'custom';
                if (useCustomTitleStyle) {
                    options.titleBarStyle = 'hidden';
                    this.hiddenTitleBarStyle = true;
                    if (!platform_1.isMacintosh) {
                        options.frame = false;
                    }
                }
                // Create the browser window.
                this._win = new electron_1.BrowserWindow(options);
                this._id = this._win.id;
                if (platform_1.isMacintosh && useCustomTitleStyle) {
                    this._win.setSheetOffset(22); // offset dialogs by the height of the custom title bar if we have any
                }
                // TODO@Ben (Electron 4 regression): when running on multiple displays where the target display
                // to open the window has a larger resolution than the primary display, the window will not size
                // correctly unless we set the bounds again (https://github.com/microsoft/vscode/issues/74872)
                //
                // However, when running with native tabs with multiple windows we cannot use this workaround
                // because there is a potential that the new window will be added as native tab instead of being
                // a window on its own. In that case calling setBounds() would cause https://github.com/microsoft/vscode/issues/75830
                if (platform_1.isMacintosh && hasMultipleDisplays && (!useNativeTabs || electron_1.BrowserWindow.getAllWindows().length === 1)) {
                    if ([this.windowState.width, this.windowState.height, this.windowState.x, this.windowState.y].every(value => typeof value === 'number')) {
                        const ensuredWindowState = this.windowState;
                        this._win.setBounds({
                            width: ensuredWindowState.width,
                            height: ensuredWindowState.height,
                            x: ensuredWindowState.x,
                            y: ensuredWindowState.y
                        });
                    }
                }
                if (isFullscreenOrMaximized) {
                    this._win.maximize();
                    if (this.windowState.mode === 3 /* Fullscreen */) {
                        this.setFullScreen(true);
                    }
                    if (!this._win.isVisible()) {
                        this._win.show(); // to reduce flicker from the default window size to maximize, we only show after maximize
                    }
                }
                this._lastFocusTime = Date.now(); // since we show directly, we need to set the last focus time too
            }
            //#endregion
            // respect configured menu bar visibility
            this.onConfigurationUpdated();
            // macOS: touch bar support
            this.createTouchBar();
            // Request handling
            this.marketplaceHeadersPromise = extensionGalleryService_1.resolveMarketplaceHeaders(product_1.default.version, this.environmentService, this.fileService);
            // Eventing
            this.registerListeners();
        }
        get config() { return this.currentConfig; }
        get id() { return this._id; }
        get win() { return this._win; }
        get hasHiddenTitleBarStyle() { return !!this.hiddenTitleBarStyle; }
        get isExtensionDevelopmentHost() { return !!(this.config && this.config.extensionDevelopmentPath); }
        get isExtensionTestHost() { return !!(this.config && this.config.extensionTestsPath); }
        setRepresentedFilename(filename) {
            if (platform_1.isMacintosh) {
                this.win.setRepresentedFilename(filename);
            }
            else {
                this.representedFilename = filename;
            }
        }
        getRepresentedFilename() {
            if (platform_1.isMacintosh) {
                return this.win.getRepresentedFilename();
            }
            return this.representedFilename;
        }
        focus() {
            if (!this._win) {
                return;
            }
            if (this._win.isMinimized()) {
                this._win.restore();
            }
            this._win.focus();
        }
        get lastFocusTime() { return this._lastFocusTime; }
        get backupPath() { return this.currentConfig ? this.currentConfig.backupPath : undefined; }
        get openedWorkspace() { return this.currentConfig ? this.currentConfig.workspace : undefined; }
        get openedFolderUri() { return this.currentConfig ? this.currentConfig.folderUri : undefined; }
        get remoteAuthority() { return this.currentConfig ? this.currentConfig.remoteAuthority : undefined; }
        setReady() {
            this._readyState = 3 /* READY */;
            // inform all waiting promises that we are ready now
            while (this.whenReadyCallbacks.length) {
                this.whenReadyCallbacks.pop()(this);
            }
        }
        ready() {
            return new Promise(resolve => {
                if (this.isReady) {
                    return resolve(this);
                }
                // otherwise keep and call later when we are ready
                this.whenReadyCallbacks.push(resolve);
            });
        }
        get isReady() {
            return this._readyState === 3 /* READY */;
        }
        get whenClosedOrLoaded() {
            return new Promise(resolve => {
                function handle() {
                    closeListener.dispose();
                    loadListener.dispose();
                    resolve();
                }
                const closeListener = this.onClose(() => handle());
                const loadListener = this.onLoad(() => handle());
            });
        }
        registerListeners() {
            // Crashes & Unrsponsive
            this._win.webContents.on('crashed', () => this.onWindowError(2 /* CRASHED */));
            this._win.on('unresponsive', () => this.onWindowError(1 /* UNRESPONSIVE */));
            // Window close
            this._win.on('closed', () => {
                this._onClose.fire();
                this.dispose();
            });
            // Prevent loading of svgs
            this._win.webContents.session.webRequest.onBeforeRequest(null, (details, callback) => {
                if (details.url.indexOf('.svg') > 0) {
                    const uri = uri_1.URI.parse(details.url);
                    if (uri && !uri.scheme.match(/file/i) && strings_1.endsWith(uri.path, '.svg')) {
                        return callback({ cancel: true });
                    }
                }
                return callback({});
            });
            this._win.webContents.session.webRequest.onHeadersReceived(null, (details, callback) => {
                const responseHeaders = details.responseHeaders;
                const contentType = (responseHeaders['content-type'] || responseHeaders['Content-Type']);
                if (contentType && Array.isArray(contentType) && contentType.some(x => x.toLowerCase().indexOf('image/svg') >= 0)) {
                    return callback({ cancel: true });
                }
                return callback({ cancel: false, responseHeaders });
            });
            // Remember that we loaded
            this._win.webContents.on('did-finish-load', () => {
                this._readyState = 1 /* LOADING */;
                // Associate properties from the load request if provided
                if (this.pendingLoadConfig) {
                    this.currentConfig = this.pendingLoadConfig;
                    this.pendingLoadConfig = undefined;
                }
            });
            // Window Focus
            this._win.on('focus', () => {
                this._lastFocusTime = Date.now();
            });
            // Simple fullscreen doesn't resize automatically when the resolution changes so as a workaround
            // we need to detect when display metrics change or displays are added/removed and toggle the
            // fullscreen manually.
            if (platform_1.isMacintosh) {
                const simpleFullScreenScheduler = this._register(new async_1.RunOnceScheduler(() => {
                    if (!this._win) {
                        return; // disposed
                    }
                    if (!this.useNativeFullScreen() && this.isFullScreen) {
                        this.setFullScreen(false);
                        this.setFullScreen(true);
                    }
                }, 100));
                const displayChangedListener = () => simpleFullScreenScheduler.schedule();
                electron_1.screen.on('display-metrics-changed', displayChangedListener);
                this._register(lifecycle_1.toDisposable(() => electron_1.screen.removeListener('display-metrics-changed', displayChangedListener)));
                electron_1.screen.on('display-added', displayChangedListener);
                this._register(lifecycle_1.toDisposable(() => electron_1.screen.removeListener('display-added', displayChangedListener)));
                electron_1.screen.on('display-removed', displayChangedListener);
                this._register(lifecycle_1.toDisposable(() => electron_1.screen.removeListener('display-removed', displayChangedListener)));
            }
            // Window (Un)Maximize
            this._win.on('maximize', (e) => {
                if (this.currentConfig) {
                    this.currentConfig.maximized = true;
                }
                electron_1.app.emit('browser-window-maximize', e, this._win);
            });
            this._win.on('unmaximize', (e) => {
                if (this.currentConfig) {
                    this.currentConfig.maximized = false;
                }
                electron_1.app.emit('browser-window-unmaximize', e, this._win);
            });
            // Window Fullscreen
            this._win.on('enter-full-screen', () => {
                this.sendWhenReady('vscode:enterFullScreen');
            });
            this._win.on('leave-full-screen', () => {
                this.sendWhenReady('vscode:leaveFullScreen');
            });
            // Window Failed to load
            this._win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
                this.logService.warn('[electron event]: fail to load, ', errorDescription);
            });
            // Handle configuration changes
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated()));
            // Handle Workspace events
            this._register(this.workspacesMainService.onUntitledWorkspaceDeleted(e => this.onUntitledWorkspaceDeleted(e)));
            // Inject headers when requests are incoming
            const urls = ['https://marketplace.visualstudio.com/*', 'https://*.vsassets.io/*'];
            this._win.webContents.session.webRequest.onBeforeSendHeaders({ urls }, (details, cb) => {
                this.marketplaceHeadersPromise.then(headers => {
                    const requestHeaders = objects.assign(details.requestHeaders, headers);
                    if (!this.configurationService.getValue('extensions.disableExperimentalAzureSearch')) {
                        requestHeaders['Cookie'] = `${requestHeaders['Cookie'] ? requestHeaders['Cookie'] + ';' : ''}EnableExternalSearchForVSCode=true`;
                    }
                    cb({ cancel: false, requestHeaders });
                });
            });
        }
        onWindowError(error) {
            this.logService.error(error === 2 /* CRASHED */ ? '[VS Code]: render process crashed!' : '[VS Code]: detected unresponsive');
            this.telemetryService.publicLog2('windowerror', { type: error });
            // Unresponsive
            if (error === 1 /* UNRESPONSIVE */) {
                if (this.isExtensionDevelopmentHost || this.isExtensionTestHost || (this._win && this._win.webContents && this._win.webContents.isDevToolsOpened())) {
                    // TODO@Ben Workaround for https://github.com/Microsoft/vscode/issues/56994
                    // In certain cases the window can report unresponsiveness because a breakpoint was hit
                    // and the process is stopped executing. The most typical cases are:
                    // - devtools are opened and debugging happens
                    // - window is an extensions development host that is being debugged
                    // - window is an extension test development host that is being debugged
                    return;
                }
                // Show Dialog
                this.dialogMainService.showMessageBox({
                    title: product_1.default.nameLong,
                    type: 'warning',
                    buttons: [labels_1.mnemonicButtonLabel(nls.localize({ key: 'reopen', comment: ['&& denotes a mnemonic'] }, "&&Reopen")), labels_1.mnemonicButtonLabel(nls.localize({ key: 'wait', comment: ['&& denotes a mnemonic'] }, "&&Keep Waiting")), labels_1.mnemonicButtonLabel(nls.localize({ key: 'close', comment: ['&& denotes a mnemonic'] }, "&&Close"))],
                    message: nls.localize('appStalled', "The window is no longer responding"),
                    detail: nls.localize('appStalledDetail', "You can reopen or close the window or keep waiting."),
                    noLink: true
                }, this._win).then(result => {
                    if (!this._win) {
                        return; // Return early if the window has been going down already
                    }
                    if (result.response === 0) {
                        this.reload();
                    }
                    else if (result.response === 2) {
                        this.destroyWindow();
                    }
                });
            }
            // Crashed
            else {
                this.dialogMainService.showMessageBox({
                    title: product_1.default.nameLong,
                    type: 'warning',
                    buttons: [labels_1.mnemonicButtonLabel(nls.localize({ key: 'reopen', comment: ['&& denotes a mnemonic'] }, "&&Reopen")), labels_1.mnemonicButtonLabel(nls.localize({ key: 'close', comment: ['&& denotes a mnemonic'] }, "&&Close"))],
                    message: nls.localize('appCrashed', "The window has crashed"),
                    detail: nls.localize('appCrashedDetail', "We are sorry for the inconvenience! You can reopen the window to continue where you left off."),
                    noLink: true
                }, this._win).then(result => {
                    if (!this._win) {
                        return; // Return early if the window has been going down already
                    }
                    if (result.response === 0) {
                        this.reload();
                    }
                    else if (result.response === 1) {
                        this.destroyWindow();
                    }
                });
            }
        }
        destroyWindow() {
            this._onDestroy.fire(); // 'close' event will not be fired on destroy(), so signal crash via explicit event
            this._win.destroy(); // make sure to destroy the window as it has crashed
        }
        onUntitledWorkspaceDeleted(workspace) {
            // Make sure to update our workspace config if we detect that it
            // was deleted
            if (this.openedWorkspace && this.openedWorkspace.id === workspace.id && this.currentConfig) {
                this.currentConfig.workspace = undefined;
            }
        }
        onConfigurationUpdated() {
            const newMenuBarVisibility = this.getMenuBarVisibility();
            if (newMenuBarVisibility !== this.currentMenuBarVisibility) {
                this.currentMenuBarVisibility = newMenuBarVisibility;
                this.setMenuBarVisibility(newMenuBarVisibility);
            }
        }
        addTabbedWindow(window) {
            if (platform_1.isMacintosh) {
                this._win.addTabbedWindow(window.win);
            }
        }
        load(config, isReload, disableExtensions) {
            // If this is the first time the window is loaded, we associate the paths
            // directly with the window because we assume the loading will just work
            if (this._readyState === 0 /* NONE */) {
                this.currentConfig = config;
            }
            // Otherwise, the window is currently showing a folder and if there is an
            // unload handler preventing the load, we cannot just associate the paths
            // because the loading might be vetoed. Instead we associate it later when
            // the window load event has fired.
            else {
                this.pendingLoadConfig = config;
                this._readyState = 2 /* NAVIGATING */;
            }
            // Add disable-extensions to the config, but do not preserve it on currentConfig or
            // pendingLoadConfig so that it is applied only on this load
            const configuration = objects.assign({}, config);
            if (disableExtensions !== undefined) {
                configuration['disable-extensions'] = disableExtensions;
            }
            // Clear Document Edited if needed
            if (platform_1.isMacintosh && this._win.isDocumentEdited()) {
                if (!isReload || !this.backupMainService.isHotExitEnabled()) {
                    this._win.setDocumentEdited(false);
                }
            }
            // Clear Title and Filename if needed
            if (!isReload) {
                if (this.getRepresentedFilename()) {
                    this.setRepresentedFilename('');
                }
                this._win.setTitle(product_1.default.nameLong);
            }
            // Load URL
            perf.mark('main:loadWindow');
            this._win.loadURL(this.getUrl(configuration));
            // Make window visible if it did not open in N seconds because this indicates an error
            // Only do this when running out of sources and not when running tests
            if (!this.environmentService.isBuilt && !this.environmentService.extensionTestsLocationURI) {
                this.showTimeoutHandle = setTimeout(() => {
                    if (this._win && !this._win.isVisible() && !this._win.isMinimized()) {
                        this._win.show();
                        this._win.focus();
                        this._win.webContents.openDevTools();
                    }
                }, 10000);
            }
            // Event
            this._onLoad.fire();
        }
        reload(configurationIn, cli) {
            // If config is not provided, copy our current one
            const configuration = configurationIn ? configurationIn : objects.mixin({}, this.currentConfig);
            // Delete some properties we do not want during reload
            delete configuration.filesToOpenOrCreate;
            delete configuration.filesToDiff;
            delete configuration.filesToWait;
            // Some configuration things get inherited if the window is being reloaded and we are
            // in extension development mode. These options are all development related.
            if (this.isExtensionDevelopmentHost && cli) {
                configuration.verbose = cli.verbose;
                configuration['inspect-extensions'] = cli['inspect-extensions'];
                configuration['inspect-brk-extensions'] = cli['inspect-brk-extensions'];
                configuration.debugId = cli.debugId;
                configuration['extensions-dir'] = cli['extensions-dir'];
            }
            configuration.isInitialStartup = false; // since this is a reload
            // Load config
            const disableExtensions = cli ? cli['disable-extensions'] : undefined;
            this.load(configuration, true, disableExtensions);
        }
        getUrl(windowConfiguration) {
            // Set window ID
            windowConfiguration.windowId = this._win.id;
            windowConfiguration.logLevel = this.logService.getLevel();
            // Set zoomlevel
            const windowConfig = this.configurationService.getValue('window');
            const zoomLevel = windowConfig && windowConfig.zoomLevel;
            if (typeof zoomLevel === 'number') {
                windowConfiguration.zoomLevel = zoomLevel;
            }
            // Set fullscreen state
            windowConfiguration.fullscreen = this.isFullScreen;
            // Set Accessibility Config
            let autoDetectHighContrast = true;
            if (windowConfig && windowConfig.autoDetectHighContrast === false) {
                autoDetectHighContrast = false;
            }
            windowConfiguration.highContrast = platform_1.isWindows && autoDetectHighContrast && electron_1.systemPreferences.isInvertedColorScheme();
            windowConfiguration.accessibilitySupport = electron_1.app.accessibilitySupportEnabled;
            // Title style related
            windowConfiguration.maximized = this._win.isMaximized();
            windowConfiguration.frameless = this.hasHiddenTitleBarStyle && !platform_1.isMacintosh;
            // Dump Perf Counters
            windowConfiguration.perfEntries = perf.exportEntries();
            // Parts splash
            windowConfiguration.partsSplashPath = path.join(this.environmentService.userDataPath, 'rapid_render.json');
            // Config (combination of process.argv and window configuration)
            const environment = argv_1.parseArgs(process.argv, argv_1.OPTIONS);
            const config = objects.assign(environment, windowConfiguration);
            for (const key in config) {
                const configValue = config[key];
                if (configValue === undefined || configValue === null || configValue === '' || configValue === false) {
                    delete config[key]; // only send over properties that have a true value
                }
            }
            // In the unlikely event of the URL becoming larger than 2MB, remove parts of
            // it that are not under our control. Mainly, the user environment can be very
            // large depending on user configuration, so we can only remove it in that case.
            let configUrl = this.doGetUrl(config);
            if (configUrl.length > CodeWindow.MAX_URL_LENGTH) {
                delete config.userEnv;
                this.logService.warn('Application URL exceeds maximum of 2MB and was shortened.');
                configUrl = this.doGetUrl(config);
                if (configUrl.length > CodeWindow.MAX_URL_LENGTH) {
                    this.logService.error('Application URL exceeds maximum of 2MB and cannot be loaded.');
                }
            }
            return configUrl;
        }
        doGetUrl(config) {
            return `${require.toUrl('vs/code/electron-browser/workbench/workbench.html')}?config=${encodeURIComponent(JSON.stringify(config))}`;
        }
        serializeWindowState() {
            if (!this._win) {
                return exports.defaultWindowState();
            }
            // fullscreen gets special treatment
            if (this.isFullScreen) {
                const display = electron_1.screen.getDisplayMatching(this.getBounds());
                const defaultState = exports.defaultWindowState();
                const res = {
                    mode: 3 /* Fullscreen */,
                    display: display ? display.id : undefined,
                    // Still carry over window dimensions from previous sessions
                    // if we can compute it in fullscreen state.
                    // does not seem possible in all cases on Linux for example
                    // (https://github.com/Microsoft/vscode/issues/58218) so we
                    // fallback to the defaults in that case.
                    width: this.windowState.width || defaultState.width,
                    height: this.windowState.height || defaultState.height,
                    x: this.windowState.x || 0,
                    y: this.windowState.y || 0
                };
                return res;
            }
            const state = Object.create(null);
            let mode;
            // get window mode
            if (!platform_1.isMacintosh && this._win.isMaximized()) {
                mode = 0 /* Maximized */;
            }
            else {
                mode = 1 /* Normal */;
            }
            // we don't want to save minimized state, only maximized or normal
            if (mode === 0 /* Maximized */) {
                state.mode = 0 /* Maximized */;
            }
            else {
                state.mode = 1 /* Normal */;
            }
            // only consider non-minimized window states
            if (mode === 1 /* Normal */ || mode === 0 /* Maximized */) {
                let bounds;
                if (mode === 1 /* Normal */) {
                    bounds = this.getBounds();
                }
                else {
                    bounds = this._win.getNormalBounds(); // make sure to persist the normal bounds when maximized to be able to restore them
                }
                state.x = bounds.x;
                state.y = bounds.y;
                state.width = bounds.width;
                state.height = bounds.height;
            }
            return state;
        }
        restoreWindowState(state) {
            let hasMultipleDisplays = false;
            if (state) {
                try {
                    const displays = electron_1.screen.getAllDisplays();
                    hasMultipleDisplays = displays.length > 1;
                    state = this.validateWindowState(state, displays);
                }
                catch (err) {
                    this.logService.warn(`Unexpected error validating window state: ${err}\n${err.stack}`); // somehow display API can be picky about the state to validate
                }
            }
            return [state || exports.defaultWindowState(), hasMultipleDisplays];
        }
        validateWindowState(state, displays) {
            if (typeof state.x !== 'number'
                || typeof state.y !== 'number'
                || typeof state.width !== 'number'
                || typeof state.height !== 'number') {
                return undefined;
            }
            if (state.width <= 0 || state.height <= 0) {
                return undefined;
            }
            // Single Monitor: be strict about x/y positioning
            if (displays.length === 1) {
                const displayWorkingArea = this.getWorkingArea(displays[0]);
                if (displayWorkingArea) {
                    if (state.x < displayWorkingArea.x) {
                        state.x = displayWorkingArea.x; // prevent window from falling out of the screen to the left
                    }
                    if (state.y < displayWorkingArea.y) {
                        state.y = displayWorkingArea.y; // prevent window from falling out of the screen to the top
                    }
                    if (state.x > (displayWorkingArea.x + displayWorkingArea.width)) {
                        state.x = displayWorkingArea.x; // prevent window from falling out of the screen to the right
                    }
                    if (state.y > (displayWorkingArea.y + displayWorkingArea.height)) {
                        state.y = displayWorkingArea.y; // prevent window from falling out of the screen to the bottom
                    }
                    if (state.width > displayWorkingArea.width) {
                        state.width = displayWorkingArea.width; // prevent window from exceeding display bounds width
                    }
                    if (state.height > displayWorkingArea.height) {
                        state.height = displayWorkingArea.height; // prevent window from exceeding display bounds height
                    }
                }
                return state;
            }
            // Multi Montior (fullscreen): try to find the previously used display
            if (state.display && state.mode === 3 /* Fullscreen */) {
                const display = displays.filter(d => d.id === state.display)[0];
                if (display && display.bounds && typeof display.bounds.x === 'number' && typeof display.bounds.y === 'number') {
                    const defaults = exports.defaultWindowState(3 /* Fullscreen */); // make sure we have good values when the user restores the window
                    defaults.x = display.bounds.x; // carefull to use displays x/y position so that the window ends up on the correct monitor
                    defaults.y = display.bounds.y;
                    return defaults;
                }
            }
            // Multi Monitor (non-fullscreen): be less strict because metrics can be crazy
            const bounds = { x: state.x, y: state.y, width: state.width, height: state.height };
            const display = electron_1.screen.getDisplayMatching(bounds);
            const displayWorkingArea = this.getWorkingArea(display);
            if (display && // we have a display matching the desired bounds
                displayWorkingArea && // we have valid working area bounds
                bounds.x < displayWorkingArea.x + displayWorkingArea.width && // prevent window from falling out of the screen to the right
                bounds.y < displayWorkingArea.y + displayWorkingArea.height && // prevent window from falling out of the screen to the bottom
                bounds.x + bounds.width > displayWorkingArea.x && // prevent window from falling out of the screen to the left
                bounds.y + bounds.height > displayWorkingArea.y // prevent window from falling out of the scree nto the top
            ) {
                return state;
            }
            return undefined;
        }
        getWorkingArea(display) {
            // Prefer the working area of the display to account for taskbars on the
            // desktop being positioned somewhere (https://github.com/Microsoft/vscode/issues/50830).
            //
            // Linux X11 sessions sometimes report wrong display bounds, so we validate
            // the reported sizes are positive.
            if (display.workArea.width > 0 && display.workArea.height > 0) {
                return display.workArea;
            }
            if (display.bounds.width > 0 && display.bounds.height > 0) {
                return display.bounds;
            }
            return undefined;
        }
        getBounds() {
            const pos = this._win.getPosition();
            const dimension = this._win.getSize();
            return { x: pos[0], y: pos[1], width: dimension[0], height: dimension[1] };
        }
        toggleFullScreen() {
            this.setFullScreen(!this.isFullScreen);
        }
        setFullScreen(fullscreen) {
            // Set fullscreen state
            if (this.useNativeFullScreen()) {
                this.setNativeFullScreen(fullscreen);
            }
            else {
                this.setSimpleFullScreen(fullscreen);
            }
            // Events
            this.sendWhenReady(fullscreen ? 'vscode:enterFullScreen' : 'vscode:leaveFullScreen');
            // Respect configured menu bar visibility or default to toggle if not set
            if (this.currentMenuBarVisibility) {
                this.setMenuBarVisibility(this.currentMenuBarVisibility, false);
            }
        }
        get isFullScreen() { return this._win.isFullScreen() || this._win.isSimpleFullScreen(); }
        setNativeFullScreen(fullscreen) {
            if (this._win.isSimpleFullScreen()) {
                this._win.setSimpleFullScreen(false);
            }
            this._win.setFullScreen(fullscreen);
        }
        setSimpleFullScreen(fullscreen) {
            if (this._win.isFullScreen()) {
                this._win.setFullScreen(false);
            }
            this._win.setSimpleFullScreen(fullscreen);
            this._win.webContents.focus(); // workaround issue where focus is not going into window
        }
        useNativeFullScreen() {
            const windowConfig = this.configurationService.getValue('window');
            if (!windowConfig || typeof windowConfig.nativeFullScreen !== 'boolean') {
                return true; // default
            }
            if (windowConfig.nativeTabs) {
                return true; // https://github.com/electron/electron/issues/16142
            }
            return windowConfig.nativeFullScreen !== false;
        }
        isMinimized() {
            return this._win.isMinimized();
        }
        getMenuBarVisibility() {
            const windowConfig = this.configurationService.getValue('window');
            if (!windowConfig || !windowConfig.menuBarVisibility) {
                return 'default';
            }
            let menuBarVisibility = windowConfig.menuBarVisibility;
            if (['visible', 'toggle', 'hidden'].indexOf(menuBarVisibility) < 0) {
                menuBarVisibility = 'default';
            }
            return menuBarVisibility;
        }
        setMenuBarVisibility(visibility, notify = true) {
            if (platform_1.isMacintosh) {
                return; // ignore for macOS platform
            }
            if (visibility === 'toggle') {
                if (notify) {
                    this.send('vscode:showInfoMessage', nls.localize('hiddenMenuBar', "You can still access the menu bar by pressing the Alt-key."));
                }
            }
            if (visibility === 'hidden') {
                // for some weird reason that I have no explanation for, the menu bar is not hiding when calling
                // this without timeout (see https://github.com/Microsoft/vscode/issues/19777). there seems to be
                // a timing issue with us opening the first window and the menu bar getting created. somehow the
                // fact that we want to hide the menu without being able to bring it back via Alt key makes Electron
                // still show the menu. Unable to reproduce from a simple Hello World application though...
                setTimeout(() => {
                    this.doSetMenuBarVisibility(visibility);
                });
            }
            else {
                this.doSetMenuBarVisibility(visibility);
            }
        }
        doSetMenuBarVisibility(visibility) {
            const isFullscreen = this.isFullScreen;
            switch (visibility) {
                case ('default'):
                    this._win.setMenuBarVisibility(!isFullscreen);
                    this._win.setAutoHideMenuBar(isFullscreen);
                    break;
                case ('visible'):
                    this._win.setMenuBarVisibility(true);
                    this._win.setAutoHideMenuBar(false);
                    break;
                case ('toggle'):
                    this._win.setMenuBarVisibility(false);
                    this._win.setAutoHideMenuBar(true);
                    break;
                case ('hidden'):
                    this._win.setMenuBarVisibility(false);
                    this._win.setAutoHideMenuBar(false);
                    break;
            }
        }
        handleTitleDoubleClick() {
            // Respect system settings on mac with regards to title click on windows title
            if (platform_1.isMacintosh) {
                const action = electron_1.systemPreferences.getUserDefault('AppleActionOnDoubleClick', 'string');
                switch (action) {
                    case 'Minimize':
                        this.win.minimize();
                        break;
                    case 'None':
                        break;
                    case 'Maximize':
                    default:
                        if (this.win.isMaximized()) {
                            this.win.unmaximize();
                        }
                        else {
                            this.win.maximize();
                        }
                }
            }
            // Linux/Windows: just toggle maximize/minimized state
            else {
                if (this.win.isMaximized()) {
                    this.win.unmaximize();
                }
                else {
                    this.win.maximize();
                }
            }
        }
        close() {
            if (this._win) {
                this._win.close();
            }
        }
        sendWhenReady(channel, ...args) {
            if (this.isReady) {
                this.send(channel, ...args);
            }
            else {
                this.ready().then(() => this.send(channel, ...args));
            }
        }
        send(channel, ...args) {
            if (this._win) {
                this._win.webContents.send(channel, ...args);
            }
        }
        updateTouchBar(groups) {
            if (!platform_1.isMacintosh) {
                return; // only supported on macOS
            }
            // Update segments for all groups. Setting the segments property
            // of the group directly prevents ugly flickering from happening
            this.touchBarGroups.forEach((touchBarGroup, index) => {
                const commands = groups[index];
                touchBarGroup.segments = this.createTouchBarGroupSegments(commands);
            });
        }
        createTouchBar() {
            if (!platform_1.isMacintosh) {
                return; // only supported on macOS
            }
            // To avoid flickering, we try to reuse the touch bar group
            // as much as possible by creating a large number of groups
            // for reusing later.
            for (let i = 0; i < 10; i++) {
                const groupTouchBar = this.createTouchBarGroup();
                this.touchBarGroups.push(groupTouchBar);
            }
            this._win.setTouchBar(new electron_1.TouchBar({ items: this.touchBarGroups }));
        }
        createTouchBarGroup(items = []) {
            // Group Segments
            const segments = this.createTouchBarGroupSegments(items);
            // Group Control
            const control = new electron_1.TouchBar.TouchBarSegmentedControl({
                segments,
                mode: 'buttons',
                segmentStyle: 'automatic',
                change: (selectedIndex) => {
                    this.sendWhenReady('vscode:runAction', { id: control.segments[selectedIndex].id, from: 'touchbar' });
                }
            });
            return control;
        }
        createTouchBarGroupSegments(items = []) {
            const segments = items.map(item => {
                let icon;
                if (item.iconLocation && item.iconLocation.dark.scheme === 'file') {
                    icon = electron_1.nativeImage.createFromPath(uri_1.URI.revive(item.iconLocation.dark).fsPath);
                    if (icon.isEmpty()) {
                        icon = undefined;
                    }
                }
                let title;
                if (typeof item.title === 'string') {
                    title = item.title;
                }
                else {
                    title = item.title.value;
                }
                return {
                    id: item.id,
                    label: !icon ? title : undefined,
                    icon
                };
            });
            return segments;
        }
        dispose() {
            super.dispose();
            if (this.showTimeoutHandle) {
                clearTimeout(this.showTimeoutHandle);
            }
            this._win = null; // Important to dereference the window object to allow for GC
        }
    };
    CodeWindow.MIN_WIDTH = 600;
    CodeWindow.MIN_HEIGHT = 600;
    CodeWindow.MAX_URL_LENGTH = 2 * 1024 * 1024; // https://cs.chromium.org/chromium/src/url/url_constants.cc?l=32
    CodeWindow = __decorate([
        __param(1, log_1.ILogService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, files_1.IFileService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, themeMainService_1.IThemeMainService),
        __param(6, workspacesMainService_1.IWorkspacesMainService),
        __param(7, backup_1.IBackupMainService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, dialogs_1.IDialogMainService)
    ], CodeWindow);
    exports.CodeWindow = CodeWindow;
});
//# sourceMappingURL=window.js.map