define(["require", "exports", "assert", "vs/base/common/event", "vs/editor/common/core/selection", "vs/editor/common/editorCommon", "vs/editor/contrib/find/findController", "vs/editor/contrib/multicursor/multicursor", "vs/editor/test/browser/testCodeEditor", "vs/platform/instantiation/common/serviceCollection", "vs/platform/storage/common/storage"], function (require, exports, assert, event_1, selection_1, editorCommon_1, findController_1, multicursor_1, testCodeEditor_1, serviceCollection_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Multicursor', () => {
        test('issue #2205: Multi-cursor pastes in reverse order', () => {
            testCodeEditor_1.withTestCodeEditor([
                'abc',
                'def'
            ], {}, (editor, cursor) => {
                let addCursorUpAction = new multicursor_1.InsertCursorAbove();
                editor.setSelection(new selection_1.Selection(2, 1, 2, 1));
                addCursorUpAction.run(null, editor, {});
                assert.equal(cursor.getSelections().length, 2);
                editor.trigger('test', editorCommon_1.Handler.Paste, {
                    text: '1\n2',
                    multicursorText: [
                        '1',
                        '2'
                    ]
                });
                // cursorCommand(cursor, H.Paste, { text: '1\n2' });
                assert.equal(editor.getModel().getLineContent(1), '1abc');
                assert.equal(editor.getModel().getLineContent(2), '2def');
            });
        });
        test('issue #1336: Insert cursor below on last line adds a cursor to the end of the current line', () => {
            testCodeEditor_1.withTestCodeEditor([
                'abc'
            ], {}, (editor, cursor) => {
                let addCursorDownAction = new multicursor_1.InsertCursorBelow();
                addCursorDownAction.run(null, editor, {});
                assert.equal(cursor.getSelections().length, 1);
            });
        });
    });
    function fromRange(rng) {
        return [rng.startLineNumber, rng.startColumn, rng.endLineNumber, rng.endColumn];
    }
    suite('Multicursor selection', () => {
        let queryState = {};
        let serviceCollection = new serviceCollection_1.ServiceCollection();
        serviceCollection.set(storage_1.IStorageService, {
            _serviceBrand: undefined,
            onDidChangeStorage: event_1.Event.None,
            onWillSaveState: event_1.Event.None,
            get: (key) => queryState[key],
            getBoolean: (key) => !!queryState[key],
            getNumber: (key) => undefined,
            store: (key, value) => { queryState[key] = value; return Promise.resolve(); },
            remove: (key) => undefined,
            logStorage: () => undefined,
            migrate: (toWorkspace) => Promise.resolve(undefined)
        });
        test('issue #8817: Cursor position changes when you cancel multicursor', () => {
            testCodeEditor_1.withTestCodeEditor([
                'var x = (3 * 5)',
                'var y = (3 * 5)',
                'var z = (3 * 5)',
            ], { serviceCollection: serviceCollection }, (editor, cursor) => {
                let findController = editor.registerAndInstantiateContribution(findController_1.CommonFindController.ID, findController_1.CommonFindController);
                let multiCursorSelectController = editor.registerAndInstantiateContribution(multicursor_1.MultiCursorSelectionController.ID, multicursor_1.MultiCursorSelectionController);
                let selectHighlightsAction = new multicursor_1.SelectHighlightsAction();
                editor.setSelection(new selection_1.Selection(2, 9, 2, 16));
                selectHighlightsAction.run(null, editor);
                assert.deepEqual(editor.getSelections().map(fromRange), [
                    [2, 9, 2, 16],
                    [1, 9, 1, 16],
                    [3, 9, 3, 16],
                ]);
                editor.trigger('test', 'removeSecondaryCursors', null);
                assert.deepEqual(fromRange(editor.getSelection()), [2, 9, 2, 16]);
                multiCursorSelectController.dispose();
                findController.dispose();
            });
        });
        test('issue #5400: "Select All Occurrences of Find Match" does not select all if find uses regex', () => {
            testCodeEditor_1.withTestCodeEditor([
                'something',
                'someething',
                'someeething',
                'nothing'
            ], { serviceCollection: serviceCollection }, (editor, cursor) => {
                let findController = editor.registerAndInstantiateContribution(findController_1.CommonFindController.ID, findController_1.CommonFindController);
                let multiCursorSelectController = editor.registerAndInstantiateContribution(multicursor_1.MultiCursorSelectionController.ID, multicursor_1.MultiCursorSelectionController);
                let selectHighlightsAction = new multicursor_1.SelectHighlightsAction();
                editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                findController.getState().change({ searchString: 'some+thing', isRegex: true, isRevealed: true }, false);
                selectHighlightsAction.run(null, editor);
                assert.deepEqual(editor.getSelections().map(fromRange), [
                    [1, 1, 1, 10],
                    [2, 1, 2, 11],
                    [3, 1, 3, 12],
                ]);
                assert.equal(findController.getState().searchString, 'some+thing');
                multiCursorSelectController.dispose();
                findController.dispose();
            });
        });
        test('AddSelectionToNextFindMatchAction can work with multiline', () => {
            testCodeEditor_1.withTestCodeEditor([
                '',
                'qwe',
                'rty',
                '',
                'qwe',
                '',
                'rty',
                'qwe',
                'rty'
            ], { serviceCollection: serviceCollection }, (editor, cursor) => {
                let findController = editor.registerAndInstantiateContribution(findController_1.CommonFindController.ID, findController_1.CommonFindController);
                let multiCursorSelectController = editor.registerAndInstantiateContribution(multicursor_1.MultiCursorSelectionController.ID, multicursor_1.MultiCursorSelectionController);
                let addSelectionToNextFindMatch = new multicursor_1.AddSelectionToNextFindMatchAction();
                editor.setSelection(new selection_1.Selection(2, 1, 3, 4));
                addSelectionToNextFindMatch.run(null, editor);
                assert.deepEqual(editor.getSelections().map(fromRange), [
                    [2, 1, 3, 4],
                    [8, 1, 9, 4]
                ]);
                editor.trigger('test', 'removeSecondaryCursors', null);
                assert.deepEqual(fromRange(editor.getSelection()), [2, 1, 3, 4]);
                multiCursorSelectController.dispose();
                findController.dispose();
            });
        });
        test('issue #6661: AddSelectionToNextFindMatchAction can work with touching ranges', () => {
            testCodeEditor_1.withTestCodeEditor([
                'abcabc',
                'abc',
                'abcabc',
            ], { serviceCollection: serviceCollection }, (editor, cursor) => {
                let findController = editor.registerAndInstantiateContribution(findController_1.CommonFindController.ID, findController_1.CommonFindController);
                let multiCursorSelectController = editor.registerAndInstantiateContribution(multicursor_1.MultiCursorSelectionController.ID, multicursor_1.MultiCursorSelectionController);
                let addSelectionToNextFindMatch = new multicursor_1.AddSelectionToNextFindMatchAction();
                editor.setSelection(new selection_1.Selection(1, 1, 1, 4));
                addSelectionToNextFindMatch.run(null, editor);
                assert.deepEqual(editor.getSelections().map(fromRange), [
                    [1, 1, 1, 4],
                    [1, 4, 1, 7]
                ]);
                addSelectionToNextFindMatch.run(null, editor);
                addSelectionToNextFindMatch.run(null, editor);
                addSelectionToNextFindMatch.run(null, editor);
                assert.deepEqual(editor.getSelections().map(fromRange), [
                    [1, 1, 1, 4],
                    [1, 4, 1, 7],
                    [2, 1, 2, 4],
                    [3, 1, 3, 4],
                    [3, 4, 3, 7]
                ]);
                editor.trigger('test', editorCommon_1.Handler.Type, { text: 'z' });
                assert.deepEqual(editor.getSelections().map(fromRange), [
                    [1, 2, 1, 2],
                    [1, 3, 1, 3],
                    [2, 2, 2, 2],
                    [3, 2, 3, 2],
                    [3, 3, 3, 3]
                ]);
                assert.equal(editor.getValue(), [
                    'zz',
                    'z',
                    'zz',
                ].join('\n'));
                multiCursorSelectController.dispose();
                findController.dispose();
            });
        });
        test('issue #23541: Multiline Ctrl+D does not work in CRLF files', () => {
            testCodeEditor_1.withTestCodeEditor([
                '',
                'qwe',
                'rty',
                '',
                'qwe',
                '',
                'rty',
                'qwe',
                'rty'
            ], { serviceCollection: serviceCollection }, (editor, cursor) => {
                editor.getModel().setEOL(1 /* CRLF */);
                let findController = editor.registerAndInstantiateContribution(findController_1.CommonFindController.ID, findController_1.CommonFindController);
                let multiCursorSelectController = editor.registerAndInstantiateContribution(multicursor_1.MultiCursorSelectionController.ID, multicursor_1.MultiCursorSelectionController);
                let addSelectionToNextFindMatch = new multicursor_1.AddSelectionToNextFindMatchAction();
                editor.setSelection(new selection_1.Selection(2, 1, 3, 4));
                addSelectionToNextFindMatch.run(null, editor);
                assert.deepEqual(editor.getSelections().map(fromRange), [
                    [2, 1, 3, 4],
                    [8, 1, 9, 4]
                ]);
                editor.trigger('test', 'removeSecondaryCursors', null);
                assert.deepEqual(fromRange(editor.getSelection()), [2, 1, 3, 4]);
                multiCursorSelectController.dispose();
                findController.dispose();
            });
        });
        function testMulticursor(text, callback) {
            testCodeEditor_1.withTestCodeEditor(text, { serviceCollection: serviceCollection }, (editor, cursor) => {
                let findController = editor.registerAndInstantiateContribution(findController_1.CommonFindController.ID, findController_1.CommonFindController);
                let multiCursorSelectController = editor.registerAndInstantiateContribution(multicursor_1.MultiCursorSelectionController.ID, multicursor_1.MultiCursorSelectionController);
                callback(editor, findController);
                multiCursorSelectController.dispose();
                findController.dispose();
            });
        }
        function testAddSelectionToNextFindMatchAction(text, callback) {
            testMulticursor(text, (editor, findController) => {
                let action = new multicursor_1.AddSelectionToNextFindMatchAction();
                callback(editor, action, findController);
            });
        }
        test('AddSelectionToNextFindMatchAction starting with single collapsed selection', () => {
            const text = [
                'abc pizza',
                'abc house',
                'abc bar'
            ];
            testAddSelectionToNextFindMatchAction(text, (editor, action, findController) => {
                editor.setSelections([
                    new selection_1.Selection(1, 2, 1, 2),
                ]);
                action.run(null, editor);
                assert.deepEqual(editor.getSelections(), [
                    new selection_1.Selection(1, 1, 1, 4),
                ]);
                action.run(null, editor);
                assert.deepEqual(editor.getSelections(), [
                    new selection_1.Selection(1, 1, 1, 4),
                    new selection_1.Selection(2, 1, 2, 4),
                ]);
                action.run(null, editor);
                assert.deepEqual(editor.getSelections(), [
                    new selection_1.Selection(1, 1, 1, 4),
                    new selection_1.Selection(2, 1, 2, 4),
                    new selection_1.Selection(3, 1, 3, 4),
                ]);
                action.run(null, editor);
                assert.deepEqual(editor.getSelections(), [
                    new selection_1.Selection(1, 1, 1, 4),
                    new selection_1.Selection(2, 1, 2, 4),
                    new selection_1.Selection(3, 1, 3, 4),
                ]);
            });
        });
        test('AddSelectionToNextFindMatchAction starting with two selections, one being collapsed 1)', () => {
            const text = [
                'abc pizza',
                'abc house',
                'abc bar'
            ];
            testAddSelectionToNextFindMatchAction(text, (editor, action, findController) => {
                editor.setSelections([
                    new selection_1.Selection(1, 1, 1, 4),
                    new selection_1.Selection(2, 2, 2, 2),
                ]);
                action.run(null, editor);
                assert.deepEqual(editor.getSelections(), [
                    new selection_1.Selection(1, 1, 1, 4),
                    new selection_1.Selection(2, 1, 2, 4),
                ]);
                action.run(null, editor);
                assert.deepEqual(editor.getSelections(), [
                    new selection_1.Selection(1, 1, 1, 4),
                    new selection_1.Selection(2, 1, 2, 4),
                    new selection_1.Selection(3, 1, 3, 4),
                ]);
                action.run(null, editor);
                assert.deepEqual(editor.getSelections(), [
                    new selection_1.Selection(1, 1, 1, 4),
                    new selection_1.Selection(2, 1, 2, 4),
                    new selection_1.Selection(3, 1, 3, 4),
                ]);
            });
        });
        test('AddSelectionToNextFindMatchAction starting with two selections, one being collapsed 2)', () => {
            const text = [
                'abc pizza',
                'abc house',
                'abc bar'
            ];
            testAddSelectionToNextFindMatchAction(text, (editor, action, findController) => {
                editor.setSelections([
                    new selection_1.Selection(1, 2, 1, 2),
                    new selection_1.Selection(2, 1, 2, 4),
                ]);
                action.run(null, editor);
                assert.deepEqual(editor.getSelections(), [
                    new selection_1.Selection(1, 1, 1, 4),
                    new selection_1.Selection(2, 1, 2, 4),
                ]);
                action.run(null, editor);
                assert.deepEqual(editor.getSelections(), [
                    new selection_1.Selection(1, 1, 1, 4),
                    new selection_1.Selection(2, 1, 2, 4),
                    new selection_1.Selection(3, 1, 3, 4),
                ]);
                action.run(null, editor);
                assert.deepEqual(editor.getSelections(), [
                    new selection_1.Selection(1, 1, 1, 4),
                    new selection_1.Selection(2, 1, 2, 4),
                    new selection_1.Selection(3, 1, 3, 4),
                ]);
            });
        });
        test('AddSelectionToNextFindMatchAction starting with all collapsed selections', () => {
            const text = [
                'abc pizza',
                'abc house',
                'abc bar'
            ];
            testAddSelectionToNextFindMatchAction(text, (editor, action, findController) => {
                editor.setSelections([
                    new selection_1.Selection(1, 2, 1, 2),
                    new selection_1.Selection(2, 2, 2, 2),
                    new selection_1.Selection(3, 1, 3, 1),
                ]);
                action.run(null, editor);
                assert.deepEqual(editor.getSelections(), [
                    new selection_1.Selection(1, 1, 1, 4),
                    new selection_1.Selection(2, 1, 2, 4),
                    new selection_1.Selection(3, 1, 3, 4),
                ]);
                action.run(null, editor);
                assert.deepEqual(editor.getSelections(), [
                    new selection_1.Selection(1, 1, 1, 4),
                    new selection_1.Selection(2, 1, 2, 4),
                    new selection_1.Selection(3, 1, 3, 4),
                ]);
            });
        });
        test('AddSelectionToNextFindMatchAction starting with all collapsed selections on different words', () => {
            const text = [
                'abc pizza',
                'abc house',
                'abc bar'
            ];
            testAddSelectionToNextFindMatchAction(text, (editor, action, findController) => {
                editor.setSelections([
                    new selection_1.Selection(1, 6, 1, 6),
                    new selection_1.Selection(2, 6, 2, 6),
                    new selection_1.Selection(3, 6, 3, 6),
                ]);
                action.run(null, editor);
                assert.deepEqual(editor.getSelections(), [
                    new selection_1.Selection(1, 5, 1, 10),
                    new selection_1.Selection(2, 5, 2, 10),
                    new selection_1.Selection(3, 5, 3, 8),
                ]);
                action.run(null, editor);
                assert.deepEqual(editor.getSelections(), [
                    new selection_1.Selection(1, 5, 1, 10),
                    new selection_1.Selection(2, 5, 2, 10),
                    new selection_1.Selection(3, 5, 3, 8),
                ]);
            });
        });
        test('issue #20651: AddSelectionToNextFindMatchAction case insensitive', () => {
            const text = [
                'test',
                'testte',
                'Test',
                'testte',
                'test'
            ];
            testAddSelectionToNextFindMatchAction(text, (editor, action, findController) => {
                editor.setSelections([
                    new selection_1.Selection(1, 1, 1, 5),
                ]);
                action.run(null, editor);
                assert.deepEqual(editor.getSelections(), [
                    new selection_1.Selection(1, 1, 1, 5),
                    new selection_1.Selection(2, 1, 2, 5),
                ]);
                action.run(null, editor);
                assert.deepEqual(editor.getSelections(), [
                    new selection_1.Selection(1, 1, 1, 5),
                    new selection_1.Selection(2, 1, 2, 5),
                    new selection_1.Selection(3, 1, 3, 5),
                ]);
                action.run(null, editor);
                assert.deepEqual(editor.getSelections(), [
                    new selection_1.Selection(1, 1, 1, 5),
                    new selection_1.Selection(2, 1, 2, 5),
                    new selection_1.Selection(3, 1, 3, 5),
                    new selection_1.Selection(4, 1, 4, 5),
                ]);
                action.run(null, editor);
                assert.deepEqual(editor.getSelections(), [
                    new selection_1.Selection(1, 1, 1, 5),
                    new selection_1.Selection(2, 1, 2, 5),
                    new selection_1.Selection(3, 1, 3, 5),
                    new selection_1.Selection(4, 1, 4, 5),
                    new selection_1.Selection(5, 1, 5, 5),
                ]);
                action.run(null, editor);
                assert.deepEqual(editor.getSelections(), [
                    new selection_1.Selection(1, 1, 1, 5),
                    new selection_1.Selection(2, 1, 2, 5),
                    new selection_1.Selection(3, 1, 3, 5),
                    new selection_1.Selection(4, 1, 4, 5),
                    new selection_1.Selection(5, 1, 5, 5),
                ]);
            });
        });
        suite('Find state disassociation', () => {
            const text = [
                'app',
                'apples',
                'whatsapp',
                'app',
                'App',
                ' app'
            ];
            test('enters mode', () => {
                testAddSelectionToNextFindMatchAction(text, (editor, action, findController) => {
                    editor.setSelections([
                        new selection_1.Selection(1, 2, 1, 2),
                    ]);
                    action.run(null, editor);
                    assert.deepEqual(editor.getSelections(), [
                        new selection_1.Selection(1, 1, 1, 4),
                    ]);
                    action.run(null, editor);
                    assert.deepEqual(editor.getSelections(), [
                        new selection_1.Selection(1, 1, 1, 4),
                        new selection_1.Selection(4, 1, 4, 4),
                    ]);
                    action.run(null, editor);
                    assert.deepEqual(editor.getSelections(), [
                        new selection_1.Selection(1, 1, 1, 4),
                        new selection_1.Selection(4, 1, 4, 4),
                        new selection_1.Selection(6, 2, 6, 5),
                    ]);
                });
            });
            test('leaves mode when selection changes', () => {
                testAddSelectionToNextFindMatchAction(text, (editor, action, findController) => {
                    editor.setSelections([
                        new selection_1.Selection(1, 2, 1, 2),
                    ]);
                    action.run(null, editor);
                    assert.deepEqual(editor.getSelections(), [
                        new selection_1.Selection(1, 1, 1, 4),
                    ]);
                    action.run(null, editor);
                    assert.deepEqual(editor.getSelections(), [
                        new selection_1.Selection(1, 1, 1, 4),
                        new selection_1.Selection(4, 1, 4, 4),
                    ]);
                    // change selection
                    editor.setSelections([
                        new selection_1.Selection(1, 1, 1, 4),
                    ]);
                    action.run(null, editor);
                    assert.deepEqual(editor.getSelections(), [
                        new selection_1.Selection(1, 1, 1, 4),
                        new selection_1.Selection(2, 1, 2, 4),
                    ]);
                });
            });
            test('Select Highlights respects mode ', () => {
                testMulticursor(text, (editor, findController) => {
                    let action = new multicursor_1.SelectHighlightsAction();
                    editor.setSelections([
                        new selection_1.Selection(1, 2, 1, 2),
                    ]);
                    action.run(null, editor);
                    assert.deepEqual(editor.getSelections(), [
                        new selection_1.Selection(1, 1, 1, 4),
                        new selection_1.Selection(4, 1, 4, 4),
                        new selection_1.Selection(6, 2, 6, 5),
                    ]);
                    action.run(null, editor);
                    assert.deepEqual(editor.getSelections(), [
                        new selection_1.Selection(1, 1, 1, 4),
                        new selection_1.Selection(4, 1, 4, 4),
                        new selection_1.Selection(6, 2, 6, 5),
                    ]);
                });
            });
        });
    });
});
//# sourceMappingURL=multicursor.test.js.map