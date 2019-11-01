/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/htmlContent", "vs/editor/common/services/modeService", "vs/editor/common/core/range", "vs/editor/common/modes", "vs/editor/browser/editorExtensions", "./goToDefinition", "vs/base/common/lifecycle", "vs/editor/common/services/resolverService", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/editor/browser/core/editorState", "./goToDefinitionCommands", "vs/editor/contrib/goToDefinition/clickLinkGesture", "vs/editor/common/core/position", "vs/base/common/types", "vs/css!./goToDefinitionMouse"], function (require, exports, nls, async_1, errors_1, htmlContent_1, modeService_1, range_1, modes_1, editorExtensions_1, goToDefinition_1, lifecycle_1, resolverService_1, themeService_1, colorRegistry_1, editorState_1, goToDefinitionCommands_1, clickLinkGesture_1, position_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let GotoDefinitionWithMouseEditorContribution = class GotoDefinitionWithMouseEditorContribution {
        constructor(editor, textModelResolverService, modeService) {
            this.textModelResolverService = textModelResolverService;
            this.modeService = modeService;
            this.toUnhook = new lifecycle_1.DisposableStore();
            this.decorations = [];
            this.currentWordUnderMouse = null;
            this.previousPromise = null;
            this.editor = editor;
            let linkGesture = new clickLinkGesture_1.ClickLinkGesture(editor);
            this.toUnhook.add(linkGesture);
            this.toUnhook.add(linkGesture.onMouseMoveOrRelevantKeyDown(([mouseEvent, keyboardEvent]) => {
                this.startFindDefinition(mouseEvent, types_1.withNullAsUndefined(keyboardEvent));
            }));
            this.toUnhook.add(linkGesture.onExecute((mouseEvent) => {
                if (this.isEnabled(mouseEvent)) {
                    this.gotoDefinition(mouseEvent.target, mouseEvent.hasSideBySideModifier).then(() => {
                        this.removeDecorations();
                    }, (error) => {
                        this.removeDecorations();
                        errors_1.onUnexpectedError(error);
                    });
                }
            }));
            this.toUnhook.add(linkGesture.onCancel(() => {
                this.removeDecorations();
                this.currentWordUnderMouse = null;
            }));
        }
        startFindDefinition(mouseEvent, withKey) {
            // check if we are active and on a content widget
            if (mouseEvent.target.type === 9 /* CONTENT_WIDGET */ && this.decorations.length > 0) {
                return;
            }
            if (!this.editor.hasModel() || !this.isEnabled(mouseEvent, withKey)) {
                this.currentWordUnderMouse = null;
                this.removeDecorations();
                return;
            }
            // Find word at mouse position
            const word = mouseEvent.target.position ? this.editor.getModel().getWordAtPosition(mouseEvent.target.position) : null;
            if (!word) {
                this.currentWordUnderMouse = null;
                this.removeDecorations();
                return;
            }
            const position = mouseEvent.target.position;
            // Return early if word at position is still the same
            if (this.currentWordUnderMouse && this.currentWordUnderMouse.startColumn === word.startColumn && this.currentWordUnderMouse.endColumn === word.endColumn && this.currentWordUnderMouse.word === word.word) {
                return;
            }
            this.currentWordUnderMouse = word;
            // Find definition and decorate word if found
            let state = new editorState_1.EditorState(this.editor, 4 /* Position */ | 1 /* Value */ | 2 /* Selection */ | 8 /* Scroll */);
            if (this.previousPromise) {
                this.previousPromise.cancel();
                this.previousPromise = null;
            }
            this.previousPromise = async_1.createCancelablePromise(token => this.findDefinition(mouseEvent.target, token));
            this.previousPromise.then(results => {
                if (!results || !results.length || !state.validate(this.editor)) {
                    this.removeDecorations();
                    return;
                }
                // Multiple results
                if (results.length > 1) {
                    this.addDecoration(new range_1.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn), new htmlContent_1.MarkdownString().appendText(nls.localize('multipleResults', "Click to show {0} definitions.", results.length)));
                }
                // Single result
                else {
                    let result = results[0];
                    if (!result.uri) {
                        return;
                    }
                    this.textModelResolverService.createModelReference(result.uri).then(ref => {
                        if (!ref.object || !ref.object.textEditorModel) {
                            ref.dispose();
                            return;
                        }
                        const { object: { textEditorModel } } = ref;
                        const { startLineNumber } = result.range;
                        if (startLineNumber < 1 || startLineNumber > textEditorModel.getLineCount()) {
                            // invalid range
                            ref.dispose();
                            return;
                        }
                        const previewValue = this.getPreviewValue(textEditorModel, startLineNumber, result);
                        let wordRange;
                        if (result.originSelectionRange) {
                            wordRange = range_1.Range.lift(result.originSelectionRange);
                        }
                        else {
                            wordRange = new range_1.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
                        }
                        const modeId = this.modeService.getModeIdByFilepathOrFirstLine(textEditorModel.uri);
                        this.addDecoration(wordRange, new htmlContent_1.MarkdownString().appendCodeblock(modeId ? modeId : '', previewValue));
                        ref.dispose();
                    });
                }
            }).then(undefined, errors_1.onUnexpectedError);
        }
        getPreviewValue(textEditorModel, startLineNumber, result) {
            let rangeToUse = result.targetSelectionRange ? result.range : this.getPreviewRangeBasedOnBrackets(textEditorModel, startLineNumber);
            const numberOfLinesInRange = rangeToUse.endLineNumber - rangeToUse.startLineNumber;
            if (numberOfLinesInRange >= GotoDefinitionWithMouseEditorContribution.MAX_SOURCE_PREVIEW_LINES) {
                rangeToUse = this.getPreviewRangeBasedOnIndentation(textEditorModel, startLineNumber);
            }
            const previewValue = this.stripIndentationFromPreviewRange(textEditorModel, startLineNumber, rangeToUse);
            return previewValue;
        }
        stripIndentationFromPreviewRange(textEditorModel, startLineNumber, previewRange) {
            const startIndent = textEditorModel.getLineFirstNonWhitespaceColumn(startLineNumber);
            let minIndent = startIndent;
            for (let endLineNumber = startLineNumber + 1; endLineNumber < previewRange.endLineNumber; endLineNumber++) {
                const endIndent = textEditorModel.getLineFirstNonWhitespaceColumn(endLineNumber);
                minIndent = Math.min(minIndent, endIndent);
            }
            const previewValue = textEditorModel.getValueInRange(previewRange).replace(new RegExp(`^\\s{${minIndent - 1}}`, 'gm'), '').trim();
            return previewValue;
        }
        getPreviewRangeBasedOnIndentation(textEditorModel, startLineNumber) {
            const startIndent = textEditorModel.getLineFirstNonWhitespaceColumn(startLineNumber);
            const maxLineNumber = Math.min(textEditorModel.getLineCount(), startLineNumber + GotoDefinitionWithMouseEditorContribution.MAX_SOURCE_PREVIEW_LINES);
            let endLineNumber = startLineNumber + 1;
            for (; endLineNumber < maxLineNumber; endLineNumber++) {
                let endIndent = textEditorModel.getLineFirstNonWhitespaceColumn(endLineNumber);
                if (startIndent === endIndent) {
                    break;
                }
            }
            return new range_1.Range(startLineNumber, 1, endLineNumber + 1, 1);
        }
        getPreviewRangeBasedOnBrackets(textEditorModel, startLineNumber) {
            const maxLineNumber = Math.min(textEditorModel.getLineCount(), startLineNumber + GotoDefinitionWithMouseEditorContribution.MAX_SOURCE_PREVIEW_LINES);
            const brackets = [];
            let ignoreFirstEmpty = true;
            let currentBracket = textEditorModel.findNextBracket(new position_1.Position(startLineNumber, 1));
            while (currentBracket !== null) {
                if (brackets.length === 0) {
                    brackets.push(currentBracket);
                }
                else {
                    const lastBracket = brackets[brackets.length - 1];
                    if (lastBracket.open === currentBracket.open && lastBracket.isOpen && !currentBracket.isOpen) {
                        brackets.pop();
                    }
                    else {
                        brackets.push(currentBracket);
                    }
                    if (brackets.length === 0) {
                        if (ignoreFirstEmpty) {
                            ignoreFirstEmpty = false;
                        }
                        else {
                            return new range_1.Range(startLineNumber, 1, currentBracket.range.endLineNumber + 1, 1);
                        }
                    }
                }
                const maxColumn = textEditorModel.getLineMaxColumn(startLineNumber);
                let nextLineNumber = currentBracket.range.endLineNumber;
                let nextColumn = currentBracket.range.endColumn;
                if (maxColumn === currentBracket.range.endColumn) {
                    nextLineNumber++;
                    nextColumn = 1;
                }
                if (nextLineNumber > maxLineNumber) {
                    return new range_1.Range(startLineNumber, 1, maxLineNumber + 1, 1);
                }
                currentBracket = textEditorModel.findNextBracket(new position_1.Position(nextLineNumber, nextColumn));
            }
            return new range_1.Range(startLineNumber, 1, maxLineNumber + 1, 1);
        }
        addDecoration(range, hoverMessage) {
            const newDecorations = {
                range: range,
                options: {
                    inlineClassName: 'goto-definition-link',
                    hoverMessage
                }
            };
            this.decorations = this.editor.deltaDecorations(this.decorations, [newDecorations]);
        }
        removeDecorations() {
            if (this.decorations.length > 0) {
                this.decorations = this.editor.deltaDecorations(this.decorations, []);
            }
        }
        isEnabled(mouseEvent, withKey) {
            return this.editor.hasModel() &&
                mouseEvent.isNoneOrSingleMouseDown &&
                (mouseEvent.target.type === 6 /* CONTENT_TEXT */) &&
                (mouseEvent.hasTriggerModifier || (withKey ? withKey.keyCodeIsTriggerKey : false)) &&
                modes_1.DefinitionProviderRegistry.has(this.editor.getModel());
        }
        findDefinition(target, token) {
            const model = this.editor.getModel();
            if (!model) {
                return Promise.resolve(null);
            }
            return goToDefinition_1.getDefinitionsAtPosition(model, target.position, token);
        }
        gotoDefinition(target, sideBySide) {
            this.editor.setPosition(target.position);
            const action = new goToDefinitionCommands_1.DefinitionAction(new goToDefinitionCommands_1.DefinitionActionConfig(sideBySide, false, true, false), { alias: '', label: '', id: '', precondition: undefined });
            return this.editor.invokeWithinContext(accessor => action.run(accessor, this.editor));
        }
        getId() {
            return GotoDefinitionWithMouseEditorContribution.ID;
        }
        dispose() {
            this.toUnhook.dispose();
        }
    };
    GotoDefinitionWithMouseEditorContribution.ID = 'editor.contrib.gotodefinitionwithmouse';
    GotoDefinitionWithMouseEditorContribution.MAX_SOURCE_PREVIEW_LINES = 8;
    GotoDefinitionWithMouseEditorContribution = __decorate([
        __param(1, resolverService_1.ITextModelService),
        __param(2, modeService_1.IModeService)
    ], GotoDefinitionWithMouseEditorContribution);
    editorExtensions_1.registerEditorContribution(GotoDefinitionWithMouseEditorContribution);
    themeService_1.registerThemingParticipant((theme, collector) => {
        const activeLinkForeground = theme.getColor(colorRegistry_1.editorActiveLinkForeground);
        if (activeLinkForeground) {
            collector.addRule(`.monaco-editor .goto-definition-link { color: ${activeLinkForeground} !important; }`);
        }
    });
});
//# sourceMappingURL=goToDefinitionMouse.js.map