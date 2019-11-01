/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/api/common/extHostCommands", "vs/platform/commands/common/commands", "./testRPCProtocol", "vs/workbench/test/electron-browser/api/mock", "vs/platform/log/common/log"], function (require, exports, assert, extHostCommands_1, commands_1, testRPCProtocol_1, mock_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostCommands', function () {
        test('dispose calls unregister', function () {
            let lastUnregister;
            const shape = new class extends mock_1.mock() {
                $registerCommand(id) {
                    //
                }
                $unregisterCommand(id) {
                    lastUnregister = id;
                }
            };
            const commands = new extHostCommands_1.ExtHostCommands(testRPCProtocol_1.SingleProxyRPCProtocol(shape), new log_1.NullLogService());
            commands.registerCommand(true, 'foo', () => { }).dispose();
            assert.equal(lastUnregister, 'foo');
            assert.equal(commands_1.CommandsRegistry.getCommand('foo'), undefined);
        });
        test('dispose bubbles only once', function () {
            let unregisterCounter = 0;
            const shape = new class extends mock_1.mock() {
                $registerCommand(id) {
                    //
                }
                $unregisterCommand(id) {
                    unregisterCounter += 1;
                }
            };
            const commands = new extHostCommands_1.ExtHostCommands(testRPCProtocol_1.SingleProxyRPCProtocol(shape), new log_1.NullLogService());
            const reg = commands.registerCommand(true, 'foo', () => { });
            reg.dispose();
            reg.dispose();
            reg.dispose();
            assert.equal(unregisterCounter, 1);
        });
        test('execute with retry', async function () {
            let count = 0;
            const shape = new class extends mock_1.mock() {
                $registerCommand(id) {
                    //
                }
                async $executeCommand(id, args, retry) {
                    count++;
                    assert.equal(retry, count === 1);
                    if (count === 1) {
                        assert.equal(retry, true);
                        throw new Error('$executeCommand:retry');
                    }
                    else {
                        assert.equal(retry, false);
                        return 17;
                    }
                }
            };
            const commands = new extHostCommands_1.ExtHostCommands(testRPCProtocol_1.SingleProxyRPCProtocol(shape), new log_1.NullLogService());
            const result = await commands.executeCommand('fooo', [this, true]);
            assert.equal(result, 17);
            assert.equal(count, 2);
        });
    });
});
//# sourceMappingURL=extHostCommands.test.js.map