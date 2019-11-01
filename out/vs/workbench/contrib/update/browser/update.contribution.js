/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/common/actions", "vs/platform/actions/common/actions", "vs/workbench/contrib/update/browser/update", "vs/platform/update/common/update.config.contribution"], function (require, exports, platform_1, contributions_1, actions_1, actions_2, update_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const workbench = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbench.registerWorkbenchContribution(update_1.ProductContribution, 3 /* Restored */);
    workbench.registerWorkbenchContribution(update_1.UpdateContribution, 3 /* Restored */);
    // Editor
    platform_1.Registry.as(actions_1.Extensions.WorkbenchActions)
        .registerWorkbenchAction(new actions_2.SyncActionDescriptor(update_1.ShowCurrentReleaseNotesAction, update_1.ShowCurrentReleaseNotesAction.ID, update_1.ShowCurrentReleaseNotesAction.LABEL), 'Show Release Notes');
});
//# sourceMappingURL=update.contribution.js.map