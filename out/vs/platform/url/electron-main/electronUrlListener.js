/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/platform/url/common/url", "vs/platform/product/common/product", "electron", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/platform/windows/electron-main/windows", "vs/base/common/platform", "vs/base/common/arrays"], function (require, exports, event_1, url_1, product_1, electron_1, uri_1, lifecycle_1, windows_1, platform_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function uriFromRawUrl(url) {
        try {
            return uri_1.URI.parse(url);
        }
        catch (e) {
            return null;
        }
    }
    let ElectronURLListener = class ElectronURLListener {
        constructor(initial, urlService, windowsMainService) {
            this.urlService = urlService;
            this.disposables = [];
            const globalBuffer = (global.getOpenUrls() || []);
            const rawBuffer = [
                ...(typeof initial === 'string' ? [initial] : initial),
                ...globalBuffer
            ];
            const buffer = arrays_1.coalesce(rawBuffer.map(uriFromRawUrl));
            const flush = () => buffer.forEach(uri => {
                if (uri) {
                    urlService.open(uri);
                }
            });
            if (platform_1.isWindows) {
                electron_1.app.setAsDefaultProtocolClient(product_1.default.urlProtocol, process.execPath, ['--open-url', '--']);
            }
            const onOpenElectronUrl = event_1.Event.map(event_1.Event.fromNodeEventEmitter(electron_1.app, 'open-url', (event, url) => ({ event, url })), ({ event, url }) => {
                // always prevent default and return the url as string
                event.preventDefault();
                return url;
            });
            const onOpenUrl = event_1.Event.filter(event_1.Event.map(onOpenElectronUrl, uriFromRawUrl), uri => !!uri);
            onOpenUrl(this.urlService.open, this.urlService, this.disposables);
            const isWindowReady = windowsMainService.getWindows()
                .filter(w => w.isReady)
                .length > 0;
            if (isWindowReady) {
                flush();
            }
            else {
                event_1.Event.once(windowsMainService.onWindowReady)(flush);
            }
        }
        dispose() {
            this.disposables = lifecycle_1.dispose(this.disposables);
        }
    };
    ElectronURLListener = __decorate([
        __param(1, url_1.IURLService),
        __param(2, windows_1.IWindowsMainService)
    ], ElectronURLListener);
    exports.ElectronURLListener = ElectronURLListener;
});
//# sourceMappingURL=electronUrlListener.js.map