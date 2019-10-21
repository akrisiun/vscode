/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "vs/base/common/path", "vs/base/common/objects", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/json", "vs/base/node/pfs", "vs/base/node/extpath", "vs/base/node/watcher"], function (require, exports, fs, path_1, objects, lifecycle_1, event_1, json, pfs_1, extpath_1, watcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A simple helper to watch a configured file for changes and process its contents as JSON object.
     * Supports:
     * - comments in JSON files and errors
     * - symlinks for the config file itself
     * - delayed processing of changes to accomodate for lots of changes
     * - configurable defaults
     */
    class ConfigWatcher extends lifecycle_1.Disposable {
        constructor(_path, options = { defaultConfig: Object.create(null), onError: error => console.error(error) }) {
            super();
            this._path = _path;
            this.options = options;
            this._onDidUpdateConfiguration = this._register(new event_1.Emitter());
            this.registerWatcher();
            this.initAsync();
        }
        get path() {
            return this._path;
        }
        get hasParseErrors() {
            return !!this.parseErrors && this.parseErrors.length > 0;
        }
        get onDidUpdateConfiguration() {
            return this._onDidUpdateConfiguration.event;
        }
        initAsync() {
            this.loadAsync(config => {
                if (!this.loaded) {
                    this.updateCache(config); // prevent race condition if config was loaded sync already
                }
                if (this.options.initCallback) {
                    this.options.initCallback(this.getConfig());
                }
            });
        }
        updateCache(value) {
            this.cache = value;
            this.loaded = true;
        }
        loadSync() {
            try {
                return this.parse(fs.readFileSync(this._path).toString());
            }
            catch (error) {
                return this.options.defaultConfig;
            }
        }
        loadAsync(callback) {
            fs.readFile(this._path, (error, raw) => {
                if (error) {
                    return callback(this.options.defaultConfig);
                }
                return callback(this.parse(raw.toString()));
            });
        }
        parse(raw) {
            let res;
            try {
                this.parseErrors = [];
                res = this.options.parse ? this.options.parse(raw, this.parseErrors) : json.parse(raw, this.parseErrors);
                return res || this.options.defaultConfig;
            }
            catch (error) {
                return this.options.defaultConfig; // Ignore parsing errors
            }
        }
        registerWatcher() {
            // Watch the parent of the path so that we detect ADD and DELETES
            const parentFolder = path_1.dirname(this._path);
            this.watch(parentFolder, true);
            // Check if the path is a symlink and watch its target if so
            this.handleSymbolicLink().then(undefined, () => { });
        }
        async handleSymbolicLink() {
            const { stat, isSymbolicLink } = await pfs_1.statLink(this._path);
            if (isSymbolicLink && !stat.isDirectory()) {
                const realPath = await extpath_1.realpath(this._path);
                this.watch(realPath, false);
            }
        }
        watch(path, isFolder) {
            if (this.disposed) {
                return; // avoid watchers that will never get disposed by checking for being disposed
            }
            if (isFolder) {
                this._register(watcher_1.watchFolder(path, (type, path) => path === this._path ? this.onConfigFileChange() : undefined, error => this.options.onError(error)));
            }
            else {
                this._register(watcher_1.watchFile(path, () => this.onConfigFileChange(), error => this.options.onError(error)));
            }
        }
        onConfigFileChange() {
            if (this.timeoutHandle) {
                global.clearTimeout(this.timeoutHandle);
                this.timeoutHandle = null;
            }
            // we can get multiple change events for one change, so we buffer through a timeout
            this.timeoutHandle = global.setTimeout(() => this.reload(), this.options.changeBufferDelay || 0);
        }
        reload(callback) {
            this.loadAsync(currentConfig => {
                if (!objects.equals(currentConfig, this.cache)) {
                    this.updateCache(currentConfig);
                    this._onDidUpdateConfiguration.fire({ config: currentConfig });
                }
                if (callback) {
                    return callback(currentConfig);
                }
            });
        }
        getConfig() {
            this.ensureLoaded();
            return this.cache;
        }
        ensureLoaded() {
            if (!this.loaded) {
                this.updateCache(this.loadSync());
            }
        }
        dispose() {
            this.disposed = true;
            super.dispose();
        }
    }
    exports.ConfigWatcher = ConfigWatcher;
});
//# sourceMappingURL=config.js.map