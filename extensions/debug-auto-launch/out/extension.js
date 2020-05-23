"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const nls = require("vscode-nls");
const net_1 = require("net");
const localize = nls.loadMessageBundle();
const ON_TEXT = localize('status.text.auto.attach.on', 'Auto Attach: On');
const OFF_TEXT = localize('status.text.auto.attach.off', 'Auto Attach: Off');
const TOGGLE_COMMAND = 'extension.node-debug.toggleAutoAttach';
const JS_DEBUG_SETTINGS = 'debug.javascript';
const JS_DEBUG_USEPREVIEW = 'usePreview';
const JS_DEBUG_IPC_KEY = 'jsDebugIpcState';
const NODE_DEBUG_SETTINGS = 'debug.node';
const NODE_DEBUG_USEV3 = 'useV3';
const AUTO_ATTACH_SETTING = 'autoAttach';
// on activation this feature is always disabled...
let currentState = Promise.resolve({ state: 0 /* Disabled */, transitionData: null });
let statusItem; // and there is no status bar item
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand(TOGGLE_COMMAND, toggleAutoAttachSetting));
    // settings that can result in the "state" being changed--on/off/disable or useV3 toggles
    const effectualConfigurationSettings = [
        `${NODE_DEBUG_SETTINGS}.${AUTO_ATTACH_SETTING}`,
        `${NODE_DEBUG_SETTINGS}.${NODE_DEBUG_USEV3}`,
        `${JS_DEBUG_SETTINGS}.${JS_DEBUG_USEPREVIEW}`,
    ];
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e) => {
        if (effectualConfigurationSettings.some(setting => e.affectsConfiguration(setting))) {
            updateAutoAttach(context);
        }
    }));
    updateAutoAttach(context);
}
exports.activate = activate;
async function deactivate() {
    var _a, _b;
    const { state, transitionData } = await currentState;
    await ((_b = (_a = transitions[state]).exit) === null || _b === void 0 ? void 0 : _b.call(_a, transitionData));
}
exports.deactivate = deactivate;
function toggleAutoAttachSetting() {
    const conf = vscode.workspace.getConfiguration(NODE_DEBUG_SETTINGS);
    if (conf) {
        let value = conf.get(AUTO_ATTACH_SETTING);
        if (value === 'on') {
            value = 'off';
        }
        else {
            value = 'on';
        }
        const info = conf.inspect(AUTO_ATTACH_SETTING);
        let target = vscode.ConfigurationTarget.Global;
        if (info) {
            if (info.workspaceFolderValue) {
                target = vscode.ConfigurationTarget.WorkspaceFolder;
            }
            else if (info.workspaceValue) {
                target = vscode.ConfigurationTarget.Workspace;
            }
            else if (info.globalValue) {
                target = vscode.ConfigurationTarget.Global;
            }
            else if (info.defaultValue) {
                // setting not yet used: store setting in workspace
                if (vscode.workspace.workspaceFolders) {
                    target = vscode.ConfigurationTarget.Workspace;
                }
            }
        }
        conf.update(AUTO_ATTACH_SETTING, value, target);
    }
}
function readCurrentState() {
    const nodeConfig = vscode.workspace.getConfiguration(NODE_DEBUG_SETTINGS);
    const autoAttachState = nodeConfig.get(AUTO_ATTACH_SETTING);
    switch (autoAttachState) {
        case 'off':
            return 1 /* Off */;
        case 'on':
            const jsDebugConfig = vscode.workspace.getConfiguration(JS_DEBUG_SETTINGS);
            const useV3 = nodeConfig.get(NODE_DEBUG_USEV3) || jsDebugConfig.get(JS_DEBUG_USEPREVIEW);
            return useV3 ? 2 /* OnWithJsDebug */ : 3 /* OnWithNodeDebug */;
        case 'disabled':
        default:
            return 0 /* Disabled */;
    }
}
/**
 * Makes sure the status bar exists and is visible.
 */
function ensureStatusBarExists(context) {
    if (!statusItem) {
        statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        statusItem.command = TOGGLE_COMMAND;
        statusItem.tooltip = localize('status.tooltip.auto.attach', 'Automatically attach to node.js processes in debug mode');
        statusItem.show();
        context.subscriptions.push(statusItem);
    }
    else {
        statusItem.show();
    }
    return statusItem;
}
/**
 * Map of logic that happens when auto attach states are entered and exited.
 * All state transitions are queued and run in order; promises are awaited.
 */
const transitions = {
    [0 /* Disabled */]: {
        async enter(context) {
            statusItem === null || statusItem === void 0 ? void 0 : statusItem.hide();
            // If there was js-debug state set, clear it and clear any environment variables
            if (context.workspaceState.get(JS_DEBUG_IPC_KEY)) {
                await context.workspaceState.update(JS_DEBUG_IPC_KEY, undefined);
                await vscode.commands.executeCommand('extension.js-debug.clearAutoAttachVariables');
            }
        },
    },
    [1 /* Off */]: {
        enter(context) {
            const statusItem = ensureStatusBarExists(context);
            statusItem.text = OFF_TEXT;
        },
    },
    [3 /* OnWithNodeDebug */]: {
        async enter(context) {
            const statusItem = ensureStatusBarExists(context);
            const vscode_pid = process.env['VSCODE_PID'];
            const rootPid = vscode_pid ? parseInt(vscode_pid) : 0;
            await vscode.commands.executeCommand('extension.node-debug.startAutoAttach', rootPid);
            statusItem.text = ON_TEXT;
        },
        async exit() {
            await vscode.commands.executeCommand('extension.node-debug.stopAutoAttach');
        },
    },
    [2 /* OnWithJsDebug */]: {
        async enter(context) {
            const ipcAddress = await getIpcAddress(context);
            const server = await new Promise((resolve, reject) => {
                const s = net_1.createServer((socket) => {
                    let data = [];
                    socket.on('data', (chunk) => data.push(chunk));
                    socket.on('end', () => vscode.commands.executeCommand('extension.js-debug.autoAttachToProcess', JSON.parse(Buffer.concat(data).toString())));
                })
                    .on('error', reject)
                    .listen(ipcAddress, () => resolve(s));
            });
            const statusItem = ensureStatusBarExists(context);
            statusItem.text = ON_TEXT;
            return server;
        },
        async exit(server) {
            // we don't need to clear the environment variables--the bootloader will
            // no-op if the debug server is closed. This prevents having to reload
            // terminals if users want to turn it back on.
            await new Promise((resolve) => server.close(resolve));
        },
    },
};
/**
 * Updates the auto attach feature based on the user or workspace setting
 */
function updateAutoAttach(context) {
    const newState = readCurrentState();
    currentState = currentState.then(async ({ state: oldState, transitionData }) => {
        var _a, _b, _c, _d;
        if (newState === oldState) {
            return { state: oldState, transitionData };
        }
        await ((_b = (_a = transitions[oldState]).exit) === null || _b === void 0 ? void 0 : _b.call(_a, transitionData));
        const newData = await ((_d = (_c = transitions[newState]).enter) === null || _d === void 0 ? void 0 : _d.call(_c, context));
        return { state: newState, transitionData: newData };
    });
}
/**
 * Gets the IPC address for the server to listen on for js-debug sessions. This
 * is cached such that we can reuse the address of previous activations.
 */
async function getIpcAddress(context) {
    var _a, _b;
    // Iff the `cachedData` is present, the js-debug registered environment
    // variables for this workspace--cachedData is set after successfully
    // invoking the attachment command.
    const cachedIpc = context.workspaceState.get(JS_DEBUG_IPC_KEY);
    // We invalidate the IPC data if the js-debug path changes, since that
    // indicates the extension was updated or reinstalled and the
    // environment variables will have been lost.
    // todo: make a way in the API to read environment data directly without activating js-debug?
    const jsDebugPath = ((_a = vscode.extensions.getExtension('ms-vscode.js-debug-nightly')) === null || _a === void 0 ? void 0 : _a.extensionPath) || ((_b = vscode.extensions.getExtension('ms-vscode.js-debug')) === null || _b === void 0 ? void 0 : _b.extensionPath);
    if (cachedIpc && cachedIpc.jsDebugPath === jsDebugPath) {
        return cachedIpc.ipcAddress;
    }
    const result = await vscode.commands.executeCommand('extension.js-debug.setAutoAttachVariables');
    const ipcAddress = result.ipcAddress;
    await context.workspaceState.update(JS_DEBUG_IPC_KEY, { ipcAddress, jsDebugPath });
    return ipcAddress;
}
//# sourceMappingURL=extension.js.map