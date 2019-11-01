/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IRemoteAuthorityResolverService = instantiation_1.createDecorator('remoteAuthorityResolverService');
    var RemoteAuthorityResolverErrorCode;
    (function (RemoteAuthorityResolverErrorCode) {
        RemoteAuthorityResolverErrorCode["Unknown"] = "Unknown";
        RemoteAuthorityResolverErrorCode["NotAvailable"] = "NotAvailable";
        RemoteAuthorityResolverErrorCode["TemporarilyNotAvailable"] = "TemporarilyNotAvailable";
    })(RemoteAuthorityResolverErrorCode = exports.RemoteAuthorityResolverErrorCode || (exports.RemoteAuthorityResolverErrorCode = {}));
    class RemoteAuthorityResolverError extends Error {
        constructor(message, code = RemoteAuthorityResolverErrorCode.Unknown, detail) {
            super(message);
            this._message = message;
            this._code = code;
            this._detail = detail;
            // workaround when extending builtin objects and when compiling to ES5, see:
            // https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
            if (typeof Object.setPrototypeOf === 'function') {
                Object.setPrototypeOf(this, RemoteAuthorityResolverError.prototype);
            }
        }
        static isHandledNotAvailable(err) {
            if (err instanceof RemoteAuthorityResolverError) {
                if (err._code === RemoteAuthorityResolverErrorCode.NotAvailable && err._detail === true) {
                    return true;
                }
            }
            return this.isTemporarilyNotAvailable(err);
        }
        static isTemporarilyNotAvailable(err) {
            if (err instanceof RemoteAuthorityResolverError) {
                return err._code === RemoteAuthorityResolverErrorCode.TemporarilyNotAvailable;
            }
            return false;
        }
    }
    exports.RemoteAuthorityResolverError = RemoteAuthorityResolverError;
});
//# sourceMappingURL=remoteAuthorityResolver.js.map