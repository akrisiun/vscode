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
define(["require", "exports", "vs/nls", "os", "vs/platform/product/common/product", "vs/base/common/severity", "vs/base/common/platform", "vs/base/common/labels", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/dialogs/browser/dialogService", "vs/platform/log/common/log", "vs/platform/instantiation/common/extensions", "vs/platform/ipc/electron-browser/sharedProcessService", "vs/platform/dialogs/electron-browser/dialogIpc", "vs/platform/configuration/common/configuration", "vs/platform/layout/browser/layoutService", "vs/platform/theme/common/themeService", "vs/platform/keybinding/common/keybinding", "vs/platform/product/common/productService", "vs/platform/clipboard/common/clipboardService", "vs/platform/electron/node/electron"], function (require, exports, nls, os, product_1, severity_1, platform_1, labels_1, dialogs_1, dialogService_1, log_1, extensions_1, sharedProcessService_1, dialogIpc_1, configuration_1, layoutService_1, themeService_1, keybinding_1, productService_1, clipboardService_1, electron_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let DialogService = class DialogService {
        constructor(configurationService, logService, layoutService, themeService, sharedProcessService, keybindingService, productService, clipboardService, electronService) {
            this.configurationService = configurationService;
            this.customImpl = new dialogService_1.DialogService(logService, layoutService, themeService, keybindingService, productService, clipboardService);
            this.nativeImpl = new NativeDialogService(logService, sharedProcessService, electronService, clipboardService);
        }
        get useCustomDialog() {
            return this.configurationService.getValue('workbench.dialogs.customEnabled') === true;
        }
        confirm(confirmation) {
            if (this.useCustomDialog) {
                return this.customImpl.confirm(confirmation);
            }
            return this.nativeImpl.confirm(confirmation);
        }
        show(severity, message, buttons, options) {
            if (this.useCustomDialog) {
                return this.customImpl.show(severity, message, buttons, options);
            }
            return this.nativeImpl.show(severity, message, buttons, options);
        }
        about() {
            return this.nativeImpl.about();
        }
    };
    DialogService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, log_1.ILogService),
        __param(2, layoutService_1.ILayoutService),
        __param(3, themeService_1.IThemeService),
        __param(4, sharedProcessService_1.ISharedProcessService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, productService_1.IProductService),
        __param(7, clipboardService_1.IClipboardService),
        __param(8, electron_1.IElectronService)
    ], DialogService);
    exports.DialogService = DialogService;
    let NativeDialogService = class NativeDialogService {
        constructor(logService, sharedProcessService, electronService, clipboardService) {
            this.logService = logService;
            this.electronService = electronService;
            this.clipboardService = clipboardService;
            sharedProcessService.registerChannel('dialog', new dialogIpc_1.DialogChannel(this));
        }
        async confirm(confirmation) {
            this.logService.trace('DialogService#confirm', confirmation.message);
            const { options, buttonIndexMap } = this.massageMessageBoxOptions(this.getConfirmOptions(confirmation));
            const result = await this.electronService.showMessageBox(options);
            return {
                confirmed: buttonIndexMap[result.response] === 0 ? true : false,
                checkboxChecked: result.checkboxChecked
            };
        }
        getConfirmOptions(confirmation) {
            const buttons = [];
            if (confirmation.primaryButton) {
                buttons.push(confirmation.primaryButton);
            }
            else {
                buttons.push(nls.localize({ key: 'yesButton', comment: ['&& denotes a mnemonic'] }, "&&Yes"));
            }
            if (confirmation.secondaryButton) {
                buttons.push(confirmation.secondaryButton);
            }
            else if (typeof confirmation.secondaryButton === 'undefined') {
                buttons.push(nls.localize('cancelButton', "Cancel"));
            }
            const opts = {
                title: confirmation.title,
                message: confirmation.message,
                buttons,
                cancelId: 1
            };
            if (confirmation.detail) {
                opts.detail = confirmation.detail;
            }
            if (confirmation.type) {
                opts.type = confirmation.type;
            }
            if (confirmation.checkbox) {
                opts.checkboxLabel = confirmation.checkbox.label;
                opts.checkboxChecked = confirmation.checkbox.checked;
            }
            return opts;
        }
        async show(severity, message, buttons, dialogOptions) {
            this.logService.trace('DialogService#show', message);
            const { options, buttonIndexMap } = this.massageMessageBoxOptions({
                message,
                buttons,
                type: (severity === severity_1.default.Info) ? 'question' : (severity === severity_1.default.Error) ? 'error' : (severity === severity_1.default.Warning) ? 'warning' : 'none',
                cancelId: dialogOptions ? dialogOptions.cancelId : undefined,
                detail: dialogOptions ? dialogOptions.detail : undefined,
                checkboxLabel: dialogOptions && dialogOptions.checkbox ? dialogOptions.checkbox.label : undefined,
                checkboxChecked: dialogOptions && dialogOptions.checkbox ? dialogOptions.checkbox.checked : undefined
            });
            const result = await this.electronService.showMessageBox(options);
            return { choice: buttonIndexMap[result.response], checkboxChecked: result.checkboxChecked };
        }
        massageMessageBoxOptions(options) {
            let buttonIndexMap = (options.buttons || []).map((button, index) => index);
            let buttons = (options.buttons || []).map(button => labels_1.mnemonicButtonLabel(button));
            let cancelId = options.cancelId;
            // Linux: order of buttons is reverse
            // macOS: also reverse, but the OS handles this for us!
            if (platform_1.isLinux) {
                buttons = buttons.reverse();
                buttonIndexMap = buttonIndexMap.reverse();
            }
            // Default Button (always first one)
            options.defaultId = buttonIndexMap[0];
            // Cancel Button
            if (typeof cancelId === 'number') {
                // Ensure the cancelId is the correct one from our mapping
                cancelId = buttonIndexMap[cancelId];
                // macOS/Linux: the cancel button should always be to the left of the primary action
                // if we see more than 2 buttons, move the cancel one to the left of the primary
                if (!platform_1.isWindows && buttons.length > 2 && cancelId !== 1) {
                    const cancelButton = buttons[cancelId];
                    buttons.splice(cancelId, 1);
                    buttons.splice(1, 0, cancelButton);
                    const cancelButtonIndex = buttonIndexMap[cancelId];
                    buttonIndexMap.splice(cancelId, 1);
                    buttonIndexMap.splice(1, 0, cancelButtonIndex);
                    cancelId = 1;
                }
            }
            options.buttons = buttons;
            options.cancelId = cancelId;
            options.noLink = true;
            options.title = options.title || product_1.default.nameLong;
            return { options, buttonIndexMap };
        }
        async about() {
            let version = product_1.default.version;
            if (product_1.default.target) {
                version = `${version} (${product_1.default.target} setup)`;
            }
            const isSnap = process.platform === 'linux' && process.env.SNAP && process.env.SNAP_REVISION;
            const detail = nls.localize('aboutDetail', "Version: {0}\nCommit: {1}\nDate: {2}\nElectron: {3}\nChrome: {4}\nNode.js: {5}\nV8: {6}\nOS: {7}", version, product_1.default.commit || 'Unknown', product_1.default.date || 'Unknown', process.versions['electron'], process.versions['chrome'], process.versions['node'], process.versions['v8'], `${os.type()} ${os.arch()} ${os.release()}${isSnap ? ' snap' : ''}`);
            const ok = nls.localize('okButton', "OK");
            const copy = labels_1.mnemonicButtonLabel(nls.localize({ key: 'copy', comment: ['&& denotes a mnemonic'] }, "&&Copy"));
            let buttons;
            if (platform_1.isLinux) {
                buttons = [copy, ok];
            }
            else {
                buttons = [ok, copy];
            }
            const result = await this.electronService.showMessageBox({
                title: product_1.default.nameLong,
                type: 'info',
                message: product_1.default.nameLong,
                detail: `\n${detail}`,
                buttons,
                noLink: true,
                defaultId: buttons.indexOf(ok),
                cancelId: buttons.indexOf(ok)
            });
            if (buttons[result.response] === copy) {
                this.clipboardService.writeText(detail);
            }
        }
    };
    NativeDialogService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, sharedProcessService_1.ISharedProcessService),
        __param(2, electron_1.IElectronService),
        __param(3, clipboardService_1.IClipboardService)
    ], NativeDialogService);
    extensions_1.registerSingleton(dialogs_1.IDialogService, DialogService, true);
});
//# sourceMappingURL=dialogService.js.map