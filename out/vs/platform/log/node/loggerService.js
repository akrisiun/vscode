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
define(["require", "exports", "vs/platform/log/common/log", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/network", "vs/platform/log/common/fileLogService", "vs/platform/instantiation/common/instantiation", "vs/platform/log/node/spdlogService"], function (require, exports, log_1, lifecycle_1, resources_1, network_1, fileLogService_1, instantiation_1, spdlogService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let LoggerService = class LoggerService extends lifecycle_1.Disposable {
        constructor(logService, instantiationService) {
            super();
            this.logService = logService;
            this.instantiationService = instantiationService;
            this.loggers = new Map();
            this._register(logService.onDidChangeLogLevel(level => this.loggers.forEach(logger => logger.setLevel(level))));
        }
        getLogger(resource) {
            let logger = this.loggers.get(resource.toString());
            if (!logger) {
                if (resource.scheme === network_1.Schemas.file) {
                    const baseName = resources_1.basename(resource);
                    const ext = resources_1.extname(resource);
                    logger = new spdlogService_1.SpdLogService(baseName.substring(0, baseName.length - ext.length), resources_1.dirname(resource).fsPath, this.logService.getLevel());
                }
                else {
                    logger = this.instantiationService.createInstance(fileLogService_1.FileLogService, resources_1.basename(resource), resource, this.logService.getLevel());
                }
                this.loggers.set(resource.toString(), logger);
            }
            return logger;
        }
        dispose() {
            this.loggers.forEach(logger => logger.dispose());
            this.loggers.clear();
            super.dispose();
        }
    };
    LoggerService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, instantiation_1.IInstantiationService)
    ], LoggerService);
    exports.LoggerService = LoggerService;
});
//# sourceMappingURL=loggerService.js.map