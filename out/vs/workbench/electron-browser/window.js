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
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/errors", "vs/base/common/objects", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/files/common/files", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/platform/telemetry/common/telemetry", "vs/platform/windows/common/windows", "vs/workbench/services/title/common/titleService", "vs/workbench/services/themes/common/workbenchThemeService", "vs/base/browser/browser", "vs/platform/commands/common/commands", "vs/workbench/services/keybinding/electron-browser/nativeKeymapService", "electron", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/base/common/async", "vs/base/common/lifecycle", "vs/platform/lifecycle/common/lifecycle", "vs/platform/workspaces/common/workspaces", "vs/workbench/services/integrity/common/integrity", "vs/base/common/platform", "vs/platform/product/common/product", "vs/platform/notification/common/notification", "vs/platform/keybinding/common/keybinding", "vs/workbench/services/environment/common/environmentService", "vs/platform/accessibility/common/accessibility", "vs/platform/workspace/common/workspace", "vs/base/common/arrays", "vs/platform/configuration/common/configuration", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/resources", "vs/platform/instantiation/common/instantiation", "../browser/parts/titlebar/menubarControl", "vs/platform/label/common/label", "vs/platform/update/common/update", "vs/platform/storage/common/storage", "../services/preferences/common/preferences", "vs/platform/menubar/node/menubar", "vs/base/common/types", "vs/platform/opener/common/opener", "vs/base/common/network", "vs/platform/electron/node/electron", "vs/base/common/path", "vs/base/common/labels", "vs/platform/remote/common/tunnel", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/host/browser/host", "vs/workbench/services/electron/electron-browser/electronEnvironmentService"], function (require, exports, nls, uri_1, errors, objects_1, DOM, actionbar_1, files_1, editor_1, editorService_1, telemetry_1, windows_1, titleService_1, workbenchThemeService_1, browser, commands_1, nativeKeymapService_1, electron_1, workspaceEditing_1, actions_1, contextkey_1, menuEntryActionViewItem_1, async_1, lifecycle_1, lifecycle_2, workspaces_1, integrity_1, platform_1, product_1, notification_1, keybinding_1, environmentService_1, accessibility_1, workspace_1, arrays_1, configuration_1, textfiles_1, resources_1, instantiation_1, menubarControl_1, label_1, update_1, storage_1, preferences_1, menubar_1, types_1, opener_1, network_1, electron_2, path_1, labels_1, tunnel_1, layoutService_1, host_1, electronEnvironmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ElectronWindow = class ElectronWindow extends lifecycle_1.Disposable {
        constructor(editorService, configurationService, titleService, themeService, notificationService, commandService, keybindingService, telemetryService, workspaceEditingService, fileService, menuService, lifecycleService, integrityService, environmentService, accessibilityService, contextService, textFileService, instantiationService, openerService, electronService, tunnelService, layoutService, electronEnvironmentService) {
            super();
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.titleService = titleService;
            this.themeService = themeService;
            this.notificationService = notificationService;
            this.commandService = commandService;
            this.keybindingService = keybindingService;
            this.telemetryService = telemetryService;
            this.workspaceEditingService = workspaceEditingService;
            this.fileService = fileService;
            this.menuService = menuService;
            this.lifecycleService = lifecycleService;
            this.integrityService = integrityService;
            this.environmentService = environmentService;
            this.accessibilityService = accessibilityService;
            this.contextService = contextService;
            this.textFileService = textFileService;
            this.instantiationService = instantiationService;
            this.openerService = openerService;
            this.electronService = electronService;
            this.tunnelService = tunnelService;
            this.layoutService = layoutService;
            this.electronEnvironmentService = electronEnvironmentService;
            this.touchBarDisposables = this._register(new lifecycle_1.DisposableStore());
            this.customTitleContextMenuDisposable = this._register(new lifecycle_1.DisposableStore());
            this.closeEmptyWindowScheduler = this._register(new async_1.RunOnceScheduler(() => this.onAllEditorsClosed(), 50));
            this.pendingFoldersToAdd = [];
            this.addFoldersScheduler = this._register(new async_1.RunOnceScheduler(() => this.doAddFolders(), 100));
            this.registerListeners();
            this.create();
        }
        registerListeners() {
            // React to editor input changes
            this._register(this.editorService.onDidActiveEditorChange(() => this.updateTouchbarMenu()));
            // prevent opening a real URL inside the shell
            [DOM.EventType.DRAG_OVER, DOM.EventType.DROP].forEach(event => {
                window.document.body.addEventListener(event, (e) => {
                    DOM.EventHelper.stop(e);
                });
            });
            // Support runAction event
            electron_1.ipcRenderer.on('vscode:runAction', async (event, request) => {
                const args = request.args || [];
                // If we run an action from the touchbar, we fill in the currently active resource
                // as payload because the touch bar items are context aware depending on the editor
                if (request.from === 'touchbar') {
                    const activeEditor = this.editorService.activeEditor;
                    if (activeEditor) {
                        const resource = editor_1.toResource(activeEditor, { supportSideBySide: editor_1.SideBySideEditor.MASTER });
                        if (resource) {
                            args.push(resource);
                        }
                    }
                }
                else {
                    args.push({ from: request.from }); // TODO@telemetry this is a bit weird to send this to every action?
                }
                try {
                    await this.commandService.executeCommand(request.id, ...args);
                    this.telemetryService.publicLog2('commandExecuted', { id: request.id, from: request.from });
                }
                catch (error) {
                    this.notificationService.error(error);
                }
            });
            // Support runKeybinding event
            electron_1.ipcRenderer.on('vscode:runKeybinding', (event, request) => {
                if (document.activeElement) {
                    this.keybindingService.dispatchByUserSettingsLabel(request.userSettingsLabel, document.activeElement);
                }
            });
            // Error reporting from main
            electron_1.ipcRenderer.on('vscode:reportError', (event, error) => {
                if (error) {
                    errors.onUnexpectedError(JSON.parse(error));
                }
            });
            // Support openFiles event for existing and new files
            electron_1.ipcRenderer.on('vscode:openFiles', (event, request) => this.onOpenFiles(request));
            // Support addFolders event if we have a workspace opened
            electron_1.ipcRenderer.on('vscode:addFolders', (event, request) => this.onAddFoldersRequest(request));
            // Message support
            electron_1.ipcRenderer.on('vscode:showInfoMessage', (event, message) => {
                this.notificationService.info(message);
            });
            // Fullscreen Events
            electron_1.ipcRenderer.on('vscode:enterFullScreen', async () => {
                await this.lifecycleService.when(2 /* Ready */);
                browser.setFullscreen(true);
            });
            electron_1.ipcRenderer.on('vscode:leaveFullScreen', async () => {
                await this.lifecycleService.when(2 /* Ready */);
                browser.setFullscreen(false);
            });
            // High Contrast Events
            electron_1.ipcRenderer.on('vscode:enterHighContrast', async () => {
                const windowConfig = this.configurationService.getValue('window');
                if (windowConfig && windowConfig.autoDetectHighContrast) {
                    await this.lifecycleService.when(2 /* Ready */);
                    this.themeService.setColorTheme(workbenchThemeService_1.VS_HC_THEME, undefined);
                }
            });
            electron_1.ipcRenderer.on('vscode:leaveHighContrast', async () => {
                const windowConfig = this.configurationService.getValue('window');
                if (windowConfig && windowConfig.autoDetectHighContrast) {
                    await this.lifecycleService.when(2 /* Ready */);
                    this.themeService.restoreColorTheme();
                }
            });
            // keyboard layout changed event
            electron_1.ipcRenderer.on('vscode:keyboardLayoutChanged', () => {
                nativeKeymapService_1.KeyboardMapperFactory.INSTANCE._onKeyboardLayoutChanged();
            });
            // keyboard layout changed event
            electron_1.ipcRenderer.on('vscode:accessibilitySupportChanged', (event, accessibilitySupportEnabled) => {
                this.accessibilityService.setAccessibilitySupport(accessibilitySupportEnabled ? 2 /* Enabled */ : 1 /* Disabled */);
            });
            // Zoom level changes
            this.updateWindowZoomLevel();
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('window.zoomLevel')) {
                    this.updateWindowZoomLevel();
                }
                else if (e.affectsConfiguration('keyboard.touchbar.enabled') || e.affectsConfiguration('keyboard.touchbar.ignored')) {
                    this.updateTouchbarMenu();
                }
            }));
            // Listen to visible editor changes
            this._register(this.editorService.onDidVisibleEditorsChange(() => this.onDidVisibleEditorsChange()));
            // Listen to editor closing (if we run with --wait)
            const filesToWait = this.environmentService.configuration.filesToWait;
            if (filesToWait) {
                const waitMarkerFile = filesToWait.waitMarkerFileUri;
                const resourcesToWaitFor = arrays_1.coalesce(filesToWait.paths.map(p => p.fileUri));
                this._register(this.trackClosedWaitFiles(waitMarkerFile, resourcesToWaitFor));
            }
            // macOS OS integration
            if (platform_1.isMacintosh) {
                this._register(this.editorService.onDidActiveEditorChange(() => {
                    const file = editor_1.toResource(this.editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.MASTER, filterByScheme: network_1.Schemas.file });
                    // Represented Filename
                    this.updateRepresentedFilename(file ? file.fsPath : undefined);
                    // Custom title menu
                    this.provideCustomTitleContextMenu(file ? file.fsPath : undefined);
                }));
            }
            // Maximize/Restore on doubleclick (for macOS custom title)
            if (platform_1.isMacintosh && windows_1.getTitleBarStyle(this.configurationService, this.environmentService) === 'custom') {
                const titlePart = types_1.assertIsDefined(this.layoutService.getContainer("workbench.parts.titlebar" /* TITLEBAR_PART */));
                this._register(DOM.addDisposableListener(titlePart, DOM.EventType.DBLCLICK, e => {
                    DOM.EventHelper.stop(e);
                    this.electronService.handleTitleDoubleClick();
                }));
            }
        }
        onDidVisibleEditorsChange() {
            // Close when empty: check if we should close the window based on the setting
            // Overruled by: window has a workspace opened or this window is for extension development
            // or setting is disabled. Also enabled when running with --wait from the command line.
            const visibleEditors = this.editorService.visibleControls;
            if (visibleEditors.length === 0 && this.contextService.getWorkbenchState() === 1 /* EMPTY */ && !this.environmentService.isExtensionDevelopment) {
                const closeWhenEmpty = this.configurationService.getValue('window.closeWhenEmpty');
                if (closeWhenEmpty || this.environmentService.args.wait) {
                    this.closeEmptyWindowScheduler.schedule();
                }
            }
        }
        onAllEditorsClosed() {
            const visibleEditors = this.editorService.visibleControls.length;
            if (visibleEditors === 0) {
                this.electronService.closeWindow();
            }
        }
        updateWindowZoomLevel() {
            const windowConfig = this.configurationService.getValue();
            let newZoomLevel = 0;
            if (windowConfig.window && typeof windowConfig.window.zoomLevel === 'number') {
                newZoomLevel = windowConfig.window.zoomLevel;
                // Leave early if the configured zoom level did not change (https://github.com/Microsoft/vscode/issues/1536)
                if (this.previousConfiguredZoomLevel === newZoomLevel) {
                    return;
                }
                this.previousConfiguredZoomLevel = newZoomLevel;
            }
            if (electron_1.webFrame.getZoomLevel() !== newZoomLevel) {
                electron_1.webFrame.setZoomLevel(newZoomLevel);
                browser.setZoomFactor(electron_1.webFrame.getZoomFactor());
                // See https://github.com/Microsoft/vscode/issues/26151
                // Cannot be trusted because the webFrame might take some time
                // until it really applies the new zoom level
                browser.setZoomLevel(electron_1.webFrame.getZoomLevel(), /*isTrusted*/ false);
            }
        }
        updateRepresentedFilename(filePath) {
            this.electronService.setRepresentedFilename(filePath ? filePath : '');
        }
        provideCustomTitleContextMenu(filePath) {
            // Clear old menu
            this.customTitleContextMenuDisposable.clear();
            // Provide new menu if a file is opened and we are on a custom title
            if (!filePath || windows_1.getTitleBarStyle(this.configurationService, this.environmentService) !== 'custom') {
                return;
            }
            // Split up filepath into segments
            const segments = filePath.split(path_1.posix.sep);
            for (let i = segments.length; i > 0; i--) {
                const isFile = (i === segments.length);
                let pathOffset = i;
                if (!isFile) {
                    pathOffset++; // for segments which are not the file name we want to open the folder
                }
                const path = segments.slice(0, pathOffset).join(path_1.posix.sep);
                let label;
                if (!isFile) {
                    label = labels_1.getBaseLabel(path_1.dirname(path));
                }
                else {
                    label = labels_1.getBaseLabel(path);
                }
                const commandId = `workbench.action.revealPathInFinder${i}`;
                this.customTitleContextMenuDisposable.add(commands_1.CommandsRegistry.registerCommand(commandId, () => this.electronService.showItemInFolder(path)));
                this.customTitleContextMenuDisposable.add(actions_1.MenuRegistry.appendMenuItem(38 /* TitleBarContext */, { command: { id: commandId, title: label || path_1.posix.sep }, order: -i }));
            }
        }
        create() {
            // Native menu controller
            if (platform_1.isMacintosh || windows_1.getTitleBarStyle(this.configurationService, this.environmentService) === 'native') {
                this._register(this.instantiationService.createInstance(NativeMenubarControl));
            }
            // Handle open calls
            this.setupOpenHandlers();
            // Emit event when vscode is ready
            this.lifecycleService.when(2 /* Ready */).then(() => electron_1.ipcRenderer.send('vscode:workbenchReady', this.electronEnvironmentService.windowId));
            // Integrity warning
            this.integrityService.isPure().then(res => this.titleService.updateProperties({ isPure: res.isPure }));
            // Root warning
            this.lifecycleService.when(3 /* Restored */).then(async () => {
                let isAdmin;
                if (platform_1.isWindows) {
                    isAdmin = (await new Promise((resolve_1, reject_1) => { require(['native-is-elevated'], resolve_1, reject_1); }))();
                }
                else {
                    isAdmin = platform_1.isRootUser();
                }
                // Update title
                this.titleService.updateProperties({ isAdmin });
                // Show warning message (unix only)
                if (isAdmin && !platform_1.isWindows) {
                    this.notificationService.warn(nls.localize('runningAsRoot', "It is not recommended to run {0} as root user.", product_1.default.nameShort));
                }
            });
            // Touchbar menu (if enabled)
            this.updateTouchbarMenu();
            // Crash reporter (if enabled)
            if (!this.environmentService.disableCrashReporter && product_1.default.crashReporter && product_1.default.hockeyApp && this.configurationService.getValue('telemetry.enableCrashReporter')) {
                this.setupCrashReporter(product_1.default.crashReporter.companyName, product_1.default.crashReporter.productName, product_1.default.hockeyApp);
            }
        }
        setupOpenHandlers() {
            // Block window.open() calls
            window.open = function () {
                throw new Error('Prevented call to window.open(). Use IOpenerService instead!');
            };
            // Handle internal open() calls
            this.openerService.registerOpener({
                open: async (resource, options) => {
                    // If either the caller wants to open externally or the
                    // scheme is one where we prefer to open externally
                    // we handle this resource by delegating the opening to
                    // the main process to prevent window focus issues.
                    if (this.shouldOpenExternal(resource, options)) {
                        const { resolved } = await this.openerService.resolveExternalUri(resource, options);
                        const success = await this.electronService.openExternal(encodeURI(resolved.toString(true)));
                        if (!success && resolved.scheme === network_1.Schemas.file) {
                            // if opening failed, and this is a file, we can still try to reveal it
                            await this.electronService.showItemInFolder(resolved.fsPath);
                        }
                        return true;
                    }
                    return false; // not handled by us
                }
            });
            this.openerService.registerExternalUriResolver({
                resolveExternalUri: async (uri, options) => {
                    if (options && options.allowTunneling) {
                        const portMappingRequest = tunnel_1.extractLocalHostUriMetaDataForPortMapping(uri);
                        if (portMappingRequest) {
                            const tunnel = await this.tunnelService.openTunnel(portMappingRequest.port);
                            if (tunnel) {
                                return {
                                    resolved: uri.with({ authority: `127.0.0.1:${tunnel.tunnelLocalPort}` }),
                                    dispose: () => tunnel.dispose(),
                                };
                            }
                        }
                    }
                    return undefined;
                }
            });
        }
        shouldOpenExternal(resource, options) {
            const scheme = resource.scheme.toLowerCase();
            const preferOpenExternal = (scheme === network_1.Schemas.mailto || scheme === network_1.Schemas.http || scheme === network_1.Schemas.https);
            return (options && options.openExternal) || preferOpenExternal;
        }
        updateTouchbarMenu() {
            if (!platform_1.isMacintosh) {
                return; // macOS only
            }
            // Dispose old
            this.touchBarDisposables.clear();
            this.touchBarMenu = undefined;
            // Create new (delayed)
            const scheduler = this.touchBarDisposables.add(new async_1.RunOnceScheduler(() => this.doUpdateTouchbarMenu(scheduler), 300));
            scheduler.schedule();
        }
        doUpdateTouchbarMenu(scheduler) {
            if (!this.touchBarMenu) {
                this.touchBarMenu = this.editorService.invokeWithinEditorContext(accessor => this.menuService.createMenu(37 /* TouchBarContext */, accessor.get(contextkey_1.IContextKeyService)));
                this.touchBarDisposables.add(this.touchBarMenu);
                this.touchBarDisposables.add(this.touchBarMenu.onDidChange(() => scheduler.schedule()));
            }
            const actions = [];
            const disabled = this.configurationService.getValue('keyboard.touchbar.enabled') === false;
            const ignoredItems = this.configurationService.getValue('keyboard.touchbar.ignored') || [];
            // Fill actions into groups respecting order
            this.touchBarDisposables.add(menuEntryActionViewItem_1.createAndFillInActionBarActions(this.touchBarMenu, undefined, actions));
            // Convert into command action multi array
            const items = [];
            let group = [];
            if (!disabled) {
                for (const action of actions) {
                    // Command
                    if (action instanceof actions_1.MenuItemAction) {
                        if (ignoredItems.indexOf(action.item.id) >= 0) {
                            continue; // ignored
                        }
                        group.push(action.item);
                    }
                    // Separator
                    else if (action instanceof actionbar_1.Separator) {
                        if (group.length) {
                            items.push(group);
                        }
                        group = [];
                    }
                }
                if (group.length) {
                    items.push(group);
                }
            }
            // Only update if the actions have changed
            if (!objects_1.equals(this.lastInstalledTouchedBar, items)) {
                this.lastInstalledTouchedBar = items;
                this.electronService.updateTouchBar(items);
            }
        }
        async setupCrashReporter(companyName, productName, hockeyAppConfig) {
            if (!hockeyAppConfig) {
                return;
            }
            // base options with product info
            const options = {
                companyName,
                productName,
                submitURL: platform_1.isWindows ? hockeyAppConfig[process.arch === 'ia32' ? 'win32-ia32' : 'win32-x64'] : platform_1.isLinux ? hockeyAppConfig[`linux-x64`] : hockeyAppConfig.darwin,
                extra: {
                    vscode_version: product_1.default.version,
                    vscode_commit: product_1.default.commit
                }
            };
            // mixin telemetry info
            const info = await this.telemetryService.getTelemetryInfo();
            objects_1.assign(options.extra, { vscode_sessionId: info.sessionId });
            // start crash reporter right here
            electron_1.crashReporter.start(objects_1.deepClone(options));
            // start crash reporter in the main process
            return this.electronService.startCrashReporter(options);
        }
        onAddFoldersRequest(request) {
            // Buffer all pending requests
            this.pendingFoldersToAdd.push(...request.foldersToAdd.map(f => uri_1.URI.revive(f)));
            // Delay the adding of folders a bit to buffer in case more requests are coming
            if (!this.addFoldersScheduler.isScheduled()) {
                this.addFoldersScheduler.schedule();
            }
        }
        doAddFolders() {
            const foldersToAdd = [];
            this.pendingFoldersToAdd.forEach(folder => {
                foldersToAdd.push(({ uri: folder }));
            });
            this.pendingFoldersToAdd = [];
            this.workspaceEditingService.addFolders(foldersToAdd);
        }
        async onOpenFiles(request) {
            const inputs = [];
            const diffMode = !!(request.filesToDiff && (request.filesToDiff.length === 2));
            if (!diffMode && request.filesToOpenOrCreate) {
                inputs.push(...(await editor_1.pathsToEditors(request.filesToOpenOrCreate, this.fileService)));
            }
            if (diffMode && request.filesToDiff) {
                inputs.push(...(await editor_1.pathsToEditors(request.filesToDiff, this.fileService)));
            }
            if (inputs.length) {
                this.openResources(inputs, diffMode);
            }
            if (request.filesToWait && inputs.length) {
                // In wait mode, listen to changes to the editors and wait until the files
                // are closed that the user wants to wait for. When this happens we delete
                // the wait marker file to signal to the outside that editing is done.
                const waitMarkerFile = uri_1.URI.revive(request.filesToWait.waitMarkerFileUri);
                const resourcesToWaitFor = arrays_1.coalesce(request.filesToWait.paths.map(p => uri_1.URI.revive(p.fileUri)));
                this.trackClosedWaitFiles(waitMarkerFile, resourcesToWaitFor);
            }
        }
        trackClosedWaitFiles(waitMarkerFile, resourcesToWaitFor) {
            const listener = this.editorService.onDidCloseEditor(async () => {
                // In wait mode, listen to changes to the editors and wait until the files
                // are closed that the user wants to wait for. When this happens we delete
                // the wait marker file to signal to the outside that editing is done.
                if (resourcesToWaitFor.every(resource => !this.editorService.isOpen({ resource }))) {
                    // If auto save is configured with the default delay (1s) it is possible
                    // to close the editor while the save still continues in the background. As such
                    // we have to also check if the files to wait for are dirty and if so wait
                    // for them to get saved before deleting the wait marker file.
                    const dirtyFilesToWait = this.textFileService.getDirty(resourcesToWaitFor);
                    if (dirtyFilesToWait.length > 0) {
                        await Promise.all(dirtyFilesToWait.map(async (dirtyFileToWait) => await this.joinResourceSaved(dirtyFileToWait)));
                    }
                    listener.dispose();
                    await this.fileService.del(waitMarkerFile);
                }
            });
            return listener;
        }
        joinResourceSaved(resource) {
            return new Promise(resolve => {
                if (!this.textFileService.isDirty(resource)) {
                    return resolve(); // return early if resource is not dirty
                }
                // Otherwise resolve promise when resource is saved
                const listener = this.textFileService.models.onModelSaved(e => {
                    if (resources_1.isEqual(resource, e.resource)) {
                        listener.dispose();
                        resolve();
                    }
                });
            });
        }
        async openResources(resources, diffMode) {
            await this.lifecycleService.when(2 /* Ready */);
            // In diffMode we open 2 resources as diff
            if (diffMode && resources.length === 2 && resources[0].resource && resources[1].resource) {
                return this.editorService.openEditor({ leftResource: resources[0].resource, rightResource: resources[1].resource, options: { pinned: true } });
            }
            // For one file, just put it into the current active editor
            if (resources.length === 1) {
                return this.editorService.openEditor(resources[0]);
            }
            // Otherwise open all
            return this.editorService.openEditors(resources);
        }
    };
    ElectronWindow = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, titleService_1.ITitleService),
        __param(3, workbenchThemeService_1.IWorkbenchThemeService),
        __param(4, notification_1.INotificationService),
        __param(5, commands_1.ICommandService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, workspaceEditing_1.IWorkspaceEditingService),
        __param(9, files_1.IFileService),
        __param(10, actions_1.IMenuService),
        __param(11, lifecycle_2.ILifecycleService),
        __param(12, integrity_1.IIntegrityService),
        __param(13, environmentService_1.IWorkbenchEnvironmentService),
        __param(14, accessibility_1.IAccessibilityService),
        __param(15, workspace_1.IWorkspaceContextService),
        __param(16, textfiles_1.ITextFileService),
        __param(17, instantiation_1.IInstantiationService),
        __param(18, opener_1.IOpenerService),
        __param(19, electron_2.IElectronService),
        __param(20, tunnel_1.ITunnelService),
        __param(21, layoutService_1.IWorkbenchLayoutService),
        __param(22, electronEnvironmentService_1.IElectronEnvironmentService)
    ], ElectronWindow);
    exports.ElectronWindow = ElectronWindow;
    let NativeMenubarControl = class NativeMenubarControl extends menubarControl_1.MenubarControl {
        constructor(menuService, workspacesService, contextKeyService, keybindingService, configurationService, labelService, updateService, storageService, notificationService, preferencesService, environmentService, accessibilityService, menubarService, hostService, electronEnvironmentService) {
            super(menuService, workspacesService, contextKeyService, keybindingService, configurationService, labelService, updateService, storageService, notificationService, preferencesService, environmentService, accessibilityService, hostService);
            this.menubarService = menubarService;
            this.electronEnvironmentService = electronEnvironmentService;
            if (platform_1.isMacintosh) {
                this.menus['Preferences'] = this._register(this.menuService.createMenu(20 /* MenubarPreferencesMenu */, this.contextKeyService));
                this.topLevelTitles['Preferences'] = nls.localize('mPreferences', "Preferences");
            }
            for (const topLevelMenuName of Object.keys(this.topLevelTitles)) {
                const menu = this.menus[topLevelMenuName];
                if (menu) {
                    this._register(menu.onDidChange(() => this.updateMenubar()));
                }
            }
            (async () => {
                this.recentlyOpened = await this.workspacesService.getRecentlyOpened();
                this.doUpdateMenubar(true);
            })();
            this.registerListeners();
        }
        doUpdateMenubar(firstTime) {
            // Send menus to main process to be rendered by Electron
            const menubarData = { menus: {}, keybindings: {} };
            if (this.getMenubarMenus(menubarData)) {
                this.menubarService.updateMenubar(this.electronEnvironmentService.windowId, menubarData);
            }
        }
        getMenubarMenus(menubarData) {
            if (!menubarData) {
                return false;
            }
            menubarData.keybindings = this.getAdditionalKeybindings();
            for (const topLevelMenuName of Object.keys(this.topLevelTitles)) {
                const menu = this.menus[topLevelMenuName];
                if (menu) {
                    const menubarMenu = { items: [] };
                    this.populateMenuItems(menu, menubarMenu, menubarData.keybindings);
                    if (menubarMenu.items.length === 0) {
                        return false; // Menus are incomplete
                    }
                    menubarData.menus[topLevelMenuName] = menubarMenu;
                }
            }
            return true;
        }
        populateMenuItems(menu, menuToPopulate, keybindings) {
            let groups = menu.getActions();
            for (let group of groups) {
                const [, actions] = group;
                actions.forEach(menuItem => {
                    if (menuItem instanceof actions_1.SubmenuItemAction) {
                        const submenu = { items: [] };
                        if (!this.menus[menuItem.item.submenu]) {
                            const menu = this.menus[menuItem.item.submenu] = this.menuService.createMenu(menuItem.item.submenu, this.contextKeyService);
                            this._register(menu.onDidChange(() => this.updateMenubar()));
                        }
                        const menuToDispose = this.menuService.createMenu(menuItem.item.submenu, this.contextKeyService);
                        this.populateMenuItems(menuToDispose, submenu, keybindings);
                        let menubarSubmenuItem = {
                            id: menuItem.id,
                            label: menuItem.label,
                            submenu: submenu
                        };
                        menuToPopulate.items.push(menubarSubmenuItem);
                        menuToDispose.dispose();
                    }
                    else {
                        if (menuItem.id === 'workbench.action.openRecent') {
                            const actions = this.getOpenRecentActions().map(this.transformOpenRecentAction);
                            menuToPopulate.items.push(...actions);
                        }
                        let menubarMenuItem = {
                            id: menuItem.id,
                            label: menuItem.label
                        };
                        if (menuItem.checked) {
                            menubarMenuItem.checked = true;
                        }
                        if (!menuItem.enabled) {
                            menubarMenuItem.enabled = false;
                        }
                        menubarMenuItem.label = this.calculateActionLabel(menubarMenuItem);
                        keybindings[menuItem.id] = this.getMenubarKeybinding(menuItem.id);
                        menuToPopulate.items.push(menubarMenuItem);
                    }
                });
                menuToPopulate.items.push({ id: 'vscode.menubar.separator' });
            }
            if (menuToPopulate.items.length > 0) {
                menuToPopulate.items.pop();
            }
        }
        transformOpenRecentAction(action) {
            if (action instanceof actionbar_1.Separator) {
                return { id: 'vscode.menubar.separator' };
            }
            return {
                id: action.id,
                uri: action.uri,
                enabled: action.enabled,
                label: action.label
            };
        }
        getAdditionalKeybindings() {
            const keybindings = {};
            if (platform_1.isMacintosh) {
                const keybinding = this.getMenubarKeybinding('workbench.action.quit');
                if (keybinding) {
                    keybindings['workbench.action.quit'] = keybinding;
                }
            }
            return keybindings;
        }
        getMenubarKeybinding(id) {
            const binding = this.keybindingService.lookupKeybinding(id);
            if (!binding) {
                return undefined;
            }
            // first try to resolve a native accelerator
            const electronAccelerator = binding.getElectronAccelerator();
            if (electronAccelerator) {
                return { label: electronAccelerator, userSettingsLabel: types_1.withNullAsUndefined(binding.getUserSettingsLabel()) };
            }
            // we need this fallback to support keybindings that cannot show in electron menus (e.g. chords)
            const acceleratorLabel = binding.getLabel();
            if (acceleratorLabel) {
                return { label: acceleratorLabel, isNative: false, userSettingsLabel: types_1.withNullAsUndefined(binding.getUserSettingsLabel()) };
            }
            return undefined;
        }
    };
    NativeMenubarControl = __decorate([
        __param(0, actions_1.IMenuService),
        __param(1, workspaces_1.IWorkspacesService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, label_1.ILabelService),
        __param(6, update_1.IUpdateService),
        __param(7, storage_1.IStorageService),
        __param(8, notification_1.INotificationService),
        __param(9, preferences_1.IPreferencesService),
        __param(10, environmentService_1.IWorkbenchEnvironmentService),
        __param(11, accessibility_1.IAccessibilityService),
        __param(12, menubar_1.IMenubarService),
        __param(13, host_1.IHostService),
        __param(14, electronEnvironmentService_1.IElectronEnvironmentService)
    ], NativeMenubarControl);
});
//# sourceMappingURL=window.js.map