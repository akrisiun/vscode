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
define(["require", "exports", "vs/nls", "vs/base/browser/ui/aria/aria", "vs/base/common/actions", "vs/workbench/contrib/output/common/output", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/panel/common/panelService", "vs/workbench/browser/panel", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/contextview/browser/contextView", "vs/platform/registry/common/platform", "vs/base/common/arrays", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/editor/common/editorService", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/output/browser/logViewer", "vs/base/common/types"], function (require, exports, nls, aria, actions_1, output_1, actionbar_1, layoutService_1, panelService_1, panel_1, styler_1, themeService_1, contextView_1, platform_1, arrays_1, quickInput_1, editorService_1, instantiation_1, logViewer_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ToggleOutputAction = class ToggleOutputAction extends panel_1.TogglePanelAction {
        constructor(id, label, layoutService, panelService) {
            super(id, label, output_1.OUTPUT_PANEL_ID, panelService, layoutService);
        }
    };
    ToggleOutputAction.ID = 'workbench.action.output.toggleOutput';
    ToggleOutputAction.LABEL = nls.localize('toggleOutput', "Toggle Output");
    ToggleOutputAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, panelService_1.IPanelService)
    ], ToggleOutputAction);
    exports.ToggleOutputAction = ToggleOutputAction;
    let ClearOutputAction = class ClearOutputAction extends actions_1.Action {
        constructor(id, label, outputService) {
            super(id, label, 'output-action codicon-clear-all');
            this.outputService = outputService;
        }
        run() {
            const activeChannel = this.outputService.getActiveChannel();
            if (activeChannel) {
                activeChannel.clear();
                aria.status(nls.localize('outputCleared', "Output was cleared"));
            }
            return Promise.resolve(true);
        }
    };
    ClearOutputAction.ID = 'workbench.output.action.clearOutput';
    ClearOutputAction.LABEL = nls.localize('clearOutput', "Clear Output");
    ClearOutputAction = __decorate([
        __param(2, output_1.IOutputService)
    ], ClearOutputAction);
    exports.ClearOutputAction = ClearOutputAction;
    // this action can be triggered in two ways:
    // 1. user clicks the action icon, In which case the action toggles the lock state
    // 2. user clicks inside the output panel, which sets the lock, Or unsets it if they click the last line.
    let ToggleOrSetOutputScrollLockAction = class ToggleOrSetOutputScrollLockAction extends actions_1.Action {
        constructor(id, label, outputService) {
            super(id, label, 'output-action codicon-unlock');
            this.outputService = outputService;
            this._register(this.outputService.onActiveOutputChannel(channel => {
                const activeChannel = this.outputService.getActiveChannel();
                if (activeChannel) {
                    this.setClassAndLabel(activeChannel.scrollLock);
                }
            }));
        }
        run(newLockState) {
            const activeChannel = this.outputService.getActiveChannel();
            if (activeChannel) {
                if (typeof (newLockState) === 'boolean') {
                    activeChannel.scrollLock = newLockState;
                }
                else {
                    activeChannel.scrollLock = !activeChannel.scrollLock;
                }
                this.setClassAndLabel(activeChannel.scrollLock);
            }
            return Promise.resolve(true);
        }
        setClassAndLabel(locked) {
            if (locked) {
                this.class = 'output-action codicon-lock';
                this.label = nls.localize('outputScrollOn', "Turn Auto Scrolling On");
            }
            else {
                this.class = 'output-action codicon-unlock';
                this.label = nls.localize('outputScrollOff', "Turn Auto Scrolling Off");
            }
        }
    };
    ToggleOrSetOutputScrollLockAction.ID = 'workbench.output.action.toggleOutputScrollLock';
    ToggleOrSetOutputScrollLockAction.LABEL = nls.localize({ key: 'toggleOutputScrollLock', comment: ['Turn on / off automatic output scrolling'] }, "Toggle Output Scroll Lock");
    ToggleOrSetOutputScrollLockAction = __decorate([
        __param(2, output_1.IOutputService)
    ], ToggleOrSetOutputScrollLockAction);
    exports.ToggleOrSetOutputScrollLockAction = ToggleOrSetOutputScrollLockAction;
    let SwitchOutputAction = class SwitchOutputAction extends actions_1.Action {
        constructor(outputService) {
            super(SwitchOutputAction.ID, nls.localize('switchToOutput.label', "Switch to Output"));
            this.outputService = outputService;
            this.class = 'output-action switch-to-output';
        }
        run(channelId) {
            return this.outputService.showChannel(channelId);
        }
    };
    SwitchOutputAction.ID = 'workbench.output.action.switchBetweenOutputs';
    SwitchOutputAction = __decorate([
        __param(0, output_1.IOutputService)
    ], SwitchOutputAction);
    exports.SwitchOutputAction = SwitchOutputAction;
    let SwitchOutputActionViewItem = class SwitchOutputActionViewItem extends actionbar_1.SelectActionViewItem {
        constructor(action, outputService, themeService, contextViewService) {
            super(null, action, [], 0, contextViewService, { ariaLabel: nls.localize('outputChannels', 'Output Channels.') });
            this.outputService = outputService;
            this.outputChannels = [];
            this.logChannels = [];
            let outputChannelRegistry = platform_1.Registry.as(output_1.Extensions.OutputChannels);
            this._register(outputChannelRegistry.onDidRegisterChannel(() => this.updateOtions()));
            this._register(outputChannelRegistry.onDidRemoveChannel(() => this.updateOtions()));
            this._register(this.outputService.onActiveOutputChannel(() => this.updateOtions()));
            this._register(styler_1.attachSelectBoxStyler(this.selectBox, themeService));
            this.updateOtions();
        }
        getActionContext(option, index) {
            const channel = index < this.outputChannels.length ? this.outputChannels[index] : this.logChannels[index - this.outputChannels.length - 1];
            return channel ? channel.id : option;
        }
        updateOtions() {
            const groups = arrays_1.groupBy(this.outputService.getChannelDescriptors(), (c1, c2) => {
                if (!c1.log && c2.log) {
                    return -1;
                }
                if (c1.log && !c2.log) {
                    return 1;
                }
                return 0;
            });
            this.outputChannels = groups[0] || [];
            this.logChannels = groups[1] || [];
            const showSeparator = this.outputChannels.length && this.logChannels.length;
            const separatorIndex = showSeparator ? this.outputChannels.length : -1;
            const options = [...this.outputChannels.map(c => c.label), ...(showSeparator ? [SwitchOutputActionViewItem.SEPARATOR] : []), ...this.logChannels.map(c => nls.localize('logChannel', "Log ({0})", c.label))];
            let selected = 0;
            const activeChannel = this.outputService.getActiveChannel();
            if (activeChannel) {
                selected = this.outputChannels.map(c => c.id).indexOf(activeChannel.id);
                if (selected === -1) {
                    const logChannelIndex = this.logChannels.map(c => c.id).indexOf(activeChannel.id);
                    selected = logChannelIndex !== -1 ? separatorIndex + 1 + logChannelIndex : 0;
                }
            }
            this.setOptions(options.map((label, index) => ({ text: label, isDisabled: (index === separatorIndex ? true : undefined) })), Math.max(0, selected));
        }
    };
    SwitchOutputActionViewItem.SEPARATOR = '─────────';
    SwitchOutputActionViewItem = __decorate([
        __param(1, output_1.IOutputService),
        __param(2, themeService_1.IThemeService),
        __param(3, contextView_1.IContextViewService)
    ], SwitchOutputActionViewItem);
    exports.SwitchOutputActionViewItem = SwitchOutputActionViewItem;
    let OpenLogOutputFile = class OpenLogOutputFile extends actions_1.Action {
        constructor(outputService, editorService, instantiationService) {
            super(OpenLogOutputFile.ID, OpenLogOutputFile.LABEL, 'output-action codicon-go-to-file');
            this.outputService = outputService;
            this.editorService = editorService;
            this.instantiationService = instantiationService;
            this._register(this.outputService.onActiveOutputChannel(this.update, this));
            this.update();
        }
        update() {
            this.enabled = !!this.getLogFileOutputChannelDescriptor();
        }
        run() {
            const logFileOutputChannelDescriptor = this.getLogFileOutputChannelDescriptor();
            return logFileOutputChannelDescriptor ? this.editorService.openEditor(this.instantiationService.createInstance(logViewer_1.LogViewerInput, logFileOutputChannelDescriptor)).then(() => null) : Promise.resolve(null);
        }
        getLogFileOutputChannelDescriptor() {
            const channel = this.outputService.getActiveChannel();
            if (channel) {
                const descriptor = this.outputService.getChannelDescriptors().filter(c => c.id === channel.id)[0];
                if (descriptor && descriptor.file && descriptor.log) {
                    return descriptor;
                }
            }
            return null;
        }
    };
    OpenLogOutputFile.ID = 'workbench.output.action.openLogOutputFile';
    OpenLogOutputFile.LABEL = nls.localize('openInLogViewer', "Open Log File");
    OpenLogOutputFile = __decorate([
        __param(0, output_1.IOutputService),
        __param(1, editorService_1.IEditorService),
        __param(2, instantiation_1.IInstantiationService)
    ], OpenLogOutputFile);
    exports.OpenLogOutputFile = OpenLogOutputFile;
    let ShowLogsOutputChannelAction = class ShowLogsOutputChannelAction extends actions_1.Action {
        constructor(id, label, quickInputService, outputService) {
            super(id, label);
            this.quickInputService = quickInputService;
            this.outputService = outputService;
        }
        run() {
            const entries = this.outputService.getChannelDescriptors().filter(c => c.file && c.log)
                .map(({ id, label }) => ({ id, label }));
            return this.quickInputService.pick(entries, { placeHolder: nls.localize('selectlog', "Select Log") })
                .then(entry => {
                if (entry) {
                    return this.outputService.showChannel(entry.id);
                }
                return undefined;
            });
        }
    };
    ShowLogsOutputChannelAction.ID = 'workbench.action.showLogs';
    ShowLogsOutputChannelAction.LABEL = nls.localize('showLogs', "Show Logs...");
    ShowLogsOutputChannelAction = __decorate([
        __param(2, quickInput_1.IQuickInputService),
        __param(3, output_1.IOutputService)
    ], ShowLogsOutputChannelAction);
    exports.ShowLogsOutputChannelAction = ShowLogsOutputChannelAction;
    let OpenOutputLogFileAction = class OpenOutputLogFileAction extends actions_1.Action {
        constructor(id, label, quickInputService, outputService, editorService, instantiationService) {
            super(id, label);
            this.quickInputService = quickInputService;
            this.outputService = outputService;
            this.editorService = editorService;
            this.instantiationService = instantiationService;
        }
        run() {
            const entries = this.outputService.getChannelDescriptors().filter(c => c.file && c.log)
                .map(channel => ({ id: channel.id, label: channel.label, channel }));
            return this.quickInputService.pick(entries, { placeHolder: nls.localize('selectlogFile', "Select Log file") })
                .then(entry => {
                if (entry) {
                    types_1.assertIsDefined(entry.channel.file);
                    return this.editorService.openEditor(this.instantiationService.createInstance(logViewer_1.LogViewerInput, entry.channel)).then(() => undefined);
                }
                return undefined;
            });
        }
    };
    OpenOutputLogFileAction.ID = 'workbench.action.openLogFile';
    OpenOutputLogFileAction.LABEL = nls.localize('openLogFile', "Open Log File...");
    OpenOutputLogFileAction = __decorate([
        __param(2, quickInput_1.IQuickInputService),
        __param(3, output_1.IOutputService),
        __param(4, editorService_1.IEditorService),
        __param(5, instantiation_1.IInstantiationService)
    ], OpenOutputLogFileAction);
    exports.OpenOutputLogFileAction = OpenOutputLogFileAction;
});
//# sourceMappingURL=outputActions.js.map