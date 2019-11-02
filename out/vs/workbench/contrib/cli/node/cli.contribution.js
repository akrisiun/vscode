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
define(["require", "exports", "vs/nls", "vs/base/common/path", "child_process", "vs/base/node/pfs", "vs/base/node/extpath", "vs/base/common/platform", "util", "vs/base/common/actions", "vs/workbench/common/actions", "vs/platform/registry/common/platform", "vs/platform/actions/common/actions", "vs/platform/product/common/product", "vs/platform/notification/common/notification", "vs/platform/dialogs/common/dialogs", "vs/base/common/severity", "vs/platform/log/common/log", "vs/base/common/amd"], function (require, exports, nls, path, cp, pfs, extpath, platform, util_1, actions_1, actions_2, platform_1, actions_3, product_1, notification_1, dialogs_1, severity_1, log_1, amd_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function ignore(code, value) {
        return err => err.code === code ? Promise.resolve(value) : Promise.reject(err);
    }
    let _source = null;
    function getSource() {
        if (!_source) {
            const root = amd_1.getPathFromAmdModule(require, '');
            _source = path.resolve(root, '..', 'bin', 'code');
        }
        return _source;
    }
    function isAvailable() {
        return Promise.resolve(pfs.exists(getSource()));
    }
    let InstallAction = class InstallAction extends actions_1.Action {
        constructor(id, label, notificationService, dialogService, logService) {
            super(id, label);
            this.notificationService = notificationService;
            this.dialogService = dialogService;
            this.logService = logService;
        }
        get target() {
            return `/usr/local/bin/${product_1.default.applicationName}`;
        }
        run() {
            return isAvailable().then(isAvailable => {
                if (!isAvailable) {
                    const message = nls.localize('not available', "This command is not available");
                    this.notificationService.info(message);
                    return undefined;
                }
                return this.isInstalled()
                    .then(isInstalled => {
                    if (!isAvailable || isInstalled) {
                        return Promise.resolve(null);
                    }
                    else {
                        return pfs.unlink(this.target)
                            .then(undefined, ignore('ENOENT', null))
                            .then(() => pfs.symlink(getSource(), this.target))
                            .then(undefined, err => {
                            if (err.code === 'EACCES' || err.code === 'ENOENT') {
                                return this.createBinFolderAndSymlinkAsAdmin();
                            }
                            return Promise.reject(err);
                        });
                    }
                })
                    .then(() => {
                    this.logService.trace('cli#install', this.target);
                    this.notificationService.info(nls.localize('successIn', "Shell command '{0}' successfully installed in PATH.", product_1.default.applicationName));
                });
            });
        }
        isInstalled() {
            return pfs.lstat(this.target)
                .then(stat => stat.isSymbolicLink())
                .then(() => extpath.realpath(this.target))
                .then(link => link === getSource())
                .then(undefined, ignore('ENOENT', false));
        }
        createBinFolderAndSymlinkAsAdmin() {
            return new Promise((resolve, reject) => {
                const buttons = [nls.localize('ok', "OK"), nls.localize('cancel2', "Cancel")];
                this.dialogService.show(severity_1.default.Info, nls.localize('warnEscalation', "Code will now prompt with 'osascript' for Administrator privileges to install the shell command."), buttons, { cancelId: 1 }).then(result => {
                    switch (result.choice) {
                        case 0 /* OK */:
                            const command = 'osascript -e "do shell script \\"mkdir -p /usr/local/bin && ln -sf \'' + getSource() + '\' \'' + this.target + '\'\\" with administrator privileges"';
                            util_1.promisify(cp.exec)(command, {})
                                .then(undefined, _ => Promise.reject(new Error(nls.localize('cantCreateBinFolder', "Unable to create '/usr/local/bin'."))))
                                .then(resolve, reject);
                            break;
                        case 1 /* Cancel */:
                            reject(new Error(nls.localize('aborted', "Aborted")));
                            break;
                    }
                });
            });
        }
    };
    InstallAction.ID = 'workbench.action.installCommandLine';
    InstallAction.LABEL = nls.localize('install', "Install '{0}' command in PATH", product_1.default.applicationName);
    InstallAction = __decorate([
        __param(2, notification_1.INotificationService),
        __param(3, dialogs_1.IDialogService),
        __param(4, log_1.ILogService)
    ], InstallAction);
    let UninstallAction = class UninstallAction extends actions_1.Action {
        constructor(id, label, notificationService, logService, dialogService) {
            super(id, label);
            this.notificationService = notificationService;
            this.logService = logService;
            this.dialogService = dialogService;
        }
        get target() {
            return `/usr/local/bin/${product_1.default.applicationName}`;
        }
        run() {
            return isAvailable().then(isAvailable => {
                if (!isAvailable) {
                    const message = nls.localize('not available', "This command is not available");
                    this.notificationService.info(message);
                    return undefined;
                }
                const uninstall = () => {
                    return pfs.unlink(this.target)
                        .then(undefined, ignore('ENOENT', null));
                };
                return uninstall().then(undefined, err => {
                    if (err.code === 'EACCES') {
                        return this.deleteSymlinkAsAdmin();
                    }
                    return Promise.reject(err);
                }).then(() => {
                    this.logService.trace('cli#uninstall', this.target);
                    this.notificationService.info(nls.localize('successFrom', "Shell command '{0}' successfully uninstalled from PATH.", product_1.default.applicationName));
                });
            });
        }
        deleteSymlinkAsAdmin() {
            return new Promise(async (resolve, reject) => {
                const buttons = [nls.localize('ok', "OK"), nls.localize('cancel2', "Cancel")];
                const { choice } = await this.dialogService.show(severity_1.default.Info, nls.localize('warnEscalationUninstall', "Code will now prompt with 'osascript' for Administrator privileges to uninstall the shell command."), buttons, { cancelId: 1 });
                switch (choice) {
                    case 0 /* OK */:
                        const command = 'osascript -e "do shell script \\"rm \'' + this.target + '\'\\" with administrator privileges"';
                        util_1.promisify(cp.exec)(command, {})
                            .then(undefined, _ => Promise.reject(new Error(nls.localize('cantUninstall', "Unable to uninstall the shell command '{0}'.", this.target))))
                            .then(resolve, reject);
                        break;
                    case 1 /* Cancel */:
                        reject(new Error(nls.localize('aborted', "Aborted")));
                        break;
                }
            });
        }
    };
    UninstallAction.ID = 'workbench.action.uninstallCommandLine';
    UninstallAction.LABEL = nls.localize('uninstall', "Uninstall '{0}' command from PATH", product_1.default.applicationName);
    UninstallAction = __decorate([
        __param(2, notification_1.INotificationService),
        __param(3, log_1.ILogService),
        __param(4, dialogs_1.IDialogService)
    ], UninstallAction);
    if (platform.isMacintosh) {
        const category = nls.localize('shellCommand', "Shell Command");
        const workbenchActionsRegistry = platform_1.Registry.as(actions_2.Extensions.WorkbenchActions);
        workbenchActionsRegistry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(InstallAction, InstallAction.ID, InstallAction.LABEL), `Shell Command: Install \'${product_1.default.applicationName}\' command in PATH`, category);
        workbenchActionsRegistry.registerWorkbenchAction(new actions_3.SyncActionDescriptor(UninstallAction, UninstallAction.ID, UninstallAction.LABEL), `Shell Command: Uninstall \'${product_1.default.applicationName}\' command from PATH`, category);
    }
});
//# sourceMappingURL=cli.contribution.js.map