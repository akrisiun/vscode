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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/files/common/files", "vs/base/common/event", "vs/base/common/resources", "vs/nls", "vs/base/common/map", "vs/base/common/arrays", "vs/base/common/labels", "vs/platform/log/common/log", "vs/base/common/buffer", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/network", "vs/base/common/objects"], function (require, exports, lifecycle_1, files_1, event_1, resources_1, nls_1, map_1, arrays_1, labels_1, log_1, buffer_1, async_1, cancellation_1, network_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let FileService = class FileService extends lifecycle_1.Disposable {
        constructor(logService) {
            super();
            this.logService = logService;
            this.BUFFER_SIZE = 64 * 1024;
            //#region File System Provider
            this._onDidChangeFileSystemProviderRegistrations = this._register(new event_1.Emitter());
            this.onDidChangeFileSystemProviderRegistrations = this._onDidChangeFileSystemProviderRegistrations.event;
            this._onWillActivateFileSystemProvider = this._register(new event_1.Emitter());
            this.onWillActivateFileSystemProvider = this._onWillActivateFileSystemProvider.event;
            this.provider = new Map();
            //#endregion
            this._onAfterOperation = this._register(new event_1.Emitter());
            this.onAfterOperation = this._onAfterOperation.event;
            this._onError = this._register(new event_1.Emitter());
            this.onError = this._onError.event;
            //#endregion
            //#region File Watching
            this._onFileChanges = this._register(new event_1.Emitter());
            this.onFileChanges = this._onFileChanges.event;
            this.activeWatchers = new Map();
            //#endregion
            //#region Helpers
            this.writeQueues = new Map();
        }
        registerProvider(scheme, provider) {
            if (this.provider.has(scheme)) {
                throw new Error(`A provider for the scheme ${scheme} is already registered.`);
            }
            // Add provider with event
            this.provider.set(scheme, provider);
            this._onDidChangeFileSystemProviderRegistrations.fire({ added: true, scheme, provider });
            // Forward events from provider
            const providerDisposables = new lifecycle_1.DisposableStore();
            providerDisposables.add(provider.onDidChangeFile(changes => this._onFileChanges.fire(new files_1.FileChangesEvent(changes))));
            if (typeof provider.onDidErrorOccur === 'function') {
                providerDisposables.add(provider.onDidErrorOccur(error => this._onError.fire(new Error(error))));
            }
            return lifecycle_1.toDisposable(() => {
                this._onDidChangeFileSystemProviderRegistrations.fire({ added: false, scheme, provider });
                this.provider.delete(scheme);
                lifecycle_1.dispose(providerDisposables);
            });
        }
        async activateProvider(scheme) {
            // Emit an event that we are about to activate a provider with the given scheme.
            // Listeners can participate in the activation by registering a provider for it.
            const joiners = [];
            this._onWillActivateFileSystemProvider.fire({
                scheme,
                join(promise) {
                    if (promise) {
                        joiners.push(promise);
                    }
                },
            });
            if (this.provider.has(scheme)) {
                return; // provider is already here so we can return directly
            }
            // If the provider is not yet there, make sure to join on the listeners assuming
            // that it takes a bit longer to register the file system provider.
            await Promise.all(joiners);
        }
        canHandleResource(resource) {
            return this.provider.has(resource.scheme);
        }
        hasCapability(resource, capability) {
            const provider = this.provider.get(resource.scheme);
            return !!(provider && (provider.capabilities & capability));
        }
        async withProvider(resource) {
            // Assert path is absolute
            if (!resources_1.isAbsolutePath(resource)) {
                throw new files_1.FileOperationError(nls_1.localize('invalidPath', "The path of resource '{0}' must be absolute", this.resourceForError(resource)), 8 /* FILE_INVALID_PATH */);
            }
            // Activate provider
            await this.activateProvider(resource.scheme);
            // Assert provider
            const provider = this.provider.get(resource.scheme);
            if (!provider) {
                const error = new Error();
                error.name = 'ENOPRO';
                error.message = nls_1.localize('noProviderFound', "No file system provider found for {0}", resource.toString());
                throw error;
            }
            return provider;
        }
        async withReadWriteProvider(resource) {
            const provider = await this.withProvider(resource);
            if (files_1.hasOpenReadWriteCloseCapability(provider) || files_1.hasReadWriteCapability(provider)) {
                return provider;
            }
            throw new Error('Provider neither has FileReadWrite nor FileOpenReadWriteClose capability which is needed for the operation.');
        }
        async resolve(resource, options) {
            try {
                return await this.doResolveFile(resource, options);
            }
            catch (error) {
                // Specially handle file not found case as file operation result
                if (files_1.toFileSystemProviderErrorCode(error) === files_1.FileSystemProviderErrorCode.FileNotFound) {
                    throw new files_1.FileOperationError(nls_1.localize('fileNotFoundError', "File not found ({0})", this.resourceForError(resource)), 1 /* FILE_NOT_FOUND */);
                }
                // Bubble up any other error as is
                throw this.ensureError(error);
            }
        }
        async doResolveFile(resource, options) {
            var _a, _b, _c;
            const provider = await this.withProvider(resource);
            const resolveTo = (_a = options) === null || _a === void 0 ? void 0 : _a.resolveTo;
            const resolveSingleChildDescendants = (_b = options) === null || _b === void 0 ? void 0 : _b.resolveSingleChildDescendants;
            const resolveMetadata = (_c = options) === null || _c === void 0 ? void 0 : _c.resolveMetadata;
            const stat = await provider.stat(resource);
            let trie;
            return this.toFileStat(provider, resource, stat, undefined, !!resolveMetadata, (stat, siblings) => {
                // lazy trie to check for recursive resolving
                if (!trie) {
                    trie = map_1.TernarySearchTree.forPaths();
                    trie.set(resource.toString(), true);
                    if (arrays_1.isNonEmptyArray(resolveTo)) {
                        resolveTo.forEach(uri => trie.set(uri.toString(), true));
                    }
                }
                // check for recursive resolving
                if (Boolean(trie.findSuperstr(stat.resource.toString()) || trie.get(stat.resource.toString()))) {
                    return true;
                }
                // check for resolving single child folders
                if (stat.isDirectory && resolveSingleChildDescendants) {
                    return siblings === 1;
                }
                return false;
            });
        }
        async toFileStat(provider, resource, stat, siblings, resolveMetadata, recurse) {
            // convert to file stat
            const fileStat = {
                resource,
                name: labels_1.getBaseLabel(resource),
                isDirectory: (stat.type & files_1.FileType.Directory) !== 0,
                isSymbolicLink: (stat.type & files_1.FileType.SymbolicLink) !== 0,
                isReadonly: !!(provider.capabilities & 2048 /* Readonly */),
                mtime: stat.mtime,
                size: stat.size,
                etag: files_1.etag({ mtime: stat.mtime, size: stat.size })
            };
            // check to recurse for directories
            if (fileStat.isDirectory && recurse(fileStat, siblings)) {
                try {
                    const entries = await provider.readdir(resource);
                    const resolvedEntries = await Promise.all(entries.map(async ([name, type]) => {
                        try {
                            const childResource = resources_1.joinPath(resource, name);
                            const childStat = resolveMetadata ? await provider.stat(childResource) : { type };
                            return await this.toFileStat(provider, childResource, childStat, entries.length, resolveMetadata, recurse);
                        }
                        catch (error) {
                            this.logService.trace(error);
                            return null; // can happen e.g. due to permission errors
                        }
                    }));
                    // make sure to get rid of null values that signal a failure to resolve a particular entry
                    fileStat.children = arrays_1.coalesce(resolvedEntries);
                }
                catch (error) {
                    this.logService.trace(error);
                    fileStat.children = []; // gracefully handle errors, we may not have permissions to read
                }
                return fileStat;
            }
            return fileStat;
        }
        async resolveAll(toResolve) {
            return Promise.all(toResolve.map(async (entry) => {
                try {
                    return { stat: await this.doResolveFile(entry.resource, entry.options), success: true };
                }
                catch (error) {
                    this.logService.trace(error);
                    return { stat: undefined, success: false };
                }
            }));
        }
        async exists(resource) {
            const provider = await this.withProvider(resource);
            try {
                const stat = await provider.stat(resource);
                return !!stat;
            }
            catch (error) {
                return false;
            }
        }
        //#endregion
        //#region File Reading/Writing
        async createFile(resource, bufferOrReadableOrStream = buffer_1.VSBuffer.fromString(''), options) {
            var _a;
            // validate overwrite
            if (!((_a = options) === null || _a === void 0 ? void 0 : _a.overwrite) && await this.exists(resource)) {
                throw new files_1.FileOperationError(nls_1.localize('fileExists', "File to create already exists ({0})", this.resourceForError(resource)), 3 /* FILE_MODIFIED_SINCE */, options);
            }
            // do write into file (this will create it too)
            const fileStat = await this.writeFile(resource, bufferOrReadableOrStream);
            // events
            this._onAfterOperation.fire(new files_1.FileOperationEvent(resource, 0 /* CREATE */, fileStat));
            return fileStat;
        }
        async writeFile(resource, bufferOrReadableOrStream, options) {
            const provider = this.throwIfFileSystemIsReadonly(await this.withReadWriteProvider(resource));
            try {
                // validate write
                const stat = await this.validateWriteFile(provider, resource, options);
                // mkdir recursively as needed
                if (!stat) {
                    await this.mkdirp(provider, resources_1.dirname(resource));
                }
                // write file: unbuffered (only if data to write is a buffer, or the provider has no buffered write capability)
                if (!files_1.hasOpenReadWriteCloseCapability(provider) || (files_1.hasReadWriteCapability(provider) && bufferOrReadableOrStream instanceof buffer_1.VSBuffer)) {
                    await this.doWriteUnbuffered(provider, resource, bufferOrReadableOrStream);
                }
                // write file: buffered
                else {
                    await this.doWriteBuffered(provider, resource, bufferOrReadableOrStream instanceof buffer_1.VSBuffer ? buffer_1.bufferToReadable(bufferOrReadableOrStream) : bufferOrReadableOrStream);
                }
            }
            catch (error) {
                throw new files_1.FileOperationError(nls_1.localize('err.write', "Unable to write file ({0})", this.ensureError(error).toString()), files_1.toFileOperationResult(error), options);
            }
            return this.resolve(resource, { resolveMetadata: true });
        }
        async validateWriteFile(provider, resource, options) {
            let stat = undefined;
            try {
                stat = await provider.stat(resource);
            }
            catch (error) {
                return undefined; // file might not exist
            }
            // file cannot be directory
            if ((stat.type & files_1.FileType.Directory) !== 0) {
                throw new files_1.FileOperationError(nls_1.localize('fileIsDirectoryError', "Expected file {0} is actually a directory", this.resourceForError(resource)), 0 /* FILE_IS_DIRECTORY */, options);
            }
            // Dirty write prevention: if the file on disk has been changed and does not match our expected
            // mtime and etag, we bail out to prevent dirty writing.
            //
            // First, we check for a mtime that is in the future before we do more checks. The assumption is
            // that only the mtime is an indicator for a file that has changd on disk.
            //
            // Second, if the mtime has advanced, we compare the size of the file on disk with our previous
            // one using the etag() function. Relying only on the mtime check has prooven to produce false
            // positives due to file system weirdness (especially around remote file systems). As such, the
            // check for size is a weaker check because it can return a false negative if the file has changed
            // but to the same length. This is a compromise we take to avoid having to produce checksums of
            // the file content for comparison which would be much slower to compute.
            if (options && typeof options.mtime === 'number' && typeof options.etag === 'string' && options.etag !== files_1.ETAG_DISABLED &&
                typeof stat.mtime === 'number' && typeof stat.size === 'number' &&
                options.mtime < stat.mtime && options.etag !== files_1.etag({ mtime: options.mtime /* not using stat.mtime for a reason, see above */, size: stat.size })) {
                throw new files_1.FileOperationError(nls_1.localize('fileModifiedError', "File Modified Since"), 3 /* FILE_MODIFIED_SINCE */, options);
            }
            return stat;
        }
        async readFile(resource, options) {
            const provider = await this.withReadWriteProvider(resource);
            const stream = await this.doReadAsFileStream(provider, resource, objects_1.assign({
                // optimization: since we know that the caller does not
                // care about buffering, we indicate this to the reader.
                // this reduces all the overhead the buffered reading
                // has (open, read, close) if the provider supports
                // unbuffered reading.
                preferUnbuffered: true
            }, options || Object.create(null)));
            return Object.assign(Object.assign({}, stream), { value: await buffer_1.streamToBuffer(stream.value) });
        }
        async readFileStream(resource, options) {
            const provider = await this.withReadWriteProvider(resource);
            return this.doReadAsFileStream(provider, resource, options);
        }
        async doReadAsFileStream(provider, resource, options) {
            var _a;
            // install a cancellation token that gets cancelled
            // when any error occurs. this allows us to resolve
            // the content of the file while resolving metadata
            // but still cancel the operation in certain cases.
            const cancellableSource = new cancellation_1.CancellationTokenSource();
            // validate read operation
            const statPromise = this.validateReadFile(resource, options).then(stat => stat, error => {
                cancellableSource.cancel();
                throw error;
            });
            try {
                // if the etag is provided, we await the result of the validation
                // due to the likelyhood of hitting a NOT_MODIFIED_SINCE result.
                // otherwise, we let it run in parallel to the file reading for
                // optimal startup performance.
                if (options && typeof options.etag === 'string' && options.etag !== files_1.ETAG_DISABLED) {
                    await statPromise;
                }
                let fileStreamPromise;
                // read unbuffered (only if either preferred, or the provider has no buffered read capability)
                if (!files_1.hasOpenReadWriteCloseCapability(provider) || (files_1.hasReadWriteCapability(provider) && ((_a = options) === null || _a === void 0 ? void 0 : _a.preferUnbuffered))) {
                    fileStreamPromise = this.readFileUnbuffered(provider, resource, options);
                }
                // read buffered
                else {
                    fileStreamPromise = Promise.resolve(this.readFileBuffered(provider, resource, cancellableSource.token, options));
                }
                const [fileStat, fileStream] = await Promise.all([statPromise, fileStreamPromise]);
                return Object.assign(Object.assign({}, fileStat), { value: fileStream });
            }
            catch (error) {
                throw new files_1.FileOperationError(nls_1.localize('err.read', "Unable to read file ({0})", this.ensureError(error).toString()), files_1.toFileOperationResult(error), options);
            }
        }
        readFileBuffered(provider, resource, token, options) {
            const stream = buffer_1.writeableBufferStream();
            // do not await reading but simply return
            // the stream directly since it operates
            // via events. finally end the stream and
            // send through the possible error
            let error = undefined;
            this.doReadFileBuffered(provider, resource, stream, token, options).then(undefined, err => error = err).finally(() => stream.end(error));
            return stream;
        }
        async doReadFileBuffered(provider, resource, stream, token, options) {
            // open handle through provider
            const handle = await provider.open(resource, { create: false });
            try {
                let totalBytesRead = 0;
                let bytesRead = 0;
                let allowedRemainingBytes = (options && typeof options.length === 'number') ? options.length : undefined;
                let buffer = buffer_1.VSBuffer.alloc(Math.min(this.BUFFER_SIZE, typeof allowedRemainingBytes === 'number' ? allowedRemainingBytes : this.BUFFER_SIZE));
                let posInFile = options && typeof options.position === 'number' ? options.position : 0;
                let posInBuffer = 0;
                do {
                    // read from source (handle) at current position (pos) into buffer (buffer) at
                    // buffer position (posInBuffer) up to the size of the buffer (buffer.byteLength).
                    bytesRead = await provider.read(handle, posInFile, buffer.buffer, posInBuffer, buffer.byteLength - posInBuffer);
                    posInFile += bytesRead;
                    posInBuffer += bytesRead;
                    totalBytesRead += bytesRead;
                    if (typeof allowedRemainingBytes === 'number') {
                        allowedRemainingBytes -= bytesRead;
                    }
                    // when buffer full, create a new one and emit it through stream
                    if (posInBuffer === buffer.byteLength) {
                        stream.write(buffer);
                        buffer = buffer_1.VSBuffer.alloc(Math.min(this.BUFFER_SIZE, typeof allowedRemainingBytes === 'number' ? allowedRemainingBytes : this.BUFFER_SIZE));
                        posInBuffer = 0;
                    }
                } while (bytesRead > 0 && (typeof allowedRemainingBytes !== 'number' || allowedRemainingBytes > 0) && this.throwIfCancelled(token) && this.throwIfTooLarge(totalBytesRead, options));
                // wrap up with last buffer (also respect maxBytes if provided)
                if (posInBuffer > 0) {
                    let lastChunkLength = posInBuffer;
                    if (typeof allowedRemainingBytes === 'number') {
                        lastChunkLength = Math.min(posInBuffer, allowedRemainingBytes);
                    }
                    stream.write(buffer.slice(0, lastChunkLength));
                }
            }
            catch (error) {
                throw this.ensureError(error);
            }
            finally {
                await provider.close(handle);
            }
        }
        async readFileUnbuffered(provider, resource, options) {
            let buffer = await provider.readFile(resource);
            // respect position option
            if (options && typeof options.position === 'number') {
                buffer = buffer.slice(options.position);
            }
            // respect length option
            if (options && typeof options.length === 'number') {
                buffer = buffer.slice(0, options.length);
            }
            return buffer_1.bufferToStream(buffer_1.VSBuffer.wrap(buffer));
        }
        async validateReadFile(resource, options) {
            var _a;
            const stat = await this.resolve(resource, { resolveMetadata: true });
            // Return early if resource is a directory
            if (stat.isDirectory) {
                throw new files_1.FileOperationError(nls_1.localize('fileIsDirectoryError', "Expected file {0} is actually a directory", this.resourceForError(resource)), 0 /* FILE_IS_DIRECTORY */, options);
            }
            // Return early if file not modified since (unless disabled)
            if (options && typeof options.etag === 'string' && options.etag !== files_1.ETAG_DISABLED && options.etag === stat.etag) {
                throw new files_1.FileOperationError(nls_1.localize('fileNotModifiedError', "File not modified since"), 2 /* FILE_NOT_MODIFIED_SINCE */, options);
            }
            // Return early if file is too large to load
            if ((_a = options) === null || _a === void 0 ? void 0 : _a.limits) {
                if (typeof options.limits.memory === 'number' && stat.size > options.limits.memory) {
                    throw new files_1.FileOperationError(nls_1.localize('fileTooLargeForHeapError', "To open a file of this size, you need to restart and allow it to use more memory"), 9 /* FILE_EXCEED_MEMORY_LIMIT */);
                }
                if (typeof options.limits.size === 'number' && stat.size > options.limits.size) {
                    throw new files_1.FileOperationError(nls_1.localize('fileTooLargeError', "File is too large to open"), 7 /* FILE_TOO_LARGE */);
                }
            }
            return stat;
        }
        //#endregion
        //#region Move/Copy/Delete/Create Folder
        async move(source, target, overwrite) {
            const sourceProvider = this.throwIfFileSystemIsReadonly(await this.withReadWriteProvider(source));
            const targetProvider = this.throwIfFileSystemIsReadonly(await this.withReadWriteProvider(target));
            // move
            const mode = await this.doMoveCopy(sourceProvider, source, targetProvider, target, 'move', !!overwrite);
            // resolve and send events
            const fileStat = await this.resolve(target, { resolveMetadata: true });
            this._onAfterOperation.fire(new files_1.FileOperationEvent(source, mode === 'move' ? 2 /* MOVE */ : 3 /* COPY */, fileStat));
            return fileStat;
        }
        async copy(source, target, overwrite) {
            const sourceProvider = await this.withReadWriteProvider(source);
            const targetProvider = this.throwIfFileSystemIsReadonly(await this.withReadWriteProvider(target));
            // copy
            const mode = await this.doMoveCopy(sourceProvider, source, targetProvider, target, 'copy', !!overwrite);
            // resolve and send events
            const fileStat = await this.resolve(target, { resolveMetadata: true });
            this._onAfterOperation.fire(new files_1.FileOperationEvent(source, mode === 'copy' ? 3 /* COPY */ : 2 /* MOVE */, fileStat));
            return fileStat;
        }
        async doMoveCopy(sourceProvider, source, targetProvider, target, mode, overwrite) {
            if (source.toString() === target.toString()) {
                return mode; // simulate node.js behaviour here and do a no-op if paths match
            }
            // validation
            const { exists, isSameResourceWithDifferentPathCase } = await this.doValidateMoveCopy(sourceProvider, source, targetProvider, target, mode, overwrite);
            // delete as needed (unless target is same resurce with different path case)
            if (exists && !isSameResourceWithDifferentPathCase && overwrite) {
                await this.del(target, { recursive: true });
            }
            // create parent folders
            await this.mkdirp(targetProvider, resources_1.dirname(target));
            // copy source => target
            if (mode === 'copy') {
                // same provider with fast copy: leverage copy() functionality
                if (sourceProvider === targetProvider && files_1.hasFileFolderCopyCapability(sourceProvider)) {
                    await sourceProvider.copy(source, target, { overwrite });
                }
                // when copying via buffer/unbuffered, we have to manually
                // traverse the source if it is a folder and not a file
                else {
                    const sourceFile = await this.resolve(source);
                    if (sourceFile.isDirectory) {
                        await this.doCopyFolder(sourceProvider, sourceFile, targetProvider, target);
                    }
                    else {
                        await this.doCopyFile(sourceProvider, source, targetProvider, target);
                    }
                }
                return mode;
            }
            // move source => target
            else {
                // same provider: leverage rename() functionality
                if (sourceProvider === targetProvider) {
                    await sourceProvider.rename(source, target, { overwrite });
                    return mode;
                }
                // across providers: copy to target & delete at source
                else {
                    await this.doMoveCopy(sourceProvider, source, targetProvider, target, 'copy', overwrite);
                    await this.del(source, { recursive: true });
                    return 'copy';
                }
            }
        }
        async doCopyFile(sourceProvider, source, targetProvider, target) {
            // copy: source (buffered) => target (buffered)
            if (files_1.hasOpenReadWriteCloseCapability(sourceProvider) && files_1.hasOpenReadWriteCloseCapability(targetProvider)) {
                return this.doPipeBuffered(sourceProvider, source, targetProvider, target);
            }
            // copy: source (buffered) => target (unbuffered)
            if (files_1.hasOpenReadWriteCloseCapability(sourceProvider) && files_1.hasReadWriteCapability(targetProvider)) {
                return this.doPipeBufferedToUnbuffered(sourceProvider, source, targetProvider, target);
            }
            // copy: source (unbuffered) => target (buffered)
            if (files_1.hasReadWriteCapability(sourceProvider) && files_1.hasOpenReadWriteCloseCapability(targetProvider)) {
                return this.doPipeUnbufferedToBuffered(sourceProvider, source, targetProvider, target);
            }
            // copy: source (unbuffered) => target (unbuffered)
            if (files_1.hasReadWriteCapability(sourceProvider) && files_1.hasReadWriteCapability(targetProvider)) {
                return this.doPipeUnbuffered(sourceProvider, source, targetProvider, target);
            }
        }
        async doCopyFolder(sourceProvider, sourceFolder, targetProvider, targetFolder) {
            // create folder in target
            await targetProvider.mkdir(targetFolder);
            // create children in target
            if (Array.isArray(sourceFolder.children)) {
                await Promise.all(sourceFolder.children.map(async (sourceChild) => {
                    const targetChild = resources_1.joinPath(targetFolder, sourceChild.name);
                    if (sourceChild.isDirectory) {
                        return this.doCopyFolder(sourceProvider, await this.resolve(sourceChild.resource), targetProvider, targetChild);
                    }
                    else {
                        return this.doCopyFile(sourceProvider, sourceChild.resource, targetProvider, targetChild);
                    }
                }));
            }
        }
        async doValidateMoveCopy(sourceProvider, source, targetProvider, target, mode, overwrite) {
            let isSameResourceWithDifferentPathCase = false;
            // Check if source is equal or parent to target (requires providers to be the same)
            if (sourceProvider === targetProvider) {
                const isPathCaseSensitive = !!(sourceProvider.capabilities & 1024 /* PathCaseSensitive */);
                if (!isPathCaseSensitive) {
                    isSameResourceWithDifferentPathCase = resources_1.isEqual(source, target, true /* ignore case */);
                }
                if (isSameResourceWithDifferentPathCase && mode === 'copy') {
                    throw new Error(nls_1.localize('unableToMoveCopyError1', "Unable to copy when source is same as target with different path case on a case insensitive file system"));
                }
                if (!isSameResourceWithDifferentPathCase && resources_1.isEqualOrParent(target, source, !isPathCaseSensitive)) {
                    throw new Error(nls_1.localize('unableToMoveCopyError2', "Unable to move/copy when source is parent of target"));
                }
            }
            // Extra checks if target exists and this is not a rename
            const exists = await this.exists(target);
            if (exists && !isSameResourceWithDifferentPathCase) {
                // Bail out if target exists and we are not about to overwrite
                if (!overwrite) {
                    throw new files_1.FileOperationError(nls_1.localize('unableToMoveCopyError3', "Unable to move/copy. File already exists at destination."), 4 /* FILE_MOVE_CONFLICT */);
                }
                // Special case: if the target is a parent of the source, we cannot delete
                // it as it would delete the source as well. In this case we have to throw
                if (sourceProvider === targetProvider) {
                    const isPathCaseSensitive = !!(sourceProvider.capabilities & 1024 /* PathCaseSensitive */);
                    if (resources_1.isEqualOrParent(source, target, !isPathCaseSensitive)) {
                        throw new Error(nls_1.localize('unableToMoveCopyError4', "Unable to move/copy. File would replace folder it is contained in."));
                    }
                }
            }
            return { exists, isSameResourceWithDifferentPathCase };
        }
        async createFolder(resource) {
            const provider = this.throwIfFileSystemIsReadonly(await this.withProvider(resource));
            // mkdir recursively
            await this.mkdirp(provider, resource);
            // events
            const fileStat = await this.resolve(resource, { resolveMetadata: true });
            this._onAfterOperation.fire(new files_1.FileOperationEvent(resource, 0 /* CREATE */, fileStat));
            return fileStat;
        }
        async mkdirp(provider, directory) {
            const directoriesToCreate = [];
            // mkdir until we reach root
            while (!resources_1.isEqual(directory, resources_1.dirname(directory))) {
                try {
                    const stat = await provider.stat(directory);
                    if ((stat.type & files_1.FileType.Directory) === 0) {
                        throw new Error(nls_1.localize('mkdirExistsError', "{0} exists, but is not a directory", this.resourceForError(directory)));
                    }
                    break; // we have hit a directory that exists -> good
                }
                catch (error) {
                    // Bubble up any other error that is not file not found
                    if (files_1.toFileSystemProviderErrorCode(error) !== files_1.FileSystemProviderErrorCode.FileNotFound) {
                        throw error;
                    }
                    // Upon error, remember directories that need to be created
                    directoriesToCreate.push(resources_1.basename(directory));
                    // Continue up
                    directory = resources_1.dirname(directory);
                }
            }
            // Create directories as needed
            for (let i = directoriesToCreate.length - 1; i >= 0; i--) {
                directory = resources_1.joinPath(directory, directoriesToCreate[i]);
                await provider.mkdir(directory);
            }
        }
        async del(resource, options) {
            var _a, _b;
            const provider = this.throwIfFileSystemIsReadonly(await this.withProvider(resource));
            // Validate trash support
            const useTrash = !!((_a = options) === null || _a === void 0 ? void 0 : _a.useTrash);
            if (useTrash && !(provider.capabilities & 4096 /* Trash */)) {
                throw new Error(nls_1.localize('err.trash', "Provider does not support trash."));
            }
            // Validate recursive
            const recursive = !!((_b = options) === null || _b === void 0 ? void 0 : _b.recursive);
            if (!recursive && await this.exists(resource)) {
                const stat = await this.resolve(resource);
                if (stat.isDirectory && Array.isArray(stat.children) && stat.children.length > 0) {
                    throw new Error(nls_1.localize('deleteFailed', "Unable to delete non-empty folder '{0}'.", this.resourceForError(resource)));
                }
            }
            // Delete through provider
            await provider.delete(resource, { recursive, useTrash });
            // Events
            this._onAfterOperation.fire(new files_1.FileOperationEvent(resource, 1 /* DELETE */));
        }
        watch(resource, options = { recursive: false, excludes: [] }) {
            let watchDisposed = false;
            let watchDisposable = lifecycle_1.toDisposable(() => watchDisposed = true);
            // Watch and wire in disposable which is async but
            // check if we got disposed meanwhile and forward
            this.doWatch(resource, options).then(disposable => {
                if (watchDisposed) {
                    lifecycle_1.dispose(disposable);
                }
                else {
                    watchDisposable = disposable;
                }
            }, error => this.logService.error(error));
            return lifecycle_1.toDisposable(() => lifecycle_1.dispose(watchDisposable));
        }
        async doWatch(resource, options) {
            const provider = await this.withProvider(resource);
            const key = this.toWatchKey(provider, resource, options);
            // Only start watching if we are the first for the given key
            const watcher = this.activeWatchers.get(key) || { count: 0, disposable: provider.watch(resource, options) };
            if (!this.activeWatchers.has(key)) {
                this.activeWatchers.set(key, watcher);
            }
            // Increment usage counter
            watcher.count += 1;
            return lifecycle_1.toDisposable(() => {
                // Unref
                watcher.count--;
                // Dispose only when last user is reached
                if (watcher.count === 0) {
                    lifecycle_1.dispose(watcher.disposable);
                    this.activeWatchers.delete(key);
                }
            });
        }
        toWatchKey(provider, resource, options) {
            return [
                this.toMapKey(provider, resource),
                String(options.recursive),
                options.excludes.join() // use excludes as part of the key
            ].join();
        }
        dispose() {
            super.dispose();
            this.activeWatchers.forEach(watcher => lifecycle_1.dispose(watcher.disposable));
            this.activeWatchers.clear();
        }
        ensureWriteQueue(provider, resource) {
            // ensure to never write to the same resource without finishing
            // the one write. this ensures a write finishes consistently
            // (even with error) before another write is done.
            const queueKey = this.toMapKey(provider, resource);
            let writeQueue = this.writeQueues.get(queueKey);
            if (!writeQueue) {
                writeQueue = new async_1.Queue();
                this.writeQueues.set(queueKey, writeQueue);
                const onFinish = event_1.Event.once(writeQueue.onFinished);
                onFinish(() => {
                    this.writeQueues.delete(queueKey);
                    lifecycle_1.dispose(writeQueue);
                });
            }
            return writeQueue;
        }
        toMapKey(provider, resource) {
            const isPathCaseSensitive = !!(provider.capabilities & 1024 /* PathCaseSensitive */);
            return isPathCaseSensitive ? resource.toString() : resource.toString().toLowerCase();
        }
        async doWriteBuffered(provider, resource, readableOrStream) {
            return this.ensureWriteQueue(provider, resource).queue(async () => {
                // open handle
                const handle = await provider.open(resource, { create: true });
                // write into handle until all bytes from buffer have been written
                try {
                    if (buffer_1.isVSBufferReadableStream(readableOrStream)) {
                        await this.doWriteStreamBufferedQueued(provider, handle, readableOrStream);
                    }
                    else {
                        await this.doWriteReadableBufferedQueued(provider, handle, readableOrStream);
                    }
                }
                catch (error) {
                    throw this.ensureError(error);
                }
                finally {
                    // close handle always
                    await provider.close(handle);
                }
            });
        }
        doWriteStreamBufferedQueued(provider, handle, stream) {
            return new Promise((resolve, reject) => {
                let posInFile = 0;
                stream.on('data', async (chunk) => {
                    // pause stream to perform async write operation
                    stream.pause();
                    try {
                        await this.doWriteBuffer(provider, handle, chunk, chunk.byteLength, posInFile, 0);
                    }
                    catch (error) {
                        return reject(error);
                    }
                    posInFile += chunk.byteLength;
                    // resume stream now that we have successfully written
                    // run this on the next tick to prevent increasing the
                    // execution stack because resume() may call the event
                    // handler again before finishing.
                    setTimeout(() => stream.resume());
                });
                stream.on('error', error => reject(error));
                stream.on('end', () => resolve());
            });
        }
        async doWriteReadableBufferedQueued(provider, handle, readable) {
            let posInFile = 0;
            let chunk;
            while (chunk = readable.read()) {
                await this.doWriteBuffer(provider, handle, chunk, chunk.byteLength, posInFile, 0);
                posInFile += chunk.byteLength;
            }
        }
        async doWriteBuffer(provider, handle, buffer, length, posInFile, posInBuffer) {
            let totalBytesWritten = 0;
            while (totalBytesWritten < length) {
                const bytesWritten = await provider.write(handle, posInFile + totalBytesWritten, buffer.buffer, posInBuffer + totalBytesWritten, length - totalBytesWritten);
                totalBytesWritten += bytesWritten;
            }
        }
        async doWriteUnbuffered(provider, resource, bufferOrReadableOrStream) {
            return this.ensureWriteQueue(provider, resource).queue(() => this.doWriteUnbufferedQueued(provider, resource, bufferOrReadableOrStream));
        }
        async doWriteUnbufferedQueued(provider, resource, bufferOrReadableOrStream) {
            let buffer;
            if (bufferOrReadableOrStream instanceof buffer_1.VSBuffer) {
                buffer = bufferOrReadableOrStream;
            }
            else if (buffer_1.isVSBufferReadableStream(bufferOrReadableOrStream)) {
                buffer = await buffer_1.streamToBuffer(bufferOrReadableOrStream);
            }
            else {
                buffer = buffer_1.readableToBuffer(bufferOrReadableOrStream);
            }
            return provider.writeFile(resource, buffer.buffer, { create: true, overwrite: true });
        }
        async doPipeBuffered(sourceProvider, source, targetProvider, target) {
            return this.ensureWriteQueue(targetProvider, target).queue(() => this.doPipeBufferedQueued(sourceProvider, source, targetProvider, target));
        }
        async doPipeBufferedQueued(sourceProvider, source, targetProvider, target) {
            let sourceHandle = undefined;
            let targetHandle = undefined;
            try {
                // Open handles
                sourceHandle = await sourceProvider.open(source, { create: false });
                targetHandle = await targetProvider.open(target, { create: true });
                const buffer = buffer_1.VSBuffer.alloc(this.BUFFER_SIZE);
                let posInFile = 0;
                let posInBuffer = 0;
                let bytesRead = 0;
                do {
                    // read from source (sourceHandle) at current position (posInFile) into buffer (buffer) at
                    // buffer position (posInBuffer) up to the size of the buffer (buffer.byteLength).
                    bytesRead = await sourceProvider.read(sourceHandle, posInFile, buffer.buffer, posInBuffer, buffer.byteLength - posInBuffer);
                    // write into target (targetHandle) at current position (posInFile) from buffer (buffer) at
                    // buffer position (posInBuffer) all bytes we read (bytesRead).
                    await this.doWriteBuffer(targetProvider, targetHandle, buffer, bytesRead, posInFile, posInBuffer);
                    posInFile += bytesRead;
                    posInBuffer += bytesRead;
                    // when buffer full, fill it again from the beginning
                    if (posInBuffer === buffer.byteLength) {
                        posInBuffer = 0;
                    }
                } while (bytesRead > 0);
            }
            catch (error) {
                throw this.ensureError(error);
            }
            finally {
                await Promise.all([
                    typeof sourceHandle === 'number' ? sourceProvider.close(sourceHandle) : Promise.resolve(),
                    typeof targetHandle === 'number' ? targetProvider.close(targetHandle) : Promise.resolve(),
                ]);
            }
        }
        async doPipeUnbuffered(sourceProvider, source, targetProvider, target) {
            return this.ensureWriteQueue(targetProvider, target).queue(() => this.doPipeUnbufferedQueued(sourceProvider, source, targetProvider, target));
        }
        async doPipeUnbufferedQueued(sourceProvider, source, targetProvider, target) {
            return targetProvider.writeFile(target, await sourceProvider.readFile(source), { create: true, overwrite: true });
        }
        async doPipeUnbufferedToBuffered(sourceProvider, source, targetProvider, target) {
            return this.ensureWriteQueue(targetProvider, target).queue(() => this.doPipeUnbufferedToBufferedQueued(sourceProvider, source, targetProvider, target));
        }
        async doPipeUnbufferedToBufferedQueued(sourceProvider, source, targetProvider, target) {
            // Open handle
            const targetHandle = await targetProvider.open(target, { create: true });
            // Read entire buffer from source and write buffered
            try {
                const buffer = await sourceProvider.readFile(source);
                await this.doWriteBuffer(targetProvider, targetHandle, buffer_1.VSBuffer.wrap(buffer), buffer.byteLength, 0, 0);
            }
            catch (error) {
                throw this.ensureError(error);
            }
            finally {
                await targetProvider.close(targetHandle);
            }
        }
        async doPipeBufferedToUnbuffered(sourceProvider, source, targetProvider, target) {
            // Read buffer via stream buffered
            const buffer = await buffer_1.streamToBuffer(this.readFileBuffered(sourceProvider, source, cancellation_1.CancellationToken.None));
            // Write buffer into target at once
            await this.doWriteUnbuffered(targetProvider, target, buffer);
        }
        throwIfFileSystemIsReadonly(provider) {
            if (provider.capabilities & 2048 /* Readonly */) {
                throw new files_1.FileOperationError(nls_1.localize('err.readonly', "Resource can not be modified."), 6 /* FILE_PERMISSION_DENIED */);
            }
            return provider;
        }
        throwIfCancelled(token) {
            if (token.isCancellationRequested) {
                throw new Error('cancelled');
            }
            return true;
        }
        ensureError(error) {
            if (!error) {
                return new Error(nls_1.localize('unknownError', "Unknown Error")); // https://github.com/Microsoft/vscode/issues/72798
            }
            return error;
        }
        throwIfTooLarge(totalBytesRead, options) {
            var _a;
            // Return early if file is too large to load
            if ((_a = options) === null || _a === void 0 ? void 0 : _a.limits) {
                if (typeof options.limits.memory === 'number' && totalBytesRead > options.limits.memory) {
                    throw new files_1.FileOperationError(nls_1.localize('fileTooLargeForHeapError', "To open a file of this size, you need to restart and allow it to use more memory"), 9 /* FILE_EXCEED_MEMORY_LIMIT */);
                }
                if (typeof options.limits.size === 'number' && totalBytesRead > options.limits.size) {
                    throw new files_1.FileOperationError(nls_1.localize('fileTooLargeError', "File is too large to open"), 7 /* FILE_TOO_LARGE */);
                }
            }
            return true;
        }
        resourceForError(resource) {
            if (resource.scheme === network_1.Schemas.file) {
                return resource.fsPath;
            }
            return resource.toString(true);
        }
    };
    FileService = __decorate([
        __param(0, log_1.ILogService)
    ], FileService);
    exports.FileService = FileService;
});
//# sourceMappingURL=fileService.js.map