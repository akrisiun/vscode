/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/json", "vs/base/common/map", "vs/base/common/arrays", "vs/base/common/types", "vs/base/common/objects", "vs/platform/configuration/common/configurationRegistry", "vs/platform/configuration/common/configuration", "vs/platform/registry/common/platform"], function (require, exports, json, map_1, arrays, types, objects, configurationRegistry_1, configuration_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ConfigurationModel {
        constructor(_contents = {}, _keys = [], _overrides = []) {
            this._contents = _contents;
            this._keys = _keys;
            this._overrides = _overrides;
            this.isFrozen = false;
        }
        get contents() {
            return this.checkAndFreeze(this._contents);
        }
        get overrides() {
            return this.checkAndFreeze(this._overrides);
        }
        get keys() {
            return this.checkAndFreeze(this._keys);
        }
        isEmpty() {
            return this._keys.length === 0 && Object.keys(this._contents).length === 0 && this._overrides.length === 0;
        }
        getValue(section) {
            return section ? configuration_1.getConfigurationValue(this.contents, section) : this.contents;
        }
        override(identifier) {
            const overrideContents = this.getContentsForOverrideIdentifer(identifier);
            if (!overrideContents || typeof overrideContents !== 'object' || !Object.keys(overrideContents).length) {
                // If there are no valid overrides, return self
                return this;
            }
            let contents = {};
            for (const key of arrays.distinct([...Object.keys(this.contents), ...Object.keys(overrideContents)])) {
                let contentsForKey = this.contents[key];
                let overrideContentsForKey = overrideContents[key];
                // If there are override contents for the key, clone and merge otherwise use base contents
                if (overrideContentsForKey) {
                    // Clone and merge only if base contents and override contents are of type object otherwise just override
                    if (typeof contentsForKey === 'object' && typeof overrideContentsForKey === 'object') {
                        contentsForKey = objects.deepClone(contentsForKey);
                        this.mergeContents(contentsForKey, overrideContentsForKey);
                    }
                    else {
                        contentsForKey = overrideContentsForKey;
                    }
                }
                contents[key] = contentsForKey;
            }
            return new ConfigurationModel(contents);
        }
        merge(...others) {
            const contents = objects.deepClone(this.contents);
            const overrides = objects.deepClone(this.overrides);
            const keys = [...this.keys];
            for (const other of others) {
                this.mergeContents(contents, other.contents);
                for (const otherOverride of other.overrides) {
                    const [override] = overrides.filter(o => arrays.equals(o.identifiers, otherOverride.identifiers));
                    if (override) {
                        this.mergeContents(override.contents, otherOverride.contents);
                    }
                    else {
                        overrides.push(objects.deepClone(otherOverride));
                    }
                }
                for (const key of other.keys) {
                    if (keys.indexOf(key) === -1) {
                        keys.push(key);
                    }
                }
            }
            return new ConfigurationModel(contents, keys, overrides);
        }
        freeze() {
            this.isFrozen = true;
            return this;
        }
        mergeContents(source, target) {
            for (const key of Object.keys(target)) {
                if (key in source) {
                    if (types.isObject(source[key]) && types.isObject(target[key])) {
                        this.mergeContents(source[key], target[key]);
                        continue;
                    }
                }
                source[key] = objects.deepClone(target[key]);
            }
        }
        checkAndFreeze(data) {
            if (this.isFrozen && !Object.isFrozen(data)) {
                return objects.deepFreeze(data);
            }
            return data;
        }
        getContentsForOverrideIdentifer(identifier) {
            for (const override of this.overrides) {
                if (override.identifiers.indexOf(identifier) !== -1) {
                    return override.contents;
                }
            }
            return null;
        }
        toJSON() {
            return {
                contents: this.contents,
                overrides: this.overrides,
                keys: this.keys
            };
        }
        // Update methods
        setValue(key, value) {
            this.addKey(key);
            configuration_1.addToValueTree(this.contents, key, value, e => { throw new Error(e); });
        }
        removeValue(key) {
            if (this.removeKey(key)) {
                configuration_1.removeFromValueTree(this.contents, key);
            }
        }
        addKey(key) {
            let index = this.keys.length;
            for (let i = 0; i < index; i++) {
                if (key.indexOf(this.keys[i]) === 0) {
                    index = i;
                }
            }
            this.keys.splice(index, 1, key);
        }
        removeKey(key) {
            let index = this.keys.indexOf(key);
            if (index !== -1) {
                this.keys.splice(index, 1);
                return true;
            }
            return false;
        }
    }
    exports.ConfigurationModel = ConfigurationModel;
    class DefaultConfigurationModel extends ConfigurationModel {
        constructor() {
            const contents = configuration_1.getDefaultValues();
            const keys = configuration_1.getConfigurationKeys();
            const overrides = [];
            for (const key of Object.keys(contents)) {
                if (configurationRegistry_1.OVERRIDE_PROPERTY_PATTERN.test(key)) {
                    overrides.push({
                        identifiers: [configuration_1.overrideIdentifierFromKey(key).trim()],
                        contents: configuration_1.toValuesTree(contents[key], message => console.error(`Conflict in default settings file: ${message}`))
                    });
                }
            }
            super(contents, keys, overrides);
        }
    }
    exports.DefaultConfigurationModel = DefaultConfigurationModel;
    class ConfigurationModelParser {
        constructor(_name, _scopes) {
            this._name = _name;
            this._scopes = _scopes;
            this._raw = null;
            this._configurationModel = null;
            this._parseErrors = [];
        }
        get configurationModel() {
            return this._configurationModel || new ConfigurationModel();
        }
        get errors() {
            return this._parseErrors;
        }
        parseContent(content) {
            if (content) {
                const raw = this.doParseContent(content);
                this.parseRaw(raw);
            }
        }
        parseRaw(raw) {
            this._raw = raw;
            const configurationModel = this.doParseRaw(raw);
            this._configurationModel = new ConfigurationModel(configurationModel.contents, configurationModel.keys, configurationModel.overrides);
        }
        parse() {
            if (this._raw) {
                this.parseRaw(this._raw);
            }
        }
        doParseContent(content) {
            let raw = {};
            let currentProperty = null;
            let currentParent = [];
            let previousParents = [];
            let parseErrors = [];
            function onValue(value) {
                if (Array.isArray(currentParent)) {
                    currentParent.push(value);
                }
                else if (currentProperty) {
                    currentParent[currentProperty] = value;
                }
            }
            let visitor = {
                onObjectBegin: () => {
                    let object = {};
                    onValue(object);
                    previousParents.push(currentParent);
                    currentParent = object;
                    currentProperty = null;
                },
                onObjectProperty: (name) => {
                    currentProperty = name;
                },
                onObjectEnd: () => {
                    currentParent = previousParents.pop();
                },
                onArrayBegin: () => {
                    let array = [];
                    onValue(array);
                    previousParents.push(currentParent);
                    currentParent = array;
                    currentProperty = null;
                },
                onArrayEnd: () => {
                    currentParent = previousParents.pop();
                },
                onLiteralValue: onValue,
                onError: (error, offset, length) => {
                    parseErrors.push({ error, offset, length });
                }
            };
            if (content) {
                try {
                    json.visit(content, visitor);
                    raw = currentParent[0] || {};
                }
                catch (e) {
                    console.error(`Error while parsing settings file ${this._name}: ${e}`);
                    this._parseErrors = [e];
                }
            }
            return raw;
        }
        doParseRaw(raw) {
            if (this._scopes) {
                const configurationProperties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
                raw = this.filterByScope(raw, configurationProperties, true, this._scopes);
            }
            const contents = configuration_1.toValuesTree(raw, message => console.error(`Conflict in settings file ${this._name}: ${message}`));
            const keys = Object.keys(raw);
            const overrides = configuration_1.toOverrides(raw, message => console.error(`Conflict in settings file ${this._name}: ${message}`));
            return { contents, keys, overrides };
        }
        filterByScope(properties, configurationProperties, filterOverriddenProperties, scopes) {
            const result = {};
            for (let key in properties) {
                if (configurationRegistry_1.OVERRIDE_PROPERTY_PATTERN.test(key) && filterOverriddenProperties) {
                    result[key] = this.filterByScope(properties[key], configurationProperties, false, scopes);
                }
                else {
                    const scope = this.getScope(key, configurationProperties);
                    if (scopes.indexOf(scope) !== -1) {
                        result[key] = properties[key];
                    }
                }
            }
            return result;
        }
        getScope(key, configurationProperties) {
            const propertySchema = configurationProperties[key];
            return propertySchema && typeof propertySchema.scope !== 'undefined' ? propertySchema.scope : 3 /* WINDOW */;
        }
    }
    exports.ConfigurationModelParser = ConfigurationModelParser;
    class Configuration {
        constructor(_defaultConfiguration, _localUserConfiguration, _remoteUserConfiguration = new ConfigurationModel(), _workspaceConfiguration = new ConfigurationModel(), _folderConfigurations = new map_1.ResourceMap(), _memoryConfiguration = new ConfigurationModel(), _memoryConfigurationByResource = new map_1.ResourceMap(), _freeze = true) {
            this._defaultConfiguration = _defaultConfiguration;
            this._localUserConfiguration = _localUserConfiguration;
            this._remoteUserConfiguration = _remoteUserConfiguration;
            this._workspaceConfiguration = _workspaceConfiguration;
            this._folderConfigurations = _folderConfigurations;
            this._memoryConfiguration = _memoryConfiguration;
            this._memoryConfigurationByResource = _memoryConfigurationByResource;
            this._freeze = _freeze;
            this._workspaceConsolidatedConfiguration = null;
            this._foldersConsolidatedConfigurations = new map_1.ResourceMap();
            this._userConfiguration = null;
        }
        getValue(section, overrides, workspace) {
            const consolidateConfigurationModel = this.getConsolidateConfigurationModel(overrides, workspace);
            return consolidateConfigurationModel.getValue(section);
        }
        updateValue(key, value, overrides = {}) {
            let memoryConfiguration;
            if (overrides.resource) {
                memoryConfiguration = this._memoryConfigurationByResource.get(overrides.resource);
                if (!memoryConfiguration) {
                    memoryConfiguration = new ConfigurationModel();
                    this._memoryConfigurationByResource.set(overrides.resource, memoryConfiguration);
                }
            }
            else {
                memoryConfiguration = this._memoryConfiguration;
            }
            if (value === undefined) {
                memoryConfiguration.removeValue(key);
            }
            else {
                memoryConfiguration.setValue(key, value);
            }
            if (!overrides.resource) {
                this._workspaceConsolidatedConfiguration = null;
            }
        }
        inspect(key, overrides, workspace) {
            const consolidateConfigurationModel = this.getConsolidateConfigurationModel(overrides, workspace);
            const folderConfigurationModel = this.getFolderConfigurationModelForResource(overrides.resource, workspace);
            const memoryConfigurationModel = overrides.resource ? this._memoryConfigurationByResource.get(overrides.resource) || this._memoryConfiguration : this._memoryConfiguration;
            return {
                default: overrides.overrideIdentifier ? this._defaultConfiguration.freeze().override(overrides.overrideIdentifier).getValue(key) : this._defaultConfiguration.freeze().getValue(key),
                user: overrides.overrideIdentifier ? this.userConfiguration.freeze().override(overrides.overrideIdentifier).getValue(key) : this.userConfiguration.freeze().getValue(key),
                userLocal: overrides.overrideIdentifier ? this.localUserConfiguration.freeze().override(overrides.overrideIdentifier).getValue(key) : this.localUserConfiguration.freeze().getValue(key),
                userRemote: overrides.overrideIdentifier ? this.remoteUserConfiguration.freeze().override(overrides.overrideIdentifier).getValue(key) : this.remoteUserConfiguration.freeze().getValue(key),
                workspace: workspace ? overrides.overrideIdentifier ? this._workspaceConfiguration.freeze().override(overrides.overrideIdentifier).getValue(key) : this._workspaceConfiguration.freeze().getValue(key) : undefined,
                workspaceFolder: folderConfigurationModel ? overrides.overrideIdentifier ? folderConfigurationModel.freeze().override(overrides.overrideIdentifier).getValue(key) : folderConfigurationModel.freeze().getValue(key) : undefined,
                memory: overrides.overrideIdentifier ? memoryConfigurationModel.override(overrides.overrideIdentifier).getValue(key) : memoryConfigurationModel.getValue(key),
                value: consolidateConfigurationModel.getValue(key)
            };
        }
        keys(workspace) {
            const folderConfigurationModel = this.getFolderConfigurationModelForResource(undefined, workspace);
            return {
                default: this._defaultConfiguration.freeze().keys,
                user: this.userConfiguration.freeze().keys,
                workspace: this._workspaceConfiguration.freeze().keys,
                workspaceFolder: folderConfigurationModel ? folderConfigurationModel.freeze().keys : []
            };
        }
        updateDefaultConfiguration(defaultConfiguration) {
            this._defaultConfiguration = defaultConfiguration;
            this._workspaceConsolidatedConfiguration = null;
            this._foldersConsolidatedConfigurations.clear();
        }
        updateLocalUserConfiguration(localUserConfiguration) {
            this._localUserConfiguration = localUserConfiguration;
            this._userConfiguration = null;
            this._workspaceConsolidatedConfiguration = null;
            this._foldersConsolidatedConfigurations.clear();
        }
        updateRemoteUserConfiguration(remoteUserConfiguration) {
            this._remoteUserConfiguration = remoteUserConfiguration;
            this._userConfiguration = null;
            this._workspaceConsolidatedConfiguration = null;
            this._foldersConsolidatedConfigurations.clear();
        }
        updateWorkspaceConfiguration(workspaceConfiguration) {
            this._workspaceConfiguration = workspaceConfiguration;
            this._workspaceConsolidatedConfiguration = null;
            this._foldersConsolidatedConfigurations.clear();
        }
        updateFolderConfiguration(resource, configuration) {
            this._folderConfigurations.set(resource, configuration);
            this._foldersConsolidatedConfigurations.delete(resource);
        }
        deleteFolderConfiguration(resource) {
            this.folderConfigurations.delete(resource);
            this._foldersConsolidatedConfigurations.delete(resource);
        }
        get defaults() {
            return this._defaultConfiguration;
        }
        get userConfiguration() {
            if (!this._userConfiguration) {
                this._userConfiguration = this._remoteUserConfiguration.isEmpty() ? this._localUserConfiguration : this._localUserConfiguration.merge(this._remoteUserConfiguration);
                if (this._freeze) {
                    this._userConfiguration.freeze();
                }
            }
            return this._userConfiguration;
        }
        get localUserConfiguration() {
            return this._localUserConfiguration;
        }
        get remoteUserConfiguration() {
            return this._remoteUserConfiguration;
        }
        get workspaceConfiguration() {
            return this._workspaceConfiguration;
        }
        get folderConfigurations() {
            return this._folderConfigurations;
        }
        getConsolidateConfigurationModel(overrides, workspace) {
            let configurationModel = this.getConsolidatedConfigurationModelForResource(overrides, workspace);
            return overrides.overrideIdentifier ? configurationModel.override(overrides.overrideIdentifier) : configurationModel;
        }
        getConsolidatedConfigurationModelForResource({ resource }, workspace) {
            let consolidateConfiguration = this.getWorkspaceConsolidatedConfiguration();
            if (workspace && resource) {
                const root = workspace.getFolder(resource);
                if (root) {
                    consolidateConfiguration = this.getFolderConsolidatedConfiguration(root.uri) || consolidateConfiguration;
                }
                const memoryConfigurationForResource = this._memoryConfigurationByResource.get(resource);
                if (memoryConfigurationForResource) {
                    consolidateConfiguration = consolidateConfiguration.merge(memoryConfigurationForResource);
                }
            }
            return consolidateConfiguration;
        }
        getWorkspaceConsolidatedConfiguration() {
            if (!this._workspaceConsolidatedConfiguration) {
                this._workspaceConsolidatedConfiguration = this._defaultConfiguration.merge(this.userConfiguration, this._workspaceConfiguration, this._memoryConfiguration);
                if (this._freeze) {
                    this._workspaceConfiguration = this._workspaceConfiguration.freeze();
                }
            }
            return this._workspaceConsolidatedConfiguration;
        }
        getFolderConsolidatedConfiguration(folder) {
            let folderConsolidatedConfiguration = this._foldersConsolidatedConfigurations.get(folder);
            if (!folderConsolidatedConfiguration) {
                const workspaceConsolidateConfiguration = this.getWorkspaceConsolidatedConfiguration();
                const folderConfiguration = this._folderConfigurations.get(folder);
                if (folderConfiguration) {
                    folderConsolidatedConfiguration = workspaceConsolidateConfiguration.merge(folderConfiguration);
                    if (this._freeze) {
                        folderConsolidatedConfiguration = folderConsolidatedConfiguration.freeze();
                    }
                    this._foldersConsolidatedConfigurations.set(folder, folderConsolidatedConfiguration);
                }
                else {
                    folderConsolidatedConfiguration = workspaceConsolidateConfiguration;
                }
            }
            return folderConsolidatedConfiguration;
        }
        getFolderConfigurationModelForResource(resource, workspace) {
            if (workspace && resource) {
                const root = workspace.getFolder(resource);
                if (root) {
                    return this._folderConfigurations.get(root.uri);
                }
            }
            return undefined;
        }
        toData() {
            return {
                defaults: {
                    contents: this._defaultConfiguration.contents,
                    overrides: this._defaultConfiguration.overrides,
                    keys: this._defaultConfiguration.keys
                },
                user: {
                    contents: this.userConfiguration.contents,
                    overrides: this.userConfiguration.overrides,
                    keys: this.userConfiguration.keys
                },
                workspace: {
                    contents: this._workspaceConfiguration.contents,
                    overrides: this._workspaceConfiguration.overrides,
                    keys: this._workspaceConfiguration.keys
                },
                folders: this._folderConfigurations.keys().reduce((result, folder) => {
                    const { contents, overrides, keys } = this._folderConfigurations.get(folder);
                    result.push([folder, { contents, overrides, keys }]);
                    return result;
                }, [])
            };
        }
        allKeys(workspace) {
            let keys = this.keys(workspace);
            let all = [...keys.default];
            const addKeys = (keys) => {
                for (const key of keys) {
                    if (all.indexOf(key) === -1) {
                        all.push(key);
                    }
                }
            };
            addKeys(keys.user);
            addKeys(keys.workspace);
            for (const resource of this.folderConfigurations.keys()) {
                addKeys(this.folderConfigurations.get(resource).keys);
            }
            return all;
        }
    }
    exports.Configuration = Configuration;
    class AbstractConfigurationChangeEvent {
        doesConfigurationContains(configuration, config) {
            let changedKeysTree = configuration.contents;
            let requestedTree = configuration_1.toValuesTree({ [config]: true }, () => { });
            let key;
            while (typeof requestedTree === 'object' && (key = Object.keys(requestedTree)[0])) { // Only one key should present, since we added only one property
                changedKeysTree = changedKeysTree[key];
                if (!changedKeysTree) {
                    return false; // Requested tree is not found
                }
                requestedTree = requestedTree[key];
            }
            return true;
        }
        updateKeys(configuration, keys, resource) {
            for (const key of keys) {
                configuration.setValue(key, {});
            }
        }
    }
    exports.AbstractConfigurationChangeEvent = AbstractConfigurationChangeEvent;
    class ConfigurationChangeEvent extends AbstractConfigurationChangeEvent {
        constructor(_changedConfiguration = new ConfigurationModel(), _changedConfigurationByResource = new map_1.ResourceMap()) {
            super();
            this._changedConfiguration = _changedConfiguration;
            this._changedConfigurationByResource = _changedConfigurationByResource;
            this._source = 6 /* DEFAULT */;
        }
        get changedConfiguration() {
            return this._changedConfiguration;
        }
        get changedConfigurationByResource() {
            return this._changedConfigurationByResource;
        }
        change(arg1, arg2) {
            if (arg1 instanceof ConfigurationChangeEvent) {
                this._changedConfiguration = this._changedConfiguration.merge(arg1._changedConfiguration);
                for (const resource of arg1._changedConfigurationByResource.keys()) {
                    let changedConfigurationByResource = this.getOrSetChangedConfigurationForResource(resource);
                    changedConfigurationByResource = changedConfigurationByResource.merge(arg1._changedConfigurationByResource.get(resource));
                    this._changedConfigurationByResource.set(resource, changedConfigurationByResource);
                }
            }
            else {
                this.changeWithKeys(arg1, arg2);
            }
            return this;
        }
        telemetryData(source, sourceConfig) {
            this._source = source;
            this._sourceConfig = sourceConfig;
            return this;
        }
        get affectedKeys() {
            const keys = [...this._changedConfiguration.keys];
            this._changedConfigurationByResource.forEach(model => keys.push(...model.keys));
            return arrays.distinct(keys);
        }
        get source() {
            return this._source;
        }
        get sourceConfig() {
            return this._sourceConfig;
        }
        affectsConfiguration(config, resource) {
            let configurationModelsToSearch = [this._changedConfiguration];
            if (resource) {
                let model = this._changedConfigurationByResource.get(resource);
                if (model) {
                    configurationModelsToSearch.push(model);
                }
            }
            else {
                configurationModelsToSearch.push(...this._changedConfigurationByResource.values());
            }
            return configurationModelsToSearch.some(configuration => this.doesConfigurationContains(configuration, config));
        }
        changeWithKeys(keys, resource) {
            let changedConfiguration = resource ? this.getOrSetChangedConfigurationForResource(resource) : this._changedConfiguration;
            this.updateKeys(changedConfiguration, keys);
        }
        getOrSetChangedConfigurationForResource(resource) {
            let changedConfigurationByResource = this._changedConfigurationByResource.get(resource);
            if (!changedConfigurationByResource) {
                changedConfigurationByResource = new ConfigurationModel();
                this._changedConfigurationByResource.set(resource, changedConfigurationByResource);
            }
            return changedConfigurationByResource;
        }
    }
    exports.ConfigurationChangeEvent = ConfigurationChangeEvent;
});
//# sourceMappingURL=configurationModels.js.map