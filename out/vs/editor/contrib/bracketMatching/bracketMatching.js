/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/core/position", "vs/editor/common/core/selection", "vs/editor/common/editorContextKeys", "vs/editor/common/model", "vs/editor/common/model/textModel", "vs/editor/common/view/editorColorRegistry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/platform/actions/common/actions", "vs/css!./bracketMatching"], function (require, exports, nls, async_1, lifecycle_1, editorExtensions_1, position_1, selection_1, editorContextKeys_1, model_1, textModel_1, editorColorRegistry_1, colorRegistry_1, themeService_1, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const overviewRulerBracketMatchForeground = colorRegistry_1.registerColor('editorOverviewRuler.bracketMatchForeground', { dark: '#A0A0A0', light: '#A0A0A0', hc: '#A0A0A0' }, nls.localize('overviewRulerBracketMatchForeground', 'Overview ruler marker color for matching brackets.'));
    class JumpToBracketAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.jumpToBracket',
                label: nls.localize('smartSelect.jumpBracket', "Go to Bracket"),
                alias: 'Go to Bracket',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 88 /* US_BACKSLASH */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            let controller = BracketMatchingController.get(editor);
            if (!controller) {
                return;
            }
            controller.jumpToBracket();
        }
    }
    class SelectToBracketAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.selectToBracket',
                label: nls.localize('smartSelect.selectToBracket', "Select to Bracket"),
                alias: 'Select to Bracket',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            let controller = BracketMatchingController.get(editor);
            if (!controller) {
                return;
            }
            controller.selectToBracket();
        }
    }
    class BracketsData {
        constructor(position, brackets) {
            this.position = position;
            this.brackets = brackets;
        }
    }
    class BracketMatchingController extends lifecycle_1.Disposable {
        constructor(editor) {
            super();
            this._editor = editor;
            this._lastBracketsData = [];
            this._lastVersionId = 0;
            this._decorations = [];
            this._updateBracketsSoon = this._register(new async_1.RunOnceScheduler(() => this._updateBrackets(), 50));
            this._matchBrackets = this._editor.getOption(49 /* matchBrackets */);
            this._updateBracketsSoon.schedule();
            this._register(editor.onDidChangeCursorPosition((e) => {
                if (!this._matchBrackets) {
                    // Early exit if nothing needs to be done!
                    // Leave some form of early exit check here if you wish to continue being a cursor position change listener ;)
                    return;
                }
                this._updateBracketsSoon.schedule();
            }));
            this._register(editor.onDidChangeModelContent((e) => {
                this._updateBracketsSoon.schedule();
            }));
            this._register(editor.onDidChangeModel((e) => {
                this._lastBracketsData = [];
                this._decorations = [];
                this._updateBracketsSoon.schedule();
            }));
            this._register(editor.onDidChangeModelLanguageConfiguration((e) => {
                this._lastBracketsData = [];
                this._updateBracketsSoon.schedule();
            }));
            this._register(editor.onDidChangeConfiguration((e) => {
                this._matchBrackets = this._editor.getOption(49 /* matchBrackets */);
                if (!this._matchBrackets && this._decorations.length > 0) {
                    // Remove existing decorations if bracket matching is off
                    this._decorations = this._editor.deltaDecorations(this._decorations, []);
                }
                this._updateBracketsSoon.schedule();
            }));
        }
        static get(editor) {
            return editor.getContribution(BracketMatchingController.ID);
        }
        getId() {
            return BracketMatchingController.ID;
        }
        jumpToBracket() {
            if (!this._editor.hasModel()) {
                return;
            }
            const model = this._editor.getModel();
            const newSelections = this._editor.getSelections().map(selection => {
                const position = selection.getStartPosition();
                // find matching brackets if position is on a bracket
                const brackets = model.matchBracket(position);
                let newCursorPosition = null;
                if (brackets) {
                    if (brackets[0].containsPosition(position)) {
                        newCursorPosition = brackets[1].getStartPosition();
                    }
                    else if (brackets[1].containsPosition(position)) {
                        newCursorPosition = brackets[0].getStartPosition();
                    }
                }
                else {
                    // find the next bracket if the position isn't on a matching bracket
                    const nextBracket = model.findNextBracket(position);
                    if (nextBracket && nextBracket.range) {
                        newCursorPosition = nextBracket.range.getStartPosition();
                    }
                }
                if (newCursorPosition) {
                    return new selection_1.Selection(newCursorPosition.lineNumber, newCursorPosition.column, newCursorPosition.lineNumber, newCursorPosition.column);
                }
                return new selection_1.Selection(position.lineNumber, position.column, position.lineNumber, position.column);
            });
            this._editor.setSelections(newSelections);
            this._editor.revealRange(newSelections[0]);
        }
        selectToBracket() {
            if (!this._editor.hasModel()) {
                return;
            }
            const model = this._editor.getModel();
            const newSelections = [];
            this._editor.getSelections().forEach(selection => {
                const position = selection.getStartPosition();
                let brackets = model.matchBracket(position);
                let openBracket = null;
                let closeBracket = null;
                if (!brackets) {
                    const nextBracket = model.findNextBracket(position);
                    if (nextBracket && nextBracket.range) {
                        brackets = model.matchBracket(nextBracket.range.getStartPosition());
                    }
                }
                if (brackets) {
                    if (brackets[0].startLineNumber === brackets[1].startLineNumber) {
                        openBracket = brackets[1].startColumn < brackets[0].startColumn ?
                            brackets[1].getStartPosition() : brackets[0].getStartPosition();
                        closeBracket = brackets[1].startColumn < brackets[0].startColumn ?
                            brackets[0].getEndPosition() : brackets[1].getEndPosition();
                    }
                    else {
                        openBracket = brackets[1].startLineNumber < brackets[0].startLineNumber ?
                            brackets[1].getStartPosition() : brackets[0].getStartPosition();
                        closeBracket = brackets[1].startLineNumber < brackets[0].startLineNumber ?
                            brackets[0].getEndPosition() : brackets[1].getEndPosition();
                    }
                }
                if (openBracket && closeBracket) {
                    newSelections.push(new selection_1.Selection(openBracket.lineNumber, openBracket.column, closeBracket.lineNumber, closeBracket.column));
                }
            });
            if (newSelections.length > 0) {
                this._editor.setSelections(newSelections);
                this._editor.revealRange(newSelections[0]);
            }
        }
        _updateBrackets() {
            if (!this._matchBrackets) {
                return;
            }
            this._recomputeBrackets();
            let newDecorations = [], newDecorationsLen = 0;
            for (let i = 0, len = this._lastBracketsData.length; i < len; i++) {
                let brackets = this._lastBracketsData[i].brackets;
                if (brackets) {
                    newDecorations[newDecorationsLen++] = { range: brackets[0], options: BracketMatchingController._DECORATION_OPTIONS };
                    newDecorations[newDecorationsLen++] = { range: brackets[1], options: BracketMatchingController._DECORATION_OPTIONS };
                }
            }
            this._decorations = this._editor.deltaDecorations(this._decorations, newDecorations);
        }
        _recomputeBrackets() {
            if (!this._editor.hasModel()) {
                // no model => no brackets!
                this._lastBracketsData = [];
                this._lastVersionId = 0;
                return;
            }
            const model = this._editor.getModel();
            const versionId = model.getVersionId();
            let previousData = [];
            if (this._lastVersionId === versionId) {
                // use the previous data only if the model is at the same version id
                previousData = this._lastBracketsData;
            }
            const selections = this._editor.getSelections();
            let positions = [], positionsLen = 0;
            for (let i = 0, len = selections.length; i < len; i++) {
                let selection = selections[i];
                if (selection.isEmpty()) {
                    // will bracket match a cursor only if the selection is collapsed
                    positions[positionsLen++] = selection.getStartPosition();
                }
            }
            // sort positions for `previousData` cache hits
            if (positions.length > 1) {
                positions.sort(position_1.Position.compare);
            }
            let newData = [], newDataLen = 0;
            let previousIndex = 0, previousLen = previousData.length;
            for (let i = 0, len = positions.length; i < len; i++) {
                let position = positions[i];
                while (previousIndex < previousLen && previousData[previousIndex].position.isBefore(position)) {
                    previousIndex++;
                }
                if (previousIndex < previousLen && previousData[previousIndex].position.equals(position)) {
                    newData[newDataLen++] = previousData[previousIndex];
                }
                else {
                    let brackets = model.matchBracket(position);
                    newData[newDataLen++] = new BracketsData(position, brackets);
                }
            }
            this._lastBracketsData = newData;
            this._lastVersionId = versionId;
        }
    }
    exports.BracketMatchingController = BracketMatchingController;
    BracketMatchingController.ID = 'editor.contrib.bracketMatchingController';
    BracketMatchingController._DECORATION_OPTIONS = textModel_1.ModelDecorationOptions.register({
        stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
        className: 'bracket-match',
        overviewRuler: {
            color: themeService_1.themeColorFromId(overviewRulerBracketMatchForeground),
            position: model_1.OverviewRulerLane.Center
        }
    });
    editorExtensions_1.registerEditorContribution(BracketMatchingController);
    editorExtensions_1.registerEditorAction(SelectToBracketAction);
    editorExtensions_1.registerEditorAction(JumpToBracketAction);
    themeService_1.registerThemingParticipant((theme, collector) => {
        const bracketMatchBackground = theme.getColor(editorColorRegistry_1.editorBracketMatchBackground);
        if (bracketMatchBackground) {
            collector.addRule(`.monaco-editor .bracket-match { background-color: ${bracketMatchBackground}; }`);
        }
        const bracketMatchBorder = theme.getColor(editorColorRegistry_1.editorBracketMatchBorder);
        if (bracketMatchBorder) {
            collector.addRule(`.monaco-editor .bracket-match { border: 1px solid ${bracketMatchBorder}; }`);
        }
    });
    // Go to menu
    actions_1.MenuRegistry.appendMenuItem(16 /* MenubarGoMenu */, {
        group: '5_infile_nav',
        command: {
            id: 'editor.action.jumpToBracket',
            title: nls.localize({ key: 'miGoToBracket', comment: ['&& denotes a mnemonic'] }, "Go to &&Bracket")
        },
        order: 2
    });
});
//# sourceMappingURL=bracketMatching.js.map