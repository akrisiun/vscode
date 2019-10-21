/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class WatcherChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event, arg) {
            switch (event) {
                case 'watch': return this.service.watch(arg);
                case 'onLogMessage': return this.service.onLogMessage;
            }
            throw new Error(`Event not found: ${event}`);
        }
        call(_, command, arg) {
            switch (command) {
                case 'setRoots': return this.service.setRoots(arg);
                case 'setVerboseLogging': return this.service.setVerboseLogging(arg);
                case 'stop': return this.service.stop();
            }
            throw new Error(`Call not found: ${command}`);
        }
    }
    exports.WatcherChannel = WatcherChannel;
    class WatcherChannelClient {
        constructor(channel) {
            this.channel = channel;
        }
        watch(options) {
            return this.channel.listen('watch', options);
        }
        setVerboseLogging(enable) {
            return this.channel.call('setVerboseLogging', enable);
        }
        setRoots(roots) {
            return this.channel.call('setRoots', roots);
        }
        get onLogMessage() {
            return this.channel.listen('onLogMessage');
        }
        stop() {
            return this.channel.call('stop');
        }
    }
    exports.WatcherChannelClient = WatcherChannelClient;
});
//# sourceMappingURL=watcherIpc.js.map