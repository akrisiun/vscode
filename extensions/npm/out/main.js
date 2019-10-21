"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const httpRequest = require("request-light");
const vscode = require("vscode");
const jsonContributions_1 = require("./features/jsonContributions");
const commands_1 = require("./commands");
const npmView_1 = require("./npmView");
const tasks_1 = require("./tasks");
const scriptHover_1 = require("./scriptHover");
let treeDataProvider;
async function activate(context) {
    registerTaskProvider(context);
    treeDataProvider = registerExplorer(context);
    registerHoverProvider(context);
    configureHttpRequest();
    let d = vscode.workspace.onDidChangeConfiguration((e) => {
        configureHttpRequest();
        if (e.affectsConfiguration('npm.exclude')) {
            tasks_1.invalidateTasksCache();
            if (treeDataProvider) {
                treeDataProvider.refresh();
            }
        }
        if (e.affectsConfiguration('npm.scriptExplorerAction')) {
            if (treeDataProvider) {
                treeDataProvider.refresh();
            }
        }
    });
    context.subscriptions.push(d);
    d = vscode.workspace.onDidChangeTextDocument((e) => {
        scriptHover_1.invalidateHoverScriptsCache(e.document);
    });
    context.subscriptions.push(d);
    context.subscriptions.push(vscode.commands.registerCommand('npm.runSelectedScript', commands_1.runSelectedScript));
    context.subscriptions.push(jsonContributions_1.addJSONProviders(httpRequest.xhr));
    if (await tasks_1.hasPackageJson()) {
        vscode.commands.executeCommand('setContext', 'npm:showScriptExplorer', true);
    }
    context.subscriptions.push(vscode.commands.registerCommand('npm.runScriptFromFolder', commands_1.selectAndRunScriptFromFolder));
}
exports.activate = activate;
function registerTaskProvider(context) {
    function invalidateScriptCaches() {
        scriptHover_1.invalidateHoverScriptsCache();
        tasks_1.invalidateTasksCache();
        if (treeDataProvider) {
            treeDataProvider.refresh();
        }
    }
    if (vscode.workspace.workspaceFolders) {
        let watcher = vscode.workspace.createFileSystemWatcher('**/package.json');
        watcher.onDidChange((_e) => invalidateScriptCaches());
        watcher.onDidDelete((_e) => invalidateScriptCaches());
        watcher.onDidCreate((_e) => invalidateScriptCaches());
        context.subscriptions.push(watcher);
        let workspaceWatcher = vscode.workspace.onDidChangeWorkspaceFolders((_e) => invalidateScriptCaches());
        context.subscriptions.push(workspaceWatcher);
        let provider = new tasks_1.NpmTaskProvider();
        let disposable = vscode.workspace.registerTaskProvider('npm', provider);
        context.subscriptions.push(disposable);
        return disposable;
    }
    return undefined;
}
function registerExplorer(context) {
    if (vscode.workspace.workspaceFolders) {
        let treeDataProvider = new npmView_1.NpmScriptsTreeDataProvider(context);
        const view = vscode.window.createTreeView('npm', { treeDataProvider: treeDataProvider, showCollapseAll: true });
        context.subscriptions.push(view);
        return treeDataProvider;
    }
    return undefined;
}
function registerHoverProvider(context) {
    if (vscode.workspace.workspaceFolders) {
        let npmSelector = {
            language: 'json',
            scheme: 'file',
            pattern: '**/package.json'
        };
        let provider = new scriptHover_1.NpmScriptHoverProvider(context);
        context.subscriptions.push(vscode.languages.registerHoverProvider(npmSelector, provider));
        return provider;
    }
    return undefined;
}
function configureHttpRequest() {
    const httpSettings = vscode.workspace.getConfiguration('http');
    httpRequest.configure(httpSettings.get('proxy', ''), httpSettings.get('proxyStrictSSL', true));
}
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=main.js.map