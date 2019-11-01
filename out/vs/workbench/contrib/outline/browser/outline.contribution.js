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
            }
        }
    });
});
//# sourceMappingURL=outline.contribution.js.map