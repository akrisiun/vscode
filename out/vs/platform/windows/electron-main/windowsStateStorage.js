/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri"], function (require, exports, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function restoreWindowsState(data) {
        const result = { openedWindows: [] };
        const windowsState = data || { openedWindows: [] };
        if (windowsState.lastActiveWindow) {
            result.lastActiveWindow = restoreWindowState(windowsState.lastActiveWindow);
        }
        if (windowsState.lastPluginDevelopmentHostWindow) {
            result.lastPluginDevelopmentHostWindow = restoreWindowState(windowsState.lastPluginDevelopmentHostWindow);
        }
        if (Array.isArray(windowsState.openedWindows)) {
            result.openedWindows = windowsState.openedWindows.map(windowState => restoreWindowState(windowState));
        }
        return result;
    }
    exports.restoreWindowsState = restoreWindowsState;
    function restoreWindowState(windowState) {
        const result = { uiState: windowState.uiState };
        if (windowState.backupPath) {
            result.backupPath = windowState.backupPath;
        }
        if (windowState.remoteAuthority) {
            result.remoteAuthority = windowState.remoteAuthority;
        }
        if (windowState.folder) {
            result.folderUri = uri_1.URI.parse(windowState.folder);
        }
        else if (windowState.folderUri) {
            result.folderUri = uri_1.URI.revive(windowState.folderUri);
        }
        else if (windowState.folderPath) {
            result.folderUri = uri_1.URI.file(windowState.folderPath);
        }
        if (windowState.workspaceIdentifier) {
            result.workspace = { id: windowState.workspaceIdentifier.id, configPath: uri_1.URI.parse(windowState.workspaceIdentifier.configURIPath) };
        }
        else if (windowState.workspace) {
            result.workspace = { id: windowState.workspace.id, configPath: uri_1.URI.file(windowState.workspace.configPath) };
        }
        return result;
    }
    function getWindowsStateStoreData(windowsState) {
        return {
            lastActiveWindow: windowsState.lastActiveWindow && serializeWindowState(windowsState.lastActiveWindow),
            lastPluginDevelopmentHostWindow: windowsState.lastPluginDevelopmentHostWindow && serializeWindowState(windowsState.lastPluginDevelopmentHostWindow),
            openedWindows: windowsState.openedWindows.map(ws => serializeWindowState(ws))
        };
    }
    exports.getWindowsStateStoreData = getWindowsStateStoreData;
    function serializeWindowState(windowState) {
        return {
            workspaceIdentifier: windowState.workspace && { id: windowState.workspace.id, configURIPath: windowState.workspace.configPath.toString() },
            folder: windowState.folderUri && windowState.folderUri.toString(),
            backupPath: windowState.backupPath,
            remoteAuthority: windowState.remoteAuthority,
            uiState: windowState.uiState
        };
    }
});
//# sourceMappingURL=windowsStateStorage.js.map