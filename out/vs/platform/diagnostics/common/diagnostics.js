/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function isRemoteDiagnosticError(x) {
        return !!x.hostName && !!x.errorMessage;
    }
    exports.isRemoteDiagnosticError = isRemoteDiagnosticError;
});
//# sourceMappingURL=diagnostics.js.map