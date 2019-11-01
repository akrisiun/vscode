var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "assert", "sinon", "vs/base/common/platform", "vs/base/common/uri", "vs/platform/lifecycle/common/lifecycle", "vs/workbench/test/workbenchTestServices", "vs/base/test/common/utils", "vs/workbench/services/textfile/common/textFileEditorModel", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/untitled/common/untitledEditorService", "vs/platform/files/common/files", "vs/platform/workspace/common/workspace", "vs/editor/common/services/modelService", "vs/base/common/network", "vs/platform/electron/node/electron"], function (require, exports, assert, sinon, platform, uri_1, lifecycle_1, workbenchTestServices_1, utils_1, textFileEditorModel_1, textfiles_1, untitledEditorService_1, files_1, workspace_1, modelService_1, network_1, electron_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ServiceAccessor = class ServiceAccessor {
        constructor(lifecycleService, textFileService, untitledEditorService, contextService, modelService, fileService, electronService) {
            this.lifecycleService = lifecycleService;
            this.textFileService = textFileService;
            this.untitledEditorService = untitledEditorService;
            this.contextService = contextService;
            this.modelService = modelService;
            this.fileService = fileService;
            this.electronService = electronService;
        }
    };
    ServiceAccessor = __decorate([
        __param(0, lifecycle_1.ILifecycleService),
        __param(1, textfiles_1.ITextFileService),
        __param(2, untitledEditorService_1.IUntitledEditorService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, modelService_1.IModelService),
        __param(5, files_1.IFileService),
        __param(6, electron_1.IElectronService)
    ], ServiceAccessor);
    class BeforeShutdownEventImpl {
        constructor() {
            this.reason = 1 /* CLOSE */;
        }
        veto(value) {
            this.value = value;
        }
    }
    suite('Files - TextFileService', () => {
        let instantiationService;
        let model;
        let accessor;
        setup(() => {
            instantiationService = workbenchTestServices_1.workbenchInstantiationService();
            accessor = instantiationService.createInstance(ServiceAccessor);
        });
        teardown(() => {
            if (model) {
                model.dispose();
            }
            accessor.textFileService.models.clear();
            accessor.textFileService.models.dispose();
            accessor.untitledEditorService.revertAll();
        });
        test('confirm onWillShutdown - no veto', async function () {
            model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined);
            accessor.textFileService.models.add(model.getResource(), model);
            const event = new BeforeShutdownEventImpl();
            accessor.lifecycleService.fireWillShutdown(event);
            const veto = event.value;
            if (typeof veto === 'boolean') {
                assert.ok(!veto);
            }
            else {
                assert.ok(!(await veto));
            }
        });
        test('confirm onWillShutdown - veto if user cancels', async function () {
            model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined);
            accessor.textFileService.models.add(model.getResource(), model);
            const service = accessor.textFileService;
            service.setConfirmResult(2 /* CANCEL */);
            await model.load();
            model.textEditorModel.setValue('foo');
            assert.equal(service.getDirty().length, 1);
            const event = new BeforeShutdownEventImpl();
            accessor.lifecycleService.fireWillShutdown(event);
            assert.ok(event.value);
        });
        test('confirm onWillShutdown - no veto and backups cleaned up if user does not want to save (hot.exit: off)', async function () {
            model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined);
            accessor.textFileService.models.add(model.getResource(), model);
            const service = accessor.textFileService;
            service.setConfirmResult(1 /* DONT_SAVE */);
            service.onFilesConfigurationChange({ files: { hotExit: 'off' } });
            await model.load();
            model.textEditorModel.setValue('foo');
            assert.equal(service.getDirty().length, 1);
            const event = new BeforeShutdownEventImpl();
            accessor.lifecycleService.fireWillShutdown(event);
            let veto = event.value;
            if (typeof veto === 'boolean') {
                assert.ok(service.cleanupBackupsBeforeShutdownCalled);
                assert.ok(!veto);
                return;
            }
            veto = await veto;
            assert.ok(service.cleanupBackupsBeforeShutdownCalled);
            assert.ok(!veto);
        });
        test('confirm onWillShutdown - save (hot.exit: off)', async function () {
            model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined);
            accessor.textFileService.models.add(model.getResource(), model);
            const service = accessor.textFileService;
            service.setConfirmResult(0 /* SAVE */);
            service.onFilesConfigurationChange({ files: { hotExit: 'off' } });
            await model.load();
            model.textEditorModel.setValue('foo');
            assert.equal(service.getDirty().length, 1);
            const event = new BeforeShutdownEventImpl();
            accessor.lifecycleService.fireWillShutdown(event);
            const veto = await event.value;
            assert.ok(!veto);
            assert.ok(!model.isDirty());
        });
        test('isDirty/getDirty - files and untitled', async function () {
            model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined);
            accessor.textFileService.models.add(model.getResource(), model);
            const service = accessor.textFileService;
            await model.load();
            assert.ok(!service.isDirty(model.getResource()));
            model.textEditorModel.setValue('foo');
            assert.ok(service.isDirty(model.getResource()));
            assert.equal(service.getDirty().length, 1);
            assert.equal(service.getDirty([model.getResource()])[0].toString(), model.getResource().toString());
            const untitled = accessor.untitledEditorService.createOrGet();
            const untitledModel = await untitled.resolve();
            assert.ok(!service.isDirty(untitled.getResource()));
            assert.equal(service.getDirty().length, 1);
            untitledModel.textEditorModel.setValue('changed');
            assert.ok(service.isDirty(untitled.getResource()));
            assert.equal(service.getDirty().length, 2);
            assert.equal(service.getDirty([untitled.getResource()])[0].toString(), untitled.getResource().toString());
        });
        test('save - file', async function () {
            model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined);
            accessor.textFileService.models.add(model.getResource(), model);
            const service = accessor.textFileService;
            await model.load();
            model.textEditorModel.setValue('foo');
            assert.ok(service.isDirty(model.getResource()));
            const res = await service.save(model.getResource());
            assert.ok(res);
            assert.ok(!service.isDirty(model.getResource()));
        });
        test('save - UNC path', async function () {
            const untitledUncUri = uri_1.URI.from({ scheme: 'untitled', authority: 'server', path: '/share/path/file.txt' });
            model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, untitledUncUri, 'utf8', undefined);
            accessor.textFileService.models.add(model.getResource(), model);
            const mockedFileUri = untitledUncUri.with({ scheme: network_1.Schemas.file });
            const mockedEditorInput = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, mockedFileUri, 'utf8', undefined);
            const loadOrCreateStub = sinon.stub(accessor.textFileService.models, 'loadOrCreate', () => Promise.resolve(mockedEditorInput));
            sinon.stub(accessor.untitledEditorService, 'exists', () => true);
            sinon.stub(accessor.untitledEditorService, 'hasAssociatedFilePath', () => true);
            sinon.stub(accessor.modelService, 'updateModel', () => { });
            await model.load();
            model.textEditorModel.setValue('foo');
            const res = await accessor.textFileService.saveAll(true);
            assert.ok(loadOrCreateStub.calledOnce);
            assert.equal(res.results.length, 1);
            assert.ok(res.results[0].success);
            assert.equal(res.results[0].target.scheme, network_1.Schemas.file);
            assert.equal(res.results[0].target.authority, untitledUncUri.authority);
            assert.equal(res.results[0].target.path, untitledUncUri.path);
        });
        test('saveAll - file', async function () {
            model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined);
            accessor.textFileService.models.add(model.getResource(), model);
            const service = accessor.textFileService;
            await model.load();
            model.textEditorModel.setValue('foo');
            assert.ok(service.isDirty(model.getResource()));
            const res = await service.saveAll([model.getResource()]);
            assert.ok(res);
            assert.ok(!service.isDirty(model.getResource()));
            assert.equal(res.results.length, 1);
            assert.equal(res.results[0].source.toString(), model.getResource().toString());
        });
        test('saveAs - file', async function () {
            model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined);
            accessor.textFileService.models.add(model.getResource(), model);
            const service = accessor.textFileService;
            service.setPromptPath(model.getResource());
            await model.load();
            model.textEditorModel.setValue('foo');
            assert.ok(service.isDirty(model.getResource()));
            const res = await service.saveAs(model.getResource());
            assert.equal(res.toString(), model.getResource().toString());
            assert.ok(!service.isDirty(model.getResource()));
        });
        test('revert - file', async function () {
            model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined);
            accessor.textFileService.models.add(model.getResource(), model);
            const service = accessor.textFileService;
            service.setPromptPath(model.getResource());
            await model.load();
            model.textEditorModel.setValue('foo');
            assert.ok(service.isDirty(model.getResource()));
            const res = await service.revert(model.getResource());
            assert.ok(res);
            assert.ok(!service.isDirty(model.getResource()));
        });
        test('delete - dirty file', async function () {
            model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined);
            accessor.textFileService.models.add(model.getResource(), model);
            const service = accessor.textFileService;
            await model.load();
            model.textEditorModel.setValue('foo');
            assert.ok(service.isDirty(model.getResource()));
            await service.delete(model.getResource());
            assert.ok(!service.isDirty(model.getResource()));
        });
        test('move - dirty file', async function () {
            await testMove(utils_1.toResource.call(this, '/path/file.txt'), utils_1.toResource.call(this, '/path/file_target.txt'));
        });
        test('move - dirty file (target exists and is dirty)', async function () {
            await testMove(utils_1.toResource.call(this, '/path/file.txt'), utils_1.toResource.call(this, '/path/file_target.txt'), true);
        });
        async function testMove(source, target, targetDirty) {
            let sourceModel = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, source, 'utf8', undefined);
            let targetModel = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, target, 'utf8', undefined);
            accessor.textFileService.models.add(sourceModel.getResource(), sourceModel);
            accessor.textFileService.models.add(targetModel.getResource(), targetModel);
            const service = accessor.textFileService;
            await sourceModel.load();
            sourceModel.textEditorModel.setValue('foo');
            assert.ok(service.isDirty(sourceModel.getResource()));
            if (targetDirty) {
                await targetModel.load();
                targetModel.textEditorModel.setValue('bar');
                assert.ok(service.isDirty(targetModel.getResource()));
            }
            await service.move(sourceModel.getResource(), targetModel.getResource(), true);
            assert.equal(targetModel.textEditorModel.getValue(), 'foo');
            assert.ok(!service.isDirty(sourceModel.getResource()));
            assert.ok(service.isDirty(targetModel.getResource()));
            sourceModel.dispose();
            targetModel.dispose();
        }
        suite('Hot Exit', () => {
            suite('"onExit" setting', () => {
                test('should hot exit on non-Mac (reason: CLOSE, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 1 /* CLOSE */, false, true, !!platform.isMacintosh);
                });
                test('should hot exit on non-Mac (reason: CLOSE, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 1 /* CLOSE */, false, false, !!platform.isMacintosh);
                });
                test('should NOT hot exit (reason: CLOSE, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 1 /* CLOSE */, true, true, true);
                });
                test('should NOT hot exit (reason: CLOSE, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 1 /* CLOSE */, true, false, true);
                });
                test('should hot exit (reason: QUIT, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 2 /* QUIT */, false, true, false);
                });
                test('should hot exit (reason: QUIT, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 2 /* QUIT */, false, false, false);
                });
                test('should hot exit (reason: QUIT, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 2 /* QUIT */, true, true, false);
                });
                test('should hot exit (reason: QUIT, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 2 /* QUIT */, true, false, false);
                });
                test('should hot exit (reason: RELOAD, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 3 /* RELOAD */, false, true, false);
                });
                test('should hot exit (reason: RELOAD, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 3 /* RELOAD */, false, false, false);
                });
                test('should hot exit (reason: RELOAD, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 3 /* RELOAD */, true, true, false);
                });
                test('should hot exit (reason: RELOAD, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 3 /* RELOAD */, true, false, false);
                });
                test('should NOT hot exit (reason: LOAD, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 4 /* LOAD */, false, true, true);
                });
                test('should NOT hot exit (reason: LOAD, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 4 /* LOAD */, false, false, true);
                });
                test('should NOT hot exit (reason: LOAD, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 4 /* LOAD */, true, true, true);
                });
                test('should NOT hot exit (reason: LOAD, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 4 /* LOAD */, true, false, true);
                });
            });
            suite('"onExitAndWindowClose" setting', () => {
                test('should hot exit (reason: CLOSE, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 1 /* CLOSE */, false, true, false);
                });
                test('should hot exit (reason: CLOSE, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 1 /* CLOSE */, false, false, !!platform.isMacintosh);
                });
                test('should hot exit (reason: CLOSE, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 1 /* CLOSE */, true, true, false);
                });
                test('should NOT hot exit (reason: CLOSE, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 1 /* CLOSE */, true, false, true);
                });
                test('should hot exit (reason: QUIT, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 2 /* QUIT */, false, true, false);
                });
                test('should hot exit (reason: QUIT, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 2 /* QUIT */, false, false, false);
                });
                test('should hot exit (reason: QUIT, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 2 /* QUIT */, true, true, false);
                });
                test('should hot exit (reason: QUIT, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 2 /* QUIT */, true, false, false);
                });
                test('should hot exit (reason: RELOAD, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 3 /* RELOAD */, false, true, false);
                });
                test('should hot exit (reason: RELOAD, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 3 /* RELOAD */, false, false, false);
                });
                test('should hot exit (reason: RELOAD, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 3 /* RELOAD */, true, true, false);
                });
                test('should hot exit (reason: RELOAD, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 3 /* RELOAD */, true, false, false);
                });
                test('should hot exit (reason: LOAD, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 4 /* LOAD */, false, true, false);
                });
                test('should NOT hot exit (reason: LOAD, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 4 /* LOAD */, false, false, true);
                });
                test('should hot exit (reason: LOAD, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 4 /* LOAD */, true, true, false);
                });
                test('should NOT hot exit (reason: LOAD, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 4 /* LOAD */, true, false, true);
                });
            });
            async function hotExitTest(setting, shutdownReason, multipleWindows, workspace, shouldVeto) {
                model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined);
                accessor.textFileService.models.add(model.getResource(), model);
                const service = accessor.textFileService;
                // Set hot exit config
                service.onFilesConfigurationChange({ files: { hotExit: setting } });
                // Set empty workspace if required
                if (!workspace) {
                    accessor.contextService.setWorkspace(new workspace_1.Workspace('empty:1508317022751'));
                }
                // Set multiple windows if required
                if (multipleWindows) {
                    accessor.electronService.windowCount = Promise.resolve(2);
                }
                // Set cancel to force a veto if hot exit does not trigger
                service.setConfirmResult(2 /* CANCEL */);
                await model.load();
                model.textEditorModel.setValue('foo');
                assert.equal(service.getDirty().length, 1);
                const event = new BeforeShutdownEventImpl();
                event.reason = shutdownReason;
                accessor.lifecycleService.fireWillShutdown(event);
                const veto = await event.value;
                assert.ok(!service.cleanupBackupsBeforeShutdownCalled); // When hot exit is set, backups should never be cleaned since the confirm result is cancel
                assert.equal(veto, shouldVeto);
            }
        });
    });
});
//# sourceMappingURL=textFileService.test.js.map