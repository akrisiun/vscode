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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/base/common/uri", "vs/workbench/contrib/notebook/browser/extensionPoint", "vs/workbench/contrib/notebook/common/notebookProvider", "vs/base/common/event", "vs/workbench/services/extensions/common/extensions", "vs/workbench/contrib/notebook/common/notebookOutputRenderer", "vs/base/common/iterator", "vs/base/common/cancellation", "vs/workbench/services/editor/common/editorService"], function (require, exports, nls, lifecycle_1, instantiation_1, uri_1, extensionPoint_1, notebookProvider_1, event_1, extensions_1, notebookOutputRenderer_1, iterator_1, cancellation_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookService = exports.NotebookOutputRendererInfoStore = exports.NotebookProviderInfoStore = exports.INotebookService = void 0;
    function MODEL_ID(resource) {
        return resource.toString();
    }
    exports.INotebookService = instantiation_1.createDecorator('notebookService');
    class NotebookProviderInfoStore {
        constructor() {
            this.contributedEditors = new Map();
        }
        clear() {
            this.contributedEditors.clear();
        }
        get(viewType) {
            return this.contributedEditors.get(viewType);
        }
        add(info) {
            if (this.contributedEditors.has(info.id)) {
                console.log(`Custom editor with id '${info.id}' already registered`);
                return;
            }
            this.contributedEditors.set(info.id, info);
        }
        getContributedNotebook(resource) {
            return [...iterator_1.Iterable.filter(this.contributedEditors.values(), customEditor => customEditor.matches(resource))];
        }
        [Symbol.iterator]() {
            return this.contributedEditors.values();
        }
    }
    exports.NotebookProviderInfoStore = NotebookProviderInfoStore;
    class NotebookOutputRendererInfoStore {
        constructor() {
            this.contributedRenderers = new Map();
        }
        clear() {
            this.contributedRenderers.clear();
        }
        get(viewType) {
            return this.contributedRenderers.get(viewType);
        }
        add(info) {
            if (this.contributedRenderers.has(info.id)) {
                console.log(`Custom notebook output renderer with id '${info.id}' already registered`);
                return;
            }
            this.contributedRenderers.set(info.id, info);
        }
        getContributedRenderer(mimeType) {
            return Array.from(this.contributedRenderers.values()).filter(customEditor => customEditor.matches(mimeType));
        }
    }
    exports.NotebookOutputRendererInfoStore = NotebookOutputRendererInfoStore;
    class ModelData {
        constructor(model, onWillDispose) {
            this.model = model;
            this._modelEventListeners = new lifecycle_1.DisposableStore();
            this._modelEventListeners.add(model.onWillDispose(() => onWillDispose(model)));
        }
        dispose() {
            this._modelEventListeners.dispose();
        }
    }
    let NotebookService = /** @class */ (() => {
        let NotebookService = class NotebookService extends lifecycle_1.Disposable {
            constructor(extensionService, editorService) {
                super();
                this.extensionService = extensionService;
                this.editorService = editorService;
                this._notebookProviders = new Map();
                this._notebookRenderers = new Map();
                this.notebookProviderInfoStore = new NotebookProviderInfoStore();
                this.notebookRenderersInfoStore = new NotebookOutputRendererInfoStore();
                this._onDidChangeActiveEditor = new event_1.Emitter();
                this.onDidChangeActiveEditor = this._onDidChangeActiveEditor.event;
                this._onDidChangeViewTypes = new event_1.Emitter();
                this.onDidChangeViewTypes = this._onDidChangeViewTypes.event;
                this._models = {};
                extensionPoint_1.notebookProviderExtensionPoint.setHandler((extensions) => {
                    this.notebookProviderInfoStore.clear();
                    for (const extension of extensions) {
                        for (const notebookContribution of extension.value) {
                            this.notebookProviderInfoStore.add(new notebookProvider_1.NotebookProviderInfo({
                                id: notebookContribution.viewType,
                                displayName: notebookContribution.displayName,
                                selector: notebookContribution.selector || [],
                                providerDisplayName: extension.description.isBuiltin ? nls.localize('builtinProviderDisplayName', "Built-in") : extension.description.displayName || extension.description.identifier.value,
                            }));
                        }
                    }
                    // console.log(this._notebookProviderInfoStore);
                });
                extensionPoint_1.notebookRendererExtensionPoint.setHandler((renderers) => {
                    this.notebookRenderersInfoStore.clear();
                    for (const extension of renderers) {
                        for (const notebookContribution of extension.value) {
                            this.notebookRenderersInfoStore.add(new notebookOutputRenderer_1.NotebookOutputRendererInfo({
                                id: notebookContribution.viewType,
                                displayName: notebookContribution.displayName,
                                mimeTypes: notebookContribution.mimeTypes || []
                            }));
                        }
                    }
                    // console.log(this.notebookRenderersInfoStore);
                });
                this.editorService.registerCustomEditorViewTypesHandler('Notebook', this);
            }
            getViewTypes() {
                return [...this.notebookProviderInfoStore].map(info => ({
                    id: info.id,
                    displayName: info.displayName,
                    providerDisplayName: info.providerDisplayName
                }));
            }
            async canResolve(viewType) {
                if (!this._notebookProviders.has(viewType)) {
                    // this awaits full activation of all matching extensions
                    await this.extensionService.activateByEvent(`onNotebookEditor:${viewType}`);
                }
                return this._notebookProviders.has(viewType);
            }
            registerNotebookController(viewType, extensionData, controller) {
                this._notebookProviders.set(viewType, { extensionData, controller });
                this._onDidChangeViewTypes.fire();
            }
            unregisterNotebookProvider(viewType) {
                this._notebookProviders.delete(viewType);
                this._onDidChangeViewTypes.fire();
            }
            registerNotebookRenderer(handle, extensionData, type, selectors, preloads) {
                this._notebookRenderers.set(handle, { extensionData, type, selectors, preloads });
            }
            unregisterNotebookRenderer(handle) {
                this._notebookRenderers.delete(handle);
            }
            getRendererInfo(handle) {
                const renderer = this._notebookRenderers.get(handle);
                if (renderer) {
                    return {
                        id: renderer.extensionData.id,
                        extensionLocation: uri_1.URI.revive(renderer.extensionData.location),
                        preloads: renderer.preloads
                    };
                }
                return;
            }
            async resolveNotebook(viewType, uri) {
                const provider = this._notebookProviders.get(viewType);
                if (!provider) {
                    return undefined;
                }
                const notebookModel = await provider.controller.resolveNotebook(viewType, uri);
                if (!notebookModel) {
                    return undefined;
                }
                // new notebook model created
                const modelId = MODEL_ID(uri);
                const modelData = new ModelData(notebookModel, (model) => this._onWillDispose(model));
                this._models[modelId] = modelData;
                return modelData.model;
            }
            async executeNotebook(viewType, uri) {
                let provider = this._notebookProviders.get(viewType);
                if (provider) {
                    return provider.controller.executeNotebook(viewType, uri, new cancellation_1.CancellationTokenSource().token); // Cancellation for notebooks - TODO
                }
                return;
            }
            async executeNotebookCell(viewType, uri, handle, token) {
                const provider = this._notebookProviders.get(viewType);
                if (provider) {
                    await provider.controller.executeNotebookCell(uri, handle, token);
                }
            }
            getContributedNotebookProviders(resource) {
                return this.notebookProviderInfoStore.getContributedNotebook(resource);
            }
            getContributedNotebookProvider(viewType) {
                return this.notebookProviderInfoStore.get(viewType);
            }
            getContributedNotebookOutputRenderers(mimeType) {
                return this.notebookRenderersInfoStore.getContributedRenderer(mimeType);
            }
            getNotebookProviderResourceRoots() {
                let ret = [];
                this._notebookProviders.forEach(val => {
                    ret.push(uri_1.URI.revive(val.extensionData.location));
                });
                return ret;
            }
            destoryNotebookDocument(viewType, notebook) {
                let provider = this._notebookProviders.get(viewType);
                if (provider) {
                    provider.controller.destoryNotebookDocument(notebook);
                }
            }
            updateActiveNotebookDocument(viewType, resource) {
                this._onDidChangeActiveEditor.fire({ viewType, uri: resource });
            }
            setToCopy(items) {
                this.cutItems = items;
            }
            getToCopy() {
                return this.cutItems;
            }
            async save(viewType, resource) {
                let provider = this._notebookProviders.get(viewType);
                if (provider) {
                    return provider.controller.save(resource);
                }
                return false;
            }
            onDidReceiveMessage(viewType, uri, message) {
                let provider = this._notebookProviders.get(viewType);
                if (provider) {
                    return provider.controller.onDidReceiveMessage(uri, message);
                }
            }
            _onWillDispose(model) {
                let modelId = MODEL_ID(model.uri);
                let modelData = this._models[modelId];
                delete this._models[modelId];
                modelData === null || modelData === void 0 ? void 0 : modelData.dispose();
                // this._onModelRemoved.fire(model);
            }
        };
        NotebookService = __decorate([
            __param(0, extensions_1.IExtensionService),
            __param(1, editorService_1.IEditorService)
        ], NotebookService);
        return NotebookService;
    })();
    exports.NotebookService = NotebookService;
});
//# sourceMappingURL=notebookService.js.map