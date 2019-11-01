/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/test/workbenchTestServices", "vs/workbench/services/search/common/search", "vs/workbench/api/browser/mainThreadWorkspace", "assert", "vs/workbench/test/electron-browser/api/testRPCProtocol", "vs/base/common/cancellation", "vs/platform/configuration/common/configuration"], function (require, exports, workbenchTestServices_1, search_1, mainThreadWorkspace_1, assert, testRPCProtocol_1, cancellation_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('MainThreadWorkspace', () => {
        let configService;
        let instantiationService;
        setup(() => {
            instantiationService = workbenchTestServices_1.workbenchInstantiationService();
            configService = instantiationService.get(configuration_1.IConfigurationService);
            configService.setUserConfiguration('search', {});
        });
        test('simple', () => {
            instantiationService.stub(search_1.ISearchService, {
                fileSearch(query) {
                    assert.equal(query.folderQueries.length, 1);
                    assert.equal(query.folderQueries[0].disregardIgnoreFiles, true);
                    assert.deepEqual(query.includePattern, { 'foo': true });
                    assert.equal(query.maxResults, 10);
                    return Promise.resolve({ results: [] });
                }
            });
            const mtw = instantiationService.createInstance(mainThreadWorkspace_1.MainThreadWorkspace, testRPCProtocol_1.SingleProxyRPCProtocol({ $initializeWorkspace: () => { } }));
            return mtw.$startFileSearch('foo', null, null, 10, new cancellation_1.CancellationTokenSource().token);
        });
        test('exclude defaults', () => {
            configService.setUserConfiguration('search', {
                'exclude': { 'searchExclude': true }
            });
            configService.setUserConfiguration('files', {
                'exclude': { 'filesExclude': true }
            });
            instantiationService.stub(search_1.ISearchService, {
                fileSearch(query) {
                    assert.equal(query.folderQueries.length, 1);
                    assert.equal(query.folderQueries[0].disregardIgnoreFiles, true);
                    assert.deepEqual(query.folderQueries[0].excludePattern, { 'filesExclude': true });
                    return Promise.resolve({ results: [] });
                }
            });
            const mtw = instantiationService.createInstance(mainThreadWorkspace_1.MainThreadWorkspace, testRPCProtocol_1.SingleProxyRPCProtocol({ $initializeWorkspace: () => { } }));
            return mtw.$startFileSearch('', null, null, 10, new cancellation_1.CancellationTokenSource().token);
        });
        test('disregard excludes', () => {
            configService.setUserConfiguration('search', {
                'exclude': { 'searchExclude': true }
            });
            configService.setUserConfiguration('files', {
                'exclude': { 'filesExclude': true }
            });
            instantiationService.stub(search_1.ISearchService, {
                fileSearch(query) {
                    assert.equal(query.folderQueries[0].excludePattern, undefined);
                    assert.deepEqual(query.excludePattern, undefined);
                    return Promise.resolve({ results: [] });
                }
            });
            const mtw = instantiationService.createInstance(mainThreadWorkspace_1.MainThreadWorkspace, testRPCProtocol_1.SingleProxyRPCProtocol({ $initializeWorkspace: () => { } }));
            return mtw.$startFileSearch('', null, false, 10, new cancellation_1.CancellationTokenSource().token);
        });
        test('exclude string', () => {
            instantiationService.stub(search_1.ISearchService, {
                fileSearch(query) {
                    assert.equal(query.folderQueries[0].excludePattern, undefined);
                    assert.deepEqual(query.excludePattern, { 'exclude/**': true });
                    return Promise.resolve({ results: [] });
                }
            });
            const mtw = instantiationService.createInstance(mainThreadWorkspace_1.MainThreadWorkspace, testRPCProtocol_1.SingleProxyRPCProtocol({ $initializeWorkspace: () => { } }));
            return mtw.$startFileSearch('', null, 'exclude/**', 10, new cancellation_1.CancellationTokenSource().token);
        });
    });
});
//# sourceMappingURL=mainThreadWorkspace.test.js.map