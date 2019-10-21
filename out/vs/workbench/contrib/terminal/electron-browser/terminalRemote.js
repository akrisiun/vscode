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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/common/actions", "vs/platform/actions/common/actions", "vs/workbench/contrib/terminal/common/terminal", "vs/base/common/actions", "vs/base/common/uri", "os", "vs/workbench/contrib/terminal/browser/terminal"], function (require, exports, nls, platform_1, actions_1, actions_2, terminal_1, actions_3, uri_1, os_1, terminal_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function registerRemoteContributions() {
        const actionRegistry = platform_1.Registry.as(actions_1.Extensions.WorkbenchActions);
        actionRegistry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(CreateNewLocalTerminalAction, CreateNewLocalTerminalAction.ID, CreateNewLocalTerminalAction.LABEL), 'Terminal: Create New Integrated Terminal (Local)', terminal_1.TERMINAL_ACTION_CATEGORY);
    }
    exports.registerRemoteContributions = registerRemoteContributions;
    let CreateNewLocalTerminalAction = class CreateNewLocalTerminalAction extends actions_3.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run(event) {
            const instance = this.terminalService.createTerminal({ cwd: uri_1.URI.file(os_1.homedir()) });
            if (!instance) {
                return Promise.resolve(undefined);
            }
            // Append (Local) to the first title that comes back, the title will then become static
            const disposable = instance.onTitleChanged(() => {
                if (instance.title && instance.title.trim().length > 0) {
                    disposable.dispose();
                    instance.setTitle(`${instance.title} (Local)`, terminal_1.TitleEventSource.Api);
                }
            });
            this.terminalService.setActiveInstance(instance);
            return this.terminalService.showPanel(true);
        }
    };
    CreateNewLocalTerminalAction.ID = "workbench.action.terminal.newLocal" /* NEW_LOCAL */;
    CreateNewLocalTerminalAction.LABEL = nls.localize('workbench.action.terminal.newLocal', "Create New Integrated Terminal (Local)");
    CreateNewLocalTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], CreateNewLocalTerminalAction);
    exports.CreateNewLocalTerminalAction = CreateNewLocalTerminalAction;
});
//# sourceMappingURL=terminalRemote.js.map