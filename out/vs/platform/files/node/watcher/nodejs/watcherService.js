/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/files/node/watcher/watcher", "vs/base/common/lifecycle", "vs/base/node/pfs", "vs/base/node/extpath", "vs/base/node/watcher", "vs/base/common/async", "vs/base/common/path"], function (require, exports, watcher_1, lifecycle_1, pfs_1, extpath_1, watcher_2, async_1, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FileWatcher extends lifecycle_1.Disposable {
        constructor(path, onFileChanges, onLogMessage, verboseLogging) {
            super();
            this.path = path;
            this.onFileChanges = onFileChanges;
            this.onLogMessage = onLogMessage;
            this.verboseLogging = verboseLogging;
            this.fileChangesDelayer = this._register(new async_1.ThrottledDelayer(watcher_2.CHANGE_BUFFER_DELAY * 2 /* sync on delay from underlying library */));
            this.fileChangesBuffer = [];
            this.startWatching();
        }
        setVerboseLogging(verboseLogging) {
            this.verboseLogging = verboseLogging;
        }
        async startWatching() {
            try {
                const { stat, isSymbolicLink } = await pfs_1.statLink(this.path);
                if (this.isDisposed) {
                    return;
                }
                let pathToWatch = this.path;
                if (isSymbolicLink) {
                    try {
                        pathToWatch = await extpath_1.realpath(pathToWatch);
                    }
                    catch (error) {
                        this.onError(error);
                    }
                }
                // Watch Folder
                if (stat.isDirectory()) {
                    this._register(watcher_2.watchFolder(pathToWatch, (eventType, path) => {
                        this.onFileChange({
                            type: eventType === 'changed' ? 0 /* UPDATED */ : eventType === 'added' ? 1 /* ADDED */ : 2 /* DELETED */,
                            path: path_1.join(this.path, path_1.basename(path)) // ensure path is identical with what was passed in
                        });
                    }, error => this.onError(error)));
                }
                // Watch File
                else {
                    this._register(watcher_2.watchFile(pathToWatch, eventType => {
                        this.onFileChange({
                            type: eventType === 'changed' ? 0 /* UPDATED */ : 2 /* DELETED */,
                            path: this.path // ensure path is identical with what was passed in
                        });
                    }, error => this.onError(error)));
                }
            }
            catch (error) {
                this.onError(error);
            }
        }
        onFileChange(event) {
            // Add to buffer
            this.fileChangesBuffer.push(event);
            // Logging
            if (this.verboseLogging) {
                this.onVerbose(`${event.type === 1 /* ADDED */ ? '[ADDED]' : event.type === 2 /* DELETED */ ? '[DELETED]' : '[CHANGED]'} ${event.path}`);
            }
            // Handle emit through delayer to accommodate for bulk changes and thus reduce spam
            this.fileChangesDelayer.trigger(() => {
                const fileChanges = this.fileChangesBuffer;
                this.fileChangesBuffer = [];
                // Event normalization
                const normalizedFileChanges = watcher_1.normalizeFileChanges(fileChanges);
                // Logging
                if (this.verboseLogging) {
                    normalizedFileChanges.forEach(event => {
                        this.onVerbose(`>> normalized ${event.type === 1 /* ADDED */ ? '[ADDED]' : event.type === 2 /* DELETED */ ? '[DELETED]' : '[CHANGED]'} ${event.path}`);
                    });
                }
                // Fire
                if (normalizedFileChanges.length > 0) {
                    this.onFileChanges(normalizedFileChanges);
                }
                return Promise.resolve();
            });
        }
        onError(error) {
            if (!this.isDisposed) {
                this.onLogMessage({ type: 'error', message: `[File Watcher (node.js)] ${error}` });
            }
        }
        onVerbose(message) {
            if (!this.isDisposed) {
                this.onLogMessage({ type: 'trace', message: `[File Watcher (node.js)] ${message}` });
            }
        }
        dispose() {
            this.isDisposed = true;
            super.dispose();
        }
    }
    exports.FileWatcher = FileWatcher;
});
//# sourceMappingURL=watcherService.js.map