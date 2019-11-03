define(["require", "exports", "vs/base/common/buffer", "vs/base/parts/ipc/common/ipc.net", "vs/base/parts/ipc/node/ipc.net"], function (require, exports, buffer_1, ipc_net_1, ipc_net_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Protocol extends ipc_net_1.PersistentProtocol {
        constructor(socket, options) {
            super(options.skipWebSocketFrames
                ? new ipc_net_2.NodeSocket(socket)
                : new ipc_net_2.WebSocketNodeSocket(new ipc_net_2.NodeSocket(socket)));
            this.options = options;
        }
        getUnderlyingSocket() {
            const socket = this.getSocket();
            return socket instanceof ipc_net_2.NodeSocket
                ? socket.socket
                : socket.socket.socket;
        }
        /**
         * Perform a handshake to get a connection request.
         */
        handshake() {
            return new Promise((resolve, reject) => {
                const handler = this.onControlMessage((rawMessage) => {
                    try {
                        const message = JSON.parse(rawMessage.toString());
                        switch (message.type) {
                            case "auth": return this.authenticate(message);
                            case "connectionType":
                                handler.dispose();
                                return resolve(message);
                            default: throw new Error("Unrecognized message type");
                        }
                    }
                    catch (error) {
                        handler.dispose();
                        reject(error);
                    }
                });
            });
        }
        /**
         * TODO: This ignores the authentication process entirely for now.
         */
        authenticate(_message) {
            this.sendMessage({ type: "sign", data: "" });
        }
        /**
         * TODO: implement.
         */
        tunnel() {
            throw new Error("Tunnel is not implemented yet");
        }
        /**
         * Send a handshake message. In the case of the extension host, it just sends
         * back a debug port.
         */
        sendMessage(message) {
            this.sendControl(buffer_1.VSBuffer.fromString(JSON.stringify(message)));
        }
    }
    exports.Protocol = Protocol;
});
//# sourceMappingURL=protocol.js.map