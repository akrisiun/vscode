/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/color", "vs/base/common/strings", "vs/editor/common/config/editorOptions", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/modes", "vs/editor/common/modes/textToHtmlTokenizer", "vs/editor/common/viewModel/minimapTokensColorTracker", "vs/editor/common/view/viewEvents", "vs/editor/common/viewLayout/viewLayout", "vs/editor/common/viewModel/characterHardWrappingLineMapper", "vs/editor/common/viewModel/splitLinesCollection", "vs/editor/common/viewModel/viewModel", "vs/editor/common/viewModel/viewModelDecorations", "vs/base/common/async", "vs/base/common/platform"], function (require, exports, color_1, strings, editorOptions_1, position_1, range_1, modes_1, textToHtmlTokenizer_1, minimapTokensColorTracker_1, viewEvents, viewLayout_1, characterHardWrappingLineMapper_1, splitLinesCollection_1, viewModel_1, viewModelDecorations_1, async_1, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const USE_IDENTITY_LINES_COLLECTION = true;
    class ViewModel extends viewEvents.ViewEventEmitter {
        constructor(editorId, configuration, model, scheduleAtNextAnimationFrame) {
            super();
            this.editorId = editorId;
            this.configuration = configuration;
            this.model = model;
            this._tokenizeViewportSoon = this._register(new async_1.RunOnceScheduler(() => this.tokenizeViewport(), 50));
            this.hasFocus = false;
            this.viewportStartLine = -1;
            this.viewportStartLineTrackedRange = null;
            this.viewportStartLineDelta = 0;
            if (USE_IDENTITY_LINES_COLLECTION && this.model.isTooLargeForTokenization()) {
                this.lines = new splitLinesCollection_1.IdentityLinesCollection(this.model);
            }
            else {
                const options = this.configuration.options;
                const wrappingInfo = options.get(103 /* wrappingInfo */);
                const fontInfo = options.get(31 /* fontInfo */);
                const wordWrapBreakAfterCharacters = options.get(93 /* wordWrapBreakAfterCharacters */);
                const wordWrapBreakBeforeCharacters = options.get(94 /* wordWrapBreakBeforeCharacters */);
                const wordWrapBreakObtrusiveCharacters = options.get(95 /* wordWrapBreakObtrusiveCharacters */);
                const wrappingIndent = options.get(98 /* wrappingIndent */);
                let hardWrappingLineMapperFactory = new characterHardWrappingLineMapper_1.CharacterHardWrappingLineMapperFactory(wordWrapBreakBeforeCharacters, wordWrapBreakAfterCharacters, wordWrapBreakObtrusiveCharacters);
                this.lines = new splitLinesCollection_1.SplitLinesCollection(this.model, hardWrappingLineMapperFactory, this.model.getOptions().tabSize, wrappingInfo.wrappingColumn, fontInfo.typicalFullwidthCharacterWidth / fontInfo.typicalHalfwidthCharacterWidth, wrappingIndent);
            }
            this.coordinatesConverter = this.lines.createCoordinatesConverter();
            this.viewLayout = this._register(new viewLayout_1.ViewLayout(this.configuration, this.getLineCount(), scheduleAtNextAnimationFrame));
            this._register(this.viewLayout.onDidScroll((e) => {
                if (e.scrollTopChanged) {
                    this._tokenizeViewportSoon.schedule();
                }
                try {
                    const eventsCollector = this._beginEmit();
                    eventsCollector.emit(new viewEvents.ViewScrollChangedEvent(e));
                }
                finally {
                    this._endEmit();
                }
            }));
            this.decorations = new viewModelDecorations_1.ViewModelDecorations(this.editorId, this.model, this.configuration, this.lines, this.coordinatesConverter);
            this._registerModelEvents();
            this._register(this.configuration.onDidChange((e) => {
                try {
                    const eventsCollector = this._beginEmit();
                    this._onConfigurationChanged(eventsCollector, e);
                }
                finally {
                    this._endEmit();
                }
            }));
            this._register(minimapTokensColorTracker_1.MinimapTokensColorTracker.getInstance().onDidChange(() => {
                try {
                    const eventsCollector = this._beginEmit();
                    eventsCollector.emit(new viewEvents.ViewTokensColorsChangedEvent());
                }
                finally {
                    this._endEmit();
                }
            }));
        }
        dispose() {
            // First remove listeners, as disposing the lines might end up sending
            // model decoration changed events ... and we no longer care about them ...
            super.dispose();
            this.decorations.dispose();
            this.lines.dispose();
            this.invalidateMinimapColorCache();
            this.viewportStartLineTrackedRange = this.model._setTrackedRange(this.viewportStartLineTrackedRange, null, 1 /* NeverGrowsWhenTypingAtEdges */);
        }
        tokenizeViewport() {
            const linesViewportData = this.viewLayout.getLinesViewportData();
            const startPosition = this.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(linesViewportData.startLineNumber, 1));
            const endPosition = this.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(linesViewportData.endLineNumber, 1));
            this.model.tokenizeViewport(startPosition.lineNumber, endPosition.lineNumber);
        }
        setHasFocus(hasFocus) {
            this.hasFocus = hasFocus;
        }
        _onConfigurationChanged(eventsCollector, e) {
            // We might need to restore the current centered view range, so save it (if available)
            let previousViewportStartModelPosition = null;
            if (this.viewportStartLine !== -1) {
                let previousViewportStartViewPosition = new position_1.Position(this.viewportStartLine, this.getLineMinColumn(this.viewportStartLine));
                previousViewportStartModelPosition = this.coordinatesConverter.convertViewPositionToModelPosition(previousViewportStartViewPosition);
            }
            let restorePreviousViewportStart = false;
            const options = this.configuration.options;
            const wrappingInfo = options.get(103 /* wrappingInfo */);
            const fontInfo = options.get(31 /* fontInfo */);
            const wrappingIndent = options.get(98 /* wrappingIndent */);
            if (this.lines.setWrappingSettings(wrappingIndent, wrappingInfo.wrappingColumn, fontInfo.typicalFullwidthCharacterWidth / fontInfo.typicalHalfwidthCharacterWidth)) {
                eventsCollector.emit(new viewEvents.ViewFlushedEvent());
                eventsCollector.emit(new viewEvents.ViewLineMappingChangedEvent());
                eventsCollector.emit(new viewEvents.ViewDecorationsChangedEvent());
                this.decorations.onLineMappingChanged();
                this.viewLayout.onFlushed(this.getLineCount());
                if (this.viewLayout.getCurrentScrollTop() !== 0) {
                    // Never change the scroll position from 0 to something else...
                    restorePreviousViewportStart = true;
                }
            }
            if (e.hasChanged(64 /* readOnly */)) {
                // Must read again all decorations due to readOnly filtering
                this.decorations.reset();
                eventsCollector.emit(new viewEvents.ViewDecorationsChangedEvent());
            }
            eventsCollector.emit(new viewEvents.ViewConfigurationChangedEvent(e));
            this.viewLayout.onConfigurationChanged(e);
            if (restorePreviousViewportStart && previousViewportStartModelPosition) {
                const viewPosition = this.coordinatesConverter.convertModelPositionToViewPosition(previousViewportStartModelPosition);
                const viewPositionTop = this.viewLayout.getVerticalOffsetForLineNumber(viewPosition.lineNumber);
                this.viewLayout.setScrollPositionNow({ scrollTop: viewPositionTop + this.viewportStartLineDelta });
            }
        }
        _registerModelEvents() {
            this._register(this.model.onDidChangeRawContentFast((e) => {
                try {
                    const eventsCollector = this._beginEmit();
                    let hadOtherModelChange = false;
                    let hadModelLineChangeThatChangedLineMapping = false;
                    const changes = e.changes;
                    const versionId = e.versionId;
                    for (let j = 0, lenJ = changes.length; j < lenJ; j++) {
                        const change = changes[j];
                        switch (change.changeType) {
                            case 1 /* Flush */: {
                                this.lines.onModelFlushed();
                                eventsCollector.emit(new viewEvents.ViewFlushedEvent());
                                this.decorations.reset();
                                this.viewLayout.onFlushed(this.getLineCount());
                                hadOtherModelChange = true;
                                break;
                            }
                            case 3 /* LinesDeleted */: {
                                const linesDeletedEvent = this.lines.onModelLinesDeleted(versionId, change.fromLineNumber, change.toLineNumber);
                                if (linesDeletedEvent !== null) {
                                    eventsCollector.emit(linesDeletedEvent);
                                    this.viewLayout.onLinesDeleted(linesDeletedEvent.fromLineNumber, linesDeletedEvent.toLineNumber);
                                }
                                hadOtherModelChange = true;
                                break;
                            }
                            case 4 /* LinesInserted */: {
                                const linesInsertedEvent = this.lines.onModelLinesInserted(versionId, change.fromLineNumber, change.toLineNumber, change.detail);
                                if (linesInsertedEvent !== null) {
                                    eventsCollector.emit(linesInsertedEvent);
                                    this.viewLayout.onLinesInserted(linesInsertedEvent.fromLineNumber, linesInsertedEvent.toLineNumber);
                                }
                                hadOtherModelChange = true;
                                break;
                            }
                            case 2 /* LineChanged */: {
                                const [lineMappingChanged, linesChangedEvent, linesInsertedEvent, linesDeletedEvent] = this.lines.onModelLineChanged(versionId, change.lineNumber, change.detail);
                                hadModelLineChangeThatChangedLineMapping = lineMappingChanged;
                                if (linesChangedEvent) {
                                    eventsCollector.emit(linesChangedEvent);
                                }
                                if (linesInsertedEvent) {
                                    eventsCollector.emit(linesInsertedEvent);
                                    this.viewLayout.onLinesInserted(linesInsertedEvent.fromLineNumber, linesInsertedEvent.toLineNumber);
                                }
                                if (linesDeletedEvent) {
                                    eventsCollector.emit(linesDeletedEvent);
                                    this.viewLayout.onLinesDeleted(linesDeletedEvent.fromLineNumber, linesDeletedEvent.toLineNumber);
                                }
                                break;
                            }
                            case 5 /* EOLChanged */: {
                                // Nothing to do. The new version will be accepted below
                                break;
                            }
                        }
                    }
                    this.lines.acceptVersionId(versionId);
                    this.viewLayout.onHeightMaybeChanged();
                    if (!hadOtherModelChange && hadModelLineChangeThatChangedLineMapping) {
                        eventsCollector.emit(new viewEvents.ViewLineMappingChangedEvent());
                        eventsCollector.emit(new viewEvents.ViewDecorationsChangedEvent());
                        this.decorations.onLineMappingChanged();
                    }
                }
                finally {
                    this._endEmit();
                }
                // Update the configuration and reset the centered view line
                this.viewportStartLine = -1;
                this.configuration.setMaxLineNumber(this.model.getLineCount());
                // Recover viewport
                if (!this.hasFocus && this.model.getAttachedEditorCount() >= 2 && this.viewportStartLineTrackedRange) {
                    const modelRange = this.model._getTrackedRange(this.viewportStartLineTrackedRange);
                    if (modelRange) {
                        const viewPosition = this.coordinatesConverter.convertModelPositionToViewPosition(modelRange.getStartPosition());
                        const viewPositionTop = this.viewLayout.getVerticalOffsetForLineNumber(viewPosition.lineNumber);
                        this.viewLayout.setScrollPositionNow({ scrollTop: viewPositionTop + this.viewportStartLineDelta });
                    }
                }
            }));
            this._register(this.model.onDidChangeTokens((e) => {
                let viewRanges = [];
                for (let j = 0, lenJ = e.ranges.length; j < lenJ; j++) {
                    const modelRange = e.ranges[j];
                    const viewStartLineNumber = this.coordinatesConverter.convertModelPositionToViewPosition(new position_1.Position(modelRange.fromLineNumber, 1)).lineNumber;
                    const viewEndLineNumber = this.coordinatesConverter.convertModelPositionToViewPosition(new position_1.Position(modelRange.toLineNumber, this.model.getLineMaxColumn(modelRange.toLineNumber))).lineNumber;
                    viewRanges[j] = {
                        fromLineNumber: viewStartLineNumber,
                        toLineNumber: viewEndLineNumber
                    };
                }
                try {
                    const eventsCollector = this._beginEmit();
                    eventsCollector.emit(new viewEvents.ViewTokensChangedEvent(viewRanges));
                }
                finally {
                    this._endEmit();
                }
                if (e.tokenizationSupportChanged) {
                    this._tokenizeViewportSoon.schedule();
                }
            }));
            this._register(this.model.onDidChangeLanguageConfiguration((e) => {
                try {
                    const eventsCollector = this._beginEmit();
                    eventsCollector.emit(new viewEvents.ViewLanguageConfigurationEvent());
                }
                finally {
                    this._endEmit();
                }
            }));
            this._register(this.model.onDidChangeOptions((e) => {
                // A tab size change causes a line mapping changed event => all view parts will repaint OK, no further event needed here
                if (this.lines.setTabSize(this.model.getOptions().tabSize)) {
                    this.decorations.onLineMappingChanged();
                    this.viewLayout.onFlushed(this.getLineCount());
                    try {
                        const eventsCollector = this._beginEmit();
                        eventsCollector.emit(new viewEvents.ViewFlushedEvent());
                        eventsCollector.emit(new viewEvents.ViewLineMappingChangedEvent());
                        eventsCollector.emit(new viewEvents.ViewDecorationsChangedEvent());
                    }
                    finally {
                        this._endEmit();
                    }
                }
            }));
            this._register(this.model.onDidChangeDecorations((e) => {
                this.decorations.onModelDecorationsChanged();
                try {
                    const eventsCollector = this._beginEmit();
                    eventsCollector.emit(new viewEvents.ViewDecorationsChangedEvent());
                }
                finally {
                    this._endEmit();
                }
            }));
        }
        setHiddenAreas(ranges) {
            try {
                const eventsCollector = this._beginEmit();
                let lineMappingChanged = this.lines.setHiddenAreas(ranges);
                if (lineMappingChanged) {
                    eventsCollector.emit(new viewEvents.ViewFlushedEvent());
                    eventsCollector.emit(new viewEvents.ViewLineMappingChangedEvent());
                    eventsCollector.emit(new viewEvents.ViewDecorationsChangedEvent());
                    this.decorations.onLineMappingChanged();
                    this.viewLayout.onFlushed(this.getLineCount());
                    this.viewLayout.onHeightMaybeChanged();
                }
            }
            finally {
                this._endEmit();
            }
        }
        getVisibleRanges() {
            const visibleViewRange = this.getCompletelyVisibleViewRange();
            const visibleRange = this.coordinatesConverter.convertViewRangeToModelRange(visibleViewRange);
            const hiddenAreas = this.lines.getHiddenAreas();
            if (hiddenAreas.length === 0) {
                return [visibleRange];
            }
            let result = [], resultLen = 0;
            let startLineNumber = visibleRange.startLineNumber;
            let startColumn = visibleRange.startColumn;
            let endLineNumber = visibleRange.endLineNumber;
            let endColumn = visibleRange.endColumn;
            for (let i = 0, len = hiddenAreas.length; i < len; i++) {
                const hiddenStartLineNumber = hiddenAreas[i].startLineNumber;
                const hiddenEndLineNumber = hiddenAreas[i].endLineNumber;
                if (hiddenEndLineNumber < startLineNumber) {
                    continue;
                }
                if (hiddenStartLineNumber > endLineNumber) {
                    continue;
                }
                if (startLineNumber < hiddenStartLineNumber) {
                    result[resultLen++] = new range_1.Range(startLineNumber, startColumn, hiddenStartLineNumber - 1, this.model.getLineMaxColumn(hiddenStartLineNumber - 1));
                }
                startLineNumber = hiddenEndLineNumber + 1;
                startColumn = 1;
            }
            if (startLineNumber < endLineNumber || (startLineNumber === endLineNumber && startColumn < endColumn)) {
                result[resultLen++] = new range_1.Range(startLineNumber, startColumn, endLineNumber, endColumn);
            }
            return result;
        }
        getCompletelyVisibleViewRange() {
            const partialData = this.viewLayout.getLinesViewportData();
            const startViewLineNumber = partialData.completelyVisibleStartLineNumber;
            const endViewLineNumber = partialData.completelyVisibleEndLineNumber;
            return new range_1.Range(startViewLineNumber, this.getLineMinColumn(startViewLineNumber), endViewLineNumber, this.getLineMaxColumn(endViewLineNumber));
        }
        getCompletelyVisibleViewRangeAtScrollTop(scrollTop) {
            const partialData = this.viewLayout.getLinesViewportDataAtScrollTop(scrollTop);
            const startViewLineNumber = partialData.completelyVisibleStartLineNumber;
            const endViewLineNumber = partialData.completelyVisibleEndLineNumber;
            return new range_1.Range(startViewLineNumber, this.getLineMinColumn(startViewLineNumber), endViewLineNumber, this.getLineMaxColumn(endViewLineNumber));
        }
        saveState() {
            const compatViewState = this.viewLayout.saveState();
            const scrollTop = compatViewState.scrollTop;
            const firstViewLineNumber = this.viewLayout.getLineNumberAtVerticalOffset(scrollTop);
            const firstPosition = this.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(firstViewLineNumber, this.getLineMinColumn(firstViewLineNumber)));
            const firstPositionDeltaTop = this.viewLayout.getVerticalOffsetForLineNumber(firstViewLineNumber) - scrollTop;
            return {
                scrollLeft: compatViewState.scrollLeft,
                firstPosition: firstPosition,
                firstPositionDeltaTop: firstPositionDeltaTop
            };
        }
        reduceRestoreState(state) {
            if (typeof state.firstPosition === 'undefined') {
                // This is a view state serialized by an older version
                return this._reduceRestoreStateCompatibility(state);
            }
            const modelPosition = this.model.validatePosition(state.firstPosition);
            const viewPosition = this.coordinatesConverter.convertModelPositionToViewPosition(modelPosition);
            const scrollTop = this.viewLayout.getVerticalOffsetForLineNumber(viewPosition.lineNumber) - state.firstPositionDeltaTop;
            return {
                scrollLeft: state.scrollLeft,
                scrollTop: scrollTop
            };
        }
        _reduceRestoreStateCompatibility(state) {
            return {
                scrollLeft: state.scrollLeft,
                scrollTop: state.scrollTopWithoutViewZones
            };
        }
        getTabSize() {
            return this.model.getOptions().tabSize;
        }
        getOptions() {
            return this.model.getOptions();
        }
        getLineCount() {
            return this.lines.getViewLineCount();
        }
        /**
         * Gives a hint that a lot of requests are about to come in for these line numbers.
         */
        setViewport(startLineNumber, endLineNumber, centeredLineNumber) {
            this.lines.warmUpLookupCache(startLineNumber, endLineNumber);
            this.viewportStartLine = startLineNumber;
            let position = this.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(startLineNumber, this.getLineMinColumn(startLineNumber)));
            this.viewportStartLineTrackedRange = this.model._setTrackedRange(this.viewportStartLineTrackedRange, new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column), 1 /* NeverGrowsWhenTypingAtEdges */);
            const viewportStartLineTop = this.viewLayout.getVerticalOffsetForLineNumber(startLineNumber);
            const scrollTop = this.viewLayout.getCurrentScrollTop();
            this.viewportStartLineDelta = scrollTop - viewportStartLineTop;
        }
        getActiveIndentGuide(lineNumber, minLineNumber, maxLineNumber) {
            return this.lines.getActiveIndentGuide(lineNumber, minLineNumber, maxLineNumber);
        }
        getLinesIndentGuides(startLineNumber, endLineNumber) {
            return this.lines.getViewLinesIndentGuides(startLineNumber, endLineNumber);
        }
        getLineContent(lineNumber) {
            return this.lines.getViewLineContent(lineNumber);
        }
        getLineLength(lineNumber) {
            return this.lines.getViewLineLength(lineNumber);
        }
        getLineMinColumn(lineNumber) {
            return this.lines.getViewLineMinColumn(lineNumber);
        }
        getLineMaxColumn(lineNumber) {
            return this.lines.getViewLineMaxColumn(lineNumber);
        }
        getLineFirstNonWhitespaceColumn(lineNumber) {
            const result = strings.firstNonWhitespaceIndex(this.getLineContent(lineNumber));
            if (result === -1) {
                return 0;
            }
            return result + 1;
        }
        getLineLastNonWhitespaceColumn(lineNumber) {
            const result = strings.lastNonWhitespaceIndex(this.getLineContent(lineNumber));
            if (result === -1) {
                return 0;
            }
            return result + 2;
        }
        getDecorationsInViewport(visibleRange) {
            return this.decorations.getDecorationsViewportData(visibleRange).decorations;
        }
        getViewLineRenderingData(visibleRange, lineNumber) {
            let mightContainRTL = this.model.mightContainRTL();
            let mightContainNonBasicASCII = this.model.mightContainNonBasicASCII();
            let tabSize = this.getTabSize();
            let lineData = this.lines.getViewLineData(lineNumber);
            let allInlineDecorations = this.decorations.getDecorationsViewportData(visibleRange).inlineDecorations;
            let inlineDecorations = allInlineDecorations[lineNumber - visibleRange.startLineNumber];
            return new viewModel_1.ViewLineRenderingData(lineData.minColumn, lineData.maxColumn, lineData.content, lineData.continuesWithWrappedLine, mightContainRTL, mightContainNonBasicASCII, lineData.tokens, inlineDecorations, tabSize);
        }
        getViewLineData(lineNumber) {
            return this.lines.getViewLineData(lineNumber);
        }
        getMinimapLinesRenderingData(startLineNumber, endLineNumber, needed) {
            let result = this.lines.getViewLinesData(startLineNumber, endLineNumber, needed);
            return new viewModel_1.MinimapLinesRenderingData(this.getTabSize(), result);
        }
        getAllOverviewRulerDecorations(theme) {
            return this.lines.getAllOverviewRulerDecorations(this.editorId, this.configuration.options.get(64 /* readOnly */), theme);
        }
        invalidateOverviewRulerColorCache() {
            const decorations = this.model.getOverviewRulerDecorations();
            for (const decoration of decorations) {
                const opts = decoration.options.overviewRuler;
                if (opts) {
                    opts.invalidateCachedColor();
                }
            }
        }
        invalidateMinimapColorCache() {
            const decorations = this.model.getAllDecorations();
            for (const decoration of decorations) {
                const opts = decoration.options.minimap;
                if (opts) {
                    opts.invalidateCachedColor();
                }
            }
        }
        getValueInRange(range, eol) {
            const modelRange = this.coordinatesConverter.convertViewRangeToModelRange(range);
            return this.model.getValueInRange(modelRange, eol);
        }
        getModelLineMaxColumn(modelLineNumber) {
            return this.model.getLineMaxColumn(modelLineNumber);
        }
        validateModelPosition(position) {
            return this.model.validatePosition(position);
        }
        validateModelRange(range) {
            return this.model.validateRange(range);
        }
        deduceModelPositionRelativeToViewPosition(viewAnchorPosition, deltaOffset, lineFeedCnt) {
            const modelAnchor = this.coordinatesConverter.convertViewPositionToModelPosition(viewAnchorPosition);
            if (this.model.getEOL().length === 2) {
                // This model uses CRLF, so the delta must take that into account
                if (deltaOffset < 0) {
                    deltaOffset -= lineFeedCnt;
                }
                else {
                    deltaOffset += lineFeedCnt;
                }
            }
            const modelAnchorOffset = this.model.getOffsetAt(modelAnchor);
            const resultOffset = modelAnchorOffset + deltaOffset;
            return this.model.getPositionAt(resultOffset);
        }
        getEOL() {
            return this.model.getEOL();
        }
        getPlainTextToCopy(ranges, emptySelectionClipboard, forceCRLF) {
            const newLineCharacter = forceCRLF ? '\r\n' : this.model.getEOL();
            ranges = ranges.slice(0);
            ranges.sort(range_1.Range.compareRangesUsingStarts);
            let hasEmptyRange = false;
            let hasNonEmptyRange = false;
            for (const range of ranges) {
                if (range.isEmpty()) {
                    hasEmptyRange = true;
                }
                else {
                    hasNonEmptyRange = true;
                }
            }
            if (!hasNonEmptyRange) {
                // all ranges are empty
                if (!emptySelectionClipboard) {
                    return '';
                }
                const modelLineNumbers = ranges.map((r) => {
                    const viewLineStart = new position_1.Position(r.startLineNumber, 1);
                    return this.coordinatesConverter.convertViewPositionToModelPosition(viewLineStart).lineNumber;
                });
                let result = '';
                for (let i = 0; i < modelLineNumbers.length; i++) {
                    if (i > 0 && modelLineNumbers[i - 1] === modelLineNumbers[i]) {
                        continue;
                    }
                    result += this.model.getLineContent(modelLineNumbers[i]) + newLineCharacter;
                }
                return result;
            }
            if (hasEmptyRange && emptySelectionClipboard) {
                // mixed empty selections and non-empty selections
                let result = [];
                let prevModelLineNumber = 0;
                for (const range of ranges) {
                    const modelLineNumber = this.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(range.startLineNumber, 1)).lineNumber;
                    if (range.isEmpty()) {
                        if (modelLineNumber !== prevModelLineNumber) {
                            result.push(this.model.getLineContent(modelLineNumber));
                        }
                    }
                    else {
                        result.push(this.getValueInRange(range, forceCRLF ? 2 /* CRLF */ : 0 /* TextDefined */));
                    }
                    prevModelLineNumber = modelLineNumber;
                }
                return result.length === 1 ? result[0] : result;
            }
            let result = [];
            for (const range of ranges) {
                if (!range.isEmpty()) {
                    result.push(this.getValueInRange(range, forceCRLF ? 2 /* CRLF */ : 0 /* TextDefined */));
                }
            }
            return result.length === 1 ? result[0] : result;
        }
        getHTMLToCopy(viewRanges, emptySelectionClipboard) {
            if (this.model.getLanguageIdentifier().id === 1 /* PlainText */) {
                return null;
            }
            if (viewRanges.length !== 1) {
                // no multiple selection support at this time
                return null;
            }
            let range = this.coordinatesConverter.convertViewRangeToModelRange(viewRanges[0]);
            if (range.isEmpty()) {
                if (!emptySelectionClipboard) {
                    // nothing to copy
                    return null;
                }
                let lineNumber = range.startLineNumber;
                range = new range_1.Range(lineNumber, this.model.getLineMinColumn(lineNumber), lineNumber, this.model.getLineMaxColumn(lineNumber));
            }
            const fontInfo = this.configuration.options.get(31 /* fontInfo */);
            const colorMap = this._getColorMap();
            const fontFamily = fontInfo.fontFamily === editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily ? fontInfo.fontFamily : `'${fontInfo.fontFamily}', ${editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily}`;
            return (`<div style="`
                + `color: ${colorMap[1 /* DefaultForeground */]};`
                + `background-color: ${colorMap[2 /* DefaultBackground */]};`
                + `font-family: ${fontFamily};`
                + `font-weight: ${fontInfo.fontWeight};`
                + `font-size: ${fontInfo.fontSize}px;`
                + `line-height: ${fontInfo.lineHeight}px;`
                + `white-space: pre;`
                + `">`
                + this._getHTMLToCopy(range, colorMap)
                + '</div>');
        }
        _getHTMLToCopy(modelRange, colorMap) {
            const startLineNumber = modelRange.startLineNumber;
            const startColumn = modelRange.startColumn;
            const endLineNumber = modelRange.endLineNumber;
            const endColumn = modelRange.endColumn;
            const tabSize = this.getTabSize();
            let result = '';
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                const lineTokens = this.model.getLineTokens(lineNumber);
                const lineContent = lineTokens.getLineContent();
                const startOffset = (lineNumber === startLineNumber ? startColumn - 1 : 0);
                const endOffset = (lineNumber === endLineNumber ? endColumn - 1 : lineContent.length);
                if (lineContent === '') {
                    result += '<br>';
                }
                else {
                    result += textToHtmlTokenizer_1.tokenizeLineToHTML(lineContent, lineTokens.inflate(), colorMap, startOffset, endOffset, tabSize, platform.isWindows);
                }
            }
            return result;
        }
        _getColorMap() {
            let colorMap = modes_1.TokenizationRegistry.getColorMap();
            let result = ['#000000'];
            if (colorMap) {
                for (let i = 1, len = colorMap.length; i < len; i++) {
                    result[i] = color_1.Color.Format.CSS.formatHex(colorMap[i]);
                }
            }
            return result;
        }
    }
    exports.ViewModel = ViewModel;
});
//# sourceMappingURL=viewModelImpl.js.map