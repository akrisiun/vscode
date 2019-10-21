/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/nls", "vs/platform/product/common/product", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/workbench/contrib/issue/electron-browser/issueActions", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/issue/electron-browser/issue", "vs/workbench/contrib/issue/electron-browser/issueService", "vs/platform/commands/common/commands", "vs/platform/issue/node/issue"], function (require, exports, platform_1, nls, product_1, actions_1, actions_2, issueActions_1, extensions_1, issue_1, issueService_1, commands_1, issue_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const helpCategory = { value: nls.localize('help', "Help"), original: 'Help' };
    const workbenchActionsRegistry = platform_1.Registry.as(actions_2.Extensions.WorkbenchActions);
    if (!!product_1.default.reportIssueUrl) {
        workbenchActionsRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(issueActions_1.ReportPerformanceIssueUsingReporterAction, issueActions_1.ReportPerformanceIssueUsingReporterAction.ID, issueActions_1.ReportPerformanceIssueUsingReporterAction.LABEL), 'Help: Report Performance Issue', helpCategory.value);
        const OpenIssueReporterActionId = 'workbench.action.openIssueReporter';
        const OpenIssueReporterActionLabel = nls.localize({ key: 'reportIssueInEnglish', comment: ['Translate this to "Report Issue in English" in all languages please!'] }, "Report Issue");
        commands_1.CommandsRegistry.registerCommand(OpenIssueReporterActionId, function (accessor, args) {
            let extensionId;
            if (args && Array.isArray(args)) {
                [extensionId] = args;
            }
            return accessor.get(issue_1.IWorkbenchIssueService).openReporter({ extensionId });
        });
        const command = {
            id: OpenIssueReporterActionId,
            title: { value: OpenIssueReporterActionLabel, original: 'Report Issue' },
            category: helpCategory
        };
        actions_1.MenuRegistry.appendMenuItem(0 /* CommandPalette */, { command });
    }
    const developerCategory = nls.localize('developer', "Developer");
    workbenchActionsRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(issueActions_1.OpenProcessExplorer, issueActions_1.OpenProcessExplorer.ID, issueActions_1.OpenProcessExplorer.LABEL), 'Developer: Open Process Explorer', developerCategory);
    extensions_1.registerSingleton(issue_1.IWorkbenchIssueService, issueService_1.WorkbenchIssueService, true);
    commands_1.CommandsRegistry.registerCommand('_issues.getSystemStatus', (accessor) => {
        return accessor.get(issue_2.IIssueService).getSystemStatus();
    });
});
//# sourceMappingURL=issue.contribution.js.map