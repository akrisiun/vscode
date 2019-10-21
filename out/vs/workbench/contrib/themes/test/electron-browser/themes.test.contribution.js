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
define(["require", "exports", "vs/base/common/uri", "vs/editor/common/services/modeService", "vs/platform/commands/common/commands", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/themes/common/workbenchThemeService", "vs/workbench/services/editor/common/editorService", "vs/workbench/common/editor", "vs/workbench/services/textMate/common/textMateService", "vs/editor/common/modes", "vs/workbench/services/textMate/common/TMHelper", "vs/base/common/color", "vs/platform/files/common/files", "vs/base/common/resources"], function (require, exports, uri_1, modeService_1, commands_1, instantiation_1, workbenchThemeService_1, editorService_1, editor_1, textMateService_1, modes_1, TMHelper_1, color_1, files_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ThemeDocument {
        constructor(theme) {
            this._theme = theme;
            this._cache = Object.create(null);
            this._defaultColor = '#000000';
            for (let i = 0, len = this._theme.tokenColors.length; i < len; i++) {
                let rule = this._theme.tokenColors[i];
                if (!rule.scope) {
                    this._defaultColor = rule.settings.foreground;
                }
            }
        }
        _generateExplanation(selector, color) {
            return `${selector}: ${color_1.Color.Format.CSS.formatHexA(color, true).toUpperCase()}`;
        }
        explainTokenColor(scopes, color) {
            let matchingRule = this._findMatchingThemeRule(scopes);
            if (!matchingRule) {
                let expected = color_1.Color.fromHex(this._defaultColor);
                // No matching rule
                if (!color.equals(expected)) {
                    throw new Error(`[${this._theme.label}]: Unexpected color ${color_1.Color.Format.CSS.formatHexA(color)} for ${scopes}. Expected default ${color_1.Color.Format.CSS.formatHexA(expected)}`);
                }
                return this._generateExplanation('default', color);
            }
            let expected = color_1.Color.fromHex(matchingRule.settings.foreground);
            if (!color.equals(expected)) {
                throw new Error(`[${this._theme.label}]: Unexpected color ${color_1.Color.Format.CSS.formatHexA(color)} for ${scopes}. Expected ${color_1.Color.Format.CSS.formatHexA(expected)} coming in from ${matchingRule.rawSelector}`);
            }
            return this._generateExplanation(matchingRule.rawSelector, color);
        }
        _findMatchingThemeRule(scopes) {
            if (!this._cache[scopes]) {
                this._cache[scopes] = TMHelper_1.findMatchingThemeRule(this._theme, scopes.split(' '));
            }
            return this._cache[scopes];
        }
    }
    let Snapper = class Snapper {
        constructor(modeService, themeService, textMateService) {
            this.modeService = modeService;
            this.themeService = themeService;
            this.textMateService = textMateService;
        }
        _themedTokenize(grammar, lines) {
            let colorMap = modes_1.TokenizationRegistry.getColorMap();
            let state = null;
            let result = [], resultLen = 0;
            for (let i = 0, len = lines.length; i < len; i++) {
                let line = lines[i];
                let tokenizationResult = grammar.tokenizeLine2(line, state);
                for (let j = 0, lenJ = tokenizationResult.tokens.length >>> 1; j < lenJ; j++) {
                    let startOffset = tokenizationResult.tokens[(j << 1)];
                    let metadata = tokenizationResult.tokens[(j << 1) + 1];
                    let endOffset = j + 1 < lenJ ? tokenizationResult.tokens[((j + 1) << 1)] : line.length;
                    let tokenText = line.substring(startOffset, endOffset);
                    let color = modes_1.TokenMetadata.getForeground(metadata);
                    result[resultLen++] = {
                        text: tokenText,
                        color: colorMap[color]
                    };
                }
                state = tokenizationResult.ruleStack;
            }
            return result;
        }
        _tokenize(grammar, lines) {
            let state = null;
            let result = [];
            let resultLen = 0;
            for (let i = 0, len = lines.length; i < len; i++) {
                let line = lines[i];
                let tokenizationResult = grammar.tokenizeLine(line, state);
                let lastScopes = null;
                for (let j = 0, lenJ = tokenizationResult.tokens.length; j < lenJ; j++) {
                    let token = tokenizationResult.tokens[j];
                    let tokenText = line.substring(token.startIndex, token.endIndex);
                    let tokenScopes = token.scopes.join(' ');
                    if (lastScopes === tokenScopes) {
                        result[resultLen - 1].c += tokenText;
                    }
                    else {
                        lastScopes = tokenScopes;
                        result[resultLen++] = {
                            c: tokenText,
                            t: tokenScopes,
                            r: {
                                dark_plus: undefined,
                                light_plus: undefined,
                                dark_vs: undefined,
                                light_vs: undefined,
                                hc_black: undefined,
                            }
                        };
                    }
                }
                state = tokenizationResult.ruleStack;
            }
            return result;
        }
        async _getThemesResult(grammar, lines) {
            let currentTheme = this.themeService.getColorTheme();
            let getThemeName = (id) => {
                let part = 'vscode-theme-defaults-themes-';
                let startIdx = id.indexOf(part);
                if (startIdx !== -1) {
                    return id.substring(startIdx + part.length, id.length - 5);
                }
                return undefined;
            };
            let result = {};
            let themeDatas = await this.themeService.getColorThemes();
            let defaultThemes = themeDatas.filter(themeData => !!getThemeName(themeData.id));
            for (let defaultTheme of defaultThemes) {
                let themeId = defaultTheme.id;
                let success = await this.themeService.setColorTheme(themeId, undefined);
                if (success) {
                    let themeName = getThemeName(themeId);
                    result[themeName] = {
                        document: new ThemeDocument(this.themeService.getColorTheme()),
                        tokens: this._themedTokenize(grammar, lines)
                    };
                }
            }
            await this.themeService.setColorTheme(currentTheme.id, undefined);
            return result;
        }
        _enrichResult(result, themesResult) {
            let index = {};
            let themeNames = Object.keys(themesResult);
            for (const themeName of themeNames) {
                index[themeName] = 0;
            }
            for (let i = 0, len = result.length; i < len; i++) {
                let token = result[i];
                for (const themeName of themeNames) {
                    let themedToken = themesResult[themeName].tokens[index[themeName]];
                    themedToken.text = themedToken.text.substr(token.c.length);
                    token.r[themeName] = themesResult[themeName].document.explainTokenColor(token.t, themedToken.color);
                    if (themedToken.text.length === 0) {
                        index[themeName]++;
                    }
                }
            }
        }
        captureSyntaxTokens(fileName, content) {
            const modeId = this.modeService.getModeIdByFilepathOrFirstLine(uri_1.URI.file(fileName));
            return this.textMateService.createGrammar(modeId).then((grammar) => {
                let lines = content.split(/\r\n|\r|\n/);
                let result = this._tokenize(grammar, lines);
                return this._getThemesResult(grammar, lines).then((themesResult) => {
                    this._enrichResult(result, themesResult);
                    return result.filter(t => t.c.length > 0);
                });
            });
        }
    };
    Snapper = __decorate([
        __param(0, modeService_1.IModeService),
        __param(1, workbenchThemeService_1.IWorkbenchThemeService),
        __param(2, textMateService_1.ITextMateService)
    ], Snapper);
    commands_1.CommandsRegistry.registerCommand('_workbench.captureSyntaxTokens', function (accessor, resource) {
        let process = (resource) => {
            let fileService = accessor.get(files_1.IFileService);
            let fileName = resources_1.basename(resource);
            let snapper = accessor.get(instantiation_1.IInstantiationService).createInstance(Snapper);
            return fileService.readFile(resource).then(content => {
                return snapper.captureSyntaxTokens(fileName, content.value.toString());
            });
        };
        if (!resource) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const file = editorService.activeEditor ? editor_1.toResource(editorService.activeEditor, { filterByScheme: 'file' }) : null;
            if (file) {
                process(file).then(result => {
                    console.log(result);
                });
            }
            else {
                console.log('No file editor active');
            }
        }
        else {
            return process(resource);
        }
        return undefined;
    });
});
//# sourceMappingURL=themes.test.contribution.js.map