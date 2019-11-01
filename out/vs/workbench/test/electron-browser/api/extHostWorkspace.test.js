/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/base/common/path", "vs/base/common/uri", "vs/platform/extensions/common/extensions", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostWorkspace", "vs/workbench/test/electron-browser/api/mock", "./testRPCProtocol", "vs/workbench/api/common/extHostRpcService"], function (require, exports, assert, cancellation_1, path_1, uri_1, extensions_1, log_1, extHost_protocol_1, extHostTypes_1, extHostWorkspace_1, mock_1, testRPCProtocol_1, extHostRpcService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createExtHostWorkspace(mainContext, data, logService) {
        const result = new extHostWorkspace_1.ExtHostWorkspace(new extHostRpcService_1.ExtHostRpcService(mainContext), new class extends mock_1.mock() {
            constructor() {
                super(...arguments);
                this.workspace = data;
            }
        }, logService);
        result.$initializeWorkspace(data);
        return result;
    }
    suite('ExtHostWorkspace', function () {
        const extensionDescriptor = {
            identifier: new extensions_1.ExtensionIdentifier('nullExtensionDescription'),
            name: 'ext',
            publisher: 'vscode',
            enableProposedApi: false,
            engines: undefined,
            extensionLocation: undefined,
            isBuiltin: false,
            isUnderDevelopment: false,
            version: undefined
        };
        function assertAsRelativePath(workspace, input, expected, includeWorkspace) {
            const actual = workspace.getRelativePath(input, includeWorkspace);
            assert.equal(actual, expected);
        }
        test('asRelativePath', () => {
            const ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file('/Coding/Applications/NewsWoWBot'), 0)], name: 'Test' }, new log_1.NullLogService());
            assertAsRelativePath(ws, '/Coding/Applications/NewsWoWBot/bernd/das/brot', 'bernd/das/brot');
            assertAsRelativePath(ws, '/Apps/DartPubCache/hosted/pub.dartlang.org/convert-2.0.1/lib/src/hex.dart', '/Apps/DartPubCache/hosted/pub.dartlang.org/convert-2.0.1/lib/src/hex.dart');
            assertAsRelativePath(ws, '', '');
            assertAsRelativePath(ws, '/foo/bar', '/foo/bar');
            assertAsRelativePath(ws, 'in/out', 'in/out');
        });
        test('asRelativePath, same paths, #11402', function () {
            const root = '/home/aeschli/workspaces/samples/docker';
            const input = '/home/aeschli/workspaces/samples/docker';
            const ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file(root), 0)], name: 'Test' }, new log_1.NullLogService());
            assertAsRelativePath(ws, input, input);
            const input2 = '/home/aeschli/workspaces/samples/docker/a.file';
            assertAsRelativePath(ws, input2, 'a.file');
        });
        test('asRelativePath, no workspace', function () {
            const ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), null, new log_1.NullLogService());
            assertAsRelativePath(ws, '', '');
            assertAsRelativePath(ws, '/foo/bar', '/foo/bar');
        });
        test('asRelativePath, multiple folders', function () {
            const ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file('/Coding/One'), 0), aWorkspaceFolderData(uri_1.URI.file('/Coding/Two'), 1)], name: 'Test' }, new log_1.NullLogService());
            assertAsRelativePath(ws, '/Coding/One/file.txt', 'One/file.txt');
            assertAsRelativePath(ws, '/Coding/Two/files/out.txt', 'Two/files/out.txt');
            assertAsRelativePath(ws, '/Coding/Two2/files/out.txt', '/Coding/Two2/files/out.txt');
        });
        test('slightly inconsistent behaviour of asRelativePath and getWorkspaceFolder, #31553', function () {
            const mrws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file('/Coding/One'), 0), aWorkspaceFolderData(uri_1.URI.file('/Coding/Two'), 1)], name: 'Test' }, new log_1.NullLogService());
            assertAsRelativePath(mrws, '/Coding/One/file.txt', 'One/file.txt');
            assertAsRelativePath(mrws, '/Coding/One/file.txt', 'One/file.txt', true);
            assertAsRelativePath(mrws, '/Coding/One/file.txt', 'file.txt', false);
            assertAsRelativePath(mrws, '/Coding/Two/files/out.txt', 'Two/files/out.txt');
            assertAsRelativePath(mrws, '/Coding/Two/files/out.txt', 'Two/files/out.txt', true);
            assertAsRelativePath(mrws, '/Coding/Two/files/out.txt', 'files/out.txt', false);
            assertAsRelativePath(mrws, '/Coding/Two2/files/out.txt', '/Coding/Two2/files/out.txt');
            assertAsRelativePath(mrws, '/Coding/Two2/files/out.txt', '/Coding/Two2/files/out.txt', true);
            assertAsRelativePath(mrws, '/Coding/Two2/files/out.txt', '/Coding/Two2/files/out.txt', false);
            const srws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file('/Coding/One'), 0)], name: 'Test' }, new log_1.NullLogService());
            assertAsRelativePath(srws, '/Coding/One/file.txt', 'file.txt');
            assertAsRelativePath(srws, '/Coding/One/file.txt', 'file.txt', false);
            assertAsRelativePath(srws, '/Coding/One/file.txt', 'One/file.txt', true);
            assertAsRelativePath(srws, '/Coding/Two2/files/out.txt', '/Coding/Two2/files/out.txt');
            assertAsRelativePath(srws, '/Coding/Two2/files/out.txt', '/Coding/Two2/files/out.txt', true);
            assertAsRelativePath(srws, '/Coding/Two2/files/out.txt', '/Coding/Two2/files/out.txt', false);
        });
        test('getPath, legacy', function () {
            let ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', name: 'Test', folders: [] }, new log_1.NullLogService());
            assert.equal(ws.getPath(), undefined);
            ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), null, new log_1.NullLogService());
            assert.equal(ws.getPath(), undefined);
            ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), undefined, new log_1.NullLogService());
            assert.equal(ws.getPath(), undefined);
            ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.file('Folder'), 0), aWorkspaceFolderData(uri_1.URI.file('Another/Folder'), 1)] }, new log_1.NullLogService());
            assert.equal(ws.getPath().replace(/\\/g, '/'), '/Folder');
            ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.file('/Folder'), 0)] }, new log_1.NullLogService());
            assert.equal(ws.getPath().replace(/\\/g, '/'), '/Folder');
        });
        test('WorkspaceFolder has name and index', function () {
            const ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file('/Coding/One'), 0), aWorkspaceFolderData(uri_1.URI.file('/Coding/Two'), 1)], name: 'Test' }, new log_1.NullLogService());
            const [one, two] = ws.getWorkspaceFolders();
            assert.equal(one.name, 'One');
            assert.equal(one.index, 0);
            assert.equal(two.name, 'Two');
            assert.equal(two.index, 1);
        });
        test('getContainingWorkspaceFolder', () => {
            const ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), {
                id: 'foo',
                name: 'Test',
                folders: [
                    aWorkspaceFolderData(uri_1.URI.file('/Coding/One'), 0),
                    aWorkspaceFolderData(uri_1.URI.file('/Coding/Two'), 1),
                    aWorkspaceFolderData(uri_1.URI.file('/Coding/Two/Nested'), 2)
                ]
            }, new log_1.NullLogService());
            let folder = ws.getWorkspaceFolder(uri_1.URI.file('/foo/bar'));
            assert.equal(folder, undefined);
            folder = ws.getWorkspaceFolder(uri_1.URI.file('/Coding/One/file/path.txt'));
            assert.equal(folder.name, 'One');
            folder = ws.getWorkspaceFolder(uri_1.URI.file('/Coding/Two/file/path.txt'));
            assert.equal(folder.name, 'Two');
            folder = ws.getWorkspaceFolder(uri_1.URI.file('/Coding/Two/Nest'));
            assert.equal(folder.name, 'Two');
            folder = ws.getWorkspaceFolder(uri_1.URI.file('/Coding/Two/Nested/file'));
            assert.equal(folder.name, 'Nested');
            folder = ws.getWorkspaceFolder(uri_1.URI.file('/Coding/Two/Nested/f'));
            assert.equal(folder.name, 'Nested');
            folder = ws.getWorkspaceFolder(uri_1.URI.file('/Coding/Two/Nested'), true);
            assert.equal(folder.name, 'Two');
            folder = ws.getWorkspaceFolder(uri_1.URI.file('/Coding/Two/Nested/'), true);
            assert.equal(folder.name, 'Two');
            folder = ws.getWorkspaceFolder(uri_1.URI.file('/Coding/Two/Nested'));
            assert.equal(folder.name, 'Nested');
            folder = ws.getWorkspaceFolder(uri_1.URI.file('/Coding/Two/Nested/'));
            assert.equal(folder.name, 'Nested');
            folder = ws.getWorkspaceFolder(uri_1.URI.file('/Coding/Two'), true);
            assert.equal(folder, undefined);
            folder = ws.getWorkspaceFolder(uri_1.URI.file('/Coding/Two'), false);
            assert.equal(folder.name, 'Two');
        });
        test('Multiroot change event should have a delta, #29641', function (done) {
            let ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', name: 'Test', folders: [] }, new log_1.NullLogService());
            let finished = false;
            const finish = (error) => {
                if (!finished) {
                    finished = true;
                    done(error);
                }
            };
            let sub = ws.onDidChangeWorkspace(e => {
                try {
                    assert.deepEqual(e.added, []);
                    assert.deepEqual(e.removed, []);
                }
                catch (error) {
                    finish(error);
                }
            });
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [] });
            sub.dispose();
            sub = ws.onDidChangeWorkspace(e => {
                try {
                    assert.deepEqual(e.removed, []);
                    assert.equal(e.added.length, 1);
                    assert.equal(e.added[0].uri.toString(), 'foo:bar');
                }
                catch (error) {
                    finish(error);
                }
            });
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar'), 0)] });
            sub.dispose();
            sub = ws.onDidChangeWorkspace(e => {
                try {
                    assert.deepEqual(e.removed, []);
                    assert.equal(e.added.length, 1);
                    assert.equal(e.added[0].uri.toString(), 'foo:bar2');
                }
                catch (error) {
                    finish(error);
                }
            });
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar'), 0), aWorkspaceFolderData(uri_1.URI.parse('foo:bar2'), 1)] });
            sub.dispose();
            sub = ws.onDidChangeWorkspace(e => {
                try {
                    assert.equal(e.removed.length, 2);
                    assert.equal(e.removed[0].uri.toString(), 'foo:bar');
                    assert.equal(e.removed[1].uri.toString(), 'foo:bar2');
                    assert.equal(e.added.length, 1);
                    assert.equal(e.added[0].uri.toString(), 'foo:bar3');
                }
                catch (error) {
                    finish(error);
                }
            });
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar3'), 0)] });
            sub.dispose();
            finish();
        });
        test('Multiroot change keeps existing workspaces live', function () {
            let ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar'), 0)] }, new log_1.NullLogService());
            let firstFolder = ws.getWorkspaceFolders()[0];
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar2'), 0), aWorkspaceFolderData(uri_1.URI.parse('foo:bar'), 1, 'renamed')] });
            assert.equal(ws.getWorkspaceFolders()[1], firstFolder);
            assert.equal(firstFolder.index, 1);
            assert.equal(firstFolder.name, 'renamed');
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar3'), 0), aWorkspaceFolderData(uri_1.URI.parse('foo:bar2'), 1), aWorkspaceFolderData(uri_1.URI.parse('foo:bar'), 2)] });
            assert.equal(ws.getWorkspaceFolders()[2], firstFolder);
            assert.equal(firstFolder.index, 2);
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar3'), 0)] });
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar3'), 0), aWorkspaceFolderData(uri_1.URI.parse('foo:bar'), 1)] });
            assert.notEqual(firstFolder, ws.workspace.folders[0]);
        });
        test('updateWorkspaceFolders - invalid arguments', function () {
            let ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', name: 'Test', folders: [] }, new log_1.NullLogService());
            assert.equal(false, ws.updateWorkspaceFolders(extensionDescriptor, null, null));
            assert.equal(false, ws.updateWorkspaceFolders(extensionDescriptor, 0, 0));
            assert.equal(false, ws.updateWorkspaceFolders(extensionDescriptor, 0, 1));
            assert.equal(false, ws.updateWorkspaceFolders(extensionDescriptor, 1, 0));
            assert.equal(false, ws.updateWorkspaceFolders(extensionDescriptor, -1, 0));
            assert.equal(false, ws.updateWorkspaceFolders(extensionDescriptor, -1, -1));
            ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar'), 0)] }, new log_1.NullLogService());
            assert.equal(false, ws.updateWorkspaceFolders(extensionDescriptor, 1, 1));
            assert.equal(false, ws.updateWorkspaceFolders(extensionDescriptor, 0, 2));
            assert.equal(false, ws.updateWorkspaceFolders(extensionDescriptor, 0, 1, asUpdateWorkspaceFolderData(uri_1.URI.parse('foo:bar'))));
        });
        test('updateWorkspaceFolders - valid arguments', function (done) {
            let finished = false;
            const finish = (error) => {
                if (!finished) {
                    finished = true;
                    done(error);
                }
            };
            const protocol = {
                getProxy: () => { return undefined; },
                set: () => { return undefined; },
                assertRegistered: () => { }
            };
            const ws = createExtHostWorkspace(protocol, { id: 'foo', name: 'Test', folders: [] }, new log_1.NullLogService());
            //
            // Add one folder
            //
            assert.equal(true, ws.updateWorkspaceFolders(extensionDescriptor, 0, 0, asUpdateWorkspaceFolderData(uri_1.URI.parse('foo:bar'))));
            assert.equal(1, ws.workspace.folders.length);
            assert.equal(ws.workspace.folders[0].uri.toString(), uri_1.URI.parse('foo:bar').toString());
            const firstAddedFolder = ws.getWorkspaceFolders()[0];
            let gotEvent = false;
            let sub = ws.onDidChangeWorkspace(e => {
                try {
                    assert.deepEqual(e.removed, []);
                    assert.equal(e.added.length, 1);
                    assert.equal(e.added[0].uri.toString(), 'foo:bar');
                    assert.equal(e.added[0], firstAddedFolder); // verify object is still live
                    gotEvent = true;
                }
                catch (error) {
                    finish(error);
                }
            });
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar'), 0)] }); // simulate acknowledgement from main side
            assert.equal(gotEvent, true);
            sub.dispose();
            assert.equal(ws.getWorkspaceFolders()[0], firstAddedFolder); // verify object is still live
            //
            // Add two more folders
            //
            assert.equal(true, ws.updateWorkspaceFolders(extensionDescriptor, 1, 0, asUpdateWorkspaceFolderData(uri_1.URI.parse('foo:bar1')), asUpdateWorkspaceFolderData(uri_1.URI.parse('foo:bar2'))));
            assert.equal(3, ws.workspace.folders.length);
            assert.equal(ws.workspace.folders[0].uri.toString(), uri_1.URI.parse('foo:bar').toString());
            assert.equal(ws.workspace.folders[1].uri.toString(), uri_1.URI.parse('foo:bar1').toString());
            assert.equal(ws.workspace.folders[2].uri.toString(), uri_1.URI.parse('foo:bar2').toString());
            const secondAddedFolder = ws.getWorkspaceFolders()[1];
            const thirdAddedFolder = ws.getWorkspaceFolders()[2];
            gotEvent = false;
            sub = ws.onDidChangeWorkspace(e => {
                try {
                    assert.deepEqual(e.removed, []);
                    assert.equal(e.added.length, 2);
                    assert.equal(e.added[0].uri.toString(), 'foo:bar1');
                    assert.equal(e.added[1].uri.toString(), 'foo:bar2');
                    assert.equal(e.added[0], secondAddedFolder);
                    assert.equal(e.added[1], thirdAddedFolder);
                    gotEvent = true;
                }
                catch (error) {
                    finish(error);
                }
            });
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar'), 0), aWorkspaceFolderData(uri_1.URI.parse('foo:bar1'), 1), aWorkspaceFolderData(uri_1.URI.parse('foo:bar2'), 2)] }); // simulate acknowledgement from main side
            assert.equal(gotEvent, true);
            sub.dispose();
            assert.equal(ws.getWorkspaceFolders()[0], firstAddedFolder); // verify object is still live
            assert.equal(ws.getWorkspaceFolders()[1], secondAddedFolder); // verify object is still live
            assert.equal(ws.getWorkspaceFolders()[2], thirdAddedFolder); // verify object is still live
            //
            // Remove one folder
            //
            assert.equal(true, ws.updateWorkspaceFolders(extensionDescriptor, 2, 1));
            assert.equal(2, ws.workspace.folders.length);
            assert.equal(ws.workspace.folders[0].uri.toString(), uri_1.URI.parse('foo:bar').toString());
            assert.equal(ws.workspace.folders[1].uri.toString(), uri_1.URI.parse('foo:bar1').toString());
            gotEvent = false;
            sub = ws.onDidChangeWorkspace(e => {
                try {
                    assert.deepEqual(e.added, []);
                    assert.equal(e.removed.length, 1);
                    assert.equal(e.removed[0], thirdAddedFolder);
                    gotEvent = true;
                }
                catch (error) {
                    finish(error);
                }
            });
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar'), 0), aWorkspaceFolderData(uri_1.URI.parse('foo:bar1'), 1)] }); // simulate acknowledgement from main side
            assert.equal(gotEvent, true);
            sub.dispose();
            assert.equal(ws.getWorkspaceFolders()[0], firstAddedFolder); // verify object is still live
            assert.equal(ws.getWorkspaceFolders()[1], secondAddedFolder); // verify object is still live
            //
            // Rename folder
            //
            assert.equal(true, ws.updateWorkspaceFolders(extensionDescriptor, 0, 2, asUpdateWorkspaceFolderData(uri_1.URI.parse('foo:bar'), 'renamed 1'), asUpdateWorkspaceFolderData(uri_1.URI.parse('foo:bar1'), 'renamed 2')));
            assert.equal(2, ws.workspace.folders.length);
            assert.equal(ws.workspace.folders[0].uri.toString(), uri_1.URI.parse('foo:bar').toString());
            assert.equal(ws.workspace.folders[1].uri.toString(), uri_1.URI.parse('foo:bar1').toString());
            assert.equal(ws.workspace.folders[0].name, 'renamed 1');
            assert.equal(ws.workspace.folders[1].name, 'renamed 2');
            assert.equal(ws.getWorkspaceFolders()[0].name, 'renamed 1');
            assert.equal(ws.getWorkspaceFolders()[1].name, 'renamed 2');
            gotEvent = false;
            sub = ws.onDidChangeWorkspace(e => {
                try {
                    assert.deepEqual(e.added, []);
                    assert.equal(e.removed.length, []);
                    gotEvent = true;
                }
                catch (error) {
                    finish(error);
                }
            });
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar'), 0, 'renamed 1'), aWorkspaceFolderData(uri_1.URI.parse('foo:bar1'), 1, 'renamed 2')] }); // simulate acknowledgement from main side
            assert.equal(gotEvent, true);
            sub.dispose();
            assert.equal(ws.getWorkspaceFolders()[0], firstAddedFolder); // verify object is still live
            assert.equal(ws.getWorkspaceFolders()[1], secondAddedFolder); // verify object is still live
            assert.equal(ws.workspace.folders[0].name, 'renamed 1');
            assert.equal(ws.workspace.folders[1].name, 'renamed 2');
            assert.equal(ws.getWorkspaceFolders()[0].name, 'renamed 1');
            assert.equal(ws.getWorkspaceFolders()[1].name, 'renamed 2');
            //
            // Add and remove folders
            //
            assert.equal(true, ws.updateWorkspaceFolders(extensionDescriptor, 0, 2, asUpdateWorkspaceFolderData(uri_1.URI.parse('foo:bar3')), asUpdateWorkspaceFolderData(uri_1.URI.parse('foo:bar4'))));
            assert.equal(2, ws.workspace.folders.length);
            assert.equal(ws.workspace.folders[0].uri.toString(), uri_1.URI.parse('foo:bar3').toString());
            assert.equal(ws.workspace.folders[1].uri.toString(), uri_1.URI.parse('foo:bar4').toString());
            const fourthAddedFolder = ws.getWorkspaceFolders()[0];
            const fifthAddedFolder = ws.getWorkspaceFolders()[1];
            gotEvent = false;
            sub = ws.onDidChangeWorkspace(e => {
                try {
                    assert.equal(e.added.length, 2);
                    assert.equal(e.added[0], fourthAddedFolder);
                    assert.equal(e.added[1], fifthAddedFolder);
                    assert.equal(e.removed.length, 2);
                    assert.equal(e.removed[0], firstAddedFolder);
                    assert.equal(e.removed[1], secondAddedFolder);
                    gotEvent = true;
                }
                catch (error) {
                    finish(error);
                }
            });
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar3'), 0), aWorkspaceFolderData(uri_1.URI.parse('foo:bar4'), 1)] }); // simulate acknowledgement from main side
            assert.equal(gotEvent, true);
            sub.dispose();
            assert.equal(ws.getWorkspaceFolders()[0], fourthAddedFolder); // verify object is still live
            assert.equal(ws.getWorkspaceFolders()[1], fifthAddedFolder); // verify object is still live
            //
            // Swap folders
            //
            assert.equal(true, ws.updateWorkspaceFolders(extensionDescriptor, 0, 2, asUpdateWorkspaceFolderData(uri_1.URI.parse('foo:bar4')), asUpdateWorkspaceFolderData(uri_1.URI.parse('foo:bar3'))));
            assert.equal(2, ws.workspace.folders.length);
            assert.equal(ws.workspace.folders[0].uri.toString(), uri_1.URI.parse('foo:bar4').toString());
            assert.equal(ws.workspace.folders[1].uri.toString(), uri_1.URI.parse('foo:bar3').toString());
            assert.equal(ws.getWorkspaceFolders()[0], fifthAddedFolder); // verify object is still live
            assert.equal(ws.getWorkspaceFolders()[1], fourthAddedFolder); // verify object is still live
            gotEvent = false;
            sub = ws.onDidChangeWorkspace(e => {
                try {
                    assert.equal(e.added.length, 0);
                    assert.equal(e.removed.length, 0);
                    gotEvent = true;
                }
                catch (error) {
                    finish(error);
                }
            });
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar4'), 0), aWorkspaceFolderData(uri_1.URI.parse('foo:bar3'), 1)] }); // simulate acknowledgement from main side
            assert.equal(gotEvent, true);
            sub.dispose();
            assert.equal(ws.getWorkspaceFolders()[0], fifthAddedFolder); // verify object is still live
            assert.equal(ws.getWorkspaceFolders()[1], fourthAddedFolder); // verify object is still live
            assert.equal(fifthAddedFolder.index, 0);
            assert.equal(fourthAddedFolder.index, 1);
            //
            // Add one folder after the other without waiting for confirmation (not supported currently)
            //
            assert.equal(true, ws.updateWorkspaceFolders(extensionDescriptor, 2, 0, asUpdateWorkspaceFolderData(uri_1.URI.parse('foo:bar5'))));
            assert.equal(3, ws.workspace.folders.length);
            assert.equal(ws.workspace.folders[0].uri.toString(), uri_1.URI.parse('foo:bar4').toString());
            assert.equal(ws.workspace.folders[1].uri.toString(), uri_1.URI.parse('foo:bar3').toString());
            assert.equal(ws.workspace.folders[2].uri.toString(), uri_1.URI.parse('foo:bar5').toString());
            const sixthAddedFolder = ws.getWorkspaceFolders()[2];
            gotEvent = false;
            sub = ws.onDidChangeWorkspace(e => {
                try {
                    assert.equal(e.added.length, 1);
                    assert.equal(e.added[0], sixthAddedFolder);
                    gotEvent = true;
                }
                catch (error) {
                    finish(error);
                }
            });
            ws.$acceptWorkspaceData({
                id: 'foo', name: 'Test', folders: [
                    aWorkspaceFolderData(uri_1.URI.parse('foo:bar4'), 0),
                    aWorkspaceFolderData(uri_1.URI.parse('foo:bar3'), 1),
                    aWorkspaceFolderData(uri_1.URI.parse('foo:bar5'), 2)
                ]
            }); // simulate acknowledgement from main side
            assert.equal(gotEvent, true);
            sub.dispose();
            assert.equal(ws.getWorkspaceFolders()[0], fifthAddedFolder); // verify object is still live
            assert.equal(ws.getWorkspaceFolders()[1], fourthAddedFolder); // verify object is still live
            assert.equal(ws.getWorkspaceFolders()[2], sixthAddedFolder); // verify object is still live
            finish();
        });
        test('Multiroot change event is immutable', function (done) {
            let finished = false;
            const finish = (error) => {
                if (!finished) {
                    finished = true;
                    done(error);
                }
            };
            let ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', name: 'Test', folders: [] }, new log_1.NullLogService());
            let sub = ws.onDidChangeWorkspace(e => {
                try {
                    assert.throws(() => {
                        e.added = [];
                    });
                    // assert.throws(() => {
                    // 	(<any>e.added)[0] = null;
                    // });
                }
                catch (error) {
                    finish(error);
                }
            });
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [] });
            sub.dispose();
            finish();
        });
        test('`vscode.workspace.getWorkspaceFolder(file)` don\'t return workspace folder when file open from command line. #36221', function () {
            let ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), {
                id: 'foo', name: 'Test', folders: [
                    aWorkspaceFolderData(uri_1.URI.file('c:/Users/marek/Desktop/vsc_test/'), 0)
                ]
            }, new log_1.NullLogService());
            assert.ok(ws.getWorkspaceFolder(uri_1.URI.file('c:/Users/marek/Desktop/vsc_test/a.txt')));
            assert.ok(ws.getWorkspaceFolder(uri_1.URI.file('C:/Users/marek/Desktop/vsc_test/b.txt')));
        });
        function aWorkspaceFolderData(uri, index, name = '') {
            return {
                uri,
                index,
                name: name || path_1.basename(uri.path)
            };
        }
        function asUpdateWorkspaceFolderData(uri, name) {
            return { uri, name };
        }
        test('findFiles - string include', () => {
            const root = '/project/foo';
            const rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            let mainThreadCalled = false;
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadWorkspace, new class extends mock_1.mock() {
                $startFileSearch(includePattern, _includeFolder, excludePatternOrDisregardExcludes, maxResults, token) {
                    mainThreadCalled = true;
                    assert.equal(includePattern, 'foo');
                    assert.equal(_includeFolder, null);
                    assert.equal(excludePatternOrDisregardExcludes, null);
                    assert.equal(maxResults, 10);
                    return Promise.resolve(null);
                }
            });
            const ws = createExtHostWorkspace(rpcProtocol, { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file(root), 0)], name: 'Test' }, new log_1.NullLogService());
            return ws.findFiles('foo', undefined, 10, new extensions_1.ExtensionIdentifier('test')).then(() => {
                assert(mainThreadCalled, 'mainThreadCalled');
            });
        });
        test('findFiles - RelativePattern include', () => {
            const root = '/project/foo';
            const rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            let mainThreadCalled = false;
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadWorkspace, new class extends mock_1.mock() {
                $startFileSearch(includePattern, _includeFolder, excludePatternOrDisregardExcludes, maxResults, token) {
                    mainThreadCalled = true;
                    assert.equal(includePattern, 'glob/**');
                    assert.deepEqual(_includeFolder, uri_1.URI.file('/other/folder').toJSON());
                    assert.equal(excludePatternOrDisregardExcludes, null);
                    return Promise.resolve(null);
                }
            });
            const ws = createExtHostWorkspace(rpcProtocol, { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file(root), 0)], name: 'Test' }, new log_1.NullLogService());
            return ws.findFiles(new extHostTypes_1.RelativePattern('/other/folder', 'glob/**'), undefined, 10, new extensions_1.ExtensionIdentifier('test')).then(() => {
                assert(mainThreadCalled, 'mainThreadCalled');
            });
        });
        test('findFiles - no excludes', () => {
            const root = '/project/foo';
            const rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            let mainThreadCalled = false;
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadWorkspace, new class extends mock_1.mock() {
                $startFileSearch(includePattern, _includeFolder, excludePatternOrDisregardExcludes, maxResults, token) {
                    mainThreadCalled = true;
                    assert.equal(includePattern, 'glob/**');
                    assert.deepEqual(_includeFolder, uri_1.URI.file('/other/folder').toJSON());
                    assert.equal(excludePatternOrDisregardExcludes, false);
                    return Promise.resolve(null);
                }
            });
            const ws = createExtHostWorkspace(rpcProtocol, { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file(root), 0)], name: 'Test' }, new log_1.NullLogService());
            return ws.findFiles(new extHostTypes_1.RelativePattern('/other/folder', 'glob/**'), null, 10, new extensions_1.ExtensionIdentifier('test')).then(() => {
                assert(mainThreadCalled, 'mainThreadCalled');
            });
        });
        test('findFiles - with cancelled token', () => {
            const root = '/project/foo';
            const rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            let mainThreadCalled = false;
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadWorkspace, new class extends mock_1.mock() {
                $startFileSearch(includePattern, _includeFolder, excludePatternOrDisregardExcludes, maxResults, token) {
                    mainThreadCalled = true;
                    return Promise.resolve(null);
                }
            });
            const ws = createExtHostWorkspace(rpcProtocol, { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file(root), 0)], name: 'Test' }, new log_1.NullLogService());
            const token = cancellation_1.CancellationToken.Cancelled;
            return ws.findFiles(new extHostTypes_1.RelativePattern('/other/folder', 'glob/**'), null, 10, new extensions_1.ExtensionIdentifier('test'), token).then(() => {
                assert(!mainThreadCalled, '!mainThreadCalled');
            });
        });
        test('findFiles - RelativePattern exclude', () => {
            const root = '/project/foo';
            const rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            let mainThreadCalled = false;
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadWorkspace, new class extends mock_1.mock() {
                $startFileSearch(includePattern, _includeFolder, excludePatternOrDisregardExcludes, maxResults, token) {
                    mainThreadCalled = true;
                    assert(excludePatternOrDisregardExcludes, 'glob/**'); // Note that the base portion is ignored, see #52651
                    return Promise.resolve(null);
                }
            });
            const ws = createExtHostWorkspace(rpcProtocol, { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file(root), 0)], name: 'Test' }, new log_1.NullLogService());
            return ws.findFiles('', new extHostTypes_1.RelativePattern(root, 'glob/**'), 10, new extensions_1.ExtensionIdentifier('test')).then(() => {
                assert(mainThreadCalled, 'mainThreadCalled');
            });
        });
    });
});
//# sourceMappingURL=extHostWorkspace.test.js.map