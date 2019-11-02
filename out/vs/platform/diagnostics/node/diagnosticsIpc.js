/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DiagnosticsChannel {
        constructor(service) {
            this.service = service;
        }
        listen(context, event) {
            throw new Error('Invalid listen');
        }
        call(context, command, args) {
            switch (command) {
                case 'getDiagnostics':
                    return this.service.getDiagnostics(args[0], args[1]);
                case 'getSystemInfo':
                    return this.service.getSystemInfo(args[0], args[1]);
                case 'getPerformanceInfo':
                    return this.service.getPerformanceInfo(args[0], args[1]);
                case 'reportWorkspaceStats':
                    return this.service.reportWorkspaceStats(args);
            }
            throw new Error('Invalid call');
        }
    }
    exports.DiagnosticsChannel = DiagnosticsChannel;
    class DiagnosticsService {
        constructor(channel) {
            this.channel = channel;
        }
        getDiagnostics(mainProcessInfo, remoteInfo) {
            return this.channel.call('getDiagnostics', [mainProcessInfo, remoteInfo]);
        }
        getSystemInfo(mainProcessInfo, remoteInfo) {
            return this.channel.call('getSystemInfo', [mainProcessInfo, remoteInfo]);
        }
        getPerformanceInfo(mainProcessInfo, remoteInfo) {
            return this.channel.call('getPerformanceInfo', [mainProcessInfo, remoteInfo]);
        }
        reportWorkspaceStats(workspace) {
            return this.channel.call('reportWorkspaceStats', workspace);
        }
    }
    exports.DiagnosticsService = DiagnosticsService;
});
//# sourceMappingURL=diagnosticsIpc.js.map