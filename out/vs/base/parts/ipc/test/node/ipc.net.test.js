/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "events", "vs/base/parts/ipc/common/ipc.net", "vs/base/parts/ipc/node/ipc.net", "vs/base/common/buffer"], function (require, exports, assert, events_1, ipc_net_1, ipc_net_2, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MessageStream {
        constructor(x) {
            this._currentComplete = null;
            this._messages = [];
            x.onMessage(data => {
                this._messages.push(data);
                this._trigger();
            });
        }
        _trigger() {
            if (!this._currentComplete) {
                return;
            }
            if (this._messages.length === 0) {
                return;
            }
            const complete = this._currentComplete;
            const msg = this._messages.shift();
            this._currentComplete = null;
            complete(msg);
        }
        waitForOne() {
            return new Promise((complete) => {
                this._currentComplete = complete;
                this._trigger();
            });
        }
    }
    class EtherStream extends events_1.EventEmitter {
        constructor(_ether, _name) {
            super();
            this._ether = _ether;
            this._name = _name;
        }
        write(data, cb) {
            if (!Buffer.isBuffer(data)) {
                throw new Error(`Invalid data`);
            }
            this._ether.write(this._name, data);
            return true;
        }
    }
    class Ether {
        constructor() {
            this._a = new EtherStream(this, 'a');
            this._b = new EtherStream(this, 'b');
            this._ab = [];
            this._ba = [];
        }
        get a() {
            return this._a;
        }
        get b() {
            return this._b;
        }
        write(from, data) {
            if (from === 'a') {
                this._ab.push(data);
            }
            else {
                this._ba.push(data);
            }
            setImmediate(() => this._deliver());
        }
        _deliver() {
            if (this._ab.length > 0) {
                const data = Buffer.concat(this._ab);
                this._ab.length = 0;
                this._b.emit('data', data);
                setImmediate(() => this._deliver());
                return;
            }
            if (this._ba.length > 0) {
                const data = Buffer.concat(this._ba);
                this._ba.length = 0;
                this._a.emit('data', data);
                setImmediate(() => this._deliver());
                return;
            }
        }
    }
    suite('IPC, Socket Protocol', () => {
        let ether;
        setup(() => {
            ether = new Ether();
        });
        test('read/write', async () => {
            const a = new ipc_net_1.Protocol(new ipc_net_2.NodeSocket(ether.a));
            const b = new ipc_net_1.Protocol(new ipc_net_2.NodeSocket(ether.b));
            const bMessages = new MessageStream(b);
            a.send(buffer_1.VSBuffer.fromString('foobarfarboo'));
            const msg1 = await bMessages.waitForOne();
            assert.equal(msg1.toString(), 'foobarfarboo');
            const buffer = buffer_1.VSBuffer.alloc(1);
            buffer.writeUInt8(123, 0);
            a.send(buffer);
            const msg2 = await bMessages.waitForOne();
            assert.equal(msg2.readUInt8(0), 123);
        });
        test('read/write, object data', async () => {
            const a = new ipc_net_1.Protocol(new ipc_net_2.NodeSocket(ether.a));
            const b = new ipc_net_1.Protocol(new ipc_net_2.NodeSocket(ether.b));
            const bMessages = new MessageStream(b);
            const data = {
                pi: Math.PI,
                foo: 'bar',
                more: true,
                data: 'Hello World'.split('')
            };
            a.send(buffer_1.VSBuffer.fromString(JSON.stringify(data)));
            const msg = await bMessages.waitForOne();
            assert.deepEqual(JSON.parse(msg.toString()), data);
        });
    });
    suite('PersistentProtocol reconnection', () => {
        let ether;
        setup(() => {
            ether = new Ether();
        });
        test('acks get piggybacked with messages', async () => {
            const a = new ipc_net_1.PersistentProtocol(new ipc_net_2.NodeSocket(ether.a));
            const aMessages = new MessageStream(a);
            const b = new ipc_net_1.PersistentProtocol(new ipc_net_2.NodeSocket(ether.b));
            const bMessages = new MessageStream(b);
            a.send(buffer_1.VSBuffer.fromString('a1'));
            assert.equal(a.unacknowledgedCount, 1);
            assert.equal(b.unacknowledgedCount, 0);
            a.send(buffer_1.VSBuffer.fromString('a2'));
            assert.equal(a.unacknowledgedCount, 2);
            assert.equal(b.unacknowledgedCount, 0);
            a.send(buffer_1.VSBuffer.fromString('a3'));
            assert.equal(a.unacknowledgedCount, 3);
            assert.equal(b.unacknowledgedCount, 0);
            const a1 = await bMessages.waitForOne();
            assert.equal(a1.toString(), 'a1');
            assert.equal(a.unacknowledgedCount, 3);
            assert.equal(b.unacknowledgedCount, 0);
            const a2 = await bMessages.waitForOne();
            assert.equal(a2.toString(), 'a2');
            assert.equal(a.unacknowledgedCount, 3);
            assert.equal(b.unacknowledgedCount, 0);
            const a3 = await bMessages.waitForOne();
            assert.equal(a3.toString(), 'a3');
            assert.equal(a.unacknowledgedCount, 3);
            assert.equal(b.unacknowledgedCount, 0);
            b.send(buffer_1.VSBuffer.fromString('b1'));
            assert.equal(a.unacknowledgedCount, 3);
            assert.equal(b.unacknowledgedCount, 1);
            const b1 = await aMessages.waitForOne();
            assert.equal(b1.toString(), 'b1');
            assert.equal(a.unacknowledgedCount, 0);
            assert.equal(b.unacknowledgedCount, 1);
            a.send(buffer_1.VSBuffer.fromString('a4'));
            assert.equal(a.unacknowledgedCount, 1);
            assert.equal(b.unacknowledgedCount, 1);
            const b2 = await bMessages.waitForOne();
            assert.equal(b2.toString(), 'a4');
            assert.equal(a.unacknowledgedCount, 1);
            assert.equal(b.unacknowledgedCount, 0);
        });
    });
});
//# sourceMappingURL=ipc.net.test.js.map