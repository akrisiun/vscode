/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/platform/dialogs/common/dialogs"], function (require, exports, dialogs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let DialogChannel = class DialogChannel {
        constructor(dialogService) {
            this.dialogService = dialogService;
        }
        listen(_, event) {
            throw new Error(`Event not found: ${event}`);
        }
        call(_, command, args) {
            switch (command) {
                case 'show': return this.dialogService.show(args[0], args[1], args[2]);
                case 'confirm': return this.dialogService.confirm(args[0]);
                case 'about': return this.dialogService.about();
            }
            return Promise.reject(new Error('invalid command'));
        }
    };
    DialogChannel = __decorate([
        __param(0, dialogs_1.IDialogService)
    ], DialogChannel);
    exports.DialogChannel = DialogChannel;
});
//# sourceMappingURL=dialogIpc.js.map