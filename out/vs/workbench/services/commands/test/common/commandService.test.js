define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/platform/commands/common/commands", "vs/workbench/services/commands/common/commandService", "vs/workbench/services/extensions/common/extensions", "vs/platform/instantiation/common/instantiationService", "vs/platform/log/common/log"], function (require, exports, assert, lifecycle_1, commands_1, commandService_1, extensions_1, instantiationService_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('CommandService', function () {
        let commandRegistration;
        setup(function () {
            commandRegistration = commands_1.CommandsRegistry.registerCommand('foo', function () { });
        });
        teardown(function () {
            commandRegistration.dispose();
        });
        test('activateOnCommand', () => {
            let lastEvent;
            let service = new commandService_1.CommandService(new instantiationService_1.InstantiationService(), new class extends extensions_1.NullExtensionService {
                activateByEvent(activationEvent) {
                    lastEvent = activationEvent;
                    return super.activateByEvent(activationEvent);
                }
            }, new log_1.NullLogService());
            return service.executeCommand('foo').then(() => {
                assert.ok(lastEvent, 'onCommand:foo');
                return service.executeCommand('unknownCommandId');
            }).then(() => {
                assert.ok(false);
            }, () => {
                assert.ok(lastEvent, 'onCommand:unknownCommandId');
            });
        });
        test('fwd activation error', async function () {
            const extensionService = new class extends extensions_1.NullExtensionService {
                activateByEvent(activationEvent) {
                    return Promise.reject(new Error('bad_activate'));
                }
            };
            let service = new commandService_1.CommandService(new instantiationService_1.InstantiationService(), extensionService, new log_1.NullLogService());
            await extensionService.whenInstalledExtensionsRegistered();
            return service.executeCommand('foo').then(() => assert.ok(false), err => {
                assert.equal(err.message, 'bad_activate');
            });
        });
        test('!onReady, but executeCommand', function () {
            let callCounter = 0;
            let reg = commands_1.CommandsRegistry.registerCommand('bar', () => callCounter += 1);
            let service = new commandService_1.CommandService(new instantiationService_1.InstantiationService(), new class extends extensions_1.NullExtensionService {
                whenInstalledExtensionsRegistered() {
                    return new Promise(_resolve => { });
                }
            }, new log_1.NullLogService());
            service.executeCommand('bar');
            assert.equal(callCounter, 1);
            reg.dispose();
        });
        test('issue #34913: !onReady, unknown command', function () {
            let callCounter = 0;
            let resolveFunc;
            const whenInstalledExtensionsRegistered = new Promise(_resolve => { resolveFunc = _resolve; });
            let service = new commandService_1.CommandService(new instantiationService_1.InstantiationService(), new class extends extensions_1.NullExtensionService {
                whenInstalledExtensionsRegistered() {
                    return whenInstalledExtensionsRegistered;
                }
            }, new log_1.NullLogService());
            let r = service.executeCommand('bar');
            assert.equal(callCounter, 0);
            let reg = commands_1.CommandsRegistry.registerCommand('bar', () => callCounter += 1);
            resolveFunc(true);
            return r.then(() => {
                reg.dispose();
                assert.equal(callCounter, 1);
            });
        });
        test('Stop waiting for * extensions to activate when trigger is satisfied #62457', function () {
            let callCounter = 0;
            const dispoables = new lifecycle_1.DisposableStore();
            let events = [];
            let service = new commandService_1.CommandService(new instantiationService_1.InstantiationService(), new class extends extensions_1.NullExtensionService {
                activateByEvent(event) {
                    events.push(event);
                    if (event === '*') {
                        return new Promise(() => { }); //forever promise...
                    }
                    if (event.indexOf('onCommand:') === 0) {
                        return new Promise(resolve => {
                            setTimeout(() => {
                                let reg = commands_1.CommandsRegistry.registerCommand(event.substr('onCommand:'.length), () => {
                                    callCounter += 1;
                                });
                                dispoables.add(reg);
                                resolve();
                            }, 0);
                        });
                    }
                    return Promise.resolve();
                }
            }, new log_1.NullLogService());
            return service.executeCommand('farboo').then(() => {
                assert.equal(callCounter, 1);
                assert.deepEqual(events.sort(), ['*', 'onCommand:farboo'].sort());
            }).finally(() => {
                dispoables.dispose();
            });
        });
        test('issue #71471: wait for onCommand activation even if a command is registered', () => {
            let expectedOrder = ['registering command', 'resolving activation event', 'executing command'];
            let actualOrder = [];
            const disposables = new lifecycle_1.DisposableStore();
            let service = new commandService_1.CommandService(new instantiationService_1.InstantiationService(), new class extends extensions_1.NullExtensionService {
                activateByEvent(event) {
                    if (event === '*') {
                        return new Promise(() => { }); //forever promise...
                    }
                    if (event.indexOf('onCommand:') === 0) {
                        return new Promise(resolve => {
                            setTimeout(() => {
                                // Register the command after some time
                                actualOrder.push('registering command');
                                let reg = commands_1.CommandsRegistry.registerCommand(event.substr('onCommand:'.length), () => {
                                    actualOrder.push('executing command');
                                });
                                disposables.add(reg);
                                setTimeout(() => {
                                    // Resolve the activation event after some more time
                                    actualOrder.push('resolving activation event');
                                    resolve();
                                }, 10);
                            }, 10);
                        });
                    }
                    return Promise.resolve();
                }
            }, new log_1.NullLogService());
            return service.executeCommand('farboo2').then(() => {
                assert.deepEqual(actualOrder, expectedOrder);
            }).finally(() => {
                disposables.dispose();
            });
        });
    });
});
//# sourceMappingURL=commandService.test.js.map