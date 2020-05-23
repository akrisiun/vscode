"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.toBase64UrlEncoding = void 0;
function toBase64UrlEncoding(base64string) {
    return base64string.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_'); // Need to use base64url encoding
}
exports.toBase64UrlEncoding = toBase64UrlEncoding;
//# sourceMappingURL=utils.js.map