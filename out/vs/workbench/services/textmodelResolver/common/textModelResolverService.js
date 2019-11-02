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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/async", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/editor/common/services/modelService", "vs/workbench/common/editor/resourceEditorModel", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/network", "vs/editor/common/services/resolverService", "vs/workbench/services/untitled/common/untitledEditorService", "vs/workbench/services/textfile/common/textFileEditorModel", "vs/platform/files/common/files", "vs/platform/instantiation/common/extensions"], function (require, exports, uri_1, async_1, instantiation_1, lifecycle_1, modelService_1, resourceEditorModel_1, textfiles_1, network, resolverService_1, untitledEditorService_1, textFileEditorModel_1, files_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ResourceModelCollection = class ResourceModelCollection extends lifecycle_1.ReferenceCollection {
        constructor(instantiationService, textFileService, fileService) {
            super();
            this.instantiationService = instantiationService;
            this.textFileService = textFileService;
            this.fileService = fileService;
            this.providers = Object.create(null);
            this.modelsToDispose = new Set();
        }
        async createReferencedObject(key, skipActivateProvider) {
            this.modelsToDispose.delete(key);
            const resource = uri_1.URI.parse(key);
            // File or remote file provider already known
            if (this.fileService.canHandleResource(resource)) {
                return this.textFileService.models.loadOrCreate(resource, { reason: 2 /* REFERENCE */ });
            }
            // Virtual documents
            if (this.providers[resource.scheme]) {
                await this.resolveTextModelContent(key);
                return this.instantiationService.createInstance(resourceEditorModel_1.ResourceEditorModel, resource);
            }
            // Either unknown schema, or not yet registered, try to activate
            if (!skipActivateProvider) {
                await this.fileService.activateProvider(resource.scheme);
                return this.createReferencedObject(key, true);
            }
            throw new Error('resource is not available');
        }
        destroyReferencedObject(key, modelPromise) {
            this.modelsToDispose.add(key);
            modelPromise.then(model => {
                if (this.modelsToDispose.has(key)) {
                    if (model instanceof textFileEditorModel_1.TextFileEditorModel) {
                        this.textFileService.models.disposeModel(model);
                    }
                    else {
                        model.dispose();
                    }
                }
            }, err => {
                // ignore
            });
        }
        registerTextModelContentProvider(scheme, provider) {
            const registry = this.providers;
            const providers = registry[scheme] || (registry[scheme] = []);
            providers.unshift(provider);
            return lifecycle_1.toDisposable(() => {
                const array = registry[scheme];
                if (!array) {
                    return;
                }
                const index = array.indexOf(provider);
                if (index === -1) {
                    return;
                }
                array.splice(index, 1);
                if (array.length === 0) {
                    delete registry[scheme];
                }
            });
        }
        hasTextModelContentProvider(scheme) {
            return this.providers[scheme] !== undefined;
        }
        async resolveTextModelContent(key) {
            const resource = uri_1.URI.parse(key);
            const providers = this.providers[resource.scheme] || [];
            const factories = providers.map(p => () => Promise.resolve(p.provideTextContent(resource)));
            const model = await async_1.first(factories);
            if (!model) {
                throw new Error('resource is not available');
            }
            return model;
        }
    };
    ResourceModelCollection = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, textfiles_1.ITextFileService),
        __param(2, files_1.IFileService)
    ], ResourceModelCollection);
    let TextModelResolverService = class TextModelResolverService {
        constructor(untitledEditorService, instantiationService, modelService) {
            this.untitledEditorService = untitledEditorService;
            this.instantiationService = instantiationService;
            this.modelService = modelService;
            this.resourceModelCollection = instantiationService.createInstance(ResourceModelCollection);
        }
        createModelReference(resource) {
            return this.doCreateModelReference(resource);
        }
        async doCreateModelReference(resource) {
            // Untitled Schema: go through cached input
            if (resource.scheme === network.Schemas.untitled) {
                const model = await this.untitledEditorService.loadOrCreate({ resource });
                return new lifecycle_1.ImmortalReference(model);
            }
            // InMemory Schema: go through model service cache
            if (resource.scheme === network.Schemas.inMemory) {
                const cachedModel = this.modelService.getModel(resource);
                if (!cachedModel) {
                    throw new Error('Cant resolve inmemory resource');
                }
                return new lifecycle_1.ImmortalReference(this.instantiationService.createInstance(resourceEditorModel_1.ResourceEditorModel, resource));
            }
            const ref = this.resourceModelCollection.acquire(resource.toString());
            try {
                const model = await ref.object;
                return { object: model, dispose: () => ref.dispose() };
            }
            catch (error) {
                ref.dispose();
                throw error;
            }
        }
        registerTextModelContentProvider(scheme, provider) {
            return this.resourceModelCollection.registerTextModelContentProvider(scheme, provider);
        }
        hasTextModelContentProvider(scheme) {
            return this.resourceModelCollection.hasTextModelContentProvider(scheme);
        }
    };
    TextModelResolverService = __decorate([
        __param(0, untitledEditorService_1.IUntitledEditorService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, modelService_1.IModelService)
    ], TextModelResolverService);
    exports.TextModelResolverService = TextModelResolverService;
    extensions_1.registerSingleton(resolverService_1.ITextModelService, TextModelResolverService, true);
});
//# sourceMappingURL=textModelResolverService.js.map