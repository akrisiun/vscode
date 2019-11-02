/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/node/pfs", "vs/base/common/path"], function (require, exports, pfs, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ConfigurationCache {
        constructor(environmentService) {
            this.environmentService = environmentService;
            this.cachedConfigurations = new Map();
        }
        read(key) {
            return this.getCachedConfiguration(key).read();
        }
        write(key, content) {
            return this.getCachedConfiguration(key).save(content);
        }
        remove(key) {
            return this.getCachedConfiguration(key).remove();
        }
        getCachedConfiguration({ type, key }) {
            const k = `${type}:${key}`;
            let cachedConfiguration = this.cachedConfigurations.get(k);
            if (!cachedConfiguration) {
                cachedConfiguration = new CachedConfiguration({ type, key }, this.environmentService);
                this.cachedConfigurations.set(k, cachedConfiguration);
            }
            return cachedConfiguration;
        }
    }
    exports.ConfigurationCache = ConfigurationCache;
    class CachedConfiguration {
        constructor({ type, key }, environmentService) {
            this.cachedConfigurationFolderPath = path_1.join(environmentService.userDataPath, 'CachedConfigurations', type, key);
            this.cachedConfigurationFilePath = path_1.join(this.cachedConfigurationFolderPath, type === 'workspaces' ? 'workspace.json' : 'configuration.json');
        }
        async read() {
            try {
                const content = await pfs.readFile(this.cachedConfigurationFilePath);
                return content.toString();
            }
            catch (e) {
                return '';
            }
        }
        async save(content) {
            const created = await this.createCachedFolder();
            if (created) {
                await pfs.writeFile(this.cachedConfigurationFilePath, content);
            }
        }
        remove() {
            return pfs.rimraf(this.cachedConfigurationFolderPath);
        }
        createCachedFolder() {
            return Promise.resolve(pfs.exists(this.cachedConfigurationFolderPath))
                .then(undefined, () => false)
                .then(exists => exists ? exists : pfs.mkdirp(this.cachedConfigurationFolderPath).then(() => true, () => false));
        }
    }
});
//# sourceMappingURL=configurationCache.js.map