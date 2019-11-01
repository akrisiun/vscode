/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class NoOpTunnelService {
        constructor() {
            this.tunnels = Promise.resolve([]);
        }
        openTunnel(_remotePort) {
            return undefined;
        }
    }
    exports.NoOpTunnelService = NoOpTunnelService;
});
//# sourceMappingURL=tunnelService.js.map