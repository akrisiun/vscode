/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/experiments/common/experimentService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/environment/common/environment", "vs/workbench/test/workbenchTestServices", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/node/extensionManagementService", "vs/base/common/event", "vs/workbench/services/extensionManagement/test/electron-browser/extensionEnablementService.test", "vs/platform/url/node/urlService", "vs/platform/url/common/url", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/lifecycle/common/lifecycle", "vs/base/common/objects", "vs/base/common/uri", "vs/platform/storage/common/storage", "vs/platform/extensionManagement/common/extensionManagementUtil"], function (require, exports, assert, experimentService_1, instantiationServiceMock_1, environment_1, workbenchTestServices_1, extensionManagement_1, extensionManagement_2, extensionManagementService_1, event_1, extensionEnablementService_test_1, urlService_1, url_1, telemetry_1, telemetryUtils_1, configuration_1, testConfigurationService_1, lifecycle_1, objects_1, uri_1, storage_1, extensionManagementUtil_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let experimentData = {
        experiments: []
    };
    const local = aLocalExtension('installedExtension1', { version: '1.0.0' });
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
    class TestExperimentService extends experimentService_1.ExperimentService {
        getExperiments() {
            return Promise.resolve(experimentData.experiments);
        }
    }
    exports.TestExperimentService = TestExperimentService;
    suite('Experiment Service', () => {
        let instantiationService;
        let testConfigurationService;
        let testObject;
        let installEvent, didInstallEvent, uninstallEvent, didUninstallEvent;
        suiteSetup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            installEvent = new event_1.Emitter();
            didInstallEvent = new event_1.Emitter();
            uninstallEvent = new event_1.Emitter();
            didUninstallEvent = new event_1.Emitter();
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, extensionManagementService_1.ExtensionManagementService);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onInstallExtension', installEvent.event);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onDidInstallExtension', didInstallEvent.event);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onUninstallExtension', uninstallEvent.event);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onDidUninstallExtension', didUninstallEvent.event);
            instantiationService.stub(extensionManagement_2.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            instantiationService.stub(url_1.IURLService, urlService_1.URLService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            testConfigurationService = new testConfigurationService_1.TestConfigurationService();
            instantiationService.stub(configuration_1.IConfigurationService, testConfigurationService);
            instantiationService.stub(lifecycle_1.ILifecycleService, new workbenchTestServices_1.TestLifecycleService());
            instantiationService.stub(storage_1.IStorageService, { get: (a, b, c) => c, getBoolean: (a, b, c) => c, store: () => { }, remove: () => { } });
            setup(() => {
                instantiationService.stub(environment_1.IEnvironmentService, {});
                instantiationService.stub(storage_1.IStorageService, { get: (a, b, c) => c, getBoolean: (a, b, c) => c, store: () => { }, remove: () => { } });
            });
            teardown(() => {
                if (testObject) {
                    testObject.dispose();
                }
            });
        });
        test('Simple Experiment Test', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1'
                    },
                    {
                        id: 'experiment2',
                        enabled: false
                    },
                    {
                        id: 'experiment3',
                        enabled: true
                    },
                    {
                        id: 'experiment4',
                        enabled: true,
                        condition: {}
                    },
                    {
                        id: 'experiment5',
                        enabled: true,
                        condition: {
                            insidersOnly: true
                        }
                    }
                ]
            };
            testObject = instantiationService.createInstance(TestExperimentService);
            const tests = [];
            tests.push(testObject.getExperimentById('experiment1'));
            tests.push(testObject.getExperimentById('experiment2'));
            tests.push(testObject.getExperimentById('experiment3'));
            tests.push(testObject.getExperimentById('experiment4'));
            tests.push(testObject.getExperimentById('experiment5'));
            return Promise.all(tests).then(results => {
                assert.equal(results[0].id, 'experiment1');
                assert.equal(results[0].enabled, false);
                assert.equal(results[0].state, 1 /* NoRun */);
                assert.equal(results[1].id, 'experiment2');
                assert.equal(results[1].enabled, false);
                assert.equal(results[1].state, 1 /* NoRun */);
                assert.equal(results[2].id, 'experiment3');
                assert.equal(results[2].enabled, true);
                assert.equal(results[2].state, 2 /* Run */);
                assert.equal(results[3].id, 'experiment4');
                assert.equal(results[3].enabled, true);
                assert.equal(results[3].state, 2 /* Run */);
                assert.equal(results[4].id, 'experiment5');
                assert.equal(results[4].enabled, true);
                assert.equal(results[4].state, 2 /* Run */);
            });
        });
        test('Insiders only experiment shouldnt be enabled in stable', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            insidersOnly: true
                        }
                    }
                ]
            };
            instantiationService.stub(environment_1.IEnvironmentService, { appQuality: 'stable' });
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.equal(result.enabled, true);
                assert.equal(result.state, 1 /* NoRun */);
            });
        });
        test('NewUsers experiment shouldnt be enabled for old users', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            newUser: true
                        }
                    }
                ]
            };
            instantiationService.stub(storage_1.IStorageService, {
                get: (a, b, c) => {
                    return a === telemetry_1.lastSessionDateStorageKey ? 'some-date' : undefined;
                },
                getBoolean: (a, b, c) => c, store: () => { }, remove: () => { }
            });
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.equal(result.enabled, true);
                assert.equal(result.state, 1 /* NoRun */);
            });
        });
        test('OldUsers experiment shouldnt be enabled for new users', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            newUser: false
                        }
                    }
                ]
            };
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.equal(result.enabled, true);
                assert.equal(result.state, 1 /* NoRun */);
            });
        });
        test('Experiment without NewUser condition should be enabled for old users', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {}
                    }
                ]
            };
            instantiationService.stub(storage_1.IStorageService, {
                get: (a, b, c) => {
                    return a === telemetry_1.lastSessionDateStorageKey ? 'some-date' : undefined;
                },
                getBoolean: (a, b, c) => c, store: () => { }, remove: () => { }
            });
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.equal(result.enabled, true);
                assert.equal(result.state, 2 /* Run */);
            });
        });
        test('Experiment without NewUser condition should be enabled for new users', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {}
                    }
                ]
            };
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.equal(result.enabled, true);
                assert.equal(result.state, 2 /* Run */);
            });
        });
        test('Experiment with no matching display language should be disabled', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            displayLanguage: 'somethingthat-nooneknows'
                        }
                    }
                ]
            };
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.equal(result.enabled, true);
                assert.equal(result.state, 1 /* NoRun */);
            });
        });
        test('Experiment with condition type InstalledExtensions is enabled when one of the expected extensions is installed', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            installedExtensions: {
                                inlcudes: ['pub.installedExtension1', 'uninstalled-extention-id']
                            }
                        }
                    }
                ]
            };
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.equal(result.enabled, true);
                assert.equal(result.state, 2 /* Run */);
            });
        });
        test('Experiment with condition type InstalledExtensions is disabled when none of the expected extensions is installed', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            installedExtensions: {
                                includes: ['uninstalled-extention-id1', 'uninstalled-extention-id2']
                            }
                        }
                    }
                ]
            };
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.equal(result.enabled, true);
                assert.equal(result.state, 1 /* NoRun */);
            });
        });
        test('Experiment with condition type InstalledExtensions is disabled when one of the exlcuded extensions is installed', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            installedExtensions: {
                                excludes: ['pub.installedExtension1', 'uninstalled-extention-id2']
                            }
                        }
                    }
                ]
            };
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.equal(result.enabled, true);
                assert.equal(result.state, 1 /* NoRun */);
            });
        });
        test('Experiment that is marked as complete should be disabled regardless of the conditions', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            installedExtensions: {
                                includes: ['pub.installedExtension1', 'uninstalled-extention-id2']
                            }
                        }
                    }
                ]
            };
            instantiationService.stub(storage_1.IStorageService, {
                get: (a, b, c) => a === 'experiments.experiment1' ? JSON.stringify({ state: 3 /* Complete */ }) : c,
                store: () => { }
            });
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.equal(result.enabled, true);
                assert.equal(result.state, 3 /* Complete */);
            });
        });
        test('Experiment with evaluate only once should read enablement from storage service', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            installedExtensions: {
                                excludes: ['pub.installedExtension1', 'uninstalled-extention-id2']
                            },
                            evaluateOnlyOnce: true
                        }
                    }
                ]
            };
            instantiationService.stub(storage_1.IStorageService, {
                get: (a, b, c) => a === 'experiments.experiment1' ? JSON.stringify({ enabled: true, state: 2 /* Run */ }) : c,
                store: () => { }
            });
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.equal(result.enabled, true);
                assert.equal(result.state, 2 /* Run */);
            });
        });
        test('Curated list should be available if experiment is enabled.', () => {
            const promptText = 'Hello there! Can you see this?';
            const curatedExtensionsKey = 'AzureDeploy';
            const curatedExtensionsList = ['uninstalled-extention-id1', 'uninstalled-extention-id2'];
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        action: {
                            type: 'Prompt',
                            properties: {
                                promptText,
                                commands: [
                                    {
                                        text: 'Search Marketplace',
                                        dontShowAgain: true,
                                        curatedExtensionsKey,
                                        curatedExtensionsList
                                    },
                                    {
                                        text: 'No'
                                    }
                                ]
                            }
                        }
                    }
                ]
            };
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.equal(result.enabled, true);
                assert.equal(result.state, 2 /* Run */);
                return testObject.getCuratedExtensionsList(curatedExtensionsKey).then(curatedList => {
                    assert.equal(curatedList, curatedExtensionsList);
                });
            });
        });
        test('Curated list shouldnt be available if experiment is disabled.', () => {
            const promptText = 'Hello there! Can you see this?';
            const curatedExtensionsKey = 'AzureDeploy';
            const curatedExtensionsList = ['uninstalled-extention-id1', 'uninstalled-extention-id2'];
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: false,
                        action: {
                            type: 'Prompt',
                            properties: {
                                promptText,
                                commands: [
                                    {
                                        text: 'Search Marketplace',
                                        dontShowAgain: true,
                                        curatedExtensionsKey,
                                        curatedExtensionsList
                                    },
                                    {
                                        text: 'No'
                                    }
                                ]
                            }
                        }
                    }
                ]
            };
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.equal(result.enabled, false);
                assert.equal(result.state, 1 /* NoRun */);
                return testObject.getCuratedExtensionsList(curatedExtensionsKey).then(curatedList => {
                    assert.equal(curatedList.length, 0);
                });
            });
        });
        test('Experiment that is disabled or deleted should be removed from storage', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: false
                    },
                    {
                        id: 'experiment3',
                        enabled: true
                    }
                ]
            };
            let storageDataExperiment1 = { enabled: false };
            let storageDataExperiment2 = { enabled: false };
            let storageDataAllExperiments = ['experiment1', 'experiment2', 'experiment3'];
            instantiationService.stub(storage_1.IStorageService, {
                get: (a, b, c) => {
                    switch (a) {
                        case 'experiments.experiment1':
                            return JSON.stringify(storageDataExperiment1);
                        case 'experiments.experiment2':
                            return JSON.stringify(storageDataExperiment2);
                        case 'allExperiments':
                            return JSON.stringify(storageDataAllExperiments);
                        default:
                            break;
                    }
                    return c;
                },
                store: (a, b, c) => {
                    switch (a) {
                        case 'experiments.experiment1':
                            storageDataExperiment1 = JSON.parse(b);
                            break;
                        case 'experiments.experiment2':
                            storageDataExperiment2 = JSON.parse(b);
                            break;
                        case 'allExperiments':
                            storageDataAllExperiments = JSON.parse(b);
                            break;
                        default:
                            break;
                    }
                },
                remove: (a) => {
                    switch (a) {
                        case 'experiments.experiment1':
                            storageDataExperiment1 = null;
                            break;
                        case 'experiments.experiment2':
                            storageDataExperiment2 = null;
                            break;
                        case 'allExperiments':
                            storageDataAllExperiments = null;
                            break;
                        default:
                            break;
                    }
                }
            });
            testObject = instantiationService.createInstance(TestExperimentService);
            const disabledExperiment = testObject.getExperimentById('experiment1').then(result => {
                assert.equal(result.enabled, false);
                assert.equal(!!storageDataExperiment1, false);
            });
            const deletedExperiment = testObject.getExperimentById('experiment2').then(result => {
                assert.equal(!!result, false);
                assert.equal(!!storageDataExperiment2, false);
            });
            return Promise.all([disabledExperiment, deletedExperiment]).then(() => {
                assert.equal(storageDataAllExperiments.length, 1);
                assert.equal(storageDataAllExperiments[0], 'experiment3');
            });
        });
        test('Offline mode', () => {
            experimentData = {
                experiments: null
            };
            let storageDataExperiment1 = { enabled: true, state: 2 /* Run */ };
            let storageDataExperiment2 = { enabled: true, state: 1 /* NoRun */ };
            let storageDataExperiment3 = { enabled: true, state: 0 /* Evaluating */ };
            let storageDataExperiment4 = { enabled: true, state: 3 /* Complete */ };
            let storageDataAllExperiments = ['experiment1', 'experiment2', 'experiment3', 'experiment4'];
            instantiationService.stub(storage_1.IStorageService, {
                get: (a, b, c) => {
                    switch (a) {
                        case 'experiments.experiment1':
                            return JSON.stringify(storageDataExperiment1);
                        case 'experiments.experiment2':
                            return JSON.stringify(storageDataExperiment2);
                        case 'experiments.experiment3':
                            return JSON.stringify(storageDataExperiment3);
                        case 'experiments.experiment4':
                            return JSON.stringify(storageDataExperiment4);
                        case 'allExperiments':
                            return JSON.stringify(storageDataAllExperiments);
                        default:
                            break;
                    }
                    return c;
                },
                store: (a, b, c) => {
                    switch (a) {
                        case 'experiments.experiment1':
                            storageDataExperiment1 = JSON.parse(b + '');
                            break;
                        case 'experiments.experiment2':
                            storageDataExperiment2 = JSON.parse(b + '');
                            break;
                        case 'experiments.experiment3':
                            storageDataExperiment3 = JSON.parse(b + '');
                            break;
                        case 'experiments.experiment4':
                            storageDataExperiment4 = JSON.parse(b + '');
                            break;
                        case 'allExperiments':
                            storageDataAllExperiments = JSON.parse(b + '');
                            break;
                        default:
                            break;
                    }
                },
                remove: a => {
                    switch (a) {
                        case 'experiments.experiment1':
                            storageDataExperiment1 = null;
                            break;
                        case 'experiments.experiment2':
                            storageDataExperiment2 = null;
                            break;
                        case 'experiments.experiment3':
                            storageDataExperiment3 = null;
                            break;
                        case 'experiments.experiment4':
                            storageDataExperiment4 = null;
                            break;
                        case 'allExperiments':
                            storageDataAllExperiments = null;
                            break;
                        default:
                            break;
                    }
                }
            });
            testObject = instantiationService.createInstance(TestExperimentService);
            const tests = [];
            tests.push(testObject.getExperimentById('experiment1'));
            tests.push(testObject.getExperimentById('experiment2'));
            tests.push(testObject.getExperimentById('experiment3'));
            tests.push(testObject.getExperimentById('experiment4'));
            return Promise.all(tests).then(results => {
                assert.equal(results[0].id, 'experiment1');
                assert.equal(results[0].enabled, true);
                assert.equal(results[0].state, 2 /* Run */);
                assert.equal(results[1].id, 'experiment2');
                assert.equal(results[1].enabled, true);
                assert.equal(results[1].state, 1 /* NoRun */);
                assert.equal(results[2].id, 'experiment3');
                assert.equal(results[2].enabled, true);
                assert.equal(results[2].state, 0 /* Evaluating */);
                assert.equal(results[3].id, 'experiment4');
                assert.equal(results[3].enabled, true);
                assert.equal(results[3].state, 3 /* Complete */);
            });
        });
        test('getExperimentByType', () => {
            const customProperties = {
                some: 'random-value'
            };
            experimentData = {
                experiments: [
                    {
                        id: 'simple-experiment',
                        enabled: true
                    },
                    {
                        id: 'custom-experiment',
                        enabled: true,
                        action: {
                            type: 'Custom',
                            properties: customProperties
                        }
                    },
                    {
                        id: 'custom-experiment-no-properties',
                        enabled: true,
                        action: {
                            type: 'Custom'
                        }
                    },
                    {
                        id: 'prompt-with-no-commands',
                        enabled: true,
                        action: {
                            type: 'Prompt',
                            properties: {
                                promptText: 'someText'
                            }
                        }
                    },
                    {
                        id: 'prompt-with-commands',
                        enabled: true,
                        action: {
                            type: 'Prompt',
                            properties: {
                                promptText: 'someText',
                                commands: [
                                    {
                                        text: 'Hello'
                                    }
                                ]
                            }
                        }
                    }
                ]
            };
            testObject = instantiationService.createInstance(TestExperimentService);
            const custom = testObject.getExperimentsByType(experimentService_1.ExperimentActionType.Custom).then(result => {
                assert.equal(result.length, 3);
                assert.equal(result[0].id, 'simple-experiment');
                assert.equal(result[1].id, 'custom-experiment');
                assert.equal(result[1].action.properties, customProperties);
                assert.equal(result[2].id, 'custom-experiment-no-properties');
                assert.equal(!!result[2].action.properties, true);
            });
            const prompt = testObject.getExperimentsByType(experimentService_1.ExperimentActionType.Prompt).then(result => {
                assert.equal(result.length, 2);
                assert.equal(result[0].id, 'prompt-with-no-commands');
                assert.equal(result[1].id, 'prompt-with-commands');
            });
            return Promise.all([custom, prompt]);
        });
        test('experimentsPreviouslyRun includes, excludes check', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment3',
                        enabled: true,
                        condition: {
                            experimentsPreviouslyRun: {
                                includes: ['experiment1'],
                                excludes: ['experiment2']
                            }
                        }
                    },
                    {
                        id: 'experiment4',
                        enabled: true,
                        condition: {
                            experimentsPreviouslyRun: {
                                includes: ['experiment1'],
                                excludes: ['experiment200']
                            }
                        }
                    }
                ]
            };
            let storageDataExperiment3 = { enabled: true, state: 0 /* Evaluating */ };
            let storageDataExperiment4 = { enabled: true, state: 0 /* Evaluating */ };
            instantiationService.stub(storage_1.IStorageService, {
                get: (a, b, c) => {
                    switch (a) {
                        case 'currentOrPreviouslyRunExperiments':
                            return JSON.stringify(['experiment1', 'experiment2']);
                        default:
                            break;
                    }
                    return c;
                },
                store: (a, b, c) => {
                    switch (a) {
                        case 'experiments.experiment3':
                            storageDataExperiment3 = JSON.parse(b + '');
                            break;
                        case 'experiments.experiment4':
                            storageDataExperiment4 = JSON.parse(b + '');
                            break;
                        default:
                            break;
                    }
                }
            });
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentsByType(experimentService_1.ExperimentActionType.Custom).then(result => {
                assert.equal(result.length, 2);
                assert.equal(result[0].id, 'experiment3');
                assert.equal(result[0].state, 1 /* NoRun */);
                assert.equal(result[1].id, 'experiment4');
                assert.equal(result[1].state, 2 /* Run */);
                assert.equal(storageDataExperiment3.state, 1 /* NoRun */);
                assert.equal(storageDataExperiment4.state, 2 /* Run */);
                return Promise.resolve(null);
            });
        });
        // test('Experiment with condition type FileEdit should increment editcount as appropriate', () => {
        // });
        // test('Experiment with condition type WorkspaceEdit should increment editcount as appropriate', () => {
        // });
    });
});
//# sourceMappingURL=experimentService.test.js.map