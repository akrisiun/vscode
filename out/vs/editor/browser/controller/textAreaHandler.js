/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/browser/browser", "vs/base/browser/fastDomNode", "vs/base/common/platform", "vs/base/common/strings", "vs/editor/browser/config/configuration", "vs/editor/browser/controller/textAreaInput", "vs/editor/browser/controller/textAreaState", "vs/editor/browser/view/viewPart", "vs/editor/browser/viewParts/lineNumbers/lineNumbers", "vs/editor/browser/viewParts/margin/margin", "vs/editor/common/controller/wordCharacterClassifier", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/view/viewEvents", "vs/css!./textAreaHandler"], function (require, exports, nls, browser, fastDomNode_1, platform, strings, configuration_1, textAreaInput_1, textAreaState_1, viewPart_1, lineNumbers_1, margin_1, wordCharacterClassifier_1, position_1, range_1, selection_1, viewEvents) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class VisibleTextAreaData {
        constructor(top, left, width) {
            this.top = top;
            this.left = left;
            this.width = width;
        }
        setWidth(width) {
            return new VisibleTextAreaData(this.top, this.left, width);
        }
    }
    const canUseZeroSizeTextarea = (browser.isEdgeOrIE || browser.isFirefox);
    /**
     * Every time we write to the clipboard, we record a bit of extra metadata here.
     * Every time we read from the cipboard, if the text matches our last written text,
     * we can fetch the previous metadata.
     */
    class LocalClipboardMetadataManager {
        constructor() {
            this._lastState = null;
        }
        set(state) {
            this._lastState = state;
        }
        get(pastedText) {
            if (this._lastState && this._lastState.lastCopiedValue === pastedText) {
                // match!
                return this._lastState;
            }
            this._lastState = null;
            return null;
        }
    }
    LocalClipboardMetadataManager.INSTANCE = new LocalClipboardMetadataManager();
    class TextAreaHandler extends viewPart_1.ViewPart {
        constructor(context, viewController, viewHelper) {
            super(context);
            // --- end view API
            this._primaryCursorVisibleRange = null;
            this._viewController = viewController;
            this._viewHelper = viewHelper;
            this._scrollLeft = 0;
            this._scrollTop = 0;
            const options = this._context.configuration.options;
            const layoutInfo = options.get(101 /* layoutInfo */);
            this._accessibilitySupport = options.get(2 /* accessibilitySupport */);
            this._contentLeft = layoutInfo.contentLeft;
            this._contentWidth = layoutInfo.contentWidth;
            this._contentHeight = layoutInfo.contentHeight;
            this._fontInfo = options.get(30 /* fontInfo */);
            this._lineHeight = options.get(45 /* lineHeight */);
            this._emptySelectionClipboard = options.get(22 /* emptySelectionClipboard */);
            this._copyWithSyntaxHighlighting = options.get(13 /* copyWithSyntaxHighlighting */);
            this._visibleTextArea = null;
            this._selections = [new selection_1.Selection(1, 1, 1, 1)];
            // Text Area (The focus will always be in the textarea when the cursor is blinking)
            this.textArea = fastDomNode_1.createFastDomNode(document.createElement('textarea'));
            viewPart_1.PartFingerprints.write(this.textArea, 6 /* TextArea */);
            this.textArea.setClassName('inputarea');
            this.textArea.setAttribute('wrap', 'off');
            this.textArea.setAttribute('autocorrect', 'off');
            this.textArea.setAttribute('autocapitalize', 'off');
            this.textArea.setAttribute('autocomplete', 'off');
            this.textArea.setAttribute('spellcheck', 'false');
            this.textArea.setAttribute('aria-label', this._getAriaLabel(options));
            this.textArea.setAttribute('role', 'textbox');
            this.textArea.setAttribute('aria-multiline', 'true');
            this.textArea.setAttribute('aria-haspopup', 'false');
            this.textArea.setAttribute('aria-autocomplete', 'both');
            if (platform.isWeb && options.get(63 /* readOnly */)) {
                this.textArea.setAttribute('readonly', 'true');
            }
            this.textAreaCover = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this.textAreaCover.setPosition('absolute');
            const simpleModel = {
                getLineCount: () => {
                    return this._context.model.getLineCount();
                },
                getLineMaxColumn: (lineNumber) => {
                    return this._context.model.getLineMaxColumn(lineNumber);
                },
                getValueInRange: (range, eol) => {
                    return this._context.model.getValueInRange(range, eol);
                }
            };
            const textAreaInputHost = {
                getPlainTextToCopy: () => {
                    const rawWhatToCopy = this._context.model.getPlainTextToCopy(this._selections, this._emptySelectionClipboard, platform.isWindows);
                    const newLineCharacter = this._context.model.getEOL();
                    const isFromEmptySelection = (this._emptySelectionClipboard && this._selections.length === 1 && this._selections[0].isEmpty());
                    const multicursorText = (Array.isArray(rawWhatToCopy) ? rawWhatToCopy : null);
                    const whatToCopy = (Array.isArray(rawWhatToCopy) ? rawWhatToCopy.join(newLineCharacter) : rawWhatToCopy);
                    let metadata = null;
                    if (isFromEmptySelection || multicursorText) {
                        // Only store the non-default metadata
                        // When writing "LINE\r\n" to the clipboard and then pasting,
                        // Firefox pastes "LINE\n", so let's work around this quirk
                        const lastCopiedValue = (browser.isFirefox ? whatToCopy.replace(/\r\n/g, '\n') : whatToCopy);
                        metadata = {
                            lastCopiedValue: lastCopiedValue,
                            isFromEmptySelection: (this._emptySelectionClipboard && this._selections.length === 1 && this._selections[0].isEmpty()),
                            multicursorText: multicursorText
                        };
                    }
                    LocalClipboardMetadataManager.INSTANCE.set(metadata);
                    return whatToCopy;
                },
                getHTMLToCopy: () => {
                    if (!this._copyWithSyntaxHighlighting && !textAreaInput_1.CopyOptions.forceCopyWithSyntaxHighlighting) {
                        return null;
                    }
                    return this._context.model.getHTMLToCopy(this._selections, this._emptySelectionClipboard);
                },
                getScreenReaderContent: (currentState) => {
                    if (browser.isIPad) {
                        // Do not place anything in the textarea for the iPad
                        return textAreaState_1.TextAreaState.EMPTY;
                    }
                    if (this._accessibilitySupport === 1 /* Disabled */) {
                        // We know for a fact that a screen reader is not attached
                        // On OSX, we write the character before the cursor to allow for "long-press" composition
                        // Also on OSX, we write the word before the cursor to allow for the Accessibility Keyboard to give good hints
                        if (platform.isMacintosh) {
                            const selection = this._selections[0];
                            if (selection.isEmpty()) {
                                const position = selection.getStartPosition();
                                let textBefore = this._getWordBeforePosition(position);
                                if (textBefore.length === 0) {
                                    textBefore = this._getCharacterBeforePosition(position);
                                }
                                if (textBefore.length > 0) {
                                    return new textAreaState_1.TextAreaState(textBefore, textBefore.length, textBefore.length, position, position);
                                }
                            }
                        }
                        return textAreaState_1.TextAreaState.EMPTY;
                    }
                    return textAreaState_1.PagedScreenReaderStrategy.fromEditorSelection(currentState, simpleModel, this._selections[0], this._accessibilitySupport === 0 /* Unknown */);
                },
                deduceModelPosition: (viewAnchorPosition, deltaOffset, lineFeedCnt) => {
                    return this._context.model.deduceModelPositionRelativeToViewPosition(viewAnchorPosition, deltaOffset, lineFeedCnt);
                }
            };
            this._textAreaInput = this._register(new textAreaInput_1.TextAreaInput(textAreaInputHost, this.textArea));
            this._register(this._textAreaInput.onKeyDown((e) => {
                this._viewController.emitKeyDown(e);
            }));
            this._register(this._textAreaInput.onKeyUp((e) => {
                this._viewController.emitKeyUp(e);
            }));
            this._register(this._textAreaInput.onPaste((e) => {
                const metadata = LocalClipboardMetadataManager.INSTANCE.get(e.text);
                let pasteOnNewLine = false;
                let multicursorText = null;
                if (metadata) {
                    pasteOnNewLine = (this._emptySelectionClipboard && metadata.isFromEmptySelection);
                    multicursorText = metadata.multicursorText;
                }
                this._viewController.paste('keyboard', e.text, pasteOnNewLine, multicursorText);
            }));
            this._register(this._textAreaInput.onCut(() => {
                this._viewController.cut('keyboard');
            }));
            this._register(this._textAreaInput.onType((e) => {
                if (e.replaceCharCnt) {
                    this._viewController.replacePreviousChar('keyboard', e.text, e.replaceCharCnt);
                }
                else {
                    this._viewController.type('keyboard', e.text);
                }
            }));
            this._register(this._textAreaInput.onSelectionChangeRequest((modelSelection) => {
                this._viewController.setSelection('keyboard', modelSelection);
            }));
            this._register(this._textAreaInput.onCompositionStart(() => {
                const lineNumber = this._selections[0].startLineNumber;
                const column = this._selections[0].startColumn;
                this._context.privateViewEventBus.emit(new viewEvents.ViewRevealRangeRequestEvent('keyboard', new range_1.Range(lineNumber, column, lineNumber, column), 0 /* Simple */, true, 1 /* Immediate */));
                // Find range pixel position
                const visibleRange = this._viewHelper.visibleRangeForPositionRelativeToEditor(lineNumber, column);
                if (visibleRange) {
                    this._visibleTextArea = new VisibleTextAreaData(this._context.viewLayout.getVerticalOffsetForLineNumber(lineNumber), visibleRange.left, canUseZeroSizeTextarea ? 0 : 1);
                    this._render();
                }
                // Show the textarea
                this.textArea.setClassName('inputarea ime-input');
                this._viewController.compositionStart('keyboard');
            }));
            this._register(this._textAreaInput.onCompositionUpdate((e) => {
                if (browser.isEdgeOrIE) {
                    // Due to isEdgeOrIE (where the textarea was not cleared initially)
                    // we cannot assume the text consists only of the composited text
                    this._visibleTextArea = this._visibleTextArea.setWidth(0);
                }
                else {
                    // adjust width by its size
                    this._visibleTextArea = this._visibleTextArea.setWidth(measureText(e.data, this._fontInfo));
                }
                this._render();
            }));
            this._register(this._textAreaInput.onCompositionEnd(() => {
                this._visibleTextArea = null;
                this._render();
                this.textArea.setClassName('inputarea');
                this._viewController.compositionEnd('keyboard');
            }));
            this._register(this._textAreaInput.onFocus(() => {
                this._context.privateViewEventBus.emit(new viewEvents.ViewFocusChangedEvent(true));
            }));
            this._register(this._textAreaInput.onBlur(() => {
                this._context.privateViewEventBus.emit(new viewEvents.ViewFocusChangedEvent(false));
            }));
        }
        dispose() {
            super.dispose();
        }
        _getWordBeforePosition(position) {
            const lineContent = this._context.model.getLineContent(position.lineNumber);
            const wordSeparators = wordCharacterClassifier_1.getMapForWordSeparators(this._context.configuration.options.get(90 /* wordSeparators */));
            let column = position.column;
            let distance = 0;
            while (column > 1) {
                const charCode = lineContent.charCodeAt(column - 2);
                const charClass = wordSeparators.get(charCode);
                if (charClass !== 0 /* Regular */ || distance > 50) {
                    return lineContent.substring(column - 1, position.column - 1);
                }
                distance++;
                column--;
            }
            return lineContent.substring(0, position.column - 1);
        }
        _getCharacterBeforePosition(position) {
            if (position.column > 1) {
                const lineContent = this._context.model.getLineContent(position.lineNumber);
                const charBefore = lineContent.charAt(position.column - 2);
                if (!strings.isHighSurrogate(charBefore.charCodeAt(0))) {
                    return charBefore;
                }
            }
            return '';
        }
        _getAriaLabel(options) {
            const accessibilitySupport = options.get(2 /* accessibilitySupport */);
            if (accessibilitySupport === 1 /* Disabled */) {
                return nls.localize('accessibilityOffAriaLabel', "The editor is not accessible at this time. Press Alt+F1 for options.");
            }
            return options.get(3 /* ariaLabel */);
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            const layoutInfo = options.get(101 /* layoutInfo */);
            this._accessibilitySupport = options.get(2 /* accessibilitySupport */);
            this._contentLeft = layoutInfo.contentLeft;
            this._contentWidth = layoutInfo.contentWidth;
            this._contentHeight = layoutInfo.contentHeight;
            this._fontInfo = options.get(30 /* fontInfo */);
            this._lineHeight = options.get(45 /* lineHeight */);
            this._emptySelectionClipboard = options.get(22 /* emptySelectionClipboard */);
            this._copyWithSyntaxHighlighting = options.get(13 /* copyWithSyntaxHighlighting */);
            this.textArea.setAttribute('aria-label', this._getAriaLabel(options));
            if (platform.isWeb && e.hasChanged(63 /* readOnly */)) {
                if (options.get(63 /* readOnly */)) {
                    this.textArea.setAttribute('readonly', 'true');
                }
                else {
                    this.textArea.removeAttribute('readonly');
                }
            }
            if (e.hasChanged(2 /* accessibilitySupport */)) {
                this._textAreaInput.writeScreenReaderContent('strategy changed');
            }
            return true;
        }
        onCursorStateChanged(e) {
            this._selections = e.selections.slice(0);
            this._textAreaInput.writeScreenReaderContent('selection changed');
            return true;
        }
        onDecorationsChanged(e) {
            // true for inline decorations that can end up relayouting text
            return true;
        }
        onFlushed(e) {
            return true;
        }
        onLinesChanged(e) {
            return true;
        }
        onLinesDeleted(e) {
            return true;
        }
        onLinesInserted(e) {
            return true;
        }
        onScrollChanged(e) {
            this._scrollLeft = e.scrollLeft;
            this._scrollTop = e.scrollTop;
            return true;
        }
        onZonesChanged(e) {
            return true;
        }
        // --- end event handlers
        // --- begin view API
        isFocused() {
            return this._textAreaInput.isFocused();
        }
        focusTextArea() {
            this._textAreaInput.focusTextArea();
        }
        prepareRender(ctx) {
            const primaryCursorPosition = new position_1.Position(this._selections[0].positionLineNumber, this._selections[0].positionColumn);
            this._primaryCursorVisibleRange = ctx.visibleRangeForPosition(primaryCursorPosition);
        }
        render(ctx) {
            this._textAreaInput.writeScreenReaderContent('render');
            this._render();
        }
        _render() {
            if (this._visibleTextArea) {
                // The text area is visible for composition reasons
                this._renderInsideEditor(this._visibleTextArea.top - this._scrollTop, this._contentLeft + this._visibleTextArea.left - this._scrollLeft, this._visibleTextArea.width, this._lineHeight, true);
                return;
            }
            if (!this._primaryCursorVisibleRange) {
                // The primary cursor is outside the viewport => place textarea to the top left
                this._renderAtTopLeft();
                return;
            }
            const left = this._contentLeft + this._primaryCursorVisibleRange.left - this._scrollLeft;
            if (left < this._contentLeft || left > this._contentLeft + this._contentWidth) {
                // cursor is outside the viewport
                this._renderAtTopLeft();
                return;
            }
            const top = this._context.viewLayout.getVerticalOffsetForLineNumber(this._selections[0].positionLineNumber) - this._scrollTop;
            if (top < 0 || top > this._contentHeight) {
                // cursor is outside the viewport
                this._renderAtTopLeft();
                return;
            }
            // The primary cursor is in the viewport (at least vertically) => place textarea on the cursor
            this._renderInsideEditor(top, left, canUseZeroSizeTextarea ? 0 : 1, canUseZeroSizeTextarea ? 0 : 1, false);
        }
        _renderInsideEditor(top, left, width, height, useEditorFont) {
            const ta = this.textArea;
            const tac = this.textAreaCover;
            if (useEditorFont) {
                configuration_1.Configuration.applyFontInfo(ta, this._fontInfo);
            }
            else {
                ta.setFontSize(1);
                ta.setLineHeight(this._fontInfo.lineHeight);
            }
            ta.setTop(top);
            ta.setLeft(left);
            ta.setWidth(width);
            ta.setHeight(height);
            tac.setTop(0);
            tac.setLeft(0);
            tac.setWidth(0);
            tac.setHeight(0);
        }
        _renderAtTopLeft() {
            const ta = this.textArea;
            const tac = this.textAreaCover;
            configuration_1.Configuration.applyFontInfo(ta, this._fontInfo);
            ta.setTop(0);
            ta.setLeft(0);
            tac.setTop(0);
            tac.setLeft(0);
            if (canUseZeroSizeTextarea) {
                ta.setWidth(0);
                ta.setHeight(0);
                tac.setWidth(0);
                tac.setHeight(0);
                return;
            }
            // (in WebKit the textarea is 1px by 1px because it cannot handle input to a 0x0 textarea)
            // specifically, when doing Korean IME, setting the textarea to 0x0 breaks IME badly.
            ta.setWidth(1);
            ta.setHeight(1);
            tac.setWidth(1);
            tac.setHeight(1);
            const options = this._context.configuration.options;
            if (options.get(36 /* glyphMargin */)) {
                tac.setClassName('monaco-editor-background textAreaCover ' + margin_1.Margin.OUTER_CLASS_NAME);
            }
            else {
                if (options.get(46 /* lineNumbers */).renderType !== 0 /* Off */) {
                    tac.setClassName('monaco-editor-background textAreaCover ' + lineNumbers_1.LineNumbersOverlay.CLASS_NAME);
                }
                else {
                    tac.setClassName('monaco-editor-background textAreaCover');
                }
            }
        }
    }
    exports.TextAreaHandler = TextAreaHandler;
    function measureText(text, fontInfo) {
        // adjust width by its size
        const canvasElem = document.createElement('canvas');
        const context = canvasElem.getContext('2d');
        context.font = createFontString(fontInfo);
        const metrics = context.measureText(text);
        if (browser.isFirefox) {
            return metrics.width + 2; // +2 for Japanese...
        }
        else {
            return metrics.width;
        }
    }
    function createFontString(bareFontInfo) {
        return doCreateFontString('normal', bareFontInfo.fontWeight, bareFontInfo.fontSize, bareFontInfo.lineHeight, bareFontInfo.fontFamily);
    }
    function doCreateFontString(fontStyle, fontWeight, fontSize, lineHeight, fontFamily) {
        // The full font syntax is:
        // style | variant | weight | stretch | size/line-height | fontFamily
        // (https://developer.mozilla.org/en-US/docs/Web/CSS/font)
        // But it appears Edge and IE11 cannot properly parse `stretch`.
        return `${fontStyle} normal ${fontWeight} ${fontSize}px / ${lineHeight}px ${fontFamily}`;
    }
});
//# sourceMappingURL=textAreaHandler.js.map