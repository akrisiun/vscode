/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/color", "vs/base/common/event", "vs/editor/common/modes", "vs/editor/common/modes/supports/tokenization", "vs/editor/standalone/common/themes", "vs/platform/registry/common/platform", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService"], function (require, exports, dom, color_1, event_1, modes_1, tokenization_1, themes_1, platform_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const VS_THEME_NAME = 'vs';
    const VS_DARK_THEME_NAME = 'vs-dark';
    const HC_BLACK_THEME_NAME = 'hc-black';
    const colorRegistry = platform_1.Registry.as(colorRegistry_1.Extensions.ColorContribution);
    const themingRegistry = platform_1.Registry.as(themeService_1.Extensions.ThemingContribution);
    class StandaloneTheme {
        constructor(name, standaloneThemeData) {
            this.themeData = standaloneThemeData;
            let base = standaloneThemeData.base;
            if (name.length > 0) {
                this.id = base + ' ' + name;
                this.themeName = name;
            }
            else {
                this.id = base;
                this.themeName = base;
            }
            this.colors = null;
            this.defaultColors = Object.create(null);
            this._tokenTheme = null;
        }
        get base() {
            return this.themeData.base;
        }
        notifyBaseUpdated() {
            if (this.themeData.inherit) {
                this.colors = null;
                this._tokenTheme = null;
            }
        }
        getColors() {
            if (!this.colors) {
                const colors = new Map();
                for (let id in this.themeData.colors) {
                    colors.set(id, color_1.Color.fromHex(this.themeData.colors[id]));
                }
                if (this.themeData.inherit) {
                    let baseData = getBuiltinRules(this.themeData.base);
                    for (let id in baseData.colors) {
                        if (!colors.has(id)) {
                            colors.set(id, color_1.Color.fromHex(baseData.colors[id]));
                        }
                    }
                }
                this.colors = colors;
            }
            return this.colors;
        }
        getColor(colorId, useDefault) {
            const color = this.getColors().get(colorId);
            if (color) {
                return color;
            }
            if (useDefault !== false) {
                return this.getDefault(colorId);
            }
            return undefined;
        }
        getDefault(colorId) {
            let color = this.defaultColors[colorId];
            if (color) {
                return color;
            }
            color = colorRegistry.resolveDefaultColor(colorId, this);
            this.defaultColors[colorId] = color;
            return color;
        }
        defines(colorId) {
            return Object.prototype.hasOwnProperty.call(this.getColors(), colorId);
        }
        get type() {
            switch (this.base) {
                case VS_THEME_NAME: return 'light';
                case HC_BLACK_THEME_NAME: return 'hc';
                default: return 'dark';
            }
        }
        get tokenTheme() {
            if (!this._tokenTheme) {
                let rules = [];
                let encodedTokensColors = [];
                if (this.themeData.inherit) {
                    let baseData = getBuiltinRules(this.themeData.base);
                    rules = baseData.rules;
                    if (baseData.encodedTokensColors) {
                        encodedTokensColors = baseData.encodedTokensColors;
                    }
                }
                rules = rules.concat(this.themeData.rules);
                if (this.themeData.encodedTokensColors) {
                    encodedTokensColors = this.themeData.encodedTokensColors;
                }
                this._tokenTheme = tokenization_1.TokenTheme.createFromRawTokenTheme(rules, encodedTokensColors);
            }
            return this._tokenTheme;
        }
    }
    function isBuiltinTheme(themeName) {
        return (themeName === VS_THEME_NAME
            || themeName === VS_DARK_THEME_NAME
            || themeName === HC_BLACK_THEME_NAME);
    }
    function getBuiltinRules(builtinTheme) {
        switch (builtinTheme) {
            case VS_THEME_NAME:
                return themes_1.vs;
            case VS_DARK_THEME_NAME:
                return themes_1.vs_dark;
            case HC_BLACK_THEME_NAME:
                return themes_1.hc_black;
        }
    }
    function newBuiltInTheme(builtinTheme) {
        let themeData = getBuiltinRules(builtinTheme);
        return new StandaloneTheme(builtinTheme, themeData);
    }
    class StandaloneThemeServiceImpl {
        constructor() {
            this.environment = Object.create(null);
            this._onThemeChange = new event_1.Emitter();
            this._onIconThemeChange = new event_1.Emitter();
            this._knownThemes = new Map();
            this._knownThemes.set(VS_THEME_NAME, newBuiltInTheme(VS_THEME_NAME));
            this._knownThemes.set(VS_DARK_THEME_NAME, newBuiltInTheme(VS_DARK_THEME_NAME));
            this._knownThemes.set(HC_BLACK_THEME_NAME, newBuiltInTheme(HC_BLACK_THEME_NAME));
            this._styleElement = dom.createStyleSheet();
            this._styleElement.className = 'monaco-colors';
            this.setTheme(VS_THEME_NAME);
        }
        get onThemeChange() {
            return this._onThemeChange.event;
        }
        defineTheme(themeName, themeData) {
            if (!/^[a-z0-9\-]+$/i.test(themeName)) {
                throw new Error('Illegal theme name!');
            }
            if (!isBuiltinTheme(themeData.base) && !isBuiltinTheme(themeName)) {
                throw new Error('Illegal theme base!');
            }
            // set or replace theme
            this._knownThemes.set(themeName, new StandaloneTheme(themeName, themeData));
            if (isBuiltinTheme(themeName)) {
                this._knownThemes.forEach(theme => {
                    if (theme.base === themeName) {
                        theme.notifyBaseUpdated();
                    }
                });
            }
            if (this._theme && this._theme.themeName === themeName) {
                this.setTheme(themeName); // refresh theme
            }
        }
        getTheme() {
            return this._theme;
        }
        setTheme(themeName) {
            let theme;
            if (this._knownThemes.has(themeName)) {
                theme = this._knownThemes.get(themeName);
            }
            else {
                theme = this._knownThemes.get(VS_THEME_NAME);
            }
            if (this._theme === theme) {
                // Nothing to do
                return theme.id;
            }
            this._theme = theme;
            let cssRules = [];
            let hasRule = {};
            let ruleCollector = {
                addRule: (rule) => {
                    if (!hasRule[rule]) {
                        cssRules.push(rule);
                        hasRule[rule] = true;
                    }
                }
            };
            themingRegistry.getThemingParticipants().forEach(p => p(theme, ruleCollector, this.environment));
            let tokenTheme = theme.tokenTheme;
            let colorMap = tokenTheme.getColorMap();
            ruleCollector.addRule(tokenization_1.generateTokensCSSForColorMap(colorMap));
            this._styleElement.innerHTML = cssRules.join('\n');
            modes_1.TokenizationRegistry.setColorMap(colorMap);
            this._onThemeChange.fire(theme);
            return theme.id;
        }
        getIconTheme() {
            return {
                hasFileIcons: false,
                hasFolderIcons: false,
                hidesExplorerArrows: false
            };
        }
        get onIconThemeChange() {
            return this._onIconThemeChange.event;
        }
    }
    exports.StandaloneThemeServiceImpl = StandaloneThemeServiceImpl;
});
//# sourceMappingURL=standaloneThemeServiceImpl.js.map