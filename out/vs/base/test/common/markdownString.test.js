/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/htmlContent"], function (require, exports, assert, htmlContent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('markdownString', () => {
        test('escape', () => {
            const mds = new htmlContent_1.MarkdownString();
            mds.appendText('# foo\n*bar*');
            assert.equal(mds.value, '\\# foo\n\n\\*bar\\*');
        });
    });
});
//# sourceMappingURL=markdownString.test.js.map