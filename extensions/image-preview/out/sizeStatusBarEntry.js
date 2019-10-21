"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const dispose_1 = require("./dispose");
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle();
class SizeStatusBarEntry extends dispose_1.Disposable {
    constructor() {
        super();
        this._entry = this._register(vscode.window.createStatusBarItem({
            id: 'imagePreview.size',
            name: localize('sizeStatusBar.name', "Image Size"),
            alignment: vscode.StatusBarAlignment.Right,
            priority: 101 /* to the left of editor status (100) */,
        }));
    }
    show(owner, text) {
        this._showingOwner = owner;
        this._entry.text = text;
        this._entry.show();
    }
    hide(owner) {
        if (owner === this._showingOwner) {
            this._entry.hide();
            this._showingOwner = undefined;
        }
    }
}
exports.SizeStatusBarEntry = SizeStatusBarEntry;
//# sourceMappingURL=sizeStatusBarEntry.js.map