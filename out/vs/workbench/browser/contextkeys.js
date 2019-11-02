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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/workbench/common/editor", "vs/base/browser/dom", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/configuration/common/configuration", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/editor/common/editorService", "vs/platform/workspace/common/workspace", "vs/workbench/common/viewlet", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/viewlet/browser/viewlet", "vs/base/common/platform", "vs/workbench/common/panel", "vs/platform/remote/common/remoteHosts", "vs/platform/files/common/files", "vs/base/common/network"], function (require, exports, event_1, lifecycle_1, contextkey_1, contextkeys_1, editor_1, dom_1, editorGroupsService_1, configuration_1, environmentService_1, editorService_1, workspace_1, viewlet_1, layoutService_1, viewlet_2, platform_1, panel_1, remoteHosts_1, files_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IsMacContext = new contextkey_1.RawContextKey('isMac', platform_1.isMacintosh);
    exports.IsLinuxContext = new contextkey_1.RawContextKey('isLinux', platform_1.isLinux);
    exports.IsWindowsContext = new contextkey_1.RawContextKey('isWindows', platform_1.isWindows);
    exports.IsWebContext = new contextkey_1.RawContextKey('isWeb', platform_1.isWeb);
    exports.IsMacNativeContext = new contextkey_1.RawContextKey('isMacNative', platform_1.isMacintosh && !platform_1.isWeb);
    exports.Deprecated_RemoteAuthorityContext = new contextkey_1.RawContextKey('remoteAuthority', '');
    exports.RemoteNameContext = new contextkey_1.RawContextKey('remoteName', '');
    exports.RemoteConnectionState = new contextkey_1.RawContextKey('remoteConnectionState', '');
    exports.HasMacNativeTabsContext = new contextkey_1.RawContextKey('hasMacNativeTabs', false);
    exports.IsDevelopmentContext = new contextkey_1.RawContextKey('isDevelopment', false);
    exports.WorkbenchStateContext = new contextkey_1.RawContextKey('workbenchState', undefined);
    exports.WorkspaceFolderCountContext = new contextkey_1.RawContextKey('workspaceFolderCount', 0);
    exports.RemoteFileDialogContext = new contextkey_1.RawContextKey('remoteFileDialogVisible', false);
    exports.IsFullscreenContext = new contextkey_1.RawContextKey('isFullscreen', false);
    let WorkbenchContextKeysHandler = class WorkbenchContextKeysHandler extends lifecycle_1.Disposable {
        constructor(contextKeyService, contextService, configurationService, environmentService, editorService, editorGroupService, layoutService, viewletService, fileService) {
            var _a, _b;
            super();
            this.contextKeyService = contextKeyService;
            this.contextService = contextService;
            this.configurationService = configurationService;
            this.environmentService = environmentService;
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.layoutService = layoutService;
            this.viewletService = viewletService;
            this.fileService = fileService;
            // Platform
            exports.IsMacContext.bindTo(this.contextKeyService);
            exports.IsLinuxContext.bindTo(this.contextKeyService);
            exports.IsWindowsContext.bindTo(this.contextKeyService);
            exports.IsWebContext.bindTo(this.contextKeyService);
            exports.IsMacNativeContext.bindTo(this.contextKeyService);
            exports.RemoteNameContext.bindTo(this.contextKeyService).set(remoteHosts_1.getRemoteName(this.environmentService.configuration.remoteAuthority) || '');
            // macOS Native Tabs
            const windowConfig = this.configurationService.getValue();
            exports.HasMacNativeTabsContext.bindTo(this.contextKeyService).set((_b = (_a = windowConfig) === null || _a === void 0 ? void 0 : _a.window) === null || _b === void 0 ? void 0 : _b.nativeTabs);
            // Development
            exports.IsDevelopmentContext.bindTo(this.contextKeyService).set(!this.environmentService.isBuilt || this.environmentService.isExtensionDevelopment);
            // Editors
            this.activeEditorContext = editor_1.ActiveEditorContext.bindTo(this.contextKeyService);
            this.activeEditorIsSaveable = editor_1.ActiveEditorIsSaveableContext.bindTo(this.contextKeyService);
            this.editorsVisibleContext = editor_1.EditorsVisibleContext.bindTo(this.contextKeyService);
            this.textCompareEditorVisibleContext = editor_1.TextCompareEditorVisibleContext.bindTo(this.contextKeyService);
            this.textCompareEditorActiveContext = editor_1.TextCompareEditorActiveContext.bindTo(this.contextKeyService);
            this.activeEditorGroupEmpty = editor_1.ActiveEditorGroupEmptyContext.bindTo(this.contextKeyService);
            this.activeEditorGroupIndex = editor_1.ActiveEditorGroupIndexContext.bindTo(this.contextKeyService);
            this.activeEditorGroupLast = editor_1.ActiveEditorGroupLastContext.bindTo(this.contextKeyService);
            this.multipleEditorGroupsContext = editor_1.MultipleEditorGroupsContext.bindTo(this.contextKeyService);
            // Inputs
            this.inputFocusedContext = contextkeys_1.InputFocusedContext.bindTo(this.contextKeyService);
            // Workbench State
            this.workbenchStateContext = exports.WorkbenchStateContext.bindTo(this.contextKeyService);
            this.updateWorkbenchStateContextKey();
            // Workspace Folder Count
            this.workspaceFolderCountContext = exports.WorkspaceFolderCountContext.bindTo(this.contextKeyService);
            this.updateWorkspaceFolderCountContextKey();
            // Editor Layout
            this.splitEditorsVerticallyContext = editor_1.SplitEditorsVertically.bindTo(this.contextKeyService);
            this.updateSplitEditorsVerticallyContext();
            // Fullscreen
            this.isFullscreenContext = exports.IsFullscreenContext.bindTo(this.contextKeyService);
            // Zen Mode
            this.inZenModeContext = editor_1.InEditorZenModeContext.bindTo(this.contextKeyService);
            // Centered Layout
            this.isCenteredLayoutContext = editor_1.IsCenteredLayoutContext.bindTo(this.contextKeyService);
            // Editor Area
            this.editorAreaVisibleContext = editor_1.EditorAreaVisibleContext.bindTo(this.contextKeyService);
            // Sidebar
            this.sideBarVisibleContext = viewlet_1.SideBarVisibleContext.bindTo(this.contextKeyService);
            // Panel Position
            this.panelPositionContext = panel_1.PanelPositionContext.bindTo(this.contextKeyService);
            this.panelPositionContext.set(this.layoutService.getPanelPosition() === 1 /* RIGHT */ ? 'right' : 'bottom');
            this.registerListeners();
        }
        registerListeners() {
            this.editorGroupService.whenRestored.then(() => this.updateEditorContextKeys());
            this._register(this.editorService.onDidActiveEditorChange(() => this.updateEditorContextKeys()));
            this._register(this.editorService.onDidVisibleEditorsChange(() => this.updateEditorContextKeys()));
            this._register(this.editorGroupService.onDidAddGroup(() => this.updateEditorContextKeys()));
            this._register(this.editorGroupService.onDidRemoveGroup(() => this.updateEditorContextKeys()));
            this._register(this.editorGroupService.onDidGroupIndexChange(() => this.updateEditorContextKeys()));
            this._register(dom_1.addDisposableListener(window, dom_1.EventType.FOCUS_IN, () => this.updateInputContextKeys(), true));
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.updateWorkbenchStateContextKey()));
            this._register(this.contextService.onDidChangeWorkspaceFolders(() => this.updateWorkspaceFolderCountContextKey()));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('workbench.editor.openSideBySideDirection')) {
                    this.updateSplitEditorsVerticallyContext();
                }
            }));
            this._register(this.layoutService.onZenModeChange(enabled => this.inZenModeContext.set(enabled)));
            this._register(this.layoutService.onFullscreenChange(fullscreen => this.isFullscreenContext.set(fullscreen)));
            this._register(this.layoutService.onCenteredLayoutChange(centered => this.isCenteredLayoutContext.set(centered)));
            this._register(this.layoutService.onPanelPositionChange(position => this.panelPositionContext.set(position)));
            this._register(this.viewletService.onDidViewletClose(() => this.updateSideBarContextKeys()));
            this._register(this.viewletService.onDidViewletOpen(() => this.updateSideBarContextKeys()));
            this._register(this.layoutService.onPartVisibilityChange(() => this.editorAreaVisibleContext.set(this.layoutService.isVisible("workbench.parts.editor" /* EDITOR_PART */))));
        }
        updateEditorContextKeys() {
            var _a;
            const activeGroup = this.editorGroupService.activeGroup;
            const activeControl = this.editorService.activeControl;
            const visibleEditors = this.editorService.visibleControls;
            this.textCompareEditorActiveContext.set(((_a = activeControl) === null || _a === void 0 ? void 0 : _a.getId()) === editor_1.TEXT_DIFF_EDITOR_ID);
            this.textCompareEditorVisibleContext.set(visibleEditors.some(control => control.getId() === editor_1.TEXT_DIFF_EDITOR_ID));
            if (visibleEditors.length > 0) {
                this.editorsVisibleContext.set(true);
            }
            else {
                this.editorsVisibleContext.reset();
            }
            if (!this.editorService.activeEditor) {
                this.activeEditorGroupEmpty.set(true);
            }
            else {
                this.activeEditorGroupEmpty.reset();
            }
            const groupCount = this.editorGroupService.count;
            if (groupCount > 1) {
                this.multipleEditorGroupsContext.set(true);
            }
            else {
                this.multipleEditorGroupsContext.reset();
            }
            this.activeEditorGroupIndex.set(activeGroup.index + 1); // not zero-indexed
            this.activeEditorGroupLast.set(activeGroup.index === groupCount - 1);
            if (activeControl) {
                this.activeEditorContext.set(activeControl.getId());
                const resource = editor_1.toResource(activeControl.input, { supportSideBySide: editor_1.SideBySideEditor.MASTER });
                const canSave = resource ? this.fileService.canHandleResource(resource) || resource.scheme === network_1.Schemas.untitled : false;
                this.activeEditorIsSaveable.set(canSave);
            }
            else {
                this.activeEditorContext.reset();
                this.activeEditorIsSaveable.reset();
            }
        }
        updateInputContextKeys() {
            function activeElementIsInput() {
                return !!document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');
            }
            const isInputFocused = activeElementIsInput();
            this.inputFocusedContext.set(isInputFocused);
            if (isInputFocused) {
                const tracker = dom_1.trackFocus(document.activeElement);
                event_1.Event.once(tracker.onDidBlur)(() => {
                    this.inputFocusedContext.set(activeElementIsInput());
                    tracker.dispose();
                });
            }
        }
        updateWorkbenchStateContextKey() {
            this.workbenchStateContext.set(this.getWorkbenchStateString());
        }
        updateWorkspaceFolderCountContextKey() {
            this.workspaceFolderCountContext.set(this.contextService.getWorkspace().folders.length);
        }
        updateSplitEditorsVerticallyContext() {
            const direction = editorGroupsService_1.preferredSideBySideGroupDirection(this.configurationService);
            this.splitEditorsVerticallyContext.set(direction === 1 /* DOWN */);
        }
        getWorkbenchStateString() {
            switch (this.contextService.getWorkbenchState()) {
                case 1 /* EMPTY */: return 'empty';
                case 2 /* FOLDER */: return 'folder';
                case 3 /* WORKSPACE */: return 'workspace';
            }
        }
        updateSideBarContextKeys() {
            this.sideBarVisibleContext.set(this.layoutService.isVisible("workbench.parts.sidebar" /* SIDEBAR_PART */));
        }
    };
    WorkbenchContextKeysHandler = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService),
        __param(4, editorService_1.IEditorService),
        __param(5, editorGroupsService_1.IEditorGroupsService),
        __param(6, layoutService_1.IWorkbenchLayoutService),
        __param(7, viewlet_2.IViewletService),
        __param(8, files_1.IFileService)
    ], WorkbenchContextKeysHandler);
    exports.WorkbenchContextKeysHandler = WorkbenchContextKeysHandler;
});
//# sourceMappingURL=contextkeys.js.map