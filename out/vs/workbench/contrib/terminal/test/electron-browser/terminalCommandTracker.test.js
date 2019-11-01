/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "xterm", "vs/workbench/contrib/terminal/browser/addons/commandTrackerAddon", "vs/base/common/platform"], function (require, exports, assert, xterm_1, commandTrackerAddon_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function writePromise(term, data) {
        return new Promise(r => term.write(data, r));
    }
    const ROWS = 10;
    const COLS = 10;
    suite('Workbench - TerminalCommandTracker', () => {
        let xterm;
        let commandTracker;
        setup(async () => {
            xterm = new xterm_1.Terminal({
                cols: COLS,
                rows: ROWS
            });
            // Fill initial viewport
            for (let i = 0; i < ROWS - 1; i++) {
                await writePromise(xterm, `${i}\n`);
            }
            commandTracker = new commandTrackerAddon_1.CommandTrackerAddon();
            xterm.loadAddon(commandTracker);
        });
        suite('Command tracking', () => {
            test('should track commands when the prompt is of sufficient size', async () => {
                assert.equal(xterm.markers.length, 0);
                await writePromise(xterm, '\x1b[3G'); // Move cursor to column 3
                xterm._core._onKey.fire({ key: '\x0d' });
                assert.equal(xterm.markers.length, 1);
            });
            test('should not track commands when the prompt is too small', async () => {
                assert.equal(xterm.markers.length, 0);
                await writePromise(xterm, '\x1b[2G'); // Move cursor to column 2
                xterm._core._onKey.fire({ key: '\x0d' });
                assert.equal(xterm.markers.length, 0);
            });
        });
        suite('Commands', () => {
            test('should scroll to the next and previous commands', async () => {
                await writePromise(xterm, '\x1b[3G'); // Move cursor to column 3
                xterm._core._onKey.fire({ key: '\x0d' }); // Mark line #10
                assert.equal(xterm.markers[0].line, 9);
                for (let i = 0; i < 20; i++) {
                    await writePromise(xterm, `\r\n`);
                }
                assert.equal(xterm.buffer.baseY, 20);
                assert.equal(xterm.buffer.viewportY, 20);
                // Scroll to marker
                commandTracker.scrollToPreviousCommand();
                assert.equal(xterm.buffer.viewportY, 9);
                // Scroll to top boundary
                commandTracker.scrollToPreviousCommand();
                assert.equal(xterm.buffer.viewportY, 0);
                // Scroll to marker
                commandTracker.scrollToNextCommand();
                assert.equal(xterm.buffer.viewportY, 9);
                // Scroll to bottom boundary
                commandTracker.scrollToNextCommand();
                assert.equal(xterm.buffer.viewportY, 20);
            });
            test('should select to the next and previous commands', async () => {
                window.matchMedia = () => {
                    return { addListener: () => { } };
                };
                xterm.open(document.createElement('div'));
                await writePromise(xterm, '\r0');
                await writePromise(xterm, '\n\r1');
                await writePromise(xterm, '\x1b[3G'); // Move cursor to column 3
                xterm._core._onKey.fire({ key: '\x0d' }); // Mark line
                assert.equal(xterm.markers[0].line, 10);
                await writePromise(xterm, '\n\r2');
                await writePromise(xterm, '\x1b[3G'); // Move cursor to column 3
                xterm._core._onKey.fire({ key: '\x0d' }); // Mark line
                assert.equal(xterm.markers[1].line, 11);
                await writePromise(xterm, '\n\r3');
                assert.equal(xterm.buffer.baseY, 3);
                assert.equal(xterm.buffer.viewportY, 3);
                assert.equal(xterm.getSelection(), '');
                commandTracker.selectToPreviousCommand();
                assert.equal(xterm.getSelection(), '2');
                commandTracker.selectToPreviousCommand();
                assert.equal(xterm.getSelection(), platform_1.isWindows ? '1\r\n2' : '1\n2');
                commandTracker.selectToNextCommand();
                assert.equal(xterm.getSelection(), '2');
                commandTracker.selectToNextCommand();
                assert.equal(xterm.getSelection(), platform_1.isWindows ? '\r\n' : '\n');
            });
            test('should select to the next and previous lines & commands', async () => {
                window.matchMedia = () => {
                    return { addListener: () => { } };
                };
                xterm.open(document.createElement('div'));
                await writePromise(xterm, '\r0');
                await writePromise(xterm, '\n\r1');
                await writePromise(xterm, '\x1b[3G'); // Move cursor to column 3
                xterm._core._onKey.fire({ key: '\x0d' }); // Mark line
                assert.equal(xterm.markers[0].line, 10);
                await writePromise(xterm, '\n\r2');
                await writePromise(xterm, '\x1b[3G'); // Move cursor to column 3
                xterm._core._onKey.fire({ key: '\x0d' }); // Mark line
                assert.equal(xterm.markers[1].line, 11);
                await writePromise(xterm, '\n\r3');
                assert.equal(xterm.buffer.baseY, 3);
                assert.equal(xterm.buffer.viewportY, 3);
                assert.equal(xterm.getSelection(), '');
                commandTracker.selectToPreviousLine();
                assert.equal(xterm.getSelection(), '2');
                commandTracker.selectToNextLine();
                commandTracker.selectToNextLine();
                assert.equal(xterm.getSelection(), '3');
                commandTracker.selectToPreviousCommand();
                commandTracker.selectToPreviousCommand();
                commandTracker.selectToNextLine();
                assert.equal(xterm.getSelection(), '2');
                commandTracker.selectToPreviousCommand();
                assert.equal(xterm.getSelection(), platform_1.isWindows ? '1\r\n2' : '1\n2');
                commandTracker.selectToPreviousLine();
                assert.equal(xterm.getSelection(), platform_1.isWindows ? '0\r\n1\r\n2' : '0\n1\n2');
            });
        });
    });
});
//# sourceMappingURL=terminalCommandTracker.test.js.map