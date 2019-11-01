/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/editor/browser/view/dynamicViewOverlay", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/css!./selections"], function (require, exports, browser, dynamicViewOverlay_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CornerStyle;
    (function (CornerStyle) {
        CornerStyle[CornerStyle["EXTERN"] = 0] = "EXTERN";
        CornerStyle[CornerStyle["INTERN"] = 1] = "INTERN";
        CornerStyle[CornerStyle["FLAT"] = 2] = "FLAT";
    })(CornerStyle || (CornerStyle = {}));
    class HorizontalRangeWithStyle {
        constructor(other) {
            this.left = other.left;
            this.width = other.width;
            this.startStyle = null;
            this.endStyle = null;
        }
    }
    class LineVisibleRangesWithStyle {
        constructor(lineNumber, ranges) {
            this.lineNumber = lineNumber;
            this.ranges = ranges;
        }
    }
    function toStyledRange(item) {
        return new HorizontalRangeWithStyle(item);
    }
    function toStyled(item) {
        return new LineVisibleRangesWithStyle(item.lineNumber, item.ranges.map(toStyledRange));
    }
    // TODO@Alex: Remove this once IE11 fixes Bug #524217
    // The problem in IE11 is that it does some sort of auto-zooming to accomodate for displays with different pixel density.
    // Unfortunately, this auto-zooming is buggy around dealing with rounded borders
    const isIEWithZoomingIssuesNearRoundedBorders = browser.isEdgeOrIE;
    class SelectionsOverlay extends dynamicViewOverlay_1.DynamicViewOverlay {
        constructor(context) {
            super();
            this._previousFrameVisibleRangesWithStyle = [];
            this._context = context;
            const options = this._context.configuration.options;
            this._lineHeight = options.get(45 /* lineHeight */);
            this._roundedSelection = options.get(70 /* roundedSelection */);
            this._typicalHalfwidthCharacterWidth = options.get(30 /* fontInfo */).typicalHalfwidthCharacterWidth;
            this._selections = [];
            this._renderResult = null;
            this._context.addEventHandler(this);
        }
        dispose() {
            this._context.removeEventHandler(this);
            this._renderResult = null;
            super.dispose();
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            this._lineHeight = options.get(45 /* lineHeight */);
            this._roundedSelection = options.get(70 /* roundedSelection */);
            this._typicalHalfwidthCharacterWidth = options.get(30 /* fontInfo */).typicalHalfwidthCharacterWidth;
            return true;
        }
        onCursorStateChanged(e) {
            this._selections = e.selections.slice(0);
            return true;
        }
        onDecorationsChanged(e) {
            // true for inline decorations that can end up relayouting text
            return true; //e.inlineDecorationsChanged;
        }
        onFlushed(e) {
            return true;
        }
        onLinesChanged(e) {
            return true;
        }
        onLinesDeleted(e) {
            return true;
        }
        onLinesInserted(e) {
            return true;
        }
        onScrollChanged(e) {
            return e.scrollTopChanged;
        }
        onZonesChanged(e) {
            return true;
        }
        // --- end event handlers
        _visibleRangesHaveGaps(linesVisibleRanges) {
            for (let i = 0, len = linesVisibleRanges.length; i < len; i++) {
                const lineVisibleRanges = linesVisibleRanges[i];
                if (lineVisibleRanges.ranges.length > 1) {
                    // There are two ranges on the same line
                    return true;
                }
            }
            return false;
        }
        _enrichVisibleRangesWithStyle(viewport, linesVisibleRanges, previousFrame) {
            const epsilon = this._typicalHalfwidthCharacterWidth / 4;
            let previousFrameTop = null;
            let previousFrameBottom = null;
            if (previousFrame && previousFrame.length > 0 && linesVisibleRanges.length > 0) {
                const topLineNumber = linesVisibleRanges[0].lineNumber;
                if (topLineNumber === viewport.startLineNumber) {
                    for (let i = 0; !previousFrameTop && i < previousFrame.length; i++) {
                        if (previousFrame[i].lineNumber === topLineNumber) {
                            previousFrameTop = previousFrame[i].ranges[0];
                        }
                    }
                }
                const bottomLineNumber = linesVisibleRanges[linesVisibleRanges.length - 1].lineNumber;
                if (bottomLineNumber === viewport.endLineNumber) {
                    for (let i = previousFrame.length - 1; !previousFrameBottom && i >= 0; i--) {
                        if (previousFrame[i].lineNumber === bottomLineNumber) {
                            previousFrameBottom = previousFrame[i].ranges[0];
                        }
                    }
                }
                if (previousFrameTop && !previousFrameTop.startStyle) {
                    previousFrameTop = null;
                }
                if (previousFrameBottom && !previousFrameBottom.startStyle) {
                    previousFrameBottom = null;
                }
            }
            for (let i = 0, len = linesVisibleRanges.length; i < len; i++) {
                // We know for a fact that there is precisely one range on each line
                const curLineRange = linesVisibleRanges[i].ranges[0];
                const curLeft = curLineRange.left;
                const curRight = curLineRange.left + curLineRange.width;
                const startStyle = {
                    top: 0 /* EXTERN */,
                    bottom: 0 /* EXTERN */
                };
                const endStyle = {
                    top: 0 /* EXTERN */,
                    bottom: 0 /* EXTERN */
                };
                if (i > 0) {
                    // Look above
                    const prevLeft = linesVisibleRanges[i - 1].ranges[0].left;
                    const prevRight = linesVisibleRanges[i - 1].ranges[0].left + linesVisibleRanges[i - 1].ranges[0].width;
                    if (abs(curLeft - prevLeft) < epsilon) {
                        startStyle.top = 2 /* FLAT */;
                    }
                    else if (curLeft > prevLeft) {
                        startStyle.top = 1 /* INTERN */;
                    }
                    if (abs(curRight - prevRight) < epsilon) {
                        endStyle.top = 2 /* FLAT */;
                    }
                    else if (prevLeft < curRight && curRight < prevRight) {
                        endStyle.top = 1 /* INTERN */;
                    }
                }
                else if (previousFrameTop) {
                    // Accept some hick-ups near the viewport edges to save on repaints
                    startStyle.top = previousFrameTop.startStyle.top;
                    endStyle.top = previousFrameTop.endStyle.top;
                }
                if (i + 1 < len) {
                    // Look below
                    const nextLeft = linesVisibleRanges[i + 1].ranges[0].left;
                    const nextRight = linesVisibleRanges[i + 1].ranges[0].left + linesVisibleRanges[i + 1].ranges[0].width;
                    if (abs(curLeft - nextLeft) < epsilon) {
                        startStyle.bottom = 2 /* FLAT */;
                    }
                    else if (nextLeft < curLeft && curLeft < nextRight) {
                        startStyle.bottom = 1 /* INTERN */;
                    }
                    if (abs(curRight - nextRight) < epsilon) {
                        endStyle.bottom = 2 /* FLAT */;
                    }
                    else if (curRight < nextRight) {
                        endStyle.bottom = 1 /* INTERN */;
                    }
                }
                else if (previousFrameBottom) {
                    // Accept some hick-ups near the viewport edges to save on repaints
                    startStyle.bottom = previousFrameBottom.startStyle.bottom;
                    endStyle.bottom = previousFrameBottom.endStyle.bottom;
                }
                curLineRange.startStyle = startStyle;
                curLineRange.endStyle = endStyle;
            }
        }
        _getVisibleRangesWithStyle(selection, ctx, previousFrame) {
            const _linesVisibleRanges = ctx.linesVisibleRangesForRange(selection, true) || [];
            const linesVisibleRanges = _linesVisibleRanges.map(toStyled);
            const visibleRangesHaveGaps = this._visibleRangesHaveGaps(linesVisibleRanges);
            if (!isIEWithZoomingIssuesNearRoundedBorders && !visibleRangesHaveGaps && this._roundedSelection) {
                this._enrichVisibleRangesWithStyle(ctx.visibleRange, linesVisibleRanges, previousFrame);
            }
            // The visible ranges are sorted TOP-BOTTOM and LEFT-RIGHT
            return linesVisibleRanges;
        }
        _createSelectionPiece(top, height, className, left, width) {
            return ('<div class="cslr '
                + className
                + '" style="top:'
                + top.toString()
                + 'px;left:'
                + left.toString()
                + 'px;width:'
                + width.toString()
                + 'px;height:'
                + height
                + 'px;"></div>');
        }
        _actualRenderOneSelection(output2, visibleStartLineNumber, hasMultipleSelections, visibleRanges) {
            const visibleRangesHaveStyle = (visibleRanges.length > 0 && visibleRanges[0].ranges[0].startStyle);
            const fullLineHeight = (this._lineHeight).toString();
            const reducedLineHeight = (this._lineHeight - 1).toString();
            const firstLineNumber = (visibleRanges.length > 0 ? visibleRanges[0].lineNumber : 0);
            const lastLineNumber = (visibleRanges.length > 0 ? visibleRanges[visibleRanges.length - 1].lineNumber : 0);
            for (let i = 0, len = visibleRanges.length; i < len; i++) {
                const lineVisibleRanges = visibleRanges[i];
                const lineNumber = lineVisibleRanges.lineNumber;
                const lineIndex = lineNumber - visibleStartLineNumber;
                const lineHeight = hasMultipleSelections ? (lineNumber === lastLineNumber || lineNumber === firstLineNumber ? reducedLineHeight : fullLineHeight) : fullLineHeight;
                const top = hasMultipleSelections ? (lineNumber === firstLineNumber ? 1 : 0) : 0;
                let lineOutput = '';
                for (let j = 0, lenJ = lineVisibleRanges.ranges.length; j < lenJ; j++) {
                    const visibleRange = lineVisibleRanges.ranges[j];
                    if (visibleRangesHaveStyle) {
                        const startStyle = visibleRange.startStyle;
                        const endStyle = visibleRange.endStyle;
                        if (startStyle.top === 1 /* INTERN */ || startStyle.bottom === 1 /* INTERN */) {
                            // Reverse rounded corner to the left
                            // First comes the selection (blue layer)
                            lineOutput += this._createSelectionPiece(top, lineHeight, SelectionsOverlay.SELECTION_CLASS_NAME, visibleRange.left - SelectionsOverlay.ROUNDED_PIECE_WIDTH, SelectionsOverlay.ROUNDED_PIECE_WIDTH);
                            // Second comes the background (white layer) with inverse border radius
                            let className = SelectionsOverlay.EDITOR_BACKGROUND_CLASS_NAME;
                            if (startStyle.top === 1 /* INTERN */) {
                                className += ' ' + SelectionsOverlay.SELECTION_TOP_RIGHT;
                            }
                            if (startStyle.bottom === 1 /* INTERN */) {
                                className += ' ' + SelectionsOverlay.SELECTION_BOTTOM_RIGHT;
                            }
                            lineOutput += this._createSelectionPiece(top, lineHeight, className, visibleRange.left - SelectionsOverlay.ROUNDED_PIECE_WIDTH, SelectionsOverlay.ROUNDED_PIECE_WIDTH);
                        }
                        if (endStyle.top === 1 /* INTERN */ || endStyle.bottom === 1 /* INTERN */) {
                            // Reverse rounded corner to the right
                            // First comes the selection (blue layer)
                            lineOutput += this._createSelectionPiece(top, lineHeight, SelectionsOverlay.SELECTION_CLASS_NAME, visibleRange.left + visibleRange.width, SelectionsOverlay.ROUNDED_PIECE_WIDTH);
                            // Second comes the background (white layer) with inverse border radius
                            let className = SelectionsOverlay.EDITOR_BACKGROUND_CLASS_NAME;
                            if (endStyle.top === 1 /* INTERN */) {
                                className += ' ' + SelectionsOverlay.SELECTION_TOP_LEFT;
                            }
                            if (endStyle.bottom === 1 /* INTERN */) {
                                className += ' ' + SelectionsOverlay.SELECTION_BOTTOM_LEFT;
                            }
                            lineOutput += this._createSelectionPiece(top, lineHeight, className, visibleRange.left + visibleRange.width, SelectionsOverlay.ROUNDED_PIECE_WIDTH);
                        }
                    }
                    let className = SelectionsOverlay.SELECTION_CLASS_NAME;
                    if (visibleRangesHaveStyle) {
                        const startStyle = visibleRange.startStyle;
                        const endStyle = visibleRange.endStyle;
                        if (startStyle.top === 0 /* EXTERN */) {
                            className += ' ' + SelectionsOverlay.SELECTION_TOP_LEFT;
                        }
                        if (startStyle.bottom === 0 /* EXTERN */) {
                            className += ' ' + SelectionsOverlay.SELECTION_BOTTOM_LEFT;
                        }
                        if (endStyle.top === 0 /* EXTERN */) {
                            className += ' ' + SelectionsOverlay.SELECTION_TOP_RIGHT;
                        }
                        if (endStyle.bottom === 0 /* EXTERN */) {
                            className += ' ' + SelectionsOverlay.SELECTION_BOTTOM_RIGHT;
                        }
                    }
                    lineOutput += this._createSelectionPiece(top, lineHeight, className, visibleRange.left, visibleRange.width);
                }
                output2[lineIndex] += lineOutput;
            }
        }
        prepareRender(ctx) {
            const output = [];
            const visibleStartLineNumber = ctx.visibleRange.startLineNumber;
            const visibleEndLineNumber = ctx.visibleRange.endLineNumber;
            for (let lineNumber = visibleStartLineNumber; lineNumber <= visibleEndLineNumber; lineNumber++) {
                const lineIndex = lineNumber - visibleStartLineNumber;
                output[lineIndex] = '';
            }
            const thisFrameVisibleRangesWithStyle = [];
            for (let i = 0, len = this._selections.length; i < len; i++) {
                const selection = this._selections[i];
                if (selection.isEmpty()) {
                    thisFrameVisibleRangesWithStyle[i] = null;
                    continue;
                }
                const visibleRangesWithStyle = this._getVisibleRangesWithStyle(selection, ctx, this._previousFrameVisibleRangesWithStyle[i]);
                thisFrameVisibleRangesWithStyle[i] = visibleRangesWithStyle;
                this._actualRenderOneSelection(output, visibleStartLineNumber, this._selections.length > 1, visibleRangesWithStyle);
            }
            this._previousFrameVisibleRangesWithStyle = thisFrameVisibleRangesWithStyle;
            this._renderResult = output;
        }
        render(startLineNumber, lineNumber) {
            if (!this._renderResult) {
                return '';
            }
            const lineIndex = lineNumber - startLineNumber;
            if (lineIndex < 0 || lineIndex >= this._renderResult.length) {
                return '';
            }
            return this._renderResult[lineIndex];
        }
    }
    exports.SelectionsOverlay = SelectionsOverlay;
    SelectionsOverlay.SELECTION_CLASS_NAME = 'selected-text';
    SelectionsOverlay.SELECTION_TOP_LEFT = 'top-left-radius';
    SelectionsOverlay.SELECTION_BOTTOM_LEFT = 'bottom-left-radius';
    SelectionsOverlay.SELECTION_TOP_RIGHT = 'top-right-radius';
    SelectionsOverlay.SELECTION_BOTTOM_RIGHT = 'bottom-right-radius';
    SelectionsOverlay.EDITOR_BACKGROUND_CLASS_NAME = 'monaco-editor-background';
    SelectionsOverlay.ROUNDED_PIECE_WIDTH = 10;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const editorSelectionColor = theme.getColor(colorRegistry_1.editorSelectionBackground);
        if (editorSelectionColor) {
            collector.addRule(`.monaco-editor .focused .selected-text { background-color: ${editorSelectionColor}; }`);
        }
        const editorInactiveSelectionColor = theme.getColor(colorRegistry_1.editorInactiveSelection);
        if (editorInactiveSelectionColor) {
            collector.addRule(`.monaco-editor .selected-text { background-color: ${editorInactiveSelectionColor}; }`);
        }
        const editorSelectionForegroundColor = theme.getColor(colorRegistry_1.editorSelectionForeground);
        if (editorSelectionForegroundColor) {
            collector.addRule(`.monaco-editor .view-line span.inline-selected-text { color: ${editorSelectionForegroundColor}; }`);
        }
    });
    function abs(n) {
        return n < 0 ? -n : n;
    }
});
//# sourceMappingURL=selections.js.map