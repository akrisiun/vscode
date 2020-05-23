"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const jsonc_parser_1 = require("jsonc-parser");
const vscode = require("vscode");
const nls = require("vscode-nls");
const settingsDocumentHelper_1 = require("./settingsDocumentHelper");
const extensionsProposals_1 = require("./extensionsProposals");
const localize = nls.loadMessageBundle();
function activate(context) {
    //settings.json suggestions
    context.subscriptions.push(registerSettingsCompletions());
    //extensions suggestions
    context.subscriptions.push(...registerExtensionsCompletions());
    // launch.json variable suggestions
    context.subscriptions.push(registerVariableCompletions('**/launch.json'));
    // task.json variable suggestions
    context.subscriptions.push(registerVariableCompletions('**/tasks.json'));
}
exports.activate = activate;
function registerSettingsCompletions() {
    return vscode.languages.registerCompletionItemProvider({ language: 'jsonc', pattern: '**/settings.json' }, {
        provideCompletionItems(document, position, token) {
            return new settingsDocumentHelper_1.SettingsDocument(document).provideCompletionItems(position, token);
        }
    });
}
function registerVariableCompletions(pattern) {
    return vscode.languages.registerCompletionItemProvider({ language: 'jsonc', pattern }, {
        provideCompletionItems(document, position, _token) {
            const location = jsonc_parser_1.getLocation(document.getText(), document.offsetAt(position));
            if (!location.isAtPropertyKey && location.previousNode && location.previousNode.type === 'string') {
                const indexOf$ = document.lineAt(position.line).text.indexOf('$');
                const startPosition = indexOf$ >= 0 ? new vscode.Position(position.line, indexOf$) : position;
                return [
                    { label: 'workspaceFolder', detail: localize('workspaceFolder', "The path of the folder opened in VS Code") },
                    { label: 'workspaceFolderBasename', detail: localize('workspaceFolderBasename', "The name of the folder opened in VS Code without any slashes (/)") },
                    { label: 'relativeFile', detail: localize('relativeFile', "The current opened file relative to ${workspaceFolder}") },
                    { label: 'relativeFileDirname', detail: localize('relativeFileDirname', "The current opened file's dirname relative to ${workspaceFolder}") },
                    { label: 'file', detail: localize('file', "The current opened file") },
                    { label: 'cwd', detail: localize('cwd', "The task runner's current working directory on startup") },
                    { label: 'lineNumber', detail: localize('lineNumber', "The current selected line number in the active file") },
                    { label: 'selectedText', detail: localize('selectedText', "The current selected text in the active file") },
                    { label: 'fileDirname', detail: localize('fileDirname', "The current opened file's dirname") },
                    { label: 'fileExtname', detail: localize('fileExtname', "The current opened file's extension") },
                    { label: 'fileBasename', detail: localize('fileBasename', "The current opened file's basename") },
                    { label: 'fileBasenameNoExtension', detail: localize('fileBasenameNoExtension', "The current opened file's basename with no file extension") },
                    { label: 'defaultBuildTask', detail: localize('defaultBuildTask', "The name of the default build task. If there is not a single default build task then a quick pick is shown to choose the build task.") },
                ].map(variable => ({
                    label: '${' + variable.label + '}',
                    range: new vscode.Range(startPosition, position),
                    detail: variable.detail
                }));
            }
            return [];
        }
    });
}
function registerExtensionsCompletions() {
    return [registerExtensionsCompletionsInExtensionsDocument(), registerExtensionsCompletionsInWorkspaceConfigurationDocument()];
}
function registerExtensionsCompletionsInExtensionsDocument() {
    return vscode.languages.registerCompletionItemProvider({ pattern: '**/extensions.json' }, {
        provideCompletionItems(document, position, _token) {
            const location = jsonc_parser_1.getLocation(document.getText(), document.offsetAt(position));
            const range = document.getWordRangeAtPosition(position) || new vscode.Range(position, position);
            if (location.path[0] === 'recommendations') {
                const extensionsContent = jsonc_parser_1.parse(document.getText());
                return extensionsProposals_1.provideInstalledExtensionProposals(extensionsContent && extensionsContent.recommendations || [], range, false);
            }
            return [];
        }
    });
}
function registerExtensionsCompletionsInWorkspaceConfigurationDocument() {
    return vscode.languages.registerCompletionItemProvider({ pattern: '**/*.code-workspace' }, {
        provideCompletionItems(document, position, _token) {
            const location = jsonc_parser_1.getLocation(document.getText(), document.offsetAt(position));
            const range = document.getWordRangeAtPosition(position) || new vscode.Range(position, position);
            if (location.path[0] === 'extensions' && location.path[1] === 'recommendations') {
                const extensionsContent = jsonc_parser_1.parse(document.getText())['extensions'];
                return extensionsProposals_1.provideInstalledExtensionProposals(extensionsContent && extensionsContent.recommendations || [], range, false);
            }
            return [];
        }
    });
}
vscode.languages.registerDocumentSymbolProvider({ pattern: '**/launch.json', language: 'jsonc' }, {
    provideDocumentSymbols(document, _token) {
        const result = [];
        let name = '';
        let lastProperty = '';
        let startOffset = 0;
        let depthInObjects = 0;
        jsonc_parser_1.visit(document.getText(), {
            onObjectProperty: (property, _offset, _length) => {
                lastProperty = property;
            },
            onLiteralValue: (value, _offset, _length) => {
                if (lastProperty === 'name') {
                    name = value;
                }
            },
            onObjectBegin: (offset, _length) => {
                depthInObjects++;
                if (depthInObjects === 2) {
                    startOffset = offset;
                }
            },
            onObjectEnd: (offset, _length) => {
                if (name && depthInObjects === 2) {
                    result.push(new vscode.SymbolInformation(name, vscode.SymbolKind.Object, new vscode.Range(document.positionAt(startOffset), document.positionAt(offset))));
                }
                depthInObjects--;
            },
        });
        return result;
    }
}, { label: 'Launch Targets' });
//# sourceMappingURL=extension.js.map