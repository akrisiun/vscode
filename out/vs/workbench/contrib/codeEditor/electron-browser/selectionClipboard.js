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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/platform/clipboard/common/clipboardService", "vs/workbench/contrib/codeEditor/browser/selectionClipboard", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/platform/configuration/common/configuration"], function (require, exports, async_1, lifecycle_1, platform, editorExtensions_1, range_1, clipboardService_1, selectionClipboard_1, platform_1, contributions_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let SelectionClipboard = class SelectionClipboard extends lifecycle_1.Disposable {
        constructor(editor, clipboardService) {
            super();
            if (platform.isLinux) {
                let isEnabled = editor.getOption(76 /* selectionClipboard */);
                this._register(editor.onDidChangeConfiguration((e) => {
                    if (e.hasChanged(76 /* selectionClipboard */)) {
                        isEnabled = editor.getOption(76 /* selectionClipboard */);
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
                    if (e.source === 'restoreState') {
                        // do not set selection to clipboard if this selection change
                        // was caused by restoring editors...
                        return;
                    }
                    setSelectionToClipboard.schedule();
                }));
            }
        }
        dispose() {
            super.dispose();
        }
    };
    SelectionClipboard.SELECTION_LENGTH_LIMIT = 65536;
    SelectionClipboard = __decorate([
        __param(1, clipboardService_1.IClipboardService)
    ], SelectionClipboard);
    exports.SelectionClipboard = SelectionClipboard;
    let SelectionClipboardPastePreventer = class SelectionClipboardPastePreventer {
        constructor(configurationService) {
            if (platform.isLinux) {
                document.addEventListener('mouseup', (e) => {
                    if (e.button === 1) {
                        // middle button
                        const config = configurationService.getValue('editor');
                        if (!config.selectionClipboard) {
                            // selection clipboard is disabled
                            // try to stop the upcoming paste
                            e.preventDefault();
                        }
                    }
                });
            }
        }
    };
    SelectionClipboardPastePreventer = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], SelectionClipboardPastePreventer);
    editorExtensions_1.registerEditorContribution(selectionClipboard_1.SelectionClipboardContributionID, SelectionClipboard);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(SelectionClipboardPastePreventer, 2 /* Ready */);
});
//# sourceMappingURL=selectionClipboard.js.map