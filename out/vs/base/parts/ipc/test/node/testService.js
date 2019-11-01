/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/async"], function (require, exports, event_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestService {
        constructor() {
            this._onMarco = new event_1.Emitter();
            this.onMarco = this._onMarco.event;
        }
        marco() {
            this._onMarco.fire({ answer: 'polo' });
            return Promise.resolve('polo');
        }
        pong(ping) {
            return Promise.resolve({ incoming: ping, outgoing: 'pong' });
        }
        cancelMe() {
            return Promise.resolve(async_1.timeout(100)).then(() => true);
        }
    }
    exports.TestService = TestService;
    class TestChannel {
        constructor(testService) {
            this.testService = testService;
        }
        listen(_, event) {
            switch (event) {
                case 'marco': return this.testService.onMarco;
            }
            throw new Error('Event not found');
        }
        call(_, command, ...args) {
            switch (command) {
                case 'pong': return this.testService.pong(args[0]);
                case 'cancelMe': return this.testService.cancelMe();
                case 'marco': return this.testService.marco();
                default: return Promise.reject(new Error(`command not found: ${command}`));
            }
        }
    }
    exports.TestChannel = TestChannel;
    class TestServiceClient {
        constructor(channel) {
            this.channel = channel;
        }
        get onMarco() { return this.channel.listen('marco'); }
        marco() {
            return this.channel.call('marco');
        }
        pong(ping) {
            return this.channel.call('pong', ping);
        }
        cancelMe() {
            return this.channel.call('cancelMe');
        }
    }
    exports.TestServiceClient = TestServiceClient;
});
//# sourceMappingURL=testService.js.map