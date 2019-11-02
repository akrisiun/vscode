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
define(["require", "exports", "vs/base/common/event", "vs/workbench/services/textfile/common/textFileEditorModel", "vs/base/common/lifecycle", "vs/workbench/services/textfile/common/textfiles", "vs/platform/lifecycle/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/base/common/map"], function (require, exports, event_1, textFileEditorModel_1, lifecycle_1, textfiles_1, lifecycle_2, instantiation_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TextFileEditorModelManager = class TextFileEditorModelManager extends lifecycle_1.Disposable {
        constructor(lifecycleService, instantiationService) {
            super();
            this.lifecycleService = lifecycleService;
            this.instantiationService = instantiationService;
            this._onModelDisposed = this._register(new event_1.Emitter());
            this.onModelDisposed = this._onModelDisposed.event;
            this._onModelContentChanged = this._register(new event_1.Emitter());
            this.onModelContentChanged = this._onModelContentChanged.event;
            this._onModelDirty = this._register(new event_1.Emitter());
            this.onModelDirty = this._onModelDirty.event;
            this._onModelSaveError = this._register(new event_1.Emitter());
            this.onModelSaveError = this._onModelSaveError.event;
            this._onModelSaved = this._register(new event_1.Emitter());
            this.onModelSaved = this._onModelSaved.event;
            this._onModelReverted = this._register(new event_1.Emitter());
            this.onModelReverted = this._onModelReverted.event;
            this._onModelEncodingChanged = this._register(new event_1.Emitter());
            this.onModelEncodingChanged = this._onModelEncodingChanged.event;
            this._onModelOrphanedChanged = this._register(new event_1.Emitter());
            this.onModelOrphanedChanged = this._onModelOrphanedChanged.event;
            this.mapResourceToDisposeListener = new map_1.ResourceMap();
            this.mapResourceToStateChangeListener = new map_1.ResourceMap();
            this.mapResourceToModelContentChangeListener = new map_1.ResourceMap();
            this.mapResourceToModel = new map_1.ResourceMap();
            this.mapResourceToPendingModelLoaders = new map_1.ResourceMap();
            this.registerListeners();
        }
        get onModelsDirty() {
            if (!this._onModelsDirty) {
                this._onModelsDirty = this.debounce(this.onModelDirty);
            }
            return this._onModelsDirty;
        }
        get onModelsSaveError() {
            if (!this._onModelsSaveError) {
                this._onModelsSaveError = this.debounce(this.onModelSaveError);
            }
            return this._onModelsSaveError;
        }
        get onModelsSaved() {
            if (!this._onModelsSaved) {
                this._onModelsSaved = this.debounce(this.onModelSaved);
            }
            return this._onModelsSaved;
        }
        get onModelsReverted() {
            if (!this._onModelsReverted) {
                this._onModelsReverted = this.debounce(this.onModelReverted);
            }
            return this._onModelsReverted;
        }
        registerListeners() {
            // Lifecycle
            this.lifecycleService.onShutdown(this.dispose, this);
        }
        debounce(event) {
            return event_1.Event.debounce(event, (prev, cur) => {
                if (!prev) {
                    prev = [cur];
                }
                else {
                    prev.push(cur);
                }
                return prev;
            }, this.debounceDelay());
        }
        debounceDelay() {
            return 250;
        }
        get(resource) {
            return this.mapResourceToModel.get(resource);
        }
        async loadOrCreate(resource, options) {
            var _a, _b;
            // Return early if model is currently being loaded
            const pendingLoad = this.mapResourceToPendingModelLoaders.get(resource);
            if (pendingLoad) {
                return pendingLoad;
            }
            let modelPromise;
            // Model exists
            let model = this.get(resource);
            if (model) {
                if ((_a = options) === null || _a === void 0 ? void 0 : _a.reload) {
                    // async reload: trigger a reload but return immediately
                    if (options.reload.async) {
                        modelPromise = Promise.resolve(model);
                        model.load(options);
                    }
                    // sync reload: do not return until model reloaded
                    else {
                        modelPromise = model.load(options);
                    }
                }
                else {
                    modelPromise = Promise.resolve(model);
                }
            }
            // Model does not exist
            else {
                const newModel = model = this.instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, resource, options ? options.encoding : undefined, options ? options.mode : undefined);
                modelPromise = model.load(options);
                // Install state change listener
                this.mapResourceToStateChangeListener.set(resource, model.onDidStateChange(state => {
                    const event = new textfiles_1.TextFileModelChangeEvent(newModel, state);
                    switch (state) {
                        case 0 /* DIRTY */:
                            this._onModelDirty.fire(event);
                            break;
                        case 2 /* SAVE_ERROR */:
                            this._onModelSaveError.fire(event);
                            break;
                        case 3 /* SAVED */:
                            this._onModelSaved.fire(event);
                            break;
                        case 4 /* REVERTED */:
                            this._onModelReverted.fire(event);
                            break;
                        case 5 /* ENCODING */:
                            this._onModelEncodingChanged.fire(event);
                            break;
                        case 7 /* ORPHANED_CHANGE */:
                            this._onModelOrphanedChanged.fire(event);
                            break;
                    }
                }));
                // Install model content change listener
                this.mapResourceToModelContentChangeListener.set(resource, model.onDidContentChange(e => {
                    this._onModelContentChanged.fire(new textfiles_1.TextFileModelChangeEvent(newModel, e));
                }));
            }
            // Store pending loads to avoid race conditions
            this.mapResourceToPendingModelLoaders.set(resource, modelPromise);
            try {
                const resolvedModel = await modelPromise;
                // Make known to manager (if not already known)
                this.add(resource, resolvedModel);
                // Model can be dirty if a backup was restored, so we make sure to have this event delivered
                if (resolvedModel.isDirty()) {
                    this._onModelDirty.fire(new textfiles_1.TextFileModelChangeEvent(resolvedModel, 0 /* DIRTY */));
                }
                // Remove from pending loads
                this.mapResourceToPendingModelLoaders.delete(resource);
                // Apply mode if provided
                if ((_b = options) === null || _b === void 0 ? void 0 : _b.mode) {
                    resolvedModel.setMode(options.mode);
                }
                return resolvedModel;
            }
            catch (error) {
                // Free resources of this invalid model
                if (model) {
                    model.dispose();
                }
                // Remove from pending loads
                this.mapResourceToPendingModelLoaders.delete(resource);
                throw error;
            }
        }
        getAll(resource, filter) {
            if (resource) {
                const res = this.mapResourceToModel.get(resource);
                return res ? [res] : [];
            }
            const res = [];
            this.mapResourceToModel.forEach(model => {
                if (!filter || filter(model)) {
                    res.push(model);
                }
            });
            return res;
        }
        add(resource, model) {
            const knownModel = this.mapResourceToModel.get(resource);
            if (knownModel === model) {
                return; // already cached
            }
            // dispose any previously stored dispose listener for this resource
            const disposeListener = this.mapResourceToDisposeListener.get(resource);
            if (disposeListener) {
                disposeListener.dispose();
            }
            // store in cache but remove when model gets disposed
            this.mapResourceToModel.set(resource, model);
            this.mapResourceToDisposeListener.set(resource, model.onDispose(() => {
                this.remove(resource);
                this._onModelDisposed.fire(resource);
            }));
        }
        remove(resource) {
            this.mapResourceToModel.delete(resource);
            const disposeListener = this.mapResourceToDisposeListener.get(resource);
            if (disposeListener) {
                lifecycle_1.dispose(disposeListener);
                this.mapResourceToDisposeListener.delete(resource);
            }
            const stateChangeListener = this.mapResourceToStateChangeListener.get(resource);
            if (stateChangeListener) {
                lifecycle_1.dispose(stateChangeListener);
                this.mapResourceToStateChangeListener.delete(resource);
            }
            const modelContentChangeListener = this.mapResourceToModelContentChangeListener.get(resource);
            if (modelContentChangeListener) {
                lifecycle_1.dispose(modelContentChangeListener);
                this.mapResourceToModelContentChangeListener.delete(resource);
            }
        }
        clear() {
            // model caches
            this.mapResourceToModel.clear();
            this.mapResourceToPendingModelLoaders.clear();
            // dispose dispose listeners
            this.mapResourceToDisposeListener.forEach(l => l.dispose());
            this.mapResourceToDisposeListener.clear();
            // dispose state change listeners
            this.mapResourceToStateChangeListener.forEach(l => l.dispose());
            this.mapResourceToStateChangeListener.clear();
            // dispose model content change listeners
            this.mapResourceToModelContentChangeListener.forEach(l => l.dispose());
            this.mapResourceToModelContentChangeListener.clear();
        }
        disposeModel(model) {
            if (!model) {
                return; // we need data!
            }
            if (model.isDisposed()) {
                return; // already disposed
            }
            if (this.mapResourceToPendingModelLoaders.has(model.getResource())) {
                return; // not yet loaded
            }
            if (model.isDirty()) {
                return; // not saved
            }
            model.dispose();
        }
        dispose() {
            super.dispose();
            this.clear();
        }
    };
    TextFileEditorModelManager = __decorate([
        __param(0, lifecycle_2.ILifecycleService),
        __param(1, instantiation_1.IInstantiationService)
    ], TextFileEditorModelManager);
    exports.TextFileEditorModelManager = TextFileEditorModelManager;
});
//# sourceMappingURL=textFileEditorModelManager.js.map