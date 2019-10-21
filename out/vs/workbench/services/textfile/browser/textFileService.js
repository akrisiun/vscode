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
define(["require", "exports", "vs/nls", "vs/base/common/errors", "vs/base/common/objects", "vs/base/common/event", "vs/base/common/platform", "vs/workbench/services/backup/common/backup", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/common/editor", "vs/platform/lifecycle/common/lifecycle", "vs/platform/workspace/common/workspace", "vs/platform/files/common/files", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/untitled/common/untitledEditorService", "vs/workbench/common/editor/untitledEditorModel", "vs/workbench/services/textfile/common/textFileEditorModelManager", "vs/platform/instantiation/common/instantiation", "vs/base/common/map", "vs/base/common/network", "vs/workbench/services/history/common/history", "vs/platform/contextkey/common/contextkey", "vs/editor/common/model/textModel", "vs/editor/common/services/modelService", "vs/platform/notification/common/notification", "vs/base/common/resources", "vs/platform/dialogs/common/dialogs", "vs/editor/common/services/modeService", "vs/workbench/services/editor/common/editorService", "vs/base/common/arrays", "vs/base/common/strings", "vs/editor/common/services/resourceConfiguration", "vs/editor/common/modes/modesRegistry"], function (require, exports, nls, errors, objects, event_1, platform, backup_1, textfiles_1, editor_1, lifecycle_1, workspace_1, files_1, configuration_1, lifecycle_2, environmentService_1, untitledEditorService_1, untitledEditorModel_1, textFileEditorModelManager_1, instantiation_1, map_1, network_1, history_1, contextkey_1, textModel_1, modelService_1, notification_1, resources_1, dialogs_1, modeService_1, editorService_1, arrays_1, strings_1, resourceConfiguration_1, modesRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * The workbench file service implementation implements the raw file service spec and adds additional methods on top.
     */
    let AbstractTextFileService = class AbstractTextFileService extends lifecycle_2.Disposable {
        constructor(contextService, fileService, untitledEditorService, lifecycleService, instantiationService, configurationService, modeService, modelService, environmentService, notificationService, backupFileService, historyService, contextKeyService, dialogService, fileDialogService, editorService, textResourceConfigurationService) {
            super();
            this.contextService = contextService;
            this.fileService = fileService;
            this.untitledEditorService = untitledEditorService;
            this.lifecycleService = lifecycleService;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.modeService = modeService;
            this.modelService = modelService;
            this.environmentService = environmentService;
            this.notificationService = notificationService;
            this.backupFileService = backupFileService;
            this.historyService = historyService;
            this.dialogService = dialogService;
            this.fileDialogService = fileDialogService;
            this.editorService = editorService;
            this.textResourceConfigurationService = textResourceConfigurationService;
            this._onAutoSaveConfigurationChange = this._register(new event_1.Emitter());
            this.onAutoSaveConfigurationChange = this._onAutoSaveConfigurationChange.event;
            this._onFilesAssociationChange = this._register(new event_1.Emitter());
            this.onFilesAssociationChange = this._onFilesAssociationChange.event;
            this._onWillMove = this._register(new event_1.Emitter());
            this.onWillMove = this._onWillMove.event;
            this._models = this._register(instantiationService.createInstance(textFileEditorModelManager_1.TextFileEditorModelManager));
            this.autoSaveContext = textfiles_1.AutoSaveContext.bindTo(contextKeyService);
            const configuration = configurationService.getValue();
            this.currentFilesAssociationConfig = configuration && configuration.files && configuration.files.associations;
            this.onFilesConfigurationChange(configuration);
            this.registerListeners();
        }
        get models() { return this._models; }
        //#region event handling
        registerListeners() {
            // Lifecycle
            this.lifecycleService.onBeforeShutdown(event => event.veto(this.onBeforeShutdown(event.reason)));
            this.lifecycleService.onShutdown(this.dispose, this);
            // Files configuration changes
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('files')) {
                    this.onFilesConfigurationChange(this.configurationService.getValue());
                }
            }));
        }
        onBeforeShutdown(reason) {
            // Dirty files need treatment on shutdown
            const dirty = this.getDirty();
            if (dirty.length) {
                // If auto save is enabled, save all files and then check again for dirty files
                // We DO NOT run any save participant if we are in the shutdown phase for performance reasons
                if (this.getAutoSaveMode() !== 0 /* OFF */) {
                    return this.saveAll(false /* files only */, { skipSaveParticipants: true }).then(() => {
                        // If we still have dirty files, we either have untitled ones or files that cannot be saved
                        const remainingDirty = this.getDirty();
                        if (remainingDirty.length) {
                            return this.handleDirtyBeforeShutdown(remainingDirty, reason);
                        }
                        return false;
                    });
                }
                // Auto save is not enabled
                return this.handleDirtyBeforeShutdown(dirty, reason);
            }
            // No dirty files: no veto
            return this.noVeto({ cleanUpBackups: true });
        }
        handleDirtyBeforeShutdown(dirty, reason) {
            // If hot exit is enabled, backup dirty files and allow to exit without confirmation
            if (this.isHotExitEnabled) {
                return this.backupBeforeShutdown(dirty, reason).then(didBackup => {
                    if (didBackup) {
                        return this.noVeto({ cleanUpBackups: false }); // no veto and no backup cleanup (since backup was successful)
                    }
                    // since a backup did not happen, we have to confirm for the dirty files now
                    return this.confirmBeforeShutdown();
                }, error => {
                    this.notificationService.error(nls.localize('files.backup.failSave', "Files that are dirty could not be written to the backup location (Error: {0}). Try saving your files first and then exit.", error.message));
                    return true; // veto, the backups failed
                });
            }
            // Otherwise just confirm from the user what to do with the dirty files
            return this.confirmBeforeShutdown();
        }
        async backupBeforeShutdown(dirtyToBackup, reason) {
            // When quit is requested skip the confirm callback and attempt to backup all workspaces.
            // When quit is not requested the confirm callback should be shown when the window being
            // closed is the only VS Code window open, except for on Mac where hot exit is only
            // ever activated when quit is requested.
            let doBackup;
            switch (reason) {
                case 1 /* CLOSE */:
                    if (this.contextService.getWorkbenchState() !== 1 /* EMPTY */ && this.configuredHotExit === files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE) {
                        doBackup = true; // backup if a folder is open and onExitAndWindowClose is configured
                    }
                    else if (await this.getWindowCount() > 1 || platform.isMacintosh) {
                        doBackup = false; // do not backup if a window is closed that does not cause quitting of the application
                    }
                    else {
                        doBackup = true; // backup if last window is closed on win/linux where the application quits right after
                    }
                    break;
                case 2 /* QUIT */:
                    doBackup = true; // backup because next start we restore all backups
                    break;
                case 3 /* RELOAD */:
                    doBackup = true; // backup because after window reload, backups restore
                    break;
                case 4 /* LOAD */:
                    if (this.contextService.getWorkbenchState() !== 1 /* EMPTY */ && this.configuredHotExit === files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE) {
                        doBackup = true; // backup if a folder is open and onExitAndWindowClose is configured
                    }
                    else {
                        doBackup = false; // do not backup because we are switching contexts
                    }
                    break;
            }
            if (!doBackup) {
                return false;
            }
            await this.backupAll(dirtyToBackup);
            return true;
        }
        backupAll(dirtyToBackup) {
            // split up between files and untitled
            const filesToBackup = [];
            const untitledToBackup = [];
            dirtyToBackup.forEach(dirty => {
                if (this.fileService.canHandleResource(dirty)) {
                    const model = this.models.get(dirty);
                    if (model) {
                        filesToBackup.push(model);
                    }
                }
                else if (dirty.scheme === network_1.Schemas.untitled) {
                    untitledToBackup.push(dirty);
                }
            });
            return this.doBackupAll(filesToBackup, untitledToBackup);
        }
        async doBackupAll(dirtyFileModels, untitledResources) {
            // Handle file resources first
            await Promise.all(dirtyFileModels.map(model => model.backup()));
            // Handle untitled resources
            await Promise.all(untitledResources
                .filter(untitled => this.untitledEditorService.exists(untitled))
                .map(async (untitled) => (await this.untitledEditorService.loadOrCreate({ resource: untitled })).backup()));
        }
        async confirmBeforeShutdown() {
            const confirm = await this.confirmSave();
            // Save
            if (confirm === editor_1.ConfirmResult.SAVE) {
                const result = await this.saveAll(true /* includeUntitled */, { skipSaveParticipants: true });
                if (result.results.some(r => !r.success)) {
                    return true; // veto if some saves failed
                }
                return this.noVeto({ cleanUpBackups: true });
            }
            // Don't Save
            else if (confirm === editor_1.ConfirmResult.DONT_SAVE) {
                // Make sure to revert untitled so that they do not restore
                // see https://github.com/Microsoft/vscode/issues/29572
                this.untitledEditorService.revertAll();
                return this.noVeto({ cleanUpBackups: true });
            }
            // Cancel
            else if (confirm === editor_1.ConfirmResult.CANCEL) {
                return true; // veto
            }
            return false;
        }
        noVeto(options) {
            if (!options.cleanUpBackups) {
                return false;
            }
            if (this.lifecycleService.phase < 3 /* Restored */) {
                return false; // if editors have not restored, we are not up to speed with backups and thus should not clean them
            }
            return this.cleanupBackupsBeforeShutdown().then(() => false, () => false);
        }
        async cleanupBackupsBeforeShutdown() {
            if (this.environmentService.isExtensionDevelopment) {
                return;
            }
            await this.backupFileService.discardAllWorkspaceBackups();
        }
        onFilesConfigurationChange(configuration) {
            const wasAutoSaveEnabled = (this.getAutoSaveMode() !== 0 /* OFF */);
            const autoSaveMode = (configuration && configuration.files && configuration.files.autoSave) || files_1.AutoSaveConfiguration.OFF;
            this.autoSaveContext.set(autoSaveMode);
            switch (autoSaveMode) {
                case files_1.AutoSaveConfiguration.AFTER_DELAY:
                    this.configuredAutoSaveDelay = configuration && configuration.files && configuration.files.autoSaveDelay;
                    this.configuredAutoSaveOnFocusChange = false;
                    this.configuredAutoSaveOnWindowChange = false;
                    break;
                case files_1.AutoSaveConfiguration.ON_FOCUS_CHANGE:
                    this.configuredAutoSaveDelay = undefined;
                    this.configuredAutoSaveOnFocusChange = true;
                    this.configuredAutoSaveOnWindowChange = false;
                    break;
                case files_1.AutoSaveConfiguration.ON_WINDOW_CHANGE:
                    this.configuredAutoSaveDelay = undefined;
                    this.configuredAutoSaveOnFocusChange = false;
                    this.configuredAutoSaveOnWindowChange = true;
                    break;
                default:
                    this.configuredAutoSaveDelay = undefined;
                    this.configuredAutoSaveOnFocusChange = false;
                    this.configuredAutoSaveOnWindowChange = false;
                    break;
            }
            // Emit as event
            this._onAutoSaveConfigurationChange.fire(this.getAutoSaveConfiguration());
            // save all dirty when enabling auto save
            if (!wasAutoSaveEnabled && this.getAutoSaveMode() !== 0 /* OFF */) {
                this.saveAll();
            }
            // Check for change in files associations
            const filesAssociation = configuration && configuration.files && configuration.files.associations;
            if (!objects.equals(this.currentFilesAssociationConfig, filesAssociation)) {
                this.currentFilesAssociationConfig = filesAssociation;
                this._onFilesAssociationChange.fire();
            }
            // Hot exit
            const hotExitMode = configuration && configuration.files && configuration.files.hotExit;
            if (hotExitMode === files_1.HotExitConfiguration.OFF || hotExitMode === files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE) {
                this.configuredHotExit = hotExitMode;
            }
            else {
                this.configuredHotExit = files_1.HotExitConfiguration.ON_EXIT;
            }
        }
        //#endregion
        //#region primitives (read, create, move, delete, update)
        async read(resource, options) {
            const content = await this.fileService.readFile(resource, options);
            // in case of acceptTextOnly: true, we check the first
            // chunk for possibly being binary by looking for 0-bytes
            // we limit this check to the first 512 bytes
            this.validateBinary(content.value, options);
            return Object.assign(Object.assign({}, content), { encoding: 'utf8', value: content.value.toString() });
        }
        async readStream(resource, options) {
            const stream = await this.fileService.readFileStream(resource, options);
            // in case of acceptTextOnly: true, we check the first
            // chunk for possibly being binary by looking for 0-bytes
            // we limit this check to the first 512 bytes
            let checkedForBinary = false;
            const throwOnBinary = (data) => {
                if (!checkedForBinary) {
                    checkedForBinary = true;
                    this.validateBinary(data, options);
                }
                return undefined;
            };
            return Object.assign(Object.assign({}, stream), { encoding: 'utf8', value: await textModel_1.createTextBufferFactoryFromStream(stream.value, undefined, options && options.acceptTextOnly ? throwOnBinary : undefined) });
        }
        validateBinary(buffer, options) {
            if (!options || !options.acceptTextOnly) {
                return; // no validation needed
            }
            // in case of acceptTextOnly: true, we check the first
            // chunk for possibly being binary by looking for 0-bytes
            // we limit this check to the first 512 bytes
            for (let i = 0; i < buffer.byteLength && i < 512; i++) {
                if (buffer.readUInt8(i) === 0) {
                    throw new textfiles_1.TextFileOperationError(nls.localize('fileBinaryError', "File seems to be binary and cannot be opened as text"), 0 /* FILE_IS_BINARY */, options);
                }
            }
        }
        async create(resource, value, options) {
            const stat = await this.doCreate(resource, value, options);
            // If we had an existing model for the given resource, load
            // it again to make sure it is up to date with the contents
            // we just wrote into the underlying resource by calling
            // revert()
            const existingModel = this.models.get(resource);
            if (existingModel && !existingModel.isDisposed()) {
                await existingModel.revert();
            }
            return stat;
        }
        doCreate(resource, value, options) {
            return this.fileService.createFile(resource, textfiles_1.toBufferOrReadable(value), options);
        }
        async write(resource, value, options) {
            return this.fileService.writeFile(resource, textfiles_1.toBufferOrReadable(value), options);
        }
        async delete(resource, options) {
            const dirtyFiles = this.getDirty().filter(dirty => resources_1.isEqualOrParent(dirty, resource));
            await this.revertAll(dirtyFiles, { soft: true });
            return this.fileService.del(resource, options);
        }
        async move(source, target, overwrite) {
            // await onWillMove event joiners
            await this.notifyOnWillMove(source, target);
            // find all models that related to either source or target (can be many if resource is a folder)
            const sourceModels = [];
            const conflictingModels = [];
            for (const model of this.getFileModels()) {
                const resource = model.getResource();
                if (resources_1.isEqualOrParent(resource, target, false /* do not ignorecase, see https://github.com/Microsoft/vscode/issues/56384 */)) {
                    conflictingModels.push(model);
                }
                if (resources_1.isEqualOrParent(resource, source)) {
                    sourceModels.push(model);
                }
            }
            const modelsToRestore = [];
            for (const sourceModel of sourceModels) {
                const sourceModelResource = sourceModel.getResource();
                // If the source is the actual model, just use target as new resource
                let modelToRestoreResource;
                if (resources_1.isEqual(sourceModelResource, source)) {
                    modelToRestoreResource = target;
                }
                // Otherwise a parent folder of the source is being moved, so we need
                // to compute the target resource based on that
                else {
                    modelToRestoreResource = resources_1.joinPath(target, sourceModelResource.path.substr(source.path.length + 1));
                }
                const modelToRestore = { resource: modelToRestoreResource };
                if (sourceModel.isDirty()) {
                    modelToRestore.snapshot = sourceModel.createSnapshot();
                }
                modelsToRestore.push(modelToRestore);
            }
            // in order to move, we need to soft revert all dirty models,
            // both from the source as well as the target if any
            const dirtyModels = [...sourceModels, ...conflictingModels].filter(model => model.isDirty());
            await this.revertAll(dirtyModels.map(dirtyModel => dirtyModel.getResource()), { soft: true });
            // now we can rename the source to target via file operation
            let stat;
            try {
                stat = await this.fileService.move(source, target, overwrite);
            }
            catch (error) {
                // in case of any error, ensure to set dirty flag back
                dirtyModels.forEach(dirtyModel => dirtyModel.makeDirty());
                throw error;
            }
            // finally, restore models that we had loaded previously
            await Promise.all(modelsToRestore.map(async (modelToRestore) => {
                // restore the model, forcing a reload. this is important because
                // we know the file has changed on disk after the move and the
                // model might have still existed with the previous state. this
                // ensures we are not tracking a stale state.
                const restoredModel = await this.models.loadOrCreate(modelToRestore.resource, { reload: { async: false } });
                // restore previous dirty content if any and ensure to mark
                // the model as dirty
                if (modelToRestore.snapshot && restoredModel.isResolved()) {
                    this.modelService.updateModel(restoredModel.textEditorModel, textModel_1.createTextBufferFactoryFromSnapshot(modelToRestore.snapshot));
                    restoredModel.makeDirty();
                }
            }));
            return stat;
        }
        async notifyOnWillMove(source, target) {
            const waitForPromises = [];
            // fire event
            this._onWillMove.fire({
                oldResource: source,
                newResource: target,
                waitUntil(promise) {
                    waitForPromises.push(promise.then(undefined, errors.onUnexpectedError));
                }
            });
            // prevent async waitUntil-calls
            Object.freeze(waitForPromises);
            await Promise.all(waitForPromises);
        }
        //#endregion
        //#region save/revert
        async save(resource, options) {
            // Run a forced save if we detect the file is not dirty so that save participants can still run
            if (options && options.force && this.fileService.canHandleResource(resource) && !this.isDirty(resource)) {
                const model = this._models.get(resource);
                if (model) {
                    options.reason = 1 /* EXPLICIT */;
                    await model.save(options);
                    return !model.isDirty();
                }
            }
            const result = await this.saveAll([resource], options);
            return result.results.length === 1 && !!result.results[0].success;
        }
        async confirmSave(resources) {
            if (this.environmentService.isExtensionDevelopment) {
                if (!this.environmentService.args['extension-development-confirm-save']) {
                    return editor_1.ConfirmResult.DONT_SAVE; // no veto when we are in extension dev mode because we cannot assume we run interactive (e.g. tests)
                }
            }
            const resourcesToConfirm = this.getDirty(resources);
            if (resourcesToConfirm.length === 0) {
                return editor_1.ConfirmResult.DONT_SAVE;
            }
            return promptSave(this.dialogService, resourcesToConfirm);
        }
        async confirmOverwrite(resource) {
            const confirm = {
                message: nls.localize('confirmOverwrite', "'{0}' already exists. Do you want to replace it?", resources_1.basename(resource)),
                detail: nls.localize('irreversible', "A file or folder with the same name already exists in the folder {0}. Replacing it will overwrite its current contents.", resources_1.basename(resources_1.dirname(resource))),
                primaryButton: nls.localize({ key: 'replaceButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Replace"),
                type: 'warning'
            };
            return (await this.dialogService.confirm(confirm)).confirmed;
        }
        saveAll(arg1, options) {
            // get all dirty
            let toSave = [];
            if (Array.isArray(arg1)) {
                toSave = this.getDirty(arg1);
            }
            else {
                toSave = this.getDirty();
            }
            // split up between files and untitled
            const filesToSave = [];
            const untitledToSave = [];
            toSave.forEach(resourceToSave => {
                if ((Array.isArray(arg1) || arg1 === true /* includeUntitled */) && resourceToSave.scheme === network_1.Schemas.untitled) {
                    untitledToSave.push(resourceToSave);
                }
                else {
                    filesToSave.push(resourceToSave);
                }
            });
            return this.doSaveAll(filesToSave, untitledToSave, options);
        }
        async doSaveAll(fileResources, untitledResources, options) {
            // Handle files first that can just be saved
            const result = await this.doSaveAllFiles(fileResources, options);
            // Preflight for untitled to handle cancellation from the dialog
            const targetsForUntitled = [];
            for (const untitled of untitledResources) {
                if (this.untitledEditorService.exists(untitled)) {
                    let targetUri;
                    // Untitled with associated file path don't need to prompt
                    if (this.untitledEditorService.hasAssociatedFilePath(untitled)) {
                        targetUri = resources_1.toLocalResource(untitled, this.environmentService.configuration.remoteAuthority);
                    }
                    // Otherwise ask user
                    else {
                        const targetPath = await this.promptForPath(untitled, this.suggestFileName(untitled));
                        if (!targetPath) {
                            return { results: [...fileResources, ...untitledResources].map(r => ({ source: r })) };
                        }
                        targetUri = targetPath;
                    }
                    targetsForUntitled.push(targetUri);
                }
            }
            // Handle untitled
            await Promise.all(targetsForUntitled.map(async (target, index) => {
                const uri = await this.saveAs(untitledResources[index], target);
                result.results.push({
                    source: untitledResources[index],
                    target: uri,
                    success: !!uri
                });
            }));
            return result;
        }
        async promptForPath(resource, defaultUri, availableFileSystems) {
            // Help user to find a name for the file by opening it first
            await this.editorService.openEditor({ resource, options: { revealIfOpened: true, preserveFocus: true } });
            return this.fileDialogService.pickFileToSave(this.getSaveDialogOptions(defaultUri, availableFileSystems));
        }
        getSaveDialogOptions(defaultUri, availableFileSystems) {
            const options = {
                defaultUri,
                title: nls.localize('saveAsTitle', "Save As"),
                availableFileSystems,
            };
            // Filters are only enabled on Windows where they work properly
            if (!platform.isWindows) {
                return options;
            }
            // Build the file filter by using our known languages
            const ext = defaultUri ? resources_1.extname(defaultUri) : undefined;
            let matchingFilter;
            const filters = arrays_1.coalesce(this.modeService.getRegisteredLanguageNames().map(languageName => {
                const extensions = this.modeService.getExtensions(languageName);
                if (!extensions || !extensions.length) {
                    return null;
                }
                const filter = { name: languageName, extensions: extensions.slice(0, 10).map(e => strings_1.trim(e, '.')) };
                if (ext && extensions.indexOf(ext) >= 0) {
                    matchingFilter = filter;
                    return null; // matching filter will be added last to the top
                }
                return filter;
            }));
            // Filters are a bit weird on Windows, based on having a match or not:
            // Match: we put the matching filter first so that it shows up selected and the all files last
            // No match: we put the all files filter first
            const allFilesFilter = { name: nls.localize('allFiles', "All Files"), extensions: ['*'] };
            if (matchingFilter) {
                filters.unshift(matchingFilter);
                filters.unshift(allFilesFilter);
            }
            else {
                filters.unshift(allFilesFilter);
            }
            // Allow to save file without extension
            filters.push({ name: nls.localize('noExt', "No Extension"), extensions: [''] });
            options.filters = filters;
            return options;
        }
        async doSaveAllFiles(resources, options = Object.create(null)) {
            const dirtyFileModels = this.getDirtyFileModels(Array.isArray(resources) ? resources : undefined /* Save All */)
                .filter(model => {
                if ((model.hasState(4 /* CONFLICT */) || model.hasState(6 /* ERROR */)) && (options.reason === 2 /* AUTO */ || options.reason === 3 /* FOCUS_CHANGE */ || options.reason === 4 /* WINDOW_CHANGE */)) {
                    return false; // if model is in save conflict or error, do not save unless save reason is explicit or not provided at all
                }
                return true;
            });
            const mapResourceToResult = new map_1.ResourceMap();
            dirtyFileModels.forEach(m => {
                mapResourceToResult.set(m.getResource(), {
                    source: m.getResource()
                });
            });
            await Promise.all(dirtyFileModels.map(async (model) => {
                await model.save(options);
                if (!model.isDirty()) {
                    const result = mapResourceToResult.get(model.getResource());
                    if (result) {
                        result.success = true;
                    }
                }
            }));
            return { results: mapResourceToResult.values() };
        }
        getFileModels(arg1) {
            if (Array.isArray(arg1)) {
                const models = [];
                arg1.forEach(resource => {
                    models.push(...this.getFileModels(resource));
                });
                return models;
            }
            return this._models.getAll(arg1);
        }
        getDirtyFileModels(resources) {
            return this.getFileModels(resources).filter(model => model.isDirty());
        }
        async saveAs(resource, targetResource, options) {
            // Get to target resource
            if (!targetResource) {
                let dialogPath = resource;
                if (resource.scheme === network_1.Schemas.untitled) {
                    dialogPath = this.suggestFileName(resource);
                }
                targetResource = await this.promptForPath(resource, dialogPath, options ? options.availableFileSystems : undefined);
            }
            if (!targetResource) {
                return; // user canceled
            }
            // Just save if target is same as models own resource
            if (resource.toString() === targetResource.toString()) {
                await this.save(resource, options);
                return resource;
            }
            // Do it
            return this.doSaveAs(resource, targetResource, options);
        }
        async doSaveAs(resource, target, options) {
            // Retrieve text model from provided resource if any
            let model;
            if (this.fileService.canHandleResource(resource)) {
                model = this._models.get(resource);
            }
            else if (resource.scheme === network_1.Schemas.untitled && this.untitledEditorService.exists(resource)) {
                model = await this.untitledEditorService.loadOrCreate({ resource });
            }
            // We have a model: Use it (can be null e.g. if this file is binary and not a text file or was never opened before)
            let result;
            if (model) {
                result = await this.doSaveTextFileAs(model, resource, target, options);
            }
            // Otherwise we can only copy
            else {
                await this.fileService.copy(resource, target);
                result = true;
            }
            // Return early if the operation was not running
            if (!result) {
                return target;
            }
            // Revert the source
            await this.revert(resource);
            return target;
        }
        async doSaveTextFileAs(sourceModel, resource, target, options) {
            // Prefer an existing model if it is already loaded for the given target resource
            let targetExists = false;
            let targetModel = this.models.get(target);
            if (targetModel && targetModel.isResolved()) {
                targetExists = true;
            }
            // Otherwise create the target file empty if it does not exist already and resolve it from there
            else {
                targetExists = await this.fileService.exists(target);
                // create target model adhoc if file does not exist yet
                if (!targetExists) {
                    await this.create(target, '');
                }
                targetModel = await this.models.loadOrCreate(target);
            }
            try {
                // Confirm to overwrite if we have an untitled file with associated file where
                // the file actually exists on disk and we are instructed to save to that file
                // path. This can happen if the file was created after the untitled file was opened.
                // See https://github.com/Microsoft/vscode/issues/67946
                let write;
                if (sourceModel instanceof untitledEditorModel_1.UntitledEditorModel && sourceModel.hasAssociatedFilePath && targetExists && resources_1.isEqual(target, resources_1.toLocalResource(sourceModel.getResource(), this.environmentService.configuration.remoteAuthority))) {
                    write = await this.confirmOverwrite(target);
                }
                else {
                    write = true;
                }
                if (!write) {
                    return false;
                }
                // take over model value, encoding and mode (only if more specific) from source model
                targetModel.updatePreferredEncoding(sourceModel.getEncoding());
                if (sourceModel.isResolved() && targetModel.isResolved()) {
                    this.modelService.updateModel(targetModel.textEditorModel, textModel_1.createTextBufferFactoryFromSnapshot(sourceModel.createSnapshot()));
                    const sourceMode = sourceModel.textEditorModel.getLanguageIdentifier();
                    const targetMode = targetModel.textEditorModel.getLanguageIdentifier();
                    if (sourceMode.language !== modesRegistry_1.PLAINTEXT_MODE_ID && targetMode.language === modesRegistry_1.PLAINTEXT_MODE_ID) {
                        targetModel.textEditorModel.setMode(sourceMode); // only use if more specific than plain/text
                    }
                }
                // save model
                await targetModel.save(options);
                return true;
            }
            catch (error) {
                // binary model: delete the file and run the operation again
                if (error.textFileOperationResult === 0 /* FILE_IS_BINARY */ ||
                    error.fileOperationResult === 7 /* FILE_TOO_LARGE */) {
                    await this.fileService.del(target);
                    return this.doSaveTextFileAs(sourceModel, resource, target, options);
                }
                throw error;
            }
        }
        suggestFileName(untitledResource) {
            const untitledFileName = this.untitledEditorService.suggestFileName(untitledResource);
            const remoteAuthority = this.environmentService.configuration.remoteAuthority;
            const schemeFilter = remoteAuthority ? network_1.Schemas.vscodeRemote : network_1.Schemas.file;
            const lastActiveFile = this.historyService.getLastActiveFile(schemeFilter);
            if (lastActiveFile) {
                const lastDir = resources_1.dirname(lastActiveFile);
                return resources_1.joinPath(lastDir, untitledFileName);
            }
            const lastActiveFolder = this.historyService.getLastActiveWorkspaceRoot(schemeFilter);
            if (lastActiveFolder) {
                return resources_1.joinPath(lastActiveFolder, untitledFileName);
            }
            return untitledResource.with({ path: untitledFileName });
        }
        async revert(resource, options) {
            const result = await this.revertAll([resource], options);
            return result.results.length === 1 && !!result.results[0].success;
        }
        async revertAll(resources, options) {
            // Revert files first
            const revertOperationResult = await this.doRevertAllFiles(resources, options);
            // Revert untitled
            const untitledReverted = this.untitledEditorService.revertAll(resources);
            untitledReverted.forEach(untitled => revertOperationResult.results.push({ source: untitled, success: true }));
            return revertOperationResult;
        }
        async doRevertAllFiles(resources, options) {
            const fileModels = options && options.force ? this.getFileModels(resources) : this.getDirtyFileModels(resources);
            const mapResourceToResult = new map_1.ResourceMap();
            fileModels.forEach(m => {
                mapResourceToResult.set(m.getResource(), {
                    source: m.getResource()
                });
            });
            await Promise.all(fileModels.map(async (model) => {
                try {
                    await model.revert(options && options.soft);
                    if (!model.isDirty()) {
                        const result = mapResourceToResult.get(model.getResource());
                        if (result) {
                            result.success = true;
                        }
                    }
                }
                catch (error) {
                    // FileNotFound means the file got deleted meanwhile, so still record as successful revert
                    if (error.fileOperationResult === 1 /* FILE_NOT_FOUND */) {
                        const result = mapResourceToResult.get(model.getResource());
                        if (result) {
                            result.success = true;
                        }
                    }
                    // Otherwise bubble up the error
                    else {
                        throw error;
                    }
                }
            }));
            return { results: mapResourceToResult.values() };
        }
        getDirty(resources) {
            // Collect files
            const dirty = this.getDirtyFileModels(resources).map(m => m.getResource());
            // Add untitled ones
            dirty.push(...this.untitledEditorService.getDirty(resources));
            return dirty;
        }
        isDirty(resource) {
            // Check for dirty file
            if (this._models.getAll(resource).some(model => model.isDirty())) {
                return true;
            }
            // Check for dirty untitled
            return this.untitledEditorService.getDirty().some(dirty => !resource || dirty.toString() === resource.toString());
        }
        //#endregion
        //#region config
        getAutoSaveMode() {
            if (this.configuredAutoSaveOnFocusChange) {
                return 3 /* ON_FOCUS_CHANGE */;
            }
            if (this.configuredAutoSaveOnWindowChange) {
                return 4 /* ON_WINDOW_CHANGE */;
            }
            if (this.configuredAutoSaveDelay && this.configuredAutoSaveDelay > 0) {
                return this.configuredAutoSaveDelay <= 1000 ? 1 /* AFTER_SHORT_DELAY */ : 2 /* AFTER_LONG_DELAY */;
            }
            return 0 /* OFF */;
        }
        getAutoSaveConfiguration() {
            return {
                autoSaveDelay: this.configuredAutoSaveDelay && this.configuredAutoSaveDelay > 0 ? this.configuredAutoSaveDelay : undefined,
                autoSaveFocusChange: !!this.configuredAutoSaveOnFocusChange,
                autoSaveApplicationChange: !!this.configuredAutoSaveOnWindowChange
            };
        }
        get isHotExitEnabled() {
            return !this.environmentService.isExtensionDevelopment && this.configuredHotExit !== files_1.HotExitConfiguration.OFF;
        }
        //#endregion
        dispose() {
            // Clear all caches
            this._models.clear();
            super.dispose();
        }
    };
    AbstractTextFileService = __decorate([
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
        __param(16, resourceConfiguration_1.ITextResourceConfigurationService)
    ], AbstractTextFileService);
    exports.AbstractTextFileService = AbstractTextFileService;
    async function promptSave(dialogService, resourcesToConfirm) {
        const message = resourcesToConfirm.length === 1
            ? nls.localize('saveChangesMessage', "Do you want to save the changes you made to {0}?", resources_1.basename(resourcesToConfirm[0]))
            : dialogs_1.getConfirmMessage(nls.localize('saveChangesMessages', "Do you want to save the changes to the following {0} files?", resourcesToConfirm.length), resourcesToConfirm);
        const buttons = [
            resourcesToConfirm.length > 1 ? nls.localize({ key: 'saveAll', comment: ['&& denotes a mnemonic'] }, "&&Save All") : nls.localize({ key: 'save', comment: ['&& denotes a mnemonic'] }, "&&Save"),
            nls.localize({ key: 'dontSave', comment: ['&& denotes a mnemonic'] }, "Do&&n't Save"),
            nls.localize('cancel', "Cancel")
        ];
        const { choice } = await dialogService.show(notification_1.Severity.Warning, message, buttons, {
            cancelId: 2,
            detail: nls.localize('saveChangesDetail', "Your changes will be lost if you don't save them.")
        });
        switch (choice) {
            case 0: return editor_1.ConfirmResult.SAVE;
            case 1: return editor_1.ConfirmResult.DONT_SAVE;
            default: return editor_1.ConfirmResult.CANCEL;
        }
    }
    exports.promptSave = promptSave;
});
//# sourceMappingURL=textFileService.js.map