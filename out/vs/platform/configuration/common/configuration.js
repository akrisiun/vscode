/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/objects", "vs/base/common/types", "vs/base/common/uri", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/instantiation", "vs/platform/configuration/common/configurationRegistry"], function (require, exports, objects, types, uri_1, platform_1, instantiation_1, configurationRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IConfigurationService = instantiation_1.createDecorator('configurationService');
    function isConfigurationOverrides(thing) {
        return thing
            && typeof thing === 'object'
            && (!thing.overrideIdentifier || typeof thing.overrideIdentifier === 'string')
            && (!thing.resource || thing.resource instanceof uri_1.URI);
    }
    exports.isConfigurationOverrides = isConfigurationOverrides;
    var ConfigurationTarget;
    (function (ConfigurationTarget) {
        ConfigurationTarget[ConfigurationTarget["USER"] = 1] = "USER";
        ConfigurationTarget[ConfigurationTarget["USER_LOCAL"] = 2] = "USER_LOCAL";
        ConfigurationTarget[ConfigurationTarget["USER_REMOTE"] = 3] = "USER_REMOTE";
        ConfigurationTarget[ConfigurationTarget["WORKSPACE"] = 4] = "WORKSPACE";
        ConfigurationTarget[ConfigurationTarget["WORKSPACE_FOLDER"] = 5] = "WORKSPACE_FOLDER";
        ConfigurationTarget[ConfigurationTarget["DEFAULT"] = 6] = "DEFAULT";
        ConfigurationTarget[ConfigurationTarget["MEMORY"] = 7] = "MEMORY";
    })(ConfigurationTarget = exports.ConfigurationTarget || (exports.ConfigurationTarget = {}));
    function ConfigurationTargetToString(configurationTarget) {
        switch (configurationTarget) {
            case 1 /* USER */: return 'USER';
            case 2 /* USER_LOCAL */: return 'USER_LOCAL';
            case 3 /* USER_REMOTE */: return 'USER_REMOTE';
            case 4 /* WORKSPACE */: return 'WORKSPACE';
            case 5 /* WORKSPACE_FOLDER */: return 'WORKSPACE_FOLDER';
            case 6 /* DEFAULT */: return 'DEFAULT';
            case 7 /* MEMORY */: return 'MEMORY';
        }
    }
    exports.ConfigurationTargetToString = ConfigurationTargetToString;
    function compare(from, to) {
        const added = to.keys.filter(key => from.keys.indexOf(key) === -1);
        const removed = from.keys.filter(key => to.keys.indexOf(key) === -1);
        const updated = [];
        for (const key of from.keys) {
            const value1 = getConfigurationValue(from.contents, key);
            const value2 = getConfigurationValue(to.contents, key);
            if (!objects.equals(value1, value2)) {
                updated.push(key);
            }
        }
        return { added, removed, updated };
    }
    exports.compare = compare;
    function toOverrides(raw, conflictReporter) {
        const overrides = [];
        const configurationProperties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
        for (const key of Object.keys(raw)) {
            if (configurationRegistry_1.OVERRIDE_PROPERTY_PATTERN.test(key)) {
                const overrideRaw = {};
                for (const keyInOverrideRaw in raw[key]) {
                    if (configurationProperties[keyInOverrideRaw] && configurationProperties[keyInOverrideRaw].overridable) {
                        overrideRaw[keyInOverrideRaw] = raw[key][keyInOverrideRaw];
                    }
                }
                overrides.push({
                    identifiers: [overrideIdentifierFromKey(key).trim()],
                    contents: toValuesTree(overrideRaw, conflictReporter)
                });
            }
        }
        return overrides;
    }
    exports.toOverrides = toOverrides;
    function toValuesTree(properties, conflictReporter) {
        const root = Object.create(null);
        for (let key in properties) {
            addToValueTree(root, key, properties[key], conflictReporter);
        }
        return root;
    }
    exports.toValuesTree = toValuesTree;
    function addToValueTree(settingsTreeRoot, key, value, conflictReporter) {
        const segments = key.split('.');
        const last = segments.pop();
        let curr = settingsTreeRoot;
        for (let i = 0; i < segments.length; i++) {
            let s = segments[i];
            let obj = curr[s];
            switch (typeof obj) {
                case 'undefined':
                    obj = curr[s] = Object.create(null);
                    break;
                case 'object':
                    break;
                default:
                    conflictReporter(`Ignoring ${key} as ${segments.slice(0, i + 1).join('.')} is ${JSON.stringify(obj)}`);
                    return;
            }
            curr = obj;
        }
        if (typeof curr === 'object') {
            curr[last] = value; // workaround https://github.com/Microsoft/vscode/issues/13606
        }
        else {
            conflictReporter(`Ignoring ${key} as ${segments.join('.')} is ${JSON.stringify(curr)}`);
        }
    }
    exports.addToValueTree = addToValueTree;
    function removeFromValueTree(valueTree, key) {
        const segments = key.split('.');
        doRemoveFromValueTree(valueTree, segments);
    }
    exports.removeFromValueTree = removeFromValueTree;
    function doRemoveFromValueTree(valueTree, segments) {
        const first = segments.shift();
        if (segments.length === 0) {
            // Reached last segment
            delete valueTree[first];
            return;
        }
        if (Object.keys(valueTree).indexOf(first) !== -1) {
            const value = valueTree[first];
            if (typeof value === 'object' && !Array.isArray(value)) {
                doRemoveFromValueTree(value, segments);
                if (Object.keys(value).length === 0) {
                    delete valueTree[first];
                }
            }
        }
    }
    /**
     * A helper function to get the configuration value with a specific settings path (e.g. config.some.setting)
     */
    function getConfigurationValue(config, settingPath, defaultValue) {
        function accessSetting(config, path) {
            let current = config;
            for (const component of path) {
                if (typeof current !== 'object' || current === null) {
                    return undefined;
                }
                current = current[component];
            }
            return current;
        }
        const path = settingPath.split('.');
        const result = accessSetting(config, path);
        return typeof result === 'undefined' ? defaultValue : result;
    }
    exports.getConfigurationValue = getConfigurationValue;
    function merge(base, add, overwrite) {
        Object.keys(add).forEach(key => {
            if (key in base) {
                if (types.isObject(base[key]) && types.isObject(add[key])) {
                    merge(base[key], add[key], overwrite);
                }
                else if (overwrite) {
                    base[key] = add[key];
                }
            }
            else {
                base[key] = add[key];
            }
        });
    }
    exports.merge = merge;
    function getConfigurationKeys() {
        const properties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
        return Object.keys(properties);
    }
    exports.getConfigurationKeys = getConfigurationKeys;
    function getDefaultValues() {
        const valueTreeRoot = Object.create(null);
        const properties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
        for (let key in properties) {
            let value = properties[key].default;
            addToValueTree(valueTreeRoot, key, value, message => console.error(`Conflict in default settings: ${message}`));
        }
        return valueTreeRoot;
    }
    exports.getDefaultValues = getDefaultValues;
    function overrideIdentifierFromKey(key) {
        return key.substring(1, key.length - 1);
    }
    exports.overrideIdentifierFromKey = overrideIdentifierFromKey;
    function keyFromOverrideIdentifier(overrideIdentifier) {
        return `[${overrideIdentifier}]`;
    }
    exports.keyFromOverrideIdentifier = keyFromOverrideIdentifier;
    function getMigratedSettingValue(configurationService, currentSettingName, legacySettingName) {
        const setting = configurationService.inspect(currentSettingName);
        const legacySetting = configurationService.inspect(legacySettingName);
        if (typeof setting.user !== 'undefined' || typeof setting.workspace !== 'undefined' || typeof setting.workspaceFolder !== 'undefined') {
            return setting.value;
        }
        else if (typeof legacySetting.user !== 'undefined' || typeof legacySetting.workspace !== 'undefined' || typeof legacySetting.workspaceFolder !== 'undefined') {
            return legacySetting.value;
        }
        else {
            return setting.default;
        }
    }
    exports.getMigratedSettingValue = getMigratedSettingValue;
});
//# sourceMappingURL=configuration.js.map