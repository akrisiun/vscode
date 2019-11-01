define(["require", "exports", "assert", "vs/editor/common/core/position", "vs/editor/common/core/range"], function (require, exports, assert, position_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Editor Core - Range', () => {
        test('empty range', () => {
            let s = new range_1.Range(1, 1, 1, 1);
            assert.equal(s.startLineNumber, 1);
            assert.equal(s.startColumn, 1);
            assert.equal(s.endLineNumber, 1);
            assert.equal(s.endColumn, 1);
            assert.equal(s.isEmpty(), true);
        });
        test('swap start and stop same line', () => {
            let s = new range_1.Range(1, 2, 1, 1);
            assert.equal(s.startLineNumber, 1);
            assert.equal(s.startColumn, 1);
            assert.equal(s.endLineNumber, 1);
            assert.equal(s.endColumn, 2);
            assert.equal(s.isEmpty(), false);
        });
        test('swap start and stop', () => {
            let s = new range_1.Range(2, 1, 1, 2);
            assert.equal(s.startLineNumber, 1);
            assert.equal(s.startColumn, 2);
            assert.equal(s.endLineNumber, 2);
            assert.equal(s.endColumn, 1);
            assert.equal(s.isEmpty(), false);
        });
        test('no swap same line', () => {
            let s = new range_1.Range(1, 1, 1, 2);
            assert.equal(s.startLineNumber, 1);
            assert.equal(s.startColumn, 1);
            assert.equal(s.endLineNumber, 1);
            assert.equal(s.endColumn, 2);
            assert.equal(s.isEmpty(), false);
        });
        test('no swap', () => {
            let s = new range_1.Range(1, 1, 2, 1);
            assert.equal(s.startLineNumber, 1);
            assert.equal(s.startColumn, 1);
            assert.equal(s.endLineNumber, 2);
            assert.equal(s.endColumn, 1);
            assert.equal(s.isEmpty(), false);
        });
        test('compareRangesUsingEnds', () => {
            let a, b;
            a = new range_1.Range(1, 1, 1, 3);
            b = new range_1.Range(1, 2, 1, 4);
            assert.ok(range_1.Range.compareRangesUsingEnds(a, b) < 0, 'a.start < b.start, a.end < b.end');
            a = new range_1.Range(1, 1, 1, 3);
            b = new range_1.Range(1, 1, 1, 4);
            assert.ok(range_1.Range.compareRangesUsingEnds(a, b) < 0, 'a.start = b.start, a.end < b.end');
            a = new range_1.Range(1, 2, 1, 3);
            b = new range_1.Range(1, 1, 1, 4);
            assert.ok(range_1.Range.compareRangesUsingEnds(a, b) < 0, 'a.start > b.start, a.end < b.end');
            a = new range_1.Range(1, 1, 1, 4);
            b = new range_1.Range(1, 2, 1, 4);
            assert.ok(range_1.Range.compareRangesUsingEnds(a, b) < 0, 'a.start < b.start, a.end = b.end');
            a = new range_1.Range(1, 1, 1, 4);
            b = new range_1.Range(1, 1, 1, 4);
            assert.ok(range_1.Range.compareRangesUsingEnds(a, b) === 0, 'a.start = b.start, a.end = b.end');
            a = new range_1.Range(1, 2, 1, 4);
            b = new range_1.Range(1, 1, 1, 4);
            assert.ok(range_1.Range.compareRangesUsingEnds(a, b) > 0, 'a.start > b.start, a.end = b.end');
            a = new range_1.Range(1, 1, 1, 5);
            b = new range_1.Range(1, 2, 1, 4);
            assert.ok(range_1.Range.compareRangesUsingEnds(a, b) > 0, 'a.start < b.start, a.end > b.end');
            a = new range_1.Range(1, 1, 2, 4);
            b = new range_1.Range(1, 1, 1, 4);
            assert.ok(range_1.Range.compareRangesUsingEnds(a, b) > 0, 'a.start = b.start, a.end > b.end');
            a = new range_1.Range(1, 1, 5, 1);
            b = new range_1.Range(1, 1, 1, 4);
            assert.ok(range_1.Range.compareRangesUsingEnds(a, b) > 0, 'a.start = b.start, a.end > b.end');
        });
        test('containsPosition', () => {
            assert.equal(new range_1.Range(2, 2, 5, 10).containsPosition(new position_1.Position(1, 3)), false);
            assert.equal(new range_1.Range(2, 2, 5, 10).containsPosition(new position_1.Position(2, 1)), false);
            assert.equal(new range_1.Range(2, 2, 5, 10).containsPosition(new position_1.Position(2, 2)), true);
            assert.equal(new range_1.Range(2, 2, 5, 10).containsPosition(new position_1.Position(2, 3)), true);
            assert.equal(new range_1.Range(2, 2, 5, 10).containsPosition(new position_1.Position(3, 1)), true);
            assert.equal(new range_1.Range(2, 2, 5, 10).containsPosition(new position_1.Position(5, 9)), true);
            assert.equal(new range_1.Range(2, 2, 5, 10).containsPosition(new position_1.Position(5, 10)), true);
            assert.equal(new range_1.Range(2, 2, 5, 10).containsPosition(new position_1.Position(5, 11)), false);
            assert.equal(new range_1.Range(2, 2, 5, 10).containsPosition(new position_1.Position(6, 1)), false);
        });
        test('containsRange', () => {
            assert.equal(new range_1.Range(2, 2, 5, 10).containsRange(new range_1.Range(1, 3, 2, 2)), false);
            assert.equal(new range_1.Range(2, 2, 5, 10).containsRange(new range_1.Range(2, 1, 2, 2)), false);
            assert.equal(new range_1.Range(2, 2, 5, 10).containsRange(new range_1.Range(2, 2, 5, 11)), false);
            assert.equal(new range_1.Range(2, 2, 5, 10).containsRange(new range_1.Range(2, 2, 6, 1)), false);
            assert.equal(new range_1.Range(2, 2, 5, 10).containsRange(new range_1.Range(5, 9, 6, 1)), false);
            assert.equal(new range_1.Range(2, 2, 5, 10).containsRange(new range_1.Range(5, 10, 6, 1)), false);
            assert.equal(new range_1.Range(2, 2, 5, 10).containsRange(new range_1.Range(2, 2, 5, 10)), true);
            assert.equal(new range_1.Range(2, 2, 5, 10).containsRange(new range_1.Range(2, 3, 5, 9)), true);
            assert.equal(new range_1.Range(2, 2, 5, 10).containsRange(new range_1.Range(3, 100, 4, 100)), true);
        });
        test('areIntersecting', () => {
            assert.equal(range_1.Range.areIntersecting(new range_1.Range(2, 2, 3, 2), new range_1.Range(4, 2, 5, 2)), false);
            assert.equal(range_1.Range.areIntersecting(new range_1.Range(4, 2, 5, 2), new range_1.Range(2, 2, 3, 2)), false);
            assert.equal(range_1.Range.areIntersecting(new range_1.Range(4, 2, 5, 2), new range_1.Range(5, 2, 6, 2)), false);
            assert.equal(range_1.Range.areIntersecting(new range_1.Range(5, 2, 6, 2), new range_1.Range(4, 2, 5, 2)), false);
            assert.equal(range_1.Range.areIntersecting(new range_1.Range(2, 2, 2, 7), new range_1.Range(2, 4, 2, 6)), true);
            assert.equal(range_1.Range.areIntersecting(new range_1.Range(2, 2, 2, 7), new range_1.Range(2, 4, 2, 9)), true);
            assert.equal(range_1.Range.areIntersecting(new range_1.Range(2, 4, 2, 9), new range_1.Range(2, 2, 2, 7)), true);
        });
    });
});
//# sourceMappingURL=range.test.js.map