/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationModels", "vs/base/common/event", "vs/base/common/async"], function (require, exports, platform_1, configurationRegistry_1, lifecycle_1, configuration_1, configurationModels_1, event_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfigurationService = void 0;
    class ConfigurationService extends lifecycle_1.Disposable {
        constructor(settingsResource, fileService) {
            super();
            this.settingsResource = settingsResource;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this.userConfiguration = this._register(new configurationModels_1.UserSettings(this.settingsResource, undefined, fileService));
            this.configuration = new configurationModels_1.Configuration(new configurationModels_1.DefaultConfigurationModel(), new configurationModels_1.ConfigurationModel());
            this.reloadConfigurationScheduler = this._register(new async_1.RunOnceScheduler(() => this.reloadConfiguration(), 50));
            this._register(platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).onDidUpdateConfiguration(configurationProperties => this.onDidDefaultConfigurationChange(configurationProperties)));
            this._register(this.userConfiguration.onDidChange(() => this.reloadConfigurationScheduler.schedule()));
        }
        async initialize() {
            const userConfiguration = await this.userConfiguration.loadConfiguration();
            this.configuration = new configurationModels_1.Configuration(new configurationModels_1.DefaultConfigurationModel(), userConfiguration);
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
        async reloadConfiguration() {
            const configurationModel = await this.userConfiguration.loadConfiguration();
            this.onDidChangeUserConfiguration(configurationModel);
        }
        onDidChangeUserConfiguration(userConfigurationModel) {
            const previous = this.configuration.toData();
            const change = this.configuration.compareAndUpdateLocalUserConfiguration(userConfigurationModel);
            this.trigger(change, previous, 1 /* USER */);
        }
        onDidDefaultConfigurationChange(keys) {
            const previous = this.configuration.toData();
            const change = this.configuration.compareAndUpdateDefaultConfiguration(new configurationModels_1.DefaultConfigurationModel(), keys);
            this.trigger(change, previous, 6 /* DEFAULT */);
        }
        trigger(configurationChange, previous, source) {
            const event = new configurationModels_1.ConfigurationChangeEvent(configurationChange, { data: previous }, this.configuration);
            event.source = source;
            event.sourceConfig = this.getTargetConfiguration(source);
            this._onDidChangeConfiguration.fire(event);
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