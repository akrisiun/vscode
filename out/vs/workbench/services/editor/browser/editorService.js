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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/editor/common/editor", "vs/workbench/common/editor", "vs/workbench/common/editor/resourceEditorInput", "vs/workbench/common/editor/dataUriEditorInput", "vs/platform/registry/common/platform", "vs/base/common/map", "vs/workbench/services/untitled/common/untitledEditorService", "vs/platform/files/common/files", "vs/base/common/network", "vs/base/common/event", "vs/base/common/uri", "vs/base/common/resources", "vs/workbench/common/editor/diffEditorInput", "vs/nls", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/base/common/arrays", "vs/editor/browser/editorBrowser", "vs/platform/label/common/label", "vs/platform/instantiation/common/extensions", "vs/base/common/types"], function (require, exports, instantiation_1, editor_1, editor_2, resourceEditorInput_1, dataUriEditorInput_1, platform_1, map_1, untitledEditorService_1, files_1, network_1, event_1, uri_1, resources_1, diffEditorInput_1, nls_1, editorGroupsService_1, editorService_1, configuration_1, lifecycle_1, arrays_1, editorBrowser_1, label_1, extensions_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let EditorService = class EditorService extends lifecycle_1.Disposable {
        constructor(editorGroupService, untitledEditorService, instantiationService, labelService, fileService, configurationService) {
            super();
            this.editorGroupService = editorGroupService;
            this.untitledEditorService = untitledEditorService;
            this.instantiationService = instantiationService;
            this.labelService = labelService;
            this.fileService = fileService;
            this.configurationService = configurationService;
            //#region events
            this._onDidActiveEditorChange = this._register(new event_1.Emitter());
            this.onDidActiveEditorChange = this._onDidActiveEditorChange.event;
            this._onDidVisibleEditorsChange = this._register(new event_1.Emitter());
            this.onDidVisibleEditorsChange = this._onDidVisibleEditorsChange.event;
            this._onDidCloseEditor = this._register(new event_1.Emitter());
            this.onDidCloseEditor = this._onDidCloseEditor.event;
            this._onDidOpenEditorFail = this._register(new event_1.Emitter());
            this.onDidOpenEditorFail = this._onDidOpenEditorFail.event;
            this.openEditorHandlers = [];
            this.lastActiveEditor = null;
            this.lastActiveGroupId = null;
            this.fileInputFactory = platform_1.Registry.as(editor_2.Extensions.EditorInputFactories).getFileInputFactory();
            this.registerListeners();
        }
        registerListeners() {
            this.editorGroupService.whenRestored.then(() => this.onEditorsRestored());
            this.editorGroupService.onDidActiveGroupChange(group => this.handleActiveEditorChange(group));
            this.editorGroupService.onDidAddGroup(group => this.registerGroupListeners(group));
        }
        onEditorsRestored() {
            // Register listeners to each opened group
            this.editorGroupService.groups.forEach(group => this.registerGroupListeners(group));
            // Fire initial set of editor events if there is an active editor
            if (this.activeEditor) {
                this.doEmitActiveEditorChangeEvent();
                this._onDidVisibleEditorsChange.fire();
            }
        }
        handleActiveEditorChange(group) {
            if (group !== this.editorGroupService.activeGroup) {
                return; // ignore if not the active group
            }
            if (!this.lastActiveEditor && !group.activeEditor) {
                return; // ignore if we still have no active editor
            }
            if (this.lastActiveGroupId === group.id && this.lastActiveEditor === group.activeEditor) {
                return; // ignore if the editor actually did not change
            }
            this.doEmitActiveEditorChangeEvent();
        }
        doEmitActiveEditorChangeEvent() {
            const activeGroup = this.editorGroupService.activeGroup;
            this.lastActiveGroupId = activeGroup.id;
            this.lastActiveEditor = activeGroup.activeEditor;
            this._onDidActiveEditorChange.fire();
        }
        registerGroupListeners(group) {
            const groupDisposables = new lifecycle_1.DisposableStore();
            groupDisposables.add(group.onDidGroupChange(e => {
                if (e.kind === 5 /* EDITOR_ACTIVE */) {
                    this.handleActiveEditorChange(group);
                    this._onDidVisibleEditorsChange.fire();
                }
            }));
            groupDisposables.add(group.onDidCloseEditor(event => {
                this._onDidCloseEditor.fire(event);
            }));
            groupDisposables.add(group.onWillOpenEditor(event => {
                this.onGroupWillOpenEditor(group, event);
            }));
            groupDisposables.add(group.onDidOpenEditorFail(editor => {
                this._onDidOpenEditorFail.fire({ editor, groupId: group.id });
            }));
            event_1.Event.once(group.onWillDispose)(() => {
                lifecycle_1.dispose(groupDisposables);
            });
        }
        onGroupWillOpenEditor(group, event) {
            var _a;
            if (event.options && event.options.ignoreOverrides) {
                return;
            }
            for (const handler of this.openEditorHandlers) {
                const result = handler(event.editor, event.options, group);
                const override = (_a = result) === null || _a === void 0 ? void 0 : _a.override;
                if (override) {
                    event.prevent((() => override.then(editor => types_1.withNullAsUndefined(editor))));
                    break;
                }
            }
        }
        get activeControl() {
            var _a;
            return (_a = this.editorGroupService.activeGroup) === null || _a === void 0 ? void 0 : _a.activeControl;
        }
        get activeTextEditorWidget() {
            const activeControl = this.activeControl;
            if (activeControl) {
                const activeControlWidget = activeControl.getControl();
                if (editorBrowser_1.isCodeEditor(activeControlWidget) || editorBrowser_1.isDiffEditor(activeControlWidget)) {
                    return activeControlWidget;
                }
            }
            return undefined;
        }
        get editors() {
            const editors = [];
            this.editorGroupService.groups.forEach(group => {
                editors.push(...group.editors);
            });
            return editors;
        }
        get activeEditor() {
            const activeGroup = this.editorGroupService.activeGroup;
            return activeGroup ? types_1.withNullAsUndefined(activeGroup.activeEditor) : undefined;
        }
        get visibleControls() {
            return arrays_1.coalesce(this.editorGroupService.groups.map(group => group.activeControl));
        }
        get visibleTextEditorWidgets() {
            return this.visibleControls.map(control => control.getControl()).filter(widget => editorBrowser_1.isCodeEditor(widget) || editorBrowser_1.isDiffEditor(widget));
        }
        get visibleEditors() {
            return arrays_1.coalesce(this.editorGroupService.groups.map(group => group.activeEditor));
        }
        //#region preventOpenEditor()
        overrideOpenEditor(handler) {
            this.openEditorHandlers.push(handler);
            return lifecycle_1.toDisposable(() => {
                const index = this.openEditorHandlers.indexOf(handler);
                if (index >= 0) {
                    this.openEditorHandlers.splice(index, 1);
                }
            });
        }
        async openEditor(editor, optionsOrGroup, group) {
            let resolvedGroup;
            let candidateGroup;
            let typedEditor;
            let typedOptions;
            // Typed Editor Support
            if (editor instanceof editor_2.EditorInput) {
                typedEditor = editor;
                typedOptions = this.toOptions(optionsOrGroup);
                candidateGroup = group;
                resolvedGroup = this.findTargetGroup(typedEditor, typedOptions, candidateGroup);
            }
            // Untyped Text Editor Support
            else {
                const textInput = editor;
                typedEditor = this.createInput(textInput);
                if (typedEditor) {
                    typedOptions = editor_2.TextEditorOptions.from(textInput);
                    candidateGroup = optionsOrGroup;
                    resolvedGroup = this.findTargetGroup(typedEditor, typedOptions, candidateGroup);
                }
            }
            if (typedEditor && resolvedGroup) {
                if (this.editorGroupService.activeGroup !== resolvedGroup && // only if target group is not already active
                    typedOptions && !typedOptions.inactive && // never for inactive editors
                    typedOptions.preserveFocus && // only if preserveFocus
                    typeof typedOptions.activation !== 'number' && // only if activation is not already defined (either true or false)
                    candidateGroup !== editorService_1.SIDE_GROUP // never for the SIDE_GROUP
                ) {
                    // If the resolved group is not the active one, we typically
                    // want the group to become active. There are a few cases
                    // where we stay away from encorcing this, e.g. if the caller
                    // is already providing `activation`.
                    //
                    // Specifically for historic reasons we do not activate a
                    // group is it is opened as `SIDE_GROUP` with `preserveFocus:true`.
                    // repeated Alt-clicking of files in the explorer always open
                    // into the same side group and not cause a group to be created each time.
                    typedOptions.overwrite({ activation: editor_1.EditorActivation.ACTIVATE });
                }
                return this.doOpenEditor(resolvedGroup, typedEditor, typedOptions);
            }
            return undefined;
        }
        async doOpenEditor(group, editor, options) {
            return types_1.withNullAsUndefined(await group.openEditor(editor, options));
        }
        findTargetGroup(input, options, group) {
            var _a, _b;
            let targetGroup;
            // Group: Instance of Group
            if (group && typeof group !== 'number') {
                targetGroup = group;
            }
            // Group: Side by Side
            else if (group === editorService_1.SIDE_GROUP) {
                targetGroup = this.findSideBySideGroup();
            }
            // Group: Specific Group
            else if (typeof group === 'number' && group >= 0) {
                targetGroup = this.editorGroupService.getGroup(group);
            }
            // Group: Unspecified without a specific index to open
            else if (!options || typeof options.index !== 'number') {
                const groupsByLastActive = this.editorGroupService.getGroups(1 /* MOST_RECENTLY_ACTIVE */);
                // Respect option to reveal an editor if it is already visible in any group
                if ((_a = options) === null || _a === void 0 ? void 0 : _a.revealIfVisible) {
                    for (const group of groupsByLastActive) {
                        if (group.isActive(input)) {
                            targetGroup = group;
                            break;
                        }
                    }
                }
                // Respect option to reveal an editor if it is open (not necessarily visible)
                // Still prefer to reveal an editor in a group where the editor is active though.
                if (!targetGroup) {
                    if (((_b = options) === null || _b === void 0 ? void 0 : _b.revealIfOpened) || this.configurationService.getValue('workbench.editor.revealIfOpen')) {
                        let groupWithInputActive = undefined;
                        let groupWithInputOpened = undefined;
                        for (const group of groupsByLastActive) {
                            if (group.isOpened(input)) {
                                if (!groupWithInputOpened) {
                                    groupWithInputOpened = group;
                                }
                                if (!groupWithInputActive && group.isActive(input)) {
                                    groupWithInputActive = group;
                                }
                            }
                            if (groupWithInputOpened && groupWithInputActive) {
                                break; // we found all groups we wanted
                            }
                        }
                        // Prefer a target group where the input is visible
                        targetGroup = groupWithInputActive || groupWithInputOpened;
                    }
                }
            }
            // Fallback to active group if target not valid
            if (!targetGroup) {
                targetGroup = this.editorGroupService.activeGroup;
            }
            return targetGroup;
        }
        findSideBySideGroup() {
            const direction = editorGroupsService_1.preferredSideBySideGroupDirection(this.configurationService);
            let neighbourGroup = this.editorGroupService.findGroup({ direction });
            if (!neighbourGroup) {
                neighbourGroup = this.editorGroupService.addGroup(this.editorGroupService.activeGroup, direction);
            }
            return neighbourGroup;
        }
        toOptions(options) {
            if (!options || options instanceof editor_2.EditorOptions) {
                return options;
            }
            const textOptions = options;
            if (textOptions.selection || textOptions.viewState) {
                return editor_2.TextEditorOptions.create(options);
            }
            return editor_2.EditorOptions.create(options);
        }
        async openEditors(editors, group) {
            // Convert to typed editors and options
            const typedEditors = [];
            editors.forEach(editor => {
                if (editor_2.isEditorInputWithOptions(editor)) {
                    typedEditors.push(editor);
                }
                else {
                    typedEditors.push({ editor: this.createInput(editor), options: editor_2.TextEditorOptions.from(editor) });
                }
            });
            // Find target groups to open
            const mapGroupToEditors = new Map();
            if (group === editorService_1.SIDE_GROUP) {
                mapGroupToEditors.set(this.findSideBySideGroup(), typedEditors);
            }
            else {
                typedEditors.forEach(typedEditor => {
                    const targetGroup = this.findTargetGroup(typedEditor.editor, typedEditor.options, group);
                    let targetGroupEditors = mapGroupToEditors.get(targetGroup);
                    if (!targetGroupEditors) {
                        targetGroupEditors = [];
                        mapGroupToEditors.set(targetGroup, targetGroupEditors);
                    }
                    targetGroupEditors.push(typedEditor);
                });
            }
            // Open in target groups
            const result = [];
            mapGroupToEditors.forEach((editorsWithOptions, group) => {
                result.push(group.openEditors(editorsWithOptions));
            });
            return arrays_1.coalesce(await Promise.all(result));
        }
        //#endregion
        //#region isOpen()
        isOpen(editor) {
            return !!this.doGetOpened(editor);
        }
        //#endregion
        //#region getOpend()
        getOpened(editor) {
            return this.doGetOpened(editor);
        }
        doGetOpened(editor) {
            if (!(editor instanceof editor_2.EditorInput)) {
                const resourceInput = editor;
                if (!resourceInput.resource) {
                    return undefined; // we need a resource at least
                }
            }
            // For each editor group
            for (const group of this.editorGroupService.groups) {
                // Typed editor
                if (editor instanceof editor_2.EditorInput) {
                    if (group.isOpened(editor)) {
                        return editor;
                    }
                }
                // Resource editor
                else {
                    for (const editorInGroup of group.editors) {
                        const resource = editor_2.toResource(editorInGroup, { supportSideBySide: editor_2.SideBySideEditor.MASTER });
                        if (!resource) {
                            continue; // need a resource to compare with
                        }
                        const resourceInput = editor;
                        if (resourceInput.resource && resources_1.isEqual(resource, resourceInput.resource)) {
                            return editorInGroup;
                        }
                    }
                }
            }
            return undefined;
        }
        replaceEditors(editors, group) {
            const typedEditors = [];
            editors.forEach(replaceEditorArg => {
                if (replaceEditorArg.editor instanceof editor_2.EditorInput) {
                    typedEditors.push(replaceEditorArg);
                }
                else {
                    const editor = replaceEditorArg.editor;
                    const replacement = replaceEditorArg.replacement;
                    const typedEditor = this.createInput(editor);
                    const typedReplacement = this.createInput(replacement);
                    typedEditors.push({
                        editor: typedEditor,
                        replacement: typedReplacement,
                        options: this.toOptions(replacement.options)
                    });
                }
            });
            const targetGroup = typeof group === 'number' ? this.editorGroupService.getGroup(group) : group;
            if (targetGroup) {
                return targetGroup.replaceEditors(typedEditors);
            }
            return Promise.resolve();
        }
        //#endregion
        //#region invokeWithinEditorContext()
        invokeWithinEditorContext(fn) {
            const activeTextEditorWidget = this.activeTextEditorWidget;
            if (editorBrowser_1.isCodeEditor(activeTextEditorWidget)) {
                return activeTextEditorWidget.invokeWithinContext(fn);
            }
            const activeGroup = this.editorGroupService.activeGroup;
            if (activeGroup) {
                return activeGroup.invokeWithinContext(fn);
            }
            return this.instantiationService.invokeFunction(fn);
        }
        //#endregion
        //#region createInput()
        createInput(input) {
            // Typed Editor Input Support (EditorInput)
            if (input instanceof editor_2.EditorInput) {
                return input;
            }
            // Typed Editor Input Support (IEditorInputWithOptions)
            const editorInputWithOptions = input;
            if (editorInputWithOptions.editor instanceof editor_2.EditorInput) {
                return editorInputWithOptions.editor;
            }
            // Side by Side Support
            const resourceSideBySideInput = input;
            if (resourceSideBySideInput.masterResource && resourceSideBySideInput.detailResource) {
                const masterInput = this.createInput({ resource: resourceSideBySideInput.masterResource, forceFile: resourceSideBySideInput.forceFile });
                const detailInput = this.createInput({ resource: resourceSideBySideInput.detailResource, forceFile: resourceSideBySideInput.forceFile });
                const label = resourceSideBySideInput.label || masterInput.getName() || nls_1.localize('sideBySideLabels', "{0} - {1}", this.toDiffLabel(masterInput), this.toDiffLabel(detailInput));
                return new editor_2.SideBySideEditorInput(label, typeof resourceSideBySideInput.description === 'string' ? resourceSideBySideInput.description : masterInput.getDescription(), detailInput, masterInput);
            }
            // Diff Editor Support
            const resourceDiffInput = input;
            if (resourceDiffInput.leftResource && resourceDiffInput.rightResource) {
                const leftInput = this.createInput({ resource: resourceDiffInput.leftResource, forceFile: resourceDiffInput.forceFile });
                const rightInput = this.createInput({ resource: resourceDiffInput.rightResource, forceFile: resourceDiffInput.forceFile });
                const label = resourceDiffInput.label || nls_1.localize('compareLabels', "{0} ↔ {1}", this.toDiffLabel(leftInput), this.toDiffLabel(rightInput));
                return new diffEditorInput_1.DiffEditorInput(label, resourceDiffInput.description, leftInput, rightInput);
            }
            // Untitled file support
            const untitledInput = input;
            if (untitledInput.forceUntitled || !untitledInput.resource || (untitledInput.resource && untitledInput.resource.scheme === network_1.Schemas.untitled)) {
                return this.untitledEditorService.createOrGet(untitledInput.resource, untitledInput.mode, untitledInput.contents, untitledInput.encoding);
            }
            // Resource Editor Support
            const resourceInput = input;
            if (resourceInput.resource instanceof uri_1.URI) {
                let label = resourceInput.label;
                if (!label && resourceInput.resource.scheme !== network_1.Schemas.data) {
                    label = resources_1.basename(resourceInput.resource); // derive the label from the path (but not for data URIs)
                }
                return this.createOrGet(resourceInput.resource, this.instantiationService, label, resourceInput.description, resourceInput.encoding, resourceInput.mode, resourceInput.forceFile);
            }
            throw new Error('Unknown input type');
        }
        createOrGet(resource, instantiationService, label, description, encoding, mode, forceFile) {
            if (EditorService.CACHE.has(resource)) {
                const input = EditorService.CACHE.get(resource);
                if (input instanceof resourceEditorInput_1.ResourceEditorInput) {
                    if (label) {
                        input.setName(label);
                    }
                    if (description) {
                        input.setDescription(description);
                    }
                    if (mode) {
                        input.setPreferredMode(mode);
                    }
                }
                else if (!(input instanceof dataUriEditorInput_1.DataUriEditorInput)) {
                    if (encoding) {
                        input.setPreferredEncoding(encoding);
                    }
                    if (mode) {
                        input.setPreferredMode(mode);
                    }
                }
                return input;
            }
            // File
            let input;
            if (forceFile /* fix for https://github.com/Microsoft/vscode/issues/48275 */ || this.fileService.canHandleResource(resource)) {
                input = this.fileInputFactory.createFileInput(resource, encoding, mode, instantiationService);
            }
            // Data URI
            else if (resource.scheme === network_1.Schemas.data) {
                input = instantiationService.createInstance(dataUriEditorInput_1.DataUriEditorInput, label, description, resource);
            }
            // Resource
            else {
                input = instantiationService.createInstance(resourceEditorInput_1.ResourceEditorInput, label, description, resource, mode);
            }
            // Add to cache and remove when input gets disposed
            EditorService.CACHE.set(resource, input);
            event_1.Event.once(input.onDispose)(() => EditorService.CACHE.delete(resource));
            return input;
        }
        toDiffLabel(input) {
            const res = input.getResource();
            if (!res) {
                return undefined;
            }
            // Do not try to extract any paths from simple untitled editors
            if (res.scheme === network_1.Schemas.untitled && !this.untitledEditorService.hasAssociatedFilePath(res)) {
                return input.getName();
            }
            // Otherwise: for diff labels prefer to see the path as part of the label
            return this.labelService.getUriLabel(res, { relative: true });
        }
    };
    EditorService.CACHE = new map_1.ResourceMap();
    EditorService = __decorate([
        __param(0, editorGroupsService_1.IEditorGroupsService),
        __param(1, untitledEditorService_1.IUntitledEditorService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, label_1.ILabelService),
        __param(4, files_1.IFileService),
        __param(5, configuration_1.IConfigurationService)
    ], EditorService);
    exports.EditorService = EditorService;
    /**
     * The delegating workbench editor service can be used to override the behaviour of the openEditor()
     * method by providing a IEditorOpenHandler.
     */
    let DelegatingEditorService = class DelegatingEditorService extends EditorService {
        constructor(editorGroupService, untitledEditorService, instantiationService, labelService, fileService, configurationService) {
            super(editorGroupService, untitledEditorService, instantiationService, labelService, fileService, configurationService);
        }
        setEditorOpenHandler(handler) {
            this.editorOpenHandler = handler;
        }
        async doOpenEditor(group, editor, options) {
            if (!this.editorOpenHandler) {
                return super.doOpenEditor(group, editor, options);
            }
            const control = await this.editorOpenHandler((group, editor, options) => super.doOpenEditor(group, editor, options), group, editor, options);
            if (control) {
                return control; // the opening was handled, so return early
            }
            return super.doOpenEditor(group, editor, options);
        }
    };
    DelegatingEditorService = __decorate([
        __param(0, editorGroupsService_1.IEditorGroupsService),
        __param(1, untitledEditorService_1.IUntitledEditorService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, label_1.ILabelService),
        __param(4, files_1.IFileService),
        __param(5, configuration_1.IConfigurationService)
    ], DelegatingEditorService);
    exports.DelegatingEditorService = DelegatingEditorService;
    extensions_1.registerSingleton(editorService_1.IEditorService, EditorService);
});
//# sourceMappingURL=editorService.js.map