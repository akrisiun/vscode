/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var LanguageType;
    (function (LanguageType) {
        LanguageType[LanguageType["Core"] = 1] = "Core";
        LanguageType[LanguageType["Contributed"] = 2] = "Contributed";
    })(LanguageType = exports.LanguageType || (exports.LanguageType = {}));
    exports.ILocalizationsService = instantiation_1.createDecorator('localizationsService');
    function isValidLocalization(localization) {
        if (typeof localization.languageId !== 'string') {
            return false;
        }
        if (!Array.isArray(localization.translations) || localization.translations.length === 0) {
            return false;
        }
        for (const translation of localization.translations) {
            if (typeof translation.id !== 'string') {
                return false;
            }
            if (typeof translation.path !== 'string') {
                return false;
            }
        }
        if (localization.languageName && typeof localization.languageName !== 'string') {
            return false;
        }
        if (localization.localizedLanguageName && typeof localization.localizedLanguageName !== 'string') {
            return false;
        }
        return true;
    }
    exports.isValidLocalization = isValidLocalization;
});
//# sourceMappingURL=localizations.js.map