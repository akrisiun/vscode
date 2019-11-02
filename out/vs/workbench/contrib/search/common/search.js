/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/platform/workspace/common/workspace", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/base/common/cancellation", "vs/platform/files/common/files"], function (require, exports, errors_1, workspace_1, editor_1, editorService_1, cancellation_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var WorkspaceSymbolProviderRegistry;
    (function (WorkspaceSymbolProviderRegistry) {
        const _supports = [];
        function register(provider) {
            let support = provider;
            if (support) {
                _supports.push(support);
            }
            return {
                dispose() {
                    if (support) {
                        const idx = _supports.indexOf(support);
                        if (idx >= 0) {
                            _supports.splice(idx, 1);
                            support = undefined;
                        }
                    }
                }
            };
        }
        WorkspaceSymbolProviderRegistry.register = register;
        function all() {
            return _supports.slice(0);
        }
        WorkspaceSymbolProviderRegistry.all = all;
    })(WorkspaceSymbolProviderRegistry = exports.WorkspaceSymbolProviderRegistry || (exports.WorkspaceSymbolProviderRegistry = {}));
    function getWorkspaceSymbols(query, token = cancellation_1.CancellationToken.None) {
        const result = [];
        const promises = WorkspaceSymbolProviderRegistry.all().map(support => {
            return Promise.resolve(support.provideWorkspaceSymbols(query, token)).then(value => {
                if (Array.isArray(value)) {
                    result.push([support, value]);
                }
            }, errors_1.onUnexpectedError);
        });
        return Promise.all(promises).then(_ => result);
    }
    exports.getWorkspaceSymbols = getWorkspaceSymbols;
    /**
     * Helper to return all opened editors with resources not belonging to the currently opened workspace.
     */
    function getOutOfWorkspaceEditorResources(accessor) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const contextService = accessor.get(workspace_1.IWorkspaceContextService);
        const fileService = accessor.get(files_1.IFileService);
        const resources = editorService.editors
            .map(editor => editor_1.toResource(editor, { supportSideBySide: editor_1.SideBySideEditor.MASTER }))
            .filter(resource => !!resource && !contextService.isInsideWorkspace(resource) && fileService.canHandleResource(resource));
        return resources;
    }
    exports.getOutOfWorkspaceEditorResources = getOutOfWorkspaceEditorResources;
});
//# sourceMappingURL=search.js.map