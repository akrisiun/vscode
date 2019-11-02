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
define(["require", "exports", "vs/nls", "vs/base/common/decorators", "vs/base/common/resources", "vs/workbench/common/editor", "vs/workbench/common/editor/binaryEditorModel", "vs/platform/files/common/files", "vs/workbench/services/textfile/common/textfiles", "vs/platform/instantiation/common/instantiation", "vs/editor/common/services/resolverService", "vs/workbench/contrib/files/common/files", "vs/platform/label/common/label"], function (require, exports, nls_1, decorators_1, resources_1, editor_1, binaryEditorModel_1, files_1, textfiles_1, instantiation_1, resolverService_1, files_2, label_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ForceOpenAs;
    (function (ForceOpenAs) {
        ForceOpenAs[ForceOpenAs["None"] = 0] = "None";
        ForceOpenAs[ForceOpenAs["Text"] = 1] = "Text";
        ForceOpenAs[ForceOpenAs["Binary"] = 2] = "Binary";
    })(ForceOpenAs || (ForceOpenAs = {}));
    /**
     * A file editor input is the input type for the file editor of file system resources.
     */
    let FileEditorInput = class FileEditorInput extends editor_1.EditorInput {
        /**
         * An editor input who's contents are retrieved from file services.
         */
        constructor(resource, preferredEncoding, preferredMode, instantiationService, textFileService, textModelResolverService, labelService, fileService) {
            super();
            this.resource = resource;
            this.instantiationService = instantiationService;
            this.textFileService = textFileService;
            this.textModelResolverService = textModelResolverService;
            this.labelService = labelService;
            this.fileService = fileService;
            this.forceOpenAs = 0 /* None */;
            this.textModelReference = null;
            if (preferredEncoding) {
                this.setPreferredEncoding(preferredEncoding);
            }
            if (preferredMode) {
                this.setPreferredMode(preferredMode);
            }
            this.registerListeners();
        }
        registerListeners() {
            // Model changes
            this._register(this.textFileService.models.onModelDirty(e => this.onDirtyStateChange(e)));
            this._register(this.textFileService.models.onModelSaveError(e => this.onDirtyStateChange(e)));
            this._register(this.textFileService.models.onModelSaved(e => this.onDirtyStateChange(e)));
            this._register(this.textFileService.models.onModelReverted(e => this.onDirtyStateChange(e)));
            this._register(this.textFileService.models.onModelOrphanedChanged(e => this.onModelOrphanedChanged(e)));
            this._register(this.labelService.onDidChangeFormatters(() => FileEditorInput.MEMOIZER.clear()));
            this._register(this.fileService.onDidChangeFileSystemProviderRegistrations(() => FileEditorInput.MEMOIZER.clear()));
        }
        onDirtyStateChange(e) {
            if (e.resource.toString() === this.resource.toString()) {
                this._onDidChangeDirty.fire();
            }
        }
        onModelOrphanedChanged(e) {
            if (e.resource.toString() === this.resource.toString()) {
                FileEditorInput.MEMOIZER.clear();
                this._onDidChangeLabel.fire();
            }
        }
        getResource() {
            return this.resource;
        }
        getEncoding() {
            const textModel = this.textFileService.models.get(this.resource);
            if (textModel) {
                return textModel.getEncoding();
            }
            return this.preferredEncoding;
        }
        getPreferredEncoding() {
            return this.preferredEncoding;
        }
        setEncoding(encoding, mode) {
            this.setPreferredEncoding(encoding);
            const textModel = this.textFileService.models.get(this.resource);
            if (textModel) {
                textModel.setEncoding(encoding, mode);
            }
        }
        setPreferredEncoding(encoding) {
            this.preferredEncoding = encoding;
            this.setForceOpenAsText(); // encoding is a good hint to open the file as text
        }
        getPreferredMode() {
            return this.preferredMode;
        }
        setMode(mode) {
            this.setPreferredMode(mode);
            const textModel = this.textFileService.models.get(this.resource);
            if (textModel) {
                textModel.setMode(mode);
            }
        }
        setPreferredMode(mode) {
            this.preferredMode = mode;
            this.setForceOpenAsText(); // mode is a good hint to open the file as text
        }
        setForceOpenAsText() {
            this.forceOpenAs = 1 /* Text */;
        }
        setForceOpenAsBinary() {
            this.forceOpenAs = 2 /* Binary */;
        }
        getTypeId() {
            return files_2.FILE_EDITOR_INPUT_ID;
        }
        getName() {
            return this.decorateLabel(this.labelService.getUriBasenameLabel(this.resource));
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
            switch (verbosity) {
                case 0 /* SHORT */:
                    // already decorated by getName()
                    return this.shortTitle;
                default:
                case 1 /* MEDIUM */:
                    return this.decorateLabel(this.mediumTitle);
                case 2 /* LONG */:
                    return this.decorateLabel(this.longTitle);
            }
        }
        decorateLabel(label) {
            var _a, _b;
            const model = this.textFileService.models.get(this.resource);
            if ((_a = model) === null || _a === void 0 ? void 0 : _a.hasState(5 /* ORPHAN */)) {
                return nls_1.localize('orphanedFile', "{0} (deleted)", label);
            }
            if ((_b = model) === null || _b === void 0 ? void 0 : _b.isReadonly()) {
                return nls_1.localize('readonlyFile', "{0} (read-only)", label);
            }
            return label;
        }
        isDirty() {
            const model = this.textFileService.models.get(this.resource);
            if (!model) {
                return false;
            }
            if (model.hasState(4 /* CONFLICT */) || model.hasState(6 /* ERROR */)) {
                return true; // always indicate dirty state if we are in conflict or error state
            }
            if (this.textFileService.getAutoSaveMode() === 1 /* AFTER_SHORT_DELAY */) {
                return false; // fast auto save enabled so we do not declare dirty
            }
            return model.isDirty();
        }
        confirmSave() {
            return this.textFileService.confirmSave([this.resource]);
        }
        save() {
            return this.textFileService.save(this.resource);
        }
        revert(options) {
            return this.textFileService.revert(this.resource, options);
        }
        getPreferredEditorId(candidates) {
            return this.forceOpenAs === 2 /* Binary */ ? files_2.BINARY_FILE_EDITOR_ID : files_2.TEXT_FILE_EDITOR_ID;
        }
        resolve() {
            // Resolve as binary
            if (this.forceOpenAs === 2 /* Binary */) {
                return this.doResolveAsBinary();
            }
            // Resolve as text
            return this.doResolveAsText();
        }
        async doResolveAsText() {
            // Resolve as text
            try {
                await this.textFileService.models.loadOrCreate(this.resource, {
                    mode: this.preferredMode,
                    encoding: this.preferredEncoding,
                    reload: { async: true },
                    allowBinary: this.forceOpenAs === 1 /* Text */,
                    reason: 1 /* EDITOR */
                });
                // This is a bit ugly, because we first resolve the model and then resolve a model reference. the reason being that binary
                // or very large files do not resolve to a text file model but should be opened as binary files without text. First calling into
                // loadOrCreate ensures we are not creating model references for these kind of resources.
                // In addition we have a bit of payload to take into account (encoding, reload) that the text resolver does not handle yet.
                if (!this.textModelReference) {
                    this.textModelReference = this.textModelResolverService.createModelReference(this.resource);
                }
                const ref = await this.textModelReference;
                return ref.object;
            }
            catch (error) {
                // In case of an error that indicates that the file is binary or too large, just return with the binary editor model
                if (error.textFileOperationResult === 0 /* FILE_IS_BINARY */ ||
                    error.fileOperationResult === 7 /* FILE_TOO_LARGE */) {
                    return this.doResolveAsBinary();
                }
                // Bubble any other error up
                throw error;
            }
        }
        async doResolveAsBinary() {
            return this.instantiationService.createInstance(binaryEditorModel_1.BinaryEditorModel, this.resource, this.getName()).load();
        }
        isResolved() {
            return !!this.textFileService.models.get(this.resource);
        }
        dispose() {
            // Model reference
            if (this.textModelReference) {
                this.textModelReference.then(ref => ref.dispose());
                this.textModelReference = null;
            }
            super.dispose();
        }
        matches(otherInput) {
            if (super.matches(otherInput) === true) {
                return true;
            }
            if (otherInput) {
                return otherInput instanceof FileEditorInput && otherInput.resource.toString() === this.resource.toString();
            }
            return false;
        }
    };
    FileEditorInput.MEMOIZER = decorators_1.createMemoizer();
    __decorate([
        FileEditorInput.MEMOIZER
    ], FileEditorInput.prototype, "getName", null);
    __decorate([
        FileEditorInput.MEMOIZER
    ], FileEditorInput.prototype, "shortDescription", null);
    __decorate([
        FileEditorInput.MEMOIZER
    ], FileEditorInput.prototype, "mediumDescription", null);
    __decorate([
        FileEditorInput.MEMOIZER
    ], FileEditorInput.prototype, "longDescription", null);
    __decorate([
        FileEditorInput.MEMOIZER
    ], FileEditorInput.prototype, "shortTitle", null);
    __decorate([
        FileEditorInput.MEMOIZER
    ], FileEditorInput.prototype, "mediumTitle", null);
    __decorate([
        FileEditorInput.MEMOIZER
    ], FileEditorInput.prototype, "longTitle", null);
    FileEditorInput = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, textfiles_1.ITextFileService),
        __param(5, resolverService_1.ITextModelService),
        __param(6, label_1.ILabelService),
        __param(7, files_1.IFileService)
    ], FileEditorInput);
    exports.FileEditorInput = FileEditorInput;
});
//# sourceMappingURL=fileEditorInput.js.map