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
define(["require", "exports", "vs/base/browser/ui/contextview/contextview", "vs/base/common/lifecycle", "vs/platform/layout/browser/layoutService"], function (require, exports, contextview_1, lifecycle_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ContextViewService = class ContextViewService extends lifecycle_1.Disposable {
        constructor(layoutService) {
            super();
            this.layoutService = layoutService;
            this.contextView = this._register(new contextview_1.ContextView(layoutService.container));
            this.layout();
            this._register(layoutService.onLayout(() => this.layout()));
        }
        // ContextView
        setContainer(container) {
            this.contextView.setContainer(container);
        }
        showContextView(delegate) {
            this.contextView.show(delegate);
        }
        layout() {
            this.contextView.layout();
        }
        hideContextView(data) {
            this.contextView.hide(data);
        }
    };
    ContextViewService = __decorate([
        __param(0, layoutService_1.ILayoutService)
    ], ContextViewService);
    exports.ContextViewService = ContextViewService;
});
//# sourceMappingURL=contextViewService.js.map