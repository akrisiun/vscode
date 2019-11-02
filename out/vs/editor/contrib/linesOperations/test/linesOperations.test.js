define(["require", "exports", "assert", "vs/editor/browser/controller/coreCommands", "vs/editor/common/core/position", "vs/editor/common/core/selection", "vs/editor/common/editorCommon", "vs/editor/contrib/linesOperations/linesOperations", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/common/editorTestUtils"], function (require, exports, assert, coreCommands_1, position_1, selection_1, editorCommon_1, linesOperations_1, testCodeEditor_1, editorTestUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Editor Contrib - Line Operations', () => {
        suite('SortLinesAscendingAction', () => {
            test('should sort selected lines in ascending order', function () {
                testCodeEditor_1.withTestCodeEditor([
                    'omicron',
                    'beta',
                    'alpha'
                ], {}, (editor) => {
                    let model = editor.getModel();
                    let sortLinesAscendingAction = new linesOperations_1.SortLinesAscendingAction();
                    editor.setSelection(new selection_1.Selection(1, 1, 3, 5));
                    sortLinesAscendingAction.run(null, editor);
                    assert.deepEqual(model.getLinesContent(), [
                        'alpha',
                        'beta',
                        'omicron'
                    ]);
                    assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(1, 1, 3, 7).toString());
                });
            });
            test('should sort multiple selections in ascending order', function () {
                testCodeEditor_1.withTestCodeEditor([
                    'omicron',
                    'beta',
                    'alpha',
                    '',
                    'omicron',
                    'beta',
                    'alpha'
                ], {}, (editor) => {
                    let model = editor.getModel();
                    let sortLinesAscendingAction = new linesOperations_1.SortLinesAscendingAction();
                    editor.setSelections([new selection_1.Selection(1, 1, 3, 5), new selection_1.Selection(5, 1, 7, 5)]);
                    sortLinesAscendingAction.run(null, editor);
                    assert.deepEqual(model.getLinesContent(), [
                        'alpha',
                        'beta',
                        'omicron',
                        '',
                        'alpha',
                        'beta',
                        'omicron'
                    ]);
                    let expectedSelections = [
                        new selection_1.Selection(1, 1, 3, 7),
                        new selection_1.Selection(5, 1, 7, 7)
                    ];
                    editor.getSelections().forEach((actualSelection, index) => {
                        assert.deepEqual(actualSelection.toString(), expectedSelections[index].toString());
                    });
                });
            });
        });
        suite('SortLinesDescendingAction', () => {
            test('should sort selected lines in descending order', function () {
                testCodeEditor_1.withTestCodeEditor([
                    'alpha',
                    'beta',
                    'omicron'
                ], {}, (editor) => {
                    let model = editor.getModel();
                    let sortLinesDescendingAction = new linesOperations_1.SortLinesDescendingAction();
                    editor.setSelection(new selection_1.Selection(1, 1, 3, 7));
                    sortLinesDescendingAction.run(null, editor);
                    assert.deepEqual(model.getLinesContent(), [
                        'omicron',
                        'beta',
                        'alpha'
                    ]);
                    assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(1, 1, 3, 5).toString());
                });
            });
            test('should sort multiple selections in descending order', function () {
                testCodeEditor_1.withTestCodeEditor([
                    'alpha',
                    'beta',
                    'omicron',
                    '',
                    'alpha',
                    'beta',
                    'omicron'
                ], {}, (editor) => {
                    let model = editor.getModel();
                    let sortLinesDescendingAction = new linesOperations_1.SortLinesDescendingAction();
                    editor.setSelections([new selection_1.Selection(1, 1, 3, 7), new selection_1.Selection(5, 1, 7, 7)]);
                    sortLinesDescendingAction.run(null, editor);
                    assert.deepEqual(model.getLinesContent(), [
                        'omicron',
                        'beta',
                        'alpha',
                        '',
                        'omicron',
                        'beta',
                        'alpha'
                    ]);
                    let expectedSelections = [
                        new selection_1.Selection(1, 1, 3, 5),
                        new selection_1.Selection(5, 1, 7, 5)
                    ];
                    editor.getSelections().forEach((actualSelection, index) => {
                        assert.deepEqual(actualSelection.toString(), expectedSelections[index].toString());
                    });
                });
            });
        });
        suite('DeleteAllLeftAction', () => {
            test('should delete to the left of the cursor', function () {
                testCodeEditor_1.withTestCodeEditor([
                    'one',
                    'two',
                    'three'
                ], {}, (editor) => {
                    let model = editor.getModel();
                    let deleteAllLeftAction = new linesOperations_1.DeleteAllLeftAction();
                    editor.setSelection(new selection_1.Selection(1, 2, 1, 2));
                    deleteAllLeftAction.run(null, editor);
                    assert.equal(model.getLineContent(1), 'ne', '001');
                    editor.setSelections([new selection_1.Selection(2, 2, 2, 2), new selection_1.Selection(3, 2, 3, 2)]);
                    deleteAllLeftAction.run(null, editor);
                    assert.equal(model.getLineContent(2), 'wo', '002');
                    assert.equal(model.getLineContent(3), 'hree', '003');
                });
            });
            test('should jump to the previous line when on first column', function () {
                testCodeEditor_1.withTestCodeEditor([
                    'one',
                    'two',
                    'three'
                ], {}, (editor) => {
                    let model = editor.getModel();
                    let deleteAllLeftAction = new linesOperations_1.DeleteAllLeftAction();
                    editor.setSelection(new selection_1.Selection(2, 1, 2, 1));
                    deleteAllLeftAction.run(null, editor);
                    assert.equal(model.getLineContent(1), 'onetwo', '001');
                    editor.setSelections([new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(2, 1, 2, 1)]);
                    deleteAllLeftAction.run(null, editor);
                    assert.equal(model.getLinesContent()[0], 'onetwothree');
                    assert.equal(model.getLinesContent().length, 1);
                    editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                    deleteAllLeftAction.run(null, editor);
                    assert.equal(model.getLinesContent()[0], 'onetwothree');
                });
            });
            test('should keep deleting lines in multi cursor mode', function () {
                testCodeEditor_1.withTestCodeEditor([
                    'hi my name is Carlos Matos',
                    'BCC',
                    'waso waso waso',
                    'my wife doesnt believe in me',
                    'nonononono',
                    'bitconneeeect'
                ], {}, (editor) => {
                    let model = editor.getModel();
                    let deleteAllLeftAction = new linesOperations_1.DeleteAllLeftAction();
                    const beforeSecondWasoSelection = new selection_1.Selection(3, 5, 3, 5);
                    const endOfBCCSelection = new selection_1.Selection(2, 4, 2, 4);
                    const endOfNonono = new selection_1.Selection(5, 11, 5, 11);
                    editor.setSelections([beforeSecondWasoSelection, endOfBCCSelection, endOfNonono]);
                    deleteAllLeftAction.run(null, editor);
                    let selections = editor.getSelections();
                    assert.equal(model.getLineContent(2), '');
                    assert.equal(model.getLineContent(3), ' waso waso');
                    assert.equal(model.getLineContent(5), '');
                    assert.deepEqual([
                        selections[0].startLineNumber,
                        selections[0].startColumn,
                        selections[0].endLineNumber,
                        selections[0].endColumn
                    ], [3, 1, 3, 1]);
                    assert.deepEqual([
                        selections[1].startLineNumber,
                        selections[1].startColumn,
                        selections[1].endLineNumber,
                        selections[1].endColumn
                    ], [2, 1, 2, 1]);
                    assert.deepEqual([
                        selections[2].startLineNumber,
                        selections[2].startColumn,
                        selections[2].endLineNumber,
                        selections[2].endColumn
                    ], [5, 1, 5, 1]);
                    deleteAllLeftAction.run(null, editor);
                    selections = editor.getSelections();
                    assert.equal(model.getLineContent(1), 'hi my name is Carlos Matos waso waso');
                    assert.equal(selections.length, 2);
                    assert.deepEqual([
                        selections[0].startLineNumber,
                        selections[0].startColumn,
                        selections[0].endLineNumber,
                        selections[0].endColumn
                    ], [1, 27, 1, 27]);
                    assert.deepEqual([
                        selections[1].startLineNumber,
                        selections[1].startColumn,
                        selections[1].endLineNumber,
                        selections[1].endColumn
                    ], [2, 29, 2, 29]);
                });
            });
            test('should work in multi cursor mode', function () {
                testCodeEditor_1.withTestCodeEditor([
                    'hello',
                    'world',
                    'hello world',
                    'hello',
                    'bonjour',
                    'hola',
                    'world',
                    'hello world',
                ], {}, (editor) => {
                    let model = editor.getModel();
                    let deleteAllLeftAction = new linesOperations_1.DeleteAllLeftAction();
                    editor.setSelections([new selection_1.Selection(1, 2, 1, 2), new selection_1.Selection(1, 4, 1, 4)]);
                    deleteAllLeftAction.run(null, editor);
                    assert.equal(model.getLineContent(1), 'lo', '001');
                    editor.setSelections([new selection_1.Selection(2, 2, 2, 2), new selection_1.Selection(2, 4, 2, 5)]);
                    deleteAllLeftAction.run(null, editor);
                    assert.equal(model.getLineContent(2), 'd', '002');
                    editor.setSelections([new selection_1.Selection(3, 2, 3, 5), new selection_1.Selection(3, 7, 3, 7)]);
                    deleteAllLeftAction.run(null, editor);
                    assert.equal(model.getLineContent(3), 'world', '003');
                    editor.setSelections([new selection_1.Selection(4, 3, 4, 3), new selection_1.Selection(4, 5, 5, 4)]);
                    deleteAllLeftAction.run(null, editor);
                    assert.equal(model.getLineContent(4), 'jour', '004');
                    editor.setSelections([new selection_1.Selection(5, 3, 6, 3), new selection_1.Selection(6, 5, 7, 5), new selection_1.Selection(7, 7, 7, 7)]);
                    deleteAllLeftAction.run(null, editor);
                    assert.equal(model.getLineContent(5), 'world', '005');
                });
            });
            test('issue #36234: should push undo stop', () => {
                testCodeEditor_1.withTestCodeEditor([
                    'one',
                    'two',
                    'three'
                ], {}, (editor) => {
                    let model = editor.getModel();
                    let deleteAllLeftAction = new linesOperations_1.DeleteAllLeftAction();
                    editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                    editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'Typing some text here on line ' });
                    assert.equal(model.getLineContent(1), 'Typing some text here on line one');
                    assert.deepEqual(editor.getSelection(), new selection_1.Selection(1, 31, 1, 31));
                    deleteAllLeftAction.run(null, editor);
                    assert.equal(model.getLineContent(1), 'one');
                    assert.deepEqual(editor.getSelection(), new selection_1.Selection(1, 1, 1, 1));
                    editor.trigger('keyboard', editorCommon_1.Handler.Undo, {});
                    assert.equal(model.getLineContent(1), 'Typing some text here on line one');
                    assert.deepEqual(editor.getSelection(), new selection_1.Selection(1, 31, 1, 31));
                });
            });
        });
        suite('JoinLinesAction', () => {
            test('should join lines and insert space if necessary', function () {
                testCodeEditor_1.withTestCodeEditor([
                    'hello',
                    'world',
                    'hello ',
                    'world',
                    'hello		',
                    '	world',
                    'hello   ',
                    '	world',
                    '',
                    '',
                    'hello world'
                ], {}, (editor) => {
                    let model = editor.getModel();
                    let joinLinesAction = new linesOperations_1.JoinLinesAction();
                    editor.setSelection(new selection_1.Selection(1, 2, 1, 2));
                    joinLinesAction.run(null, editor);
                    assert.equal(model.getLineContent(1), 'hello world', '001');
                    assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(1, 6, 1, 6).toString(), '002');
                    editor.setSelection(new selection_1.Selection(2, 2, 2, 2));
                    joinLinesAction.run(null, editor);
                    assert.equal(model.getLineContent(2), 'hello world', '003');
                    assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(2, 7, 2, 7).toString(), '004');
                    editor.setSelection(new selection_1.Selection(3, 2, 3, 2));
                    joinLinesAction.run(null, editor);
                    assert.equal(model.getLineContent(3), 'hello world', '005');
                    assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(3, 7, 3, 7).toString(), '006');
                    editor.setSelection(new selection_1.Selection(4, 2, 5, 3));
                    joinLinesAction.run(null, editor);
                    assert.equal(model.getLineContent(4), 'hello world', '007');
                    assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(4, 2, 4, 8).toString(), '008');
                    editor.setSelection(new selection_1.Selection(5, 1, 7, 3));
                    joinLinesAction.run(null, editor);
                    assert.equal(model.getLineContent(5), 'hello world', '009');
                    assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(5, 1, 5, 3).toString(), '010');
                });
            });
            test('#50471 Join lines at the end of document', function () {
                testCodeEditor_1.withTestCodeEditor([
                    'hello',
                    'world'
                ], {}, (editor) => {
                    let model = editor.getModel();
                    let joinLinesAction = new linesOperations_1.JoinLinesAction();
                    editor.setSelection(new selection_1.Selection(2, 1, 2, 1));
                    joinLinesAction.run(null, editor);
                    assert.equal(model.getLineContent(1), 'hello', '001');
                    assert.equal(model.getLineContent(2), 'world', '002');
                    assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(2, 6, 2, 6).toString(), '003');
                });
            });
            test('should work in multi cursor mode', function () {
                testCodeEditor_1.withTestCodeEditor([
                    'hello',
                    'world',
                    'hello ',
                    'world',
                    'hello		',
                    '	world',
                    'hello   ',
                    '	world',
                    '',
                    '',
                    'hello world'
                ], {}, (editor) => {
                    let model = editor.getModel();
                    let joinLinesAction = new linesOperations_1.JoinLinesAction();
                    editor.setSelections([
                        /** primary cursor */
                        new selection_1.Selection(5, 2, 5, 2),
                        new selection_1.Selection(1, 2, 1, 2),
                        new selection_1.Selection(3, 2, 4, 2),
                        new selection_1.Selection(5, 4, 6, 3),
                        new selection_1.Selection(7, 5, 8, 4),
                        new selection_1.Selection(10, 1, 10, 1)
                    ]);
                    joinLinesAction.run(null, editor);
                    assert.equal(model.getLinesContent().join('\n'), 'hello world\nhello world\nhello world\nhello world\n\nhello world', '001');
                    assert.deepEqual(editor.getSelections().toString(), [
                        /** primary cursor */
                        new selection_1.Selection(3, 4, 3, 8),
                        new selection_1.Selection(1, 6, 1, 6),
                        new selection_1.Selection(2, 2, 2, 8),
                        new selection_1.Selection(4, 5, 4, 9),
                        new selection_1.Selection(6, 1, 6, 1)
                    ].toString(), '002');
                    /** primary cursor */
                    assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(3, 4, 3, 8).toString(), '003');
                });
            });
            test('should push undo stop', function () {
                testCodeEditor_1.withTestCodeEditor([
                    'hello',
                    'world'
                ], {}, (editor) => {
                    let model = editor.getModel();
                    let joinLinesAction = new linesOperations_1.JoinLinesAction();
                    editor.setSelection(new selection_1.Selection(1, 6, 1, 6));
                    editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: ' my dear' });
                    assert.equal(model.getLineContent(1), 'hello my dear');
                    assert.deepEqual(editor.getSelection(), new selection_1.Selection(1, 14, 1, 14));
                    joinLinesAction.run(null, editor);
                    assert.equal(model.getLineContent(1), 'hello my dear world');
                    assert.deepEqual(editor.getSelection(), new selection_1.Selection(1, 14, 1, 14));
                    editor.trigger('keyboard', editorCommon_1.Handler.Undo, {});
                    assert.equal(model.getLineContent(1), 'hello my dear');
                    assert.deepEqual(editor.getSelection(), new selection_1.Selection(1, 14, 1, 14));
                });
            });
        });
        test('transpose', () => {
            testCodeEditor_1.withTestCodeEditor([
                'hello world',
                '',
                '',
                '   ',
            ], {}, (editor) => {
                let model = editor.getModel();
                let transposeAction = new linesOperations_1.TransposeAction();
                editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                transposeAction.run(null, editor);
                assert.equal(model.getLineContent(1), 'hello world', '001');
                assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(1, 2, 1, 2).toString(), '002');
                editor.setSelection(new selection_1.Selection(1, 6, 1, 6));
                transposeAction.run(null, editor);
                assert.equal(model.getLineContent(1), 'hell oworld', '003');
                assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(1, 7, 1, 7).toString(), '004');
                editor.setSelection(new selection_1.Selection(1, 12, 1, 12));
                transposeAction.run(null, editor);
                assert.equal(model.getLineContent(1), 'hell oworl', '005');
                assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(2, 2, 2, 2).toString(), '006');
                editor.setSelection(new selection_1.Selection(3, 1, 3, 1));
                transposeAction.run(null, editor);
                assert.equal(model.getLineContent(3), '', '007');
                assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(4, 1, 4, 1).toString(), '008');
                editor.setSelection(new selection_1.Selection(4, 2, 4, 2));
                transposeAction.run(null, editor);
                assert.equal(model.getLineContent(4), '   ', '009');
                assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(4, 3, 4, 3).toString(), '010');
            });
            // fix #16633
            testCodeEditor_1.withTestCodeEditor([
                '',
                '',
                'hello',
                'world',
                '',
                'hello world',
                '',
                'hello world'
            ], {}, (editor) => {
                let model = editor.getModel();
                let transposeAction = new linesOperations_1.TransposeAction();
                editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                transposeAction.run(null, editor);
                assert.equal(model.getLineContent(2), '', '011');
                assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(2, 1, 2, 1).toString(), '012');
                editor.setSelection(new selection_1.Selection(3, 6, 3, 6));
                transposeAction.run(null, editor);
                assert.equal(model.getLineContent(4), 'oworld', '013');
                assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(4, 2, 4, 2).toString(), '014');
                editor.setSelection(new selection_1.Selection(6, 12, 6, 12));
                transposeAction.run(null, editor);
                assert.equal(model.getLineContent(7), 'd', '015');
                assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(7, 2, 7, 2).toString(), '016');
                editor.setSelection(new selection_1.Selection(8, 12, 8, 12));
                transposeAction.run(null, editor);
                assert.equal(model.getLineContent(8), 'hello world', '019');
                assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(8, 12, 8, 12).toString(), '020');
            });
        });
        test('toggle case', function () {
            testCodeEditor_1.withTestCodeEditor([
                'hello world',
                'öçşğü'
            ], {}, (editor) => {
                let model = editor.getModel();
                let uppercaseAction = new linesOperations_1.UpperCaseAction();
                let lowercaseAction = new linesOperations_1.LowerCaseAction();
                let titlecaseAction = new linesOperations_1.TitleCaseAction();
                editor.setSelection(new selection_1.Selection(1, 1, 1, 12));
                uppercaseAction.run(null, editor);
                assert.equal(model.getLineContent(1), 'HELLO WORLD', '001');
                assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(1, 1, 1, 12).toString(), '002');
                editor.setSelection(new selection_1.Selection(1, 1, 1, 12));
                lowercaseAction.run(null, editor);
                assert.equal(model.getLineContent(1), 'hello world', '003');
                assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(1, 1, 1, 12).toString(), '004');
                editor.setSelection(new selection_1.Selection(1, 3, 1, 3));
                uppercaseAction.run(null, editor);
                assert.equal(model.getLineContent(1), 'HELLO world', '005');
                assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(1, 3, 1, 3).toString(), '006');
                editor.setSelection(new selection_1.Selection(1, 4, 1, 4));
                lowercaseAction.run(null, editor);
                assert.equal(model.getLineContent(1), 'hello world', '007');
                assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(1, 4, 1, 4).toString(), '008');
                editor.setSelection(new selection_1.Selection(1, 1, 1, 12));
                titlecaseAction.run(null, editor);
                assert.equal(model.getLineContent(1), 'Hello World', '009');
                assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(1, 1, 1, 12).toString(), '010');
                editor.setSelection(new selection_1.Selection(2, 1, 2, 6));
                uppercaseAction.run(null, editor);
                assert.equal(model.getLineContent(2), 'ÖÇŞĞÜ', '011');
                assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(2, 1, 2, 6).toString(), '012');
                editor.setSelection(new selection_1.Selection(2, 1, 2, 6));
                lowercaseAction.run(null, editor);
                assert.equal(model.getLineContent(2), 'öçşğü', '013');
                assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(2, 1, 2, 6).toString(), '014');
                editor.setSelection(new selection_1.Selection(2, 1, 2, 6));
                titlecaseAction.run(null, editor);
                assert.equal(model.getLineContent(2), 'Öçşğü', '015');
                assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(2, 1, 2, 6).toString(), '016');
            });
            testCodeEditor_1.withTestCodeEditor([
                'foO baR BaZ',
                'foO\'baR\'BaZ',
                'foO[baR]BaZ',
                'foO`baR~BaZ',
                'foO^baR%BaZ',
                'foO$baR!BaZ'
            ], {}, (editor) => {
                let model = editor.getModel();
                let titlecaseAction = new linesOperations_1.TitleCaseAction();
                editor.setSelection(new selection_1.Selection(1, 1, 1, 12));
                titlecaseAction.run(null, editor);
                assert.equal(model.getLineContent(1), 'Foo Bar Baz');
                editor.setSelection(new selection_1.Selection(2, 1, 2, 12));
                titlecaseAction.run(null, editor);
                assert.equal(model.getLineContent(2), 'Foo\'Bar\'Baz');
                editor.setSelection(new selection_1.Selection(3, 1, 3, 12));
                titlecaseAction.run(null, editor);
                assert.equal(model.getLineContent(3), 'Foo[Bar]Baz');
                editor.setSelection(new selection_1.Selection(4, 1, 4, 12));
                titlecaseAction.run(null, editor);
                assert.equal(model.getLineContent(4), 'Foo`Bar~Baz');
                editor.setSelection(new selection_1.Selection(5, 1, 5, 12));
                titlecaseAction.run(null, editor);
                assert.equal(model.getLineContent(5), 'Foo^Bar%Baz');
                editor.setSelection(new selection_1.Selection(6, 1, 6, 12));
                titlecaseAction.run(null, editor);
                assert.equal(model.getLineContent(6), 'Foo$Bar!Baz');
            });
            testCodeEditor_1.withTestCodeEditor([
                '',
                '   '
            ], {}, (editor) => {
                let model = editor.getModel();
                let uppercaseAction = new linesOperations_1.UpperCaseAction();
                let lowercaseAction = new linesOperations_1.LowerCaseAction();
                editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                uppercaseAction.run(null, editor);
                assert.equal(model.getLineContent(1), '', '013');
                assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(1, 1, 1, 1).toString(), '014');
                editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                lowercaseAction.run(null, editor);
                assert.equal(model.getLineContent(1), '', '015');
                assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(1, 1, 1, 1).toString(), '016');
                editor.setSelection(new selection_1.Selection(2, 2, 2, 2));
                uppercaseAction.run(null, editor);
                assert.equal(model.getLineContent(2), '   ', '017');
                assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(2, 2, 2, 2).toString(), '018');
                editor.setSelection(new selection_1.Selection(2, 2, 2, 2));
                lowercaseAction.run(null, editor);
                assert.equal(model.getLineContent(2), '   ', '019');
                assert.deepEqual(editor.getSelection().toString(), new selection_1.Selection(2, 2, 2, 2).toString(), '020');
            });
        });
        suite('DeleteAllRightAction', () => {
            test('should be noop on empty', () => {
                testCodeEditor_1.withTestCodeEditor([''], {}, (editor) => {
                    const model = editor.getModel();
                    const action = new linesOperations_1.DeleteAllRightAction();
                    action.run(null, editor);
                    assert.deepEqual(model.getLinesContent(), ['']);
                    assert.deepEqual(editor.getSelections(), [new selection_1.Selection(1, 1, 1, 1)]);
                    editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                    action.run(null, editor);
                    assert.deepEqual(model.getLinesContent(), ['']);
                    assert.deepEqual(editor.getSelections(), [new selection_1.Selection(1, 1, 1, 1)]);
                    editor.setSelections([new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(1, 1, 1, 1)]);
                    action.run(null, editor);
                    assert.deepEqual(model.getLinesContent(), ['']);
                    assert.deepEqual(editor.getSelections(), [new selection_1.Selection(1, 1, 1, 1)]);
                });
            });
            test('should delete selected range', () => {
                testCodeEditor_1.withTestCodeEditor([
                    'hello',
                    'world'
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const action = new linesOperations_1.DeleteAllRightAction();
                    editor.setSelection(new selection_1.Selection(1, 2, 1, 5));
                    action.run(null, editor);
                    assert.deepEqual(model.getLinesContent(), ['ho', 'world']);
                    assert.deepEqual(editor.getSelections(), [new selection_1.Selection(1, 2, 1, 2)]);
                    editor.setSelection(new selection_1.Selection(1, 1, 2, 4));
                    action.run(null, editor);
                    assert.deepEqual(model.getLinesContent(), ['ld']);
                    assert.deepEqual(editor.getSelections(), [new selection_1.Selection(1, 1, 1, 1)]);
                    editor.setSelection(new selection_1.Selection(1, 1, 1, 3));
                    action.run(null, editor);
                    assert.deepEqual(model.getLinesContent(), ['']);
                    assert.deepEqual(editor.getSelections(), [new selection_1.Selection(1, 1, 1, 1)]);
                });
            });
            test('should delete to the right of the cursor', () => {
                testCodeEditor_1.withTestCodeEditor([
                    'hello',
                    'world'
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const action = new linesOperations_1.DeleteAllRightAction();
                    editor.setSelection(new selection_1.Selection(1, 3, 1, 3));
                    action.run(null, editor);
                    assert.deepEqual(model.getLinesContent(), ['he', 'world']);
                    assert.deepEqual(editor.getSelections(), [new selection_1.Selection(1, 3, 1, 3)]);
                    editor.setSelection(new selection_1.Selection(2, 1, 2, 1));
                    action.run(null, editor);
                    assert.deepEqual(model.getLinesContent(), ['he', '']);
                    assert.deepEqual(editor.getSelections(), [new selection_1.Selection(2, 1, 2, 1)]);
                });
            });
            test('should join two lines, if at the end of the line', () => {
                testCodeEditor_1.withTestCodeEditor([
                    'hello',
                    'world'
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const action = new linesOperations_1.DeleteAllRightAction();
                    editor.setSelection(new selection_1.Selection(1, 6, 1, 6));
                    action.run(null, editor);
                    assert.deepEqual(model.getLinesContent(), ['helloworld']);
                    assert.deepEqual(editor.getSelections(), [new selection_1.Selection(1, 6, 1, 6)]);
                    editor.setSelection(new selection_1.Selection(1, 6, 1, 6));
                    action.run(null, editor);
                    assert.deepEqual(model.getLinesContent(), ['hello']);
                    assert.deepEqual(editor.getSelections(), [new selection_1.Selection(1, 6, 1, 6)]);
                    editor.setSelection(new selection_1.Selection(1, 6, 1, 6));
                    action.run(null, editor);
                    assert.deepEqual(model.getLinesContent(), ['hello']);
                    assert.deepEqual(editor.getSelections(), [new selection_1.Selection(1, 6, 1, 6)]);
                });
            });
            test('should work with multiple cursors', () => {
                testCodeEditor_1.withTestCodeEditor([
                    'hello',
                    'there',
                    'world'
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const action = new linesOperations_1.DeleteAllRightAction();
                    editor.setSelections([
                        new selection_1.Selection(1, 3, 1, 3),
                        new selection_1.Selection(1, 6, 1, 6),
                        new selection_1.Selection(3, 4, 3, 4),
                    ]);
                    action.run(null, editor);
                    assert.deepEqual(model.getLinesContent(), ['hethere', 'wor']);
                    assert.deepEqual(editor.getSelections(), [
                        new selection_1.Selection(1, 3, 1, 3),
                        new selection_1.Selection(2, 4, 2, 4)
                    ]);
                    action.run(null, editor);
                    assert.deepEqual(model.getLinesContent(), ['he', 'wor']);
                    assert.deepEqual(editor.getSelections(), [
                        new selection_1.Selection(1, 3, 1, 3),
                        new selection_1.Selection(2, 4, 2, 4)
                    ]);
                    action.run(null, editor);
                    assert.deepEqual(model.getLinesContent(), ['hewor']);
                    assert.deepEqual(editor.getSelections(), [
                        new selection_1.Selection(1, 3, 1, 3),
                        new selection_1.Selection(1, 6, 1, 6)
                    ]);
                    action.run(null, editor);
                    assert.deepEqual(model.getLinesContent(), ['he']);
                    assert.deepEqual(editor.getSelections(), [
                        new selection_1.Selection(1, 3, 1, 3)
                    ]);
                    action.run(null, editor);
                    assert.deepEqual(model.getLinesContent(), ['he']);
                    assert.deepEqual(editor.getSelections(), [
                        new selection_1.Selection(1, 3, 1, 3)
                    ]);
                });
            });
            test('should work with undo/redo', () => {
                testCodeEditor_1.withTestCodeEditor([
                    'hello',
                    'there',
                    'world'
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const action = new linesOperations_1.DeleteAllRightAction();
                    editor.setSelections([
                        new selection_1.Selection(1, 3, 1, 3),
                        new selection_1.Selection(1, 6, 1, 6),
                        new selection_1.Selection(3, 4, 3, 4),
                    ]);
                    action.run(null, editor);
                    assert.deepEqual(model.getLinesContent(), ['hethere', 'wor']);
                    assert.deepEqual(editor.getSelections(), [
                        new selection_1.Selection(1, 3, 1, 3),
                        new selection_1.Selection(2, 4, 2, 4)
                    ]);
                    editor.trigger('tests', editorCommon_1.Handler.Undo, {});
                    assert.deepEqual(editor.getSelections(), [
                        new selection_1.Selection(1, 3, 1, 3),
                        new selection_1.Selection(1, 6, 1, 6),
                        new selection_1.Selection(3, 4, 3, 4)
                    ]);
                    editor.trigger('tests', editorCommon_1.Handler.Redo, {});
                    assert.deepEqual(editor.getSelections(), [
                        new selection_1.Selection(1, 3, 1, 3),
                        new selection_1.Selection(2, 4, 2, 4)
                    ]);
                });
            });
        });
        test('InsertLineBeforeAction', () => {
            function testInsertLineBefore(lineNumber, column, callback) {
                const TEXT = [
                    'First line',
                    'Second line',
                    'Third line'
                ];
                testCodeEditor_1.withTestCodeEditor(TEXT, {}, (editor, cursor) => {
                    editor.setPosition(new position_1.Position(lineNumber, column));
                    let insertLineBeforeAction = new linesOperations_1.InsertLineBeforeAction();
                    insertLineBeforeAction.run(null, editor);
                    callback(editor.getModel(), cursor);
                });
            }
            testInsertLineBefore(1, 3, (model, cursor) => {
                assert.deepEqual(cursor.getSelection(), new selection_1.Selection(1, 1, 1, 1));
                assert.equal(model.getLineContent(1), '');
                assert.equal(model.getLineContent(2), 'First line');
                assert.equal(model.getLineContent(3), 'Second line');
                assert.equal(model.getLineContent(4), 'Third line');
            });
            testInsertLineBefore(2, 3, (model, cursor) => {
                assert.deepEqual(cursor.getSelection(), new selection_1.Selection(2, 1, 2, 1));
                assert.equal(model.getLineContent(1), 'First line');
                assert.equal(model.getLineContent(2), '');
                assert.equal(model.getLineContent(3), 'Second line');
                assert.equal(model.getLineContent(4), 'Third line');
            });
            testInsertLineBefore(3, 3, (model, cursor) => {
                assert.deepEqual(cursor.getSelection(), new selection_1.Selection(3, 1, 3, 1));
                assert.equal(model.getLineContent(1), 'First line');
                assert.equal(model.getLineContent(2), 'Second line');
                assert.equal(model.getLineContent(3), '');
                assert.equal(model.getLineContent(4), 'Third line');
            });
        });
        test('InsertLineAfterAction', () => {
            function testInsertLineAfter(lineNumber, column, callback) {
                const TEXT = [
                    'First line',
                    'Second line',
                    'Third line'
                ];
                testCodeEditor_1.withTestCodeEditor(TEXT, {}, (editor, cursor) => {
                    editor.setPosition(new position_1.Position(lineNumber, column));
                    let insertLineAfterAction = new linesOperations_1.InsertLineAfterAction();
                    insertLineAfterAction.run(null, editor);
                    callback(editor.getModel(), cursor);
                });
            }
            testInsertLineAfter(1, 3, (model, cursor) => {
                assert.deepEqual(cursor.getSelection(), new selection_1.Selection(2, 1, 2, 1));
                assert.equal(model.getLineContent(1), 'First line');
                assert.equal(model.getLineContent(2), '');
                assert.equal(model.getLineContent(3), 'Second line');
                assert.equal(model.getLineContent(4), 'Third line');
            });
            testInsertLineAfter(2, 3, (model, cursor) => {
                assert.deepEqual(cursor.getSelection(), new selection_1.Selection(3, 1, 3, 1));
                assert.equal(model.getLineContent(1), 'First line');
                assert.equal(model.getLineContent(2), 'Second line');
                assert.equal(model.getLineContent(3), '');
                assert.equal(model.getLineContent(4), 'Third line');
            });
            testInsertLineAfter(3, 3, (model, cursor) => {
                assert.deepEqual(cursor.getSelection(), new selection_1.Selection(4, 1, 4, 1));
                assert.equal(model.getLineContent(1), 'First line');
                assert.equal(model.getLineContent(2), 'Second line');
                assert.equal(model.getLineContent(3), 'Third line');
                assert.equal(model.getLineContent(4), '');
            });
        });
        test('Bug 18276:[editor] Indentation broken when selection is empty', () => {
            let model = editorTestUtils_1.createTextModel([
                'function baz() {'
            ].join('\n'), {
                insertSpaces: false,
            });
            testCodeEditor_1.withTestCodeEditor(null, { model: model }, (editor) => {
                let indentLinesAction = new linesOperations_1.IndentLinesAction();
                editor.setPosition(new position_1.Position(1, 2));
                indentLinesAction.run(null, editor);
                assert.equal(model.getLineContent(1), '\tfunction baz() {');
                assert.deepEqual(editor.getSelection(), new selection_1.Selection(1, 3, 1, 3));
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.equal(model.getLineContent(1), '\tf\tunction baz() {');
            });
            model.dispose();
        });
        test('issue #80736: Indenting while the cursor is at the start of a line of text causes the added spaces or tab to be selected', () => {
            const model = editorTestUtils_1.createTextModel([
                'Some text'
            ].join('\n'), {
                insertSpaces: false,
            });
            testCodeEditor_1.withTestCodeEditor(null, { model: model }, (editor) => {
                const indentLinesAction = new linesOperations_1.IndentLinesAction();
                editor.setPosition(new position_1.Position(1, 1));
                indentLinesAction.run(null, editor);
                assert.equal(model.getLineContent(1), '\tSome text');
                assert.deepEqual(editor.getSelection(), new selection_1.Selection(1, 2, 1, 2));
            });
            model.dispose();
        });
        test('issue #62112: Delete line does not work properly when multiple cursors are on line', () => {
            const TEXT = [
                'a',
                'foo boo',
                'too',
                'c',
            ];
            testCodeEditor_1.withTestCodeEditor(TEXT, {}, (editor) => {
                editor.setSelections([
                    new selection_1.Selection(2, 4, 2, 4),
                    new selection_1.Selection(2, 8, 2, 8),
                    new selection_1.Selection(3, 4, 3, 4),
                ]);
                const deleteLinesAction = new linesOperations_1.DeleteLinesAction();
                deleteLinesAction.run(null, editor);
                assert.equal(editor.getValue(), 'a\nc');
            });
        });
        function testDeleteLinesCommand(initialText, _initialSelections, resultingText, _resultingSelections) {
            const initialSelections = Array.isArray(_initialSelections) ? _initialSelections : [_initialSelections];
            const resultingSelections = Array.isArray(_resultingSelections) ? _resultingSelections : [_resultingSelections];
            testCodeEditor_1.withTestCodeEditor(initialText, {}, (editor) => {
                editor.setSelections(initialSelections);
                const deleteLinesAction = new linesOperations_1.DeleteLinesAction();
                deleteLinesAction.run(null, editor);
                assert.equal(editor.getValue(), resultingText.join('\n'));
                assert.deepEqual(editor.getSelections(), resultingSelections);
            });
        }
        test('empty selection in middle of lines', function () {
            testDeleteLinesCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 3, 2, 3), [
                'first',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 3, 2, 3));
        });
        test('empty selection at top of lines', function () {
            testDeleteLinesCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 5, 1, 5), [
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 5, 1, 5));
        });
        test('empty selection at end of lines', function () {
            testDeleteLinesCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(5, 2, 5, 2), [
                'first',
                'second line',
                'third line',
                'fourth line'
            ], new selection_1.Selection(4, 2, 4, 2));
        });
        test('with selection in middle of lines', function () {
            testDeleteLinesCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(3, 3, 2, 2), [
                'first',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 2, 2, 2));
        });
        test('with selection at top of lines', function () {
            testDeleteLinesCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 4, 1, 5), [
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 5, 1, 5));
        });
        test('with selection at end of lines', function () {
            testDeleteLinesCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(5, 1, 5, 2), [
                'first',
                'second line',
                'third line',
                'fourth line'
            ], new selection_1.Selection(4, 2, 4, 2));
        });
        test('with full line selection in middle of lines', function () {
            testDeleteLinesCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(4, 1, 2, 1), [
                'first',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 1, 2, 1));
        });
        test('with full line selection at top of lines', function () {
            testDeleteLinesCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 1, 1, 5), [
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 5, 1, 5));
        });
        test('with full line selection at end of lines', function () {
            testDeleteLinesCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(4, 1, 5, 2), [
                'first',
                'second line',
                'third line'
            ], new selection_1.Selection(3, 2, 3, 2));
        });
        test('multicursor 1', function () {
            testDeleteLinesCommand([
                'class P {',
                '',
                '    getA() {',
                '        if (true) {',
                '            return "a";',
                '        }',
                '    }',
                '',
                '    getB() {',
                '        if (true) {',
                '            return "b";',
                '        }',
                '    }',
                '',
                '    getC() {',
                '        if (true) {',
                '            return "c";',
                '        }',
                '    }',
                '}',
            ], [
                new selection_1.Selection(4, 1, 5, 1),
                new selection_1.Selection(10, 1, 11, 1),
                new selection_1.Selection(16, 1, 17, 1),
            ], [
                'class P {',
                '',
                '    getA() {',
                '            return "a";',
                '        }',
                '    }',
                '',
                '    getB() {',
                '            return "b";',
                '        }',
                '    }',
                '',
                '    getC() {',
                '            return "c";',
                '        }',
                '    }',
                '}',
            ], [
                new selection_1.Selection(4, 1, 4, 1),
                new selection_1.Selection(9, 1, 9, 1),
                new selection_1.Selection(14, 1, 14, 1),
            ]);
        });
    });
});
//# sourceMappingURL=linesOperations.test.js.map