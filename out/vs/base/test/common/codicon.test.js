define(["require", "exports", "assert", "vs/base/common/codicon"], function (require, exports, assert, codicon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function filterOk(filter, word, target, highlights) {
        let r = filter(word, target);
        assert(r);
        if (highlights) {
            assert.deepEqual(r, highlights);
        }
    }
    suite('Codicon', () => {
        test('matchesFuzzzyCodiconAware', () => {
            // Camel Case
            filterOk(codicon_1.matchesFuzzyCodiconAware, 'ccr', codicon_1.parseCodicons('$(codicon)CamelCaseRocks$(codicon)'), [
                { start: 10, end: 11 },
                { start: 15, end: 16 },
                { start: 19, end: 20 }
            ]);
            filterOk(codicon_1.matchesFuzzyCodiconAware, 'ccr', codicon_1.parseCodicons('$(codicon) CamelCaseRocks $(codicon)'), [
                { start: 11, end: 12 },
                { start: 16, end: 17 },
                { start: 20, end: 21 }
            ]);
            filterOk(codicon_1.matchesFuzzyCodiconAware, 'iut', codicon_1.parseCodicons('$(codicon) Indent $(octico) Using $(octic) Tpaces'), [
                { start: 11, end: 12 },
                { start: 28, end: 29 },
                { start: 43, end: 44 },
            ]);
            // Prefix
            filterOk(codicon_1.matchesFuzzyCodiconAware, 'using', codicon_1.parseCodicons('$(codicon) Indent Using Spaces'), [
                { start: 18, end: 23 },
            ]);
            // Broken Codicon
            filterOk(codicon_1.matchesFuzzyCodiconAware, 'codicon', codicon_1.parseCodicons('This $(codicon Indent Using Spaces'), [
                { start: 7, end: 14 },
            ]);
            filterOk(codicon_1.matchesFuzzyCodiconAware, 'indent', codicon_1.parseCodicons('This $codicon Indent Using Spaces'), [
                { start: 14, end: 20 },
            ]);
            // Testing #59343
            filterOk(codicon_1.matchesFuzzyCodiconAware, 'unt', codicon_1.parseCodicons('$(primitive-dot) $(file-text) Untitled-1'), [
                { start: 30, end: 33 },
            ]);
        });
    });
});
//# sourceMappingURL=codicon.test.js.map