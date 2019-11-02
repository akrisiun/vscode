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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/common/actions", "vs/platform/actions/common/actions", "vs/base/common/lifecycle", "vs/workbench/contrib/localizations/browser/localizationsActions", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/base/common/platform", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/notification/common/notification", "vs/base/common/severity", "vs/workbench/services/configuration/common/jsonEditing", "vs/platform/environment/common/environment", "vs/workbench/services/host/browser/host", "vs/platform/storage/common/storage", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/localizations/browser/minimalTranslations", "vs/platform/telemetry/common/telemetry", "vs/base/common/cancellation"], function (require, exports, nls_1, platform_1, contributions_1, actions_1, actions_2, lifecycle_1, localizationsActions_1, extensionsRegistry_1, platform, extensionManagement_1, notification_1, severity_1, jsonEditing_1, environment_1, host_1, storage_1, viewlet_1, extensions_1, minimalTranslations_1, telemetry_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Register action to configure locale and related settings
    const registry = platform_1.Registry.as(actions_1.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(localizationsActions_1.ConfigureLocaleAction, localizationsActions_1.ConfigureLocaleAction.ID, localizationsActions_1.ConfigureLocaleAction.LABEL), 'Configure Display Language');
    let LocalizationWorkbenchContribution = class LocalizationWorkbenchContribution extends lifecycle_1.Disposable {
        constructor(notificationService, jsonEditingService, environmentService, hostService, storageService, extensionManagementService, galleryService, viewletService, telemetryService) {
            super();
            this.notificationService = notificationService;
            this.jsonEditingService = jsonEditingService;
            this.environmentService = environmentService;
            this.hostService = hostService;
            this.storageService = storageService;
            this.extensionManagementService = extensionManagementService;
            this.galleryService = galleryService;
            this.viewletService = viewletService;
            this.telemetryService = telemetryService;
            this.checkAndInstall();
            this._register(this.extensionManagementService.onDidInstallExtension(e => this.onDidInstallExtension(e)));
        }
        onDidInstallExtension(e) {
            if (e.local && e.operation === 1 /* Install */ && e.local.manifest.contributes && e.local.manifest.contributes.localizations && e.local.manifest.contributes.localizations.length) {
                const locale = e.local.manifest.contributes.localizations[0].languageId;
                if (platform.language !== locale) {
                    const updateAndRestart = platform.locale !== locale;
                    this.notificationService.prompt(severity_1.default.Info, updateAndRestart ? nls_1.localize('updateLocale', "Would you like to change VS Code's UI language to {0} and restart?", e.local.manifest.contributes.localizations[0].languageName || e.local.manifest.contributes.localizations[0].languageId)
                        : nls_1.localize('activateLanguagePack', "In order to use VS Code in {0}, VS Code needs to restart.", e.local.manifest.contributes.localizations[0].languageName || e.local.manifest.contributes.localizations[0].languageId), [{
                            label: updateAndRestart ? nls_1.localize('yes', "Yes") : nls_1.localize('restart now', "Restart Now"),
                            run: () => {
                                const updatePromise = updateAndRestart ? this.jsonEditingService.write(this.environmentService.argvResource, [{ key: 'locale', value: locale }], true) : Promise.resolve(undefined);
                                updatePromise.then(() => this.hostService.restart(), e => this.notificationService.error(e));
                            }
                        }], {
                        sticky: true,
                        neverShowAgain: { id: 'langugage.update.donotask', isSecondary: true }
                    });
                }
            }
        }
        checkAndInstall() {
            const language = platform.language;
            const locale = platform.locale;
            const languagePackSuggestionIgnoreList = JSON.parse(this.storageService.get('extensionsAssistant/languagePackSuggestionIgnore', 0 /* GLOBAL */, '[]'));
            if (!this.galleryService.isEnabled()) {
                return;
            }
            if (!language || !locale || language === 'en' || language.indexOf('en-') === 0) {
                return;
            }
            if (language === locale || languagePackSuggestionIgnoreList.indexOf(language) > -1) {
                return;
            }
            this.isLanguageInstalled(locale)
                .then(installed => {
                if (installed) {
                    return;
                }
                this.galleryService.query({ text: `tag:lp-${locale}` }, cancellation_1.CancellationToken.None).then(tagResult => {
                    if (tagResult.total === 0) {
                        return;
                    }
                    const extensionToInstall = tagResult.total === 1 ? tagResult.firstPage[0] : tagResult.firstPage.filter(e => e.publisher === 'MS-CEINTL' && e.name.indexOf('vscode-language-pack') === 0)[0];
                    const extensionToFetchTranslationsFrom = extensionToInstall || tagResult.firstPage[0];
                    if (!extensionToFetchTranslationsFrom.assets.manifest) {
                        return;
                    }
                    Promise.all([this.galleryService.getManifest(extensionToFetchTranslationsFrom, cancellation_1.CancellationToken.None), this.galleryService.getCoreTranslation(extensionToFetchTranslationsFrom, locale)])
                        .then(([manifest, translation]) => {
                        const loc = manifest && manifest.contributes && manifest.contributes.localizations && manifest.contributes.localizations.filter(x => x.languageId.toLowerCase() === locale)[0];
                        const languageName = loc ? (loc.languageName || locale) : locale;
                        const languageDisplayName = loc ? (loc.localizedLanguageName || loc.languageName || locale) : locale;
                        const translationsFromPack = translation && translation.contents ? translation.contents['vs/workbench/contrib/localizations/browser/minimalTranslations'] : {};
                        const promptMessageKey = extensionToInstall ? 'installAndRestartMessage' : 'showLanguagePackExtensions';
                        const useEnglish = !translationsFromPack[promptMessageKey];
                        const translations = {};
                        Object.keys(minimalTranslations_1.minimumTranslatedStrings).forEach(key => {
                            if (!translationsFromPack[key] || useEnglish) {
                                translations[key] = minimalTranslations_1.minimumTranslatedStrings[key].replace('{0}', languageName);
                            }
                            else {
                                translations[key] = `${translationsFromPack[key].replace('{0}', languageDisplayName)} (${minimalTranslations_1.minimumTranslatedStrings[key].replace('{0}', languageName)})`;
                            }
                        });
                        const logUserReaction = (userReaction) => {
                            /* __GDPR__
                                "languagePackSuggestion:popup" : {
                                    "userReaction" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                                    "language": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                                }
                            */
                            this.telemetryService.publicLog('languagePackSuggestion:popup', { userReaction, language });
                        };
                        const searchAction = {
                            label: translations['searchMarketplace'],
                            run: () => {
                                logUserReaction('search');
                                this.viewletService.openViewlet(extensions_1.VIEWLET_ID, true)
                                    .then(viewlet => viewlet)
                                    .then(viewlet => {
                                    viewlet.search(`tag:lp-${locale}`);
                                    viewlet.focus();
                                });
                            }
                        };
                        const installAndRestartAction = {
                            label: translations['installAndRestart'],
                            run: () => {
                                logUserReaction('installAndRestart');
                                this.installExtension(extensionToInstall).then(() => this.hostService.restart());
                            }
                        };
                        const promptMessage = translations[promptMessageKey];
                        this.notificationService.prompt(severity_1.default.Info, promptMessage, [extensionToInstall ? installAndRestartAction : searchAction,
                            {
                                label: nls_1.localize('neverAgain', "Don't Show Again"),
                                isSecondary: true,
                                run: () => {
                                    languagePackSuggestionIgnoreList.push(language);
                                    this.storageService.store('extensionsAssistant/languagePackSuggestionIgnore', JSON.stringify(languagePackSuggestionIgnoreList), 0 /* GLOBAL */);
                                    logUserReaction('neverShowAgain');
                                }
                            }], {
                            onCancel: () => {
                                logUserReaction('cancelled');
                            }
                        });
                    });
                });
            });
        }
        isLanguageInstalled(language) {
            return this.extensionManagementService.getInstalled(1 /* User */)
                .then(installed => installed.some(i => !!(i.manifest
                && i.manifest.contributes
                && i.manifest.contributes.localizations
                && i.manifest.contributes.localizations.length
                && i.manifest.contributes.localizations.some(l => l.languageId.toLowerCase() === language))));
        }
        installExtension(extension) {
            return this.viewletService.openViewlet(extensions_1.VIEWLET_ID)
                .then(viewlet => viewlet)
                .then(viewlet => viewlet.search(`@id:${extension.identifier.id}`))
                .then(() => this.extensionManagementService.installFromGallery(extension))
                .then(() => undefined, err => this.notificationService.error(err));
        }
    };
    LocalizationWorkbenchContribution = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, jsonEditing_1.IJSONEditingService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, host_1.IHostService),
        __param(4, storage_1.IStorageService),
        __param(5, extensionManagement_1.IExtensionManagementService),
        __param(6, extensionManagement_1.IExtensionGalleryService),
        __param(7, viewlet_1.IViewletService),
        __param(8, telemetry_1.ITelemetryService)
    ], LocalizationWorkbenchContribution);
    exports.LocalizationWorkbenchContribution = LocalizationWorkbenchContribution;
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(LocalizationWorkbenchContribution, 4 /* Eventually */);
    extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'localizations',
        jsonSchema: {
            description: nls_1.localize('vscode.extension.contributes.localizations', "Contributes localizations to the editor"),
            type: 'array',
            default: [],
            items: {
                type: 'object',
                required: ['languageId', 'translations'],
                defaultSnippets: [{ body: { languageId: '', languageName: '', localizedLanguageName: '', translations: [{ id: 'vscode', path: '' }] } }],
                properties: {
                    languageId: {
                        description: nls_1.localize('vscode.extension.contributes.localizations.languageId', 'Id of the language into which the display strings are translated.'),
                        type: 'string'
                    },
                    languageName: {
                        description: nls_1.localize('vscode.extension.contributes.localizations.languageName', 'Name of the language in English.'),
                        type: 'string'
                    },
                    localizedLanguageName: {
                        description: nls_1.localize('vscode.extension.contributes.localizations.languageNameLocalized', 'Name of the language in contributed language.'),
                        type: 'string'
                    },
                    translations: {
                        description: nls_1.localize('vscode.extension.contributes.localizations.translations', 'List of translations associated to the language.'),
                        type: 'array',
                        default: [{ id: 'vscode', path: '' }],
                        items: {
                            type: 'object',
                            required: ['id', 'path'],
                            properties: {
                                id: {
                                    type: 'string',
                                    description: nls_1.localize('vscode.extension.contributes.localizations.translations.id', "Id of VS Code or Extension for which this translation is contributed to. Id of VS Code is always `vscode` and of extension should be in format `publisherId.extensionName`."),
                                    pattern: '^((vscode)|([a-z0-9A-Z][a-z0-9\-A-Z]*)\\.([a-z0-9A-Z][a-z0-9\-A-Z]*))$',
                                    patternErrorMessage: nls_1.localize('vscode.extension.contributes.localizations.translations.id.pattern', "Id should be `vscode` or in format `publisherId.extensionName` for translating VS code or an extension respectively.")
                                },
                                path: {
                                    type: 'string',
                                    description: nls_1.localize('vscode.extension.contributes.localizations.translations.path', "A relative path to a file containing translations for the language.")
                                }
                            },
                            defaultSnippets: [{ body: { id: '', path: '' } }],
                        },
                    }
                }
            }
        }
    });
});
//# sourceMappingURL=localizations.contribution.js.map