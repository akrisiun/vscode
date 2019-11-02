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
define(["require", "exports", "vs/base/common/path", "vs/base/node/pfs", "vs/platform/product/common/product", "vs/base/common/lifecycle", "vs/base/common/errors", "vs/platform/log/common/log", "vs/platform/environment/common/environment"], function (require, exports, path, pfs, product_1, lifecycle_1, errors_1, log_1, environment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let LanguagePackCachedDataCleaner = class LanguagePackCachedDataCleaner extends lifecycle_1.Disposable {
        constructor(_environmentService, _logService) {
            super();
            this._environmentService = _environmentService;
            this._logService = _logService;
            // We have no Language pack support for dev version (run from source)
            // So only cleanup when we have a build version.
            if (this._environmentService.isBuilt) {
                this._manageCachedDataSoon();
            }
        }
        _manageCachedDataSoon() {
            let handle = setTimeout(async () => {
                handle = undefined;
                this._logService.info('Starting to clean up unused language packs.');
                const maxAge = product_1.default.nameLong.indexOf('Insiders') >= 0
                    ? 1000 * 60 * 60 * 24 * 7 // roughly 1 week
                    : 1000 * 60 * 60 * 24 * 30 * 3; // roughly 3 months
                try {
                    const installed = Object.create(null);
                    const metaData = JSON.parse(await pfs.readFile(path.join(this._environmentService.userDataPath, 'languagepacks.json'), 'utf8'));
                    for (let locale of Object.keys(metaData)) {
                        const entry = metaData[locale];
                        installed[`${entry.hash}.${locale}`] = true;
                    }
                    // Cleanup entries for language packs that aren't installed anymore
                    const cacheDir = path.join(this._environmentService.userDataPath, 'clp');
                    const exists = await pfs.exists(cacheDir);
                    if (!exists) {
                        return;
                    }
                    for (let entry of await pfs.readdir(cacheDir)) {
                        if (installed[entry]) {
                            this._logService.info(`Skipping directory ${entry}. Language pack still in use.`);
                            continue;
                        }
                        this._logService.info('Removing unused language pack:', entry);
                        await pfs.rimraf(path.join(cacheDir, entry));
                    }
                    const now = Date.now();
                    for (let packEntry of Object.keys(installed)) {
                        const folder = path.join(cacheDir, packEntry);
                        for (let entry of await pfs.readdir(folder)) {
                            if (entry === 'tcf.json') {
                                continue;
                            }
                            const candidate = path.join(folder, entry);
                            const stat = await pfs.stat(candidate);
                            if (stat.isDirectory()) {
                                const diff = now - stat.mtime.getTime();
                                if (diff > maxAge) {
                                    this._logService.info('Removing language pack cache entry: ', path.join(packEntry, entry));
                                    await pfs.rimraf(candidate);
                                }
                            }
                        }
                    }
                }
                catch (error) {
                    errors_1.onUnexpectedError(error);
                }
            }, 40 * 1000);
            this._register(lifecycle_1.toDisposable(() => {
                if (handle !== undefined) {
                    clearTimeout(handle);
                }
            }));
        }
    };
    LanguagePackCachedDataCleaner = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, log_1.ILogService)
    ], LanguagePackCachedDataCleaner);
    exports.LanguagePackCachedDataCleaner = LanguagePackCachedDataCleaner;
});
//# sourceMappingURL=languagePackCachedDataCleaner.js.map