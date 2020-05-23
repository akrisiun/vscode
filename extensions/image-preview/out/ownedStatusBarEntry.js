"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviewStatusBarEntry = void 0;
const vscode = require("vscode");
const dispose_1 = require("./dispose");
class PreviewStatusBarEntry extends dispose_1.Disposable {
    constructor(options) {
        super();
        this.entry = this._register(vscode.window.createStatusBarItem(options));
    }
    showItem(owner, text) {
        this._showOwner = owner;
        this.entry.text = text;
        this.entry.show();
    }
    hide(owner) {
        if (owner === this._showOwner) {
            this.entry.hide();
            this._showOwner = undefined;
        }
    }
}
exports.PreviewStatusBarEntry = PreviewStatusBarEntry;
//# sourceMappingURL=ownedStatusBarEntry.js.map