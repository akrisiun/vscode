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
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/base/common/resources", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/services/extensions/common/extensions", "vs/base/common/event", "vs/workbench/services/themes/browser/fileIconThemeData", "vs/base/common/lifecycle"], function (require, exports, nls, types, resources, extensionsRegistry_1, extensions_1, event_1, fileIconThemeData_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const iconThemeExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'iconThemes',
        jsonSchema: {
            description: nls.localize('vscode.extension.contributes.iconThemes', 'Contributes file icon themes.'),
            type: 'array',
            items: {
                type: 'object',
                defaultSnippets: [{ body: { id: '${1:id}', label: '${2:label}', path: './fileicons/${3:id}-icon-theme.json' } }],
                properties: {
                    id: {
                        description: nls.localize('vscode.extension.contributes.iconThemes.id', 'Id of the icon theme as used in the user settings.'),
                        type: 'string'
                    },
                    label: {
                        description: nls.localize('vscode.extension.contributes.iconThemes.label', 'Label of the icon theme as shown in the UI.'),
                        type: 'string'
                    },
                    path: {
                        description: nls.localize('vscode.extension.contributes.iconThemes.path', 'Path of the icon theme definition file. The path is relative to the extension folder and is typically \'./icons/awesome-icon-theme.json\'.'),
                        type: 'string'
                    }
                },
                required: ['path', 'id']
            }
        }
    });
    let FileIconThemeStore = class FileIconThemeStore extends lifecycle_1.Disposable {
        constructor(extensionService) {
            super();
            this.extensionService = extensionService;
            this.onDidChangeEmitter = this._register(new event_1.Emitter());
            this.onDidChange = this.onDidChangeEmitter.event;
            this.knownIconThemes = [];
            this.initialize();
        }
        initialize() {
            iconThemeExtPoint.setHandler((extensions) => {
                const previousIds = {};
                const added = [];
                for (const theme of this.knownIconThemes) {
                    previousIds[theme.id] = true;
                }
                this.knownIconThemes.length = 0;
                for (let ext of extensions) {
                    let extensionData = {
                        extensionId: ext.description.identifier.value,
                        extensionPublisher: ext.description.publisher,
                        extensionName: ext.description.name,
                        extensionIsBuiltin: ext.description.isBuiltin
                    };
                    this.onIconThemes(ext.description.extensionLocation, extensionData, ext.value, ext.collector);
                }
                for (const theme of this.knownIconThemes) {
                    if (!previousIds[theme.id]) {
                        added.push(theme);
                    }
                }
                this.onDidChangeEmitter.fire({ themes: this.knownIconThemes, added });
            });
        }
        onIconThemes(extensionLocation, extensionData, iconThemes, collector) {
            if (!Array.isArray(iconThemes)) {
                collector.error(nls.localize('reqarray', "Extension point `{0}` must be an array.", iconThemeExtPoint.name));
                return;
            }
            iconThemes.forEach(iconTheme => {
                if (!iconTheme.path || !types.isString(iconTheme.path)) {
                    collector.error(nls.localize('reqpath', "Expected string in `contributes.{0}.path`. Provided value: {1}", iconThemeExtPoint.name, String(iconTheme.path)));
                    return;
                }
                if (!iconTheme.id || !types.isString(iconTheme.id)) {
                    collector.error(nls.localize('reqid', "Expected string in `contributes.{0}.id`. Provided value: {1}", iconThemeExtPoint.name, String(iconTheme.path)));
                    return;
                }
                const iconThemeLocation = resources.joinPath(extensionLocation, iconTheme.path);
                if (!resources.isEqualOrParent(iconThemeLocation, extensionLocation)) {
                    collector.warn(nls.localize('invalid.path.1', "Expected `contributes.{0}.path` ({1}) to be included inside extension's folder ({2}). This might make the extension non-portable.", iconThemeExtPoint.name, iconThemeLocation.path, extensionLocation.path));
                }
                let themeData = fileIconThemeData_1.FileIconThemeData.fromExtensionTheme(iconTheme, iconThemeLocation, extensionData);
                this.knownIconThemes.push(themeData);
            });
        }
        findThemeData(iconTheme) {
            if (iconTheme.length === 0) {
                return Promise.resolve(fileIconThemeData_1.FileIconThemeData.noIconTheme());
            }
            return this.getFileIconThemes().then(allIconSets => {
                for (let iconSet of allIconSets) {
                    if (iconSet.id === iconTheme) {
                        return iconSet;
                    }
                }
                return undefined;
            });
        }
        findThemeBySettingsId(settingsId) {
            if (!settingsId) {
                return Promise.resolve(fileIconThemeData_1.FileIconThemeData.noIconTheme());
            }
            return this.getFileIconThemes().then(allIconSets => {
                for (let iconSet of allIconSets) {
                    if (iconSet.settingsId === settingsId) {
                        return iconSet;
                    }
                }
                return undefined;
            });
        }
        findThemeDataByParentLocation(parentLocation) {
            if (parentLocation) {
                return this.getFileIconThemes().then(allThemes => {
                    return allThemes.filter(t => t.location && resources.isEqualOrParent(t.location, parentLocation));
                });
            }
            return Promise.resolve([]);
        }
        getFileIconThemes() {
            return this.extensionService.whenInstalledExtensionsRegistered().then(isReady => {
                return this.knownIconThemes;
            });
        }
    };
    FileIconThemeStore = __decorate([
        __param(0, extensions_1.IExtensionService)
    ], FileIconThemeStore);
    exports.FileIconThemeStore = FileIconThemeStore;
});
//# sourceMappingURL=fileIconThemeStore.js.map