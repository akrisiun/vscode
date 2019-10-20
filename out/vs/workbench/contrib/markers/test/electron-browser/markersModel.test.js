/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/platform/markers/common/markers", "vs/workbench/contrib/markers/browser/markersModel", "vs/base/common/collections"], function (require, exports, assert, uri_1, markers_1, markersModel_1, collections_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestMarkersModel extends markersModel_1.MarkersModel {
        constructor(markers) {
            super();
            const byResource = collections_1.groupBy(markers, r => r.resource.toString());
            Object.keys(byResource).forEach(key => {
                const markers = byResource[key];
                const resource = markers[0].resource;
                this.setResourceMarkers([[resource, markers]]);
            });
        }
    }
    suite('MarkersModel Test', () => {
        test('marker ids are unique', function () {
            const marker1 = anErrorWithRange(3);
            const marker2 = anErrorWithRange(3);
            const marker3 = aWarningWithRange(3);
            const marker4 = aWarningWithRange(3);
            const testObject = new TestMarkersModel([marker1, marker2, marker3, marker4]);
            const actuals = testObject.resourceMarkers[0].markers;
            assert.notEqual(actuals[0].id, actuals[1].id);
            assert.notEqual(actuals[0].id, actuals[2].id);
            assert.notEqual(actuals[0].id, actuals[3].id);
            assert.notEqual(actuals[1].id, actuals[2].id);
            assert.notEqual(actuals[1].id, actuals[3].id);
            assert.notEqual(actuals[2].id, actuals[3].id);
        });
        test('sort palces resources with no errors at the end', function () {
            const marker1 = aMarker('a/res1', markers_1.MarkerSeverity.Warning);
            const marker2 = aMarker('a/res2');
            const marker3 = aMarker('res4');
            const marker4 = aMarker('b/res3');
            const marker5 = aMarker('res4');
            const marker6 = aMarker('c/res2', markers_1.MarkerSeverity.Info);
            const testObject = new TestMarkersModel([marker1, marker2, marker3, marker4, marker5, marker6]);
            const actuals = testObject.resourceMarkers;
            assert.equal(5, actuals.length);
            assert.ok(compareResource(actuals[0], 'a/res2'));
            assert.ok(compareResource(actuals[1], 'b/res3'));
            assert.ok(compareResource(actuals[2], 'res4'));
            assert.ok(compareResource(actuals[3], 'a/res1'));
            assert.ok(compareResource(actuals[4], 'c/res2'));
        });
        test('sort resources by file path', function () {
            const marker1 = aMarker('a/res1');
            const marker2 = aMarker('a/res2');
            const marker3 = aMarker('res4');
            const marker4 = aMarker('b/res3');
            const marker5 = aMarker('res4');
            const marker6 = aMarker('c/res2');
            const testObject = new TestMarkersModel([marker1, marker2, marker3, marker4, marker5, marker6]);
            const actuals = testObject.resourceMarkers;
            assert.equal(5, actuals.length);
            assert.ok(compareResource(actuals[0], 'a/res1'));
            assert.ok(compareResource(actuals[1], 'a/res2'));
            assert.ok(compareResource(actuals[2], 'b/res3'));
            assert.ok(compareResource(actuals[3], 'c/res2'));
            assert.ok(compareResource(actuals[4], 'res4'));
        });
        test('sort markers by severity, line and column', function () {
            const marker1 = aWarningWithRange(8, 1, 9, 3);
            const marker2 = aWarningWithRange(3);
            const marker3 = anErrorWithRange(8, 1, 9, 3);
            const marker4 = anIgnoreWithRange(5);
            const marker5 = anInfoWithRange(8, 1, 8, 4, 'ab');
            const marker6 = anErrorWithRange(3);
            const marker7 = anErrorWithRange(5);
            const marker8 = anInfoWithRange(5);
            const marker9 = anErrorWithRange(8, 1, 8, 4, 'ab');
            const marker10 = anErrorWithRange(10);
            const marker11 = anErrorWithRange(8, 1, 8, 4, 'ba');
            const marker12 = anIgnoreWithRange(3);
            const marker13 = aWarningWithRange(5);
            const marker14 = anErrorWithRange(4);
            const marker15 = anErrorWithRange(8, 2, 8, 4);
            const testObject = new TestMarkersModel([marker1, marker2, marker3, marker4, marker5, marker6, marker7, marker8, marker9, marker10, marker11, marker12, marker13, marker14, marker15]);
            const actuals = testObject.resourceMarkers[0].markers;
            assert.equal(actuals[0].marker, marker6);
            assert.equal(actuals[1].marker, marker14);
            assert.equal(actuals[2].marker, marker7);
            assert.equal(actuals[3].marker, marker9);
            assert.equal(actuals[4].marker, marker11);
            assert.equal(actuals[5].marker, marker3);
            assert.equal(actuals[6].marker, marker15);
            assert.equal(actuals[7].marker, marker10);
            assert.equal(actuals[8].marker, marker2);
            assert.equal(actuals[9].marker, marker13);
            assert.equal(actuals[10].marker, marker1);
            assert.equal(actuals[11].marker, marker8);
            assert.equal(actuals[12].marker, marker5);
            assert.equal(actuals[13].marker, marker12);
            assert.equal(actuals[14].marker, marker4);
        });
        test('toString()', () => {
            let marker = aMarker('a/res1');
            marker.code = '1234';
            assert.equal(JSON.stringify(Object.assign(Object.assign({}, marker), { resource: marker.resource.path }), null, '\t'), new markersModel_1.Marker('1', marker).toString());
            marker = aMarker('a/res2', markers_1.MarkerSeverity.Warning);
            assert.equal(JSON.stringify(Object.assign(Object.assign({}, marker), { resource: marker.resource.path }), null, '\t'), new markersModel_1.Marker('2', marker).toString());
            marker = aMarker('a/res2', markers_1.MarkerSeverity.Info, 1, 2, 1, 8, 'Info', '');
            assert.equal(JSON.stringify(Object.assign(Object.assign({}, marker), { resource: marker.resource.path }), null, '\t'), new markersModel_1.Marker('3', marker).toString());
            marker = aMarker('a/res2', markers_1.MarkerSeverity.Hint, 1, 2, 1, 8, 'Ignore message', 'Ignore');
            assert.equal(JSON.stringify(Object.assign(Object.assign({}, marker), { resource: marker.resource.path }), null, '\t'), new markersModel_1.Marker('4', marker).toString());
            marker = aMarker('a/res2', markers_1.MarkerSeverity.Warning, 1, 2, 1, 8, 'Warning message', '', [{ startLineNumber: 2, startColumn: 5, endLineNumber: 2, endColumn: 10, message: 'some info', resource: uri_1.URI.file('a/res3') }]);
            const testObject = new markersModel_1.Marker('5', marker, null);
            // hack
            testObject.relatedInformation = marker.relatedInformation.map(r => new markersModel_1.RelatedInformation('6', marker, r));
            assert.equal(JSON.stringify(Object.assign(Object.assign({}, marker), { resource: marker.resource.path, relatedInformation: marker.relatedInformation.map(r => (Object.assign(Object.assign({}, r), { resource: r.resource.path }))) }), null, '\t'), testObject.toString());
        });
        function compareResource(a, b) {
            return a.resource.toString() === uri_1.URI.file(b).toString();
        }
        function anErrorWithRange(startLineNumber = 10, startColumn = 5, endLineNumber = startLineNumber + 1, endColumn = startColumn + 5, message = 'some message') {
            return aMarker('some resource', markers_1.MarkerSeverity.Error, startLineNumber, startColumn, endLineNumber, endColumn, message);
        }
        function aWarningWithRange(startLineNumber = 10, startColumn = 5, endLineNumber = startLineNumber + 1, endColumn = startColumn + 5, message = 'some message') {
            return aMarker('some resource', markers_1.MarkerSeverity.Warning, startLineNumber, startColumn, endLineNumber, endColumn, message);
        }
        function anInfoWithRange(startLineNumber = 10, startColumn = 5, endLineNumber = startLineNumber + 1, endColumn = startColumn + 5, message = 'some message') {
            return aMarker('some resource', markers_1.MarkerSeverity.Info, startLineNumber, startColumn, endLineNumber, endColumn, message);
        }
        function anIgnoreWithRange(startLineNumber = 10, startColumn = 5, endLineNumber = startLineNumber + 1, endColumn = startColumn + 5, message = 'some message') {
            return aMarker('some resource', markers_1.MarkerSeverity.Hint, startLineNumber, startColumn, endLineNumber, endColumn, message);
        }
        function aMarker(resource = 'some resource', severity = markers_1.MarkerSeverity.Error, startLineNumber = 10, startColumn = 5, endLineNumber = startLineNumber + 1, endColumn = startColumn + 5, message = 'some message', source = 'tslint', relatedInformation) {
            return {
                owner: 'someOwner',
                resource: uri_1.URI.file(resource),
                severity,
                message,
                startLineNumber,
                startColumn,
                endLineNumber,
                endColumn,
                source,
                relatedInformation
            };
        }
    });
});
//# sourceMappingURL=markersModel.test.js.map