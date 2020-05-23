/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/nls", "vs/platform/product/common/product", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/workbench/contrib/issue/electron-browser/issueActions", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/issue/electron-browser/issue", "vs/workbench/contrib/issue/electron-browser/issueService", "vs/platform/commands/common/commands", "vs/platform/issue/node/issue", "vs/workbench/contrib/issue/common/commands"], function (require, exports, platform_1, nls, product_1, actions_1, actions_2, issueActions_1, extensions_1, issue_1, issueService_1, commands_1, issue_2, commands_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const helpCategory = { value: nls.localize('help', "Help"), original: 'Help' };
    const workbenchActionsRegistry = platform_1.Registry.as(actions_2.Extensions.WorkbenchActions);
    if (!!product_1.default.reportIssueUrl) {
        workbenchActionsRegistry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(issueActions_1.ReportPerformanceIssueUsingReporterAction), 'Help: Report Performance Issue', helpCategory.value);
        const OpenIssueReporterActionLabel = nls.localize({ key: 'reportIssueInEnglish', comment: ['Translate this to "Report Issue in English" in all languages please!'] }, "Report Issue");
        commands_1.CommandsRegistry.registerCommand(commands_2.OpenIssueReporterActionId, function (accessor, args) {
            const data = Array.isArray(args)
                ? { extensionId: args[0] }
                : args || {};
            return accessor.get(issue_1.IWorkbenchIssueService).openReporter(data);
        });
        const command = {
            id: commands_2.OpenIssueReporterActionId,
            title: { value: OpenIssueReporterActionLabel, original: 'Report Issue' },
            category: helpCategory
        };
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command });
    }
    const developerCategory = nls.localize('developer', "Developer");
    workbenchActionsRegistry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(issueActions_1.OpenProcessExplorer), 'Developer: Open Process Explorer', developerCategory);
    extensions_1.registerSingleton(issue_1.IWorkbenchIssueService, issueService_1.WorkbenchIssueService, true);
    commands_1.CommandsRegistry.registerCommand('_issues.getSystemStatus', (accessor) => {
        return accessor.get(issue_2.IIssueService).getSystemStatus();
    });
});
//# sourceMappingURL=issue.contribution.js.map