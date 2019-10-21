/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/async", "fs", "os", "vs/base/common/platform", "vs/base/common/event", "vs/base/common/strings", "util", "vs/base/common/extpath", "vs/base/common/uuid", "vs/base/common/normalization", "vs/base/node/encoding"], function (require, exports, path_1, async_1, fs, os, platform, event_1, strings_1, util_1, extpath_1, uuid_1, normalization_1, encoding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
        let linkStat;
        let linkStatError;
        try {
            linkStat = await lstat(path);
        }
        catch (error) {
            linkStatError = error;
        }
        // Then stat the target and return that
        const isLink = !!(linkStat && linkStat.isSymbolicLink());
        if (linkStatError || isLink) {
            const fileStat = await stat(path);
            return { stat: fileStat, isSymbolicLink: isLink };
        }
        return { stat: linkStat, isSymbolicLink: false };
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
        return new Promise(resolve => {
            fs.rename(oldPath, newPath, () => resolve());
        });
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
    // According to node.js docs (https://nodejs.org/docs/v6.5.0/api/fs.html#fs_fs_writefile_file_data_options_callback)
    // it is not safe to call writeFile() on the same path multiple times without waiting for the callback to return.
    // Therefor we use a Queue on the path that is given to us to sequentialize calls to the same path properly.
    const writeFilePathQueues = new Map();
    function writeFile(path, data, options) {
        const queueKey = toQueueKey(path);
        return ensureWriteFileQueue(queueKey).queue(() => writeFileAndFlush(path, data, options));
    }
    exports.writeFile = writeFile;
    function toQueueKey(path) {
        let queueKey = path;
        if (platform.isWindows || platform.isMacintosh) {
            queueKey = queueKey.toLowerCase(); // accomodate for case insensitive file systems
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
    function writeFileAndFlush(path, data, options) {
        const ensuredOptions = ensureWriteOptions(options);
        return new Promise((resolve, reject) => {
            if (typeof data === 'string' || Buffer.isBuffer(data) || data instanceof Uint8Array) {
                doWriteFileAndFlush(path, data, ensuredOptions, error => error ? reject(error) : resolve());
            }
            else {
                doWriteFileStreamAndFlush(path, data, ensuredOptions, error => error ? reject(error) : resolve());
            }
        });
    }
    function doWriteFileStreamAndFlush(path, reader, options, callback) {
        // finish only once
        let finished = false;
        const finish = (error) => {
            if (!finished) {
                finished = true;
                // in error cases we need to manually close streams
                // if the write stream was successfully opened
                if (error) {
                    if (isOpen) {
                        writer.once('close', () => callback(error));
                        writer.destroy();
                    }
                    else {
                        callback(error);
                    }
                }
                // otherwise just return without error
                else {
                    callback();
                }
            }
        };
        // create writer to target. we set autoClose: false because we want to use the streams
        // file descriptor to call fs.fdatasync to ensure the data is flushed to disk
        const writer = fs.createWriteStream(path, { mode: options.mode, flags: options.flag, autoClose: false });
        // Event: 'open'
        // Purpose: save the fd for later use and start piping
        // Notes: will not be called when there is an error opening the file descriptor!
        let fd;
        let isOpen;
        writer.once('open', descriptor => {
            fd = descriptor;
            isOpen = true;
            // if an encoding is provided, we need to pipe the stream through
            // an encoder stream and forward the encoding related options
            if (options.encoding) {
                reader = reader.pipe(encoding_1.encodeStream(options.encoding.charset, { addBOM: options.encoding.addBOM }));
            }
            // start data piping only when we got a successful open. this ensures that we do
            // not consume the stream when an error happens and helps to fix this issue:
            // https://github.com/Microsoft/vscode/issues/42542
            reader.pipe(writer);
        });
        // Event: 'error'
        // Purpose: to return the error to the outside and to close the write stream (does not happen automatically)
        reader.once('error', error => finish(error));
        writer.once('error', error => finish(error));
        // Event: 'finish'
        // Purpose: use fs.fdatasync to flush the contents to disk
        // Notes: event is called when the writer has finished writing to the underlying resource. we must call writer.close()
        // because we have created the WriteStream with autoClose: false
        writer.once('finish', () => {
            // flush to disk
            if (canFlush && isOpen) {
                fs.fdatasync(fd, (syncError) => {
                    // In some exotic setups it is well possible that node fails to sync
                    // In that case we disable flushing and warn to the console
                    if (syncError) {
                        console.warn('[node.js fs] fdatasync is now disabled for this session because it failed: ', syncError);
                        canFlush = false;
                    }
                    writer.destroy();
                });
            }
            else {
                writer.destroy();
            }
        });
        // Event: 'close'
        // Purpose: signal we are done to the outside
        // Notes: event is called when the writer's filedescriptor is closed
        writer.once('close', () => finish());
    }
    // Calls fs.writeFile() followed by a fs.sync() call to flush the changes to disk
    // We do this in cases where we want to make sure the data is really on disk and
    // not in some cache.
    //
    // See https://github.com/nodejs/node/blob/v5.10.0/lib/fs.js#L1194
    function doWriteFileAndFlush(path, data, options, callback) {
        if (options.encoding) {
            data = encoding_1.encode(data instanceof Uint8Array ? Buffer.from(data) : data, options.encoding.charset, { addBOM: options.encoding.addBOM });
        }
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
        if (ensuredOptions.encoding) {
            data = encoding_1.encode(data, ensuredOptions.encoding.charset, { addBOM: ensuredOptions.encoding.addBOM });
        }
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
            flag: typeof options.flag === 'string' ? options.flag : 'w',
            encoding: options.encoding
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
            if (source.toLowerCase() !== target.toLowerCase() && error.code === 'EXDEV' || strings_1.endsWith(source, '.')) {
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
    async function mkdirp(path, mode, token) {
        const mkdir = async () => {
            try {
                await util_1.promisify(fs.mkdir)(path, mode);
            }
            catch (error) {
                // ENOENT: a parent folder does not exist yet
                if (error.code === 'ENOENT') {
                    return Promise.reject(error);
                }
                // Any other error: check if folder exists and
                // return normally in that case if its a folder
                try {
                    const fileStat = await stat(path);
                    if (!fileStat.isDirectory()) {
                        return Promise.reject(new Error(`'${path}' exists and is not a directory.`));
                    }
                }
                catch (statError) {
                    throw error; // rethrow original error
                }
            }
        };
        // stop at root
        if (path === path_1.dirname(path)) {
            return Promise.resolve();
        }
        try {
            await mkdir();
        }
        catch (error) {
            // Respect cancellation
            if (token && token.isCancellationRequested) {
                return Promise.resolve();
            }
            // ENOENT: a parent folder does not exist yet, continue
            // to create the parent folder and then try again.
            if (error.code === 'ENOENT') {
                await mkdirp(path_1.dirname(path), mode);
                return mkdir();
            }
            // Any other error
            return Promise.reject(error);
        }
    }
    exports.mkdirp = mkdirp;
    // See https://github.com/Microsoft/vscode/issues/30180
    const WIN32_MAX_FILE_SIZE = 300 * 1024 * 1024; // 300 MB
    const GENERAL_MAX_FILE_SIZE = 16 * 1024 * 1024 * 1024; // 16 GB
    // See https://github.com/v8/v8/blob/5918a23a3d571b9625e5cce246bdd5b46ff7cd8b/src/heap/heap.cc#L149
    const WIN32_MAX_HEAP_SIZE = 700 * 1024 * 1024; // 700 MB
    const GENERAL_MAX_HEAP_SIZE = 700 * 2 * 1024 * 1024; // 1400 MB
    exports.MAX_FILE_SIZE = process.arch === 'ia32' ? WIN32_MAX_FILE_SIZE : GENERAL_MAX_FILE_SIZE;
    exports.MAX_HEAP_SIZE = process.arch === 'ia32' ? WIN32_MAX_HEAP_SIZE : GENERAL_MAX_HEAP_SIZE;
});
//# sourceMappingURL=pfs.js.map