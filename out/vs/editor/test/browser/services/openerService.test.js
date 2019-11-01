define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/browser/services/openerService", "vs/editor/test/browser/editorTestServices", "vs/platform/commands/common/commands"], function (require, exports, assert, lifecycle_1, uri_1, openerService_1, editorTestServices_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('OpenerService', function () {
        const editorService = new editorTestServices_1.TestCodeEditorService();
        let lastCommand;
        const commandService = new (class {
            constructor() {
                this.onWillExecuteCommand = () => lifecycle_1.Disposable.None;
                this.onDidExecuteCommand = () => lifecycle_1.Disposable.None;
            }
            executeCommand(id, ...args) {
                lastCommand = { id, args };
                return Promise.resolve(undefined);
            }
        })();
        setup(function () {
            lastCommand = undefined;
        });
        test('delegate to editorService, scheme:///fff', function () {
            const openerService = new openerService_1.OpenerService(editorService, commands_1.NullCommandService);
            openerService.open(uri_1.URI.parse('another:///somepath'));
            assert.equal(editorService.lastInput.options.selection, undefined);
        });
        test('delegate to editorService, scheme:///fff#L123', function () {
            const openerService = new openerService_1.OpenerService(editorService, commands_1.NullCommandService);
            openerService.open(uri_1.URI.parse('file:///somepath#L23'));
            assert.equal(editorService.lastInput.options.selection.startLineNumber, 23);
            assert.equal(editorService.lastInput.options.selection.startColumn, 1);
            assert.equal(editorService.lastInput.options.selection.endLineNumber, undefined);
            assert.equal(editorService.lastInput.options.selection.endColumn, undefined);
            assert.equal(editorService.lastInput.resource.fragment, '');
            openerService.open(uri_1.URI.parse('another:///somepath#L23'));
            assert.equal(editorService.lastInput.options.selection.startLineNumber, 23);
            assert.equal(editorService.lastInput.options.selection.startColumn, 1);
            openerService.open(uri_1.URI.parse('another:///somepath#L23,45'));
            assert.equal(editorService.lastInput.options.selection.startLineNumber, 23);
            assert.equal(editorService.lastInput.options.selection.startColumn, 45);
            assert.equal(editorService.lastInput.options.selection.endLineNumber, undefined);
            assert.equal(editorService.lastInput.options.selection.endColumn, undefined);
            assert.equal(editorService.lastInput.resource.fragment, '');
        });
        test('delegate to editorService, scheme:///fff#123,123', function () {
            const openerService = new openerService_1.OpenerService(editorService, commands_1.NullCommandService);
            openerService.open(uri_1.URI.parse('file:///somepath#23'));
            assert.equal(editorService.lastInput.options.selection.startLineNumber, 23);
            assert.equal(editorService.lastInput.options.selection.startColumn, 1);
            assert.equal(editorService.lastInput.options.selection.endLineNumber, undefined);
            assert.equal(editorService.lastInput.options.selection.endColumn, undefined);
            assert.equal(editorService.lastInput.resource.fragment, '');
            openerService.open(uri_1.URI.parse('file:///somepath#23,45'));
            assert.equal(editorService.lastInput.options.selection.startLineNumber, 23);
            assert.equal(editorService.lastInput.options.selection.startColumn, 45);
            assert.equal(editorService.lastInput.options.selection.endLineNumber, undefined);
            assert.equal(editorService.lastInput.options.selection.endColumn, undefined);
            assert.equal(editorService.lastInput.resource.fragment, '');
        });
        test('delegate to commandsService, command:someid', function () {
            const openerService = new openerService_1.OpenerService(editorService, commandService);
            const id = `aCommand${Math.random()}`;
            commands_1.CommandsRegistry.registerCommand(id, function () { });
            openerService.open(uri_1.URI.parse('command:' + id));
            assert.equal(lastCommand.id, id);
            assert.equal(lastCommand.args.length, 0);
            openerService.open(uri_1.URI.parse('command:' + id).with({ query: '123' }));
            assert.equal(lastCommand.id, id);
            assert.equal(lastCommand.args.length, 1);
            assert.equal(lastCommand.args[0], '123');
            openerService.open(uri_1.URI.parse('command:' + id).with({ query: JSON.stringify([12, true]) }));
            assert.equal(lastCommand.id, id);
            assert.equal(lastCommand.args.length, 2);
            assert.equal(lastCommand.args[0], 12);
            assert.equal(lastCommand.args[1], true);
        });
        test('links are protected by validators', async function () {
            const openerService = new openerService_1.OpenerService(editorService, commandService);
            openerService.registerValidator({ shouldOpen: () => Promise.resolve(false) });
            const httpResult = await openerService.open(uri_1.URI.parse('https://www.microsoft.com'));
            const httpsResult = await openerService.open(uri_1.URI.parse('https://www.microsoft.com'));
            assert.equal(httpResult, false);
            assert.equal(httpsResult, false);
        });
        test('links validated by validators go to openers', async function () {
            const openerService = new openerService_1.OpenerService(editorService, commandService);
            openerService.registerValidator({ shouldOpen: () => Promise.resolve(true) });
            let openCount = 0;
            openerService.registerOpener({
                open: (resource) => {
                    openCount++;
                    return Promise.resolve(true);
                }
            });
            await openerService.open(uri_1.URI.parse('http://microsoft.com'));
            assert.equal(openCount, 1);
            await openerService.open(uri_1.URI.parse('https://microsoft.com'));
            assert.equal(openCount, 2);
        });
        test('links validated by multiple validators', async function () {
            const openerService = new openerService_1.OpenerService(editorService, commandService);
            let v1 = 0;
            openerService.registerValidator({
                shouldOpen: () => {
                    v1++;
                    return Promise.resolve(true);
                }
            });
            let v2 = 0;
            openerService.registerValidator({
                shouldOpen: () => {
                    v2++;
                    return Promise.resolve(true);
                }
            });
            let openCount = 0;
            openerService.registerOpener({
                open: (resource) => {
                    openCount++;
                    return Promise.resolve(true);
                }
            });
            await openerService.open(uri_1.URI.parse('http://microsoft.com'));
            assert.equal(openCount, 1);
            assert.equal(v1, 1);
            assert.equal(v2, 1);
            await openerService.open(uri_1.URI.parse('https://microsoft.com'));
            assert.equal(openCount, 2);
            assert.equal(v1, 2);
            assert.equal(v2, 2);
        });
        test('links invalidated by first validator do not continue validating', async function () {
            const openerService = new openerService_1.OpenerService(editorService, commandService);
            let v1 = 0;
            openerService.registerValidator({
                shouldOpen: () => {
                    v1++;
                    return Promise.resolve(false);
                }
            });
            let v2 = 0;
            openerService.registerValidator({
                shouldOpen: () => {
                    v2++;
                    return Promise.resolve(true);
                }
            });
            let openCount = 0;
            openerService.registerOpener({
                open: (resource) => {
                    openCount++;
                    return Promise.resolve(true);
                }
            });
            await openerService.open(uri_1.URI.parse('http://microsoft.com'));
            assert.equal(openCount, 0);
            assert.equal(v1, 1);
            assert.equal(v2, 0);
            await openerService.open(uri_1.URI.parse('https://microsoft.com'));
            assert.equal(openCount, 0);
            assert.equal(v1, 2);
            assert.equal(v2, 0);
        });
    });
});
//# sourceMappingURL=openerService.test.js.map