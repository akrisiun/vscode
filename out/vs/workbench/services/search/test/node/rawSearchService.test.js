/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/amd", "vs/base/common/async", "vs/base/common/event", "vs/base/common/path", "vs/base/common/uri", "vs/workbench/services/search/node/rawSearchService", "vs/workbench/services/search/node/searchService"], function (require, exports, assert, amd_1, async_1, event_1, path, uri_1, rawSearchService_1, searchService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const TEST_FOLDER_QUERIES = [
        { folder: uri_1.URI.file(path.normalize('/some/where')) }
    ];
    const TEST_FIXTURES = path.normalize(amd_1.getPathFromAmdModule(require, './fixtures'));
    const MULTIROOT_QUERIES = [
        { folder: uri_1.URI.file(path.join(TEST_FIXTURES, 'examples')) },
        { folder: uri_1.URI.file(path.join(TEST_FIXTURES, 'more')) }
    ];
    const stats = {
        fileWalkTime: 0,
        cmdTime: 1,
        directoriesWalked: 2,
        filesWalked: 3
    };
    class TestSearchEngine {
        constructor(result, config) {
            this.result = result;
            this.config = config;
            this.isCanceled = false;
            TestSearchEngine.last = this;
        }
        search(onResult, onProgress, done) {
            const self = this;
            (function next() {
                process.nextTick(() => {
                    if (self.isCanceled) {
                        done(null, {
                            limitHit: false,
                            stats: stats
                        });
                        return;
                    }
                    const result = self.result();
                    if (!result) {
                        done(null, {
                            limitHit: false,
                            stats: stats
                        });
                    }
                    else {
                        onResult(result);
                        next();
                    }
                });
            })();
        }
        cancel() {
            this.isCanceled = true;
        }
    }
    const testTimeout = 5000;
    suite('RawSearchService', () => {
        const rawSearch = {
            type: 1 /* File */,
            folderQueries: TEST_FOLDER_QUERIES,
            filePattern: 'a'
        };
        const rawMatch = {
            base: path.normalize('/some'),
            relativePath: 'where',
            basename: 'where',
            size: 123
        };
        const match = {
            path: path.normalize('/some/where')
        };
        test('Individual results', async function () {
            this.timeout(testTimeout);
            let i = 5;
            const Engine = TestSearchEngine.bind(null, () => i-- && rawMatch);
            const service = new rawSearchService_1.SearchService();
            let results = 0;
            const cb = value => {
                if (!Array.isArray(value)) {
                    assert.deepStrictEqual(value, match);
                    results++;
                }
                else {
                    assert.fail(JSON.stringify(value));
                }
            };
            await service.doFileSearchWithEngine(Engine, rawSearch, cb, null, 0);
            return assert.strictEqual(results, 5);
        });
        test('Batch results', async function () {
            this.timeout(testTimeout);
            let i = 25;
            const Engine = TestSearchEngine.bind(null, () => i-- && rawMatch);
            const service = new rawSearchService_1.SearchService();
            const results = [];
            const cb = value => {
                if (Array.isArray(value)) {
                    value.forEach(m => {
                        assert.deepStrictEqual(m, match);
                    });
                    results.push(value.length);
                }
                else {
                    assert.fail(JSON.stringify(value));
                }
            };
            await service.doFileSearchWithEngine(Engine, rawSearch, cb, undefined, 10);
            assert.deepStrictEqual(results, [10, 10, 5]);
        });
        test('Collect batched results', async function () {
            this.timeout(testTimeout);
            const uriPath = '/some/where';
            let i = 25;
            const Engine = TestSearchEngine.bind(null, () => i-- && rawMatch);
            const service = new rawSearchService_1.SearchService();
            function fileSearch(config, batchSize) {
                let promise;
                const emitter = new event_1.Emitter({
                    onFirstListenerAdd: () => {
                        promise = async_1.createCancelablePromise(token => service.doFileSearchWithEngine(Engine, config, p => emitter.fire(p), token, batchSize)
                            .then(c => emitter.fire(c), err => emitter.fire({ type: 'error', error: err })));
                    },
                    onLastListenerRemove: () => {
                        promise.cancel();
                    }
                });
                return emitter.event;
            }
            const progressResults = [];
            const onProgress = (match) => {
                assert.strictEqual(match.resource.path, uriPath);
                progressResults.push(match);
            };
            const result_2 = await searchService_1.DiskSearch.collectResultsFromEvent(fileSearch(rawSearch, 10), onProgress);
            assert.strictEqual(result_2.results.length, 25, 'Result');
            assert.strictEqual(progressResults.length, 25, 'Progress');
        });
        test('Multi-root with include pattern and maxResults', async function () {
            this.timeout(testTimeout);
            const service = new rawSearchService_1.SearchService();
            const query = {
                type: 1 /* File */,
                folderQueries: MULTIROOT_QUERIES,
                maxResults: 1,
                includePattern: {
                    '*.txt': true,
                    '*.js': true
                },
            };
            const result = await searchService_1.DiskSearch.collectResultsFromEvent(service.fileSearch(query));
            assert.strictEqual(result.results.length, 1, 'Result');
        });
        test('Handles maxResults=0 correctly', async function () {
            this.timeout(testTimeout);
            const service = new rawSearchService_1.SearchService();
            const query = {
                type: 1 /* File */,
                folderQueries: MULTIROOT_QUERIES,
                maxResults: 0,
                sortByScore: true,
                includePattern: {
                    '*.txt': true,
                    '*.js': true
                },
            };
            const result = await searchService_1.DiskSearch.collectResultsFromEvent(service.fileSearch(query));
            assert.strictEqual(result.results.length, 0, 'Result');
        });
        test('Multi-root with include pattern and exists', async function () {
            this.timeout(testTimeout);
            const service = new rawSearchService_1.SearchService();
            const query = {
                type: 1 /* File */,
                folderQueries: MULTIROOT_QUERIES,
                exists: true,
                includePattern: {
                    '*.txt': true,
                    '*.js': true
                },
            };
            const result = await searchService_1.DiskSearch.collectResultsFromEvent(service.fileSearch(query));
            assert.strictEqual(result.results.length, 0, 'Result');
            assert.ok(result.limitHit);
        });
        test('Sorted results', async function () {
            this.timeout(testTimeout);
            const paths = ['bab', 'bbc', 'abb'];
            const matches = paths.map(relativePath => ({
                base: path.normalize('/some/where'),
                relativePath,
                basename: relativePath,
                size: 3
            }));
            const Engine = TestSearchEngine.bind(null, () => matches.shift());
            const service = new rawSearchService_1.SearchService();
            const results = [];
            const cb = value => {
                if (Array.isArray(value)) {
                    results.push(...value.map(v => v.path));
                }
                else {
                    assert.fail(JSON.stringify(value));
                }
            };
            await service.doFileSearchWithEngine(Engine, {
                type: 1 /* File */,
                folderQueries: TEST_FOLDER_QUERIES,
                filePattern: 'bb',
                sortByScore: true,
                maxResults: 2
            }, cb, undefined, 1);
            assert.notStrictEqual(typeof TestSearchEngine.last.config.maxResults, 'number');
            assert.deepStrictEqual(results, [path.normalize('/some/where/bbc'), path.normalize('/some/where/bab')]);
        });
        test('Sorted result batches', async function () {
            this.timeout(testTimeout);
            let i = 25;
            const Engine = TestSearchEngine.bind(null, () => i-- && rawMatch);
            const service = new rawSearchService_1.SearchService();
            const results = [];
            const cb = value => {
                if (Array.isArray(value)) {
                    value.forEach(m => {
                        assert.deepStrictEqual(m, match);
                    });
                    results.push(value.length);
                }
                else {
                    assert.fail(JSON.stringify(value));
                }
            };
            await service.doFileSearchWithEngine(Engine, {
                type: 1 /* File */,
                folderQueries: TEST_FOLDER_QUERIES,
                filePattern: 'a',
                sortByScore: true,
                maxResults: 23
            }, cb, undefined, 10);
            assert.deepStrictEqual(results, [10, 10, 3]);
        });
        test('Cached results', function () {
            this.timeout(testTimeout);
            const paths = ['bcb', 'bbc', 'aab'];
            const matches = paths.map(relativePath => ({
                base: path.normalize('/some/where'),
                relativePath,
                basename: relativePath,
                size: 3
            }));
            const Engine = TestSearchEngine.bind(null, () => matches.shift());
            const service = new rawSearchService_1.SearchService();
            const results = [];
            const cb = value => {
                if (Array.isArray(value)) {
                    results.push(...value.map(v => v.path));
                }
                else {
                    assert.fail(JSON.stringify(value));
                }
            };
            return service.doFileSearchWithEngine(Engine, {
                type: 1 /* File */,
                folderQueries: TEST_FOLDER_QUERIES,
                filePattern: 'b',
                sortByScore: true,
                cacheKey: 'x'
            }, cb, undefined, -1).then(complete => {
                assert.strictEqual(complete.stats.fromCache, false);
                assert.deepStrictEqual(results, [path.normalize('/some/where/bcb'), path.normalize('/some/where/bbc'), path.normalize('/some/where/aab')]);
            }).then(async () => {
                const results = [];
                const cb = value => {
                    if (Array.isArray(value)) {
                        results.push(...value.map(v => v.path));
                    }
                    else {
                        assert.fail(JSON.stringify(value));
                    }
                };
                try {
                    const complete = await service.doFileSearchWithEngine(Engine, {
                        type: 1 /* File */,
                        folderQueries: TEST_FOLDER_QUERIES,
                        filePattern: 'bc',
                        sortByScore: true,
                        cacheKey: 'x'
                    }, cb, undefined, -1);
                    assert.ok(complete.stats.fromCache);
                    assert.deepStrictEqual(results, [path.normalize('/some/where/bcb'), path.normalize('/some/where/bbc')]);
                }
                catch (e) { }
            }).then(() => {
                return service.clearCache('x');
            }).then(async () => {
                matches.push({
                    base: path.normalize('/some/where'),
                    relativePath: 'bc',
                    basename: 'bc',
                    size: 3
                });
                const results = [];
                const cb = value => {
                    if (Array.isArray(value)) {
                        results.push(...value.map(v => v.path));
                    }
                    else {
                        assert.fail(JSON.stringify(value));
                    }
                };
                const complete = await service.doFileSearchWithEngine(Engine, {
                    type: 1 /* File */,
                    folderQueries: TEST_FOLDER_QUERIES,
                    filePattern: 'bc',
                    sortByScore: true,
                    cacheKey: 'x'
                }, cb, undefined, -1);
                assert.strictEqual(complete.stats.fromCache, false);
                assert.deepStrictEqual(results, [path.normalize('/some/where/bc')]);
            });
        });
    });
});
//# sourceMappingURL=rawSearchService.test.js.map