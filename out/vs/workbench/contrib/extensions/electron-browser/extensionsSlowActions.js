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
define(["require", "exports", "os", "vs/platform/product/common/product", "vs/base/common/actions", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/nls", "vs/base/common/cancellation", "vs/platform/request/common/request", "vs/base/common/path", "vs/base/common/errors", "vs/platform/dialogs/common/dialogs", "vs/base/common/severity", "vs/platform/opener/common/opener"], function (require, exports, os, product_1, actions_1, uri_1, instantiation_1, nls_1, cancellation_1, request_1, path_1, errors_1, dialogs_1, severity_1, opener_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RepoInfo {
        static fromExtension(desc) {
            let result;
            // scheme:auth/OWNER/REPO/issues/
            if (desc.bugs && typeof desc.bugs.url === 'string') {
                const base = uri_1.URI.parse(desc.bugs.url);
                const match = /\/([^/]+)\/([^/]+)\/issues\/?$/.exec(desc.bugs.url);
                if (match) {
                    result = {
                        base: base.with({ path: null, fragment: null, query: null }).toString(true),
                        owner: match[1],
                        repo: match[2]
                    };
                }
            }
            // scheme:auth/OWNER/REPO.git
            if (!result && desc.repository && typeof desc.repository.url === 'string') {
                const base = uri_1.URI.parse(desc.repository.url);
                const match = /\/([^/]+)\/([^/]+)(\.git)?$/.exec(desc.repository.url);
                if (match) {
                    result = {
                        base: base.with({ path: null, fragment: null, query: null }).toString(true),
                        owner: match[1],
                        repo: match[2]
                    };
                }
            }
            // for now only GH is supported
            if (result && result.base.indexOf('github') === -1) {
                result = undefined;
            }
            return result;
        }
    }
    let SlowExtensionAction = class SlowExtensionAction extends actions_1.Action {
        constructor(extension, profile, _instantiationService) {
            super('report.slow', nls_1.localize('cmd.reportOrShow', "Performance Issue"), 'extension-action report-issue');
            this.extension = extension;
            this.profile = profile;
            this._instantiationService = _instantiationService;
            this.enabled = Boolean(RepoInfo.fromExtension(extension));
        }
        async run() {
            const action = await this._instantiationService.invokeFunction(createSlowExtensionAction, this.extension, this.profile);
            if (action) {
                await action.run();
            }
        }
    };
    SlowExtensionAction = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], SlowExtensionAction);
    exports.SlowExtensionAction = SlowExtensionAction;
    async function createSlowExtensionAction(accessor, extension, profile) {
        const info = RepoInfo.fromExtension(extension);
        if (!info) {
            return undefined;
        }
        const requestService = accessor.get(request_1.IRequestService);
        const instaService = accessor.get(instantiation_1.IInstantiationService);
        const url = `https://api.github.com/search/issues?q=is:issue+state:open+in:title+repo:${info.owner}/${info.repo}+%22Extension+causes+high+cpu+load%22`;
        const res = await requestService.request({ url }, cancellation_1.CancellationToken.None);
        const rawText = await request_1.asText(res);
        if (!rawText) {
            return undefined;
        }
        const data = JSON.parse(rawText);
        if (!data || typeof data.total_count !== 'number') {
            return undefined;
        }
        else if (data.total_count === 0) {
            return instaService.createInstance(ReportExtensionSlowAction, extension, info, profile);
        }
        else {
            return instaService.createInstance(ShowExtensionSlowAction, extension, info, profile);
        }
    }
    exports.createSlowExtensionAction = createSlowExtensionAction;
    let ReportExtensionSlowAction = class ReportExtensionSlowAction extends actions_1.Action {
        constructor(extension, repoInfo, profile, _dialogService, _openerService) {
            super('report.slow', nls_1.localize('cmd.report', "Report Issue"));
            this.extension = extension;
            this.repoInfo = repoInfo;
            this.profile = profile;
            this._dialogService = _dialogService;
            this._openerService = _openerService;
        }
        async run() {
            // rewrite pii (paths) and store on disk
            const profiler = await new Promise((resolve_1, reject_1) => { require(['v8-inspect-profiler'], resolve_1, reject_1); });
            const data = profiler.rewriteAbsolutePaths({ profile: this.profile.data }, 'pii_removed');
            const path = path_1.join(os.homedir(), `${this.extension.identifier.value}-unresponsive.cpuprofile.txt`);
            await profiler.writeProfile(data, path).then(undefined, errors_1.onUnexpectedError);
            // build issue
            const title = encodeURIComponent('Extension causes high cpu load');
            const osVersion = `${os.type()} ${os.arch()} ${os.release()}`;
            const message = `:warning: Make sure to **attach** this file from your *home*-directory:\n:warning:\`${path}\`\n\nFind more details here: https://github.com/microsoft/vscode/wiki/Explain-extension-causes-high-cpu-load`;
            const body = encodeURIComponent(`- Issue Type: \`Performance\`
- Extension Name: \`${this.extension.name}\`
- Extension Version: \`${this.extension.version}\`
- OS Version: \`${osVersion}\`
- VSCode version: \`${product_1.default.version}\`\n\n${message}`);
            const url = `${this.repoInfo.base}/${this.repoInfo.owner}/${this.repoInfo.repo}/issues/new/?body=${body}&title=${title}`;
            this._openerService.open(uri_1.URI.parse(url));
            this._dialogService.show(severity_1.default.Info, nls_1.localize('attach.title', "Did you attach the CPU-Profile?"), [nls_1.localize('ok', 'OK')], { detail: nls_1.localize('attach.msg', "This is a reminder to make sure that you have not forgotten to attach '{0}' to the issue you have just created.", path) });
        }
    };
    ReportExtensionSlowAction = __decorate([
        __param(3, dialogs_1.IDialogService),
        __param(4, opener_1.IOpenerService)
    ], ReportExtensionSlowAction);
    let ShowExtensionSlowAction = class ShowExtensionSlowAction extends actions_1.Action {
        constructor(extension, repoInfo, profile, _dialogService, _openerService) {
            super('show.slow', nls_1.localize('cmd.show', "Show Issues"));
            this.extension = extension;
            this.repoInfo = repoInfo;
            this.profile = profile;
            this._dialogService = _dialogService;
            this._openerService = _openerService;
        }
        async run() {
            // rewrite pii (paths) and store on disk
            const profiler = await new Promise((resolve_2, reject_2) => { require(['v8-inspect-profiler'], resolve_2, reject_2); });
            const data = profiler.rewriteAbsolutePaths({ profile: this.profile.data }, 'pii_removed');
            const path = path_1.join(os.homedir(), `${this.extension.identifier.value}-unresponsive.cpuprofile.txt`);
            await profiler.writeProfile(data, path).then(undefined, errors_1.onUnexpectedError);
            // show issues
            const url = `${this.repoInfo.base}/${this.repoInfo.owner}/${this.repoInfo.repo}/issues?utf8=✓&q=is%3Aissue+state%3Aopen+%22Extension+causes+high+cpu+load%22`;
            this._openerService.open(uri_1.URI.parse(url));
            this._dialogService.show(severity_1.default.Info, nls_1.localize('attach.title', "Did you attach the CPU-Profile?"), [nls_1.localize('ok', 'OK')], { detail: nls_1.localize('attach.msg2', "This is a reminder to make sure that you have not forgotten to attach '{0}' to an existing performance issue.", path) });
        }
    };
    ShowExtensionSlowAction = __decorate([
        __param(3, dialogs_1.IDialogService),
        __param(4, opener_1.IOpenerService)
    ], ShowExtensionSlowAction);
});
//# sourceMappingURL=extensionsSlowActions.js.map