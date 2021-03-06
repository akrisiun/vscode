/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/editor/common/view/overviewZoneManager", "vs/editor/common/viewModel/viewEventHandler"], function (require, exports, fastDomNode_1, overviewZoneManager_1, viewEventHandler_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class OverviewRuler extends viewEventHandler_1.ViewEventHandler {
        constructor(context, cssClassName) {
            super();
            this._context = context;
            const options = this._context.configuration.options;
            this._domNode = fastDomNode_1.createFastDomNode(document.createElement('canvas'));
            this._domNode.setClassName(cssClassName);
            this._domNode.setPosition('absolute');
            this._domNode.setLayerHinting(true);
            this._zoneManager = new overviewZoneManager_1.OverviewZoneManager((lineNumber) => this._context.viewLayout.getVerticalOffsetForLineNumber(lineNumber));
            this._zoneManager.setDOMWidth(0);
            this._zoneManager.setDOMHeight(0);
            this._zoneManager.setOuterHeight(this._context.viewLayout.getScrollHeight());
            this._zoneManager.setLineHeight(options.get(46 /* lineHeight */));
            this._zoneManager.setPixelRatio(options.get(100 /* pixelRatio */));
            this._context.addEventHandler(this);
        }
        dispose() {
            this._context.removeEventHandler(this);
            super.dispose();
        }
        // ---- begin view event handlers
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            if (e.hasChanged(46 /* lineHeight */)) {
                this._zoneManager.setLineHeight(options.get(46 /* lineHeight */));
                this._render();
            }
            if (e.hasChanged(100 /* pixelRatio */)) {
                this._zoneManager.setPixelRatio(options.get(100 /* pixelRatio */));
                this._domNode.setWidth(this._zoneManager.getDOMWidth());
                this._domNode.setHeight(this._zoneManager.getDOMHeight());
                this._domNode.domNode.width = this._zoneManager.getCanvasWidth();
                this._domNode.domNode.height = this._zoneManager.getCanvasHeight();
                this._render();
            }
            return true;
        }
        onFlushed(e) {
            this._render();
            return true;
        }
        onScrollChanged(e) {
            if (e.scrollHeightChanged) {
                this._zoneManager.setOuterHeight(e.scrollHeight);
                this._render();
            }
            return true;
        }
        onZonesChanged(e) {
            this._render();
            return true;
        }
        // ---- end view event handlers
        getDomNode() {
            return this._domNode.domNode;
        }
        setLayout(position) {
            this._domNode.setTop(position.top);
            this._domNode.setRight(position.right);
            let hasChanged = false;
            hasChanged = this._zoneManager.setDOMWidth(position.width) || hasChanged;
            hasChanged = this._zoneManager.setDOMHeight(position.height) || hasChanged;
            if (hasChanged) {
                this._domNode.setWidth(this._zoneManager.getDOMWidth());
                this._domNode.setHeight(this._zoneManager.getDOMHeight());
                this._domNode.domNode.width = this._zoneManager.getCanvasWidth();
                this._domNode.domNode.height = this._zoneManager.getCanvasHeight();
                this._render();
            }
        }
        setZones(zones) {
            this._zoneManager.setZones(zones);
            this._render();
        }
        _render() {
            if (this._zoneManager.getOuterHeight() === 0) {
                return false;
            }
            const width = this._zoneManager.getCanvasWidth();
            const height = this._zoneManager.getCanvasHeight();
            const colorZones = this._zoneManager.resolveColorZones();
            const id2Color = this._zoneManager.getId2Color();
            const ctx = this._domNode.domNode.getContext('2d');
            ctx.clearRect(0, 0, width, height);
            if (colorZones.length > 0) {
                this._renderOneLane(ctx, colorZones, id2Color, width);
            }
            return true;
        }
        _renderOneLane(ctx, colorZones, id2Color, width) {
            let currentColorId = 0;
            let currentFrom = 0;
            let currentTo = 0;
            for (const zone of colorZones) {
                const zoneColorId = zone.colorId;
                const zoneFrom = zone.from;
                const zoneTo = zone.to;
                if (zoneColorId !== currentColorId) {
                    ctx.fillRect(0, currentFrom, width, currentTo - currentFrom);
                    currentColorId = zoneColorId;
                    ctx.fillStyle = id2Color[currentColorId];
                    currentFrom = zoneFrom;
                    currentTo = zoneTo;
                }
                else {
                    if (currentTo >= zoneFrom) {
                        currentTo = Math.max(currentTo, zoneTo);
                    }
                    else {
                        ctx.fillRect(0, currentFrom, width, currentTo - currentFrom);
                        currentFrom = zoneFrom;
                        currentTo = zoneTo;
                    }
                }
            }
            ctx.fillRect(0, currentFrom, width, currentTo - currentFrom);
        }
    }
    exports.OverviewRuler = OverviewRuler;
});
//# sourceMappingURL=overviewRuler.js.map