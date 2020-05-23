"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const preview_1 = require("./preview");
const sizeStatusBarEntry_1 = require("./sizeStatusBarEntry");
const binarySizeStatusBarEntry_1 = require("./binarySizeStatusBarEntry");
const zoomStatusBarEntry_1 = require("./zoomStatusBarEntry");
function activate(context) {
    const extensionRoot = vscode.Uri.file(context.extensionPath);
    const sizeStatusBarEntry = new sizeStatusBarEntry_1.SizeStatusBarEntry();
    context.subscriptions.push(sizeStatusBarEntry);
    const binarySizeStatusBarEntry = new binarySizeStatusBarEntry_1.BinarySizeStatusBarEntry();
    context.subscriptions.push(binarySizeStatusBarEntry);
    const zoomStatusBarEntry = new zoomStatusBarEntry_1.ZoomStatusBarEntry();
    context.subscriptions.push(zoomStatusBarEntry);
    const previewManager = new preview_1.PreviewManager(extensionRoot, sizeStatusBarEntry, binarySizeStatusBarEntry, zoomStatusBarEntry);
    context.subscriptions.push(vscode.window.registerCustomEditorProvider2(preview_1.PreviewManager.viewType, previewManager, {
        supportsMultipleEditorsPerDocument: true,
    }));
    context.subscriptions.push(vscode.commands.registerCommand('imagePreview.zoomIn', () => {
        var _a;
        (_a = previewManager.activePreview) === null || _a === void 0 ? void 0 : _a.zoomIn();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('imagePreview.zoomOut', () => {
        var _a;
        (_a = previewManager.activePreview) === null || _a === void 0 ? void 0 : _a.zoomOut();
    }));
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map