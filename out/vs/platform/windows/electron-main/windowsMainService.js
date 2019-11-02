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
define(["require", "exports", "fs", "vs/base/common/path", "vs/nls", "vs/base/common/arrays", "vs/base/common/objects", "vs/platform/backup/electron-main/backup", "vs/platform/environment/common/environment", "vs/platform/state/node/state", "vs/code/electron-main/window", "electron", "vs/code/node/paths", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/windows/common/windows", "vs/platform/windows/node/window", "vs/base/common/event", "vs/platform/product/common/product", "vs/platform/workspaces/electron-main/workspacesHistoryMainService", "vs/base/common/platform", "vs/platform/workspaces/common/workspaces", "vs/platform/instantiation/common/instantiation", "vs/base/common/network", "vs/base/common/uri", "vs/base/common/resources", "vs/platform/remote/common/remoteHosts", "vs/platform/windows/electron-main/windowsStateStorage", "vs/platform/workspaces/electron-main/workspacesMainService", "vs/base/common/functional", "vs/base/common/lifecycle", "vs/platform/dialogs/electron-main/dialogs", "vs/base/common/types", "vs/base/common/extpath"], function (require, exports, fs, path_1, nls_1, arrays, objects_1, backup_1, environment_1, state_1, window_1, electron_1, paths_1, lifecycleMainService_1, configuration_1, log_1, windows_1, window_2, event_1, product_1, workspacesHistoryMainService_1, platform_1, workspaces_1, instantiation_1, network_1, uri_1, resources_1, remoteHosts_1, windowsStateStorage_1, workspacesMainService_1, functional_1, lifecycle_1, dialogs_1, types_1, extpath_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function isFolderPathToOpen(path) {
        return !!path.folderUri;
    }
    function isWorkspacePathToOpen(path) {
        return !!path.workspace;
    }
    let WindowsMainService = class WindowsMainService extends lifecycle_1.Disposable {
        constructor(machineId, initialUserEnv, logService, stateService, environmentService, lifecycleMainService, backupMainService, configurationService, workspacesHistoryMainService, workspacesMainService, instantiationService, dialogMainService) {
            super();
            this.machineId = machineId;
            this.initialUserEnv = initialUserEnv;
            this.logService = logService;
            this.stateService = stateService;
            this.environmentService = environmentService;
            this.lifecycleMainService = lifecycleMainService;
            this.backupMainService = backupMainService;
            this.configurationService = configurationService;
            this.workspacesHistoryMainService = workspacesHistoryMainService;
            this.workspacesMainService = workspacesMainService;
            this.instantiationService = instantiationService;
            this.dialogMainService = dialogMainService;
            this._onWindowReady = this._register(new event_1.Emitter());
            this.onWindowReady = this._onWindowReady.event;
            this._onWindowClose = this._register(new event_1.Emitter());
            this.onWindowClose = this._onWindowClose.event;
            this._onWindowsCountChanged = this._register(new event_1.Emitter());
            this.onWindowsCountChanged = this._onWindowsCountChanged.event;
            this.windowsState = windowsStateStorage_1.restoreWindowsState(this.stateService.getItem(WindowsMainService.windowsStateStorageKey));
            if (!Array.isArray(this.windowsState.openedWindows)) {
                this.windowsState.openedWindows = [];
            }
            this.lifecycleMainService.when(2 /* Ready */).then(() => this.registerListeners());
            this.lifecycleMainService.when(3 /* AfterWindowOpen */).then(() => this.installWindowsMutex());
        }
        installWindowsMutex() {
            const win32MutexName = product_1.default.win32MutexName;
            if (platform_1.isWindows && win32MutexName) {
                try {
                    const WindowsMutex = require.__$__nodeRequire('windows-mutex').Mutex;
                    const mutex = new WindowsMutex(win32MutexName);
                    functional_1.once(this.lifecycleMainService.onWillShutdown)(() => mutex.release());
                }
                catch (e) {
                    this.logService.error(e);
                }
            }
        }
        registerListeners() {
            // React to workbench ready events from windows
            electron_1.ipcMain.on('vscode:workbenchReady', (event, windowId) => {
                this.logService.trace('IPC#vscode-workbenchReady');
                const win = this.getWindowById(windowId);
                if (win) {
                    win.setReady();
                    // Event
                    this._onWindowReady.fire(win);
                }
            });
            // React to HC color scheme changes (Windows)
            if (platform_1.isWindows) {
                const onHighContrastChange = () => {
                    if (electron_1.systemPreferences.isInvertedColorScheme() || electron_1.systemPreferences.isHighContrastColorScheme()) {
                        this.sendToAll('vscode:enterHighContrast');
                    }
                    else {
                        this.sendToAll('vscode:leaveHighContrast');
                    }
                };
                electron_1.systemPreferences.on('inverted-color-scheme-changed', () => onHighContrastChange());
                electron_1.systemPreferences.on('high-contrast-color-scheme-changed', () => onHighContrastChange());
            }
            // Handle various lifecycle events around windows
            this.lifecycleMainService.onBeforeWindowClose(window => this.onBeforeWindowClose(window));
            this.lifecycleMainService.onBeforeShutdown(() => this.onBeforeShutdown());
            this.onWindowsCountChanged(e => {
                if (e.newCount - e.oldCount > 0) {
                    // clear last closed window state when a new window opens. this helps on macOS where
                    // otherwise closing the last window, opening a new window and then quitting would
                    // use the state of the previously closed window when restarting.
                    this.lastClosedWindowState = undefined;
                }
            });
            // Signal a window is ready after having entered a workspace
            this._register(this.workspacesMainService.onWorkspaceEntered(event => {
                this._onWindowReady.fire(event.window);
            }));
        }
        // Note that onBeforeShutdown() and onBeforeWindowClose() are fired in different order depending on the OS:
        // - macOS: since the app will not quit when closing the last window, you will always first get
        //          the onBeforeShutdown() event followed by N onbeforeWindowClose() events for each window
        // - other: on other OS, closing the last window will quit the app so the order depends on the
        //          user interaction: closing the last window will first trigger onBeforeWindowClose()
        //          and then onBeforeShutdown(). Using the quit action however will first issue onBeforeShutdown()
        //          and then onBeforeWindowClose().
        //
        // Here is the behaviour on different OS dependig on action taken (Electron 1.7.x):
        //
        // Legend
        // -  quit(N): quit application with N windows opened
        // - close(1): close one window via the window close button
        // - closeAll: close all windows via the taskbar command
        // - onBeforeShutdown(N): number of windows reported in this event handler
        // - onBeforeWindowClose(N, M): number of windows reported and quitRequested boolean in this event handler
        //
        // macOS
        // 	-     quit(1): onBeforeShutdown(1), onBeforeWindowClose(1, true)
        // 	-     quit(2): onBeforeShutdown(2), onBeforeWindowClose(2, true), onBeforeWindowClose(2, true)
        // 	-     quit(0): onBeforeShutdown(0)
        // 	-    close(1): onBeforeWindowClose(1, false)
        //
        // Windows
        // 	-     quit(1): onBeforeShutdown(1), onBeforeWindowClose(1, true)
        // 	-     quit(2): onBeforeShutdown(2), onBeforeWindowClose(2, true), onBeforeWindowClose(2, true)
        // 	-    close(1): onBeforeWindowClose(2, false)[not last window]
        // 	-    close(1): onBeforeWindowClose(1, false), onBeforeShutdown(0)[last window]
        // 	- closeAll(2): onBeforeWindowClose(2, false), onBeforeWindowClose(2, false), onBeforeShutdown(0)
        //
        // Linux
        // 	-     quit(1): onBeforeShutdown(1), onBeforeWindowClose(1, true)
        // 	-     quit(2): onBeforeShutdown(2), onBeforeWindowClose(2, true), onBeforeWindowClose(2, true)
        // 	-    close(1): onBeforeWindowClose(2, false)[not last window]
        // 	-    close(1): onBeforeWindowClose(1, false), onBeforeShutdown(0)[last window]
        // 	- closeAll(2): onBeforeWindowClose(2, false), onBeforeWindowClose(2, false), onBeforeShutdown(0)
        //
        onBeforeShutdown() {
            const currentWindowsState = {
                openedWindows: [],
                lastPluginDevelopmentHostWindow: this.windowsState.lastPluginDevelopmentHostWindow,
                lastActiveWindow: this.lastClosedWindowState
            };
            // 1.) Find a last active window (pick any other first window otherwise)
            if (!currentWindowsState.lastActiveWindow) {
                let activeWindow = this.getLastActiveWindow();
                if (!activeWindow || activeWindow.isExtensionDevelopmentHost) {
                    activeWindow = WindowsMainService.WINDOWS.filter(window => !window.isExtensionDevelopmentHost)[0];
                }
                if (activeWindow) {
                    currentWindowsState.lastActiveWindow = this.toWindowState(activeWindow);
                }
            }
            // 2.) Find extension host window
            const extensionHostWindow = WindowsMainService.WINDOWS.filter(window => window.isExtensionDevelopmentHost && !window.isExtensionTestHost)[0];
            if (extensionHostWindow) {
                currentWindowsState.lastPluginDevelopmentHostWindow = this.toWindowState(extensionHostWindow);
            }
            // 3.) All windows (except extension host) for N >= 2 to support restoreWindows: all or for auto update
            //
            // Carefull here: asking a window for its window state after it has been closed returns bogus values (width: 0, height: 0)
            // so if we ever want to persist the UI state of the last closed window (window count === 1), it has
            // to come from the stored lastClosedWindowState on Win/Linux at least
            if (this.getWindowCount() > 1) {
                currentWindowsState.openedWindows = WindowsMainService.WINDOWS.filter(window => !window.isExtensionDevelopmentHost).map(window => this.toWindowState(window));
            }
            // Persist
            this.stateService.setItem(WindowsMainService.windowsStateStorageKey, windowsStateStorage_1.getWindowsStateStoreData(currentWindowsState));
        }
        // See note on #onBeforeShutdown() for details how these events are flowing
        onBeforeWindowClose(win) {
            if (this.lifecycleMainService.quitRequested) {
                return; // during quit, many windows close in parallel so let it be handled in the before-quit handler
            }
            // On Window close, update our stored UI state of this window
            const state = this.toWindowState(win);
            if (win.isExtensionDevelopmentHost && !win.isExtensionTestHost) {
                this.windowsState.lastPluginDevelopmentHostWindow = state; // do not let test run window state overwrite our extension development state
            }
            // Any non extension host window with same workspace or folder
            else if (!win.isExtensionDevelopmentHost && (!!win.openedWorkspace || !!win.openedFolderUri)) {
                this.windowsState.openedWindows.forEach(o => {
                    const sameWorkspace = win.openedWorkspace && o.workspace && o.workspace.id === win.openedWorkspace.id;
                    const sameFolder = win.openedFolderUri && o.folderUri && resources_1.isEqual(o.folderUri, win.openedFolderUri);
                    if (sameWorkspace || sameFolder) {
                        o.uiState = state.uiState;
                    }
                });
            }
            // On Windows and Linux closing the last window will trigger quit. Since we are storing all UI state
            // before quitting, we need to remember the UI state of this window to be able to persist it.
            // On macOS we keep the last closed window state ready in case the user wants to quit right after or
            // wants to open another window, in which case we use this state over the persisted one.
            if (this.getWindowCount() === 1) {
                this.lastClosedWindowState = state;
            }
        }
        toWindowState(win) {
            return {
                workspace: win.openedWorkspace,
                folderUri: win.openedFolderUri,
                backupPath: win.backupPath,
                remoteAuthority: win.remoteAuthority,
                uiState: win.serializeWindowState()
            };
        }
        openEmptyWindow(context, options) {
            var _a, _b;
            let cli = this.environmentService.args;
            const remote = (_a = options) === null || _a === void 0 ? void 0 : _a.remoteAuthority;
            if (cli && (cli.remote !== remote)) {
                cli = Object.assign(Object.assign({}, cli), { remote });
            }
            const forceReuseWindow = (_b = options) === null || _b === void 0 ? void 0 : _b.forceReuseWindow;
            const forceNewWindow = !forceReuseWindow;
            return this.open({ context, cli, forceEmpty: true, forceNewWindow, forceReuseWindow });
        }
        open(openConfig) {
            var _a;
            this.logService.trace('windowsManager#open');
            openConfig = this.validateOpenConfig(openConfig);
            const pathsToOpen = this.getPathsToOpen(openConfig);
            const foldersToAdd = [];
            const foldersToOpen = [];
            const workspacesToOpen = [];
            const emptyToRestore = []; // empty windows with backupPath
            let emptyToOpen = 0;
            let fileInputs; // collect all file inputs
            for (const path of pathsToOpen) {
                if (isFolderPathToOpen(path)) {
                    if (openConfig.addMode) {
                        // When run with --add, take the folders that are to be opened as
                        // folders that should be added to the currently active window.
                        foldersToAdd.push(path);
                    }
                    else {
                        foldersToOpen.push(path);
                    }
                }
                else if (isWorkspacePathToOpen(path)) {
                    workspacesToOpen.push(path);
                }
                else if (path.fileUri) {
                    if (!fileInputs) {
                        fileInputs = { filesToOpenOrCreate: [], filesToDiff: [], remoteAuthority: path.remoteAuthority };
                    }
                    fileInputs.filesToOpenOrCreate.push(path);
                }
                else if (path.backupPath) {
                    emptyToRestore.push({ backupFolder: path_1.basename(path.backupPath), remoteAuthority: path.remoteAuthority });
                }
                else {
                    emptyToOpen++;
                }
            }
            // When run with --diff, take the files to open as files to diff
            // if there are exactly two files provided.
            if (fileInputs && openConfig.diffMode && fileInputs.filesToOpenOrCreate.length === 2) {
                fileInputs.filesToDiff = fileInputs.filesToOpenOrCreate;
                fileInputs.filesToOpenOrCreate = [];
            }
            // When run with --wait, make sure we keep the paths to wait for
            if (fileInputs && openConfig.waitMarkerFileURI) {
                fileInputs.filesToWait = { paths: [...fileInputs.filesToDiff, ...fileInputs.filesToOpenOrCreate], waitMarkerFileUri: openConfig.waitMarkerFileURI };
            }
            //
            // These are windows to restore because of hot-exit or from previous session (only performed once on startup!)
            //
            let foldersToRestore = [];
            let workspacesToRestore = [];
            if (openConfig.initialStartup && !openConfig.cli.extensionDevelopmentPath && !openConfig.cli['disable-restore-windows']) {
                let foldersToRestore = this.backupMainService.getFolderBackupPaths();
                foldersToAdd.push(...foldersToRestore.map(f => ({ folderUri: f, remoteAuhority: remoteHosts_1.getRemoteAuthority(f), isRestored: true })));
                // collect from workspaces with hot-exit backups and from previous window session
                workspacesToRestore = [...this.backupMainService.getWorkspaceBackups(), ...this.workspacesMainService.getUntitledWorkspacesSync()];
                workspacesToOpen.push(...workspacesToRestore);
                emptyToRestore.push(...this.backupMainService.getEmptyWindowBackupPaths());
            }
            else {
                emptyToRestore.length = 0;
            }
            // Open based on config
            const usedWindows = this.doOpen(openConfig, workspacesToOpen, foldersToOpen, emptyToRestore, emptyToOpen, fileInputs, foldersToAdd);
            // Make sure to pass focus to the most relevant of the windows if we open multiple
            if (usedWindows.length > 1) {
                const focusLastActive = this.windowsState.lastActiveWindow && !openConfig.forceEmpty && openConfig.cli._.length && !openConfig.cli['file-uri'] && !openConfig.cli['folder-uri'] && !(openConfig.urisToOpen && openConfig.urisToOpen.length);
                let focusLastOpened = true;
                let focusLastWindow = true;
                // 1.) focus last active window if we are not instructed to open any paths
                if (focusLastActive) {
                    const lastActiveWindow = usedWindows.filter(window => this.windowsState.lastActiveWindow && window.backupPath === this.windowsState.lastActiveWindow.backupPath);
                    if (lastActiveWindow.length) {
                        lastActiveWindow[0].focus();
                        focusLastOpened = false;
                        focusLastWindow = false;
                    }
                }
                // 2.) if instructed to open paths, focus last window which is not restored
                if (focusLastOpened) {
                    for (let i = usedWindows.length - 1; i >= 0; i--) {
                        const usedWindow = usedWindows[i];
                        if ((usedWindow.openedWorkspace && workspacesToRestore.some(workspace => usedWindow.openedWorkspace && workspace.workspace.id === usedWindow.openedWorkspace.id)) || // skip over restored workspace
                            (usedWindow.openedFolderUri && foldersToRestore.some(uri => resources_1.isEqual(uri, usedWindow.openedFolderUri))) || // skip over restored folder
                            (usedWindow.backupPath && emptyToRestore.some(empty => usedWindow.backupPath && empty.backupFolder === path_1.basename(usedWindow.backupPath))) // skip over restored empty window
                        ) {
                            continue;
                        }
                        usedWindow.focus();
                        focusLastWindow = false;
                        break;
                    }
                }
                // 3.) finally, always ensure to have at least last used window focused
                if (focusLastWindow) {
                    usedWindows[usedWindows.length - 1].focus();
                }
            }
            // Remember in recent document list (unless this opens for extension development)
            // Also do not add paths when files are opened for diffing, only if opened individually
            if (!usedWindows.some(window => window.isExtensionDevelopmentHost) && !((_a = fileInputs) === null || _a === void 0 ? void 0 : _a.filesToDiff) && !openConfig.noRecentEntry) {
                const recents = [];
                for (let pathToOpen of pathsToOpen) {
                    if (pathToOpen.workspace) {
                        recents.push({ label: pathToOpen.label, workspace: pathToOpen.workspace });
                    }
                    else if (pathToOpen.folderUri) {
                        recents.push({ label: pathToOpen.label, folderUri: pathToOpen.folderUri });
                    }
                    else if (pathToOpen.fileUri) {
                        recents.push({ label: pathToOpen.label, fileUri: pathToOpen.fileUri });
                    }
                }
                this.workspacesHistoryMainService.addRecentlyOpened(recents);
            }
            // If we got started with --wait from the CLI, we need to signal to the outside when the window
            // used for the edit operation is closed or loaded to a different folder so that the waiting
            // process can continue. We do this by deleting the waitMarkerFilePath.
            const waitMarkerFileURI = openConfig.waitMarkerFileURI;
            if (openConfig.context === 0 /* CLI */ && waitMarkerFileURI && usedWindows.length === 1 && usedWindows[0]) {
                usedWindows[0].whenClosedOrLoaded.then(() => fs.unlink(waitMarkerFileURI.fsPath, _error => undefined));
            }
            return usedWindows;
        }
        validateOpenConfig(config) {
            // Make sure addMode is only enabled if we have an active window
            if (config.addMode && (config.initialStartup || !this.getLastActiveWindow())) {
                config.addMode = false;
            }
            return config;
        }
        doOpen(openConfig, workspacesToOpen, foldersToOpen, emptyToRestore, emptyToOpen, fileInputs, foldersToAdd) {
            var _a, _b, _c;
            const usedWindows = [];
            // Settings can decide if files/folders open in new window or not
            let { openFolderInNewWindow, openFilesInNewWindow } = this.shouldOpenNewWindow(openConfig);
            // Handle folders to add by looking for the last active workspace (not on initial startup)
            if (!openConfig.initialStartup && foldersToAdd.length > 0) {
                const authority = foldersToAdd[0].remoteAuthority;
                const lastActiveWindow = this.getLastActiveWindowForAuthority(authority);
                if (lastActiveWindow) {
                    usedWindows.push(this.doAddFoldersToExistingWindow(lastActiveWindow, foldersToAdd.map(f => f.folderUri)));
                }
            }
            // Handle files to open/diff or to create when we dont open a folder and we do not restore any folder/untitled from hot-exit
            const potentialWindowsCount = foldersToOpen.length + workspacesToOpen.length + emptyToRestore.length;
            if (potentialWindowsCount === 0 && fileInputs) {
                // Find suitable window or folder path to open files in
                const fileToCheck = fileInputs.filesToOpenOrCreate[0] || fileInputs.filesToDiff[0];
                // only look at the windows with correct authority
                const windows = WindowsMainService.WINDOWS.filter(window => fileInputs && window.remoteAuthority === fileInputs.remoteAuthority);
                const bestWindowOrFolder = window_2.findBestWindowOrFolderForFile({
                    windows,
                    newWindow: openFilesInNewWindow,
                    context: openConfig.context,
                    fileUri: (_a = fileToCheck) === null || _a === void 0 ? void 0 : _a.fileUri,
                    localWorkspaceResolver: workspace => workspace.configPath.scheme === network_1.Schemas.file ? this.workspacesMainService.resolveLocalWorkspaceSync(workspace.configPath) : null
                });
                // We found a window to open the files in
                if (bestWindowOrFolder instanceof window_1.CodeWindow) {
                    // Window is workspace
                    if (bestWindowOrFolder.openedWorkspace) {
                        workspacesToOpen.push({ workspace: bestWindowOrFolder.openedWorkspace, remoteAuthority: bestWindowOrFolder.remoteAuthority });
                    }
                    // Window is single folder
                    else if (bestWindowOrFolder.openedFolderUri) {
                        foldersToOpen.push({ folderUri: bestWindowOrFolder.openedFolderUri, remoteAuthority: bestWindowOrFolder.remoteAuthority });
                    }
                    // Window is empty
                    else {
                        // Do open files
                        usedWindows.push(this.doOpenFilesInExistingWindow(openConfig, bestWindowOrFolder, fileInputs));
                        // Reset these because we handled them
                        fileInputs = undefined;
                    }
                }
                // Finally, if no window or folder is found, just open the files in an empty window
                else {
                    usedWindows.push(this.openInBrowserWindow({
                        userEnv: openConfig.userEnv,
                        cli: openConfig.cli,
                        initialStartup: openConfig.initialStartup,
                        fileInputs,
                        forceNewWindow: true,
                        remoteAuthority: fileInputs.remoteAuthority,
                        forceNewTabbedWindow: openConfig.forceNewTabbedWindow
                    }));
                    // Reset these because we handled them
                    fileInputs = undefined;
                }
            }
            // Handle workspaces to open (instructed and to restore)
            const allWorkspacesToOpen = arrays.distinct(workspacesToOpen, workspace => workspace.workspace.id); // prevent duplicates
            if (allWorkspacesToOpen.length > 0) {
                // Check for existing instances
                const windowsOnWorkspace = arrays.coalesce(allWorkspacesToOpen.map(workspaceToOpen => window_2.findWindowOnWorkspace(WindowsMainService.WINDOWS, workspaceToOpen.workspace)));
                if (windowsOnWorkspace.length > 0) {
                    const windowOnWorkspace = windowsOnWorkspace[0];
                    const fileInputsForWindow = (((_b = fileInputs) === null || _b === void 0 ? void 0 : _b.remoteAuthority) === windowOnWorkspace.remoteAuthority) ? fileInputs : undefined;
                    // Do open files
                    usedWindows.push(this.doOpenFilesInExistingWindow(openConfig, windowOnWorkspace, fileInputsForWindow));
                    // Reset these because we handled them
                    if (fileInputsForWindow) {
                        fileInputs = undefined;
                    }
                    openFolderInNewWindow = true; // any other folders to open must open in new window then
                }
                // Open remaining ones
                allWorkspacesToOpen.forEach(workspaceToOpen => {
                    var _a;
                    if (windowsOnWorkspace.some(win => win.openedWorkspace && win.openedWorkspace.id === workspaceToOpen.workspace.id)) {
                        return; // ignore folders that are already open
                    }
                    const remoteAuthority = workspaceToOpen.remoteAuthority;
                    const fileInputsForWindow = (((_a = fileInputs) === null || _a === void 0 ? void 0 : _a.remoteAuthority) === remoteAuthority) ? fileInputs : undefined;
                    // Do open folder
                    usedWindows.push(this.doOpenFolderOrWorkspace(openConfig, workspaceToOpen, openFolderInNewWindow, fileInputsForWindow));
                    // Reset these because we handled them
                    if (fileInputsForWindow) {
                        fileInputs = undefined;
                    }
                    openFolderInNewWindow = true; // any other folders to open must open in new window then
                });
            }
            // Handle folders to open (instructed and to restore)
            const allFoldersToOpen = arrays.distinct(foldersToOpen, folder => resources_1.getComparisonKey(folder.folderUri)); // prevent duplicates
            if (allFoldersToOpen.length > 0) {
                // Check for existing instances
                const windowsOnFolderPath = arrays.coalesce(allFoldersToOpen.map(folderToOpen => window_2.findWindowOnWorkspace(WindowsMainService.WINDOWS, folderToOpen.folderUri)));
                if (windowsOnFolderPath.length > 0) {
                    const windowOnFolderPath = windowsOnFolderPath[0];
                    const fileInputsForWindow = ((_c = fileInputs) === null || _c === void 0 ? void 0 : _c.remoteAuthority) === windowOnFolderPath.remoteAuthority ? fileInputs : undefined;
                    // Do open files
                    usedWindows.push(this.doOpenFilesInExistingWindow(openConfig, windowOnFolderPath, fileInputsForWindow));
                    // Reset these because we handled them
                    if (fileInputsForWindow) {
                        fileInputs = undefined;
                    }
                    openFolderInNewWindow = true; // any other folders to open must open in new window then
                }
                // Open remaining ones
                allFoldersToOpen.forEach(folderToOpen => {
                    var _a;
                    if (windowsOnFolderPath.some(win => resources_1.isEqual(win.openedFolderUri, folderToOpen.folderUri))) {
                        return; // ignore folders that are already open
                    }
                    const remoteAuthority = folderToOpen.remoteAuthority;
                    const fileInputsForWindow = (((_a = fileInputs) === null || _a === void 0 ? void 0 : _a.remoteAuthority) === remoteAuthority) ? fileInputs : undefined;
                    // Do open folder
                    usedWindows.push(this.doOpenFolderOrWorkspace(openConfig, folderToOpen, openFolderInNewWindow, fileInputsForWindow));
                    // Reset these because we handled them
                    if (fileInputsForWindow) {
                        fileInputs = undefined;
                    }
                    openFolderInNewWindow = true; // any other folders to open must open in new window then
                });
            }
            // Handle empty to restore
            const allEmptyToRestore = arrays.distinct(emptyToRestore, info => info.backupFolder); // prevent duplicates
            if (allEmptyToRestore.length > 0) {
                allEmptyToRestore.forEach(emptyWindowBackupInfo => {
                    var _a;
                    const remoteAuthority = emptyWindowBackupInfo.remoteAuthority;
                    const fileInputsForWindow = (((_a = fileInputs) === null || _a === void 0 ? void 0 : _a.remoteAuthority) === remoteAuthority) ? fileInputs : undefined;
                    usedWindows.push(this.openInBrowserWindow({
                        userEnv: openConfig.userEnv,
                        cli: openConfig.cli,
                        initialStartup: openConfig.initialStartup,
                        fileInputs: fileInputsForWindow,
                        remoteAuthority,
                        forceNewWindow: true,
                        forceNewTabbedWindow: openConfig.forceNewTabbedWindow,
                        emptyWindowBackupInfo
                    }));
                    // Reset these because we handled them
                    if (fileInputsForWindow) {
                        fileInputs = undefined;
                    }
                    openFolderInNewWindow = true; // any other folders to open must open in new window then
                });
            }
            // Handle empty to open (only if no other window opened)
            if (usedWindows.length === 0 || fileInputs) {
                if (fileInputs && !emptyToOpen) {
                    emptyToOpen++;
                }
                const remoteAuthority = fileInputs ? fileInputs.remoteAuthority : (openConfig.cli && openConfig.cli.remote || undefined);
                for (let i = 0; i < emptyToOpen; i++) {
                    usedWindows.push(this.openInBrowserWindow({
                        userEnv: openConfig.userEnv,
                        cli: openConfig.cli,
                        initialStartup: openConfig.initialStartup,
                        remoteAuthority,
                        forceNewWindow: openFolderInNewWindow,
                        forceNewTabbedWindow: openConfig.forceNewTabbedWindow,
                        fileInputs
                    }));
                    // Reset these because we handled them
                    fileInputs = undefined;
                    openFolderInNewWindow = true; // any other window to open must open in new window then
                }
            }
            return arrays.distinct(usedWindows);
        }
        doOpenFilesInExistingWindow(configuration, window, fileInputs) {
            window.focus(); // make sure window has focus
            const params = {};
            if (fileInputs) {
                params.filesToOpenOrCreate = fileInputs.filesToOpenOrCreate;
                params.filesToDiff = fileInputs.filesToDiff;
                params.filesToWait = fileInputs.filesToWait;
            }
            if (configuration.userEnv) {
                params.termProgram = configuration.userEnv['TERM_PROGRAM'];
            }
            window.sendWhenReady('vscode:openFiles', params);
            return window;
        }
        doAddFoldersToExistingWindow(window, foldersToAdd) {
            window.focus(); // make sure window has focus
            const request = { foldersToAdd };
            window.sendWhenReady('vscode:addFolders', request);
            return window;
        }
        doOpenFolderOrWorkspace(openConfig, folderOrWorkspace, forceNewWindow, fileInputs, windowToUse) {
            if (!forceNewWindow && !windowToUse && typeof openConfig.contextWindowId === 'number') {
                windowToUse = this.getWindowById(openConfig.contextWindowId); // fix for https://github.com/Microsoft/vscode/issues/49587
            }
            const browserWindow = this.openInBrowserWindow({
                userEnv: openConfig.userEnv,
                cli: openConfig.cli,
                initialStartup: openConfig.initialStartup,
                workspace: folderOrWorkspace.workspace,
                folderUri: folderOrWorkspace.folderUri,
                fileInputs,
                remoteAuthority: folderOrWorkspace.remoteAuthority,
                forceNewWindow,
                forceNewTabbedWindow: openConfig.forceNewTabbedWindow,
                windowToUse
            });
            return browserWindow;
        }
        getPathsToOpen(openConfig) {
            let windowsToOpen;
            let isCommandLineOrAPICall = false;
            // Extract paths: from API
            if (openConfig.urisToOpen && openConfig.urisToOpen.length > 0) {
                windowsToOpen = this.doExtractPathsFromAPI(openConfig);
                isCommandLineOrAPICall = true;
            }
            // Check for force empty
            else if (openConfig.forceEmpty) {
                windowsToOpen = [Object.create(null)];
            }
            // Extract paths: from CLI
            else if (openConfig.cli._.length || openConfig.cli['folder-uri'] || openConfig.cli['file-uri']) {
                windowsToOpen = this.doExtractPathsFromCLI(openConfig.cli);
                isCommandLineOrAPICall = true;
            }
            // Extract windows: from previous session
            else {
                windowsToOpen = this.doGetWindowsFromLastSession();
            }
            // Convert multiple folders into workspace (if opened via API or CLI)
            // This will ensure to open these folders in one window instead of multiple
            // If we are in addMode, we should not do this because in that case all
            // folders should be added to the existing window.
            if (!openConfig.addMode && isCommandLineOrAPICall) {
                const foldersToOpen = windowsToOpen.filter(path => !!path.folderUri);
                if (foldersToOpen.length > 1) {
                    const remoteAuthority = foldersToOpen[0].remoteAuthority;
                    if (foldersToOpen.every(f => f.remoteAuthority === remoteAuthority)) { // only if all folder have the same authority
                        const workspace = this.workspacesMainService.createUntitledWorkspaceSync(foldersToOpen.map(folder => ({ uri: folder.folderUri })));
                        // Add workspace and remove folders thereby
                        windowsToOpen.push({ workspace, remoteAuthority });
                        windowsToOpen = windowsToOpen.filter(path => !path.folderUri);
                    }
                }
            }
            return windowsToOpen;
        }
        doExtractPathsFromAPI(openConfig) {
            const pathsToOpen = [];
            const parseOptions = { gotoLineMode: openConfig.gotoLineMode };
            for (const pathToOpen of openConfig.urisToOpen || []) {
                if (!pathToOpen) {
                    continue;
                }
                const path = this.parseUri(pathToOpen, parseOptions);
                if (path) {
                    path.label = pathToOpen.label;
                    pathsToOpen.push(path);
                }
                else {
                    const uri = this.resourceFromURIToOpen(pathToOpen);
                    // Warn about the invalid URI or path
                    let message, detail;
                    if (uri.scheme === network_1.Schemas.file) {
                        message = nls_1.localize('pathNotExistTitle', "Path does not exist");
                        detail = nls_1.localize('pathNotExistDetail', "The path '{0}' does not seem to exist anymore on disk.", uri.fsPath);
                    }
                    else {
                        message = nls_1.localize('uriInvalidTitle', "URI can not be opened");
                        detail = nls_1.localize('uriInvalidDetail', "The URI '{0}' is not valid and can not be opened.", uri.toString());
                    }
                    const options = {
                        title: product_1.default.nameLong,
                        type: 'info',
                        buttons: [nls_1.localize('ok', "OK")],
                        message,
                        detail,
                        noLink: true
                    };
                    this.dialogMainService.showMessageBox(options, types_1.withNullAsUndefined(electron_1.BrowserWindow.getFocusedWindow()));
                }
            }
            return pathsToOpen;
        }
        doExtractPathsFromCLI(cli) {
            const pathsToOpen = [];
            const parseOptions = { ignoreFileNotFound: true, gotoLineMode: cli.goto, remoteAuthority: cli.remote || undefined };
            // folder uris
            const folderUris = cli['folder-uri'];
            if (folderUris) {
                for (let f of folderUris) {
                    const folderUri = this.argToUri(f);
                    if (folderUri) {
                        const path = this.parseUri({ folderUri }, parseOptions);
                        if (path) {
                            pathsToOpen.push(path);
                        }
                    }
                }
            }
            // file uris
            const fileUris = cli['file-uri'];
            if (fileUris) {
                for (let f of fileUris) {
                    const fileUri = this.argToUri(f);
                    if (fileUri) {
                        const path = this.parseUri(workspaces_1.hasWorkspaceFileExtension(f) ? { workspaceUri: fileUri } : { fileUri }, parseOptions);
                        if (path) {
                            pathsToOpen.push(path);
                        }
                    }
                }
            }
            // folder or file paths
            const cliArgs = cli._;
            for (let cliArg of cliArgs) {
                const path = this.parsePath(cliArg, parseOptions);
                if (path) {
                    pathsToOpen.push(path);
                }
            }
            if (pathsToOpen.length) {
                return pathsToOpen;
            }
            // No path provided, return empty to open empty
            return [Object.create(null)];
        }
        doGetWindowsFromLastSession() {
            var _a, _b;
            const restoreWindows = this.getRestoreWindowsSetting();
            switch (restoreWindows) {
                // none: we always open an empty window
                case 'none':
                    return [Object.create(null)];
                // one: restore last opened workspace/folder or empty window
                // all: restore all windows
                // folders: restore last opened folders only
                case 'one':
                case 'all':
                case 'folders':
                    const openedWindows = [];
                    if (restoreWindows !== 'one') {
                        openedWindows.push(...this.windowsState.openedWindows);
                    }
                    if (this.windowsState.lastActiveWindow) {
                        openedWindows.push(this.windowsState.lastActiveWindow);
                    }
                    const windowsToOpen = [];
                    for (const openedWindow of openedWindows) {
                        if (openedWindow.workspace) { // Workspaces
                            const pathToOpen = this.parseUri({ workspaceUri: openedWindow.workspace.configPath }, { remoteAuthority: openedWindow.remoteAuthority });
                            if ((_a = pathToOpen) === null || _a === void 0 ? void 0 : _a.workspace) {
                                windowsToOpen.push(pathToOpen);
                            }
                        }
                        else if (openedWindow.folderUri) { // Folders
                            const pathToOpen = this.parseUri({ folderUri: openedWindow.folderUri }, { remoteAuthority: openedWindow.remoteAuthority });
                            if ((_b = pathToOpen) === null || _b === void 0 ? void 0 : _b.folderUri) {
                                windowsToOpen.push(pathToOpen);
                            }
                        }
                        else if (restoreWindows !== 'folders' && openedWindow.backupPath && !openedWindow.remoteAuthority) { // Local windows that were empty. Empty windows with backups will always be restored in open()
                            windowsToOpen.push({ backupPath: openedWindow.backupPath, remoteAuthority: openedWindow.remoteAuthority });
                        }
                    }
                    if (windowsToOpen.length > 0) {
                        return windowsToOpen;
                    }
                    break;
            }
            // Always fallback to empty window
            return [Object.create(null)];
        }
        getRestoreWindowsSetting() {
            var _a;
            let restoreWindows;
            if (this.lifecycleMainService.wasRestarted) {
                restoreWindows = 'all'; // always reopen all windows when an update was applied
            }
            else {
                const windowConfig = this.configurationService.getValue('window');
                restoreWindows = ((_a = windowConfig) === null || _a === void 0 ? void 0 : _a.restoreWindows) || 'one';
                if (['all', 'folders', 'one', 'none'].indexOf(restoreWindows) === -1) {
                    restoreWindows = 'one';
                }
            }
            return restoreWindows;
        }
        argToUri(arg) {
            try {
                const uri = uri_1.URI.parse(arg);
                if (!uri.scheme) {
                    this.logService.error(`Invalid URI input string, scheme missing: ${arg}`);
                    return undefined;
                }
                return uri;
            }
            catch (e) {
                this.logService.error(`Invalid URI input string: ${arg}, ${e.message}`);
            }
            return undefined;
        }
        parseUri(toOpen, options = {}) {
            if (!toOpen) {
                return undefined;
            }
            let uri = this.resourceFromURIToOpen(toOpen);
            if (uri.scheme === network_1.Schemas.file) {
                return this.parsePath(uri.fsPath, options, windows_1.isFileToOpen(toOpen));
            }
            // open remote if either specified in the cli or if it's a remotehost URI
            const remoteAuthority = options.remoteAuthority || remoteHosts_1.getRemoteAuthority(uri);
            // normalize URI
            uri = resources_1.normalizePath(uri);
            // remove trailing slash
            if (resources_1.hasTrailingPathSeparator(uri)) {
                uri = resources_1.removeTrailingPathSeparator(uri);
            }
            // File
            if (windows_1.isFileToOpen(toOpen)) {
                if (options.gotoLineMode) {
                    const parsedPath = paths_1.parseLineAndColumnAware(uri.path);
                    return {
                        fileUri: uri.with({ path: parsedPath.path }),
                        lineNumber: parsedPath.line,
                        columnNumber: parsedPath.column,
                        remoteAuthority
                    };
                }
                return {
                    fileUri: uri,
                    remoteAuthority
                };
            }
            // Workspace
            else if (windows_1.isWorkspaceToOpen(toOpen)) {
                return {
                    workspace: workspacesMainService_1.getWorkspaceIdentifier(uri),
                    remoteAuthority
                };
            }
            // Folder
            return {
                folderUri: uri,
                remoteAuthority
            };
        }
        resourceFromURIToOpen(openable) {
            if (windows_1.isWorkspaceToOpen(openable)) {
                return openable.workspaceUri;
            }
            if (windows_1.isFolderToOpen(openable)) {
                return openable.folderUri;
            }
            return openable.fileUri;
        }
        parsePath(anyPath, options, forceOpenWorkspaceAsFile) {
            var _a;
            if (!anyPath) {
                return undefined;
            }
            let lineNumber, columnNumber;
            if (options.gotoLineMode) {
                const parsedPath = paths_1.parseLineAndColumnAware(anyPath);
                lineNumber = parsedPath.line;
                columnNumber = parsedPath.column;
                anyPath = parsedPath.path;
            }
            // open remote if either specified in the cli even if it is a local file.
            const remoteAuthority = options.remoteAuthority;
            if (remoteAuthority) {
                // assume it's a folder or workspace file
                const first = anyPath.charCodeAt(0);
                // make absolute
                if (first !== 47 /* Slash */) {
                    if (extpath_1.isWindowsDriveLetter(first) && anyPath.charCodeAt(anyPath.charCodeAt(1)) === 58 /* Colon */) {
                        anyPath = extpath_1.toSlashes(anyPath);
                    }
                    anyPath = '/' + anyPath;
                }
                const uri = uri_1.URI.from({ scheme: network_1.Schemas.vscodeRemote, authority: remoteAuthority, path: anyPath });
                if (workspaces_1.hasWorkspaceFileExtension(anyPath)) {
                    if (forceOpenWorkspaceAsFile) {
                        return { fileUri: uri, remoteAuthority };
                    }
                    return { workspace: workspacesMainService_1.getWorkspaceIdentifier(uri), remoteAuthority };
                }
                return { folderUri: uri, remoteAuthority };
            }
            let candidate = path_1.normalize(anyPath);
            try {
                const candidateStat = fs.statSync(candidate);
                if (candidateStat.isFile()) {
                    // Workspace (unless disabled via flag)
                    if (!forceOpenWorkspaceAsFile) {
                        const workspace = this.workspacesMainService.resolveLocalWorkspaceSync(uri_1.URI.file(candidate));
                        if (workspace) {
                            return {
                                workspace: { id: workspace.id, configPath: workspace.configPath },
                                remoteAuthority: workspace.remoteAuthority,
                                exists: true
                            };
                        }
                    }
                    // File
                    return {
                        fileUri: uri_1.URI.file(candidate),
                        lineNumber,
                        columnNumber,
                        remoteAuthority,
                        exists: true
                    };
                }
                // Folder (we check for isDirectory() because e.g. paths like /dev/null
                // are neither file nor folder but some external tools might pass them
                // over to us)
                else if (candidateStat.isDirectory()) {
                    return {
                        folderUri: uri_1.URI.file(candidate),
                        remoteAuthority,
                        exists: true
                    };
                }
            }
            catch (error) {
                const fileUri = uri_1.URI.file(candidate);
                this.workspacesHistoryMainService.removeFromRecentlyOpened([fileUri]); // since file does not seem to exist anymore, remove from recent
                // assume this is a file that does not yet exist
                if ((_a = options) === null || _a === void 0 ? void 0 : _a.ignoreFileNotFound) {
                    return {
                        fileUri,
                        remoteAuthority,
                        exists: false
                    };
                }
            }
            return undefined;
        }
        shouldOpenNewWindow(openConfig) {
            var _a, _b;
            // let the user settings override how folders are open in a new window or same window unless we are forced
            const windowConfig = this.configurationService.getValue('window');
            const openFolderInNewWindowConfig = ((_a = windowConfig) === null || _a === void 0 ? void 0 : _a.openFoldersInNewWindow) || 'default' /* default */;
            const openFilesInNewWindowConfig = ((_b = windowConfig) === null || _b === void 0 ? void 0 : _b.openFilesInNewWindow) || 'off' /* default */;
            let openFolderInNewWindow = (openConfig.preferNewWindow || openConfig.forceNewWindow) && !openConfig.forceReuseWindow;
            if (!openConfig.forceNewWindow && !openConfig.forceReuseWindow && (openFolderInNewWindowConfig === 'on' || openFolderInNewWindowConfig === 'off')) {
                openFolderInNewWindow = (openFolderInNewWindowConfig === 'on');
            }
            // let the user settings override how files are open in a new window or same window unless we are forced (not for extension development though)
            let openFilesInNewWindow = false;
            if (openConfig.forceNewWindow || openConfig.forceReuseWindow) {
                openFilesInNewWindow = !!openConfig.forceNewWindow && !openConfig.forceReuseWindow;
            }
            else {
                // macOS: by default we open files in a new window if this is triggered via DOCK context
                if (platform_1.isMacintosh) {
                    if (openConfig.context === 1 /* DOCK */) {
                        openFilesInNewWindow = true;
                    }
                }
                // Linux/Windows: by default we open files in the new window unless triggered via DIALOG / MENU context
                // or from the integrated terminal where we assume the user prefers to open in the current window
                else {
                    if (openConfig.context !== 3 /* DIALOG */ && openConfig.context !== 2 /* MENU */ && !(openConfig.userEnv && openConfig.userEnv['TERM_PROGRAM'] === 'vscode')) {
                        openFilesInNewWindow = true;
                    }
                }
                // finally check for overrides of default
                if (!openConfig.cli.extensionDevelopmentPath && (openFilesInNewWindowConfig === 'on' || openFilesInNewWindowConfig === 'off')) {
                    openFilesInNewWindow = (openFilesInNewWindowConfig === 'on');
                }
            }
            return { openFolderInNewWindow: !!openFolderInNewWindow, openFilesInNewWindow };
        }
        openExtensionDevelopmentHostWindow(extensionDevelopmentPath, openConfig) {
            // Reload an existing extension development host window on the same path
            // We currently do not allow more than one extension development window
            // on the same extension path.
            const existingWindow = window_2.findWindowOnExtensionDevelopmentPath(WindowsMainService.WINDOWS, extensionDevelopmentPath);
            if (existingWindow) {
                this.lifecycleMainService.reload(existingWindow, openConfig.cli);
                existingWindow.focus(); // make sure it gets focus and is restored
                return [existingWindow];
            }
            let folderUris = openConfig.cli['folder-uri'] || [];
            let fileUris = openConfig.cli['file-uri'] || [];
            let cliArgs = openConfig.cli._;
            // Fill in previously opened workspace unless an explicit path is provided and we are not unit testing
            if (!cliArgs.length && !folderUris.length && !fileUris.length && !openConfig.cli.extensionTestsPath) {
                const extensionDevelopmentWindowState = this.windowsState.lastPluginDevelopmentHostWindow;
                const workspaceToOpen = extensionDevelopmentWindowState && (extensionDevelopmentWindowState.workspace || extensionDevelopmentWindowState.folderUri);
                if (workspaceToOpen) {
                    if (workspaces_1.isSingleFolderWorkspaceIdentifier(workspaceToOpen)) {
                        if (workspaceToOpen.scheme === network_1.Schemas.file) {
                            cliArgs = [workspaceToOpen.fsPath];
                        }
                        else {
                            folderUris = [workspaceToOpen.toString()];
                        }
                    }
                    else {
                        if (workspaceToOpen.configPath.scheme === network_1.Schemas.file) {
                            cliArgs = [resources_1.originalFSPath(workspaceToOpen.configPath)];
                        }
                        else {
                            fileUris = [workspaceToOpen.configPath.toString()];
                        }
                    }
                }
            }
            let authority = '';
            for (let p of extensionDevelopmentPath) {
                if (p.match(/^[a-zA-Z][a-zA-Z0-9\+\-\.]+:/)) {
                    const url = uri_1.URI.parse(p);
                    if (url.scheme === network_1.Schemas.vscodeRemote) {
                        if (authority) {
                            if (url.authority !== authority) {
                                this.logService.error('more than one extension development path authority');
                            }
                        }
                        else {
                            authority = url.authority;
                        }
                    }
                }
            }
            // Make sure that we do not try to open:
            // - a workspace or folder that is already opened
            // - a workspace or file that has a different authority as the extension development.
            cliArgs = cliArgs.filter(path => {
                const uri = uri_1.URI.file(path);
                if (!!window_2.findWindowOnWorkspaceOrFolderUri(WindowsMainService.WINDOWS, uri)) {
                    return false;
                }
                return uri.authority === authority;
            });
            folderUris = folderUris.filter(uri => {
                const u = this.argToUri(uri);
                if (!!window_2.findWindowOnWorkspaceOrFolderUri(WindowsMainService.WINDOWS, u)) {
                    return false;
                }
                return u ? u.authority === authority : false;
            });
            fileUris = fileUris.filter(uri => {
                const u = this.argToUri(uri);
                if (!!window_2.findWindowOnWorkspaceOrFolderUri(WindowsMainService.WINDOWS, u)) {
                    return false;
                }
                return u ? u.authority === authority : false;
            });
            openConfig.cli._ = cliArgs;
            openConfig.cli['folder-uri'] = folderUris;
            openConfig.cli['file-uri'] = fileUris;
            // if there are no files or folders cli args left, use the "remote" cli argument
            const noFilesOrFolders = !cliArgs.length && !folderUris.length && !fileUris.length;
            if (noFilesOrFolders && authority) {
                openConfig.cli.remote = authority;
            }
            // Open it
            const openArgs = {
                context: openConfig.context,
                cli: openConfig.cli,
                forceNewWindow: true,
                forceEmpty: noFilesOrFolders,
                userEnv: openConfig.userEnv,
                noRecentEntry: true,
                waitMarkerFileURI: openConfig.waitMarkerFileURI
            };
            return this.open(openArgs);
        }
        openInBrowserWindow(options) {
            var _a, _b;
            // Build IWindowConfiguration from config and options
            const configuration = objects_1.mixin({}, options.cli); // inherit all properties from CLI
            configuration.appRoot = this.environmentService.appRoot;
            configuration.machineId = this.machineId;
            configuration.nodeCachedDataDir = this.environmentService.nodeCachedDataDir;
            configuration.mainPid = process.pid;
            configuration.execPath = process.execPath;
            configuration.userEnv = objects_1.assign({}, this.initialUserEnv, options.userEnv || {});
            configuration.isInitialStartup = options.initialStartup;
            configuration.workspace = options.workspace;
            configuration.folderUri = options.folderUri;
            configuration.remoteAuthority = options.remoteAuthority;
            const fileInputs = options.fileInputs;
            if (fileInputs) {
                configuration.filesToOpenOrCreate = fileInputs.filesToOpenOrCreate;
                configuration.filesToDiff = fileInputs.filesToDiff;
                configuration.filesToWait = fileInputs.filesToWait;
            }
            // if we know the backup folder upfront (for empty windows to restore), we can set it
            // directly here which helps for restoring UI state associated with that window.
            // For all other cases we first call into registerEmptyWindowBackupSync() to set it before
            // loading the window.
            if (options.emptyWindowBackupInfo) {
                configuration.backupPath = path_1.join(this.environmentService.backupHome.fsPath, options.emptyWindowBackupInfo.backupFolder);
            }
            let window;
            if (!options.forceNewWindow && !options.forceNewTabbedWindow) {
                window = options.windowToUse || this.getLastActiveWindow();
                if (window) {
                    window.focus();
                }
            }
            // New window
            if (!window) {
                const windowConfig = this.configurationService.getValue('window');
                const state = this.getNewWindowState(configuration);
                // Window state is not from a previous session: only allow fullscreen if we inherit it or user wants fullscreen
                let allowFullscreen;
                if (state.hasDefaultState) {
                    allowFullscreen = (((_a = windowConfig) === null || _a === void 0 ? void 0 : _a.newWindowDimensions) && ['fullscreen', 'inherit'].indexOf(windowConfig.newWindowDimensions) >= 0);
                }
                // Window state is from a previous session: only allow fullscreen when we got updated or user wants to restore
                else {
                    allowFullscreen = this.lifecycleMainService.wasRestarted || ((_b = windowConfig) === null || _b === void 0 ? void 0 : _b.restoreFullscreen);
                    if (allowFullscreen && platform_1.isMacintosh && WindowsMainService.WINDOWS.some(win => win.isFullScreen)) {
                        // macOS: Electron does not allow to restore multiple windows in
                        // fullscreen. As such, if we already restored a window in that
                        // state, we cannot allow more fullscreen windows. See
                        // https://github.com/microsoft/vscode/issues/41691 and
                        // https://github.com/electron/electron/issues/13077
                        allowFullscreen = false;
                    }
                }
                if (state.mode === 3 /* Fullscreen */ && !allowFullscreen) {
                    state.mode = 1 /* Normal */;
                }
                // Create the window
                const createdWindow = window = this.instantiationService.createInstance(window_1.CodeWindow, {
                    state,
                    extensionDevelopmentPath: configuration.extensionDevelopmentPath,
                    isExtensionTestHost: !!configuration.extensionTestsPath
                });
                // Add as window tab if configured (macOS only)
                if (options.forceNewTabbedWindow) {
                    const activeWindow = this.getLastActiveWindow();
                    if (activeWindow) {
                        activeWindow.addTabbedWindow(window);
                    }
                }
                // Add to our list of windows
                WindowsMainService.WINDOWS.push(window);
                // Indicate number change via event
                this._onWindowsCountChanged.fire({ oldCount: WindowsMainService.WINDOWS.length - 1, newCount: WindowsMainService.WINDOWS.length });
                // Window Events
                functional_1.once(window.onClose)(() => this.onWindowClosed(createdWindow));
                functional_1.once(window.onDestroy)(() => this.onBeforeWindowClose(createdWindow)); // try to save state before destroy because close will not fire
                window.win.webContents.removeAllListeners('devtools-reload-page'); // remove built in listener so we can handle this on our own
                window.win.webContents.on('devtools-reload-page', () => this.lifecycleMainService.reload(createdWindow));
                // Lifecycle
                this.lifecycleMainService.registerWindow(window);
            }
            // Existing window
            else {
                // Some configuration things get inherited if the window is being reused and we are
                // in extension development host mode. These options are all development related.
                const currentWindowConfig = window.config;
                if (!configuration.extensionDevelopmentPath && currentWindowConfig && !!currentWindowConfig.extensionDevelopmentPath) {
                    configuration.extensionDevelopmentPath = currentWindowConfig.extensionDevelopmentPath;
                    configuration.verbose = currentWindowConfig.verbose;
                    configuration['inspect-brk-extensions'] = currentWindowConfig['inspect-brk-extensions'];
                    configuration.debugId = currentWindowConfig.debugId;
                    configuration['inspect-extensions'] = currentWindowConfig['inspect-extensions'];
                    configuration['extensions-dir'] = currentWindowConfig['extensions-dir'];
                }
            }
            // If the window was already loaded, make sure to unload it
            // first and only load the new configuration if that was
            // not vetoed
            if (window.isReady) {
                this.lifecycleMainService.unload(window, 4 /* LOAD */).then(veto => {
                    if (!veto) {
                        this.doOpenInBrowserWindow(window, configuration, options);
                    }
                });
            }
            else {
                this.doOpenInBrowserWindow(window, configuration, options);
            }
            return window;
        }
        doOpenInBrowserWindow(window, configuration, options) {
            // Register window for backups
            if (!configuration.extensionDevelopmentPath) {
                if (configuration.workspace) {
                    configuration.backupPath = this.backupMainService.registerWorkspaceBackupSync({ workspace: configuration.workspace, remoteAuthority: configuration.remoteAuthority });
                }
                else if (configuration.folderUri) {
                    configuration.backupPath = this.backupMainService.registerFolderBackupSync(configuration.folderUri);
                }
                else {
                    const backupFolder = options.emptyWindowBackupInfo && options.emptyWindowBackupInfo.backupFolder;
                    configuration.backupPath = this.backupMainService.registerEmptyWindowBackupSync(backupFolder, configuration.remoteAuthority);
                }
            }
            // Load it
            window.load(configuration);
        }
        getNewWindowState(configuration) {
            var _a;
            const lastActive = this.getLastActiveWindow();
            // Restore state unless we are running extension tests
            if (!configuration.extensionTestsPath) {
                // extension development host Window - load from stored settings if any
                if (!!configuration.extensionDevelopmentPath && this.windowsState.lastPluginDevelopmentHostWindow) {
                    return this.windowsState.lastPluginDevelopmentHostWindow.uiState;
                }
                // Known Workspace - load from stored settings
                const workspace = configuration.workspace;
                if (workspace) {
                    const stateForWorkspace = this.windowsState.openedWindows.filter(o => o.workspace && o.workspace.id === workspace.id).map(o => o.uiState);
                    if (stateForWorkspace.length) {
                        return stateForWorkspace[0];
                    }
                }
                // Known Folder - load from stored settings
                if (configuration.folderUri) {
                    const stateForFolder = this.windowsState.openedWindows.filter(o => o.folderUri && resources_1.isEqual(o.folderUri, configuration.folderUri)).map(o => o.uiState);
                    if (stateForFolder.length) {
                        return stateForFolder[0];
                    }
                }
                // Empty windows with backups
                else if (configuration.backupPath) {
                    const stateForEmptyWindow = this.windowsState.openedWindows.filter(o => o.backupPath === configuration.backupPath).map(o => o.uiState);
                    if (stateForEmptyWindow.length) {
                        return stateForEmptyWindow[0];
                    }
                }
                // First Window
                const lastActiveState = this.lastClosedWindowState || this.windowsState.lastActiveWindow;
                if (!lastActive && lastActiveState) {
                    return lastActiveState.uiState;
                }
            }
            //
            // In any other case, we do not have any stored settings for the window state, so we come up with something smart
            //
            // We want the new window to open on the same display that the last active one is in
            let displayToUse;
            const displays = electron_1.screen.getAllDisplays();
            // Single Display
            if (displays.length === 1) {
                displayToUse = displays[0];
            }
            // Multi Display
            else {
                // on mac there is 1 menu per window so we need to use the monitor where the cursor currently is
                if (platform_1.isMacintosh) {
                    const cursorPoint = electron_1.screen.getCursorScreenPoint();
                    displayToUse = electron_1.screen.getDisplayNearestPoint(cursorPoint);
                }
                // if we have a last active window, use that display for the new window
                if (!displayToUse && lastActive) {
                    displayToUse = electron_1.screen.getDisplayMatching(lastActive.getBounds());
                }
                // fallback to primary display or first display
                if (!displayToUse) {
                    displayToUse = electron_1.screen.getPrimaryDisplay() || displays[0];
                }
            }
            // Compute x/y based on display bounds
            // Note: important to use Math.round() because Electron does not seem to be too happy about
            // display coordinates that are not absolute numbers.
            let state = window_1.defaultWindowState();
            state.x = Math.round(displayToUse.bounds.x + (displayToUse.bounds.width / 2) - (state.width / 2));
            state.y = Math.round(displayToUse.bounds.y + (displayToUse.bounds.height / 2) - (state.height / 2));
            // Check for newWindowDimensions setting and adjust accordingly
            const windowConfig = this.configurationService.getValue('window');
            let ensureNoOverlap = true;
            if ((_a = windowConfig) === null || _a === void 0 ? void 0 : _a.newWindowDimensions) {
                if (windowConfig.newWindowDimensions === 'maximized') {
                    state.mode = 0 /* Maximized */;
                    ensureNoOverlap = false;
                }
                else if (windowConfig.newWindowDimensions === 'fullscreen') {
                    state.mode = 3 /* Fullscreen */;
                    ensureNoOverlap = false;
                }
                else if (windowConfig.newWindowDimensions === 'inherit' && lastActive) {
                    const lastActiveState = lastActive.serializeWindowState();
                    if (lastActiveState.mode === 3 /* Fullscreen */) {
                        state.mode = 3 /* Fullscreen */; // only take mode (fixes https://github.com/Microsoft/vscode/issues/19331)
                    }
                    else {
                        state = lastActiveState;
                    }
                    ensureNoOverlap = false;
                }
            }
            if (ensureNoOverlap) {
                state = this.ensureNoOverlap(state);
            }
            state.hasDefaultState = true; // flag as default state
            return state;
        }
        ensureNoOverlap(state) {
            if (WindowsMainService.WINDOWS.length === 0) {
                return state;
            }
            state.x = typeof state.x === 'number' ? state.x : 0;
            state.y = typeof state.y === 'number' ? state.y : 0;
            const existingWindowBounds = WindowsMainService.WINDOWS.map(win => win.getBounds());
            while (existingWindowBounds.some(b => b.x === state.x || b.y === state.y)) {
                state.x += 30;
                state.y += 30;
            }
            return state;
        }
        focusLastActive(cli, context) {
            const lastActive = this.getLastActiveWindow();
            if (lastActive) {
                lastActive.focus();
                return lastActive;
            }
            // No window - open new empty one
            return this.open({ context, cli, forceEmpty: true })[0];
        }
        getLastActiveWindow() {
            return window_2.getLastActiveWindow(WindowsMainService.WINDOWS);
        }
        getLastActiveWindowForAuthority(remoteAuthority) {
            return window_2.getLastActiveWindow(WindowsMainService.WINDOWS.filter(window => window.remoteAuthority === remoteAuthority));
        }
        sendToFocused(channel, ...args) {
            const focusedWindow = this.getFocusedWindow() || this.getLastActiveWindow();
            if (focusedWindow) {
                focusedWindow.sendWhenReady(channel, ...args);
            }
        }
        sendToAll(channel, payload, windowIdsToIgnore) {
            for (const window of WindowsMainService.WINDOWS) {
                if (windowIdsToIgnore && windowIdsToIgnore.indexOf(window.id) >= 0) {
                    continue; // do not send if we are instructed to ignore it
                }
                window.sendWhenReady(channel, payload);
            }
        }
        getFocusedWindow() {
            const win = electron_1.BrowserWindow.getFocusedWindow();
            if (win) {
                return this.getWindowById(win.id);
            }
            return undefined;
        }
        getWindowById(windowId) {
            const res = WindowsMainService.WINDOWS.filter(window => window.id === windowId);
            return arrays.firstOrDefault(res);
        }
        getWindows() {
            return WindowsMainService.WINDOWS;
        }
        getWindowCount() {
            return WindowsMainService.WINDOWS.length;
        }
        onWindowClosed(win) {
            // Remove from our list so that Electron can clean it up
            const index = WindowsMainService.WINDOWS.indexOf(win);
            WindowsMainService.WINDOWS.splice(index, 1);
            // Emit
            this._onWindowsCountChanged.fire({ oldCount: WindowsMainService.WINDOWS.length + 1, newCount: WindowsMainService.WINDOWS.length });
            this._onWindowClose.fire(win.id);
        }
    };
    WindowsMainService.windowsStateStorageKey = 'windowsState';
    WindowsMainService.WINDOWS = [];
    WindowsMainService = __decorate([
        __param(2, log_1.ILogService),
        __param(3, state_1.IStateService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, lifecycleMainService_1.ILifecycleMainService),
        __param(6, backup_1.IBackupMainService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, workspacesHistoryMainService_1.IWorkspacesHistoryMainService),
        __param(9, workspacesMainService_1.IWorkspacesMainService),
        __param(10, instantiation_1.IInstantiationService),
        __param(11, dialogs_1.IDialogMainService)
    ], WindowsMainService);
    exports.WindowsMainService = WindowsMainService;
});
//# sourceMappingURL=windowsMainService.js.map