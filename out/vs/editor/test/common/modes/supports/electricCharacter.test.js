/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/modes", "vs/editor/common/modes/supports/electricCharacter", "vs/editor/common/modes/supports/richEditBrackets", "vs/editor/test/common/modesTestUtils"], function (require, exports, assert, modes_1, electricCharacter_1, richEditBrackets_1, modesTestUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const fakeLanguageIdentifier = new modes_1.LanguageIdentifier('test', 3);
    suite('Editor Modes - Auto Indentation', () => {
        function _testOnElectricCharacter(electricCharacterSupport, line, character, offset) {
            return electricCharacterSupport.onElectricCharacter(character, modesTestUtils_1.createFakeScopedLineTokens(line), offset);
        }
        function testDoesNothing(electricCharacterSupport, line, character, offset) {
            let actual = _testOnElectricCharacter(electricCharacterSupport, line, character, offset);
            assert.deepEqual(actual, null);
        }
        function testMatchBracket(electricCharacterSupport, line, character, offset, matchOpenBracket) {
            let actual = _testOnElectricCharacter(electricCharacterSupport, line, character, offset);
            assert.deepEqual(actual, { matchOpenBracket: matchOpenBracket });
        }
        test('getElectricCharacters uses all sources and dedups', () => {
            let sup = new electricCharacter_1.BracketElectricCharacterSupport(new richEditBrackets_1.RichEditBrackets(fakeLanguageIdentifier, [
                ['{', '}'],
                ['(', ')']
            ]));
            assert.deepEqual(sup.getElectricCharacters(), ['}', ')']);
        });
        test('matchOpenBracket', () => {
            let sup = new electricCharacter_1.BracketElectricCharacterSupport(new richEditBrackets_1.RichEditBrackets(fakeLanguageIdentifier, [
                ['{', '}'],
                ['(', ')']
            ]));
            testDoesNothing(sup, [{ text: '\t{', type: 0 /* Other */ }], '\t', 1);
            testDoesNothing(sup, [{ text: '\t{', type: 0 /* Other */ }], '\t', 2);
            testDoesNothing(sup, [{ text: '\t\t', type: 0 /* Other */ }], '{', 3);
            testDoesNothing(sup, [{ text: '\t}', type: 0 /* Other */ }], '\t', 1);
            testDoesNothing(sup, [{ text: '\t}', type: 0 /* Other */ }], '\t', 2);
            testMatchBracket(sup, [{ text: '\t\t', type: 0 /* Other */ }], '}', 3, '}');
        });
    });
});
//# sourceMappingURL=electricCharacter.test.js.map