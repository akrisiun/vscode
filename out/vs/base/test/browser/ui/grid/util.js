/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/browser/ui/grid/gridview"], function (require, exports, assert, event_1, gridview_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestView {
        constructor(_minimumWidth, _maximumWidth, _minimumHeight, _maximumHeight) {
            this._minimumWidth = _minimumWidth;
            this._maximumWidth = _maximumWidth;
            this._minimumHeight = _minimumHeight;
            this._maximumHeight = _maximumHeight;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._element = document.createElement('div');
            this._onDidGetElement = new event_1.Emitter();
            this.onDidGetElement = this._onDidGetElement.event;
            this._width = 0;
            this._height = 0;
            this._onDidLayout = new event_1.Emitter();
            this.onDidLayout = this._onDidLayout.event;
            this._onDidFocus = new event_1.Emitter();
            this.onDidFocus = this._onDidFocus.event;
            assert(_minimumWidth <= _maximumWidth, 'gridview view minimum width must be <= maximum width');
            assert(_minimumHeight <= _maximumHeight, 'gridview view minimum height must be <= maximum height');
        }
        get minimumWidth() { return this._minimumWidth; }
        set minimumWidth(size) { this._minimumWidth = size; this._onDidChange.fire(undefined); }
        get maximumWidth() { return this._maximumWidth; }
        set maximumWidth(size) { this._maximumWidth = size; this._onDidChange.fire(undefined); }
        get minimumHeight() { return this._minimumHeight; }
        set minimumHeight(size) { this._minimumHeight = size; this._onDidChange.fire(undefined); }
        get maximumHeight() { return this._maximumHeight; }
        set maximumHeight(size) { this._maximumHeight = size; this._onDidChange.fire(undefined); }
        get element() { this._onDidGetElement.fire(); return this._element; }
        get width() { return this._width; }
        get height() { return this._height; }
        get size() { return [this.width, this.height]; }
        layout(width, height) {
            this._width = width;
            this._height = height;
            this._onDidLayout.fire({ width, height });
        }
        focus() {
            this._onDidFocus.fire();
        }
        dispose() {
            this._onDidChange.dispose();
            this._onDidGetElement.dispose();
            this._onDidLayout.dispose();
            this._onDidFocus.dispose();
        }
    }
    exports.TestView = TestView;
    function nodesToArrays(node) {
        if (gridview_1.isGridBranchNode(node)) {
            return node.children.map(nodesToArrays);
        }
        else {
            return node.view;
        }
    }
    exports.nodesToArrays = nodesToArrays;
});
//# sourceMappingURL=util.js.map