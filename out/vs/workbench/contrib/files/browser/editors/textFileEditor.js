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
define(["require", "exports", "vs/nls", "vs/base/common/errorMessage", "vs/base/common/types", "vs/base/common/extpath", "vs/base/common/resources", "vs/base/common/actions", "vs/workbench/contrib/files/common/files", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/browser/parts/editor/textEditor", "vs/workbench/common/editor", "vs/workbench/common/editor/binaryEditorModel", "vs/workbench/contrib/files/common/editors/fileEditorInput", "vs/workbench/services/viewlet/browser/viewlet", "vs/platform/files/common/files", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/platform/storage/common/storage", "vs/editor/common/services/resourceConfiguration", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/workbench/services/host/browser/host", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/errorsWithActions", "vs/base/common/lifecycle", "vs/platform/editor/common/editor"], function (require, exports, nls, errorMessage_1, types_1, extpath_1, resources_1, actions_1, files_1, textfiles_1, textEditor_1, editor_1, binaryEditorModel_1, fileEditorInput_1, viewlet_1, files_2, telemetry_1, workspace_1, storage_1, resourceConfiguration_1, instantiation_1, themeService_1, host_1, editorService_1, editorGroupsService_1, errorsWithActions_1, lifecycle_1, editor_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * An implementation of editor for file system resources.
     */
    let TextFileEditor = class TextFileEditor extends textEditor_1.BaseTextEditor {
        constructor(telemetryService, fileService, viewletService, instantiationService, contextService, storageService, configurationService, editorService, themeService, editorGroupService, textFileService, hostService, explorerService) {
            super(TextFileEditor.ID, telemetryService, instantiationService, storageService, configurationService, themeService, textFileService, editorService, editorGroupService, hostService);
            this.fileService = fileService;
            this.viewletService = viewletService;
            this.contextService = contextService;
            this.explorerService = explorerService;
            this.groupListener = this._register(new lifecycle_1.MutableDisposable());
            this.updateRestoreViewStateConfiguration();
            // Clear view state for deleted files
            this._register(this.fileService.onFileChanges(e => this.onFilesChanged(e)));
        }
        onFilesChanged(e) {
            var _a;
            const deleted = e.getDeleted();
            if ((_a = deleted) === null || _a === void 0 ? void 0 : _a.length) {
                this.clearTextEditorViewState(deleted.map(d => d.resource));
            }
        }
        handleConfigurationChangeEvent(configuration) {
            super.handleConfigurationChangeEvent(configuration);
            this.updateRestoreViewStateConfiguration();
        }
        updateRestoreViewStateConfiguration() {
            this.restoreViewState = this.configurationService.getValue(undefined, 'workbench.editor.restoreViewState');
        }
        getTitle() {
            return this.input ? this.input.getName() : nls.localize('textFileEditor', "Text File Editor");
        }
        get input() {
            return this._input;
        }
        setEditorVisible(visible, group) {
            super.setEditorVisible(visible, group);
            // React to editors closing to preserve or clear view state. This needs to happen
            // in the onWillCloseEditor because at that time the editor has not yet
            // been disposed and we can safely persist the view state still as needed.
            this.groupListener.value = (group.onWillCloseEditor(e => this.onWillCloseEditorInGroup(e)));
        }
        onWillCloseEditorInGroup(e) {
            const editor = e.editor;
            if (!(editor instanceof fileEditorInput_1.FileEditorInput)) {
                return; // only handle files
            }
            // If the editor is currently active we can always save or clear the view state.
            // If the editor is not active, we can only clear the view state because it needs
            // an active editor with the file opened, so we check for the restoreViewState flag
            // being set.
            if (editor === this.input || !this.restoreViewState) {
                this.doSaveOrClearTextEditorViewState(editor);
            }
        }
        setOptions(options) {
            const textOptions = options;
            if (textOptions && types_1.isFunction(textOptions.apply)) {
                const textEditor = types_1.assertIsDefined(this.getControl());
                textOptions.apply(textEditor, 0 /* Smooth */);
            }
        }
        async setInput(input, options, token) {
            // Update/clear view settings if input changes
            this.doSaveOrClearTextEditorViewState(this.input);
            // Set input and resolve
            await super.setInput(input, options, token);
            try {
                const resolvedModel = await input.resolve();
                // Check for cancellation
                if (token.isCancellationRequested) {
                    return;
                }
                // There is a special case where the text editor has to handle binary file editor input: if a binary file
                // has been resolved and cached before, it maybe an actual instance of BinaryEditorModel. In this case our text
                // editor has to open this model using the binary editor. We return early in this case.
                if (resolvedModel instanceof binaryEditorModel_1.BinaryEditorModel) {
                    return this.openAsBinary(input, options);
                }
                const textFileModel = resolvedModel;
                // Editor
                const textEditor = types_1.assertIsDefined(this.getControl());
                textEditor.setModel(textFileModel.textEditorModel);
                // Always restore View State if any associated
                const editorViewState = this.loadTextEditorViewState(input.getResource());
                if (editorViewState) {
                    textEditor.restoreViewState(editorViewState);
                }
                // TextOptions (avoiding instanceof here for a reason, do not change!)
                if (options && types_1.isFunction(options.apply)) {
                    options.apply(textEditor, 1 /* Immediate */);
                }
                // Readonly flag
                textEditor.updateOptions({ readOnly: textFileModel.isReadonly() });
            }
            catch (error) {
                this.handleSetInputError(error, input, options);
            }
        }
        handleSetInputError(error, input, options) {
            // In case we tried to open a file inside the text editor and the response
            // indicates that this is not a text file, reopen the file through the binary
            // editor.
            if (error.textFileOperationResult === 0 /* FILE_IS_BINARY */) {
                return this.openAsBinary(input, options);
            }
            // Similar, handle case where we were asked to open a folder in the text editor.
            if (error.fileOperationResult === 0 /* FILE_IS_DIRECTORY */) {
                this.openAsFolder(input);
                throw new Error(nls.localize('openFolderError', "File is a directory"));
            }
            // Offer to create a file from the error if we have a file not found and the name is valid
            if (error.fileOperationResult === 1 /* FILE_NOT_FOUND */ && extpath_1.isValidBasename(resources_1.basename(input.getResource()))) {
                throw errorsWithActions_1.createErrorWithActions(errorMessage_1.toErrorMessage(error), {
                    actions: [
                        new actions_1.Action('workbench.files.action.createMissingFile', nls.localize('createFile', "Create File"), undefined, true, async () => {
                            await this.textFileService.create(input.getResource());
                            return this.editorService.openEditor({
                                resource: input.getResource(),
                                options: {
                                    pinned: true // new file gets pinned by default
                                }
                            });
                        })
                    ]
                });
            }
            // Otherwise make sure the error bubbles up
            throw error;
        }
        openAsBinary(input, options) {
            input.setForceOpenAsBinary();
            // Make sure to not steal away the currently active group
            // because we are triggering another openEditor() call
            // and do not control the initial intent that resulted
            // in us now opening as binary.
            const preservingOptions = { activation: editor_2.EditorActivation.PRESERVE };
            if (options) {
                options.overwrite(preservingOptions);
            }
            else {
                options = editor_1.EditorOptions.create(preservingOptions);
            }
            this.editorService.openEditor(input, options, this.group);
        }
        async openAsFolder(input) {
            if (!this.group) {
                return;
            }
            // Since we cannot open a folder, we have to restore the previous input if any and close the editor
            await this.group.closeEditor(this.input);
            // Best we can do is to reveal the folder in the explorer
            if (this.contextService.isInsideWorkspace(input.getResource())) {
                await this.viewletService.openViewlet(files_1.VIEWLET_ID);
                this.explorerService.select(input.getResource(), true);
            }
        }
        getAriaLabel() {
            var _a;
            const input = this.input;
            const inputName = (_a = input) === null || _a === void 0 ? void 0 : _a.getName();
            let ariaLabel;
            if (inputName) {
                ariaLabel = nls.localize('fileEditorWithInputAriaLabel', "{0}. Text file editor.", inputName);
            }
            else {
                ariaLabel = nls.localize('fileEditorAriaLabel', "Text file editor.");
            }
            return ariaLabel;
        }
        clearInput() {
            // Update/clear editor view state in settings
            this.doSaveOrClearTextEditorViewState(this.input);
            // Clear Model
            const textEditor = this.getControl();
            if (textEditor) {
                textEditor.setModel(null);
            }
            // Pass to super
            super.clearInput();
        }
        saveState() {
            // Update/clear editor view State
            this.doSaveOrClearTextEditorViewState(this.input);
            super.saveState();
        }
        doSaveOrClearTextEditorViewState(input) {
            if (!input) {
                return; // ensure we have an input to handle view state for
            }
            // If the user configured to not restore view state, we clear the view
            // state unless the editor is still opened in the group.
            if (!this.restoreViewState && (!this.group || !this.group.isOpened(input))) {
                this.clearTextEditorViewState([input.getResource()], this.group);
            }
            // Otherwise we save the view state to restore it later
            else if (!input.isDisposed()) {
                this.saveTextEditorViewState(input.getResource());
            }
        }
    };
    TextFileEditor.ID = files_1.TEXT_FILE_EDITOR_ID;
    TextFileEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, files_2.IFileService),
        __param(2, viewlet_1.IViewletService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, storage_1.IStorageService),
        __param(6, resourceConfiguration_1.ITextResourceConfigurationService),
        __param(7, editorService_1.IEditorService),
        __param(8, themeService_1.IThemeService),
        __param(9, editorGroupsService_1.IEditorGroupsService),
        __param(10, textfiles_1.ITextFileService),
        __param(11, host_1.IHostService),
        __param(12, files_1.IExplorerService)
    ], TextFileEditor);
    exports.TextFileEditor = TextFileEditor;
});
//# sourceMappingURL=textFileEditor.js.map