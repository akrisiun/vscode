/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/objects", "vs/base/common/uuid", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/workbench/contrib/extensions/browser/extensionsWorkbenchService", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensionManagement/node/extensionManagementService", "vs/workbench/contrib/extensions/browser/extensionTipsService", "vs/workbench/services/extensionManagement/test/electron-browser/extensionEnablementService.test", "vs/platform/extensionManagement/common/extensionGalleryService", "vs/platform/url/common/url", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/base/common/event", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/services/extensions/common/extensions", "vs/platform/workspace/common/workspace", "vs/workbench/test/workbenchTestServices", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/url/node/urlService", "vs/base/common/uri", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/remote/electron-browser/remoteAgentServiceImpl", "vs/platform/extensions/common/extensions", "vs/platform/ipc/electron-browser/sharedProcessService", "vs/base/common/cancellation", "vs/platform/label/common/label", "vs/workbench/services/extensionManagement/electron-browser/extensionManagementServerService", "vs/platform/product/common/productService", "vs/base/common/network", "vs/platform/remote/common/remoteHosts", "vs/workbench/services/environment/common/environmentService", "vs/platform/progress/common/progress", "vs/workbench/services/progress/browser/progressService"], function (require, exports, assert, objects_1, uuid_1, extensions_1, ExtensionsActions, extensionsWorkbenchService_1, extensionManagement_1, extensionManagement_2, extensionManagementUtil_1, extensionManagementService_1, extensionTipsService_1, extensionEnablementService_test_1, extensionGalleryService_1, url_1, instantiationServiceMock_1, event_1, telemetry_1, telemetryUtils_1, extensions_2, workspace_1, workbenchTestServices_1, configuration_1, log_1, urlService_1, uri_1, testConfigurationService_1, remoteAgentService_1, remoteAgentServiceImpl_1, extensions_3, sharedProcessService_1, cancellation_1, label_1, extensionManagementServerService_1, productService_1, network_1, remoteHosts_1, environmentService_1, progress_1, progressService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtensionsActions Test', () => {
        let instantiationService;
        let installEvent, didInstallEvent, uninstallEvent, didUninstallEvent;
        setup(async () => {
            installEvent = new event_1.Emitter();
            didInstallEvent = new event_1.Emitter();
            uninstallEvent = new event_1.Emitter();
            didUninstallEvent = new event_1.Emitter();
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            instantiationService.stub(log_1.ILogService, log_1.NullLogService);
            instantiationService.stub(workspace_1.IWorkspaceContextService, new workbenchTestServices_1.TestContextService());
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
            instantiationService.stub(progress_1.IProgressService, progressService_1.ProgressService);
            instantiationService.stub(extensionManagement_1.IExtensionGalleryService, extensionGalleryService_1.ExtensionGalleryService);
            instantiationService.stub(sharedProcessService_1.ISharedProcessService, workbenchTestServices_1.TestSharedProcessService);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, extensionManagementService_1.ExtensionManagementService);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onInstallExtension', installEvent.event);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onDidInstallExtension', didInstallEvent.event);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onUninstallExtension', uninstallEvent.event);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onDidUninstallExtension', didUninstallEvent.event);
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, remoteAgentServiceImpl_1.RemoteAgentService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, new class extends extensionManagementServerService_1.ExtensionManagementServerService {
                constructor() {
                    super(instantiationService.get(sharedProcessService_1.ISharedProcessService), instantiationService.get(remoteAgentService_1.IRemoteAgentService), instantiationService.get(extensionManagement_1.IExtensionGalleryService), instantiationService.get(configuration_1.IConfigurationService), instantiationService.get(productService_1.IProductService), instantiationService.get(log_1.ILogService), instantiationService.get(label_1.ILabelService));
                    this._localExtensionManagementServer = { extensionManagementService: instantiationService.get(extensionManagement_1.IExtensionManagementService), label: 'local', authority: 'vscode-local' };
                }
                get localExtensionManagementServer() { return this._localExtensionManagementServer; }
                set localExtensionManagementServer(server) { }
            }());
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            instantiationService.stub(label_1.ILabelService, { onDidChangeFormatters: new event_1.Emitter().event });
            instantiationService.set(extensionManagement_2.IExtensionTipsService, instantiationService.createInstance(extensionTipsService_1.ExtensionTipsService));
            instantiationService.stub(url_1.IURLService, urlService_1.URLService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', []);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getExtensionsReport', []);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage());
            instantiationService.stub(extensions_2.IExtensionService, { getExtensions: () => Promise.resolve([]), onDidChangeExtensions: new event_1.Emitter().event, canAddExtension: (extension) => false, canRemoveExtension: (extension) => false });
            await instantiationService.get(extensionManagement_2.IExtensionEnablementService).reset();
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
        });
        teardown(() => {
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).dispose();
        });
        test('Install action is disabled when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.InstallAction);
            assert.ok(!testObject.enabled);
        });
        test('Test Install action when state is installed', () => {
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            const testObject = instantiationService.createInstance(ExtensionsActions.InstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return workbenchService.queryLocal()
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: local.identifier })));
                return workbenchService.queryGallery(cancellation_1.CancellationToken.None)
                    .then((paged) => {
                    testObject.extension = paged.firstPage[0];
                    assert.ok(!testObject.enabled);
                    assert.equal('Install', testObject.label);
                    assert.equal('extension-action prominent install', testObject.class);
                });
            });
        });
        test('Test Install action when state is installing', () => {
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            const testObject = instantiationService.createInstance(ExtensionsActions.InstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return workbenchService.queryGallery(cancellation_1.CancellationToken.None)
                .then((paged) => {
                testObject.extension = paged.firstPage[0];
                installEvent.fire({ identifier: gallery.identifier, gallery });
                assert.ok(!testObject.enabled);
                assert.equal('Installing', testObject.label);
                assert.equal('extension-action install installing', testObject.class);
            });
        });
        test('Test Install action when state is uninstalled', () => {
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            const testObject = instantiationService.createInstance(ExtensionsActions.InstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return workbenchService.queryGallery(cancellation_1.CancellationToken.None)
                .then((paged) => {
                testObject.extension = paged.firstPage[0];
                assert.ok(testObject.enabled);
                assert.equal('Install', testObject.label);
            });
        });
        test('Test Install action when extension is system action', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.InstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a', {}, { type: 0 /* System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                uninstallEvent.fire(local.identifier);
                didUninstallEvent.fire({ identifier: local.identifier });
                testObject.extension = extensions[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test Install action when extension doesnot has gallery', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.InstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                uninstallEvent.fire(local.identifier);
                didUninstallEvent.fire({ identifier: local.identifier });
                testObject.extension = extensions[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Uninstall action is disabled when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UninstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            assert.ok(!testObject.enabled);
        });
        test('Test Uninstall action when state is uninstalling', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UninstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                uninstallEvent.fire(local.identifier);
                assert.ok(!testObject.enabled);
                assert.equal('Uninstalling', testObject.label);
                assert.equal('extension-action uninstall uninstalling', testObject.class);
            });
        });
        test('Test Uninstall action when state is installed and is user extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UninstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                assert.ok(testObject.enabled);
                assert.equal('Uninstall', testObject.label);
                assert.equal('extension-action uninstall', testObject.class);
            });
        });
        test('Test Uninstall action when state is installed and is system extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UninstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a', {}, { type: 0 /* System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                assert.ok(!testObject.enabled);
                assert.equal('Uninstall', testObject.label);
                assert.equal('extension-action uninstall', testObject.class);
            });
        });
        test('Test Uninstall action when state is installing and is user extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UninstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const gallery = aGalleryExtension('a');
                const extension = extensions[0];
                extension.gallery = gallery;
                installEvent.fire({ identifier: gallery.identifier, gallery });
                testObject.extension = extension;
                assert.ok(!testObject.enabled);
            });
        });
        test('Test Uninstall action after extension is installed', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UninstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                .then(paged => {
                testObject.extension = paged.firstPage[0];
                installEvent.fire({ identifier: gallery.identifier, gallery });
                didInstallEvent.fire({ identifier: gallery.identifier, gallery, operation: 1 /* Install */, local: aLocalExtension('a', gallery, gallery) });
                assert.ok(testObject.enabled);
                assert.equal('Uninstall', testObject.label);
                assert.equal('extension-action uninstall', testObject.class);
            });
        });
        test('Test CombinedInstallAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.CombinedInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            assert.ok(!testObject.enabled);
            assert.equal('extension-action prominent install no-extension', testObject.class);
        });
        test('Test CombinedInstallAction when extension is system extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.CombinedInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a', {}, { type: 0 /* System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                assert.ok(!testObject.enabled);
                assert.equal('extension-action prominent install no-extension', testObject.class);
            });
        });
        test('Test CombinedInstallAction when installAction is enabled', () => {
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            const testObject = instantiationService.createInstance(ExtensionsActions.CombinedInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return workbenchService.queryGallery(cancellation_1.CancellationToken.None)
                .then((paged) => {
                testObject.extension = paged.firstPage[0];
                assert.ok(testObject.enabled);
                assert.equal('Install', testObject.label);
                assert.equal('extension-action prominent install', testObject.class);
            });
        });
        test('Test CombinedInstallAction when unInstallAction is enabled', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.CombinedInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                assert.ok(testObject.enabled);
                assert.equal('Uninstall', testObject.label);
                assert.equal('extension-action uninstall', testObject.class);
            });
        });
        test('Test CombinedInstallAction when state is installing', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.CombinedInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return workbenchService.queryGallery(cancellation_1.CancellationToken.None)
                .then((paged) => {
                testObject.extension = paged.firstPage[0];
                installEvent.fire({ identifier: gallery.identifier, gallery });
                assert.ok(!testObject.enabled);
                assert.equal('Installing', testObject.label);
                assert.equal('extension-action install installing', testObject.class);
            });
        });
        test('Test CombinedInstallAction when state is installing during update', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.CombinedInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const gallery = aGalleryExtension('a');
                const extension = extensions[0];
                extension.gallery = gallery;
                testObject.extension = extension;
                installEvent.fire({ identifier: gallery.identifier, gallery });
                assert.ok(!testObject.enabled);
                assert.equal('Installing', testObject.label);
                assert.equal('extension-action install installing', testObject.class);
            });
        });
        test('Test CombinedInstallAction when state is uninstalling', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.CombinedInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                uninstallEvent.fire(local.identifier);
                assert.ok(!testObject.enabled);
                assert.equal('Uninstalling', testObject.label);
                assert.equal('extension-action uninstall uninstalling', testObject.class);
            });
        });
        test('Test UpdateAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            assert.ok(!testObject.enabled);
        });
        test('Test UpdateAction when extension is uninstalled', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const gallery = aGalleryExtension('a', { version: '1.0.0' });
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                .then((paged) => {
                testObject.extension = paged.firstPage[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test UpdateAction when extension is installed and not outdated', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a', { version: '1.0.0' });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: local.identifier, version: local.manifest.version })));
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                    .then(extensions => assert.ok(!testObject.enabled));
            });
        });
        test('Test UpdateAction when extension is installed outdated and system extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a', { version: '1.0.0' }, { type: 0 /* System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: local.identifier, version: '1.0.1' })));
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                    .then(extensions => assert.ok(!testObject.enabled));
            });
        });
        test('Test UpdateAction when extension is installed outdated and user extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a', { version: '1.0.0' });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            return workbenchService.queryLocal()
                .then(async (extensions) => {
                testObject.extension = extensions[0];
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: local.identifier, version: '1.0.1' })));
                assert.ok(!testObject.enabled);
                return new Promise(c => {
                    testObject.onDidChange(() => {
                        if (testObject.enabled) {
                            c();
                        }
                    });
                    instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None);
                });
            });
        });
        test('Test UpdateAction when extension is installing and outdated and user extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a', { version: '1.0.0' });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                const gallery = aGalleryExtension('a', { identifier: local.identifier, version: '1.0.1' });
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                    .then(extensions => {
                    installEvent.fire({ identifier: local.identifier, gallery });
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test ManageExtensionAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ManageExtensionAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            assert.ok(!testObject.enabled);
        });
        test('Test ManageExtensionAction when extension is installed', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ManageExtensionAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                assert.ok(testObject.enabled);
                assert.equal('extension-action manage', testObject.class);
                assert.equal('', testObject.tooltip);
            });
        });
        test('Test ManageExtensionAction when extension is uninstalled', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ManageExtensionAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                .then(page => {
                testObject.extension = page.firstPage[0];
                assert.ok(!testObject.enabled);
                assert.equal('extension-action manage hide', testObject.class);
                assert.equal('', testObject.tooltip);
            });
        });
        test('Test ManageExtensionAction when extension is installing', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ManageExtensionAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                .then(page => {
                testObject.extension = page.firstPage[0];
                installEvent.fire({ identifier: gallery.identifier, gallery });
                assert.ok(!testObject.enabled);
                assert.equal('extension-action manage hide', testObject.class);
                assert.equal('', testObject.tooltip);
            });
        });
        test('Test ManageExtensionAction when extension is queried from gallery and installed', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ManageExtensionAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                .then(page => {
                testObject.extension = page.firstPage[0];
                installEvent.fire({ identifier: gallery.identifier, gallery });
                didInstallEvent.fire({ identifier: gallery.identifier, gallery, operation: 1 /* Install */, local: aLocalExtension('a', gallery, gallery) });
                assert.ok(testObject.enabled);
                assert.equal('extension-action manage', testObject.class);
                assert.equal('', testObject.tooltip);
            });
        });
        test('Test ManageExtensionAction when extension is system extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ManageExtensionAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a', {}, { type: 0 /* System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                assert.ok(testObject.enabled);
                assert.equal('extension-action manage', testObject.class);
                assert.equal('', testObject.tooltip);
            });
        });
        test('Test ManageExtensionAction when extension is uninstalling', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ManageExtensionAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                uninstallEvent.fire(local.identifier);
                assert.ok(!testObject.enabled);
                assert.equal('extension-action manage', testObject.class);
                assert.equal('Uninstalling', testObject.tooltip);
            });
        });
        test('Test EnableForWorkspaceAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.EnableForWorkspaceAction);
            assert.ok(!testObject.enabled);
        });
        test('Test EnableForWorkspaceAction when there extension is not disabled', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = instantiationService.createInstance(ExtensionsActions.EnableForWorkspaceAction);
                testObject.extension = extensions[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test EnableForWorkspaceAction when the extension is disabled globally', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([local], 2 /* DisabledGlobally */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.EnableForWorkspaceAction);
                    testObject.extension = extensions[0];
                    assert.ok(testObject.enabled);
                });
            });
        });
        test('Test EnableForWorkspaceAction when extension is disabled for workspace', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([local], 3 /* DisabledWorkspace */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.EnableForWorkspaceAction);
                    testObject.extension = extensions[0];
                    assert.ok(testObject.enabled);
                });
            });
        });
        test('Test EnableForWorkspaceAction when the extension is disabled globally and workspace', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([local], 2 /* DisabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([local], 3 /* DisabledWorkspace */))
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.EnableForWorkspaceAction);
                    testObject.extension = extensions[0];
                    assert.ok(testObject.enabled);
                });
            });
        });
        test('Test EnableGloballyAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.EnableGloballyAction);
            assert.ok(!testObject.enabled);
        });
        test('Test EnableGloballyAction when the extension is not disabled', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = instantiationService.createInstance(ExtensionsActions.EnableGloballyAction);
                testObject.extension = extensions[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test EnableGloballyAction when the extension is disabled for workspace', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([local], 3 /* DisabledWorkspace */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.EnableGloballyAction);
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test EnableGloballyAction when the extension is disabled globally', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([local], 2 /* DisabledGlobally */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.EnableGloballyAction);
                    testObject.extension = extensions[0];
                    assert.ok(testObject.enabled);
                });
            });
        });
        test('Test EnableGloballyAction when the extension is disabled in both', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([local], 2 /* DisabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([local], 3 /* DisabledWorkspace */))
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.EnableGloballyAction);
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test EnableAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.EnableDropDownAction);
            assert.ok(!testObject.enabled);
        });
        test('Test EnableDropDownAction when extension is installed and enabled', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = instantiationService.createInstance(ExtensionsActions.EnableDropDownAction);
                testObject.extension = extensions[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test EnableDropDownAction when extension is installed and disabled globally', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([local], 2 /* DisabledGlobally */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.EnableDropDownAction);
                    testObject.extension = extensions[0];
                    assert.ok(testObject.enabled);
                });
            });
        });
        test('Test EnableDropDownAction when extension is installed and disabled for workspace', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([local], 3 /* DisabledWorkspace */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.EnableDropDownAction);
                    testObject.extension = extensions[0];
                    assert.ok(testObject.enabled);
                });
            });
        });
        test('Test EnableDropDownAction when extension is uninstalled', () => {
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                .then(page => {
                const testObject = instantiationService.createInstance(ExtensionsActions.EnableDropDownAction);
                testObject.extension = page.firstPage[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test EnableDropDownAction when extension is installing', () => {
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                .then(page => {
                const testObject = instantiationService.createInstance(ExtensionsActions.EnableDropDownAction);
                testObject.extension = page.firstPage[0];
                instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
                installEvent.fire({ identifier: gallery.identifier, gallery });
                assert.ok(!testObject.enabled);
            });
        });
        test('Test EnableDropDownAction when extension is uninstalling', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = instantiationService.createInstance(ExtensionsActions.EnableDropDownAction);
                testObject.extension = extensions[0];
                uninstallEvent.fire(local.identifier);
                assert.ok(!testObject.enabled);
            });
        });
        test('Test DisableForWorkspaceAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.DisableForWorkspaceAction, []);
            assert.ok(!testObject.enabled);
        });
        test('Test DisableForWorkspaceAction when the extension is disabled globally', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([local], 2 /* DisabledGlobally */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.DisableForWorkspaceAction, []);
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test DisableForWorkspaceAction when the extension is disabled workspace', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([local], 2 /* DisabledGlobally */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.DisableForWorkspaceAction, []);
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test DisableForWorkspaceAction when extension is enabled', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = instantiationService.createInstance(ExtensionsActions.DisableForWorkspaceAction, [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a') }]);
                testObject.extension = extensions[0];
                assert.ok(testObject.enabled);
            });
        });
        test('Test DisableGloballyAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.DisableGloballyAction, []);
            assert.ok(!testObject.enabled);
        });
        test('Test DisableGloballyAction when the extension is disabled globally', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([local], 2 /* DisabledGlobally */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.DisableGloballyAction, []);
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test DisableGloballyAction when the extension is disabled for workspace', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([local], 3 /* DisabledWorkspace */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.DisableGloballyAction, []);
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test DisableGloballyAction when the extension is enabled', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = instantiationService.createInstance(ExtensionsActions.DisableGloballyAction, [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a') }]);
                testObject.extension = extensions[0];
                assert.ok(testObject.enabled);
            });
        });
        test('Test DisableDropDownAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.DisableDropDownAction, []);
            assert.ok(!testObject.enabled);
        });
        test('Test DisableDropDownAction when extension is installed and enabled', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = instantiationService.createInstance(ExtensionsActions.DisableDropDownAction, [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a') }]);
                testObject.extension = extensions[0];
                assert.ok(testObject.enabled);
            });
        });
        test('Test DisableDropDownAction when extension is installed and disabled globally', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([local], 2 /* DisabledGlobally */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.DisableDropDownAction, [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a') }]);
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test DisableDropDownAction when extension is installed and disabled for workspace', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([local], 3 /* DisabledWorkspace */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.DisableDropDownAction, [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a') }]);
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test DisableDropDownAction when extension is uninstalled', () => {
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                .then(page => {
                const testObject = instantiationService.createInstance(ExtensionsActions.DisableDropDownAction, [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a') }]);
                testObject.extension = page.firstPage[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test DisableDropDownAction when extension is installing', () => {
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                .then(page => {
                const testObject = instantiationService.createInstance(ExtensionsActions.DisableDropDownAction, [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a') }]);
                testObject.extension = page.firstPage[0];
                instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
                installEvent.fire({ identifier: gallery.identifier, gallery });
                assert.ok(!testObject.enabled);
            });
        });
        test('Test DisableDropDownAction when extension is uninstalling', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = instantiationService.createInstance(ExtensionsActions.DisableDropDownAction, [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a') }]);
                testObject.extension = extensions[0];
                instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
                uninstallEvent.fire(local.identifier);
                assert.ok(!testObject.enabled);
            });
        });
        test('Test UpdateAllAction when no installed extensions', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAllAction, 'id', 'label');
            assert.ok(!testObject.enabled);
        });
        test('Test UpdateAllAction when installed extensions are not outdated', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAllAction, 'id', 'label');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [aLocalExtension('a'), aLocalExtension('b')]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => assert.ok(!testObject.enabled));
        });
        test('Test UpdateAllAction when some installed extensions are outdated', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAllAction, 'id', 'label');
            const local = [aLocalExtension('a', { version: '1.0.1' }), aLocalExtension('b', { version: '1.0.1' }), aLocalExtension('c', { version: '1.0.1' })];
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', local);
            return workbenchService.queryLocal()
                .then(async () => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: local[0].identifier, version: '1.0.2' }), aGalleryExtension('b', { identifier: local[1].identifier, version: '1.0.2' }), aGalleryExtension('c', local[2].manifest)));
                assert.ok(!testObject.enabled);
                return new Promise(c => {
                    testObject.onDidChange(() => {
                        if (testObject.enabled) {
                            c();
                        }
                    });
                    workbenchService.queryGallery(cancellation_1.CancellationToken.None);
                });
            });
        });
        test('Test UpdateAllAction when some installed extensions are outdated and some outdated are being installed', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAllAction, 'id', 'label');
            const local = [aLocalExtension('a', { version: '1.0.1' }), aLocalExtension('b', { version: '1.0.1' }), aLocalExtension('c', { version: '1.0.1' })];
            const gallery = [aGalleryExtension('a', { identifier: local[0].identifier, version: '1.0.2' }), aGalleryExtension('b', { identifier: local[1].identifier, version: '1.0.2' }), aGalleryExtension('c', local[2].manifest)];
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', local);
            return workbenchService.queryLocal()
                .then(async () => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(...gallery));
                assert.ok(!testObject.enabled);
                return new Promise(c => {
                    installEvent.fire({ identifier: local[0].identifier, gallery: gallery[0] });
                    testObject.onDidChange(() => {
                        if (testObject.enabled) {
                            c();
                        }
                    });
                    workbenchService.queryGallery(cancellation_1.CancellationToken.None);
                });
            });
        });
        test('Test UpdateAllAction when some installed extensions are outdated and all outdated are being installed', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAllAction, 'id', 'label');
            const local = [aLocalExtension('a', { version: '1.0.1' }), aLocalExtension('b', { version: '1.0.1' }), aLocalExtension('c', { version: '1.0.1' })];
            const gallery = [aGalleryExtension('a', { identifier: local[0].identifier, version: '1.0.2' }), aGalleryExtension('b', { identifier: local[1].identifier, version: '1.0.2' }), aGalleryExtension('c', local[2].manifest)];
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', local);
            return workbenchService.queryLocal()
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(...gallery));
                return workbenchService.queryGallery(cancellation_1.CancellationToken.None)
                    .then(() => {
                    installEvent.fire({ identifier: local[0].identifier, gallery: gallery[0] });
                    installEvent.fire({ identifier: local[1].identifier, gallery: gallery[1] });
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test ReloadAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when extension state is installing', async () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const paged = await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = paged.firstPage[0];
            installEvent.fire({ identifier: gallery.identifier, gallery });
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when extension state is uninstalling', async () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal();
            testObject.extension = extensions[0];
            uninstallEvent.fire(local.identifier);
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when extension is newly installed', async () => {
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            const runningExtensions = [{ identifier: new extensions_3.ExtensionIdentifier('pub.b'), extensionLocation: uri_1.URI.file('pub.b') }];
            instantiationService.stub(extensions_2.IExtensionService, {
                getExtensions: () => Promise.resolve(runningExtensions),
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false
            });
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const paged = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = paged.firstPage[0];
            assert.ok(!testObject.enabled);
            installEvent.fire({ identifier: gallery.identifier, gallery });
            didInstallEvent.fire({ identifier: gallery.identifier, gallery, operation: 1 /* Install */, local: aLocalExtension('a', gallery, gallery) });
            assert.ok(testObject.enabled);
            assert.equal(testObject.tooltip, 'Please reload Visual Studio Code to enable this extension.');
        });
        test('Test ReloadAction when extension is newly installed and reload is not required', async () => {
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            const runningExtensions = [{ identifier: new extensions_3.ExtensionIdentifier('pub.b'), extensionLocation: uri_1.URI.file('pub.b') }];
            instantiationService.stub(extensions_2.IExtensionService, {
                getExtensions: () => Promise.resolve(runningExtensions),
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => true
            });
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const paged = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = paged.firstPage[0];
            assert.ok(!testObject.enabled);
            installEvent.fire({ identifier: gallery.identifier, gallery });
            didInstallEvent.fire({ identifier: gallery.identifier, gallery, operation: 1 /* Install */, local: aLocalExtension('a', gallery, gallery) });
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when extension is installed and uninstalled', async () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [{ identifier: new extensions_3.ExtensionIdentifier('pub.b'), extensionLocation: uri_1.URI.file('pub.b') }]);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const paged = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = paged.firstPage[0];
            const identifier = gallery.identifier;
            installEvent.fire({ identifier, gallery });
            didInstallEvent.fire({ identifier, gallery, operation: 1 /* Install */, local: aLocalExtension('a', gallery, { identifier }) });
            uninstallEvent.fire(identifier);
            didUninstallEvent.fire({ identifier });
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when extension is uninstalled', async () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a'), version: '1.0.0' }]);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal();
            testObject.extension = extensions[0];
            uninstallEvent.fire(local.identifier);
            didUninstallEvent.fire({ identifier: local.identifier });
            assert.ok(testObject.enabled);
            assert.equal(testObject.tooltip, 'Please reload Visual Studio Code to complete the uninstallation of this extension.');
        });
        test('Test ReloadAction when extension is uninstalled and can be removed', async () => {
            const local = aLocalExtension('a');
            instantiationService.stub(extensions_2.IExtensionService, {
                getExtensions: () => Promise.resolve([ExtensionsActions.toExtensionDescription(local)]),
                onDidChangeExtensions: new event_1.Emitter().event,
                canRemoveExtension: (extension) => true,
                canAddExtension: (extension) => true
            });
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal();
            testObject.extension = extensions[0];
            uninstallEvent.fire(local.identifier);
            didUninstallEvent.fire({ identifier: local.identifier });
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when extension is uninstalled and installed', async () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), version: '1.0.0', extensionLocation: uri_1.URI.file('pub.a') }]);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal();
            testObject.extension = extensions[0];
            uninstallEvent.fire(local.identifier);
            didUninstallEvent.fire({ identifier: local.identifier });
            const gallery = aGalleryExtension('a');
            const identifier = gallery.identifier;
            installEvent.fire({ identifier, gallery });
            didInstallEvent.fire({ identifier, gallery, operation: 1 /* Install */, local });
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when extension is updated while running', async () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), version: '1.0.1', extensionLocation: uri_1.URI.file('pub.a') }]);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a', { version: '1.0.1' });
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await workbenchService.queryLocal();
            testObject.extension = extensions[0];
            return new Promise(c => {
                testObject.onDidChange(() => {
                    if (testObject.enabled && testObject.tooltip === 'Please reload Visual Studio Code to enable the updated extension.') {
                        c();
                    }
                });
                const gallery = aGalleryExtension('a', { uuid: local.identifier.id, version: '1.0.2' });
                installEvent.fire({ identifier: gallery.identifier, gallery });
                didInstallEvent.fire({ identifier: gallery.identifier, gallery, operation: 1 /* Install */, local: aLocalExtension('a', gallery, gallery) });
            });
        });
        test('Test ReloadAction when extension is updated when not running', async () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [{ identifier: new extensions_3.ExtensionIdentifier('pub.b'), extensionLocation: uri_1.URI.file('pub.b') }]);
            const local = aLocalExtension('a', { version: '1.0.1' });
            await instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([local], 2 /* DisabledGlobally */);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await workbenchService.queryLocal();
            testObject.extension = extensions[0];
            const gallery = aGalleryExtension('a', { identifier: local.identifier, version: '1.0.2' });
            installEvent.fire({ identifier: gallery.identifier, gallery });
            didInstallEvent.fire({ identifier: gallery.identifier, gallery, operation: 2 /* Update */, local: aLocalExtension('a', gallery, gallery) });
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when extension is disabled when running', async () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a') }]);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await workbenchService.queryLocal();
            testObject.extension = extensions[0];
            await workbenchService.setEnablement(extensions[0], 2 /* DisabledGlobally */);
            await testObject.update();
            assert.ok(testObject.enabled);
            assert.equal('Please reload Visual Studio Code to disable this extension.', testObject.tooltip);
        });
        test('Test ReloadAction when extension enablement is toggled when running', async () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), version: '1.0.0', extensionLocation: uri_1.URI.file('pub.a') }]);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await workbenchService.queryLocal();
            testObject.extension = extensions[0];
            await workbenchService.setEnablement(extensions[0], 2 /* DisabledGlobally */);
            await workbenchService.setEnablement(extensions[0], 4 /* EnabledGlobally */);
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when extension is enabled when not running', async () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [{ identifier: new extensions_3.ExtensionIdentifier('pub.b'), extensionLocation: uri_1.URI.file('pub.b') }]);
            const local = aLocalExtension('a');
            await instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([local], 2 /* DisabledGlobally */);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await workbenchService.queryLocal();
            testObject.extension = extensions[0];
            await workbenchService.setEnablement(extensions[0], 4 /* EnabledGlobally */);
            await testObject.update();
            assert.ok(testObject.enabled);
            assert.equal('Please reload Visual Studio Code to enable this extension.', testObject.tooltip);
        });
        test('Test ReloadAction when extension enablement is toggled when not running', async () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [{ identifier: new extensions_3.ExtensionIdentifier('pub.b'), extensionLocation: uri_1.URI.file('pub.b') }]);
            const local = aLocalExtension('a');
            await instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([local], 2 /* DisabledGlobally */);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await workbenchService.queryLocal();
            testObject.extension = extensions[0];
            await workbenchService.setEnablement(extensions[0], 4 /* EnabledGlobally */);
            await workbenchService.setEnablement(extensions[0], 2 /* DisabledGlobally */);
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when extension is updated when not running and enabled', async () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [{ identifier: new extensions_3.ExtensionIdentifier('pub.b'), extensionLocation: uri_1.URI.file('pub.b') }]);
            const local = aLocalExtension('a', { version: '1.0.1' });
            await instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([local], 2 /* DisabledGlobally */);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await workbenchService.queryLocal();
            testObject.extension = extensions[0];
            const gallery = aGalleryExtension('a', { identifier: local.identifier, version: '1.0.2' });
            installEvent.fire({ identifier: gallery.identifier, gallery });
            didInstallEvent.fire({ identifier: gallery.identifier, gallery, operation: 1 /* Install */, local: aLocalExtension('a', gallery, gallery) });
            await workbenchService.setEnablement(extensions[0], 4 /* EnabledGlobally */);
            await testObject.update();
            assert.ok(testObject.enabled);
            assert.equal('Please reload Visual Studio Code to enable this extension.', testObject.tooltip);
        });
        test('Test ReloadAction when a localization extension is newly installed', async () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [{ identifier: new extensions_3.ExtensionIdentifier('pub.b'), extensionLocation: uri_1.URI.file('pub.b') }]);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const paged = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = paged.firstPage[0];
            assert.ok(!testObject.enabled);
            installEvent.fire({ identifier: gallery.identifier, gallery });
            didInstallEvent.fire({ identifier: gallery.identifier, gallery, operation: 1 /* Install */, local: aLocalExtension('a', Object.assign(Object.assign({}, gallery), { contributes: { localizations: [{ languageId: 'de', translations: [] }] } }), gallery) });
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when a localization extension is updated while running', async () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), version: '1.0.1', extensionLocation: uri_1.URI.file('pub.a') }]);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a', { version: '1.0.1', contributes: { localizations: [{ languageId: 'de', translations: [] }] } });
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await workbenchService.queryLocal();
            testObject.extension = extensions[0];
            const gallery = aGalleryExtension('a', { uuid: local.identifier.id, version: '1.0.2' });
            installEvent.fire({ identifier: gallery.identifier, gallery });
            didInstallEvent.fire({ identifier: gallery.identifier, gallery, operation: 1 /* Install */, local: aLocalExtension('a', Object.assign(Object.assign({}, gallery), { contributes: { localizations: [{ languageId: 'de', translations: [] }] } }), gallery) });
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when extension is not installed but extension from different server is installed and running', async () => {
            // multi server setup
            const gallery = aGalleryExtension('a');
            const localExtension = aLocalExtension('a', { extensionKind: 'workspace' }, { location: uri_1.URI.file('pub.a') });
            const remoteExtension = aLocalExtension('a', { extensionKind: 'workspace' }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localExtension]), createExtensionManagementService([remoteExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            const runningExtensions = [ExtensionsActions.toExtensionDescription(remoteExtension)];
            instantiationService.stub(extensions_2.IExtensionService, {
                getExtensions: () => Promise.resolve(runningExtensions),
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false
            });
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when extension is uninstalled but extension from different server is installed and running', async () => {
            // multi server setup
            const gallery = aGalleryExtension('a');
            const localExtension = aLocalExtension('a', { extensionKind: 'workspace' }, { location: uri_1.URI.file('pub.a') });
            const remoteExtension = aLocalExtension('a', { extensionKind: 'workspace' }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeRemote }) });
            const localExtensionManagementService = createExtensionManagementService([localExtension]);
            const uninstallEvent = new event_1.Emitter();
            const onDidUninstallEvent = new event_1.Emitter();
            localExtensionManagementService.onUninstallExtension = uninstallEvent.event;
            localExtensionManagementService.onDidUninstallExtension = onDidUninstallEvent.event;
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, localExtensionManagementService, createExtensionManagementService([remoteExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            const runningExtensions = [ExtensionsActions.toExtensionDescription(remoteExtension)];
            instantiationService.stub(extensions_2.IExtensionService, {
                getExtensions: () => Promise.resolve(runningExtensions),
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false
            });
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
            uninstallEvent.fire(localExtension.identifier);
            didUninstallEvent.fire({ identifier: localExtension.identifier });
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when workspace extension is disabled on local server and installed in remote server', async () => {
            // multi server setup
            const gallery = aGalleryExtension('a');
            const remoteExtensionManagementService = createExtensionManagementService([]);
            const onDidInstallEvent = new event_1.Emitter();
            remoteExtensionManagementService.onDidInstallExtension = onDidInstallEvent.event;
            const localExtension = aLocalExtension('a', { extensionKind: 'workspace' }, { location: uri_1.URI.file('pub.a') });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localExtension]), remoteExtensionManagementService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            instantiationService.stub(extensions_2.IExtensionService, {
                getExtensions: () => Promise.resolve([]),
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false
            });
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
            const remoteExtension = aLocalExtension('a', { extensionKind: 'workspace' }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeRemote }) });
            onDidInstallEvent.fire({ identifier: remoteExtension.identifier, local: remoteExtension, operation: 1 /* Install */ });
            assert.ok(testObject.enabled);
            assert.equal(testObject.tooltip, 'Please reload Visual Studio Code to enable this extension.');
        });
        test('Test ReloadAction is disabled when remote ui extension is installed in local server', async () => {
            // multi server setup
            const gallery = aGalleryExtension('a');
            const localExtensionManagementService = createExtensionManagementService([]);
            const onDidInstallEvent = new event_1.Emitter();
            localExtensionManagementService.onDidInstallExtension = onDidInstallEvent.event;
            const remoteExtension = aLocalExtension('a', { extensionKind: 'ui' }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, localExtensionManagementService, createExtensionManagementService([remoteExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            instantiationService.stub(extensions_2.IExtensionService, {
                getExtensions: () => Promise.resolve([ExtensionsActions.toExtensionDescription(remoteExtension)]),
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false
            });
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
            const localExtension = aLocalExtension('a', { extensionKind: 'ui' }, { location: uri_1.URI.file('pub.a') });
            onDidInstallEvent.fire({ identifier: localExtension.identifier, local: localExtension, operation: 1 /* Install */ });
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction for remote ui extension is disabled when it is installed and enabled in local server', async () => {
            // multi server setup
            const gallery = aGalleryExtension('a');
            const localExtension = aLocalExtension('a', { extensionKind: 'ui' }, { location: uri_1.URI.file('pub.a') });
            const localExtensionManagementService = createExtensionManagementService([localExtension]);
            const onDidInstallEvent = new event_1.Emitter();
            localExtensionManagementService.onDidInstallExtension = onDidInstallEvent.event;
            const remoteExtension = aLocalExtension('a', { extensionKind: 'ui' }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, localExtensionManagementService, createExtensionManagementService([remoteExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            instantiationService.stub(extensions_2.IExtensionService, {
                getExtensions: () => Promise.resolve([ExtensionsActions.toExtensionDescription(localExtension)]),
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false
            });
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction for local ui extension is disabled when it is installed and enabled in remote server', async () => {
            // multi server setup
            const gallery = aGalleryExtension('a');
            const localExtension = aLocalExtension('a', { extensionKind: 'ui' }, { location: uri_1.URI.file('pub.a') });
            const localExtensionManagementService = createExtensionManagementService([localExtension]);
            const onDidInstallEvent = new event_1.Emitter();
            localExtensionManagementService.onDidInstallExtension = onDidInstallEvent.event;
            const remoteExtension = aLocalExtension('a', { extensionKind: 'ui' }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, localExtensionManagementService, createExtensionManagementService([remoteExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            instantiationService.stub(extensions_2.IExtensionService, {
                getExtensions: () => Promise.resolve([ExtensionsActions.toExtensionDescription(remoteExtension)]),
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false
            });
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is enabled for local workspace extension', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: 'workspace' }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.equal('Install in remote', testObject.label);
            assert.equal('extension-action prominent install', testObject.class);
        });
        test('Test remote install action when installing local workspace extension', async () => {
            // multi server setup
            const remoteExtensionManagementService = createExtensionManagementService();
            const onInstallExtension = new event_1.Emitter();
            remoteExtensionManagementService.onInstallExtension = onInstallExtension.event;
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: 'workspace' }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]), remoteExtensionManagementService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.stub(extensions_1.IExtensionsWorkbenchService, workbenchService, 'open', undefined);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const gallery = aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier });
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.equal('Install in remote', testObject.label);
            assert.equal('extension-action prominent install', testObject.class);
            onInstallExtension.fire({ identifier: localWorkspaceExtension.identifier, gallery });
            assert.ok(testObject.enabled);
            assert.equal('Installing', testObject.label);
            assert.equal('extension-action install installing', testObject.class);
        });
        test('Test remote install action when installing local workspace extension is finished', async () => {
            // multi server setup
            const remoteExtensionManagementService = createExtensionManagementService();
            const onInstallExtension = new event_1.Emitter();
            remoteExtensionManagementService.onInstallExtension = onInstallExtension.event;
            const onDidInstallEvent = new event_1.Emitter();
            remoteExtensionManagementService.onDidInstallExtension = onDidInstallEvent.event;
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: 'workspace' }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]), remoteExtensionManagementService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.stub(extensions_1.IExtensionsWorkbenchService, workbenchService, 'open', undefined);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const gallery = aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier });
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.equal('Install in remote', testObject.label);
            assert.equal('extension-action prominent install', testObject.class);
            onInstallExtension.fire({ identifier: localWorkspaceExtension.identifier, gallery });
            assert.ok(testObject.enabled);
            assert.equal('Installing', testObject.label);
            assert.equal('extension-action install installing', testObject.class);
            const installedExtension = aLocalExtension('a', { extensionKind: 'workspace' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            onDidInstallEvent.fire({ identifier: installedExtension.identifier, local: installedExtension, operation: 1 /* Install */ });
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is enabled for disabled local workspace extension', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: 'workspace' }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            await instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([localWorkspaceExtension], 2 /* DisabledGlobally */);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.equal('Install in remote', testObject.label);
            assert.equal('extension-action prominent install', testObject.class);
        });
        test('Test remote install action is disabled when extension is not set', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: 'workspace' }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is disabled for extension which is not installed', async () => {
            // multi server setup
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a')));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const pager = await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = pager.firstPage[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is disabled for local workspace extension which is disabled in env', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: 'workspace' }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]));
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { disableExtensions: true });
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is disabled when remote server is not available', async () => {
            // single server setup
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            const extensionManagementServerService = instantiationService.get(extensionManagement_2.IExtensionManagementServerService);
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: 'workspace' }, { location: uri_1.URI.file(`pub.a`) });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [localWorkspaceExtension]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is disabled for local workspace extension if it is uninstalled locally', async () => {
            // multi server setup
            const extensionManagementService = instantiationService.get(extensionManagement_1.IExtensionManagementService);
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, extensionManagementService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: 'workspace' }, { location: uri_1.URI.file(`pub.a`) });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [localWorkspaceExtension]);
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.equal('Install in remote', testObject.label);
            uninstallEvent.fire(localWorkspaceExtension.identifier);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is disabled for local workspace extension if it is installed in remote', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: 'workspace' }, { location: uri_1.URI.file(`pub.a`) });
            const remoteWorkspaceExtension = aLocalExtension('a', { extensionKind: 'workspace' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]), createExtensionManagementService([remoteWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is enabled for local workspace extension if it has not gallery', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: 'workspace' }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(testObject.enabled);
        });
        test('Test remote install action is disabled for local workspace system extension', async () => {
            // multi server setup
            const localWorkspaceSystemExtension = aLocalExtension('a', { extensionKind: 'workspace' }, { location: uri_1.URI.file(`pub.a`), type: 0 /* System */ });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceSystemExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceSystemExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is disabled for local ui extension if it is not installed in remote', async () => {
            // multi server setup
            const localUIExtension = aLocalExtension('a', { extensionKind: 'ui' }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localUIExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is disabled for local ui extension if it is also installed in remote', async () => {
            // multi server setup
            const localUIExtension = aLocalExtension('a', { extensionKind: 'ui' }, { location: uri_1.URI.file(`pub.a`) });
            const remoteUIExtension = aLocalExtension('a', { extensionKind: 'ui' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localUIExtension]), createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localUIExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is enabled for locally installed language pack extension', async () => {
            // multi server setup
            const languagePackExtension = aLocalExtension('a', { contributes: { localizations: [{ languageId: 'de', translations: [] }] } }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([languagePackExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: languagePackExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.equal('Install in remote', testObject.label);
            assert.equal('extension-action prominent install', testObject.class);
        });
        test('Test remote install action is disabled if local language pack extension is uninstalled', async () => {
            // multi server setup
            const extensionManagementService = instantiationService.get(extensionManagement_1.IExtensionManagementService);
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, extensionManagementService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const languagePackExtension = aLocalExtension('a', { contributes: { localizations: [{ languageId: 'de', translations: [] }] } }, { location: uri_1.URI.file(`pub.a`) });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [languagePackExtension]);
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: languagePackExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.equal('Install in remote', testObject.label);
            uninstallEvent.fire(languagePackExtension.identifier);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is disabled for remote ui extension', async () => {
            // multi server setup
            const remoteUIExtension = aLocalExtension('a', { extensionKind: 'ui' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteUIExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(!testObject.enabled);
        });
        test('Test local install action when installing remote ui extension', async () => {
            // multi server setup
            const localExtensionManagementService = createExtensionManagementService();
            const onInstallExtension = new event_1.Emitter();
            localExtensionManagementService.onInstallExtension = onInstallExtension.event;
            const remoteUIExtension = aLocalExtension('a', { extensionKind: 'ui' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, localExtensionManagementService, createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.stub(extensions_1.IExtensionsWorkbenchService, workbenchService, 'open', undefined);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const gallery = aGalleryExtension('a', { identifier: remoteUIExtension.identifier });
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is disabled for disabled remote ui extension', async () => {
            // multi server setup
            const remoteUIExtension = aLocalExtension('a', { extensionKind: 'ui' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            await instantiationService.get(extensionManagement_2.IExtensionEnablementService).setEnablement([remoteUIExtension], 2 /* DisabledGlobally */);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteUIExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is disabled when extension is not set', async () => {
            // multi server setup
            const remoteUIExtension = aLocalExtension('a', { extensionKind: 'ui' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteUIExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is disabled for extension which is not installed', async () => {
            // multi server setup
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a')));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const pager = await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = pager.firstPage[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is disabled for remote ui extension which is disabled in env', async () => {
            // multi server setup
            const remoteUIExtension = aLocalExtension('a', { extensionKind: 'ui' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { disableExtensions: true });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteUIExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is disabled when local server is not available', async () => {
            // single server setup
            const remoteUIExtension = aLocalExtension('a', { extensionKind: 'ui' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aSingleRemoteExtensionManagementServerService(instantiationService, createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteUIExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is disabled for remote ui extension if it is installed in local', async () => {
            // multi server setup
            const localUIExtension = aLocalExtension('a', { extensionKind: 'ui' }, { location: uri_1.URI.file(`pub.a`) });
            const remoteUIExtension = aLocalExtension('a', { extensionKind: 'ui' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localUIExtension]), createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localUIExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is disabled for remote UI extension if it uninstalled locally', async () => {
            // multi server setup
            const extensionManagementService = instantiationService.get(extensionManagement_1.IExtensionManagementService);
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), extensionManagementService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const remoteUIExtension = aLocalExtension('a', { extensionKind: 'ui' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [remoteUIExtension]);
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteUIExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(!testObject.enabled);
            uninstallEvent.fire(remoteUIExtension.identifier);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is disabled for remote UI extension if it has gallery', async () => {
            // multi server setup
            const remoteUIExtension = aLocalExtension('a', { extensionKind: 'ui' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteUIExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is disabled for remote UI system extension', async () => {
            // multi server setup
            const remoteUISystemExtension = aLocalExtension('a', { extensionKind: 'ui' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }), type: 0 /* System */ });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), createExtensionManagementService([remoteUISystemExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteUISystemExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is disabled for remote workspace extension if it is not installed in local', async () => {
            // multi server setup
            const remoteWorkspaceExtension = aLocalExtension('a', { extensionKind: 'workspace' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), createExtensionManagementService([remoteWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteWorkspaceExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is disabled for remote workspace extension if it is also installed in local', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: 'workspae' }, { location: uri_1.URI.file(`pub.a`) });
            const remoteWorkspaceExtension = aLocalExtension('a', { extensionKind: 'workspace' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]), createExtensionManagementService([remoteWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is enabled for remotely installed language pack extension', async () => {
            // multi server setup
            const languagePackExtension = aLocalExtension('a', { contributes: { localizations: [{ languageId: 'de', translations: [] }] } }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), createExtensionManagementService([languagePackExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: languagePackExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.equal('Install Locally', testObject.label);
            assert.equal('extension-action prominent install', testObject.class);
        });
        test('Test local install action is disabled if remote language pack extension is uninstalled', async () => {
            // multi server setup
            const extensionManagementService = instantiationService.get(extensionManagement_1.IExtensionManagementService);
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), extensionManagementService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const languagePackExtension = aLocalExtension('a', { contributes: { localizations: [{ languageId: 'de', translations: [] }] } }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [languagePackExtension]);
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: languagePackExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.equal('Install Locally', testObject.label);
            uninstallEvent.fire(languagePackExtension.identifier);
            assert.ok(!testObject.enabled);
        });
        test(`RecommendToFolderAction`, () => {
            // TODO: Implement test
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
        function aSingleRemoteExtensionManagementServerService(instantiationService, remoteExtensionManagementService) {
            const remoteExtensionManagementServer = {
                authority: 'vscode-remote',
                label: 'remote',
                extensionManagementService: remoteExtensionManagementService || createExtensionManagementService()
            };
            return {
                _serviceBrand: undefined,
                localExtensionManagementServer: null,
                remoteExtensionManagementServer,
                getExtensionManagementServer: (location) => {
                    if (location.scheme === remoteHosts_1.REMOTE_HOST_SCHEME) {
                        return remoteExtensionManagementServer;
                    }
                    return null;
                }
            };
        }
        function aMultiExtensionManagementServerService(instantiationService, localExtensionManagementService, remoteExtensionManagementService) {
            const localExtensionManagementServer = {
                authority: 'vscode-local',
                label: 'local',
                extensionManagementService: localExtensionManagementService || createExtensionManagementService()
            };
            const remoteExtensionManagementServer = {
                authority: 'vscode-remote',
                label: 'remote',
                extensionManagementService: remoteExtensionManagementService || createExtensionManagementService()
            };
            return {
                _serviceBrand: undefined,
                localExtensionManagementServer,
                remoteExtensionManagementServer,
                getExtensionManagementServer: (location) => {
                    if (location.scheme === network_1.Schemas.file) {
                        return localExtensionManagementServer;
                    }
                    if (location.scheme === remoteHosts_1.REMOTE_HOST_SCHEME) {
                        return remoteExtensionManagementServer;
                    }
                    return null;
                }
            };
        }
        function createExtensionManagementService(installed = []) {
            return {
                onInstallExtension: event_1.Event.None,
                onDidInstallExtension: event_1.Event.None,
                onUninstallExtension: event_1.Event.None,
                onDidUninstallExtension: event_1.Event.None,
                getInstalled: () => Promise.resolve(installed),
                installFromGallery: (extension) => Promise.reject(new Error('not supported'))
            };
        }
    });
});
//# sourceMappingURL=extensionsActions.test.js.map