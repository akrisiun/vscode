"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle();
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const htmlEmptyTagsShared_1 = require("./htmlEmptyTagsShared");
const tagClosing_1 = require("./tagClosing");
const vscode_extension_telemetry_1 = require("vscode-extension-telemetry");
const customData_1 = require("./customData");
var TagCloseRequest;
(function (TagCloseRequest) {
    TagCloseRequest.type = new vscode_languageclient_1.RequestType('html/tag');
})(TagCloseRequest || (TagCloseRequest = {}));
let telemetryReporter;
function activate(context) {
    let toDispose = context.subscriptions;
    let packageInfo = getPackageInfo(context);
    telemetryReporter = packageInfo && new vscode_extension_telemetry_1.default(packageInfo.name, packageInfo.version, packageInfo.aiKey);
    let serverMain = readJSONFile(context.asAbsolutePath('./server/package.json')).main;
    let serverModule = context.asAbsolutePath(path.join('server', serverMain));
    // The debug options for the server
    let debugOptions = { execArgv: ['--nolazy', '--inspect=6045'] };
    // If the extension is launch in debug mode the debug server options are use
    // Otherwise the run options are used
    let serverOptions = {
        run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
        debug: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc, options: debugOptions }
    };
    let documentSelector = ['html', 'handlebars'];
    let embeddedLanguages = { css: true, javascript: true };
    let rangeFormatting = undefined;
    let dataPaths = [
        ...customData_1.getCustomDataPathsInAllWorkspaces(vscode_1.workspace.workspaceFolders),
        ...customData_1.getCustomDataPathsFromAllExtensions()
    ];
    // Options to control the language client
    let clientOptions = {
        documentSelector,
        synchronize: {
            configurationSection: ['html', 'css', 'javascript'],
        },
        initializationOptions: {
            embeddedLanguages,
            dataPaths,
            provideFormatter: false,
        },
    };
    // Create the language client and start the client.
    let client = new vscode_languageclient_1.LanguageClient('html', localize('htmlserver.name', 'HTML Language Server'), serverOptions, clientOptions);
    client.registerProposedFeatures();
    let disposable = client.start();
    toDispose.push(disposable);
    client.onReady().then(() => {
        let tagRequestor = (document, position) => {
            let param = client.code2ProtocolConverter.asTextDocumentPositionParams(document, position);
            return client.sendRequest(TagCloseRequest.type, param);
        };
        disposable = tagClosing_1.activateTagClosing(tagRequestor, { html: true, handlebars: true }, 'html.autoClosingTags');
        toDispose.push(disposable);
        disposable = client.onTelemetry(e => {
            if (telemetryReporter) {
                telemetryReporter.sendTelemetryEvent(e.key, e.data);
            }
        });
        toDispose.push(disposable);
        // manually register / deregister format provider based on the `html.format.enable` setting avoiding issues with late registration. See #71652.
        updateFormatterRegistration();
        toDispose.push({ dispose: () => rangeFormatting && rangeFormatting.dispose() });
        toDispose.push(vscode_1.workspace.onDidChangeConfiguration(e => e.affectsConfiguration('html.format.enable') && updateFormatterRegistration()));
    });
    function updateFormatterRegistration() {
        const formatEnabled = vscode_1.workspace.getConfiguration().get('html.format.enable');
        if (!formatEnabled && rangeFormatting) {
            rangeFormatting.dispose();
            rangeFormatting = undefined;
        }
        else if (formatEnabled && !rangeFormatting) {
            rangeFormatting = vscode_1.languages.registerDocumentRangeFormattingEditProvider(documentSelector, {
                provideDocumentRangeFormattingEdits(document, range, options, token) {
                    let params = {
                        textDocument: client.code2ProtocolConverter.asTextDocumentIdentifier(document),
                        range: client.code2ProtocolConverter.asRange(range),
                        options: client.code2ProtocolConverter.asFormattingOptions(options)
                    };
                    return client.sendRequest(vscode_languageclient_1.DocumentRangeFormattingRequest.type, params, token).then(client.protocol2CodeConverter.asTextEdits, (error) => {
                        client.logFailedRequest(vscode_languageclient_1.DocumentRangeFormattingRequest.type, error);
                        return Promise.resolve([]);
                    });
                }
            });
        }
    }
    vscode_1.languages.setLanguageConfiguration('html', {
        indentationRules: {
            increaseIndentPattern: /<(?!\?|(?:area|base|br|col|frame|hr|html|img|input|link|meta|param)\b|[^>]*\/>)([-_\.A-Za-z0-9]+)(?=\s|>)\b[^>]*>(?!.*<\/\1>)|<!--(?!.*-->)|\{[^}"']*$/,
            decreaseIndentPattern: /^\s*(<\/(?!html)[-_\.A-Za-z0-9]+\b[^>]*>|-->|\})/
        },
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\$\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\s]+)/g,
        onEnterRules: [
            {
                beforeText: new RegExp(`<(?!(?:${htmlEmptyTagsShared_1.EMPTY_ELEMENTS.join('|')}))([_:\\w][_:\\w-.\\d]*)([^/>]*(?!/)>)[^<]*$`, 'i'),
                afterText: /^<\/([_:\w][_:\w-.\d]*)\s*>/i,
                action: { indentAction: vscode_1.IndentAction.IndentOutdent }
            },
            {
                beforeText: new RegExp(`<(?!(?:${htmlEmptyTagsShared_1.EMPTY_ELEMENTS.join('|')}))(\\w[\\w\\d]*)([^/>]*(?!/)>)[^<]*$`, 'i'),
                action: { indentAction: vscode_1.IndentAction.Indent }
            }
        ],
    });
    vscode_1.languages.setLanguageConfiguration('handlebars', {
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\$\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\s]+)/g,
        onEnterRules: [
            {
                beforeText: new RegExp(`<(?!(?:${htmlEmptyTagsShared_1.EMPTY_ELEMENTS.join('|')}))([_:\\w][_:\\w-.\\d]*)([^/>]*(?!/)>)[^<]*$`, 'i'),
                afterText: /^<\/([_:\w][_:\w-.\d]*)\s*>/i,
                action: { indentAction: vscode_1.IndentAction.IndentOutdent }
            },
            {
                beforeText: new RegExp(`<(?!(?:${htmlEmptyTagsShared_1.EMPTY_ELEMENTS.join('|')}))(\\w[\\w\\d]*)([^/>]*(?!/)>)[^<]*$`, 'i'),
                action: { indentAction: vscode_1.IndentAction.Indent }
            }
        ],
    });
    const regionCompletionRegExpr = /^(\s*)(<(!(-(-\s*(#\w*)?)?)?)?)?$/;
    const htmlSnippetCompletionRegExpr = /^(\s*)(<(h(t(m(l)?)?)?)?)?$/;
    vscode_1.languages.registerCompletionItemProvider(documentSelector, {
        provideCompletionItems(doc, pos) {
            const results = [];
            let lineUntilPos = doc.getText(new vscode_1.Range(new vscode_1.Position(pos.line, 0), pos));
            let match = lineUntilPos.match(regionCompletionRegExpr);
            if (match) {
                let range = new vscode_1.Range(new vscode_1.Position(pos.line, match[1].length), pos);
                let beginProposal = new vscode_1.CompletionItem('#region', vscode_1.CompletionItemKind.Snippet);
                beginProposal.range = range;
                beginProposal.insertText = new vscode_1.SnippetString('<!-- #region $1-->');
                beginProposal.documentation = localize('folding.start', 'Folding Region Start');
                beginProposal.filterText = match[2];
                beginProposal.sortText = 'za';
                results.push(beginProposal);
                let endProposal = new vscode_1.CompletionItem('#endregion', vscode_1.CompletionItemKind.Snippet);
                endProposal.range = range;
                endProposal.insertText = new vscode_1.SnippetString('<!-- #endregion -->');
                endProposal.documentation = localize('folding.end', 'Folding Region End');
                endProposal.filterText = match[2];
                endProposal.sortText = 'zb';
                results.push(endProposal);
            }
            let match2 = lineUntilPos.match(htmlSnippetCompletionRegExpr);
            if (match2 && doc.getText(new vscode_1.Range(new vscode_1.Position(0, 0), pos)).match(htmlSnippetCompletionRegExpr)) {
                let range = new vscode_1.Range(new vscode_1.Position(pos.line, match2[1].length), pos);
                let snippetProposal = new vscode_1.CompletionItem('HTML sample', vscode_1.CompletionItemKind.Snippet);
                snippetProposal.range = range;
                const content = ['<!DOCTYPE html>',
                    '<html>',
                    '<head>',
                    '\t<meta charset=\'utf-8\'>',
                    '\t<meta http-equiv=\'X-UA-Compatible\' content=\'IE=edge\'>',
                    '\t<title>${1:Page Title}</title>',
                    '\t<meta name=\'viewport\' content=\'width=device-width, initial-scale=1\'>',
                    '\t<link rel=\'stylesheet\' type=\'text/css\' media=\'screen\' href=\'${2:main.css}\'>',
                    '\t<script src=\'${3:main.js}\'></script>',
                    '</head>',
                    '<body>',
                    '\t$0',
                    '</body>',
                    '</html>'].join('\n');
                snippetProposal.insertText = new vscode_1.SnippetString(content);
                snippetProposal.documentation = localize('folding.html', 'Simple HTML5 starting point');
                snippetProposal.filterText = match2[2];
                snippetProposal.sortText = 'za';
                results.push(snippetProposal);
            }
            return results;
        }
    });
}
exports.activate = activate;
function getPackageInfo(context) {
    let extensionPackage = readJSONFile(context.asAbsolutePath('./package.json'));
    if (extensionPackage) {
        return {
            name: extensionPackage.name,
            version: extensionPackage.version,
            aiKey: extensionPackage.aiKey
        };
    }
    return null;
}
function readJSONFile(location) {
    try {
        return JSON.parse(fs.readFileSync(location).toString());
    }
    catch (e) {
        console.log(`Problems reading ${location}: ${e}`);
        return {};
    }
}
function deactivate() {
    return telemetryReporter ? telemetryReporter.dispose() : Promise.resolve(null);
}
exports.deactivate = deactivate;
//# sourceMappingURL=htmlMain.js.map