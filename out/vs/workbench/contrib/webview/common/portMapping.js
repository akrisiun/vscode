/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/remote/common/remoteHosts", "vs/platform/remote/common/tunnel"], function (require, exports, lifecycle_1, uri_1, remoteHosts_1, tunnel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class WebviewPortMappingManager extends lifecycle_1.Disposable {
        constructor(getExtensionLocation, mappings, tunnelService) {
            super();
            this.getExtensionLocation = getExtensionLocation;
            this.mappings = mappings;
            this.tunnelService = tunnelService;
            this._tunnels = new Map();
        }
        async getRedirect(url) {
            const uri = uri_1.URI.parse(url);
            const requestLocalHostInfo = tunnel_1.extractLocalHostUriMetaDataForPortMapping(uri);
            if (!requestLocalHostInfo) {
                return undefined;
            }
            for (const mapping of this.mappings()) {
                if (mapping.webviewPort === requestLocalHostInfo.port) {
                    const extensionLocation = this.getExtensionLocation();
                    if (extensionLocation && extensionLocation.scheme === remoteHosts_1.REMOTE_HOST_SCHEME) {
                        const tunnel = await this.getOrCreateTunnel(mapping.extensionHostPort);
                        if (tunnel) {
                            if (tunnel.tunnelLocalPort === mapping.webviewPort) {
                                return undefined;
                            }
                            return encodeURI(uri.with({
                                authority: `127.0.0.1:${tunnel.tunnelLocalPort}`,
                            }).toString(true));
                        }
                    }
                    if (mapping.webviewPort !== mapping.extensionHostPort) {
                        return encodeURI(uri.with({
                            authority: `${requestLocalHostInfo.address}:${mapping.extensionHostPort}`
                        }).toString(true));
                    }
                }
            }
            return undefined;
        }
        dispose() {
            super.dispose();
            for (const tunnel of this._tunnels.values()) {
                tunnel.then(tunnel => tunnel.dispose());
            }
            this._tunnels.clear();
        }
        getOrCreateTunnel(remotePort) {
            const existing = this._tunnels.get(remotePort);
            if (existing) {
                return existing;
            }
            const tunnel = this.tunnelService.openTunnel(remotePort);
            if (tunnel) {
                this._tunnels.set(remotePort, tunnel);
            }
            return tunnel;
        }
    }
    exports.WebviewPortMappingManager = WebviewPortMappingManager;
});
//# sourceMappingURL=portMapping.js.map