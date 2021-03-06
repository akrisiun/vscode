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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/base/common/decorators"], function (require, exports, arrays, lifecycle_1, DomUtils, decorators_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var EventType;
    (function (EventType) {
        EventType.Tap = '-monaco-gesturetap';
        EventType.Change = '-monaco-gesturechange';
        EventType.Start = '-monaco-gesturestart';
        EventType.End = '-monaco-gesturesend';
        EventType.Contextmenu = '-monaco-gesturecontextmenu';
    })(EventType = exports.EventType || (exports.EventType = {}));
    class Gesture extends lifecycle_1.Disposable {
        constructor() {
            super();
            this.dispatched = false;
            this.activeTouches = {};
            this.handle = null;
            this.targets = [];
            this._register(DomUtils.addDisposableListener(document, 'touchstart', (e) => this.onTouchStart(e)));
            this._register(DomUtils.addDisposableListener(document, 'touchend', (e) => this.onTouchEnd(e)));
            this._register(DomUtils.addDisposableListener(document, 'touchmove', (e) => this.onTouchMove(e)));
        }
        static addTarget(element) {
            if (!Gesture.isTouchDevice()) {
                return lifecycle_1.Disposable.None;
            }
            if (!Gesture.INSTANCE) {
                Gesture.INSTANCE = new Gesture();
            }
            Gesture.INSTANCE.targets.push(element);
            return {
                dispose: () => {
                    Gesture.INSTANCE.targets = Gesture.INSTANCE.targets.filter(t => t !== element);
                }
            };
        }
        static isTouchDevice() {
            return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.navigator.msMaxTouchPoints > 0;
        }
        dispose() {
            if (this.handle) {
                this.handle.dispose();
                this.handle = null;
            }
            super.dispose();
        }
        onTouchStart(e) {
            let timestamp = Date.now(); // use Date.now() because on FF e.timeStamp is not epoch based.
            if (this.handle) {
                this.handle.dispose();
                this.handle = null;
            }
            for (let i = 0, len = e.targetTouches.length; i < len; i++) {
                let touch = e.targetTouches.item(i);
                this.activeTouches[touch.identifier] = {
                    id: touch.identifier,
                    initialTarget: touch.target,
                    initialTimeStamp: timestamp,
                    initialPageX: touch.pageX,
                    initialPageY: touch.pageY,
                    rollingTimestamps: [timestamp],
                    rollingPageX: [touch.pageX],
                    rollingPageY: [touch.pageY]
                };
                let evt = this.newGestureEvent(EventType.Start, touch.target);
                evt.pageX = touch.pageX;
                evt.pageY = touch.pageY;
                this.dispatchEvent(evt);
            }
            if (this.dispatched) {
                e.preventDefault();
                e.stopPropagation();
                this.dispatched = false;
            }
        }
        onTouchEnd(e) {
            let timestamp = Date.now(); // use Date.now() because on FF e.timeStamp is not epoch based.
            let activeTouchCount = Object.keys(this.activeTouches).length;
            for (let i = 0, len = e.changedTouches.length; i < len; i++) {
                let touch = e.changedTouches.item(i);
                if (!this.activeTouches.hasOwnProperty(String(touch.identifier))) {
                    console.warn('move of an UNKNOWN touch', touch);
                    continue;
                }
                let data = this.activeTouches[touch.identifier], holdTime = Date.now() - data.initialTimeStamp;
                if (holdTime < Gesture.HOLD_DELAY
                    && Math.abs(data.initialPageX - arrays.tail(data.rollingPageX)) < 30
                    && Math.abs(data.initialPageY - arrays.tail(data.rollingPageY)) < 30) {
                    let evt = this.newGestureEvent(EventType.Tap, data.initialTarget);
                    evt.pageX = arrays.tail(data.rollingPageX);
                    evt.pageY = arrays.tail(data.rollingPageY);
                    this.dispatchEvent(evt);
                }
                else if (holdTime >= Gesture.HOLD_DELAY
                    && Math.abs(data.initialPageX - arrays.tail(data.rollingPageX)) < 30
                    && Math.abs(data.initialPageY - arrays.tail(data.rollingPageY)) < 30) {
                    let evt = this.newGestureEvent(EventType.Contextmenu, data.initialTarget);
                    evt.pageX = arrays.tail(data.rollingPageX);
                    evt.pageY = arrays.tail(data.rollingPageY);
                    this.dispatchEvent(evt);
                }
                else if (activeTouchCount === 1) {
                    let finalX = arrays.tail(data.rollingPageX);
                    let finalY = arrays.tail(data.rollingPageY);
                    let deltaT = arrays.tail(data.rollingTimestamps) - data.rollingTimestamps[0];
                    let deltaX = finalX - data.rollingPageX[0];
                    let deltaY = finalY - data.rollingPageY[0];
                    // We need to get all the dispatch targets on the start of the inertia event
                    const dispatchTo = this.targets.filter(t => data.initialTarget instanceof Node && t.contains(data.initialTarget));
                    this.inertia(dispatchTo, timestamp, // time now
                    Math.abs(deltaX) / deltaT, // speed
                    deltaX > 0 ? 1 : -1, // x direction
                    finalX, // x now
                    Math.abs(deltaY) / deltaT, // y speed
                    deltaY > 0 ? 1 : -1, // y direction
                    finalY // y now
                    );
                }
                this.dispatchEvent(this.newGestureEvent(EventType.End, data.initialTarget));
                // forget about this touch
                delete this.activeTouches[touch.identifier];
            }
            if (this.dispatched) {
                e.preventDefault();
                e.stopPropagation();
                this.dispatched = false;
            }
        }
        newGestureEvent(type, initialTarget) {
            let event = document.createEvent('CustomEvent');
            event.initEvent(type, false, true);
            event.initialTarget = initialTarget;
            return event;
        }
        dispatchEvent(event) {
            this.targets.forEach(target => {
                if (event.initialTarget instanceof Node && target.contains(event.initialTarget)) {
                    target.dispatchEvent(event);
                    this.dispatched = true;
                }
            });
        }
        inertia(dispatchTo, t1, vX, dirX, x, vY, dirY, y) {
            this.handle = DomUtils.scheduleAtNextAnimationFrame(() => {
                let now = Date.now();
                // velocity: old speed + accel_over_time
                let deltaT = now - t1, delta_pos_x = 0, delta_pos_y = 0, stopped = true;
                vX += Gesture.SCROLL_FRICTION * deltaT;
                vY += Gesture.SCROLL_FRICTION * deltaT;
                if (vX > 0) {
                    stopped = false;
                    delta_pos_x = dirX * vX * deltaT;
                }
                if (vY > 0) {
                    stopped = false;
                    delta_pos_y = dirY * vY * deltaT;
                }
                // dispatch translation event
                let evt = this.newGestureEvent(EventType.Change);
                evt.translationX = delta_pos_x;
                evt.translationY = delta_pos_y;
                dispatchTo.forEach(d => d.dispatchEvent(evt));
                if (!stopped) {
                    this.inertia(dispatchTo, now, vX, dirX, x + delta_pos_x, vY, dirY, y + delta_pos_y);
                }
            });
        }
        onTouchMove(e) {
            let timestamp = Date.now(); // use Date.now() because on FF e.timeStamp is not epoch based.
            for (let i = 0, len = e.changedTouches.length; i < len; i++) {
                let touch = e.changedTouches.item(i);
                if (!this.activeTouches.hasOwnProperty(String(touch.identifier))) {
                    console.warn('end of an UNKNOWN touch', touch);
                    continue;
                }
                let data = this.activeTouches[touch.identifier];
                let evt = this.newGestureEvent(EventType.Change, data.initialTarget);
                evt.translationX = touch.pageX - arrays.tail(data.rollingPageX);
                evt.translationY = touch.pageY - arrays.tail(data.rollingPageY);
                evt.pageX = touch.pageX;
                evt.pageY = touch.pageY;
                this.dispatchEvent(evt);
                // only keep a few data points, to average the final speed
                if (data.rollingPageX.length > 3) {
                    data.rollingPageX.shift();
                    data.rollingPageY.shift();
                    data.rollingTimestamps.shift();
                }
                data.rollingPageX.push(touch.pageX);
                data.rollingPageY.push(touch.pageY);
                data.rollingTimestamps.push(timestamp);
            }
            if (this.dispatched) {
                e.preventDefault();
                e.stopPropagation();
                this.dispatched = false;
            }
        }
    }
    Gesture.SCROLL_FRICTION = -0.005;
    Gesture.HOLD_DELAY = 700;
    __decorate([
        decorators_1.memoize
    ], Gesture, "isTouchDevice", null);
    exports.Gesture = Gesture;
});
//# sourceMappingURL=touch.js.map