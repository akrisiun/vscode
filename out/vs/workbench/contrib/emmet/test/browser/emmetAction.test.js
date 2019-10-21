/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/emmet/browser/emmetActions", "vs/editor/test/browser/testCodeEditor", "assert", "vs/editor/common/modes"], function (require, exports, emmetActions_1, testCodeEditor_1, assert, modes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //
    // To run the emmet tests only change .vscode/launch.json
    // {
    // 	"name": "Stacks Tests",
    // 	"type": "node",
    // 	"request": "launch",
    // 	"program": "${workspaceFolder}/node_modules/mocha/bin/_mocha",
    // 	"stopOnEntry": false,
    // 	"args": [
    // 		"--timeout",
    // 		"999999",
    // 		"--colors",
    // 		"-g",
    // 		"Stacks"   <<<--- Emmet
    // 	],
    // Select the 'Stacks Tests' launch config and F5
    //
    class MockGrammarContributions {
        constructor(scopeName) {
            this.scopeName = scopeName;
        }
        getGrammar(mode) {
            return this.scopeName;
        }
    }
    suite('Emmet', () => {
        test('Get language mode and parent mode for emmet', () => {
            testCodeEditor_1.withTestCodeEditor([], {}, (editor) => {
                function testIsEnabled(mode, scopeName, expectedLanguage, expectedParentLanguage) {
                    const languageIdentifier = new modes_1.LanguageIdentifier(mode, 73);
                    const languageIdentifierResolver = {
                        getLanguageIdentifier: (languageId) => {
                            if (languageId === 73) {
                                return languageIdentifier;
                            }
                            throw new Error('Unexpected');
                        }
                    };
                    const model = editor.getModel();
                    if (!model) {
                        assert.fail('Editor model not found');
                        return;
                    }
                    model.setMode(languageIdentifier);
                    let langOutput = emmetActions_1.EmmetEditorAction.getLanguage(languageIdentifierResolver, editor, new MockGrammarContributions(scopeName));
                    if (!langOutput) {
                        assert.fail('langOutput not found');
                        return;
                    }
                    assert.equal(langOutput.language, expectedLanguage);
                    assert.equal(langOutput.parentMode, expectedParentLanguage);
                }
                // syntaxes mapped using the scope name of the grammar
                testIsEnabled('markdown', 'text.html.markdown', 'markdown', 'html');
                testIsEnabled('handlebars', 'text.html.handlebars', 'handlebars', 'html');
                testIsEnabled('nunjucks', 'text.html.nunjucks', 'nunjucks', 'html');
                testIsEnabled('laravel-blade', 'text.html.php.laravel-blade', 'laravel-blade', 'html');
                // languages that have different Language Id and scopeName
                // testIsEnabled('razor', 'text.html.cshtml', 'razor', 'html');
                // testIsEnabled('HTML (Eex)', 'text.html.elixir', 'boo', 'html');
            });
        });
    });
});
//# sourceMappingURL=emmetAction.test.js.map