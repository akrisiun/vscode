/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/experiments/common/experimentService", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/experiments/browser/experimentalPrompt"], function (require, exports, extensions_1, experimentService_1, platform_1, contributions_1, experimentalPrompt_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    extensions_1.registerSingleton(experimentService_1.IExperimentService, experimentService_1.ExperimentService, true);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(experimentalPrompt_1.ExperimentalPrompts, 4 /* Eventually */);
});
//# sourceMappingURL=experiments.contribution.js.map