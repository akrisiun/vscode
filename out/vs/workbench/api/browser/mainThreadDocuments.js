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
define(["require", "exports", "vs/base/common/errorMessage", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uri", "vs/editor/common/services/modeService", "vs/editor/common/services/modelService", "vs/editor/common/services/resolverService", "vs/platform/files/common/files", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/untitled/common/untitledEditorService", "vs/workbench/services/environment/common/environmentService", "vs/base/common/resources"], function (require, exports, errorMessage_1, lifecycle_1, network_1, uri_1, modeService_1, modelService_1, resolverService_1, files_1, extHost_protocol_1, textfiles_1, untitledEditorService_1, environmentService_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BoundModelReferenceCollection {
        constructor(_maxAge = 1000 * 60 * 3, _maxLength = 1024 * 1024 * 80) {
            this._maxAge = _maxAge;
            this._maxLength = _maxLength;
            this._data = new Array();
            this._length = 0;
            //
        }
        dispose() {
            this._data = lifecycle_1.dispose(this._data);
        }
        add(ref) {
            const length = ref.object.textEditorModel.getValueLength();
            let handle;
            let entry;
            const dispose = () => {
                const idx = this._data.indexOf(entry);
                if (idx >= 0) {
                    this._length -= length;
                    ref.dispose();
                    clearTimeout(handle);
                    this._data.splice(idx, 1);
                }
            };
            handle = setTimeout(dispose, this._maxAge);
            entry = { length, dispose };
            this._data.push(entry);
            this._length += length;
            this._cleanup();
        }
        _cleanup() {
            while (this._length > this._maxLength) {
                this._data[0].dispose();
            }
        }
    }
    exports.BoundModelReferenceCollection = BoundModelReferenceCollection;
    let MainThreadDocuments = class MainThreadDocuments {
        constructor(documentsAndEditors, extHostContext, modelService, modeService, textFileService, fileService, textModelResolverService, untitledEditorService, environmentService) {
            this._toDispose = new lifecycle_1.DisposableStore();
            this._modelIsSynced = new Set();
            this._modelReferenceCollection = new BoundModelReferenceCollection();
            this._modelService = modelService;
            this._textModelResolverService = textModelResolverService;
            this._textFileService = textFileService;
            this._fileService = fileService;
            this._untitledEditorService = untitledEditorService;
            this._environmentService = environmentService;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostDocuments);
            this._toDispose.add(documentsAndEditors.onDocumentAdd(models => models.forEach(this._onModelAdded, this)));
            this._toDispose.add(documentsAndEditors.onDocumentRemove(urls => urls.forEach(this._onModelRemoved, this)));
            this._toDispose.add(this._modelReferenceCollection);
            this._toDispose.add(modelService.onModelModeChanged(this._onModelModeChanged, this));
            this._toDispose.add(textFileService.models.onModelSaved(e => {
                if (this._shouldHandleFileEvent(e)) {
                    this._proxy.$acceptModelSaved(e.resource);
                }
            }));
            this._toDispose.add(textFileService.models.onModelReverted(e => {
                if (this._shouldHandleFileEvent(e)) {
                    this._proxy.$acceptDirtyStateChanged(e.resource, false);
                }
            }));
            this._toDispose.add(textFileService.models.onModelDirty(e => {
                if (this._shouldHandleFileEvent(e)) {
                    this._proxy.$acceptDirtyStateChanged(e.resource, true);
                }
            }));
            this._modelToDisposeMap = Object.create(null);
        }
        dispose() {
            Object.keys(this._modelToDisposeMap).forEach((modelUrl) => {
                this._modelToDisposeMap[modelUrl].dispose();
            });
            this._modelToDisposeMap = Object.create(null);
            this._toDispose.dispose();
        }
        _shouldHandleFileEvent(e) {
            const model = this._modelService.getModel(e.resource);
            return !!model && modelService_1.shouldSynchronizeModel(model);
        }
        _onModelAdded(model) {
            // Same filter as in mainThreadEditorsTracker
            if (!modelService_1.shouldSynchronizeModel(model)) {
                // don't synchronize too large models
                return;
            }
            const modelUrl = model.uri;
            this._modelIsSynced.add(modelUrl.toString());
            this._modelToDisposeMap[modelUrl.toString()] = model.onDidChangeContent((e) => {
                this._proxy.$acceptModelChanged(modelUrl, e, this._textFileService.isDirty(modelUrl));
            });
        }
        _onModelModeChanged(event) {
            let { model, oldModeId } = event;
            const modelUrl = model.uri;
            if (!this._modelIsSynced.has(modelUrl.toString())) {
                return;
            }
            this._proxy.$acceptModelModeChanged(model.uri, oldModeId, model.getLanguageIdentifier().language);
        }
        _onModelRemoved(modelUrl) {
            const strModelUrl = modelUrl.toString();
            if (!this._modelIsSynced.has(strModelUrl)) {
                return;
            }
            this._modelIsSynced.delete(strModelUrl);
            this._modelToDisposeMap[strModelUrl].dispose();
            delete this._modelToDisposeMap[strModelUrl];
        }
        // --- from extension host process
        $trySaveDocument(uri) {
            return this._textFileService.save(uri_1.URI.revive(uri));
        }
        $tryOpenDocument(_uri) {
            const uri = uri_1.URI.revive(_uri);
            if (!uri.scheme || !(uri.fsPath || uri.authority)) {
                return Promise.reject(new Error(`Invalid uri. Scheme and authority or path must be set.`));
            }
            let promise;
            switch (uri.scheme) {
                case network_1.Schemas.untitled:
                    promise = this._handleUntitledScheme(uri);
                    break;
                case network_1.Schemas.file:
                default:
                    promise = this._handleAsResourceInput(uri);
                    break;
            }
            return promise.then(success => {
                if (!success) {
                    return Promise.reject(new Error('cannot open ' + uri.toString()));
                }
                else if (!this._modelIsSynced.has(uri.toString())) {
                    return Promise.reject(new Error('cannot open ' + uri.toString() + '. Detail: Files above 50MB cannot be synchronized with extensions.'));
                }
                else {
                    return undefined;
                }
            }, err => {
                return Promise.reject(new Error('cannot open ' + uri.toString() + '. Detail: ' + errorMessage_1.toErrorMessage(err)));
            });
        }
        $tryCreateDocument(options) {
            return this._doCreateUntitled(undefined, options ? options.language : undefined, options ? options.content : undefined);
        }
        _handleAsResourceInput(uri) {
            return this._textModelResolverService.createModelReference(uri).then(ref => {
                this._modelReferenceCollection.add(ref);
                const result = !!ref.object;
                return result;
            });
        }
        _handleUntitledScheme(uri) {
            const asLocalUri = resources_1.toLocalResource(uri, this._environmentService.configuration.remoteAuthority);
            return this._fileService.resolve(asLocalUri).then(stats => {
                // don't create a new file ontop of an existing file
                return Promise.reject(new Error('file already exists'));
            }, err => {
                return this._doCreateUntitled(uri).then(resource => !!resource);
            });
        }
        _doCreateUntitled(resource, mode, initialValue) {
            return this._untitledEditorService.loadOrCreate({
                resource,
                mode,
                initialValue,
                useResourcePath: Boolean(resource && resource.path)
            }).then(model => {
                const resource = model.getResource();
                if (!this._modelIsSynced.has(resource.toString())) {
                    throw new Error(`expected URI ${resource.toString()} to have come to LIFE`);
                }
                this._proxy.$acceptDirtyStateChanged(resource, true); // mark as dirty
                return resource;
            });
        }
    };
    MainThreadDocuments = __decorate([
        __param(2, modelService_1.IModelService),
        __param(3, modeService_1.IModeService),
        __param(4, textfiles_1.ITextFileService),
        __param(5, files_1.IFileService),
        __param(6, resolverService_1.ITextModelService),
        __param(7, untitledEditorService_1.IUntitledEditorService),
        __param(8, environmentService_1.IWorkbenchEnvironmentService)
    ], MainThreadDocuments);
    exports.MainThreadDocuments = MainThreadDocuments;
});
//# sourceMappingURL=mainThreadDocuments.js.map