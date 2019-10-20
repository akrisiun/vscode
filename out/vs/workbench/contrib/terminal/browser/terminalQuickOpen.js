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
define(["require", "exports", "vs/nls", "vs/base/parts/quickopen/browser/quickOpenModel", "vs/workbench/browser/quickopen", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/browser/actions", "vs/base/common/strings", "vs/base/common/filters", "vs/platform/commands/common/commands"], function (require, exports, nls, quickOpenModel_1, quickopen_1, terminal_1, actions_1, strings_1, filters_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TerminalEntry extends quickOpenModel_1.QuickOpenEntry {
        constructor(instance, label, terminalService) {
            super();
            this.instance = instance;
            this.label = label;
            this.terminalService = terminalService;
        }
        getLabel() {
            return this.label;
        }
        getAriaLabel() {
            return nls.localize('termEntryAriaLabel', "{0}, terminal picker", this.getLabel());
        }
        run(mode, context) {
            if (mode === 1 /* OPEN */) {
                setTimeout(() => {
                    this.terminalService.setActiveInstance(this.instance);
                    this.terminalService.showPanel(true);
                }, 0);
                return true;
            }
            return super.run(mode, context);
        }
    }
    exports.TerminalEntry = TerminalEntry;
    class CreateTerminal extends quickOpenModel_1.QuickOpenEntry {
        constructor(label, commandService) {
            super();
            this.label = label;
            this.commandService = commandService;
        }
        getLabel() {
            return this.label;
        }
        getAriaLabel() {
            return nls.localize('termCreateEntryAriaLabel', "{0}, create new terminal", this.getLabel());
        }
        run(mode, context) {
            if (mode === 1 /* OPEN */) {
                setTimeout(() => this.commandService.executeCommand('workbench.action.terminal.new'), 0);
                return true;
            }
            return super.run(mode, context);
        }
    }
    exports.CreateTerminal = CreateTerminal;
    let TerminalPickerHandler = class TerminalPickerHandler extends quickopen_1.QuickOpenHandler {
        constructor(terminalService, commandService) {
            super();
            this.terminalService = terminalService;
            this.commandService = commandService;
        }
        getResults(searchValue, token) {
            searchValue = searchValue.trim();
            const normalizedSearchValueLowercase = strings_1.stripWildcards(searchValue).toLowerCase();
            const terminalEntries = this.getTerminals();
            terminalEntries.push(new CreateTerminal(nls.localize("workbench.action.terminal.newplus", "$(plus) Create New Integrated Terminal"), this.commandService));
            const entries = terminalEntries.filter(e => {
                if (!searchValue) {
                    return true;
                }
                const label = e.getLabel();
                if (!label) {
                    return false;
                }
                const highlights = filters_1.matchesFuzzy(normalizedSearchValueLowercase, label, true);
                if (!highlights) {
                    return false;
                }
                e.setHighlights(highlights);
                return true;
            });
            return Promise.resolve(new quickOpenModel_1.QuickOpenModel(entries, new actions_1.ContributableActionProvider()));
        }
        getTerminals() {
            return this.terminalService.terminalTabs.reduce((terminals, tab, tabIndex) => {
                const terminalsInTab = tab.terminalInstances.map((terminal, terminalIndex) => {
                    const label = `${tabIndex + 1}.${terminalIndex + 1}: ${terminal.title}`;
                    return new TerminalEntry(terminal, label, this.terminalService);
                });
                return [...terminals, ...terminalsInTab];
            }, []);
        }
        getAutoFocus(searchValue, context) {
            return {
                autoFocusFirstEntry: !!searchValue || !!context.quickNavigateConfiguration
            };
        }
        getEmptyLabel(searchString) {
            if (searchString.length > 0) {
                return nls.localize('noTerminalsMatching', "No terminals matching");
            }
            return nls.localize('noTerminalsFound', "No terminals open");
        }
    };
    TerminalPickerHandler.ID = 'workbench.picker.terminals';
    TerminalPickerHandler = __decorate([
        __param(0, terminal_1.ITerminalService),
        __param(1, commands_1.ICommandService)
    ], TerminalPickerHandler);
    exports.TerminalPickerHandler = TerminalPickerHandler;
});
//# sourceMappingURL=terminalQuickOpen.js.map