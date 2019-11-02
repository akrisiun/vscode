define(["require", "exports", "assert", "vs/editor/common/core/position", "vs/editor/common/core/selection", "vs/editor/common/model/textModel", "vs/editor/common/modes", "vs/editor/common/modes/languageConfigurationRegistry", "vs/editor/contrib/bracketMatching/bracketMatching", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/common/mocks/mockMode"], function (require, exports, assert, position_1, selection_1, textModel_1, modes_1, languageConfigurationRegistry_1, bracketMatching_1, testCodeEditor_1, mockMode_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('bracket matching', () => {
        class BracketMode extends mockMode_1.MockMode {
            constructor() {
                super(BracketMode._id);
                this._register(languageConfigurationRegistry_1.LanguageConfigurationRegistry.register(this.getLanguageIdentifier(), {
                    brackets: [
                        ['{', '}'],
                        ['[', ']'],
                        ['(', ')'],
                    ]
                }));
            }
        }
        BracketMode._id = new modes_1.LanguageIdentifier('bracketMode', 3);
        test('issue #183: jump to matching bracket position', () => {
            let mode = new BracketMode();
            let model = textModel_1.TextModel.createFromString('var x = (3 + (5-7)) + ((5+3)+5);', undefined, mode.getLanguageIdentifier());
            testCodeEditor_1.withTestCodeEditor(null, { model: model }, (editor, cursor) => {
                let bracketMatchingController = editor.registerAndInstantiateContribution(bracketMatching_1.BracketMatchingController.ID, bracketMatching_1.BracketMatchingController);
                // start on closing bracket
                editor.setPosition(new position_1.Position(1, 20));
                bracketMatchingController.jumpToBracket();
                assert.deepEqual(editor.getPosition(), new position_1.Position(1, 9));
                bracketMatchingController.jumpToBracket();
                assert.deepEqual(editor.getPosition(), new position_1.Position(1, 19));
                bracketMatchingController.jumpToBracket();
                assert.deepEqual(editor.getPosition(), new position_1.Position(1, 9));
                // start on opening bracket
                editor.setPosition(new position_1.Position(1, 23));
                bracketMatchingController.jumpToBracket();
                assert.deepEqual(editor.getPosition(), new position_1.Position(1, 31));
                bracketMatchingController.jumpToBracket();
                assert.deepEqual(editor.getPosition(), new position_1.Position(1, 23));
                bracketMatchingController.jumpToBracket();
                assert.deepEqual(editor.getPosition(), new position_1.Position(1, 31));
                bracketMatchingController.dispose();
            });
            model.dispose();
            mode.dispose();
        });
        test('Jump to next bracket', () => {
            let mode = new BracketMode();
            let model = textModel_1.TextModel.createFromString('var x = (3 + (5-7)); y();', undefined, mode.getLanguageIdentifier());
            testCodeEditor_1.withTestCodeEditor(null, { model: model }, (editor, cursor) => {
                let bracketMatchingController = editor.registerAndInstantiateContribution(bracketMatching_1.BracketMatchingController.ID, bracketMatching_1.BracketMatchingController);
                // start position between brackets
                editor.setPosition(new position_1.Position(1, 16));
                bracketMatchingController.jumpToBracket();
                assert.deepEqual(editor.getPosition(), new position_1.Position(1, 18));
                bracketMatchingController.jumpToBracket();
                assert.deepEqual(editor.getPosition(), new position_1.Position(1, 14));
                bracketMatchingController.jumpToBracket();
                assert.deepEqual(editor.getPosition(), new position_1.Position(1, 18));
                // skip brackets in comments
                editor.setPosition(new position_1.Position(1, 21));
                bracketMatchingController.jumpToBracket();
                assert.deepEqual(editor.getPosition(), new position_1.Position(1, 23));
                bracketMatchingController.jumpToBracket();
                assert.deepEqual(editor.getPosition(), new position_1.Position(1, 24));
                bracketMatchingController.jumpToBracket();
                assert.deepEqual(editor.getPosition(), new position_1.Position(1, 23));
                // do not break if no brackets are available
                editor.setPosition(new position_1.Position(1, 26));
                bracketMatchingController.jumpToBracket();
                assert.deepEqual(editor.getPosition(), new position_1.Position(1, 26));
                bracketMatchingController.dispose();
            });
            model.dispose();
            mode.dispose();
        });
        test('Select to next bracket', () => {
            let mode = new BracketMode();
            let model = textModel_1.TextModel.createFromString('var x = (3 + (5-7)); y();', undefined, mode.getLanguageIdentifier());
            testCodeEditor_1.withTestCodeEditor(null, { model: model }, (editor, cursor) => {
                let bracketMatchingController = editor.registerAndInstantiateContribution(bracketMatching_1.BracketMatchingController.ID, bracketMatching_1.BracketMatchingController);
                // start position in open brackets
                editor.setPosition(new position_1.Position(1, 9));
                bracketMatchingController.selectToBracket(true);
                assert.deepEqual(editor.getPosition(), new position_1.Position(1, 20));
                assert.deepEqual(editor.getSelection(), new selection_1.Selection(1, 9, 1, 20));
                // start position in close brackets
                editor.setPosition(new position_1.Position(1, 20));
                bracketMatchingController.selectToBracket(true);
                assert.deepEqual(editor.getPosition(), new position_1.Position(1, 20));
                assert.deepEqual(editor.getSelection(), new selection_1.Selection(1, 9, 1, 20));
                // start position between brackets
                editor.setPosition(new position_1.Position(1, 16));
                bracketMatchingController.selectToBracket(true);
                assert.deepEqual(editor.getPosition(), new position_1.Position(1, 19));
                assert.deepEqual(editor.getSelection(), new selection_1.Selection(1, 14, 1, 19));
                // start position outside brackets
                editor.setPosition(new position_1.Position(1, 21));
                bracketMatchingController.selectToBracket(true);
                assert.deepEqual(editor.getPosition(), new position_1.Position(1, 25));
                assert.deepEqual(editor.getSelection(), new selection_1.Selection(1, 23, 1, 25));
                // do not break if no brackets are available
                editor.setPosition(new position_1.Position(1, 26));
                bracketMatchingController.selectToBracket(true);
                assert.deepEqual(editor.getPosition(), new position_1.Position(1, 26));
                assert.deepEqual(editor.getSelection(), new selection_1.Selection(1, 26, 1, 26));
                bracketMatchingController.dispose();
            });
            model.dispose();
            mode.dispose();
        });
        test('issue #1772: jump to enclosing brackets', () => {
            const text = [
                'const x = {',
                '    something: [0, 1, 2],',
                '    another: true,',
                '    somethingmore: [0, 2, 4]',
                '};',
            ].join('\n');
            const mode = new BracketMode();
            const model = textModel_1.TextModel.createFromString(text, undefined, mode.getLanguageIdentifier());
            testCodeEditor_1.withTestCodeEditor(null, { model: model }, (editor, cursor) => {
                const bracketMatchingController = editor.registerAndInstantiateContribution(bracketMatching_1.BracketMatchingController.ID, bracketMatching_1.BracketMatchingController);
                editor.setPosition(new position_1.Position(3, 5));
                bracketMatchingController.jumpToBracket();
                assert.deepEqual(editor.getSelection(), new selection_1.Selection(5, 1, 5, 1));
                bracketMatchingController.dispose();
            });
            model.dispose();
            mode.dispose();
        });
        test('issue #43371: argument to not select brackets', () => {
            const text = [
                'const x = {',
                '    something: [0, 1, 2],',
                '    another: true,',
                '    somethingmore: [0, 2, 4]',
                '};',
            ].join('\n');
            const mode = new BracketMode();
            const model = textModel_1.TextModel.createFromString(text, undefined, mode.getLanguageIdentifier());
            testCodeEditor_1.withTestCodeEditor(null, { model: model }, (editor, cursor) => {
                const bracketMatchingController = editor.registerAndInstantiateContribution(bracketMatching_1.BracketMatchingController.ID, bracketMatching_1.BracketMatchingController);
                editor.setPosition(new position_1.Position(3, 5));
                bracketMatchingController.selectToBracket(false);
                assert.deepEqual(editor.getSelection(), new selection_1.Selection(1, 12, 5, 1));
                bracketMatchingController.dispose();
            });
            model.dispose();
            mode.dispose();
        });
        test('issue #45369: Select to Bracket with multicursor', () => {
            let mode = new BracketMode();
            let model = textModel_1.TextModel.createFromString('{  }   {   }   { }', undefined, mode.getLanguageIdentifier());
            testCodeEditor_1.withTestCodeEditor(null, { model: model }, (editor, cursor) => {
                let bracketMatchingController = editor.registerAndInstantiateContribution(bracketMatching_1.BracketMatchingController.ID, bracketMatching_1.BracketMatchingController);
                // cursors inside brackets become selections of the entire bracket contents
                editor.setSelections([
                    new selection_1.Selection(1, 3, 1, 3),
                    new selection_1.Selection(1, 10, 1, 10),
                    new selection_1.Selection(1, 17, 1, 17)
                ]);
                bracketMatchingController.selectToBracket(true);
                assert.deepEqual(editor.getSelections(), [
                    new selection_1.Selection(1, 1, 1, 5),
                    new selection_1.Selection(1, 8, 1, 13),
                    new selection_1.Selection(1, 16, 1, 19)
                ]);
                // cursors to the left of bracket pairs become selections of the entire pair
                editor.setSelections([
                    new selection_1.Selection(1, 1, 1, 1),
                    new selection_1.Selection(1, 6, 1, 6),
                    new selection_1.Selection(1, 14, 1, 14)
                ]);
                bracketMatchingController.selectToBracket(true);
                assert.deepEqual(editor.getSelections(), [
                    new selection_1.Selection(1, 1, 1, 5),
                    new selection_1.Selection(1, 8, 1, 13),
                    new selection_1.Selection(1, 16, 1, 19)
                ]);
                // cursors just right of a bracket pair become selections of the entire pair
                editor.setSelections([
                    new selection_1.Selection(1, 5, 1, 5),
                    new selection_1.Selection(1, 13, 1, 13),
                    new selection_1.Selection(1, 19, 1, 19)
                ]);
                bracketMatchingController.selectToBracket(true);
                assert.deepEqual(editor.getSelections(), [
                    new selection_1.Selection(1, 1, 1, 5),
                    new selection_1.Selection(1, 8, 1, 13),
                    new selection_1.Selection(1, 16, 1, 19)
                ]);
                bracketMatchingController.dispose();
            });
            model.dispose();
            mode.dispose();
        });
    });
});
//# sourceMappingURL=bracketMatching.test.js.map