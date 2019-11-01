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
define(["require", "exports", "vs/base/browser/dom", "vs/nls", "vs/base/common/platform", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/configuration/common/configuration", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/terminal/common/terminal", "vs/platform/theme/common/themeService", "vs/workbench/contrib/terminal/browser/terminalFindWidget", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/browser/panel", "vs/base/browser/mouseEvent", "vs/base/common/uri", "vs/workbench/contrib/terminal/common/terminalColorRegistry", "vs/base/browser/dnd", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/workbench/contrib/terminal/browser/terminal"], function (require, exports, dom, nls, platform, actionbar_1, configuration_1, contextView_1, instantiation_1, telemetry_1, terminal_1, themeService_1, terminalFindWidget_1, colorRegistry_1, terminalActions_1, panel_1, mouseEvent_1, uri_1, terminalColorRegistry_1, dnd_1, notification_1, storage_1, terminal_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const FIND_FOCUS_CLASS = 'find-focused';
    let TerminalPanel = class TerminalPanel extends panel_1.Panel {
        constructor(_configurationService, _contextMenuService, _instantiationService, _terminalService, _themeService, telemetryService, _notificationService, storageService) {
            super(terminal_1.TERMINAL_PANEL_ID, telemetryService, _themeService, storageService);
            this._configurationService = _configurationService;
            this._contextMenuService = _contextMenuService;
            this._instantiationService = _instantiationService;
            this._terminalService = _terminalService;
            this._themeService = _themeService;
            this._notificationService = _notificationService;
            this._cancelContextMenu = false;
        }
        create(parent) {
            super.create(parent);
            this._parentDomElement = parent;
            dom.addClass(this._parentDomElement, 'integrated-terminal');
            this._fontStyleElement = document.createElement('style');
            this._terminalContainer = document.createElement('div');
            dom.addClass(this._terminalContainer, 'terminal-outer-container');
            this._findWidget = this._instantiationService.createInstance(terminalFindWidget_1.TerminalFindWidget, this._terminalService.getFindState());
            this._findWidget.focusTracker.onDidFocus(() => this._terminalContainer.classList.add(FIND_FOCUS_CLASS));
            this._parentDomElement.appendChild(this._fontStyleElement);
            this._parentDomElement.appendChild(this._terminalContainer);
            this._parentDomElement.appendChild(this._findWidget.getDomNode());
            this._attachEventListeners(this._parentDomElement, this._terminalContainer);
            this._terminalService.setContainers(this.getContainer(), this._terminalContainer);
            this._register(this.themeService.onThemeChange(theme => this._updateTheme(theme)));
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('terminal.integrated') || e.affectsConfiguration('editor.fontFamily')) {
                    this._updateFont();
                }
                if (e.affectsConfiguration('terminal.integrated.fontFamily') || e.affectsConfiguration('editor.fontFamily')) {
                    const configHelper = this._terminalService.configHelper;
                    if (!configHelper.configFontIsMonospace()) {
                        const choices = [{
                                label: nls.localize('terminal.useMonospace', "Use 'monospace'"),
                                run: () => this._configurationService.updateValue('terminal.integrated.fontFamily', 'monospace'),
                            }];
                        this._notificationService.prompt(notification_1.Severity.Warning, nls.localize('terminal.monospaceOnly', "The terminal only supports monospace fonts."), choices);
                    }
                }
            }));
            this._updateFont();
            this._updateTheme();
            this._register(this.onDidChangeVisibility(visible => {
                if (visible) {
                    if (this._terminalService.terminalInstances.length > 0) {
                        this._updateFont();
                        this._updateTheme();
                    }
                    else {
                        // Check if instances were already restored as part of workbench restore
                        if (this._terminalService.terminalInstances.length === 0) {
                            this._terminalService.createTerminal();
                        }
                        if (this._terminalService.terminalInstances.length > 0) {
                            this._updateFont();
                            this._updateTheme();
                        }
                    }
                }
            }));
            // Force another layout (first is setContainers) since config has changed
            this.layout(new dom.Dimension(this._terminalContainer.offsetWidth, this._terminalContainer.offsetHeight));
        }
        layout(dimension) {
            if (!dimension) {
                return;
            }
            this._terminalService.terminalTabs.forEach(t => t.layout(dimension.width, dimension.height));
        }
        getActions() {
            if (!this._actions) {
                this._actions = [
                    this._instantiationService.createInstance(terminalActions_1.SwitchTerminalAction, terminalActions_1.SwitchTerminalAction.ID, terminalActions_1.SwitchTerminalAction.LABEL),
                    this._instantiationService.createInstance(terminalActions_1.CreateNewTerminalAction, terminalActions_1.CreateNewTerminalAction.ID, terminalActions_1.CreateNewTerminalAction.SHORT_LABEL),
                    this._instantiationService.createInstance(terminalActions_1.SplitTerminalAction, terminalActions_1.SplitTerminalAction.ID, terminalActions_1.SplitTerminalAction.LABEL),
                    this._instantiationService.createInstance(terminalActions_1.KillTerminalAction, terminalActions_1.KillTerminalAction.ID, terminalActions_1.KillTerminalAction.PANEL_LABEL)
                ];
                this._actions.forEach(a => {
                    this._register(a);
                });
            }
            return this._actions;
        }
        _getContextMenuActions() {
            if (!this._contextMenuActions || !this._copyContextMenuAction) {
                this._copyContextMenuAction = this._instantiationService.createInstance(terminalActions_1.CopyTerminalSelectionAction, terminalActions_1.CopyTerminalSelectionAction.ID, terminalActions_1.CopyTerminalSelectionAction.SHORT_LABEL);
                this._contextMenuActions = [
                    this._instantiationService.createInstance(terminalActions_1.CreateNewTerminalAction, terminalActions_1.CreateNewTerminalAction.ID, terminalActions_1.CreateNewTerminalAction.SHORT_LABEL),
                    this._instantiationService.createInstance(terminalActions_1.SplitTerminalAction, terminalActions_1.SplitTerminalAction.ID, terminalActions_1.SplitTerminalAction.SHORT_LABEL),
                    new actionbar_1.Separator(),
                    this._copyContextMenuAction,
                    this._instantiationService.createInstance(terminalActions_1.TerminalPasteAction, terminalActions_1.TerminalPasteAction.ID, terminalActions_1.TerminalPasteAction.SHORT_LABEL),
                    this._instantiationService.createInstance(terminalActions_1.SelectAllTerminalAction, terminalActions_1.SelectAllTerminalAction.ID, terminalActions_1.SelectAllTerminalAction.LABEL),
                    new actionbar_1.Separator(),
                    this._instantiationService.createInstance(terminalActions_1.ClearTerminalAction, terminalActions_1.ClearTerminalAction.ID, terminalActions_1.ClearTerminalAction.LABEL),
                    new actionbar_1.Separator(),
                    this._instantiationService.createInstance(terminalActions_1.KillTerminalAction, terminalActions_1.KillTerminalAction.ID, terminalActions_1.KillTerminalAction.PANEL_LABEL)
                ];
                this._contextMenuActions.forEach(a => {
                    this._register(a);
                });
            }
            const activeInstance = this._terminalService.getActiveInstance();
            this._copyContextMenuAction.enabled = !!activeInstance && activeInstance.hasSelection();
            return this._contextMenuActions;
        }
        getActionViewItem(action) {
            if (action.id === terminalActions_1.SwitchTerminalAction.ID) {
                return this._instantiationService.createInstance(terminalActions_1.SwitchTerminalActionViewItem, action);
            }
            return super.getActionViewItem(action);
        }
        focus() {
            const activeInstance = this._terminalService.getActiveInstance();
            if (activeInstance) {
                activeInstance.focusWhenReady(true);
            }
        }
        focusFindWidget() {
            const activeInstance = this._terminalService.getActiveInstance();
            if (activeInstance && activeInstance.hasSelection() && activeInstance.selection.indexOf('\n') === -1) {
                this._findWidget.reveal(activeInstance.selection);
            }
            else {
                this._findWidget.reveal();
            }
        }
        hideFindWidget() {
            this._findWidget.hide();
        }
        showFindWidget() {
            const activeInstance = this._terminalService.getActiveInstance();
            if (activeInstance && activeInstance.hasSelection() && activeInstance.selection.indexOf('\n') === -1) {
                this._findWidget.show(activeInstance.selection);
            }
            else {
                this._findWidget.show();
            }
        }
        getFindWidget() {
            return this._findWidget;
        }
        _attachEventListeners(parentDomElement, terminalContainer) {
            this._register(dom.addDisposableListener(parentDomElement, 'mousedown', async (event) => {
                if (this._terminalService.terminalInstances.length === 0) {
                    return;
                }
                if (event.which === 2 && platform.isLinux) {
                    // Drop selection and focus terminal on Linux to enable middle button paste when click
                    // occurs on the selection itself.
                    const terminal = this._terminalService.getActiveInstance();
                    if (terminal) {
                        terminal.focus();
                    }
                }
                else if (event.which === 3) {
                    if (this._terminalService.configHelper.config.rightClickBehavior === 'copyPaste') {
                        const terminal = this._terminalService.getActiveInstance();
                        if (!terminal) {
                            return;
                        }
                        if (terminal.hasSelection()) {
                            await terminal.copySelection();
                            terminal.clearSelection();
                        }
                        else {
                            terminal.paste();
                        }
                        // Clear selection after all click event bubbling is finished on Mac to prevent
                        // right-click selecting a word which is seemed cannot be disabled. There is a
                        // flicker when pasting but this appears to give the best experience if the
                        // setting is enabled.
                        if (platform.isMacintosh) {
                            setTimeout(() => {
                                terminal.clearSelection();
                            }, 0);
                        }
                        this._cancelContextMenu = true;
                    }
                }
            }));
            this._register(dom.addDisposableListener(parentDomElement, 'contextmenu', (event) => {
                if (!this._cancelContextMenu) {
                    const standardEvent = new mouseEvent_1.StandardMouseEvent(event);
                    const anchor = { x: standardEvent.posx, y: standardEvent.posy };
                    this._contextMenuService.showContextMenu({
                        getAnchor: () => anchor,
                        getActions: () => this._getContextMenuActions(),
                        getActionsContext: () => this._parentDomElement
                    });
                }
                else {
                    event.stopImmediatePropagation();
                }
                this._cancelContextMenu = false;
            }));
            this._register(dom.addDisposableListener(document, 'keydown', (event) => {
                terminalContainer.classList.toggle('alt-active', !!event.altKey);
            }));
            this._register(dom.addDisposableListener(document, 'keyup', (event) => {
                terminalContainer.classList.toggle('alt-active', !!event.altKey);
            }));
            this._register(dom.addDisposableListener(parentDomElement, 'keyup', (event) => {
                if (event.keyCode === 27) {
                    // Keep terminal open on escape
                    event.stopPropagation();
                }
            }));
            this._register(dom.addDisposableListener(parentDomElement, dom.EventType.DROP, async (e) => {
                if (e.target === this._parentDomElement || dom.isAncestor(e.target, parentDomElement)) {
                    if (!e.dataTransfer) {
                        return;
                    }
                    // Check if files were dragged from the tree explorer
                    let path;
                    const resources = e.dataTransfer.getData(dnd_1.DataTransfers.RESOURCES);
                    if (resources) {
                        path = uri_1.URI.parse(JSON.parse(resources)[0]).fsPath;
                    }
                    else if (e.dataTransfer.files.length > 0 && e.dataTransfer.files[0].path /* Electron only */) {
                        // Check if the file was dragged from the filesystem
                        path = uri_1.URI.file(e.dataTransfer.files[0].path).fsPath;
                    }
                    if (!path) {
                        return;
                    }
                    const terminal = this._terminalService.getActiveInstance();
                    if (terminal) {
                        return this._terminalService.preparePathForTerminalAsync(path, terminal.shellLaunchConfig.executable, terminal.title).then(preparedPath => {
                            terminal.sendText(preparedPath, false);
                        });
                    }
                }
            }));
        }
        _updateTheme(theme) {
            if (!theme) {
                theme = this.themeService.getTheme();
            }
            if (this._findWidget) {
                this._findWidget.updateTheme(theme);
            }
        }
        _updateFont() {
            if (this._terminalService.terminalInstances.length === 0 || !this._parentDomElement) {
                return;
            }
            // TODO: Can we support ligatures?
            // dom.toggleClass(this._parentDomElement, 'enable-ligatures', this._terminalService.configHelper.config.fontLigatures);
            this.layout(new dom.Dimension(this._parentDomElement.offsetWidth, this._parentDomElement.offsetHeight));
        }
    };
    TerminalPanel = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, contextView_1.IContextMenuService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, terminal_2.ITerminalService),
        __param(4, themeService_1.IThemeService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, notification_1.INotificationService),
        __param(7, storage_1.IStorageService)
    ], TerminalPanel);
    exports.TerminalPanel = TerminalPanel;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const backgroundColor = theme.getColor(terminalColorRegistry_1.TERMINAL_BACKGROUND_COLOR);
        collector.addRule(`.monaco-workbench .panel.integrated-terminal .terminal-outer-container { background-color: ${backgroundColor ? backgroundColor.toString() : ''}; }`);
        const borderColor = theme.getColor(terminalColorRegistry_1.TERMINAL_BORDER_COLOR);
        if (borderColor) {
            collector.addRule(`.monaco-workbench .panel.integrated-terminal .split-view-view:not(:first-child) { border-color: ${borderColor.toString()}; }`);
        }
        // Borrow the editor's hover background for now
        const hoverBackground = theme.getColor(colorRegistry_1.editorHoverBackground);
        if (hoverBackground) {
            collector.addRule(`.monaco-workbench .panel.integrated-terminal .terminal-message-widget { background-color: ${hoverBackground}; }`);
        }
        const hoverBorder = theme.getColor(colorRegistry_1.editorHoverBorder);
        if (hoverBorder) {
            collector.addRule(`.monaco-workbench .panel.integrated-terminal .terminal-message-widget { border: 1px solid ${hoverBorder}; }`);
        }
        const hoverForeground = theme.getColor(colorRegistry_1.editorForeground);
        if (hoverForeground) {
            collector.addRule(`.monaco-workbench .panel.integrated-terminal .terminal-message-widget { color: ${hoverForeground}; }`);
        }
    });
});
//# sourceMappingURL=terminalPanel.js.map