"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const nls = require("vscode-nls");
const dispose_1 = require("./dispose");
const localize = nls.loadMessageBundle();
const selectZoomLevelCommandId = '_imagePreview.selectZoomLevel';
class ZoomStatusBarEntry extends dispose_1.Disposable {
    constructor() {
        super();
        this._onDidChangeScale = this._register(new vscode.EventEmitter());
        this.onDidChangeScale = this._onDidChangeScale.event;
        this._entry = this._register(vscode.window.createStatusBarItem({
            id: 'imagePreview.zoom',
            name: localize('zoomStatusBar.name', "Image Zoom"),
            alignment: vscode.StatusBarAlignment.Right,
            priority: 102 /* to the left of editor size entry (101) */,
        }));
        this._register(vscode.commands.registerCommand(selectZoomLevelCommandId, async () => {
            const scales = [10, 5, 2, 1, 0.5, 0.2, 'fit'];
            const options = scales.map((scale) => ({
                label: this.zoomLabel(scale),
                scale
            }));
            const pick = await vscode.window.showQuickPick(options, {
                placeHolder: localize('zoomStatusBar.placeholder', "Select zoom level")
            });
            if (pick) {
                this._onDidChangeScale.fire({ scale: pick.scale });
            }
        }));
        this._entry.command = selectZoomLevelCommandId;
    }
    show(owner, scale) {
        this._showOwner = owner;
        this._entry.text = this.zoomLabel(scale);
        this._entry.show();
    }
    hide(owner) {
        if (owner === this._showOwner) {
            this._entry.hide();
            this._showOwner = undefined;
        }
    }
    zoomLabel(scale) {
        return scale === 'fit'
            ? localize('zoomStatusBar.wholeImageLabel', "Whole Image")
            : `${Math.round(scale * 100)}%`;
    }
}
exports.ZoomStatusBarEntry = ZoomStatusBarEntry;
//# sourceMappingURL=zoomStatusBarEntry.js.map