define(["require", "exports", "assert", "vs/workbench/services/search/common/search"], function (require, exports, assert, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('TextSearchResult', () => {
        const previewOptions1 = {
            matchLines: 1,
            charsPerLine: 100
        };
        function assertOneLinePreviewRangeText(text, result) {
            assert.equal(result.preview.text.substring(result.preview.matches.startColumn, result.preview.matches.endColumn), text);
        }
        test('empty without preview options', () => {
            const range = new search_1.OneLineRange(5, 0, 0);
            const result = new search_1.TextSearchMatch('', range);
            assert.deepEqual(result.ranges, range);
            assertOneLinePreviewRangeText('', result);
        });
        test('empty with preview options', () => {
            const range = new search_1.OneLineRange(5, 0, 0);
            const result = new search_1.TextSearchMatch('', range, previewOptions1);
            assert.deepEqual(result.ranges, range);
            assertOneLinePreviewRangeText('', result);
        });
        test('short without preview options', () => {
            const range = new search_1.OneLineRange(5, 4, 7);
            const result = new search_1.TextSearchMatch('foo bar', range);
            assert.deepEqual(result.ranges, range);
            assertOneLinePreviewRangeText('bar', result);
        });
        test('short with preview options', () => {
            const range = new search_1.OneLineRange(5, 4, 7);
            const result = new search_1.TextSearchMatch('foo bar', range, previewOptions1);
            assert.deepEqual(result.ranges, range);
            assertOneLinePreviewRangeText('bar', result);
        });
        test('leading', () => {
            const range = new search_1.OneLineRange(5, 25, 28);
            const result = new search_1.TextSearchMatch('long text very long text foo', range, previewOptions1);
            assert.deepEqual(result.ranges, range);
            assertOneLinePreviewRangeText('foo', result);
        });
        test('trailing', () => {
            const range = new search_1.OneLineRange(5, 0, 3);
            const result = new search_1.TextSearchMatch('foo long text very long text long text very long text long text very long text long text very long text long text very long text', range, previewOptions1);
            assert.deepEqual(result.ranges, range);
            assertOneLinePreviewRangeText('foo', result);
        });
        test('middle', () => {
            const range = new search_1.OneLineRange(5, 30, 33);
            const result = new search_1.TextSearchMatch('long text very long text long foo text very long text long text very long text long text very long text long text very long text', range, previewOptions1);
            assert.deepEqual(result.ranges, range);
            assertOneLinePreviewRangeText('foo', result);
        });
        test('truncating match', () => {
            const previewOptions = {
                matchLines: 1,
                charsPerLine: 1
            };
            const range = new search_1.OneLineRange(0, 4, 7);
            const result = new search_1.TextSearchMatch('foo bar', range, previewOptions);
            assert.deepEqual(result.ranges, range);
            assertOneLinePreviewRangeText('b', result);
        });
        test('one line of multiline match', () => {
            const previewOptions = {
                matchLines: 1,
                charsPerLine: 10000
            };
            const range = new search_1.SearchRange(5, 4, 6, 3);
            const result = new search_1.TextSearchMatch('foo bar\nfoo bar', range, previewOptions);
            assert.deepEqual(result.ranges, range);
            assert.equal(result.preview.text, 'foo bar\nfoo bar');
            assert.equal(result.preview.matches.startLineNumber, 0);
            assert.equal(result.preview.matches.startColumn, 4);
            assert.equal(result.preview.matches.endLineNumber, 1);
            assert.equal(result.preview.matches.endColumn, 3);
        });
        // test('all lines of multiline match', () => {
        // 	const previewOptions: ITextSearchPreviewOptions = {
        // 		matchLines: 5,
        // 		charsPerLine: 10000
        // 	};
        // 	const range = new SearchRange(5, 4, 6, 3);
        // 	const result = new TextSearchResult('foo bar\nfoo bar', range, previewOptions);
        // 	assert.deepEqual(result.range, range);
        // 	assertPreviewRangeText('bar\nfoo', result);
        // });
    });
});
//# sourceMappingURL=search.test.js.map