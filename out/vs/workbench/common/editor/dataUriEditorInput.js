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
define(["require", "exports", "vs/workbench/common/editor", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor/binaryEditorModel", "vs/base/common/resources"], function (require, exports, editor_1, instantiation_1, binaryEditorModel_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * An editor input to present data URIs in a binary editor. Data URIs have the form of:
     * data:[mime type];[meta data <key=value>;...];base64,[base64 encoded value]
     */
    let DataUriEditorInput = class DataUriEditorInput extends editor_1.EditorInput {
        constructor(name, description, resource, instantiationService) {
            super();
            this.name = name;
            this.description = description;
            this.resource = resource;
            this.instantiationService = instantiationService;
            if (!this.name || !this.description) {
                const metadata = resources_1.DataUri.parseMetaData(this.resource);
                if (!this.name) {
                    this.name = metadata.get(resources_1.DataUri.META_DATA_LABEL);
                }
                if (!this.description) {
                    this.description = metadata.get(resources_1.DataUri.META_DATA_DESCRIPTION);
                }
            }
        }
        getResource() {
            return this.resource;
        }
        getTypeId() {
            return DataUriEditorInput.ID;
        }
        getName() {
            return this.name;
        }
        getDescription() {
            return this.description;
        }
        resolve() {
            return this.instantiationService.createInstance(binaryEditorModel_1.BinaryEditorModel, this.resource, this.getName()).load();
        }
        matches(otherInput) {
            if (super.matches(otherInput) === true) {
                return true;
            }
            // Compare by resource
            if (otherInput instanceof DataUriEditorInput) {
                return otherInput.resource.toString() === this.resource.toString();
            }
            return false;
        }
    };
    DataUriEditorInput.ID = 'workbench.editors.dataUriEditorInput';
    DataUriEditorInput = __decorate([
        __param(3, instantiation_1.IInstantiationService)
    ], DataUriEditorInput);
    exports.DataUriEditorInput = DataUriEditorInput;
});
//# sourceMappingURL=dataUriEditorInput.js.map