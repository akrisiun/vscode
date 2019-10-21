/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/platform/registry/common/platform", "vs/base/common/types", "vs/base/common/strings", "vs/platform/jsonschemas/common/jsonContributionRegistry"], function (require, exports, nls, event_1, platform_1, types, strings, jsonContributionRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Extensions = {
        Configuration: 'base.contributions.configuration'
    };
    var ConfigurationScope;
    (function (ConfigurationScope) {
        /**
         * Application specific configuration, which can be configured only in local user settings.
         */
        ConfigurationScope[ConfigurationScope["APPLICATION"] = 1] = "APPLICATION";
        /**
         * Machine specific configuration, which can be configured only in local and remote user settings.
         */
        ConfigurationScope[ConfigurationScope["MACHINE"] = 2] = "MACHINE";
        /**
         * Window specific configuration, which can be configured in the user or workspace settings.
         */
        ConfigurationScope[ConfigurationScope["WINDOW"] = 3] = "WINDOW";
        /**
         * Resource specific configuration, which can be configured in the user, workspace or folder settings.
         */
        ConfigurationScope[ConfigurationScope["RESOURCE"] = 4] = "RESOURCE";
        /**
         * Machine specific configuration that can also be configured in workspace or folder settings.
         */
        ConfigurationScope[ConfigurationScope["MACHINE_OVERRIDABLE"] = 5] = "MACHINE_OVERRIDABLE";
    })(ConfigurationScope = exports.ConfigurationScope || (exports.ConfigurationScope = {}));
    exports.allSettings = { properties: {}, patternProperties: {} };
    exports.applicationSettings = { properties: {}, patternProperties: {} };
    exports.machineSettings = { properties: {}, patternProperties: {} };
    exports.machineOverridableSettings = { properties: {}, patternProperties: {} };
    exports.windowSettings = { properties: {}, patternProperties: {} };
    exports.resourceSettings = { properties: {}, patternProperties: {} };
    exports.editorConfigurationSchemaId = 'vscode://schemas/settings/editor';
    const contributionRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    class ConfigurationRegistry {
        constructor() {
            this.overrideIdentifiers = [];
            this._onDidSchemaChange = new event_1.Emitter();
            this.onDidSchemaChange = this._onDidSchemaChange.event;
            this._onDidUpdateConfiguration = new event_1.Emitter();
            this.onDidUpdateConfiguration = this._onDidUpdateConfiguration.event;
            this.defaultOverridesConfigurationNode = {
                id: 'defaultOverrides',
                title: nls.localize('defaultConfigurations.title', "Default Configuration Overrides"),
                properties: {}
            };
            this.configurationContributors = [this.defaultOverridesConfigurationNode];
            this.editorConfigurationSchema = { properties: {}, patternProperties: {}, additionalProperties: false, errorMessage: 'Unknown editor configuration setting', allowTrailingCommas: true, allowComments: true };
            this.configurationProperties = {};
            this.excludedConfigurationProperties = {};
            this.overridePropertyPattern = this.computeOverridePropertyPattern();
            contributionRegistry.registerSchema(exports.editorConfigurationSchemaId, this.editorConfigurationSchema);
        }
        registerConfiguration(configuration, validate = true) {
            this.registerConfigurations([configuration], validate);
        }
        registerConfigurations(configurations, validate = true) {
            const properties = [];
            configurations.forEach(configuration => {
                properties.push(...this.validateAndRegisterProperties(configuration, validate)); // fills in defaults
                this.configurationContributors.push(configuration);
                this.registerJSONConfiguration(configuration);
                this.updateSchemaForOverrideSettingsConfiguration(configuration);
            });
            this._onDidSchemaChange.fire();
            this._onDidUpdateConfiguration.fire(properties);
        }
        deregisterConfigurations(configurations) {
            const properties = [];
            const deregisterConfiguration = (configuration) => {
                if (configuration.properties) {
                    for (const key in configuration.properties) {
                        properties.push(key);
                        delete this.configurationProperties[key];
                        delete this.editorConfigurationSchema.properties[key];
                        // Delete from schema
                        delete exports.allSettings.properties[key];
                        switch (configuration.properties[key].scope) {
                            case 1 /* APPLICATION */:
                                delete exports.applicationSettings.properties[key];
                                break;
                            case 2 /* MACHINE */:
                                delete exports.machineSettings.properties[key];
                                break;
                            case 5 /* MACHINE_OVERRIDABLE */:
                                delete exports.machineOverridableSettings.properties[key];
                                break;
                            case 3 /* WINDOW */:
                                delete exports.windowSettings.properties[key];
                                break;
                            case 4 /* RESOURCE */:
                                delete exports.resourceSettings.properties[key];
                                break;
                        }
                    }
                }
                if (configuration.allOf) {
                    configuration.allOf.forEach(node => deregisterConfiguration(node));
                }
            };
            for (const configuration of configurations) {
                deregisterConfiguration(configuration);
                const index = this.configurationContributors.indexOf(configuration);
                if (index !== -1) {
                    this.configurationContributors.splice(index, 1);
                }
            }
            contributionRegistry.registerSchema(exports.editorConfigurationSchemaId, this.editorConfigurationSchema);
            this._onDidSchemaChange.fire();
            this._onDidUpdateConfiguration.fire(properties);
        }
        registerDefaultConfigurations(defaultConfigurations) {
            const properties = [];
            for (const defaultConfiguration of defaultConfigurations) {
                for (const key in defaultConfiguration.defaults) {
                    const defaultValue = defaultConfiguration.defaults[key];
                    if (exports.OVERRIDE_PROPERTY_PATTERN.test(key) && typeof defaultValue === 'object') {
                        const propertySchema = {
                            type: 'object',
                            default: defaultValue,
                            description: nls.localize('overrideSettings.description', "Configure editor settings to be overridden for {0} language.", key),
                            $ref: exports.editorConfigurationSchemaId
                        };
                        exports.allSettings.properties[key] = propertySchema;
                        this.defaultOverridesConfigurationNode.properties[key] = propertySchema;
                        this.configurationProperties[key] = propertySchema;
                        properties.push(key);
                    }
                }
            }
            this._onDidSchemaChange.fire();
            this._onDidUpdateConfiguration.fire(properties);
        }
        deregisterDefaultConfigurations(defaultConfigurations) {
            const properties = [];
            for (const defaultConfiguration of defaultConfigurations) {
                for (const key in defaultConfiguration.defaults) {
                    properties.push(key);
                    delete exports.allSettings.properties[key];
                    delete this.defaultOverridesConfigurationNode.properties[key];
                    delete this.configurationProperties[key];
                }
            }
            this._onDidSchemaChange.fire();
            this._onDidUpdateConfiguration.fire(properties);
        }
        notifyConfigurationSchemaUpdated(...configurations) {
            this._onDidSchemaChange.fire();
        }
        registerOverrideIdentifiers(overrideIdentifiers) {
            this.overrideIdentifiers.push(...overrideIdentifiers);
            this.updateOverridePropertyPatternKey();
        }
        validateAndRegisterProperties(configuration, validate = true, scope = 3 /* WINDOW */, overridable = false) {
            scope = types.isUndefinedOrNull(configuration.scope) ? scope : configuration.scope;
            overridable = configuration.overridable || overridable;
            let propertyKeys = [];
            let properties = configuration.properties;
            if (properties) {
                for (let key in properties) {
                    let message;
                    if (validate && (message = validateProperty(key))) {
                        console.warn(message);
                        delete properties[key];
                        continue;
                    }
                    // fill in default values
                    let property = properties[key];
                    let defaultValue = property.default;
                    if (types.isUndefined(defaultValue)) {
                        property.default = getDefaultValue(property.type);
                    }
                    // Inherit overridable property from parent
                    if (overridable) {
                        property.overridable = true;
                    }
                    if (exports.OVERRIDE_PROPERTY_PATTERN.test(key)) {
                        property.scope = undefined; // No scope for overridable properties `[${identifier}]`
                    }
                    else {
                        property.scope = types.isUndefinedOrNull(property.scope) ? scope : property.scope;
                    }
                    // Add to properties maps
                    // Property is included by default if 'included' is unspecified
                    if (properties[key].hasOwnProperty('included') && !properties[key].included) {
                        this.excludedConfigurationProperties[key] = properties[key];
                        delete properties[key];
                        continue;
                    }
                    else {
                        this.configurationProperties[key] = properties[key];
                    }
                    propertyKeys.push(key);
                }
            }
            let subNodes = configuration.allOf;
            if (subNodes) {
                for (let node of subNodes) {
                    propertyKeys.push(...this.validateAndRegisterProperties(node, validate, scope, overridable));
                }
            }
            return propertyKeys;
        }
        getConfigurations() {
            return this.configurationContributors;
        }
        getConfigurationProperties() {
            return this.configurationProperties;
        }
        getExcludedConfigurationProperties() {
            return this.excludedConfigurationProperties;
        }
        registerJSONConfiguration(configuration) {
            function register(configuration) {
                let properties = configuration.properties;
                if (properties) {
                    for (const key in properties) {
                        exports.allSettings.properties[key] = properties[key];
                        switch (properties[key].scope) {
                            case 1 /* APPLICATION */:
                                exports.applicationSettings.properties[key] = properties[key];
                                break;
                            case 2 /* MACHINE */:
                                exports.machineSettings.properties[key] = properties[key];
                                break;
                            case 5 /* MACHINE_OVERRIDABLE */:
                                exports.machineOverridableSettings.properties[key] = properties[key];
                                break;
                            case 3 /* WINDOW */:
                                exports.windowSettings.properties[key] = properties[key];
                                break;
                            case 4 /* RESOURCE */:
                                exports.resourceSettings.properties[key] = properties[key];
                                break;
                        }
                    }
                }
                let subNodes = configuration.allOf;
                if (subNodes) {
                    subNodes.forEach(register);
                }
            }
            register(configuration);
        }
        updateSchemaForOverrideSettingsConfiguration(configuration) {
            if (configuration.id !== SETTINGS_OVERRRIDE_NODE_ID) {
                this.update(configuration);
                contributionRegistry.registerSchema(exports.editorConfigurationSchemaId, this.editorConfigurationSchema);
            }
        }
        updateOverridePropertyPatternKey() {
            let patternProperties = exports.allSettings.patternProperties[this.overridePropertyPattern];
            if (!patternProperties) {
                patternProperties = {
                    type: 'object',
                    description: nls.localize('overrideSettings.defaultDescription', "Configure editor settings to be overridden for a language."),
                    errorMessage: 'Unknown Identifier. Use language identifiers',
                    $ref: exports.editorConfigurationSchemaId
                };
            }
            delete exports.allSettings.patternProperties[this.overridePropertyPattern];
            delete exports.applicationSettings.patternProperties[this.overridePropertyPattern];
            delete exports.machineSettings.patternProperties[this.overridePropertyPattern];
            delete exports.machineOverridableSettings.patternProperties[this.overridePropertyPattern];
            delete exports.windowSettings.patternProperties[this.overridePropertyPattern];
            delete exports.resourceSettings.patternProperties[this.overridePropertyPattern];
            this.overridePropertyPattern = this.computeOverridePropertyPattern();
            exports.allSettings.patternProperties[this.overridePropertyPattern] = patternProperties;
            exports.applicationSettings.patternProperties[this.overridePropertyPattern] = patternProperties;
            exports.machineSettings.patternProperties[this.overridePropertyPattern] = patternProperties;
            exports.machineOverridableSettings.patternProperties[this.overridePropertyPattern] = patternProperties;
            exports.windowSettings.patternProperties[this.overridePropertyPattern] = patternProperties;
            exports.resourceSettings.patternProperties[this.overridePropertyPattern] = patternProperties;
            this._onDidSchemaChange.fire();
        }
        update(configuration) {
            let properties = configuration.properties;
            if (properties) {
                for (let key in properties) {
                    if (properties[key].overridable) {
                        this.editorConfigurationSchema.properties[key] = this.getConfigurationProperties()[key];
                    }
                }
            }
            let subNodes = configuration.allOf;
            if (subNodes) {
                subNodes.forEach(subNode => this.update(subNode));
            }
        }
        computeOverridePropertyPattern() {
            return this.overrideIdentifiers.length ? OVERRIDE_PATTERN_WITH_SUBSTITUTION.replace('${0}', this.overrideIdentifiers.map(identifier => strings.createRegExp(identifier, false).source).join('|')) : OVERRIDE_PROPERTY;
        }
    }
    const SETTINGS_OVERRRIDE_NODE_ID = 'override';
    const OVERRIDE_PROPERTY = '\\[.*\\]$';
    const OVERRIDE_PATTERN_WITH_SUBSTITUTION = '\\[(${0})\\]$';
    exports.OVERRIDE_PROPERTY_PATTERN = new RegExp(OVERRIDE_PROPERTY);
    function getDefaultValue(type) {
        const t = Array.isArray(type) ? type[0] : type;
        switch (t) {
            case 'boolean':
                return false;
            case 'integer':
            case 'number':
                return 0;
            case 'string':
                return '';
            case 'array':
                return [];
            case 'object':
                return {};
            default:
                return null;
        }
    }
    exports.getDefaultValue = getDefaultValue;
    const configurationRegistry = new ConfigurationRegistry();
    platform_1.Registry.add(exports.Extensions.Configuration, configurationRegistry);
    function validateProperty(property) {
        if (exports.OVERRIDE_PROPERTY_PATTERN.test(property)) {
            return nls.localize('config.property.languageDefault', "Cannot register '{0}'. This matches property pattern '\\\\[.*\\\\]$' for describing language specific editor settings. Use 'configurationDefaults' contribution.", property);
        }
        if (configurationRegistry.getConfigurationProperties()[property] !== undefined) {
            return nls.localize('config.property.duplicate', "Cannot register '{0}'. This property is already registered.", property);
        }
        return null;
    }
    exports.validateProperty = validateProperty;
    function getScopes() {
        const scopes = [];
        const configurationProperties = configurationRegistry.getConfigurationProperties();
        for (const key of Object.keys(configurationProperties)) {
            scopes.push([key, configurationProperties[key].scope]);
        }
        scopes.push(['launch', 4 /* RESOURCE */]);
        scopes.push(['task', 4 /* RESOURCE */]);
        return scopes;
    }
    exports.getScopes = getScopes;
});
//# sourceMappingURL=configurationRegistry.js.map