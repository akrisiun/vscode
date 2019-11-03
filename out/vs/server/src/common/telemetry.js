define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TelemetryChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            throw new Error(`Invalid listen ${event}`);
        }
        call(_, command, args) {
            switch (command) {
                case "publicLog": return this.service.publicLog(args[0], args[1], args[2]);
                case "publicLog2": return this.service.publicLog2(args[0], args[1], args[2]);
                case "setEnabled": return Promise.resolve(this.service.setEnabled(args[0]));
                case "getTelemetryInfo": return this.service.getTelemetryInfo();
            }
            throw new Error(`Invalid call ${command}`);
        }
    }
    exports.TelemetryChannel = TelemetryChannel;
    class TelemetryChannelClient {
        constructor(channel) {
            this.channel = channel;
        }
        publicLog(eventName, data, anonymizeFilePaths) {
            return this.channel.call("publicLog", [eventName, data, anonymizeFilePaths]);
        }
        publicLog2(eventName, data, anonymizeFilePaths) {
            return this.channel.call("publicLog2", [eventName, data, anonymizeFilePaths]);
        }
        setEnabled(value) {
            this.channel.call("setEnable", [value]);
        }
        getTelemetryInfo() {
            return this.channel.call("getTelemetryInfo");
        }
        get isOptedIn() {
            return true;
        }
    }
    exports.TelemetryChannelClient = TelemetryChannelClient;
});
//# sourceMappingURL=telemetry.js.map