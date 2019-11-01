/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "sinon", "assert", "os", "vs/base/common/path", "fs", "vs/base/common/json", "vs/platform/registry/common/platform", "vs/platform/environment/common/environment", "vs/platform/environment/node/argv", "vs/platform/workspace/common/workspace", "vs/workbench/test/workbenchTestServices", "vs/base/common/uuid", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/services/configuration/browser/configurationService", "vs/workbench/services/configuration/common/configurationEditingService", "vs/workbench/services/configuration/common/configuration", "vs/platform/configuration/common/configuration", "vs/workbench/services/textfile/common/textfiles", "vs/editor/common/services/resolverService", "vs/workbench/services/textmodelResolver/common/textModelResolverService", "vs/base/node/pfs", "vs/platform/notification/common/notification", "vs/platform/commands/common/commands", "vs/workbench/services/commands/common/commandService", "vs/base/common/uri", "crypto", "vs/workbench/services/remote/electron-browser/remoteAgentServiceImpl", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/base/common/network", "vs/platform/files/node/diskFileSystemProvider", "vs/platform/files/common/files", "vs/workbench/services/configuration/node/configurationCache", "vs/workbench/services/keybinding/common/keybindingEditing", "vs/workbench/services/environment/node/environmentService", "vs/workbench/services/userData/common/fileUserDataProvider"], function (require, exports, sinon, assert, os, path, fs, json, platform_1, environment_1, argv_1, workspace_1, workbenchTestServices_1, uuid, configurationRegistry_1, configurationService_1, configurationEditingService_1, configuration_1, configuration_2, textfiles_1, resolverService_1, textModelResolverService_1, pfs_1, notification_1, commands_1, commandService_1, uri_1, crypto_1, remoteAgentServiceImpl_1, remoteAgentService_1, fileService_1, log_1, network_1, diskFileSystemProvider_1, files_1, configurationCache_1, keybindingEditing_1, environmentService_1, fileUserDataProvider_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestEnvironmentService extends environmentService_1.WorkbenchEnvironmentService {
        constructor(_appSettingsHome) {
            super(argv_1.parseArgs(process.argv, argv_1.OPTIONS), process.execPath, 0);
            this._appSettingsHome = _appSettingsHome;
        }
        get appSettingsHome() { return this._appSettingsHome; }
    }
    suite('ConfigurationEditingService', () => {
        let instantiationService;
        let testObject;
        let parentDir;
        let workspaceDir;
        let globalSettingsFile;
        let workspaceSettingsDir;
        suiteSetup(() => {
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationEditing.service.testSetting': {
                        'type': 'string',
                        'default': 'isSet'
                    },
                    'configurationEditing.service.testSettingTwo': {
                        'type': 'string',
                        'default': 'isSet'
                    },
                    'configurationEditing.service.testSettingThree': {
                        'type': 'string',
                        'default': 'isSet'
                    }
                }
            });
        });
        setup(() => {
            return setUpWorkspace()
                .then(() => setUpServices());
        });
        async function setUpWorkspace() {
            const id = uuid.generateUuid();
            parentDir = path.join(os.tmpdir(), 'vsctests', id);
            workspaceDir = path.join(parentDir, 'workspaceconfig', id);
            globalSettingsFile = path.join(workspaceDir, 'settings.json');
            workspaceSettingsDir = path.join(workspaceDir, '.vscode');
            return await pfs_1.mkdirp(workspaceSettingsDir, 493);
        }
        function setUpServices(noWorkspace = false) {
            // Clear services if they are already created
            clearServices();
            instantiationService = workbenchTestServices_1.workbenchInstantiationService();
            const environmentService = new TestEnvironmentService(uri_1.URI.file(workspaceDir));
            instantiationService.stub(environment_1.IEnvironmentService, environmentService);
            const remoteAgentService = instantiationService.createInstance(remoteAgentServiceImpl_1.RemoteAgentService, {});
            const fileService = new fileService_1.FileService(new log_1.NullLogService());
            const diskFileSystemProvider = new diskFileSystemProvider_1.DiskFileSystemProvider(new log_1.NullLogService());
            fileService.registerProvider(network_1.Schemas.file, diskFileSystemProvider);
            fileService.registerProvider(network_1.Schemas.userData, new fileUserDataProvider_1.FileUserDataProvider(environmentService.appSettingsHome, environmentService.backupHome, diskFileSystemProvider, environmentService));
            instantiationService.stub(files_1.IFileService, fileService);
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, remoteAgentService);
            const workspaceService = new configurationService_1.WorkspaceService({ configurationCache: new configurationCache_1.ConfigurationCache(environmentService) }, environmentService, fileService, remoteAgentService);
            instantiationService.stub(workspace_1.IWorkspaceContextService, workspaceService);
            return workspaceService.initialize(noWorkspace ? { id: '' } : { folder: uri_1.URI.file(workspaceDir), id: crypto_1.createHash('md5').update(uri_1.URI.file(workspaceDir).toString()).digest('hex') }).then(() => {
                instantiationService.stub(configuration_2.IConfigurationService, workspaceService);
                instantiationService.stub(keybindingEditing_1.IKeybindingEditingService, instantiationService.createInstance(keybindingEditing_1.KeybindingsEditingService));
                instantiationService.stub(textfiles_1.ITextFileService, instantiationService.createInstance(workbenchTestServices_1.TestTextFileService));
                instantiationService.stub(resolverService_1.ITextModelService, instantiationService.createInstance(textModelResolverService_1.TextModelResolverService));
                instantiationService.stub(commands_1.ICommandService, commandService_1.CommandService);
                testObject = instantiationService.createInstance(configurationEditingService_1.ConfigurationEditingService);
            });
        }
        teardown(() => {
            clearServices();
            if (workspaceDir) {
                return pfs_1.rimraf(workspaceDir, pfs_1.RimRafMode.MOVE);
            }
            return undefined;
        });
        function clearServices() {
            if (instantiationService) {
                const configuraitonService = instantiationService.get(configuration_2.IConfigurationService);
                if (configuraitonService) {
                    configuraitonService.dispose();
                }
                instantiationService = null;
            }
        }
        test('errors cases - invalid key', () => {
            return testObject.writeConfiguration(3 /* WORKSPACE */, { key: 'unknown.key', value: 'value' })
                .then(() => assert.fail('Should fail with ERROR_UNKNOWN_KEY'), (error) => assert.equal(error.code, 0 /* ERROR_UNKNOWN_KEY */));
        });
        test('errors cases - invalid target', () => {
            return testObject.writeConfiguration(1 /* USER_LOCAL */, { key: 'tasks.something', value: 'value' })
                .then(() => assert.fail('Should fail with ERROR_INVALID_TARGET'), (error) => assert.equal(error.code, 4 /* ERROR_INVALID_USER_TARGET */));
        });
        test('errors cases - no workspace', () => {
            return setUpServices(true)
                .then(() => testObject.writeConfiguration(3 /* WORKSPACE */, { key: 'configurationEditing.service.testSetting', value: 'value' }))
                .then(() => assert.fail('Should fail with ERROR_NO_WORKSPACE_OPENED'), (error) => assert.equal(error.code, 7 /* ERROR_NO_WORKSPACE_OPENED */));
        });
        test('errors cases - invalid configuration', () => {
            fs.writeFileSync(globalSettingsFile, ',,,,,,,,,,,,,,');
            return testObject.writeConfiguration(1 /* USER_LOCAL */, { key: 'configurationEditing.service.testSetting', value: 'value' })
                .then(() => assert.fail('Should fail with ERROR_INVALID_CONFIGURATION'), (error) => assert.equal(error.code, 9 /* ERROR_INVALID_CONFIGURATION */));
        });
        test('errors cases - dirty', () => {
            instantiationService.stub(textfiles_1.ITextFileService, 'isDirty', true);
            return testObject.writeConfiguration(1 /* USER_LOCAL */, { key: 'configurationEditing.service.testSetting', value: 'value' })
                .then(() => assert.fail('Should fail with ERROR_CONFIGURATION_FILE_DIRTY error.'), (error) => assert.equal(error.code, 8 /* ERROR_CONFIGURATION_FILE_DIRTY */));
        });
        test('dirty error is not thrown if not asked to save', () => {
            instantiationService.stub(textfiles_1.ITextFileService, 'isDirty', true);
            return testObject.writeConfiguration(1 /* USER_LOCAL */, { key: 'configurationEditing.service.testSetting', value: 'value' }, { donotSave: true })
                .then(() => null, error => assert.fail('Should not fail.'));
        });
        test('do not notify error', () => {
            instantiationService.stub(textfiles_1.ITextFileService, 'isDirty', true);
            const target = sinon.stub();
            instantiationService.stub(notification_1.INotificationService, { prompt: target, _serviceBrand: undefined, notify: null, error: null, info: null, warn: null, status: null });
            return testObject.writeConfiguration(1 /* USER_LOCAL */, { key: 'configurationEditing.service.testSetting', value: 'value' }, { donotNotifyError: true })
                .then(() => assert.fail('Should fail with ERROR_CONFIGURATION_FILE_DIRTY error.'), (error) => {
                assert.equal(false, target.calledOnce);
                assert.equal(error.code, 8 /* ERROR_CONFIGURATION_FILE_DIRTY */);
            });
        });
        test('write one setting - empty file', () => {
            return testObject.writeConfiguration(1 /* USER_LOCAL */, { key: 'configurationEditing.service.testSetting', value: 'value' })
                .then(() => {
                const contents = fs.readFileSync(globalSettingsFile).toString('utf8');
                const parsed = json.parse(contents);
                assert.equal(parsed['configurationEditing.service.testSetting'], 'value');
            });
        });
        test('write one setting - existing file', () => {
            fs.writeFileSync(globalSettingsFile, '{ "my.super.setting": "my.super.value" }');
            return testObject.writeConfiguration(1 /* USER_LOCAL */, { key: 'configurationEditing.service.testSetting', value: 'value' })
                .then(() => {
                const contents = fs.readFileSync(globalSettingsFile).toString('utf8');
                const parsed = json.parse(contents);
                assert.equal(parsed['configurationEditing.service.testSetting'], 'value');
                assert.equal(parsed['my.super.setting'], 'my.super.value');
            });
        });
        test('remove an existing setting - existing file', () => {
            fs.writeFileSync(globalSettingsFile, '{ "my.super.setting": "my.super.value", "configurationEditing.service.testSetting": "value" }');
            return testObject.writeConfiguration(1 /* USER_LOCAL */, { key: 'configurationEditing.service.testSetting', value: undefined })
                .then(() => {
                const contents = fs.readFileSync(globalSettingsFile).toString('utf8');
                const parsed = json.parse(contents);
                assert.deepEqual(Object.keys(parsed), ['my.super.setting']);
                assert.equal(parsed['my.super.setting'], 'my.super.value');
            });
        });
        test('remove non existing setting - existing file', () => {
            fs.writeFileSync(globalSettingsFile, '{ "my.super.setting": "my.super.value" }');
            return testObject.writeConfiguration(1 /* USER_LOCAL */, { key: 'configurationEditing.service.testSetting', value: undefined })
                .then(() => {
                const contents = fs.readFileSync(globalSettingsFile).toString('utf8');
                const parsed = json.parse(contents);
                assert.deepEqual(Object.keys(parsed), ['my.super.setting']);
                assert.equal(parsed['my.super.setting'], 'my.super.value');
            });
        });
        test('write workspace standalone setting - empty file', () => {
            return testObject.writeConfiguration(3 /* WORKSPACE */, { key: 'tasks.service.testSetting', value: 'value' })
                .then(() => {
                const target = path.join(workspaceDir, configuration_1.WORKSPACE_STANDALONE_CONFIGURATIONS['tasks']);
                const contents = fs.readFileSync(target).toString('utf8');
                const parsed = json.parse(contents);
                assert.equal(parsed['service.testSetting'], 'value');
            });
        });
        test('write workspace standalone setting - existing file', () => {
            const target = path.join(workspaceDir, configuration_1.WORKSPACE_STANDALONE_CONFIGURATIONS['launch']);
            fs.writeFileSync(target, '{ "my.super.setting": "my.super.value" }');
            return testObject.writeConfiguration(3 /* WORKSPACE */, { key: 'launch.service.testSetting', value: 'value' })
                .then(() => {
                const contents = fs.readFileSync(target).toString('utf8');
                const parsed = json.parse(contents);
                assert.equal(parsed['service.testSetting'], 'value');
                assert.equal(parsed['my.super.setting'], 'my.super.value');
            });
        });
        test('write workspace standalone setting - empty file - full JSON', () => {
            return testObject.writeConfiguration(3 /* WORKSPACE */, { key: 'tasks', value: { 'version': '1.0.0', tasks: [{ 'taskName': 'myTask' }] } })
                .then(() => {
                const target = path.join(workspaceDir, configuration_1.WORKSPACE_STANDALONE_CONFIGURATIONS['tasks']);
                const contents = fs.readFileSync(target).toString('utf8');
                const parsed = json.parse(contents);
                assert.equal(parsed['version'], '1.0.0');
                assert.equal(parsed['tasks'][0]['taskName'], 'myTask');
            });
        });
        test('write workspace standalone setting - existing file - full JSON', () => {
            const target = path.join(workspaceDir, configuration_1.WORKSPACE_STANDALONE_CONFIGURATIONS['tasks']);
            fs.writeFileSync(target, '{ "my.super.setting": "my.super.value" }');
            return testObject.writeConfiguration(3 /* WORKSPACE */, { key: 'tasks', value: { 'version': '1.0.0', tasks: [{ 'taskName': 'myTask' }] } })
                .then(() => {
                const contents = fs.readFileSync(target).toString('utf8');
                const parsed = json.parse(contents);
                assert.equal(parsed['version'], '1.0.0');
                assert.equal(parsed['tasks'][0]['taskName'], 'myTask');
            });
        });
        test('write workspace standalone setting - existing file with JSON errors - full JSON', () => {
            const target = path.join(workspaceDir, configuration_1.WORKSPACE_STANDALONE_CONFIGURATIONS['tasks']);
            fs.writeFileSync(target, '{ "my.super.setting": '); // invalid JSON
            return testObject.writeConfiguration(3 /* WORKSPACE */, { key: 'tasks', value: { 'version': '1.0.0', tasks: [{ 'taskName': 'myTask' }] } })
                .then(() => {
                const contents = fs.readFileSync(target).toString('utf8');
                const parsed = json.parse(contents);
                assert.equal(parsed['version'], '1.0.0');
                assert.equal(parsed['tasks'][0]['taskName'], 'myTask');
            });
        });
        test('write workspace standalone setting should replace complete file', () => {
            const target = path.join(workspaceDir, configuration_1.WORKSPACE_STANDALONE_CONFIGURATIONS['tasks']);
            fs.writeFileSync(target, `{
			"version": "1.0.0",
			"tasks": [
				{
					"taskName": "myTask1"
				},
				{
					"taskName": "myTask2"
				}
			]
		}`);
            return testObject.writeConfiguration(3 /* WORKSPACE */, { key: 'tasks', value: { 'version': '1.0.0', tasks: [{ 'taskName': 'myTask1' }] } })
                .then(() => {
                const actual = fs.readFileSync(target).toString('utf8');
                const expected = JSON.stringify({ 'version': '1.0.0', tasks: [{ 'taskName': 'myTask1' }] }, null, '\t');
                assert.equal(actual, expected);
            });
        });
    });
});
//# sourceMappingURL=configurationEditingService.test.js.map