/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationModels", "vs/base/common/event", "vs/base/node/config", "vs/base/common/errors", "vs/base/common/network"], function (require, exports, platform_1, configurationRegistry_1, lifecycle_1, configuration_1, configurationModels_1, event_1, config_1, errors_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ConfigurationService extends lifecycle_1.Disposable {
        constructor(settingsResource) {
            super();
            this.settingsResource = settingsResource;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this.configuration = new configurationModels_1.Configuration(new configurationModels_1.DefaultConfigurationModel(), new configurationModels_1.ConfigurationModel());
            this._register(platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).onDidUpdateConfiguration(configurationProperties => this.onDidDefaultConfigurationChange(configurationProperties)));
        }
        initialize() {
            if (this.userConfigModelWatcher) {
                this.userConfigModelWatcher.dispose();
            }
            if (this.settingsResource.scheme !== network_1.Schemas.file) {
                return Promise.resolve();
            }
            return new Promise((c, e) => {
                this.userConfigModelWatcher = this._register(new config_1.ConfigWatcher(this.settingsResource.fsPath, {
                    changeBufferDelay: 300, onError: error => errors_1.onUnexpectedError(error), defaultConfig: new configurationModels_1.ConfigurationModelParser(this.settingsResource.fsPath), parse: (content, parseErrors) => {
                        const userConfigModelParser = new configurationModels_1.ConfigurationModelParser(this.settingsResource.fsPath);
                        userConfigModelParser.parseContent(content);
                        parseErrors = [...userConfigModelParser.errors];
                        return userConfigModelParser;
                    }, initCallback: () => {
                        this.configuration = new configurationModels_1.Configuration(new configurationModels_1.DefaultConfigurationModel(), this.userConfigModelWatcher.getConfig().configurationModel);
                        this._register(this.userConfigModelWatcher.onDidUpdateConfiguration(() => this.onDidChangeUserConfiguration(this.userConfigModelWatcher.getConfig().configurationModel)));
                        c();
                    }
                }));
            });
        }
        getConfigurationData() {
            return this.configuration.toData();
        }
        getValue(arg1, arg2) {
            const section = typeof arg1 === 'string' ? arg1 : undefined;
            const overrides = configuration_1.isConfigurationOverrides(arg1) ? arg1 : configuration_1.isConfigurationOverrides(arg2) ? arg2 : {};
            return this.configuration.getValue(section, overrides, undefined);
        }
        updateValue(key, value, arg3, arg4) {
            return Promise.reject(new Error('not supported'));
        }
        inspect(key) {
            return this.configuration.inspect(key, {}, undefined);
        }
        keys() {
            return this.configuration.keys(undefined);
        }
        reloadConfiguration(folder) {
            if (this.userConfigModelWatcher) {
                return new Promise(c => this.userConfigModelWatcher.reload(userConfigModelParser => {
                    this.onDidChangeUserConfiguration(userConfigModelParser.configurationModel);
                    c();
                }));
            }
            return this.initialize();
        }
        onDidChangeUserConfiguration(userConfigurationModel) {
            const { added, updated, removed } = configuration_1.compare(this.configuration.localUserConfiguration, userConfigurationModel);
            const changedKeys = [...added, ...updated, ...removed];
            if (changedKeys.length) {
                this.configuration.updateLocalUserConfiguration(userConfigurationModel);
                this.trigger(changedKeys, 1 /* USER */);
            }
        }
        onDidDefaultConfigurationChange(keys) {
            this.configuration.updateDefaultConfiguration(new configurationModels_1.DefaultConfigurationModel());
            this.trigger(keys, 6 /* DEFAULT */);
        }
        trigger(keys, source) {
            this._onDidChangeConfiguration.fire(new configurationModels_1.ConfigurationChangeEvent().change(keys).telemetryData(source, this.getTargetConfiguration(source)));
        }
        getTargetConfiguration(target) {
            switch (target) {
                case 6 /* DEFAULT */:
                    return this.configuration.defaults.contents;
                case 1 /* USER */:
                    return this.configuration.localUserConfiguration.contents;
            }
            return {};
        }
    }
    exports.ConfigurationService = ConfigurationService;
});
//# sourceMappingURL=configurationService.js.map