/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "vs/base/node/decoder", "vs/base/common/glob", "vs/base/common/amd"], function (require, exports, cp, decoder, glob, amd_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class OutOfProcessWin32FolderWatcher {
        constructor(watchedFolder, ignored, eventCallback, logCallback, verboseLogging) {
            this.watchedFolder = watchedFolder;
            this.eventCallback = eventCallback;
            this.logCallback = logCallback;
            this.verboseLogging = verboseLogging;
            this.restartCounter = 0;
            if (Array.isArray(ignored)) {
                this.ignored = ignored.map(i => glob.parse(i));
            }
            else {
                this.ignored = [];
            }
            // Logging
            if (this.verboseLogging) {
                this.log(`Start watching: ${watchedFolder}`);
            }
            this.startWatcher();
        }
        startWatcher() {
            const args = [this.watchedFolder];
            if (this.verboseLogging) {
                args.push('-verbose');
            }
            this.handle = cp.spawn(amd_1.getPathFromAmdModule(require, 'vs/platform/files/node/watcher/win32/CodeHelper.exe'), args);
            const stdoutLineDecoder = new decoder.LineDecoder();
            // Events over stdout
            this.handle.stdout.on('data', (data) => {
                // Collect raw events from output
                const rawEvents = [];
                stdoutLineDecoder.write(data).forEach((line) => {
                    const eventParts = line.split('|');
                    if (eventParts.length === 2) {
                        const changeType = Number(eventParts[0]);
                        const absolutePath = eventParts[1];
                        // File Change Event (0 Changed, 1 Created, 2 Deleted)
                        if (changeType >= 0 && changeType < 3) {
                            // Support ignores
                            if (this.ignored && this.ignored.some(ignore => ignore(absolutePath))) {
                                if (this.verboseLogging) {
                                    this.log(absolutePath);
                                }
                                return;
                            }
                            // Otherwise record as event
                            rawEvents.push({
                                type: OutOfProcessWin32FolderWatcher.changeTypeMap[changeType],
                                path: absolutePath
                            });
                        }
                        // 3 Logging
                        else {
                            this.log(eventParts[1]);
                        }
                    }
                });
                // Trigger processing of events through the delayer to batch them up properly
                if (rawEvents.length > 0) {
                    this.eventCallback(rawEvents);
                }
            });
            // Errors
            this.handle.on('error', (error) => this.onError(error));
            this.handle.stderr.on('data', (data) => this.onError(data));
            // Exit
            this.handle.on('exit', (code, signal) => this.onExit(code, signal));
        }
        onError(error) {
            this.error('process error: ' + error.toString());
        }
        onExit(code, signal) {
            if (this.handle) { // exit while not yet being disposed is unexpected!
                this.error(`terminated unexpectedly (code: ${code}, signal: ${signal})`);
                if (this.restartCounter <= OutOfProcessWin32FolderWatcher.MAX_RESTARTS) {
                    this.error('is restarted again...');
                    this.restartCounter++;
                    this.startWatcher(); // restart
                }
                else {
                    this.error('Watcher failed to start after retrying for some time, giving up. Please report this as a bug report!');
                }
            }
        }
        error(message) {
            this.logCallback({ type: 'error', message: `[File Watcher (C#)] ${message}` });
        }
        log(message) {
            this.logCallback({ type: 'trace', message: `[File Watcher (C#)] ${message}` });
        }
        dispose() {
            if (this.handle) {
                this.handle.kill();
                this.handle = undefined;
            }
        }
    }
    exports.OutOfProcessWin32FolderWatcher = OutOfProcessWin32FolderWatcher;
    OutOfProcessWin32FolderWatcher.MAX_RESTARTS = 5;
    OutOfProcessWin32FolderWatcher.changeTypeMap = [0 /* UPDATED */, 1 /* ADDED */, 2 /* DELETED */];
});
//# sourceMappingURL=csharpWatcherService.js.map