/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.USUAL_WORD_SEPARATORS = '`~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?';
    /**
     * Create a word definition regular expression based on default word separators.
     * Optionally provide allowed separators that should be included in words.
     *
     * The default would look like this:
     * /(-?\d*\.\d\w*)|([^\`\~\!\@\#\$\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g
     */
    function createWordRegExp(allowInWords = '') {
        let source = '(-?\\d*\\.\\d\\w*)|([^';
        for (const sep of exports.USUAL_WORD_SEPARATORS) {
            if (allowInWords.indexOf(sep) >= 0) {
                continue;
            }
            source += '\\' + sep;
        }
        source += '\\s]+)';
        return new RegExp(source, 'g');
    }
    // catches numbers (including floating numbers) in the first group, and alphanum in the second
    exports.DEFAULT_WORD_REGEXP = createWordRegExp();
    function ensureValidWordDefinition(wordDefinition) {
        let result = exports.DEFAULT_WORD_REGEXP;
        if (wordDefinition && (wordDefinition instanceof RegExp)) {
            if (!wordDefinition.global) {
                let flags = 'g';
                if (wordDefinition.ignoreCase) {
                    flags += 'i';
                }
                if (wordDefinition.multiline) {
                    flags += 'm';
                }
                if (wordDefinition.unicode) {
                    flags += 'u';
                }
                result = new RegExp(wordDefinition.source, flags);
            }
            else {
                result = wordDefinition;
            }
        }
        result.lastIndex = 0;
        return result;
    }
    exports.ensureValidWordDefinition = ensureValidWordDefinition;
    function getWordAtPosFast(column, wordDefinition, text, textOffset) {
        // find whitespace enclosed text around column and match from there
        let pos = column - 1 - textOffset;
        let start = text.lastIndexOf(' ', pos - 1) + 1;
        wordDefinition.lastIndex = start;
        let match;
        while (match = wordDefinition.exec(text)) {
            const matchIndex = match.index || 0;
            if (matchIndex <= pos && wordDefinition.lastIndex >= pos) {
                return {
                    word: match[0],
                    startColumn: textOffset + 1 + matchIndex,
                    endColumn: textOffset + 1 + wordDefinition.lastIndex
                };
            }
        }
        return null;
    }
    function getWordAtPosSlow(column, wordDefinition, text, textOffset) {
        // matches all words starting at the beginning
        // of the input until it finds a match that encloses
        // the desired column. slow but correct
        let pos = column - 1 - textOffset;
        wordDefinition.lastIndex = 0;
        let match;
        while (match = wordDefinition.exec(text)) {
            const matchIndex = match.index || 0;
            if (matchIndex > pos) {
                // |nW -> matched only after the pos
                return null;
            }
            else if (wordDefinition.lastIndex >= pos) {
                // W|W -> match encloses pos
                return {
                    word: match[0],
                    startColumn: textOffset + 1 + matchIndex,
                    endColumn: textOffset + 1 + wordDefinition.lastIndex
                };
            }
        }
        return null;
    }
    function getWordAtText(column, wordDefinition, text, textOffset) {
        // if `words` can contain whitespace character we have to use the slow variant
        // otherwise we use the fast variant of finding a word
        wordDefinition.lastIndex = 0;
        let match = wordDefinition.exec(text);
        if (!match) {
            return null;
        }
        // todo@joh the `match` could already be the (first) word
        const ret = match[0].indexOf(' ') >= 0
            // did match a word which contains a space character -> use slow word find
            ? getWordAtPosSlow(column, wordDefinition, text, textOffset)
            // sane word definition -> use fast word find
            : getWordAtPosFast(column, wordDefinition, text, textOffset);
        // both (getWordAtPosFast and getWordAtPosSlow) leave the wordDefinition-RegExp
        // in an undefined state and to not confuse other users of the wordDefinition
        // we reset the lastIndex
        wordDefinition.lastIndex = 0;
        return ret;
    }
    exports.getWordAtText = getWordAtText;
});
//# sourceMappingURL=wordHelper.js.map