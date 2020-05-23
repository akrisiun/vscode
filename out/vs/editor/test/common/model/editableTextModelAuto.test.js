/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/test/common/model/editableTextModelTestUtils"], function (require, exports, position_1, range_1, editableTextModelTestUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const GENERATE_TESTS = false;
    suite('EditorModel Auto Tests', () => {
        function editOp(startLineNumber, startColumn, endLineNumber, endColumn, text) {
            return {
                identifier: null,
                range: new range_1.Range(startLineNumber, startColumn, endLineNumber, endColumn),
                text: text.join('\n'),
                forceMoveMarkers: false
            };
        }
        test('auto1', () => {
            editableTextModelTestUtils_1.testApplyEditsWithSyncedModels([
                'ioe',
                '',
                'yjct',
                '',
                '',
            ], [
                editOp(1, 2, 1, 2, ['b', 'r', 'fq']),
                editOp(1, 4, 2, 1, ['', '']),
            ], [
                'ib',
                'r',
                'fqoe',
                '',
                'yjct',
                '',
                '',
            ]);
        });
        test('auto2', () => {
            editableTextModelTestUtils_1.testApplyEditsWithSyncedModels([
                'f',
                'littnhskrq',
                'utxvsizqnk',
                'lslqz',
                'jxn',
                'gmm',
            ], [
                editOp(1, 2, 1, 2, ['', 'o']),
                editOp(2, 4, 2, 4, ['zaq', 'avb']),
                editOp(2, 5, 6, 2, ['jlr', 'zl', 'j']),
            ], [
                'f',
                'o',
                'litzaq',
                'avbtjlr',
                'zl',
                'jmm',
            ]);
        });
        test('auto3', () => {
            editableTextModelTestUtils_1.testApplyEditsWithSyncedModels([
                'ofw',
                'qsxmziuvzw',
                'rp',
                'qsnymek',
                'elth',
                'wmgzbwudxz',
                'iwsdkndh',
                'bujlbwb',
                'asuouxfv',
                'xuccnb',
            ], [
                editOp(4, 3, 4, 3, ['']),
            ], [
                'ofw',
                'qsxmziuvzw',
                'rp',
                'qsnymek',
                'elth',
                'wmgzbwudxz',
                'iwsdkndh',
                'bujlbwb',
                'asuouxfv',
                'xuccnb',
            ]);
        });
        test('auto4', () => {
            editableTextModelTestUtils_1.testApplyEditsWithSyncedModels([
                'fefymj',
                'qum',
                'vmiwxxaiqq',
                'dz',
                'lnqdgorosf',
            ], [
                editOp(1, 3, 1, 5, ['hp']),
                editOp(1, 7, 2, 1, ['kcg', '', 'mpx']),
                editOp(2, 2, 2, 2, ['', 'aw', '']),
                editOp(2, 2, 2, 2, ['vqr', 'mo']),
                editOp(4, 2, 5, 3, ['xyc']),
            ], [
                'fehpmjkcg',
                '',
                'mpxq',
                'aw',
                'vqr',
                'moum',
                'vmiwxxaiqq',
                'dxycqdgorosf',
            ]);
        });
    });
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    function getRandomString(minLength, maxLength) {
        let length = getRandomInt(minLength, maxLength);
        let r = '';
        for (let i = 0; i < length; i++) {
            r += String.fromCharCode(getRandomInt(97 /* a */, 122 /* z */));
        }
        return r;
    }
    function generateFile(small) {
        let lineCount = getRandomInt(1, small ? 3 : 10);
        let lines = [];
        for (let i = 0; i < lineCount; i++) {
            lines.push(getRandomString(0, small ? 3 : 10));
        }
        return lines.join('\n');
    }
    function generateEdits(content) {
        let result = [];
        let cnt = getRandomInt(1, 5);
        let maxOffset = content.length;
        while (cnt > 0 && maxOffset > 0) {
            let offset = getRandomInt(0, maxOffset);
            let length = getRandomInt(0, maxOffset - offset);
            let text = generateFile(true);
            result.push({
                offset: offset,
                length: length,
                text: text
            });
            maxOffset = offset;
            cnt--;
        }
        result.reverse();
        return result;
    }
    class TestModel {
        constructor() {
            this.initialContent = generateFile(false);
            let edits = generateEdits(this.initialContent);
            let offsetToPosition = TestModel._generateOffsetToPosition(this.initialContent);
            this.edits = [];
            for (const edit of edits) {
                let startPosition = offsetToPosition[edit.offset];
                let endPosition = offsetToPosition[edit.offset + edit.length];
                this.edits.push({
                    range: new range_1.Range(startPosition.lineNumber, startPosition.column, endPosition.lineNumber, endPosition.column),
                    text: edit.text
                });
            }
            this.resultingContent = this.initialContent;
            for (let i = edits.length - 1; i >= 0; i--) {
                this.resultingContent = (this.resultingContent.substring(0, edits[i].offset) +
                    edits[i].text +
                    this.resultingContent.substring(edits[i].offset + edits[i].length));
            }
        }
        static _generateOffsetToPosition(content) {
            let result = [];
            let lineNumber = 1;
            let column = 1;
            for (let offset = 0, len = content.length; offset <= len; offset++) {
                let ch = content.charAt(offset);
                result[offset] = new position_1.Position(lineNumber, column);
                if (ch === '\n') {
                    lineNumber++;
                    column = 1;
                }
                else {
                    column++;
                }
            }
            return result;
        }
        print() {
            let r = [];
            r.push('testApplyEditsWithSyncedModels(');
            r.push('\t[');
            let initialLines = this.initialContent.split('\n');
            r = r.concat(initialLines.map((i) => `\t\t'${i}',`));
            r.push('\t],');
            r.push('\t[');
            r = r.concat(this.edits.map((i) => {
                let text = `['` + i.text.split('\n').join(`', '`) + `']`;
                return `\t\teditOp(${i.range.startLineNumber}, ${i.range.startColumn}, ${i.range.endLineNumber}, ${i.range.endColumn}, ${text}),`;
            }));
            r.push('\t],');
            r.push('\t[');
            let resultLines = this.resultingContent.split('\n');
            r = r.concat(resultLines.map((i) => `\t\t'${i}',`));
            r.push('\t]');
            r.push(');');
            return r.join('\n');
        }
    }
    if (GENERATE_TESTS) {
        let number = 1;
        while (true) {
            console.log('------BEGIN NEW TEST: ' + number);
            let testModel = new TestModel();
            // console.log(testModel.print());
            console.log('------END NEW TEST: ' + (number++));
            try {
                editableTextModelTestUtils_1.testApplyEditsWithSyncedModels(testModel.initialContent.split('\n'), testModel.edits, testModel.resultingContent.split('\n'));
                // throw new Error('a');
            }
            catch (err) {
                console.log(err);
                console.log(testModel.print());
                break;
            }
            // break;
        }
    }
});
//# sourceMappingURL=editableTextModelAuto.test.js.map