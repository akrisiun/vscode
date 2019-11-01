/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ITunnelService = instantiation_1.createDecorator('tunnelService');
    function extractLocalHostUriMetaDataForPortMapping(uri) {
        if (uri.scheme !== 'http' && uri.scheme !== 'https') {
            return undefined;
        }
        const localhostMatch = /^(localhost|127\.0\.0\.1|0\.0\.0\.0):(\d+)$/.exec(uri.authority);
        if (!localhostMatch) {
            return undefined;
        }
        return {
            address: localhostMatch[1],
            port: +localhostMatch[2],
        };
    }
    exports.extractLocalHostUriMetaDataForPortMapping = extractLocalHostUriMetaDataForPortMapping;
});
//# sourceMappingURL=tunnel.js.map