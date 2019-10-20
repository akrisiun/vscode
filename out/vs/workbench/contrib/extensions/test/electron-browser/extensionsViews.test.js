/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/objects", "vs/base/common/uuid", "vs/workbench/contrib/extensions/browser/extensionsViews", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/extensions/browser/extensionsWorkbenchService", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensionManagement/node/extensionManagementService", "vs/workbench/contrib/extensions/browser/extensionTipsService", "vs/workbench/services/extensionManagement/test/electron-browser/extensionEnablementService.test", "vs/platform/extensionManagement/common/extensionGalleryService", "vs/platform/url/common/url", "vs/base/common/event", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/services/extensions/common/extensions", "vs/platform/workspace/common/workspace", "vs/workbench/test/workbenchTestServices", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/url/node/urlService", "vs/base/common/uri", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/contrib/experiments/common/experimentService", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/remote/electron-browser/remoteAgentServiceImpl", "vs/platform/extensions/common/extensions", "vs/platform/ipc/electron-browser/sharedProcessService", "vs/workbench/services/extensionManagement/electron-browser/extensionManagementServerService", "vs/platform/product/common/productService", "vs/platform/label/common/label", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/test/common/mockKeybindingService"], function (require, exports, assert, objects_1, uuid_1, extensionsViews_1, instantiationServiceMock_1, extensions_1, extensionsWorkbenchService_1, extensionManagement_1, extensionManagement_2, extensionManagementUtil_1, extensionManagementService_1, extensionTipsService_1, extensionEnablementService_test_1, extensionGalleryService_1, url_1, event_1, telemetry_1, telemetryUtils_1, extensions_2, workspace_1, workbenchTestServices_1, configuration_1, log_1, urlService_1, uri_1, testConfigurationService_1, experimentService_1, remoteAgentService_1, remoteAgentServiceImpl_1, extensions_3, sharedProcessService_1, extensionManagementServerService_1, productService_1, label_1, contextkey_1, mockKeybindingService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtensionsListView Tests', () => {
        let instantiationService;
        let testableView;
        let installEvent, didInstallEvent, uninstallEvent, didUninstallEvent;
        const localEnabledTheme = aLocalExtension('first-enabled-extension', { categories: ['Themes', 'random'] });
        const localEnabledLanguage = aLocalExtension('second-enabled-extension', { categories: ['Programming languages'] });
        const localDisabledTheme = aLocalExtension('first-disabled-extension', { categories: ['themes'] });
        const localDisabledLanguage = aLocalExtension('second-disabled-extension', { categories: ['programming languages'] });
        const localRandom = aLocalExtension('random-enabled-extension', { categories: ['random'] });
        const builtInTheme = aLocalExtension('my-theme', { contributes: { themes: ['my-theme'] } }, { type: 0 /* System */ });
        const builtInBasic = aLocalExtension('my-lang', { contributes: { grammars: [{ language: 'my-language' }] } }, { type: 0 /* System */ });
        const workspaceRecommendationA = aGalleryExtension('workspace-recommendation-A');
        const workspaceRecommendationB = aGalleryExtension('workspace-recommendation-B');
        const fileBasedRecommendationA = aGalleryExtension('filebased-recommendation-A');
        const fileBasedRecommendationB = aGalleryExtension('filebased-recommendation-B');
        const otherRecommendationA = aGalleryExtension('other-recommendation-A');
        suiteSetup(() => {
            installEvent = new event_1.Emitter();
            didInstallEvent = new event_1.Emitter();
            uninstallEvent = new event_1.Emitter();
            didUninstallEvent = new event_1.Emitter();
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            instantiationService.stub(log_1.ILogService, log_1.NullLogService);
            instantiationService.stub(workspace_1.IWorkspaceContextService, new workbenchTestServices_1.TestContextService());
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
            instantiationService.stub(extensionManagement_1.IExtensionGalleryService, extensionGalleryService_1.ExtensionGalleryService);
            instantiationService.stub(sharedProcessService_1.ISharedProcessService, workbenchTestServices_1.TestSharedProcessService);
            instantiationService.stub(experimentService_1.IExperimentService, experimentService_1.ExperimentService);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, extensionManagementService_1.ExtensionManagementService);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onInstallExtension', installEvent.event);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onDidInstallExtension', didInstallEvent.event);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onUninstallExtension', uninstallEvent.event);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onDidUninstallExtension', didUninstallEvent.event);
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, remoteAgentServiceImpl_1.RemoteAgentService);
            instantiationService.stub(contextkey_1.IContextKeyService, mockKeybindingService_1.MockContextKeyService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, new class extends extensionManagementServerService_1.ExtensionManagementServerService {
                constructor() {
                    super(instantiationService.get(sharedProcessService_1.ISharedProcessService), instantiationService.get(remoteAgentService_1.IRemoteAgentService), instantiationService.get(extensionManagement_1.IExtensionGalleryService), instantiationService.get(configuration_1.IConfigurationService), instantiationService.get(productService_1.IProductService), instantiationService.get(log_1.ILogService), instantiationService.get(label_1.ILabelService));
                    this._localExtensionManagementServer = { extensionManagementService: instantiationService.get(extensionManagement_1.IExtensionManagementService), label: 'local', authority: 'vscode-local' };
                }
                get localExtensionManagementServer() { return this._localExtensionManagementServer; }
                set localExtensionManagementServer(server) { }
            }());
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            instantiationService.stub(extensionManagement_2.IExtensionTipsService, extensionTipsService_1.ExtensionTipsService);
            instantiationService.stub(url_1.IURLService, urlService_1.URLService);
            instantiationService.stubPromise(extensionManagement_2.IExtensionTipsService, 'getWorkspaceRecommendations', [
                { extensionId: workspaceRecommendationA.identifier.id },
                { extensionId: workspaceRecommendationB.identifier.id }
            ]);
            instantiationService.stub(extensionManagement_2.IExtensionTipsService, 'getFileBasedRecommendations', [
                { extensionId: fileBasedRecommendationA.identifier.id },
                { extensionId: fileBasedRecommendationB.identifier.id }
            ]);
            instantiationService.stubPromise(extensionManagement_2.IExtensionTipsService, 'getOtherRecommendations', [
                { extensionId: otherRecommendationA.identifier.id }
            ]);
            const reasons = {};
            reasons[workspaceRecommendationA.identifier.id] = { reasonId: 0 /* Workspace */ };
            reasons[workspaceRecommendationB.identifier.id] = { reasonId: 0 /* Workspace */ };
            reasons[fileBasedRecommendationA.identifier.id] = { reasonId: 1 /* File */ };
            reasons[fileBasedRecommendationB.identifier.id] = { reasonId: 1 /* File */ };
            reasons[otherRecommendationA.identifier.id] = { reasonId: 2 /* Executable */ };
            instantiationService.stub(extensionManagement_2.IExtensionTipsService, 'getAllRecommendationsWithReason', reasons);
        });
        setup(async () => {
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [localEnabledTheme, localEnabledLanguage, localRandom, localDisabledTheme, localDisabledLanguage, builtInTheme, builtInBasic]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getExtensionsReport', []);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage());
            instantiationService.stubPromise(experimentService_1.IExperimentService, 'getExperimentsByType', []);
            instantiationService.stub(extensions_2.IExtensionService, {
                getExtensions: () => {
                    return Promise.resolve([
                        toExtensionDescription(localEnabledTheme),
                        toExtensionDescription(localEnabledLanguage),
                        toExtensionDescription(localRandom),
                        toExtensionDescription(builtInTheme),
                        toExtensionDescription(builtInBasic)
                    ]);
                }
            });
            await instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([localDisabledTheme], 2 /* DisabledGlobally */);
            await instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([localDisabledLanguage], 2 /* DisabledGlobally */);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            testableView = instantiationService.createInstance(extensionsViews_1.ExtensionsListView, {});
        });
        teardown(() => {
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).dispose();
            testableView.dispose();
        });
        test('Test query types', () => {
            assert.equal(extensionsViews_1.ExtensionsListView.isBuiltInExtensionsQuery('@builtin'), true);
            assert.equal(extensionsViews_1.ExtensionsListView.isLocalExtensionsQuery('@installed'), true);
            assert.equal(extensionsViews_1.ExtensionsListView.isLocalExtensionsQuery('@enabled'), true);
            assert.equal(extensionsViews_1.ExtensionsListView.isLocalExtensionsQuery('@disabled'), true);
            assert.equal(extensionsViews_1.ExtensionsListView.isLocalExtensionsQuery('@outdated'), true);
            assert.equal(extensionsViews_1.ExtensionsListView.isLocalExtensionsQuery('@installed searchText'), true);
            assert.equal(extensionsViews_1.ExtensionsListView.isLocalExtensionsQuery('@enabled searchText'), true);
            assert.equal(extensionsViews_1.ExtensionsListView.isLocalExtensionsQuery('@disabled searchText'), true);
            assert.equal(extensionsViews_1.ExtensionsListView.isLocalExtensionsQuery('@outdated searchText'), true);
        });
        test('Test empty query equates to sort by install count', () => {
            const target = instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage());
            return testableView.show('').then(() => {
                assert.ok(target.calledOnce);
                const options = target.args[0][0];
                assert.equal(options.sortBy, 4 /* InstallCount */);
            });
        });
        test('Test non empty query without sort doesnt use sortBy', () => {
            const target = instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage());
            return testableView.show('some extension').then(() => {
                assert.ok(target.calledOnce);
                const options = target.args[0][0];
                assert.equal(options.sortBy, undefined);
            });
        });
        test('Test query with sort uses sortBy', () => {
            const target = instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage());
            return testableView.show('some extension @sort:rating').then(() => {
                assert.ok(target.calledOnce);
                const options = target.args[0][0];
                assert.equal(options.sortBy, 12 /* WeightedRating */);
            });
        });
        test('Test installed query results', async () => {
            await testableView.show('@installed').then(result => {
                assert.equal(result.length, 5, 'Unexpected number of results for @installed query');
                const actual = [result.get(0).name, result.get(1).name, result.get(2).name, result.get(3).name, result.get(4).name].sort();
                const expected = [localDisabledTheme.manifest.name, localEnabledTheme.manifest.name, localRandom.manifest.name, localDisabledLanguage.manifest.name, localEnabledLanguage.manifest.name];
                for (let i = 0; i < result.length; i++) {
                    assert.equal(actual[i], expected[i], 'Unexpected extension for @installed query.');
                }
            });
            await testableView.show('@installed first').then(result => {
                assert.equal(result.length, 2, 'Unexpected number of results for @installed query');
                assert.equal(result.get(0).name, localEnabledTheme.manifest.name, 'Unexpected extension for @installed query with search text.');
                assert.equal(result.get(1).name, localDisabledTheme.manifest.name, 'Unexpected extension for @installed query with search text.');
            });
            await testableView.show('@disabled').then(result => {
                assert.equal(result.length, 2, 'Unexpected number of results for @disabled query');
                assert.equal(result.get(0).name, localDisabledTheme.manifest.name, 'Unexpected extension for @disabled query.');
                assert.equal(result.get(1).name, localDisabledLanguage.manifest.name, 'Unexpected extension for @disabled query.');
            });
            await testableView.show('@enabled').then(result => {
                assert.equal(result.length, 3, 'Unexpected number of results for @enabled query');
                assert.equal(result.get(0).name, localEnabledTheme.manifest.name, 'Unexpected extension for @enabled query.');
                assert.equal(result.get(1).name, localRandom.manifest.name, 'Unexpected extension for @enabled query.');
                assert.equal(result.get(2).name, localEnabledLanguage.manifest.name, 'Unexpected extension for @enabled query.');
            });
            await testableView.show('@builtin:themes').then(result => {
                assert.equal(result.length, 1, 'Unexpected number of results for @builtin:themes query');
                assert.equal(result.get(0).name, builtInTheme.manifest.name, 'Unexpected extension for @builtin:themes query.');
            });
            await testableView.show('@builtin:basics').then(result => {
                assert.equal(result.length, 1, 'Unexpected number of results for @builtin:basics query');
                assert.equal(result.get(0).name, builtInBasic.manifest.name, 'Unexpected extension for @builtin:basics query.');
            });
            await testableView.show('@builtin').then(result => {
                assert.equal(result.length, 2, 'Unexpected number of results for @builtin query');
                assert.equal(result.get(0).name, builtInBasic.manifest.name, 'Unexpected extension for @builtin query.');
                assert.equal(result.get(1).name, builtInTheme.manifest.name, 'Unexpected extension for @builtin query.');
            });
            await testableView.show('@builtin my-theme').then(result => {
                assert.equal(result.length, 1, 'Unexpected number of results for @builtin query');
                assert.equal(result.get(0).name, builtInTheme.manifest.name, 'Unexpected extension for @builtin query.');
            });
        });
        test('Test installed query with category', async () => {
            await testableView.show('@installed category:themes').then(result => {
                assert.equal(result.length, 2, 'Unexpected number of results for @installed query with category');
                assert.equal(result.get(0).name, localEnabledTheme.manifest.name, 'Unexpected extension for @installed query with category.');
                assert.equal(result.get(1).name, localDisabledTheme.manifest.name, 'Unexpected extension for @installed query with category.');
            });
            await testableView.show('@installed category:"themes"').then(result => {
                assert.equal(result.length, 2, 'Unexpected number of results for @installed query with quoted category');
                assert.equal(result.get(0).name, localEnabledTheme.manifest.name, 'Unexpected extension for @installed query with quoted category.');
                assert.equal(result.get(1).name, localDisabledTheme.manifest.name, 'Unexpected extension for @installed query with quoted category.');
            });
            await testableView.show('@installed category:"programming languages"').then(result => {
                assert.equal(result.length, 2, 'Unexpected number of results for @installed query with quoted category including space');
                assert.equal(result.get(0).name, localEnabledLanguage.manifest.name, 'Unexpected extension for @installed query with quoted category including space.');
                assert.equal(result.get(1).name, localDisabledLanguage.manifest.name, 'Unexpected extension for @installed query with quoted category inlcuding space.');
            });
            await testableView.show('@installed category:themes category:random').then(result => {
                assert.equal(result.length, 3, 'Unexpected number of results for @installed query with multiple category');
                assert.equal(result.get(0).name, localEnabledTheme.manifest.name, 'Unexpected extension for @installed query with multiple category.');
                assert.equal(result.get(1).name, localRandom.manifest.name, 'Unexpected extension for @installed query with multiple category.');
                assert.equal(result.get(2).name, localDisabledTheme.manifest.name, 'Unexpected extension for @installed query with multiple category.');
            });
            await testableView.show('@enabled category:themes').then(result => {
                assert.equal(result.length, 1, 'Unexpected number of results for @enabled query with category');
                assert.equal(result.get(0).name, localEnabledTheme.manifest.name, 'Unexpected extension for @enabled query with category.');
            });
            await testableView.show('@enabled category:"themes"').then(result => {
                assert.equal(result.length, 1, 'Unexpected number of results for @enabled query with quoted category');
                assert.equal(result.get(0).name, localEnabledTheme.manifest.name, 'Unexpected extension for @enabled query with quoted category.');
            });
            await testableView.show('@enabled category:"programming languages"').then(result => {
                assert.equal(result.length, 1, 'Unexpected number of results for @enabled query with quoted category inlcuding space');
                assert.equal(result.get(0).name, localEnabledLanguage.manifest.name, 'Unexpected extension for @enabled query with quoted category including space.');
            });
            await testableView.show('@disabled category:themes').then(result => {
                assert.equal(result.length, 1, 'Unexpected number of results for @disabled query with category');
                assert.equal(result.get(0).name, localDisabledTheme.manifest.name, 'Unexpected extension for @disabled query with category.');
            });
            await testableView.show('@disabled category:"themes"').then(result => {
                assert.equal(result.length, 1, 'Unexpected number of results for @disabled query with quoted category');
                assert.equal(result.get(0).name, localDisabledTheme.manifest.name, 'Unexpected extension for @disabled query with quoted category.');
            });
            await testableView.show('@disabled category:"programming languages"').then(result => {
                assert.equal(result.length, 1, 'Unexpected number of results for @disabled query with quoted category inlcuding space');
                assert.equal(result.get(0).name, localDisabledLanguage.manifest.name, 'Unexpected extension for @disabled query with quoted category including space.');
            });
        });
        test('Test @recommended:workspace query', () => {
            const workspaceRecommendedExtensions = [
                workspaceRecommendationA,
                workspaceRecommendationB
            ];
            const target = instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(...workspaceRecommendedExtensions));
            return testableView.show('@recommended:workspace').then(result => {
                assert.ok(target.calledOnce);
                const options = target.args[0][0];
                assert.equal(options.names.length, workspaceRecommendedExtensions.length);
                assert.equal(result.length, workspaceRecommendedExtensions.length);
                for (let i = 0; i < workspaceRecommendedExtensions.length; i++) {
                    assert.equal(options.names[i], workspaceRecommendedExtensions[i].identifier.id);
                    assert.equal(result.get(i).identifier.id, workspaceRecommendedExtensions[i].identifier.id);
                }
            });
        });
        test('Test @recommended query', () => {
            const allRecommendedExtensions = [
                fileBasedRecommendationA,
                fileBasedRecommendationB,
                otherRecommendationA
            ];
            const target = instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(...allRecommendedExtensions));
            return testableView.show('@recommended').then(result => {
                const options = target.args[0][0];
                assert.ok(target.calledOnce);
                assert.equal(options.names.length, allRecommendedExtensions.length);
                assert.equal(result.length, allRecommendedExtensions.length);
                for (let i = 0; i < allRecommendedExtensions.length; i++) {
                    assert.equal(options.names[i], allRecommendedExtensions[i].identifier.id);
                    assert.equal(result.get(i).identifier.id, allRecommendedExtensions[i].identifier.id);
                }
            });
        });
        test('Test @recommended:all query', () => {
            const allRecommendedExtensions = [
                workspaceRecommendationA,
                workspaceRecommendationB,
                fileBasedRecommendationA,
                fileBasedRecommendationB,
                otherRecommendationA
            ];
            const target = instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(...allRecommendedExtensions));
            return testableView.show('@recommended:all').then(result => {
                const options = target.args[0][0];
                assert.ok(target.calledOnce);
                assert.equal(options.names.length, allRecommendedExtensions.length);
                assert.equal(result.length, allRecommendedExtensions.length);
                for (let i = 0; i < allRecommendedExtensions.length; i++) {
                    assert.equal(options.names[i], allRecommendedExtensions[i].identifier.id);
                    assert.equal(result.get(i).identifier.id, allRecommendedExtensions[i].identifier.id);
                }
            });
        });
        test('Test curated list experiment', () => {
            const curatedList = [
                workspaceRecommendationA,
                fileBasedRecommendationA
            ];
            const experimentTarget = instantiationService.stubPromise(experimentService_1.IExperimentService, 'getCuratedExtensionsList', curatedList.map(e => e.identifier.id));
            const queryTarget = instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(...curatedList));
            return testableView.show('curated:mykey').then(result => {
                const curatedKey = experimentTarget.args[0][0];
                const options = queryTarget.args[0][0];
                assert.ok(experimentTarget.calledOnce);
                assert.ok(queryTarget.calledOnce);
                assert.equal(options.names.length, curatedList.length);
                assert.equal(result.length, curatedList.length);
                for (let i = 0; i < curatedList.length; i++) {
                    assert.equal(options.names[i], curatedList[i].identifier.id);
                    assert.equal(result.get(i).identifier.id, curatedList[i].identifier.id);
                }
                assert.equal(curatedKey, 'mykey');
            });
        });
        test('Test search', () => {
            const searchText = 'search-me';
            const results = [
                fileBasedRecommendationA,
                workspaceRecommendationA,
                otherRecommendationA,
                workspaceRecommendationB
            ];
            const queryTarget = instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(...results));
            return testableView.show('search-me').then(result => {
                const options = queryTarget.args[0][0];
                assert.ok(queryTarget.calledOnce);
                assert.equal(options.text, searchText);
                assert.equal(result.length, results.length);
                for (let i = 0; i < results.length; i++) {
                    assert.equal(result.get(i).identifier.id, results[i].identifier.id);
                }
            });
        });
        test('Test preferred search experiment', () => {
            const searchText = 'search-me';
            const actual = [
                fileBasedRecommendationA,
                workspaceRecommendationA,
                otherRecommendationA,
                workspaceRecommendationB
            ];
            const expected = [
                workspaceRecommendationA,
                workspaceRecommendationB,
                fileBasedRecommendationA,
                otherRecommendationA
            ];
            const queryTarget = instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(...actual));
            const experimentTarget = instantiationService.stubPromise(experimentService_1.IExperimentService, 'getExperimentsByType', [{
                    id: 'someId',
                    enabled: true,
                    state: 2 /* Run */,
                    action: {
                        type: experimentService_1.ExperimentActionType.ExtensionSearchResults,
                        properties: {
                            searchText: 'search-me',
                            preferredResults: [
                                workspaceRecommendationA.identifier.id,
                                'something-that-wasnt-in-first-page',
                                workspaceRecommendationB.identifier.id
                            ]
                        }
                    }
                }]);
            testableView.dispose();
            testableView = instantiationService.createInstance(extensionsViews_1.ExtensionsListView, {});
            return testableView.show('search-me').then(result => {
                const options = queryTarget.args[0][0];
                assert.ok(experimentTarget.calledOnce);
                assert.ok(queryTarget.calledOnce);
                assert.equal(options.text, searchText);
                assert.equal(result.length, expected.length);
                for (let i = 0; i < expected.length; i++) {
                    assert.equal(result.get(i).identifier.id, expected[i].identifier.id);
                }
            });
        });
        test('Skip preferred search experiment when user defines sort order', () => {
            const searchText = 'search-me';
            const realResults = [
                fileBasedRecommendationA,
                workspaceRecommendationA,
                otherRecommendationA,
                workspaceRecommendationB
            ];
            const queryTarget = instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(...realResults));
            testableView.dispose();
            testableView = instantiationService.createInstance(extensionsViews_1.ExtensionsListView, {});
            return testableView.show('search-me @sort:installs').then(result => {
                const options = queryTarget.args[0][0];
                assert.ok(queryTarget.calledOnce);
                assert.equal(options.text, searchText);
                assert.equal(result.length, realResults.length);
                for (let i = 0; i < realResults.length; i++) {
                    assert.equal(result.get(i).identifier.id, realResults[i].identifier.id);
                }
            });
        });
        function aLocalExtension(name = 'someext', manifest = {}, properties = {}) {
            manifest = objects_1.assign({ name, publisher: 'pub', version: '1.0.0' }, manifest);
            properties = objects_1.assign({
                type: 1 /* User */,
                location: uri_1.URI.file(`pub.${name}`),
                identifier: { id: extensionManagementUtil_1.getGalleryExtensionId(manifest.publisher, manifest.name), uuid: undefined },
                metadata: { id: extensionManagementUtil_1.getGalleryExtensionId(manifest.publisher, manifest.name), publisherId: manifest.publisher, publisherDisplayName: 'somename' }
            }, properties);
            return Object.create(Object.assign({ manifest }, properties));
        }
        function aGalleryExtension(name, properties = {}, galleryExtensionProperties = {}, assets = {}) {
            const galleryExtension = Object.create({});
            objects_1.assign(galleryExtension, { name, publisher: 'pub', version: '1.0.0', properties: {}, assets: {} }, properties);
            objects_1.assign(galleryExtension.properties, { dependencies: [] }, galleryExtensionProperties);
            objects_1.assign(galleryExtension.assets, assets);
            galleryExtension.identifier = { id: extensionManagementUtil_1.getGalleryExtensionId(galleryExtension.publisher, galleryExtension.name), uuid: uuid_1.generateUuid() };
            return galleryExtension;
        }
        function aPage(...objects) {
            return { firstPage: objects, total: objects.length, pageSize: objects.length, getPage: () => null };
        }
        function toExtensionDescription(local) {
            return Object.assign({ identifier: new extensions_3.ExtensionIdentifier(local.identifier.id), isBuiltin: local.type === 0 /* System */, isUnderDevelopment: false, extensionLocation: local.location }, local.manifest);
        }
    });
});
//# sourceMappingURL=extensionsViews.test.js.map