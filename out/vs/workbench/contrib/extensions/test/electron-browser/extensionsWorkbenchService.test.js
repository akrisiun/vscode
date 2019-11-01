/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "sinon", "assert", "fs", "vs/base/common/objects", "vs/base/common/uuid", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/extensions/browser/extensionsWorkbenchService", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensionManagement/node/extensionManagementService", "vs/workbench/contrib/extensions/browser/extensionTipsService", "vs/workbench/services/extensionManagement/test/electron-browser/extensionEnablementService.test", "vs/platform/extensionManagement/common/extensionGalleryService", "vs/platform/url/common/url", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/base/common/event", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/workspace/common/workspace", "vs/workbench/test/workbenchTestServices", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/progress/common/progress", "vs/workbench/services/progress/browser/progressService", "vs/platform/notification/common/notification", "vs/platform/url/node/urlService", "vs/base/common/uri", "vs/base/common/cancellation", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/remote/electron-browser/remoteAgentServiceImpl", "vs/platform/ipc/electron-browser/sharedProcessService"], function (require, exports, sinon, assert, fs, objects_1, uuid_1, extensions_1, extensionsWorkbenchService_1, extensionManagement_1, extensionManagement_2, extensionManagementUtil_1, extensionManagementService_1, extensionTipsService_1, extensionEnablementService_test_1, extensionGalleryService_1, url_1, instantiationServiceMock_1, event_1, telemetry_1, telemetryUtils_1, workspace_1, workbenchTestServices_1, configuration_1, log_1, progress_1, progressService_1, notification_1, urlService_1, uri_1, cancellation_1, remoteAgentService_1, remoteAgentServiceImpl_1, sharedProcessService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtensionsWorkbenchServiceTest', () => {
        let instantiationService;
        let testObject;
        let installEvent, didInstallEvent, uninstallEvent, didUninstallEvent;
        suiteSetup(() => {
            installEvent = new event_1.Emitter();
            didInstallEvent = new event_1.Emitter();
            uninstallEvent = new event_1.Emitter();
            didUninstallEvent = new event_1.Emitter();
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            instantiationService.stub(log_1.ILogService, log_1.NullLogService);
            instantiationService.stub(progress_1.IProgressService, progressService_1.ProgressService);
            instantiationService.stub(extensionManagement_1.IExtensionGalleryService, extensionGalleryService_1.ExtensionGalleryService);
            instantiationService.stub(url_1.IURLService, urlService_1.URLService);
            instantiationService.stub(sharedProcessService_1.ISharedProcessService, workbenchTestServices_1.TestSharedProcessService);
            instantiationService.stub(workspace_1.IWorkspaceContextService, new workbenchTestServices_1.TestContextService());
            instantiationService.stub(configuration_1.IConfigurationService, {
                onDidChangeConfiguration: () => { return undefined; },
                getValue: (key) => {
                    return (key === extensions_1.AutoCheckUpdatesConfigurationKey || key === extensions_1.AutoUpdateConfigurationKey) ? true : undefined;
                }
            });
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, remoteAgentServiceImpl_1.RemoteAgentService);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, extensionManagementService_1.ExtensionManagementService);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onInstallExtension', installEvent.event);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onDidInstallExtension', didInstallEvent.event);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onUninstallExtension', uninstallEvent.event);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onDidUninstallExtension', didUninstallEvent.event);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, {
                localExtensionManagementServer: {
                    extensionManagementService: instantiationService.get(extensionManagement_1.IExtensionManagementService)
                }
            });
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            instantiationService.set(extensionManagement_2.IExtensionTipsService, instantiationService.createInstance(extensionTipsService_1.ExtensionTipsService));
            instantiationService.stub(notification_1.INotificationService, { prompt: () => null });
        });
        setup(async () => {
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', []);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getExtensionsReport', []);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage());
            instantiationService.stubPromise(notification_1.INotificationService, 'prompt', 0);
            await instantiationService.get(extensionManagement_2.IExtensionEnablementService).reset();
        });
        teardown(() => {
            testObject.dispose();
        });
        test('test gallery extension', async () => {
            const expected = aGalleryExtension('expectedName', {
                displayName: 'expectedDisplayName',
                version: '1.5.0',
                publisherId: 'expectedPublisherId',
                publisher: 'expectedPublisher',
                publisherDisplayName: 'expectedPublisherDisplayName',
                description: 'expectedDescription',
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
            });
            testObject = await aWorkbenchService();
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(expected));
            return testObject.queryGallery(cancellation_1.CancellationToken.None).then(pagedResponse => {
                assert.equal(1, pagedResponse.firstPage.length);
                const actual = pagedResponse.firstPage[0];
                assert.equal(1 /* User */, actual.type);
                assert.equal('expectedName', actual.name);
                assert.equal('expectedDisplayName', actual.displayName);
                assert.equal('expectedpublisher.expectedname', actual.identifier.id);
                assert.equal('expectedPublisher', actual.publisher);
                assert.equal('expectedPublisherDisplayName', actual.publisherDisplayName);
                assert.equal('1.5.0', actual.version);
                assert.equal('1.5.0', actual.latestVersion);
                assert.equal('expectedDescription', actual.description);
                assert.equal('uri:icon', actual.iconUrl);
                assert.equal('fallback:icon', actual.iconUrlFallback);
                assert.equal('uri:license', actual.licenseUrl);
                assert.equal(3 /* Uninstalled */, actual.state);
                assert.equal(1000, actual.installCount);
                assert.equal(4, actual.rating);
                assert.equal(100, actual.ratingCount);
                assert.equal(false, actual.outdated);
                assert.deepEqual(['pub.1', 'pub.2'], actual.dependencies);
            });
        });
        test('test for empty installed extensions', async () => {
            testObject = await aWorkbenchService();
            assert.deepEqual([], testObject.local);
        });
        test('test for installed extensions', async () => {
            const expected1 = aLocalExtension('local1', {
                publisher: 'localPublisher1',
                version: '1.1.0',
                displayName: 'localDisplayName1',
                description: 'localDescription1',
                icon: 'localIcon1',
                extensionDependencies: ['pub.1', 'pub.2'],
            }, {
                type: 1 /* User */,
                readmeUrl: 'localReadmeUrl1',
                changelogUrl: 'localChangelogUrl1',
                location: uri_1.URI.file('localPath1')
            });
            const expected2 = aLocalExtension('local2', {
                publisher: 'localPublisher2',
                version: '1.2.0',
                displayName: 'localDisplayName2',
                description: 'localDescription2',
            }, {
                type: 0 /* System */,
                readmeUrl: 'localReadmeUrl2',
                changelogUrl: 'localChangelogUrl2',
            });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [expected1, expected2]);
            testObject = await aWorkbenchService();
            const actuals = testObject.local;
            assert.equal(2, actuals.length);
            let actual = actuals[0];
            assert.equal(1 /* User */, actual.type);
            assert.equal('local1', actual.name);
            assert.equal('localDisplayName1', actual.displayName);
            assert.equal('localpublisher1.local1', actual.identifier.id);
            assert.equal('localPublisher1', actual.publisher);
            assert.equal('1.1.0', actual.version);
            assert.equal('1.1.0', actual.latestVersion);
            assert.equal('localDescription1', actual.description);
            assert.equal('file:///localPath1/localIcon1', actual.iconUrl);
            assert.equal('file:///localPath1/localIcon1', actual.iconUrlFallback);
            assert.equal(null, actual.licenseUrl);
            assert.equal(1 /* Installed */, actual.state);
            assert.equal(null, actual.installCount);
            assert.equal(null, actual.rating);
            assert.equal(null, actual.ratingCount);
            assert.equal(false, actual.outdated);
            assert.deepEqual(['pub.1', 'pub.2'], actual.dependencies);
            actual = actuals[1];
            assert.equal(0 /* System */, actual.type);
            assert.equal('local2', actual.name);
            assert.equal('localDisplayName2', actual.displayName);
            assert.equal('localpublisher2.local2', actual.identifier.id);
            assert.equal('localPublisher2', actual.publisher);
            assert.equal('1.2.0', actual.version);
            assert.equal('1.2.0', actual.latestVersion);
            assert.equal('localDescription2', actual.description);
            assert.ok(fs.existsSync(uri_1.URI.parse(actual.iconUrl).fsPath));
            assert.equal(null, actual.licenseUrl);
            assert.equal(1 /* Installed */, actual.state);
            assert.equal(null, actual.installCount);
            assert.equal(null, actual.rating);
            assert.equal(null, actual.ratingCount);
            assert.equal(false, actual.outdated);
            assert.deepEqual([], actual.dependencies);
        });
        test('test installed extensions get syncs with gallery', async () => {
            const local1 = aLocalExtension('local1', {
                publisher: 'localPublisher1',
                version: '1.1.0',
                displayName: 'localDisplayName1',
                description: 'localDescription1',
                icon: 'localIcon1',
                extensionDependencies: ['pub.1', 'pub.2'],
            }, {
                type: 1 /* User */,
                readmeUrl: 'localReadmeUrl1',
                changelogUrl: 'localChangelogUrl1',
                location: uri_1.URI.file('localPath1')
            });
            const local2 = aLocalExtension('local2', {
                publisher: 'localPublisher2',
                version: '1.2.0',
                displayName: 'localDisplayName2',
                description: 'localDescription2',
            }, {
                type: 0 /* System */,
                readmeUrl: 'localReadmeUrl2',
                changelogUrl: 'localChangelogUrl2',
            });
            const gallery1 = aGalleryExtension(local1.manifest.name, {
                identifier: local1.identifier,
                displayName: 'expectedDisplayName',
                version: '1.5.0',
                publisherId: 'expectedPublisherId',
                publisher: local1.manifest.publisher,
                publisherDisplayName: 'expectedPublisherDisplayName',
                description: 'expectedDescription',
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
            });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local1, local2]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery1));
            testObject = await aWorkbenchService();
            await testObject.queryLocal();
            return eventToPromise(testObject.onChange).then(() => {
                const actuals = testObject.local;
                assert.equal(2, actuals.length);
                let actual = actuals[0];
                assert.equal(1 /* User */, actual.type);
                assert.equal('local1', actual.name);
                assert.equal('expectedDisplayName', actual.displayName);
                assert.equal('localpublisher1.local1', actual.identifier.id);
                assert.equal('localPublisher1', actual.publisher);
                assert.equal('1.1.0', actual.version);
                assert.equal('1.5.0', actual.latestVersion);
                assert.equal('expectedDescription', actual.description);
                assert.equal('uri:icon', actual.iconUrl);
                assert.equal('fallback:icon', actual.iconUrlFallback);
                assert.equal(1 /* Installed */, actual.state);
                assert.equal('uri:license', actual.licenseUrl);
                assert.equal(1000, actual.installCount);
                assert.equal(4, actual.rating);
                assert.equal(100, actual.ratingCount);
                assert.equal(true, actual.outdated);
                assert.deepEqual(['pub.1'], actual.dependencies);
                actual = actuals[1];
                assert.equal(0 /* System */, actual.type);
                assert.equal('local2', actual.name);
                assert.equal('localDisplayName2', actual.displayName);
                assert.equal('localpublisher2.local2', actual.identifier.id);
                assert.equal('localPublisher2', actual.publisher);
                assert.equal('1.2.0', actual.version);
                assert.equal('1.2.0', actual.latestVersion);
                assert.equal('localDescription2', actual.description);
                assert.ok(fs.existsSync(uri_1.URI.parse(actual.iconUrl).fsPath));
                assert.equal(null, actual.licenseUrl);
                assert.equal(1 /* Installed */, actual.state);
                assert.equal(null, actual.installCount);
                assert.equal(null, actual.rating);
                assert.equal(null, actual.ratingCount);
                assert.equal(false, actual.outdated);
                assert.deepEqual([], actual.dependencies);
            });
        });
        test('test extension state computation', async () => {
            const gallery = aGalleryExtension('gallery1');
            testObject = await aWorkbenchService();
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return testObject.queryGallery(cancellation_1.CancellationToken.None).then(page => {
                const extension = page.firstPage[0];
                assert.equal(3 /* Uninstalled */, extension.state);
                testObject.install(extension);
                const identifier = gallery.identifier;
                // Installing
                installEvent.fire({ identifier, gallery });
                let local = testObject.local;
                assert.equal(1, local.length);
                const actual = local[0];
                assert.equal(`${gallery.publisher}.${gallery.name}`, actual.identifier.id);
                assert.equal(0 /* Installing */, actual.state);
                // Installed
                didInstallEvent.fire({ identifier, gallery, operation: 1 /* Install */, local: aLocalExtension(gallery.name, gallery, { identifier }) });
                assert.equal(1 /* Installed */, actual.state);
                assert.equal(1, testObject.local.length);
                testObject.uninstall(actual);
                // Uninstalling
                uninstallEvent.fire(identifier);
                assert.equal(2 /* Uninstalling */, actual.state);
                // Uninstalled
                didUninstallEvent.fire({ identifier });
                assert.equal(3 /* Uninstalled */, actual.state);
                assert.equal(0, testObject.local.length);
            });
        });
        test('test extension doesnot show outdated for system extensions', async () => {
            const local = aLocalExtension('a', { version: '1.0.1' }, { type: 0 /* System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension(local.manifest.name, { identifier: local.identifier, version: '1.0.2' })));
            testObject = await aWorkbenchService();
            await testObject.queryLocal();
            assert.ok(!testObject.local[0].outdated);
        });
        test('test canInstall returns false for extensions with out gallery', async () => {
            const local = aLocalExtension('a', { version: '1.0.1' }, { type: 0 /* System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            testObject = await aWorkbenchService();
            const target = testObject.local[0];
            testObject.uninstall(target);
            uninstallEvent.fire(local.identifier);
            didUninstallEvent.fire({ identifier: local.identifier });
            assert.ok(!testObject.canInstall(target));
        });
        test('test canInstall returns false for a system extension', async () => {
            const local = aLocalExtension('a', { version: '1.0.1' }, { type: 0 /* System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension(local.manifest.name, { identifier: local.identifier })));
            testObject = await aWorkbenchService();
            const target = testObject.local[0];
            assert.ok(!testObject.canInstall(target));
        });
        test('test canInstall returns true for extensions with gallery', async () => {
            const local = aLocalExtension('a', { version: '1.0.1' }, { type: 1 /* User */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension(local.manifest.name, { identifier: local.identifier })));
            testObject = await aWorkbenchService();
            const target = testObject.local[0];
            return eventToPromise(testObject.onChange).then(() => {
                assert.ok(testObject.canInstall(target));
            });
        });
        test('test onchange event is triggered while installing', async () => {
            const gallery = aGalleryExtension('gallery1');
            testObject = await aWorkbenchService();
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const target = sinon.spy();
            return testObject.queryGallery(cancellation_1.CancellationToken.None).then(page => {
                const extension = page.firstPage[0];
                assert.equal(3 /* Uninstalled */, extension.state);
                testObject.install(extension);
                installEvent.fire({ identifier: gallery.identifier, gallery });
                testObject.onChange(target);
                // Installed
                didInstallEvent.fire({ identifier: gallery.identifier, gallery, operation: 1 /* Install */, local: aLocalExtension(gallery.name, gallery, gallery) });
                assert.ok(target.calledOnce);
            });
        });
        test('test onchange event is triggered when installation is finished', async () => {
            const gallery = aGalleryExtension('gallery1');
            testObject = await aWorkbenchService();
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const target = sinon.spy();
            return testObject.queryGallery(cancellation_1.CancellationToken.None).then(page => {
                const extension = page.firstPage[0];
                assert.equal(3 /* Uninstalled */, extension.state);
                testObject.install(extension);
                testObject.onChange(target);
                // Installing
                installEvent.fire({ identifier: gallery.identifier, gallery });
                assert.ok(target.calledOnce);
            });
        });
        test('test onchange event is triggered while uninstalling', async () => {
            const local = aLocalExtension('a', {}, { type: 0 /* System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            testObject = await aWorkbenchService();
            const target = sinon.spy();
            testObject.uninstall(testObject.local[0]);
            testObject.onChange(target);
            uninstallEvent.fire(local.identifier);
            assert.ok(target.calledOnce);
        });
        test('test onchange event is triggered when uninstalling is finished', async () => {
            const local = aLocalExtension('a', {}, { type: 0 /* System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            testObject = await aWorkbenchService();
            const target = sinon.spy();
            testObject.uninstall(testObject.local[0]);
            uninstallEvent.fire(local.identifier);
            testObject.onChange(target);
            didUninstallEvent.fire({ identifier: local.identifier });
            assert.ok(target.calledOnce);
        });
        test('test uninstalled extensions are always enabled', async () => {
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([aLocalExtension('b')], 2 /* DisabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([aLocalExtension('c')], 3 /* DisabledWorkspace */))
                .then(async () => {
                testObject = await aWorkbenchService();
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a')));
                return testObject.queryGallery(cancellation_1.CancellationToken.None).then(pagedResponse => {
                    const actual = pagedResponse.firstPage[0];
                    assert.equal(actual.enablementState, 4 /* EnabledGlobally */);
                });
            });
        });
        test('test enablement state installed enabled extension', async () => {
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([aLocalExtension('b')], 2 /* DisabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([aLocalExtension('c')], 3 /* DisabledWorkspace */))
                .then(async () => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [aLocalExtension('a')]);
                testObject = await aWorkbenchService();
                const actual = testObject.local[0];
                assert.equal(actual.enablementState, 4 /* EnabledGlobally */);
            });
        });
        test('test workspace disabled extension', async () => {
            const extensionA = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([aLocalExtension('b')], 2 /* DisabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([aLocalExtension('d')], 2 /* DisabledGlobally */))
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionA], 3 /* DisabledWorkspace */))
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([aLocalExtension('e')], 3 /* DisabledWorkspace */))
                .then(async () => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA]);
                testObject = await aWorkbenchService();
                const actual = testObject.local[0];
                assert.equal(actual.enablementState, 3 /* DisabledWorkspace */);
            });
        });
        test('test globally disabled extension', async () => {
            const localExtension = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([localExtension], 2 /* DisabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([aLocalExtension('d')], 2 /* DisabledGlobally */))
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([aLocalExtension('c')], 3 /* DisabledWorkspace */))
                .then(async () => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [localExtension]);
                testObject = await aWorkbenchService();
                const actual = testObject.local[0];
                assert.equal(actual.enablementState, 2 /* DisabledGlobally */);
            });
        });
        test('test enablement state is updated for user extensions', async () => {
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([aLocalExtension('c')], 2 /* DisabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([aLocalExtension('b')], 3 /* DisabledWorkspace */))
                .then(async () => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [aLocalExtension('a')]);
                testObject = await aWorkbenchService();
                return testObject.setEnablement(testObject.local[0], 3 /* DisabledWorkspace */)
                    .then(() => {
                    const actual = testObject.local[0];
                    assert.equal(actual.enablementState, 3 /* DisabledWorkspace */);
                });
            });
        });
        test('test enable extension globally when extension is disabled for workspace', async () => {
            const localExtension = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([localExtension], 3 /* DisabledWorkspace */)
                .then(async () => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [localExtension]);
                testObject = await aWorkbenchService();
                return testObject.setEnablement(testObject.local[0], 4 /* EnabledGlobally */)
                    .then(() => {
                    const actual = testObject.local[0];
                    assert.equal(actual.enablementState, 4 /* EnabledGlobally */);
                });
            });
        });
        test('test disable extension globally', async () => {
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [aLocalExtension('a')]);
            testObject = await aWorkbenchService();
            return testObject.setEnablement(testObject.local[0], 2 /* DisabledGlobally */)
                .then(() => {
                const actual = testObject.local[0];
                assert.equal(actual.enablementState, 2 /* DisabledGlobally */);
            });
        });
        test('test system extensions can be disabled', async () => {
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [aLocalExtension('a', {}, { type: 0 /* System */ })]);
            testObject = await aWorkbenchService();
            return testObject.setEnablement(testObject.local[0], 2 /* DisabledGlobally */)
                .then(() => {
                const actual = testObject.local[0];
                assert.equal(actual.enablementState, 2 /* DisabledGlobally */);
            });
        });
        test('test enablement state is updated on change from outside', async () => {
            const localExtension = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([aLocalExtension('c')], 2 /* DisabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([aLocalExtension('b')], 3 /* DisabledWorkspace */))
                .then(async () => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [localExtension]);
                testObject = await aWorkbenchService();
                return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([localExtension], 2 /* DisabledGlobally */)
                    .then(() => {
                    const actual = testObject.local[0];
                    assert.equal(actual.enablementState, 2 /* DisabledGlobally */);
                });
            });
        });
        test('test disable extension with dependencies disable only itself', async () => {
            const extensionA = aLocalExtension('a', { extensionDependencies: ['pub.b'] });
            const extensionB = aLocalExtension('b');
            const extensionC = aLocalExtension('c');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionA], 4 /* EnabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionB], 4 /* EnabledGlobally */))
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionC], 4 /* EnabledGlobally */))
                .then(async () => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                testObject = await aWorkbenchService();
                return testObject.setEnablement(testObject.local[0], 2 /* DisabledGlobally */)
                    .then(() => {
                    assert.equal(testObject.local[0].enablementState, 2 /* DisabledGlobally */);
                    assert.equal(testObject.local[1].enablementState, 4 /* EnabledGlobally */);
                });
            });
        });
        test('test disable extension pack disables the pack', async () => {
            const extensionA = aLocalExtension('a', { extensionPack: ['pub.b'] });
            const extensionB = aLocalExtension('b');
            const extensionC = aLocalExtension('c');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionA], 4 /* EnabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionB], 4 /* EnabledGlobally */))
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionC], 4 /* EnabledGlobally */))
                .then(async () => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                testObject = await aWorkbenchService();
                return testObject.setEnablement(testObject.local[0], 2 /* DisabledGlobally */)
                    .then(() => {
                    assert.equal(testObject.local[0].enablementState, 2 /* DisabledGlobally */);
                    assert.equal(testObject.local[1].enablementState, 2 /* DisabledGlobally */);
                });
            });
        });
        test('test disable extension pack disable all', async () => {
            const extensionA = aLocalExtension('a', { extensionPack: ['pub.b'] });
            const extensionB = aLocalExtension('b');
            const extensionC = aLocalExtension('c');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionA], 4 /* EnabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionB], 4 /* EnabledGlobally */))
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionC], 4 /* EnabledGlobally */))
                .then(async () => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                testObject = await aWorkbenchService();
                return testObject.setEnablement(testObject.local[0], 2 /* DisabledGlobally */)
                    .then(() => {
                    assert.equal(testObject.local[0].enablementState, 2 /* DisabledGlobally */);
                    assert.equal(testObject.local[1].enablementState, 2 /* DisabledGlobally */);
                });
            });
        });
        test('test disable extension fails if extension is a dependent of other', async () => {
            const extensionA = aLocalExtension('a', { extensionDependencies: ['pub.b'] });
            const extensionB = aLocalExtension('b');
            const extensionC = aLocalExtension('c');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionA], 4 /* EnabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionB], 4 /* EnabledGlobally */))
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionC], 4 /* EnabledGlobally */))
                .then(async () => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                testObject = await aWorkbenchService();
                return testObject.setEnablement(testObject.local[1], 2 /* DisabledGlobally */).then(() => assert.fail('Should fail'), error => assert.ok(true));
            });
        });
        test('test disable extension when extension is part of a pack', async () => {
            const extensionA = aLocalExtension('a', { extensionPack: ['pub.b'] });
            const extensionB = aLocalExtension('b');
            const extensionC = aLocalExtension('c');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionA], 4 /* EnabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionB], 4 /* EnabledGlobally */))
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionC], 4 /* EnabledGlobally */))
                .then(async () => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                testObject = await aWorkbenchService();
                return testObject.setEnablement(testObject.local[1], 2 /* DisabledGlobally */)
                    .then(() => {
                    assert.equal(testObject.local[1].enablementState, 2 /* DisabledGlobally */);
                });
            });
        });
        test('test disable both dependency and dependent do not promot and do not fail', async () => {
            const extensionA = aLocalExtension('a', { extensionDependencies: ['pub.b'] });
            const extensionB = aLocalExtension('b');
            const extensionC = aLocalExtension('c');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionA], 4 /* EnabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionB], 4 /* EnabledGlobally */))
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionC], 4 /* EnabledGlobally */))
                .then(async () => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                const target = sinon.spy();
                testObject = await aWorkbenchService();
                return testObject.setEnablement([testObject.local[1], testObject.local[0]], 2 /* DisabledGlobally */)
                    .then(() => {
                    assert.ok(!target.called);
                    assert.equal(testObject.local[0].enablementState, 2 /* DisabledGlobally */);
                    assert.equal(testObject.local[1].enablementState, 2 /* DisabledGlobally */);
                });
            });
        });
        test('test enable both dependency and dependent do not promot and do not fail', async () => {
            const extensionA = aLocalExtension('a', { extensionDependencies: ['pub.b'] });
            const extensionB = aLocalExtension('b');
            const extensionC = aLocalExtension('c');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionA], 2 /* DisabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionB], 2 /* DisabledGlobally */))
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionC], 2 /* DisabledGlobally */))
                .then(async () => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                const target = sinon.spy();
                testObject = await aWorkbenchService();
                return testObject.setEnablement([testObject.local[1], testObject.local[0]], 4 /* EnabledGlobally */)
                    .then(() => {
                    assert.ok(!target.called);
                    assert.equal(testObject.local[0].enablementState, 4 /* EnabledGlobally */);
                    assert.equal(testObject.local[1].enablementState, 4 /* EnabledGlobally */);
                });
            });
        });
        test('test disable extension does not fail if its dependency is a dependent of other but chosen to disable only itself', async () => {
            const extensionA = aLocalExtension('a', { extensionDependencies: ['pub.b'] });
            const extensionB = aLocalExtension('b');
            const extensionC = aLocalExtension('c', { extensionDependencies: ['pub.b'] });
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionA], 4 /* EnabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionB], 4 /* EnabledGlobally */))
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionC], 4 /* EnabledGlobally */))
                .then(async () => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                testObject = await aWorkbenchService();
                return testObject.setEnablement(testObject.local[0], 2 /* DisabledGlobally */)
                    .then(() => {
                    assert.equal(testObject.local[0].enablementState, 2 /* DisabledGlobally */);
                });
            });
        });
        test('test disable extension if its dependency is a dependent of other disabled extension', async () => {
            const extensionA = aLocalExtension('a', { extensionDependencies: ['pub.b'] });
            const extensionB = aLocalExtension('b');
            const extensionC = aLocalExtension('c', { extensionDependencies: ['pub.b'] });
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionA], 4 /* EnabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionB], 4 /* EnabledGlobally */))
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionC], 2 /* DisabledGlobally */))
                .then(async () => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                testObject = await aWorkbenchService();
                return testObject.setEnablement(testObject.local[0], 2 /* DisabledGlobally */)
                    .then(() => {
                    assert.equal(testObject.local[0].enablementState, 2 /* DisabledGlobally */);
                });
            });
        });
        test('test disable extension if its dependencys dependency is itself', async () => {
            const extensionA = aLocalExtension('a', { extensionDependencies: ['pub.b'] });
            const extensionB = aLocalExtension('b', { extensionDependencies: ['pub.a'] });
            const extensionC = aLocalExtension('c');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionA], 4 /* EnabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionB], 4 /* EnabledGlobally */))
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionC], 4 /* EnabledGlobally */))
                .then(async () => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                testObject = await aWorkbenchService();
                return testObject.setEnablement(testObject.local[0], 2 /* DisabledGlobally */)
                    .then(() => assert.fail('An extension with dependent should not be disabled'), () => null);
            });
        });
        test('test disable extension if its dependency is dependent and is disabled', async () => {
            const extensionA = aLocalExtension('a', { extensionDependencies: ['pub.b'] });
            const extensionB = aLocalExtension('b');
            const extensionC = aLocalExtension('c', { extensionDependencies: ['pub.b'] });
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionA], 4 /* EnabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionB], 2 /* DisabledGlobally */))
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionC], 4 /* EnabledGlobally */))
                .then(async () => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                testObject = await aWorkbenchService();
                return testObject.setEnablement(testObject.local[0], 2 /* DisabledGlobally */)
                    .then(() => assert.equal(testObject.local[0].enablementState, 2 /* DisabledGlobally */));
            });
        });
        test('test disable extension with cyclic dependencies', async () => {
            const extensionA = aLocalExtension('a', { extensionDependencies: ['pub.b'] });
            const extensionB = aLocalExtension('b', { extensionDependencies: ['pub.c'] });
            const extensionC = aLocalExtension('c', { extensionDependencies: ['pub.a'] });
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionA], 4 /* EnabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionB], 4 /* EnabledGlobally */))
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionC], 4 /* EnabledGlobally */))
                .then(async () => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                testObject = await aWorkbenchService();
                return testObject.setEnablement(testObject.local[0], 2 /* DisabledGlobally */)
                    .then(() => assert.fail('An extension with dependent should not be disabled'), () => null);
            });
        });
        test('test enable extension with dependencies enable all', async () => {
            const extensionA = aLocalExtension('a', { extensionDependencies: ['pub.b'] });
            const extensionB = aLocalExtension('b');
            const extensionC = aLocalExtension('c');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionA], 2 /* DisabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionB], 2 /* DisabledGlobally */))
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionC], 2 /* DisabledGlobally */))
                .then(async () => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                testObject = await aWorkbenchService();
                return testObject.setEnablement(testObject.local[0], 4 /* EnabledGlobally */)
                    .then(() => {
                    assert.equal(testObject.local[0].enablementState, 4 /* EnabledGlobally */);
                    assert.equal(testObject.local[1].enablementState, 4 /* EnabledGlobally */);
                });
            });
        });
        test('test enable extension with dependencies does not prompt if dependency is enabled already', async () => {
            const extensionA = aLocalExtension('a', { extensionDependencies: ['pub.b'] });
            const extensionB = aLocalExtension('b');
            const extensionC = aLocalExtension('c');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionA], 2 /* DisabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionB], 4 /* EnabledGlobally */))
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionC], 2 /* DisabledGlobally */))
                .then(async () => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                const target = sinon.spy();
                testObject = await aWorkbenchService();
                return testObject.setEnablement(testObject.local[0], 4 /* EnabledGlobally */)
                    .then(() => {
                    assert.ok(!target.called);
                    assert.equal(testObject.local[0].enablementState, 4 /* EnabledGlobally */);
                });
            });
        });
        test('test enable extension with dependency does not prompt if both are enabled', async () => {
            const extensionA = aLocalExtension('a', { extensionDependencies: ['pub.b'] });
            const extensionB = aLocalExtension('b');
            const extensionC = aLocalExtension('c');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionA], 2 /* DisabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionB], 2 /* DisabledGlobally */))
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionC], 2 /* DisabledGlobally */))
                .then(async () => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                const target = sinon.spy();
                testObject = await aWorkbenchService();
                return testObject.setEnablement([testObject.local[1], testObject.local[0]], 4 /* EnabledGlobally */)
                    .then(() => {
                    assert.ok(!target.called);
                    assert.equal(testObject.local[0].enablementState, 4 /* EnabledGlobally */);
                    assert.equal(testObject.local[1].enablementState, 4 /* EnabledGlobally */);
                });
            });
        });
        test('test enable extension with cyclic dependencies', async () => {
            const extensionA = aLocalExtension('a', { extensionDependencies: ['pub.b'] });
            const extensionB = aLocalExtension('b', { extensionDependencies: ['pub.c'] });
            const extensionC = aLocalExtension('c', { extensionDependencies: ['pub.a'] });
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionA], 2 /* DisabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionB], 2 /* DisabledGlobally */))
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([extensionC], 2 /* DisabledGlobally */))
                .then(async () => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                testObject = await aWorkbenchService();
                return testObject.setEnablement(testObject.local[0], 4 /* EnabledGlobally */)
                    .then(() => {
                    assert.equal(testObject.local[0].enablementState, 4 /* EnabledGlobally */);
                    assert.equal(testObject.local[1].enablementState, 4 /* EnabledGlobally */);
                    assert.equal(testObject.local[2].enablementState, 4 /* EnabledGlobally */);
                });
            });
        });
        test('test change event is fired when disablement flags are changed', async () => {
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([aLocalExtension('c')], 2 /* DisabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([aLocalExtension('b')], 3 /* DisabledWorkspace */))
                .then(async () => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [aLocalExtension('a')]);
                testObject = await aWorkbenchService();
                const target = sinon.spy();
                testObject.onChange(target);
                return testObject.setEnablement(testObject.local[0], 2 /* DisabledGlobally */)
                    .then(() => assert.ok(target.calledOnce));
            });
        });
        test('test change event is fired when disablement flags are changed from outside', async () => {
            const localExtension = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([aLocalExtension('c')], 2 /* DisabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([aLocalExtension('b')], 3 /* DisabledWorkspace */))
                .then(async () => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [localExtension]);
                testObject = await aWorkbenchService();
                const target = sinon.spy();
                testObject.onChange(target);
                return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([localExtension], 2 /* DisabledGlobally */)
                    .then(() => assert.ok(target.calledOnce));
            });
        });
        test('test installing an extension re-eanbles it when disabled globally', async () => {
            testObject = await aWorkbenchService();
            const local = aLocalExtension('pub.a');
            await instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([local], 2 /* DisabledGlobally */);
            didInstallEvent.fire({ local, identifier: local.identifier, operation: 1 /* Install */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const actual = await testObject.queryLocal();
            assert.equal(actual[0].enablementState, 4 /* EnabledGlobally */);
        });
        test('test updating an extension does not re-eanbles it when disabled globally', async () => {
            testObject = await aWorkbenchService();
            const local = aLocalExtension('pub.a');
            await instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([local], 2 /* DisabledGlobally */);
            didInstallEvent.fire({ local, identifier: local.identifier, operation: 2 /* Update */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const actual = await testObject.queryLocal();
            assert.equal(actual[0].enablementState, 2 /* DisabledGlobally */);
        });
        test('test installing an extension re-eanbles it when workspace disabled', async () => {
            testObject = await aWorkbenchService();
            const local = aLocalExtension('pub.a');
            await instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([local], 3 /* DisabledWorkspace */);
            didInstallEvent.fire({ local, identifier: local.identifier, operation: 1 /* Install */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const actual = await testObject.queryLocal();
            assert.equal(actual[0].enablementState, 4 /* EnabledGlobally */);
        });
        test('test updating an extension does not re-eanbles it when workspace disabled', async () => {
            testObject = await aWorkbenchService();
            const local = aLocalExtension('pub.a');
            await instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([local], 3 /* DisabledWorkspace */);
            didInstallEvent.fire({ local, identifier: local.identifier, operation: 2 /* Update */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const actual = await testObject.queryLocal();
            assert.equal(actual[0].enablementState, 3 /* DisabledWorkspace */);
        });
        async function aWorkbenchService() {
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            await workbenchService.queryLocal();
            return workbenchService;
        }
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
            galleryExtension.identifier = { id: extensionManagementUtil_1.getGalleryExtensionId(galleryExtension.publisher, galleryExtension.name), uuid: uuid_1.generateUuid() };
            return galleryExtension;
        }
        function aPage(...objects) {
            return { firstPage: objects, total: objects.length, pageSize: objects.length, getPage: () => null };
        }
        function eventToPromise(event, count = 1) {
            return new Promise(c => {
                let counter = 0;
                event(() => {
                    if (++counter === count) {
                        c(undefined);
                    }
                });
            });
        }
    });
});
//# sourceMappingURL=extensionsWorkbenchService.test.js.map