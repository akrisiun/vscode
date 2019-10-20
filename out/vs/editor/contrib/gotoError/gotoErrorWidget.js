/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/platform/markers/common/markers", "vs/editor/common/core/range", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/base/common/color", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/labels", "vs/base/common/arrays", "vs/base/common/event", "vs/editor/contrib/referenceSearch/peekViewWidget", "vs/base/common/resources", "vs/editor/contrib/referenceSearch/referencesWidget", "vs/platform/severityIcon/common/severityIcon", "vs/css!./media/gotoErrorWidget"], function (require, exports, nls, dom, lifecycle_1, markers_1, range_1, colorRegistry_1, themeService_1, color_1, scrollableElement_1, labels_1, arrays_1, event_1, peekViewWidget_1, resources_1, referencesWidget_1, severityIcon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MessageWidget {
        constructor(parent, editor, onRelatedInformation) {
            this._lines = 0;
            this._longestLineLength = 0;
            this._relatedDiagnostics = new WeakMap();
            this._disposables = new lifecycle_1.DisposableStore();
            this._editor = editor;
            const domNode = document.createElement('div');
            domNode.className = 'descriptioncontainer';
            domNode.setAttribute('aria-live', 'assertive');
            domNode.setAttribute('role', 'alert');
            this._messageBlock = document.createElement('div');
            dom.addClass(this._messageBlock, 'message');
            domNode.appendChild(this._messageBlock);
            this._relatedBlock = document.createElement('div');
            domNode.appendChild(this._relatedBlock);
            this._disposables.add(dom.addStandardDisposableListener(this._relatedBlock, 'click', event => {
                event.preventDefault();
                const related = this._relatedDiagnostics.get(event.target);
                if (related) {
                    onRelatedInformation(related);
                }
            }));
            this._scrollable = new scrollableElement_1.ScrollableElement(domNode, {
                horizontal: 1 /* Auto */,
                vertical: 1 /* Auto */,
                useShadows: false,
                horizontalScrollbarSize: 3,
                verticalScrollbarSize: 3
            });
            parent.appendChild(this._scrollable.getDomNode());
            this._disposables.add(this._scrollable.onScroll(e => {
                domNode.style.left = `-${e.scrollLeft}px`;
                domNode.style.top = `-${e.scrollTop}px`;
            }));
            this._disposables.add(this._scrollable);
        }
        dispose() {
            lifecycle_1.dispose(this._disposables);
        }
        update({ source, message, relatedInformation, code }) {
            const lines = message.split(/\r\n|\r|\n/g);
            this._lines = lines.length;
            this._longestLineLength = 0;
            for (const line of lines) {
                this._longestLineLength = Math.max(line.length, this._longestLineLength);
            }
            dom.clearNode(this._messageBlock);
            this._editor.applyFontInfo(this._messageBlock);
            let lastLineElement = this._messageBlock;
            for (const line of lines) {
                lastLineElement = document.createElement('div');
                lastLineElement.innerText = line;
                if (line === '') {
                    lastLineElement.style.height = this._messageBlock.style.lineHeight;
                }
                this._messageBlock.appendChild(lastLineElement);
            }
            if (source || code) {
                const detailsElement = document.createElement('span');
                dom.addClass(detailsElement, 'details');
                lastLineElement.appendChild(detailsElement);
                if (source) {
                    const sourceElement = document.createElement('span');
                    sourceElement.innerText = source;
                    dom.addClass(sourceElement, 'source');
                    detailsElement.appendChild(sourceElement);
                }
                if (code) {
                    const codeElement = document.createElement('span');
                    codeElement.innerText = `(${code})`;
                    dom.addClass(codeElement, 'code');
                    detailsElement.appendChild(codeElement);
                }
            }
            dom.clearNode(this._relatedBlock);
            this._editor.applyFontInfo(this._relatedBlock);
            if (arrays_1.isNonEmptyArray(relatedInformation)) {
                const relatedInformationNode = this._relatedBlock.appendChild(document.createElement('div'));
                relatedInformationNode.style.paddingTop = `${Math.floor(this._editor.getOption(45 /* lineHeight */) * 0.66)}px`;
                this._lines += 1;
                for (const related of relatedInformation) {
                    let container = document.createElement('div');
                    let relatedResource = document.createElement('a');
                    dom.addClass(relatedResource, 'filename');
                    relatedResource.innerHTML = `${labels_1.getBaseLabel(related.resource)}(${related.startLineNumber}, ${related.startColumn}): `;
                    relatedResource.title = labels_1.getPathLabel(related.resource, undefined);
                    this._relatedDiagnostics.set(relatedResource, related);
                    let relatedMessage = document.createElement('span');
                    relatedMessage.innerText = related.message;
                    container.appendChild(relatedResource);
                    container.appendChild(relatedMessage);
                    this._lines += 1;
                    relatedInformationNode.appendChild(container);
                }
            }
            const fontInfo = this._editor.getOption(30 /* fontInfo */);
            const scrollWidth = Math.ceil(fontInfo.typicalFullwidthCharacterWidth * this._longestLineLength * 0.75);
            const scrollHeight = fontInfo.lineHeight * this._lines;
            this._scrollable.setScrollDimensions({ scrollWidth, scrollHeight });
        }
        layout(height, width) {
            this._scrollable.getDomNode().style.height = `${height}px`;
            this._scrollable.getDomNode().style.width = `${width}px`;
            this._scrollable.setScrollDimensions({ width, height });
        }
        getHeightInLines() {
            return Math.min(17, this._lines);
        }
    }
    class MarkerNavigationWidget extends peekViewWidget_1.PeekViewWidget {
        constructor(editor, actions, _themeService) {
            super(editor, { showArrow: true, showFrame: true, isAccessible: true });
            this.actions = actions;
            this._themeService = _themeService;
            this._callOnDispose = new lifecycle_1.DisposableStore();
            this._onDidSelectRelatedInformation = new event_1.Emitter();
            this.onDidSelectRelatedInformation = this._onDidSelectRelatedInformation.event;
            this._severity = markers_1.MarkerSeverity.Warning;
            this._backgroundColor = color_1.Color.white;
            this._applyTheme(_themeService.getTheme());
            this._callOnDispose.add(_themeService.onThemeChange(this._applyTheme.bind(this)));
            this.create();
        }
        _applyTheme(theme) {
            this._backgroundColor = theme.getColor(exports.editorMarkerNavigationBackground);
            let colorId = exports.editorMarkerNavigationError;
            if (this._severity === markers_1.MarkerSeverity.Warning) {
                colorId = exports.editorMarkerNavigationWarning;
            }
            else if (this._severity === markers_1.MarkerSeverity.Info) {
                colorId = exports.editorMarkerNavigationInfo;
            }
            const frameColor = theme.getColor(colorId);
            this.style({
                arrowColor: frameColor,
                frameColor: frameColor,
                headerBackgroundColor: this._backgroundColor,
                primaryHeadingColor: theme.getColor(referencesWidget_1.peekViewTitleForeground),
                secondaryHeadingColor: theme.getColor(referencesWidget_1.peekViewTitleInfoForeground)
            }); // style() will trigger _applyStyles
        }
        _applyStyles() {
            if (this._parentContainer) {
                this._parentContainer.style.backgroundColor = this._backgroundColor ? this._backgroundColor.toString() : '';
            }
            super._applyStyles();
        }
        dispose() {
            this._callOnDispose.dispose();
            super.dispose();
        }
        focus() {
            this._parentContainer.focus();
        }
        _fillHead(container) {
            super._fillHead(container);
            this._actionbarWidget.push(this.actions, { label: false, icon: true });
        }
        _fillTitleIcon(container) {
            this._icon = dom.append(container, dom.$(''));
        }
        _getActionBarOptions() {
            return {
                orientation: 1 /* HORIZONTAL_REVERSE */
            };
        }
        _fillBody(container) {
            this._parentContainer = container;
            dom.addClass(container, 'marker-widget');
            this._parentContainer.tabIndex = 0;
            this._parentContainer.setAttribute('role', 'tooltip');
            this._container = document.createElement('div');
            container.appendChild(this._container);
            this._message = new MessageWidget(this._container, this.editor, related => this._onDidSelectRelatedInformation.fire(related));
            this._disposables.add(this._message);
        }
        show(where, heightInLines) {
            throw new Error('call showAtMarker');
        }
        showAtMarker(marker, markerIdx, markerCount) {
            // update:
            // * title
            // * message
            this._container.classList.remove('stale');
            this._message.update(marker);
            // update frame color (only applied on 'show')
            this._severity = marker.severity;
            this._applyTheme(this._themeService.getTheme());
            // show
            let range = range_1.Range.lift(marker);
            const editorPosition = this.editor.getPosition();
            let position = editorPosition && range.containsPosition(editorPosition) ? editorPosition : range.getStartPosition();
            super.show(position, this.computeRequiredHeight());
            const model = this.editor.getModel();
            if (model) {
                const detail = markerCount > 1
                    ? nls.localize('problems', "{0} of {1} problems", markerIdx, markerCount)
                    : nls.localize('change', "{0} of {1} problem", markerIdx, markerCount);
                this.setTitle(resources_1.basename(model.uri), detail);
            }
            this._icon.className = `codicon ${severityIcon_1.SeverityIcon.className(markers_1.MarkerSeverity.toSeverity(this._severity))}`;
            this.editor.revealPositionInCenter(position, 0 /* Smooth */);
        }
        updateMarker(marker) {
            this._container.classList.remove('stale');
            this._message.update(marker);
        }
        showStale() {
            this._container.classList.add('stale');
            this._relayout();
        }
        _doLayoutBody(heightInPixel, widthInPixel) {
            super._doLayoutBody(heightInPixel, widthInPixel);
            this._heightInPixel = heightInPixel;
            this._message.layout(heightInPixel, widthInPixel);
            this._container.style.height = `${heightInPixel}px`;
        }
        _onWidth(widthInPixel) {
            this._message.layout(this._heightInPixel, widthInPixel);
        }
        _relayout() {
            super._relayout(this.computeRequiredHeight());
        }
        computeRequiredHeight() {
            return 3 + this._message.getHeightInLines();
        }
    }
    exports.MarkerNavigationWidget = MarkerNavigationWidget;
    // theming
    let errorDefault = colorRegistry_1.oneOf(colorRegistry_1.editorErrorForeground, colorRegistry_1.editorErrorBorder);
    let warningDefault = colorRegistry_1.oneOf(colorRegistry_1.editorWarningForeground, colorRegistry_1.editorWarningBorder);
    let infoDefault = colorRegistry_1.oneOf(colorRegistry_1.editorInfoForeground, colorRegistry_1.editorInfoBorder);
    exports.editorMarkerNavigationError = colorRegistry_1.registerColor('editorMarkerNavigationError.background', { dark: errorDefault, light: errorDefault, hc: errorDefault }, nls.localize('editorMarkerNavigationError', 'Editor marker navigation widget error color.'));
    exports.editorMarkerNavigationWarning = colorRegistry_1.registerColor('editorMarkerNavigationWarning.background', { dark: warningDefault, light: warningDefault, hc: warningDefault }, nls.localize('editorMarkerNavigationWarning', 'Editor marker navigation widget warning color.'));
    exports.editorMarkerNavigationInfo = colorRegistry_1.registerColor('editorMarkerNavigationInfo.background', { dark: infoDefault, light: infoDefault, hc: infoDefault }, nls.localize('editorMarkerNavigationInfo', 'Editor marker navigation widget info color.'));
    exports.editorMarkerNavigationBackground = colorRegistry_1.registerColor('editorMarkerNavigation.background', { dark: '#2D2D30', light: color_1.Color.white, hc: '#0C141F' }, nls.localize('editorMarkerNavigationBackground', 'Editor marker navigation widget background.'));
    themeService_1.registerThemingParticipant((theme, collector) => {
        const link = theme.getColor(colorRegistry_1.textLinkForeground);
        if (link) {
            collector.addRule(`.monaco-editor .marker-widget a { color: ${link}; }`);
        }
    });
});
//# sourceMappingURL=gotoErrorWidget.js.map