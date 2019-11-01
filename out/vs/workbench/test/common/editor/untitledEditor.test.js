var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/uri", "assert", "vs/base/common/path", "vs/workbench/services/untitled/common/untitledEditorService", "vs/platform/configuration/common/configuration", "vs/workbench/test/workbenchTestServices", "vs/workbench/common/editor/untitledEditorModel", "vs/editor/common/services/modeService", "vs/base/common/async", "vs/workbench/services/textfile/common/textfiles", "vs/editor/common/modes/modesRegistry"], function (require, exports, uri_1, assert, path_1, untitledEditorService_1, configuration_1, workbenchTestServices_1, untitledEditorModel_1, modeService_1, async_1, textfiles_1, modesRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestUntitledEditorService extends untitledEditorService_1.UntitledEditorService {
        get(resource) { return super.get(resource); }
        getAll(resources) { return super.getAll(resources); }
    }
    exports.TestUntitledEditorService = TestUntitledEditorService;
    let ServiceAccessor = class ServiceAccessor {
        constructor(untitledEditorService, modeService, testConfigurationService) {
            this.untitledEditorService = untitledEditorService;
            this.modeService = modeService;
            this.testConfigurationService = testConfigurationService;
        }
    };
    ServiceAccessor = __decorate([
        __param(0, untitledEditorService_1.IUntitledEditorService),
        __param(1, modeService_1.IModeService),
        __param(2, configuration_1.IConfigurationService)
    ], ServiceAccessor);
    suite('Workbench untitled editors', () => {
        let instantiationService;
        let accessor;
        setup(() => {
            instantiationService = workbenchTestServices_1.workbenchInstantiationService();
            accessor = instantiationService.createInstance(ServiceAccessor);
        });
        teardown(() => {
            accessor.untitledEditorService.revertAll();
            accessor.untitledEditorService.dispose();
        });
        test('Untitled Editor Service', async (done) => {
            const service = accessor.untitledEditorService;
            assert.equal(service.getAll().length, 0);
            const input1 = service.createOrGet();
            assert.equal(input1, service.createOrGet(input1.getResource()));
            assert.ok(service.exists(input1.getResource()));
            assert.ok(!service.exists(uri_1.URI.file('testing')));
            const input2 = service.createOrGet();
            // get() / getAll()
            assert.equal(service.get(input1.getResource()), input1);
            assert.equal(service.getAll().length, 2);
            assert.equal(service.getAll([input1.getResource(), input2.getResource()]).length, 2);
            // revertAll()
            service.revertAll([input1.getResource()]);
            assert.ok(input1.isDisposed());
            assert.equal(service.getAll().length, 1);
            // dirty
            const model = await input2.resolve();
            assert.ok(!service.isDirty(input2.getResource()));
            const listener = service.onDidChangeDirty(resource => {
                listener.dispose();
                assert.equal(resource.toString(), input2.getResource().toString());
                assert.ok(service.isDirty(input2.getResource()));
                assert.equal(service.getDirty()[0].toString(), input2.getResource().toString());
                assert.equal(service.getDirty([input2.getResource()])[0].toString(), input2.getResource().toString());
                assert.equal(service.getDirty([input1.getResource()]).length, 0);
                service.revertAll();
                assert.equal(service.getAll().length, 0);
                assert.ok(!input2.isDirty());
                assert.ok(!model.isDirty());
                input2.dispose();
                assert.ok(!service.exists(input2.getResource()));
                done();
            });
            model.textEditorModel.setValue('foo bar');
        });
        test('Untitled with associated resource', () => {
            const service = accessor.untitledEditorService;
            const file = uri_1.URI.file(path_1.join('C:\\', '/foo/file.txt'));
            const untitled = service.createOrGet(file);
            assert.ok(service.hasAssociatedFilePath(untitled.getResource()));
            untitled.dispose();
        });
        test('Untitled no longer dirty when content gets empty', async () => {
            const service = accessor.untitledEditorService;
            const input = service.createOrGet();
            // dirty
            const model = await input.resolve();
            model.textEditorModel.setValue('foo bar');
            assert.ok(model.isDirty());
            model.textEditorModel.setValue('');
            assert.ok(!model.isDirty());
            input.dispose();
        });
        test('Untitled via loadOrCreate', async () => {
            const service = accessor.untitledEditorService;
            const model1 = await service.loadOrCreate();
            model1.textEditorModel.setValue('foo bar');
            assert.ok(model1.isDirty());
            model1.textEditorModel.setValue('');
            assert.ok(!model1.isDirty());
            const model2 = await service.loadOrCreate({ initialValue: 'Hello World' });
            assert.equal(textfiles_1.snapshotToString(model2.createSnapshot()), 'Hello World');
            const input = service.createOrGet();
            const model3 = await service.loadOrCreate({ resource: input.getResource() });
            assert.equal(model3.getResource().toString(), input.getResource().toString());
            const file = uri_1.URI.file(path_1.join('C:\\', '/foo/file44.txt'));
            const model4 = await service.loadOrCreate({ resource: file });
            assert.ok(service.hasAssociatedFilePath(model4.getResource()));
            assert.ok(model4.isDirty());
            model1.dispose();
            model2.dispose();
            model3.dispose();
            model4.dispose();
            input.dispose();
        });
        test('Untitled suggest name', function () {
            const service = accessor.untitledEditorService;
            const input = service.createOrGet();
            assert.ok(service.suggestFileName(input.getResource()));
        });
        test('Untitled with associated path remains dirty when content gets empty', async () => {
            const service = accessor.untitledEditorService;
            const file = uri_1.URI.file(path_1.join('C:\\', '/foo/file.txt'));
            const input = service.createOrGet(file);
            // dirty
            const model = await input.resolve();
            model.textEditorModel.setValue('foo bar');
            assert.ok(model.isDirty());
            model.textEditorModel.setValue('');
            assert.ok(model.isDirty());
            input.dispose();
        });
        test('Untitled with initial content is dirty', async () => {
            const service = accessor.untitledEditorService;
            const input = service.createOrGet(undefined, undefined, 'Hello World');
            // dirty
            const model = await input.resolve();
            assert.ok(model.isDirty());
            input.dispose();
        });
        test('Untitled created with files.defaultLanguage setting', () => {
            const defaultLanguage = 'javascript';
            const config = accessor.testConfigurationService;
            config.setUserConfiguration('files', { 'defaultLanguage': defaultLanguage });
            const service = accessor.untitledEditorService;
            const input = service.createOrGet();
            assert.equal(input.getMode(), defaultLanguage);
            config.setUserConfiguration('files', { 'defaultLanguage': undefined });
            input.dispose();
        });
        test('Untitled created with mode overrides files.defaultLanguage setting', () => {
            const mode = 'typescript';
            const defaultLanguage = 'javascript';
            const config = accessor.testConfigurationService;
            config.setUserConfiguration('files', { 'defaultLanguage': defaultLanguage });
            const service = accessor.untitledEditorService;
            const input = service.createOrGet(null, mode);
            assert.equal(input.getMode(), mode);
            config.setUserConfiguration('files', { 'defaultLanguage': undefined });
            input.dispose();
        });
        test('Untitled can change mode afterwards', async () => {
            const mode = 'untitled-input-test';
            modesRegistry_1.ModesRegistry.registerLanguage({
                id: mode,
            });
            const service = accessor.untitledEditorService;
            const input = service.createOrGet(null, mode);
            assert.equal(input.getMode(), mode);
            const model = await input.resolve();
            assert.equal(model.getMode(), mode);
            input.setMode('text');
            assert.equal(input.getMode(), modesRegistry_1.PLAINTEXT_MODE_ID);
            input.dispose();
        });
        test('encoding change event', async () => {
            const service = accessor.untitledEditorService;
            const input = service.createOrGet();
            let counter = 0;
            service.onDidChangeEncoding(r => {
                counter++;
                assert.equal(r.toString(), input.getResource().toString());
            });
            // dirty
            const model = await input.resolve();
            model.setEncoding('utf16');
            assert.equal(counter, 1);
            input.dispose();
        });
        test('onDidChangeContent event', async () => {
            const service = accessor.untitledEditorService;
            const input = service.createOrGet();
            untitledEditorModel_1.UntitledEditorModel.DEFAULT_CONTENT_CHANGE_BUFFER_DELAY = 0;
            let counter = 0;
            service.onDidChangeContent(r => {
                counter++;
                assert.equal(r.toString(), input.getResource().toString());
            });
            const model = await input.resolve();
            model.textEditorModel.setValue('foo');
            assert.equal(counter, 0, 'Dirty model should not trigger event immediately');
            await async_1.timeout(3);
            assert.equal(counter, 1, 'Dirty model should trigger event');
            model.textEditorModel.setValue('bar');
            await async_1.timeout(3);
            assert.equal(counter, 2, 'Content change when dirty should trigger event');
            model.textEditorModel.setValue('');
            await async_1.timeout(3);
            assert.equal(counter, 3, 'Manual revert should trigger event');
            model.textEditorModel.setValue('foo');
            await async_1.timeout(3);
            assert.equal(counter, 4, 'Dirty model should trigger event');
            model.revert();
            await async_1.timeout(3);
            assert.equal(counter, 5, 'Revert should trigger event');
            input.dispose();
        });
        test('onDidDisposeModel event', async () => {
            const service = accessor.untitledEditorService;
            const input = service.createOrGet();
            let counter = 0;
            service.onDidDisposeModel(r => {
                counter++;
                assert.equal(r.toString(), input.getResource().toString());
            });
            await input.resolve();
            assert.equal(counter, 0);
            input.dispose();
            assert.equal(counter, 1);
        });
    });
});
//# sourceMappingURL=untitledEditor.test.js.map