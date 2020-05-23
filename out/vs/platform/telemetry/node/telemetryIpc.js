/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TelemetryAppenderClient = exports.TelemetryAppenderChannel = void 0;
    class TelemetryAppenderChannel {
        constructor(appender) {
            this.appender = appender;
        }
        listen(_, event) {
            throw new Error(`Event not found: ${event}`);
        }
        call(_, command, { eventName, data }) {
            this.appender.log(eventName, data);
            return Promise.resolve(null);
        }
    }
    exports.TelemetryAppenderChannel = TelemetryAppenderChannel;
    class TelemetryAppenderClient {
        constructor(channel) {
            this.channel = channel;
        }
        log(eventName, data) {
            this.channel.call('log', { eventName, data })
                .then(undefined, err => `Failed to log telemetry: ${console.warn(err)}`);
            return Promise.resolve(null);
        }
        flush() {
            // TODO
            return Promise.resolve();
        }
    }
    exports.TelemetryAppenderClient = TelemetryAppenderClient;
});
//# sourceMappingURL=telemetryIpc.js.map