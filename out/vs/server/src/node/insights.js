define(["require", "exports", "https", "http", "os"], function (require, exports, https, http, os) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TelemetryClient {
        constructor() {
            this.config = {};
            this.channel = {
                setUseDiskRetryCaching: () => undefined,
            };
        }
        trackEvent(options) {
            if (!options.properties) {
                options.properties = {};
            }
            if (!options.measurements) {
                options.measurements = {};
            }
            try {
                const cpus = os.cpus();
                options.measurements.cores = cpus.length;
                options.properties["common.cpuModel"] = cpus[0].model;
            }
            catch (error) { }
            try {
                options.measurements.memoryFree = os.freemem();
                options.measurements.memoryTotal = os.totalmem();
            }
            catch (error) { }
            try {
                options.properties["common.shell"] = os.userInfo().shell;
                options.properties["common.release"] = os.release();
                options.properties["common.arch"] = os.arch();
            }
            catch (error) { }
            try {
                const url = process.env.TELEMETRY_URL || "https://v1.telemetry.coder.com/track";
                const request = (/^http:/.test(url) ? http : https).request(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                request.on("error", () => { });
                request.write(JSON.stringify(options));
                request.end();
            }
            catch (error) { }
        }
        flush(options) {
            if (options.callback) {
                options.callback("");
            }
        }
    }
    exports.TelemetryClient = TelemetryClient;
});
//# sourceMappingURL=insights.js.map