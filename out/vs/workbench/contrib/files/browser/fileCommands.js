/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/common/editor", "vs/platform/windows/common/windows", "vs/workbench/services/host/browser/host", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/viewlet/browser/viewlet", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/files/common/files", "vs/platform/clipboard/common/clipboardService", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/errorMessage", "vs/platform/list/browser/listService", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/files/common/files", "vs/workbench/services/untitled/common/untitledEditorService", "vs/editor/browser/editorBrowser", "vs/platform/keybinding/common/keybindingsRegistry", "vs/base/common/keyCodes", "vs/base/common/platform", "vs/editor/common/services/resolverService", "vs/workbench/contrib/files/browser/files", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/workbench/browser/parts/editor/editorCommands", "vs/base/common/network", "vs/platform/notification/common/notification", "vs/editor/common/editorContextKeys", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/label/common/label", "vs/base/common/resources", "vs/base/common/lifecycle", "vs/workbench/services/environment/common/environmentService", "vs/platform/environment/common/environment", "vs/platform/workspaces/common/workspaces", "vs/base/common/types"], function (require, exports, nls, editor_1, windows_1, host_1, instantiation_1, viewlet_1, workspace_1, files_1, clipboardService_1, textfiles_1, errorMessage_1, listService_1, commands_1, contextkey_1, files_2, untitledEditorService_1, editorBrowser_1, keybindingsRegistry_1, keyCodes_1, platform_1, resolverService_1, files_3, workspaceEditing_1, editorCommands_1, network_1, notification_1, editorContextKeys_1, editorService_1, editorGroupsService_1, label_1, resources_1, lifecycle_1, environmentService_1, environment_1, workspaces_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Commands
    exports.REVEAL_IN_EXPLORER_COMMAND_ID = 'revealInExplorer';
    exports.REVERT_FILE_COMMAND_ID = 'workbench.action.files.revert';
    exports.OPEN_TO_SIDE_COMMAND_ID = 'explorer.openToSide';
    exports.SELECT_FOR_COMPARE_COMMAND_ID = 'selectForCompare';
    exports.COMPARE_SELECTED_COMMAND_ID = 'compareSelected';
    exports.COMPARE_RESOURCE_COMMAND_ID = 'compareFiles';
    exports.COMPARE_WITH_SAVED_COMMAND_ID = 'workbench.files.action.compareWithSaved';
    exports.COPY_PATH_COMMAND_ID = 'copyFilePath';
    exports.COPY_RELATIVE_PATH_COMMAND_ID = 'copyRelativeFilePath';
    exports.SAVE_FILE_AS_COMMAND_ID = 'workbench.action.files.saveAs';
    exports.SAVE_FILE_AS_LABEL = nls.localize('saveAs', "Save As...");
    exports.SAVE_FILE_COMMAND_ID = 'workbench.action.files.save';
    exports.SAVE_FILE_LABEL = nls.localize('save', "Save");
    exports.SAVE_FILE_WITHOUT_FORMATTING_COMMAND_ID = 'workbench.action.files.saveWithoutFormatting';
    exports.SAVE_FILE_WITHOUT_FORMATTING_LABEL = nls.localize('saveWithoutFormatting', "Save without Formatting");
    exports.SAVE_ALL_COMMAND_ID = 'saveAll';
    exports.SAVE_ALL_LABEL = nls.localize('saveAll', "Save All");
    exports.SAVE_ALL_IN_GROUP_COMMAND_ID = 'workbench.files.action.saveAllInGroup';
    exports.SAVE_FILES_COMMAND_ID = 'workbench.action.files.saveFiles';
    exports.OpenEditorsGroupContext = new contextkey_1.RawContextKey('groupFocusedInOpenEditors', false);
    exports.DirtyEditorContext = new contextkey_1.RawContextKey('dirtyEditor', false);
    exports.ResourceSelectedForCompareContext = new contextkey_1.RawContextKey('resourceSelectedForCompare', false);
    exports.REMOVE_ROOT_FOLDER_COMMAND_ID = 'removeRootFolder';
    exports.REMOVE_ROOT_FOLDER_LABEL = nls.localize('removeFolderFromWorkspace', "Remove Folder from Workspace");
    exports.openWindowCommand = (accessor, toOpen, options) => {
        if (Array.isArray(toOpen)) {
            const hostService = accessor.get(host_1.IHostService);
            const environmentService = accessor.get(environment_1.IEnvironmentService);
            // rewrite untitled: workspace URIs to the absolute path on disk
            toOpen = toOpen.map(openable => {
                if (windows_1.isWorkspaceToOpen(openable) && openable.workspaceUri.scheme === network_1.Schemas.untitled) {
                    return {
                        workspaceUri: resources_1.joinPath(environmentService.untitledWorkspacesHome, openable.workspaceUri.path, workspaces_1.UNTITLED_WORKSPACE_NAME)
                    };
                }
                return openable;
            });
            hostService.openWindow(toOpen, options);
        }
    };
    exports.newWindowCommand = (accessor, options) => {
        const hostService = accessor.get(host_1.IHostService);
        hostService.openWindow(options);
    };
    async function save(resource, isSaveAs, options, editorService, fileService, untitledEditorService, textFileService, editorGroupService, environmentService) {
        if (!resource || (!fileService.canHandleResource(resource) && resource.scheme !== network_1.Schemas.untitled)) {
            return; // save is not supported
        }
        // Save As (or Save untitled with associated path)
        if (isSaveAs || resource.scheme === network_1.Schemas.untitled) {
            return doSaveAs(resource, isSaveAs, options, editorService, fileService, untitledEditorService, textFileService, editorGroupService, environmentService);
        }
        // Save
        return doSave(resource, options, editorService, textFileService);
    }
    async function doSaveAs(resource, isSaveAs, options, editorService, fileService, untitledEditorService, textFileService, editorGroupService, environmentService) {
        let viewStateOfSource = null;
        const activeTextEditorWidget = editorBrowser_1.getCodeEditor(editorService.activeTextEditorWidget);
        if (activeTextEditorWidget) {
            const activeResource = editor_1.toResource(editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.MASTER });
            if (activeResource && (fileService.canHandleResource(activeResource) || resource.scheme === network_1.Schemas.untitled) && resources_1.isEqual(activeResource, resource)) {
                viewStateOfSource = activeTextEditorWidget.saveViewState();
            }
        }
        // Special case: an untitled file with associated path gets saved directly unless "saveAs" is true
        let target;
        if (!isSaveAs && resource.scheme === network_1.Schemas.untitled && untitledEditorService.hasAssociatedFilePath(resource)) {
            const result = await textFileService.save(resource, options);
            if (result) {
                target = resources_1.toLocalResource(resource, environmentService.configuration.remoteAuthority);
            }
        }
        // Otherwise, really "Save As..."
        else {
            // Force a change to the file to trigger external watchers if any
            // fixes https://github.com/Microsoft/vscode/issues/59655
            options = ensureForcedSave(options);
            target = await textFileService.saveAs(resource, undefined, options);
        }
        if (!target || resources_1.isEqual(target, resource)) {
            return false; // save canceled or same resource used
        }
        const replacement = {
            resource: target,
            options: {
                pinned: true,
                viewState: viewStateOfSource || undefined
            }
        };
        await Promise.all(editorGroupService.groups.map(group => editorService.replaceEditors([{
                editor: { resource },
                replacement
            }], group)));
        return true;
    }
    async function doSave(resource, options, editorService, textFileService) {
        // Pin the active editor if we are saving it
        const activeControl = editorService.activeControl;
        const activeEditorResource = activeControl && activeControl.input && activeControl.input.getResource();
        if (activeControl && activeEditorResource && resources_1.isEqual(activeEditorResource, resource)) {
            activeControl.group.pinEditor(activeControl.input);
        }
        // Just save (force a change to the file to trigger external watchers if any)
        options = ensureForcedSave(options);
        return textFileService.save(resource, options);
    }
    function ensureForcedSave(options) {
        if (!options) {
            options = { force: true };
        }
        else {
            options.force = true;
        }
        return options;
    }
    async function saveAll(saveAllArguments, editorService, untitledEditorService, textFileService, editorGroupService) {
        // Store some properties per untitled file to restore later after save is completed
        const groupIdToUntitledResourceInput = new Map();
        editorGroupService.groups.forEach(group => {
            const activeEditorResource = group.activeEditor && group.activeEditor.getResource();
            group.editors.forEach(e => {
                const resource = e.getResource();
                if (resource && untitledEditorService.isDirty(resource)) {
                    if (!groupIdToUntitledResourceInput.has(group.id)) {
                        groupIdToUntitledResourceInput.set(group.id, []);
                    }
                    groupIdToUntitledResourceInput.get(group.id).push({
                        encoding: untitledEditorService.getEncoding(resource),
                        resource,
                        options: {
                            inactive: activeEditorResource ? !resources_1.isEqual(activeEditorResource, resource) : true,
                            pinned: true,
                            preserveFocus: true,
                            index: group.getIndexOfEditor(e)
                        }
                    });
                }
            });
        });
        // Save all
        const result = await textFileService.saveAll(saveAllArguments);
        // Update untitled resources to the saved ones, so we open the proper files
        groupIdToUntitledResourceInput.forEach((inputs, groupId) => {
            inputs.forEach(i => {
                const targetResult = result.results.filter(r => r.success && resources_1.isEqual(r.source, i.resource)).pop();
                if (targetResult && targetResult.target) {
                    i.resource = targetResult.target;
                }
            });
            editorService.openEditors(inputs, groupId);
        });
    }
    // Command registration
    commands_1.CommandsRegistry.registerCommand({
        id: exports.REVERT_FILE_COMMAND_ID,
        handler: async (accessor, resource) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const textFileService = accessor.get(textfiles_1.ITextFileService);
            const notificationService = accessor.get(notification_1.INotificationService);
            const resources = files_3.getMultiSelectedResources(resource, accessor.get(listService_1.IListService), editorService)
                .filter(resource => resource.scheme !== network_1.Schemas.untitled);
            if (resources.length) {
                try {
                    await textFileService.revertAll(resources, { force: true });
                }
                catch (error) {
                    notificationService.error(nls.localize('genericRevertError', "Failed to revert '{0}': {1}", resources.map(r => resources_1.basename(r)).join(', '), errorMessage_1.toErrorMessage(error, false)));
                }
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* WorkbenchContrib */,
        when: files_1.ExplorerFocusCondition,
        primary: 2048 /* CtrlCmd */ | 3 /* Enter */,
        mac: {
            primary: 256 /* WinCtrl */ | 3 /* Enter */
        },
        id: exports.OPEN_TO_SIDE_COMMAND_ID, handler: async (accessor, resource) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const listService = accessor.get(listService_1.IListService);
            const fileService = accessor.get(files_2.IFileService);
            const resources = files_3.getMultiSelectedResources(resource, listService, editorService);
            // Set side input
            if (resources.length) {
                const resolved = await fileService.resolveAll(resources.map(resource => ({ resource })));
                const editors = resolved.filter(r => r.stat && r.success && !r.stat.isDirectory).map(r => ({
                    resource: r.stat.resource
                }));
                await editorService.openEditors(editors, editorService_1.SIDE_GROUP);
            }
        }
    });
    const COMPARE_WITH_SAVED_SCHEMA = 'showModifications';
    let providerDisposables = [];
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.COMPARE_WITH_SAVED_COMMAND_ID,
        when: undefined,
        weight: 200 /* WorkbenchContrib */,
        primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 34 /* KEY_D */),
        handler: (accessor, resource) => {
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const textModelService = accessor.get(resolverService_1.ITextModelService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const fileService = accessor.get(files_2.IFileService);
            // Register provider at first as needed
            let registerEditorListener = false;
            if (providerDisposables.length === 0) {
                registerEditorListener = true;
                const provider = instantiationService.createInstance(files_1.TextFileContentProvider);
                providerDisposables.push(provider);
                providerDisposables.push(textModelService.registerTextModelContentProvider(COMPARE_WITH_SAVED_SCHEMA, provider));
            }
            // Open editor (only resources that can be handled by file service are supported)
            const uri = files_3.getResourceForCommand(resource, accessor.get(listService_1.IListService), editorService);
            if (uri && fileService.canHandleResource(uri)) {
                const name = resources_1.basename(uri);
                const editorLabel = nls.localize('modifiedLabel', "{0} (in file) ↔ {1}", name, name);
                files_1.TextFileContentProvider.open(uri, COMPARE_WITH_SAVED_SCHEMA, editorLabel, editorService).then(() => {
                    // Dispose once no more diff editor is opened with the scheme
                    if (registerEditorListener) {
                        providerDisposables.push(editorService.onDidVisibleEditorsChange(() => {
                            if (!editorService.editors.some(editor => !!editor_1.toResource(editor, { supportSideBySide: editor_1.SideBySideEditor.DETAILS, filterByScheme: COMPARE_WITH_SAVED_SCHEMA }))) {
                                providerDisposables = lifecycle_1.dispose(providerDisposables);
                            }
                        }));
                    }
                }, error => {
                    providerDisposables = lifecycle_1.dispose(providerDisposables);
                });
            }
            return Promise.resolve(true);
        }
    });
    let globalResourceToCompare;
    let resourceSelectedForCompareContext;
    commands_1.CommandsRegistry.registerCommand({
        id: exports.SELECT_FOR_COMPARE_COMMAND_ID,
        handler: (accessor, resource) => {
            const listService = accessor.get(listService_1.IListService);
            globalResourceToCompare = files_3.getResourceForCommand(resource, listService, accessor.get(editorService_1.IEditorService));
            if (!resourceSelectedForCompareContext) {
                resourceSelectedForCompareContext = exports.ResourceSelectedForCompareContext.bindTo(accessor.get(contextkey_1.IContextKeyService));
            }
            resourceSelectedForCompareContext.set(true);
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.COMPARE_SELECTED_COMMAND_ID,
        handler: (accessor, resource) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const resources = files_3.getMultiSelectedResources(resource, accessor.get(listService_1.IListService), editorService);
            if (resources.length === 2) {
                return editorService.openEditor({
                    leftResource: resources[0],
                    rightResource: resources[1]
                });
            }
            return Promise.resolve(true);
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.COMPARE_RESOURCE_COMMAND_ID,
        handler: (accessor, resource) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const listService = accessor.get(listService_1.IListService);
            const rightResource = files_3.getResourceForCommand(resource, listService, editorService);
            if (globalResourceToCompare && rightResource) {
                editorService.openEditor({
                    leftResource: globalResourceToCompare,
                    rightResource
                });
            }
        }
    });
    async function resourcesToClipboard(resources, relative, clipboardService, notificationService, labelService) {
        if (resources.length) {
            const lineDelimiter = platform_1.isWindows ? '\r\n' : '\n';
            const text = resources.map(resource => labelService.getUriLabel(resource, { relative, noPrefix: true }))
                .join(lineDelimiter);
            await clipboardService.writeText(text);
        }
        else {
            notificationService.info(nls.localize('openFileToCopy', "Open a file first to copy its path"));
        }
    }
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* WorkbenchContrib */,
        when: editorContextKeys_1.EditorContextKeys.focus.toNegated(),
        primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 33 /* KEY_C */,
        win: {
            primary: 1024 /* Shift */ | 512 /* Alt */ | 33 /* KEY_C */
        },
        id: exports.COPY_PATH_COMMAND_ID,
        handler: async (accessor, resource) => {
            const resources = files_3.getMultiSelectedResources(resource, accessor.get(listService_1.IListService), accessor.get(editorService_1.IEditorService));
            await resourcesToClipboard(resources, false, accessor.get(clipboardService_1.IClipboardService), accessor.get(notification_1.INotificationService), accessor.get(label_1.ILabelService));
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* WorkbenchContrib */,
        when: editorContextKeys_1.EditorContextKeys.focus.toNegated(),
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 512 /* Alt */ | 33 /* KEY_C */,
        win: {
            primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 1024 /* Shift */ | 33 /* KEY_C */)
        },
        id: exports.COPY_RELATIVE_PATH_COMMAND_ID,
        handler: async (accessor, resource) => {
            const resources = files_3.getMultiSelectedResources(resource, accessor.get(listService_1.IListService), accessor.get(editorService_1.IEditorService));
            await resourcesToClipboard(resources, true, accessor.get(clipboardService_1.IClipboardService), accessor.get(notification_1.INotificationService), accessor.get(label_1.ILabelService));
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* WorkbenchContrib */,
        when: undefined,
        primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 46 /* KEY_P */),
        id: 'workbench.action.files.copyPathOfActiveFile',
        handler: async (accessor) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeInput = editorService.activeEditor;
            const resource = activeInput ? activeInput.getResource() : null;
            const resources = resource ? [resource] : [];
            await resourcesToClipboard(resources, false, accessor.get(clipboardService_1.IClipboardService), accessor.get(notification_1.INotificationService), accessor.get(label_1.ILabelService));
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.REVEAL_IN_EXPLORER_COMMAND_ID,
        handler: async (accessor, resource) => {
            const viewletService = accessor.get(viewlet_1.IViewletService);
            const contextService = accessor.get(workspace_1.IWorkspaceContextService);
            const explorerService = accessor.get(files_1.IExplorerService);
            const uri = files_3.getResourceForCommand(resource, accessor.get(listService_1.IListService), accessor.get(editorService_1.IEditorService));
            const viewlet = await viewletService.openViewlet(files_1.VIEWLET_ID, false);
            if (uri && contextService.isInsideWorkspace(uri)) {
                const explorerView = viewlet.getExplorerView();
                if (explorerView) {
                    explorerView.setExpanded(true);
                    await explorerService.select(uri, true);
                    explorerView.focus();
                }
            }
            else {
                const openEditorsView = viewlet.getOpenEditorsView();
                if (openEditorsView) {
                    openEditorsView.setExpanded(true);
                    openEditorsView.focus();
                }
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.SAVE_FILE_AS_COMMAND_ID,
        weight: 200 /* WorkbenchContrib */,
        when: undefined,
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 49 /* KEY_S */,
        handler: (accessor, resourceOrObject) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            let resource = null;
            if (resourceOrObject && 'from' in resourceOrObject && resourceOrObject.from === 'menu') {
                resource = types_1.withUndefinedAsNull(editor_1.toResource(editorService.activeEditor));
            }
            else {
                resource = types_1.withUndefinedAsNull(files_3.getResourceForCommand(resourceOrObject, accessor.get(listService_1.IListService), editorService));
            }
            return save(resource, true, undefined, editorService, accessor.get(files_2.IFileService), accessor.get(untitledEditorService_1.IUntitledEditorService), accessor.get(textfiles_1.ITextFileService), accessor.get(editorGroupsService_1.IEditorGroupsService), accessor.get(environmentService_1.IWorkbenchEnvironmentService));
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        when: undefined,
        weight: 200 /* WorkbenchContrib */,
        primary: 2048 /* CtrlCmd */ | 49 /* KEY_S */,
        id: exports.SAVE_FILE_COMMAND_ID,
        handler: (accessor, resource) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const resources = files_3.getMultiSelectedResources(resource, accessor.get(listService_1.IListService), editorService);
            if (resources.length === 1) {
                // If only one resource is selected explictly call save since the behavior is a bit different than save all #41841
                return save(resources[0], false, undefined, editorService, accessor.get(files_2.IFileService), accessor.get(untitledEditorService_1.IUntitledEditorService), accessor.get(textfiles_1.ITextFileService), accessor.get(editorGroupsService_1.IEditorGroupsService), accessor.get(environmentService_1.IWorkbenchEnvironmentService));
            }
            return saveAll(resources, editorService, accessor.get(untitledEditorService_1.IUntitledEditorService), accessor.get(textfiles_1.ITextFileService), accessor.get(editorGroupsService_1.IEditorGroupsService));
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        when: undefined,
        weight: 200 /* WorkbenchContrib */,
        primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 49 /* KEY_S */),
        win: { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 1024 /* Shift */ | 49 /* KEY_S */) },
        id: exports.SAVE_FILE_WITHOUT_FORMATTING_COMMAND_ID,
        handler: accessor => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const resource = editor_1.toResource(editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.MASTER });
            if (resource) {
                return save(resource, false, { skipSaveParticipants: true }, editorService, accessor.get(files_2.IFileService), accessor.get(untitledEditorService_1.IUntitledEditorService), accessor.get(textfiles_1.ITextFileService), accessor.get(editorGroupsService_1.IEditorGroupsService), accessor.get(environmentService_1.IWorkbenchEnvironmentService));
            }
            return undefined;
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.SAVE_ALL_COMMAND_ID,
        handler: (accessor) => {
            return saveAll(true, accessor.get(editorService_1.IEditorService), accessor.get(untitledEditorService_1.IUntitledEditorService), accessor.get(textfiles_1.ITextFileService), accessor.get(editorGroupsService_1.IEditorGroupsService));
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.SAVE_ALL_IN_GROUP_COMMAND_ID,
        handler: (accessor, _, editorContext) => {
            const contexts = editorCommands_1.getMultiSelectedEditorContexts(editorContext, accessor.get(listService_1.IListService), accessor.get(editorGroupsService_1.IEditorGroupsService));
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            let saveAllArg;
            if (!contexts.length) {
                saveAllArg = true;
            }
            else {
                const fileService = accessor.get(files_2.IFileService);
                saveAllArg = [];
                contexts.forEach(context => {
                    const editorGroup = editorGroupService.getGroup(context.groupId);
                    if (editorGroup) {
                        editorGroup.editors.forEach(editor => {
                            const resource = editor_1.toResource(editor, { supportSideBySide: editor_1.SideBySideEditor.MASTER });
                            if (resource && (resource.scheme === network_1.Schemas.untitled || fileService.canHandleResource(resource))) {
                                saveAllArg.push(resource);
                            }
                        });
                    }
                });
            }
            return saveAll(saveAllArg, accessor.get(editorService_1.IEditorService), accessor.get(untitledEditorService_1.IUntitledEditorService), accessor.get(textfiles_1.ITextFileService), accessor.get(editorGroupsService_1.IEditorGroupsService));
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.SAVE_FILES_COMMAND_ID,
        handler: (accessor) => {
            return saveAll(false, accessor.get(editorService_1.IEditorService), accessor.get(untitledEditorService_1.IUntitledEditorService), accessor.get(textfiles_1.ITextFileService), accessor.get(editorGroupsService_1.IEditorGroupsService));
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.REMOVE_ROOT_FOLDER_COMMAND_ID,
        handler: (accessor, resource) => {
            const workspaceEditingService = accessor.get(workspaceEditing_1.IWorkspaceEditingService);
            const contextService = accessor.get(workspace_1.IWorkspaceContextService);
            const workspace = contextService.getWorkspace();
            const resources = files_3.getMultiSelectedResources(resource, accessor.get(listService_1.IListService), accessor.get(editorService_1.IEditorService)).filter(r => 
            // Need to verify resources are workspaces since multi selection can trigger this command on some non workspace resources
            workspace.folders.some(f => resources_1.isEqual(f.uri, r)));
            return workspaceEditingService.removeFolders(resources);
        }
    });
});
//# sourceMappingURL=fileCommands.js.map