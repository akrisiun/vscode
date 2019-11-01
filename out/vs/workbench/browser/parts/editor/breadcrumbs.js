/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform"], function (require, exports, event_1, nls_1, configurationRegistry_1, extensions_1, instantiation_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IBreadcrumbsService = instantiation_1.createDecorator('IEditorBreadcrumbsService');
    class BreadcrumbsService {
        constructor() {
            this._map = new Map();
        }
        register(group, widget) {
            if (this._map.has(group)) {
                throw new Error(`group (${group}) has already a widget`);
            }
            this._map.set(group, widget);
            return {
                dispose: () => this._map.delete(group)
            };
        }
        getWidget(group) {
            return this._map.get(group);
        }
    }
    exports.BreadcrumbsService = BreadcrumbsService;
    extensions_1.registerSingleton(exports.IBreadcrumbsService, BreadcrumbsService, true);
    //#region config
    class BreadcrumbsConfig {
        constructor() {
            // internal
        }
        static _stub(name) {
            return {
                bindTo(service) {
                    let onDidChange = new event_1.Emitter();
                    let listener = service.onDidChangeConfiguration(e => {
                        if (e.affectsConfiguration(name)) {
                            onDidChange.fire(undefined);
                        }
                    });
                    return new class {
                        constructor() {
                            this.name = name;
                            this.onDidChange = onDidChange.event;
                        }
                        getValue(overrides) {
                            if (overrides) {
                                return service.getValue(name, overrides);
                            }
                            else {
                                return service.getValue(name);
                            }
                        }
                        updateValue(newValue, overrides) {
                            if (overrides) {
                                return service.updateValue(name, newValue, overrides);
                            }
                            else {
                                return service.updateValue(name, newValue);
                            }
                        }
                        dispose() {
                            listener.dispose();
                            onDidChange.dispose();
                        }
                    };
                }
            };
        }
    }
    exports.BreadcrumbsConfig = BreadcrumbsConfig;
    BreadcrumbsConfig.IsEnabled = BreadcrumbsConfig._stub('breadcrumbs.enabled');
    BreadcrumbsConfig.UseQuickPick = BreadcrumbsConfig._stub('breadcrumbs.useQuickPick');
    BreadcrumbsConfig.FilePath = BreadcrumbsConfig._stub('breadcrumbs.filePath');
    BreadcrumbsConfig.SymbolPath = BreadcrumbsConfig._stub('breadcrumbs.symbolPath');
    BreadcrumbsConfig.SymbolSortOrder = BreadcrumbsConfig._stub('breadcrumbs.symbolSortOrder');
    BreadcrumbsConfig.Icons = BreadcrumbsConfig._stub('breadcrumbs.icons');
    BreadcrumbsConfig.FileExcludes = BreadcrumbsConfig._stub('files.exclude');
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'breadcrumbs',
        title: nls_1.localize('title', "Breadcrumb Navigation"),
        order: 101,
        type: 'object',
        properties: {
            'breadcrumbs.enabled': {
                description: nls_1.localize('enabled', "Enable/disable navigation breadcrumbs."),
                type: 'boolean',
                default: true
            },
            // 'breadcrumbs.useQuickPick': {
            // 	description: localize('useQuickPick', "Use quick pick instead of breadcrumb-pickers."),
            // 	type: 'boolean',
            // 	default: false
            // },
            'breadcrumbs.filePath': {
                description: nls_1.localize('filepath', "Controls whether and how file paths are shown in the breadcrumbs view."),
                type: 'string',
                default: 'on',
                enum: ['on', 'off', 'last'],
                enumDescriptions: [
                    nls_1.localize('filepath.on', "Show the file path in the breadcrumbs view."),
                    nls_1.localize('filepath.off', "Do not show the file path in the breadcrumbs view."),
                    nls_1.localize('filepath.last', "Only show the last element of the file path in the breadcrumbs view."),
                ]
            },
            'breadcrumbs.symbolPath': {
                description: nls_1.localize('symbolpath', "Controls whether and how symbols are shown in the breadcrumbs view."),
                type: 'string',
                default: 'on',
                enum: ['on', 'off', 'last'],
                enumDescriptions: [
                    nls_1.localize('symbolpath.on', "Show all symbols in the breadcrumbs view."),
                    nls_1.localize('symbolpath.off', "Do not show symbols in the breadcrumbs view."),
                    nls_1.localize('symbolpath.last', "Only show the current symbol in the breadcrumbs view."),
                ]
            },
            'breadcrumbs.symbolSortOrder': {
                description: nls_1.localize('symbolSortOrder', "Controls how symbols are sorted in the breadcrumbs outline view."),
                type: 'string',
                default: 'position',
                enum: ['position', 'name', 'type'],
                enumDescriptions: [
                    nls_1.localize('symbolSortOrder.position', "Show symbol outline in file position order."),
                    nls_1.localize('symbolSortOrder.name', "Show symbol outline in alphabetical order."),
                    nls_1.localize('symbolSortOrder.type', "Show symbol outline in symbol type order."),
                ]
            },
            'breadcrumbs.icons': {
                description: nls_1.localize('icons', "Render breadcrumb items with icons."),
                type: 'boolean',
                default: true
            }
        }
    });
});
//#endregion
//# sourceMappingURL=breadcrumbs.js.map