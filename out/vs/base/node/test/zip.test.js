/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/path", "os", "vs/base/node/zip", "vs/base/common/uuid", "vs/base/node/pfs", "vs/base/common/amd", "vs/base/common/async"], function (require, exports, assert, path, os, zip_1, uuid_1, pfs_1, amd_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const fixtures = amd_1.getPathFromAmdModule(require, './fixtures');
    suite('Zip', () => {
        test('extract should handle directories', () => {
            const fixture = path.join(fixtures, 'extract.zip');
            const target = path.join(os.tmpdir(), uuid_1.generateUuid());
            return async_1.createCancelablePromise(token => zip_1.extract(fixture, target, {}, token)
                .then(() => pfs_1.exists(path.join(target, 'extension')))
                .then(exists => assert(exists))
                .then(() => pfs_1.rimraf(target)));
        });
    });
});
//# sourceMappingURL=zip.test.js.map