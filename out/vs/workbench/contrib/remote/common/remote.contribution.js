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
define(["require", "exports", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/platform/label/common/label", "vs/base/common/platform", "vs/base/common/network", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/log/common/log", "vs/platform/log/common/logIpc", "vs/workbench/contrib/output/common/output", "vs/nls", "vs/base/common/resources", "vs/base/common/lifecycle", "vs/workbench/common/views"], function (require, exports, contributions_1, platform_1, label_1, platform_2, network_1, remoteAgentService_1, log_1, logIpc_1, output_1, nls_1, resources_1, lifecycle_1, views_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VIEWLET_ID = 'workbench.view.remote';
    exports.VIEW_CONTAINER = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer(exports.VIEWLET_ID, true, undefined, {
        getOrder: (group) => {
            if (!group) {
                return;
            }
            let matches = /^targets@(\d+)$/.exec(group);
            if (matches) {
                return -1000;
            }
            matches = /^details@(\d+)$/.exec(group);
            if (matches) {
                return -500;
            }
            return;
        }
    });
    let LabelContribution = class LabelContribution {
        constructor(labelService, remoteAgentService) {
            this.labelService = labelService;
            this.remoteAgentService = remoteAgentService;
            this.registerFormatters();
        }
        registerFormatters() {
            this.remoteAgentService.getEnvironment().then(remoteEnvironment => {
                if (remoteEnvironment) {
                    const formatting = {
                        label: '${path}',
                        separator: remoteEnvironment.os === 1 /* Windows */ ? '\\' : '/',
                        tildify: remoteEnvironment.os !== 1 /* Windows */,
                        normalizeDriveLetter: remoteEnvironment.os === 1 /* Windows */,
                        workspaceSuffix: platform_2.isWeb ? undefined : network_1.Schemas.vscodeRemote
                    };
                    this.labelService.registerFormatter({
                        scheme: network_1.Schemas.vscodeRemote,
                        formatting
                    });
                    this.labelService.registerFormatter({
                        scheme: network_1.Schemas.userData,
                        formatting
                    });
                }
            });
        }
    };
    LabelContribution = __decorate([
        __param(0, label_1.ILabelService),
        __param(1, remoteAgentService_1.IRemoteAgentService)
    ], LabelContribution);
    exports.LabelContribution = LabelContribution;
    let RemoteChannelsContribution = class RemoteChannelsContribution extends lifecycle_1.Disposable {
        constructor(logService, remoteAgentService) {
            super();
            const connection = remoteAgentService.getConnection();
            if (connection) {
                const loggerClient = new logIpc_1.LoggerChannelClient(connection.getChannel('logger'));
                loggerClient.setLevel(logService.getLevel());
                this._register(logService.onDidChangeLogLevel(level => loggerClient.setLevel(level)));
            }
        }
    };
    RemoteChannelsContribution = __decorate([
        __param(0, log_1.ILogService),
        __param(1, remoteAgentService_1.IRemoteAgentService)
    ], RemoteChannelsContribution);
    let RemoteLogOutputChannels = class RemoteLogOutputChannels {
        constructor(remoteAgentService) {
            remoteAgentService.getEnvironment().then(remoteEnv => {
                if (remoteEnv) {
                    const outputChannelRegistry = platform_1.Registry.as(output_1.Extensions.OutputChannels);
                    outputChannelRegistry.registerChannel({ id: 'remoteExtensionLog', label: nls_1.localize('remoteExtensionLog', "Remote Server"), file: resources_1.joinPath(remoteEnv.logsPath, `${remoteAgentService_1.RemoteExtensionLogFileName}.log`), log: true });
                }
            });
        }
    };
    RemoteLogOutputChannels = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService)
    ], RemoteLogOutputChannels);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(LabelContribution, 1 /* Starting */);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteChannelsContribution, 1 /* Starting */);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteLogOutputChannels, 3 /* Restored */);
});
//# sourceMappingURL=remote.contribution.js.map