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
define(["require", "exports", "vs/workbench/contrib/files/common/editors/fileEditorInput", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/base/common/event", "vs/workbench/services/backup/common/backup", "vs/platform/configuration/common/configuration", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/textmodelResolver/common/textModelResolverService", "vs/editor/common/services/resolverService", "vs/workbench/services/untitled/common/untitledEditorService", "vs/platform/workspace/common/workspace", "vs/platform/lifecycle/common/lifecycle", "vs/platform/instantiation/common/serviceCollection", "vs/platform/files/common/files", "vs/editor/common/services/modelService", "vs/editor/common/services/modeServiceImpl", "vs/editor/common/services/modelServiceImpl", "vs/workbench/services/textfile/common/textfiles", "vs/platform/environment/node/argv", "vs/editor/common/services/modeService", "vs/workbench/services/history/common/history", "vs/platform/instantiation/common/instantiation", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/workspace/test/common/testWorkspace", "vs/editor/common/model/textModel", "vs/platform/environment/common/environment", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService", "vs/platform/workspaces/common/workspaces", "vs/editor/common/services/resourceConfiguration", "vs/editor/common/core/position", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/editor/common/core/range", "vs/platform/dialogs/common/dialogs", "vs/platform/notification/common/notification", "vs/platform/notification/test/common/testNotificationService", "vs/workbench/services/extensions/common/extensions", "vs/platform/keybinding/common/keybinding", "vs/workbench/services/decorations/browser/decorations", "vs/base/common/lifecycle", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/editor/browser/services/codeEditorService", "vs/base/browser/dom", "vs/platform/log/common/log", "vs/platform/label/common/label", "vs/base/common/async", "vs/workbench/services/viewlet/browser/viewlet", "vs/platform/storage/common/storage", "vs/base/common/platform", "vs/workbench/services/label/common/labelService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/environment/node/environmentService", "vs/base/common/buffer", "vs/workbench/services/textfile/electron-browser/nativeTextFileService", "vs/base/common/network", "vs/platform/product/common/product", "vs/workbench/services/host/browser/host", "vs/platform/electron/node/electron", "vs/workbench/contrib/files/browser/files.contribution"], function (require, exports, fileEditorInput_1, instantiationServiceMock_1, path_1, resources, uri_1, telemetry_1, telemetryUtils_1, event_1, backup_1, configuration_1, layoutService_1, textModelResolverService_1, resolverService_1, untitledEditorService_1, workspace_1, lifecycle_1, serviceCollection_1, files_1, modelService_1, modeServiceImpl_1, modelServiceImpl_1, textfiles_1, argv_1, modeService_1, history_1, instantiation_1, testConfigurationService_1, testWorkspace_1, textModel_1, environment_1, themeService_1, testThemeService_1, workspaces_1, resourceConfiguration_1, position_1, actions_1, contextkey_1, mockKeybindingService_1, range_1, dialogs_1, notification_1, testNotificationService_1, extensions_1, keybinding_1, decorations_1, lifecycle_2, editorGroupsService_1, editorService_1, codeEditorService_1, dom_1, log_1, label_1, async_1, viewlet_1, storage_1, platform_1, labelService_1, environmentService_1, environmentService_2, buffer_1, nativeTextFileService_1, network_1, product_1, host_1, electron_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createFileInput(instantiationService, resource) {
        return instantiationService.createInstance(fileEditorInput_1.FileEditorInput, resource, undefined, undefined);
    }
    exports.createFileInput = createFileInput;
    exports.TestEnvironmentService = new environmentService_2.WorkbenchEnvironmentService(argv_1.parseArgs(process.argv, argv_1.OPTIONS), process.execPath, 0);
    class TestContextService {
        constructor(workspace = testWorkspace_1.TestWorkspace, options = null) {
            this.workspace = workspace;
            this.options = options || Object.create(null);
            this._onDidChangeWorkspaceName = new event_1.Emitter();
            this._onDidChangeWorkspaceFolders = new event_1.Emitter();
            this._onDidChangeWorkbenchState = new event_1.Emitter();
        }
        get onDidChangeWorkspaceName() {
            return this._onDidChangeWorkspaceName.event;
        }
        get onDidChangeWorkspaceFolders() {
            return this._onDidChangeWorkspaceFolders.event;
        }
        get onDidChangeWorkbenchState() {
            return this._onDidChangeWorkbenchState.event;
        }
        getFolders() {
            return this.workspace ? this.workspace.folders : [];
        }
        getWorkbenchState() {
            if (this.workspace.configuration) {
                return 3 /* WORKSPACE */;
            }
            if (this.workspace.folders.length) {
                return 2 /* FOLDER */;
            }
            return 1 /* EMPTY */;
        }
        getCompleteWorkspace() {
            return Promise.resolve(this.getWorkspace());
        }
        getWorkspace() {
            return this.workspace;
        }
        getWorkspaceFolder(resource) {
            return this.workspace.getFolder(resource);
        }
        setWorkspace(workspace) {
            this.workspace = workspace;
        }
        getOptions() {
            return this.options;
        }
        updateOptions() {
        }
        isInsideWorkspace(resource) {
            if (resource && this.workspace) {
                return resources.isEqualOrParent(resource, this.workspace.folders[0].uri);
            }
            return false;
        }
        toResource(workspaceRelativePath) {
            return uri_1.URI.file(path_1.join('C:\\', workspaceRelativePath));
        }
        isCurrentWorkspace(workspaceIdentifier) {
            return workspaces_1.isSingleFolderWorkspaceIdentifier(workspaceIdentifier) && resources.isEqual(this.workspace.folders[0].uri, workspaceIdentifier);
        }
    }
    exports.TestContextService = TestContextService;
    let TestTextFileService = class TestTextFileService extends nativeTextFileService_1.NativeTextFileService {
        constructor(contextService, fileService, untitledEditorService, lifecycleService, instantiationService, configurationService, modeService, modelService, environmentService, notificationService, backupFileService, historyService, contextKeyService, dialogService, fileDialogService, editorService, textResourceConfigurationService, electronService) {
            super(contextService, fileService, untitledEditorService, lifecycleService, instantiationService, configurationService, modeService, modelService, environmentService, notificationService, backupFileService, historyService, contextKeyService, dialogService, fileDialogService, editorService, textResourceConfigurationService, electronService);
            this.fileService = fileService;
        }
        setPromptPath(path) {
            this.promptPath = path;
        }
        setConfirmResult(result) {
            this.confirmResult = result;
        }
        setResolveTextContentErrorOnce(error) {
            this.resolveTextContentError = error;
        }
        readStream(resource, options) {
            if (this.resolveTextContentError) {
                const error = this.resolveTextContentError;
                this.resolveTextContentError = null;
                return Promise.reject(error);
            }
            return this.fileService.readFileStream(resource, options).then(async (content) => {
                return {
                    resource: content.resource,
                    name: content.name,
                    mtime: content.mtime,
                    etag: content.etag,
                    encoding: 'utf8',
                    value: await textModel_1.createTextBufferFactoryFromStream(content.value),
                    size: 10
                };
            });
        }
        promptForPath(_resource, _defaultPath) {
            return Promise.resolve(this.promptPath);
        }
        confirmSave(_resources) {
            return Promise.resolve(this.confirmResult);
        }
        confirmOverwrite(_resource) {
            return Promise.resolve(true);
        }
        onFilesConfigurationChange(configuration) {
            super.onFilesConfigurationChange(configuration);
        }
        cleanupBackupsBeforeShutdown() {
            this.cleanupBackupsBeforeShutdownCalled = true;
            return Promise.resolve();
        }
    };
    TestTextFileService = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, files_1.IFileService),
        __param(2, untitledEditorService_1.IUntitledEditorService),
        __param(3, lifecycle_1.ILifecycleService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, modeService_1.IModeService),
        __param(7, modelService_1.IModelService),
        __param(8, environmentService_1.IWorkbenchEnvironmentService),
        __param(9, notification_1.INotificationService),
        __param(10, backup_1.IBackupFileService),
        __param(11, history_1.IHistoryService),
        __param(12, contextkey_1.IContextKeyService),
        __param(13, dialogs_1.IDialogService),
        __param(14, dialogs_1.IFileDialogService),
        __param(15, editorService_1.IEditorService),
        __param(16, resourceConfiguration_1.ITextResourceConfigurationService),
        __param(17, electron_1.IElectronService)
    ], TestTextFileService);
    exports.TestTextFileService = TestTextFileService;
    function workbenchInstantiationService() {
        let instantiationService = new instantiationServiceMock_1.TestInstantiationService(new serviceCollection_1.ServiceCollection([lifecycle_1.ILifecycleService, new TestLifecycleService()]));
        instantiationService.stub(environment_1.IEnvironmentService, exports.TestEnvironmentService);
        instantiationService.stub(contextkey_1.IContextKeyService, instantiationService.createInstance(mockKeybindingService_1.MockContextKeyService));
        const workspaceContextService = new TestContextService(testWorkspace_1.TestWorkspace);
        instantiationService.stub(workspace_1.IWorkspaceContextService, workspaceContextService);
        const configService = new testConfigurationService_1.TestConfigurationService();
        instantiationService.stub(configuration_1.IConfigurationService, configService);
        instantiationService.stub(resourceConfiguration_1.ITextResourceConfigurationService, new TestTextResourceConfigurationService(configService));
        instantiationService.stub(untitledEditorService_1.IUntitledEditorService, instantiationService.createInstance(untitledEditorService_1.UntitledEditorService));
        instantiationService.stub(storage_1.IStorageService, new TestStorageService());
        instantiationService.stub(layoutService_1.IWorkbenchLayoutService, new TestLayoutService());
        instantiationService.stub(electron_1.IElectronService, new TestElectronService());
        instantiationService.stub(modeService_1.IModeService, instantiationService.createInstance(modeServiceImpl_1.ModeServiceImpl));
        instantiationService.stub(history_1.IHistoryService, new TestHistoryService());
        instantiationService.stub(resourceConfiguration_1.ITextResourcePropertiesService, new TestTextResourcePropertiesService(configService));
        instantiationService.stub(modelService_1.IModelService, instantiationService.createInstance(modelServiceImpl_1.ModelServiceImpl));
        instantiationService.stub(files_1.IFileService, new TestFileService());
        instantiationService.stub(backup_1.IBackupFileService, new TestBackupFileService());
        instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
        instantiationService.stub(notification_1.INotificationService, new testNotificationService_1.TestNotificationService());
        instantiationService.stub(untitledEditorService_1.IUntitledEditorService, instantiationService.createInstance(untitledEditorService_1.UntitledEditorService));
        instantiationService.stub(actions_1.IMenuService, new TestMenuService());
        instantiationService.stub(keybinding_1.IKeybindingService, new mockKeybindingService_1.MockKeybindingService());
        instantiationService.stub(decorations_1.IDecorationsService, new TestDecorationsService());
        instantiationService.stub(extensions_1.IExtensionService, new TestExtensionService());
        instantiationService.stub(host_1.IHostService, instantiationService.createInstance(TestHostService));
        instantiationService.stub(textfiles_1.ITextFileService, instantiationService.createInstance(TestTextFileService));
        instantiationService.stub(resolverService_1.ITextModelService, instantiationService.createInstance(textModelResolverService_1.TextModelResolverService));
        instantiationService.stub(themeService_1.IThemeService, new testThemeService_1.TestThemeService());
        instantiationService.stub(log_1.ILogService, new log_1.NullLogService());
        instantiationService.stub(editorGroupsService_1.IEditorGroupsService, new TestEditorGroupsService([new TestEditorGroup(0)]));
        instantiationService.stub(label_1.ILabelService, instantiationService.createInstance(labelService_1.LabelService));
        const editorService = new TestEditorService();
        instantiationService.stub(editorService_1.IEditorService, editorService);
        instantiationService.stub(codeEditorService_1.ICodeEditorService, new TestCodeEditorService());
        instantiationService.stub(viewlet_1.IViewletService, new TestViewletService());
        return instantiationService;
    }
    exports.workbenchInstantiationService = workbenchInstantiationService;
    class TestDecorationsService {
        constructor() {
            this.onDidChangeDecorations = event_1.Event.None;
        }
        registerDecorationsProvider(_provider) { return lifecycle_2.Disposable.None; }
        getDecoration(_uri, _includeChildren, _overwrite) { return undefined; }
    }
    exports.TestDecorationsService = TestDecorationsService;
    class TestExtensionService extends extensions_1.NullExtensionService {
    }
    exports.TestExtensionService = TestExtensionService;
    class TestMenuService {
        createMenu(_id, _scopedKeybindingService) {
            return {
                onDidChange: event_1.Event.None,
                dispose: () => undefined,
                getActions: () => []
            };
        }
    }
    exports.TestMenuService = TestMenuService;
    class TestHistoryService {
        constructor(root) {
            this.root = root;
        }
        reopenLastClosedEditor() {
        }
        forward(_acrossEditors) {
        }
        back(_acrossEditors) {
        }
        last() {
        }
        remove(_input) {
        }
        clear() {
        }
        clearRecentlyOpened() {
        }
        getHistory() {
            return [];
        }
        getLastActiveWorkspaceRoot(_schemeFilter) {
            return this.root;
        }
        getLastActiveFile(_schemeFilter) {
            return undefined;
        }
        openLastEditLocation() {
        }
    }
    exports.TestHistoryService = TestHistoryService;
    class TestDialogService {
        confirm(_confirmation) {
            return Promise.resolve({ confirmed: false });
        }
        show(_severity, _message, _buttons, _options) {
            return Promise.resolve({ choice: 0 });
        }
        about() {
            return Promise.resolve();
        }
    }
    exports.TestDialogService = TestDialogService;
    class TestFileDialogService {
        defaultFilePath(_schemeFilter) {
            return undefined;
        }
        defaultFolderPath(_schemeFilter) {
            return undefined;
        }
        defaultWorkspacePath(_schemeFilter) {
            return undefined;
        }
        pickFileFolderAndOpen(_options) {
            return Promise.resolve(0);
        }
        pickFileAndOpen(_options) {
            return Promise.resolve(0);
        }
        pickFolderAndOpen(_options) {
            return Promise.resolve(0);
        }
        pickWorkspaceAndOpen(_options) {
            return Promise.resolve(0);
        }
        pickFileToSave(_options) {
            return Promise.resolve(undefined);
        }
        showSaveDialog(_options) {
            return Promise.resolve(undefined);
        }
        showOpenDialog(_options) {
            return Promise.resolve(undefined);
        }
    }
    exports.TestFileDialogService = TestFileDialogService;
    class TestLayoutService {
        constructor() {
            this.dimension = { width: 800, height: 600 };
            this.container = window.document.body;
            this.onZenModeChange = event_1.Event.None;
            this.onCenteredLayoutChange = event_1.Event.None;
            this.onFullscreenChange = event_1.Event.None;
            this.onPanelPositionChange = event_1.Event.None;
            this.onLayout = event_1.Event.None;
            this._onTitleBarVisibilityChange = new event_1.Emitter();
            this._onMenubarVisibilityChange = new event_1.Emitter();
        }
        get onTitleBarVisibilityChange() {
            return this._onTitleBarVisibilityChange.event;
        }
        get onMenubarVisibilityChange() {
            return this._onMenubarVisibilityChange.event;
        }
        isRestored() {
            return true;
        }
        hasFocus(_part) {
            return false;
        }
        isVisible(_part) {
            return true;
        }
        getDimension(_part) {
            return new dom_1.Dimension(0, 0);
        }
        getContainer(_part) {
            return null;
        }
        isTitleBarHidden() {
            return false;
        }
        getTitleBarOffset() {
            return 0;
        }
        isStatusBarHidden() {
            return false;
        }
        isActivityBarHidden() {
            return false;
        }
        setActivityBarHidden(_hidden) { }
        isSideBarHidden() {
            return false;
        }
        setEditorHidden(_hidden) { return Promise.resolve(); }
        setSideBarHidden(_hidden) { return Promise.resolve(); }
        isPanelHidden() {
            return false;
        }
        setPanelHidden(_hidden) { return Promise.resolve(); }
        toggleMaximizedPanel() { }
        isPanelMaximized() {
            return false;
        }
        getMenubarVisibility() {
            throw new Error('not implemented');
        }
        getSideBarPosition() {
            return 0;
        }
        getPanelPosition() {
            return 0;
        }
        setPanelPosition(_position) {
            return Promise.resolve();
        }
        addClass(_clazz) { }
        removeClass(_clazz) { }
        getMaximumEditorDimensions() { throw new Error('not implemented'); }
        getWorkbenchContainer() { throw new Error('not implemented'); }
        getWorkbenchElement() { throw new Error('not implemented'); }
        toggleZenMode() { }
        isEditorLayoutCentered() { return false; }
        centerEditorLayout(_active) { }
        resizePart(_part, _sizeChange) { }
        registerPart(part) { }
    }
    exports.TestLayoutService = TestLayoutService;
    let activeViewlet = {};
    class TestViewletService {
        constructor() {
            this.onDidViewletRegisterEmitter = new event_1.Emitter();
            this.onDidViewletDeregisterEmitter = new event_1.Emitter();
            this.onDidViewletOpenEmitter = new event_1.Emitter();
            this.onDidViewletCloseEmitter = new event_1.Emitter();
            this.onDidViewletRegister = this.onDidViewletRegisterEmitter.event;
            this.onDidViewletDeregister = this.onDidViewletDeregisterEmitter.event;
            this.onDidViewletOpen = this.onDidViewletOpenEmitter.event;
            this.onDidViewletClose = this.onDidViewletCloseEmitter.event;
        }
        openViewlet(id, focus) {
            return Promise.resolve(null);
        }
        getViewlets() {
            return [];
        }
        getAllViewlets() {
            return [];
        }
        getActiveViewlet() {
            return activeViewlet;
        }
        dispose() {
        }
        getDefaultViewletId() {
            return 'workbench.view.explorer';
        }
        getViewlet(id) {
            return undefined;
        }
        getProgressIndicator(id) {
            return null;
        }
        hideActiveViewlet() { }
        getLastActiveViewletId() {
            return undefined;
        }
    }
    exports.TestViewletService = TestViewletService;
    class TestPanelService {
        constructor() {
            this.onDidPanelOpen = new event_1.Emitter().event;
            this.onDidPanelClose = new event_1.Emitter().event;
        }
        openPanel(id, focus) {
            return null;
        }
        getPanel(id) {
            return activeViewlet;
        }
        getPanels() {
            return [];
        }
        getPinnedPanels() {
            return [];
        }
        getActivePanel() {
            return activeViewlet;
        }
        setPanelEnablement(id, enabled) { }
        dispose() {
        }
        showActivity(panelId, badge, clazz) {
            throw new Error('Method not implemented.');
        }
        getProgressIndicator(id) {
            return null;
        }
        hideActivePanel() { }
        getLastActivePanelId() {
            return undefined;
        }
    }
    exports.TestPanelService = TestPanelService;
    class TestStorageService extends storage_1.InMemoryStorageService {
    }
    exports.TestStorageService = TestStorageService;
    class TestEditorGroupsService {
        constructor(groups = []) {
            this.groups = groups;
            this.onDidActiveGroupChange = event_1.Event.None;
            this.onDidActivateGroup = event_1.Event.None;
            this.onDidAddGroup = event_1.Event.None;
            this.onDidRemoveGroup = event_1.Event.None;
            this.onDidMoveGroup = event_1.Event.None;
            this.onDidGroupIndexChange = event_1.Event.None;
            this.onDidLayout = event_1.Event.None;
            this.whenRestored = Promise.resolve(undefined);
            this.willRestoreEditors = false;
            this.contentDimension = { width: 800, height: 600 };
        }
        get activeGroup() {
            return this.groups[0];
        }
        get count() {
            return this.groups.length;
        }
        getGroups(_order) {
            return this.groups;
        }
        getGroup(identifier) {
            for (const group of this.groups) {
                if (group.id === identifier) {
                    return group;
                }
            }
            return undefined;
        }
        getLabel(_identifier) {
            return 'Group 1';
        }
        findGroup(_scope, _source, _wrap) {
            throw new Error('not implemented');
        }
        activateGroup(_group) {
            throw new Error('not implemented');
        }
        restoreGroup(_group) {
            throw new Error('not implemented');
        }
        getSize(_group) {
            return { width: 100, height: 100 };
        }
        setSize(_group, _size) { }
        arrangeGroups(_arrangement) { }
        applyLayout(_layout) { }
        setGroupOrientation(_orientation) { }
        addGroup(_location, _direction, _options) {
            throw new Error('not implemented');
        }
        removeGroup(_group) { }
        moveGroup(_group, _location, _direction) {
            throw new Error('not implemented');
        }
        mergeGroup(_group, _target, _options) {
            throw new Error('not implemented');
        }
        copyGroup(_group, _location, _direction) {
            throw new Error('not implemented');
        }
        centerLayout(active) { }
        isLayoutCentered() {
            return false;
        }
        enforcePartOptions(options) {
            return lifecycle_2.Disposable.None;
        }
    }
    exports.TestEditorGroupsService = TestEditorGroupsService;
    class TestEditorGroup {
        constructor(id) {
            this.id = id;
            this.editors = [];
            this.whenRestored = Promise.resolve(undefined);
            this.isEmpty = true;
            this.isMinimized = false;
            this.onWillDispose = event_1.Event.None;
            this.onDidGroupChange = event_1.Event.None;
            this.onWillCloseEditor = event_1.Event.None;
            this.onDidCloseEditor = event_1.Event.None;
            this.onWillOpenEditor = event_1.Event.None;
            this.onDidOpenEditorFail = event_1.Event.None;
            this.onDidFocus = event_1.Event.None;
            this.onDidChange = event_1.Event.None;
        }
        get group() { throw new Error('not implemented'); }
        getEditors(_order) {
            return [];
        }
        getEditor(_index) {
            throw new Error('not implemented');
        }
        getIndexOfEditor(_editor) {
            return -1;
        }
        openEditor(_editor, _options) {
            throw new Error('not implemented');
        }
        openEditors(_editors) {
            throw new Error('not implemented');
        }
        isOpened(_editor) {
            return false;
        }
        isPinned(_editor) {
            return false;
        }
        isActive(_editor) {
            return false;
        }
        moveEditor(_editor, _target, _options) { }
        copyEditor(_editor, _target, _options) { }
        closeEditor(_editor, options) {
            return Promise.resolve();
        }
        closeEditors(_editors, options) {
            return Promise.resolve();
        }
        closeAllEditors() {
            return Promise.resolve();
        }
        replaceEditors(_editors) {
            return Promise.resolve();
        }
        pinEditor(_editor) { }
        focus() { }
        invokeWithinContext(fn) {
            throw new Error('not implemented');
        }
        setActive(_isActive) { }
        notifyIndexChanged(_index) { }
        dispose() { }
        toJSON() { return Object.create(null); }
        layout(_width, _height) { }
        relayout() { }
    }
    exports.TestEditorGroup = TestEditorGroup;
    class TestEditorService {
        constructor() {
            this.onDidActiveEditorChange = event_1.Event.None;
            this.onDidVisibleEditorsChange = event_1.Event.None;
            this.onDidCloseEditor = event_1.Event.None;
            this.onDidOpenEditorFail = event_1.Event.None;
            this.editors = [];
            this.visibleControls = [];
            this.visibleTextEditorWidgets = [];
            this.visibleEditors = [];
        }
        overrideOpenEditor(_handler) {
            return lifecycle_2.toDisposable(() => undefined);
        }
        openEditor(_editor, _options, _group) {
            throw new Error('not implemented');
        }
        openEditors(_editors, _group) {
            throw new Error('not implemented');
        }
        isOpen(_editor) {
            return false;
        }
        getOpened(_editor) {
            throw new Error('not implemented');
        }
        replaceEditors(_editors, _group) {
            return Promise.resolve(undefined);
        }
        invokeWithinEditorContext(fn) {
            throw new Error('not implemented');
        }
        createInput(_input) {
            throw new Error('not implemented');
        }
    }
    exports.TestEditorService = TestEditorService;
    class TestFileService {
        constructor() {
            this.onWillActivateFileSystemProvider = event_1.Event.None;
            this.onError = event_1.Event.None;
            this.content = 'Hello Html';
            this.onDidChangeFileSystemProviderRegistrations = event_1.Event.None;
            this.providers = new Map();
            this._onFileChanges = new event_1.Emitter();
            this._onAfterOperation = new event_1.Emitter();
        }
        setContent(content) {
            this.content = content;
        }
        getContent() {
            return this.content;
        }
        getLastReadFileUri() {
            return this.lastReadFileUri;
        }
        get onFileChanges() {
            return this._onFileChanges.event;
        }
        fireFileChanges(event) {
            this._onFileChanges.fire(event);
        }
        get onAfterOperation() {
            return this._onAfterOperation.event;
        }
        fireAfterOperation(event) {
            this._onAfterOperation.fire(event);
        }
        resolve(resource, _options) {
            return Promise.resolve({
                resource,
                etag: Date.now().toString(),
                encoding: 'utf8',
                mtime: Date.now(),
                size: 42,
                isDirectory: false,
                name: resources.basename(resource)
            });
        }
        resolveAll(toResolve) {
            return Promise.all(toResolve.map(resourceAndOption => this.resolve(resourceAndOption.resource, resourceAndOption.options))).then(stats => stats.map(stat => ({ stat, success: true })));
        }
        exists(_resource) {
            return Promise.resolve(true);
        }
        readFile(resource, options) {
            this.lastReadFileUri = resource;
            return Promise.resolve({
                resource: resource,
                value: buffer_1.VSBuffer.fromString(this.content),
                etag: 'index.txt',
                encoding: 'utf8',
                mtime: Date.now(),
                name: resources.basename(resource),
                size: 1
            });
        }
        readFileStream(resource, options) {
            this.lastReadFileUri = resource;
            return Promise.resolve({
                resource: resource,
                value: {
                    on: (event, callback) => {
                        if (event === 'data') {
                            callback(this.content);
                        }
                        if (event === 'end') {
                            callback();
                        }
                    },
                    resume: () => { },
                    pause: () => { },
                    destroy: () => { }
                },
                etag: 'index.txt',
                encoding: 'utf8',
                mtime: Date.now(),
                size: 1,
                name: resources.basename(resource)
            });
        }
        writeFile(resource, bufferOrReadable, options) {
            return async_1.timeout(0).then(() => ({
                resource,
                etag: 'index.txt',
                encoding: 'utf8',
                mtime: Date.now(),
                size: 42,
                isDirectory: false,
                name: resources.basename(resource)
            }));
        }
        move(_source, _target, _overwrite) {
            return Promise.resolve(null);
        }
        copy(_source, _target, _overwrite) {
            throw new Error('not implemented');
        }
        createFile(_resource, _content, _options) {
            throw new Error('not implemented');
        }
        createFolder(_resource) {
            throw new Error('not implemented');
        }
        registerProvider(scheme, provider) {
            this.providers.set(scheme, provider);
            return lifecycle_2.toDisposable(() => this.providers.delete(scheme));
        }
        activateProvider(_scheme) {
            throw new Error('not implemented');
        }
        canHandleResource(resource) {
            return resource.scheme === 'file' || this.providers.has(resource.scheme);
        }
        hasCapability(resource, capability) { return false; }
        del(_resource, _options) {
            return Promise.resolve();
        }
        watch(_resource) {
            return lifecycle_2.Disposable.None;
        }
        getWriteEncoding(_resource) {
            return { encoding: 'utf8', hasBOM: false };
        }
        dispose() {
        }
    }
    exports.TestFileService = TestFileService;
    class TestBackupFileService {
        hasBackups() {
            return Promise.resolve(false);
        }
        hasBackup(_resource) {
            return Promise.resolve(false);
        }
        hasBackupSync(resource, versionId) {
            return false;
        }
        loadBackupResource(resource) {
            return this.hasBackup(resource).then(hasBackup => {
                if (hasBackup) {
                    return this.toBackupResource(resource);
                }
                return undefined;
            });
        }
        registerResourceForBackup(_resource) {
            return Promise.resolve();
        }
        deregisterResourceForBackup(_resource) {
            return Promise.resolve();
        }
        toBackupResource(_resource) {
            throw new Error('not implemented');
        }
        backupResource(_resource, _content, versionId, meta) {
            return Promise.resolve();
        }
        getWorkspaceFileBackups() {
            return Promise.resolve([]);
        }
        parseBackupContent(textBufferFactory) {
            const textBuffer = textBufferFactory.create(1 /* LF */);
            const lineCount = textBuffer.getLineCount();
            const range = new range_1.Range(1, 1, lineCount, textBuffer.getLineLength(lineCount) + 1);
            return textBuffer.getValueInRange(range, 0 /* TextDefined */);
        }
        resolveBackupContent(_backup) {
            throw new Error('not implemented');
        }
        discardResourceBackup(_resource) {
            return Promise.resolve();
        }
        discardAllWorkspaceBackups() {
            return Promise.resolve();
        }
    }
    exports.TestBackupFileService = TestBackupFileService;
    class TestCodeEditorService {
        constructor() {
            this.onCodeEditorAdd = event_1.Event.None;
            this.onCodeEditorRemove = event_1.Event.None;
            this.onDiffEditorAdd = event_1.Event.None;
            this.onDiffEditorRemove = event_1.Event.None;
            this.onDidChangeTransientModelProperty = event_1.Event.None;
        }
        addCodeEditor(_editor) { }
        removeCodeEditor(_editor) { }
        listCodeEditors() { return []; }
        addDiffEditor(_editor) { }
        removeDiffEditor(_editor) { }
        listDiffEditors() { return []; }
        getFocusedCodeEditor() { return undefined; }
        registerDecorationType(_key, _options, _parentTypeKey) { }
        removeDecorationType(_key) { }
        resolveDecorationOptions(_typeKey, _writable) { return Object.create(null); }
        setTransientModelProperty(_model, _key, _value) { }
        getTransientModelProperty(_model, _key) { }
        getActiveCodeEditor() { return undefined; }
        openCodeEditor(_input, _source, _sideBySide) { return Promise.resolve(undefined); }
    }
    exports.TestCodeEditorService = TestCodeEditorService;
    class TestLifecycleService {
        constructor() {
            this._onBeforeShutdown = new event_1.Emitter();
            this._onWillShutdown = new event_1.Emitter();
            this._onShutdown = new event_1.Emitter();
        }
        when() {
            return Promise.resolve();
        }
        fireShutdown(reason = 2 /* QUIT */) {
            this._onWillShutdown.fire({
                join: () => { },
                reason
            });
        }
        fireWillShutdown(event) {
            this._onBeforeShutdown.fire(event);
        }
        get onBeforeShutdown() {
            return this._onBeforeShutdown.event;
        }
        get onWillShutdown() {
            return this._onWillShutdown.event;
        }
        get onShutdown() {
            return this._onShutdown.event;
        }
    }
    exports.TestLifecycleService = TestLifecycleService;
    class TestTextResourceConfigurationService {
        constructor(configurationService = new testConfigurationService_1.TestConfigurationService()) {
            this.configurationService = configurationService;
        }
        onDidChangeConfiguration() {
            return { dispose() { } };
        }
        getValue(resource, arg2, arg3) {
            const position = position_1.Position.isIPosition(arg2) ? arg2 : null;
            const section = position ? (typeof arg3 === 'string' ? arg3 : undefined) : (typeof arg2 === 'string' ? arg2 : undefined);
            return this.configurationService.getValue(section, { resource });
        }
    }
    exports.TestTextResourceConfigurationService = TestTextResourceConfigurationService;
    let TestTextResourcePropertiesService = class TestTextResourcePropertiesService {
        constructor(configurationService) {
            this.configurationService = configurationService;
        }
        getEOL(resource) {
            const filesConfiguration = this.configurationService.getValue('files');
            if (filesConfiguration && filesConfiguration.eol) {
                if (filesConfiguration.eol !== 'auto') {
                    return filesConfiguration.eol;
                }
            }
            return (platform_1.isLinux || platform_1.isMacintosh) ? '\n' : '\r\n';
        }
    };
    TestTextResourcePropertiesService = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], TestTextResourcePropertiesService);
    exports.TestTextResourcePropertiesService = TestTextResourcePropertiesService;
    class TestSharedProcessService {
        getChannel(channelName) {
            return undefined;
        }
        registerChannel(channelName, channel) { }
        async toggleSharedProcessWindow() { }
        async whenSharedProcessReady() { }
    }
    exports.TestSharedProcessService = TestSharedProcessService;
    class RemoteFileSystemProvider {
        constructor(diskFileSystemProvider, remoteAuthority) {
            this.diskFileSystemProvider = diskFileSystemProvider;
            this.remoteAuthority = remoteAuthority;
            this.capabilities = this.diskFileSystemProvider.capabilities;
            this.onDidChangeCapabilities = this.diskFileSystemProvider.onDidChangeCapabilities;
            this.onDidChangeFile = event_1.Event.map(this.diskFileSystemProvider.onDidChangeFile, changes => changes.map((c) => {
                return {
                    type: c.type,
                    resource: c.resource.with({ scheme: network_1.Schemas.vscodeRemote, authority: this.remoteAuthority }),
                };
            }));
        }
        watch(resource, opts) { return this.diskFileSystemProvider.watch(this.toFileResource(resource), opts); }
        stat(resource) { return this.diskFileSystemProvider.stat(this.toFileResource(resource)); }
        mkdir(resource) { return this.diskFileSystemProvider.mkdir(this.toFileResource(resource)); }
        readdir(resource) { return this.diskFileSystemProvider.readdir(this.toFileResource(resource)); }
        delete(resource, opts) { return this.diskFileSystemProvider.delete(this.toFileResource(resource), opts); }
        rename(from, to, opts) { return this.diskFileSystemProvider.rename(this.toFileResource(from), this.toFileResource(to), opts); }
        copy(from, to, opts) { return this.diskFileSystemProvider.copy(this.toFileResource(from), this.toFileResource(to), opts); }
        readFile(resource) { return this.diskFileSystemProvider.readFile(this.toFileResource(resource)); }
        writeFile(resource, content, opts) { return this.diskFileSystemProvider.writeFile(this.toFileResource(resource), content, opts); }
        open(resource, opts) { return this.diskFileSystemProvider.open(this.toFileResource(resource), opts); }
        close(fd) { return this.diskFileSystemProvider.close(fd); }
        read(fd, pos, data, offset, length) { return this.diskFileSystemProvider.read(fd, pos, data, offset, length); }
        write(fd, pos, data, offset, length) { return this.diskFileSystemProvider.write(fd, pos, data, offset, length); }
        toFileResource(resource) { return resource.with({ scheme: network_1.Schemas.file, authority: '' }); }
    }
    exports.RemoteFileSystemProvider = RemoteFileSystemProvider;
    exports.productService = Object.assign({ _serviceBrand: undefined }, product_1.default);
    class TestHostService {
        constructor() {
            this.hasFocus = true;
            this.onDidChangeFocus = event_1.Event.None;
        }
        async restart() { }
        async reload() { }
        async closeWorkspace() { }
        async focus() { }
        async openWindow(arg1, arg2) { }
        async toggleFullScreen() { }
    }
    exports.TestHostService = TestHostService;
    class TestElectronService {
        constructor() {
            this.onWindowOpen = event_1.Event.None;
            this.onWindowMaximize = event_1.Event.None;
            this.onWindowUnmaximize = event_1.Event.None;
            this.onWindowFocus = event_1.Event.None;
            this.onWindowBlur = event_1.Event.None;
            this.windowCount = Promise.resolve(1);
        }
        getWindowCount() { return this.windowCount; }
        async getWindows() { return []; }
        async getActiveWindowId() { return undefined; }
        openWindow(arg1, arg2) {
            throw new Error('Method not implemented.');
        }
        async toggleFullScreen() { }
        async handleTitleDoubleClick() { }
        async isMaximized() { return true; }
        async maximizeWindow() { }
        async unmaximizeWindow() { }
        async minimizeWindow() { }
        async isWindowFocused() { return true; }
        async focusWindow(options) { }
        async showMessageBox(options) { throw new Error('Method not implemented.'); }
        async showSaveDialog(options) { throw new Error('Method not implemented.'); }
        async showOpenDialog(options) { throw new Error('Method not implemented.'); }
        async pickFileFolderAndOpen(options) { }
        async pickFileAndOpen(options) { }
        async pickFolderAndOpen(options) { }
        async pickWorkspaceAndOpen(options) { }
        async showItemInFolder(path) { }
        async setRepresentedFilename(path) { }
        async setDocumentEdited(edited) { }
        async openExternal(url) { return false; }
        async updateTouchBar(items) { }
        async newWindowTab() { }
        async showPreviousWindowTab() { }
        async showNextWindowTab() { }
        async moveWindowTabToNewWindow() { }
        async mergeAllWindowTabs() { }
        async toggleWindowTabsBar() { }
        async relaunch(options) { }
        async reload() { }
        async closeWorkspace() { }
        async closeWindow() { }
        async quit() { }
        async openDevTools(options) { }
        async toggleDevTools() { }
        async startCrashReporter(options) { }
        async resolveProxy(url) { return undefined; }
        async openExtensionDevelopmentHostWindow(args, env) { }
    }
    exports.TestElectronService = TestElectronService;
    class TestBackupMainService {
        isHotExitEnabled() {
            throw new Error('Method not implemented.');
        }
        getWorkspaceBackups() {
            throw new Error('Method not implemented.');
        }
        getFolderBackupPaths() {
            throw new Error('Method not implemented.');
        }
        getEmptyWindowBackupPaths() {
            throw new Error('Method not implemented.');
        }
        registerWorkspaceBackupSync(workspace, migrateFrom) {
            throw new Error('Method not implemented.');
        }
        registerFolderBackupSync(folderUri) {
            throw new Error('Method not implemented.');
        }
        registerEmptyWindowBackupSync(backupFolder, remoteAuthority) {
            throw new Error('Method not implemented.');
        }
        unregisterWorkspaceBackupSync(workspace) {
            throw new Error('Method not implemented.');
        }
        unregisterFolderBackupSync(folderUri) {
            throw new Error('Method not implemented.');
        }
        unregisterEmptyWindowBackupSync(backupFolder) {
            throw new Error('Method not implemented.');
        }
    }
    exports.TestBackupMainService = TestBackupMainService;
    class TestDialogMainService {
        pickFileFolder(options, window) {
            throw new Error('Method not implemented.');
        }
        pickFolder(options, window) {
            throw new Error('Method not implemented.');
        }
        pickFile(options, window) {
            throw new Error('Method not implemented.');
        }
        pickWorkspace(options, window) {
            throw new Error('Method not implemented.');
        }
        showMessageBox(options, window) {
            throw new Error('Method not implemented.');
        }
        showSaveDialog(options, window) {
            throw new Error('Method not implemented.');
        }
        showOpenDialog(options, window) {
            throw new Error('Method not implemented.');
        }
    }
    exports.TestDialogMainService = TestDialogMainService;
});
//# sourceMappingURL=workbenchTestServices.js.map