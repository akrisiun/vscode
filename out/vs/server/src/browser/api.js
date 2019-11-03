var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/uri", "vs/base/common/uuid", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextview/browser/contextView", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/registry/common/platform", "vs/workbench/services/statusbar/common/statusbar", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/workbench/api/common/extHostTypes", "vs/workbench/browser/parts/views/customView", "vs/workbench/browser/parts/views/viewsViewlet", "vs/workbench/browser/viewlet", "vs/workbench/common/actions", "vs/workbench/common/views", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/viewlet/browser/viewlet"], function (require, exports, dom_1, event_1, uri_1, uuid_1, nls_1, actions_1, commands_1, configuration_1, contextView_1, files_1, instantiation_1, notification_1, platform_1, statusbar_1, storage_1, telemetry_1, themeService_1, workspace_1, extHostTypes, customView_1, viewsViewlet_1, viewlet_1, actions_2, views_1, editorGroupsService_1, editorService_1, extensions_1, layoutService_1, viewlet_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Client-side implementation of VS Code's API.
     * TODO: Views aren't quite working.
     * TODO: Implement menu items for views (for item actions).
     * TODO: File system provider doesn't work.
     */
    exports.vscodeApi = (serviceCollection) => {
        const getService = (id) => serviceCollection.get(id);
        const commandService = getService(commands_1.ICommandService);
        const notificationService = getService(notification_1.INotificationService);
        const fileService = getService(files_1.IFileService);
        const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
        const statusbarService = getService(statusbar_1.IStatusbarService);
        // It would be nice to just export what VS Code creates but it looks to me
        // that it assumes it's running in the extension host and wouldn't work here.
        // It is probably possible to create an extension host that runs in the
        // browser's main thread, but I'm not sure how much jank that would require.
        // We could have a web worker host but we want DOM access.
        return {
            EventEmitter: event_1.Emitter,
            FileSystemError: extHostTypes.FileSystemError,
            FileType: files_1.FileType,
            StatusBarAlignment: extHostTypes.StatusBarAlignment,
            ThemeColor: extHostTypes.ThemeColor,
            TreeItemCollapsibleState: extHostTypes.TreeItemCollapsibleState,
            Uri: uri_1.URI,
            commands: {
                executeCommand: (commandId, ...args) => {
                    return commandService.executeCommand(commandId, ...args);
                },
                registerCommand: (id, command) => {
                    return commands_1.CommandsRegistry.registerCommand(id, command);
                },
            },
            window: {
                createStatusBarItem(alignmentOrOptions, priority) {
                    return new StatusBarEntry(statusbarService, alignmentOrOptions, priority);
                },
                registerTreeDataProvider: (id, dataProvider) => {
                    const tree = new TreeViewDataProvider(dataProvider);
                    const view = viewsRegistry.getView(id);
                    view.treeView.dataProvider = tree;
                    return {
                        dispose: () => tree.dispose(),
                    };
                },
                showErrorMessage: async (message) => {
                    notificationService.error(message);
                    return undefined;
                },
            },
            workspace: {
                registerFileSystemProvider: (scheme, provider) => {
                    return fileService.registerProvider(scheme, new FileSystemProvider(provider));
                },
            },
        };
    };
    /**
     * Coder API. This should only provide functionality that can't be made
     * available through the VS Code API.
     */
    exports.coderApi = (serviceCollection) => {
        const getService = (id) => serviceCollection.get(id);
        return {
            registerView: (viewId, viewName, containerId, containerName, icon) => {
                const cssClass = `extensionViewlet-${containerId}`;
                const id = `workbench.view.extension.${containerId}`;
                let CustomViewlet = class CustomViewlet extends viewsViewlet_1.ViewContainerViewlet {
                    constructor(configurationService, layoutService, telemetryService, contextService, storageService, _editorService, instantiationService, themeService, contextMenuService, extensionService) {
                        super(id, `${id}.state`, true, configurationService, layoutService, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService);
                    }
                };
                CustomViewlet = __decorate([
                    __param(0, configuration_1.IConfigurationService),
                    __param(1, layoutService_1.IWorkbenchLayoutService),
                    __param(2, telemetry_1.ITelemetryService),
                    __param(3, workspace_1.IWorkspaceContextService),
                    __param(4, storage_1.IStorageService),
                    __param(5, editorService_1.IEditorService),
                    __param(6, instantiation_1.IInstantiationService),
                    __param(7, themeService_1.IThemeService),
                    __param(8, contextView_1.IContextMenuService),
                    __param(9, extensions_1.IExtensionService)
                ], CustomViewlet);
                platform_1.Registry.as(viewlet_1.Extensions.Viewlets).registerViewlet(new viewlet_1.ViewletDescriptor(CustomViewlet, id, containerName, cssClass, undefined, uri_1.URI.parse(icon)));
                platform_1.Registry.as(actions_2.Extensions.WorkbenchActions).registerWorkbenchAction(new actions_1.SyncActionDescriptor(OpenCustomViewletAction, id, nls_1.localize("showViewlet", "Show {0}", containerName)), "View: Show {0}", nls_1.localize("view", "View"));
                // Generate CSS to show the icon in the activity bar.
                const iconClass = `.monaco-workbench .activitybar .monaco-action-bar .action-label.${cssClass}`;
                dom_1.createCSSRule(iconClass, `-webkit-mask: url('${icon}') no-repeat 50% 50%`);
                const container = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer(containerId);
                platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews([{
                        id: viewId,
                        name: viewName,
                        ctorDescriptor: { ctor: customView_1.CustomTreeViewPanel },
                        treeView: getService(instantiation_1.IInstantiationService).createInstance(customView_1.CustomTreeView, viewId, container),
                    }], container);
            },
        };
    };
    let OpenCustomViewletAction = class OpenCustomViewletAction extends viewlet_1.ShowViewletAction {
        constructor(id, label, viewletService, editorGroupService, layoutService) {
            super(id, label, id, viewletService, editorGroupService, layoutService);
        }
    };
    OpenCustomViewletAction = __decorate([
        __param(2, viewlet_2.IViewletService),
        __param(3, editorGroupsService_1.IEditorGroupsService),
        __param(4, layoutService_1.IWorkbenchLayoutService)
    ], OpenCustomViewletAction);
    class FileSystemProvider {
        constructor(provider) {
            this.provider = provider;
            this._onDidChange = new event_1.Emitter();
            this.onDidChangeFile = this._onDidChange.event;
            this.onDidChangeCapabilities = event_1.Event.None;
            this.capabilities = 2048 /* Readonly */;
        }
        watch(resource, opts) {
            return this.provider.watch(resource, opts);
        }
        async stat(resource) {
            return this.provider.stat(resource);
        }
        async readFile(resource) {
            return this.provider.readFile(resource);
        }
        async writeFile(resource, content, opts) {
            return this.provider.writeFile(resource, content, opts);
        }
        async delete(resource, opts) {
            return this.provider.delete(resource, opts);
        }
        mkdir(_resource) {
            throw new Error("not implemented");
        }
        async readdir(resource) {
            return this.provider.readDirectory(resource);
        }
        async rename(resource, target, opts) {
            return this.provider.rename(resource, target, opts);
        }
        async copy(resource, target, opts) {
            return this.provider.copy(resource, target, opts);
        }
        open(_resource, _opts) {
            throw new Error("not implemented");
        }
        close(_fd) {
            throw new Error("not implemented");
        }
        read(_fd, _pos, _data, _offset, _length) {
            throw new Error("not implemented");
        }
        write(_fd, _pos, _data, _offset, _length) {
            throw new Error("not implemented");
        }
    }
    class TreeViewDataProvider {
        constructor(provider) {
            this.provider = provider;
            this.root = Symbol("root");
            this.values = new Map();
            this.children = new Map();
        }
        async getChildren(item) {
            const value = item && this.itemToValue(item);
            const children = await Promise.all((await this.provider.getChildren(value) || [])
                .map(async (childValue) => {
                const treeItem = await this.provider.getTreeItem(childValue);
                const handle = this.createHandle(treeItem);
                this.values.set(handle, childValue);
                return {
                    handle,
                    collapsibleState: views_1.TreeItemCollapsibleState.Collapsed,
                };
            }));
            this.clear(value || this.root, item);
            this.children.set(value || this.root, children);
            return children;
        }
        dispose() {
            throw new Error("not implemented");
        }
        itemToValue(item) {
            if (!this.values.has(item.handle)) {
                throw new Error(`No element found with handle ${item.handle}`);
            }
            return this.values.get(item.handle);
        }
        clear(value, item) {
            if (this.children.has(value)) {
                this.children.get(value).map((c) => this.clear(this.itemToValue(c), c));
                this.children.delete(value);
            }
            if (item) {
                this.values.delete(item.handle);
            }
        }
        createHandle(item) {
            return item.id
                ? `coder-tree-item-id/${item.id}`
                : `coder-tree-item-uuid/${uuid_1.generateUuid()}`;
        }
    }
    class StatusBarEntry {
        constructor(statusbarService, alignmentOrOptions, priority) {
            this.statusbarService = statusbarService;
            this._id = StatusBarEntry.ID--;
            if (alignmentOrOptions && typeof alignmentOrOptions !== "number") {
                this.statusId = alignmentOrOptions.id;
                this.statusName = alignmentOrOptions.name;
                this.entry = {
                    alignment: alignmentOrOptions.alignment === extHostTypes.StatusBarAlignment.Right
                        ? 1 /* RIGHT */ : 0 /* LEFT */,
                    priority,
                    text: "",
                };
            }
            else {
                this.statusId = "web-api";
                this.statusName = "Web API";
                this.entry = {
                    alignment: alignmentOrOptions === extHostTypes.StatusBarAlignment.Right
                        ? 1 /* RIGHT */ : 0 /* LEFT */,
                    priority,
                    text: "",
                };
            }
        }
        get alignment() {
            return this.entry.alignment === 1 /* RIGHT */
                ? extHostTypes.StatusBarAlignment.Right : extHostTypes.StatusBarAlignment.Left;
        }
        get id() { return this._id; }
        get priority() { return this.entry.priority; }
        get text() { return this.entry.text; }
        get tooltip() { return this.entry.tooltip; }
        get color() { return this.entry.color; }
        get command() { return this.entry.command; }
        set text(text) { this.update({ text }); }
        set tooltip(tooltip) { this.update({ tooltip }); }
        set color(color) { this.update({ color }); }
        set command(command) { this.update({ command }); }
        show() {
            this.visible = true;
            this.update();
        }
        hide() {
            clearTimeout(this.timeout);
            this.visible = false;
            if (this.accessor) {
                this.accessor.dispose();
                this.accessor = undefined;
            }
        }
        update(values) {
            this.entry = Object.assign(Object.assign({}, this.entry), values);
            if (this.disposed || !this.visible) {
                return;
            }
            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => {
                if (!this.accessor) {
                    this.accessor = this.statusbarService.addEntry(this.entry, this.statusId, this.statusName, this.entry.alignment, this.priority);
                }
                else {
                    this.accessor.update(this.entry);
                }
            }, 0);
        }
        dispose() {
            this.hide();
            this.disposed = true;
        }
    }
    StatusBarEntry.ID = 0;
});
//# sourceMappingURL=api.js.map