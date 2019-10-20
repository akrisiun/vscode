/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/storage/common/storage", "vs/platform/storage/node/storageService", "vs/base/common/uuid", "vs/base/common/path", "os", "vs/base/node/pfs", "vs/platform/log/common/log", "vs/platform/environment/node/environmentService", "vs/platform/environment/node/argv", "vs/base/parts/storage/common/storage"], function (require, exports, assert_1, storage_1, storageService_1, uuid_1, path_1, os_1, pfs_1, log_1, environmentService_1, argv_1, storage_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('StorageService', () => {
        test('Remove Data (global, in-memory)', () => {
            removeData(0 /* GLOBAL */);
        });
        test('Remove Data (workspace, in-memory)', () => {
            removeData(1 /* WORKSPACE */);
        });
        function removeData(scope) {
            const storage = new storage_1.InMemoryStorageService();
            storage.store('Monaco.IDE.Core.Storage.Test.remove', 'foobar', scope);
            assert_1.strictEqual('foobar', storage.get('Monaco.IDE.Core.Storage.Test.remove', scope, (undefined)));
            storage.remove('Monaco.IDE.Core.Storage.Test.remove', scope);
            assert_1.ok(!storage.get('Monaco.IDE.Core.Storage.Test.remove', scope, (undefined)));
        }
        test('Get Data, Integer, Boolean (global, in-memory)', () => {
            storeData(0 /* GLOBAL */);
        });
        test('Get Data, Integer, Boolean (workspace, in-memory)', () => {
            storeData(1 /* WORKSPACE */);
        });
        function storeData(scope) {
            const storage = new storage_1.InMemoryStorageService();
            assert_1.strictEqual(storage.get('Monaco.IDE.Core.Storage.Test.get', scope, 'foobar'), 'foobar');
            assert_1.strictEqual(storage.get('Monaco.IDE.Core.Storage.Test.get', scope, ''), '');
            assert_1.strictEqual(storage.getNumber('Monaco.IDE.Core.Storage.Test.getNumber', scope, 5), 5);
            assert_1.strictEqual(storage.getNumber('Monaco.IDE.Core.Storage.Test.getNumber', scope, 0), 0);
            assert_1.strictEqual(storage.getBoolean('Monaco.IDE.Core.Storage.Test.getBoolean', scope, true), true);
            assert_1.strictEqual(storage.getBoolean('Monaco.IDE.Core.Storage.Test.getBoolean', scope, false), false);
            storage.store('Monaco.IDE.Core.Storage.Test.get', 'foobar', scope);
            assert_1.strictEqual(storage.get('Monaco.IDE.Core.Storage.Test.get', scope, (undefined)), 'foobar');
            storage.store('Monaco.IDE.Core.Storage.Test.get', '', scope);
            assert_1.strictEqual(storage.get('Monaco.IDE.Core.Storage.Test.get', scope, (undefined)), '');
            storage.store('Monaco.IDE.Core.Storage.Test.getNumber', 5, scope);
            assert_1.strictEqual(storage.getNumber('Monaco.IDE.Core.Storage.Test.getNumber', scope, (undefined)), 5);
            storage.store('Monaco.IDE.Core.Storage.Test.getNumber', 0, scope);
            assert_1.strictEqual(storage.getNumber('Monaco.IDE.Core.Storage.Test.getNumber', scope, (undefined)), 0);
            storage.store('Monaco.IDE.Core.Storage.Test.getBoolean', true, scope);
            assert_1.strictEqual(storage.getBoolean('Monaco.IDE.Core.Storage.Test.getBoolean', scope, (undefined)), true);
            storage.store('Monaco.IDE.Core.Storage.Test.getBoolean', false, scope);
            assert_1.strictEqual(storage.getBoolean('Monaco.IDE.Core.Storage.Test.getBoolean', scope, (undefined)), false);
            assert_1.strictEqual(storage.get('Monaco.IDE.Core.Storage.Test.getDefault', scope, 'getDefault'), 'getDefault');
            assert_1.strictEqual(storage.getNumber('Monaco.IDE.Core.Storage.Test.getNumberDefault', scope, 5), 5);
            assert_1.strictEqual(storage.getBoolean('Monaco.IDE.Core.Storage.Test.getBooleanDefault', scope, true), true);
        }
        function uniqueStorageDir() {
            const id = uuid_1.generateUuid();
            return path_1.join(os_1.tmpdir(), 'vsctests', id, 'storage2', id);
        }
        test('Migrate Data', async () => {
            class StorageTestEnvironmentService extends environmentService_1.EnvironmentService {
                constructor(workspaceStorageFolderPath, _extensionsPath) {
                    super(argv_1.parseArgs(process.argv, argv_1.OPTIONS), process.execPath);
                    this.workspaceStorageFolderPath = workspaceStorageFolderPath;
                    this._extensionsPath = _extensionsPath;
                }
                get workspaceStorageHome() {
                    return this.workspaceStorageFolderPath;
                }
                get extensionsPath() {
                    return this._extensionsPath;
                }
            }
            const storageDir = uniqueStorageDir();
            await pfs_1.mkdirp(storageDir);
            const storage = new storageService_1.NativeStorageService(new storage_2.InMemoryStorageDatabase(), new log_1.NullLogService(), new StorageTestEnvironmentService(storageDir, storageDir));
            await storage.initialize({ id: String(Date.now()) });
            storage.store('bar', 'foo', 1 /* WORKSPACE */);
            storage.store('barNumber', 55, 1 /* WORKSPACE */);
            storage.store('barBoolean', true, 0 /* GLOBAL */);
            await storage.migrate({ id: String(Date.now() + 100) });
            assert_1.equal(storage.get('bar', 1 /* WORKSPACE */), 'foo');
            assert_1.equal(storage.getNumber('barNumber', 1 /* WORKSPACE */), 55);
            assert_1.equal(storage.getBoolean('barBoolean', 0 /* GLOBAL */), true);
            await storage.close();
            await pfs_1.rimraf(storageDir, pfs_1.RimRafMode.MOVE);
        });
    });
});
//# sourceMappingURL=storageService.test.js.map