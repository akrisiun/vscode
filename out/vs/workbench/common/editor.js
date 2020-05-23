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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey", "vs/platform/registry/common/platform", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/actions", "vs/platform/files/common/files", "vs/base/common/arrays", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/editor/common/editorService", "vs/base/common/resources", "vs/base/common/decorators", "vs/platform/label/common/label", "vs/base/common/network", "vs/workbench/services/filesConfiguration/common/filesConfigurationService"], function (require, exports, nls_1, event_1, types_1, uri_1, lifecycle_1, instantiation_1, contextkey_1, platform_1, editorGroupsService_1, actions_1, files_1, arrays_1, textfiles_1, editorService_1, resources_1, decorators_1, label_1, network_1, filesConfigurationService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorsOrder = exports.pathsToEditors = exports.Extensions = exports.CloseDirection = exports.toResource = exports.SideBySideEditor = exports.EditorCommandsContextActionRunner = exports.TextEditorOptions = exports.EditorOptions = exports.isEditorInputWithOptions = exports.EditorModel = exports.SideBySideEditorInput = exports.EncodingMode = exports.TextResourceEditorInput = exports.EditorInput = exports.SaveReason = exports.Verbosity = exports.isTextEditorPane = exports.BINARY_DIFF_EDITOR_ID = exports.TEXT_DIFF_EDITOR_ID = exports.EditorAreaVisibleContext = exports.SplitEditorsVertically = exports.IsCenteredLayoutContext = exports.InEditorZenModeContext = exports.SingleEditorGroupsContext = exports.MultipleEditorGroupsContext = exports.ActiveEditorGroupLastContext = exports.ActiveEditorGroupIndexContext = exports.ActiveEditorGroupEmptyContext = exports.TextCompareEditorActiveContext = exports.TextCompareEditorVisibleContext = exports.NoEditorsVisibleContext = exports.EditorGroupEditorsCountContext = exports.EditorGroupActiveEditorDirtyContext = exports.EditorPinnedContext = exports.EditorsVisibleContext = exports.ActiveEditorAvailableEditorIdsContext = exports.ActiveEditorIsReadonlyContext = exports.ActiveEditorContext = exports.DirtyWorkingCopiesContext = void 0;
    exports.DirtyWorkingCopiesContext = new contextkey_1.RawContextKey('dirtyWorkingCopies', false);
    exports.ActiveEditorContext = new contextkey_1.RawContextKey('activeEditor', null);
    exports.ActiveEditorIsReadonlyContext = new contextkey_1.RawContextKey('activeEditorIsReadonly', false);
    exports.ActiveEditorAvailableEditorIdsContext = new contextkey_1.RawContextKey('activeEditorAvailableEditorIds', '');
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
    function isTextEditorPane(thing) {
        const candidate = thing;
        return typeof (candidate === null || candidate === void 0 ? void 0 : candidate.getViewState) === 'function';
    }
    exports.isTextEditorPane = isTextEditorPane;
    var Verbosity;
    (function (Verbosity) {
        Verbosity[Verbosity["SHORT"] = 0] = "SHORT";
        Verbosity[Verbosity["MEDIUM"] = 1] = "MEDIUM";
        Verbosity[Verbosity["LONG"] = 2] = "LONG";
    })(Verbosity = exports.Verbosity || (exports.Verbosity = {}));
    var SaveReason;
    (function (SaveReason) {
        /**
         * Explicit user gesture.
         */
        SaveReason[SaveReason["EXPLICIT"] = 1] = "EXPLICIT";
        /**
         * Auto save after a timeout.
         */
        SaveReason[SaveReason["AUTO"] = 2] = "AUTO";
        /**
         * Auto save after editor focus change.
         */
        SaveReason[SaveReason["FOCUS_CHANGE"] = 3] = "FOCUS_CHANGE";
        /**
         * Auto save after window change.
         */
        SaveReason[SaveReason["WINDOW_CHANGE"] = 4] = "WINDOW_CHANGE";
    })(SaveReason = exports.SaveReason || (exports.SaveReason = {}));
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
        getName() {
            return `Editor ${this.getTypeId()}`;
        }
        getDescription(verbosity) {
            return undefined;
        }
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
        isReadonly() {
            return true;
        }
        isUntitled() {
            return false;
        }
        isDirty() {
            return false;
        }
        isSaving() {
            return false;
        }
        async save(group, options) {
            return this;
        }
        async saveAs(group, options) {
            return this;
        }
        async revert(group, options) { }
        move(group, target) {
            return undefined;
        }
        /**
         * Subclasses can set this to false if it does not make sense to split the editor input.
         */
        supportsSplitEditor() {
            return true;
        }
        matches(otherInput) {
            return this === otherInput;
        }
        isDisposed() {
            return this.disposed;
        }
        dispose() {
            if (!this.disposed) {
                this.disposed = true;
                this._onDispose.fire();
            }
            super.dispose();
        }
    }
    exports.EditorInput = EditorInput;
    let TextResourceEditorInput = /** @class */ (() => {
        let TextResourceEditorInput = class TextResourceEditorInput extends EditorInput {
            constructor(resource, editorService, editorGroupService, textFileService, labelService, fileService, filesConfigurationService) {
                super();
                this.resource = resource;
                this.editorService = editorService;
                this.editorGroupService = editorGroupService;
                this.textFileService = textFileService;
                this.labelService = labelService;
                this.fileService = fileService;
                this.filesConfigurationService = filesConfigurationService;
                this.registerListeners();
            }
            registerListeners() {
                // Clear label memoizer on certain events that have impact
                this._register(this.labelService.onDidChangeFormatters(e => this.onLabelEvent(e.scheme)));
                this._register(this.fileService.onDidChangeFileSystemProviderRegistrations(e => this.onLabelEvent(e.scheme)));
                this._register(this.fileService.onDidChangeFileSystemProviderCapabilities(e => this.onLabelEvent(e.scheme)));
            }
            onLabelEvent(scheme) {
                if (scheme === this.resource.scheme) {
                    // Clear any cached labels from before
                    TextResourceEditorInput.MEMOIZER.clear();
                    // Trigger recompute of label
                    this._onDidChangeLabel.fire();
                }
            }
            getName() {
                return this.basename;
            }
            get basename() {
                return this.labelService.getUriBasenameLabel(this.resource);
            }
            getDescription(verbosity = 1 /* MEDIUM */) {
                switch (verbosity) {
                    case 0 /* SHORT */:
                        return this.shortDescription;
                    case 2 /* LONG */:
                        return this.longDescription;
                    case 1 /* MEDIUM */:
                    default:
                        return this.mediumDescription;
                }
            }
            get shortDescription() {
                return this.labelService.getUriBasenameLabel(resources_1.dirname(this.resource));
            }
            get mediumDescription() {
                return this.labelService.getUriLabel(resources_1.dirname(this.resource), { relative: true });
            }
            get longDescription() {
                return this.labelService.getUriLabel(resources_1.dirname(this.resource));
            }
            get shortTitle() {
                return this.getName();
            }
            get mediumTitle() {
                return this.labelService.getUriLabel(this.resource, { relative: true });
            }
            get longTitle() {
                return this.labelService.getUriLabel(this.resource);
            }
            getTitle(verbosity) {
                switch (verbosity) {
                    case 0 /* SHORT */:
                        return this.shortTitle;
                    case 2 /* LONG */:
                        return this.longTitle;
                    default:
                    case 1 /* MEDIUM */:
                        return this.mediumTitle;
                }
            }
            isUntitled() {
                return this.resource.scheme === network_1.Schemas.untitled;
            }
            isReadonly() {
                if (this.isUntitled()) {
                    return false; // untitled is never readonly
                }
                return this.fileService.hasCapability(this.resource, 2048 /* Readonly */);
            }
            isSaving() {
                if (this.isUntitled()) {
                    return false; // untitled is never saving automatically
                }
                if (this.filesConfigurationService.getAutoSaveMode() === 1 /* AFTER_SHORT_DELAY */) {
                    return true; // a short auto save is configured, treat this as being saved
                }
                return false;
            }
            async save(group, options) {
                return this.doSave(group, options, false);
            }
            saveAs(group, options) {
                return this.doSave(group, options, true);
            }
            async doSave(group, options, saveAs) {
                // Save / Save As
                let target;
                if (saveAs) {
                    target = await this.textFileService.saveAs(this.resource, undefined, options);
                }
                else {
                    target = await this.textFileService.save(this.resource, options);
                }
                if (!target) {
                    return undefined; // save cancelled
                }
                if (!resources_1.isEqual(target, this.resource)) {
                    return this.editorService.createEditorInput({ resource: target });
                }
                return this;
            }
            async revert(group, options) {
                await this.textFileService.revert(this.resource, options);
            }
        };
        TextResourceEditorInput.MEMOIZER = decorators_1.createMemoizer();
        __decorate([
            TextResourceEditorInput.MEMOIZER
        ], TextResourceEditorInput.prototype, "basename", null);
        __decorate([
            TextResourceEditorInput.MEMOIZER
        ], TextResourceEditorInput.prototype, "shortDescription", null);
        __decorate([
            TextResourceEditorInput.MEMOIZER
        ], TextResourceEditorInput.prototype, "mediumDescription", null);
        __decorate([
            TextResourceEditorInput.MEMOIZER
        ], TextResourceEditorInput.prototype, "longDescription", null);
        __decorate([
            TextResourceEditorInput.MEMOIZER
        ], TextResourceEditorInput.prototype, "shortTitle", null);
        __decorate([
            TextResourceEditorInput.MEMOIZER
        ], TextResourceEditorInput.prototype, "mediumTitle", null);
        __decorate([
            TextResourceEditorInput.MEMOIZER
        ], TextResourceEditorInput.prototype, "longTitle", null);
        TextResourceEditorInput = __decorate([
            __param(1, editorService_1.IEditorService),
            __param(2, editorGroupsService_1.IEditorGroupsService),
            __param(3, textfiles_1.ITextFileService),
            __param(4, label_1.ILabelService),
            __param(5, files_1.IFileService),
            __param(6, filesConfigurationService_1.IFilesConfigurationService)
        ], TextResourceEditorInput);
        return TextResourceEditorInput;
    })();
    exports.TextResourceEditorInput = TextResourceEditorInput;
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
    let SideBySideEditorInput = /** @class */ (() => {
        class SideBySideEditorInput extends EditorInput {
            constructor(name, description, _details, _master) {
                super();
                this.name = name;
                this.description = description;
                this._details = _details;
                this._master = _master;
                this.registerListeners();
            }
            get resource() {
                return undefined;
            }
            get master() {
                return this._master;
            }
            get details() {
                return this._details;
            }
            getTypeId() {
                return SideBySideEditorInput.ID;
            }
            getName() {
                if (!this.name) {
                    return nls_1.localize('sideBySideLabels', "{0} - {1}", this._details.getName(), this._master.getName());
                }
                return this.name;
            }
            getDescription() {
                return this.description;
            }
            isReadonly() {
                return this.master.isReadonly();
            }
            isUntitled() {
                return this.master.isUntitled();
            }
            isDirty() {
                return this.master.isDirty();
            }
            isSaving() {
                return this.master.isSaving();
            }
            save(group, options) {
                return this.master.save(group, options);
            }
            saveAs(group, options) {
                return this.master.saveAs(group, options);
            }
            revert(group, options) {
                return this.master.revert(group, options);
            }
            getTelemetryDescriptor() {
                const descriptor = this.master.getTelemetryDescriptor();
                return Object.assign(descriptor, super.getTelemetryDescriptor());
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
            async resolve() {
                return null;
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
        SideBySideEditorInput.ID = 'workbench.editorinputs.sidebysideEditorInput';
        return SideBySideEditorInput;
    })();
    exports.SideBySideEditorInput = SideBySideEditorInput;
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
        async load() {
            return this;
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
            var _a, _b;
            super.overwrite(options);
            if (options.selection) {
                this.selection = {
                    startLineNumber: options.selection.startLineNumber,
                    startColumn: options.selection.startColumn,
                    endLineNumber: (_a = options.selection.endLineNumber) !== null && _a !== void 0 ? _a : options.selection.startLineNumber,
                    endColumn: (_b = options.selection.endColumn) !== null && _b !== void 0 ? _b : options.selection.startColumn
                };
            }
            if (options.viewState) {
                this.editorViewState = options.viewState;
            }
            if (typeof options.selectionRevealType !== 'undefined') {
                this.selectionRevealType = options.selectionRevealType;
            }
            return this;
        }
        /**
         * Returns if this options object has objects defined for the editor.
         */
        hasOptionsDefined() {
            return !!this.editorViewState || !!this.selectionRevealType || !!this.selection;
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
            var _a, _b;
            let gotApplied = false;
            // First try viewstate
            if (this.editorViewState) {
                editor.restoreViewState(this.editorViewState);
                gotApplied = true;
            }
            // Otherwise check for selection
            else if (this.selection) {
                const range = {
                    startLineNumber: this.selection.startLineNumber,
                    startColumn: this.selection.startColumn,
                    endLineNumber: (_a = this.selection.endLineNumber) !== null && _a !== void 0 ? _a : this.selection.startLineNumber,
                    endColumn: (_b = this.selection.endColumn) !== null && _b !== void 0 ? _b : this.selection.startColumn
                };
                editor.setSelection(range);
                if (this.selectionRevealType === 2 /* NearTop */) {
                    editor.revealRangeNearTop(range, scrollType);
                }
                else if (this.selectionRevealType === 3 /* NearTopIfOutsideViewport */) {
                    editor.revealRangeNearTopIfOutsideViewport(range, scrollType);
                }
                else if (this.selectionRevealType === 1 /* CenterIfOutsideViewport */) {
                    editor.revealRangeInCenterIfOutsideViewport(range, scrollType);
                }
                else {
                    editor.revealRangeInCenter(range, scrollType);
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
        SideBySideEditor[SideBySideEditor["BOTH"] = 3] = "BOTH";
    })(SideBySideEditor = exports.SideBySideEditor || (exports.SideBySideEditor = {}));
    function toResource(editor, options) {
        if (!editor) {
            return undefined;
        }
        if ((options === null || options === void 0 ? void 0 : options.supportSideBySide) && editor instanceof SideBySideEditorInput) {
            if ((options === null || options === void 0 ? void 0 : options.supportSideBySide) === SideBySideEditor.BOTH) {
                return {
                    master: toResource(editor.master, { filterByScheme: options.filterByScheme }),
                    detail: toResource(editor.details, { filterByScheme: options.filterByScheme })
                };
            }
            editor = options.supportSideBySide === SideBySideEditor.MASTER ? editor.master : editor.details;
        }
        const resource = editor.resource;
        if (!resource || !options || !options.filterByScheme) {
            return resource;
        }
        if (Array.isArray(options.filterByScheme)) {
            if (options.filterByScheme.some(scheme => resource.scheme === scheme)) {
                return resource;
            }
        }
        else {
            if (options.filterByScheme === resource.scheme) {
                return resource;
            }
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
        registerFileEditorInputFactory(factory) {
            this.fileEditorInputFactory = factory;
        }
        getFileEditorInputFactory() {
            return types_1.assertIsDefined(this.fileEditorInputFactory);
        }
        registerCustomEditorInputFactory(factory) {
            this.customEditorInputFactory = factory;
        }
        getCustomEditorInputFactory() {
            return types_1.assertIsDefined(this.customEditorInputFactory);
        }
        registerEditorInputFactory(editorInputId, ctor) {
            if (!this.instantiationService) {
                this.editorInputFactoryConstructors.set(editorInputId, ctor);
            }
            else {
                this.createEditorInputFactory(editorInputId, ctor, this.instantiationService);
            }
            return lifecycle_1.toDisposable(() => {
                this.editorInputFactoryConstructors.delete(editorInputId);
                this.editorInputFactoryInstances.delete(editorInputId);
            });
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
            if (!exists && path.openOnlyIfExists) {
                return;
            }
            const options = (exists && typeof path.lineNumber === 'number') ? {
                selection: {
                    startLineNumber: path.lineNumber,
                    startColumn: path.columnNumber || 1
                },
                pinned: true
            } : { pinned: true };
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
    var EditorsOrder;
    (function (EditorsOrder) {
        /**
         * Editors sorted by most recent activity (most recent active first)
         */
        EditorsOrder[EditorsOrder["MOST_RECENTLY_ACTIVE"] = 0] = "MOST_RECENTLY_ACTIVE";
        /**
         * Editors sorted by sequential order
         */
        EditorsOrder[EditorsOrder["SEQUENTIAL"] = 1] = "SEQUENTIAL";
    })(EditorsOrder = exports.EditorsOrder || (exports.EditorsOrder = {}));
});
//# sourceMappingURL=editor.js.map