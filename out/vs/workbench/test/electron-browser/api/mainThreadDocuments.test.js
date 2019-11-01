/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/api/browser/mainThreadDocuments", "vs/editor/common/model/textModel", "vs/base/common/async"], function (require, exports, assert, mainThreadDocuments_1, textModel_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('BoundModelReferenceCollection', () => {
        let col = new mainThreadDocuments_1.BoundModelReferenceCollection(15, 75);
        teardown(() => {
            col.dispose();
        });
        test('max age', async () => {
            let didDispose = false;
            col.add({
                object: { textEditorModel: textModel_1.TextModel.createFromString('farboo') },
                dispose() {
                    didDispose = true;
                }
            });
            await async_1.timeout(30);
            assert.equal(didDispose, true);
        });
        test('max size', () => {
            let disposed = [];
            col.add({
                object: { textEditorModel: textModel_1.TextModel.createFromString('farboo') },
                dispose() {
                    disposed.push(0);
                }
            });
            col.add({
                object: { textEditorModel: textModel_1.TextModel.createFromString('boofar') },
                dispose() {
                    disposed.push(1);
                }
            });
            col.add({
                object: { textEditorModel: textModel_1.TextModel.createFromString(new Array(71).join('x')) },
                dispose() {
                    disposed.push(2);
                }
            });
            assert.deepEqual(disposed, [0, 1]);
        });
    });
});
//# sourceMappingURL=mainThreadDocuments.test.js.map