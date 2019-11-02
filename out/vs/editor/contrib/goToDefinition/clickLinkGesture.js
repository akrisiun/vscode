/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/platform", "vs/css!./goToDefinitionAtPosition"], function (require, exports, browser, lifecycle_1, event_1, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function hasModifier(e, modifier) {
        return !!e[modifier];
    }
    /**
     * An event that encapsulates the various trigger modifiers logic needed for go to definition.
     */
    class ClickLinkMouseEvent {
        constructor(source, opts) {
            this.target = source.target;
            this.hasTriggerModifier = hasModifier(source.event, opts.triggerModifier);
            this.hasSideBySideModifier = hasModifier(source.event, opts.triggerSideBySideModifier);
            this.isNoneOrSingleMouseDown = (browser.isIE || source.event.detail <= 1); // IE does not support event.detail properly
        }
    }
    exports.ClickLinkMouseEvent = ClickLinkMouseEvent;
    /**
     * An event that encapsulates the various trigger modifiers logic needed for go to definition.
     */
    class ClickLinkKeyboardEvent {
        constructor(source, opts) {
            this.keyCodeIsTriggerKey = (source.keyCode === opts.triggerKey);
            this.keyCodeIsSideBySideKey = (source.keyCode === opts.triggerSideBySideKey);
            this.hasTriggerModifier = hasModifier(source, opts.triggerModifier);
        }
    }
    exports.ClickLinkKeyboardEvent = ClickLinkKeyboardEvent;
    class ClickLinkOptions {
        constructor(triggerKey, triggerModifier, triggerSideBySideKey, triggerSideBySideModifier) {
            this.triggerKey = triggerKey;
            this.triggerModifier = triggerModifier;
            this.triggerSideBySideKey = triggerSideBySideKey;
            this.triggerSideBySideModifier = triggerSideBySideModifier;
        }
        equals(other) {
            return (this.triggerKey === other.triggerKey
                && this.triggerModifier === other.triggerModifier
                && this.triggerSideBySideKey === other.triggerSideBySideKey
                && this.triggerSideBySideModifier === other.triggerSideBySideModifier);
        }
    }
    exports.ClickLinkOptions = ClickLinkOptions;
    function createOptions(multiCursorModifier) {
        if (multiCursorModifier === 'altKey') {
            if (platform.isMacintosh) {
                return new ClickLinkOptions(57 /* Meta */, 'metaKey', 6 /* Alt */, 'altKey');
            }
            return new ClickLinkOptions(5 /* Ctrl */, 'ctrlKey', 6 /* Alt */, 'altKey');
        }
        if (platform.isMacintosh) {
            return new ClickLinkOptions(6 /* Alt */, 'altKey', 57 /* Meta */, 'metaKey');
        }
        return new ClickLinkOptions(6 /* Alt */, 'altKey', 5 /* Ctrl */, 'ctrlKey');
    }
    class ClickLinkGesture extends lifecycle_1.Disposable {
        constructor(editor) {
            super();
            this._onMouseMoveOrRelevantKeyDown = this._register(new event_1.Emitter());
            this.onMouseMoveOrRelevantKeyDown = this._onMouseMoveOrRelevantKeyDown.event;
            this._onExecute = this._register(new event_1.Emitter());
            this.onExecute = this._onExecute.event;
            this._onCancel = this._register(new event_1.Emitter());
            this.onCancel = this._onCancel.event;
            this._editor = editor;
            this._opts = createOptions(this._editor.getOption(56 /* multiCursorModifier */));
            this.lastMouseMoveEvent = null;
            this.hasTriggerKeyOnMouseDown = false;
            this._register(this._editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(56 /* multiCursorModifier */)) {
                    const newOpts = createOptions(this._editor.getOption(56 /* multiCursorModifier */));
                    if (this._opts.equals(newOpts)) {
                        return;
                    }
                    this._opts = newOpts;
                    this.lastMouseMoveEvent = null;
                    this.hasTriggerKeyOnMouseDown = false;
                    this._onCancel.fire();
                }
            }));
            this._register(this._editor.onMouseMove((e) => this.onEditorMouseMove(new ClickLinkMouseEvent(e, this._opts))));
            this._register(this._editor.onMouseDown((e) => this.onEditorMouseDown(new ClickLinkMouseEvent(e, this._opts))));
            this._register(this._editor.onMouseUp((e) => this.onEditorMouseUp(new ClickLinkMouseEvent(e, this._opts))));
            this._register(this._editor.onKeyDown((e) => this.onEditorKeyDown(new ClickLinkKeyboardEvent(e, this._opts))));
            this._register(this._editor.onKeyUp((e) => this.onEditorKeyUp(new ClickLinkKeyboardEvent(e, this._opts))));
            this._register(this._editor.onMouseDrag(() => this.resetHandler()));
            this._register(this._editor.onDidChangeCursorSelection((e) => this.onDidChangeCursorSelection(e)));
            this._register(this._editor.onDidChangeModel((e) => this.resetHandler()));
            this._register(this._editor.onDidChangeModelContent(() => this.resetHandler()));
            this._register(this._editor.onDidScrollChange((e) => {
                if (e.scrollTopChanged || e.scrollLeftChanged) {
                    this.resetHandler();
                }
            }));
        }
        onDidChangeCursorSelection(e) {
            if (e.selection && e.selection.startColumn !== e.selection.endColumn) {
                this.resetHandler(); // immediately stop this feature if the user starts to select (https://github.com/Microsoft/vscode/issues/7827)
            }
        }
        onEditorMouseMove(mouseEvent) {
            this.lastMouseMoveEvent = mouseEvent;
            this._onMouseMoveOrRelevantKeyDown.fire([mouseEvent, null]);
        }
        onEditorMouseDown(mouseEvent) {
            // We need to record if we had the trigger key on mouse down because someone might select something in the editor
            // holding the mouse down and then while mouse is down start to press Ctrl/Cmd to start a copy operation and then
            // release the mouse button without wanting to do the navigation.
            // With this flag we prevent goto definition if the mouse was down before the trigger key was pressed.
            this.hasTriggerKeyOnMouseDown = mouseEvent.hasTriggerModifier;
        }
        onEditorMouseUp(mouseEvent) {
            if (this.hasTriggerKeyOnMouseDown) {
                this._onExecute.fire(mouseEvent);
            }
        }
        onEditorKeyDown(e) {
            if (this.lastMouseMoveEvent
                && (e.keyCodeIsTriggerKey // User just pressed Ctrl/Cmd (normal goto definition)
                    || (e.keyCodeIsSideBySideKey && e.hasTriggerModifier) // User pressed Ctrl/Cmd+Alt (goto definition to the side)
                )) {
                this._onMouseMoveOrRelevantKeyDown.fire([this.lastMouseMoveEvent, e]);
            }
            else if (e.hasTriggerModifier) {
                this._onCancel.fire(); // remove decorations if user holds another key with ctrl/cmd to prevent accident goto declaration
            }
        }
        onEditorKeyUp(e) {
            if (e.keyCodeIsTriggerKey) {
                this._onCancel.fire();
            }
        }
        resetHandler() {
            this.lastMouseMoveEvent = null;
            this.hasTriggerKeyOnMouseDown = false;
            this._onCancel.fire();
        }
    }
    exports.ClickLinkGesture = ClickLinkGesture;
});
//# sourceMappingURL=clickLinkGesture.js.map