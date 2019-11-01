define(["require", "exports", "assert", "vs/workbench/api/common/extHostFileSystemEventService"], function (require, exports, assert, extHostFileSystemEventService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostFileSystemEventService', () => {
        test('FileSystemWatcher ignore events properties are reversed #26851', function () {
            const protocol = {
                getProxy: () => { return undefined; },
                set: undefined,
                assertRegistered: undefined
            };
            const watcher1 = new extHostFileSystemEventService_1.ExtHostFileSystemEventService(protocol, undefined).createFileSystemWatcher('**/somethingInteresting', false, false, false);
            assert.equal(watcher1.ignoreChangeEvents, false);
            assert.equal(watcher1.ignoreCreateEvents, false);
            assert.equal(watcher1.ignoreDeleteEvents, false);
            const watcher2 = new extHostFileSystemEventService_1.ExtHostFileSystemEventService(protocol, undefined).createFileSystemWatcher('**/somethingBoring', true, true, true);
            assert.equal(watcher2.ignoreChangeEvents, true);
            assert.equal(watcher2.ignoreCreateEvents, true);
            assert.equal(watcher2.ignoreDeleteEvents, true);
        });
    });
});
//# sourceMappingURL=extHostFileSystemEventService.test.js.map