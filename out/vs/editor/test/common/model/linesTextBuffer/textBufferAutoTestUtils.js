/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/range"], function (require, exports, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    exports.getRandomInt = getRandomInt;
    function getRandomEOLSequence() {
        let rnd = getRandomInt(1, 3);
        if (rnd === 1) {
            return '\n';
        }
        if (rnd === 2) {
            return '\r';
        }
        return '\r\n';
    }
    exports.getRandomEOLSequence = getRandomEOLSequence;
    function getRandomString(minLength, maxLength) {
        let length = getRandomInt(minLength, maxLength);
        let r = '';
        for (let i = 0; i < length; i++) {
            r += String.fromCharCode(getRandomInt(97 /* a */, 122 /* z */));
        }
        return r;
    }
    exports.getRandomString = getRandomString;
    function generateRandomEdits(chunks, editCnt) {
        let lines = [];
        for (const chunk of chunks) {
            let newLines = chunk.split(/\r\n|\r|\n/);
            if (lines.length === 0) {
                lines.push(...newLines);
            }
            else {
                newLines[0] = lines[lines.length - 1] + newLines[0];
                lines.splice(lines.length - 1, 1, ...newLines);
            }
        }
        let ops = [];
        for (let i = 0; i < editCnt; i++) {
            let line = getRandomInt(1, lines.length);
            let startColumn = getRandomInt(1, Math.max(lines[line - 1].length, 1));
            let endColumn = getRandomInt(startColumn, Math.max(lines[line - 1].length, startColumn));
            let text = '';
            if (Math.random() < 0.5) {
                text = getRandomString(5, 10);
            }
            ops.push({
                text: text,
                range: new range_1.Range(line, startColumn, line, endColumn)
            });
            lines[line - 1] = lines[line - 1].substring(0, startColumn - 1) + text + lines[line - 1].substring(endColumn - 1);
        }
        return ops;
    }
    exports.generateRandomEdits = generateRandomEdits;
    function generateSequentialInserts(chunks, editCnt) {
        let lines = [];
        for (const chunk of chunks) {
            let newLines = chunk.split(/\r\n|\r|\n/);
            if (lines.length === 0) {
                lines.push(...newLines);
            }
            else {
                newLines[0] = lines[lines.length - 1] + newLines[0];
                lines.splice(lines.length - 1, 1, ...newLines);
            }
        }
        let ops = [];
        for (let i = 0; i < editCnt; i++) {
            let line = lines.length;
            let column = lines[line - 1].length + 1;
            let text = '';
            if (Math.random() < 0.5) {
                text = '\n';
                lines.push('');
            }
            else {
                text = getRandomString(1, 2);
                lines[line - 1] += text;
            }
            ops.push({
                text: text,
                range: new range_1.Range(line, column, line, column)
            });
        }
        return ops;
    }
    exports.generateSequentialInserts = generateSequentialInserts;
    function generateRandomReplaces(chunks, editCnt, searchStringLen, replaceStringLen) {
        let lines = [];
        for (const chunk of chunks) {
            let newLines = chunk.split(/\r\n|\r|\n/);
            if (lines.length === 0) {
                lines.push(...newLines);
            }
            else {
                newLines[0] = lines[lines.length - 1] + newLines[0];
                lines.splice(lines.length - 1, 1, ...newLines);
            }
        }
        let ops = [];
        let chunkSize = Math.max(1, Math.floor(lines.length / editCnt));
        let chunkCnt = Math.floor(lines.length / chunkSize);
        let replaceString = getRandomString(replaceStringLen, replaceStringLen);
        let previousChunksLength = 0;
        for (let i = 0; i < chunkCnt; i++) {
            let startLine = previousChunksLength + 1;
            let endLine = previousChunksLength + chunkSize;
            let line = getRandomInt(startLine, endLine);
            let maxColumn = lines[line - 1].length + 1;
            let startColumn = getRandomInt(1, maxColumn);
            let endColumn = Math.min(maxColumn, startColumn + searchStringLen);
            ops.push({
                text: replaceString,
                range: new range_1.Range(line, startColumn, line, endColumn)
            });
            previousChunksLength = endLine;
        }
        return ops;
    }
    exports.generateRandomReplaces = generateRandomReplaces;
    function createMockText(lineCount, minColumn, maxColumn) {
        let fixedEOL = getRandomEOLSequence();
        let lines = [];
        for (let i = 0; i < lineCount; i++) {
            if (i !== 0) {
                lines.push(fixedEOL);
            }
            lines.push(getRandomString(minColumn, maxColumn));
        }
        return lines.join('');
    }
    exports.createMockText = createMockText;
    function createMockBuffer(str, bufferBuilder) {
        bufferBuilder.acceptChunk(str);
        let bufferFactory = bufferBuilder.finish();
        let buffer = bufferFactory.create(1 /* LF */);
        return buffer;
    }
    exports.createMockBuffer = createMockBuffer;
    function generateRandomChunkWithLF(minLength, maxLength) {
        let length = getRandomInt(minLength, maxLength);
        let r = '';
        for (let i = 0; i < length; i++) {
            let randomI = getRandomInt(0, 122 /* z */ - 97 /* a */ + 1);
            if (randomI === 0 && Math.random() < 0.3) {
                r += '\n';
            }
            else {
                r += String.fromCharCode(randomI + 97 /* a */ - 1);
            }
        }
        return r;
    }
    exports.generateRandomChunkWithLF = generateRandomChunkWithLF;
});
//# sourceMappingURL=textBufferAutoTestUtils.js.map