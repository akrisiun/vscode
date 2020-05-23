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
define(["require", "exports", "vs/nls", "vs/base/common/objects", "vs/base/common/types", "vs/workbench/browser/parts/editor/textEditor", "vs/workbench/common/editor", "vs/workbench/common/editor/diffEditorInput", "vs/editor/browser/widget/diffNavigator", "vs/editor/browser/widget/diffEditorWidget", "vs/workbench/common/editor/textDiffEditorModel", "vs/platform/telemetry/common/telemetry", "vs/platform/storage/common/storage", "vs/editor/common/services/textResourceConfigurationService", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/base/common/lifecycle", "vs/platform/registry/common/platform", "vs/base/common/uri", "vs/base/common/event", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/browser/parts/editor/baseEditor", "vs/platform/editor/common/editor"], function (require, exports, nls, objects, types_1, textEditor_1, editor_1, diffEditorInput_1, diffNavigator_1, diffEditorWidget_1, textDiffEditorModel_1, telemetry_1, storage_1, textResourceConfigurationService_1, instantiation_1, themeService_1, lifecycle_1, platform_1, uri_1, event_1, editorGroupsService_1, editorService_1, baseEditor_1, editor_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextDiffEditor = void 0;
    /**
     * The text editor that leverages the diff text editor for the editing experience.
     */
    let TextDiffEditor = /** @class */ (() => {
        let TextDiffEditor = class TextDiffEditor extends textEditor_1.BaseTextEditor {
            constructor(telemetryService, instantiationService, storageService, configurationService, editorService, themeService, editorGroupService) {
                super(TextDiffEditor.ID, telemetryService, instantiationService, storageService, configurationService, themeService, editorService, editorGroupService);
                this.diffNavigatorDisposables = this._register(new lifecycle_1.DisposableStore());
            }
            getEditorMemento(editorGroupService, key, limit = 10) {
                return new baseEditor_1.EditorMemento(this.getId(), key, Object.create(null), limit, editorGroupService); // do not persist in storage as diff editors are never persisted
            }
            getTitle() {
                if (this.input) {
                    return this.input.getName();
                }
                return nls.localize('textDiffEditor', "Text Diff Editor");
            }
            createEditorControl(parent, configuration) {
                return this.instantiationService.createInstance(diffEditorWidget_1.DiffEditorWidget, parent, configuration);
            }
            async setInput(input, options, token) {
                var _a, _b;
                // Dispose previous diff navigator
                this.diffNavigatorDisposables.clear();
                // Remember view settings if input changes
                this.saveTextDiffEditorViewState(this.input);
                // Set input and resolve
                await super.setInput(input, options, token);
                try {
                    const resolvedModel = await input.resolve();
                    // Check for cancellation
                    if (token.isCancellationRequested) {
                        return undefined;
                    }
                    // Assert Model Instance
                    if (!(resolvedModel instanceof textDiffEditorModel_1.TextDiffEditorModel) && this.openAsBinary(input, options)) {
                        return undefined;
                    }
                    // Set Editor Model
                    const diffEditor = types_1.assertIsDefined(this.getControl());
                    const resolvedDiffEditorModel = resolvedModel;
                    diffEditor.setModel(resolvedDiffEditorModel.textDiffEditorModel);
                    // Apply Options from TextOptions
                    let optionsGotApplied = false;
                    if (options && types_1.isFunction(options.apply)) {
                        optionsGotApplied = options.apply(diffEditor, 1 /* Immediate */);
                    }
                    // Otherwise restore View State
                    let hasPreviousViewState = false;
                    if (!optionsGotApplied) {
                        hasPreviousViewState = this.restoreTextDiffEditorViewState(input, diffEditor);
                    }
                    // Diff navigator
                    this.diffNavigator = new diffNavigator_1.DiffNavigator(diffEditor, {
                        alwaysRevealFirst: !optionsGotApplied && !hasPreviousViewState // only reveal first change if we had no options or viewstate
                    });
                    this.diffNavigatorDisposables.add(this.diffNavigator);
                    // Since the resolved model provides information about being readonly
                    // or not, we apply it here to the editor even though the editor input
                    // was already asked for being readonly or not. The rationale is that
                    // a resolved model might have more specific information about being
                    // readonly or not that the input did not have.
                    diffEditor.updateOptions({
                        readOnly: (_a = resolvedDiffEditorModel.modifiedModel) === null || _a === void 0 ? void 0 : _a.isReadonly(),
                        originalEditable: !((_b = resolvedDiffEditorModel.originalModel) === null || _b === void 0 ? void 0 : _b.isReadonly())
                    });
                }
                catch (error) {
                    // In case we tried to open a file and the response indicates that this is not a text file, fallback to binary diff.
                    if (this.isFileBinaryError(error) && this.openAsBinary(input, options)) {
                        return;
                    }
                    throw error;
                }
            }
            restoreTextDiffEditorViewState(editor, control) {
                if (editor instanceof diffEditorInput_1.DiffEditorInput) {
                    const resource = this.toDiffEditorViewStateResource(editor);
                    if (resource) {
                        const viewState = this.loadTextEditorViewState(resource);
                        if (viewState) {
                            control.restoreViewState(viewState);
                            return true;
                        }
                    }
                }
                return false;
            }
            openAsBinary(input, options) {
                var _a;
                if (input instanceof diffEditorInput_1.DiffEditorInput) {
                    const originalInput = input.originalInput;
                    const modifiedInput = input.modifiedInput;
                    const binaryDiffInput = new diffEditorInput_1.DiffEditorInput(input.getName(), input.getDescription(), originalInput, modifiedInput, true);
                    // Forward binary flag to input if supported
                    const fileEditorInputFactory = platform_1.Registry.as(editor_1.Extensions.EditorInputFactories).getFileEditorInputFactory();
                    if (fileEditorInputFactory.isFileEditorInput(originalInput)) {
                        originalInput.setForceOpenAsBinary();
                    }
                    if (fileEditorInputFactory.isFileEditorInput(modifiedInput)) {
                        modifiedInput.setForceOpenAsBinary();
                    }
                    // Make sure to not steal away the currently active group
                    // because we are triggering another openEditor() call
                    // and do not control the initial intent that resulted
                    // in us now opening as binary.
                    const preservingOptions = { activation: editor_2.EditorActivation.PRESERVE, pinned: (_a = this.group) === null || _a === void 0 ? void 0 : _a.isPinned(input) };
                    if (options) {
                        options.overwrite(preservingOptions);
                    }
                    else {
                        options = editor_1.EditorOptions.create(preservingOptions);
                    }
                    // Replace this editor with the binary one
                    this.editorService.replaceEditors([{ editor: input, replacement: binaryDiffInput, options }], this.group || editorService_1.ACTIVE_GROUP);
                    return true;
                }
                return false;
            }
            computeConfiguration(configuration) {
                const editorConfiguration = super.computeConfiguration(configuration);
                // Handle diff editor specially by merging in diffEditor configuration
                if (types_1.isObject(configuration.diffEditor)) {
                    objects.mixin(editorConfiguration, configuration.diffEditor);
                }
                return editorConfiguration;
            }
            getConfigurationOverrides() {
                const options = super.getConfigurationOverrides();
                options.readOnly = this.input instanceof diffEditorInput_1.DiffEditorInput && this.input.modifiedInput.isReadonly();
                options.originalEditable = this.input instanceof diffEditorInput_1.DiffEditorInput && !this.input.originalInput.isReadonly();
                options.lineDecorationsWidth = '2ch';
                return options;
            }
            getAriaLabel() {
                var _a, _b;
                let ariaLabel;
                const inputName = (_a = this.input) === null || _a === void 0 ? void 0 : _a.getName();
                if ((_b = this.input) === null || _b === void 0 ? void 0 : _b.isReadonly()) {
                    ariaLabel = inputName ? nls.localize('readonlyEditorWithInputAriaLabel', "{0} readonly compare", inputName) : nls.localize('readonlyEditorAriaLabel', "Readonly compare");
                }
                else {
                    ariaLabel = inputName ? nls.localize('editableEditorWithInputAriaLabel', "{0} compare", inputName) : nls.localize('editableEditorAriaLabel', "Compare");
                }
                return ariaLabel;
            }
            isFileBinaryError(error) {
                if (types_1.isArray(error)) {
                    const errors = error;
                    return errors.some(e => this.isFileBinaryError(e));
                }
                return error.textFileOperationResult === 0 /* FILE_IS_BINARY */;
            }
            clearInput() {
                // Dispose previous diff navigator
                this.diffNavigatorDisposables.clear();
                // Keep editor view state in settings to restore when coming back
                this.saveTextDiffEditorViewState(this.input);
                // Clear Model
                const diffEditor = this.getControl();
                if (diffEditor) {
                    diffEditor.setModel(null);
                }
                // Pass to super
                super.clearInput();
            }
            getDiffNavigator() {
                return this.diffNavigator;
            }
            getControl() {
                return super.getControl();
            }
            loadTextEditorViewState(resource) {
                return super.loadTextEditorViewState(resource); // overridden for text diff editor support
            }
            saveTextDiffEditorViewState(input) {
                if (!(input instanceof diffEditorInput_1.DiffEditorInput)) {
                    return; // only supported for diff editor inputs
                }
                const resource = this.toDiffEditorViewStateResource(input);
                if (!resource) {
                    return; // unable to retrieve input resource
                }
                // Clear view state if input is disposed
                if (input.isDisposed()) {
                    super.clearTextEditorViewState([resource]);
                }
                // Otherwise save it
                else {
                    super.saveTextEditorViewState(resource);
                    // Make sure to clean up when the input gets disposed
                    event_1.Event.once(input.onDispose)(() => {
                        super.clearTextEditorViewState([resource]);
                    });
                }
            }
            retrieveTextEditorViewState(resource) {
                return this.retrieveTextDiffEditorViewState(resource); // overridden for text diff editor support
            }
            retrieveTextDiffEditorViewState(resource) {
                const control = types_1.assertIsDefined(this.getControl());
                const model = control.getModel();
                if (!model || !model.modified || !model.original) {
                    return null; // view state always needs a model
                }
                const modelUri = this.toDiffEditorViewStateResource(model);
                if (!modelUri) {
                    return null; // model URI is needed to make sure we save the view state correctly
                }
                if (modelUri.toString() !== resource.toString()) {
                    return null; // prevent saving view state for a model that is not the expected one
                }
                return control.saveViewState();
            }
            toDiffEditorViewStateResource(modelOrInput) {
                let original;
                let modified;
                if (modelOrInput instanceof diffEditorInput_1.DiffEditorInput) {
                    original = modelOrInput.originalInput.resource;
                    modified = modelOrInput.modifiedInput.resource;
                }
                else {
                    original = modelOrInput.original.uri;
                    modified = modelOrInput.modified.uri;
                }
                if (!original || !modified) {
                    return undefined;
                }
                // create a URI that is the Base64 concatenation of original + modified resource
                return uri_1.URI.from({ scheme: 'diff', path: `${btoa(original.toString())}${btoa(modified.toString())}` });
            }
        };
        TextDiffEditor.ID = editor_1.TEXT_DIFF_EDITOR_ID;
        TextDiffEditor = __decorate([
            __param(0, telemetry_1.ITelemetryService),
            __param(1, instantiation_1.IInstantiationService),
            __param(2, storage_1.IStorageService),
            __param(3, textResourceConfigurationService_1.ITextResourceConfigurationService),
            __param(4, editorService_1.IEditorService),
            __param(5, themeService_1.IThemeService),
            __param(6, editorGroupsService_1.IEditorGroupsService)
        ], TextDiffEditor);
        return TextDiffEditor;
    })();
    exports.TextDiffEditor = TextDiffEditor;
});
//# sourceMappingURL=textDiffEditor.js.map