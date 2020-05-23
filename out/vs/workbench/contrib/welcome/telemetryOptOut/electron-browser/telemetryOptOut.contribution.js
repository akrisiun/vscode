/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/welcome/telemetryOptOut/electron-browser/telemetryOptOut"], function (require, exports, platform_1, contributions_1, telemetryOptOut_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(telemetryOptOut_1.NativeTelemetryOptOut, 4 /* Eventually */);
});
//# sourceMappingURL=telemetryOptOut.contribution.js.map