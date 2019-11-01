/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "crypto", "os", "fs", "vs/base/common/path", "vs/base/node/pfs", "vs/base/common/uri", "vs/workbench/services/backup/common/backupFileService", "vs/editor/common/model/textModel", "vs/base/test/node/testUtils", "vs/base/common/network", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/platform/files/node/diskFileSystemProvider", "vs/workbench/services/environment/node/environmentService", "vs/platform/environment/node/argv", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/backup/node/backupFileService", "vs/platform/environment/common/environment", "vs/workbench/services/userData/common/fileUserDataProvider", "vs/base/common/buffer"], function (require, exports, assert, platform, crypto, os, fs, path, pfs, uri_1, backupFileService_1, textModel_1, testUtils_1, network_1, fileService_1, log_1, diskFileSystemProvider_1, environmentService_1, argv_1, textfiles_1, backupFileService_2, environment_1, fileUserDataProvider_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const userdataDir = testUtils_1.getRandomTestPath(os.tmpdir(), 'vsctests', 'backupfileservice');
    const appSettingsHome = path.join(userdataDir, 'User');
    const backupHome = path.join(userdataDir, 'Backups');
    const workspacesJsonPath = path.join(backupHome, 'workspaces.json');
    const workspaceResource = uri_1.URI.file(platform.isWindows ? 'c:\\workspace' : '/workspace');
    const workspaceBackupPath = path.join(backupHome, backupFileService_2.hashPath(workspaceResource));
    const fooFile = uri_1.URI.file(platform.isWindows ? 'c:\\Foo' : '/Foo');
    const customFile = uri_1.URI.parse('customScheme://some/path');
    const customFileWithFragment = uri_1.URI.parse('customScheme2://some/path#fragment');
    const barFile = uri_1.URI.file(platform.isWindows ? 'c:\\Bar' : '/Bar');
    const fooBarFile = uri_1.URI.file(platform.isWindows ? 'c:\\Foo Bar' : '/Foo Bar');
    const untitledFile = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: 'Untitled-1' });
    const fooBackupPath = path.join(workspaceBackupPath, 'file', backupFileService_2.hashPath(fooFile));
    const barBackupPath = path.join(workspaceBackupPath, 'file', backupFileService_2.hashPath(barFile));
    const untitledBackupPath = path.join(workspaceBackupPath, 'untitled', backupFileService_2.hashPath(untitledFile));
    class TestBackupEnvironmentService extends environmentService_1.WorkbenchEnvironmentService {
        constructor(backupPath) {
            super(Object.assign(Object.assign({}, argv_1.parseArgs(process.argv, argv_1.OPTIONS)), { backupPath, 'user-data-dir': userdataDir }), process.execPath, 0);
        }
    }
    class TestBackupFileService extends backupFileService_2.BackupFileService {
        constructor(workspace, backupHome, workspacesJsonPath) {
            const environmentService = new TestBackupEnvironmentService(workspaceBackupPath);
            const fileService = new fileService_1.FileService(new log_1.NullLogService());
            const diskFileSystemProvider = new diskFileSystemProvider_1.DiskFileSystemProvider(new log_1.NullLogService());
            fileService.registerProvider(network_1.Schemas.file, diskFileSystemProvider);
            fileService.registerProvider(network_1.Schemas.userData, new fileUserDataProvider_1.FileUserDataProvider(environmentService.appSettingsHome, environmentService.backupHome, diskFileSystemProvider, environmentService));
            super(environmentService, fileService);
            this.fileService = fileService;
        }
        toBackupResource(resource) {
            return super.toBackupResource(resource);
        }
    }
    suite('BackupFileService', () => {
        let service;
        setup(async () => {
            service = new TestBackupFileService(workspaceResource, backupHome, workspacesJsonPath);
            // Delete any existing backups completely and then re-create it.
            await pfs.rimraf(backupHome, pfs.RimRafMode.MOVE);
            await pfs.mkdirp(backupHome);
            return pfs.writeFile(workspacesJsonPath, '');
        });
        teardown(() => {
            return pfs.rimraf(backupHome, pfs.RimRafMode.MOVE);
        });
        suite('hashPath', () => {
            test('should correctly hash the path for untitled scheme URIs', () => {
                const uri = uri_1.URI.from({
                    scheme: 'untitled',
                    path: 'Untitled-1'
                });
                const actual = backupFileService_2.hashPath(uri);
                // If these hashes change people will lose their backed up files!
                assert.equal(actual, '13264068d108c6901b3592ea654fcd57');
                assert.equal(actual, crypto.createHash('md5').update(uri.fsPath).digest('hex'));
            });
            test('should correctly hash the path for file scheme URIs', () => {
                const uri = uri_1.URI.file('/foo');
                const actual = backupFileService_2.hashPath(uri);
                // If these hashes change people will lose their backed up files!
                if (platform.isWindows) {
                    assert.equal(actual, 'dec1a583f52468a020bd120c3f01d812');
                }
                else {
                    assert.equal(actual, '1effb2475fcfba4f9e8b8a1dbc8f3caf');
                }
                assert.equal(actual, crypto.createHash('md5').update(uri.fsPath).digest('hex'));
            });
        });
        suite('getBackupResource', () => {
            test('should get the correct backup path for text files', () => {
                // Format should be: <backupHome>/<workspaceHash>/<scheme>/<filePathHash>
                const backupResource = fooFile;
                const workspaceHash = backupFileService_2.hashPath(workspaceResource);
                const filePathHash = backupFileService_2.hashPath(backupResource);
                const expectedPath = uri_1.URI.file(path.join(appSettingsHome, environment_1.BACKUPS, workspaceHash, network_1.Schemas.file, filePathHash)).with({ scheme: network_1.Schemas.userData }).toString();
                assert.equal(service.toBackupResource(backupResource).toString(), expectedPath);
            });
            test('should get the correct backup path for untitled files', () => {
                // Format should be: <backupHome>/<workspaceHash>/<scheme>/<filePath>
                const backupResource = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: 'Untitled-1' });
                const workspaceHash = backupFileService_2.hashPath(workspaceResource);
                const filePathHash = backupFileService_2.hashPath(backupResource);
                const expectedPath = uri_1.URI.file(path.join(appSettingsHome, environment_1.BACKUPS, workspaceHash, network_1.Schemas.untitled, filePathHash)).with({ scheme: network_1.Schemas.userData }).toString();
                assert.equal(service.toBackupResource(backupResource).toString(), expectedPath);
            });
        });
        suite('loadBackupResource', () => {
            test('should return whether a backup resource exists', async () => {
                await pfs.mkdirp(path.dirname(fooBackupPath));
                fs.writeFileSync(fooBackupPath, 'foo');
                service = new TestBackupFileService(workspaceResource, backupHome, workspacesJsonPath);
                const resource = await service.loadBackupResource(fooFile);
                assert.ok(resource);
                assert.equal(path.basename(resource.fsPath), path.basename(fooBackupPath));
                const hasBackups = await service.hasBackups();
                assert.ok(hasBackups);
            });
        });
        suite('backupResource', () => {
            test('text file', async () => {
                await service.backupResource(fooFile, textModel_1.createTextBufferFactory('test').create(1 /* LF */).createSnapshot(false));
                assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'file')).length, 1);
                assert.equal(fs.existsSync(fooBackupPath), true);
                assert.equal(fs.readFileSync(fooBackupPath), `${fooFile.toString()}\ntest`);
                assert.ok(service.hasBackupSync(fooFile));
            });
            test('text file (with version)', async () => {
                await service.backupResource(fooFile, textModel_1.createTextBufferFactory('test').create(1 /* LF */).createSnapshot(false), 666);
                assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'file')).length, 1);
                assert.equal(fs.existsSync(fooBackupPath), true);
                assert.equal(fs.readFileSync(fooBackupPath), `${fooFile.toString()}\ntest`);
                assert.ok(!service.hasBackupSync(fooFile, 555));
                assert.ok(service.hasBackupSync(fooFile, 666));
            });
            test('text file (with meta)', async () => {
                await service.backupResource(fooFile, textModel_1.createTextBufferFactory('test').create(1 /* LF */).createSnapshot(false), undefined, { etag: '678', orphaned: true });
                assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'file')).length, 1);
                assert.equal(fs.existsSync(fooBackupPath), true);
                assert.equal(fs.readFileSync(fooBackupPath).toString(), `${fooFile.toString()} {"etag":"678","orphaned":true}\ntest`);
                assert.ok(service.hasBackupSync(fooFile));
            });
            test('untitled file', async () => {
                await service.backupResource(untitledFile, textModel_1.createTextBufferFactory('test').create(1 /* LF */).createSnapshot(false));
                assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'untitled')).length, 1);
                assert.equal(fs.existsSync(untitledBackupPath), true);
                assert.equal(fs.readFileSync(untitledBackupPath), `${untitledFile.toString()}\ntest`);
                assert.ok(service.hasBackupSync(untitledFile));
            });
            test('text file (ITextSnapshot)', async () => {
                const model = textModel_1.TextModel.createFromString('test');
                await service.backupResource(fooFile, model.createSnapshot());
                assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'file')).length, 1);
                assert.equal(fs.existsSync(fooBackupPath), true);
                assert.equal(fs.readFileSync(fooBackupPath), `${fooFile.toString()}\ntest`);
                assert.ok(service.hasBackupSync(fooFile));
                model.dispose();
            });
            test('untitled file (ITextSnapshot)', async () => {
                const model = textModel_1.TextModel.createFromString('test');
                await service.backupResource(untitledFile, model.createSnapshot());
                assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'untitled')).length, 1);
                assert.equal(fs.existsSync(untitledBackupPath), true);
                assert.equal(fs.readFileSync(untitledBackupPath), `${untitledFile.toString()}\ntest`);
                model.dispose();
            });
            test('text file (large file, ITextSnapshot)', async () => {
                const largeString = (new Array(10 * 1024)).join('Large String\n');
                const model = textModel_1.TextModel.createFromString(largeString);
                await service.backupResource(fooFile, model.createSnapshot());
                assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'file')).length, 1);
                assert.equal(fs.existsSync(fooBackupPath), true);
                assert.equal(fs.readFileSync(fooBackupPath), `${fooFile.toString()}\n${largeString}`);
                assert.ok(service.hasBackupSync(fooFile));
                model.dispose();
            });
            test('untitled file (large file, ITextSnapshot)', async () => {
                const largeString = (new Array(10 * 1024)).join('Large String\n');
                const model = textModel_1.TextModel.createFromString(largeString);
                await service.backupResource(untitledFile, model.createSnapshot());
                assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'untitled')).length, 1);
                assert.equal(fs.existsSync(untitledBackupPath), true);
                assert.equal(fs.readFileSync(untitledBackupPath), `${untitledFile.toString()}\n${largeString}`);
                assert.ok(service.hasBackupSync(untitledFile));
                model.dispose();
            });
        });
        suite('discardResourceBackup', () => {
            test('text file', async () => {
                await service.backupResource(fooFile, textModel_1.createTextBufferFactory('test').create(1 /* LF */).createSnapshot(false));
                assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'file')).length, 1);
                assert.ok(service.hasBackupSync(fooFile));
                await service.discardResourceBackup(fooFile);
                assert.equal(fs.existsSync(fooBackupPath), false);
                assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'file')).length, 0);
                assert.ok(!service.hasBackupSync(fooFile));
            });
            test('untitled file', async () => {
                await service.backupResource(untitledFile, textModel_1.createTextBufferFactory('test').create(1 /* LF */).createSnapshot(false));
                assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'untitled')).length, 1);
                await service.discardResourceBackup(untitledFile);
                assert.equal(fs.existsSync(untitledBackupPath), false);
                assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'untitled')).length, 0);
            });
        });
        suite('discardAllWorkspaceBackups', () => {
            test('text file', async () => {
                await service.backupResource(fooFile, textModel_1.createTextBufferFactory('test').create(1 /* LF */).createSnapshot(false));
                assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'file')).length, 1);
                await service.backupResource(barFile, textModel_1.createTextBufferFactory('test').create(1 /* LF */).createSnapshot(false));
                assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'file')).length, 2);
                await service.discardAllWorkspaceBackups();
                assert.equal(fs.existsSync(fooBackupPath), false);
                assert.equal(fs.existsSync(barBackupPath), false);
                assert.equal(fs.existsSync(path.join(workspaceBackupPath, 'file')), false);
            });
            test('untitled file', async () => {
                await service.backupResource(untitledFile, textModel_1.createTextBufferFactory('test').create(1 /* LF */).createSnapshot(false));
                assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'untitled')).length, 1);
                await service.discardAllWorkspaceBackups();
                assert.equal(fs.existsSync(untitledBackupPath), false);
                assert.equal(fs.existsSync(path.join(workspaceBackupPath, 'untitled')), false);
            });
            test('should disable further backups', async () => {
                await service.discardAllWorkspaceBackups();
                await service.backupResource(untitledFile, textModel_1.createTextBufferFactory('test').create(1 /* LF */).createSnapshot(false));
                assert.equal(fs.existsSync(workspaceBackupPath), false);
            });
        });
        suite('getWorkspaceFileBackups', () => {
            test('("file") - text file', async () => {
                await service.backupResource(fooFile, textModel_1.createTextBufferFactory('test').create(1 /* LF */).createSnapshot(false));
                const textFiles = await service.getWorkspaceFileBackups();
                assert.deepEqual(textFiles.map(f => f.fsPath), [fooFile.fsPath]);
                await service.backupResource(barFile, textModel_1.createTextBufferFactory('test').create(1 /* LF */).createSnapshot(false));
                const textFiles_1 = await service.getWorkspaceFileBackups();
                assert.deepEqual(textFiles_1.map(f => f.fsPath), [fooFile.fsPath, barFile.fsPath]);
            });
            test('("file") - untitled file', async () => {
                await service.backupResource(untitledFile, textModel_1.createTextBufferFactory('test').create(1 /* LF */).createSnapshot(false));
                const textFiles = await service.getWorkspaceFileBackups();
                assert.deepEqual(textFiles.map(f => f.fsPath), [untitledFile.fsPath]);
            });
            test('("untitled") - untitled file', async () => {
                await service.backupResource(untitledFile, textModel_1.createTextBufferFactory('test').create(1 /* LF */).createSnapshot(false));
                const textFiles = await service.getWorkspaceFileBackups();
                assert.deepEqual(textFiles.map(f => f.fsPath), ['Untitled-1']);
            });
        });
        suite('resolveBackupContent', () => {
            test('should restore the original contents (untitled file)', async () => {
                const contents = 'test\nand more stuff';
                await testResolveBackup(untitledFile, contents);
            });
            test('should restore the original contents (untitled file with metadata)', async () => {
                const contents = 'test\nand more stuff';
                const meta = {
                    etag: 'the Etag',
                    size: 666,
                    mtime: Date.now(),
                    orphaned: true
                };
                await testResolveBackup(untitledFile, contents, meta);
            });
            test('should restore the original contents (text file)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'consectetur ',
                    'adipiscing ßß elit'
                ].join('');
                await testResolveBackup(fooFile, contents);
            });
            test('should restore the original contents (text file - custom scheme)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'consectetur ',
                    'adipiscing ßß elit'
                ].join('');
                await testResolveBackup(customFile, contents);
            });
            test('should restore the original contents (text file with metadata)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'adipiscing ßß elit',
                    'consectetur '
                ].join('');
                const meta = {
                    etag: 'theEtag',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await testResolveBackup(fooFile, contents, meta);
            });
            test('should restore the original contents (text file with metadata changed once)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'adipiscing ßß elit',
                    'consectetur '
                ].join('');
                const meta = {
                    etag: 'theEtag',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await testResolveBackup(fooFile, contents, meta);
                // Change meta and test again
                meta.size = 999;
                await testResolveBackup(fooFile, contents, meta);
            });
            test('should restore the original contents (text file with broken metadata)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'adipiscing ßß elit',
                    'consectetur '
                ].join('');
                const meta = {
                    etag: 'theEtag',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await service.backupResource(fooFile, textModel_1.createTextBufferFactory(contents).create(1 /* LF */).createSnapshot(false), 1, meta);
                assert.ok(await service.loadBackupResource(fooFile));
                const fileContents = fs.readFileSync(fooBackupPath).toString();
                assert.equal(fileContents.indexOf(fooFile.toString()), 0);
                const metaIndex = fileContents.indexOf('{');
                const newFileContents = fileContents.substring(0, metaIndex) + '{{' + fileContents.substr(metaIndex);
                fs.writeFileSync(fooBackupPath, newFileContents);
                const backup = await service.resolveBackupContent(service.toBackupResource(fooFile));
                assert.equal(contents, textfiles_1.snapshotToString(backup.value.create(platform.isWindows ? 2 /* CRLF */ : 1 /* LF */).createSnapshot(true)));
                assert.ok(!backup.meta);
            });
            test('should restore the original contents (text file with metadata and fragment URI)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'adipiscing ßß elit',
                    'consectetur '
                ].join('');
                const meta = {
                    etag: 'theEtag',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await testResolveBackup(customFileWithFragment, contents, meta);
            });
            test('should restore the original contents (text file with space in name with metadata)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'adipiscing ßß elit',
                    'consectetur '
                ].join('');
                const meta = {
                    etag: 'theEtag',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await testResolveBackup(fooBarFile, contents, meta);
            });
            test('should restore the original contents (text file with too large metadata to persist)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'adipiscing ßß elit',
                    'consectetur '
                ].join('');
                const meta = {
                    etag: (new Array(100 * 1024)).join('Large String'),
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await testResolveBackup(fooBarFile, contents, meta, null);
            });
            test('should throw an error when restoring invalid backup', async () => {
                const contents = 'test\nand more stuff';
                await service.backupResource(fooBarFile, textModel_1.createTextBufferFactory(contents).create(1 /* LF */).createSnapshot(false), 1);
                const backup = await service.loadBackupResource(fooBarFile);
                if (!backup) {
                    throw new Error('Unexpected missing backup');
                }
                await service.fileService.writeFile(backup, buffer_1.VSBuffer.fromString(''));
                let err;
                try {
                    await service.resolveBackupContent(backup);
                }
                catch (error) {
                    err = error;
                }
                assert.ok(err);
            });
            async function testResolveBackup(resource, contents, meta, expectedMeta) {
                if (typeof expectedMeta === 'undefined') {
                    expectedMeta = meta;
                }
                await service.backupResource(resource, textModel_1.createTextBufferFactory(contents).create(1 /* LF */).createSnapshot(false), 1, meta);
                assert.ok(await service.loadBackupResource(resource));
                const backup = await service.resolveBackupContent(service.toBackupResource(resource));
                assert.equal(contents, textfiles_1.snapshotToString(backup.value.create(platform.isWindows ? 2 /* CRLF */ : 1 /* LF */).createSnapshot(true)));
                if (expectedMeta) {
                    assert.equal(backup.meta.etag, expectedMeta.etag);
                    assert.equal(backup.meta.size, expectedMeta.size);
                    assert.equal(backup.meta.mtime, expectedMeta.mtime);
                    assert.equal(backup.meta.orphaned, expectedMeta.orphaned);
                }
                else {
                    assert.ok(!backup.meta);
                }
            }
        });
    });
    suite('BackupFilesModel', () => {
        let service;
        setup(async () => {
            service = new TestBackupFileService(workspaceResource, backupHome, workspacesJsonPath);
            // Delete any existing backups completely and then re-create it.
            await pfs.rimraf(backupHome, pfs.RimRafMode.MOVE);
            await pfs.mkdirp(backupHome);
            return pfs.writeFile(workspacesJsonPath, '');
        });
        teardown(() => {
            return pfs.rimraf(backupHome, pfs.RimRafMode.MOVE);
        });
        test('simple', () => {
            const model = new backupFileService_1.BackupFilesModel(service.fileService);
            const resource1 = uri_1.URI.file('test.html');
            assert.equal(model.has(resource1), false);
            model.add(resource1);
            assert.equal(model.has(resource1), true);
            assert.equal(model.has(resource1, 0), true);
            assert.equal(model.has(resource1, 1), false);
            assert.equal(model.has(resource1, 1, { foo: 'bar' }), false);
            model.remove(resource1);
            assert.equal(model.has(resource1), false);
            model.add(resource1);
            assert.equal(model.has(resource1), true);
            assert.equal(model.has(resource1, 0), true);
            assert.equal(model.has(resource1, 1), false);
            model.clear();
            assert.equal(model.has(resource1), false);
            model.add(resource1, 1);
            assert.equal(model.has(resource1), true);
            assert.equal(model.has(resource1, 0), false);
            assert.equal(model.has(resource1, 1), true);
            const resource2 = uri_1.URI.file('test1.html');
            const resource3 = uri_1.URI.file('test2.html');
            const resource4 = uri_1.URI.file('test3.html');
            model.add(resource2);
            model.add(resource3);
            model.add(resource4, undefined, { foo: 'bar' });
            assert.equal(model.has(resource1), true);
            assert.equal(model.has(resource2), true);
            assert.equal(model.has(resource3), true);
            assert.equal(model.has(resource4), true);
            assert.equal(model.has(resource4, undefined, { foo: 'bar' }), true);
            assert.equal(model.has(resource4, undefined, { bar: 'foo' }), false);
        });
        test('resolve', async () => {
            await pfs.mkdirp(path.dirname(fooBackupPath));
            fs.writeFileSync(fooBackupPath, 'foo');
            const model = new backupFileService_1.BackupFilesModel(service.fileService);
            const resolvedModel = await model.resolve(uri_1.URI.file(workspaceBackupPath));
            assert.equal(resolvedModel.has(uri_1.URI.file(fooBackupPath)), true);
        });
        test('get', () => {
            const model = new backupFileService_1.BackupFilesModel(service.fileService);
            assert.deepEqual(model.get(), []);
            const file1 = uri_1.URI.file('/root/file/foo.html');
            const file2 = uri_1.URI.file('/root/file/bar.html');
            const untitled = uri_1.URI.file('/root/untitled/bar.html');
            model.add(file1);
            model.add(file2);
            model.add(untitled);
            assert.deepEqual(model.get().map(f => f.fsPath), [file1.fsPath, file2.fsPath, untitled.fsPath]);
        });
    });
});
//# sourceMappingURL=backupFileService.test.js.map