/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "vs/workbench/services/search/node/ripgrepFileSearch"], function (require, exports, assert, platform, ripgrepFileSearch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('RipgrepFileSearch - etc', () => {
        function testGetAbsGlob(params) {
            const [folder, glob, expectedResult] = params;
            assert.equal(ripgrepFileSearch_1.fixDriveC(ripgrepFileSearch_1.getAbsoluteGlob(folder, glob)), expectedResult, JSON.stringify(params));
        }
        test('getAbsoluteGlob_win', () => {
            if (!platform.isWindows) {
                return;
            }
            [
                ['C:/foo/bar', 'glob/**', '/foo\\bar\\glob\\**'],
                ['c:/', 'glob/**', '/glob\\**'],
                ['C:\\foo\\bar', 'glob\\**', '/foo\\bar\\glob\\**'],
                ['c:\\foo\\bar', 'glob\\**', '/foo\\bar\\glob\\**'],
                ['c:\\', 'glob\\**', '/glob\\**'],
                ['\\\\localhost\\c$\\foo\\bar', 'glob/**', '\\\\localhost\\c$\\foo\\bar\\glob\\**'],
                // absolute paths are not resolved further
                ['c:/foo/bar', '/path/something', '/path/something'],
                ['c:/foo/bar', 'c:\\project\\folder', '/project\\folder']
            ].forEach(testGetAbsGlob);
        });
        test('getAbsoluteGlob_posix', () => {
            if (platform.isWindows) {
                return;
            }
            [
                ['/foo/bar', 'glob/**', '/foo/bar/glob/**'],
                ['/', 'glob/**', '/glob/**'],
                // absolute paths are not resolved further
                ['/', '/project/folder', '/project/folder'],
            ].forEach(testGetAbsGlob);
        });
    });
});
//# sourceMappingURL=ripgrepFileSearch.test.js.map