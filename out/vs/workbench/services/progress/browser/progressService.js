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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/platform/progress/common/progress", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/services/statusbar/common/statusbar", "vs/base/common/async", "vs/workbench/services/activity/common/activity", "vs/platform/notification/common/notification", "vs/base/common/actions", "vs/base/common/event", "vs/platform/instantiation/common/extensions", "vs/platform/layout/browser/layoutService", "vs/base/browser/ui/dialog/dialog", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/keybinding/common/keybinding", "vs/base/browser/dom", "vs/workbench/services/panel/common/panelService", "vs/css!./media/progressService"], function (require, exports, nls_1, lifecycle_1, progress_1, viewlet_1, statusbar_1, async_1, activity_1, notification_1, actions_1, event_1, extensions_1, layoutService_1, dialog_1, styler_1, themeService_1, keybinding_1, dom_1, panelService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ProgressService = class ProgressService extends lifecycle_1.Disposable {
        constructor(activityService, viewletService, panelService, notificationService, statusbarService, layoutService, themeService, keybindingService) {
            super();
            this.activityService = activityService;
            this.viewletService = viewletService;
            this.panelService = panelService;
            this.notificationService = notificationService;
            this.statusbarService = statusbarService;
            this.layoutService = layoutService;
            this.themeService = themeService;
            this.keybindingService = keybindingService;
            this.stack = [];
            this.globalStatusEntry = this._register(new lifecycle_1.MutableDisposable());
        }
        async withProgress(options, task, onDidCancel) {
            const { location } = options;
            if (typeof location === 'string') {
                if (this.viewletService.getProgressIndicator(location)) {
                    return this.withViewletProgress(location, task, Object.assign(Object.assign({}, options), { location }));
                }
                if (this.panelService.getProgressIndicator(location)) {
                    return this.withPanelProgress(location, task, Object.assign(Object.assign({}, options), { location }));
                }
                throw new Error(`Bad progress location: ${location}`);
            }
            switch (location) {
                case 15 /* Notification */:
                    return this.withNotificationProgress(Object.assign(Object.assign({}, options), { location }), task, onDidCancel);
                case 10 /* Window */:
                    return this.withWindowProgress(Object.assign(Object.assign({}, options), { location }), task);
                case 1 /* Explorer */:
                    return this.withViewletProgress('workbench.view.explorer', task, Object.assign(Object.assign({}, options), { location }));
                case 3 /* Scm */:
                    return this.withViewletProgress('workbench.view.scm', task, Object.assign(Object.assign({}, options), { location }));
                case 5 /* Extensions */:
                    return this.withViewletProgress('workbench.view.extensions', task, Object.assign(Object.assign({}, options), { location }));
                case 20 /* Dialog */:
                    return this.withDialogProgress(options, task, onDidCancel);
                default:
                    throw new Error(`Bad progress location: ${location}`);
            }
        }
        withWindowProgress(options, callback) {
            const task = [options, new progress_1.Progress(() => this.updateWindowProgress())];
            const promise = callback(task[1]);
            let delayHandle = setTimeout(() => {
                delayHandle = undefined;
                this.stack.unshift(task);
                this.updateWindowProgress();
                // show progress for at least 150ms
                Promise.all([
                    async_1.timeout(150),
                    promise
                ]).finally(() => {
                    const idx = this.stack.indexOf(task);
                    this.stack.splice(idx, 1);
                    this.updateWindowProgress();
                });
            }, 150);
            // cancel delay if promise finishes below 150ms
            return promise.finally(() => clearTimeout(delayHandle));
        }
        updateWindowProgress(idx = 0) {
            this.globalStatusEntry.clear();
            if (idx < this.stack.length) {
                const [options, progress] = this.stack[idx];
                let progressTitle = options.title;
                let progressMessage = progress.value && progress.value.message;
                let progressCommand = options.command;
                let text;
                let title;
                if (progressTitle && progressMessage) {
                    // <title>: <message>
                    text = nls_1.localize('progress.text2', "{0}: {1}", progressTitle, progressMessage);
                    title = options.source ? nls_1.localize('progress.title3', "[{0}] {1}: {2}", options.source, progressTitle, progressMessage) : text;
                }
                else if (progressTitle) {
                    // <title>
                    text = progressTitle;
                    title = options.source ? nls_1.localize('progress.title2', "[{0}]: {1}", options.source, progressTitle) : text;
                }
                else if (progressMessage) {
                    // <message>
                    text = progressMessage;
                    title = options.source ? nls_1.localize('progress.title2', "[{0}]: {1}", options.source, progressMessage) : text;
                }
                else {
                    // no title, no message -> no progress. try with next on stack
                    this.updateWindowProgress(idx + 1);
                    return;
                }
                this.globalStatusEntry.value = this.statusbarService.addEntry({
                    text: `$(sync~spin) ${text}`,
                    tooltip: title,
                    command: progressCommand
                }, 'status.progress', nls_1.localize('status.progress', "Progress Message"), 0 /* LEFT */);
            }
        }
        withNotificationProgress(options, callback, onDidCancel) {
            const toDispose = new lifecycle_1.DisposableStore();
            const createNotification = (message, increment) => {
                if (!message) {
                    return undefined; // we need a message at least
                }
                const primaryActions = options.primaryActions ? Array.from(options.primaryActions) : [];
                const secondaryActions = options.secondaryActions ? Array.from(options.secondaryActions) : [];
                if (options.buttons) {
                    options.buttons.forEach((button, index) => {
                        const buttonAction = new class extends actions_1.Action {
                            constructor() {
                                super(`progress.button.${button}`, button, undefined, true);
                            }
                            run() {
                                if (typeof onDidCancel === 'function') {
                                    onDidCancel(index);
                                }
                                return Promise.resolve(undefined);
                            }
                        };
                        toDispose.add(buttonAction);
                        primaryActions.push(buttonAction);
                    });
                }
                if (options.cancellable) {
                    const cancelAction = new class extends actions_1.Action {
                        constructor() {
                            super('progress.cancel', nls_1.localize('cancel', "Cancel"), undefined, true);
                        }
                        run() {
                            if (typeof onDidCancel === 'function') {
                                onDidCancel();
                            }
                            return Promise.resolve(undefined);
                        }
                    };
                    toDispose.add(cancelAction);
                    primaryActions.push(cancelAction);
                }
                const actions = { primary: primaryActions, secondary: secondaryActions };
                const handle = this.notificationService.notify({
                    severity: notification_1.Severity.Info,
                    message,
                    source: options.source,
                    actions
                });
                updateProgress(handle, increment);
                event_1.Event.once(handle.onDidClose)(() => {
                    toDispose.dispose();
                });
                return handle;
            };
            const updateProgress = (notification, increment) => {
                if (typeof increment === 'number' && increment >= 0) {
                    notification.progress.total(100); // always percentage based
                    notification.progress.worked(increment);
                }
                else {
                    notification.progress.infinite();
                }
            };
            let handle;
            const updateNotification = (message, increment) => {
                if (!handle) {
                    handle = createNotification(message, increment);
                }
                else {
                    if (typeof message === 'string') {
                        let newMessage;
                        if (typeof options.title === 'string') {
                            newMessage = `${options.title}: ${message}`; // always prefix with overall title if we have it (https://github.com/Microsoft/vscode/issues/50932)
                        }
                        else {
                            newMessage = message;
                        }
                        handle.updateMessage(newMessage);
                    }
                    if (typeof increment === 'number') {
                        updateProgress(handle, increment);
                    }
                }
            };
            // Show initially
            updateNotification(options.title);
            // Update based on progress
            const promise = callback({
                report: progress => {
                    updateNotification(progress.message, progress.increment);
                }
            });
            // Show progress for at least 800ms and then hide once done or canceled
            Promise.all([async_1.timeout(800), promise]).finally(() => {
                if (handle) {
                    handle.close();
                }
            });
            return promise;
        }
        withViewletProgress(viewletId, task, options) {
            // show in viewlet
            const promise = this.withCompositeProgress(this.viewletService.getProgressIndicator(viewletId), task, options);
            // show activity bar
            let activityProgress;
            let delayHandle = setTimeout(() => {
                delayHandle = undefined;
                const handle = this.activityService.showActivity(viewletId, new activity_1.ProgressBadge(() => ''), 'progress-badge', 100);
                const startTimeVisible = Date.now();
                const minTimeVisible = 300;
                activityProgress = {
                    dispose() {
                        const d = Date.now() - startTimeVisible;
                        if (d < minTimeVisible) {
                            // should at least show for Nms
                            setTimeout(() => handle.dispose(), minTimeVisible - d);
                        }
                        else {
                            // shown long enough
                            handle.dispose();
                        }
                    }
                };
            }, options.delay || 300);
            promise.finally(() => {
                clearTimeout(delayHandle);
                lifecycle_1.dispose(activityProgress);
            });
            return promise;
        }
        withPanelProgress(panelid, task, options) {
            // show in panel
            return this.withCompositeProgress(this.panelService.getProgressIndicator(panelid), task, options);
        }
        withCompositeProgress(progressIndicator, task, options) {
            let progressRunner = undefined;
            const promise = task({
                report: progress => {
                    if (!progressRunner) {
                        return;
                    }
                    if (typeof progress.increment === 'number') {
                        progressRunner.worked(progress.increment);
                    }
                    if (typeof progress.total === 'number') {
                        progressRunner.total(progress.total);
                    }
                }
            });
            if (progressIndicator) {
                if (typeof options.total === 'number') {
                    progressRunner = progressIndicator.show(options.total, options.delay);
                    promise.catch(() => undefined /* ignore */).finally(() => progressRunner ? progressRunner.done() : undefined);
                }
                else {
                    progressIndicator.showWhile(promise, options.delay);
                }
            }
            return promise;
        }
        withDialogProgress(options, task, onDidCancel) {
            const disposables = new lifecycle_1.DisposableStore();
            const allowableCommands = [
                'workbench.action.quit',
                'workbench.action.reloadWindow',
                'copy',
                'cut'
            ];
            let dialog;
            const createDialog = (message) => {
                const buttons = options.buttons || [];
                buttons.push(options.cancellable ? nls_1.localize('cancel', "Cancel") : nls_1.localize('dismiss', "Dismiss"));
                dialog = new dialog_1.Dialog(this.layoutService.container, message, buttons, {
                    type: 'pending',
                    cancelId: buttons.length - 1,
                    keyEventProcessor: (event) => {
                        var _a;
                        const resolved = this.keybindingService.softDispatch(event, this.layoutService.container);
                        if ((_a = resolved) === null || _a === void 0 ? void 0 : _a.commandId) {
                            if (allowableCommands.indexOf(resolved.commandId) === -1) {
                                dom_1.EventHelper.stop(event, true);
                            }
                        }
                    }
                });
                disposables.add(dialog);
                disposables.add(styler_1.attachDialogStyler(dialog, this.themeService));
                dialog.show().then((dialogResult) => {
                    if (typeof onDidCancel === 'function') {
                        onDidCancel(dialogResult.button);
                    }
                    lifecycle_1.dispose(dialog);
                });
                return dialog;
            };
            const updateDialog = (message) => {
                if (message && !dialog) {
                    dialog = createDialog(message);
                }
                else if (message) {
                    dialog.updateMessage(message);
                }
            };
            const promise = task({
                report: progress => {
                    updateDialog(progress.message);
                }
            });
            promise.finally(() => {
                lifecycle_1.dispose(disposables);
            });
            return promise;
        }
    };
    ProgressService = __decorate([
        __param(0, activity_1.IActivityService),
        __param(1, viewlet_1.IViewletService),
        __param(2, panelService_1.IPanelService),
        __param(3, notification_1.INotificationService),
        __param(4, statusbar_1.IStatusbarService),
        __param(5, layoutService_1.ILayoutService),
        __param(6, themeService_1.IThemeService),
        __param(7, keybinding_1.IKeybindingService)
    ], ProgressService);
    exports.ProgressService = ProgressService;
    extensions_1.registerSingleton(progress_1.IProgressService, ProgressService, true);
});
//# sourceMappingURL=progressService.js.map