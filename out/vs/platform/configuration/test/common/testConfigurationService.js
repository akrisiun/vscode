/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/map", "vs/platform/configuration/common/configuration"], function (require, exports, map_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestConfigurationService {
        constructor() {
            this.configuration = Object.create(null);
            this.configurationByRoot = map_1.TernarySearchTree.forPaths();
        }
        reloadConfiguration() {
            return Promise.resolve(this.getValue());
        }
        getValue(arg1, arg2) {
            let configuration;
            const overrides = configuration_1.isConfigurationOverrides(arg1) ? arg1 : configuration_1.isConfigurationOverrides(arg2) ? arg2 : undefined;
            if (overrides) {
                if (overrides.resource) {
                    configuration = this.configurationByRoot.findSubstr(overrides.resource.fsPath);
                }
            }
            configuration = configuration ? configuration : this.configuration;
            if (arg1 && typeof arg1 === 'string') {
                return configuration_1.getConfigurationValue(configuration, arg1);
            }
            return configuration;
        }
        updateValue(key, overrides) {
            return Promise.resolve(undefined);
        }
        setUserConfiguration(key, value, root) {
            if (root) {
                const configForRoot = this.configurationByRoot.get(root.fsPath) || Object.create(null);
                configForRoot[key] = value;
                this.configurationByRoot.set(root.fsPath, configForRoot);
            }
            else {
                this.configuration[key] = value;
            }
            return Promise.resolve(undefined);
        }
        onDidChangeConfiguration() {
            return { dispose() { } };
        }
        inspect(key, overrides) {
            const config = this.getValue(undefined, overrides);
            return {
                value: configuration_1.getConfigurationValue(config, key),
                default: configuration_1.getConfigurationValue(config, key),
                user: configuration_1.getConfigurationValue(config, key),
                workspace: undefined,
                workspaceFolder: undefined
            };
        }
        keys() {
            return {
                default: configuration_1.getConfigurationKeys(),
                user: Object.keys(this.configuration),
                workspace: [],
                workspaceFolder: []
            };
        }
        getConfigurationData() {
            return null;
        }
    }
    exports.TestConfigurationService = TestConfigurationService;
});
//# sourceMappingURL=testConfigurationService.js.map