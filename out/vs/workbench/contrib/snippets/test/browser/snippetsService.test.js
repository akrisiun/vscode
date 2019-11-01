/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/snippets/browser/snippetCompletionProvider", "vs/editor/common/core/position", "vs/editor/common/modes/modesRegistry", "vs/editor/common/services/modeServiceImpl", "vs/editor/common/model/textModel", "vs/workbench/contrib/snippets/browser/snippetsFile", "vs/editor/common/modes/languageConfigurationRegistry"], function (require, exports, assert, snippetCompletionProvider_1, position_1, modesRegistry_1, modeServiceImpl_1, textModel_1, snippetsFile_1, languageConfigurationRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SimpleSnippetService {
        constructor(snippets) {
            this.snippets = snippets;
        }
        getSnippets() {
            return Promise.resolve(this.getSnippetsSync());
        }
        getSnippetsSync() {
            return this.snippets;
        }
        getSnippetFiles() {
            throw new Error();
        }
    }
    suite('SnippetsService', function () {
        suiteSetup(function () {
            modesRegistry_1.ModesRegistry.registerLanguage({
                id: 'fooLang',
                extensions: ['.fooLang',]
            });
        });
        let modeService;
        let snippetService;
        let context = { triggerKind: 0 /* Invoke */ };
        setup(function () {
            modeService = new modeServiceImpl_1.ModeServiceImpl();
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(['fooLang'], 'barTest', 'bar', '', 'barCodeSnippet', '', 1 /* User */), new snippetsFile_1.Snippet(['fooLang'], 'bazzTest', 'bazz', '', 'bazzCodeSnippet', '', 1 /* User */)]);
        });
        test('snippet completions - simple', function () {
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(modeService, snippetService);
            const model = textModel_1.TextModel.createFromString('', undefined, modeService.getLanguageIdentifier('fooLang'));
            return provider.provideCompletionItems(model, new position_1.Position(1, 1), context).then(result => {
                assert.equal(result.incomplete, undefined);
                assert.equal(result.suggestions.length, 2);
            });
        });
        test('snippet completions - with prefix', function () {
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(modeService, snippetService);
            const model = textModel_1.TextModel.createFromString('bar', undefined, modeService.getLanguageIdentifier('fooLang'));
            return provider.provideCompletionItems(model, new position_1.Position(1, 4), context).then(result => {
                assert.equal(result.incomplete, undefined);
                assert.equal(result.suggestions.length, 1);
                assert.equal(result.suggestions[0].label, 'bar');
                assert.equal(result.suggestions[0].range.startColumn, 1);
                assert.equal(result.suggestions[0].insertText, 'barCodeSnippet');
            });
        });
        test('snippet completions - with different prefixes', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(['fooLang'], 'barTest', 'bar', '', 's1', '', 1 /* User */), new snippetsFile_1.Snippet(['fooLang'], 'name', 'bar-bar', '', 's2', '', 1 /* User */)]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(modeService, snippetService);
            const model = textModel_1.TextModel.createFromString('bar-bar', undefined, modeService.getLanguageIdentifier('fooLang'));
            await provider.provideCompletionItems(model, new position_1.Position(1, 3), context).then(result => {
                assert.equal(result.incomplete, undefined);
                assert.equal(result.suggestions.length, 2);
                assert.equal(result.suggestions[0].label, 'bar');
                assert.equal(result.suggestions[0].insertText, 's1');
                assert.equal(result.suggestions[0].range.startColumn, 1);
                assert.equal(result.suggestions[1].label, 'bar-bar');
                assert.equal(result.suggestions[1].insertText, 's2');
                assert.equal(result.suggestions[1].range.startColumn, 1);
            });
            await provider.provideCompletionItems(model, new position_1.Position(1, 5), context).then(result => {
                assert.equal(result.incomplete, undefined);
                assert.equal(result.suggestions.length, 1);
                assert.equal(result.suggestions[0].label, 'bar-bar');
                assert.equal(result.suggestions[0].insertText, 's2');
                assert.equal(result.suggestions[0].range.startColumn, 1);
            });
            await provider.provideCompletionItems(model, new position_1.Position(1, 6), context).then(result => {
                assert.equal(result.incomplete, undefined);
                assert.equal(result.suggestions.length, 2);
                assert.equal(result.suggestions[0].label, 'bar');
                assert.equal(result.suggestions[0].insertText, 's1');
                assert.equal(result.suggestions[0].range.startColumn, 5);
                assert.equal(result.suggestions[1].label, 'bar-bar');
                assert.equal(result.suggestions[1].insertText, 's2');
                assert.equal(result.suggestions[1].range.startColumn, 1);
            });
        });
        test('Cannot use "<?php" as user snippet prefix anymore, #26275', function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(['fooLang'], '', '<?php', '', 'insert me', '', 1 /* User */)]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(modeService, snippetService);
            let model = textModel_1.TextModel.createFromString('\t<?php', undefined, modeService.getLanguageIdentifier('fooLang'));
            return provider.provideCompletionItems(model, new position_1.Position(1, 7), context).then(result => {
                assert.equal(result.suggestions.length, 1);
                model.dispose();
                model = textModel_1.TextModel.createFromString('\t<?', undefined, modeService.getLanguageIdentifier('fooLang'));
                return provider.provideCompletionItems(model, new position_1.Position(1, 4), context);
            }).then(result => {
                assert.equal(result.suggestions.length, 1);
                assert.equal(result.suggestions[0].range.startColumn, 2);
                model.dispose();
                model = textModel_1.TextModel.createFromString('a<?', undefined, modeService.getLanguageIdentifier('fooLang'));
                return provider.provideCompletionItems(model, new position_1.Position(1, 4), context);
            }).then(result => {
                assert.equal(result.suggestions.length, 1);
                assert.equal(result.suggestions[0].range.startColumn, 2);
                model.dispose();
            });
        });
        test('No user snippets in suggestions, when inside the code, #30508', function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(['fooLang'], '', 'foo', '', '<foo>$0</foo>', '', 1 /* User */)]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(modeService, snippetService);
            let model = textModel_1.TextModel.createFromString('<head>\n\t\n>/head>', undefined, modeService.getLanguageIdentifier('fooLang'));
            return provider.provideCompletionItems(model, new position_1.Position(1, 1), context).then(result => {
                assert.equal(result.suggestions.length, 1);
                return provider.provideCompletionItems(model, new position_1.Position(2, 2), context);
            }).then(result => {
                assert.equal(result.suggestions.length, 1);
            });
        });
        test('SnippetSuggest - ensure extension snippets come last ', function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(['fooLang'], 'second', 'second', '', 'second', '', 3 /* Extension */), new snippetsFile_1.Snippet(['fooLang'], 'first', 'first', '', 'first', '', 1 /* User */)]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(modeService, snippetService);
            let model = textModel_1.TextModel.createFromString('', undefined, modeService.getLanguageIdentifier('fooLang'));
            return provider.provideCompletionItems(model, new position_1.Position(1, 1), context).then(result => {
                assert.equal(result.suggestions.length, 2);
                let [first, second] = result.suggestions;
                assert.equal(first.label, 'first');
                assert.equal(second.label, 'second');
            });
        });
        test('Dash in snippets prefix broken #53945', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(['fooLang'], 'p-a', 'p-a', '', 'second', '', 1 /* User */)]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(modeService, snippetService);
            let model = textModel_1.TextModel.createFromString('p-', undefined, modeService.getLanguageIdentifier('fooLang'));
            let result = await provider.provideCompletionItems(model, new position_1.Position(1, 2), context);
            assert.equal(result.suggestions.length, 1);
            result = await provider.provideCompletionItems(model, new position_1.Position(1, 3), context);
            assert.equal(result.suggestions.length, 1);
            result = await provider.provideCompletionItems(model, new position_1.Position(1, 3), context);
            assert.equal(result.suggestions.length, 1);
        });
        test('No snippets suggestion on long lines beyond character 100 #58807', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(['fooLang'], 'bug', 'bug', '', 'second', '', 1 /* User */)]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(modeService, snippetService);
            let model = textModel_1.TextModel.createFromString('Thisisaverylonglinegoingwithmore100bcharactersandthismakesintellisensebecomea Thisisaverylonglinegoingwithmore100bcharactersandthismakesintellisensebecomea b', undefined, modeService.getLanguageIdentifier('fooLang'));
            let result = await provider.provideCompletionItems(model, new position_1.Position(1, 158), context);
            assert.equal(result.suggestions.length, 1);
        });
        test('Type colon will trigger snippet #60746', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(['fooLang'], 'bug', 'bug', '', 'second', '', 1 /* User */)]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(modeService, snippetService);
            let model = textModel_1.TextModel.createFromString(':', undefined, modeService.getLanguageIdentifier('fooLang'));
            let result = await provider.provideCompletionItems(model, new position_1.Position(1, 2), context);
            assert.equal(result.suggestions.length, 0);
        });
        test('substring of prefix can\'t trigger snippet #60737', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(['fooLang'], 'mytemplate', 'mytemplate', '', 'second', '', 1 /* User */)]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(modeService, snippetService);
            let model = textModel_1.TextModel.createFromString('template', undefined, modeService.getLanguageIdentifier('fooLang'));
            let result = await provider.provideCompletionItems(model, new position_1.Position(1, 9), context);
            assert.equal(result.suggestions.length, 1);
            assert.equal(result.suggestions[0].label, 'mytemplate');
        });
        test('No snippets suggestion beyond character 100 if not at end of line #60247', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(['fooLang'], 'bug', 'bug', '', 'second', '', 1 /* User */)]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(modeService, snippetService);
            let model = textModel_1.TextModel.createFromString('Thisisaverylonglinegoingwithmore100bcharactersandthismakesintellisensebecomea Thisisaverylonglinegoingwithmore100bcharactersandthismakesintellisensebecomea b text_after_b', undefined, modeService.getLanguageIdentifier('fooLang'));
            let result = await provider.provideCompletionItems(model, new position_1.Position(1, 158), context);
            assert.equal(result.suggestions.length, 1);
        });
        test('issue #61296: VS code freezes when editing CSS file with emoji', async function () {
            let toDispose = languageConfigurationRegistry_1.LanguageConfigurationRegistry.register(modeService.getLanguageIdentifier('fooLang'), {
                wordPattern: /(#?-?\d*\.\d\w*%?)|(::?[\w-]*(?=[^,{;]*[,{]))|(([@#.!])?[\w-?]+%?|[@#!.])/g
            });
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(['fooLang'], 'bug', '-a-bug', '', 'second', '', 1 /* User */)]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(modeService, snippetService);
            let model = textModel_1.TextModel.createFromString('.🐷-a-b', undefined, modeService.getLanguageIdentifier('fooLang'));
            let result = await provider.provideCompletionItems(model, new position_1.Position(1, 8), context);
            assert.equal(result.suggestions.length, 1);
            toDispose.dispose();
        });
        test('No snippets shown when triggering completions at whitespace on line that already has text #62335', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(['fooLang'], 'bug', 'bug', '', 'second', '', 1 /* User */)]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(modeService, snippetService);
            let model = textModel_1.TextModel.createFromString('a ', undefined, modeService.getLanguageIdentifier('fooLang'));
            let result = await provider.provideCompletionItems(model, new position_1.Position(1, 3), context);
            assert.equal(result.suggestions.length, 1);
        });
        test('Snippet prefix with special chars and numbers does not work #62906', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(['fooLang'], 'noblockwdelay', '<<', '', '<= #dly"', '', 1 /* User */), new snippetsFile_1.Snippet(['fooLang'], 'noblockwdelay', '11', '', 'eleven', '', 1 /* User */)]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(modeService, snippetService);
            let model = textModel_1.TextModel.createFromString(' <', undefined, modeService.getLanguageIdentifier('fooLang'));
            let result = await provider.provideCompletionItems(model, new position_1.Position(1, 3), context);
            assert.equal(result.suggestions.length, 1);
            let [first] = result.suggestions;
            assert.equal(first.range.startColumn, 2);
            model = textModel_1.TextModel.createFromString('1', undefined, modeService.getLanguageIdentifier('fooLang'));
            result = await provider.provideCompletionItems(model, new position_1.Position(1, 2), context);
            assert.equal(result.suggestions.length, 1);
            [first] = result.suggestions;
            assert.equal(first.range.startColumn, 1);
        });
    });
});
//# sourceMappingURL=snippetsService.test.js.map