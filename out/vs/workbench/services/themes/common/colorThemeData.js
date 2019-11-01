/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/json", "vs/base/common/color", "vs/workbench/services/themes/common/workbenchThemeService", "vs/workbench/services/themes/common/themeCompatibility", "vs/nls", "vs/base/common/types", "vs/base/common/objects", "vs/base/common/resources", "vs/platform/theme/common/colorRegistry", "vs/platform/registry/common/platform", "vs/base/common/jsonErrorMessages", "vs/workbench/services/themes/common/plistParser", "vs/base/common/strings"], function (require, exports, path_1, Json, color_1, workbenchThemeService_1, themeCompatibility_1, nls, types, objects, resources, colorRegistry_1, platform_1, jsonErrorMessages_1, plistParser_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let colorRegistry = platform_1.Registry.as(colorRegistry_1.Extensions.ColorContribution);
    const tokenGroupToScopesMap = {
        comments: ['comment'],
        strings: ['string'],
        keywords: ['keyword - keyword.operator', 'keyword.control', 'storage', 'storage.type'],
        numbers: ['constant.numeric'],
        types: ['entity.name.type', 'entity.name.class', 'support.type', 'support.class'],
        functions: ['entity.name.function', 'support.function'],
        variables: ['variable', 'entity.name.variable']
    };
    class ColorThemeData {
        constructor(id, label, settingsId) {
            this.themeTokenColors = [];
            this.customTokenColors = [];
            this.colorMap = {};
            this.customColorMap = {};
            this.id = id;
            this.label = label;
            this.settingsId = settingsId;
            this.isLoaded = false;
        }
        get tokenColors() {
            const result = [];
            // the default rule (scope empty) is always the first rule. Ignore all other default rules.
            const foreground = this.getColor(colorRegistry_1.editorForeground) || this.getDefault(colorRegistry_1.editorForeground);
            const background = this.getColor(colorRegistry_1.editorBackground) || this.getDefault(colorRegistry_1.editorBackground);
            result.push({
                settings: {
                    foreground: color_1.Color.Format.CSS.formatHexA(foreground),
                    background: color_1.Color.Format.CSS.formatHexA(background)
                }
            });
            let hasDefaultTokens = false;
            function addRule(rule) {
                if (rule.scope && rule.settings) {
                    if (rule.scope === 'token.info-token') {
                        hasDefaultTokens = true;
                    }
                    result.push(rule);
                }
            }
            this.themeTokenColors.forEach(addRule);
            // Add the custom colors after the theme colors
            // so that they will override them
            this.customTokenColors.forEach(addRule);
            if (!hasDefaultTokens) {
                defaultThemeColors[this.type].forEach(addRule);
            }
            return result;
        }
        getColor(colorId, useDefault) {
            let color = this.customColorMap[colorId];
            if (color) {
                return color;
            }
            color = this.colorMap[colorId];
            if (useDefault !== false && types.isUndefined(color)) {
                color = this.getDefault(colorId);
            }
            return color;
        }
        getDefault(colorId) {
            return colorRegistry.resolveDefaultColor(colorId, this);
        }
        defines(colorId) {
            return this.customColorMap.hasOwnProperty(colorId) || this.colorMap.hasOwnProperty(colorId);
        }
        setCustomColors(colors) {
            this.customColorMap = {};
            this.overwriteCustomColors(colors);
            const themeSpecificColors = colors[`[${this.settingsId}]`];
            if (types.isObject(themeSpecificColors)) {
                this.overwriteCustomColors(themeSpecificColors);
            }
        }
        overwriteCustomColors(colors) {
            for (let id in colors) {
                let colorVal = colors[id];
                if (typeof colorVal === 'string') {
                    this.customColorMap[id] = color_1.Color.fromHex(colorVal);
                }
            }
        }
        setCustomTokenColors(customTokenColors) {
            this.customTokenColors = [];
            // first add the non-theme specific settings
            this.addCustomTokenColors(customTokenColors);
            // append theme specific settings. Last rules will win.
            const themeSpecificTokenColors = customTokenColors[`[${this.settingsId}]`];
            if (types.isObject(themeSpecificTokenColors)) {
                this.addCustomTokenColors(themeSpecificTokenColors);
            }
        }
        addCustomTokenColors(customTokenColors) {
            // Put the general customizations such as comments, strings, etc. first so that
            // they can be overridden by specific customizations like "string.interpolated"
            for (let tokenGroup in tokenGroupToScopesMap) {
                const group = tokenGroup; // TS doesn't type 'tokenGroup' properly
                let value = customTokenColors[group];
                if (value) {
                    let settings = typeof value === 'string' ? { foreground: value } : value;
                    let scopes = tokenGroupToScopesMap[group];
                    for (let scope of scopes) {
                        this.customTokenColors.push({ scope, settings });
                    }
                }
            }
            // specific customizations
            if (Array.isArray(customTokenColors.textMateRules)) {
                for (let rule of customTokenColors.textMateRules) {
                    if (rule.scope && rule.settings) {
                        this.customTokenColors.push(rule);
                    }
                }
            }
        }
        ensureLoaded(fileService) {
            return !this.isLoaded ? this.load(fileService) : Promise.resolve(undefined);
        }
        reload(fileService) {
            return this.load(fileService);
        }
        load(fileService) {
            if (!this.location) {
                return Promise.resolve(undefined);
            }
            this.themeTokenColors = [];
            this.colorMap = {};
            return _loadColorTheme(fileService, this.location, this.themeTokenColors, this.colorMap).then(_ => {
                this.isLoaded = true;
            });
        }
        toStorageData() {
            let colorMapData = {};
            for (let key in this.colorMap) {
                colorMapData[key] = color_1.Color.Format.CSS.formatHexA(this.colorMap[key], true);
            }
            // no need to persist custom colors, they will be taken from the settings
            return JSON.stringify({
                id: this.id,
                label: this.label,
                settingsId: this.settingsId,
                selector: this.id.split(' ').join('.'),
                themeTokenColors: this.themeTokenColors,
                extensionData: this.extensionData,
                colorMap: colorMapData,
                watch: this.watch
            });
        }
        hasEqualData(other) {
            return objects.equals(this.colorMap, other.colorMap) && objects.equals(this.themeTokenColors, other.themeTokenColors);
        }
        get baseTheme() {
            return this.id.split(' ')[0];
        }
        get type() {
            switch (this.baseTheme) {
                case workbenchThemeService_1.VS_LIGHT_THEME: return 'light';
                case workbenchThemeService_1.VS_HC_THEME: return 'hc';
                default: return 'dark';
            }
        }
        // constructors
        static createUnloadedTheme(id) {
            let themeData = new ColorThemeData(id, '', '__' + id);
            themeData.isLoaded = false;
            themeData.themeTokenColors = [];
            themeData.watch = false;
            return themeData;
        }
        static createLoadedEmptyTheme(id, settingsId) {
            let themeData = new ColorThemeData(id, '', settingsId);
            themeData.isLoaded = true;
            themeData.themeTokenColors = [];
            themeData.watch = false;
            return themeData;
        }
        static fromStorageData(input) {
            try {
                let data = JSON.parse(input);
                let theme = new ColorThemeData('', '', '');
                for (let key in data) {
                    switch (key) {
                        case 'colorMap':
                            let colorMapData = data[key];
                            for (let id in colorMapData) {
                                theme.colorMap[id] = color_1.Color.fromHex(colorMapData[id]);
                            }
                            break;
                        case 'themeTokenColors':
                        case 'id':
                        case 'label':
                        case 'settingsId':
                        case 'extensionData':
                        case 'watch':
                            theme[key] = data[key];
                            break;
                    }
                }
                if (!theme.id || !theme.settingsId) {
                    return undefined;
                }
                return theme;
            }
            catch (e) {
                return undefined;
            }
        }
        static fromExtensionTheme(theme, colorThemeLocation, extensionData) {
            const baseTheme = theme['uiTheme'] || 'vs-dark';
            const themeSelector = toCSSSelector(extensionData.extensionId, theme.path);
            const id = `${baseTheme} ${themeSelector}`;
            const label = theme.label || path_1.basename(theme.path);
            const settingsId = theme.id || label;
            const themeData = new ColorThemeData(id, label, settingsId);
            themeData.description = theme.description;
            themeData.watch = theme._watch === true;
            themeData.location = colorThemeLocation;
            themeData.extensionData = extensionData;
            themeData.isLoaded = false;
            return themeData;
        }
    }
    exports.ColorThemeData = ColorThemeData;
    function toCSSSelector(extensionId, path) {
        if (strings_1.startsWith(path, './')) {
            path = path.substr(2);
        }
        let str = `${extensionId}-${path}`;
        //remove all characters that are not allowed in css
        str = str.replace(/[^_\-a-zA-Z0-9]/g, '-');
        if (str.charAt(0).match(/[0-9\-]/)) {
            str = '_' + str;
        }
        return str;
    }
    function _loadColorTheme(fileService, themeLocation, resultRules, resultColors) {
        if (resources.extname(themeLocation) === '.json') {
            return fileService.readFile(themeLocation).then(content => {
                let errors = [];
                let contentValue = Json.parse(content.value.toString(), errors);
                if (errors.length > 0) {
                    return Promise.reject(new Error(nls.localize('error.cannotparsejson', "Problems parsing JSON theme file: {0}", errors.map(e => jsonErrorMessages_1.getParseErrorMessage(e.error)).join(', '))));
                }
                let includeCompletes = Promise.resolve(null);
                if (contentValue.include) {
                    includeCompletes = _loadColorTheme(fileService, resources.joinPath(resources.dirname(themeLocation), contentValue.include), resultRules, resultColors);
                }
                return includeCompletes.then(_ => {
                    if (Array.isArray(contentValue.settings)) {
                        themeCompatibility_1.convertSettings(contentValue.settings, resultRules, resultColors);
                        return null;
                    }
                    let colors = contentValue.colors;
                    if (colors) {
                        if (typeof colors !== 'object') {
                            return Promise.reject(new Error(nls.localize({ key: 'error.invalidformat.colors', comment: ['{0} will be replaced by a path. Values in quotes should not be translated.'] }, "Problem parsing color theme file: {0}. Property 'colors' is not of type 'object'.", themeLocation.toString())));
                        }
                        // new JSON color themes format
                        for (let colorId in colors) {
                            let colorHex = colors[colorId];
                            if (typeof colorHex === 'string') { // ignore colors tht are null
                                resultColors[colorId] = color_1.Color.fromHex(colors[colorId]);
                            }
                        }
                    }
                    let tokenColors = contentValue.tokenColors;
                    if (tokenColors) {
                        if (Array.isArray(tokenColors)) {
                            resultRules.push(...tokenColors);
                            return null;
                        }
                        else if (typeof tokenColors === 'string') {
                            return _loadSyntaxTokens(fileService, resources.joinPath(resources.dirname(themeLocation), tokenColors), resultRules, {});
                        }
                        else {
                            return Promise.reject(new Error(nls.localize({ key: 'error.invalidformat.tokenColors', comment: ['{0} will be replaced by a path. Values in quotes should not be translated.'] }, "Problem parsing color theme file: {0}. Property 'tokenColors' should be either an array specifying colors or a path to a TextMate theme file", themeLocation.toString())));
                        }
                    }
                    return null;
                });
            });
        }
        else {
            return _loadSyntaxTokens(fileService, themeLocation, resultRules, resultColors);
        }
    }
    function _loadSyntaxTokens(fileService, themeLocation, resultRules, resultColors) {
        return fileService.readFile(themeLocation).then(content => {
            try {
                let contentValue = plistParser_1.parse(content.value.toString());
                let settings = contentValue.settings;
                if (!Array.isArray(settings)) {
                    return Promise.reject(new Error(nls.localize('error.plist.invalidformat', "Problem parsing tmTheme file: {0}. 'settings' is not array.")));
                }
                themeCompatibility_1.convertSettings(settings, resultRules, resultColors);
                return Promise.resolve(null);
            }
            catch (e) {
                return Promise.reject(new Error(nls.localize('error.cannotparse', "Problems parsing tmTheme file: {0}", e.message)));
            }
        }, error => {
            return Promise.reject(new Error(nls.localize('error.cannotload', "Problems loading tmTheme file {0}: {1}", themeLocation.toString(), error.message)));
        });
    }
    let defaultThemeColors = {
        'light': [
            { scope: 'token.info-token', settings: { foreground: '#316bcd' } },
            { scope: 'token.warn-token', settings: { foreground: '#cd9731' } },
            { scope: 'token.error-token', settings: { foreground: '#cd3131' } },
            { scope: 'token.debug-token', settings: { foreground: '#800080' } }
        ],
        'dark': [
            { scope: 'token.info-token', settings: { foreground: '#6796e6' } },
            { scope: 'token.warn-token', settings: { foreground: '#cd9731' } },
            { scope: 'token.error-token', settings: { foreground: '#f44747' } },
            { scope: 'token.debug-token', settings: { foreground: '#b267e6' } }
        ],
        'hc': [
            { scope: 'token.info-token', settings: { foreground: '#6796e6' } },
            { scope: 'token.warn-token', settings: { foreground: '#008000' } },
            { scope: 'token.error-token', settings: { foreground: '#FF0000' } },
            { scope: 'token.debug-token', settings: { foreground: '#b267e6' } }
        ],
    };
});
//# sourceMappingURL=colorThemeData.js.map