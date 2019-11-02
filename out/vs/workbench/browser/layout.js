/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/browser/dom", "vs/base/browser/browser", "vs/workbench/services/backup/common/backup", "vs/platform/registry/common/platform", "vs/base/common/platform", "vs/workbench/common/editor", "vs/workbench/browser/parts/sidebar/sidebarPart", "vs/workbench/browser/parts/panel/panelPart", "vs/workbench/browser/panel", "vs/platform/workspace/common/workspace", "vs/platform/storage/common/storage", "vs/platform/configuration/common/configuration", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/services/panel/common/panelService", "vs/workbench/services/title/common/titleService", "vs/platform/lifecycle/common/lifecycle", "vs/platform/windows/common/windows", "vs/workbench/services/host/browser/host", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/browser/ui/grid/grid", "vs/workbench/services/statusbar/common/statusbar", "vs/workbench/services/activityBar/browser/activityBarService", "vs/platform/files/common/files", "vs/editor/browser/editorBrowser", "vs/base/common/arrays", "vs/base/common/types", "vs/platform/notification/common/notification", "vs/platform/theme/common/themeService", "vs/workbench/common/theme"], function (require, exports, lifecycle_1, event_1, dom_1, browser_1, backup_1, platform_1, platform_2, editor_1, sidebarPart_1, panelPart_1, panel_1, workspace_1, storage_1, configuration_1, viewlet_1, panelService_1, titleService_1, lifecycle_2, windows_1, host_1, environmentService_1, editorService_1, editorGroupsService_1, grid_1, statusbar_1, activityBarService_1, files_1, editorBrowser_1, arrays_1, types_1, notification_1, themeService_1, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Settings;
    (function (Settings) {
        Settings["ACTIVITYBAR_VISIBLE"] = "workbench.activityBar.visible";
        Settings["STATUSBAR_VISIBLE"] = "workbench.statusBar.visible";
        Settings["SIDEBAR_POSITION"] = "workbench.sideBar.location";
        Settings["PANEL_POSITION"] = "workbench.panel.defaultLocation";
        Settings["ZEN_MODE_RESTORE"] = "zenMode.restore";
    })(Settings || (Settings = {}));
    var Storage;
    (function (Storage) {
        Storage["SIDEBAR_HIDDEN"] = "workbench.sidebar.hidden";
        Storage["SIDEBAR_SIZE"] = "workbench.sidebar.size";
        Storage["PANEL_HIDDEN"] = "workbench.panel.hidden";
        Storage["PANEL_POSITION"] = "workbench.panel.location";
        Storage["PANEL_SIZE"] = "workbench.panel.size";
        Storage["PANEL_LAST_NON_MAXIMIZED_WIDTH"] = "workbench.panel.lastNonMaximizedWidth";
        Storage["PANEL_LAST_NON_MAXIMIZED_HEIGHT"] = "workbench.panel.lastNonMaximizedHeight";
        Storage["EDITOR_HIDDEN"] = "workbench.editor.hidden";
        Storage["ZEN_MODE_ENABLED"] = "workbench.zenmode.active";
        Storage["CENTERED_LAYOUT_ENABLED"] = "workbench.centerededitorlayout.active";
        Storage["GRID_LAYOUT"] = "workbench.grid.layout";
        Storage["GRID_WIDTH"] = "workbench.grid.width";
        Storage["GRID_HEIGHT"] = "workbench.grid.height";
    })(Storage || (Storage = {}));
    var Classes;
    (function (Classes) {
        Classes["SIDEBAR_HIDDEN"] = "nosidebar";
        Classes["EDITOR_HIDDEN"] = "noeditorarea";
        Classes["PANEL_HIDDEN"] = "nopanel";
        Classes["STATUSBAR_HIDDEN"] = "nostatusbar";
        Classes["FULLSCREEN"] = "fullscreen";
        Classes["WINDOW_BORDER"] = "border";
    })(Classes || (Classes = {}));
    class Layout extends lifecycle_1.Disposable {
        constructor(parent) {
            super();
            this.parent = parent;
            //#region Events
            this._onZenModeChange = this._register(new event_1.Emitter());
            this.onZenModeChange = this._onZenModeChange.event;
            this._onFullscreenChange = this._register(new event_1.Emitter());
            this.onFullscreenChange = this._onFullscreenChange.event;
            this._onCenteredLayoutChange = this._register(new event_1.Emitter());
            this.onCenteredLayoutChange = this._onCenteredLayoutChange.event;
            this._onPanelPositionChange = this._register(new event_1.Emitter());
            this.onPanelPositionChange = this._onPanelPositionChange.event;
            this._onPartVisibilityChange = this._register(new event_1.Emitter());
            this.onPartVisibilityChange = this._onPartVisibilityChange.event;
            this._onLayout = this._register(new event_1.Emitter());
            this.onLayout = this._onLayout.event;
            this._container = document.createElement('div');
            this.parts = new Map();
            this.state = {
                fullscreen: false,
                hasFocus: false,
                windowBorder: false,
                menuBar: {
                    visibility: 'default',
                    toggled: false
                },
                activityBar: {
                    hidden: false
                },
                sideBar: {
                    hidden: false,
                    position: 0 /* LEFT */,
                    width: 300,
                    viewletToRestore: undefined
                },
                editor: {
                    hidden: false,
                    centered: false,
                    restoreCentered: false,
                    restoreEditors: false,
                    editorsToOpen: []
                },
                panel: {
                    hidden: false,
                    position: 2 /* BOTTOM */,
                    lastNonMaximizedWidth: 300,
                    lastNonMaximizedHeight: 300,
                    panelToRestore: undefined
                },
                statusBar: {
                    hidden: false
                },
                zenMode: {
                    active: false,
                    restore: false,
                    transitionedToFullScreen: false,
                    transitionedToCenteredEditorLayout: false,
                    wasSideBarVisible: false,
                    wasPanelVisible: false,
                    transitionDisposables: new lifecycle_1.DisposableStore(),
                    setNotificationsFilter: false
                },
            };
        }
        get dimension() { return this._dimension; }
        get container() { return this._container; }
        initLayout(accessor) {
            // Services
            this.environmentService = accessor.get(environmentService_1.IWorkbenchEnvironmentService);
            this.configurationService = accessor.get(configuration_1.IConfigurationService);
            this.lifecycleService = accessor.get(lifecycle_2.ILifecycleService);
            this.hostService = accessor.get(host_1.IHostService);
            this.contextService = accessor.get(workspace_1.IWorkspaceContextService);
            this.storageService = accessor.get(storage_1.IStorageService);
            this.backupFileService = accessor.get(backup_1.IBackupFileService);
            this.themeService = accessor.get(themeService_1.IThemeService);
            // Parts
            this.editorService = accessor.get(editorService_1.IEditorService);
            this.editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            this.panelService = accessor.get(panelService_1.IPanelService);
            this.viewletService = accessor.get(viewlet_1.IViewletService);
            this.titleService = accessor.get(titleService_1.ITitleService);
            this.notificationService = accessor.get(notification_1.INotificationService);
            accessor.get(statusbar_1.IStatusbarService); // not used, but called to ensure instantiated
            accessor.get(activityBarService_1.IActivityBarService); // not used, but called to ensure instantiated
            // Listeners
            this.registerLayoutListeners();
            // State
            this.initLayoutState(accessor.get(lifecycle_2.ILifecycleService), accessor.get(files_1.IFileService));
        }
        registerLayoutListeners() {
            // Restore editor if hidden and it changes
            // The editor service will always trigger this
            // on startup so we can ignore the first one
            let firstTimeEditorActivation = true;
            const showEditorIfHidden = () => {
                if (!firstTimeEditorActivation && this.state.editor.hidden) {
                    this.toggleMaximizedPanel();
                }
                firstTimeEditorActivation = false;
            };
            // Restore editor part on any editor change
            this._register(this.editorService.onDidVisibleEditorsChange(showEditorIfHidden));
            this._register(this.editorGroupService.onDidActivateGroup(showEditorIfHidden));
            // Configuration changes
            this._register(this.configurationService.onDidChangeConfiguration(() => this.doUpdateLayoutConfiguration()));
            // Fullscreen changes
            this._register(browser_1.onDidChangeFullscreen(() => this.onFullscreenChanged()));
            // Group changes
            this._register(this.editorGroupService.onDidAddGroup(() => this.centerEditorLayout(this.state.editor.centered)));
            this._register(this.editorGroupService.onDidRemoveGroup(() => this.centerEditorLayout(this.state.editor.centered)));
            // Prevent workbench from scrolling #55456
            this._register(dom_1.addDisposableListener(this.container, dom_1.EventType.SCROLL, () => this.container.scrollTop = 0));
            // Menubar visibility changes
            if ((platform_2.isWindows || platform_2.isLinux || platform_2.isWeb) && windows_1.getTitleBarStyle(this.configurationService, this.environmentService) === 'custom') {
                this._register(this.titleService.onMenubarVisibilityChange(visible => this.onMenubarToggled(visible)));
            }
            // Theme changes
            this._register(this.themeService.onThemeChange(theme => this.updateStyles()));
            // Window focus changes
            this._register(this.hostService.onDidChangeFocus(e => this.onWindowFocusChanged(e)));
        }
        onMenubarToggled(visible) {
            if (visible !== this.state.menuBar.toggled) {
                this.state.menuBar.toggled = visible;
                if (this.state.fullscreen && (this.state.menuBar.visibility === 'toggle' || this.state.menuBar.visibility === 'default')) {
                    // Propagate to grid
                    this.workbenchGrid.setViewVisible(this.titleBarPartView, this.isVisible("workbench.parts.titlebar" /* TITLEBAR_PART */));
                    this.layout();
                }
            }
        }
        onFullscreenChanged() {
            this.state.fullscreen = browser_1.isFullscreen();
            // Apply as CSS class
            if (this.state.fullscreen) {
                dom_1.addClass(this.container, Classes.FULLSCREEN);
            }
            else {
                dom_1.removeClass(this.container, Classes.FULLSCREEN);
                if (this.state.zenMode.transitionedToFullScreen && this.state.zenMode.active) {
                    this.toggleZenMode();
                }
            }
            // Changing fullscreen state of the window has an impact on custom title bar visibility, so we need to update
            if (windows_1.getTitleBarStyle(this.configurationService, this.environmentService) === 'custom') {
                // Propagate to grid
                this.workbenchGrid.setViewVisible(this.titleBarPartView, this.isVisible("workbench.parts.titlebar" /* TITLEBAR_PART */));
                this.layout(); // handle title bar when fullscreen changes
            }
            this._onFullscreenChange.fire(this.state.fullscreen);
        }
        onWindowFocusChanged(hasFocus) {
            if (this.state.hasFocus === hasFocus) {
                return;
            }
            this.state.hasFocus = hasFocus;
            this.updateWindowBorder();
        }
        doUpdateLayoutConfiguration(skipLayout) {
            // Sidebar position
            const newSidebarPositionValue = this.configurationService.getValue(Settings.SIDEBAR_POSITION);
            const newSidebarPosition = (newSidebarPositionValue === 'right') ? 1 /* RIGHT */ : 0 /* LEFT */;
            if (newSidebarPosition !== this.getSideBarPosition()) {
                this.setSideBarPosition(newSidebarPosition);
            }
            // Panel position
            this.updatePanelPosition();
            if (!this.state.zenMode.active) {
                // Statusbar visibility
                const newStatusbarHiddenValue = !this.configurationService.getValue(Settings.STATUSBAR_VISIBLE);
                if (newStatusbarHiddenValue !== this.state.statusBar.hidden) {
                    this.setStatusBarHidden(newStatusbarHiddenValue, skipLayout);
                }
                // Activitybar visibility
                const newActivityBarHiddenValue = !this.configurationService.getValue(Settings.ACTIVITYBAR_VISIBLE);
                if (newActivityBarHiddenValue !== this.state.activityBar.hidden) {
                    this.setActivityBarHidden(newActivityBarHiddenValue, skipLayout);
                }
            }
            // Menubar visibility
            const newMenubarVisibility = windows_1.getMenuBarVisibility(this.configurationService, this.environmentService);
            this.setMenubarVisibility(newMenubarVisibility, !!skipLayout);
        }
        setSideBarPosition(position) {
            const activityBar = this.getPart("workbench.parts.activitybar" /* ACTIVITYBAR_PART */);
            const sideBar = this.getPart("workbench.parts.sidebar" /* SIDEBAR_PART */);
            const wasHidden = this.state.sideBar.hidden;
            const newPositionValue = (position === 0 /* LEFT */) ? 'left' : 'right';
            const oldPositionValue = (this.state.sideBar.position === 0 /* LEFT */) ? 'left' : 'right';
            this.state.sideBar.position = position;
            // Adjust CSS
            const activityBarContainer = types_1.assertIsDefined(activityBar.getContainer());
            const sideBarContainer = types_1.assertIsDefined(sideBar.getContainer());
            dom_1.removeClass(activityBarContainer, oldPositionValue);
            dom_1.removeClass(sideBarContainer, oldPositionValue);
            dom_1.addClass(activityBarContainer, newPositionValue);
            dom_1.addClass(sideBarContainer, newPositionValue);
            // Update Styles
            activityBar.updateStyles();
            sideBar.updateStyles();
            // Layout
            if (!wasHidden) {
                this.state.sideBar.width = this.workbenchGrid.getViewSize(this.sideBarPartView).width;
            }
            if (position === 0 /* LEFT */) {
                this.workbenchGrid.moveViewTo(this.activityBarPartView, [1, 0]);
                this.workbenchGrid.moveViewTo(this.sideBarPartView, [1, 1]);
            }
            else {
                this.workbenchGrid.moveViewTo(this.sideBarPartView, [1, 4]);
                this.workbenchGrid.moveViewTo(this.activityBarPartView, [1, 4]);
            }
            this.layout();
        }
        updateWindowBorder(skipLayout = false) {
            if (platform_2.isWeb || windows_1.getTitleBarStyle(this.configurationService, this.environmentService) !== 'custom') {
                return;
            }
            const theme = this.themeService.getTheme();
            const activeBorder = theme.getColor(theme_1.WINDOW_ACTIVE_BORDER);
            const inactiveBorder = theme.getColor(theme_1.WINDOW_INACTIVE_BORDER);
            let windowBorder = false;
            if (activeBorder || inactiveBorder) {
                windowBorder = true;
                // If one color is missing, just fallback to the other one
                const borderColor = this.state.hasFocus
                    ? (activeBorder !== null && activeBorder !== void 0 ? activeBorder : inactiveBorder) : (inactiveBorder !== null && inactiveBorder !== void 0 ? inactiveBorder : activeBorder);
                this.container.style.setProperty('--window-border-color', borderColor ? borderColor.toString() : 'transparent');
            }
            if (windowBorder === this.state.windowBorder) {
                return;
            }
            this.state.windowBorder = windowBorder;
            dom_1.toggleClass(this.container, Classes.WINDOW_BORDER, windowBorder);
            if (!skipLayout) {
                this.layout();
            }
        }
        updateStyles() {
            this.updateWindowBorder();
        }
        initLayoutState(lifecycleService, fileService) {
            // Fullscreen
            this.state.fullscreen = browser_1.isFullscreen();
            // Menubar visibility
            this.state.menuBar.visibility = windows_1.getMenuBarVisibility(this.configurationService, this.environmentService);
            // Activity bar visibility
            this.state.activityBar.hidden = !this.configurationService.getValue(Settings.ACTIVITYBAR_VISIBLE);
            // Sidebar visibility
            this.state.sideBar.hidden = this.storageService.getBoolean(Storage.SIDEBAR_HIDDEN, 1 /* WORKSPACE */, this.contextService.getWorkbenchState() === 1 /* EMPTY */);
            // Sidebar position
            this.state.sideBar.position = (this.configurationService.getValue(Settings.SIDEBAR_POSITION) === 'right') ? 1 /* RIGHT */ : 0 /* LEFT */;
            // Sidebar viewlet
            if (!this.state.sideBar.hidden) {
                // Only restore last viewlet if window was reloaded or we are in development mode
                let viewletToRestore;
                if (!this.environmentService.isBuilt || lifecycleService.startupKind === 3 /* ReloadedWindow */) {
                    viewletToRestore = this.storageService.get(sidebarPart_1.SidebarPart.activeViewletSettingsKey, 1 /* WORKSPACE */, this.viewletService.getDefaultViewletId());
                }
                else {
                    viewletToRestore = this.viewletService.getDefaultViewletId();
                }
                if (viewletToRestore) {
                    this.state.sideBar.viewletToRestore = viewletToRestore;
                }
                else {
                    this.state.sideBar.hidden = true; // we hide sidebar if there is no viewlet to restore
                }
            }
            // Editor visibility
            this.state.editor.hidden = this.storageService.getBoolean(Storage.EDITOR_HIDDEN, 1 /* WORKSPACE */, false);
            // Editor centered layout
            this.state.editor.restoreCentered = this.storageService.getBoolean(Storage.CENTERED_LAYOUT_ENABLED, 1 /* WORKSPACE */, false);
            // Editors to open
            this.state.editor.editorsToOpen = this.resolveEditorsToOpen(fileService);
            // Panel visibility
            this.state.panel.hidden = this.storageService.getBoolean(Storage.PANEL_HIDDEN, 1 /* WORKSPACE */, true);
            // Panel position
            this.updatePanelPosition();
            // Panel to restore
            if (!this.state.panel.hidden) {
                const panelRegistry = platform_1.Registry.as(panel_1.Extensions.Panels);
                let panelToRestore = this.storageService.get(panelPart_1.PanelPart.activePanelSettingsKey, 1 /* WORKSPACE */, panelRegistry.getDefaultPanelId());
                if (!panelRegistry.hasPanel(panelToRestore)) {
                    panelToRestore = panelRegistry.getDefaultPanelId(); // fallback to default if panel is unknown
                }
                if (panelToRestore) {
                    this.state.panel.panelToRestore = panelToRestore;
                }
                else {
                    this.state.panel.hidden = true; // we hide panel if there is no panel to restore
                }
            }
            // Panel size before maximized
            this.state.panel.lastNonMaximizedHeight = this.storageService.getNumber(Storage.PANEL_LAST_NON_MAXIMIZED_HEIGHT, 0 /* GLOBAL */, 300);
            this.state.panel.lastNonMaximizedWidth = this.storageService.getNumber(Storage.PANEL_LAST_NON_MAXIMIZED_WIDTH, 0 /* GLOBAL */, 300);
            // Statusbar visibility
            this.state.statusBar.hidden = !this.configurationService.getValue(Settings.STATUSBAR_VISIBLE);
            // Zen mode enablement
            this.state.zenMode.restore = this.storageService.getBoolean(Storage.ZEN_MODE_ENABLED, 1 /* WORKSPACE */, false) && this.configurationService.getValue(Settings.ZEN_MODE_RESTORE);
            this.state.hasFocus = this.hostService.hasFocus;
            // Window border
            this.updateWindowBorder(true);
        }
        resolveEditorsToOpen(fileService) {
            const configuration = this.environmentService.configuration;
            const hasInitialFilesToOpen = this.hasInitialFilesToOpen();
            // Only restore editors if we are not instructed to open files initially
            this.state.editor.restoreEditors = !hasInitialFilesToOpen;
            // Files to open, diff or create
            if (hasInitialFilesToOpen) {
                // Files to diff is exclusive
                return editor_1.pathsToEditors(configuration.filesToDiff, fileService).then(filesToDiff => {
                    var _a;
                    if (((_a = filesToDiff) === null || _a === void 0 ? void 0 : _a.length) === 2) {
                        return [{
                                leftResource: filesToDiff[0].resource,
                                rightResource: filesToDiff[1].resource,
                                options: { pinned: true },
                                forceFile: true
                            }];
                    }
                    // Otherwise: Open/Create files
                    return editor_1.pathsToEditors(configuration.filesToOpenOrCreate, fileService);
                });
            }
            // Empty workbench
            else if (this.contextService.getWorkbenchState() === 1 /* EMPTY */ && this.configurationService.inspect('workbench.startupEditor').value === 'newUntitledFile') {
                if (this.editorGroupService.willRestoreEditors) {
                    return []; // do not open any empty untitled file if we restored editors from previous session
                }
                return this.backupFileService.hasBackups().then(hasBackups => {
                    if (hasBackups) {
                        return []; // do not open any empty untitled file if we have backups to restore
                    }
                    return [Object.create(null)]; // open empty untitled file
                });
            }
            return [];
        }
        hasInitialFilesToOpen() {
            const configuration = this.environmentService.configuration;
            return !!((configuration.filesToOpenOrCreate && configuration.filesToOpenOrCreate.length > 0) ||
                (configuration.filesToDiff && configuration.filesToDiff.length > 0));
        }
        updatePanelPosition() {
            const defaultPanelPosition = this.configurationService.getValue(Settings.PANEL_POSITION);
            const panelPosition = this.storageService.get(Storage.PANEL_POSITION, 1 /* WORKSPACE */, defaultPanelPosition);
            this.state.panel.position = (panelPosition === 'right') ? 1 /* RIGHT */ : 2 /* BOTTOM */;
        }
        registerPart(part) {
            this.parts.set(part.getId(), part);
        }
        getPart(key) {
            const part = this.parts.get(key);
            if (!part) {
                throw new Error(`Unknown part ${key}`);
            }
            return part;
        }
        isRestored() {
            return this.lifecycleService.phase >= 3 /* Restored */;
        }
        hasFocus(part) {
            const activeElement = document.activeElement;
            if (!activeElement) {
                return false;
            }
            const container = this.getContainer(part);
            return !!container && dom_1.isAncestor(activeElement, container);
        }
        getContainer(part) {
            switch (part) {
                case "workbench.parts.titlebar" /* TITLEBAR_PART */:
                    return this.getPart("workbench.parts.titlebar" /* TITLEBAR_PART */).getContainer();
                case "workbench.parts.activitybar" /* ACTIVITYBAR_PART */:
                    return this.getPart("workbench.parts.activitybar" /* ACTIVITYBAR_PART */).getContainer();
                case "workbench.parts.sidebar" /* SIDEBAR_PART */:
                    return this.getPart("workbench.parts.sidebar" /* SIDEBAR_PART */).getContainer();
                case "workbench.parts.panel" /* PANEL_PART */:
                    return this.getPart("workbench.parts.panel" /* PANEL_PART */).getContainer();
                case "workbench.parts.editor" /* EDITOR_PART */:
                    return this.getPart("workbench.parts.editor" /* EDITOR_PART */).getContainer();
                case "workbench.parts.statusbar" /* STATUSBAR_PART */:
                    return this.getPart("workbench.parts.statusbar" /* STATUSBAR_PART */).getContainer();
            }
        }
        isVisible(part) {
            switch (part) {
                case "workbench.parts.titlebar" /* TITLEBAR_PART */:
                    if (windows_1.getTitleBarStyle(this.configurationService, this.environmentService) === 'native') {
                        return false;
                    }
                    else if (!this.state.fullscreen && !platform_2.isWeb) {
                        return true;
                    }
                    else if (platform_2.isMacintosh && platform_2.isNative) {
                        return false;
                    }
                    else if (this.state.menuBar.visibility === 'visible') {
                        return true;
                    }
                    else if (this.state.menuBar.visibility === 'toggle' || this.state.menuBar.visibility === 'default') {
                        return this.state.menuBar.toggled;
                    }
                    return false;
                case "workbench.parts.sidebar" /* SIDEBAR_PART */:
                    return !this.state.sideBar.hidden;
                case "workbench.parts.panel" /* PANEL_PART */:
                    return !this.state.panel.hidden;
                case "workbench.parts.statusbar" /* STATUSBAR_PART */:
                    return !this.state.statusBar.hidden;
                case "workbench.parts.activitybar" /* ACTIVITYBAR_PART */:
                    return !this.state.activityBar.hidden;
                case "workbench.parts.editor" /* EDITOR_PART */:
                    return !this.state.editor.hidden;
            }
            return true; // any other part cannot be hidden
        }
        getDimension(part) {
            return this.getPart(part).dimension;
        }
        getTitleBarOffset() {
            let offset = 0;
            if (this.isVisible("workbench.parts.titlebar" /* TITLEBAR_PART */)) {
                offset = this.getPart("workbench.parts.titlebar" /* TITLEBAR_PART */).maximumHeight;
            }
            return offset;
        }
        getMaximumEditorDimensions() {
            const takenWidth = (this.isVisible("workbench.parts.activitybar" /* ACTIVITYBAR_PART */) ? this.activityBarPartView.minimumWidth : 0) +
                (this.isVisible("workbench.parts.sidebar" /* SIDEBAR_PART */) ? this.sideBarPartView.minimumWidth : 0) +
                (this.isVisible("workbench.parts.panel" /* PANEL_PART */) && this.state.panel.position === 1 /* RIGHT */ ? this.panelPartView.minimumWidth : 0);
            const takenHeight = (this.isVisible("workbench.parts.titlebar" /* TITLEBAR_PART */) ? this.titleBarPartView.minimumHeight : 0) +
                (this.isVisible("workbench.parts.statusbar" /* STATUSBAR_PART */) ? this.statusBarPartView.minimumHeight : 0) +
                (this.isVisible("workbench.parts.panel" /* PANEL_PART */) && this.state.panel.position === 2 /* BOTTOM */ ? this.panelPartView.minimumHeight : 0);
            const availableWidth = this.dimension.width - takenWidth;
            const availableHeight = this.dimension.height - takenHeight;
            return { width: availableWidth, height: availableHeight };
        }
        getWorkbenchContainer() {
            return this.parent;
        }
        getWorkbenchElement() {
            return this.container;
        }
        toggleZenMode(skipLayout, restoring = false) {
            this.state.zenMode.active = !this.state.zenMode.active;
            this.state.zenMode.transitionDisposables.clear();
            const setLineNumbers = (lineNumbers) => this.editorService.visibleTextEditorWidgets.forEach(editor => {
                // To properly reset line numbers we need to read the configuration for each editor respecting it's uri.
                if (!lineNumbers && editorBrowser_1.isCodeEditor(editor) && editor.hasModel()) {
                    const model = editor.getModel();
                    lineNumbers = this.configurationService.getValue('editor.lineNumbers', { resource: model.uri, overrideIdentifier: model.getModeId() });
                }
                if (!lineNumbers) {
                    lineNumbers = this.configurationService.getValue('editor.lineNumbers');
                }
                editor.updateOptions({ lineNumbers });
            });
            // Check if zen mode transitioned to full screen and if now we are out of zen mode
            // -> we need to go out of full screen (same goes for the centered editor layout)
            let toggleFullScreen = false;
            // Zen Mode Active
            if (this.state.zenMode.active) {
                const config = this.configurationService.getValue('zenMode');
                toggleFullScreen = !this.state.fullscreen && config.fullScreen;
                this.state.zenMode.transitionedToFullScreen = restoring ? config.fullScreen : toggleFullScreen;
                this.state.zenMode.transitionedToCenteredEditorLayout = !this.isEditorLayoutCentered() && config.centerLayout;
                this.state.zenMode.wasSideBarVisible = this.isVisible("workbench.parts.sidebar" /* SIDEBAR_PART */);
                this.state.zenMode.wasPanelVisible = this.isVisible("workbench.parts.panel" /* PANEL_PART */);
                this.setPanelHidden(true, true);
                this.setSideBarHidden(true, true);
                if (config.hideActivityBar) {
                    this.setActivityBarHidden(true, true);
                }
                if (config.hideStatusBar) {
                    this.setStatusBarHidden(true, true);
                }
                if (config.hideLineNumbers) {
                    setLineNumbers('off');
                    this.state.zenMode.transitionDisposables.add(this.editorService.onDidVisibleEditorsChange(() => setLineNumbers('off')));
                }
                if (config.hideTabs && this.editorGroupService.partOptions.showTabs) {
                    this.state.zenMode.transitionDisposables.add(this.editorGroupService.enforcePartOptions({ showTabs: false }));
                }
                this.state.zenMode.setNotificationsFilter = config.silentNotifications;
                if (config.silentNotifications) {
                    this.notificationService.setFilter(notification_1.NotificationsFilter.ERROR);
                }
                if (config.centerLayout) {
                    this.centerEditorLayout(true, true);
                }
            }
            // Zen Mode Inactive
            else {
                if (this.state.zenMode.wasPanelVisible) {
                    this.setPanelHidden(false, true);
                }
                if (this.state.zenMode.wasSideBarVisible) {
                    this.setSideBarHidden(false, true);
                }
                if (this.state.zenMode.transitionedToCenteredEditorLayout) {
                    this.centerEditorLayout(false, true);
                }
                setLineNumbers();
                // Status bar and activity bar visibility come from settings -> update their visibility.
                this.doUpdateLayoutConfiguration(true);
                this.editorGroupService.activeGroup.focus();
                if (this.state.zenMode.setNotificationsFilter) {
                    this.notificationService.setFilter(notification_1.NotificationsFilter.OFF);
                }
                toggleFullScreen = this.state.zenMode.transitionedToFullScreen && this.state.fullscreen;
            }
            if (!skipLayout) {
                this.layout();
            }
            if (toggleFullScreen) {
                this.hostService.toggleFullScreen();
            }
            // Event
            this._onZenModeChange.fire(this.state.zenMode.active);
            // State
            if (this.state.zenMode.active) {
                this.storageService.store(Storage.ZEN_MODE_ENABLED, true, 1 /* WORKSPACE */);
                // Exit zen mode on shutdown unless configured to keep
                this.state.zenMode.transitionDisposables.add(this.storageService.onWillSaveState(e => {
                    if (e.reason === storage_1.WillSaveStateReason.SHUTDOWN && this.state.zenMode.active) {
                        if (!this.configurationService.getValue(Settings.ZEN_MODE_RESTORE)) {
                            this.toggleZenMode(true); // We will not restore zen mode, need to clear all zen mode state changes
                        }
                    }
                }));
            }
            else {
                this.storageService.remove(Storage.ZEN_MODE_ENABLED, 1 /* WORKSPACE */);
            }
        }
        setStatusBarHidden(hidden, skipLayout) {
            this.state.statusBar.hidden = hidden;
            // Adjust CSS
            if (hidden) {
                dom_1.addClass(this.container, Classes.STATUSBAR_HIDDEN);
            }
            else {
                dom_1.removeClass(this.container, Classes.STATUSBAR_HIDDEN);
            }
            // Propagate to grid
            this.workbenchGrid.setViewVisible(this.statusBarPartView, !hidden);
        }
        createWorkbenchLayout() {
            const titleBar = this.getPart("workbench.parts.titlebar" /* TITLEBAR_PART */);
            const editorPart = this.getPart("workbench.parts.editor" /* EDITOR_PART */);
            const activityBar = this.getPart("workbench.parts.activitybar" /* ACTIVITYBAR_PART */);
            const panelPart = this.getPart("workbench.parts.panel" /* PANEL_PART */);
            const sideBar = this.getPart("workbench.parts.sidebar" /* SIDEBAR_PART */);
            const statusBar = this.getPart("workbench.parts.statusbar" /* STATUSBAR_PART */);
            // View references for all parts
            this.titleBarPartView = titleBar;
            this.sideBarPartView = sideBar;
            this.activityBarPartView = activityBar;
            this.editorPartView = editorPart;
            this.panelPartView = panelPart;
            this.statusBarPartView = statusBar;
            const viewMap = {
                ["workbench.parts.activitybar" /* ACTIVITYBAR_PART */]: this.activityBarPartView,
                ["workbench.parts.titlebar" /* TITLEBAR_PART */]: this.titleBarPartView,
                ["workbench.parts.editor" /* EDITOR_PART */]: this.editorPartView,
                ["workbench.parts.panel" /* PANEL_PART */]: this.panelPartView,
                ["workbench.parts.sidebar" /* SIDEBAR_PART */]: this.sideBarPartView,
                ["workbench.parts.statusbar" /* STATUSBAR_PART */]: this.statusBarPartView
            };
            const fromJSON = ({ type }) => viewMap[type];
            const workbenchGrid = grid_1.SerializableGrid.deserialize(this.createGridDescriptor(), { fromJSON }, { proportionalLayout: false });
            this.container.prepend(workbenchGrid.element);
            this.workbenchGrid = workbenchGrid;
            [titleBar, editorPart, activityBar, panelPart, sideBar, statusBar].forEach((part) => {
                this._register(part.onDidVisibilityChange((visible) => {
                    this._onPartVisibilityChange.fire();
                    if (part === sideBar) {
                        this.setSideBarHidden(!visible, true);
                    }
                    else if (part === panelPart) {
                        this.setPanelHidden(!visible, true);
                    }
                    else if (part === editorPart) {
                        this.setEditorHidden(!visible, true);
                    }
                }));
            });
            this._register(this.storageService.onWillSaveState(() => {
                const grid = this.workbenchGrid;
                const sideBarSize = this.state.sideBar.hidden
                    ? grid.getViewCachedVisibleSize(this.sideBarPartView)
                    : grid.getViewSize(this.sideBarPartView).width;
                this.storageService.store(Storage.SIDEBAR_SIZE, sideBarSize, 0 /* GLOBAL */);
                const panelSize = this.state.panel.hidden
                    ? grid.getViewCachedVisibleSize(this.panelPartView)
                    : (this.state.panel.position === 2 /* BOTTOM */ ? grid.getViewSize(this.panelPartView).height : grid.getViewSize(this.panelPartView).width);
                this.storageService.store(Storage.PANEL_SIZE, panelSize, 0 /* GLOBAL */);
                const gridSize = grid.getViewSize();
                this.storageService.store(Storage.GRID_WIDTH, gridSize.width, 0 /* GLOBAL */);
                this.storageService.store(Storage.GRID_HEIGHT, gridSize.height, 0 /* GLOBAL */);
            }));
        }
        getClientArea() {
            const dim = dom_1.getClientArea(this.parent);
            return this.state.windowBorder ? new dom_1.Dimension(dim.width - 2, dim.height - 2) : dim;
        }
        layout() {
            if (!this.disposed) {
                this._dimension = this.getClientArea();
                // Layout the grid widget
                this.workbenchGrid.layout(this._dimension.width, this._dimension.height);
                // Emit as event
                this._onLayout.fire(this._dimension);
            }
        }
        isEditorLayoutCentered() {
            return this.state.editor.centered;
        }
        centerEditorLayout(active, skipLayout) {
            this.state.editor.centered = active;
            this.storageService.store(Storage.CENTERED_LAYOUT_ENABLED, active, 1 /* WORKSPACE */);
            let smartActive = active;
            if (this.editorGroupService.groups.length > 1 && this.configurationService.getValue('workbench.editor.centeredLayoutAutoResize')) {
                smartActive = false; // Respect the auto resize setting - do not go into centered layout if there is more than 1 group.
            }
            // Enter Centered Editor Layout
            if (this.editorGroupService.isLayoutCentered() !== smartActive) {
                this.editorGroupService.centerLayout(smartActive);
                if (!skipLayout) {
                    this.layout();
                }
            }
            this._onCenteredLayoutChange.fire(this.state.editor.centered);
        }
        resizePart(part, sizeChange) {
            const sizeChangePxWidth = this.workbenchGrid.width * sizeChange / 100;
            const sizeChangePxHeight = this.workbenchGrid.height * sizeChange / 100;
            let viewSize;
            switch (part) {
                case "workbench.parts.sidebar" /* SIDEBAR_PART */:
                    viewSize = this.workbenchGrid.getViewSize(this.sideBarPartView);
                    this.workbenchGrid.resizeView(this.sideBarPartView, {
                        width: viewSize.width + sizeChangePxWidth,
                        height: viewSize.height
                    });
                    break;
                case "workbench.parts.panel" /* PANEL_PART */:
                    viewSize = this.workbenchGrid.getViewSize(this.panelPartView);
                    this.workbenchGrid.resizeView(this.panelPartView, {
                        width: viewSize.width + (this.getPanelPosition() !== 2 /* BOTTOM */ ? sizeChangePxWidth : 0),
                        height: viewSize.height + (this.getPanelPosition() !== 2 /* BOTTOM */ ? 0 : sizeChangePxHeight)
                    });
                    break;
                case "workbench.parts.editor" /* EDITOR_PART */:
                    viewSize = this.workbenchGrid.getViewSize(this.editorPartView);
                    // Single Editor Group
                    if (this.editorGroupService.count === 1) {
                        if (this.isVisible("workbench.parts.sidebar" /* SIDEBAR_PART */)) {
                            this.workbenchGrid.resizeView(this.editorPartView, {
                                width: viewSize.width + sizeChangePxWidth,
                                height: viewSize.height
                            });
                        }
                        else if (this.isVisible("workbench.parts.panel" /* PANEL_PART */)) {
                            this.workbenchGrid.resizeView(this.editorPartView, {
                                width: viewSize.width + (this.getPanelPosition() !== 2 /* BOTTOM */ ? sizeChangePxWidth : 0),
                                height: viewSize.height + (this.getPanelPosition() !== 2 /* BOTTOM */ ? 0 : sizeChangePxHeight)
                            });
                        }
                    }
                    else {
                        const activeGroup = this.editorGroupService.activeGroup;
                        const { width, height } = this.editorGroupService.getSize(activeGroup);
                        this.editorGroupService.setSize(activeGroup, { width: width + sizeChangePxWidth, height: height + sizeChangePxHeight });
                    }
                    break;
                default:
                    return; // Cannot resize other parts
            }
        }
        setActivityBarHidden(hidden, skipLayout) {
            this.state.activityBar.hidden = hidden;
            // Propagate to grid
            this.workbenchGrid.setViewVisible(this.activityBarPartView, !hidden);
        }
        setEditorHidden(hidden, skipLayout) {
            this.state.editor.hidden = hidden;
            // Adjust CSS
            if (hidden) {
                dom_1.addClass(this.container, Classes.EDITOR_HIDDEN);
            }
            else {
                dom_1.removeClass(this.container, Classes.EDITOR_HIDDEN);
            }
            // Propagate to grid
            this.workbenchGrid.setViewVisible(this.editorPartView, !hidden);
            // Remember in settings
            if (hidden) {
                this.storageService.store(Storage.EDITOR_HIDDEN, true, 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(Storage.EDITOR_HIDDEN, 1 /* WORKSPACE */);
            }
            // The editor and panel cannot be hidden at the same time
            if (hidden && this.state.panel.hidden) {
                this.setPanelHidden(false, true);
            }
        }
        getLayoutClasses() {
            return arrays_1.coalesce([
                this.state.sideBar.hidden ? Classes.SIDEBAR_HIDDEN : undefined,
                this.state.editor.hidden ? Classes.EDITOR_HIDDEN : undefined,
                this.state.panel.hidden ? Classes.PANEL_HIDDEN : undefined,
                this.state.statusBar.hidden ? Classes.STATUSBAR_HIDDEN : undefined,
                this.state.fullscreen ? Classes.FULLSCREEN : undefined
            ]);
        }
        setSideBarHidden(hidden, skipLayout) {
            this.state.sideBar.hidden = hidden;
            // Adjust CSS
            if (hidden) {
                dom_1.addClass(this.container, Classes.SIDEBAR_HIDDEN);
            }
            else {
                dom_1.removeClass(this.container, Classes.SIDEBAR_HIDDEN);
            }
            // If sidebar becomes hidden, also hide the current active Viewlet if any
            if (hidden && this.viewletService.getActiveViewlet()) {
                this.viewletService.hideActiveViewlet();
                // Pass Focus to Editor or Panel if Sidebar is now hidden
                const activePanel = this.panelService.getActivePanel();
                if (this.hasFocus("workbench.parts.panel" /* PANEL_PART */) && activePanel) {
                    activePanel.focus();
                }
                else {
                    this.editorGroupService.activeGroup.focus();
                }
            }
            // If sidebar becomes visible, show last active Viewlet or default viewlet
            else if (!hidden && !this.viewletService.getActiveViewlet()) {
                const viewletToOpen = this.viewletService.getLastActiveViewletId();
                if (viewletToOpen) {
                    const viewlet = this.viewletService.openViewlet(viewletToOpen, true);
                    if (!viewlet) {
                        this.viewletService.openViewlet(this.viewletService.getDefaultViewletId(), true);
                    }
                }
            }
            // Propagate to grid
            this.workbenchGrid.setViewVisible(this.sideBarPartView, !hidden);
            // Remember in settings
            const defaultHidden = this.contextService.getWorkbenchState() === 1 /* EMPTY */;
            if (hidden !== defaultHidden) {
                this.storageService.store(Storage.SIDEBAR_HIDDEN, hidden ? 'true' : 'false', 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(Storage.SIDEBAR_HIDDEN, 1 /* WORKSPACE */);
            }
        }
        setPanelHidden(hidden, skipLayout) {
            this.state.panel.hidden = hidden;
            // Adjust CSS
            if (hidden) {
                dom_1.addClass(this.container, Classes.PANEL_HIDDEN);
            }
            else {
                dom_1.removeClass(this.container, Classes.PANEL_HIDDEN);
            }
            // If panel part becomes hidden, also hide the current active panel if any
            if (hidden && this.panelService.getActivePanel()) {
                this.panelService.hideActivePanel();
                this.editorGroupService.activeGroup.focus(); // Pass focus to editor group if panel part is now hidden
            }
            // If panel part becomes visible, show last active panel or default panel
            else if (!hidden && !this.panelService.getActivePanel()) {
                const panelToOpen = this.panelService.getLastActivePanelId();
                if (panelToOpen) {
                    const focus = !skipLayout;
                    this.panelService.openPanel(panelToOpen, focus);
                }
            }
            // If not maximized and hiding, unmaximize before hiding to allow caching of size
            if (this.isPanelMaximized() && hidden) {
                this.toggleMaximizedPanel();
            }
            // Propagate to grid
            this.workbenchGrid.setViewVisible(this.panelPartView, !hidden);
            // Remember in settings
            if (!hidden) {
                this.storageService.store(Storage.PANEL_HIDDEN, 'false', 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(Storage.PANEL_HIDDEN, 1 /* WORKSPACE */);
            }
            // The editor and panel cannot be hidden at the same time
            if (hidden && this.state.editor.hidden) {
                this.setEditorHidden(false, true);
            }
        }
        toggleMaximizedPanel() {
            const size = this.workbenchGrid.getViewSize(this.panelPartView);
            if (!this.isPanelMaximized()) {
                if (!this.state.panel.hidden) {
                    if (this.state.panel.position === 2 /* BOTTOM */) {
                        this.state.panel.lastNonMaximizedHeight = size.height;
                        this.storageService.store(Storage.PANEL_LAST_NON_MAXIMIZED_HEIGHT, this.state.panel.lastNonMaximizedHeight, 0 /* GLOBAL */);
                    }
                    else {
                        this.state.panel.lastNonMaximizedWidth = size.width;
                        this.storageService.store(Storage.PANEL_LAST_NON_MAXIMIZED_WIDTH, this.state.panel.lastNonMaximizedWidth, 0 /* GLOBAL */);
                    }
                }
                this.setEditorHidden(true);
            }
            else {
                this.setEditorHidden(false);
                this.workbenchGrid.resizeView(this.panelPartView, { width: this.state.panel.position === 2 /* BOTTOM */ ? size.width : this.state.panel.lastNonMaximizedWidth, height: this.state.panel.position === 2 /* BOTTOM */ ? this.state.panel.lastNonMaximizedHeight : size.height });
            }
        }
        hasWindowBorder() {
            return this.state.windowBorder;
        }
        getWindowBorderRadius() {
            return this.state.windowBorder && platform_2.isMacintosh ? '5px' : undefined;
        }
        isPanelMaximized() {
            if (!this.workbenchGrid) {
                return false;
            }
            return this.state.editor.hidden;
        }
        getSideBarPosition() {
            return this.state.sideBar.position;
        }
        setMenubarVisibility(visibility, skipLayout) {
            if (this.state.menuBar.visibility !== visibility) {
                this.state.menuBar.visibility = visibility;
                // Layout
                if (!skipLayout) {
                    this.workbenchGrid.setViewVisible(this.titleBarPartView, this.isVisible("workbench.parts.titlebar" /* TITLEBAR_PART */));
                }
            }
        }
        getMenubarVisibility() {
            return this.state.menuBar.visibility;
        }
        getPanelPosition() {
            return this.state.panel.position;
        }
        setPanelPosition(position) {
            if (this.state.panel.hidden) {
                this.setPanelHidden(false);
            }
            const panelPart = this.getPart("workbench.parts.panel" /* PANEL_PART */);
            const newPositionValue = (position === 2 /* BOTTOM */) ? 'bottom' : 'right';
            const oldPositionValue = (this.state.panel.position === 2 /* BOTTOM */) ? 'bottom' : 'right';
            this.state.panel.position = position;
            function positionToString(position) {
                switch (position) {
                    case 0 /* LEFT */: return 'left';
                    case 1 /* RIGHT */: return 'right';
                    case 2 /* BOTTOM */: return 'bottom';
                }
            }
            // Save panel position
            this.storageService.store(Storage.PANEL_POSITION, positionToString(this.state.panel.position), 1 /* WORKSPACE */);
            // Adjust CSS
            const panelContainer = types_1.assertIsDefined(panelPart.getContainer());
            dom_1.removeClass(panelContainer, oldPositionValue);
            dom_1.addClass(panelContainer, newPositionValue);
            // Update Styles
            panelPart.updateStyles();
            // Layout
            const size = this.workbenchGrid.getViewSize(this.panelPartView);
            const sideBarSize = this.workbenchGrid.getViewSize(this.sideBarPartView);
            // Save last non-maximized size for panel before move
            if (newPositionValue !== oldPositionValue && !this.state.editor.hidden) {
                // Save the current size of the panel for the new orthogonal direction
                // If moving down, save the width of the panel
                // Otherwise, save the height of the panel
                if (position === 2 /* BOTTOM */) {
                    this.state.panel.lastNonMaximizedWidth = size.width;
                }
                else {
                    this.state.panel.lastNonMaximizedHeight = size.height;
                }
            }
            if (position === 2 /* BOTTOM */) {
                this.workbenchGrid.moveView(this.panelPartView, this.state.editor.hidden ? size.height : this.state.panel.lastNonMaximizedHeight, this.editorPartView, 1 /* Down */);
            }
            else {
                this.workbenchGrid.moveView(this.panelPartView, this.state.editor.hidden ? size.width : this.state.panel.lastNonMaximizedWidth, this.editorPartView, 3 /* Right */);
            }
            // Reset sidebar to original size before shifting the panel
            this.workbenchGrid.resizeView(this.sideBarPartView, sideBarSize);
            this._onPanelPositionChange.fire(positionToString(this.state.panel.position));
        }
        createGridDescriptor() {
            const workbenchDimensions = this.getClientArea();
            const width = this.storageService.getNumber(Storage.GRID_WIDTH, 0 /* GLOBAL */, workbenchDimensions.width);
            const height = this.storageService.getNumber(Storage.GRID_HEIGHT, 0 /* GLOBAL */, workbenchDimensions.height);
            // At some point, we will not fall back to old keys from legacy layout, but for now, let's migrate the keys
            const sideBarSize = this.storageService.getNumber(Storage.SIDEBAR_SIZE, 0 /* GLOBAL */, this.storageService.getNumber('workbench.sidebar.width', 0 /* GLOBAL */, Math.min(workbenchDimensions.width / 4, 300)));
            const panelSize = this.storageService.getNumber(Storage.PANEL_SIZE, 0 /* GLOBAL */, this.storageService.getNumber(this.state.panel.position === 2 /* BOTTOM */ ? 'workbench.panel.height' : 'workbench.panel.width', 0 /* GLOBAL */, workbenchDimensions.height / 3));
            const titleBarHeight = this.titleBarPartView.minimumHeight;
            const statusBarHeight = this.statusBarPartView.minimumHeight;
            const activityBarWidth = this.activityBarPartView.minimumWidth;
            const middleSectionHeight = height - titleBarHeight - statusBarHeight;
            const editorSectionWidth = width - (this.state.activityBar.hidden ? 0 : activityBarWidth) - (this.state.sideBar.hidden ? 0 : sideBarSize);
            const activityBarNode = {
                type: 'leaf',
                data: { type: "workbench.parts.activitybar" /* ACTIVITYBAR_PART */ },
                size: activityBarWidth,
                visible: !this.state.activityBar.hidden
            };
            const sideBarNode = {
                type: 'leaf',
                data: { type: "workbench.parts.sidebar" /* SIDEBAR_PART */ },
                size: sideBarSize,
                visible: !this.state.sideBar.hidden
            };
            const editorNode = {
                type: 'leaf',
                data: { type: "workbench.parts.editor" /* EDITOR_PART */ },
                size: this.state.panel.position === 2 /* BOTTOM */ ?
                    middleSectionHeight - (this.state.panel.hidden ? 0 : panelSize) :
                    editorSectionWidth - (this.state.panel.hidden ? 0 : panelSize),
                visible: !this.state.editor.hidden
            };
            const panelNode = {
                type: 'leaf',
                data: { type: "workbench.parts.panel" /* PANEL_PART */ },
                size: panelSize,
                visible: !this.state.panel.hidden
            };
            const editorSectionNode = this.state.panel.position === 2 /* BOTTOM */
                ? [{ type: 'branch', data: [editorNode, panelNode], size: editorSectionWidth }]
                : [editorNode, panelNode];
            const middleSection = this.state.sideBar.position === 0 /* LEFT */
                ? [activityBarNode, sideBarNode, ...editorSectionNode]
                : [...editorSectionNode, sideBarNode, activityBarNode];
            const result = {
                root: {
                    type: 'branch',
                    size: width,
                    data: [
                        {
                            type: 'leaf',
                            data: { type: "workbench.parts.titlebar" /* TITLEBAR_PART */ },
                            size: titleBarHeight,
                            visible: this.isVisible("workbench.parts.titlebar" /* TITLEBAR_PART */)
                        },
                        {
                            type: 'branch',
                            data: middleSection,
                            size: middleSectionHeight
                        },
                        {
                            type: 'leaf',
                            data: { type: "workbench.parts.statusbar" /* STATUSBAR_PART */ },
                            size: statusBarHeight,
                            visible: !this.state.statusBar.hidden
                        }
                    ]
                },
                orientation: 0 /* VERTICAL */,
                width,
                height
            };
            return result;
        }
        dispose() {
            super.dispose();
            this.disposed = true;
        }
    }
    exports.Layout = Layout;
});
//# sourceMappingURL=layout.js.map