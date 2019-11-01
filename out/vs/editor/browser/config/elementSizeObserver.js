/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle"], function (require, exports, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ElementSizeObserver extends lifecycle_1.Disposable {
        constructor(referenceDomElement, dimension, changeCallback) {
            super();
            this.referenceDomElement = referenceDomElement;
            this.changeCallback = changeCallback;
            this.measureReferenceDomElementToken = -1;
            this.width = -1;
            this.height = -1;
            this.measureReferenceDomElement(false, dimension);
        }
        dispose() {
            this.stopObserving();
            super.dispose();
        }
        getWidth() {
            return this.width;
        }
        getHeight() {
            return this.height;
        }
        startObserving() {
            if (this.measureReferenceDomElementToken === -1) {
                this.measureReferenceDomElementToken = setInterval(() => this.measureReferenceDomElement(true), 100);
            }
        }
        stopObserving() {
            if (this.measureReferenceDomElementToken !== -1) {
                clearInterval(this.measureReferenceDomElementToken);
                this.measureReferenceDomElementToken = -1;
            }
        }
        observe(dimension) {
            this.measureReferenceDomElement(true, dimension);
        }
        measureReferenceDomElement(callChangeCallback, dimension) {
            let observedWidth = 0;
            let observedHeight = 0;
            if (dimension) {
                observedWidth = dimension.width;
                observedHeight = dimension.height;
            }
            else if (this.referenceDomElement) {
                observedWidth = this.referenceDomElement.clientWidth;
                observedHeight = this.referenceDomElement.clientHeight;
            }
            observedWidth = Math.max(5, observedWidth);
            observedHeight = Math.max(5, observedHeight);
            if (this.width !== observedWidth || this.height !== observedHeight) {
                this.width = observedWidth;
                this.height = observedHeight;
                if (callChangeCallback) {
                    this.changeCallback();
                }
            }
        }
    }
    exports.ElementSizeObserver = ElementSizeObserver;
});
//# sourceMappingURL=elementSizeObserver.js.map