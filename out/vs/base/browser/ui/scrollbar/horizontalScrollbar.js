/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/mouseEvent", "vs/base/browser/ui/scrollbar/abstractScrollbar", "vs/base/browser/ui/scrollbar/scrollbarArrow", "vs/base/browser/ui/scrollbar/scrollbarState"], function (require, exports, mouseEvent_1, abstractScrollbar_1, scrollbarArrow_1, scrollbarState_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class HorizontalScrollbar extends abstractScrollbar_1.AbstractScrollbar {
        constructor(scrollable, options, host) {
            super({
                lazyRender: options.lazyRender,
                host: host,
                scrollbarState: new scrollbarState_1.ScrollbarState((options.horizontalHasArrows ? options.arrowSize : 0), (options.horizontal === 2 /* Hidden */ ? 0 : options.horizontalScrollbarSize), (options.vertical === 2 /* Hidden */ ? 0 : options.verticalScrollbarSize)),
                visibility: options.horizontal,
                extraScrollbarClassName: 'horizontal',
                scrollable: scrollable
            });
            if (options.horizontalHasArrows) {
                let arrowDelta = (options.arrowSize - scrollbarArrow_1.ARROW_IMG_SIZE) / 2;
                let scrollbarDelta = (options.horizontalScrollbarSize - scrollbarArrow_1.ARROW_IMG_SIZE) / 2;
                this._createArrow({
                    className: 'left-arrow',
                    top: scrollbarDelta,
                    left: arrowDelta,
                    bottom: undefined,
                    right: undefined,
                    bgWidth: options.arrowSize,
                    bgHeight: options.horizontalScrollbarSize,
                    onActivate: () => this._host.onMouseWheel(new mouseEvent_1.StandardWheelEvent(null, 1, 0)),
                });
                this._createArrow({
                    className: 'right-arrow',
                    top: scrollbarDelta,
                    left: undefined,
                    bottom: undefined,
                    right: arrowDelta,
                    bgWidth: options.arrowSize,
                    bgHeight: options.horizontalScrollbarSize,
                    onActivate: () => this._host.onMouseWheel(new mouseEvent_1.StandardWheelEvent(null, -1, 0)),
                });
            }
            this._createSlider(Math.floor((options.horizontalScrollbarSize - options.horizontalSliderSize) / 2), 0, undefined, options.horizontalSliderSize);
        }
        _updateSlider(sliderSize, sliderPosition) {
            this.slider.setWidth(sliderSize);
            this.slider.setLeft(sliderPosition);
        }
        _renderDomNode(largeSize, smallSize) {
            this.domNode.setWidth(largeSize);
            this.domNode.setHeight(smallSize);
            this.domNode.setLeft(0);
            this.domNode.setBottom(0);
        }
        onDidScroll(e) {
            this._shouldRender = this._onElementScrollSize(e.scrollWidth) || this._shouldRender;
            this._shouldRender = this._onElementScrollPosition(e.scrollLeft) || this._shouldRender;
            this._shouldRender = this._onElementSize(e.width) || this._shouldRender;
            return this._shouldRender;
        }
        _mouseDownRelativePosition(offsetX, offsetY) {
            return offsetX;
        }
        _sliderMousePosition(e) {
            return e.posx;
        }
        _sliderOrthogonalMousePosition(e) {
            return e.posy;
        }
        writeScrollPosition(target, scrollPosition) {
            target.scrollLeft = scrollPosition;
        }
    }
    exports.HorizontalScrollbar = HorizontalScrollbar;
});
//# sourceMappingURL=horizontalScrollbar.js.map