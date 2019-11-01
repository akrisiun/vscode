/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/path", "vs/base/common/platform", "vs/workbench/contrib/debug/common/debugger", "vs/platform/configuration/test/common/testConfigurationService", "vs/base/common/uri", "vs/workbench/contrib/debug/node/debugAdapter", "vs/workbench/test/workbenchTestServices", "vs/platform/extensions/common/extensions"], function (require, exports, assert, path_1, platform, debugger_1, testConfigurationService_1, uri_1, debugAdapter_1, workbenchTestServices_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Debug - Debugger', () => {
        let _debugger;
        const extensionFolderPath = '/a/b/c/';
        const debuggerContribution = {
            type: 'mock',
            label: 'Mock Debug',
            enableBreakpointsFor: { 'languageIds': ['markdown'] },
            program: './out/mock/mockDebug.js',
            args: ['arg1', 'arg2'],
            configurationAttributes: {
                launch: {
                    required: ['program'],
                    properties: {
                        program: {
                            'type': 'string',
                            'description': 'Workspace relative path to a text file.',
                            'default': 'readme.md'
                        }
                    }
                }
            },
            variables: null,
            initialConfigurations: [
                {
                    name: 'Mock-Debug',
                    type: 'mock',
                    request: 'launch',
                    program: 'readme.md'
                }
            ]
        };
        const extensionDescriptor0 = {
            id: 'adapter',
            identifier: new extensions_1.ExtensionIdentifier('adapter'),
            name: 'myAdapter',
            version: '1.0.0',
            publisher: 'vscode',
            extensionLocation: uri_1.URI.file(extensionFolderPath),
            isBuiltin: false,
            isUnderDevelopment: false,
            engines: null,
            contributes: {
                'debuggers': [
                    debuggerContribution
                ]
            }
        };
        const extensionDescriptor1 = {
            id: 'extension1',
            identifier: new extensions_1.ExtensionIdentifier('extension1'),
            name: 'extension1',
            version: '1.0.0',
            publisher: 'vscode',
            extensionLocation: uri_1.URI.file('/e1/b/c/'),
            isBuiltin: false,
            isUnderDevelopment: false,
            engines: null,
            contributes: {
                'debuggers': [
                    {
                        type: 'mock',
                        runtime: 'runtime',
                        runtimeArgs: ['rarg'],
                        program: 'mockprogram',
                        args: ['parg']
                    }
                ]
            }
        };
        const extensionDescriptor2 = {
            id: 'extension2',
            identifier: new extensions_1.ExtensionIdentifier('extension2'),
            name: 'extension2',
            version: '1.0.0',
            publisher: 'vscode',
            extensionLocation: uri_1.URI.file('/e2/b/c/'),
            isBuiltin: false,
            isUnderDevelopment: false,
            engines: null,
            contributes: {
                'debuggers': [
                    {
                        type: 'mock',
                        win: {
                            runtime: 'winRuntime',
                            program: 'winProgram'
                        },
                        linux: {
                            runtime: 'linuxRuntime',
                            program: 'linuxProgram'
                        },
                        osx: {
                            runtime: 'osxRuntime',
                            program: 'osxProgram'
                        }
                    }
                ]
            }
        };
        const configurationManager = {
            getDebugAdapterDescriptor(session, config) {
                return Promise.resolve(undefined);
            }
        };
        const configurationService = new testConfigurationService_1.TestConfigurationService();
        const testResourcePropertiesService = new workbenchTestServices_1.TestTextResourcePropertiesService(configurationService);
        setup(() => {
            _debugger = new debugger_1.Debugger(configurationManager, debuggerContribution, extensionDescriptor0, configurationService, testResourcePropertiesService, undefined, undefined, undefined);
        });
        teardown(() => {
            _debugger = null;
        });
        test('attributes', () => {
            assert.equal(_debugger.type, debuggerContribution.type);
            assert.equal(_debugger.label, debuggerContribution.label);
            const ae = debugAdapter_1.ExecutableDebugAdapter.platformAdapterExecutable([extensionDescriptor0], 'mock');
            assert.equal(ae.command, path_1.join(extensionFolderPath, debuggerContribution.program));
            assert.deepEqual(ae.args, debuggerContribution.args);
        });
        test('schema attributes', () => {
            const schemaAttribute = _debugger.getSchemaAttributes()[0];
            assert.notDeepEqual(schemaAttribute, debuggerContribution.configurationAttributes);
            Object.keys(debuggerContribution.configurationAttributes.launch).forEach(key => {
                assert.deepEqual(schemaAttribute[key], debuggerContribution.configurationAttributes.launch[key]);
            });
            assert.equal(schemaAttribute['additionalProperties'], false);
            assert.equal(!!schemaAttribute['properties']['request'], true);
            assert.equal(!!schemaAttribute['properties']['name'], true);
            assert.equal(!!schemaAttribute['properties']['type'], true);
            assert.equal(!!schemaAttribute['properties']['preLaunchTask'], true);
        });
        test('merge platform specific attributes', () => {
            const ae = debugAdapter_1.ExecutableDebugAdapter.platformAdapterExecutable([extensionDescriptor1, extensionDescriptor2], 'mock');
            assert.equal(ae.command, platform.isLinux ? 'linuxRuntime' : (platform.isMacintosh ? 'osxRuntime' : 'winRuntime'));
            const xprogram = platform.isLinux ? 'linuxProgram' : (platform.isMacintosh ? 'osxProgram' : 'winProgram');
            assert.deepEqual(ae.args, ['rarg', path_1.normalize('/e2/b/c/') + xprogram, 'parg']);
        });
        test('initial config file content', () => {
            const expected = ['{',
                '	// Use IntelliSense to learn about possible attributes.',
                '	// Hover to view descriptions of existing attributes.',
                '	// For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387',
                '	"version": "0.2.0",',
                '	"configurations": [',
                '		{',
                '			"name": "Mock-Debug",',
                '			"type": "mock",',
                '			"request": "launch",',
                '			"program": "readme.md"',
                '		}',
                '	]',
                '}'].join(testResourcePropertiesService.getEOL(uri_1.URI.file('somefile')));
            return _debugger.getInitialConfigurationContent().then(content => {
                assert.equal(content, expected);
            }, err => assert.fail(err));
        });
    });
});
//# sourceMappingURL=debugger.test.js.map