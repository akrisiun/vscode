/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "sinon", "assert", "vs/base/common/path", "fs", "os", "vs/base/common/uuid", "vs/base/node/pfs", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/contrib/extensions/browser/extensionTipsService", "vs/platform/extensionManagement/common/extensionGalleryService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/base/common/event", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/workspace/common/workspace", "vs/workbench/test/workbenchTestServices", "vs/platform/notification/test/common/testNotificationService", "vs/platform/configuration/common/configuration", "vs/base/common/uri", "vs/platform/workspace/test/common/testWorkspace", "vs/platform/configuration/test/common/testConfigurationService", "vs/base/common/objects", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/environment/common/environment", "vs/workbench/contrib/extensions/common/extensions", "vs/platform/extensionManagement/node/extensionManagementService", "vs/workbench/services/extensionManagement/test/electron-browser/extensionEnablementService.test", "vs/platform/url/common/url", "vs/editor/common/services/modelService", "vs/platform/lifecycle/common/lifecycle", "vs/platform/notification/common/notification", "vs/platform/url/node/urlService", "vs/workbench/contrib/experiments/common/experimentService", "vs/workbench/contrib/experiments/test/electron-browser/experimentService.test", "vs/platform/storage/common/storage", "vs/platform/ipc/electron-browser/sharedProcessService", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/base/common/network", "vs/platform/files/node/diskFileSystemProvider", "vs/platform/files/common/files", "vs/platform/product/common/productService"], function (require, exports, sinon, assert, path, fs, os, uuid, pfs_1, extensionManagement_1, extensionManagement_2, extensionTipsService_1, extensionGalleryService_1, instantiationServiceMock_1, event_1, telemetry_1, telemetryUtils_1, workspace_1, workbenchTestServices_1, testNotificationService_1, configuration_1, uri_1, testWorkspace_1, testConfigurationService_1, objects_1, extensionManagementUtil_1, environment_1, extensions_1, extensionManagementService_1, extensionEnablementService_test_1, url_1, modelService_1, lifecycle_1, notification_1, urlService_1, experimentService_1, experimentService_test_1, storage_1, sharedProcessService_1, fileService_1, log_1, network_1, diskFileSystemProvider_1, files_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const mockExtensionGallery = [
        aGalleryExtension('MockExtension1', {
            displayName: 'Mock Extension 1',
            version: '1.5',
            publisherId: 'mockPublisher1Id',
            publisher: 'mockPublisher1',
            publisherDisplayName: 'Mock Publisher 1',
            description: 'Mock Description',
            installCount: 1000,
            rating: 4,
            ratingCount: 100
        }, {
            dependencies: ['pub.1'],
        }, {
            manifest: { uri: 'uri:manifest', fallbackUri: 'fallback:manifest' },
            readme: { uri: 'uri:readme', fallbackUri: 'fallback:readme' },
            changelog: { uri: 'uri:changelog', fallbackUri: 'fallback:changlog' },
            download: { uri: 'uri:download', fallbackUri: 'fallback:download' },
            icon: { uri: 'uri:icon', fallbackUri: 'fallback:icon' },
            license: { uri: 'uri:license', fallbackUri: 'fallback:license' },
            repository: { uri: 'uri:repository', fallbackUri: 'fallback:repository' },
            coreTranslations: []
        }),
        aGalleryExtension('MockExtension2', {
            displayName: 'Mock Extension 2',
            version: '1.5',
            publisherId: 'mockPublisher2Id',
            publisher: 'mockPublisher2',
            publisherDisplayName: 'Mock Publisher 2',
            description: 'Mock Description',
            installCount: 1000,
            rating: 4,
            ratingCount: 100
        }, {
            dependencies: ['pub.1', 'pub.2'],
        }, {
            manifest: { uri: 'uri:manifest', fallbackUri: 'fallback:manifest' },
            readme: { uri: 'uri:readme', fallbackUri: 'fallback:readme' },
            changelog: { uri: 'uri:changelog', fallbackUri: 'fallback:changlog' },
            download: { uri: 'uri:download', fallbackUri: 'fallback:download' },
            icon: { uri: 'uri:icon', fallbackUri: 'fallback:icon' },
            license: { uri: 'uri:license', fallbackUri: 'fallback:license' },
            repository: { uri: 'uri:repository', fallbackUri: 'fallback:repository' },
            coreTranslations: []
        })
    ];
    const mockExtensionLocal = [
        {
            type: 1 /* User */,
            identifier: mockExtensionGallery[0].identifier,
            manifest: {
                name: mockExtensionGallery[0].name,
                publisher: mockExtensionGallery[0].publisher,
                version: mockExtensionGallery[0].version
            },
            metadata: null,
            path: 'somepath',
            readmeUrl: 'some readmeUrl',
            changelogUrl: 'some changelogUrl'
        },
        {
            type: 1 /* User */,
            identifier: mockExtensionGallery[1].identifier,
            manifest: {
                name: mockExtensionGallery[1].name,
                publisher: mockExtensionGallery[1].publisher,
                version: mockExtensionGallery[1].version
            },
            metadata: null,
            path: 'somepath',
            readmeUrl: 'some readmeUrl',
            changelogUrl: 'some changelogUrl'
        }
    ];
    const mockTestData = {
        recommendedExtensions: [
            'mockPublisher1.mockExtension1',
            'MOCKPUBLISHER2.mockextension2',
            'badlyformattedextension',
            'MOCKPUBLISHER2.mockextension2',
            'unknown.extension'
        ],
        validRecommendedExtensions: [
            'mockPublisher1.mockExtension1',
            'MOCKPUBLISHER2.mockextension2'
        ]
    };
    function aPage(...objects) {
        return { firstPage: objects, total: objects.length, pageSize: objects.length, getPage: () => null };
    }
    const noAssets = {
        changelog: null,
        download: null,
        icon: null,
        license: null,
        manifest: null,
        readme: null,
        repository: null,
        coreTranslations: []
    };
    function aGalleryExtension(name, properties = {}, galleryExtensionProperties = {}, assets = noAssets) {
        const galleryExtension = Object.create({});
        objects_1.assign(galleryExtension, { name, publisher: 'pub', version: '1.0.0', properties: {}, assets: {} }, properties);
        objects_1.assign(galleryExtension.properties, { dependencies: [] }, galleryExtensionProperties);
        objects_1.assign(galleryExtension.assets, assets);
        galleryExtension.identifier = { id: extensionManagementUtil_1.getGalleryExtensionId(galleryExtension.publisher, galleryExtension.name), uuid: uuid.generateUuid() };
        return galleryExtension;
    }
    suite('ExtensionsTipsService Test', () => {
        let workspaceService;
        let instantiationService;
        let testConfigurationService;
        let testObject;
        let parentResource;
        let installEvent, didInstallEvent, uninstallEvent, didUninstallEvent;
        let prompted;
        let onModelAddedEvent;
        let experimentService;
        suiteSetup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            installEvent = new event_1.Emitter();
            didInstallEvent = new event_1.Emitter();
            uninstallEvent = new event_1.Emitter();
            didUninstallEvent = new event_1.Emitter();
            instantiationService.stub(extensionManagement_1.IExtensionGalleryService, extensionGalleryService_1.ExtensionGalleryService);
            instantiationService.stub(sharedProcessService_1.ISharedProcessService, workbenchTestServices_1.TestSharedProcessService);
            instantiationService.stub(lifecycle_1.ILifecycleService, new workbenchTestServices_1.TestLifecycleService());
            testConfigurationService = new testConfigurationService_1.TestConfigurationService();
            instantiationService.stub(configuration_1.IConfigurationService, testConfigurationService);
            instantiationService.stub(notification_1.INotificationService, new testNotificationService_1.TestNotificationService());
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, extensionManagementService_1.ExtensionManagementService);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onInstallExtension', installEvent.event);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onDidInstallExtension', didInstallEvent.event);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onUninstallExtension', uninstallEvent.event);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onDidUninstallExtension', didUninstallEvent.event);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            instantiationService.stub(url_1.IURLService, urlService_1.URLService);
            instantiationService.set(productService_1.IProductService, Object.assign(Object.assign({}, workbenchTestServices_1.productService), {
                extensionTips: {
                    'ms-vscode.csharp': '{**/*.cs,**/project.json,**/global.json,**/*.csproj,**/*.sln,**/appsettings.json}',
                    'msjsdiag.debugger-for-chrome': '{**/*.ts,**/*.tsx**/*.js,**/*.jsx,**/*.es6,**/.babelrc}',
                    'lukehoban.Go': '**/*.go'
                },
                extensionImportantTips: {
                    'ms-python.python': {
                        'name': 'Python',
                        'pattern': '{**/*.py}'
                    },
                    'ms-vscode.PowerShell': {
                        'name': 'PowerShell',
                        'pattern': '{**/*.ps,**/*.ps1}'
                    }
                }
            }));
            experimentService = instantiationService.createInstance(experimentService_test_1.TestExperimentService);
            instantiationService.stub(experimentService_1.IExperimentService, experimentService);
            onModelAddedEvent = new event_1.Emitter();
        });
        suiteTeardown(() => {
            if (experimentService) {
                experimentService.dispose();
            }
        });
        setup(() => {
            instantiationService.stub(environment_1.IEnvironmentService, {});
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', []);
            instantiationService.stub(extensionManagement_1.IExtensionGalleryService, 'isEnabled', true);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(...mockExtensionGallery));
            prompted = false;
            class TestNotificationService2 extends testNotificationService_1.TestNotificationService {
                prompt(severity, message, choices, options) {
                    prompted = true;
                    return null;
                }
            }
            instantiationService.stub(notification_1.INotificationService, new TestNotificationService2());
            testConfigurationService.setUserConfiguration(extensions_1.ConfigurationKey, { ignoreRecommendations: false, showRecommendationsOnlyOnDemand: false });
            instantiationService.stub(storage_1.IStorageService, { get: (a, b, c) => c, getBoolean: (a, b, c) => c, store: () => { } });
            instantiationService.stub(modelService_1.IModelService, {
                getModels() { return []; },
                onModelAdded: onModelAddedEvent.event
            });
        });
        teardown(done => {
            testObject.dispose();
            if (parentResource) {
                pfs_1.rimraf(parentResource, pfs_1.RimRafMode.MOVE).then(done, done);
            }
            else {
                done();
            }
        });
        function setUpFolderWorkspace(folderName, recommendedExtensions, ignoredRecommendations = []) {
            const id = uuid.generateUuid();
            parentResource = path.join(os.tmpdir(), 'vsctests', id);
            return setUpFolder(folderName, parentResource, recommendedExtensions, ignoredRecommendations);
        }
        async function setUpFolder(folderName, parentDir, recommendedExtensions, ignoredRecommendations = []) {
            const folderDir = path.join(parentDir, folderName);
            const workspaceSettingsDir = path.join(folderDir, '.vscode');
            await pfs_1.mkdirp(workspaceSettingsDir, 493);
            const configPath = path.join(workspaceSettingsDir, 'extensions.json');
            fs.writeFileSync(configPath, JSON.stringify({
                'recommendations': recommendedExtensions,
                'unwantedRecommendations': ignoredRecommendations,
            }, null, '\t'));
            const myWorkspace = testWorkspace_1.testWorkspace(uri_1.URI.from({ scheme: 'file', path: folderDir }));
            workspaceService = new workbenchTestServices_1.TestContextService(myWorkspace);
            instantiationService.stub(workspace_1.IWorkspaceContextService, workspaceService);
            const fileService = new fileService_1.FileService(new log_1.NullLogService());
            fileService.registerProvider(network_1.Schemas.file, new diskFileSystemProvider_1.DiskFileSystemProvider(new log_1.NullLogService()));
            instantiationService.stub(files_1.IFileService, fileService);
        }
        function testNoPromptForValidRecommendations(recommendations) {
            return setUpFolderWorkspace('myFolder', recommendations).then(() => {
                testObject = instantiationService.createInstance(extensionTipsService_1.ExtensionTipsService);
                return testObject.loadWorkspaceConfigPromise.then(() => {
                    assert.equal(Object.keys(testObject.getAllRecommendationsWithReason()).length, recommendations.length);
                    assert.ok(!prompted);
                });
            });
        }
        function testNoPromptOrRecommendationsForValidRecommendations(recommendations) {
            return setUpFolderWorkspace('myFolder', mockTestData.validRecommendedExtensions).then(() => {
                testObject = instantiationService.createInstance(extensionTipsService_1.ExtensionTipsService);
                assert.ok(!prompted);
                return testObject.getWorkspaceRecommendations().then(() => {
                    assert.equal(Object.keys(testObject.getAllRecommendationsWithReason()).length, 0);
                    assert.ok(!prompted);
                });
            });
        }
        test('ExtensionTipsService: No Prompt for valid workspace recommendations when galleryService is absent', () => {
            const galleryQuerySpy = sinon.spy();
            instantiationService.stub(extensionManagement_1.IExtensionGalleryService, { query: galleryQuerySpy, isEnabled: () => false });
            return testNoPromptOrRecommendationsForValidRecommendations(mockTestData.validRecommendedExtensions)
                .then(() => assert.ok(galleryQuerySpy.notCalled));
        });
        test('ExtensionTipsService: No Prompt for valid workspace recommendations during extension development', () => {
            instantiationService.stub(environment_1.IEnvironmentService, { extensionDevelopmentLocationURI: [uri_1.URI.file('/folder/file')] });
            return testNoPromptOrRecommendationsForValidRecommendations(mockTestData.validRecommendedExtensions);
        });
        test('ExtensionTipsService: No workspace recommendations or prompts when extensions.json has empty array', () => {
            return testNoPromptForValidRecommendations([]);
        });
        test('ExtensionTipsService: Prompt for valid workspace recommendations', () => {
            return setUpFolderWorkspace('myFolder', mockTestData.recommendedExtensions).then(() => {
                testObject = instantiationService.createInstance(extensionTipsService_1.ExtensionTipsService);
                return testObject.loadWorkspaceConfigPromise.then(() => {
                    const recommendations = Object.keys(testObject.getAllRecommendationsWithReason());
                    assert.equal(recommendations.length, mockTestData.validRecommendedExtensions.length);
                    mockTestData.validRecommendedExtensions.forEach(x => {
                        assert.equal(recommendations.indexOf(x.toLowerCase()) > -1, true);
                    });
                    assert.ok(prompted);
                });
            });
        });
        test('ExtensionTipsService: No Prompt for valid workspace recommendations if they are already installed', () => {
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', mockExtensionLocal);
            return testNoPromptForValidRecommendations(mockTestData.validRecommendedExtensions);
        });
        test('ExtensionTipsService: No Prompt for valid workspace recommendations with casing mismatch if they are already installed', () => {
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', mockExtensionLocal);
            return testNoPromptForValidRecommendations(mockTestData.validRecommendedExtensions.map(x => x.toUpperCase()));
        });
        test('ExtensionTipsService: No Prompt for valid workspace recommendations if ignoreRecommendations is set', () => {
            testConfigurationService.setUserConfiguration(extensions_1.ConfigurationKey, { ignoreRecommendations: true });
            return testNoPromptForValidRecommendations(mockTestData.validRecommendedExtensions);
        });
        test('ExtensionTipsService: No Prompt for valid workspace recommendations if showRecommendationsOnlyOnDemand is set', () => {
            testConfigurationService.setUserConfiguration(extensions_1.ConfigurationKey, { showRecommendationsOnlyOnDemand: true });
            return setUpFolderWorkspace('myFolder', mockTestData.validRecommendedExtensions).then(() => {
                testObject = instantiationService.createInstance(extensionTipsService_1.ExtensionTipsService);
                return testObject.loadWorkspaceConfigPromise.then(() => {
                    assert.equal(Object.keys(testObject.getAllRecommendationsWithReason()).length, 0);
                    assert.ok(!prompted);
                });
            });
        });
        test('ExtensionTipsService: No Prompt for valid workspace recommendations if ignoreRecommendations is set for current workspace', () => {
            instantiationService.stub(storage_1.IStorageService, { get: (a, b, c) => c, getBoolean: (a, b, c) => a === 'extensionsAssistant/workspaceRecommendationsIgnore' || c });
            return testNoPromptForValidRecommendations(mockTestData.validRecommendedExtensions);
        });
        test('ExtensionTipsService: No Recommendations of globally ignored recommendations', () => {
            const storageGetterStub = (a, _, c) => {
                const storedRecommendations = '["ms-vscode.csharp", "ms-python.python", "ms-vscode.vscode-typescript-tslint-plugin"]';
                const ignoredRecommendations = '["ms-vscode.csharp", "mockpublisher2.mockextension2"]'; // ignore a stored recommendation and a workspace recommendation.
                if (a === 'extensionsAssistant/recommendations') {
                    return storedRecommendations;
                }
                if (a === 'extensionsAssistant/ignored_recommendations') {
                    return ignoredRecommendations;
                }
                return c;
            };
            instantiationService.stub(storage_1.IStorageService, {
                get: storageGetterStub,
                getBoolean: (a, _, c) => a === 'extensionsAssistant/workspaceRecommendationsIgnore' || c
            });
            return setUpFolderWorkspace('myFolder', mockTestData.validRecommendedExtensions).then(() => {
                testObject = instantiationService.createInstance(extensionTipsService_1.ExtensionTipsService);
                return testObject.loadWorkspaceConfigPromise.then(() => {
                    const recommendations = testObject.getAllRecommendationsWithReason();
                    assert.ok(!recommendations['ms-vscode.csharp']); // stored recommendation that has been globally ignored
                    assert.ok(recommendations['ms-python.python']); // stored recommendation
                    assert.ok(recommendations['mockpublisher1.mockextension1']); // workspace recommendation
                    assert.ok(!recommendations['mockpublisher2.mockextension2']); // workspace recommendation that has been globally ignored
                });
            });
        });
        test('ExtensionTipsService: No Recommendations of workspace ignored recommendations', () => {
            const ignoredRecommendations = ['ms-vscode.csharp', 'mockpublisher2.mockextension2']; // ignore a stored recommendation and a workspace recommendation.
            const storedRecommendations = '["ms-vscode.csharp", "ms-python.python"]';
            instantiationService.stub(storage_1.IStorageService, {
                get: (a, b, c) => a === 'extensionsAssistant/recommendations' ? storedRecommendations : c,
                getBoolean: (a, _, c) => a === 'extensionsAssistant/workspaceRecommendationsIgnore' || c
            });
            return setUpFolderWorkspace('myFolder', mockTestData.validRecommendedExtensions, ignoredRecommendations).then(() => {
                testObject = instantiationService.createInstance(extensionTipsService_1.ExtensionTipsService);
                return testObject.loadWorkspaceConfigPromise.then(() => {
                    const recommendations = testObject.getAllRecommendationsWithReason();
                    assert.ok(!recommendations['ms-vscode.csharp']); // stored recommendation that has been workspace ignored
                    assert.ok(recommendations['ms-python.python']); // stored recommendation
                    assert.ok(recommendations['mockpublisher1.mockextension1']); // workspace recommendation
                    assert.ok(!recommendations['mockpublisher2.mockextension2']); // workspace recommendation that has been workspace ignored
                });
            });
        });
        test('ExtensionTipsService: Able to retrieve collection of all ignored recommendations', () => {
            const storageGetterStub = (a, _, c) => {
                const storedRecommendations = '["ms-vscode.csharp", "ms-python.python"]';
                const globallyIgnoredRecommendations = '["mockpublisher2.mockextension2"]'; // ignore a workspace recommendation.
                if (a === 'extensionsAssistant/recommendations') {
                    return storedRecommendations;
                }
                if (a === 'extensionsAssistant/ignored_recommendations') {
                    return globallyIgnoredRecommendations;
                }
                return c;
            };
            const workspaceIgnoredRecommendations = ['ms-vscode.csharp']; // ignore a stored recommendation and a workspace recommendation.
            instantiationService.stub(storage_1.IStorageService, {
                get: storageGetterStub,
                getBoolean: (a, _, c) => a === 'extensionsAssistant/workspaceRecommendationsIgnore' || c
            });
            return setUpFolderWorkspace('myFolder', mockTestData.validRecommendedExtensions, workspaceIgnoredRecommendations).then(() => {
                testObject = instantiationService.createInstance(extensionTipsService_1.ExtensionTipsService);
                return testObject.loadWorkspaceConfigPromise.then(() => {
                    const recommendations = testObject.getAllRecommendationsWithReason();
                    assert.ok(recommendations['ms-python.python']);
                    assert.ok(!recommendations['mockpublisher2.mockextension2']);
                    assert.ok(!recommendations['ms-vscode.csharp']);
                });
            });
        });
        test('ExtensionTipsService: Able to dynamically ignore/unignore global recommendations', () => {
            const storageGetterStub = (a, _, c) => {
                const storedRecommendations = '["ms-vscode.csharp", "ms-python.python"]';
                const globallyIgnoredRecommendations = '["mockpublisher2.mockextension2"]'; // ignore a workspace recommendation.
                if (a === 'extensionsAssistant/recommendations') {
                    return storedRecommendations;
                }
                if (a === 'extensionsAssistant/ignored_recommendations') {
                    return globallyIgnoredRecommendations;
                }
                return c;
            };
            instantiationService.stub(storage_1.IStorageService, {
                get: storageGetterStub,
                store: () => { },
                getBoolean: (a, _, c) => a === 'extensionsAssistant/workspaceRecommendationsIgnore' || c
            });
            return setUpFolderWorkspace('myFolder', mockTestData.validRecommendedExtensions).then(() => {
                testObject = instantiationService.createInstance(extensionTipsService_1.ExtensionTipsService);
                return testObject.loadWorkspaceConfigPromise.then(() => {
                    const recommendations = testObject.getAllRecommendationsWithReason();
                    assert.ok(recommendations['ms-python.python']);
                    assert.ok(recommendations['mockpublisher1.mockextension1']);
                    assert.ok(!recommendations['mockpublisher2.mockextension2']);
                    return testObject.toggleIgnoredRecommendation('mockpublisher1.mockextension1', true);
                }).then(() => {
                    const recommendations = testObject.getAllRecommendationsWithReason();
                    assert.ok(recommendations['ms-python.python']);
                    assert.ok(!recommendations['mockpublisher1.mockextension1']);
                    assert.ok(!recommendations['mockpublisher2.mockextension2']);
                    return testObject.toggleIgnoredRecommendation('mockpublisher1.mockextension1', false);
                }).then(() => {
                    const recommendations = testObject.getAllRecommendationsWithReason();
                    assert.ok(recommendations['ms-python.python']);
                    assert.ok(recommendations['mockpublisher1.mockextension1']);
                    assert.ok(!recommendations['mockpublisher2.mockextension2']);
                });
            });
        });
        test('test global extensions are modified and recommendation change event is fired when an extension is ignored', () => {
            const storageSetterTarget = sinon.spy();
            const changeHandlerTarget = sinon.spy();
            const ignoredExtensionId = 'Some.Extension';
            instantiationService.stub(storage_1.IStorageService, {
                get: (a, b, c) => a === 'extensionsAssistant/ignored_recommendations' ? '["ms-vscode.vscode"]' : c,
                store: (...args) => {
                    storageSetterTarget(...args);
                }
            });
            return setUpFolderWorkspace('myFolder', []).then(() => {
                testObject = instantiationService.createInstance(extensionTipsService_1.ExtensionTipsService);
                testObject.onRecommendationChange(changeHandlerTarget);
                testObject.toggleIgnoredRecommendation(ignoredExtensionId, true);
                assert.ok(changeHandlerTarget.calledOnce);
                assert.ok(changeHandlerTarget.getCall(0).calledWithMatch({ extensionId: 'Some.Extension', isRecommended: false }));
                assert.ok(storageSetterTarget.calledWithExactly('extensionsAssistant/ignored_recommendations', `["ms-vscode.vscode","${ignoredExtensionId.toLowerCase()}"]`, 0 /* GLOBAL */));
            });
        });
        test('ExtensionTipsService: Get file based recommendations from storage (old format)', () => {
            const storedRecommendations = '["ms-vscode.csharp", "ms-python.python", "ms-vscode.vscode-typescript-tslint-plugin"]';
            instantiationService.stub(storage_1.IStorageService, { get: (a, b, c) => a === 'extensionsAssistant/recommendations' ? storedRecommendations : c });
            return setUpFolderWorkspace('myFolder', []).then(() => {
                testObject = instantiationService.createInstance(extensionTipsService_1.ExtensionTipsService);
                return testObject.loadWorkspaceConfigPromise.then(() => {
                    const recommendations = testObject.getFileBasedRecommendations();
                    assert.equal(recommendations.length, 2);
                    assert.ok(recommendations.some(({ extensionId }) => extensionId === 'ms-vscode.csharp')); // stored recommendation that exists in product.extensionTips
                    assert.ok(recommendations.some(({ extensionId }) => extensionId === 'ms-python.python')); // stored recommendation that exists in product.extensionImportantTips
                    assert.ok(recommendations.every(({ extensionId }) => extensionId !== 'ms-vscode.vscode-typescript-tslint-plugin')); // stored recommendation that is no longer in neither product.extensionTips nor product.extensionImportantTips
                });
            });
        });
        test('ExtensionTipsService: Get file based recommendations from storage (new format)', () => {
            const milliSecondsInADay = 1000 * 60 * 60 * 24;
            const now = Date.now();
            const tenDaysOld = 10 * milliSecondsInADay;
            const storedRecommendations = `{"ms-vscode.csharp": ${now}, "ms-python.python": ${now}, "ms-vscode.vscode-typescript-tslint-plugin": ${now}, "lukehoban.Go": ${tenDaysOld}}`;
            instantiationService.stub(storage_1.IStorageService, { get: (a, b, c) => a === 'extensionsAssistant/recommendations' ? storedRecommendations : c });
            return setUpFolderWorkspace('myFolder', []).then(() => {
                testObject = instantiationService.createInstance(extensionTipsService_1.ExtensionTipsService);
                return testObject.loadWorkspaceConfigPromise.then(() => {
                    const recommendations = testObject.getFileBasedRecommendations();
                    assert.equal(recommendations.length, 2);
                    assert.ok(recommendations.some(({ extensionId }) => extensionId === 'ms-vscode.csharp')); // stored recommendation that exists in product.extensionTips
                    assert.ok(recommendations.some(({ extensionId }) => extensionId === 'ms-python.python')); // stored recommendation that exists in product.extensionImportantTips
                    assert.ok(recommendations.every(({ extensionId }) => extensionId !== 'ms-vscode.vscode-typescript-tslint-plugin')); // stored recommendation that is no longer in neither product.extensionTips nor product.extensionImportantTips
                    assert.ok(recommendations.every(({ extensionId }) => extensionId !== 'lukehoban.Go')); //stored recommendation that is older than a week
                });
            });
        });
    });
});
//# sourceMappingURL=extensionsTipsService.test.js.map