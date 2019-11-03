define(["require", "exports", "child_process", "vs/base/common/amd", "vs/base/common/event", "vs/base/parts/ipc/node/ipc.net", "vs/server/src/node/nls", "vs/server/src/node/util"], function (require, exports, cp, amd_1, event_1, ipc_net_1, nls_1, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Connection {
        constructor(protocol, token) {
            this.protocol = protocol;
            this.token = token;
            this._onClose = new event_1.Emitter();
            this.onClose = this._onClose.event;
            this.disposed = false;
        }
        get offline() {
            return this._offline;
        }
        reconnect(socket, buffer) {
            this._offline = undefined;
            this.doReconnect(socket, buffer);
        }
        dispose() {
            if (!this.disposed) {
                this.disposed = true;
                this.doDispose();
                this._onClose.fire();
            }
        }
        setOffline() {
            if (!this._offline) {
                this._offline = Date.now();
            }
        }
    }
    exports.Connection = Connection;
    /**
     * Used for all the IPC channels.
     */
    class ManagementConnection extends Connection {
        constructor(protocol, token) {
            super(protocol, token);
            this.protocol = protocol;
            protocol.onClose(() => this.dispose()); // Explicit close.
            protocol.onSocketClose(() => this.setOffline()); // Might reconnect.
        }
        doDispose() {
            this.protocol.sendDisconnect();
            this.protocol.dispose();
            this.protocol.getSocket().end();
        }
        doReconnect(socket, buffer) {
            this.protocol.beginAcceptReconnection(socket, buffer);
            this.protocol.endAcceptReconnection();
        }
    }
    exports.ManagementConnection = ManagementConnection;
    class ExtensionHostConnection extends Connection {
        constructor(locale, protocol, buffer, token, log, environment) {
            super(protocol, token);
            this.log = log;
            this.environment = environment;
            this.protocol.dispose();
            this.spawn(locale, buffer).then((p) => this.process = p);
            this.protocol.getUnderlyingSocket().pause();
        }
        doDispose() {
            if (this.process) {
                this.process.kill();
            }
            this.protocol.getSocket().end();
        }
        doReconnect(socket, buffer) {
            // This is just to set the new socket.
            this.protocol.beginAcceptReconnection(socket, null);
            this.protocol.dispose();
            this.sendInitMessage(buffer);
        }
        sendInitMessage(buffer) {
            const socket = this.protocol.getUnderlyingSocket();
            socket.pause();
            this.process.send({
                type: "VSCODE_EXTHOST_IPC_SOCKET",
                initialDataChunk: buffer.buffer.toString("base64"),
                skipWebSocketFrames: this.protocol.getSocket() instanceof ipc_net_1.NodeSocket,
            }, socket);
        }
        async spawn(locale, buffer) {
            const config = await nls_1.getNlsConfiguration(locale, this.environment.userDataPath);
            const proc = cp.fork(amd_1.getPathFromAmdModule(require, "bootstrap-fork"), ["--type=extensionHost", `--uriTransformerPath=${util_1.uriTransformerPath}`], {
                env: Object.assign(Object.assign({}, process.env), { AMD_ENTRYPOINT: "vs/workbench/services/extensions/node/extensionHostProcess", PIPE_LOGGING: "true", VERBOSE_LOGGING: "true", VSCODE_EXTHOST_WILL_SEND_SOCKET: "true", VSCODE_HANDLES_UNCAUGHT_ERRORS: "true", VSCODE_LOG_STACK: "false", VSCODE_LOG_LEVEL: this.environment.verbose ? "trace" : this.environment.log, VSCODE_NLS_CONFIG: JSON.stringify(config) }),
                silent: true,
            });
            proc.on("error", () => this.dispose());
            proc.on("exit", () => this.dispose());
            proc.stdout.setEncoding("utf8").on("data", (d) => this.log.info("Extension host stdout", d));
            proc.stderr.setEncoding("utf8").on("data", (d) => this.log.error("Extension host stderr", d));
            proc.on("message", (event) => {
                if (event && event.type === "__$console") {
                    const severity = this.log[event.severity] ? event.severity : "info";
                    this.log[severity]("Extension host", event.arguments);
                }
                if (event && event.type === "VSCODE_EXTHOST_DISCONNECTED") {
                    this.setOffline();
                }
            });
            const listen = (message) => {
                if (message.type === "VSCODE_EXTHOST_IPC_READY") {
                    proc.removeListener("message", listen);
                    this.sendInitMessage(buffer);
                }
            };
            return proc.on("message", listen);
        }
    }
    exports.ExtensionHostConnection = ExtensionHostConnection;
});
//# sourceMappingURL=connection.js.map