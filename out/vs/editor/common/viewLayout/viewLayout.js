/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/scrollable", "vs/editor/common/viewLayout/linesLayout", "vs/editor/common/viewModel/viewModel"], function (require, exports, lifecycle_1, scrollable_1, linesLayout_1, viewModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const SMOOTH_SCROLLING_TIME = 125;
    class ViewLayout extends lifecycle_1.Disposable {
        constructor(configuration, lineCount, scheduleAtNextAnimationFrame) {
            super();
            this._configuration = configuration;
            const options = this._configuration.options;
            const layoutInfo = options.get(101 /* layoutInfo */);
            this._linesLayout = new linesLayout_1.LinesLayout(lineCount, options.get(45 /* lineHeight */));
            this.scrollable = this._register(new scrollable_1.Scrollable(0, scheduleAtNextAnimationFrame));
            this._configureSmoothScrollDuration();
            this.scrollable.setScrollDimensions({
                width: layoutInfo.contentWidth,
                height: layoutInfo.contentHeight
            });
            this.onDidScroll = this.scrollable.onScroll;
            this._updateHeight();
        }
        dispose() {
            super.dispose();
        }
        onHeightMaybeChanged() {
            this._updateHeight();
        }
        _configureSmoothScrollDuration() {
            this.scrollable.setSmoothScrollDuration(this._configuration.options.get(81 /* smoothScrolling */) ? SMOOTH_SCROLLING_TIME : 0);
        }
        // ---- begin view event handlers
        onConfigurationChanged(e) {
            const options = this._configuration.options;
            if (e.hasChanged(45 /* lineHeight */)) {
                this._linesLayout.setLineHeight(options.get(45 /* lineHeight */));
            }
            if (e.hasChanged(101 /* layoutInfo */)) {
                const layoutInfo = options.get(101 /* layoutInfo */);
                this.scrollable.setScrollDimensions({
                    width: layoutInfo.contentWidth,
                    height: layoutInfo.contentHeight
                });
            }
            if (e.hasChanged(81 /* smoothScrolling */)) {
                this._configureSmoothScrollDuration();
            }
            this._updateHeight();
        }
        onFlushed(lineCount) {
            this._linesLayout.onFlushed(lineCount);
        }
        onLinesDeleted(fromLineNumber, toLineNumber) {
            this._linesLayout.onLinesDeleted(fromLineNumber, toLineNumber);
        }
        onLinesInserted(fromLineNumber, toLineNumber) {
            this._linesLayout.onLinesInserted(fromLineNumber, toLineNumber);
        }
        // ---- end view event handlers
        _getHorizontalScrollbarHeight(scrollDimensions) {
            const options = this._configuration.options;
            const scrollbar = options.get(72 /* scrollbar */);
            if (scrollbar.horizontal === 2 /* Hidden */) {
                // horizontal scrollbar not visible
                return 0;
            }
            if (scrollDimensions.width >= scrollDimensions.scrollWidth) {
                // horizontal scrollbar not visible
                return 0;
            }
            return scrollbar.horizontalScrollbarSize;
        }
        _getTotalHeight() {
            const options = this._configuration.options;
            const scrollDimensions = this.scrollable.getScrollDimensions();
            let result = this._linesLayout.getLinesTotalHeight();
            if (options.get(74 /* scrollBeyondLastLine */)) {
                result += scrollDimensions.height - options.get(45 /* lineHeight */);
            }
            else {
                result += this._getHorizontalScrollbarHeight(scrollDimensions);
            }
            return Math.max(scrollDimensions.height, result);
        }
        _updateHeight() {
            this.scrollable.setScrollDimensions({
                scrollHeight: this._getTotalHeight()
            });
        }
        // ---- Layouting logic
        getCurrentViewport() {
            const scrollDimensions = this.scrollable.getScrollDimensions();
            const currentScrollPosition = this.scrollable.getCurrentScrollPosition();
            return new viewModel_1.Viewport(currentScrollPosition.scrollTop, currentScrollPosition.scrollLeft, scrollDimensions.width, scrollDimensions.height);
        }
        getFutureViewport() {
            const scrollDimensions = this.scrollable.getScrollDimensions();
            const currentScrollPosition = this.scrollable.getFutureScrollPosition();
            return new viewModel_1.Viewport(currentScrollPosition.scrollTop, currentScrollPosition.scrollLeft, scrollDimensions.width, scrollDimensions.height);
        }
        _computeScrollWidth(maxLineWidth, viewportWidth) {
            const options = this._configuration.options;
            const wrappingInfo = options.get(102 /* wrappingInfo */);
            let isViewportWrapping = wrappingInfo.isViewportWrapping;
            if (!isViewportWrapping) {
                const extraHorizontalSpace = options.get(73 /* scrollBeyondLastColumn */) * options.get(30 /* fontInfo */).typicalHalfwidthCharacterWidth;
                const whitespaceMinWidth = this._linesLayout.getWhitespaceMinWidth();
                return Math.max(maxLineWidth + extraHorizontalSpace, viewportWidth, whitespaceMinWidth);
            }
            return Math.max(maxLineWidth, viewportWidth);
        }
        onMaxLineWidthChanged(maxLineWidth) {
            let newScrollWidth = this._computeScrollWidth(maxLineWidth, this.getCurrentViewport().width);
            this.scrollable.setScrollDimensions({
                scrollWidth: newScrollWidth
            });
            // The height might depend on the fact that there is a horizontal scrollbar or not
            this._updateHeight();
        }
        // ---- view state
        saveState() {
            const currentScrollPosition = this.scrollable.getFutureScrollPosition();
            let scrollTop = currentScrollPosition.scrollTop;
            let firstLineNumberInViewport = this._linesLayout.getLineNumberAtOrAfterVerticalOffset(scrollTop);
            let whitespaceAboveFirstLine = this._linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(firstLineNumberInViewport);
            return {
                scrollTop: scrollTop,
                scrollTopWithoutViewZones: scrollTop - whitespaceAboveFirstLine,
                scrollLeft: currentScrollPosition.scrollLeft
            };
        }
        // ---- IVerticalLayoutProvider
        addWhitespace(afterLineNumber, ordinal, height, minWidth) {
            return this._linesLayout.insertWhitespace(afterLineNumber, ordinal, height, minWidth);
        }
        changeWhitespace(id, newAfterLineNumber, newHeight) {
            return this._linesLayout.changeWhitespace(id, newAfterLineNumber, newHeight);
        }
        removeWhitespace(id) {
            return this._linesLayout.removeWhitespace(id);
        }
        getVerticalOffsetForLineNumber(lineNumber) {
            return this._linesLayout.getVerticalOffsetForLineNumber(lineNumber);
        }
        isAfterLines(verticalOffset) {
            return this._linesLayout.isAfterLines(verticalOffset);
        }
        getLineNumberAtVerticalOffset(verticalOffset) {
            return this._linesLayout.getLineNumberAtOrAfterVerticalOffset(verticalOffset);
        }
        getWhitespaceAtVerticalOffset(verticalOffset) {
            return this._linesLayout.getWhitespaceAtVerticalOffset(verticalOffset);
        }
        getLinesViewportData() {
            const visibleBox = this.getCurrentViewport();
            return this._linesLayout.getLinesViewportData(visibleBox.top, visibleBox.top + visibleBox.height);
        }
        getLinesViewportDataAtScrollTop(scrollTop) {
            // do some minimal validations on scrollTop
            const scrollDimensions = this.scrollable.getScrollDimensions();
            if (scrollTop + scrollDimensions.height > scrollDimensions.scrollHeight) {
                scrollTop = scrollDimensions.scrollHeight - scrollDimensions.height;
            }
            if (scrollTop < 0) {
                scrollTop = 0;
            }
            return this._linesLayout.getLinesViewportData(scrollTop, scrollTop + scrollDimensions.height);
        }
        getWhitespaceViewportData() {
            const visibleBox = this.getCurrentViewport();
            return this._linesLayout.getWhitespaceViewportData(visibleBox.top, visibleBox.top + visibleBox.height);
        }
        getWhitespaces() {
            return this._linesLayout.getWhitespaces();
        }
        // ---- IScrollingProvider
        getScrollWidth() {
            const scrollDimensions = this.scrollable.getScrollDimensions();
            return scrollDimensions.scrollWidth;
        }
        getScrollHeight() {
            const scrollDimensions = this.scrollable.getScrollDimensions();
            return scrollDimensions.scrollHeight;
        }
        getCurrentScrollLeft() {
            const currentScrollPosition = this.scrollable.getCurrentScrollPosition();
            return currentScrollPosition.scrollLeft;
        }
        getCurrentScrollTop() {
            const currentScrollPosition = this.scrollable.getCurrentScrollPosition();
            return currentScrollPosition.scrollTop;
        }
        validateScrollPosition(scrollPosition) {
            return this.scrollable.validateScrollPosition(scrollPosition);
        }
        setScrollPositionNow(position) {
            this.scrollable.setScrollPositionNow(position);
        }
        setScrollPositionSmooth(position) {
            this.scrollable.setScrollPositionSmooth(position);
        }
        deltaScrollNow(deltaScrollLeft, deltaScrollTop) {
            const currentScrollPosition = this.scrollable.getCurrentScrollPosition();
            this.scrollable.setScrollPositionNow({
                scrollLeft: currentScrollPosition.scrollLeft + deltaScrollLeft,
                scrollTop: currentScrollPosition.scrollTop + deltaScrollTop
            });
        }
    }
    exports.ViewLayout = ViewLayout;
});
//# sourceMappingURL=viewLayout.js.map