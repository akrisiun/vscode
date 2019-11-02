/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/dom", "vs/base/browser/ui/grid/gridview", "./util"], function (require, exports, assert, dom_1, gridview_1, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Gridview', function () {
        let gridview;
        setup(function () {
            gridview = new gridview_1.GridView();
            const container = dom_1.$('.container');
            container.style.position = 'absolute';
            container.style.width = `${200}px`;
            container.style.height = `${200}px`;
            container.appendChild(gridview.element);
        });
        test('empty gridview is empty', function () {
            assert.deepEqual(util_1.nodesToArrays(gridview.getView()), []);
            gridview.dispose();
        });
        test('gridview addView', function () {
            const view = new util_1.TestView(20, 20, 20, 20);
            assert.throws(() => gridview.addView(view, 200, []), 'empty location');
            assert.throws(() => gridview.addView(view, 200, [1]), 'index overflow');
            assert.throws(() => gridview.addView(view, 200, [0, 0]), 'hierarchy overflow');
            const views = [
                new util_1.TestView(20, 20, 20, 20),
                new util_1.TestView(20, 20, 20, 20),
                new util_1.TestView(20, 20, 20, 20)
            ];
            gridview.addView(views[0], 200, [0]);
            gridview.addView(views[1], 200, [1]);
            gridview.addView(views[2], 200, [2]);
            assert.deepEqual(util_1.nodesToArrays(gridview.getView()), views);
            gridview.dispose();
        });
        test('gridview addView nested', function () {
            const views = [
                new util_1.TestView(20, 20, 20, 20),
                [
                    new util_1.TestView(20, 20, 20, 20),
                    new util_1.TestView(20, 20, 20, 20)
                ]
            ];
            gridview.addView(views[0], 200, [0]);
            gridview.addView(views[1][0], 200, [1]);
            gridview.addView(views[1][1], 200, [1, 1]);
            assert.deepEqual(util_1.nodesToArrays(gridview.getView()), views);
            gridview.dispose();
        });
        test('gridview addView deep nested', function () {
            const view1 = new util_1.TestView(20, 20, 20, 20);
            gridview.addView(view1, 200, [0]);
            assert.deepEqual(util_1.nodesToArrays(gridview.getView()), [view1]);
            const view2 = new util_1.TestView(20, 20, 20, 20);
            gridview.addView(view2, 200, [1]);
            assert.deepEqual(util_1.nodesToArrays(gridview.getView()), [view1, view2]);
            const view3 = new util_1.TestView(20, 20, 20, 20);
            gridview.addView(view3, 200, [1, 0]);
            assert.deepEqual(util_1.nodesToArrays(gridview.getView()), [view1, [view3, view2]]);
            const view4 = new util_1.TestView(20, 20, 20, 20);
            gridview.addView(view4, 200, [1, 0, 0]);
            assert.deepEqual(util_1.nodesToArrays(gridview.getView()), [view1, [[view4, view3], view2]]);
            const view5 = new util_1.TestView(20, 20, 20, 20);
            gridview.addView(view5, 200, [1, 0]);
            assert.deepEqual(util_1.nodesToArrays(gridview.getView()), [view1, [view5, [view4, view3], view2]]);
            const view6 = new util_1.TestView(20, 20, 20, 20);
            gridview.addView(view6, 200, [2]);
            assert.deepEqual(util_1.nodesToArrays(gridview.getView()), [view1, [view5, [view4, view3], view2], view6]);
            const view7 = new util_1.TestView(20, 20, 20, 20);
            gridview.addView(view7, 200, [1, 1]);
            assert.deepEqual(util_1.nodesToArrays(gridview.getView()), [view1, [view5, view7, [view4, view3], view2], view6]);
            const view8 = new util_1.TestView(20, 20, 20, 20);
            gridview.addView(view8, 200, [1, 1, 0]);
            assert.deepEqual(util_1.nodesToArrays(gridview.getView()), [view1, [view5, [view8, view7], [view4, view3], view2], view6]);
            gridview.dispose();
        });
        test('simple layout', function () {
            gridview.layout(800, 600);
            const view1 = new util_1.TestView(50, Number.POSITIVE_INFINITY, 50, Number.POSITIVE_INFINITY);
            gridview.addView(view1, 200, [0]);
            assert.deepEqual(view1.size, [800, 600]);
            assert.deepEqual(gridview.getViewSize([0]), { width: 800, height: 600 });
            const view2 = new util_1.TestView(50, Number.POSITIVE_INFINITY, 50, Number.POSITIVE_INFINITY);
            gridview.addView(view2, 200, [0]);
            assert.deepEqual(view1.size, [800, 400]);
            assert.deepEqual(gridview.getViewSize([1]), { width: 800, height: 400 });
            assert.deepEqual(view2.size, [800, 200]);
            assert.deepEqual(gridview.getViewSize([0]), { width: 800, height: 200 });
            const view3 = new util_1.TestView(50, Number.POSITIVE_INFINITY, 50, Number.POSITIVE_INFINITY);
            gridview.addView(view3, 200, [1, 1]);
            assert.deepEqual(view1.size, [600, 400]);
            assert.deepEqual(gridview.getViewSize([1, 0]), { width: 600, height: 400 });
            assert.deepEqual(view2.size, [800, 200]);
            assert.deepEqual(gridview.getViewSize([0]), { width: 800, height: 200 });
            assert.deepEqual(view3.size, [200, 400]);
            assert.deepEqual(gridview.getViewSize([1, 1]), { width: 200, height: 400 });
            const view4 = new util_1.TestView(50, Number.POSITIVE_INFINITY, 50, Number.POSITIVE_INFINITY);
            gridview.addView(view4, 200, [0, 0]);
            assert.deepEqual(view1.size, [600, 400]);
            assert.deepEqual(gridview.getViewSize([1, 0]), { width: 600, height: 400 });
            assert.deepEqual(view2.size, [600, 200]);
            assert.deepEqual(gridview.getViewSize([0, 1]), { width: 600, height: 200 });
            assert.deepEqual(view3.size, [200, 400]);
            assert.deepEqual(gridview.getViewSize([1, 1]), { width: 200, height: 400 });
            assert.deepEqual(view4.size, [200, 200]);
            assert.deepEqual(gridview.getViewSize([0, 0]), { width: 200, height: 200 });
            const view5 = new util_1.TestView(50, Number.POSITIVE_INFINITY, 50, Number.POSITIVE_INFINITY);
            gridview.addView(view5, 100, [1, 0, 1]);
            assert.deepEqual(view1.size, [600, 300]);
            assert.deepEqual(gridview.getViewSize([1, 0, 0]), { width: 600, height: 300 });
            assert.deepEqual(view2.size, [600, 200]);
            assert.deepEqual(gridview.getViewSize([0, 1]), { width: 600, height: 200 });
            assert.deepEqual(view3.size, [200, 400]);
            assert.deepEqual(gridview.getViewSize([1, 1]), { width: 200, height: 400 });
            assert.deepEqual(view4.size, [200, 200]);
            assert.deepEqual(gridview.getViewSize([0, 0]), { width: 200, height: 200 });
            assert.deepEqual(view5.size, [600, 100]);
            assert.deepEqual(gridview.getViewSize([1, 0, 1]), { width: 600, height: 100 });
        });
        test('simple layout with automatic size distribution', function () {
            gridview.layout(800, 600);
            const view1 = new util_1.TestView(50, Number.POSITIVE_INFINITY, 50, Number.POSITIVE_INFINITY);
            gridview.addView(view1, gridview_1.Sizing.Distribute, [0]);
            assert.deepEqual(view1.size, [800, 600]);
            assert.deepEqual(gridview.getViewSize([0]), { width: 800, height: 600 });
            const view2 = new util_1.TestView(50, Number.POSITIVE_INFINITY, 50, Number.POSITIVE_INFINITY);
            gridview.addView(view2, gridview_1.Sizing.Distribute, [0]);
            assert.deepEqual(view1.size, [800, 300]);
            assert.deepEqual(view2.size, [800, 300]);
            const view3 = new util_1.TestView(50, Number.POSITIVE_INFINITY, 50, Number.POSITIVE_INFINITY);
            gridview.addView(view3, gridview_1.Sizing.Distribute, [1, 1]);
            assert.deepEqual(view1.size, [400, 300]);
            assert.deepEqual(view2.size, [800, 300]);
            assert.deepEqual(view3.size, [400, 300]);
            const view4 = new util_1.TestView(50, Number.POSITIVE_INFINITY, 50, Number.POSITIVE_INFINITY);
            gridview.addView(view4, gridview_1.Sizing.Distribute, [0, 0]);
            assert.deepEqual(view1.size, [400, 300]);
            assert.deepEqual(view2.size, [400, 300]);
            assert.deepEqual(view3.size, [400, 300]);
            assert.deepEqual(view4.size, [400, 300]);
            const view5 = new util_1.TestView(50, Number.POSITIVE_INFINITY, 50, Number.POSITIVE_INFINITY);
            gridview.addView(view5, gridview_1.Sizing.Distribute, [1, 0, 1]);
            assert.deepEqual(view1.size, [400, 150]);
            assert.deepEqual(view2.size, [400, 300]);
            assert.deepEqual(view3.size, [400, 300]);
            assert.deepEqual(view4.size, [400, 300]);
            assert.deepEqual(view5.size, [400, 150]);
        });
        test('addviews before layout call 1', function () {
            const view1 = new util_1.TestView(50, Number.POSITIVE_INFINITY, 50, Number.POSITIVE_INFINITY);
            gridview.addView(view1, 200, [0]);
            const view2 = new util_1.TestView(50, Number.POSITIVE_INFINITY, 50, Number.POSITIVE_INFINITY);
            gridview.addView(view2, 200, [0]);
            const view3 = new util_1.TestView(50, Number.POSITIVE_INFINITY, 50, Number.POSITIVE_INFINITY);
            gridview.addView(view3, 200, [1, 1]);
            gridview.layout(800, 600);
            assert.deepEqual(view1.size, [400, 300]);
            assert.deepEqual(view2.size, [800, 300]);
            assert.deepEqual(view3.size, [400, 300]);
        });
        test('addviews before layout call 2', function () {
            const view1 = new util_1.TestView(50, Number.POSITIVE_INFINITY, 50, Number.POSITIVE_INFINITY);
            gridview.addView(view1, 200, [0]);
            const view2 = new util_1.TestView(50, Number.POSITIVE_INFINITY, 50, Number.POSITIVE_INFINITY);
            gridview.addView(view2, 200, [0]);
            const view3 = new util_1.TestView(50, Number.POSITIVE_INFINITY, 50, Number.POSITIVE_INFINITY);
            gridview.addView(view3, 200, [0, 0]);
            gridview.layout(800, 600);
            assert.deepEqual(view1.size, [800, 300]);
            assert.deepEqual(view2.size, [400, 300]);
            assert.deepEqual(view3.size, [400, 300]);
        });
    });
});
//# sourceMappingURL=gridview.test.js.map