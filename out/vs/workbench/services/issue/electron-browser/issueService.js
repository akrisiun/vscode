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
define(["require", "exports", "vs/platform/issue/node/issue", "vs/platform/ipc/electron-browser/mainProcessService", "vs/base/parts/ipc/node/ipc", "vs/platform/instantiation/common/extensions"], function (require, exports, issue_1, mainProcessService_1, ipc_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let IssueService = class IssueService {
        constructor(mainProcessService) {
            return ipc_1.createChannelSender(mainProcessService.getChannel('issue'));
        }
    };
    IssueService = __decorate([
        __param(0, mainProcessService_1.IMainProcessService)
    ], IssueService);
    exports.IssueService = IssueService;
    extensions_1.registerSingleton(issue_1.IIssueService, IssueService, true);
});
//# sourceMappingURL=issueService.js.map