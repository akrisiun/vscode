/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/common/platform", "vs/platform/configuration/common/configuration", "vs/workbench/services/configurationResolver/browser/configurationResolverService", "vs/workbench/test/workbenchTestServices", "vs/platform/configuration/test/common/testConfigurationService", "vs/base/common/lifecycle", "vs/base/common/types", "vs/editor/common/editorCommon", "vs/editor/common/core/selection", "vs/workbench/services/environment/node/environmentService"], function (require, exports, assert, uri_1, platform, configuration_1, configurationResolverService_1, workbenchTestServices_1, testConfigurationService_1, lifecycle_1, Types, editorCommon_1, selection_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const mockLineNumber = 10;
    class TestEditorServiceWithActiveEditor extends workbenchTestServices_1.TestEditorService {
        get activeTextEditorWidget() {
            return {
                getEditorType() {
                    return editorCommon_1.EditorType.ICodeEditor;
                },
                getSelection() {
                    return new selection_1.Selection(mockLineNumber, 1, mockLineNumber, 10);
                }
            };
        }
    }
    suite('Configuration Resolver Service', () => {
        let configurationResolverService;
        let envVariables = { key1: 'Value for key1', key2: 'Value for key2' };
        let environmentService;
        let mockCommandService;
        let editorService;
        let workspace;
        let quickInputService;
        setup(() => {
            mockCommandService = new MockCommandService();
            editorService = new TestEditorServiceWithActiveEditor();
            quickInputService = new MockQuickInputService();
            environmentService = new MockWorkbenchEnvironmentService(envVariables);
            workspace = {
                uri: uri_1.URI.parse('file:///VSCode/workspaceLocation'),
                name: 'hey',
                index: 0,
                toResource: (path) => uri_1.URI.file(path)
            };
            configurationResolverService = new configurationResolverService_1.ConfigurationResolverService(editorService, environmentService, new MockInputsConfigurationService(), mockCommandService, new workbenchTestServices_1.TestContextService(), quickInputService);
        });
        teardown(() => {
            configurationResolverService = null;
        });
        test('substitute one', () => {
            if (platform.isWindows) {
                assert.strictEqual(configurationResolverService.resolve(workspace, 'abc ${workspaceFolder} xyz'), 'abc \\VSCode\\workspaceLocation xyz');
            }
            else {
                assert.strictEqual(configurationResolverService.resolve(workspace, 'abc ${workspaceFolder} xyz'), 'abc /VSCode/workspaceLocation xyz');
            }
        });
        test('workspace root folder name', () => {
            assert.strictEqual(configurationResolverService.resolve(workspace, 'abc ${workspaceRootFolderName} xyz'), 'abc workspaceLocation xyz');
        });
        test('current selected line number', () => {
            assert.strictEqual(configurationResolverService.resolve(workspace, 'abc ${lineNumber} xyz'), `abc ${mockLineNumber} xyz`);
        });
        test('substitute many', () => {
            if (platform.isWindows) {
                assert.strictEqual(configurationResolverService.resolve(workspace, '${workspaceFolder} - ${workspaceFolder}'), '\\VSCode\\workspaceLocation - \\VSCode\\workspaceLocation');
            }
            else {
                assert.strictEqual(configurationResolverService.resolve(workspace, '${workspaceFolder} - ${workspaceFolder}'), '/VSCode/workspaceLocation - /VSCode/workspaceLocation');
            }
        });
        test('substitute one env variable', () => {
            if (platform.isWindows) {
                assert.strictEqual(configurationResolverService.resolve(workspace, 'abc ${workspaceFolder} ${env:key1} xyz'), 'abc \\VSCode\\workspaceLocation Value for key1 xyz');
            }
            else {
                assert.strictEqual(configurationResolverService.resolve(workspace, 'abc ${workspaceFolder} ${env:key1} xyz'), 'abc /VSCode/workspaceLocation Value for key1 xyz');
            }
        });
        test('substitute many env variable', () => {
            if (platform.isWindows) {
                assert.strictEqual(configurationResolverService.resolve(workspace, '${workspaceFolder} - ${workspaceFolder} ${env:key1} - ${env:key2}'), '\\VSCode\\workspaceLocation - \\VSCode\\workspaceLocation Value for key1 - Value for key2');
            }
            else {
                assert.strictEqual(configurationResolverService.resolve(workspace, '${workspaceFolder} - ${workspaceFolder} ${env:key1} - ${env:key2}'), '/VSCode/workspaceLocation - /VSCode/workspaceLocation Value for key1 - Value for key2');
            }
        });
        // test('substitute keys and values in object', () => {
        // 	const myObject = {
        // 		'${workspaceRootFolderName}': '${lineNumber}',
        // 		'hey ${env:key1} ': '${workspaceRootFolderName}'
        // 	};
        // 	assert.deepEqual(configurationResolverService!.resolve(workspace, myObject), {
        // 		'workspaceLocation': `${editorService.mockLineNumber}`,
        // 		'hey Value for key1 ': 'workspaceLocation'
        // 	});
        // });
        test('substitute one env variable using platform case sensitivity', () => {
            if (platform.isWindows) {
                assert.strictEqual(configurationResolverService.resolve(workspace, '${env:key1} - ${env:Key1}'), 'Value for key1 - Value for key1');
            }
            else {
                assert.strictEqual(configurationResolverService.resolve(workspace, '${env:key1} - ${env:Key1}'), 'Value for key1 - ');
            }
        });
        test('substitute one configuration variable', () => {
            let configurationService = new MockConfigurationService({
                editor: {
                    fontFamily: 'foo'
                },
                terminal: {
                    integrated: {
                        fontFamily: 'bar'
                    }
                }
            });
            let service = new configurationResolverService_1.ConfigurationResolverService(new TestEditorServiceWithActiveEditor(), environmentService, configurationService, mockCommandService, new workbenchTestServices_1.TestContextService(), quickInputService);
            assert.strictEqual(service.resolve(workspace, 'abc ${config:editor.fontFamily} xyz'), 'abc foo xyz');
        });
        test('substitute many configuration variables', () => {
            let configurationService;
            configurationService = new MockConfigurationService({
                editor: {
                    fontFamily: 'foo'
                },
                terminal: {
                    integrated: {
                        fontFamily: 'bar'
                    }
                }
            });
            let service = new configurationResolverService_1.ConfigurationResolverService(new TestEditorServiceWithActiveEditor(), environmentService, configurationService, mockCommandService, new workbenchTestServices_1.TestContextService(), quickInputService);
            assert.strictEqual(service.resolve(workspace, 'abc ${config:editor.fontFamily} ${config:terminal.integrated.fontFamily} xyz'), 'abc foo bar xyz');
        });
        test('substitute one env variable and a configuration variable', () => {
            let configurationService;
            configurationService = new MockConfigurationService({
                editor: {
                    fontFamily: 'foo'
                },
                terminal: {
                    integrated: {
                        fontFamily: 'bar'
                    }
                }
            });
            let service = new configurationResolverService_1.ConfigurationResolverService(new TestEditorServiceWithActiveEditor(), environmentService, configurationService, mockCommandService, new workbenchTestServices_1.TestContextService(), quickInputService);
            if (platform.isWindows) {
                assert.strictEqual(service.resolve(workspace, 'abc ${config:editor.fontFamily} ${workspaceFolder} ${env:key1} xyz'), 'abc foo \\VSCode\\workspaceLocation Value for key1 xyz');
            }
            else {
                assert.strictEqual(service.resolve(workspace, 'abc ${config:editor.fontFamily} ${workspaceFolder} ${env:key1} xyz'), 'abc foo /VSCode/workspaceLocation Value for key1 xyz');
            }
        });
        test('substitute many env variable and a configuration variable', () => {
            let configurationService;
            configurationService = new MockConfigurationService({
                editor: {
                    fontFamily: 'foo'
                },
                terminal: {
                    integrated: {
                        fontFamily: 'bar'
                    }
                }
            });
            let service = new configurationResolverService_1.ConfigurationResolverService(new TestEditorServiceWithActiveEditor(), environmentService, configurationService, mockCommandService, new workbenchTestServices_1.TestContextService(), quickInputService);
            if (platform.isWindows) {
                assert.strictEqual(service.resolve(workspace, '${config:editor.fontFamily} ${config:terminal.integrated.fontFamily} ${workspaceFolder} - ${workspaceFolder} ${env:key1} - ${env:key2}'), 'foo bar \\VSCode\\workspaceLocation - \\VSCode\\workspaceLocation Value for key1 - Value for key2');
            }
            else {
                assert.strictEqual(service.resolve(workspace, '${config:editor.fontFamily} ${config:terminal.integrated.fontFamily} ${workspaceFolder} - ${workspaceFolder} ${env:key1} - ${env:key2}'), 'foo bar /VSCode/workspaceLocation - /VSCode/workspaceLocation Value for key1 - Value for key2');
            }
        });
        test('mixed types of configuration variables', () => {
            let configurationService;
            configurationService = new MockConfigurationService({
                editor: {
                    fontFamily: 'foo',
                    lineNumbers: 123,
                    insertSpaces: false
                },
                terminal: {
                    integrated: {
                        fontFamily: 'bar'
                    }
                },
                json: {
                    schemas: [
                        {
                            fileMatch: [
                                '/myfile',
                                '/myOtherfile'
                            ],
                            url: 'schemaURL'
                        }
                    ]
                }
            });
            let service = new configurationResolverService_1.ConfigurationResolverService(new TestEditorServiceWithActiveEditor(), environmentService, configurationService, mockCommandService, new workbenchTestServices_1.TestContextService(), quickInputService);
            assert.strictEqual(service.resolve(workspace, 'abc ${config:editor.fontFamily} ${config:editor.lineNumbers} ${config:editor.insertSpaces} xyz'), 'abc foo 123 false xyz');
        });
        test('uses original variable as fallback', () => {
            let configurationService;
            configurationService = new MockConfigurationService({
                editor: {}
            });
            let service = new configurationResolverService_1.ConfigurationResolverService(new TestEditorServiceWithActiveEditor(), environmentService, configurationService, mockCommandService, new workbenchTestServices_1.TestContextService(), quickInputService);
            assert.strictEqual(service.resolve(workspace, 'abc ${unknownVariable} xyz'), 'abc ${unknownVariable} xyz');
            assert.strictEqual(service.resolve(workspace, 'abc ${env:unknownVariable} xyz'), 'abc  xyz');
        });
        test('configuration variables with invalid accessor', () => {
            let configurationService;
            configurationService = new MockConfigurationService({
                editor: {
                    fontFamily: 'foo'
                }
            });
            let service = new configurationResolverService_1.ConfigurationResolverService(new TestEditorServiceWithActiveEditor(), environmentService, configurationService, mockCommandService, new workbenchTestServices_1.TestContextService(), quickInputService);
            assert.throws(() => service.resolve(workspace, 'abc ${env} xyz'));
            assert.throws(() => service.resolve(workspace, 'abc ${env:} xyz'));
            assert.throws(() => service.resolve(workspace, 'abc ${config} xyz'));
            assert.throws(() => service.resolve(workspace, 'abc ${config:} xyz'));
            assert.throws(() => service.resolve(workspace, 'abc ${config:editor} xyz'));
            assert.throws(() => service.resolve(workspace, 'abc ${config:editor..fontFamily} xyz'));
            assert.throws(() => service.resolve(workspace, 'abc ${config:editor.none.none2} xyz'));
        });
        test('a single command variable', () => {
            const configuration = {
                'name': 'Attach to Process',
                'type': 'node',
                'request': 'attach',
                'processId': '${command:command1}',
                'port': 5858,
                'sourceMaps': false,
                'outDir': null
            };
            return configurationResolverService.resolveWithInteractionReplace(undefined, configuration).then(result => {
                assert.deepEqual(result, {
                    'name': 'Attach to Process',
                    'type': 'node',
                    'request': 'attach',
                    'processId': 'command1-result',
                    'port': 5858,
                    'sourceMaps': false,
                    'outDir': null
                });
                assert.equal(1, mockCommandService.callCount);
            });
        });
        test('an old style command variable', () => {
            const configuration = {
                'name': 'Attach to Process',
                'type': 'node',
                'request': 'attach',
                'processId': '${command:commandVariable1}',
                'port': 5858,
                'sourceMaps': false,
                'outDir': null
            };
            const commandVariables = Object.create(null);
            commandVariables['commandVariable1'] = 'command1';
            return configurationResolverService.resolveWithInteractionReplace(undefined, configuration, undefined, commandVariables).then(result => {
                assert.deepEqual(result, {
                    'name': 'Attach to Process',
                    'type': 'node',
                    'request': 'attach',
                    'processId': 'command1-result',
                    'port': 5858,
                    'sourceMaps': false,
                    'outDir': null
                });
                assert.equal(1, mockCommandService.callCount);
            });
        });
        test('multiple new and old-style command variables', () => {
            const configuration = {
                'name': 'Attach to Process',
                'type': 'node',
                'request': 'attach',
                'processId': '${command:commandVariable1}',
                'pid': '${command:command2}',
                'sourceMaps': false,
                'outDir': 'src/${command:command2}',
                'env': {
                    'processId': '__${command:command2}__',
                }
            };
            const commandVariables = Object.create(null);
            commandVariables['commandVariable1'] = 'command1';
            return configurationResolverService.resolveWithInteractionReplace(undefined, configuration, undefined, commandVariables).then(result => {
                assert.deepEqual(result, {
                    'name': 'Attach to Process',
                    'type': 'node',
                    'request': 'attach',
                    'processId': 'command1-result',
                    'pid': 'command2-result',
                    'sourceMaps': false,
                    'outDir': 'src/command2-result',
                    'env': {
                        'processId': '__command2-result__',
                    }
                });
                assert.equal(2, mockCommandService.callCount);
            });
        });
        test('a command variable that relies on resolved env vars', () => {
            const configuration = {
                'name': 'Attach to Process',
                'type': 'node',
                'request': 'attach',
                'processId': '${command:commandVariable1}',
                'value': '${env:key1}'
            };
            const commandVariables = Object.create(null);
            commandVariables['commandVariable1'] = 'command1';
            return configurationResolverService.resolveWithInteractionReplace(undefined, configuration, undefined, commandVariables).then(result => {
                assert.deepEqual(result, {
                    'name': 'Attach to Process',
                    'type': 'node',
                    'request': 'attach',
                    'processId': 'Value for key1',
                    'value': 'Value for key1'
                });
                assert.equal(1, mockCommandService.callCount);
            });
        });
        test('a single prompt input variable', () => {
            const configuration = {
                'name': 'Attach to Process',
                'type': 'node',
                'request': 'attach',
                'processId': '${input:input1}',
                'port': 5858,
                'sourceMaps': false,
                'outDir': null
            };
            return configurationResolverService.resolveWithInteractionReplace(workspace, configuration, 'tasks').then(result => {
                assert.deepEqual(result, {
                    'name': 'Attach to Process',
                    'type': 'node',
                    'request': 'attach',
                    'processId': 'resolvedEnterinput1',
                    'port': 5858,
                    'sourceMaps': false,
                    'outDir': null
                });
                assert.equal(0, mockCommandService.callCount);
            });
        });
        test('a single pick input variable', () => {
            const configuration = {
                'name': 'Attach to Process',
                'type': 'node',
                'request': 'attach',
                'processId': '${input:input2}',
                'port': 5858,
                'sourceMaps': false,
                'outDir': null
            };
            return configurationResolverService.resolveWithInteractionReplace(workspace, configuration, 'tasks').then(result => {
                assert.deepEqual(result, {
                    'name': 'Attach to Process',
                    'type': 'node',
                    'request': 'attach',
                    'processId': 'selectedPick',
                    'port': 5858,
                    'sourceMaps': false,
                    'outDir': null
                });
                assert.equal(0, mockCommandService.callCount);
            });
        });
        test('a single command input variable', () => {
            const configuration = {
                'name': 'Attach to Process',
                'type': 'node',
                'request': 'attach',
                'processId': '${input:input4}',
                'port': 5858,
                'sourceMaps': false,
                'outDir': null
            };
            return configurationResolverService.resolveWithInteractionReplace(workspace, configuration, 'tasks').then(result => {
                assert.deepEqual(result, {
                    'name': 'Attach to Process',
                    'type': 'node',
                    'request': 'attach',
                    'processId': 'arg for command',
                    'port': 5858,
                    'sourceMaps': false,
                    'outDir': null
                });
                assert.equal(1, mockCommandService.callCount);
            });
        });
        test('several input variables and command', () => {
            const configuration = {
                'name': '${input:input3}',
                'type': '${command:command1}',
                'request': '${input:input1}',
                'processId': '${input:input2}',
                'command': '${input:input4}',
                'port': 5858,
                'sourceMaps': false,
                'outDir': null
            };
            return configurationResolverService.resolveWithInteractionReplace(workspace, configuration, 'tasks').then(result => {
                assert.deepEqual(result, {
                    'name': 'resolvedEnterinput3',
                    'type': 'command1-result',
                    'request': 'resolvedEnterinput1',
                    'processId': 'selectedPick',
                    'command': 'arg for command',
                    'port': 5858,
                    'sourceMaps': false,
                    'outDir': null
                });
                assert.equal(2, mockCommandService.callCount);
            });
        });
        test('contributed variable', () => {
            const buildTask = 'npm: compile';
            const variable = 'defaultBuildTask';
            const configuration = {
                'name': '${' + variable + '}',
            };
            configurationResolverService.contributeVariable(variable, async () => { return buildTask; });
            return configurationResolverService.resolveWithInteractionReplace(workspace, configuration).then(result => {
                assert.deepEqual(result, {
                    'name': `${buildTask}`
                });
            });
        });
    });
    class MockConfigurationService {
        constructor(configuration = {}) {
            this.configuration = configuration;
            this.serviceId = configuration_1.IConfigurationService;
        }
        inspect(key, overrides) { return { value: configuration_1.getConfigurationValue(this.getValue(), key), default: configuration_1.getConfigurationValue(this.getValue(), key), user: configuration_1.getConfigurationValue(this.getValue(), key), workspaceFolder: undefined, folder: undefined }; }
        keys() { return { default: [], user: [], workspace: [], workspaceFolder: [] }; }
        getValue(value) {
            if (!value) {
                return this.configuration;
            }
            const valuePath = value.split('.');
            let object = this.configuration;
            while (valuePath.length && object) {
                object = object[valuePath.shift()];
            }
            return object;
        }
        updateValue() { return Promise.resolve(); }
        getConfigurationData() { return null; }
        onDidChangeConfiguration() { return { dispose() { } }; }
        reloadConfiguration() { return Promise.resolve(); }
    }
    class MockCommandService {
        constructor() {
            this.callCount = 0;
            this.onWillExecuteCommand = () => lifecycle_1.Disposable.None;
            this.onDidExecuteCommand = () => lifecycle_1.Disposable.None;
        }
        executeCommand(commandId, ...args) {
            this.callCount++;
            let result = `${commandId}-result`;
            if (args.length >= 1) {
                if (args[0] && args[0].value) {
                    result = args[0].value;
                }
            }
            return Promise.resolve(result);
        }
    }
    class MockQuickInputService {
        pick(picks, options, token) {
            if (Types.isArray(picks)) {
                return Promise.resolve({ label: 'selectedPick', description: 'pick description' });
            }
            else {
                return Promise.resolve(undefined);
            }
        }
        input(options, token) {
            return Promise.resolve(options ? 'resolved' + options.prompt : 'resolved');
        }
        createQuickPick() {
            throw new Error('not implemented.');
        }
        createInputBox() {
            throw new Error('not implemented.');
        }
        focus() {
            throw new Error('not implemented.');
        }
        toggle() {
            throw new Error('not implemented.');
        }
        navigate(next, quickNavigate) {
            throw new Error('not implemented.');
        }
        accept() {
            throw new Error('not implemented.');
        }
        back() {
            throw new Error('not implemented.');
        }
        cancel() {
            throw new Error('not implemented.');
        }
    }
    class MockInputsConfigurationService extends testConfigurationService_1.TestConfigurationService {
        getValue(arg1, arg2) {
            let configuration;
            if (arg1 === 'tasks') {
                configuration = {
                    inputs: [
                        {
                            id: 'input1',
                            type: 'promptString',
                            description: 'Enterinput1',
                            default: 'default input1'
                        },
                        {
                            id: 'input2',
                            type: 'pickString',
                            description: 'Enterinput1',
                            default: 'option2',
                            options: ['option1', 'option2', 'option3']
                        },
                        {
                            id: 'input3',
                            type: 'promptString',
                            description: 'Enterinput3',
                            default: 'default input3'
                        },
                        {
                            id: 'input4',
                            type: 'command',
                            command: 'command1',
                            args: {
                                value: 'arg for command'
                            }
                        }
                    ]
                };
            }
            return configuration;
        }
    }
    class MockWorkbenchEnvironmentService extends environmentService_1.WorkbenchEnvironmentService {
        constructor(env) {
            super({ userEnv: env }, process.execPath, 0);
        }
    }
});
//# sourceMappingURL=configurationResolverService.test.js.map