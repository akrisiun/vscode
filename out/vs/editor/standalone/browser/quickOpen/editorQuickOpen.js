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
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/common/model/textModel", "vs/editor/standalone/browser/quickOpen/quickOpenEditorWidget", "vs/platform/theme/common/themeService", "vs/css!./editorQuickOpen"], function (require, exports, editorExtensions_1, textModel_1, quickOpenEditorWidget_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let QuickOpenController = class QuickOpenController {
        constructor(editor, themeService) {
            this.themeService = themeService;
            this.widget = null;
            this.rangeHighlightDecorationId = null;
            this.lastKnownEditorSelection = null;
            this.editor = editor;
        }
        static get(editor) {
            return editor.getContribution(QuickOpenController.ID);
        }
        getId() {
            return QuickOpenController.ID;
        }
        dispose() {
            // Dispose widget
            if (this.widget) {
                this.widget.destroy();
                this.widget = null;
            }
        }
        run(opts) {
            if (this.widget) {
                this.widget.destroy();
                this.widget = null;
            }
            // Create goto line widget
            let onClose = (canceled) => {
                // Clear Highlight Decorations if present
                this.clearDecorations();
                // Restore selection if canceled
                if (canceled && this.lastKnownEditorSelection) {
                    this.editor.setSelection(this.lastKnownEditorSelection);
                    this.editor.revealRangeInCenterIfOutsideViewport(this.lastKnownEditorSelection, 0 /* Smooth */);
                }
                this.lastKnownEditorSelection = null;
                // Return focus to the editor if
                // - focus is back on the <body> element because no other focusable element was clicked
                // - a command was picked from the picker which indicates the editor should get focused
                if (document.activeElement === document.body || !canceled) {
                    this.editor.focus();
                }
            };
            this.widget = new quickOpenEditorWidget_1.QuickOpenEditorWidget(this.editor, () => onClose(false), () => onClose(true), (value) => {
                this.widget.setInput(opts.getModel(value), opts.getAutoFocus(value));
            }, {
                inputAriaLabel: opts.inputAriaLabel
            }, this.themeService);
            // Remember selection to be able to restore on cancel
            if (!this.lastKnownEditorSelection) {
                this.lastKnownEditorSelection = this.editor.getSelection();
            }
            // Show
            this.widget.show('');
        }
        decorateLine(range, editor) {
            const oldDecorations = [];
            if (this.rangeHighlightDecorationId) {
                oldDecorations.push(this.rangeHighlightDecorationId);
                this.rangeHighlightDecorationId = null;
            }
            const newDecorations = [
                {
                    range: range,
                    options: QuickOpenController._RANGE_HIGHLIGHT_DECORATION
                }
            ];
            const decorations = editor.deltaDecorations(oldDecorations, newDecorations);
            this.rangeHighlightDecorationId = decorations[0];
        }
        clearDecorations() {
            if (this.rangeHighlightDecorationId) {
                this.editor.deltaDecorations([this.rangeHighlightDecorationId], []);
                this.rangeHighlightDecorationId = null;
            }
        }
    };
    QuickOpenController.ID = 'editor.controller.quickOpenController';
    QuickOpenController._RANGE_HIGHLIGHT_DECORATION = textModel_1.ModelDecorationOptions.register({
        className: 'rangeHighlight',
        isWholeLine: true
    });
    QuickOpenController = __decorate([
        __param(1, themeService_1.IThemeService)
    ], QuickOpenController);
    exports.QuickOpenController = QuickOpenController;
    /**
     * Base class for providing quick open in the editor.
     */
    class BaseEditorQuickOpenAction extends editorExtensions_1.EditorAction {
        constructor(inputAriaLabel, opts) {
            super(opts);
            this._inputAriaLabel = inputAriaLabel;
        }
        getController(editor) {
            return QuickOpenController.get(editor);
        }
        _show(controller, opts) {
            controller.run({
                inputAriaLabel: this._inputAriaLabel,
                getModel: (value) => opts.getModel(value),
                getAutoFocus: (searchValue) => opts.getAutoFocus(searchValue)
            });
        }
    }
    exports.BaseEditorQuickOpenAction = BaseEditorQuickOpenAction;
    editorExtensions_1.registerEditorContribution(QuickOpenController);
});
//# sourceMappingURL=editorQuickOpen.js.map