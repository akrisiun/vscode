/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/base/common/event", "vs/workbench/services/extensions/common/proxyIdentifier", "vs/workbench/services/extensions/common/rpcProtocol", "vs/base/common/buffer"], function (require, exports, assert, cancellation_1, event_1, proxyIdentifier_1, rpcProtocol_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('RPCProtocol', () => {
        class MessagePassingProtocol {
            constructor() {
                this._onMessage = new event_1.Emitter();
                this.onMessage = this._onMessage.event;
            }
            setPair(other) {
                this._pair = other;
            }
            send(buffer) {
                process.nextTick(() => {
                    this._pair._onMessage.fire(buffer);
                });
            }
        }
        let delegate;
        let bProxy;
        class BClass {
            $m(a1, a2) {
                return Promise.resolve(delegate.call(null, a1, a2));
            }
        }
        setup(() => {
            let a_protocol = new MessagePassingProtocol();
            let b_protocol = new MessagePassingProtocol();
            a_protocol.setPair(b_protocol);
            b_protocol.setPair(a_protocol);
            let A = new rpcProtocol_1.RPCProtocol(a_protocol);
            let B = new rpcProtocol_1.RPCProtocol(b_protocol);
            const bIdentifier = new proxyIdentifier_1.ProxyIdentifier(false, 'bb');
            const bInstance = new BClass();
            B.set(bIdentifier, bInstance);
            bProxy = A.getProxy(bIdentifier);
        });
        test('simple call', function (done) {
            delegate = (a1, a2) => a1 + a2;
            bProxy.$m(4, 1).then((res) => {
                assert.equal(res, 5);
                done(null);
            }, done);
        });
        test('simple call without result', function (done) {
            delegate = (a1, a2) => { };
            bProxy.$m(4, 1).then((res) => {
                assert.equal(res, undefined);
                done(null);
            }, done);
        });
        test('passing buffer as argument', function (done) {
            delegate = (a1, a2) => {
                assert.ok(a1 instanceof buffer_1.VSBuffer);
                return a1.buffer[a2];
            };
            let b = buffer_1.VSBuffer.alloc(4);
            b.buffer[0] = 1;
            b.buffer[1] = 2;
            b.buffer[2] = 3;
            b.buffer[3] = 4;
            bProxy.$m(b, 2).then((res) => {
                assert.equal(res, 3);
                done(null);
            }, done);
        });
        test('returning a buffer', function (done) {
            delegate = (a1, a2) => {
                let b = buffer_1.VSBuffer.alloc(4);
                b.buffer[0] = 1;
                b.buffer[1] = 2;
                b.buffer[2] = 3;
                b.buffer[3] = 4;
                return b;
            };
            bProxy.$m(4, 1).then((res) => {
                assert.ok(res instanceof buffer_1.VSBuffer);
                assert.equal(res.buffer[0], 1);
                assert.equal(res.buffer[1], 2);
                assert.equal(res.buffer[2], 3);
                assert.equal(res.buffer[3], 4);
                done(null);
            }, done);
        });
        test('cancelling a call via CancellationToken before', function (done) {
            delegate = (a1, a2) => a1 + a2;
            let p = bProxy.$m(4, cancellation_1.CancellationToken.Cancelled);
            p.then((res) => {
                assert.fail('should not receive result');
            }, (err) => {
                assert.ok(true);
                done(null);
            });
        });
        test('passing CancellationToken.None', function (done) {
            delegate = (a1, token) => {
                assert.ok(!!token);
                return a1 + 1;
            };
            bProxy.$m(4, cancellation_1.CancellationToken.None).then((res) => {
                assert.equal(res, 5);
                done(null);
            }, done);
        });
        test('cancelling a call via CancellationToken quickly', function (done) {
            // this is an implementation which, when cancellation is triggered, will return 7
            delegate = (a1, token) => {
                return new Promise((resolve, reject) => {
                    token.onCancellationRequested((e) => {
                        resolve(7);
                    });
                });
            };
            let tokenSource = new cancellation_1.CancellationTokenSource();
            let p = bProxy.$m(4, tokenSource.token);
            p.then((res) => {
                assert.equal(res, 7);
                done(null);
            }, (err) => {
                assert.fail('should not receive error');
                done();
            });
            tokenSource.cancel();
        });
        test('throwing an error', function (done) {
            delegate = (a1, a2) => {
                throw new Error(`nope`);
            };
            bProxy.$m(4, 1).then((res) => {
                assert.fail('unexpected');
                done(null);
            }, (err) => {
                assert.equal(err.message, 'nope');
                done(null);
            });
        });
        test('error promise', function (done) {
            delegate = (a1, a2) => {
                return Promise.reject(undefined);
            };
            bProxy.$m(4, 1).then((res) => {
                assert.fail('unexpected');
                done(null);
            }, (err) => {
                assert.equal(err, undefined);
                done(null);
            });
        });
        test('issue #60450: Converting circular structure to JSON', function (done) {
            delegate = (a1, a2) => {
                let circular = {};
                circular.self = circular;
                return circular;
            };
            bProxy.$m(4, 1).then((res) => {
                assert.equal(res, null);
                done(null);
            }, (err) => {
                assert.fail('unexpected');
                done(null);
            });
        });
        test('issue #72798: null errors are hard to digest', function (done) {
            delegate = (a1, a2) => {
                throw { 'what': 'what' };
            };
            bProxy.$m(4, 1).then((res) => {
                assert.fail('unexpected');
                done(null);
            }, (err) => {
                assert.equal(err.what, 'what');
                done(null);
            });
        });
    });
});
//# sourceMappingURL=rpcProtocol.test.js.map