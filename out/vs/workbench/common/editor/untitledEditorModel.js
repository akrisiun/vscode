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
define(["require", "exports", "vs/workbench/common/editor/textEditorModel", "vs/platform/files/common/files", "vs/editor/common/services/modeService", "vs/editor/common/services/modelService", "vs/base/common/event", "vs/base/common/async", "vs/workbench/services/backup/common/backup", "vs/editor/common/services/resourceConfiguration", "vs/editor/common/model/textModel"], function (require, exports, textEditorModel_1, files_1, modeService_1, modelService_1, event_1, async_1, backup_1, resourceConfiguration_1, textModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let UntitledEditorModel = class UntitledEditorModel extends textEditorModel_1.BaseTextEditorModel {
        constructor(preferredMode, resource, _hasAssociatedFilePath, initialValue, preferredEncoding, modeService, modelService, backupFileService, configurationService) {
            super(modelService, modeService);
            this.preferredMode = preferredMode;
            this.resource = resource;
            this._hasAssociatedFilePath = _hasAssociatedFilePath;
            this.initialValue = initialValue;
            this.preferredEncoding = preferredEncoding;
            this.backupFileService = backupFileService;
            this.configurationService = configurationService;
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidChangeEncoding = this._register(new event_1.Emitter());
            this.onDidChangeEncoding = this._onDidChangeEncoding.event;
            this.dirty = false;
            this.versionId = 0;
            this.contentChangeEventScheduler = this._register(new async_1.RunOnceScheduler(() => this._onDidChangeContent.fire(), UntitledEditorModel.DEFAULT_CONTENT_CHANGE_BUFFER_DELAY));
            this.registerListeners();
        }
        get hasAssociatedFilePath() {
            return this._hasAssociatedFilePath;
        }
        registerListeners() {
            // Config Changes
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationChange()));
        }
        onConfigurationChange() {
            const configuredEncoding = this.configurationService.getValue(this.resource, 'files.encoding');
            if (this.configuredEncoding !== configuredEncoding) {
                this.configuredEncoding = configuredEncoding;
                if (!this.preferredEncoding) {
                    this._onDidChangeEncoding.fire(); // do not fire event if we have a preferred encoding set
                }
            }
        }
        getVersionId() {
            return this.versionId;
        }
        getMode() {
            if (this.textEditorModel) {
                return this.textEditorModel.getModeId();
            }
            return this.preferredMode;
        }
        getEncoding() {
            return this.preferredEncoding || this.configuredEncoding;
        }
        setEncoding(encoding) {
            const oldEncoding = this.getEncoding();
            this.preferredEncoding = encoding;
            // Emit if it changed
            if (oldEncoding !== this.preferredEncoding) {
                this._onDidChangeEncoding.fire();
            }
        }
        isDirty() {
            return this.dirty;
        }
        setDirty(dirty) {
            if (this.dirty === dirty) {
                return;
            }
            this.dirty = dirty;
            this._onDidChangeDirty.fire();
        }
        getResource() {
            return this.resource;
        }
        revert() {
            this.setDirty(false);
            // Handle content change event buffered
            this.contentChangeEventScheduler.schedule();
        }
        backup() {
            if (this.isResolved()) {
                return this.backupFileService.backupResource(this.resource, this.createSnapshot(), this.versionId);
            }
            return Promise.resolve();
        }
        hasBackup() {
            return this.backupFileService.hasBackupSync(this.resource, this.versionId);
        }
        async load() {
            // Check for backups first
            let backup = undefined;
            const backupResource = await this.backupFileService.loadBackupResource(this.resource);
            if (backupResource) {
                backup = await this.backupFileService.resolveBackupContent(backupResource);
            }
            // untitled associated to file path are dirty right away as well as untitled with content
            this.setDirty(this._hasAssociatedFilePath || !!backup || !!this.initialValue);
            let untitledContents;
            if (backup) {
                untitledContents = backup.value;
            }
            else {
                untitledContents = textModel_1.createTextBufferFactory(this.initialValue || '');
            }
            // Create text editor model if not yet done
            if (!this.textEditorModel) {
                this.createTextEditorModel(untitledContents, this.resource, this.preferredMode);
            }
            // Otherwise update
            else {
                this.updateTextEditorModel(untitledContents, this.preferredMode);
            }
            // Encoding
            this.configuredEncoding = this.configurationService.getValue(this.resource, 'files.encoding');
            // We know for a fact there is a text editor model here
            const textEditorModel = this.textEditorModel;
            // Listen to content changes
            this._register(textEditorModel.onDidChangeContent(() => this.onModelContentChanged()));
            // Listen to mode changes
            this._register(textEditorModel.onDidChangeLanguage(() => this.onConfigurationChange())); // mode change can have impact on config
            return this;
        }
        onModelContentChanged() {
            if (!this.isResolved()) {
                return;
            }
            this.versionId++;
            // mark the untitled editor as non-dirty once its content becomes empty and we do
            // not have an associated path set. we never want dirty indicator in that case.
            if (!this._hasAssociatedFilePath && this.textEditorModel.getLineCount() === 1 && this.textEditorModel.getLineContent(1) === '') {
                this.setDirty(false);
            }
            // turn dirty otherwise
            else {
                this.setDirty(true);
            }
            // Handle content change event buffered
            this.contentChangeEventScheduler.schedule();
        }
        isReadonly() {
            return false;
        }
    };
    UntitledEditorModel.DEFAULT_CONTENT_CHANGE_BUFFER_DELAY = files_1.CONTENT_CHANGE_EVENT_BUFFER_DELAY;
    UntitledEditorModel = __decorate([
        __param(5, modeService_1.IModeService),
        __param(6, modelService_1.IModelService),
        __param(7, backup_1.IBackupFileService),
        __param(8, resourceConfiguration_1.ITextResourceConfigurationService)
    ], UntitledEditorModel);
    exports.UntitledEditorModel = UntitledEditorModel;
});
//# sourceMappingURL=untitledEditorModel.js.map