/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/api/browser/mainThreadDocumentsAndEditors", "./testRPCProtocol", "vs/platform/configuration/test/common/testConfigurationService", "vs/editor/common/services/modelServiceImpl", "vs/editor/test/browser/editorTestServices", "vs/workbench/api/common/extHost.protocol", "vs/workbench/test/electron-browser/api/mock", "vs/base/common/event", "vs/workbench/api/browser/mainThreadEditors", "vs/base/common/uri", "vs/editor/common/core/range", "vs/editor/common/core/position", "vs/editor/common/core/editOperation", "vs/workbench/test/workbenchTestServices", "vs/workbench/services/bulkEdit/browser/bulkEditService", "vs/platform/log/common/log", "vs/base/common/lifecycle", "vs/workbench/services/label/common/labelService"], function (require, exports, assert, mainThreadDocumentsAndEditors_1, testRPCProtocol_1, testConfigurationService_1, modelServiceImpl_1, editorTestServices_1, extHost_protocol_1, mock_1, event_1, mainThreadEditors_1, uri_1, range_1, position_1, editOperation_1, workbenchTestServices_1, bulkEditService_1, log_1, lifecycle_1, labelService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('MainThreadEditors', () => {
        const resource = uri_1.URI.parse('foo:bar');
        let modelService;
        let editors;
        const movedResources = new Map();
        const createdResources = new Set();
        const deletedResources = new Set();
        setup(() => {
            const configService = new testConfigurationService_1.TestConfigurationService();
            modelService = new modelServiceImpl_1.ModelServiceImpl(configService, new workbenchTestServices_1.TestTextResourcePropertiesService(configService));
            const codeEditorService = new editorTestServices_1.TestCodeEditorService();
            movedResources.clear();
            createdResources.clear();
            deletedResources.clear();
            const fileService = new workbenchTestServices_1.TestFileService();
            const textFileService = new class extends mock_1.mock() {
                constructor() {
                    super(...arguments);
                    this.models = {
                        onModelSaved: event_1.Event.None,
                        onModelReverted: event_1.Event.None,
                        onModelDirty: event_1.Event.None,
                    };
                }
                isDirty() { return false; }
                create(uri, contents, options) {
                    createdResources.add(uri);
                    return Promise.resolve(Object.create(null));
                }
                delete(resource) {
                    deletedResources.add(resource);
                    return Promise.resolve(undefined);
                }
                move(source, target) {
                    movedResources.set(source, target);
                    return Promise.resolve(Object.create(null));
                }
            };
            const workbenchEditorService = new workbenchTestServices_1.TestEditorService();
            const editorGroupService = new workbenchTestServices_1.TestEditorGroupsService();
            const textModelService = new class extends mock_1.mock() {
                createModelReference(resource) {
                    const textEditorModel = new class extends mock_1.mock() {
                        constructor() {
                            super(...arguments);
                            this.textEditorModel = modelService.getModel(resource);
                        }
                    };
                    textEditorModel.isReadonly = () => false;
                    return Promise.resolve(new lifecycle_1.ImmortalReference(textEditorModel));
                }
            };
            const bulkEditService = new bulkEditService_1.BulkEditService(new log_1.NullLogService(), modelService, new workbenchTestServices_1.TestEditorService(), textModelService, new workbenchTestServices_1.TestFileService(), textFileService, new labelService_1.LabelService(workbenchTestServices_1.TestEnvironmentService, new workbenchTestServices_1.TestContextService()), configService);
            const rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDocuments, new class extends mock_1.mock() {
                $acceptModelChanged() {
                }
            });
            rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDocumentsAndEditors, new class extends mock_1.mock() {
                $acceptDocumentsAndEditorsDelta() {
                }
            });
            const documentAndEditor = new mainThreadDocumentsAndEditors_1.MainThreadDocumentsAndEditors(rpcProtocol, modelService, textFileService, workbenchEditorService, codeEditorService, null, fileService, null, null, editorGroupService, bulkEditService, new class extends mock_1.mock() {
                constructor() {
                    super(...arguments);
                    this.onDidPanelOpen = event_1.Event.None;
                    this.onDidPanelClose = event_1.Event.None;
                }
                getActivePanel() {
                    return null;
                }
            }, workbenchTestServices_1.TestEnvironmentService);
            editors = new mainThreadEditors_1.MainThreadTextEditors(documentAndEditor, testRPCProtocol_1.SingleProxyRPCProtocol(null), codeEditorService, bulkEditService, workbenchEditorService, editorGroupService);
        });
        test(`applyWorkspaceEdit returns false if model is changed by user`, () => {
            let model = modelService.createModel('something', null, resource);
            let workspaceResourceEdit = {
                resource: resource,
                modelVersionId: model.getVersionId(),
                edits: [{
                        text: 'asdfg',
                        range: new range_1.Range(1, 1, 1, 1)
                    }]
            };
            // Act as if the user edited the model
            model.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(0, 0), 'something')]);
            return editors.$tryApplyWorkspaceEdit({ edits: [workspaceResourceEdit] }).then((result) => {
                assert.equal(result, false);
            });
        });
        test(`issue #54773: applyWorkspaceEdit checks model version in race situation`, () => {
            let model = modelService.createModel('something', null, resource);
            let workspaceResourceEdit1 = {
                resource: resource,
                modelVersionId: model.getVersionId(),
                edits: [{
                        text: 'asdfg',
                        range: new range_1.Range(1, 1, 1, 1)
                    }]
            };
            let workspaceResourceEdit2 = {
                resource: resource,
                modelVersionId: model.getVersionId(),
                edits: [{
                        text: 'asdfg',
                        range: new range_1.Range(1, 1, 1, 1)
                    }]
            };
            let p1 = editors.$tryApplyWorkspaceEdit({ edits: [workspaceResourceEdit1] }).then((result) => {
                // first edit request succeeds
                assert.equal(result, true);
            });
            let p2 = editors.$tryApplyWorkspaceEdit({ edits: [workspaceResourceEdit2] }).then((result) => {
                // second edit request fails
                assert.equal(result, false);
            });
            return Promise.all([p1, p2]);
        });
        test(`applyWorkspaceEdit with only resource edit`, () => {
            return editors.$tryApplyWorkspaceEdit({
                edits: [
                    { oldUri: resource, newUri: resource, options: undefined },
                    { oldUri: undefined, newUri: resource, options: undefined },
                    { oldUri: resource, newUri: undefined, options: undefined }
                ]
            }).then((result) => {
                assert.equal(result, true);
                assert.equal(movedResources.get(resource), resource);
                assert.equal(createdResources.has(resource), true);
                assert.equal(deletedResources.has(resource), true);
            });
        });
    });
});
//# sourceMappingURL=mainThreadEditors.test.js.map