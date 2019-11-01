/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/uri", "vs/base/common/errors", "vs/base/common/platform"], function (require, exports, path_1, uri_1, errors_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DeferredPromise {
        constructor() {
            this.p = new Promise((c, e) => {
                this.completeCallback = c;
                this.errorCallback = e;
            });
        }
        complete(value) {
            return new Promise(resolve => {
                process.nextTick(() => {
                    this.completeCallback(value);
                    resolve();
                });
            });
        }
        error(err) {
            return new Promise(resolve => {
                process.nextTick(() => {
                    this.errorCallback(err);
                    resolve();
                });
            });
        }
        cancel() {
            process.nextTick(() => {
                this.errorCallback(errors_1.canceled());
            });
        }
    }
    exports.DeferredPromise = DeferredPromise;
    function toResource(path) {
        if (platform_1.isWindows) {
            return uri_1.URI.file(path_1.join('C:\\', Buffer.from(this.test.fullTitle()).toString('base64'), path));
        }
        return uri_1.URI.file(path_1.join('/', Buffer.from(this.test.fullTitle()).toString('base64'), path));
    }
    exports.toResource = toResource;
    function suiteRepeat(n, description, callback) {
        for (let i = 0; i < n; i++) {
            suite(`${description} (iteration ${i})`, callback);
        }
    }
    exports.suiteRepeat = suiteRepeat;
    function testRepeat(n, description, callback) {
        for (let i = 0; i < n; i++) {
            test(`${description} (iteration ${i})`, callback);
        }
    }
    exports.testRepeat = testRepeat;
    function testRepeatOnly(n, description, callback) {
        suite.only('repeat', () => testRepeat(n, description, callback));
    }
    exports.testRepeatOnly = testRepeatOnly;
});
//# sourceMappingURL=utils.js.map