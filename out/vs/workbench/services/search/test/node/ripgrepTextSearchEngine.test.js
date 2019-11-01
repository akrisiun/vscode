/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/resources", "vs/base/common/uri", "vs/workbench/services/search/node/ripgrepTextSearchEngine", "vs/workbench/services/search/common/searchExtTypes"], function (require, exports, assert, resources_1, uri_1, ripgrepTextSearchEngine_1, searchExtTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('RipgrepTextSearchEngine', () => {
        test('unicodeEscapesToPCRE2', async () => {
            assert.equal(ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2('\\u1234'), '\\x{1234}');
            assert.equal(ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2('\\u1234\\u0001'), '\\x{1234}\\x{0001}');
            assert.equal(ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2('foo\\u1234bar'), 'foo\\x{1234}bar');
            assert.equal(ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2('\\\\\\u1234'), '\\\\\\x{1234}');
            assert.equal(ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2('foo\\\\\\u1234'), 'foo\\\\\\x{1234}');
            assert.equal(ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2('\\u{1234}'), '\\x{1234}');
            assert.equal(ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2('\\u{1234}\\u{0001}'), '\\x{1234}\\x{0001}');
            assert.equal(ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2('foo\\u{1234}bar'), 'foo\\x{1234}bar');
            assert.equal(ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2('foo\\u{123456}7bar'), 'foo\\u{123456}7bar');
            assert.equal(ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2('\\u123'), '\\u123');
            assert.equal(ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2('foo'), 'foo');
            assert.equal(ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2(''), '');
        });
        test('fixRegexNewline', () => {
            function testFixRegexNewline([inputReg, testStr, shouldMatch]) {
                const fixed = ripgrepTextSearchEngine_1.fixRegexNewline(inputReg);
                const reg = new RegExp(fixed);
                assert.equal(reg.test(testStr), shouldMatch, `${inputReg} => ${reg}, ${testStr}, ${shouldMatch}`);
            }
            [
                ['foo', 'foo', true],
                ['foo\\n', 'foo\r\n', true],
                ['foo\\n', 'foo\n', true],
                ['foo\\nabc', 'foo\r\nabc', true],
                ['foo\\nabc', 'foo\nabc', true],
                ['foo\\r\\n', 'foo\r\n', true],
                ['foo\\n+abc', 'foo\r\nabc', true],
                ['foo\\n+abc', 'foo\n\n\nabc', true],
            ].forEach(testFixRegexNewline);
        });
        test('fixNewline', () => {
            function testFixNewline([inputReg, testStr, shouldMatch = true]) {
                const fixed = ripgrepTextSearchEngine_1.fixNewline(inputReg);
                const reg = new RegExp(fixed);
                assert.equal(reg.test(testStr), shouldMatch, `${inputReg} => ${reg}, ${testStr}, ${shouldMatch}`);
            }
            [
                ['foo', 'foo'],
                ['foo\n', 'foo\r\n'],
                ['foo\n', 'foo\n'],
                ['foo\nabc', 'foo\r\nabc'],
                ['foo\nabc', 'foo\nabc'],
                ['foo\r\n', 'foo\r\n'],
                ['foo\nbarc', 'foobar', false],
                ['foobar', 'foo\nbar', false],
            ].forEach(testFixNewline);
        });
        suite('RipgrepParser', () => {
            const TEST_FOLDER = uri_1.URI.file('/foo/bar');
            function testParser(inputData, expectedResults) {
                const testParser = new ripgrepTextSearchEngine_1.RipgrepParser(1000, TEST_FOLDER.fsPath);
                const actualResults = [];
                testParser.on('result', r => {
                    actualResults.push(r);
                });
                inputData.forEach(d => testParser.handleData(d));
                testParser.flush();
                assert.deepEqual(actualResults, expectedResults);
            }
            function makeRgMatch(relativePath, text, lineNumber, matchRanges) {
                return JSON.stringify({
                    type: 'match',
                    data: {
                        path: {
                            text: relativePath
                        },
                        lines: {
                            text
                        },
                        line_number: lineNumber,
                        absolute_offset: 0,
                        submatches: matchRanges.map(mr => {
                            return Object.assign(Object.assign({}, mr), { match: { text: text.substring(mr.start, mr.end) } });
                        })
                    }
                }) + '\n';
            }
            test('single result', () => {
                testParser([
                    makeRgMatch('file1.js', 'foobar', 4, [{ start: 3, end: 6 }])
                ], [
                    {
                        preview: {
                            text: 'foobar',
                            matches: [new searchExtTypes_1.Range(0, 3, 0, 6)]
                        },
                        uri: resources_1.joinPath(TEST_FOLDER, 'file1.js'),
                        ranges: [new searchExtTypes_1.Range(3, 3, 3, 6)]
                    }
                ]);
            });
            test('multiple results', () => {
                testParser([
                    makeRgMatch('file1.js', 'foobar', 4, [{ start: 3, end: 6 }]),
                    makeRgMatch('app/file2.js', 'foobar', 4, [{ start: 3, end: 6 }]),
                    makeRgMatch('app2/file3.js', 'foobar', 4, [{ start: 3, end: 6 }]),
                ], [
                    {
                        preview: {
                            text: 'foobar',
                            matches: [new searchExtTypes_1.Range(0, 3, 0, 6)]
                        },
                        uri: resources_1.joinPath(TEST_FOLDER, 'file1.js'),
                        ranges: [new searchExtTypes_1.Range(3, 3, 3, 6)]
                    },
                    {
                        preview: {
                            text: 'foobar',
                            matches: [new searchExtTypes_1.Range(0, 3, 0, 6)]
                        },
                        uri: resources_1.joinPath(TEST_FOLDER, 'app/file2.js'),
                        ranges: [new searchExtTypes_1.Range(3, 3, 3, 6)]
                    },
                    {
                        preview: {
                            text: 'foobar',
                            matches: [new searchExtTypes_1.Range(0, 3, 0, 6)]
                        },
                        uri: resources_1.joinPath(TEST_FOLDER, 'app2/file3.js'),
                        ranges: [new searchExtTypes_1.Range(3, 3, 3, 6)]
                    }
                ]);
            });
            test('chopped-up input chunks', () => {
                const dataStrs = [
                    makeRgMatch('file1.js', 'foo bar', 4, [{ start: 3, end: 7 }]),
                    makeRgMatch('app/file2.js', 'foobar', 4, [{ start: 3, end: 6 }]),
                    makeRgMatch('app2/file3.js', 'foobar', 4, [{ start: 3, end: 6 }]),
                ];
                const dataStr0Space = dataStrs[0].indexOf(' ');
                testParser([
                    dataStrs[0].substring(0, dataStr0Space + 1),
                    dataStrs[0].substring(dataStr0Space + 1),
                    '\n',
                    dataStrs[1].trim(),
                    '\n' + dataStrs[2].substring(0, 25),
                    dataStrs[2].substring(25)
                ], [
                    {
                        preview: {
                            text: 'foo bar',
                            matches: [new searchExtTypes_1.Range(0, 3, 0, 7)]
                        },
                        uri: resources_1.joinPath(TEST_FOLDER, 'file1.js'),
                        ranges: [new searchExtTypes_1.Range(3, 3, 3, 7)]
                    },
                    {
                        preview: {
                            text: 'foobar',
                            matches: [new searchExtTypes_1.Range(0, 3, 0, 6)]
                        },
                        uri: resources_1.joinPath(TEST_FOLDER, 'app/file2.js'),
                        ranges: [new searchExtTypes_1.Range(3, 3, 3, 6)]
                    },
                    {
                        preview: {
                            text: 'foobar',
                            matches: [new searchExtTypes_1.Range(0, 3, 0, 6)]
                        },
                        uri: resources_1.joinPath(TEST_FOLDER, 'app2/file3.js'),
                        ranges: [new searchExtTypes_1.Range(3, 3, 3, 6)]
                    }
                ]);
            });
        });
    });
});
//# sourceMappingURL=ripgrepTextSearchEngine.test.js.map