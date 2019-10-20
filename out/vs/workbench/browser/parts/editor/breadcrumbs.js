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
            },
            'breadcrumbs.filteredTypes.file': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.file', "When set to `false` breadcrumbs never show `file`-symbols.")
            },
            'breadcrumbs.filteredTypes.module': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.module', "When set to `false` breadcrumbs never show `module`-symbols.")
            },
            'breadcrumbs.filteredTypes.namespace': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.namespace', "When set to `false` breadcrumbs never show `namespace`-symbols.")
            },
            'breadcrumbs.filteredTypes.package': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.package', "When set to `false` breadcrumbs never show `package`-symbols.")
            },
            'breadcrumbs.filteredTypes.class': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.class', "When set to `false` breadcrumbs never show `class`-symbols.")
            },
            'breadcrumbs.filteredTypes.method': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.method', "When set to `false` breadcrumbs never show `method`-symbols.")
            },
            'breadcrumbs.filteredTypes.property': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.property', "When set to `false` breadcrumbs never show `property`-symbols.")
            },
            'breadcrumbs.filteredTypes.field': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.field', "When set to `false` breadcrumbs never show `field`-symbols.")
            },
            'breadcrumbs.filteredTypes.constructor': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.constructor', "When set to `false` breadcrumbs never show `constructor`-symbols.")
            },
            'breadcrumbs.filteredTypes.enum': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.enum', "When set to `false` breadcrumbs never show `enum`-symbols.")
            },
            'breadcrumbs.filteredTypes.interface': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.interface', "When set to `false` breadcrumbs never show `interface`-symbols.")
            },
            'breadcrumbs.filteredTypes.function': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.function', "When set to `false` breadcrumbs never show `function`-symbols.")
            },
            'breadcrumbs.filteredTypes.variable': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.variable', "When set to `false` breadcrumbs never show `variable`-symbols.")
            },
            'breadcrumbs.filteredTypes.constant': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.constant', "When set to `false` breadcrumbs never show `constant`-symbols.")
            },
            'breadcrumbs.filteredTypes.string': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.string', "When set to `false` breadcrumbs never show `string`-symbols.")
            },
            'breadcrumbs.filteredTypes.number': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.number', "When set to `false` breadcrumbs never show `number`-symbols.")
            },
            'breadcrumbs.filteredTypes.boolean': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.boolean', "When set to `false` breadcrumbs never show `boolean`-symbols.")
            },
            'breadcrumbs.filteredTypes.array': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.array', "When set to `false` breadcrumbs never show `array`-symbols.")
            },
            'breadcrumbs.filteredTypes.object': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.object', "When set to `false` breadcrumbs never show `object`-symbols.")
            },
            'breadcrumbs.filteredTypes.key': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.key', "When set to `false` breadcrumbs never show `key`-symbols.")
            },
            'breadcrumbs.filteredTypes.null': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.null', "When set to `false` breadcrumbs never show `null`-symbols.")
            },
            'breadcrumbs.filteredTypes.enumMember': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.enumMember', "When set to `false` breadcrumbs never show `enumMember`-symbols.")
            },
            'breadcrumbs.filteredTypes.struct': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.struct', "When set to `false` breadcrumbs never show `struct`-symbols.")
            },
            'breadcrumbs.filteredTypes.event': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.event', "When set to `false` breadcrumbs never show `event`-symbols.")
            },
            'breadcrumbs.filteredTypes.operator': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.operator', "When set to `false` breadcrumbs never show `operator`-symbols.")
            },
            'breadcrumbs.filteredTypes.typeParameter': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.typeParameter', "When set to `false` breadcrumbs never show `typeParameter`-symbols.")
            }
        }
    });
});
//#endregion
//# sourceMappingURL=breadcrumbs.js.map