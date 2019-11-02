"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const jsonc_parser_1 = require("jsonc-parser");
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle();
class SettingsDocument {
    constructor(document) {
        this.document = document;
    }
    provideCompletionItems(position, _token) {
        const location = jsonc_parser_1.getLocation(this.document.getText(), this.document.offsetAt(position));
        const range = this.document.getWordRangeAtPosition(position) || new vscode.Range(position, position);
        // window.title
        if (location.path[0] === 'window.title') {
            return this.provideWindowTitleCompletionItems(location, range);
        }
        // files.association
        if (location.path[0] === 'files.associations') {
            return this.provideFilesAssociationsCompletionItems(location, range);
        }
        // files.exclude, search.exclude
        if (location.path[0] === 'files.exclude' || location.path[0] === 'search.exclude') {
            return this.provideExcludeCompletionItems(location, range);
        }
        // files.defaultLanguage
        if (location.path[0] === 'files.defaultLanguage') {
            return this.provideLanguageCompletionItems(location, range);
        }
        return this.provideLanguageOverridesCompletionItems(location, position);
    }
    provideWindowTitleCompletionItems(_location, range) {
        const completions = [];
        completions.push(this.newSimpleCompletionItem('${activeEditorShort}', range, localize('activeEditorShort', "the file name (e.g. myFile.txt)")));
        completions.push(this.newSimpleCompletionItem('${activeEditorMedium}', range, localize('activeEditorMedium', "the path of the file relative to the workspace folder (e.g. myFolder/myFileFolder/myFile.txt)")));
        completions.push(this.newSimpleCompletionItem('${activeEditorLong}', range, localize('activeEditorLong', "the full path of the file (e.g. /Users/Development/myFolder/myFileFolder/myFile.txt)")));
        completions.push(this.newSimpleCompletionItem('${activeFolderShort}', range, localize('activeFolderShort', "the name of the folder the file is contained in (e.g. myFileFolder)")));
        completions.push(this.newSimpleCompletionItem('${activeFolderMedium}', range, localize('activeFolderMedium', "the path of the folder the file is contained in, relative to the workspace folder (e.g. myFolder/myFileFolder)")));
        completions.push(this.newSimpleCompletionItem('${activeFolderLong}', range, localize('activeFolderLong', "the full path of the folder the file is contained in (e.g. /Users/Development/myFolder/myFileFolder)")));
        completions.push(this.newSimpleCompletionItem('${rootName}', range, localize('rootName', "name of the workspace (e.g. myFolder or myWorkspace)")));
        completions.push(this.newSimpleCompletionItem('${rootPath}', range, localize('rootPath', "file path of the workspace (e.g. /Users/Development/myWorkspace)")));
        completions.push(this.newSimpleCompletionItem('${folderName}', range, localize('folderName', "name of the workspace folder the file is contained in (e.g. myFolder)")));
        completions.push(this.newSimpleCompletionItem('${folderPath}', range, localize('folderPath', "file path of the workspace folder the file is contained in (e.g. /Users/Development/myFolder)")));
        completions.push(this.newSimpleCompletionItem('${appName}', range, localize('appName', "e.g. VS Code")));
        completions.push(this.newSimpleCompletionItem('${remoteName}', range, localize('remoteName', "e.g. SSH")));
        completions.push(this.newSimpleCompletionItem('${dirty}', range, localize('dirty', "a dirty indicator if the active editor is dirty")));
        completions.push(this.newSimpleCompletionItem('${separator}', range, localize('separator', "a conditional separator (' - ') that only shows when surrounded by variables with values")));
        return Promise.resolve(completions);
    }
    provideFilesAssociationsCompletionItems(location, range) {
        const completions = [];
        if (location.path.length === 2) {
            // Key
            if (!location.isAtPropertyKey || location.path[1] === '') {
                completions.push(this.newSnippetCompletionItem({
                    label: localize('assocLabelFile', "Files with Extension"),
                    documentation: localize('assocDescriptionFile', "Map all files matching the glob pattern in their filename to the language with the given identifier."),
                    snippet: location.isAtPropertyKey ? '"*.${1:extension}": "${2:language}"' : '{ "*.${1:extension}": "${2:language}" }',
                    range
                }));
                completions.push(this.newSnippetCompletionItem({
                    label: localize('assocLabelPath', "Files with Path"),
                    documentation: localize('assocDescriptionPath', "Map all files matching the absolute path glob pattern in their path to the language with the given identifier."),
                    snippet: location.isAtPropertyKey ? '"/${1:path to file}/*.${2:extension}": "${3:language}"' : '{ "/${1:path to file}/*.${2:extension}": "${3:language}" }',
                    range
                }));
            }
            else {
                // Value
                return this.provideLanguageCompletionItems(location, range);
            }
        }
        return Promise.resolve(completions);
    }
    provideExcludeCompletionItems(location, range) {
        const completions = [];
        // Key
        if (location.path.length === 1) {
            completions.push(this.newSnippetCompletionItem({
                label: localize('fileLabel', "Files by Extension"),
                documentation: localize('fileDescription', "Match all files of a specific file extension."),
                snippet: location.isAtPropertyKey ? '"**/*.${1:extension}": true' : '{ "**/*.${1:extension}": true }',
                range
            }));
            completions.push(this.newSnippetCompletionItem({
                label: localize('filesLabel', "Files with Multiple Extensions"),
                documentation: localize('filesDescription', "Match all files with any of the file extensions."),
                snippet: location.isAtPropertyKey ? '"**/*.{ext1,ext2,ext3}": true' : '{ "**/*.{ext1,ext2,ext3}": true }',
                range
            }));
            completions.push(this.newSnippetCompletionItem({
                label: localize('derivedLabel', "Files with Siblings by Name"),
                documentation: localize('derivedDescription', "Match files that have siblings with the same name but a different extension."),
                snippet: location.isAtPropertyKey ? '"**/*.${1:source-extension}": { "when": "$(basename).${2:target-extension}" }' : '{ "**/*.${1:source-extension}": { "when": "$(basename).${2:target-extension}" } }',
                range
            }));
            completions.push(this.newSnippetCompletionItem({
                label: localize('topFolderLabel', "Folder by Name (Top Level)"),
                documentation: localize('topFolderDescription', "Match a top level folder with a specific name."),
                snippet: location.isAtPropertyKey ? '"${1:name}": true' : '{ "${1:name}": true }',
                range
            }));
            completions.push(this.newSnippetCompletionItem({
                label: localize('topFoldersLabel', "Folders with Multiple Names (Top Level)"),
                documentation: localize('topFoldersDescription', "Match multiple top level folders."),
                snippet: location.isAtPropertyKey ? '"{folder1,folder2,folder3}": true' : '{ "{folder1,folder2,folder3}": true }',
                range
            }));
            completions.push(this.newSnippetCompletionItem({
                label: localize('folderLabel', "Folder by Name (Any Location)"),
                documentation: localize('folderDescription', "Match a folder with a specific name in any location."),
                snippet: location.isAtPropertyKey ? '"**/${1:name}": true' : '{ "**/${1:name}": true }',
                range
            }));
        }
        // Value
        else {
            completions.push(this.newSimpleCompletionItem('false', range, localize('falseDescription', "Disable the pattern.")));
            completions.push(this.newSimpleCompletionItem('true', range, localize('trueDescription', "Enable the pattern.")));
            completions.push(this.newSnippetCompletionItem({
                label: localize('derivedLabel', "Files with Siblings by Name"),
                documentation: localize('siblingsDescription', "Match files that have siblings with the same name but a different extension."),
                snippet: '{ "when": "$(basename).${1:extension}" }',
                range
            }));
        }
        return Promise.resolve(completions);
    }
    provideLanguageCompletionItems(_location, range, formatFunc = (l) => JSON.stringify(l)) {
        return vscode.languages.getLanguages().then(languages => {
            const completionItems = [];
            const configuration = vscode.workspace.getConfiguration();
            for (const language of languages) {
                const inspect = configuration.inspect(`[${language}]`);
                if (!inspect || !inspect.defaultValue) {
                    const item = new vscode.CompletionItem(formatFunc(language));
                    item.kind = vscode.CompletionItemKind.Property;
                    item.range = range;
                    completionItems.push(item);
                }
            }
            return completionItems;
        });
    }
    provideLanguageOverridesCompletionItems(location, position) {
        if (location.path.length === 0) {
            let range = this.document.getWordRangeAtPosition(position, /^\s*\[.*]?/) || new vscode.Range(position, position);
            let text = this.document.getText(range);
            if (text && text.trim().startsWith('[')) {
                range = new vscode.Range(new vscode.Position(range.start.line, range.start.character + text.indexOf('[')), range.end);
                return this.provideLanguageCompletionItems(location, range, language => `"[${language}]"`);
            }
            range = this.document.getWordRangeAtPosition(position) || new vscode.Range(position, position);
            text = this.document.getText(range);
            let snippet = '"[${1:language}]": {\n\t"$0"\n}';
            // Suggestion model word matching includes quotes,
            // hence exclude the starting quote from the snippet and the range
            // ending quote gets replaced
            if (text && text.startsWith('"')) {
                range = new vscode.Range(new vscode.Position(range.start.line, range.start.character + 1), range.end);
                snippet = snippet.substring(1);
            }
            return Promise.resolve([this.newSnippetCompletionItem({
                    label: localize('languageSpecificEditorSettings', "Language specific editor settings"),
                    documentation: localize('languageSpecificEditorSettingsDescription', "Override editor settings for language"),
                    snippet,
                    range
                })]);
        }
        if (location.path.length === 1 && location.previousNode && typeof location.previousNode.value === 'string' && location.previousNode.value.startsWith('[')) {
            // Suggestion model word matching includes closed sqaure bracket and ending quote
            // Hence include them in the proposal to replace
            let range = this.document.getWordRangeAtPosition(position) || new vscode.Range(position, position);
            return this.provideLanguageCompletionItems(location, range, language => `"[${language}]"`);
        }
        return Promise.resolve([]);
    }
    newSimpleCompletionItem(text, range, description, insertText) {
        const item = new vscode.CompletionItem(text);
        item.kind = vscode.CompletionItemKind.Value;
        item.detail = description;
        item.insertText = insertText ? insertText : text;
        item.range = range;
        return item;
    }
    newSnippetCompletionItem(o) {
        const item = new vscode.CompletionItem(o.label);
        item.kind = vscode.CompletionItemKind.Value;
        item.documentation = o.documentation;
        item.insertText = new vscode.SnippetString(o.snippet);
        item.range = o.range;
        return item;
    }
}
exports.SettingsDocument = SettingsDocument;
//# sourceMappingURL=settingsDocumentHelper.js.map