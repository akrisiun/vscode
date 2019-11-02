/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "net", "vs/base/common/event", "vs/base/parts/ipc/common/ipc", "vs/base/common/path", "os", "vs/base/common/uuid", "vs/base/common/lifecycle", "vs/base/common/buffer", "vs/base/parts/ipc/common/ipc.net"], function (require, exports, net_1, event_1, ipc_1, path_1, os_1, uuid_1, lifecycle_1, buffer_1, ipc_net_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class NodeSocket {
        constructor(socket) {
            this.socket = socket;
        }
        dispose() {
            this.socket.destroy();
        }
        onData(_listener) {
            const listener = (buff) => _listener(buffer_1.VSBuffer.wrap(buff));
            this.socket.on('data', listener);
            return {
                dispose: () => this.socket.off('data', listener)
            };
        }
        onClose(listener) {
            this.socket.on('close', listener);
            return {
                dispose: () => this.socket.off('close', listener)
            };
        }
        onEnd(listener) {
            this.socket.on('end', listener);
            return {
                dispose: () => this.socket.off('end', listener)
            };
        }
        write(buffer) {
            // return early if socket has been destroyed in the meantime
            if (this.socket.destroyed) {
                return;
            }
            // we ignore the returned value from `write` because we would have to cached the data
            // anyways and nodejs is already doing that for us:
            // > https://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback
            // > However, the false return value is only advisory and the writable stream will unconditionally
            // > accept and buffer chunk even if it has not not been allowed to drain.
            this.socket.write(buffer.buffer);
        }
        end() {
            this.socket.end();
        }
    }
    exports.NodeSocket = NodeSocket;
    var Constants;
    (function (Constants) {
        Constants[Constants["MinHeaderByteSize"] = 2] = "MinHeaderByteSize";
    })(Constants || (Constants = {}));
    var ReadState;
    (function (ReadState) {
        ReadState[ReadState["PeekHeader"] = 1] = "PeekHeader";
        ReadState[ReadState["ReadHeader"] = 2] = "ReadHeader";
        ReadState[ReadState["ReadBody"] = 3] = "ReadBody";
        ReadState[ReadState["Fin"] = 4] = "Fin";
    })(ReadState || (ReadState = {}));
    /**
     * See https://tools.ietf.org/html/rfc6455#section-5.2
     */
    class WebSocketNodeSocket extends lifecycle_1.Disposable {
        constructor(socket) {
            super();
            this._onData = this._register(new event_1.Emitter());
            this._state = {
                state: 1 /* PeekHeader */,
                readLen: 2 /* MinHeaderByteSize */,
                mask: 0
            };
            this.socket = socket;
            this._incomingData = new ipc_net_1.ChunkStream();
            this._register(this.socket.onData(data => this._acceptChunk(data)));
        }
        dispose() {
            this.socket.dispose();
        }
        onData(listener) {
            return this._onData.event(listener);
        }
        onClose(listener) {
            return this.socket.onClose(listener);
        }
        onEnd(listener) {
            return this.socket.onEnd(listener);
        }
        write(buffer) {
            let headerLen = 2 /* MinHeaderByteSize */;
            if (buffer.byteLength < 126) {
                headerLen += 0;
            }
            else if (buffer.byteLength < 2 ** 16) {
                headerLen += 2;
            }
            else {
                headerLen += 8;
            }
            const header = buffer_1.VSBuffer.alloc(headerLen);
            header.writeUInt8(0b10000010, 0);
            if (buffer.byteLength < 126) {
                header.writeUInt8(buffer.byteLength, 1);
            }
            else if (buffer.byteLength < 2 ** 16) {
                header.writeUInt8(126, 1);
                let offset = 1;
                header.writeUInt8((buffer.byteLength >>> 8) & 0b11111111, ++offset);
                header.writeUInt8((buffer.byteLength >>> 0) & 0b11111111, ++offset);
            }
            else {
                header.writeUInt8(127, 1);
                let offset = 1;
                header.writeUInt8(0, ++offset);
                header.writeUInt8(0, ++offset);
                header.writeUInt8(0, ++offset);
                header.writeUInt8(0, ++offset);
                header.writeUInt8((buffer.byteLength >>> 24) & 0b11111111, ++offset);
                header.writeUInt8((buffer.byteLength >>> 16) & 0b11111111, ++offset);
                header.writeUInt8((buffer.byteLength >>> 8) & 0b11111111, ++offset);
                header.writeUInt8((buffer.byteLength >>> 0) & 0b11111111, ++offset);
            }
            this.socket.write(buffer_1.VSBuffer.concat([header, buffer]));
        }
        end() {
            this.socket.end();
        }
        _acceptChunk(data) {
            if (data.byteLength === 0) {
                return;
            }
            this._incomingData.acceptChunk(data);
            while (this._incomingData.byteLength >= this._state.readLen) {
                if (this._state.state === 1 /* PeekHeader */) {
                    // peek to see if we can read the entire header
                    const peekHeader = this._incomingData.peek(this._state.readLen);
                    // const firstByte = peekHeader.readUInt8(0);
                    // const finBit = (firstByte & 0b10000000) >>> 7;
                    const secondByte = peekHeader.readUInt8(1);
                    const hasMask = (secondByte & 0b10000000) >>> 7;
                    const len = (secondByte & 0b01111111);
                    this._state.state = 2 /* ReadHeader */;
                    this._state.readLen = 2 /* MinHeaderByteSize */ + (hasMask ? 4 : 0) + (len === 126 ? 2 : 0) + (len === 127 ? 8 : 0);
                    this._state.mask = 0;
                }
                else if (this._state.state === 2 /* ReadHeader */) {
                    // read entire header
                    const header = this._incomingData.read(this._state.readLen);
                    const secondByte = header.readUInt8(1);
                    const hasMask = (secondByte & 0b10000000) >>> 7;
                    let len = (secondByte & 0b01111111);
                    let offset = 1;
                    if (len === 126) {
                        len = (header.readUInt8(++offset) * 2 ** 8
                            + header.readUInt8(++offset));
                    }
                    else if (len === 127) {
                        len = (header.readUInt8(++offset) * 0
                            + header.readUInt8(++offset) * 0
                            + header.readUInt8(++offset) * 0
                            + header.readUInt8(++offset) * 0
                            + header.readUInt8(++offset) * 2 ** 24
                            + header.readUInt8(++offset) * 2 ** 16
                            + header.readUInt8(++offset) * 2 ** 8
                            + header.readUInt8(++offset));
                    }
                    let mask = 0;
                    if (hasMask) {
                        mask = (header.readUInt8(++offset) * 2 ** 24
                            + header.readUInt8(++offset) * 2 ** 16
                            + header.readUInt8(++offset) * 2 ** 8
                            + header.readUInt8(++offset));
                    }
                    this._state.state = 3 /* ReadBody */;
                    this._state.readLen = len;
                    this._state.mask = mask;
                }
                else if (this._state.state === 3 /* ReadBody */) {
                    // read body
                    const body = this._incomingData.read(this._state.readLen);
                    unmask(body, this._state.mask);
                    this._state.state = 1 /* PeekHeader */;
                    this._state.readLen = 2 /* MinHeaderByteSize */;
                    this._state.mask = 0;
                    this._onData.fire(body);
                }
            }
        }
    }
    exports.WebSocketNodeSocket = WebSocketNodeSocket;
    function unmask(buffer, mask) {
        if (mask === 0) {
            return;
        }
        let cnt = buffer.byteLength >>> 2;
        for (let i = 0; i < cnt; i++) {
            const v = buffer.readUInt32BE(i * 4);
            buffer.writeUInt32BE(v ^ mask, i * 4);
        }
        let offset = cnt * 4;
        let bytesLeft = buffer.byteLength - offset;
        const m3 = (mask >>> 24) & 0b11111111;
        const m2 = (mask >>> 16) & 0b11111111;
        const m1 = (mask >>> 8) & 0b11111111;
        if (bytesLeft >= 1) {
            buffer.writeUInt8(buffer.readUInt8(offset) ^ m3, offset);
        }
        if (bytesLeft >= 2) {
            buffer.writeUInt8(buffer.readUInt8(offset + 1) ^ m2, offset + 1);
        }
        if (bytesLeft >= 3) {
            buffer.writeUInt8(buffer.readUInt8(offset + 2) ^ m1, offset + 2);
        }
    }
    function generateRandomPipeName() {
        const randomSuffix = uuid_1.generateUuid();
        if (process.platform === 'win32') {
            return `\\\\.\\pipe\\vscode-ipc-${randomSuffix}-sock`;
        }
        else {
            // Mac/Unix: use socket file
            return path_1.join(os_1.tmpdir(), `vscode-ipc-${randomSuffix}.sock`);
        }
    }
    exports.generateRandomPipeName = generateRandomPipeName;
    class Server extends ipc_1.IPCServer {
        constructor(server) {
            super(Server.toClientConnectionEvent(server));
            this.server = server;
        }
        static toClientConnectionEvent(server) {
            const onConnection = event_1.Event.fromNodeEventEmitter(server, 'connection');
            return event_1.Event.map(onConnection, socket => ({
                protocol: new ipc_net_1.Protocol(new NodeSocket(socket)),
                onDidClientDisconnect: event_1.Event.once(event_1.Event.fromNodeEventEmitter(socket, 'close'))
            }));
        }
        dispose() {
            super.dispose();
            if (this.server) {
                this.server.close();
                this.server = null;
            }
        }
    }
    exports.Server = Server;
    function serve(hook) {
        return new Promise((c, e) => {
            const server = net_1.createServer();
            server.on('error', e);
            server.listen(hook, () => {
                server.removeListener('error', e);
                c(new Server(server));
            });
        });
    }
    exports.serve = serve;
    function connect(hook, clientId) {
        return new Promise((c, e) => {
            const socket = net_1.createConnection(hook, () => {
                socket.removeListener('error', e);
                c(ipc_net_1.Client.fromSocket(new NodeSocket(socket), clientId));
            });
            socket.once('error', e);
        });
    }
    exports.connect = connect;
});
//# sourceMappingURL=ipc.net.js.map