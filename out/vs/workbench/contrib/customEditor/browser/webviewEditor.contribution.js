/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/registry/common/platform", "vs/workbench/browser/editor", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/contrib/customEditor/browser/customEditorInputFactory", "vs/workbench/contrib/customEditor/common/customEditor", "vs/workbench/contrib/webview/browser/webviewEditor", "./customEditorInput", "./customEditors", "./commands"], function (require, exports, nls, configurationRegistry_1, descriptors_1, extensions_1, platform_1, editor_1, contributions_1, editor_2, customEditorInputFactory_1, customEditor_1, webviewEditor_1, customEditorInput_1, customEditors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    extensions_1.registerSingleton(customEditor_1.ICustomEditorService, customEditors_1.CustomEditorService);
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(customEditors_1.CustomEditorContribution, 1 /* Starting */);
    platform_1.Registry.as(editor_1.Extensions.Editors).registerEditor(new editor_1.EditorDescriptor(webviewEditor_1.WebviewEditor, webviewEditor_1.WebviewEditor.ID, 'Webview Editor'), [
        new descriptors_1.SyncDescriptor(customEditorInput_1.CustomFileEditorInput)
    ]);
    platform_1.Registry.as(editor_2.Extensions.EditorInputFactories).registerEditorInputFactory(customEditorInputFactory_1.CustomEditoInputFactory.ID, customEditorInputFactory_1.CustomEditoInputFactory);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration({
        'id': 'workbench',
        'order': 7,
        'title': nls.localize('workbenchConfigurationTitle', "Workbench"),
        'type': 'object',
        'properties': {
            [customEditors_1.customEditorsAssociationsKey]: {
                type: 'array',
                markdownDescription: nls.localize('editor.editorAssociations', "Configure which editor to use for a resource."),
                items: {
                    type: 'object',
                    properties: {
                        'viewType': {
                            type: 'string',
                            description: nls.localize('editor.editorAssociations.viewType', "Editor view type."),
                        },
                        'mime': {
                            type: 'string',
                            description: nls.localize('editor.editorAssociations.mime', "Mime type the editor should be used for. This is used for binary files."),
                        },
                        'filenamePattern': {
                            type: 'string',
                            description: nls.localize('editor.editorAssociations.filenamePattern', "Glob pattern the the editor should be used for."),
                        }
                    }
                }
            }
        }
    });
});
//# sourceMappingURL=webviewEditor.contribution.js.map