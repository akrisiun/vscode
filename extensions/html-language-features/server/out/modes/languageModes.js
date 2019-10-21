"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_css_languageservice_1 = require("vscode-css-languageservice");
const vscode_html_languageservice_1 = require("vscode-html-languageservice");
const vscode_languageserver_1 = require("vscode-languageserver");
exports.Color = vscode_languageserver_1.Color;
exports.ColorInformation = vscode_languageserver_1.ColorInformation;
exports.ColorPresentation = vscode_languageserver_1.ColorPresentation;
const languageModelCache_1 = require("../languageModelCache");
const cssMode_1 = require("./cssMode");
const embeddedSupport_1 = require("./embeddedSupport");
const htmlMode_1 = require("./htmlMode");
const javascriptMode_1 = require("./javascriptMode");
function getLanguageModes(supportedLanguages, workspace, clientCapabilities, customDataProviders) {
    const htmlLanguageService = vscode_html_languageservice_1.getLanguageService({ customDataProviders, clientCapabilities });
    const cssLanguageService = vscode_css_languageservice_1.getCSSLanguageService({ clientCapabilities });
    let documentRegions = languageModelCache_1.getLanguageModelCache(10, 60, document => embeddedSupport_1.getDocumentRegions(htmlLanguageService, document));
    let modelCaches = [];
    modelCaches.push(documentRegions);
    let modes = Object.create(null);
    modes['html'] = htmlMode_1.getHTMLMode(htmlLanguageService, workspace);
    if (supportedLanguages['css']) {
        modes['css'] = cssMode_1.getCSSMode(cssLanguageService, documentRegions, workspace);
    }
    if (supportedLanguages['javascript']) {
        modes['javascript'] = javascriptMode_1.getJavaScriptMode(documentRegions);
    }
    return {
        getModeAtPosition(document, position) {
            let languageId = documentRegions.get(document).getLanguageAtPosition(position);
            if (languageId) {
                return modes[languageId];
            }
            return undefined;
        },
        getModesInRange(document, range) {
            return documentRegions.get(document).getLanguageRanges(range).map(r => {
                return {
                    start: r.start,
                    end: r.end,
                    mode: r.languageId && modes[r.languageId],
                    attributeValue: r.attributeValue
                };
            });
        },
        getAllModesInDocument(document) {
            let result = [];
            for (let languageId of documentRegions.get(document).getLanguagesInDocument()) {
                let mode = modes[languageId];
                if (mode) {
                    result.push(mode);
                }
            }
            return result;
        },
        getAllModes() {
            let result = [];
            for (let languageId in modes) {
                let mode = modes[languageId];
                if (mode) {
                    result.push(mode);
                }
            }
            return result;
        },
        getMode(languageId) {
            return modes[languageId];
        },
        onDocumentRemoved(document) {
            modelCaches.forEach(mc => mc.onDocumentRemoved(document));
            for (let mode in modes) {
                modes[mode].onDocumentRemoved(document);
            }
        },
        dispose() {
            modelCaches.forEach(mc => mc.dispose());
            modelCaches = [];
            for (let mode in modes) {
                modes[mode].dispose();
            }
            modes = {};
        }
    };
}
exports.getLanguageModes = getLanguageModes;
//# sourceMappingURL=languageModes.js.map