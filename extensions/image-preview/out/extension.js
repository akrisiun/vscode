"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const preview_1 = require("./preview");
const sizeStatusBarEntry_1 = require("./sizeStatusBarEntry");
const zoomStatusBarEntry_1 = require("./zoomStatusBarEntry");
function activate(context) {
    const extensionRoot = vscode.Uri.file(context.extensionPath);
    const sizeStatusBarEntry = new sizeStatusBarEntry_1.SizeStatusBarEntry();
    context.subscriptions.push(sizeStatusBarEntry);
    const zoomStatusBarEntry = new zoomStatusBarEntry_1.ZoomStatusBarEntry();
    context.subscriptions.push(zoomStatusBarEntry);
    context.subscriptions.push(vscode.window.registerWebviewEditorProvider(preview_1.Preview.viewType, {
        async resolveWebviewEditor(resource, editor) {
            // tslint:disable-next-line: no-unused-expression
            new preview_1.Preview(extensionRoot, resource, editor, sizeStatusBarEntry, zoomStatusBarEntry);
        }
    }));
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map