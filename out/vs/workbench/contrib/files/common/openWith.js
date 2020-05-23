/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/resources", "vs/nls", "vs/workbench/contrib/files/common/editors/fileEditorInput", "vs/workbench/contrib/files/common/files", "vs/workbench/services/editor/common/editorAssociationsSetting"], function (require, exports, resources_1, nls, fileEditorInput_1, files_1, editorAssociationsSetting_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getAllAvailableEditors = exports.defaultEditorOverrideEntry = exports.openEditorWith = void 0;
    const builtinProviderDisplayName = nls.localize('builtinProviderDisplayName', "Built-in");
    /**
     * Try to open an resource with a given editor.
     *
     * @param input Resource to open.
     * @param id Id of the editor to use. If not provided, the user is prompted for which editor to use.
     */
    async function openEditorWith(input, id, options, group, editorService, configurationService, quickInputService) {
        var _a, _b;
        const resource = input.resource;
        if (!resource) {
            return;
        }
        const allEditorOverrides = getAllAvailableEditors(resource, options, group, editorService);
        if (!allEditorOverrides.length) {
            return;
        }
        const overrideToUse = typeof id === 'string' && allEditorOverrides.find(([_, entry]) => entry.id === id);
        if (overrideToUse) {
            return (_a = overrideToUse[0].open(input, options, group, id)) === null || _a === void 0 ? void 0 : _a.override;
        }
        // Prompt
        const resourceExt = resources_1.extname(resource);
        const items = allEditorOverrides.map((override) => {
            return {
                handler: override[0],
                id: override[1].id,
                label: override[1].label,
                description: override[1].active ? nls.localize('promptOpenWith.currentlyActive', 'Currently Active') : undefined,
                detail: override[1].detail,
                buttons: resourceExt ? [{
                        iconClass: 'codicon-settings-gear',
                        tooltip: nls.localize('promptOpenWith.setDefaultTooltip', "Set as default editor for '{0}' files", resourceExt)
                    }] : undefined
            };
        });
        const picker = quickInputService.createQuickPick();
        picker.items = items;
        if (items.length) {
            picker.selectedItems = [items[0]];
        }
        picker.placeholder = nls.localize('promptOpenWith.placeHolder', "Select editor for '{0}'", resources_1.basename(resource));
        const pickedItem = await new Promise(resolve => {
            picker.onDidAccept(() => {
                resolve(picker.selectedItems.length === 1 ? picker.selectedItems[0] : undefined);
                picker.dispose();
            });
            picker.onDidTriggerItemButton(e => {
                const pick = e.item;
                const id = pick.id;
                resolve(pick); // open the view
                picker.dispose();
                // And persist the setting
                if (pick && id) {
                    const newAssociation = { viewType: id, filenamePattern: '*' + resourceExt };
                    const currentAssociations = [...configurationService.getValue(editorAssociationsSetting_1.customEditorsAssociationsSettingId)];
                    // First try updating existing association
                    for (let i = 0; i < currentAssociations.length; ++i) {
                        const existing = currentAssociations[i];
                        if (existing.filenamePattern === newAssociation.filenamePattern) {
                            currentAssociations.splice(i, 1, newAssociation);
                            configurationService.updateValue(editorAssociationsSetting_1.customEditorsAssociationsSettingId, currentAssociations);
                            return;
                        }
                    }
                    // Otherwise, create a new one
                    currentAssociations.unshift(newAssociation);
                    configurationService.updateValue(editorAssociationsSetting_1.customEditorsAssociationsSettingId, currentAssociations);
                }
            });
            picker.show();
        });
        return (_b = pickedItem === null || pickedItem === void 0 ? void 0 : pickedItem.handler.open(input, options, group, pickedItem.id)) === null || _b === void 0 ? void 0 : _b.override;
    }
    exports.openEditorWith = openEditorWith;
    exports.defaultEditorOverrideEntry = Object.freeze({
        id: files_1.DEFAULT_EDITOR_ID,
        label: nls.localize('promptOpenWith.defaultEditor.displayName', "Text Editor"),
        detail: builtinProviderDisplayName,
    });
    /**
     * Get a list of all available editors, including the default text editor.
     */
    function getAllAvailableEditors(resource, options, group, editorService) {
        const overrides = editorService.getEditorOverrides(resource, options, group);
        if (!overrides.some(([_, entry]) => entry.id === files_1.DEFAULT_EDITOR_ID)) {
            overrides.unshift([
                {
                    open: (input, options, group) => {
                        if (!input.resource) {
                            return;
                        }
                        const fileEditorInput = editorService.createEditorInput({ resource: input.resource, forceFile: true });
                        const textOptions = options ? Object.assign(Object.assign({}, options), { ignoreOverrides: true }) : { ignoreOverrides: true };
                        return { override: editorService.openEditor(fileEditorInput, textOptions, group) };
                    }
                },
                Object.assign(Object.assign({}, exports.defaultEditorOverrideEntry), { active: editorService.activeEditor instanceof fileEditorInput_1.FileEditorInput && resources_1.isEqual(editorService.activeEditor.resource, resource) })
            ]);
        }
        return overrides;
    }
    exports.getAllAvailableEditors = getAllAvailableEditors;
});
//# sourceMappingURL=openWith.js.map