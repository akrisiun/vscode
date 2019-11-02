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
define(["require", "exports", "vs/nls", "vs/platform/quickOpen/common/quickOpen", "vs/workbench/contrib/tasks/common/tasks", "vs/workbench/contrib/tasks/common/taskService", "vs/workbench/services/extensions/common/extensions", "./quickOpen"], function (require, exports, nls, quickOpen_1, tasks_1, taskService_1, extensions_1, base) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TaskEntry extends base.TaskEntry {
        constructor(quickOpenService, taskService, task, highlights = []) {
            super(quickOpenService, taskService, task, highlights);
        }
        run(mode, context) {
            if (mode === 0 /* PREVIEW */) {
                return false;
            }
            let task = this._task;
            return this.doRun(task, { attachProblemMatcher: true });
        }
    }
    let QuickOpenHandler = class QuickOpenHandler extends base.QuickOpenHandler {
        constructor(quickOpenService, extensionService, taskService) {
            super(quickOpenService, taskService);
            this.activationPromise = extensionService.activateByEvent('onCommand:workbench.action.tasks.runTask');
        }
        getAriaLabel() {
            return nls.localize('tasksAriaLabel', "Type the name of a task to run");
        }
        getTasks() {
            return this.activationPromise.then(() => {
                return this.taskService.tasks().then(tasks => tasks.filter((task) => tasks_1.ContributedTask.is(task) || tasks_1.CustomTask.is(task)));
            });
        }
        createEntry(task, highlights) {
            return new TaskEntry(this.quickOpenService, this.taskService, task, highlights);
        }
        getEmptyLabel(searchString) {
            if (searchString.length > 0) {
                return nls.localize('noTasksMatching', "No tasks matching");
            }
            return nls.localize('noTasksFound', "No tasks found");
        }
    };
    QuickOpenHandler.ID = 'workbench.picker.tasks';
    QuickOpenHandler = __decorate([
        __param(0, quickOpen_1.IQuickOpenService),
        __param(1, extensions_1.IExtensionService),
        __param(2, taskService_1.ITaskService)
    ], QuickOpenHandler);
    exports.QuickOpenHandler = QuickOpenHandler;
});
//# sourceMappingURL=taskQuickOpen.js.map