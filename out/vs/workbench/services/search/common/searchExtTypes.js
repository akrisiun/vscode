/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Position {
        constructor(line, character) {
            this.line = line;
            this.character = character;
        }
        isBefore(other) { return false; }
        isBeforeOrEqual(other) { return false; }
        isAfter(other) { return false; }
        isAfterOrEqual(other) { return false; }
        isEqual(other) { return false; }
        compareTo(other) { return 0; }
        translate(_, _2) { return new Position(0, 0); }
        with(_) { return new Position(0, 0); }
    }
    exports.Position = Position;
    class Range {
        constructor(startLine, startCol, endLine, endCol) {
            this.isEmpty = false;
            this.isSingleLine = false;
            this.start = new Position(startLine, startCol);
            this.end = new Position(endLine, endCol);
        }
        contains(positionOrRange) { return false; }
        isEqual(other) { return false; }
        intersection(range) { return undefined; }
        union(other) { return new Range(0, 0, 0, 0); }
        with(_) { return new Range(0, 0, 0, 0); }
    }
    exports.Range = Range;
});
//# sourceMappingURL=searchExtTypes.js.map