/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/base/browser/globalMouseMoveMonitor", "vs/base/common/platform", "vs/base/common/strings", "vs/editor/browser/view/viewLayer", "vs/editor/browser/view/viewPart", "vs/editor/common/core/range", "vs/editor/common/viewModel/minimapTokensColorTracker", "vs/editor/common/view/viewEvents", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/base/browser/touch", "vs/editor/browser/viewParts/minimap/minimapCharRendererFactory", "vs/css!./minimap"], function (require, exports, dom, fastDomNode_1, globalMouseMoveMonitor_1, platform, strings, viewLayer_1, viewPart_1, range_1, minimapTokensColorTracker_1, viewEvents, colorRegistry_1, themeService_1, touch_1, minimapCharRendererFactory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getMinimapLineHeight(renderMinimap, scale) {
        if (renderMinimap === 1 /* Text */) {
            return 2 /* BASE_CHAR_HEIGHT */ * scale;
        }
        // RenderMinimap.Blocks
        return (2 /* BASE_CHAR_HEIGHT */ + 1) * scale;
    }
    function getMinimapCharWidth(renderMinimap, scale) {
        if (renderMinimap === 1 /* Text */) {
            return 1 /* BASE_CHAR_WIDTH */ * scale;
        }
        // RenderMinimap.Blocks
        return 1 /* BASE_CHAR_WIDTH */ * scale;
    }
    /**
     * The orthogonal distance to the slider at which dragging "resets". This implements "snapping"
     */
    const MOUSE_DRAG_RESET_DISTANCE = 140;
    class MinimapOptions {
        constructor(configuration) {
            const options = configuration.options;
            const pixelRatio = options.get(99 /* pixelRatio */);
            const layoutInfo = options.get(101 /* layoutInfo */);
            const fontInfo = options.get(30 /* fontInfo */);
            this.renderMinimap = layoutInfo.renderMinimap | 0;
            this.scrollBeyondLastLine = options.get(74 /* scrollBeyondLastLine */);
            const minimapOpts = options.get(50 /* minimap */);
            this.showSlider = minimapOpts.showSlider;
            this.fontScale = Math.round(minimapOpts.scale * pixelRatio);
            this.charRenderer = minimapCharRendererFactory_1.MinimapCharRendererFactory.create(this.fontScale, fontInfo.fontFamily);
            this.pixelRatio = pixelRatio;
            this.typicalHalfwidthCharacterWidth = fontInfo.typicalHalfwidthCharacterWidth;
            this.lineHeight = options.get(45 /* lineHeight */);
            this.minimapLeft = layoutInfo.minimapLeft;
            this.minimapWidth = layoutInfo.minimapWidth;
            this.minimapHeight = layoutInfo.height;
            this.canvasInnerWidth = Math.max(1, Math.floor(pixelRatio * this.minimapWidth));
            this.canvasInnerHeight = Math.max(1, Math.floor(pixelRatio * this.minimapHeight));
            this.canvasOuterWidth = this.canvasInnerWidth / pixelRatio;
            this.canvasOuterHeight = this.canvasInnerHeight / pixelRatio;
        }
        equals(other) {
            return (this.renderMinimap === other.renderMinimap
                && this.scrollBeyondLastLine === other.scrollBeyondLastLine
                && this.showSlider === other.showSlider
                && this.pixelRatio === other.pixelRatio
                && this.typicalHalfwidthCharacterWidth === other.typicalHalfwidthCharacterWidth
                && this.lineHeight === other.lineHeight
                && this.fontScale === other.fontScale
                && this.minimapLeft === other.minimapLeft
                && this.minimapWidth === other.minimapWidth
                && this.minimapHeight === other.minimapHeight
                && this.canvasInnerWidth === other.canvasInnerWidth
                && this.canvasInnerHeight === other.canvasInnerHeight
                && this.canvasOuterWidth === other.canvasOuterWidth
                && this.canvasOuterHeight === other.canvasOuterHeight);
        }
    }
    class MinimapLayout {
        constructor(scrollTop, scrollHeight, computedSliderRatio, sliderTop, sliderHeight, startLineNumber, endLineNumber) {
            this.scrollTop = scrollTop;
            this.scrollHeight = scrollHeight;
            this._computedSliderRatio = computedSliderRatio;
            this.sliderTop = sliderTop;
            this.sliderHeight = sliderHeight;
            this.startLineNumber = startLineNumber;
            this.endLineNumber = endLineNumber;
        }
        /**
         * Compute a desired `scrollPosition` such that the slider moves by `delta`.
         */
        getDesiredScrollTopFromDelta(delta) {
            const desiredSliderPosition = this.sliderTop + delta;
            return Math.round(desiredSliderPosition / this._computedSliderRatio);
        }
        getDesiredScrollTopFromTouchLocation(pageY) {
            return Math.round((pageY - this.sliderHeight / 2) / this._computedSliderRatio);
        }
        static create(options, viewportStartLineNumber, viewportEndLineNumber, viewportHeight, viewportContainsWhitespaceGaps, lineCount, scrollTop, scrollHeight, previousLayout) {
            const pixelRatio = options.pixelRatio;
            const minimapLineHeight = getMinimapLineHeight(options.renderMinimap, options.fontScale);
            const minimapLinesFitting = Math.floor(options.canvasInnerHeight / minimapLineHeight);
            const lineHeight = options.lineHeight;
            // The visible line count in a viewport can change due to a number of reasons:
            //  a) with the same viewport width, different scroll positions can result in partial lines being visible:
            //    e.g. for a line height of 20, and a viewport height of 600
            //          * scrollTop = 0  => visible lines are [1, 30]
            //          * scrollTop = 10 => visible lines are [1, 31] (with lines 1 and 31 partially visible)
            //          * scrollTop = 20 => visible lines are [2, 31]
            //  b) whitespace gaps might make their way in the viewport (which results in a decrease in the visible line count)
            //  c) we could be in the scroll beyond last line case (which also results in a decrease in the visible line count, down to possibly only one line being visible)
            // We must first establish a desirable slider height.
            let sliderHeight;
            if (viewportContainsWhitespaceGaps && viewportEndLineNumber !== lineCount) {
                // case b) from above: there are whitespace gaps in the viewport.
                // In this case, the height of the slider directly reflects the visible line count.
                const viewportLineCount = viewportEndLineNumber - viewportStartLineNumber + 1;
                sliderHeight = Math.floor(viewportLineCount * minimapLineHeight / pixelRatio);
            }
            else {
                // The slider has a stable height
                const expectedViewportLineCount = viewportHeight / lineHeight;
                sliderHeight = Math.floor(expectedViewportLineCount * minimapLineHeight / pixelRatio);
            }
            let maxMinimapSliderTop;
            if (options.scrollBeyondLastLine) {
                // The minimap slider, when dragged all the way down, will contain the last line at its top
                maxMinimapSliderTop = (lineCount - 1) * minimapLineHeight / pixelRatio;
            }
            else {
                // The minimap slider, when dragged all the way down, will contain the last line at its bottom
                maxMinimapSliderTop = Math.max(0, lineCount * minimapLineHeight / pixelRatio - sliderHeight);
            }
            maxMinimapSliderTop = Math.min(options.minimapHeight - sliderHeight, maxMinimapSliderTop);
            // The slider can move from 0 to `maxMinimapSliderTop`
            // in the same way `scrollTop` can move from 0 to `scrollHeight` - `viewportHeight`.
            const computedSliderRatio = (maxMinimapSliderTop) / (scrollHeight - viewportHeight);
            const sliderTop = (scrollTop * computedSliderRatio);
            let extraLinesAtTheBottom = 0;
            if (options.scrollBeyondLastLine) {
                const expectedViewportLineCount = viewportHeight / lineHeight;
                extraLinesAtTheBottom = expectedViewportLineCount;
            }
            if (minimapLinesFitting >= lineCount + extraLinesAtTheBottom) {
                // All lines fit in the minimap
                const startLineNumber = 1;
                const endLineNumber = lineCount;
                return new MinimapLayout(scrollTop, scrollHeight, computedSliderRatio, sliderTop, sliderHeight, startLineNumber, endLineNumber);
            }
            else {
                let startLineNumber = Math.max(1, Math.floor(viewportStartLineNumber - sliderTop * pixelRatio / minimapLineHeight));
                // Avoid flickering caused by a partial viewport start line
                // by being consistent w.r.t. the previous layout decision
                if (previousLayout && previousLayout.scrollHeight === scrollHeight) {
                    if (previousLayout.scrollTop > scrollTop) {
                        // Scrolling up => never increase `startLineNumber`
                        startLineNumber = Math.min(startLineNumber, previousLayout.startLineNumber);
                    }
                    if (previousLayout.scrollTop < scrollTop) {
                        // Scrolling down => never decrease `startLineNumber`
                        startLineNumber = Math.max(startLineNumber, previousLayout.startLineNumber);
                    }
                }
                const endLineNumber = Math.min(lineCount, startLineNumber + minimapLinesFitting - 1);
                return new MinimapLayout(scrollTop, scrollHeight, computedSliderRatio, sliderTop, sliderHeight, startLineNumber, endLineNumber);
            }
        }
    }
    class MinimapLine {
        constructor(dy) {
            this.dy = dy;
        }
        onContentChanged() {
            this.dy = -1;
        }
        onTokensChanged() {
            this.dy = -1;
        }
    }
    MinimapLine.INVALID = new MinimapLine(-1);
    class RenderData {
        constructor(renderedLayout, imageData, lines) {
            this.renderedLayout = renderedLayout;
            this._imageData = imageData;
            this._renderedLines = new viewLayer_1.RenderedLinesCollection(() => MinimapLine.INVALID);
            this._renderedLines._set(renderedLayout.startLineNumber, lines);
        }
        /**
         * Check if the current RenderData matches accurately the new desired layout and no painting is needed.
         */
        linesEquals(layout) {
            if (!this.scrollEquals(layout)) {
                return false;
            }
            const tmp = this._renderedLines._get();
            const lines = tmp.lines;
            for (let i = 0, len = lines.length; i < len; i++) {
                if (lines[i].dy === -1) {
                    // This line is invalid
                    return false;
                }
            }
            return true;
        }
        /**
         * Check if the current RenderData matches the new layout's scroll position
         */
        scrollEquals(layout) {
            return this.renderedLayout.startLineNumber === layout.startLineNumber
                && this.renderedLayout.endLineNumber === layout.endLineNumber;
        }
        _get() {
            const tmp = this._renderedLines._get();
            return {
                imageData: this._imageData,
                rendLineNumberStart: tmp.rendLineNumberStart,
                lines: tmp.lines
            };
        }
        onLinesChanged(e) {
            return this._renderedLines.onLinesChanged(e.fromLineNumber, e.toLineNumber);
        }
        onLinesDeleted(e) {
            this._renderedLines.onLinesDeleted(e.fromLineNumber, e.toLineNumber);
        }
        onLinesInserted(e) {
            this._renderedLines.onLinesInserted(e.fromLineNumber, e.toLineNumber);
        }
        onTokensChanged(e) {
            return this._renderedLines.onTokensChanged(e.ranges);
        }
    }
    /**
     * Some sort of double buffering.
     *
     * Keeps two buffers around that will be rotated for painting.
     * Always gives a buffer that is filled with the background color.
     */
    class MinimapBuffers {
        constructor(ctx, WIDTH, HEIGHT, background) {
            this._backgroundFillData = MinimapBuffers._createBackgroundFillData(WIDTH, HEIGHT, background);
            this._buffers = [
                ctx.createImageData(WIDTH, HEIGHT),
                ctx.createImageData(WIDTH, HEIGHT)
            ];
            this._lastUsedBuffer = 0;
        }
        getBuffer() {
            // rotate buffers
            this._lastUsedBuffer = 1 - this._lastUsedBuffer;
            const result = this._buffers[this._lastUsedBuffer];
            // fill with background color
            result.data.set(this._backgroundFillData);
            return result;
        }
        static _createBackgroundFillData(WIDTH, HEIGHT, background) {
            const backgroundR = background.r;
            const backgroundG = background.g;
            const backgroundB = background.b;
            const result = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
            let offset = 0;
            for (let i = 0; i < HEIGHT; i++) {
                for (let j = 0; j < WIDTH; j++) {
                    result[offset] = backgroundR;
                    result[offset + 1] = backgroundG;
                    result[offset + 2] = backgroundB;
                    result[offset + 3] = 255;
                    offset += 4;
                }
            }
            return result;
        }
    }
    class Minimap extends viewPart_1.ViewPart {
        constructor(context) {
            super(context);
            this._selections = [];
            this._renderDecorations = false;
            this._gestureInProgress = false;
            this._options = new MinimapOptions(this._context.configuration);
            this._lastRenderData = null;
            this._buffers = null;
            this._selectionColor = this._context.theme.getColor(colorRegistry_1.minimapSelection);
            this._domNode = fastDomNode_1.createFastDomNode(document.createElement('div'));
            viewPart_1.PartFingerprints.write(this._domNode, 8 /* Minimap */);
            this._domNode.setClassName(this._getMinimapDomNodeClassName());
            this._domNode.setPosition('absolute');
            this._domNode.setAttribute('role', 'presentation');
            this._domNode.setAttribute('aria-hidden', 'true');
            this._shadow = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this._shadow.setClassName('minimap-shadow-hidden');
            this._domNode.appendChild(this._shadow);
            this._canvas = fastDomNode_1.createFastDomNode(document.createElement('canvas'));
            this._canvas.setPosition('absolute');
            this._canvas.setLeft(0);
            this._domNode.appendChild(this._canvas);
            this._decorationsCanvas = fastDomNode_1.createFastDomNode(document.createElement('canvas'));
            this._decorationsCanvas.setPosition('absolute');
            this._decorationsCanvas.setClassName('minimap-decorations-layer');
            this._decorationsCanvas.setLeft(0);
            this._domNode.appendChild(this._decorationsCanvas);
            this._slider = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this._slider.setPosition('absolute');
            this._slider.setClassName('minimap-slider');
            this._slider.setLayerHinting(true);
            this._domNode.appendChild(this._slider);
            this._sliderHorizontal = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this._sliderHorizontal.setPosition('absolute');
            this._sliderHorizontal.setClassName('minimap-slider-horizontal');
            this._slider.appendChild(this._sliderHorizontal);
            this._tokensColorTracker = minimapTokensColorTracker_1.MinimapTokensColorTracker.getInstance();
            this._applyLayout();
            this._mouseDownListener = dom.addStandardDisposableListener(this._domNode.domNode, 'mousedown', (e) => {
                e.preventDefault();
                const renderMinimap = this._options.renderMinimap;
                if (renderMinimap === 0 /* None */) {
                    return;
                }
                if (!this._lastRenderData) {
                    return;
                }
                const minimapLineHeight = getMinimapLineHeight(renderMinimap, this._options.fontScale);
                const internalOffsetY = this._options.pixelRatio * e.browserEvent.offsetY;
                const lineIndex = Math.floor(internalOffsetY / minimapLineHeight);
                let lineNumber = lineIndex + this._lastRenderData.renderedLayout.startLineNumber;
                lineNumber = Math.min(lineNumber, this._context.model.getLineCount());
                this._context.privateViewEventBus.emit(new viewEvents.ViewRevealRangeRequestEvent('mouse', new range_1.Range(lineNumber, 1, lineNumber, 1), 1 /* Center */, false, 0 /* Smooth */));
            });
            this._sliderMouseMoveMonitor = new globalMouseMoveMonitor_1.GlobalMouseMoveMonitor();
            this._sliderMouseDownListener = dom.addStandardDisposableListener(this._slider.domNode, 'mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.leftButton && this._lastRenderData) {
                    const initialMousePosition = e.posy;
                    const initialMouseOrthogonalPosition = e.posx;
                    const initialSliderState = this._lastRenderData.renderedLayout;
                    this._slider.toggleClassName('active', true);
                    this._sliderMouseMoveMonitor.startMonitoring(globalMouseMoveMonitor_1.standardMouseMoveMerger, (mouseMoveData) => {
                        const mouseOrthogonalDelta = Math.abs(mouseMoveData.posx - initialMouseOrthogonalPosition);
                        if (platform.isWindows && mouseOrthogonalDelta > MOUSE_DRAG_RESET_DISTANCE) {
                            // The mouse has wondered away from the scrollbar => reset dragging
                            this._context.viewLayout.setScrollPositionNow({
                                scrollTop: initialSliderState.scrollTop
                            });
                            return;
                        }
                        const mouseDelta = mouseMoveData.posy - initialMousePosition;
                        this._context.viewLayout.setScrollPositionNow({
                            scrollTop: initialSliderState.getDesiredScrollTopFromDelta(mouseDelta)
                        });
                    }, () => {
                        this._slider.toggleClassName('active', false);
                    });
                }
            });
            this._gestureDisposable = touch_1.Gesture.addTarget(this._domNode.domNode);
            this._sliderTouchStartListener = dom.addDisposableListener(this._domNode.domNode, touch_1.EventType.Start, (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this._lastRenderData) {
                    this._slider.toggleClassName('active', true);
                    this._gestureInProgress = true;
                    this.scrollDueToTouchEvent(e);
                }
            });
            this._sliderTouchMoveListener = dom.addStandardDisposableListener(this._domNode.domNode, touch_1.EventType.Change, (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this._lastRenderData && this._gestureInProgress) {
                    this.scrollDueToTouchEvent(e);
                }
            });
            this._sliderTouchEndListener = dom.addStandardDisposableListener(this._domNode.domNode, touch_1.EventType.End, (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._gestureInProgress = false;
                this._slider.toggleClassName('active', false);
            });
        }
        scrollDueToTouchEvent(touch) {
            const startY = this._domNode.domNode.getBoundingClientRect().top;
            const scrollTop = this._lastRenderData.renderedLayout.getDesiredScrollTopFromTouchLocation(touch.pageY - startY);
            this._context.viewLayout.setScrollPositionNow({
                scrollTop: scrollTop
            });
        }
        dispose() {
            this._mouseDownListener.dispose();
            this._sliderMouseMoveMonitor.dispose();
            this._sliderMouseDownListener.dispose();
            this._gestureDisposable.dispose();
            this._sliderTouchStartListener.dispose();
            this._sliderTouchMoveListener.dispose();
            this._sliderTouchEndListener.dispose();
            super.dispose();
        }
        _getMinimapDomNodeClassName() {
            if (this._options.showSlider === 'always') {
                return 'minimap slider-always';
            }
            return 'minimap slider-mouseover';
        }
        getDomNode() {
            return this._domNode;
        }
        _applyLayout() {
            this._domNode.setLeft(this._options.minimapLeft);
            this._domNode.setWidth(this._options.minimapWidth);
            this._domNode.setHeight(this._options.minimapHeight);
            this._shadow.setHeight(this._options.minimapHeight);
            this._canvas.setWidth(this._options.canvasOuterWidth);
            this._canvas.setHeight(this._options.canvasOuterHeight);
            this._canvas.domNode.width = this._options.canvasInnerWidth;
            this._canvas.domNode.height = this._options.canvasInnerHeight;
            this._decorationsCanvas.setWidth(this._options.canvasOuterWidth);
            this._decorationsCanvas.setHeight(this._options.canvasOuterHeight);
            this._decorationsCanvas.domNode.width = this._options.canvasInnerWidth;
            this._decorationsCanvas.domNode.height = this._options.canvasInnerHeight;
            this._slider.setWidth(this._options.minimapWidth);
        }
        _getBuffer() {
            if (!this._buffers) {
                this._buffers = new MinimapBuffers(this._canvas.domNode.getContext('2d'), this._options.canvasInnerWidth, this._options.canvasInnerHeight, this._tokensColorTracker.getColor(2 /* DefaultBackground */));
            }
            return this._buffers.getBuffer();
        }
        _onOptionsMaybeChanged() {
            const opts = new MinimapOptions(this._context.configuration);
            if (this._options.equals(opts)) {
                return false;
            }
            this._options = opts;
            this._lastRenderData = null;
            this._buffers = null;
            this._applyLayout();
            this._domNode.setClassName(this._getMinimapDomNodeClassName());
            return true;
        }
        // ---- begin view event handlers
        onConfigurationChanged(e) {
            return this._onOptionsMaybeChanged();
        }
        onCursorStateChanged(e) {
            this._selections = e.selections;
            this._renderDecorations = true;
            return true;
        }
        onFlushed(e) {
            this._lastRenderData = null;
            return true;
        }
        onLinesChanged(e) {
            if (this._lastRenderData) {
                return this._lastRenderData.onLinesChanged(e);
            }
            return false;
        }
        onLinesDeleted(e) {
            if (this._lastRenderData) {
                this._lastRenderData.onLinesDeleted(e);
            }
            return true;
        }
        onLinesInserted(e) {
            if (this._lastRenderData) {
                this._lastRenderData.onLinesInserted(e);
            }
            return true;
        }
        onScrollChanged(e) {
            this._renderDecorations = true;
            return true;
        }
        onTokensChanged(e) {
            if (this._lastRenderData) {
                return this._lastRenderData.onTokensChanged(e);
            }
            return false;
        }
        onTokensColorsChanged(e) {
            this._lastRenderData = null;
            this._buffers = null;
            return true;
        }
        onZonesChanged(e) {
            this._lastRenderData = null;
            return true;
        }
        onDecorationsChanged(e) {
            this._renderDecorations = true;
            return true;
        }
        onThemeChanged(e) {
            this._context.model.invalidateMinimapColorCache();
            this._selectionColor = this._context.theme.getColor(colorRegistry_1.minimapSelection);
            this._renderDecorations = true;
            return true;
        }
        // --- end event handlers
        prepareRender(ctx) {
            // Nothing to read
        }
        render(renderingCtx) {
            const renderMinimap = this._options.renderMinimap;
            if (renderMinimap === 0 /* None */) {
                this._shadow.setClassName('minimap-shadow-hidden');
                this._sliderHorizontal.setWidth(0);
                this._sliderHorizontal.setHeight(0);
                return;
            }
            if (renderingCtx.scrollLeft + renderingCtx.viewportWidth >= renderingCtx.scrollWidth) {
                this._shadow.setClassName('minimap-shadow-hidden');
            }
            else {
                this._shadow.setClassName('minimap-shadow-visible');
            }
            const layout = MinimapLayout.create(this._options, renderingCtx.visibleRange.startLineNumber, renderingCtx.visibleRange.endLineNumber, renderingCtx.viewportHeight, (renderingCtx.viewportData.whitespaceViewportData.length > 0), this._context.model.getLineCount(), renderingCtx.scrollTop, renderingCtx.scrollHeight, this._lastRenderData ? this._lastRenderData.renderedLayout : null);
            this._slider.setTop(layout.sliderTop);
            this._slider.setHeight(layout.sliderHeight);
            // Compute horizontal slider coordinates
            const scrollLeftChars = renderingCtx.scrollLeft / this._options.typicalHalfwidthCharacterWidth;
            const horizontalSliderLeft = Math.min(this._options.minimapWidth, Math.round(scrollLeftChars * getMinimapCharWidth(this._options.renderMinimap, this._options.fontScale) / this._options.pixelRatio));
            this._sliderHorizontal.setLeft(horizontalSliderLeft);
            this._sliderHorizontal.setWidth(this._options.minimapWidth - horizontalSliderLeft);
            this._sliderHorizontal.setTop(0);
            this._sliderHorizontal.setHeight(layout.sliderHeight);
            this.renderDecorations(layout);
            this._lastRenderData = this.renderLines(layout);
        }
        renderDecorations(layout) {
            if (this._renderDecorations) {
                this._renderDecorations = false;
                const decorations = this._context.model.getDecorationsInViewport(new range_1.Range(layout.startLineNumber, 1, layout.endLineNumber, this._context.model.getLineMaxColumn(layout.endLineNumber)));
                const { renderMinimap, canvasInnerWidth, canvasInnerHeight } = this._options;
                const lineHeight = getMinimapLineHeight(renderMinimap, this._options.fontScale);
                const characterWidth = getMinimapCharWidth(renderMinimap, this._options.fontScale);
                const tabSize = this._context.model.getOptions().tabSize;
                const canvasContext = this._decorationsCanvas.domNode.getContext('2d');
                canvasContext.clearRect(0, 0, canvasInnerWidth, canvasInnerHeight);
                const lineOffsetMap = new Map();
                for (let i = 0; i < this._selections.length; i++) {
                    const selection = this._selections[i];
                    for (let line = selection.startLineNumber; line <= selection.endLineNumber; line++) {
                        this.renderDecorationOnLine(canvasContext, lineOffsetMap, selection, this._selectionColor, layout, line, lineHeight, lineHeight, tabSize, characterWidth);
                    }
                }
                // Loop over decorations, ignoring those that don't have the minimap property set and rendering rectangles for each line the decoration spans
                for (let i = 0; i < decorations.length; i++) {
                    const decoration = decorations[i];
                    if (!decoration.options.minimap) {
                        continue;
                    }
                    for (let line = decoration.range.startLineNumber; line <= decoration.range.endLineNumber; line++) {
                        const decorationColor = decoration.options.minimap.getColor(this._context.theme);
                        this.renderDecorationOnLine(canvasContext, lineOffsetMap, decoration.range, decorationColor, layout, line, lineHeight, lineHeight, tabSize, characterWidth);
                    }
                }
            }
        }
        renderDecorationOnLine(canvasContext, lineOffsetMap, decorationRange, decorationColor, layout, lineNumber, height, lineHeight, tabSize, charWidth) {
            const y = (lineNumber - layout.startLineNumber) * lineHeight;
            // Cache line offset data so that it is only read once per line
            let lineIndexToXOffset = lineOffsetMap.get(lineNumber);
            const isFirstDecorationForLine = !lineIndexToXOffset;
            if (!lineIndexToXOffset) {
                const lineData = this._context.model.getLineContent(lineNumber);
                lineIndexToXOffset = [0];
                for (let i = 1; i < lineData.length + 1; i++) {
                    const charCode = lineData.charCodeAt(i - 1);
                    const dx = charCode === 9 /* Tab */
                        ? tabSize * charWidth
                        : strings.isFullWidthCharacter(charCode)
                            ? 2 * charWidth
                            : charWidth;
                    lineIndexToXOffset[i] = lineIndexToXOffset[i - 1] + dx;
                }
                lineOffsetMap.set(lineNumber, lineIndexToXOffset);
            }
            const { startColumn, endColumn, startLineNumber, endLineNumber } = decorationRange;
            const x = startLineNumber === lineNumber ? lineIndexToXOffset[startColumn - 1] : 0;
            const endColumnForLine = endLineNumber > lineNumber ? lineIndexToXOffset.length - 1 : endColumn - 1;
            if (endColumnForLine > 0) {
                // If the decoration starts at the last character of the column and spans over it, ensure it has a width
                const width = lineIndexToXOffset[endColumnForLine] - x || 2;
                this.renderDecoration(canvasContext, decorationColor, x, y, width, height);
            }
            if (isFirstDecorationForLine) {
                this.renderLineHighlight(canvasContext, decorationColor, y, height);
            }
        }
        renderLineHighlight(canvasContext, decorationColor, y, height) {
            canvasContext.fillStyle = decorationColor && decorationColor.transparent(0.5).toString() || '';
            canvasContext.fillRect(0, y, canvasContext.canvas.width, height);
        }
        renderDecoration(canvasContext, decorationColor, x, y, width, height) {
            canvasContext.fillStyle = decorationColor && decorationColor.toString() || '';
            canvasContext.fillRect(x, y, width, height);
        }
        renderLines(layout) {
            const renderMinimap = this._options.renderMinimap;
            const startLineNumber = layout.startLineNumber;
            const endLineNumber = layout.endLineNumber;
            const minimapLineHeight = getMinimapLineHeight(renderMinimap, this._options.fontScale);
            // Check if nothing changed w.r.t. lines from last frame
            if (this._lastRenderData && this._lastRenderData.linesEquals(layout)) {
                const _lastData = this._lastRenderData._get();
                // Nice!! Nothing changed from last frame
                return new RenderData(layout, _lastData.imageData, _lastData.lines);
            }
            // Oh well!! We need to repaint some lines...
            const imageData = this._getBuffer();
            // Render untouched lines by using last rendered data.
            let [_dirtyY1, _dirtyY2, needed] = Minimap._renderUntouchedLines(imageData, startLineNumber, endLineNumber, minimapLineHeight, this._lastRenderData);
            // Fetch rendering info from view model for rest of lines that need rendering.
            const lineInfo = this._context.model.getMinimapLinesRenderingData(startLineNumber, endLineNumber, needed);
            const tabSize = lineInfo.tabSize;
            const background = this._tokensColorTracker.getColor(2 /* DefaultBackground */);
            const useLighterFont = this._tokensColorTracker.backgroundIsLight();
            // Render the rest of lines
            let dy = 0;
            const renderedLines = [];
            for (let lineIndex = 0, lineCount = endLineNumber - startLineNumber + 1; lineIndex < lineCount; lineIndex++) {
                if (needed[lineIndex]) {
                    Minimap._renderLine(imageData, background, useLighterFont, renderMinimap, this._tokensColorTracker, this._options.charRenderer, dy, tabSize, lineInfo.data[lineIndex], this._options.fontScale);
                }
                renderedLines[lineIndex] = new MinimapLine(dy);
                dy += minimapLineHeight;
            }
            const dirtyY1 = (_dirtyY1 === -1 ? 0 : _dirtyY1);
            const dirtyY2 = (_dirtyY2 === -1 ? imageData.height : _dirtyY2);
            const dirtyHeight = dirtyY2 - dirtyY1;
            // Finally, paint to the canvas
            const ctx = this._canvas.domNode.getContext('2d');
            ctx.putImageData(imageData, 0, 0, 0, dirtyY1, imageData.width, dirtyHeight);
            // Save rendered data for reuse on next frame if possible
            return new RenderData(layout, imageData, renderedLines);
        }
        static _renderUntouchedLines(target, startLineNumber, endLineNumber, minimapLineHeight, lastRenderData) {
            const needed = [];
            if (!lastRenderData) {
                for (let i = 0, len = endLineNumber - startLineNumber + 1; i < len; i++) {
                    needed[i] = true;
                }
                return [-1, -1, needed];
            }
            const _lastData = lastRenderData._get();
            const lastTargetData = _lastData.imageData.data;
            const lastStartLineNumber = _lastData.rendLineNumberStart;
            const lastLines = _lastData.lines;
            const lastLinesLength = lastLines.length;
            const WIDTH = target.width;
            const targetData = target.data;
            const maxDestPixel = (endLineNumber - startLineNumber + 1) * minimapLineHeight * WIDTH * 4;
            let dirtyPixel1 = -1; // the pixel offset up to which all the data is equal to the prev frame
            let dirtyPixel2 = -1; // the pixel offset after which all the data is equal to the prev frame
            let copySourceStart = -1;
            let copySourceEnd = -1;
            let copyDestStart = -1;
            let copyDestEnd = -1;
            let dest_dy = 0;
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                const lineIndex = lineNumber - startLineNumber;
                const lastLineIndex = lineNumber - lastStartLineNumber;
                const source_dy = (lastLineIndex >= 0 && lastLineIndex < lastLinesLength ? lastLines[lastLineIndex].dy : -1);
                if (source_dy === -1) {
                    needed[lineIndex] = true;
                    dest_dy += minimapLineHeight;
                    continue;
                }
                const sourceStart = source_dy * WIDTH * 4;
                const sourceEnd = (source_dy + minimapLineHeight) * WIDTH * 4;
                const destStart = dest_dy * WIDTH * 4;
                const destEnd = (dest_dy + minimapLineHeight) * WIDTH * 4;
                if (copySourceEnd === sourceStart && copyDestEnd === destStart) {
                    // contiguous zone => extend copy request
                    copySourceEnd = sourceEnd;
                    copyDestEnd = destEnd;
                }
                else {
                    if (copySourceStart !== -1) {
                        // flush existing copy request
                        targetData.set(lastTargetData.subarray(copySourceStart, copySourceEnd), copyDestStart);
                        if (dirtyPixel1 === -1 && copySourceStart === 0 && copySourceStart === copyDestStart) {
                            dirtyPixel1 = copySourceEnd;
                        }
                        if (dirtyPixel2 === -1 && copySourceEnd === maxDestPixel && copySourceStart === copyDestStart) {
                            dirtyPixel2 = copySourceStart;
                        }
                    }
                    copySourceStart = sourceStart;
                    copySourceEnd = sourceEnd;
                    copyDestStart = destStart;
                    copyDestEnd = destEnd;
                }
                needed[lineIndex] = false;
                dest_dy += minimapLineHeight;
            }
            if (copySourceStart !== -1) {
                // flush existing copy request
                targetData.set(lastTargetData.subarray(copySourceStart, copySourceEnd), copyDestStart);
                if (dirtyPixel1 === -1 && copySourceStart === 0 && copySourceStart === copyDestStart) {
                    dirtyPixel1 = copySourceEnd;
                }
                if (dirtyPixel2 === -1 && copySourceEnd === maxDestPixel && copySourceStart === copyDestStart) {
                    dirtyPixel2 = copySourceStart;
                }
            }
            const dirtyY1 = (dirtyPixel1 === -1 ? -1 : dirtyPixel1 / (WIDTH * 4));
            const dirtyY2 = (dirtyPixel2 === -1 ? -1 : dirtyPixel2 / (WIDTH * 4));
            return [dirtyY1, dirtyY2, needed];
        }
        static _renderLine(target, backgroundColor, useLighterFont, renderMinimap, colorTracker, minimapCharRenderer, dy, tabSize, lineData, fontScale) {
            const content = lineData.content;
            const tokens = lineData.tokens;
            const charWidth = getMinimapCharWidth(renderMinimap, fontScale);
            const maxDx = target.width - charWidth;
            let dx = 0;
            let charIndex = 0;
            let tabsCharDelta = 0;
            for (let tokenIndex = 0, tokensLen = tokens.getCount(); tokenIndex < tokensLen; tokenIndex++) {
                const tokenEndIndex = tokens.getEndOffset(tokenIndex);
                const tokenColorId = tokens.getForeground(tokenIndex);
                const tokenColor = colorTracker.getColor(tokenColorId);
                for (; charIndex < tokenEndIndex; charIndex++) {
                    if (dx > maxDx) {
                        // hit edge of minimap
                        return;
                    }
                    const charCode = content.charCodeAt(charIndex);
                    if (charCode === 9 /* Tab */) {
                        const insertSpacesCount = tabSize - (charIndex + tabsCharDelta) % tabSize;
                        tabsCharDelta += insertSpacesCount - 1;
                        // No need to render anything since tab is invisible
                        dx += insertSpacesCount * charWidth;
                    }
                    else if (charCode === 32 /* Space */) {
                        // No need to render anything since space is invisible
                        dx += charWidth;
                    }
                    else {
                        // Render twice for a full width character
                        const count = strings.isFullWidthCharacter(charCode) ? 2 : 1;
                        for (let i = 0; i < count; i++) {
                            if (renderMinimap === 2 /* Blocks */) {
                                minimapCharRenderer.blockRenderChar(target, dx, dy, tokenColor, backgroundColor, useLighterFont);
                            }
                            else { // RenderMinimap.Text
                                minimapCharRenderer.renderChar(target, dx, dy, charCode, tokenColor, backgroundColor, useLighterFont);
                            }
                            dx += charWidth;
                            if (dx > maxDx) {
                                // hit edge of minimap
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
    exports.Minimap = Minimap;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const sliderBackground = theme.getColor(colorRegistry_1.scrollbarSliderBackground);
        if (sliderBackground) {
            const halfSliderBackground = sliderBackground.transparent(0.5);
            collector.addRule(`.monaco-editor .minimap-slider, .monaco-editor .minimap-slider .minimap-slider-horizontal { background: ${halfSliderBackground}; }`);
        }
        const sliderHoverBackground = theme.getColor(colorRegistry_1.scrollbarSliderHoverBackground);
        if (sliderHoverBackground) {
            const halfSliderHoverBackground = sliderHoverBackground.transparent(0.5);
            collector.addRule(`.monaco-editor .minimap-slider:hover, .monaco-editor .minimap-slider:hover .minimap-slider-horizontal { background: ${halfSliderHoverBackground}; }`);
        }
        const sliderActiveBackground = theme.getColor(colorRegistry_1.scrollbarSliderActiveBackground);
        if (sliderActiveBackground) {
            const halfSliderActiveBackground = sliderActiveBackground.transparent(0.5);
            collector.addRule(`.monaco-editor .minimap-slider.active, .monaco-editor .minimap-slider.active .minimap-slider-horizontal { background: ${halfSliderActiveBackground}; }`);
        }
        const shadow = theme.getColor(colorRegistry_1.scrollbarShadow);
        if (shadow) {
            collector.addRule(`.monaco-editor .minimap-shadow-visible { box-shadow: ${shadow} -6px 0 6px -6px inset; }`);
        }
    });
});
//# sourceMappingURL=minimap.js.map