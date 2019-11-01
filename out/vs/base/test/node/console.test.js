/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/console", "vs/base/common/path"], function (require, exports, assert, console_1, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Console', () => {
        test('getFirstFrame', () => {
            let stack = 'at vscode.commands.registerCommand (/Users/someone/Desktop/test-ts/out/src/extension.js:18:17)';
            let frame = console_1.getFirstFrame(stack);
            assert.equal(frame.uri.fsPath, path_1.normalize('/Users/someone/Desktop/test-ts/out/src/extension.js'));
            assert.equal(frame.line, 18);
            assert.equal(frame.column, 17);
            stack = 'at /Users/someone/Desktop/test-ts/out/src/extension.js:18:17';
            frame = console_1.getFirstFrame(stack);
            assert.equal(frame.uri.fsPath, path_1.normalize('/Users/someone/Desktop/test-ts/out/src/extension.js'));
            assert.equal(frame.line, 18);
            assert.equal(frame.column, 17);
            stack = 'at c:\\Users\\someone\\Desktop\\end-js\\extension.js:18:17';
            frame = console_1.getFirstFrame(stack);
            assert.equal(frame.uri.fsPath, 'c:\\Users\\someone\\Desktop\\end-js\\extension.js');
            assert.equal(frame.line, 18);
            assert.equal(frame.column, 17);
            stack = 'at e.$executeContributedCommand(c:\\Users\\someone\\Desktop\\end-js\\extension.js:18:17)';
            frame = console_1.getFirstFrame(stack);
            assert.equal(frame.uri.fsPath, 'c:\\Users\\someone\\Desktop\\end-js\\extension.js');
            assert.equal(frame.line, 18);
            assert.equal(frame.column, 17);
            stack = 'at /Users/someone/Desktop/test-ts/out/src/extension.js:18:17\nat /Users/someone/Desktop/test-ts/out/src/other.js:28:27\nat /Users/someone/Desktop/test-ts/out/src/more.js:38:37';
            frame = console_1.getFirstFrame(stack);
            assert.equal(frame.uri.fsPath, path_1.normalize('/Users/someone/Desktop/test-ts/out/src/extension.js'));
            assert.equal(frame.line, 18);
            assert.equal(frame.column, 17);
        });
    });
});
//# sourceMappingURL=console.test.js.map