/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/event", "vs/base/common/platform", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/contrib/find/findController", "vs/editor/contrib/find/findModel", "vs/editor/test/browser/testCodeEditor", "vs/platform/clipboard/common/clipboardService", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/serviceCollection", "vs/platform/storage/common/storage"], function (require, exports, assert, async_1, event_1, platform, editOperation_1, position_1, range_1, selection_1, findController_1, findModel_1, testCodeEditor_1, clipboardService_1, contextkey_1, serviceCollection_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TestFindController = class TestFindController extends findController_1.CommonFindController {
        constructor(editor, contextKeyService, storageService, clipboardService) {
            super(editor, contextKeyService, storageService, clipboardService);
            this.delayUpdateHistory = false;
            this._findInputFocused = findModel_1.CONTEXT_FIND_INPUT_FOCUSED.bindTo(contextKeyService);
            this._updateHistoryDelayer = new async_1.Delayer(50);
            this.hasFocus = false;
        }
        _start(opts) {
            super._start(opts);
            if (opts.shouldFocus !== 0 /* NoFocusChange */) {
                this.hasFocus = true;
            }
            let inputFocused = opts.shouldFocus === 1 /* FocusFindInput */;
            this._findInputFocused.set(inputFocused);
        }
    };
    TestFindController = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, storage_1.IStorageService),
        __param(3, clipboardService_1.IClipboardService)
    ], TestFindController);
    exports.TestFindController = TestFindController;
    function fromSelection(slc) {
        return [slc.startLineNumber, slc.startColumn, slc.endLineNumber, slc.endColumn];
    }
    suite('FindController', () => {
        let queryState = {};
        let clipboardState = '';
        let serviceCollection = new serviceCollection_1.ServiceCollection();
        serviceCollection.set(storage_1.IStorageService, {
            _serviceBrand: undefined,
            onDidChangeStorage: event_1.Event.None,
            onWillSaveState: event_1.Event.None,
            get: (key) => queryState[key],
            getBoolean: (key) => !!queryState[key],
            getNumber: (key) => undefined,
            store: (key, value) => { queryState[key] = value; return Promise.resolve(); },
            remove: () => undefined
        });
        if (platform.isMacintosh) {
            serviceCollection.set(clipboardService_1.IClipboardService, {
                readFindText: () => clipboardState,
                writeFindText: (value) => { clipboardState = value; }
            });
        }
        /* test('stores to the global clipboard buffer on start find action', () => {
            withTestCodeEditor([
                'ABC',
                'ABC',
                'XYZ',
                'ABC'
            ], { serviceCollection: serviceCollection }, (editor, cursor) => {
                clipboardState = '';
                if (!platform.isMacintosh) {
                    assert.ok(true);
                    return;
                }
                let findController = editor.registerAndInstantiateContribution<TestFindController>(TestFindController);
                let startFindAction = new StartFindAction();
                // I select ABC on the first line
                editor.setSelection(new Selection(1, 1, 1, 4));
                // I hit Ctrl+F to show the Find dialog
                startFindAction.run(null, editor);
    
                assert.deepEqual(findController.getGlobalBufferTerm(), findController.getState().searchString);
                findController.dispose();
            });
        });
    
        test('reads from the global clipboard buffer on next find action if buffer exists', () => {
            withTestCodeEditor([
                'ABC',
                'ABC',
                'XYZ',
                'ABC'
            ], { serviceCollection: serviceCollection }, (editor, cursor) => {
                clipboardState = 'ABC';
    
                if (!platform.isMacintosh) {
                    assert.ok(true);
                    return;
                }
    
                let findController = editor.registerAndInstantiateContribution<TestFindController>(TestFindController);
                let findState = findController.getState();
                let nextMatchFindAction = new NextMatchFindAction();
    
                nextMatchFindAction.run(null, editor);
                assert.equal(findState.searchString, 'ABC');
    
                assert.deepEqual(fromSelection(editor.getSelection()!), [1, 1, 1, 4]);
    
                findController.dispose();
            });
        });
    
        test('writes to the global clipboard buffer when text changes', () => {
            withTestCodeEditor([
                'ABC',
                'ABC',
                'XYZ',
                'ABC'
            ], { serviceCollection: serviceCollection }, (editor, cursor) => {
                clipboardState = '';
                if (!platform.isMacintosh) {
                    assert.ok(true);
                    return;
                }
    
                let findController = editor.registerAndInstantiateContribution<TestFindController>(TestFindController);
                let findState = findController.getState();
    
                findState.change({ searchString: 'ABC' }, true);
    
                assert.deepEqual(findController.getGlobalBufferTerm(), 'ABC');
    
                findController.dispose();
            });
        }); */
        test('issue #1857: F3, Find Next, acts like "Find Under Cursor"', () => {
            testCodeEditor_1.withTestCodeEditor([
                'ABC',
                'ABC',
                'XYZ',
                'ABC'
            ], { serviceCollection: serviceCollection }, (editor, cursor) => {
                clipboardState = '';
                // The cursor is at the very top, of the file, at the first ABC
                let findController = editor.registerAndInstantiateContribution(TestFindController);
                let findState = findController.getState();
                let startFindAction = new findController_1.StartFindAction();
                let nextMatchFindAction = new findController_1.NextMatchFindAction();
                // I hit Ctrl+F to show the Find dialog
                startFindAction.run(null, editor);
                // I type ABC.
                findState.change({ searchString: 'A' }, true);
                findState.change({ searchString: 'AB' }, true);
                findState.change({ searchString: 'ABC' }, true);
                // The first ABC is highlighted.
                assert.deepEqual(fromSelection(editor.getSelection()), [1, 1, 1, 4]);
                // I hit Esc to exit the Find dialog.
                findController.closeFindWidget();
                findController.hasFocus = false;
                // The cursor is now at end of the first line, with ABC on that line highlighted.
                assert.deepEqual(fromSelection(editor.getSelection()), [1, 1, 1, 4]);
                // I hit delete to remove it and change the text to XYZ.
                editor.pushUndoStop();
                editor.executeEdits('test', [editOperation_1.EditOperation.delete(new range_1.Range(1, 1, 1, 4))]);
                editor.executeEdits('test', [editOperation_1.EditOperation.insert(new position_1.Position(1, 1), 'XYZ')]);
                editor.pushUndoStop();
                // At this point the text editor looks like this:
                //   XYZ
                //   ABC
                //   XYZ
                //   ABC
                assert.equal(editor.getModel().getLineContent(1), 'XYZ');
                // The cursor is at end of the first line.
                assert.deepEqual(fromSelection(editor.getSelection()), [1, 4, 1, 4]);
                // I hit F3 to "Find Next" to find the next occurrence of ABC, but instead it searches for XYZ.
                nextMatchFindAction.run(null, editor);
                assert.equal(findState.searchString, 'ABC');
                assert.equal(findController.hasFocus, false);
                findController.dispose();
            });
        });
        test('issue #3090: F3 does not loop with two matches on a single line', () => {
            testCodeEditor_1.withTestCodeEditor([
                'import nls = require(\'vs/nls\');'
            ], { serviceCollection: serviceCollection }, (editor, cursor) => {
                clipboardState = '';
                let findController = editor.registerAndInstantiateContribution(TestFindController);
                let nextMatchFindAction = new findController_1.NextMatchFindAction();
                editor.setPosition({
                    lineNumber: 1,
                    column: 9
                });
                nextMatchFindAction.run(null, editor);
                assert.deepEqual(fromSelection(editor.getSelection()), [1, 26, 1, 29]);
                nextMatchFindAction.run(null, editor);
                assert.deepEqual(fromSelection(editor.getSelection()), [1, 8, 1, 11]);
                findController.dispose();
            });
        });
        test('issue #6149: Auto-escape highlighted text for search and replace regex mode', () => {
            testCodeEditor_1.withTestCodeEditor([
                'var x = (3 * 5)',
                'var y = (3 * 5)',
                'var z = (3  * 5)',
            ], { serviceCollection: serviceCollection }, (editor, cursor) => {
                clipboardState = '';
                let findController = editor.registerAndInstantiateContribution(TestFindController);
                let startFindAction = new findController_1.StartFindAction();
                let nextMatchFindAction = new findController_1.NextMatchFindAction();
                editor.setSelection(new selection_1.Selection(1, 9, 1, 13));
                findController.toggleRegex();
                startFindAction.run(null, editor);
                nextMatchFindAction.run(null, editor);
                assert.deepEqual(fromSelection(editor.getSelection()), [2, 9, 2, 13]);
                nextMatchFindAction.run(null, editor);
                assert.deepEqual(fromSelection(editor.getSelection()), [1, 9, 1, 13]);
                findController.dispose();
            });
        });
        test('issue #41027: Don\'t replace find input value on replace action if find input is active', () => {
            testCodeEditor_1.withTestCodeEditor([
                'test',
            ], { serviceCollection: serviceCollection }, (editor, cursor) => {
                let testRegexString = 'tes.';
                let findController = editor.registerAndInstantiateContribution(TestFindController);
                let nextMatchFindAction = new findController_1.NextMatchFindAction();
                let startFindReplaceAction = new findController_1.StartFindReplaceAction();
                findController.toggleRegex();
                findController.setSearchString(testRegexString);
                findController.start({
                    forceRevealReplace: false,
                    seedSearchStringFromSelection: false,
                    seedSearchStringFromGlobalClipboard: false,
                    shouldFocus: 1 /* FocusFindInput */,
                    shouldAnimate: false,
                    updateSearchScope: false
                });
                nextMatchFindAction.run(null, editor);
                startFindReplaceAction.run(null, editor);
                assert.equal(findController.getState().searchString, testRegexString);
                findController.dispose();
            });
        });
        test('issue #9043: Clear search scope when find widget is hidden', () => {
            testCodeEditor_1.withTestCodeEditor([
                'var x = (3 * 5)',
                'var y = (3 * 5)',
                'var z = (3 * 5)',
            ], { serviceCollection: serviceCollection }, (editor, cursor) => {
                clipboardState = '';
                let findController = editor.registerAndInstantiateContribution(TestFindController);
                findController.start({
                    forceRevealReplace: false,
                    seedSearchStringFromSelection: false,
                    seedSearchStringFromGlobalClipboard: false,
                    shouldFocus: 0 /* NoFocusChange */,
                    shouldAnimate: false,
                    updateSearchScope: false
                });
                assert.equal(findController.getState().searchScope, null);
                findController.getState().change({
                    searchScope: new range_1.Range(1, 1, 1, 5)
                }, false);
                assert.deepEqual(findController.getState().searchScope, new range_1.Range(1, 1, 1, 5));
                findController.closeFindWidget();
                assert.equal(findController.getState().searchScope, null);
            });
        });
        test('issue #18111: Regex replace with single space replaces with no space', () => {
            testCodeEditor_1.withTestCodeEditor([
                'HRESULT OnAmbientPropertyChange(DISPID   dispid);'
            ], { serviceCollection: serviceCollection }, (editor, cursor) => {
                clipboardState = '';
                let findController = editor.registerAndInstantiateContribution(TestFindController);
                let startFindAction = new findController_1.StartFindAction();
                startFindAction.run(null, editor);
                findController.getState().change({ searchString: '\\b\\s{3}\\b', replaceString: ' ', isRegex: true }, false);
                findController.moveToNextMatch();
                assert.deepEqual(editor.getSelections().map(fromSelection), [
                    [1, 39, 1, 42]
                ]);
                findController.replace();
                assert.deepEqual(editor.getValue(), 'HRESULT OnAmbientPropertyChange(DISPID dispid);');
                findController.dispose();
            });
        });
        test('issue #24714: Regular expression with ^ in search & replace', () => {
            testCodeEditor_1.withTestCodeEditor([
                '',
                'line2',
                'line3'
            ], { serviceCollection: serviceCollection }, (editor, cursor) => {
                clipboardState = '';
                let findController = editor.registerAndInstantiateContribution(TestFindController);
                let startFindAction = new findController_1.StartFindAction();
                startFindAction.run(null, editor);
                findController.getState().change({ searchString: '^', replaceString: 'x', isRegex: true }, false);
                findController.moveToNextMatch();
                assert.deepEqual(editor.getSelections().map(fromSelection), [
                    [2, 1, 2, 1]
                ]);
                findController.replace();
                assert.deepEqual(editor.getValue(), '\nxline2\nline3');
                findController.dispose();
            });
        });
        test('issue #38232: Find Next Selection, regex enabled', () => {
            testCodeEditor_1.withTestCodeEditor([
                '([funny]',
                '',
                '([funny]'
            ], { serviceCollection: serviceCollection }, (editor, cursor) => {
                clipboardState = '';
                let findController = editor.registerAndInstantiateContribution(TestFindController);
                let nextSelectionMatchFindAction = new findController_1.NextSelectionMatchFindAction();
                // toggle regex
                findController.getState().change({ isRegex: true }, false);
                // change selection
                editor.setSelection(new selection_1.Selection(1, 1, 1, 9));
                // cmd+f3
                nextSelectionMatchFindAction.run(null, editor);
                assert.deepEqual(editor.getSelections().map(fromSelection), [
                    [3, 1, 3, 9]
                ]);
                findController.dispose();
            });
        });
        test('issue #38232: Find Next Selection, regex enabled, find widget open', () => {
            testCodeEditor_1.withTestCodeEditor([
                '([funny]',
                '',
                '([funny]'
            ], { serviceCollection: serviceCollection }, (editor, cursor) => {
                clipboardState = '';
                let findController = editor.registerAndInstantiateContribution(TestFindController);
                let startFindAction = new findController_1.StartFindAction();
                let nextSelectionMatchFindAction = new findController_1.NextSelectionMatchFindAction();
                // cmd+f - open find widget
                startFindAction.run(null, editor);
                // toggle regex
                findController.getState().change({ isRegex: true }, false);
                // change selection
                editor.setSelection(new selection_1.Selection(1, 1, 1, 9));
                // cmd+f3
                nextSelectionMatchFindAction.run(null, editor);
                assert.deepEqual(editor.getSelections().map(fromSelection), [
                    [3, 1, 3, 9]
                ]);
                findController.dispose();
            });
        });
    });
    suite('FindController query options persistence', () => {
        let queryState = {};
        queryState['editor.isRegex'] = false;
        queryState['editor.matchCase'] = false;
        queryState['editor.wholeWord'] = false;
        let serviceCollection = new serviceCollection_1.ServiceCollection();
        serviceCollection.set(storage_1.IStorageService, {
            _serviceBrand: undefined,
            onDidChangeStorage: event_1.Event.None,
            onWillSaveState: event_1.Event.None,
            get: (key) => queryState[key],
            getBoolean: (key) => !!queryState[key],
            getNumber: (key) => undefined,
            store: (key, value) => { queryState[key] = value; return Promise.resolve(); },
            remove: () => undefined
        });
        test('matchCase', () => {
            testCodeEditor_1.withTestCodeEditor([
                'abc',
                'ABC',
                'XYZ',
                'ABC'
            ], { serviceCollection: serviceCollection }, (editor, cursor) => {
                queryState = { 'editor.isRegex': false, 'editor.matchCase': true, 'editor.wholeWord': false };
                // The cursor is at the very top, of the file, at the first ABC
                let findController = editor.registerAndInstantiateContribution(TestFindController);
                let findState = findController.getState();
                let startFindAction = new findController_1.StartFindAction();
                // I hit Ctrl+F to show the Find dialog
                startFindAction.run(null, editor);
                // I type ABC.
                findState.change({ searchString: 'ABC' }, true);
                // The second ABC is highlighted as matchCase is true.
                assert.deepEqual(fromSelection(editor.getSelection()), [2, 1, 2, 4]);
                findController.dispose();
            });
        });
        queryState = { 'editor.isRegex': false, 'editor.matchCase': false, 'editor.wholeWord': true };
        test('wholeWord', () => {
            testCodeEditor_1.withTestCodeEditor([
                'ABC',
                'AB',
                'XYZ',
                'ABC'
            ], { serviceCollection: serviceCollection }, (editor, cursor) => {
                queryState = { 'editor.isRegex': false, 'editor.matchCase': false, 'editor.wholeWord': true };
                // The cursor is at the very top, of the file, at the first ABC
                let findController = editor.registerAndInstantiateContribution(TestFindController);
                let findState = findController.getState();
                let startFindAction = new findController_1.StartFindAction();
                // I hit Ctrl+F to show the Find dialog
                startFindAction.run(null, editor);
                // I type AB.
                findState.change({ searchString: 'AB' }, true);
                // The second AB is highlighted as wholeWord is true.
                assert.deepEqual(fromSelection(editor.getSelection()), [2, 1, 2, 3]);
                findController.dispose();
            });
        });
        test('toggling options is saved', () => {
            testCodeEditor_1.withTestCodeEditor([
                'ABC',
                'AB',
                'XYZ',
                'ABC'
            ], { serviceCollection: serviceCollection }, (editor, cursor) => {
                queryState = { 'editor.isRegex': false, 'editor.matchCase': false, 'editor.wholeWord': true };
                // The cursor is at the very top, of the file, at the first ABC
                let findController = editor.registerAndInstantiateContribution(TestFindController);
                findController.toggleRegex();
                assert.equal(queryState['editor.isRegex'], true);
                findController.dispose();
            });
        });
        test('issue #27083: Update search scope once find widget becomes visible', () => {
            testCodeEditor_1.withTestCodeEditor([
                'var x = (3 * 5)',
                'var y = (3 * 5)',
                'var z = (3 * 5)',
            ], { serviceCollection: serviceCollection, find: { autoFindInSelection: true, globalFindClipboard: false } }, (editor, cursor) => {
                // clipboardState = '';
                editor.setSelection(new range_1.Range(1, 1, 2, 1));
                let findController = editor.registerAndInstantiateContribution(TestFindController);
                findController.start({
                    forceRevealReplace: false,
                    seedSearchStringFromSelection: false,
                    seedSearchStringFromGlobalClipboard: false,
                    shouldFocus: 0 /* NoFocusChange */,
                    shouldAnimate: false,
                    updateSearchScope: true
                });
                assert.deepEqual(findController.getState().searchScope, new selection_1.Selection(1, 1, 2, 1));
            });
        });
        test('issue #58604: Do not update searchScope if it is empty', () => {
            testCodeEditor_1.withTestCodeEditor([
                'var x = (3 * 5)',
                'var y = (3 * 5)',
                'var z = (3 * 5)',
            ], { serviceCollection: serviceCollection, find: { autoFindInSelection: true, globalFindClipboard: false } }, (editor, cursor) => {
                // clipboardState = '';
                editor.setSelection(new range_1.Range(1, 2, 1, 2));
                let findController = editor.registerAndInstantiateContribution(TestFindController);
                findController.start({
                    forceRevealReplace: false,
                    seedSearchStringFromSelection: false,
                    seedSearchStringFromGlobalClipboard: false,
                    shouldFocus: 0 /* NoFocusChange */,
                    shouldAnimate: false,
                    updateSearchScope: true
                });
                assert.deepEqual(findController.getState().searchScope, null);
            });
        });
        test('issue #58604: Update searchScope if it is not empty', () => {
            testCodeEditor_1.withTestCodeEditor([
                'var x = (3 * 5)',
                'var y = (3 * 5)',
                'var z = (3 * 5)',
            ], { serviceCollection: serviceCollection, find: { autoFindInSelection: true, globalFindClipboard: false } }, (editor, cursor) => {
                // clipboardState = '';
                editor.setSelection(new range_1.Range(1, 2, 1, 3));
                let findController = editor.registerAndInstantiateContribution(TestFindController);
                findController.start({
                    forceRevealReplace: false,
                    seedSearchStringFromSelection: false,
                    seedSearchStringFromGlobalClipboard: false,
                    shouldFocus: 0 /* NoFocusChange */,
                    shouldAnimate: false,
                    updateSearchScope: true
                });
                assert.deepEqual(findController.getState().searchScope, new selection_1.Selection(1, 2, 1, 3));
            });
        });
    });
});
//# sourceMappingURL=findController.test.js.map