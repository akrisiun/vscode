/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/files/node/watcher/win32/csharpWatcherService", "vs/base/common/path", "vs/base/common/strings"], function (require, exports, csharpWatcherService_1, path_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileWatcher = void 0;
    class FileWatcher {
        constructor(folders, onDidFilesChange, onLogMessage, verboseLogging) {
            this.onDidFilesChange = onDidFilesChange;
            this.onLogMessage = onLogMessage;
            this.verboseLogging = verboseLogging;
            this.service = undefined;
            this.folder = folders[0];
            if (this.folder.path.indexOf('\\\\') === 0 && this.folder.path.endsWith(path_1.posix.sep)) {
                // for some weird reason, node adds a trailing slash to UNC paths
                // we never ever want trailing slashes as our base path unless
                // someone opens root ("/").
                // See also https://github.com/nodejs/io.js/issues/1765
                this.folder.path = strings_1.rtrim(this.folder.path, path_1.posix.sep);
            }
            this.service = this.startWatching();
        }
        get isDisposed() {
            return !this.service;
        }
        startWatching() {
            return new csharpWatcherService_1.OutOfProcessWin32FolderWatcher(this.folder.path, this.folder.excludes, events => this.onFileEvents(events), message => this.onLogMessage(message), this.verboseLogging);
        }
        setVerboseLogging(verboseLogging) {
            this.verboseLogging = verboseLogging;
            if (this.service) {
                this.service.dispose();
                this.service = this.startWatching();
            }
        }
        onFileEvents(events) {
            if (this.isDisposed) {
                return;
            }
            // Emit through event emitter
            if (events.length > 0) {
                this.onDidFilesChange(events);
            }
        }
        dispose() {
            if (this.service) {
                this.service.dispose();
                this.service = undefined;
            }
        }
    }
    exports.FileWatcher = FileWatcher;
});
//# sourceMappingURL=watcherService.js.map