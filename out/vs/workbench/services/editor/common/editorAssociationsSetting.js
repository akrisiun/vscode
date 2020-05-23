/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/configuration", "vs/platform/registry/common/platform"], function (require, exports, nls, configurationRegistry_1, configuration_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.updateViewTypeSchema = exports.DEFAULT_CUSTOM_EDITOR = exports.editorAssociationsConfigurationNode = exports.viewTypeSchamaAddition = exports.customEditorsAssociationsSettingId = void 0;
    exports.customEditorsAssociationsSettingId = 'workbench.editorAssociations';
    exports.viewTypeSchamaAddition = {
        type: 'string',
        enum: []
    };
    exports.editorAssociationsConfigurationNode = Object.assign(Object.assign({}, configuration_1.workbenchConfigurationNodeBase), { properties: {
            [exports.customEditorsAssociationsSettingId]: {
                type: 'array',
                markdownDescription: nls.localize('editor.editorAssociations', "Configure which editor to use for specific file types."),
                items: {
                    type: 'object',
                    defaultSnippets: [{
                            body: {
                                'viewType': '$1',
                                'filenamePattern': '$2'
                            }
                        }],
                    properties: {
                        'viewType': {
                            anyOf: [
                                {
                                    type: 'string',
                                    description: nls.localize('editor.editorAssociations.viewType', "The unique id of the editor to use."),
                                },
                                exports.viewTypeSchamaAddition
                            ]
                        },
                        'filenamePattern': {
                            type: 'string',
                            description: nls.localize('editor.editorAssociations.filenamePattern', "Glob pattern specifying which files the editor should be used for."),
                        }
                    }
                }
            }
        } });
    const builtinProviderDisplayName = nls.localize('builtinProviderDisplayName', "Built-in");
    exports.DEFAULT_CUSTOM_EDITOR = {
        id: 'default',
        displayName: nls.localize('promptOpenWith.defaultEditor.displayName', "Text Editor"),
        providerDisplayName: builtinProviderDisplayName
    };
    function updateViewTypeSchema(enumValues, enumDescriptions) {
        exports.viewTypeSchamaAddition.enum = enumValues;
        exports.viewTypeSchamaAddition.enumDescriptions = enumDescriptions;
        platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
            .notifyConfigurationSchemaUpdated(exports.editorAssociationsConfigurationNode);
    }
    exports.updateViewTypeSchema = updateViewTypeSchema;
});
//# sourceMappingURL=editorAssociationsSetting.js.map