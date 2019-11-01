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
define(["require", "exports", "assert", "vs/workbench/common/editor/textDiffEditorModel", "vs/workbench/common/editor/diffEditorInput", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/workbench/common/editor/resourceEditorInput", "vs/base/common/uri", "vs/editor/common/services/resolverService", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/test/workbenchTestServices"], function (require, exports, assert, textDiffEditorModel_1, diffEditorInput_1, modelService_1, modeService_1, resourceEditorInput_1, uri_1, resolverService_1, textfiles_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ServiceAccessor = class ServiceAccessor {
        constructor(textModelResolverService, modelService, modeService, textFileService) {
            this.textModelResolverService = textModelResolverService;
            this.modelService = modelService;
            this.modeService = modeService;
            this.textFileService = textFileService;
        }
    };
    ServiceAccessor = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, modelService_1.IModelService),
        __param(2, modeService_1.IModeService),
        __param(3, textfiles_1.ITextFileService)
    ], ServiceAccessor);
    suite('Workbench editor model', () => {
        let instantiationService;
        let accessor;
        setup(() => {
            instantiationService = workbenchTestServices_1.workbenchInstantiationService();
            accessor = instantiationService.createInstance(ServiceAccessor);
        });
        test('TextDiffEditorModel', async () => {
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
            let input = instantiationService.createInstance(resourceEditorInput_1.ResourceEditorInput, 'name', 'description', uri_1.URI.from({ scheme: 'test', authority: null, path: 'thePath' }), undefined);
            let otherInput = instantiationService.createInstance(resourceEditorInput_1.ResourceEditorInput, 'name2', 'description', uri_1.URI.from({ scheme: 'test', authority: null, path: 'thePath' }), undefined);
            let diffInput = new diffEditorInput_1.DiffEditorInput('name', 'description', input, otherInput);
            let model = await diffInput.resolve();
            assert(model);
            assert(model instanceof textDiffEditorModel_1.TextDiffEditorModel);
            let diffEditorModel = model.textDiffEditorModel;
            assert(diffEditorModel.original);
            assert(diffEditorModel.modified);
            model = await diffInput.resolve();
            assert(model.isResolved());
            assert(diffEditorModel !== model.textDiffEditorModel);
            diffInput.dispose();
            assert(!model.textDiffEditorModel);
            dispose.dispose();
        });
    });
});
//# sourceMappingURL=editorDiffModel.test.js.map