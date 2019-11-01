/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/editor/browser/core/editorState", "vs/editor/common/core/position", "vs/editor/common/core/selection"], function (require, exports, assert, uri_1, editorState_1, position_1, selection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Editor Core - Editor State', () => {
        const allFlags = (1 /* Value */
            | 2 /* Selection */
            | 4 /* Position */
            | 8 /* Scroll */);
        test('empty editor state should be valid', () => {
            let result = validate({}, {});
            assert.equal(result, true);
        });
        test('different model URIs should be invalid', () => {
            let result = validate({ model: { uri: uri_1.URI.parse('http://test1') } }, { model: { uri: uri_1.URI.parse('http://test2') } });
            assert.equal(result, false);
        });
        test('different model versions should be invalid', () => {
            let result = validate({ model: { version: 1 } }, { model: { version: 2 } });
            assert.equal(result, false);
        });
        test('different positions should be invalid', () => {
            let result = validate({ position: new position_1.Position(1, 2) }, { position: new position_1.Position(2, 3) });
            assert.equal(result, false);
        });
        test('different selections should be invalid', () => {
            let result = validate({ selection: new selection_1.Selection(1, 2, 3, 4) }, { selection: new selection_1.Selection(5, 2, 3, 4) });
            assert.equal(result, false);
        });
        test('different scroll positions should be invalid', () => {
            let result = validate({ scroll: { left: 1, top: 2 } }, { scroll: { left: 3, top: 2 } });
            assert.equal(result, false);
        });
        function validate(source, target) {
            let sourceEditor = createEditor(source), targetEditor = createEditor(target);
            let result = new editorState_1.EditorState(sourceEditor, allFlags).validate(targetEditor);
            return result;
        }
        function createEditor({ model, position, selection, scroll } = {}) {
            let mappedModel = model ? { uri: model.uri ? model.uri : uri_1.URI.parse('http://dummy.org'), getVersionId: () => model.version } : null;
            return {
                getModel: () => mappedModel,
                getPosition: () => position,
                getSelection: () => selection,
                getScrollLeft: () => scroll && scroll.left,
                getScrollTop: () => scroll && scroll.top
            };
        }
    });
});
//# sourceMappingURL=editorState.test.js.map