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
define(["require", "exports", "vs/workbench/common/editor", "vs/editor/common/services/resolverService", "vs/workbench/common/editor/resourceEditorModel", "vs/base/common/resources"], function (require, exports, editor_1, resolverService_1, resourceEditorModel_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A read-only text editor input whos contents are made of the provided resource that points to an existing
     * code editor model.
     */
    let ResourceEditorInput = class ResourceEditorInput extends editor_1.EditorInput {
        constructor(name, description, resource, preferredMode, textModelResolverService) {
            super();
            this.name = name;
            this.description = description;
            this.resource = resource;
            this.preferredMode = preferredMode;
            this.textModelResolverService = textModelResolverService;
            this.cachedModel = null;
            this.modelReference = null;
            this.name = name;
            this.description = description;
            this.resource = resource;
        }
        getResource() {
            return this.resource;
        }
        getTypeId() {
            return ResourceEditorInput.ID;
        }
        getName() {
            return this.name || resources_1.basename(this.resource);
        }
        setName(name) {
            if (this.name !== name) {
                this.name = name;
                this._onDidChangeLabel.fire();
            }
        }
        getDescription() {
            return this.description;
        }
        setDescription(description) {
            if (this.description !== description) {
                this.description = description;
                this._onDidChangeLabel.fire();
            }
        }
        setMode(mode) {
            this.setPreferredMode(mode);
            if (this.cachedModel) {
                this.cachedModel.setMode(mode);
            }
        }
        setPreferredMode(mode) {
            this.preferredMode = mode;
        }
        async resolve() {
            if (!this.modelReference) {
                this.modelReference = this.textModelResolverService.createModelReference(this.resource);
            }
            const ref = await this.modelReference;
            const model = ref.object;
            // Ensure the resolved model is of expected type
            if (!(model instanceof resourceEditorModel_1.ResourceEditorModel)) {
                ref.dispose();
                this.modelReference = null;
                throw new Error(`Unexpected model for ResourceInput: ${this.resource}`);
            }
            this.cachedModel = model;
            // Set mode if we have a preferred mode configured
            if (this.preferredMode) {
                model.setMode(this.preferredMode);
            }
            return model;
        }
        matches(otherInput) {
            if (super.matches(otherInput) === true) {
                return true;
            }
            // Compare by properties
            if (otherInput instanceof ResourceEditorInput) {
                return otherInput.resource.toString() === this.resource.toString();
            }
            return false;
        }
        dispose() {
            if (this.modelReference) {
                this.modelReference.then(ref => ref.dispose());
                this.modelReference = null;
            }
            this.cachedModel = null;
            super.dispose();
        }
    };
    ResourceEditorInput.ID = 'workbench.editors.resourceEditorInput';
    ResourceEditorInput = __decorate([
        __param(4, resolverService_1.ITextModelService)
    ], ResourceEditorInput);
    exports.ResourceEditorInput = ResourceEditorInput;
});
//# sourceMappingURL=resourceEditorInput.js.map