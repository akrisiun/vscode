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
define(["require", "exports", "vs/nls", "vs/base/common/errors", "vs/base/browser/dom", "vs/base/browser/ui/button/button", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/actions/workspaceActions", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/workbench/browser/parts/views/panelViewlet", "vs/workbench/browser/dnd", "vs/platform/theme/common/colorRegistry", "vs/workbench/common/theme", "vs/workbench/services/environment/common/environmentService", "vs/platform/label/common/label", "vs/base/common/network", "vs/base/common/platform", "vs/platform/contextkey/common/contextkey"], function (require, exports, nls, errors, DOM, button_1, instantiation_1, workspaceActions_1, styler_1, themeService_1, keybinding_1, contextView_1, workspace_1, configuration_1, panelViewlet_1, dnd_1, colorRegistry_1, theme_1, environmentService_1, label_1, network_1, platform_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let EmptyView = class EmptyView extends panelViewlet_1.ViewletPanel {
        constructor(options, themeService, instantiationService, keybindingService, contextMenuService, contextService, configurationService, environmentService, labelService, contextKeyService) {
            super(Object.assign(Object.assign({}, options), { ariaHeaderLabel: nls.localize('explorerSection', "Files Explorer Section") }), keybindingService, contextMenuService, configurationService, contextKeyService);
            this.themeService = themeService;
            this.instantiationService = instantiationService;
            this.contextService = contextService;
            this.environmentService = environmentService;
            this.labelService = labelService;
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.setLabels()));
            this._register(this.labelService.onDidChangeFormatters(() => this.setLabels()));
        }
        renderBody(container) {
            DOM.addClass(container, 'explorer-empty-view');
            container.tabIndex = 0;
            const messageContainer = document.createElement('div');
            DOM.addClass(messageContainer, 'section');
            container.appendChild(messageContainer);
            this.messageElement = document.createElement('p');
            messageContainer.appendChild(this.messageElement);
            this.button = new button_1.Button(messageContainer);
            styler_1.attachButtonStyler(this.button, this.themeService);
            this._register(this.button.onDidClick(() => {
                if (!this.actionRunner) {
                    return;
                }
                const action = this.contextService.getWorkbenchState() === 3 /* WORKSPACE */
                    ? this.instantiationService.createInstance(workspaceActions_1.AddRootFolderAction, workspaceActions_1.AddRootFolderAction.ID, workspaceActions_1.AddRootFolderAction.LABEL)
                    : this.instantiationService.createInstance(workspaceActions_1.OpenFolderAction, workspaceActions_1.OpenFolderAction.ID, workspaceActions_1.OpenFolderAction.LABEL);
                this.actionRunner.run(action).then(() => {
                    action.dispose();
                }, err => {
                    action.dispose();
                    errors.onUnexpectedError(err);
                });
            }));
            this._register(new dnd_1.DragAndDropObserver(container, {
                onDrop: e => {
                    const color = this.themeService.getTheme().getColor(theme_1.SIDE_BAR_BACKGROUND);
                    container.style.backgroundColor = color ? color.toString() : '';
                    const dropHandler = this.instantiationService.createInstance(dnd_1.ResourcesDropHandler, { allowWorkspaceOpen: true });
                    dropHandler.handleDrop(e, () => undefined, targetGroup => undefined);
                },
                onDragEnter: (e) => {
                    const color = this.themeService.getTheme().getColor(colorRegistry_1.listDropBackground);
                    container.style.backgroundColor = color ? color.toString() : '';
                },
                onDragEnd: () => {
                    const color = this.themeService.getTheme().getColor(theme_1.SIDE_BAR_BACKGROUND);
                    container.style.backgroundColor = color ? color.toString() : '';
                },
                onDragLeave: () => {
                    const color = this.themeService.getTheme().getColor(theme_1.SIDE_BAR_BACKGROUND);
                    container.style.backgroundColor = color ? color.toString() : '';
                },
                onDragOver: e => {
                    if (e.dataTransfer) {
                        e.dataTransfer.dropEffect = 'copy';
                    }
                }
            }));
            this.setLabels();
        }
        setLabels() {
            if (this.contextService.getWorkbenchState() === 3 /* WORKSPACE */) {
                this.messageElement.textContent = nls.localize('noWorkspaceHelp', "You have not yet added a folder to the workspace.");
                if (this.button) {
                    this.button.label = nls.localize('addFolder', "Add Folder");
                }
                this.updateTitle(EmptyView.NAME);
            }
            else {
                if (this.environmentService.configuration.remoteAuthority && !platform_1.isWeb) {
                    const hostLabel = this.labelService.getHostLabel(network_1.Schemas.vscodeRemote, this.environmentService.configuration.remoteAuthority);
                    this.messageElement.textContent = hostLabel ? nls.localize('remoteNoFolderHelp', "Connected to {0}", hostLabel) : nls.localize('connecting', "Connecting...");
                }
                else {
                    this.messageElement.textContent = nls.localize('noFolderHelp', "You have not yet opened a folder.");
                }
                if (this.button) {
                    this.button.label = nls.localize('openFolder', "Open Folder");
                }
                this.updateTitle(this.title);
            }
        }
        layoutBody(size) {
            // no-op
        }
        focusBody() {
            if (this.button) {
                this.button.element.focus();
            }
        }
    };
    EmptyView.ID = 'workbench.explorer.emptyView';
    EmptyView.NAME = nls.localize('noWorkspace', "No Folder Opened");
    EmptyView = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, environmentService_1.IWorkbenchEnvironmentService),
        __param(8, label_1.ILabelService),
        __param(9, contextkey_1.IContextKeyService)
    ], EmptyView);
    exports.EmptyView = EmptyView;
});
//# sourceMappingURL=emptyView.js.map