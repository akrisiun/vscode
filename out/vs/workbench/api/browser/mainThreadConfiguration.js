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
define(["require", "exports", "vs/base/common/uri", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/platform/workspace/common/workspace", "../common/extHost.protocol", "vs/workbench/api/common/extHostCustomers", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment"], function (require, exports, uri_1, platform_1, configurationRegistry_1, workspace_1, extHost_protocol_1, extHostCustomers_1, configuration_1, environment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let MainThreadConfiguration = class MainThreadConfiguration {
        constructor(extHostContext, _workspaceContextService, configurationService, _environmentService) {
            this._workspaceContextService = _workspaceContextService;
            this.configurationService = configurationService;
            this._environmentService = _environmentService;
            const proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostConfiguration);
            proxy.$initializeConfiguration(this._getConfigurationData());
            this._configurationListener = configurationService.onDidChangeConfiguration(e => {
                proxy.$acceptConfigurationChanged(this._getConfigurationData(), this.toConfigurationChangeEventData(e));
            });
        }
        _getConfigurationData() {
            const configurationData = Object.assign(Object.assign({}, (this.configurationService.getConfigurationData())), { configurationScopes: [] });
            // Send configurations scopes only in development mode.
            if (!this._environmentService.isBuilt || this._environmentService.isExtensionDevelopment) {
                configurationData.configurationScopes = configurationRegistry_1.getScopes();
            }
            return configurationData;
        }
        dispose() {
            this._configurationListener.dispose();
        }
        $updateConfigurationOption(target, key, value, resourceUriComponenets) {
            const resource = resourceUriComponenets ? uri_1.URI.revive(resourceUriComponenets) : null;
            return this.writeConfiguration(target, key, value, resource);
        }
        $removeConfigurationOption(target, key, resourceUriComponenets) {
            const resource = resourceUriComponenets ? uri_1.URI.revive(resourceUriComponenets) : null;
            return this.writeConfiguration(target, key, undefined, resource);
        }
        writeConfiguration(target, key, value, resource) {
            target = target !== null && target !== undefined ? target : this.deriveConfigurationTarget(key, resource);
            return this.configurationService.updateValue(key, value, { resource }, target, true);
        }
        deriveConfigurationTarget(key, resource) {
            if (resource && this._workspaceContextService.getWorkbenchState() === 3 /* WORKSPACE */) {
                const configurationProperties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
                if (configurationProperties[key] && configurationProperties[key].scope === 4 /* RESOURCE */) {
                    return 5 /* WORKSPACE_FOLDER */;
                }
            }
            return 4 /* WORKSPACE */;
        }
        toConfigurationChangeEventData(event) {
            return {
                changedConfiguration: this.toJSONConfiguration(event.changedConfiguration),
                changedConfigurationByResource: event.changedConfigurationByResource.keys().reduce((result, resource) => {
                    result[resource.toString()] = this.toJSONConfiguration(event.changedConfigurationByResource.get(resource));
                    return result;
                }, Object.create({}))
            };
        }
        toJSONConfiguration({ contents, keys, overrides } = { contents: {}, keys: [], overrides: [] }) {
            return {
                contents,
                keys,
                overrides
            };
        }
    };
    MainThreadConfiguration = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadConfiguration),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, environment_1.IEnvironmentService)
    ], MainThreadConfiguration);
    exports.MainThreadConfiguration = MainThreadConfiguration;
});
//# sourceMappingURL=mainThreadConfiguration.js.map