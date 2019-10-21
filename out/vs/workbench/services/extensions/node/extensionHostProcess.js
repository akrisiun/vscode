/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/extensions/node/extensionHostProcessSetup"], function (require, exports, extensionHostProcessSetup_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    extensionHostProcessSetup_1.startExtensionHostProcess().catch((err) => console.log(err));
});
//# sourceMappingURL=extensionHostProcess.js.map