var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/uri", "vs/base/common/uuid", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/common/workspaces", "vs/workbench/services/editor/common/editorService"], function (require, exports, buffer_1, lifecycle_1, path, uri_1, uuid_1, files_1, instantiation_1, notification_1, progress_1, workspace_1, workspaces_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IUploadService = instantiation_1.createDecorator("uploadService");
    let UploadService = class UploadService extends lifecycle_1.Disposable {
        constructor(instantiationService, contextService, workspacesService, editorService) {
            super();
            this.contextService = contextService;
            this.workspacesService = workspacesService;
            this.editorService = editorService;
            this.upload = instantiationService.createInstance(Upload);
        }
        async handleDrop(event, resolveTargetGroup, afterDrop, targetIndex) {
            // TODO: should use the workspace for the editor it was dropped on?
            const target = this.contextService.getWorkspace().folders[0].uri;
            const uris = (await this.upload.uploadDropped(event, target)).map((u) => uri_1.URI.file(u));
            if (uris.length > 0) {
                await this.workspacesService.addRecentlyOpened(uris.map((u) => ({ fileUri: u })));
            }
            const editors = uris.map((uri) => ({
                resource: uri,
                options: {
                    pinned: true,
                    index: targetIndex,
                },
            }));
            const targetGroup = resolveTargetGroup();
            this.editorService.openEditors(editors, targetGroup);
            afterDrop(targetGroup);
        }
        async handleExternalDrop(_data, target, originalEvent) {
            await this.upload.uploadDropped(originalEvent, target.resource);
        }
    };
    UploadService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, workspaces_1.IWorkspacesService),
        __param(3, editorService_1.IEditorService)
    ], UploadService);
    exports.UploadService = UploadService;
    /**
     * Handles file uploads.
     */
    let Upload = class Upload {
        constructor(notificationService, progressService, fileService) {
            this.notificationService = notificationService;
            this.progressService = progressService;
            this.fileService = fileService;
            this.maxParallelUploads = 100;
            this.uploadingFiles = new Map();
            this.fileQueue = new Map();
            this.uploadedFilePaths = [];
            this._total = 0;
            this._uploaded = 0;
            this.lastPercent = 0;
        }
        /**
         * Upload dropped files. This will try to upload everything it can. Errors
         * will show via notifications. If an upload operation is ongoing, the files
         * will be added to that operation.
         */
        async uploadDropped(event, uploadDir) {
            await this.queueFiles(event, uploadDir);
            if (!this.uploadPromise) {
                this.uploadPromise = this.progressService.withProgress({
                    cancellable: true,
                    location: 15 /* Notification */,
                    title: "Uploading files...",
                }, (progress) => {
                    return new Promise((resolve) => {
                        this.progress = progress;
                        this.resolveUploadPromise = () => {
                            const uploaded = this.uploadedFilePaths;
                            this.uploadPromise = undefined;
                            this.resolveUploadPromise = undefined;
                            this.uploadedFilePaths = [];
                            this.lastPercent = 0;
                            this._uploaded = 0;
                            this._total = 0;
                            resolve(uploaded);
                        };
                    });
                }, () => this.cancel());
            }
            this.uploadFiles();
            return this.uploadPromise;
        }
        /**
         * Cancel all file uploads.
         */
        async cancel() {
            this.fileQueue.clear();
            this.uploadingFiles.forEach((r) => r && r.abort());
        }
        get total() { return this._total; }
        set total(total) {
            this._total = total;
            this.updateProgress();
        }
        get uploaded() { return this._uploaded; }
        set uploaded(uploaded) {
            this._uploaded = uploaded;
            this.updateProgress();
        }
        updateProgress() {
            if (this.progress && this.total > 0) {
                const percent = Math.floor((this.uploaded / this.total) * 100);
                this.progress.report({ increment: percent - this.lastPercent });
                this.lastPercent = percent;
            }
        }
        /**
         * Upload as many files as possible. When finished, resolve the upload
         * promise.
         */
        uploadFiles() {
            while (this.fileQueue.size > 0 && this.uploadingFiles.size < this.maxParallelUploads) {
                const [path, file] = this.fileQueue.entries().next().value;
                this.fileQueue.delete(path);
                if (this.uploadingFiles.has(path)) {
                    this.notificationService.error(new Error(`Already uploading ${path}`));
                }
                else {
                    this.uploadingFiles.set(path, undefined);
                    this.uploadFile(path, file).catch((error) => {
                        this.notificationService.error(error);
                    }).finally(() => {
                        this.uploadingFiles.delete(path);
                        this.uploadFiles();
                    });
                }
            }
            if (this.fileQueue.size === 0 && this.uploadingFiles.size === 0) {
                this.resolveUploadPromise();
            }
        }
        /**
         * Upload a file, asking to override if necessary.
         */
        async uploadFile(filePath, file) {
            const uri = uri_1.URI.file(filePath);
            if (await this.fileService.exists(uri)) {
                const overwrite = await new Promise((resolve) => {
                    this.notificationService.prompt(notification_1.Severity.Error, `${filePath} already exists. Overwrite?`, [
                        { label: "Yes", run: () => resolve(true) },
                        { label: "No", run: () => resolve(false) },
                    ], { onCancel: () => resolve(false) });
                });
                if (!overwrite) {
                    return;
                }
            }
            const tempUri = uri.with({
                path: path.join(path.dirname(uri.path), `.code-server-partial-upload-${path.basename(uri.path)}-${uuid_1.generateUuid()}`),
            });
            const reader = new Reader(file);
            reader.on("data", (data) => {
                if (data && data.byteLength > 0) {
                    this.uploaded += data.byteLength;
                }
            });
            this.uploadingFiles.set(filePath, reader);
            await this.fileService.writeFile(tempUri, reader);
            if (reader.aborted) {
                this.uploaded += (file.size - reader.offset);
                await this.fileService.del(tempUri);
            }
            else {
                await this.fileService.move(tempUri, uri, true);
                this.uploadedFilePaths.push(filePath);
            }
        }
        /**
         * Queue files from a drop event. We have to get the files first; we can't do
         * it in tandem with uploading or the entries will disappear.
         */
        async queueFiles(event, uploadDir) {
            const promises = [];
            for (let i = 0; event.dataTransfer && event.dataTransfer.items && i < event.dataTransfer.items.length; ++i) {
                const item = event.dataTransfer.items[i];
                if (typeof item.webkitGetAsEntry === "function") {
                    promises.push(this.traverseItem(item.webkitGetAsEntry(), uploadDir.fsPath));
                }
                else {
                    const file = item.getAsFile();
                    if (file) {
                        this.addFile(uploadDir.fsPath + "/" + file.name, file);
                    }
                }
            }
            await Promise.all(promises);
        }
        /**
         * Traverses an entry and add files to the queue.
         */
        async traverseItem(entry, path) {
            if (entry.isFile) {
                return new Promise((resolve) => {
                    entry.file((file) => {
                        resolve(this.addFile(path + "/" + file.name, file));
                    });
                });
            }
            path += "/" + entry.name;
            await new Promise((resolve) => {
                const promises = [];
                const dirReader = entry.createReader();
                // According to the spec, readEntries() must be called until it calls
                // the callback with an empty array.
                const readEntries = () => {
                    dirReader.readEntries((entries) => {
                        if (entries.length === 0) {
                            Promise.all(promises).then(resolve).catch((error) => {
                                this.notificationService.error(error);
                                resolve();
                            });
                        }
                        else {
                            promises.push(...entries.map((c) => this.traverseItem(c, path)));
                            readEntries();
                        }
                    });
                };
                readEntries();
            });
        }
        /**
         * Add a file to the queue.
         */
        addFile(path, file) {
            this.total += file.size;
            this.fileQueue.set(path, file);
        }
    };
    Upload = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, progress_1.IProgressService),
        __param(2, files_1.IFileService)
    ], Upload);
    class Reader {
        constructor(file) {
            this.file = file;
            this._offset = 0;
            this.size = 32000; // ~32kb max while reading in the file.
            this._aborted = false;
            this.reader = new FileReader();
            this.paused = true;
            this.callbacks = new Map();
            this.abort = () => {
                this._aborted = true;
                this.reader.abort();
                this.reader.removeEventListener("load", this.onLoad);
                this.emit("end");
            };
            this.onLoad = () => {
                this.buffer = buffer_1.VSBuffer.wrap(new Uint8Array(this.reader.result));
                if (!this.paused) {
                    this.readNextChunk();
                }
            };
            this.reader.addEventListener("load", this.onLoad);
        }
        get offset() { return this._offset; }
        get aborted() { return this._aborted; }
        on(event, callback) {
            if (!this.callbacks.has(event)) {
                this.callbacks.set(event, []);
            }
            this.callbacks.get(event).push(callback);
            if (this.aborted) {
                return this.emit("error", new Error("stream has been aborted"));
            }
            else if (this.done) {
                return this.emit("error", new Error("stream has ended"));
            }
            else if (event === "end") { // Once this is being listened to we can safely start outputting data.
                this.resume();
            }
        }
        pause() {
            this.paused = true;
        }
        resume() {
            if (this.paused) {
                this.paused = false;
                this.readNextChunk();
            }
        }
        destroy() {
            this.abort();
        }
        readNextChunk() {
            if (this.buffer) {
                this._offset += this.buffer.byteLength;
                this.emit("data", this.buffer);
                this.buffer = undefined;
            }
            if (!this.paused) { // Could be paused during the data event.
                if (this.done) {
                    this.emit("end");
                }
                else {
                    this.reader.readAsArrayBuffer(this.file.slice(this.offset, this.offset + this.size));
                }
            }
        }
        emit(event, ...args) {
            if (this.callbacks.has(event)) {
                this.callbacks.get(event).forEach((cb) => cb(...args));
            }
        }
        get done() {
            return this.offset >= this.file.size;
        }
    }
});
//# sourceMappingURL=upload.js.map