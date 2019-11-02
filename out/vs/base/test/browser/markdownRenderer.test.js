/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/marked/marked", "vs/base/browser/markdownRenderer"], function (require, exports, assert, marked, markdownRenderer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('MarkdownRenderer', () => {
        test('image rendering conforms to default', () => {
            const markdown = { value: `![image](someimageurl 'caption')` };
            const result = markdownRenderer_1.renderMarkdown(markdown);
            const renderer = new marked.Renderer();
            const imageFromMarked = marked(markdown.value, {
                sanitize: true,
                renderer
            }).trim();
            assert.strictEqual(result.innerHTML, imageFromMarked);
        });
        test('image rendering conforms to default without title', () => {
            const markdown = { value: `![image](someimageurl)` };
            const result = markdownRenderer_1.renderMarkdown(markdown);
            const renderer = new marked.Renderer();
            const imageFromMarked = marked(markdown.value, {
                sanitize: true,
                renderer
            }).trim();
            assert.strictEqual(result.innerHTML, imageFromMarked);
        });
        test('image width from title params', () => {
            let result = markdownRenderer_1.renderMarkdown({ value: `![image](someimageurl|width=100 'caption')` });
            assert.strictEqual(result.innerHTML, `<p><img src="someimageurl" alt="image" title="caption" width="100"></p>`);
        });
        test('image height from title params', () => {
            let result = markdownRenderer_1.renderMarkdown({ value: `![image](someimageurl|height=100 'caption')` });
            assert.strictEqual(result.innerHTML, `<p><img src="someimageurl" alt="image" title="caption" height="100"></p>`);
        });
        test('image width and height from title params', () => {
            let result = markdownRenderer_1.renderMarkdown({ value: `![image](someimageurl|height=200,width=100 'caption')` });
            assert.strictEqual(result.innerHTML, `<p><img src="someimageurl" alt="image" title="caption" width="100" height="200"></p>`);
        });
    });
});
//# sourceMappingURL=markdownRenderer.test.js.map