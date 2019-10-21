/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/lifecycle/common/lifecycle", "vs/platform/notification/common/notification", "vs/platform/notification/test/common/testNotificationService", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/contrib/experiments/browser/experimentalPrompt", "vs/workbench/contrib/experiments/common/experimentService", "vs/workbench/contrib/experiments/test/electron-browser/experimentService.test", "vs/workbench/test/workbenchTestServices"], function (require, exports, assert, event_1, instantiationServiceMock_1, lifecycle_1, notification_1, testNotificationService_1, storage_1, telemetry_1, telemetryUtils_1, experimentalPrompt_1, experimentService_1, experimentService_test_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Experimental Prompts', () => {
        let instantiationService;
        let experimentService;
        let experimentalPrompt;
        let onExperimentEnabledEvent;
        let storageData = {};
        const promptText = 'Hello there! Can you see this?';
        const experiment = {
            id: 'experiment1',
            enabled: true,
            state: 2 /* Run */,
            action: {
                type: experimentService_1.ExperimentActionType.Prompt,
                properties: {
                    promptText,
                    commands: [
                        {
                            text: 'Yes',
                        },
                        {
                            text: 'No'
                        }
                    ]
                }
            }
        };
        suiteSetup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(lifecycle_1.ILifecycleService, new workbenchTestServices_1.TestLifecycleService());
            instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            onExperimentEnabledEvent = new event_1.Emitter();
        });
        setup(() => {
            storageData = {};
            instantiationService.stub(storage_1.IStorageService, {
                get: (a, b, c) => a === 'experiments.experiment1' ? JSON.stringify(storageData) : c,
                store: (a, b, c) => {
                    if (a === 'experiments.experiment1') {
                        storageData = JSON.parse(b + '');
                    }
                }
            });
            instantiationService.stub(notification_1.INotificationService, new testNotificationService_1.TestNotificationService());
            experimentService = instantiationService.createInstance(experimentService_test_1.TestExperimentService);
            experimentService.onExperimentEnabled = onExperimentEnabledEvent.event;
            instantiationService.stub(experimentService_1.IExperimentService, experimentService);
        });
        teardown(() => {
            if (experimentService) {
                experimentService.dispose();
            }
            if (experimentalPrompt) {
                experimentalPrompt.dispose();
            }
        });
        test('Show experimental prompt if experiment should be run. Choosing option with link should mark experiment as complete', () => {
            storageData = {
                enabled: true,
                state: 2 /* Run */
            };
            instantiationService.stub(notification_1.INotificationService, {
                prompt: (a, b, c, options) => {
                    assert.equal(b, promptText);
                    assert.equal(c.length, 2);
                    c[0].run();
                    return undefined;
                }
            });
            experimentalPrompt = instantiationService.createInstance(experimentalPrompt_1.ExperimentalPrompts);
            onExperimentEnabledEvent.fire(experiment);
            return Promise.resolve(null).then(result => {
                assert.equal(storageData['state'], 3 /* Complete */);
            });
        });
        test('Show experimental prompt if experiment should be run. Choosing negative option should mark experiment as complete', () => {
            storageData = {
                enabled: true,
                state: 2 /* Run */
            };
            instantiationService.stub(notification_1.INotificationService, {
                prompt: (a, b, c) => {
                    assert.equal(b, promptText);
                    assert.equal(c.length, 2);
                    c[1].run();
                    return undefined;
                }
            });
            experimentalPrompt = instantiationService.createInstance(experimentalPrompt_1.ExperimentalPrompts);
            onExperimentEnabledEvent.fire(experiment);
            return Promise.resolve(null).then(result => {
                assert.equal(storageData['state'], 3 /* Complete */);
            });
        });
        test('Show experimental prompt if experiment should be run. Cancelling should mark experiment as complete', () => {
            storageData = {
                enabled: true,
                state: 2 /* Run */
            };
            instantiationService.stub(notification_1.INotificationService, {
                prompt: (a, b, c, options) => {
                    assert.equal(b, promptText);
                    assert.equal(c.length, 2);
                    options.onCancel();
                    return undefined;
                }
            });
            experimentalPrompt = instantiationService.createInstance(experimentalPrompt_1.ExperimentalPrompts);
            onExperimentEnabledEvent.fire(experiment);
            return Promise.resolve(null).then(result => {
                assert.equal(storageData['state'], 3 /* Complete */);
            });
        });
        test('Test getPromptText', () => {
            const simpleTextCase = {
                promptText: 'My simple prompt',
                commands: []
            };
            const multipleLocaleCase = {
                promptText: {
                    en: 'My simple prompt for en',
                    de: 'My simple prompt for de',
                    'en-au': 'My simple prompt for Austrailian English',
                    'en-us': 'My simple prompt for US English'
                },
                commands: []
            };
            const englishUSTextCase = {
                promptText: {
                    'en-us': 'My simple prompt for en'
                },
                commands: []
            };
            const noEnglishTextCase = {
                promptText: {
                    'de-de': 'My simple prompt for German'
                },
                commands: []
            };
            assert.equal(experimentalPrompt_1.ExperimentalPrompts.getLocalizedText(simpleTextCase.promptText, 'any-language'), simpleTextCase.promptText);
            const multipleLocalePromptText = multipleLocaleCase.promptText;
            assert.equal(experimentalPrompt_1.ExperimentalPrompts.getLocalizedText(multipleLocaleCase.promptText, 'en'), multipleLocalePromptText['en']);
            assert.equal(experimentalPrompt_1.ExperimentalPrompts.getLocalizedText(multipleLocaleCase.promptText, 'de'), multipleLocalePromptText['de']);
            assert.equal(experimentalPrompt_1.ExperimentalPrompts.getLocalizedText(multipleLocaleCase.promptText, 'en-au'), multipleLocalePromptText['en-au']);
            assert.equal(experimentalPrompt_1.ExperimentalPrompts.getLocalizedText(multipleLocaleCase.promptText, 'en-gb'), multipleLocalePromptText['en']);
            assert.equal(experimentalPrompt_1.ExperimentalPrompts.getLocalizedText(multipleLocaleCase.promptText, 'fr'), multipleLocalePromptText['en']);
            assert.equal(experimentalPrompt_1.ExperimentalPrompts.getLocalizedText(englishUSTextCase.promptText, 'fr'), englishUSTextCase.promptText['en-us']);
            assert.equal(!!experimentalPrompt_1.ExperimentalPrompts.getLocalizedText(noEnglishTextCase.promptText, 'fr'), false);
        });
    });
});
//# sourceMappingURL=experimentalPrompts.test.js.map