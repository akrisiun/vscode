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
define(["require", "exports", "vs/base/node/pfs", "vs/platform/product/common/product", "vs/workbench/services/environment/common/environmentService", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/services/extensions/common/extensions", "vs/platform/commands/common/commands"], function (require, exports, pfs_1, product_1, environmentService_1, platform_1, configurationRegistry_1, extensions_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DefaultConfigurationExportHelper = void 0;
    let DefaultConfigurationExportHelper = /** @class */ (() => {
        let DefaultConfigurationExportHelper = class DefaultConfigurationExportHelper {
            constructor(environmentService, extensionService, commandService) {
                this.extensionService = extensionService;
                this.commandService = commandService;
                if (environmentService.args['export-default-configuration']) {
                    this.writeConfigModelAndQuit(environmentService.args['export-default-configuration']);
                }
            }
            writeConfigModelAndQuit(targetPath) {
                return Promise.resolve(this.extensionService.whenInstalledExtensionsRegistered())
                    .then(() => this.writeConfigModel(targetPath))
                    .finally(() => this.commandService.executeCommand('workbench.action.quit'))
                    .then(() => { });
            }
            writeConfigModel(targetPath) {
                const config = this.getConfigModel();
                const resultString = JSON.stringify(config, undefined, '  ');
                return pfs_1.writeFile(targetPath, resultString);
            }
            getConfigModel() {
                const configRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
                const configurations = configRegistry.getConfigurations().slice();
                const settings = [];
                const processedNames = new Set();
                const processProperty = (name, prop) => {
                    if (processedNames.has(name)) {
                        throw new Error('Setting is registered twice: ' + name);
                    }
                    processedNames.add(name);
                    const propDetails = {
                        name,
                        description: prop.description || prop.markdownDescription || '',
                        default: prop.default,
                        type: prop.type
                    };
                    if (prop.enum) {
                        propDetails.enum = prop.enum;
                    }
                    if (prop.enumDescriptions || prop.markdownEnumDescriptions) {
                        propDetails.enumDescriptions = prop.enumDescriptions || prop.markdownEnumDescriptions;
                    }
                    settings.push(propDetails);
                };
                const processConfig = (config) => {
                    if (config.properties) {
                        for (let name in config.properties) {
                            processProperty(name, config.properties[name]);
                        }
                    }
                    if (config.allOf) {
                        config.allOf.forEach(processConfig);
                    }
                };
                configurations.forEach(processConfig);
                const excludedProps = configRegistry.getExcludedConfigurationProperties();
                for (let name in excludedProps) {
                    processProperty(name, excludedProps[name]);
                }
                const result = {
                    settings: settings.sort((a, b) => a.name.localeCompare(b.name)),
                    buildTime: Date.now(),
                    commit: product_1.default.commit,
                    buildNumber: product_1.default.settingsSearchBuildId
                };
                return result;
            }
        };
        DefaultConfigurationExportHelper = __decorate([
            __param(0, environmentService_1.IWorkbenchEnvironmentService),
            __param(1, extensions_1.IExtensionService),
            __param(2, commands_1.ICommandService)
        ], DefaultConfigurationExportHelper);
        return DefaultConfigurationExportHelper;
    })();
    exports.DefaultConfigurationExportHelper = DefaultConfigurationExportHelper;
});
//# sourceMappingURL=configurationExportHelper.js.map