/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/amd"], function (require, exports, amd_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const pathsPath = amd_1.getPathFromAmdModule(require, 'paths');
    const paths = require.__$__nodeRequire(pathsPath);
    exports.getAppDataPath = paths.getAppDataPath;
    exports.getDefaultUserDataPath = paths.getDefaultUserDataPath;
});
//# sourceMappingURL=paths.js.map