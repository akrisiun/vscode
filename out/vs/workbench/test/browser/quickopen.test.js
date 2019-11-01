/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/registry/common/platform", "vs/workbench/browser/quickopen", "vs/workbench/browser/parts/editor/editor.contribution"], function (require, exports, assert, platform_1, quickopen_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestQuickOpenService {
        constructor(callback) {
            this.callback = callback;
        }
        accept() {
        }
        focus() {
        }
        close() {
        }
        show(prefix, options) {
            if (this.callback) {
                this.callback(prefix);
            }
            return Promise.resolve();
        }
        get onShow() {
            return null;
        }
        get onHide() {
            return null;
        }
        dispose() { }
        navigate() { }
    }
    exports.TestQuickOpenService = TestQuickOpenService;
    suite('QuickOpen', () => {
        class TestHandler extends quickopen_1.QuickOpenHandler {
        }
        test('QuickOpen Handler and Registry', () => {
            let registry = (platform_1.Registry.as(quickopen_1.Extensions.Quickopen));
            let handler = new quickopen_1.QuickOpenHandlerDescriptor(TestHandler, 'testhandler', ',', 'Handler', null);
            registry.registerQuickOpenHandler(handler);
            assert(registry.getQuickOpenHandler(',') === handler);
            let handlers = registry.getQuickOpenHandlers();
            assert(handlers.some((handler) => handler.prefix === ','));
        });
        test('QuickOpen Action', () => {
            let defaultAction = new quickopen_1.QuickOpenAction('id', 'label', (undefined), new TestQuickOpenService((prefix) => assert(!prefix)));
            let prefixAction = new quickopen_1.QuickOpenAction('id', 'label', ',', new TestQuickOpenService((prefix) => assert(!!prefix)));
            defaultAction.run();
            prefixAction.run();
        });
    });
});
//# sourceMappingURL=quickopen.test.js.map