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
define(["require", "exports", "vs/editor/common/core/range", "vs/workbench/contrib/debug/common/debug", "vs/editor/common/services/modelService", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/nls", "vs/base/common/lifecycle"], function (require, exports, range_1, debug_1, modelService_1, themeService_1, colorRegistry_1, nls_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const stickiness = 1 /* NeverGrowsWhenTypingAtEdges */;
    let DebugCallStackContribution = class DebugCallStackContribution {
        constructor(modelService, debugService) {
            this.modelService = modelService;
            this.debugService = debugService;
            this.modelDataMap = new Map();
            this.toDispose = [];
            this.registerListeners();
        }
        registerListeners() {
            this.toDispose.push(this.modelService.onModelAdded(this.onModelAdded, this));
            this.modelService.getModels().forEach(model => this.onModelAdded(model));
            this.toDispose.push(this.modelService.onModelRemoved(this.onModelRemoved, this));
            this.toDispose.push(this.debugService.getViewModel().onDidFocusStackFrame(() => this.onFocusStackFrame()));
            this.toDispose.push(this.debugService.onDidChangeState(state => {
                if (state === 0 /* Inactive */) {
                    this.modelDataMap.forEach(modelData => {
                        modelData.topStackFrameRange = undefined;
                    });
                }
            }));
        }
        onModelAdded(model) {
            const modelUriStr = model.uri.toString();
            const currentStackDecorations = model.deltaDecorations([], this.createCallStackDecorations(modelUriStr));
            this.modelDataMap.set(modelUriStr, {
                model: model,
                currentStackDecorations: currentStackDecorations,
                topStackFrameRange: undefined
            });
        }
        onModelRemoved(model) {
            const modelUriStr = model.uri.toString();
            const data = this.modelDataMap.get(modelUriStr);
            if (data) {
                this.modelDataMap.delete(modelUriStr);
            }
        }
        onFocusStackFrame() {
            this.modelDataMap.forEach((modelData, uri) => {
                modelData.currentStackDecorations = modelData.model.deltaDecorations(modelData.currentStackDecorations, this.createCallStackDecorations(uri));
            });
        }
        createCallStackDecorations(modelUriStr) {
            const result = [];
            const stackFrame = this.debugService.getViewModel().focusedStackFrame;
            if (!stackFrame || stackFrame.source.uri.toString() !== modelUriStr) {
                return result;
            }
            // only show decorations for the currently focused thread.
            const columnUntilEOLRange = new range_1.Range(stackFrame.range.startLineNumber, stackFrame.range.startColumn, stackFrame.range.startLineNumber, 1073741824 /* MAX_SAFE_SMALL_INTEGER */);
            const range = new range_1.Range(stackFrame.range.startLineNumber, stackFrame.range.startColumn, stackFrame.range.startLineNumber, stackFrame.range.startColumn + 1);
            // compute how to decorate the editor. Different decorations are used if this is a top stack frame, focused stack frame,
            // an exception or a stack frame that did not change the line number (we only decorate the columns, not the whole line).
            const callStack = stackFrame.thread.getCallStack();
            if (callStack && callStack.length && stackFrame === callStack[0]) {
                result.push({
                    options: DebugCallStackContribution.TOP_STACK_FRAME_MARGIN,
                    range
                });
                result.push({
                    options: DebugCallStackContribution.TOP_STACK_FRAME_DECORATION,
                    range: columnUntilEOLRange
                });
                const modelData = this.modelDataMap.get(modelUriStr);
                if (modelData) {
                    if (modelData.topStackFrameRange && modelData.topStackFrameRange.startLineNumber === stackFrame.range.startLineNumber && modelData.topStackFrameRange.startColumn !== stackFrame.range.startColumn) {
                        result.push({
                            options: DebugCallStackContribution.TOP_STACK_FRAME_INLINE_DECORATION,
                            range: columnUntilEOLRange
                        });
                    }
                    modelData.topStackFrameRange = columnUntilEOLRange;
                }
            }
            else {
                result.push({
                    options: DebugCallStackContribution.FOCUSED_STACK_FRAME_MARGIN,
                    range
                });
                result.push({
                    options: DebugCallStackContribution.FOCUSED_STACK_FRAME_DECORATION,
                    range: columnUntilEOLRange
                });
            }
            return result;
        }
        dispose() {
            this.modelDataMap.forEach(modelData => {
                modelData.model.deltaDecorations(modelData.currentStackDecorations, []);
            });
            this.toDispose = lifecycle_1.dispose(this.toDispose);
            this.modelDataMap.clear();
        }
    };
    // editor decorations
    DebugCallStackContribution.STICKINESS = 1 /* NeverGrowsWhenTypingAtEdges */;
    // we need a separate decoration for glyph margin, since we do not want it on each line of a multi line statement.
    DebugCallStackContribution.TOP_STACK_FRAME_MARGIN = {
        glyphMarginClassName: 'debug-top-stack-frame',
        stickiness
    };
    DebugCallStackContribution.FOCUSED_STACK_FRAME_MARGIN = {
        glyphMarginClassName: 'debug-focused-stack-frame',
        stickiness
    };
    DebugCallStackContribution.TOP_STACK_FRAME_DECORATION = {
        isWholeLine: true,
        inlineClassName: 'debug-remove-token-colors',
        className: 'debug-top-stack-frame-line',
        stickiness
    };
    DebugCallStackContribution.TOP_STACK_FRAME_INLINE_DECORATION = {
        beforeContentClassName: 'debug-top-stack-frame-column'
    };
    DebugCallStackContribution.FOCUSED_STACK_FRAME_DECORATION = {
        isWholeLine: true,
        inlineClassName: 'debug-remove-token-colors',
        className: 'debug-focused-stack-frame-line',
        stickiness
    };
    DebugCallStackContribution = __decorate([
        __param(0, modelService_1.IModelService),
        __param(1, debug_1.IDebugService)
    ], DebugCallStackContribution);
    exports.DebugCallStackContribution = DebugCallStackContribution;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const topStackFrame = theme.getColor(topStackFrameColor);
        if (topStackFrame) {
            collector.addRule(`.monaco-editor .view-overlays .debug-top-stack-frame-line { background: ${topStackFrame}; }`);
            collector.addRule(`.monaco-editor .view-overlays .debug-top-stack-frame-line { background: ${topStackFrame}; }`);
        }
        const focusedStackFrame = theme.getColor(focusedStackFrameColor);
        if (focusedStackFrame) {
            collector.addRule(`.monaco-editor .view-overlays .debug-focused-stack-frame-line { background: ${focusedStackFrame}; }`);
        }
    });
    const topStackFrameColor = colorRegistry_1.registerColor('editor.stackFrameHighlightBackground', { dark: '#ffff0033', light: '#ffff6673', hc: '#fff600' }, nls_1.localize('topStackFrameLineHighlight', 'Background color for the highlight of line at the top stack frame position.'));
    const focusedStackFrameColor = colorRegistry_1.registerColor('editor.focusedStackFrameHighlightBackground', { dark: '#7abd7a4d', light: '#cee7ce73', hc: '#cee7ce' }, nls_1.localize('focusedStackFrameLineHighlight', 'Background color for the highlight of line at focused stack frame position.'));
});
//# sourceMappingURL=debugCallStackContribution.js.map