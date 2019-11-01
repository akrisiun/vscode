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
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/common/editor/resourceEditorInput", "vs/workbench/test/workbenchTestServices", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/workbench/services/textfile/common/textfiles", "vs/editor/common/modes/modesRegistry"], function (require, exports, assert, uri_1, resourceEditorInput_1, workbenchTestServices_1, modelService_1, modeService_1, textfiles_1, modesRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ServiceAccessor = class ServiceAccessor {
        constructor(modelService, modeService) {
            this.modelService = modelService;
            this.modeService = modeService;
        }
    };
    ServiceAccessor = __decorate([
        __param(0, modelService_1.IModelService),
        __param(1, modeService_1.IModeService)
    ], ServiceAccessor);
    suite('Workbench resource editor input', () => {
        let instantiationService;
        let accessor;
        setup(() => {
            instantiationService = workbenchTestServices_1.workbenchInstantiationService();
            accessor = instantiationService.createInstance(ServiceAccessor);
        });
        test('basics', async () => {
            const resource = uri_1.URI.from({ scheme: 'inmemory', authority: null, path: 'thePath' });
            accessor.modelService.createModel('function test() {}', accessor.modeService.create('text'), resource);
            const input = instantiationService.createInstance(resourceEditorInput_1.ResourceEditorInput, 'The Name', 'The Description', resource, undefined);
            const model = await input.resolve();
            assert.ok(model);
            assert.equal(textfiles_1.snapshotToString((model.createSnapshot())), 'function test() {}');
        });
        test('custom mode', async () => {
            modesRegistry_1.ModesRegistry.registerLanguage({
                id: 'resource-input-test',
            });
            const resource = uri_1.URI.from({ scheme: 'inmemory', authority: null, path: 'thePath' });
            accessor.modelService.createModel('function test() {}', accessor.modeService.create('text'), resource);
            const input = instantiationService.createInstance(resourceEditorInput_1.ResourceEditorInput, 'The Name', 'The Description', resource, 'resource-input-test');
            const model = await input.resolve();
            assert.ok(model);
            assert.equal(model.textEditorModel.getModeId(), 'resource-input-test');
            input.setMode('text');
            assert.equal(model.textEditorModel.getModeId(), modesRegistry_1.PLAINTEXT_MODE_ID);
        });
    });
});
//# sourceMappingURL=resourceEditorInput.test.js.map