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
define(["require", "exports", "vs/workbench/common/contributions", "vs/platform/userDataSync/common/userDataSync", "vs/base/common/lifecycle", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/instantiation", "vs/base/common/platform", "vs/platform/userDataSync/common/userDataSyncService", "vs/platform/product/common/productService", "vs/workbench/contrib/userDataSync/browser/userDataSync"], function (require, exports, contributions_1, userDataSync_1, lifecycle_1, platform_1, instantiation_1, platform_2, userDataSyncService_1, productService_1, userDataSync_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let UserDataSyncConfigurationContribution = class UserDataSyncConfigurationContribution {
        constructor(productService) {
            if (productService.settingsSyncStoreUrl) {
                userDataSync_1.registerConfiguration();
            }
        }
    };
    UserDataSyncConfigurationContribution = __decorate([
        __param(0, productService_1.IProductService)
    ], UserDataSyncConfigurationContribution);
    let UserDataAutoSyncContribution = class UserDataAutoSyncContribution extends lifecycle_1.Disposable {
        constructor(instantiationService) {
            super();
            if (platform_2.isWeb) {
                instantiationService.createInstance(userDataSyncService_1.UserDataAutoSync);
            }
        }
    };
    UserDataAutoSyncContribution = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], UserDataAutoSyncContribution);
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(UserDataSyncConfigurationContribution, 1 /* Starting */);
    workbenchRegistry.registerWorkbenchContribution(userDataSync_2.UserDataSyncWorkbenchContribution, 3 /* Restored */);
    workbenchRegistry.registerWorkbenchContribution(UserDataAutoSyncContribution, 3 /* Restored */);
});
//# sourceMappingURL=userDataSync.contribution.js.map