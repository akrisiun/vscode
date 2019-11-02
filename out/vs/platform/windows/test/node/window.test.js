define(["require", "exports", "assert", "vs/base/common/path", "vs/platform/windows/node/window", "vs/platform/workspace/common/workspace", "vs/base/common/uri", "vs/base/common/amd"], function (require, exports, assert, path, window_1, workspace_1, uri_1, amd_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const fixturesFolder = amd_1.getPathFromAmdModule(require, './fixtures');
    const testWorkspace = {
        id: Date.now().toString(),
        configPath: uri_1.URI.file(path.join(fixturesFolder, 'workspaces.json'))
    };
    const testWorkspaceFolders = workspace_1.toWorkspaceFolders([{ path: path.join(fixturesFolder, 'vscode_workspace_1_folder') }, { path: path.join(fixturesFolder, 'vscode_workspace_2_folder') }], testWorkspace.configPath);
    function options(custom) {
        return Object.assign({ windows: [], newWindow: false, context: 0 /* CLI */, codeSettingsFolder: '_vscode', localWorkspaceResolver: workspace => { return workspace === testWorkspace ? { id: testWorkspace.id, configPath: workspace.configPath, folders: testWorkspaceFolders } : null; } }, custom);
    }
    const vscodeFolderWindow = { lastFocusTime: 1, openedFolderUri: uri_1.URI.file(path.join(fixturesFolder, 'vscode_folder')) };
    const lastActiveWindow = { lastFocusTime: 3, openedFolderUri: undefined };
    const noVscodeFolderWindow = { lastFocusTime: 2, openedFolderUri: uri_1.URI.file(path.join(fixturesFolder, 'no_vscode_folder')) };
    const windows = [
        vscodeFolderWindow,
        lastActiveWindow,
        noVscodeFolderWindow,
    ];
    suite('WindowsFinder', () => {
        test('New window without folder when no windows exist', () => {
            assert.equal(window_1.findBestWindowOrFolderForFile(options()), null);
            assert.equal(window_1.findBestWindowOrFolderForFile(options({
                fileUri: uri_1.URI.file(path.join(fixturesFolder, 'no_vscode_folder', 'file.txt'))
            })), null);
            assert.equal(window_1.findBestWindowOrFolderForFile(options({
                fileUri: uri_1.URI.file(path.join(fixturesFolder, 'vscode_folder', 'file.txt')),
                newWindow: true
            })), null);
            assert.equal(window_1.findBestWindowOrFolderForFile(options({
                fileUri: uri_1.URI.file(path.join(fixturesFolder, 'vscode_folder', 'file.txt')),
            })), null);
            assert.equal(window_1.findBestWindowOrFolderForFile(options({
                fileUri: uri_1.URI.file(path.join(fixturesFolder, 'vscode_folder', 'file.txt')),
                context: 5 /* API */
            })), null);
            assert.equal(window_1.findBestWindowOrFolderForFile(options({
                fileUri: uri_1.URI.file(path.join(fixturesFolder, 'vscode_folder', 'file.txt'))
            })), null);
            assert.equal(window_1.findBestWindowOrFolderForFile(options({
                fileUri: uri_1.URI.file(path.join(fixturesFolder, 'vscode_folder', 'new_folder', 'new_file.txt'))
            })), null);
        });
        test('New window without folder when windows exist', () => {
            assert.equal(window_1.findBestWindowOrFolderForFile(options({
                windows,
                fileUri: uri_1.URI.file(path.join(fixturesFolder, 'no_vscode_folder', 'file.txt')),
                newWindow: true
            })), null);
        });
        test('Last active window', () => {
            assert.equal(window_1.findBestWindowOrFolderForFile(options({
                windows
            })), lastActiveWindow);
            assert.equal(window_1.findBestWindowOrFolderForFile(options({
                windows,
                fileUri: uri_1.URI.file(path.join(fixturesFolder, 'no_vscode_folder2', 'file.txt'))
            })), lastActiveWindow);
            assert.equal(window_1.findBestWindowOrFolderForFile(options({
                windows: [lastActiveWindow, noVscodeFolderWindow],
                fileUri: uri_1.URI.file(path.join(fixturesFolder, 'vscode_folder', 'file.txt')),
            })), lastActiveWindow);
            assert.equal(window_1.findBestWindowOrFolderForFile(options({
                windows,
                fileUri: uri_1.URI.file(path.join(fixturesFolder, 'no_vscode_folder', 'file.txt')),
                context: 5 /* API */
            })), lastActiveWindow);
        });
        test('Existing window with folder', () => {
            assert.equal(window_1.findBestWindowOrFolderForFile(options({
                windows,
                fileUri: uri_1.URI.file(path.join(fixturesFolder, 'no_vscode_folder', 'file.txt'))
            })), noVscodeFolderWindow);
            assert.equal(window_1.findBestWindowOrFolderForFile(options({
                windows,
                fileUri: uri_1.URI.file(path.join(fixturesFolder, 'vscode_folder', 'file.txt'))
            })), vscodeFolderWindow);
            const window = { lastFocusTime: 1, openedFolderUri: uri_1.URI.file(path.join(fixturesFolder, 'vscode_folder', 'nested_folder')) };
            assert.equal(window_1.findBestWindowOrFolderForFile(options({
                windows: [window],
                fileUri: uri_1.URI.file(path.join(fixturesFolder, 'vscode_folder', 'nested_folder', 'subfolder', 'file.txt'))
            })), window);
        });
        test('More specific existing window wins', () => {
            const window = { lastFocusTime: 2, openedFolderUri: uri_1.URI.file(path.join(fixturesFolder, 'no_vscode_folder')) };
            const nestedFolderWindow = { lastFocusTime: 1, openedFolderUri: uri_1.URI.file(path.join(fixturesFolder, 'no_vscode_folder', 'nested_folder')) };
            assert.equal(window_1.findBestWindowOrFolderForFile(options({
                windows: [window, nestedFolderWindow],
                fileUri: uri_1.URI.file(path.join(fixturesFolder, 'no_vscode_folder', 'nested_folder', 'subfolder', 'file.txt'))
            })), nestedFolderWindow);
        });
        test('Workspace folder wins', () => {
            const window = { lastFocusTime: 1, openedWorkspace: testWorkspace };
            assert.equal(window_1.findBestWindowOrFolderForFile(options({
                windows: [window],
                fileUri: uri_1.URI.file(path.join(fixturesFolder, 'vscode_workspace_2_folder', 'nested_vscode_folder', 'subfolder', 'file.txt'))
            })), window);
        });
    });
});
//# sourceMappingURL=window.test.js.map