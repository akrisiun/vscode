/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/common/arrays"], function (require, exports, extensionsRegistry_1, extensionManagementUtil_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function isWebExtension(manifest, configurationService) {
        const extensionKind = getExtensionKind(manifest, configurationService);
        return extensionKind === 'web';
    }
    exports.isWebExtension = isWebExtension;
    function isUIExtension(manifest, productService, configurationService) {
        const uiContributions = extensionsRegistry_1.ExtensionsRegistry.getExtensionPoints().filter(e => e.defaultExtensionKind !== 'workspace').map(e => e.name);
        const extensionId = extensionManagementUtil_1.getGalleryExtensionId(manifest.publisher, manifest.name);
        const extensionKind = getExtensionKind(manifest, configurationService);
        switch (extensionKind) {
            case 'ui': return true;
            case 'workspace': return false;
            default: {
                // Tagged as UI extension in product
                if (arrays_1.isNonEmptyArray(productService.uiExtensions) && productService.uiExtensions.some(id => extensionManagementUtil_1.areSameExtensions({ id }, { id: extensionId }))) {
                    return true;
                }
                // Not an UI extension if it has main
                if (manifest.main) {
                    return false;
                }
                // Not an UI extension if it has dependencies or an extension pack
                if (arrays_1.isNonEmptyArray(manifest.extensionDependencies) || arrays_1.isNonEmptyArray(manifest.extensionPack)) {
                    return false;
                }
                if (manifest.contributes) {
                    // Not an UI extension if it has no ui contributions
                    if (!uiContributions.length || Object.keys(manifest.contributes).some(contribution => uiContributions.indexOf(contribution) === -1)) {
                        return false;
                    }
                }
                return true;
            }
        }
    }
    exports.isUIExtension = isUIExtension;
    function getExtensionKind(manifest, configurationService) {
        const extensionId = extensionManagementUtil_1.getGalleryExtensionId(manifest.publisher, manifest.name);
        const configuredExtensionKinds = configurationService.getValue('remote.extensionKind') || {};
        for (const id of Object.keys(configuredExtensionKinds)) {
            if (extensionManagementUtil_1.areSameExtensions({ id: extensionId }, { id })) {
                return configuredExtensionKinds[id];
            }
        }
        return manifest.extensionKind;
    }
});
//# sourceMappingURL=extensionsUtil.js.map