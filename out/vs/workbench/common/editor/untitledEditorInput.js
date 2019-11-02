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
define(["require", "exports", "vs/base/common/mime", "vs/base/common/decorators", "vs/editor/common/modes/modesRegistry", "vs/base/common/resources", "vs/workbench/common/editor", "vs/workbench/common/editor/untitledEditorModel", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/workbench/services/textfile/common/textfiles", "vs/platform/label/common/label"], function (require, exports, mime_1, decorators_1, modesRegistry_1, resources_1, editor_1, untitledEditorModel_1, instantiation_1, event_1, textfiles_1, label_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * An editor input to be used for untitled text buffers.
     */
    let UntitledEditorInput = class UntitledEditorInput extends editor_1.EditorInput {
        constructor(resource, _hasAssociatedFilePath, preferredMode, initialValue, preferredEncoding, instantiationService, textFileService, labelService) {
            super();
            this.resource = resource;
            this._hasAssociatedFilePath = _hasAssociatedFilePath;
            this.preferredMode = preferredMode;
            this.initialValue = initialValue;
            this.preferredEncoding = preferredEncoding;
            this.instantiationService = instantiationService;
            this.textFileService = textFileService;
            this.labelService = labelService;
            this.cachedModel = null;
            this.modelResolve = null;
            this._onDidModelChangeContent = this._register(new event_1.Emitter());
            this.onDidModelChangeContent = this._onDidModelChangeContent.event;
            this._onDidModelChangeEncoding = this._register(new event_1.Emitter());
            this.onDidModelChangeEncoding = this._onDidModelChangeEncoding.event;
            this._register(this.labelService.onDidChangeFormatters(() => UntitledEditorInput.MEMOIZER.clear()));
        }
        get hasAssociatedFilePath() {
            return this._hasAssociatedFilePath;
        }
        getTypeId() {
            return UntitledEditorInput.ID;
        }
        getResource() {
            return this.resource;
        }
        getName() {
            return this.hasAssociatedFilePath ? resources_1.basenameOrAuthority(this.resource) : this.resource.path;
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
        getDescription(verbosity = 1 /* MEDIUM */) {
            if (!this.hasAssociatedFilePath) {
                return undefined;
            }
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
            if (!this.hasAssociatedFilePath) {
                return this.getName();
            }
            switch (verbosity) {
                case 0 /* SHORT */:
                    return this.shortTitle;
                case 1 /* MEDIUM */:
                    return this.mediumTitle;
                case 2 /* LONG */:
                    return this.longTitle;
            }
            return undefined;
        }
        isDirty() {
            if (this.cachedModel) {
                return this.cachedModel.isDirty();
            }
            // A disposed input is never dirty, even if it was restored from backup
            if (this.isDisposed()) {
                return false;
            }
            // untitled files with an associated path or associated resource
            return this.hasAssociatedFilePath;
        }
        hasBackup() {
            if (this.cachedModel) {
                return this.cachedModel.hasBackup();
            }
            return false;
        }
        confirmSave() {
            return this.textFileService.confirmSave([this.resource]);
        }
        save() {
            return this.textFileService.save(this.resource);
        }
        revert() {
            if (this.cachedModel) {
                this.cachedModel.revert();
            }
            this.dispose(); // a reverted untitled editor is no longer valid, so we dispose it
            return Promise.resolve(true);
        }
        suggestFileName() {
            if (!this.hasAssociatedFilePath) {
                if (this.cachedModel) {
                    const mode = this.cachedModel.getMode();
                    if (mode !== modesRegistry_1.PLAINTEXT_MODE_ID) { // do not suggest when the mode ID is simple plain text
                        return mime_1.suggestFilename(mode, this.getName());
                    }
                }
            }
            return this.getName();
        }
        getEncoding() {
            if (this.cachedModel) {
                return this.cachedModel.getEncoding();
            }
            return this.preferredEncoding;
        }
        setEncoding(encoding, mode /* ignored, we only have Encode */) {
            this.preferredEncoding = encoding;
            if (this.cachedModel) {
                this.cachedModel.setEncoding(encoding);
            }
        }
        setMode(mode) {
            this.preferredMode = mode;
            if (this.cachedModel) {
                this.cachedModel.setMode(mode);
            }
        }
        getMode() {
            if (this.cachedModel) {
                return this.cachedModel.getMode();
            }
            return this.preferredMode;
        }
        resolve() {
            // Join a model resolve if we have had one before
            if (this.modelResolve) {
                return this.modelResolve;
            }
            // Otherwise Create Model and load
            this.cachedModel = this.createModel();
            this.modelResolve = this.cachedModel.load();
            return this.modelResolve;
        }
        createModel() {
            const model = this._register(this.instantiationService.createInstance(untitledEditorModel_1.UntitledEditorModel, this.preferredMode, this.resource, this.hasAssociatedFilePath, this.initialValue, this.preferredEncoding));
            // re-emit some events from the model
            this._register(model.onDidChangeContent(() => this._onDidModelChangeContent.fire()));
            this._register(model.onDidChangeDirty(() => this._onDidChangeDirty.fire()));
            this._register(model.onDidChangeEncoding(() => this._onDidModelChangeEncoding.fire()));
            return model;
        }
        matches(otherInput) {
            if (super.matches(otherInput) === true) {
                return true;
            }
            // Otherwise compare by properties
            if (otherInput instanceof UntitledEditorInput) {
                return otherInput.resource.toString() === this.resource.toString();
            }
            return false;
        }
        dispose() {
            this.cachedModel = null;
            this.modelResolve = null;
            super.dispose();
        }
    };
    UntitledEditorInput.ID = 'workbench.editors.untitledEditorInput';
    UntitledEditorInput.MEMOIZER = decorators_1.createMemoizer();
    __decorate([
        UntitledEditorInput.MEMOIZER
    ], UntitledEditorInput.prototype, "shortDescription", null);
    __decorate([
        UntitledEditorInput.MEMOIZER
    ], UntitledEditorInput.prototype, "mediumDescription", null);
    __decorate([
        UntitledEditorInput.MEMOIZER
    ], UntitledEditorInput.prototype, "longDescription", null);
    __decorate([
        UntitledEditorInput.MEMOIZER
    ], UntitledEditorInput.prototype, "shortTitle", null);
    __decorate([
        UntitledEditorInput.MEMOIZER
    ], UntitledEditorInput.prototype, "mediumTitle", null);
    __decorate([
        UntitledEditorInput.MEMOIZER
    ], UntitledEditorInput.prototype, "longTitle", null);
    UntitledEditorInput = __decorate([
        __param(5, instantiation_1.IInstantiationService),
        __param(6, textfiles_1.ITextFileService),
        __param(7, label_1.ILabelService)
    ], UntitledEditorInput);
    exports.UntitledEditorInput = UntitledEditorInput;
});
//# sourceMappingURL=untitledEditorInput.js.map