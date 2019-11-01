/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/range"], function (require, exports, strings, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RichEditBracket {
        constructor(languageIdentifier, open, close, forwardRegex, reversedRegex) {
            this.languageIdentifier = languageIdentifier;
            this.open = open;
            this.close = close;
            this.forwardRegex = forwardRegex;
            this.reversedRegex = reversedRegex;
        }
    }
    exports.RichEditBracket = RichEditBracket;
    class RichEditBrackets {
        constructor(languageIdentifier, brackets) {
            this.brackets = brackets.map((b) => {
                return new RichEditBracket(languageIdentifier, b[0], b[1], getRegexForBracketPair({ open: b[0], close: b[1] }), getReversedRegexForBracketPair({ open: b[0], close: b[1] }));
            });
            this.forwardRegex = getRegexForBrackets(this.brackets);
            this.reversedRegex = getReversedRegexForBrackets(this.brackets);
            this.textIsBracket = {};
            this.textIsOpenBracket = {};
            let maxBracketLength = 0;
            this.brackets.forEach((b) => {
                this.textIsBracket[b.open.toLowerCase()] = b;
                this.textIsBracket[b.close.toLowerCase()] = b;
                this.textIsOpenBracket[b.open.toLowerCase()] = true;
                this.textIsOpenBracket[b.close.toLowerCase()] = false;
                maxBracketLength = Math.max(maxBracketLength, b.open.length);
                maxBracketLength = Math.max(maxBracketLength, b.close.length);
            });
            this.maxBracketLength = maxBracketLength;
        }
    }
    exports.RichEditBrackets = RichEditBrackets;
    function once(keyFn, computeFn) {
        let cache = {};
        return (input) => {
            let key = keyFn(input);
            if (!cache.hasOwnProperty(key)) {
                cache[key] = computeFn(input);
            }
            return cache[key];
        };
    }
    const getRegexForBracketPair = once((input) => `${input.open};${input.close}`, (input) => {
        return createBracketOrRegExp([input.open, input.close]);
    });
    const getReversedRegexForBracketPair = once((input) => `${input.open};${input.close}`, (input) => {
        return createBracketOrRegExp([toReversedString(input.open), toReversedString(input.close)]);
    });
    const getRegexForBrackets = once((input) => input.map(b => `${b.open};${b.close}`).join(';'), (input) => {
        let pieces = [];
        input.forEach((b) => {
            pieces.push(b.open);
            pieces.push(b.close);
        });
        return createBracketOrRegExp(pieces);
    });
    const getReversedRegexForBrackets = once((input) => input.map(b => `${b.open};${b.close}`).join(';'), (input) => {
        let pieces = [];
        input.forEach((b) => {
            pieces.push(toReversedString(b.open));
            pieces.push(toReversedString(b.close));
        });
        return createBracketOrRegExp(pieces);
    });
    function prepareBracketForRegExp(str) {
        // This bracket pair uses letters like e.g. "begin" - "end"
        const insertWordBoundaries = (/^[\w]+$/.test(str));
        str = strings.escapeRegExpCharacters(str);
        return (insertWordBoundaries ? `\\b${str}\\b` : str);
    }
    function createBracketOrRegExp(pieces) {
        let regexStr = `(${pieces.map(prepareBracketForRegExp).join(')|(')})`;
        return strings.createRegExp(regexStr, true);
    }
    let toReversedString = (function () {
        function reverse(str) {
            let reversedStr = '';
            for (let i = str.length - 1; i >= 0; i--) {
                reversedStr += str.charAt(i);
            }
            return reversedStr;
        }
        let lastInput = null;
        let lastOutput = null;
        return function toReversedString(str) {
            if (lastInput !== str) {
                lastInput = str;
                lastOutput = reverse(lastInput);
            }
            return lastOutput;
        };
    })();
    class BracketsUtils {
        static _findPrevBracketInText(reversedBracketRegex, lineNumber, reversedText, offset) {
            let m = reversedText.match(reversedBracketRegex);
            if (!m) {
                return null;
            }
            let matchOffset = reversedText.length - (m.index || 0);
            let matchLength = m[0].length;
            let absoluteMatchOffset = offset + matchOffset;
            return new range_1.Range(lineNumber, absoluteMatchOffset - matchLength + 1, lineNumber, absoluteMatchOffset + 1);
        }
        static findPrevBracketInToken(reversedBracketRegex, lineNumber, lineText, currentTokenStart, currentTokenEnd) {
            // Because JS does not support backwards regex search, we search forwards in a reversed string with a reversed regex ;)
            let reversedLineText = toReversedString(lineText);
            let reversedTokenText = reversedLineText.substring(lineText.length - currentTokenEnd, lineText.length - currentTokenStart);
            return this._findPrevBracketInText(reversedBracketRegex, lineNumber, reversedTokenText, currentTokenStart);
        }
        static findNextBracketInText(bracketRegex, lineNumber, text, offset) {
            let m = text.match(bracketRegex);
            if (!m) {
                return null;
            }
            let matchOffset = m.index || 0;
            let matchLength = m[0].length;
            if (matchLength === 0) {
                return null;
            }
            let absoluteMatchOffset = offset + matchOffset;
            return new range_1.Range(lineNumber, absoluteMatchOffset + 1, lineNumber, absoluteMatchOffset + 1 + matchLength);
        }
        static findNextBracketInToken(bracketRegex, lineNumber, lineText, currentTokenStart, currentTokenEnd) {
            let currentTokenText = lineText.substring(currentTokenStart, currentTokenEnd);
            return this.findNextBracketInText(bracketRegex, lineNumber, currentTokenText, currentTokenStart);
        }
    }
    exports.BracketsUtils = BracketsUtils;
});
//# sourceMappingURL=richEditBrackets.js.map