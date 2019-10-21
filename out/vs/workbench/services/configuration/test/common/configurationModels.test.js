define(["require", "exports", "assert", "vs/base/common/path", "vs/platform/registry/common/platform", "vs/workbench/services/configuration/common/configurationModels", "vs/platform/workspace/common/workspace", "vs/base/common/uri", "vs/platform/configuration/common/configurationModels", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/map"], function (require, exports, assert, path_1, platform_1, configurationModels_1, workspace_1, uri_1, configurationModels_2, configurationRegistry_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('FolderSettingsModelParser', () => {
        suiteSetup(() => {
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            configurationRegistry.registerConfiguration({
                'id': 'FolderSettingsModelParser_1',
                'type': 'object',
                'properties': {
                    'FolderSettingsModelParser.window': {
                        'type': 'string',
                        'default': 'isSet'
                    },
                    'FolderSettingsModelParser.resource': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 4 /* RESOURCE */,
                        overridable: true
                    },
                    'FolderSettingsModelParser.application': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* APPLICATION */
                    },
                    'FolderSettingsModelParser.machine': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 2 /* MACHINE */
                    }
                }
            });
        });
        test('parse all folder settings', () => {
            const testObject = new configurationModels_2.ConfigurationModelParser('settings', [4 /* RESOURCE */, 3 /* WINDOW */]);
            testObject.parseContent(JSON.stringify({ 'FolderSettingsModelParser.window': 'window', 'FolderSettingsModelParser.resource': 'resource', 'FolderSettingsModelParser.application': 'application', 'FolderSettingsModelParser.machine': 'executable' }));
            assert.deepEqual(testObject.configurationModel.contents, { 'FolderSettingsModelParser': { 'window': 'window', 'resource': 'resource' } });
        });
        test('parse resource folder settings', () => {
            const testObject = new configurationModels_2.ConfigurationModelParser('settings', [4 /* RESOURCE */]);
            testObject.parseContent(JSON.stringify({ 'FolderSettingsModelParser.window': 'window', 'FolderSettingsModelParser.resource': 'resource', 'FolderSettingsModelParser.application': 'application', 'FolderSettingsModelParser.machine': 'executable' }));
            assert.deepEqual(testObject.configurationModel.contents, { 'FolderSettingsModelParser': { 'resource': 'resource' } });
        });
        test('parse overridable resource settings', () => {
            const testObject = new configurationModels_2.ConfigurationModelParser('settings', [4 /* RESOURCE */]);
            testObject.parseContent(JSON.stringify({ '[json]': { 'FolderSettingsModelParser.window': 'window', 'FolderSettingsModelParser.resource': 'resource', 'FolderSettingsModelParser.application': 'application', 'FolderSettingsModelParser.machine': 'executable' } }));
            assert.deepEqual(testObject.configurationModel.overrides, [{ 'contents': { 'FolderSettingsModelParser': { 'resource': 'resource' } }, 'identifiers': ['json'] }]);
        });
        test('reprocess folder settings excludes application and machine setting', () => {
            const testObject = new configurationModels_2.ConfigurationModelParser('settings', [4 /* RESOURCE */, 3 /* WINDOW */]);
            testObject.parseContent(JSON.stringify({ 'FolderSettingsModelParser.resource': 'resource', 'FolderSettingsModelParser.anotherApplicationSetting': 'executable' }));
            assert.deepEqual(testObject.configurationModel.contents, { 'FolderSettingsModelParser': { 'resource': 'resource', 'anotherApplicationSetting': 'executable' } });
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            configurationRegistry.registerConfiguration({
                'id': 'FolderSettingsModelParser_2',
                'type': 'object',
                'properties': {
                    'FolderSettingsModelParser.anotherApplicationSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* APPLICATION */
                    },
                    'FolderSettingsModelParser.anotherMachineSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 2 /* MACHINE */
                    }
                }
            });
            testObject.parse();
            assert.deepEqual(testObject.configurationModel.contents, { 'FolderSettingsModelParser': { 'resource': 'resource' } });
        });
    });
    suite('StandaloneConfigurationModelParser', () => {
        test('parse tasks stand alone configuration model', () => {
            const testObject = new configurationModels_1.StandaloneConfigurationModelParser('tasks', 'tasks');
            testObject.parseContent(JSON.stringify({ 'version': '1.1.1', 'tasks': [] }));
            assert.deepEqual(testObject.configurationModel.contents, { 'tasks': { 'version': '1.1.1', 'tasks': [] } });
        });
    });
    suite('WorkspaceConfigurationChangeEvent', () => {
        test('changeEvent affecting workspace folders', () => {
            let configurationChangeEvent = new configurationModels_2.ConfigurationChangeEvent();
            configurationChangeEvent.change(['window.title']);
            configurationChangeEvent.change(['window.zoomLevel'], uri_1.URI.file('folder1'));
            configurationChangeEvent.change(['workbench.editor.enablePreview'], uri_1.URI.file('folder2'));
            configurationChangeEvent.change(['window.restoreFullscreen'], uri_1.URI.file('folder1'));
            configurationChangeEvent.change(['window.restoreWindows'], uri_1.URI.file('folder2'));
            configurationChangeEvent.telemetryData(4 /* WORKSPACE */, {});
            let testObject = new configurationModels_1.WorkspaceConfigurationChangeEvent(configurationChangeEvent, new workspace_1.Workspace('id', [new workspace_1.WorkspaceFolder({ index: 0, name: '1', uri: uri_1.URI.file('folder1') }),
                new workspace_1.WorkspaceFolder({ index: 1, name: '2', uri: uri_1.URI.file('folder2') }),
                new workspace_1.WorkspaceFolder({ index: 2, name: '3', uri: uri_1.URI.file('folder3') })]));
            assert.deepEqual(testObject.affectedKeys, ['window.title', 'window.zoomLevel', 'window.restoreFullscreen', 'workbench.editor.enablePreview', 'window.restoreWindows']);
            assert.equal(testObject.source, 4 /* WORKSPACE */);
            assert.ok(testObject.affectsConfiguration('window.zoomLevel'));
            assert.ok(testObject.affectsConfiguration('window.zoomLevel', uri_1.URI.file('folder1')));
            assert.ok(testObject.affectsConfiguration('window.zoomLevel', uri_1.URI.file(path_1.join('folder1', 'file1'))));
            assert.ok(!testObject.affectsConfiguration('window.zoomLevel', uri_1.URI.file('file1')));
            assert.ok(!testObject.affectsConfiguration('window.zoomLevel', uri_1.URI.file('file2')));
            assert.ok(!testObject.affectsConfiguration('window.zoomLevel', uri_1.URI.file(path_1.join('folder2', 'file2'))));
            assert.ok(!testObject.affectsConfiguration('window.zoomLevel', uri_1.URI.file(path_1.join('folder3', 'file3'))));
            assert.ok(testObject.affectsConfiguration('window.restoreFullscreen'));
            assert.ok(testObject.affectsConfiguration('window.restoreFullscreen', uri_1.URI.file(path_1.join('folder1', 'file1'))));
            assert.ok(testObject.affectsConfiguration('window.restoreFullscreen', uri_1.URI.file('folder1')));
            assert.ok(!testObject.affectsConfiguration('window.restoreFullscreen', uri_1.URI.file('file1')));
            assert.ok(!testObject.affectsConfiguration('window.restoreFullscreen', uri_1.URI.file('file2')));
            assert.ok(!testObject.affectsConfiguration('window.restoreFullscreen', uri_1.URI.file(path_1.join('folder2', 'file2'))));
            assert.ok(!testObject.affectsConfiguration('window.restoreFullscreen', uri_1.URI.file(path_1.join('folder3', 'file3'))));
            assert.ok(testObject.affectsConfiguration('window.restoreWindows'));
            assert.ok(testObject.affectsConfiguration('window.restoreWindows', uri_1.URI.file('folder2')));
            assert.ok(testObject.affectsConfiguration('window.restoreWindows', uri_1.URI.file(path_1.join('folder2', 'file2'))));
            assert.ok(!testObject.affectsConfiguration('window.restoreWindows', uri_1.URI.file('file2')));
            assert.ok(!testObject.affectsConfiguration('window.restoreWindows', uri_1.URI.file(path_1.join('folder1', 'file1'))));
            assert.ok(!testObject.affectsConfiguration('window.restoreWindows', uri_1.URI.file(path_1.join('folder3', 'file3'))));
            assert.ok(testObject.affectsConfiguration('window.title'));
            assert.ok(testObject.affectsConfiguration('window.title', uri_1.URI.file('folder1')));
            assert.ok(testObject.affectsConfiguration('window.title', uri_1.URI.file(path_1.join('folder1', 'file1'))));
            assert.ok(testObject.affectsConfiguration('window.title', uri_1.URI.file('folder2')));
            assert.ok(testObject.affectsConfiguration('window.title', uri_1.URI.file(path_1.join('folder2', 'file2'))));
            assert.ok(testObject.affectsConfiguration('window.title', uri_1.URI.file('folder3')));
            assert.ok(testObject.affectsConfiguration('window.title', uri_1.URI.file(path_1.join('folder3', 'file3'))));
            assert.ok(testObject.affectsConfiguration('window.title', uri_1.URI.file('file1')));
            assert.ok(testObject.affectsConfiguration('window.title', uri_1.URI.file('file2')));
            assert.ok(testObject.affectsConfiguration('window.title', uri_1.URI.file('file3')));
            assert.ok(testObject.affectsConfiguration('window'));
            assert.ok(testObject.affectsConfiguration('window', uri_1.URI.file('folder1')));
            assert.ok(testObject.affectsConfiguration('window', uri_1.URI.file(path_1.join('folder1', 'file1'))));
            assert.ok(testObject.affectsConfiguration('window', uri_1.URI.file('folder2')));
            assert.ok(testObject.affectsConfiguration('window', uri_1.URI.file(path_1.join('folder2', 'file2'))));
            assert.ok(testObject.affectsConfiguration('window', uri_1.URI.file('folder3')));
            assert.ok(testObject.affectsConfiguration('window', uri_1.URI.file(path_1.join('folder3', 'file3'))));
            assert.ok(testObject.affectsConfiguration('window', uri_1.URI.file('file1')));
            assert.ok(testObject.affectsConfiguration('window', uri_1.URI.file('file2')));
            assert.ok(testObject.affectsConfiguration('window', uri_1.URI.file('file3')));
            assert.ok(testObject.affectsConfiguration('workbench.editor.enablePreview'));
            assert.ok(testObject.affectsConfiguration('workbench.editor.enablePreview', uri_1.URI.file('folder2')));
            assert.ok(testObject.affectsConfiguration('workbench.editor.enablePreview', uri_1.URI.file(path_1.join('folder2', 'file2'))));
            assert.ok(!testObject.affectsConfiguration('workbench.editor.enablePreview', uri_1.URI.file('folder1')));
            assert.ok(!testObject.affectsConfiguration('workbench.editor.enablePreview', uri_1.URI.file(path_1.join('folder1', 'file1'))));
            assert.ok(!testObject.affectsConfiguration('workbench.editor.enablePreview', uri_1.URI.file('folder3')));
            assert.ok(testObject.affectsConfiguration('workbench.editor'));
            assert.ok(testObject.affectsConfiguration('workbench.editor', uri_1.URI.file('folder2')));
            assert.ok(testObject.affectsConfiguration('workbench.editor', uri_1.URI.file(path_1.join('folder2', 'file2'))));
            assert.ok(!testObject.affectsConfiguration('workbench.editor', uri_1.URI.file('folder1')));
            assert.ok(!testObject.affectsConfiguration('workbench.editor', uri_1.URI.file(path_1.join('folder1', 'file1'))));
            assert.ok(!testObject.affectsConfiguration('workbench.editor', uri_1.URI.file('folder3')));
            assert.ok(testObject.affectsConfiguration('workbench'));
            assert.ok(testObject.affectsConfiguration('workbench', uri_1.URI.file('folder2')));
            assert.ok(testObject.affectsConfiguration('workbench', uri_1.URI.file(path_1.join('folder2', 'file2'))));
            assert.ok(!testObject.affectsConfiguration('workbench', uri_1.URI.file('folder1')));
            assert.ok(!testObject.affectsConfiguration('workbench', uri_1.URI.file('folder3')));
            assert.ok(!testObject.affectsConfiguration('files'));
            assert.ok(!testObject.affectsConfiguration('files', uri_1.URI.file('folder1')));
            assert.ok(!testObject.affectsConfiguration('files', uri_1.URI.file(path_1.join('folder1', 'file1'))));
            assert.ok(!testObject.affectsConfiguration('files', uri_1.URI.file('folder2')));
            assert.ok(!testObject.affectsConfiguration('files', uri_1.URI.file(path_1.join('folder2', 'file2'))));
            assert.ok(!testObject.affectsConfiguration('files', uri_1.URI.file('folder3')));
            assert.ok(!testObject.affectsConfiguration('files', uri_1.URI.file(path_1.join('folder3', 'file3'))));
        });
    });
    suite('AllKeysConfigurationChangeEvent', () => {
        test('changeEvent affects keys for any resource', () => {
            const configuraiton = new configurationModels_1.Configuration(new configurationModels_2.ConfigurationModel({}, ['window.title', 'window.zoomLevel', 'window.restoreFullscreen', 'workbench.editor.enablePreview', 'window.restoreWindows']), new configurationModels_2.ConfigurationModel(), new configurationModels_2.ConfigurationModel(), new configurationModels_2.ConfigurationModel(), new map_1.ResourceMap(), new configurationModels_2.ConfigurationModel(), new map_1.ResourceMap(), null);
            let testObject = new configurationModels_1.AllKeysConfigurationChangeEvent(configuraiton, 1 /* USER */, null);
            assert.deepEqual(testObject.affectedKeys, ['window.title', 'window.zoomLevel', 'window.restoreFullscreen', 'workbench.editor.enablePreview', 'window.restoreWindows']);
            assert.ok(testObject.affectsConfiguration('window.zoomLevel'));
            assert.ok(testObject.affectsConfiguration('window.zoomLevel', uri_1.URI.file('file1')));
            assert.ok(testObject.affectsConfiguration('window.zoomLevel', uri_1.URI.file('file2')));
            assert.ok(testObject.affectsConfiguration('window.restoreFullscreen'));
            assert.ok(testObject.affectsConfiguration('window.restoreFullscreen', uri_1.URI.file('file1')));
            assert.ok(testObject.affectsConfiguration('window.restoreFullscreen', uri_1.URI.file('file2')));
            assert.ok(testObject.affectsConfiguration('window.restoreWindows'));
            assert.ok(testObject.affectsConfiguration('window.restoreWindows', uri_1.URI.file('file2')));
            assert.ok(testObject.affectsConfiguration('window.restoreWindows', uri_1.URI.file('file1')));
            assert.ok(testObject.affectsConfiguration('window.title'));
            assert.ok(testObject.affectsConfiguration('window.title', uri_1.URI.file('file1')));
            assert.ok(testObject.affectsConfiguration('window.title', uri_1.URI.file('file2')));
            assert.ok(testObject.affectsConfiguration('window'));
            assert.ok(testObject.affectsConfiguration('window', uri_1.URI.file('file1')));
            assert.ok(testObject.affectsConfiguration('window', uri_1.URI.file('file2')));
            assert.ok(testObject.affectsConfiguration('workbench.editor.enablePreview'));
            assert.ok(testObject.affectsConfiguration('workbench.editor.enablePreview', uri_1.URI.file('file2')));
            assert.ok(testObject.affectsConfiguration('workbench.editor.enablePreview', uri_1.URI.file('file1')));
            assert.ok(testObject.affectsConfiguration('workbench.editor'));
            assert.ok(testObject.affectsConfiguration('workbench.editor', uri_1.URI.file('file2')));
            assert.ok(testObject.affectsConfiguration('workbench.editor', uri_1.URI.file('file1')));
            assert.ok(testObject.affectsConfiguration('workbench'));
            assert.ok(testObject.affectsConfiguration('workbench', uri_1.URI.file('file2')));
            assert.ok(testObject.affectsConfiguration('workbench', uri_1.URI.file('file1')));
            assert.ok(!testObject.affectsConfiguration('files'));
            assert.ok(!testObject.affectsConfiguration('files', uri_1.URI.file('file1')));
        });
    });
});
//# sourceMappingURL=configurationModels.test.js.map