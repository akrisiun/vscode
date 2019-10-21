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
define(["require", "exports", "vs/workbench/services/backup/common/backup", "vs/base/common/lifecycle", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/untitled/common/untitledEditorService", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files"], function (require, exports, backup_1, lifecycle_1, textfiles_1, untitledEditorService_1, configuration_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const AUTO_SAVE_AFTER_DELAY_DISABLED_TIME = files_1.CONTENT_CHANGE_EVENT_BUFFER_DELAY + 500;
    let BackupModelTracker = class BackupModelTracker extends lifecycle_1.Disposable {
        constructor(backupFileService, textFileService, untitledEditorService, configurationService) {
            super();
            this.backupFileService = backupFileService;
            this.textFileService = textFileService;
            this.untitledEditorService = untitledEditorService;
            this.configurationService = configurationService;
            this.configuredAutoSaveAfterDelay = false;
            this.registerListeners();
        }
        registerListeners() {
            // Listen for text file model changes
            this._register(this.textFileService.models.onModelContentChanged((e) => this.onTextFileModelChanged(e)));
            this._register(this.textFileService.models.onModelSaved((e) => this.discardBackup(e.resource)));
            this._register(this.textFileService.models.onModelDisposed((e) => this.discardBackup(e)));
            // Listen for untitled model changes
            this._register(this.untitledEditorService.onDidChangeContent((e) => this.onUntitledModelChanged(e)));
            this._register(this.untitledEditorService.onDidDisposeModel((e) => this.discardBackup(e)));
            // Listen to config changes
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationChange(this.configurationService.getValue())));
        }
        onConfigurationChange(configuration) {
            if (!configuration || !configuration.files) {
                this.configuredAutoSaveAfterDelay = false;
                return;
            }
            this.configuredAutoSaveAfterDelay = (configuration.files.autoSave === files_1.AutoSaveConfiguration.AFTER_DELAY && configuration.files.autoSaveDelay <= AUTO_SAVE_AFTER_DELAY_DISABLED_TIME);
        }
        onTextFileModelChanged(event) {
            if (event.kind === 4 /* REVERTED */) {
                // This must proceed even if auto save after delay is configured in order to clean up
                // any backups made before the config change
                this.discardBackup(event.resource);
            }
            else if (event.kind === 6 /* CONTENT_CHANGE */) {
                // Do not backup when auto save after delay is configured
                if (!this.configuredAutoSaveAfterDelay) {
                    const model = this.textFileService.models.get(event.resource);
                    if (model) {
                        model.backup();
                    }
                }
            }
        }
        onUntitledModelChanged(resource) {
            if (this.untitledEditorService.isDirty(resource)) {
                this.untitledEditorService.loadOrCreate({ resource }).then(model => model.backup());
            }
            else {
                this.discardBackup(resource);
            }
        }
        discardBackup(resource) {
            this.backupFileService.discardResourceBackup(resource);
        }
    };
    BackupModelTracker = __decorate([
        __param(0, backup_1.IBackupFileService),
        __param(1, textfiles_1.ITextFileService),
        __param(2, untitledEditorService_1.IUntitledEditorService),
        __param(3, configuration_1.IConfigurationService)
    ], BackupModelTracker);
    exports.BackupModelTracker = BackupModelTracker;
});
//# sourceMappingURL=backupModelTracker.js.map