/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/services/mode/common/workbenchModeService"], function (require, exports, nls, extensionsRegistry_1, workbenchModeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.customEditorsExtensionPoint = void 0;
    var Fields;
    (function (Fields) {
        Fields.viewType = 'viewType';
        Fields.displayName = 'displayName';
        Fields.selector = 'selector';
        Fields.priority = 'priority';
    })(Fields || (Fields = {}));
    const CustomEditorsContribution = {
        description: nls.localize('contributes.customEditors', 'Contributed custom editors.'),
        type: 'array',
        defaultSnippets: [{
                body: [{
                        [Fields.viewType]: '$1',
                        [Fields.displayName]: '$2',
                        [Fields.selector]: [{
                                filenamePattern: '$3'
                            }],
                    }]
            }],
        items: {
            type: 'object',
            required: [
                Fields.viewType,
                Fields.displayName,
                Fields.selector,
            ],
            properties: {
                [Fields.viewType]: {
                    type: 'string',
                    description: nls.localize('contributes.viewType', 'Unique identifier of the custom editor.'),
                },
                [Fields.displayName]: {
                    type: 'string',
                    description: nls.localize('contributes.displayName', 'Human readable name of the custom editor. This is displayed to users when selecting which editor to use.'),
                },
                [Fields.selector]: {
                    type: 'array',
                    description: nls.localize('contributes.selector', 'Set of globs that the custom editor is enabled for.'),
                    items: {
                        type: 'object',
                        defaultSnippets: [{
                                body: {
                                    filenamePattern: '$1',
                                }
                            }],
                        properties: {
                            filenamePattern: {
                                type: 'string',
                                description: nls.localize('contributes.selector.filenamePattern', 'Glob that the custom editor is enabled for.'),
                            },
                        }
                    }
                },
                [Fields.priority]: {
                    type: 'string',
                    description: nls.localize('contributes.priority', 'Controls when the custom editor is used. May be overridden by users.'),
                    enum: [
                        "default" /* default */,
                        "option" /* option */,
                    ],
                    markdownEnumDescriptions: [
                        nls.localize('contributes.priority.default', 'Editor is automatically used for a resource if no other default custom editors are registered for it.'),
                        nls.localize('contributes.priority.option', 'Editor is not automatically used but can be selected by a user.'),
                    ],
                    default: 'default'
                }
            }
        }
    };
    exports.customEditorsExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'customEditors',
        deps: [workbenchModeService_1.languagesExtPoint],
        jsonSchema: CustomEditorsContribution
    });
});
//# sourceMappingURL=extensionPoint.js.map