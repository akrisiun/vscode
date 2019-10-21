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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/nls", "vs/base/common/uri", "vs/workbench/browser/quickopen", "vs/workbench/browser/editor", "vs/workbench/common/editor", "vs/workbench/browser/parts/editor/textResourceEditor", "vs/workbench/browser/parts/editor/sideBySideEditor", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/common/editor/untitledEditorInput", "vs/workbench/common/editor/resourceEditorInput", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/parts/editor/textDiffEditor", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/browser/parts/editor/binaryDiffEditor", "vs/workbench/browser/parts/editor/editorStatus", "vs/workbench/common/actions", "vs/workbench/browser/actions", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/descriptors", "vs/base/common/keyCodes", "vs/workbench/browser/parts/editor/editorActions", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/services/editor/common/editorService", "vs/workbench/browser/parts/quickopen/quickopen", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/contextkey/common/contextkey", "vs/base/common/platform", "vs/workbench/browser/parts/editor/editorPicker", "vs/editor/browser/editorExtensions", "vs/workbench/browser/parts/editor/editorWidgets", "vs/workbench/services/environment/common/environmentService", "vs/base/common/resources", "vs/workbench/common/contributions", "vs/base/common/types", "vs/base/common/amd"], function (require, exports, platform_1, nls, uri_1, quickopen_1, editor_1, editor_2, textResourceEditor_1, sideBySideEditor_1, diffEditorInput_1, untitledEditorInput_1, resourceEditorInput_1, instantiation_1, textDiffEditor_1, textfiles_1, binaryDiffEditor_1, editorStatus_1, actions_1, actions_2, actions_3, descriptors_1, keyCodes_1, editorActions_1, editorCommands, editorService_1, quickopen_2, keybindingsRegistry_1, contextkey_1, platform_2, editorPicker_1, editorExtensions_1, editorWidgets_1, environmentService_1, resources_1, contributions_1, types_1, amd_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Register String Editor
    platform_1.Registry.as(editor_1.Extensions.Editors).registerEditor(new editor_1.EditorDescriptor(textResourceEditor_1.TextResourceEditor, textResourceEditor_1.TextResourceEditor.ID, nls.localize('textEditor', "Text Editor")), [
        new descriptors_1.SyncDescriptor(untitledEditorInput_1.UntitledEditorInput),
        new descriptors_1.SyncDescriptor(resourceEditorInput_1.ResourceEditorInput)
    ]);
    // Register Text Diff Editor
    platform_1.Registry.as(editor_1.Extensions.Editors).registerEditor(new editor_1.EditorDescriptor(textDiffEditor_1.TextDiffEditor, textDiffEditor_1.TextDiffEditor.ID, nls.localize('textDiffEditor', "Text Diff Editor")), [
        new descriptors_1.SyncDescriptor(diffEditorInput_1.DiffEditorInput)
    ]);
    // Register Binary Resource Diff Editor
    platform_1.Registry.as(editor_1.Extensions.Editors).registerEditor(new editor_1.EditorDescriptor(binaryDiffEditor_1.BinaryResourceDiffEditor, binaryDiffEditor_1.BinaryResourceDiffEditor.ID, nls.localize('binaryDiffEditor', "Binary Diff Editor")), [
        new descriptors_1.SyncDescriptor(diffEditorInput_1.DiffEditorInput)
    ]);
    platform_1.Registry.as(editor_1.Extensions.Editors).registerEditor(new editor_1.EditorDescriptor(sideBySideEditor_1.SideBySideEditor, sideBySideEditor_1.SideBySideEditor.ID, nls.localize('sideBySideEditor', "Side by Side Editor")), [
        new descriptors_1.SyncDescriptor(editor_2.SideBySideEditorInput)
    ]);
    // Register Editor Input Factory
    let UntitledEditorInputFactory = class UntitledEditorInputFactory {
        constructor(textFileService, environmentService) {
            this.textFileService = textFileService;
            this.environmentService = environmentService;
        }
        serialize(editorInput) {
            if (!this.textFileService.isHotExitEnabled) {
                return undefined; // never restore untitled unless hot exit is enabled
            }
            const untitledEditorInput = editorInput;
            let resource = untitledEditorInput.getResource();
            if (untitledEditorInput.hasAssociatedFilePath) {
                resource = resources_1.toLocalResource(resource, this.environmentService.configuration.remoteAuthority); // untitled with associated file path use the local schema
            }
            const serialized = {
                resource: resource.toString(),
                resourceJSON: resource.toJSON(),
                modeId: untitledEditorInput.getMode(),
                encoding: untitledEditorInput.getEncoding()
            };
            return JSON.stringify(serialized);
        }
        deserialize(instantiationService, serializedEditorInput) {
            return instantiationService.invokeFunction(accessor => {
                const deserialized = JSON.parse(serializedEditorInput);
                const resource = !!deserialized.resourceJSON ? uri_1.URI.revive(deserialized.resourceJSON) : uri_1.URI.parse(deserialized.resource);
                const mode = deserialized.modeId;
                const encoding = deserialized.encoding;
                return accessor.get(editorService_1.IEditorService).createInput({ resource, mode, encoding, forceUntitled: true });
            });
        }
    };
    UntitledEditorInputFactory = __decorate([
        __param(0, textfiles_1.ITextFileService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService)
    ], UntitledEditorInputFactory);
    platform_1.Registry.as(editor_2.Extensions.EditorInputFactories).registerEditorInputFactory(untitledEditorInput_1.UntitledEditorInput.ID, UntitledEditorInputFactory);
    // Register Side by Side Editor Input Factory
    class SideBySideEditorInputFactory {
        serialize(editorInput) {
            const input = editorInput;
            if (input.details && input.master) {
                const registry = platform_1.Registry.as(editor_2.Extensions.EditorInputFactories);
                const detailsInputFactory = registry.getEditorInputFactory(input.details.getTypeId());
                const masterInputFactory = registry.getEditorInputFactory(input.master.getTypeId());
                if (detailsInputFactory && masterInputFactory) {
                    const detailsSerialized = detailsInputFactory.serialize(input.details);
                    const masterSerialized = masterInputFactory.serialize(input.master);
                    if (detailsSerialized && masterSerialized) {
                        return JSON.stringify({
                            name: input.getName(),
                            description: input.getDescription(),
                            detailsSerialized,
                            masterSerialized,
                            detailsTypeId: input.details.getTypeId(),
                            masterTypeId: input.master.getTypeId()
                        });
                    }
                }
            }
            return undefined;
        }
        deserialize(instantiationService, serializedEditorInput) {
            const deserialized = JSON.parse(serializedEditorInput);
            const registry = platform_1.Registry.as(editor_2.Extensions.EditorInputFactories);
            const detailsInputFactory = registry.getEditorInputFactory(deserialized.detailsTypeId);
            const masterInputFactory = registry.getEditorInputFactory(deserialized.masterTypeId);
            if (detailsInputFactory && masterInputFactory) {
                const detailsInput = detailsInputFactory.deserialize(instantiationService, deserialized.detailsSerialized);
                const masterInput = masterInputFactory.deserialize(instantiationService, deserialized.masterSerialized);
                if (detailsInput && masterInput) {
                    return new editor_2.SideBySideEditorInput(deserialized.name, types_1.withNullAsUndefined(deserialized.description), detailsInput, masterInput);
                }
            }
            return undefined;
        }
    }
    platform_1.Registry.as(editor_2.Extensions.EditorInputFactories).registerEditorInputFactory(editor_2.SideBySideEditorInput.ID, SideBySideEditorInputFactory);
    // Register Editor Contributions
    editorExtensions_1.registerEditorContribution(editorWidgets_1.OpenWorkspaceButtonContribution.ID, editorWidgets_1.OpenWorkspaceButtonContribution);
    // Register Editor Status
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(editorStatus_1.EditorStatus, 2 /* Ready */);
    // Register Status Actions
    const registry = platform_1.Registry.as(actions_1.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorStatus_1.ChangeModeAction, editorStatus_1.ChangeModeAction.ID, editorStatus_1.ChangeModeAction.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 43 /* KEY_M */) }), 'Change Language Mode');
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorStatus_1.ChangeEOLAction, editorStatus_1.ChangeEOLAction.ID, editorStatus_1.ChangeEOLAction.LABEL), 'Change End of Line Sequence');
    if (Object.keys(textfiles_1.SUPPORTED_ENCODINGS).length > 1) {
        registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorStatus_1.ChangeEncodingAction, editorStatus_1.ChangeEncodingAction.ID, editorStatus_1.ChangeEncodingAction.LABEL), 'Change File Encoding');
    }
    let QuickOpenActionContributor = class QuickOpenActionContributor extends actions_2.ActionBarContributor {
        constructor(instantiationService) {
            super();
            this.instantiationService = instantiationService;
        }
        hasActions(context) {
            const entry = this.getEntry(context);
            return !!entry;
        }
        getActions(context) {
            const actions = [];
            const entry = this.getEntry(context);
            if (entry) {
                if (!this.openToSideActionInstance) {
                    this.openToSideActionInstance = this.instantiationService.createInstance(editorActions_1.OpenToSideFromQuickOpenAction);
                }
                else {
                    this.openToSideActionInstance.updateClass();
                }
                actions.push(this.openToSideActionInstance);
            }
            return actions;
        }
        getEntry(context) {
            if (!context || !context.element) {
                return null;
            }
            return editorActions_1.toEditorQuickOpenEntry(context.element);
        }
    };
    QuickOpenActionContributor = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], QuickOpenActionContributor);
    exports.QuickOpenActionContributor = QuickOpenActionContributor;
    const actionBarRegistry = platform_1.Registry.as(actions_2.Extensions.Actionbar);
    actionBarRegistry.registerActionBarContributor(actions_2.Scope.VIEWER, QuickOpenActionContributor);
    const editorPickerContextKey = 'inEditorsPicker';
    const editorPickerContext = contextkey_1.ContextKeyExpr.and(quickopen_2.inQuickOpenContext, contextkey_1.ContextKeyExpr.has(editorPickerContextKey));
    platform_1.Registry.as(quickopen_1.Extensions.Quickopen).registerQuickOpenHandler(new quickopen_1.QuickOpenHandlerDescriptor(editorPicker_1.ActiveEditorGroupPicker, editorPicker_1.ActiveEditorGroupPicker.ID, editorCommands.NAVIGATE_IN_ACTIVE_GROUP_PREFIX, editorPickerContextKey, [
        {
            prefix: editorCommands.NAVIGATE_IN_ACTIVE_GROUP_PREFIX,
            needsEditor: false,
            description: nls.localize('groupOnePicker', "Show Editors in Active Group")
        }
    ]));
    platform_1.Registry.as(quickopen_1.Extensions.Quickopen).registerQuickOpenHandler(new quickopen_1.QuickOpenHandlerDescriptor(editorPicker_1.AllEditorsPicker, editorPicker_1.AllEditorsPicker.ID, editorCommands.NAVIGATE_ALL_EDITORS_GROUP_PREFIX, editorPickerContextKey, [
        {
            prefix: editorCommands.NAVIGATE_ALL_EDITORS_GROUP_PREFIX,
            needsEditor: false,
            description: nls.localize('allEditorsPicker', "Show All Opened Editors")
        }
    ]));
    // Register Editor Actions
    const category = nls.localize('view', "View");
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.OpenNextEditorInGroup, editorActions_1.OpenNextEditorInGroup.ID, editorActions_1.OpenNextEditorInGroup.LABEL), 'View: Open Next Editor in Group', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.OpenPreviousEditorInGroup, editorActions_1.OpenPreviousEditorInGroup.ID, editorActions_1.OpenPreviousEditorInGroup.LABEL), 'View: Open Previous Editor in Group', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.OpenLastEditorInGroup, editorActions_1.OpenLastEditorInGroup.ID, editorActions_1.OpenLastEditorInGroup.LABEL, { primary: 512 /* Alt */ | 21 /* KEY_0 */, secondary: [2048 /* CtrlCmd */ | 30 /* KEY_9 */], mac: { primary: 256 /* WinCtrl */ | 21 /* KEY_0 */, secondary: [2048 /* CtrlCmd */ | 30 /* KEY_9 */] } }), 'View: Open Last Editor in Group', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.OpenFirstEditorInGroup, editorActions_1.OpenFirstEditorInGroup.ID, editorActions_1.OpenFirstEditorInGroup.LABEL), 'View: Open First Editor in Group', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.OpenNextRecentlyUsedEditorAction, editorActions_1.OpenNextRecentlyUsedEditorAction.ID, editorActions_1.OpenNextRecentlyUsedEditorAction.LABEL), 'View: Open Next Recently Used Editor', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.OpenPreviousRecentlyUsedEditorAction, editorActions_1.OpenPreviousRecentlyUsedEditorAction.ID, editorActions_1.OpenPreviousRecentlyUsedEditorAction.LABEL), 'View: Open Previous Recently Used Editor', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.ShowAllEditorsAction, editorActions_1.ShowAllEditorsAction.ID, editorActions_1.ShowAllEditorsAction.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 46 /* KEY_P */), mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 2 /* Tab */ } }), 'View: Show All Editors', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.ShowEditorsInActiveGroupAction, editorActions_1.ShowEditorsInActiveGroupAction.ID, editorActions_1.ShowEditorsInActiveGroupAction.LABEL), 'View: Show Editors in Active Group', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.OpenNextEditor, editorActions_1.OpenNextEditor.ID, editorActions_1.OpenNextEditor.LABEL, { primary: 2048 /* CtrlCmd */ | 12 /* PageDown */, mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 17 /* RightArrow */, secondary: [2048 /* CtrlCmd */ | 1024 /* Shift */ | 89 /* US_CLOSE_SQUARE_BRACKET */] } }), 'View: Open Next Editor', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.OpenPreviousEditor, editorActions_1.OpenPreviousEditor.ID, editorActions_1.OpenPreviousEditor.LABEL, { primary: 2048 /* CtrlCmd */ | 11 /* PageUp */, mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 15 /* LeftArrow */, secondary: [2048 /* CtrlCmd */ | 1024 /* Shift */ | 87 /* US_OPEN_SQUARE_BRACKET */] } }), 'View: Open Previous Editor', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.ReopenClosedEditorAction, editorActions_1.ReopenClosedEditorAction.ID, editorActions_1.ReopenClosedEditorAction.LABEL, { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 50 /* KEY_T */ }), 'View: Reopen Closed Editor', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.ClearRecentFilesAction, editorActions_1.ClearRecentFilesAction.ID, editorActions_1.ClearRecentFilesAction.LABEL), 'File: Clear Recently Opened', nls.localize('file', "File"));
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.CloseAllEditorsAction, editorActions_1.CloseAllEditorsAction.ID, editorActions_1.CloseAllEditorsAction.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 53 /* KEY_W */) }), 'View: Close All Editors', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.CloseAllEditorGroupsAction, editorActions_1.CloseAllEditorGroupsAction.ID, editorActions_1.CloseAllEditorGroupsAction.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 1024 /* Shift */ | 53 /* KEY_W */) }), 'View: Close All Editor Groups', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.CloseLeftEditorsInGroupAction, editorActions_1.CloseLeftEditorsInGroupAction.ID, editorActions_1.CloseLeftEditorsInGroupAction.LABEL), 'View: Close Editors to the Left in Group', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.CloseEditorsInOtherGroupsAction, editorActions_1.CloseEditorsInOtherGroupsAction.ID, editorActions_1.CloseEditorsInOtherGroupsAction.LABEL), 'View: Close Editors in Other Groups', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.CloseEditorInAllGroupsAction, editorActions_1.CloseEditorInAllGroupsAction.ID, editorActions_1.CloseEditorInAllGroupsAction.LABEL), 'View: Close Editor in All Groups', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.SplitEditorAction, editorActions_1.SplitEditorAction.ID, editorActions_1.SplitEditorAction.LABEL, { primary: 2048 /* CtrlCmd */ | 88 /* US_BACKSLASH */ }), 'View: Split Editor', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.SplitEditorOrthogonalAction, editorActions_1.SplitEditorOrthogonalAction.ID, editorActions_1.SplitEditorOrthogonalAction.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 88 /* US_BACKSLASH */) }), 'View: Split Editor Orthogonal', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.SplitEditorLeftAction, editorActions_1.SplitEditorLeftAction.ID, editorActions_1.SplitEditorLeftAction.LABEL), 'View: Split Editor Left', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.SplitEditorRightAction, editorActions_1.SplitEditorRightAction.ID, editorActions_1.SplitEditorRightAction.LABEL), 'View: Split Editor Right', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.SplitEditorUpAction, editorActions_1.SplitEditorUpAction.ID, editorActions_1.SplitEditorUpAction.LABEL), 'Split Editor Up', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.SplitEditorDownAction, editorActions_1.SplitEditorDownAction.ID, editorActions_1.SplitEditorDownAction.LABEL), 'View: Split Editor Down', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.JoinTwoGroupsAction, editorActions_1.JoinTwoGroupsAction.ID, editorActions_1.JoinTwoGroupsAction.LABEL), 'View: Join Editor Group with Next Group', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.JoinAllGroupsAction, editorActions_1.JoinAllGroupsAction.ID, editorActions_1.JoinAllGroupsAction.LABEL), 'View: Join All Editor Groups', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.NavigateBetweenGroupsAction, editorActions_1.NavigateBetweenGroupsAction.ID, editorActions_1.NavigateBetweenGroupsAction.LABEL), 'View: Navigate Between Editor Groups', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.ResetGroupSizesAction, editorActions_1.ResetGroupSizesAction.ID, editorActions_1.ResetGroupSizesAction.LABEL), 'View: Reset Editor Group Sizes', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.ToggleGroupSizesAction, editorActions_1.ToggleGroupSizesAction.ID, editorActions_1.ToggleGroupSizesAction.LABEL), 'View: Toggle Editor Group Sizes', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.MaximizeGroupAction, editorActions_1.MaximizeGroupAction.ID, editorActions_1.MaximizeGroupAction.LABEL), 'View: Maximize Editor Group and Hide Side Bar', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.MinimizeOtherGroupsAction, editorActions_1.MinimizeOtherGroupsAction.ID, editorActions_1.MinimizeOtherGroupsAction.LABEL), 'View: Maximize Editor Group', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.MoveEditorLeftInGroupAction, editorActions_1.MoveEditorLeftInGroupAction.ID, editorActions_1.MoveEditorLeftInGroupAction.LABEL, { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 11 /* PageUp */, mac: { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 1024 /* Shift */ | 15 /* LeftArrow */) } }), 'View: Move Editor Left', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.MoveEditorRightInGroupAction, editorActions_1.MoveEditorRightInGroupAction.ID, editorActions_1.MoveEditorRightInGroupAction.LABEL, { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 12 /* PageDown */, mac: { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 1024 /* Shift */ | 17 /* RightArrow */) } }), 'View: Move Editor Right', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.MoveGroupLeftAction, editorActions_1.MoveGroupLeftAction.ID, editorActions_1.MoveGroupLeftAction.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 15 /* LeftArrow */) }), 'View: Move Editor Group Left', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.MoveGroupRightAction, editorActions_1.MoveGroupRightAction.ID, editorActions_1.MoveGroupRightAction.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 17 /* RightArrow */) }), 'View: Move Editor Group Right', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.MoveGroupUpAction, editorActions_1.MoveGroupUpAction.ID, editorActions_1.MoveGroupUpAction.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 16 /* UpArrow */) }), 'View: Move Editor Group Up', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.MoveGroupDownAction, editorActions_1.MoveGroupDownAction.ID, editorActions_1.MoveGroupDownAction.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 18 /* DownArrow */) }), 'View: Move Editor Group Down', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.MoveEditorToPreviousGroupAction, editorActions_1.MoveEditorToPreviousGroupAction.ID, editorActions_1.MoveEditorToPreviousGroupAction.LABEL, { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 15 /* LeftArrow */, mac: { primary: 2048 /* CtrlCmd */ | 256 /* WinCtrl */ | 15 /* LeftArrow */ } }), 'View: Move Editor into Previous Group', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.MoveEditorToNextGroupAction, editorActions_1.MoveEditorToNextGroupAction.ID, editorActions_1.MoveEditorToNextGroupAction.LABEL, { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 17 /* RightArrow */, mac: { primary: 2048 /* CtrlCmd */ | 256 /* WinCtrl */ | 17 /* RightArrow */ } }), 'View: Move Editor into Next Group', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.MoveEditorToFirstGroupAction, editorActions_1.MoveEditorToFirstGroupAction.ID, editorActions_1.MoveEditorToFirstGroupAction.LABEL, { primary: 1024 /* Shift */ | 512 /* Alt */ | 22 /* KEY_1 */, mac: { primary: 2048 /* CtrlCmd */ | 256 /* WinCtrl */ | 22 /* KEY_1 */ } }), 'View: Move Editor into First Group', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.MoveEditorToLastGroupAction, editorActions_1.MoveEditorToLastGroupAction.ID, editorActions_1.MoveEditorToLastGroupAction.LABEL, { primary: 1024 /* Shift */ | 512 /* Alt */ | 30 /* KEY_9 */, mac: { primary: 2048 /* CtrlCmd */ | 256 /* WinCtrl */ | 30 /* KEY_9 */ } }), 'View: Move Editor into Last Group', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.MoveEditorToLeftGroupAction, editorActions_1.MoveEditorToLeftGroupAction.ID, editorActions_1.MoveEditorToLeftGroupAction.LABEL), 'View: Move Editor into Left Group', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.MoveEditorToRightGroupAction, editorActions_1.MoveEditorToRightGroupAction.ID, editorActions_1.MoveEditorToRightGroupAction.LABEL), 'View: Move Editor into Right Group', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.MoveEditorToAboveGroupAction, editorActions_1.MoveEditorToAboveGroupAction.ID, editorActions_1.MoveEditorToAboveGroupAction.LABEL), 'View: Move Editor into Above Group', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.MoveEditorToBelowGroupAction, editorActions_1.MoveEditorToBelowGroupAction.ID, editorActions_1.MoveEditorToBelowGroupAction.LABEL), 'View: Move Editor into Below Group', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.FocusActiveGroupAction, editorActions_1.FocusActiveGroupAction.ID, editorActions_1.FocusActiveGroupAction.LABEL), 'View: Focus Active Editor Group', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.FocusFirstGroupAction, editorActions_1.FocusFirstGroupAction.ID, editorActions_1.FocusFirstGroupAction.LABEL, { primary: 2048 /* CtrlCmd */ | 22 /* KEY_1 */ }), 'View: Focus First Editor Group', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.FocusLastGroupAction, editorActions_1.FocusLastGroupAction.ID, editorActions_1.FocusLastGroupAction.LABEL), 'View: Focus Last Editor Group', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.FocusPreviousGroup, editorActions_1.FocusPreviousGroup.ID, editorActions_1.FocusPreviousGroup.LABEL), 'View: Focus Previous Editor Group', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.FocusNextGroup, editorActions_1.FocusNextGroup.ID, editorActions_1.FocusNextGroup.LABEL), 'View: Focus Next Editor Group', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.FocusLeftGroup, editorActions_1.FocusLeftGroup.ID, editorActions_1.FocusLeftGroup.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 15 /* LeftArrow */) }), 'View: Focus Left Editor Group', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.FocusRightGroup, editorActions_1.FocusRightGroup.ID, editorActions_1.FocusRightGroup.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 17 /* RightArrow */) }), 'View: Focus Right Editor Group', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.FocusAboveGroup, editorActions_1.FocusAboveGroup.ID, editorActions_1.FocusAboveGroup.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 16 /* UpArrow */) }), 'View: Focus Above Editor Group', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.FocusBelowGroup, editorActions_1.FocusBelowGroup.ID, editorActions_1.FocusBelowGroup.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 18 /* DownArrow */) }), 'View: Focus Below Editor Group', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.NewEditorGroupLeftAction, editorActions_1.NewEditorGroupLeftAction.ID, editorActions_1.NewEditorGroupLeftAction.LABEL), 'View: New Editor Group to the Left', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.NewEditorGroupRightAction, editorActions_1.NewEditorGroupRightAction.ID, editorActions_1.NewEditorGroupRightAction.LABEL), 'View: New Editor Group to the Right', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.NewEditorGroupAboveAction, editorActions_1.NewEditorGroupAboveAction.ID, editorActions_1.NewEditorGroupAboveAction.LABEL), 'View: New Editor Group Above', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.NewEditorGroupBelowAction, editorActions_1.NewEditorGroupBelowAction.ID, editorActions_1.NewEditorGroupBelowAction.LABEL), 'View: New Editor Group Below', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.NavigateForwardAction, editorActions_1.NavigateForwardAction.ID, editorActions_1.NavigateForwardAction.LABEL, { primary: 0, win: { primary: 512 /* Alt */ | 17 /* RightArrow */ }, mac: { primary: 256 /* WinCtrl */ | 1024 /* Shift */ | 83 /* US_MINUS */ }, linux: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 83 /* US_MINUS */ } }), 'Go Forward');
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.NavigateBackwardsAction, editorActions_1.NavigateBackwardsAction.ID, editorActions_1.NavigateBackwardsAction.LABEL, { primary: 0, win: { primary: 512 /* Alt */ | 15 /* LeftArrow */ }, mac: { primary: 256 /* WinCtrl */ | 83 /* US_MINUS */ }, linux: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 83 /* US_MINUS */ } }), 'Go Back');
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.NavigateToLastEditLocationAction, editorActions_1.NavigateToLastEditLocationAction.ID, editorActions_1.NavigateToLastEditLocationAction.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 47 /* KEY_Q */) }), 'Go to Last Edit Location');
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.NavigateLastAction, editorActions_1.NavigateLastAction.ID, editorActions_1.NavigateLastAction.LABEL), 'Go Last');
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.OpenPreviousEditorFromHistoryAction, editorActions_1.OpenPreviousEditorFromHistoryAction.ID, editorActions_1.OpenPreviousEditorFromHistoryAction.LABEL), 'Open Previous Editor from History');
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.ClearEditorHistoryAction, editorActions_1.ClearEditorHistoryAction.ID, editorActions_1.ClearEditorHistoryAction.LABEL), 'Clear Editor History');
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.RevertAndCloseEditorAction, editorActions_1.RevertAndCloseEditorAction.ID, editorActions_1.RevertAndCloseEditorAction.LABEL), 'View: Revert and Close Editor', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.EditorLayoutSingleAction, editorActions_1.EditorLayoutSingleAction.ID, editorActions_1.EditorLayoutSingleAction.LABEL), 'View: Single Column Editor Layout', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.EditorLayoutTwoColumnsAction, editorActions_1.EditorLayoutTwoColumnsAction.ID, editorActions_1.EditorLayoutTwoColumnsAction.LABEL), 'View: Two Columns Editor Layout', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.EditorLayoutThreeColumnsAction, editorActions_1.EditorLayoutThreeColumnsAction.ID, editorActions_1.EditorLayoutThreeColumnsAction.LABEL), 'View: Three Columns Editor Layout', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.EditorLayoutTwoRowsAction, editorActions_1.EditorLayoutTwoRowsAction.ID, editorActions_1.EditorLayoutTwoRowsAction.LABEL), 'View: Two Rows Editor Layout', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.EditorLayoutThreeRowsAction, editorActions_1.EditorLayoutThreeRowsAction.ID, editorActions_1.EditorLayoutThreeRowsAction.LABEL), 'View: Three Rows Editor Layout', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.EditorLayoutTwoByTwoGridAction, editorActions_1.EditorLayoutTwoByTwoGridAction.ID, editorActions_1.EditorLayoutTwoByTwoGridAction.LABEL), 'View: Grid Editor Layout (2x2)', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.EditorLayoutTwoRowsRightAction, editorActions_1.EditorLayoutTwoRowsRightAction.ID, editorActions_1.EditorLayoutTwoRowsRightAction.LABEL), 'View: Two Rows Right Editor Layout', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.EditorLayoutTwoColumnsBottomAction, editorActions_1.EditorLayoutTwoColumnsBottomAction.ID, editorActions_1.EditorLayoutTwoColumnsBottomAction.LABEL), 'View: Two Columns Bottom Editor Layout', category);
    // Register Editor Picker Actions including quick navigate support
    const openNextEditorKeybinding = { primary: 2048 /* CtrlCmd */ | 2 /* Tab */, mac: { primary: 256 /* WinCtrl */ | 2 /* Tab */ } };
    const openPreviousEditorKeybinding = { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 2 /* Tab */, mac: { primary: 256 /* WinCtrl */ | 1024 /* Shift */ | 2 /* Tab */ } };
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.OpenNextRecentlyUsedEditorInGroupAction, editorActions_1.OpenNextRecentlyUsedEditorInGroupAction.ID, editorActions_1.OpenNextRecentlyUsedEditorInGroupAction.LABEL, openNextEditorKeybinding), 'View: Open Next Recently Used Editor in Group', category);
    registry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(editorActions_1.OpenPreviousRecentlyUsedEditorInGroupAction, editorActions_1.OpenPreviousRecentlyUsedEditorInGroupAction.ID, editorActions_1.OpenPreviousRecentlyUsedEditorInGroupAction.LABEL, openPreviousEditorKeybinding), 'View: Open Previous Recently Used Editor in Group', category);
    const quickOpenNavigateNextInEditorPickerId = 'workbench.action.quickOpenNavigateNextInEditorPicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickOpenNavigateNextInEditorPickerId,
        weight: 200 /* WorkbenchContrib */ + 50,
        handler: quickopen_2.getQuickNavigateHandler(quickOpenNavigateNextInEditorPickerId, true),
        when: editorPickerContext,
        primary: openNextEditorKeybinding.primary,
        mac: openNextEditorKeybinding.mac
    });
    const quickOpenNavigatePreviousInEditorPickerId = 'workbench.action.quickOpenNavigatePreviousInEditorPicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickOpenNavigatePreviousInEditorPickerId,
        weight: 200 /* WorkbenchContrib */ + 50,
        handler: quickopen_2.getQuickNavigateHandler(quickOpenNavigatePreviousInEditorPickerId, false),
        when: editorPickerContext,
        primary: openPreviousEditorKeybinding.primary,
        mac: openPreviousEditorKeybinding.mac
    });
    // Editor Commands
    editorCommands.setup();
    // Touch Bar
    if (platform_2.isMacintosh) {
        actions_3.MenuRegistry.appendMenuItem(37 /* TouchBarContext */, {
            command: { id: editorActions_1.NavigateBackwardsAction.ID, title: editorActions_1.NavigateBackwardsAction.LABEL, iconLocation: { dark: uri_1.URI.parse(require.toUrl('vs/workbench/browser/parts/editor/media/back-tb.png')) } },
            group: 'navigation'
        });
        actions_3.MenuRegistry.appendMenuItem(37 /* TouchBarContext */, {
            command: { id: editorActions_1.NavigateForwardAction.ID, title: editorActions_1.NavigateForwardAction.LABEL, iconLocation: { dark: uri_1.URI.parse(require.toUrl('vs/workbench/browser/parts/editor/media/forward-tb.png')) } },
            group: 'navigation'
        });
    }
    // Empty Editor Group Context Menu
    actions_3.MenuRegistry.appendMenuItem(10 /* EmptyEditorGroupContext */, { command: { id: editorCommands.SPLIT_EDITOR_UP, title: nls.localize('splitUp', "Split Up") }, group: '2_split', order: 10 });
    actions_3.MenuRegistry.appendMenuItem(10 /* EmptyEditorGroupContext */, { command: { id: editorCommands.SPLIT_EDITOR_DOWN, title: nls.localize('splitDown', "Split Down") }, group: '2_split', order: 20 });
    actions_3.MenuRegistry.appendMenuItem(10 /* EmptyEditorGroupContext */, { command: { id: editorCommands.SPLIT_EDITOR_LEFT, title: nls.localize('splitLeft', "Split Left") }, group: '2_split', order: 30 });
    actions_3.MenuRegistry.appendMenuItem(10 /* EmptyEditorGroupContext */, { command: { id: editorCommands.SPLIT_EDITOR_RIGHT, title: nls.localize('splitRight', "Split Right") }, group: '2_split', order: 40 });
    actions_3.MenuRegistry.appendMenuItem(10 /* EmptyEditorGroupContext */, { command: { id: editorCommands.CLOSE_EDITOR_GROUP_COMMAND_ID, title: nls.localize('close', "Close") }, group: '3_close', order: 10, when: contextkey_1.ContextKeyExpr.has('multipleEditorGroups') });
    // Editor Title Context Menu
    actions_3.MenuRegistry.appendMenuItem(9 /* EditorTitleContext */, { command: { id: editorCommands.CLOSE_EDITOR_COMMAND_ID, title: nls.localize('close', "Close") }, group: '1_close', order: 10 });
    actions_3.MenuRegistry.appendMenuItem(9 /* EditorTitleContext */, { command: { id: editorCommands.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID, title: nls.localize('closeOthers', "Close Others"), precondition: editor_2.EditorGroupEditorsCountContext.notEqualsTo('1') }, group: '1_close', order: 20 });
    actions_3.MenuRegistry.appendMenuItem(9 /* EditorTitleContext */, { command: { id: editorCommands.CLOSE_EDITORS_TO_THE_RIGHT_COMMAND_ID, title: nls.localize('closeRight', "Close to the Right"), precondition: editor_2.EditorGroupEditorsCountContext.notEqualsTo('1') }, group: '1_close', order: 30, when: contextkey_1.ContextKeyExpr.has('config.workbench.editor.showTabs') });
    actions_3.MenuRegistry.appendMenuItem(9 /* EditorTitleContext */, { command: { id: editorCommands.CLOSE_SAVED_EDITORS_COMMAND_ID, title: nls.localize('closeAllSaved', "Close Saved") }, group: '1_close', order: 40 });
    actions_3.MenuRegistry.appendMenuItem(9 /* EditorTitleContext */, { command: { id: editorCommands.CLOSE_EDITORS_IN_GROUP_COMMAND_ID, title: nls.localize('closeAll', "Close All") }, group: '1_close', order: 50 });
    actions_3.MenuRegistry.appendMenuItem(9 /* EditorTitleContext */, { command: { id: editorCommands.KEEP_EDITOR_COMMAND_ID, title: nls.localize('keepOpen', "Keep Open"), precondition: editor_2.EditorPinnedContext.toNegated() }, group: '3_preview', order: 10, when: contextkey_1.ContextKeyExpr.has('config.workbench.editor.enablePreview') });
    actions_3.MenuRegistry.appendMenuItem(9 /* EditorTitleContext */, { command: { id: editorCommands.SPLIT_EDITOR_UP, title: nls.localize('splitUp', "Split Up") }, group: '5_split', order: 10 });
    actions_3.MenuRegistry.appendMenuItem(9 /* EditorTitleContext */, { command: { id: editorCommands.SPLIT_EDITOR_DOWN, title: nls.localize('splitDown', "Split Down") }, group: '5_split', order: 20 });
    actions_3.MenuRegistry.appendMenuItem(9 /* EditorTitleContext */, { command: { id: editorCommands.SPLIT_EDITOR_LEFT, title: nls.localize('splitLeft', "Split Left") }, group: '5_split', order: 30 });
    actions_3.MenuRegistry.appendMenuItem(9 /* EditorTitleContext */, { command: { id: editorCommands.SPLIT_EDITOR_RIGHT, title: nls.localize('splitRight', "Split Right") }, group: '5_split', order: 40 });
    // Editor Title Menu
    actions_3.MenuRegistry.appendMenuItem(8 /* EditorTitle */, { command: { id: editorCommands.TOGGLE_DIFF_SIDE_BY_SIDE, title: nls.localize('toggleInlineView', "Toggle Inline View") }, group: '1_diff', order: 10, when: contextkey_1.ContextKeyExpr.has('isInDiffEditor') });
    actions_3.MenuRegistry.appendMenuItem(8 /* EditorTitle */, { command: { id: editorCommands.SHOW_EDITORS_IN_GROUP, title: nls.localize('showOpenedEditors', "Show Opened Editors") }, group: '3_open', order: 10, when: contextkey_1.ContextKeyExpr.has('config.workbench.editor.showTabs') });
    actions_3.MenuRegistry.appendMenuItem(8 /* EditorTitle */, { command: { id: editorCommands.CLOSE_EDITORS_IN_GROUP_COMMAND_ID, title: nls.localize('closeAll', "Close All") }, group: '5_close', order: 10, when: contextkey_1.ContextKeyExpr.has('config.workbench.editor.showTabs') });
    actions_3.MenuRegistry.appendMenuItem(8 /* EditorTitle */, { command: { id: editorCommands.CLOSE_SAVED_EDITORS_COMMAND_ID, title: nls.localize('closeAllSaved', "Close Saved") }, group: '5_close', order: 20, when: contextkey_1.ContextKeyExpr.has('config.workbench.editor.showTabs') });
    function appendEditorToolItem(primary, when, order, alternative) {
        const item = {
            command: {
                id: primary.id,
                title: primary.title,
                iconLocation: {
                    dark: primary.iconDark,
                    light: primary.iconLight
                }
            },
            group: 'navigation',
            when,
            order
        };
        if (alternative) {
            item.alt = {
                id: alternative.id,
                title: alternative.title,
                iconLocation: {
                    dark: alternative.iconDark,
                    light: alternative.iconLight
                }
            };
        }
        actions_3.MenuRegistry.appendMenuItem(8 /* EditorTitle */, item);
    }
    const SPLIT_EDITOR_HORIZONTAL_DARK_ICON = uri_1.URI.parse(amd_1.registerAndGetAmdImageURL('vs/workbench/browser/parts/editor/media/split-editor-horizontal-dark.svg'));
    const SPLIT_EDITOR_HORIZONTAL_LIGHT_ICON = uri_1.URI.parse(amd_1.registerAndGetAmdImageURL('vs/workbench/browser/parts/editor/media/split-editor-horizontal-light.svg'));
    const SPLIT_EDITOR_VERTICAL_DARK_ICON = uri_1.URI.parse(amd_1.registerAndGetAmdImageURL('vs/workbench/browser/parts/editor/media/split-editor-vertical-dark.svg'));
    const SPLIT_EDITOR_VERTICAL_LIGHT_ICON = uri_1.URI.parse(amd_1.registerAndGetAmdImageURL('vs/workbench/browser/parts/editor/media/split-editor-vertical-light.svg'));
    // Editor Title Menu: Split Editor
    appendEditorToolItem({
        id: editorActions_1.SplitEditorAction.ID,
        title: nls.localize('splitEditorRight', "Split Editor Right"),
        iconDark: SPLIT_EDITOR_HORIZONTAL_DARK_ICON,
        iconLight: SPLIT_EDITOR_HORIZONTAL_LIGHT_ICON
    }, contextkey_1.ContextKeyExpr.not('splitEditorsVertically'), 100000, // towards the end
    {
        id: editorCommands.SPLIT_EDITOR_DOWN,
        title: nls.localize('splitEditorDown', "Split Editor Down"),
        iconDark: SPLIT_EDITOR_VERTICAL_DARK_ICON,
        iconLight: SPLIT_EDITOR_VERTICAL_LIGHT_ICON
    });
    appendEditorToolItem({
        id: editorActions_1.SplitEditorAction.ID,
        title: nls.localize('splitEditorDown', "Split Editor Down"),
        iconDark: SPLIT_EDITOR_VERTICAL_DARK_ICON,
        iconLight: SPLIT_EDITOR_VERTICAL_LIGHT_ICON
    }, contextkey_1.ContextKeyExpr.has('splitEditorsVertically'), 100000, // towards the end
    {
        id: editorCommands.SPLIT_EDITOR_RIGHT,
        title: nls.localize('splitEditorRight', "Split Editor Right"),
        iconDark: SPLIT_EDITOR_HORIZONTAL_DARK_ICON,
        iconLight: SPLIT_EDITOR_HORIZONTAL_LIGHT_ICON
    });
    const CLOSE_ALL_DARK_ICON = uri_1.URI.parse(amd_1.registerAndGetAmdImageURL('vs/workbench/browser/parts/editor/media/close-all-dark.svg'));
    const CLOSE_ALL_LIGHT_ICON = uri_1.URI.parse(amd_1.registerAndGetAmdImageURL('vs/workbench/browser/parts/editor/media/close-all-light.svg'));
    // Editor Title Menu: Close Group (tabs disabled)
    appendEditorToolItem({
        id: editorCommands.CLOSE_EDITOR_COMMAND_ID,
        title: nls.localize('close', "Close"),
        iconDark: uri_1.URI.parse(amd_1.registerAndGetAmdImageURL('vs/workbench/browser/parts/editor/media/close-dark-alt.svg')),
        iconLight: uri_1.URI.parse(amd_1.registerAndGetAmdImageURL('vs/workbench/browser/parts/editor/media/close-light-alt.svg'))
    }, contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.not('config.workbench.editor.showTabs'), contextkey_1.ContextKeyExpr.not('groupActiveEditorDirty')), 1000000, // towards the far end
    {
        id: editorCommands.CLOSE_EDITORS_IN_GROUP_COMMAND_ID,
        title: nls.localize('closeAll', "Close All"),
        iconDark: CLOSE_ALL_DARK_ICON,
        iconLight: CLOSE_ALL_LIGHT_ICON
    });
    appendEditorToolItem({
        id: editorCommands.CLOSE_EDITOR_COMMAND_ID,
        title: nls.localize('close', "Close"),
        iconDark: uri_1.URI.parse(amd_1.registerAndGetAmdImageURL('vs/workbench/browser/parts/editor/media/close-dirty-dark-alt.svg')),
        iconLight: uri_1.URI.parse(amd_1.registerAndGetAmdImageURL('vs/workbench/browser/parts/editor/media/close-dirty-light-alt.svg'))
    }, contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.not('config.workbench.editor.showTabs'), contextkey_1.ContextKeyExpr.has('groupActiveEditorDirty')), 1000000, // towards the far end
    {
        id: editorCommands.CLOSE_EDITORS_IN_GROUP_COMMAND_ID,
        title: nls.localize('closeAll', "Close All"),
        iconDark: CLOSE_ALL_DARK_ICON,
        iconLight: CLOSE_ALL_LIGHT_ICON
    });
    // Diff Editor Title Menu: Previous Change
    appendEditorToolItem({
        id: editorCommands.GOTO_PREVIOUS_CHANGE,
        title: nls.localize('navigate.prev.label', "Previous Change"),
        iconDark: uri_1.URI.parse(amd_1.registerAndGetAmdImageURL('vs/workbench/browser/parts/editor/media/previous-diff-dark.svg')),
        iconLight: uri_1.URI.parse(amd_1.registerAndGetAmdImageURL('vs/workbench/browser/parts/editor/media/previous-diff-light.svg'))
    }, editor_2.TextCompareEditorActiveContext, 10);
    // Diff Editor Title Menu: Next Change
    appendEditorToolItem({
        id: editorCommands.GOTO_NEXT_CHANGE,
        title: nls.localize('navigate.next.label', "Next Change"),
        iconDark: uri_1.URI.parse(amd_1.registerAndGetAmdImageURL('vs/workbench/browser/parts/editor/media/next-diff-dark.svg')),
        iconLight: uri_1.URI.parse(amd_1.registerAndGetAmdImageURL('vs/workbench/browser/parts/editor/media/next-diff-light.svg'))
    }, editor_2.TextCompareEditorActiveContext, 11);
    // Diff Editor Title Menu: Toggle Ignore Trim Whitespace (Enabled)
    appendEditorToolItem({
        id: editorCommands.TOGGLE_DIFF_IGNORE_TRIM_WHITESPACE,
        title: nls.localize('ignoreTrimWhitespace.label', "Ignore Leading/Trailing Whitespace Differences"),
        iconDark: uri_1.URI.parse(amd_1.registerAndGetAmdImageURL('vs/workbench/browser/parts/editor/media/paragraph-dark.svg')),
        iconLight: uri_1.URI.parse(amd_1.registerAndGetAmdImageURL('vs/workbench/browser/parts/editor/media/paragraph-light.svg'))
    }, contextkey_1.ContextKeyExpr.and(editor_2.TextCompareEditorActiveContext, contextkey_1.ContextKeyExpr.notEquals('config.diffEditor.ignoreTrimWhitespace', true)), 20);
    // Diff Editor Title Menu: Toggle Ignore Trim Whitespace (Disabled)
    appendEditorToolItem({
        id: editorCommands.TOGGLE_DIFF_IGNORE_TRIM_WHITESPACE,
        title: nls.localize('showTrimWhitespace.label', "Show Leading/Trailing Whitespace Differences"),
        iconDark: uri_1.URI.parse(amd_1.registerAndGetAmdImageURL('vs/workbench/browser/parts/editor/media/paragraph-disabled-dark.svg')),
        iconLight: uri_1.URI.parse(amd_1.registerAndGetAmdImageURL('vs/workbench/browser/parts/editor/media/paragraph-disabled-light.svg'))
    }, contextkey_1.ContextKeyExpr.and(editor_2.TextCompareEditorActiveContext, contextkey_1.ContextKeyExpr.notEquals('config.diffEditor.ignoreTrimWhitespace', false)), 20);
    // Editor Commands for Command Palette
    const viewCategory = { value: nls.localize('view', "View"), original: 'View' };
    actions_3.MenuRegistry.appendMenuItem(0 /* CommandPalette */, { command: { id: editorCommands.KEEP_EDITOR_COMMAND_ID, title: { value: nls.localize('keepEditor', "Keep Editor"), original: 'Keep Editor' }, category: viewCategory }, when: contextkey_1.ContextKeyExpr.has('config.workbench.editor.enablePreview') });
    actions_3.MenuRegistry.appendMenuItem(0 /* CommandPalette */, { command: { id: editorCommands.CLOSE_EDITORS_IN_GROUP_COMMAND_ID, title: { value: nls.localize('closeEditorsInGroup', "Close All Editors in Group"), original: 'Close All Editors in Group' }, category: viewCategory } });
    actions_3.MenuRegistry.appendMenuItem(0 /* CommandPalette */, { command: { id: editorCommands.CLOSE_SAVED_EDITORS_COMMAND_ID, title: { value: nls.localize('closeSavedEditors', "Close Saved Editors in Group"), original: 'Close Saved Editors in Group' }, category: viewCategory } });
    actions_3.MenuRegistry.appendMenuItem(0 /* CommandPalette */, { command: { id: editorCommands.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID, title: { value: nls.localize('closeOtherEditors', "Close Other Editors in Group"), original: 'Close Other Editors in Group' }, category: viewCategory } });
    actions_3.MenuRegistry.appendMenuItem(0 /* CommandPalette */, { command: { id: editorCommands.CLOSE_EDITORS_TO_THE_RIGHT_COMMAND_ID, title: { value: nls.localize('closeRightEditors', "Close Editors to the Right in Group"), original: 'Close Editors to the Right in Group' }, category: viewCategory } });
    // File menu
    actions_3.MenuRegistry.appendMenuItem(21 /* MenubarRecentMenu */, {
        group: '1_editor',
        command: {
            id: editorActions_1.ReopenClosedEditorAction.ID,
            title: nls.localize({ key: 'miReopenClosedEditor', comment: ['&& denotes a mnemonic'] }, "&&Reopen Closed Editor")
        },
        order: 1
    });
    actions_3.MenuRegistry.appendMenuItem(21 /* MenubarRecentMenu */, {
        group: 'z_clear',
        command: {
            id: editorActions_1.ClearRecentFilesAction.ID,
            title: nls.localize({ key: 'miClearRecentOpen', comment: ['&& denotes a mnemonic'] }, "&&Clear Recently Opened")
        },
        order: 1
    });
    // Layout menu
    actions_3.MenuRegistry.appendMenuItem(26 /* MenubarViewMenu */, {
        group: '2_appearance',
        title: nls.localize({ key: 'miEditorLayout', comment: ['&& denotes a mnemonic'] }, "Editor &&Layout"),
        submenu: 18 /* MenubarLayoutMenu */,
        order: 2
    });
    actions_3.MenuRegistry.appendMenuItem(18 /* MenubarLayoutMenu */, {
        group: '1_split',
        command: {
            id: editorCommands.SPLIT_EDITOR_UP,
            title: nls.localize({ key: 'miSplitEditorUp', comment: ['&& denotes a mnemonic'] }, "Split &&Up")
        },
        order: 1
    });
    actions_3.MenuRegistry.appendMenuItem(18 /* MenubarLayoutMenu */, {
        group: '1_split',
        command: {
            id: editorCommands.SPLIT_EDITOR_DOWN,
            title: nls.localize({ key: 'miSplitEditorDown', comment: ['&& denotes a mnemonic'] }, "Split &&Down")
        },
        order: 2
    });
    actions_3.MenuRegistry.appendMenuItem(18 /* MenubarLayoutMenu */, {
        group: '1_split',
        command: {
            id: editorCommands.SPLIT_EDITOR_LEFT,
            title: nls.localize({ key: 'miSplitEditorLeft', comment: ['&& denotes a mnemonic'] }, "Split &&Left")
        },
        order: 3
    });
    actions_3.MenuRegistry.appendMenuItem(18 /* MenubarLayoutMenu */, {
        group: '1_split',
        command: {
            id: editorCommands.SPLIT_EDITOR_RIGHT,
            title: nls.localize({ key: 'miSplitEditorRight', comment: ['&& denotes a mnemonic'] }, "Split &&Right")
        },
        order: 4
    });
    actions_3.MenuRegistry.appendMenuItem(18 /* MenubarLayoutMenu */, {
        group: '2_layouts',
        command: {
            id: editorActions_1.EditorLayoutSingleAction.ID,
            title: nls.localize({ key: 'miSingleColumnEditorLayout', comment: ['&& denotes a mnemonic'] }, "&&Single")
        },
        order: 1
    });
    actions_3.MenuRegistry.appendMenuItem(18 /* MenubarLayoutMenu */, {
        group: '2_layouts',
        command: {
            id: editorActions_1.EditorLayoutTwoColumnsAction.ID,
            title: nls.localize({ key: 'miTwoColumnsEditorLayout', comment: ['&& denotes a mnemonic'] }, "&&Two Columns")
        },
        order: 3
    });
    actions_3.MenuRegistry.appendMenuItem(18 /* MenubarLayoutMenu */, {
        group: '2_layouts',
        command: {
            id: editorActions_1.EditorLayoutThreeColumnsAction.ID,
            title: nls.localize({ key: 'miThreeColumnsEditorLayout', comment: ['&& denotes a mnemonic'] }, "T&&hree Columns")
        },
        order: 4
    });
    actions_3.MenuRegistry.appendMenuItem(18 /* MenubarLayoutMenu */, {
        group: '2_layouts',
        command: {
            id: editorActions_1.EditorLayoutTwoRowsAction.ID,
            title: nls.localize({ key: 'miTwoRowsEditorLayout', comment: ['&& denotes a mnemonic'] }, "T&&wo Rows")
        },
        order: 5
    });
    actions_3.MenuRegistry.appendMenuItem(18 /* MenubarLayoutMenu */, {
        group: '2_layouts',
        command: {
            id: editorActions_1.EditorLayoutThreeRowsAction.ID,
            title: nls.localize({ key: 'miThreeRowsEditorLayout', comment: ['&& denotes a mnemonic'] }, "Three &&Rows")
        },
        order: 6
    });
    actions_3.MenuRegistry.appendMenuItem(18 /* MenubarLayoutMenu */, {
        group: '2_layouts',
        command: {
            id: editorActions_1.EditorLayoutTwoByTwoGridAction.ID,
            title: nls.localize({ key: 'miTwoByTwoGridEditorLayout', comment: ['&& denotes a mnemonic'] }, "&&Grid (2x2)")
        },
        order: 7
    });
    actions_3.MenuRegistry.appendMenuItem(18 /* MenubarLayoutMenu */, {
        group: '2_layouts',
        command: {
            id: editorActions_1.EditorLayoutTwoRowsRightAction.ID,
            title: nls.localize({ key: 'miTwoRowsRightEditorLayout', comment: ['&& denotes a mnemonic'] }, "Two R&&ows Right")
        },
        order: 8
    });
    actions_3.MenuRegistry.appendMenuItem(18 /* MenubarLayoutMenu */, {
        group: '2_layouts',
        command: {
            id: editorActions_1.EditorLayoutTwoColumnsBottomAction.ID,
            title: nls.localize({ key: 'miTwoColumnsBottomEditorLayout', comment: ['&& denotes a mnemonic'] }, "Two &&Columns Bottom")
        },
        order: 9
    });
    // Main Menu Bar Contributions:
    // Forward/Back
    actions_3.MenuRegistry.appendMenuItem(16 /* MenubarGoMenu */, {
        group: '1_history_nav',
        command: {
            id: 'workbench.action.navigateBack',
            title: nls.localize({ key: 'miBack', comment: ['&& denotes a mnemonic'] }, "&&Back"),
            precondition: contextkey_1.ContextKeyExpr.has('canNavigateBack')
        },
        order: 1
    });
    actions_3.MenuRegistry.appendMenuItem(16 /* MenubarGoMenu */, {
        group: '1_history_nav',
        command: {
            id: 'workbench.action.navigateForward',
            title: nls.localize({ key: 'miForward', comment: ['&& denotes a mnemonic'] }, "&&Forward"),
            precondition: contextkey_1.ContextKeyExpr.has('canNavigateForward')
        },
        order: 2
    });
    actions_3.MenuRegistry.appendMenuItem(16 /* MenubarGoMenu */, {
        group: '1_history_nav',
        command: {
            id: 'workbench.action.navigateToLastEditLocation',
            title: nls.localize({ key: 'miLastEditLocation', comment: ['&& denotes a mnemonic'] }, "&&Last Edit Location"),
            precondition: contextkey_1.ContextKeyExpr.has('canNavigateToLastEditLocation')
        },
        order: 3
    });
    // Switch Editor
    actions_3.MenuRegistry.appendMenuItem(23 /* MenubarSwitchEditorMenu */, {
        group: '1_any',
        command: {
            id: 'workbench.action.nextEditor',
            title: nls.localize({ key: 'miNextEditor', comment: ['&& denotes a mnemonic'] }, "&&Next Editor")
        },
        order: 1
    });
    actions_3.MenuRegistry.appendMenuItem(23 /* MenubarSwitchEditorMenu */, {
        group: '1_any',
        command: {
            id: 'workbench.action.previousEditor',
            title: nls.localize({ key: 'miPreviousEditor', comment: ['&& denotes a mnemonic'] }, "&&Previous Editor")
        },
        order: 2
    });
    actions_3.MenuRegistry.appendMenuItem(23 /* MenubarSwitchEditorMenu */, {
        group: '2_used',
        command: {
            id: 'workbench.action.openNextRecentlyUsedEditorInGroup',
            title: nls.localize({ key: 'miNextEditorInGroup', comment: ['&& denotes a mnemonic'] }, "&&Next Used Editor in Group")
        },
        order: 1
    });
    actions_3.MenuRegistry.appendMenuItem(23 /* MenubarSwitchEditorMenu */, {
        group: '2_used',
        command: {
            id: 'workbench.action.openPreviousRecentlyUsedEditorInGroup',
            title: nls.localize({ key: 'miPreviousEditorInGroup', comment: ['&& denotes a mnemonic'] }, "&&Previous Used Editor in Group")
        },
        order: 2
    });
    actions_3.MenuRegistry.appendMenuItem(16 /* MenubarGoMenu */, {
        group: '2_editor_nav',
        title: nls.localize({ key: 'miSwitchEditor', comment: ['&& denotes a mnemonic'] }, "Switch &&Editor"),
        submenu: 23 /* MenubarSwitchEditorMenu */,
        order: 1
    });
    // Switch Group
    actions_3.MenuRegistry.appendMenuItem(24 /* MenubarSwitchGroupMenu */, {
        group: '1_focus_index',
        command: {
            id: 'workbench.action.focusFirstEditorGroup',
            title: nls.localize({ key: 'miFocusFirstGroup', comment: ['&& denotes a mnemonic'] }, "Group &&1")
        },
        order: 1
    });
    actions_3.MenuRegistry.appendMenuItem(24 /* MenubarSwitchGroupMenu */, {
        group: '1_focus_index',
        command: {
            id: 'workbench.action.focusSecondEditorGroup',
            title: nls.localize({ key: 'miFocusSecondGroup', comment: ['&& denotes a mnemonic'] }, "Group &&2")
        },
        order: 2
    });
    actions_3.MenuRegistry.appendMenuItem(24 /* MenubarSwitchGroupMenu */, {
        group: '1_focus_index',
        command: {
            id: 'workbench.action.focusThirdEditorGroup',
            title: nls.localize({ key: 'miFocusThirdGroup', comment: ['&& denotes a mnemonic'] }, "Group &&3")
        },
        order: 3
    });
    actions_3.MenuRegistry.appendMenuItem(24 /* MenubarSwitchGroupMenu */, {
        group: '1_focus_index',
        command: {
            id: 'workbench.action.focusFourthEditorGroup',
            title: nls.localize({ key: 'miFocusFourthGroup', comment: ['&& denotes a mnemonic'] }, "Group &&4")
        },
        order: 4
    });
    actions_3.MenuRegistry.appendMenuItem(24 /* MenubarSwitchGroupMenu */, {
        group: '1_focus_index',
        command: {
            id: 'workbench.action.focusFifthEditorGroup',
            title: nls.localize({ key: 'miFocusFifthGroup', comment: ['&& denotes a mnemonic'] }, "Group &&5")
        },
        order: 5
    });
    actions_3.MenuRegistry.appendMenuItem(24 /* MenubarSwitchGroupMenu */, {
        group: '2_next_prev',
        command: {
            id: 'workbench.action.focusNextGroup',
            title: nls.localize({ key: 'miNextGroup', comment: ['&& denotes a mnemonic'] }, "&&Next Group")
        },
        order: 1
    });
    actions_3.MenuRegistry.appendMenuItem(24 /* MenubarSwitchGroupMenu */, {
        group: '2_next_prev',
        command: {
            id: 'workbench.action.focusPreviousGroup',
            title: nls.localize({ key: 'miPreviousGroup', comment: ['&& denotes a mnemonic'] }, "&&Previous Group")
        },
        order: 2
    });
    actions_3.MenuRegistry.appendMenuItem(24 /* MenubarSwitchGroupMenu */, {
        group: '3_directional',
        command: {
            id: 'workbench.action.focusLeftGroup',
            title: nls.localize({ key: 'miFocusLeftGroup', comment: ['&& denotes a mnemonic'] }, "Group &&Left")
        },
        order: 1
    });
    actions_3.MenuRegistry.appendMenuItem(24 /* MenubarSwitchGroupMenu */, {
        group: '3_directional',
        command: {
            id: 'workbench.action.focusRightGroup',
            title: nls.localize({ key: 'miFocusRightGroup', comment: ['&& denotes a mnemonic'] }, "Group &&Right")
        },
        order: 2
    });
    actions_3.MenuRegistry.appendMenuItem(24 /* MenubarSwitchGroupMenu */, {
        group: '3_directional',
        command: {
            id: 'workbench.action.focusAboveGroup',
            title: nls.localize({ key: 'miFocusAboveGroup', comment: ['&& denotes a mnemonic'] }, "Group &&Above")
        },
        order: 3
    });
    actions_3.MenuRegistry.appendMenuItem(24 /* MenubarSwitchGroupMenu */, {
        group: '3_directional',
        command: {
            id: 'workbench.action.focusBelowGroup',
            title: nls.localize({ key: 'miFocusBelowGroup', comment: ['&& denotes a mnemonic'] }, "Group &&Below")
        },
        order: 4
    });
    actions_3.MenuRegistry.appendMenuItem(16 /* MenubarGoMenu */, {
        group: '2_editor_nav',
        title: nls.localize({ key: 'miSwitchGroup', comment: ['&& denotes a mnemonic'] }, "Switch &&Group"),
        submenu: 24 /* MenubarSwitchGroupMenu */,
        order: 2
    });
});
//# sourceMappingURL=editor.contribution.js.map