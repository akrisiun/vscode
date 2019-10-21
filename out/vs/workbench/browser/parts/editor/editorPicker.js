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
define(["require", "exports", "vs/nls", "vs/base/parts/quickopen/browser/quickOpenModel", "vs/editor/common/services/modeService", "vs/editor/common/services/getIconClasses", "vs/editor/common/services/modelService", "vs/workbench/browser/quickopen", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor", "vs/base/parts/quickopen/common/quickOpenScorer", "vs/base/common/types", "vs/css!./media/editorpicker"], function (require, exports, nls, quickOpenModel_1, modeService_1, getIconClasses_1, modelService_1, quickopen_1, editorService_1, editorGroupsService_1, instantiation_1, editor_1, quickOpenScorer_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let EditorPickerEntry = class EditorPickerEntry extends quickOpenModel_1.QuickOpenEntryGroup {
        constructor(editor, _group, modeService, modelService) {
            super();
            this.editor = editor;
            this._group = _group;
            this.modeService = modeService;
            this.modelService = modelService;
        }
        getLabelOptions() {
            return {
                extraClasses: getIconClasses_1.getIconClasses(this.modelService, this.modeService, this.getResource()),
                italic: !this._group.isPinned(this.editor)
            };
        }
        getLabel() {
            return types_1.withNullAsUndefined(this.editor.getName());
        }
        getIcon() {
            return this.editor.isDirty() ? 'dirty' : '';
        }
        get group() {
            return this._group;
        }
        getResource() {
            return editor_1.toResource(this.editor, { supportSideBySide: editor_1.SideBySideEditor.MASTER });
        }
        getAriaLabel() {
            return nls.localize('entryAriaLabel', "{0}, editor group picker", this.getLabel());
        }
        getDescription() {
            return this.editor.getDescription();
        }
        run(mode, context) {
            if (mode === 1 /* OPEN */) {
                return this.runOpen(context);
            }
            return super.run(mode, context);
        }
        runOpen(context) {
            this._group.openEditor(this.editor);
            return true;
        }
    };
    EditorPickerEntry = __decorate([
        __param(2, modeService_1.IModeService),
        __param(3, modelService_1.IModelService)
    ], EditorPickerEntry);
    exports.EditorPickerEntry = EditorPickerEntry;
    let BaseEditorPicker = class BaseEditorPicker extends quickopen_1.QuickOpenHandler {
        constructor(instantiationService, editorService, editorGroupService) {
            super();
            this.instantiationService = instantiationService;
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.scorerCache = Object.create(null);
        }
        getResults(searchValue, token) {
            const editorEntries = this.getEditorEntries();
            if (!editorEntries.length) {
                return Promise.resolve(null);
            }
            // Prepare search for scoring
            const query = quickOpenScorer_1.prepareQuery(searchValue);
            const entries = editorEntries.filter(e => {
                if (!query.value) {
                    return true;
                }
                const itemScore = quickOpenScorer_1.scoreItem(e, query, true, quickOpenModel_1.QuickOpenItemAccessor, this.scorerCache);
                if (!itemScore.score) {
                    return false;
                }
                e.setHighlights(itemScore.labelMatch || [], itemScore.descriptionMatch);
                return true;
            });
            // Sorting
            if (query.value) {
                const groups = this.editorGroupService.getGroups(2 /* GRID_APPEARANCE */);
                entries.sort((e1, e2) => {
                    if (e1.group !== e2.group) {
                        return groups.indexOf(e1.group) - groups.indexOf(e2.group); // older groups first
                    }
                    return quickOpenScorer_1.compareItemsByScore(e1, e2, query, true, quickOpenModel_1.QuickOpenItemAccessor, this.scorerCache);
                });
            }
            // Grouping (for more than one group)
            if (this.editorGroupService.count > 1) {
                let lastGroup;
                entries.forEach(e => {
                    if (!lastGroup || lastGroup !== e.group) {
                        e.setGroupLabel(e.group.label);
                        e.setShowBorder(!!lastGroup);
                        lastGroup = e.group;
                    }
                });
            }
            return Promise.resolve(new quickOpenModel_1.QuickOpenModel(entries));
        }
        onClose(canceled) {
            this.scorerCache = Object.create(null);
        }
    };
    BaseEditorPicker = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, editorService_1.IEditorService),
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], BaseEditorPicker);
    exports.BaseEditorPicker = BaseEditorPicker;
    class ActiveEditorGroupPicker extends BaseEditorPicker {
        getEditorEntries() {
            return this.group.getEditors(0 /* MOST_RECENTLY_ACTIVE */).map((editor, index) => this.instantiationService.createInstance(EditorPickerEntry, editor, this.group));
        }
        get group() {
            return this.editorGroupService.activeGroup;
        }
        getEmptyLabel(searchString) {
            if (searchString) {
                return nls.localize('noResultsFoundInGroup', "No matching opened editor found in group");
            }
            return nls.localize('noOpenedEditors', "List of opened editors is currently empty in group");
        }
        getAutoFocus(searchValue, context) {
            if (searchValue || !context.quickNavigateConfiguration) {
                return {
                    autoFocusFirstEntry: true
                };
            }
            const isShiftNavigate = (context.quickNavigateConfiguration && context.quickNavigateConfiguration.keybindings.some(k => {
                const [firstPart, chordPart] = k.getParts();
                if (chordPart) {
                    return false;
                }
                return firstPart.shiftKey;
            }));
            if (isShiftNavigate) {
                return {
                    autoFocusLastEntry: true
                };
            }
            const editors = this.group.count;
            return {
                autoFocusFirstEntry: editors === 1,
                autoFocusSecondEntry: editors > 1
            };
        }
    }
    exports.ActiveEditorGroupPicker = ActiveEditorGroupPicker;
    ActiveEditorGroupPicker.ID = 'workbench.picker.activeEditors';
    class AllEditorsPicker extends BaseEditorPicker {
        getEditorEntries() {
            const entries = [];
            this.editorGroupService.getGroups(2 /* GRID_APPEARANCE */).forEach(group => {
                group.editors.forEach(editor => {
                    entries.push(this.instantiationService.createInstance(EditorPickerEntry, editor, group));
                });
            });
            return entries;
        }
        getEmptyLabel(searchString) {
            if (searchString) {
                return nls.localize('noResultsFound', "No matching opened editor found");
            }
            return nls.localize('noOpenedEditorsAllGroups', "List of opened editors is currently empty");
        }
        getAutoFocus(searchValue, context) {
            if (searchValue) {
                return {
                    autoFocusFirstEntry: true
                };
            }
            return super.getAutoFocus(searchValue, context);
        }
    }
    exports.AllEditorsPicker = AllEditorsPicker;
    AllEditorsPicker.ID = 'workbench.picker.editors';
});
//# sourceMappingURL=editorPicker.js.map