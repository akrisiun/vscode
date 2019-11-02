/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/objects", "vs/base/common/path", "vs/base/common/strings", "vs/base/node/processes", "vs/nls", "../common/tasks", "../common/taskConfiguration"], function (require, exports, Objects, Path, Strings, processes_1, nls, Tasks, TaskConfig) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const build = 'build';
    const test = 'test';
    const defaultValue = 'default';
    class RegexpTaskMatcher {
        constructor(regExp) {
            this.regexp = regExp;
        }
        init() {
        }
        match(tasks, line) {
            let matches = this.regexp.exec(line);
            if (matches && matches.length > 0) {
                tasks.push(matches[1]);
            }
        }
    }
    class GruntTaskMatcher {
        init() {
            this.tasksStart = false;
            this.tasksEnd = false;
            this.descriptionOffset = null;
        }
        match(tasks, line) {
            // grunt lists tasks as follows (description is wrapped into a new line if too long):
            // ...
            // Available tasks
            //         uglify  Minify files with UglifyJS. *
            //         jshint  Validate files with JSHint. *
            //           test  Alias for "jshint", "qunit" tasks.
            //        default  Alias for "jshint", "qunit", "concat", "uglify" tasks.
            //           long  Alias for "eslint", "qunit", "browserify", "sass",
            //                 "autoprefixer", "uglify", tasks.
            //
            // Tasks run in the order specified
            if (!this.tasksStart && !this.tasksEnd) {
                if (line.indexOf('Available tasks') === 0) {
                    this.tasksStart = true;
                }
            }
            else if (this.tasksStart && !this.tasksEnd) {
                if (line.indexOf('Tasks run in the order specified') === 0) {
                    this.tasksEnd = true;
                }
                else {
                    if (this.descriptionOffset === null) {
                        const match = line.match(/\S  \S/);
                        if (match) {
                            this.descriptionOffset = (match.index || 0) + 1;
                        }
                        else {
                            this.descriptionOffset = 0;
                        }
                    }
                    let taskName = line.substr(0, this.descriptionOffset).trim();
                    if (taskName.length > 0) {
                        tasks.push(taskName);
                    }
                }
            }
        }
    }
    class ProcessRunnerDetector {
        constructor(workspaceFolder, fileService, contextService, configurationResolverService, config = null) {
            this.fileService = fileService;
            this.contextService = contextService;
            this.configurationResolverService = configurationResolverService;
            this.taskConfiguration = config;
            this._workspaceRoot = workspaceFolder;
            this._stderr = [];
            this._stdout = [];
            this._cwd = this.contextService.getWorkbenchState() !== 1 /* EMPTY */ ? Path.normalize(this._workspaceRoot.uri.fsPath) : '';
        }
        static supports(runner) {
            return ProcessRunnerDetector.SupportedRunners[runner];
        }
        static detectorConfig(runner) {
            return ProcessRunnerDetector.TaskMatchers[runner];
        }
        get stderr() {
            return this._stderr;
        }
        get stdout() {
            return this._stdout;
        }
        detect(list = false, detectSpecific) {
            let commandExecutable;
            if (this.taskConfiguration && this.taskConfiguration.command && (commandExecutable = TaskConfig.CommandString.value(this.taskConfiguration.command)) && ProcessRunnerDetector.supports(commandExecutable)) {
                let config = ProcessRunnerDetector.detectorConfig(commandExecutable);
                let args = (this.taskConfiguration.args || []).concat(config.arg);
                let options = this.taskConfiguration.options ? this.resolveCommandOptions(this._workspaceRoot, this.taskConfiguration.options) : { cwd: this._cwd };
                let isShellCommand = !!this.taskConfiguration.isShellCommand;
                return Promise.resolve(this.runDetection(new processes_1.LineProcess(commandExecutable, this.configurationResolverService.resolve(this._workspaceRoot, args.map(a => TaskConfig.CommandString.value(a))), isShellCommand, options), commandExecutable, isShellCommand, config.matcher, ProcessRunnerDetector.DefaultProblemMatchers, list));
            }
            else {
                if (detectSpecific) {
                    let detectorPromise;
                    if ('gulp' === detectSpecific) {
                        detectorPromise = this.tryDetectGulp(this._workspaceRoot, list);
                    }
                    else if ('jake' === detectSpecific) {
                        detectorPromise = this.tryDetectJake(this._workspaceRoot, list);
                    }
                    else if ('grunt' === detectSpecific) {
                        detectorPromise = this.tryDetectGrunt(this._workspaceRoot, list);
                    }
                    else {
                        throw new Error('Unknown detector type');
                    }
                    return detectorPromise.then((value) => {
                        if (value) {
                            return value;
                        }
                        else {
                            return { config: null, stdout: this.stdout, stderr: this.stderr };
                        }
                    });
                }
                else {
                    return this.tryDetectGulp(this._workspaceRoot, list).then((value) => {
                        if (value) {
                            return value;
                        }
                        return this.tryDetectJake(this._workspaceRoot, list).then((value) => {
                            if (value) {
                                return value;
                            }
                            return this.tryDetectGrunt(this._workspaceRoot, list).then((value) => {
                                if (value) {
                                    return value;
                                }
                                return { config: null, stdout: this.stdout, stderr: this.stderr };
                            });
                        });
                    });
                }
            }
        }
        resolveCommandOptions(workspaceFolder, options) {
            // TODO@Dirk adopt new configuration resolver service https://github.com/Microsoft/vscode/issues/31365
            let result = Objects.deepClone(options);
            if (result.cwd) {
                result.cwd = this.configurationResolverService.resolve(workspaceFolder, result.cwd);
            }
            if (result.env) {
                result.env = this.configurationResolverService.resolve(workspaceFolder, result.env);
            }
            return result;
        }
        tryDetectGulp(workspaceFolder, list) {
            return Promise.resolve(this.fileService.resolve(workspaceFolder.toResource('gulpfile.js'))).then((stat) => {
                let config = ProcessRunnerDetector.detectorConfig('gulp');
                let process = new processes_1.LineProcess('gulp', [config.arg, '--no-color'], true, { cwd: this._cwd });
                return this.runDetection(process, 'gulp', true, config.matcher, ProcessRunnerDetector.DefaultProblemMatchers, list);
            }, (err) => {
                return null;
            });
        }
        tryDetectGrunt(workspaceFolder, list) {
            return Promise.resolve(this.fileService.resolve(workspaceFolder.toResource('Gruntfile.js'))).then((stat) => {
                let config = ProcessRunnerDetector.detectorConfig('grunt');
                let process = new processes_1.LineProcess('grunt', [config.arg, '--no-color'], true, { cwd: this._cwd });
                return this.runDetection(process, 'grunt', true, config.matcher, ProcessRunnerDetector.DefaultProblemMatchers, list);
            }, (err) => {
                return null;
            });
        }
        tryDetectJake(workspaceFolder, list) {
            let run = () => {
                let config = ProcessRunnerDetector.detectorConfig('jake');
                let process = new processes_1.LineProcess('jake', [config.arg], true, { cwd: this._cwd });
                return this.runDetection(process, 'jake', true, config.matcher, ProcessRunnerDetector.DefaultProblemMatchers, list);
            };
            return Promise.resolve(this.fileService.resolve(workspaceFolder.toResource('Jakefile'))).then((stat) => {
                return run();
            }, (err) => {
                return this.fileService.resolve(workspaceFolder.toResource('Jakefile.js')).then((stat) => {
                    return run();
                }, (err) => {
                    return null;
                });
            });
        }
        runDetection(process, command, isShellCommand, matcher, problemMatchers, list) {
            let tasks = [];
            matcher.init();
            const onProgress = (progress) => {
                if (progress.source === 1 /* stderr */) {
                    this._stderr.push(progress.line);
                    return;
                }
                let line = Strings.removeAnsiEscapeCodes(progress.line);
                matcher.match(tasks, line);
            };
            return process.start(onProgress).then((success) => {
                if (tasks.length === 0) {
                    if (success.cmdCode !== 0) {
                        if (command === 'gulp') {
                            this._stderr.push(nls.localize('TaskSystemDetector.noGulpTasks', 'Running gulp --tasks-simple didn\'t list any tasks. Did you run npm install?'));
                        }
                        else if (command === 'jake') {
                            this._stderr.push(nls.localize('TaskSystemDetector.noJakeTasks', 'Running jake --tasks didn\'t list any tasks. Did you run npm install?'));
                        }
                    }
                    return { config: null, stdout: this._stdout, stderr: this._stderr };
                }
                let result = {
                    version: ProcessRunnerDetector.Version,
                    command: command,
                    isShellCommand: isShellCommand
                };
                // Hack. We need to remove this.
                if (command === 'gulp') {
                    result.args = ['--no-color'];
                }
                result.tasks = this.createTaskDescriptions(tasks, problemMatchers, list);
                return { config: result, stdout: this._stdout, stderr: this._stderr };
            }, (err) => {
                let error = err.error;
                if (error.code === 'ENOENT') {
                    if (command === 'gulp') {
                        this._stderr.push(nls.localize('TaskSystemDetector.noGulpProgram', 'Gulp is not installed on your system. Run npm install -g gulp to install it.'));
                    }
                    else if (command === 'jake') {
                        this._stderr.push(nls.localize('TaskSystemDetector.noJakeProgram', 'Jake is not installed on your system. Run npm install -g jake to install it.'));
                    }
                    else if (command === 'grunt') {
                        this._stderr.push(nls.localize('TaskSystemDetector.noGruntProgram', 'Grunt is not installed on your system. Run npm install -g grunt to install it.'));
                    }
                }
                else {
                    this._stderr.push(nls.localize('TaskSystemDetector.noProgram', 'Program {0} was not found. Message is {1}', command, error ? error.message : ''));
                }
                return { config: null, stdout: this._stdout, stderr: this._stderr };
            });
        }
        createTaskDescriptions(tasks, problemMatchers, list) {
            let taskConfigs = [];
            if (list) {
                tasks.forEach((task) => {
                    taskConfigs.push({
                        taskName: task,
                        args: []
                    });
                });
            }
            else {
                let taskInfos = {
                    build: { index: -1, exact: -1 },
                    test: { index: -1, exact: -1 }
                };
                tasks.forEach((task, index) => {
                    this.testBuild(taskInfos.build, task, index);
                    this.testTest(taskInfos.test, task, index);
                });
                if (taskInfos.build.index !== -1) {
                    let name = tasks[taskInfos.build.index];
                    this._stdout.push(nls.localize('TaskSystemDetector.buildTaskDetected', 'Build task named \'{0}\' detected.', name));
                    taskConfigs.push({
                        taskName: name,
                        args: [],
                        group: Tasks.TaskGroup.Build,
                        problemMatcher: problemMatchers
                    });
                }
                if (taskInfos.test.index !== -1) {
                    let name = tasks[taskInfos.test.index];
                    this._stdout.push(nls.localize('TaskSystemDetector.testTaskDetected', 'Test task named \'{0}\' detected.', name));
                    taskConfigs.push({
                        taskName: name,
                        args: [],
                        group: Tasks.TaskGroup.Test,
                    });
                }
            }
            return taskConfigs;
        }
        testBuild(taskInfo, taskName, index) {
            if (taskName === build) {
                taskInfo.index = index;
                taskInfo.exact = 4;
            }
            else if ((Strings.startsWith(taskName, build) || Strings.endsWith(taskName, build)) && taskInfo.exact < 4) {
                taskInfo.index = index;
                taskInfo.exact = 3;
            }
            else if (taskName.indexOf(build) !== -1 && taskInfo.exact < 3) {
                taskInfo.index = index;
                taskInfo.exact = 2;
            }
            else if (taskName === defaultValue && taskInfo.exact < 2) {
                taskInfo.index = index;
                taskInfo.exact = 1;
            }
        }
        testTest(taskInfo, taskName, index) {
            if (taskName === test) {
                taskInfo.index = index;
                taskInfo.exact = 3;
            }
            else if ((Strings.startsWith(taskName, test) || Strings.endsWith(taskName, test)) && taskInfo.exact < 3) {
                taskInfo.index = index;
                taskInfo.exact = 2;
            }
            else if (taskName.indexOf(test) !== -1 && taskInfo.exact < 2) {
                taskInfo.index = index;
                taskInfo.exact = 1;
            }
        }
    }
    exports.ProcessRunnerDetector = ProcessRunnerDetector;
    ProcessRunnerDetector.Version = '0.1.0';
    ProcessRunnerDetector.SupportedRunners = {
        'gulp': true,
        'jake': true,
        'grunt': true
    };
    ProcessRunnerDetector.TaskMatchers = {
        'gulp': { matcher: new RegexpTaskMatcher(/^(.*)$/), arg: '--tasks-simple' },
        'jake': { matcher: new RegexpTaskMatcher(/^jake\s+([^\s]+)\s/), arg: '--tasks' },
        'grunt': { matcher: new GruntTaskMatcher(), arg: '--help' },
    };
    ProcessRunnerDetector.DefaultProblemMatchers = ['$lessCompile', '$tsc', '$jshint'];
});
//# sourceMappingURL=processRunnerDetector.js.map