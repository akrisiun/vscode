/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/base/common/errors", "vs/editor/browser/controller/pointerHandler", "vs/editor/browser/controller/textAreaHandler", "vs/editor/browser/view/viewController", "vs/editor/browser/view/viewOverlays", "vs/editor/browser/view/viewPart", "vs/editor/browser/viewParts/contentWidgets/contentWidgets", "vs/editor/browser/viewParts/currentLineHighlight/currentLineHighlight", "vs/editor/browser/viewParts/decorations/decorations", "vs/editor/browser/viewParts/editorScrollbar/editorScrollbar", "vs/editor/browser/viewParts/glyphMargin/glyphMargin", "vs/editor/browser/viewParts/indentGuides/indentGuides", "vs/editor/browser/viewParts/lineNumbers/lineNumbers", "vs/editor/browser/viewParts/lines/viewLines", "vs/editor/browser/viewParts/linesDecorations/linesDecorations", "vs/editor/browser/viewParts/margin/margin", "vs/editor/browser/viewParts/marginDecorations/marginDecorations", "vs/editor/browser/viewParts/minimap/minimap", "vs/editor/browser/viewParts/overlayWidgets/overlayWidgets", "vs/editor/browser/viewParts/overviewRuler/decorationsOverviewRuler", "vs/editor/browser/viewParts/overviewRuler/overviewRuler", "vs/editor/browser/viewParts/rulers/rulers", "vs/editor/browser/viewParts/scrollDecoration/scrollDecoration", "vs/editor/browser/viewParts/selections/selections", "vs/editor/browser/viewParts/viewCursors/viewCursors", "vs/editor/browser/viewParts/viewZones/viewZones", "vs/editor/common/core/position", "vs/editor/common/view/renderingContext", "vs/editor/common/view/viewContext", "vs/editor/common/view/viewEventDispatcher", "vs/editor/common/view/viewEvents", "vs/editor/common/viewLayout/viewLinesViewportData", "vs/editor/common/viewModel/viewEventHandler", "vs/platform/theme/common/themeService"], function (require, exports, dom, fastDomNode_1, errors_1, pointerHandler_1, textAreaHandler_1, viewController_1, viewOverlays_1, viewPart_1, contentWidgets_1, currentLineHighlight_1, decorations_1, editorScrollbar_1, glyphMargin_1, indentGuides_1, lineNumbers_1, viewLines_1, linesDecorations_1, margin_1, marginDecorations_1, minimap_1, overlayWidgets_1, decorationsOverviewRuler_1, overviewRuler_1, rulers_1, scrollDecoration_1, selections_1, viewCursors_1, viewZones_1, position_1, renderingContext_1, viewContext_1, viewEventDispatcher_1, viewEvents, viewLinesViewportData_1, viewEventHandler_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const invalidFunc = () => { throw new Error(`Invalid change accessor`); };
    class View extends viewEventHandler_1.ViewEventHandler {
        constructor(commandDelegate, configuration, themeService, model, cursor, outgoingEvents) {
            super();
            this._cursor = cursor;
            this._renderAnimationFrame = null;
            this.outgoingEvents = outgoingEvents;
            const viewController = new viewController_1.ViewController(configuration, model, this.outgoingEvents, commandDelegate);
            // The event dispatcher will always go through _renderOnce before dispatching any events
            this.eventDispatcher = new viewEventDispatcher_1.ViewEventDispatcher((callback) => this._renderOnce(callback));
            // Ensure the view is the first event handler in order to update the layout
            this.eventDispatcher.addEventHandler(this);
            // The view context is passed on to most classes (basically to reduce param. counts in ctors)
            this._context = new viewContext_1.ViewContext(configuration, themeService.getTheme(), model, this.eventDispatcher);
            this._register(themeService.onThemeChange(theme => {
                this._context.theme = theme;
                this.eventDispatcher.emit(new viewEvents.ViewThemeChangedEvent());
                this.render(true, false);
            }));
            this.viewParts = [];
            // Keyboard handler
            this._textAreaHandler = new textAreaHandler_1.TextAreaHandler(this._context, viewController, this.createTextAreaHandlerHelper());
            this.viewParts.push(this._textAreaHandler);
            // These two dom nodes must be constructed up front, since references are needed in the layout provider (scrolling & co.)
            this.linesContent = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this.linesContent.setClassName('lines-content' + ' monaco-editor-background');
            this.linesContent.setPosition('absolute');
            this.domNode = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this.domNode.setClassName(this.getEditorClassName());
            this.overflowGuardContainer = fastDomNode_1.createFastDomNode(document.createElement('div'));
            viewPart_1.PartFingerprints.write(this.overflowGuardContainer, 3 /* OverflowGuard */);
            this.overflowGuardContainer.setClassName('overflow-guard');
            this._scrollbar = new editorScrollbar_1.EditorScrollbar(this._context, this.linesContent, this.domNode, this.overflowGuardContainer);
            this.viewParts.push(this._scrollbar);
            // View Lines
            this.viewLines = new viewLines_1.ViewLines(this._context, this.linesContent);
            // View Zones
            this.viewZones = new viewZones_1.ViewZones(this._context);
            this.viewParts.push(this.viewZones);
            // Decorations overview ruler
            const decorationsOverviewRuler = new decorationsOverviewRuler_1.DecorationsOverviewRuler(this._context);
            this.viewParts.push(decorationsOverviewRuler);
            const scrollDecoration = new scrollDecoration_1.ScrollDecorationViewPart(this._context);
            this.viewParts.push(scrollDecoration);
            const contentViewOverlays = new viewOverlays_1.ContentViewOverlays(this._context);
            this.viewParts.push(contentViewOverlays);
            contentViewOverlays.addDynamicOverlay(new currentLineHighlight_1.CurrentLineHighlightOverlay(this._context));
            contentViewOverlays.addDynamicOverlay(new selections_1.SelectionsOverlay(this._context));
            contentViewOverlays.addDynamicOverlay(new indentGuides_1.IndentGuidesOverlay(this._context));
            contentViewOverlays.addDynamicOverlay(new decorations_1.DecorationsOverlay(this._context));
            const marginViewOverlays = new viewOverlays_1.MarginViewOverlays(this._context);
            this.viewParts.push(marginViewOverlays);
            marginViewOverlays.addDynamicOverlay(new currentLineHighlight_1.CurrentLineMarginHighlightOverlay(this._context));
            marginViewOverlays.addDynamicOverlay(new glyphMargin_1.GlyphMarginOverlay(this._context));
            marginViewOverlays.addDynamicOverlay(new marginDecorations_1.MarginViewLineDecorationsOverlay(this._context));
            marginViewOverlays.addDynamicOverlay(new linesDecorations_1.LinesDecorationsOverlay(this._context));
            marginViewOverlays.addDynamicOverlay(new lineNumbers_1.LineNumbersOverlay(this._context));
            const margin = new margin_1.Margin(this._context);
            margin.getDomNode().appendChild(this.viewZones.marginDomNode);
            margin.getDomNode().appendChild(marginViewOverlays.getDomNode());
            this.viewParts.push(margin);
            // Content widgets
            this.contentWidgets = new contentWidgets_1.ViewContentWidgets(this._context, this.domNode);
            this.viewParts.push(this.contentWidgets);
            this.viewCursors = new viewCursors_1.ViewCursors(this._context);
            this.viewParts.push(this.viewCursors);
            // Overlay widgets
            this.overlayWidgets = new overlayWidgets_1.ViewOverlayWidgets(this._context);
            this.viewParts.push(this.overlayWidgets);
            const rulers = new rulers_1.Rulers(this._context);
            this.viewParts.push(rulers);
            const minimap = new minimap_1.Minimap(this._context);
            this.viewParts.push(minimap);
            // -------------- Wire dom nodes up
            if (decorationsOverviewRuler) {
                const overviewRulerData = this._scrollbar.getOverviewRulerLayoutInfo();
                overviewRulerData.parent.insertBefore(decorationsOverviewRuler.getDomNode(), overviewRulerData.insertBefore);
            }
            this.linesContent.appendChild(contentViewOverlays.getDomNode());
            this.linesContent.appendChild(rulers.domNode);
            this.linesContent.appendChild(this.viewZones.domNode);
            this.linesContent.appendChild(this.viewLines.getDomNode());
            this.linesContent.appendChild(this.contentWidgets.domNode);
            this.linesContent.appendChild(this.viewCursors.getDomNode());
            this.overflowGuardContainer.appendChild(margin.getDomNode());
            this.overflowGuardContainer.appendChild(this._scrollbar.getDomNode());
            this.overflowGuardContainer.appendChild(scrollDecoration.getDomNode());
            this.overflowGuardContainer.appendChild(this._textAreaHandler.textArea);
            this.overflowGuardContainer.appendChild(this._textAreaHandler.textAreaCover);
            this.overflowGuardContainer.appendChild(this.overlayWidgets.getDomNode());
            this.overflowGuardContainer.appendChild(minimap.getDomNode());
            this.domNode.appendChild(this.overflowGuardContainer);
            this.domNode.appendChild(this.contentWidgets.overflowingContentWidgetsDomNode);
            this._applyLayout();
            // Pointer handler
            this.pointerHandler = this._register(new pointerHandler_1.PointerHandler(this._context, viewController, this.createPointerHandlerHelper()));
            this._register(model.addEventListener((events) => {
                this.eventDispatcher.emitMany(events);
            }));
            this._register(this._cursor.addEventListener((events) => {
                this.eventDispatcher.emitMany(events);
            }));
        }
        _flushAccumulatedAndRenderNow() {
            this._renderNow();
        }
        createPointerHandlerHelper() {
            return {
                viewDomNode: this.domNode.domNode,
                linesContentDomNode: this.linesContent.domNode,
                focusTextArea: () => {
                    this.focus();
                },
                getLastViewCursorsRenderData: () => {
                    return this.viewCursors.getLastRenderData() || [];
                },
                shouldSuppressMouseDownOnViewZone: (viewZoneId) => {
                    return this.viewZones.shouldSuppressMouseDownOnViewZone(viewZoneId);
                },
                shouldSuppressMouseDownOnWidget: (widgetId) => {
                    return this.contentWidgets.shouldSuppressMouseDownOnWidget(widgetId);
                },
                getPositionFromDOMInfo: (spanNode, offset) => {
                    this._flushAccumulatedAndRenderNow();
                    return this.viewLines.getPositionFromDOMInfo(spanNode, offset);
                },
                visibleRangeForPosition: (lineNumber, column) => {
                    this._flushAccumulatedAndRenderNow();
                    return this.viewLines.visibleRangeForPosition(new position_1.Position(lineNumber, column));
                },
                getLineWidth: (lineNumber) => {
                    this._flushAccumulatedAndRenderNow();
                    return this.viewLines.getLineWidth(lineNumber);
                }
            };
        }
        createTextAreaHandlerHelper() {
            return {
                visibleRangeForPositionRelativeToEditor: (lineNumber, column) => {
                    this._flushAccumulatedAndRenderNow();
                    return this.viewLines.visibleRangeForPosition(new position_1.Position(lineNumber, column));
                }
            };
        }
        _applyLayout() {
            const options = this._context.configuration.options;
            const layoutInfo = options.get(102 /* layoutInfo */);
            this.domNode.setWidth(layoutInfo.width);
            this.domNode.setHeight(layoutInfo.height);
            this.overflowGuardContainer.setWidth(layoutInfo.width);
            this.overflowGuardContainer.setHeight(layoutInfo.height);
            this.linesContent.setWidth(1000000);
            this.linesContent.setHeight(1000000);
        }
        getEditorClassName() {
            const focused = this._textAreaHandler.isFocused() ? ' focused' : '';
            return this._context.configuration.options.get(99 /* editorClassName */) + ' ' + themeService_1.getThemeTypeSelector(this._context.theme.type) + focused;
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            this.domNode.setClassName(this.getEditorClassName());
            this._applyLayout();
            return false;
        }
        onFocusChanged(e) {
            this.domNode.setClassName(this.getEditorClassName());
            this._context.model.setHasFocus(e.isFocused);
            if (e.isFocused) {
                this.outgoingEvents.emitViewFocusGained();
            }
            else {
                this.outgoingEvents.emitViewFocusLost();
            }
            return false;
        }
        onScrollChanged(e) {
            this.outgoingEvents.emitScrollChanged(e);
            return false;
        }
        onThemeChanged(e) {
            this.domNode.setClassName(this.getEditorClassName());
            return false;
        }
        // --- end event handlers
        dispose() {
            if (this._renderAnimationFrame !== null) {
                this._renderAnimationFrame.dispose();
                this._renderAnimationFrame = null;
            }
            this.eventDispatcher.removeEventHandler(this);
            this.outgoingEvents.dispose();
            this.viewLines.dispose();
            // Destroy view parts
            for (let i = 0, len = this.viewParts.length; i < len; i++) {
                this.viewParts[i].dispose();
            }
            this.viewParts = [];
            super.dispose();
        }
        _renderOnce(callback) {
            const r = safeInvokeNoArg(callback);
            this._scheduleRender();
            return r;
        }
        _scheduleRender() {
            if (this._renderAnimationFrame === null) {
                this._renderAnimationFrame = dom.runAtThisOrScheduleAtNextAnimationFrame(this._onRenderScheduled.bind(this), 100);
            }
        }
        _onRenderScheduled() {
            this._renderAnimationFrame = null;
            this._flushAccumulatedAndRenderNow();
        }
        _renderNow() {
            safeInvokeNoArg(() => this._actualRender());
        }
        _getViewPartsToRender() {
            let result = [], resultLen = 0;
            for (let i = 0, len = this.viewParts.length; i < len; i++) {
                const viewPart = this.viewParts[i];
                if (viewPart.shouldRender()) {
                    result[resultLen++] = viewPart;
                }
            }
            return result;
        }
        _actualRender() {
            if (!dom.isInDOM(this.domNode.domNode)) {
                return;
            }
            let viewPartsToRender = this._getViewPartsToRender();
            if (!this.viewLines.shouldRender() && viewPartsToRender.length === 0) {
                // Nothing to render
                return;
            }
            const partialViewportData = this._context.viewLayout.getLinesViewportData();
            this._context.model.setViewport(partialViewportData.startLineNumber, partialViewportData.endLineNumber, partialViewportData.centeredLineNumber);
            const viewportData = new viewLinesViewportData_1.ViewportData(this._cursor.getViewSelections(), partialViewportData, this._context.viewLayout.getWhitespaceViewportData(), this._context.model);
            if (this.contentWidgets.shouldRender()) {
                // Give the content widgets a chance to set their max width before a possible synchronous layout
                this.contentWidgets.onBeforeRender(viewportData);
            }
            if (this.viewLines.shouldRender()) {
                this.viewLines.renderText(viewportData);
                this.viewLines.onDidRender();
                // Rendering of viewLines might cause scroll events to occur, so collect view parts to render again
                viewPartsToRender = this._getViewPartsToRender();
            }
            const renderingContext = new renderingContext_1.RenderingContext(this._context.viewLayout, viewportData, this.viewLines);
            // Render the rest of the parts
            for (let i = 0, len = viewPartsToRender.length; i < len; i++) {
                const viewPart = viewPartsToRender[i];
                viewPart.prepareRender(renderingContext);
            }
            for (let i = 0, len = viewPartsToRender.length; i < len; i++) {
                const viewPart = viewPartsToRender[i];
                viewPart.render(renderingContext);
                viewPart.onDidRender();
            }
        }
        // --- BEGIN CodeEditor helpers
        delegateVerticalScrollbarMouseDown(browserEvent) {
            this._scrollbar.delegateVerticalScrollbarMouseDown(browserEvent);
        }
        restoreState(scrollPosition) {
            this._context.viewLayout.setScrollPositionNow({ scrollTop: scrollPosition.scrollTop });
            this._context.model.tokenizeViewport();
            this._renderNow();
            this.viewLines.updateLineWidths();
            this._context.viewLayout.setScrollPositionNow({ scrollLeft: scrollPosition.scrollLeft });
        }
        getOffsetForColumn(modelLineNumber, modelColumn) {
            const modelPosition = this._context.model.validateModelPosition({
                lineNumber: modelLineNumber,
                column: modelColumn
            });
            const viewPosition = this._context.model.coordinatesConverter.convertModelPositionToViewPosition(modelPosition);
            this._flushAccumulatedAndRenderNow();
            const visibleRange = this.viewLines.visibleRangeForPosition(new position_1.Position(viewPosition.lineNumber, viewPosition.column));
            if (!visibleRange) {
                return -1;
            }
            return visibleRange.left;
        }
        getTargetAtClientPoint(clientX, clientY) {
            return this.pointerHandler.getTargetAtClientPoint(clientX, clientY);
        }
        createOverviewRuler(cssClassName) {
            return new overviewRuler_1.OverviewRuler(this._context, cssClassName);
        }
        change(callback) {
            let zonesHaveChanged = false;
            this._renderOnce(() => {
                const changeAccessor = {
                    addZone: (zone) => {
                        zonesHaveChanged = true;
                        return this.viewZones.addZone(zone);
                    },
                    removeZone: (id) => {
                        if (!id) {
                            return;
                        }
                        zonesHaveChanged = this.viewZones.removeZone(id) || zonesHaveChanged;
                    },
                    layoutZone: (id) => {
                        if (!id) {
                            return;
                        }
                        zonesHaveChanged = this.viewZones.layoutZone(id) || zonesHaveChanged;
                    }
                };
                safeInvoke1Arg(callback, changeAccessor);
                // Invalidate changeAccessor
                changeAccessor.addZone = invalidFunc;
                changeAccessor.removeZone = invalidFunc;
                changeAccessor.layoutZone = invalidFunc;
                if (zonesHaveChanged) {
                    this._context.viewLayout.onHeightMaybeChanged();
                    this._context.privateViewEventBus.emit(new viewEvents.ViewZonesChangedEvent());
                }
            });
            return zonesHaveChanged;
        }
        render(now, everything) {
            if (everything) {
                // Force everything to render...
                this.viewLines.forceShouldRender();
                for (let i = 0, len = this.viewParts.length; i < len; i++) {
                    const viewPart = this.viewParts[i];
                    viewPart.forceShouldRender();
                }
            }
            if (now) {
                this._flushAccumulatedAndRenderNow();
            }
            else {
                this._scheduleRender();
            }
        }
        focus() {
            this._textAreaHandler.focusTextArea();
        }
        isFocused() {
            return this._textAreaHandler.isFocused();
        }
        addContentWidget(widgetData) {
            this.contentWidgets.addWidget(widgetData.widget);
            this.layoutContentWidget(widgetData);
            this._scheduleRender();
        }
        layoutContentWidget(widgetData) {
            const newPosition = widgetData.position ? widgetData.position.position : null;
            const newRange = widgetData.position ? widgetData.position.range || null : null;
            const newPreference = widgetData.position ? widgetData.position.preference : null;
            this.contentWidgets.setWidgetPosition(widgetData.widget, newPosition, newRange, newPreference);
            this._scheduleRender();
        }
        removeContentWidget(widgetData) {
            this.contentWidgets.removeWidget(widgetData.widget);
            this._scheduleRender();
        }
        addOverlayWidget(widgetData) {
            this.overlayWidgets.addWidget(widgetData.widget);
            this.layoutOverlayWidget(widgetData);
            this._scheduleRender();
        }
        layoutOverlayWidget(widgetData) {
            const newPreference = widgetData.position ? widgetData.position.preference : null;
            const shouldRender = this.overlayWidgets.setWidgetPosition(widgetData.widget, newPreference);
            if (shouldRender) {
                this._scheduleRender();
            }
        }
        removeOverlayWidget(widgetData) {
            this.overlayWidgets.removeWidget(widgetData.widget);
            this._scheduleRender();
        }
    }
    exports.View = View;
    function safeInvokeNoArg(func) {
        try {
            return func();
        }
        catch (e) {
            errors_1.onUnexpectedError(e);
        }
    }
    function safeInvoke1Arg(func, arg1) {
        try {
            return func(arg1);
        }
        catch (e) {
            errors_1.onUnexpectedError(e);
        }
    }
});
//# sourceMappingURL=viewImpl.js.map