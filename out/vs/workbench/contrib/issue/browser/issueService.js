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
define(["require", "exports", "vs/base/common/uri", "vs/code/common/issue/issueReporterUtil", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/common/opener", "vs/platform/product/common/productService"], function (require, exports, uri_1, issueReporterUtil_1, extensionManagement_1, instantiation_1, opener_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IWebIssueService = instantiation_1.createDecorator('webIssueService');
    let WebIssueService = class WebIssueService {
        constructor(extensionManagementService, openerService, productService) {
            this.extensionManagementService = extensionManagementService;
            this.openerService = openerService;
            this.productService = productService;
        }
        async openReporter(options) {
            let repositoryUrl = this.productService.reportIssueUrl;
            if (options.extensionId) {
                const extensionGitHubUrl = await this.getExtensionGitHubUrl(options.extensionId);
                if (extensionGitHubUrl) {
                    repositoryUrl = extensionGitHubUrl + '/issues/new';
                }
            }
            if (repositoryUrl) {
                return this.openerService.open(uri_1.URI.parse(repositoryUrl)).then(_ => { });
            }
            else {
                throw new Error(`Unable to find issue reporting url for ${options.extensionId}`);
            }
        }
        async getExtensionGitHubUrl(extensionId) {
            var _a, _b, _c, _d;
            let repositoryUrl = '';
            const extensions = await this.extensionManagementService.getInstalled(1 /* User */);
            const selectedExtension = extensions.filter(ext => ext.identifier.id === extensionId)[0];
            const bugsUrl = (_b = (_a = selectedExtension) === null || _a === void 0 ? void 0 : _a.manifest.bugs) === null || _b === void 0 ? void 0 : _b.url;
            const extensionUrl = (_d = (_c = selectedExtension) === null || _c === void 0 ? void 0 : _c.manifest.repository) === null || _d === void 0 ? void 0 : _d.url;
            // If given, try to match the extension's bug url
            if (bugsUrl && bugsUrl.match(/^https?:\/\/github\.com\/(.*)/)) {
                repositoryUrl = issueReporterUtil_1.normalizeGitHubUrl(bugsUrl);
            }
            else if (extensionUrl && extensionUrl.match(/^https?:\/\/github\.com\/(.*)/)) {
                repositoryUrl = issueReporterUtil_1.normalizeGitHubUrl(extensionUrl);
            }
            return repositoryUrl;
        }
    };
    WebIssueService = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementService),
        __param(1, opener_1.IOpenerService),
        __param(2, productService_1.IProductService)
    ], WebIssueService);
    exports.WebIssueService = WebIssueService;
});
//# sourceMappingURL=issueService.js.map