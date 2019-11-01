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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/extensions/common/extensions", "vs/base/common/lifecycle", "vs/base/common/errors", "vs/workbench/services/statusbar/common/statusbar", "vs/workbench/contrib/extensions/electron-browser/runtimeExtensionsEditor", "vs/workbench/services/editor/common/editorService", "vs/platform/electron/node/electron", "vs/platform/dialogs/common/dialogs", "vs/base/node/ports", "vs/platform/product/common/product", "vs/workbench/contrib/extensions/electron-browser/runtimeExtensionsInput", "vs/platform/extensions/common/extensions", "vs/workbench/services/extensions/electron-browser/extensionHostProfiler", "vs/platform/commands/common/commands"], function (require, exports, nls, event_1, instantiation_1, extensions_1, lifecycle_1, errors_1, statusbar_1, runtimeExtensionsEditor_1, editorService_1, electron_1, dialogs_1, ports_1, product_1, runtimeExtensionsInput_1, extensions_2, extensionHostProfiler_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ExtensionHostProfileService = class ExtensionHostProfileService extends lifecycle_1.Disposable {
        constructor(_extensionService, _editorService, _instantiationService, _electronService, _dialogService, _statusbarService) {
            super();
            this._extensionService = _extensionService;
            this._editorService = _editorService;
            this._instantiationService = _instantiationService;
            this._electronService = _electronService;
            this._dialogService = _dialogService;
            this._statusbarService = _statusbarService;
            this._onDidChangeState = this._register(new event_1.Emitter());
            this.onDidChangeState = this._onDidChangeState.event;
            this._onDidChangeLastProfile = this._register(new event_1.Emitter());
            this.onDidChangeLastProfile = this._onDidChangeLastProfile.event;
            this._unresponsiveProfiles = new Map();
            this._state = runtimeExtensionsEditor_1.ProfileSessionState.None;
            this.profilingStatusBarIndicatorLabelUpdater = this._register(new lifecycle_1.MutableDisposable());
            this._profile = null;
            this._profileSession = null;
            this._setState(runtimeExtensionsEditor_1.ProfileSessionState.None);
            commands_1.CommandsRegistry.registerCommand('workbench.action.extensionHostProfilder.stop', () => {
                this.stopProfiling();
                this._editorService.openEditor(this._instantiationService.createInstance(runtimeExtensionsInput_1.RuntimeExtensionsInput), { revealIfOpened: true });
            });
        }
        get state() { return this._state; }
        get lastProfile() { return this._profile; }
        _setState(state) {
            if (this._state === state) {
                return;
            }
            this._state = state;
            if (this._state === runtimeExtensionsEditor_1.ProfileSessionState.Running) {
                this.updateProfilingStatusBarIndicator(true);
            }
            else if (this._state === runtimeExtensionsEditor_1.ProfileSessionState.Stopping) {
                this.updateProfilingStatusBarIndicator(false);
            }
            this._onDidChangeState.fire(undefined);
        }
        updateProfilingStatusBarIndicator(visible) {
            this.profilingStatusBarIndicatorLabelUpdater.clear();
            if (visible) {
                const indicator = {
                    text: nls.localize('profilingExtensionHost', "$(sync~spin) Profiling Extension Host"),
                    tooltip: nls.localize('selectAndStartDebug', "Click to stop profiling."),
                    command: 'workbench.action.extensionHostProfilder.stop'
                };
                const timeStarted = Date.now();
                const handle = setInterval(() => {
                    if (this.profilingStatusBarIndicator) {
                        this.profilingStatusBarIndicator.update(Object.assign(Object.assign({}, indicator), { text: nls.localize('profilingExtensionHostTime', "$(sync~spin) Profiling Extension Host ({0} sec)", Math.round((new Date().getTime() - timeStarted) / 1000)) }));
                    }
                }, 1000);
                this.profilingStatusBarIndicatorLabelUpdater.value = lifecycle_1.toDisposable(() => clearInterval(handle));
                if (!this.profilingStatusBarIndicator) {
                    this.profilingStatusBarIndicator = this._statusbarService.addEntry(indicator, 'status.profiler', nls.localize('status.profiler', "Extension Profiler"), 1 /* RIGHT */);
                }
                else {
                    this.profilingStatusBarIndicator.update(indicator);
                }
            }
            else {
                if (this.profilingStatusBarIndicator) {
                    this.profilingStatusBarIndicator.dispose();
                    this.profilingStatusBarIndicator = undefined;
                }
            }
        }
        startProfiling() {
            if (this._state !== runtimeExtensionsEditor_1.ProfileSessionState.None) {
                return null;
            }
            const inspectPort = this._extensionService.getInspectPort();
            if (!inspectPort) {
                return this._dialogService.confirm({
                    type: 'info',
                    message: nls.localize('restart1', "Profile Extensions"),
                    detail: nls.localize('restart2', "In order to profile extensions a restart is required. Do you want to restart '{0}' now?", product_1.default.nameLong),
                    primaryButton: nls.localize('restart3', "Restart"),
                    secondaryButton: nls.localize('cancel', "Cancel")
                }).then(res => {
                    if (res.confirmed) {
                        this._electronService.relaunch({ addArgs: [`--inspect-extensions=${ports_1.randomPort()}`] });
                    }
                });
            }
            this._setState(runtimeExtensionsEditor_1.ProfileSessionState.Starting);
            return this._instantiationService.createInstance(extensionHostProfiler_1.ExtensionHostProfiler, inspectPort).start().then((value) => {
                this._profileSession = value;
                this._setState(runtimeExtensionsEditor_1.ProfileSessionState.Running);
            }, (err) => {
                errors_1.onUnexpectedError(err);
                this._setState(runtimeExtensionsEditor_1.ProfileSessionState.None);
            });
        }
        stopProfiling() {
            if (this._state !== runtimeExtensionsEditor_1.ProfileSessionState.Running || !this._profileSession) {
                return;
            }
            this._setState(runtimeExtensionsEditor_1.ProfileSessionState.Stopping);
            this._profileSession.stop().then((result) => {
                this._setLastProfile(result);
                this._setState(runtimeExtensionsEditor_1.ProfileSessionState.None);
            }, (err) => {
                errors_1.onUnexpectedError(err);
                this._setState(runtimeExtensionsEditor_1.ProfileSessionState.None);
            });
            this._profileSession = null;
        }
        _setLastProfile(profile) {
            this._profile = profile;
            this._onDidChangeLastProfile.fire(undefined);
        }
        getUnresponsiveProfile(extensionId) {
            return this._unresponsiveProfiles.get(extensions_2.ExtensionIdentifier.toKey(extensionId));
        }
        setUnresponsiveProfile(extensionId, profile) {
            this._unresponsiveProfiles.set(extensions_2.ExtensionIdentifier.toKey(extensionId), profile);
            this._setLastProfile(profile);
        }
    };
    ExtensionHostProfileService = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, editorService_1.IEditorService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, electron_1.IElectronService),
        __param(4, dialogs_1.IDialogService),
        __param(5, statusbar_1.IStatusbarService)
    ], ExtensionHostProfileService);
    exports.ExtensionHostProfileService = ExtensionHostProfileService;
});
//# sourceMappingURL=extensionProfileService.js.map