/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/debug/common/debug", "vs/base/parts/ipc/node/ipc.cp", "vs/platform/telemetry/node/telemetryIpc", "vs/base/common/amd", "vs/platform/telemetry/common/telemetryService", "vs/platform/instantiation/common/extensions"], function (require, exports, debug_1, ipc_cp_1, telemetryIpc_1, amd_1, telemetryService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class NodeDebugHelperService {
        createTelemetryService(configurationService, args) {
            const client = new ipc_cp_1.Client(amd_1.getPathFromAmdModule(require, 'bootstrap-fork'), {
                serverName: 'Debug Telemetry',
                timeout: 1000 * 60 * 5,
                args: args,
                env: {
                    ELECTRON_RUN_AS_NODE: 1,
                    PIPE_LOGGING: 'true',
                    AMD_ENTRYPOINT: 'vs/workbench/contrib/debug/node/telemetryApp'
                }
            });
            const channel = client.getChannel('telemetryAppender');
            const appender = new telemetryIpc_1.TelemetryAppenderClient(channel);
            return new telemetryService_1.TelemetryService({ appender }, configurationService);
        }
    }
    exports.NodeDebugHelperService = NodeDebugHelperService;
    extensions_1.registerSingleton(debug_1.IDebugHelperService, NodeDebugHelperService);
});
//# sourceMappingURL=debugHelperService.js.map