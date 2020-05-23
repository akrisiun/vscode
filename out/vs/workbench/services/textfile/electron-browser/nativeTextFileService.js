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
define(["require", "exports", "os", "vs/nls", "vs/workbench/services/textfile/browser/textFileService", "vs/workbench/services/textfile/common/textfiles", "vs/platform/instantiation/common/extensions", "vs/base/common/uri", "vs/platform/files/common/files", "vs/base/common/network", "vs/base/node/pfs", "vs/base/common/path", "vs/base/common/platform", "vs/platform/product/common/productService", "vs/editor/common/services/textResourceConfigurationService", "vs/platform/workspace/common/workspace", "vs/base/node/encoding", "vs/platform/workspaces/common/workspaces", "vs/base/common/resources", "vs/base/common/lifecycle", "vs/platform/environment/common/environment", "vs/base/common/buffer", "stream", "vs/editor/common/model/textModel", "vs/base/node/stream", "vs/workbench/services/untitled/common/untitledTextEditorService", "vs/platform/lifecycle/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/editor/common/services/modelService", "vs/workbench/services/environment/common/environmentService", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/editor/common/services/resolverService", "vs/editor/browser/services/codeEditorService", "vs/workbench/services/path/common/pathService", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/platform/log/common/log"], function (require, exports, os_1, nls_1, textFileService_1, textfiles_1, extensions_1, uri_1, files_1, network_1, pfs_1, path_1, platform_1, productService_1, textResourceConfigurationService_1, workspace_1, encoding_1, workspaces_1, resources_1, lifecycle_1, environment_1, buffer_1, stream_1, textModel_1, stream_2, untitledTextEditorService_1, lifecycle_2, instantiation_1, modelService_1, environmentService_1, dialogs_1, filesConfigurationService_1, resolverService_1, codeEditorService_1, pathService_1, workingCopyFileService_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EncodingOracle = exports.NativeTextFileService = void 0;
    let NativeTextFileService = /** @class */ (() => {
        let NativeTextFileService = class NativeTextFileService extends textFileService_1.AbstractTextFileService {
            constructor(fileService, untitledTextEditorService, lifecycleService, instantiationService, modelService, environmentService, dialogService, fileDialogService, textResourceConfigurationService, productService, filesConfigurationService, textModelService, codeEditorService, pathService, workingCopyFileService, logService) {
                super(fileService, untitledTextEditorService, lifecycleService, instantiationService, modelService, environmentService, dialogService, fileDialogService, textResourceConfigurationService, filesConfigurationService, textModelService, codeEditorService, pathService, workingCopyFileService);
                this.environmentService = environmentService;
                this.productService = productService;
                this.logService = logService;
            }
            get encoding() {
                if (!this._encoding) {
                    this._encoding = this._register(this.instantiationService.createInstance(EncodingOracle));
                }
                return this._encoding;
            }
            async read(resource, options) {
                const [bufferStream, decoder] = await this.doRead(resource, Object.assign(Object.assign({}, options), { 
                    // optimization: since we know that the caller does not
                    // care about buffering, we indicate this to the reader.
                    // this reduces all the overhead the buffered reading
                    // has (open, read, close) if the provider supports
                    // unbuffered reading.
                    preferUnbuffered: true }));
                return Object.assign(Object.assign({}, bufferStream), { encoding: decoder.detected.encoding || encoding_1.UTF8, value: await stream_2.nodeReadableToString(decoder.stream) });
            }
            async readStream(resource, options) {
                const [bufferStream, decoder] = await this.doRead(resource, options);
                return Object.assign(Object.assign({}, bufferStream), { encoding: decoder.detected.encoding || encoding_1.UTF8, value: await textModel_1.createTextBufferFactoryFromStream(decoder.stream) });
            }
            async doRead(resource, options) {
                // ensure limits
                options = this.ensureLimits(options);
                // read stream raw (either buffered or unbuffered)
                let bufferStream;
                if (options.preferUnbuffered) {
                    const content = await this.fileService.readFile(resource, options);
                    bufferStream = Object.assign(Object.assign({}, content), { value: buffer_1.bufferToStream(content.value) });
                }
                else {
                    bufferStream = await this.fileService.readFileStream(resource, options);
                }
                // read through encoding library
                const decoder = await encoding_1.toDecodeStream(stream_2.streamToNodeReadable(bufferStream.value), {
                    guessEncoding: (options === null || options === void 0 ? void 0 : options.autoGuessEncoding) || this.textResourceConfigurationService.getValue(resource, 'files.autoGuessEncoding'),
                    overwriteEncoding: detectedEncoding => this.encoding.getReadEncoding(resource, options, detectedEncoding)
                });
                // validate binary
                if ((options === null || options === void 0 ? void 0 : options.acceptTextOnly) && decoder.detected.seemsBinary) {
                    throw new textfiles_1.TextFileOperationError(nls_1.localize('fileBinaryError', "File seems to be binary and cannot be opened as text"), 0 /* FILE_IS_BINARY */, options);
                }
                return [bufferStream, decoder];
            }
            ensureLimits(options) {
                let ensuredOptions;
                if (!options) {
                    ensuredOptions = Object.create(null);
                }
                else {
                    ensuredOptions = options;
                }
                let ensuredLimits;
                if (!ensuredOptions.limits) {
                    ensuredLimits = Object.create(null);
                    ensuredOptions.limits = ensuredLimits;
                }
                else {
                    ensuredLimits = ensuredOptions.limits;
                }
                if (typeof ensuredLimits.size !== 'number') {
                    ensuredLimits.size = pfs_1.MAX_FILE_SIZE;
                }
                if (typeof ensuredLimits.memory !== 'number') {
                    ensuredLimits.memory = Math.max(typeof this.environmentService.args['max-memory'] === 'string' ? parseInt(this.environmentService.args['max-memory']) * 1024 * 1024 || 0 : 0, pfs_1.MAX_HEAP_SIZE);
                }
                return ensuredOptions;
            }
            async doCreate(resource, value, options) {
                // check for encoding
                const { encoding, addBOM } = await this.encoding.getWriteEncoding(resource);
                // return to parent when encoding is standard
                if (encoding === encoding_1.UTF8 && !addBOM) {
                    return super.doCreate(resource, value, options);
                }
                // otherwise create with encoding
                return this.fileService.createFile(resource, this.getEncodedReadable(value || '', encoding, addBOM), options);
            }
            async write(resource, value, options) {
                // check for overwriteReadonly property (only supported for local file://)
                try {
                    if ((options === null || options === void 0 ? void 0 : options.overwriteReadonly) && resource.scheme === network_1.Schemas.file && await pfs_1.exists(resource.fsPath)) {
                        const fileStat = await pfs_1.stat(resource.fsPath);
                        // try to change mode to writeable
                        await pfs_1.chmod(resource.fsPath, fileStat.mode | 128);
                    }
                }
                catch (error) {
                    // ignore and simply retry the operation
                }
                // check for writeElevated property (only supported for local file://)
                if ((options === null || options === void 0 ? void 0 : options.writeElevated) && resource.scheme === network_1.Schemas.file) {
                    return this.writeElevated(resource, value, options);
                }
                try {
                    // check for encoding
                    const { encoding, addBOM } = await this.encoding.getWriteEncoding(resource, options);
                    // return to parent when encoding is standard
                    if (encoding === encoding_1.UTF8 && !addBOM) {
                        return await super.write(resource, value, options);
                    }
                    // otherwise save with encoding
                    else {
                        return await this.fileService.writeFile(resource, this.getEncodedReadable(value, encoding, addBOM), options);
                    }
                }
                catch (error) {
                    // In case of permission denied, we need to check for readonly
                    if (error.fileOperationResult === 6 /* FILE_PERMISSION_DENIED */) {
                        let isReadonly = false;
                        try {
                            const fileStat = await pfs_1.stat(resource.fsPath);
                            if (!(fileStat.mode & 128)) {
                                isReadonly = true;
                            }
                        }
                        catch (error) {
                            // ignore - rethrow original error
                        }
                        if (isReadonly) {
                            throw new files_1.FileOperationError(nls_1.localize('fileReadOnlyError', "File is Read Only"), 5 /* FILE_READ_ONLY */, options);
                        }
                    }
                    throw error;
                }
            }
            getEncodedReadable(value, encoding, addBOM) {
                const readable = this.snapshotToNodeReadable(typeof value === 'string' ? textfiles_1.stringToSnapshot(value) : value);
                const encoder = encoding_1.encodeStream(encoding, { addBOM });
                const encodedReadable = readable.pipe(encoder);
                return stream_2.nodeStreamToVSBufferReadable(encodedReadable, addBOM && encoding_1.isUTFEncoding(encoding) ? { encoding } : undefined);
            }
            snapshotToNodeReadable(snapshot) {
                return new stream_1.Readable({
                    read: function () {
                        try {
                            let chunk = null;
                            let canPush = true;
                            // Push all chunks as long as we can push and as long as
                            // the underlying snapshot returns strings to us
                            while (canPush && typeof (chunk = snapshot.read()) === 'string') {
                                canPush = this.push(chunk);
                            }
                            // Signal EOS by pushing NULL
                            if (typeof chunk !== 'string') {
                                this.push(null);
                            }
                        }
                        catch (error) {
                            this.emit('error', error);
                        }
                    },
                    encoding: encoding_1.UTF8 // very important, so that strings are passed around and not buffers!
                });
            }
            async writeElevated(resource, value, options) {
                // write into a tmp file first
                const tmpPath = path_1.join(os_1.tmpdir(), `code-elevated-${Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 6)}`);
                const { encoding, addBOM } = await this.encoding.getWriteEncoding(resource, options);
                await this.write(uri_1.URI.file(tmpPath), value, { encoding: encoding === encoding_1.UTF8 && addBOM ? encoding_1.UTF8_with_bom : encoding });
                // sudo prompt copy
                await this.sudoPromptCopy(tmpPath, resource.fsPath, options);
                // clean up
                await pfs_1.rimraf(tmpPath);
                return this.fileService.resolve(resource, { resolveMetadata: true });
            }
            async sudoPromptCopy(source, target, options) {
                // load sudo-prompt module lazy
                const sudoPrompt = await new Promise((resolve_1, reject_1) => { require(['sudo-prompt'], resolve_1, reject_1); });
                return new Promise((resolve, reject) => {
                    const promptOptions = {
                        name: this.productService.nameLong.replace('-', ''),
                        icns: (platform_1.isMacintosh && this.environmentService.isBuilt) ? path_1.join(path_1.dirname(this.environmentService.appRoot), `${this.productService.nameShort}.icns`) : undefined
                    };
                    const sudoCommand = [`"${this.environmentService.cliPath}"`];
                    if (options === null || options === void 0 ? void 0 : options.overwriteReadonly) {
                        sudoCommand.push('--file-chmod');
                    }
                    sudoCommand.push('--file-write', `"${source}"`, `"${target}"`);
                    sudoPrompt.exec(sudoCommand.join(' '), promptOptions, (error, stdout, stderr) => {
                        if (stdout) {
                            this.logService.trace(`[sudo-prompt] received stdout: ${stdout}`);
                        }
                        if (stderr) {
                            this.logService.trace(`[sudo-prompt] received stderr: ${stderr}`);
                        }
                        if (error) {
                            reject(error);
                        }
                        else {
                            resolve(undefined);
                        }
                    });
                });
            }
        };
        NativeTextFileService = __decorate([
            __param(0, files_1.IFileService),
            __param(1, untitledTextEditorService_1.IUntitledTextEditorService),
            __param(2, lifecycle_2.ILifecycleService),
            __param(3, instantiation_1.IInstantiationService),
            __param(4, modelService_1.IModelService),
            __param(5, environmentService_1.IWorkbenchEnvironmentService),
            __param(6, dialogs_1.IDialogService),
            __param(7, dialogs_1.IFileDialogService),
            __param(8, textResourceConfigurationService_1.ITextResourceConfigurationService),
            __param(9, productService_1.IProductService),
            __param(10, filesConfigurationService_1.IFilesConfigurationService),
            __param(11, resolverService_1.ITextModelService),
            __param(12, codeEditorService_1.ICodeEditorService),
            __param(13, pathService_1.IPathService),
            __param(14, workingCopyFileService_1.IWorkingCopyFileService),
            __param(15, log_1.ILogService)
        ], NativeTextFileService);
        return NativeTextFileService;
    })();
    exports.NativeTextFileService = NativeTextFileService;
    let EncodingOracle = /** @class */ (() => {
        let EncodingOracle = class EncodingOracle extends lifecycle_1.Disposable {
            constructor(textResourceConfigurationService, environmentService, contextService, fileService) {
                super();
                this.textResourceConfigurationService = textResourceConfigurationService;
                this.environmentService = environmentService;
                this.contextService = contextService;
                this.fileService = fileService;
                this.encodingOverrides = this.getDefaultEncodingOverrides();
                this.registerListeners();
            }
            registerListeners() {
                // Workspace Folder Change
                this._register(this.contextService.onDidChangeWorkspaceFolders(() => this.encodingOverrides = this.getDefaultEncodingOverrides()));
            }
            getDefaultEncodingOverrides() {
                const defaultEncodingOverrides = [];
                // Global settings
                defaultEncodingOverrides.push({ parent: this.environmentService.userRoamingDataHome, encoding: encoding_1.UTF8 });
                // Workspace files (via extension and via untitled workspaces location)
                defaultEncodingOverrides.push({ extension: workspaces_1.WORKSPACE_EXTENSION, encoding: encoding_1.UTF8 });
                defaultEncodingOverrides.push({ parent: this.environmentService.untitledWorkspacesHome, encoding: encoding_1.UTF8 });
                // Folder Settings
                this.contextService.getWorkspace().folders.forEach(folder => {
                    defaultEncodingOverrides.push({ parent: resources_1.joinPath(folder.uri, '.vscode'), encoding: encoding_1.UTF8 });
                });
                return defaultEncodingOverrides;
            }
            async getWriteEncoding(resource, options) {
                const { encoding, hasBOM } = this.getPreferredWriteEncoding(resource, options ? options.encoding : undefined);
                // Some encodings come with a BOM automatically
                if (hasBOM) {
                    return { encoding, addBOM: true };
                }
                // Ensure that we preserve an existing BOM if found for UTF8
                // unless we are instructed to overwrite the encoding
                const overwriteEncoding = options === null || options === void 0 ? void 0 : options.overwriteEncoding;
                if (!overwriteEncoding && encoding === encoding_1.UTF8) {
                    try {
                        const buffer = (await this.fileService.readFile(resource, { length: encoding_1.UTF8_BOM.length })).value;
                        if (encoding_1.detectEncodingByBOMFromBuffer(buffer, buffer.byteLength) === encoding_1.UTF8_with_bom) {
                            return { encoding, addBOM: true };
                        }
                    }
                    catch (error) {
                        // ignore - file might not exist
                    }
                }
                return { encoding, addBOM: false };
            }
            getPreferredWriteEncoding(resource, preferredEncoding) {
                const resourceEncoding = this.getEncodingForResource(resource, preferredEncoding);
                return {
                    encoding: resourceEncoding,
                    hasBOM: resourceEncoding === encoding_1.UTF16be || resourceEncoding === encoding_1.UTF16le || resourceEncoding === encoding_1.UTF8_with_bom // enforce BOM for certain encodings
                };
            }
            getReadEncoding(resource, options, detectedEncoding) {
                let preferredEncoding;
                // Encoding passed in as option
                if (options === null || options === void 0 ? void 0 : options.encoding) {
                    if (detectedEncoding === encoding_1.UTF8_with_bom && options.encoding === encoding_1.UTF8) {
                        preferredEncoding = encoding_1.UTF8_with_bom; // indicate the file has BOM if we are to resolve with UTF 8
                    }
                    else {
                        preferredEncoding = options.encoding; // give passed in encoding highest priority
                    }
                }
                // Encoding detected
                else if (detectedEncoding) {
                    preferredEncoding = detectedEncoding;
                }
                // Encoding configured
                else if (this.textResourceConfigurationService.getValue(resource, 'files.encoding') === encoding_1.UTF8_with_bom) {
                    preferredEncoding = encoding_1.UTF8; // if we did not detect UTF 8 BOM before, this can only be UTF 8 then
                }
                return this.getEncodingForResource(resource, preferredEncoding);
            }
            getEncodingForResource(resource, preferredEncoding) {
                let fileEncoding;
                const override = this.getEncodingOverride(resource);
                if (override) {
                    fileEncoding = override; // encoding override always wins
                }
                else if (preferredEncoding) {
                    fileEncoding = preferredEncoding; // preferred encoding comes second
                }
                else {
                    fileEncoding = this.textResourceConfigurationService.getValue(resource, 'files.encoding'); // and last we check for settings
                }
                if (!fileEncoding || !encoding_1.encodingExists(fileEncoding)) {
                    fileEncoding = encoding_1.UTF8; // the default is UTF 8
                }
                return fileEncoding;
            }
            getEncodingOverride(resource) {
                if (this.encodingOverrides && this.encodingOverrides.length) {
                    for (const override of this.encodingOverrides) {
                        // check if the resource is child of encoding override path
                        if (override.parent && resources_1.isEqualOrParent(resource, override.parent)) {
                            return override.encoding;
                        }
                        // check if the resource extension is equal to encoding override
                        if (override.extension && resources_1.extname(resource) === `.${override.extension}`) {
                            return override.encoding;
                        }
                    }
                }
                return undefined;
            }
        };
        EncodingOracle = __decorate([
            __param(0, textResourceConfigurationService_1.ITextResourceConfigurationService),
            __param(1, environment_1.IEnvironmentService),
            __param(2, workspace_1.IWorkspaceContextService),
            __param(3, files_1.IFileService)
        ], EncodingOracle);
        return EncodingOracle;
    })();
    exports.EncodingOracle = EncodingOracle;
    extensions_1.registerSingleton(textfiles_1.ITextFileService, NativeTextFileService);
});
//# sourceMappingURL=nativeTextFileService.js.map