/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/colorRegistry", "vs/css!./renameInputField"], function (require, exports, lifecycle_1, position_1, range_1, nls_1, contextkey_1, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CONTEXT_RENAME_INPUT_VISIBLE = new contextkey_1.RawContextKey('renameInputVisible', false);
    class RenameInputField {
        constructor(editor, themeService, contextKeyService) {
            this.themeService = themeService;
            this._disposables = new lifecycle_1.DisposableStore();
            // Editor.IContentWidget.allowEditorOverflow
            this.allowEditorOverflow = true;
            this._currentAcceptInput = null;
            this._currentCancelInput = null;
            this._visibleContextKey = exports.CONTEXT_RENAME_INPUT_VISIBLE.bindTo(contextKeyService);
            this._editor = editor;
            this._editor.addContentWidget(this);
            this._disposables.add(editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(31 /* fontInfo */)) {
                    this.updateFont();
                }
            }));
            this._disposables.add(themeService.onThemeChange(theme => this.onThemeChange(theme)));
        }
        onThemeChange(theme) {
            this.updateStyles(theme);
        }
        dispose() {
            this._disposables.dispose();
            this._editor.removeContentWidget(this);
        }
        getId() {
            return '__renameInputWidget';
        }
        getDomNode() {
            if (!this._domNode) {
                this._inputField = document.createElement('input');
                this._inputField.className = 'rename-input';
                this._inputField.type = 'text';
                this._inputField.setAttribute('aria-label', nls_1.localize('renameAriaLabel', "Rename input. Type new name and press Enter to commit."));
                this._domNode = document.createElement('div');
                this._domNode.style.height = `${this._editor.getOption(46 /* lineHeight */)}px`;
                this._domNode.className = 'monaco-editor rename-box';
                this._domNode.appendChild(this._inputField);
                this.updateFont();
                this.updateStyles(this.themeService.getTheme());
            }
            return this._domNode;
        }
        updateStyles(theme) {
            if (!this._inputField) {
                return;
            }
            const background = theme.getColor(colorRegistry_1.inputBackground);
            const foreground = theme.getColor(colorRegistry_1.inputForeground);
            const widgetShadowColor = theme.getColor(colorRegistry_1.widgetShadow);
            const border = theme.getColor(colorRegistry_1.inputBorder);
            this._inputField.style.backgroundColor = background ? background.toString() : '';
            this._inputField.style.color = foreground ? foreground.toString() : null;
            this._inputField.style.borderWidth = border ? '1px' : '0px';
            this._inputField.style.borderStyle = border ? 'solid' : 'none';
            this._inputField.style.borderColor = border ? border.toString() : 'none';
            this._domNode.style.boxShadow = widgetShadowColor ? ` 0 2px 8px ${widgetShadowColor}` : '';
        }
        updateFont() {
            if (!this._inputField) {
                return;
            }
            const fontInfo = this._editor.getOption(31 /* fontInfo */);
            this._inputField.style.fontFamily = fontInfo.fontFamily;
            this._inputField.style.fontWeight = fontInfo.fontWeight;
            this._inputField.style.fontSize = `${fontInfo.fontSize}px`;
        }
        getPosition() {
            return this._visible
                ? { position: this._position, preference: [2 /* BELOW */, 1 /* ABOVE */] }
                : null;
        }
        acceptInput() {
            if (this._currentAcceptInput) {
                this._currentAcceptInput();
            }
        }
        cancelInput(focusEditor) {
            if (this._currentCancelInput) {
                this._currentCancelInput(focusEditor);
            }
        }
        getInput(where, value, selectionStart, selectionEnd) {
            this._position = new position_1.Position(where.startLineNumber, where.startColumn);
            this._inputField.value = value;
            this._inputField.setAttribute('selectionStart', selectionStart.toString());
            this._inputField.setAttribute('selectionEnd', selectionEnd.toString());
            this._inputField.size = Math.max((where.endColumn - where.startColumn) * 1.1, 20);
            const disposeOnDone = new lifecycle_1.DisposableStore();
            const always = () => {
                disposeOnDone.dispose();
                this._hide();
            };
            return new Promise(resolve => {
                this._currentCancelInput = (focusEditor) => {
                    this._currentAcceptInput = null;
                    this._currentCancelInput = null;
                    resolve(focusEditor);
                    return true;
                };
                this._currentAcceptInput = () => {
                    if (this._inputField.value.trim().length === 0 || this._inputField.value === value) {
                        // empty or whitespace only or not changed
                        this.cancelInput(true);
                        return;
                    }
                    this._currentAcceptInput = null;
                    this._currentCancelInput = null;
                    resolve(this._inputField.value);
                };
                let onCursorChanged = () => {
                    const editorPosition = this._editor.getPosition();
                    if (!editorPosition || !range_1.Range.containsPosition(where, editorPosition)) {
                        this.cancelInput(true);
                    }
                };
                disposeOnDone.add(this._editor.onDidChangeCursorSelection(onCursorChanged));
                disposeOnDone.add(this._editor.onDidBlurEditorWidget(() => this.cancelInput(false)));
                this._show();
            }).then(newValue => {
                always();
                return newValue;
            }, err => {
                always();
                return Promise.reject(err);
            });
        }
        _show() {
            this._editor.revealLineInCenterIfOutsideViewport(this._position.lineNumber, 0 /* Smooth */);
            this._visible = true;
            this._visibleContextKey.set(true);
            this._editor.layoutContentWidget(this);
            setTimeout(() => {
                this._inputField.focus();
                this._inputField.setSelectionRange(parseInt(this._inputField.getAttribute('selectionStart')), parseInt(this._inputField.getAttribute('selectionEnd')));
            }, 100);
        }
        _hide() {
            this._visible = false;
            this._visibleContextKey.reset();
            this._editor.layoutContentWidget(this);
        }
    }
    exports.RenameInputField = RenameInputField;
});
//# sourceMappingURL=renameInputField.js.map