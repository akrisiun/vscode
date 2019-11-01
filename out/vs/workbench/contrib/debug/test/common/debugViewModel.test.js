/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/debug/common/debugViewModel", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/test/common/mockDebug", "vs/platform/keybinding/test/common/mockKeybindingService"], function (require, exports, assert, debugViewModel_1, debugModel_1, mockDebug_1, mockKeybindingService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Debug - View Model', () => {
        let model;
        setup(() => {
            model = new debugViewModel_1.ViewModel(new mockKeybindingService_1.MockContextKeyService());
        });
        test('focused stack frame', () => {
            assert.equal(model.focusedStackFrame, null);
            assert.equal(model.focusedThread, null);
            const session = new mockDebug_1.MockSession();
            const thread = new debugModel_1.Thread(session, 'myThread', 1);
            const frame = new debugModel_1.StackFrame(thread, 1, undefined, 'app.js', 'normal', { startColumn: 1, startLineNumber: 1, endColumn: 1, endLineNumber: 1 }, 0);
            model.setFocus(frame, thread, session, false);
            assert.equal(model.focusedStackFrame.getId(), frame.getId());
            assert.equal(model.focusedThread.threadId, 1);
            assert.equal(model.focusedSession.getId(), session.getId());
        });
        test('selected expression', () => {
            assert.equal(model.getSelectedExpression(), null);
            const expression = new debugModel_1.Expression('my expression');
            model.setSelectedExpression(expression);
            assert.equal(model.getSelectedExpression(), expression);
        });
        test('multi session view and changed workbench state', () => {
            assert.equal(model.isMultiSessionView(), false);
            model.setMultiSessionView(true);
            assert.equal(model.isMultiSessionView(), true);
        });
    });
});
//# sourceMappingURL=debugViewModel.test.js.map