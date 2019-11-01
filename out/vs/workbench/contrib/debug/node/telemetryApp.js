/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/parts/ipc/node/ipc.cp", "vs/platform/telemetry/node/appInsightsAppender", "vs/platform/telemetry/node/telemetryIpc"], function (require, exports, ipc_cp_1, appInsightsAppender_1, telemetryIpc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const appender = new appInsightsAppender_1.AppInsightsAppender(process.argv[2], JSON.parse(process.argv[3]), process.argv[4]);
    process.once('exit', () => appender.flush());
    const channel = new telemetryIpc_1.TelemetryAppenderChannel(appender);
    const server = new ipc_cp_1.Server('telemetry');
    server.registerChannel('telemetryAppender', channel);
});
//# sourceMappingURL=telemetryApp.js.map