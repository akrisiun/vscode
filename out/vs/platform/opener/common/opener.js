/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle"], function (require, exports, instantiation_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IOpenerService = instantiation_1.createDecorator('openerService');
    exports.NullOpenerService = Object.freeze({
        _serviceBrand: undefined,
        registerOpener() { return lifecycle_1.Disposable.None; },
        registerValidator() { return lifecycle_1.Disposable.None; },
        registerExternalUriResolver() { return lifecycle_1.Disposable.None; },
        open() { return Promise.resolve(false); },
        async resolveExternalUri(uri) { return { resolved: uri, dispose() { } }; },
    });
});
//# sourceMappingURL=opener.js.map