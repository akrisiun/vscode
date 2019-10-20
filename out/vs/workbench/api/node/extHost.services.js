/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/api/common/extHostOutput", "vs/workbench/api/node/extHostOutputService", "vs/workbench/api/common/extHostWorkspace", "vs/workbench/api/common/extHostDecorations", "vs/workbench/api/common/extHostConfiguration", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/node/extHostTerminalService", "vs/workbench/api/common/extHostTerminalService", "vs/workbench/api/common/extHostTask", "vs/workbench/api/node/extHostTask", "vs/workbench/api/node/extHostDebugService", "vs/workbench/api/common/extHostDebugService", "vs/workbench/api/common/extHostSearch", "vs/workbench/api/node/extHostSearch", "vs/workbench/api/node/extHostStoragePaths", "vs/workbench/api/common/extHostStoragePaths", "vs/workbench/api/common/extHostExtensionService", "vs/workbench/api/node/extHostExtensionService", "vs/workbench/api/common/extHostStorage", "vs/platform/log/common/log", "vs/workbench/api/node/extHostLogService"], function (require, exports, extensions_1, extHostOutput_1, extHostOutputService_1, extHostWorkspace_1, extHostDecorations_1, extHostConfiguration_1, extHostCommands_1, extHostDocumentsAndEditors_1, extHostTerminalService_1, extHostTerminalService_2, extHostTask_1, extHostTask_2, extHostDebugService_1, extHostDebugService_2, extHostSearch_1, extHostSearch_2, extHostStoragePaths_1, extHostStoragePaths_2, extHostExtensionService_1, extHostExtensionService_2, extHostStorage_1, log_1, extHostLogService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // register singleton services
    extensions_1.registerSingleton(log_1.ILogService, extHostLogService_1.ExtHostLogService);
    extensions_1.registerSingleton(extHostOutput_1.IExtHostOutputService, extHostOutputService_1.ExtHostOutputService2);
    extensions_1.registerSingleton(extHostWorkspace_1.IExtHostWorkspace, extHostWorkspace_1.ExtHostWorkspace);
    extensions_1.registerSingleton(extHostDecorations_1.IExtHostDecorations, extHostDecorations_1.ExtHostDecorations);
    extensions_1.registerSingleton(extHostConfiguration_1.IExtHostConfiguration, extHostConfiguration_1.ExtHostConfiguration);
    extensions_1.registerSingleton(extHostCommands_1.IExtHostCommands, extHostCommands_1.ExtHostCommands);
    extensions_1.registerSingleton(extHostDocumentsAndEditors_1.IExtHostDocumentsAndEditors, extHostDocumentsAndEditors_1.ExtHostDocumentsAndEditors);
    extensions_1.registerSingleton(extHostTerminalService_2.IExtHostTerminalService, extHostTerminalService_1.ExtHostTerminalService);
    extensions_1.registerSingleton(extHostTask_1.IExtHostTask, extHostTask_2.ExtHostTask);
    extensions_1.registerSingleton(extHostDebugService_2.IExtHostDebugService, extHostDebugService_1.ExtHostDebugService);
    extensions_1.registerSingleton(extHostSearch_1.IExtHostSearch, extHostSearch_2.ExtHostSearch);
    extensions_1.registerSingleton(extHostStoragePaths_2.IExtensionStoragePaths, extHostStoragePaths_1.ExtensionStoragePaths);
    extensions_1.registerSingleton(extHostExtensionService_1.IExtHostExtensionService, extHostExtensionService_2.ExtHostExtensionService);
    extensions_1.registerSingleton(extHostStorage_1.IExtHostStorage, extHostStorage_1.ExtHostStorage);
});
//# sourceMappingURL=extHost.services.js.map