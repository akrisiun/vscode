/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/platform", "vs/editor/common/model/wordHelper", "vs/base/common/types"], function (require, exports, nls, platform, wordHelper_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //#endregion
    /**
     * An event describing that the configuration of the editor has changed.
     */
    class ConfigurationChangedEvent {
        /**
         * @internal
         */
        constructor(values) {
            this._values = values;
        }
        /**
         * @internal
         */
        hasChanged(id) {
            return this._values[id];
        }
    }
    exports.ConfigurationChangedEvent = ConfigurationChangedEvent;
    /**
     * @internal
     */
    class ValidatedEditorOptions {
        constructor() {
            this._values = [];
        }
        _read(option) {
            return this._values[option];
        }
        get(id) {
            return this._values[id];
        }
        _write(option, value) {
            this._values[option] = value;
        }
    }
    exports.ValidatedEditorOptions = ValidatedEditorOptions;
    class BaseEditorOption {
        constructor(id, name, defaultValue, schema) {
            this.id = id;
            this.name = name;
            this.defaultValue = defaultValue;
            this.schema = schema;
        }
        compute(env, options, value) {
            return value;
        }
    }
    /**
     * @internal
     */
    class ComputedEditorOption {
        constructor(id, deps = null) {
            this.schema = undefined;
            this.id = id;
            this.name = '_never_';
            this.defaultValue = undefined;
            this.deps = deps;
        }
        validate(input) {
            return this.defaultValue;
        }
    }
    class SimpleEditorOption {
        constructor(id, name, defaultValue, schema) {
            this.id = id;
            this.name = name;
            this.defaultValue = defaultValue;
            this.schema = schema;
        }
        validate(input) {
            if (typeof input === 'undefined') {
                return this.defaultValue;
            }
            return input;
        }
        compute(env, options, value) {
            return value;
        }
    }
    class EditorBooleanOption extends SimpleEditorOption {
        static boolean(value, defaultValue) {
            if (typeof value === 'undefined') {
                return defaultValue;
            }
            if (value === 'false') {
                // treat the string 'false' as false
                return false;
            }
            return Boolean(value);
        }
        constructor(id, name, defaultValue, schema = undefined) {
            if (typeof schema !== 'undefined') {
                schema.type = 'boolean';
                schema.default = defaultValue;
            }
            super(id, name, defaultValue, schema);
        }
        validate(input) {
            return EditorBooleanOption.boolean(input, this.defaultValue);
        }
    }
    class EditorIntOption extends SimpleEditorOption {
        constructor(id, name, defaultValue, minimum, maximum, schema = undefined) {
            if (typeof schema !== 'undefined') {
                schema.type = 'integer';
                schema.default = defaultValue;
                schema.minimum = minimum;
                schema.maximum = maximum;
            }
            super(id, name, defaultValue, schema);
            this.minimum = minimum;
            this.maximum = maximum;
        }
        static clampedInt(value, defaultValue, minimum, maximum) {
            let r;
            if (typeof value === 'undefined') {
                r = defaultValue;
            }
            else {
                r = parseInt(value, 10);
                if (isNaN(r)) {
                    r = defaultValue;
                }
            }
            r = Math.max(minimum, r);
            r = Math.min(maximum, r);
            return r | 0;
        }
        validate(input) {
            return EditorIntOption.clampedInt(input, this.defaultValue, this.minimum, this.maximum);
        }
    }
    class EditorFloatOption extends SimpleEditorOption {
        constructor(id, name, defaultValue, validationFn, schema) {
            if (typeof schema !== 'undefined') {
                schema.type = 'number';
                schema.default = defaultValue;
            }
            super(id, name, defaultValue, schema);
            this.validationFn = validationFn;
        }
        static clamp(n, min, max) {
            if (n < min) {
                return min;
            }
            if (n > max) {
                return max;
            }
            return n;
        }
        static float(value, defaultValue) {
            if (typeof value === 'number') {
                return value;
            }
            if (typeof value === 'undefined') {
                return defaultValue;
            }
            const r = parseFloat(value);
            return (isNaN(r) ? defaultValue : r);
        }
        validate(input) {
            return this.validationFn(EditorFloatOption.float(input, this.defaultValue));
        }
    }
    class EditorStringOption extends SimpleEditorOption {
        static string(value, defaultValue) {
            if (typeof value !== 'string') {
                return defaultValue;
            }
            return value;
        }
        constructor(id, name, defaultValue, schema = undefined) {
            if (typeof schema !== 'undefined') {
                schema.type = 'string';
                schema.default = defaultValue;
            }
            super(id, name, defaultValue, schema);
        }
        validate(input) {
            return EditorStringOption.string(input, this.defaultValue);
        }
    }
    class EditorStringEnumOption extends SimpleEditorOption {
        constructor(id, name, defaultValue, allowedValues, schema = undefined) {
            if (typeof schema !== 'undefined') {
                schema.type = 'string';
                schema.enum = allowedValues;
                schema.default = defaultValue;
            }
            super(id, name, defaultValue, schema);
            this._allowedValues = allowedValues;
        }
        static stringSet(value, defaultValue, allowedValues) {
            if (typeof value !== 'string') {
                return defaultValue;
            }
            if (allowedValues.indexOf(value) === -1) {
                return defaultValue;
            }
            return value;
        }
        validate(input) {
            return EditorStringEnumOption.stringSet(input, this.defaultValue, this._allowedValues);
        }
    }
    class EditorEnumOption extends BaseEditorOption {
        constructor(id, name, defaultValue, defaultStringValue, allowedValues, convert, schema = undefined) {
            if (typeof schema !== 'undefined') {
                schema.type = 'string';
                schema.enum = allowedValues;
                schema.default = defaultStringValue;
            }
            super(id, name, defaultValue, schema);
            this._allowedValues = allowedValues;
            this._convert = convert;
        }
        validate(input) {
            if (typeof input !== 'string') {
                return this.defaultValue;
            }
            if (this._allowedValues.indexOf(input) === -1) {
                return this.defaultValue;
            }
            return this._convert(input);
        }
    }
    //#endregion
    //#region accessibilitySupport
    class EditorAccessibilitySupport extends BaseEditorOption {
        constructor() {
            super(2 /* accessibilitySupport */, 'accessibilitySupport', 0 /* Unknown */, {
                type: 'string',
                enum: ['auto', 'on', 'off'],
                enumDescriptions: [
                    nls.localize('accessibilitySupport.auto', "The editor will use platform APIs to detect when a Screen Reader is attached."),
                    nls.localize('accessibilitySupport.on', "The editor will be permanently optimized for usage with a Screen Reader."),
                    nls.localize('accessibilitySupport.off', "The editor will never be optimized for usage with a Screen Reader."),
                ],
                default: 'auto',
                description: nls.localize('accessibilitySupport', "Controls whether the editor should run in a mode where it is optimized for screen readers.")
            });
        }
        validate(input) {
            switch (input) {
                case 'auto': return 0 /* Unknown */;
                case 'off': return 1 /* Disabled */;
                case 'on': return 2 /* Enabled */;
            }
            return this.defaultValue;
        }
        compute(env, options, value) {
            if (value === 0 /* Unknown */) {
                // The editor reads the `accessibilitySupport` from the environment
                return env.accessibilitySupport;
            }
            return value;
        }
    }
    //#endregion
    //#region cursorBlinking
    /**
     * The kind of animation in which the editor's cursor should be rendered.
     */
    var TextEditorCursorBlinkingStyle;
    (function (TextEditorCursorBlinkingStyle) {
        /**
         * Hidden
         */
        TextEditorCursorBlinkingStyle[TextEditorCursorBlinkingStyle["Hidden"] = 0] = "Hidden";
        /**
         * Blinking
         */
        TextEditorCursorBlinkingStyle[TextEditorCursorBlinkingStyle["Blink"] = 1] = "Blink";
        /**
         * Blinking with smooth fading
         */
        TextEditorCursorBlinkingStyle[TextEditorCursorBlinkingStyle["Smooth"] = 2] = "Smooth";
        /**
         * Blinking with prolonged filled state and smooth fading
         */
        TextEditorCursorBlinkingStyle[TextEditorCursorBlinkingStyle["Phase"] = 3] = "Phase";
        /**
         * Expand collapse animation on the y axis
         */
        TextEditorCursorBlinkingStyle[TextEditorCursorBlinkingStyle["Expand"] = 4] = "Expand";
        /**
         * No-Blinking
         */
        TextEditorCursorBlinkingStyle[TextEditorCursorBlinkingStyle["Solid"] = 5] = "Solid";
    })(TextEditorCursorBlinkingStyle = exports.TextEditorCursorBlinkingStyle || (exports.TextEditorCursorBlinkingStyle = {}));
    function _cursorBlinkingStyleFromString(cursorBlinkingStyle) {
        switch (cursorBlinkingStyle) {
            case 'blink': return 1 /* Blink */;
            case 'smooth': return 2 /* Smooth */;
            case 'phase': return 3 /* Phase */;
            case 'expand': return 4 /* Expand */;
            case 'solid': return 5 /* Solid */;
        }
    }
    //#endregion
    //#region cursorStyle
    /**
     * The style in which the editor's cursor should be rendered.
     */
    var TextEditorCursorStyle;
    (function (TextEditorCursorStyle) {
        /**
         * As a vertical line (sitting between two characters).
         */
        TextEditorCursorStyle[TextEditorCursorStyle["Line"] = 1] = "Line";
        /**
         * As a block (sitting on top of a character).
         */
        TextEditorCursorStyle[TextEditorCursorStyle["Block"] = 2] = "Block";
        /**
         * As a horizontal line (sitting under a character).
         */
        TextEditorCursorStyle[TextEditorCursorStyle["Underline"] = 3] = "Underline";
        /**
         * As a thin vertical line (sitting between two characters).
         */
        TextEditorCursorStyle[TextEditorCursorStyle["LineThin"] = 4] = "LineThin";
        /**
         * As an outlined block (sitting on top of a character).
         */
        TextEditorCursorStyle[TextEditorCursorStyle["BlockOutline"] = 5] = "BlockOutline";
        /**
         * As a thin horizontal line (sitting under a character).
         */
        TextEditorCursorStyle[TextEditorCursorStyle["UnderlineThin"] = 6] = "UnderlineThin";
    })(TextEditorCursorStyle = exports.TextEditorCursorStyle || (exports.TextEditorCursorStyle = {}));
    /**
     * @internal
     */
    function cursorStyleToString(cursorStyle) {
        switch (cursorStyle) {
            case TextEditorCursorStyle.Line: return 'line';
            case TextEditorCursorStyle.Block: return 'block';
            case TextEditorCursorStyle.Underline: return 'underline';
            case TextEditorCursorStyle.LineThin: return 'line-thin';
            case TextEditorCursorStyle.BlockOutline: return 'block-outline';
            case TextEditorCursorStyle.UnderlineThin: return 'underline-thin';
        }
    }
    exports.cursorStyleToString = cursorStyleToString;
    function _cursorStyleFromString(cursorStyle) {
        switch (cursorStyle) {
            case 'line': return TextEditorCursorStyle.Line;
            case 'block': return TextEditorCursorStyle.Block;
            case 'underline': return TextEditorCursorStyle.Underline;
            case 'line-thin': return TextEditorCursorStyle.LineThin;
            case 'block-outline': return TextEditorCursorStyle.BlockOutline;
            case 'underline-thin': return TextEditorCursorStyle.UnderlineThin;
        }
    }
    //#endregion
    //#region editorClassName
    class EditorClassName extends ComputedEditorOption {
        constructor() {
            super(98 /* editorClassName */, [51 /* mouseStyle */, 31 /* fontLigatures */, 23 /* extraEditorClassName */]);
        }
        compute(env, options, _) {
            let className = 'monaco-editor';
            if (options.get(23 /* extraEditorClassName */)) {
                className += ' ' + options.get(23 /* extraEditorClassName */);
            }
            if (env.extraEditorClassName) {
                className += ' ' + env.extraEditorClassName;
            }
            if (options.get(31 /* fontLigatures */)) {
                className += ' enable-ligatures';
            }
            if (options.get(51 /* mouseStyle */) === 'default') {
                className += ' mouse-default';
            }
            else if (options.get(51 /* mouseStyle */) === 'copy') {
                className += ' mouse-copy';
            }
            return className;
        }
    }
    //#endregion
    //#region emptySelectionClipboard
    class EditorEmptySelectionClipboard extends EditorBooleanOption {
        constructor() {
            super(22 /* emptySelectionClipboard */, 'emptySelectionClipboard', true, { description: nls.localize('emptySelectionClipboard', "Controls whether copying without a selection copies the current line.") });
        }
        compute(env, options, value) {
            return value && env.emptySelectionClipboard;
        }
    }
    class EditorFind extends BaseEditorOption {
        constructor() {
            const defaults = {
                seedSearchStringFromSelection: true,
                autoFindInSelection: false,
                globalFindClipboard: false,
                addExtraSpaceOnTop: true
            };
            super(25 /* find */, 'find', defaults, {
                'editor.find.seedSearchStringFromSelection': {
                    type: 'boolean',
                    default: defaults.seedSearchStringFromSelection,
                    description: nls.localize('find.seedSearchStringFromSelection', "Controls whether the search string in the Find Widget is seeded from the editor selection.")
                },
                'editor.find.autoFindInSelection': {
                    type: 'boolean',
                    default: defaults.autoFindInSelection,
                    description: nls.localize('find.autoFindInSelection', "Controls whether the find operation is carried out on selected text or the entire file in the editor.")
                },
                'editor.find.globalFindClipboard': {
                    type: 'boolean',
                    default: defaults.globalFindClipboard,
                    description: nls.localize('find.globalFindClipboard', "Controls whether the Find Widget should read or modify the shared find clipboard on macOS."),
                    included: platform.isMacintosh
                },
                'editor.find.addExtraSpaceOnTop': {
                    type: 'boolean',
                    default: defaults.addExtraSpaceOnTop,
                    description: nls.localize('find.addExtraSpaceOnTop', "Controls whether the Find Widget should add extra lines on top of the editor. When true, you can scroll beyond the first line when the Find Widget is visible.")
                }
            });
        }
        validate(_input) {
            if (typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                seedSearchStringFromSelection: EditorBooleanOption.boolean(input.seedSearchStringFromSelection, this.defaultValue.seedSearchStringFromSelection),
                autoFindInSelection: EditorBooleanOption.boolean(input.autoFindInSelection, this.defaultValue.autoFindInSelection),
                globalFindClipboard: EditorBooleanOption.boolean(input.globalFindClipboard, this.defaultValue.globalFindClipboard),
                addExtraSpaceOnTop: EditorBooleanOption.boolean(input.addExtraSpaceOnTop, this.defaultValue.addExtraSpaceOnTop)
            };
        }
    }
    //#endregion
    //#region fontInfo
    class EditorFontInfo extends ComputedEditorOption {
        constructor() {
            super(30 /* fontInfo */);
        }
        compute(env, options, _) {
            return env.fontInfo;
        }
    }
    //#endregion
    //#region fontSize
    class EditorFontSize extends SimpleEditorOption {
        constructor() {
            super(32 /* fontSize */, 'fontSize', exports.EDITOR_FONT_DEFAULTS.fontSize, {
                type: 'number',
                default: exports.EDITOR_FONT_DEFAULTS.fontSize,
                description: nls.localize('fontSize', "Controls the font size in pixels.")
            });
        }
        validate(input) {
            let r = EditorFloatOption.float(input, this.defaultValue);
            if (r === 0) {
                return exports.EDITOR_FONT_DEFAULTS.fontSize;
            }
            return EditorFloatOption.clamp(r, 8, 100);
        }
        compute(env, options, value) {
            // The final fontSize respects the editor zoom level.
            // So take the result from env.fontInfo
            return env.fontInfo.fontSize;
        }
    }
    class EditorGoToLocation extends BaseEditorOption {
        constructor() {
            const defaults = { multiple: 'peek' };
            super(37 /* gotoLocation */, 'gotoLocation', defaults, {
                'editor.gotoLocation.multiple': {
                    description: nls.localize('editor.gotoLocation.multiple', "Controls the behavior of 'Go To' commands, like Go To Definition, when multiple target locations exist."),
                    type: 'string',
                    enum: ['peek', 'gotoAndPeek', 'goto'],
                    default: defaults.multiple,
                    enumDescriptions: [
                        nls.localize('editor.gotoLocation.multiple.peek', 'Show peek view of the results (default)'),
                        nls.localize('editor.gotoLocation.multiple.gotoAndPeek', 'Go to the primary result and show a peek view'),
                        nls.localize('editor.gotoLocation.multiple.goto', 'Go to the primary result and enable peek-less navigation to others')
                    ]
                },
            });
        }
        validate(_input) {
            if (typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                multiple: EditorStringEnumOption.stringSet(input.multiple, this.defaultValue.multiple, ['peek', 'gotoAndPeek', 'goto'])
            };
        }
    }
    class EditorHover extends BaseEditorOption {
        constructor() {
            const defaults = {
                enabled: true,
                delay: 300,
                sticky: true
            };
            super(40 /* hover */, 'hover', defaults, {
                'editor.hover.enabled': {
                    type: 'boolean',
                    default: defaults.enabled,
                    description: nls.localize('hover.enabled', "Controls whether the hover is shown.")
                },
                'editor.hover.delay': {
                    type: 'number',
                    default: defaults.delay,
                    description: nls.localize('hover.delay', "Controls the delay in milliseconds after which the hover is shown.")
                },
                'editor.hover.sticky': {
                    type: 'boolean',
                    default: defaults.sticky,
                    description: nls.localize('hover.sticky', "Controls whether the hover should remain visible when mouse is moved over it.")
                },
            });
        }
        validate(_input) {
            if (typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                enabled: EditorBooleanOption.boolean(input.enabled, this.defaultValue.enabled),
                delay: EditorIntOption.clampedInt(input.delay, this.defaultValue.delay, 0, 10000),
                sticky: EditorBooleanOption.boolean(input.sticky, this.defaultValue.sticky)
            };
        }
    }
    var RenderMinimap;
    (function (RenderMinimap) {
        RenderMinimap[RenderMinimap["None"] = 0] = "None";
        RenderMinimap[RenderMinimap["Small"] = 1] = "Small";
        RenderMinimap[RenderMinimap["Large"] = 2] = "Large";
        RenderMinimap[RenderMinimap["SmallBlocks"] = 3] = "SmallBlocks";
        RenderMinimap[RenderMinimap["LargeBlocks"] = 4] = "LargeBlocks";
    })(RenderMinimap = exports.RenderMinimap || (exports.RenderMinimap = {}));
    /**
     * @internal
     */
    class EditorLayoutInfoComputer extends ComputedEditorOption {
        constructor() {
            super(101 /* layoutInfo */, [36 /* glyphMargin */, 44 /* lineDecorationsWidth */, 27 /* folding */, 50 /* minimap */, 72 /* scrollbar */, 46 /* lineNumbers */]);
        }
        compute(env, options, _) {
            return EditorLayoutInfoComputer.computeLayout(options, {
                outerWidth: env.outerWidth,
                outerHeight: env.outerHeight,
                lineHeight: env.fontInfo.lineHeight,
                lineNumbersDigitCount: env.lineNumbersDigitCount,
                typicalHalfwidthCharacterWidth: env.fontInfo.typicalHalfwidthCharacterWidth,
                maxDigitWidth: env.fontInfo.maxDigitWidth,
                pixelRatio: env.pixelRatio
            });
        }
        static computeLayout(options, env) {
            const outerWidth = env.outerWidth | 0;
            const outerHeight = env.outerHeight | 0;
            const lineHeight = env.lineHeight | 0;
            const lineNumbersDigitCount = env.lineNumbersDigitCount | 0;
            const typicalHalfwidthCharacterWidth = env.typicalHalfwidthCharacterWidth;
            const maxDigitWidth = env.maxDigitWidth;
            const pixelRatio = env.pixelRatio;
            const showGlyphMargin = options.get(36 /* glyphMargin */);
            const showLineNumbers = (options.get(46 /* lineNumbers */).renderType !== 0 /* Off */);
            const lineNumbersMinChars = options.get(47 /* lineNumbersMinChars */) | 0;
            const minimap = options.get(50 /* minimap */);
            const minimapEnabled = minimap.enabled;
            const minimapSide = minimap.side;
            const minimapRenderCharacters = minimap.renderCharacters;
            const minimapMaxColumn = minimap.maxColumn | 0;
            const scrollbar = options.get(72 /* scrollbar */);
            const verticalScrollbarWidth = scrollbar.verticalScrollbarSize | 0;
            const verticalScrollbarHasArrows = scrollbar.verticalHasArrows;
            const scrollbarArrowSize = scrollbar.arrowSize | 0;
            const horizontalScrollbarHeight = scrollbar.horizontalScrollbarSize | 0;
            const rawLineDecorationsWidth = options.get(44 /* lineDecorationsWidth */);
            const folding = options.get(27 /* folding */);
            let lineDecorationsWidth;
            if (typeof rawLineDecorationsWidth === 'string' && /^\d+(\.\d+)?ch$/.test(rawLineDecorationsWidth)) {
                const multiple = parseFloat(rawLineDecorationsWidth.substr(0, rawLineDecorationsWidth.length - 2));
                lineDecorationsWidth = EditorIntOption.clampedInt(multiple * typicalHalfwidthCharacterWidth, 0, 0, 1000);
            }
            else {
                lineDecorationsWidth = EditorIntOption.clampedInt(rawLineDecorationsWidth, 0, 0, 1000);
            }
            if (folding) {
                lineDecorationsWidth += 16;
            }
            let lineNumbersWidth = 0;
            if (showLineNumbers) {
                const digitCount = Math.max(lineNumbersDigitCount, lineNumbersMinChars);
                lineNumbersWidth = Math.round(digitCount * maxDigitWidth);
            }
            let glyphMarginWidth = 0;
            if (showGlyphMargin) {
                glyphMarginWidth = lineHeight;
            }
            let glyphMarginLeft = 0;
            let lineNumbersLeft = glyphMarginLeft + glyphMarginWidth;
            let decorationsLeft = lineNumbersLeft + lineNumbersWidth;
            let contentLeft = decorationsLeft + lineDecorationsWidth;
            const remainingWidth = outerWidth - glyphMarginWidth - lineNumbersWidth - lineDecorationsWidth;
            let renderMinimap;
            let minimapLeft;
            let minimapWidth;
            let contentWidth;
            if (!minimapEnabled) {
                minimapLeft = 0;
                minimapWidth = 0;
                renderMinimap = 0 /* None */;
                contentWidth = remainingWidth;
            }
            else {
                let minimapCharWidth;
                if (pixelRatio >= 2) {
                    renderMinimap = minimapRenderCharacters ? 2 /* Large */ : 4 /* LargeBlocks */;
                    minimapCharWidth = 2 / pixelRatio;
                }
                else {
                    renderMinimap = minimapRenderCharacters ? 1 /* Small */ : 3 /* SmallBlocks */;
                    minimapCharWidth = 1 / pixelRatio;
                }
                // Given:
                // (leaving 2px for the cursor to have space after the last character)
                // viewportColumn = (contentWidth - verticalScrollbarWidth - 2) / typicalHalfwidthCharacterWidth
                // minimapWidth = viewportColumn * minimapCharWidth
                // contentWidth = remainingWidth - minimapWidth
                // What are good values for contentWidth and minimapWidth ?
                // minimapWidth = ((contentWidth - verticalScrollbarWidth - 2) / typicalHalfwidthCharacterWidth) * minimapCharWidth
                // typicalHalfwidthCharacterWidth * minimapWidth = (contentWidth - verticalScrollbarWidth - 2) * minimapCharWidth
                // typicalHalfwidthCharacterWidth * minimapWidth = (remainingWidth - minimapWidth - verticalScrollbarWidth - 2) * minimapCharWidth
                // (typicalHalfwidthCharacterWidth + minimapCharWidth) * minimapWidth = (remainingWidth - verticalScrollbarWidth - 2) * minimapCharWidth
                // minimapWidth = ((remainingWidth - verticalScrollbarWidth - 2) * minimapCharWidth) / (typicalHalfwidthCharacterWidth + minimapCharWidth)
                minimapWidth = Math.max(0, Math.floor(((remainingWidth - verticalScrollbarWidth - 2) * minimapCharWidth) / (typicalHalfwidthCharacterWidth + minimapCharWidth)));
                let minimapColumns = minimapWidth / minimapCharWidth;
                if (minimapColumns > minimapMaxColumn) {
                    minimapWidth = Math.floor(minimapMaxColumn * minimapCharWidth);
                }
                contentWidth = remainingWidth - minimapWidth;
                if (minimapSide === 'left') {
                    minimapLeft = 0;
                    glyphMarginLeft += minimapWidth;
                    lineNumbersLeft += minimapWidth;
                    decorationsLeft += minimapWidth;
                    contentLeft += minimapWidth;
                }
                else {
                    minimapLeft = outerWidth - minimapWidth - verticalScrollbarWidth;
                }
            }
            // (leaving 2px for the cursor to have space after the last character)
            const viewportColumn = Math.max(1, Math.floor((contentWidth - verticalScrollbarWidth - 2) / typicalHalfwidthCharacterWidth));
            const verticalArrowSize = (verticalScrollbarHasArrows ? scrollbarArrowSize : 0);
            return {
                width: outerWidth,
                height: outerHeight,
                glyphMarginLeft: glyphMarginLeft,
                glyphMarginWidth: glyphMarginWidth,
                glyphMarginHeight: outerHeight,
                lineNumbersLeft: lineNumbersLeft,
                lineNumbersWidth: lineNumbersWidth,
                lineNumbersHeight: outerHeight,
                decorationsLeft: decorationsLeft,
                decorationsWidth: lineDecorationsWidth,
                decorationsHeight: outerHeight,
                contentLeft: contentLeft,
                contentWidth: contentWidth,
                contentHeight: outerHeight,
                renderMinimap: renderMinimap,
                minimapLeft: minimapLeft,
                minimapWidth: minimapWidth,
                viewportColumn: viewportColumn,
                verticalScrollbarWidth: verticalScrollbarWidth,
                horizontalScrollbarHeight: horizontalScrollbarHeight,
                overviewRuler: {
                    top: verticalArrowSize,
                    width: verticalScrollbarWidth,
                    height: (outerHeight - 2 * verticalArrowSize),
                    right: 0
                }
            };
        }
    }
    exports.EditorLayoutInfoComputer = EditorLayoutInfoComputer;
    class EditorLightbulb extends BaseEditorOption {
        constructor() {
            const defaults = { enabled: true };
            super(43 /* lightbulb */, 'lightbulb', defaults, {
                'editor.lightbulb.enabled': {
                    type: 'boolean',
                    default: defaults.enabled,
                    description: nls.localize('codeActions', "Enables the code action lightbulb in the editor.")
                },
            });
        }
        validate(_input) {
            if (typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                enabled: EditorBooleanOption.boolean(input.enabled, this.defaultValue.enabled)
            };
        }
    }
    //#endregion
    //#region lineHeight
    class EditorLineHeight extends EditorIntOption {
        constructor() {
            super(45 /* lineHeight */, 'lineHeight', exports.EDITOR_FONT_DEFAULTS.lineHeight, 0, 150, { description: nls.localize('lineHeight', "Controls the line height. Use 0 to compute the line height from the font size.") });
        }
        compute(env, options, value) {
            // The lineHeight is computed from the fontSize if it is 0.
            // Moreover, the final lineHeight respects the editor zoom level.
            // So take the result from env.fontInfo
            return env.fontInfo.lineHeight;
        }
    }
    class EditorMinimap extends BaseEditorOption {
        constructor() {
            const defaults = {
                enabled: true,
                side: 'right',
                showSlider: 'mouseover',
                renderCharacters: true,
                maxColumn: 120,
            };
            super(50 /* minimap */, 'minimap', defaults, {
                'editor.minimap.enabled': {
                    type: 'boolean',
                    default: defaults.enabled,
                    description: nls.localize('minimap.enabled', "Controls whether the minimap is shown.")
                },
                'editor.minimap.side': {
                    type: 'string',
                    enum: ['left', 'right'],
                    default: defaults.side,
                    description: nls.localize('minimap.side', "Controls the side where to render the minimap.")
                },
                'editor.minimap.showSlider': {
                    type: 'string',
                    enum: ['always', 'mouseover'],
                    default: defaults.showSlider,
                    description: nls.localize('minimap.showSlider', "Controls whether the minimap slider is automatically hidden.")
                },
                'editor.minimap.renderCharacters': {
                    type: 'boolean',
                    default: defaults.renderCharacters,
                    description: nls.localize('minimap.renderCharacters', "Render the actual characters on a line as opposed to color blocks.")
                },
                'editor.minimap.maxColumn': {
                    type: 'number',
                    default: defaults.maxColumn,
                    description: nls.localize('minimap.maxColumn', "Limit the width of the minimap to render at most a certain number of columns.")
                },
            });
        }
        validate(_input) {
            if (typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                enabled: EditorBooleanOption.boolean(input.enabled, this.defaultValue.enabled),
                side: EditorStringEnumOption.stringSet(input.side, this.defaultValue.side, ['right', 'left']),
                showSlider: EditorStringEnumOption.stringSet(input.showSlider, this.defaultValue.showSlider, ['always', 'mouseover']),
                renderCharacters: EditorBooleanOption.boolean(input.renderCharacters, this.defaultValue.renderCharacters),
                maxColumn: EditorIntOption.clampedInt(input.maxColumn, this.defaultValue.maxColumn, 1, 10000),
            };
        }
    }
    //#endregion
    //#region multiCursorModifier
    function _multiCursorModifierFromString(multiCursorModifier) {
        if (multiCursorModifier === 'ctrlCmd') {
            return (platform.isMacintosh ? 'metaKey' : 'ctrlKey');
        }
        return 'altKey';
    }
    class EditorParameterHints extends BaseEditorOption {
        constructor() {
            const defaults = {
                enabled: true,
                cycle: false
            };
            super(60 /* parameterHints */, 'parameterHints', defaults, {
                'editor.parameterHints.enabled': {
                    type: 'boolean',
                    default: defaults.enabled,
                    description: nls.localize('parameterHints.enabled', "Enables a pop-up that shows parameter documentation and type information as you type.")
                },
                'editor.parameterHints.cycle': {
                    type: 'boolean',
                    default: defaults.cycle,
                    description: nls.localize('parameterHints.cycle', "Controls whether the parameter hints menu cycles or closes when reaching the end of the list.")
                },
            });
        }
        validate(_input) {
            if (typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                enabled: EditorBooleanOption.boolean(input.enabled, this.defaultValue.enabled),
                cycle: EditorBooleanOption.boolean(input.cycle, this.defaultValue.cycle)
            };
        }
    }
    //#endregion
    //#region pixelRatio
    class EditorPixelRatio extends ComputedEditorOption {
        constructor() {
            super(99 /* pixelRatio */);
        }
        compute(env, options, _) {
            return env.pixelRatio;
        }
    }
    class EditorQuickSuggestions extends BaseEditorOption {
        constructor() {
            const defaults = {
                other: true,
                comments: false,
                strings: false
            };
            super(61 /* quickSuggestions */, 'quickSuggestions', defaults, {
                anyOf: [
                    {
                        type: 'boolean',
                    },
                    {
                        type: 'object',
                        properties: {
                            strings: {
                                type: 'boolean',
                                default: defaults.strings,
                                description: nls.localize('quickSuggestions.strings', "Enable quick suggestions inside strings.")
                            },
                            comments: {
                                type: 'boolean',
                                default: defaults.comments,
                                description: nls.localize('quickSuggestions.comments', "Enable quick suggestions inside comments.")
                            },
                            other: {
                                type: 'boolean',
                                default: defaults.other,
                                description: nls.localize('quickSuggestions.other', "Enable quick suggestions outside of strings and comments.")
                            },
                        }
                    }
                ],
                default: defaults,
                description: nls.localize('quickSuggestions', "Controls whether suggestions should automatically show up while typing.")
            });
        }
        validate(_input) {
            if (typeof _input === 'boolean') {
                return _input;
            }
            if (typeof _input === 'object') {
                const input = _input;
                const opts = {
                    other: EditorBooleanOption.boolean(input.other, this.defaultValue.other),
                    comments: EditorBooleanOption.boolean(input.comments, this.defaultValue.comments),
                    strings: EditorBooleanOption.boolean(input.strings, this.defaultValue.strings),
                };
                if (opts.other && opts.comments && opts.strings) {
                    return true; // all on
                }
                else if (!opts.other && !opts.comments && !opts.strings) {
                    return false; // all off
                }
                else {
                    return opts;
                }
            }
            return this.defaultValue;
        }
    }
    var RenderLineNumbersType;
    (function (RenderLineNumbersType) {
        RenderLineNumbersType[RenderLineNumbersType["Off"] = 0] = "Off";
        RenderLineNumbersType[RenderLineNumbersType["On"] = 1] = "On";
        RenderLineNumbersType[RenderLineNumbersType["Relative"] = 2] = "Relative";
        RenderLineNumbersType[RenderLineNumbersType["Interval"] = 3] = "Interval";
        RenderLineNumbersType[RenderLineNumbersType["Custom"] = 4] = "Custom";
    })(RenderLineNumbersType = exports.RenderLineNumbersType || (exports.RenderLineNumbersType = {}));
    class EditorRenderLineNumbersOption extends BaseEditorOption {
        constructor() {
            super(46 /* lineNumbers */, 'lineNumbers', { renderType: 1 /* On */, renderFn: null }, {
                type: 'string',
                enum: ['off', 'on', 'relative', 'interval'],
                enumDescriptions: [
                    nls.localize('lineNumbers.off', "Line numbers are not rendered."),
                    nls.localize('lineNumbers.on', "Line numbers are rendered as absolute number."),
                    nls.localize('lineNumbers.relative', "Line numbers are rendered as distance in lines to cursor position."),
                    nls.localize('lineNumbers.interval', "Line numbers are rendered every 10 lines.")
                ],
                default: 'on',
                description: nls.localize('lineNumbers', "Controls the display of line numbers.")
            });
        }
        validate(lineNumbers) {
            let renderType = this.defaultValue.renderType;
            let renderFn = this.defaultValue.renderFn;
            if (typeof lineNumbers !== 'undefined') {
                if (typeof lineNumbers === 'function') {
                    renderType = 4 /* Custom */;
                    renderFn = lineNumbers;
                }
                else if (lineNumbers === 'interval') {
                    renderType = 3 /* Interval */;
                }
                else if (lineNumbers === 'relative') {
                    renderType = 2 /* Relative */;
                }
                else if (lineNumbers === 'on') {
                    renderType = 1 /* On */;
                }
                else {
                    renderType = 0 /* Off */;
                }
            }
            return {
                renderType,
                renderFn
            };
        }
    }
    //#endregion
    //#region rulers
    class EditorRulers extends SimpleEditorOption {
        constructor() {
            const defaults = [];
            super(71 /* rulers */, 'rulers', defaults, {
                type: 'array',
                items: {
                    type: 'number'
                },
                default: defaults,
                description: nls.localize('rulers', "Render vertical rulers after a certain number of monospace characters. Use multiple values for multiple rulers. No rulers are drawn if array is empty.")
            });
        }
        validate(input) {
            if (Array.isArray(input)) {
                let rulers = [];
                for (let value of input) {
                    rulers.push(EditorIntOption.clampedInt(value, 0, 0, 10000));
                }
                rulers.sort();
                return rulers;
            }
            return this.defaultValue;
        }
    }
    function _scrollbarVisibilityFromString(visibility, defaultValue) {
        if (typeof visibility !== 'string') {
            return defaultValue;
        }
        switch (visibility) {
            case 'hidden': return 2 /* Hidden */;
            case 'visible': return 3 /* Visible */;
            default: return 1 /* Auto */;
        }
    }
    class EditorScrollbar extends BaseEditorOption {
        constructor() {
            super(72 /* scrollbar */, 'scrollbar', {
                vertical: 1 /* Auto */,
                horizontal: 1 /* Auto */,
                arrowSize: 11,
                useShadows: true,
                verticalHasArrows: false,
                horizontalHasArrows: false,
                horizontalScrollbarSize: 10,
                horizontalSliderSize: 10,
                verticalScrollbarSize: 14,
                verticalSliderSize: 14,
                handleMouseWheel: true,
            });
        }
        validate(_input) {
            if (typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            const horizontalScrollbarSize = EditorIntOption.clampedInt(input.horizontalScrollbarSize, this.defaultValue.horizontalScrollbarSize, 0, 1000);
            const verticalScrollbarSize = EditorIntOption.clampedInt(input.verticalScrollbarSize, this.defaultValue.verticalScrollbarSize, 0, 1000);
            return {
                arrowSize: EditorIntOption.clampedInt(input.arrowSize, this.defaultValue.arrowSize, 0, 1000),
                vertical: _scrollbarVisibilityFromString(input.vertical, this.defaultValue.vertical),
                horizontal: _scrollbarVisibilityFromString(input.horizontal, this.defaultValue.horizontal),
                useShadows: EditorBooleanOption.boolean(input.useShadows, this.defaultValue.useShadows),
                verticalHasArrows: EditorBooleanOption.boolean(input.verticalHasArrows, this.defaultValue.verticalHasArrows),
                horizontalHasArrows: EditorBooleanOption.boolean(input.horizontalHasArrows, this.defaultValue.horizontalHasArrows),
                handleMouseWheel: EditorBooleanOption.boolean(input.handleMouseWheel, this.defaultValue.handleMouseWheel),
                horizontalScrollbarSize: horizontalScrollbarSize,
                horizontalSliderSize: EditorIntOption.clampedInt(input.horizontalSliderSize, horizontalScrollbarSize, 0, 1000),
                verticalScrollbarSize: verticalScrollbarSize,
                verticalSliderSize: EditorIntOption.clampedInt(input.verticalSliderSize, verticalScrollbarSize, 0, 1000),
            };
        }
    }
    class EditorSuggest extends BaseEditorOption {
        constructor() {
            const defaults = {
                filterGraceful: true,
                snippetsPreventQuickSuggestions: true,
                localityBonus: false,
                shareSuggestSelections: false,
                showIcons: true,
                maxVisibleSuggestions: 12,
                filteredTypes: Object.create(null)
            };
            super(83 /* suggest */, 'suggest', defaults, {
                'editor.suggest.filterGraceful': {
                    type: 'boolean',
                    default: defaults.filterGraceful,
                    description: nls.localize('suggest.filterGraceful', "Controls whether filtering and sorting suggestions accounts for small typos.")
                },
                'editor.suggest.localityBonus': {
                    type: 'boolean',
                    default: defaults.localityBonus,
                    description: nls.localize('suggest.localityBonus', "Controls whether sorting favours words that appear close to the cursor.")
                },
                'editor.suggest.shareSuggestSelections': {
                    type: 'boolean',
                    default: defaults.shareSuggestSelections,
                    markdownDescription: nls.localize('suggest.shareSuggestSelections', "Controls whether remembered suggestion selections are shared between multiple workspaces and windows (needs `#editor.suggestSelection#`).")
                },
                'editor.suggest.snippetsPreventQuickSuggestions': {
                    type: 'boolean',
                    default: defaults.snippetsPreventQuickSuggestions,
                    description: nls.localize('suggest.snippetsPreventQuickSuggestions', "Control whether an active snippet prevents quick suggestions.")
                },
                'editor.suggest.showIcons': {
                    type: 'boolean',
                    default: defaults.showIcons,
                    description: nls.localize('suggest.showIcons', "Controls whether to show or hide icons in suggestions.")
                },
                'editor.suggest.maxVisibleSuggestions': {
                    type: 'number',
                    default: defaults.maxVisibleSuggestions,
                    minimum: 1,
                    maximum: 15,
                    description: nls.localize('suggest.maxVisibleSuggestions', "Controls how many suggestions IntelliSense will show before showing a scrollbar (maximum 15).")
                },
                'editor.suggest.filteredTypes': {
                    type: 'object',
                    default: { keyword: true, snippet: true },
                    markdownDescription: nls.localize('suggest.filtered', "Controls whether some suggestion types should be filtered from IntelliSense. A list of suggestion types can be found here: https://code.visualstudio.com/docs/editor/intellisense#_types-of-completions."),
                    properties: {
                        method: {
                            type: 'boolean',
                            default: true,
                            markdownDescription: nls.localize('suggest.filtered.method', "When set to `false` IntelliSense never shows `method` suggestions.")
                        },
                        function: {
                            type: 'boolean',
                            default: true,
                            markdownDescription: nls.localize('suggest.filtered.function', "When set to `false` IntelliSense never shows `function` suggestions.")
                        },
                        constructor: {
                            type: 'boolean',
                            default: true,
                            markdownDescription: nls.localize('suggest.filtered.constructor', "When set to `false` IntelliSense never shows `constructor` suggestions.")
                        },
                        field: {
                            type: 'boolean',
                            default: true,
                            markdownDescription: nls.localize('suggest.filtered.field', "When set to `false` IntelliSense never shows `field` suggestions.")
                        },
                        variable: {
                            type: 'boolean',
                            default: true,
                            markdownDescription: nls.localize('suggest.filtered.variable', "When set to `false` IntelliSense never shows `variable` suggestions.")
                        },
                        class: {
                            type: 'boolean',
                            default: true,
                            markdownDescription: nls.localize('suggest.filtered.class', "When set to `false` IntelliSense never shows `class` suggestions.")
                        },
                        struct: {
                            type: 'boolean',
                            default: true,
                            markdownDescription: nls.localize('suggest.filtered.struct', "When set to `false` IntelliSense never shows `struct` suggestions.")
                        },
                        interface: {
                            type: 'boolean',
                            default: true,
                            markdownDescription: nls.localize('suggest.filtered.interface', "When set to `false` IntelliSense never shows `interface` suggestions.")
                        },
                        module: {
                            type: 'boolean',
                            default: true,
                            markdownDescription: nls.localize('suggest.filtered.module', "When set to `false` IntelliSense never shows `module` suggestions.")
                        },
                        property: {
                            type: 'boolean',
                            default: true,
                            markdownDescription: nls.localize('suggest.filtered.property', "When set to `false` IntelliSense never shows `property` suggestions.")
                        },
                        event: {
                            type: 'boolean',
                            default: true,
                            markdownDescription: nls.localize('suggest.filtered.event', "When set to `false` IntelliSense never shows `event` suggestions.")
                        },
                        operator: {
                            type: 'boolean',
                            default: true,
                            markdownDescription: nls.localize('suggest.filtered.operator', "When set to `false` IntelliSense never shows `operator` suggestions.")
                        },
                        unit: {
                            type: 'boolean',
                            default: true,
                            markdownDescription: nls.localize('suggest.filtered.unit', "When set to `false` IntelliSense never shows `unit` suggestions.")
                        },
                        value: {
                            type: 'boolean',
                            default: true,
                            markdownDescription: nls.localize('suggest.filtered.value', "When set to `false` IntelliSense never shows `value` suggestions.")
                        },
                        constant: {
                            type: 'boolean',
                            default: true,
                            markdownDescription: nls.localize('suggest.filtered.constant', "When set to `false` IntelliSense never shows `constant` suggestions.")
                        },
                        enum: {
                            type: 'boolean',
                            default: true,
                            markdownDescription: nls.localize('suggest.filtered.enum', "When set to `false` IntelliSense never shows `enum` suggestions.")
                        },
                        enumMember: {
                            type: 'boolean',
                            default: true,
                            markdownDescription: nls.localize('suggest.filtered.enumMember', "When set to `false` IntelliSense never shows `enumMember` suggestions.")
                        },
                        keyword: {
                            type: 'boolean',
                            default: true,
                            markdownDescription: nls.localize('suggest.filtered.keyword', "When set to `false` IntelliSense never shows `keyword` suggestions.")
                        },
                        text: {
                            type: 'boolean',
                            default: true,
                            markdownDescription: nls.localize('suggest.filtered.text', "When set to `false` IntelliSense never shows `text` suggestions.")
                        },
                        color: {
                            type: 'boolean',
                            default: true,
                            markdownDescription: nls.localize('suggest.filtered.color', "When set to `false` IntelliSense never shows `color` suggestions.")
                        },
                        file: {
                            type: 'boolean',
                            default: true,
                            markdownDescription: nls.localize('suggest.filtered.file', "When set to `false` IntelliSense never shows `file` suggestions.")
                        },
                        reference: {
                            type: 'boolean',
                            default: true,
                            markdownDescription: nls.localize('suggest.filtered.reference', "When set to `false` IntelliSense never shows `reference` suggestions.")
                        },
                        customcolor: {
                            type: 'boolean',
                            default: true,
                            markdownDescription: nls.localize('suggest.filtered.customcolor', "When set to `false` IntelliSense never shows `customcolor` suggestions.")
                        },
                        folder: {
                            type: 'boolean',
                            default: true,
                            markdownDescription: nls.localize('suggest.filtered.folder', "When set to `false` IntelliSense never shows `folder` suggestions.")
                        },
                        typeParameter: {
                            type: 'boolean',
                            default: true,
                            markdownDescription: nls.localize('suggest.filtered.typeParameter', "When set to `false` IntelliSense never shows `typeParameter` suggestions.")
                        },
                        snippet: {
                            type: 'boolean',
                            default: true,
                            markdownDescription: nls.localize('suggest.filtered.snippet', "When set to `false` IntelliSense never shows `snippet` suggestions.")
                        },
                    }
                },
            });
        }
        validate(_input) {
            if (typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                filterGraceful: EditorBooleanOption.boolean(input.filterGraceful, this.defaultValue.filterGraceful),
                snippetsPreventQuickSuggestions: EditorBooleanOption.boolean(input.snippetsPreventQuickSuggestions, this.defaultValue.filterGraceful),
                localityBonus: EditorBooleanOption.boolean(input.localityBonus, this.defaultValue.localityBonus),
                shareSuggestSelections: EditorBooleanOption.boolean(input.shareSuggestSelections, this.defaultValue.shareSuggestSelections),
                showIcons: EditorBooleanOption.boolean(input.showIcons, this.defaultValue.showIcons),
                maxVisibleSuggestions: EditorIntOption.clampedInt(input.maxVisibleSuggestions, this.defaultValue.maxVisibleSuggestions, 1, 15),
                filteredTypes: types_1.isObject(input.filteredTypes) ? input.filteredTypes : Object.create(null)
            };
        }
    }
    //#endregion
    //#region tabFocusMode
    class EditorTabFocusMode extends ComputedEditorOption {
        constructor() {
            super(100 /* tabFocusMode */, [63 /* readOnly */]);
        }
        compute(env, options, _) {
            const readOnly = options.get(63 /* readOnly */);
            return (readOnly ? true : env.tabFocusMode);
        }
    }
    //#endregion
    //#region wrappingIndent
    /**
     * Describes how to indent wrapped lines.
     */
    var WrappingIndent;
    (function (WrappingIndent) {
        /**
         * No indentation => wrapped lines begin at column 1.
         */
        WrappingIndent[WrappingIndent["None"] = 0] = "None";
        /**
         * Same => wrapped lines get the same indentation as the parent.
         */
        WrappingIndent[WrappingIndent["Same"] = 1] = "Same";
        /**
         * Indent => wrapped lines get +1 indentation toward the parent.
         */
        WrappingIndent[WrappingIndent["Indent"] = 2] = "Indent";
        /**
         * DeepIndent => wrapped lines get +2 indentation toward the parent.
         */
        WrappingIndent[WrappingIndent["DeepIndent"] = 3] = "DeepIndent";
    })(WrappingIndent = exports.WrappingIndent || (exports.WrappingIndent = {}));
    function _wrappingIndentFromString(wrappingIndent) {
        switch (wrappingIndent) {
            case 'none': return 0 /* None */;
            case 'same': return 1 /* Same */;
            case 'indent': return 2 /* Indent */;
            case 'deepIndent': return 3 /* DeepIndent */;
        }
    }
    class EditorWrappingInfoComputer extends ComputedEditorOption {
        constructor() {
            super(102 /* wrappingInfo */, [91 /* wordWrap */, 95 /* wordWrapColumn */, 96 /* wordWrapMinified */, 101 /* layoutInfo */, 2 /* accessibilitySupport */]);
        }
        compute(env, options, _) {
            const wordWrap = options.get(91 /* wordWrap */);
            const wordWrapColumn = options.get(95 /* wordWrapColumn */);
            const wordWrapMinified = options.get(96 /* wordWrapMinified */);
            const layoutInfo = options.get(101 /* layoutInfo */);
            const accessibilitySupport = options.get(2 /* accessibilitySupport */);
            let bareWrappingInfo = null;
            {
                if (accessibilitySupport === 2 /* Enabled */) {
                    // See https://github.com/Microsoft/vscode/issues/27766
                    // Never enable wrapping when a screen reader is attached
                    // because arrow down etc. will not move the cursor in the way
                    // a screen reader expects.
                    bareWrappingInfo = {
                        isWordWrapMinified: false,
                        isViewportWrapping: false,
                        wrappingColumn: -1
                    };
                }
                else if (wordWrapMinified && env.isDominatedByLongLines) {
                    // Force viewport width wrapping if model is dominated by long lines
                    bareWrappingInfo = {
                        isWordWrapMinified: true,
                        isViewportWrapping: true,
                        wrappingColumn: Math.max(1, layoutInfo.viewportColumn)
                    };
                }
                else if (wordWrap === 'on') {
                    bareWrappingInfo = {
                        isWordWrapMinified: false,
                        isViewportWrapping: true,
                        wrappingColumn: Math.max(1, layoutInfo.viewportColumn)
                    };
                }
                else if (wordWrap === 'bounded') {
                    bareWrappingInfo = {
                        isWordWrapMinified: false,
                        isViewportWrapping: true,
                        wrappingColumn: Math.min(Math.max(1, layoutInfo.viewportColumn), wordWrapColumn)
                    };
                }
                else if (wordWrap === 'wordWrapColumn') {
                    bareWrappingInfo = {
                        isWordWrapMinified: false,
                        isViewportWrapping: false,
                        wrappingColumn: wordWrapColumn
                    };
                }
                else {
                    bareWrappingInfo = {
                        isWordWrapMinified: false,
                        isViewportWrapping: false,
                        wrappingColumn: -1
                    };
                }
            }
            return {
                isDominatedByLongLines: env.isDominatedByLongLines,
                isWordWrapMinified: bareWrappingInfo.isWordWrapMinified,
                isViewportWrapping: bareWrappingInfo.isViewportWrapping,
                wrappingColumn: bareWrappingInfo.wrappingColumn,
            };
        }
    }
    //#endregion
    const DEFAULT_WINDOWS_FONT_FAMILY = 'Consolas, \'Courier New\', monospace';
    const DEFAULT_MAC_FONT_FAMILY = 'Menlo, Monaco, \'Courier New\', monospace';
    const DEFAULT_LINUX_FONT_FAMILY = '\'Droid Sans Mono\', \'monospace\', monospace, \'Droid Sans Fallback\'';
    /**
     * @internal
     */
    exports.EDITOR_FONT_DEFAULTS = {
        fontFamily: (platform.isMacintosh ? DEFAULT_MAC_FONT_FAMILY : (platform.isLinux ? DEFAULT_LINUX_FONT_FAMILY : DEFAULT_WINDOWS_FONT_FAMILY)),
        fontWeight: 'normal',
        fontSize: (platform.isMacintosh ? 12 : 14),
        lineHeight: 0,
        letterSpacing: 0,
    };
    /**
     * @internal
     */
    exports.EDITOR_MODEL_DEFAULTS = {
        tabSize: 4,
        indentSize: 4,
        insertSpaces: true,
        detectIndentation: true,
        trimAutoWhitespace: true,
        largeFileOptimizations: true
    };
    /**
     * @internal
     */
    exports.editorOptionsRegistry = [];
    function register(option) {
        exports.editorOptionsRegistry[option.id] = option;
        return option;
    }
    /**
     * @internal
     */
    var EditorOption;
    (function (EditorOption) {
        EditorOption[EditorOption["acceptSuggestionOnCommitCharacter"] = 0] = "acceptSuggestionOnCommitCharacter";
        EditorOption[EditorOption["acceptSuggestionOnEnter"] = 1] = "acceptSuggestionOnEnter";
        EditorOption[EditorOption["accessibilitySupport"] = 2] = "accessibilitySupport";
        EditorOption[EditorOption["ariaLabel"] = 3] = "ariaLabel";
        EditorOption[EditorOption["autoClosingBrackets"] = 4] = "autoClosingBrackets";
        EditorOption[EditorOption["autoClosingOvertype"] = 5] = "autoClosingOvertype";
        EditorOption[EditorOption["autoClosingQuotes"] = 6] = "autoClosingQuotes";
        EditorOption[EditorOption["autoIndent"] = 7] = "autoIndent";
        EditorOption[EditorOption["automaticLayout"] = 8] = "automaticLayout";
        EditorOption[EditorOption["autoSurround"] = 9] = "autoSurround";
        EditorOption[EditorOption["codeLens"] = 10] = "codeLens";
        EditorOption[EditorOption["colorDecorators"] = 11] = "colorDecorators";
        EditorOption[EditorOption["contextmenu"] = 12] = "contextmenu";
        EditorOption[EditorOption["copyWithSyntaxHighlighting"] = 13] = "copyWithSyntaxHighlighting";
        EditorOption[EditorOption["cursorBlinking"] = 14] = "cursorBlinking";
        EditorOption[EditorOption["cursorSmoothCaretAnimation"] = 15] = "cursorSmoothCaretAnimation";
        EditorOption[EditorOption["cursorStyle"] = 16] = "cursorStyle";
        EditorOption[EditorOption["cursorSurroundingLines"] = 17] = "cursorSurroundingLines";
        EditorOption[EditorOption["cursorWidth"] = 18] = "cursorWidth";
        EditorOption[EditorOption["disableLayerHinting"] = 19] = "disableLayerHinting";
        EditorOption[EditorOption["disableMonospaceOptimizations"] = 20] = "disableMonospaceOptimizations";
        EditorOption[EditorOption["dragAndDrop"] = 21] = "dragAndDrop";
        EditorOption[EditorOption["emptySelectionClipboard"] = 22] = "emptySelectionClipboard";
        EditorOption[EditorOption["extraEditorClassName"] = 23] = "extraEditorClassName";
        EditorOption[EditorOption["fastScrollSensitivity"] = 24] = "fastScrollSensitivity";
        EditorOption[EditorOption["find"] = 25] = "find";
        EditorOption[EditorOption["fixedOverflowWidgets"] = 26] = "fixedOverflowWidgets";
        EditorOption[EditorOption["folding"] = 27] = "folding";
        EditorOption[EditorOption["foldingStrategy"] = 28] = "foldingStrategy";
        EditorOption[EditorOption["fontFamily"] = 29] = "fontFamily";
        EditorOption[EditorOption["fontInfo"] = 30] = "fontInfo";
        EditorOption[EditorOption["fontLigatures"] = 31] = "fontLigatures";
        EditorOption[EditorOption["fontSize"] = 32] = "fontSize";
        EditorOption[EditorOption["fontWeight"] = 33] = "fontWeight";
        EditorOption[EditorOption["formatOnPaste"] = 34] = "formatOnPaste";
        EditorOption[EditorOption["formatOnType"] = 35] = "formatOnType";
        EditorOption[EditorOption["glyphMargin"] = 36] = "glyphMargin";
        EditorOption[EditorOption["gotoLocation"] = 37] = "gotoLocation";
        EditorOption[EditorOption["hideCursorInOverviewRuler"] = 38] = "hideCursorInOverviewRuler";
        EditorOption[EditorOption["highlightActiveIndentGuide"] = 39] = "highlightActiveIndentGuide";
        EditorOption[EditorOption["hover"] = 40] = "hover";
        EditorOption[EditorOption["inDiffEditor"] = 41] = "inDiffEditor";
        EditorOption[EditorOption["letterSpacing"] = 42] = "letterSpacing";
        EditorOption[EditorOption["lightbulb"] = 43] = "lightbulb";
        EditorOption[EditorOption["lineDecorationsWidth"] = 44] = "lineDecorationsWidth";
        EditorOption[EditorOption["lineHeight"] = 45] = "lineHeight";
        EditorOption[EditorOption["lineNumbers"] = 46] = "lineNumbers";
        EditorOption[EditorOption["lineNumbersMinChars"] = 47] = "lineNumbersMinChars";
        EditorOption[EditorOption["links"] = 48] = "links";
        EditorOption[EditorOption["matchBrackets"] = 49] = "matchBrackets";
        EditorOption[EditorOption["minimap"] = 50] = "minimap";
        EditorOption[EditorOption["mouseStyle"] = 51] = "mouseStyle";
        EditorOption[EditorOption["mouseWheelScrollSensitivity"] = 52] = "mouseWheelScrollSensitivity";
        EditorOption[EditorOption["mouseWheelZoom"] = 53] = "mouseWheelZoom";
        EditorOption[EditorOption["multiCursorMergeOverlapping"] = 54] = "multiCursorMergeOverlapping";
        EditorOption[EditorOption["multiCursorModifier"] = 55] = "multiCursorModifier";
        EditorOption[EditorOption["multiCursorPaste"] = 56] = "multiCursorPaste";
        EditorOption[EditorOption["occurrencesHighlight"] = 57] = "occurrencesHighlight";
        EditorOption[EditorOption["overviewRulerBorder"] = 58] = "overviewRulerBorder";
        EditorOption[EditorOption["overviewRulerLanes"] = 59] = "overviewRulerLanes";
        EditorOption[EditorOption["parameterHints"] = 60] = "parameterHints";
        EditorOption[EditorOption["quickSuggestions"] = 61] = "quickSuggestions";
        EditorOption[EditorOption["quickSuggestionsDelay"] = 62] = "quickSuggestionsDelay";
        EditorOption[EditorOption["readOnly"] = 63] = "readOnly";
        EditorOption[EditorOption["renderControlCharacters"] = 64] = "renderControlCharacters";
        EditorOption[EditorOption["renderIndentGuides"] = 65] = "renderIndentGuides";
        EditorOption[EditorOption["renderFinalNewline"] = 66] = "renderFinalNewline";
        EditorOption[EditorOption["renderLineHighlight"] = 67] = "renderLineHighlight";
        EditorOption[EditorOption["renderWhitespace"] = 68] = "renderWhitespace";
        EditorOption[EditorOption["revealHorizontalRightPadding"] = 69] = "revealHorizontalRightPadding";
        EditorOption[EditorOption["roundedSelection"] = 70] = "roundedSelection";
        EditorOption[EditorOption["rulers"] = 71] = "rulers";
        EditorOption[EditorOption["scrollbar"] = 72] = "scrollbar";
        EditorOption[EditorOption["scrollBeyondLastColumn"] = 73] = "scrollBeyondLastColumn";
        EditorOption[EditorOption["scrollBeyondLastLine"] = 74] = "scrollBeyondLastLine";
        EditorOption[EditorOption["selectionClipboard"] = 75] = "selectionClipboard";
        EditorOption[EditorOption["selectionHighlight"] = 76] = "selectionHighlight";
        EditorOption[EditorOption["selectOnLineNumbers"] = 77] = "selectOnLineNumbers";
        EditorOption[EditorOption["showFoldingControls"] = 78] = "showFoldingControls";
        EditorOption[EditorOption["showUnused"] = 79] = "showUnused";
        EditorOption[EditorOption["snippetSuggestions"] = 80] = "snippetSuggestions";
        EditorOption[EditorOption["smoothScrolling"] = 81] = "smoothScrolling";
        EditorOption[EditorOption["stopRenderingLineAfter"] = 82] = "stopRenderingLineAfter";
        EditorOption[EditorOption["suggest"] = 83] = "suggest";
        EditorOption[EditorOption["suggestFontSize"] = 84] = "suggestFontSize";
        EditorOption[EditorOption["suggestLineHeight"] = 85] = "suggestLineHeight";
        EditorOption[EditorOption["suggestOnTriggerCharacters"] = 86] = "suggestOnTriggerCharacters";
        EditorOption[EditorOption["suggestSelection"] = 87] = "suggestSelection";
        EditorOption[EditorOption["tabCompletion"] = 88] = "tabCompletion";
        EditorOption[EditorOption["useTabStops"] = 89] = "useTabStops";
        EditorOption[EditorOption["wordSeparators"] = 90] = "wordSeparators";
        EditorOption[EditorOption["wordWrap"] = 91] = "wordWrap";
        EditorOption[EditorOption["wordWrapBreakAfterCharacters"] = 92] = "wordWrapBreakAfterCharacters";
        EditorOption[EditorOption["wordWrapBreakBeforeCharacters"] = 93] = "wordWrapBreakBeforeCharacters";
        EditorOption[EditorOption["wordWrapBreakObtrusiveCharacters"] = 94] = "wordWrapBreakObtrusiveCharacters";
        EditorOption[EditorOption["wordWrapColumn"] = 95] = "wordWrapColumn";
        EditorOption[EditorOption["wordWrapMinified"] = 96] = "wordWrapMinified";
        EditorOption[EditorOption["wrappingIndent"] = 97] = "wrappingIndent";
        // Leave these at the end (because they have dependencies!)
        EditorOption[EditorOption["editorClassName"] = 98] = "editorClassName";
        EditorOption[EditorOption["pixelRatio"] = 99] = "pixelRatio";
        EditorOption[EditorOption["tabFocusMode"] = 100] = "tabFocusMode";
        EditorOption[EditorOption["layoutInfo"] = 101] = "layoutInfo";
        EditorOption[EditorOption["wrappingInfo"] = 102] = "wrappingInfo";
    })(EditorOption = exports.EditorOption || (exports.EditorOption = {}));
    /**
     * @internal
     */
    exports.EditorOptions = {
        acceptSuggestionOnCommitCharacter: register(new EditorBooleanOption(0 /* acceptSuggestionOnCommitCharacter */, 'acceptSuggestionOnCommitCharacter', true, { markdownDescription: nls.localize('acceptSuggestionOnCommitCharacter', "Controls whether suggestions should be accepted on commit characters. For example, in JavaScript, the semi-colon (`;`) can be a commit character that accepts a suggestion and types that character.") })),
        acceptSuggestionOnEnter: register(new EditorStringEnumOption(1 /* acceptSuggestionOnEnter */, 'acceptSuggestionOnEnter', 'on', ['on', 'smart', 'off'], {
            markdownEnumDescriptions: [
                '',
                nls.localize('acceptSuggestionOnEnterSmart', "Only accept a suggestion with `Enter` when it makes a textual change."),
                ''
            ],
            markdownDescription: nls.localize('acceptSuggestionOnEnter', "Controls whether suggestions should be accepted on `Enter`, in addition to `Tab`. Helps to avoid ambiguity between inserting new lines or accepting suggestions.")
        })),
        accessibilitySupport: register(new EditorAccessibilitySupport()),
        ariaLabel: register(new EditorStringOption(3 /* ariaLabel */, 'ariaLabel', nls.localize('editorViewAccessibleLabel', "Editor content"))),
        autoClosingBrackets: register(new EditorStringEnumOption(4 /* autoClosingBrackets */, 'autoClosingBrackets', 'languageDefined', ['always', 'languageDefined', 'beforeWhitespace', 'never'], {
            enumDescriptions: [
                '',
                nls.localize('editor.autoClosingBrackets.languageDefined', "Use language configurations to determine when to autoclose brackets."),
                nls.localize('editor.autoClosingBrackets.beforeWhitespace', "Autoclose brackets only when the cursor is to the left of whitespace."),
                '',
            ],
            description: nls.localize('autoClosingBrackets', "Controls whether the editor should automatically close brackets after the user adds an opening bracket.")
        })),
        autoClosingOvertype: register(new EditorStringEnumOption(5 /* autoClosingOvertype */, 'autoClosingOvertype', 'auto', ['always', 'auto', 'never'], {
            enumDescriptions: [
                '',
                nls.localize('editor.autoClosingOvertype.auto', "Type over closing quotes or brackets only if they were automatically inserted."),
                '',
            ],
            description: nls.localize('autoClosingOvertype', "Controls whether the editor should type over closing quotes or brackets.")
        })),
        autoClosingQuotes: register(new EditorStringEnumOption(6 /* autoClosingQuotes */, 'autoClosingQuotes', 'languageDefined', ['always', 'languageDefined', 'beforeWhitespace', 'never'], {
            enumDescriptions: [
                '',
                nls.localize('editor.autoClosingQuotes.languageDefined', "Use language configurations to determine when to autoclose quotes."),
                nls.localize('editor.autoClosingQuotes.beforeWhitespace', "Autoclose quotes only when the cursor is to the left of whitespace."),
                '',
            ],
            description: nls.localize('autoClosingQuotes', "Controls whether the editor should automatically close quotes after the user adds an opening quote.")
        })),
        autoIndent: register(new EditorBooleanOption(7 /* autoIndent */, 'autoIndent', true, { description: nls.localize('autoIndent', "Controls whether the editor should automatically adjust the indentation when users type, paste or move lines. Extensions with indentation rules of the language must be available.") })),
        automaticLayout: register(new EditorBooleanOption(8 /* automaticLayout */, 'automaticLayout', false)),
        autoSurround: register(new EditorStringEnumOption(9 /* autoSurround */, 'autoSurround', 'languageDefined', ['languageDefined', 'quotes', 'brackets', 'never'], {
            enumDescriptions: [
                nls.localize('editor.autoSurround.languageDefined', "Use language configurations to determine when to automatically surround selections."),
                nls.localize('editor.autoSurround.quotes', "Surround with quotes but not brackets."),
                nls.localize('editor.autoSurround.brackets', "Surround with brackets but not quotes."),
                ''
            ],
            description: nls.localize('autoSurround', "Controls whether the editor should automatically surround selections.")
        })),
        codeLens: register(new EditorBooleanOption(10 /* codeLens */, 'codeLens', true, { description: nls.localize('codeLens', "Controls whether the editor shows CodeLens.") })),
        colorDecorators: register(new EditorBooleanOption(11 /* colorDecorators */, 'colorDecorators', true, { description: nls.localize('colorDecorators', "Controls whether the editor should render the inline color decorators and color picker.") })),
        contextmenu: register(new EditorBooleanOption(12 /* contextmenu */, 'contextmenu', true)),
        copyWithSyntaxHighlighting: register(new EditorBooleanOption(13 /* copyWithSyntaxHighlighting */, 'copyWithSyntaxHighlighting', true, { description: nls.localize('copyWithSyntaxHighlighting', "Controls whether syntax highlighting should be copied into the clipboard.") })),
        cursorBlinking: register(new EditorEnumOption(14 /* cursorBlinking */, 'cursorBlinking', 1 /* Blink */, 'blink', ['blink', 'smooth', 'phase', 'expand', 'solid'], _cursorBlinkingStyleFromString, { description: nls.localize('cursorBlinking', "Control the cursor animation style.") })),
        cursorSmoothCaretAnimation: register(new EditorBooleanOption(15 /* cursorSmoothCaretAnimation */, 'cursorSmoothCaretAnimation', false, { description: nls.localize('cursorSmoothCaretAnimation', "Controls whether the smooth caret animation should be enabled.") })),
        cursorStyle: register(new EditorEnumOption(16 /* cursorStyle */, 'cursorStyle', TextEditorCursorStyle.Line, 'line', ['line', 'block', 'underline', 'line-thin', 'block-outline', 'underline-thin'], _cursorStyleFromString, { description: nls.localize('cursorStyle', "Controls the cursor style.") })),
        cursorSurroundingLines: register(new EditorIntOption(17 /* cursorSurroundingLines */, 'cursorSurroundingLines', 0, 0, 1073741824 /* MAX_SAFE_SMALL_INTEGER */, { description: nls.localize('cursorSurroundingLines', "Controls the minimal number of visible leading and trailing lines surrounding the cursor. Known as 'scrollOff' or `scrollOffset` in some other editors.") })),
        cursorWidth: register(new EditorIntOption(18 /* cursorWidth */, 'cursorWidth', 0, 0, 1073741824 /* MAX_SAFE_SMALL_INTEGER */, { markdownDescription: nls.localize('cursorWidth', "Controls the width of the cursor when `#editor.cursorStyle#` is set to `line`.") })),
        disableLayerHinting: register(new EditorBooleanOption(19 /* disableLayerHinting */, 'disableLayerHinting', false)),
        disableMonospaceOptimizations: register(new EditorBooleanOption(20 /* disableMonospaceOptimizations */, 'disableMonospaceOptimizations', false)),
        dragAndDrop: register(new EditorBooleanOption(21 /* dragAndDrop */, 'dragAndDrop', true, { description: nls.localize('dragAndDrop', "Controls whether the editor should allow moving selections via drag and drop.") })),
        emptySelectionClipboard: register(new EditorEmptySelectionClipboard()),
        extraEditorClassName: register(new EditorStringOption(23 /* extraEditorClassName */, 'extraEditorClassName', '')),
        fastScrollSensitivity: register(new EditorFloatOption(24 /* fastScrollSensitivity */, 'fastScrollSensitivity', 5, x => (x <= 0 ? 5 : x), { markdownDescription: nls.localize('fastScrollSensitivity', "Scrolling speed multiplier when pressing `Alt`.") })),
        find: register(new EditorFind()),
        fixedOverflowWidgets: register(new EditorBooleanOption(26 /* fixedOverflowWidgets */, 'fixedOverflowWidgets', false)),
        folding: register(new EditorBooleanOption(27 /* folding */, 'folding', true, { description: nls.localize('folding', "Controls whether the editor has code folding enabled.") })),
        foldingStrategy: register(new EditorStringEnumOption(28 /* foldingStrategy */, 'foldingStrategy', 'auto', ['auto', 'indentation'], { markdownDescription: nls.localize('foldingStrategy', "Controls the strategy for computing folding ranges. `auto` uses a language specific folding strategy, if available. `indentation` uses the indentation based folding strategy.") })),
        fontFamily: register(new EditorStringOption(29 /* fontFamily */, 'fontFamily', exports.EDITOR_FONT_DEFAULTS.fontFamily, { description: nls.localize('fontFamily', "Controls the font family.") })),
        fontInfo: register(new EditorFontInfo()),
        fontLigatures: register(new EditorBooleanOption(31 /* fontLigatures */, 'fontLigatures', false, { description: nls.localize('fontLigatures', "Enables/Disables font ligatures.") })),
        fontSize: register(new EditorFontSize()),
        fontWeight: register(new EditorStringOption(33 /* fontWeight */, 'fontWeight', exports.EDITOR_FONT_DEFAULTS.fontWeight, {
            enum: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
            description: nls.localize('fontWeight', "Controls the font weight.")
        })),
        formatOnPaste: register(new EditorBooleanOption(34 /* formatOnPaste */, 'formatOnPaste', false, { description: nls.localize('formatOnPaste', "Controls whether the editor should automatically format the pasted content. A formatter must be available and the formatter should be able to format a range in a document.") })),
        formatOnType: register(new EditorBooleanOption(35 /* formatOnType */, 'formatOnType', false, { description: nls.localize('formatOnType', "Controls whether the editor should automatically format the line after typing.") })),
        glyphMargin: register(new EditorBooleanOption(36 /* glyphMargin */, 'glyphMargin', true, { description: nls.localize('glyphMargin', "Controls whether the editor should render the vertical glyph margin. Glyph margin is mostly used for debugging.") })),
        gotoLocation: register(new EditorGoToLocation()),
        hideCursorInOverviewRuler: register(new EditorBooleanOption(38 /* hideCursorInOverviewRuler */, 'hideCursorInOverviewRuler', false, { description: nls.localize('hideCursorInOverviewRuler', "Controls whether the cursor should be hidden in the overview ruler.") })),
        highlightActiveIndentGuide: register(new EditorBooleanOption(39 /* highlightActiveIndentGuide */, 'highlightActiveIndentGuide', true, { description: nls.localize('highlightActiveIndentGuide', "Controls whether the editor should highlight the active indent guide.") })),
        hover: register(new EditorHover()),
        inDiffEditor: register(new EditorBooleanOption(41 /* inDiffEditor */, 'inDiffEditor', false)),
        letterSpacing: register(new EditorFloatOption(42 /* letterSpacing */, 'letterSpacing', exports.EDITOR_FONT_DEFAULTS.letterSpacing, x => EditorFloatOption.clamp(x, -5, 20), { description: nls.localize('letterSpacing', "Controls the letter spacing in pixels.") })),
        lightbulb: register(new EditorLightbulb()),
        lineDecorationsWidth: register(new SimpleEditorOption(44 /* lineDecorationsWidth */, 'lineDecorationsWidth', 10)),
        lineHeight: register(new EditorLineHeight()),
        lineNumbers: register(new EditorRenderLineNumbersOption()),
        lineNumbersMinChars: register(new EditorIntOption(47 /* lineNumbersMinChars */, 'lineNumbersMinChars', 5, 1, 10)),
        links: register(new EditorBooleanOption(48 /* links */, 'links', true, { description: nls.localize('links', "Controls whether the editor should detect links and make them clickable.") })),
        matchBrackets: register(new EditorBooleanOption(49 /* matchBrackets */, 'matchBrackets', true, { description: nls.localize('matchBrackets', "Highlight matching brackets when one of them is selected.") })),
        minimap: register(new EditorMinimap()),
        mouseStyle: register(new EditorStringEnumOption(51 /* mouseStyle */, 'mouseStyle', 'text', ['text', 'default', 'copy'])),
        mouseWheelScrollSensitivity: register(new EditorFloatOption(52 /* mouseWheelScrollSensitivity */, 'mouseWheelScrollSensitivity', 1, x => (x === 0 ? 1 : x), { markdownDescription: nls.localize('mouseWheelScrollSensitivity', "A multiplier to be used on the `deltaX` and `deltaY` of mouse wheel scroll events.") })),
        mouseWheelZoom: register(new EditorBooleanOption(53 /* mouseWheelZoom */, 'mouseWheelZoom', false, { markdownDescription: nls.localize('mouseWheelZoom', "Zoom the font of the editor when using mouse wheel and holding `Ctrl`.") })),
        multiCursorMergeOverlapping: register(new EditorBooleanOption(54 /* multiCursorMergeOverlapping */, 'multiCursorMergeOverlapping', true, { description: nls.localize('multiCursorMergeOverlapping', "Merge multiple cursors when they are overlapping.") })),
        multiCursorModifier: register(new EditorEnumOption(55 /* multiCursorModifier */, 'multiCursorModifier', 'altKey', 'alt', ['ctrlCmd', 'alt'], _multiCursorModifierFromString, {
            markdownEnumDescriptions: [
                nls.localize('multiCursorModifier.ctrlCmd', "Maps to `Control` on Windows and Linux and to `Command` on macOS."),
                nls.localize('multiCursorModifier.alt', "Maps to `Alt` on Windows and Linux and to `Option` on macOS.")
            ],
            markdownDescription: nls.localize({
                key: 'multiCursorModifier',
                comment: [
                    '- `ctrlCmd` refers to a value the setting can take and should not be localized.',
                    '- `Control` and `Command` refer to the modifier keys Ctrl or Cmd on the keyboard and can be localized.'
                ]
            }, "The modifier to be used to add multiple cursors with the mouse. The Go To Definition and Open Link mouse gestures will adapt such that they do not conflict with the multicursor modifier. [Read more](https://code.visualstudio.com/docs/editor/codebasics#_multicursor-modifier).")
        })),
        multiCursorPaste: register(new EditorStringEnumOption(56 /* multiCursorPaste */, 'multiCursorPaste', 'spread', ['spread', 'full'], {
            markdownEnumDescriptions: [
                nls.localize('multiCursorPaste.spread', "Each cursor pastes a single line of the text."),
                nls.localize('multiCursorPaste.full', "Each cursor pastes the full text.")
            ],
            markdownDescription: nls.localize('multiCursorPaste', "Controls pasting when the line count of the pasted text matches the cursor count.")
        })),
        occurrencesHighlight: register(new EditorBooleanOption(57 /* occurrencesHighlight */, 'occurrencesHighlight', true, { description: nls.localize('occurrencesHighlight', "Controls whether the editor should highlight semantic symbol occurrences.") })),
        overviewRulerBorder: register(new EditorBooleanOption(58 /* overviewRulerBorder */, 'overviewRulerBorder', true, { description: nls.localize('overviewRulerBorder', "Controls whether a border should be drawn around the overview ruler.") })),
        overviewRulerLanes: register(new EditorIntOption(59 /* overviewRulerLanes */, 'overviewRulerLanes', 3, 0, 3, { description: nls.localize('overviewRulerLanes', "Controls the number of decorations that can show up at the same position in the overview ruler.") })),
        parameterHints: register(new EditorParameterHints()),
        quickSuggestions: register(new EditorQuickSuggestions()),
        quickSuggestionsDelay: register(new EditorIntOption(62 /* quickSuggestionsDelay */, 'quickSuggestionsDelay', 10, 0, 1073741824 /* MAX_SAFE_SMALL_INTEGER */, { description: nls.localize('quickSuggestionsDelay', "Controls the delay in milliseconds after which quick suggestions will show up.") })),
        readOnly: register(new EditorBooleanOption(63 /* readOnly */, 'readOnly', false)),
        renderControlCharacters: register(new EditorBooleanOption(64 /* renderControlCharacters */, 'renderControlCharacters', false, { description: nls.localize('renderControlCharacters', "Controls whether the editor should render control characters.") })),
        renderIndentGuides: register(new EditorBooleanOption(65 /* renderIndentGuides */, 'renderIndentGuides', true, { description: nls.localize('renderIndentGuides', "Controls whether the editor should render indent guides.") })),
        renderFinalNewline: register(new EditorBooleanOption(66 /* renderFinalNewline */, 'renderFinalNewline', true, { description: nls.localize('renderFinalNewline', "Render last line number when the file ends with a newline.") })),
        renderLineHighlight: register(new EditorStringEnumOption(67 /* renderLineHighlight */, 'renderLineHighlight', 'line', ['none', 'gutter', 'line', 'all'], {
            enumDescriptions: [
                '',
                '',
                '',
                nls.localize('renderLineHighlight.all', "Highlights both the gutter and the current line."),
            ],
            description: nls.localize('renderLineHighlight', "Controls how the editor should render the current line highlight.")
        })),
        renderWhitespace: register(new EditorStringEnumOption(68 /* renderWhitespace */, 'renderWhitespace', 'none', ['none', 'boundary', 'selection', 'all'], {
            enumDescriptions: [
                '',
                nls.localize('renderWhitespace.boundary', "Render whitespace characters except for single spaces between words."),
                nls.localize('renderWhitespace.selection', "Render whitespace characters only on selected text."),
                ''
            ],
            description: nls.localize('renderWhitespace', "Controls how the editor should render whitespace characters.")
        })),
        revealHorizontalRightPadding: register(new EditorIntOption(69 /* revealHorizontalRightPadding */, 'revealHorizontalRightPadding', 30, 0, 1000)),
        roundedSelection: register(new EditorBooleanOption(70 /* roundedSelection */, 'roundedSelection', true, { description: nls.localize('roundedSelection', "Controls whether selections should have rounded corners.") })),
        rulers: register(new EditorRulers()),
        scrollbar: register(new EditorScrollbar()),
        scrollBeyondLastColumn: register(new EditorIntOption(73 /* scrollBeyondLastColumn */, 'scrollBeyondLastColumn', 5, 0, 1073741824 /* MAX_SAFE_SMALL_INTEGER */, { description: nls.localize('scrollBeyondLastColumn', "Controls the number of extra characters beyond which the editor will scroll horizontally.") })),
        scrollBeyondLastLine: register(new EditorBooleanOption(74 /* scrollBeyondLastLine */, 'scrollBeyondLastLine', true, { description: nls.localize('scrollBeyondLastLine', "Controls whether the editor will scroll beyond the last line.") })),
        selectionClipboard: register(new EditorBooleanOption(75 /* selectionClipboard */, 'selectionClipboard', true, {
            description: nls.localize('selectionClipboard', "Controls whether the Linux primary clipboard should be supported."),
            included: platform.isLinux
        })),
        selectionHighlight: register(new EditorBooleanOption(76 /* selectionHighlight */, 'selectionHighlight', true, { description: nls.localize('selectionHighlight', "Controls whether the editor should highlight matches similar to the selection.") })),
        selectOnLineNumbers: register(new EditorBooleanOption(77 /* selectOnLineNumbers */, 'selectOnLineNumbers', true)),
        showFoldingControls: register(new EditorStringEnumOption(78 /* showFoldingControls */, 'showFoldingControls', 'mouseover', ['always', 'mouseover'], { description: nls.localize('showFoldingControls', "Controls whether the fold controls on the gutter are automatically hidden.") })),
        showUnused: register(new EditorBooleanOption(79 /* showUnused */, 'showUnused', true, { description: nls.localize('showUnused', "Controls fading out of unused code.") })),
        snippetSuggestions: register(new EditorStringEnumOption(80 /* snippetSuggestions */, 'snippetSuggestions', 'inline', ['top', 'bottom', 'inline', 'none'], {
            enumDescriptions: [
                nls.localize('snippetSuggestions.top', "Show snippet suggestions on top of other suggestions."),
                nls.localize('snippetSuggestions.bottom', "Show snippet suggestions below other suggestions."),
                nls.localize('snippetSuggestions.inline', "Show snippets suggestions with other suggestions."),
                nls.localize('snippetSuggestions.none', "Do not show snippet suggestions."),
            ],
            description: nls.localize('snippetSuggestions', "Controls whether snippets are shown with other suggestions and how they are sorted.")
        })),
        smoothScrolling: register(new EditorBooleanOption(81 /* smoothScrolling */, 'smoothScrolling', false, { description: nls.localize('smoothScrolling', "Controls whether the editor will scroll using an animation.") })),
        stopRenderingLineAfter: register(new EditorIntOption(82 /* stopRenderingLineAfter */, 'stopRenderingLineAfter', 10000, -1, 1073741824 /* MAX_SAFE_SMALL_INTEGER */)),
        suggest: register(new EditorSuggest()),
        suggestFontSize: register(new EditorIntOption(84 /* suggestFontSize */, 'suggestFontSize', 0, 0, 1000, { markdownDescription: nls.localize('suggestFontSize', "Font size for the suggest widget. When set to `0`, the value of `#editor.fontSize#` is used.") })),
        suggestLineHeight: register(new EditorIntOption(85 /* suggestLineHeight */, 'suggestLineHeight', 0, 0, 1000, { markdownDescription: nls.localize('suggestLineHeight', "Line height for the suggest widget. When set to `0`, the value of `#editor.lineHeight#` is used.") })),
        suggestOnTriggerCharacters: register(new EditorBooleanOption(86 /* suggestOnTriggerCharacters */, 'suggestOnTriggerCharacters', true, { description: nls.localize('suggestOnTriggerCharacters', "Controls whether suggestions should automatically show up when typing trigger characters.") })),
        suggestSelection: register(new EditorStringEnumOption(87 /* suggestSelection */, 'suggestSelection', 'recentlyUsed', ['first', 'recentlyUsed', 'recentlyUsedByPrefix'], {
            markdownEnumDescriptions: [
                nls.localize('suggestSelection.first', "Always select the first suggestion."),
                nls.localize('suggestSelection.recentlyUsed', "Select recent suggestions unless further typing selects one, e.g. `console.| -> console.log` because `log` has been completed recently."),
                nls.localize('suggestSelection.recentlyUsedByPrefix', "Select suggestions based on previous prefixes that have completed those suggestions, e.g. `co -> console` and `con -> const`."),
            ],
            description: nls.localize('suggestSelection', "Controls how suggestions are pre-selected when showing the suggest list.")
        })),
        tabCompletion: register(new EditorStringEnumOption(88 /* tabCompletion */, 'tabCompletion', 'off', ['on', 'off', 'onlySnippets'], {
            enumDescriptions: [
                nls.localize('tabCompletion.on', "Tab complete will insert the best matching suggestion when pressing tab."),
                nls.localize('tabCompletion.off', "Disable tab completions."),
                nls.localize('tabCompletion.onlySnippets', "Tab complete snippets when their prefix match. Works best when 'quickSuggestions' aren't enabled."),
            ],
            description: nls.localize('tabCompletion', "Enables tab completions.")
        })),
        useTabStops: register(new EditorBooleanOption(89 /* useTabStops */, 'useTabStops', true, { description: nls.localize('useTabStops', "Inserting and deleting whitespace follows tab stops.") })),
        wordSeparators: register(new EditorStringOption(90 /* wordSeparators */, 'wordSeparators', wordHelper_1.USUAL_WORD_SEPARATORS, { description: nls.localize('wordSeparators', "Characters that will be used as word separators when doing word related navigations or operations.") })),
        wordWrap: register(new EditorStringEnumOption(91 /* wordWrap */, 'wordWrap', 'off', ['off', 'on', 'wordWrapColumn', 'bounded'], {
            markdownEnumDescriptions: [
                nls.localize('wordWrap.off', "Lines will never wrap."),
                nls.localize('wordWrap.on', "Lines will wrap at the viewport width."),
                nls.localize({
                    key: 'wordWrap.wordWrapColumn',
                    comment: [
                        '- `editor.wordWrapColumn` refers to a different setting and should not be localized.'
                    ]
                }, "Lines will wrap at `#editor.wordWrapColumn#`."),
                nls.localize({
                    key: 'wordWrap.bounded',
                    comment: [
                        '- viewport means the edge of the visible window size.',
                        '- `editor.wordWrapColumn` refers to a different setting and should not be localized.'
                    ]
                }, "Lines will wrap at the minimum of viewport and `#editor.wordWrapColumn#`."),
            ],
            description: nls.localize({
                key: 'wordWrap',
                comment: [
                    '- \'off\', \'on\', \'wordWrapColumn\' and \'bounded\' refer to values the setting can take and should not be localized.',
                    '- `editor.wordWrapColumn` refers to a different setting and should not be localized.'
                ]
            }, "Controls how lines should wrap.")
        })),
        wordWrapBreakAfterCharacters: register(new EditorStringOption(92 /* wordWrapBreakAfterCharacters */, 'wordWrapBreakAfterCharacters', ' \t})]?|/&,;¢°′″‰℃、。｡､￠，．：；？！％・･ゝゞヽヾーァィゥェォッャュョヮヵヶぁぃぅぇぉっゃゅょゎゕゖㇰㇱㇲㇳㇴㇵㇶㇷㇸㇹㇺㇻㇼㇽㇾㇿ々〻ｧｨｩｪｫｬｭｮｯｰ”〉》」』】〕）］｝｣')),
        wordWrapBreakBeforeCharacters: register(new EditorStringOption(93 /* wordWrapBreakBeforeCharacters */, 'wordWrapBreakBeforeCharacters', '([{‘“〈《「『【〔（［｛｢£¥＄￡￥+＋')),
        wordWrapBreakObtrusiveCharacters: register(new EditorStringOption(94 /* wordWrapBreakObtrusiveCharacters */, 'wordWrapBreakObtrusiveCharacters', '.')),
        wordWrapColumn: register(new EditorIntOption(95 /* wordWrapColumn */, 'wordWrapColumn', 80, 1, 1073741824 /* MAX_SAFE_SMALL_INTEGER */, {
            markdownDescription: nls.localize({
                key: 'wordWrapColumn',
                comment: [
                    '- `editor.wordWrap` refers to a different setting and should not be localized.',
                    '- \'wordWrapColumn\' and \'bounded\' refer to values the different setting can take and should not be localized.'
                ]
            }, "Controls the wrapping column of the editor when `#editor.wordWrap#` is `wordWrapColumn` or `bounded`.")
        })),
        wordWrapMinified: register(new EditorBooleanOption(96 /* wordWrapMinified */, 'wordWrapMinified', true)),
        wrappingIndent: register(new EditorEnumOption(97 /* wrappingIndent */, 'wrappingIndent', 1 /* Same */, 'same', ['none', 'same', 'indent', 'deepIndent'], _wrappingIndentFromString, {
            enumDescriptions: [
                nls.localize('wrappingIndent.none', "No indentation. Wrapped lines begin at column 1."),
                nls.localize('wrappingIndent.same', "Wrapped lines get the same indentation as the parent."),
                nls.localize('wrappingIndent.indent', "Wrapped lines get +1 indentation toward the parent."),
                nls.localize('wrappingIndent.deepIndent', "Wrapped lines get +2 indentation toward the parent."),
            ],
            description: nls.localize('wrappingIndent', "Controls the indentation of wrapped lines."),
        })),
        // Leave these at the end (because they have dependencies!)
        editorClassName: register(new EditorClassName()),
        pixelRatio: register(new EditorPixelRatio()),
        tabFocusMode: register(new EditorTabFocusMode()),
        layoutInfo: register(new EditorLayoutInfoComputer()),
        wrappingInfo: register(new EditorWrappingInfoComputer()),
    };
});
//# sourceMappingURL=editorOptions.js.map