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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "electron", "vs/base/common/async", "vs/platform/state/node/state", "vs/base/common/platform", "vs/base/common/path", "vs/base/common/normalization", "vs/base/node/pfs", "vs/base/common/types", "vs/nls", "vs/platform/workspaces/common/workspaces", "vs/base/common/labels"], function (require, exports, instantiation_1, electron_1, async_1, state_1, platform_1, path_1, normalization_1, pfs_1, types_1, nls_1, workspaces_1, labels_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IDialogMainService = instantiation_1.createDecorator('dialogMainService');
    let DialogMainService = class DialogMainService {
        constructor(stateService) {
            this.stateService = stateService;
            this.mapWindowToDialogQueue = new Map();
            this.noWindowDialogQueue = new async_1.Queue();
        }
        pickFileFolder(options, window) {
            return this.doPick(Object.assign(Object.assign({}, options), { pickFolders: true, pickFiles: true, title: nls_1.localize('open', "Open") }), window);
        }
        pickFolder(options, window) {
            return this.doPick(Object.assign(Object.assign({}, options), { pickFolders: true, title: nls_1.localize('openFolder', "Open Folder") }), window);
        }
        pickFile(options, window) {
            return this.doPick(Object.assign(Object.assign({}, options), { pickFiles: true, title: nls_1.localize('openFile', "Open File") }), window);
        }
        pickWorkspace(options, window) {
            const title = nls_1.localize('openWorkspaceTitle', "Open Workspace");
            const buttonLabel = labels_1.mnemonicButtonLabel(nls_1.localize({ key: 'openWorkspace', comment: ['&& denotes a mnemonic'] }, "&&Open"));
            const filters = workspaces_1.WORKSPACE_FILTER;
            return this.doPick(Object.assign(Object.assign({}, options), { pickFiles: true, title, filters, buttonLabel }), window);
        }
        async doPick(options, window) {
            // Ensure dialog options
            const dialogOptions = {
                title: options.title,
                buttonLabel: options.buttonLabel,
                filters: options.filters
            };
            // Ensure defaultPath
            dialogOptions.defaultPath = options.defaultPath || this.stateService.getItem(DialogMainService.workingDirPickerStorageKey);
            // Ensure properties
            if (typeof options.pickFiles === 'boolean' || typeof options.pickFolders === 'boolean') {
                dialogOptions.properties = undefined; // let it override based on the booleans
                if (options.pickFiles && options.pickFolders) {
                    dialogOptions.properties = ['multiSelections', 'openDirectory', 'openFile', 'createDirectory'];
                }
            }
            if (!dialogOptions.properties) {
                dialogOptions.properties = ['multiSelections', options.pickFolders ? 'openDirectory' : 'openFile', 'createDirectory'];
            }
            if (platform_1.isMacintosh) {
                dialogOptions.properties.push('treatPackageAsDirectory'); // always drill into .app files
            }
            // Show Dialog
            const windowToUse = window || electron_1.BrowserWindow.getFocusedWindow();
            const result = await this.showOpenDialog(dialogOptions, types_1.withNullAsUndefined(windowToUse));
            if (result && result.filePaths && result.filePaths.length > 0) {
                // Remember path in storage for next time
                this.stateService.setItem(DialogMainService.workingDirPickerStorageKey, path_1.dirname(result.filePaths[0]));
                return result.filePaths;
            }
            return;
        }
        getDialogQueue(window) {
            if (!window) {
                return this.noWindowDialogQueue;
            }
            let windowDialogQueue = this.mapWindowToDialogQueue.get(window.id);
            if (!windowDialogQueue) {
                windowDialogQueue = new async_1.Queue();
                this.mapWindowToDialogQueue.set(window.id, windowDialogQueue);
            }
            return windowDialogQueue;
        }
        showMessageBox(options, window) {
            return this.getDialogQueue(window).queue(async () => {
                return new Promise(resolve => {
                    if (window) {
                        return electron_1.dialog.showMessageBox(window, options, (response, checkboxChecked) => resolve({ response, checkboxChecked }));
                    }
                    return electron_1.dialog.showMessageBox(options);
                });
            });
        }
        showSaveDialog(options, window) {
            function normalizePath(path) {
                if (path && platform_1.isMacintosh) {
                    path = normalization_1.normalizeNFC(path); // normalize paths returned from the OS
                }
                return path;
            }
            return this.getDialogQueue(window).queue(async () => {
                return new Promise(resolve => {
                    if (window) {
                        electron_1.dialog.showSaveDialog(window, options, filePath => resolve({ filePath }));
                    }
                    else {
                        electron_1.dialog.showSaveDialog(options, filePath => resolve({ filePath }));
                    }
                }).then(result => {
                    result.filePath = normalizePath(result.filePath);
                    return result;
                });
            });
        }
        showOpenDialog(options, window) {
            function normalizePaths(paths) {
                if (paths && paths.length > 0 && platform_1.isMacintosh) {
                    paths = paths.map(path => normalization_1.normalizeNFC(path)); // normalize paths returned from the OS
                }
                return paths;
            }
            return this.getDialogQueue(window).queue(async () => {
                // Ensure the path exists (if provided)
                if (options.defaultPath) {
                    const pathExists = await pfs_1.exists(options.defaultPath);
                    if (!pathExists) {
                        options.defaultPath = undefined;
                    }
                }
                // Show dialog
                return new Promise(resolve => {
                    if (window) {
                        electron_1.dialog.showOpenDialog(window, options, filePaths => resolve({ filePaths }));
                    }
                    else {
                        electron_1.dialog.showOpenDialog(options, filePaths => resolve({ filePaths }));
                    }
                }).then(result => {
                    result.filePaths = normalizePaths(result.filePaths);
                    return result;
                });
            });
        }
    };
    DialogMainService.workingDirPickerStorageKey = 'pickerWorkingDir';
    DialogMainService = __decorate([
        __param(0, state_1.IStateService)
    ], DialogMainService);
    exports.DialogMainService = DialogMainService;
});
//# sourceMappingURL=dialogs.js.map