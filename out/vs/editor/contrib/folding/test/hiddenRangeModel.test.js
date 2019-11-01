define(["require", "exports", "assert", "vs/editor/contrib/folding/foldingModel", "vs/editor/common/model/textModel", "vs/editor/contrib/folding/indentRangeProvider", "./foldingModel.test", "vs/editor/contrib/folding/hiddenRangeModel"], function (require, exports, assert, foldingModel_1, textModel_1, indentRangeProvider_1, foldingModel_test_1, hiddenRangeModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Hidden Range Model', () => {
        function r(startLineNumber, endLineNumber) {
            return { startLineNumber, endLineNumber };
        }
        function assertRanges(actual, expectedRegions, message) {
            assert.deepEqual(actual.map(r => ({ startLineNumber: r.startLineNumber, endLineNumber: r.endLineNumber })), expectedRegions, message);
        }
        test('hasRanges', () => {
            let lines = [
                /* 1*/ '/**',
                /* 2*/ ' * Comment',
                /* 3*/ ' */',
                /* 4*/ 'class A {',
                /* 5*/ '  void foo() {',
                /* 6*/ '    if (true) {',
                /* 7*/ '      //hello',
                /* 8*/ '    }',
                /* 9*/ '  }',
                /* 10*/ '}'
            ];
            let textModel = textModel_1.TextModel.createFromString(lines.join('\n'));
            let foldingModel = new foldingModel_1.FoldingModel(textModel, new foldingModel_test_1.TestDecorationProvider(textModel));
            let hiddenRangeModel = new hiddenRangeModel_1.HiddenRangeModel(foldingModel);
            assert.equal(hiddenRangeModel.hasRanges(), false);
            let ranges = indentRangeProvider_1.computeRanges(textModel, false, undefined);
            foldingModel.update(ranges);
            foldingModel.toggleCollapseState([foldingModel.getRegionAtLine(1), foldingModel.getRegionAtLine(6)]);
            assertRanges(hiddenRangeModel.hiddenRanges, [r(2, 3), r(7, 7)]);
            assert.equal(hiddenRangeModel.hasRanges(), true);
            assert.equal(hiddenRangeModel.isHidden(1), false);
            assert.equal(hiddenRangeModel.isHidden(2), true);
            assert.equal(hiddenRangeModel.isHidden(3), true);
            assert.equal(hiddenRangeModel.isHidden(4), false);
            assert.equal(hiddenRangeModel.isHidden(5), false);
            assert.equal(hiddenRangeModel.isHidden(6), false);
            assert.equal(hiddenRangeModel.isHidden(7), true);
            assert.equal(hiddenRangeModel.isHidden(8), false);
            assert.equal(hiddenRangeModel.isHidden(9), false);
            assert.equal(hiddenRangeModel.isHidden(10), false);
            foldingModel.toggleCollapseState([foldingModel.getRegionAtLine(4)]);
            assertRanges(hiddenRangeModel.hiddenRanges, [r(2, 3), r(5, 9)]);
            assert.equal(hiddenRangeModel.hasRanges(), true);
            assert.equal(hiddenRangeModel.isHidden(1), false);
            assert.equal(hiddenRangeModel.isHidden(2), true);
            assert.equal(hiddenRangeModel.isHidden(3), true);
            assert.equal(hiddenRangeModel.isHidden(4), false);
            assert.equal(hiddenRangeModel.isHidden(5), true);
            assert.equal(hiddenRangeModel.isHidden(6), true);
            assert.equal(hiddenRangeModel.isHidden(7), true);
            assert.equal(hiddenRangeModel.isHidden(8), true);
            assert.equal(hiddenRangeModel.isHidden(9), true);
            assert.equal(hiddenRangeModel.isHidden(10), false);
            foldingModel.toggleCollapseState([foldingModel.getRegionAtLine(1), foldingModel.getRegionAtLine(6), foldingModel.getRegionAtLine(4)]);
            assertRanges(hiddenRangeModel.hiddenRanges, []);
            assert.equal(hiddenRangeModel.hasRanges(), false);
            assert.equal(hiddenRangeModel.isHidden(1), false);
            assert.equal(hiddenRangeModel.isHidden(2), false);
            assert.equal(hiddenRangeModel.isHidden(3), false);
            assert.equal(hiddenRangeModel.isHidden(4), false);
            assert.equal(hiddenRangeModel.isHidden(5), false);
            assert.equal(hiddenRangeModel.isHidden(6), false);
            assert.equal(hiddenRangeModel.isHidden(7), false);
            assert.equal(hiddenRangeModel.isHidden(8), false);
            assert.equal(hiddenRangeModel.isHidden(9), false);
            assert.equal(hiddenRangeModel.isHidden(10), false);
        });
    });
});
//# sourceMappingURL=hiddenRangeModel.test.js.map