/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings"], function (require, exports, strings) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    if (typeof TextDecoder !== 'undefined') {
        exports.createStringBuilder = (capacity) => new StringBuilder(capacity);
    }
    else {
        exports.createStringBuilder = (capacity) => new CompatStringBuilder();
    }
    class StringBuilder {
        constructor(capacity) {
            this._decoder = new TextDecoder('UTF-16LE');
            this._capacity = capacity | 0;
            this._buffer = new Uint16Array(this._capacity);
            this._completedStrings = null;
            this._bufferLength = 0;
        }
        reset() {
            this._completedStrings = null;
            this._bufferLength = 0;
        }
        build() {
            if (this._completedStrings !== null) {
                this._flushBuffer();
                return this._completedStrings.join('');
            }
            return this._buildBuffer();
        }
        _buildBuffer() {
            if (this._bufferLength === 0) {
                return '';
            }
            const view = new Uint16Array(this._buffer.buffer, 0, this._bufferLength);
            return this._decoder.decode(view);
        }
        _flushBuffer() {
            const bufferString = this._buildBuffer();
            this._bufferLength = 0;
            if (this._completedStrings === null) {
                this._completedStrings = [bufferString];
            }
            else {
                this._completedStrings[this._completedStrings.length] = bufferString;
            }
        }
        write1(charCode) {
            const remainingSpace = this._capacity - this._bufferLength;
            if (remainingSpace <= 1) {
                if (remainingSpace === 0 || strings.isHighSurrogate(charCode)) {
                    this._flushBuffer();
                }
            }
            this._buffer[this._bufferLength++] = charCode;
        }
        appendASCII(charCode) {
            if (this._bufferLength === this._capacity) {
                // buffer is full
                this._flushBuffer();
            }
            this._buffer[this._bufferLength++] = charCode;
        }
        appendASCIIString(str) {
            const strLen = str.length;
            if (this._bufferLength + strLen >= this._capacity) {
                // This string does not fit in the remaining buffer space
                this._flushBuffer();
                this._completedStrings[this._completedStrings.length] = str;
                return;
            }
            for (let i = 0; i < strLen; i++) {
                this._buffer[this._bufferLength++] = str.charCodeAt(i);
            }
        }
    }
    class CompatStringBuilder {
        constructor() {
            this._pieces = [];
            this._piecesLen = 0;
        }
        reset() {
            this._pieces = [];
            this._piecesLen = 0;
        }
        build() {
            return this._pieces.join('');
        }
        write1(charCode) {
            this._pieces[this._piecesLen++] = String.fromCharCode(charCode);
        }
        appendASCII(charCode) {
            this._pieces[this._piecesLen++] = String.fromCharCode(charCode);
        }
        appendASCIIString(str) {
            this._pieces[this._piecesLen++] = str;
        }
    }
});
//# sourceMappingURL=stringBuilder.js.map