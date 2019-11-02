/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/uuid"], function (require, exports, path_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getRandomTestPath(tmpdir, ...segments) {
        return path_1.join(tmpdir, ...segments, uuid_1.generateUuid());
    }
    exports.getRandomTestPath = getRandomTestPath;
});
//# sourceMappingURL=testUtils.js.map