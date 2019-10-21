/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/workspaces/common/workspaces", "vs/nls", "vs/base/common/resources", "vs/base/common/strings"], function (require, exports, instantiation_1, workspaces_1, nls_1, resources_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const LABEL_SERVICE_ID = 'label';
    function getSimpleWorkspaceLabel(workspace, workspaceHome) {
        if (workspaces_1.isSingleFolderWorkspaceIdentifier(workspace)) {
            return resources_1.basename(workspace);
        }
        // Workspace: Untitled
        if (resources_1.isEqualOrParent(workspace.configPath, workspaceHome)) {
            return nls_1.localize('untitledWorkspace', "Untitled (Workspace)");
        }
        let filename = resources_1.basename(workspace.configPath);
        if (strings_1.endsWith(filename, workspaces_1.WORKSPACE_EXTENSION)) {
            filename = filename.substr(0, filename.length - workspaces_1.WORKSPACE_EXTENSION.length - 1);
        }
        return nls_1.localize('workspaceName', "{0} (Workspace)", filename);
    }
    exports.getSimpleWorkspaceLabel = getSimpleWorkspaceLabel;
    exports.ILabelService = instantiation_1.createDecorator(LABEL_SERVICE_ID);
});
//# sourceMappingURL=label.js.map