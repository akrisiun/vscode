"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
require("mocha");
const vscode = require("vscode");
const dispose_1 = require("../utils/dispose");
const testUtils_1 = require("./testUtils");
const suggestTestHelpers_1 = require("./suggestTestHelpers");
const testDocumentUri = vscode.Uri.parse('untitled:test.ts');
suite('JSDoc Completions', () => {
    const _disposables = [];
    setup(async () => {
        await testUtils_1.wait(100);
    });
    teardown(async () => {
        dispose_1.disposeAll(_disposables);
    });
    test('Should complete jsdoc inside single line comment', async () => {
        await testUtils_1.createTestEditor(testDocumentUri, `/**$0 */`, `function abcdef(x, y) { }`);
        const document = await suggestTestHelpers_1.acceptFirstSuggestion(testDocumentUri, _disposables, { useLineRange: true });
        assert.strictEqual(document.getText(), testUtils_1.joinLines(`/**`, ` *`, ` * @param {*} x `, ` * @param {*} y `, ` */`, `function abcdef(x, y) { }`));
    });
});
//# sourceMappingURL=jsDocCompletions.test.js.map