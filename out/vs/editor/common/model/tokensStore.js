/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/editor/common/core/lineTokens", "vs/editor/common/core/position", "vs/editor/common/modes", "vs/base/common/buffer"], function (require, exports, arrays, lineTokens_1, position_1, modes_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function countEOL(text) {
        let eolCount = 0;
        let firstLineLength = 0;
        for (let i = 0, len = text.length; i < len; i++) {
            const chr = text.charCodeAt(i);
            if (chr === 13 /* CarriageReturn */) {
                if (eolCount === 0) {
                    firstLineLength = i;
                }
                eolCount++;
                if (i + 1 < len && text.charCodeAt(i + 1) === 10 /* LineFeed */) {
                    // \r\n... case
                    i++; // skip \n
                }
                else {
                    // \r... case
                }
            }
            else if (chr === 10 /* LineFeed */) {
                if (eolCount === 0) {
                    firstLineLength = i;
                }
                eolCount++;
            }
        }
        if (eolCount === 0) {
            firstLineLength = text.length;
        }
        return [eolCount, firstLineLength];
    }
    exports.countEOL = countEOL;
    function getDefaultMetadata(topLevelLanguageId) {
        return ((topLevelLanguageId << 0 /* LANGUAGEID_OFFSET */)
            | (0 /* Other */ << 8 /* TOKEN_TYPE_OFFSET */)
            | (0 /* None */ << 11 /* FONT_STYLE_OFFSET */)
            | (1 /* DefaultForeground */ << 14 /* FOREGROUND_OFFSET */)
            | (2 /* DefaultBackground */ << 23 /* BACKGROUND_OFFSET */)) >>> 0;
    }
    const EMPTY_LINE_TOKENS = (new Uint32Array(0)).buffer;
    class MultilineTokensBuilder {
        constructor() {
            this.tokens = [];
        }
        add(lineNumber, lineTokens) {
            if (this.tokens.length > 0) {
                const last = this.tokens[this.tokens.length - 1];
                const lastLineNumber = last.startLineNumber + last.tokens.length - 1;
                if (lastLineNumber + 1 === lineNumber) {
                    // append
                    last.tokens.push(lineTokens);
                    return;
                }
            }
            this.tokens.push(new MultilineTokens(lineNumber, [lineTokens]));
        }
        static deserialize(buff) {
            let offset = 0;
            const count = buffer_1.readUInt32BE(buff, offset);
            offset += 4;
            let result = [];
            for (let i = 0; i < count; i++) {
                offset = MultilineTokens.deserialize(buff, offset, result);
            }
            return result;
        }
        serialize() {
            const size = this._serializeSize();
            const result = new Uint8Array(size);
            this._serialize(result);
            return result;
        }
        _serializeSize() {
            let result = 0;
            result += 4; // 4 bytes for the count
            for (let i = 0; i < this.tokens.length; i++) {
                result += this.tokens[i].serializeSize();
            }
            return result;
        }
        _serialize(destination) {
            let offset = 0;
            buffer_1.writeUInt32BE(destination, this.tokens.length, offset);
            offset += 4;
            for (let i = 0; i < this.tokens.length; i++) {
                offset = this.tokens[i].serialize(destination, offset);
            }
        }
    }
    exports.MultilineTokensBuilder = MultilineTokensBuilder;
    class MultilineTokens {
        constructor(startLineNumber, tokens) {
            this.startLineNumber = startLineNumber;
            this.tokens = tokens;
        }
        static deserialize(buff, offset, result) {
            const view32 = new Uint32Array(buff.buffer);
            const startLineNumber = buffer_1.readUInt32BE(buff, offset);
            offset += 4;
            const count = buffer_1.readUInt32BE(buff, offset);
            offset += 4;
            let tokens = [];
            for (let i = 0; i < count; i++) {
                const byteCount = buffer_1.readUInt32BE(buff, offset);
                offset += 4;
                tokens.push(view32.subarray(offset / 4, offset / 4 + byteCount / 4));
                offset += byteCount;
            }
            result.push(new MultilineTokens(startLineNumber, tokens));
            return offset;
        }
        serializeSize() {
            let result = 0;
            result += 4; // 4 bytes for the start line number
            result += 4; // 4 bytes for the line count
            for (let i = 0; i < this.tokens.length; i++) {
                const lineTokens = this.tokens[i];
                if (!(lineTokens instanceof Uint32Array)) {
                    throw new Error(`Not supported!`);
                }
                result += 4; // 4 bytes for the byte count
                result += lineTokens.byteLength;
            }
            return result;
        }
        serialize(destination, offset) {
            buffer_1.writeUInt32BE(destination, this.startLineNumber, offset);
            offset += 4;
            buffer_1.writeUInt32BE(destination, this.tokens.length, offset);
            offset += 4;
            for (let i = 0; i < this.tokens.length; i++) {
                const lineTokens = this.tokens[i];
                if (!(lineTokens instanceof Uint32Array)) {
                    throw new Error(`Not supported!`);
                }
                buffer_1.writeUInt32BE(destination, lineTokens.byteLength, offset);
                offset += 4;
                destination.set(new Uint8Array(lineTokens.buffer), offset);
                offset += lineTokens.byteLength;
            }
            return offset;
        }
        applyEdit(range, text) {
            const [eolCount, firstLineLength] = countEOL(text);
            this._acceptDeleteRange(range);
            this._acceptInsertText(new position_1.Position(range.startLineNumber, range.startColumn), eolCount, firstLineLength);
        }
        _acceptDeleteRange(range) {
            if (range.startLineNumber === range.endLineNumber && range.startColumn === range.endColumn) {
                // Nothing to delete
                return;
            }
            const firstLineIndex = range.startLineNumber - this.startLineNumber;
            const lastLineIndex = range.endLineNumber - this.startLineNumber;
            if (lastLineIndex < 0) {
                // this deletion occurs entirely before this block, so we only need to adjust line numbers
                const deletedLinesCount = lastLineIndex - firstLineIndex;
                this.startLineNumber -= deletedLinesCount;
                return;
            }
            if (firstLineIndex >= this.tokens.length) {
                // this deletion occurs entirely after this block, so there is nothing to do
                return;
            }
            if (firstLineIndex < 0 && lastLineIndex >= this.tokens.length) {
                // this deletion completely encompasses this block
                this.startLineNumber = 0;
                this.tokens = [];
            }
            if (firstLineIndex === lastLineIndex) {
                // a delete on a single line
                this.tokens[firstLineIndex] = TokensStore._delete(this.tokens[firstLineIndex], range.startColumn - 1, range.endColumn - 1);
                return;
            }
            if (firstLineIndex >= 0) {
                // The first line survives
                this.tokens[firstLineIndex] = TokensStore._deleteEnding(this.tokens[firstLineIndex], range.startColumn - 1);
                if (lastLineIndex < this.tokens.length) {
                    // The last line survives
                    const lastLineTokens = TokensStore._deleteBeginning(this.tokens[lastLineIndex], range.endColumn - 1);
                    // Take remaining text on last line and append it to remaining text on first line
                    this.tokens[firstLineIndex] = TokensStore._append(this.tokens[firstLineIndex], lastLineTokens);
                    // Delete middle lines
                    this.tokens.splice(firstLineIndex + 1, lastLineIndex - firstLineIndex);
                }
                else {
                    // The last line does not survive
                    // Take remaining text on last line and append it to remaining text on first line
                    this.tokens[firstLineIndex] = TokensStore._append(this.tokens[firstLineIndex], null);
                    // Delete lines
                    this.tokens = this.tokens.slice(0, firstLineIndex + 1);
                }
            }
            else {
                // The first line does not survive
                const deletedBefore = -firstLineIndex;
                this.startLineNumber -= deletedBefore;
                // Remove beginning from last line
                this.tokens[lastLineIndex] = TokensStore._deleteBeginning(this.tokens[lastLineIndex], range.endColumn - 1);
                // Delete lines
                this.tokens = this.tokens.slice(lastLineIndex);
            }
        }
        _acceptInsertText(position, eolCount, firstLineLength) {
            if (eolCount === 0 && firstLineLength === 0) {
                // Nothing to insert
                return;
            }
            const lineIndex = position.lineNumber - this.startLineNumber;
            if (lineIndex < 0) {
                // this insertion occurs before this block, so we only need to adjust line numbers
                this.startLineNumber += eolCount;
                return;
            }
            if (lineIndex >= this.tokens.length) {
                // this insertion occurs after this block, so there is nothing to do
                return;
            }
            if (eolCount === 0) {
                // Inserting text on one line
                this.tokens[lineIndex] = TokensStore._insert(this.tokens[lineIndex], position.column - 1, firstLineLength);
                return;
            }
            this.tokens[lineIndex] = TokensStore._deleteEnding(this.tokens[lineIndex], position.column - 1);
            this.tokens[lineIndex] = TokensStore._insert(this.tokens[lineIndex], position.column - 1, firstLineLength);
            this._insertLines(position.lineNumber, eolCount);
        }
        _insertLines(insertIndex, insertCount) {
            if (insertCount === 0) {
                return;
            }
            let lineTokens = [];
            for (let i = 0; i < insertCount; i++) {
                lineTokens[i] = null;
            }
            this.tokens = arrays.arrayInsert(this.tokens, insertIndex, lineTokens);
        }
    }
    exports.MultilineTokens = MultilineTokens;
    function toUint32Array(arr) {
        if (arr instanceof Uint32Array) {
            return arr;
        }
        else {
            return new Uint32Array(arr);
        }
    }
    class TokensStore {
        constructor() {
            this._lineTokens = [];
            this._len = 0;
        }
        flush() {
            this._lineTokens = [];
            this._len = 0;
        }
        getTokens(topLevelLanguageId, lineIndex, lineText) {
            let rawLineTokens = null;
            if (lineIndex < this._len) {
                rawLineTokens = this._lineTokens[lineIndex];
            }
            if (rawLineTokens !== null && rawLineTokens !== EMPTY_LINE_TOKENS) {
                return new lineTokens_1.LineTokens(toUint32Array(rawLineTokens), lineText);
            }
            let lineTokens = new Uint32Array(2);
            lineTokens[0] = lineText.length;
            lineTokens[1] = getDefaultMetadata(topLevelLanguageId);
            return new lineTokens_1.LineTokens(lineTokens, lineText);
        }
        static _massageTokens(topLevelLanguageId, lineTextLength, _tokens) {
            const tokens = _tokens ? toUint32Array(_tokens) : null;
            if (lineTextLength === 0) {
                let hasDifferentLanguageId = false;
                if (tokens && tokens.length > 1) {
                    hasDifferentLanguageId = (modes_1.TokenMetadata.getLanguageId(tokens[1]) !== topLevelLanguageId);
                }
                if (!hasDifferentLanguageId) {
                    return EMPTY_LINE_TOKENS;
                }
            }
            if (!tokens || tokens.length === 0) {
                const tokens = new Uint32Array(2);
                tokens[0] = lineTextLength;
                tokens[1] = getDefaultMetadata(topLevelLanguageId);
                return tokens.buffer;
            }
            // Ensure the last token covers the end of the text
            tokens[tokens.length - 2] = lineTextLength;
            if (tokens.byteOffset === 0 && tokens.byteLength === tokens.buffer.byteLength) {
                // Store directly the ArrayBuffer pointer to save an object
                return tokens.buffer;
            }
            return tokens;
        }
        _ensureLine(lineIndex) {
            while (lineIndex >= this._len) {
                this._lineTokens[this._len] = null;
                this._len++;
            }
        }
        _deleteLines(start, deleteCount) {
            if (deleteCount === 0) {
                return;
            }
            if (start + deleteCount > this._len) {
                deleteCount = this._len - start;
            }
            this._lineTokens.splice(start, deleteCount);
            this._len -= deleteCount;
        }
        _insertLines(insertIndex, insertCount) {
            if (insertCount === 0) {
                return;
            }
            let lineTokens = [];
            for (let i = 0; i < insertCount; i++) {
                lineTokens[i] = null;
            }
            this._lineTokens = arrays.arrayInsert(this._lineTokens, insertIndex, lineTokens);
            this._len += insertCount;
        }
        setTokens(topLevelLanguageId, lineIndex, lineTextLength, _tokens) {
            const tokens = TokensStore._massageTokens(topLevelLanguageId, lineTextLength, _tokens);
            this._ensureLine(lineIndex);
            this._lineTokens[lineIndex] = tokens;
        }
        //#region Editing
        acceptEdit(range, eolCount, firstLineLength) {
            this._acceptDeleteRange(range);
            this._acceptInsertText(new position_1.Position(range.startLineNumber, range.startColumn), eolCount, firstLineLength);
        }
        _acceptDeleteRange(range) {
            const firstLineIndex = range.startLineNumber - 1;
            if (firstLineIndex >= this._len) {
                return;
            }
            if (range.startLineNumber === range.endLineNumber) {
                if (range.startColumn === range.endColumn) {
                    // Nothing to delete
                    return;
                }
                this._lineTokens[firstLineIndex] = TokensStore._delete(this._lineTokens[firstLineIndex], range.startColumn - 1, range.endColumn - 1);
                return;
            }
            this._lineTokens[firstLineIndex] = TokensStore._deleteEnding(this._lineTokens[firstLineIndex], range.startColumn - 1);
            const lastLineIndex = range.endLineNumber - 1;
            let lastLineTokens = null;
            if (lastLineIndex < this._len) {
                lastLineTokens = TokensStore._deleteBeginning(this._lineTokens[lastLineIndex], range.endColumn - 1);
            }
            // Take remaining text on last line and append it to remaining text on first line
            this._lineTokens[firstLineIndex] = TokensStore._append(this._lineTokens[firstLineIndex], lastLineTokens);
            // Delete middle lines
            this._deleteLines(range.startLineNumber, range.endLineNumber - range.startLineNumber);
        }
        _acceptInsertText(position, eolCount, firstLineLength) {
            if (eolCount === 0 && firstLineLength === 0) {
                // Nothing to insert
                return;
            }
            const lineIndex = position.lineNumber - 1;
            if (lineIndex >= this._len) {
                return;
            }
            if (eolCount === 0) {
                // Inserting text on one line
                this._lineTokens[lineIndex] = TokensStore._insert(this._lineTokens[lineIndex], position.column - 1, firstLineLength);
                return;
            }
            this._lineTokens[lineIndex] = TokensStore._deleteEnding(this._lineTokens[lineIndex], position.column - 1);
            this._lineTokens[lineIndex] = TokensStore._insert(this._lineTokens[lineIndex], position.column - 1, firstLineLength);
            this._insertLines(position.lineNumber, eolCount);
        }
        static _deleteBeginning(lineTokens, toChIndex) {
            if (lineTokens === null || lineTokens === EMPTY_LINE_TOKENS) {
                return lineTokens;
            }
            return TokensStore._delete(lineTokens, 0, toChIndex);
        }
        static _deleteEnding(lineTokens, fromChIndex) {
            if (lineTokens === null || lineTokens === EMPTY_LINE_TOKENS) {
                return lineTokens;
            }
            const tokens = toUint32Array(lineTokens);
            const lineTextLength = tokens[tokens.length - 2];
            return TokensStore._delete(lineTokens, fromChIndex, lineTextLength);
        }
        static _delete(lineTokens, fromChIndex, toChIndex) {
            if (lineTokens === null || lineTokens === EMPTY_LINE_TOKENS || fromChIndex === toChIndex) {
                return lineTokens;
            }
            const tokens = toUint32Array(lineTokens);
            const tokensCount = (tokens.length >>> 1);
            // special case: deleting everything
            if (fromChIndex === 0 && tokens[tokens.length - 2] === toChIndex) {
                return EMPTY_LINE_TOKENS;
            }
            const fromTokenIndex = lineTokens_1.LineTokens.findIndexInTokensArray(tokens, fromChIndex);
            const fromTokenStartOffset = (fromTokenIndex > 0 ? tokens[(fromTokenIndex - 1) << 1] : 0);
            const fromTokenEndOffset = tokens[fromTokenIndex << 1];
            if (toChIndex < fromTokenEndOffset) {
                // the delete range is inside a single token
                const delta = (toChIndex - fromChIndex);
                for (let i = fromTokenIndex; i < tokensCount; i++) {
                    tokens[i << 1] -= delta;
                }
                return lineTokens;
            }
            let dest;
            let lastEnd;
            if (fromTokenStartOffset !== fromChIndex) {
                tokens[fromTokenIndex << 1] = fromChIndex;
                dest = ((fromTokenIndex + 1) << 1);
                lastEnd = fromChIndex;
            }
            else {
                dest = (fromTokenIndex << 1);
                lastEnd = fromTokenStartOffset;
            }
            const delta = (toChIndex - fromChIndex);
            for (let tokenIndex = fromTokenIndex + 1; tokenIndex < tokensCount; tokenIndex++) {
                const tokenEndOffset = tokens[tokenIndex << 1] - delta;
                if (tokenEndOffset > lastEnd) {
                    tokens[dest++] = tokenEndOffset;
                    tokens[dest++] = tokens[(tokenIndex << 1) + 1];
                    lastEnd = tokenEndOffset;
                }
            }
            if (dest === tokens.length) {
                // nothing to trim
                return lineTokens;
            }
            let tmp = new Uint32Array(dest);
            tmp.set(tokens.subarray(0, dest), 0);
            return tmp.buffer;
        }
        static _append(lineTokens, _otherTokens) {
            if (_otherTokens === EMPTY_LINE_TOKENS) {
                return lineTokens;
            }
            if (lineTokens === EMPTY_LINE_TOKENS) {
                return _otherTokens;
            }
            if (lineTokens === null) {
                return lineTokens;
            }
            if (_otherTokens === null) {
                // cannot determine combined line length...
                return null;
            }
            const myTokens = toUint32Array(lineTokens);
            const otherTokens = toUint32Array(_otherTokens);
            const otherTokensCount = (otherTokens.length >>> 1);
            let result = new Uint32Array(myTokens.length + otherTokens.length);
            result.set(myTokens, 0);
            let dest = myTokens.length;
            const delta = myTokens[myTokens.length - 2];
            for (let i = 0; i < otherTokensCount; i++) {
                result[dest++] = otherTokens[(i << 1)] + delta;
                result[dest++] = otherTokens[(i << 1) + 1];
            }
            return result.buffer;
        }
        static _insert(lineTokens, chIndex, textLength) {
            if (lineTokens === null || lineTokens === EMPTY_LINE_TOKENS) {
                // nothing to do
                return lineTokens;
            }
            const tokens = toUint32Array(lineTokens);
            const tokensCount = (tokens.length >>> 1);
            let fromTokenIndex = lineTokens_1.LineTokens.findIndexInTokensArray(tokens, chIndex);
            if (fromTokenIndex > 0) {
                const fromTokenStartOffset = tokens[(fromTokenIndex - 1) << 1];
                if (fromTokenStartOffset === chIndex) {
                    fromTokenIndex--;
                }
            }
            for (let tokenIndex = fromTokenIndex; tokenIndex < tokensCount; tokenIndex++) {
                tokens[tokenIndex << 1] += textLength;
            }
            return lineTokens;
        }
    }
    exports.TokensStore = TokensStore;
});
//# sourceMappingURL=tokensStore.js.map