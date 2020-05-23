"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoomStatusBarEntry = void 0;
const vscode = require("vscode");
const nls = require("vscode-nls");
const ownedStatusBarEntry_1 = require("./ownedStatusBarEntry");
const localize = nls.loadMessageBundle();
const selectZoomLevelCommandId = '_imagePreview.selectZoomLevel';
class ZoomStatusBarEntry extends ownedStatusBarEntry_1.PreviewStatusBarEntry {
    constructor() {
        super({
            id: 'imagePreview.zoom',
            name: localize('zoomStatusBar.name', "Image Zoom"),
            alignment: vscode.StatusBarAlignment.Right,
            priority: 102 /* to the left of editor size entry (101) */,
        });
        this._onDidChangeScale = this._register(new vscode.EventEmitter());
        this.onDidChangeScale = this._onDidChangeScale.event;
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
        this.entry.command = selectZoomLevelCommandId;
    }
    show(owner, scale) {
        this.showItem(owner, this.zoomLabel(scale));
    }
    zoomLabel(scale) {
        return scale === 'fit'
            ? localize('zoomStatusBar.wholeImageLabel', "Whole Image")
            : `${Math.round(scale * 100)}%`;
    }
}
exports.ZoomStatusBarEntry = ZoomStatusBarEntry;
//# sourceMappingURL=zoomStatusBarEntry.js.map