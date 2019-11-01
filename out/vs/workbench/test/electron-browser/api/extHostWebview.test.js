/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/api/common/extHostWebview", "vs/workbench/test/electron-browser/api/mock", "./testRPCProtocol", "vs/base/common/uri"], function (require, exports, assert, extHostWebview_1, mock_1, testRPCProtocol_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostWebview', () => {
        test('Cannot register multiple serializers for the same view type', async () => {
            const viewType = 'view.type';
            const shape = createNoopMainThreadWebviews();
            const extHostWebviews = new extHostWebview_1.ExtHostWebviews(testRPCProtocol_1.SingleProxyRPCProtocol(shape), {
                webviewCspSource: '',
                webviewResourceRoot: '',
                isExtensionDevelopmentDebug: false,
            });
            let lastInvokedDeserializer = undefined;
            class NoopSerializer {
                async deserializeWebviewPanel(_webview, _state) {
                    lastInvokedDeserializer = this;
                }
            }
            const serializerA = new NoopSerializer();
            const serializerB = new NoopSerializer();
            const serializerARegistration = extHostWebviews.registerWebviewPanelSerializer(viewType, serializerA);
            await extHostWebviews.$deserializeWebviewPanel('x', viewType, 'title', {}, 0, {});
            assert.strictEqual(lastInvokedDeserializer, serializerA);
            assert.throws(() => extHostWebviews.registerWebviewPanelSerializer(viewType, serializerB), 'Should throw when registering two serializers for the same view');
            serializerARegistration.dispose();
            extHostWebviews.registerWebviewPanelSerializer(viewType, serializerB);
            await extHostWebviews.$deserializeWebviewPanel('x', viewType, 'title', {}, 0, {});
            assert.strictEqual(lastInvokedDeserializer, serializerB);
        });
        test('asWebviewUri for desktop vscode-resource scheme', () => {
            const shape = createNoopMainThreadWebviews();
            const extHostWebviews = new extHostWebview_1.ExtHostWebviews(testRPCProtocol_1.SingleProxyRPCProtocol(shape), {
                webviewCspSource: '',
                webviewResourceRoot: 'vscode-resource://{{resource}}',
                isExtensionDevelopmentDebug: false,
            });
            const webview = extHostWebviews.createWebviewPanel({}, 'type', 'title', 1, {});
            assert.strictEqual(webview.webview.asWebviewUri(uri_1.URI.parse('file:///Users/codey/file.html')).toString(), 'vscode-resource://file///Users/codey/file.html', 'Unix basic');
            assert.strictEqual(webview.webview.asWebviewUri(uri_1.URI.parse('file:///Users/codey/file.html#frag')).toString(), 'vscode-resource://file///Users/codey/file.html#frag', 'Unix should preserve fragment');
            assert.strictEqual(webview.webview.asWebviewUri(uri_1.URI.parse('file:///Users/codey/f%20ile.html')).toString(), 'vscode-resource://file///Users/codey/f%20ile.html', 'Unix with encoding');
            assert.strictEqual(webview.webview.asWebviewUri(uri_1.URI.parse('file://localhost/Users/codey/file.html')).toString(), 'vscode-resource://file//localhost/Users/codey/file.html', 'Unix should preserve authority');
            assert.strictEqual(webview.webview.asWebviewUri(uri_1.URI.parse('file:///c:/codey/file.txt')).toString(), 'vscode-resource://file///c%3A/codey/file.txt', 'Windows C drive');
        });
        test('asWebviewUri for web endpoint', () => {
            const shape = createNoopMainThreadWebviews();
            const extHostWebviews = new extHostWebview_1.ExtHostWebviews(testRPCProtocol_1.SingleProxyRPCProtocol(shape), {
                webviewCspSource: '',
                webviewResourceRoot: `https://{{uuid}}.webview.contoso.com/commit/{{resource}}`,
                isExtensionDevelopmentDebug: false,
            });
            const webview = extHostWebviews.createWebviewPanel({}, 'type', 'title', 1, {});
            function stripEndpointUuid(input) {
                return input.replace(/^https:\/\/[^\.]+?\./, '');
            }
            assert.strictEqual(stripEndpointUuid(webview.webview.asWebviewUri(uri_1.URI.parse('file:///Users/codey/file.html')).toString()), 'webview.contoso.com/commit/file///Users/codey/file.html', 'Unix basic');
            assert.strictEqual(stripEndpointUuid(webview.webview.asWebviewUri(uri_1.URI.parse('file:///Users/codey/file.html#frag')).toString()), 'webview.contoso.com/commit/file///Users/codey/file.html#frag', 'Unix should preserve fragment');
            assert.strictEqual(stripEndpointUuid(webview.webview.asWebviewUri(uri_1.URI.parse('file:///Users/codey/f%20ile.html')).toString()), 'webview.contoso.com/commit/file///Users/codey/f%20ile.html', 'Unix with encoding');
            assert.strictEqual(stripEndpointUuid(webview.webview.asWebviewUri(uri_1.URI.parse('file://localhost/Users/codey/file.html')).toString()), 'webview.contoso.com/commit/file//localhost/Users/codey/file.html', 'Unix should preserve authority');
            assert.strictEqual(stripEndpointUuid(webview.webview.asWebviewUri(uri_1.URI.parse('file:///c:/codey/file.txt')).toString()), 'webview.contoso.com/commit/file///c%3A/codey/file.txt', 'Windows C drive');
        });
    });
    function createNoopMainThreadWebviews() {
        return new class extends mock_1.mock() {
            $createWebviewPanel() { }
            $registerSerializer() { }
            $unregisterSerializer() { }
        };
    }
});
//# sourceMappingURL=extHostWebview.test.js.map