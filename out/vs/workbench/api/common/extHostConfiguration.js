/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/objects", "vs/base/common/uri", "vs/base/common/event", "vs/workbench/api/common/extHostWorkspace", "./extHost.protocol", "./extHostTypes", "vs/platform/configuration/common/configurationModels", "vs/workbench/services/configuration/common/configurationModels", "vs/base/common/map", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/types", "vs/base/common/async", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostRpcService"], function (require, exports, objects_1, uri_1, event_1, extHostWorkspace_1, extHost_protocol_1, extHostTypes_1, configurationModels_1, configurationModels_2, map_1, configurationRegistry_1, types_1, async_1, instantiation_1, extHostRpcService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function lookUp(tree, key) {
        if (key) {
            const parts = key.split('.');
            let node = tree;
            for (let i = 0; node && i < parts.length; i++) {
                node = node[parts[i]];
            }
            return node;
        }
    }
    let ExtHostConfiguration = class ExtHostConfiguration {
        constructor(extHostRpc, extHostWorkspace) {
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadConfiguration);
            this._extHostWorkspace = extHostWorkspace;
            this._barrier = new async_1.Barrier();
            this._actual = null;
        }
        getConfigProvider() {
            return this._barrier.wait().then(_ => this._actual);
        }
        $initializeConfiguration(data) {
            this._actual = new ExtHostConfigProvider(this._proxy, this._extHostWorkspace, data);
            this._barrier.open();
        }
        $acceptConfigurationChanged(data, eventData) {
            this.getConfigProvider().then(provider => provider.$acceptConfigurationChanged(data, eventData));
        }
    };
    ExtHostConfiguration = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostWorkspace_1.IExtHostWorkspace)
    ], ExtHostConfiguration);
    exports.ExtHostConfiguration = ExtHostConfiguration;
    class ExtHostConfigProvider {
        constructor(proxy, extHostWorkspace, data) {
            this._onDidChangeConfiguration = new event_1.Emitter();
            this._proxy = proxy;
            this._extHostWorkspace = extHostWorkspace;
            this._configuration = ExtHostConfigProvider.parse(data);
            this._configurationScopes = this._toMap(data.configurationScopes);
        }
        get onDidChangeConfiguration() {
            return this._onDidChangeConfiguration && this._onDidChangeConfiguration.event;
        }
        $acceptConfigurationChanged(data, eventData) {
            this._configuration = ExtHostConfigProvider.parse(data);
            this._configurationScopes = this._toMap(data.configurationScopes);
            this._onDidChangeConfiguration.fire(this._toConfigurationChangeEvent(eventData));
        }
        getConfiguration(section, resource, extensionId) {
            const config = this._toReadonlyValue(section
                ? lookUp(this._configuration.getValue(undefined, { resource }, this._extHostWorkspace.workspace), section)
                : this._configuration.getValue(undefined, { resource }, this._extHostWorkspace.workspace));
            if (section) {
                this._validateConfigurationAccess(section, resource, extensionId);
            }
            function parseConfigurationTarget(arg) {
                if (arg === undefined || arg === null) {
                    return null;
                }
                if (typeof arg === 'boolean') {
                    return arg ? 1 /* USER */ : 4 /* WORKSPACE */;
                }
                switch (arg) {
                    case extHostTypes_1.ConfigurationTarget.Global: return 1 /* USER */;
                    case extHostTypes_1.ConfigurationTarget.Workspace: return 4 /* WORKSPACE */;
                    case extHostTypes_1.ConfigurationTarget.WorkspaceFolder: return 5 /* WORKSPACE_FOLDER */;
                }
            }
            const result = {
                has(key) {
                    return typeof lookUp(config, key) !== 'undefined';
                },
                get: (key, defaultValue) => {
                    this._validateConfigurationAccess(section ? `${section}.${key}` : key, resource, extensionId);
                    let result = lookUp(config, key);
                    if (typeof result === 'undefined') {
                        result = defaultValue;
                    }
                    else {
                        let clonedConfig = undefined;
                        const cloneOnWriteProxy = (target, accessor) => {
                            let clonedTarget = undefined;
                            const cloneTarget = () => {
                                clonedConfig = clonedConfig ? clonedConfig : objects_1.deepClone(config);
                                clonedTarget = clonedTarget ? clonedTarget : lookUp(clonedConfig, accessor);
                            };
                            return types_1.isObject(target) ?
                                new Proxy(target, {
                                    get: (target, property) => {
                                        if (typeof property === 'string' && property.toLowerCase() === 'tojson') {
                                            cloneTarget();
                                            return () => clonedTarget;
                                        }
                                        if (clonedConfig) {
                                            clonedTarget = clonedTarget ? clonedTarget : lookUp(clonedConfig, accessor);
                                            return clonedTarget[property];
                                        }
                                        const result = target[property];
                                        if (typeof property === 'string') {
                                            return cloneOnWriteProxy(result, `${accessor}.${property}`);
                                        }
                                        return result;
                                    },
                                    set: (_target, property, value) => {
                                        cloneTarget();
                                        if (clonedTarget) {
                                            clonedTarget[property] = value;
                                        }
                                        return true;
                                    },
                                    deleteProperty: (_target, property) => {
                                        cloneTarget();
                                        if (clonedTarget) {
                                            delete clonedTarget[property];
                                        }
                                        return true;
                                    },
                                    defineProperty: (_target, property, descriptor) => {
                                        cloneTarget();
                                        if (clonedTarget) {
                                            Object.defineProperty(clonedTarget, property, descriptor);
                                        }
                                        return true;
                                    }
                                }) : target;
                        };
                        result = cloneOnWriteProxy(result, key);
                    }
                    return result;
                },
                update: (key, value, arg) => {
                    key = section ? `${section}.${key}` : key;
                    const target = parseConfigurationTarget(arg);
                    if (value !== undefined) {
                        return this._proxy.$updateConfigurationOption(target, key, value, resource);
                    }
                    else {
                        return this._proxy.$removeConfigurationOption(target, key, resource);
                    }
                },
                inspect: (key) => {
                    key = section ? `${section}.${key}` : key;
                    const config = objects_1.deepClone(this._configuration.inspect(key, { resource }, this._extHostWorkspace.workspace));
                    if (config) {
                        return {
                            key,
                            defaultValue: config.default,
                            globalValue: config.user,
                            workspaceValue: config.workspace,
                            workspaceFolderValue: config.workspaceFolder
                        };
                    }
                    return undefined;
                }
            };
            if (typeof config === 'object') {
                objects_1.mixin(result, config, false);
            }
            return Object.freeze(result);
        }
        _toReadonlyValue(result) {
            const readonlyProxy = (target) => {
                return types_1.isObject(target) ?
                    new Proxy(target, {
                        get: (target, property) => readonlyProxy(target[property]),
                        set: (_target, property, _value) => { throw new Error(`TypeError: Cannot assign to read only property '${property}' of object`); },
                        deleteProperty: (_target, property) => { throw new Error(`TypeError: Cannot delete read only property '${property}' of object`); },
                        defineProperty: (_target, property) => { throw new Error(`TypeError: Cannot define property '${property}' for a readonly object`); },
                        setPrototypeOf: (_target) => { throw new Error(`TypeError: Cannot set prototype for a readonly object`); },
                        isExtensible: () => false,
                        preventExtensions: () => true
                    }) : target;
            };
            return readonlyProxy(result);
        }
        _validateConfigurationAccess(key, resource, extensionId) {
            const scope = configurationRegistry_1.OVERRIDE_PROPERTY_PATTERN.test(key) ? 4 /* RESOURCE */ : this._configurationScopes.get(key);
            const extensionIdText = extensionId ? `[${extensionId.value}] ` : '';
            if (4 /* RESOURCE */ === scope) {
                if (resource === undefined) {
                    console.warn(`${extensionIdText}Accessing a resource scoped configuration without providing a resource is not expected. To get the effective value for '${key}', provide the URI of a resource or 'null' for any resource.`);
                }
                return;
            }
            if (3 /* WINDOW */ === scope) {
                if (resource) {
                    console.warn(`${extensionIdText}Accessing a window scoped configuration for a resource is not expected. To associate '${key}' to a resource, define its scope to 'resource' in configuration contributions in 'package.json'.`);
                }
                return;
            }
        }
        _toConfigurationChangeEvent(data) {
            const changedConfiguration = new configurationModels_1.ConfigurationModel(data.changedConfiguration.contents, data.changedConfiguration.keys, data.changedConfiguration.overrides);
            const changedConfigurationByResource = new map_1.ResourceMap();
            for (const key of Object.keys(data.changedConfigurationByResource)) {
                const resource = uri_1.URI.parse(key);
                const model = data.changedConfigurationByResource[key];
                changedConfigurationByResource.set(resource, new configurationModels_1.ConfigurationModel(model.contents, model.keys, model.overrides));
            }
            const event = new configurationModels_2.WorkspaceConfigurationChangeEvent(new configurationModels_1.ConfigurationChangeEvent(changedConfiguration, changedConfigurationByResource), this._extHostWorkspace.workspace);
            return Object.freeze({
                affectsConfiguration: (section, resource) => event.affectsConfiguration(section, resource)
            });
        }
        _toMap(scopes) {
            return scopes.reduce((result, scope) => { result.set(scope[0], scope[1]); return result; }, new Map());
        }
        static parse(data) {
            const defaultConfiguration = ExtHostConfigProvider.parseConfigurationModel(data.defaults);
            const userConfiguration = ExtHostConfigProvider.parseConfigurationModel(data.user);
            const workspaceConfiguration = ExtHostConfigProvider.parseConfigurationModel(data.workspace);
            const folders = data.folders.reduce((result, value) => {
                result.set(uri_1.URI.revive(value[0]), ExtHostConfigProvider.parseConfigurationModel(value[1]));
                return result;
            }, new map_1.ResourceMap());
            return new configurationModels_1.Configuration(defaultConfiguration, userConfiguration, new configurationModels_1.ConfigurationModel(), workspaceConfiguration, folders, new configurationModels_1.ConfigurationModel(), new map_1.ResourceMap(), false);
        }
        static parseConfigurationModel(model) {
            return new configurationModels_1.ConfigurationModel(model.contents, model.keys, model.overrides).freeze();
        }
    }
    exports.ExtHostConfigProvider = ExtHostConfigProvider;
    exports.IExtHostConfiguration = instantiation_1.createDecorator('IExtHostConfiguration');
});
//# sourceMappingURL=extHostConfiguration.js.map