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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/keyCodes", "vs/platform/actions/common/actions", "vs/platform/registry/common/platform", "vs/workbench/common/actions", "vs/workbench/services/themes/common/workbenchThemeService", "vs/workbench/contrib/extensions/common/extensions", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/viewlet/browser/viewlet", "vs/platform/theme/common/colorRegistry", "vs/workbench/services/editor/common/editorService", "vs/base/common/color", "vs/platform/configuration/common/configuration", "vs/platform/theme/common/themeService", "vs/workbench/services/themes/common/colorThemeSchema", "vs/base/common/errors", "vs/platform/quickinput/common/quickInput"], function (require, exports, nls_1, actions_1, arrays_1, keyCodes_1, actions_2, platform_1, actions_3, workbenchThemeService_1, extensions_1, extensionManagement_1, viewlet_1, colorRegistry_1, editorService_1, color_1, configuration_1, themeService_1, colorThemeSchema_1, errors_1, quickInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let SelectColorThemeAction = class SelectColorThemeAction extends actions_1.Action {
        constructor(id, label, quickInputService, themeService, extensionGalleryService, viewletService, configurationService) {
            super(id, label);
            this.quickInputService = quickInputService;
            this.themeService = themeService;
            this.extensionGalleryService = extensionGalleryService;
            this.viewletService = viewletService;
            this.configurationService = configurationService;
        }
        run() {
            return this.themeService.getColorThemes().then(themes => {
                const currentTheme = this.themeService.getColorTheme();
                const picks = [
                    ...toEntries(themes.filter(t => t.type === themeService_1.LIGHT), nls_1.localize('themes.category.light', "light themes")),
                    ...toEntries(themes.filter(t => t.type === themeService_1.DARK), nls_1.localize('themes.category.dark', "dark themes")),
                    ...toEntries(themes.filter(t => t.type === themeService_1.HIGH_CONTRAST), nls_1.localize('themes.category.hc', "high contrast themes")),
                    ...configurationEntries(this.extensionGalleryService, nls_1.localize('installColorThemes', "Install Additional Color Themes..."))
                ];
                let selectThemeTimeout;
                const selectTheme = (theme, applyTheme) => {
                    if (selectThemeTimeout) {
                        clearTimeout(selectThemeTimeout);
                    }
                    selectThemeTimeout = window.setTimeout(() => {
                        selectThemeTimeout = undefined;
                        const themeId = theme && theme.id !== undefined ? theme.id : currentTheme.id;
                        let target = undefined;
                        if (applyTheme) {
                            const confValue = this.configurationService.inspect(workbenchThemeService_1.COLOR_THEME_SETTING);
                            target = typeof confValue.workspace !== 'undefined' ? 4 /* WORKSPACE */ : 1 /* USER */;
                        }
                        this.themeService.setColorTheme(themeId, target).then(undefined, err => {
                            errors_1.onUnexpectedError(err);
                            this.themeService.setColorTheme(currentTheme.id, undefined);
                        });
                    }, applyTheme ? 0 : 200);
                };
                return new Promise((s, _) => {
                    let isCompleted = false;
                    const autoFocusIndex = arrays_1.firstIndex(picks, p => isItem(p) && p.id === currentTheme.id);
                    const quickpick = this.quickInputService.createQuickPick();
                    quickpick.items = picks;
                    quickpick.placeholder = nls_1.localize('themes.selectTheme', "Select Color Theme (Up/Down Keys to Preview)");
                    quickpick.activeItems = [picks[autoFocusIndex]];
                    quickpick.canSelectMany = false;
                    quickpick.onDidAccept(_ => {
                        const theme = quickpick.activeItems[0];
                        if (!theme || typeof theme.id === 'undefined') { // 'pick in marketplace' entry
                            openExtensionViewlet(this.viewletService, `category:themes ${quickpick.value}`);
                        }
                        else {
                            selectTheme(theme, true);
                        }
                        isCompleted = true;
                        quickpick.hide();
                        s();
                    });
                    quickpick.onDidChangeActive(themes => selectTheme(themes[0], false));
                    quickpick.onDidHide(() => {
                        if (!isCompleted) {
                            selectTheme(currentTheme, true);
                            s();
                        }
                    });
                    quickpick.show();
                });
            });
        }
    };
    SelectColorThemeAction.ID = 'workbench.action.selectTheme';
    SelectColorThemeAction.LABEL = nls_1.localize('selectTheme.label', "Color Theme");
    SelectColorThemeAction = __decorate([
        __param(2, quickInput_1.IQuickInputService),
        __param(3, workbenchThemeService_1.IWorkbenchThemeService),
        __param(4, extensionManagement_1.IExtensionGalleryService),
        __param(5, viewlet_1.IViewletService),
        __param(6, configuration_1.IConfigurationService)
    ], SelectColorThemeAction);
    exports.SelectColorThemeAction = SelectColorThemeAction;
    let SelectIconThemeAction = class SelectIconThemeAction extends actions_1.Action {
        constructor(id, label, quickInputService, themeService, extensionGalleryService, viewletService, configurationService) {
            super(id, label);
            this.quickInputService = quickInputService;
            this.themeService = themeService;
            this.extensionGalleryService = extensionGalleryService;
            this.viewletService = viewletService;
            this.configurationService = configurationService;
        }
        run() {
            return this.themeService.getFileIconThemes().then(themes => {
                const currentTheme = this.themeService.getFileIconTheme();
                let picks = [{ id: '', label: nls_1.localize('noIconThemeLabel', 'None'), description: nls_1.localize('noIconThemeDesc', 'Disable file icons') }];
                picks = picks.concat(toEntries(themes), configurationEntries(this.extensionGalleryService, nls_1.localize('installIconThemes', "Install Additional File Icon Themes...")));
                let selectThemeTimeout;
                const selectTheme = (theme, applyTheme) => {
                    if (selectThemeTimeout) {
                        clearTimeout(selectThemeTimeout);
                    }
                    selectThemeTimeout = window.setTimeout(() => {
                        selectThemeTimeout = undefined;
                        const themeId = theme && theme.id !== undefined ? theme.id : currentTheme.id;
                        let target = undefined;
                        if (applyTheme) {
                            const confValue = this.configurationService.inspect(workbenchThemeService_1.ICON_THEME_SETTING);
                            target = typeof confValue.workspace !== 'undefined' ? 4 /* WORKSPACE */ : 1 /* USER */;
                        }
                        this.themeService.setFileIconTheme(themeId, target).then(undefined, err => {
                            errors_1.onUnexpectedError(err);
                            this.themeService.setFileIconTheme(currentTheme.id, undefined);
                        });
                    }, applyTheme ? 0 : 200);
                };
                return new Promise((s, _) => {
                    let isCompleted = false;
                    const autoFocusIndex = arrays_1.firstIndex(picks, p => isItem(p) && p.id === currentTheme.id);
                    const quickpick = this.quickInputService.createQuickPick();
                    quickpick.items = picks;
                    quickpick.placeholder = nls_1.localize('themes.selectIconTheme', "Select File Icon Theme");
                    quickpick.activeItems = [picks[autoFocusIndex]];
                    quickpick.canSelectMany = false;
                    quickpick.onDidAccept(_ => {
                        const theme = quickpick.activeItems[0];
                        if (!theme || typeof theme.id === 'undefined') { // 'pick in marketplace' entry
                            openExtensionViewlet(this.viewletService, `tag:icon-theme ${quickpick.value}`);
                        }
                        else {
                            selectTheme(theme, true);
                        }
                        isCompleted = true;
                        quickpick.hide();
                        s();
                    });
                    quickpick.onDidChangeActive(themes => selectTheme(themes[0], false));
                    quickpick.onDidHide(() => {
                        if (!isCompleted) {
                            selectTheme(currentTheme, true);
                            s();
                        }
                    });
                    quickpick.show();
                });
            });
        }
    };
    SelectIconThemeAction.ID = 'workbench.action.selectIconTheme';
    SelectIconThemeAction.LABEL = nls_1.localize('selectIconTheme.label', "File Icon Theme");
    SelectIconThemeAction = __decorate([
        __param(2, quickInput_1.IQuickInputService),
        __param(3, workbenchThemeService_1.IWorkbenchThemeService),
        __param(4, extensionManagement_1.IExtensionGalleryService),
        __param(5, viewlet_1.IViewletService),
        __param(6, configuration_1.IConfigurationService)
    ], SelectIconThemeAction);
    function configurationEntries(extensionGalleryService, label) {
        if (extensionGalleryService.isEnabled()) {
            return [
                {
                    type: 'separator'
                },
                {
                    id: undefined,
                    label: label,
                    alwaysShow: true
                }
            ];
        }
        return [];
    }
    function openExtensionViewlet(viewletService, query) {
        return viewletService.openViewlet(extensions_1.VIEWLET_ID, true).then(viewlet => {
            if (viewlet) {
                viewlet.search(query);
                viewlet.focus();
            }
        });
    }
    function isItem(i) {
        return i['type'] !== 'separator';
    }
    function toEntries(themes, label) {
        const toEntry = (theme) => ({ id: theme.id, label: theme.label, description: theme.description });
        const sorter = (t1, t2) => t1.label.localeCompare(t2.label);
        let entries = themes.map(toEntry).sort(sorter);
        if (entries.length > 0 && label) {
            entries.unshift({ type: 'separator', label });
        }
        return entries;
    }
    let GenerateColorThemeAction = class GenerateColorThemeAction extends actions_1.Action {
        constructor(id, label, themeService, editorService) {
            super(id, label);
            this.themeService = themeService;
            this.editorService = editorService;
        }
        run() {
            let theme = this.themeService.getColorTheme();
            let colors = platform_1.Registry.as(colorRegistry_1.Extensions.ColorContribution).getColors();
            let colorIds = colors.map(c => c.id).sort();
            let resultingColors = {};
            let inherited = [];
            for (let colorId of colorIds) {
                const color = theme.getColor(colorId, false);
                if (color) {
                    resultingColors[colorId] = color_1.Color.Format.CSS.formatHexA(color, true);
                }
                else {
                    inherited.push(colorId);
                }
            }
            for (let id of inherited) {
                const color = theme.getColor(id);
                if (color) {
                    resultingColors['__' + id] = color_1.Color.Format.CSS.formatHexA(color, true);
                }
            }
            let contents = JSON.stringify({
                '$schema': colorThemeSchema_1.colorThemeSchemaId,
                type: theme.type,
                colors: resultingColors,
                tokenColors: theme.tokenColors.filter(t => !!t.scope)
            }, null, '\t');
            contents = contents.replace(/\"__/g, '//"');
            return this.editorService.openEditor({ contents, mode: 'jsonc' });
        }
    };
    GenerateColorThemeAction.ID = 'workbench.action.generateColorTheme';
    GenerateColorThemeAction.LABEL = nls_1.localize('generateColorTheme.label', "Generate Color Theme From Current Settings");
    GenerateColorThemeAction = __decorate([
        __param(2, workbenchThemeService_1.IWorkbenchThemeService),
        __param(3, editorService_1.IEditorService)
    ], GenerateColorThemeAction);
    const category = nls_1.localize('preferences', "Preferences");
    const colorThemeDescriptor = new actions_2.SyncActionDescriptor(SelectColorThemeAction, SelectColorThemeAction.ID, SelectColorThemeAction.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 50 /* KEY_T */) });
    platform_1.Registry.as(actions_3.Extensions.WorkbenchActions).registerWorkbenchAction(colorThemeDescriptor, 'Preferences: Color Theme', category);
    const iconThemeDescriptor = new actions_2.SyncActionDescriptor(SelectIconThemeAction, SelectIconThemeAction.ID, SelectIconThemeAction.LABEL);
    platform_1.Registry.as(actions_3.Extensions.WorkbenchActions).registerWorkbenchAction(iconThemeDescriptor, 'Preferences: File Icon Theme', category);
    const developerCategory = nls_1.localize('developer', "Developer");
    const generateColorThemeDescriptor = new actions_2.SyncActionDescriptor(GenerateColorThemeAction, GenerateColorThemeAction.ID, GenerateColorThemeAction.LABEL);
    platform_1.Registry.as(actions_3.Extensions.WorkbenchActions).registerWorkbenchAction(generateColorThemeDescriptor, 'Developer: Generate Color Theme From Current Settings', developerCategory);
    actions_2.MenuRegistry.appendMenuItem(20 /* MenubarPreferencesMenu */, {
        group: '4_themes',
        command: {
            id: SelectColorThemeAction.ID,
            title: nls_1.localize({ key: 'miSelectColorTheme', comment: ['&& denotes a mnemonic'] }, "&&Color Theme")
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(20 /* MenubarPreferencesMenu */, {
        group: '4_themes',
        command: {
            id: SelectIconThemeAction.ID,
            title: nls_1.localize({ key: 'miSelectIconTheme', comment: ['&& denotes a mnemonic'] }, "File &&Icon Theme")
        },
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(45 /* GlobalActivity */, {
        group: '4_themes',
        command: {
            id: SelectColorThemeAction.ID,
            title: nls_1.localize('selectTheme.label', "Color Theme")
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(45 /* GlobalActivity */, {
        group: '4_themes',
        command: {
            id: SelectIconThemeAction.ID,
            title: nls_1.localize('themes.selectIconTheme.label', "File Icon Theme")
        },
        order: 2
    });
});
//# sourceMappingURL=themes.contribution.js.map