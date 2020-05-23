"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const path = require("path");
const fs = require("fs");
const nls = require("vscode-nls");
const request_light_1 = require("request-light");
const localize = nls.loadMessageBundle();
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const vscode_extension_telemetry_1 = require("vscode-extension-telemetry");
const hash_1 = require("./utils/hash");
var VSCodeContentRequest;
(function (VSCodeContentRequest) {
    VSCodeContentRequest.type = new vscode_languageclient_1.RequestType('vscode/content');
})(VSCodeContentRequest || (VSCodeContentRequest = {}));
var SchemaContentChangeNotification;
(function (SchemaContentChangeNotification) {
    SchemaContentChangeNotification.type = new vscode_languageclient_1.NotificationType('json/schemaContent');
})(SchemaContentChangeNotification || (SchemaContentChangeNotification = {}));
var ForceValidateRequest;
(function (ForceValidateRequest) {
    ForceValidateRequest.type = new vscode_languageclient_1.RequestType('json/validate');
})(ForceValidateRequest || (ForceValidateRequest = {}));
var SchemaAssociationNotification;
(function (SchemaAssociationNotification) {
    SchemaAssociationNotification.type = new vscode_languageclient_1.NotificationType('json/schemaAssociations');
})(SchemaAssociationNotification || (SchemaAssociationNotification = {}));
var ResultLimitReachedNotification;
(function (ResultLimitReachedNotification) {
    ResultLimitReachedNotification.type = new vscode_languageclient_1.NotificationType('json/resultLimitReached');
})(ResultLimitReachedNotification || (ResultLimitReachedNotification = {}));
let telemetryReporter;
function activate(context) {
    const toDispose = context.subscriptions;
    let rangeFormatting = undefined;
    const packageInfo = getPackageInfo(context);
    telemetryReporter = packageInfo && new vscode_extension_telemetry_1.default(packageInfo.name, packageInfo.version, packageInfo.aiKey);
    const serverMain = readJSONFile(context.asAbsolutePath('./server/package.json')).main;
    const serverModule = context.asAbsolutePath(path.join('server', serverMain));
    // The debug options for the server
    const debugOptions = { execArgv: ['--nolazy', '--inspect=' + (9000 + Math.round(Math.random() * 10000))] };
    // If the extension is launch in debug mode the debug server options are use
    // Otherwise the run options are used
    const serverOptions = {
        run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
        debug: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc, options: debugOptions }
    };
    const documentSelector = ['json', 'jsonc'];
    const schemaResolutionErrorStatusBarItem = vscode_1.window.createStatusBarItem({
        id: 'status.json.resolveError',
        name: localize('json.resolveError', "JSON: Schema Resolution Error"),
        alignment: vscode_1.StatusBarAlignment.Right,
        priority: 0
    });
    schemaResolutionErrorStatusBarItem.command = '_json.retryResolveSchema';
    schemaResolutionErrorStatusBarItem.tooltip = localize('json.schemaResolutionErrorMessage', 'Unable to resolve schema.') + ' ' + localize('json.clickToRetry', 'Click to retry.');
    schemaResolutionErrorStatusBarItem.text = '$(alert)';
    toDispose.push(schemaResolutionErrorStatusBarItem);
    const fileSchemaErrors = new Map();
    // Options to control the language client
    const clientOptions = {
        // Register the server for json documents
        documentSelector,
        initializationOptions: {
            handledSchemaProtocols: ['file'],
            provideFormatter: false,
            customCapabilities: { rangeFormatting: { editLimit: 1000 } }
        },
        synchronize: {
            // Synchronize the setting section 'json' to the server
            configurationSection: ['json', 'http'],
            fileEvents: vscode_1.workspace.createFileSystemWatcher('**/*.json')
        },
        middleware: {
            workspace: {
                didChangeConfiguration: () => client.sendNotification(vscode_languageclient_1.DidChangeConfigurationNotification.type, { settings: getSettings() })
            },
            handleDiagnostics: (uri, diagnostics, next) => {
                const schemaErrorIndex = diagnostics.findIndex(candidate => candidate.code === /* SchemaResolveError */ 0x300);
                if (schemaErrorIndex === -1) {
                    fileSchemaErrors.delete(uri.toString());
                    return next(uri, diagnostics);
                }
                const schemaResolveDiagnostic = diagnostics[schemaErrorIndex];
                fileSchemaErrors.set(uri.toString(), schemaResolveDiagnostic.message);
                if (vscode_1.window.activeTextEditor && vscode_1.window.activeTextEditor.document.uri.toString() === uri.toString()) {
                    schemaResolutionErrorStatusBarItem.show();
                }
                next(uri, diagnostics);
            },
            // testing the replace / insert mode
            provideCompletionItem(document, position, context, token, next) {
                function update(item) {
                    const range = item.range;
                    if (range instanceof vscode_1.Range && range.end.isAfter(position) && range.start.isBeforeOrEqual(position)) {
                        item.range = { inserting: new vscode_1.Range(range.start, position), replacing: range };
                    }
                    if (item.documentation instanceof vscode_1.MarkdownString) {
                        item.documentation = updateMarkdownString(item.documentation);
                    }
                }
                function updateProposals(r) {
                    if (r) {
                        (Array.isArray(r) ? r : r.items).forEach(update);
                    }
                    return r;
                }
                const r = next(document, position, context, token);
                if (isThenable(r)) {
                    return r.then(updateProposals);
                }
                return updateProposals(r);
            },
            provideHover(document, position, token, next) {
                function updateHover(r) {
                    if (r && Array.isArray(r.contents)) {
                        r.contents = r.contents.map(h => h instanceof vscode_1.MarkdownString ? updateMarkdownString(h) : h);
                    }
                    return r;
                }
                const r = next(document, position, token);
                if (isThenable(r)) {
                    return r.then(updateHover);
                }
                return updateHover(r);
            }
        }
    };
    // Create the language client and start the client.
    const client = new vscode_languageclient_1.LanguageClient('json', localize('jsonserver.name', 'JSON Language Server'), serverOptions, clientOptions);
    client.registerProposedFeatures();
    const disposable = client.start();
    toDispose.push(disposable);
    client.onReady().then(() => {
        const schemaDocuments = {};
        // handle content request
        client.onRequest(VSCodeContentRequest.type, (uriPath) => {
            const uri = vscode_1.Uri.parse(uriPath);
            if (uri.scheme === 'untitled') {
                return Promise.reject(new Error(localize('untitled.schema', 'Unable to load {0}', uri.toString())));
            }
            if (uri.scheme !== 'http' && uri.scheme !== 'https') {
                return vscode_1.workspace.openTextDocument(uri).then(doc => {
                    schemaDocuments[uri.toString()] = true;
                    return doc.getText();
                }, error => {
                    return Promise.reject(error);
                });
            }
            else {
                if (telemetryReporter && uri.authority === 'schema.management.azure.com') {
                    /* __GDPR__
                        "json.schema" : {
                            "schemaURL" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                        }
                     */
                    telemetryReporter.sendTelemetryEvent('json.schema', { schemaURL: uriPath });
                }
                const headers = { 'Accept-Encoding': 'gzip, deflate' };
                return request_light_1.xhr({ url: uriPath, followRedirects: 5, headers }).then(response => {
                    return response.responseText;
                }, (error) => {
                    let extraInfo = error.responseText || error.toString();
                    if (extraInfo.length > 256) {
                        extraInfo = `${extraInfo.substr(0, 256)}...`;
                    }
                    return Promise.reject(new vscode_languageclient_1.ResponseError(error.status, request_light_1.getErrorStatusDescription(error.status) + '\n' + extraInfo));
                });
            }
        });
        const handleContentChange = (uriString) => {
            if (schemaDocuments[uriString]) {
                client.sendNotification(SchemaContentChangeNotification.type, uriString);
                return true;
            }
            return false;
        };
        const handleActiveEditorChange = (activeEditor) => {
            if (!activeEditor) {
                return;
            }
            const activeDocUri = activeEditor.document.uri.toString();
            if (activeDocUri && fileSchemaErrors.has(activeDocUri)) {
                schemaResolutionErrorStatusBarItem.show();
            }
            else {
                schemaResolutionErrorStatusBarItem.hide();
            }
        };
        toDispose.push(vscode_1.workspace.onDidChangeTextDocument(e => handleContentChange(e.document.uri.toString())));
        toDispose.push(vscode_1.workspace.onDidCloseTextDocument(d => {
            const uriString = d.uri.toString();
            if (handleContentChange(uriString)) {
                delete schemaDocuments[uriString];
            }
            fileSchemaErrors.delete(uriString);
        }));
        toDispose.push(vscode_1.window.onDidChangeActiveTextEditor(handleActiveEditorChange));
        const handleRetryResolveSchemaCommand = () => {
            if (vscode_1.window.activeTextEditor) {
                schemaResolutionErrorStatusBarItem.text = '$(watch)';
                const activeDocUri = vscode_1.window.activeTextEditor.document.uri.toString();
                client.sendRequest(ForceValidateRequest.type, activeDocUri).then((diagnostics) => {
                    const schemaErrorIndex = diagnostics.findIndex(candidate => candidate.code === /* SchemaResolveError */ 0x300);
                    if (schemaErrorIndex !== -1) {
                        // Show schema resolution errors in status bar only; ref: #51032
                        const schemaResolveDiagnostic = diagnostics[schemaErrorIndex];
                        fileSchemaErrors.set(activeDocUri, schemaResolveDiagnostic.message);
                    }
                    else {
                        schemaResolutionErrorStatusBarItem.hide();
                    }
                    schemaResolutionErrorStatusBarItem.text = '$(alert)';
                });
            }
        };
        toDispose.push(vscode_1.commands.registerCommand('_json.retryResolveSchema', handleRetryResolveSchemaCommand));
        client.sendNotification(SchemaAssociationNotification.type, getSchemaAssociations(context));
        vscode_1.extensions.onDidChange(_ => {
            client.sendNotification(SchemaAssociationNotification.type, getSchemaAssociations(context));
        });
        // manually register / deregister format provider based on the `html.format.enable` setting avoiding issues with late registration. See #71652.
        updateFormatterRegistration();
        toDispose.push({ dispose: () => rangeFormatting && rangeFormatting.dispose() });
        toDispose.push(vscode_1.workspace.onDidChangeConfiguration(e => e.affectsConfiguration('html.format.enable') && updateFormatterRegistration()));
        client.onNotification(ResultLimitReachedNotification.type, message => {
            vscode_1.window.showInformationMessage(`${message}\nUse setting 'json.maxItemsComputed' to configure the limit.`);
        });
    });
    const languageConfiguration = {
        wordPattern: /("(?:[^\\\"]*(?:\\.)?)*"?)|[^\s{}\[\],:]+/,
        indentationRules: {
            increaseIndentPattern: /({+(?=([^"]*"[^"]*")*[^"}]*$))|(\[+(?=([^"]*"[^"]*")*[^"\]]*$))/,
            decreaseIndentPattern: /^\s*[}\]],?\s*$/
        }
    };
    vscode_1.languages.setLanguageConfiguration('json', languageConfiguration);
    vscode_1.languages.setLanguageConfiguration('jsonc', languageConfiguration);
    function updateFormatterRegistration() {
        const formatEnabled = vscode_1.workspace.getConfiguration().get('json.format.enable');
        if (!formatEnabled && rangeFormatting) {
            rangeFormatting.dispose();
            rangeFormatting = undefined;
        }
        else if (formatEnabled && !rangeFormatting) {
            rangeFormatting = vscode_1.languages.registerDocumentRangeFormattingEditProvider(documentSelector, {
                provideDocumentRangeFormattingEdits(document, range, options, token) {
                    const params = {
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
}
exports.activate = activate;
function deactivate() {
    return telemetryReporter ? telemetryReporter.dispose() : Promise.resolve(null);
}
exports.deactivate = deactivate;
function getSchemaAssociations(_context) {
    const associations = [];
    vscode_1.extensions.all.forEach(extension => {
        const packageJSON = extension.packageJSON;
        if (packageJSON && packageJSON.contributes && packageJSON.contributes.jsonValidation) {
            const jsonValidation = packageJSON.contributes.jsonValidation;
            if (Array.isArray(jsonValidation)) {
                jsonValidation.forEach(jv => {
                    let { fileMatch, url } = jv;
                    if (typeof fileMatch === 'string') {
                        fileMatch = [fileMatch];
                    }
                    if (Array.isArray(fileMatch) && url) {
                        if (url[0] === '.' && url[1] === '/') {
                            url = vscode_1.Uri.file(path.join(extension.extensionPath, url)).toString();
                        }
                        fileMatch = fileMatch.map(fm => {
                            if (fm[0] === '%') {
                                fm = fm.replace(/%APP_SETTINGS_HOME%/, '/User');
                                fm = fm.replace(/%MACHINE_SETTINGS_HOME%/, '/Machine');
                                fm = fm.replace(/%APP_WORKSPACES_HOME%/, '/Workspaces');
                            }
                            else if (!fm.match(/^(\w+:\/\/|\/|!)/)) {
                                fm = '/' + fm;
                            }
                            return fm;
                        });
                        associations.push({ fileMatch, uri: url });
                    }
                });
            }
        }
    });
    return associations;
}
function getSettings() {
    const httpSettings = vscode_1.workspace.getConfiguration('http');
    const resultLimit = Math.trunc(Math.max(0, Number(vscode_1.workspace.getConfiguration().get('json.maxItemsComputed')))) || 5000;
    const settings = {
        http: {
            proxy: httpSettings.get('proxy'),
            proxyStrictSSL: httpSettings.get('proxyStrictSSL')
        },
        json: {
            schemas: [],
            resultLimit
        }
    };
    const schemaSettingsById = Object.create(null);
    const collectSchemaSettings = (schemaSettings, folderUri, isMultiRoot) => {
        let fileMatchPrefix = undefined;
        if (folderUri && isMultiRoot) {
            fileMatchPrefix = folderUri.toString();
            if (fileMatchPrefix[fileMatchPrefix.length - 1] === '/') {
                fileMatchPrefix = fileMatchPrefix.substr(0, fileMatchPrefix.length - 1);
            }
        }
        for (const setting of schemaSettings) {
            const url = getSchemaId(setting, folderUri);
            if (!url) {
                continue;
            }
            let schemaSetting = schemaSettingsById[url];
            if (!schemaSetting) {
                schemaSetting = schemaSettingsById[url] = { url, fileMatch: [] };
                settings.json.schemas.push(schemaSetting);
            }
            const fileMatches = setting.fileMatch;
            if (Array.isArray(fileMatches)) {
                const resultingFileMatches = schemaSetting.fileMatch || [];
                schemaSetting.fileMatch = resultingFileMatches;
                const addMatch = (pattern) => {
                    if (resultingFileMatches.indexOf(pattern) === -1) {
                        resultingFileMatches.push(pattern);
                    }
                };
                for (const fileMatch of fileMatches) {
                    if (fileMatchPrefix) {
                        if (fileMatch[0] === '/') {
                            addMatch(fileMatchPrefix + fileMatch);
                            addMatch(fileMatchPrefix + '/*' + fileMatch);
                        }
                        else {
                            addMatch(fileMatchPrefix + '/' + fileMatch);
                            addMatch(fileMatchPrefix + '/*/' + fileMatch);
                        }
                    }
                    else {
                        addMatch(fileMatch);
                    }
                }
            }
            if (setting.schema && !schemaSetting.schema) {
                schemaSetting.schema = setting.schema;
            }
        }
    };
    const folders = vscode_1.workspace.workspaceFolders;
    // merge global and folder settings. Qualify all file matches with the folder path.
    const globalSettings = vscode_1.workspace.getConfiguration('json', null).get('schemas');
    if (Array.isArray(globalSettings)) {
        if (!folders) {
            collectSchemaSettings(globalSettings);
        }
    }
    if (folders) {
        const isMultiRoot = folders.length > 1;
        for (const folder of folders) {
            const folderUri = folder.uri;
            const schemaConfigInfo = vscode_1.workspace.getConfiguration('json', folderUri).inspect('schemas');
            const folderSchemas = schemaConfigInfo.workspaceFolderValue;
            if (Array.isArray(folderSchemas)) {
                collectSchemaSettings(folderSchemas, folderUri, isMultiRoot);
            }
            if (Array.isArray(globalSettings)) {
                collectSchemaSettings(globalSettings, folderUri, isMultiRoot);
            }
        }
    }
    return settings;
}
function getSchemaId(schema, folderUri) {
    let url = schema.url;
    if (!url) {
        if (schema.schema) {
            url = schema.schema.id || `vscode://schemas/custom/${encodeURIComponent(hash_1.hash(schema.schema).toString(16))}`;
        }
    }
    else if (folderUri && (url[0] === '.' || url[0] === '/')) {
        url = folderUri.with({ path: path.posix.join(folderUri.path, url) }).toString();
    }
    return url;
}
function getPackageInfo(context) {
    const extensionPackage = readJSONFile(context.asAbsolutePath('./package.json'));
    if (extensionPackage) {
        return {
            name: extensionPackage.name,
            version: extensionPackage.version,
            aiKey: extensionPackage.aiKey
        };
    }
    return undefined;
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
function isThenable(obj) {
    return obj && obj['then'];
}
function updateMarkdownString(h) {
    const n = new vscode_1.MarkdownString(h.value, true);
    n.isTrusted = h.isTrusted;
    return n;
}
//# sourceMappingURL=jsonMain.js.map