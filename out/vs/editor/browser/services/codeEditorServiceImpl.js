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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/base/common/uri", "vs/editor/browser/services/abstractCodeEditorService", "vs/editor/common/editorCommon", "vs/editor/common/model", "vs/platform/theme/common/themeService"], function (require, exports, dom, lifecycle_1, strings, uri_1, abstractCodeEditorService_1, editorCommon_1, model_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let CodeEditorServiceImpl = class CodeEditorServiceImpl extends abstractCodeEditorService_1.AbstractCodeEditorService {
        constructor(themeService, styleSheet = dom.createStyleSheet()) {
            super();
            this._decorationOptionProviders = new Map();
            this._styleSheet = styleSheet;
            this._themeService = themeService;
        }
        registerDecorationType(key, options, parentTypeKey) {
            let provider = this._decorationOptionProviders.get(key);
            if (!provider) {
                const providerArgs = {
                    styleSheet: this._styleSheet,
                    key: key,
                    parentTypeKey: parentTypeKey,
                    options: options || Object.create(null)
                };
                if (!parentTypeKey) {
                    provider = new DecorationTypeOptionsProvider(this._themeService, providerArgs);
                }
                else {
                    provider = new DecorationSubTypeOptionsProvider(this._themeService, providerArgs);
                }
                this._decorationOptionProviders.set(key, provider);
            }
            provider.refCount++;
        }
        removeDecorationType(key) {
            const provider = this._decorationOptionProviders.get(key);
            if (provider) {
                provider.refCount--;
                if (provider.refCount <= 0) {
                    this._decorationOptionProviders.delete(key);
                    provider.dispose();
                    this.listCodeEditors().forEach((ed) => ed.removeDecorations(key));
                }
            }
        }
        resolveDecorationOptions(decorationTypeKey, writable) {
            const provider = this._decorationOptionProviders.get(decorationTypeKey);
            if (!provider) {
                throw new Error('Unknown decoration type key: ' + decorationTypeKey);
            }
            return provider.getOptions(this, writable);
        }
    };
    CodeEditorServiceImpl = __decorate([
        __param(0, themeService_1.IThemeService)
    ], CodeEditorServiceImpl);
    exports.CodeEditorServiceImpl = CodeEditorServiceImpl;
    class DecorationSubTypeOptionsProvider {
        constructor(themeService, providerArgs) {
            this._parentTypeKey = providerArgs.parentTypeKey;
            this.refCount = 0;
            this._beforeContentRules = new DecorationCSSRules(3 /* BeforeContentClassName */, providerArgs, themeService);
            this._afterContentRules = new DecorationCSSRules(4 /* AfterContentClassName */, providerArgs, themeService);
        }
        getOptions(codeEditorService, writable) {
            const options = codeEditorService.resolveDecorationOptions(this._parentTypeKey, true);
            if (this._beforeContentRules) {
                options.beforeContentClassName = this._beforeContentRules.className;
            }
            if (this._afterContentRules) {
                options.afterContentClassName = this._afterContentRules.className;
            }
            return options;
        }
        dispose() {
            if (this._beforeContentRules) {
                this._beforeContentRules.dispose();
                this._beforeContentRules = null;
            }
            if (this._afterContentRules) {
                this._afterContentRules.dispose();
                this._afterContentRules = null;
            }
        }
    }
    class DecorationTypeOptionsProvider {
        constructor(themeService, providerArgs) {
            this._disposables = new lifecycle_1.DisposableStore();
            this.refCount = 0;
            const createCSSRules = (type) => {
                const rules = new DecorationCSSRules(type, providerArgs, themeService);
                this._disposables.add(rules);
                if (rules.hasContent) {
                    return rules.className;
                }
                return undefined;
            };
            const createInlineCSSRules = (type) => {
                const rules = new DecorationCSSRules(type, providerArgs, themeService);
                this._disposables.add(rules);
                if (rules.hasContent) {
                    return { className: rules.className, hasLetterSpacing: rules.hasLetterSpacing };
                }
                return null;
            };
            this.className = createCSSRules(0 /* ClassName */);
            const inlineData = createInlineCSSRules(1 /* InlineClassName */);
            if (inlineData) {
                this.inlineClassName = inlineData.className;
                this.inlineClassNameAffectsLetterSpacing = inlineData.hasLetterSpacing;
            }
            this.beforeContentClassName = createCSSRules(3 /* BeforeContentClassName */);
            this.afterContentClassName = createCSSRules(4 /* AfterContentClassName */);
            this.glyphMarginClassName = createCSSRules(2 /* GlyphMarginClassName */);
            const options = providerArgs.options;
            this.isWholeLine = Boolean(options.isWholeLine);
            this.stickiness = options.rangeBehavior;
            const lightOverviewRulerColor = options.light && options.light.overviewRulerColor || options.overviewRulerColor;
            const darkOverviewRulerColor = options.dark && options.dark.overviewRulerColor || options.overviewRulerColor;
            if (typeof lightOverviewRulerColor !== 'undefined'
                || typeof darkOverviewRulerColor !== 'undefined') {
                this.overviewRuler = {
                    color: lightOverviewRulerColor || darkOverviewRulerColor,
                    darkColor: darkOverviewRulerColor || lightOverviewRulerColor,
                    position: options.overviewRulerLane || model_1.OverviewRulerLane.Center
                };
            }
        }
        getOptions(codeEditorService, writable) {
            if (!writable) {
                return this;
            }
            return {
                inlineClassName: this.inlineClassName,
                beforeContentClassName: this.beforeContentClassName,
                afterContentClassName: this.afterContentClassName,
                className: this.className,
                glyphMarginClassName: this.glyphMarginClassName,
                isWholeLine: this.isWholeLine,
                overviewRuler: this.overviewRuler,
                stickiness: this.stickiness
            };
        }
        dispose() {
            this._disposables.dispose();
        }
    }
    const _CSS_MAP = {
        color: 'color:{0} !important;',
        opacity: 'opacity:{0};',
        backgroundColor: 'background-color:{0};',
        outline: 'outline:{0};',
        outlineColor: 'outline-color:{0};',
        outlineStyle: 'outline-style:{0};',
        outlineWidth: 'outline-width:{0};',
        border: 'border:{0};',
        borderColor: 'border-color:{0};',
        borderRadius: 'border-radius:{0};',
        borderSpacing: 'border-spacing:{0};',
        borderStyle: 'border-style:{0};',
        borderWidth: 'border-width:{0};',
        fontStyle: 'font-style:{0};',
        fontWeight: 'font-weight:{0};',
        textDecoration: 'text-decoration:{0};',
        cursor: 'cursor:{0};',
        letterSpacing: 'letter-spacing:{0};',
        gutterIconPath: 'background:{0} center center no-repeat;',
        gutterIconSize: 'background-size:{0};',
        contentText: 'content:\'{0}\';',
        contentIconPath: 'content:{0};',
        margin: 'margin:{0};',
        width: 'width:{0};',
        height: 'height:{0};'
    };
    class DecorationCSSRules {
        constructor(ruleType, providerArgs, themeService) {
            this._theme = themeService.getTheme();
            this._ruleType = ruleType;
            this._providerArgs = providerArgs;
            this._usesThemeColors = false;
            this._hasContent = false;
            this._hasLetterSpacing = false;
            let className = CSSNameHelper.getClassName(this._providerArgs.key, ruleType);
            if (this._providerArgs.parentTypeKey) {
                className = className + ' ' + CSSNameHelper.getClassName(this._providerArgs.parentTypeKey, ruleType);
            }
            this._className = className;
            this._unThemedSelector = CSSNameHelper.getSelector(this._providerArgs.key, this._providerArgs.parentTypeKey, ruleType);
            this._buildCSS();
            if (this._usesThemeColors) {
                this._themeListener = themeService.onThemeChange(theme => {
                    this._theme = themeService.getTheme();
                    this._removeCSS();
                    this._buildCSS();
                });
            }
            else {
                this._themeListener = null;
            }
        }
        dispose() {
            if (this._hasContent) {
                this._removeCSS();
                this._hasContent = false;
            }
            if (this._themeListener) {
                this._themeListener.dispose();
                this._themeListener = null;
            }
        }
        get hasContent() {
            return this._hasContent;
        }
        get hasLetterSpacing() {
            return this._hasLetterSpacing;
        }
        get className() {
            return this._className;
        }
        _buildCSS() {
            const options = this._providerArgs.options;
            let unthemedCSS, lightCSS, darkCSS;
            switch (this._ruleType) {
                case 0 /* ClassName */:
                    unthemedCSS = this.getCSSTextForModelDecorationClassName(options);
                    lightCSS = this.getCSSTextForModelDecorationClassName(options.light);
                    darkCSS = this.getCSSTextForModelDecorationClassName(options.dark);
                    break;
                case 1 /* InlineClassName */:
                    unthemedCSS = this.getCSSTextForModelDecorationInlineClassName(options);
                    lightCSS = this.getCSSTextForModelDecorationInlineClassName(options.light);
                    darkCSS = this.getCSSTextForModelDecorationInlineClassName(options.dark);
                    break;
                case 2 /* GlyphMarginClassName */:
                    unthemedCSS = this.getCSSTextForModelDecorationGlyphMarginClassName(options);
                    lightCSS = this.getCSSTextForModelDecorationGlyphMarginClassName(options.light);
                    darkCSS = this.getCSSTextForModelDecorationGlyphMarginClassName(options.dark);
                    break;
                case 3 /* BeforeContentClassName */:
                    unthemedCSS = this.getCSSTextForModelDecorationContentClassName(options.before);
                    lightCSS = this.getCSSTextForModelDecorationContentClassName(options.light && options.light.before);
                    darkCSS = this.getCSSTextForModelDecorationContentClassName(options.dark && options.dark.before);
                    break;
                case 4 /* AfterContentClassName */:
                    unthemedCSS = this.getCSSTextForModelDecorationContentClassName(options.after);
                    lightCSS = this.getCSSTextForModelDecorationContentClassName(options.light && options.light.after);
                    darkCSS = this.getCSSTextForModelDecorationContentClassName(options.dark && options.dark.after);
                    break;
                default:
                    throw new Error('Unknown rule type: ' + this._ruleType);
            }
            const sheet = this._providerArgs.styleSheet.sheet;
            let hasContent = false;
            if (unthemedCSS.length > 0) {
                sheet.insertRule(`${this._unThemedSelector} {${unthemedCSS}}`, 0);
                hasContent = true;
            }
            if (lightCSS.length > 0) {
                sheet.insertRule(`.vs${this._unThemedSelector} {${lightCSS}}`, 0);
                hasContent = true;
            }
            if (darkCSS.length > 0) {
                sheet.insertRule(`.vs-dark${this._unThemedSelector}, .hc-black${this._unThemedSelector} {${darkCSS}}`, 0);
                hasContent = true;
            }
            this._hasContent = hasContent;
        }
        _removeCSS() {
            dom.removeCSSRulesContainingSelector(this._unThemedSelector, this._providerArgs.styleSheet);
        }
        /**
         * Build the CSS for decorations styled via `className`.
         */
        getCSSTextForModelDecorationClassName(opts) {
            if (!opts) {
                return '';
            }
            const cssTextArr = [];
            this.collectCSSText(opts, ['backgroundColor'], cssTextArr);
            this.collectCSSText(opts, ['outline', 'outlineColor', 'outlineStyle', 'outlineWidth'], cssTextArr);
            this.collectBorderSettingsCSSText(opts, cssTextArr);
            return cssTextArr.join('');
        }
        /**
         * Build the CSS for decorations styled via `inlineClassName`.
         */
        getCSSTextForModelDecorationInlineClassName(opts) {
            if (!opts) {
                return '';
            }
            const cssTextArr = [];
            this.collectCSSText(opts, ['fontStyle', 'fontWeight', 'textDecoration', 'cursor', 'color', 'opacity', 'letterSpacing'], cssTextArr);
            if (opts.letterSpacing) {
                this._hasLetterSpacing = true;
            }
            return cssTextArr.join('');
        }
        /**
         * Build the CSS for decorations styled before or after content.
         */
        getCSSTextForModelDecorationContentClassName(opts) {
            if (!opts) {
                return '';
            }
            const cssTextArr = [];
            if (typeof opts !== 'undefined') {
                this.collectBorderSettingsCSSText(opts, cssTextArr);
                if (typeof opts.contentIconPath !== 'undefined') {
                    cssTextArr.push(strings.format(_CSS_MAP.contentIconPath, dom.asCSSUrl(uri_1.URI.revive(opts.contentIconPath))));
                }
                if (typeof opts.contentText === 'string') {
                    const truncated = opts.contentText.match(/^.*$/m)[0]; // only take first line
                    const escaped = truncated.replace(/['\\]/g, '\\$&');
                    cssTextArr.push(strings.format(_CSS_MAP.contentText, escaped));
                }
                this.collectCSSText(opts, ['fontStyle', 'fontWeight', 'textDecoration', 'color', 'opacity', 'backgroundColor', 'margin'], cssTextArr);
                if (this.collectCSSText(opts, ['width', 'height'], cssTextArr)) {
                    cssTextArr.push('display:inline-block;');
                }
            }
            return cssTextArr.join('');
        }
        /**
         * Build the CSS for decorations styled via `glpyhMarginClassName`.
         */
        getCSSTextForModelDecorationGlyphMarginClassName(opts) {
            if (!opts) {
                return '';
            }
            const cssTextArr = [];
            if (typeof opts.gutterIconPath !== 'undefined') {
                cssTextArr.push(strings.format(_CSS_MAP.gutterIconPath, dom.asCSSUrl(uri_1.URI.revive(opts.gutterIconPath))));
                if (typeof opts.gutterIconSize !== 'undefined') {
                    cssTextArr.push(strings.format(_CSS_MAP.gutterIconSize, opts.gutterIconSize));
                }
            }
            return cssTextArr.join('');
        }
        collectBorderSettingsCSSText(opts, cssTextArr) {
            if (this.collectCSSText(opts, ['border', 'borderColor', 'borderRadius', 'borderSpacing', 'borderStyle', 'borderWidth'], cssTextArr)) {
                cssTextArr.push(strings.format('box-sizing: border-box;'));
                return true;
            }
            return false;
        }
        collectCSSText(opts, properties, cssTextArr) {
            const lenBefore = cssTextArr.length;
            for (let property of properties) {
                const value = this.resolveValue(opts[property]);
                if (typeof value === 'string') {
                    cssTextArr.push(strings.format(_CSS_MAP[property], value));
                }
            }
            return cssTextArr.length !== lenBefore;
        }
        resolveValue(value) {
            if (editorCommon_1.isThemeColor(value)) {
                this._usesThemeColors = true;
                const color = this._theme.getColor(value.id);
                if (color) {
                    return color.toString();
                }
                return 'transparent';
            }
            return value;
        }
    }
    var ModelDecorationCSSRuleType;
    (function (ModelDecorationCSSRuleType) {
        ModelDecorationCSSRuleType[ModelDecorationCSSRuleType["ClassName"] = 0] = "ClassName";
        ModelDecorationCSSRuleType[ModelDecorationCSSRuleType["InlineClassName"] = 1] = "InlineClassName";
        ModelDecorationCSSRuleType[ModelDecorationCSSRuleType["GlyphMarginClassName"] = 2] = "GlyphMarginClassName";
        ModelDecorationCSSRuleType[ModelDecorationCSSRuleType["BeforeContentClassName"] = 3] = "BeforeContentClassName";
        ModelDecorationCSSRuleType[ModelDecorationCSSRuleType["AfterContentClassName"] = 4] = "AfterContentClassName";
    })(ModelDecorationCSSRuleType || (ModelDecorationCSSRuleType = {}));
    class CSSNameHelper {
        static getClassName(key, type) {
            return 'ced-' + key + '-' + type;
        }
        static getSelector(key, parentKey, ruleType) {
            let selector = '.monaco-editor .' + this.getClassName(key, ruleType);
            if (parentKey) {
                selector = selector + '.' + this.getClassName(parentKey, ruleType);
            }
            if (ruleType === 3 /* BeforeContentClassName */) {
                selector += '::before';
            }
            else if (ruleType === 4 /* AfterContentClassName */) {
                selector += '::after';
            }
            return selector;
        }
    }
});
//# sourceMappingURL=codeEditorServiceImpl.js.map