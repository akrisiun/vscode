/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform"], function (require, exports, assert, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Windows Native Helpers', () => {
        if (!platform_1.isWindows) {
            return;
        }
        test('windows-mutex', async () => {
            const mutex = await new Promise((resolve_1, reject_1) => { require(['windows-mutex'], resolve_1, reject_1); });
            assert.ok(mutex && typeof mutex.isActive === 'function', 'Unable to load windows-mutex dependency.');
            assert.ok(typeof mutex.isActive === 'function', 'Unable to load windows-mutex dependency.');
        });
        test('windows-foreground-love', async () => {
            const foregroundLove = await new Promise((resolve_2, reject_2) => { require(['windows-foreground-love'], resolve_2, reject_2); });
            assert.ok(foregroundLove && typeof foregroundLove.allowSetForegroundWindow === 'function', 'Unable to load windows-foreground-love dependency.');
        });
        test('windows-process-tree', async () => {
            const processTree = await new Promise((resolve_3, reject_3) => { require(['windows-process-tree'], resolve_3, reject_3); });
            assert.ok(processTree && typeof processTree.getProcessTree === 'function', 'Unable to load windows-process-tree dependency.');
        });
        test('vscode-windows-ca-certs', async () => {
            const windowsCerts = await new Promise((resolve_4, reject_4) => { require(['vscode-windows-ca-certs'], resolve_4, reject_4); });
            assert.ok(windowsCerts, 'Unable to load vscode-windows-ca-certs dependency.');
        });
        test('vscode-windows-registry', async () => {
            const windowsRegistry = await new Promise((resolve_5, reject_5) => { require(['vscode-windows-registry'], resolve_5, reject_5); });
            assert.ok(windowsRegistry && typeof windowsRegistry.GetStringRegKey === 'function', 'Unable to load vscode-windows-registry dependency.');
        });
    });
});
//# sourceMappingURL=nativeHelpers.test.js.map