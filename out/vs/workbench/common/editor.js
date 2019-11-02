/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/objects", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey", "vs/platform/registry/common/platform", "vs/base/common/actions", "vs/base/common/arrays"], function (require, exports, event_1, objects_1, types_1, uri_1, lifecycle_1, instantiation_1, contextkey_1, platform_1, actions_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActiveEditorContext = new contextkey_1.RawContextKey('activeEditor', null);
    exports.ActiveEditorIsSaveableContext = new contextkey_1.RawContextKey('activeEditorIsSaveable', false);
    exports.EditorsVisibleContext = new contextkey_1.RawContextKey('editorIsOpen', false);
    exports.EditorPinnedContext = new contextkey_1.RawContextKey('editorPinned', false);
    exports.EditorGroupActiveEditorDirtyContext = new contextkey_1.RawContextKey('groupActiveEditorDirty', false);
    exports.EditorGroupEditorsCountContext = new contextkey_1.RawContextKey('groupEditorsCount', 0);
    exports.NoEditorsVisibleContext = exports.EditorsVisibleContext.toNegated();
    exports.TextCompareEditorVisibleContext = new contextkey_1.RawContextKey('textCompareEditorVisible', false);
    exports.TextCompareEditorActiveContext = new contextkey_1.RawContextKey('textCompareEditorActive', false);
    exports.ActiveEditorGroupEmptyContext = new contextkey_1.RawContextKey('activeEditorGroupEmpty', false);
    exports.ActiveEditorGroupIndexContext = new contextkey_1.RawContextKey('activeEditorGroupIndex', 0);
    exports.ActiveEditorGroupLastContext = new contextkey_1.RawContextKey('activeEditorGroupLast', false);
    exports.MultipleEditorGroupsContext = new contextkey_1.RawContextKey('multipleEditorGroups', false);
    exports.SingleEditorGroupsContext = exports.MultipleEditorGroupsContext.toNegated();
    exports.InEditorZenModeContext = new contextkey_1.RawContextKey('inZenMode', false);
    exports.IsCenteredLayoutContext = new contextkey_1.RawContextKey('isCenteredLayout', false);
    exports.SplitEditorsVertically = new contextkey_1.RawContextKey('splitEditorsVertically', false);
    exports.EditorAreaVisibleContext = new contextkey_1.RawContextKey('editorAreaVisible', true);
    /**
     * Text diff editor id.
     */
    exports.TEXT_DIFF_EDITOR_ID = 'workbench.editors.textDiffEditor';
    /**
     * Binary diff editor id.
     */
    exports.BINARY_DIFF_EDITOR_ID = 'workbench.editors.binaryResourceDiffEditor';
    var Verbosity;
    (function (Verbosity) {
        Verbosity[Verbosity["SHORT"] = 0] = "SHORT";
        Verbosity[Verbosity["MEDIUM"] = 1] = "MEDIUM";
        Verbosity[Verbosity["LONG"] = 2] = "LONG";
    })(Verbosity = exports.Verbosity || (exports.Verbosity = {}));
    /**
     * Editor inputs are lightweight objects that can be passed to the workbench API to open inside the editor part.
     * Each editor input is mapped to an editor that is capable of opening it through the Platform facade.
     */
    class EditorInput extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidChangeLabel = this._register(new event_1.Emitter());
            this.onDidChangeLabel = this._onDidChangeLabel.event;
            this._onDispose = this._register(new event_1.Emitter());
            this.onDispose = this._onDispose.event;
            this.disposed = false;
        }
        /**
         * Returns the associated resource of this input if any.
         */
        getResource() {
            return undefined;
        }
        /**
         * Returns the name of this input that can be shown to the user. Examples include showing the name of the input
         * above the editor area when the input is shown.
         */
        getName() {
            return undefined;
        }
        /**
         * Returns the description of this input that can be shown to the user. Examples include showing the description of
         * the input above the editor area to the side of the name of the input.
         */
        getDescription(verbosity) {
            return undefined;
        }
        /**
         * Returns the title of this input that can be shown to the user. Examples include showing the title of
         * the input above the editor area as hover over the input label.
         */
        getTitle(verbosity) {
            return this.getName();
        }
        /**
         * Returns the preferred editor for this input. A list of candidate editors is passed in that whee registered
         * for the input. This allows subclasses to decide late which editor to use for the input on a case by case basis.
         */
        getPreferredEditorId(candidates) {
            return arrays_1.firstOrDefault(candidates);
        }
        /**
         * Returns a descriptor suitable for telemetry events.
         *
         * Subclasses should extend if they can contribute.
         */
        getTelemetryDescriptor() {
            /* __GDPR__FRAGMENT__
                "EditorTelemetryDescriptor" : {
                    "typeId" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            return { typeId: this.getTypeId() };
        }
        /**
         * An editor that is dirty will be asked to be saved once it closes.
         */
        isDirty() {
            return false;
        }
        /**
         * Subclasses should bring up a proper dialog for the user if the editor is dirty and return the result.
         */
        confirmSave() {
            return Promise.resolve(1 /* DONT_SAVE */);
        }
        /**
         * Saves the editor if it is dirty. Subclasses return a promise with a boolean indicating the success of the operation.
         */
        save() {
            return Promise.resolve(true);
        }
        /**
         * Reverts the editor if it is dirty. Subclasses return a promise with a boolean indicating the success of the operation.
         */
        revert(options) {
            return Promise.resolve(true);
        }
        /**
         * Called when this input is no longer opened in any editor. Subclasses can free resources as needed.
         */
        close() {
            this.dispose();
        }
        /**
         * Subclasses can set this to false if it does not make sense to split the editor input.
         */
        supportsSplitEditor() {
            return true;
        }
        /**
         * Returns true if this input is identical to the otherInput.
         */
        matches(otherInput) {
            return this === otherInput;
        }
        /**
         * Returns whether this input was disposed or not.
         */
        isDisposed() {
            return this.disposed;
        }
        /**
         * Called when an editor input is no longer needed. Allows to free up any resources taken by
         * resolving the editor input.
         */
        dispose() {
            this.disposed = true;
            this._onDispose.fire();
            super.dispose();
        }
    }
    exports.EditorInput = EditorInput;
    var ConfirmResult;
    (function (ConfirmResult) {
        ConfirmResult[ConfirmResult["SAVE"] = 0] = "SAVE";
        ConfirmResult[ConfirmResult["DONT_SAVE"] = 1] = "DONT_SAVE";
        ConfirmResult[ConfirmResult["CANCEL"] = 2] = "CANCEL";
    })(ConfirmResult = exports.ConfirmResult || (exports.ConfirmResult = {}));
    var EncodingMode;
    (function (EncodingMode) {
        /**
         * Instructs the encoding support to encode the current input with the provided encoding
         */
        EncodingMode[EncodingMode["Encode"] = 0] = "Encode";
        /**
         * Instructs the encoding support to decode the current input with the provided encoding
         */
        EncodingMode[EncodingMode["Decode"] = 1] = "Decode";
    })(EncodingMode = exports.EncodingMode || (exports.EncodingMode = {}));
    /**
     * Side by side editor inputs that have a master and details side.
     */
    class SideBySideEditorInput extends EditorInput {
        constructor(name, description, _details, _master) {
            super();
            this.name = name;
            this.description = description;
            this._details = _details;
            this._master = _master;
            this.registerListeners();
        }
        get master() {
            return this._master;
        }
        get details() {
            return this._details;
        }
        isDirty() {
            return this.master.isDirty();
        }
        confirmSave() {
            return this.master.confirmSave();
        }
        save() {
            return this.master.save();
        }
        revert() {
            return this.master.revert();
        }
        getTelemetryDescriptor() {
            const descriptor = this.master.getTelemetryDescriptor();
            return objects_1.assign(descriptor, super.getTelemetryDescriptor());
        }
        registerListeners() {
            // When the details or master input gets disposed, dispose this diff editor input
            const onceDetailsDisposed = event_1.Event.once(this.details.onDispose);
            this._register(onceDetailsDisposed(() => {
                if (!this.isDisposed()) {
                    this.dispose();
                }
            }));
            const onceMasterDisposed = event_1.Event.once(this.master.onDispose);
            this._register(onceMasterDisposed(() => {
                if (!this.isDisposed()) {
                    this.dispose();
                }
            }));
            // Reemit some events from the master side to the outside
            this._register(this.master.onDidChangeDirty(() => this._onDidChangeDirty.fire()));
            this._register(this.master.onDidChangeLabel(() => this._onDidChangeLabel.fire()));
        }
        resolve() {
            return Promise.resolve(null);
        }
        getTypeId() {
            return SideBySideEditorInput.ID;
        }
        getName() {
            return this.name;
        }
        getDescription() {
            return this.description;
        }
        matches(otherInput) {
            if (super.matches(otherInput) === true) {
                return true;
            }
            if (otherInput) {
                if (!(otherInput instanceof SideBySideEditorInput)) {
                    return false;
                }
                return this.details.matches(otherInput.details) && this.master.matches(otherInput.master);
            }
            return false;
        }
    }
    exports.SideBySideEditorInput = SideBySideEditorInput;
    SideBySideEditorInput.ID = 'workbench.editorinputs.sidebysideEditorInput';
    /**
     * The editor model is the heavyweight counterpart of editor input. Depending on the editor input, it
     * connects to the disk to retrieve content and may allow for saving it back or reverting it. Editor models
     * are typically cached for some while because they are expensive to construct.
     */
    class EditorModel extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDispose = this._register(new event_1.Emitter());
            this.onDispose = this._onDispose.event;
        }
        /**
         * Causes this model to load returning a promise when loading is completed.
         */
        load() {
            return Promise.resolve(this);
        }
        /**
         * Returns whether this model was loaded or not.
         */
        isResolved() {
            return true;
        }
        /**
         * Subclasses should implement to free resources that have been claimed through loading.
         */
        dispose() {
            this._onDispose.fire();
            super.dispose();
        }
    }
    exports.EditorModel = EditorModel;
    function isEditorInputWithOptions(obj) {
        const editorInputWithOptions = obj;
        return !!editorInputWithOptions && !!editorInputWithOptions.editor;
    }
    exports.isEditorInputWithOptions = isEditorInputWithOptions;
    /**
     * The editor options is the base class of options that can be passed in when opening an editor.
     */
    class EditorOptions {
        /**
         * Helper to create EditorOptions inline.
         */
        static create(settings) {
            const options = new EditorOptions();
            options.overwrite(settings);
            return options;
        }
        /**
         * Overwrites option values from the provided bag.
         */
        overwrite(options) {
            if (typeof options.forceReload === 'boolean') {
                this.forceReload = options.forceReload;
            }
            if (typeof options.revealIfVisible === 'boolean') {
                this.revealIfVisible = options.revealIfVisible;
            }
            if (typeof options.revealIfOpened === 'boolean') {
                this.revealIfOpened = options.revealIfOpened;
            }
            if (typeof options.preserveFocus === 'boolean') {
                this.preserveFocus = options.preserveFocus;
            }
            if (typeof options.activation === 'number') {
                this.activation = options.activation;
            }
            if (typeof options.pinned === 'boolean') {
                this.pinned = options.pinned;
            }
            if (typeof options.inactive === 'boolean') {
                this.inactive = options.inactive;
            }
            if (typeof options.ignoreError === 'boolean') {
                this.ignoreError = options.ignoreError;
            }
            if (typeof options.index === 'number') {
                this.index = options.index;
            }
            if (typeof options.ignoreOverrides === 'boolean') {
                this.ignoreOverrides = options.ignoreOverrides;
            }
            if (typeof options.context === 'number') {
                this.context = options.context;
            }
            return this;
        }
    }
    exports.EditorOptions = EditorOptions;
    /**
     * Base Text Editor Options.
     */
    class TextEditorOptions extends EditorOptions {
        static from(input) {
            if (!input || !input.options) {
                return undefined;
            }
            return TextEditorOptions.create(input.options);
        }
        /**
         * Helper to convert options bag to real class
         */
        static create(options = Object.create(null)) {
            const textEditorOptions = new TextEditorOptions();
            textEditorOptions.overwrite(options);
            return textEditorOptions;
        }
        /**
         * Overwrites option values from the provided bag.
         */
        overwrite(options) {
            super.overwrite(options);
            if (options.selection) {
                const selection = options.selection;
                this.selection(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn);
            }
            if (options.viewState) {
                this.editorViewState = options.viewState;
            }
            if (typeof options.revealInCenterIfOutsideViewport === 'boolean') {
                this.revealInCenterIfOutsideViewport = options.revealInCenterIfOutsideViewport;
            }
            return this;
        }
        /**
         * Returns if this options object has objects defined for the editor.
         */
        hasOptionsDefined() {
            return !!this.editorViewState || (!types_1.isUndefinedOrNull(this.startLineNumber) && !types_1.isUndefinedOrNull(this.startColumn));
        }
        /**
         * Tells the editor to set show the given selection when the editor is being opened.
         */
        selection(startLineNumber, startColumn, endLineNumber = startLineNumber, endColumn = startColumn) {
            this.startLineNumber = startLineNumber;
            this.startColumn = startColumn;
            this.endLineNumber = endLineNumber;
            this.endColumn = endColumn;
            return this;
        }
        /**
         * Create a TextEditorOptions inline to be used when the editor is opening.
         */
        static fromEditor(editor, settings) {
            const options = TextEditorOptions.create(settings);
            // View state
            options.editorViewState = types_1.withNullAsUndefined(editor.saveViewState());
            return options;
        }
        /**
         * Apply the view state or selection to the given editor.
         *
         * @return if something was applied
         */
        apply(editor, scrollType) {
            // View state
            return this.applyViewState(editor, scrollType);
        }
        applyViewState(editor, scrollType) {
            let gotApplied = false;
            // First try viewstate
            if (this.editorViewState) {
                editor.restoreViewState(this.editorViewState);
                gotApplied = true;
            }
            // Otherwise check for selection
            else if (!types_1.isUndefinedOrNull(this.startLineNumber) && !types_1.isUndefinedOrNull(this.startColumn)) {
                // Select
                if (!types_1.isUndefinedOrNull(this.endLineNumber) && !types_1.isUndefinedOrNull(this.endColumn)) {
                    const range = {
                        startLineNumber: this.startLineNumber,
                        startColumn: this.startColumn,
                        endLineNumber: this.endLineNumber,
                        endColumn: this.endColumn
                    };
                    editor.setSelection(range);
                    if (this.revealInCenterIfOutsideViewport) {
                        editor.revealRangeInCenterIfOutsideViewport(range, scrollType);
                    }
                    else {
                        editor.revealRangeInCenter(range, scrollType);
                    }
                }
                // Reveal
                else {
                    const pos = {
                        lineNumber: this.startLineNumber,
                        column: this.startColumn
                    };
                    editor.setPosition(pos);
                    if (this.revealInCenterIfOutsideViewport) {
                        editor.revealPositionInCenterIfOutsideViewport(pos, scrollType);
                    }
                    else {
                        editor.revealPositionInCenter(pos, scrollType);
                    }
                }
                gotApplied = true;
            }
            return gotApplied;
        }
    }
    exports.TextEditorOptions = TextEditorOptions;
    class EditorCommandsContextActionRunner extends actions_1.ActionRunner {
        constructor(context) {
            super();
            this.context = context;
        }
        run(action) {
            return super.run(action, this.context);
        }
    }
    exports.EditorCommandsContextActionRunner = EditorCommandsContextActionRunner;
    var SideBySideEditor;
    (function (SideBySideEditor) {
        SideBySideEditor[SideBySideEditor["MASTER"] = 1] = "MASTER";
        SideBySideEditor[SideBySideEditor["DETAILS"] = 2] = "DETAILS";
    })(SideBySideEditor = exports.SideBySideEditor || (exports.SideBySideEditor = {}));
    function toResource(editor, options) {
        var _a;
        if (!editor) {
            return undefined;
        }
        if (((_a = options) === null || _a === void 0 ? void 0 : _a.supportSideBySide) && editor instanceof SideBySideEditorInput) {
            editor = options.supportSideBySide === SideBySideEditor.MASTER ? editor.master : editor.details;
        }
        const resource = editor.getResource();
        if (!resource || !options || !options.filterByScheme) {
            return resource;
        }
        if (Array.isArray(options.filterByScheme) && options.filterByScheme.some(scheme => resource.scheme === scheme)) {
            return resource;
        }
        if (options.filterByScheme === resource.scheme) {
            return resource;
        }
        return undefined;
    }
    exports.toResource = toResource;
    var CloseDirection;
    (function (CloseDirection) {
        CloseDirection[CloseDirection["LEFT"] = 0] = "LEFT";
        CloseDirection[CloseDirection["RIGHT"] = 1] = "RIGHT";
    })(CloseDirection = exports.CloseDirection || (exports.CloseDirection = {}));
    class EditorInputFactoryRegistry {
        constructor() {
            this.editorInputFactoryConstructors = new Map();
            this.editorInputFactoryInstances = new Map();
        }
        start(accessor) {
            const instantiationService = this.instantiationService = accessor.get(instantiation_1.IInstantiationService);
            this.editorInputFactoryConstructors.forEach((ctor, key) => {
                this.createEditorInputFactory(key, ctor, instantiationService);
            });
            this.editorInputFactoryConstructors.clear();
        }
        createEditorInputFactory(editorInputId, ctor, instantiationService) {
            const instance = instantiationService.createInstance(ctor);
            this.editorInputFactoryInstances.set(editorInputId, instance);
        }
        registerFileInputFactory(factory) {
            this.fileInputFactory = factory;
        }
        getFileInputFactory() {
            return types_1.assertIsDefined(this.fileInputFactory);
        }
        registerEditorInputFactory(editorInputId, ctor) {
            if (!this.instantiationService) {
                this.editorInputFactoryConstructors.set(editorInputId, ctor);
            }
            else {
                this.createEditorInputFactory(editorInputId, ctor, this.instantiationService);
            }
        }
        getEditorInputFactory(editorInputId) {
            return this.editorInputFactoryInstances.get(editorInputId);
        }
    }
    exports.Extensions = {
        EditorInputFactories: 'workbench.contributions.editor.inputFactories'
    };
    platform_1.Registry.add(exports.Extensions.EditorInputFactories, new EditorInputFactoryRegistry());
    async function pathsToEditors(paths, fileService) {
        if (!paths || !paths.length) {
            return [];
        }
        const editors = await Promise.all(paths.map(async (path) => {
            const resource = uri_1.URI.revive(path.fileUri);
            if (!resource || !fileService.canHandleResource(resource)) {
                return;
            }
            const exists = (typeof path.exists === 'boolean') ? path.exists : await fileService.exists(resource);
            const options = { pinned: true };
            if (exists && typeof path.lineNumber === 'number') {
                options.selection = {
                    startLineNumber: path.lineNumber,
                    startColumn: path.columnNumber || 1
                };
            }
            let input;
            if (!exists) {
                input = { resource, options, forceUntitled: true };
            }
            else {
                input = { resource, options, forceFile: true };
            }
            return input;
        }));
        return arrays_1.coalesce(editors);
    }
    exports.pathsToEditors = pathsToEditors;
});
//# sourceMappingURL=editor.js.map