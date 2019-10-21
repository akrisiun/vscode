/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "vs/base/common/buffer", "stream", "vs/base/common/types", "vs/base/node/encoding"], function (require, exports, fs, buffer_1, stream_1, types_1, encoding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Reads a file until a matching string is found.
     *
     * @param file The file to read.
     * @param matchingString The string to search for.
     * @param chunkBytes The number of bytes to read each iteration.
     * @param maximumBytesToRead The maximum number of bytes to read before giving up.
     * @param callback The finished callback.
     */
    function readToMatchingString(file, matchingString, chunkBytes, maximumBytesToRead) {
        return new Promise((resolve, reject) => fs.open(file, 'r', null, (err, fd) => {
            if (err) {
                return reject(err);
            }
            function end(err, result) {
                fs.close(fd, closeError => {
                    if (closeError) {
                        return reject(closeError);
                    }
                    if (err && err.code === 'EISDIR') {
                        return reject(err); // we want to bubble this error up (file is actually a folder)
                    }
                    return resolve(result);
                });
            }
            const buffer = Buffer.allocUnsafe(maximumBytesToRead);
            let offset = 0;
            function readChunk() {
                fs.read(fd, buffer, offset, chunkBytes, null, (err, bytesRead) => {
                    if (err) {
                        return end(err, null);
                    }
                    if (bytesRead === 0) {
                        return end(null, null);
                    }
                    offset += bytesRead;
                    const newLineIndex = buffer.indexOf(matchingString);
                    if (newLineIndex >= 0) {
                        return end(null, buffer.toString('utf8').substr(0, newLineIndex));
                    }
                    if (offset >= maximumBytesToRead) {
                        return end(new Error(`Could not find ${matchingString} in first ${maximumBytesToRead} bytes of ${file}`), null);
                    }
                    return readChunk();
                });
            }
            readChunk();
        }));
    }
    exports.readToMatchingString = readToMatchingString;
    function streamToNodeReadable(stream) {
        return new class extends stream_1.Readable {
            constructor() {
                super(...arguments);
                this.listening = false;
            }
            _read(size) {
                if (!this.listening) {
                    this.listening = true;
                    // Data
                    stream.on('data', data => {
                        try {
                            if (!this.push(data.buffer)) {
                                stream.pause(); // pause the stream if we should not push anymore
                            }
                        }
                        catch (error) {
                            this.emit(error);
                        }
                    });
                    // End
                    stream.on('end', () => {
                        try {
                            this.push(null); // signal EOS
                        }
                        catch (error) {
                            this.emit(error);
                        }
                    });
                    // Error
                    stream.on('error', error => this.emit('error', error));
                }
                // ensure the stream is flowing
                stream.resume();
            }
            _destroy(error, callback) {
                stream.destroy();
                callback(null);
            }
        };
    }
    exports.streamToNodeReadable = streamToNodeReadable;
    function nodeReadableToString(stream) {
        return new Promise((resolve, reject) => {
            let result = '';
            stream.on('data', chunk => result += chunk);
            stream.on('error', reject);
            stream.on('end', () => resolve(result));
        });
    }
    exports.nodeReadableToString = nodeReadableToString;
    function nodeStreamToVSBufferReadable(stream, addBOM) {
        let bytesRead = 0;
        let done = false;
        return {
            read() {
                if (done) {
                    return null;
                }
                const res = stream.read();
                if (types_1.isUndefinedOrNull(res)) {
                    done = true;
                    // If we are instructed to add a BOM but we detect that no
                    // bytes have been read, we must ensure to return the BOM
                    // ourselves so that we comply with the contract.
                    if (bytesRead === 0 && addBOM) {
                        switch (addBOM.encoding) {
                            case encoding_1.UTF8:
                            case encoding_1.UTF8_with_bom:
                                return buffer_1.VSBuffer.wrap(Buffer.from(encoding_1.UTF8_BOM));
                            case encoding_1.UTF16be:
                                return buffer_1.VSBuffer.wrap(Buffer.from(encoding_1.UTF16be_BOM));
                            case encoding_1.UTF16le:
                                return buffer_1.VSBuffer.wrap(Buffer.from(encoding_1.UTF16le_BOM));
                        }
                    }
                    return null;
                }
                // Handle String
                if (typeof res === 'string') {
                    bytesRead += res.length;
                    return buffer_1.VSBuffer.fromString(res);
                }
                // Handle Buffer
                else {
                    bytesRead += res.byteLength;
                    return buffer_1.VSBuffer.wrap(res);
                }
            }
        };
    }
    exports.nodeStreamToVSBufferReadable = nodeStreamToVSBufferReadable;
});
//# sourceMappingURL=stream.js.map