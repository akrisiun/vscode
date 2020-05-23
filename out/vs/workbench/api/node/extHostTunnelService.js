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
define(["require", "exports", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostRpcService", "vs/base/common/lifecycle", "vs/workbench/api/common/extHostInitDataService", "vs/base/common/uri", "child_process", "vs/base/common/resources", "fs", "vs/base/common/platform", "vs/workbench/api/common/extHostTunnelService", "vs/base/common/async", "vs/base/common/event"], function (require, exports, extHost_protocol_1, extHostRpcService_1, lifecycle_1, extHostInitDataService_1, uri_1, child_process_1, resources, fs, platform_1, extHostTunnelService_1, async_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostTunnelService = void 0;
    class ExtensionTunnel {
        constructor(remoteAddress, localAddress, _dispose) {
            this.remoteAddress = remoteAddress;
            this.localAddress = localAddress;
            this._dispose = _dispose;
            this._onDispose = new event_1.Emitter();
            this.onDidDispose = this._onDispose.event;
        }
        dispose() {
            this._onDispose.fire();
            this._dispose();
        }
    }
    let ExtHostTunnelService = /** @class */ (() => {
        let ExtHostTunnelService = class ExtHostTunnelService extends lifecycle_1.Disposable {
            constructor(extHostRpc, initData) {
                super();
                this._showCandidatePort = () => { return Promise.resolve(true); };
                this._extensionTunnels = new Map();
                this._onDidChangeTunnels = new event_1.Emitter();
                this.onDidChangeTunnels = this._onDidChangeTunnels.event;
                this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadTunnelService);
                if (initData.remote.isRemote && initData.remote.authority) {
                    this.registerCandidateFinder();
                }
            }
            async openTunnel(forward) {
                const tunnel = await this._proxy.$openTunnel(forward);
                if (tunnel) {
                    const disposableTunnel = new ExtensionTunnel(tunnel.remoteAddress, tunnel.localAddress, () => {
                        return this._proxy.$closeTunnel(tunnel.remoteAddress);
                    });
                    this._register(disposableTunnel);
                    return disposableTunnel;
                }
                return undefined;
            }
            async getTunnels() {
                return this._proxy.$getTunnels();
            }
            registerCandidateFinder() {
                return this._proxy.$registerCandidateFinder();
            }
            $filterCandidates(candidates) {
                return Promise.all(candidates.map(candidate => {
                    return this._showCandidatePort(candidate.host, candidate.port, candidate.detail);
                }));
            }
            async setTunnelExtensionFunctions(provider) {
                if (provider) {
                    if (provider.showCandidatePort) {
                        this._showCandidatePort = provider.showCandidatePort;
                        await this._proxy.$setCandidateFilter();
                    }
                    if (provider.tunnelFactory) {
                        this._forwardPortProvider = provider.tunnelFactory;
                        await this._proxy.$setTunnelProvider();
                    }
                }
                else {
                    this._forwardPortProvider = undefined;
                }
                await this._proxy.$tunnelServiceReady();
                return lifecycle_1.toDisposable(() => {
                    this._forwardPortProvider = undefined;
                });
            }
            async $closeTunnel(remote) {
                if (this._extensionTunnels.has(remote.host)) {
                    const hostMap = this._extensionTunnels.get(remote.host);
                    if (hostMap.has(remote.port)) {
                        hostMap.get(remote.port).dispose();
                        hostMap.delete(remote.port);
                    }
                }
            }
            async $onDidTunnelsChange() {
                this._onDidChangeTunnels.fire();
            }
            $forwardPort(tunnelOptions) {
                if (this._forwardPortProvider) {
                    const providedPort = this._forwardPortProvider(tunnelOptions);
                    if (providedPort !== undefined) {
                        return async_1.asPromise(() => providedPort).then(tunnel => {
                            if (!this._extensionTunnels.has(tunnelOptions.remoteAddress.host)) {
                                this._extensionTunnels.set(tunnelOptions.remoteAddress.host, new Map());
                            }
                            this._extensionTunnels.get(tunnelOptions.remoteAddress.host).set(tunnelOptions.remoteAddress.port, tunnel);
                            this._register(tunnel.onDidDispose(() => this._proxy.$closeTunnel(tunnel.remoteAddress)));
                            return Promise.resolve(extHostTunnelService_1.TunnelDto.fromApiTunnel(tunnel));
                        });
                    }
                }
                return undefined;
            }
            async $findCandidatePorts() {
                if (!platform_1.isLinux) {
                    return [];
                }
                const ports = [];
                let tcp = '';
                let tcp6 = '';
                try {
                    tcp = fs.readFileSync('/proc/net/tcp', 'utf8');
                    tcp6 = fs.readFileSync('/proc/net/tcp6', 'utf8');
                }
                catch (e) {
                    // File reading error. No additional handling needed.
                }
                const procSockets = await (new Promise(resolve => {
                    child_process_1.exec('ls -l /proc/[0-9]*/fd/[0-9]* | grep socket:', (error, stdout, stderr) => {
                        resolve(stdout);
                    });
                }));
                const procChildren = fs.readdirSync('/proc');
                const processes = [];
                for (let childName of procChildren) {
                    try {
                        const pid = Number(childName);
                        const childUri = resources.joinPath(uri_1.URI.file('/proc'), childName);
                        const childStat = fs.statSync(childUri.fsPath);
                        if (childStat.isDirectory() && !isNaN(pid)) {
                            const cwd = fs.readlinkSync(resources.joinPath(childUri, 'cwd').fsPath);
                            const cmd = fs.readFileSync(resources.joinPath(childUri, 'cmdline').fsPath, 'utf8');
                            processes.push({ pid, cwd, cmd });
                        }
                    }
                    catch (e) {
                        //
                    }
                }
                const connections = this.loadListeningPorts(tcp, tcp6);
                const sockets = this.getSockets(procSockets);
                const socketMap = sockets.reduce((m, socket) => {
                    m[socket.socket] = socket;
                    return m;
                }, {});
                const processMap = processes.reduce((m, process) => {
                    m[process.pid] = process;
                    return m;
                }, {});
                connections.filter((connection => socketMap[connection.socket])).forEach(({ socket, ip, port }) => {
                    const command = processMap[socketMap[socket].pid].cmd;
                    if (!command.match('.*\.vscode\-server\-[a-zA-Z]+\/bin.*') && (command.indexOf('out/vs/server/main.js') === -1)) {
                        ports.push({ host: ip, port, detail: processMap[socketMap[socket].pid].cmd });
                    }
                });
                return ports;
            }
            getSockets(stdout) {
                const lines = stdout.trim().split('\n');
                return lines.map(line => {
                    const match = /\/proc\/(\d+)\/fd\/\d+ -> socket:\[(\d+)\]/.exec(line);
                    return {
                        pid: parseInt(match[1], 10),
                        socket: parseInt(match[2], 10)
                    };
                });
            }
            loadListeningPorts(...stdouts) {
                const table = [].concat(...stdouts.map(this.loadConnectionTable));
                return [
                    ...new Map(table.filter(row => row.st === '0A')
                        .map(row => {
                        const address = row.local_address.split(':');
                        return {
                            socket: parseInt(row.inode, 10),
                            ip: this.parseIpAddress(address[0]),
                            port: parseInt(address[1], 16)
                        };
                    }).map(port => [port.ip + ':' + port.port, port])).values()
                ];
            }
            parseIpAddress(hex) {
                let result = '';
                if (hex.length === 8) {
                    for (let i = hex.length - 2; i >= 0; i -= 2) {
                        result += parseInt(hex.substr(i, 2), 16);
                        if (i !== 0) {
                            result += '.';
                        }
                    }
                }
                else {
                    for (let i = hex.length - 4; i >= 0; i -= 4) {
                        result += parseInt(hex.substr(i, 4), 16).toString(16);
                        if (i !== 0) {
                            result += ':';
                        }
                    }
                }
                return result;
            }
            loadConnectionTable(stdout) {
                const lines = stdout.trim().split('\n');
                const names = lines.shift().trim().split(/\s+/)
                    .filter(name => name !== 'rx_queue' && name !== 'tm->when');
                const table = lines.map(line => line.trim().split(/\s+/).reduce((obj, value, i) => {
                    obj[names[i] || i] = value;
                    return obj;
                }, {}));
                return table;
            }
        };
        ExtHostTunnelService = __decorate([
            __param(0, extHostRpcService_1.IExtHostRpcService),
            __param(1, extHostInitDataService_1.IExtHostInitDataService)
        ], ExtHostTunnelService);
        return ExtHostTunnelService;
    })();
    exports.ExtHostTunnelService = ExtHostTunnelService;
});
//# sourceMappingURL=extHostTunnelService.js.map