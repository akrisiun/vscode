/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/iframe", "vs/base/browser/mouseEvent", "vs/base/common/lifecycle"], function (require, exports, dom, iframe_1, mouseEvent_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function standardMouseMoveMerger(lastEvent, currentEvent) {
        let ev = new mouseEvent_1.StandardMouseEvent(currentEvent);
        ev.preventDefault();
        return {
            leftButton: ev.leftButton,
            posx: ev.posx,
            posy: ev.posy
        };
    }
    exports.standardMouseMoveMerger = standardMouseMoveMerger;
    class GlobalMouseMoveMonitor {
        constructor() {
            this.hooks = new lifecycle_1.DisposableStore();
            this.mouseMoveEventMerger = null;
            this.mouseMoveCallback = null;
            this.onStopCallback = null;
        }
        dispose() {
            this.stopMonitoring(false);
            this.hooks.dispose();
        }
        stopMonitoring(invokeStopCallback) {
            if (!this.isMonitoring()) {
                // Not monitoring
                return;
            }
            // Unhook
            this.hooks.clear();
            this.mouseMoveEventMerger = null;
            this.mouseMoveCallback = null;
            const onStopCallback = this.onStopCallback;
            this.onStopCallback = null;
            if (invokeStopCallback && onStopCallback) {
                onStopCallback();
            }
        }
        isMonitoring() {
            return !!this.mouseMoveEventMerger;
        }
        startMonitoring(mouseMoveEventMerger, mouseMoveCallback, onStopCallback) {
            if (this.isMonitoring()) {
                // I am already hooked
                return;
            }
            this.mouseMoveEventMerger = mouseMoveEventMerger;
            this.mouseMoveCallback = mouseMoveCallback;
            this.onStopCallback = onStopCallback;
            let windowChain = iframe_1.IframeUtils.getSameOriginWindowChain();
            for (const element of windowChain) {
                this.hooks.add(dom.addDisposableThrottledListener(element.window.document, 'mousemove', (data) => this.mouseMoveCallback(data), (lastEvent, currentEvent) => this.mouseMoveEventMerger(lastEvent, currentEvent)));
                this.hooks.add(dom.addDisposableListener(element.window.document, 'mouseup', (e) => this.stopMonitoring(true)));
            }
            if (iframe_1.IframeUtils.hasDifferentOriginAncestor()) {
                let lastSameOriginAncestor = windowChain[windowChain.length - 1];
                // We might miss a mouse up if it happens outside the iframe
                // This one is for Chrome
                this.hooks.add(dom.addDisposableListener(lastSameOriginAncestor.window.document, 'mouseout', (browserEvent) => {
                    let e = new mouseEvent_1.StandardMouseEvent(browserEvent);
                    if (e.target.tagName.toLowerCase() === 'html') {
                        this.stopMonitoring(true);
                    }
                }));
                // This one is for FF
                this.hooks.add(dom.addDisposableListener(lastSameOriginAncestor.window.document, 'mouseover', (browserEvent) => {
                    let e = new mouseEvent_1.StandardMouseEvent(browserEvent);
                    if (e.target.tagName.toLowerCase() === 'html') {
                        this.stopMonitoring(true);
                    }
                }));
                // This one is for IE
                this.hooks.add(dom.addDisposableListener(lastSameOriginAncestor.window.document.body, 'mouseleave', (browserEvent) => {
                    this.stopMonitoring(true);
                }));
            }
        }
    }
    exports.GlobalMouseMoveMonitor = GlobalMouseMoveMonitor;
});
//# sourceMappingURL=globalMouseMoveMonitor.js.map