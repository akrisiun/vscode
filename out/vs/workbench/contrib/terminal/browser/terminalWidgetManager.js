/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle"], function (require, exports, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const WIDGET_HEIGHT = 29;
    class TerminalWidgetManager {
        constructor(terminalWrapper) {
            this._messageListeners = new lifecycle_1.DisposableStore();
            this._container = document.createElement('div');
            this._container.classList.add('terminal-widget-overlay');
            terminalWrapper.appendChild(this._container);
            this._initTerminalHeightWatcher(terminalWrapper);
        }
        dispose() {
            if (this._container && this._container.parentElement) {
                this._container.parentElement.removeChild(this._container);
                this._container = undefined;
            }
            this._xtermViewport = undefined;
            this._messageListeners.dispose();
        }
        _initTerminalHeightWatcher(terminalWrapper) {
            // Watch the xterm.js viewport for style changes and do a layout if it changes
            this._xtermViewport = terminalWrapper.querySelector('.xterm-viewport');
            if (!this._xtermViewport) {
                return;
            }
            const mutationObserver = new MutationObserver(() => this._refreshHeight());
            mutationObserver.observe(this._xtermViewport, { attributes: true, attributeFilter: ['style'] });
        }
        showMessage(left, top, text) {
            if (!this._container) {
                return;
            }
            lifecycle_1.dispose(this._messageWidget);
            this._messageListeners.clear();
            this._messageWidget = new MessageWidget(this._container, left, top, text);
        }
        closeMessage() {
            this._messageListeners.clear();
            if (this._messageWidget) {
                this._messageListeners.add(MessageWidget.fadeOut(this._messageWidget));
            }
        }
        _refreshHeight() {
            if (!this._container || !this._xtermViewport) {
                return;
            }
            this._container.style.height = this._xtermViewport.style.height;
        }
    }
    exports.TerminalWidgetManager = TerminalWidgetManager;
    class MessageWidget {
        constructor(_container, _left, _top, _text) {
            this._container = _container;
            this._left = _left;
            this._top = _top;
            this._text = _text;
            this._domNode = document.createElement('div');
            this._domNode.style.position = 'absolute';
            this._domNode.style.left = `${_left}px`;
            this._domNode.style.bottom = `${_container.offsetHeight - Math.max(_top, WIDGET_HEIGHT)}px`;
            this._domNode.classList.add('terminal-message-widget', 'fadeIn');
            this._domNode.textContent = _text;
            this._container.appendChild(this._domNode);
        }
        get left() { return this._left; }
        get top() { return this._top; }
        get text() { return this._text; }
        get domNode() { return this._domNode; }
        static fadeOut(messageWidget) {
            let handle;
            const dispose = () => {
                messageWidget.dispose();
                clearTimeout(handle);
                messageWidget.domNode.removeEventListener('animationend', dispose);
            };
            handle = setTimeout(dispose, 110);
            messageWidget.domNode.addEventListener('animationend', dispose);
            messageWidget.domNode.classList.add('fadeOut');
            return { dispose };
        }
        dispose() {
            if (this.domNode.parentElement === this._container) {
                this._container.removeChild(this.domNode);
            }
        }
    }
});
//# sourceMappingURL=terminalWidgetManager.js.map