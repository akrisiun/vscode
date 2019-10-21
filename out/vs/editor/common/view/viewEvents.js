/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle"], function (require, exports, errors, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ViewEventType;
    (function (ViewEventType) {
        ViewEventType[ViewEventType["ViewConfigurationChanged"] = 1] = "ViewConfigurationChanged";
        ViewEventType[ViewEventType["ViewCursorStateChanged"] = 2] = "ViewCursorStateChanged";
        ViewEventType[ViewEventType["ViewDecorationsChanged"] = 3] = "ViewDecorationsChanged";
        ViewEventType[ViewEventType["ViewFlushed"] = 4] = "ViewFlushed";
        ViewEventType[ViewEventType["ViewFocusChanged"] = 5] = "ViewFocusChanged";
        ViewEventType[ViewEventType["ViewLineMappingChanged"] = 6] = "ViewLineMappingChanged";
        ViewEventType[ViewEventType["ViewLinesChanged"] = 7] = "ViewLinesChanged";
        ViewEventType[ViewEventType["ViewLinesDeleted"] = 8] = "ViewLinesDeleted";
        ViewEventType[ViewEventType["ViewLinesInserted"] = 9] = "ViewLinesInserted";
        ViewEventType[ViewEventType["ViewRevealRangeRequest"] = 10] = "ViewRevealRangeRequest";
        ViewEventType[ViewEventType["ViewScrollChanged"] = 11] = "ViewScrollChanged";
        ViewEventType[ViewEventType["ViewTokensChanged"] = 12] = "ViewTokensChanged";
        ViewEventType[ViewEventType["ViewTokensColorsChanged"] = 13] = "ViewTokensColorsChanged";
        ViewEventType[ViewEventType["ViewZonesChanged"] = 14] = "ViewZonesChanged";
        ViewEventType[ViewEventType["ViewThemeChanged"] = 15] = "ViewThemeChanged";
        ViewEventType[ViewEventType["ViewLanguageConfigurationChanged"] = 16] = "ViewLanguageConfigurationChanged";
    })(ViewEventType = exports.ViewEventType || (exports.ViewEventType = {}));
    class ViewConfigurationChangedEvent {
        constructor(source) {
            this.type = 1 /* ViewConfigurationChanged */;
            this._source = source;
        }
        hasChanged(id) {
            return this._source.hasChanged(id);
        }
    }
    exports.ViewConfigurationChangedEvent = ViewConfigurationChangedEvent;
    class ViewCursorStateChangedEvent {
        constructor(selections) {
            this.type = 2 /* ViewCursorStateChanged */;
            this.selections = selections;
        }
    }
    exports.ViewCursorStateChangedEvent = ViewCursorStateChangedEvent;
    class ViewDecorationsChangedEvent {
        constructor() {
            this.type = 3 /* ViewDecorationsChanged */;
            // Nothing to do
        }
    }
    exports.ViewDecorationsChangedEvent = ViewDecorationsChangedEvent;
    class ViewFlushedEvent {
        constructor() {
            this.type = 4 /* ViewFlushed */;
            // Nothing to do
        }
    }
    exports.ViewFlushedEvent = ViewFlushedEvent;
    class ViewFocusChangedEvent {
        constructor(isFocused) {
            this.type = 5 /* ViewFocusChanged */;
            this.isFocused = isFocused;
        }
    }
    exports.ViewFocusChangedEvent = ViewFocusChangedEvent;
    class ViewLineMappingChangedEvent {
        constructor() {
            this.type = 6 /* ViewLineMappingChanged */;
            // Nothing to do
        }
    }
    exports.ViewLineMappingChangedEvent = ViewLineMappingChangedEvent;
    class ViewLinesChangedEvent {
        constructor(fromLineNumber, toLineNumber) {
            this.type = 7 /* ViewLinesChanged */;
            this.fromLineNumber = fromLineNumber;
            this.toLineNumber = toLineNumber;
        }
    }
    exports.ViewLinesChangedEvent = ViewLinesChangedEvent;
    class ViewLinesDeletedEvent {
        constructor(fromLineNumber, toLineNumber) {
            this.type = 8 /* ViewLinesDeleted */;
            this.fromLineNumber = fromLineNumber;
            this.toLineNumber = toLineNumber;
        }
    }
    exports.ViewLinesDeletedEvent = ViewLinesDeletedEvent;
    class ViewLinesInsertedEvent {
        constructor(fromLineNumber, toLineNumber) {
            this.type = 9 /* ViewLinesInserted */;
            this.fromLineNumber = fromLineNumber;
            this.toLineNumber = toLineNumber;
        }
    }
    exports.ViewLinesInsertedEvent = ViewLinesInsertedEvent;
    var VerticalRevealType;
    (function (VerticalRevealType) {
        VerticalRevealType[VerticalRevealType["Simple"] = 0] = "Simple";
        VerticalRevealType[VerticalRevealType["Center"] = 1] = "Center";
        VerticalRevealType[VerticalRevealType["CenterIfOutsideViewport"] = 2] = "CenterIfOutsideViewport";
        VerticalRevealType[VerticalRevealType["Top"] = 3] = "Top";
        VerticalRevealType[VerticalRevealType["Bottom"] = 4] = "Bottom";
    })(VerticalRevealType = exports.VerticalRevealType || (exports.VerticalRevealType = {}));
    class ViewRevealRangeRequestEvent {
        constructor(source, range, verticalType, revealHorizontal, scrollType) {
            this.type = 10 /* ViewRevealRangeRequest */;
            this.source = source;
            this.range = range;
            this.verticalType = verticalType;
            this.revealHorizontal = revealHorizontal;
            this.scrollType = scrollType;
        }
    }
    exports.ViewRevealRangeRequestEvent = ViewRevealRangeRequestEvent;
    class ViewScrollChangedEvent {
        constructor(source) {
            this.type = 11 /* ViewScrollChanged */;
            this.scrollWidth = source.scrollWidth;
            this.scrollLeft = source.scrollLeft;
            this.scrollHeight = source.scrollHeight;
            this.scrollTop = source.scrollTop;
            this.scrollWidthChanged = source.scrollWidthChanged;
            this.scrollLeftChanged = source.scrollLeftChanged;
            this.scrollHeightChanged = source.scrollHeightChanged;
            this.scrollTopChanged = source.scrollTopChanged;
        }
    }
    exports.ViewScrollChangedEvent = ViewScrollChangedEvent;
    class ViewTokensChangedEvent {
        constructor(ranges) {
            this.type = 12 /* ViewTokensChanged */;
            this.ranges = ranges;
        }
    }
    exports.ViewTokensChangedEvent = ViewTokensChangedEvent;
    class ViewThemeChangedEvent {
        constructor() {
            this.type = 15 /* ViewThemeChanged */;
        }
    }
    exports.ViewThemeChangedEvent = ViewThemeChangedEvent;
    class ViewTokensColorsChangedEvent {
        constructor() {
            this.type = 13 /* ViewTokensColorsChanged */;
            // Nothing to do
        }
    }
    exports.ViewTokensColorsChangedEvent = ViewTokensColorsChangedEvent;
    class ViewZonesChangedEvent {
        constructor() {
            this.type = 14 /* ViewZonesChanged */;
            // Nothing to do
        }
    }
    exports.ViewZonesChangedEvent = ViewZonesChangedEvent;
    class ViewLanguageConfigurationEvent {
        constructor() {
            this.type = 16 /* ViewLanguageConfigurationChanged */;
        }
    }
    exports.ViewLanguageConfigurationEvent = ViewLanguageConfigurationEvent;
    class ViewEventEmitter extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._listeners = [];
            this._collector = null;
            this._collectorCnt = 0;
        }
        dispose() {
            this._listeners = [];
            super.dispose();
        }
        _beginEmit() {
            this._collectorCnt++;
            if (this._collectorCnt === 1) {
                this._collector = new ViewEventsCollector();
            }
            return this._collector;
        }
        _endEmit() {
            this._collectorCnt--;
            if (this._collectorCnt === 0) {
                const events = this._collector.finalize();
                this._collector = null;
                if (events.length > 0) {
                    this._emit(events);
                }
            }
        }
        _emit(events) {
            const listeners = this._listeners.slice(0);
            for (let i = 0, len = listeners.length; i < len; i++) {
                safeInvokeListener(listeners[i], events);
            }
        }
        addEventListener(listener) {
            this._listeners.push(listener);
            return lifecycle_1.toDisposable(() => {
                let listeners = this._listeners;
                for (let i = 0, len = listeners.length; i < len; i++) {
                    if (listeners[i] === listener) {
                        listeners.splice(i, 1);
                        break;
                    }
                }
            });
        }
    }
    exports.ViewEventEmitter = ViewEventEmitter;
    class ViewEventsCollector {
        constructor() {
            this._eventsLen = 0;
            this._events = [];
            this._eventsLen = 0;
        }
        emit(event) {
            this._events[this._eventsLen++] = event;
        }
        finalize() {
            let result = this._events;
            this._events = [];
            return result;
        }
    }
    exports.ViewEventsCollector = ViewEventsCollector;
    function safeInvokeListener(listener, events) {
        try {
            listener(events);
        }
        catch (e) {
            errors.onUnexpectedError(e);
        }
    }
});
//# sourceMappingURL=viewEvents.js.map