/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/controller/coreCommands", "vs/editor/common/core/position", "vs/base/common/platform"], function (require, exports, coreCommands_1, position_1, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ViewController {
        constructor(configuration, viewModel, outgoingEvents, commandDelegate) {
            this.configuration = configuration;
            this.viewModel = viewModel;
            this.outgoingEvents = outgoingEvents;
            this.commandDelegate = commandDelegate;
        }
        _execMouseCommand(editorCommand, args) {
            args.source = 'mouse';
            this.commandDelegate.executeEditorCommand(editorCommand, args);
        }
        paste(source, text, pasteOnNewLine, multicursorText) {
            this.commandDelegate.paste(source, text, pasteOnNewLine, multicursorText);
        }
        type(source, text) {
            this.commandDelegate.type(source, text);
        }
        replacePreviousChar(source, text, replaceCharCnt) {
            this.commandDelegate.replacePreviousChar(source, text, replaceCharCnt);
        }
        compositionStart(source) {
            this.commandDelegate.compositionStart(source);
        }
        compositionEnd(source) {
            this.commandDelegate.compositionEnd(source);
        }
        cut(source) {
            this.commandDelegate.cut(source);
        }
        setSelection(source, modelSelection) {
            this.commandDelegate.executeEditorCommand(coreCommands_1.CoreNavigationCommands.SetSelection, {
                source: source,
                selection: modelSelection
            });
        }
        _validateViewColumn(viewPosition) {
            const minColumn = this.viewModel.getLineMinColumn(viewPosition.lineNumber);
            if (viewPosition.column < minColumn) {
                return new position_1.Position(viewPosition.lineNumber, minColumn);
            }
            return viewPosition;
        }
        _hasMulticursorModifier(data) {
            switch (this.configuration.options.get(56 /* multiCursorModifier */)) {
                case 'altKey':
                    return data.altKey;
                case 'ctrlKey':
                    return data.ctrlKey;
                case 'metaKey':
                    return data.metaKey;
            }
            return false;
        }
        _hasNonMulticursorModifier(data) {
            switch (this.configuration.options.get(56 /* multiCursorModifier */)) {
                case 'altKey':
                    return data.ctrlKey || data.metaKey;
                case 'ctrlKey':
                    return data.altKey || data.metaKey;
                case 'metaKey':
                    return data.ctrlKey || data.altKey;
            }
            return false;
        }
        dispatchMouse(data) {
            const selectionClipboardIsOn = (platform.isLinux && this.configuration.options.get(76 /* selectionClipboard */));
            if (data.middleButton && !selectionClipboardIsOn) {
                this._columnSelect(data.position, data.mouseColumn, data.inSelectionMode);
            }
            else if (data.startedOnLineNumbers) {
                // If the dragging started on the gutter, then have operations work on the entire line
                if (this._hasMulticursorModifier(data)) {
                    if (data.inSelectionMode) {
                        this._lastCursorLineSelect(data.position);
                    }
                    else {
                        this._createCursor(data.position, true);
                    }
                }
                else {
                    if (data.inSelectionMode) {
                        this._lineSelectDrag(data.position);
                    }
                    else {
                        this._lineSelect(data.position);
                    }
                }
            }
            else if (data.mouseDownCount >= 4) {
                this._selectAll();
            }
            else if (data.mouseDownCount === 3) {
                if (this._hasMulticursorModifier(data)) {
                    if (data.inSelectionMode) {
                        this._lastCursorLineSelectDrag(data.position);
                    }
                    else {
                        this._lastCursorLineSelect(data.position);
                    }
                }
                else {
                    if (data.inSelectionMode) {
                        this._lineSelectDrag(data.position);
                    }
                    else {
                        this._lineSelect(data.position);
                    }
                }
            }
            else if (data.mouseDownCount === 2) {
                if (this._hasMulticursorModifier(data)) {
                    this._lastCursorWordSelect(data.position);
                }
                else {
                    if (data.inSelectionMode) {
                        this._wordSelectDrag(data.position);
                    }
                    else {
                        this._wordSelect(data.position);
                    }
                }
            }
            else {
                if (this._hasMulticursorModifier(data)) {
                    if (!this._hasNonMulticursorModifier(data)) {
                        if (data.shiftKey) {
                            this._columnSelect(data.position, data.mouseColumn, true);
                        }
                        else {
                            // Do multi-cursor operations only when purely alt is pressed
                            if (data.inSelectionMode) {
                                this._lastCursorMoveToSelect(data.position);
                            }
                            else {
                                this._createCursor(data.position, false);
                            }
                        }
                    }
                }
                else {
                    if (data.inSelectionMode) {
                        if (data.altKey) {
                            this._columnSelect(data.position, data.mouseColumn, true);
                        }
                        else {
                            this._moveToSelect(data.position);
                        }
                    }
                    else {
                        this.moveTo(data.position);
                    }
                }
            }
        }
        _usualArgs(viewPosition) {
            viewPosition = this._validateViewColumn(viewPosition);
            return {
                position: this._convertViewToModelPosition(viewPosition),
                viewPosition: viewPosition
            };
        }
        moveTo(viewPosition) {
            this._execMouseCommand(coreCommands_1.CoreNavigationCommands.MoveTo, this._usualArgs(viewPosition));
        }
        _moveToSelect(viewPosition) {
            this._execMouseCommand(coreCommands_1.CoreNavigationCommands.MoveToSelect, this._usualArgs(viewPosition));
        }
        _columnSelect(viewPosition, mouseColumn, doColumnSelect) {
            viewPosition = this._validateViewColumn(viewPosition);
            this._execMouseCommand(coreCommands_1.CoreNavigationCommands.ColumnSelect, {
                position: this._convertViewToModelPosition(viewPosition),
                viewPosition: viewPosition,
                mouseColumn: mouseColumn,
                doColumnSelect: doColumnSelect
            });
        }
        _createCursor(viewPosition, wholeLine) {
            viewPosition = this._validateViewColumn(viewPosition);
            this._execMouseCommand(coreCommands_1.CoreNavigationCommands.CreateCursor, {
                position: this._convertViewToModelPosition(viewPosition),
                viewPosition: viewPosition,
                wholeLine: wholeLine
            });
        }
        _lastCursorMoveToSelect(viewPosition) {
            this._execMouseCommand(coreCommands_1.CoreNavigationCommands.LastCursorMoveToSelect, this._usualArgs(viewPosition));
        }
        _wordSelect(viewPosition) {
            this._execMouseCommand(coreCommands_1.CoreNavigationCommands.WordSelect, this._usualArgs(viewPosition));
        }
        _wordSelectDrag(viewPosition) {
            this._execMouseCommand(coreCommands_1.CoreNavigationCommands.WordSelectDrag, this._usualArgs(viewPosition));
        }
        _lastCursorWordSelect(viewPosition) {
            this._execMouseCommand(coreCommands_1.CoreNavigationCommands.LastCursorWordSelect, this._usualArgs(viewPosition));
        }
        _lineSelect(viewPosition) {
            this._execMouseCommand(coreCommands_1.CoreNavigationCommands.LineSelect, this._usualArgs(viewPosition));
        }
        _lineSelectDrag(viewPosition) {
            this._execMouseCommand(coreCommands_1.CoreNavigationCommands.LineSelectDrag, this._usualArgs(viewPosition));
        }
        _lastCursorLineSelect(viewPosition) {
            this._execMouseCommand(coreCommands_1.CoreNavigationCommands.LastCursorLineSelect, this._usualArgs(viewPosition));
        }
        _lastCursorLineSelectDrag(viewPosition) {
            this._execMouseCommand(coreCommands_1.CoreNavigationCommands.LastCursorLineSelectDrag, this._usualArgs(viewPosition));
        }
        _selectAll() {
            this._execMouseCommand(coreCommands_1.CoreNavigationCommands.SelectAll, {});
        }
        // ----------------------
        _convertViewToModelPosition(viewPosition) {
            return this.viewModel.coordinatesConverter.convertViewPositionToModelPosition(viewPosition);
        }
        emitKeyDown(e) {
            this.outgoingEvents.emitKeyDown(e);
        }
        emitKeyUp(e) {
            this.outgoingEvents.emitKeyUp(e);
        }
        emitContextMenu(e) {
            this.outgoingEvents.emitContextMenu(e);
        }
        emitMouseMove(e) {
            this.outgoingEvents.emitMouseMove(e);
        }
        emitMouseLeave(e) {
            this.outgoingEvents.emitMouseLeave(e);
        }
        emitMouseUp(e) {
            this.outgoingEvents.emitMouseUp(e);
        }
        emitMouseDown(e) {
            this.outgoingEvents.emitMouseDown(e);
        }
        emitMouseDrag(e) {
            this.outgoingEvents.emitMouseDrag(e);
        }
        emitMouseDrop(e) {
            this.outgoingEvents.emitMouseDrop(e);
        }
        emitMouseWheel(e) {
            this.outgoingEvents.emitMouseWheel(e);
        }
    }
    exports.ViewController = ViewController;
});
//# sourceMappingURL=viewController.js.map