/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/strings", "vs/editor/common/controller/cursorCollection", "vs/editor/common/controller/cursorCommon", "vs/editor/common/controller/cursorDeleteOperations", "vs/editor/common/controller/cursorTypeOperations", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/editorCommon", "vs/editor/common/view/viewEvents", "vs/base/common/lifecycle"], function (require, exports, errors_1, event_1, strings, cursorCollection_1, cursorCommon_1, cursorDeleteOperations_1, cursorTypeOperations_1, range_1, selection_1, editorCommon, viewEvents, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function containsLineMappingChanged(events) {
        for (let i = 0, len = events.length; i < len; i++) {
            if (events[i].type === 6 /* ViewLineMappingChanged */) {
                return true;
            }
        }
        return false;
    }
    class CursorStateChangedEvent {
        constructor(selections, modelVersionId, oldSelections, oldModelVersionId, source, reason) {
            this.selections = selections;
            this.modelVersionId = modelVersionId;
            this.oldSelections = oldSelections;
            this.oldModelVersionId = oldModelVersionId;
            this.source = source;
            this.reason = reason;
        }
    }
    exports.CursorStateChangedEvent = CursorStateChangedEvent;
    /**
     * A snapshot of the cursor and the model state
     */
    class CursorModelState {
        constructor(model, cursor) {
            this.modelVersionId = model.getVersionId();
            this.cursorState = cursor.getAll();
        }
        equals(other) {
            if (!other) {
                return false;
            }
            if (this.modelVersionId !== other.modelVersionId) {
                return false;
            }
            if (this.cursorState.length !== other.cursorState.length) {
                return false;
            }
            for (let i = 0, len = this.cursorState.length; i < len; i++) {
                if (!this.cursorState[i].equals(other.cursorState[i])) {
                    return false;
                }
            }
            return true;
        }
    }
    exports.CursorModelState = CursorModelState;
    class AutoClosedAction {
        constructor(model, autoClosedCharactersDecorations, autoClosedEnclosingDecorations) {
            this._model = model;
            this._autoClosedCharactersDecorations = autoClosedCharactersDecorations;
            this._autoClosedEnclosingDecorations = autoClosedEnclosingDecorations;
        }
        static getAllAutoClosedCharacters(autoClosedActions) {
            let autoClosedCharacters = [];
            for (const autoClosedAction of autoClosedActions) {
                autoClosedCharacters = autoClosedCharacters.concat(autoClosedAction.getAutoClosedCharactersRanges());
            }
            return autoClosedCharacters;
        }
        dispose() {
            this._autoClosedCharactersDecorations = this._model.deltaDecorations(this._autoClosedCharactersDecorations, []);
            this._autoClosedEnclosingDecorations = this._model.deltaDecorations(this._autoClosedEnclosingDecorations, []);
        }
        getAutoClosedCharactersRanges() {
            let result = [];
            for (let i = 0; i < this._autoClosedCharactersDecorations.length; i++) {
                const decorationRange = this._model.getDecorationRange(this._autoClosedCharactersDecorations[i]);
                if (decorationRange) {
                    result.push(decorationRange);
                }
            }
            return result;
        }
        isValid(selections) {
            let enclosingRanges = [];
            for (let i = 0; i < this._autoClosedEnclosingDecorations.length; i++) {
                const decorationRange = this._model.getDecorationRange(this._autoClosedEnclosingDecorations[i]);
                if (decorationRange) {
                    enclosingRanges.push(decorationRange);
                    if (decorationRange.startLineNumber !== decorationRange.endLineNumber) {
                        // Stop tracking if the range becomes multiline...
                        return false;
                    }
                }
            }
            enclosingRanges.sort(range_1.Range.compareRangesUsingStarts);
            selections.sort(range_1.Range.compareRangesUsingStarts);
            for (let i = 0; i < selections.length; i++) {
                if (i >= enclosingRanges.length) {
                    return false;
                }
                if (!enclosingRanges[i].strictContainsRange(selections[i])) {
                    return false;
                }
            }
            return true;
        }
    }
    class Cursor extends viewEvents.ViewEventEmitter {
        constructor(configuration, model, viewModel) {
            super();
            this._onDidReachMaxCursorCount = this._register(new event_1.Emitter());
            this.onDidReachMaxCursorCount = this._onDidReachMaxCursorCount.event;
            this._onDidAttemptReadOnlyEdit = this._register(new event_1.Emitter());
            this.onDidAttemptReadOnlyEdit = this._onDidAttemptReadOnlyEdit.event;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._configuration = configuration;
            this._model = model;
            this._knownModelVersionId = this._model.getVersionId();
            this._viewModel = viewModel;
            this.context = new cursorCommon_1.CursorContext(this._configuration, this._model, this._viewModel);
            this._cursors = new cursorCollection_1.CursorCollection(this.context);
            this._isHandling = false;
            this._isDoingComposition = false;
            this._selectionsWhenCompositionStarted = null;
            this._columnSelectData = null;
            this._autoClosedActions = [];
            this._prevEditOperationType = 0 /* Other */;
            this._register(this._model.onDidChangeRawContent((e) => {
                this._knownModelVersionId = e.versionId;
                if (this._isHandling) {
                    return;
                }
                let hadFlushEvent = e.containsEvent(1 /* Flush */);
                this._onModelContentChanged(hadFlushEvent);
            }));
            this._register(viewModel.addEventListener((events) => {
                if (!containsLineMappingChanged(events)) {
                    return;
                }
                if (this._knownModelVersionId !== this._model.getVersionId()) {
                    // There are model change events that I didn't yet receive.
                    //
                    // This can happen when editing the model, and the view model receives the change events first,
                    // and the view model emits line mapping changed events, all before the cursor gets a chance to
                    // recover from markers.
                    //
                    // The model change listener above will be called soon and we'll ensure a valid cursor state there.
                    return;
                }
                // Ensure valid state
                this.setStates('viewModel', 0 /* NotSet */, this.getAll());
            }));
            const updateCursorContext = () => {
                this.context = new cursorCommon_1.CursorContext(this._configuration, this._model, this._viewModel);
                this._cursors.updateContext(this.context);
            };
            this._register(this._model.onDidChangeLanguage((e) => {
                updateCursorContext();
            }));
            this._register(this._model.onDidChangeLanguageConfiguration(() => {
                updateCursorContext();
            }));
            this._register(this._model.onDidChangeOptions(() => {
                updateCursorContext();
            }));
            this._register(this._configuration.onDidChange((e) => {
                if (cursorCommon_1.CursorConfiguration.shouldRecreate(e)) {
                    updateCursorContext();
                }
            }));
        }
        dispose() {
            this._cursors.dispose();
            this._autoClosedActions = lifecycle_1.dispose(this._autoClosedActions);
            super.dispose();
        }
        _validateAutoClosedActions() {
            if (this._autoClosedActions.length > 0) {
                let selections = this._cursors.getSelections();
                for (let i = 0; i < this._autoClosedActions.length; i++) {
                    const autoClosedAction = this._autoClosedActions[i];
                    if (!autoClosedAction.isValid(selections)) {
                        autoClosedAction.dispose();
                        this._autoClosedActions.splice(i, 1);
                        i--;
                    }
                }
            }
        }
        // ------ some getters/setters
        getPrimaryCursor() {
            return this._cursors.getPrimaryCursor();
        }
        getLastAddedCursorIndex() {
            return this._cursors.getLastAddedCursorIndex();
        }
        getAll() {
            return this._cursors.getAll();
        }
        setStates(source, reason, states) {
            if (states !== null && states.length > Cursor.MAX_CURSOR_COUNT) {
                states = states.slice(0, Cursor.MAX_CURSOR_COUNT);
                this._onDidReachMaxCursorCount.fire(undefined);
            }
            const oldState = new CursorModelState(this._model, this);
            this._cursors.setStates(states);
            this._cursors.normalize();
            this._columnSelectData = null;
            this._validateAutoClosedActions();
            this._emitStateChangedIfNecessary(source, reason, oldState);
        }
        setColumnSelectData(columnSelectData) {
            this._columnSelectData = columnSelectData;
        }
        reveal(source, horizontal, target, scrollType) {
            this._revealRange(source, target, 0 /* Simple */, horizontal, scrollType);
        }
        revealRange(source, revealHorizontal, viewRange, verticalType, scrollType) {
            this.emitCursorRevealRange(source, viewRange, verticalType, revealHorizontal, scrollType);
        }
        scrollTo(desiredScrollTop) {
            this._viewModel.viewLayout.setScrollPositionSmooth({
                scrollTop: desiredScrollTop
            });
        }
        saveState() {
            let result = [];
            const selections = this._cursors.getSelections();
            for (let i = 0, len = selections.length; i < len; i++) {
                const selection = selections[i];
                result.push({
                    inSelectionMode: !selection.isEmpty(),
                    selectionStart: {
                        lineNumber: selection.selectionStartLineNumber,
                        column: selection.selectionStartColumn,
                    },
                    position: {
                        lineNumber: selection.positionLineNumber,
                        column: selection.positionColumn,
                    }
                });
            }
            return result;
        }
        restoreState(states) {
            let desiredSelections = [];
            for (let i = 0, len = states.length; i < len; i++) {
                const state = states[i];
                let positionLineNumber = 1;
                let positionColumn = 1;
                // Avoid missing properties on the literal
                if (state.position && state.position.lineNumber) {
                    positionLineNumber = state.position.lineNumber;
                }
                if (state.position && state.position.column) {
                    positionColumn = state.position.column;
                }
                let selectionStartLineNumber = positionLineNumber;
                let selectionStartColumn = positionColumn;
                // Avoid missing properties on the literal
                if (state.selectionStart && state.selectionStart.lineNumber) {
                    selectionStartLineNumber = state.selectionStart.lineNumber;
                }
                if (state.selectionStart && state.selectionStart.column) {
                    selectionStartColumn = state.selectionStart.column;
                }
                desiredSelections.push({
                    selectionStartLineNumber: selectionStartLineNumber,
                    selectionStartColumn: selectionStartColumn,
                    positionLineNumber: positionLineNumber,
                    positionColumn: positionColumn
                });
            }
            this.setStates('restoreState', 0 /* NotSet */, cursorCommon_1.CursorState.fromModelSelections(desiredSelections));
            this.reveal('restoreState', true, 0 /* Primary */, 1 /* Immediate */);
        }
        _onModelContentChanged(hadFlushEvent) {
            this._prevEditOperationType = 0 /* Other */;
            if (hadFlushEvent) {
                // a model.setValue() was called
                this._cursors.dispose();
                this._cursors = new cursorCollection_1.CursorCollection(this.context);
                this._validateAutoClosedActions();
                this._emitStateChangedIfNecessary('model', 1 /* ContentFlush */, null);
            }
            else {
                const selectionsFromMarkers = this._cursors.readSelectionFromMarkers();
                this.setStates('modelChange', 2 /* RecoverFromMarkers */, cursorCommon_1.CursorState.fromModelSelections(selectionsFromMarkers));
            }
        }
        getSelection() {
            return this._cursors.getPrimaryCursor().modelState.selection;
        }
        getColumnSelectData() {
            if (this._columnSelectData) {
                return this._columnSelectData;
            }
            const primaryCursor = this._cursors.getPrimaryCursor();
            const primaryPos = primaryCursor.viewState.selectionStart.getStartPosition();
            const viewLineNumber = primaryPos.lineNumber;
            const viewVisualColumn = cursorCommon_1.CursorColumns.visibleColumnFromColumn2(this.context.config, this.context.viewModel, primaryPos);
            return {
                isReal: false,
                fromViewLineNumber: viewLineNumber,
                fromViewVisualColumn: viewVisualColumn,
                toViewLineNumber: viewLineNumber,
                toViewVisualColumn: viewVisualColumn,
            };
        }
        getSelections() {
            return this._cursors.getSelections();
        }
        getViewSelections() {
            return this._cursors.getViewSelections();
        }
        getPosition() {
            return this._cursors.getPrimaryCursor().modelState.position;
        }
        setSelections(source, selections) {
            this.setStates(source, 0 /* NotSet */, cursorCommon_1.CursorState.fromModelSelections(selections));
        }
        getPrevEditOperationType() {
            return this._prevEditOperationType;
        }
        setPrevEditOperationType(type) {
            this._prevEditOperationType = type;
        }
        // ------ auxiliary handling logic
        _pushAutoClosedAction(autoClosedCharactersRanges, autoClosedEnclosingRanges) {
            let autoClosedCharactersDeltaDecorations = [];
            let autoClosedEnclosingDeltaDecorations = [];
            for (let i = 0, len = autoClosedCharactersRanges.length; i < len; i++) {
                autoClosedCharactersDeltaDecorations.push({
                    range: autoClosedCharactersRanges[i],
                    options: {
                        inlineClassName: 'auto-closed-character',
                        stickiness: 1 /* NeverGrowsWhenTypingAtEdges */
                    }
                });
                autoClosedEnclosingDeltaDecorations.push({
                    range: autoClosedEnclosingRanges[i],
                    options: {
                        stickiness: 1 /* NeverGrowsWhenTypingAtEdges */
                    }
                });
            }
            const autoClosedCharactersDecorations = this._model.deltaDecorations([], autoClosedCharactersDeltaDecorations);
            const autoClosedEnclosingDecorations = this._model.deltaDecorations([], autoClosedEnclosingDeltaDecorations);
            this._autoClosedActions.push(new AutoClosedAction(this._model, autoClosedCharactersDecorations, autoClosedEnclosingDecorations));
        }
        _executeEditOperation(opResult) {
            if (!opResult) {
                // Nothing to execute
                return;
            }
            if (opResult.shouldPushStackElementBefore) {
                this._model.pushStackElement();
            }
            const result = CommandExecutor.executeCommands(this._model, this._cursors.getSelections(), opResult.commands);
            if (result) {
                // The commands were applied correctly
                this._interpretCommandResult(result);
                // Check for auto-closing closed characters
                let autoClosedCharactersRanges = [];
                let autoClosedEnclosingRanges = [];
                for (let i = 0; i < opResult.commands.length; i++) {
                    const command = opResult.commands[i];
                    if (command instanceof cursorTypeOperations_1.TypeWithAutoClosingCommand && command.enclosingRange && command.closeCharacterRange) {
                        autoClosedCharactersRanges.push(command.closeCharacterRange);
                        autoClosedEnclosingRanges.push(command.enclosingRange);
                    }
                }
                if (autoClosedCharactersRanges.length > 0) {
                    this._pushAutoClosedAction(autoClosedCharactersRanges, autoClosedEnclosingRanges);
                }
                this._prevEditOperationType = opResult.type;
            }
            if (opResult.shouldPushStackElementAfter) {
                this._model.pushStackElement();
            }
        }
        _interpretCommandResult(cursorState) {
            if (!cursorState || cursorState.length === 0) {
                cursorState = this._cursors.readSelectionFromMarkers();
            }
            this._columnSelectData = null;
            this._cursors.setSelections(cursorState);
            this._cursors.normalize();
        }
        // -----------------------------------------------------------------------------------------------------------
        // ----- emitting events
        _emitStateChangedIfNecessary(source, reason, oldState) {
            const newState = new CursorModelState(this._model, this);
            if (newState.equals(oldState)) {
                return false;
            }
            const selections = this._cursors.getSelections();
            const viewSelections = this._cursors.getViewSelections();
            // Let the view get the event first.
            try {
                const eventsCollector = this._beginEmit();
                eventsCollector.emit(new viewEvents.ViewCursorStateChangedEvent(viewSelections));
            }
            finally {
                this._endEmit();
            }
            // Only after the view has been notified, let the rest of the world know...
            if (!oldState
                || oldState.cursorState.length !== newState.cursorState.length
                || newState.cursorState.some((newCursorState, i) => !newCursorState.modelState.equals(oldState.cursorState[i].modelState))) {
                const oldSelections = oldState ? oldState.cursorState.map(s => s.modelState.selection) : null;
                const oldModelVersionId = oldState ? oldState.modelVersionId : 0;
                this._onDidChange.fire(new CursorStateChangedEvent(selections, newState.modelVersionId, oldSelections, oldModelVersionId, source || 'keyboard', reason));
            }
            return true;
        }
        _revealRange(source, revealTarget, verticalType, revealHorizontal, scrollType) {
            const viewPositions = this._cursors.getViewPositions();
            let viewPosition = viewPositions[0];
            if (revealTarget === 1 /* TopMost */) {
                for (let i = 1; i < viewPositions.length; i++) {
                    if (viewPositions[i].isBefore(viewPosition)) {
                        viewPosition = viewPositions[i];
                    }
                }
            }
            else if (revealTarget === 2 /* BottomMost */) {
                for (let i = 1; i < viewPositions.length; i++) {
                    if (viewPosition.isBeforeOrEqual(viewPositions[i])) {
                        viewPosition = viewPositions[i];
                    }
                }
            }
            else {
                if (viewPositions.length > 1) {
                    // no revealing!
                    return;
                }
            }
            const viewRange = new range_1.Range(viewPosition.lineNumber, viewPosition.column, viewPosition.lineNumber, viewPosition.column);
            this.emitCursorRevealRange(source, viewRange, verticalType, revealHorizontal, scrollType);
        }
        emitCursorRevealRange(source, viewRange, verticalType, revealHorizontal, scrollType) {
            try {
                const eventsCollector = this._beginEmit();
                eventsCollector.emit(new viewEvents.ViewRevealRangeRequestEvent(source, viewRange, verticalType, revealHorizontal, scrollType));
            }
            finally {
                this._endEmit();
            }
        }
        // -----------------------------------------------------------------------------------------------------------
        // ----- handlers beyond this point
        _findAutoClosingPairs(edits) {
            if (!edits.length) {
                return null;
            }
            let indices = [];
            for (let i = 0, len = edits.length; i < len; i++) {
                const edit = edits[i];
                if (!edit.text || edit.text.indexOf('\n') >= 0) {
                    return null;
                }
                const m = edit.text.match(/([)\]}>'"`])([^)\]}>'"`]*)$/);
                if (!m) {
                    return null;
                }
                const closeChar = m[1];
                const autoClosingPairsCandidates = this.context.config.autoClosingPairsClose2.get(closeChar);
                if (!autoClosingPairsCandidates || autoClosingPairsCandidates.length !== 1) {
                    return null;
                }
                const openChar = autoClosingPairsCandidates[0].open;
                const closeCharIndex = edit.text.length - m[2].length - 1;
                const openCharIndex = edit.text.lastIndexOf(openChar, closeCharIndex - 1);
                if (openCharIndex === -1) {
                    return null;
                }
                indices.push([openCharIndex, closeCharIndex]);
            }
            return indices;
        }
        executeEdits(source, edits, cursorStateComputer) {
            let autoClosingIndices = null;
            if (source === 'snippet') {
                autoClosingIndices = this._findAutoClosingPairs(edits);
            }
            if (autoClosingIndices) {
                edits[0]._isTracked = true;
            }
            let autoClosedCharactersRanges = [];
            let autoClosedEnclosingRanges = [];
            const selections = this._model.pushEditOperations(this.getSelections(), edits, (undoEdits) => {
                if (autoClosingIndices) {
                    for (let i = 0, len = autoClosingIndices.length; i < len; i++) {
                        const [openCharInnerIndex, closeCharInnerIndex] = autoClosingIndices[i];
                        const undoEdit = undoEdits[i];
                        const lineNumber = undoEdit.range.startLineNumber;
                        const openCharIndex = undoEdit.range.startColumn - 1 + openCharInnerIndex;
                        const closeCharIndex = undoEdit.range.startColumn - 1 + closeCharInnerIndex;
                        autoClosedCharactersRanges.push(new range_1.Range(lineNumber, closeCharIndex + 1, lineNumber, closeCharIndex + 2));
                        autoClosedEnclosingRanges.push(new range_1.Range(lineNumber, openCharIndex + 1, lineNumber, closeCharIndex + 2));
                    }
                }
                const selections = cursorStateComputer(undoEdits);
                if (selections) {
                    // Don't recover the selection from markers because
                    // we know what it should be.
                    this._isHandling = true;
                }
                return selections;
            });
            if (selections) {
                this._isHandling = false;
                this.setSelections(source, selections);
            }
            if (autoClosedCharactersRanges.length > 0) {
                this._pushAutoClosedAction(autoClosedCharactersRanges, autoClosedEnclosingRanges);
            }
        }
        trigger(source, handlerId, payload) {
            const H = editorCommon.Handler;
            if (handlerId === H.CompositionStart) {
                this._isDoingComposition = true;
                this._selectionsWhenCompositionStarted = this.getSelections().slice(0);
                return;
            }
            if (handlerId === H.CompositionEnd) {
                this._isDoingComposition = false;
            }
            if (this._configuration.options.get(64 /* readOnly */)) {
                // All the remaining handlers will try to edit the model,
                // but we cannot edit when read only...
                this._onDidAttemptReadOnlyEdit.fire(undefined);
                return;
            }
            const oldState = new CursorModelState(this._model, this);
            let cursorChangeReason = 0 /* NotSet */;
            if (handlerId !== H.Undo && handlerId !== H.Redo) {
                // TODO@Alex: if the undo/redo stack contains non-null selections
                // it would also be OK to stop tracking selections here
                this._cursors.stopTrackingSelections();
            }
            // ensure valid state on all cursors
            this._cursors.ensureValidState();
            this._isHandling = true;
            try {
                switch (handlerId) {
                    case H.Type:
                        this._type(source, payload.text);
                        break;
                    case H.ReplacePreviousChar:
                        this._replacePreviousChar(payload.text, payload.replaceCharCnt);
                        break;
                    case H.Paste:
                        cursorChangeReason = 4 /* Paste */;
                        this._paste(payload.text, payload.pasteOnNewLine, payload.multicursorText);
                        break;
                    case H.Cut:
                        this._cut();
                        break;
                    case H.Undo:
                        cursorChangeReason = 5 /* Undo */;
                        this._interpretCommandResult(this._model.undo());
                        break;
                    case H.Redo:
                        cursorChangeReason = 6 /* Redo */;
                        this._interpretCommandResult(this._model.redo());
                        break;
                    case H.ExecuteCommand:
                        this._externalExecuteCommand(payload);
                        break;
                    case H.ExecuteCommands:
                        this._externalExecuteCommands(payload);
                        break;
                    case H.CompositionEnd:
                        this._interpretCompositionEnd(source);
                        break;
                }
            }
            catch (err) {
                errors_1.onUnexpectedError(err);
            }
            this._isHandling = false;
            if (handlerId !== H.Undo && handlerId !== H.Redo) {
                this._cursors.startTrackingSelections();
            }
            this._validateAutoClosedActions();
            if (this._emitStateChangedIfNecessary(source, cursorChangeReason, oldState)) {
                this._revealRange(source, 0 /* Primary */, 0 /* Simple */, true, 0 /* Smooth */);
            }
        }
        _interpretCompositionEnd(source) {
            if (!this._isDoingComposition && source === 'keyboard') {
                // composition finishes, let's check if we need to auto complete if necessary.
                const autoClosedCharacters = AutoClosedAction.getAllAutoClosedCharacters(this._autoClosedActions);
                this._executeEditOperation(cursorTypeOperations_1.TypeOperations.compositionEndWithInterceptors(this._prevEditOperationType, this.context.config, this.context.model, this._selectionsWhenCompositionStarted, this.getSelections(), autoClosedCharacters));
                this._selectionsWhenCompositionStarted = null;
            }
        }
        _type(source, text) {
            if (!this._isDoingComposition && source === 'keyboard') {
                // If this event is coming straight from the keyboard, look for electric characters and enter
                const len = text.length;
                let offset = 0;
                while (offset < len) {
                    const charLength = strings.nextCharLength(text, offset);
                    const chr = text.substr(offset, charLength);
                    // Here we must interpret each typed character individually
                    const autoClosedCharacters = AutoClosedAction.getAllAutoClosedCharacters(this._autoClosedActions);
                    this._executeEditOperation(cursorTypeOperations_1.TypeOperations.typeWithInterceptors(this._prevEditOperationType, this.context.config, this.context.model, this.getSelections(), autoClosedCharacters, chr));
                    offset += charLength;
                }
            }
            else {
                this._executeEditOperation(cursorTypeOperations_1.TypeOperations.typeWithoutInterceptors(this._prevEditOperationType, this.context.config, this.context.model, this.getSelections(), text));
            }
        }
        _replacePreviousChar(text, replaceCharCnt) {
            this._executeEditOperation(cursorTypeOperations_1.TypeOperations.replacePreviousChar(this._prevEditOperationType, this.context.config, this.context.model, this.getSelections(), text, replaceCharCnt));
        }
        _paste(text, pasteOnNewLine, multicursorText) {
            this._executeEditOperation(cursorTypeOperations_1.TypeOperations.paste(this.context.config, this.context.model, this.getSelections(), text, pasteOnNewLine, multicursorText));
        }
        _cut() {
            this._executeEditOperation(cursorDeleteOperations_1.DeleteOperations.cut(this.context.config, this.context.model, this.getSelections()));
        }
        _externalExecuteCommand(command) {
            this._cursors.killSecondaryCursors();
            this._executeEditOperation(new cursorCommon_1.EditOperationResult(0 /* Other */, [command], {
                shouldPushStackElementBefore: false,
                shouldPushStackElementAfter: false
            }));
        }
        _externalExecuteCommands(commands) {
            this._executeEditOperation(new cursorCommon_1.EditOperationResult(0 /* Other */, commands, {
                shouldPushStackElementBefore: false,
                shouldPushStackElementAfter: false
            }));
        }
    }
    exports.Cursor = Cursor;
    Cursor.MAX_CURSOR_COUNT = 10000;
    class CommandExecutor {
        static executeCommands(model, selectionsBefore, commands) {
            const ctx = {
                model: model,
                selectionsBefore: selectionsBefore,
                trackedRanges: [],
                trackedRangesDirection: []
            };
            const result = this._innerExecuteCommands(ctx, commands);
            for (let i = 0, len = ctx.trackedRanges.length; i < len; i++) {
                ctx.model._setTrackedRange(ctx.trackedRanges[i], null, 0 /* AlwaysGrowsWhenTypingAtEdges */);
            }
            return result;
        }
        static _innerExecuteCommands(ctx, commands) {
            if (this._arrayIsEmpty(commands)) {
                return null;
            }
            const commandsData = this._getEditOperations(ctx, commands);
            if (commandsData.operations.length === 0) {
                return null;
            }
            const rawOperations = commandsData.operations;
            const loserCursorsMap = this._getLoserCursorMap(rawOperations);
            if (loserCursorsMap.hasOwnProperty('0')) {
                // These commands are very messed up
                console.warn('Ignoring commands');
                return null;
            }
            // Remove operations belonging to losing cursors
            let filteredOperations = [];
            for (let i = 0, len = rawOperations.length; i < len; i++) {
                if (!loserCursorsMap.hasOwnProperty(rawOperations[i].identifier.major.toString())) {
                    filteredOperations.push(rawOperations[i]);
                }
            }
            // TODO@Alex: find a better way to do this.
            // give the hint that edit operations are tracked to the model
            if (commandsData.hadTrackedEditOperation && filteredOperations.length > 0) {
                filteredOperations[0]._isTracked = true;
            }
            let selectionsAfter = ctx.model.pushEditOperations(ctx.selectionsBefore, filteredOperations, (inverseEditOperations) => {
                let groupedInverseEditOperations = [];
                for (let i = 0; i < ctx.selectionsBefore.length; i++) {
                    groupedInverseEditOperations[i] = [];
                }
                for (const op of inverseEditOperations) {
                    if (!op.identifier) {
                        // perhaps auto whitespace trim edits
                        continue;
                    }
                    groupedInverseEditOperations[op.identifier.major].push(op);
                }
                const minorBasedSorter = (a, b) => {
                    return a.identifier.minor - b.identifier.minor;
                };
                let cursorSelections = [];
                for (let i = 0; i < ctx.selectionsBefore.length; i++) {
                    if (groupedInverseEditOperations[i].length > 0) {
                        groupedInverseEditOperations[i].sort(minorBasedSorter);
                        cursorSelections[i] = commands[i].computeCursorState(ctx.model, {
                            getInverseEditOperations: () => {
                                return groupedInverseEditOperations[i];
                            },
                            getTrackedSelection: (id) => {
                                const idx = parseInt(id, 10);
                                const range = ctx.model._getTrackedRange(ctx.trackedRanges[idx]);
                                if (ctx.trackedRangesDirection[idx] === 0 /* LTR */) {
                                    return new selection_1.Selection(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn);
                                }
                                return new selection_1.Selection(range.endLineNumber, range.endColumn, range.startLineNumber, range.startColumn);
                            }
                        });
                    }
                    else {
                        cursorSelections[i] = ctx.selectionsBefore[i];
                    }
                }
                return cursorSelections;
            });
            if (!selectionsAfter) {
                selectionsAfter = ctx.selectionsBefore;
            }
            // Extract losing cursors
            let losingCursors = [];
            for (let losingCursorIndex in loserCursorsMap) {
                if (loserCursorsMap.hasOwnProperty(losingCursorIndex)) {
                    losingCursors.push(parseInt(losingCursorIndex, 10));
                }
            }
            // Sort losing cursors descending
            losingCursors.sort((a, b) => {
                return b - a;
            });
            // Remove losing cursors
            for (const losingCursor of losingCursors) {
                selectionsAfter.splice(losingCursor, 1);
            }
            return selectionsAfter;
        }
        static _arrayIsEmpty(commands) {
            for (let i = 0, len = commands.length; i < len; i++) {
                if (commands[i]) {
                    return false;
                }
            }
            return true;
        }
        static _getEditOperations(ctx, commands) {
            let operations = [];
            let hadTrackedEditOperation = false;
            for (let i = 0, len = commands.length; i < len; i++) {
                const command = commands[i];
                if (command) {
                    const r = this._getEditOperationsFromCommand(ctx, i, command);
                    operations = operations.concat(r.operations);
                    hadTrackedEditOperation = hadTrackedEditOperation || r.hadTrackedEditOperation;
                }
            }
            return {
                operations: operations,
                hadTrackedEditOperation: hadTrackedEditOperation
            };
        }
        static _getEditOperationsFromCommand(ctx, majorIdentifier, command) {
            // This method acts as a transaction, if the command fails
            // everything it has done is ignored
            let operations = [];
            let operationMinor = 0;
            const addEditOperation = (selection, text) => {
                if (selection.isEmpty() && text === '') {
                    // This command wants to add a no-op => no thank you
                    return;
                }
                operations.push({
                    identifier: {
                        major: majorIdentifier,
                        minor: operationMinor++
                    },
                    range: selection,
                    text: text,
                    forceMoveMarkers: false,
                    isAutoWhitespaceEdit: command.insertsAutoWhitespace
                });
            };
            let hadTrackedEditOperation = false;
            const addTrackedEditOperation = (selection, text) => {
                hadTrackedEditOperation = true;
                addEditOperation(selection, text);
            };
            const trackSelection = (selection, trackPreviousOnEmpty) => {
                let stickiness;
                if (selection.isEmpty()) {
                    if (typeof trackPreviousOnEmpty === 'boolean') {
                        if (trackPreviousOnEmpty) {
                            stickiness = 2 /* GrowsOnlyWhenTypingBefore */;
                        }
                        else {
                            stickiness = 3 /* GrowsOnlyWhenTypingAfter */;
                        }
                    }
                    else {
                        // Try to lock it with surrounding text
                        const maxLineColumn = ctx.model.getLineMaxColumn(selection.startLineNumber);
                        if (selection.startColumn === maxLineColumn) {
                            stickiness = 2 /* GrowsOnlyWhenTypingBefore */;
                        }
                        else {
                            stickiness = 3 /* GrowsOnlyWhenTypingAfter */;
                        }
                    }
                }
                else {
                    stickiness = 1 /* NeverGrowsWhenTypingAtEdges */;
                }
                const l = ctx.trackedRanges.length;
                const id = ctx.model._setTrackedRange(null, selection, stickiness);
                ctx.trackedRanges[l] = id;
                ctx.trackedRangesDirection[l] = selection.getDirection();
                return l.toString();
            };
            const editOperationBuilder = {
                addEditOperation: addEditOperation,
                addTrackedEditOperation: addTrackedEditOperation,
                trackSelection: trackSelection
            };
            try {
                command.getEditOperations(ctx.model, editOperationBuilder);
            }
            catch (e) {
                // TODO@Alex use notification service if this should be user facing
                // e.friendlyMessage = nls.localize('corrupt.commands', "Unexpected exception while executing command.");
                errors_1.onUnexpectedError(e);
                return {
                    operations: [],
                    hadTrackedEditOperation: false
                };
            }
            return {
                operations: operations,
                hadTrackedEditOperation: hadTrackedEditOperation
            };
        }
        static _getLoserCursorMap(operations) {
            // This is destructive on the array
            operations = operations.slice(0);
            // Sort operations with last one first
            operations.sort((a, b) => {
                // Note the minus!
                return -(range_1.Range.compareRangesUsingEnds(a.range, b.range));
            });
            // Operations can not overlap!
            let loserCursorsMap = {};
            for (let i = 1; i < operations.length; i++) {
                const previousOp = operations[i - 1];
                const currentOp = operations[i];
                if (previousOp.range.getStartPosition().isBefore(currentOp.range.getEndPosition())) {
                    let loserMajor;
                    if (previousOp.identifier.major > currentOp.identifier.major) {
                        // previousOp loses the battle
                        loserMajor = previousOp.identifier.major;
                    }
                    else {
                        loserMajor = currentOp.identifier.major;
                    }
                    loserCursorsMap[loserMajor.toString()] = true;
                    for (let j = 0; j < operations.length; j++) {
                        if (operations[j].identifier.major === loserMajor) {
                            operations.splice(j, 1);
                            if (j < i) {
                                i--;
                            }
                            j--;
                        }
                    }
                    if (i > 0) {
                        i--;
                    }
                }
            }
            return loserCursorsMap;
        }
    }
});
//# sourceMappingURL=cursor.js.map