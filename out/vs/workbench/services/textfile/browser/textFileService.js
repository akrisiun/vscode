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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/workbench/services/textfile/common/textfiles", "vs/platform/lifecycle/common/lifecycle", "vs/platform/files/common/files", "vs/base/common/lifecycle", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/untitled/common/untitledTextEditorService", "vs/workbench/services/untitled/common/untitledTextEditorModel", "vs/workbench/services/textfile/common/textFileEditorModelManager", "vs/platform/instantiation/common/instantiation", "vs/base/common/network", "vs/editor/common/model/textModel", "vs/editor/common/services/modelService", "vs/base/common/resources", "vs/platform/dialogs/common/dialogs", "vs/editor/common/services/textResourceConfigurationService", "vs/editor/common/modes/modesRegistry", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/base/common/cancellation", "vs/editor/common/services/resolverService", "vs/workbench/common/editor/textEditorModel", "vs/editor/browser/services/codeEditorService", "vs/base/common/mime", "vs/workbench/services/path/common/pathService", "vs/base/common/extpath", "vs/workbench/services/workingCopy/common/workingCopyFileService"], function (require, exports, nls, event_1, textfiles_1, lifecycle_1, files_1, lifecycle_2, environmentService_1, untitledTextEditorService_1, untitledTextEditorModel_1, textFileEditorModelManager_1, instantiation_1, network_1, textModel_1, modelService_1, resources_1, dialogs_1, textResourceConfigurationService_1, modesRegistry_1, filesConfigurationService_1, cancellation_1, resolverService_1, textEditorModel_1, codeEditorService_1, mime_1, pathService_1, extpath_1, workingCopyFileService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractTextFileService = void 0;
    /**
     * The workbench file service implementation implements the raw file service spec and adds additional methods on top.
     */
    let AbstractTextFileService = /** @class */ (() => {
        let AbstractTextFileService = class AbstractTextFileService extends lifecycle_2.Disposable {
            constructor(fileService, untitledTextEditorService, lifecycleService, instantiationService, modelService, environmentService, dialogService, fileDialogService, textResourceConfigurationService, filesConfigurationService, textModelService, codeEditorService, pathService, workingCopyFileService) {
                super();
                this.fileService = fileService;
                this.untitledTextEditorService = untitledTextEditorService;
                this.lifecycleService = lifecycleService;
                this.instantiationService = instantiationService;
                this.modelService = modelService;
                this.environmentService = environmentService;
                this.dialogService = dialogService;
                this.fileDialogService = fileDialogService;
                this.textResourceConfigurationService = textResourceConfigurationService;
                this.filesConfigurationService = filesConfigurationService;
                this.textModelService = textModelService;
                this.codeEditorService = codeEditorService;
                this.pathService = pathService;
                this.workingCopyFileService = workingCopyFileService;
                //#region events
                this._onDidCreateTextFile = this._register(new event_1.AsyncEmitter());
                this.onDidCreateTextFile = this._onDidCreateTextFile.event;
                //#endregion
                this.files = this._register(this.instantiationService.createInstance(textFileEditorModelManager_1.TextFileEditorModelManager));
                this.untitled = this.untitledTextEditorService;
                this.registerListeners();
            }
            registerListeners() {
                // Lifecycle
                this.lifecycleService.onShutdown(this.dispose, this);
            }
            //#region text file read / write / create
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
                return Object.assign(Object.assign({}, stream), { encoding: 'utf8', value: await textModel_1.createTextBufferFactoryFromStream(stream.value, undefined, (options === null || options === void 0 ? void 0 : options.acceptTextOnly) ? throwOnBinary : undefined) });
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
                // file operation participation
                await this.workingCopyFileService.runFileOperationParticipants(resource, undefined, 0 /* CREATE */);
                // create file on disk
                const stat = await this.doCreate(resource, value, options);
                // If we had an existing model for the given resource, load
                // it again to make sure it is up to date with the contents
                // we just wrote into the underlying resource by calling
                // revert()
                const existingModel = this.files.get(resource);
                if (existingModel && !existingModel.isDisposed()) {
                    await existingModel.revert();
                }
                // after event
                await this._onDidCreateTextFile.fireAsync({ resource }, cancellation_1.CancellationToken.None);
                return stat;
            }
            doCreate(resource, value, options) {
                return this.fileService.createFile(resource, textfiles_1.toBufferOrReadable(value), options);
            }
            async write(resource, value, options) {
                return this.fileService.writeFile(resource, textfiles_1.toBufferOrReadable(value), options);
            }
            //#endregion
            //#region save
            async save(resource, options) {
                // Untitled
                if (resource.scheme === network_1.Schemas.untitled) {
                    const model = this.untitled.get(resource);
                    if (model) {
                        let targetUri;
                        // Untitled with associated file path don't need to prompt
                        if (model.hasAssociatedFilePath) {
                            targetUri = await this.suggestSavePath(resource);
                        }
                        // Otherwise ask user
                        else {
                            targetUri = await this.fileDialogService.pickFileToSave(await this.suggestSavePath(resource), options === null || options === void 0 ? void 0 : options.availableFileSystems);
                        }
                        // Save as if target provided
                        if (targetUri) {
                            return this.saveAs(resource, targetUri, options);
                        }
                    }
                }
                // File
                else {
                    const model = this.files.get(resource);
                    if (model) {
                        return await model.save(options) ? resource : undefined;
                    }
                }
                return undefined;
            }
            async saveAs(source, target, options) {
                // Get to target resource
                if (!target) {
                    target = await this.fileDialogService.pickFileToSave(await this.suggestSavePath(source), options === null || options === void 0 ? void 0 : options.availableFileSystems);
                }
                if (!target) {
                    return; // user canceled
                }
                // Just save if target is same as models own resource
                if (source.toString() === target.toString()) {
                    return this.save(source, options);
                }
                // Do it
                return this.doSaveAs(source, target, options);
            }
            async doSaveAs(source, target, options) {
                let success = false;
                // If the source is an existing text file model, we can directly
                // use that model to copy the contents to the target destination
                const textFileModel = this.files.get(source);
                if (textFileModel && textFileModel.isResolved()) {
                    success = await this.doSaveAsTextFile(textFileModel, source, target, options);
                }
                // Otherwise if the source can be handled by the file service
                // we can simply invoke the copy() function to save as
                else if (this.fileService.canHandleResource(source)) {
                    await this.fileService.copy(source, target);
                    success = true;
                }
                // Next, if the source does not seem to be a file, we try to
                // resolve a text model from the resource to get at the
                // contents and additional meta data (e.g. encoding).
                else if (this.textModelService.hasTextModelContentProvider(source.scheme)) {
                    const modelReference = await this.textModelService.createModelReference(source);
                    success = await this.doSaveAsTextFile(modelReference.object, source, target, options);
                    modelReference.dispose(); // free up our use of the reference
                }
                // Finally we simply check if we can find a editor model that
                // would give us access to the contents.
                else {
                    const textModel = this.modelService.getModel(source);
                    if (textModel) {
                        success = await this.doSaveAsTextFile(textModel, source, target, options);
                    }
                }
                // Revert the source if result is success
                if (success) {
                    await this.revert(source);
                }
                return target;
            }
            async doSaveAsTextFile(sourceModel, source, target, options) {
                // Find source encoding if any
                let sourceModelEncoding = undefined;
                const sourceModelWithEncodingSupport = sourceModel;
                if (typeof sourceModelWithEncodingSupport.getEncoding === 'function') {
                    sourceModelEncoding = sourceModelWithEncodingSupport.getEncoding();
                }
                // Prefer an existing model if it is already loaded for the given target resource
                let targetExists = false;
                let targetModel = this.files.get(target);
                if (targetModel === null || targetModel === void 0 ? void 0 : targetModel.isResolved()) {
                    targetExists = true;
                }
                // Otherwise create the target file empty if it does not exist already and resolve it from there
                else {
                    targetExists = await this.fileService.exists(target);
                    // create target file adhoc if it does not exist yet
                    if (!targetExists) {
                        await this.create(target, '');
                    }
                    try {
                        targetModel = await this.files.resolve(target, { encoding: sourceModelEncoding });
                    }
                    catch (error) {
                        // if the target already exists and was not created by us, it is possible
                        // that we cannot load the target as text model if it is binary or too
                        // large. in that case we have to delete the target file first and then
                        // re-run the operation.
                        if (targetExists) {
                            if (error.textFileOperationResult === 0 /* FILE_IS_BINARY */ ||
                                error.fileOperationResult === 7 /* FILE_TOO_LARGE */) {
                                await this.fileService.del(target);
                                return this.doSaveAsTextFile(sourceModel, source, target, options);
                            }
                        }
                        throw error;
                    }
                }
                // Confirm to overwrite if we have an untitled file with associated file where
                // the file actually exists on disk and we are instructed to save to that file
                // path. This can happen if the file was created after the untitled file was opened.
                // See https://github.com/Microsoft/vscode/issues/67946
                let write;
                if (sourceModel instanceof untitledTextEditorModel_1.UntitledTextEditorModel && sourceModel.hasAssociatedFilePath && targetExists && resources_1.isEqual(target, resources_1.toLocalResource(sourceModel.resource, this.environmentService.configuration.remoteAuthority))) {
                    write = await this.confirmOverwrite(target);
                }
                else {
                    write = true;
                }
                if (!write) {
                    return false;
                }
                let sourceTextModel = undefined;
                if (sourceModel instanceof textEditorModel_1.BaseTextEditorModel) {
                    if (sourceModel.isResolved()) {
                        sourceTextModel = sourceModel.textEditorModel;
                    }
                }
                else {
                    sourceTextModel = sourceModel;
                }
                let targetTextModel = undefined;
                if (targetModel.isResolved()) {
                    targetTextModel = targetModel.textEditorModel;
                }
                // take over model value, encoding and mode (only if more specific) from source model
                if (sourceTextModel && targetTextModel) {
                    // encoding
                    targetModel.updatePreferredEncoding(sourceModelEncoding);
                    // content
                    this.modelService.updateModel(targetTextModel, textModel_1.createTextBufferFactoryFromSnapshot(sourceTextModel.createSnapshot()));
                    // mode
                    const sourceMode = sourceTextModel.getLanguageIdentifier();
                    const targetMode = targetTextModel.getLanguageIdentifier();
                    if (sourceMode.language !== modesRegistry_1.PLAINTEXT_MODE_ID && targetMode.language === modesRegistry_1.PLAINTEXT_MODE_ID) {
                        targetTextModel.setMode(sourceMode); // only use if more specific than plain/text
                    }
                    // transient properties
                    const sourceTransientProperties = this.codeEditorService.getTransientModelProperties(sourceTextModel);
                    if (sourceTransientProperties) {
                        for (const [key, value] of sourceTransientProperties) {
                            this.codeEditorService.setTransientModelProperty(targetTextModel, key, value);
                        }
                    }
                }
                // save model
                return await targetModel.save(options);
            }
            async confirmOverwrite(resource) {
                const confirm = {
                    message: nls.localize('confirmOverwrite', "'{0}' already exists. Do you want to replace it?", resources_1.basename(resource)),
                    detail: nls.localize('irreversible', "A file or folder with the name '{0}' already exists in the folder '{1}'. Replacing it will overwrite its current contents.", resources_1.basename(resource), resources_1.basename(resources_1.dirname(resource))),
                    primaryButton: nls.localize({ key: 'replaceButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Replace"),
                    type: 'warning'
                };
                return (await this.dialogService.confirm(confirm)).confirmed;
            }
            async suggestSavePath(resource) {
                // Just take the resource as is if the file service can handle it
                if (this.fileService.canHandleResource(resource)) {
                    return resource;
                }
                const remoteAuthority = this.environmentService.configuration.remoteAuthority;
                // Otherwise try to suggest a path that can be saved
                let suggestedFilename = undefined;
                if (resource.scheme === network_1.Schemas.untitled) {
                    const model = this.untitledTextEditorService.get(resource);
                    if (model) {
                        // Untitled with associated file path
                        if (model.hasAssociatedFilePath) {
                            return resources_1.toLocalResource(resource, remoteAuthority);
                        }
                        // Untitled without associated file path: use name
                        // of untitled model if it is a valid path name
                        let untitledName = model.name;
                        if (!extpath_1.isValidBasename(untitledName)) {
                            untitledName = resources_1.basename(resource);
                        }
                        // Add mode file extension if specified
                        const mode = model.getMode();
                        if (mode !== modesRegistry_1.PLAINTEXT_MODE_ID) {
                            suggestedFilename = mime_1.suggestFilename(mode, untitledName);
                        }
                        else {
                            suggestedFilename = untitledName;
                        }
                    }
                }
                // Fallback to basename of resource
                if (!suggestedFilename) {
                    suggestedFilename = resources_1.basename(resource);
                }
                // Try to place where last active file was if any
                // Otherwise fallback to user home
                return resources_1.joinPath(this.fileDialogService.defaultFilePath() || (await this.pathService.userHome), suggestedFilename);
            }
            //#endregion
            //#region revert
            async revert(resource, options) {
                // Untitled
                if (resource.scheme === network_1.Schemas.untitled) {
                    const model = this.untitled.get(resource);
                    if (model) {
                        return model.revert(options);
                    }
                }
                // File
                else {
                    const model = this.files.get(resource);
                    if (model && (model.isDirty() || (options === null || options === void 0 ? void 0 : options.force))) {
                        return model.revert(options);
                    }
                }
            }
            //#endregion
            //#region dirty
            isDirty(resource) {
                const model = resource.scheme === network_1.Schemas.untitled ? this.untitled.get(resource) : this.files.get(resource);
                if (model) {
                    return model.isDirty();
                }
                return false;
            }
        };
        AbstractTextFileService = __decorate([
            __param(0, files_1.IFileService),
            __param(1, untitledTextEditorService_1.IUntitledTextEditorService),
            __param(2, lifecycle_1.ILifecycleService),
            __param(3, instantiation_1.IInstantiationService),
            __param(4, modelService_1.IModelService),
            __param(5, environmentService_1.IWorkbenchEnvironmentService),
            __param(6, dialogs_1.IDialogService),
            __param(7, dialogs_1.IFileDialogService),
            __param(8, textResourceConfigurationService_1.ITextResourceConfigurationService),
            __param(9, filesConfigurationService_1.IFilesConfigurationService),
            __param(10, resolverService_1.ITextModelService),
            __param(11, codeEditorService_1.ICodeEditorService),
            __param(12, pathService_1.IPathService),
            __param(13, workingCopyFileService_1.IWorkingCopyFileService)
        ], AbstractTextFileService);
        return AbstractTextFileService;
    })();
    exports.AbstractTextFileService = AbstractTextFileService;
});
//# sourceMappingURL=textFileService.js.map