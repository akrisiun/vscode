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
define(["require", "exports", "vs/base/common/event", "vs/base/common/json", "vs/platform/files/common/files", "vs/platform/storage/common/storage", "vs/base/common/buffer", "vs/workbench/contrib/url/common/trustedDomains", "vs/platform/product/common/productService"], function (require, exports, event_1, json_1, files_1, storage_1, buffer_1, trustedDomains_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const TRUSTED_DOMAINS_SCHEMA = 'trustedDomains';
    const TRUSTED_DOMAINS_STAT = {
        type: files_1.FileType.File,
        ctime: Date.now(),
        mtime: Date.now(),
        size: 0
    };
    const CONFIG_HELP_TEXT_PRE = `// Links matching one or more entries in the list below can be opened without link protection.
// The following examples show what entries can look like:
// - "https://microsoft.com": Matches this specific domain using https
// - "https://*.microsoft.com": Match all domains ending in "microsoft.com" using https
// - "microsoft.com": Match this specific domain using either http or https
// - "*.microsoft.com": Match all domains ending in "microsoft.com" using either http or https
// - "*": Match all domains using either http or https
//
`;
    const CONFIG_HELP_TEXT_AFTER = `//
// You can use the "Manage Trusted Domains" command to open this file.
// Save this file to apply the trusted domains rules.
`;
    const CONFIG_PLACEHOLDER_TEXT = `[
	// "https://microsoft.com"
]`;
    function computeTrustedDomainContent(defaultTrustedDomains, trustedDomains) {
        let content = CONFIG_HELP_TEXT_PRE;
        if (defaultTrustedDomains.length > 0) {
            content += `// By default, VS Code trusts "localhost" as well as the following domains:\n`;
            defaultTrustedDomains.forEach(d => {
                content += `// - "${d}"\n`;
            });
        }
        else {
            content += `// By default, VS Code trusts "localhost".\n`;
        }
        content += CONFIG_HELP_TEXT_AFTER;
        if (trustedDomains.length === 0) {
            content += CONFIG_PLACEHOLDER_TEXT;
        }
        else {
            content += JSON.stringify(trustedDomains, null, 2);
        }
        return content;
    }
    let TrustedDomainsFileSystemProvider = class TrustedDomainsFileSystemProvider {
        constructor(fileService, storageService, productService) {
            this.fileService = fileService;
            this.storageService = storageService;
            this.productService = productService;
            this.capabilities = 2 /* FileReadWrite */;
            this.onDidChangeCapabilities = event_1.Event.None;
            this.onDidChangeFile = event_1.Event.None;
            this.fileService.registerProvider(TRUSTED_DOMAINS_SCHEMA, this);
        }
        stat(resource) {
            return Promise.resolve(TRUSTED_DOMAINS_STAT);
        }
        readFile(resource) {
            let trustedDomainsContent = this.storageService.get('http.linkProtectionTrustedDomainsContent', 0 /* GLOBAL */);
            if (!trustedDomainsContent ||
                trustedDomainsContent.indexOf(CONFIG_HELP_TEXT_PRE) === -1 ||
                trustedDomainsContent.indexOf(CONFIG_HELP_TEXT_AFTER) === -1) {
                const { defaultTrustedDomains, trustedDomains } = trustedDomains_1.readTrustedDomains(this.storageService, this.productService);
                trustedDomainsContent = computeTrustedDomainContent(defaultTrustedDomains, trustedDomains);
            }
            const buffer = buffer_1.VSBuffer.fromString(trustedDomainsContent).buffer;
            return Promise.resolve(buffer);
        }
        writeFile(resource, content, opts) {
            try {
                const trustedDomainsContent = content.toString();
                const trustedDomains = json_1.parse(trustedDomainsContent);
                this.storageService.store('http.linkProtectionTrustedDomainsContent', trustedDomainsContent, 0 /* GLOBAL */);
                this.storageService.store('http.linkProtectionTrustedDomains', JSON.stringify(trustedDomains), 0 /* GLOBAL */);
            }
            catch (err) { }
            return Promise.resolve();
        }
        watch(resource, opts) {
            return {
                dispose() {
                    return;
                }
            };
        }
        mkdir(resource) {
            return Promise.resolve(undefined);
        }
        readdir(resource) {
            return Promise.resolve(undefined);
        }
        delete(resource, opts) {
            return Promise.resolve(undefined);
        }
        rename(from, to, opts) {
            return Promise.resolve(undefined);
        }
    };
    TrustedDomainsFileSystemProvider = __decorate([
        __param(0, files_1.IFileService),
        __param(1, storage_1.IStorageService),
        __param(2, productService_1.IProductService)
    ], TrustedDomainsFileSystemProvider);
    exports.TrustedDomainsFileSystemProvider = TrustedDomainsFileSystemProvider;
});
//# sourceMappingURL=trustedDomainsFileSystemProvider.js.map