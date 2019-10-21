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
define(["require", "exports", "vs/nls", "vs/base/common/objects", "vs/base/common/types", "vs/editor/browser/widget/codeEditorWidget", "vs/workbench/browser/parts/editor/baseEditor", "vs/platform/storage/common/storage", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/services/textfile/common/textfiles", "vs/editor/common/services/resourceConfiguration", "vs/editor/browser/editorBrowser", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/host/browser/host"], function (require, exports, nls_1, objects_1, types_1, codeEditorWidget_1, baseEditor_1, storage_1, instantiation_1, telemetry_1, themeService_1, textfiles_1, resourceConfiguration_1, editorBrowser_1, editorGroupsService_1, editorService_1, host_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const TEXT_EDITOR_VIEW_STATE_PREFERENCE_KEY = 'textEditorViewState';
    /**
     * The base class of editors that leverage the text editor for the editing experience. This class is only intended to
     * be subclassed and not instantiated.
     */
    let BaseTextEditor = class BaseTextEditor extends baseEditor_1.BaseEditor {
        constructor(id, telemetryService, _instantiationService, storageService, _configurationService, themeService, _textFileService, editorService, editorGroupService, hostService) {
            super(id, telemetryService, themeService, storageService);
            this._instantiationService = _instantiationService;
            this._configurationService = _configurationService;
            this.themeService = themeService;
            this._textFileService = _textFileService;
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.hostService = hostService;
            this.editorMemento = this.getEditorMemento(editorGroupService, TEXT_EDITOR_VIEW_STATE_PREFERENCE_KEY, 100);
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                const resource = this.getResource();
                const value = resource ? this.configurationService.getValue(resource) : undefined;
                return this.handleConfigurationChangeEvent(value);
            }));
        }
        get instantiationService() {
            return this._instantiationService;
        }
        get configurationService() {
            return this._configurationService;
        }
        get textFileService() {
            return this._textFileService;
        }
        handleConfigurationChangeEvent(configuration) {
            if (this.isVisible()) {
                this.updateEditorConfiguration(configuration);
            }
            else {
                this.hasPendingConfigurationChange = true;
            }
        }
        consumePendingConfigurationChangeEvent() {
            if (this.hasPendingConfigurationChange) {
                this.updateEditorConfiguration();
                this.hasPendingConfigurationChange = false;
            }
        }
        computeConfiguration(configuration) {
            // Specific editor options always overwrite user configuration
            const editorConfiguration = types_1.isObject(configuration.editor) ? objects_1.deepClone(configuration.editor) : Object.create(null);
            objects_1.assign(editorConfiguration, this.getConfigurationOverrides());
            // ARIA label
            editorConfiguration.ariaLabel = this.computeAriaLabel();
            return editorConfiguration;
        }
        computeAriaLabel() {
            let ariaLabel = this.getAriaLabel();
            // Apply group information to help identify in which group we are
            if (ariaLabel) {
                if (this.group) {
                    ariaLabel = nls_1.localize('editorLabelWithGroup', "{0}, {1}.", ariaLabel, this.group.label);
                }
            }
            return ariaLabel;
        }
        getConfigurationOverrides() {
            const overrides = {};
            objects_1.assign(overrides, {
                overviewRulerLanes: 3,
                lineNumbersMinChars: 3,
                fixedOverflowWidgets: true
            });
            return overrides;
        }
        createEditor(parent) {
            // Editor for Text
            this._editorContainer = parent;
            this.editorControl = this._register(this.createEditorControl(parent, this.computeConfiguration(this.configurationService.getValue(this.getResource()))));
            // Model & Language changes
            const codeEditor = editorBrowser_1.getCodeEditor(this.editorControl);
            if (codeEditor) {
                this._register(codeEditor.onDidChangeModelLanguage(e => this.updateEditorConfiguration()));
                this._register(codeEditor.onDidChangeModel(e => this.updateEditorConfiguration()));
            }
            // Application & Editor focus change to respect auto save settings
            if (editorBrowser_1.isCodeEditor(this.editorControl)) {
                this._register(this.editorControl.onDidBlurEditorWidget(() => this.onEditorFocusLost()));
            }
            else if (editorBrowser_1.isDiffEditor(this.editorControl)) {
                this._register(this.editorControl.getOriginalEditor().onDidBlurEditorWidget(() => this.onEditorFocusLost()));
                this._register(this.editorControl.getModifiedEditor().onDidBlurEditorWidget(() => this.onEditorFocusLost()));
            }
            this._register(this.editorService.onDidActiveEditorChange(() => this.onEditorFocusLost()));
            this._register(this.hostService.onDidChangeFocus(focused => this.onWindowFocusChange(focused)));
        }
        onEditorFocusLost() {
            this.maybeTriggerSaveAll(3 /* FOCUS_CHANGE */);
        }
        onWindowFocusChange(focused) {
            if (!focused) {
                this.maybeTriggerSaveAll(4 /* WINDOW_CHANGE */);
            }
        }
        maybeTriggerSaveAll(reason) {
            const mode = this.textFileService.getAutoSaveMode();
            // Determine if we need to save all. In case of a window focus change we also save if auto save mode
            // is configured to be ON_FOCUS_CHANGE (editor focus change)
            if ((reason === 4 /* WINDOW_CHANGE */ && (mode === 3 /* ON_FOCUS_CHANGE */ || mode === 4 /* ON_WINDOW_CHANGE */)) ||
                (reason === 3 /* FOCUS_CHANGE */ && mode === 3 /* ON_FOCUS_CHANGE */)) {
                if (this.textFileService.isDirty()) {
                    this.textFileService.saveAll(undefined, { reason });
                }
            }
        }
        /**
         * This method creates and returns the text editor control to be used. Subclasses can override to
         * provide their own editor control that should be used (e.g. a DiffEditor).
         *
         * The passed in configuration object should be passed to the editor control when creating it.
         */
        createEditorControl(parent, configuration) {
            // Use a getter for the instantiation service since some subclasses might use scoped instantiation services
            return this.instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, parent, configuration, {});
        }
        async setInput(input, options, token) {
            await super.setInput(input, options, token);
            // Update editor options after having set the input. We do this because there can be
            // editor input specific options (e.g. an ARIA label depending on the input showing)
            this.updateEditorConfiguration();
            const editorContainer = types_1.assertIsDefined(this._editorContainer);
            editorContainer.setAttribute('aria-label', this.computeAriaLabel());
        }
        setEditorVisible(visible, group) {
            // Pass on to Editor
            const editorControl = types_1.assertIsDefined(this.editorControl);
            if (visible) {
                this.consumePendingConfigurationChangeEvent();
                editorControl.onVisible();
            }
            else {
                editorControl.onHide();
            }
            super.setEditorVisible(visible, group);
        }
        focus() {
            // Pass on to Editor
            const editorControl = types_1.assertIsDefined(this.editorControl);
            editorControl.focus();
        }
        layout(dimension) {
            // Pass on to Editor
            const editorControl = types_1.assertIsDefined(this.editorControl);
            editorControl.layout(dimension);
        }
        getControl() {
            return this.editorControl;
        }
        /**
         * Saves the text editor view state for the given resource.
         */
        saveTextEditorViewState(resource) {
            const editorViewState = this.retrieveTextEditorViewState(resource);
            if (!editorViewState || !this.group) {
                return;
            }
            this.editorMemento.saveEditorState(this.group, resource, editorViewState);
        }
        retrieveTextEditorViewState(resource) {
            const control = this.getControl();
            if (!editorBrowser_1.isCodeEditor(control)) {
                return null;
            }
            const model = control.getModel();
            if (!model) {
                return null; // view state always needs a model
            }
            const modelUri = model.uri;
            if (!modelUri) {
                return null; // model URI is needed to make sure we save the view state correctly
            }
            if (modelUri.toString() !== resource.toString()) {
                return null; // prevent saving view state for a model that is not the expected one
            }
            return control.saveViewState();
        }
        /**
         * Clears the text editor view state for the given resources.
         */
        clearTextEditorViewState(resources, group) {
            resources.forEach(resource => {
                this.editorMemento.clearEditorState(resource, group);
            });
        }
        /**
         * Loads the text editor view state for the given resource and returns it.
         */
        loadTextEditorViewState(resource) {
            return this.group ? this.editorMemento.loadEditorState(this.group, resource) : undefined;
        }
        updateEditorConfiguration(configuration) {
            if (!configuration) {
                const resource = this.getResource();
                if (resource) {
                    configuration = this.configurationService.getValue(resource);
                }
            }
            if (!this.editorControl || !configuration) {
                return;
            }
            const editorConfiguration = this.computeConfiguration(configuration);
            // Try to figure out the actual editor options that changed from the last time we updated the editor.
            // We do this so that we are not overwriting some dynamic editor settings (e.g. word wrap) that might
            // have been applied to the editor directly.
            let editorSettingsToApply = editorConfiguration;
            if (this.lastAppliedEditorOptions) {
                editorSettingsToApply = objects_1.distinct(this.lastAppliedEditorOptions, editorSettingsToApply);
            }
            if (Object.keys(editorSettingsToApply).length > 0) {
                this.lastAppliedEditorOptions = editorConfiguration;
                this.editorControl.updateOptions(editorSettingsToApply);
            }
        }
        getResource() {
            const codeEditor = editorBrowser_1.getCodeEditor(this.editorControl);
            if (codeEditor) {
                const model = codeEditor.getModel();
                if (model) {
                    return model.uri;
                }
            }
            if (this.input) {
                return this.input.getResource();
            }
            return undefined;
        }
        dispose() {
            this.lastAppliedEditorOptions = undefined;
            super.dispose();
        }
    };
    BaseTextEditor = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, storage_1.IStorageService),
        __param(4, resourceConfiguration_1.ITextResourceConfigurationService),
        __param(5, themeService_1.IThemeService),
        __param(6, textfiles_1.ITextFileService),
        __param(7, editorService_1.IEditorService),
        __param(8, editorGroupsService_1.IEditorGroupsService),
        __param(9, host_1.IHostService)
    ], BaseTextEditor);
    exports.BaseTextEditor = BaseTextEditor;
});
//# sourceMappingURL=textEditor.js.map