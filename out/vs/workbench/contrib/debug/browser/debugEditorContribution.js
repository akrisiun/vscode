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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/platform", "vs/base/common/json", "vs/editor/common/model/wordHelper", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/range", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry", "vs/platform/configuration/common/configuration", "vs/platform/commands/common/commands", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/browser/exceptionWidget", "vs/workbench/browser/parts/editor/editorWidgets", "vs/editor/common/core/position", "vs/editor/browser/controller/coreCommands", "vs/base/common/arrays", "vs/base/common/decorators", "vs/base/common/cancellation", "vs/workbench/contrib/debug/browser/debugHover", "vs/editor/contrib/hover/getHover", "vs/base/common/lifecycle"], function (require, exports, nls, async_1, env, json_1, wordHelper_1, editorExtensions_1, codeEditorService_1, range_1, instantiation_1, telemetry_1, configuration_1, commands_1, debug_1, exceptionWidget_1, editorWidgets_1, position_1, coreCommands_1, arrays_1, decorators_1, cancellation_1, debugHover_1, getHover_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const HOVER_DELAY = 300;
    const LAUNCH_JSON_REGEX = /launch\.json$/;
    const INLINE_VALUE_DECORATION_KEY = 'inlinevaluedecoration';
    const MAX_NUM_INLINE_VALUES = 100; // JS Global scope can have 700+ entries. We want to limit ourselves for perf reasons
    const MAX_INLINE_DECORATOR_LENGTH = 150; // Max string length of each inline decorator when debugging. If exceeded ... is added
    const MAX_TOKENIZATION_LINE_LEN = 500; // If line is too long, then inline values for the line are skipped
    let DebugEditorContribution = class DebugEditorContribution {
        constructor(editor, debugService, instantiationService, commandService, codeEditorService, telemetryService, configurationService) {
            this.editor = editor;
            this.debugService = debugService;
            this.instantiationService = instantiationService;
            this.commandService = commandService;
            this.codeEditorService = codeEditorService;
            this.telemetryService = telemetryService;
            this.configurationService = configurationService;
            this.hoverRange = null;
            this.mouseDown = false;
            this.hoverWidget = this.instantiationService.createInstance(debugHover_1.DebugHoverWidget, this.editor);
            this.toDispose = [];
            this.registerListeners();
            this.updateConfigurationWidgetVisibility();
            this.codeEditorService.registerDecorationType(INLINE_VALUE_DECORATION_KEY, {});
            this.toggleExceptionWidget();
        }
        registerListeners() {
            this.toDispose.push(this.debugService.getViewModel().onDidFocusStackFrame(e => this.onFocusStackFrame(e.stackFrame)));
            // hover listeners & hover widget
            this.toDispose.push(this.editor.onMouseDown((e) => this.onEditorMouseDown(e)));
            this.toDispose.push(this.editor.onMouseUp(() => this.mouseDown = false));
            this.toDispose.push(this.editor.onMouseMove((e) => this.onEditorMouseMove(e)));
            this.toDispose.push(this.editor.onMouseLeave((e) => {
                this.provideNonDebugHoverScheduler.cancel();
                const hoverDomNode = this.hoverWidget.getDomNode();
                if (!hoverDomNode) {
                    return;
                }
                const rect = hoverDomNode.getBoundingClientRect();
                // Only hide the hover widget if the editor mouse leave event is outside the hover widget #3528
                if (e.event.posx < rect.left || e.event.posx > rect.right || e.event.posy < rect.top || e.event.posy > rect.bottom) {
                    this.hideHoverWidget();
                }
            }));
            this.toDispose.push(this.editor.onKeyDown((e) => this.onKeyDown(e)));
            this.toDispose.push(this.editor.onDidChangeModelContent(() => {
                this.wordToLineNumbersMap = undefined;
                this.updateInlineValuesScheduler.schedule();
            }));
            this.toDispose.push(this.editor.onDidChangeModel(async () => {
                const stackFrame = this.debugService.getViewModel().focusedStackFrame;
                const model = this.editor.getModel();
                if (model) {
                    this._applyHoverConfiguration(model, stackFrame);
                }
                this.toggleExceptionWidget();
                this.hideHoverWidget();
                this.updateConfigurationWidgetVisibility();
                this.wordToLineNumbersMap = undefined;
                await this.updateInlineValueDecorations(stackFrame);
            }));
            this.toDispose.push(this.editor.onDidScrollChange(() => this.hideHoverWidget));
            this.toDispose.push(this.debugService.onDidChangeState((state) => {
                if (state !== 2 /* Stopped */) {
                    this.toggleExceptionWidget();
                }
            }));
        }
        _applyHoverConfiguration(model, stackFrame) {
            if (stackFrame && model.uri.toString() === stackFrame.source.uri.toString()) {
                this.editor.updateOptions({
                    hover: {
                        enabled: false
                    }
                });
            }
            else {
                let overrides = {
                    resource: model.uri,
                    overrideIdentifier: model.getLanguageIdentifier().language
                };
                const defaultConfiguration = this.configurationService.getValue('editor.hover', overrides);
                this.editor.updateOptions({
                    hover: {
                        enabled: defaultConfiguration.enabled,
                        delay: defaultConfiguration.delay,
                        sticky: defaultConfiguration.sticky
                    }
                });
            }
        }
        async showHover(range, focus) {
            const sf = this.debugService.getViewModel().focusedStackFrame;
            const model = this.editor.getModel();
            if (sf && model && sf.source.uri.toString() === model.uri.toString()) {
                return this.hoverWidget.showAt(range, focus);
            }
        }
        async onFocusStackFrame(sf) {
            const model = this.editor.getModel();
            if (model) {
                this._applyHoverConfiguration(model, sf);
                if (sf && sf.source.uri.toString() === model.uri.toString()) {
                    await this.toggleExceptionWidget();
                }
                else {
                    this.hideHoverWidget();
                }
            }
            await this.updateInlineValueDecorations(sf);
        }
        get showHoverScheduler() {
            const scheduler = new async_1.RunOnceScheduler(() => {
                if (this.hoverRange) {
                    this.showHover(this.hoverRange, false);
                }
            }, HOVER_DELAY);
            this.toDispose.push(scheduler);
            return scheduler;
        }
        get hideHoverScheduler() {
            const scheduler = new async_1.RunOnceScheduler(() => {
                if (!this.hoverWidget.isHovered()) {
                    this.hoverWidget.hide();
                }
            }, 2 * HOVER_DELAY);
            this.toDispose.push(scheduler);
            return scheduler;
        }
        get provideNonDebugHoverScheduler() {
            const scheduler = new async_1.RunOnceScheduler(() => {
                if (this.editor.hasModel() && this.nonDebugHoverPosition) {
                    getHover_1.getHover(this.editor.getModel(), this.nonDebugHoverPosition, cancellation_1.CancellationToken.None);
                }
            }, HOVER_DELAY);
            this.toDispose.push(scheduler);
            return scheduler;
        }
        hideHoverWidget() {
            if (!this.hideHoverScheduler.isScheduled() && this.hoverWidget.isVisible()) {
                this.hideHoverScheduler.schedule();
            }
            this.showHoverScheduler.cancel();
            this.provideNonDebugHoverScheduler.cancel();
        }
        // hover business
        onEditorMouseDown(mouseEvent) {
            this.mouseDown = true;
            if (mouseEvent.target.type === 9 /* CONTENT_WIDGET */ && mouseEvent.target.detail === debugHover_1.DebugHoverWidget.ID) {
                return;
            }
            this.hideHoverWidget();
        }
        onEditorMouseMove(mouseEvent) {
            if (this.debugService.state !== 2 /* Stopped */) {
                return;
            }
            if (this.configurationService.getValue('debug').enableAllHovers && mouseEvent.target.position) {
                this.nonDebugHoverPosition = mouseEvent.target.position;
                this.provideNonDebugHoverScheduler.schedule();
            }
            const targetType = mouseEvent.target.type;
            const stopKey = env.isMacintosh ? 'metaKey' : 'ctrlKey';
            if (targetType === 9 /* CONTENT_WIDGET */ && mouseEvent.target.detail === debugHover_1.DebugHoverWidget.ID && !mouseEvent.event[stopKey]) {
                // mouse moved on top of debug hover widget
                return;
            }
            if (targetType === 6 /* CONTENT_TEXT */) {
                if (mouseEvent.target.range && !mouseEvent.target.range.equalsRange(this.hoverRange)) {
                    this.hoverRange = mouseEvent.target.range;
                    this.showHoverScheduler.schedule();
                }
            }
            else if (!this.mouseDown) {
                // Do not hide debug hover when the mouse is pressed because it usually leads to accidental closing #64620
                this.hideHoverWidget();
            }
        }
        onKeyDown(e) {
            const stopKey = env.isMacintosh ? 57 /* Meta */ : 5 /* Ctrl */;
            if (e.keyCode !== stopKey) {
                // do not hide hover when Ctrl/Meta is pressed
                this.hideHoverWidget();
            }
        }
        // end hover business
        // exception widget
        async toggleExceptionWidget() {
            // Toggles exception widget based on the state of the current editor model and debug stack frame
            const model = this.editor.getModel();
            const focusedSf = this.debugService.getViewModel().focusedStackFrame;
            const callStack = focusedSf ? focusedSf.thread.getCallStack() : null;
            if (!model || !focusedSf || !callStack || callStack.length === 0) {
                this.closeExceptionWidget();
                return;
            }
            // First call stack frame that is available is the frame where exception has been thrown
            const exceptionSf = arrays_1.first(callStack, sf => !!(sf && sf.source && sf.source.available && sf.source.presentationHint !== 'deemphasize'), undefined);
            if (!exceptionSf || exceptionSf !== focusedSf) {
                this.closeExceptionWidget();
                return;
            }
            const sameUri = exceptionSf.source.uri.toString() === model.uri.toString();
            if (this.exceptionWidget && !sameUri) {
                this.closeExceptionWidget();
            }
            else if (sameUri) {
                const exceptionInfo = await focusedSf.thread.exceptionInfo;
                if (exceptionInfo && exceptionSf.range.startLineNumber && exceptionSf.range.startColumn) {
                    this.showExceptionWidget(exceptionInfo, this.debugService.getViewModel().focusedSession, exceptionSf.range.startLineNumber, exceptionSf.range.startColumn);
                }
            }
        }
        showExceptionWidget(exceptionInfo, debugSession, lineNumber, column) {
            if (this.exceptionWidget) {
                this.exceptionWidget.dispose();
            }
            this.exceptionWidget = this.instantiationService.createInstance(exceptionWidget_1.ExceptionWidget, this.editor, exceptionInfo, debugSession);
            this.exceptionWidget.show({ lineNumber, column }, 0);
            this.editor.revealLine(lineNumber);
        }
        closeExceptionWidget() {
            if (this.exceptionWidget) {
                this.exceptionWidget.dispose();
                this.exceptionWidget = undefined;
            }
        }
        // configuration widget
        updateConfigurationWidgetVisibility() {
            const model = this.editor.getModel();
            if (this.configurationWidget) {
                this.configurationWidget.dispose();
            }
            if (model && LAUNCH_JSON_REGEX.test(model.uri.toString()) && !this.editor.getOption(64 /* readOnly */)) {
                this.configurationWidget = this.instantiationService.createInstance(editorWidgets_1.FloatingClickWidget, this.editor, nls.localize('addConfiguration', "Add Configuration..."), null);
                this.configurationWidget.render();
                this.toDispose.push(this.configurationWidget.onClick(() => this.addLaunchConfiguration()));
            }
        }
        async addLaunchConfiguration() {
            /* __GDPR__
                "debug/addLaunchConfiguration" : {}
            */
            this.telemetryService.publicLog('debug/addLaunchConfiguration');
            let configurationsArrayPosition;
            const model = this.editor.getModel();
            if (!model) {
                return;
            }
            let depthInArray = 0;
            let lastProperty;
            json_1.visit(model.getValue(), {
                onObjectProperty: (property, offset, length) => {
                    lastProperty = property;
                },
                onArrayBegin: (offset, length) => {
                    if (lastProperty === 'configurations' && depthInArray === 0) {
                        configurationsArrayPosition = model.getPositionAt(offset + 1);
                    }
                    depthInArray++;
                },
                onArrayEnd: () => {
                    depthInArray--;
                }
            });
            this.editor.focus();
            if (!configurationsArrayPosition) {
                return;
            }
            const insertLine = (position) => {
                // Check if there are more characters on a line after a "configurations": [, if yes enter a newline
                if (model.getLineLastNonWhitespaceColumn(position.lineNumber) > position.column) {
                    this.editor.setPosition(position);
                    coreCommands_1.CoreEditingCommands.LineBreakInsert.runEditorCommand(null, this.editor, null);
                }
                this.editor.setPosition(position);
                return this.commandService.executeCommand('editor.action.insertLineAfter');
            };
            await insertLine(configurationsArrayPosition);
            await this.commandService.executeCommand('editor.action.triggerSuggest');
        }
        // Inline Decorations
        get removeInlineValuesScheduler() {
            return new async_1.RunOnceScheduler(() => this.editor.removeDecorations(INLINE_VALUE_DECORATION_KEY), 100);
        }
        get updateInlineValuesScheduler() {
            return new async_1.RunOnceScheduler(async () => await this.updateInlineValueDecorations(this.debugService.getViewModel().focusedStackFrame), 200);
        }
        async updateInlineValueDecorations(stackFrame) {
            const model = this.editor.getModel();
            if (!this.configurationService.getValue('debug').inlineValues ||
                !model || !stackFrame || model.uri.toString() !== stackFrame.source.uri.toString()) {
                if (!this.removeInlineValuesScheduler.isScheduled()) {
                    this.removeInlineValuesScheduler.schedule();
                }
                return;
            }
            this.removeInlineValuesScheduler.cancel();
            const scopes = await stackFrame.getMostSpecificScopes(stackFrame.range);
            // Get all top level children in the scope chain
            const decorationsPerScope = await Promise.all(scopes.map(async (scope) => {
                const children = await scope.getChildren();
                let range = new range_1.Range(0, 0, stackFrame.range.startLineNumber, stackFrame.range.startColumn);
                if (scope.range) {
                    range = range.setStartPosition(scope.range.startLineNumber, scope.range.startColumn);
                }
                return this.createInlineValueDecorationsInsideRange(children, range, model);
            }));
            const allDecorations = decorationsPerScope.reduce((previous, current) => previous.concat(current), []);
            this.editor.setDecorations(INLINE_VALUE_DECORATION_KEY, allDecorations);
        }
        createInlineValueDecorationsInsideRange(expressions, range, model) {
            const nameValueMap = new Map();
            for (let expr of expressions) {
                nameValueMap.set(expr.name, expr.value);
                // Limit the size of map. Too large can have a perf impact
                if (nameValueMap.size >= MAX_NUM_INLINE_VALUES) {
                    break;
                }
            }
            const lineToNamesMap = new Map();
            const wordToPositionsMap = this.getWordToPositionsMap();
            // Compute unique set of names on each line
            nameValueMap.forEach((value, name) => {
                const positions = wordToPositionsMap.get(name);
                if (positions) {
                    for (let position of positions) {
                        if (range.containsPosition(position)) {
                            if (!lineToNamesMap.has(position.lineNumber)) {
                                lineToNamesMap.set(position.lineNumber, []);
                            }
                            if (lineToNamesMap.get(position.lineNumber).indexOf(name) === -1) {
                                lineToNamesMap.get(position.lineNumber).push(name);
                            }
                        }
                    }
                }
            });
            const decorations = [];
            // Compute decorators for each line
            lineToNamesMap.forEach((names, line) => {
                const contentText = names.sort((first, second) => {
                    const content = model.getLineContent(line);
                    return content.indexOf(first) - content.indexOf(second);
                }).map(name => `${name} = ${nameValueMap.get(name)}`).join(', ');
                decorations.push(this.createInlineValueDecoration(line, contentText));
            });
            return decorations;
        }
        createInlineValueDecoration(lineNumber, contentText) {
            // If decoratorText is too long, trim and add ellipses. This could happen for minified files with everything on a single line
            if (contentText.length > MAX_INLINE_DECORATOR_LENGTH) {
                contentText = contentText.substr(0, MAX_INLINE_DECORATOR_LENGTH) + '...';
            }
            return {
                range: {
                    startLineNumber: lineNumber,
                    endLineNumber: lineNumber,
                    startColumn: 1073741824 /* MAX_SAFE_SMALL_INTEGER */,
                    endColumn: 1073741824 /* MAX_SAFE_SMALL_INTEGER */
                },
                renderOptions: {
                    after: {
                        contentText,
                        backgroundColor: 'rgba(255, 200, 0, 0.2)',
                        margin: '10px'
                    },
                    dark: {
                        after: {
                            color: 'rgba(255, 255, 255, 0.5)',
                        }
                    },
                    light: {
                        after: {
                            color: 'rgba(0, 0, 0, 0.5)',
                        }
                    }
                }
            };
        }
        getWordToPositionsMap() {
            if (!this.wordToLineNumbersMap) {
                this.wordToLineNumbersMap = new Map();
                const model = this.editor.getModel();
                if (!model) {
                    return this.wordToLineNumbersMap;
                }
                // For every word in every line, map its ranges for fast lookup
                for (let lineNumber = 1, len = model.getLineCount(); lineNumber <= len; ++lineNumber) {
                    const lineContent = model.getLineContent(lineNumber);
                    // If line is too long then skip the line
                    if (lineContent.length > MAX_TOKENIZATION_LINE_LEN) {
                        continue;
                    }
                    model.forceTokenization(lineNumber);
                    const lineTokens = model.getLineTokens(lineNumber);
                    for (let tokenIndex = 0, tokenCount = lineTokens.getCount(); tokenIndex < tokenCount; tokenIndex++) {
                        const tokenStartOffset = lineTokens.getStartOffset(tokenIndex);
                        const tokenEndOffset = lineTokens.getEndOffset(tokenIndex);
                        const tokenType = lineTokens.getStandardTokenType(tokenIndex);
                        const tokenStr = lineContent.substring(tokenStartOffset, tokenEndOffset);
                        // Token is a word and not a comment
                        if (tokenType === 0 /* Other */) {
                            wordHelper_1.DEFAULT_WORD_REGEXP.lastIndex = 0; // We assume tokens will usually map 1:1 to words if they match
                            const wordMatch = wordHelper_1.DEFAULT_WORD_REGEXP.exec(tokenStr);
                            if (wordMatch) {
                                const word = wordMatch[0];
                                if (!this.wordToLineNumbersMap.has(word)) {
                                    this.wordToLineNumbersMap.set(word, []);
                                }
                                this.wordToLineNumbersMap.get(word).push(new position_1.Position(lineNumber, tokenStartOffset));
                            }
                        }
                    }
                }
            }
            return this.wordToLineNumbersMap;
        }
        dispose() {
            if (this.hoverWidget) {
                this.hoverWidget.dispose();
            }
            if (this.configurationWidget) {
                this.configurationWidget.dispose();
            }
            this.toDispose = lifecycle_1.dispose(this.toDispose);
        }
    };
    __decorate([
        decorators_1.memoize
    ], DebugEditorContribution.prototype, "showHoverScheduler", null);
    __decorate([
        decorators_1.memoize
    ], DebugEditorContribution.prototype, "hideHoverScheduler", null);
    __decorate([
        decorators_1.memoize
    ], DebugEditorContribution.prototype, "provideNonDebugHoverScheduler", null);
    __decorate([
        decorators_1.memoize
    ], DebugEditorContribution.prototype, "removeInlineValuesScheduler", null);
    __decorate([
        decorators_1.memoize
    ], DebugEditorContribution.prototype, "updateInlineValuesScheduler", null);
    DebugEditorContribution = __decorate([
        __param(1, debug_1.IDebugService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, commands_1.ICommandService),
        __param(4, codeEditorService_1.ICodeEditorService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, configuration_1.IConfigurationService)
    ], DebugEditorContribution);
    editorExtensions_1.registerEditorContribution(debug_1.EDITOR_CONTRIBUTION_ID, DebugEditorContribution);
});
//# sourceMappingURL=debugEditorContribution.js.map