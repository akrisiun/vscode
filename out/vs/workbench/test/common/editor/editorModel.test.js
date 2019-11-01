/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/common/editor", "vs/workbench/common/editor/textEditorModel", "vs/editor/common/services/modeService", "vs/editor/common/services/modeServiceImpl", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/editor/common/services/modelServiceImpl", "vs/editor/common/model/textModel", "vs/editor/common/services/resourceConfiguration", "vs/workbench/test/workbenchTestServices"], function (require, exports, assert, instantiationServiceMock_1, editor_1, textEditorModel_1, modeService_1, modeServiceImpl_1, configuration_1, testConfigurationService_1, modelServiceImpl_1, textModel_1, resourceConfiguration_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MyEditorModel extends editor_1.EditorModel {
    }
    class MyTextEditorModel extends textEditorModel_1.BaseTextEditorModel {
        createTextEditorModel(value, resource, preferredMode) {
            return super.createTextEditorModel(value, resource, preferredMode);
        }
        isReadonly() {
            return false;
        }
    }
    suite('Workbench editor model', () => {
        let instantiationService;
        let modeService;
        setup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            modeService = instantiationService.stub(modeService_1.IModeService, modeServiceImpl_1.ModeServiceImpl);
        });
        test('EditorModel', async () => {
            let counter = 0;
            let m = new MyEditorModel();
            m.onDispose(() => {
                assert(true);
                counter++;
            });
            const model = await m.load();
            assert(model === m);
            assert.strictEqual(m.isResolved(), true);
            m.dispose();
            assert.equal(counter, 1);
        });
        test('BaseTextEditorModel', async () => {
            let modelService = stubModelService(instantiationService);
            let m = new MyTextEditorModel(modelService, modeService);
            const model = await m.load();
            assert(model === m);
            model.createTextEditorModel(textModel_1.createTextBufferFactory('foo'), null, 'text/plain');
            assert.strictEqual(m.isResolved(), true);
            m.dispose();
        });
        function stubModelService(instantiationService) {
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
            instantiationService.stub(resourceConfiguration_1.ITextResourcePropertiesService, new workbenchTestServices_1.TestTextResourcePropertiesService(instantiationService.get(configuration_1.IConfigurationService)));
            return instantiationService.createInstance(modelServiceImpl_1.ModelServiceImpl);
        }
    });
});
//# sourceMappingURL=editorModel.test.js.map