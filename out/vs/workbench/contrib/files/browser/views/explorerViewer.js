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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/glob", "vs/platform/progress/common/progress", "vs/platform/notification/common/notification", "vs/platform/files/common/files", "vs/workbench/services/layout/browser/layoutService", "vs/platform/workspace/common/workspace", "vs/base/common/lifecycle", "vs/platform/contextview/browser/contextView", "vs/platform/theme/common/themeService", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/files/common/files", "vs/base/common/resources", "vs/base/browser/ui/inputbox/inputBox", "vs/nls", "vs/platform/theme/common/styler", "vs/base/common/functional", "vs/base/common/objects", "vs/base/common/path", "vs/workbench/contrib/files/common/explorerModel", "vs/base/common/comparers", "vs/workbench/browser/dnd", "vs/platform/instantiation/common/instantiation", "vs/base/browser/dnd", "vs/base/common/network", "vs/base/browser/ui/list/listView", "vs/base/common/platform", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/host/browser/host", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/base/common/async", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/files/browser/fileActions", "vs/base/common/filters", "vs/base/common/event"], function (require, exports, DOM, glob, progress_1, notification_1, files_1, layoutService_1, workspace_1, lifecycle_1, contextView_1, themeService_1, configuration_1, files_2, resources_1, inputBox_1, nls_1, styler_1, functional_1, objects_1, path, explorerModel_1, comparers_1, dnd_1, instantiation_1, dnd_2, network_1, listView_1, platform_1, dialogs_1, textfiles_1, host_1, workspaceEditing_1, async_1, editorService_1, fileActions_1, filters_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExplorerDelegate {
        getHeight(element) {
            return ExplorerDelegate.ITEM_HEIGHT;
        }
        getTemplateId(element) {
            return FilesRenderer.ID;
        }
    }
    exports.ExplorerDelegate = ExplorerDelegate;
    ExplorerDelegate.ITEM_HEIGHT = 22;
    exports.explorerRootErrorEmitter = new event_1.Emitter();
    let ExplorerDataSource = class ExplorerDataSource {
        constructor(progressService, notificationService, layoutService, fileService, explorerService, contextService) {
            this.progressService = progressService;
            this.notificationService = notificationService;
            this.layoutService = layoutService;
            this.fileService = fileService;
            this.explorerService = explorerService;
            this.contextService = contextService;
        }
        hasChildren(element) {
            return Array.isArray(element) || element.isDirectory;
        }
        getChildren(element) {
            if (Array.isArray(element)) {
                return Promise.resolve(element);
            }
            const promise = element.fetchChildren(this.fileService, this.explorerService).then(undefined, e => {
                if (element instanceof explorerModel_1.ExplorerItem && element.isRoot) {
                    if (this.contextService.getWorkbenchState() === 2 /* FOLDER */) {
                        // Single folder create a dummy explorer item to show error
                        const placeholder = new explorerModel_1.ExplorerItem(element.resource, undefined, false);
                        placeholder.isError = true;
                        return [placeholder];
                    }
                    else {
                        exports.explorerRootErrorEmitter.fire(element.resource);
                    }
                }
                else {
                    // Do not show error for roots since we already use an explorer decoration to notify user
                    this.notificationService.error(e);
                }
                return []; // we could not resolve any children because of an error
            });
            this.progressService.withProgress({
                location: 1 /* Explorer */,
                delay: this.layoutService.isRestored() ? 800 : 1200 // less ugly initial startup
            }, _progress => promise);
            return promise;
        }
    };
    ExplorerDataSource = __decorate([
        __param(0, progress_1.IProgressService),
        __param(1, notification_1.INotificationService),
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, files_1.IFileService),
        __param(4, files_2.IExplorerService),
        __param(5, workspace_1.IWorkspaceContextService)
    ], ExplorerDataSource);
    exports.ExplorerDataSource = ExplorerDataSource;
    let FilesRenderer = class FilesRenderer {
        constructor(labels, updateWidth, contextViewService, themeService, configurationService, explorerService) {
            this.labels = labels;
            this.updateWidth = updateWidth;
            this.contextViewService = contextViewService;
            this.themeService = themeService;
            this.configurationService = configurationService;
            this.explorerService = explorerService;
            this.config = this.configurationService.getValue();
            this.configListener = this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('explorer')) {
                    this.config = this.configurationService.getValue();
                }
            });
        }
        get templateId() {
            return FilesRenderer.ID;
        }
        renderTemplate(container) {
            const elementDisposable = lifecycle_1.Disposable.None;
            const label = this.labels.create(container, { supportHighlights: true });
            return { elementDisposable, label, container };
        }
        renderElement(node, index, templateData) {
            templateData.elementDisposable.dispose();
            const stat = node.element;
            const editableData = this.explorerService.getEditableData(stat);
            // File Label
            if (!editableData) {
                templateData.label.element.style.display = 'flex';
                const extraClasses = ['explorer-item'];
                if (this.explorerService.isCut(stat)) {
                    extraClasses.push('cut');
                }
                templateData.label.setFile(stat.resource, {
                    hidePath: true,
                    fileKind: stat.isRoot ? files_1.FileKind.ROOT_FOLDER : stat.isDirectory ? files_1.FileKind.FOLDER : files_1.FileKind.FILE,
                    extraClasses,
                    fileDecorations: this.config.explorer.decorations,
                    matches: filters_1.createMatches(node.filterData)
                });
                templateData.elementDisposable = templateData.label.onDidRender(() => {
                    try {
                        this.updateWidth(stat);
                    }
                    catch (e) {
                        // noop since the element might no longer be in the tree, no update of width necessery
                    }
                });
            }
            // Input Box
            else {
                templateData.label.element.style.display = 'none';
                templateData.elementDisposable = this.renderInputBox(templateData.container, stat, editableData);
            }
        }
        renderInputBox(container, stat, editableData) {
            // Use a file label only for the icon next to the input box
            const label = this.labels.create(container);
            const extraClasses = ['explorer-item', 'explorer-item-edited'];
            const fileKind = stat.isRoot ? files_1.FileKind.ROOT_FOLDER : stat.isDirectory ? files_1.FileKind.FOLDER : files_1.FileKind.FILE;
            const labelOptions = { hidePath: true, hideLabel: true, fileKind, extraClasses };
            const parent = stat.name ? resources_1.dirname(stat.resource) : stat.resource;
            const value = stat.name || '';
            label.setFile(resources_1.joinPath(parent, value || ' '), labelOptions); // Use icon for ' ' if name is empty.
            // Input field for name
            const inputBox = new inputBox_1.InputBox(label.element, this.contextViewService, {
                validationOptions: {
                    validation: (value) => {
                        const content = editableData.validationMessage(value);
                        if (!content) {
                            return null;
                        }
                        return {
                            content,
                            formatContent: true,
                            type: 3 /* ERROR */
                        };
                    }
                },
                ariaLabel: nls_1.localize('fileInputAriaLabel', "Type file name. Press Enter to confirm or Escape to cancel.")
            });
            const styler = styler_1.attachInputBoxStyler(inputBox, this.themeService);
            inputBox.onDidChange(value => {
                label.setFile(resources_1.joinPath(parent, value || ' '), labelOptions); // update label icon while typing!
            });
            const lastDot = value.lastIndexOf('.');
            inputBox.value = value;
            inputBox.focus();
            inputBox.select({ start: 0, end: lastDot > 0 && !stat.isDirectory ? lastDot : value.length });
            const done = functional_1.once((success, finishEditing) => {
                label.element.style.display = 'none';
                const value = inputBox.value;
                lifecycle_1.dispose(toDispose);
                label.element.remove();
                if (finishEditing) {
                    editableData.onFinish(value, success);
                }
            });
            const toDispose = [
                inputBox,
                DOM.addStandardDisposableListener(inputBox.inputElement, DOM.EventType.KEY_DOWN, (e) => {
                    if (e.equals(3 /* Enter */)) {
                        if (inputBox.validate()) {
                            done(true, true);
                        }
                    }
                    else if (e.equals(9 /* Escape */)) {
                        done(false, true);
                    }
                }),
                DOM.addDisposableListener(inputBox.inputElement, DOM.EventType.BLUR, () => {
                    done(inputBox.isInputValid(), true);
                }),
                label,
                styler
            ];
            return lifecycle_1.toDisposable(() => {
                done(false, false);
            });
        }
        disposeElement(element, index, templateData) {
            templateData.elementDisposable.dispose();
        }
        disposeTemplate(templateData) {
            templateData.elementDisposable.dispose();
            templateData.label.dispose();
        }
        dispose() {
            this.configListener.dispose();
        }
    };
    FilesRenderer.ID = 'file';
    FilesRenderer = __decorate([
        __param(2, contextView_1.IContextViewService),
        __param(3, themeService_1.IThemeService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, files_2.IExplorerService)
    ], FilesRenderer);
    exports.FilesRenderer = FilesRenderer;
    class ExplorerAccessibilityProvider {
        getAriaLabel(element) {
            return element.name;
        }
    }
    exports.ExplorerAccessibilityProvider = ExplorerAccessibilityProvider;
    let FilesFilter = class FilesFilter {
        constructor(contextService, configurationService, explorerService) {
            this.contextService = contextService;
            this.configurationService = configurationService;
            this.explorerService = explorerService;
            this.hiddenExpressionPerRoot = new Map();
            this.workspaceFolderChangeListener = this.contextService.onDidChangeWorkspaceFolders(() => this.updateConfiguration());
        }
        updateConfiguration() {
            let needsRefresh = false;
            this.contextService.getWorkspace().folders.forEach(folder => {
                const configuration = this.configurationService.getValue({ resource: folder.uri });
                const excludesConfig = (configuration && configuration.files && configuration.files.exclude) || Object.create(null);
                if (!needsRefresh) {
                    const cached = this.hiddenExpressionPerRoot.get(folder.uri.toString());
                    needsRefresh = !cached || !objects_1.equals(cached.original, excludesConfig);
                }
                const excludesConfigCopy = objects_1.deepClone(excludesConfig); // do not keep the config, as it gets mutated under our hoods
                this.hiddenExpressionPerRoot.set(folder.uri.toString(), { original: excludesConfigCopy, parsed: glob.parse(excludesConfigCopy) });
            });
            return needsRefresh;
        }
        filter(stat, parentVisibility) {
            if (parentVisibility === 0 /* Hidden */) {
                return false;
            }
            if (this.explorerService.getEditableData(stat) || stat.isRoot) {
                return true; // always visible
            }
            // Hide those that match Hidden Patterns
            const cached = this.hiddenExpressionPerRoot.get(stat.root.resource.toString());
            if (cached && cached.parsed(path.relative(stat.root.resource.path, stat.resource.path), stat.name, name => !!(stat.parent && stat.parent.getChild(name)))) {
                return false; // hidden through pattern
            }
            return true;
        }
        dispose() {
            lifecycle_1.dispose(this.workspaceFolderChangeListener);
        }
    };
    FilesFilter = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, files_2.IExplorerService)
    ], FilesFilter);
    exports.FilesFilter = FilesFilter;
    // // Explorer Sorter
    let FileSorter = class FileSorter {
        constructor(explorerService, contextService) {
            this.explorerService = explorerService;
            this.contextService = contextService;
        }
        compare(statA, statB) {
            // Do not sort roots
            if (statA.isRoot) {
                if (statB.isRoot) {
                    const workspaceA = this.contextService.getWorkspaceFolder(statA.resource);
                    const workspaceB = this.contextService.getWorkspaceFolder(statB.resource);
                    return workspaceA && workspaceB ? (workspaceA.index - workspaceB.index) : -1;
                }
                return -1;
            }
            if (statB.isRoot) {
                return 1;
            }
            const sortOrder = this.explorerService.sortOrder;
            // Sort Directories
            switch (sortOrder) {
                case 'type':
                    if (statA.isDirectory && !statB.isDirectory) {
                        return -1;
                    }
                    if (statB.isDirectory && !statA.isDirectory) {
                        return 1;
                    }
                    if (statA.isDirectory && statB.isDirectory) {
                        return comparers_1.compareFileNames(statA.name, statB.name);
                    }
                    break;
                case 'filesFirst':
                    if (statA.isDirectory && !statB.isDirectory) {
                        return 1;
                    }
                    if (statB.isDirectory && !statA.isDirectory) {
                        return -1;
                    }
                    break;
                case 'mixed':
                    break; // not sorting when "mixed" is on
                default: /* 'default', 'modified' */
                    if (statA.isDirectory && !statB.isDirectory) {
                        return -1;
                    }
                    if (statB.isDirectory && !statA.isDirectory) {
                        return 1;
                    }
                    break;
            }
            // Sort Files
            switch (sortOrder) {
                case 'type':
                    return comparers_1.compareFileExtensions(statA.name, statB.name);
                case 'modified':
                    if (statA.mtime !== statB.mtime) {
                        return (statA.mtime && statB.mtime && statA.mtime < statB.mtime) ? 1 : -1;
                    }
                    return comparers_1.compareFileNames(statA.name, statB.name);
                default: /* 'default', 'mixed', 'filesFirst' */
                    return comparers_1.compareFileNames(statA.name, statB.name);
            }
        }
    };
    FileSorter = __decorate([
        __param(0, files_2.IExplorerService),
        __param(1, workspace_1.IWorkspaceContextService)
    ], FileSorter);
    exports.FileSorter = FileSorter;
    let FileDragAndDrop = class FileDragAndDrop {
        constructor(notificationService, explorerService, editorService, dialogService, contextService, fileService, configurationService, instantiationService, textFileService, hostService, workspaceEditingService) {
            this.notificationService = notificationService;
            this.explorerService = explorerService;
            this.editorService = editorService;
            this.dialogService = dialogService;
            this.contextService = contextService;
            this.fileService = fileService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.textFileService = textFileService;
            this.hostService = hostService;
            this.workspaceEditingService = workspaceEditingService;
            this.dropEnabled = false;
            this.toDispose = [];
            const updateDropEnablement = () => {
                this.dropEnabled = this.configurationService.getValue('explorer.enableDragAndDrop');
            };
            updateDropEnablement();
            this.toDispose.push(this.configurationService.onDidChangeConfiguration((e) => updateDropEnablement()));
        }
        onDragOver(data, target, targetIndex, originalEvent) {
            if (!this.dropEnabled) {
                return false;
            }
            const isCopy = originalEvent && ((originalEvent.ctrlKey && !platform_1.isMacintosh) || (originalEvent.altKey && platform_1.isMacintosh));
            const fromDesktop = data instanceof listView_1.DesktopDragAndDropData;
            const effect = (fromDesktop || isCopy) ? 0 /* Copy */ : 1 /* Move */;
            // Desktop DND
            if (fromDesktop && originalEvent.dataTransfer) {
                const types = originalEvent.dataTransfer.types;
                const typesArray = [];
                for (let i = 0; i < types.length; i++) {
                    typesArray.push(types[i].toLowerCase()); // somehow the types are lowercase
                }
                if (typesArray.indexOf(dnd_2.DataTransfers.FILES.toLowerCase()) === -1 && typesArray.indexOf(dnd_1.CodeDataTransfers.FILES.toLowerCase()) === -1) {
                    return false;
                }
            }
            // Other-Tree DND
            else if (data instanceof listView_1.ExternalElementsDragAndDropData) {
                return false;
            }
            // In-Explorer DND
            else {
                const items = data.elements;
                if (!target) {
                    // Dropping onto the empty area. Do not accept if items dragged are already
                    // children of the root unless we are copying the file
                    if (!isCopy && items.every(i => !!i.parent && i.parent.isRoot)) {
                        return false;
                    }
                    return { accept: true, bubble: 0 /* Down */, effect, autoExpand: false };
                }
                if (!Array.isArray(items)) {
                    return false;
                }
                if (items.some((source) => {
                    if (source.isRoot && target instanceof explorerModel_1.ExplorerItem && !target.isRoot) {
                        return true; // Root folder can not be moved to a non root file stat.
                    }
                    if (source.resource.toString() === target.resource.toString()) {
                        return true; // Can not move anything onto itself
                    }
                    if (source.isRoot && target instanceof explorerModel_1.ExplorerItem && target.isRoot) {
                        // Disable moving workspace roots in one another
                        return false;
                    }
                    if (!isCopy && resources_1.dirname(source.resource).toString() === target.resource.toString()) {
                        return true; // Can not move a file to the same parent unless we copy
                    }
                    if (resources_1.isEqualOrParent(target.resource, source.resource)) {
                        return true; // Can not move a parent folder into one of its children
                    }
                    return false;
                })) {
                    return false;
                }
            }
            // All (target = model)
            if (!target) {
                return { accept: true, bubble: 0 /* Down */, effect };
            }
            // All (target = file/folder)
            else {
                if (target.isDirectory) {
                    if (target.isReadonly) {
                        return false;
                    }
                    return { accept: true, bubble: 0 /* Down */, effect, autoExpand: true };
                }
                if (this.contextService.getWorkspace().folders.every(folder => folder.uri.toString() !== target.resource.toString())) {
                    return { accept: true, bubble: 1 /* Up */, effect };
                }
            }
            return false;
        }
        getDragURI(element) {
            if (this.explorerService.isEditable(element)) {
                return null;
            }
            return element.resource.toString();
        }
        getDragLabel(elements) {
            if (elements.length > 1) {
                return String(elements.length);
            }
            return elements[0].name;
        }
        onDragStart(data, originalEvent) {
            const items = data.elements;
            if (items && items.length && originalEvent.dataTransfer) {
                // Apply some datatransfer types to allow for dragging the element outside of the application
                this.instantiationService.invokeFunction(dnd_1.fillResourceDataTransfers, items, originalEvent);
                // The only custom data transfer we set from the explorer is a file transfer
                // to be able to DND between multiple code file explorers across windows
                const fileResources = items.filter(s => !s.isDirectory && s.resource.scheme === network_1.Schemas.file).map(r => r.resource.fsPath);
                if (fileResources.length) {
                    originalEvent.dataTransfer.setData(dnd_1.CodeDataTransfers.FILES, JSON.stringify(fileResources));
                }
            }
        }
        drop(data, target, targetIndex, originalEvent) {
            // Find parent to add to
            if (!target) {
                target = this.explorerService.roots[this.explorerService.roots.length - 1];
            }
            if (!target.isDirectory && target.parent) {
                target = target.parent;
            }
            if (target.isReadonly) {
                return;
            }
            // Desktop DND (Import file)
            if (data instanceof listView_1.DesktopDragAndDropData) {
                this.handleExternalDrop(data, target, originalEvent).then(undefined, e => this.notificationService.warn(e));
            }
            // In-Explorer DND (Move/Copy file)
            else {
                this.handleExplorerDrop(data, target, originalEvent).then(undefined, e => this.notificationService.warn(e));
            }
        }
        async handleExternalDrop(data, target, originalEvent) {
            const droppedResources = dnd_1.extractResources(originalEvent, true);
            // Check for dropped external files to be folders
            const result = await this.fileService.resolveAll(droppedResources);
            // Pass focus to window
            this.hostService.focus();
            // Handle folders by adding to workspace if we are in workspace context
            const folders = result.filter(r => r.success && r.stat && r.stat.isDirectory).map(result => ({ uri: result.stat.resource }));
            if (folders.length > 0) {
                const buttons = [
                    folders.length > 1 ? nls_1.localize('copyFolders', "&&Copy Folders") : nls_1.localize('copyFolder', "&&Copy Folder"),
                    nls_1.localize('cancel', "Cancel")
                ];
                const workspaceFolderSchemas = this.contextService.getWorkspace().folders.map(f => f.uri.scheme);
                let message = folders.length > 1 ? nls_1.localize('copyfolders', "Are you sure to want to copy folders?") : nls_1.localize('copyfolder', "Are you sure to want to copy '{0}'?", resources_1.basename(folders[0].uri));
                if (folders.some(f => workspaceFolderSchemas.indexOf(f.uri.scheme) >= 0)) {
                    // We only allow to add a folder to the workspace if there is already a workspace folder with that scheme
                    buttons.unshift(folders.length > 1 ? nls_1.localize('addFolders', "&&Add Folders to Workspace") : nls_1.localize('addFolder', "&&Add Folder to Workspace"));
                    message = folders.length > 1 ? nls_1.localize('dropFolders', "Do you want to copy the folders or add the folders to the workspace?")
                        : nls_1.localize('dropFolder', "Do you want to copy '{0}' or add '{0}' as a folder to the workspace?", resources_1.basename(folders[0].uri));
                }
                const { choice } = await this.dialogService.show(notification_1.Severity.Info, message, buttons);
                if (choice === buttons.length - 3) {
                    return this.workspaceEditingService.addFolders(folders);
                }
                if (choice === buttons.length - 2) {
                    return this.addResources(target, droppedResources.map(res => res.resource));
                }
                return undefined;
            }
            // Handle dropped files (only support FileStat as target)
            else if (target instanceof explorerModel_1.ExplorerItem) {
                return this.addResources(target, droppedResources.map(res => res.resource));
            }
            return undefined;
        }
        addResources(target, resources) {
            if (resources && resources.length > 0) {
                // Resolve target to check for name collisions and ask user
                return this.fileService.resolve(target.resource).then(targetStat => {
                    // Check for name collisions
                    const targetNames = new Set();
                    if (targetStat.children) {
                        const ignoreCase = resources_1.hasToIgnoreCase(target.resource);
                        targetStat.children.forEach(child => {
                            targetNames.add(ignoreCase ? child.name : child.name.toLowerCase());
                        });
                    }
                    let overwritePromise = Promise.resolve({ confirmed: true });
                    if (resources.some(resource => {
                        return targetNames.has(!resources_1.hasToIgnoreCase(resource) ? resources_1.basename(resource) : resources_1.basename(resource).toLowerCase());
                    })) {
                        const confirm = {
                            message: nls_1.localize('confirmOverwrite', "A file or folder with the same name already exists in the destination folder. Do you want to replace it?"),
                            detail: nls_1.localize('irreversible', "This action is irreversible!"),
                            primaryButton: nls_1.localize({ key: 'replaceButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Replace"),
                            type: 'warning'
                        };
                        overwritePromise = this.dialogService.confirm(confirm);
                    }
                    return overwritePromise.then(res => {
                        if (!res.confirmed) {
                            return [];
                        }
                        // Run add in sequence
                        const addPromisesFactory = [];
                        resources.forEach(resource => {
                            addPromisesFactory.push(() => {
                                const sourceFile = resource;
                                const targetFile = resources_1.joinPath(target.resource, resources_1.basename(sourceFile));
                                // if the target exists and is dirty, make sure to revert it. otherwise the dirty contents
                                // of the target file would replace the contents of the added file. since we already
                                // confirmed the overwrite before, this is OK.
                                let revertPromise = Promise.resolve(null);
                                if (this.textFileService.isDirty(targetFile)) {
                                    revertPromise = this.textFileService.revertAll([targetFile], { soft: true });
                                }
                                return revertPromise.then(() => {
                                    const copyTarget = resources_1.joinPath(target.resource, resources_1.basename(sourceFile));
                                    return this.fileService.copy(sourceFile, copyTarget, true).then(stat => {
                                        // if we only add one file, just open it directly
                                        if (resources.length === 1 && !stat.isDirectory) {
                                            this.editorService.openEditor({ resource: stat.resource, options: { pinned: true } });
                                        }
                                    });
                                });
                            });
                        });
                        return async_1.sequence(addPromisesFactory);
                    });
                });
            }
            return Promise.resolve(undefined);
        }
        handleExplorerDrop(data, target, originalEvent) {
            const elementsData = data.elements;
            const items = resources_1.distinctParents(elementsData, s => s.resource);
            const isCopy = (originalEvent.ctrlKey && !platform_1.isMacintosh) || (originalEvent.altKey && platform_1.isMacintosh);
            let confirmPromise;
            // Handle confirm setting
            const confirmDragAndDrop = !isCopy && this.configurationService.getValue(FileDragAndDrop.CONFIRM_DND_SETTING_KEY);
            if (confirmDragAndDrop) {
                confirmPromise = this.dialogService.confirm({
                    message: items.length > 1 && items.every(s => s.isRoot) ? nls_1.localize('confirmRootsMove', "Are you sure you want to change the order of multiple root folders in your workspace?")
                        : items.length > 1 ? dialogs_1.getConfirmMessage(nls_1.localize('confirmMultiMove', "Are you sure you want to move the following {0} files?", items.length), items.map(s => s.resource))
                            : items[0].isRoot ? nls_1.localize('confirmRootMove', "Are you sure you want to change the order of root folder '{0}' in your workspace?", items[0].name)
                                : nls_1.localize('confirmMove', "Are you sure you want to move '{0}'?", items[0].name),
                    checkbox: {
                        label: nls_1.localize('doNotAskAgain', "Do not ask me again")
                    },
                    type: 'question',
                    primaryButton: nls_1.localize({ key: 'moveButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Move")
                });
            }
            else {
                confirmPromise = Promise.resolve({ confirmed: true });
            }
            return confirmPromise.then(res => {
                // Check for confirmation checkbox
                let updateConfirmSettingsPromise = Promise.resolve(undefined);
                if (res.confirmed && res.checkboxChecked === true) {
                    updateConfirmSettingsPromise = this.configurationService.updateValue(FileDragAndDrop.CONFIRM_DND_SETTING_KEY, false, 1 /* USER */);
                }
                return updateConfirmSettingsPromise.then(() => {
                    if (res.confirmed) {
                        const rootDropPromise = this.doHandleRootDrop(items.filter(s => s.isRoot), target);
                        return Promise.all(items.filter(s => !s.isRoot).map(source => this.doHandleExplorerDrop(source, target, isCopy)).concat(rootDropPromise)).then(() => undefined);
                    }
                    return Promise.resolve(undefined);
                });
            });
        }
        doHandleRootDrop(roots, target) {
            if (roots.length === 0) {
                return Promise.resolve(undefined);
            }
            const folders = this.contextService.getWorkspace().folders;
            let targetIndex;
            const workspaceCreationData = [];
            const rootsToMove = [];
            for (let index = 0; index < folders.length; index++) {
                const data = {
                    uri: folders[index].uri,
                    name: folders[index].name
                };
                if (target instanceof explorerModel_1.ExplorerItem && folders[index].uri.toString() === target.resource.toString()) {
                    targetIndex = index;
                }
                if (roots.every(r => r.resource.toString() !== folders[index].uri.toString())) {
                    workspaceCreationData.push(data);
                }
                else {
                    rootsToMove.push(data);
                }
            }
            if (targetIndex === undefined) {
                targetIndex = workspaceCreationData.length;
            }
            workspaceCreationData.splice(targetIndex, 0, ...rootsToMove);
            return this.workspaceEditingService.updateFolders(0, workspaceCreationData.length, workspaceCreationData);
        }
        doHandleExplorerDrop(source, target, isCopy) {
            // Reuse duplicate action if user copies
            if (isCopy) {
                const incrementalNaming = this.configurationService.getValue().explorer.incrementalNaming;
                return this.fileService.copy(source.resource, fileActions_1.findValidPasteFileTarget(target, { resource: source.resource, isDirectory: source.isDirectory, allowOverwrite: false }, incrementalNaming)).then(stat => {
                    if (!stat.isDirectory) {
                        return this.editorService.openEditor({ resource: stat.resource, options: { pinned: true } }).then(() => undefined);
                    }
                    return undefined;
                });
            }
            // Otherwise move
            const targetResource = resources_1.joinPath(target.resource, source.name);
            if (source.isReadonly) {
                // Do not allow moving readonly items
                return Promise.resolve();
            }
            return this.textFileService.move(source.resource, targetResource).then(undefined, error => {
                // Conflict
                if (error.fileOperationResult === 4 /* FILE_MOVE_CONFLICT */) {
                    const confirm = {
                        message: nls_1.localize('confirmOverwriteMessage', "'{0}' already exists in the destination folder. Do you want to replace it?", source.name),
                        detail: nls_1.localize('irreversible', "This action is irreversible!"),
                        primaryButton: nls_1.localize({ key: 'replaceButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Replace"),
                        type: 'warning'
                    };
                    // Move with overwrite if the user confirms
                    return this.dialogService.confirm(confirm).then(res => {
                        if (res.confirmed) {
                            return this.textFileService.move(source.resource, targetResource, true /* overwrite */).then(undefined, error => this.notificationService.error(error));
                        }
                        return undefined;
                    });
                }
                // Any other error
                else {
                    this.notificationService.error(error);
                }
                return undefined;
            });
        }
    };
    FileDragAndDrop.CONFIRM_DND_SETTING_KEY = 'explorer.confirmDragAndDrop';
    FileDragAndDrop = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, files_2.IExplorerService),
        __param(2, editorService_1.IEditorService),
        __param(3, dialogs_1.IDialogService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, files_1.IFileService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, textfiles_1.ITextFileService),
        __param(9, host_1.IHostService),
        __param(10, workspaceEditing_1.IWorkspaceEditingService)
    ], FileDragAndDrop);
    exports.FileDragAndDrop = FileDragAndDrop;
});
//# sourceMappingURL=explorerViewer.js.map