/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/core/token", "vs/editor/common/modes", "vs/editor/common/modes/textToHtmlTokenizer", "vs/editor/test/common/core/viewLineToken", "vs/editor/test/common/mocks/mockMode"], function (require, exports, assert, token_1, modes_1, textToHtmlTokenizer_1, viewLineToken_1, mockMode_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Editor Modes - textToHtmlTokenizer', () => {
        function toStr(pieces) {
            let resultArr = pieces.map((t) => `<span class="${t.className}">${t.text}</span>`);
            return resultArr.join('');
        }
        test('TextToHtmlTokenizer 1', () => {
            let mode = new Mode();
            let support = modes_1.TokenizationRegistry.get(mode.getId());
            let actual = textToHtmlTokenizer_1.tokenizeToString('.abc..def...gh', support);
            let expected = [
                { className: 'mtk7', text: '.' },
                { className: 'mtk9', text: 'abc' },
                { className: 'mtk7', text: '..' },
                { className: 'mtk9', text: 'def' },
                { className: 'mtk7', text: '...' },
                { className: 'mtk9', text: 'gh' },
            ];
            let expectedStr = `<div class="monaco-tokenized-source">${toStr(expected)}</div>`;
            assert.equal(actual, expectedStr);
            mode.dispose();
        });
        test('TextToHtmlTokenizer 2', () => {
            let mode = new Mode();
            let support = modes_1.TokenizationRegistry.get(mode.getId());
            let actual = textToHtmlTokenizer_1.tokenizeToString('.abc..def...gh\n.abc..def...gh', support);
            let expected1 = [
                { className: 'mtk7', text: '.' },
                { className: 'mtk9', text: 'abc' },
                { className: 'mtk7', text: '..' },
                { className: 'mtk9', text: 'def' },
                { className: 'mtk7', text: '...' },
                { className: 'mtk9', text: 'gh' },
            ];
            let expected2 = [
                { className: 'mtk7', text: '.' },
                { className: 'mtk9', text: 'abc' },
                { className: 'mtk7', text: '..' },
                { className: 'mtk9', text: 'def' },
                { className: 'mtk7', text: '...' },
                { className: 'mtk9', text: 'gh' },
            ];
            let expectedStr1 = toStr(expected1);
            let expectedStr2 = toStr(expected2);
            let expectedStr = `<div class="monaco-tokenized-source">${expectedStr1}<br/>${expectedStr2}</div>`;
            assert.equal(actual, expectedStr);
            mode.dispose();
        });
        test('tokenizeLineToHTML', () => {
            const text = 'Ciao hello world!';
            const lineTokens = new viewLineToken_1.ViewLineTokens([
                new viewLineToken_1.ViewLineToken(4, ((3 << 14 /* FOREGROUND_OFFSET */)
                    | ((2 /* Bold */ | 1 /* Italic */) << 11 /* FONT_STYLE_OFFSET */)) >>> 0),
                new viewLineToken_1.ViewLineToken(5, ((1 << 14 /* FOREGROUND_OFFSET */)) >>> 0),
                new viewLineToken_1.ViewLineToken(10, ((4 << 14 /* FOREGROUND_OFFSET */)) >>> 0),
                new viewLineToken_1.ViewLineToken(11, ((1 << 14 /* FOREGROUND_OFFSET */)) >>> 0),
                new viewLineToken_1.ViewLineToken(17, ((5 << 14 /* FOREGROUND_OFFSET */)
                    | ((4 /* Underline */) << 11 /* FONT_STYLE_OFFSET */)) >>> 0)
            ]);
            const colorMap = [null, '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff'];
            assert.equal(textToHtmlTokenizer_1.tokenizeLineToHTML(text, lineTokens, colorMap, 0, 17, 4), [
                '<div>',
                '<span style="color: #ff0000;font-style: italic;font-weight: bold;">Ciao</span>',
                '<span style="color: #000000;">&nbsp;</span>',
                '<span style="color: #00ff00;">hello</span>',
                '<span style="color: #000000;">&nbsp;</span>',
                '<span style="color: #0000ff;text-decoration: underline;">world!</span>',
                '</div>'
            ].join(''));
            assert.equal(textToHtmlTokenizer_1.tokenizeLineToHTML(text, lineTokens, colorMap, 0, 12, 4), [
                '<div>',
                '<span style="color: #ff0000;font-style: italic;font-weight: bold;">Ciao</span>',
                '<span style="color: #000000;">&nbsp;</span>',
                '<span style="color: #00ff00;">hello</span>',
                '<span style="color: #000000;">&nbsp;</span>',
                '<span style="color: #0000ff;text-decoration: underline;">w</span>',
                '</div>'
            ].join(''));
            assert.equal(textToHtmlTokenizer_1.tokenizeLineToHTML(text, lineTokens, colorMap, 0, 11, 4), [
                '<div>',
                '<span style="color: #ff0000;font-style: italic;font-weight: bold;">Ciao</span>',
                '<span style="color: #000000;">&nbsp;</span>',
                '<span style="color: #00ff00;">hello</span>',
                '<span style="color: #000000;">&nbsp;</span>',
                '</div>'
            ].join(''));
            assert.equal(textToHtmlTokenizer_1.tokenizeLineToHTML(text, lineTokens, colorMap, 1, 11, 4), [
                '<div>',
                '<span style="color: #ff0000;font-style: italic;font-weight: bold;">iao</span>',
                '<span style="color: #000000;">&nbsp;</span>',
                '<span style="color: #00ff00;">hello</span>',
                '<span style="color: #000000;">&nbsp;</span>',
                '</div>'
            ].join(''));
            assert.equal(textToHtmlTokenizer_1.tokenizeLineToHTML(text, lineTokens, colorMap, 4, 11, 4), [
                '<div>',
                '<span style="color: #000000;">&nbsp;</span>',
                '<span style="color: #00ff00;">hello</span>',
                '<span style="color: #000000;">&nbsp;</span>',
                '</div>'
            ].join(''));
            assert.equal(textToHtmlTokenizer_1.tokenizeLineToHTML(text, lineTokens, colorMap, 5, 11, 4), [
                '<div>',
                '<span style="color: #00ff00;">hello</span>',
                '<span style="color: #000000;">&nbsp;</span>',
                '</div>'
            ].join(''));
            assert.equal(textToHtmlTokenizer_1.tokenizeLineToHTML(text, lineTokens, colorMap, 5, 10, 4), [
                '<div>',
                '<span style="color: #00ff00;">hello</span>',
                '</div>'
            ].join(''));
            assert.equal(textToHtmlTokenizer_1.tokenizeLineToHTML(text, lineTokens, colorMap, 6, 9, 4), [
                '<div>',
                '<span style="color: #00ff00;">ell</span>',
                '</div>'
            ].join(''));
        });
        test('tokenizeLineToHTML handle spaces #35954', () => {
            const text = '  Ciao   hello world!';
            const lineTokens = new viewLineToken_1.ViewLineTokens([
                new viewLineToken_1.ViewLineToken(2, ((1 << 14 /* FOREGROUND_OFFSET */)) >>> 0),
                new viewLineToken_1.ViewLineToken(6, ((3 << 14 /* FOREGROUND_OFFSET */)
                    | ((2 /* Bold */ | 1 /* Italic */) << 11 /* FONT_STYLE_OFFSET */)) >>> 0),
                new viewLineToken_1.ViewLineToken(9, ((1 << 14 /* FOREGROUND_OFFSET */)) >>> 0),
                new viewLineToken_1.ViewLineToken(14, ((4 << 14 /* FOREGROUND_OFFSET */)) >>> 0),
                new viewLineToken_1.ViewLineToken(15, ((1 << 14 /* FOREGROUND_OFFSET */)) >>> 0),
                new viewLineToken_1.ViewLineToken(21, ((5 << 14 /* FOREGROUND_OFFSET */)
                    | ((4 /* Underline */) << 11 /* FONT_STYLE_OFFSET */)) >>> 0)
            ]);
            const colorMap = [null, '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff'];
            assert.equal(textToHtmlTokenizer_1.tokenizeLineToHTML(text, lineTokens, colorMap, 0, 21, 4), [
                '<div>',
                '<span style="color: #000000;">&nbsp;&nbsp;</span>',
                '<span style="color: #ff0000;font-style: italic;font-weight: bold;">Ciao</span>',
                '<span style="color: #000000;">&nbsp;&nbsp;&nbsp;</span>',
                '<span style="color: #00ff00;">hello</span>',
                '<span style="color: #000000;">&nbsp;</span>',
                '<span style="color: #0000ff;text-decoration: underline;">world!</span>',
                '</div>'
            ].join(''));
            assert.equal(textToHtmlTokenizer_1.tokenizeLineToHTML(text, lineTokens, colorMap, 0, 17, 4), [
                '<div>',
                '<span style="color: #000000;">&nbsp;&nbsp;</span>',
                '<span style="color: #ff0000;font-style: italic;font-weight: bold;">Ciao</span>',
                '<span style="color: #000000;">&nbsp;&nbsp;&nbsp;</span>',
                '<span style="color: #00ff00;">hello</span>',
                '<span style="color: #000000;">&nbsp;</span>',
                '<span style="color: #0000ff;text-decoration: underline;">wo</span>',
                '</div>'
            ].join(''));
            assert.equal(textToHtmlTokenizer_1.tokenizeLineToHTML(text, lineTokens, colorMap, 0, 3, 4), [
                '<div>',
                '<span style="color: #000000;">&nbsp;&nbsp;</span>',
                '<span style="color: #ff0000;font-style: italic;font-weight: bold;">C</span>',
                '</div>'
            ].join(''));
        });
    });
    class Mode extends mockMode_1.MockMode {
        constructor() {
            super(Mode._id);
            this._register(modes_1.TokenizationRegistry.register(this.getId(), {
                getInitialState: () => null,
                tokenize: undefined,
                tokenize2: (line, state) => {
                    let tokensArr = [];
                    let prevColor = -1;
                    for (let i = 0; i < line.length; i++) {
                        let colorId = line.charAt(i) === '.' ? 7 : 9;
                        if (prevColor !== colorId) {
                            tokensArr.push(i);
                            tokensArr.push((colorId << 14 /* FOREGROUND_OFFSET */) >>> 0);
                        }
                        prevColor = colorId;
                    }
                    let tokens = new Uint32Array(tokensArr.length);
                    for (let i = 0; i < tokens.length; i++) {
                        tokens[i] = tokensArr[i];
                    }
                    return new token_1.TokenizationResult2(tokens, null);
                }
            }));
        }
    }
    Mode._id = new modes_1.LanguageIdentifier('textToHtmlTokenizerMode', 3);
});
//# sourceMappingURL=textToHtmlTokenizer.test.js.map