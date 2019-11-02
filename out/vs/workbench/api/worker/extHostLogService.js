/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/api/common/extHostOutput", "vs/workbench/api/common/extHostRpcService", "vs/base/common/resources", "vs/workbench/services/extensions/common/extensions", "vs/nls"], function (require, exports, log_1, extHost_protocol_1, extHostInitDataService_1, extHostOutput_1, extHostRpcService_1, resources_1, extensions_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ExtHostLogService = class ExtHostLogService extends log_1.AbstractLogService {
        constructor(rpc, initData, extHostOutputService) {
            super();
            const logFile = resources_1.joinPath(initData.logsLocation, `${extensions_1.ExtensionHostLogFileName}.log`);
            this._proxy = rpc.getProxy(extHost_protocol_1.MainContext.MainThreadLog);
            this._logFile = logFile.toJSON();
            this.setLevel(initData.logLevel);
            extHostOutputService.createOutputChannelFromLogFile(nls_1.localize('name', "Worker Extension Host"), logFile);
        }
        $setLevel(level) {
            this.setLevel(level);
        }
        trace(_message, ..._args) {
            if (this.getLevel() <= log_1.LogLevel.Trace) {
                this._proxy.$log(this._logFile, log_1.LogLevel.Trace, Array.from(arguments));
            }
        }
        debug(_message, ..._args) {
            if (this.getLevel() <= log_1.LogLevel.Debug) {
                this._proxy.$log(this._logFile, log_1.LogLevel.Debug, Array.from(arguments));
            }
        }
        info(_message, ..._args) {
            if (this.getLevel() <= log_1.LogLevel.Info) {
                this._proxy.$log(this._logFile, log_1.LogLevel.Info, Array.from(arguments));
            }
        }
        warn(_message, ..._args) {
            if (this.getLevel() <= log_1.LogLevel.Warning) {
                this._proxy.$log(this._logFile, log_1.LogLevel.Warning, Array.from(arguments));
            }
        }
        error(_message, ..._args) {
            if (this.getLevel() <= log_1.LogLevel.Error) {
                this._proxy.$log(this._logFile, log_1.LogLevel.Error, Array.from(arguments));
            }
        }
        critical(_message, ..._args) {
            if (this.getLevel() <= log_1.LogLevel.Critical) {
                this._proxy.$log(this._logFile, log_1.LogLevel.Critical, Array.from(arguments));
            }
        }
        flush() { }
    };
    ExtHostLogService = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService),
        __param(2, extHostOutput_1.IExtHostOutputService)
    ], ExtHostLogService);
    exports.ExtHostLogService = ExtHostLogService;
});
//# sourceMappingURL=extHostLogService.js.map