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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/platform/environment/common/environment", "vs/platform/localizations/common/localizations", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/configuration/common/jsonEditing", "vs/workbench/services/host/browser/host", "vs/platform/notification/common/notification", "vs/base/common/platform", "vs/base/common/arrays", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/viewlet/browser/viewlet", "vs/platform/dialogs/common/dialogs", "vs/platform/product/common/productService"], function (require, exports, nls_1, actions_1, environment_1, localizations_1, quickInput_1, jsonEditing_1, host_1, notification_1, platform_1, arrays_1, extensions_1, viewlet_1, dialogs_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ConfigureLocaleAction = class ConfigureLocaleAction extends actions_1.Action {
        constructor(id, label, environmentService, localizationService, quickInputService, jsonEditingService, hostService, notificationService, viewletService, dialogService, productService) {
            super(id, label);
            this.environmentService = environmentService;
            this.localizationService = localizationService;
            this.quickInputService = quickInputService;
            this.jsonEditingService = jsonEditingService;
            this.hostService = hostService;
            this.notificationService = notificationService;
            this.viewletService = viewletService;
            this.dialogService = dialogService;
            this.productService = productService;
        }
        async getLanguageOptions() {
            // Contributed languages are those installed via extension packs, so does not include English
            const availableLanguages = ['en', ...await this.localizationService.getLanguageIds(2 /* Contributed */)];
            availableLanguages.sort();
            return availableLanguages
                .map(language => { return { label: language }; })
                .concat({ label: nls_1.localize('installAdditionalLanguages', "Install additional languages...") });
        }
        async run(event) {
            const languageOptions = await this.getLanguageOptions();
            const currentLanguageIndex = arrays_1.firstIndex(languageOptions, l => l.label === platform_1.language);
            try {
                const selectedLanguage = await this.quickInputService.pick(languageOptions, {
                    canPickMany: false,
                    placeHolder: nls_1.localize('chooseDisplayLanguage', "Select Display Language"),
                    activeItem: languageOptions[currentLanguageIndex]
                });
                if (selectedLanguage === languageOptions[languageOptions.length - 1]) {
                    return this.viewletService.openViewlet(extensions_1.VIEWLET_ID, true)
                        .then((viewlet) => {
                        viewlet.search('@category:"language packs"');
                        viewlet.focus();
                    });
                }
                if (selectedLanguage) {
                    await this.jsonEditingService.write(this.environmentService.argvResource, [{ key: 'locale', value: selectedLanguage.label }], true);
                    const restart = await this.dialogService.confirm({
                        type: 'info',
                        message: nls_1.localize('relaunchDisplayLanguageMessage', "A restart is required for the change in display language to take effect."),
                        detail: nls_1.localize('relaunchDisplayLanguageDetail', "Press the restart button to restart {0} and change the display language.", this.productService.nameLong),
                        primaryButton: nls_1.localize('restart', "&&Restart")
                    });
                    if (restart.confirmed) {
                        this.hostService.restart();
                    }
                }
            }
            catch (e) {
                this.notificationService.error(e);
            }
        }
    };
    ConfigureLocaleAction.ID = 'workbench.action.configureLocale';
    ConfigureLocaleAction.LABEL = nls_1.localize('configureLocale', "Configure Display Language");
    ConfigureLocaleAction = __decorate([
        __param(2, environment_1.IEnvironmentService),
        __param(3, localizations_1.ILocalizationsService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, jsonEditing_1.IJSONEditingService),
        __param(6, host_1.IHostService),
        __param(7, notification_1.INotificationService),
        __param(8, viewlet_1.IViewletService),
        __param(9, dialogs_1.IDialogService),
        __param(10, productService_1.IProductService)
    ], ConfigureLocaleAction);
    exports.ConfigureLocaleAction = ConfigureLocaleAction;
});
//# sourceMappingURL=localizationsActions.js.map