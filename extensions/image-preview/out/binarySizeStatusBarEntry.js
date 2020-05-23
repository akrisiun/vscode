"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinarySizeStatusBarEntry = void 0;
const vscode = require("vscode");
const nls = require("vscode-nls");
const ownedStatusBarEntry_1 = require("./ownedStatusBarEntry");
const localize = nls.loadMessageBundle();
let BinarySize = /** @class */ (() => {
    class BinarySize {
        static formatSize(size) {
            if (size < BinarySize.KB) {
                return localize('sizeB', "{0}B", size);
            }
            if (size < BinarySize.MB) {
                return localize('sizeKB', "{0}KB", (size / BinarySize.KB).toFixed(2));
            }
            if (size < BinarySize.GB) {
                return localize('sizeMB', "{0}MB", (size / BinarySize.MB).toFixed(2));
            }
            if (size < BinarySize.TB) {
                return localize('sizeGB', "{0}GB", (size / BinarySize.GB).toFixed(2));
            }
            return localize('sizeTB', "{0}TB", (size / BinarySize.TB).toFixed(2));
        }
    }
    BinarySize.KB = 1024;
    BinarySize.MB = BinarySize.KB * BinarySize.KB;
    BinarySize.GB = BinarySize.MB * BinarySize.KB;
    BinarySize.TB = BinarySize.GB * BinarySize.KB;
    return BinarySize;
})();
class BinarySizeStatusBarEntry extends ownedStatusBarEntry_1.PreviewStatusBarEntry {
    constructor() {
        super({
            id: 'imagePreview.binarySize',
            name: localize('sizeStatusBar.name', "Image Binary Size"),
            alignment: vscode.StatusBarAlignment.Right,
            priority: 100,
        });
    }
    show(owner, size) {
        if (typeof size === 'number') {
            super.showItem(owner, BinarySize.formatSize(size));
        }
        else {
            this.hide(owner);
        }
    }
}
exports.BinarySizeStatusBarEntry = BinarySizeStatusBarEntry;
//# sourceMappingURL=binarySizeStatusBarEntry.js.map