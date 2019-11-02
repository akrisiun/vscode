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
define(["require", "exports", "net", "vs/base/common/async", "vs/base/common/lifecycle", "vs/workbench/services/environment/common/environmentService", "vs/platform/product/common/product", "vs/platform/remote/common/remoteAgentConnection", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/remote/common/tunnel", "vs/platform/remote/node/nodeSocketFactory", "vs/platform/sign/common/sign", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/base/node/ports"], function (require, exports, net, async_1, lifecycle_1, environmentService_1, product_1, remoteAgentConnection_1, remoteAuthorityResolver_1, tunnel_1, nodeSocketFactory_1, sign_1, extensions_1, log_1, ports_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    async function createRemoteTunnel(options, tunnelRemotePort) {
        const tunnel = new NodeRemoteTunnel(options, tunnelRemotePort);
        return tunnel.waitForReady();
    }
    exports.createRemoteTunnel = createRemoteTunnel;
    class NodeRemoteTunnel extends lifecycle_1.Disposable {
        constructor(options, tunnelRemotePort) {
            super();
            this._options = options;
            this._server = net.createServer();
            this._barrier = new async_1.Barrier();
            this._listeningListener = () => this._barrier.open();
            this._server.on('listening', this._listeningListener);
            this._connectionListener = (socket) => this._onConnection(socket);
            this._server.on('connection', this._connectionListener);
            this.tunnelRemotePort = tunnelRemotePort;
        }
        dispose() {
            super.dispose();
            this._server.removeListener('listening', this._listeningListener);
            this._server.removeListener('connection', this._connectionListener);
            this._server.close();
        }
        async waitForReady() {
            // try to get the same port number as the remote port number...
            const localPort = await ports_1.findFreePort(this.tunnelRemotePort, 1, 1000);
            // if that fails, the method above returns 0, which works out fine below...
            this.tunnelLocalPort = this._server.listen(localPort).address().port;
            await this._barrier.wait();
            return this;
        }
        async _onConnection(localSocket) {
            // pause reading on the socket until we have a chance to forward its data
            localSocket.pause();
            const protocol = await remoteAgentConnection_1.connectRemoteAgentTunnel(this._options, this.tunnelRemotePort);
            const remoteSocket = protocol.getSocket().socket;
            const dataChunk = protocol.readEntireBuffer();
            protocol.dispose();
            if (dataChunk.byteLength > 0) {
                localSocket.write(dataChunk.buffer);
            }
            localSocket.on('end', () => remoteSocket.end());
            localSocket.on('close', () => remoteSocket.end());
            remoteSocket.on('end', () => localSocket.end());
            remoteSocket.on('close', () => localSocket.end());
            localSocket.pipe(remoteSocket);
            remoteSocket.pipe(localSocket);
        }
    }
    let TunnelService = class TunnelService {
        constructor(environmentService, remoteAuthorityResolverService, signService, logService) {
            this.environmentService = environmentService;
            this.remoteAuthorityResolverService = remoteAuthorityResolverService;
            this.signService = signService;
            this.logService = logService;
            this._tunnels = new Map();
        }
        get tunnels() {
            return Promise.all(Array.from(this._tunnels.values()).map(x => x.value));
        }
        dispose() {
            for (const { value } of this._tunnels.values()) {
                value.then(tunnel => tunnel.dispose());
            }
            this._tunnels.clear();
        }
        openTunnel(remotePort) {
            const remoteAuthority = this.environmentService.configuration.remoteAuthority;
            if (!remoteAuthority) {
                return undefined;
            }
            const resolvedTunnel = this.retainOrCreateTunnel(remoteAuthority, remotePort);
            if (!resolvedTunnel) {
                return resolvedTunnel;
            }
            return resolvedTunnel.then(tunnel => ({
                tunnelRemotePort: tunnel.tunnelRemotePort,
                tunnelLocalPort: tunnel.tunnelLocalPort,
                dispose: () => {
                    const existing = this._tunnels.get(remotePort);
                    if (existing) {
                        if (--existing.refcount <= 0) {
                            existing.value.then(tunnel => tunnel.dispose());
                            this._tunnels.delete(remotePort);
                        }
                    }
                }
            }));
        }
        retainOrCreateTunnel(remoteAuthority, remotePort) {
            const existing = this._tunnels.get(remotePort);
            if (existing) {
                ++existing.refcount;
                return existing.value;
            }
            const options = {
                commit: product_1.default.commit,
                socketFactory: nodeSocketFactory_1.nodeSocketFactory,
                addressProvider: {
                    getAddress: async () => {
                        const { authority } = await this.remoteAuthorityResolverService.resolveAuthority(remoteAuthority);
                        return { host: authority.host, port: authority.port };
                    }
                },
                signService: this.signService,
                logService: this.logService
            };
            const tunnel = createRemoteTunnel(options, remotePort);
            this._tunnels.set(remotePort, { refcount: 1, value: tunnel });
            return tunnel;
        }
    };
    TunnelService = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(2, sign_1.ISignService),
        __param(3, log_1.ILogService)
    ], TunnelService);
    exports.TunnelService = TunnelService;
    extensions_1.registerSingleton(tunnel_1.ITunnelService, TunnelService, true);
});
//# sourceMappingURL=tunnelService.js.map