/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/range", "vs/editor/common/core/token", "vs/editor/common/modes", "vs/editor/common/modes/languageConfigurationRegistry", "vs/editor/common/modes/modesRegistry", "vs/editor/common/standalone/standaloneEnums", "vs/editor/standalone/browser/standaloneServices", "vs/editor/standalone/common/monarch/monarchCompile", "vs/editor/standalone/common/monarch/monarchLexer"], function (require, exports, range_1, token_1, modes, languageConfigurationRegistry_1, modesRegistry_1, standaloneEnums, standaloneServices_1, monarchCompile_1, monarchLexer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Register information about a new language.
     */
    function register(language) {
        modesRegistry_1.ModesRegistry.registerLanguage(language);
    }
    exports.register = register;
    /**
     * Get the information of all the registered languages.
     */
    function getLanguages() {
        let result = [];
        result = result.concat(modesRegistry_1.ModesRegistry.getLanguages());
        return result;
    }
    exports.getLanguages = getLanguages;
    function getEncodedLanguageId(languageId) {
        let lid = standaloneServices_1.StaticServices.modeService.get().getLanguageIdentifier(languageId);
        return lid ? lid.id : 0;
    }
    exports.getEncodedLanguageId = getEncodedLanguageId;
    /**
     * An event emitted when a language is first time needed (e.g. a model has it set).
     * @event
     */
    function onLanguage(languageId, callback) {
        let disposable = standaloneServices_1.StaticServices.modeService.get().onDidCreateMode((mode) => {
            if (mode.getId() === languageId) {
                // stop listening
                disposable.dispose();
                // invoke actual listener
                callback();
            }
        });
        return disposable;
    }
    exports.onLanguage = onLanguage;
    /**
     * Set the editing configuration for a language.
     */
    function setLanguageConfiguration(languageId, configuration) {
        let languageIdentifier = standaloneServices_1.StaticServices.modeService.get().getLanguageIdentifier(languageId);
        if (!languageIdentifier) {
            throw new Error(`Cannot set configuration for unknown language ${languageId}`);
        }
        return languageConfigurationRegistry_1.LanguageConfigurationRegistry.register(languageIdentifier, configuration);
    }
    exports.setLanguageConfiguration = setLanguageConfiguration;
    /**
     * @internal
     */
    class EncodedTokenizationSupport2Adapter {
        constructor(actual) {
            this._actual = actual;
        }
        getInitialState() {
            return this._actual.getInitialState();
        }
        tokenize(line, state, offsetDelta) {
            throw new Error('Not supported!');
        }
        tokenize2(line, state) {
            let result = this._actual.tokenizeEncoded(line, state);
            return new token_1.TokenizationResult2(result.tokens, result.endState);
        }
    }
    exports.EncodedTokenizationSupport2Adapter = EncodedTokenizationSupport2Adapter;
    /**
     * @internal
     */
    class TokenizationSupport2Adapter {
        constructor(standaloneThemeService, languageIdentifier, actual) {
            this._standaloneThemeService = standaloneThemeService;
            this._languageIdentifier = languageIdentifier;
            this._actual = actual;
        }
        getInitialState() {
            return this._actual.getInitialState();
        }
        _toClassicTokens(tokens, language, offsetDelta) {
            let result = [];
            let previousStartIndex = 0;
            for (let i = 0, len = tokens.length; i < len; i++) {
                const t = tokens[i];
                let startIndex = t.startIndex;
                // Prevent issues stemming from a buggy external tokenizer.
                if (i === 0) {
                    // Force first token to start at first index!
                    startIndex = 0;
                }
                else if (startIndex < previousStartIndex) {
                    // Force tokens to be after one another!
                    startIndex = previousStartIndex;
                }
                result[i] = new token_1.Token(startIndex + offsetDelta, t.scopes, language);
                previousStartIndex = startIndex;
            }
            return result;
        }
        tokenize(line, state, offsetDelta) {
            let actualResult = this._actual.tokenize(line, state);
            let tokens = this._toClassicTokens(actualResult.tokens, this._languageIdentifier.language, offsetDelta);
            let endState;
            // try to save an object if possible
            if (actualResult.endState.equals(state)) {
                endState = state;
            }
            else {
                endState = actualResult.endState;
            }
            return new token_1.TokenizationResult(tokens, endState);
        }
        _toBinaryTokens(tokens, offsetDelta) {
            const languageId = this._languageIdentifier.id;
            const tokenTheme = this._standaloneThemeService.getTheme().tokenTheme;
            let result = [], resultLen = 0;
            let previousStartIndex = 0;
            for (let i = 0, len = tokens.length; i < len; i++) {
                const t = tokens[i];
                const metadata = tokenTheme.match(languageId, t.scopes);
                if (resultLen > 0 && result[resultLen - 1] === metadata) {
                    // same metadata
                    continue;
                }
                let startIndex = t.startIndex;
                // Prevent issues stemming from a buggy external tokenizer.
                if (i === 0) {
                    // Force first token to start at first index!
                    startIndex = 0;
                }
                else if (startIndex < previousStartIndex) {
                    // Force tokens to be after one another!
                    startIndex = previousStartIndex;
                }
                result[resultLen++] = startIndex + offsetDelta;
                result[resultLen++] = metadata;
                previousStartIndex = startIndex;
            }
            let actualResult = new Uint32Array(resultLen);
            for (let i = 0; i < resultLen; i++) {
                actualResult[i] = result[i];
            }
            return actualResult;
        }
        tokenize2(line, state, offsetDelta) {
            let actualResult = this._actual.tokenize(line, state);
            let tokens = this._toBinaryTokens(actualResult.tokens, offsetDelta);
            let endState;
            // try to save an object if possible
            if (actualResult.endState.equals(state)) {
                endState = state;
            }
            else {
                endState = actualResult.endState;
            }
            return new token_1.TokenizationResult2(tokens, endState);
        }
    }
    exports.TokenizationSupport2Adapter = TokenizationSupport2Adapter;
    function isEncodedTokensProvider(provider) {
        return 'tokenizeEncoded' in provider;
    }
    function isThenable(obj) {
        return obj && typeof obj.then === 'function';
    }
    /**
     * Set the tokens provider for a language (manual implementation).
     */
    function setTokensProvider(languageId, provider) {
        let languageIdentifier = standaloneServices_1.StaticServices.modeService.get().getLanguageIdentifier(languageId);
        if (!languageIdentifier) {
            throw new Error(`Cannot set tokens provider for unknown language ${languageId}`);
        }
        const create = (provider) => {
            if (isEncodedTokensProvider(provider)) {
                return new EncodedTokenizationSupport2Adapter(provider);
            }
            else {
                return new TokenizationSupport2Adapter(standaloneServices_1.StaticServices.standaloneThemeService.get(), languageIdentifier, provider);
            }
        };
        if (isThenable(provider)) {
            return modes.TokenizationRegistry.registerPromise(languageId, provider.then(provider => create(provider)));
        }
        return modes.TokenizationRegistry.register(languageId, create(provider));
    }
    exports.setTokensProvider = setTokensProvider;
    /**
     * Set the tokens provider for a language (monarch implementation).
     */
    function setMonarchTokensProvider(languageId, languageDef) {
        const create = (languageDef) => {
            return monarchLexer_1.createTokenizationSupport(standaloneServices_1.StaticServices.modeService.get(), standaloneServices_1.StaticServices.standaloneThemeService.get(), languageId, monarchCompile_1.compile(languageId, languageDef));
        };
        if (isThenable(languageDef)) {
            return modes.TokenizationRegistry.registerPromise(languageId, languageDef.then(languageDef => create(languageDef)));
        }
        return modes.TokenizationRegistry.register(languageId, create(languageDef));
    }
    exports.setMonarchTokensProvider = setMonarchTokensProvider;
    /**
     * Register a reference provider (used by e.g. reference search).
     */
    function registerReferenceProvider(languageId, provider) {
        return modes.ReferenceProviderRegistry.register(languageId, provider);
    }
    exports.registerReferenceProvider = registerReferenceProvider;
    /**
     * Register a rename provider (used by e.g. rename symbol).
     */
    function registerRenameProvider(languageId, provider) {
        return modes.RenameProviderRegistry.register(languageId, provider);
    }
    exports.registerRenameProvider = registerRenameProvider;
    /**
     * Register a signature help provider (used by e.g. parameter hints).
     */
    function registerSignatureHelpProvider(languageId, provider) {
        return modes.SignatureHelpProviderRegistry.register(languageId, provider);
    }
    exports.registerSignatureHelpProvider = registerSignatureHelpProvider;
    /**
     * Register a hover provider (used by e.g. editor hover).
     */
    function registerHoverProvider(languageId, provider) {
        return modes.HoverProviderRegistry.register(languageId, {
            provideHover: (model, position, token) => {
                let word = model.getWordAtPosition(position);
                return Promise.resolve(provider.provideHover(model, position, token)).then((value) => {
                    if (!value) {
                        return undefined;
                    }
                    if (!value.range && word) {
                        value.range = new range_1.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
                    }
                    if (!value.range) {
                        value.range = new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column);
                    }
                    return value;
                });
            }
        });
    }
    exports.registerHoverProvider = registerHoverProvider;
    /**
     * Register a document symbol provider (used by e.g. outline).
     */
    function registerDocumentSymbolProvider(languageId, provider) {
        return modes.DocumentSymbolProviderRegistry.register(languageId, provider);
    }
    exports.registerDocumentSymbolProvider = registerDocumentSymbolProvider;
    /**
     * Register a document highlight provider (used by e.g. highlight occurrences).
     */
    function registerDocumentHighlightProvider(languageId, provider) {
        return modes.DocumentHighlightProviderRegistry.register(languageId, provider);
    }
    exports.registerDocumentHighlightProvider = registerDocumentHighlightProvider;
    /**
     * Register a definition provider (used by e.g. go to definition).
     */
    function registerDefinitionProvider(languageId, provider) {
        return modes.DefinitionProviderRegistry.register(languageId, provider);
    }
    exports.registerDefinitionProvider = registerDefinitionProvider;
    /**
     * Register a implementation provider (used by e.g. go to implementation).
     */
    function registerImplementationProvider(languageId, provider) {
        return modes.ImplementationProviderRegistry.register(languageId, provider);
    }
    exports.registerImplementationProvider = registerImplementationProvider;
    /**
     * Register a type definition provider (used by e.g. go to type definition).
     */
    function registerTypeDefinitionProvider(languageId, provider) {
        return modes.TypeDefinitionProviderRegistry.register(languageId, provider);
    }
    exports.registerTypeDefinitionProvider = registerTypeDefinitionProvider;
    /**
     * Register a code lens provider (used by e.g. inline code lenses).
     */
    function registerCodeLensProvider(languageId, provider) {
        return modes.CodeLensProviderRegistry.register(languageId, provider);
    }
    exports.registerCodeLensProvider = registerCodeLensProvider;
    /**
     * Register a code action provider (used by e.g. quick fix).
     */
    function registerCodeActionProvider(languageId, provider) {
        return modes.CodeActionProviderRegistry.register(languageId, {
            provideCodeActions: (model, range, context, token) => {
                let markers = standaloneServices_1.StaticServices.markerService.get().read({ resource: model.uri }).filter(m => {
                    return range_1.Range.areIntersectingOrTouching(m, range);
                });
                return provider.provideCodeActions(model, range, { markers, only: context.only }, token);
            }
        });
    }
    exports.registerCodeActionProvider = registerCodeActionProvider;
    /**
     * Register a formatter that can handle only entire models.
     */
    function registerDocumentFormattingEditProvider(languageId, provider) {
        return modes.DocumentFormattingEditProviderRegistry.register(languageId, provider);
    }
    exports.registerDocumentFormattingEditProvider = registerDocumentFormattingEditProvider;
    /**
     * Register a formatter that can handle a range inside a model.
     */
    function registerDocumentRangeFormattingEditProvider(languageId, provider) {
        return modes.DocumentRangeFormattingEditProviderRegistry.register(languageId, provider);
    }
    exports.registerDocumentRangeFormattingEditProvider = registerDocumentRangeFormattingEditProvider;
    /**
     * Register a formatter than can do formatting as the user types.
     */
    function registerOnTypeFormattingEditProvider(languageId, provider) {
        return modes.OnTypeFormattingEditProviderRegistry.register(languageId, provider);
    }
    exports.registerOnTypeFormattingEditProvider = registerOnTypeFormattingEditProvider;
    /**
     * Register a link provider that can find links in text.
     */
    function registerLinkProvider(languageId, provider) {
        return modes.LinkProviderRegistry.register(languageId, provider);
    }
    exports.registerLinkProvider = registerLinkProvider;
    /**
     * Register a completion item provider (use by e.g. suggestions).
     */
    function registerCompletionItemProvider(languageId, provider) {
        return modes.CompletionProviderRegistry.register(languageId, provider);
    }
    exports.registerCompletionItemProvider = registerCompletionItemProvider;
    /**
     * Register a document color provider (used by Color Picker, Color Decorator).
     */
    function registerColorProvider(languageId, provider) {
        return modes.ColorProviderRegistry.register(languageId, provider);
    }
    exports.registerColorProvider = registerColorProvider;
    /**
     * Register a folding range provider
     */
    function registerFoldingRangeProvider(languageId, provider) {
        return modes.FoldingRangeProviderRegistry.register(languageId, provider);
    }
    exports.registerFoldingRangeProvider = registerFoldingRangeProvider;
    /**
     * Register a declaration provider
     */
    function registerDeclarationProvider(languageId, provider) {
        return modes.DeclarationProviderRegistry.register(languageId, provider);
    }
    exports.registerDeclarationProvider = registerDeclarationProvider;
    /**
     * Register a selection range provider
     */
    function registerSelectionRangeProvider(languageId, provider) {
        return modes.SelectionRangeRegistry.register(languageId, provider);
    }
    exports.registerSelectionRangeProvider = registerSelectionRangeProvider;
    /**
     * @internal
     */
    function createMonacoLanguagesAPI() {
        return {
            register: register,
            getLanguages: getLanguages,
            onLanguage: onLanguage,
            getEncodedLanguageId: getEncodedLanguageId,
            // provider methods
            setLanguageConfiguration: setLanguageConfiguration,
            setTokensProvider: setTokensProvider,
            setMonarchTokensProvider: setMonarchTokensProvider,
            registerReferenceProvider: registerReferenceProvider,
            registerRenameProvider: registerRenameProvider,
            registerCompletionItemProvider: registerCompletionItemProvider,
            registerSignatureHelpProvider: registerSignatureHelpProvider,
            registerHoverProvider: registerHoverProvider,
            registerDocumentSymbolProvider: registerDocumentSymbolProvider,
            registerDocumentHighlightProvider: registerDocumentHighlightProvider,
            registerDefinitionProvider: registerDefinitionProvider,
            registerImplementationProvider: registerImplementationProvider,
            registerTypeDefinitionProvider: registerTypeDefinitionProvider,
            registerCodeLensProvider: registerCodeLensProvider,
            registerCodeActionProvider: registerCodeActionProvider,
            registerDocumentFormattingEditProvider: registerDocumentFormattingEditProvider,
            registerDocumentRangeFormattingEditProvider: registerDocumentRangeFormattingEditProvider,
            registerOnTypeFormattingEditProvider: registerOnTypeFormattingEditProvider,
            registerLinkProvider: registerLinkProvider,
            registerColorProvider: registerColorProvider,
            registerFoldingRangeProvider: registerFoldingRangeProvider,
            registerDeclarationProvider: registerDeclarationProvider,
            registerSelectionRangeProvider: registerSelectionRangeProvider,
            // enums
            DocumentHighlightKind: standaloneEnums.DocumentHighlightKind,
            CompletionItemKind: standaloneEnums.CompletionItemKind,
            CompletionItemTag: standaloneEnums.CompletionItemTag,
            CompletionItemInsertTextRule: standaloneEnums.CompletionItemInsertTextRule,
            SymbolKind: standaloneEnums.SymbolKind,
            SymbolTag: standaloneEnums.SymbolTag,
            IndentAction: standaloneEnums.IndentAction,
            CompletionTriggerKind: standaloneEnums.CompletionTriggerKind,
            SignatureHelpTriggerKind: standaloneEnums.SignatureHelpTriggerKind,
            // classes
            FoldingRangeKind: modes.FoldingRangeKind,
        };
    }
    exports.createMonacoLanguagesAPI = createMonacoLanguagesAPI;
});
//# sourceMappingURL=standaloneLanguages.js.map