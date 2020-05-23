/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.positionIsInRange = exports.getXtermLineContent = exports.convertBufferRangeToViewport = exports.convertLinkRangeToBuffer = void 0;
    function convertLinkRangeToBuffer(lines, bufferWidth, range, startLine) {
        const bufferRange = {
            start: {
                x: range.startColumn,
                y: range.startLineNumber + startLine
            },
            end: {
                x: range.endColumn - 1,
                y: range.endLineNumber + startLine
            }
        };
        // Shift start range right for each wide character before the link
        let startOffset = 0;
        const startWrappedLineCount = Math.ceil(range.startColumn / bufferWidth);
        for (let y = 0; y < startWrappedLineCount; y++) {
            const lineLength = Math.min(bufferWidth, range.startColumn - y * bufferWidth);
            let lineOffset = 0;
            const line = lines[y];
            for (let x = 0; x < Math.min(bufferWidth, lineLength + lineOffset); x++) {
                const cell = line.getCell(x);
                const width = cell.getWidth();
                if (width === 2) {
                    lineOffset++;
                }
                const char = cell.getChars();
                if (char.length > 1) {
                    lineOffset -= char.length - 1;
                }
            }
            startOffset += lineOffset;
        }
        // Shift end range right for each wide character inside the link
        let endOffset = 0;
        const endWrappedLineCount = Math.ceil(range.endColumn / bufferWidth);
        for (let y = Math.max(0, startWrappedLineCount - 1); y < endWrappedLineCount; y++) {
            const start = (y === startWrappedLineCount - 1 ? (range.startColumn + startOffset) % bufferWidth : 0);
            const lineLength = Math.min(bufferWidth, range.endColumn + startOffset - y * bufferWidth);
            const startLineOffset = (y === startWrappedLineCount - 1 ? startOffset : 0);
            let lineOffset = 0;
            const line = lines[y];
            for (let x = start; x < Math.min(bufferWidth, lineLength + lineOffset + startLineOffset); x++) {
                const cell = line.getCell(x);
                const width = cell.getWidth();
                // Offset for 0 cells following wide characters
                if (width === 2) {
                    lineOffset++;
                }
                // Offset for early wrapping when the last cell in row is a wide character
                if (x === bufferWidth - 1 && cell.getChars() === '') {
                    lineOffset++;
                }
            }
            endOffset += lineOffset;
        }
        // Apply the width character offsets to the result
        bufferRange.start.x += startOffset;
        bufferRange.end.x += startOffset + endOffset;
        // Convert back to wrapped lines
        while (bufferRange.start.x > bufferWidth) {
            bufferRange.start.x -= bufferWidth;
            bufferRange.start.y++;
        }
        while (bufferRange.end.x > bufferWidth) {
            bufferRange.end.x -= bufferWidth;
            bufferRange.end.y++;
        }
        return bufferRange;
    }
    exports.convertLinkRangeToBuffer = convertLinkRangeToBuffer;
    function convertBufferRangeToViewport(bufferRange, viewportY) {
        return {
            start: {
                x: bufferRange.start.x - 1,
                y: bufferRange.start.y - viewportY - 1
            },
            end: {
                x: bufferRange.end.x - 1,
                y: bufferRange.end.y - viewportY - 1
            }
        };
    }
    exports.convertBufferRangeToViewport = convertBufferRangeToViewport;
    function getXtermLineContent(buffer, lineStart, lineEnd) {
        var _a;
        let line = '';
        for (let i = lineStart; i <= lineEnd; i++) {
            line += (_a = buffer.getLine(i)) === null || _a === void 0 ? void 0 : _a.translateToString(true);
        }
        return line;
    }
    exports.getXtermLineContent = getXtermLineContent;
    function positionIsInRange(position, range) {
        if (position.y < range.start.y || position.y > range.end.y) {
            return false;
        }
        if (position.y === range.start.y && position.x < range.start.x) {
            return false;
        }
        if (position.y === range.end.y && position.x > range.end.x) {
            return false;
        }
        return true;
    }
    exports.positionIsInRange = positionIsInRange;
});
//# sourceMappingURL=terminalLinkHelpers.js.map