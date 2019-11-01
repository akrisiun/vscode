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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/process", "vs/base/common/platform", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/platform/clipboard/common/clipboardService"], function (require, exports, async_1, lifecycle_1, process, platform, editorExtensions_1, range_1, clipboardService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let SelectionClipboard = class SelectionClipboard extends lifecycle_1.Disposable {
        constructor(editor, clipboardService) {
            super();
            if (platform.isLinux) {
                let isEnabled = editor.getOption(75 /* selectionClipboard */);
                this._register(editor.onDidChangeConfiguration((e) => {
                    if (e.hasChanged(75 /* selectionClipboard */)) {
                        isEnabled = editor.getOption(75 /* selectionClipboard */);
                    }
                }));
                this._register(editor.onMouseDown((e) => {
                    if (!isEnabled) {
                        return;
                    }
                    if (!editor.hasModel()) {
                        return;
                    }
                    if (e.event.middleButton) {
                        e.event.preventDefault();
                        editor.focus();
                        if (e.target.position) {
                            editor.setPosition(e.target.position);
                        }
                        if (e.target.type === 11 /* SCROLLBAR */) {
                            return;
                        }
                        process.nextTick(() => {
                            // TODO@Alex: electron weirdness: calling clipboard.readText('selection') generates a paste event, so no need to execute paste ourselves
                            clipboardService.readText('selection');
                            // keybindingService.executeCommand(Handler.Paste, {
                            // 	text: clipboard.readText('selection'),
                            // 	pasteOnNewLine: false
                            // });
                        });
                    }
                }));
                let setSelectionToClipboard = this._register(new async_1.RunOnceScheduler(() => {
                    if (!editor.hasModel()) {
                        return;
                    }
                    let model = editor.getModel();
                    let selections = editor.getSelections();
                    selections = selections.slice(0);
                    selections.sort(range_1.Range.compareRangesUsingStarts);
                    let resultLength = 0;
                    for (const sel of selections) {
                        if (sel.isEmpty()) {
                            // Only write if all cursors have selection
                            return;
                        }
                        resultLength += model.getValueLengthInRange(sel);
                    }
                    if (resultLength > SelectionClipboard.SELECTION_LENGTH_LIMIT) {
                        // This is a large selection!
                        // => do not write it to the selection clipboard
                        return;
                    }
                    let result = [];
                    for (const sel of selections) {
                        result.push(model.getValueInRange(sel, 0 /* TextDefined */));
                    }
                    let textToCopy = result.join(model.getEOL());
                    clipboardService.writeText(textToCopy, 'selection');
                }, 100));
                this._register(editor.onDidChangeCursorSelection((e) => {
                    if (!isEnabled) {
                        return;
                    }
                    setSelectionToClipboard.schedule();
                }));
            }
        }
        getId() {
            return SelectionClipboard.ID;
        }
        dispose() {
            super.dispose();
        }
    };
    SelectionClipboard.SELECTION_LENGTH_LIMIT = 65536;
    SelectionClipboard.ID = 'editor.contrib.selectionClipboard';
    SelectionClipboard = __decorate([
        __param(1, clipboardService_1.IClipboardService)
    ], SelectionClipboard);
    exports.SelectionClipboard = SelectionClipboard;
    editorExtensions_1.registerEditorContribution(SelectionClipboard);
});
//# sourceMappingURL=selectionClipboard.js.map