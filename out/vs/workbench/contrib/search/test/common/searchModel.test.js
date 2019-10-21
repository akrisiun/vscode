define(["require", "exports", "assert", "sinon", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/uri", "vs/base/test/common/utils", "vs/editor/common/core/range", "vs/editor/common/services/modelService", "vs/editor/common/services/modelServiceImpl", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/services/search/common/search", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/contrib/search/common/searchModel", "vs/base/common/process"], function (require, exports, assert, sinon, async_1, cancellation_1, uri_1, utils_1, range_1, modelService_1, modelServiceImpl_1, configuration_1, testConfigurationService_1, instantiationServiceMock_1, search_1, telemetry_1, telemetryUtils_1, searchModel_1, process) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const nullEvent = new class {
        constructor() {
            this.id = -1;
        }
        stop() {
            return;
        }
        timeTaken() {
            return -1;
        }
    };
    const lineOneRange = new search_1.OneLineRange(1, 0, 1);
    suite('SearchModel', () => {
        let instantiationService;
        let restoreStubs;
        const testSearchStats = {
            fromCache: false,
            resultCount: 1,
            type: 'searchProcess',
            detailStats: {
                fileWalkTime: 0,
                cmdTime: 0,
                cmdResultCount: 0,
                directoriesWalked: 2,
                filesWalked: 3
            }
        };
        const folderQueries = [
            { folder: uri_1.URI.parse('file://c:/') }
        ];
        setup(() => {
            restoreStubs = [];
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            instantiationService.stub(modelService_1.IModelService, stubModelService(instantiationService));
            instantiationService.stub(search_1.ISearchService, {});
            instantiationService.stub(search_1.ISearchService, 'textSearch', Promise.resolve({ results: [] }));
        });
        teardown(() => {
            restoreStubs.forEach(element => {
                element.restore();
            });
        });
        function searchServiceWithResults(results, complete = null) {
            return {
                textSearch(query, token, onProgress) {
                    return new Promise(resolve => {
                        process.nextTick(() => {
                            results.forEach(onProgress);
                            resolve(complete);
                        });
                    });
                }
            };
        }
        function searchServiceWithError(error) {
            return {
                textSearch(query, token, onProgress) {
                    return new Promise((resolve, reject) => {
                        reject(error);
                    });
                }
            };
        }
        function canceleableSearchService(tokenSource) {
            return {
                textSearch(query, token, onProgress) {
                    if (token) {
                        token.onCancellationRequested(() => tokenSource.cancel());
                    }
                    return new Promise(resolve => {
                        process.nextTick(() => {
                            resolve({});
                        });
                    });
                }
            };
        }
        test('Search Model: Search adds to results', async () => {
            const results = [
                aRawMatch('file://c:/1', new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 1, 4)), new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 4, 11))),
                aRawMatch('file://c:/2', new search_1.TextSearchMatch('preview 2', lineOneRange))
            ];
            instantiationService.stub(search_1.ISearchService, searchServiceWithResults(results));
            const testObject = instantiationService.createInstance(searchModel_1.SearchModel);
            await testObject.search({ contentPattern: { pattern: 'somestring' }, type: 1, folderQueries });
            const actual = testObject.searchResult.matches();
            assert.equal(2, actual.length);
            assert.equal('file://c:/1', actual[0].resource.toString());
            let actuaMatches = actual[0].matches();
            assert.equal(2, actuaMatches.length);
            assert.equal('preview 1', actuaMatches[0].text());
            assert.ok(new range_1.Range(2, 2, 2, 5).equalsRange(actuaMatches[0].range()));
            assert.equal('preview 1', actuaMatches[1].text());
            assert.ok(new range_1.Range(2, 5, 2, 12).equalsRange(actuaMatches[1].range()));
            actuaMatches = actual[1].matches();
            assert.equal(1, actuaMatches.length);
            assert.equal('preview 2', actuaMatches[0].text());
            assert.ok(new range_1.Range(2, 1, 2, 2).equalsRange(actuaMatches[0].range()));
        });
        test('Search Model: Search reports telemetry on search completed', async () => {
            const target = instantiationService.spy(telemetry_1.ITelemetryService, 'publicLog');
            const results = [
                aRawMatch('file://c:/1', new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 1, 4)), new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 4, 11))),
                aRawMatch('file://c:/2', new search_1.TextSearchMatch('preview 2', lineOneRange))
            ];
            instantiationService.stub(search_1.ISearchService, searchServiceWithResults(results));
            const testObject = instantiationService.createInstance(searchModel_1.SearchModel);
            await testObject.search({ contentPattern: { pattern: 'somestring' }, type: 1, folderQueries });
            assert.ok(target.calledThrice);
            const data = target.args[0];
            data[1].duration = -1;
            assert.deepEqual(['searchResultsFirstRender', { duration: -1 }], data);
        });
        test('Search Model: Search reports timed telemetry on search when progress is not called', () => {
            const target2 = sinon.spy();
            stub(nullEvent, 'stop', target2);
            const target1 = sinon.stub().returns(nullEvent);
            instantiationService.stub(telemetry_1.ITelemetryService, 'publicLog', target1);
            instantiationService.stub(search_1.ISearchService, searchServiceWithResults([]));
            const testObject = instantiationService.createInstance(searchModel_1.SearchModel);
            const result = testObject.search({ contentPattern: { pattern: 'somestring' }, type: 1, folderQueries });
            return result.then(() => {
                return async_1.timeout(1).then(() => {
                    assert.ok(target1.calledWith('searchResultsFirstRender'));
                    assert.ok(target1.calledWith('searchResultsFinished'));
                });
            });
        });
        test('Search Model: Search reports timed telemetry on search when progress is called', () => {
            const target2 = sinon.spy();
            stub(nullEvent, 'stop', target2);
            const target1 = sinon.stub().returns(nullEvent);
            instantiationService.stub(telemetry_1.ITelemetryService, 'publicLog', target1);
            instantiationService.stub(search_1.ISearchService, searchServiceWithResults([aRawMatch('file://c:/1', new search_1.TextSearchMatch('some preview', lineOneRange))], { results: [], stats: testSearchStats }));
            const testObject = instantiationService.createInstance(searchModel_1.SearchModel);
            const result = testObject.search({ contentPattern: { pattern: 'somestring' }, type: 1, folderQueries });
            return result.then(() => {
                return async_1.timeout(1).then(() => {
                    // timeout because promise handlers may run in a different order. We only care that these
                    // are fired at some point.
                    assert.ok(target1.calledWith('searchResultsFirstRender'));
                    assert.ok(target1.calledWith('searchResultsFinished'));
                    // assert.equal(1, target2.callCount);
                });
            });
        });
        test('Search Model: Search reports timed telemetry on search when error is called', () => {
            const target2 = sinon.spy();
            stub(nullEvent, 'stop', target2);
            const target1 = sinon.stub().returns(nullEvent);
            instantiationService.stub(telemetry_1.ITelemetryService, 'publicLog', target1);
            instantiationService.stub(search_1.ISearchService, searchServiceWithError(new Error('error')));
            const testObject = instantiationService.createInstance(searchModel_1.SearchModel);
            const result = testObject.search({ contentPattern: { pattern: 'somestring' }, type: 1, folderQueries });
            return result.then(() => { }, () => {
                return async_1.timeout(1).then(() => {
                    assert.ok(target1.calledWith('searchResultsFirstRender'));
                    assert.ok(target1.calledWith('searchResultsFinished'));
                    // assert.ok(target2.calledOnce);
                });
            });
        });
        test('Search Model: Search reports timed telemetry on search when error is cancelled error', () => {
            const target2 = sinon.spy();
            stub(nullEvent, 'stop', target2);
            const target1 = sinon.stub().returns(nullEvent);
            instantiationService.stub(telemetry_1.ITelemetryService, 'publicLog', target1);
            const deferredPromise = new utils_1.DeferredPromise();
            instantiationService.stub(search_1.ISearchService, 'textSearch', deferredPromise.p);
            const testObject = instantiationService.createInstance(searchModel_1.SearchModel);
            const result = testObject.search({ contentPattern: { pattern: 'somestring' }, type: 1, folderQueries });
            deferredPromise.cancel();
            return result.then(() => { }, () => {
                return async_1.timeout(1).then(() => {
                    assert.ok(target1.calledWith('searchResultsFirstRender'));
                    assert.ok(target1.calledWith('searchResultsFinished'));
                    // assert.ok(target2.calledOnce);
                });
            });
        });
        test('Search Model: Search results are cleared during search', async () => {
            const results = [
                aRawMatch('file://c:/1', new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 1, 4)), new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 4, 11))),
                aRawMatch('file://c:/2', new search_1.TextSearchMatch('preview 2', lineOneRange))
            ];
            instantiationService.stub(search_1.ISearchService, searchServiceWithResults(results));
            const testObject = instantiationService.createInstance(searchModel_1.SearchModel);
            await testObject.search({ contentPattern: { pattern: 'somestring' }, type: 1, folderQueries });
            assert.ok(!testObject.searchResult.isEmpty());
            instantiationService.stub(search_1.ISearchService, searchServiceWithResults([]));
            testObject.search({ contentPattern: { pattern: 'somestring' }, type: 1, folderQueries });
            assert.ok(testObject.searchResult.isEmpty());
        });
        test('Search Model: Previous search is cancelled when new search is called', async () => {
            const tokenSource = new cancellation_1.CancellationTokenSource();
            instantiationService.stub(search_1.ISearchService, canceleableSearchService(tokenSource));
            const testObject = instantiationService.createInstance(searchModel_1.SearchModel);
            testObject.search({ contentPattern: { pattern: 'somestring' }, type: 1, folderQueries });
            instantiationService.stub(search_1.ISearchService, searchServiceWithResults([]));
            testObject.search({ contentPattern: { pattern: 'somestring' }, type: 1, folderQueries });
            assert.ok(tokenSource.token.isCancellationRequested);
        });
        test('getReplaceString returns proper replace string for regExpressions', async () => {
            const results = [
                aRawMatch('file://c:/1', new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 1, 4)), new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 4, 11)))
            ];
            instantiationService.stub(search_1.ISearchService, searchServiceWithResults(results));
            const testObject = instantiationService.createInstance(searchModel_1.SearchModel);
            await testObject.search({ contentPattern: { pattern: 're' }, type: 1, folderQueries });
            testObject.replaceString = 'hello';
            let match = testObject.searchResult.matches()[0].matches()[0];
            assert.equal('hello', match.replaceString);
            await testObject.search({ contentPattern: { pattern: 're', isRegExp: true }, type: 1, folderQueries });
            match = testObject.searchResult.matches()[0].matches()[0];
            assert.equal('hello', match.replaceString);
            await testObject.search({ contentPattern: { pattern: 're(?:vi)', isRegExp: true }, type: 1, folderQueries });
            match = testObject.searchResult.matches()[0].matches()[0];
            assert.equal('hello', match.replaceString);
            await testObject.search({ contentPattern: { pattern: 'r(e)(?:vi)', isRegExp: true }, type: 1, folderQueries });
            match = testObject.searchResult.matches()[0].matches()[0];
            assert.equal('hello', match.replaceString);
            await testObject.search({ contentPattern: { pattern: 'r(e)(?:vi)', isRegExp: true }, type: 1, folderQueries });
            testObject.replaceString = 'hello$1';
            match = testObject.searchResult.matches()[0].matches()[0];
            assert.equal('helloe', match.replaceString);
        });
        function aRawMatch(resource, ...results) {
            return { resource: uri_1.URI.parse(resource), results };
        }
        function stub(arg1, arg2, arg3) {
            const stub = sinon.stub(arg1, arg2, arg3);
            restoreStubs.push(stub);
            return stub;
        }
        function stubModelService(instantiationService) {
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
            return instantiationService.createInstance(modelServiceImpl_1.ModelServiceImpl);
        }
    });
});
//# sourceMappingURL=searchModel.test.js.map