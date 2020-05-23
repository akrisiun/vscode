define(["require", "exports", "assert", "vs/platform/commands/common/commands"], function (require, exports, assert, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Command Tests', function () {
        test('register command - no handler', function () {
            assert.throws(() => commands_1.CommandsRegistry.registerCommand('foo', null));
        });
        test('register/dispose', () => {
            const command = function () { };
            const reg = commands_1.CommandsRegistry.registerCommand('foo', command);
            assert.ok(commands_1.CommandsRegistry.getCommand('foo').handler === command);
            reg.dispose();
            assert.ok(commands_1.CommandsRegistry.getCommand('foo') === undefined);
        });
        test('register/register/dispose', () => {
            const command1 = function () { };
            const command2 = function () { };
            // dispose overriding command
            let reg1 = commands_1.CommandsRegistry.registerCommand('foo', command1);
            assert.ok(commands_1.CommandsRegistry.getCommand('foo').handler === command1);
            let reg2 = commands_1.CommandsRegistry.registerCommand('foo', command2);
            assert.ok(commands_1.CommandsRegistry.getCommand('foo').handler === command2);
            reg2.dispose();
            assert.ok(commands_1.CommandsRegistry.getCommand('foo').handler === command1);
            reg1.dispose();
            assert.ok(commands_1.CommandsRegistry.getCommand('foo') === undefined);
            // dispose override command first
            reg1 = commands_1.CommandsRegistry.registerCommand('foo', command1);
            reg2 = commands_1.CommandsRegistry.registerCommand('foo', command2);
            assert.ok(commands_1.CommandsRegistry.getCommand('foo').handler === command2);
            reg1.dispose();
            assert.ok(commands_1.CommandsRegistry.getCommand('foo').handler === command2);
            reg2.dispose();
            assert.ok(commands_1.CommandsRegistry.getCommand('foo') === undefined);
        });
        test('command with description', function () {
            commands_1.CommandsRegistry.registerCommand('test', function (accessor, args) {
                assert.ok(typeof args === 'string');
            });
            commands_1.CommandsRegistry.registerCommand('test2', function (accessor, args) {
                assert.ok(typeof args === 'string');
            });
            commands_1.CommandsRegistry.registerCommand({
                id: 'test3',
                handler: function (accessor, args) {
                    return true;
                },
                description: {
                    description: 'a command',
                    args: [{ name: 'value', constraint: Number }]
                }
            });
            commands_1.CommandsRegistry.getCommands().get('test').handler.apply(undefined, [undefined, 'string']);
            commands_1.CommandsRegistry.getCommands().get('test2').handler.apply(undefined, [undefined, 'string']);
            assert.throws(() => commands_1.CommandsRegistry.getCommands().get('test3').handler.apply(undefined, [undefined, 'string']));
            assert.equal(commands_1.CommandsRegistry.getCommands().get('test3').handler.apply(undefined, [undefined, 1]), true);
        });
    });
});
//# sourceMappingURL=commands.test.js.map