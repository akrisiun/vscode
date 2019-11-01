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
define(["require", "exports", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/base/common/arrays", "vs/workbench/common/editor/untitledEditorInput", "vs/platform/files/common/files", "vs/platform/configuration/common/configuration", "vs/base/common/event", "vs/base/common/map", "vs/base/common/network", "vs/base/common/lifecycle", "vs/platform/instantiation/common/extensions", "vs/base/common/resources"], function (require, exports, uri_1, instantiation_1, arrays, untitledEditorInput_1, files_1, configuration_1, event_1, map_1, network_1, lifecycle_1, extensions_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IUntitledEditorService = instantiation_1.createDecorator('untitledEditorService');
    let UntitledEditorService = class UntitledEditorService extends lifecycle_1.Disposable {
        constructor(instantiationService, configurationService, fileService) {
            super();
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.fileService = fileService;
            this.mapResourceToInput = new map_1.ResourceMap();
            this.mapResourceToAssociatedFilePath = new map_1.ResourceMap();
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidChangeEncoding = this._register(new event_1.Emitter());
            this.onDidChangeEncoding = this._onDidChangeEncoding.event;
            this._onDidDisposeModel = this._register(new event_1.Emitter());
            this.onDidDisposeModel = this._onDidDisposeModel.event;
        }
        get(resource) {
            return this.mapResourceToInput.get(resource);
        }
        getAll(resources) {
            if (resources) {
                return arrays.coalesce(resources.map(r => this.get(r)));
            }
            return this.mapResourceToInput.values();
        }
        exists(resource) {
            return this.mapResourceToInput.has(resource);
        }
        revertAll(resources, force) {
            const reverted = [];
            const untitledInputs = this.getAll(resources);
            untitledInputs.forEach(input => {
                if (input) {
                    input.revert();
                    input.dispose();
                    reverted.push(input.getResource());
                }
            });
            return reverted;
        }
        isDirty(resource) {
            const input = this.get(resource);
            return input ? input.isDirty() : false;
        }
        hasBackup(resource) {
            const input = this.get(resource);
            return input ? input.hasBackup() : false;
        }
        getDirty(resources) {
            let inputs;
            if (resources) {
                inputs = arrays.coalesce(resources.map(r => this.get(r)));
            }
            else {
                inputs = this.mapResourceToInput.values();
            }
            return inputs
                .filter(i => i.isDirty())
                .map(i => i.getResource());
        }
        loadOrCreate(options = Object.create(null)) {
            return this.createOrGet(options.resource, options.mode, options.initialValue, options.encoding, options.useResourcePath).resolve();
        }
        createOrGet(resource, mode, initialValue, encoding, hasAssociatedFilePath = false) {
            if (resource) {
                // Massage resource if it comes with known file based resource
                if (this.fileService.canHandleResource(resource)) {
                    hasAssociatedFilePath = true;
                    resource = resource.with({ scheme: network_1.Schemas.untitled }); // ensure we have the right scheme
                }
                if (hasAssociatedFilePath) {
                    this.mapResourceToAssociatedFilePath.set(resource, true); // remember for future lookups
                }
            }
            // Return existing instance if asked for it
            if (resource && this.mapResourceToInput.has(resource)) {
                return this.mapResourceToInput.get(resource);
            }
            // Create new otherwise
            return this.doCreate(resource, hasAssociatedFilePath, mode, initialValue, encoding);
        }
        doCreate(resource, hasAssociatedFilePath, mode, initialValue, encoding) {
            let untitledResource;
            if (resource) {
                untitledResource = resource;
            }
            else {
                // Create new taking a resource URI that is not already taken
                let counter = this.mapResourceToInput.size + 1;
                do {
                    untitledResource = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: `Untitled-${counter}` });
                    counter++;
                } while (this.mapResourceToInput.has(untitledResource));
            }
            // Look up default language from settings if any
            if (!mode && !hasAssociatedFilePath) {
                const configuration = this.configurationService.getValue();
                if (configuration.files && configuration.files.defaultLanguage) {
                    mode = configuration.files.defaultLanguage;
                }
            }
            const input = this.instantiationService.createInstance(untitledEditorInput_1.UntitledEditorInput, untitledResource, hasAssociatedFilePath, mode, initialValue, encoding);
            const contentListener = input.onDidModelChangeContent(() => this._onDidChangeContent.fire(untitledResource));
            const dirtyListener = input.onDidChangeDirty(() => this._onDidChangeDirty.fire(untitledResource));
            const encodingListener = input.onDidModelChangeEncoding(() => this._onDidChangeEncoding.fire(untitledResource));
            const disposeListener = input.onDispose(() => this._onDidDisposeModel.fire(untitledResource));
            // Remove from cache on dispose
            const onceDispose = event_1.Event.once(input.onDispose);
            onceDispose(() => {
                this.mapResourceToInput.delete(input.getResource());
                this.mapResourceToAssociatedFilePath.delete(input.getResource());
                contentListener.dispose();
                dirtyListener.dispose();
                encodingListener.dispose();
                disposeListener.dispose();
            });
            // Add to cache
            this.mapResourceToInput.set(untitledResource, input);
            return input;
        }
        hasAssociatedFilePath(resource) {
            return this.mapResourceToAssociatedFilePath.has(resource);
        }
        suggestFileName(resource) {
            const input = this.get(resource);
            return input ? input.suggestFileName() : resources_1.basename(resource);
        }
        getEncoding(resource) {
            const input = this.get(resource);
            return input ? input.getEncoding() : undefined;
        }
    };
    UntitledEditorService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, files_1.IFileService)
    ], UntitledEditorService);
    exports.UntitledEditorService = UntitledEditorService;
    extensions_1.registerSingleton(exports.IUntitledEditorService, UntitledEditorService, true);
});
//# sourceMappingURL=untitledEditorService.js.map