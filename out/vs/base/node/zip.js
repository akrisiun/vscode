/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/path", "fs", "vs/base/common/async", "vs/base/node/pfs", "yauzl", "yazl", "vs/base/common/event"], function (require, exports, nls, path, fs_1, async_1, pfs_1, yauzl_1, yazl, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExtractError extends Error {
        constructor(type, cause) {
            let message = cause.message;
            switch (type) {
                case 'CorruptZip':
                    message = `Corrupt ZIP: ${message}`;
                    break;
            }
            super(message);
            this.type = type;
            this.cause = cause;
        }
    }
    exports.ExtractError = ExtractError;
    function modeFromEntry(entry) {
        const attr = entry.externalFileAttributes >> 16 || 33188;
        return [448 /* S_IRWXU */, 56 /* S_IRWXG */, 7 /* S_IRWXO */]
            .map(mask => attr & mask)
            .reduce((a, b) => a + b, attr & 61440 /* S_IFMT */);
    }
    function toExtractError(err) {
        if (err instanceof ExtractError) {
            return err;
        }
        let type = undefined;
        if (/end of central directory record signature not found/.test(err.message)) {
            type = 'CorruptZip';
        }
        return new ExtractError(type, err);
    }
    function extractEntry(stream, fileName, mode, targetPath, options, token) {
        const dirName = path.dirname(fileName);
        const targetDirName = path.join(targetPath, dirName);
        if (targetDirName.indexOf(targetPath) !== 0) {
            return Promise.reject(new Error(nls.localize('invalid file', "Error extracting {0}. Invalid file.", fileName)));
        }
        const targetFileName = path.join(targetPath, fileName);
        let istream;
        event_1.Event.once(token.onCancellationRequested)(() => {
            if (istream) {
                istream.destroy();
            }
        });
        return Promise.resolve(pfs_1.mkdirp(targetDirName, undefined, token)).then(() => new Promise((c, e) => {
            if (token.isCancellationRequested) {
                return;
            }
            try {
                istream = fs_1.createWriteStream(targetFileName, { mode });
                istream.once('close', () => c());
                istream.once('error', e);
                stream.once('error', e);
                stream.pipe(istream);
            }
            catch (error) {
                e(error);
            }
        }));
    }
    function extractZip(zipfile, targetPath, options, token) {
        let last = async_1.createCancelablePromise(() => Promise.resolve());
        let extractedEntriesCount = 0;
        event_1.Event.once(token.onCancellationRequested)(() => {
            last.cancel();
            zipfile.close();
        });
        return new Promise((c, e) => {
            const throttler = new async_1.Sequencer();
            const readNextEntry = (token) => {
                if (token.isCancellationRequested) {
                    return;
                }
                extractedEntriesCount++;
                zipfile.readEntry();
            };
            zipfile.once('error', e);
            zipfile.once('close', () => last.then(() => {
                if (token.isCancellationRequested || zipfile.entryCount === extractedEntriesCount) {
                    c();
                }
                else {
                    e(new ExtractError('Incomplete', new Error(nls.localize('incompleteExtract', "Incomplete. Found {0} of {1} entries", extractedEntriesCount, zipfile.entryCount))));
                }
            }, e));
            zipfile.readEntry();
            zipfile.on('entry', (entry) => {
                if (token.isCancellationRequested) {
                    return;
                }
                if (!options.sourcePathRegex.test(entry.fileName)) {
                    readNextEntry(token);
                    return;
                }
                const fileName = entry.fileName.replace(options.sourcePathRegex, '');
                // directory file names end with '/'
                if (/\/$/.test(fileName)) {
                    const targetFileName = path.join(targetPath, fileName);
                    last = async_1.createCancelablePromise(token => pfs_1.mkdirp(targetFileName, undefined, token).then(() => readNextEntry(token)).then(undefined, e));
                    return;
                }
                const stream = openZipStream(zipfile, entry);
                const mode = modeFromEntry(entry);
                last = async_1.createCancelablePromise(token => throttler.queue(() => stream.then(stream => extractEntry(stream, fileName, mode, targetPath, options, token).then(() => readNextEntry(token)))).then(null, e));
            });
        });
    }
    function openZip(zipFile, lazy = false) {
        return new Promise((resolve, reject) => {
            yauzl_1.open(zipFile, lazy ? { lazyEntries: true } : undefined, (error, zipfile) => {
                if (error) {
                    reject(toExtractError(error));
                }
                else {
                    resolve(zipfile);
                }
            });
        });
    }
    function openZipStream(zipFile, entry) {
        return new Promise((resolve, reject) => {
            zipFile.openReadStream(entry, (error, stream) => {
                if (error) {
                    reject(toExtractError(error));
                }
                else {
                    resolve(stream);
                }
            });
        });
    }
    function zip(zipPath, files) {
        return new Promise((c, e) => {
            const zip = new yazl.ZipFile();
            files.forEach(f => {
                if (f.contents) {
                    zip.addBuffer(typeof f.contents === 'string' ? Buffer.from(f.contents, 'utf8') : f.contents, f.path);
                }
                else if (f.localPath) {
                    zip.addFile(f.localPath, f.path);
                }
            });
            zip.end();
            const zipStream = fs_1.createWriteStream(zipPath);
            zip.outputStream.pipe(zipStream);
            zip.outputStream.once('error', e);
            zipStream.once('error', e);
            zipStream.once('finish', () => c(zipPath));
        });
    }
    exports.zip = zip;
    function extract(zipPath, targetPath, options = {}, token) {
        const sourcePathRegex = new RegExp(options.sourcePath ? `^${options.sourcePath}` : '');
        let promise = openZip(zipPath, true);
        if (options.overwrite) {
            promise = promise.then(zipfile => pfs_1.rimraf(targetPath).then(() => zipfile));
        }
        return promise.then(zipfile => extractZip(zipfile, targetPath, { sourcePathRegex }, token));
    }
    exports.extract = extract;
    function read(zipPath, filePath) {
        return openZip(zipPath).then(zipfile => {
            return new Promise((c, e) => {
                zipfile.on('entry', (entry) => {
                    if (entry.fileName === filePath) {
                        openZipStream(zipfile, entry).then(stream => c(stream), err => e(err));
                    }
                });
                zipfile.once('close', () => e(new Error(nls.localize('notFound', "{0} not found inside zip.", filePath))));
            });
        });
    }
    function buffer(zipPath, filePath) {
        return read(zipPath, filePath).then(stream => {
            return new Promise((c, e) => {
                const buffers = [];
                stream.once('error', e);
                stream.on('data', (b) => buffers.push(b));
                stream.on('end', () => c(Buffer.concat(buffers)));
            });
        });
    }
    exports.buffer = buffer;
});
//# sourceMappingURL=zip.js.map