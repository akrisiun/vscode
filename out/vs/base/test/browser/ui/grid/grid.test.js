/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/grid/grid", "./util", "vs/base/common/objects"], function (require, exports, assert, grid_1, util_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Simple example:
    //
    //  +-----+---------------+
    //  |  4  |      2        |
    //  +-----+---------+-----+
    //  |        1      |     |
    //  +---------------+  3  |
    //  |        5      |     |
    //  +---------------+-----+
    //
    //  V
    //  +-H
    //  | +-4
    //  | +-2
    //  +-H
    //    +-V
    //    | +-1
    //    | +-5
    //    +-3
    suite('Grid', function () {
        let container;
        setup(function () {
            container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.width = `${800}px`;
            container.style.height = `${600}px`;
        });
        test('getRelativeLocation', () => {
            assert.deepEqual(grid_1.getRelativeLocation(0 /* VERTICAL */, [0], 0 /* Up */), [0]);
            assert.deepEqual(grid_1.getRelativeLocation(0 /* VERTICAL */, [0], 1 /* Down */), [1]);
            assert.deepEqual(grid_1.getRelativeLocation(0 /* VERTICAL */, [0], 2 /* Left */), [0, 0]);
            assert.deepEqual(grid_1.getRelativeLocation(0 /* VERTICAL */, [0], 3 /* Right */), [0, 1]);
            assert.deepEqual(grid_1.getRelativeLocation(1 /* HORIZONTAL */, [0], 0 /* Up */), [0, 0]);
            assert.deepEqual(grid_1.getRelativeLocation(1 /* HORIZONTAL */, [0], 1 /* Down */), [0, 1]);
            assert.deepEqual(grid_1.getRelativeLocation(1 /* HORIZONTAL */, [0], 2 /* Left */), [0]);
            assert.deepEqual(grid_1.getRelativeLocation(1 /* HORIZONTAL */, [0], 3 /* Right */), [1]);
            assert.deepEqual(grid_1.getRelativeLocation(0 /* VERTICAL */, [4], 0 /* Up */), [4]);
            assert.deepEqual(grid_1.getRelativeLocation(0 /* VERTICAL */, [4], 1 /* Down */), [5]);
            assert.deepEqual(grid_1.getRelativeLocation(0 /* VERTICAL */, [4], 2 /* Left */), [4, 0]);
            assert.deepEqual(grid_1.getRelativeLocation(0 /* VERTICAL */, [4], 3 /* Right */), [4, 1]);
            assert.deepEqual(grid_1.getRelativeLocation(0 /* VERTICAL */, [0, 0], 0 /* Up */), [0, 0, 0]);
            assert.deepEqual(grid_1.getRelativeLocation(0 /* VERTICAL */, [0, 0], 1 /* Down */), [0, 0, 1]);
            assert.deepEqual(grid_1.getRelativeLocation(0 /* VERTICAL */, [0, 0], 2 /* Left */), [0, 0]);
            assert.deepEqual(grid_1.getRelativeLocation(0 /* VERTICAL */, [0, 0], 3 /* Right */), [0, 1]);
            assert.deepEqual(grid_1.getRelativeLocation(0 /* VERTICAL */, [1, 2], 0 /* Up */), [1, 2, 0]);
            assert.deepEqual(grid_1.getRelativeLocation(0 /* VERTICAL */, [1, 2], 1 /* Down */), [1, 2, 1]);
            assert.deepEqual(grid_1.getRelativeLocation(0 /* VERTICAL */, [1, 2], 2 /* Left */), [1, 2]);
            assert.deepEqual(grid_1.getRelativeLocation(0 /* VERTICAL */, [1, 2], 3 /* Right */), [1, 3]);
            assert.deepEqual(grid_1.getRelativeLocation(0 /* VERTICAL */, [1, 2, 3], 0 /* Up */), [1, 2, 3]);
            assert.deepEqual(grid_1.getRelativeLocation(0 /* VERTICAL */, [1, 2, 3], 1 /* Down */), [1, 2, 4]);
            assert.deepEqual(grid_1.getRelativeLocation(0 /* VERTICAL */, [1, 2, 3], 2 /* Left */), [1, 2, 3, 0]);
            assert.deepEqual(grid_1.getRelativeLocation(0 /* VERTICAL */, [1, 2, 3], 3 /* Right */), [1, 2, 3, 1]);
        });
        test('empty', () => {
            const view1 = new util_1.TestView(100, Number.MAX_VALUE, 100, Number.MAX_VALUE);
            const gridview = new grid_1.Grid(view1);
            container.appendChild(gridview.element);
            gridview.layout(800, 600);
            assert.deepEqual(view1.size, [800, 600]);
        });
        test('two views vertically', function () {
            const view1 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            const grid = new grid_1.Grid(view1);
            container.appendChild(grid.element);
            grid.layout(800, 600);
            assert.deepEqual(view1.size, [800, 600]);
            const view2 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view2, 200, view1, 0 /* Up */);
            assert.deepEqual(view1.size, [800, 400]);
            assert.deepEqual(view2.size, [800, 200]);
        });
        test('two views horizontally', function () {
            const view1 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            const grid = new grid_1.Grid(view1);
            container.appendChild(grid.element);
            grid.layout(800, 600);
            assert.deepEqual(view1.size, [800, 600]);
            const view2 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view2, 300, view1, 3 /* Right */);
            assert.deepEqual(view1.size, [500, 600]);
            assert.deepEqual(view2.size, [300, 600]);
        });
        test('simple layout', function () {
            const view1 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            const grid = new grid_1.Grid(view1);
            container.appendChild(grid.element);
            grid.layout(800, 600);
            assert.deepEqual(view1.size, [800, 600]);
            const view2 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view2, 200, view1, 0 /* Up */);
            assert.deepEqual(view1.size, [800, 400]);
            assert.deepEqual(view2.size, [800, 200]);
            const view3 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view3, 200, view1, 3 /* Right */);
            assert.deepEqual(view1.size, [600, 400]);
            assert.deepEqual(view2.size, [800, 200]);
            assert.deepEqual(view3.size, [200, 400]);
            const view4 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view4, 200, view2, 2 /* Left */);
            assert.deepEqual(view1.size, [600, 400]);
            assert.deepEqual(view2.size, [600, 200]);
            assert.deepEqual(view3.size, [200, 400]);
            assert.deepEqual(view4.size, [200, 200]);
            const view5 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view5, 100, view1, 1 /* Down */);
            assert.deepEqual(view1.size, [600, 300]);
            assert.deepEqual(view2.size, [600, 200]);
            assert.deepEqual(view3.size, [200, 400]);
            assert.deepEqual(view4.size, [200, 200]);
            assert.deepEqual(view5.size, [600, 100]);
        });
        test('another simple layout with automatic size distribution', function () {
            const view1 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            const grid = new grid_1.Grid(view1);
            container.appendChild(grid.element);
            grid.layout(800, 600);
            assert.deepEqual(view1.size, [800, 600]);
            const view2 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view2, grid_1.Sizing.Distribute, view1, 2 /* Left */);
            assert.deepEqual(view1.size, [400, 600]);
            assert.deepEqual(view2.size, [400, 600]);
            const view3 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view3, grid_1.Sizing.Distribute, view1, 3 /* Right */);
            assert.deepEqual(view1.size, [266, 600]);
            assert.deepEqual(view2.size, [266, 600]);
            assert.deepEqual(view3.size, [268, 600]);
            const view4 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view4, grid_1.Sizing.Distribute, view2, 1 /* Down */);
            assert.deepEqual(view1.size, [266, 600]);
            assert.deepEqual(view2.size, [266, 300]);
            assert.deepEqual(view3.size, [268, 600]);
            assert.deepEqual(view4.size, [266, 300]);
            const view5 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view5, grid_1.Sizing.Distribute, view3, 0 /* Up */);
            assert.deepEqual(view1.size, [266, 600]);
            assert.deepEqual(view2.size, [266, 300]);
            assert.deepEqual(view3.size, [268, 300]);
            assert.deepEqual(view4.size, [266, 300]);
            assert.deepEqual(view5.size, [268, 300]);
            const view6 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view6, grid_1.Sizing.Distribute, view3, 1 /* Down */);
            assert.deepEqual(view1.size, [266, 600]);
            assert.deepEqual(view2.size, [266, 300]);
            assert.deepEqual(view3.size, [268, 200]);
            assert.deepEqual(view4.size, [266, 300]);
            assert.deepEqual(view5.size, [268, 200]);
            assert.deepEqual(view6.size, [268, 200]);
        });
        test('another simple layout with split size distribution', function () {
            const view1 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            const grid = new grid_1.Grid(view1);
            container.appendChild(grid.element);
            grid.layout(800, 600);
            assert.deepEqual(view1.size, [800, 600]);
            const view2 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view2, grid_1.Sizing.Split, view1, 2 /* Left */);
            assert.deepEqual(view1.size, [400, 600]);
            assert.deepEqual(view2.size, [400, 600]);
            const view3 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view3, grid_1.Sizing.Split, view1, 3 /* Right */);
            assert.deepEqual(view1.size, [200, 600]);
            assert.deepEqual(view2.size, [400, 600]);
            assert.deepEqual(view3.size, [200, 600]);
            const view4 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view4, grid_1.Sizing.Split, view2, 1 /* Down */);
            assert.deepEqual(view1.size, [200, 600]);
            assert.deepEqual(view2.size, [400, 300]);
            assert.deepEqual(view3.size, [200, 600]);
            assert.deepEqual(view4.size, [400, 300]);
            const view5 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view5, grid_1.Sizing.Split, view3, 0 /* Up */);
            assert.deepEqual(view1.size, [200, 600]);
            assert.deepEqual(view2.size, [400, 300]);
            assert.deepEqual(view3.size, [200, 300]);
            assert.deepEqual(view4.size, [400, 300]);
            assert.deepEqual(view5.size, [200, 300]);
            const view6 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view6, grid_1.Sizing.Split, view3, 1 /* Down */);
            assert.deepEqual(view1.size, [200, 600]);
            assert.deepEqual(view2.size, [400, 300]);
            assert.deepEqual(view3.size, [200, 150]);
            assert.deepEqual(view4.size, [400, 300]);
            assert.deepEqual(view5.size, [200, 300]);
            assert.deepEqual(view6.size, [200, 150]);
        });
        test('3/2 layout with split', function () {
            const view1 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            const grid = new grid_1.Grid(view1);
            container.appendChild(grid.element);
            grid.layout(800, 600);
            assert.deepEqual(view1.size, [800, 600]);
            const view2 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view2, grid_1.Sizing.Split, view1, 1 /* Down */);
            assert.deepEqual(view1.size, [800, 300]);
            assert.deepEqual(view2.size, [800, 300]);
            const view3 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view3, grid_1.Sizing.Split, view2, 3 /* Right */);
            assert.deepEqual(view1.size, [800, 300]);
            assert.deepEqual(view2.size, [400, 300]);
            assert.deepEqual(view3.size, [400, 300]);
            const view4 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view4, grid_1.Sizing.Split, view1, 3 /* Right */);
            assert.deepEqual(view1.size, [400, 300]);
            assert.deepEqual(view2.size, [400, 300]);
            assert.deepEqual(view3.size, [400, 300]);
            assert.deepEqual(view4.size, [400, 300]);
            const view5 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view5, grid_1.Sizing.Split, view1, 3 /* Right */);
            assert.deepEqual(view1.size, [200, 300]);
            assert.deepEqual(view2.size, [400, 300]);
            assert.deepEqual(view3.size, [400, 300]);
            assert.deepEqual(view4.size, [400, 300]);
            assert.deepEqual(view5.size, [200, 300]);
        });
        test('sizing should be correct after branch demotion #50564', function () {
            const view1 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            const grid = new grid_1.Grid(view1);
            container.appendChild(grid.element);
            grid.layout(800, 600);
            const view2 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view2, grid_1.Sizing.Split, view1, 3 /* Right */);
            const view3 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view3, grid_1.Sizing.Split, view2, 1 /* Down */);
            const view4 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view4, grid_1.Sizing.Split, view2, 3 /* Right */);
            assert.deepEqual(view1.size, [400, 600]);
            assert.deepEqual(view2.size, [200, 300]);
            assert.deepEqual(view3.size, [400, 300]);
            assert.deepEqual(view4.size, [200, 300]);
            grid.removeView(view3);
            assert.deepEqual(view1.size, [400, 600]);
            assert.deepEqual(view2.size, [200, 600]);
            assert.deepEqual(view4.size, [200, 600]);
        });
        test('sizing should be correct after branch demotion #50675', function () {
            const view1 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            const grid = new grid_1.Grid(view1);
            container.appendChild(grid.element);
            grid.layout(800, 600);
            const view2 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view2, grid_1.Sizing.Distribute, view1, 1 /* Down */);
            const view3 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view3, grid_1.Sizing.Distribute, view2, 1 /* Down */);
            const view4 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view4, grid_1.Sizing.Distribute, view3, 3 /* Right */);
            assert.deepEqual(view1.size, [800, 200]);
            assert.deepEqual(view2.size, [800, 200]);
            assert.deepEqual(view3.size, [400, 200]);
            assert.deepEqual(view4.size, [400, 200]);
            grid.removeView(view3, grid_1.Sizing.Distribute);
            assert.deepEqual(view1.size, [800, 200]);
            assert.deepEqual(view2.size, [800, 200]);
            assert.deepEqual(view4.size, [800, 200]);
        });
        test('getNeighborViews should work on single view layout', function () {
            const view1 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            const grid = new grid_1.Grid(view1);
            container.appendChild(grid.element);
            grid.layout(800, 600);
            assert.deepEqual(grid.getNeighborViews(view1, 0 /* Up */), []);
            assert.deepEqual(grid.getNeighborViews(view1, 3 /* Right */), []);
            assert.deepEqual(grid.getNeighborViews(view1, 1 /* Down */), []);
            assert.deepEqual(grid.getNeighborViews(view1, 2 /* Left */), []);
            assert.deepEqual(grid.getNeighborViews(view1, 0 /* Up */, true), [view1]);
            assert.deepEqual(grid.getNeighborViews(view1, 3 /* Right */, true), [view1]);
            assert.deepEqual(grid.getNeighborViews(view1, 1 /* Down */, true), [view1]);
            assert.deepEqual(grid.getNeighborViews(view1, 2 /* Left */, true), [view1]);
        });
        test('getNeighborViews should work on simple layout', function () {
            const view1 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            const grid = new grid_1.Grid(view1);
            container.appendChild(grid.element);
            grid.layout(800, 600);
            const view2 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view2, grid_1.Sizing.Distribute, view1, 1 /* Down */);
            const view3 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view3, grid_1.Sizing.Distribute, view2, 1 /* Down */);
            assert.deepEqual(grid.getNeighborViews(view1, 0 /* Up */), []);
            assert.deepEqual(grid.getNeighborViews(view1, 3 /* Right */), []);
            assert.deepEqual(grid.getNeighborViews(view1, 1 /* Down */), [view2]);
            assert.deepEqual(grid.getNeighborViews(view1, 2 /* Left */), []);
            assert.deepEqual(grid.getNeighborViews(view1, 0 /* Up */, true), [view3]);
            assert.deepEqual(grid.getNeighborViews(view1, 3 /* Right */, true), [view1]);
            assert.deepEqual(grid.getNeighborViews(view1, 1 /* Down */, true), [view2]);
            assert.deepEqual(grid.getNeighborViews(view1, 2 /* Left */, true), [view1]);
            assert.deepEqual(grid.getNeighborViews(view2, 0 /* Up */), [view1]);
            assert.deepEqual(grid.getNeighborViews(view2, 3 /* Right */), []);
            assert.deepEqual(grid.getNeighborViews(view2, 1 /* Down */), [view3]);
            assert.deepEqual(grid.getNeighborViews(view2, 2 /* Left */), []);
            assert.deepEqual(grid.getNeighborViews(view2, 0 /* Up */, true), [view1]);
            assert.deepEqual(grid.getNeighborViews(view2, 3 /* Right */, true), [view2]);
            assert.deepEqual(grid.getNeighborViews(view2, 1 /* Down */, true), [view3]);
            assert.deepEqual(grid.getNeighborViews(view2, 2 /* Left */, true), [view2]);
            assert.deepEqual(grid.getNeighborViews(view3, 0 /* Up */), [view2]);
            assert.deepEqual(grid.getNeighborViews(view3, 3 /* Right */), []);
            assert.deepEqual(grid.getNeighborViews(view3, 1 /* Down */), []);
            assert.deepEqual(grid.getNeighborViews(view3, 2 /* Left */), []);
            assert.deepEqual(grid.getNeighborViews(view3, 0 /* Up */, true), [view2]);
            assert.deepEqual(grid.getNeighborViews(view3, 3 /* Right */, true), [view3]);
            assert.deepEqual(grid.getNeighborViews(view3, 1 /* Down */, true), [view1]);
            assert.deepEqual(grid.getNeighborViews(view3, 2 /* Left */, true), [view3]);
        });
        test('getNeighborViews should work on a complex layout', function () {
            const view1 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            const grid = new grid_1.Grid(view1);
            container.appendChild(grid.element);
            grid.layout(800, 600);
            const view2 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view2, grid_1.Sizing.Distribute, view1, 1 /* Down */);
            const view3 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view3, grid_1.Sizing.Distribute, view2, 1 /* Down */);
            const view4 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view4, grid_1.Sizing.Distribute, view2, 3 /* Right */);
            const view5 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view5, grid_1.Sizing.Distribute, view4, 1 /* Down */);
            assert.deepEqual(grid.getNeighborViews(view1, 0 /* Up */), []);
            assert.deepEqual(grid.getNeighborViews(view1, 3 /* Right */), []);
            assert.deepEqual(grid.getNeighborViews(view1, 1 /* Down */), [view2, view4]);
            assert.deepEqual(grid.getNeighborViews(view1, 2 /* Left */), []);
            assert.deepEqual(grid.getNeighborViews(view2, 0 /* Up */), [view1]);
            assert.deepEqual(grid.getNeighborViews(view2, 3 /* Right */), [view4, view5]);
            assert.deepEqual(grid.getNeighborViews(view2, 1 /* Down */), [view3]);
            assert.deepEqual(grid.getNeighborViews(view2, 2 /* Left */), []);
            assert.deepEqual(grid.getNeighborViews(view4, 0 /* Up */), [view1]);
            assert.deepEqual(grid.getNeighborViews(view4, 3 /* Right */), []);
            assert.deepEqual(grid.getNeighborViews(view4, 1 /* Down */), [view5]);
            assert.deepEqual(grid.getNeighborViews(view4, 2 /* Left */), [view2]);
            assert.deepEqual(grid.getNeighborViews(view5, 0 /* Up */), [view4]);
            assert.deepEqual(grid.getNeighborViews(view5, 3 /* Right */), []);
            assert.deepEqual(grid.getNeighborViews(view5, 1 /* Down */), [view3]);
            assert.deepEqual(grid.getNeighborViews(view5, 2 /* Left */), [view2]);
            assert.deepEqual(grid.getNeighborViews(view3, 0 /* Up */), [view2, view5]);
            assert.deepEqual(grid.getNeighborViews(view3, 3 /* Right */), []);
            assert.deepEqual(grid.getNeighborViews(view3, 1 /* Down */), []);
            assert.deepEqual(grid.getNeighborViews(view3, 2 /* Left */), []);
        });
        test('getNeighborViews should work on another simple layout', function () {
            const view1 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            const grid = new grid_1.Grid(view1);
            container.appendChild(grid.element);
            grid.layout(800, 600);
            const view2 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view2, grid_1.Sizing.Distribute, view1, 3 /* Right */);
            const view3 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view3, grid_1.Sizing.Distribute, view2, 1 /* Down */);
            const view4 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view4, grid_1.Sizing.Distribute, view2, 3 /* Right */);
            assert.deepEqual(grid.getNeighborViews(view4, 0 /* Up */), []);
            assert.deepEqual(grid.getNeighborViews(view4, 3 /* Right */), []);
            assert.deepEqual(grid.getNeighborViews(view4, 1 /* Down */), [view3]);
            assert.deepEqual(grid.getNeighborViews(view4, 2 /* Left */), [view2]);
        });
        test('getNeighborViews should only return immediate neighbors', function () {
            const view1 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            const grid = new grid_1.Grid(view1);
            container.appendChild(grid.element);
            grid.layout(800, 600);
            const view2 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view2, grid_1.Sizing.Distribute, view1, 3 /* Right */);
            const view3 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view3, grid_1.Sizing.Distribute, view2, 1 /* Down */);
            const view4 = new util_1.TestView(50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view4, grid_1.Sizing.Distribute, view2, 3 /* Right */);
            assert.deepEqual(grid.getNeighborViews(view1, 3 /* Right */), [view2, view3]);
        });
    });
    class TestSerializableView extends util_1.TestView {
        constructor(name, minimumWidth, maximumWidth, minimumHeight, maximumHeight) {
            super(minimumWidth, maximumWidth, minimumHeight, maximumHeight);
            this.name = name;
        }
        toJSON() {
            return { name: this.name };
        }
    }
    class TestViewDeserializer {
        constructor() {
            this.views = new Map();
        }
        fromJSON(json) {
            const view = new TestSerializableView(json.name, 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            this.views.set(json.name, view);
            return view;
        }
        getView(id) {
            const view = this.views.get(id);
            if (!view) {
                throw new Error('Unknown view');
            }
            return view;
        }
    }
    function nodesToNames(node) {
        if (grid_1.isGridBranchNode(node)) {
            return node.children.map(nodesToNames);
        }
        else {
            return node.view.name;
        }
    }
    suite('SerializableGrid', function () {
        let container;
        setup(function () {
            container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.width = `${800}px`;
            container.style.height = `${600}px`;
        });
        test('serialize empty', function () {
            const view1 = new TestSerializableView('view1', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            const grid = new grid_1.SerializableGrid(view1);
            container.appendChild(grid.element);
            grid.layout(800, 600);
            const actual = grid.serialize();
            assert.deepEqual(actual, {
                orientation: 0,
                width: 800,
                height: 600,
                root: {
                    type: 'branch',
                    data: [
                        {
                            type: 'leaf',
                            data: {
                                name: 'view1',
                            },
                            size: 600
                        }
                    ],
                    size: 800
                }
            });
        });
        test('serialize simple layout', function () {
            const view1 = new TestSerializableView('view1', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            const grid = new grid_1.SerializableGrid(view1);
            container.appendChild(grid.element);
            grid.layout(800, 600);
            const view2 = new TestSerializableView('view2', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view2, 200, view1, 0 /* Up */);
            const view3 = new TestSerializableView('view3', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view3, 200, view1, 3 /* Right */);
            const view4 = new TestSerializableView('view4', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view4, 200, view2, 2 /* Left */);
            const view5 = new TestSerializableView('view5', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view5, 100, view1, 1 /* Down */);
            assert.deepEqual(grid.serialize(), {
                orientation: 0,
                width: 800,
                height: 600,
                root: {
                    type: 'branch',
                    data: [
                        {
                            type: 'branch',
                            data: [
                                { type: 'leaf', data: { name: 'view4' }, size: 200 },
                                { type: 'leaf', data: { name: 'view2' }, size: 600 }
                            ],
                            size: 200
                        },
                        {
                            type: 'branch',
                            data: [
                                {
                                    type: 'branch',
                                    data: [
                                        { type: 'leaf', data: { name: 'view1' }, size: 300 },
                                        { type: 'leaf', data: { name: 'view5' }, size: 100 }
                                    ],
                                    size: 600
                                },
                                { type: 'leaf', data: { name: 'view3' }, size: 200 }
                            ],
                            size: 400
                        }
                    ],
                    size: 800
                }
            });
        });
        test('deserialize empty', function () {
            const view1 = new TestSerializableView('view1', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            const grid = new grid_1.SerializableGrid(view1);
            container.appendChild(grid.element);
            grid.layout(800, 600);
            const json = grid.serialize();
            grid.dispose();
            const deserializer = new TestViewDeserializer();
            const grid2 = grid_1.SerializableGrid.deserialize(json, deserializer);
            grid2.layout(800, 600);
            assert.deepEqual(nodesToNames(grid2.getViews()), ['view1']);
        });
        test('deserialize simple layout', function () {
            const view1 = new TestSerializableView('view1', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            const grid = new grid_1.SerializableGrid(view1);
            container.appendChild(grid.element);
            grid.layout(800, 600);
            const view2 = new TestSerializableView('view2', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view2, 200, view1, 0 /* Up */);
            const view3 = new TestSerializableView('view3', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view3, 200, view1, 3 /* Right */);
            const view4 = new TestSerializableView('view4', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view4, 200, view2, 2 /* Left */);
            const view5 = new TestSerializableView('view5', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view5, 100, view1, 1 /* Down */);
            const json = grid.serialize();
            grid.dispose();
            const deserializer = new TestViewDeserializer();
            const grid2 = grid_1.SerializableGrid.deserialize(json, deserializer);
            const view1Copy = deserializer.getView('view1');
            const view2Copy = deserializer.getView('view2');
            const view3Copy = deserializer.getView('view3');
            const view4Copy = deserializer.getView('view4');
            const view5Copy = deserializer.getView('view5');
            assert.deepEqual(util_1.nodesToArrays(grid2.getViews()), [[view4Copy, view2Copy], [[view1Copy, view5Copy], view3Copy]]);
            grid2.layout(800, 600);
            assert.deepEqual(view1Copy.size, [600, 300]);
            assert.deepEqual(view2Copy.size, [600, 200]);
            assert.deepEqual(view3Copy.size, [200, 400]);
            assert.deepEqual(view4Copy.size, [200, 200]);
            assert.deepEqual(view5Copy.size, [600, 100]);
        });
        test('deserialize simple layout with scaling', function () {
            const view1 = new TestSerializableView('view1', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            const grid = new grid_1.SerializableGrid(view1);
            container.appendChild(grid.element);
            grid.layout(800, 600);
            const view2 = new TestSerializableView('view2', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view2, 200, view1, 0 /* Up */);
            const view3 = new TestSerializableView('view3', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view3, 200, view1, 3 /* Right */);
            const view4 = new TestSerializableView('view4', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view4, 200, view2, 2 /* Left */);
            const view5 = new TestSerializableView('view5', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view5, 100, view1, 1 /* Down */);
            const json = grid.serialize();
            grid.dispose();
            const deserializer = new TestViewDeserializer();
            const grid2 = grid_1.SerializableGrid.deserialize(json, deserializer);
            const view1Copy = deserializer.getView('view1');
            const view2Copy = deserializer.getView('view2');
            const view3Copy = deserializer.getView('view3');
            const view4Copy = deserializer.getView('view4');
            const view5Copy = deserializer.getView('view5');
            grid2.layout(400, 800); // [/2, *4/3]
            assert.deepEqual(view1Copy.size, [300, 400]);
            assert.deepEqual(view2Copy.size, [300, 267]);
            assert.deepEqual(view3Copy.size, [100, 533]);
            assert.deepEqual(view4Copy.size, [100, 267]);
            assert.deepEqual(view5Copy.size, [300, 133]);
        });
        test('deserialize 4 view layout (ben issue #2)', function () {
            const view1 = new TestSerializableView('view1', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            const grid = new grid_1.SerializableGrid(view1);
            container.appendChild(grid.element);
            grid.layout(800, 600);
            const view2 = new TestSerializableView('view2', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view2, grid_1.Sizing.Split, view1, 1 /* Down */);
            const view3 = new TestSerializableView('view3', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view3, grid_1.Sizing.Split, view2, 1 /* Down */);
            const view4 = new TestSerializableView('view4', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view4, grid_1.Sizing.Split, view3, 3 /* Right */);
            const json = grid.serialize();
            grid.dispose();
            const deserializer = new TestViewDeserializer();
            const grid2 = grid_1.SerializableGrid.deserialize(json, deserializer);
            const view1Copy = deserializer.getView('view1');
            const view2Copy = deserializer.getView('view2');
            const view3Copy = deserializer.getView('view3');
            const view4Copy = deserializer.getView('view4');
            grid2.layout(800, 600);
            assert.deepEqual(view1Copy.size, [800, 300]);
            assert.deepEqual(view2Copy.size, [800, 150]);
            assert.deepEqual(view3Copy.size, [400, 150]);
            assert.deepEqual(view4Copy.size, [400, 150]);
        });
        test('deserialize 2 view layout (ben issue #3)', function () {
            const view1 = new TestSerializableView('view1', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            const grid = new grid_1.SerializableGrid(view1);
            container.appendChild(grid.element);
            grid.layout(800, 600);
            const view2 = new TestSerializableView('view2', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view2, grid_1.Sizing.Split, view1, 3 /* Right */);
            const json = grid.serialize();
            grid.dispose();
            const deserializer = new TestViewDeserializer();
            const grid2 = grid_1.SerializableGrid.deserialize(json, deserializer);
            const view1Copy = deserializer.getView('view1');
            const view2Copy = deserializer.getView('view2');
            grid2.layout(800, 600);
            assert.deepEqual(view1Copy.size, [400, 600]);
            assert.deepEqual(view2Copy.size, [400, 600]);
        });
        test('deserialize simple view layout #50609', function () {
            const view1 = new TestSerializableView('view1', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            const grid = new grid_1.SerializableGrid(view1);
            container.appendChild(grid.element);
            grid.layout(800, 600);
            const view2 = new TestSerializableView('view2', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view2, grid_1.Sizing.Split, view1, 3 /* Right */);
            const view3 = new TestSerializableView('view3', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view3, grid_1.Sizing.Split, view2, 1 /* Down */);
            grid.removeView(view1, grid_1.Sizing.Split);
            const json = grid.serialize();
            grid.dispose();
            const deserializer = new TestViewDeserializer();
            const grid2 = grid_1.SerializableGrid.deserialize(json, deserializer);
            const view2Copy = deserializer.getView('view2');
            const view3Copy = deserializer.getView('view3');
            grid2.layout(800, 600);
            assert.deepEqual(view2Copy.size, [800, 300]);
            assert.deepEqual(view3Copy.size, [800, 300]);
        });
        test('sanitizeGridNodeDescriptor', () => {
            const nodeDescriptor = { groups: [{ size: 0.2 }, { size: 0.2 }, { size: 0.6, groups: [{}, {}] }] };
            const nodeDescriptorCopy = objects_1.deepClone(nodeDescriptor);
            grid_1.sanitizeGridNodeDescriptor(nodeDescriptorCopy);
            assert.deepEqual(nodeDescriptorCopy, { groups: [{ size: 0.2 }, { size: 0.2 }, { size: 0.6, groups: [{ size: 0.5 }, { size: 0.5 }] }] });
        });
        test('createSerializedGrid', () => {
            const gridDescriptor = { orientation: 0 /* VERTICAL */, groups: [{ size: 0.2 }, { size: 0.2 }, { size: 0.6, groups: [{}, {}] }] };
            const serializedGrid = grid_1.createSerializedGrid(gridDescriptor);
            assert.deepEqual(serializedGrid, {
                root: {
                    type: 'branch',
                    size: undefined,
                    data: [
                        { type: 'leaf', size: 0.2, data: null },
                        { type: 'leaf', size: 0.2, data: null },
                        {
                            type: 'branch', size: 0.6, data: [
                                { type: 'leaf', size: 0.5, data: null },
                                { type: 'leaf', size: 0.5, data: null }
                            ]
                        }
                    ]
                },
                orientation: 0 /* VERTICAL */,
                width: 1,
                height: 1
            });
        });
        test('serialize should store visibility and previous size', function () {
            const view1 = new TestSerializableView('view1', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            const grid = new grid_1.SerializableGrid(view1);
            container.appendChild(grid.element);
            grid.layout(800, 600);
            const view2 = new TestSerializableView('view2', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view2, 200, view1, 0 /* Up */);
            const view3 = new TestSerializableView('view3', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view3, 200, view1, 3 /* Right */);
            const view4 = new TestSerializableView('view4', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view4, 200, view2, 2 /* Left */);
            const view5 = new TestSerializableView('view5', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view5, 100, view1, 1 /* Down */);
            assert.deepEqual(view1.size, [600, 300]);
            assert.deepEqual(view2.size, [600, 200]);
            assert.deepEqual(view3.size, [200, 400]);
            assert.deepEqual(view4.size, [200, 200]);
            assert.deepEqual(view5.size, [600, 100]);
            grid.setViewVisible(view5, false);
            assert.deepEqual(view1.size, [600, 400]);
            assert.deepEqual(view2.size, [600, 200]);
            assert.deepEqual(view3.size, [200, 400]);
            assert.deepEqual(view4.size, [200, 200]);
            assert.deepEqual(view5.size, [600, 0]);
            grid.setViewVisible(view5, true);
            assert.deepEqual(view1.size, [600, 300]);
            assert.deepEqual(view2.size, [600, 200]);
            assert.deepEqual(view3.size, [200, 400]);
            assert.deepEqual(view4.size, [200, 200]);
            assert.deepEqual(view5.size, [600, 100]);
            grid.setViewVisible(view5, false);
            assert.deepEqual(view1.size, [600, 400]);
            assert.deepEqual(view2.size, [600, 200]);
            assert.deepEqual(view3.size, [200, 400]);
            assert.deepEqual(view4.size, [200, 200]);
            assert.deepEqual(view5.size, [600, 0]);
            grid.setViewVisible(view5, false);
            const json = grid.serialize();
            assert.deepEqual(json, {
                orientation: 0,
                width: 800,
                height: 600,
                root: {
                    type: 'branch',
                    data: [
                        {
                            type: 'branch',
                            data: [
                                { type: 'leaf', data: { name: 'view4' }, size: 200 },
                                { type: 'leaf', data: { name: 'view2' }, size: 600 }
                            ],
                            size: 200
                        },
                        {
                            type: 'branch',
                            data: [
                                {
                                    type: 'branch',
                                    data: [
                                        { type: 'leaf', data: { name: 'view1' }, size: 400 },
                                        { type: 'leaf', data: { name: 'view5' }, size: 100, visible: false }
                                    ],
                                    size: 600
                                },
                                { type: 'leaf', data: { name: 'view3' }, size: 200 }
                            ],
                            size: 400
                        }
                    ],
                    size: 800
                }
            });
            grid.dispose();
            const deserializer = new TestViewDeserializer();
            const grid2 = grid_1.SerializableGrid.deserialize(json, deserializer);
            const view1Copy = deserializer.getView('view1');
            const view2Copy = deserializer.getView('view2');
            const view3Copy = deserializer.getView('view3');
            const view4Copy = deserializer.getView('view4');
            const view5Copy = deserializer.getView('view5');
            assert.deepEqual(util_1.nodesToArrays(grid2.getViews()), [[view4Copy, view2Copy], [[view1Copy, view5Copy], view3Copy]]);
            grid2.layout(800, 600);
            assert.deepEqual(view1Copy.size, [600, 400]);
            assert.deepEqual(view2Copy.size, [600, 200]);
            assert.deepEqual(view3Copy.size, [200, 400]);
            assert.deepEqual(view4Copy.size, [200, 200]);
            assert.deepEqual(view5Copy.size, [600, 0]);
            assert.deepEqual(grid2.isViewVisible(view1Copy), true);
            assert.deepEqual(grid2.isViewVisible(view2Copy), true);
            assert.deepEqual(grid2.isViewVisible(view3Copy), true);
            assert.deepEqual(grid2.isViewVisible(view4Copy), true);
            assert.deepEqual(grid2.isViewVisible(view5Copy), false);
            grid2.setViewVisible(view5Copy, true);
            assert.deepEqual(view1Copy.size, [600, 300]);
            assert.deepEqual(view2Copy.size, [600, 200]);
            assert.deepEqual(view3Copy.size, [200, 400]);
            assert.deepEqual(view4Copy.size, [200, 200]);
            assert.deepEqual(view5Copy.size, [600, 100]);
            assert.deepEqual(grid2.isViewVisible(view1Copy), true);
            assert.deepEqual(grid2.isViewVisible(view2Copy), true);
            assert.deepEqual(grid2.isViewVisible(view3Copy), true);
            assert.deepEqual(grid2.isViewVisible(view4Copy), true);
            assert.deepEqual(grid2.isViewVisible(view5Copy), true);
        });
        test('serialize should store visibility and previous size even for first leaf', function () {
            const view1 = new TestSerializableView('view1', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            const grid = new grid_1.SerializableGrid(view1);
            container.appendChild(grid.element);
            grid.layout(800, 600);
            const view2 = new TestSerializableView('view2', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view2, 200, view1, 0 /* Up */);
            const view3 = new TestSerializableView('view3', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view3, 200, view1, 3 /* Right */);
            const view4 = new TestSerializableView('view4', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view4, 200, view2, 2 /* Left */);
            const view5 = new TestSerializableView('view5', 50, Number.MAX_VALUE, 50, Number.MAX_VALUE);
            grid.addView(view5, 100, view1, 1 /* Down */);
            assert.deepEqual(view1.size, [600, 300]);
            assert.deepEqual(view2.size, [600, 200]);
            assert.deepEqual(view3.size, [200, 400]);
            assert.deepEqual(view4.size, [200, 200]);
            assert.deepEqual(view5.size, [600, 100]);
            grid.setViewVisible(view4, false);
            assert.deepEqual(view1.size, [600, 300]);
            assert.deepEqual(view2.size, [800, 200]);
            assert.deepEqual(view3.size, [200, 400]);
            assert.deepEqual(view4.size, [0, 200]);
            assert.deepEqual(view5.size, [600, 100]);
            const json = grid.serialize();
            assert.deepEqual(json, {
                orientation: 0,
                width: 800,
                height: 600,
                root: {
                    type: 'branch',
                    data: [
                        {
                            type: 'branch',
                            data: [
                                { type: 'leaf', data: { name: 'view4' }, size: 200, visible: false },
                                { type: 'leaf', data: { name: 'view2' }, size: 800 }
                            ],
                            size: 200
                        },
                        {
                            type: 'branch',
                            data: [
                                {
                                    type: 'branch',
                                    data: [
                                        { type: 'leaf', data: { name: 'view1' }, size: 300 },
                                        { type: 'leaf', data: { name: 'view5' }, size: 100 }
                                    ],
                                    size: 600
                                },
                                { type: 'leaf', data: { name: 'view3' }, size: 200 }
                            ],
                            size: 400
                        }
                    ],
                    size: 800
                }
            });
            grid.dispose();
            const deserializer = new TestViewDeserializer();
            const grid2 = grid_1.SerializableGrid.deserialize(json, deserializer);
            const view1Copy = deserializer.getView('view1');
            const view2Copy = deserializer.getView('view2');
            const view3Copy = deserializer.getView('view3');
            const view4Copy = deserializer.getView('view4');
            const view5Copy = deserializer.getView('view5');
            assert.deepEqual(util_1.nodesToArrays(grid2.getViews()), [[view4Copy, view2Copy], [[view1Copy, view5Copy], view3Copy]]);
            grid2.layout(800, 600);
            assert.deepEqual(view1Copy.size, [600, 300]);
            assert.deepEqual(view2Copy.size, [800, 200]);
            assert.deepEqual(view3Copy.size, [200, 400]);
            assert.deepEqual(view4Copy.size, [0, 200]);
            assert.deepEqual(view5Copy.size, [600, 100]);
            assert.deepEqual(grid2.isViewVisible(view1Copy), true);
            assert.deepEqual(grid2.isViewVisible(view2Copy), true);
            assert.deepEqual(grid2.isViewVisible(view3Copy), true);
            assert.deepEqual(grid2.isViewVisible(view4Copy), false);
            assert.deepEqual(grid2.isViewVisible(view5Copy), true);
            grid2.setViewVisible(view4Copy, true);
            assert.deepEqual(view1Copy.size, [600, 300]);
            assert.deepEqual(view2Copy.size, [600, 200]);
            assert.deepEqual(view3Copy.size, [200, 400]);
            assert.deepEqual(view4Copy.size, [200, 200]);
            assert.deepEqual(view5Copy.size, [600, 100]);
            assert.deepEqual(grid2.isViewVisible(view1Copy), true);
            assert.deepEqual(grid2.isViewVisible(view2Copy), true);
            assert.deepEqual(grid2.isViewVisible(view3Copy), true);
            assert.deepEqual(grid2.isViewVisible(view4Copy), true);
            assert.deepEqual(grid2.isViewVisible(view5Copy), true);
        });
    });
});
//# sourceMappingURL=grid.test.js.map