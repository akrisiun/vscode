/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/storage/browser/storageService", "vs/base/common/uuid", "vs/base/common/path", "os", "vs/base/node/pfs", "vs/platform/log/common/log", "vs/base/parts/storage/common/storage", "vs/base/common/uri", "vs/platform/files/common/fileService", "vs/base/test/node/testUtils", "vs/platform/files/node/diskFileSystemProvider", "vs/base/common/lifecycle", "vs/base/common/network"], function (require, exports, assert_1, storageService_1, uuid_1, path_1, os_1, pfs_1, log_1, storage_1, uri_1, fileService_1, testUtils_1, diskFileSystemProvider_1, lifecycle_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Storage', () => {
        const parentDir = testUtils_1.getRandomTestPath(os_1.tmpdir(), 'vsctests', 'storageservice');
        let fileService;
        let fileProvider;
        let testDir;
        const disposables = new lifecycle_1.DisposableStore();
        setup(async () => {
            const logService = new log_1.NullLogService();
            fileService = new fileService_1.FileService(logService);
            disposables.add(fileService);
            fileProvider = new diskFileSystemProvider_1.DiskFileSystemProvider(logService);
            disposables.add(fileService.registerProvider(network_1.Schemas.file, fileProvider));
            disposables.add(fileProvider);
            const id = uuid_1.generateUuid();
            testDir = path_1.join(parentDir, id);
        });
        teardown(async () => {
            disposables.clear();
            await pfs_1.rimraf(parentDir, pfs_1.RimRafMode.MOVE);
        });
        test('File Based Storage', async () => {
            let storage = new storage_1.Storage(new storageService_1.FileStorageDatabase(uri_1.URI.file(path_1.join(testDir, 'storage.json')), false, fileService));
            await storage.init();
            storage.set('bar', 'foo');
            storage.set('barNumber', 55);
            storage.set('barBoolean', true);
            assert_1.equal(storage.get('bar'), 'foo');
            assert_1.equal(storage.get('barNumber'), '55');
            assert_1.equal(storage.get('barBoolean'), 'true');
            await storage.close();
            storage = new storage_1.Storage(new storageService_1.FileStorageDatabase(uri_1.URI.file(path_1.join(testDir, 'storage.json')), false, fileService));
            await storage.init();
            assert_1.equal(storage.get('bar'), 'foo');
            assert_1.equal(storage.get('barNumber'), '55');
            assert_1.equal(storage.get('barBoolean'), 'true');
            storage.delete('bar');
            storage.delete('barNumber');
            storage.delete('barBoolean');
            assert_1.equal(storage.get('bar', 'undefined'), 'undefined');
            assert_1.equal(storage.get('barNumber', 'undefinedNumber'), 'undefinedNumber');
            assert_1.equal(storage.get('barBoolean', 'undefinedBoolean'), 'undefinedBoolean');
            await storage.close();
            storage = new storage_1.Storage(new storageService_1.FileStorageDatabase(uri_1.URI.file(path_1.join(testDir, 'storage.json')), false, fileService));
            await storage.init();
            assert_1.equal(storage.get('bar', 'undefined'), 'undefined');
            assert_1.equal(storage.get('barNumber', 'undefinedNumber'), 'undefinedNumber');
            assert_1.equal(storage.get('barBoolean', 'undefinedBoolean'), 'undefinedBoolean');
        });
    });
});
//# sourceMappingURL=storage.test.js.map