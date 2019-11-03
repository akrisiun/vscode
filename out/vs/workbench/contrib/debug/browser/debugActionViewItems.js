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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/selectBox/selectBox", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/configuration/common/configuration", "vs/platform/commands/common/commands", "vs/workbench/contrib/debug/common/debug", "vs/platform/theme/common/themeService", "vs/platform/theme/common/styler", "vs/workbench/common/theme", "vs/platform/theme/common/colorRegistry", "vs/platform/contextview/browser/contextView", "vs/platform/workspace/common/workspace", "vs/base/common/lifecycle"], function (require, exports, nls, dom, keyboardEvent_1, selectBox_1, actionbar_1, configuration_1, commands_1, debug_1, themeService_1, styler_1, theme_1, colorRegistry_1, contextView_1, workspace_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const $ = dom.$;
    let StartDebugActionViewItem = class StartDebugActionViewItem {
        constructor(context, action, debugService, themeService, configurationService, commandService, contextService, contextViewService) {
            this.context = context;
            this.action = action;
            this.debugService = debugService;
            this.themeService = themeService;
            this.configurationService = configurationService;
            this.commandService = commandService;
            this.contextService = contextService;
            this.options = [];
            this.selected = 0;
            this.toDispose = [];
            this.selectBox = new selectBox_1.SelectBox([], -1, contextViewService, undefined, { ariaLabel: nls.localize('debugLaunchConfigurations', 'Debug Launch Configurations') });
            this.toDispose.push(this.selectBox);
            this.toDispose.push(styler_1.attachSelectBoxStyler(this.selectBox, themeService, {
                selectBackground: theme_1.SIDE_BAR_BACKGROUND
            }));
            this.registerListeners();
        }
        registerListeners() {
            this.toDispose.push(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('launch')) {
                    this.updateOptions();
                }
            }));
            this.toDispose.push(this.debugService.getConfigurationManager().onDidSelectConfiguration(() => {
                this.updateOptions();
            }));
        }
        render(container) {
            this.container = container;
            dom.addClass(container, 'start-debug-action-item');
            this.start = dom.append(container, $('.codicon.codicon-debug-start'));
            this.start.title = this.action.label;
            this.start.setAttribute('role', 'button');
            this.start.tabIndex = 0;
            this.toDispose.push(dom.addDisposableListener(this.start, dom.EventType.CLICK, () => {
                this.start.blur();
                this.actionRunner.run(this.action, this.context);
            }));
            this.toDispose.push(dom.addDisposableListener(this.start, dom.EventType.MOUSE_DOWN, (e) => {
                if (this.action.enabled && e.button === 0) {
                    dom.addClass(this.start, 'active');
                }
            }));
            this.toDispose.push(dom.addDisposableListener(this.start, dom.EventType.MOUSE_UP, () => {
                dom.removeClass(this.start, 'active');
            }));
            this.toDispose.push(dom.addDisposableListener(this.start, dom.EventType.MOUSE_OUT, () => {
                dom.removeClass(this.start, 'active');
            }));
            this.toDispose.push(dom.addDisposableListener(this.start, dom.EventType.KEY_DOWN, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(3 /* Enter */)) {
                    this.actionRunner.run(this.action, this.context);
                }
                if (event.equals(17 /* RightArrow */)) {
                    this.selectBox.focus();
                    event.stopPropagation();
                }
            }));
            this.toDispose.push(this.selectBox.onDidSelect(e => {
                const target = this.options[e.index];
                const shouldBeSelected = target.handler ? target.handler() : false;
                if (shouldBeSelected) {
                    this.selected = e.index;
                }
                else {
                    // Some select options should not remain selected https://github.com/Microsoft/vscode/issues/31526
                    this.selectBox.select(this.selected);
                }
            }));
            const selectBoxContainer = $('.configuration');
            this.selectBox.render(dom.append(container, selectBoxContainer));
            this.toDispose.push(dom.addDisposableListener(selectBoxContainer, dom.EventType.KEY_DOWN, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(15 /* LeftArrow */)) {
                    this.start.focus();
                    event.stopPropagation();
                }
            }));
            this.toDispose.push(styler_1.attachStylerCallback(this.themeService, { selectBorder: colorRegistry_1.selectBorder }, colors => {
                this.container.style.border = colors.selectBorder ? `1px solid ${colors.selectBorder}` : '';
                selectBoxContainer.style.borderLeft = colors.selectBorder ? `1px solid ${colors.selectBorder}` : '';
            }));
            this.updateOptions();
        }
        setActionContext(context) {
            this.context = context;
        }
        isEnabled() {
            return true;
        }
        focus(fromRight) {
            if (fromRight) {
                this.selectBox.focus();
            }
            else {
                this.start.focus();
            }
        }
        blur() {
            this.container.blur();
        }
        dispose() {
            this.toDispose = lifecycle_1.dispose(this.toDispose);
        }
        updateOptions() {
            this.selected = 0;
            this.options = [];
            const manager = this.debugService.getConfigurationManager();
            const launches = manager.getLaunches();
            const inWorkspace = this.contextService.getWorkbenchState() === 3 /* WORKSPACE */;
            launches.forEach(launch => launch.getConfigurationNames().forEach(name => {
                if (name === manager.selectedConfiguration.name && launch === manager.selectedConfiguration.launch) {
                    this.selected = this.options.length;
                }
                const label = inWorkspace ? `${name} (${launch.name})` : name;
                this.options.push({ label, handler: () => { manager.selectConfiguration(launch, name); return true; } });
            }));
            if (this.options.length === 0) {
                this.options.push({ label: nls.localize('noConfigurations', "No Configurations"), handler: () => false });
            }
            else {
                this.options.push({ label: StartDebugActionViewItem.SEPARATOR, handler: undefined });
            }
            const disabledIdx = this.options.length - 1;
            launches.filter(l => !l.hidden).forEach(l => {
                const label = inWorkspace ? nls.localize("addConfigTo", "Add Config ({0})...", l.name) : nls.localize('addConfiguration', "Add Configuration...");
                this.options.push({
                    label, handler: () => {
                        this.commandService.executeCommand('debug.addConfiguration', l.uri.toString());
                        return false;
                    }
                });
            });
            this.selectBox.setOptions(this.options.map((data, index) => ({ text: data.label, isDisabled: (index === disabledIdx ? true : undefined) })), this.selected);
        }
    };
    StartDebugActionViewItem.SEPARATOR = '─────────';
    StartDebugActionViewItem = __decorate([
        __param(2, debug_1.IDebugService),
        __param(3, themeService_1.IThemeService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, commands_1.ICommandService),
        __param(6, workspace_1.IWorkspaceContextService),
        __param(7, contextView_1.IContextViewService)
    ], StartDebugActionViewItem);
    exports.StartDebugActionViewItem = StartDebugActionViewItem;
    let FocusSessionActionViewItem = class FocusSessionActionViewItem extends actionbar_1.SelectActionViewItem {
        constructor(action, debugService, themeService, contextViewService, configurationService) {
            super(null, action, [], -1, contextViewService, { ariaLabel: nls.localize('debugSession', 'Debug Session') });
            this.debugService = debugService;
            this.configurationService = configurationService;
            this._register(styler_1.attachSelectBoxStyler(this.selectBox, themeService));
            this._register(this.debugService.getViewModel().onDidFocusSession(() => {
                const session = this.getSelectedSession();
                if (session) {
                    const index = this.getSessions().indexOf(session);
                    this.select(index);
                }
            }));
            this._register(this.debugService.onDidNewSession(session => {
                this._register(session.onDidChangeName(() => this.update()));
                this.update();
            }));
            this.getSessions().forEach(session => {
                this._register(session.onDidChangeName(() => this.update()));
            });
            this._register(this.debugService.onDidEndSession(() => this.update()));
            this.update();
        }
        getActionContext(_, index) {
            return this.getSessions()[index];
        }
        update() {
            const session = this.getSelectedSession();
            const sessions = this.getSessions();
            const names = sessions.map(s => {
                const label = s.getLabel();
                if (s.parentSession) {
                    // Indent child sessions so they look like children
                    return `\u00A0\u00A0${label}`;
                }
                return label;
            });
            this.setOptions(names.map(data => ({ text: data })), session ? sessions.indexOf(session) : undefined);
        }
        getSelectedSession() {
            const session = this.debugService.getViewModel().focusedSession;
            return session ? this.mapFocusedSessionToSelected(session) : undefined;
        }
        getSessions() {
            const showSubSessions = this.configurationService.getValue('debug').showSubSessionsInToolBar;
            const sessions = this.debugService.getModel().getSessions();
            return showSubSessions ? sessions : sessions.filter(s => !s.parentSession);
        }
        mapFocusedSessionToSelected(focusedSession) {
            const showSubSessions = this.configurationService.getValue('debug').showSubSessionsInToolBar;
            while (focusedSession.parentSession && !showSubSessions) {
                focusedSession = focusedSession.parentSession;
            }
            return focusedSession;
        }
    };
    FocusSessionActionViewItem = __decorate([
        __param(1, debug_1.IDebugService),
        __param(2, themeService_1.IThemeService),
        __param(3, contextView_1.IContextViewService),
        __param(4, configuration_1.IConfigurationService)
    ], FocusSessionActionViewItem);
    exports.FocusSessionActionViewItem = FocusSessionActionViewItem;
});
//# sourceMappingURL=debugActionViewItems.js.map