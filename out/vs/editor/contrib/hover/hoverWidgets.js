/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/browser/ui/widget"], function (require, exports, dom_1, scrollableElement_1, widget_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ContentHoverWidget extends widget_1.Widget {
        constructor(id, editor) {
            super();
            // Editor.IContentWidget.allowEditorOverflow
            this.allowEditorOverflow = true;
            this._id = id;
            this._editor = editor;
            this._isVisible = false;
            this._stoleFocus = false;
            this._containerDomNode = document.createElement('div');
            this._containerDomNode.className = 'monaco-editor-hover hidden';
            this._containerDomNode.tabIndex = 0;
            this._domNode = document.createElement('div');
            this._domNode.className = 'monaco-editor-hover-content';
            this.scrollbar = new scrollableElement_1.DomScrollableElement(this._domNode, {});
            this._register(this.scrollbar);
            this._containerDomNode.appendChild(this.scrollbar.getDomNode());
            this.onkeydown(this._containerDomNode, (e) => {
                if (e.equals(9 /* Escape */)) {
                    this.hide();
                }
            });
            this._register(this._editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(31 /* fontInfo */)) {
                    this.updateFont();
                }
            }));
            this._editor.onDidLayoutChange(e => this.layout());
            this.layout();
            this._editor.addContentWidget(this);
            this._showAtPosition = null;
            this._showAtRange = null;
            this._stoleFocus = false;
        }
        get isVisible() {
            return this._isVisible;
        }
        set isVisible(value) {
            this._isVisible = value;
            dom_1.toggleClass(this._containerDomNode, 'hidden', !this._isVisible);
        }
        getId() {
            return this._id;
        }
        getDomNode() {
            return this._containerDomNode;
        }
        showAt(position, range, focus) {
            // Position has changed
            this._showAtPosition = position;
            this._showAtRange = range;
            this.isVisible = true;
            this._editor.layoutContentWidget(this);
            // Simply force a synchronous render on the editor
            // such that the widget does not really render with left = '0px'
            this._editor.render();
            this._stoleFocus = focus;
            if (focus) {
                this._containerDomNode.focus();
            }
        }
        hide() {
            if (!this.isVisible) {
                return;
            }
            this.isVisible = false;
            this._editor.layoutContentWidget(this);
            if (this._stoleFocus) {
                this._editor.focus();
            }
        }
        getPosition() {
            if (this.isVisible) {
                return {
                    position: this._showAtPosition,
                    range: this._showAtRange,
                    preference: [
                        1 /* ABOVE */,
                        2 /* BELOW */
                    ]
                };
            }
            return null;
        }
        dispose() {
            this._editor.removeContentWidget(this);
            super.dispose();
        }
        updateFont() {
            const codeClasses = Array.prototype.slice.call(this._domNode.getElementsByClassName('code'));
            codeClasses.forEach(node => this._editor.applyFontInfo(node));
        }
        updateContents(node) {
            this._domNode.textContent = '';
            this._domNode.appendChild(node);
            this.updateFont();
            this._editor.layoutContentWidget(this);
            this.onContentsChange();
        }
        onContentsChange() {
            this.scrollbar.scanDomNode();
        }
        layout() {
            const height = Math.max(this._editor.getLayoutInfo().height / 4, 250);
            const { fontSize, lineHeight } = this._editor.getOption(31 /* fontInfo */);
            this._domNode.style.fontSize = `${fontSize}px`;
            this._domNode.style.lineHeight = `${lineHeight}px`;
            this._domNode.style.maxHeight = `${height}px`;
            this._domNode.style.maxWidth = `${Math.max(this._editor.getLayoutInfo().width * 0.66, 500)}px`;
        }
    }
    exports.ContentHoverWidget = ContentHoverWidget;
    class GlyphHoverWidget extends widget_1.Widget {
        constructor(id, editor) {
            super();
            this._id = id;
            this._editor = editor;
            this._isVisible = false;
            this._domNode = document.createElement('div');
            this._domNode.className = 'monaco-editor-hover hidden';
            this._domNode.setAttribute('aria-hidden', 'true');
            this._domNode.setAttribute('role', 'presentation');
            this._showAtLineNumber = -1;
            this._register(this._editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(31 /* fontInfo */)) {
                    this.updateFont();
                }
            }));
            this._editor.addOverlayWidget(this);
        }
        get isVisible() {
            return this._isVisible;
        }
        set isVisible(value) {
            this._isVisible = value;
            dom_1.toggleClass(this._domNode, 'hidden', !this._isVisible);
        }
        getId() {
            return this._id;
        }
        getDomNode() {
            return this._domNode;
        }
        showAt(lineNumber) {
            this._showAtLineNumber = lineNumber;
            if (!this.isVisible) {
                this.isVisible = true;
            }
            const editorLayout = this._editor.getLayoutInfo();
            const topForLineNumber = this._editor.getTopForLineNumber(this._showAtLineNumber);
            const editorScrollTop = this._editor.getScrollTop();
            const lineHeight = this._editor.getOption(46 /* lineHeight */);
            const nodeHeight = this._domNode.clientHeight;
            const top = topForLineNumber - editorScrollTop - ((nodeHeight - lineHeight) / 2);
            this._domNode.style.left = `${editorLayout.glyphMarginLeft + editorLayout.glyphMarginWidth}px`;
            this._domNode.style.top = `${Math.max(Math.round(top), 0)}px`;
        }
        hide() {
            if (!this.isVisible) {
                return;
            }
            this.isVisible = false;
        }
        getPosition() {
            return null;
        }
        dispose() {
            this._editor.removeOverlayWidget(this);
            super.dispose();
        }
        updateFont() {
            const codeTags = Array.prototype.slice.call(this._domNode.getElementsByTagName('code'));
            const codeClasses = Array.prototype.slice.call(this._domNode.getElementsByClassName('code'));
            [...codeTags, ...codeClasses].forEach(node => this._editor.applyFontInfo(node));
        }
        updateContents(node) {
            this._domNode.textContent = '';
            this._domNode.appendChild(node);
            this.updateFont();
        }
    }
    exports.GlyphHoverWidget = GlyphHoverWidget;
});
//# sourceMappingURL=hoverWidgets.js.map