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
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/base/common/resources", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/services/themes/common/workbenchThemeService", "vs/workbench/services/themes/common/colorThemeData", "vs/workbench/services/extensions/common/extensions", "vs/base/common/event"], function (require, exports, nls, types, resources, extensionsRegistry_1, workbenchThemeService_1, colorThemeData_1, extensions_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const themesExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'themes',
        jsonSchema: {
            description: nls.localize('vscode.extension.contributes.themes', 'Contributes textmate color themes.'),
            type: 'array',
            items: {
                type: 'object',
                defaultSnippets: [{ body: { label: '${1:label}', id: '${2:id}', uiTheme: workbenchThemeService_1.VS_DARK_THEME, path: './themes/${3:id}.tmTheme.' } }],
                properties: {
                    id: {
                        description: nls.localize('vscode.extension.contributes.themes.id', 'Id of the icon theme as used in the user settings.'),
                        type: 'string'
                    },
                    label: {
                        description: nls.localize('vscode.extension.contributes.themes.label', 'Label of the color theme as shown in the UI.'),
                        type: 'string'
                    },
                    uiTheme: {
                        description: nls.localize('vscode.extension.contributes.themes.uiTheme', 'Base theme defining the colors around the editor: \'vs\' is the light color theme, \'vs-dark\' is the dark color theme. \'hc-black\' is the dark high contrast theme.'),
                        enum: [workbenchThemeService_1.VS_LIGHT_THEME, workbenchThemeService_1.VS_DARK_THEME, workbenchThemeService_1.VS_HC_THEME]
                    },
                    path: {
                        description: nls.localize('vscode.extension.contributes.themes.path', 'Path of the tmTheme file. The path is relative to the extension folder and is typically \'./themes/themeFile.tmTheme\'.'),
                        type: 'string'
                    }
                },
                required: ['path', 'uiTheme']
            }
        }
    });
    let ColorThemeStore = class ColorThemeStore {
        constructor(extensionService, defaultTheme) {
            this.extensionService = extensionService;
            this.onDidChangeEmitter = new event_1.Emitter();
            this.onDidChange = this.onDidChangeEmitter.event;
            this.extensionsColorThemes = [defaultTheme];
            this.initialize();
        }
        initialize() {
            themesExtPoint.setHandler((extensions, delta) => {
                const previousIds = {};
                const added = [];
                for (const theme of this.extensionsColorThemes) {
                    previousIds[theme.id] = true;
                }
                this.extensionsColorThemes.length = 1; // remove all but the default theme
                for (let ext of extensions) {
                    let extensionData = {
                        extensionId: ext.description.identifier.value,
                        extensionPublisher: ext.description.publisher,
                        extensionName: ext.description.name,
                        extensionIsBuiltin: ext.description.isBuiltin
                    };
                    this.onThemes(ext.description.extensionLocation, extensionData, ext.value, ext.collector);
                }
                for (const theme of this.extensionsColorThemes) {
                    if (!previousIds[theme.id]) {
                        added.push(theme);
                    }
                }
                this.onDidChangeEmitter.fire({ themes: this.extensionsColorThemes, added });
            });
        }
        onThemes(extensionLocation, extensionData, themes, collector) {
            if (!Array.isArray(themes)) {
                collector.error(nls.localize('reqarray', "Extension point `{0}` must be an array.", themesExtPoint.name));
                return;
            }
            themes.forEach(theme => {
                if (!theme.path || !types.isString(theme.path)) {
                    collector.error(nls.localize('reqpath', "Expected string in `contributes.{0}.path`. Provided value: {1}", themesExtPoint.name, String(theme.path)));
                    return;
                }
                const colorThemeLocation = resources.joinPath(extensionLocation, theme.path);
                if (!resources.isEqualOrParent(colorThemeLocation, extensionLocation)) {
                    collector.warn(nls.localize('invalid.path.1', "Expected `contributes.{0}.path` ({1}) to be included inside extension's folder ({2}). This might make the extension non-portable.", themesExtPoint.name, colorThemeLocation.path, extensionLocation.path));
                }
                let themeData = colorThemeData_1.ColorThemeData.fromExtensionTheme(theme, colorThemeLocation, extensionData);
                if (themeData.id === this.extensionsColorThemes[0].id) {
                    this.extensionsColorThemes[0] = themeData;
                }
                else {
                    this.extensionsColorThemes.push(themeData);
                }
            });
        }
        findThemeData(themeId, defaultId) {
            return this.getColorThemes().then(allThemes => {
                let defaultTheme = undefined;
                for (let t of allThemes) {
                    if (t.id === themeId) {
                        return t;
                    }
                    if (t.id === defaultId) {
                        defaultTheme = t;
                    }
                }
                return defaultTheme;
            });
        }
        findThemeDataBySettingsId(settingsId, defaultId) {
            return this.getColorThemes().then(allThemes => {
                let defaultTheme = undefined;
                for (let t of allThemes) {
                    if (t.settingsId === settingsId) {
                        return t;
                    }
                    if (t.id === defaultId) {
                        defaultTheme = t;
                    }
                }
                return defaultTheme;
            });
        }
        findThemeDataByParentLocation(parentLocation) {
            if (parentLocation) {
                return this.getColorThemes().then(allThemes => {
                    return allThemes.filter(t => t.location && resources.isEqualOrParent(t.location, parentLocation));
                });
            }
            return Promise.resolve([]);
        }
        getColorThemes() {
            return this.extensionService.whenInstalledExtensionsRegistered().then(_ => {
                return this.extensionsColorThemes;
            });
        }
    };
    ColorThemeStore = __decorate([
        __param(0, extensions_1.IExtensionService)
    ], ColorThemeStore);
    exports.ColorThemeStore = ColorThemeStore;
});
//# sourceMappingURL=colorThemeStore.js.map