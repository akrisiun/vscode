/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "iconv-lite", "stream"], function (require, exports, iconv, stream_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.detectEncodingFromBuffer = exports.toCanonicalName = exports.detectEncodingByBOMFromBuffer = exports.toNodeEncoding = exports.encodeStream = exports.encodingExists = exports.toDecodeStream = exports.UTF8_BOM = exports.UTF16le_BOM = exports.UTF16be_BOM = exports.isUTFEncoding = exports.UTF16le = exports.UTF16be = exports.UTF8_with_bom = exports.UTF8 = void 0;
    exports.UTF8 = 'utf8';
    exports.UTF8_with_bom = 'utf8bom';
    exports.UTF16be = 'utf16be';
    exports.UTF16le = 'utf16le';
    function isUTFEncoding(encoding) {
        return [exports.UTF8, exports.UTF8_with_bom, exports.UTF16be, exports.UTF16le].some(utfEncoding => utfEncoding === encoding);
    }
    exports.isUTFEncoding = isUTFEncoding;
    exports.UTF16be_BOM = [0xFE, 0xFF];
    exports.UTF16le_BOM = [0xFF, 0xFE];
    exports.UTF8_BOM = [0xEF, 0xBB, 0xBF];
    const ZERO_BYTE_DETECTION_BUFFER_MAX_LEN = 512; // number of bytes to look at to decide about a file being binary or not
    const NO_ENCODING_GUESS_MIN_BYTES = 512; // when not auto guessing the encoding, small number of bytes are enough
    const AUTO_ENCODING_GUESS_MIN_BYTES = 512 * 8; // with auto guessing we want a lot more content to be read for guessing
    const AUTO_ENCODING_GUESS_MAX_BYTES = 512 * 128; // set an upper limit for the number of bytes we pass on to jschardet
    function toDecodeStream(readable, options) {
        if (!options.minBytesRequiredForDetection) {
            options.minBytesRequiredForDetection = options.guessEncoding ? AUTO_ENCODING_GUESS_MIN_BYTES : NO_ENCODING_GUESS_MIN_BYTES;
        }
        return new Promise((resolve, reject) => {
            const writer = new class extends stream_1.Writable {
                constructor() {
                    super(...arguments);
                    this.bufferedChunks = [];
                    this.bytesBuffered = 0;
                }
                _write(chunk, encoding, callback) {
                    if (!Buffer.isBuffer(chunk)) {
                        return callback(new Error('toDecodeStream(): data must be a buffer'));
                    }
                    // if the decode stream is ready, we just write directly
                    if (this.decodeStream) {
                        this.decodeStream.write(chunk, callback);
                        return;
                    }
                    // otherwise we need to buffer the data until the stream is ready
                    this.bufferedChunks.push(chunk);
                    this.bytesBuffered += chunk.byteLength;
                    // waiting for the decoder to be ready
                    if (this.decodeStreamPromise) {
                        this.decodeStreamPromise.then(() => callback(null), error => callback(error));
                    }
                    // buffered enough data for encoding detection, create stream and forward data
                    else if (typeof options.minBytesRequiredForDetection === 'number' && this.bytesBuffered >= options.minBytesRequiredForDetection) {
                        this._startDecodeStream(callback);
                    }
                    // only buffering until enough data for encoding detection is there
                    else {
                        callback(null);
                    }
                }
                _startDecodeStream(callback) {
                    // detect encoding from buffer
                    this.decodeStreamPromise = Promise.resolve(detectEncodingFromBuffer({
                        buffer: Buffer.concat(this.bufferedChunks),
                        bytesRead: this.bytesBuffered
                    }, options.guessEncoding)).then(detected => {
                        // ensure to respect overwrite of encoding
                        detected.encoding = options.overwriteEncoding(detected.encoding);
                        // decode and write buffer
                        this.decodeStream = decodeStream(detected.encoding);
                        this.decodeStream.write(Buffer.concat(this.bufferedChunks), callback);
                        this.bufferedChunks.length = 0;
                        // signal to the outside our detected encoding
                        // and final decoder stream
                        resolve({ detected, stream: this.decodeStream });
                    }, error => {
                        this.emit('error', error);
                        callback(error);
                    });
                }
                _final(callback) {
                    // normal finish
                    if (this.decodeStream) {
                        this.decodeStream.end(callback);
                    }
                    // we were still waiting for data to do the encoding
                    // detection. thus, wrap up starting the stream even
                    // without all the data to get things going
                    else {
                        this._startDecodeStream(() => {
                            if (this.decodeStream) {
                                this.decodeStream.end(callback);
                            }
                        });
                    }
                }
            };
            // errors
            readable.on('error', reject);
            // pipe through
            readable.pipe(writer);
        });
    }
    exports.toDecodeStream = toDecodeStream;
    function encodingExists(encoding) {
        return iconv.encodingExists(toNodeEncoding(encoding));
    }
    exports.encodingExists = encodingExists;
    function decodeStream(encoding) {
        return iconv.decodeStream(toNodeEncoding(encoding));
    }
    function encodeStream(encoding, options) {
        return iconv.encodeStream(toNodeEncoding(encoding), options);
    }
    exports.encodeStream = encodeStream;
    function toNodeEncoding(enc) {
        if (enc === exports.UTF8_with_bom || enc === null) {
            return exports.UTF8; // iconv does not distinguish UTF 8 with or without BOM, so we need to help it
        }
        return enc;
    }
    exports.toNodeEncoding = toNodeEncoding;
    function detectEncodingByBOMFromBuffer(buffer, bytesRead) {
        if (!buffer || bytesRead < exports.UTF16be_BOM.length) {
            return null;
        }
        const b0 = buffer.readUInt8(0);
        const b1 = buffer.readUInt8(1);
        // UTF-16 BE
        if (b0 === exports.UTF16be_BOM[0] && b1 === exports.UTF16be_BOM[1]) {
            return exports.UTF16be;
        }
        // UTF-16 LE
        if (b0 === exports.UTF16le_BOM[0] && b1 === exports.UTF16le_BOM[1]) {
            return exports.UTF16le;
        }
        if (bytesRead < exports.UTF8_BOM.length) {
            return null;
        }
        const b2 = buffer.readUInt8(2);
        // UTF-8
        if (b0 === exports.UTF8_BOM[0] && b1 === exports.UTF8_BOM[1] && b2 === exports.UTF8_BOM[2]) {
            return exports.UTF8_with_bom;
        }
        return null;
    }
    exports.detectEncodingByBOMFromBuffer = detectEncodingByBOMFromBuffer;
    // we explicitly ignore a specific set of encodings from auto guessing
    // - ASCII: we never want this encoding (most UTF-8 files would happily detect as
    //          ASCII files and then you could not type non-ASCII characters anymore)
    // - UTF-16: we have our own detection logic for UTF-16
    // - UTF-32: we do not support this encoding in VSCode
    const IGNORE_ENCODINGS = ['ascii', 'utf-16', 'utf-32'];
    /**
     * Guesses the encoding from buffer.
     */
    async function guessEncodingByBuffer(buffer) {
        const jschardet = await new Promise((resolve_1, reject_1) => { require(['jschardet'], resolve_1, reject_1); });
        const guessed = jschardet.detect(buffer.slice(0, AUTO_ENCODING_GUESS_MAX_BYTES)); // ensure to limit buffer for guessing due to https://github.com/aadsm/jschardet/issues/53
        if (!guessed || !guessed.encoding) {
            return null;
        }
        const enc = guessed.encoding.toLowerCase();
        if (0 <= IGNORE_ENCODINGS.indexOf(enc)) {
            return null; // see comment above why we ignore some encodings
        }
        return toIconvLiteEncoding(guessed.encoding);
    }
    const JSCHARDET_TO_ICONV_ENCODINGS = {
        'ibm866': 'cp866',
        'big5': 'cp950'
    };
    function toIconvLiteEncoding(encodingName) {
        const normalizedEncodingName = encodingName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const mapped = JSCHARDET_TO_ICONV_ENCODINGS[normalizedEncodingName];
        return mapped || normalizedEncodingName;
    }
    /**
     * The encodings that are allowed in a settings file don't match the canonical encoding labels specified by WHATWG.
     * See https://encoding.spec.whatwg.org/#names-and-labels
     * Iconv-lite strips all non-alphanumeric characters, but ripgrep doesn't. For backcompat, allow these labels.
     */
    function toCanonicalName(enc) {
        switch (enc) {
            case 'shiftjis':
                return 'shift-jis';
            case 'utf16le':
                return 'utf-16le';
            case 'utf16be':
                return 'utf-16be';
            case 'big5hkscs':
                return 'big5-hkscs';
            case 'eucjp':
                return 'euc-jp';
            case 'euckr':
                return 'euc-kr';
            case 'koi8r':
                return 'koi8-r';
            case 'koi8u':
                return 'koi8-u';
            case 'macroman':
                return 'x-mac-roman';
            case 'utf8bom':
                return 'utf8';
            default:
                const m = enc.match(/windows(\d+)/);
                if (m) {
                    return 'windows-' + m[1];
                }
                return enc;
        }
    }
    exports.toCanonicalName = toCanonicalName;
    function detectEncodingFromBuffer({ buffer, bytesRead }, autoGuessEncoding) {
        // Always first check for BOM to find out about encoding
        let encoding = detectEncodingByBOMFromBuffer(buffer, bytesRead);
        // Detect 0 bytes to see if file is binary or UTF-16 LE/BE
        // unless we already know that this file has a UTF-16 encoding
        let seemsBinary = false;
        if (encoding !== exports.UTF16be && encoding !== exports.UTF16le && buffer) {
            let couldBeUTF16LE = true; // e.g. 0xAA 0x00
            let couldBeUTF16BE = true; // e.g. 0x00 0xAA
            let containsZeroByte = false;
            // This is a simplified guess to detect UTF-16 BE or LE by just checking if
            // the first 512 bytes have the 0-byte at a specific location. For UTF-16 LE
            // this would be the odd byte index and for UTF-16 BE the even one.
            // Note: this can produce false positives (a binary file that uses a 2-byte
            // encoding of the same format as UTF-16) and false negatives (a UTF-16 file
            // that is using 4 bytes to encode a character).
            for (let i = 0; i < bytesRead && i < ZERO_BYTE_DETECTION_BUFFER_MAX_LEN; i++) {
                const isEndian = (i % 2 === 1); // assume 2-byte sequences typical for UTF-16
                const isZeroByte = (buffer.readInt8(i) === 0);
                if (isZeroByte) {
                    containsZeroByte = true;
                }
                // UTF-16 LE: expect e.g. 0xAA 0x00
                if (couldBeUTF16LE && (isEndian && !isZeroByte || !isEndian && isZeroByte)) {
                    couldBeUTF16LE = false;
                }
                // UTF-16 BE: expect e.g. 0x00 0xAA
                if (couldBeUTF16BE && (isEndian && isZeroByte || !isEndian && !isZeroByte)) {
                    couldBeUTF16BE = false;
                }
                // Return if this is neither UTF16-LE nor UTF16-BE and thus treat as binary
                if (isZeroByte && !couldBeUTF16LE && !couldBeUTF16BE) {
                    break;
                }
            }
            // Handle case of 0-byte included
            if (containsZeroByte) {
                if (couldBeUTF16LE) {
                    encoding = exports.UTF16le;
                }
                else if (couldBeUTF16BE) {
                    encoding = exports.UTF16be;
                }
                else {
                    seemsBinary = true;
                }
            }
        }
        // Auto guess encoding if configured
        if (autoGuessEncoding && !seemsBinary && !encoding && buffer) {
            return guessEncodingByBuffer(buffer.slice(0, bytesRead)).then(guessedEncoding => {
                return {
                    seemsBinary: false,
                    encoding: guessedEncoding
                };
            });
        }
        return { seemsBinary, encoding };
    }
    exports.detectEncodingFromBuffer = detectEncodingFromBuffer;
});
//# sourceMappingURL=encoding.js.map