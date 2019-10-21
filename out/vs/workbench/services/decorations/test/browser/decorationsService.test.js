/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/services/decorations/browser/decorationsService", "vs/base/common/uri", "vs/base/common/event", "vs/platform/theme/test/common/testThemeService", "vs/platform/log/common/log"], function (require, exports, assert, decorationsService_1, uri_1, event_1, testThemeService_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('DecorationsService', function () {
        let service;
        setup(function () {
            if (service) {
                service.dispose();
            }
            service = new decorationsService_1.DecorationsService(new testThemeService_1.TestThemeService(), new log_1.ConsoleLogService());
        });
        test('Async provider, async/evented result', function () {
            let uri = uri_1.URI.parse('foo:bar');
            let callCounter = 0;
            service.registerDecorationsProvider(new class {
                constructor() {
                    this.label = 'Test';
                    this.onDidChange = event_1.Event.None;
                }
                provideDecorations(uri) {
                    callCounter += 1;
                    return new Promise(resolve => {
                        setTimeout(() => resolve({
                            color: 'someBlue',
                            tooltip: 'T'
                        }));
                    });
                }
            });
            // trigger -> async
            assert.equal(service.getDecoration(uri, false), undefined);
            assert.equal(callCounter, 1);
            // event when result is computed
            return event_1.Event.toPromise(service.onDidChangeDecorations).then(e => {
                assert.equal(e.affectsResource(uri), true);
                // sync result
                assert.deepEqual(service.getDecoration(uri, false).tooltip, 'T');
                assert.equal(callCounter, 1);
            });
        });
        test('Sync provider, sync result', function () {
            let uri = uri_1.URI.parse('foo:bar');
            let callCounter = 0;
            service.registerDecorationsProvider(new class {
                constructor() {
                    this.label = 'Test';
                    this.onDidChange = event_1.Event.None;
                }
                provideDecorations(uri) {
                    callCounter += 1;
                    return { color: 'someBlue', tooltip: 'Z' };
                }
            });
            // trigger -> sync
            assert.deepEqual(service.getDecoration(uri, false).tooltip, 'Z');
            assert.equal(callCounter, 1);
        });
        test('Clear decorations on provider dispose', async function () {
            let uri = uri_1.URI.parse('foo:bar');
            let callCounter = 0;
            let reg = service.registerDecorationsProvider(new class {
                constructor() {
                    this.label = 'Test';
                    this.onDidChange = event_1.Event.None;
                }
                provideDecorations(uri) {
                    callCounter += 1;
                    return { color: 'someBlue', tooltip: 'J' };
                }
            });
            // trigger -> sync
            assert.deepEqual(service.getDecoration(uri, false).tooltip, 'J');
            assert.equal(callCounter, 1);
            // un-register -> ensure good event
            let didSeeEvent = false;
            let p = new Promise(resolve => {
                service.onDidChangeDecorations(e => {
                    assert.equal(e.affectsResource(uri), true);
                    assert.deepEqual(service.getDecoration(uri, false), undefined);
                    assert.equal(callCounter, 1);
                    didSeeEvent = true;
                    resolve();
                });
            });
            reg.dispose(); // will clear all data
            await p;
            assert.equal(didSeeEvent, true);
        });
        test('No default bubbling', function () {
            let reg = service.registerDecorationsProvider({
                label: 'Test',
                onDidChange: event_1.Event.None,
                provideDecorations(uri) {
                    return uri.path.match(/\.txt/)
                        ? { tooltip: '.txt', weight: 17 }
                        : undefined;
                }
            });
            let childUri = uri_1.URI.parse('file:///some/path/some/file.txt');
            let deco = service.getDecoration(childUri, false);
            assert.equal(deco.tooltip, '.txt');
            deco = service.getDecoration(childUri.with({ path: 'some/path/' }), true);
            assert.equal(deco, undefined);
            reg.dispose();
            // bubble
            reg = service.registerDecorationsProvider({
                label: 'Test',
                onDidChange: event_1.Event.None,
                provideDecorations(uri) {
                    return uri.path.match(/\.txt/)
                        ? { tooltip: '.txt.bubble', weight: 71, bubble: true }
                        : undefined;
                }
            });
            deco = service.getDecoration(childUri, false);
            assert.equal(deco.tooltip, '.txt.bubble');
            deco = service.getDecoration(childUri.with({ path: 'some/path/' }), true);
            assert.equal(typeof deco.tooltip, 'string');
        });
        test('Decorations not showing up for second root folder #48502', async function () {
            let cancelCount = 0;
            let winjsCancelCount = 0;
            let callCount = 0;
            let provider = new class {
                constructor() {
                    this._onDidChange = new event_1.Emitter();
                    this.onDidChange = this._onDidChange.event;
                    this.label = 'foo';
                }
                provideDecorations(uri, token) {
                    token.onCancellationRequested(() => {
                        cancelCount += 1;
                    });
                    return new Promise(resolve => {
                        callCount += 1;
                        setTimeout(() => {
                            resolve({ letter: 'foo' });
                        }, 10);
                    });
                }
            };
            let reg = service.registerDecorationsProvider(provider);
            const uri = uri_1.URI.parse('foo://bar');
            service.getDecoration(uri, false);
            provider._onDidChange.fire([uri]);
            service.getDecoration(uri, false);
            assert.equal(cancelCount, 1);
            assert.equal(winjsCancelCount, 0);
            assert.equal(callCount, 2);
            reg.dispose();
        });
        test('Decorations not bubbling... #48745', function () {
            let reg = service.registerDecorationsProvider({
                label: 'Test',
                onDidChange: event_1.Event.None,
                provideDecorations(uri) {
                    if (uri.path.match(/hello$/)) {
                        return { tooltip: 'FOO', weight: 17, bubble: true };
                    }
                    else {
                        return new Promise(_resolve => { });
                    }
                }
            });
            let data1 = service.getDecoration(uri_1.URI.parse('a:b/'), true);
            assert.ok(!data1);
            let data2 = service.getDecoration(uri_1.URI.parse('a:b/c.hello'), false);
            assert.ok(data2.tooltip);
            let data3 = service.getDecoration(uri_1.URI.parse('a:b/'), true);
            assert.ok(data3);
            reg.dispose();
        });
        test('Folder decorations don\'t go away when file with problems is deleted #61919 (part1)', function () {
            let emitter = new event_1.Emitter();
            let gone = false;
            let reg = service.registerDecorationsProvider({
                label: 'Test',
                onDidChange: emitter.event,
                provideDecorations(uri) {
                    if (!gone && uri.path.match(/file.ts$/)) {
                        return { tooltip: 'FOO', weight: 17, bubble: true };
                    }
                    return undefined;
                }
            });
            let uri = uri_1.URI.parse('foo:/folder/file.ts');
            let uri2 = uri_1.URI.parse('foo:/folder/');
            let data = service.getDecoration(uri, true);
            assert.equal(data.tooltip, 'FOO');
            data = service.getDecoration(uri2, true);
            assert.ok(data.tooltip); // emphazied items...
            gone = true;
            emitter.fire([uri]);
            data = service.getDecoration(uri, true);
            assert.equal(data, undefined);
            data = service.getDecoration(uri2, true);
            assert.equal(data, undefined);
            reg.dispose();
        });
        test('Folder decorations don\'t go away when file with problems is deleted #61919 (part2)', function () {
            let emitter = new event_1.Emitter();
            let gone = false;
            let reg = service.registerDecorationsProvider({
                label: 'Test',
                onDidChange: emitter.event,
                provideDecorations(uri) {
                    if (!gone && uri.path.match(/file.ts$/)) {
                        return { tooltip: 'FOO', weight: 17, bubble: true };
                    }
                    return undefined;
                }
            });
            let uri = uri_1.URI.parse('foo:/folder/file.ts');
            let uri2 = uri_1.URI.parse('foo:/folder/');
            let data = service.getDecoration(uri, true);
            assert.equal(data.tooltip, 'FOO');
            data = service.getDecoration(uri2, true);
            assert.ok(data.tooltip); // emphazied items...
            return new Promise((resolve, reject) => {
                let l = service.onDidChangeDecorations(e => {
                    l.dispose();
                    try {
                        assert.ok(e.affectsResource(uri));
                        assert.ok(e.affectsResource(uri2));
                        resolve();
                        reg.dispose();
                    }
                    catch (err) {
                        reject(err);
                        reg.dispose();
                    }
                });
                gone = true;
                emitter.fire([uri]);
            });
        });
    });
});
//# sourceMappingURL=decorationsService.test.js.map