/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/node/encoding", "vs/base/node/pfs", "vs/workbench/services/search/common/textSearchManager"], function (require, exports, encoding_1, pfs, textSearchManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeTextSearchManager = void 0;
    class NativeTextSearchManager extends textSearchManager_1.TextSearchManager {
        constructor(query, provider, _pfs = pfs) {
            super(query, provider, {
                readdir: resource => _pfs.readdir(resource.fsPath),
                toCanonicalName: name => encoding_1.toCanonicalName(name)
            });
        }
    }
    exports.NativeTextSearchManager = NativeTextSearchManager;
});
//# sourceMappingURL=textSearchManager.js.map