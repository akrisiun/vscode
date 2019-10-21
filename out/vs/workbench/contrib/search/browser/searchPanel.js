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
define(["require", "exports", "vs/platform/telemetry/common/telemetry", "vs/platform/storage/common/storage", "vs/platform/theme/common/themeService", "vs/workbench/services/search/common/search", "vs/workbench/contrib/search/browser/searchView", "vs/workbench/browser/panel", "vs/platform/instantiation/common/instantiation", "vs/nls", "vs/base/browser/dom"], function (require, exports, telemetry_1, storage_1, themeService_1, search_1, searchView_1, panel_1, instantiation_1, nls_1, dom) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let SearchPanel = class SearchPanel extends panel_1.Panel {
        constructor(telemetryService, themeService, storageService, instantiationService) {
            super(search_1.PANEL_ID, telemetryService, themeService, storageService);
            this.searchView = this._register(instantiationService.createInstance(searchView_1.SearchView, { id: search_1.PANEL_ID, title: nls_1.localize('search', "Search") }));
            this._register(this.searchView.onDidChangeTitleArea(() => this.updateTitleArea()));
            this._register(this.onDidChangeVisibility(visible => this.searchView.setVisible(visible)));
        }
        create(parent) {
            dom.addClasses(parent, 'monaco-panel-view', 'search-panel');
            this.searchView.render();
            dom.append(parent, this.searchView.element);
            this.searchView.setExpanded(true);
            this.searchView.headerVisible = false;
        }
        getTitle() {
            return this.searchView.title;
        }
        layout(dimension) {
            this.searchView.width = dimension.width;
            this.searchView.layout(dimension.height);
        }
        focus() {
            this.searchView.focus();
        }
        getActions() {
            return this.searchView.getActions();
        }
        getSecondaryActions() {
            return this.searchView.getSecondaryActions();
        }
        saveState() {
            this.searchView.saveState();
            super.saveState();
        }
        getSearchView() {
            return this.searchView;
        }
    };
    SearchPanel = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, themeService_1.IThemeService),
        __param(2, storage_1.IStorageService),
        __param(3, instantiation_1.IInstantiationService)
    ], SearchPanel);
    exports.SearchPanel = SearchPanel;
});
//# sourceMappingURL=searchPanel.js.map