/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/stats/common/workspaceStats"], function (require, exports, extensions_1, workspaceStats_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class NoOpWorkspaceStatsService {
        getTags() {
            return Promise.resolve({});
        }
        getTelemetryWorkspaceId(workspace, state) {
            return undefined;
        }
        getHashedRemotesFromUri(workspaceUri, stripEndingDotGit) {
            return Promise.resolve([]);
        }
    }
    exports.NoOpWorkspaceStatsService = NoOpWorkspaceStatsService;
    extensions_1.registerSingleton(workspaceStats_1.IWorkspaceStatsService, NoOpWorkspaceStatsService, true);
});
//# sourceMappingURL=workspaceStatsService.js.map