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
define(["require", "exports", "vs/workbench/services/panel/common/panelService", "vs/workbench/services/activity/common/activity", "vs/workbench/services/activityBar/browser/activityBarService", "vs/platform/instantiation/common/extensions"], function (require, exports, panelService_1, activity_1, activityBarService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ActivityService = class ActivityService {
        constructor(panelService, activityBarService) {
            this.panelService = panelService;
            this.activityBarService = activityBarService;
        }
        showActivity(compositeOrActionId, badge, clazz, priority) {
            if (this.panelService.getPanels().filter(p => p.id === compositeOrActionId).length) {
                return this.panelService.showActivity(compositeOrActionId, badge, clazz);
            }
            return this.activityBarService.showActivity(compositeOrActionId, badge, clazz, priority);
        }
    };
    ActivityService = __decorate([
        __param(0, panelService_1.IPanelService),
        __param(1, activityBarService_1.IActivityBarService)
    ], ActivityService);
    exports.ActivityService = ActivityService;
    extensions_1.registerSingleton(activity_1.IActivityService, ActivityService, true);
});
//# sourceMappingURL=activityService.js.map