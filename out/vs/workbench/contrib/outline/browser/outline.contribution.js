/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/common/views", "./outlinePanel", "vs/workbench/contrib/files/common/files", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/editor/contrib/documentSymbols/outline"], function (require, exports, nls_1, views_1, outlinePanel_1, files_1, platform_1, configurationRegistry_1, outline_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const _outlineDesc = {
        id: outline_1.OutlineViewId,
        name: nls_1.localize('name', "Outline"),
        ctorDescriptor: { ctor: outlinePanel_1.OutlinePanel },
        canToggleVisibility: true,
        hideByDefault: false,
        collapsed: true,
        order: 2,
        weight: 30,
        focusCommand: { id: 'outline.focus' }
    };
    platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews([_outlineDesc], files_1.VIEW_CONTAINER);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        'id': 'outline',
        'order': 117,
        'title': nls_1.localize('outlineConfigurationTitle', "Outline"),
        'type': 'object',
        'properties': {
            ["outline.icons" /* icons */]: {
                'description': nls_1.localize('outline.showIcons', "Render Outline Elements with Icons."),
                'type': 'boolean',
                'default': true
            },
            ["outline.problems.enabled" /* problemsEnabled */]: {
                'description': nls_1.localize('outline.showProblem', "Show Errors & Warnings on Outline Elements."),
                'type': 'boolean',
                'default': true
            },
            ["outline.problems.colors" /* problemsColors */]: {
                'description': nls_1.localize('outline.problem.colors', "Use colors for Errors & Warnings."),
                'type': 'boolean',
                'default': true
            },
            ["outline.problems.badges" /* problemsBadges */]: {
                'description': nls_1.localize('outline.problems.badges', "Use badges for Errors & Warnings."),
                'type': 'boolean',
                'default': true
            },
            'outline.filteredTypes.file': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.file', "When set to `false` outline never shows `file`-symbols.")
            },
            'outline.filteredTypes.module': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.module', "When set to `false` outline never shows `module`-symbols.")
            },
            'outline.filteredTypes.namespace': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.namespace', "When set to `false` outline never shows `namespace`-symbols.")
            },
            'outline.filteredTypes.package': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.package', "When set to `false` outline never shows `package`-symbols.")
            },
            'outline.filteredTypes.class': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.class', "When set to `false` outline never shows `class`-symbols.")
            },
            'outline.filteredTypes.method': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.method', "When set to `false` outline never shows `method`-symbols.")
            },
            'outline.filteredTypes.property': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.property', "When set to `false` outline never shows `property`-symbols.")
            },
            'outline.filteredTypes.field': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.field', "When set to `false` outline never shows `field`-symbols.")
            },
            'outline.filteredTypes.constructor': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.constructor', "When set to `false` outline never shows `constructor`-symbols.")
            },
            'outline.filteredTypes.enum': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.enum', "When set to `false` outline never shows `enum`-symbols.")
            },
            'outline.filteredTypes.interface': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.interface', "When set to `false` outline never shows `interface`-symbols.")
            },
            'outline.filteredTypes.function': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.function', "When set to `false` outline never shows `function`-symbols.")
            },
            'outline.filteredTypes.variable': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.variable', "When set to `false` outline never shows `variable`-symbols.")
            },
            'outline.filteredTypes.constant': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.constant', "When set to `false` outline never shows `constant`-symbols.")
            },
            'outline.filteredTypes.string': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.string', "When set to `false` outline never shows `string`-symbols.")
            },
            'outline.filteredTypes.number': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.number', "When set to `false` outline never shows `number`-symbols.")
            },
            'outline.filteredTypes.boolean': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.boolean', "When set to `false` outline never shows `boolean`-symbols.")
            },
            'outline.filteredTypes.array': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.array', "When set to `false` outline never shows `array`-symbols.")
            },
            'outline.filteredTypes.object': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.object', "When set to `false` outline never shows `object`-symbols.")
            },
            'outline.filteredTypes.key': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.key', "When set to `false` outline never shows `key`-symbols.")
            },
            'outline.filteredTypes.null': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.null', "When set to `false` outline never shows `null`-symbols.")
            },
            'outline.filteredTypes.enumMember': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.enumMember', "When set to `false` outline never shows `enumMember`-symbols.")
            },
            'outline.filteredTypes.struct': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.struct', "When set to `false` outline never shows `struct`-symbols.")
            },
            'outline.filteredTypes.event': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.event', "When set to `false` outline never shows `event`-symbols.")
            },
            'outline.filteredTypes.operator': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.operator', "When set to `false` outline never shows `operator`-symbols.")
            },
            'outline.filteredTypes.typeParameter': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.typeParameter', "When set to `false` outline never shows `typeParameter`-symbols.")
            }
        }
    });
});
//# sourceMappingURL=outline.contribution.js.map