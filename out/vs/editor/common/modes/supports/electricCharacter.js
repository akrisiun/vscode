/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/modes/supports", "vs/editor/common/modes/supports/richEditBrackets"], function (require, exports, supports_1, richEditBrackets_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BracketElectricCharacterSupport {
        constructor(richEditBrackets) {
            this._richEditBrackets = richEditBrackets;
        }
        getElectricCharacters() {
            let result = [];
            if (this._richEditBrackets) {
                for (let i = 0, len = this._richEditBrackets.brackets.length; i < len; i++) {
                    let bracketPair = this._richEditBrackets.brackets[i];
                    let lastChar = bracketPair.close.charAt(bracketPair.close.length - 1);
                    result.push(lastChar);
                }
            }
            // Filter duplicate entries
            result = result.filter((item, pos, array) => {
                return array.indexOf(item) === pos;
            });
            return result;
        }
        onElectricCharacter(character, context, column) {
            if (!this._richEditBrackets || this._richEditBrackets.brackets.length === 0) {
                return null;
            }
            let tokenIndex = context.findTokenIndexAtOffset(column - 1);
            if (supports_1.ignoreBracketsInToken(context.getStandardTokenType(tokenIndex))) {
                return null;
            }
            let reversedBracketRegex = this._richEditBrackets.reversedRegex;
            let text = context.getLineContent().substring(0, column - 1) + character;
            let r = richEditBrackets_1.BracketsUtils.findPrevBracketInToken(reversedBracketRegex, 1, text, 0, text.length);
            if (!r) {
                return null;
            }
            let bracketText = text.substring(r.startColumn - 1, r.endColumn - 1);
            bracketText = bracketText.toLowerCase();
            let isOpen = this._richEditBrackets.textIsOpenBracket[bracketText];
            if (isOpen) {
                return null;
            }
            let textBeforeBracket = text.substring(0, r.startColumn - 1);
            if (!/^\s*$/.test(textBeforeBracket)) {
                // There is other text on the line before the bracket
                return null;
            }
            return {
                matchOpenBracket: bracketText
            };
        }
    }
    exports.BracketElectricCharacterSupport = BracketElectricCharacterSupport;
});
//# sourceMappingURL=electricCharacter.js.map