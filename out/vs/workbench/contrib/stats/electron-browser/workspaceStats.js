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
define(["require", "exports", "crypto", "vs/base/common/errors", "vs/base/common/uri", "vs/platform/files/common/files", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/base/common/strings", "vs/workbench/services/textfile/common/textfiles", "vs/platform/ipc/electron-browser/sharedProcessService", "vs/workbench/contrib/stats/common/workspaceStats", "vs/platform/request/common/request", "vs/base/common/platform"], function (require, exports, crypto, errors_1, uri_1, files_1, telemetry_1, workspace_1, strings_1, textfiles_1, sharedProcessService_1, workspaceStats_1, request_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const SshProtocolMatcher = /^([^@:]+@)?([^:]+):/;
    const SshUrlMatcher = /^([^@:]+@)?([^:]+):(.+)$/;
    const AuthorityMatcher = /^([^@]+@)?([^:]+)(:\d+)?$/;
    const SecondLevelDomainMatcher = /([^@:.]+\.[^@:.]+)(:\d+)?$/;
    const RemoteMatcher = /^\s*url\s*=\s*(.+\S)\s*$/mg;
    const AnyButDot = /[^.]/g;
    const SecondLevelDomainWhitelist = [
        'github.com',
        'bitbucket.org',
        'visualstudio.com',
        'gitlab.com',
        'heroku.com',
        'azurewebsites.net',
        'ibm.com',
        'amazon.com',
        'amazonaws.com',
        'cloudapp.net',
        'rhcloud.com',
        'google.com'
    ];
    function stripLowLevelDomains(domain) {
        const match = domain.match(SecondLevelDomainMatcher);
        return match ? match[1] : null;
    }
    function extractDomain(url) {
        if (url.indexOf('://') === -1) {
            const match = url.match(SshProtocolMatcher);
            if (match) {
                return stripLowLevelDomains(match[2]);
            }
            else {
                return null;
            }
        }
        try {
            const uri = uri_1.URI.parse(url);
            if (uri.authority) {
                return stripLowLevelDomains(uri.authority);
            }
        }
        catch (e) {
            // ignore invalid URIs
        }
        return null;
    }
    function getDomainsOfRemotes(text, whitelist) {
        const domains = new Set();
        let match;
        while (match = RemoteMatcher.exec(text)) {
            const domain = extractDomain(match[1]);
            if (domain) {
                domains.add(domain);
            }
        }
        const whitemap = whitelist.reduce((map, key) => {
            map[key] = true;
            return map;
        }, Object.create(null));
        const elements = [];
        domains.forEach(e => elements.push(e));
        return elements
            .map(key => whitemap[key] ? key : key.replace(AnyButDot, 'a'));
    }
    exports.getDomainsOfRemotes = getDomainsOfRemotes;
    function stripPort(authority) {
        const match = authority.match(AuthorityMatcher);
        return match ? match[2] : null;
    }
    function normalizeRemote(host, path, stripEndingDotGit) {
        if (host && path) {
            if (stripEndingDotGit && strings_1.endsWith(path, '.git')) {
                path = path.substr(0, path.length - 4);
            }
            return (path.indexOf('/') === 0) ? `${host}${path}` : `${host}/${path}`;
        }
        return null;
    }
    function extractRemote(url, stripEndingDotGit) {
        if (url.indexOf('://') === -1) {
            const match = url.match(SshUrlMatcher);
            if (match) {
                return normalizeRemote(match[2], match[3], stripEndingDotGit);
            }
        }
        try {
            const uri = uri_1.URI.parse(url);
            if (uri.authority) {
                return normalizeRemote(stripPort(uri.authority), uri.path, stripEndingDotGit);
            }
        }
        catch (e) {
            // ignore invalid URIs
        }
        return null;
    }
    function getRemotes(text, stripEndingDotGit = false) {
        const remotes = [];
        let match;
        while (match = RemoteMatcher.exec(text)) {
            const remote = extractRemote(match[1], stripEndingDotGit);
            if (remote) {
                remotes.push(remote);
            }
        }
        return remotes;
    }
    exports.getRemotes = getRemotes;
    function getHashedRemotesFromConfig(text, stripEndingDotGit = false) {
        return getRemotes(text, stripEndingDotGit).map(r => {
            return crypto.createHash('sha1').update(r).digest('hex');
        });
    }
    exports.getHashedRemotesFromConfig = getHashedRemotesFromConfig;
    let WorkspaceStats = class WorkspaceStats {
        constructor(fileService, contextService, telemetryService, requestService, textFileService, sharedProcessService, workspaceStatsService) {
            this.fileService = fileService;
            this.contextService = contextService;
            this.telemetryService = telemetryService;
            this.requestService = requestService;
            this.textFileService = textFileService;
            this.sharedProcessService = sharedProcessService;
            this.workspaceStatsService = workspaceStatsService;
            if (this.telemetryService.isOptedIn) {
                this.report();
            }
        }
        async report() {
            // Windows-only Edition Event
            this.reportWindowsEdition();
            // Workspace Stats
            this.workspaceStatsService.getTags()
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
            const telemetryId = this.workspaceStatsService.getTelemetryWorkspaceId(workspace, state);
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
                    return this.textFileService.read(uri, { acceptTextOnly: true }).then(content => getDomainsOfRemotes(content.value, SecondLevelDomainWhitelist), err => [] // ignore missing or binary file
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
                return this.workspaceStatsService.getHashedRemotesFromUri(workspaceUri, true);
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
                const referencesAzure = WorkspaceStats.searchArray(names, /azure/i);
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
    WorkspaceStats = __decorate([
        __param(0, files_1.IFileService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, request_1.IRequestService),
        __param(4, textfiles_1.ITextFileService),
        __param(5, sharedProcessService_1.ISharedProcessService),
        __param(6, workspaceStats_1.IWorkspaceStatsService)
    ], WorkspaceStats);
    exports.WorkspaceStats = WorkspaceStats;
});
//# sourceMappingURL=workspaceStats.js.map