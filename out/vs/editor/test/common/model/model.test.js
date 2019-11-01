/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/token", "vs/editor/common/model/textModel", "vs/editor/common/model/textModelEvents", "vs/editor/common/modes", "vs/editor/common/modes/languageConfigurationRegistry", "vs/editor/common/modes/nullMode", "vs/editor/test/common/mocks/mockMode"], function (require, exports, assert, lifecycle_1, editOperation_1, position_1, range_1, token_1, textModel_1, textModelEvents_1, modes_1, languageConfigurationRegistry_1, nullMode_1, mockMode_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // --------- utils
    const LINE1 = 'My First Line';
    const LINE2 = '\t\tMy Second Line';
    const LINE3 = '    Third Line';
    const LINE4 = '';
    const LINE5 = '1';
    suite('Editor Model - Model', () => {
        let thisModel;
        setup(() => {
            const text = LINE1 + '\r\n' +
                LINE2 + '\n' +
                LINE3 + '\n' +
                LINE4 + '\r\n' +
                LINE5;
            thisModel = textModel_1.TextModel.createFromString(text);
        });
        teardown(() => {
            thisModel.dispose();
        });
        // --------- insert text
        test('model getValue', () => {
            assert.equal(thisModel.getValue(), 'My First Line\n\t\tMy Second Line\n    Third Line\n\n1');
        });
        test('model insert empty text', () => {
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 1), '')]);
            assert.equal(thisModel.getLineCount(), 5);
            assert.equal(thisModel.getLineContent(1), 'My First Line');
        });
        test('model insert text without newline 1', () => {
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 1), 'foo ')]);
            assert.equal(thisModel.getLineCount(), 5);
            assert.equal(thisModel.getLineContent(1), 'foo My First Line');
        });
        test('model insert text without newline 2', () => {
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 3), ' foo')]);
            assert.equal(thisModel.getLineCount(), 5);
            assert.equal(thisModel.getLineContent(1), 'My foo First Line');
        });
        test('model insert text with one newline', () => {
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 3), ' new line\nNo longer')]);
            assert.equal(thisModel.getLineCount(), 6);
            assert.equal(thisModel.getLineContent(1), 'My new line');
            assert.equal(thisModel.getLineContent(2), 'No longer First Line');
        });
        test('model insert text with two newlines', () => {
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 3), ' new line\nOne more line in the middle\nNo longer')]);
            assert.equal(thisModel.getLineCount(), 7);
            assert.equal(thisModel.getLineContent(1), 'My new line');
            assert.equal(thisModel.getLineContent(2), 'One more line in the middle');
            assert.equal(thisModel.getLineContent(3), 'No longer First Line');
        });
        test('model insert text with many newlines', () => {
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 3), '\n\n\n\n')]);
            assert.equal(thisModel.getLineCount(), 9);
            assert.equal(thisModel.getLineContent(1), 'My');
            assert.equal(thisModel.getLineContent(2), '');
            assert.equal(thisModel.getLineContent(3), '');
            assert.equal(thisModel.getLineContent(4), '');
            assert.equal(thisModel.getLineContent(5), ' First Line');
        });
        // --------- insert text eventing
        test('model insert empty text does not trigger eventing', () => {
            thisModel.onDidChangeRawContent((e) => {
                assert.ok(false, 'was not expecting event');
            });
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 1), '')]);
        });
        test('model insert text without newline eventing', () => {
            let e = null;
            thisModel.onDidChangeRawContent((_e) => {
                if (e !== null) {
                    assert.fail('Unexpected assertion error');
                }
                e = _e;
            });
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 1), 'foo ')]);
            assert.deepEqual(e, new textModelEvents_1.ModelRawContentChangedEvent([
                new textModelEvents_1.ModelRawLineChanged(1, 'foo My First Line')
            ], 2, false, false));
        });
        test('model insert text with one newline eventing', () => {
            let e = null;
            thisModel.onDidChangeRawContent((_e) => {
                if (e !== null) {
                    assert.fail('Unexpected assertion error');
                }
                e = _e;
            });
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 3), ' new line\nNo longer')]);
            assert.deepEqual(e, new textModelEvents_1.ModelRawContentChangedEvent([
                new textModelEvents_1.ModelRawLineChanged(1, 'My new line'),
                new textModelEvents_1.ModelRawLinesInserted(2, 2, ['No longer First Line']),
            ], 2, false, false));
        });
        // --------- delete text
        test('model delete empty text', () => {
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 1, 1, 1))]);
            assert.equal(thisModel.getLineCount(), 5);
            assert.equal(thisModel.getLineContent(1), 'My First Line');
        });
        test('model delete text from one line', () => {
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 1, 1, 2))]);
            assert.equal(thisModel.getLineCount(), 5);
            assert.equal(thisModel.getLineContent(1), 'y First Line');
        });
        test('model delete text from one line 2', () => {
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 1), 'a')]);
            assert.equal(thisModel.getLineContent(1), 'aMy First Line');
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 2, 1, 4))]);
            assert.equal(thisModel.getLineCount(), 5);
            assert.equal(thisModel.getLineContent(1), 'a First Line');
        });
        test('model delete all text from a line', () => {
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 1, 1, 14))]);
            assert.equal(thisModel.getLineCount(), 5);
            assert.equal(thisModel.getLineContent(1), '');
        });
        test('model delete text from two lines', () => {
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 4, 2, 6))]);
            assert.equal(thisModel.getLineCount(), 4);
            assert.equal(thisModel.getLineContent(1), 'My Second Line');
        });
        test('model delete text from many lines', () => {
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 4, 3, 5))]);
            assert.equal(thisModel.getLineCount(), 3);
            assert.equal(thisModel.getLineContent(1), 'My Third Line');
        });
        test('model delete everything', () => {
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 1, 5, 2))]);
            assert.equal(thisModel.getLineCount(), 1);
            assert.equal(thisModel.getLineContent(1), '');
        });
        // --------- delete text eventing
        test('model delete empty text does not trigger eventing', () => {
            thisModel.onDidChangeRawContent((e) => {
                assert.ok(false, 'was not expecting event');
            });
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 1, 1, 1))]);
        });
        test('model delete text from one line eventing', () => {
            let e = null;
            thisModel.onDidChangeRawContent((_e) => {
                if (e !== null) {
                    assert.fail('Unexpected assertion error');
                }
                e = _e;
            });
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 1, 1, 2))]);
            assert.deepEqual(e, new textModelEvents_1.ModelRawContentChangedEvent([
                new textModelEvents_1.ModelRawLineChanged(1, 'y First Line'),
            ], 2, false, false));
        });
        test('model delete all text from a line eventing', () => {
            let e = null;
            thisModel.onDidChangeRawContent((_e) => {
                if (e !== null) {
                    assert.fail('Unexpected assertion error');
                }
                e = _e;
            });
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 1, 1, 14))]);
            assert.deepEqual(e, new textModelEvents_1.ModelRawContentChangedEvent([
                new textModelEvents_1.ModelRawLineChanged(1, ''),
            ], 2, false, false));
        });
        test('model delete text from two lines eventing', () => {
            let e = null;
            thisModel.onDidChangeRawContent((_e) => {
                if (e !== null) {
                    assert.fail('Unexpected assertion error');
                }
                e = _e;
            });
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 4, 2, 6))]);
            assert.deepEqual(e, new textModelEvents_1.ModelRawContentChangedEvent([
                new textModelEvents_1.ModelRawLineChanged(1, 'My Second Line'),
                new textModelEvents_1.ModelRawLinesDeleted(2, 2),
            ], 2, false, false));
        });
        test('model delete text from many lines eventing', () => {
            let e = null;
            thisModel.onDidChangeRawContent((_e) => {
                if (e !== null) {
                    assert.fail('Unexpected assertion error');
                }
                e = _e;
            });
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 4, 3, 5))]);
            assert.deepEqual(e, new textModelEvents_1.ModelRawContentChangedEvent([
                new textModelEvents_1.ModelRawLineChanged(1, 'My Third Line'),
                new textModelEvents_1.ModelRawLinesDeleted(2, 3),
            ], 2, false, false));
        });
        // --------- getValueInRange
        test('getValueInRange', () => {
            assert.equal(thisModel.getValueInRange(new range_1.Range(1, 1, 1, 1)), '');
            assert.equal(thisModel.getValueInRange(new range_1.Range(1, 1, 1, 2)), 'M');
            assert.equal(thisModel.getValueInRange(new range_1.Range(1, 2, 1, 3)), 'y');
            assert.equal(thisModel.getValueInRange(new range_1.Range(1, 1, 1, 14)), 'My First Line');
            assert.equal(thisModel.getValueInRange(new range_1.Range(1, 1, 2, 1)), 'My First Line\n');
            assert.equal(thisModel.getValueInRange(new range_1.Range(1, 1, 2, 2)), 'My First Line\n\t');
            assert.equal(thisModel.getValueInRange(new range_1.Range(1, 1, 2, 3)), 'My First Line\n\t\t');
            assert.equal(thisModel.getValueInRange(new range_1.Range(1, 1, 2, 17)), 'My First Line\n\t\tMy Second Line');
            assert.equal(thisModel.getValueInRange(new range_1.Range(1, 1, 3, 1)), 'My First Line\n\t\tMy Second Line\n');
            assert.equal(thisModel.getValueInRange(new range_1.Range(1, 1, 4, 1)), 'My First Line\n\t\tMy Second Line\n    Third Line\n');
        });
        // --------- getValueLengthInRange
        test('getValueLengthInRange', () => {
            assert.equal(thisModel.getValueLengthInRange(new range_1.Range(1, 1, 1, 1)), ''.length);
            assert.equal(thisModel.getValueLengthInRange(new range_1.Range(1, 1, 1, 2)), 'M'.length);
            assert.equal(thisModel.getValueLengthInRange(new range_1.Range(1, 2, 1, 3)), 'y'.length);
            assert.equal(thisModel.getValueLengthInRange(new range_1.Range(1, 1, 1, 14)), 'My First Line'.length);
            assert.equal(thisModel.getValueLengthInRange(new range_1.Range(1, 1, 2, 1)), 'My First Line\n'.length);
            assert.equal(thisModel.getValueLengthInRange(new range_1.Range(1, 1, 2, 2)), 'My First Line\n\t'.length);
            assert.equal(thisModel.getValueLengthInRange(new range_1.Range(1, 1, 2, 3)), 'My First Line\n\t\t'.length);
            assert.equal(thisModel.getValueLengthInRange(new range_1.Range(1, 1, 2, 17)), 'My First Line\n\t\tMy Second Line'.length);
            assert.equal(thisModel.getValueLengthInRange(new range_1.Range(1, 1, 3, 1)), 'My First Line\n\t\tMy Second Line\n'.length);
            assert.equal(thisModel.getValueLengthInRange(new range_1.Range(1, 1, 4, 1)), 'My First Line\n\t\tMy Second Line\n    Third Line\n'.length);
        });
        // --------- setValue
        test('setValue eventing', () => {
            let e = null;
            thisModel.onDidChangeRawContent((_e) => {
                if (e !== null) {
                    assert.fail('Unexpected assertion error');
                }
                e = _e;
            });
            thisModel.setValue('new value');
            assert.deepEqual(e, new textModelEvents_1.ModelRawContentChangedEvent([
                new textModelEvents_1.ModelRawFlush()
            ], 2, false, false));
        });
        test('issue #46342: Maintain edit operation order in applyEdits', () => {
            let res = thisModel.applyEdits([
                { range: new range_1.Range(2, 1, 2, 1), text: 'a' },
                { range: new range_1.Range(1, 1, 1, 1), text: 'b' },
            ]);
            assert.deepEqual(res[0].range, new range_1.Range(2, 1, 2, 2));
            assert.deepEqual(res[1].range, new range_1.Range(1, 1, 1, 2));
        });
    });
    // --------- Special Unicode LINE SEPARATOR character
    suite('Editor Model - Model Line Separators', () => {
        let thisModel;
        setup(() => {
            const text = LINE1 + '\u2028' +
                LINE2 + '\n' +
                LINE3 + '\u2028' +
                LINE4 + '\r\n' +
                LINE5;
            thisModel = textModel_1.TextModel.createFromString(text);
        });
        teardown(() => {
            thisModel.dispose();
        });
        test('model getValue', () => {
            assert.equal(thisModel.getValue(), 'My First Line\u2028\t\tMy Second Line\n    Third Line\u2028\n1');
        });
        test('model lines', () => {
            assert.equal(thisModel.getLineCount(), 3);
        });
        test('Bug 13333:Model should line break on lonely CR too', () => {
            let model = textModel_1.TextModel.createFromString('Hello\rWorld!\r\nAnother line');
            assert.equal(model.getLineCount(), 3);
            assert.equal(model.getValue(), 'Hello\r\nWorld!\r\nAnother line');
            model.dispose();
        });
    });
    // --------- Words
    suite('Editor Model - Words', () => {
        const OUTER_LANGUAGE_ID = new modes_1.LanguageIdentifier('outerMode', 3);
        const INNER_LANGUAGE_ID = new modes_1.LanguageIdentifier('innerMode', 4);
        class OuterMode extends mockMode_1.MockMode {
            constructor() {
                super(OUTER_LANGUAGE_ID);
                this._register(languageConfigurationRegistry_1.LanguageConfigurationRegistry.register(this.getLanguageIdentifier(), {}));
                this._register(modes_1.TokenizationRegistry.register(this.getLanguageIdentifier().language, {
                    getInitialState: () => nullMode_1.NULL_STATE,
                    tokenize: undefined,
                    tokenize2: (line, state) => {
                        const tokensArr = [];
                        let prevLanguageId = undefined;
                        for (let i = 0; i < line.length; i++) {
                            const languageId = (line.charAt(i) === 'x' ? INNER_LANGUAGE_ID : OUTER_LANGUAGE_ID);
                            if (prevLanguageId !== languageId) {
                                tokensArr.push(i);
                                tokensArr.push((languageId.id << 0 /* LANGUAGEID_OFFSET */));
                            }
                            prevLanguageId = languageId;
                        }
                        const tokens = new Uint32Array(tokensArr.length);
                        for (let i = 0; i < tokens.length; i++) {
                            tokens[i] = tokensArr[i];
                        }
                        return new token_1.TokenizationResult2(tokens, state);
                    }
                }));
            }
        }
        class InnerMode extends mockMode_1.MockMode {
            constructor() {
                super(INNER_LANGUAGE_ID);
                this._register(languageConfigurationRegistry_1.LanguageConfigurationRegistry.register(this.getLanguageIdentifier(), {}));
            }
        }
        let disposables = [];
        setup(() => {
            disposables = [];
        });
        teardown(() => {
            lifecycle_1.dispose(disposables);
            disposables = [];
        });
        test('Get word at position', () => {
            const text = ['This text has some  words. '];
            const thisModel = textModel_1.TextModel.createFromString(text.join('\n'));
            disposables.push(thisModel);
            assert.deepEqual(thisModel.getWordAtPosition(new position_1.Position(1, 1)), { word: 'This', startColumn: 1, endColumn: 5 });
            assert.deepEqual(thisModel.getWordAtPosition(new position_1.Position(1, 2)), { word: 'This', startColumn: 1, endColumn: 5 });
            assert.deepEqual(thisModel.getWordAtPosition(new position_1.Position(1, 4)), { word: 'This', startColumn: 1, endColumn: 5 });
            assert.deepEqual(thisModel.getWordAtPosition(new position_1.Position(1, 5)), { word: 'This', startColumn: 1, endColumn: 5 });
            assert.deepEqual(thisModel.getWordAtPosition(new position_1.Position(1, 6)), { word: 'text', startColumn: 6, endColumn: 10 });
            assert.deepEqual(thisModel.getWordAtPosition(new position_1.Position(1, 19)), { word: 'some', startColumn: 15, endColumn: 19 });
            assert.deepEqual(thisModel.getWordAtPosition(new position_1.Position(1, 20)), null);
            assert.deepEqual(thisModel.getWordAtPosition(new position_1.Position(1, 21)), { word: 'words', startColumn: 21, endColumn: 26 });
            assert.deepEqual(thisModel.getWordAtPosition(new position_1.Position(1, 26)), { word: 'words', startColumn: 21, endColumn: 26 });
            assert.deepEqual(thisModel.getWordAtPosition(new position_1.Position(1, 27)), null);
            assert.deepEqual(thisModel.getWordAtPosition(new position_1.Position(1, 28)), null);
        });
        test('getWordAtPosition at embedded language boundaries', () => {
            const outerMode = new OuterMode();
            const innerMode = new InnerMode();
            disposables.push(outerMode, innerMode);
            const model = textModel_1.TextModel.createFromString('ab<xx>ab<x>', undefined, outerMode.getLanguageIdentifier());
            disposables.push(model);
            assert.deepEqual(model.getWordAtPosition(new position_1.Position(1, 1)), { word: 'ab', startColumn: 1, endColumn: 3 });
            assert.deepEqual(model.getWordAtPosition(new position_1.Position(1, 2)), { word: 'ab', startColumn: 1, endColumn: 3 });
            assert.deepEqual(model.getWordAtPosition(new position_1.Position(1, 3)), { word: 'ab', startColumn: 1, endColumn: 3 });
            assert.deepEqual(model.getWordAtPosition(new position_1.Position(1, 4)), { word: 'xx', startColumn: 4, endColumn: 6 });
            assert.deepEqual(model.getWordAtPosition(new position_1.Position(1, 5)), { word: 'xx', startColumn: 4, endColumn: 6 });
            assert.deepEqual(model.getWordAtPosition(new position_1.Position(1, 6)), { word: 'xx', startColumn: 4, endColumn: 6 });
            assert.deepEqual(model.getWordAtPosition(new position_1.Position(1, 7)), { word: 'ab', startColumn: 7, endColumn: 9 });
        });
        test('issue #61296: VS code freezes when editing CSS file with emoji', () => {
            const MODE_ID = new modes_1.LanguageIdentifier('testMode', 4);
            const mode = new class extends mockMode_1.MockMode {
                constructor() {
                    super(MODE_ID);
                    this._register(languageConfigurationRegistry_1.LanguageConfigurationRegistry.register(this.getLanguageIdentifier(), {
                        wordPattern: /(#?-?\d*\.\d\w*%?)|(::?[\w-]*(?=[^,{;]*[,{]))|(([@#.!])?[\w-?]+%?|[@#!.])/g
                    }));
                }
            };
            disposables.push(mode);
            const thisModel = textModel_1.TextModel.createFromString('.🐷-a-b', undefined, MODE_ID);
            disposables.push(thisModel);
            assert.deepEqual(thisModel.getWordAtPosition(new position_1.Position(1, 1)), { word: '.', startColumn: 1, endColumn: 2 });
            assert.deepEqual(thisModel.getWordAtPosition(new position_1.Position(1, 2)), { word: '.', startColumn: 1, endColumn: 2 });
            assert.deepEqual(thisModel.getWordAtPosition(new position_1.Position(1, 3)), null);
            assert.deepEqual(thisModel.getWordAtPosition(new position_1.Position(1, 4)), { word: '-a-b', startColumn: 4, endColumn: 8 });
            assert.deepEqual(thisModel.getWordAtPosition(new position_1.Position(1, 5)), { word: '-a-b', startColumn: 4, endColumn: 8 });
            assert.deepEqual(thisModel.getWordAtPosition(new position_1.Position(1, 6)), { word: '-a-b', startColumn: 4, endColumn: 8 });
            assert.deepEqual(thisModel.getWordAtPosition(new position_1.Position(1, 7)), { word: '-a-b', startColumn: 4, endColumn: 8 });
            assert.deepEqual(thisModel.getWordAtPosition(new position_1.Position(1, 8)), { word: '-a-b', startColumn: 4, endColumn: 8 });
        });
    });
});
//# sourceMappingURL=model.test.js.map