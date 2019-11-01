"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
const request_light_1 = require("request-light");
const fs = require("fs");
const vscode_uri_1 = require("vscode-uri");
const URL = require("url");
const runner_1 = require("./utils/runner");
const vscode_json_languageservice_1 = require("vscode-json-languageservice");
const languageModelCache_1 = require("./languageModelCache");
var SchemaAssociationNotification;
(function (SchemaAssociationNotification) {
    SchemaAssociationNotification.type = new vscode_languageserver_1.NotificationType('json/schemaAssociations');
})(SchemaAssociationNotification || (SchemaAssociationNotification = {}));
var VSCodeContentRequest;
(function (VSCodeContentRequest) {
    VSCodeContentRequest.type = new vscode_languageserver_1.RequestType('vscode/content');
})(VSCodeContentRequest || (VSCodeContentRequest = {}));
var SchemaContentChangeNotification;
(function (SchemaContentChangeNotification) {
    SchemaContentChangeNotification.type = new vscode_languageserver_1.NotificationType('json/schemaContent');
})(SchemaContentChangeNotification || (SchemaContentChangeNotification = {}));
var ForceValidateRequest;
(function (ForceValidateRequest) {
    ForceValidateRequest.type = new vscode_languageserver_1.RequestType('json/validate');
})(ForceValidateRequest || (ForceValidateRequest = {}));
// Create a connection for the server
const connection = vscode_languageserver_1.createConnection();
process.on('unhandledRejection', (e) => {
    console.error(runner_1.formatError(`Unhandled exception`, e));
});
process.on('uncaughtException', (e) => {
    console.error(runner_1.formatError(`Unhandled exception`, e));
});
console.log = connection.console.log.bind(connection.console);
console.error = connection.console.error.bind(connection.console);
const workspaceContext = {
    resolveRelativePath: (relativePath, resource) => {
        return URL.resolve(resource, relativePath);
    }
};
function getSchemaRequestService(handledSchemas) {
    return (uri) => {
        const protocol = uri.substr(0, uri.indexOf(':'));
        if (!handledSchemas || handledSchemas[protocol]) {
            if (protocol === 'file') {
                const fsPath = vscode_uri_1.URI.parse(uri).fsPath;
                return new Promise((c, e) => {
                    fs.readFile(fsPath, 'UTF-8', (err, result) => {
                        err ? e(err.message || err.toString()) : c(result.toString());
                    });
                });
            }
            else if (protocol === 'http' || protocol === 'https') {
                if (uri.indexOf('//schema.management.azure.com/') !== -1) {
                    /* __GDPR__
                        "json.schema" : {
                            "schemaURL" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                        }
                     */
                    connection.telemetry.logEvent({
                        key: 'json.schema',
                        value: {
                            schemaURL: uri
                        }
                    });
                }
                const headers = { 'Accept-Encoding': 'gzip, deflate' };
                return request_light_1.xhr({ url: uri, followRedirects: 5, headers }).then(response => {
                    return response.responseText;
                }, (error) => {
                    return Promise.reject(error.responseText || request_light_1.getErrorStatusDescription(error.status) || error.toString());
                });
            }
        }
        return connection.sendRequest(VSCodeContentRequest.type, uri).then(responseText => {
            return responseText;
        }, error => {
            return Promise.reject(error.message);
        });
    };
}
// create the JSON language service
let languageService = vscode_json_languageservice_1.getLanguageService({
    workspaceContext,
    contributions: [],
    clientCapabilities: vscode_json_languageservice_1.ClientCapabilities.LATEST
});
// Create a text document manager.
const documents = new vscode_languageserver_1.TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
let clientSnippetSupport = false;
let dynamicFormatterRegistration = false;
let foldingRangeLimit = Number.MAX_VALUE;
let hierarchicalDocumentSymbolSupport = false;
// After the server has started the client sends an initialize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilities.
connection.onInitialize((params) => {
    const handledProtocols = params.initializationOptions && params.initializationOptions['handledSchemaProtocols'];
    languageService = vscode_json_languageservice_1.getLanguageService({
        schemaRequestService: getSchemaRequestService(handledProtocols),
        workspaceContext,
        contributions: [],
        clientCapabilities: params.capabilities
    });
    function getClientCapability(name, def) {
        const keys = name.split('.');
        let c = params.capabilities;
        for (let i = 0; c && i < keys.length; i++) {
            if (!c.hasOwnProperty(keys[i])) {
                return def;
            }
            c = c[keys[i]];
        }
        return c;
    }
    clientSnippetSupport = getClientCapability('textDocument.completion.completionItem.snippetSupport', false);
    dynamicFormatterRegistration = getClientCapability('textDocument.rangeFormatting.dynamicRegistration', false) && (typeof params.initializationOptions.provideFormatter !== 'boolean');
    foldingRangeLimit = getClientCapability('textDocument.foldingRange.rangeLimit', Number.MAX_VALUE);
    hierarchicalDocumentSymbolSupport = getClientCapability('textDocument.documentSymbol.hierarchicalDocumentSymbolSupport', false);
    const capabilities = {
        // Tell the client that the server works in FULL text document sync mode
        textDocumentSync: documents.syncKind,
        completionProvider: clientSnippetSupport ? { resolveProvider: true, triggerCharacters: ['"', ':'] } : undefined,
        hoverProvider: true,
        documentSymbolProvider: true,
        documentRangeFormattingProvider: params.initializationOptions.provideFormatter === true,
        colorProvider: {},
        foldingRangeProvider: true,
        selectionRangeProvider: true
    };
    return { capabilities };
});
let jsonConfigurationSettings = undefined;
let schemaAssociations = undefined;
let formatterRegistration = null;
// The settings have changed. Is send on server activation as well.
connection.onDidChangeConfiguration((change) => {
    let settings = change.settings;
    request_light_1.configure(settings.http && settings.http.proxy, settings.http && settings.http.proxyStrictSSL);
    jsonConfigurationSettings = settings.json && settings.json.schemas;
    updateConfiguration();
    // dynamically enable & disable the formatter
    if (dynamicFormatterRegistration) {
        const enableFormatter = settings && settings.json && settings.json.format && settings.json.format.enable;
        if (enableFormatter) {
            if (!formatterRegistration) {
                formatterRegistration = connection.client.register(vscode_languageserver_1.DocumentRangeFormattingRequest.type, { documentSelector: [{ language: 'json' }, { language: 'jsonc' }] });
            }
        }
        else if (formatterRegistration) {
            formatterRegistration.then(r => r.dispose());
            formatterRegistration = null;
        }
    }
});
// The jsonValidation extension configuration has changed
connection.onNotification(SchemaAssociationNotification.type, associations => {
    schemaAssociations = associations;
    updateConfiguration();
});
// A schema has changed
connection.onNotification(SchemaContentChangeNotification.type, uri => {
    languageService.resetSchema(uri);
});
// Retry schema validation on all open documents
connection.onRequest(ForceValidateRequest.type, uri => {
    return new Promise(resolve => {
        const document = documents.get(uri);
        if (document) {
            updateConfiguration();
            validateTextDocument(document, diagnostics => {
                resolve(diagnostics);
            });
        }
        else {
            resolve([]);
        }
    });
});
function updateConfiguration() {
    const languageSettings = {
        validate: true,
        allowComments: true,
        schemas: new Array()
    };
    if (schemaAssociations) {
        for (const pattern in schemaAssociations) {
            const association = schemaAssociations[pattern];
            if (Array.isArray(association)) {
                association.forEach(uri => {
                    languageSettings.schemas.push({ uri, fileMatch: [pattern] });
                });
            }
        }
    }
    if (jsonConfigurationSettings) {
        jsonConfigurationSettings.forEach((schema, index) => {
            let uri = schema.url;
            if (!uri && schema.schema) {
                uri = schema.schema.id || `vscode://schemas/custom/${index}`;
            }
            if (uri) {
                languageSettings.schemas.push({ uri, fileMatch: schema.fileMatch, schema: schema.schema });
            }
        });
    }
    languageService.configure(languageSettings);
    // Revalidate any open text documents
    documents.all().forEach(triggerValidation);
}
// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
    triggerValidation(change.document);
});
// a document has closed: clear all diagnostics
documents.onDidClose(event => {
    cleanPendingValidation(event.document);
    connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] });
});
const pendingValidationRequests = {};
const validationDelayMs = 500;
function cleanPendingValidation(textDocument) {
    const request = pendingValidationRequests[textDocument.uri];
    if (request) {
        clearTimeout(request);
        delete pendingValidationRequests[textDocument.uri];
    }
}
function triggerValidation(textDocument) {
    cleanPendingValidation(textDocument);
    pendingValidationRequests[textDocument.uri] = setTimeout(() => {
        delete pendingValidationRequests[textDocument.uri];
        validateTextDocument(textDocument);
    }, validationDelayMs);
}
function validateTextDocument(textDocument, callback) {
    const respond = (diagnostics) => {
        connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
        if (callback) {
            callback(diagnostics);
        }
    };
    if (textDocument.getText().length === 0) {
        respond([]); // ignore empty documents
        return;
    }
    const jsonDocument = getJSONDocument(textDocument);
    const version = textDocument.version;
    const documentSettings = textDocument.languageId === 'jsonc' ? { comments: 'ignore', trailingCommas: 'warning' } : { comments: 'error', trailingCommas: 'error' };
    languageService.doValidation(textDocument, jsonDocument, documentSettings).then(diagnostics => {
        setTimeout(() => {
            const currDocument = documents.get(textDocument.uri);
            if (currDocument && currDocument.version === version) {
                respond(diagnostics); // Send the computed diagnostics to VSCode.
            }
        }, 100);
    }, error => {
        connection.console.error(runner_1.formatError(`Error while validating ${textDocument.uri}`, error));
    });
}
connection.onDidChangeWatchedFiles((change) => {
    // Monitored files have changed in VSCode
    let hasChanges = false;
    change.changes.forEach(c => {
        if (languageService.resetSchema(c.uri)) {
            hasChanges = true;
        }
    });
    if (hasChanges) {
        documents.all().forEach(triggerValidation);
    }
});
const jsonDocuments = languageModelCache_1.getLanguageModelCache(10, 60, document => languageService.parseJSONDocument(document));
documents.onDidClose(e => {
    jsonDocuments.onDocumentRemoved(e.document);
});
connection.onShutdown(() => {
    jsonDocuments.dispose();
});
function getJSONDocument(document) {
    return jsonDocuments.get(document);
}
connection.onCompletion((textDocumentPosition, token) => {
    return runner_1.runSafeAsync(async () => {
        const document = documents.get(textDocumentPosition.textDocument.uri);
        if (document) {
            const jsonDocument = getJSONDocument(document);
            return languageService.doComplete(document, textDocumentPosition.position, jsonDocument);
        }
        return null;
    }, null, `Error while computing completions for ${textDocumentPosition.textDocument.uri}`, token);
});
connection.onCompletionResolve((completionItem, token) => {
    return runner_1.runSafeAsync(() => {
        return languageService.doResolve(completionItem);
    }, completionItem, `Error while resolving completion proposal`, token);
});
connection.onHover((textDocumentPositionParams, token) => {
    return runner_1.runSafeAsync(async () => {
        const document = documents.get(textDocumentPositionParams.textDocument.uri);
        if (document) {
            const jsonDocument = getJSONDocument(document);
            return languageService.doHover(document, textDocumentPositionParams.position, jsonDocument);
        }
        return null;
    }, null, `Error while computing hover for ${textDocumentPositionParams.textDocument.uri}`, token);
});
connection.onDocumentSymbol((documentSymbolParams, token) => {
    return runner_1.runSafe(() => {
        const document = documents.get(documentSymbolParams.textDocument.uri);
        if (document) {
            const jsonDocument = getJSONDocument(document);
            if (hierarchicalDocumentSymbolSupport) {
                return languageService.findDocumentSymbols2(document, jsonDocument);
            }
            else {
                return languageService.findDocumentSymbols(document, jsonDocument);
            }
        }
        return [];
    }, [], `Error while computing document symbols for ${documentSymbolParams.textDocument.uri}`, token);
});
connection.onDocumentRangeFormatting((formatParams, token) => {
    return runner_1.runSafe(() => {
        const document = documents.get(formatParams.textDocument.uri);
        if (document) {
            return languageService.format(document, formatParams.range, formatParams.options);
        }
        return [];
    }, [], `Error while formatting range for ${formatParams.textDocument.uri}`, token);
});
connection.onDocumentColor((params, token) => {
    return runner_1.runSafeAsync(async () => {
        const document = documents.get(params.textDocument.uri);
        if (document) {
            const jsonDocument = getJSONDocument(document);
            return languageService.findDocumentColors(document, jsonDocument);
        }
        return [];
    }, [], `Error while computing document colors for ${params.textDocument.uri}`, token);
});
connection.onColorPresentation((params, token) => {
    return runner_1.runSafe(() => {
        const document = documents.get(params.textDocument.uri);
        if (document) {
            const jsonDocument = getJSONDocument(document);
            return languageService.getColorPresentations(document, jsonDocument, params.color, params.range);
        }
        return [];
    }, [], `Error while computing color presentations for ${params.textDocument.uri}`, token);
});
connection.onFoldingRanges((params, token) => {
    return runner_1.runSafe(() => {
        const document = documents.get(params.textDocument.uri);
        if (document) {
            return languageService.getFoldingRanges(document, { rangeLimit: foldingRangeLimit });
        }
        return null;
    }, null, `Error while computing folding ranges for ${params.textDocument.uri}`, token);
});
connection.onSelectionRanges((params, token) => {
    return runner_1.runSafe(() => {
        const document = documents.get(params.textDocument.uri);
        if (document) {
            const jsonDocument = getJSONDocument(document);
            return languageService.getSelectionRanges(document, params.positions, jsonDocument);
        }
        return [];
    }, [], `Error while computing selection ranges for ${params.textDocument.uri}`, token);
});
// Listen on the connection
connection.listen();
//# sourceMappingURL=jsonServerMain.js.map