/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configuration", "vs/base/common/path", "vs/base/common/uri", "vs/workbench/contrib/externalTerminal/common/externalTerminal", "vs/platform/actions/common/actions", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/services/history/common/history", "vs/workbench/common/resources", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/files/common/files", "vs/platform/list/browser/listService", "vs/workbench/contrib/files/browser/files", "vs/platform/commands/common/commands", "vs/base/common/network", "vs/base/common/arrays", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/instantiation/common/instantiation"], function (require, exports, nls, configuration_1, paths, uri_1, externalTerminal_1, actions_1, terminal_1, terminal_2, history_1, resources_1, keybindingsRegistry_1, files_1, listService_1, files_2, commands_1, network_1, arrays_1, editorService_1, remoteAgentService_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const OPEN_IN_TERMINAL_COMMAND_ID = 'openInTerminal';
    commands_1.CommandsRegistry.registerCommand({
        id: OPEN_IN_TERMINAL_COMMAND_ID,
        handler: (accessor, resource) => {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const fileService = accessor.get(files_1.IFileService);
            const terminalService = accessor.get(externalTerminal_1.IExternalTerminalService, instantiation_1.optional);
            const integratedTerminalService = accessor.get(terminal_2.ITerminalService);
            const remoteAgentService = accessor.get(remoteAgentService_1.IRemoteAgentService);
            const resources = files_2.getMultiSelectedResources(resource, accessor.get(listService_1.IListService), editorService);
            return fileService.resolveAll(resources.map(r => ({ resource: r }))).then(async (stats) => {
                const targets = arrays_1.distinct(stats.filter(data => data.success));
                // Always use integrated terminal when using a remote
                const useIntegratedTerminal = remoteAgentService.getConnection() || configurationService.getValue().terminal.explorerKind === 'integrated';
                if (useIntegratedTerminal) {
                    // TODO: Use uri for cwd in createterminal
                    const opened = {};
                    targets.map(({ stat }) => {
                        const resource = stat.resource;
                        if (stat.isDirectory) {
                            return resource;
                        }
                        return uri_1.URI.from({
                            scheme: resource.scheme,
                            authority: resource.authority,
                            fragment: resource.fragment,
                            query: resource.query,
                            path: paths.dirname(resource.path)
                        });
                    }).forEach(cwd => {
                        if (opened[cwd.path]) {
                            return;
                        }
                        opened[cwd.path] = true;
                        const instance = integratedTerminalService.createTerminal({ cwd });
                        if (instance && (resources.length === 1 || !resource || cwd.path === resource.path || cwd.path === paths.dirname(resource.path))) {
                            integratedTerminalService.setActiveInstance(instance);
                            integratedTerminalService.showPanel(true);
                        }
                    });
                }
                else {
                    arrays_1.distinct(targets.map(({ stat }) => stat.isDirectory ? stat.resource.fsPath : paths.dirname(stat.resource.fsPath))).forEach(cwd => {
                        terminalService.openTerminal(cwd);
                    });
                }
            });
        }
    });
    const OPEN_NATIVE_CONSOLE_COMMAND_ID = 'workbench.action.terminal.openNativeConsole';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: OPEN_NATIVE_CONSOLE_COMMAND_ID,
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 33 /* KEY_C */,
        when: terminal_1.KEYBINDING_CONTEXT_TERMINAL_NOT_FOCUSED,
        weight: 200 /* WorkbenchContrib */,
        handler: (accessor) => {
            const remoteAgentService = accessor.get(remoteAgentService_1.IRemoteAgentService);
            const historyService = accessor.get(history_1.IHistoryService);
            // Open integrated terminal in remote workspaces
            if (remoteAgentService.getConnection()) {
                const integratedTerminalService = accessor.get(terminal_2.ITerminalService);
                const root = historyService.getLastActiveWorkspaceRoot(network_1.Schemas.vscodeRemote);
                let cwd;
                if (root) {
                    cwd = root.path;
                }
                else {
                    const activeFile = historyService.getLastActiveFile(network_1.Schemas.vscodeRemote);
                    if (activeFile) {
                        cwd = paths.dirname(activeFile.path);
                    }
                }
                if (cwd) {
                    const instance = integratedTerminalService.createTerminal({ cwd });
                    integratedTerminalService.setActiveInstance(instance);
                    integratedTerminalService.showPanel(true);
                }
                return;
            }
            // Open external terminal in local workspaces
            const terminalService = accessor.get(externalTerminal_1.IExternalTerminalService);
            const root = historyService.getLastActiveWorkspaceRoot(network_1.Schemas.file);
            if (root) {
                terminalService.openTerminal(root.fsPath);
            }
            else {
                // Opens current file's folder, if no folder is open in editor
                const activeFile = historyService.getLastActiveFile(network_1.Schemas.file);
                if (activeFile) {
                    terminalService.openTerminal(paths.dirname(activeFile.fsPath));
                }
            }
        }
    });
    actions_1.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
        command: {
            id: OPEN_NATIVE_CONSOLE_COMMAND_ID,
            title: { value: nls.localize('globalConsoleAction', "Open New External Terminal"), original: 'Open New External Terminal' }
        }
    });
    const openConsoleCommand = {
        id: OPEN_IN_TERMINAL_COMMAND_ID,
        title: nls.localize('scopedConsoleAction', "Open in Terminal")
    };
    actions_1.MenuRegistry.appendMenuItem(27 /* OpenEditorsContext */, {
        group: 'navigation',
        order: 30,
        command: openConsoleCommand,
        when: resources_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.file)
    });
    actions_1.MenuRegistry.appendMenuItem(27 /* OpenEditorsContext */, {
        group: 'navigation',
        order: 30,
        command: openConsoleCommand,
        when: resources_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.vscodeRemote)
    });
    actions_1.MenuRegistry.appendMenuItem(11 /* ExplorerContext */, {
        group: 'navigation',
        order: 30,
        command: openConsoleCommand,
        when: resources_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.file)
    });
    actions_1.MenuRegistry.appendMenuItem(11 /* ExplorerContext */, {
        group: 'navigation',
        order: 30,
        command: openConsoleCommand,
        when: resources_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.vscodeRemote)
    });
});
//# sourceMappingURL=externalTerminal.contribution.js.map