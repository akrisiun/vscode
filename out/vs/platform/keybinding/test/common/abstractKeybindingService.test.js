define(["require", "exports", "assert", "vs/base/common/keyCodes", "vs/base/common/platform", "vs/base/common/severity", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/abstractKeybindingService", "vs/platform/keybinding/common/keybindingResolver", "vs/platform/keybinding/common/resolvedKeybindingItem", "vs/platform/keybinding/common/usLayoutResolvedKeybinding", "vs/platform/notification/common/notification", "vs/platform/telemetry/common/telemetryUtils", "vs/base/common/lifecycle"], function (require, exports, assert, keyCodes_1, platform_1, severity_1, contextkey_1, abstractKeybindingService_1, keybindingResolver_1, resolvedKeybindingItem_1, usLayoutResolvedKeybinding_1, notification_1, telemetryUtils_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createContext(ctx) {
        return {
            getValue: (key) => {
                return ctx[key];
            }
        };
    }
    suite('AbstractKeybindingService', () => {
        class TestKeybindingService extends abstractKeybindingService_1.AbstractKeybindingService {
            constructor(resolver, contextKeyService, commandService, notificationService) {
                super(contextKeyService, commandService, telemetryUtils_1.NullTelemetryService, notificationService);
                this._resolver = resolver;
            }
            _getResolver() {
                return this._resolver;
            }
            _documentHasFocus() {
                return true;
            }
            resolveKeybinding(kb) {
                return [new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding(kb, platform_1.OS)];
            }
            resolveKeyboardEvent(keyboardEvent) {
                let keybinding = new keyCodes_1.SimpleKeybinding(keyboardEvent.ctrlKey, keyboardEvent.shiftKey, keyboardEvent.altKey, keyboardEvent.metaKey, keyboardEvent.keyCode).toChord();
                return this.resolveKeybinding(keybinding)[0];
            }
            resolveUserBinding(userBinding) {
                return [];
            }
            testDispatch(kb) {
                const keybinding = keyCodes_1.createSimpleKeybinding(kb, platform_1.OS);
                return this._dispatch({
                    _standardKeyboardEventBrand: true,
                    ctrlKey: keybinding.ctrlKey,
                    shiftKey: keybinding.shiftKey,
                    altKey: keybinding.altKey,
                    metaKey: keybinding.metaKey,
                    keyCode: keybinding.keyCode,
                    code: null
                }, null);
            }
            _dumpDebugInfo() {
                return '';
            }
            _dumpDebugInfoJSON() {
                return '';
            }
        }
        let createTestKeybindingService = null;
        let currentContextValue = null;
        let executeCommandCalls = null;
        let showMessageCalls = null;
        let statusMessageCalls = null;
        let statusMessageCallsDisposed = null;
        setup(() => {
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            createTestKeybindingService = (items) => {
                let contextKeyService = {
                    _serviceBrand: undefined,
                    dispose: undefined,
                    onDidChangeContext: undefined,
                    bufferChangeEvents() { },
                    createKey: undefined,
                    contextMatchesRules: undefined,
                    getContextKeyValue: undefined,
                    createScoped: undefined,
                    getContext: (target) => {
                        return currentContextValue;
                    }
                };
                let commandService = {
                    _serviceBrand: undefined,
                    onWillExecuteCommand: () => lifecycle_1.Disposable.None,
                    onDidExecuteCommand: () => lifecycle_1.Disposable.None,
                    executeCommand: (commandId, ...args) => {
                        executeCommandCalls.push({
                            commandId: commandId,
                            args: args
                        });
                        return Promise.resolve(undefined);
                    }
                };
                let notificationService = {
                    _serviceBrand: undefined,
                    notify: (notification) => {
                        showMessageCalls.push({ sev: notification.severity, message: notification.message });
                        return new notification_1.NoOpNotification();
                    },
                    info: (message) => {
                        showMessageCalls.push({ sev: severity_1.default.Info, message });
                        return new notification_1.NoOpNotification();
                    },
                    warn: (message) => {
                        showMessageCalls.push({ sev: severity_1.default.Warning, message });
                        return new notification_1.NoOpNotification();
                    },
                    error: (message) => {
                        showMessageCalls.push({ sev: severity_1.default.Error, message });
                        return new notification_1.NoOpNotification();
                    },
                    prompt(severity, message, choices, options) {
                        throw new Error('not implemented');
                    },
                    status(message, options) {
                        statusMessageCalls.push(message);
                        return {
                            dispose: () => {
                                statusMessageCallsDisposed.push(message);
                            }
                        };
                    },
                    setFilter() { }
                };
                let resolver = new keybindingResolver_1.KeybindingResolver(items, []);
                return new TestKeybindingService(resolver, contextKeyService, commandService, notificationService);
            };
        });
        teardown(() => {
            currentContextValue = null;
            executeCommandCalls = null;
            showMessageCalls = null;
            createTestKeybindingService = null;
            statusMessageCalls = null;
            statusMessageCallsDisposed = null;
        });
        function kbItem(keybinding, command, when) {
            const resolvedKeybinding = (keybinding !== 0 ? new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding(keyCodes_1.createKeybinding(keybinding, platform_1.OS), platform_1.OS) : undefined);
            return new resolvedKeybindingItem_1.ResolvedKeybindingItem(resolvedKeybinding, command, null, when, true);
        }
        function toUsLabel(keybinding) {
            const usResolvedKeybinding = new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding(keyCodes_1.createKeybinding(keybinding, platform_1.OS), platform_1.OS);
            return usResolvedKeybinding.getLabel();
        }
        test('issue #16498: chord mode is quit for invalid chords', () => {
            let kbService = createTestKeybindingService([
                kbItem(keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 54 /* KEY_X */), 'chordCommand'),
                kbItem(1 /* Backspace */, 'simpleCommand'),
            ]);
            // send Ctrl/Cmd + K
            let shouldPreventDefault = kbService.testDispatch(2048 /* CtrlCmd */ | 41 /* KEY_K */);
            assert.equal(shouldPreventDefault, true);
            assert.deepEqual(executeCommandCalls, []);
            assert.deepEqual(showMessageCalls, []);
            assert.deepEqual(statusMessageCalls, [
                `(${toUsLabel(2048 /* CtrlCmd */ | 41 /* KEY_K */)}) was pressed. Waiting for second key of chord...`
            ]);
            assert.deepEqual(statusMessageCallsDisposed, []);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            // send backspace
            shouldPreventDefault = kbService.testDispatch(1 /* Backspace */);
            assert.equal(shouldPreventDefault, true);
            assert.deepEqual(executeCommandCalls, []);
            assert.deepEqual(showMessageCalls, []);
            assert.deepEqual(statusMessageCalls, [
                `The key combination (${toUsLabel(2048 /* CtrlCmd */ | 41 /* KEY_K */)}, ${toUsLabel(1 /* Backspace */)}) is not a command.`
            ]);
            assert.deepEqual(statusMessageCallsDisposed, [
                `(${toUsLabel(2048 /* CtrlCmd */ | 41 /* KEY_K */)}) was pressed. Waiting for second key of chord...`
            ]);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            // send backspace
            shouldPreventDefault = kbService.testDispatch(1 /* Backspace */);
            assert.equal(shouldPreventDefault, true);
            assert.deepEqual(executeCommandCalls, [{
                    commandId: 'simpleCommand',
                    args: [null]
                }]);
            assert.deepEqual(showMessageCalls, []);
            assert.deepEqual(statusMessageCalls, []);
            assert.deepEqual(statusMessageCallsDisposed, []);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            kbService.dispose();
        });
        test('issue #16833: Keybinding service should not testDispatch on modifier keys', () => {
            let kbService = createTestKeybindingService([
                kbItem(5 /* Ctrl */, 'nope'),
                kbItem(57 /* Meta */, 'nope'),
                kbItem(6 /* Alt */, 'nope'),
                kbItem(4 /* Shift */, 'nope'),
                kbItem(2048 /* CtrlCmd */, 'nope'),
                kbItem(256 /* WinCtrl */, 'nope'),
                kbItem(512 /* Alt */, 'nope'),
                kbItem(1024 /* Shift */, 'nope'),
            ]);
            function assertIsIgnored(keybinding) {
                let shouldPreventDefault = kbService.testDispatch(keybinding);
                assert.equal(shouldPreventDefault, false);
                assert.deepEqual(executeCommandCalls, []);
                assert.deepEqual(showMessageCalls, []);
                assert.deepEqual(statusMessageCalls, []);
                assert.deepEqual(statusMessageCallsDisposed, []);
                executeCommandCalls = [];
                showMessageCalls = [];
                statusMessageCalls = [];
                statusMessageCallsDisposed = [];
            }
            assertIsIgnored(5 /* Ctrl */);
            assertIsIgnored(57 /* Meta */);
            assertIsIgnored(6 /* Alt */);
            assertIsIgnored(4 /* Shift */);
            assertIsIgnored(2048 /* CtrlCmd */);
            assertIsIgnored(256 /* WinCtrl */);
            assertIsIgnored(512 /* Alt */);
            assertIsIgnored(1024 /* Shift */);
            kbService.dispose();
        });
        test('can trigger command that is sharing keybinding with chord', () => {
            let kbService = createTestKeybindingService([
                kbItem(keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 54 /* KEY_X */), 'chordCommand'),
                kbItem(2048 /* CtrlCmd */ | 41 /* KEY_K */, 'simpleCommand', contextkey_1.ContextKeyExpr.has('key1')),
            ]);
            // send Ctrl/Cmd + K
            currentContextValue = createContext({
                key1: true
            });
            let shouldPreventDefault = kbService.testDispatch(2048 /* CtrlCmd */ | 41 /* KEY_K */);
            assert.equal(shouldPreventDefault, true);
            assert.deepEqual(executeCommandCalls, [{
                    commandId: 'simpleCommand',
                    args: [null]
                }]);
            assert.deepEqual(showMessageCalls, []);
            assert.deepEqual(statusMessageCalls, []);
            assert.deepEqual(statusMessageCallsDisposed, []);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            // send Ctrl/Cmd + K
            currentContextValue = createContext({});
            shouldPreventDefault = kbService.testDispatch(2048 /* CtrlCmd */ | 41 /* KEY_K */);
            assert.equal(shouldPreventDefault, true);
            assert.deepEqual(executeCommandCalls, []);
            assert.deepEqual(showMessageCalls, []);
            assert.deepEqual(statusMessageCalls, [
                `(${toUsLabel(2048 /* CtrlCmd */ | 41 /* KEY_K */)}) was pressed. Waiting for second key of chord...`
            ]);
            assert.deepEqual(statusMessageCallsDisposed, []);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            // send Ctrl/Cmd + X
            currentContextValue = createContext({});
            shouldPreventDefault = kbService.testDispatch(2048 /* CtrlCmd */ | 54 /* KEY_X */);
            assert.equal(shouldPreventDefault, true);
            assert.deepEqual(executeCommandCalls, [{
                    commandId: 'chordCommand',
                    args: [null]
                }]);
            assert.deepEqual(showMessageCalls, []);
            assert.deepEqual(statusMessageCalls, []);
            assert.deepEqual(statusMessageCallsDisposed, [
                `(${toUsLabel(2048 /* CtrlCmd */ | 41 /* KEY_K */)}) was pressed. Waiting for second key of chord...`
            ]);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            kbService.dispose();
        });
        test('cannot trigger chord if command is overwriting', () => {
            let kbService = createTestKeybindingService([
                kbItem(keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 54 /* KEY_X */), 'chordCommand', contextkey_1.ContextKeyExpr.has('key1')),
                kbItem(2048 /* CtrlCmd */ | 41 /* KEY_K */, 'simpleCommand'),
            ]);
            // send Ctrl/Cmd + K
            currentContextValue = createContext({});
            let shouldPreventDefault = kbService.testDispatch(2048 /* CtrlCmd */ | 41 /* KEY_K */);
            assert.equal(shouldPreventDefault, true);
            assert.deepEqual(executeCommandCalls, [{
                    commandId: 'simpleCommand',
                    args: [null]
                }]);
            assert.deepEqual(showMessageCalls, []);
            assert.deepEqual(statusMessageCalls, []);
            assert.deepEqual(statusMessageCallsDisposed, []);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            // send Ctrl/Cmd + K
            currentContextValue = createContext({
                key1: true
            });
            shouldPreventDefault = kbService.testDispatch(2048 /* CtrlCmd */ | 41 /* KEY_K */);
            assert.equal(shouldPreventDefault, true);
            assert.deepEqual(executeCommandCalls, [{
                    commandId: 'simpleCommand',
                    args: [null]
                }]);
            assert.deepEqual(showMessageCalls, []);
            assert.deepEqual(statusMessageCalls, []);
            assert.deepEqual(statusMessageCallsDisposed, []);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            // send Ctrl/Cmd + X
            currentContextValue = createContext({
                key1: true
            });
            shouldPreventDefault = kbService.testDispatch(2048 /* CtrlCmd */ | 54 /* KEY_X */);
            assert.equal(shouldPreventDefault, false);
            assert.deepEqual(executeCommandCalls, []);
            assert.deepEqual(showMessageCalls, []);
            assert.deepEqual(statusMessageCalls, []);
            assert.deepEqual(statusMessageCallsDisposed, []);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            kbService.dispose();
        });
        test('can have spying command', () => {
            let kbService = createTestKeybindingService([
                kbItem(2048 /* CtrlCmd */ | 41 /* KEY_K */, '^simpleCommand'),
            ]);
            // send Ctrl/Cmd + K
            currentContextValue = createContext({});
            let shouldPreventDefault = kbService.testDispatch(2048 /* CtrlCmd */ | 41 /* KEY_K */);
            assert.equal(shouldPreventDefault, false);
            assert.deepEqual(executeCommandCalls, [{
                    commandId: 'simpleCommand',
                    args: [null]
                }]);
            assert.deepEqual(showMessageCalls, []);
            assert.deepEqual(statusMessageCalls, []);
            assert.deepEqual(statusMessageCallsDisposed, []);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            kbService.dispose();
        });
    });
});
//# sourceMappingURL=abstractKeybindingService.test.js.map