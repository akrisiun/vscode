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
define(["require", "exports", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/platform", "vs/platform/lifecycle/common/lifecycle", "vs/workbench/services/activity/common/activity", "vs/workbench/services/untitled/common/untitledEditorService", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/files/common/dirtyFilesTracker", "vs/platform/electron/node/electron"], function (require, exports, textfiles_1, platform_1, lifecycle_1, activity_1, untitledEditorService_1, editorService_1, dirtyFilesTracker_1, electron_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let NativeDirtyFilesTracker = class NativeDirtyFilesTracker extends dirtyFilesTracker_1.DirtyFilesTracker {
        constructor(textFileService, lifecycleService, editorService, activityService, untitledEditorService, electronService) {
            super(textFileService, lifecycleService, editorService, activityService, untitledEditorService);
            this.textFileService = textFileService;
            this.untitledEditorService = untitledEditorService;
            this.electronService = electronService;
            this.isDocumentedEdited = false;
        }
        onUntitledDidChangeDirty(resource) {
            const gotDirty = this.untitledEditorService.isDirty(resource);
            if ((!this.isDocumentedEdited && gotDirty) || (this.isDocumentedEdited && !gotDirty)) {
                this.updateDocumentEdited();
            }
            super.onUntitledDidChangeDirty(resource);
        }
        onTextFilesDirty(e) {
            if ((this.textFileService.getAutoSaveMode() !== 1 /* AFTER_SHORT_DELAY */) && !this.isDocumentedEdited) {
                this.updateDocumentEdited(); // no indication needed when auto save is enabled for short delay
            }
            super.onTextFilesDirty(e);
        }
        onTextFilesSaved(e) {
            if (this.isDocumentedEdited) {
                this.updateDocumentEdited();
            }
            super.onTextFilesSaved(e);
        }
        onTextFilesSaveError(e) {
            if (!this.isDocumentedEdited) {
                this.updateDocumentEdited();
            }
            super.onTextFilesSaveError(e);
        }
        onTextFilesReverted(e) {
            if (this.isDocumentedEdited) {
                this.updateDocumentEdited();
            }
            super.onTextFilesReverted(e);
        }
        updateDocumentEdited() {
            if (platform_1.platform === 1 /* Mac */) {
                const hasDirtyFiles = this.textFileService.isDirty();
                this.isDocumentedEdited = hasDirtyFiles;
                this.electronService.setDocumentEdited(hasDirtyFiles);
            }
        }
    };
    NativeDirtyFilesTracker = __decorate([
        __param(0, textfiles_1.ITextFileService),
        __param(1, lifecycle_1.ILifecycleService),
        __param(2, editorService_1.IEditorService),
        __param(3, activity_1.IActivityService),
        __param(4, untitledEditorService_1.IUntitledEditorService),
        __param(5, electron_1.IElectronService)
    ], NativeDirtyFilesTracker);
    exports.NativeDirtyFilesTracker = NativeDirtyFilesTracker;
});
//# sourceMappingURL=dirtyFilesTracker.js.map