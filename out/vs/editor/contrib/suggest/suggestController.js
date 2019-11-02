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
define(["require", "exports", "vs/base/browser/ui/aria/aria", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/keyCodes", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/contrib/snippet/snippetController2", "vs/editor/contrib/snippet/snippetParser", "vs/editor/contrib/suggest/suggestMemory", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybindingsRegistry", "./suggest", "./suggestAlternatives", "./suggestModel", "./suggestWidget", "vs/editor/contrib/suggest/wordContextKey", "vs/base/common/event", "vs/editor/common/services/editorWorkerService", "vs/base/common/async", "vs/base/common/types", "./suggestCommitCharacters", "vs/base/common/platform"], function (require, exports, aria_1, arrays_1, errors_1, keyCodes_1, lifecycle_1, editorExtensions_1, editOperation_1, range_1, editorContextKeys_1, snippetController2_1, snippetParser_1, suggestMemory_1, nls, commands_1, contextkey_1, instantiation_1, keybindingsRegistry_1, suggest_1, suggestAlternatives_1, suggestModel_1, suggestWidget_1, wordContextKey_1, event_1, editorWorkerService_1, async_1, types_1, suggestCommitCharacters_1, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Stop suggest widget from disappearing when clicking into other areas
     * For development purpose only
     */
    const _sticky = false;
    class LineSuffix {
        constructor(_model, _position) {
            this._model = _model;
            this._position = _position;
            // spy on what's happening right of the cursor. two cases:
            // 1. end of line -> check that it's still end of line
            // 2. mid of line -> add a marker and compute the delta
            const maxColumn = _model.getLineMaxColumn(_position.lineNumber);
            if (maxColumn !== _position.column) {
                const offset = _model.getOffsetAt(_position);
                const end = _model.getPositionAt(offset + 1);
                this._marker = _model.deltaDecorations([], [{
                        range: range_1.Range.fromPositions(_position, end),
                        options: { stickiness: 1 /* NeverGrowsWhenTypingAtEdges */ }
                    }]);
            }
        }
        dispose() {
            if (this._marker && !this._model.isDisposed()) {
                this._model.deltaDecorations(this._marker, []);
            }
        }
        delta(position) {
            if (this._model.isDisposed() || this._position.lineNumber !== position.lineNumber) {
                // bail out early if things seems fishy
                return 0;
            }
            // read the marker (in case suggest was triggered at line end) or compare
            // the cursor to the line end.
            if (this._marker) {
                const range = this._model.getDecorationRange(this._marker[0]);
                const end = this._model.getOffsetAt(range.getStartPosition());
                return end - this._model.getOffsetAt(position);
            }
            else {
                return this._model.getLineMaxColumn(position.lineNumber) - position.column;
            }
        }
    }
    var InsertFlags;
    (function (InsertFlags) {
        InsertFlags[InsertFlags["NoBeforeUndoStop"] = 1] = "NoBeforeUndoStop";
        InsertFlags[InsertFlags["NoAfterUndoStop"] = 2] = "NoAfterUndoStop";
        InsertFlags[InsertFlags["KeepAlternativeSuggestions"] = 4] = "KeepAlternativeSuggestions";
        InsertFlags[InsertFlags["AlternativeOverwriteConfig"] = 8] = "AlternativeOverwriteConfig";
    })(InsertFlags || (InsertFlags = {}));
    let SuggestController = class SuggestController {
        constructor(_editor, editorWorker, _memoryService, _commandService, _contextKeyService, _instantiationService) {
            this._editor = _editor;
            this._memoryService = _memoryService;
            this._commandService = _commandService;
            this._contextKeyService = _contextKeyService;
            this._instantiationService = _instantiationService;
            this._lineSuffix = new lifecycle_1.MutableDisposable();
            this._toDispose = new lifecycle_1.DisposableStore();
            this._model = new suggestModel_1.SuggestModel(this._editor, editorWorker);
            this._widget = new async_1.IdleValue(() => {
                const widget = this._instantiationService.createInstance(suggestWidget_1.SuggestWidget, this._editor);
                this._toDispose.add(widget);
                this._toDispose.add(widget.onDidSelect(item => this._insertSuggestion(item, 0), this));
                // Wire up logic to accept a suggestion on certain characters
                const commitCharacterController = new suggestCommitCharacters_1.CommitCharacterController(this._editor, widget, item => this._insertSuggestion(item, 2 /* NoAfterUndoStop */));
                this._toDispose.add(commitCharacterController);
                this._toDispose.add(this._model.onDidSuggest(e => {
                    if (e.completionModel.items.length === 0) {
                        commitCharacterController.reset();
                    }
                }));
                // Wire up makes text edit context key
                let makesTextEdit = suggest_1.Context.MakesTextEdit.bindTo(this._contextKeyService);
                this._toDispose.add(widget.onDidFocus(({ item }) => {
                    const position = this._editor.getPosition();
                    const startColumn = item.editStart.column;
                    const endColumn = position.column;
                    let value = true;
                    if (this._editor.getOption(1 /* acceptSuggestionOnEnter */) === 'smart'
                        && this._model.state === 2 /* Auto */
                        && !item.completion.command
                        && !item.completion.additionalTextEdits
                        && !(item.completion.insertTextRules & 4 /* InsertAsSnippet */)
                        && endColumn - startColumn === item.completion.insertText.length) {
                        const oldText = this._editor.getModel().getValueInRange({
                            startLineNumber: position.lineNumber,
                            startColumn,
                            endLineNumber: position.lineNumber,
                            endColumn
                        });
                        value = oldText !== item.completion.insertText;
                    }
                    makesTextEdit.set(value);
                }));
                this._toDispose.add(lifecycle_1.toDisposable(() => makesTextEdit.reset()));
                return widget;
            });
            this._alternatives = new async_1.IdleValue(() => {
                return this._toDispose.add(new suggestAlternatives_1.SuggestAlternatives(this._editor, this._contextKeyService));
            });
            this._toDispose.add(_instantiationService.createInstance(wordContextKey_1.WordContextKey, _editor));
            this._toDispose.add(this._model.onDidTrigger(e => {
                this._widget.getValue().showTriggered(e.auto, e.shy ? 250 : 50);
                this._lineSuffix.value = new LineSuffix(this._editor.getModel(), e.position);
            }));
            this._toDispose.add(this._model.onDidSuggest(e => {
                if (!e.shy) {
                    let index = this._memoryService.select(this._editor.getModel(), this._editor.getPosition(), e.completionModel.items);
                    this._widget.getValue().showSuggestions(e.completionModel, index, e.isFrozen, e.auto);
                }
            }));
            this._toDispose.add(this._model.onDidCancel(e => {
                if (!e.retrigger) {
                    this._widget.getValue().hideWidget();
                }
            }));
            this._toDispose.add(this._editor.onDidBlurEditorWidget(() => {
                if (!_sticky) {
                    this._model.cancel();
                    this._model.clear();
                }
            }));
            this._toDispose.add(this._widget.getValue().onDetailsKeyDown(e => {
                // cmd + c on macOS, ctrl + c on Win / Linux
                if (e.toKeybinding().equals(new keyCodes_1.SimpleKeybinding(true, false, false, false, 33 /* KEY_C */)) ||
                    (platform.isMacintosh && e.toKeybinding().equals(new keyCodes_1.SimpleKeybinding(false, false, false, true, 33 /* KEY_C */)))) {
                    e.stopPropagation();
                    return;
                }
                if (!e.toKeybinding().isModifierKey()) {
                    this._editor.focus();
                }
            }));
            // Manage the acceptSuggestionsOnEnter context key
            let acceptSuggestionsOnEnter = suggest_1.Context.AcceptSuggestionsOnEnter.bindTo(_contextKeyService);
            let updateFromConfig = () => {
                const acceptSuggestionOnEnter = this._editor.getOption(1 /* acceptSuggestionOnEnter */);
                acceptSuggestionsOnEnter.set(acceptSuggestionOnEnter === 'on' || acceptSuggestionOnEnter === 'smart');
            };
            this._toDispose.add(this._editor.onDidChangeConfiguration(() => updateFromConfig()));
            updateFromConfig();
        }
        static get(editor) {
            return editor.getContribution(SuggestController.ID);
        }
        dispose() {
            this._alternatives.dispose();
            this._toDispose.dispose();
            this._widget.dispose();
            this._model.dispose();
            this._lineSuffix.dispose();
        }
        _insertSuggestion(event, flags) {
            if (!event || !event.item) {
                this._alternatives.getValue().reset();
                this._model.cancel();
                this._model.clear();
                return;
            }
            if (!this._editor.hasModel()) {
                return;
            }
            const model = this._editor.getModel();
            const modelVersionNow = model.getAlternativeVersionId();
            const { item } = event;
            const { completion: suggestion, position } = item;
            const columnDelta = this._editor.getPosition().column - position.column;
            // pushing undo stops *before* additional text edits and
            // *after* the main edit
            if (!(flags & 1 /* NoBeforeUndoStop */)) {
                this._editor.pushUndoStop();
            }
            if (Array.isArray(suggestion.additionalTextEdits)) {
                this._editor.executeEdits('suggestController.additionalTextEdits', suggestion.additionalTextEdits.map(edit => editOperation_1.EditOperation.replace(range_1.Range.lift(edit.range), edit.text)));
            }
            // keep item in memory
            this._memoryService.memorize(model, this._editor.getPosition(), item);
            let { insertText } = suggestion;
            if (!(suggestion.insertTextRules & 4 /* InsertAsSnippet */)) {
                insertText = snippetParser_1.SnippetParser.escape(insertText);
            }
            // const overwriteConfig = flags & InsertFlags.AlternativeOverwriteConfig
            // 	? !this._editor.getOption(EditorOption.suggest).overwriteOnAccept
            // 	: this._editor.getOption(EditorOption.suggest).overwriteOnAccept;
            const overwriteConfig = false;
            const overwriteBefore = position.column - item.editStart.column;
            const overwriteAfter = (overwriteConfig ? item.editReplaceEnd.column : item.editInsertEnd.column) - position.column;
            const suffixDelta = this._lineSuffix.value ? this._lineSuffix.value.delta(this._editor.getPosition()) : 0;
            snippetController2_1.SnippetController2.get(this._editor).insert(insertText, {
                overwriteBefore: overwriteBefore + columnDelta,
                overwriteAfter: overwriteAfter + suffixDelta,
                undoStopBefore: false,
                undoStopAfter: false,
                adjustWhitespace: !(suggestion.insertTextRules & 1 /* KeepWhitespace */)
            });
            if (!(flags & 2 /* NoAfterUndoStop */)) {
                this._editor.pushUndoStop();
            }
            if (!suggestion.command) {
                // done
                this._model.cancel();
                this._model.clear();
            }
            else if (suggestion.command.id === TriggerSuggestAction.id) {
                // retigger
                this._model.trigger({ auto: true, shy: false }, true);
            }
            else {
                // exec command, done
                this._commandService.executeCommand(suggestion.command.id, ...(suggestion.command.arguments ? [...suggestion.command.arguments] : []))
                    .catch(errors_1.onUnexpectedError)
                    .finally(() => this._model.clear()); // <- clear only now, keep commands alive
                this._model.cancel();
            }
            if (flags & 4 /* KeepAlternativeSuggestions */) {
                this._alternatives.getValue().set(event, next => {
                    // this is not so pretty. when inserting the 'next'
                    // suggestion we undo until we are at the state at
                    // which we were before inserting the previous suggestion...
                    while (model.canUndo()) {
                        if (modelVersionNow !== model.getAlternativeVersionId()) {
                            model.undo();
                        }
                        this._insertSuggestion(next, 1 /* NoBeforeUndoStop */ | 2 /* NoAfterUndoStop */ | (flags & 8 /* AlternativeOverwriteConfig */ ? 8 /* AlternativeOverwriteConfig */ : 0));
                        break;
                    }
                });
            }
            this._alertCompletionItem(event.item);
        }
        _alertCompletionItem({ completion: suggestion }) {
            if (arrays_1.isNonEmptyArray(suggestion.additionalTextEdits)) {
                let msg = nls.localize('arai.alert.snippet', "Accepting '{0}' made {1} additional edits", suggestion.label, suggestion.additionalTextEdits.length);
                aria_1.alert(msg);
            }
        }
        triggerSuggest(onlyFrom) {
            if (this._editor.hasModel()) {
                this._model.trigger({ auto: false, shy: false }, false, onlyFrom);
                this._editor.revealLine(this._editor.getPosition().lineNumber, 0 /* Smooth */);
                this._editor.focus();
            }
        }
        triggerSuggestAndAcceptBest(arg) {
            if (!this._editor.hasModel()) {
                return;
            }
            const positionNow = this._editor.getPosition();
            const fallback = () => {
                if (positionNow.equals(this._editor.getPosition())) {
                    this._commandService.executeCommand(arg.fallback);
                }
            };
            const makesTextEdit = (item) => {
                if (item.completion.insertTextRules & 4 /* InsertAsSnippet */ || item.completion.additionalTextEdits) {
                    // snippet, other editor -> makes edit
                    return true;
                }
                const position = this._editor.getPosition();
                const startColumn = item.editStart.column;
                const endColumn = position.column;
                if (endColumn - startColumn !== item.completion.insertText.length) {
                    // unequal lengths -> makes edit
                    return true;
                }
                const textNow = this._editor.getModel().getValueInRange({
                    startLineNumber: position.lineNumber,
                    startColumn,
                    endLineNumber: position.lineNumber,
                    endColumn
                });
                // unequal text -> makes edit
                return textNow !== item.completion.insertText;
            };
            event_1.Event.once(this._model.onDidTrigger)(_ => {
                // wait for trigger because only then the cancel-event is trustworthy
                let listener = [];
                event_1.Event.any(this._model.onDidTrigger, this._model.onDidCancel)(() => {
                    // retrigger or cancel -> try to type default text
                    lifecycle_1.dispose(listener);
                    fallback();
                }, undefined, listener);
                this._model.onDidSuggest(({ completionModel }) => {
                    lifecycle_1.dispose(listener);
                    if (completionModel.items.length === 0) {
                        fallback();
                        return;
                    }
                    const index = this._memoryService.select(this._editor.getModel(), this._editor.getPosition(), completionModel.items);
                    const item = completionModel.items[index];
                    if (!makesTextEdit(item)) {
                        fallback();
                        return;
                    }
                    this._editor.pushUndoStop();
                    this._insertSuggestion({ index, item, model: completionModel }, 4 /* KeepAlternativeSuggestions */ | 1 /* NoBeforeUndoStop */ | 2 /* NoAfterUndoStop */);
                }, undefined, listener);
            });
            this._model.trigger({ auto: false, shy: true });
            this._editor.revealLine(positionNow.lineNumber, 0 /* Smooth */);
            this._editor.focus();
        }
        acceptSelectedSuggestion(keepAlternativeSuggestions, alternativeOverwriteConfig) {
            const item = this._widget.getValue().getFocusedItem();
            let flags = 0;
            if (keepAlternativeSuggestions) {
                flags |= 4 /* KeepAlternativeSuggestions */;
            }
            if (alternativeOverwriteConfig) {
                flags |= 8 /* AlternativeOverwriteConfig */;
            }
            this._insertSuggestion(item, flags);
        }
        acceptNextSuggestion() {
            this._alternatives.getValue().next();
        }
        acceptPrevSuggestion() {
            this._alternatives.getValue().prev();
        }
        cancelSuggestWidget() {
            this._model.cancel();
            this._model.clear();
            this._widget.getValue().hideWidget();
        }
        selectNextSuggestion() {
            this._widget.getValue().selectNext();
        }
        selectNextPageSuggestion() {
            this._widget.getValue().selectNextPage();
        }
        selectLastSuggestion() {
            this._widget.getValue().selectLast();
        }
        selectPrevSuggestion() {
            this._widget.getValue().selectPrevious();
        }
        selectPrevPageSuggestion() {
            this._widget.getValue().selectPreviousPage();
        }
        selectFirstSuggestion() {
            this._widget.getValue().selectFirst();
        }
        toggleSuggestionDetails() {
            this._widget.getValue().toggleDetails();
        }
        toggleExplainMode() {
            this._widget.getValue().toggleExplainMode();
        }
        toggleSuggestionFocus() {
            this._widget.getValue().toggleDetailsFocus();
        }
    };
    SuggestController.ID = 'editor.contrib.suggestController';
    SuggestController = __decorate([
        __param(1, editorWorkerService_1.IEditorWorkerService),
        __param(2, suggestMemory_1.ISuggestMemoryService),
        __param(3, commands_1.ICommandService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, instantiation_1.IInstantiationService)
    ], SuggestController);
    exports.SuggestController = SuggestController;
    class TriggerSuggestAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: TriggerSuggestAction.id,
                label: nls.localize('suggest.trigger.label', "Trigger Suggest"),
                alias: 'Trigger Suggest',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasCompletionItemProvider),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 2048 /* CtrlCmd */ | 10 /* Space */,
                    mac: { primary: 256 /* WinCtrl */ | 10 /* Space */ },
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            const controller = SuggestController.get(editor);
            if (!controller) {
                return;
            }
            controller.triggerSuggest();
        }
    }
    exports.TriggerSuggestAction = TriggerSuggestAction;
    TriggerSuggestAction.id = 'editor.action.triggerSuggest';
    editorExtensions_1.registerEditorContribution(SuggestController.ID, SuggestController);
    editorExtensions_1.registerEditorAction(TriggerSuggestAction);
    const weight = 100 /* EditorContrib */ + 90;
    const SuggestCommand = editorExtensions_1.EditorCommand.bindToContribution(SuggestController.get);
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'acceptSelectedSuggestion',
        precondition: suggest_1.Context.Visible,
        handler(x, args) {
            const alternative = typeof args === 'object' && typeof args.alternative === 'boolean'
                ? args.alternative
                : false;
            x.acceptSelectedSuggestion(true, alternative);
        }
    }));
    // normal tab
    keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
        id: 'acceptSelectedSuggestion',
        when: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, editorContextKeys_1.EditorContextKeys.textInputFocus),
        primary: 2 /* Tab */,
        weight
    });
    // accept on enter has special rules
    keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
        id: 'acceptSelectedSuggestion',
        when: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, editorContextKeys_1.EditorContextKeys.textInputFocus, suggest_1.Context.AcceptSuggestionsOnEnter, suggest_1.Context.MakesTextEdit),
        primary: 3 /* Enter */,
        weight
    });
    // // shift+enter and shift+tab use the alternative-flag so that the suggest controller
    // // is doing the opposite of the editor.suggest.overwriteOnAccept-configuration
    // KeybindingsRegistry.registerKeybindingRule({
    // 	id: 'acceptSelectedSuggestion',
    // 	when: ContextKeyExpr.and(SuggestContext.Visible, EditorContextKeys.textInputFocus),
    // 	primary: KeyMod.Shift | KeyCode.Tab,
    // 	secondary: [KeyMod.Shift | KeyCode.Enter],
    // 	args: { alternative: true },
    // 	weight
    // });
    // continue to support the old command
    commands_1.CommandsRegistry.registerCommandAlias('acceptSelectedSuggestionOnEnter', 'acceptSelectedSuggestion');
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'hideSuggestWidget',
        precondition: suggest_1.Context.Visible,
        handler: x => x.cancelSuggestWidget(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 9 /* Escape */,
            secondary: [1024 /* Shift */ | 9 /* Escape */]
        }
    }));
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'selectNextSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, suggest_1.Context.MultipleSuggestions),
        handler: c => c.selectNextSuggestion(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 18 /* DownArrow */,
            secondary: [2048 /* CtrlCmd */ | 18 /* DownArrow */],
            mac: { primary: 18 /* DownArrow */, secondary: [2048 /* CtrlCmd */ | 18 /* DownArrow */, 256 /* WinCtrl */ | 44 /* KEY_N */] }
        }
    }));
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'selectNextPageSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, suggest_1.Context.MultipleSuggestions),
        handler: c => c.selectNextPageSuggestion(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 12 /* PageDown */,
            secondary: [2048 /* CtrlCmd */ | 12 /* PageDown */]
        }
    }));
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'selectLastSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, suggest_1.Context.MultipleSuggestions),
        handler: c => c.selectLastSuggestion()
    }));
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'selectPrevSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, suggest_1.Context.MultipleSuggestions),
        handler: c => c.selectPrevSuggestion(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 16 /* UpArrow */,
            secondary: [2048 /* CtrlCmd */ | 16 /* UpArrow */],
            mac: { primary: 16 /* UpArrow */, secondary: [2048 /* CtrlCmd */ | 16 /* UpArrow */, 256 /* WinCtrl */ | 46 /* KEY_P */] }
        }
    }));
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'selectPrevPageSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, suggest_1.Context.MultipleSuggestions),
        handler: c => c.selectPrevPageSuggestion(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 11 /* PageUp */,
            secondary: [2048 /* CtrlCmd */ | 11 /* PageUp */]
        }
    }));
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'selectFirstSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, suggest_1.Context.MultipleSuggestions),
        handler: c => c.selectFirstSuggestion()
    }));
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'toggleSuggestionDetails',
        precondition: suggest_1.Context.Visible,
        handler: x => x.toggleSuggestionDetails(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 2048 /* CtrlCmd */ | 10 /* Space */,
            mac: { primary: 256 /* WinCtrl */ | 10 /* Space */ }
        }
    }));
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'toggleExplainMode',
        precondition: suggest_1.Context.Visible,
        handler: x => x.toggleExplainMode(),
        kbOpts: {
            weight: 100 /* EditorContrib */,
            primary: 2048 /* CtrlCmd */ | 85 /* US_SLASH */,
        }
    }));
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'toggleSuggestionFocus',
        precondition: suggest_1.Context.Visible,
        handler: x => x.toggleSuggestionFocus(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 10 /* Space */,
            mac: { primary: 256 /* WinCtrl */ | 512 /* Alt */ | 10 /* Space */ }
        }
    }));
    //#region tab completions
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'insertBestCompletion',
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('config.editor.tabCompletion', 'on'), wordContextKey_1.WordContextKey.AtEnd, suggest_1.Context.Visible.toNegated(), suggestAlternatives_1.SuggestAlternatives.OtherSuggestions.toNegated(), snippetController2_1.SnippetController2.InSnippetMode.toNegated()),
        handler: (x, arg) => {
            x.triggerSuggestAndAcceptBest(types_1.isObject(arg) ? Object.assign({ fallback: 'tab' }, arg) : { fallback: 'tab' });
        },
        kbOpts: {
            weight,
            primary: 2 /* Tab */
        }
    }));
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'insertNextSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('config.editor.tabCompletion', 'on'), suggestAlternatives_1.SuggestAlternatives.OtherSuggestions, suggest_1.Context.Visible.toNegated(), snippetController2_1.SnippetController2.InSnippetMode.toNegated()),
        handler: x => x.acceptNextSuggestion(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 2 /* Tab */
        }
    }));
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'insertPrevSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('config.editor.tabCompletion', 'on'), suggestAlternatives_1.SuggestAlternatives.OtherSuggestions, suggest_1.Context.Visible.toNegated(), snippetController2_1.SnippetController2.InSnippetMode.toNegated()),
        handler: x => x.acceptPrevSuggestion(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 1024 /* Shift */ | 2 /* Tab */
        }
    }));
});
//# sourceMappingURL=suggestController.js.map