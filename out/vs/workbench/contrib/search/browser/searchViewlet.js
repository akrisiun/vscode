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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/parts/views/viewsViewlet", "vs/workbench/services/layout/browser/layoutService", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/platform/storage/common/storage", "vs/platform/configuration/common/configuration", "vs/platform/theme/common/themeService", "vs/platform/contextview/browser/contextView", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/search/common/search", "vs/platform/registry/common/platform", "vs/workbench/browser/viewlet"], function (require, exports, instantiation_1, viewsViewlet_1, layoutService_1, telemetry_1, workspace_1, storage_1, configuration_1, themeService_1, contextView_1, extensions_1, search_1, platform_1, viewlet_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let SearchViewlet = class SearchViewlet extends viewsViewlet_1.ViewContainerViewlet {
        constructor(layoutService, telemetryService, contextService, storageService, configurationService, instantiationService, themeService, contextMenuService, extensionService) {
            super(search_1.VIEWLET_ID, `${search_1.VIEWLET_ID}.state`, true, configurationService, layoutService, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService);
            this.contextService = contextService;
            this.storageService = storageService;
            this.instantiationService = instantiationService;
        }
        getTitle() {
            return platform_1.Registry.as(viewlet_1.Extensions.Viewlets).getViewlet(this.getId()).name;
        }
        getSearchView() {
            const view = super.getView(search_1.VIEW_ID);
            return view ? view : undefined;
        }
    };
    SearchViewlet = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, storage_1.IStorageService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, themeService_1.IThemeService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, extensions_1.IExtensionService)
    ], SearchViewlet);
    exports.SearchViewlet = SearchViewlet;
});
//# sourceMappingURL=searchViewlet.js.map