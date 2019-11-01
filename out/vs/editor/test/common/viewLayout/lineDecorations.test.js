/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/core/range", "vs/editor/common/viewLayout/lineDecorations", "vs/editor/common/viewModel/viewModel"], function (require, exports, assert, range_1, lineDecorations_1, viewModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Editor ViewLayout - ViewLineParts', () => {
        test('Bug 9827:Overlapping inline decorations can cause wrong inline class to be applied', () => {
            let result = lineDecorations_1.LineDecorationsNormalizer.normalize('abcabcabcabcabcabcabcabcabcabc', [
                new lineDecorations_1.LineDecoration(1, 11, 'c1', 0 /* Regular */),
                new lineDecorations_1.LineDecoration(3, 4, 'c2', 0 /* Regular */)
            ]);
            assert.deepEqual(result, [
                new lineDecorations_1.DecorationSegment(0, 1, 'c1'),
                new lineDecorations_1.DecorationSegment(2, 2, 'c2 c1'),
                new lineDecorations_1.DecorationSegment(3, 9, 'c1'),
            ]);
        });
        test('issue #3462: no whitespace shown at the end of a decorated line', () => {
            let result = lineDecorations_1.LineDecorationsNormalizer.normalize('abcabcabcabcabcabcabcabcabcabc', [
                new lineDecorations_1.LineDecoration(15, 21, 'vs-whitespace', 0 /* Regular */),
                new lineDecorations_1.LineDecoration(20, 21, 'inline-folded', 0 /* Regular */),
            ]);
            assert.deepEqual(result, [
                new lineDecorations_1.DecorationSegment(14, 18, 'vs-whitespace'),
                new lineDecorations_1.DecorationSegment(19, 19, 'vs-whitespace inline-folded')
            ]);
        });
        test('issue #3661: Link decoration bleeds to next line when wrapping', () => {
            let result = lineDecorations_1.LineDecoration.filter([
                new viewModel_1.InlineDecoration(new range_1.Range(2, 12, 3, 30), 'detected-link', 0 /* Regular */)
            ], 3, 12, 500);
            assert.deepEqual(result, [
                new lineDecorations_1.LineDecoration(12, 30, 'detected-link', 0 /* Regular */),
            ]);
        });
        test('issue #37401: Allow both before and after decorations on empty line', () => {
            let result = lineDecorations_1.LineDecoration.filter([
                new viewModel_1.InlineDecoration(new range_1.Range(4, 1, 4, 2), 'before', 1 /* Before */),
                new viewModel_1.InlineDecoration(new range_1.Range(4, 0, 4, 1), 'after', 2 /* After */),
            ], 4, 1, 500);
            assert.deepEqual(result, [
                new lineDecorations_1.LineDecoration(1, 2, 'before', 1 /* Before */),
                new lineDecorations_1.LineDecoration(0, 1, 'after', 2 /* After */),
            ]);
        });
        test('ViewLineParts', () => {
            assert.deepEqual(lineDecorations_1.LineDecorationsNormalizer.normalize('abcabcabcabcabcabcabcabcabcabc', [
                new lineDecorations_1.LineDecoration(1, 2, 'c1', 0 /* Regular */),
                new lineDecorations_1.LineDecoration(3, 4, 'c2', 0 /* Regular */)
            ]), [
                new lineDecorations_1.DecorationSegment(0, 0, 'c1'),
                new lineDecorations_1.DecorationSegment(2, 2, 'c2')
            ]);
            assert.deepEqual(lineDecorations_1.LineDecorationsNormalizer.normalize('abcabcabcabcabcabcabcabcabcabc', [
                new lineDecorations_1.LineDecoration(1, 3, 'c1', 0 /* Regular */),
                new lineDecorations_1.LineDecoration(3, 4, 'c2', 0 /* Regular */)
            ]), [
                new lineDecorations_1.DecorationSegment(0, 1, 'c1'),
                new lineDecorations_1.DecorationSegment(2, 2, 'c2')
            ]);
            assert.deepEqual(lineDecorations_1.LineDecorationsNormalizer.normalize('abcabcabcabcabcabcabcabcabcabc', [
                new lineDecorations_1.LineDecoration(1, 4, 'c1', 0 /* Regular */),
                new lineDecorations_1.LineDecoration(3, 4, 'c2', 0 /* Regular */)
            ]), [
                new lineDecorations_1.DecorationSegment(0, 1, 'c1'),
                new lineDecorations_1.DecorationSegment(2, 2, 'c1 c2')
            ]);
            assert.deepEqual(lineDecorations_1.LineDecorationsNormalizer.normalize('abcabcabcabcabcabcabcabcabcabc', [
                new lineDecorations_1.LineDecoration(1, 4, 'c1', 0 /* Regular */),
                new lineDecorations_1.LineDecoration(1, 4, 'c1*', 0 /* Regular */),
                new lineDecorations_1.LineDecoration(3, 4, 'c2', 0 /* Regular */)
            ]), [
                new lineDecorations_1.DecorationSegment(0, 1, 'c1 c1*'),
                new lineDecorations_1.DecorationSegment(2, 2, 'c1 c1* c2')
            ]);
            assert.deepEqual(lineDecorations_1.LineDecorationsNormalizer.normalize('abcabcabcabcabcabcabcabcabcabc', [
                new lineDecorations_1.LineDecoration(1, 4, 'c1', 0 /* Regular */),
                new lineDecorations_1.LineDecoration(1, 4, 'c1*', 0 /* Regular */),
                new lineDecorations_1.LineDecoration(1, 4, 'c1**', 0 /* Regular */),
                new lineDecorations_1.LineDecoration(3, 4, 'c2', 0 /* Regular */)
            ]), [
                new lineDecorations_1.DecorationSegment(0, 1, 'c1 c1* c1**'),
                new lineDecorations_1.DecorationSegment(2, 2, 'c1 c1* c1** c2')
            ]);
            assert.deepEqual(lineDecorations_1.LineDecorationsNormalizer.normalize('abcabcabcabcabcabcabcabcabcabc', [
                new lineDecorations_1.LineDecoration(1, 4, 'c1', 0 /* Regular */),
                new lineDecorations_1.LineDecoration(1, 4, 'c1*', 0 /* Regular */),
                new lineDecorations_1.LineDecoration(1, 4, 'c1**', 0 /* Regular */),
                new lineDecorations_1.LineDecoration(3, 4, 'c2', 0 /* Regular */),
                new lineDecorations_1.LineDecoration(3, 4, 'c2*', 0 /* Regular */)
            ]), [
                new lineDecorations_1.DecorationSegment(0, 1, 'c1 c1* c1**'),
                new lineDecorations_1.DecorationSegment(2, 2, 'c1 c1* c1** c2 c2*')
            ]);
            assert.deepEqual(lineDecorations_1.LineDecorationsNormalizer.normalize('abcabcabcabcabcabcabcabcabcabc', [
                new lineDecorations_1.LineDecoration(1, 4, 'c1', 0 /* Regular */),
                new lineDecorations_1.LineDecoration(1, 4, 'c1*', 0 /* Regular */),
                new lineDecorations_1.LineDecoration(1, 4, 'c1**', 0 /* Regular */),
                new lineDecorations_1.LineDecoration(3, 4, 'c2', 0 /* Regular */),
                new lineDecorations_1.LineDecoration(3, 5, 'c2*', 0 /* Regular */)
            ]), [
                new lineDecorations_1.DecorationSegment(0, 1, 'c1 c1* c1**'),
                new lineDecorations_1.DecorationSegment(2, 2, 'c1 c1* c1** c2 c2*'),
                new lineDecorations_1.DecorationSegment(3, 3, 'c2*')
            ]);
        });
    });
});
//# sourceMappingURL=lineDecorations.test.js.map