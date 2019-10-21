define(["require", "exports", "assert", "vs/base/common/uri", "vs/editor/common/services/modelService", "vs/editor/common/services/modelServiceImpl", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/services/search/common/search", "vs/platform/workspace/common/workspace", "vs/platform/workspace/test/common/testWorkspace", "vs/workbench/contrib/search/common/searchModel", "vs/workbench/test/workbenchTestServices"], function (require, exports, assert, uri_1, modelService_1, modelServiceImpl_1, configuration_1, testConfigurationService_1, instantiationServiceMock_1, search_1, workspace_1, testWorkspace_1, searchModel_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Search - Viewlet', () => {
        let instantiation;
        setup(() => {
            instantiation = new instantiationServiceMock_1.TestInstantiationService();
            instantiation.stub(modelService_1.IModelService, stubModelService(instantiation));
            instantiation.set(workspace_1.IWorkspaceContextService, new workbenchTestServices_1.TestContextService(testWorkspace_1.TestWorkspace));
        });
        test('Data Source', function () {
            let result = instantiation.createInstance(searchModel_1.SearchResult, null);
            result.query = {
                type: 2 /* Text */,
                contentPattern: { pattern: 'foo' },
                folderQueries: [{
                        folder: uri_1.URI.parse('file://c:/')
                    }]
            };
            result.add([{
                    resource: uri_1.URI.parse('file:///c:/foo'),
                    results: [{
                            preview: {
                                text: 'bar',
                                matches: {
                                    startLineNumber: 0,
                                    startColumn: 0,
                                    endLineNumber: 0,
                                    endColumn: 1
                                }
                            },
                            ranges: {
                                startLineNumber: 1,
                                startColumn: 0,
                                endLineNumber: 1,
                                endColumn: 1
                            }
                        }]
                }]);
            let fileMatch = result.matches()[0];
            let lineMatch = fileMatch.matches()[0];
            assert.equal(fileMatch.id(), 'file:///c%3A/foo');
            assert.equal(lineMatch.id(), 'file:///c%3A/foo>[2,1 -> 2,2]b');
        });
        test('Comparer', () => {
            let fileMatch1 = aFileMatch('C:\\foo');
            let fileMatch2 = aFileMatch('C:\\with\\path');
            let fileMatch3 = aFileMatch('C:\\with\\path\\foo');
            let lineMatch1 = new searchModel_1.Match(fileMatch1, ['bar'], new search_1.OneLineRange(0, 1, 1), new search_1.OneLineRange(0, 1, 1));
            let lineMatch2 = new searchModel_1.Match(fileMatch1, ['bar'], new search_1.OneLineRange(0, 1, 1), new search_1.OneLineRange(2, 1, 1));
            let lineMatch3 = new searchModel_1.Match(fileMatch1, ['bar'], new search_1.OneLineRange(0, 1, 1), new search_1.OneLineRange(2, 1, 1));
            assert(searchModel_1.searchMatchComparer(fileMatch1, fileMatch2) < 0);
            assert(searchModel_1.searchMatchComparer(fileMatch2, fileMatch1) > 0);
            assert(searchModel_1.searchMatchComparer(fileMatch1, fileMatch1) === 0);
            assert(searchModel_1.searchMatchComparer(fileMatch2, fileMatch3) < 0);
            assert(searchModel_1.searchMatchComparer(lineMatch1, lineMatch2) < 0);
            assert(searchModel_1.searchMatchComparer(lineMatch2, lineMatch1) > 0);
            assert(searchModel_1.searchMatchComparer(lineMatch2, lineMatch3) === 0);
        });
        function aFileMatch(path, searchResult, ...lineMatches) {
            let rawMatch = {
                resource: uri_1.URI.file('C:\\' + path),
                results: lineMatches
            };
            return instantiation.createInstance(searchModel_1.FileMatch, null, null, null, searchResult, rawMatch);
        }
        function stubModelService(instantiationService) {
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
            return instantiationService.createInstance(modelServiceImpl_1.ModelServiceImpl);
        }
    });
});
//# sourceMappingURL=searchViewlet.test.js.map