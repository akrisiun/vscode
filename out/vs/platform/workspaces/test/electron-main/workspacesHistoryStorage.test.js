/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "os", "vs/base/common/path", "vs/platform/workspaces/common/workspaces", "vs/base/common/uri", "vs/platform/log/common/log"], function (require, exports, assert, os, path, workspaces_1, uri_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function toWorkspace(uri) {
        return {
            id: '1234',
            configPath: uri
        };
    }
    function assertEqualURI(u1, u2, message) {
        assert.equal(u1 && u1.toString(), u2 && u2.toString(), message);
    }
    function assertEqualWorkspace(w1, w2, message) {
        if (!w1 || !w2) {
            assert.equal(w1, w2, message);
            return;
        }
        assert.equal(w1.id, w2.id, message);
        assertEqualURI(w1.configPath, w2.configPath, message);
    }
    function assertEqualRecentlyOpened(actual, expected, message) {
        assert.equal(actual.files.length, expected.files.length, message);
        for (let i = 0; i < actual.files.length; i++) {
            assertEqualURI(actual.files[i].fileUri, expected.files[i].fileUri, message);
            assert.equal(actual.files[i].label, expected.files[i].label);
        }
        assert.equal(actual.workspaces.length, expected.workspaces.length, message);
        for (let i = 0; i < actual.workspaces.length; i++) {
            let expectedRecent = expected.workspaces[i];
            let actualRecent = actual.workspaces[i];
            if (workspaces_1.isRecentFolder(actualRecent)) {
                assertEqualURI(actualRecent.folderUri, expectedRecent.folderUri, message);
            }
            else {
                assertEqualWorkspace(actualRecent.workspace, expectedRecent.workspace, message);
            }
            assert.equal(actualRecent.label, expectedRecent.label);
        }
    }
    function assertRestoring(state, message) {
        const stored = workspaces_1.toStoreData(state);
        const restored = workspaces_1.restoreRecentlyOpened(stored, new log_1.NullLogService());
        assertEqualRecentlyOpened(state, restored, message);
    }
    const testWSPath = uri_1.URI.file(path.join(os.tmpdir(), 'windowStateTest', 'test.code-workspace'));
    const testFileURI = uri_1.URI.file(path.join(os.tmpdir(), 'windowStateTest', 'testFile.txt'));
    const testFolderURI = uri_1.URI.file(path.join(os.tmpdir(), 'windowStateTest', 'testFolder'));
    const testRemoteFolderURI = uri_1.URI.parse('foo://bar/c/e');
    const testRemoteFileURI = uri_1.URI.parse('foo://bar/c/d.txt');
    const testRemoteWSURI = uri_1.URI.parse('foo://bar/c/test.code-workspace');
    suite('History Storage', () => {
        test('storing and restoring', () => {
            let ro;
            ro = {
                files: [],
                workspaces: []
            };
            assertRestoring(ro, 'empty');
            ro = {
                files: [{ fileUri: testFileURI }],
                workspaces: []
            };
            assertRestoring(ro, 'file');
            ro = {
                files: [],
                workspaces: [{ folderUri: testFolderURI }]
            };
            assertRestoring(ro, 'folder');
            ro = {
                files: [],
                workspaces: [{ workspace: toWorkspace(testWSPath) }, { folderUri: testFolderURI }]
            };
            assertRestoring(ro, 'workspaces and folders');
            ro = {
                files: [{ fileUri: testRemoteFileURI }],
                workspaces: [{ workspace: toWorkspace(testRemoteWSURI) }, { folderUri: testRemoteFolderURI }]
            };
            assertRestoring(ro, 'remote workspaces and folders');
            ro = {
                files: [{ label: 'abc', fileUri: testFileURI }],
                workspaces: [{ label: 'def', workspace: toWorkspace(testWSPath) }, { folderUri: testRemoteFolderURI }]
            };
            assertRestoring(ro, 'labels');
        });
        test('open 1_25', () => {
            const v1_25_win = `{
			"workspaces": [
				{
					"id": "2fa677dbdf5f771e775af84dea9feaea",
					"configPath": "C:\\\\workspaces\\\\testing\\\\test.code-workspace"
				},
				"C:\\\\workspaces\\\\testing\\\\test-ext",
				{
					"id": "d87a0241f8abc86b95c4e5481ebcbf56",
					"configPath": "C:\\\\workspaces\\\\test.code-workspace"
				}
			],
			"files": [
				"C:\\\\workspaces\\\\test.code-workspace",
				"C:\\\\workspaces\\\\testing\\\\test-ext\\\\.gitignore"
			]
		}`;
            let actual = workspaces_1.restoreRecentlyOpened(JSON.parse(v1_25_win), new log_1.NullLogService());
            let expected = {
                files: [{ fileUri: uri_1.URI.file('C:\\workspaces\\test.code-workspace') }, { fileUri: uri_1.URI.file('C:\\workspaces\\testing\\test-ext\\.gitignore') }],
                workspaces: [
                    { workspace: { id: '2fa677dbdf5f771e775af84dea9feaea', configPath: uri_1.URI.file('C:\\workspaces\\testing\\test.code-workspace') } },
                    { folderUri: uri_1.URI.file('C:\\workspaces\\testing\\test-ext') },
                    { workspace: { id: 'd87a0241f8abc86b95c4e5481ebcbf56', configPath: uri_1.URI.file('C:\\workspaces\\test.code-workspace') } }
                ]
            };
            assertEqualRecentlyOpened(actual, expected, 'v1_31_win');
        });
        test('open 1_31', () => {
            const v1_31_win = `{
			"workspaces2": [
				"file:///c%3A/workspaces/testing/test-ext",
				"file:///c%3A/WINDOWS/system32",
				{
					"id": "d87a0241f8abc86b95c4e5481ebcbf56",
					"configPath": "c:\\\\workspaces\\\\test.code-workspace"
				}
			],
			"files2": [
				"file:///c%3A/workspaces/vscode/.yarnrc"
			]
		}`;
            let actual = workspaces_1.restoreRecentlyOpened(JSON.parse(v1_31_win), new log_1.NullLogService());
            let expected = {
                files: [{ fileUri: uri_1.URI.parse('file:///c%3A/workspaces/vscode/.yarnrc') }],
                workspaces: [
                    { folderUri: uri_1.URI.parse('file:///c%3A/workspaces/testing/test-ext') },
                    { folderUri: uri_1.URI.parse('file:///c%3A/WINDOWS/system32') },
                    { workspace: { id: 'd87a0241f8abc86b95c4e5481ebcbf56', configPath: uri_1.URI.file('c:\\workspaces\\test.code-workspace') } }
                ]
            };
            assertEqualRecentlyOpened(actual, expected, 'v1_31_win');
        });
        test('open 1_32', () => {
            const v1_32 = `{
			"workspaces3": [
				{
					"id": "53b714b46ef1a2d4346568b4f591028c",
					"configURIPath": "file:///home/user/workspaces/testing/custom.code-workspace"
				},
				"file:///home/user/workspaces/testing/folding"
			],
			"files2": [
				"file:///home/user/.config/code-oss-dev/storage.json"
			]
		}`;
            let windowsState = workspaces_1.restoreRecentlyOpened(JSON.parse(v1_32), new log_1.NullLogService());
            let expected = {
                files: [{ fileUri: uri_1.URI.parse('file:///home/user/.config/code-oss-dev/storage.json') }],
                workspaces: [
                    { workspace: { id: '53b714b46ef1a2d4346568b4f591028c', configPath: uri_1.URI.parse('file:///home/user/workspaces/testing/custom.code-workspace') } },
                    { folderUri: uri_1.URI.parse('file:///home/user/workspaces/testing/folding') }
                ]
            };
            assertEqualRecentlyOpened(windowsState, expected, 'v1_32');
        });
        test('open 1_33', () => {
            const v1_33 = `{
			"workspaces3": [
				{
					"id": "53b714b46ef1a2d4346568b4f591028c",
					"configURIPath": "file:///home/user/workspaces/testing/custom.code-workspace"
				},
				"file:///home/user/workspaces/testing/folding"
			],
			"files2": [
				"file:///home/user/.config/code-oss-dev/storage.json"
			],
			"workspaceLabels": [
				null,
				"abc"
			],
			"fileLabels": [
				"def"
			]
		}`;
            let windowsState = workspaces_1.restoreRecentlyOpened(JSON.parse(v1_33), new log_1.NullLogService());
            let expected = {
                files: [{ label: 'def', fileUri: uri_1.URI.parse('file:///home/user/.config/code-oss-dev/storage.json') }],
                workspaces: [
                    { workspace: { id: '53b714b46ef1a2d4346568b4f591028c', configPath: uri_1.URI.parse('file:///home/user/workspaces/testing/custom.code-workspace') } },
                    { label: 'abc', folderUri: uri_1.URI.parse('file:///home/user/workspaces/testing/folding') }
                ]
            };
            assertEqualRecentlyOpened(windowsState, expected, 'v1_33');
        });
    });
});
//# sourceMappingURL=workspacesHistoryStorage.test.js.map