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
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/services/textfile/common/textFileEditorModelManager", "vs/workbench/test/workbenchTestServices", "vs/workbench/services/textfile/common/textFileEditorModel", "vs/platform/files/common/files", "vs/editor/common/services/modelService", "vs/base/common/async", "vs/base/test/common/utils", "vs/editor/common/modes/modesRegistry"], function (require, exports, assert, uri_1, textFileEditorModelManager_1, workbenchTestServices_1, textFileEditorModel_1, files_1, modelService_1, async_1, utils_1, modesRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestTextFileEditorModelManager extends textFileEditorModelManager_1.TextFileEditorModelManager {
        debounceDelay() {
            return 10;
        }
    }
    exports.TestTextFileEditorModelManager = TestTextFileEditorModelManager;
    let ServiceAccessor = class ServiceAccessor {
        constructor(fileService, modelService) {
            this.fileService = fileService;
            this.modelService = modelService;
        }
    };
    ServiceAccessor = __decorate([
        __param(0, files_1.IFileService),
        __param(1, modelService_1.IModelService)
    ], ServiceAccessor);
    suite('Files - TextFileEditorModelManager', () => {
        let instantiationService;
        let accessor;
        setup(() => {
            instantiationService = workbenchTestServices_1.workbenchInstantiationService();
            accessor = instantiationService.createInstance(ServiceAccessor);
        });
        test('add, remove, clear, get, getAll', function () {
            const manager = instantiationService.createInstance(TestTextFileEditorModelManager);
            const model1 = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/random1.txt'), 'utf8', undefined);
            const model2 = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/random2.txt'), 'utf8', undefined);
            const model3 = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/random3.txt'), 'utf8', undefined);
            manager.add(uri_1.URI.file('/test.html'), model1);
            manager.add(uri_1.URI.file('/some/other.html'), model2);
            manager.add(uri_1.URI.file('/some/this.txt'), model3);
            const fileUpper = uri_1.URI.file('/TEST.html');
            assert(!manager.get(uri_1.URI.file('foo')));
            assert.strictEqual(manager.get(uri_1.URI.file('/test.html')), model1);
            assert.ok(!manager.get(fileUpper));
            let result = manager.getAll();
            assert.strictEqual(3, result.length);
            result = manager.getAll(uri_1.URI.file('/yes'));
            assert.strictEqual(0, result.length);
            result = manager.getAll(uri_1.URI.file('/some/other.txt'));
            assert.strictEqual(0, result.length);
            result = manager.getAll(uri_1.URI.file('/some/other.html'));
            assert.strictEqual(1, result.length);
            result = manager.getAll(fileUpper);
            assert.strictEqual(0, result.length);
            manager.remove(uri_1.URI.file(''));
            result = manager.getAll();
            assert.strictEqual(3, result.length);
            manager.remove(uri_1.URI.file('/some/other.html'));
            result = manager.getAll();
            assert.strictEqual(2, result.length);
            manager.remove(fileUpper);
            result = manager.getAll();
            assert.strictEqual(2, result.length);
            manager.clear();
            result = manager.getAll();
            assert.strictEqual(0, result.length);
            model1.dispose();
            model2.dispose();
            model3.dispose();
        });
        test('loadOrCreate', async () => {
            const manager = instantiationService.createInstance(TestTextFileEditorModelManager);
            const resource = uri_1.URI.file('/test.html');
            const encoding = 'utf8';
            const model = await manager.loadOrCreate(resource, { encoding });
            assert.ok(model);
            assert.equal(model.getEncoding(), encoding);
            assert.equal(manager.get(resource), model);
            const model2 = await manager.loadOrCreate(resource, { encoding });
            assert.equal(model2, model);
            model.dispose();
            const model3 = await manager.loadOrCreate(resource, { encoding });
            assert.notEqual(model3, model2);
            assert.equal(manager.get(resource), model3);
            model3.dispose();
        });
        test('removed from cache when model disposed', function () {
            const manager = instantiationService.createInstance(TestTextFileEditorModelManager);
            const model1 = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/random1.txt'), 'utf8', undefined);
            const model2 = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/random2.txt'), 'utf8', undefined);
            const model3 = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/random3.txt'), 'utf8', undefined);
            manager.add(uri_1.URI.file('/test.html'), model1);
            manager.add(uri_1.URI.file('/some/other.html'), model2);
            manager.add(uri_1.URI.file('/some/this.txt'), model3);
            assert.strictEqual(manager.get(uri_1.URI.file('/test.html')), model1);
            model1.dispose();
            assert(!manager.get(uri_1.URI.file('/test.html')));
            model2.dispose();
            model3.dispose();
        });
        test('events', async function () {
            textFileEditorModel_1.TextFileEditorModel.DEFAULT_CONTENT_CHANGE_BUFFER_DELAY = 0;
            textFileEditorModel_1.TextFileEditorModel.DEFAULT_ORPHANED_CHANGE_BUFFER_DELAY = 0;
            const manager = instantiationService.createInstance(TestTextFileEditorModelManager);
            const resource1 = utils_1.toResource.call(this, '/path/index.txt');
            const resource2 = utils_1.toResource.call(this, '/path/other.txt');
            let dirtyCounter = 0;
            let revertedCounter = 0;
            let savedCounter = 0;
            let encodingCounter = 0;
            let disposeCounter = 0;
            let contentCounter = 0;
            manager.onModelDirty(e => {
                if (e.resource.toString() === resource1.toString()) {
                    dirtyCounter++;
                }
            });
            manager.onModelReverted(e => {
                if (e.resource.toString() === resource1.toString()) {
                    revertedCounter++;
                }
            });
            manager.onModelSaved(e => {
                if (e.resource.toString() === resource1.toString()) {
                    savedCounter++;
                }
            });
            manager.onModelEncodingChanged(e => {
                if (e.resource.toString() === resource1.toString()) {
                    encodingCounter++;
                }
            });
            manager.onModelContentChanged(e => {
                if (e.resource.toString() === resource1.toString()) {
                    contentCounter++;
                }
            });
            manager.onModelDisposed(e => {
                disposeCounter++;
            });
            const model1 = await manager.loadOrCreate(resource1, { encoding: 'utf8' });
            accessor.fileService.fireFileChanges(new files_1.FileChangesEvent([{ resource: resource1, type: 2 /* DELETED */ }]));
            accessor.fileService.fireFileChanges(new files_1.FileChangesEvent([{ resource: resource1, type: 1 /* ADDED */ }]));
            const model2 = await manager.loadOrCreate(resource2, { encoding: 'utf8' });
            model1.textEditorModel.setValue('changed');
            model1.updatePreferredEncoding('utf16');
            await model1.revert();
            model1.textEditorModel.setValue('changed again');
            await model1.save();
            model1.dispose();
            model2.dispose();
            assert.equal(disposeCounter, 2);
            await model1.revert();
            assert.equal(dirtyCounter, 2);
            assert.equal(revertedCounter, 1);
            assert.equal(savedCounter, 1);
            assert.equal(encodingCounter, 2);
            await async_1.timeout(10);
            assert.equal(contentCounter, 2);
            model1.dispose();
            model2.dispose();
            assert.ok(!accessor.modelService.getModel(resource1));
            assert.ok(!accessor.modelService.getModel(resource2));
        });
        test('events debounced', async function () {
            const manager = instantiationService.createInstance(TestTextFileEditorModelManager);
            const resource1 = utils_1.toResource.call(this, '/path/index.txt');
            const resource2 = utils_1.toResource.call(this, '/path/other.txt');
            let dirtyCounter = 0;
            let revertedCounter = 0;
            let savedCounter = 0;
            textFileEditorModel_1.TextFileEditorModel.DEFAULT_CONTENT_CHANGE_BUFFER_DELAY = 0;
            manager.onModelsDirty(e => {
                dirtyCounter += e.length;
                assert.equal(e[0].resource.toString(), resource1.toString());
            });
            manager.onModelsReverted(e => {
                revertedCounter += e.length;
                assert.equal(e[0].resource.toString(), resource1.toString());
            });
            manager.onModelsSaved(e => {
                savedCounter += e.length;
                assert.equal(e[0].resource.toString(), resource1.toString());
            });
            const model1 = await manager.loadOrCreate(resource1, { encoding: 'utf8' });
            const model2 = await manager.loadOrCreate(resource2, { encoding: 'utf8' });
            model1.textEditorModel.setValue('changed');
            model1.updatePreferredEncoding('utf16');
            await model1.revert();
            model1.textEditorModel.setValue('changed again');
            await model1.save();
            model1.dispose();
            model2.dispose();
            await model1.revert();
            await async_1.timeout(20);
            assert.equal(dirtyCounter, 2);
            assert.equal(revertedCounter, 1);
            assert.equal(savedCounter, 1);
            model1.dispose();
            model2.dispose();
            assert.ok(!accessor.modelService.getModel(resource1));
            assert.ok(!accessor.modelService.getModel(resource2));
        });
        test('disposing model takes it out of the manager', async function () {
            const manager = instantiationService.createInstance(TestTextFileEditorModelManager);
            const resource = utils_1.toResource.call(this, '/path/index_something.txt');
            const model = await manager.loadOrCreate(resource, { encoding: 'utf8' });
            model.dispose();
            assert.ok(!manager.get(resource));
            assert.ok(!accessor.modelService.getModel(model.getResource()));
            manager.dispose();
        });
        test('dispose prevents dirty model from getting disposed', async function () {
            const manager = instantiationService.createInstance(TestTextFileEditorModelManager);
            const resource = utils_1.toResource.call(this, '/path/index_something.txt');
            const model = await manager.loadOrCreate(resource, { encoding: 'utf8' });
            model.textEditorModel.setValue('make dirty');
            manager.disposeModel(model);
            assert.ok(!model.isDisposed());
            model.revert(true);
            manager.disposeModel(model);
            assert.ok(model.isDisposed());
            manager.dispose();
        });
        test('mode', async function () {
            const mode = 'text-file-model-manager-test';
            modesRegistry_1.ModesRegistry.registerLanguage({
                id: mode,
            });
            const manager = instantiationService.createInstance(TestTextFileEditorModelManager);
            const resource = utils_1.toResource.call(this, '/path/index_something.txt');
            let model = await manager.loadOrCreate(resource, { mode });
            assert.equal(model.textEditorModel.getModeId(), mode);
            model = await manager.loadOrCreate(resource, { mode: 'text' });
            assert.equal(model.textEditorModel.getModeId(), modesRegistry_1.PLAINTEXT_MODE_ID);
            manager.disposeModel(model);
            manager.dispose();
        });
    });
});
//# sourceMappingURL=textFileEditorModelManager.test.js.map