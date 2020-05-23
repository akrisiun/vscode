/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/nls", "vs/workbench/services/editor/common/editorService"], function (require, exports, uri_1, nls_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readTrustedDomains = exports.configureOpenerTrustedDomainsHandler = exports.manageTrustedDomainSettingsCommand = exports.TRUSTED_DOMAINS_CONTENT_STORAGE_KEY = exports.TRUSTED_DOMAINS_STORAGE_KEY = void 0;
    const TRUSTED_DOMAINS_URI = uri_1.URI.parse('trustedDomains:/Trusted Domains');
    exports.TRUSTED_DOMAINS_STORAGE_KEY = 'http.linkProtectionTrustedDomains';
    exports.TRUSTED_DOMAINS_CONTENT_STORAGE_KEY = 'http.linkProtectionTrustedDomainsContent';
    exports.manageTrustedDomainSettingsCommand = {
        id: 'workbench.action.manageTrustedDomain',
        description: {
            description: nls_1.localize('trustedDomain.manageTrustedDomain', 'Manage Trusted Domains'),
            args: []
        },
        handler: async (accessor) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            editorService.openEditor({ resource: TRUSTED_DOMAINS_URI, mode: 'jsonc' });
            return;
        }
    };
    async function configureOpenerTrustedDomainsHandler(trustedDomains, domainToConfigure, quickInputService, storageService, editorService, telemetryService) {
        const parsedDomainToConfigure = uri_1.URI.parse(domainToConfigure);
        const toplevelDomainSegements = parsedDomainToConfigure.authority.split('.');
        const domainEnd = toplevelDomainSegements.slice(toplevelDomainSegements.length - 2).join('.');
        const topLevelDomain = '*.' + domainEnd;
        const trustDomainAndOpenLinkItem = {
            type: 'item',
            label: nls_1.localize('trustedDomain.trustDomain', 'Trust {0}', domainToConfigure),
            id: 'trustDomain',
            picked: true
        };
        const trustSubDomainAndOpenLinkItem = {
            type: 'item',
            label: nls_1.localize('trustedDomain.trustSubDomain', 'Trust {0} and all its subdomains', domainEnd),
            id: 'trustSubdomain'
        };
        const openAllLinksItem = {
            type: 'item',
            label: nls_1.localize('trustedDomain.trustAllDomains', 'Trust all domains (disables link protection)'),
            id: 'trustAll'
        };
        const manageTrustedDomainItem = {
            type: 'item',
            label: nls_1.localize('trustedDomain.manageTrustedDomains', 'Manage Trusted Domains'),
            id: 'manage'
        };
        const pickedResult = await quickInputService.pick([trustDomainAndOpenLinkItem, trustSubDomainAndOpenLinkItem, openAllLinksItem, manageTrustedDomainItem], {
            activeItem: trustDomainAndOpenLinkItem
        });
        if (pickedResult && pickedResult.id) {
            telemetryService.publicLog2('trustedDomains.configureTrustedDomainsQuickPickChoice', { choice: pickedResult.id });
            switch (pickedResult.id) {
                case 'manage':
                    editorService.openEditor({
                        resource: TRUSTED_DOMAINS_URI,
                        mode: 'jsonc'
                    });
                    return trustedDomains;
                case 'trustDomain':
                case 'trustSubdomain':
                case 'trustAll':
                    const itemToTrust = pickedResult.id === 'trustDomain'
                        ? domainToConfigure
                        : pickedResult.id === 'trustSubdomain' ? topLevelDomain : '*';
                    if (trustedDomains.indexOf(itemToTrust) === -1) {
                        storageService.remove(exports.TRUSTED_DOMAINS_CONTENT_STORAGE_KEY, 0 /* GLOBAL */);
                        storageService.store(exports.TRUSTED_DOMAINS_STORAGE_KEY, JSON.stringify([...trustedDomains, itemToTrust]), 0 /* GLOBAL */);
                        return [...trustedDomains, pickedResult.id];
                    }
            }
        }
        return [];
    }
    exports.configureOpenerTrustedDomainsHandler = configureOpenerTrustedDomainsHandler;
    function readTrustedDomains(storageService, productService) {
        const defaultTrustedDomains = productService.linkProtectionTrustedDomains
            ? [...productService.linkProtectionTrustedDomains]
            : [];
        let trustedDomains = [];
        try {
            const trustedDomainsSrc = storageService.get(exports.TRUSTED_DOMAINS_STORAGE_KEY, 0 /* GLOBAL */);
            if (trustedDomainsSrc) {
                trustedDomains = JSON.parse(trustedDomainsSrc);
            }
        }
        catch (err) { }
        return {
            defaultTrustedDomains,
            trustedDomains
        };
    }
    exports.readTrustedDomains = readTrustedDomains;
});
//# sourceMappingURL=trustedDomains.js.map