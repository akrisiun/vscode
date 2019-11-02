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
define(["require", "exports", "vs/nls", "vs/base/common/arrays", "vs/base/common/types", "vs/base/common/platform", "vs/base/common/actions", "vs/base/parts/quickopen/browser/quickOpenModel", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/browser/quickopen", "vs/base/common/filters", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry", "vs/platform/keybinding/common/keybinding", "vs/platform/quickOpen/common/quickOpen", "vs/editor/browser/editorExtensions", "vs/platform/storage/common/storage", "vs/base/common/map", "vs/platform/configuration/common/configuration", "vs/workbench/services/editor/common/editorService", "vs/base/common/errors", "vs/platform/notification/common/notification", "vs/workbench/services/extensions/common/extensions", "vs/base/common/lifecycle", "vs/base/common/async", "vs/base/browser/browser"], function (require, exports, nls_1, arrays_1, types_1, platform_1, actions_1, quickOpenModel_1, actions_2, contextkey_1, quickopen_1, filters_1, instantiation_1, telemetry_1, keybinding_1, quickOpen_1, editorExtensions_1, storage_1, map_1, configuration_1, editorService_1, errors_1, notification_1, extensions_1, lifecycle_1, async_1, browser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ALL_COMMANDS_PREFIX = '>';
    let CommandsHistory = class CommandsHistory extends lifecycle_1.Disposable {
        constructor(storageService, configurationService) {
            super();
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.configuredCommandsHistoryLength = 0;
            this.updateConfiguration();
            this.load();
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(e => this.updateConfiguration()));
        }
        updateConfiguration() {
            this.configuredCommandsHistoryLength = CommandsHistory.getConfiguredCommandHistoryLength(this.configurationService);
            if (CommandsHistory.cache && CommandsHistory.cache.limit !== this.configuredCommandsHistoryLength) {
                CommandsHistory.cache.limit = this.configuredCommandsHistoryLength;
                CommandsHistory.saveState(this.storageService);
            }
        }
        load() {
            const raw = this.storageService.get(CommandsHistory.PREF_KEY_CACHE, 0 /* GLOBAL */);
            let serializedCache;
            if (raw) {
                try {
                    serializedCache = JSON.parse(raw);
                }
                catch (error) {
                    // invalid data
                }
            }
            const cache = CommandsHistory.cache = new map_1.LRUCache(this.configuredCommandsHistoryLength, 1);
            if (serializedCache) {
                let entries;
                if (serializedCache.usesLRU) {
                    entries = serializedCache.entries;
                }
                else {
                    entries = serializedCache.entries.sort((a, b) => a.value - b.value);
                }
                entries.forEach(entry => cache.set(entry.key, entry.value));
            }
            CommandsHistory.counter = this.storageService.getNumber(CommandsHistory.PREF_KEY_COUNTER, 0 /* GLOBAL */, CommandsHistory.counter);
        }
        push(commandId) {
            if (!CommandsHistory.cache) {
                return;
            }
            CommandsHistory.cache.set(commandId, CommandsHistory.counter++); // set counter to command
            CommandsHistory.saveState(this.storageService);
        }
        peek(commandId) {
            var _a;
            return (_a = CommandsHistory.cache) === null || _a === void 0 ? void 0 : _a.peek(commandId);
        }
        static saveState(storageService) {
            if (!CommandsHistory.cache) {
                return;
            }
            const serializedCache = { usesLRU: true, entries: [] };
            CommandsHistory.cache.forEach((value, key) => serializedCache.entries.push({ key, value }));
            storageService.store(CommandsHistory.PREF_KEY_CACHE, JSON.stringify(serializedCache), 0 /* GLOBAL */);
            storageService.store(CommandsHistory.PREF_KEY_COUNTER, CommandsHistory.counter, 0 /* GLOBAL */);
        }
        static getConfiguredCommandHistoryLength(configurationService) {
            var _a, _b;
            const config = configurationService.getValue();
            const configuredCommandHistoryLength = (_b = (_a = config.workbench) === null || _a === void 0 ? void 0 : _a.commandPalette) === null || _b === void 0 ? void 0 : _b.history;
            if (typeof configuredCommandHistoryLength === 'number') {
                return configuredCommandHistoryLength;
            }
            return CommandsHistory.DEFAULT_COMMANDS_HISTORY_LENGTH;
        }
        static clearHistory(configurationService, storageService) {
            const commandHistoryLength = CommandsHistory.getConfiguredCommandHistoryLength(configurationService);
            CommandsHistory.cache = new map_1.LRUCache(commandHistoryLength);
            CommandsHistory.counter = 1;
            CommandsHistory.saveState(storageService);
        }
    };
    CommandsHistory.DEFAULT_COMMANDS_HISTORY_LENGTH = 50;
    CommandsHistory.PREF_KEY_CACHE = 'commandPalette.mru.cache';
    CommandsHistory.PREF_KEY_COUNTER = 'commandPalette.mru.counter';
    CommandsHistory.counter = 1;
    CommandsHistory = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, configuration_1.IConfigurationService)
    ], CommandsHistory);
    let lastCommandPaletteInput = undefined;
    let ShowAllCommandsAction = class ShowAllCommandsAction extends actions_1.Action {
        constructor(id, label, quickOpenService, configurationService) {
            super(id, label);
            this.quickOpenService = quickOpenService;
            this.configurationService = configurationService;
        }
        run() {
            var _a, _b;
            const config = this.configurationService.getValue();
            const restoreInput = ((_b = (_a = config.workbench) === null || _a === void 0 ? void 0 : _a.commandPalette) === null || _b === void 0 ? void 0 : _b.preserveInput) === true;
            // Show with last command palette input if any and configured
            let value = exports.ALL_COMMANDS_PREFIX;
            if (restoreInput && lastCommandPaletteInput) {
                value = `${value}${lastCommandPaletteInput}`;
            }
            this.quickOpenService.show(value, { inputSelection: lastCommandPaletteInput ? { start: 1 /* after prefix */, end: value.length } : undefined });
            return Promise.resolve(undefined);
        }
    };
    ShowAllCommandsAction.ID = 'workbench.action.showCommands';
    ShowAllCommandsAction.LABEL = nls_1.localize('showTriggerActions', "Show All Commands");
    ShowAllCommandsAction = __decorate([
        __param(2, quickOpen_1.IQuickOpenService),
        __param(3, configuration_1.IConfigurationService)
    ], ShowAllCommandsAction);
    exports.ShowAllCommandsAction = ShowAllCommandsAction;
    let ClearCommandHistoryAction = class ClearCommandHistoryAction extends actions_1.Action {
        constructor(id, label, configurationService, storageService) {
            super(id, label);
            this.configurationService = configurationService;
            this.storageService = storageService;
        }
        run() {
            const commandHistoryLength = CommandsHistory.getConfiguredCommandHistoryLength(this.configurationService);
            if (commandHistoryLength > 0) {
                CommandsHistory.clearHistory(this.configurationService, this.storageService);
            }
            return Promise.resolve(undefined);
        }
    };
    ClearCommandHistoryAction.ID = 'workbench.action.clearCommandHistory';
    ClearCommandHistoryAction.LABEL = nls_1.localize('clearCommandHistory', "Clear Command History");
    ClearCommandHistoryAction = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, storage_1.IStorageService)
    ], ClearCommandHistoryAction);
    exports.ClearCommandHistoryAction = ClearCommandHistoryAction;
    class CommandPaletteEditorAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: ShowAllCommandsAction.ID,
                label: nls_1.localize('showCommands.label', "Command Palette..."),
                alias: 'Command Palette',
                precondition: undefined,
                menuOpts: {
                    group: 'z_commands',
                    order: 1
                }
            });
        }
        run(accessor, editor) {
            const quickOpenService = accessor.get(quickOpen_1.IQuickOpenService);
            // Show with prefix
            quickOpenService.show(exports.ALL_COMMANDS_PREFIX);
            return Promise.resolve(undefined);
        }
    }
    let BaseCommandEntry = class BaseCommandEntry extends quickOpenModel_1.QuickOpenEntryGroup {
        constructor(commandId, keybinding, label, alias, highlights, onBeforeRun, notificationService, telemetryService) {
            super();
            this.commandId = commandId;
            this.keybinding = keybinding;
            this.label = label;
            this.onBeforeRun = onBeforeRun;
            this.notificationService = notificationService;
            this.telemetryService = telemetryService;
            this.labelLowercase = this.label.toLowerCase();
            this.keybindingAriaLabel = keybinding ? keybinding.getAriaLabel() || undefined : undefined;
            if (this.label !== alias) {
                this.alias = alias;
            }
            else {
                highlights.alias = null;
            }
            this.setHighlights(types_1.withNullAsUndefined(highlights.label), undefined, types_1.withNullAsUndefined(highlights.alias));
        }
        getCommandId() {
            return this.commandId;
        }
        getLabel() {
            return this.label;
        }
        getSortLabel() {
            return this.labelLowercase;
        }
        getDescription() {
            return this.description;
        }
        setDescription(description) {
            this.description = description;
        }
        getKeybinding() {
            return this.keybinding;
        }
        getDetail() {
            return this.alias;
        }
        getAriaLabel() {
            if (this.keybindingAriaLabel) {
                return nls_1.localize('entryAriaLabelWithKey', "{0}, {1}, commands", this.getLabel(), this.keybindingAriaLabel);
            }
            return nls_1.localize('entryAriaLabel', "{0}, commands", this.getLabel());
        }
        run(mode, context) {
            if (mode === 1 /* OPEN */) {
                this.runAction(this.getAction());
                return true;
            }
            return false;
        }
        runAction(action) {
            // Indicate onBeforeRun
            this.onBeforeRun(this.commandId);
            const commandRunner = (async () => {
                if (action && (!(action instanceof actions_1.Action) || action.enabled)) {
                    try {
                        this.telemetryService.publicLog2('workbenchActionExecuted', { id: action.id, from: 'quick open' });
                        const promise = action.run();
                        if (promise) {
                            try {
                                await promise;
                            }
                            finally {
                                if (action instanceof actions_1.Action) {
                                    action.dispose();
                                }
                            }
                        }
                    }
                    catch (error) {
                        this.onError(error);
                    }
                }
                else {
                    this.notificationService.info(nls_1.localize('actionNotEnabled', "Command '{0}' is not enabled in the current context.", this.getLabel()));
                }
            });
            // Use a timeout to give the quick open widget a chance to close itself first
            // Firefox: since the browser is quite picky for certain commands, we do not
            // use a timeout (https://github.com/microsoft/vscode/issues/83288)
            if (!browser_1.isFirefox) {
                setTimeout(() => commandRunner(), 50);
            }
            else {
                commandRunner();
            }
        }
        onError(error) {
            if (errors_1.isPromiseCanceledError(error)) {
                return;
            }
            this.notificationService.error(error || nls_1.localize('canNotRun', "Command '{0}' resulted in an error.", this.label));
        }
    };
    BaseCommandEntry = __decorate([
        __param(6, notification_1.INotificationService),
        __param(7, telemetry_1.ITelemetryService)
    ], BaseCommandEntry);
    let EditorActionCommandEntry = class EditorActionCommandEntry extends BaseCommandEntry {
        constructor(commandId, keybinding, label, meta, highlights, action, onBeforeRun, notificationService, telemetryService) {
            super(commandId, keybinding, label, meta, highlights, onBeforeRun, notificationService, telemetryService);
            this.action = action;
        }
        getAction() {
            return this.action;
        }
    };
    EditorActionCommandEntry = __decorate([
        __param(7, notification_1.INotificationService),
        __param(8, telemetry_1.ITelemetryService)
    ], EditorActionCommandEntry);
    let ActionCommandEntry = class ActionCommandEntry extends BaseCommandEntry {
        constructor(commandId, keybinding, label, alias, highlights, action, onBeforeRun, notificationService, telemetryService) {
            super(commandId, keybinding, label, alias, highlights, onBeforeRun, notificationService, telemetryService);
            this.action = action;
        }
        getAction() {
            return this.action;
        }
    };
    ActionCommandEntry = __decorate([
        __param(7, notification_1.INotificationService),
        __param(8, telemetry_1.ITelemetryService)
    ], ActionCommandEntry);
    const wordFilter = filters_1.or(filters_1.matchesPrefix, filters_1.matchesWords, filters_1.matchesContiguousSubString);
    let CommandsHandler = class CommandsHandler extends quickopen_1.QuickOpenHandler {
        constructor(editorService, instantiationService, keybindingService, menuService, configurationService, extensionService) {
            super();
            this.editorService = editorService;
            this.instantiationService = instantiationService;
            this.keybindingService = keybindingService;
            this.menuService = menuService;
            this.configurationService = configurationService;
            this.extensionService = extensionService;
            this.disposables = new lifecycle_1.DisposableStore();
            this.disposeOnClose = new lifecycle_1.DisposableStore();
            this.commandsHistory = this.disposables.add(this.instantiationService.createInstance(CommandsHistory));
            this.extensionService.whenInstalledExtensionsRegistered().then(() => this.waitedForExtensionsRegistered = true);
            this.configurationService.onDidChangeConfiguration(e => this.updateConfiguration());
            this.updateConfiguration();
        }
        updateConfiguration() {
            this.commandHistoryEnabled = CommandsHistory.getConfiguredCommandHistoryLength(this.configurationService) > 0;
        }
        async getResults(searchValue, token) {
            if (this.waitedForExtensionsRegistered) {
                return this.doGetResults(searchValue, token);
            }
            // If extensions are not yet registered, we wait for a little moment to give them
            // a chance to register so that the complete set of commands shows up as result
            // We do not want to delay functionality beyond that time though to keep the commands
            // functional.
            await Promise.race([async_1.timeout(800).then(), this.extensionService.whenInstalledExtensionsRegistered()]);
            this.waitedForExtensionsRegistered = true;
            return this.doGetResults(searchValue, token);
        }
        doGetResults(searchValue, token) {
            if (token.isCancellationRequested) {
                return Promise.resolve(new quickOpenModel_1.QuickOpenModel([]));
            }
            searchValue = searchValue.trim();
            // Remember as last command palette input
            lastCommandPaletteInput = searchValue;
            // Editor Actions
            const activeTextEditorWidget = this.editorService.activeTextEditorWidget;
            let editorActions = [];
            if (activeTextEditorWidget && types_1.isFunction(activeTextEditorWidget.getSupportedActions)) {
                editorActions = activeTextEditorWidget.getSupportedActions();
            }
            const editorEntries = this.editorActionsToEntries(editorActions, searchValue);
            // Other Actions
            const menu = this.editorService.invokeWithinEditorContext(accessor => this.menuService.createMenu(0 /* CommandPalette */, accessor.get(contextkey_1.IContextKeyService)));
            const menuActions = menu.getActions().reduce((r, [, actions]) => [...r, ...actions], []).filter(action => action instanceof actions_2.MenuItemAction);
            const commandEntries = this.menuItemActionsToEntries(menuActions, searchValue);
            menu.dispose();
            this.disposeOnClose.add(lifecycle_1.toDisposable(() => lifecycle_1.dispose(menuActions)));
            // Concat
            let entries = [...editorEntries, ...commandEntries];
            // Remove duplicates
            entries = arrays_1.distinct(entries, entry => `${entry.getLabel()}${entry.getGroupLabel()}${entry.getCommandId()}`);
            // Handle label clashes
            const commandLabels = new Set();
            entries.forEach(entry => {
                const commandLabel = `${entry.getLabel()}${entry.getGroupLabel()}`;
                if (commandLabels.has(commandLabel)) {
                    entry.setDescription(entry.getCommandId());
                }
                else {
                    commandLabels.add(commandLabel);
                }
            });
            // Sort by MRU order and fallback to name otherwie
            entries = entries.sort((elementA, elementB) => {
                const counterA = this.commandsHistory.peek(elementA.getCommandId());
                const counterB = this.commandsHistory.peek(elementB.getCommandId());
                if (counterA && counterB) {
                    return counterA > counterB ? -1 : 1; // use more recently used command before older
                }
                if (counterA) {
                    return -1; // first command was used, so it wins over the non used one
                }
                if (counterB) {
                    return 1; // other command was used so it wins over the command
                }
                // both commands were never used, so we sort by name
                return elementA.getSortLabel().localeCompare(elementB.getSortLabel());
            });
            // Introduce group marker border between recently used and others
            // only if we have recently used commands in the result set
            const firstEntry = entries[0];
            if (firstEntry && this.commandsHistory.peek(firstEntry.getCommandId())) {
                firstEntry.setGroupLabel(nls_1.localize('recentlyUsed', "recently used"));
                for (let i = 1; i < entries.length; i++) {
                    const entry = entries[i];
                    if (!this.commandsHistory.peek(entry.getCommandId())) {
                        entry.setShowBorder(true);
                        entry.setGroupLabel(nls_1.localize('morecCommands', "other commands"));
                        break;
                    }
                }
            }
            return Promise.resolve(new quickOpenModel_1.QuickOpenModel(entries));
        }
        editorActionsToEntries(actions, searchValue) {
            const entries = [];
            for (const action of actions) {
                if (action.id === ShowAllCommandsAction.ID) {
                    continue; // avoid duplicates
                }
                const label = action.label;
                if (label) {
                    // Alias for non default languages
                    const alias = !platform_1.Language.isDefaultVariant() ? action.alias : undefined;
                    const labelHighlights = wordFilter(searchValue, label);
                    const aliasHighlights = alias ? wordFilter(searchValue, alias) : null;
                    if (labelHighlights || aliasHighlights) {
                        entries.push(this.instantiationService.createInstance(EditorActionCommandEntry, action.id, this.keybindingService.lookupKeybinding(action.id), label, alias, { label: labelHighlights, alias: aliasHighlights }, action, (id) => this.onBeforeRunCommand(id)));
                    }
                }
            }
            return entries;
        }
        onBeforeRunCommand(commandId) {
            // Remember in commands history
            this.commandsHistory.push(commandId);
        }
        menuItemActionsToEntries(actions, searchValue) {
            const entries = [];
            for (let action of actions) {
                const title = typeof action.item.title === 'string' ? action.item.title : action.item.title.value;
                let category, label = title;
                if (action.item.category) {
                    category = typeof action.item.category === 'string' ? action.item.category : action.item.category.value;
                    label = nls_1.localize('cat.title', "{0}: {1}", category, title);
                }
                if (label) {
                    const labelHighlights = wordFilter(searchValue, label);
                    // Add an 'alias' in original language when running in different locale
                    const aliasTitle = (!platform_1.Language.isDefaultVariant() && typeof action.item.title !== 'string') ? action.item.title.original : undefined;
                    const aliasCategory = (!platform_1.Language.isDefaultVariant() && category && action.item.category && typeof action.item.category !== 'string') ? action.item.category.original : undefined;
                    let alias;
                    if (aliasTitle && category) {
                        alias = aliasCategory ? `${aliasCategory}: ${aliasTitle}` : `${category}: ${aliasTitle}`;
                    }
                    else if (aliasTitle) {
                        alias = aliasTitle;
                    }
                    const aliasHighlights = alias ? wordFilter(searchValue, alias) : null;
                    if (labelHighlights || aliasHighlights) {
                        entries.push(this.instantiationService.createInstance(ActionCommandEntry, action.id, this.keybindingService.lookupKeybinding(action.item.id), label, alias, { label: labelHighlights, alias: aliasHighlights }, action, (id) => this.onBeforeRunCommand(id)));
                    }
                }
            }
            return entries;
        }
        getAutoFocus(searchValue, context) {
            let autoFocusPrefixMatch = searchValue.trim();
            if (autoFocusPrefixMatch && this.commandHistoryEnabled) {
                const firstEntry = context.model && context.model.entries[0];
                if (firstEntry instanceof BaseCommandEntry && this.commandsHistory.peek(firstEntry.getCommandId())) {
                    autoFocusPrefixMatch = undefined; // keep focus on MRU element if we have history elements
                }
            }
            return {
                autoFocusFirstEntry: true,
                autoFocusPrefixMatch
            };
        }
        getEmptyLabel(searchString) {
            return nls_1.localize('noCommandsMatching', "No commands matching");
        }
        onClose(canceled) {
            super.onClose(canceled);
            this.disposeOnClose.clear();
        }
        dispose() {
            this.disposables.dispose();
            this.disposeOnClose.dispose();
        }
    };
    CommandsHandler.ID = 'workbench.picker.commands';
    CommandsHandler = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, actions_2.IMenuService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, extensions_1.IExtensionService)
    ], CommandsHandler);
    exports.CommandsHandler = CommandsHandler;
    editorExtensions_1.registerEditorAction(CommandPaletteEditorAction);
});
//# sourceMappingURL=commandsHandler.js.map