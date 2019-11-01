/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "chokidar", "fs", "graceful-fs", "vs/base/common/extpath", "vs/base/common/glob", "vs/base/common/async", "vs/base/common/normalization", "vs/base/node/extpath", "vs/base/common/platform", "vs/platform/files/node/watcher/watcher", "vs/base/common/event"], function (require, exports, chokidar, fs, gracefulFs, extpath, glob, async_1, normalization_1, extpath_1, platform_1, watcher_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    gracefulFs.gracefulify(fs);
    class ChokidarWatcherService {
        constructor() {
            this._onWatchEvent = new event_1.Emitter();
            this.onWatchEvent = this._onWatchEvent.event;
            this._onLogMessage = new event_1.Emitter();
            this.onLogMessage = this._onLogMessage.event;
        }
        watch(options) {
            this._pollingInterval = options.pollingInterval;
            this._usePolling = options.usePolling;
            this._watchers = Object.create(null);
            this._watcherCount = 0;
            return this.onWatchEvent;
        }
        setVerboseLogging(enabled) {
            this._verboseLogging = enabled;
            return Promise.resolve();
        }
        setRoots(requests) {
            const watchers = Object.create(null);
            const newRequests = [];
            const requestsByBasePath = normalizeRoots(requests);
            // evaluate new & remaining watchers
            for (let basePath in requestsByBasePath) {
                let watcher = this._watchers[basePath];
                if (watcher && isEqualRequests(watcher.requests, requestsByBasePath[basePath])) {
                    watchers[basePath] = watcher;
                    delete this._watchers[basePath];
                }
                else {
                    newRequests.push(basePath);
                }
            }
            // stop all old watchers
            for (let path in this._watchers) {
                this._watchers[path].stop();
            }
            // start all new watchers
            for (let basePath of newRequests) {
                let requests = requestsByBasePath[basePath];
                watchers[basePath] = this._watch(basePath, requests);
            }
            this._watchers = watchers;
            return Promise.resolve();
        }
        // for test purposes
        get wacherCount() {
            return this._watcherCount;
        }
        _watch(basePath, requests) {
            if (this._verboseLogging) {
                this.log(`Start watching: ${basePath}]`);
            }
            const pollingInterval = this._pollingInterval || 5000;
            const usePolling = this._usePolling;
            if (usePolling && this._verboseLogging) {
                this.log(`Use polling instead of fs.watch: Polling interval ${pollingInterval} ms`);
            }
            const watcherOpts = {
                ignoreInitial: true,
                ignorePermissionErrors: true,
                followSymlinks: true,
                interval: pollingInterval,
                binaryInterval: pollingInterval,
                usePolling: usePolling,
                disableGlobbing: true // fix https://github.com/Microsoft/vscode/issues/4586
            };
            const excludes = [];
            // if there's only one request, use the built-in ignore-filterering
            const isSingleFolder = requests.length === 1;
            if (isSingleFolder) {
                excludes.push(...requests[0].excludes);
            }
            if ((platform_1.isMacintosh || platform_1.isLinux) && (basePath.length === 0 || basePath === '/')) {
                excludes.push('/dev/**');
                if (platform_1.isLinux) {
                    excludes.push('/proc/**', '/sys/**');
                }
            }
            watcherOpts.ignored = excludes;
            // Chokidar fails when the basePath does not match case-identical to the path on disk
            // so we have to find the real casing of the path and do some path massaging to fix this
            // see https://github.com/paulmillr/chokidar/issues/418
            const realBasePath = platform_1.isMacintosh ? (extpath_1.realcaseSync(basePath) || basePath) : basePath;
            const realBasePathLength = realBasePath.length;
            const realBasePathDiffers = (basePath !== realBasePath);
            if (realBasePathDiffers) {
                this.warn(`Watcher basePath does not match version on disk and was corrected (original: ${basePath}, real: ${realBasePath})`);
            }
            let chokidarWatcher = chokidar.watch(realBasePath, watcherOpts);
            this._watcherCount++;
            // Detect if for some reason the native watcher library fails to load
            if (platform_1.isMacintosh && chokidarWatcher.options && !chokidarWatcher.options.useFsEvents) {
                this.warn('Watcher is not using native fsevents library and is falling back to unefficient polling.');
            }
            let undeliveredFileEvents = [];
            let fileEventDelayer = new async_1.ThrottledDelayer(ChokidarWatcherService.FS_EVENT_DELAY);
            const watcher = {
                requests,
                stop: () => {
                    try {
                        if (this._verboseLogging) {
                            this.log(`Stop watching: ${basePath}]`);
                        }
                        if (chokidarWatcher) {
                            chokidarWatcher.close();
                            this._watcherCount--;
                            chokidarWatcher = null;
                        }
                        if (fileEventDelayer) {
                            fileEventDelayer.cancel();
                            fileEventDelayer = null;
                        }
                    }
                    catch (error) {
                        this.warn('Error while stopping watcher: ' + error.toString());
                    }
                }
            };
            chokidarWatcher.on('all', (type, path) => {
                if (platform_1.isMacintosh) {
                    // Mac: uses NFD unicode form on disk, but we want NFC
                    // See also https://github.com/nodejs/node/issues/2165
                    path = normalization_1.normalizeNFC(path);
                }
                if (path.indexOf(realBasePath) < 0) {
                    return; // we really only care about absolute paths here in our basepath context here
                }
                // Make sure to convert the path back to its original basePath form if the realpath is different
                if (realBasePathDiffers) {
                    path = basePath + path.substr(realBasePathLength);
                }
                let eventType;
                switch (type) {
                    case 'change':
                        eventType = 0 /* UPDATED */;
                        break;
                    case 'add':
                    case 'addDir':
                        eventType = 1 /* ADDED */;
                        break;
                    case 'unlink':
                    case 'unlinkDir':
                        eventType = 2 /* DELETED */;
                        break;
                    default:
                        return;
                }
                // if there's more than one request we need to do
                // extra filtering due to potentially overlapping roots
                if (!isSingleFolder) {
                    if (isIgnored(path, watcher.requests)) {
                        return;
                    }
                }
                let event = { type: eventType, path };
                // Logging
                if (this._verboseLogging) {
                    this.log(`${eventType === 1 /* ADDED */ ? '[ADDED]' : eventType === 2 /* DELETED */ ? '[DELETED]' : '[CHANGED]'} ${path}`);
                }
                // Check for spam
                const now = Date.now();
                if (undeliveredFileEvents.length === 0) {
                    this.spamWarningLogged = false;
                    this.spamCheckStartTime = now;
                }
                else if (!this.spamWarningLogged && typeof this.spamCheckStartTime === 'number' && this.spamCheckStartTime + ChokidarWatcherService.EVENT_SPAM_WARNING_THRESHOLD < now) {
                    this.spamWarningLogged = true;
                    this.warn(`Watcher is busy catching up with ${undeliveredFileEvents.length} file changes in 60 seconds. Latest changed path is "${event.path}"`);
                }
                // Add to buffer
                undeliveredFileEvents.push(event);
                if (fileEventDelayer) {
                    // Delay and send buffer
                    fileEventDelayer.trigger(() => {
                        const events = undeliveredFileEvents;
                        undeliveredFileEvents = [];
                        // Broadcast to clients normalized
                        const res = watcher_1.normalizeFileChanges(events);
                        this._onWatchEvent.fire(res);
                        // Logging
                        if (this._verboseLogging) {
                            res.forEach(r => {
                                this.log(` >> normalized  ${r.type === 1 /* ADDED */ ? '[ADDED]' : r.type === 2 /* DELETED */ ? '[DELETED]' : '[CHANGED]'} ${r.path}`);
                            });
                        }
                        return Promise.resolve(undefined);
                    });
                }
            });
            chokidarWatcher.on('error', (error) => {
                if (error) {
                    // Specially handle ENOSPC errors that can happen when
                    // the watcher consumes so many file descriptors that
                    // we are running into a limit. We only want to warn
                    // once in this case to avoid log spam.
                    // See https://github.com/Microsoft/vscode/issues/7950
                    if (error.code === 'ENOSPC') {
                        if (!this.enospcErrorLogged) {
                            this.enospcErrorLogged = true;
                            this.stop();
                            this.error('Inotify limit reached (ENOSPC)');
                        }
                    }
                    else {
                        this.warn(error.toString());
                    }
                }
            });
            return watcher;
        }
        stop() {
            for (let path in this._watchers) {
                let watcher = this._watchers[path];
                watcher.stop();
            }
            this._watchers = Object.create(null);
            return Promise.resolve();
        }
        log(message) {
            this._onLogMessage.fire({ type: 'trace', message: `[File Watcher (chokidar)] ` + message });
        }
        warn(message) {
            this._onLogMessage.fire({ type: 'warn', message: `[File Watcher (chokidar)] ` + message });
        }
        error(message) {
            this._onLogMessage.fire({ type: 'error', message: `[File Watcher (chokidar)] ` + message });
        }
    }
    exports.ChokidarWatcherService = ChokidarWatcherService;
    ChokidarWatcherService.FS_EVENT_DELAY = 50; // aggregate and only emit events when changes have stopped for this duration (in ms)
    ChokidarWatcherService.EVENT_SPAM_WARNING_THRESHOLD = 60 * 1000; // warn after certain time span of event spam
    function isIgnored(path, requests) {
        for (let request of requests) {
            if (request.path === path) {
                return false;
            }
            if (extpath.isEqualOrParent(path, request.path)) {
                if (!request.parsedPattern) {
                    if (request.excludes && request.excludes.length > 0) {
                        let pattern = `{${request.excludes.join(',')}}`;
                        request.parsedPattern = glob.parse(pattern);
                    }
                    else {
                        request.parsedPattern = () => false;
                    }
                }
                const relPath = path.substr(request.path.length + 1);
                if (!request.parsedPattern(relPath)) {
                    return false;
                }
            }
        }
        return true;
    }
    /**
     * Normalizes a set of root paths by grouping by the most parent root path.
     * equests with Sub paths are skipped if they have the same ignored set as the parent.
     */
    function normalizeRoots(requests) {
        requests = requests.sort((r1, r2) => r1.path.localeCompare(r2.path));
        let prevRequest = null;
        let result = Object.create(null);
        for (let request of requests) {
            let basePath = request.path;
            let ignored = (request.excludes || []).sort();
            if (prevRequest && (extpath.isEqualOrParent(basePath, prevRequest.path))) {
                if (!isEqualIgnore(ignored, prevRequest.excludes)) {
                    result[prevRequest.path].push({ path: basePath, excludes: ignored });
                }
            }
            else {
                prevRequest = { path: basePath, excludes: ignored };
                result[basePath] = [prevRequest];
            }
        }
        return result;
    }
    exports.normalizeRoots = normalizeRoots;
    function isEqualRequests(r1, r2) {
        if (r1.length !== r2.length) {
            return false;
        }
        for (let k = 0; k < r1.length; k++) {
            if (r1[k].path !== r2[k].path || !isEqualIgnore(r1[k].excludes, r2[k].excludes)) {
                return false;
            }
        }
        return true;
    }
    function isEqualIgnore(i1, i2) {
        if (i1.length !== i2.length) {
            return false;
        }
        for (let k = 0; k < i1.length; k++) {
            if (i1[k] !== i2[k]) {
                return false;
            }
        }
        return true;
    }
});
//# sourceMappingURL=chokidarWatcherService.js.map