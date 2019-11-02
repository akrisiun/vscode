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
async function updateConfig(newConfig) {
    const oldConfig = {};
    const config = vscode.workspace.getConfiguration(undefined, testDocumentUri);
    for (const configKey of Object.keys(newConfig)) {
        oldConfig[configKey] = config.get(configKey);
        await new Promise((resolve, reject) => config.update(configKey, newConfig[configKey], vscode.ConfigurationTarget.Global)
            .then(() => resolve(), reject));
    }
    return oldConfig;
}
var Config;
(function (Config) {
    Config.suggestSelection = 'editor.suggestSelection';
    Config.completeFunctionCalls = 'typescript.suggest.completeFunctionCalls';
})(Config || (Config = {}));
suite('TypeScript Completions', () => {
    const configDefaults = Object.freeze({
        [Config.suggestSelection]: 'first',
        [Config.completeFunctionCalls]: false,
    });
    const _disposables = [];
    let oldConfig = {};
    setup(async () => {
        await testUtils_1.wait(100);
        // Save off config and apply defaults
        oldConfig = await updateConfig(configDefaults);
    });
    teardown(async () => {
        dispose_1.disposeAll(_disposables);
        // Restore config
        await updateConfig(oldConfig);
        return vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });
    test('Basic var completion', async () => {
        await testUtils_1.createTestEditor(testDocumentUri, `const abcdef = 123;`, `ab$0;`);
        const document = await suggestTestHelpers_1.acceptFirstSuggestion(testDocumentUri, _disposables);
        assert.strictEqual(document.getText(), testUtils_1.joinLines(`const abcdef = 123;`, `abcdef;`));
    });
    test('Should treat period as commit character for var completions', async () => {
        await testUtils_1.createTestEditor(testDocumentUri, `const abcdef = 123;`, `ab$0;`);
        const document = await suggestTestHelpers_1.typeCommitCharacter(testDocumentUri, '.', _disposables);
        assert.strictEqual(document.getText(), testUtils_1.joinLines(`const abcdef = 123;`, `abcdef.;`));
    });
    test('Should treat paren as commit character for function completions', async () => {
        await testUtils_1.createTestEditor(testDocumentUri, `function abcdef() {};`, `ab$0;`);
        const document = await suggestTestHelpers_1.typeCommitCharacter(testDocumentUri, '(', _disposables);
        assert.strictEqual(document.getText(), testUtils_1.joinLines(`function abcdef() {};`, `abcdef();`));
    });
    test('Should insert backets when completing dot properties with spaces in name', async () => {
        await testUtils_1.createTestEditor(testDocumentUri, 'const x = { "hello world": 1 };', 'x.$0');
        const document = await suggestTestHelpers_1.acceptFirstSuggestion(testDocumentUri, _disposables);
        assert.strictEqual(document.getText(), testUtils_1.joinLines('const x = { "hello world": 1 };', 'x["hello world"]'));
    });
    test('Should allow commit characters for backet completions', async () => {
        for (const { char, insert } of [
            { char: '.', insert: '.' },
            { char: '(', insert: '()' },
        ]) {
            await testUtils_1.createTestEditor(testDocumentUri, 'const x = { "hello world2": 1 };', 'x.$0');
            const document = await suggestTestHelpers_1.typeCommitCharacter(testDocumentUri, char, _disposables);
            assert.strictEqual(document.getText(), testUtils_1.joinLines('const x = { "hello world2": 1 };', `x["hello world2"]${insert}`));
            dispose_1.disposeAll(_disposables);
            await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        }
    });
    test('Should not prioritize bracket accessor completions. #63100', async () => {
        // 'a' should be first entry in completion list
        await testUtils_1.createTestEditor(testDocumentUri, 'const x = { "z-z": 1, a: 1 };', 'x.$0');
        const document = await suggestTestHelpers_1.acceptFirstSuggestion(testDocumentUri, _disposables);
        assert.strictEqual(document.getText(), testUtils_1.joinLines('const x = { "z-z": 1, a: 1 };', 'x.a'));
    });
    test('Accepting a string completion should replace the entire string. #53962', async () => {
        await testUtils_1.createTestEditor(testDocumentUri, 'interface TFunction {', `  (_: 'abc.abc2', __ ?: {}): string;`, `  (_: 'abc.abc', __?: {}): string;`, `}`, 'const f: TFunction = (() => { }) as any;', `f('abc.abc$0')`);
        const document = await suggestTestHelpers_1.acceptFirstSuggestion(testDocumentUri, _disposables, { useLineRange: true });
        assert.strictEqual(document.getText(), testUtils_1.joinLines('interface TFunction {', `  (_: 'abc.abc2', __ ?: {}): string;`, `  (_: 'abc.abc', __?: {}): string;`, `}`, 'const f: TFunction = (() => { }) as any;', `f('abc.abc')`));
    });
    test.skip('Accepting a member completion should result in valid code. #58597', async () => {
        await testUtils_1.createTestEditor(testDocumentUri, `const abc = 123;`, `ab$0c`);
        const document = await suggestTestHelpers_1.acceptFirstSuggestion(testDocumentUri, _disposables);
        assert.strictEqual(document.getText(), testUtils_1.joinLines(`const abc = 123;`, `abc`));
    });
    test('completeFunctionCalls should complete function parameters when at end of word', async () => {
        await updateConfig({
            [Config.completeFunctionCalls]: true,
        });
        // Complete with-in word
        await testUtils_1.createTestEditor(testDocumentUri, `function abcdef(x, y, z) { }`, `abcdef$0`);
        const document = await suggestTestHelpers_1.acceptFirstSuggestion(testDocumentUri, _disposables);
        assert.strictEqual(document.getText(), testUtils_1.joinLines(`function abcdef(x, y, z) { }`, `abcdef(x, y, z)`));
    });
    test.skip('completeFunctionCalls should complete function parameters when within word', async () => {
        await updateConfig({
            [Config.completeFunctionCalls]: true,
        });
        await testUtils_1.createTestEditor(testDocumentUri, `function abcdef(x, y, z) { }`, `abcd$0ef`);
        const document = await suggestTestHelpers_1.acceptFirstSuggestion(testDocumentUri, _disposables);
        assert.strictEqual(document.getText(), testUtils_1.joinLines(`function abcdef(x, y, z) { }`, `abcdef(x, y, z)`));
    });
    test('completeFunctionCalls should not complete function parameters at end of word if we are already in something that looks like a function call, #18131', async () => {
        await updateConfig({
            [Config.completeFunctionCalls]: true,
        });
        await testUtils_1.createTestEditor(testDocumentUri, `function abcdef(x, y, z) { }`, `abcdef$0(1, 2, 3)`);
        const document = await suggestTestHelpers_1.acceptFirstSuggestion(testDocumentUri, _disposables);
        assert.strictEqual(document.getText(), testUtils_1.joinLines(`function abcdef(x, y, z) { }`, `abcdef(1, 2, 3)`));
    });
    test.skip('completeFunctionCalls should not complete function parameters within word if we are already in something that looks like a function call, #18131', async () => {
        await updateConfig({
            [Config.completeFunctionCalls]: true,
        });
        await testUtils_1.createTestEditor(testDocumentUri, `function abcdef(x, y, z) { }`, `abcd$0ef(1, 2, 3)`);
        const document = await suggestTestHelpers_1.acceptFirstSuggestion(testDocumentUri, _disposables);
        assert.strictEqual(document.getText(), testUtils_1.joinLines(`function abcdef(x, y, z) { }`, `abcdef(1, 2, 3)`));
    });
    test('should not de-prioritized this.member suggestion, #74164', async () => {
        await testUtils_1.createTestEditor(testDocumentUri, `class A {`, `  private detail = '';`, `  foo() {`, `    det$0`, `  }`, `}`);
        const document = await suggestTestHelpers_1.acceptFirstSuggestion(testDocumentUri, _disposables);
        assert.strictEqual(document.getText(), testUtils_1.joinLines(`class A {`, `  private detail = '';`, `  foo() {`, `    this.detail`, `  }`, `}`));
    });
});
//# sourceMappingURL=completions.test.js.map