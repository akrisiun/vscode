/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/common/editor", "vs/workbench/common/editor/diffEditorInput"], function (require, exports, assert, editor_1, diffEditorInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MyEditorInput extends editor_1.EditorInput {
        getTypeId() { return ''; }
        resolve() { return null; }
    }
    suite('Workbench editor input', () => {
        test('EditorInput', () => {
            let counter = 0;
            let input = new MyEditorInput();
            let otherInput = new MyEditorInput();
            assert(input.matches(input));
            assert(!input.matches(otherInput));
            assert(!input.matches(null));
            assert(!input.getName());
            input.onDispose(() => {
                assert(true);
                counter++;
            });
            input.dispose();
            assert.equal(counter, 1);
        });
        test('DiffEditorInput', () => {
            let counter = 0;
            let input = new MyEditorInput();
            input.onDispose(() => {
                assert(true);
                counter++;
            });
            let otherInput = new MyEditorInput();
            otherInput.onDispose(() => {
                assert(true);
                counter++;
            });
            let diffInput = new diffEditorInput_1.DiffEditorInput('name', 'description', input, otherInput);
            assert.equal(diffInput.originalInput, input);
            assert.equal(diffInput.modifiedInput, otherInput);
            assert(diffInput.matches(diffInput));
            assert(!diffInput.matches(otherInput));
            assert(!diffInput.matches(null));
            diffInput.dispose();
            assert.equal(counter, 0);
        });
        test('DiffEditorInput disposes when input inside disposes', function () {
            let counter = 0;
            let input = new MyEditorInput();
            let otherInput = new MyEditorInput();
            let diffInput = new diffEditorInput_1.DiffEditorInput('name', 'description', input, otherInput);
            diffInput.onDispose(() => {
                counter++;
                assert(true);
            });
            input.dispose();
            input = new MyEditorInput();
            otherInput = new MyEditorInput();
            let diffInput2 = new diffEditorInput_1.DiffEditorInput('name', 'description', input, otherInput);
            diffInput2.onDispose(() => {
                counter++;
                assert(true);
            });
            otherInput.dispose();
            assert.equal(counter, 2);
        });
    });
});
//# sourceMappingURL=editorInput.test.js.map