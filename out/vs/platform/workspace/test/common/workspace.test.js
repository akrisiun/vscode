/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/path", "vs/platform/workspace/common/workspace", "vs/base/common/uri", "vs/base/common/platform"], function (require, exports, assert, path, workspace_1, uri_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workspace', () => {
        const fileFolder = platform_1.isWindows ? 'c:\\src' : '/src';
        const abcFolder = platform_1.isWindows ? 'c:\\abc' : '/abc';
        const testFolderUri = uri_1.URI.file(path.join(fileFolder, 'test'));
        const mainFolderUri = uri_1.URI.file(path.join(fileFolder, 'main'));
        const test1FolderUri = uri_1.URI.file(path.join(fileFolder, 'test1'));
        const test2FolderUri = uri_1.URI.file(path.join(fileFolder, 'test2'));
        const test3FolderUri = uri_1.URI.file(path.join(fileFolder, 'test3'));
        const abcTest1FolderUri = uri_1.URI.file(path.join(abcFolder, 'test1'));
        const abcTest3FolderUri = uri_1.URI.file(path.join(abcFolder, 'test3'));
        const workspaceConfigUri = uri_1.URI.file(path.join(fileFolder, 'test.code-workspace'));
        test('getFolder returns the folder with given uri', () => {
            const expected = new workspace_1.WorkspaceFolder({ uri: testFolderUri, name: '', index: 2 });
            let testObject = new workspace_1.Workspace('', [new workspace_1.WorkspaceFolder({ uri: mainFolderUri, name: '', index: 0 }), expected, new workspace_1.WorkspaceFolder({ uri: uri_1.URI.file('/src/code'), name: '', index: 2 })]);
            const actual = testObject.getFolder(expected.uri);
            assert.equal(actual, expected);
        });
        test('getFolder returns the folder if the uri is sub', () => {
            const expected = new workspace_1.WorkspaceFolder({ uri: testFolderUri, name: '', index: 0 });
            let testObject = new workspace_1.Workspace('', [expected, new workspace_1.WorkspaceFolder({ uri: mainFolderUri, name: '', index: 1 }), new workspace_1.WorkspaceFolder({ uri: uri_1.URI.file('/src/code'), name: '', index: 2 })]);
            const actual = testObject.getFolder(uri_1.URI.file(path.join(fileFolder, 'test/a')));
            assert.equal(actual, expected);
        });
        test('getFolder returns the closest folder if the uri is sub', () => {
            const expected = new workspace_1.WorkspaceFolder({ uri: testFolderUri, name: '', index: 2 });
            let testObject = new workspace_1.Workspace('', [new workspace_1.WorkspaceFolder({ uri: mainFolderUri, name: '', index: 0 }), new workspace_1.WorkspaceFolder({ uri: uri_1.URI.file('/src/code'), name: '', index: 1 }), expected]);
            const actual = testObject.getFolder(uri_1.URI.file(path.join(fileFolder, 'test/a')));
            assert.equal(actual, expected);
        });
        test('getFolder returns the folder even if the uri has query path', () => {
            const expected = new workspace_1.WorkspaceFolder({ uri: testFolderUri, name: '', index: 2 });
            let testObject = new workspace_1.Workspace('', [new workspace_1.WorkspaceFolder({ uri: mainFolderUri, name: '', index: 0 }), new workspace_1.WorkspaceFolder({ uri: uri_1.URI.file('/src/code'), name: '', index: 1 }), expected]);
            const actual = testObject.getFolder(uri_1.URI.file(path.join(fileFolder, 'test/a')).with({ query: 'somequery' }));
            assert.equal(actual, expected);
        });
        test('getFolder returns null if the uri is not sub', () => {
            let testObject = new workspace_1.Workspace('', [new workspace_1.WorkspaceFolder({ uri: testFolderUri, name: '', index: 0 }), new workspace_1.WorkspaceFolder({ uri: uri_1.URI.file('/src/code'), name: '', index: 1 })]);
            const actual = testObject.getFolder(uri_1.URI.file(path.join(fileFolder, 'main/a')));
            assert.equal(actual, undefined);
        });
        test('toWorkspaceFolders with single absolute folder', () => {
            const actual = workspace_1.toWorkspaceFolders([{ path: '/src/test' }], workspaceConfigUri);
            assert.equal(actual.length, 1);
            assert.equal(actual[0].uri.fsPath, testFolderUri.fsPath);
            assert.equal(actual[0].raw.path, '/src/test');
            assert.equal(actual[0].index, 0);
            assert.equal(actual[0].name, 'test');
        });
        test('toWorkspaceFolders with single relative folder', () => {
            const actual = workspace_1.toWorkspaceFolders([{ path: './test' }], workspaceConfigUri);
            assert.equal(actual.length, 1);
            assert.equal(actual[0].uri.fsPath, testFolderUri.fsPath);
            assert.equal(actual[0].raw.path, './test');
            assert.equal(actual[0].index, 0);
            assert.equal(actual[0].name, 'test');
        });
        test('toWorkspaceFolders with single absolute folder with name', () => {
            const actual = workspace_1.toWorkspaceFolders([{ path: '/src/test', name: 'hello' }], workspaceConfigUri);
            assert.equal(actual.length, 1);
            assert.equal(actual[0].uri.fsPath, testFolderUri.fsPath);
            assert.equal(actual[0].raw.path, '/src/test');
            assert.equal(actual[0].index, 0);
            assert.equal(actual[0].name, 'hello');
        });
        test('toWorkspaceFolders with multiple unique absolute folders', () => {
            const actual = workspace_1.toWorkspaceFolders([{ path: '/src/test2' }, { path: '/src/test3' }, { path: '/src/test1' }], workspaceConfigUri);
            assert.equal(actual.length, 3);
            assert.equal(actual[0].uri.fsPath, test2FolderUri.fsPath);
            assert.equal(actual[0].raw.path, '/src/test2');
            assert.equal(actual[0].index, 0);
            assert.equal(actual[0].name, 'test2');
            assert.equal(actual[1].uri.fsPath, test3FolderUri.fsPath);
            assert.equal(actual[1].raw.path, '/src/test3');
            assert.equal(actual[1].index, 1);
            assert.equal(actual[1].name, 'test3');
            assert.equal(actual[2].uri.fsPath, test1FolderUri.fsPath);
            assert.equal(actual[2].raw.path, '/src/test1');
            assert.equal(actual[2].index, 2);
            assert.equal(actual[2].name, 'test1');
        });
        test('toWorkspaceFolders with multiple unique absolute folders with names', () => {
            const actual = workspace_1.toWorkspaceFolders([{ path: '/src/test2' }, { path: '/src/test3', name: 'noName' }, { path: '/src/test1' }], workspaceConfigUri);
            assert.equal(actual.length, 3);
            assert.equal(actual[0].uri.fsPath, test2FolderUri.fsPath);
            assert.equal(actual[0].raw.path, '/src/test2');
            assert.equal(actual[0].index, 0);
            assert.equal(actual[0].name, 'test2');
            assert.equal(actual[1].uri.fsPath, test3FolderUri.fsPath);
            assert.equal(actual[1].raw.path, '/src/test3');
            assert.equal(actual[1].index, 1);
            assert.equal(actual[1].name, 'noName');
            assert.equal(actual[2].uri.fsPath, test1FolderUri.fsPath);
            assert.equal(actual[2].raw.path, '/src/test1');
            assert.equal(actual[2].index, 2);
            assert.equal(actual[2].name, 'test1');
        });
        test('toWorkspaceFolders with multiple unique absolute and relative folders', () => {
            const actual = workspace_1.toWorkspaceFolders([{ path: '/src/test2' }, { path: '/abc/test3', name: 'noName' }, { path: './test1' }], workspaceConfigUri);
            assert.equal(actual.length, 3);
            assert.equal(actual[0].uri.fsPath, test2FolderUri.fsPath);
            assert.equal(actual[0].raw.path, '/src/test2');
            assert.equal(actual[0].index, 0);
            assert.equal(actual[0].name, 'test2');
            assert.equal(actual[1].uri.fsPath, abcTest3FolderUri.fsPath);
            assert.equal(actual[1].raw.path, '/abc/test3');
            assert.equal(actual[1].index, 1);
            assert.equal(actual[1].name, 'noName');
            assert.equal(actual[2].uri.fsPath, test1FolderUri.fsPath);
            assert.equal(actual[2].raw.path, './test1');
            assert.equal(actual[2].index, 2);
            assert.equal(actual[2].name, 'test1');
        });
        test('toWorkspaceFolders with multiple absolute folders with duplicates', () => {
            const actual = workspace_1.toWorkspaceFolders([{ path: '/src/test2' }, { path: '/src/test2', name: 'noName' }, { path: '/src/test1' }], workspaceConfigUri);
            assert.equal(actual.length, 2);
            assert.equal(actual[0].uri.fsPath, test2FolderUri.fsPath);
            assert.equal(actual[0].raw.path, '/src/test2');
            assert.equal(actual[0].index, 0);
            assert.equal(actual[0].name, 'test2');
            assert.equal(actual[1].uri.fsPath, test1FolderUri.fsPath);
            assert.equal(actual[1].raw.path, '/src/test1');
            assert.equal(actual[1].index, 1);
            assert.equal(actual[1].name, 'test1');
        });
        test('toWorkspaceFolders with multiple absolute and relative folders with duplicates', () => {
            const actual = workspace_1.toWorkspaceFolders([{ path: '/src/test2' }, { path: '/src/test3', name: 'noName' }, { path: './test3' }, { path: '/abc/test1' }], workspaceConfigUri);
            assert.equal(actual.length, 3);
            assert.equal(actual[0].uri.fsPath, test2FolderUri.fsPath);
            assert.equal(actual[0].raw.path, '/src/test2');
            assert.equal(actual[0].index, 0);
            assert.equal(actual[0].name, 'test2');
            assert.equal(actual[1].uri.fsPath, test3FolderUri.fsPath);
            assert.equal(actual[1].raw.path, '/src/test3');
            assert.equal(actual[1].index, 1);
            assert.equal(actual[1].name, 'noName');
            assert.equal(actual[2].uri.fsPath, abcTest1FolderUri.fsPath);
            assert.equal(actual[2].raw.path, '/abc/test1');
            assert.equal(actual[2].index, 2);
            assert.equal(actual[2].name, 'test1');
        });
        test('toWorkspaceFolders with multiple absolute and relative folders with invalid paths', () => {
            const actual = workspace_1.toWorkspaceFolders([{ path: '/src/test2' }, { path: '', name: 'noName' }, { path: './test3' }, { path: '/abc/test1' }], workspaceConfigUri);
            assert.equal(actual.length, 3);
            assert.equal(actual[0].uri.fsPath, test2FolderUri.fsPath);
            assert.equal(actual[0].raw.path, '/src/test2');
            assert.equal(actual[0].index, 0);
            assert.equal(actual[0].name, 'test2');
            assert.equal(actual[1].uri.fsPath, test3FolderUri.fsPath);
            assert.equal(actual[1].raw.path, './test3');
            assert.equal(actual[1].index, 1);
            assert.equal(actual[1].name, 'test3');
            assert.equal(actual[2].uri.fsPath, abcTest1FolderUri.fsPath);
            assert.equal(actual[2].raw.path, '/abc/test1');
            assert.equal(actual[2].index, 2);
            assert.equal(actual[2].name, 'test1');
        });
    });
});
//# sourceMappingURL=workspace.test.js.map