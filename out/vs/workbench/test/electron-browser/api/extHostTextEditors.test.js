define(["require", "exports", "assert", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHost.protocol", "vs/base/common/uri", "vs/workbench/test/electron-browser/api/mock", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/test/electron-browser/api/testRPCProtocol", "vs/workbench/api/common/extHostTextEditors"], function (require, exports, assert, extHostTypes, extHost_protocol_1, uri_1, mock_1, extHostDocumentsAndEditors_1, testRPCProtocol_1, extHostTextEditors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostTextEditors.applyWorkspaceEdit', () => {
        const resource = uri_1.URI.parse('foo:bar');
        let editors;
        let workspaceResourceEdits;
        setup(() => {
            workspaceResourceEdits = null;
            let rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadTextEditors, new class extends mock_1.mock() {
                $tryApplyWorkspaceEdit(_workspaceResourceEdits) {
                    workspaceResourceEdits = _workspaceResourceEdits;
                    return Promise.resolve(true);
                }
            });
            const documentsAndEditors = new extHostDocumentsAndEditors_1.ExtHostDocumentsAndEditors(testRPCProtocol_1.SingleProxyRPCProtocol(null));
            documentsAndEditors.$acceptDocumentsAndEditorsDelta({
                addedDocuments: [{
                        isDirty: false,
                        modeId: 'foo',
                        uri: resource,
                        versionId: 1337,
                        lines: ['foo'],
                        EOL: '\n',
                    }]
            });
            editors = new extHostTextEditors_1.ExtHostEditors(rpcProtocol, documentsAndEditors);
        });
        test('uses version id if document available', async () => {
            let edit = new extHostTypes.WorkspaceEdit();
            edit.replace(resource, new extHostTypes.Range(0, 0, 0, 0), 'hello');
            await editors.applyWorkspaceEdit(edit);
            assert.equal(workspaceResourceEdits.edits.length, 1);
            assert.equal(workspaceResourceEdits.edits[0].modelVersionId, 1337);
        });
        test('does not use version id if document is not available', async () => {
            let edit = new extHostTypes.WorkspaceEdit();
            edit.replace(uri_1.URI.parse('foo:bar2'), new extHostTypes.Range(0, 0, 0, 0), 'hello');
            await editors.applyWorkspaceEdit(edit);
            assert.equal(workspaceResourceEdits.edits.length, 1);
            assert.ok(typeof workspaceResourceEdits.edits[0].modelVersionId === 'undefined');
        });
    });
});
//# sourceMappingURL=extHostTextEditors.test.js.map