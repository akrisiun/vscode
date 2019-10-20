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
define(["require", "exports", "vs/nls", "vs/base/parts/quickopen/browser/quickOpenModel", "vs/workbench/browser/quickopen", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/viewlet/browser/viewlet", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/notification/common/notification"], function (require, exports, nls, quickOpenModel_1, quickopen_1, extensions_1, viewlet_1, extensionManagement_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SimpleEntry extends quickOpenModel_1.QuickOpenEntry {
        constructor(label, action) {
            super();
            this.label = label;
            this.action = action;
        }
        getLabel() {
            return this.label;
        }
        getAriaLabel() {
            return this.label;
        }
        run(mode) {
            if (mode === 0 /* PREVIEW */) {
                return false;
            }
            this.action();
            return true;
        }
    }
    let ExtensionsHandler = class ExtensionsHandler extends quickopen_1.QuickOpenHandler {
        constructor(viewletService) {
            super();
            this.viewletService = viewletService;
        }
        getResults(text, token) {
            const label = nls.localize('manage', "Press Enter to manage your extensions.");
            const action = () => {
                this.viewletService.openViewlet(extensions_1.VIEWLET_ID, true)
                    .then(viewlet => viewlet)
                    .then(viewlet => {
                    viewlet.search('');
                    viewlet.focus();
                });
            };
            return Promise.resolve(new quickOpenModel_1.QuickOpenModel([new SimpleEntry(label, action)]));
        }
        getEmptyLabel(input) {
            return '';
        }
        getAutoFocus(searchValue) {
            return { autoFocusFirstEntry: true };
        }
    };
    ExtensionsHandler.ID = 'workbench.picker.extensions';
    ExtensionsHandler = __decorate([
        __param(0, viewlet_1.IViewletService)
    ], ExtensionsHandler);
    exports.ExtensionsHandler = ExtensionsHandler;
    let GalleryExtensionsHandler = class GalleryExtensionsHandler extends quickopen_1.QuickOpenHandler {
        constructor(viewletService, galleryService, extensionsService, notificationService) {
            super();
            this.viewletService = viewletService;
            this.galleryService = galleryService;
            this.extensionsService = extensionsService;
            this.notificationService = notificationService;
        }
        getResults(text, token) {
            if (/\./.test(text)) {
                return this.galleryService.query({ names: [text], pageSize: 1 }, token)
                    .then(galleryResult => {
                    const entries = [];
                    const galleryExtension = galleryResult.firstPage[0];
                    if (!galleryExtension) {
                        const label = nls.localize('notfound', "Extension '{0}' not found in the Marketplace.", text);
                        entries.push(new SimpleEntry(label, () => null));
                    }
                    else {
                        const label = nls.localize('install', "Press Enter to install '{0}' from the Marketplace.", text);
                        const action = () => {
                            return this.viewletService.openViewlet(extensions_1.VIEWLET_ID, true)
                                .then(viewlet => viewlet)
                                .then(viewlet => viewlet.search(`@id:${text}`))
                                .then(() => this.extensionsService.installFromGallery(galleryExtension))
                                .then(undefined, err => this.notificationService.error(err));
                        };
                        entries.push(new SimpleEntry(label, action));
                    }
                    return new quickOpenModel_1.QuickOpenModel(entries);
                });
            }
            const entries = [];
            if (text) {
                const label = nls.localize('searchFor', "Press Enter to search for '{0}' in the Marketplace.", text);
                const action = () => {
                    this.viewletService.openViewlet(extensions_1.VIEWLET_ID, true)
                        .then(viewlet => viewlet)
                        .then(viewlet => {
                        viewlet.search(text);
                        viewlet.focus();
                    });
                };
                entries.push(new SimpleEntry(label, action));
            }
            return Promise.resolve(new quickOpenModel_1.QuickOpenModel(entries));
        }
        getEmptyLabel(input) {
            return nls.localize('noExtensionsToInstall', "Type an extension name");
        }
        getAutoFocus(searchValue) {
            return { autoFocusFirstEntry: true };
        }
    };
    GalleryExtensionsHandler.ID = 'workbench.picker.gallery';
    GalleryExtensionsHandler = __decorate([
        __param(0, viewlet_1.IViewletService),
        __param(1, extensionManagement_1.IExtensionGalleryService),
        __param(2, extensionManagement_1.IExtensionManagementService),
        __param(3, notification_1.INotificationService)
    ], GalleryExtensionsHandler);
    exports.GalleryExtensionsHandler = GalleryExtensionsHandler;
});
//# sourceMappingURL=extensionsQuickOpen.js.map