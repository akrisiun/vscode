/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/objects", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationModels", "vs/base/common/map", "vs/workbench/services/configuration/common/configuration"], function (require, exports, objects_1, configuration_1, configurationModels_1, map_1, configuration_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class WorkspaceConfigurationModelParser extends configurationModels_1.ConfigurationModelParser {
        constructor(name) {
            super(name);
            this._folders = [];
            this._settingsModelParser = new configurationModels_1.ConfigurationModelParser(name, configuration_2.WORKSPACE_SCOPES);
            this._launchModel = new configurationModels_1.ConfigurationModel();
        }
        get folders() {
            return this._folders;
        }
        get settingsModel() {
            return this._settingsModelParser.configurationModel;
        }
        get launchModel() {
            return this._launchModel;
        }
        reprocessWorkspaceSettings() {
            this._settingsModelParser.parse();
        }
        doParseRaw(raw) {
            this._folders = (raw['folders'] || []);
            this._settingsModelParser.parseRaw(raw['settings']);
            this._launchModel = this.createConfigurationModelFrom(raw, 'launch');
            return super.doParseRaw(raw);
        }
        createConfigurationModelFrom(raw, key) {
            const data = raw[key];
            if (data) {
                const contents = configuration_1.toValuesTree(data, message => console.error(`Conflict in settings file ${this._name}: ${message}`));
                const scopedContents = Object.create(null);
                scopedContents[key] = contents;
                const keys = Object.keys(data).map(k => `${key}.${k}`);
                return new configurationModels_1.ConfigurationModel(scopedContents, keys, []);
            }
            return new configurationModels_1.ConfigurationModel();
        }
    }
    exports.WorkspaceConfigurationModelParser = WorkspaceConfigurationModelParser;
    class StandaloneConfigurationModelParser extends configurationModels_1.ConfigurationModelParser {
        constructor(name, scope) {
            super(name);
            this.scope = scope;
        }
        doParseRaw(raw) {
            const contents = configuration_1.toValuesTree(raw, message => console.error(`Conflict in settings file ${this._name}: ${message}`));
            const scopedContents = Object.create(null);
            scopedContents[this.scope] = contents;
            const keys = Object.keys(raw).map(key => `${this.scope}.${key}`);
            return { contents: scopedContents, keys, overrides: [] };
        }
    }
    exports.StandaloneConfigurationModelParser = StandaloneConfigurationModelParser;
    class Configuration extends configurationModels_1.Configuration {
        constructor(defaults, localUser, remoteUser, workspaceConfiguration, folders, memoryConfiguration, memoryConfigurationByResource, _workspace) {
            super(defaults, localUser, remoteUser, workspaceConfiguration, folders, memoryConfiguration, memoryConfigurationByResource);
            this._workspace = _workspace;
        }
        getValue(key, overrides = {}) {
            return super.getValue(key, overrides, this._workspace);
        }
        inspect(key, overrides = {}) {
            return super.inspect(key, overrides, this._workspace);
        }
        keys() {
            return super.keys(this._workspace);
        }
        compareAndUpdateLocalUserConfiguration(user) {
            const { added, updated, removed } = configuration_1.compare(this.localUserConfiguration, user);
            let changedKeys = [...added, ...updated, ...removed];
            if (changedKeys.length) {
                super.updateLocalUserConfiguration(user);
            }
            return new configurationModels_1.ConfigurationChangeEvent().change(changedKeys);
        }
        compareAndUpdateRemoteUserConfiguration(user) {
            const { added, updated, removed } = configuration_1.compare(this.remoteUserConfiguration, user);
            let changedKeys = [...added, ...updated, ...removed];
            if (changedKeys.length) {
                super.updateRemoteUserConfiguration(user);
            }
            return new configurationModels_1.ConfigurationChangeEvent().change(changedKeys);
        }
        compareAndUpdateWorkspaceConfiguration(workspaceConfiguration) {
            const { added, updated, removed } = configuration_1.compare(this.workspaceConfiguration, workspaceConfiguration);
            let changedKeys = [...added, ...updated, ...removed];
            if (changedKeys.length) {
                super.updateWorkspaceConfiguration(workspaceConfiguration);
            }
            return new configurationModels_1.ConfigurationChangeEvent().change(changedKeys);
        }
        compareAndUpdateFolderConfiguration(resource, folderConfiguration) {
            const currentFolderConfiguration = this.folderConfigurations.get(resource);
            if (currentFolderConfiguration) {
                const { added, updated, removed } = configuration_1.compare(currentFolderConfiguration, folderConfiguration);
                let changedKeys = [...added, ...updated, ...removed];
                if (changedKeys.length) {
                    super.updateFolderConfiguration(resource, folderConfiguration);
                }
                return new configurationModels_1.ConfigurationChangeEvent().change(changedKeys, resource);
            }
            else {
                super.updateFolderConfiguration(resource, folderConfiguration);
                return new configurationModels_1.ConfigurationChangeEvent().change(folderConfiguration.keys, resource);
            }
        }
        compareAndDeleteFolderConfiguration(folder) {
            if (this._workspace && this._workspace.folders.length > 0 && this._workspace.folders[0].uri.toString() === folder.toString()) {
                // Do not remove workspace configuration
                return new configurationModels_1.ConfigurationChangeEvent();
            }
            const folderConfig = this.folderConfigurations.get(folder);
            if (!folderConfig) {
                throw new Error('Unknown folder');
            }
            const keys = folderConfig.keys;
            super.deleteFolderConfiguration(folder);
            return new configurationModels_1.ConfigurationChangeEvent().change(keys, folder);
        }
        compare(other) {
            const result = [];
            for (const key of this.allKeys()) {
                if (!objects_1.equals(this.getValue(key), other.getValue(key))
                    || (this._workspace && this._workspace.folders.some(folder => !objects_1.equals(this.getValue(key, { resource: folder.uri }), other.getValue(key, { resource: folder.uri }))))) {
                    result.push(key);
                }
            }
            return result;
        }
        allKeys() {
            return super.allKeys(this._workspace);
        }
    }
    exports.Configuration = Configuration;
    class AllKeysConfigurationChangeEvent extends configurationModels_1.AbstractConfigurationChangeEvent {
        constructor(_configuration, source, sourceConfig) {
            super();
            this._configuration = _configuration;
            this.source = source;
            this.sourceConfig = sourceConfig;
            this._changedConfiguration = null;
        }
        get changedConfiguration() {
            if (!this._changedConfiguration) {
                this._changedConfiguration = new configurationModels_1.ConfigurationModel();
                this.updateKeys(this._changedConfiguration, this.affectedKeys);
            }
            return this._changedConfiguration;
        }
        get changedConfigurationByResource() {
            return new map_1.ResourceMap();
        }
        get affectedKeys() {
            return this._configuration.allKeys();
        }
        affectsConfiguration(config, resource) {
            return this.doesConfigurationContains(this.changedConfiguration, config);
        }
    }
    exports.AllKeysConfigurationChangeEvent = AllKeysConfigurationChangeEvent;
    class WorkspaceConfigurationChangeEvent {
        constructor(configurationChangeEvent, workspace) {
            this.configurationChangeEvent = configurationChangeEvent;
            this.workspace = workspace;
        }
        get changedConfiguration() {
            return this.configurationChangeEvent.changedConfiguration;
        }
        get changedConfigurationByResource() {
            return this.configurationChangeEvent.changedConfigurationByResource;
        }
        get affectedKeys() {
            return this.configurationChangeEvent.affectedKeys;
        }
        get source() {
            return this.configurationChangeEvent.source;
        }
        get sourceConfig() {
            return this.configurationChangeEvent.sourceConfig;
        }
        affectsConfiguration(config, resource) {
            if (this.configurationChangeEvent.affectsConfiguration(config, resource)) {
                return true;
            }
            if (resource && this.workspace) {
                let workspaceFolder = this.workspace.getFolder(resource);
                if (workspaceFolder) {
                    return this.configurationChangeEvent.affectsConfiguration(config, workspaceFolder.uri);
                }
            }
            return false;
        }
    }
    exports.WorkspaceConfigurationChangeEvent = WorkspaceConfigurationChangeEvent;
});
//# sourceMappingURL=configurationModels.js.map