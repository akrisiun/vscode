/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "vs/platform/files/common/files", "vs/base/common/uri", "vs/platform/files/node/watcher/watcher", "vs/base/common/event"], function (require, exports, assert, platform, files_1, uri_1, watcher_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function toFileChangesEvent(changes) {
        return new files_1.FileChangesEvent(watcher_1.toFileChanges(changes));
    }
    class TestFileWatcher {
        constructor() {
            this._onFileChanges = new event_1.Emitter();
        }
        get onFileChanges() {
            return this._onFileChanges.event;
        }
        report(changes) {
            this.onRawFileEvents(changes);
        }
        onRawFileEvents(events) {
            // Normalize
            let normalizedEvents = watcher_1.normalizeFileChanges(events);
            // Emit through event emitter
            if (normalizedEvents.length > 0) {
                this._onFileChanges.fire(toFileChangesEvent(normalizedEvents));
            }
        }
    }
    var Path;
    (function (Path) {
        Path[Path["UNIX"] = 0] = "UNIX";
        Path[Path["WINDOWS"] = 1] = "WINDOWS";
        Path[Path["UNC"] = 2] = "UNC";
    })(Path || (Path = {}));
    suite('Normalizer', () => {
        test('simple add/update/delete', function (done) {
            const watch = new TestFileWatcher();
            const added = uri_1.URI.file('/users/data/src/added.txt');
            const updated = uri_1.URI.file('/users/data/src/updated.txt');
            const deleted = uri_1.URI.file('/users/data/src/deleted.txt');
            const raw = [
                { path: added.fsPath, type: 1 /* ADDED */ },
                { path: updated.fsPath, type: 0 /* UPDATED */ },
                { path: deleted.fsPath, type: 2 /* DELETED */ },
            ];
            watch.onFileChanges(e => {
                assert.ok(e);
                assert.equal(e.changes.length, 3);
                assert.ok(e.contains(added, 1 /* ADDED */));
                assert.ok(e.contains(updated, 0 /* UPDATED */));
                assert.ok(e.contains(deleted, 2 /* DELETED */));
                done();
            });
            watch.report(raw);
        });
        let pathSpecs = platform.isWindows ? [Path.WINDOWS, Path.UNC] : [Path.UNIX];
        pathSpecs.forEach((p) => {
            test('delete only reported for top level folder (' + p + ')', function (done) {
                const watch = new TestFileWatcher();
                const deletedFolderA = uri_1.URI.file(p === Path.UNIX ? '/users/data/src/todelete1' : p === Path.WINDOWS ? 'C:\\users\\data\\src\\todelete1' : '\\\\localhost\\users\\data\\src\\todelete1');
                const deletedFolderB = uri_1.URI.file(p === Path.UNIX ? '/users/data/src/todelete2' : p === Path.WINDOWS ? 'C:\\users\\data\\src\\todelete2' : '\\\\localhost\\users\\data\\src\\todelete2');
                const deletedFolderBF1 = uri_1.URI.file(p === Path.UNIX ? '/users/data/src/todelete2/file.txt' : p === Path.WINDOWS ? 'C:\\users\\data\\src\\todelete2\\file.txt' : '\\\\localhost\\users\\data\\src\\todelete2\\file.txt');
                const deletedFolderBF2 = uri_1.URI.file(p === Path.UNIX ? '/users/data/src/todelete2/more/test.txt' : p === Path.WINDOWS ? 'C:\\users\\data\\src\\todelete2\\more\\test.txt' : '\\\\localhost\\users\\data\\src\\todelete2\\more\\test.txt');
                const deletedFolderBF3 = uri_1.URI.file(p === Path.UNIX ? '/users/data/src/todelete2/super/bar/foo.txt' : p === Path.WINDOWS ? 'C:\\users\\data\\src\\todelete2\\super\\bar\\foo.txt' : '\\\\localhost\\users\\data\\src\\todelete2\\super\\bar\\foo.txt');
                const deletedFileA = uri_1.URI.file(p === Path.UNIX ? '/users/data/src/deleteme.txt' : p === Path.WINDOWS ? 'C:\\users\\data\\src\\deleteme.txt' : '\\\\localhost\\users\\data\\src\\deleteme.txt');
                const addedFile = uri_1.URI.file(p === Path.UNIX ? '/users/data/src/added.txt' : p === Path.WINDOWS ? 'C:\\users\\data\\src\\added.txt' : '\\\\localhost\\users\\data\\src\\added.txt');
                const updatedFile = uri_1.URI.file(p === Path.UNIX ? '/users/data/src/updated.txt' : p === Path.WINDOWS ? 'C:\\users\\data\\src\\updated.txt' : '\\\\localhost\\users\\data\\src\\updated.txt');
                const raw = [
                    { path: deletedFolderA.fsPath, type: 2 /* DELETED */ },
                    { path: deletedFolderB.fsPath, type: 2 /* DELETED */ },
                    { path: deletedFolderBF1.fsPath, type: 2 /* DELETED */ },
                    { path: deletedFolderBF2.fsPath, type: 2 /* DELETED */ },
                    { path: deletedFolderBF3.fsPath, type: 2 /* DELETED */ },
                    { path: deletedFileA.fsPath, type: 2 /* DELETED */ },
                    { path: addedFile.fsPath, type: 1 /* ADDED */ },
                    { path: updatedFile.fsPath, type: 0 /* UPDATED */ }
                ];
                watch.onFileChanges(e => {
                    assert.ok(e);
                    assert.equal(e.changes.length, 5);
                    assert.ok(e.contains(deletedFolderA, 2 /* DELETED */));
                    assert.ok(e.contains(deletedFolderB, 2 /* DELETED */));
                    assert.ok(e.contains(deletedFileA, 2 /* DELETED */));
                    assert.ok(e.contains(addedFile, 1 /* ADDED */));
                    assert.ok(e.contains(updatedFile, 0 /* UPDATED */));
                    done();
                });
                watch.report(raw);
            });
        });
        test('event normalization: ignore CREATE followed by DELETE', function (done) {
            const watch = new TestFileWatcher();
            const created = uri_1.URI.file('/users/data/src/related');
            const deleted = uri_1.URI.file('/users/data/src/related');
            const unrelated = uri_1.URI.file('/users/data/src/unrelated');
            const raw = [
                { path: created.fsPath, type: 1 /* ADDED */ },
                { path: deleted.fsPath, type: 2 /* DELETED */ },
                { path: unrelated.fsPath, type: 0 /* UPDATED */ },
            ];
            watch.onFileChanges(e => {
                assert.ok(e);
                assert.equal(e.changes.length, 1);
                assert.ok(e.contains(unrelated, 0 /* UPDATED */));
                done();
            });
            watch.report(raw);
        });
        test('event normalization: flatten DELETE followed by CREATE into CHANGE', function (done) {
            const watch = new TestFileWatcher();
            const deleted = uri_1.URI.file('/users/data/src/related');
            const created = uri_1.URI.file('/users/data/src/related');
            const unrelated = uri_1.URI.file('/users/data/src/unrelated');
            const raw = [
                { path: deleted.fsPath, type: 2 /* DELETED */ },
                { path: created.fsPath, type: 1 /* ADDED */ },
                { path: unrelated.fsPath, type: 0 /* UPDATED */ },
            ];
            watch.onFileChanges(e => {
                assert.ok(e);
                assert.equal(e.changes.length, 2);
                assert.ok(e.contains(deleted, 0 /* UPDATED */));
                assert.ok(e.contains(unrelated, 0 /* UPDATED */));
                done();
            });
            watch.report(raw);
        });
        test('event normalization: ignore UPDATE when CREATE received', function (done) {
            const watch = new TestFileWatcher();
            const created = uri_1.URI.file('/users/data/src/related');
            const updated = uri_1.URI.file('/users/data/src/related');
            const unrelated = uri_1.URI.file('/users/data/src/unrelated');
            const raw = [
                { path: created.fsPath, type: 1 /* ADDED */ },
                { path: updated.fsPath, type: 0 /* UPDATED */ },
                { path: unrelated.fsPath, type: 0 /* UPDATED */ },
            ];
            watch.onFileChanges(e => {
                assert.ok(e);
                assert.equal(e.changes.length, 2);
                assert.ok(e.contains(created, 1 /* ADDED */));
                assert.ok(!e.contains(created, 0 /* UPDATED */));
                assert.ok(e.contains(unrelated, 0 /* UPDATED */));
                done();
            });
            watch.report(raw);
        });
        test('event normalization: apply DELETE', function (done) {
            const watch = new TestFileWatcher();
            const updated = uri_1.URI.file('/users/data/src/related');
            const updated2 = uri_1.URI.file('/users/data/src/related');
            const deleted = uri_1.URI.file('/users/data/src/related');
            const unrelated = uri_1.URI.file('/users/data/src/unrelated');
            const raw = [
                { path: updated.fsPath, type: 0 /* UPDATED */ },
                { path: updated2.fsPath, type: 0 /* UPDATED */ },
                { path: unrelated.fsPath, type: 0 /* UPDATED */ },
                { path: updated.fsPath, type: 2 /* DELETED */ }
            ];
            watch.onFileChanges(e => {
                assert.ok(e);
                assert.equal(e.changes.length, 2);
                assert.ok(e.contains(deleted, 2 /* DELETED */));
                assert.ok(!e.contains(updated, 0 /* UPDATED */));
                assert.ok(e.contains(unrelated, 0 /* UPDATED */));
                done();
            });
            watch.report(raw);
        });
    });
});
//# sourceMappingURL=normalizer.test.js.map