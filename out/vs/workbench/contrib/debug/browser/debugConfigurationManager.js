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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/strings", "vs/base/common/objects", "vs/base/common/uri", "vs/base/common/resources", "vs/platform/lifecycle/common/lifecycle", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/workspace/common/workspace", "vs/platform/instantiation/common/instantiation", "vs/platform/commands/common/commands", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugger", "vs/workbench/services/editor/common/editorService", "vs/editor/browser/editorBrowser", "vs/workbench/services/configuration/common/configuration", "vs/workbench/services/preferences/common/preferences", "vs/platform/registry/common/platform", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/workbench/contrib/debug/common/debugSchemas", "vs/platform/quickinput/common/quickInput", "vs/platform/contextkey/common/contextkey", "vs/base/common/errors", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/cancellation", "vs/base/common/types"], function (require, exports, nls, lifecycle_1, event_1, strings, objects, uri_1, resources, lifecycle_2, storage_1, extensions_1, configuration_1, files_1, workspace_1, instantiation_1, commands_1, debug_1, debugger_1, editorService_1, editorBrowser_1, configuration_2, preferences_1, platform_1, jsonContributionRegistry_1, debugSchemas_1, quickInput_1, contextkey_1, errors_1, textfiles_1, cancellation_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    jsonRegistry.registerSchema(configuration_2.launchSchemaId, debugSchemas_1.launchSchema);
    const DEBUG_SELECTED_CONFIG_NAME_KEY = 'debug.selectedconfigname';
    const DEBUG_SELECTED_ROOT = 'debug.selectedroot';
    let ConfigurationManager = class ConfigurationManager {
        constructor(debugService, contextService, editorService, configurationService, quickInputService, instantiationService, commandService, storageService, lifecycleService, extensionService, contextKeyService) {
            this.debugService = debugService;
            this.contextService = contextService;
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.quickInputService = quickInputService;
            this.instantiationService = instantiationService;
            this.commandService = commandService;
            this.storageService = storageService;
            this.extensionService = extensionService;
            this.breakpointModeIdsSet = new Set();
            this._onDidSelectConfigurationName = new event_1.Emitter();
            this.debugAdapterFactories = new Map();
            this.configProviders = [];
            this.adapterDescriptorFactories = [];
            this.debuggers = [];
            this.toDispose = [];
            this.initLaunches();
            this.registerListeners(lifecycleService);
            const previousSelectedRoot = this.storageService.get(DEBUG_SELECTED_ROOT, 1 /* WORKSPACE */);
            const previousSelectedLaunch = this.launches.filter(l => l.uri.toString() === previousSelectedRoot).pop();
            this.debugConfigurationTypeContext = debug_1.CONTEXT_DEBUG_CONFIGURATION_TYPE.bindTo(contextKeyService);
            if (previousSelectedLaunch) {
                this.selectConfiguration(previousSelectedLaunch, this.storageService.get(DEBUG_SELECTED_CONFIG_NAME_KEY, 1 /* WORKSPACE */));
            }
        }
        // debuggers
        registerDebugAdapterFactory(debugTypes, debugAdapterLauncher) {
            debugTypes.forEach(debugType => this.debugAdapterFactories.set(debugType, debugAdapterLauncher));
            return {
                dispose: () => {
                    debugTypes.forEach(debugType => this.debugAdapterFactories.delete(debugType));
                }
            };
        }
        createDebugAdapter(session) {
            let dap = this.debugAdapterFactories.get(session.configuration.type);
            if (dap) {
                return dap.createDebugAdapter(session);
            }
            return undefined;
        }
        substituteVariables(debugType, folder, config) {
            let dap = this.debugAdapterFactories.get(debugType);
            if (dap) {
                return dap.substituteVariables(folder, config);
            }
            return Promise.resolve(config);
        }
        runInTerminal(debugType, args) {
            let tl = this.debugAdapterFactories.get(debugType);
            if (tl) {
                return tl.runInTerminal(args);
            }
            return Promise.resolve(void 0);
        }
        // debug adapter
        registerDebugAdapterDescriptorFactory(debugAdapterProvider) {
            this.adapterDescriptorFactories.push(debugAdapterProvider);
            return {
                dispose: () => {
                    this.unregisterDebugAdapterDescriptorFactory(debugAdapterProvider);
                }
            };
        }
        unregisterDebugAdapterDescriptorFactory(debugAdapterProvider) {
            const ix = this.adapterDescriptorFactories.indexOf(debugAdapterProvider);
            if (ix >= 0) {
                this.adapterDescriptorFactories.splice(ix, 1);
            }
        }
        getDebugAdapterDescriptor(session) {
            const config = session.configuration;
            // first try legacy proposed API: DebugConfigurationProvider.debugAdapterExecutable
            const providers0 = this.configProviders.filter(p => p.type === config.type && p.debugAdapterExecutable);
            if (providers0.length === 1 && providers0[0].debugAdapterExecutable) {
                return providers0[0].debugAdapterExecutable(session.root ? session.root.uri : undefined);
            }
            else {
                // TODO@AW handle n > 1 case
            }
            // new API
            const providers = this.adapterDescriptorFactories.filter(p => p.type === config.type && p.createDebugAdapterDescriptor);
            if (providers.length === 1) {
                return providers[0].createDebugAdapterDescriptor(session);
            }
            else {
                // TODO@AW handle n > 1 case
            }
            return Promise.resolve(undefined);
        }
        // debug configurations
        registerDebugConfigurationProvider(debugConfigurationProvider) {
            this.configProviders.push(debugConfigurationProvider);
            return {
                dispose: () => {
                    this.unregisterDebugConfigurationProvider(debugConfigurationProvider);
                }
            };
        }
        unregisterDebugConfigurationProvider(debugConfigurationProvider) {
            const ix = this.configProviders.indexOf(debugConfigurationProvider);
            if (ix >= 0) {
                this.configProviders.splice(ix, 1);
            }
        }
        hasDebugConfigurationProvider(debugType) {
            // check if there are providers for the given type that contribute a provideDebugConfigurations method
            const providers = this.configProviders.filter(p => p.provideDebugConfigurations && (p.type === debugType));
            return providers.length > 0;
        }
        resolveConfigurationByProviders(folderUri, type, debugConfiguration, token) {
            return this.activateDebuggers('onDebugResolve', type).then(() => {
                // pipe the config through the promises sequentially. Append at the end the '*' types
                const providers = this.configProviders.filter(p => p.type === type && p.resolveDebugConfiguration)
                    .concat(this.configProviders.filter(p => p.type === '*' && p.resolveDebugConfiguration));
                return providers.reduce((promise, provider) => {
                    return promise.then(config => {
                        if (config) {
                            return provider.resolveDebugConfiguration(folderUri, config, token);
                        }
                        else {
                            return Promise.resolve(config);
                        }
                    });
                }, Promise.resolve(debugConfiguration));
            });
        }
        provideDebugConfigurations(folderUri, type, token) {
            return this.activateDebuggers('onDebugInitialConfigurations')
                .then(() => Promise.all(this.configProviders.filter(p => p.type === type && p.provideDebugConfigurations).map(p => p.provideDebugConfigurations(folderUri, token)))
                .then(results => results.reduce((first, second) => first.concat(second), [])));
        }
        registerListeners(lifecycleService) {
            debugSchemas_1.debuggersExtPoint.setHandler((extensions, delta) => {
                delta.added.forEach(added => {
                    added.value.forEach(rawAdapter => {
                        if (!rawAdapter.type || (typeof rawAdapter.type !== 'string')) {
                            added.collector.error(nls.localize('debugNoType', "Debugger 'type' can not be omitted and must be of type 'string'."));
                        }
                        if (rawAdapter.enableBreakpointsFor) {
                            rawAdapter.enableBreakpointsFor.languageIds.forEach(modeId => {
                                this.breakpointModeIdsSet.add(modeId);
                            });
                        }
                        if (rawAdapter.type !== '*') {
                            const existing = this.getDebugger(rawAdapter.type);
                            if (existing) {
                                existing.merge(rawAdapter, added.description);
                            }
                            else {
                                this.debuggers.push(this.instantiationService.createInstance(debugger_1.Debugger, this, rawAdapter, added.description));
                            }
                        }
                    });
                });
                // take care of all wildcard contributions
                extensions.forEach(extension => {
                    extension.value.forEach(rawAdapter => {
                        if (rawAdapter.type === '*') {
                            this.debuggers.forEach(dbg => dbg.merge(rawAdapter, extension.description));
                        }
                    });
                });
                delta.removed.forEach(removed => {
                    const removedTypes = removed.value.map(rawAdapter => rawAdapter.type);
                    this.debuggers = this.debuggers.filter(d => removedTypes.indexOf(d.type) === -1);
                    this.debugService.getModel().getSessions().forEach(s => {
                        // Stop sessions if their debugger has been removed
                        if (removedTypes.indexOf(s.configuration.type) >= 0) {
                            this.debugService.stopSession(s).then(undefined, errors_1.onUnexpectedError);
                        }
                    });
                });
                // update the schema to include all attributes, snippets and types from extensions.
                this.debuggers.forEach(adapter => {
                    const items = debugSchemas_1.launchSchema.properties['configurations'].items;
                    const schemaAttributes = adapter.getSchemaAttributes();
                    if (schemaAttributes && items.oneOf) {
                        items.oneOf.push(...schemaAttributes);
                    }
                    const configurationSnippets = adapter.configurationSnippets;
                    if (configurationSnippets && items.defaultSnippets) {
                        items.defaultSnippets.push(...configurationSnippets);
                    }
                });
                this.setCompoundSchemaValues();
            });
            debugSchemas_1.breakpointsExtPoint.setHandler((extensions, delta) => {
                delta.removed.forEach(removed => {
                    removed.value.forEach(breakpoints => this.breakpointModeIdsSet.delete(breakpoints.language));
                });
                delta.added.forEach(added => {
                    added.value.forEach(breakpoints => this.breakpointModeIdsSet.add(breakpoints.language));
                });
            });
            this.toDispose.push(this.contextService.onDidChangeWorkspaceFolders(() => {
                this.initLaunches();
                this.selectConfiguration(this.selectedLaunch);
                this.setCompoundSchemaValues();
            }));
            this.toDispose.push(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('launch')) {
                    this.selectConfiguration(this.selectedLaunch);
                    this.setCompoundSchemaValues();
                }
            }));
        }
        initLaunches() {
            this.launches = this.contextService.getWorkspace().folders.map(folder => this.instantiationService.createInstance(Launch, this, folder));
            if (this.contextService.getWorkbenchState() === 3 /* WORKSPACE */) {
                this.launches.push(this.instantiationService.createInstance(WorkspaceLaunch));
            }
            this.launches.push(this.instantiationService.createInstance(UserLaunch));
            if (this.selectedLaunch && this.launches.indexOf(this.selectedLaunch) === -1) {
                this.setSelectedLaunch(undefined);
            }
        }
        setCompoundSchemaValues() {
            const compoundConfigurationsSchema = debugSchemas_1.launchSchema.properties['compounds'].items.properties['configurations'];
            const launchNames = this.launches.map(l => l.getConfigurationNames(false)).reduce((first, second) => first.concat(second), []);
            compoundConfigurationsSchema.items.oneOf[0].enum = launchNames;
            compoundConfigurationsSchema.items.oneOf[1].properties.name.enum = launchNames;
            const folderNames = this.contextService.getWorkspace().folders.map(f => f.name);
            compoundConfigurationsSchema.items.oneOf[1].properties.folder.enum = folderNames;
            jsonRegistry.registerSchema(configuration_2.launchSchemaId, debugSchemas_1.launchSchema);
        }
        getLaunches() {
            return this.launches;
        }
        getLaunch(workspaceUri) {
            if (!uri_1.URI.isUri(workspaceUri)) {
                return undefined;
            }
            return this.launches.filter(l => l.workspace && l.workspace.uri.toString() === workspaceUri.toString()).pop();
        }
        get selectedConfiguration() {
            return {
                launch: this.selectedLaunch,
                name: this.selectedName
            };
        }
        get onDidSelectConfiguration() {
            return this._onDidSelectConfigurationName.event;
        }
        getWorkspaceLaunch() {
            if (this.contextService.getWorkbenchState() === 3 /* WORKSPACE */) {
                return this.launches[this.launches.length - 1];
            }
            return undefined;
        }
        selectConfiguration(launch, name) {
            const previousLaunch = this.selectedLaunch;
            const previousName = this.selectedName;
            this.setSelectedLaunch(launch);
            const names = launch ? launch.getConfigurationNames() : [];
            if (name && names.indexOf(name) >= 0) {
                this.setSelectedLaunchName(name);
            }
            if (!this.selectedName || names.indexOf(this.selectedName) === -1) {
                this.setSelectedLaunchName(names.length ? names[0] : undefined);
            }
            const configuration = this.selectedLaunch && this.selectedName ? this.selectedLaunch.getConfiguration(this.selectedName) : undefined;
            if (configuration) {
                this.debugConfigurationTypeContext.set(configuration.type);
            }
            else {
                this.debugConfigurationTypeContext.reset();
            }
            if (this.selectedLaunch !== previousLaunch || this.selectedName !== previousName) {
                this._onDidSelectConfigurationName.fire();
            }
        }
        canSetBreakpointsIn(model) {
            const modeId = model.getLanguageIdentifier().language;
            if (!modeId || modeId === 'jsonc' || modeId === 'log') {
                // do not allow breakpoints in our settings files and output
                return false;
            }
            if (this.configurationService.getValue('debug').allowBreakpointsEverywhere) {
                return true;
            }
            return this.breakpointModeIdsSet.has(modeId);
        }
        getDebugger(type) {
            return this.debuggers.filter(dbg => strings.equalsIgnoreCase(dbg.type, type)).pop();
        }
        guessDebugger(type) {
            if (type) {
                const adapter = this.getDebugger(type);
                return Promise.resolve(adapter);
            }
            const activeTextEditorWidget = this.editorService.activeTextEditorWidget;
            let candidates;
            if (editorBrowser_1.isCodeEditor(activeTextEditorWidget)) {
                const model = activeTextEditorWidget.getModel();
                const language = model ? model.getLanguageIdentifier().language : undefined;
                const adapters = this.debuggers.filter(a => language && a.languages && a.languages.indexOf(language) >= 0);
                if (adapters.length === 1) {
                    return Promise.resolve(adapters[0]);
                }
                if (adapters.length > 1) {
                    candidates = Promise.resolve(adapters);
                }
            }
            if (!candidates) {
                candidates = this.activateDebuggers('onDebugInitialConfigurations').then(() => this.debuggers.filter(dbg => dbg.hasInitialConfiguration() || dbg.hasConfigurationProvider()));
            }
            return candidates.then(debuggers => {
                debuggers.sort((first, second) => first.label.localeCompare(second.label));
                const picks = debuggers.map(c => ({ label: c.label, debugger: c }));
                return this.quickInputService.pick([...picks, { type: 'separator' }, { label: 'More...', debugger: undefined }], { placeHolder: nls.localize('selectDebug', "Select Environment") })
                    .then(picked => {
                    if (picked && picked.debugger) {
                        return picked.debugger;
                    }
                    if (picked) {
                        this.commandService.executeCommand('debug.installAdditionalDebuggers');
                    }
                    return undefined;
                });
            });
        }
        activateDebuggers(activationEvent, debugType) {
            const thenables = [
                this.extensionService.activateByEvent(activationEvent),
                this.extensionService.activateByEvent('onDebug')
            ];
            if (debugType) {
                thenables.push(this.extensionService.activateByEvent(`${activationEvent}:${debugType}`));
            }
            return Promise.all(thenables).then(_ => {
                return undefined;
            });
        }
        setSelectedLaunchName(selectedName) {
            this.selectedName = selectedName;
            if (this.selectedName) {
                this.storageService.store(DEBUG_SELECTED_CONFIG_NAME_KEY, this.selectedName, 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(DEBUG_SELECTED_CONFIG_NAME_KEY, 1 /* WORKSPACE */);
            }
        }
        setSelectedLaunch(selectedLaunch) {
            this.selectedLaunch = selectedLaunch;
            if (this.selectedLaunch) {
                this.storageService.store(DEBUG_SELECTED_ROOT, this.selectedLaunch.uri.toString(), 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(DEBUG_SELECTED_ROOT, 1 /* WORKSPACE */);
            }
        }
        dispose() {
            this.toDispose = lifecycle_1.dispose(this.toDispose);
        }
    };
    ConfigurationManager = __decorate([
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, editorService_1.IEditorService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, commands_1.ICommandService),
        __param(7, storage_1.IStorageService),
        __param(8, lifecycle_2.ILifecycleService),
        __param(9, extensions_1.IExtensionService),
        __param(10, contextkey_1.IContextKeyService)
    ], ConfigurationManager);
    exports.ConfigurationManager = ConfigurationManager;
    class AbstractLaunch {
        getCompound(name) {
            const config = this.getConfig();
            if (!config || !config.compounds) {
                return undefined;
            }
            return config.compounds.filter(compound => compound.name === name).pop();
        }
        getConfigurationNames(includeCompounds = true) {
            const config = this.getConfig();
            if (!config || !config.configurations || !Array.isArray(config.configurations)) {
                return [];
            }
            else {
                const names = config.configurations.filter(cfg => cfg && typeof cfg.name === 'string').map(cfg => cfg.name);
                if (includeCompounds && config.compounds) {
                    if (config.compounds) {
                        names.push(...config.compounds.filter(compound => typeof compound.name === 'string' && compound.configurations && compound.configurations.length)
                            .map(compound => compound.name));
                    }
                }
                return names;
            }
        }
        getConfiguration(name) {
            // We need to clone the configuration in order to be able to make changes to it #42198
            const config = objects.deepClone(this.getConfig());
            if (!config || !config.configurations) {
                return undefined;
            }
            return config.configurations.filter(config => config && config.name === name).shift();
        }
        get hidden() {
            return false;
        }
    }
    let Launch = class Launch extends AbstractLaunch {
        constructor(configurationManager, workspace, fileService, textFileService, editorService, configurationService) {
            super();
            this.configurationManager = configurationManager;
            this.workspace = workspace;
            this.fileService = fileService;
            this.textFileService = textFileService;
            this.editorService = editorService;
            this.configurationService = configurationService;
        }
        get uri() {
            return resources.joinPath(this.workspace.uri, '/.vscode/launch.json');
        }
        get name() {
            return this.workspace.name;
        }
        getConfig() {
            return this.configurationService.inspect('launch', { resource: this.workspace.uri }).workspaceFolder;
        }
        openConfigFile(sideBySide, preserveFocus, type, token) {
            const resource = this.uri;
            let created = false;
            return this.fileService.readFile(resource).then(content => content.value, err => {
                // launch.json not found: create one by collecting launch configs from debugConfigProviders
                return this.configurationManager.guessDebugger(type).then(adapter => {
                    if (adapter) {
                        return this.configurationManager.provideDebugConfigurations(this.workspace.uri, adapter.type, token || cancellation_1.CancellationToken.None).then(initialConfigs => {
                            return adapter.getInitialConfigurationContent(initialConfigs);
                        });
                    }
                    else {
                        return '';
                    }
                }).then(content => {
                    if (!content) {
                        return '';
                    }
                    created = true; // pin only if config file is created #8727
                    return this.textFileService.write(resource, content).then(() => content);
                });
            }).then(content => {
                if (!content) {
                    return { editor: null, created: false };
                }
                const contentValue = content.toString();
                const index = contentValue.indexOf(`"${this.configurationManager.selectedConfiguration.name}"`);
                let startLineNumber = 1;
                for (let i = 0; i < index; i++) {
                    if (contentValue.charAt(i) === '\n') {
                        startLineNumber++;
                    }
                }
                const selection = startLineNumber > 1 ? { startLineNumber, startColumn: 4 } : undefined;
                return Promise.resolve(this.editorService.openEditor({
                    resource,
                    options: {
                        selection,
                        preserveFocus,
                        pinned: created,
                        revealIfVisible: true
                    },
                }, sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP).then(editor => ({ editor: types_1.withUndefinedAsNull(editor), created })));
            }, (error) => {
                throw new Error(nls.localize('DebugConfig.failed', "Unable to create 'launch.json' file inside the '.vscode' folder ({0}).", error.message));
            });
        }
    };
    Launch = __decorate([
        __param(2, files_1.IFileService),
        __param(3, textfiles_1.ITextFileService),
        __param(4, editorService_1.IEditorService),
        __param(5, configuration_1.IConfigurationService)
    ], Launch);
    let WorkspaceLaunch = class WorkspaceLaunch extends AbstractLaunch {
        constructor(editorService, configurationService, contextService) {
            super();
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.contextService = contextService;
        }
        get workspace() {
            return undefined;
        }
        get uri() {
            return this.contextService.getWorkspace().configuration;
        }
        get name() {
            return nls.localize('workspace', "workspace");
        }
        getConfig() {
            return this.configurationService.inspect('launch').workspace;
        }
        openConfigFile(sideBySide, preserveFocus, type) {
            return this.editorService.openEditor({
                resource: this.contextService.getWorkspace().configuration,
                options: { preserveFocus }
            }, sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP).then(editor => ({ editor: types_1.withUndefinedAsNull(editor), created: false }));
        }
    };
    WorkspaceLaunch = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, workspace_1.IWorkspaceContextService)
    ], WorkspaceLaunch);
    let UserLaunch = class UserLaunch extends AbstractLaunch {
        constructor(configurationService, preferencesService) {
            super();
            this.configurationService = configurationService;
            this.preferencesService = preferencesService;
        }
        get workspace() {
            return undefined;
        }
        get uri() {
            return this.preferencesService.userSettingsResource;
        }
        get name() {
            return nls.localize('user settings', "user settings");
        }
        get hidden() {
            return true;
        }
        getConfig() {
            return this.configurationService.inspect('launch').user;
        }
        openConfigFile(sideBySide, preserveFocus, type) {
            return this.preferencesService.openGlobalSettings(false, { preserveFocus }).then(editor => ({ editor: types_1.withUndefinedAsNull(editor), created: false }));
        }
    };
    UserLaunch = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, preferences_1.IPreferencesService)
    ], UserLaunch);
});
//# sourceMappingURL=debugConfigurationManager.js.map