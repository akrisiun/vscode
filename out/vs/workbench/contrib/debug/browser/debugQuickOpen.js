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
define(["require", "exports", "vs/nls", "vs/workbench/contrib/debug/common/debug", "vs/platform/workspace/common/workspace", "vs/platform/commands/common/commands", "vs/workbench/contrib/debug/browser/debugActions", "vs/platform/notification/common/notification", "vs/base/parts/quickopen/browser/quickOpenModel", "vs/workbench/browser/quickopen", "vs/base/common/filters"], function (require, exports, nls, debug_1, workspace_1, commands_1, debugActions_1, notification_1, quickOpenModel_1, quickopen_1, filters_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AddConfigEntry extends quickOpenModel_1.QuickOpenEntry {
        constructor(label, launch, commandService, contextService, highlights = []) {
            super(highlights);
            this.label = label;
            this.launch = launch;
            this.commandService = commandService;
            this.contextService = contextService;
        }
        getLabel() {
            return this.label;
        }
        getDescription() {
            return this.contextService.getWorkbenchState() === 3 /* WORKSPACE */ ? this.launch.name : '';
        }
        getAriaLabel() {
            return nls.localize('entryAriaLabel', "{0}, debug", this.getLabel());
        }
        run(mode) {
            if (mode === 0 /* PREVIEW */) {
                return false;
            }
            this.commandService.executeCommand('debug.addConfiguration', this.launch.uri.toString());
            return true;
        }
    }
    class StartDebugEntry extends quickOpenModel_1.QuickOpenEntry {
        constructor(debugService, contextService, notificationService, launch, configurationName, highlights = []) {
            super(highlights);
            this.debugService = debugService;
            this.contextService = contextService;
            this.notificationService = notificationService;
            this.launch = launch;
            this.configurationName = configurationName;
        }
        getLabel() {
            return this.configurationName;
        }
        getDescription() {
            return this.contextService.getWorkbenchState() === 3 /* WORKSPACE */ ? this.launch.name : '';
        }
        getAriaLabel() {
            return nls.localize('entryAriaLabel', "{0}, debug", this.getLabel());
        }
        run(mode) {
            if (mode === 0 /* PREVIEW */ || !debugActions_1.StartAction.isEnabled(this.debugService)) {
                return false;
            }
            // Run selected debug configuration
            this.debugService.getConfigurationManager().selectConfiguration(this.launch, this.configurationName);
            this.debugService.startDebugging(this.launch).then(undefined, e => this.notificationService.error(e));
            return true;
        }
    }
    let DebugQuickOpenHandler = class DebugQuickOpenHandler extends quickopen_1.QuickOpenHandler {
        constructor(debugService, contextService, commandService, notificationService) {
            super();
            this.debugService = debugService;
            this.contextService = contextService;
            this.commandService = commandService;
            this.notificationService = notificationService;
        }
        getAriaLabel() {
            return nls.localize('debugAriaLabel', "Type a name of a launch configuration to run.");
        }
        getResults(input, token) {
            const configurations = [];
            const configManager = this.debugService.getConfigurationManager();
            const launches = configManager.getLaunches();
            for (let launch of launches) {
                launch.getConfigurationNames().map(config => ({ config: config, highlights: filters_1.matchesFuzzy(input, config, true) || undefined }))
                    .filter(({ highlights }) => !!highlights)
                    .forEach(({ config, highlights }) => {
                    if (launch === configManager.selectedConfiguration.launch && config === configManager.selectedConfiguration.name) {
                        this.autoFocusIndex = configurations.length;
                    }
                    configurations.push(new StartDebugEntry(this.debugService, this.contextService, this.notificationService, launch, config, highlights));
                });
            }
            launches.filter(l => !l.hidden).forEach((l, index) => {
                const label = this.contextService.getWorkbenchState() === 3 /* WORKSPACE */ ? nls.localize("addConfigTo", "Add Config ({0})...", l.name) : nls.localize('addConfiguration', "Add Configuration...");
                const entry = new AddConfigEntry(label, l, this.commandService, this.contextService, filters_1.matchesFuzzy(input, label, true) || undefined);
                if (index === 0) {
                    configurations.push(new quickOpenModel_1.QuickOpenEntryGroup(entry, undefined, true));
                }
                else {
                    configurations.push(entry);
                }
            });
            return Promise.resolve(new quickOpenModel_1.QuickOpenModel(configurations));
        }
        getAutoFocus(input) {
            return {
                autoFocusFirstEntry: !!input,
                autoFocusIndex: this.autoFocusIndex
            };
        }
        getEmptyLabel(searchString) {
            if (searchString.length > 0) {
                return nls.localize('noConfigurationsMatching', "No debug configurations matching");
            }
            return nls.localize('noConfigurationsFound', "No debug configurations found. Please create a 'launch.json' file.");
        }
    };
    DebugQuickOpenHandler.ID = 'workbench.picker.launch';
    DebugQuickOpenHandler = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, commands_1.ICommandService),
        __param(3, notification_1.INotificationService)
    ], DebugQuickOpenHandler);
    exports.DebugQuickOpenHandler = DebugQuickOpenHandler;
});
//# sourceMappingURL=debugQuickOpen.js.map