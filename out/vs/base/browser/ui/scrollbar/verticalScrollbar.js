/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/mouseEvent", "vs/base/browser/ui/scrollbar/abstractScrollbar", "vs/base/browser/ui/scrollbar/scrollbarArrow", "vs/base/browser/ui/scrollbar/scrollbarState"], function (require, exports, mouseEvent_1, abstractScrollbar_1, scrollbarArrow_1, scrollbarState_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class VerticalScrollbar extends abstractScrollbar_1.AbstractScrollbar {
        constructor(scrollable, options, host) {
            super({
                lazyRender: options.lazyRender,
                host: host,
                scrollbarState: new scrollbarState_1.ScrollbarState((options.verticalHasArrows ? options.arrowSize : 0), (options.vertical === 2 /* Hidden */ ? 0 : options.verticalScrollbarSize), 
                // give priority to vertical scroll bar over horizontal and let it scroll all the way to the bottom
                0),
                visibility: options.vertical,
                extraScrollbarClassName: 'vertical',
                scrollable: scrollable
            });
            if (options.verticalHasArrows) {
                let arrowDelta = (options.arrowSize - scrollbarArrow_1.ARROW_IMG_SIZE) / 2;
                let scrollbarDelta = (options.verticalScrollbarSize - scrollbarArrow_1.ARROW_IMG_SIZE) / 2;
                this._createArrow({
                    className: 'up-arrow',
                    top: arrowDelta,
                    left: scrollbarDelta,
                    bottom: undefined,
                    right: undefined,
                    bgWidth: options.verticalScrollbarSize,
                    bgHeight: options.arrowSize,
                    onActivate: () => this._host.onMouseWheel(new mouseEvent_1.StandardWheelEvent(null, 0, 1)),
                });
                this._createArrow({
                    className: 'down-arrow',
                    top: undefined,
                    left: scrollbarDelta,
                    bottom: arrowDelta,
                    right: undefined,
                    bgWidth: options.verticalScrollbarSize,
                    bgHeight: options.arrowSize,
                    onActivate: () => this._host.onMouseWheel(new mouseEvent_1.StandardWheelEvent(null, 0, -1)),
                });
            }
            this._createSlider(0, Math.floor((options.verticalScrollbarSize - options.verticalSliderSize) / 2), options.verticalSliderSize, undefined);
        }
        _updateSlider(sliderSize, sliderPosition) {
            this.slider.setHeight(sliderSize);
            this.slider.setTop(sliderPosition);
        }
        _renderDomNode(largeSize, smallSize) {
            this.domNode.setWidth(smallSize);
            this.domNode.setHeight(largeSize);
            this.domNode.setRight(0);
            this.domNode.setTop(0);
        }
        onDidScroll(e) {
            this._shouldRender = this._onElementScrollSize(e.scrollHeight) || this._shouldRender;
            this._shouldRender = this._onElementScrollPosition(e.scrollTop) || this._shouldRender;
            this._shouldRender = this._onElementSize(e.height) || this._shouldRender;
            return this._shouldRender;
        }
        _mouseDownRelativePosition(offsetX, offsetY) {
            return offsetY;
        }
        _sliderMousePosition(e) {
            return e.posy;
        }
        _sliderOrthogonalMousePosition(e) {
            return e.posx;
        }
        writeScrollPosition(target, scrollPosition) {
            target.scrollTop = scrollPosition;
        }
    }
    exports.VerticalScrollbar = VerticalScrollbar;
});
//# sourceMappingURL=verticalScrollbar.js.map