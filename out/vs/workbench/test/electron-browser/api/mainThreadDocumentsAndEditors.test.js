/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/api/browser/mainThreadDocumentsAndEditors", "./testRPCProtocol", "vs/platform/configuration/test/common/testConfigurationService", "vs/editor/common/services/modelServiceImpl", "vs/editor/test/browser/editorTestServices", "vs/editor/test/browser/testCodeEditor", "vs/workbench/test/electron-browser/api/mock", "vs/workbench/test/workbenchTestServices", "vs/base/common/event", "vs/platform/instantiation/common/serviceCollection", "vs/editor/browser/services/codeEditorService"], function (require, exports, assert, mainThreadDocumentsAndEditors_1, testRPCProtocol_1, testConfigurationService_1, modelServiceImpl_1, editorTestServices_1, testCodeEditor_1, mock_1, workbenchTestServices_1, event_1, serviceCollection_1, codeEditorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('MainThreadDocumentsAndEditors', () => {
        let modelService;
        let codeEditorService;
        let textFileService;
        let deltas = [];
        const hugeModelString = new Array(2 + (50 * 1024 * 1024)).join('-');
        function myCreateTestCodeEditor(model) {
            return testCodeEditor_1.createTestCodeEditor({
                model: model,
                serviceCollection: new serviceCollection_1.ServiceCollection([codeEditorService_1.ICodeEditorService, codeEditorService])
            });
        }
        setup(() => {
            deltas.length = 0;
            const configService = new testConfigurationService_1.TestConfigurationService();
            configService.setUserConfiguration('editor', { 'detectIndentation': false });
            modelService = new modelServiceImpl_1.ModelServiceImpl(configService, new workbenchTestServices_1.TestTextResourcePropertiesService(configService));
            codeEditorService = new editorTestServices_1.TestCodeEditorService();
            textFileService = new class extends mock_1.mock() {
                constructor() {
                    super(...arguments);
                    this.models = {
                        onModelSaved: event_1.Event.None,
                        onModelReverted: event_1.Event.None,
                        onModelDirty: event_1.Event.None,
                    };
                }
                isDirty() { return false; }
            };
            const workbenchEditorService = new workbenchTestServices_1.TestEditorService();
            const editorGroupService = new workbenchTestServices_1.TestEditorGroupsService();
            const fileService = new class extends mock_1.mock() {
                constructor() {
                    super(...arguments);
                    this.onAfterOperation = event_1.Event.None;
                }
            };
            /* tslint:disable */
            new mainThreadDocumentsAndEditors_1.MainThreadDocumentsAndEditors(testRPCProtocol_1.SingleProxyRPCProtocol(new class extends mock_1.mock() {
                $acceptDocumentsAndEditorsDelta(delta) { deltas.push(delta); }
            }), modelService, textFileService, workbenchEditorService, codeEditorService, null, fileService, null, null, editorGroupService, null, new class extends mock_1.mock() {
                constructor() {
                    super(...arguments);
                    this.onDidPanelOpen = event_1.Event.None;
                    this.onDidPanelClose = event_1.Event.None;
                }
                getActivePanel() {
                    return null;
                }
            }, workbenchTestServices_1.TestEnvironmentService);
            /* tslint:enable */
        });
        test('Model#add', () => {
            deltas.length = 0;
            modelService.createModel('farboo', null);
            assert.equal(deltas.length, 1);
            const [delta] = deltas;
            assert.equal(delta.addedDocuments.length, 1);
            assert.equal(delta.removedDocuments, undefined);
            assert.equal(delta.addedEditors, undefined);
            assert.equal(delta.removedEditors, undefined);
            assert.equal(delta.newActiveEditor, null);
        });
        test('ignore huge model', function () {
            this.timeout(1000 * 60); // increase timeout for this one test
            const model = modelService.createModel(hugeModelString, null);
            assert.ok(model.isTooLargeForSyncing());
            assert.equal(deltas.length, 1);
            const [delta] = deltas;
            assert.equal(delta.newActiveEditor, null);
            assert.equal(delta.addedDocuments, undefined);
            assert.equal(delta.removedDocuments, undefined);
            assert.equal(delta.addedEditors, undefined);
            assert.equal(delta.removedEditors, undefined);
        });
        test('ignore simple widget model', function () {
            this.timeout(1000 * 60); // increase timeout for this one test
            const model = modelService.createModel('test', null, undefined, true);
            assert.ok(model.isForSimpleWidget);
            assert.equal(deltas.length, 1);
            const [delta] = deltas;
            assert.equal(delta.newActiveEditor, null);
            assert.equal(delta.addedDocuments, undefined);
            assert.equal(delta.removedDocuments, undefined);
            assert.equal(delta.addedEditors, undefined);
            assert.equal(delta.removedEditors, undefined);
        });
        test('ignore huge model from editor', function () {
            this.timeout(1000 * 60); // increase timeout for this one test
            const model = modelService.createModel(hugeModelString, null);
            const editor = myCreateTestCodeEditor(model);
            assert.equal(deltas.length, 1);
            deltas.length = 0;
            assert.equal(deltas.length, 0);
            editor.dispose();
        });
        test('ignore editor w/o model', () => {
            const editor = myCreateTestCodeEditor(undefined);
            assert.equal(deltas.length, 1);
            const [delta] = deltas;
            assert.equal(delta.newActiveEditor, null);
            assert.equal(delta.addedDocuments, undefined);
            assert.equal(delta.removedDocuments, undefined);
            assert.equal(delta.addedEditors, undefined);
            assert.equal(delta.removedEditors, undefined);
            editor.dispose();
        });
        test('editor with model', () => {
            deltas.length = 0;
            const model = modelService.createModel('farboo', null);
            const editor = myCreateTestCodeEditor(model);
            assert.equal(deltas.length, 2);
            const [first, second] = deltas;
            assert.equal(first.addedDocuments.length, 1);
            assert.equal(first.newActiveEditor, null);
            assert.equal(first.removedDocuments, undefined);
            assert.equal(first.addedEditors, undefined);
            assert.equal(first.removedEditors, undefined);
            assert.equal(second.addedEditors.length, 1);
            assert.equal(second.addedDocuments, undefined);
            assert.equal(second.removedDocuments, undefined);
            assert.equal(second.removedEditors, undefined);
            assert.equal(second.newActiveEditor, undefined);
            editor.dispose();
        });
        test('editor with dispos-ed/-ing model', () => {
            modelService.createModel('foobar', null);
            const model = modelService.createModel('farboo', null);
            const editor = myCreateTestCodeEditor(model);
            // ignore things until now
            deltas.length = 0;
            modelService.destroyModel(model.uri);
            assert.equal(deltas.length, 1);
            const [first] = deltas;
            assert.equal(first.newActiveEditor, null);
            assert.equal(first.removedEditors.length, 1);
            assert.equal(first.removedDocuments.length, 1);
            assert.equal(first.addedDocuments, undefined);
            assert.equal(first.addedEditors, undefined);
            editor.dispose();
        });
    });
});
//# sourceMappingURL=mainThreadDocumentsAndEditors.test.js.map