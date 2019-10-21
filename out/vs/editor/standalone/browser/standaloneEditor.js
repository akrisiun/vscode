/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/services/openerService", "vs/editor/browser/widget/diffNavigator", "vs/editor/common/config/editorOptions", "vs/editor/common/config/fontInfo", "vs/editor/common/editorCommon", "vs/editor/common/model", "vs/editor/common/modes", "vs/editor/common/modes/nullMode", "vs/editor/common/services/editorWorkerService", "vs/editor/common/services/resolverService", "vs/editor/common/services/webWorker", "vs/editor/common/standalone/standaloneEnums", "vs/editor/standalone/browser/colorizer", "vs/editor/standalone/browser/simpleServices", "vs/editor/standalone/browser/standaloneCodeEditor", "vs/editor/standalone/browser/standaloneServices", "vs/editor/standalone/common/standaloneThemeService", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/accessibility/common/accessibility", "vs/editor/browser/config/configuration", "vs/platform/progress/common/progress", "vs/css!./standalone-tokens"], function (require, exports, codeEditorService_1, openerService_1, diffNavigator_1, editorOptions_1, fontInfo_1, editorCommon, model_1, modes, nullMode_1, editorWorkerService_1, resolverService_1, webWorker_1, standaloneEnums, colorizer_1, simpleServices_1, standaloneCodeEditor_1, standaloneServices_1, standaloneThemeService_1, commands_1, configuration_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, notification_1, opener_1, accessibility_1, configuration_2, progress_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function withAllStandaloneServices(domElement, override, callback) {
        let services = new standaloneServices_1.DynamicStandaloneServices(domElement, override);
        let simpleEditorModelResolverService = null;
        if (!services.has(resolverService_1.ITextModelService)) {
            simpleEditorModelResolverService = new simpleServices_1.SimpleEditorModelResolverService();
            services.set(resolverService_1.ITextModelService, simpleEditorModelResolverService);
        }
        if (!services.has(opener_1.IOpenerService)) {
            services.set(opener_1.IOpenerService, new openerService_1.OpenerService(services.get(codeEditorService_1.ICodeEditorService), services.get(commands_1.ICommandService)));
        }
        let result = callback(services);
        if (simpleEditorModelResolverService) {
            simpleEditorModelResolverService.setEditor(result);
        }
        return result;
    }
    /**
     * Create a new editor under `domElement`.
     * `domElement` should be empty (not contain other dom nodes).
     * The editor will read the size of `domElement`.
     */
    function create(domElement, options, override) {
        return withAllStandaloneServices(domElement, override || {}, (services) => {
            return new standaloneCodeEditor_1.StandaloneEditor(domElement, options, services, services.get(instantiation_1.IInstantiationService), services.get(codeEditorService_1.ICodeEditorService), services.get(commands_1.ICommandService), services.get(contextkey_1.IContextKeyService), services.get(keybinding_1.IKeybindingService), services.get(contextView_1.IContextViewService), services.get(standaloneThemeService_1.IStandaloneThemeService), services.get(notification_1.INotificationService), services.get(configuration_1.IConfigurationService), services.get(accessibility_1.IAccessibilityService));
        });
    }
    exports.create = create;
    /**
     * Emitted when an editor is created.
     * Creating a diff editor might cause this listener to be invoked with the two editors.
     * @event
     */
    function onDidCreateEditor(listener) {
        return standaloneServices_1.StaticServices.codeEditorService.get().onCodeEditorAdd((editor) => {
            listener(editor);
        });
    }
    exports.onDidCreateEditor = onDidCreateEditor;
    /**
     * Create a new diff editor under `domElement`.
     * `domElement` should be empty (not contain other dom nodes).
     * The editor will read the size of `domElement`.
     */
    function createDiffEditor(domElement, options, override) {
        return withAllStandaloneServices(domElement, override || {}, (services) => {
            return new standaloneCodeEditor_1.StandaloneDiffEditor(domElement, options, services, services.get(instantiation_1.IInstantiationService), services.get(contextkey_1.IContextKeyService), services.get(keybinding_1.IKeybindingService), services.get(contextView_1.IContextViewService), services.get(editorWorkerService_1.IEditorWorkerService), services.get(codeEditorService_1.ICodeEditorService), services.get(standaloneThemeService_1.IStandaloneThemeService), services.get(notification_1.INotificationService), services.get(configuration_1.IConfigurationService), services.get(contextView_1.IContextMenuService), services.get(progress_1.IEditorProgressService), null);
        });
    }
    exports.createDiffEditor = createDiffEditor;
    function createDiffNavigator(diffEditor, opts) {
        return new diffNavigator_1.DiffNavigator(diffEditor, opts);
    }
    exports.createDiffNavigator = createDiffNavigator;
    function doCreateModel(value, languageSelection, uri) {
        return standaloneServices_1.StaticServices.modelService.get().createModel(value, languageSelection, uri);
    }
    /**
     * Create a new editor model.
     * You can specify the language that should be set for this model or let the language be inferred from the `uri`.
     */
    function createModel(value, language, uri) {
        value = value || '';
        if (!language) {
            let firstLF = value.indexOf('\n');
            let firstLine = value;
            if (firstLF !== -1) {
                firstLine = value.substring(0, firstLF);
            }
            return doCreateModel(value, standaloneServices_1.StaticServices.modeService.get().createByFilepathOrFirstLine(uri || null, firstLine), uri);
        }
        return doCreateModel(value, standaloneServices_1.StaticServices.modeService.get().create(language), uri);
    }
    exports.createModel = createModel;
    /**
     * Change the language for a model.
     */
    function setModelLanguage(model, languageId) {
        standaloneServices_1.StaticServices.modelService.get().setMode(model, standaloneServices_1.StaticServices.modeService.get().create(languageId));
    }
    exports.setModelLanguage = setModelLanguage;
    /**
     * Set the markers for a model.
     */
    function setModelMarkers(model, owner, markers) {
        if (model) {
            standaloneServices_1.StaticServices.markerService.get().changeOne(owner, model.uri, markers);
        }
    }
    exports.setModelMarkers = setModelMarkers;
    /**
     * Get markers for owner and/or resource
     *
     * @returns list of markers
     */
    function getModelMarkers(filter) {
        return standaloneServices_1.StaticServices.markerService.get().read(filter);
    }
    exports.getModelMarkers = getModelMarkers;
    /**
     * Get the model that has `uri` if it exists.
     */
    function getModel(uri) {
        return standaloneServices_1.StaticServices.modelService.get().getModel(uri);
    }
    exports.getModel = getModel;
    /**
     * Get all the created models.
     */
    function getModels() {
        return standaloneServices_1.StaticServices.modelService.get().getModels();
    }
    exports.getModels = getModels;
    /**
     * Emitted when a model is created.
     * @event
     */
    function onDidCreateModel(listener) {
        return standaloneServices_1.StaticServices.modelService.get().onModelAdded(listener);
    }
    exports.onDidCreateModel = onDidCreateModel;
    /**
     * Emitted right before a model is disposed.
     * @event
     */
    function onWillDisposeModel(listener) {
        return standaloneServices_1.StaticServices.modelService.get().onModelRemoved(listener);
    }
    exports.onWillDisposeModel = onWillDisposeModel;
    /**
     * Emitted when a different language is set to a model.
     * @event
     */
    function onDidChangeModelLanguage(listener) {
        return standaloneServices_1.StaticServices.modelService.get().onModelModeChanged((e) => {
            listener({
                model: e.model,
                oldLanguage: e.oldModeId
            });
        });
    }
    exports.onDidChangeModelLanguage = onDidChangeModelLanguage;
    /**
     * Create a new web worker that has model syncing capabilities built in.
     * Specify an AMD module to load that will `create` an object that will be proxied.
     */
    function createWebWorker(opts) {
        return webWorker_1.createWebWorker(standaloneServices_1.StaticServices.modelService.get(), opts);
    }
    exports.createWebWorker = createWebWorker;
    /**
     * Colorize the contents of `domNode` using attribute `data-lang`.
     */
    function colorizeElement(domNode, options) {
        return colorizer_1.Colorizer.colorizeElement(standaloneServices_1.StaticServices.standaloneThemeService.get(), standaloneServices_1.StaticServices.modeService.get(), domNode, options);
    }
    exports.colorizeElement = colorizeElement;
    /**
     * Colorize `text` using language `languageId`.
     */
    function colorize(text, languageId, options) {
        return colorizer_1.Colorizer.colorize(standaloneServices_1.StaticServices.modeService.get(), text, languageId, options);
    }
    exports.colorize = colorize;
    /**
     * Colorize a line in a model.
     */
    function colorizeModelLine(model, lineNumber, tabSize = 4) {
        return colorizer_1.Colorizer.colorizeModelLine(model, lineNumber, tabSize);
    }
    exports.colorizeModelLine = colorizeModelLine;
    /**
     * @internal
     */
    function getSafeTokenizationSupport(language) {
        let tokenizationSupport = modes.TokenizationRegistry.get(language);
        if (tokenizationSupport) {
            return tokenizationSupport;
        }
        return {
            getInitialState: () => nullMode_1.NULL_STATE,
            tokenize: (line, state, deltaOffset) => nullMode_1.nullTokenize(language, line, state, deltaOffset)
        };
    }
    /**
     * Tokenize `text` using language `languageId`
     */
    function tokenize(text, languageId) {
        let modeService = standaloneServices_1.StaticServices.modeService.get();
        // Needed in order to get the mode registered for subsequent look-ups
        modeService.triggerMode(languageId);
        let tokenizationSupport = getSafeTokenizationSupport(languageId);
        let lines = text.split(/\r\n|\r|\n/);
        let result = [];
        let state = tokenizationSupport.getInitialState();
        for (let i = 0, len = lines.length; i < len; i++) {
            let line = lines[i];
            let tokenizationResult = tokenizationSupport.tokenize(line, state, 0);
            result[i] = tokenizationResult.tokens;
            state = tokenizationResult.endState;
        }
        return result;
    }
    exports.tokenize = tokenize;
    /**
     * Define a new theme or update an existing theme.
     */
    function defineTheme(themeName, themeData) {
        standaloneServices_1.StaticServices.standaloneThemeService.get().defineTheme(themeName, themeData);
    }
    exports.defineTheme = defineTheme;
    /**
     * Switches to a theme.
     */
    function setTheme(themeName) {
        standaloneServices_1.StaticServices.standaloneThemeService.get().setTheme(themeName);
    }
    exports.setTheme = setTheme;
    /**
     * Clears all cached font measurements and triggers re-measurement.
     */
    function remeasureFonts() {
        configuration_2.clearAllFontInfos();
    }
    exports.remeasureFonts = remeasureFonts;
    /**
     * @internal
     */
    function createMonacoEditorAPI() {
        return {
            // methods
            create: create,
            onDidCreateEditor: onDidCreateEditor,
            createDiffEditor: createDiffEditor,
            createDiffNavigator: createDiffNavigator,
            createModel: createModel,
            setModelLanguage: setModelLanguage,
            setModelMarkers: setModelMarkers,
            getModelMarkers: getModelMarkers,
            getModels: getModels,
            getModel: getModel,
            onDidCreateModel: onDidCreateModel,
            onWillDisposeModel: onWillDisposeModel,
            onDidChangeModelLanguage: onDidChangeModelLanguage,
            createWebWorker: createWebWorker,
            colorizeElement: colorizeElement,
            colorize: colorize,
            colorizeModelLine: colorizeModelLine,
            tokenize: tokenize,
            defineTheme: defineTheme,
            setTheme: setTheme,
            remeasureFonts: remeasureFonts,
            // enums
            AccessibilitySupport: standaloneEnums.AccessibilitySupport,
            ScrollbarVisibility: standaloneEnums.ScrollbarVisibility,
            WrappingIndent: standaloneEnums.WrappingIndent,
            OverviewRulerLane: standaloneEnums.OverviewRulerLane,
            MinimapPosition: standaloneEnums.MinimapPosition,
            EndOfLinePreference: standaloneEnums.EndOfLinePreference,
            DefaultEndOfLine: standaloneEnums.DefaultEndOfLine,
            EndOfLineSequence: standaloneEnums.EndOfLineSequence,
            TrackedRangeStickiness: standaloneEnums.TrackedRangeStickiness,
            CursorChangeReason: standaloneEnums.CursorChangeReason,
            MouseTargetType: standaloneEnums.MouseTargetType,
            TextEditorCursorStyle: standaloneEnums.TextEditorCursorStyle,
            TextEditorCursorBlinkingStyle: standaloneEnums.TextEditorCursorBlinkingStyle,
            ContentWidgetPositionPreference: standaloneEnums.ContentWidgetPositionPreference,
            OverlayWidgetPositionPreference: standaloneEnums.OverlayWidgetPositionPreference,
            RenderMinimap: standaloneEnums.RenderMinimap,
            ScrollType: standaloneEnums.ScrollType,
            RenderLineNumbersType: standaloneEnums.RenderLineNumbersType,
            // classes
            ConfigurationChangedEvent: editorOptions_1.ConfigurationChangedEvent,
            BareFontInfo: fontInfo_1.BareFontInfo,
            FontInfo: fontInfo_1.FontInfo,
            TextModelResolvedOptions: model_1.TextModelResolvedOptions,
            FindMatch: model_1.FindMatch,
            // vars
            EditorType: editorCommon.EditorType,
        };
    }
    exports.createMonacoEditorAPI = createMonacoEditorAPI;
});
//# sourceMappingURL=standaloneEditor.js.map