/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/objects", "semver-umd", "vs/workbench/contrib/tasks/common/tasks", "../common/taskConfiguration", "vs/workbench/contrib/tasks/node/processTaskSystem", "vs/workbench/contrib/tasks/node/processRunnerDetector", "vs/workbench/contrib/tasks/browser/abstractTaskService", "vs/workbench/contrib/tasks/common/taskService", "vs/platform/instantiation/common/extensions"], function (require, exports, Objects, semver, tasks_1, TaskConfig, processTaskSystem_1, processRunnerDetector_1, abstractTaskService_1, taskService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TaskService extends abstractTaskService_1.AbstractTaskService {
        constructor() {
            super(...arguments);
            this._configHasErrors = false;
        }
        getTaskSystem() {
            if (this._taskSystem) {
                return this._taskSystem;
            }
            if (this.executionEngine === tasks_1.ExecutionEngine.Terminal) {
                this._taskSystem = this.createTerminalTaskSystem();
            }
            else {
                let system = new processTaskSystem_1.ProcessTaskSystem(this.markerService, this.modelService, this.telemetryService, this.outputService, this.configurationResolverService, TaskService.OutputChannelId);
                system.hasErrors(this._configHasErrors);
                this._taskSystem = system;
            }
            this._taskSystemListener = this._taskSystem.onDidStateChange((event) => {
                if (this._taskSystem) {
                    this._taskRunningState.set(this._taskSystem.isActiveSync());
                }
                this._onDidStateChange.fire(event);
            });
            return this._taskSystem;
        }
        updateWorkspaceTasks(runSource = 1 /* User */) {
            this._workspaceTasksPromise = this.computeWorkspaceTasks(runSource).then(value => {
                if (this.executionEngine === tasks_1.ExecutionEngine.Process && this._taskSystem instanceof processTaskSystem_1.ProcessTaskSystem) {
                    // We can only have a process engine if we have one folder.
                    value.forEach((value) => {
                        this._configHasErrors = value.hasErrors;
                        this._taskSystem.hasErrors(this._configHasErrors);
                    });
                }
                return value;
            });
        }
        hasDetectorSupport(config) {
            if (!config.command || this.contextService.getWorkbenchState() === 1 /* EMPTY */) {
                return false;
            }
            return processRunnerDetector_1.ProcessRunnerDetector.supports(TaskConfig.CommandString.value(config.command));
        }
        computeLegacyConfiguration(workspaceFolder) {
            let { config, hasParseErrors } = this.getConfiguration(workspaceFolder);
            if (hasParseErrors) {
                return Promise.resolve({ workspaceFolder: workspaceFolder, hasErrors: true, config: undefined });
            }
            if (config) {
                if (this.hasDetectorSupport(config)) {
                    return new processRunnerDetector_1.ProcessRunnerDetector(workspaceFolder, this.fileService, this.contextService, this.configurationResolverService, config).detect(true).then((value) => {
                        let hasErrors = this.printStderr(value.stderr);
                        let detectedConfig = value.config;
                        if (!detectedConfig) {
                            return { workspaceFolder, config, hasErrors };
                        }
                        let result = Objects.deepClone(config);
                        let configuredTasks = Object.create(null);
                        const resultTasks = result.tasks;
                        if (!resultTasks) {
                            if (detectedConfig.tasks) {
                                result.tasks = detectedConfig.tasks;
                            }
                        }
                        else {
                            resultTasks.forEach(task => {
                                if (task.taskName) {
                                    configuredTasks[task.taskName] = task;
                                }
                            });
                            if (detectedConfig.tasks) {
                                detectedConfig.tasks.forEach((task) => {
                                    if (task.taskName && !configuredTasks[task.taskName]) {
                                        resultTasks.push(task);
                                    }
                                });
                            }
                        }
                        return { workspaceFolder, config: result, hasErrors };
                    });
                }
                else {
                    return Promise.resolve({ workspaceFolder, config, hasErrors: false });
                }
            }
            else {
                return new processRunnerDetector_1.ProcessRunnerDetector(workspaceFolder, this.fileService, this.contextService, this.configurationResolverService).detect(true).then((value) => {
                    let hasErrors = this.printStderr(value.stderr);
                    return { workspaceFolder, config: value.config, hasErrors };
                });
            }
        }
        versionAndEngineCompatible(filter) {
            let range = filter && filter.version ? filter.version : undefined;
            let engine = this.executionEngine;
            return (range === undefined) || ((semver.satisfies('0.1.0', range) && engine === tasks_1.ExecutionEngine.Process) || (semver.satisfies('2.0.0', range) && engine === tasks_1.ExecutionEngine.Terminal));
        }
        printStderr(stderr) {
            let result = false;
            if (stderr && stderr.length > 0) {
                stderr.forEach((line) => {
                    result = true;
                    this._outputChannel.append(line + '\n');
                });
                this.showOutput();
            }
            return result;
        }
    }
    exports.TaskService = TaskService;
    extensions_1.registerSingleton(taskService_1.ITaskService, TaskService, true);
});
//# sourceMappingURL=taskService.js.map