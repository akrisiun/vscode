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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/remote/common/remoteExplorerService"], function (require, exports, lifecycle_1, environmentService_1, remoteExplorerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShowCandidateContribution = void 0;
    let ShowCandidateContribution = /** @class */ (() => {
        let ShowCandidateContribution = class ShowCandidateContribution extends lifecycle_1.Disposable {
            constructor(remoteExplorerService, workbenchEnvironmentService) {
                super();
                if (workbenchEnvironmentService.options && workbenchEnvironmentService.options.showCandidate) {
                    this._register(remoteExplorerService.setCandidateFilter(async (candidates) => {
                        const filters = await Promise.all(candidates.map(candidate => workbenchEnvironmentService.options.showCandidate(candidate.host, candidate.port, candidate.detail)));
                        const filteredCandidates = [];
                        if (filters.length !== candidates.length) {
                            return candidates;
                        }
                        for (let i = 0; i < candidates.length; i++) {
                            if (filters[i]) {
                                filteredCandidates.push(candidates[i]);
                            }
                        }
                        return filteredCandidates;
                    }));
                }
            }
        };
        ShowCandidateContribution = __decorate([
            __param(0, remoteExplorerService_1.IRemoteExplorerService),
            __param(1, environmentService_1.IWorkbenchEnvironmentService)
        ], ShowCandidateContribution);
        return ShowCandidateContribution;
    })();
    exports.ShowCandidateContribution = ShowCandidateContribution;
});
//# sourceMappingURL=showCandidate.js.map