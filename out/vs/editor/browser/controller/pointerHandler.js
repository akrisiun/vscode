/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/touch", "vs/base/common/lifecycle", "vs/editor/browser/controller/mouseHandler", "vs/editor/browser/editorDom"], function (require, exports, dom, touch_1, lifecycle_1, mouseHandler_1, editorDom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function gestureChangeEventMerger(lastEvent, currentEvent) {
        const r = {
            translationY: currentEvent.translationY,
            translationX: currentEvent.translationX
        };
        if (lastEvent) {
            r.translationY += lastEvent.translationY;
            r.translationX += lastEvent.translationX;
        }
        return r;
    }
    /**
     * Basically IE10 and IE11
     */
    class MsPointerHandler extends mouseHandler_1.MouseHandler {
        constructor(context, viewController, viewHelper) {
            super(context, viewController, viewHelper);
            this.viewHelper.linesContentDomNode.style.msTouchAction = 'none';
            this.viewHelper.linesContentDomNode.style.msContentZooming = 'none';
            // TODO@Alex -> this expects that the view is added in 100 ms, might not be the case
            // This handler should be added when the dom node is in the dom tree
            this._installGestureHandlerTimeout = window.setTimeout(() => {
                this._installGestureHandlerTimeout = -1;
                if (window.MSGesture) {
                    const touchGesture = new MSGesture();
                    const penGesture = new MSGesture();
                    touchGesture.target = this.viewHelper.linesContentDomNode;
                    penGesture.target = this.viewHelper.linesContentDomNode;
                    this.viewHelper.linesContentDomNode.addEventListener('MSPointerDown', (e) => {
                        // Circumvent IE11 breaking change in e.pointerType & TypeScript's stale definitions
                        const pointerType = e.pointerType;
                        if (pointerType === (e.MSPOINTER_TYPE_MOUSE || 'mouse')) {
                            this._lastPointerType = 'mouse';
                            return;
                        }
                        else if (pointerType === (e.MSPOINTER_TYPE_TOUCH || 'touch')) {
                            this._lastPointerType = 'touch';
                            touchGesture.addPointer(e.pointerId);
                        }
                        else {
                            this._lastPointerType = 'pen';
                            penGesture.addPointer(e.pointerId);
                        }
                    });
                    this._register(dom.addDisposableThrottledListener(this.viewHelper.linesContentDomNode, 'MSGestureChange', (e) => this._onGestureChange(e), gestureChangeEventMerger));
                    this._register(dom.addDisposableListener(this.viewHelper.linesContentDomNode, 'MSGestureTap', (e) => this._onCaptureGestureTap(e), true));
                }
            }, 100);
            this._lastPointerType = 'mouse';
        }
        _onMouseDown(e) {
            if (this._lastPointerType === 'mouse') {
                super._onMouseDown(e);
            }
        }
        _onCaptureGestureTap(rawEvent) {
            const e = new editorDom_1.EditorMouseEvent(rawEvent, this.viewHelper.viewDomNode);
            const t = this._createMouseTarget(e, false);
            if (t.position) {
                this.viewController.moveTo(t.position);
            }
            // IE does not want to focus when coming in from the browser's address bar
            if (e.browserEvent.fromElement) {
                e.preventDefault();
                this.viewHelper.focusTextArea();
            }
            else {
                // TODO@Alex -> cancel this is focus is lost
                setTimeout(() => {
                    this.viewHelper.focusTextArea();
                });
            }
        }
        _onGestureChange(e) {
            this._context.viewLayout.deltaScrollNow(-e.translationX, -e.translationY);
        }
        dispose() {
            window.clearTimeout(this._installGestureHandlerTimeout);
            super.dispose();
        }
    }
    /**
     * Basically Edge but should be modified to handle any pointerEnabled, even without support of MSGesture
     */
    class StandardPointerHandler extends mouseHandler_1.MouseHandler {
        constructor(context, viewController, viewHelper) {
            super(context, viewController, viewHelper);
            this.viewHelper.linesContentDomNode.style.touchAction = 'none';
            // TODO@Alex -> this expects that the view is added in 100 ms, might not be the case
            // This handler should be added when the dom node is in the dom tree
            this._installGestureHandlerTimeout = window.setTimeout(() => {
                this._installGestureHandlerTimeout = -1;
                // TODO@Alex: replace the usage of MSGesture here with something that works across all browsers
                if (window.MSGesture) {
                    const touchGesture = new MSGesture();
                    const penGesture = new MSGesture();
                    touchGesture.target = this.viewHelper.linesContentDomNode;
                    penGesture.target = this.viewHelper.linesContentDomNode;
                    this.viewHelper.linesContentDomNode.addEventListener('pointerdown', (e) => {
                        const pointerType = e.pointerType;
                        if (pointerType === 'mouse') {
                            this._lastPointerType = 'mouse';
                            return;
                        }
                        else if (pointerType === 'touch') {
                            this._lastPointerType = 'touch';
                            touchGesture.addPointer(e.pointerId);
                        }
                        else {
                            this._lastPointerType = 'pen';
                            penGesture.addPointer(e.pointerId);
                        }
                    });
                    this._register(dom.addDisposableThrottledListener(this.viewHelper.linesContentDomNode, 'MSGestureChange', (e) => this._onGestureChange(e), gestureChangeEventMerger));
                    this._register(dom.addDisposableListener(this.viewHelper.linesContentDomNode, 'MSGestureTap', (e) => this._onCaptureGestureTap(e), true));
                }
            }, 100);
            this._lastPointerType = 'mouse';
        }
        _onMouseDown(e) {
            if (this._lastPointerType === 'mouse') {
                super._onMouseDown(e);
            }
        }
        _onCaptureGestureTap(rawEvent) {
            const e = new editorDom_1.EditorMouseEvent(rawEvent, this.viewHelper.viewDomNode);
            const t = this._createMouseTarget(e, false);
            if (t.position) {
                this.viewController.moveTo(t.position);
            }
            // IE does not want to focus when coming in from the browser's address bar
            if (e.browserEvent.fromElement) {
                e.preventDefault();
                this.viewHelper.focusTextArea();
            }
            else {
                // TODO@Alex -> cancel this is focus is lost
                setTimeout(() => {
                    this.viewHelper.focusTextArea();
                });
            }
        }
        _onGestureChange(e) {
            this._context.viewLayout.deltaScrollNow(-e.translationX, -e.translationY);
        }
        dispose() {
            window.clearTimeout(this._installGestureHandlerTimeout);
            super.dispose();
        }
    }
    class TouchHandler extends mouseHandler_1.MouseHandler {
        constructor(context, viewController, viewHelper) {
            super(context, viewController, viewHelper);
            this._register(touch_1.Gesture.addTarget(this.viewHelper.linesContentDomNode));
            this._register(dom.addDisposableListener(this.viewHelper.linesContentDomNode, touch_1.EventType.Tap, (e) => this.onTap(e)));
            this._register(dom.addDisposableListener(this.viewHelper.linesContentDomNode, touch_1.EventType.Change, (e) => this.onChange(e)));
            this._register(dom.addDisposableListener(this.viewHelper.linesContentDomNode, touch_1.EventType.Contextmenu, (e) => this._onContextMenu(new editorDom_1.EditorMouseEvent(e, this.viewHelper.viewDomNode), false)));
        }
        onTap(event) {
            event.preventDefault();
            this.viewHelper.focusTextArea();
            const target = this._createMouseTarget(new editorDom_1.EditorMouseEvent(event, this.viewHelper.viewDomNode), false);
            if (target.position) {
                this.viewController.moveTo(target.position);
            }
        }
        onChange(e) {
            this._context.viewLayout.deltaScrollNow(-e.translationX, -e.translationY);
        }
    }
    class PointerHandler extends lifecycle_1.Disposable {
        constructor(context, viewController, viewHelper) {
            super();
            if (window.navigator.msPointerEnabled) {
                this.handler = this._register(new MsPointerHandler(context, viewController, viewHelper));
            }
            else if (window.TouchEvent) {
                this.handler = this._register(new TouchHandler(context, viewController, viewHelper));
            }
            else if (window.navigator.pointerEnabled || window.PointerEvent) {
                this.handler = this._register(new StandardPointerHandler(context, viewController, viewHelper));
            }
            else {
                this.handler = this._register(new mouseHandler_1.MouseHandler(context, viewController, viewHelper));
            }
        }
        getTargetAtClientPoint(clientX, clientY) {
            return this.handler.getTargetAtClientPoint(clientX, clientY);
        }
    }
    exports.PointerHandler = PointerHandler;
});
//# sourceMappingURL=pointerHandler.js.map