/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/async", "fs", "os", "vs/base/common/platform", "vs/base/common/event", "util", "vs/base/common/extpath", "vs/base/common/uuid", "vs/base/common/normalization"], function (require, exports, path_1, async_1, fs, os, platform, event_1, util_1, extpath_1, uuid_1, normalization_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.copy = exports.move = exports.whenDeleted = exports.fileExists = exports.dirExists = exports.readDirsInDir = exports.writeFileSync = exports.writeFile = exports.mkdirp = exports.readFile = exports.truncate = exports.symlink = exports.unlink = exports.renameIgnoreError = exports.rename = exports.lstat = exports.statLink = exports.stat = exports.chmod = exports.exists = exports.readdirSync = exports.readdirWithFileTypes = exports.readdir = exports.rimrafSync = exports.rimraf = exports.RimRafMode = exports.MAX_HEAP_SIZE = exports.MAX_FILE_SIZE = void 0;
    // See https://github.com/Microsoft/vscode/issues/30180
    const WIN32_MAX_FILE_SIZE = 300 * 1024 * 1024; // 300 MB
    const GENERAL_MAX_FILE_SIZE = 16 * 1024 * 1024 * 1024; // 16 GB
    // See https://github.com/v8/v8/blob/5918a23a3d571b9625e5cce246bdd5b46ff7cd8b/src/heap/heap.cc#L149
    const WIN32_MAX_HEAP_SIZE = 700 * 1024 * 1024; // 700 MB
    const GENERAL_MAX_HEAP_SIZE = 700 * 2 * 1024 * 1024; // 1400 MB
    exports.MAX_FILE_SIZE = process.arch === 'ia32' ? WIN32_MAX_FILE_SIZE : GENERAL_MAX_FILE_SIZE;
    exports.MAX_HEAP_SIZE = process.arch === 'ia32' ? WIN32_MAX_HEAP_SIZE : GENERAL_MAX_HEAP_SIZE;
    var RimRafMode;
    (function (RimRafMode) {
        /**
         * Slow version that unlinks each file and folder.
         */
        RimRafMode[RimRafMode["UNLINK"] = 0] = "UNLINK";
        /**
         * Fast version that first moves the file/folder
         * into a temp directory and then deletes that
         * without waiting for it.
         */
        RimRafMode[RimRafMode["MOVE"] = 1] = "MOVE";
    })(RimRafMode = exports.RimRafMode || (exports.RimRafMode = {}));
    async function rimraf(path, mode = RimRafMode.UNLINK) {
        if (extpath_1.isRootOrDriveLetter(path)) {
            throw new Error('rimraf - will refuse to recursively delete root');
        }
        // delete: via unlink
        if (mode === RimRafMode.UNLINK) {
            return rimrafUnlink(path);
        }
        // delete: via move
        return rimrafMove(path);
    }
    exports.rimraf = rimraf;
    async function rimrafUnlink(path) {
        try {
            const stat = await lstat(path);
            // Folder delete (recursive) - NOT for symbolic links though!
            if (stat.isDirectory() && !stat.isSymbolicLink()) {
                // Children
                const children = await readdir(path);
                await Promise.all(children.map(child => rimrafUnlink(path_1.join(path, child))));
                // Folder
                await util_1.promisify(fs.rmdir)(path);
            }
            // Single file delete
            else {
                // chmod as needed to allow for unlink
                const mode = stat.mode;
                if (!(mode & 128)) { // 128 === 0200
                    await chmod(path, mode | 128);
                }
                return unlink(path);
            }
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }
    async function rimrafMove(path) {
        try {
            const pathInTemp = path_1.join(os.tmpdir(), uuid_1.generateUuid());
            try {
                await rename(path, pathInTemp);
            }
            catch (error) {
                return rimrafUnlink(path); // if rename fails, delete without tmp dir
            }
            // Delete but do not return as promise
            rimrafUnlink(pathInTemp);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }
    function rimrafSync(path) {
        if (extpath_1.isRootOrDriveLetter(path)) {
            throw new Error('rimraf - will refuse to recursively delete root');
        }
        try {
            const stat = fs.lstatSync(path);
            // Folder delete (recursive) - NOT for symbolic links though!
            if (stat.isDirectory() && !stat.isSymbolicLink()) {
                // Children
                const children = readdirSync(path);
                children.map(child => rimrafSync(path_1.join(path, child)));
                // Folder
                fs.rmdirSync(path);
            }
            // Single file delete
            else {
                // chmod as needed to allow for unlink
                const mode = stat.mode;
                if (!(mode & 128)) { // 128 === 0200
                    fs.chmodSync(path, mode | 128);
                }
                return fs.unlinkSync(path);
            }
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }
    exports.rimrafSync = rimrafSync;
    async function readdir(path) {
        return handleDirectoryChildren(await util_1.promisify(fs.readdir)(path));
    }
    exports.readdir = readdir;
    async function readdirWithFileTypes(path) {
        const children = await util_1.promisify(fs.readdir)(path, { withFileTypes: true });
        // Mac: uses NFD unicode form on disk, but we want NFC
        // See also https://github.com/nodejs/node/issues/2165
        if (platform.isMacintosh) {
            for (const child of children) {
                child.name = normalization_1.normalizeNFC(child.name);
            }
        }
        return children;
    }
    exports.readdirWithFileTypes = readdirWithFileTypes;
    function readdirSync(path) {
        return handleDirectoryChildren(fs.readdirSync(path));
    }
    exports.readdirSync = readdirSync;
    function handleDirectoryChildren(children) {
        // Mac: uses NFD unicode form on disk, but we want NFC
        // See also https://github.com/nodejs/node/issues/2165
        if (platform.isMacintosh) {
            return children.map(child => normalization_1.normalizeNFC(child));
        }
        return children;
    }
    function exists(path) {
        return util_1.promisify(fs.exists)(path);
    }
    exports.exists = exists;
    function chmod(path, mode) {
        return util_1.promisify(fs.chmod)(path, mode);
    }
    exports.chmod = chmod;
    function stat(path) {
        return util_1.promisify(fs.stat)(path);
    }
    exports.stat = stat;
    async function statLink(path) {
        // First stat the link
        let lstats;
        try {
            lstats = await lstat(path);
            // Return early if the stat is not a symbolic link at all
            if (!lstats.isSymbolicLink()) {
                return { stat: lstats };
            }
        }
        catch (error) {
            /* ignore - use stat() instead */
        }
        // If the stat is a symbolic link or failed to stat, use fs.stat()
        // which for symbolic links will stat the target they point to
        try {
            const stats = await stat(path);
            return { stat: stats, symbolicLink: (lstats === null || lstats === void 0 ? void 0 : lstats.isSymbolicLink()) ? { dangling: false } : undefined };
        }
        catch (error) {
            // If the link points to a non-existing file we still want
            // to return it as result while setting dangling: true flag
            if (error.code === 'ENOENT' && lstats) {
                return { stat: lstats, symbolicLink: { dangling: true } };
            }
            throw error;
        }
    }
    exports.statLink = statLink;
    function lstat(path) {
        return util_1.promisify(fs.lstat)(path);
    }
    exports.lstat = lstat;
    function rename(oldPath, newPath) {
        return util_1.promisify(fs.rename)(oldPath, newPath);
    }
    exports.rename = rename;
    function renameIgnoreError(oldPath, newPath) {
        return new Promise(resolve => fs.rename(oldPath, newPath, () => resolve()));
    }
    exports.renameIgnoreError = renameIgnoreError;
    function unlink(path) {
        return util_1.promisify(fs.unlink)(path);
    }
    exports.unlink = unlink;
    function symlink(target, path, type) {
        return util_1.promisify(fs.symlink)(target, path, type);
    }
    exports.symlink = symlink;
    function truncate(path, len) {
        return util_1.promisify(fs.truncate)(path, len);
    }
    exports.truncate = truncate;
    function readFile(path, encoding) {
        return util_1.promisify(fs.readFile)(path, encoding);
    }
    exports.readFile = readFile;
    async function mkdirp(path, mode) {
        return util_1.promisify(fs.mkdir)(path, { mode, recursive: true });
    }
    exports.mkdirp = mkdirp;
    // According to node.js docs (https://nodejs.org/docs/v6.5.0/api/fs.html#fs_fs_writefile_file_data_options_callback)
    // it is not safe to call writeFile() on the same path multiple times without waiting for the callback to return.
    // Therefor we use a Queue on the path that is given to us to sequentialize calls to the same path properly.
    const writeFilePathQueues = new Map();
    function writeFile(path, data, options) {
        const queueKey = toQueueKey(path);
        return ensureWriteFileQueue(queueKey).queue(() => {
            const ensuredOptions = ensureWriteOptions(options);
            return new Promise((resolve, reject) => doWriteFileAndFlush(path, data, ensuredOptions, error => error ? reject(error) : resolve()));
        });
    }
    exports.writeFile = writeFile;
    function toQueueKey(path) {
        let queueKey = path;
        if (platform.isWindows || platform.isMacintosh) {
            queueKey = queueKey.toLowerCase(); // accommodate for case insensitive file systems
        }
        return queueKey;
    }
    function ensureWriteFileQueue(queueKey) {
        const existingWriteFileQueue = writeFilePathQueues.get(queueKey);
        if (existingWriteFileQueue) {
            return existingWriteFileQueue;
        }
        const writeFileQueue = new async_1.Queue();
        writeFilePathQueues.set(queueKey, writeFileQueue);
        const onFinish = event_1.Event.once(writeFileQueue.onFinished);
        onFinish(() => {
            writeFilePathQueues.delete(queueKey);
            writeFileQueue.dispose();
        });
        return writeFileQueue;
    }
    let canFlush = true;
    // Calls fs.writeFile() followed by a fs.sync() call to flush the changes to disk
    // We do this in cases where we want to make sure the data is really on disk and
    // not in some cache.
    //
    // See https://github.com/nodejs/node/blob/v5.10.0/lib/fs.js#L1194
    function doWriteFileAndFlush(path, data, options, callback) {
        if (!canFlush) {
            return fs.writeFile(path, data, { mode: options.mode, flag: options.flag }, callback);
        }
        // Open the file with same flags and mode as fs.writeFile()
        fs.open(path, options.flag, options.mode, (openError, fd) => {
            if (openError) {
                return callback(openError);
            }
            // It is valid to pass a fd handle to fs.writeFile() and this will keep the handle open!
            fs.writeFile(fd, data, writeError => {
                if (writeError) {
                    return fs.close(fd, () => callback(writeError)); // still need to close the handle on error!
                }
                // Flush contents (not metadata) of the file to disk
                fs.fdatasync(fd, (syncError) => {
                    // In some exotic setups it is well possible that node fails to sync
                    // In that case we disable flushing and warn to the console
                    if (syncError) {
                        console.warn('[node.js fs] fdatasync is now disabled for this session because it failed: ', syncError);
                        canFlush = false;
                    }
                    return fs.close(fd, closeError => callback(closeError));
                });
            });
        });
    }
    function writeFileSync(path, data, options) {
        const ensuredOptions = ensureWriteOptions(options);
        if (!canFlush) {
            return fs.writeFileSync(path, data, { mode: ensuredOptions.mode, flag: ensuredOptions.flag });
        }
        // Open the file with same flags and mode as fs.writeFile()
        const fd = fs.openSync(path, ensuredOptions.flag, ensuredOptions.mode);
        try {
            // It is valid to pass a fd handle to fs.writeFile() and this will keep the handle open!
            fs.writeFileSync(fd, data);
            // Flush contents (not metadata) of the file to disk
            try {
                fs.fdatasyncSync(fd);
            }
            catch (syncError) {
                console.warn('[node.js fs] fdatasyncSync is now disabled for this session because it failed: ', syncError);
                canFlush = false;
            }
        }
        finally {
            fs.closeSync(fd);
        }
    }
    exports.writeFileSync = writeFileSync;
    function ensureWriteOptions(options) {
        if (!options) {
            return { mode: 0o666, flag: 'w' };
        }
        return {
            mode: typeof options.mode === 'number' ? options.mode : 0o666,
            flag: typeof options.flag === 'string' ? options.flag : 'w'
        };
    }
    async function readDirsInDir(dirPath) {
        const children = await readdir(dirPath);
        const directories = [];
        for (const child of children) {
            if (await dirExists(path_1.join(dirPath, child))) {
                directories.push(child);
            }
        }
        return directories;
    }
    exports.readDirsInDir = readDirsInDir;
    async function dirExists(path) {
        try {
            const fileStat = await stat(path);
            return fileStat.isDirectory();
        }
        catch (error) {
            return false;
        }
    }
    exports.dirExists = dirExists;
    async function fileExists(path) {
        try {
            const fileStat = await stat(path);
            return fileStat.isFile();
        }
        catch (error) {
            return false;
        }
    }
    exports.fileExists = fileExists;
    function whenDeleted(path) {
        // Complete when wait marker file is deleted
        return new Promise(resolve => {
            let running = false;
            const interval = setInterval(() => {
                if (!running) {
                    running = true;
                    fs.exists(path, exists => {
                        running = false;
                        if (!exists) {
                            clearInterval(interval);
                            resolve(undefined);
                        }
                    });
                }
            }, 1000);
        });
    }
    exports.whenDeleted = whenDeleted;
    async function move(source, target) {
        if (source === target) {
            return Promise.resolve();
        }
        async function updateMtime(path) {
            const stat = await lstat(path);
            if (stat.isDirectory() || stat.isSymbolicLink()) {
                return Promise.resolve(); // only for files
            }
            const fd = await util_1.promisify(fs.open)(path, 'a');
            try {
                await util_1.promisify(fs.futimes)(fd, stat.atime, new Date());
            }
            catch (error) {
                //ignore
            }
            return util_1.promisify(fs.close)(fd);
        }
        try {
            await rename(source, target);
            await updateMtime(target);
        }
        catch (error) {
            // In two cases we fallback to classic copy and delete:
            //
            // 1.) The EXDEV error indicates that source and target are on different devices
            // In this case, fallback to using a copy() operation as there is no way to
            // rename() between different devices.
            //
            // 2.) The user tries to rename a file/folder that ends with a dot. This is not
            // really possible to move then, at least on UNC devices.
            if (source.toLowerCase() !== target.toLowerCase() && error.code === 'EXDEV' || source.endsWith('.')) {
                await copy(source, target);
                await rimraf(source, RimRafMode.MOVE);
                await updateMtime(target);
            }
            else {
                throw error;
            }
        }
    }
    exports.move = move;
    async function copy(source, target, copiedSourcesIn) {
        const copiedSources = copiedSourcesIn ? copiedSourcesIn : Object.create(null);
        const fileStat = await stat(source);
        if (!fileStat.isDirectory()) {
            return doCopyFile(source, target, fileStat.mode & 511);
        }
        if (copiedSources[source]) {
            return Promise.resolve(); // escape when there are cycles (can happen with symlinks)
        }
        copiedSources[source] = true; // remember as copied
        // Create folder
        await mkdirp(target, fileStat.mode & 511);
        // Copy each file recursively
        const files = await readdir(source);
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            await copy(path_1.join(source, file), path_1.join(target, file), copiedSources);
        }
    }
    exports.copy = copy;
    async function doCopyFile(source, target, mode) {
        return new Promise((resolve, reject) => {
            const reader = fs.createReadStream(source);
            const writer = fs.createWriteStream(target, { mode });
            let finished = false;
            const finish = (error) => {
                if (!finished) {
                    finished = true;
                    // in error cases, pass to callback
                    if (error) {
                        return reject(error);
                    }
                    // we need to explicitly chmod because of https://github.com/nodejs/node/issues/1104
                    fs.chmod(target, mode, error => error ? reject(error) : resolve());
                }
            };
            // handle errors properly
            reader.once('error', error => finish(error));
            writer.once('error', error => finish(error));
            // we are done (underlying fd has been closed)
            writer.once('close', () => finish());
            // start piping
            reader.pipe(writer);
        });
    }
});
//# sourceMappingURL=pfs.js.map