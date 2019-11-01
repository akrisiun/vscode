/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/token", "vs/editor/common/model/textModel", "vs/editor/common/modes", "vs/editor/common/modes/nullMode"], function (require, exports, assert, editOperation_1, position_1, range_1, token_1, textModel_1, modes, nullMode_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // --------- utils
    suite('Editor Model - Model Modes 1', () => {
        let calledFor = [];
        function checkAndClear(arr) {
            assert.deepEqual(calledFor, arr);
            calledFor = [];
        }
        const tokenizationSupport = {
            getInitialState: () => nullMode_1.NULL_STATE,
            tokenize: undefined,
            tokenize2: (line, state) => {
                calledFor.push(line.charAt(0));
                return new token_1.TokenizationResult2(new Uint32Array(0), state);
            }
        };
        let thisModel;
        let languageRegistration;
        setup(() => {
            const TEXT = '1\r\n' +
                '2\n' +
                '3\n' +
                '4\r\n' +
                '5';
            const LANGUAGE_ID = 'modelModeTest1';
            calledFor = [];
            languageRegistration = modes.TokenizationRegistry.register(LANGUAGE_ID, tokenizationSupport);
            thisModel = textModel_1.TextModel.createFromString(TEXT, undefined, new modes.LanguageIdentifier(LANGUAGE_ID, 0));
        });
        teardown(() => {
            thisModel.dispose();
            languageRegistration.dispose();
            calledFor = [];
        });
        test('model calls syntax highlighter 1', () => {
            thisModel.forceTokenization(1);
            checkAndClear(['1']);
        });
        test('model calls syntax highlighter 2', () => {
            thisModel.forceTokenization(2);
            checkAndClear(['1', '2']);
            thisModel.forceTokenization(2);
            checkAndClear([]);
        });
        test('model caches states', () => {
            thisModel.forceTokenization(1);
            checkAndClear(['1']);
            thisModel.forceTokenization(2);
            checkAndClear(['2']);
            thisModel.forceTokenization(3);
            checkAndClear(['3']);
            thisModel.forceTokenization(4);
            checkAndClear(['4']);
            thisModel.forceTokenization(5);
            checkAndClear(['5']);
            thisModel.forceTokenization(5);
            checkAndClear([]);
        });
        test('model invalidates states for one line insert', () => {
            thisModel.forceTokenization(5);
            checkAndClear(['1', '2', '3', '4', '5']);
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 1), '-')]);
            thisModel.forceTokenization(5);
            checkAndClear(['-']);
            thisModel.forceTokenization(5);
            checkAndClear([]);
        });
        test('model invalidates states for many lines insert', () => {
            thisModel.forceTokenization(5);
            checkAndClear(['1', '2', '3', '4', '5']);
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 1), '0\n-\n+')]);
            assert.equal(thisModel.getLineCount(), 7);
            thisModel.forceTokenization(7);
            checkAndClear(['0', '-', '+']);
            thisModel.forceTokenization(7);
            checkAndClear([]);
        });
        test('model invalidates states for one new line', () => {
            thisModel.forceTokenization(5);
            checkAndClear(['1', '2', '3', '4', '5']);
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 2), '\n')]);
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(2, 1), 'a')]);
            thisModel.forceTokenization(6);
            checkAndClear(['1', 'a']);
        });
        test('model invalidates states for one line delete', () => {
            thisModel.forceTokenization(5);
            checkAndClear(['1', '2', '3', '4', '5']);
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 2), '-')]);
            thisModel.forceTokenization(5);
            checkAndClear(['1']);
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 1, 1, 2))]);
            thisModel.forceTokenization(5);
            checkAndClear(['-']);
            thisModel.forceTokenization(5);
            checkAndClear([]);
        });
        test('model invalidates states for many lines delete', () => {
            thisModel.forceTokenization(5);
            checkAndClear(['1', '2', '3', '4', '5']);
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 1, 3, 1))]);
            thisModel.forceTokenization(3);
            checkAndClear(['3']);
            thisModel.forceTokenization(3);
            checkAndClear([]);
        });
    });
    suite('Editor Model - Model Modes 2', () => {
        class ModelState2 {
            constructor(prevLineContent) {
                this.prevLineContent = prevLineContent;
            }
            clone() {
                return new ModelState2(this.prevLineContent);
            }
            equals(other) {
                return (other instanceof ModelState2) && other.prevLineContent === this.prevLineContent;
            }
        }
        let calledFor = [];
        function checkAndClear(arr) {
            assert.deepEqual(calledFor, arr);
            calledFor = [];
        }
        const tokenizationSupport = {
            getInitialState: () => new ModelState2(''),
            tokenize: undefined,
            tokenize2: (line, state) => {
                calledFor.push(line);
                state.prevLineContent = line;
                return new token_1.TokenizationResult2(new Uint32Array(0), state);
            }
        };
        let thisModel;
        let languageRegistration;
        setup(() => {
            const TEXT = 'Line1' + '\r\n' +
                'Line2' + '\n' +
                'Line3' + '\n' +
                'Line4' + '\r\n' +
                'Line5';
            const LANGUAGE_ID = 'modelModeTest2';
            languageRegistration = modes.TokenizationRegistry.register(LANGUAGE_ID, tokenizationSupport);
            thisModel = textModel_1.TextModel.createFromString(TEXT, undefined, new modes.LanguageIdentifier(LANGUAGE_ID, 0));
        });
        teardown(() => {
            thisModel.dispose();
            languageRegistration.dispose();
        });
        test('getTokensForInvalidLines one text insert', () => {
            thisModel.forceTokenization(5);
            checkAndClear(['Line1', 'Line2', 'Line3', 'Line4', 'Line5']);
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 6), '-')]);
            thisModel.forceTokenization(5);
            checkAndClear(['Line1-', 'Line2']);
        });
        test('getTokensForInvalidLines two text insert', () => {
            thisModel.forceTokenization(5);
            checkAndClear(['Line1', 'Line2', 'Line3', 'Line4', 'Line5']);
            thisModel.applyEdits([
                editOperation_1.EditOperation.insert(new position_1.Position(1, 6), '-'),
                editOperation_1.EditOperation.insert(new position_1.Position(3, 6), '-')
            ]);
            thisModel.forceTokenization(5);
            checkAndClear(['Line1-', 'Line2', 'Line3-', 'Line4']);
        });
        test('getTokensForInvalidLines one multi-line text insert, one small text insert', () => {
            thisModel.forceTokenization(5);
            checkAndClear(['Line1', 'Line2', 'Line3', 'Line4', 'Line5']);
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 6), '\nNew line\nAnother new line')]);
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(5, 6), '-')]);
            thisModel.forceTokenization(7);
            checkAndClear(['Line1', 'New line', 'Another new line', 'Line2', 'Line3-', 'Line4']);
        });
        test('getTokensForInvalidLines one delete text', () => {
            thisModel.forceTokenization(5);
            checkAndClear(['Line1', 'Line2', 'Line3', 'Line4', 'Line5']);
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 1, 1, 5))]);
            thisModel.forceTokenization(5);
            checkAndClear(['1', 'Line2']);
        });
        test('getTokensForInvalidLines one line delete text', () => {
            thisModel.forceTokenization(5);
            checkAndClear(['Line1', 'Line2', 'Line3', 'Line4', 'Line5']);
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 1, 2, 1))]);
            thisModel.forceTokenization(4);
            checkAndClear(['Line2']);
        });
        test('getTokensForInvalidLines multiple lines delete text', () => {
            thisModel.forceTokenization(5);
            checkAndClear(['Line1', 'Line2', 'Line3', 'Line4', 'Line5']);
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 1, 3, 3))]);
            thisModel.forceTokenization(3);
            checkAndClear(['ne3', 'Line4']);
        });
    });
});
//# sourceMappingURL=model.modes.test.js.map