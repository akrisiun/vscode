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
define(["require", "exports", "vs/base/common/path", "vs/base/common/uri", "vs/base/node/processes", "vs/workbench/api/common/extHostWorkspace", "vs/workbench/api/node/extHostDebugService", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/common/extHostConfiguration", "vs/workbench/api/common/extHostTerminalService", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/api/common/extHostTask", "vs/base/common/network"], function (require, exports, path, uri_1, processes_1, extHostWorkspace_1, extHostDebugService_1, extHostDocumentsAndEditors_1, extHostConfiguration_1, extHostTerminalService_1, extHostRpcService_1, extHostInitDataService_1, extHostTask_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ExtHostTask = class ExtHostTask extends extHostTask_1.ExtHostTaskBase {
        constructor(extHostRpc, initData, workspaceService, editorService, configurationService, extHostTerminalService) {
            super(extHostRpc, initData, workspaceService, editorService, configurationService, extHostTerminalService);
            if (initData.remote.isRemote && initData.remote.authority) {
                this.registerTaskSystem(network_1.Schemas.vscodeRemote, {
                    scheme: network_1.Schemas.vscodeRemote,
                    authority: initData.remote.authority,
                    platform: process.platform
                });
            }
        }
        async executeTask(extension, task) {
            const tTask = task;
            // We have a preserved ID. So the task didn't change.
            if (tTask._id !== undefined) {
                return this._proxy.$executeTask(extHostTask_1.TaskHandleDTO.from(tTask)).then(value => this.getTaskExecution(value, task));
            }
            else {
                const dto = extHostTask_1.TaskDTO.from(task, extension);
                if (dto === undefined) {
                    return Promise.reject(new Error('Task is not valid'));
                }
                // If this task is a custom execution, then we need to save it away
                // in the provided custom execution map that is cleaned up after the
                // task is executed.
                if (extHostTask_1.CustomExecutionDTO.is(dto.execution)) {
                    await this.addCustomExecution(dto, task, false);
                }
                return this._proxy.$executeTask(dto).then(value => this.getTaskExecution(value, task));
            }
        }
        provideTasksInternal(validTypes, taskIdPromises, handler, value) {
            const taskDTOs = [];
            if (value) {
                for (let task of value) {
                    if (!task.definition || !validTypes[task.definition.type]) {
                        console.warn(`The task [${task.source}, ${task.name}] uses an undefined task type. The task will be ignored in the future.`);
                    }
                    const taskDTO = extHostTask_1.TaskDTO.from(task, handler.extension);
                    if (taskDTO) {
                        taskDTOs.push(taskDTO);
                        if (extHostTask_1.CustomExecutionDTO.is(taskDTO.execution)) {
                            // The ID is calculated on the main thread task side, so, let's call into it here.
                            // We need the task id's pre-computed for custom task executions because when OnDidStartTask
                            // is invoked, we have to be able to map it back to our data.
                            taskIdPromises.push(this.addCustomExecution(taskDTO, task, true));
                        }
                    }
                }
            }
            return {
                tasks: taskDTOs,
                extension: handler.extension
            };
        }
        async resolveTaskInternal(resolvedTaskDTO) {
            return resolvedTaskDTO;
        }
        async $resolveVariables(uriComponents, toResolve) {
            const configProvider = await this._configurationService.getConfigProvider();
            const uri = uri_1.URI.revive(uriComponents);
            const result = {
                process: undefined,
                variables: Object.create(null)
            };
            const workspaceFolder = await this._workspaceProvider.resolveWorkspaceFolder(uri);
            const workspaceFolders = await this._workspaceProvider.getWorkspaceFolders2();
            if (!workspaceFolders || !workspaceFolder) {
                throw new Error('Unexpected: Tasks can only be run in a workspace folder');
            }
            const resolver = new extHostDebugService_1.ExtHostVariableResolverService(workspaceFolders, this._editorService, configProvider);
            const ws = {
                uri: workspaceFolder.uri,
                name: workspaceFolder.name,
                index: workspaceFolder.index,
                toResource: () => {
                    throw new Error('Not implemented');
                }
            };
            for (let variable of toResolve.variables) {
                result.variables[variable] = resolver.resolve(ws, variable);
            }
            if (toResolve.process !== undefined) {
                let paths = undefined;
                if (toResolve.process.path !== undefined) {
                    paths = toResolve.process.path.split(path.delimiter);
                    for (let i = 0; i < paths.length; i++) {
                        paths[i] = resolver.resolve(ws, paths[i]);
                    }
                }
                result.process = await processes_1.win32.findExecutable(resolver.resolve(ws, toResolve.process.name), toResolve.process.cwd !== undefined ? resolver.resolve(ws, toResolve.process.cwd) : undefined, paths);
            }
            return result;
        }
        $getDefaultShellAndArgs() {
            return this._terminalService.$requestDefaultShellAndArgs(true);
        }
        async $jsonTasksSupported() {
            return true;
        }
    };
    ExtHostTask = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService),
        __param(2, extHostWorkspace_1.IExtHostWorkspace),
        __param(3, extHostDocumentsAndEditors_1.IExtHostDocumentsAndEditors),
        __param(4, extHostConfiguration_1.IExtHostConfiguration),
        __param(5, extHostTerminalService_1.IExtHostTerminalService)
    ], ExtHostTask);
    exports.ExtHostTask = ExtHostTask;
});
//# sourceMappingURL=extHostTask.js.map