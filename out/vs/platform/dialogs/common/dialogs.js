/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/resources", "vs/nls"], function (require, exports, instantiation_1, resources_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IDialogService = instantiation_1.createDecorator('dialogService');
    exports.IFileDialogService = instantiation_1.createDecorator('fileDialogService');
    const MAX_CONFIRM_FILES = 10;
    function getConfirmMessage(start, resourcesToConfirm) {
        const message = [start];
        message.push('');
        message.push(...resourcesToConfirm.slice(0, MAX_CONFIRM_FILES).map(r => resources_1.basename(r)));
        if (resourcesToConfirm.length > MAX_CONFIRM_FILES) {
            if (resourcesToConfirm.length - MAX_CONFIRM_FILES === 1) {
                message.push(nls_1.localize('moreFile', "...1 additional file not shown"));
            }
            else {
                message.push(nls_1.localize('moreFiles', "...{0} additional files not shown", resourcesToConfirm.length - MAX_CONFIRM_FILES));
            }
        }
        message.push('');
        return message.join('\n');
    }
    exports.getConfirmMessage = getConfirmMessage;
});
//# sourceMappingURL=dialogs.js.map