/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.transform = exports.toReadable = exports.toStream = exports.consumeStreamWithLimit = exports.consumeStream = exports.consumeReadableWithLimit = exports.consumeReadable = exports.newWriteableStream = exports.isReadableStream = void 0;
    function isReadableStream(obj) {
        const candidate = obj;
        return candidate && [candidate.on, candidate.pause, candidate.resume, candidate.destroy].every(fn => typeof fn === 'function');
    }
    exports.isReadableStream = isReadableStream;
    function newWriteableStream(reducer) {
        return new WriteableStreamImpl(reducer);
    }
    exports.newWriteableStream = newWriteableStream;
    class WriteableStreamImpl {
        constructor(reducer) {
            this.reducer = reducer;
            this.state = {
                flowing: false,
                ended: false,
                destroyed: false
            };
            this.buffer = {
                data: [],
                error: []
            };
            this.listeners = {
                data: [],
                error: [],
                end: []
            };
        }
        pause() {
            if (this.state.destroyed) {
                return;
            }
            this.state.flowing = false;
        }
        resume() {
            if (this.state.destroyed) {
                return;
            }
            if (!this.state.flowing) {
                this.state.flowing = true;
                // emit buffered events
                this.flowData();
                this.flowErrors();
                this.flowEnd();
            }
        }
        write(data) {
            if (this.state.destroyed) {
                return;
            }
            // flowing: directly send the data to listeners
            if (this.state.flowing) {
                this.listeners.data.forEach(listener => listener(data));
            }
            // not yet flowing: buffer data until flowing
            else {
                this.buffer.data.push(data);
            }
        }
        error(error) {
            if (this.state.destroyed) {
                return;
            }
            // flowing: directly send the error to listeners
            if (this.state.flowing) {
                this.listeners.error.forEach(listener => listener(error));
            }
            // not yet flowing: buffer errors until flowing
            else {
                this.buffer.error.push(error);
            }
        }
        end(result) {
            if (this.state.destroyed) {
                return;
            }
            // end with data or error if provided
            if (result instanceof Error) {
                this.error(result);
            }
            else if (result) {
                this.write(result);
            }
            // flowing: send end event to listeners
            if (this.state.flowing) {
                this.listeners.end.forEach(listener => listener());
                this.destroy();
            }
            // not yet flowing: remember state
            else {
                this.state.ended = true;
            }
        }
        on(event, callback) {
            if (this.state.destroyed) {
                return;
            }
            switch (event) {
                case 'data':
                    this.listeners.data.push(callback);
                    // switch into flowing mode as soon as the first 'data'
                    // listener is added and we are not yet in flowing mode
                    this.resume();
                    break;
                case 'end':
                    this.listeners.end.push(callback);
                    // emit 'end' event directly if we are flowing
                    // and the end has already been reached
                    //
                    // finish() when it went through
                    if (this.state.flowing && this.flowEnd()) {
                        this.destroy();
                    }
                    break;
                case 'error':
                    this.listeners.error.push(callback);
                    // emit buffered 'error' events unless done already
                    // now that we know that we have at least one listener
                    if (this.state.flowing) {
                        this.flowErrors();
                    }
                    break;
            }
        }
        flowData() {
            if (this.buffer.data.length > 0) {
                const fullDataBuffer = this.reducer(this.buffer.data);
                this.listeners.data.forEach(listener => listener(fullDataBuffer));
                this.buffer.data.length = 0;
            }
        }
        flowErrors() {
            if (this.listeners.error.length > 0) {
                for (const error of this.buffer.error) {
                    this.listeners.error.forEach(listener => listener(error));
                }
                this.buffer.error.length = 0;
            }
        }
        flowEnd() {
            if (this.state.ended) {
                this.listeners.end.forEach(listener => listener());
                return this.listeners.end.length > 0;
            }
            return false;
        }
        destroy() {
            if (!this.state.destroyed) {
                this.state.destroyed = true;
                this.state.ended = true;
                this.buffer.data.length = 0;
                this.buffer.error.length = 0;
                this.listeners.data.length = 0;
                this.listeners.error.length = 0;
                this.listeners.end.length = 0;
            }
        }
    }
    /**
     * Helper to fully read a T readable into a T.
     */
    function consumeReadable(readable, reducer) {
        const chunks = [];
        let chunk;
        while ((chunk = readable.read()) !== null) {
            chunks.push(chunk);
        }
        return reducer(chunks);
    }
    exports.consumeReadable = consumeReadable;
    /**
     * Helper to read a T readable up to a maximum of chunks. If the limit is
     * reached, will return a readable instead to ensure all data can still
     * be read.
     */
    function consumeReadableWithLimit(readable, reducer, maxChunks) {
        const chunks = [];
        let chunk = undefined;
        while ((chunk = readable.read()) !== null && chunks.length < maxChunks) {
            chunks.push(chunk);
        }
        // If the last chunk is null, it means we reached the end of
        // the readable and return all the data at once
        if (chunk === null && chunks.length > 0) {
            return reducer(chunks);
        }
        // Otherwise, we still have a chunk, it means we reached the maxChunks
        // value and as such we return a new Readable that first returns
        // the existing read chunks and then continues with reading from
        // the underlying readable.
        return {
            read: () => {
                // First consume chunks from our array
                if (chunks.length > 0) {
                    return chunks.shift();
                }
                // Then ensure to return our last read chunk
                if (typeof chunk !== 'undefined') {
                    const lastReadChunk = chunk;
                    // explicitly use undefined here to indicate that we consumed
                    // the chunk, which could have either been null or valued.
                    chunk = undefined;
                    return lastReadChunk;
                }
                // Finally delegate back to the Readable
                return readable.read();
            }
        };
    }
    exports.consumeReadableWithLimit = consumeReadableWithLimit;
    /**
     * Helper to fully read a T stream into a T.
     */
    function consumeStream(stream, reducer) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            stream.on('data', data => chunks.push(data));
            stream.on('error', error => reject(error));
            stream.on('end', () => resolve(reducer(chunks)));
        });
    }
    exports.consumeStream = consumeStream;
    /**
     * Helper to read a T stream up to a maximum of chunks. If the limit is
     * reached, will return a stream instead to ensure all data can still
     * be read.
     */
    function consumeStreamWithLimit(stream, reducer, maxChunks) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            let wrapperStream = undefined;
            stream.on('data', data => {
                // If we reach maxChunks, we start to return a stream
                // and make sure that any data we have already read
                // is in it as well
                if (!wrapperStream && chunks.length === maxChunks) {
                    wrapperStream = newWriteableStream(reducer);
                    while (chunks.length) {
                        wrapperStream.write(chunks.shift());
                    }
                    wrapperStream.write(data);
                    return resolve(wrapperStream);
                }
                if (wrapperStream) {
                    wrapperStream.write(data);
                }
                else {
                    chunks.push(data);
                }
            });
            stream.on('error', error => {
                if (wrapperStream) {
                    wrapperStream.error(error);
                }
                else {
                    return reject(error);
                }
            });
            stream.on('end', () => {
                if (wrapperStream) {
                    while (chunks.length) {
                        wrapperStream.write(chunks.shift());
                    }
                    wrapperStream.end();
                }
                else {
                    return resolve(reducer(chunks));
                }
            });
        });
    }
    exports.consumeStreamWithLimit = consumeStreamWithLimit;
    /**
     * Helper to create a readable stream from an existing T.
     */
    function toStream(t, reducer) {
        const stream = newWriteableStream(reducer);
        stream.end(t);
        return stream;
    }
    exports.toStream = toStream;
    /**
     * Helper to convert a T into a Readable<T>.
     */
    function toReadable(t) {
        let consumed = false;
        return {
            read: () => {
                if (consumed) {
                    return null;
                }
                consumed = true;
                return t;
            }
        };
    }
    exports.toReadable = toReadable;
    /**
     * Helper to transform a readable stream into another stream.
     */
    function transform(stream, transformer, reducer) {
        const target = newWriteableStream(reducer);
        stream.on('data', data => target.write(transformer.data(data)));
        stream.on('end', () => target.end());
        stream.on('error', error => target.error(transformer.error ? transformer.error(error) : error));
        return target;
    }
    exports.transform = transform;
});
//# sourceMappingURL=stream.js.map