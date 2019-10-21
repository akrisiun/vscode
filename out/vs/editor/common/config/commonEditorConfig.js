/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/arrays", "vs/editor/common/config/editorOptions", "vs/editor/common/config/editorZoom", "vs/editor/common/config/fontInfo", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform"], function (require, exports, nls, event_1, lifecycle_1, objects, arrays, editorOptions_1, editorZoom_1, fontInfo_1, configurationRegistry_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TabFocus = new class {
        constructor() {
            this._tabFocus = false;
            this._onDidChangeTabFocus = new event_1.Emitter();
            this.onDidChangeTabFocus = this._onDidChangeTabFocus.event;
        }
        getTabFocusMode() {
            return this._tabFocus;
        }
        setTabFocusMode(tabFocusMode) {
            if (this._tabFocus === tabFocusMode) {
                return;
            }
            this._tabFocus = tabFocusMode;
            this._onDidChangeTabFocus.fire(this._tabFocus);
        }
    };
    const hasOwnProperty = Object.hasOwnProperty;
    class ComputedEditorOptions {
        constructor() {
            this._values = [];
        }
        _read(id) {
            return this._values[id];
        }
        get(id) {
            return this._values[id];
        }
        _write(id, value) {
            this._values[id] = value;
        }
    }
    exports.ComputedEditorOptions = ComputedEditorOptions;
    class RawEditorOptions {
        constructor() {
            this._values = [];
        }
        _read(id) {
            return this._values[id];
        }
        _write(id, value) {
            this._values[id] = value;
        }
    }
    class EditorConfiguration2 {
        static readOptions(_options) {
            const options = _options;
            const result = new RawEditorOptions();
            for (const editorOption of editorOptions_1.editorOptionsRegistry) {
                const value = (editorOption.name === '_never_' ? undefined : options[editorOption.name]);
                result._write(editorOption.id, value);
            }
            return result;
        }
        static validateOptions(options) {
            const result = new editorOptions_1.ValidatedEditorOptions();
            for (const editorOption of editorOptions_1.editorOptionsRegistry) {
                result._write(editorOption.id, editorOption.validate(options._read(editorOption.id)));
            }
            return result;
        }
        static computeOptions(options, env) {
            const result = new ComputedEditorOptions();
            for (const editorOption of editorOptions_1.editorOptionsRegistry) {
                result._write(editorOption.id, editorOption.compute(env, result, options._read(editorOption.id)));
            }
            return result;
        }
        static _deepEquals(a, b) {
            if (typeof a !== 'object' || typeof b !== 'object') {
                return (a === b);
            }
            if (Array.isArray(a) || Array.isArray(b)) {
                return (Array.isArray(a) && Array.isArray(b) ? arrays.equals(a, b) : false);
            }
            for (let key in a) {
                if (!EditorConfiguration2._deepEquals(a[key], b[key])) {
                    return false;
                }
            }
            return true;
        }
        static checkEquals(a, b) {
            const result = [];
            let somethingChanged = false;
            for (const editorOption of editorOptions_1.editorOptionsRegistry) {
                const changed = !EditorConfiguration2._deepEquals(a._read(editorOption.id), b._read(editorOption.id));
                result[editorOption.id] = changed;
                if (changed) {
                    somethingChanged = true;
                }
            }
            return (somethingChanged ? new editorOptions_1.ConfigurationChangedEvent(result) : null);
        }
    }
    /**
     * Compatibility with old options
     */
    function migrateOptions(options) {
        const wordWrap = options.wordWrap;
        if (wordWrap === true) {
            options.wordWrap = 'on';
        }
        else if (wordWrap === false) {
            options.wordWrap = 'off';
        }
        const lineNumbers = options.lineNumbers;
        if (lineNumbers === true) {
            options.lineNumbers = 'on';
        }
        else if (lineNumbers === false) {
            options.lineNumbers = 'off';
        }
        const autoClosingBrackets = options.autoClosingBrackets;
        if (autoClosingBrackets === false) {
            options.autoClosingBrackets = 'never';
            options.autoClosingQuotes = 'never';
            options.autoSurround = 'never';
        }
        const cursorBlinking = options.cursorBlinking;
        if (cursorBlinking === 'visible') {
            options.cursorBlinking = 'solid';
        }
        const renderWhitespace = options.renderWhitespace;
        if (renderWhitespace === true) {
            options.renderWhitespace = 'boundary';
        }
        else if (renderWhitespace === false) {
            options.renderWhitespace = 'none';
        }
        const renderLineHighlight = options.renderLineHighlight;
        if (renderLineHighlight === true) {
            options.renderLineHighlight = 'line';
        }
        else if (renderLineHighlight === false) {
            options.renderLineHighlight = 'none';
        }
        const acceptSuggestionOnEnter = options.acceptSuggestionOnEnter;
        if (acceptSuggestionOnEnter === true) {
            options.acceptSuggestionOnEnter = 'on';
        }
        else if (acceptSuggestionOnEnter === false) {
            options.acceptSuggestionOnEnter = 'off';
        }
        const tabCompletion = options.tabCompletion;
        if (tabCompletion === false) {
            options.tabCompletion = 'off';
        }
        else if (tabCompletion === true) {
            options.tabCompletion = 'onlySnippets';
        }
        const hover = options.hover;
        if (hover === true) {
            options.hover = {
                enabled: true
            };
        }
        else if (hover === false) {
            options.hover = {
                enabled: false
            };
        }
        const parameterHints = options.parameterHints;
        if (parameterHints === true) {
            options.parameterHints = {
                enabled: true
            };
        }
        else if (parameterHints === false) {
            options.parameterHints = {
                enabled: false
            };
        }
    }
    function deepCloneAndMigrateOptions(_options) {
        const options = objects.deepClone(_options);
        migrateOptions(options);
        return options;
    }
    class CommonEditorConfiguration extends lifecycle_1.Disposable {
        constructor(isSimpleWidget, _options) {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.isSimpleWidget = isSimpleWidget;
            this._isDominatedByLongLines = false;
            this._lineNumbersDigitCount = 1;
            this._rawOptions = deepCloneAndMigrateOptions(_options);
            this._readOptions = EditorConfiguration2.readOptions(this._rawOptions);
            this._validatedOptions = EditorConfiguration2.validateOptions(this._readOptions);
            this._register(editorZoom_1.EditorZoom.onDidChangeZoomLevel(_ => this._recomputeOptions()));
            this._register(exports.TabFocus.onDidChangeTabFocus(_ => this._recomputeOptions()));
        }
        observeReferenceElement(dimension) {
        }
        dispose() {
            super.dispose();
        }
        _recomputeOptions() {
            const oldOptions = this.options;
            const newOptions = this._computeInternalOptions();
            if (!oldOptions) {
                this.options = newOptions;
            }
            else {
                const changeEvent = EditorConfiguration2.checkEquals(oldOptions, newOptions);
                if (changeEvent === null) {
                    // nothing changed!
                    return;
                }
                this.options = newOptions;
                this._onDidChange.fire(changeEvent);
            }
        }
        getRawOptions() {
            return this._rawOptions;
        }
        _computeInternalOptions() {
            const partialEnv = this._getEnvConfiguration();
            const bareFontInfo = fontInfo_1.BareFontInfo.createFromValidatedSettings(this._validatedOptions, partialEnv.zoomLevel, this.isSimpleWidget);
            const env = {
                outerWidth: partialEnv.outerWidth,
                outerHeight: partialEnv.outerHeight,
                fontInfo: this.readConfiguration(bareFontInfo),
                extraEditorClassName: partialEnv.extraEditorClassName,
                isDominatedByLongLines: this._isDominatedByLongLines,
                lineNumbersDigitCount: this._lineNumbersDigitCount,
                emptySelectionClipboard: partialEnv.emptySelectionClipboard,
                pixelRatio: partialEnv.pixelRatio,
                tabFocusMode: exports.TabFocus.getTabFocusMode(),
                accessibilitySupport: partialEnv.accessibilitySupport
            };
            return EditorConfiguration2.computeOptions(this._validatedOptions, env);
        }
        static _primitiveArrayEquals(a, b) {
            if (a.length !== b.length) {
                return false;
            }
            for (let i = 0; i < a.length; i++) {
                if (a[i] !== b[i]) {
                    return false;
                }
            }
            return true;
        }
        static _subsetEquals(base, subset) {
            for (const key in subset) {
                if (hasOwnProperty.call(subset, key)) {
                    const subsetValue = subset[key];
                    const baseValue = base[key];
                    if (baseValue === subsetValue) {
                        continue;
                    }
                    if (Array.isArray(baseValue) && Array.isArray(subsetValue)) {
                        if (!this._primitiveArrayEquals(baseValue, subsetValue)) {
                            return false;
                        }
                        continue;
                    }
                    if (typeof baseValue === 'object' && typeof subsetValue === 'object') {
                        if (!this._subsetEquals(baseValue, subsetValue)) {
                            return false;
                        }
                        continue;
                    }
                    return false;
                }
            }
            return true;
        }
        updateOptions(_newOptions) {
            if (typeof _newOptions === 'undefined') {
                return;
            }
            const newOptions = deepCloneAndMigrateOptions(_newOptions);
            if (CommonEditorConfiguration._subsetEquals(this._rawOptions, newOptions)) {
                return;
            }
            this._rawOptions = objects.mixin(this._rawOptions, newOptions || {});
            this._readOptions = EditorConfiguration2.readOptions(this._rawOptions);
            this._validatedOptions = EditorConfiguration2.validateOptions(this._readOptions);
            this._recomputeOptions();
        }
        setIsDominatedByLongLines(isDominatedByLongLines) {
            this._isDominatedByLongLines = isDominatedByLongLines;
            this._recomputeOptions();
        }
        setMaxLineNumber(maxLineNumber) {
            let digitCount = CommonEditorConfiguration._digitCount(maxLineNumber);
            if (this._lineNumbersDigitCount === digitCount) {
                return;
            }
            this._lineNumbersDigitCount = digitCount;
            this._recomputeOptions();
        }
        static _digitCount(n) {
            let r = 0;
            while (n) {
                n = Math.floor(n / 10);
                r++;
            }
            return r ? r : 1;
        }
    }
    exports.CommonEditorConfiguration = CommonEditorConfiguration;
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    const editorConfiguration = {
        id: 'editor',
        order: 5,
        type: 'object',
        title: nls.localize('editorConfigurationTitle', "Editor"),
        overridable: true,
        scope: 4 /* RESOURCE */,
        properties: {
            'editor.tabSize': {
                type: 'number',
                default: editorOptions_1.EDITOR_MODEL_DEFAULTS.tabSize,
                minimum: 1,
                markdownDescription: nls.localize('tabSize', "The number of spaces a tab is equal to. This setting is overridden based on the file contents when `#editor.detectIndentation#` is on.")
            },
            // 'editor.indentSize': {
            // 	'anyOf': [
            // 		{
            // 			type: 'string',
            // 			enum: ['tabSize']
            // 		},
            // 		{
            // 			type: 'number',
            // 			minimum: 1
            // 		}
            // 	],
            // 	default: 'tabSize',
            // 	markdownDescription: nls.localize('indentSize', "The number of spaces used for indentation or 'tabSize' to use the value from `#editor.tabSize#`. This setting is overridden based on the file contents when `#editor.detectIndentation#` is on.")
            // },
            'editor.insertSpaces': {
                type: 'boolean',
                default: editorOptions_1.EDITOR_MODEL_DEFAULTS.insertSpaces,
                markdownDescription: nls.localize('insertSpaces', "Insert spaces when pressing `Tab`. This setting is overridden based on the file contents when `#editor.detectIndentation#` is on.")
            },
            'editor.detectIndentation': {
                type: 'boolean',
                default: editorOptions_1.EDITOR_MODEL_DEFAULTS.detectIndentation,
                markdownDescription: nls.localize('detectIndentation', "Controls whether `#editor.tabSize#` and `#editor.insertSpaces#` will be automatically detected when a file is opened based on the file contents.")
            },
            'editor.trimAutoWhitespace': {
                type: 'boolean',
                default: editorOptions_1.EDITOR_MODEL_DEFAULTS.trimAutoWhitespace,
                description: nls.localize('trimAutoWhitespace', "Remove trailing auto inserted whitespace.")
            },
            'editor.largeFileOptimizations': {
                type: 'boolean',
                default: editorOptions_1.EDITOR_MODEL_DEFAULTS.largeFileOptimizations,
                description: nls.localize('largeFileOptimizations', "Special handling for large files to disable certain memory intensive features.")
            },
            'editor.wordBasedSuggestions': {
                type: 'boolean',
                default: true,
                description: nls.localize('wordBasedSuggestions', "Controls whether completions should be computed based on words in the document.")
            },
            'editor.stablePeek': {
                type: 'boolean',
                default: false,
                markdownDescription: nls.localize('stablePeek', "Keep peek editors open even when double clicking their content or when hitting `Escape`.")
            },
            'editor.maxTokenizationLineLength': {
                type: 'integer',
                default: 20000,
                description: nls.localize('maxTokenizationLineLength', "Lines above this length will not be tokenized for performance reasons")
            },
            'editor.codeActionsOnSave': {
                type: 'object',
                properties: {
                    'source.organizeImports': {
                        type: 'boolean',
                        description: nls.localize('codeActionsOnSave.organizeImports', "Controls whether organize imports action should be run on file save.")
                    },
                    'source.fixAll': {
                        type: 'boolean',
                        description: nls.localize('codeActionsOnSave.fixAll', "Controls whether auto fix action should be run on file save.")
                    }
                },
                'additionalProperties': {
                    type: 'boolean'
                },
                default: {},
                description: nls.localize('codeActionsOnSave', "Code action kinds to be run on save.")
            },
            'editor.codeActionsOnSaveTimeout': {
                type: 'number',
                default: 750,
                description: nls.localize('codeActionsOnSaveTimeout', "Timeout in milliseconds after which the code actions that are run on save are cancelled.")
            },
            'diffEditor.maxComputationTime': {
                type: 'number',
                default: 5000,
                description: nls.localize('maxComputationTime', "Timeout in milliseconds after which diff computation is cancelled. Use 0 for no timeout.")
            },
            'diffEditor.renderSideBySide': {
                type: 'boolean',
                default: true,
                description: nls.localize('sideBySide', "Controls whether the diff editor shows the diff side by side or inline.")
            },
            'diffEditor.ignoreTrimWhitespace': {
                type: 'boolean',
                default: true,
                description: nls.localize('ignoreTrimWhitespace', "Controls whether the diff editor shows changes in leading or trailing whitespace as diffs.")
            },
            'diffEditor.renderIndicators': {
                type: 'boolean',
                default: true,
                description: nls.localize('renderIndicators', "Controls whether the diff editor shows +/- indicators for added/removed changes.")
            }
        }
    };
    function isConfigurationPropertySchema(x) {
        return (typeof x.type !== 'undefined' || typeof x.anyOf !== 'undefined');
    }
    // Add properties from the Editor Option Registry
    for (const editorOption of editorOptions_1.editorOptionsRegistry) {
        const schema = editorOption.schema;
        if (typeof schema !== 'undefined') {
            if (isConfigurationPropertySchema(schema)) {
                // This is a single schema contribution
                editorConfiguration.properties[`editor.${editorOption.name}`] = schema;
            }
            else {
                for (let key in schema) {
                    if (hasOwnProperty.call(schema, key)) {
                        editorConfiguration.properties[key] = schema[key];
                    }
                }
            }
        }
    }
    let cachedEditorConfigurationKeys = null;
    function getEditorConfigurationKeys() {
        if (cachedEditorConfigurationKeys === null) {
            cachedEditorConfigurationKeys = Object.create(null);
            Object.keys(editorConfiguration.properties).forEach((prop) => {
                cachedEditorConfigurationKeys[prop] = true;
            });
        }
        return cachedEditorConfigurationKeys;
    }
    function isEditorConfigurationKey(key) {
        const editorConfigurationKeys = getEditorConfigurationKeys();
        return (editorConfigurationKeys[`editor.${key}`] || false);
    }
    exports.isEditorConfigurationKey = isEditorConfigurationKey;
    function isDiffEditorConfigurationKey(key) {
        const editorConfigurationKeys = getEditorConfigurationKeys();
        return (editorConfigurationKeys[`diffEditor.${key}`] || false);
    }
    exports.isDiffEditorConfigurationKey = isDiffEditorConfigurationKey;
    configurationRegistry.registerConfiguration(editorConfiguration);
});
//# sourceMappingURL=commonEditorConfig.js.map