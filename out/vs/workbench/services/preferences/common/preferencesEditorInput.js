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
define(["require", "exports", "vs/base/common/platform", "vs/base/common/uri", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor", "vs/workbench/common/editor/resourceEditorInput", "vs/workbench/services/preferences/common/keybindingsEditorModel", "vs/workbench/services/preferences/common/preferences"], function (require, exports, platform_1, uri_1, resolverService_1, nls, instantiation_1, editor_1, resourceEditorInput_1, keybindingsEditorModel_1, preferences_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class PreferencesEditorInput extends editor_1.SideBySideEditorInput {
        getTypeId() {
            return PreferencesEditorInput.ID;
        }
        getTitle(verbosity) {
            return this.master.getTitle(verbosity);
        }
    }
    exports.PreferencesEditorInput = PreferencesEditorInput;
    PreferencesEditorInput.ID = 'workbench.editorinputs.preferencesEditorInput';
    let DefaultPreferencesEditorInput = class DefaultPreferencesEditorInput extends resourceEditorInput_1.ResourceEditorInput {
        constructor(defaultSettingsResource, textModelResolverService) {
            super(nls.localize('settingsEditorName', "Default Settings"), '', defaultSettingsResource, undefined, textModelResolverService);
        }
        getTypeId() {
            return DefaultPreferencesEditorInput.ID;
        }
        matches(other) {
            if (other instanceof DefaultPreferencesEditorInput) {
                return true;
            }
            if (!super.matches(other)) {
                return false;
            }
            return true;
        }
    };
    DefaultPreferencesEditorInput.ID = 'workbench.editorinputs.defaultpreferences';
    DefaultPreferencesEditorInput = __decorate([
        __param(1, resolverService_1.ITextModelService)
    ], DefaultPreferencesEditorInput);
    exports.DefaultPreferencesEditorInput = DefaultPreferencesEditorInput;
    let KeybindingsEditorInput = class KeybindingsEditorInput extends editor_1.EditorInput {
        constructor(instantiationService) {
            super();
            this.searchOptions = null;
            this.keybindingsModel = instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, platform_1.OS);
        }
        getTypeId() {
            return KeybindingsEditorInput.ID;
        }
        getName() {
            return nls.localize('keybindingsInputName', "Keyboard Shortcuts");
        }
        resolve() {
            return Promise.resolve(this.keybindingsModel);
        }
        matches(otherInput) {
            return otherInput instanceof KeybindingsEditorInput;
        }
    };
    KeybindingsEditorInput.ID = 'workbench.input.keybindings';
    KeybindingsEditorInput = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], KeybindingsEditorInput);
    exports.KeybindingsEditorInput = KeybindingsEditorInput;
    let SettingsEditor2Input = class SettingsEditor2Input extends editor_1.EditorInput {
        constructor(_preferencesService) {
            super();
            this.resource = uri_1.URI.from({
                scheme: 'vscode-settings',
                path: `settingseditor`
            });
            this._settingsModel = _preferencesService.createSettings2EditorModel();
        }
        matches(otherInput) {
            return otherInput instanceof SettingsEditor2Input;
        }
        getTypeId() {
            return SettingsEditor2Input.ID;
        }
        getName() {
            return nls.localize('settingsEditor2InputName', "Settings");
        }
        resolve() {
            return Promise.resolve(this._settingsModel);
        }
        getResource() {
            return this.resource;
        }
    };
    SettingsEditor2Input.ID = 'workbench.input.settings2';
    SettingsEditor2Input = __decorate([
        __param(0, preferences_1.IPreferencesService)
    ], SettingsEditor2Input);
    exports.SettingsEditor2Input = SettingsEditor2Input;
});
//# sourceMappingURL=preferencesEditorInput.js.map