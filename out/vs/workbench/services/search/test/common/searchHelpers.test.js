/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/model", "vs/workbench/services/search/common/searchHelpers", "vs/editor/common/core/range"], function (require, exports, assert, model_1, searchHelpers_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('SearchHelpers', () => {
        suite('editorMatchesToTextSearchResults', () => {
            const mockTextModel = {
                getLineContent(lineNumber) {
                    return '' + lineNumber;
                }
            };
            test('simple', () => {
                const results = searchHelpers_1.editorMatchesToTextSearchResults([new model_1.FindMatch(new range_1.Range(6, 1, 6, 2), null)], mockTextModel);
                assert.equal(results.length, 1);
                assert.equal(results[0].preview.text, '6\n');
                assert.deepEqual(results[0].preview.matches, [new range_1.Range(0, 0, 0, 1)]);
                assert.deepEqual(results[0].ranges, [new range_1.Range(5, 0, 5, 1)]);
            });
            test('multiple', () => {
                const results = searchHelpers_1.editorMatchesToTextSearchResults([
                    new model_1.FindMatch(new range_1.Range(6, 1, 6, 2), null),
                    new model_1.FindMatch(new range_1.Range(6, 4, 8, 2), null),
                    new model_1.FindMatch(new range_1.Range(9, 1, 10, 3), null),
                ], mockTextModel);
                assert.equal(results.length, 2);
                assert.deepEqual(results[0].preview.matches, [
                    new range_1.Range(0, 0, 0, 1),
                    new range_1.Range(0, 3, 2, 1),
                ]);
                assert.deepEqual(results[0].ranges, [
                    new range_1.Range(5, 0, 5, 1),
                    new range_1.Range(5, 3, 7, 1),
                ]);
                assert.equal(results[0].preview.text, '6\n7\n8\n');
                assert.deepEqual(results[1].preview.matches, [
                    new range_1.Range(0, 0, 1, 2),
                ]);
                assert.deepEqual(results[1].ranges, [
                    new range_1.Range(8, 0, 9, 2),
                ]);
                assert.equal(results[1].preview.text, '9\n10\n');
            });
        });
        suite('addContextToEditorMatches', () => {
            const MOCK_LINE_COUNT = 100;
            const mockTextModel = {
                getLineContent(lineNumber) {
                    if (lineNumber < 1 || lineNumber > MOCK_LINE_COUNT) {
                        throw new Error(`invalid line count: ${lineNumber}`);
                    }
                    return '' + lineNumber;
                },
                getLineCount() {
                    return MOCK_LINE_COUNT;
                }
            };
            function getQuery(beforeContext, afterContext) {
                return {
                    folderQueries: [],
                    type: 2 /* Text */,
                    contentPattern: { pattern: 'test' },
                    beforeContext,
                    afterContext
                };
            }
            test('no context', () => {
                const matches = [{
                        preview: {
                            text: 'foo',
                            matches: new range_1.Range(0, 0, 0, 10)
                        },
                        ranges: new range_1.Range(0, 0, 0, 10)
                    }];
                assert.deepEqual(searchHelpers_1.addContextToEditorMatches(matches, mockTextModel, getQuery()), matches);
            });
            test('simple', () => {
                const matches = [{
                        preview: {
                            text: 'foo',
                            matches: new range_1.Range(0, 0, 0, 10)
                        },
                        ranges: new range_1.Range(1, 0, 1, 10)
                    }];
                assert.deepEqual(searchHelpers_1.addContextToEditorMatches(matches, mockTextModel, getQuery(1, 2)), [
                    {
                        text: '1',
                        lineNumber: 0
                    },
                    ...matches,
                    {
                        text: '3',
                        lineNumber: 2
                    },
                    {
                        text: '4',
                        lineNumber: 3
                    },
                ]);
            });
            test('multiple matches next to each other', () => {
                const matches = [
                    {
                        preview: {
                            text: 'foo',
                            matches: new range_1.Range(0, 0, 0, 10)
                        },
                        ranges: new range_1.Range(1, 0, 1, 10)
                    },
                    {
                        preview: {
                            text: 'bar',
                            matches: new range_1.Range(0, 0, 0, 10)
                        },
                        ranges: new range_1.Range(2, 0, 2, 10)
                    }
                ];
                assert.deepEqual(searchHelpers_1.addContextToEditorMatches(matches, mockTextModel, getQuery(1, 2)), [
                    {
                        text: '1',
                        lineNumber: 0
                    },
                    ...matches,
                    {
                        text: '4',
                        lineNumber: 3
                    },
                    {
                        text: '5',
                        lineNumber: 4
                    },
                ]);
            });
            test('boundaries', () => {
                const matches = [
                    {
                        preview: {
                            text: 'foo',
                            matches: new range_1.Range(0, 0, 0, 10)
                        },
                        ranges: new range_1.Range(0, 0, 0, 10)
                    },
                    {
                        preview: {
                            text: 'bar',
                            matches: new range_1.Range(0, 0, 0, 10)
                        },
                        ranges: new range_1.Range(MOCK_LINE_COUNT - 1, 0, MOCK_LINE_COUNT - 1, 10)
                    }
                ];
                assert.deepEqual(searchHelpers_1.addContextToEditorMatches(matches, mockTextModel, getQuery(1, 2)), [
                    matches[0],
                    {
                        text: '2',
                        lineNumber: 1
                    },
                    {
                        text: '3',
                        lineNumber: 2
                    },
                    {
                        text: '' + (MOCK_LINE_COUNT - 1),
                        lineNumber: MOCK_LINE_COUNT - 2
                    },
                    matches[1]
                ]);
            });
        });
    });
});
//# sourceMappingURL=searchHelpers.test.js.map