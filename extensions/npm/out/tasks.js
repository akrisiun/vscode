"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const path = require("path");
const fs = require("fs");
const minimatch = require("minimatch");
const nls = require("vscode-nls");
const jsonc_parser_1 = require("jsonc-parser");
const localize = nls.loadMessageBundle();
let cachedTasks = undefined;
class NpmTaskProvider {
    constructor() {
    }
    provideTasks() {
        return provideNpmScripts();
    }
    resolveTask(_task) {
        const npmTask = _task.definition.script;
        if (npmTask) {
            const kind = _task.definition;
            let packageJsonUri;
            if (_task.scope === undefined || _task.scope === vscode_1.TaskScope.Global || _task.scope === vscode_1.TaskScope.Workspace) {
                // scope is required to be a WorkspaceFolder for resolveTask
                return undefined;
            }
            if (kind.path) {
                packageJsonUri = _task.scope.uri.with({ path: _task.scope.uri.path + '/' + kind.path + 'package.json' });
            }
            else {
                packageJsonUri = _task.scope.uri.with({ path: _task.scope.uri.path + '/package.json' });
            }
            return createTask(kind, `run ${kind.script}`, _task.scope, packageJsonUri);
        }
        return undefined;
    }
}
exports.NpmTaskProvider = NpmTaskProvider;
function invalidateTasksCache() {
    cachedTasks = undefined;
}
exports.invalidateTasksCache = invalidateTasksCache;
const buildNames = ['build', 'compile', 'watch'];
function isBuildTask(name) {
    for (let buildName of buildNames) {
        if (name.indexOf(buildName) !== -1) {
            return true;
        }
    }
    return false;
}
const testNames = ['test'];
function isTestTask(name) {
    for (let testName of testNames) {
        if (name === testName) {
            return true;
        }
    }
    return false;
}
function getPrePostScripts(scripts) {
    const prePostScripts = new Set([
        'preuninstall', 'postuninstall', 'prepack', 'postpack', 'preinstall', 'postinstall',
        'prepack', 'postpack', 'prepublish', 'postpublish', 'preversion', 'postversion',
        'prestop', 'poststop', 'prerestart', 'postrestart', 'preshrinkwrap', 'postshrinkwrap',
        'pretest', 'postest', 'prepublishOnly'
    ]);
    let keys = Object.keys(scripts);
    for (const script of keys) {
        const prepost = ['pre' + script, 'post' + script];
        prepost.forEach(each => {
            if (scripts[each] !== undefined) {
                prePostScripts.add(each);
            }
        });
    }
    return prePostScripts;
}
function isWorkspaceFolder(value) {
    return value && typeof value !== 'number';
}
exports.isWorkspaceFolder = isWorkspaceFolder;
function getPackageManager(folder) {
    return vscode_1.workspace.getConfiguration('npm', folder.uri).get('packageManager', 'npm');
}
exports.getPackageManager = getPackageManager;
async function hasNpmScripts() {
    let folders = vscode_1.workspace.workspaceFolders;
    if (!folders) {
        return false;
    }
    try {
        for (const folder of folders) {
            if (isAutoDetectionEnabled(folder)) {
                let relativePattern = new vscode_1.RelativePattern(folder, '**/package.json');
                let paths = await vscode_1.workspace.findFiles(relativePattern, '**/node_modules/**');
                if (paths.length > 0) {
                    return true;
                }
            }
        }
        return false;
    }
    catch (error) {
        return Promise.reject(error);
    }
}
exports.hasNpmScripts = hasNpmScripts;
async function detectNpmScripts() {
    let emptyTasks = [];
    let allTasks = [];
    let visitedPackageJsonFiles = new Set();
    let folders = vscode_1.workspace.workspaceFolders;
    if (!folders) {
        return emptyTasks;
    }
    try {
        for (const folder of folders) {
            if (isAutoDetectionEnabled(folder)) {
                let relativePattern = new vscode_1.RelativePattern(folder, '**/package.json');
                let paths = await vscode_1.workspace.findFiles(relativePattern, '**/node_modules/**');
                for (const path of paths) {
                    if (!isExcluded(folder, path) && !visitedPackageJsonFiles.has(path.fsPath)) {
                        let tasks = await provideNpmScriptsForFolder(path);
                        visitedPackageJsonFiles.add(path.fsPath);
                        allTasks.push(...tasks);
                    }
                }
            }
        }
        return allTasks;
    }
    catch (error) {
        return Promise.reject(error);
    }
}
async function provideNpmScripts() {
    if (!cachedTasks) {
        cachedTasks = await detectNpmScripts();
    }
    return cachedTasks;
}
exports.provideNpmScripts = provideNpmScripts;
function isAutoDetectionEnabled(folder) {
    return vscode_1.workspace.getConfiguration('npm', folder.uri).get('autoDetect') === 'on';
}
function isExcluded(folder, packageJsonUri) {
    function testForExclusionPattern(path, pattern) {
        return minimatch(path, pattern, { dot: true });
    }
    let exclude = vscode_1.workspace.getConfiguration('npm', folder.uri).get('exclude');
    let packageJsonFolder = path.dirname(packageJsonUri.fsPath);
    if (exclude) {
        if (Array.isArray(exclude)) {
            for (let pattern of exclude) {
                if (testForExclusionPattern(packageJsonFolder, pattern)) {
                    return true;
                }
            }
        }
        else if (testForExclusionPattern(packageJsonFolder, exclude)) {
            return true;
        }
    }
    return false;
}
function isDebugScript(script) {
    let match = script.match(/--(inspect|debug)(-brk)?(=((\[[0-9a-fA-F:]*\]|[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|[a-zA-Z0-9\.]*):)?(\d+))?/);
    return match !== null;
}
async function provideNpmScriptsForFolder(packageJsonUri) {
    let emptyTasks = [];
    let folder = vscode_1.workspace.getWorkspaceFolder(packageJsonUri);
    if (!folder) {
        return emptyTasks;
    }
    let scripts = await getScripts(packageJsonUri);
    if (!scripts) {
        return emptyTasks;
    }
    const result = [];
    const prePostScripts = getPrePostScripts(scripts);
    Object.keys(scripts).forEach(each => {
        const task = createTask(each, `run ${each}`, folder, packageJsonUri);
        const lowerCaseTaskName = each.toLowerCase();
        if (isBuildTask(lowerCaseTaskName)) {
            task.group = vscode_1.TaskGroup.Build;
        }
        else if (isTestTask(lowerCaseTaskName)) {
            task.group = vscode_1.TaskGroup.Test;
        }
        if (prePostScripts.has(each)) {
            task.group = vscode_1.TaskGroup.Clean; // hack: use Clean group to tag pre/post scripts
        }
        if (isDebugScript(scripts[each])) {
            task.group = vscode_1.TaskGroup.Rebuild; // hack: use Rebuild group to tag debug scripts
        }
        result.push(task);
    });
    // always add npm install (without a problem matcher)
    result.push(createTask('install', 'install', folder, packageJsonUri, []));
    return result;
}
function getTaskName(script, relativePath) {
    if (relativePath && relativePath.length) {
        return `${script} - ${relativePath.substring(0, relativePath.length - 1)}`;
    }
    return script;
}
exports.getTaskName = getTaskName;
function createTask(script, cmd, folder, packageJsonUri, matcher) {
    let kind;
    if (typeof script === 'string') {
        kind = { type: 'npm', script: script };
    }
    else {
        kind = script;
    }
    function getCommandLine(folder, cmd) {
        let packageManager = getPackageManager(folder);
        if (vscode_1.workspace.getConfiguration('npm', folder.uri).get('runSilent')) {
            return `${packageManager} --silent ${cmd}`;
        }
        return `${packageManager} ${cmd}`;
    }
    function getRelativePath(folder, packageJsonUri) {
        let rootUri = folder.uri;
        let absolutePath = packageJsonUri.path.substring(0, packageJsonUri.path.length - 'package.json'.length);
        return absolutePath.substring(rootUri.path.length + 1);
    }
    let relativePackageJson = getRelativePath(folder, packageJsonUri);
    if (relativePackageJson.length) {
        kind.path = getRelativePath(folder, packageJsonUri);
    }
    let taskName = getTaskName(kind.script, relativePackageJson);
    let cwd = path.dirname(packageJsonUri.fsPath);
    return new vscode_1.Task(kind, folder, taskName, 'npm', new vscode_1.ShellExecution(getCommandLine(folder, cmd), { cwd: cwd }), matcher);
}
exports.createTask = createTask;
function getPackageJsonUriFromTask(task) {
    if (isWorkspaceFolder(task.scope)) {
        if (task.definition.path) {
            return vscode_1.Uri.file(path.join(task.scope.uri.fsPath, task.definition.path, 'package.json'));
        }
        else {
            return vscode_1.Uri.file(path.join(task.scope.uri.fsPath, 'package.json'));
        }
    }
    return null;
}
exports.getPackageJsonUriFromTask = getPackageJsonUriFromTask;
async function hasPackageJson() {
    let folders = vscode_1.workspace.workspaceFolders;
    if (!folders) {
        return false;
    }
    for (const folder of folders) {
        if (folder.uri.scheme === 'file') {
            let packageJson = path.join(folder.uri.fsPath, 'package.json');
            if (await exists(packageJson)) {
                return true;
            }
        }
    }
    return false;
}
exports.hasPackageJson = hasPackageJson;
async function exists(file) {
    return new Promise((resolve, _reject) => {
        fs.exists(file, (value) => {
            resolve(value);
        });
    });
}
async function readFile(file) {
    return new Promise((resolve, reject) => {
        fs.readFile(file, (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(data.toString());
        });
    });
}
function runScript(script, document) {
    let uri = document.uri;
    let folder = vscode_1.workspace.getWorkspaceFolder(uri);
    if (folder) {
        let task = createTask(script, `run ${script}`, folder, uri);
        vscode_1.tasks.executeTask(task);
    }
}
exports.runScript = runScript;
function extractDebugArgFromScript(scriptValue) {
    // matches --debug, --debug=1234, --debug-brk, debug-brk=1234, --inspect,
    // --inspect=1234, --inspect-brk, --inspect-brk=1234,
    // --inspect=localhost:1245, --inspect=127.0.0.1:1234, --inspect=[aa:1:0:0:0]:1234, --inspect=:1234
    let match = scriptValue.match(/--(inspect|debug)(-brk)?(=((\[[0-9a-fA-F:]*\]|[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|[a-zA-Z0-9\.]*):)?(\d+))?/);
    if (match) {
        if (match[6]) {
            return [match[1], parseInt(match[6])];
        }
        if (match[1] === 'inspect') {
            return [match[1], 9229];
        }
        if (match[1] === 'debug') {
            return [match[1], 5858];
        }
    }
    return undefined;
}
exports.extractDebugArgFromScript = extractDebugArgFromScript;
function startDebugging(scriptName, protocol, port, folder) {
    let p = 'inspector';
    if (protocol === 'debug') {
        p = 'legacy';
    }
    let packageManager = getPackageManager(folder);
    const config = {
        type: 'node',
        request: 'launch',
        name: `Debug ${scriptName}`,
        runtimeExecutable: packageManager,
        runtimeArgs: [
            'run',
            scriptName,
        ],
        port: port,
        protocol: p
    };
    if (folder) {
        vscode_1.debug.startDebugging(folder, config);
    }
}
exports.startDebugging = startDebugging;
async function findAllScripts(buffer) {
    let scripts = {};
    let script = undefined;
    let inScripts = false;
    let visitor = {
        onError(_error, _offset, _length) {
            console.log(_error);
        },
        onObjectEnd() {
            if (inScripts) {
                inScripts = false;
            }
        },
        onLiteralValue(value, _offset, _length) {
            if (script) {
                if (typeof value === 'string') {
                    scripts[script] = value;
                }
                script = undefined;
            }
        },
        onObjectProperty(property, _offset, _length) {
            if (property === 'scripts') {
                inScripts = true;
            }
            else if (inScripts && !script) {
                script = property;
            }
            else { // nested object which is invalid, ignore the script
                script = undefined;
            }
        }
    };
    jsonc_parser_1.visit(buffer, visitor);
    return scripts;
}
function findAllScriptRanges(buffer) {
    let scripts = new Map();
    let script = undefined;
    let offset;
    let length;
    let inScripts = false;
    let visitor = {
        onError(_error, _offset, _length) {
        },
        onObjectEnd() {
            if (inScripts) {
                inScripts = false;
            }
        },
        onLiteralValue(value, _offset, _length) {
            if (script) {
                scripts.set(script, [offset, length, value]);
                script = undefined;
            }
        },
        onObjectProperty(property, off, len) {
            if (property === 'scripts') {
                inScripts = true;
            }
            else if (inScripts) {
                script = property;
                offset = off;
                length = len;
            }
        }
    };
    jsonc_parser_1.visit(buffer, visitor);
    return scripts;
}
exports.findAllScriptRanges = findAllScriptRanges;
function findScriptAtPosition(buffer, offset) {
    let script = undefined;
    let foundScript = undefined;
    let inScripts = false;
    let scriptStart;
    let visitor = {
        onError(_error, _offset, _length) {
        },
        onObjectEnd() {
            if (inScripts) {
                inScripts = false;
                scriptStart = undefined;
            }
        },
        onLiteralValue(value, nodeOffset, nodeLength) {
            if (inScripts && scriptStart) {
                if (typeof value === 'string' && offset >= scriptStart && offset < nodeOffset + nodeLength) {
                    // found the script
                    inScripts = false;
                    foundScript = script;
                }
                else {
                    script = undefined;
                }
            }
        },
        onObjectProperty(property, nodeOffset) {
            if (property === 'scripts') {
                inScripts = true;
            }
            else if (inScripts) {
                scriptStart = nodeOffset;
                script = property;
            }
            else { // nested object which is invalid, ignore the script
                script = undefined;
            }
        }
    };
    jsonc_parser_1.visit(buffer, visitor);
    return foundScript;
}
exports.findScriptAtPosition = findScriptAtPosition;
async function getScripts(packageJsonUri) {
    if (packageJsonUri.scheme !== 'file') {
        return undefined;
    }
    let packageJson = packageJsonUri.fsPath;
    if (!await exists(packageJson)) {
        return undefined;
    }
    try {
        let contents = await readFile(packageJson);
        let json = findAllScripts(contents); //JSON.parse(contents);
        return json;
    }
    catch (e) {
        let localizedParseError = localize('npm.parseError', 'Npm task detection: failed to parse the file {0}', packageJsonUri.fsPath);
        throw new Error(localizedParseError);
    }
}
exports.getScripts = getScripts;
//# sourceMappingURL=tasks.js.map