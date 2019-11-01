/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/api/common/extHostDocumentData", "vs/workbench/api/common/extHostTypes", "vs/editor/common/core/range", "vs/workbench/test/electron-browser/api/mock"], function (require, exports, assert, uri_1, extHostDocumentData_1, extHostTypes_1, range_1, mock_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostDocumentData', () => {
        let data;
        function assertPositionAt(offset, line, character) {
            let position = data.document.positionAt(offset);
            assert.equal(position.line, line);
            assert.equal(position.character, character);
        }
        function assertOffsetAt(line, character, offset) {
            let pos = new extHostTypes_1.Position(line, character);
            let actual = data.document.offsetAt(pos);
            assert.equal(actual, offset);
        }
        setup(function () {
            data = new extHostDocumentData_1.ExtHostDocumentData(undefined, uri_1.URI.file(''), [
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ], '\n', 'text', 1, false);
        });
        test('readonly-ness', () => {
            assert.throws(() => data.document.uri = null);
            assert.throws(() => data.document.fileName = 'foofile');
            assert.throws(() => data.document.isDirty = false);
            assert.throws(() => data.document.isUntitled = false);
            assert.throws(() => data.document.languageId = 'dddd');
            assert.throws(() => data.document.lineCount = 9);
        });
        test('save, when disposed', function () {
            let saved;
            let data = new extHostDocumentData_1.ExtHostDocumentData(new class extends mock_1.mock() {
                $trySaveDocument(uri) {
                    assert.ok(!saved);
                    saved = uri;
                    return Promise.resolve(true);
                }
            }, uri_1.URI.parse('foo:bar'), [], '\n', 'text', 1, true);
            return data.document.save().then(() => {
                assert.equal(saved.toString(), 'foo:bar');
                data.dispose();
                return data.document.save().then(() => {
                    assert.ok(false, 'expected failure');
                }, err => {
                    assert.ok(err);
                });
            });
        });
        test('read, when disposed', function () {
            data.dispose();
            const { document } = data;
            assert.equal(document.lineCount, 4);
            assert.equal(document.lineAt(0).text, 'This is line one');
        });
        test('lines', () => {
            assert.equal(data.document.lineCount, 4);
            assert.throws(() => data.document.lineAt(-1));
            assert.throws(() => data.document.lineAt(data.document.lineCount));
            assert.throws(() => data.document.lineAt(Number.MAX_VALUE));
            assert.throws(() => data.document.lineAt(Number.MIN_VALUE));
            assert.throws(() => data.document.lineAt(0.8));
            let line = data.document.lineAt(0);
            assert.equal(line.lineNumber, 0);
            assert.equal(line.text.length, 16);
            assert.equal(line.text, 'This is line one');
            assert.equal(line.isEmptyOrWhitespace, false);
            assert.equal(line.firstNonWhitespaceCharacterIndex, 0);
            data.onEvents({
                changes: [{
                        range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
                        rangeOffset: undefined,
                        rangeLength: undefined,
                        text: '\t '
                    }],
                eol: undefined,
                versionId: undefined,
            });
            // line didn't change
            assert.equal(line.text, 'This is line one');
            assert.equal(line.firstNonWhitespaceCharacterIndex, 0);
            // fetch line again
            line = data.document.lineAt(0);
            assert.equal(line.text, '\t This is line one');
            assert.equal(line.firstNonWhitespaceCharacterIndex, 2);
        });
        test('line, issue #5704', function () {
            let line = data.document.lineAt(0);
            let { range, rangeIncludingLineBreak } = line;
            assert.equal(range.end.line, 0);
            assert.equal(range.end.character, 16);
            assert.equal(rangeIncludingLineBreak.end.line, 1);
            assert.equal(rangeIncludingLineBreak.end.character, 0);
            line = data.document.lineAt(data.document.lineCount - 1);
            range = line.range;
            rangeIncludingLineBreak = line.rangeIncludingLineBreak;
            assert.equal(range.end.line, 3);
            assert.equal(range.end.character, 29);
            assert.equal(rangeIncludingLineBreak.end.line, 3);
            assert.equal(rangeIncludingLineBreak.end.character, 29);
        });
        test('offsetAt', () => {
            assertOffsetAt(0, 0, 0);
            assertOffsetAt(0, 1, 1);
            assertOffsetAt(0, 16, 16);
            assertOffsetAt(1, 0, 17);
            assertOffsetAt(1, 3, 20);
            assertOffsetAt(2, 0, 45);
            assertOffsetAt(4, 29, 95);
            assertOffsetAt(4, 30, 95);
            assertOffsetAt(4, Number.MAX_VALUE, 95);
            assertOffsetAt(5, 29, 95);
            assertOffsetAt(Number.MAX_VALUE, 29, 95);
            assertOffsetAt(Number.MAX_VALUE, Number.MAX_VALUE, 95);
        });
        test('offsetAt, after remove', function () {
            data.onEvents({
                changes: [{
                        range: { startLineNumber: 1, startColumn: 3, endLineNumber: 1, endColumn: 6 },
                        rangeOffset: undefined,
                        rangeLength: undefined,
                        text: ''
                    }],
                eol: undefined,
                versionId: undefined,
            });
            assertOffsetAt(0, 1, 1);
            assertOffsetAt(0, 13, 13);
            assertOffsetAt(1, 0, 14);
        });
        test('offsetAt, after replace', function () {
            data.onEvents({
                changes: [{
                        range: { startLineNumber: 1, startColumn: 3, endLineNumber: 1, endColumn: 6 },
                        rangeOffset: undefined,
                        rangeLength: undefined,
                        text: 'is could be'
                    }],
                eol: undefined,
                versionId: undefined,
            });
            assertOffsetAt(0, 1, 1);
            assertOffsetAt(0, 24, 24);
            assertOffsetAt(1, 0, 25);
        });
        test('offsetAt, after insert line', function () {
            data.onEvents({
                changes: [{
                        range: { startLineNumber: 1, startColumn: 3, endLineNumber: 1, endColumn: 6 },
                        rangeOffset: undefined,
                        rangeLength: undefined,
                        text: 'is could be\na line with number'
                    }],
                eol: undefined,
                versionId: undefined,
            });
            assertOffsetAt(0, 1, 1);
            assertOffsetAt(0, 13, 13);
            assertOffsetAt(1, 0, 14);
            assertOffsetAt(1, 18, 13 + 1 + 18);
            assertOffsetAt(1, 29, 13 + 1 + 29);
            assertOffsetAt(2, 0, 13 + 1 + 29 + 1);
        });
        test('offsetAt, after remove line', function () {
            data.onEvents({
                changes: [{
                        range: { startLineNumber: 1, startColumn: 3, endLineNumber: 2, endColumn: 6 },
                        rangeOffset: undefined,
                        rangeLength: undefined,
                        text: ''
                    }],
                eol: undefined,
                versionId: undefined,
            });
            assertOffsetAt(0, 1, 1);
            assertOffsetAt(0, 2, 2);
            assertOffsetAt(1, 0, 25);
        });
        test('positionAt', () => {
            assertPositionAt(0, 0, 0);
            assertPositionAt(Number.MIN_VALUE, 0, 0);
            assertPositionAt(1, 0, 1);
            assertPositionAt(16, 0, 16);
            assertPositionAt(17, 1, 0);
            assertPositionAt(20, 1, 3);
            assertPositionAt(45, 2, 0);
            assertPositionAt(95, 3, 29);
            assertPositionAt(96, 3, 29);
            assertPositionAt(99, 3, 29);
            assertPositionAt(Number.MAX_VALUE, 3, 29);
        });
        test('getWordRangeAtPosition', () => {
            data = new extHostDocumentData_1.ExtHostDocumentData(undefined, uri_1.URI.file(''), [
                'aaaa bbbb+cccc abc'
            ], '\n', 'text', 1, false);
            let range = data.document.getWordRangeAtPosition(new extHostTypes_1.Position(0, 2));
            assert.equal(range.start.line, 0);
            assert.equal(range.start.character, 0);
            assert.equal(range.end.line, 0);
            assert.equal(range.end.character, 4);
            // ignore bad regular expresson /.*/
            range = data.document.getWordRangeAtPosition(new extHostTypes_1.Position(0, 2), /.*/);
            assert.equal(range.start.line, 0);
            assert.equal(range.start.character, 0);
            assert.equal(range.end.line, 0);
            assert.equal(range.end.character, 4);
            range = data.document.getWordRangeAtPosition(new extHostTypes_1.Position(0, 5), /[a-z+]+/);
            assert.equal(range.start.line, 0);
            assert.equal(range.start.character, 5);
            assert.equal(range.end.line, 0);
            assert.equal(range.end.character, 14);
            range = data.document.getWordRangeAtPosition(new extHostTypes_1.Position(0, 17), /[a-z+]+/);
            assert.equal(range.start.line, 0);
            assert.equal(range.start.character, 15);
            assert.equal(range.end.line, 0);
            assert.equal(range.end.character, 18);
            range = data.document.getWordRangeAtPosition(new extHostTypes_1.Position(0, 11), /yy/);
            assert.equal(range, undefined);
        });
        test('getWordRangeAtPosition doesn\'t quite use the regex as expected, #29102', function () {
            data = new extHostDocumentData_1.ExtHostDocumentData(undefined, uri_1.URI.file(''), [
                'some text here',
                '/** foo bar */',
                'function() {',
                '	"far boo"',
                '}'
            ], '\n', 'text', 1, false);
            let range = data.document.getWordRangeAtPosition(new extHostTypes_1.Position(0, 0), /\/\*.+\*\//);
            assert.equal(range, undefined);
            range = data.document.getWordRangeAtPosition(new extHostTypes_1.Position(1, 0), /\/\*.+\*\//);
            assert.equal(range.start.line, 1);
            assert.equal(range.start.character, 0);
            assert.equal(range.end.line, 1);
            assert.equal(range.end.character, 14);
            range = data.document.getWordRangeAtPosition(new extHostTypes_1.Position(3, 0), /("|').*\1/);
            assert.equal(range, undefined);
            range = data.document.getWordRangeAtPosition(new extHostTypes_1.Position(3, 1), /("|').*\1/);
            assert.equal(range.start.line, 3);
            assert.equal(range.start.character, 1);
            assert.equal(range.end.line, 3);
            assert.equal(range.end.character, 10);
        });
    });
    var AssertDocumentLineMappingDirection;
    (function (AssertDocumentLineMappingDirection) {
        AssertDocumentLineMappingDirection[AssertDocumentLineMappingDirection["OffsetToPosition"] = 0] = "OffsetToPosition";
        AssertDocumentLineMappingDirection[AssertDocumentLineMappingDirection["PositionToOffset"] = 1] = "PositionToOffset";
    })(AssertDocumentLineMappingDirection || (AssertDocumentLineMappingDirection = {}));
    suite('ExtHostDocumentData updates line mapping', () => {
        function positionToStr(position) {
            return '(' + position.line + ',' + position.character + ')';
        }
        function assertDocumentLineMapping(doc, direction) {
            let allText = doc.getText();
            let line = 0, character = 0, previousIsCarriageReturn = false;
            for (let offset = 0; offset <= allText.length; offset++) {
                // The position coordinate system cannot express the position between \r and \n
                let position = new extHostTypes_1.Position(line, character + (previousIsCarriageReturn ? -1 : 0));
                if (direction === AssertDocumentLineMappingDirection.OffsetToPosition) {
                    let actualPosition = doc.document.positionAt(offset);
                    assert.equal(positionToStr(actualPosition), positionToStr(position), 'positionAt mismatch for offset ' + offset);
                }
                else {
                    // The position coordinate system cannot express the position between \r and \n
                    let expectedOffset = offset + (previousIsCarriageReturn ? -1 : 0);
                    let actualOffset = doc.document.offsetAt(position);
                    assert.equal(actualOffset, expectedOffset, 'offsetAt mismatch for position ' + positionToStr(position));
                }
                if (allText.charAt(offset) === '\n') {
                    line++;
                    character = 0;
                }
                else {
                    character++;
                }
                previousIsCarriageReturn = (allText.charAt(offset) === '\r');
            }
        }
        function createChangeEvent(range, text, eol) {
            return {
                changes: [{
                        range: range,
                        rangeOffset: undefined,
                        rangeLength: undefined,
                        text: text
                    }],
                eol: eol,
                versionId: undefined,
            };
        }
        function testLineMappingDirectionAfterEvents(lines, eol, direction, e) {
            let myDocument = new extHostDocumentData_1.ExtHostDocumentData(undefined, uri_1.URI.file(''), lines.slice(0), eol, 'text', 1, false);
            assertDocumentLineMapping(myDocument, direction);
            myDocument.onEvents(e);
            assertDocumentLineMapping(myDocument, direction);
        }
        function testLineMappingAfterEvents(lines, e) {
            testLineMappingDirectionAfterEvents(lines, '\n', AssertDocumentLineMappingDirection.PositionToOffset, e);
            testLineMappingDirectionAfterEvents(lines, '\n', AssertDocumentLineMappingDirection.OffsetToPosition, e);
            testLineMappingDirectionAfterEvents(lines, '\r\n', AssertDocumentLineMappingDirection.PositionToOffset, e);
            testLineMappingDirectionAfterEvents(lines, '\r\n', AssertDocumentLineMappingDirection.OffsetToPosition, e);
        }
        test('line mapping', () => {
            testLineMappingAfterEvents([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ], { changes: [], eol: undefined, versionId: 7 });
        });
        test('after remove', () => {
            testLineMappingAfterEvents([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ], createChangeEvent(new range_1.Range(1, 3, 1, 6), ''));
        });
        test('after replace', () => {
            testLineMappingAfterEvents([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ], createChangeEvent(new range_1.Range(1, 3, 1, 6), 'is could be'));
        });
        test('after insert line', () => {
            testLineMappingAfterEvents([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ], createChangeEvent(new range_1.Range(1, 3, 1, 6), 'is could be\na line with number'));
        });
        test('after insert two lines', () => {
            testLineMappingAfterEvents([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ], createChangeEvent(new range_1.Range(1, 3, 1, 6), 'is could be\na line with number\nyet another line'));
        });
        test('after remove line', () => {
            testLineMappingAfterEvents([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ], createChangeEvent(new range_1.Range(1, 3, 2, 6), ''));
        });
        test('after remove two lines', () => {
            testLineMappingAfterEvents([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ], createChangeEvent(new range_1.Range(1, 3, 3, 6), ''));
        });
        test('after deleting entire content', () => {
            testLineMappingAfterEvents([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ], createChangeEvent(new range_1.Range(1, 3, 4, 30), ''));
        });
        test('after replacing entire content', () => {
            testLineMappingAfterEvents([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ], createChangeEvent(new range_1.Range(1, 3, 4, 30), 'some new text\nthat\nspans multiple lines'));
        });
        test('after changing EOL to CRLF', () => {
            testLineMappingAfterEvents([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ], createChangeEvent(new range_1.Range(1, 1, 1, 1), '', '\r\n'));
        });
        test('after changing EOL to LF', () => {
            testLineMappingAfterEvents([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ], createChangeEvent(new range_1.Range(1, 1, 1, 1), '', '\n'));
        });
    });
});
//# sourceMappingURL=extHostDocumentData.test.js.map