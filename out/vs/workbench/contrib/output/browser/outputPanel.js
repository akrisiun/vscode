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
define(["require", "exports", "vs/nls", "vs/platform/telemetry/common/telemetry", "vs/platform/storage/common/storage", "vs/editor/common/services/resourceConfiguration", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/contextkey/common/contextkey", "vs/workbench/browser/parts/editor/textResourceEditor", "vs/workbench/contrib/output/common/output", "vs/workbench/contrib/output/browser/outputActions", "vs/platform/theme/common/themeService", "vs/workbench/services/textfile/common/textfiles", "vs/platform/configuration/common/configuration", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/host/browser/host"], function (require, exports, nls, telemetry_1, storage_1, resourceConfiguration_1, instantiation_1, serviceCollection_1, contextkey_1, textResourceEditor_1, output_1, outputActions_1, themeService_1, textfiles_1, configuration_1, editorGroupsService_1, editorService_1, host_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let OutputPanel = class OutputPanel extends textResourceEditor_1.AbstractTextResourceEditor {
        constructor(telemetryService, instantiationService, storageService, baseConfigurationService, textResourceConfigurationService, themeService, outputService, contextKeyService, editorGroupService, textFileService, editorService, hostService) {
            super(output_1.OUTPUT_PANEL_ID, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorGroupService, textFileService, editorService, hostService);
            this.baseConfigurationService = baseConfigurationService;
            this.outputService = outputService;
            this.contextKeyService = contextKeyService;
            this._focus = false;
            this.scopedInstantiationService = instantiationService;
        }
        getId() {
            return output_1.OUTPUT_PANEL_ID;
        }
        getTitle() {
            return nls.localize('output', "Output");
        }
        getActions() {
            if (!this.actions) {
                this.actions = [
                    this.instantiationService.createInstance(outputActions_1.SwitchOutputAction),
                    this.instantiationService.createInstance(outputActions_1.ClearOutputAction, outputActions_1.ClearOutputAction.ID, outputActions_1.ClearOutputAction.LABEL),
                    this.instantiationService.createInstance(outputActions_1.ToggleOrSetOutputScrollLockAction, outputActions_1.ToggleOrSetOutputScrollLockAction.ID, outputActions_1.ToggleOrSetOutputScrollLockAction.LABEL),
                    this.instantiationService.createInstance(outputActions_1.OpenLogOutputFile)
                ];
                this.actions.forEach(a => this._register(a));
            }
            return this.actions;
        }
        getActionViewItem(action) {
            if (action.id === outputActions_1.SwitchOutputAction.ID) {
                return this.instantiationService.createInstance(outputActions_1.SwitchOutputActionViewItem, action);
            }
            return super.getActionViewItem(action);
        }
        getConfigurationOverrides() {
            const options = super.getConfigurationOverrides();
            options.wordWrap = 'on'; // all output editors wrap
            options.lineNumbers = 'off'; // all output editors hide line numbers
            options.glyphMargin = false;
            options.lineDecorationsWidth = 20;
            options.rulers = [];
            options.folding = false;
            options.scrollBeyondLastLine = false;
            options.renderLineHighlight = 'none';
            options.minimap = { enabled: false };
            const outputConfig = this.baseConfigurationService.getValue('[Log]');
            if (outputConfig) {
                if (outputConfig['editor.minimap.enabled']) {
                    options.minimap = { enabled: true };
                }
                if ('editor.wordWrap' in outputConfig) {
                    options.wordWrap = outputConfig['editor.wordWrap'];
                }
            }
            return options;
        }
        getAriaLabel() {
            const channel = this.outputService.getActiveChannel();
            return channel ? nls.localize('outputPanelWithInputAriaLabel', "{0}, Output panel", channel.label) : nls.localize('outputPanelAriaLabel', "Output panel");
        }
        setInput(input, options, token) {
            this._focus = !(options && options.preserveFocus);
            if (input.matches(this.input)) {
                return Promise.resolve(undefined);
            }
            if (this.input) {
                // Dispose previous input (Output panel is not a workbench editor)
                this.input.dispose();
            }
            return super.setInput(input, options, token).then(() => {
                if (this._focus) {
                    this.focus();
                }
                this.revealLastLine();
            });
        }
        clearInput() {
            if (this.input) {
                // Dispose current input (Output panel is not a workbench editor)
                this.input.dispose();
            }
            super.clearInput();
        }
        createEditor(parent) {
            // First create the scoped instantiation service and only then construct the editor using the scoped service
            const scopedContextKeyService = this._register(this.contextKeyService.createScoped(parent));
            this.scopedInstantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, scopedContextKeyService]));
            super.createEditor(parent);
            output_1.CONTEXT_IN_OUTPUT.bindTo(scopedContextKeyService).set(true);
            const codeEditor = this.getControl();
            codeEditor.onDidChangeCursorPosition((e) => {
                if (e.reason !== 3 /* Explicit */) {
                    return;
                }
                const model = codeEditor.getModel();
                if (model && this.actions) {
                    const newPositionLine = e.position.lineNumber;
                    const lastLine = model.getLineCount();
                    const newLockState = lastLine !== newPositionLine;
                    const lockAction = this.actions.filter((action) => action.id === outputActions_1.ToggleOrSetOutputScrollLockAction.ID)[0];
                    lockAction.run(newLockState);
                }
            });
        }
        get instantiationService() {
            return this.scopedInstantiationService;
        }
    };
    OutputPanel = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, storage_1.IStorageService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, resourceConfiguration_1.ITextResourceConfigurationService),
        __param(5, themeService_1.IThemeService),
        __param(6, output_1.IOutputService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, editorGroupsService_1.IEditorGroupsService),
        __param(9, textfiles_1.ITextFileService),
        __param(10, editorService_1.IEditorService),
        __param(11, host_1.IHostService)
    ], OutputPanel);
    exports.OutputPanel = OutputPanel;
});
//# sourceMappingURL=outputPanel.js.map