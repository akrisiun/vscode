/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/actions", "vs/nls", "vs/workbench/contrib/issue/electron-browser/issue"], function (require, exports, actions_1, nls, issue_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let OpenProcessExplorer = class OpenProcessExplorer extends actions_1.Action {
        constructor(id, label, issueService) {
            super(id, label);
            this.issueService = issueService;
        }
        run() {
            return this.issueService.openProcessExplorer().then(() => true);
        }
    };
    OpenProcessExplorer.ID = 'workbench.action.openProcessExplorer';
    OpenProcessExplorer.LABEL = nls.localize('openProcessExplorer', "Open Process Explorer");
    OpenProcessExplorer = __decorate([
        __param(2, issue_1.IWorkbenchIssueService)
    ], OpenProcessExplorer);
    exports.OpenProcessExplorer = OpenProcessExplorer;
    let ReportPerformanceIssueUsingReporterAction = class ReportPerformanceIssueUsingReporterAction extends actions_1.Action {
        constructor(id, label, issueService) {
            super(id, label);
            this.issueService = issueService;
        }
        run() {
            return this.issueService.openReporter({ issueType: 1 /* PerformanceIssue */ }).then(() => true);
        }
    };
    ReportPerformanceIssueUsingReporterAction.ID = 'workbench.action.reportPerformanceIssueUsingReporter';
    ReportPerformanceIssueUsingReporterAction.LABEL = nls.localize('reportPerformanceIssue', "Report Performance Issue");
    ReportPerformanceIssueUsingReporterAction = __decorate([
        __param(2, issue_1.IWorkbenchIssueService)
    ], ReportPerformanceIssueUsingReporterAction);
    exports.ReportPerformanceIssueUsingReporterAction = ReportPerformanceIssueUsingReporterAction;
});
//# sourceMappingURL=issueActions.js.map