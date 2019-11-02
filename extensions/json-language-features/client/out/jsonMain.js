"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
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
let telemetryReporter;
function activate(context) {
    let toDispose = context.subscriptions;
    let rangeFormatting = undefined;
    let packageInfo = getPackageInfo(context);
    telemetryReporter = packageInfo && new vscode_extension_telemetry_1.default(packageInfo.name, packageInfo.version, packageInfo.aiKey);
    let serverMain = readJSONFile(context.asAbsolutePath('./server/package.json')).main;
    let serverModule = context.asAbsolutePath(path.join('server', serverMain));
    // The debug options for the server
    let debugOptions = { execArgv: ['--nolazy', '--inspect=' + (9000 + Math.round(Math.random() * 10000))] };
    // If the extension is launch in debug mode the debug server options are use
    // Otherwise the run options are used
    let serverOptions = {
        run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
        debug: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc, options: debugOptions }
    };
    let documentSelector = ['json', 'jsonc'];
    let schemaResolutionErrorStatusBarItem = vscode_1.window.createStatusBarItem({
        id: 'status.json.resolveError',
        name: localize('json.resolveError', "JSON: Schema Resolution Error"),
        alignment: vscode_1.StatusBarAlignment.Right,
        priority: 0
    });
    schemaResolutionErrorStatusBarItem.command = '_json.retryResolveSchema';
    schemaResolutionErrorStatusBarItem.tooltip = localize('json.schemaResolutionErrorMessage', 'Unable to resolve schema.') + ' ' + localize('json.clickToRetry', 'Click to retry.');
    schemaResolutionErrorStatusBarItem.text = '$(alert)';
    toDispose.push(schemaResolutionErrorStatusBarItem);
    let fileSchemaErrors = new Map();
    // Options to control the language client
    let clientOptions = {
        // Register the server for json documents
        documentSelector,
        initializationOptions: {
            handledSchemaProtocols: ['file'],
            provideFormatter: false // tell the server to not provide formatting capability and ignore the `json.format.enable` setting.
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
            }
        }
    };
    // Create the language client and start the client.
    let client = new vscode_languageclient_1.LanguageClient('json', localize('jsonserver.name', 'JSON Language Server'), serverOptions, clientOptions);
    client.registerProposedFeatures();
    let disposable = client.start();
    toDispose.push(disposable);
    client.onReady().then(() => {
        const schemaDocuments = {};
        // handle content request
        client.onRequest(VSCodeContentRequest.type, (uriPath) => {
            let uri = vscode_1.Uri.parse(uriPath);
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
        let handleContentChange = (uriString) => {
            if (schemaDocuments[uriString]) {
                client.sendNotification(SchemaContentChangeNotification.type, uriString);
                return true;
            }
            return false;
        };
        let handleActiveEditorChange = (activeEditor) => {
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
        let handleRetryResolveSchemaCommand = () => {
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
        client.sendNotification(SchemaAssociationNotification.type, getSchemaAssociation(context));
        vscode_1.extensions.onDidChange(_ => {
            client.sendNotification(SchemaAssociationNotification.type, getSchemaAssociation(context));
        });
        // manually register / deregister format provider based on the `html.format.enable` setting avoiding issues with late registration. See #71652.
        updateFormatterRegistration();
        toDispose.push({ dispose: () => rangeFormatting && rangeFormatting.dispose() });
        toDispose.push(vscode_1.workspace.onDidChangeConfiguration(e => e.affectsConfiguration('html.format.enable') && updateFormatterRegistration()));
    });
    let languageConfiguration = {
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
}
exports.activate = activate;
function deactivate() {
    return telemetryReporter ? telemetryReporter.dispose() : Promise.resolve(null);
}
exports.deactivate = deactivate;
function getSchemaAssociation(_context) {
    let associations = {};
    vscode_1.extensions.all.forEach(extension => {
        let packageJSON = extension.packageJSON;
        if (packageJSON && packageJSON.contributes && packageJSON.contributes.jsonValidation) {
            let jsonValidation = packageJSON.contributes.jsonValidation;
            if (Array.isArray(jsonValidation)) {
                jsonValidation.forEach(jv => {
                    let { fileMatch, url } = jv;
                    if (fileMatch && url) {
                        if (url[0] === '.' && url[1] === '/') {
                            url = vscode_1.Uri.file(path.join(extension.extensionPath, url)).toString();
                        }
                        if (fileMatch[0] === '%') {
                            fileMatch = fileMatch.replace(/%APP_SETTINGS_HOME%/, '/User');
                            fileMatch = fileMatch.replace(/%MACHINE_SETTINGS_HOME%/, '/Machine');
                            fileMatch = fileMatch.replace(/%APP_WORKSPACES_HOME%/, '/Workspaces');
                        }
                        else if (fileMatch.charAt(0) !== '/' && !fileMatch.match(/\w+:\/\//)) {
                            fileMatch = '/' + fileMatch;
                        }
                        let association = associations[fileMatch];
                        if (!association) {
                            association = [];
                            associations[fileMatch] = association;
                        }
                        association.push(url);
                    }
                });
            }
        }
    });
    return associations;
}
function getSettings() {
    let httpSettings = vscode_1.workspace.getConfiguration('http');
    let settings = {
        http: {
            proxy: httpSettings.get('proxy'),
            proxyStrictSSL: httpSettings.get('proxyStrictSSL')
        },
        json: {
            schemas: [],
            resultLimit: 5000
        }
    };
    let schemaSettingsById = Object.create(null);
    let collectSchemaSettings = (schemaSettings, rootPath, fileMatchPrefix) => {
        for (let setting of schemaSettings) {
            let url = getSchemaId(setting, rootPath);
            if (!url) {
                continue;
            }
            let schemaSetting = schemaSettingsById[url];
            if (!schemaSetting) {
                schemaSetting = schemaSettingsById[url] = { url, fileMatch: [] };
                settings.json.schemas.push(schemaSetting);
            }
            let fileMatches = setting.fileMatch;
            let resultingFileMatches = schemaSetting.fileMatch;
            if (Array.isArray(fileMatches)) {
                if (fileMatchPrefix) {
                    for (let fileMatch of fileMatches) {
                        if (fileMatch[0] === '/') {
                            resultingFileMatches.push(fileMatchPrefix + fileMatch);
                            resultingFileMatches.push(fileMatchPrefix + '/*' + fileMatch);
                        }
                        else {
                            resultingFileMatches.push(fileMatchPrefix + '/' + fileMatch);
                            resultingFileMatches.push(fileMatchPrefix + '/*/' + fileMatch);
                        }
                    }
                }
                else {
                    resultingFileMatches.push(...fileMatches);
                }
            }
            if (setting.schema) {
                schemaSetting.schema = setting.schema;
            }
        }
    };
    // merge global and folder settings. Qualify all file matches with the folder path.
    let globalSettings = vscode_1.workspace.getConfiguration('json', null).get('schemas');
    if (Array.isArray(globalSettings)) {
        collectSchemaSettings(globalSettings, vscode_1.workspace.rootPath);
    }
    let folders = vscode_1.workspace.workspaceFolders;
    if (folders) {
        for (let folder of folders) {
            let folderUri = folder.uri;
            let schemaConfigInfo = vscode_1.workspace.getConfiguration('json', folderUri).inspect('schemas');
            let folderSchemas = schemaConfigInfo.workspaceFolderValue;
            if (Array.isArray(folderSchemas)) {
                let folderPath = folderUri.toString();
                if (folderPath[folderPath.length - 1] === '/') {
                    folderPath = folderPath.substr(0, folderPath.length - 1);
                }
                collectSchemaSettings(folderSchemas, folderUri.fsPath, folderPath);
            }
        }
    }
    return settings;
}
function getSchemaId(schema, rootPath) {
    let url = schema.url;
    if (!url) {
        if (schema.schema) {
            url = schema.schema.id || `vscode://schemas/custom/${encodeURIComponent(hash_1.hash(schema.schema).toString(16))}`;
        }
    }
    else if (rootPath && (url[0] === '.' || url[0] === '/')) {
        url = vscode_1.Uri.file(path.normalize(path.join(rootPath, url))).toString();
    }
    return url;
}
function getPackageInfo(context) {
    let extensionPackage = readJSONFile(context.asAbsolutePath('./package.json'));
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
//# sourceMappingURL=jsonMain.js.map