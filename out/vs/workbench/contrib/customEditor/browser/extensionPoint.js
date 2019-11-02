/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/services/mode/common/workbenchModeService"], function (require, exports, nls, extensionsRegistry_1, workbenchModeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var WebviewEditorContribution;
    (function (WebviewEditorContribution) {
        WebviewEditorContribution.viewType = 'viewType';
        WebviewEditorContribution.displayName = 'displayName';
        WebviewEditorContribution.selector = 'selector';
        WebviewEditorContribution.priority = 'priority';
    })(WebviewEditorContribution || (WebviewEditorContribution = {}));
    const webviewEditorsContribution = {
        description: nls.localize('contributes.webviewEditors', 'Contributes webview editors.'),
        type: 'array',
        defaultSnippets: [{ body: [{ viewType: '', displayName: '' }] }],
        items: {
            type: 'object',
            required: [
                WebviewEditorContribution.viewType,
                WebviewEditorContribution.displayName,
                WebviewEditorContribution.selector,
            ],
            properties: {
                [WebviewEditorContribution.viewType]: {
                    type: 'string',
                    description: nls.localize('contributes.viewType', 'Unique identifier of the custom editor.'),
                },
                [WebviewEditorContribution.displayName]: {
                    type: 'string',
                    description: nls.localize('contributes.displayName', 'Human readable name of the custom editor. This is displayed to users when selecting which editor to use.'),
                },
                [WebviewEditorContribution.selector]: {
                    type: 'array',
                    description: nls.localize('contributes.selector', 'Set of globs that the custom editor is enabled for.'),
                    items: {
                        type: 'object',
                        properties: {
                            filenamePattern: {
                                type: 'string',
                                description: nls.localize('contributes.selector.filenamePattern', 'Glob that the custom editor is enabled for.'),
                            },
                            mime: {
                                type: 'string',
                                description: nls.localize('contributes.selector.mime', 'Glob that matches the mime type of a data uri resource.'),
                            }
                        }
                    }
                },
                [WebviewEditorContribution.priority]: {
                    type: 'string',
                    description: nls.localize('contributes.priority', 'Controls when the custom editor is used. May be overridden by users.'),
                    enum: [
                        "default" /* default */,
                        "option" /* option */,
                        "builtin" /* builtin */,
                    ],
                    enumDescriptions: [
                        nls.localize('contributes.priority.default', 'Editor is automatically used for a resource if no other default custom editors are registered for it.'),
                        nls.localize('contributes.priority.option', 'Editor is not automatically used but can be selected by a user.'),
                        nls.localize('contributes.priority.builtin', 'Editor automatically used if no other `default` or `builtin` editors are registered for the resource.'),
                    ],
                    default: 'default'
                }
            }
        }
    };
    exports.webviewEditorsExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'webviewEditors',
        deps: [workbenchModeService_1.languagesExtPoint],
        jsonSchema: webviewEditorsContribution
    });
});
//# sourceMappingURL=extensionPoint.js.map