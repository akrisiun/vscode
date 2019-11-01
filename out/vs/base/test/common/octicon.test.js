define(["require", "exports", "assert", "vs/base/common/octicon"], function (require, exports, assert, octicon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function filterOk(filter, word, target, highlights) {
        let r = filter(word, target);
        assert(r);
        if (highlights) {
            assert.deepEqual(r, highlights);
        }
    }
    suite('Octicon', () => {
        test('matchesFuzzzyOcticonAware', () => {
            // Camel Case
            filterOk(octicon_1.matchesFuzzyOcticonAware, 'ccr', octicon_1.parseOcticons('$(octicon)CamelCaseRocks$(octicon)'), [
                { start: 10, end: 11 },
                { start: 15, end: 16 },
                { start: 19, end: 20 }
            ]);
            filterOk(octicon_1.matchesFuzzyOcticonAware, 'ccr', octicon_1.parseOcticons('$(octicon) CamelCaseRocks $(octicon)'), [
                { start: 11, end: 12 },
                { start: 16, end: 17 },
                { start: 20, end: 21 }
            ]);
            filterOk(octicon_1.matchesFuzzyOcticonAware, 'iut', octicon_1.parseOcticons('$(octicon) Indent $(octico) Using $(octic) Tpaces'), [
                { start: 11, end: 12 },
                { start: 28, end: 29 },
                { start: 43, end: 44 },
            ]);
            // Prefix
            filterOk(octicon_1.matchesFuzzyOcticonAware, 'using', octicon_1.parseOcticons('$(octicon) Indent Using Spaces'), [
                { start: 18, end: 23 },
            ]);
            // Broken Octicon
            filterOk(octicon_1.matchesFuzzyOcticonAware, 'octicon', octicon_1.parseOcticons('This $(octicon Indent Using Spaces'), [
                { start: 7, end: 14 },
            ]);
            filterOk(octicon_1.matchesFuzzyOcticonAware, 'indent', octicon_1.parseOcticons('This $octicon Indent Using Spaces'), [
                { start: 14, end: 20 },
            ]);
            // Testing #59343
            filterOk(octicon_1.matchesFuzzyOcticonAware, 'unt', octicon_1.parseOcticons('$(primitive-dot) $(file-text) Untitled-1'), [
                { start: 30, end: 33 },
            ]);
        });
    });
});
//# sourceMappingURL=octicon.test.js.map