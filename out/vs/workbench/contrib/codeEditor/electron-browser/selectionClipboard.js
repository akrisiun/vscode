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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/common/editorCommon", "vs/platform/clipboard/common/clipboardService", "vs/workbench/contrib/codeEditor/browser/selectionClipboard", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/platform/configuration/common/configuration", "vs/editor/common/editorContextKeys"], function (require, exports, nls, async_1, lifecycle_1, platform, editorExtensions_1, range_1, editorCommon_1, clipboardService_1, selectionClipboard_1, platform_1, contributions_1, configuration_1, editorContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectionClipboard = void 0;
    let SelectionClipboard = /** @class */ (() => {
        let SelectionClipboard = class SelectionClipboard extends lifecycle_1.Disposable {
            constructor(editor, clipboardService) {
                super();
                if (platform.isLinux) {
                    let isEnabled = editor.getOption(88 /* selectionClipboard */);
                    this._register(editor.onDidChangeConfiguration((e) => {
                        if (e.hasChanged(88 /* selectionClipboard */)) {
                            isEnabled = editor.getOption(88 /* selectionClipboard */);
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
        return SelectionClipboard;
    })();
    exports.SelectionClipboard = SelectionClipboard;
    let SelectionClipboardPastePreventer = /** @class */ (() => {
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
        return SelectionClipboardPastePreventer;
    })();
    class PasteSelectionClipboardAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.selectionClipboardPaste',
                label: nls.localize('actions.pasteSelectionClipboard', "Paste Selection Clipboard"),
                alias: 'Paste Selection Clipboard',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        async run(accessor, editor, args) {
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            // read selection clipboard
            const text = await clipboardService.readText('selection');
            editor.trigger('keyboard', editorCommon_1.Handler.Paste, {
                text: text,
                pasteOnNewLine: false,
                multicursorText: null
            });
        }
    }
    editorExtensions_1.registerEditorContribution(selectionClipboard_1.SelectionClipboardContributionID, SelectionClipboard);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(SelectionClipboardPastePreventer, 2 /* Ready */);
    if (platform.isLinux) {
        editorExtensions_1.registerEditorAction(PasteSelectionClipboardAction);
    }
});
//# sourceMappingURL=selectionClipboard.js.map