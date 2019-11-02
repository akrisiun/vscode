/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/path", "vs/platform/environment/node/argv", "vs/platform/environment/node/environmentService"], function (require, exports, assert, path, argv_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('EnvironmentService', () => {
        test('parseExtensionHostPort when built', () => {
            const parse = (a) => environmentService_1.parseExtensionHostPort(argv_1.parseArgs(a, argv_1.OPTIONS), true);
            assert.deepEqual(parse([]), { port: null, break: false, debugId: undefined });
            assert.deepEqual(parse(['--debugPluginHost']), { port: null, break: false, debugId: undefined });
            assert.deepEqual(parse(['--debugPluginHost=1234']), { port: 1234, break: false, debugId: undefined });
            assert.deepEqual(parse(['--debugBrkPluginHost']), { port: null, break: false, debugId: undefined });
            assert.deepEqual(parse(['--debugBrkPluginHost=5678']), { port: 5678, break: true, debugId: undefined });
            assert.deepEqual(parse(['--debugPluginHost=1234', '--debugBrkPluginHost=5678', '--debugId=7']), { port: 5678, break: true, debugId: '7' });
            assert.deepEqual(parse(['--inspect-extensions']), { port: null, break: false, debugId: undefined });
            assert.deepEqual(parse(['--inspect-extensions=1234']), { port: 1234, break: false, debugId: undefined });
            assert.deepEqual(parse(['--inspect-brk-extensions']), { port: null, break: false, debugId: undefined });
            assert.deepEqual(parse(['--inspect-brk-extensions=5678']), { port: 5678, break: true, debugId: undefined });
            assert.deepEqual(parse(['--inspect-extensions=1234', '--inspect-brk-extensions=5678', '--debugId=7']), { port: 5678, break: true, debugId: '7' });
        });
        test('parseExtensionHostPort when unbuilt', () => {
            const parse = (a) => environmentService_1.parseExtensionHostPort(argv_1.parseArgs(a, argv_1.OPTIONS), false);
            assert.deepEqual(parse([]), { port: 5870, break: false, debugId: undefined });
            assert.deepEqual(parse(['--debugPluginHost']), { port: 5870, break: false, debugId: undefined });
            assert.deepEqual(parse(['--debugPluginHost=1234']), { port: 1234, break: false, debugId: undefined });
            assert.deepEqual(parse(['--debugBrkPluginHost']), { port: 5870, break: false, debugId: undefined });
            assert.deepEqual(parse(['--debugBrkPluginHost=5678']), { port: 5678, break: true, debugId: undefined });
            assert.deepEqual(parse(['--debugPluginHost=1234', '--debugBrkPluginHost=5678', '--debugId=7']), { port: 5678, break: true, debugId: '7' });
            assert.deepEqual(parse(['--inspect-extensions']), { port: 5870, break: false, debugId: undefined });
            assert.deepEqual(parse(['--inspect-extensions=1234']), { port: 1234, break: false, debugId: undefined });
            assert.deepEqual(parse(['--inspect-brk-extensions']), { port: 5870, break: false, debugId: undefined });
            assert.deepEqual(parse(['--inspect-brk-extensions=5678']), { port: 5678, break: true, debugId: undefined });
            assert.deepEqual(parse(['--inspect-extensions=1234', '--inspect-brk-extensions=5678', '--debugId=7']), { port: 5678, break: true, debugId: '7' });
        });
        test('userDataPath', () => {
            const parse = (a, b) => environmentService_1.parseUserDataDir(argv_1.parseArgs(a, argv_1.OPTIONS), b);
            assert.equal(parse(['--user-data-dir', './dir'], { cwd: () => '/foo', env: {} }), path.resolve('/foo/dir'), 'should use cwd when --user-data-dir is specified');
            assert.equal(parse(['--user-data-dir', './dir'], { cwd: () => '/foo', env: { 'VSCODE_CWD': '/bar' } }), path.resolve('/bar/dir'), 'should use VSCODE_CWD as the cwd when --user-data-dir is specified');
        });
        // https://github.com/microsoft/vscode/issues/78440
        test('careful with boolean file names', function () {
            let actual = argv_1.parseArgs(['-r', 'arg.txt'], argv_1.OPTIONS);
            assert(actual['reuse-window']);
            assert.deepEqual(actual._, ['arg.txt']);
            actual = argv_1.parseArgs(['-r', 'true.txt'], argv_1.OPTIONS);
            assert(actual['reuse-window']);
            assert.deepEqual(actual._, ['true.txt']);
        });
    });
});
//# sourceMappingURL=environmentService.test.js.map