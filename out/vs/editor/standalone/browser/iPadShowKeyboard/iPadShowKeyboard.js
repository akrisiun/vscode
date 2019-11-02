/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/css!./iPadShowKeyboard"], function (require, exports, browser, dom, lifecycle_1, editorExtensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class IPadShowKeyboard extends lifecycle_1.Disposable {
        constructor(editor) {
            super();
            this.editor = editor;
            this.widget = null;
            if (browser.isIPad) {
                this._register(editor.onDidChangeConfiguration(() => this.update()));
                this.update();
            }
        }
        update() {
            const shouldHaveWidget = (!this.editor.getOption(64 /* readOnly */));
            if (!this.widget && shouldHaveWidget) {
                this.widget = new ShowKeyboardWidget(this.editor);
            }
            else if (this.widget && !shouldHaveWidget) {
                this.widget.dispose();
                this.widget = null;
            }
        }
        dispose() {
            super.dispose();
            if (this.widget) {
                this.widget.dispose();
                this.widget = null;
            }
        }
    }
    exports.IPadShowKeyboard = IPadShowKeyboard;
    IPadShowKeyboard.ID = 'editor.contrib.iPadShowKeyboard';
    class ShowKeyboardWidget extends lifecycle_1.Disposable {
        constructor(editor) {
            super();
            this.editor = editor;
            this._domNode = document.createElement('textarea');
            this._domNode.className = 'iPadShowKeyboard';
            this._register(dom.addDisposableListener(this._domNode, 'touchstart', (e) => {
                this.editor.focus();
            }));
            this._register(dom.addDisposableListener(this._domNode, 'focus', (e) => {
                this.editor.focus();
            }));
            this.editor.addOverlayWidget(this);
        }
        dispose() {
            this.editor.removeOverlayWidget(this);
            super.dispose();
        }
        // ----- IOverlayWidget API
        getId() {
            return ShowKeyboardWidget.ID;
        }
        getDomNode() {
            return this._domNode;
        }
        getPosition() {
            return {
                preference: 1 /* BOTTOM_RIGHT_CORNER */
            };
        }
    }
    ShowKeyboardWidget.ID = 'editor.contrib.ShowKeyboardWidget';
    editorExtensions_1.registerEditorContribution(IPadShowKeyboard.ID, IPadShowKeyboard);
});
//# sourceMappingURL=iPadShowKeyboard.js.map