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
define(["require", "exports", "vs/workbench/services/textMate/common/textMateService", "vs/platform/instantiation/common/extensions", "vs/workbench/services/textMate/browser/abstractTextMateService", "vs/editor/common/services/modeService", "vs/workbench/services/themes/common/workbenchThemeService", "vs/platform/notification/common/notification", "vs/platform/log/common/log", "vs/platform/configuration/common/configuration", "vs/editor/common/services/webWorker", "vs/editor/common/services/modelService", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/model/tokensStore", "vs/platform/storage/common/storage", "vs/workbench/services/extensionResourceLoader/common/extensionResourceLoader"], function (require, exports, textMateService_1, extensions_1, abstractTextMateService_1, modeService_1, workbenchThemeService_1, notification_1, log_1, configuration_1, webWorker_1, modelService_1, lifecycle_1, uri_1, tokensStore_1, storage_1, extensionResourceLoader_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const RUN_TEXTMATE_IN_WORKER = false;
    class ModelWorkerTextMateTokenizer extends lifecycle_1.Disposable {
        constructor(worker, model) {
            super();
            this._pendingChanges = [];
            this._worker = worker;
            this._model = model;
            this._isSynced = false;
            this._register(this._model.onDidChangeAttached(() => this._onDidChangeAttached()));
            this._onDidChangeAttached();
            this._register(this._model.onDidChangeContent((e) => {
                if (this._isSynced) {
                    this._worker.acceptModelChanged(this._model.uri.toString(), e);
                    this._pendingChanges.push(e);
                }
            }));
            this._register(this._model.onDidChangeLanguage((e) => {
                if (this._isSynced) {
                    this._worker.acceptModelLanguageChanged(this._model.uri.toString(), this._model.getLanguageIdentifier().id);
                }
            }));
        }
        _onDidChangeAttached() {
            if (this._model.isAttachedToEditor()) {
                if (!this._isSynced) {
                    this._beginSync();
                }
            }
            else {
                if (this._isSynced) {
                    this._endSync();
                }
            }
        }
        _beginSync() {
            this._isSynced = true;
            this._worker.acceptNewModel({
                uri: this._model.uri,
                versionId: this._model.getVersionId(),
                lines: this._model.getLinesContent(),
                EOL: this._model.getEOL(),
                languageId: this._model.getLanguageIdentifier().id,
            });
        }
        _endSync() {
            this._isSynced = false;
            this._worker.acceptRemovedModel(this._model.uri.toString());
        }
        dispose() {
            super.dispose();
            this._endSync();
        }
        _confirm(versionId) {
            while (this._pendingChanges.length > 0 && this._pendingChanges[0].versionId <= versionId) {
                this._pendingChanges.shift();
            }
        }
        setTokens(versionId, rawTokens) {
            this._confirm(versionId);
            const tokens = tokensStore_1.MultilineTokensBuilder.deserialize(new Uint8Array(rawTokens));
            for (let i = 0; i < this._pendingChanges.length; i++) {
                const change = this._pendingChanges[i];
                for (let j = 0; j < tokens.length; j++) {
                    for (let k = 0; k < change.changes.length; k++) {
                        tokens[j].applyEdit(change.changes[k].range, change.changes[k].text);
                    }
                }
            }
            this._model.setTokens(tokens);
        }
    }
    let TextMateWorkerHost = class TextMateWorkerHost {
        constructor(textMateService, _extensionResourceLoaderService) {
            this.textMateService = textMateService;
            this._extensionResourceLoaderService = _extensionResourceLoaderService;
        }
        async readFile(_resource) {
            const resource = uri_1.URI.revive(_resource);
            return this._extensionResourceLoaderService.readExtensionResource(resource);
        }
        async setTokens(_resource, versionId, tokens) {
            const resource = uri_1.URI.revive(_resource);
            this.textMateService.setTokens(resource, versionId, tokens);
        }
    };
    TextMateWorkerHost = __decorate([
        __param(1, extensionResourceLoader_1.IExtensionResourceLoaderService)
    ], TextMateWorkerHost);
    exports.TextMateWorkerHost = TextMateWorkerHost;
    let TextMateService = class TextMateService extends abstractTextMateService_1.AbstractTextMateService {
        constructor(modeService, themeService, extensionResourceLoaderService, notificationService, logService, configurationService, storageService, _modelService) {
            super(modeService, themeService, extensionResourceLoaderService, notificationService, logService, configurationService, storageService);
            this._modelService = _modelService;
            this._worker = null;
            this._workerProxy = null;
            this._tokenizers = Object.create(null);
            this._register(this._modelService.onModelAdded(model => this._onModelAdded(model)));
            this._register(this._modelService.onModelRemoved(model => this._onModelRemoved(model)));
            this._modelService.getModels().forEach((model) => this._onModelAdded(model));
        }
        _onModelAdded(model) {
            if (!this._workerProxy) {
                return;
            }
            if (model.isTooLargeForSyncing()) {
                return;
            }
            const key = model.uri.toString();
            const tokenizer = new ModelWorkerTextMateTokenizer(this._workerProxy, model);
            this._tokenizers[key] = tokenizer;
        }
        _onModelRemoved(model) {
            const key = model.uri.toString();
            if (this._tokenizers[key]) {
                this._tokenizers[key].dispose();
                delete this._tokenizers[key];
            }
        }
        _loadVSCodeTextmate() {
            return new Promise((resolve_1, reject_1) => { require(['vscode-textmate'], resolve_1, reject_1); });
        }
        _loadOnigLib() {
            return undefined;
        }
        _onDidCreateGrammarFactory(grammarDefinitions) {
            this._killWorker();
            if (RUN_TEXTMATE_IN_WORKER) {
                const workerHost = new TextMateWorkerHost(this, this._extensionResourceLoaderService);
                const worker = webWorker_1.createWebWorker(this._modelService, {
                    createData: {
                        grammarDefinitions
                    },
                    label: 'textMateWorker',
                    moduleId: 'vs/workbench/services/textMate/electron-browser/textMateWorker',
                    host: workerHost
                });
                this._worker = worker;
                worker.getProxy().then((proxy) => {
                    if (this._worker !== worker) {
                        // disposed in the meantime
                        return;
                    }
                    this._workerProxy = proxy;
                    if (this._currentTheme) {
                        this._workerProxy.acceptTheme(this._currentTheme);
                    }
                    this._modelService.getModels().forEach((model) => this._onModelAdded(model));
                });
            }
        }
        _doUpdateTheme(grammarFactory, theme) {
            super._doUpdateTheme(grammarFactory, theme);
            if (this._currentTheme && this._workerProxy) {
                this._workerProxy.acceptTheme(this._currentTheme);
            }
        }
        _onDidDisposeGrammarFactory() {
            this._killWorker();
        }
        _killWorker() {
            for (let key of Object.keys(this._tokenizers)) {
                this._tokenizers[key].dispose();
            }
            this._tokenizers = Object.create(null);
            if (this._worker) {
                this._worker.dispose();
                this._worker = null;
            }
            this._workerProxy = null;
        }
        setTokens(resource, versionId, tokens) {
            const key = resource.toString();
            if (!this._tokenizers[key]) {
                return;
            }
            this._tokenizers[key].setTokens(versionId, tokens);
        }
    };
    TextMateService = __decorate([
        __param(0, modeService_1.IModeService),
        __param(1, workbenchThemeService_1.IWorkbenchThemeService),
        __param(2, extensionResourceLoader_1.IExtensionResourceLoaderService),
        __param(3, notification_1.INotificationService),
        __param(4, log_1.ILogService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, storage_1.IStorageService),
        __param(7, modelService_1.IModelService)
    ], TextMateService);
    exports.TextMateService = TextMateService;
    extensions_1.registerSingleton(textMateService_1.ITextMateService, TextMateService);
});
//# sourceMappingURL=textMateService.js.map