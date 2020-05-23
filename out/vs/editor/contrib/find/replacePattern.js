/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/search"], function (require, exports, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseReplaceString = exports.ReplacePiece = exports.ReplacePattern = void 0;
    var ReplacePatternKind;
    (function (ReplacePatternKind) {
        ReplacePatternKind[ReplacePatternKind["StaticValue"] = 0] = "StaticValue";
        ReplacePatternKind[ReplacePatternKind["DynamicPieces"] = 1] = "DynamicPieces";
    })(ReplacePatternKind || (ReplacePatternKind = {}));
    /**
     * Assigned when the replace pattern is entirely static.
     */
    class StaticValueReplacePattern {
        constructor(staticValue) {
            this.staticValue = staticValue;
            this.kind = 0 /* StaticValue */;
        }
    }
    /**
     * Assigned when the replace pattern has replacemend patterns.
     */
    class DynamicPiecesReplacePattern {
        constructor(pieces) {
            this.pieces = pieces;
            this.kind = 1 /* DynamicPieces */;
        }
    }
    class ReplacePattern {
        constructor(pieces) {
            if (!pieces || pieces.length === 0) {
                this._state = new StaticValueReplacePattern('');
            }
            else if (pieces.length === 1 && pieces[0].staticValue !== null) {
                this._state = new StaticValueReplacePattern(pieces[0].staticValue);
            }
            else {
                this._state = new DynamicPiecesReplacePattern(pieces);
            }
        }
        static fromStaticValue(value) {
            return new ReplacePattern([ReplacePiece.staticValue(value)]);
        }
        get hasReplacementPatterns() {
            return (this._state.kind === 1 /* DynamicPieces */);
        }
        buildReplaceString(matches, preserveCase) {
            if (this._state.kind === 0 /* StaticValue */) {
                if (preserveCase) {
                    return search_1.buildReplaceStringWithCasePreserved(matches, this._state.staticValue);
                }
                else {
                    return this._state.staticValue;
                }
            }
            let result = '';
            for (let i = 0, len = this._state.pieces.length; i < len; i++) {
                let piece = this._state.pieces[i];
                if (piece.staticValue !== null) {
                    // static value ReplacePiece
                    result += piece.staticValue;
                    continue;
                }
                // match index ReplacePiece
                result += ReplacePattern._substitute(piece.matchIndex, matches);
            }
            return result;
        }
        static _substitute(matchIndex, matches) {
            if (matches === null) {
                return '';
            }
            if (matchIndex === 0) {
                return matches[0];
            }
            let remainder = '';
            while (matchIndex > 0) {
                if (matchIndex < matches.length) {
                    // A match can be undefined
                    let match = (matches[matchIndex] || '');
                    return match + remainder;
                }
                remainder = String(matchIndex % 10) + remainder;
                matchIndex = Math.floor(matchIndex / 10);
            }
            return '$' + remainder;
        }
    }
    exports.ReplacePattern = ReplacePattern;
    /**
     * A replace piece can either be a static string or an index to a specific match.
     */
    class ReplacePiece {
        constructor(staticValue, matchIndex) {
            this.staticValue = staticValue;
            this.matchIndex = matchIndex;
        }
        static staticValue(value) {
            return new ReplacePiece(value, -1);
        }
        static matchIndex(index) {
            return new ReplacePiece(null, index);
        }
    }
    exports.ReplacePiece = ReplacePiece;
    class ReplacePieceBuilder {
        constructor(source) {
            this._source = source;
            this._lastCharIndex = 0;
            this._result = [];
            this._resultLen = 0;
            this._currentStaticPiece = '';
        }
        emitUnchanged(toCharIndex) {
            this._emitStatic(this._source.substring(this._lastCharIndex, toCharIndex));
            this._lastCharIndex = toCharIndex;
        }
        emitStatic(value, toCharIndex) {
            this._emitStatic(value);
            this._lastCharIndex = toCharIndex;
        }
        _emitStatic(value) {
            if (value.length === 0) {
                return;
            }
            this._currentStaticPiece += value;
        }
        emitMatchIndex(index, toCharIndex) {
            if (this._currentStaticPiece.length !== 0) {
                this._result[this._resultLen++] = ReplacePiece.staticValue(this._currentStaticPiece);
                this._currentStaticPiece = '';
            }
            this._result[this._resultLen++] = ReplacePiece.matchIndex(index);
            this._lastCharIndex = toCharIndex;
        }
        finalize() {
            this.emitUnchanged(this._source.length);
            if (this._currentStaticPiece.length !== 0) {
                this._result[this._resultLen++] = ReplacePiece.staticValue(this._currentStaticPiece);
                this._currentStaticPiece = '';
            }
            return new ReplacePattern(this._result);
        }
    }
    /**
     * \n			=> inserts a LF
     * \t			=> inserts a TAB
     * \\			=> inserts a "\".
     * $$			=> inserts a "$".
     * $& and $0	=> inserts the matched substring.
     * $n			=> Where n is a non-negative integer lesser than 100, inserts the nth parenthesized submatch string
     * everything else stays untouched
     *
     * Also see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_string_as_a_parameter
     */
    function parseReplaceString(replaceString) {
        if (!replaceString || replaceString.length === 0) {
            return new ReplacePattern(null);
        }
        let result = new ReplacePieceBuilder(replaceString);
        for (let i = 0, len = replaceString.length; i < len; i++) {
            let chCode = replaceString.charCodeAt(i);
            if (chCode === 92 /* Backslash */) {
                // move to next char
                i++;
                if (i >= len) {
                    // string ends with a \
                    break;
                }
                let nextChCode = replaceString.charCodeAt(i);
                // let replaceWithCharacter: string | null = null;
                switch (nextChCode) {
                    case 92 /* Backslash */:
                        // \\ => inserts a "\"
                        result.emitUnchanged(i - 1);
                        result.emitStatic('\\', i + 1);
                        break;
                    case 110 /* n */:
                        // \n => inserts a LF
                        result.emitUnchanged(i - 1);
                        result.emitStatic('\n', i + 1);
                        break;
                    case 116 /* t */:
                        // \t => inserts a TAB
                        result.emitUnchanged(i - 1);
                        result.emitStatic('\t', i + 1);
                        break;
                }
                continue;
            }
            if (chCode === 36 /* DollarSign */) {
                // move to next char
                i++;
                if (i >= len) {
                    // string ends with a $
                    break;
                }
                let nextChCode = replaceString.charCodeAt(i);
                if (nextChCode === 36 /* DollarSign */) {
                    // $$ => inserts a "$"
                    result.emitUnchanged(i - 1);
                    result.emitStatic('$', i + 1);
                    continue;
                }
                if (nextChCode === 48 /* Digit0 */ || nextChCode === 38 /* Ampersand */) {
                    // $& and $0 => inserts the matched substring.
                    result.emitUnchanged(i - 1);
                    result.emitMatchIndex(0, i + 1);
                    continue;
                }
                if (49 /* Digit1 */ <= nextChCode && nextChCode <= 57 /* Digit9 */) {
                    // $n
                    let matchIndex = nextChCode - 48 /* Digit0 */;
                    // peek next char to probe for $nn
                    if (i + 1 < len) {
                        let nextNextChCode = replaceString.charCodeAt(i + 1);
                        if (48 /* Digit0 */ <= nextNextChCode && nextNextChCode <= 57 /* Digit9 */) {
                            // $nn
                            // move to next char
                            i++;
                            matchIndex = matchIndex * 10 + (nextNextChCode - 48 /* Digit0 */);
                            result.emitUnchanged(i - 2);
                            result.emitMatchIndex(matchIndex, i + 1);
                            continue;
                        }
                    }
                    result.emitUnchanged(i - 1);
                    result.emitMatchIndex(matchIndex, i + 1);
                    continue;
                }
            }
        }
        return result.finalize();
    }
    exports.parseReplaceString = parseReplaceString;
});
//# sourceMappingURL=replacePattern.js.map