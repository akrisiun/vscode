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
define(["require", "exports", "vs/nls", "vs/base/common/severity", "vs/base/common/objects", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/types", "vs/base/common/strings", "vs/base/common/parsers", "vs/base/common/uuid", "vs/base/common/platform", "vs/base/common/map", "vs/platform/lifecycle/common/lifecycle", "vs/platform/markers/common/markers", "vs/platform/telemetry/common/telemetry", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/workbench/services/extensions/common/extensions", "vs/platform/commands/common/commands", "vs/workbench/contrib/tasks/common/problemMatcher", "vs/platform/storage/common/storage", "vs/platform/progress/common/progress", "vs/platform/opener/common/opener", "vs/workbench/services/host/browser/host", "vs/platform/notification/common/notification", "vs/platform/dialogs/common/dialogs", "vs/editor/common/services/modelService", "vs/workbench/services/panel/common/panelService", "vs/workbench/contrib/markers/browser/constants", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/platform/workspace/common/workspace", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/contrib/output/common/output", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/tasks/common/taskSystem", "vs/workbench/contrib/tasks/common/tasks", "vs/workbench/contrib/tasks/common/taskTemplates", "../common/taskConfiguration", "./terminalTaskSystem", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/tasks/common/taskDefinitionRegistry", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/tasks/browser/runAutomaticTasks", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/jsonFormatter", "vs/editor/common/services/resolverService", "vs/base/common/jsonEdit", "vs/workbench/services/preferences/common/preferences", "vs/base/common/arrays", "vs/base/common/cancellation"], function (require, exports, nls, severity_1, Objects, resources, uri_1, actions_1, lifecycle_1, event_1, Types, strings, parsers_1, UUID, Platform, map_1, lifecycle_2, markers_1, telemetry_1, configuration_1, files_1, extensions_1, commands_1, problemMatcher_1, storage_1, progress_1, opener_1, host_1, notification_1, dialogs_1, modelService_1, panelService_1, constants_1, layoutService_1, editorService_1, configurationResolver_1, workspace_1, textfiles_1, output_1, terminal_1, taskSystem_1, tasks_1, taskTemplates_1, TaskConfig, terminalTaskSystem_1, quickInput_1, taskDefinitionRegistry_1, contextkey_1, runAutomaticTasks_1, environmentService_1, remoteAgentService_1, jsonFormatter_1, resolverService_1, jsonEdit_1, preferences_1, arrays_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ConfigureTaskAction;
    (function (ConfigureTaskAction) {
        ConfigureTaskAction.ID = 'workbench.action.tasks.configureTaskRunner';
        ConfigureTaskAction.TEXT = nls.localize('ConfigureTaskRunnerAction.label', "Configure Task");
    })(ConfigureTaskAction = exports.ConfigureTaskAction || (exports.ConfigureTaskAction = {}));
    class ProblemReporter {
        constructor(_outputChannel) {
            this._outputChannel = _outputChannel;
            this._validationStatus = new parsers_1.ValidationStatus();
        }
        info(message) {
            this._validationStatus.state = 1 /* Info */;
            this._outputChannel.append(message + '\n');
        }
        warn(message) {
            this._validationStatus.state = 2 /* Warning */;
            this._outputChannel.append(message + '\n');
        }
        error(message) {
            this._validationStatus.state = 3 /* Error */;
            this._outputChannel.append(message + '\n');
        }
        fatal(message) {
            this._validationStatus.state = 4 /* Fatal */;
            this._outputChannel.append(message + '\n');
        }
        get status() {
            return this._validationStatus;
        }
    }
    function isWorkspaceFolder(folder) {
        return 'uri' in folder;
    }
    class TaskMap {
        constructor() {
            this._store = new Map();
        }
        forEach(callback) {
            this._store.forEach(callback);
        }
        getKey(workspaceFolder) {
            let key;
            if (Types.isString(workspaceFolder)) {
                key = workspaceFolder;
            }
            else {
                const uri = isWorkspaceFolder(workspaceFolder) ? workspaceFolder.uri : workspaceFolder.configuration;
                key = uri ? uri.toString() : '';
            }
            return key;
        }
        get(workspaceFolder) {
            const key = this.getKey(workspaceFolder);
            let result = this._store.get(key);
            if (!result) {
                result = [];
                this._store.set(key, result);
            }
            return result;
        }
        add(workspaceFolder, ...task) {
            const key = this.getKey(workspaceFolder);
            let values = this._store.get(key);
            if (!values) {
                values = [];
                this._store.set(key, values);
            }
            values.push(...task);
        }
        all() {
            let result = [];
            this._store.forEach((values) => result.push(...values));
            return result;
        }
    }
    let AbstractTaskService = class AbstractTaskService extends lifecycle_1.Disposable {
        constructor(configurationService, markerService, outputService, panelService, editorService, fileService, contextService, telemetryService, textFileService, lifecycleService, modelService, extensionService, quickInputService, configurationResolverService, terminalService, storageService, progressService, openerService, _hostService, dialogService, notificationService, contextKeyService, environmentService, layoutService, terminalInstanceService, remoteAgentService, textModelResolverService, preferencesService) {
            super();
            this.configurationService = configurationService;
            this.markerService = markerService;
            this.outputService = outputService;
            this.panelService = panelService;
            this.editorService = editorService;
            this.fileService = fileService;
            this.contextService = contextService;
            this.telemetryService = telemetryService;
            this.textFileService = textFileService;
            this.modelService = modelService;
            this.extensionService = extensionService;
            this.quickInputService = quickInputService;
            this.configurationResolverService = configurationResolverService;
            this.terminalService = terminalService;
            this.storageService = storageService;
            this.progressService = progressService;
            this.openerService = openerService;
            this._hostService = _hostService;
            this.dialogService = dialogService;
            this.notificationService = notificationService;
            this.environmentService = environmentService;
            this.layoutService = layoutService;
            this.terminalInstanceService = terminalInstanceService;
            this.remoteAgentService = remoteAgentService;
            this.textModelResolverService = textModelResolverService;
            this.preferencesService = preferencesService;
            this._areJsonTasksSupportedPromise = Promise.resolve(false);
            this._workspaceTasksPromise = undefined;
            this._taskSystem = undefined;
            this._taskSystemListener = undefined;
            this._outputChannel = this.outputService.getChannel(AbstractTaskService.OutputChannelId);
            this._providers = new Map();
            this._providerTypes = new Map();
            this._taskSystemInfos = new Map();
            this._register(this.contextService.onDidChangeWorkspaceFolders(() => {
                if (!this._taskSystem && !this._workspaceTasksPromise) {
                    return;
                }
                let folderSetup = this.computeWorkspaceFolderSetup();
                if (this.executionEngine !== folderSetup[2]) {
                    if (this._taskSystem && this._taskSystem.getActiveTasks().length > 0) {
                        this.notificationService.prompt(severity_1.default.Info, nls.localize('TaskSystem.noHotSwap', 'Changing the task execution engine with an active task running requires to reload the Window'), [{
                                label: nls.localize('reloadWindow', "Reload Window"),
                                run: () => this._hostService.reload()
                            }], { sticky: true });
                        return;
                    }
                    else {
                        this.disposeTaskSystemListeners();
                        this._taskSystem = undefined;
                    }
                }
                this.updateSetup(folderSetup);
                this.updateWorkspaceTasks();
            }));
            this._register(event_1.Event.debounce(this.configurationService.onDidChangeConfiguration, () => {
                return;
            }, 1000)(() => {
                if (!this._taskSystem && !this._workspaceTasksPromise) {
                    return;
                }
                if (!this._taskSystem || this._taskSystem instanceof terminalTaskSystem_1.TerminalTaskSystem) {
                    this._outputChannel.clear();
                }
                this.updateWorkspaceTasks(3 /* ConfigurationChange */);
            }));
            this._taskRunningState = tasks_1.TASK_RUNNING_STATE.bindTo(contextKeyService);
            this._register(lifecycleService.onBeforeShutdown(event => event.veto(this.beforeShutdown())));
            this._onDidStateChange = this._register(new event_1.Emitter());
            this.registerCommands();
            this.configurationResolverService.contributeVariable('defaultBuildTask', async () => {
                let tasks = await this.getTasksForGroup(tasks_1.TaskGroup.Build);
                if (tasks.length > 0) {
                    let { defaults, users } = this.splitPerGroupType(tasks);
                    if (defaults.length === 1) {
                        return defaults[0]._label;
                    }
                    else if (defaults.length + users.length > 0) {
                        tasks = defaults.concat(users);
                    }
                }
                let entry;
                if (tasks && tasks.length > 0) {
                    entry = await this.showQuickPick(tasks, nls.localize('TaskService.pickBuildTaskForLabel', 'Select the build task (there is no default build task defined)'));
                }
                let task = entry ? entry.task : undefined;
                if (!task) {
                    return undefined;
                }
                return task._label;
            });
        }
        get onDidStateChange() {
            return this._onDidStateChange.event;
        }
        get supportsMultipleTaskExecutions() {
            return this.inTerminal();
        }
        registerCommands() {
            commands_1.CommandsRegistry.registerCommand({
                id: 'workbench.action.tasks.runTask',
                handler: (accessor, arg) => {
                    this.runTaskCommand(arg);
                },
                description: {
                    description: 'Run Task',
                    args: [{
                            name: 'args',
                            schema: {
                                'type': 'string',
                            }
                        }]
                }
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.reRunTask', (accessor, arg) => {
                this.reRunTaskCommand();
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.restartTask', (accessor, arg) => {
                this.runRestartTaskCommand(arg);
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.terminate', (accessor, arg) => {
                this.runTerminateCommand(arg);
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.showLog', () => {
                if (!this.canRunCommand()) {
                    return;
                }
                this.showOutput();
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.build', () => {
                if (!this.canRunCommand()) {
                    return;
                }
                this.runBuildCommand();
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.test', () => {
                if (!this.canRunCommand()) {
                    return;
                }
                this.runTestCommand();
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.configureTaskRunner', () => {
                this.runConfigureTasks();
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.configureDefaultBuildTask', () => {
                this.runConfigureDefaultBuildTask();
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.configureDefaultTestTask', () => {
                this.runConfigureDefaultTestTask();
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.showTasks', async () => {
                return this.runShowTasks();
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.toggleProblems', () => {
                const panel = this.panelService.getActivePanel();
                if (panel && panel.getId() === constants_1.default.MARKERS_PANEL_ID) {
                    this.layoutService.setPanelHidden(true);
                }
                else {
                    this.panelService.openPanel(constants_1.default.MARKERS_PANEL_ID, true);
                }
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.configureUserTask', async () => {
                const resource = this.getResourceForKind(tasks_1.TaskSourceKind.User);
                if (resource) {
                    this.openTaskFile(resource);
                }
            });
        }
        get workspaceFolders() {
            if (!this._workspaceFolders) {
                this.updateSetup();
            }
            return this._workspaceFolders;
        }
        get ignoredWorkspaceFolders() {
            if (!this._ignoredWorkspaceFolders) {
                this.updateSetup();
            }
            return this._ignoredWorkspaceFolders;
        }
        get executionEngine() {
            if (this._executionEngine === undefined) {
                this.updateSetup();
            }
            return this._executionEngine;
        }
        get schemaVersion() {
            if (this._schemaVersion === undefined) {
                this.updateSetup();
            }
            return this._schemaVersion;
        }
        get showIgnoreMessage() {
            if (this._showIgnoreMessage === undefined) {
                this._showIgnoreMessage = !this.storageService.getBoolean(AbstractTaskService.IgnoreTask010DonotShowAgain_key, 1 /* WORKSPACE */, false);
            }
            return this._showIgnoreMessage;
        }
        updateSetup(setup) {
            if (!setup) {
                setup = this.computeWorkspaceFolderSetup();
            }
            this._workspaceFolders = setup[0];
            if (this._ignoredWorkspaceFolders) {
                if (this._ignoredWorkspaceFolders.length !== setup[1].length) {
                    this._showIgnoreMessage = undefined;
                }
                else {
                    let set = new Set();
                    this._ignoredWorkspaceFolders.forEach(folder => set.add(folder.uri.toString()));
                    for (let folder of setup[1]) {
                        if (!set.has(folder.uri.toString())) {
                            this._showIgnoreMessage = undefined;
                            break;
                        }
                    }
                }
            }
            this._ignoredWorkspaceFolders = setup[1];
            this._executionEngine = setup[2];
            this._schemaVersion = setup[3];
            this._workspace = setup[4];
        }
        showOutput(runSource = 1 /* User */) {
            if ((runSource === 1 /* User */) || (runSource === 3 /* ConfigurationChange */)) {
                this.notificationService.prompt(severity_1.default.Warning, nls.localize('taskServiceOutputPrompt', 'There are task errors. See the output for details.'), [{
                        label: nls.localize('showOutput', "Show output"),
                        run: () => {
                            this.outputService.showChannel(this._outputChannel.id, true);
                        }
                    }]);
            }
        }
        disposeTaskSystemListeners() {
            if (this._taskSystemListener) {
                this._taskSystemListener.dispose();
            }
        }
        registerTaskProvider(provider, type) {
            if (!provider) {
                return {
                    dispose: () => { }
                };
            }
            let handle = AbstractTaskService.nextHandle++;
            this._providers.set(handle, provider);
            this._providerTypes.set(handle, type);
            return {
                dispose: () => {
                    this._providers.delete(handle);
                    this._providerTypes.delete(handle);
                }
            };
        }
        registerTaskSystem(key, info) {
            this._taskSystemInfos.set(key, info);
        }
        extensionCallbackTaskComplete(task, result) {
            if (!this._taskSystem) {
                return Promise.resolve();
            }
            return this._taskSystem.customExecutionComplete(task, result);
        }
        getTask(folder, identifier, compareId = false) {
            const name = Types.isString(folder) ? folder : isWorkspaceFolder(folder) ? folder.name : folder.configuration ? resources.basename(folder.configuration) : undefined;
            if (this.ignoredWorkspaceFolders.some(ignored => ignored.name === name)) {
                return Promise.reject(new Error(nls.localize('TaskServer.folderIgnored', 'The folder {0} is ignored since it uses task version 0.1.0', name)));
            }
            const key = !Types.isString(identifier)
                ? tasks_1.TaskDefinition.createTaskIdentifier(identifier, console)
                : identifier;
            if (key === undefined) {
                return Promise.resolve(undefined);
            }
            return this.getGroupedTasks().then((map) => {
                const values = map.get(folder);
                if (!values) {
                    return undefined;
                }
                return arrays_1.find(values, task => task.matches(key, compareId));
            });
        }
        tasks(filter) {
            if (!this.versionAndEngineCompatible(filter)) {
                return Promise.resolve([]);
            }
            return this.getGroupedTasks(filter ? filter.type : undefined).then((map) => {
                if (!filter || !filter.type) {
                    return map.all();
                }
                let result = [];
                map.forEach((tasks) => {
                    for (let task of tasks) {
                        if (tasks_1.ContributedTask.is(task) && task.defines.type === filter.type) {
                            result.push(task);
                        }
                        else if (tasks_1.CustomTask.is(task)) {
                            if (task.type === filter.type) {
                                result.push(task);
                            }
                            else {
                                let customizes = task.customizes();
                                if (customizes && customizes.type === filter.type) {
                                    result.push(task);
                                }
                            }
                        }
                    }
                });
                return result;
            });
        }
        createSorter() {
            return new tasks_1.TaskSorter(this.contextService.getWorkspace() ? this.contextService.getWorkspace().folders : []);
        }
        isActive() {
            if (!this._taskSystem) {
                return Promise.resolve(false);
            }
            return this._taskSystem.isActive();
        }
        getActiveTasks() {
            if (!this._taskSystem) {
                return Promise.resolve([]);
            }
            return Promise.resolve(this._taskSystem.getActiveTasks());
        }
        getBusyTasks() {
            if (!this._taskSystem) {
                return Promise.resolve([]);
            }
            return Promise.resolve(this._taskSystem.getBusyTasks());
        }
        getRecentlyUsedTasks() {
            if (this._recentlyUsedTasks) {
                return this._recentlyUsedTasks;
            }
            this._recentlyUsedTasks = new map_1.LinkedMap();
            let storageValue = this.storageService.get(AbstractTaskService.RecentlyUsedTasks_Key, 1 /* WORKSPACE */);
            if (storageValue) {
                try {
                    let values = JSON.parse(storageValue);
                    if (Array.isArray(values)) {
                        for (let value of values) {
                            this._recentlyUsedTasks.set(value, value);
                        }
                    }
                }
                catch (error) {
                    // Ignore. We use the empty result
                }
            }
            return this._recentlyUsedTasks;
        }
        setRecentlyUsedTask(key) {
            this.getRecentlyUsedTasks().set(key, key, 1 /* AsOld */);
            this.saveRecentlyUsedTasks();
        }
        saveRecentlyUsedTasks() {
            if (!this._taskSystem || !this._recentlyUsedTasks) {
                return;
            }
            let values = this._recentlyUsedTasks.values();
            if (values.length > 30) {
                values = values.slice(0, 30);
            }
            this.storageService.store(AbstractTaskService.RecentlyUsedTasks_Key, JSON.stringify(values), 1 /* WORKSPACE */);
        }
        openDocumentation() {
            this.openerService.open(uri_1.URI.parse('https://go.microsoft.com/fwlink/?LinkId=733558'));
        }
        build() {
            return this.getGroupedTasks().then((tasks) => {
                let runnable = this.createRunnableTask(tasks, tasks_1.TaskGroup.Build);
                if (!runnable || !runnable.task) {
                    if (this.schemaVersion === 1 /* V0_1_0 */) {
                        throw new taskSystem_1.TaskError(severity_1.default.Info, nls.localize('TaskService.noBuildTask1', 'No build task defined. Mark a task with \'isBuildCommand\' in the tasks.json file.'), 2 /* NoBuildTask */);
                    }
                    else {
                        throw new taskSystem_1.TaskError(severity_1.default.Info, nls.localize('TaskService.noBuildTask2', 'No build task defined. Mark a task with as a \'build\' group in the tasks.json file.'), 2 /* NoBuildTask */);
                    }
                }
                return this.executeTask(runnable.task, runnable.resolver);
            }).then(value => value, (error) => {
                this.handleError(error);
                return Promise.reject(error);
            });
        }
        runTest() {
            return this.getGroupedTasks().then((tasks) => {
                let runnable = this.createRunnableTask(tasks, tasks_1.TaskGroup.Test);
                if (!runnable || !runnable.task) {
                    if (this.schemaVersion === 1 /* V0_1_0 */) {
                        throw new taskSystem_1.TaskError(severity_1.default.Info, nls.localize('TaskService.noTestTask1', 'No test task defined. Mark a task with \'isTestCommand\' in the tasks.json file.'), 3 /* NoTestTask */);
                    }
                    else {
                        throw new taskSystem_1.TaskError(severity_1.default.Info, nls.localize('TaskService.noTestTask2', 'No test task defined. Mark a task with as a \'test\' group in the tasks.json file.'), 3 /* NoTestTask */);
                    }
                }
                return this.executeTask(runnable.task, runnable.resolver);
            }).then(value => value, (error) => {
                this.handleError(error);
                return Promise.reject(error);
            });
        }
        run(task, options, runSource = 0 /* System */) {
            if (!task) {
                throw new taskSystem_1.TaskError(severity_1.default.Info, nls.localize('TaskServer.noTask', 'Task to execute is undefined'), 5 /* TaskNotFound */);
            }
            return this.getGroupedTasks().then((grouped) => {
                let resolver = this.createResolver(grouped);
                if (options && options.attachProblemMatcher && this.shouldAttachProblemMatcher(task) && !tasks_1.InMemoryTask.is(task)) {
                    return this.attachProblemMatcher(task).then((toExecute) => {
                        if (toExecute) {
                            return this.executeTask(toExecute, resolver);
                        }
                        else {
                            return Promise.resolve(undefined);
                        }
                    });
                }
                return this.executeTask(task, resolver);
            }).then((value) => {
                if (runSource === 1 /* User */) {
                    this.getWorkspaceTasks().then(workspaceTasks => {
                        runAutomaticTasks_1.RunAutomaticTasks.promptForPermission(this, this.storageService, this.notificationService, workspaceTasks);
                    });
                }
                return value;
            }, (error) => {
                this.handleError(error);
                return Promise.reject(error);
            });
        }
        isProvideTasksEnabled() {
            const settingValue = this.configurationService.getValue('task.autoDetect');
            return settingValue === true;
        }
        shouldAttachProblemMatcher(task) {
            const settingValue = this.configurationService.getValue('task.problemMatchers.neverPrompt');
            if (settingValue === true) {
                return false;
            }
            else if (task.type && Types.isStringArray(settingValue) && (settingValue.indexOf(task.type) >= 0)) {
                return false;
            }
            if (!this.canCustomize(task)) {
                return false;
            }
            if (task.configurationProperties.group !== undefined && task.configurationProperties.group !== tasks_1.TaskGroup.Build) {
                return false;
            }
            if (task.configurationProperties.problemMatchers !== undefined && task.configurationProperties.problemMatchers.length > 0) {
                return false;
            }
            if (tasks_1.ContributedTask.is(task)) {
                return !task.hasDefinedMatchers && !!task.configurationProperties.problemMatchers && (task.configurationProperties.problemMatchers.length === 0);
            }
            if (tasks_1.CustomTask.is(task)) {
                let configProperties = task._source.config.element;
                return configProperties.problemMatcher === undefined && !task.hasDefinedMatchers;
            }
            return false;
        }
        attachProblemMatcher(task) {
            let entries = [];
            for (let key of problemMatcher_1.ProblemMatcherRegistry.keys()) {
                let matcher = problemMatcher_1.ProblemMatcherRegistry.get(key);
                if (matcher.deprecated) {
                    continue;
                }
                if (matcher.name === matcher.label) {
                    entries.push({ label: matcher.name, matcher: matcher });
                }
                else {
                    entries.push({
                        label: matcher.label,
                        description: `$${matcher.name}`,
                        matcher: matcher
                    });
                }
            }
            if (entries.length > 0) {
                entries = entries.sort((a, b) => {
                    if (a.label && b.label) {
                        return a.label.localeCompare(b.label);
                    }
                    else {
                        return 0;
                    }
                });
                entries.unshift({ type: 'separator', label: nls.localize('TaskService.associate', 'associate') });
                entries.unshift({ label: nls.localize('TaskService.attachProblemMatcher.continueWithout', 'Continue without scanning the task output'), matcher: undefined }, { label: nls.localize('TaskService.attachProblemMatcher.never', 'Never scan the task output'), matcher: undefined, never: true }, { label: nls.localize('TaskService.attachProblemMatcher.learnMoreAbout', 'Learn more about scanning the task output'), matcher: undefined, learnMore: true });
                return this.quickInputService.pick(entries, {
                    placeHolder: nls.localize('selectProblemMatcher', 'Select for which kind of errors and warnings to scan the task output'),
                }).then((selected) => {
                    if (selected) {
                        if (selected.learnMore) {
                            this.openDocumentation();
                            return undefined;
                        }
                        else if (selected.never) {
                            this.customize(task, { problemMatcher: [] }, true);
                            return task;
                        }
                        else if (selected.matcher) {
                            let newTask = task.clone();
                            let matcherReference = `$${selected.matcher.name}`;
                            let properties = { problemMatcher: [matcherReference] };
                            newTask.configurationProperties.problemMatchers = [matcherReference];
                            let matcher = problemMatcher_1.ProblemMatcherRegistry.get(selected.matcher.name);
                            if (matcher && matcher.watching !== undefined) {
                                properties.isBackground = true;
                                newTask.configurationProperties.isBackground = true;
                            }
                            this.customize(task, properties, true);
                            return newTask;
                        }
                        else {
                            return task;
                        }
                    }
                    else {
                        return undefined;
                    }
                });
            }
            return Promise.resolve(task);
        }
        getTasksForGroup(group) {
            return this.getGroupedTasks().then((groups) => {
                let result = [];
                groups.forEach((tasks) => {
                    for (let task of tasks) {
                        if (task.configurationProperties.group === group) {
                            result.push(task);
                        }
                    }
                });
                return result;
            });
        }
        needsFolderQualification() {
            return this.contextService.getWorkbenchState() === 3 /* WORKSPACE */;
        }
        canCustomize(task) {
            if (this.schemaVersion !== 2 /* V2_0_0 */) {
                return false;
            }
            if (tasks_1.CustomTask.is(task)) {
                return true;
            }
            if (tasks_1.ContributedTask.is(task)) {
                return !!task.getWorkspaceFolder();
            }
            return false;
        }
        openEditorAtTask(resource, task) {
            if (resource === undefined) {
                return Promise.resolve(undefined);
            }
            let selection;
            return this.fileService.readFile(resource).then(content => content.value).then(async (content) => {
                if (!content) {
                    return undefined;
                }
                if (task) {
                    const contentValue = content.toString();
                    let stringValue;
                    if (typeof task === 'string') {
                        stringValue = task;
                    }
                    else {
                        const model = (await this.textModelResolverService.createModelReference(resource)).object.textEditorModel;
                        const { tabSize, insertSpaces } = model.getOptions();
                        const eol = model.getEOL();
                        const edits = jsonFormatter_1.format(JSON.stringify(task), undefined, { eol, tabSize, insertSpaces });
                        let stringified = jsonEdit_1.applyEdits(JSON.stringify(task), edits);
                        const regex = new RegExp(eol + '\\t', 'g');
                        stringified = stringified.replace(regex, eol + '\t\t\t');
                        const twoTabs = '\t\t';
                        stringValue = twoTabs + stringified.slice(0, stringified.length - 1) + twoTabs + stringified.slice(stringified.length - 1);
                    }
                    const index = contentValue.indexOf(stringValue);
                    let startLineNumber = 1;
                    for (let i = 0; i < index; i++) {
                        if (contentValue.charAt(i) === '\n') {
                            startLineNumber++;
                        }
                    }
                    let endLineNumber = startLineNumber;
                    for (let i = 0; i < stringValue.length; i++) {
                        if (stringValue.charAt(i) === '\n') {
                            endLineNumber++;
                        }
                    }
                    selection = startLineNumber > 1 ? { startLineNumber, startColumn: startLineNumber === endLineNumber ? 4 : 3, endLineNumber, endColumn: startLineNumber === endLineNumber ? undefined : 4 } : undefined;
                }
                return this.editorService.openEditor({
                    resource,
                    options: {
                        pinned: false,
                        forceReload: true,
                        selection,
                        revealInCenterIfOutsideViewport: !!selection
                    }
                });
            });
        }
        customize(task, properties, openConfig) {
            const workspaceFolder = task.getWorkspaceFolder();
            if (!workspaceFolder) {
                return Promise.resolve(undefined);
            }
            let configuration = this.getConfiguration(workspaceFolder);
            if (configuration.hasParseErrors) {
                this.notificationService.warn(nls.localize('customizeParseErrors', 'The current task configuration has errors. Please fix the errors first before customizing a task.'));
                return Promise.resolve(undefined);
            }
            let fileConfig = configuration.config;
            let index;
            let toCustomize;
            let taskConfig = tasks_1.CustomTask.is(task) ? task._source.config : undefined;
            if (taskConfig && taskConfig.element) {
                index = taskConfig.index;
                toCustomize = taskConfig.element;
            }
            else if (tasks_1.ContributedTask.is(task)) {
                toCustomize = {};
                let identifier = Objects.assign(Object.create(null), task.defines);
                delete identifier['_key'];
                Object.keys(identifier).forEach(key => toCustomize[key] = identifier[key]);
                if (task.configurationProperties.problemMatchers && task.configurationProperties.problemMatchers.length > 0 && Types.isStringArray(task.configurationProperties.problemMatchers)) {
                    toCustomize.problemMatcher = task.configurationProperties.problemMatchers;
                }
                if (task.configurationProperties.group) {
                    toCustomize.group = task.configurationProperties.group;
                }
            }
            if (!toCustomize) {
                return Promise.resolve(undefined);
            }
            if (properties) {
                for (let property of Object.getOwnPropertyNames(properties)) {
                    let value = properties[property];
                    if (value !== undefined && value !== null) {
                        toCustomize[property] = value;
                    }
                }
            }
            else {
                if (toCustomize.problemMatcher === undefined && task.configurationProperties.problemMatchers === undefined || (task.configurationProperties.problemMatchers && task.configurationProperties.problemMatchers.length === 0)) {
                    toCustomize.problemMatcher = [];
                }
            }
            let promise;
            if (!fileConfig) {
                let value = {
                    version: '2.0.0',
                    tasks: [toCustomize]
                };
                let content = [
                    '{',
                    nls.localize('tasksJsonComment', '\t// See https://go.microsoft.com/fwlink/?LinkId=733558 \n\t// for the documentation about the tasks.json format'),
                ].join('\n') + JSON.stringify(value, null, '\t').substr(1);
                let editorConfig = this.configurationService.getValue();
                if (editorConfig.editor.insertSpaces) {
                    content = content.replace(/(\n)(\t+)/g, (_, s1, s2) => s1 + strings.repeat(' ', s2.length * editorConfig.editor.tabSize));
                }
                promise = this.textFileService.create(workspaceFolder.toResource('.vscode/tasks.json'), content).then(() => { });
            }
            else {
                // We have a global task configuration
                if ((index === -1) && properties) {
                    if (properties.problemMatcher !== undefined) {
                        fileConfig.problemMatcher = properties.problemMatcher;
                        promise = this.writeConfiguration(workspaceFolder, 'tasks.problemMatchers', fileConfig.problemMatcher);
                    }
                    else if (properties.group !== undefined) {
                        fileConfig.group = properties.group;
                        promise = this.writeConfiguration(workspaceFolder, 'tasks.group', fileConfig.group);
                    }
                }
                else {
                    if (!Array.isArray(fileConfig.tasks)) {
                        fileConfig.tasks = [];
                    }
                    if (index === undefined) {
                        fileConfig.tasks.push(toCustomize);
                    }
                    else {
                        fileConfig.tasks[index] = toCustomize;
                    }
                    promise = this.writeConfiguration(workspaceFolder, 'tasks.tasks', fileConfig.tasks);
                }
            }
            if (!promise) {
                return Promise.resolve(undefined);
            }
            return promise.then(() => {
                let event = {
                    properties: properties ? Object.getOwnPropertyNames(properties) : []
                };
                /* __GDPR__
                    "taskService.customize" : {
                        "properties" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                    }
                */
                this.telemetryService.publicLog(AbstractTaskService.CustomizationTelemetryEventName, event);
                if (openConfig) {
                    this.openEditorAtTask(workspaceFolder.toResource('.vscode/tasks.json'), toCustomize);
                }
            });
        }
        writeConfiguration(workspaceFolder, key, value) {
            if (this.contextService.getWorkbenchState() === 2 /* FOLDER */) {
                return this.configurationService.updateValue(key, value, { resource: workspaceFolder.uri }, 4 /* WORKSPACE */);
            }
            else if (this.contextService.getWorkbenchState() === 3 /* WORKSPACE */) {
                return this.configurationService.updateValue(key, value, { resource: workspaceFolder.uri }, 5 /* WORKSPACE_FOLDER */);
            }
            else {
                return undefined;
            }
        }
        getResourceForKind(kind) {
            switch (kind) {
                case tasks_1.TaskSourceKind.User: {
                    return resources.joinPath(resources.dirname(this.preferencesService.userSettingsResource), 'tasks.json');
                }
                case tasks_1.TaskSourceKind.WorkspaceFile: {
                    if (this._workspace && this._workspace.configuration) {
                        return this._workspace.configuration;
                    }
                }
                default: {
                    return undefined;
                }
            }
        }
        getResourceForTask(task) {
            let uri = this.getResourceForKind(task._source.kind);
            if (!uri) {
                const taskFolder = task.getWorkspaceFolder();
                if (taskFolder) {
                    uri = taskFolder.toResource(task._source.config.file);
                }
                else {
                    uri = this.workspaceFolders[0].uri;
                }
            }
            return uri;
        }
        openConfig(task) {
            let resource;
            if (task) {
                resource = this.getResourceForTask(task);
            }
            else {
                resource = (this._workspaceFolders && (this._workspaceFolders.length > 0)) ? this._workspaceFolders[0].toResource('.vscode/tasks.json') : undefined;
            }
            return this.openEditorAtTask(resource, task ? task._label : undefined).then(() => undefined);
        }
        createRunnableTask(tasks, group) {
            let resolverData = new Map();
            let workspaceTasks = [];
            let extensionTasks = [];
            tasks.forEach((tasks, folder) => {
                let data = resolverData.get(folder);
                if (!data) {
                    data = {
                        id: new Map(),
                        label: new Map(),
                        identifier: new Map()
                    };
                    resolverData.set(folder, data);
                }
                for (let task of tasks) {
                    data.id.set(task._id, task);
                    data.label.set(task._label, task);
                    if (task.configurationProperties.identifier) {
                        data.identifier.set(task.configurationProperties.identifier, task);
                    }
                    if (group && task.configurationProperties.group === group) {
                        if (task._source.kind === tasks_1.TaskSourceKind.Workspace) {
                            workspaceTasks.push(task);
                        }
                        else {
                            extensionTasks.push(task);
                        }
                    }
                }
            });
            let resolver = {
                resolve: (uri, alias) => {
                    let data = resolverData.get(uri.toString());
                    if (!data) {
                        return undefined;
                    }
                    return data.id.get(alias) || data.label.get(alias) || data.identifier.get(alias);
                }
            };
            if (workspaceTasks.length > 0) {
                if (workspaceTasks.length > 1) {
                    this._outputChannel.append(nls.localize('moreThanOneBuildTask', 'There are many build tasks defined in the tasks.json. Executing the first one.\n'));
                }
                return { task: workspaceTasks[0], resolver };
            }
            if (extensionTasks.length === 0) {
                return undefined;
            }
            // We can only have extension tasks if we are in version 2.0.0. Then we can even run
            // multiple build tasks.
            if (extensionTasks.length === 1) {
                return { task: extensionTasks[0], resolver };
            }
            else {
                let id = UUID.generateUuid();
                let task = new tasks_1.InMemoryTask(id, { kind: tasks_1.TaskSourceKind.InMemory, label: 'inMemory' }, id, 'inMemory', { reevaluateOnRerun: true }, {
                    identifier: id,
                    dependsOn: extensionTasks.map((extensionTask) => { return { uri: extensionTask.getWorkspaceFolder().uri, task: extensionTask._id }; }),
                    name: id,
                });
                return { task, resolver };
            }
        }
        createResolver(grouped) {
            let resolverData = new Map();
            grouped.forEach((tasks, folder) => {
                let data = resolverData.get(folder);
                if (!data) {
                    data = { label: new Map(), identifier: new Map(), taskIdentifier: new Map() };
                    resolverData.set(folder, data);
                }
                for (let task of tasks) {
                    data.label.set(task._label, task);
                    if (task.configurationProperties.identifier) {
                        data.identifier.set(task.configurationProperties.identifier, task);
                    }
                    let keyedIdentifier = task.getDefinition(true);
                    if (keyedIdentifier !== undefined) {
                        data.taskIdentifier.set(keyedIdentifier._key, task);
                    }
                }
            });
            return {
                resolve: (uri, identifier) => {
                    let data = uri ? resolverData.get(uri.toString()) : undefined;
                    if (!data || !identifier) {
                        return undefined;
                    }
                    if (Types.isString(identifier)) {
                        return data.label.get(identifier) || data.identifier.get(identifier);
                    }
                    else {
                        let key = tasks_1.TaskDefinition.createTaskIdentifier(identifier, console);
                        return key !== undefined ? data.taskIdentifier.get(key._key) : undefined;
                    }
                }
            };
        }
        executeTask(task, resolver) {
            return problemMatcher_1.ProblemMatcherRegistry.onReady().then(() => {
                return this.textFileService.saveAll().then((value) => {
                    let executeResult = this.getTaskSystem().run(task, resolver);
                    return this.handleExecuteResult(executeResult);
                });
            });
        }
        handleExecuteResult(executeResult) {
            if (executeResult.task.taskLoadMessages && executeResult.task.taskLoadMessages.length > 0) {
                executeResult.task.taskLoadMessages.forEach(loadMessage => {
                    this._outputChannel.append(loadMessage + '\n');
                });
                this.showOutput();
            }
            let key = executeResult.task.getRecentlyUsedKey();
            if (key) {
                this.setRecentlyUsedTask(key);
            }
            if (executeResult.kind === 2 /* Active */) {
                let active = executeResult.active;
                if (active && active.same) {
                    let message;
                    if (active.background) {
                        message = nls.localize('TaskSystem.activeSame.background', 'The task \'{0}\' is already active and in background mode.', executeResult.task.getQualifiedLabel());
                    }
                    else {
                        message = nls.localize('TaskSystem.activeSame.noBackground', 'The task \'{0}\' is already active.', executeResult.task.getQualifiedLabel());
                    }
                    this.notificationService.prompt(severity_1.default.Info, message, [{
                            label: nls.localize('terminateTask', "Terminate Task"),
                            run: () => this.terminate(executeResult.task)
                        },
                        {
                            label: nls.localize('restartTask', "Restart Task"),
                            run: () => this.restart(executeResult.task)
                        }], { sticky: true });
                }
                else {
                    throw new taskSystem_1.TaskError(severity_1.default.Warning, nls.localize('TaskSystem.active', 'There is already a task running. Terminate it first before executing another task.'), 1 /* RunningTask */);
                }
            }
            return executeResult.promise;
        }
        restart(task) {
            if (!this._taskSystem) {
                return;
            }
            this._taskSystem.terminate(task).then((response) => {
                if (response.success) {
                    this.run(task).then(undefined, reason => {
                        // eat the error, it has already been surfaced to the user and we don't care about it here
                    });
                }
                else {
                    this.notificationService.warn(nls.localize('TaskSystem.restartFailed', 'Failed to terminate and restart task {0}', Types.isString(task) ? task : task.configurationProperties.name));
                }
                return response;
            });
        }
        terminate(task) {
            if (!this._taskSystem) {
                return Promise.resolve({ success: true, task: undefined });
            }
            return this._taskSystem.terminate(task);
        }
        terminateAll() {
            if (!this._taskSystem) {
                return Promise.resolve([]);
            }
            return this._taskSystem.terminateAll();
        }
        createTerminalTaskSystem() {
            return new terminalTaskSystem_1.TerminalTaskSystem(this.terminalService, this.outputService, this.panelService, this.markerService, this.modelService, this.configurationResolverService, this.telemetryService, this.contextService, this.environmentService, AbstractTaskService.OutputChannelId, this.fileService, this.terminalInstanceService, this.remoteAgentService, (workspaceFolder) => {
                if (!workspaceFolder) {
                    return undefined;
                }
                return this._taskSystemInfos.get(workspaceFolder.uri.scheme);
            });
        }
        async provideTasksWithWarning(provider, type, validTypes) {
            return new Promise(async (resolve, reject) => {
                let isDone = false;
                provider.provideTasks(validTypes).then((value) => {
                    isDone = true;
                    resolve(value);
                }, (e) => {
                    isDone = true;
                    reject(e);
                });
                let settingValue = this.configurationService.getValue('task.slowProviderWarning');
                if ((settingValue === true) || (Types.isStringArray(settingValue) && (settingValue.indexOf(type) < 0))) {
                    setTimeout(() => {
                        if (!isDone) {
                            const settings = { label: nls.localize('TaskSystem.slowProvider.settings', "Settings"), run: () => this.preferencesService.openSettings(false, undefined) };
                            const disableAll = { label: nls.localize('TaskSystem.slowProvider.disableAll', "Disable All"), run: () => this.configurationService.updateValue('task.autoDetect', false) };
                            const dontShow = {
                                label: nls.localize('TaskSystem.slowProvider.dontShow', "Don't warn again for {0} tasks", type), run: () => {
                                    if (!Types.isStringArray(settingValue)) {
                                        settingValue = [];
                                    }
                                    settingValue.push(type);
                                    return this.configurationService.updateValue('task.slowProviderWarning', settingValue);
                                }
                            };
                            this.notificationService.prompt(severity_1.default.Warning, nls.localize('TaskSystem.slowProvider', "The {0} task provider is slow. The extension that provides {0} tasks may provide a setting to disable it, or you can disable all tasks providers", type), [settings, disableAll, dontShow]);
                        }
                    }, 1000);
                }
            });
        }
        getGroupedTasks(type) {
            return Promise.all([this.extensionService.activateByEvent('onCommand:workbench.action.tasks.runTask'), taskDefinitionRegistry_1.TaskDefinitionRegistry.onReady()]).then(() => {
                let validTypes = Object.create(null);
                taskDefinitionRegistry_1.TaskDefinitionRegistry.all().forEach(definition => validTypes[definition.taskType] = true);
                validTypes['shell'] = true;
                validTypes['process'] = true;
                return new Promise(resolve => {
                    let result = [];
                    let counter = 0;
                    let done = (value) => {
                        if (value) {
                            result.push(value);
                        }
                        if (--counter === 0) {
                            resolve(result);
                        }
                    };
                    let error = (error) => {
                        try {
                            if (error && Types.isString(error.message)) {
                                this._outputChannel.append('Error: ');
                                this._outputChannel.append(error.message);
                                this._outputChannel.append('\n');
                                this.showOutput();
                            }
                            else {
                                this._outputChannel.append('Unknown error received while collecting tasks from providers.\n');
                                this.showOutput();
                            }
                        }
                        finally {
                            if (--counter === 0) {
                                resolve(result);
                            }
                        }
                    };
                    if (this.isProvideTasksEnabled() && (this.schemaVersion === 2 /* V2_0_0 */) && (this._providers.size > 0)) {
                        for (const [handle, provider] of this._providers) {
                            if ((type === undefined) || (type === this._providerTypes.get(handle))) {
                                counter++;
                                this.provideTasksWithWarning(provider, this._providerTypes.get(handle), validTypes).then(done, error);
                            }
                        }
                    }
                    else {
                        resolve(result);
                    }
                });
            }).then((contributedTaskSets) => {
                let result = new TaskMap();
                let contributedTasks = new TaskMap();
                for (let set of contributedTaskSets) {
                    for (let task of set.tasks) {
                        let workspaceFolder = task.getWorkspaceFolder();
                        if (workspaceFolder) {
                            contributedTasks.add(workspaceFolder, task);
                        }
                    }
                }
                return this.getWorkspaceTasks().then(async (customTasks) => {
                    const customTasksKeyValuePairs = Array.from(customTasks);
                    const customTasksPromises = customTasksKeyValuePairs.map(async ([key, folderTasks]) => {
                        let contributed = contributedTasks.get(key);
                        if (!folderTasks.set) {
                            if (contributed) {
                                result.add(key, ...contributed);
                            }
                            return;
                        }
                        if (!contributed) {
                            result.add(key, ...folderTasks.set.tasks);
                        }
                        else {
                            let configurations = folderTasks.configurations;
                            let legacyTaskConfigurations = folderTasks.set ? this.getLegacyTaskConfigurations(folderTasks.set) : undefined;
                            let customTasksToDelete = [];
                            if (configurations || legacyTaskConfigurations) {
                                let unUsedConfigurations = new Set();
                                if (configurations) {
                                    Object.keys(configurations.byIdentifier).forEach(key => unUsedConfigurations.add(key));
                                }
                                for (let task of contributed) {
                                    if (!tasks_1.ContributedTask.is(task)) {
                                        continue;
                                    }
                                    if (configurations) {
                                        let configuringTask = configurations.byIdentifier[task.defines._key];
                                        if (configuringTask) {
                                            unUsedConfigurations.delete(task.defines._key);
                                            result.add(key, TaskConfig.createCustomTask(task, configuringTask));
                                        }
                                        else {
                                            result.add(key, task);
                                        }
                                    }
                                    else if (legacyTaskConfigurations) {
                                        let configuringTask = legacyTaskConfigurations[task.defines._key];
                                        if (configuringTask) {
                                            result.add(key, TaskConfig.createCustomTask(task, configuringTask));
                                            customTasksToDelete.push(configuringTask);
                                        }
                                        else {
                                            result.add(key, task);
                                        }
                                    }
                                    else {
                                        result.add(key, task);
                                    }
                                }
                                if (customTasksToDelete.length > 0) {
                                    let toDelete = customTasksToDelete.reduce((map, task) => {
                                        map[task._id] = true;
                                        return map;
                                    }, Object.create(null));
                                    for (let task of folderTasks.set.tasks) {
                                        if (toDelete[task._id]) {
                                            continue;
                                        }
                                        result.add(key, task);
                                    }
                                }
                                else {
                                    result.add(key, ...folderTasks.set.tasks);
                                }
                                const unUsedConfigurationsAsArray = Array.from(unUsedConfigurations);
                                const unUsedConfigurationPromises = unUsedConfigurationsAsArray.map(async (value) => {
                                    let configuringTask = configurations.byIdentifier[value];
                                    for (const [handle, provider] of this._providers) {
                                        if (configuringTask.type === this._providerTypes.get(handle)) {
                                            try {
                                                const resolvedTask = await provider.resolveTask(configuringTask);
                                                if (resolvedTask && (resolvedTask._id === configuringTask._id)) {
                                                    result.add(key, TaskConfig.createCustomTask(resolvedTask, configuringTask));
                                                    return;
                                                }
                                            }
                                            catch (error) {
                                                // Ignore errors. The task could not be provided by any of the providers.
                                            }
                                        }
                                    }
                                    this._outputChannel.append(nls.localize('TaskService.noConfiguration', 'Error: The {0} task detection didn\'t contribute a task for the following configuration:\n{1}\nThe task will be ignored.\n', configuringTask.configures.type, JSON.stringify(configuringTask._source.config.element, undefined, 4)));
                                    this.showOutput();
                                });
                                await Promise.all(unUsedConfigurationPromises);
                            }
                            else {
                                result.add(key, ...folderTasks.set.tasks);
                                result.add(key, ...contributed);
                            }
                        }
                    });
                    await Promise.all(customTasksPromises);
                    return result;
                }, () => {
                    // If we can't read the tasks.json file provide at least the contributed tasks
                    let result = new TaskMap();
                    for (let set of contributedTaskSets) {
                        for (let task of set.tasks) {
                            const folder = task.getWorkspaceFolder();
                            if (folder) {
                                result.add(folder, task);
                            }
                        }
                    }
                    return result;
                });
            });
        }
        getLegacyTaskConfigurations(workspaceTasks) {
            let result;
            function getResult() {
                if (result) {
                    return result;
                }
                result = Object.create(null);
                return result;
            }
            for (let task of workspaceTasks.tasks) {
                if (tasks_1.CustomTask.is(task)) {
                    let commandName = task.command && task.command.name;
                    // This is for backwards compatibility with the 0.1.0 task annotation code
                    // if we had a gulp, jake or grunt command a task specification was a annotation
                    if (commandName === 'gulp' || commandName === 'grunt' || commandName === 'jake') {
                        let identifier = tasks_1.KeyedTaskIdentifier.create({
                            type: commandName,
                            task: task.configurationProperties.name
                        });
                        getResult()[identifier._key] = task;
                    }
                }
            }
            return result;
        }
        getWorkspaceTasks(runSource = 1 /* User */) {
            if (this._workspaceTasksPromise) {
                return this._workspaceTasksPromise;
            }
            this.updateWorkspaceTasks(runSource);
            return this._workspaceTasksPromise;
        }
        computeWorkspaceTasks(runSource = 1 /* User */) {
            if (this.workspaceFolders.length === 0) {
                return Promise.resolve(new Map());
            }
            else {
                let promises = [];
                for (let folder of this.workspaceFolders) {
                    promises.push(this.computeWorkspaceFolderTasks(folder, runSource).then((value) => value, () => undefined));
                }
                return Promise.all(promises).then(async (values) => {
                    let result = new Map();
                    for (let value of values) {
                        if (value) {
                            result.set(value.workspaceFolder.uri.toString(), value);
                        }
                    }
                    const userTasks = await this.computeUserTasks(this.workspaceFolders[0], runSource).then((value) => value, () => undefined);
                    if (userTasks) {
                        result.set('settings', userTasks);
                    }
                    const workspaceFileTasks = await this.computeWorkspaceFileTasks(this.workspaceFolders[0], runSource).then((value) => value, () => undefined);
                    if (workspaceFileTasks && this._workspace && this._workspace.configuration) {
                        result.set(this._workspace.configuration.toString(), workspaceFileTasks);
                    }
                    return result;
                });
            }
        }
        setJsonTasksSupported(areSupported) {
            this._areJsonTasksSupportedPromise = areSupported;
        }
        computeWorkspaceFolderTasks(workspaceFolder, runSource = 1 /* User */) {
            return (this.executionEngine === tasks_1.ExecutionEngine.Process
                ? this.computeLegacyConfiguration(workspaceFolder)
                : this.computeConfiguration(workspaceFolder)).
                then((workspaceFolderConfiguration) => {
                if (!workspaceFolderConfiguration || !workspaceFolderConfiguration.config || workspaceFolderConfiguration.hasErrors) {
                    return Promise.resolve({ workspaceFolder, set: undefined, configurations: undefined, hasErrors: workspaceFolderConfiguration ? workspaceFolderConfiguration.hasErrors : false });
                }
                return problemMatcher_1.ProblemMatcherRegistry.onReady().then(async () => {
                    let taskSystemInfo = this._taskSystemInfos.get(workspaceFolder.uri.scheme);
                    let problemReporter = new ProblemReporter(this._outputChannel);
                    let parseResult = TaskConfig.parse(workspaceFolder, this._workspace, taskSystemInfo ? taskSystemInfo.platform : Platform.platform, workspaceFolderConfiguration.config, problemReporter, TaskConfig.TaskConfigSource.TasksJson);
                    let hasErrors = false;
                    if (!parseResult.validationStatus.isOK()) {
                        hasErrors = true;
                        this.showOutput(runSource);
                    }
                    if (problemReporter.status.isFatal()) {
                        problemReporter.fatal(nls.localize('TaskSystem.configurationErrors', 'Error: the provided task configuration has validation errors and can\'t not be used. Please correct the errors first.'));
                        return { workspaceFolder, set: undefined, configurations: undefined, hasErrors };
                    }
                    let customizedTasks;
                    if (parseResult.configured && parseResult.configured.length > 0) {
                        customizedTasks = {
                            byIdentifier: Object.create(null)
                        };
                        for (let task of parseResult.configured) {
                            customizedTasks.byIdentifier[task.configures._key] = task;
                        }
                    }
                    if (!(await this._areJsonTasksSupportedPromise) && (parseResult.custom.length > 0)) {
                        console.warn('Custom workspace tasks are not supported.');
                    }
                    return { workspaceFolder, set: { tasks: await this._areJsonTasksSupportedPromise ? parseResult.custom : [] }, configurations: customizedTasks, hasErrors };
                });
            });
        }
        testParseExternalConfig(config, location) {
            if (!config) {
                return { config: undefined, hasParseErrors: false };
            }
            let parseErrors = config.$parseErrors;
            if (parseErrors) {
                let isAffected = false;
                for (const parseError of parseErrors) {
                    if (/tasks\.json$/.test(parseError)) {
                        isAffected = true;
                        break;
                    }
                }
                if (isAffected) {
                    this._outputChannel.append(nls.localize('TaskSystem.invalidTaskJsonOther', 'Error: The content of the tasks json in {0} has syntax errors. Please correct them before executing a task.\n', location));
                    this.showOutput();
                    return { config, hasParseErrors: true };
                }
            }
            return { config, hasParseErrors: false };
        }
        async computeWorkspaceFileTasks(workspaceFolder, runSource = 1 /* User */) {
            if (this.executionEngine === tasks_1.ExecutionEngine.Process) {
                return this.emptyWorkspaceTaskResults(workspaceFolder);
            }
            const configuration = this.testParseExternalConfig(this.configurationService.inspect('tasks').workspace, nls.localize('TasksSystem.locationWorkspaceConfig', 'workspace file'));
            let customizedTasks = {
                byIdentifier: Object.create(null)
            };
            const custom = [];
            await this.computeTasksForSingleConfig(workspaceFolder, configuration.config, runSource, custom, customizedTasks.byIdentifier, TaskConfig.TaskConfigSource.WorkspaceFile);
            const engine = configuration.config ? TaskConfig.ExecutionEngine.from(configuration.config) : tasks_1.ExecutionEngine.Terminal;
            if (engine === tasks_1.ExecutionEngine.Process) {
                this.notificationService.warn(nls.localize('TaskSystem.versionWorkspaceFile', 'Only tasks version 2.0.0 permitted in .codeworkspace.'));
                return this.emptyWorkspaceTaskResults(workspaceFolder);
            }
            return { workspaceFolder, set: { tasks: custom }, configurations: customizedTasks, hasErrors: configuration.hasParseErrors };
        }
        async computeUserTasks(workspaceFolder, runSource = 1 /* User */) {
            if (this.executionEngine === tasks_1.ExecutionEngine.Process) {
                return this.emptyWorkspaceTaskResults(workspaceFolder);
            }
            const configuration = this.testParseExternalConfig(this.configurationService.inspect('tasks').user, nls.localize('TasksSystem.locationUserConfig', 'user settings'));
            let customizedTasks = {
                byIdentifier: Object.create(null)
            };
            const custom = [];
            await this.computeTasksForSingleConfig(workspaceFolder, configuration.config, runSource, custom, customizedTasks.byIdentifier, TaskConfig.TaskConfigSource.User);
            const engine = configuration.config ? TaskConfig.ExecutionEngine.from(configuration.config) : tasks_1.ExecutionEngine.Terminal;
            if (engine === tasks_1.ExecutionEngine.Process) {
                this.notificationService.warn(nls.localize('TaskSystem.versionSettings', 'Only tasks version 2.0.0 permitted in user settings.'));
                return this.emptyWorkspaceTaskResults(workspaceFolder);
            }
            return { workspaceFolder, set: { tasks: custom }, configurations: customizedTasks, hasErrors: configuration.hasParseErrors };
        }
        emptyWorkspaceTaskResults(workspaceFolder) {
            return { workspaceFolder, set: undefined, configurations: undefined, hasErrors: false };
        }
        async computeTasksForSingleConfig(workspaceFolder, config, runSource, custom, customized, source) {
            if (!config) {
                return false;
            }
            let taskSystemInfo = workspaceFolder ? this._taskSystemInfos.get(workspaceFolder.uri.scheme) : undefined;
            let problemReporter = new ProblemReporter(this._outputChannel);
            let parseResult = TaskConfig.parse(workspaceFolder, this._workspace, taskSystemInfo ? taskSystemInfo.platform : Platform.platform, config, problemReporter, source);
            let hasErrors = false;
            if (!parseResult.validationStatus.isOK()) {
                this.showOutput(runSource);
                hasErrors = true;
            }
            if (problemReporter.status.isFatal()) {
                problemReporter.fatal(nls.localize('TaskSystem.configurationErrors', 'Error: the provided task configuration has validation errors and can\'t not be used. Please correct the errors first.'));
                return hasErrors;
            }
            if (parseResult.configured && parseResult.configured.length > 0) {
                for (let task of parseResult.configured) {
                    customized[task.configures._key] = task;
                }
            }
            if (!(await this._areJsonTasksSupportedPromise) && (parseResult.custom.length > 0)) {
                console.warn('Custom workspace tasks are not supported.');
            }
            else {
                for (let task of parseResult.custom) {
                    custom.push(task);
                }
            }
            return hasErrors;
        }
        computeConfiguration(workspaceFolder) {
            let { config, hasParseErrors } = this.getConfiguration(workspaceFolder);
            return Promise.resolve({ workspaceFolder, config, hasErrors: hasParseErrors });
        }
        computeWorkspaceFolderSetup() {
            let workspaceFolders = [];
            let ignoredWorkspaceFolders = [];
            let executionEngine = tasks_1.ExecutionEngine.Terminal;
            let schemaVersion = 2 /* V2_0_0 */;
            let workspace;
            if (this.contextService.getWorkbenchState() === 2 /* FOLDER */) {
                let workspaceFolder = this.contextService.getWorkspace().folders[0];
                workspaceFolders.push(workspaceFolder);
                executionEngine = this.computeExecutionEngine(workspaceFolder);
                schemaVersion = this.computeJsonSchemaVersion(workspaceFolder);
            }
            else if (this.contextService.getWorkbenchState() === 3 /* WORKSPACE */) {
                workspace = this.contextService.getWorkspace();
                for (let workspaceFolder of this.contextService.getWorkspace().folders) {
                    if (schemaVersion === this.computeJsonSchemaVersion(workspaceFolder)) {
                        workspaceFolders.push(workspaceFolder);
                    }
                    else {
                        ignoredWorkspaceFolders.push(workspaceFolder);
                        this._outputChannel.append(nls.localize('taskService.ignoreingFolder', 'Ignoring task configurations for workspace folder {0}. Multi folder workspace task support requires that all folders use task version 2.0.0\n', workspaceFolder.uri.fsPath));
                    }
                }
            }
            return [workspaceFolders, ignoredWorkspaceFolders, executionEngine, schemaVersion, workspace];
        }
        computeExecutionEngine(workspaceFolder) {
            let { config } = this.getConfiguration(workspaceFolder);
            if (!config) {
                return tasks_1.ExecutionEngine._default;
            }
            return TaskConfig.ExecutionEngine.from(config);
        }
        computeJsonSchemaVersion(workspaceFolder) {
            let { config } = this.getConfiguration(workspaceFolder);
            if (!config) {
                return 2 /* V2_0_0 */;
            }
            return TaskConfig.JsonSchemaVersion.from(config);
        }
        getConfiguration(workspaceFolder) {
            let result = this.contextService.getWorkbenchState() !== 1 /* EMPTY */
                ? Objects.deepClone(this.configurationService.inspect('tasks', { resource: workspaceFolder.uri }).workspaceFolder)
                : undefined;
            if (!result) {
                return { config: undefined, hasParseErrors: false };
            }
            let parseErrors = result.$parseErrors;
            if (parseErrors) {
                let isAffected = false;
                for (const parseError of parseErrors) {
                    if (/tasks\.json$/.test(parseError)) {
                        isAffected = true;
                        break;
                    }
                }
                if (isAffected) {
                    this._outputChannel.append(nls.localize('TaskSystem.invalidTaskJson', 'Error: The content of the tasks.json file has syntax errors. Please correct them before executing a task.\n'));
                    this.showOutput();
                    return { config: undefined, hasParseErrors: true };
                }
            }
            return { config: result, hasParseErrors: false };
        }
        inTerminal() {
            if (this._taskSystem) {
                return this._taskSystem instanceof terminalTaskSystem_1.TerminalTaskSystem;
            }
            return this.executionEngine === tasks_1.ExecutionEngine.Terminal;
        }
        configureAction() {
            const thisCapture = this;
            return new class extends actions_1.Action {
                constructor() {
                    super(ConfigureTaskAction.ID, ConfigureTaskAction.TEXT, undefined, true, () => { thisCapture.runConfigureTasks(); return Promise.resolve(undefined); });
                }
            };
        }
        beforeShutdown() {
            if (!this._taskSystem) {
                return false;
            }
            if (!this._taskSystem.isActiveSync()) {
                return false;
            }
            // The terminal service kills all terminal on shutdown. So there
            // is nothing we can do to prevent this here.
            if (this._taskSystem instanceof terminalTaskSystem_1.TerminalTaskSystem) {
                return false;
            }
            let terminatePromise;
            if (this._taskSystem.canAutoTerminate()) {
                terminatePromise = Promise.resolve({ confirmed: true });
            }
            else {
                terminatePromise = this.dialogService.confirm({
                    message: nls.localize('TaskSystem.runningTask', 'There is a task running. Do you want to terminate it?'),
                    primaryButton: nls.localize({ key: 'TaskSystem.terminateTask', comment: ['&& denotes a mnemonic'] }, "&&Terminate Task"),
                    type: 'question'
                });
            }
            return terminatePromise.then(res => {
                if (res.confirmed) {
                    return this._taskSystem.terminateAll().then((responses) => {
                        let success = true;
                        let code = undefined;
                        for (let response of responses) {
                            success = success && response.success;
                            // We only have a code in the old output runner which only has one task
                            // So we can use the first code.
                            if (code === undefined && response.code !== undefined) {
                                code = response.code;
                            }
                        }
                        if (success) {
                            this._taskSystem = undefined;
                            this.disposeTaskSystemListeners();
                            return false; // no veto
                        }
                        else if (code && code === 3 /* ProcessNotFound */) {
                            return this.dialogService.confirm({
                                message: nls.localize('TaskSystem.noProcess', 'The launched task doesn\'t exist anymore. If the task spawned background processes exiting VS Code might result in orphaned processes. To avoid this start the last background process with a wait flag.'),
                                primaryButton: nls.localize({ key: 'TaskSystem.exitAnyways', comment: ['&& denotes a mnemonic'] }, "&&Exit Anyways"),
                                type: 'info'
                            }).then(res => !res.confirmed);
                        }
                        return true; // veto
                    }, (err) => {
                        return true; // veto
                    });
                }
                return true; // veto
            });
        }
        handleError(err) {
            let showOutput = true;
            if (err instanceof taskSystem_1.TaskError) {
                let buildError = err;
                let needsConfig = buildError.code === 0 /* NotConfigured */ || buildError.code === 2 /* NoBuildTask */ || buildError.code === 3 /* NoTestTask */;
                let needsTerminate = buildError.code === 1 /* RunningTask */;
                if (needsConfig || needsTerminate) {
                    this.notificationService.prompt(buildError.severity, buildError.message, [{
                            label: needsConfig ? ConfigureTaskAction.TEXT : nls.localize('TerminateAction.label', "Terminate Task"),
                            run: () => {
                                if (needsConfig) {
                                    this.runConfigureTasks();
                                }
                                else {
                                    this.runTerminateCommand();
                                }
                            }
                        }]);
                }
                else {
                    this.notificationService.notify({ severity: buildError.severity, message: buildError.message });
                }
            }
            else if (err instanceof Error) {
                let error = err;
                this.notificationService.error(error.message);
                showOutput = false;
            }
            else if (Types.isString(err)) {
                this.notificationService.error(err);
            }
            else {
                this.notificationService.error(nls.localize('TaskSystem.unknownError', 'An error has occurred while running a task. See task log for details.'));
            }
            if (showOutput) {
                this.showOutput();
            }
        }
        canRunCommand() {
            if (this.contextService.getWorkbenchState() === 1 /* EMPTY */) {
                this.notificationService.prompt(severity_1.default.Info, nls.localize('TaskService.noWorkspace', "Tasks are only available on a workspace folder."), [{
                        label: nls.localize('TaskService.learnMore', "Learn More"),
                        run: () => this.openerService.open(uri_1.URI.parse('https://code.visualstudio.com/docs/editor/tasks'))
                    }]);
                return false;
            }
            return true;
        }
        createTaskQuickPickEntries(tasks, group = false, sort = false, selectedEntry) {
            if (tasks === undefined || tasks === null || tasks.length === 0) {
                return [];
            }
            const TaskQuickPickEntry = (task) => {
                let description;
                if (task._source.kind === tasks_1.TaskSourceKind.User) {
                    description = nls.localize('taskQuickPick.userSettings', 'User Settings');
                }
                else if (task._source.kind === tasks_1.TaskSourceKind.WorkspaceFile) {
                    description = task.getWorkspaceFileName();
                }
                else if (this.needsFolderQualification()) {
                    let workspaceFolder = task.getWorkspaceFolder();
                    if (workspaceFolder) {
                        description = workspaceFolder.name;
                    }
                }
                return { label: task._label, description, task };
            };
            function fillEntries(entries, tasks, groupLabel) {
                if (tasks.length) {
                    entries.push({ type: 'separator', label: groupLabel });
                }
                for (let task of tasks) {
                    let entry = TaskQuickPickEntry(task);
                    entry.buttons = [{ iconClass: 'quick-open-task-configure', tooltip: nls.localize('configureTask', "Configure Task") }];
                    if (selectedEntry && (task === selectedEntry.task)) {
                        entries.unshift(selectedEntry);
                    }
                    else {
                        entries.push(entry);
                    }
                }
            }
            let entries;
            if (group) {
                entries = [];
                if (tasks.length === 1) {
                    entries.push(TaskQuickPickEntry(tasks[0]));
                }
                else {
                    let recentlyUsedTasks = this.getRecentlyUsedTasks();
                    let recent = [];
                    let configured = [];
                    let detected = [];
                    let taskMap = Object.create(null);
                    tasks.forEach(task => {
                        let key = task.getRecentlyUsedKey();
                        if (key) {
                            taskMap[key] = task;
                        }
                    });
                    recentlyUsedTasks.keys().forEach(key => {
                        let task = taskMap[key];
                        if (task) {
                            recent.push(task);
                        }
                    });
                    for (let task of tasks) {
                        let key = task.getRecentlyUsedKey();
                        if (!key || !recentlyUsedTasks.has(key)) {
                            if (task._source.kind === tasks_1.TaskSourceKind.Workspace) {
                                configured.push(task);
                            }
                            else {
                                detected.push(task);
                            }
                        }
                    }
                    const sorter = this.createSorter();
                    fillEntries(entries, recent, nls.localize('recentlyUsed', 'recently used tasks'));
                    configured = configured.sort((a, b) => sorter.compare(a, b));
                    fillEntries(entries, configured, nls.localize('configured', 'configured tasks'));
                    detected = detected.sort((a, b) => sorter.compare(a, b));
                    fillEntries(entries, detected, nls.localize('detected', 'detected tasks'));
                }
            }
            else {
                if (sort) {
                    const sorter = this.createSorter();
                    tasks = tasks.sort((a, b) => sorter.compare(a, b));
                }
                entries = tasks.map(task => TaskQuickPickEntry(task));
            }
            return entries;
        }
        showQuickPick(tasks, placeHolder, defaultEntry, group = false, sort = false, selectedEntry, additionalEntries) {
            let _createEntries = () => {
                if (Array.isArray(tasks)) {
                    return Promise.resolve(this.createTaskQuickPickEntries(tasks, group, sort, selectedEntry));
                }
                else {
                    return tasks.then((tasks) => this.createTaskQuickPickEntries(tasks, group, sort, selectedEntry));
                }
            };
            return this.quickInputService.pick(_createEntries().then((entries) => {
                if ((entries.length === 0) && defaultEntry) {
                    entries.push(defaultEntry);
                }
                else if (entries.length > 1 && additionalEntries && additionalEntries.length > 0) {
                    entries.push({ type: 'separator', label: '' });
                    entries.push(additionalEntries[0]);
                }
                return entries;
            }), {
                placeHolder,
                matchOnDescription: true,
                onDidTriggerItemButton: context => {
                    let task = context.item.task;
                    this.quickInputService.cancel();
                    if (tasks_1.ContributedTask.is(task)) {
                        this.customize(task, undefined, true);
                    }
                    else if (tasks_1.CustomTask.is(task)) {
                        this.openConfig(task);
                    }
                }
            });
        }
        showIgnoredFoldersMessage() {
            if (this.ignoredWorkspaceFolders.length === 0 || !this.showIgnoreMessage) {
                return Promise.resolve(undefined);
            }
            this.notificationService.prompt(severity_1.default.Info, nls.localize('TaskService.ignoredFolder', 'The following workspace folders are ignored since they use task version 0.1.0: {0}', this.ignoredWorkspaceFolders.map(f => f.name).join(', ')), [{
                    label: nls.localize('TaskService.notAgain', "Don't Show Again"),
                    isSecondary: true,
                    run: () => {
                        this.storageService.store(AbstractTaskService.IgnoreTask010DonotShowAgain_key, true, 1 /* WORKSPACE */);
                        this._showIgnoreMessage = false;
                    }
                }]);
            return Promise.resolve(undefined);
        }
        runTaskCommand(arg) {
            if (!this.canRunCommand()) {
                return;
            }
            let identifier = this.getTaskIdentifier(arg);
            if (identifier !== undefined) {
                this.getGroupedTasks().then((grouped) => {
                    let resolver = this.createResolver(grouped);
                    let folders = this.contextService.getWorkspace().folders;
                    for (let folder of folders) {
                        let task = resolver.resolve(folder.uri, identifier);
                        if (task) {
                            this.run(task).then(undefined, reason => {
                                // eat the error, it has already been surfaced to the user and we don't care about it here
                            });
                            return;
                        }
                    }
                    this.doRunTaskCommand(grouped.all());
                }, () => {
                    this.doRunTaskCommand();
                });
            }
            else {
                this.doRunTaskCommand();
            }
        }
        doRunTaskCommand(tasks) {
            this.showIgnoredFoldersMessage().then(() => {
                this.showQuickPick(tasks ? tasks : this.tasks(), nls.localize('TaskService.pickRunTask', 'Select the task to run'), {
                    label: nls.localize('TaskService.noEntryToRun', 'No task to run found. Configure Tasks...'),
                    task: null
                }, true).
                    then((entry) => {
                    let task = entry ? entry.task : undefined;
                    if (task === undefined) {
                        return;
                    }
                    if (task === null) {
                        this.runConfigureTasks();
                    }
                    else {
                        this.run(task, { attachProblemMatcher: true }, 1 /* User */).then(undefined, reason => {
                            // eat the error, it has already been surfaced to the user and we don't care about it here
                        });
                    }
                });
            });
        }
        reRunTaskCommand() {
            if (!this.canRunCommand()) {
                return;
            }
            problemMatcher_1.ProblemMatcherRegistry.onReady().then(() => {
                return this.textFileService.saveAll().then((value) => {
                    let executeResult = this.getTaskSystem().rerun();
                    if (executeResult) {
                        return this.handleExecuteResult(executeResult);
                    }
                    else {
                        this.doRunTaskCommand();
                        return Promise.resolve(undefined);
                    }
                });
            });
        }
        splitPerGroupType(tasks) {
            let none = [];
            let defaults = [];
            let users = [];
            for (let task of tasks) {
                if (task.configurationProperties.groupType === "default" /* default */) {
                    defaults.push(task);
                }
                else if (task.configurationProperties.groupType === "user" /* user */) {
                    users.push(task);
                }
                else {
                    none.push(task);
                }
            }
            return { none, defaults, users };
        }
        runBuildCommand() {
            if (!this.canRunCommand()) {
                return;
            }
            if (this.schemaVersion === 1 /* V0_1_0 */) {
                this.build();
                return;
            }
            let options = {
                location: 10 /* Window */,
                title: nls.localize('TaskService.fetchingBuildTasks', 'Fetching build tasks...')
            };
            let promise = this.getTasksForGroup(tasks_1.TaskGroup.Build).then((tasks) => {
                if (tasks.length > 0) {
                    let { defaults, users } = this.splitPerGroupType(tasks);
                    if (defaults.length === 1) {
                        this.run(defaults[0]).then(undefined, reason => {
                            // eat the error, it has already been surfaced to the user and we don't care about it here
                        });
                        return;
                    }
                    else if (defaults.length + users.length > 0) {
                        tasks = defaults.concat(users);
                    }
                }
                this.showIgnoredFoldersMessage().then(() => {
                    this.showQuickPick(tasks, nls.localize('TaskService.pickBuildTask', 'Select the build task to run'), {
                        label: nls.localize('TaskService.noBuildTask', 'No build task to run found. Configure Build Task...'),
                        task: null
                    }, true).then((entry) => {
                        let task = entry ? entry.task : undefined;
                        if (task === undefined) {
                            return;
                        }
                        if (task === null) {
                            this.runConfigureDefaultBuildTask();
                            return;
                        }
                        this.run(task, { attachProblemMatcher: true }).then(undefined, reason => {
                            // eat the error, it has already been surfaced to the user and we don't care about it here
                        });
                    });
                });
            });
            this.progressService.withProgress(options, () => promise);
        }
        runTestCommand() {
            if (!this.canRunCommand()) {
                return;
            }
            if (this.schemaVersion === 1 /* V0_1_0 */) {
                this.runTest();
                return;
            }
            let options = {
                location: 10 /* Window */,
                title: nls.localize('TaskService.fetchingTestTasks', 'Fetching test tasks...')
            };
            let promise = this.getTasksForGroup(tasks_1.TaskGroup.Test).then((tasks) => {
                if (tasks.length > 0) {
                    let { defaults, users } = this.splitPerGroupType(tasks);
                    if (defaults.length === 1) {
                        this.run(defaults[0]).then(undefined, reason => {
                            // eat the error, it has already been surfaced to the user and we don't care about it here
                        });
                        return;
                    }
                    else if (defaults.length + users.length > 0) {
                        tasks = defaults.concat(users);
                    }
                }
                this.showIgnoredFoldersMessage().then(() => {
                    this.showQuickPick(tasks, nls.localize('TaskService.pickTestTask', 'Select the test task to run'), {
                        label: nls.localize('TaskService.noTestTaskTerminal', 'No test task to run found. Configure Tasks...'),
                        task: null
                    }, true).then((entry) => {
                        let task = entry ? entry.task : undefined;
                        if (task === undefined) {
                            return;
                        }
                        if (task === null) {
                            this.runConfigureTasks();
                            return;
                        }
                        this.run(task).then(undefined, reason => {
                            // eat the error, it has already been surfaced to the user and we don't care about it here
                        });
                    });
                });
            });
            this.progressService.withProgress(options, () => promise);
        }
        runTerminateCommand(arg) {
            if (!this.canRunCommand()) {
                return;
            }
            if (arg === 'terminateAll') {
                this.terminateAll();
                return;
            }
            let runQuickPick = (promise) => {
                this.showQuickPick(promise || this.getActiveTasks(), nls.localize('TaskService.taskToTerminate', 'Select a task to terminate'), {
                    label: nls.localize('TaskService.noTaskRunning', 'No task is currently running'),
                    task: undefined
                }, false, true, undefined, [{
                        label: nls.localize('TaskService.terminateAllRunningTasks', 'All Running Tasks'),
                        id: 'terminateAll',
                        task: undefined
                    }]).then(entry => {
                    if (entry && entry.id === 'terminateAll') {
                        this.terminateAll();
                    }
                    let task = entry ? entry.task : undefined;
                    if (task === undefined || task === null) {
                        return;
                    }
                    this.terminate(task);
                });
            };
            if (this.inTerminal()) {
                let identifier = this.getTaskIdentifier(arg);
                let promise;
                if (identifier !== undefined) {
                    promise = this.getActiveTasks();
                    promise.then((tasks) => {
                        for (let task of tasks) {
                            if (task.matches(identifier)) {
                                this.terminate(task);
                                return;
                            }
                        }
                        runQuickPick(promise);
                    });
                }
                else {
                    runQuickPick();
                }
            }
            else {
                this.isActive().then((active) => {
                    if (active) {
                        this.terminateAll().then((responses) => {
                            // the output runner has only one task
                            let response = responses[0];
                            if (response.success) {
                                return;
                            }
                            if (response.code && response.code === 3 /* ProcessNotFound */) {
                                this.notificationService.error(nls.localize('TerminateAction.noProcess', 'The launched process doesn\'t exist anymore. If the task spawned background tasks exiting VS Code might result in orphaned processes.'));
                            }
                            else {
                                this.notificationService.error(nls.localize('TerminateAction.failed', 'Failed to terminate running task'));
                            }
                        });
                    }
                });
            }
        }
        runRestartTaskCommand(arg) {
            if (!this.canRunCommand()) {
                return;
            }
            let runQuickPick = (promise) => {
                this.showQuickPick(promise || this.getActiveTasks(), nls.localize('TaskService.taskToRestart', 'Select the task to restart'), {
                    label: nls.localize('TaskService.noTaskToRestart', 'No task to restart'),
                    task: null
                }, false, true).then(entry => {
                    let task = entry ? entry.task : undefined;
                    if (task === undefined || task === null) {
                        return;
                    }
                    this.restart(task);
                });
            };
            if (this.inTerminal()) {
                let identifier = this.getTaskIdentifier(arg);
                let promise;
                if (identifier !== undefined) {
                    promise = this.getActiveTasks();
                    promise.then((tasks) => {
                        for (let task of tasks) {
                            if (task.matches(identifier)) {
                                this.restart(task);
                                return;
                            }
                        }
                        runQuickPick(promise);
                    });
                }
                else {
                    runQuickPick();
                }
            }
            else {
                this.getActiveTasks().then((activeTasks) => {
                    if (activeTasks.length === 0) {
                        return;
                    }
                    let task = activeTasks[0];
                    this.restart(task);
                });
            }
        }
        getTaskIdentifier(arg) {
            let result = undefined;
            if (Types.isString(arg)) {
                result = arg;
            }
            else if (arg && Types.isString(arg.type)) {
                result = tasks_1.TaskDefinition.createTaskIdentifier(arg, console);
            }
            return result;
        }
        openTaskFile(resource) {
            let configFileCreated = false;
            this.fileService.resolve(resource).then((stat) => stat, () => undefined).then((stat) => {
                if (stat) {
                    return stat.resource;
                }
                return this.quickInputService.pick(taskTemplates_1.getTemplates(), { placeHolder: nls.localize('TaskService.template', 'Select a Task Template') }).then((selection) => {
                    if (!selection) {
                        return Promise.resolve(undefined);
                    }
                    let content = selection.content;
                    let editorConfig = this.configurationService.getValue();
                    if (editorConfig.editor.insertSpaces) {
                        content = content.replace(/(\n)(\t+)/g, (_, s1, s2) => s1 + strings.repeat(' ', s2.length * editorConfig.editor.tabSize));
                    }
                    configFileCreated = true;
                    return this.textFileService.create(resource, content).then((result) => {
                        this.telemetryService.publicLog2('taskService.template', {
                            templateId: selection.id,
                            autoDetect: selection.autoDetect
                        });
                        return result.resource;
                    });
                });
            }).then((resource) => {
                if (!resource) {
                    return;
                }
                this.editorService.openEditor({
                    resource,
                    options: {
                        pinned: configFileCreated // pin only if config file is created #8727
                    }
                });
            });
        }
        runConfigureTasks() {
            if (!this.canRunCommand()) {
                return undefined;
            }
            let taskPromise;
            if (this.schemaVersion === 2 /* V2_0_0 */) {
                taskPromise = this.getGroupedTasks();
            }
            else {
                taskPromise = Promise.resolve(new TaskMap());
            }
            let configureTask = (task) => {
                if (tasks_1.ContributedTask.is(task)) {
                    this.customize(task, undefined, true);
                }
                else if (tasks_1.CustomTask.is(task)) {
                    this.openConfig(task);
                }
                else if (tasks_1.ConfiguringTask.is(task)) {
                    // Do nothing.
                }
            };
            function isTaskEntry(value) {
                let candidate = value;
                return candidate && !!candidate.task;
            }
            let stats = this.contextService.getWorkspace().folders.map((folder) => {
                return this.fileService.resolve(folder.toResource('.vscode/tasks.json')).then(stat => stat, () => undefined);
            });
            let createLabel = nls.localize('TaskService.createJsonFile', 'Create tasks.json file from template');
            let openLabel = nls.localize('TaskService.openJsonFile', 'Open tasks.json file');
            const tokenSource = new cancellation_1.CancellationTokenSource();
            const cancellationToken = tokenSource.token;
            let entries = Promise.all(stats).then((stats) => {
                return taskPromise.then((taskMap) => {
                    let entries = [];
                    if (this.contextService.getWorkbenchState() !== 1 /* EMPTY */) {
                        let tasks = taskMap.all();
                        let needsCreateOrOpen = true;
                        if (tasks.length > 0) {
                            tasks = tasks.sort((a, b) => a._label.localeCompare(b._label));
                            for (let task of tasks) {
                                entries.push({ label: task._label, task });
                                if (!tasks_1.ContributedTask.is(task)) {
                                    needsCreateOrOpen = false;
                                }
                            }
                        }
                        if (needsCreateOrOpen) {
                            let label = stats[0] !== undefined ? openLabel : createLabel;
                            if (entries.length) {
                                entries.push({ type: 'separator' });
                            }
                            entries.push({ label, folder: this.contextService.getWorkspace().folders[0] });
                        }
                    }
                    else {
                        let folders = this.contextService.getWorkspace().folders;
                        let index = 0;
                        for (let folder of folders) {
                            let tasks = taskMap.get(folder);
                            if (tasks.length > 0) {
                                tasks = tasks.slice().sort((a, b) => a._label.localeCompare(b._label));
                                for (let i = 0; i < tasks.length; i++) {
                                    let entry = { label: tasks[i]._label, task: tasks[i], description: folder.name };
                                    if (i === 0) {
                                        entries.push({ type: 'separator', label: folder.name });
                                    }
                                    entries.push(entry);
                                }
                            }
                            else {
                                let label = stats[index] !== undefined ? openLabel : createLabel;
                                let entry = { label, folder: folder };
                                entries.push({ type: 'separator', label: folder.name });
                                entries.push(entry);
                            }
                            index++;
                        }
                    }
                    if (entries.length === 1) {
                        tokenSource.cancel();
                    }
                    return entries;
                });
            });
            this.quickInputService.pick(entries, { placeHolder: nls.localize('TaskService.pickTask', 'Select a task to configure') }, cancellationToken).
                then(async (selection) => {
                if (cancellationToken.isCancellationRequested) {
                    // canceled when there's only one task
                    const task = (await entries)[0];
                    if (task.task) {
                        selection = task;
                    }
                }
                if (!selection) {
                    return;
                }
                if (isTaskEntry(selection)) {
                    configureTask(selection.task);
                }
                else {
                    this.openTaskFile(selection.folder.toResource('.vscode/tasks.json'));
                }
            });
        }
        runConfigureDefaultBuildTask() {
            if (!this.canRunCommand()) {
                return;
            }
            if (this.schemaVersion === 2 /* V2_0_0 */) {
                this.tasks().then((tasks => {
                    if (tasks.length === 0) {
                        this.runConfigureTasks();
                        return;
                    }
                    let selectedTask;
                    let selectedEntry;
                    for (let task of tasks) {
                        if (task.configurationProperties.group === tasks_1.TaskGroup.Build && task.configurationProperties.groupType === "default" /* default */) {
                            selectedTask = task;
                            break;
                        }
                    }
                    if (selectedTask) {
                        selectedEntry = {
                            label: nls.localize('TaskService.defaultBuildTaskExists', '{0} is already marked as the default build task', selectedTask.getQualifiedLabel()),
                            task: selectedTask
                        };
                    }
                    this.showIgnoredFoldersMessage().then(() => {
                        this.showQuickPick(tasks, nls.localize('TaskService.pickDefaultBuildTask', 'Select the task to be used as the default build task'), undefined, true, false, selectedEntry).
                            then((entry) => {
                            let task = entry ? entry.task : undefined;
                            if ((task === undefined) || (task === null)) {
                                return;
                            }
                            if (task === selectedTask && tasks_1.CustomTask.is(task)) {
                                this.openConfig(task);
                            }
                            if (!tasks_1.InMemoryTask.is(task)) {
                                this.customize(task, { group: { kind: 'build', isDefault: true } }, true).then(() => {
                                    if (selectedTask && (task !== selectedTask) && !tasks_1.InMemoryTask.is(selectedTask)) {
                                        this.customize(selectedTask, { group: 'build' }, true);
                                    }
                                });
                            }
                        });
                    });
                }));
            }
            else {
                this.runConfigureTasks();
            }
        }
        runConfigureDefaultTestTask() {
            if (!this.canRunCommand()) {
                return;
            }
            if (this.schemaVersion === 2 /* V2_0_0 */) {
                this.tasks().then((tasks => {
                    if (tasks.length === 0) {
                        this.runConfigureTasks();
                        return;
                    }
                    let selectedTask;
                    let selectedEntry;
                    for (let task of tasks) {
                        if (task.configurationProperties.group === tasks_1.TaskGroup.Test && task.configurationProperties.groupType === "default" /* default */) {
                            selectedTask = task;
                            break;
                        }
                    }
                    if (selectedTask) {
                        selectedEntry = {
                            label: nls.localize('TaskService.defaultTestTaskExists', '{0} is already marked as the default test task.', selectedTask.getQualifiedLabel()),
                            task: selectedTask
                        };
                    }
                    this.showIgnoredFoldersMessage().then(() => {
                        this.showQuickPick(tasks, nls.localize('TaskService.pickDefaultTestTask', 'Select the task to be used as the default test task'), undefined, true, false, selectedEntry).then((entry) => {
                            let task = entry ? entry.task : undefined;
                            if (!task) {
                                return;
                            }
                            if (task === selectedTask && tasks_1.CustomTask.is(task)) {
                                this.openConfig(task);
                            }
                            if (!tasks_1.InMemoryTask.is(task)) {
                                this.customize(task, { group: { kind: 'test', isDefault: true } }, true).then(() => {
                                    if (selectedTask && (task !== selectedTask) && !tasks_1.InMemoryTask.is(selectedTask)) {
                                        this.customize(selectedTask, { group: 'test' }, true);
                                    }
                                });
                            }
                        });
                    });
                }));
            }
            else {
                this.runConfigureTasks();
            }
        }
        async runShowTasks() {
            if (!this.canRunCommand()) {
                return;
            }
            const activeTasks = await this.getActiveTasks();
            if (activeTasks.length === 1) {
                this._taskSystem.revealTask(activeTasks[0]);
            }
            else {
                this.showQuickPick(this.getActiveTasks(), nls.localize('TaskService.pickShowTask', 'Select the task to show its output'), {
                    label: nls.localize('TaskService.noTaskIsRunning', 'No task is running'),
                    task: null
                }, false, true).then((entry) => {
                    let task = entry ? entry.task : undefined;
                    if (task === undefined || task === null) {
                        return;
                    }
                    this._taskSystem.revealTask(task);
                });
            }
        }
    };
    // private static autoDetectTelemetryName: string = 'taskServer.autoDetect';
    AbstractTaskService.RecentlyUsedTasks_Key = 'workbench.tasks.recentlyUsedTasks';
    AbstractTaskService.IgnoreTask010DonotShowAgain_key = 'workbench.tasks.ignoreTask010Shown';
    AbstractTaskService.CustomizationTelemetryEventName = 'taskService.customize';
    AbstractTaskService.OutputChannelId = 'tasks';
    AbstractTaskService.OutputChannelLabel = nls.localize('tasks', "Tasks");
    AbstractTaskService.nextHandle = 0;
    AbstractTaskService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, markers_1.IMarkerService),
        __param(2, output_1.IOutputService),
        __param(3, panelService_1.IPanelService),
        __param(4, editorService_1.IEditorService),
        __param(5, files_1.IFileService),
        __param(6, workspace_1.IWorkspaceContextService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, textfiles_1.ITextFileService),
        __param(9, lifecycle_2.ILifecycleService),
        __param(10, modelService_1.IModelService),
        __param(11, extensions_1.IExtensionService),
        __param(12, quickInput_1.IQuickInputService),
        __param(13, configurationResolver_1.IConfigurationResolverService),
        __param(14, terminal_1.ITerminalService),
        __param(15, storage_1.IStorageService),
        __param(16, progress_1.IProgressService),
        __param(17, opener_1.IOpenerService),
        __param(18, host_1.IHostService),
        __param(19, dialogs_1.IDialogService),
        __param(20, notification_1.INotificationService),
        __param(21, contextkey_1.IContextKeyService),
        __param(22, environmentService_1.IWorkbenchEnvironmentService),
        __param(23, layoutService_1.IWorkbenchLayoutService),
        __param(24, terminal_1.ITerminalInstanceService),
        __param(25, remoteAgentService_1.IRemoteAgentService),
        __param(26, resolverService_1.ITextModelService),
        __param(27, preferences_1.IPreferencesService)
    ], AbstractTaskService);
    exports.AbstractTaskService = AbstractTaskService;
});
//# sourceMappingURL=abstractTaskService.js.map