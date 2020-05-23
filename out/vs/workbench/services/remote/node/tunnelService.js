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
define(["require", "exports", "net", "vs/base/common/async", "vs/base/common/lifecycle", "vs/workbench/services/environment/common/environmentService", "vs/platform/product/common/product", "vs/platform/remote/common/remoteAgentConnection", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/remote/common/tunnel", "vs/platform/remote/node/nodeSocketFactory", "vs/platform/sign/common/sign", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/base/node/ports", "vs/workbench/services/remote/common/tunnelService"], function (require, exports, net, async_1, lifecycle_1, environmentService_1, product_1, remoteAgentConnection_1, remoteAuthorityResolver_1, tunnel_1, nodeSocketFactory_1, sign_1, extensions_1, log_1, ports_1, tunnelService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TunnelService = void 0;
    async function createRemoteTunnel(options, tunnelRemoteHost, tunnelRemotePort, tunnelLocalPort) {
        const tunnel = new NodeRemoteTunnel(options, tunnelRemoteHost, tunnelRemotePort, tunnelLocalPort);
        return tunnel.waitForReady();
    }
    class NodeRemoteTunnel extends lifecycle_1.Disposable {
        constructor(options, tunnelRemoteHost, tunnelRemotePort, suggestedLocalPort) {
            super();
            this.suggestedLocalPort = suggestedLocalPort;
            this._socketsDispose = new Map();
            this._options = options;
            this._server = net.createServer();
            this._barrier = new async_1.Barrier();
            this._listeningListener = () => this._barrier.open();
            this._server.on('listening', this._listeningListener);
            this._connectionListener = (socket) => this._onConnection(socket);
            this._server.on('connection', this._connectionListener);
            // If there is no error listener and there is an error it will crash the whole window
            this._errorListener = () => { };
            this._server.on('error', this._errorListener);
            this.tunnelRemotePort = tunnelRemotePort;
            this.tunnelRemoteHost = tunnelRemoteHost;
        }
        dispose() {
            super.dispose();
            this._server.removeListener('listening', this._listeningListener);
            this._server.removeListener('connection', this._connectionListener);
            this._server.removeListener('error', this._errorListener);
            this._server.close();
            const disposers = Array.from(this._socketsDispose.values());
            disposers.forEach(disposer => {
                disposer();
            });
        }
        async waitForReady() {
            var _a;
            // try to get the same port number as the remote port number...
            let localPort = await ports_1.findFreePortFaster((_a = this.suggestedLocalPort) !== null && _a !== void 0 ? _a : this.tunnelRemotePort, 2, 1000);
            // if that fails, the method above returns 0, which works out fine below...
            let address = null;
            address = this._server.listen(localPort).address();
            // It is possible for findFreePortFaster to return a port that there is already a server listening on. This causes the previous listen call to error out.
            if (!address) {
                localPort = 0;
                address = this._server.listen(localPort).address();
            }
            this.tunnelLocalPort = address.port;
            await this._barrier.wait();
            this.localAddress = 'localhost:' + address.port;
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
            localSocket.on('end', () => {
                this._socketsDispose.delete(localSocket.localAddress);
                remoteSocket.end();
            });
            localSocket.on('close', () => remoteSocket.end());
            remoteSocket.on('end', () => localSocket.end());
            remoteSocket.on('close', () => localSocket.end());
            localSocket.pipe(remoteSocket);
            remoteSocket.pipe(localSocket);
            this._socketsDispose.set(localSocket.localAddress, () => {
                // Need to end instead of unpipe, otherwise whatever is connected locally could end up "stuck" with whatever state it had until manually exited.
                localSocket.end();
                remoteSocket.end();
            });
        }
    }
    let TunnelService = /** @class */ (() => {
        let TunnelService = class TunnelService extends tunnelService_1.AbstractTunnelService {
            constructor(environmentService, logService, remoteAuthorityResolverService, signService) {
                super(environmentService, logService);
                this.remoteAuthorityResolverService = remoteAuthorityResolverService;
                this.signService = signService;
            }
            retainOrCreateTunnel(remoteAuthority, remoteHost, remotePort, localPort) {
                const portMap = this._tunnels.get(remoteHost);
                const existing = portMap ? portMap.get(remotePort) : undefined;
                if (existing) {
                    ++existing.refcount;
                    return existing.value;
                }
                if (this._tunnelProvider) {
                    const tunnel = this._tunnelProvider.forwardPort({ remoteAddress: { host: remoteHost, port: remotePort }, localAddressPort: localPort });
                    if (tunnel) {
                        this.addTunnelToMap(remoteHost, remotePort, tunnel);
                    }
                    return tunnel;
                }
                else {
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
                    const tunnel = createRemoteTunnel(options, remoteHost, remotePort, localPort);
                    this.addTunnelToMap(remoteHost, remotePort, tunnel);
                    return tunnel;
                }
            }
        };
        TunnelService = __decorate([
            __param(0, environmentService_1.IWorkbenchEnvironmentService),
            __param(1, log_1.ILogService),
            __param(2, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
            __param(3, sign_1.ISignService)
        ], TunnelService);
        return TunnelService;
    })();
    exports.TunnelService = TunnelService;
    extensions_1.registerSingleton(tunnel_1.ITunnelService, TunnelService, true);
});
//# sourceMappingURL=tunnelService.js.map