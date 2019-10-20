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
define(["require", "exports", "assert", "vs/workbench/contrib/files/browser/editors/fileEditorTracker", "vs/base/test/common/utils", "vs/workbench/services/editor/common/editorService", "vs/workbench/test/workbenchTestServices", "vs/workbench/services/textfile/common/textfiles", "vs/platform/files/common/files", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/async"], function (require, exports, assert, fileEditorTracker_1, utils_1, editorService_1, workbenchTestServices_1, textfiles_1, files_1, editorGroupsService_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ServiceAccessor = class ServiceAccessor {
        constructor(editorService, editorGroupService, textFileService, fileService) {
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.textFileService = textFileService;
            this.fileService = fileService;
        }
    };
    ServiceAccessor = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, textfiles_1.ITextFileService),
        __param(3, files_1.IFileService)
    ], ServiceAccessor);
    suite('Files - FileEditorTracker', () => {
        let instantiationService;
        let accessor;
        setup(() => {
            instantiationService = workbenchTestServices_1.workbenchInstantiationService();
            accessor = instantiationService.createInstance(ServiceAccessor);
        });
        test('file change event updates model', async function () {
            const tracker = instantiationService.createInstance(fileEditorTracker_1.FileEditorTracker);
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            const model = await accessor.textFileService.models.loadOrCreate(resource);
            model.textEditorModel.setValue('Super Good');
            assert.equal(textfiles_1.snapshotToString(model.createSnapshot()), 'Super Good');
            await model.save();
            // change event (watcher)
            accessor.fileService.fireFileChanges(new files_1.FileChangesEvent([{ resource, type: 0 /* UPDATED */ }]));
            await async_1.timeout(0); // due to event updating model async
            assert.equal(textfiles_1.snapshotToString(model.createSnapshot()), 'Hello Html');
            tracker.dispose();
        });
    });
});
//# sourceMappingURL=fileEditorTracker.test.js.map