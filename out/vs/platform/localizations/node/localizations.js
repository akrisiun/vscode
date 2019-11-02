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
define(["require", "exports", "vs/base/node/pfs", "crypto", "vs/platform/extensionManagement/common/extensionManagement", "vs/base/common/lifecycle", "vs/platform/environment/common/environment", "vs/base/common/async", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/log/common/log", "vs/platform/localizations/common/localizations", "vs/platform/product/common/product", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/network", "vs/base/common/path"], function (require, exports, pfs, crypto_1, extensionManagement_1, lifecycle_1, environment_1, async_1, extensionManagementUtil_1, log_1, localizations_1, product_1, arrays_1, event_1, network_1, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const systemLanguages = ['de', 'en', 'en-US', 'es', 'fr', 'it', 'ja', 'ko', 'ru', 'zh-CN', 'zh-TW'];
    if (product_1.default.quality !== 'stable') {
        systemLanguages.push('hu');
    }
    let LocalizationsService = class LocalizationsService extends lifecycle_1.Disposable {
        constructor(extensionManagementService, environmentService, logService) {
            super();
            this.extensionManagementService = extensionManagementService;
            this.logService = logService;
            this._onDidLanguagesChange = this._register(new event_1.Emitter());
            this.onDidLanguagesChange = this._onDidLanguagesChange.event;
            this.cache = this._register(new LanguagePacksCache(environmentService, logService));
            this._register(extensionManagementService.onDidInstallExtension(({ local }) => this.onDidInstallExtension(local)));
            this._register(extensionManagementService.onDidUninstallExtension(({ identifier }) => this.onDidUninstallExtension(identifier)));
        }
        getLanguageIds(type) {
            if (type === 1 /* Core */) {
                return Promise.resolve([...systemLanguages]);
            }
            return this.cache.getLanguagePacks()
                .then(languagePacks => {
                const languages = type === 2 /* Contributed */ ? Object.keys(languagePacks) : [...systemLanguages, ...Object.keys(languagePacks)];
                return arrays_1.distinct(languages);
            });
        }
        onDidInstallExtension(extension) {
            if (extension && extension.manifest && extension.manifest.contributes && extension.manifest.contributes.localizations && extension.manifest.contributes.localizations.length) {
                this.logService.debug('Adding language packs from the extension', extension.identifier.id);
                this.update().then(changed => { if (changed) {
                    this._onDidLanguagesChange.fire();
                } });
            }
        }
        onDidUninstallExtension(identifier) {
            this.cache.getLanguagePacks()
                .then(languagePacks => {
                if (Object.keys(languagePacks).some(language => languagePacks[language] && languagePacks[language].extensions.some(e => extensionManagementUtil_1.areSameExtensions(e.extensionIdentifier, identifier)))) {
                    this.logService.debug('Removing language packs from the extension', identifier.id);
                    this.update().then(changed => { if (changed) {
                        this._onDidLanguagesChange.fire();
                    } });
                }
            });
        }
        update() {
            return Promise.all([this.cache.getLanguagePacks(), this.extensionManagementService.getInstalled()])
                .then(([current, installed]) => this.cache.update(installed)
                .then(updated => !arrays_1.equals(Object.keys(current), Object.keys(updated))));
        }
    };
    LocalizationsService = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementService),
        __param(1, environment_1.IEnvironmentService),
        __param(2, log_1.ILogService)
    ], LocalizationsService);
    exports.LocalizationsService = LocalizationsService;
    let LanguagePacksCache = class LanguagePacksCache extends lifecycle_1.Disposable {
        constructor(environmentService, logService) {
            super();
            this.logService = logService;
            this.languagePacks = {};
            this.languagePacksFilePath = path_1.join(environmentService.userDataPath, 'languagepacks.json');
            this.languagePacksFileLimiter = new async_1.Queue();
        }
        getLanguagePacks() {
            // if queue is not empty, fetch from disk
            if (this.languagePacksFileLimiter.size || !this.initializedCache) {
                return this.withLanguagePacks()
                    .then(() => this.languagePacks);
            }
            return Promise.resolve(this.languagePacks);
        }
        update(extensions) {
            return this.withLanguagePacks(languagePacks => {
                Object.keys(languagePacks).forEach(language => delete languagePacks[language]);
                this.createLanguagePacksFromExtensions(languagePacks, ...extensions);
            }).then(() => this.languagePacks);
        }
        createLanguagePacksFromExtensions(languagePacks, ...extensions) {
            for (const extension of extensions) {
                if (extension && extension.manifest && extension.manifest.contributes && extension.manifest.contributes.localizations && extension.manifest.contributes.localizations.length) {
                    this.createLanguagePacksFromExtension(languagePacks, extension);
                }
            }
            Object.keys(languagePacks).forEach(languageId => this.updateHash(languagePacks[languageId]));
        }
        createLanguagePacksFromExtension(languagePacks, extension) {
            const extensionIdentifier = extension.identifier;
            const localizations = extension.manifest.contributes && extension.manifest.contributes.localizations ? extension.manifest.contributes.localizations : [];
            for (const localizationContribution of localizations) {
                if (extension.location.scheme === network_1.Schemas.file && localizations_1.isValidLocalization(localizationContribution)) {
                    let languagePack = languagePacks[localizationContribution.languageId];
                    if (!languagePack) {
                        languagePack = { hash: '', extensions: [], translations: {} };
                        languagePacks[localizationContribution.languageId] = languagePack;
                    }
                    let extensionInLanguagePack = languagePack.extensions.filter(e => extensionManagementUtil_1.areSameExtensions(e.extensionIdentifier, extensionIdentifier))[0];
                    if (extensionInLanguagePack) {
                        extensionInLanguagePack.version = extension.manifest.version;
                    }
                    else {
                        languagePack.extensions.push({ extensionIdentifier, version: extension.manifest.version });
                    }
                    for (const translation of localizationContribution.translations) {
                        languagePack.translations[translation.id] = path_1.join(extension.location.fsPath, translation.path);
                    }
                }
            }
        }
        updateHash(languagePack) {
            if (languagePack) {
                const md5 = crypto_1.createHash('md5');
                for (const extension of languagePack.extensions) {
                    md5.update(extension.extensionIdentifier.uuid || extension.extensionIdentifier.id).update(extension.version);
                }
                languagePack.hash = md5.digest('hex');
            }
        }
        withLanguagePacks(fn = () => null) {
            return this.languagePacksFileLimiter.queue(() => {
                let result = null;
                return pfs.readFile(this.languagePacksFilePath, 'utf8')
                    .then(undefined, err => err.code === 'ENOENT' ? Promise.resolve('{}') : Promise.reject(err))
                    .then(raw => { try {
                    return JSON.parse(raw);
                }
                catch (e) {
                    return {};
                } })
                    .then(languagePacks => { result = fn(languagePacks); return languagePacks; })
                    .then(languagePacks => {
                    for (const language of Object.keys(languagePacks)) {
                        if (!languagePacks[language]) {
                            delete languagePacks[language];
                        }
                    }
                    this.languagePacks = languagePacks;
                    this.initializedCache = true;
                    const raw = JSON.stringify(this.languagePacks);
                    this.logService.debug('Writing language packs', raw);
                    return pfs.writeFile(this.languagePacksFilePath, raw);
                })
                    .then(() => result, error => this.logService.error(error));
            });
        }
    };
    LanguagePacksCache = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, log_1.ILogService)
    ], LanguagePacksCache);
});
//# sourceMappingURL=localizations.js.map