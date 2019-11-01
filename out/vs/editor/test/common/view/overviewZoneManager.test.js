/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/view/overviewZoneManager"], function (require, exports, assert, overviewZoneManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Editor View - OverviewZoneManager', () => {
        test('pixel ratio 1, dom height 600', () => {
            const LINE_COUNT = 50;
            const LINE_HEIGHT = 20;
            let manager = new overviewZoneManager_1.OverviewZoneManager((lineNumber) => LINE_HEIGHT * lineNumber);
            manager.setDOMWidth(30);
            manager.setDOMHeight(600);
            manager.setOuterHeight(LINE_COUNT * LINE_HEIGHT);
            manager.setLineHeight(LINE_HEIGHT);
            manager.setPixelRatio(1);
            manager.setZones([
                new overviewZoneManager_1.OverviewRulerZone(1, 1, '1'),
                new overviewZoneManager_1.OverviewRulerZone(10, 10, '2'),
                new overviewZoneManager_1.OverviewRulerZone(30, 31, '3'),
                new overviewZoneManager_1.OverviewRulerZone(50, 50, '4'),
            ]);
            // one line = 12, but cap is at 6
            assert.deepEqual(manager.resolveColorZones(), [
                new overviewZoneManager_1.ColorZone(12, 24, 1),
                new overviewZoneManager_1.ColorZone(120, 132, 2),
                new overviewZoneManager_1.ColorZone(360, 384, 3),
                new overviewZoneManager_1.ColorZone(588, 600, 4),
            ]);
        });
        test('pixel ratio 1, dom height 300', () => {
            const LINE_COUNT = 50;
            const LINE_HEIGHT = 20;
            let manager = new overviewZoneManager_1.OverviewZoneManager((lineNumber) => LINE_HEIGHT * lineNumber);
            manager.setDOMWidth(30);
            manager.setDOMHeight(300);
            manager.setOuterHeight(LINE_COUNT * LINE_HEIGHT);
            manager.setLineHeight(LINE_HEIGHT);
            manager.setPixelRatio(1);
            manager.setZones([
                new overviewZoneManager_1.OverviewRulerZone(1, 1, '1'),
                new overviewZoneManager_1.OverviewRulerZone(10, 10, '2'),
                new overviewZoneManager_1.OverviewRulerZone(30, 31, '3'),
                new overviewZoneManager_1.OverviewRulerZone(50, 50, '4'),
            ]);
            // one line = 6, cap is at 6
            assert.deepEqual(manager.resolveColorZones(), [
                new overviewZoneManager_1.ColorZone(6, 12, 1),
                new overviewZoneManager_1.ColorZone(60, 66, 2),
                new overviewZoneManager_1.ColorZone(180, 192, 3),
                new overviewZoneManager_1.ColorZone(294, 300, 4),
            ]);
        });
        test('pixel ratio 2, dom height 300', () => {
            const LINE_COUNT = 50;
            const LINE_HEIGHT = 20;
            let manager = new overviewZoneManager_1.OverviewZoneManager((lineNumber) => LINE_HEIGHT * lineNumber);
            manager.setDOMWidth(30);
            manager.setDOMHeight(300);
            manager.setOuterHeight(LINE_COUNT * LINE_HEIGHT);
            manager.setLineHeight(LINE_HEIGHT);
            manager.setPixelRatio(2);
            manager.setZones([
                new overviewZoneManager_1.OverviewRulerZone(1, 1, '1'),
                new overviewZoneManager_1.OverviewRulerZone(10, 10, '2'),
                new overviewZoneManager_1.OverviewRulerZone(30, 31, '3'),
                new overviewZoneManager_1.OverviewRulerZone(50, 50, '4'),
            ]);
            // one line = 6, cap is at 12
            assert.deepEqual(manager.resolveColorZones(), [
                new overviewZoneManager_1.ColorZone(12, 24, 1),
                new overviewZoneManager_1.ColorZone(120, 132, 2),
                new overviewZoneManager_1.ColorZone(360, 384, 3),
                new overviewZoneManager_1.ColorZone(588, 600, 4),
            ]);
        });
    });
});
//# sourceMappingURL=overviewZoneManager.test.js.map