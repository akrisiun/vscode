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
define(["require", "exports", "vs/nls", "vs/base/parts/quickopen/browser/quickOpenModel", "vs/workbench/browser/quickopen", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/contrib/output/common/output", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/services/panel/common/panelService", "vs/platform/quickOpen/common/quickOpen", "vs/base/common/actions", "vs/platform/keybinding/common/keybinding", "vs/base/common/strings", "vs/base/common/filters", "vs/workbench/common/views", "vs/platform/contextkey/common/contextkey", "vs/platform/registry/common/platform"], function (require, exports, nls, quickOpenModel_1, quickopen_1, viewlet_1, output_1, terminal_1, panelService_1, quickOpen_1, actions_1, keybinding_1, strings_1, filters_1, views_1, contextkey_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VIEW_PICKER_PREFIX = 'view ';
    class ViewEntry extends quickOpenModel_1.QuickOpenEntryGroup {
        constructor(label, category, open) {
            super();
            this.label = label;
            this.category = category;
            this.open = open;
        }
        getLabel() {
            return this.label;
        }
        getCategory() {
            return this.category;
        }
        getAriaLabel() {
            return nls.localize('entryAriaLabel', "{0}, view picker", this.getLabel());
        }
        run(mode, context) {
            if (mode === 1 /* OPEN */) {
                return this.runOpen(context);
            }
            return super.run(mode, context);
        }
        runOpen(context) {
            setTimeout(() => {
                this.open();
            }, 0);
            return true;
        }
    }
    exports.ViewEntry = ViewEntry;
    let ViewPickerHandler = class ViewPickerHandler extends quickopen_1.QuickOpenHandler {
        constructor(viewletService, viewsService, outputService, terminalService, panelService, contextKeyService) {
            super();
            this.viewletService = viewletService;
            this.viewsService = viewsService;
            this.outputService = outputService;
            this.terminalService = terminalService;
            this.panelService = panelService;
            this.contextKeyService = contextKeyService;
        }
        getResults(searchValue, token) {
            searchValue = searchValue.trim();
            const normalizedSearchValueLowercase = strings_1.stripWildcards(searchValue).toLowerCase();
            const viewEntries = this.getViewEntries();
            const entries = viewEntries.filter(e => {
                if (!searchValue) {
                    return true;
                }
                const highlights = filters_1.matchesFuzzy(normalizedSearchValueLowercase, e.getLabel(), true);
                if (highlights) {
                    e.setHighlights(highlights);
                }
                if (!highlights && !strings_1.fuzzyContains(e.getCategory(), normalizedSearchValueLowercase)) {
                    return false;
                }
                return true;
            });
            const entryToCategory = {};
            entries.forEach(e => {
                if (!entryToCategory[e.getLabel()]) {
                    entryToCategory[e.getLabel()] = e.getCategory();
                }
            });
            let lastCategory;
            entries.forEach((e, index) => {
                if (lastCategory !== e.getCategory()) {
                    lastCategory = e.getCategory();
                    e.setShowBorder(index > 0);
                    e.setGroupLabel(lastCategory);
                    // When the entry category has a parent category, set group label as Parent / Child. For example, Views / Explorer.
                    if (entryToCategory[lastCategory]) {
                        e.setGroupLabel(`${entryToCategory[lastCategory]} / ${lastCategory}`);
                    }
                }
                else {
                    e.setShowBorder(false);
                    e.setGroupLabel(undefined);
                }
            });
            return Promise.resolve(new quickOpenModel_1.QuickOpenModel(entries));
        }
        getViewEntries() {
            const viewEntries = [];
            const getViewEntriesForViewlet = (viewlet, viewContainer) => {
                const views = platform_1.Registry.as(views_1.Extensions.ViewsRegistry).getViews(viewContainer);
                const result = [];
                if (views.length) {
                    for (const view of views) {
                        if (this.contextKeyService.contextMatchesRules(view.when)) {
                            result.push(new ViewEntry(view.name, viewlet.name, () => this.viewsService.openView(view.id, true)));
                        }
                    }
                }
                return result;
            };
            // Viewlets
            const viewlets = this.viewletService.getViewlets();
            viewlets.forEach((viewlet, index) => {
                if (this.hasToShowViewlet(viewlet)) {
                    viewEntries.push(new ViewEntry(viewlet.name, nls.localize('views', "Side Bar"), () => this.viewletService.openViewlet(viewlet.id, true)));
                }
            });
            // Panels
            const panels = this.panelService.getPanels();
            panels.forEach((panel, index) => viewEntries.push(new ViewEntry(panel.name, nls.localize('panels', "Panel"), () => this.panelService.openPanel(panel.id, true))));
            // Viewlet Views
            viewlets.forEach((viewlet, index) => {
                const viewContainer = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).get(viewlet.id);
                if (viewContainer) {
                    const viewEntriesForViewlet = getViewEntriesForViewlet(viewlet, viewContainer);
                    viewEntries.push(...viewEntriesForViewlet);
                }
            });
            // Terminals
            const terminalsCategory = nls.localize('terminals', "Terminal");
            this.terminalService.terminalTabs.forEach((tab, tabIndex) => {
                tab.terminalInstances.forEach((terminal, terminalIndex) => {
                    const index = `${tabIndex + 1}.${terminalIndex + 1}`;
                    const entry = new ViewEntry(nls.localize('terminalTitle', "{0}: {1}", index, terminal.title), terminalsCategory, () => {
                        this.terminalService.showPanel(true).then(() => {
                            this.terminalService.setActiveInstance(terminal);
                        });
                    });
                    viewEntries.push(entry);
                });
            });
            // Output Channels
            const channels = this.outputService.getChannelDescriptors();
            channels.forEach((channel, index) => {
                const outputCategory = nls.localize('channels', "Output");
                const entry = new ViewEntry(channel.log ? nls.localize('logChannel', "Log ({0})", channel.label) : channel.label, outputCategory, () => this.outputService.showChannel(channel.id));
                viewEntries.push(entry);
            });
            return viewEntries;
        }
        hasToShowViewlet(viewlet) {
            var _a;
            const viewContainer = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).get(viewlet.id);
            if ((_a = viewContainer) === null || _a === void 0 ? void 0 : _a.hideIfEmpty) {
                const viewsCollection = this.viewsService.getViewDescriptors(viewContainer);
                return !!viewsCollection && viewsCollection.activeViewDescriptors.length > 0;
            }
            return true;
        }
        getAutoFocus(searchValue, context) {
            return {
                autoFocusFirstEntry: !!searchValue || !!context.quickNavigateConfiguration
            };
        }
    };
    ViewPickerHandler.ID = 'workbench.picker.views';
    ViewPickerHandler = __decorate([
        __param(0, viewlet_1.IViewletService),
        __param(1, views_1.IViewsService),
        __param(2, output_1.IOutputService),
        __param(3, terminal_1.ITerminalService),
        __param(4, panelService_1.IPanelService),
        __param(5, contextkey_1.IContextKeyService)
    ], ViewPickerHandler);
    exports.ViewPickerHandler = ViewPickerHandler;
    let OpenViewPickerAction = class OpenViewPickerAction extends quickopen_1.QuickOpenAction {
        constructor(id, label, quickOpenService) {
            super(id, label, exports.VIEW_PICKER_PREFIX, quickOpenService);
        }
    };
    OpenViewPickerAction.ID = 'workbench.action.openView';
    OpenViewPickerAction.LABEL = nls.localize('openView', "Open View");
    OpenViewPickerAction = __decorate([
        __param(2, quickOpen_1.IQuickOpenService)
    ], OpenViewPickerAction);
    exports.OpenViewPickerAction = OpenViewPickerAction;
    let QuickOpenViewPickerAction = class QuickOpenViewPickerAction extends actions_1.Action {
        constructor(id, label, quickOpenService, keybindingService) {
            super(id, label);
            this.quickOpenService = quickOpenService;
            this.keybindingService = keybindingService;
        }
        run() {
            const keys = this.keybindingService.lookupKeybindings(this.id);
            this.quickOpenService.show(exports.VIEW_PICKER_PREFIX, { quickNavigateConfiguration: { keybindings: keys } });
            return Promise.resolve(true);
        }
    };
    QuickOpenViewPickerAction.ID = 'workbench.action.quickOpenView';
    QuickOpenViewPickerAction.LABEL = nls.localize('quickOpenView', "Quick Open View");
    QuickOpenViewPickerAction = __decorate([
        __param(2, quickOpen_1.IQuickOpenService),
        __param(3, keybinding_1.IKeybindingService)
    ], QuickOpenViewPickerAction);
    exports.QuickOpenViewPickerAction = QuickOpenViewPickerAction;
});
//# sourceMappingURL=viewPickerHandler.js.map