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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/browser/markdownRenderer", "vs/base/browser/ui/widget", "vs/base/common/event", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/base/browser/dom", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/terminal/browser/widgets/widgets", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/platform/configuration/common/configuration", "vs/editor/common/config/editorOptions"], function (require, exports, lifecycle_1, markdownRenderer_1, widget_1, event_1, themeService_1, colorRegistry_1, dom, keybinding_1, widgets_1, scrollableElement_1, configuration_1, editorOptions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HoverWidget = void 0;
    const $ = dom.$;
    let HoverWidget = /** @class */ (() => {
        let HoverWidget = class HoverWidget extends widget_1.Widget {
            constructor(_container, _target, _text, _linkHandler, _actions, _keybindingService, _configurationService) {
                super();
                this._container = _container;
                this._target = _target;
                this._text = _text;
                this._linkHandler = _linkHandler;
                this._actions = _actions;
                this._keybindingService = _keybindingService;
                this._configurationService = _configurationService;
                this._messageListeners = new lifecycle_1.DisposableStore();
                this._isDisposed = false;
                this._onDispose = new event_1.Emitter();
                this._containerDomNode = document.createElement('div');
                this._containerDomNode.classList.add('terminal-hover-widget', 'fadeIn', 'monaco-editor-hover', 'xterm-hover');
                this._containerDomNode.tabIndex = 0;
                this._containerDomNode.setAttribute('role', 'tooltip');
                this._domNode = document.createElement('div');
                this._domNode.className = 'monaco-editor-hover-content';
                this._scrollbar = new scrollableElement_1.DomScrollableElement(this._domNode, {});
                this._register(this._scrollbar);
                this._containerDomNode.appendChild(this._scrollbar.getDomNode());
                // Don't allow mousedown out of the widget, otherwise preventDefault will call and text will
                // not be selected.
                this.onmousedown(this._containerDomNode, e => e.stopPropagation());
                // Hide hover on escape
                this.onkeydown(this._containerDomNode, e => {
                    if (e.equals(9 /* Escape */)) {
                        this.dispose();
                    }
                });
                const rowElement = $('div.hover-row.markdown-hover');
                const contentsElement = $('div.hover-contents');
                const markdownElement = markdownRenderer_1.renderMarkdown(this._text, {
                    actionHandler: {
                        callback: (content) => this._linkHandler(content),
                        disposeables: this._messageListeners
                    },
                    codeBlockRenderer: async (_, value) => {
                        const fontFamily = this._configurationService.getValue('editor').fontFamily || editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily;
                        return `<span style="font-family: ${fontFamily}; white-space: nowrap">${value.replace(/\n/g, '<br>')}</span>`;
                    },
                    codeBlockRenderCallback: () => {
                        contentsElement.classList.add('code-hover-contents');
                        this.layout();
                    }
                });
                contentsElement.appendChild(markdownElement);
                rowElement.appendChild(contentsElement);
                this._domNode.appendChild(rowElement);
                if (this._actions && this._actions.length > 0) {
                    const statusBarElement = $('div.hover-row.status-bar');
                    const actionsElement = $('div.actions');
                    this._actions.forEach(action => this._renderAction(actionsElement, action));
                    statusBarElement.appendChild(actionsElement);
                    this._containerDomNode.appendChild(statusBarElement);
                }
                this._mouseTracker = new CompositeMouseTracker([this._containerDomNode, ..._target.targetElements]);
                this._register(this._mouseTracker.onMouseOut(() => this.dispose()));
                this._register(this._mouseTracker);
                this._container.appendChild(this._containerDomNode);
                this.layout();
            }
            get isDisposed() { return this._isDisposed; }
            get domNode() { return this._containerDomNode; }
            get onDispose() { return this._onDispose.event; }
            _renderAction(parent, actionOptions) {
                const actionContainer = dom.append(parent, $('div.action-container'));
                const action = dom.append(actionContainer, $('a.action'));
                action.setAttribute('href', '#');
                action.setAttribute('role', 'button');
                if (actionOptions.iconClass) {
                    dom.append(action, $(`span.icon.${actionOptions.iconClass}`));
                }
                const label = dom.append(action, $('span'));
                const keybinding = this._keybindingService.lookupKeybinding(actionOptions.commandId);
                const keybindingLabel = keybinding ? keybinding.getLabel() : null;
                label.textContent = keybindingLabel ? `${actionOptions.label} (${keybindingLabel})` : actionOptions.label;
                return dom.addDisposableListener(actionContainer, dom.EventType.CLICK, e => {
                    e.stopPropagation();
                    e.preventDefault();
                    actionOptions.run(actionContainer);
                });
            }
            layout() {
                const anchor = this._target.anchor;
                this._containerDomNode.classList.remove('right-aligned');
                this._domNode.style.maxHeight = '';
                if (anchor.horizontalAnchorSide === widgets_1.HorizontalAnchorSide.Left) {
                    if (anchor.x + this._containerDomNode.clientWidth > document.documentElement.clientWidth) {
                        // Shift the hover to the left when part of it would get cut off
                        const width = Math.round(this._containerDomNode.clientWidth);
                        this._containerDomNode.style.width = `${width - 1}px`;
                        this._containerDomNode.style.maxWidth = '';
                        const left = document.documentElement.clientWidth - width - 1;
                        this._containerDomNode.style.left = `${left}px`;
                        // Right align if the right edge is closer to the anchor than the left edge
                        if (left + width / 2 < anchor.x) {
                            this._containerDomNode.classList.add('right-aligned');
                        }
                    }
                    else {
                        this._containerDomNode.style.width = '';
                        this._containerDomNode.style.maxWidth = `${document.documentElement.clientWidth - anchor.x - 1}px`;
                        this._containerDomNode.style.left = `${anchor.x}px`;
                    }
                }
                else {
                    this._containerDomNode.style.right = `${anchor.x}px`;
                }
                // Use fallback y value if there is not enough vertical space
                if (anchor.verticalAnchorSide === widgets_1.VerticalAnchorSide.Bottom) {
                    if (anchor.y + this._containerDomNode.clientHeight > document.documentElement.clientHeight) {
                        this._containerDomNode.style.top = `${anchor.fallbackY}px`;
                        this._domNode.style.maxHeight = `${document.documentElement.clientHeight - anchor.fallbackY}px`;
                    }
                    else {
                        this._containerDomNode.style.bottom = `${anchor.y}px`;
                        this._containerDomNode.style.maxHeight = '';
                    }
                }
                else {
                    if (anchor.y + this._containerDomNode.clientHeight > document.documentElement.clientHeight) {
                        this._containerDomNode.style.bottom = `${anchor.fallbackY}px`;
                    }
                    else {
                        this._containerDomNode.style.top = `${anchor.y}px`;
                    }
                }
                this._scrollbar.scanDomNode();
            }
            focus() {
                this._containerDomNode.focus();
            }
            dispose() {
                var _a;
                if (!this._isDisposed) {
                    this._onDispose.fire();
                    (_a = this._containerDomNode.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(this.domNode);
                    this._messageListeners.dispose();
                    this._target.dispose();
                    super.dispose();
                }
                this._isDisposed = true;
            }
        };
        HoverWidget = __decorate([
            __param(5, keybinding_1.IKeybindingService),
            __param(6, configuration_1.IConfigurationService)
        ], HoverWidget);
        return HoverWidget;
    })();
    exports.HoverWidget = HoverWidget;
    class CompositeMouseTracker extends widget_1.Widget {
        constructor(_elements) {
            super();
            this._elements = _elements;
            this._isMouseIn = false;
            this._onMouseOut = new event_1.Emitter();
            this._elements.forEach(n => this.onmouseover(n, () => this._onTargetMouseOver()));
            this._elements.forEach(n => this.onnonbubblingmouseout(n, () => this._onTargetMouseOut()));
        }
        get onMouseOut() { return this._onMouseOut.event; }
        _onTargetMouseOver() {
            this._isMouseIn = true;
            this._clearEvaluateMouseStateTimeout();
        }
        _onTargetMouseOut() {
            this._isMouseIn = false;
            this._evaluateMouseState();
        }
        _evaluateMouseState() {
            this._clearEvaluateMouseStateTimeout();
            // Evaluate whether the mouse is still outside asynchronously such that other mouse targets
            // have the opportunity to first their mouse in event.
            this._mouseTimeout = window.setTimeout(() => this._fireIfMouseOutside(), 0);
        }
        _clearEvaluateMouseStateTimeout() {
            if (this._mouseTimeout) {
                clearTimeout(this._mouseTimeout);
                this._mouseTimeout = undefined;
            }
        }
        _fireIfMouseOutside() {
            if (!this._isMouseIn) {
                this._onMouseOut.fire();
            }
        }
    }
    themeService_1.registerThemingParticipant((theme, collector) => {
        const editorHoverHighlightColor = theme.getColor(colorRegistry_1.editorHoverHighlight);
        if (editorHoverHighlightColor) {
            collector.addRule(`.integrated-terminal .hoverHighlight { background-color: ${editorHoverHighlightColor}; }`);
        }
        const hoverBackground = theme.getColor(colorRegistry_1.editorHoverBackground);
        if (hoverBackground) {
            collector.addRule(`.integrated-terminal .monaco-editor-hover { background-color: ${hoverBackground}; }`);
        }
        const hoverBorder = theme.getColor(colorRegistry_1.editorHoverBorder);
        if (hoverBorder) {
            collector.addRule(`.integrated-terminal .monaco-editor-hover { border: 1px solid ${hoverBorder}; }`);
            collector.addRule(`.integrated-terminal .monaco-editor-hover .hover-row:not(:first-child):not(:empty) { border-top: 1px solid ${hoverBorder.transparent(0.5)}; }`);
            collector.addRule(`.integrated-terminal .monaco-editor-hover hr { border-top: 1px solid ${hoverBorder.transparent(0.5)}; }`);
            collector.addRule(`.integrated-terminal .monaco-editor-hover hr { border-bottom: 0px solid ${hoverBorder.transparent(0.5)}; }`);
        }
        const link = theme.getColor(colorRegistry_1.textLinkForeground);
        if (link) {
            collector.addRule(`.integrated-terminal .monaco-editor-hover a { color: ${link}; }`);
        }
        const hoverForeground = theme.getColor(colorRegistry_1.editorHoverForeground);
        if (hoverForeground) {
            collector.addRule(`.integrated-terminal .monaco-editor-hover { color: ${hoverForeground}; }`);
        }
        const actionsBackground = theme.getColor(colorRegistry_1.editorHoverStatusBarBackground);
        if (actionsBackground) {
            collector.addRule(`.integrated-terminal .monaco-editor-hover .hover-row .actions { background-color: ${actionsBackground}; }`);
        }
        const codeBackground = theme.getColor(colorRegistry_1.textCodeBlockBackground);
        if (codeBackground) {
            collector.addRule(`.integrated-terminal .monaco-editor-hover code { background-color: ${codeBackground}; }`);
        }
    });
});
//# sourceMappingURL=hoverWidget.js.map