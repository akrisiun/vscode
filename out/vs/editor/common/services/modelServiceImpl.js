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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/editor/common/config/editorOptions", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/editor/common/modes/modesRegistry", "vs/editor/common/services/resourceConfiguration", "vs/platform/configuration/common/configuration"], function (require, exports, event_1, lifecycle_1, platform, editorOptions_1, editOperation_1, range_1, textModel_1, modesRegistry_1, resourceConfiguration_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function MODEL_ID(resource) {
        return resource.toString();
    }
    class ModelData {
        constructor(model, onWillDispose, onDidChangeLanguage) {
            this._modelEventListeners = new lifecycle_1.DisposableStore();
            this.model = model;
            this._languageSelection = null;
            this._languageSelectionListener = null;
            this._modelEventListeners.add(model.onWillDispose(() => onWillDispose(model)));
            this._modelEventListeners.add(model.onDidChangeLanguage((e) => onDidChangeLanguage(model, e)));
        }
        _disposeLanguageSelection() {
            if (this._languageSelectionListener) {
                this._languageSelectionListener.dispose();
                this._languageSelectionListener = null;
            }
            if (this._languageSelection) {
                this._languageSelection.dispose();
                this._languageSelection = null;
            }
        }
        dispose() {
            this._modelEventListeners.dispose();
            this._disposeLanguageSelection();
        }
        setLanguage(languageSelection) {
            this._disposeLanguageSelection();
            this._languageSelection = languageSelection;
            this._languageSelectionListener = this._languageSelection.onDidChange(() => this.model.setMode(languageSelection.languageIdentifier));
            this.model.setMode(languageSelection.languageIdentifier);
        }
    }
    const DEFAULT_EOL = (platform.isLinux || platform.isMacintosh) ? 1 /* LF */ : 2 /* CRLF */;
    let ModelServiceImpl = class ModelServiceImpl extends lifecycle_1.Disposable {
        constructor(configurationService, resourcePropertiesService) {
            super();
            this._onModelAdded = this._register(new event_1.Emitter());
            this.onModelAdded = this._onModelAdded.event;
            this._onModelRemoved = this._register(new event_1.Emitter());
            this.onModelRemoved = this._onModelRemoved.event;
            this._onModelModeChanged = this._register(new event_1.Emitter());
            this.onModelModeChanged = this._onModelModeChanged.event;
            this._configurationService = configurationService;
            this._resourcePropertiesService = resourcePropertiesService;
            this._models = {};
            this._modelCreationOptionsByLanguageAndResource = Object.create(null);
            this._configurationServiceSubscription = this._configurationService.onDidChangeConfiguration(e => this._updateModelOptions());
            this._updateModelOptions();
        }
        static _readModelOptions(config, isForSimpleWidget) {
            let tabSize = editorOptions_1.EDITOR_MODEL_DEFAULTS.tabSize;
            if (config.editor && typeof config.editor.tabSize !== 'undefined') {
                let parsedTabSize = parseInt(config.editor.tabSize, 10);
                if (!isNaN(parsedTabSize)) {
                    tabSize = parsedTabSize;
                }
                if (tabSize < 1) {
                    tabSize = 1;
                }
            }
            let indentSize = tabSize;
            if (config.editor && typeof config.editor.indentSize !== 'undefined' && config.editor.indentSize !== 'tabSize') {
                let parsedIndentSize = parseInt(config.editor.indentSize, 10);
                if (!isNaN(parsedIndentSize)) {
                    indentSize = parsedIndentSize;
                }
                if (indentSize < 1) {
                    indentSize = 1;
                }
            }
            let insertSpaces = editorOptions_1.EDITOR_MODEL_DEFAULTS.insertSpaces;
            if (config.editor && typeof config.editor.insertSpaces !== 'undefined') {
                insertSpaces = (config.editor.insertSpaces === 'false' ? false : Boolean(config.editor.insertSpaces));
            }
            let newDefaultEOL = DEFAULT_EOL;
            const eol = config.eol;
            if (eol === '\r\n') {
                newDefaultEOL = 2 /* CRLF */;
            }
            else if (eol === '\n') {
                newDefaultEOL = 1 /* LF */;
            }
            let trimAutoWhitespace = editorOptions_1.EDITOR_MODEL_DEFAULTS.trimAutoWhitespace;
            if (config.editor && typeof config.editor.trimAutoWhitespace !== 'undefined') {
                trimAutoWhitespace = (config.editor.trimAutoWhitespace === 'false' ? false : Boolean(config.editor.trimAutoWhitespace));
            }
            let detectIndentation = editorOptions_1.EDITOR_MODEL_DEFAULTS.detectIndentation;
            if (config.editor && typeof config.editor.detectIndentation !== 'undefined') {
                detectIndentation = (config.editor.detectIndentation === 'false' ? false : Boolean(config.editor.detectIndentation));
            }
            let largeFileOptimizations = editorOptions_1.EDITOR_MODEL_DEFAULTS.largeFileOptimizations;
            if (config.editor && typeof config.editor.largeFileOptimizations !== 'undefined') {
                largeFileOptimizations = (config.editor.largeFileOptimizations === 'false' ? false : Boolean(config.editor.largeFileOptimizations));
            }
            return {
                isForSimpleWidget: isForSimpleWidget,
                tabSize: tabSize,
                indentSize: indentSize,
                insertSpaces: insertSpaces,
                detectIndentation: detectIndentation,
                defaultEOL: newDefaultEOL,
                trimAutoWhitespace: trimAutoWhitespace,
                largeFileOptimizations: largeFileOptimizations
            };
        }
        getCreationOptions(language, resource, isForSimpleWidget) {
            let creationOptions = this._modelCreationOptionsByLanguageAndResource[language + resource];
            if (!creationOptions) {
                const editor = this._configurationService.getValue('editor', { overrideIdentifier: language, resource });
                const eol = this._resourcePropertiesService.getEOL(resource, language);
                creationOptions = ModelServiceImpl._readModelOptions({ editor, eol }, isForSimpleWidget);
                this._modelCreationOptionsByLanguageAndResource[language + resource] = creationOptions;
            }
            return creationOptions;
        }
        _updateModelOptions() {
            let oldOptionsByLanguageAndResource = this._modelCreationOptionsByLanguageAndResource;
            this._modelCreationOptionsByLanguageAndResource = Object.create(null);
            // Update options on all models
            let keys = Object.keys(this._models);
            for (let i = 0, len = keys.length; i < len; i++) {
                let modelId = keys[i];
                let modelData = this._models[modelId];
                const language = modelData.model.getLanguageIdentifier().language;
                const uri = modelData.model.uri;
                const oldOptions = oldOptionsByLanguageAndResource[language + uri];
                const newOptions = this.getCreationOptions(language, uri, modelData.model.isForSimpleWidget);
                ModelServiceImpl._setModelOptionsForModel(modelData.model, newOptions, oldOptions);
            }
        }
        static _setModelOptionsForModel(model, newOptions, currentOptions) {
            if (currentOptions
                && (currentOptions.detectIndentation === newOptions.detectIndentation)
                && (currentOptions.insertSpaces === newOptions.insertSpaces)
                && (currentOptions.tabSize === newOptions.tabSize)
                && (currentOptions.indentSize === newOptions.indentSize)
                && (currentOptions.trimAutoWhitespace === newOptions.trimAutoWhitespace)) {
                // Same indent opts, no need to touch the model
                return;
            }
            if (newOptions.detectIndentation) {
                model.detectIndentation(newOptions.insertSpaces, newOptions.tabSize);
                model.updateOptions({
                    trimAutoWhitespace: newOptions.trimAutoWhitespace
                });
            }
            else {
                model.updateOptions({
                    insertSpaces: newOptions.insertSpaces,
                    tabSize: newOptions.tabSize,
                    indentSize: newOptions.indentSize,
                    trimAutoWhitespace: newOptions.trimAutoWhitespace
                });
            }
        }
        dispose() {
            this._configurationServiceSubscription.dispose();
            super.dispose();
        }
        // --- begin IModelService
        _createModelData(value, languageIdentifier, resource, isForSimpleWidget) {
            // create & save the model
            const options = this.getCreationOptions(languageIdentifier.language, resource, isForSimpleWidget);
            const model = new textModel_1.TextModel(value, options, languageIdentifier, resource);
            const modelId = MODEL_ID(model.uri);
            if (this._models[modelId]) {
                // There already exists a model with this id => this is a programmer error
                throw new Error('ModelService: Cannot add model because it already exists!');
            }
            const modelData = new ModelData(model, (model) => this._onWillDispose(model), (model, e) => this._onDidChangeLanguage(model, e));
            this._models[modelId] = modelData;
            return modelData;
        }
        updateModel(model, value) {
            const options = this.getCreationOptions(model.getLanguageIdentifier().language, model.uri, model.isForSimpleWidget);
            const textBuffer = textModel_1.createTextBuffer(value, options.defaultEOL);
            // Return early if the text is already set in that form
            if (model.equalsTextBuffer(textBuffer)) {
                return;
            }
            // Otherwise find a diff between the values and update model
            model.pushStackElement();
            model.pushEOL(textBuffer.getEOL() === '\r\n' ? 1 /* CRLF */ : 0 /* LF */);
            model.pushEditOperations([], ModelServiceImpl._computeEdits(model, textBuffer), (inverseEditOperations) => []);
            model.pushStackElement();
        }
        static _commonPrefix(a, aLen, aDelta, b, bLen, bDelta) {
            const maxResult = Math.min(aLen, bLen);
            let result = 0;
            for (let i = 0; i < maxResult && a.getLineContent(aDelta + i) === b.getLineContent(bDelta + i); i++) {
                result++;
            }
            return result;
        }
        static _commonSuffix(a, aLen, aDelta, b, bLen, bDelta) {
            const maxResult = Math.min(aLen, bLen);
            let result = 0;
            for (let i = 0; i < maxResult && a.getLineContent(aDelta + aLen - i) === b.getLineContent(bDelta + bLen - i); i++) {
                result++;
            }
            return result;
        }
        /**
         * Compute edits to bring `model` to the state of `textSource`.
         */
        static _computeEdits(model, textBuffer) {
            const modelLineCount = model.getLineCount();
            const textBufferLineCount = textBuffer.getLineCount();
            const commonPrefix = this._commonPrefix(model, modelLineCount, 1, textBuffer, textBufferLineCount, 1);
            if (modelLineCount === textBufferLineCount && commonPrefix === modelLineCount) {
                // equality case
                return [];
            }
            const commonSuffix = this._commonSuffix(model, modelLineCount - commonPrefix, commonPrefix, textBuffer, textBufferLineCount - commonPrefix, commonPrefix);
            let oldRange, newRange;
            if (commonSuffix > 0) {
                oldRange = new range_1.Range(commonPrefix + 1, 1, modelLineCount - commonSuffix + 1, 1);
                newRange = new range_1.Range(commonPrefix + 1, 1, textBufferLineCount - commonSuffix + 1, 1);
            }
            else if (commonPrefix > 0) {
                oldRange = new range_1.Range(commonPrefix, model.getLineMaxColumn(commonPrefix), modelLineCount, model.getLineMaxColumn(modelLineCount));
                newRange = new range_1.Range(commonPrefix, 1 + textBuffer.getLineLength(commonPrefix), textBufferLineCount, 1 + textBuffer.getLineLength(textBufferLineCount));
            }
            else {
                oldRange = new range_1.Range(1, 1, modelLineCount, model.getLineMaxColumn(modelLineCount));
                newRange = new range_1.Range(1, 1, textBufferLineCount, 1 + textBuffer.getLineLength(textBufferLineCount));
            }
            return [editOperation_1.EditOperation.replaceMove(oldRange, textBuffer.getValueInRange(newRange, 0 /* TextDefined */))];
        }
        createModel(value, languageSelection, resource, isForSimpleWidget = false) {
            let modelData;
            if (languageSelection) {
                modelData = this._createModelData(value, languageSelection.languageIdentifier, resource, isForSimpleWidget);
                this.setMode(modelData.model, languageSelection);
            }
            else {
                modelData = this._createModelData(value, modesRegistry_1.PLAINTEXT_LANGUAGE_IDENTIFIER, resource, isForSimpleWidget);
            }
            this._onModelAdded.fire(modelData.model);
            return modelData.model;
        }
        setMode(model, languageSelection) {
            if (!languageSelection) {
                return;
            }
            let modelData = this._models[MODEL_ID(model.uri)];
            if (!modelData) {
                return;
            }
            modelData.setLanguage(languageSelection);
        }
        destroyModel(resource) {
            // We need to support that not all models get disposed through this service (i.e. model.dispose() should work!)
            let modelData = this._models[MODEL_ID(resource)];
            if (!modelData) {
                return;
            }
            modelData.model.dispose();
        }
        getModels() {
            let ret = [];
            let keys = Object.keys(this._models);
            for (let i = 0, len = keys.length; i < len; i++) {
                let modelId = keys[i];
                ret.push(this._models[modelId].model);
            }
            return ret;
        }
        getModel(resource) {
            let modelId = MODEL_ID(resource);
            let modelData = this._models[modelId];
            if (!modelData) {
                return null;
            }
            return modelData.model;
        }
        // --- end IModelService
        _onWillDispose(model) {
            let modelId = MODEL_ID(model.uri);
            let modelData = this._models[modelId];
            delete this._models[modelId];
            modelData.dispose();
            // clean up cache
            delete this._modelCreationOptionsByLanguageAndResource[model.getLanguageIdentifier().language + model.uri];
            this._onModelRemoved.fire(model);
        }
        _onDidChangeLanguage(model, e) {
            const oldModeId = e.oldLanguage;
            const newModeId = model.getLanguageIdentifier().language;
            const oldOptions = this.getCreationOptions(oldModeId, model.uri, model.isForSimpleWidget);
            const newOptions = this.getCreationOptions(newModeId, model.uri, model.isForSimpleWidget);
            ModelServiceImpl._setModelOptionsForModel(model, newOptions, oldOptions);
            this._onModelModeChanged.fire({ model, oldModeId });
        }
    };
    ModelServiceImpl = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, resourceConfiguration_1.ITextResourcePropertiesService)
    ], ModelServiceImpl);
    exports.ModelServiceImpl = ModelServiceImpl;
});
//# sourceMappingURL=modelServiceImpl.js.map