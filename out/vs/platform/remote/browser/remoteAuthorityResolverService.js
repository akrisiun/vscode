/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network"], function (require, exports, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RemoteAuthorityResolverService {
        constructor(resourceUriProvider) {
            if (resourceUriProvider) {
                network_1.RemoteAuthorities.setDelegate(resourceUriProvider);
            }
        }
        resolveAuthority(authority) {
            if (authority.indexOf(':') >= 0) {
                const pieces = authority.split(':');
                return Promise.resolve(this._createResolvedAuthority(authority, pieces[0], parseInt(pieces[1], 10)));
            }
            return Promise.resolve(this._createResolvedAuthority(authority, authority, 80));
        }
        _createResolvedAuthority(authority, host, port) {
            network_1.RemoteAuthorities.set(authority, host, port);
            return { authority: { authority, host, port } };
        }
        clearResolvedAuthority(authority) {
        }
        setResolvedAuthority(resolvedAuthority) {
        }
        setResolvedAuthorityError(authority, err) {
        }
    }
    exports.RemoteAuthorityResolverService = RemoteAuthorityResolverService;
});
//# sourceMappingURL=remoteAuthorityResolverService.js.map