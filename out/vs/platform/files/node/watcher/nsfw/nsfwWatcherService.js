/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/glob", "vs/base/common/extpath", "vs/base/common/path", "vs/base/common/platform", "vs/platform/files/node/watcher/watcher", "nsfw", "vs/base/common/async", "vs/base/common/normalization", "vs/base/common/event", "vs/base/node/extpath"], function (require, exports, glob, extpath, path, platform, watcher_1, nsfw, async_1, normalization_1, event_1, extpath_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const nsfwActionToRawChangeType = [];
    nsfwActionToRawChangeType[nsfw.actions.CREATED] = 1 /* ADDED */;
    nsfwActionToRawChangeType[nsfw.actions.MODIFIED] = 0 /* UPDATED */;
    nsfwActionToRawChangeType[nsfw.actions.DELETED] = 2 /* DELETED */;
    class NsfwWatcherService {
        constructor() {
            this._pathWatchers = {};
            this._onWatchEvent = new event_1.Emitter();
            this.onWatchEvent = this._onWatchEvent.event;
            this._onLogMessage = new event_1.Emitter();
            this.onLogMessage = this._onLogMessage.event;
        }
        watch(options) {
            return this.onWatchEvent;
        }
        _watch(request) {
            let undeliveredFileEvents = [];
            const fileEventDelayer = new async_1.ThrottledDelayer(NsfwWatcherService.FS_EVENT_DELAY);
            let readyPromiseResolve;
            this._pathWatchers[request.path] = {
                ready: new Promise(resolve => readyPromiseResolve = resolve),
                ignored: Array.isArray(request.excludes) ? request.excludes.map(ignored => glob.parse(ignored)) : []
            };
            process.on('uncaughtException', (e) => {
                // Specially handle ENOSPC errors that can happen when
                // the watcher consumes so many file descriptors that
                // we are running into a limit. We only want to warn
                // once in this case to avoid log spam.
                // See https://github.com/Microsoft/vscode/issues/7950
                if (e === 'Inotify limit reached' && !this.enospcErrorLogged) {
                    this.enospcErrorLogged = true;
                    this.error('Inotify limit reached (ENOSPC)');
                }
            });
            // NSFW does not report file changes in the path provided on macOS if
            // - the path uses wrong casing
            // - the path is a symbolic link
            // We have to detect this case and massage the events to correct this.
            let realBasePathDiffers = false;
            let realBasePathLength = request.path.length;
            if (platform.isMacintosh) {
                try {
                    // First check for symbolic link
                    let realBasePath = extpath_1.realpathSync(request.path);
                    // Second check for casing difference
                    if (request.path === realBasePath) {
                        realBasePath = (extpath_1.realcaseSync(request.path) || request.path);
                    }
                    if (request.path !== realBasePath) {
                        realBasePathLength = realBasePath.length;
                        realBasePathDiffers = true;
                        this.warn(`Watcher basePath does not match version on disk and will be corrected (original: ${request.path}, real: ${realBasePath})`);
                    }
                }
                catch (error) {
                    // ignore
                }
            }
            nsfw(request.path, events => {
                for (const e of events) {
                    // Logging
                    if (this._verboseLogging) {
                        const logPath = e.action === nsfw.actions.RENAMED ? path.join(e.directory, e.oldFile || '') + ' -> ' + e.newFile : path.join(e.directory, e.file || '');
                        this.log(`${e.action === nsfw.actions.CREATED ? '[CREATED]' : e.action === nsfw.actions.DELETED ? '[DELETED]' : e.action === nsfw.actions.MODIFIED ? '[CHANGED]' : '[RENAMED]'} ${logPath}`);
                    }
                    // Convert nsfw event to IRawFileChange and add to queue
                    let absolutePath;
                    if (e.action === nsfw.actions.RENAMED) {
                        // Rename fires when a file's name changes within a single directory
                        absolutePath = path.join(e.directory, e.oldFile || '');
                        if (!this._isPathIgnored(absolutePath, this._pathWatchers[request.path].ignored)) {
                            undeliveredFileEvents.push({ type: 2 /* DELETED */, path: absolutePath });
                        }
                        else if (this._verboseLogging) {
                            this.log(` >> ignored ${absolutePath}`);
                        }
                        absolutePath = path.join(e.newDirectory || e.directory, e.newFile || '');
                        if (!this._isPathIgnored(absolutePath, this._pathWatchers[request.path].ignored)) {
                            undeliveredFileEvents.push({ type: 1 /* ADDED */, path: absolutePath });
                        }
                        else if (this._verboseLogging) {
                            this.log(` >> ignored ${absolutePath}`);
                        }
                    }
                    else {
                        absolutePath = path.join(e.directory, e.file || '');
                        if (!this._isPathIgnored(absolutePath, this._pathWatchers[request.path].ignored)) {
                            undeliveredFileEvents.push({
                                type: nsfwActionToRawChangeType[e.action],
                                path: absolutePath
                            });
                        }
                        else if (this._verboseLogging) {
                            this.log(` >> ignored ${absolutePath}`);
                        }
                    }
                }
                // Delay and send buffer
                fileEventDelayer.trigger(() => {
                    const events = undeliveredFileEvents;
                    undeliveredFileEvents = [];
                    if (platform.isMacintosh) {
                        events.forEach(e => {
                            // Mac uses NFD unicode form on disk, but we want NFC
                            e.path = normalization_1.normalizeNFC(e.path);
                            // Convert paths back to original form in case it differs
                            if (realBasePathDiffers) {
                                e.path = request.path + e.path.substr(realBasePathLength);
                            }
                        });
                    }
                    // Broadcast to clients normalized
                    const res = watcher_1.normalizeFileChanges(events);
                    this._onWatchEvent.fire(res);
                    // Logging
                    if (this._verboseLogging) {
                        res.forEach(r => {
                            this.log(` >> normalized ${r.type === 1 /* ADDED */ ? '[ADDED]' : r.type === 2 /* DELETED */ ? '[DELETED]' : '[CHANGED]'} ${r.path}`);
                        });
                    }
                    return Promise.resolve(undefined);
                });
            }).then(watcher => {
                this._pathWatchers[request.path].watcher = watcher;
                const startPromise = watcher.start();
                startPromise.then(() => readyPromiseResolve(watcher));
                return startPromise;
            });
        }
        setRoots(roots) {
            const promises = [];
            const normalizedRoots = this._normalizeRoots(roots);
            // Gather roots that are not currently being watched
            const rootsToStartWatching = normalizedRoots.filter(r => {
                return !(r.path in this._pathWatchers);
            });
            // Gather current roots that don't exist in the new roots array
            const rootsToStopWatching = Object.keys(this._pathWatchers).filter(r => {
                return normalizedRoots.every(normalizedRoot => normalizedRoot.path !== r);
            });
            // Logging
            if (this._verboseLogging) {
                this.log(`Start watching: [${rootsToStartWatching.map(r => r.path).join(',')}]\nStop watching: [${rootsToStopWatching.join(',')}]`);
            }
            // Stop watching some roots
            rootsToStopWatching.forEach(root => {
                this._pathWatchers[root].ready.then(watcher => watcher.stop());
                delete this._pathWatchers[root];
            });
            // Start watching some roots
            rootsToStartWatching.forEach(root => this._watch(root));
            // Refresh ignored arrays in case they changed
            roots.forEach(root => {
                if (root.path in this._pathWatchers) {
                    this._pathWatchers[root.path].ignored = Array.isArray(root.excludes) ? root.excludes.map(ignored => glob.parse(ignored)) : [];
                }
            });
            return Promise.all(promises).then(() => undefined);
        }
        setVerboseLogging(enabled) {
            this._verboseLogging = enabled;
            return Promise.resolve(undefined);
        }
        stop() {
            for (let path in this._pathWatchers) {
                let watcher = this._pathWatchers[path];
                watcher.ready.then(watcher => watcher.stop());
                delete this._pathWatchers[path];
            }
            this._pathWatchers = Object.create(null);
            return Promise.resolve();
        }
        /**
         * Normalizes a set of root paths by removing any root paths that are
         * sub-paths of other roots.
         */
        _normalizeRoots(roots) {
            return roots.filter(r => roots.every(other => {
                return !(r.path.length > other.path.length && extpath.isEqualOrParent(r.path, other.path));
            }));
        }
        _isPathIgnored(absolutePath, ignored) {
            return ignored && ignored.some(i => i(absolutePath));
        }
        log(message) {
            this._onLogMessage.fire({ type: 'trace', message: `[File Watcher (nsfw)] ` + message });
        }
        warn(message) {
            this._onLogMessage.fire({ type: 'warn', message: `[File Watcher (nsfw)] ` + message });
        }
        error(message) {
            this._onLogMessage.fire({ type: 'error', message: `[File Watcher (nsfw)] ` + message });
        }
    }
    exports.NsfwWatcherService = NsfwWatcherService;
    NsfwWatcherService.FS_EVENT_DELAY = 50; // aggregate and only emit events when changes have stopped for this duration (in ms)
});
//# sourceMappingURL=nsfwWatcherService.js.map