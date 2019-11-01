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
define(["require", "exports", "vs/platform/issue/node/issue", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/common/theme", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "electron", "vs/base/common/objects", "vs/workbench/services/environment/common/environmentService"], function (require, exports, issue_1, themeService_1, colorRegistry_1, theme_1, extensionManagement_1, extensionManagement_2, electron_1, objects_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let WorkbenchIssueService = class WorkbenchIssueService {
        constructor(issueService, themeService, extensionManagementService, extensionEnablementService, environmentService) {
            this.issueService = issueService;
            this.themeService = themeService;
            this.extensionManagementService = extensionManagementService;
            this.extensionEnablementService = extensionEnablementService;
            this.environmentService = environmentService;
        }
        openReporter(dataOverrides = {}) {
            return this.extensionManagementService.getInstalled(1 /* User */).then(extensions => {
                const enabledExtensions = extensions.filter(extension => this.extensionEnablementService.isEnabled(extension));
                const extensionData = enabledExtensions.map(extension => {
                    const { manifest } = extension;
                    const manifestKeys = manifest.contributes ? Object.keys(manifest.contributes) : [];
                    const isTheme = !manifest.activationEvents && manifestKeys.length === 1 && manifestKeys[0] === 'themes';
                    return {
                        name: manifest.name,
                        publisher: manifest.publisher,
                        version: manifest.version,
                        repositoryUrl: manifest.repository && manifest.repository.url,
                        bugsUrl: manifest.bugs && manifest.bugs.url,
                        displayName: manifest.displayName,
                        id: extension.identifier.id,
                        isTheme: isTheme
                    };
                });
                const theme = this.themeService.getTheme();
                const issueReporterData = objects_1.assign({
                    styles: getIssueReporterStyles(theme),
                    zoomLevel: electron_1.webFrame.getZoomLevel(),
                    enabledExtensions: extensionData
                }, dataOverrides);
                return this.issueService.openReporter(issueReporterData);
            });
        }
        openProcessExplorer() {
            const theme = this.themeService.getTheme();
            const data = {
                pid: this.environmentService.configuration.mainPid,
                zoomLevel: electron_1.webFrame.getZoomLevel(),
                styles: {
                    backgroundColor: getColor(theme, colorRegistry_1.editorBackground),
                    color: getColor(theme, colorRegistry_1.editorForeground),
                    hoverBackground: getColor(theme, colorRegistry_1.listHoverBackground),
                    hoverForeground: getColor(theme, colorRegistry_1.listHoverForeground),
                    highlightForeground: getColor(theme, colorRegistry_1.listHighlightForeground),
                }
            };
            return this.issueService.openProcessExplorer(data);
        }
    };
    WorkbenchIssueService = __decorate([
        __param(0, issue_1.IIssueService),
        __param(1, themeService_1.IThemeService),
        __param(2, extensionManagement_1.IExtensionManagementService),
        __param(3, extensionManagement_2.IExtensionEnablementService),
        __param(4, environmentService_1.IWorkbenchEnvironmentService)
    ], WorkbenchIssueService);
    exports.WorkbenchIssueService = WorkbenchIssueService;
    function getIssueReporterStyles(theme) {
        return {
            backgroundColor: getColor(theme, theme_1.SIDE_BAR_BACKGROUND),
            color: getColor(theme, colorRegistry_1.foreground),
            textLinkColor: getColor(theme, colorRegistry_1.textLinkForeground),
            textLinkActiveForeground: getColor(theme, colorRegistry_1.textLinkActiveForeground),
            inputBackground: getColor(theme, colorRegistry_1.inputBackground),
            inputForeground: getColor(theme, colorRegistry_1.inputForeground),
            inputBorder: getColor(theme, colorRegistry_1.inputBorder),
            inputActiveBorder: getColor(theme, colorRegistry_1.inputActiveOptionBorder),
            inputErrorBorder: getColor(theme, colorRegistry_1.inputValidationErrorBorder),
            buttonBackground: getColor(theme, colorRegistry_1.buttonBackground),
            buttonForeground: getColor(theme, colorRegistry_1.buttonForeground),
            buttonHoverBackground: getColor(theme, colorRegistry_1.buttonHoverBackground),
            sliderActiveColor: getColor(theme, colorRegistry_1.scrollbarSliderActiveBackground),
            sliderBackgroundColor: getColor(theme, colorRegistry_1.scrollbarSliderBackground),
            sliderHoverColor: getColor(theme, colorRegistry_1.scrollbarSliderHoverBackground),
        };
    }
    exports.getIssueReporterStyles = getIssueReporterStyles;
    function getColor(theme, key) {
        const color = theme.getColor(key);
        return color ? color.toString() : undefined;
    }
});
//# sourceMappingURL=issueService.js.map