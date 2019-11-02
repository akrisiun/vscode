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
define(["require", "exports", "vs/workbench/common/editor/editorGroup", "vs/workbench/common/editor", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/base/browser/dom", "vs/platform/instantiation/common/serviceCollection", "vs/platform/contextkey/common/contextkey", "vs/base/browser/ui/progressbar/progressbar", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/common/theme", "vs/workbench/browser/parts/editor/tabsTitleControl", "vs/workbench/browser/parts/editor/editorControl", "vs/platform/progress/common/progress", "vs/workbench/services/progress/browser/editorProgressService", "vs/nls", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/platform/notification/common/notification", "vs/base/common/errorMessage", "vs/platform/telemetry/common/telemetry", "vs/base/common/async", "vs/base/browser/touch", "vs/workbench/browser/parts/editor/editor", "vs/workbench/services/untitled/common/untitledEditorService", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/keybinding/common/keybinding", "vs/base/common/actions", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/browser/parts/editor/noTabsTitleControl", "vs/platform/actions/common/actions", "vs/base/browser/mouseEvent", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/contextview/browser/contextView", "vs/base/common/errorsWithActions", "vs/base/common/types", "vs/base/common/hash", "vs/base/common/mime", "vs/base/common/resources", "vs/base/common/network", "vs/platform/editor/common/editor", "vs/platform/dialogs/common/dialogs", "vs/css!./media/editorgroupview"], function (require, exports, editorGroup_1, editor_1, event_1, instantiation_1, dom_1, serviceCollection_1, contextkey_1, progressbar_1, styler_1, themeService_1, colorRegistry_1, theme_1, tabsTitleControl_1, editorControl_1, progress_1, editorProgressService_1, nls_1, errors_1, lifecycle_1, notification_1, errorMessage_1, telemetry_1, async_1, touch_1, editor_2, untitledEditorService_1, actionbar_1, keybinding_1, actions_1, editorCommands_1, noTabsTitleControl_1, actions_2, mouseEvent_1, menuEntryActionViewItem_1, contextView_1, errorsWithActions_1, types_1, hash_1, mime_1, resources_1, network_1, editor_3, dialogs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let EditorGroupView = class EditorGroupView extends theme_1.Themable {
        constructor(accessor, from, _index, instantiationService, contextKeyService, themeService, notificationService, dialogService, telemetryService, untitledEditorService, keybindingService, menuService, contextMenuService) {
            super(themeService);
            this.accessor = accessor;
            this._index = _index;
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.notificationService = notificationService;
            this.dialogService = dialogService;
            this.telemetryService = telemetryService;
            this.untitledEditorService = untitledEditorService;
            this.keybindingService = keybindingService;
            this.menuService = menuService;
            this.contextMenuService = contextMenuService;
            //#endregion
            //#region events
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onWillDispose = this._register(new event_1.Emitter());
            this.onWillDispose = this._onWillDispose.event;
            this._onDidGroupChange = this._register(new event_1.Emitter());
            this.onDidGroupChange = this._onDidGroupChange.event;
            this._onWillOpenEditor = this._register(new event_1.Emitter());
            this.onWillOpenEditor = this._onWillOpenEditor.event;
            this._onDidOpenEditorFail = this._register(new event_1.Emitter());
            this.onDidOpenEditorFail = this._onDidOpenEditorFail.event;
            this._onWillCloseEditor = this._register(new event_1.Emitter());
            this.onWillCloseEditor = this._onWillCloseEditor.event;
            this._onDidCloseEditor = this._register(new event_1.Emitter());
            this.onDidCloseEditor = this._onDidCloseEditor.event;
            this._disposed = false;
            this.isRestored = false;
            this.mapEditorToPendingConfirmation = new Map();
            //#endregion
            //#region ISerializableView
            this.element = document.createElement('div');
            this._onDidChange = this._register(new event_1.Relay());
            this.onDidChange = this._onDidChange.event;
            if (from instanceof EditorGroupView) {
                this._group = this._register(from.group.clone());
            }
            else if (editorGroup_1.isSerializedEditorGroup(from)) {
                this._group = this._register(instantiationService.createInstance(editorGroup_1.EditorGroup, from));
            }
            else {
                this._group = this._register(instantiationService.createInstance(editorGroup_1.EditorGroup, undefined));
            }
            this.disposedEditorsWorker = this._register(new async_1.RunOnceWorker(editors => this.handleDisposedEditors(editors), 0));
            //#region create()
            {
                // Container
                dom_1.addClasses(this.element, 'editor-group-container');
                // Container listeners
                this.registerContainerListeners();
                // Container toolbar
                this.createContainerToolbar();
                // Container context menu
                this.createContainerContextMenu();
                // Letterpress container
                const letterpressContainer = document.createElement('div');
                dom_1.addClass(letterpressContainer, 'editor-group-letterpress');
                this.element.appendChild(letterpressContainer);
                // Progress bar
                this.progressBar = this._register(new progressbar_1.ProgressBar(this.element));
                this._register(styler_1.attachProgressBarStyler(this.progressBar, this.themeService));
                this.progressBar.hide();
                // Scoped services
                const scopedContextKeyService = this._register(this.contextKeyService.createScoped(this.element));
                this.scopedInstantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, scopedContextKeyService], [progress_1.IEditorProgressService, new editorProgressService_1.EditorProgressService(this.progressBar)]));
                // Context keys
                this.handleGroupContextKeys(scopedContextKeyService);
                // Title container
                this.titleContainer = document.createElement('div');
                dom_1.addClass(this.titleContainer, 'title');
                this.element.appendChild(this.titleContainer);
                // Title control
                this.titleAreaControl = this.createTitleAreaControl();
                // Editor container
                this.editorContainer = document.createElement('div');
                dom_1.addClass(this.editorContainer, 'editor-container');
                this.element.appendChild(this.editorContainer);
                // Editor control
                this.editorControl = this._register(this.scopedInstantiationService.createInstance(editorControl_1.EditorControl, this.editorContainer, this));
                this._onDidChange.input = this.editorControl.onDidSizeConstraintsChange;
                // Track Focus
                this.doTrackFocus();
                // Update containers
                this.updateTitleContainer();
                this.updateContainer();
                // Update styles
                this.updateStyles();
            }
            //#endregion
            this._whenRestored = this.restoreEditors(from);
            this._whenRestored.then(() => this.isRestored = true);
            this.registerListeners();
        }
        //#region factory
        static createNew(accessor, index, instantiationService) {
            return instantiationService.createInstance(EditorGroupView, accessor, null, index);
        }
        static createFromSerialized(serialized, accessor, index, instantiationService) {
            return instantiationService.createInstance(EditorGroupView, accessor, serialized, index);
        }
        static createCopy(copyFrom, accessor, index, instantiationService) {
            return instantiationService.createInstance(EditorGroupView, accessor, copyFrom, index);
        }
        handleGroupContextKeys(contextKeyService) {
            const groupActiveEditorDirtyContextKey = editor_1.EditorGroupActiveEditorDirtyContext.bindTo(contextKeyService);
            const groupEditorsCountContext = editor_1.EditorGroupEditorsCountContext.bindTo(contextKeyService);
            let activeEditorListener = new lifecycle_1.MutableDisposable();
            const observeActiveEditor = () => {
                activeEditorListener.clear();
                const activeEditor = this._group.activeEditor;
                if (activeEditor) {
                    groupActiveEditorDirtyContextKey.set(activeEditor.isDirty());
                    activeEditorListener.value = activeEditor.onDidChangeDirty(() => groupActiveEditorDirtyContextKey.set(activeEditor.isDirty()));
                }
                else {
                    groupActiveEditorDirtyContextKey.set(false);
                }
            };
            // Update group contexts based on group changes
            this._register(this.onDidGroupChange(e => {
                // Track the active editor and update context key that reflects
                // the dirty state of this editor
                if (e.kind === 5 /* EDITOR_ACTIVE */) {
                    observeActiveEditor();
                }
                // Group editors count context
                groupEditorsCountContext.set(this.count);
            }));
            observeActiveEditor();
        }
        registerContainerListeners() {
            // Open new file via doubleclick on empty container
            this._register(dom_1.addDisposableListener(this.element, dom_1.EventType.DBLCLICK, e => {
                if (this.isEmpty) {
                    dom_1.EventHelper.stop(e);
                    this.openEditor(this.untitledEditorService.createOrGet(), editor_1.EditorOptions.create({ pinned: true }));
                }
            }));
            // Close empty editor group via middle mouse click
            this._register(dom_1.addDisposableListener(this.element, dom_1.EventType.MOUSE_UP, e => {
                if (this.isEmpty && e.button === 1 /* Middle Button */) {
                    dom_1.EventHelper.stop(e);
                    this.accessor.removeGroup(this);
                }
            }));
        }
        createContainerToolbar() {
            // Toolbar Container
            const toolbarContainer = document.createElement('div');
            dom_1.addClass(toolbarContainer, 'editor-group-container-toolbar');
            this.element.appendChild(toolbarContainer);
            // Toolbar
            const groupId = this._group.id;
            const containerToolbar = this._register(new actionbar_1.ActionBar(toolbarContainer, {
                ariaLabel: nls_1.localize('araLabelGroupActions', "Editor group actions"), actionRunner: this._register(new class extends actions_1.ActionRunner {
                    run(action) {
                        return action.run(groupId);
                    }
                })
            }));
            // Toolbar actions
            const removeGroupAction = this._register(new actions_1.Action(editorCommands_1.CLOSE_EDITOR_GROUP_COMMAND_ID, nls_1.localize('closeGroupAction', "Close"), 'codicon-close', true, () => {
                this.accessor.removeGroup(this);
                return Promise.resolve(true);
            }));
            const keybinding = this.keybindingService.lookupKeybinding(removeGroupAction.id);
            containerToolbar.push(removeGroupAction, { icon: true, label: false, keybinding: keybinding ? keybinding.getLabel() : undefined });
        }
        createContainerContextMenu() {
            const menu = this._register(this.menuService.createMenu(10 /* EmptyEditorGroupContext */, this.contextKeyService));
            this._register(dom_1.addDisposableListener(this.element, dom_1.EventType.CONTEXT_MENU, event => this.onShowContainerContextMenu(menu, event)));
            this._register(dom_1.addDisposableListener(this.element, touch_1.EventType.Contextmenu, event => this.onShowContainerContextMenu(menu)));
        }
        onShowContainerContextMenu(menu, e) {
            if (!this.isEmpty) {
                return; // only for empty editor groups
            }
            // Find target anchor
            let anchor = this.element;
            if (e instanceof MouseEvent) {
                const event = new mouseEvent_1.StandardMouseEvent(e);
                anchor = { x: event.posx, y: event.posy };
            }
            // Fill in contributed actions
            const actions = [];
            const actionsDisposable = menuEntryActionViewItem_1.createAndFillInContextMenuActions(menu, undefined, actions, this.contextMenuService);
            // Show it
            this.contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                getActions: () => actions,
                onHide: () => {
                    this.focus();
                    lifecycle_1.dispose(actionsDisposable);
                }
            });
        }
        doTrackFocus() {
            // Container
            const containerFocusTracker = this._register(dom_1.trackFocus(this.element));
            this._register(containerFocusTracker.onDidFocus(() => {
                if (this.isEmpty) {
                    this._onDidFocus.fire(); // only when empty to prevent accident focus
                }
            }));
            // Title Container
            const handleTitleClickOrTouch = (e) => {
                let target;
                if (e instanceof MouseEvent) {
                    if (e.button !== 0) {
                        return undefined; // only for left mouse click
                    }
                    target = e.target;
                }
                else {
                    target = e.initialTarget;
                }
                if (dom_1.findParentWithClass(target, 'monaco-action-bar', this.titleContainer) ||
                    dom_1.findParentWithClass(target, 'monaco-breadcrumb-item', this.titleContainer)) {
                    return; // not when clicking on actions or breadcrumbs
                }
                // timeout to keep focus in editor after mouse up
                setTimeout(() => {
                    this.focus();
                });
            };
            this._register(dom_1.addDisposableListener(this.titleContainer, dom_1.EventType.MOUSE_DOWN, e => handleTitleClickOrTouch(e)));
            this._register(dom_1.addDisposableListener(this.titleContainer, touch_1.EventType.Tap, e => handleTitleClickOrTouch(e)));
            // Editor Container
            this._register(this.editorControl.onDidFocus(() => {
                this._onDidFocus.fire();
            }));
        }
        updateContainer() {
            // Empty Container: add some empty container attributes
            if (this.isEmpty) {
                dom_1.addClass(this.element, 'empty');
                this.element.tabIndex = 0;
                this.element.setAttribute('aria-label', nls_1.localize('emptyEditorGroup', "{0} (empty)", this.label));
            }
            // Non-Empty Container: revert empty container attributes
            else {
                dom_1.removeClass(this.element, 'empty');
                this.element.removeAttribute('tabIndex');
                this.element.removeAttribute('aria-label');
            }
            // Update styles
            this.updateStyles();
        }
        updateTitleContainer() {
            dom_1.toggleClass(this.titleContainer, 'tabs', this.accessor.partOptions.showTabs);
            dom_1.toggleClass(this.titleContainer, 'show-file-icons', this.accessor.partOptions.showIcons);
        }
        createTitleAreaControl() {
            // Clear old if existing
            if (this.titleAreaControl) {
                this.titleAreaControl.dispose();
                dom_1.clearNode(this.titleContainer);
            }
            // Create new based on options
            if (this.accessor.partOptions.showTabs) {
                this.titleAreaControl = this.scopedInstantiationService.createInstance(tabsTitleControl_1.TabsTitleControl, this.titleContainer, this.accessor, this);
            }
            else {
                this.titleAreaControl = this.scopedInstantiationService.createInstance(noTabsTitleControl_1.NoTabsTitleControl, this.titleContainer, this.accessor, this);
            }
            return this.titleAreaControl;
        }
        async restoreEditors(from) {
            if (this._group.count === 0) {
                return; // nothing to show
            }
            // Determine editor options
            let options;
            if (from instanceof EditorGroupView) {
                options = editor_2.getActiveTextEditorOptions(from); // if we copy from another group, ensure to copy its active editor viewstate
            }
            else {
                options = new editor_1.EditorOptions();
            }
            const activeEditor = this._group.activeEditor;
            if (!activeEditor) {
                return;
            }
            options.pinned = this._group.isPinned(activeEditor); // preserve pinned state
            options.preserveFocus = true; // handle focus after editor is opened
            const activeElement = document.activeElement;
            // Show active editor
            await this.doShowEditor(activeEditor, true, options);
            // Set focused now if this is the active group and focus has
            // not changed meanwhile. This prevents focus from being
            // stolen accidentally on startup when the user already
            // clicked somewhere.
            if (this.accessor.activeGroup === this && activeElement === document.activeElement) {
                this.focus();
            }
        }
        //#region event handling
        registerListeners() {
            // Model Events
            this._register(this._group.onDidEditorPin(editor => this.onDidEditorPin(editor)));
            this._register(this._group.onDidEditorOpen(editor => this.onDidEditorOpen(editor)));
            this._register(this._group.onDidEditorClose(editor => this.onDidEditorClose(editor)));
            this._register(this._group.onDidEditorDispose(editor => this.onDidEditorDispose(editor)));
            this._register(this._group.onDidEditorBecomeDirty(editor => this.onDidEditorBecomeDirty(editor)));
            this._register(this._group.onDidEditorLabelChange(editor => this.onDidEditorLabelChange(editor)));
            // Option Changes
            this._register(this.accessor.onDidEditorPartOptionsChange(e => this.onDidEditorPartOptionsChange(e)));
            // Visibility
            this._register(this.accessor.onDidVisibilityChange(e => this.onDidVisibilityChange(e)));
        }
        onDidEditorPin(editor) {
            // Event
            this._onDidGroupChange.fire({ kind: 7 /* EDITOR_PIN */, editor });
        }
        onDidEditorOpen(editor) {
            /* __GDPR__
                "editorOpened" : {
                    "${include}": [
                        "${EditorTelemetryDescriptor}"
                    ]
                }
            */
            this.telemetryService.publicLog('editorOpened', this.toEditorTelemetryDescriptor(editor));
            // Update container
            this.updateContainer();
            // Event
            this._onDidGroupChange.fire({ kind: 2 /* EDITOR_OPEN */, editor });
        }
        onDidEditorClose(event) {
            // Before close
            this._onWillCloseEditor.fire(event);
            // Handle event
            const editor = event.editor;
            const editorsToClose = [editor];
            // Include both sides of side by side editors when being closed and not opened multiple times
            if (editor instanceof editor_1.SideBySideEditorInput && !this.accessor.groups.some(groupView => groupView.group.contains(editor))) {
                editorsToClose.push(editor.master, editor.details);
            }
            // Close the editor when it is no longer open in any group including diff editors
            editorsToClose.forEach(editorToClose => {
                const resource = editorToClose ? editorToClose.getResource() : undefined; // prefer resource to not close right-hand side editors of a diff editor
                if (!this.accessor.groups.some(groupView => groupView.group.contains(resource || editorToClose))) {
                    editorToClose.close();
                }
            });
            /* __GDPR__
                "editorClosed" : {
                    "${include}": [
                        "${EditorTelemetryDescriptor}"
                    ]
                }
            */
            this.telemetryService.publicLog('editorClosed', this.toEditorTelemetryDescriptor(event.editor));
            // Update container
            this.updateContainer();
            // Event
            this._onDidCloseEditor.fire(event);
            this._onDidGroupChange.fire({ kind: 3 /* EDITOR_CLOSE */, editor, editorIndex: event.index });
        }
        toEditorTelemetryDescriptor(editor) {
            const descriptor = editor.getTelemetryDescriptor();
            const resource = editor.getResource();
            const path = resource ? resource.scheme === network_1.Schemas.file ? resource.fsPath : resource.path : undefined;
            if (resource && path) {
                descriptor['resource'] = { mimeType: mime_1.guessMimeTypes(resource).join(', '), scheme: resource.scheme, ext: resources_1.extname(resource), path: hash_1.hash(path) };
                /* __GDPR__FRAGMENT__
                    "EditorTelemetryDescriptor" : {
                        "resource": { "${inline}": [ "${URIDescriptor}" ] }
                    }
                */
                return descriptor;
            }
            return descriptor;
        }
        onDidEditorDispose(editor) {
            // To prevent race conditions, we handle disposed editors in our worker with a timeout
            // because it can happen that an input is being disposed with the intent to replace
            // it with some other input right after.
            this.disposedEditorsWorker.work(editor);
        }
        handleDisposedEditors(editors) {
            // Split between visible and hidden editors
            let activeEditor;
            const inactiveEditors = [];
            editors.forEach(editor => {
                if (this._group.isActive(editor)) {
                    activeEditor = editor;
                }
                else if (this._group.contains(editor)) {
                    inactiveEditors.push(editor);
                }
            });
            // Close all inactive editors first to prevent UI flicker
            inactiveEditors.forEach(hidden => this.doCloseEditor(hidden, false));
            // Close active one last
            if (activeEditor) {
                this.doCloseEditor(activeEditor, false);
            }
        }
        onDidEditorPartOptionsChange(event) {
            // Title container
            this.updateTitleContainer();
            // Title control Switch between showing tabs <=> not showing tabs
            if (event.oldPartOptions.showTabs !== event.newPartOptions.showTabs) {
                // Recreate and layout control
                this.createTitleAreaControl();
                if (this.dimension) {
                    this.layoutTitleAreaControl(this.dimension.width);
                }
                // Ensure to show active editor if any
                if (this._group.activeEditor) {
                    this.titleAreaControl.openEditor(this._group.activeEditor);
                }
            }
            // Just update title control
            else {
                this.titleAreaControl.updateOptions(event.oldPartOptions, event.newPartOptions);
            }
            // Styles
            this.updateStyles();
            // Pin preview editor once user disables preview
            if (event.oldPartOptions.enablePreview && !event.newPartOptions.enablePreview) {
                if (this._group.previewEditor) {
                    this.pinEditor(this._group.previewEditor);
                }
            }
        }
        onDidEditorBecomeDirty(editor) {
            // Always show dirty editors pinned
            this.pinEditor(editor);
            // Forward to title control
            this.titleAreaControl.updateEditorDirty(editor);
            // Event
            this._onDidGroupChange.fire({ kind: 8 /* EDITOR_DIRTY */, editor });
        }
        onDidEditorLabelChange(editor) {
            // Forward to title control
            this.titleAreaControl.updateEditorLabel(editor);
            // Event
            this._onDidGroupChange.fire({ kind: 6 /* EDITOR_LABEL */, editor });
        }
        onDidVisibilityChange(visible) {
            // Forward to editor control
            this.editorControl.setVisible(visible);
        }
        //#endregion
        //region IEditorGroupView
        get group() {
            return this._group;
        }
        get index() {
            return this._index;
        }
        get label() {
            return nls_1.localize('groupLabel', "Group {0}", this._index + 1);
        }
        get disposed() {
            return this._disposed;
        }
        get whenRestored() {
            return this._whenRestored;
        }
        get isEmpty() {
            return this._group.count === 0;
        }
        get isMinimized() {
            if (!this.dimension) {
                return false;
            }
            return this.dimension.width === this.minimumWidth || this.dimension.height === this.minimumHeight;
        }
        notifyIndexChanged(newIndex) {
            if (this._index !== newIndex) {
                this._index = newIndex;
                this._onDidGroupChange.fire({ kind: 1 /* GROUP_INDEX */ });
            }
        }
        setActive(isActive) {
            this.active = isActive;
            // Update container
            dom_1.toggleClass(this.element, 'active', isActive);
            dom_1.toggleClass(this.element, 'inactive', !isActive);
            // Update title control
            this.titleAreaControl.setActive(isActive);
            // Update styles
            this.updateStyles();
            // Event
            this._onDidGroupChange.fire({ kind: 0 /* GROUP_ACTIVE */ });
        }
        //#endregion
        //#region IEditorGroup
        //#region basics()
        get id() {
            return this._group.id;
        }
        get editors() {
            return this._group.getEditors();
        }
        get count() {
            return this._group.count;
        }
        get activeControl() {
            return this.editorControl ? types_1.withNullAsUndefined(this.editorControl.activeControl) : undefined;
        }
        get activeEditor() {
            return this._group.activeEditor;
        }
        get previewEditor() {
            return this._group.previewEditor;
        }
        isPinned(editor) {
            return this._group.isPinned(editor);
        }
        isActive(editor) {
            return this._group.isActive(editor);
        }
        getEditors(order) {
            if (order === 0 /* MOST_RECENTLY_ACTIVE */) {
                return this._group.getEditors(true);
            }
            return this.editors;
        }
        getEditor(index) {
            return this._group.getEditor(index);
        }
        getIndexOfEditor(editor) {
            return this._group.indexOf(editor);
        }
        isOpened(editor) {
            return this._group.contains(editor);
        }
        focus() {
            // Pass focus to widgets
            if (this.activeControl) {
                this.activeControl.focus();
            }
            else {
                this.element.focus();
            }
            // Event
            this._onDidFocus.fire();
        }
        pinEditor(editor = this.activeEditor || undefined) {
            if (editor && !this._group.isPinned(editor)) {
                // Update model
                this._group.pin(editor);
                // Forward to title control
                this.titleAreaControl.pinEditor(editor);
            }
        }
        invokeWithinContext(fn) {
            return this.scopedInstantiationService.invokeFunction(fn);
        }
        //#endregion
        //#region openEditor()
        async openEditor(editor, options) {
            // Guard against invalid inputs
            if (!editor) {
                return Promise.resolve(null);
            }
            // Editor opening event allows for prevention
            const event = new EditorOpeningEvent(this._group.id, editor, options);
            this._onWillOpenEditor.fire(event);
            const prevented = event.isPrevented();
            if (prevented) {
                return types_1.withUndefinedAsNull(await prevented());
            }
            // Proceed with opening
            return types_1.withUndefinedAsNull(await this.doOpenEditor(editor, options));
        }
        doOpenEditor(editor, options) {
            var _a, _b, _c, _d, _e;
            // Determine options
            const openEditorOptions = {
                index: options ? options.index : undefined,
                pinned: !this.accessor.partOptions.enablePreview || editor.isDirty() || ((_a = options) === null || _a === void 0 ? void 0 : _a.pinned) || typeof ((_b = options) === null || _b === void 0 ? void 0 : _b.index) === 'number',
                active: this._group.count === 0 || !options || !options.inactive
            };
            if (!openEditorOptions.active && !openEditorOptions.pinned && this._group.activeEditor && this._group.isPreview(this._group.activeEditor)) {
                // Special case: we are to open an editor inactive and not pinned, but the current active
                // editor is also not pinned, which means it will get replaced with this one. As such,
                // the editor can only be active.
                openEditorOptions.active = true;
            }
            let activateGroup = false;
            let restoreGroup = false;
            if (((_c = options) === null || _c === void 0 ? void 0 : _c.activation) === editor_3.EditorActivation.ACTIVATE) {
                // Respect option to force activate an editor group.
                activateGroup = true;
            }
            else if (((_d = options) === null || _d === void 0 ? void 0 : _d.activation) === editor_3.EditorActivation.RESTORE) {
                // Respect option to force restore an editor group.
                restoreGroup = true;
            }
            else if (((_e = options) === null || _e === void 0 ? void 0 : _e.activation) === editor_3.EditorActivation.PRESERVE) {
                // Respect option to preserve active editor group.
                activateGroup = false;
                restoreGroup = false;
            }
            else if (openEditorOptions.active) {
                // Finally, we only activate/restore an editor which is
                // opening as active editor.
                // If preserveFocus is enabled, we only restore but never
                // activate the group.
                activateGroup = !options || !options.preserveFocus;
                restoreGroup = !activateGroup;
            }
            // Do this before we open the editor in the group to prevent a false
            // active editor change event before the editor is loaded
            // (see https://github.com/Microsoft/vscode/issues/51679)
            if (activateGroup) {
                this.accessor.activateGroup(this);
            }
            else if (restoreGroup) {
                this.accessor.restoreGroup(this);
            }
            // Actually move the editor if a specific index is provided and we figure
            // out that the editor is already opened at a different index. This
            // ensures the right set of events are fired to the outside.
            if (typeof openEditorOptions.index === 'number') {
                const indexOfEditor = this._group.indexOf(editor);
                if (indexOfEditor !== -1 && indexOfEditor !== openEditorOptions.index) {
                    this.doMoveEditorInsideGroup(editor, openEditorOptions);
                }
            }
            // Update model
            this._group.openEditor(editor, openEditorOptions);
            // Show editor
            return this.doShowEditor(editor, !!openEditorOptions.active, options);
        }
        async doShowEditor(editor, active, options) {
            // Show in editor control if the active editor changed
            let openEditorPromise;
            if (active) {
                openEditorPromise = (async () => {
                    try {
                        const result = await this.editorControl.openEditor(editor, options);
                        // Editor change event
                        if (result.editorChanged) {
                            this._onDidGroupChange.fire({ kind: 5 /* EDITOR_ACTIVE */, editor });
                        }
                        return result.control;
                    }
                    catch (error) {
                        // Handle errors but do not bubble them up
                        this.doHandleOpenEditorError(error, editor, options);
                        return undefined; // error: return undefined as result to signal this
                    }
                })();
            }
            else {
                openEditorPromise = Promise.resolve(undefined); // inactive: return undefined as result to signal this
            }
            // Show in title control after editor control because some actions depend on it
            this.titleAreaControl.openEditor(editor);
            return openEditorPromise;
        }
        async doHandleOpenEditorError(error, editor, options) {
            var _a;
            // Report error only if this was not us restoring previous error state or
            // we are told to ignore errors that occur from opening an editor
            if (this.isRestored && !errors_1.isPromiseCanceledError(error) && (!options || !options.ignoreError)) {
                // Extract possible error actions from the error
                let errorActions = undefined;
                if (errorsWithActions_1.isErrorWithActions(error)) {
                    errorActions = error.actions;
                }
                // If the context is USER, we try to show a modal dialog instead of a background notification
                if (((_a = options) === null || _a === void 0 ? void 0 : _a.context) === editor_3.EditorOpenContext.USER) {
                    const buttons = [];
                    if (Array.isArray(errorActions) && errorActions.length > 0) {
                        errorActions.forEach(action => buttons.push(action.label));
                    }
                    else {
                        buttons.push(nls_1.localize('ok', 'OK'));
                    }
                    let cancelId = undefined;
                    if (buttons.length === 1) {
                        buttons.push(nls_1.localize('cancel', "Cancel"));
                        cancelId = 1;
                    }
                    const result = await this.dialogService.show(notification_1.Severity.Error, nls_1.localize('editorOpenErrorDialog', "Unable to open '{0}'", editor.getName()), buttons, {
                        detail: errorMessage_1.toErrorMessage(error),
                        cancelId
                    });
                    // Make sure to run any error action if present
                    if (result.choice !== cancelId && Array.isArray(errorActions)) {
                        const errorAction = errorActions[result.choice];
                        if (errorAction) {
                            errorAction.run();
                        }
                    }
                }
                // Otherwise, show a background notification.
                else {
                    const actions = { primary: [] };
                    if (Array.isArray(errorActions)) {
                        actions.primary = errorActions;
                    }
                    const handle = this.notificationService.notify({
                        severity: notification_1.Severity.Error,
                        message: nls_1.localize('editorOpenError', "Unable to open '{0}': {1}.", editor.getName(), errorMessage_1.toErrorMessage(error)),
                        actions
                    });
                    event_1.Event.once(handle.onDidClose)(() => actions.primary && lifecycle_1.dispose(actions.primary));
                }
            }
            // Event
            this._onDidOpenEditorFail.fire(editor);
            // Recover by closing the active editor (if the input is still the active one)
            if (this.activeEditor === editor) {
                const focusNext = !options || !options.preserveFocus;
                this.doCloseEditor(editor, focusNext, true /* from error */);
            }
        }
        //#endregion
        //#region openEditors()
        async openEditors(editors) {
            if (!editors.length) {
                return null;
            }
            // Do not modify original array
            editors = editors.slice(0);
            // Use the first editor as active editor
            const { editor, options } = editors.shift();
            let firstOpenedEditor = await this.openEditor(editor, options);
            // Open the other ones inactive
            const startingIndex = this.getIndexOfEditor(editor) + 1;
            await Promise.all(editors.map(async ({ editor, options }, index) => {
                const adjustedEditorOptions = options || new editor_1.EditorOptions();
                adjustedEditorOptions.inactive = true;
                adjustedEditorOptions.pinned = true;
                adjustedEditorOptions.index = startingIndex + index;
                const openedEditor = await this.openEditor(editor, adjustedEditorOptions);
                if (!firstOpenedEditor) {
                    firstOpenedEditor = openedEditor; // only take if the first editor opening failed
                }
            }));
            return firstOpenedEditor;
        }
        //#endregion
        //#region moveEditor()
        moveEditor(editor, target, options) {
            // Move within same group
            if (this === target) {
                this.doMoveEditorInsideGroup(editor, options);
            }
            // Move across groups
            else {
                this.doMoveOrCopyEditorAcrossGroups(editor, target, options);
            }
        }
        doMoveEditorInsideGroup(editor, moveOptions) {
            const moveToIndex = moveOptions ? moveOptions.index : undefined;
            if (typeof moveToIndex !== 'number') {
                return; // do nothing if we move into same group without index
            }
            const currentIndex = this._group.indexOf(editor);
            if (currentIndex === moveToIndex) {
                return; // do nothing if editor is already at the given index
            }
            // Update model
            this._group.moveEditor(editor, moveToIndex);
            this._group.pin(editor);
            // Forward to title area
            this.titleAreaControl.moveEditor(editor, currentIndex, moveToIndex);
            this.titleAreaControl.pinEditor(editor);
            // Event
            this._onDidGroupChange.fire({ kind: 4 /* EDITOR_MOVE */, editor });
        }
        doMoveOrCopyEditorAcrossGroups(editor, target, moveOptions = Object.create(null), keepCopy) {
            // When moving an editor, try to preserve as much view state as possible by checking
            // for the editor to be a text editor and creating the options accordingly if so
            const options = editor_2.getActiveTextEditorOptions(this, editor, editor_1.EditorOptions.create(moveOptions));
            options.pinned = true; // always pin moved editor
            // A move to another group is an open first...
            target.openEditor(editor, options);
            // ...and a close afterwards (unless we copy)
            if (!keepCopy) {
                this.doCloseEditor(editor, false /* do not focus next one behind if any */);
            }
        }
        //#endregion
        //#region copyEditor()
        copyEditor(editor, target, options) {
            // Move within same group because we do not support to show the same editor
            // multiple times in the same group
            if (this === target) {
                this.doMoveEditorInsideGroup(editor, options);
            }
            // Copy across groups
            else {
                this.doMoveOrCopyEditorAcrossGroups(editor, target, options, true);
            }
        }
        //#endregion
        //#region closeEditor()
        async closeEditor(editor = this.activeEditor || undefined, options) {
            var _a;
            if (!editor) {
                return;
            }
            // Check for dirty and veto
            const veto = await this.handleDirty([editor]);
            if (veto) {
                return;
            }
            // Do close
            this.doCloseEditor(editor, ((_a = options) === null || _a === void 0 ? void 0 : _a.preserveFocus) ? false : undefined);
        }
        doCloseEditor(editor, focusNext = (this.accessor.activeGroup === this), fromError) {
            // Closing the active editor of the group is a bit more work
            if (this._group.isActive(editor)) {
                this.doCloseActiveEditor(focusNext, fromError);
            }
            // Closing inactive editor is just a model update
            else {
                this.doCloseInactiveEditor(editor);
            }
            // Forward to title control
            this.titleAreaControl.closeEditor(editor);
        }
        doCloseActiveEditor(focusNext = (this.accessor.activeGroup === this), fromError) {
            const editorToClose = this.activeEditor;
            const restoreFocus = this.shouldRestoreFocus(this.element);
            // Optimization: if we are about to close the last editor in this group and settings
            // are configured to close the group since it will be empty, we first set the last
            // active group as empty before closing the editor. This reduces the amount of editor
            // change events that this operation emits and will reduce flicker. Without this
            // optimization, this group (if active) would first trigger a active editor change
            // event because it became empty, only to then trigger another one when the next
            // group gets active.
            const closeEmptyGroup = this.accessor.partOptions.closeEmptyGroups;
            if (closeEmptyGroup && this.active && this._group.count === 1) {
                const mostRecentlyActiveGroups = this.accessor.getGroups(1 /* MOST_RECENTLY_ACTIVE */);
                const nextActiveGroup = mostRecentlyActiveGroups[1]; // [0] will be the current one, so take [1]
                if (nextActiveGroup) {
                    if (restoreFocus) {
                        nextActiveGroup.focus();
                    }
                    else {
                        this.accessor.activateGroup(nextActiveGroup);
                    }
                }
            }
            // Update model
            if (editorToClose) {
                this._group.closeEditor(editorToClose);
            }
            // Open next active if there are more to show
            const nextActiveEditor = this._group.activeEditor;
            if (nextActiveEditor) {
                const options = editor_1.EditorOptions.create({ preserveFocus: !focusNext });
                // When closing an editor due to an error we can end up in a loop where we continue closing
                // editors that fail to open (e.g. when the file no longer exists). We do not want to show
                // repeated errors in this case to the user. As such, if we open the next editor and we are
                // in a scope of a previous editor failing, we silence the input errors until the editor is
                // opened by setting ignoreError: true.
                if (fromError) {
                    options.ignoreError = true;
                }
                this.openEditor(nextActiveEditor, options);
            }
            // Otherwise we are empty, so clear from editor control and send event
            else {
                // Forward to editor control
                if (editorToClose) {
                    this.editorControl.closeEditor(editorToClose);
                }
                // Restore focus to group container as needed unless group gets closed
                if (restoreFocus && !closeEmptyGroup) {
                    this.focus();
                }
                // Events
                this._onDidGroupChange.fire({ kind: 5 /* EDITOR_ACTIVE */ });
                // Remove empty group if we should
                if (closeEmptyGroup) {
                    this.accessor.removeGroup(this);
                }
            }
        }
        shouldRestoreFocus(target) {
            const activeElement = document.activeElement;
            if (activeElement === document.body) {
                return true; // always restore focus if nothing is focused currently
            }
            // otherwise check for the active element being an ancestor of the target
            return dom_1.isAncestor(activeElement, target);
        }
        doCloseInactiveEditor(editor) {
            // Update model
            this._group.closeEditor(editor);
        }
        async handleDirty(editors) {
            if (!editors.length) {
                return false; // no veto
            }
            const editor = editors.shift();
            // To prevent multiple confirmation dialogs from showing up one after the other
            // we check if a pending confirmation is currently showing and if so, join that
            let handleDirtyPromise = this.mapEditorToPendingConfirmation.get(editor);
            if (!handleDirtyPromise) {
                handleDirtyPromise = this.doHandleDirty(editor);
                this.mapEditorToPendingConfirmation.set(editor, handleDirtyPromise);
            }
            const veto = await handleDirtyPromise;
            // Make sure to remove from our map of cached pending confirmations
            this.mapEditorToPendingConfirmation.delete(editor);
            // Return for the first veto we got
            if (veto) {
                return veto;
            }
            // Otherwise continue with the remainders
            return this.handleDirty(editors);
        }
        async doHandleDirty(editor) {
            if (!editor.isDirty() || // editor must be dirty
                this.accessor.groups.some(groupView => groupView !== this && groupView.group.contains(editor, true /* support side by side */)) || // editor is opened in other group
                editor instanceof editor_1.SideBySideEditorInput && this.isOpened(editor.master) // side by side editor master is still opened
            ) {
                return false;
            }
            // Switch to editor that we want to handle and confirm to save/revert
            await this.openEditor(editor);
            const res = await editor.confirmSave();
            // It could be that the editor saved meanwhile, so we check again
            // to see if anything needs to happen before closing for good.
            // This can happen for example if autoSave: onFocusChange is configured
            // so that the save happens when the dialog opens.
            if (!editor.isDirty()) {
                return res === 2 /* CANCEL */ ? true : false;
            }
            // Otherwise, handle accordingly
            switch (res) {
                case 0 /* SAVE */:
                    const result = await editor.save();
                    return !result;
                case 1 /* DONT_SAVE */:
                    try {
                        // first try a normal revert where the contents of the editor are restored
                        const result = await editor.revert();
                        return !result;
                    }
                    catch (error) {
                        // if that fails, since we are about to close the editor, we accept that
                        // the editor cannot be reverted and instead do a soft revert that just
                        // enables us to close the editor. With this, a user can always close a
                        // dirty editor even when reverting fails.
                        const result = await editor.revert({ soft: true });
                        return !result;
                    }
                case 2 /* CANCEL */:
                    return true; // veto
            }
        }
        //#endregion
        //#region closeEditors()
        async closeEditors(args, options) {
            if (this.isEmpty) {
                return;
            }
            const editors = this.getEditorsToClose(args);
            // Check for dirty and veto
            const veto = await this.handleDirty(editors.slice(0));
            if (veto) {
                return;
            }
            // Do close
            this.doCloseEditors(editors, options);
        }
        getEditorsToClose(editors) {
            if (Array.isArray(editors)) {
                return editors;
            }
            const filter = editors;
            const hasDirection = typeof filter.direction === 'number';
            let editorsToClose = this._group.getEditors(!hasDirection /* in MRU order only if direction is not specified */);
            // Filter: saved only
            if (filter.savedOnly) {
                editorsToClose = editorsToClose.filter(e => !e.isDirty());
            }
            // Filter: direction (left / right)
            else if (hasDirection && filter.except) {
                editorsToClose = (filter.direction === 0 /* LEFT */) ?
                    editorsToClose.slice(0, this._group.indexOf(filter.except)) :
                    editorsToClose.slice(this._group.indexOf(filter.except) + 1);
            }
            // Filter: except
            else if (filter.except) {
                editorsToClose = editorsToClose.filter(e => !e.matches(filter.except));
            }
            return editorsToClose;
        }
        doCloseEditors(editors, options) {
            var _a;
            // Close all inactive editors first
            let closeActiveEditor = false;
            editors.forEach(editor => {
                if (!this.isActive(editor)) {
                    this.doCloseInactiveEditor(editor);
                }
                else {
                    closeActiveEditor = true;
                }
            });
            // Close active editor last if contained in editors list to close
            if (closeActiveEditor) {
                this.doCloseActiveEditor(((_a = options) === null || _a === void 0 ? void 0 : _a.preserveFocus) ? false : undefined);
            }
            // Forward to title control
            this.titleAreaControl.closeEditors(editors);
        }
        //#endregion
        //#region closeAllEditors()
        async closeAllEditors() {
            if (this.isEmpty) {
                // If the group is empty and the request is to close all editors, we still close
                // the editor group is the related setting to close empty groups is enabled for
                // a convenient way of removing empty editor groups for the user.
                if (this.accessor.partOptions.closeEmptyGroups) {
                    this.accessor.removeGroup(this);
                }
                return;
            }
            // Check for dirty and veto
            const editors = this._group.getEditors(true);
            const veto = await this.handleDirty(editors.slice(0));
            if (veto) {
                return;
            }
            // Do close
            this.doCloseAllEditors();
        }
        doCloseAllEditors() {
            // Close all inactive editors first
            this.editors.forEach(editor => {
                if (!this.isActive(editor)) {
                    this.doCloseInactiveEditor(editor);
                }
            });
            // Close active editor last
            this.doCloseActiveEditor();
            // Forward to title control
            this.titleAreaControl.closeAllEditors();
        }
        //#endregion
        //#region replaceEditors()
        async replaceEditors(editors) {
            // Extract active vs. inactive replacements
            let activeReplacement;
            const inactiveReplacements = [];
            editors.forEach(({ editor, replacement, options }) => {
                if (editor.isDirty()) {
                    return; // we do not handle dirty in this method, so ignore all dirty
                }
                const index = this.getIndexOfEditor(editor);
                if (index >= 0) {
                    const isActiveEditor = this.isActive(editor);
                    // make sure we respect the index of the editor to replace
                    if (options) {
                        options.index = index;
                    }
                    else {
                        options = editor_1.EditorOptions.create({ index });
                    }
                    options.inactive = !isActiveEditor;
                    options.pinned = true;
                    const editorToReplace = { editor, replacement, options };
                    if (isActiveEditor) {
                        activeReplacement = editorToReplace;
                    }
                    else {
                        inactiveReplacements.push(editorToReplace);
                    }
                }
            });
            // Handle inactive first
            inactiveReplacements.forEach(({ editor, replacement, options }) => {
                // Open inactive editor
                this.doOpenEditor(replacement, options);
                // Close replaced inactive editor unless they match
                if (!editor.matches(replacement)) {
                    this.doCloseInactiveEditor(editor);
                    this.titleAreaControl.closeEditor(editor);
                }
            });
            // Handle active last
            if (activeReplacement) {
                // Open replacement as active editor
                const openEditorResult = this.doOpenEditor(activeReplacement.replacement, activeReplacement.options);
                // Close replaced active editor unless they match
                if (!activeReplacement.editor.matches(activeReplacement.replacement)) {
                    this.doCloseInactiveEditor(activeReplacement.editor);
                    this.titleAreaControl.closeEditor(activeReplacement.editor);
                }
                await openEditorResult;
            }
        }
        //#endregion
        //#endregion
        //#region Themable
        updateStyles() {
            const isEmpty = this.isEmpty;
            // Container
            if (isEmpty) {
                this.element.style.backgroundColor = this.getColor(theme_1.EDITOR_GROUP_EMPTY_BACKGROUND) || '';
            }
            else {
                this.element.style.backgroundColor = '';
            }
            // Title control
            const { showTabs } = this.accessor.partOptions;
            const borderColor = this.getColor(theme_1.EDITOR_GROUP_HEADER_TABS_BORDER) || this.getColor(colorRegistry_1.contrastBorder);
            if (!isEmpty && showTabs && borderColor) {
                dom_1.addClass(this.titleContainer, 'title-border-bottom');
                this.titleContainer.style.setProperty('--title-border-bottom-color', borderColor.toString());
            }
            else {
                dom_1.removeClass(this.titleContainer, 'title-border-bottom');
                this.titleContainer.style.removeProperty('--title-border-bottom-color');
            }
            this.titleContainer.style.backgroundColor = this.getColor(showTabs ? theme_1.EDITOR_GROUP_HEADER_TABS_BACKGROUND : theme_1.EDITOR_GROUP_HEADER_NO_TABS_BACKGROUND) || '';
            // Editor container
            this.editorContainer.style.backgroundColor = this.getColor(colorRegistry_1.editorBackground) || '';
        }
        get minimumWidth() { return this.editorControl.minimumWidth; }
        get minimumHeight() { return this.editorControl.minimumHeight; }
        get maximumWidth() { return this.editorControl.maximumWidth; }
        get maximumHeight() { return this.editorControl.maximumHeight; }
        layout(width, height) {
            this.dimension = new dom_1.Dimension(width, height);
            // Ensure editor container gets height as CSS depending
            // on the preferred height of the title control
            this.editorContainer.style.height = `calc(100% - ${this.titleAreaControl.getPreferredHeight()}px)`;
            // Forward to controls
            this.layoutTitleAreaControl(width);
            this.editorControl.layout(new dom_1.Dimension(this.dimension.width, this.dimension.height - this.titleAreaControl.getPreferredHeight()));
        }
        layoutTitleAreaControl(width) {
            this.titleAreaControl.layout(new dom_1.Dimension(width, this.titleAreaControl.getPreferredHeight()));
        }
        relayout() {
            if (this.dimension) {
                const { width, height } = this.dimension;
                this.layout(width, height);
            }
        }
        toJSON() {
            return this._group.serialize();
        }
        //#endregion
        dispose() {
            this._disposed = true;
            this._onWillDispose.fire();
            this.titleAreaControl.dispose();
            super.dispose();
        }
    };
    EditorGroupView = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, themeService_1.IThemeService),
        __param(6, notification_1.INotificationService),
        __param(7, dialogs_1.IDialogService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, untitledEditorService_1.IUntitledEditorService),
        __param(10, keybinding_1.IKeybindingService),
        __param(11, actions_2.IMenuService),
        __param(12, contextView_1.IContextMenuService)
    ], EditorGroupView);
    exports.EditorGroupView = EditorGroupView;
    class EditorOpeningEvent {
        constructor(_group, _editor, _options) {
            this._group = _group;
            this._editor = _editor;
            this._options = _options;
            this.override = undefined;
        }
        get groupId() {
            return this._group;
        }
        get editor() {
            return this._editor;
        }
        get options() {
            return this._options;
        }
        prevent(callback) {
            this.override = callback;
        }
        isPrevented() {
            return this.override;
        }
    }
    themeService_1.registerThemingParticipant((theme, collector, environment) => {
        // Letterpress
        const letterpress = `./media/letterpress${theme.type === 'dark' ? '-dark' : theme.type === 'hc' ? '-hc' : ''}.svg`;
        collector.addRule(`
		.monaco-workbench .part.editor > .content .editor-group-container.empty .editor-group-letterpress {
			background-image: url('${require.toUrl(letterpress)}')
		}
	`);
        // Focused Empty Group Border
        const focusedEmptyGroupBorder = theme.getColor(theme_1.EDITOR_GROUP_FOCUSED_EMPTY_BORDER);
        if (focusedEmptyGroupBorder) {
            collector.addRule(`
			.monaco-workbench .part.editor > .content:not(.empty) .editor-group-container.empty.active:focus {
				outline-width: 1px;
				outline-color: ${focusedEmptyGroupBorder};
				outline-offset: -2px;
				outline-style: solid;
			}

			.monaco-workbench .part.editor > .content.empty .editor-group-container.empty.active:focus {
				outline: none; /* never show outline for empty group if it is the last */
			}
		`);
        }
        else {
            collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container.empty.active:focus {
				outline: none; /* disable focus outline unless active empty group border is defined */
			}
		`);
        }
    });
});
//# sourceMappingURL=editorGroupView.js.map