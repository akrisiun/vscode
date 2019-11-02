/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "fs", "vs/base/common/amd"], function (require, exports, assert, uri_1, fs_1, amd_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('URI - perf', function () {
        let manyFileUris;
        setup(function () {
            manyFileUris = [];
            let data = fs_1.readFileSync(amd_1.getPathFromAmdModule(require, './uri.test.data.txt')).toString();
            let lines = data.split('\n');
            for (let line of lines) {
                manyFileUris.push(uri_1.URI.file(line));
            }
        });
        function perfTest(name, callback) {
            test(name, _done => {
                let t1 = Date.now();
                callback();
                let d = Date.now() - t1;
                console.log(`${name} took ${d}ms (${(d / manyFileUris.length).toPrecision(3)} ms/uri)`);
                _done();
            });
        }
        perfTest('toString', function () {
            for (const uri of manyFileUris) {
                let data = uri.toString();
                assert.ok(data);
            }
        });
        perfTest('toString(skipEncoding)', function () {
            for (const uri of manyFileUris) {
                let data = uri.toString(true);
                assert.ok(data);
            }
        });
        perfTest('fsPath', function () {
            for (const uri of manyFileUris) {
                let data = uri.fsPath;
                assert.ok(data);
            }
        });
        perfTest('toJSON', function () {
            for (const uri of manyFileUris) {
                let data = uri.toJSON();
                assert.ok(data);
            }
        });
    });
});
//# sourceMappingURL=uri.test.perf.js.map