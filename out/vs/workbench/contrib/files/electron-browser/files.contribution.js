/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "fs", "vs/nls", "vs/base/common/path", "vs/platform/registry/common/platform", "vs/workbench/contrib/files/common/editors/fileEditorInput", "vs/platform/instantiation/common/descriptors", "vs/workbench/browser/editor", "vs/workbench/contrib/files/electron-browser/textFileEditor", "vs/platform/commands/common/commands"], function (require, exports, os, fs, nls, path_1, platform_1, fileEditorInput_1, descriptors_1, editor_1, textFileEditor_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Register file editor
    platform_1.Registry.as(editor_1.Extensions.Editors).registerEditor(editor_1.EditorDescriptor.create(textFileEditor_1.NativeTextFileEditor, textFileEditor_1.NativeTextFileEditor.ID, nls.localize('textFileEditor', "Text File Editor")), [
        new descriptors_1.SyncDescriptor(fileEditorInput_1.FileEditorInput)
    ]);
    // Register mkdtemp command
    commands_1.CommandsRegistry.registerCommand('mkdtemp', function () {
        return fs.promises.mkdtemp(path_1.join(os.tmpdir(), 'vscodetmp-'));
    });
});
//# sourceMappingURL=files.contribution.js.map