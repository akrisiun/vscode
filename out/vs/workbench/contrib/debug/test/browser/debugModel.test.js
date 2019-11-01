/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/common/severity", "vs/workbench/contrib/debug/common/debugModel", "sinon", "vs/workbench/contrib/debug/test/common/mockDebug", "vs/workbench/contrib/debug/common/debugSource", "vs/workbench/contrib/debug/browser/debugSession", "vs/workbench/contrib/debug/common/replModel", "vs/platform/opener/common/opener"], function (require, exports, assert, uri_1, severity_1, debugModel_1, sinon, mockDebug_1, debugSource_1, debugSession_1, replModel_1, opener_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createMockSession(model, name = 'mockSession', options) {
        return new debugSession_1.DebugSession({ resolved: { name, type: 'node', request: 'launch' }, unresolved: undefined }, undefined, model, options, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, opener_1.NullOpenerService);
    }
    suite('Debug - Model', () => {
        let model;
        let rawSession;
        setup(() => {
            model = new debugModel_1.DebugModel([], [], [], [], [], { isDirty: (e) => false });
            rawSession = new mockDebug_1.MockRawSession();
        });
        // Breakpoints
        test('breakpoints simple', () => {
            const modelUri = uri_1.URI.file('/myfolder/myfile.js');
            model.addBreakpoints(modelUri, [{ lineNumber: 5, enabled: true }, { lineNumber: 10, enabled: false }]);
            assert.equal(model.areBreakpointsActivated(), true);
            assert.equal(model.getBreakpoints().length, 2);
            model.removeBreakpoints(model.getBreakpoints());
            assert.equal(model.getBreakpoints().length, 0);
        });
        test('breakpoints toggling', () => {
            const modelUri = uri_1.URI.file('/myfolder/myfile.js');
            model.addBreakpoints(modelUri, [{ lineNumber: 5, enabled: true }, { lineNumber: 10, enabled: false }]);
            model.addBreakpoints(modelUri, [{ lineNumber: 12, enabled: true, condition: 'fake condition' }]);
            assert.equal(model.getBreakpoints().length, 3);
            const bp = model.getBreakpoints().pop();
            if (bp) {
                model.removeBreakpoints([bp]);
            }
            assert.equal(model.getBreakpoints().length, 2);
            model.setBreakpointsActivated(false);
            assert.equal(model.areBreakpointsActivated(), false);
            model.setBreakpointsActivated(true);
            assert.equal(model.areBreakpointsActivated(), true);
        });
        test('breakpoints two files', () => {
            const modelUri1 = uri_1.URI.file('/myfolder/my file first.js');
            const modelUri2 = uri_1.URI.file('/secondfolder/second/second file.js');
            model.addBreakpoints(modelUri1, [{ lineNumber: 5, enabled: true }, { lineNumber: 10, enabled: false }]);
            model.addBreakpoints(modelUri2, [{ lineNumber: 1, enabled: true }, { lineNumber: 2, enabled: true }, { lineNumber: 3, enabled: false }]);
            assert.equal(model.getBreakpoints().length, 5);
            const bp = model.getBreakpoints()[0];
            const update = new Map();
            update.set(bp.getId(), { lineNumber: 100 });
            model.updateBreakpoints(update);
            assert.equal(bp.lineNumber, 100);
            model.enableOrDisableAllBreakpoints(false);
            model.getBreakpoints().forEach(bp => {
                assert.equal(bp.enabled, false);
            });
            model.setEnablement(bp, true);
            assert.equal(bp.enabled, true);
            model.removeBreakpoints(model.getBreakpoints({ uri: modelUri1 }));
            assert.equal(model.getBreakpoints().length, 3);
        });
        test('breakpoints conditions', () => {
            const modelUri1 = uri_1.URI.file('/myfolder/my file first.js');
            model.addBreakpoints(modelUri1, [{ lineNumber: 5, condition: 'i < 5', hitCondition: '17' }, { lineNumber: 10, condition: 'j < 3' }]);
            const breakpoints = model.getBreakpoints();
            assert.equal(breakpoints[0].condition, 'i < 5');
            assert.equal(breakpoints[0].hitCondition, '17');
            assert.equal(breakpoints[1].condition, 'j < 3');
            assert.equal(!!breakpoints[1].hitCondition, false);
            assert.equal(model.getBreakpoints().length, 2);
            model.removeBreakpoints(model.getBreakpoints());
            assert.equal(model.getBreakpoints().length, 0);
        });
        test('function breakpoints', () => {
            model.addFunctionBreakpoint('foo', '1');
            model.addFunctionBreakpoint('bar', '2');
            model.renameFunctionBreakpoint('1', 'fooUpdated');
            model.renameFunctionBreakpoint('2', 'barUpdated');
            const functionBps = model.getFunctionBreakpoints();
            assert.equal(functionBps[0].name, 'fooUpdated');
            assert.equal(functionBps[1].name, 'barUpdated');
            model.removeFunctionBreakpoints();
            assert.equal(model.getFunctionBreakpoints().length, 0);
        });
        test('breakpoints multiple sessions', () => {
            const modelUri = uri_1.URI.file('/myfolder/myfile.js');
            const breakpoints = model.addBreakpoints(modelUri, [{ lineNumber: 5, enabled: true, condition: 'x > 5' }, { lineNumber: 10, enabled: false }]);
            const session = createMockSession(model);
            const data = new Map();
            assert.equal(breakpoints[0].lineNumber, 5);
            assert.equal(breakpoints[1].lineNumber, 10);
            data.set(breakpoints[0].getId(), { verified: false, line: 10 });
            data.set(breakpoints[1].getId(), { verified: true, line: 50 });
            model.setBreakpointSessionData(session.getId(), {}, data);
            assert.equal(breakpoints[0].lineNumber, 5);
            assert.equal(breakpoints[1].lineNumber, 50);
            const session2 = createMockSession(model);
            const data2 = new Map();
            data2.set(breakpoints[0].getId(), { verified: true, line: 100 });
            data2.set(breakpoints[1].getId(), { verified: true, line: 500 });
            model.setBreakpointSessionData(session2.getId(), {}, data2);
            // Breakpoint is verified only once, show that line
            assert.equal(breakpoints[0].lineNumber, 100);
            // Breakpoint is verified two times, show the original line
            assert.equal(breakpoints[1].lineNumber, 10);
            model.setBreakpointSessionData(session.getId(), {}, undefined);
            // No more double session verification
            assert.equal(breakpoints[0].lineNumber, 100);
            assert.equal(breakpoints[1].lineNumber, 500);
            assert.equal(breakpoints[0].supported, false);
            const data3 = new Map();
            data3.set(breakpoints[0].getId(), { verified: true, line: 500 });
            model.setBreakpointSessionData(session2.getId(), { supportsConditionalBreakpoints: true }, data2);
            assert.equal(breakpoints[0].supported, true);
        });
        // Threads
        test('threads simple', () => {
            const threadId = 1;
            const threadName = 'firstThread';
            const session = createMockSession(model);
            model.addSession(session);
            assert.equal(model.getSessions(true).length, 1);
            model.rawUpdate({
                sessionId: session.getId(),
                threads: [{
                        id: threadId,
                        name: threadName
                    }]
            });
            assert.equal(session.getThread(threadId).name, threadName);
            model.clearThreads(session.getId(), true);
            assert.equal(session.getThread(threadId), undefined);
            assert.equal(model.getSessions(true).length, 1);
        });
        test('threads multiple wtih allThreadsStopped', () => {
            const threadId1 = 1;
            const threadName1 = 'firstThread';
            const threadId2 = 2;
            const threadName2 = 'secondThread';
            const stoppedReason = 'breakpoint';
            // Add the threads
            const session = createMockSession(model);
            model.addSession(session);
            session['raw'] = rawSession;
            model.rawUpdate({
                sessionId: session.getId(),
                threads: [{
                        id: threadId1,
                        name: threadName1
                    }]
            });
            // Stopped event with all threads stopped
            model.rawUpdate({
                sessionId: session.getId(),
                threads: [{
                        id: threadId1,
                        name: threadName1
                    }, {
                        id: threadId2,
                        name: threadName2
                    }],
                stoppedDetails: {
                    reason: stoppedReason,
                    threadId: 1,
                    allThreadsStopped: true
                },
            });
            const thread1 = session.getThread(threadId1);
            const thread2 = session.getThread(threadId2);
            // at the beginning, callstacks are obtainable but not available
            assert.equal(session.getAllThreads().length, 2);
            assert.equal(thread1.name, threadName1);
            assert.equal(thread1.stopped, true);
            assert.equal(thread1.getCallStack().length, 0);
            assert.equal(thread1.stoppedDetails.reason, stoppedReason);
            assert.equal(thread2.name, threadName2);
            assert.equal(thread2.stopped, true);
            assert.equal(thread2.getCallStack().length, 0);
            assert.equal(thread2.stoppedDetails.reason, undefined);
            // after calling getCallStack, the callstack becomes available
            // and results in a request for the callstack in the debug adapter
            thread1.fetchCallStack().then(() => {
                assert.notEqual(thread1.getCallStack().length, 0);
            });
            thread2.fetchCallStack().then(() => {
                assert.notEqual(thread2.getCallStack().length, 0);
            });
            // calling multiple times getCallStack doesn't result in multiple calls
            // to the debug adapter
            thread1.fetchCallStack().then(() => {
                return thread2.fetchCallStack();
            });
            // clearing the callstack results in the callstack not being available
            thread1.clearCallStack();
            assert.equal(thread1.stopped, true);
            assert.equal(thread1.getCallStack().length, 0);
            thread2.clearCallStack();
            assert.equal(thread2.stopped, true);
            assert.equal(thread2.getCallStack().length, 0);
            model.clearThreads(session.getId(), true);
            assert.equal(session.getThread(threadId1), undefined);
            assert.equal(session.getThread(threadId2), undefined);
            assert.equal(session.getAllThreads().length, 0);
        });
        test('threads mutltiple without allThreadsStopped', () => {
            const sessionStub = sinon.spy(rawSession, 'stackTrace');
            const stoppedThreadId = 1;
            const stoppedThreadName = 'stoppedThread';
            const runningThreadId = 2;
            const runningThreadName = 'runningThread';
            const stoppedReason = 'breakpoint';
            const session = createMockSession(model);
            model.addSession(session);
            session['raw'] = rawSession;
            // Add the threads
            model.rawUpdate({
                sessionId: session.getId(),
                threads: [{
                        id: stoppedThreadId,
                        name: stoppedThreadName
                    }]
            });
            // Stopped event with only one thread stopped
            model.rawUpdate({
                sessionId: session.getId(),
                threads: [{
                        id: 1,
                        name: stoppedThreadName
                    }, {
                        id: runningThreadId,
                        name: runningThreadName
                    }],
                stoppedDetails: {
                    reason: stoppedReason,
                    threadId: 1,
                    allThreadsStopped: false
                }
            });
            const stoppedThread = session.getThread(stoppedThreadId);
            const runningThread = session.getThread(runningThreadId);
            // the callstack for the stopped thread is obtainable but not available
            // the callstack for the running thread is not obtainable nor available
            assert.equal(stoppedThread.name, stoppedThreadName);
            assert.equal(stoppedThread.stopped, true);
            assert.equal(session.getAllThreads().length, 2);
            assert.equal(stoppedThread.getCallStack().length, 0);
            assert.equal(stoppedThread.stoppedDetails.reason, stoppedReason);
            assert.equal(runningThread.name, runningThreadName);
            assert.equal(runningThread.stopped, false);
            assert.equal(runningThread.getCallStack().length, 0);
            assert.equal(runningThread.stoppedDetails, undefined);
            // after calling getCallStack, the callstack becomes available
            // and results in a request for the callstack in the debug adapter
            stoppedThread.fetchCallStack().then(() => {
                assert.notEqual(stoppedThread.getCallStack().length, 0);
                assert.equal(runningThread.getCallStack().length, 0);
                assert.equal(sessionStub.callCount, 1);
            });
            // calling getCallStack on the running thread returns empty array
            // and does not return in a request for the callstack in the debug
            // adapter
            runningThread.fetchCallStack().then(() => {
                assert.equal(runningThread.getCallStack().length, 0);
                assert.equal(sessionStub.callCount, 1);
            });
            // clearing the callstack results in the callstack not being available
            stoppedThread.clearCallStack();
            assert.equal(stoppedThread.stopped, true);
            assert.equal(stoppedThread.getCallStack().length, 0);
            model.clearThreads(session.getId(), true);
            assert.equal(session.getThread(stoppedThreadId), undefined);
            assert.equal(session.getThread(runningThreadId), undefined);
            assert.equal(session.getAllThreads().length, 0);
        });
        // Expressions
        function assertWatchExpressions(watchExpressions, expectedName) {
            assert.equal(watchExpressions.length, 2);
            watchExpressions.forEach(we => {
                assert.equal(we.available, false);
                assert.equal(we.reference, 0);
                assert.equal(we.name, expectedName);
            });
        }
        test('watch expressions', () => {
            assert.equal(model.getWatchExpressions().length, 0);
            model.addWatchExpression('console');
            model.addWatchExpression('console');
            let watchExpressions = model.getWatchExpressions();
            assertWatchExpressions(watchExpressions, 'console');
            model.renameWatchExpression(watchExpressions[0].getId(), 'new_name');
            model.renameWatchExpression(watchExpressions[1].getId(), 'new_name');
            assertWatchExpressions(model.getWatchExpressions(), 'new_name');
            assertWatchExpressions(model.getWatchExpressions(), 'new_name');
            model.addWatchExpression('mockExpression');
            model.moveWatchExpression(model.getWatchExpressions()[2].getId(), 1);
            watchExpressions = model.getWatchExpressions();
            assert.equal(watchExpressions[0].name, 'new_name');
            assert.equal(watchExpressions[1].name, 'mockExpression');
            assert.equal(watchExpressions[2].name, 'new_name');
            model.removeWatchExpressions();
            assert.equal(model.getWatchExpressions().length, 0);
        });
        test('repl expressions', () => {
            const session = createMockSession(model);
            assert.equal(session.getReplElements().length, 0);
            model.addSession(session);
            session['raw'] = rawSession;
            const thread = new debugModel_1.Thread(session, 'mockthread', 1);
            const stackFrame = new debugModel_1.StackFrame(thread, 1, undefined, 'app.js', 'normal', { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 10 }, 1);
            const replModel = new replModel_1.ReplModel();
            replModel.addReplExpression(session, stackFrame, 'myVariable').then();
            replModel.addReplExpression(session, stackFrame, 'myVariable').then();
            replModel.addReplExpression(session, stackFrame, 'myVariable').then();
            assert.equal(replModel.getReplElements().length, 3);
            replModel.getReplElements().forEach(re => {
                assert.equal(re.value, 'myVariable');
            });
            replModel.removeReplExpressions();
            assert.equal(replModel.getReplElements().length, 0);
        });
        test('stack frame get specific source name', () => {
            const session = createMockSession(model);
            model.addSession(session);
            let firstStackFrame;
            let secondStackFrame;
            const thread = new class extends debugModel_1.Thread {
                getCallStack() {
                    return [firstStackFrame, secondStackFrame];
                }
            }(session, 'mockthread', 1);
            const firstSource = new debugSource_1.Source({
                name: 'internalModule.js',
                path: 'a/b/c/d/internalModule.js',
                sourceReference: 10,
            }, 'aDebugSessionId');
            const secondSource = new debugSource_1.Source({
                name: 'internalModule.js',
                path: 'z/x/c/d/internalModule.js',
                sourceReference: 11,
            }, 'aDebugSessionId');
            firstStackFrame = new debugModel_1.StackFrame(thread, 1, firstSource, 'app.js', 'normal', { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 10 }, 1);
            secondStackFrame = new debugModel_1.StackFrame(thread, 1, secondSource, 'app.js', 'normal', { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 10 }, 1);
            assert.equal(firstStackFrame.getSpecificSourceName(), '.../b/c/d/internalModule.js');
            assert.equal(secondStackFrame.getSpecificSourceName(), '.../x/c/d/internalModule.js');
        });
        test('stack frame toString()', () => {
            const session = createMockSession(model);
            const thread = new debugModel_1.Thread(session, 'mockthread', 1);
            const firstSource = new debugSource_1.Source({
                name: 'internalModule.js',
                path: 'a/b/c/d/internalModule.js',
                sourceReference: 10,
            }, 'aDebugSessionId');
            const stackFrame = new debugModel_1.StackFrame(thread, 1, firstSource, 'app', 'normal', { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 10 }, 1);
            assert.equal(stackFrame.toString(), 'app (internalModule.js:1)');
            const secondSource = new debugSource_1.Source(undefined, 'aDebugSessionId');
            const stackFrame2 = new debugModel_1.StackFrame(thread, 2, secondSource, 'module', 'normal', { startLineNumber: undefined, startColumn: undefined, endLineNumber: undefined, endColumn: undefined }, 2);
            assert.equal(stackFrame2.toString(), 'module');
        });
        test('debug child sessions are added in correct order', () => {
            const session = createMockSession(model);
            model.addSession(session);
            const secondSession = createMockSession(model, 'mockSession2');
            model.addSession(secondSession);
            const firstChild = createMockSession(model, 'firstChild', { parentSession: session });
            model.addSession(firstChild);
            const secondChild = createMockSession(model, 'secondChild', { parentSession: session });
            model.addSession(secondChild);
            const thirdSession = createMockSession(model, 'mockSession3');
            model.addSession(thirdSession);
            const anotherChild = createMockSession(model, 'secondChild', { parentSession: secondSession });
            model.addSession(anotherChild);
            const sessions = model.getSessions();
            assert.equal(sessions[0].getId(), session.getId());
            assert.equal(sessions[1].getId(), firstChild.getId());
            assert.equal(sessions[2].getId(), secondChild.getId());
            assert.equal(sessions[3].getId(), secondSession.getId());
            assert.equal(sessions[4].getId(), anotherChild.getId());
            assert.equal(sessions[5].getId(), thirdSession.getId());
        });
        // Repl output
        test('repl output', () => {
            const session = createMockSession(model);
            const repl = new replModel_1.ReplModel();
            repl.appendToRepl(session, 'first line\n', severity_1.default.Error);
            repl.appendToRepl(session, 'second line ', severity_1.default.Error);
            repl.appendToRepl(session, 'third line ', severity_1.default.Error);
            repl.appendToRepl(session, 'fourth line', severity_1.default.Error);
            let elements = repl.getReplElements();
            assert.equal(elements.length, 2);
            assert.equal(elements[0].value, 'first line\n');
            assert.equal(elements[0].severity, severity_1.default.Error);
            assert.equal(elements[1].value, 'second line third line fourth line');
            assert.equal(elements[1].severity, severity_1.default.Error);
            repl.appendToRepl(session, '1', severity_1.default.Warning);
            elements = repl.getReplElements();
            assert.equal(elements.length, 3);
            assert.equal(elements[2].value, '1');
            assert.equal(elements[2].severity, severity_1.default.Warning);
            const keyValueObject = { 'key1': 2, 'key2': 'value' };
            repl.appendToRepl(session, new replModel_1.RawObjectReplElement('fakeid', 'fake', keyValueObject), severity_1.default.Info);
            const element = repl.getReplElements()[3];
            assert.equal(element.value, 'Object');
            assert.deepEqual(element.valueObj, keyValueObject);
            repl.removeReplExpressions();
            assert.equal(repl.getReplElements().length, 0);
            repl.appendToRepl(session, '1\n', severity_1.default.Info);
            repl.appendToRepl(session, '2', severity_1.default.Info);
            repl.appendToRepl(session, '3\n4', severity_1.default.Info);
            repl.appendToRepl(session, '5\n', severity_1.default.Info);
            repl.appendToRepl(session, '6', severity_1.default.Info);
            elements = repl.getReplElements();
            assert.equal(elements.length, 3);
            assert.equal(elements[0], '1\n');
            assert.equal(elements[1], '23\n45\n');
            assert.equal(elements[2], '6');
        });
        test('repl merging', () => {
            // 'mergeWithParent' should be ignored when there is no parent.
            const parent = createMockSession(model, 'parent', { repl: 'mergeWithParent' });
            const child1 = createMockSession(model, 'child1', { parentSession: parent, repl: 'separate' });
            const child2 = createMockSession(model, 'child2', { parentSession: parent, repl: 'mergeWithParent' });
            const grandChild = createMockSession(model, 'grandChild', { parentSession: child2, repl: 'mergeWithParent' });
            const child3 = createMockSession(model, 'child3', { parentSession: parent });
            let parentChanges = 0;
            parent.onDidChangeReplElements(() => ++parentChanges);
            parent.appendToRepl('1\n', severity_1.default.Info);
            assert.equal(parentChanges, 1);
            assert.equal(parent.getReplElements().length, 1);
            assert.equal(child1.getReplElements().length, 0);
            assert.equal(child2.getReplElements().length, 1);
            assert.equal(grandChild.getReplElements().length, 1);
            assert.equal(child3.getReplElements().length, 0);
            grandChild.appendToRepl('1\n', severity_1.default.Info);
            assert.equal(parentChanges, 2);
            assert.equal(parent.getReplElements().length, 2);
            assert.equal(child1.getReplElements().length, 0);
            assert.equal(child2.getReplElements().length, 2);
            assert.equal(grandChild.getReplElements().length, 2);
            assert.equal(child3.getReplElements().length, 0);
            child3.appendToRepl('1\n', severity_1.default.Info);
            assert.equal(parentChanges, 2);
            assert.equal(parent.getReplElements().length, 2);
            assert.equal(child1.getReplElements().length, 0);
            assert.equal(child2.getReplElements().length, 2);
            assert.equal(grandChild.getReplElements().length, 2);
            assert.equal(child3.getReplElements().length, 1);
            child1.appendToRepl('1\n', severity_1.default.Info);
            assert.equal(parentChanges, 2);
            assert.equal(parent.getReplElements().length, 2);
            assert.equal(child1.getReplElements().length, 1);
            assert.equal(child2.getReplElements().length, 2);
            assert.equal(grandChild.getReplElements().length, 2);
            assert.equal(child3.getReplElements().length, 1);
        });
    });
});
//# sourceMappingURL=debugModel.test.js.map