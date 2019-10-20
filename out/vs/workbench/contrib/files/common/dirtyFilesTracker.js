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
define(["require", "exports", "vs/nls", "vs/workbench/contrib/files/common/files", "vs/workbench/services/textfile/common/textfiles", "vs/platform/lifecycle/common/lifecycle", "vs/base/common/lifecycle", "vs/workbench/services/activity/common/activity", "vs/workbench/services/untitled/common/untitledEditorService", "vs/base/common/arrays", "vs/workbench/services/editor/common/editorService"], function (require, exports, nls, files_1, textfiles_1, lifecycle_1, lifecycle_2, activity_1, untitledEditorService_1, arrays, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let DirtyFilesTracker = class DirtyFilesTracker extends lifecycle_2.Disposable {
        constructor(textFileService, lifecycleService, editorService, activityService, untitledEditorService) {
            super();
            this.textFileService = textFileService;
            this.lifecycleService = lifecycleService;
            this.editorService = editorService;
            this.activityService = activityService;
            this.untitledEditorService = untitledEditorService;
            this.badgeHandle = this._register(new lifecycle_2.MutableDisposable());
            this.registerListeners();
        }
        registerListeners() {
            // Local text file changes
            this._register(this.untitledEditorService.onDidChangeDirty(e => this.onUntitledDidChangeDirty(e)));
            this._register(this.textFileService.models.onModelsDirty(e => this.onTextFilesDirty(e)));
            this._register(this.textFileService.models.onModelsSaved(e => this.onTextFilesSaved(e)));
            this._register(this.textFileService.models.onModelsSaveError(e => this.onTextFilesSaveError(e)));
            this._register(this.textFileService.models.onModelsReverted(e => this.onTextFilesReverted(e)));
            // Lifecycle
            this.lifecycleService.onShutdown(this.dispose, this);
        }
        get hasDirtyCount() {
            return typeof this.lastKnownDirtyCount === 'number' && this.lastKnownDirtyCount > 0;
        }
        onUntitledDidChangeDirty(resource) {
            const gotDirty = this.untitledEditorService.isDirty(resource);
            if (gotDirty || this.hasDirtyCount) {
                this.updateActivityBadge();
            }
        }
        onTextFilesDirty(e) {
            if (this.textFileService.getAutoSaveMode() !== 1 /* AFTER_SHORT_DELAY */) {
                this.updateActivityBadge(); // no indication needed when auto save is enabled for short delay
            }
            // If files become dirty but are not opened, we open it in the background unless there are pending to be saved
            this.doOpenDirtyResources(arrays.distinct(e.filter(e => {
                // Only dirty models that are not PENDING_SAVE
                const model = this.textFileService.models.get(e.resource);
                const shouldOpen = model && model.isDirty() && !model.hasState(2 /* PENDING_SAVE */);
                // Only if not open already
                return shouldOpen && !this.editorService.isOpen({ resource: e.resource });
            }).map(e => e.resource), r => r.toString()));
        }
        doOpenDirtyResources(resources) {
            // Open
            this.editorService.openEditors(resources.map(resource => {
                return {
                    resource,
                    options: { inactive: true, pinned: true, preserveFocus: true }
                };
            }));
        }
        onTextFilesSaved(e) {
            if (this.hasDirtyCount) {
                this.updateActivityBadge();
            }
        }
        onTextFilesSaveError(e) {
            this.updateActivityBadge();
        }
        onTextFilesReverted(e) {
            if (this.hasDirtyCount) {
                this.updateActivityBadge();
            }
        }
        updateActivityBadge() {
            const dirtyCount = this.textFileService.getDirty().length;
            this.lastKnownDirtyCount = dirtyCount;
            this.badgeHandle.clear();
            if (dirtyCount > 0) {
                this.badgeHandle.value = this.activityService.showActivity(files_1.VIEWLET_ID, new activity_1.NumberBadge(dirtyCount, num => num === 1 ? nls.localize('dirtyFile', "1 unsaved file") : nls.localize('dirtyFiles', "{0} unsaved files", dirtyCount)), 'explorer-viewlet-label');
            }
        }
    };
    DirtyFilesTracker = __decorate([
        __param(0, textfiles_1.ITextFileService),
        __param(1, lifecycle_1.ILifecycleService),
        __param(2, editorService_1.IEditorService),
        __param(3, activity_1.IActivityService),
        __param(4, untitledEditorService_1.IUntitledEditorService)
    ], DirtyFilesTracker);
    exports.DirtyFilesTracker = DirtyFilesTracker;
});
//# sourceMappingURL=dirtyFilesTracker.js.map