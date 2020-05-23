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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/browser/ui/widget", "vs/workbench/contrib/terminal/browser/widgets/widgets", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/terminal/browser/widgets/hoverWidget", "vs/base/browser/dom"], function (require, exports, lifecycle_1, widget_1, widgets_1, instantiation_1, hoverWidget_1, dom) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalHover = void 0;
    const $ = dom.$;
    let TerminalHover = /** @class */ (() => {
        let TerminalHover = class TerminalHover extends lifecycle_1.Disposable {
            constructor(_targetOptions, _text, _linkHandler, _instantiationService) {
                super();
                this._targetOptions = _targetOptions;
                this._text = _text;
                this._linkHandler = _linkHandler;
                this._instantiationService = _instantiationService;
                this.id = 'hover';
            }
            attach(container) {
                const target = new CellHoverTarget(container, this._targetOptions);
                this._register(this._instantiationService.createInstance(hoverWidget_1.HoverWidget, container, target, this._text, this._linkHandler, []));
            }
        };
        TerminalHover = __decorate([
            __param(3, instantiation_1.IInstantiationService)
        ], TerminalHover);
        return TerminalHover;
    })();
    exports.TerminalHover = TerminalHover;
    class CellHoverTarget extends widget_1.Widget {
        constructor(_container, o) {
            super();
            this._container = _container;
            this._isDisposed = false;
            this._domNode = $('div.terminal-hover-targets');
            const targets = [];
            const rowCount = o.viewportRange.end.y - o.viewportRange.start.y + 1;
            // Add top target row
            const width = (o.viewportRange.end.y > o.viewportRange.start.y ? o.terminalDimensions.width - o.viewportRange.start.x : o.viewportRange.end.x - o.viewportRange.start.x + 1) * o.cellDimensions.width;
            const topTarget = $('div.terminal-hover-target.hoverHighlight');
            topTarget.style.left = `${o.viewportRange.start.x * o.cellDimensions.width}px`;
            topTarget.style.bottom = `${(o.terminalDimensions.height - o.viewportRange.start.y - 1) * o.cellDimensions.height}px`;
            topTarget.style.width = `${width}px`;
            topTarget.style.height = `${o.cellDimensions.height}px`;
            targets.push(this._domNode.appendChild(topTarget));
            // Add middle target rows
            if (rowCount > 2) {
                const middleTarget = $('div.terminal-hover-target.hoverHighlight');
                middleTarget.style.left = `0px`;
                middleTarget.style.bottom = `${(o.terminalDimensions.height - o.viewportRange.start.y - 1 - (rowCount - 2)) * o.cellDimensions.height}px`;
                middleTarget.style.width = `${o.terminalDimensions.width * o.cellDimensions.width}px`;
                middleTarget.style.height = `${(rowCount - 2) * o.cellDimensions.height}px`;
                targets.push(this._domNode.appendChild(middleTarget));
            }
            // Add bottom target row
            if (rowCount > 1) {
                const bottomTarget = $('div.terminal-hover-target.hoverHighlight');
                bottomTarget.style.left = `0px`;
                bottomTarget.style.bottom = `${(o.terminalDimensions.height - o.viewportRange.end.y - 1) * o.cellDimensions.height}px`;
                bottomTarget.style.width = `${(o.viewportRange.end.x + 1) * o.cellDimensions.width}px`;
                bottomTarget.style.height = `${o.cellDimensions.height}px`;
                targets.push(this._domNode.appendChild(bottomTarget));
            }
            this.targetElements = targets;
            if (o.modifierDownCallback && o.modifierUpCallback) {
                let down = false;
                this._register(dom.addDisposableListener(document, 'keydown', e => {
                    if (e.ctrlKey && !down) {
                        down = true;
                        o.modifierDownCallback();
                    }
                }));
                this._register(dom.addDisposableListener(document, 'keyup', e => {
                    if (!e.ctrlKey) {
                        down = false;
                        o.modifierUpCallback();
                    }
                }));
            }
            this._container.appendChild(this._domNode);
        }
        dispose() {
            if (!this._isDisposed) {
                this._container.removeChild(this._domNode);
            }
            this._isDisposed = true;
            super.dispose();
        }
        get anchor() {
            const firstPosition = dom.getDomNodePagePosition(this.targetElements[0]);
            return {
                x: firstPosition.left,
                horizontalAnchorSide: widgets_1.HorizontalAnchorSide.Left,
                y: document.documentElement.clientHeight - firstPosition.top - 1,
                verticalAnchorSide: widgets_1.VerticalAnchorSide.Bottom,
                fallbackY: firstPosition.top + firstPosition.height - 1
            };
        }
    }
});
//# sourceMappingURL=terminalHoverWidget.js.map