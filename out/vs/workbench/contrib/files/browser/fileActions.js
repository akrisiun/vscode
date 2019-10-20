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
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/base/common/platform", "vs/base/common/extpath", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/errorMessage", "vs/base/common/strings", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/workbench/contrib/files/common/files", "vs/workbench/services/textfile/common/textfiles", "vs/platform/files/common/files", "vs/workbench/common/editor", "vs/workbench/services/untitled/common/untitledEditorService", "vs/platform/quickOpen/common/quickOpen", "vs/workbench/services/viewlet/browser/viewlet", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/host/browser/host", "vs/workbench/contrib/files/browser/fileCommands", "vs/editor/common/services/resolverService", "vs/platform/configuration/common/configuration", "vs/platform/clipboard/common/clipboardService", "vs/editor/common/services/modeService", "vs/editor/common/services/modelService", "vs/platform/commands/common/commands", "vs/platform/list/browser/listService", "vs/platform/contextkey/common/contextkey", "vs/base/common/network", "vs/platform/dialogs/common/dialogs", "vs/platform/notification/common/notification", "vs/workbench/services/editor/common/editorService", "vs/workbench/browser/parts/editor/editorCommands", "vs/base/common/arrays", "vs/workbench/contrib/files/common/explorerModel", "vs/base/common/errors", "vs/css!./media/fileactions"], function (require, exports, nls, types, platform_1, extpath, path_1, resources, errorMessage_1, strings, actions_1, lifecycle_1, files_1, textfiles_1, files_2, editor_1, untitledEditorService_1, quickOpen_1, viewlet_1, instantiation_1, host_1, fileCommands_1, resolverService_1, configuration_1, clipboardService_1, modeService_1, modelService_1, commands_1, listService_1, contextkey_1, network_1, dialogs_1, notification_1, editorService_1, editorCommands_1, arrays_1, explorerModel_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NEW_FILE_COMMAND_ID = 'explorer.newFile';
    exports.NEW_FILE_LABEL = nls.localize('newFile', "New File");
    exports.NEW_FOLDER_COMMAND_ID = 'explorer.newFolder';
    exports.NEW_FOLDER_LABEL = nls.localize('newFolder', "New Folder");
    exports.TRIGGER_RENAME_LABEL = nls.localize('rename', "Rename");
    exports.MOVE_FILE_TO_TRASH_LABEL = nls.localize('delete', "Delete");
    exports.COPY_FILE_LABEL = nls.localize('copyFile', "Copy");
    exports.PASTE_FILE_LABEL = nls.localize('pasteFile', "Paste");
    exports.FileCopiedContext = new contextkey_1.RawContextKey('fileCopied', false);
    const CONFIRM_DELETE_SETTING_KEY = 'explorer.confirmDelete';
    function onError(notificationService, error) {
        if (error.message === 'string') {
            error = error.message;
        }
        notificationService.error(errorMessage_1.toErrorMessage(error, false));
    }
    function refreshIfSeparator(value, explorerService) {
        if (value && ((value.indexOf('/') >= 0) || (value.indexOf('\\') >= 0))) {
            // New input contains separator, multiple resources will get created workaround for #68204
            explorerService.refresh();
        }
    }
    /* New File */
    let NewFileAction = class NewFileAction extends actions_1.Action {
        constructor(explorerService, commandService) {
            super('explorer.newFile', exports.NEW_FILE_LABEL);
            this.commandService = commandService;
            this.class = 'explorer-action codicon-new-file';
            this._register(explorerService.onDidChangeEditable(e => {
                const elementIsBeingEdited = explorerService.isEditable(e);
                this.enabled = !elementIsBeingEdited;
            }));
        }
        run() {
            return this.commandService.executeCommand(exports.NEW_FILE_COMMAND_ID);
        }
    };
    NewFileAction.ID = 'workbench.files.action.createFileFromExplorer';
    NewFileAction.LABEL = nls.localize('createNewFile', "New File");
    NewFileAction = __decorate([
        __param(0, files_1.IExplorerService),
        __param(1, commands_1.ICommandService)
    ], NewFileAction);
    exports.NewFileAction = NewFileAction;
    /* New Folder */
    let NewFolderAction = class NewFolderAction extends actions_1.Action {
        constructor(explorerService, commandService) {
            super('explorer.newFolder', exports.NEW_FOLDER_LABEL);
            this.commandService = commandService;
            this.class = 'explorer-action codicon-new-folder';
            this._register(explorerService.onDidChangeEditable(e => {
                const elementIsBeingEdited = explorerService.isEditable(e);
                this.enabled = !elementIsBeingEdited;
            }));
        }
        run() {
            return this.commandService.executeCommand(exports.NEW_FOLDER_COMMAND_ID);
        }
    };
    NewFolderAction.ID = 'workbench.files.action.createFolderFromExplorer';
    NewFolderAction.LABEL = nls.localize('createNewFolder', "New Folder");
    NewFolderAction = __decorate([
        __param(0, files_1.IExplorerService),
        __param(1, commands_1.ICommandService)
    ], NewFolderAction);
    exports.NewFolderAction = NewFolderAction;
    /* Create new file from anywhere: Open untitled */
    let GlobalNewUntitledFileAction = class GlobalNewUntitledFileAction extends actions_1.Action {
        constructor(id, label, editorService) {
            super(id, label);
            this.editorService = editorService;
        }
        run() {
            return this.editorService.openEditor({ options: { pinned: true } }); // untitled are always pinned
        }
    };
    GlobalNewUntitledFileAction.ID = 'workbench.action.files.newUntitledFile';
    GlobalNewUntitledFileAction.LABEL = nls.localize('newUntitledFile', "New Untitled File");
    GlobalNewUntitledFileAction = __decorate([
        __param(2, editorService_1.IEditorService)
    ], GlobalNewUntitledFileAction);
    exports.GlobalNewUntitledFileAction = GlobalNewUntitledFileAction;
    async function deleteFiles(textFileService, dialogService, configurationService, fileService, elements, useTrash, skipConfirm = false) {
        let primaryButton;
        if (useTrash) {
            primaryButton = platform_1.isWindows ? nls.localize('deleteButtonLabelRecycleBin', "&&Move to Recycle Bin") : nls.localize({ key: 'deleteButtonLabelTrash', comment: ['&& denotes a mnemonic'] }, "&&Move to Trash");
        }
        else {
            primaryButton = nls.localize({ key: 'deleteButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Delete");
        }
        const distinctElements = resources.distinctParents(elements, e => e.resource);
        // Handle dirty
        let confirmed = true;
        const dirty = textFileService.getDirty().filter(d => distinctElements.some(e => resources.isEqualOrParent(d, e.resource)));
        if (dirty.length) {
            let message;
            if (distinctElements.length > 1) {
                message = nls.localize('dirtyMessageFilesDelete', "You are deleting files with unsaved changes. Do you want to continue?");
            }
            else if (distinctElements[0].isDirectory) {
                if (dirty.length === 1) {
                    message = nls.localize('dirtyMessageFolderOneDelete', "You are deleting a folder with unsaved changes in 1 file. Do you want to continue?");
                }
                else {
                    message = nls.localize('dirtyMessageFolderDelete', "You are deleting a folder with unsaved changes in {0} files. Do you want to continue?", dirty.length);
                }
            }
            else {
                message = nls.localize('dirtyMessageFileDelete', "You are deleting a file with unsaved changes. Do you want to continue?");
            }
            const response = await dialogService.confirm({
                message,
                type: 'warning',
                detail: nls.localize('dirtyWarning', "Your changes will be lost if you don't save them."),
                primaryButton
            });
            if (!response.confirmed) {
                confirmed = false;
            }
            else {
                skipConfirm = true;
                await textFileService.revertAll(dirty);
            }
        }
        // Check if file is dirty in editor and save it to avoid data loss
        if (!confirmed) {
            return;
        }
        let confirmDeletePromise;
        // Check if we need to ask for confirmation at all
        if (skipConfirm || (useTrash && configurationService.getValue(CONFIRM_DELETE_SETTING_KEY) === false)) {
            confirmDeletePromise = Promise.resolve({ confirmed: true });
        }
        // Confirm for moving to trash
        else if (useTrash) {
            const message = getMoveToTrashMessage(distinctElements);
            confirmDeletePromise = dialogService.confirm({
                message,
                detail: platform_1.isWindows ? nls.localize('undoBin', "You can restore from the Recycle Bin.") : nls.localize('undoTrash', "You can restore from the Trash."),
                primaryButton,
                checkbox: {
                    label: nls.localize('doNotAskAgain', "Do not ask me again")
                },
                type: 'question'
            });
        }
        // Confirm for deleting permanently
        else {
            const message = getDeleteMessage(distinctElements);
            confirmDeletePromise = dialogService.confirm({
                message,
                detail: nls.localize('irreversible', "This action is irreversible!"),
                primaryButton,
                type: 'warning'
            });
        }
        return confirmDeletePromise.then(confirmation => {
            // Check for confirmation checkbox
            let updateConfirmSettingsPromise = Promise.resolve(undefined);
            if (confirmation.confirmed && confirmation.checkboxChecked === true) {
                updateConfirmSettingsPromise = configurationService.updateValue(CONFIRM_DELETE_SETTING_KEY, false, 1 /* USER */);
            }
            return updateConfirmSettingsPromise.then(() => {
                // Check for confirmation
                if (!confirmation.confirmed) {
                    return Promise.resolve(undefined);
                }
                // Call function
                const servicePromise = Promise.all(distinctElements.map(e => fileService.del(e.resource, { useTrash: useTrash, recursive: true })))
                    .then(undefined, (error) => {
                    // Handle error to delete file(s) from a modal confirmation dialog
                    let errorMessage;
                    let detailMessage;
                    let primaryButton;
                    if (useTrash) {
                        errorMessage = platform_1.isWindows ? nls.localize('binFailed', "Failed to delete using the Recycle Bin. Do you want to permanently delete instead?") : nls.localize('trashFailed', "Failed to delete using the Trash. Do you want to permanently delete instead?");
                        detailMessage = nls.localize('irreversible', "This action is irreversible!");
                        primaryButton = nls.localize({ key: 'deletePermanentlyButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Delete Permanently");
                    }
                    else {
                        errorMessage = errorMessage_1.toErrorMessage(error, false);
                        primaryButton = nls.localize({ key: 'retryButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Retry");
                    }
                    return dialogService.confirm({
                        message: errorMessage,
                        detail: detailMessage,
                        type: 'warning',
                        primaryButton
                    }).then(res => {
                        if (res.confirmed) {
                            if (useTrash) {
                                useTrash = false; // Delete Permanently
                            }
                            skipConfirm = true;
                            return deleteFiles(textFileService, dialogService, configurationService, fileService, elements, useTrash, skipConfirm);
                        }
                        return Promise.resolve();
                    });
                });
                return servicePromise;
            });
        });
    }
    function getMoveToTrashMessage(distinctElements) {
        if (containsBothDirectoryAndFile(distinctElements)) {
            return dialogs_1.getConfirmMessage(nls.localize('confirmMoveTrashMessageFilesAndDirectories', "Are you sure you want to delete the following {0} files/directories and their contents?", distinctElements.length), distinctElements.map(e => e.resource));
        }
        if (distinctElements.length > 1) {
            if (distinctElements[0].isDirectory) {
                return dialogs_1.getConfirmMessage(nls.localize('confirmMoveTrashMessageMultipleDirectories', "Are you sure you want to delete the following {0} directories and their contents?", distinctElements.length), distinctElements.map(e => e.resource));
            }
            return dialogs_1.getConfirmMessage(nls.localize('confirmMoveTrashMessageMultiple', "Are you sure you want to delete the following {0} files?", distinctElements.length), distinctElements.map(e => e.resource));
        }
        if (distinctElements[0].isDirectory) {
            return nls.localize('confirmMoveTrashMessageFolder', "Are you sure you want to delete '{0}' and its contents?", distinctElements[0].name);
        }
        return nls.localize('confirmMoveTrashMessageFile', "Are you sure you want to delete '{0}'?", distinctElements[0].name);
    }
    function getDeleteMessage(distinctElements) {
        if (containsBothDirectoryAndFile(distinctElements)) {
            return dialogs_1.getConfirmMessage(nls.localize('confirmDeleteMessageFilesAndDirectories', "Are you sure you want to permanently delete the following {0} files/directories and their contents?", distinctElements.length), distinctElements.map(e => e.resource));
        }
        if (distinctElements.length > 1) {
            if (distinctElements[0].isDirectory) {
                return dialogs_1.getConfirmMessage(nls.localize('confirmDeleteMessageMultipleDirectories', "Are you sure you want to permanently delete the following {0} directories and their contents?", distinctElements.length), distinctElements.map(e => e.resource));
            }
            return dialogs_1.getConfirmMessage(nls.localize('confirmDeleteMessageMultiple', "Are you sure you want to permanently delete the following {0} files?", distinctElements.length), distinctElements.map(e => e.resource));
        }
        if (distinctElements[0].isDirectory) {
            return nls.localize('confirmDeleteMessageFolder', "Are you sure you want to permanently delete '{0}' and its contents?", distinctElements[0].name);
        }
        return nls.localize('confirmDeleteMessageFile', "Are you sure you want to permanently delete '{0}'?", distinctElements[0].name);
    }
    function containsBothDirectoryAndFile(distinctElements) {
        const directories = distinctElements.filter(element => element.isDirectory);
        const files = distinctElements.filter(element => !element.isDirectory);
        return directories.length > 0 && files.length > 0;
    }
    function findValidPasteFileTarget(targetFolder, fileToPaste, incrementalNaming) {
        let name = resources.basenameOrAuthority(fileToPaste.resource);
        let candidate = resources.joinPath(targetFolder.resource, name);
        while (true && !fileToPaste.allowOverwrite) {
            if (!targetFolder.root.find(candidate)) {
                break;
            }
            name = incrementFileName(name, !!fileToPaste.isDirectory, incrementalNaming);
            candidate = resources.joinPath(targetFolder.resource, name);
        }
        return candidate;
    }
    exports.findValidPasteFileTarget = findValidPasteFileTarget;
    function incrementFileName(name, isFolder, incrementalNaming) {
        if (incrementalNaming === 'simple') {
            let namePrefix = name;
            let extSuffix = '';
            if (!isFolder) {
                extSuffix = path_1.extname(name);
                namePrefix = path_1.basename(name, extSuffix);
            }
            // name copy 5(.txt) => name copy 6(.txt)
            // name copy(.txt) => name copy 2(.txt)
            const suffixRegex = /^(.+ copy)( \d+)?$/;
            if (suffixRegex.test(namePrefix)) {
                return namePrefix.replace(suffixRegex, (match, g1, g2) => {
                    let number = (g2 ? parseInt(g2) : 1);
                    return number === 0
                        ? `${g1}`
                        : (number < 1073741824 /* MAX_SAFE_SMALL_INTEGER */
                            ? `${g1} ${number + 1}`
                            : `${g1}${g2} copy`);
                }) + extSuffix;
            }
            // name(.txt) => name copy(.txt)
            return `${namePrefix} copy${extSuffix}`;
        }
        const separators = '[\\.\\-_]';
        const maxNumber = 1073741824 /* MAX_SAFE_SMALL_INTEGER */;
        // file.1.txt=>file.2.txt
        let suffixFileRegex = RegExp('(.*' + separators + ')(\\d+)(\\..*)$');
        if (!isFolder && name.match(suffixFileRegex)) {
            return name.replace(suffixFileRegex, (match, g1, g2, g3) => {
                let number = parseInt(g2);
                return number < maxNumber
                    ? g1 + strings.pad(number + 1, g2.length) + g3
                    : strings.format('{0}{1}.1{2}', g1, g2, g3);
            });
        }
        // 1.file.txt=>2.file.txt
        let prefixFileRegex = RegExp('(\\d+)(' + separators + '.*)(\\..*)$');
        if (!isFolder && name.match(prefixFileRegex)) {
            return name.replace(prefixFileRegex, (match, g1, g2, g3) => {
                let number = parseInt(g1);
                return number < maxNumber
                    ? strings.pad(number + 1, g1.length) + g2 + g3
                    : strings.format('{0}{1}.1{2}', g1, g2, g3);
            });
        }
        // 1.txt=>2.txt
        let prefixFileNoNameRegex = RegExp('(\\d+)(\\..*)$');
        if (!isFolder && name.match(prefixFileNoNameRegex)) {
            return name.replace(prefixFileNoNameRegex, (match, g1, g2) => {
                let number = parseInt(g1);
                return number < maxNumber
                    ? strings.pad(number + 1, g1.length) + g2
                    : strings.format('{0}.1{1}', g1, g2);
            });
        }
        // file.txt=>file.1.txt
        const lastIndexOfDot = name.lastIndexOf('.');
        if (!isFolder && lastIndexOfDot >= 0) {
            return strings.format('{0}.1{1}', name.substr(0, lastIndexOfDot), name.substr(lastIndexOfDot));
        }
        // folder.1=>folder.2
        if (isFolder && name.match(/(\d+)$/)) {
            return name.replace(/(\d+)$/, (match, ...groups) => {
                let number = parseInt(groups[0]);
                return number < maxNumber
                    ? strings.pad(number + 1, groups[0].length)
                    : strings.format('{0}.1', groups[0]);
            });
        }
        // 1.folder=>2.folder
        if (isFolder && name.match(/^(\d+)/)) {
            return name.replace(/^(\d+)(.*)$/, (match, ...groups) => {
                let number = parseInt(groups[0]);
                return number < maxNumber
                    ? strings.pad(number + 1, groups[0].length) + groups[1]
                    : strings.format('{0}{1}.1', groups[0], groups[1]);
            });
        }
        // file/folder=>file.1/folder.1
        return strings.format('{0}.1', name);
    }
    exports.incrementFileName = incrementFileName;
    // Global Compare with
    let GlobalCompareResourcesAction = class GlobalCompareResourcesAction extends actions_1.Action {
        constructor(id, label, quickOpenService, editorService, notificationService) {
            super(id, label);
            this.quickOpenService = quickOpenService;
            this.editorService = editorService;
            this.notificationService = notificationService;
        }
        async run() {
            const activeInput = this.editorService.activeEditor;
            const activeResource = activeInput ? activeInput.getResource() : undefined;
            if (activeResource) {
                // Compare with next editor that opens
                const toDispose = this.editorService.overrideOpenEditor(editor => {
                    // Only once!
                    toDispose.dispose();
                    // Open editor as diff
                    const resource = editor.getResource();
                    if (resource) {
                        return {
                            override: this.editorService.openEditor({
                                leftResource: activeResource,
                                rightResource: resource
                            })
                        };
                    }
                    return undefined;
                });
                // Bring up quick open
                await this.quickOpenService.show('', { autoFocus: { autoFocusSecondEntry: true } });
                toDispose.dispose(); // make sure to unbind if quick open is closing
            }
            else {
                this.notificationService.info(nls.localize('openFileToCompare', "Open a file first to compare it with another file."));
            }
        }
    };
    GlobalCompareResourcesAction.ID = 'workbench.files.action.compareFileWith';
    GlobalCompareResourcesAction.LABEL = nls.localize('globalCompareFile', "Compare Active File With...");
    GlobalCompareResourcesAction = __decorate([
        __param(2, quickOpen_1.IQuickOpenService),
        __param(3, editorService_1.IEditorService),
        __param(4, notification_1.INotificationService)
    ], GlobalCompareResourcesAction);
    exports.GlobalCompareResourcesAction = GlobalCompareResourcesAction;
    let ToggleAutoSaveAction = class ToggleAutoSaveAction extends actions_1.Action {
        constructor(id, label, configurationService) {
            super(id, label);
            this.configurationService = configurationService;
        }
        run() {
            const setting = this.configurationService.inspect('files.autoSave');
            let userAutoSaveConfig = setting.user;
            if (types.isUndefinedOrNull(userAutoSaveConfig)) {
                userAutoSaveConfig = setting.default; // use default if setting not defined
            }
            let newAutoSaveValue;
            if ([files_2.AutoSaveConfiguration.AFTER_DELAY, files_2.AutoSaveConfiguration.ON_FOCUS_CHANGE, files_2.AutoSaveConfiguration.ON_WINDOW_CHANGE].some(s => s === userAutoSaveConfig)) {
                newAutoSaveValue = files_2.AutoSaveConfiguration.OFF;
            }
            else {
                newAutoSaveValue = files_2.AutoSaveConfiguration.AFTER_DELAY;
            }
            return this.configurationService.updateValue('files.autoSave', newAutoSaveValue, 1 /* USER */);
        }
    };
    ToggleAutoSaveAction.ID = 'workbench.action.toggleAutoSave';
    ToggleAutoSaveAction.LABEL = nls.localize('toggleAutoSave', "Toggle Auto Save");
    ToggleAutoSaveAction = __decorate([
        __param(2, configuration_1.IConfigurationService)
    ], ToggleAutoSaveAction);
    exports.ToggleAutoSaveAction = ToggleAutoSaveAction;
    let BaseSaveAllAction = class BaseSaveAllAction extends actions_1.Action {
        constructor(id, label, textFileService, untitledEditorService, commandService, notificationService) {
            super(id, label);
            this.textFileService = textFileService;
            this.untitledEditorService = untitledEditorService;
            this.commandService = commandService;
            this.notificationService = notificationService;
            this.lastIsDirty = this.textFileService.isDirty();
            this.enabled = this.lastIsDirty;
            this.registerListeners();
        }
        registerListeners() {
            // listen to files being changed locally
            this._register(this.textFileService.models.onModelsDirty(e => this.updateEnablement(true)));
            this._register(this.textFileService.models.onModelsSaved(e => this.updateEnablement(false)));
            this._register(this.textFileService.models.onModelsReverted(e => this.updateEnablement(false)));
            this._register(this.textFileService.models.onModelsSaveError(e => this.updateEnablement(true)));
            if (this.includeUntitled()) {
                this._register(this.untitledEditorService.onDidChangeDirty(resource => this.updateEnablement(this.untitledEditorService.isDirty(resource))));
            }
        }
        updateEnablement(isDirty) {
            if (this.lastIsDirty !== isDirty) {
                this.enabled = this.textFileService.isDirty();
                this.lastIsDirty = this.enabled;
            }
        }
        async run(context) {
            try {
                await this.doRun(context);
            }
            catch (error) {
                onError(this.notificationService, error);
            }
        }
    };
    BaseSaveAllAction = __decorate([
        __param(2, textfiles_1.ITextFileService),
        __param(3, untitledEditorService_1.IUntitledEditorService),
        __param(4, commands_1.ICommandService),
        __param(5, notification_1.INotificationService)
    ], BaseSaveAllAction);
    exports.BaseSaveAllAction = BaseSaveAllAction;
    class SaveAllAction extends BaseSaveAllAction {
        get class() {
            return 'explorer-action codicon-save-all';
        }
        doRun(context) {
            return this.commandService.executeCommand(fileCommands_1.SAVE_ALL_COMMAND_ID);
        }
        includeUntitled() {
            return true;
        }
    }
    exports.SaveAllAction = SaveAllAction;
    SaveAllAction.ID = 'workbench.action.files.saveAll';
    SaveAllAction.LABEL = fileCommands_1.SAVE_ALL_LABEL;
    class SaveAllInGroupAction extends BaseSaveAllAction {
        get class() {
            return 'explorer-action codicon-save-all';
        }
        doRun(context) {
            return this.commandService.executeCommand(fileCommands_1.SAVE_ALL_IN_GROUP_COMMAND_ID, {}, context);
        }
        includeUntitled() {
            return true;
        }
    }
    exports.SaveAllInGroupAction = SaveAllInGroupAction;
    SaveAllInGroupAction.ID = 'workbench.files.action.saveAllInGroup';
    SaveAllInGroupAction.LABEL = nls.localize('saveAllInGroup', "Save All in Group");
    let CloseGroupAction = class CloseGroupAction extends actions_1.Action {
        constructor(id, label, commandService) {
            super(id, label, 'codicon-close-all');
            this.commandService = commandService;
        }
        run(context) {
            return this.commandService.executeCommand(editorCommands_1.CLOSE_EDITORS_AND_GROUP_COMMAND_ID, {}, context);
        }
    };
    CloseGroupAction.ID = 'workbench.files.action.closeGroup';
    CloseGroupAction.LABEL = nls.localize('closeGroup', "Close Group");
    CloseGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], CloseGroupAction);
    exports.CloseGroupAction = CloseGroupAction;
    let FocusFilesExplorer = class FocusFilesExplorer extends actions_1.Action {
        constructor(id, label, viewletService) {
            super(id, label);
            this.viewletService = viewletService;
        }
        run() {
            return this.viewletService.openViewlet(files_1.VIEWLET_ID, true);
        }
    };
    FocusFilesExplorer.ID = 'workbench.files.action.focusFilesExplorer';
    FocusFilesExplorer.LABEL = nls.localize('focusFilesExplorer', "Focus on Files Explorer");
    FocusFilesExplorer = __decorate([
        __param(2, viewlet_1.IViewletService)
    ], FocusFilesExplorer);
    exports.FocusFilesExplorer = FocusFilesExplorer;
    let ShowActiveFileInExplorer = class ShowActiveFileInExplorer extends actions_1.Action {
        constructor(id, label, editorService, notificationService, commandService) {
            super(id, label);
            this.editorService = editorService;
            this.notificationService = notificationService;
            this.commandService = commandService;
        }
        run() {
            const resource = editor_1.toResource(this.editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.MASTER });
            if (resource) {
                this.commandService.executeCommand(fileCommands_1.REVEAL_IN_EXPLORER_COMMAND_ID, resource);
            }
            else {
                this.notificationService.info(nls.localize('openFileToShow', "Open a file first to show it in the explorer"));
            }
            return Promise.resolve(true);
        }
    };
    ShowActiveFileInExplorer.ID = 'workbench.files.action.showActiveFileInExplorer';
    ShowActiveFileInExplorer.LABEL = nls.localize('showInExplorer', "Reveal Active File in Side Bar");
    ShowActiveFileInExplorer = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, notification_1.INotificationService),
        __param(4, commands_1.ICommandService)
    ], ShowActiveFileInExplorer);
    exports.ShowActiveFileInExplorer = ShowActiveFileInExplorer;
    let CollapseExplorerView = class CollapseExplorerView extends actions_1.Action {
        constructor(id, label, viewletService, explorerService) {
            super(id, label, 'explorer-action codicon-collapse-all');
            this.viewletService = viewletService;
            this.explorerService = explorerService;
            this._register(explorerService.onDidChangeEditable(e => {
                const elementIsBeingEdited = explorerService.isEditable(e);
                this.enabled = !elementIsBeingEdited;
            }));
        }
        async run() {
            const explorerViewlet = await this.viewletService.openViewlet(files_1.VIEWLET_ID);
            const explorerView = explorerViewlet.getExplorerView();
            if (explorerView) {
                explorerView.collapseAll();
            }
        }
    };
    CollapseExplorerView.ID = 'workbench.files.action.collapseExplorerFolders';
    CollapseExplorerView.LABEL = nls.localize('collapseExplorerFolders', "Collapse Folders in Explorer");
    CollapseExplorerView = __decorate([
        __param(2, viewlet_1.IViewletService),
        __param(3, files_1.IExplorerService)
    ], CollapseExplorerView);
    exports.CollapseExplorerView = CollapseExplorerView;
    let RefreshExplorerView = class RefreshExplorerView extends actions_1.Action {
        constructor(id, label, viewletService, explorerService) {
            super(id, label, 'explorer-action codicon-refresh');
            this.viewletService = viewletService;
            this.explorerService = explorerService;
            this._register(explorerService.onDidChangeEditable(e => {
                const elementIsBeingEdited = explorerService.isEditable(e);
                this.enabled = !elementIsBeingEdited;
            }));
        }
        async run() {
            await this.viewletService.openViewlet(files_1.VIEWLET_ID);
            this.explorerService.refresh();
        }
    };
    RefreshExplorerView.ID = 'workbench.files.action.refreshFilesExplorer';
    RefreshExplorerView.LABEL = nls.localize('refreshExplorer', "Refresh Explorer");
    RefreshExplorerView = __decorate([
        __param(2, viewlet_1.IViewletService),
        __param(3, files_1.IExplorerService)
    ], RefreshExplorerView);
    exports.RefreshExplorerView = RefreshExplorerView;
    let ShowOpenedFileInNewWindow = class ShowOpenedFileInNewWindow extends actions_1.Action {
        constructor(id, label, editorService, hostService, notificationService, fileService) {
            super(id, label);
            this.editorService = editorService;
            this.hostService = hostService;
            this.notificationService = notificationService;
            this.fileService = fileService;
        }
        run() {
            const fileResource = editor_1.toResource(this.editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.MASTER });
            if (fileResource) {
                if (this.fileService.canHandleResource(fileResource)) {
                    this.hostService.openWindow([{ fileUri: fileResource }], { forceNewWindow: true });
                }
                else {
                    this.notificationService.info(nls.localize('openFileToShowInNewWindow.unsupportedschema', "The active editor must contain an openable resource."));
                }
            }
            else {
                this.notificationService.info(nls.localize('openFileToShowInNewWindow.nofile', "Open a file first to open in new window"));
            }
            return Promise.resolve(true);
        }
    };
    ShowOpenedFileInNewWindow.ID = 'workbench.action.files.showOpenedFileInNewWindow';
    ShowOpenedFileInNewWindow.LABEL = nls.localize('openFileInNewWindow', "Open Active File in New Window");
    ShowOpenedFileInNewWindow = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, host_1.IHostService),
        __param(4, notification_1.INotificationService),
        __param(5, files_2.IFileService)
    ], ShowOpenedFileInNewWindow);
    exports.ShowOpenedFileInNewWindow = ShowOpenedFileInNewWindow;
    function validateFileName(item, name) {
        // Produce a well formed file name
        name = getWellFormedFileName(name);
        // Name not provided
        if (!name || name.length === 0 || /^\s+$/.test(name)) {
            return nls.localize('emptyFileNameError', "A file or folder name must be provided.");
        }
        // Relative paths only
        if (name[0] === '/' || name[0] === '\\') {
            return nls.localize('fileNameStartsWithSlashError', "A file or folder name cannot start with a slash.");
        }
        const names = arrays_1.coalesce(name.split(/[\\/]/));
        const parent = item.parent;
        if (name !== item.name) {
            // Do not allow to overwrite existing file
            const child = parent && parent.getChild(name);
            if (child && child !== item) {
                return nls.localize('fileNameExistsError', "A file or folder **{0}** already exists at this location. Please choose a different name.", name);
            }
        }
        // Invalid File name
        const windowsBasenameValidity = item.resource.scheme === network_1.Schemas.file && platform_1.isWindows;
        if (names.some((folderName) => !extpath.isValidBasename(folderName, windowsBasenameValidity))) {
            return nls.localize('invalidFileNameError', "The name **{0}** is not valid as a file or folder name. Please choose a different name.", trimLongName(name));
        }
        return null;
    }
    exports.validateFileName = validateFileName;
    function trimLongName(name) {
        if (name && name.length > 255) {
            return `${name.substr(0, 255)}...`;
        }
        return name;
    }
    function getWellFormedFileName(filename) {
        if (!filename) {
            return filename;
        }
        // Trim tabs
        filename = strings.trim(filename, '\t');
        // Remove trailing dots, slashes, and spaces
        filename = strings.rtrim(filename, '.');
        filename = strings.rtrim(filename, '/');
        filename = strings.rtrim(filename, '\\');
        return filename;
    }
    exports.getWellFormedFileName = getWellFormedFileName;
    let CompareWithClipboardAction = class CompareWithClipboardAction extends actions_1.Action {
        constructor(id, label, editorService, instantiationService, textModelService, fileService) {
            super(id, label);
            this.editorService = editorService;
            this.instantiationService = instantiationService;
            this.textModelService = textModelService;
            this.fileService = fileService;
            this.enabled = true;
        }
        run() {
            const resource = editor_1.toResource(this.editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.MASTER });
            if (resource && (this.fileService.canHandleResource(resource) || resource.scheme === network_1.Schemas.untitled)) {
                if (!this.registrationDisposal) {
                    const provider = this.instantiationService.createInstance(ClipboardContentProvider);
                    this.registrationDisposal = this.textModelService.registerTextModelContentProvider(CompareWithClipboardAction.SCHEME, provider);
                }
                const name = resources.basename(resource);
                const editorLabel = nls.localize('clipboardComparisonLabel', "Clipboard ↔ {0}", name);
                return this.editorService.openEditor({ leftResource: resource.with({ scheme: CompareWithClipboardAction.SCHEME }), rightResource: resource, label: editorLabel }).finally(() => {
                    lifecycle_1.dispose(this.registrationDisposal);
                    this.registrationDisposal = undefined;
                });
            }
            return Promise.resolve(true);
        }
        dispose() {
            super.dispose();
            lifecycle_1.dispose(this.registrationDisposal);
            this.registrationDisposal = undefined;
        }
    };
    CompareWithClipboardAction.ID = 'workbench.files.action.compareWithClipboard';
    CompareWithClipboardAction.LABEL = nls.localize('compareWithClipboard', "Compare Active File with Clipboard");
    CompareWithClipboardAction.SCHEME = 'clipboardCompare';
    CompareWithClipboardAction = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, resolverService_1.ITextModelService),
        __param(5, files_2.IFileService)
    ], CompareWithClipboardAction);
    exports.CompareWithClipboardAction = CompareWithClipboardAction;
    let ClipboardContentProvider = class ClipboardContentProvider {
        constructor(clipboardService, modeService, modelService) {
            this.clipboardService = clipboardService;
            this.modeService = modeService;
            this.modelService = modelService;
        }
        async provideTextContent(resource) {
            const model = this.modelService.createModel(await this.clipboardService.readText(), this.modeService.createByFilepathOrFirstLine(resource), resource);
            return model;
        }
    };
    ClipboardContentProvider = __decorate([
        __param(0, clipboardService_1.IClipboardService),
        __param(1, modeService_1.IModeService),
        __param(2, modelService_1.IModelService)
    ], ClipboardContentProvider);
    function getContext(listWidget) {
        // These commands can only be triggered when explorer viewlet is visible so get it using the active viewlet
        const tree = listWidget;
        const focus = tree.getFocus();
        const stat = focus.length ? focus[0] : undefined;
        const selection = tree.getSelection();
        // Only respect the selection if user clicked inside it (focus belongs to it)
        return { stat, selection: selection && typeof stat !== 'undefined' && selection.indexOf(stat) >= 0 ? selection : [] };
    }
    function onErrorWithRetry(notificationService, error, retry) {
        notificationService.prompt(notification_1.Severity.Error, errorMessage_1.toErrorMessage(error, false), [{
                label: nls.localize('retry', "Retry"),
                run: () => retry()
            }]);
    }
    async function openExplorerAndCreate(accessor, isFolder) {
        const listService = accessor.get(listService_1.IListService);
        const explorerService = accessor.get(files_1.IExplorerService);
        const fileService = accessor.get(files_2.IFileService);
        const textFileService = accessor.get(textfiles_1.ITextFileService);
        const editorService = accessor.get(editorService_1.IEditorService);
        const viewletService = accessor.get(viewlet_1.IViewletService);
        const notificationService = accessor.get(notification_1.INotificationService);
        await viewletService.openViewlet(files_1.VIEWLET_ID, true);
        const list = listService.lastFocusedList;
        if (list) {
            const { stat } = getContext(list);
            let folder;
            if (stat) {
                folder = stat.isDirectory ? stat : (stat.parent || explorerService.roots[0]);
            }
            else {
                folder = explorerService.roots[0];
            }
            if (folder.isReadonly) {
                throw new Error('Parent folder is readonly.');
            }
            const newStat = new explorerModel_1.NewExplorerItem(folder, isFolder);
            await folder.fetchChildren(fileService, explorerService);
            folder.addChild(newStat);
            const onSuccess = (value) => {
                const createPromise = isFolder ? fileService.createFolder(resources.joinPath(folder.resource, value)) : textFileService.create(resources.joinPath(folder.resource, value));
                return createPromise.then(created => {
                    refreshIfSeparator(value, explorerService);
                    return isFolder ? explorerService.select(created.resource, true)
                        : editorService.openEditor({ resource: created.resource, options: { pinned: true } }).then(() => undefined);
                }, error => {
                    onErrorWithRetry(notificationService, error, () => onSuccess(value));
                });
            };
            explorerService.setEditable(newStat, {
                validationMessage: value => validateFileName(newStat, value),
                onFinish: (value, success) => {
                    folder.removeChild(newStat);
                    explorerService.setEditable(newStat, null);
                    if (success) {
                        onSuccess(value);
                    }
                }
            });
        }
    }
    commands_1.CommandsRegistry.registerCommand({
        id: exports.NEW_FILE_COMMAND_ID,
        handler: async (accessor) => {
            await openExplorerAndCreate(accessor, false);
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.NEW_FOLDER_COMMAND_ID,
        handler: async (accessor) => {
            await openExplorerAndCreate(accessor, true);
        }
    });
    exports.renameHandler = (accessor) => {
        const listService = accessor.get(listService_1.IListService);
        const explorerService = accessor.get(files_1.IExplorerService);
        const textFileService = accessor.get(textfiles_1.ITextFileService);
        if (!listService.lastFocusedList) {
            return;
        }
        const { stat } = getContext(listService.lastFocusedList);
        if (!stat) {
            return;
        }
        explorerService.setEditable(stat, {
            validationMessage: value => validateFileName(stat, value),
            onFinish: (value, success) => {
                if (success) {
                    const parentResource = stat.parent.resource;
                    const targetResource = resources.joinPath(parentResource, value);
                    if (stat.resource.toString() !== targetResource.toString()) {
                        textFileService.move(stat.resource, targetResource).then(() => refreshIfSeparator(value, explorerService), errors_1.onUnexpectedError);
                    }
                }
                explorerService.setEditable(stat, null);
            }
        });
    };
    exports.moveFileToTrashHandler = (accessor) => {
        const listService = accessor.get(listService_1.IListService);
        if (!listService.lastFocusedList) {
            return Promise.resolve();
        }
        const explorerContext = getContext(listService.lastFocusedList);
        const stats = explorerContext.selection.length > 1 ? explorerContext.selection : [explorerContext.stat];
        return deleteFiles(accessor.get(textfiles_1.ITextFileService), accessor.get(dialogs_1.IDialogService), accessor.get(configuration_1.IConfigurationService), accessor.get(files_2.IFileService), stats, true);
    };
    exports.deleteFileHandler = (accessor) => {
        const listService = accessor.get(listService_1.IListService);
        if (!listService.lastFocusedList) {
            return Promise.resolve();
        }
        const explorerContext = getContext(listService.lastFocusedList);
        const stats = explorerContext.selection.length > 1 ? explorerContext.selection : [explorerContext.stat];
        return deleteFiles(accessor.get(textfiles_1.ITextFileService), accessor.get(dialogs_1.IDialogService), accessor.get(configuration_1.IConfigurationService), accessor.get(files_2.IFileService), stats, false);
    };
    let pasteShouldMove = false;
    exports.copyFileHandler = (accessor) => {
        const listService = accessor.get(listService_1.IListService);
        if (!listService.lastFocusedList) {
            return;
        }
        const explorerContext = getContext(listService.lastFocusedList);
        const explorerService = accessor.get(files_1.IExplorerService);
        if (explorerContext.stat) {
            const stats = explorerContext.selection.length > 1 ? explorerContext.selection : [explorerContext.stat];
            explorerService.setToCopy(stats, false);
            pasteShouldMove = false;
        }
    };
    exports.cutFileHandler = (accessor) => {
        const listService = accessor.get(listService_1.IListService);
        if (!listService.lastFocusedList) {
            return;
        }
        const explorerContext = getContext(listService.lastFocusedList);
        const explorerService = accessor.get(files_1.IExplorerService);
        if (explorerContext.stat) {
            const stats = explorerContext.selection.length > 1 ? explorerContext.selection : [explorerContext.stat];
            explorerService.setToCopy(stats, true);
            pasteShouldMove = true;
        }
    };
    exports.DOWNLOAD_COMMAND_ID = 'explorer.download';
    const downloadFileHandler = (accessor) => {
        const listService = accessor.get(listService_1.IListService);
        if (!listService.lastFocusedList) {
            return;
        }
        const explorerContext = getContext(listService.lastFocusedList);
        const textFileService = accessor.get(textfiles_1.ITextFileService);
        if (explorerContext.stat) {
            const stats = explorerContext.selection.length > 1 ? explorerContext.selection : [explorerContext.stat];
            stats.forEach(async (s) => {
                await textFileService.saveAs(s.resource, undefined, { availableFileSystems: [network_1.Schemas.file] });
            });
        }
    };
    commands_1.CommandsRegistry.registerCommand({
        id: exports.DOWNLOAD_COMMAND_ID,
        handler: downloadFileHandler
    });
    exports.pasteFileHandler = async (accessor) => {
        const listService = accessor.get(listService_1.IListService);
        const clipboardService = accessor.get(clipboardService_1.IClipboardService);
        const explorerService = accessor.get(files_1.IExplorerService);
        const fileService = accessor.get(files_2.IFileService);
        const textFileService = accessor.get(textfiles_1.ITextFileService);
        const notificationService = accessor.get(notification_1.INotificationService);
        const editorService = accessor.get(editorService_1.IEditorService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        if (listService.lastFocusedList) {
            const explorerContext = getContext(listService.lastFocusedList);
            const toPaste = resources.distinctParents(clipboardService.readResources(), r => r);
            const element = explorerContext.stat || explorerService.roots[0];
            // Check if target is ancestor of pasted folder
            const stats = await Promise.all(toPaste.map(async (fileToPaste) => {
                if (element.resource.toString() !== fileToPaste.toString() && resources.isEqualOrParent(element.resource, fileToPaste)) {
                    throw new Error(nls.localize('fileIsAncestor', "File to paste is an ancestor of the destination folder"));
                }
                try {
                    const fileToPasteStat = await fileService.resolve(fileToPaste);
                    // Find target
                    let target;
                    if (element.resource.toString() === fileToPaste.toString()) {
                        target = element.parent;
                    }
                    else {
                        target = element.isDirectory ? element : element.parent;
                    }
                    const incrementalNaming = configurationService.getValue().explorer.incrementalNaming;
                    const targetFile = findValidPasteFileTarget(target, { resource: fileToPaste, isDirectory: fileToPasteStat.isDirectory, allowOverwrite: pasteShouldMove }, incrementalNaming);
                    // Move/Copy File
                    if (pasteShouldMove) {
                        return await textFileService.move(fileToPaste, targetFile);
                    }
                    else {
                        return await fileService.copy(fileToPaste, targetFile);
                    }
                }
                catch (e) {
                    onError(notificationService, new Error(nls.localize('fileDeleted', "File to paste was deleted or moved meanwhile. {0}", errors_1.getErrorMessage(e))));
                    return undefined;
                }
            }));
            if (pasteShouldMove) {
                // Cut is done. Make sure to clear cut state.
                explorerService.setToCopy([], false);
            }
            if (stats.length >= 1) {
                const stat = stats[0];
                if (stat && !stat.isDirectory && stats.length === 1) {
                    await editorService.openEditor({ resource: stat.resource, options: { pinned: true, preserveFocus: true } });
                }
                if (stat) {
                    await explorerService.select(stat.resource);
                }
            }
        }
    };
    exports.openFilePreserveFocusHandler = async (accessor) => {
        const listService = accessor.get(listService_1.IListService);
        const editorService = accessor.get(editorService_1.IEditorService);
        if (listService.lastFocusedList) {
            const explorerContext = getContext(listService.lastFocusedList);
            if (explorerContext.stat) {
                const stats = explorerContext.selection.length > 1 ? explorerContext.selection : [explorerContext.stat];
                await editorService.openEditors(stats.filter(s => !s.isDirectory).map(s => ({
                    resource: s.resource,
                    options: { preserveFocus: true }
                })));
            }
        }
    };
});
//# sourceMappingURL=fileActions.js.map