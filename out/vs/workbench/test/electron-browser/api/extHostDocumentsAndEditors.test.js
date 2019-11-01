/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/test/electron-browser/api/testRPCProtocol"], function (require, exports, assert, uri_1, extHostDocumentsAndEditors_1, testRPCProtocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostDocumentsAndEditors', () => {
        let editors;
        setup(function () {
            editors = new extHostDocumentsAndEditors_1.ExtHostDocumentsAndEditors(new testRPCProtocol_1.TestRPCProtocol());
        });
        test('The value of TextDocument.isClosed is incorrect when a text document is closed, #27949', () => {
            editors.$acceptDocumentsAndEditorsDelta({
                addedDocuments: [{
                        EOL: '\n',
                        isDirty: true,
                        modeId: 'fooLang',
                        uri: uri_1.URI.parse('foo:bar'),
                        versionId: 1,
                        lines: [
                            'first',
                            'second'
                        ]
                    }]
            });
            return new Promise((resolve, reject) => {
                editors.onDidRemoveDocuments(e => {
                    try {
                        for (const data of e) {
                            assert.equal(data.document.isClosed, true);
                        }
                        resolve(undefined);
                    }
                    catch (e) {
                        reject(e);
                    }
                });
                editors.$acceptDocumentsAndEditorsDelta({
                    removedDocuments: [uri_1.URI.parse('foo:bar')]
                });
            });
        });
    });
});
//# sourceMappingURL=extHostDocumentsAndEditors.test.js.map