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
define(["require", "exports", "vs/nls", "vs/base/common/filters", "vs/base/common/actions", "vs/workbench/browser/quickopen", "vs/base/parts/quickopen/browser/quickOpenModel", "vs/platform/quickOpen/common/quickOpen", "vs/workbench/contrib/tasks/common/tasks", "vs/workbench/contrib/tasks/common/taskService", "vs/workbench/browser/actions"], function (require, exports, nls, Filters, actions_1, Quickopen, Model, quickOpen_1, tasks_1, taskService_1, actions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TaskEntry extends Model.QuickOpenEntry {
        constructor(quickOpenService, taskService, _task, highlights = []) {
            super(highlights);
            this.quickOpenService = quickOpenService;
            this.taskService = taskService;
            this._task = _task;
        }
        getLabel() {
            return this.task._label;
        }
        getDescription() {
            if (!this.taskService.needsFolderQualification()) {
                return undefined;
            }
            let workspaceFolder = this.task.getWorkspaceFolder();
            if (!workspaceFolder) {
                return undefined;
            }
            return `${workspaceFolder.name}`;
        }
        getAriaLabel() {
            return nls.localize('entryAriaLabel', "{0}, tasks", this.getLabel());
        }
        get task() {
            return this._task;
        }
        doRun(task, options) {
            this.taskService.run(task, options).then(undefined, reason => {
                // eat the error, it has already been surfaced to the user and we don't care about it here
            });
            if (!task.command || (task.command.presentation && task.command.presentation.focus)) {
                this.quickOpenService.close();
                return false;
            }
            return true;
        }
    }
    exports.TaskEntry = TaskEntry;
    class TaskGroupEntry extends Model.QuickOpenEntryGroup {
        constructor(entry, groupLabel, withBorder) {
            super(entry, groupLabel, withBorder);
        }
    }
    exports.TaskGroupEntry = TaskGroupEntry;
    class QuickOpenHandler extends Quickopen.QuickOpenHandler {
        constructor(quickOpenService, taskService) {
            super();
            this.quickOpenService = quickOpenService;
            this.taskService = taskService;
            this.quickOpenService = quickOpenService;
            this.taskService = taskService;
        }
        onOpen() {
            this.tasks = this.getTasks();
        }
        onClose(canceled) {
            this.tasks = undefined;
        }
        getResults(input, token) {
            if (!this.tasks) {
                return Promise.resolve(null);
            }
            return this.tasks.then((tasks) => {
                let entries = [];
                if (tasks.length === 0 || token.isCancellationRequested) {
                    return new Model.QuickOpenModel(entries);
                }
                let recentlyUsedTasks = this.taskService.getRecentlyUsedTasks();
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
                        if (tasks_1.CustomTask.is(task)) {
                            configured.push(task);
                        }
                        else {
                            detected.push(task);
                        }
                    }
                }
                const sorter = this.taskService.createSorter();
                let hasRecentlyUsed = recent.length > 0;
                this.fillEntries(entries, input, recent, nls.localize('recentlyUsed', 'recently used tasks'));
                configured = configured.sort((a, b) => sorter.compare(a, b));
                let hasConfigured = configured.length > 0;
                this.fillEntries(entries, input, configured, nls.localize('configured', 'configured tasks'), hasRecentlyUsed);
                detected = detected.sort((a, b) => sorter.compare(a, b));
                this.fillEntries(entries, input, detected, nls.localize('detected', 'detected tasks'), hasRecentlyUsed || hasConfigured);
                return new Model.QuickOpenModel(entries, new actions_2.ContributableActionProvider());
            });
        }
        fillEntries(entries, input, tasks, groupLabel, withBorder = false) {
            let first = true;
            for (let task of tasks) {
                let highlights = Filters.matchesFuzzy(input, task._label);
                if (!highlights) {
                    continue;
                }
                if (first) {
                    first = false;
                    entries.push(new TaskGroupEntry(this.createEntry(task, highlights), groupLabel, withBorder));
                }
                else {
                    entries.push(this.createEntry(task, highlights));
                }
            }
        }
        getAutoFocus(input) {
            return {
                autoFocusFirstEntry: !!input
            };
        }
    }
    exports.QuickOpenHandler = QuickOpenHandler;
    class CustomizeTaskAction extends actions_1.Action {
        constructor(taskService, quickOpenService) {
            super(CustomizeTaskAction.ID, CustomizeTaskAction.LABEL);
            this.taskService = taskService;
            this.quickOpenService = quickOpenService;
            this.updateClass();
        }
        updateClass() {
            this.class = 'quick-open-task-configure';
        }
        run(element) {
            let task = this.getTask(element);
            if (tasks_1.ContributedTask.is(task)) {
                return this.taskService.customize(task, undefined, true).then(() => {
                    this.quickOpenService.close();
                });
            }
            else {
                return this.taskService.openConfig(task).then(() => {
                    this.quickOpenService.close();
                });
            }
        }
        getTask(element) {
            if (element instanceof TaskEntry) {
                return element.task;
            }
            else if (element instanceof TaskGroupEntry) {
                return element.getEntry().task;
            }
            return undefined;
        }
    }
    CustomizeTaskAction.ID = 'workbench.action.tasks.customizeTask';
    CustomizeTaskAction.LABEL = nls.localize('customizeTask', "Configure Task");
    let QuickOpenActionContributor = class QuickOpenActionContributor extends actions_2.ActionBarContributor {
        constructor(taskService, quickOpenService) {
            super();
            this.action = new CustomizeTaskAction(taskService, quickOpenService);
        }
        hasActions(context) {
            let task = this.getTask(context);
            return !!task;
        }
        getActions(context) {
            let actions = [];
            let task = this.getTask(context);
            if (task && tasks_1.ContributedTask.is(task) || tasks_1.CustomTask.is(task)) {
                actions.push(this.action);
            }
            return actions;
        }
        getTask(context) {
            if (!context) {
                return undefined;
            }
            let element = context.element;
            if (element instanceof TaskEntry) {
                return element.task;
            }
            else if (element instanceof TaskGroupEntry) {
                return element.getEntry().task;
            }
            return undefined;
        }
    };
    QuickOpenActionContributor = __decorate([
        __param(0, taskService_1.ITaskService), __param(1, quickOpen_1.IQuickOpenService)
    ], QuickOpenActionContributor);
    exports.QuickOpenActionContributor = QuickOpenActionContributor;
});
//# sourceMappingURL=quickOpen.js.map