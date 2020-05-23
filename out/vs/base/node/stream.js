/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "stream", "vs/base/common/types", "vs/base/node/encoding"], function (require, exports, buffer_1, stream_1, types_1, encoding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.nodeStreamToVSBufferReadable = exports.nodeReadableToString = exports.streamToNodeReadable = void 0;
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