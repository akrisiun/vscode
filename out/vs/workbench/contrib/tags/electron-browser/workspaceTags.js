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
define(["require", "exports", "crypto", "vs/base/common/errors", "vs/platform/files/common/files", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/workbench/services/textfile/common/textfiles", "vs/platform/ipc/electron-browser/sharedProcessService", "vs/workbench/contrib/tags/common/workspaceTags", "vs/platform/request/common/request", "vs/base/common/platform", "vs/platform/extensionManagement/common/configRemotes"], function (require, exports, crypto, errors_1, files_1, telemetry_1, workspace_1, textfiles_1, sharedProcessService_1, workspaceTags_1, request_1, platform_1, configRemotes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceTags = exports.getHashedRemotesFromConfig = void 0;
    function getHashedRemotesFromConfig(text, stripEndingDotGit = false) {
        return configRemotes_1.getRemotes(text, stripEndingDotGit).map(r => {
            return crypto.createHash('sha1').update(r).digest('hex');
        });
    }
    exports.getHashedRemotesFromConfig = getHashedRemotesFromConfig;
    let WorkspaceTags = /** @class */ (() => {
        let WorkspaceTags = class WorkspaceTags {
            constructor(fileService, contextService, telemetryService, requestService, textFileService, sharedProcessService, workspaceTagsService) {
                this.fileService = fileService;
                this.contextService = contextService;
                this.telemetryService = telemetryService;
                this.requestService = requestService;
                this.textFileService = textFileService;
                this.sharedProcessService = sharedProcessService;
                this.workspaceTagsService = workspaceTagsService;
                if (this.telemetryService.isOptedIn) {
                    this.report();
                }
            }
            async report() {
                // Windows-only Edition Event
                this.reportWindowsEdition();
                // Workspace Tags
                this.workspaceTagsService.getTags()
                    .then(tags => this.reportWorkspaceTags(tags), error => errors_1.onUnexpectedError(error));
                // Cloud Stats
                this.reportCloudStats();
                this.reportProxyStats();
                const diagnosticsChannel = this.sharedProcessService.getChannel('diagnostics');
                this.getWorkspaceInformation().then(stats => diagnosticsChannel.call('reportWorkspaceStats', stats));
            }
            async reportWindowsEdition() {
                if (!platform_1.isWindows) {
                    return;
                }
                const Registry = await new Promise((resolve_1, reject_1) => { require(['vscode-windows-registry'], resolve_1, reject_1); });
                let value;
                try {
                    value = Registry.GetStringRegKey('HKEY_LOCAL_MACHINE', 'SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion', 'EditionID');
                }
                catch (_a) { }
                if (value === undefined) {
                    value = 'Unknown';
                }
                this.telemetryService.publicLog2('windowsEdition', { edition: value });
            }
            async getWorkspaceInformation() {
                const workspace = this.contextService.getWorkspace();
                const state = this.contextService.getWorkbenchState();
                const telemetryId = this.workspaceTagsService.getTelemetryWorkspaceId(workspace, state);
                return this.telemetryService.getTelemetryInfo().then(info => {
                    return {
                        id: workspace.id,
                        telemetryId,
                        rendererSessionId: info.sessionId,
                        folders: workspace.folders,
                        configuration: workspace.configuration
                    };
                });
            }
            reportWorkspaceTags(tags) {
                /* __GDPR__
                    "workspce.tags" : {
                        "${include}": [
                            "${WorkspaceTags}"
                        ]
                    }
                */
                this.telemetryService.publicLog('workspce.tags', tags);
            }
            reportRemoteDomains(workspaceUris) {
                Promise.all(workspaceUris.map(workspaceUri => {
                    const path = workspaceUri.path;
                    const uri = workspaceUri.with({ path: `${path !== '/' ? path : ''}/.git/config` });
                    return this.fileService.exists(uri).then(exists => {
                        if (!exists) {
                            return [];
                        }
                        return this.textFileService.read(uri, { acceptTextOnly: true }).then(content => configRemotes_1.getDomainsOfRemotes(content.value, configRemotes_1.SecondLevelDomainWhitelist), err => [] // ignore missing or binary file
                        );
                    });
                })).then(domains => {
                    const set = domains.reduce((set, list) => list.reduce((set, item) => set.add(item), set), new Set());
                    const list = [];
                    set.forEach(item => list.push(item));
                    /* __GDPR__
                        "workspace.remotes" : {
                            "domains" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                        }
                    */
                    this.telemetryService.publicLog('workspace.remotes', { domains: list.sort() });
                }, errors_1.onUnexpectedError);
            }
            reportRemotes(workspaceUris) {
                Promise.all(workspaceUris.map(workspaceUri => {
                    return this.workspaceTagsService.getHashedRemotesFromUri(workspaceUri, true);
                })).then(hashedRemotes => {
                    /* __GDPR__
                            "workspace.hashedRemotes" : {
                                "remotes" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                            }
                        */
                    this.telemetryService.publicLog('workspace.hashedRemotes', { remotes: hashedRemotes });
                }, errors_1.onUnexpectedError);
            }
            /* __GDPR__FRAGMENT__
                "AzureTags" : {
                    "node" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
                }
            */
            reportAzureNode(workspaceUris, tags) {
                // TODO: should also work for `node_modules` folders several levels down
                const uris = workspaceUris.map(workspaceUri => {
                    const path = workspaceUri.path;
                    return workspaceUri.with({ path: `${path !== '/' ? path : ''}/node_modules` });
                });
                return this.fileService.resolveAll(uris.map(resource => ({ resource }))).then(results => {
                    const names = [].concat(...results.map(result => result.success ? (result.stat.children || []) : [])).map(c => c.name);
                    const referencesAzure = WorkspaceTags.searchArray(names, /azure/i);
                    if (referencesAzure) {
                        tags['node'] = true;
                    }
                    return tags;
                }, err => {
                    return tags;
                });
            }
            static searchArray(arr, regEx) {
                return arr.some(v => v.search(regEx) > -1) || undefined;
            }
            /* __GDPR__FRAGMENT__
                "AzureTags" : {
                    "java" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
                }
            */
            reportAzureJava(workspaceUris, tags) {
                return Promise.all(workspaceUris.map(workspaceUri => {
                    const path = workspaceUri.path;
                    const uri = workspaceUri.with({ path: `${path !== '/' ? path : ''}/pom.xml` });
                    return this.fileService.exists(uri).then(exists => {
                        if (!exists) {
                            return false;
                        }
                        return this.textFileService.read(uri, { acceptTextOnly: true }).then(content => !!content.value.match(/azure/i), err => false);
                    });
                })).then(javas => {
                    if (javas.indexOf(true) !== -1) {
                        tags['java'] = true;
                    }
                    return tags;
                });
            }
            reportAzure(uris) {
                const tags = Object.create(null);
                this.reportAzureNode(uris, tags).then((tags) => {
                    return this.reportAzureJava(uris, tags);
                }).then((tags) => {
                    if (Object.keys(tags).length) {
                        /* __GDPR__
                            "workspace.azure" : {
                                "${include}": [
                                    "${AzureTags}"
                                ]
                            }
                        */
                        this.telemetryService.publicLog('workspace.azure', tags);
                    }
                }).then(undefined, errors_1.onUnexpectedError);
            }
            reportCloudStats() {
                const uris = this.contextService.getWorkspace().folders.map(folder => folder.uri);
                if (uris.length && this.fileService) {
                    this.reportRemoteDomains(uris);
                    this.reportRemotes(uris);
                    this.reportAzure(uris);
                }
            }
            reportProxyStats() {
                this.requestService.resolveProxy('https://www.example.com/')
                    .then(proxy => {
                    let type = proxy ? String(proxy).trim().split(/\s+/, 1)[0] : 'EMPTY';
                    if (['DIRECT', 'PROXY', 'HTTPS', 'SOCKS', 'EMPTY'].indexOf(type) === -1) {
                        type = 'UNKNOWN';
                    }
                    this.telemetryService.publicLog2('resolveProxy.stats', { type });
                }).then(undefined, errors_1.onUnexpectedError);
            }
        };
        WorkspaceTags = __decorate([
            __param(0, files_1.IFileService),
            __param(1, workspace_1.IWorkspaceContextService),
            __param(2, telemetry_1.ITelemetryService),
            __param(3, request_1.IRequestService),
            __param(4, textfiles_1.ITextFileService),
            __param(5, sharedProcessService_1.ISharedProcessService),
            __param(6, workspaceTags_1.IWorkspaceTagsService)
        ], WorkspaceTags);
        return WorkspaceTags;
    })();
    exports.WorkspaceTags = WorkspaceTags;
});
//# sourceMappingURL=workspaceTags.js.map