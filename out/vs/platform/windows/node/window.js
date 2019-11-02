/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/common/extpath", "vs/platform/workspaces/common/workspaces", "vs/base/common/resources"], function (require, exports, platform, extpath, workspaces_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function findBestWindowOrFolderForFile({ windows, newWindow, context, fileUri, localWorkspaceResolver: workspaceResolver }) {
        if (!newWindow && fileUri && (context === 4 /* DESKTOP */ || context === 0 /* CLI */ || context === 1 /* DOCK */)) {
            const windowOnFilePath = findWindowOnFilePath(windows, fileUri, workspaceResolver);
            if (windowOnFilePath) {
                return windowOnFilePath;
            }
        }
        return !newWindow ? getLastActiveWindow(windows) : undefined;
    }
    exports.findBestWindowOrFolderForFile = findBestWindowOrFolderForFile;
    function findWindowOnFilePath(windows, fileUri, localWorkspaceResolver) {
        // First check for windows with workspaces that have a parent folder of the provided path opened
        for (const window of windows) {
            const workspace = window.openedWorkspace;
            if (workspace) {
                const resolvedWorkspace = localWorkspaceResolver(workspace);
                if (resolvedWorkspace) {
                    // workspace could be resolved: It's in the local file system
                    if (resolvedWorkspace.folders.some(folder => resources_1.isEqualOrParent(fileUri, folder.uri))) {
                        return window;
                    }
                }
                else {
                    // use the config path instead
                    if (resources_1.isEqualOrParent(fileUri, workspace.configPath)) {
                        return window;
                    }
                }
            }
        }
        // Then go with single folder windows that are parent of the provided file path
        const singleFolderWindowsOnFilePath = windows.filter(window => window.openedFolderUri && resources_1.isEqualOrParent(fileUri, window.openedFolderUri));
        if (singleFolderWindowsOnFilePath.length) {
            return singleFolderWindowsOnFilePath.sort((a, b) => -(a.openedFolderUri.path.length - b.openedFolderUri.path.length))[0];
        }
        return null;
    }
    function getLastActiveWindow(windows) {
        const lastFocusedDate = Math.max.apply(Math, windows.map(window => window.lastFocusTime));
        return windows.filter(window => window.lastFocusTime === lastFocusedDate)[0];
    }
    exports.getLastActiveWindow = getLastActiveWindow;
    function findWindowOnWorkspace(windows, workspace) {
        if (workspaces_1.isSingleFolderWorkspaceIdentifier(workspace)) {
            for (const window of windows) {
                // match on folder
                if (workspaces_1.isSingleFolderWorkspaceIdentifier(workspace)) {
                    if (window.openedFolderUri && resources_1.isEqual(window.openedFolderUri, workspace)) {
                        return window;
                    }
                }
            }
        }
        else if (workspaces_1.isWorkspaceIdentifier(workspace)) {
            for (const window of windows) {
                // match on workspace
                if (window.openedWorkspace && window.openedWorkspace.id === workspace.id) {
                    return window;
                }
            }
        }
        return null;
    }
    exports.findWindowOnWorkspace = findWindowOnWorkspace;
    function findWindowOnExtensionDevelopmentPath(windows, extensionDevelopmentPaths) {
        var _a;
        const matches = (uriString) => {
            return extensionDevelopmentPaths.some(p => extpath.isEqual(p, uriString, !platform.isLinux /* ignorecase */));
        };
        for (const window of windows) {
            // match on extension development path. The path can be one or more paths or uri strings, using paths.isEqual is not 100% correct but good enough
            const currPaths = window.extensionDevelopmentPath;
            if ((_a = currPaths) === null || _a === void 0 ? void 0 : _a.some(p => matches(p))) {
                return window;
            }
        }
        return null;
    }
    exports.findWindowOnExtensionDevelopmentPath = findWindowOnExtensionDevelopmentPath;
    function findWindowOnWorkspaceOrFolderUri(windows, uri) {
        if (!uri) {
            return null;
        }
        for (const window of windows) {
            // check for workspace config path
            if (window.openedWorkspace && resources_1.isEqual(window.openedWorkspace.configPath, uri)) {
                return window;
            }
            // check for folder path
            if (window.openedFolderUri && resources_1.isEqual(window.openedFolderUri, uri)) {
                return window;
            }
        }
        return null;
    }
    exports.findWindowOnWorkspaceOrFolderUri = findWindowOnWorkspaceOrFolderUri;
});
//# sourceMappingURL=window.js.map