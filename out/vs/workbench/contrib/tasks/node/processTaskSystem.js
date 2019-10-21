/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/objects", "vs/base/common/types", "vs/base/common/platform", "vs/base/common/async", "vs/base/common/severity", "vs/base/common/strings", "vs/base/common/event", "vs/base/node/processes", "vs/workbench/contrib/tasks/common/problemMatcher", "vs/workbench/contrib/tasks/common/problemCollectors", "vs/workbench/contrib/tasks/common/taskSystem", "vs/workbench/contrib/tasks/common/tasks", "vs/base/common/lifecycle"], function (require, exports, nls, Objects, Types, Platform, Async, severity_1, Strings, event_1, processes_1, problemMatcher_1, problemCollectors_1, taskSystem_1, tasks_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Since ProcessTaskSystem is not receiving new feature updates all strict null check fixing has been done with !.
     */
    class ProcessTaskSystem {
        constructor(markerService, modelService, telemetryService, outputService, configurationResolverService, outputChannelId) {
            this.outputChannelId = outputChannelId;
            this.markerService = markerService;
            this.modelService = modelService;
            this.outputService = outputService;
            this.telemetryService = telemetryService;
            this.configurationResolverService = configurationResolverService;
            this.childProcess = null;
            this.activeTask = null;
            this.activeTaskPromise = null;
            this.errorsShown = true;
            this._onDidStateChange = new event_1.Emitter();
        }
        get onDidStateChange() {
            return this._onDidStateChange.event;
        }
        isActive() {
            return Promise.resolve(!!this.childProcess);
        }
        isActiveSync() {
            return !!this.childProcess;
        }
        getActiveTasks() {
            let result = [];
            if (this.activeTask) {
                result.push(this.activeTask);
            }
            return result;
        }
        getBusyTasks() {
            return this.getActiveTasks();
        }
        run(task) {
            if (this.activeTask) {
                return { kind: 2 /* Active */, task, active: { same: this.activeTask._id === task._id, background: this.activeTask.configurationProperties.isBackground }, promise: this.activeTaskPromise };
            }
            return this.executeTask(task);
        }
        revealTask(task) {
            this.showOutput();
            return true;
        }
        customExecutionComplete(task, result) {
            throw new taskSystem_1.TaskError(severity_1.default.Error, 'Custom execution task completion is never expected in the process task system.', 7 /* UnknownError */);
        }
        hasErrors(value) {
            this.errorsShown = !value;
        }
        canAutoTerminate() {
            if (this.childProcess) {
                if (this.activeTask) {
                    return !this.activeTask.configurationProperties.promptOnClose;
                }
                return false;
            }
            return true;
        }
        terminate(task) {
            if (!this.activeTask || this.activeTask.getMapKey() !== task.getMapKey()) {
                return Promise.resolve({ success: false, task: undefined });
            }
            return this.terminateAll().then(values => values[0]);
        }
        terminateAll() {
            if (this.childProcess) {
                let task = this.activeTask;
                return this.childProcess.terminate().then((response) => {
                    let result = Objects.assign({ task: task }, response);
                    this._onDidStateChange.fire(tasks_1.TaskEvent.create("terminated" /* Terminated */, task));
                    return [result];
                });
            }
            return Promise.resolve([{ success: true, task: undefined }]);
        }
        executeTask(task, trigger = taskSystem_1.Triggers.command) {
            if (!tasks_1.CustomTask.is(task)) {
                throw new Error(nls.localize('version1_0', 'The task system is configured for version 0.1.0 (see tasks.json file), which can only execute custom tasks. Upgrade to version 2.0.0 to run the task: {0}', task._label));
            }
            let telemetryEvent = {
                trigger: trigger,
                runner: 'output',
                taskKind: task.getTelemetryKind(),
                command: 'other',
                success: true
            };
            try {
                let result = this.doExecuteTask(task, telemetryEvent);
                result.promise = result.promise.then((success) => {
                    /* __GDPR__
                        "taskService" : {
                            "${include}": [
                                "${TelemetryEvent}"
                            ]
                        }
                    */
                    this.telemetryService.publicLog(ProcessTaskSystem.TelemetryEventName, telemetryEvent);
                    return success;
                }, (err) => {
                    telemetryEvent.success = false;
                    /* __GDPR__
                        "taskService" : {
                            "${include}": [
                                "${TelemetryEvent}"
                            ]
                        }
                    */
                    this.telemetryService.publicLog(ProcessTaskSystem.TelemetryEventName, telemetryEvent);
                    return Promise.reject(err);
                });
                return result;
            }
            catch (err) {
                telemetryEvent.success = false;
                /* __GDPR__
                    "taskService" : {
                        "${include}": [
                            "${TelemetryEvent}"
                        ]
                    }
                */
                this.telemetryService.publicLog(ProcessTaskSystem.TelemetryEventName, telemetryEvent);
                if (err instanceof taskSystem_1.TaskError) {
                    throw err;
                }
                else if (err instanceof Error) {
                    let error = err;
                    this.appendOutput(error.message);
                    throw new taskSystem_1.TaskError(severity_1.default.Error, error.message, 7 /* UnknownError */);
                }
                else {
                    this.appendOutput(err.toString());
                    throw new taskSystem_1.TaskError(severity_1.default.Error, nls.localize('TaskRunnerSystem.unknownError', 'A unknown error has occurred while executing a task. See task output log for details.'), 7 /* UnknownError */);
                }
            }
        }
        rerun() {
            return undefined;
        }
        doExecuteTask(task, telemetryEvent) {
            let taskSummary = {};
            let commandConfig = task.command;
            if (!this.errorsShown) {
                this.showOutput();
                this.errorsShown = true;
            }
            else {
                this.clearOutput();
            }
            let args = [];
            if (commandConfig.args) {
                for (let arg of commandConfig.args) {
                    if (Types.isString(arg)) {
                        args.push(arg);
                    }
                    else {
                        this.log(`Quoting individual arguments is not supported in the process runner. Using plain value: ${arg.value}`);
                        args.push(arg.value);
                    }
                }
            }
            args = this.resolveVariables(task, args);
            let command = this.resolveVariable(task, Types.isString(commandConfig.name) ? commandConfig.name : commandConfig.name.value);
            this.childProcess = new processes_1.LineProcess(command, args, commandConfig.runtime === tasks_1.RuntimeType.Shell, this.resolveOptions(task, commandConfig.options));
            telemetryEvent.command = this.childProcess.getSanitizedCommand();
            // we have no problem matchers defined. So show the output log
            let reveal = task.command.presentation.reveal;
            if (reveal === tasks_1.RevealKind.Always || (reveal === tasks_1.RevealKind.Silent && task.configurationProperties.problemMatchers.length === 0)) {
                this.showOutput();
            }
            if (commandConfig.presentation.echo) {
                let prompt = Platform.isWindows ? '>' : '$';
                this.log(`running command${prompt} ${command} ${args.join(' ')}`);
            }
            if (task.configurationProperties.isBackground) {
                let watchingProblemMatcher = new problemCollectors_1.WatchingProblemCollector(this.resolveMatchers(task, task.configurationProperties.problemMatchers), this.markerService, this.modelService);
                let toDispose = [];
                let eventCounter = 0;
                toDispose.push(watchingProblemMatcher.onDidStateChange((event) => {
                    if (event.kind === "backgroundProcessingBegins" /* BackgroundProcessingBegins */) {
                        eventCounter++;
                        this._onDidStateChange.fire(tasks_1.TaskEvent.create("active" /* Active */, task));
                    }
                    else if (event.kind === "backgroundProcessingEnds" /* BackgroundProcessingEnds */) {
                        eventCounter--;
                        this._onDidStateChange.fire(tasks_1.TaskEvent.create("inactive" /* Inactive */, task));
                    }
                }));
                watchingProblemMatcher.aboutToStart();
                let delayer = null;
                this.activeTask = task;
                const inactiveEvent = tasks_1.TaskEvent.create("inactive" /* Inactive */, task);
                let processStartedSignaled = false;
                const onProgress = (progress) => {
                    let line = Strings.removeAnsiEscapeCodes(progress.line);
                    this.appendOutput(line + '\n');
                    watchingProblemMatcher.processLine(line);
                    if (delayer === null) {
                        delayer = new Async.Delayer(3000);
                    }
                    delayer.trigger(() => {
                        watchingProblemMatcher.forceDelivery();
                        return null;
                    }).then(() => {
                        delayer = null;
                    });
                };
                const startPromise = this.childProcess.start(onProgress);
                this.childProcess.pid.then(pid => {
                    if (pid !== -1) {
                        processStartedSignaled = true;
                        this._onDidStateChange.fire(tasks_1.TaskEvent.create("processStarted" /* ProcessStarted */, task, pid));
                    }
                });
                this.activeTaskPromise = startPromise.then((success) => {
                    this.childProcessEnded();
                    watchingProblemMatcher.done();
                    watchingProblemMatcher.dispose();
                    if (processStartedSignaled) {
                        this._onDidStateChange.fire(tasks_1.TaskEvent.create("processEnded" /* ProcessEnded */, task, success.cmdCode));
                    }
                    toDispose = lifecycle_1.dispose(toDispose);
                    toDispose = null;
                    for (let i = 0; i < eventCounter; i++) {
                        this._onDidStateChange.fire(inactiveEvent);
                    }
                    eventCounter = 0;
                    if (!this.checkTerminated(task, success)) {
                        this.log(nls.localize('TaskRunnerSystem.watchingBuildTaskFinished', '\nWatching build tasks has finished.'));
                    }
                    if (success.cmdCode && success.cmdCode === 1 && watchingProblemMatcher.numberOfMatches === 0 && reveal !== tasks_1.RevealKind.Never) {
                        this.showOutput();
                    }
                    taskSummary.exitCode = success.cmdCode;
                    return taskSummary;
                }, (error) => {
                    this.childProcessEnded();
                    watchingProblemMatcher.dispose();
                    toDispose = lifecycle_1.dispose(toDispose);
                    toDispose = null;
                    for (let i = 0; i < eventCounter; i++) {
                        this._onDidStateChange.fire(inactiveEvent);
                    }
                    eventCounter = 0;
                    return this.handleError(task, error);
                });
                let result = task.tscWatch
                    ? { kind: 1 /* Started */, task, started: { restartOnFileChanges: '**/*.ts' }, promise: this.activeTaskPromise }
                    : { kind: 1 /* Started */, task, started: {}, promise: this.activeTaskPromise };
                return result;
            }
            else {
                this._onDidStateChange.fire(tasks_1.TaskEvent.create("start" /* Start */, task));
                this._onDidStateChange.fire(tasks_1.TaskEvent.create("active" /* Active */, task));
                let startStopProblemMatcher = new problemCollectors_1.StartStopProblemCollector(this.resolveMatchers(task, task.configurationProperties.problemMatchers), this.markerService, this.modelService);
                this.activeTask = task;
                const inactiveEvent = tasks_1.TaskEvent.create("inactive" /* Inactive */, task);
                let processStartedSignaled = false;
                const onProgress = (progress) => {
                    let line = Strings.removeAnsiEscapeCodes(progress.line);
                    this.appendOutput(line + '\n');
                    startStopProblemMatcher.processLine(line);
                };
                const startPromise = this.childProcess.start(onProgress);
                this.childProcess.pid.then(pid => {
                    if (pid !== -1) {
                        processStartedSignaled = true;
                        this._onDidStateChange.fire(tasks_1.TaskEvent.create("processStarted" /* ProcessStarted */, task, pid));
                    }
                });
                this.activeTaskPromise = startPromise.then((success) => {
                    this.childProcessEnded();
                    startStopProblemMatcher.done();
                    startStopProblemMatcher.dispose();
                    this.checkTerminated(task, success);
                    if (processStartedSignaled) {
                        this._onDidStateChange.fire(tasks_1.TaskEvent.create("processEnded" /* ProcessEnded */, task, success.cmdCode));
                    }
                    this._onDidStateChange.fire(inactiveEvent);
                    this._onDidStateChange.fire(tasks_1.TaskEvent.create("end" /* End */, task));
                    if (success.cmdCode && success.cmdCode === 1 && startStopProblemMatcher.numberOfMatches === 0 && reveal !== tasks_1.RevealKind.Never) {
                        this.showOutput();
                    }
                    taskSummary.exitCode = success.cmdCode;
                    return taskSummary;
                }, (error) => {
                    this.childProcessEnded();
                    startStopProblemMatcher.dispose();
                    this._onDidStateChange.fire(inactiveEvent);
                    this._onDidStateChange.fire(tasks_1.TaskEvent.create("end" /* End */, task));
                    return this.handleError(task, error);
                });
                return { kind: 1 /* Started */, task, started: {}, promise: this.activeTaskPromise };
            }
        }
        childProcessEnded() {
            this.childProcess = null;
            this.activeTask = null;
            this.activeTaskPromise = null;
        }
        handleError(task, errorData) {
            let makeVisible = false;
            if (errorData.error && !errorData.terminated) {
                let args = task.command.args ? task.command.args.join(' ') : '';
                this.log(nls.localize('TaskRunnerSystem.childProcessError', 'Failed to launch external program {0} {1}.', JSON.stringify(task.command.name), args));
                this.appendOutput(errorData.error.message);
                makeVisible = true;
            }
            if (errorData.stdout) {
                this.appendOutput(errorData.stdout);
                makeVisible = true;
            }
            if (errorData.stderr) {
                this.appendOutput(errorData.stderr);
                makeVisible = true;
            }
            makeVisible = this.checkTerminated(task, errorData) || makeVisible;
            if (makeVisible) {
                this.showOutput();
            }
            const error = errorData.error || new Error();
            error.stderr = errorData.stderr;
            error.stdout = errorData.stdout;
            error.terminated = errorData.terminated;
            return Promise.reject(error);
        }
        checkTerminated(task, data) {
            if (data.terminated) {
                this.log(nls.localize('TaskRunnerSystem.cancelRequested', '\nThe task \'{0}\' was terminated per user request.', task.configurationProperties.name));
                return true;
            }
            return false;
        }
        resolveOptions(task, options) {
            let result = { cwd: this.resolveVariable(task, options.cwd) };
            if (options.env) {
                result.env = Object.create(null);
                Object.keys(options.env).forEach((key) => {
                    let value = options.env[key];
                    if (Types.isString(value)) {
                        result.env[key] = this.resolveVariable(task, value);
                    }
                    else {
                        result.env[key] = value.toString();
                    }
                });
            }
            return result;
        }
        resolveVariables(task, value) {
            return value.map(s => this.resolveVariable(task, s));
        }
        resolveMatchers(task, values) {
            if (values === undefined || values === null || values.length === 0) {
                return [];
            }
            let result = [];
            values.forEach((value) => {
                let matcher;
                if (Types.isString(value)) {
                    if (value[0] === '$') {
                        matcher = problemMatcher_1.ProblemMatcherRegistry.get(value.substring(1));
                    }
                    else {
                        matcher = problemMatcher_1.ProblemMatcherRegistry.get(value);
                    }
                }
                else {
                    matcher = value;
                }
                if (!matcher) {
                    this.appendOutput(nls.localize('unknownProblemMatcher', 'Problem matcher {0} can\'t be resolved. The matcher will be ignored'));
                    return;
                }
                if (!matcher.filePrefix) {
                    result.push(matcher);
                }
                else {
                    let copy = Objects.deepClone(matcher);
                    copy.filePrefix = this.resolveVariable(task, copy.filePrefix);
                    result.push(copy);
                }
            });
            return result;
        }
        resolveVariable(task, value) {
            return this.configurationResolverService.resolve(task.getWorkspaceFolder(), value);
        }
        log(value) {
            this.appendOutput(value + '\n');
        }
        showOutput() {
            this.outputService.showChannel(this.outputChannelId, true);
        }
        appendOutput(output) {
            const outputChannel = this.outputService.getChannel(this.outputChannelId);
            if (outputChannel) {
                outputChannel.append(output);
            }
        }
        clearOutput() {
            const outputChannel = this.outputService.getChannel(this.outputChannelId);
            if (outputChannel) {
                outputChannel.clear();
            }
        }
    }
    exports.ProcessTaskSystem = ProcessTaskSystem;
    ProcessTaskSystem.TelemetryEventName = 'taskService';
});
//# sourceMappingURL=processTaskSystem.js.map