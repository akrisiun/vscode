/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/node/ipc.cp", "vs/platform/files/node/watcher/nsfw/watcherIpc", "vs/base/common/lifecycle", "vs/base/common/amd"], function (require, exports, ipc_1, ipc_cp_1, watcherIpc_1, lifecycle_1, amd_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FileWatcher extends lifecycle_1.Disposable {
        constructor(folders, onFileChanges, onLogMessage, verboseLogging) {
            super();
            this.folders = folders;
            this.onFileChanges = onFileChanges;
            this.onLogMessage = onLogMessage;
            this.verboseLogging = verboseLogging;
            this.isDisposed = false;
            this.restartCounter = 0;
            this.startWatching();
        }
        startWatching() {
            const client = this._register(new ipc_cp_1.Client(amd_1.getPathFromAmdModule(require, 'bootstrap-fork'), {
                serverName: 'File Watcher (nsfw)',
                args: ['--type=watcherService'],
                env: {
                    AMD_ENTRYPOINT: 'vs/platform/files/node/watcher/nsfw/watcherApp',
                    PIPE_LOGGING: 'true',
                    VERBOSE_LOGGING: 'true' // transmit console logs from server to client
                }
            }));
            this._register(client.onDidProcessExit(() => {
                // our watcher app should never be completed because it keeps on watching. being in here indicates
                // that the watcher process died and we want to restart it here. we only do it a max number of times
                if (!this.isDisposed) {
                    if (this.restartCounter <= FileWatcher.MAX_RESTARTS) {
                        this.error('terminated unexpectedly and is restarted again...');
                        this.restartCounter++;
                        this.startWatching();
                    }
                    else {
                        this.error('failed to start after retrying for some time, giving up. Please report this as a bug report!');
                    }
                }
            }));
            // Initialize watcher
            const channel = ipc_1.getNextTickChannel(client.getChannel('watcher'));
            this.service = new watcherIpc_1.WatcherChannelClient(channel);
            this.service.setVerboseLogging(this.verboseLogging);
            const options = {};
            this._register(this.service.watch(options)(e => !this.isDisposed && this.onFileChanges(e)));
            this._register(this.service.onLogMessage(m => this.onLogMessage(m)));
            // Start watching
            this.setFolders(this.folders);
        }
        setVerboseLogging(verboseLogging) {
            this.verboseLogging = verboseLogging;
            if (!this.isDisposed && this.service) {
                this.service.setVerboseLogging(verboseLogging);
            }
        }
        error(message) {
            this.onLogMessage({ type: 'error', message: `[File Watcher (nsfw)] ${message}` });
        }
        setFolders(folders) {
            this.folders = folders;
            if (this.service) {
                this.service.setRoots(folders);
            }
        }
        dispose() {
            this.isDisposed = true;
            super.dispose();
        }
    }
    exports.FileWatcher = FileWatcher;
    FileWatcher.MAX_RESTARTS = 5;
});
//# sourceMappingURL=watcherService.js.map