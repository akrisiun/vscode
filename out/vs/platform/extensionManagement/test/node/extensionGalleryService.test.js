/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "os", "vs/platform/environment/node/environmentService", "vs/platform/environment/node/argv", "vs/base/test/node/testUtils", "vs/base/common/path", "vs/base/node/pfs", "vs/platform/extensionManagement/common/extensionGalleryService", "vs/base/common/uuid", "vs/base/common/lifecycle", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/platform/files/node/diskFileSystemProvider", "vs/base/common/network", "vs/platform/product/common/product"], function (require, exports, assert, os, environmentService_1, argv_1, testUtils_1, path_1, pfs_1, extensionGalleryService_1, uuid_1, lifecycle_1, fileService_1, log_1, diskFileSystemProvider_1, network_1, product_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Extension Gallery Service', () => {
        const parentDir = testUtils_1.getRandomTestPath(os.tmpdir(), 'vsctests', 'extensiongalleryservice');
        const marketplaceHome = path_1.join(parentDir, 'Marketplace');
        let fileService;
        let disposables;
        setup(done => {
            disposables = new lifecycle_1.DisposableStore();
            fileService = new fileService_1.FileService(new log_1.NullLogService());
            disposables.add(fileService);
            const diskFileSystemProvider = new diskFileSystemProvider_1.DiskFileSystemProvider(new log_1.NullLogService());
            disposables.add(diskFileSystemProvider);
            fileService.registerProvider(network_1.Schemas.file, diskFileSystemProvider);
            // Delete any existing backups completely and then re-create it.
            pfs_1.rimraf(marketplaceHome, pfs_1.RimRafMode.MOVE).then(() => {
                pfs_1.mkdirp(marketplaceHome).then(() => {
                    done();
                }, error => done(error));
            }, error => done(error));
        });
        teardown(done => {
            disposables.clear();
            pfs_1.rimraf(marketplaceHome, pfs_1.RimRafMode.MOVE).then(done, done);
        });
        test('marketplace machine id', () => {
            const args = ['--user-data-dir', marketplaceHome];
            const environmentService = new environmentService_1.EnvironmentService(argv_1.parseArgs(args, argv_1.OPTIONS), process.execPath);
            return extensionGalleryService_1.resolveMarketplaceHeaders(product_1.default.version, environmentService, fileService).then(headers => {
                assert.ok(uuid_1.isUUID(headers['X-Market-User-Id']));
                return extensionGalleryService_1.resolveMarketplaceHeaders(product_1.default.version, environmentService, fileService).then(headers2 => {
                    assert.equal(headers['X-Market-User-Id'], headers2['X-Market-User-Id']);
                });
            });
        });
    });
});
//# sourceMappingURL=extensionGalleryService.test.js.map