/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uuid", "vs/base/common/path", "os", "vs/base/node/pfs"], function (require, exports, uuid_1, path_1, os_1, pfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function testFile(folder, file) {
        const id = uuid_1.generateUuid();
        const parentDir = path_1.join(os_1.tmpdir(), 'vsctests', id);
        const newDir = path_1.join(parentDir, folder, id);
        const testFile = path_1.join(newDir, file);
        return pfs_1.mkdirp(newDir, 493).then(() => {
            return {
                testFile,
                cleanUp: () => pfs_1.rimraf(parentDir, pfs_1.RimRafMode.MOVE)
            };
        });
    }
    exports.testFile = testFile;
});
//# sourceMappingURL=utils.js.map