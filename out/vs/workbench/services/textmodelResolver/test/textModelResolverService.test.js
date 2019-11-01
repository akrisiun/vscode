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
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/common/editor/resourceEditorInput", "vs/workbench/test/workbenchTestServices", "vs/base/test/common/utils", "vs/editor/common/services/resolverService", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/workbench/services/textfile/common/textFileEditorModel", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/untitled/common/untitledEditorService", "vs/base/common/event", "vs/base/common/async"], function (require, exports, assert, uri_1, resourceEditorInput_1, workbenchTestServices_1, utils_1, resolverService_1, modelService_1, modeService_1, textFileEditorModel_1, textfiles_1, untitledEditorService_1, event_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ServiceAccessor = class ServiceAccessor {
        constructor(textModelResolverService, modelService, modeService, textFileService, untitledEditorService) {
            this.textModelResolverService = textModelResolverService;
            this.modelService = modelService;
            this.modeService = modeService;
            this.textFileService = textFileService;
            this.untitledEditorService = untitledEditorService;
        }
    };
    ServiceAccessor = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, modelService_1.IModelService),
        __param(2, modeService_1.IModeService),
        __param(3, textfiles_1.ITextFileService),
        __param(4, untitledEditorService_1.IUntitledEditorService)
    ], ServiceAccessor);
    suite('Workbench - TextModelResolverService', () => {
        let instantiationService;
        let accessor;
        let model;
        setup(() => {
            instantiationService = workbenchTestServices_1.workbenchInstantiationService();
            accessor = instantiationService.createInstance(ServiceAccessor);
        });
        teardown(() => {
            if (model) {
                model.dispose();
                model = (undefined);
            }
            accessor.textFileService.models.clear();
            accessor.textFileService.models.dispose();
            accessor.untitledEditorService.revertAll();
        });
        test('resolve resource', async () => {
            const dispose = accessor.textModelResolverService.registerTextModelContentProvider('test', {
                provideTextContent: function (resource) {
                    if (resource.scheme === 'test') {
                        let modelContent = 'Hello Test';
                        let languageSelection = accessor.modeService.create('json');
                        return Promise.resolve(accessor.modelService.createModel(modelContent, languageSelection, resource));
                    }
                    return Promise.resolve(null);
                }
            });
            let resource = uri_1.URI.from({ scheme: 'test', authority: null, path: 'thePath' });
            let input = instantiationService.createInstance(resourceEditorInput_1.ResourceEditorInput, 'The Name', 'The Description', resource, undefined);
            const model = await input.resolve();
            assert.ok(model);
            assert.equal(textfiles_1.snapshotToString((model.createSnapshot())), 'Hello Test');
            let disposed = false;
            let disposedPromise = new Promise(resolve => {
                event_1.Event.once(model.onDispose)(() => {
                    disposed = true;
                    resolve();
                });
            });
            input.dispose();
            await disposedPromise;
            assert.equal(disposed, true);
            dispose.dispose();
        });
        test('resolve file', async function () {
            const textModel = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file_resolver.txt'), 'utf8', undefined);
            accessor.textFileService.models.add(textModel.getResource(), textModel);
            await textModel.load();
            const ref = await accessor.textModelResolverService.createModelReference(textModel.getResource());
            const model = ref.object;
            const editorModel = model.textEditorModel;
            assert.ok(editorModel);
            assert.equal(editorModel.getValue(), 'Hello Html');
            let disposed = false;
            event_1.Event.once(model.onDispose)(() => {
                disposed = true;
            });
            ref.dispose();
            await async_1.timeout(0); // due to the reference resolving the model first which is async
            assert.equal(disposed, true);
        });
        test('resolve untitled', async () => {
            const service = accessor.untitledEditorService;
            const input = service.createOrGet();
            await input.resolve();
            const ref = await accessor.textModelResolverService.createModelReference(input.getResource());
            const model = ref.object;
            const editorModel = model.textEditorModel;
            assert.ok(editorModel);
            ref.dispose();
            input.dispose();
        });
        test('even loading documents should be refcounted', async () => {
            let resolveModel;
            let waitForIt = new Promise(c => resolveModel = c);
            const disposable = accessor.textModelResolverService.registerTextModelContentProvider('test', {
                provideTextContent: async (resource) => {
                    await waitForIt;
                    let modelContent = 'Hello Test';
                    let languageSelection = accessor.modeService.create('json');
                    return accessor.modelService.createModel(modelContent, languageSelection, resource);
                }
            });
            const uri = uri_1.URI.from({ scheme: 'test', authority: null, path: 'thePath' });
            const modelRefPromise1 = accessor.textModelResolverService.createModelReference(uri);
            const modelRefPromise2 = accessor.textModelResolverService.createModelReference(uri);
            resolveModel();
            const modelRef1 = await modelRefPromise1;
            const model1 = modelRef1.object;
            const modelRef2 = await modelRefPromise2;
            const model2 = modelRef2.object;
            const textModel = model1.textEditorModel;
            assert.equal(model1, model2, 'they are the same model');
            assert(!textModel.isDisposed(), 'the text model should not be disposed');
            modelRef1.dispose();
            assert(!textModel.isDisposed(), 'the text model should still not be disposed');
            let p1 = new Promise(resolve => textModel.onWillDispose(resolve));
            modelRef2.dispose();
            await p1;
            assert(textModel.isDisposed(), 'the text model should finally be disposed');
            disposable.dispose();
        });
    });
});
//# sourceMappingURL=textModelResolverService.test.js.map