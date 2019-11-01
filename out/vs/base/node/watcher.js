/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "fs", "vs/base/common/platform", "vs/base/common/normalization", "vs/base/common/lifecycle", "vs/base/node/pfs"], function (require, exports, path_1, fs_1, platform_1, normalization_1, lifecycle_1, pfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function watchFile(path, onChange, onError) {
        return doWatchNonRecursive({ path, isDirectory: false }, onChange, onError);
    }
    exports.watchFile = watchFile;
    function watchFolder(path, onChange, onError) {
        return doWatchNonRecursive({ path, isDirectory: true }, onChange, onError);
    }
    exports.watchFolder = watchFolder;
    exports.CHANGE_BUFFER_DELAY = 100;
    function doWatchNonRecursive(file, onChange, onError) {
        const originalFileName = path_1.basename(file.path);
        const mapPathToStatDisposable = new Map();
        let disposed = false;
        let watcherDisposables = [lifecycle_1.toDisposable(() => {
                mapPathToStatDisposable.forEach(disposable => lifecycle_1.dispose(disposable));
                mapPathToStatDisposable.clear();
            })];
        try {
            // Creating watcher can fail with an exception
            const watcher = fs_1.watch(file.path);
            watcherDisposables.push(lifecycle_1.toDisposable(() => {
                watcher.removeAllListeners();
                watcher.close();
            }));
            // Folder: resolve children to emit proper events
            const folderChildren = new Set();
            if (file.isDirectory) {
                pfs_1.readdir(file.path).then(children => children.forEach(child => folderChildren.add(child)));
            }
            watcher.on('error', (code, signal) => {
                if (!disposed) {
                    onError(`Failed to watch ${file.path} for changes using fs.watch() (${code}, ${signal})`);
                }
            });
            watcher.on('change', (type, raw) => {
                if (disposed) {
                    return; // ignore if already disposed
                }
                // Normalize file name
                let changedFileName = '';
                if (raw) { // https://github.com/Microsoft/vscode/issues/38191
                    changedFileName = raw.toString();
                    if (platform_1.isMacintosh) {
                        // Mac: uses NFD unicode form on disk, but we want NFC
                        // See also https://github.com/nodejs/node/issues/2165
                        changedFileName = normalization_1.normalizeNFC(changedFileName);
                    }
                }
                if (!changedFileName || (type !== 'change' && type !== 'rename')) {
                    return; // ignore unexpected events
                }
                // File path: use path directly for files and join with changed file name otherwise
                const changedFilePath = file.isDirectory ? path_1.join(file.path, changedFileName) : file.path;
                // File
                if (!file.isDirectory) {
                    if (type === 'rename' || changedFileName !== originalFileName) {
                        // The file was either deleted or renamed. Many tools apply changes to files in an
                        // atomic way ("Atomic Save") by first renaming the file to a temporary name and then
                        // renaming it back to the original name. Our watcher will detect this as a rename
                        // and then stops to work on Mac and Linux because the watcher is applied to the
                        // inode and not the name. The fix is to detect this case and trying to watch the file
                        // again after a certain delay.
                        // In addition, we send out a delete event if after a timeout we detect that the file
                        // does indeed not exist anymore.
                        const timeoutHandle = setTimeout(async () => {
                            const fileExists = await pfs_1.exists(changedFilePath);
                            if (disposed) {
                                return; // ignore if disposed by now
                            }
                            // File still exists, so emit as change event and reapply the watcher
                            if (fileExists) {
                                onChange('changed', changedFilePath);
                                watcherDisposables = [doWatchNonRecursive(file, onChange, onError)];
                            }
                            // File seems to be really gone, so emit a deleted event
                            else {
                                onChange('deleted', changedFilePath);
                            }
                        }, exports.CHANGE_BUFFER_DELAY);
                        // Very important to dispose the watcher which now points to a stale inode
                        // and wire in a new disposable that tracks our timeout that is installed
                        lifecycle_1.dispose(watcherDisposables);
                        watcherDisposables = [lifecycle_1.toDisposable(() => clearTimeout(timeoutHandle))];
                    }
                    else {
                        onChange('changed', changedFilePath);
                    }
                }
                // Folder
                else {
                    // Children add/delete
                    if (type === 'rename') {
                        // Cancel any previous stats for this file path if existing
                        const statDisposable = mapPathToStatDisposable.get(changedFilePath);
                        if (statDisposable) {
                            lifecycle_1.dispose(statDisposable);
                        }
                        // Wait a bit and try see if the file still exists on disk to decide on the resulting event
                        const timeoutHandle = setTimeout(async () => {
                            mapPathToStatDisposable.delete(changedFilePath);
                            const fileExists = await pfs_1.exists(changedFilePath);
                            if (disposed) {
                                return; // ignore if disposed by now
                            }
                            // Figure out the correct event type:
                            // File Exists: either 'added' or 'changed' if known before
                            // File Does not Exist: always 'deleted'
                            let type;
                            if (fileExists) {
                                if (folderChildren.has(changedFileName)) {
                                    type = 'changed';
                                }
                                else {
                                    type = 'added';
                                    folderChildren.add(changedFileName);
                                }
                            }
                            else {
                                folderChildren.delete(changedFileName);
                                type = 'deleted';
                            }
                            onChange(type, changedFilePath);
                        }, exports.CHANGE_BUFFER_DELAY);
                        mapPathToStatDisposable.set(changedFilePath, lifecycle_1.toDisposable(() => clearTimeout(timeoutHandle)));
                    }
                    // Other events
                    else {
                        // Figure out the correct event type: if this is the
                        // first time we see this child, it can only be added
                        let type;
                        if (folderChildren.has(changedFileName)) {
                            type = 'changed';
                        }
                        else {
                            type = 'added';
                            folderChildren.add(changedFileName);
                        }
                        onChange(type, changedFilePath);
                    }
                }
            });
        }
        catch (error) {
            pfs_1.exists(file.path).then(exists => {
                if (exists && !disposed) {
                    onError(`Failed to watch ${file.path} for changes using fs.watch() (${error.toString()})`);
                }
            });
        }
        return lifecycle_1.toDisposable(() => {
            disposed = true;
            watcherDisposables = lifecycle_1.dispose(watcherDisposables);
        });
    }
});
//# sourceMappingURL=watcher.js.map