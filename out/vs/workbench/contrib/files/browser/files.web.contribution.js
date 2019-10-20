/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/contrib/files/common/editors/fileEditorInput", "vs/platform/instantiation/common/descriptors", "vs/workbench/browser/editor", "vs/workbench/contrib/files/browser/editors/textFileEditor", "vs/workbench/contrib/files/common/dirtyFilesTracker", "vs/workbench/common/contributions"], function (require, exports, nls, platform_1, fileEditorInput_1, descriptors_1, editor_1, textFileEditor_1, dirtyFilesTracker_1, contributions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Register file editor
    platform_1.Registry.as(editor_1.Extensions.Editors).registerEditor(new editor_1.EditorDescriptor(textFileEditor_1.TextFileEditor, textFileEditor_1.TextFileEditor.ID, nls.localize('textFileEditor', "Text File Editor")), [
        new descriptors_1.SyncDescriptor(fileEditorInput_1.FileEditorInput)
    ]);
    // Register Dirty Files Tracker
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(dirtyFilesTracker_1.DirtyFilesTracker, 1 /* Starting */);
});
//# sourceMappingURL=files.web.contribution.js.map