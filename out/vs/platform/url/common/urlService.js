/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/map", "vs/base/common/async", "vs/base/common/lifecycle"], function (require, exports, map_1, async_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AbstractURLService extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.handlers = new Set();
        }
        open(uri, options) {
            const handlers = map_1.values(this.handlers);
            return async_1.first(handlers.map(h => () => h.handleURL(uri, options)), undefined, false).then(val => val || false);
        }
        registerHandler(handler) {
            this.handlers.add(handler);
            return lifecycle_1.toDisposable(() => this.handlers.delete(handler));
        }
    }
    exports.AbstractURLService = AbstractURLService;
});
//# sourceMappingURL=urlService.js.map