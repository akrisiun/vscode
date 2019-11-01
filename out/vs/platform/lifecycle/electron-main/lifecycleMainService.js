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
define(["require", "exports", "electron", "vs/platform/log/common/log", "vs/platform/state/node/state", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/platform/lifecycle/common/lifecycle", "vs/base/common/platform", "vs/base/common/lifecycle", "vs/base/common/async"], function (require, exports, electron_1, log_1, state_1, event_1, instantiation_1, lifecycle_1, platform_1, lifecycle_2, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ILifecycleMainService = instantiation_1.createDecorator('lifecycleMainService');
    var UnloadReason;
    (function (UnloadReason) {
        UnloadReason[UnloadReason["CLOSE"] = 1] = "CLOSE";
        UnloadReason[UnloadReason["QUIT"] = 2] = "QUIT";
        UnloadReason[UnloadReason["RELOAD"] = 3] = "RELOAD";
        UnloadReason[UnloadReason["LOAD"] = 4] = "LOAD";
    })(UnloadReason = exports.UnloadReason || (exports.UnloadReason = {}));
    var LifecycleMainPhase;
    (function (LifecycleMainPhase) {
        /**
         * The first phase signals that we are about to startup.
         */
        LifecycleMainPhase[LifecycleMainPhase["Starting"] = 1] = "Starting";
        /**
         * Services are ready and first window is about to open.
         */
        LifecycleMainPhase[LifecycleMainPhase["Ready"] = 2] = "Ready";
        /**
         * This phase signals a point in time after the window has opened
         * and is typically the best place to do work that is not required
         * for the window to open.
         */
        LifecycleMainPhase[LifecycleMainPhase["AfterWindowOpen"] = 3] = "AfterWindowOpen";
    })(LifecycleMainPhase = exports.LifecycleMainPhase || (exports.LifecycleMainPhase = {}));
    let LifecycleMainService = class LifecycleMainService extends lifecycle_2.Disposable {
        constructor(logService, stateService) {
            super();
            this.logService = logService;
            this.stateService = stateService;
            this.windowToCloseRequest = new Set();
            this.oneTimeListenerTokenGenerator = 0;
            this.windowCounter = 0;
            this.pendingQuitPromise = null;
            this.pendingQuitPromiseResolve = null;
            this.pendingWillShutdownPromise = null;
            this._quitRequested = false;
            this._wasRestarted = false;
            this._onBeforeShutdown = this._register(new event_1.Emitter());
            this.onBeforeShutdown = this._onBeforeShutdown.event;
            this._onWillShutdown = this._register(new event_1.Emitter());
            this.onWillShutdown = this._onWillShutdown.event;
            this._onBeforeWindowClose = this._register(new event_1.Emitter());
            this.onBeforeWindowClose = this._onBeforeWindowClose.event;
            this._onBeforeWindowUnload = this._register(new event_1.Emitter());
            this.onBeforeWindowUnload = this._onBeforeWindowUnload.event;
            this._phase = 1 /* Starting */;
            this.phaseWhen = new Map();
            this.handleRestarted();
            this.when(2 /* Ready */).then(() => this.registerListeners());
        }
        get quitRequested() { return this._quitRequested; }
        get wasRestarted() { return this._wasRestarted; }
        get phase() { return this._phase; }
        handleRestarted() {
            this._wasRestarted = !!this.stateService.getItem(LifecycleMainService.QUIT_FROM_RESTART_MARKER);
            if (this._wasRestarted) {
                this.stateService.removeItem(LifecycleMainService.QUIT_FROM_RESTART_MARKER); // remove the marker right after if found
            }
        }
        registerListeners() {
            // before-quit: an event that is fired if application quit was
            // requested but before any window was closed.
            const beforeQuitListener = () => {
                if (this._quitRequested) {
                    return;
                }
                this.logService.trace('Lifecycle#app.on(before-quit)');
                this._quitRequested = true;
                // Emit event to indicate that we are about to shutdown
                this.logService.trace('Lifecycle#onBeforeShutdown.fire()');
                this._onBeforeShutdown.fire();
                // macOS: can run without any window open. in that case we fire
                // the onWillShutdown() event directly because there is no veto
                // to be expected.
                if (platform_1.isMacintosh && this.windowCounter === 0) {
                    this.beginOnWillShutdown();
                }
            };
            electron_1.app.addListener('before-quit', beforeQuitListener);
            // window-all-closed: an event that only fires when the last window
            // was closed. We override this event to be in charge if app.quit()
            // should be called or not.
            const windowAllClosedListener = () => {
                this.logService.trace('Lifecycle#app.on(window-all-closed)');
                // Windows/Linux: we quit when all windows have closed
                // Mac: we only quit when quit was requested
                if (this._quitRequested || !platform_1.isMacintosh) {
                    electron_1.app.quit();
                }
            };
            electron_1.app.addListener('window-all-closed', windowAllClosedListener);
            // will-quit: an event that is fired after all windows have been
            // closed, but before actually quitting.
            electron_1.app.once('will-quit', e => {
                this.logService.trace('Lifecycle#app.on(will-quit)');
                // Prevent the quit until the shutdown promise was resolved
                e.preventDefault();
                // Start shutdown sequence
                const shutdownPromise = this.beginOnWillShutdown();
                // Wait until shutdown is signaled to be complete
                shutdownPromise.finally(() => {
                    // Resolve pending quit promise now without veto
                    this.resolvePendingQuitPromise(false /* no veto */);
                    // Quit again, this time do not prevent this, since our
                    // will-quit listener is only installed "once". Also
                    // remove any listener we have that is no longer needed
                    electron_1.app.removeListener('before-quit', beforeQuitListener);
                    electron_1.app.removeListener('window-all-closed', windowAllClosedListener);
                    electron_1.app.quit();
                });
            });
        }
        beginOnWillShutdown() {
            if (this.pendingWillShutdownPromise) {
                return this.pendingWillShutdownPromise; // shutdown is already running
            }
            this.logService.trace('Lifecycle#onWillShutdown.fire()');
            const joiners = [];
            this._onWillShutdown.fire({
                join(promise) {
                    if (promise) {
                        joiners.push(promise);
                    }
                }
            });
            this.pendingWillShutdownPromise = Promise.all(joiners).then(() => undefined, err => this.logService.error(err));
            return this.pendingWillShutdownPromise;
        }
        set phase(value) {
            if (value < this.phase) {
                throw new Error('Lifecycle cannot go backwards');
            }
            if (this._phase === value) {
                return;
            }
            this.logService.trace(`lifecycle (main): phase changed (value: ${value})`);
            this._phase = value;
            const barrier = this.phaseWhen.get(this._phase);
            if (barrier) {
                barrier.open();
                this.phaseWhen.delete(this._phase);
            }
        }
        async when(phase) {
            if (phase <= this._phase) {
                return;
            }
            let barrier = this.phaseWhen.get(phase);
            if (!barrier) {
                barrier = new async_1.Barrier();
                this.phaseWhen.set(phase, barrier);
            }
            await barrier.wait();
        }
        registerWindow(window) {
            // track window count
            this.windowCounter++;
            // Window Before Closing: Main -> Renderer
            window.win.on('close', e => {
                // The window already acknowledged to be closed
                const windowId = window.id;
                if (this.windowToCloseRequest.has(windowId)) {
                    this.windowToCloseRequest.delete(windowId);
                    return;
                }
                this.logService.trace(`Lifecycle#window.on('close') - window ID ${window.id}`);
                // Otherwise prevent unload and handle it from window
                e.preventDefault();
                this.unload(window, 1 /* CLOSE */).then(veto => {
                    if (veto) {
                        this.windowToCloseRequest.delete(windowId);
                        return;
                    }
                    this.windowToCloseRequest.add(windowId);
                    // Fire onBeforeWindowClose before actually closing
                    this.logService.trace(`Lifecycle#onBeforeWindowClose.fire() - window ID ${windowId}`);
                    this._onBeforeWindowClose.fire(window);
                    // No veto, close window now
                    window.close();
                });
            });
            // Window After Closing
            window.win.on('closed', () => {
                this.logService.trace(`Lifecycle#window.on('closed') - window ID ${window.id}`);
                // update window count
                this.windowCounter--;
                // if there are no more code windows opened, fire the onWillShutdown event, unless
                // we are on macOS where it is perfectly fine to close the last window and
                // the application continues running (unless quit was actually requested)
                if (this.windowCounter === 0 && (!platform_1.isMacintosh || this._quitRequested)) {
                    this.beginOnWillShutdown();
                }
            });
        }
        async unload(window, reason) {
            // Always allow to unload a window that is not yet ready
            if (!window.isReady) {
                return Promise.resolve(false);
            }
            this.logService.trace(`Lifecycle#unload() - window ID ${window.id}`);
            // first ask the window itself if it vetos the unload
            const windowUnloadReason = this._quitRequested ? 2 /* QUIT */ : reason;
            let veto = await this.onBeforeUnloadWindowInRenderer(window, windowUnloadReason);
            if (veto) {
                this.logService.trace(`Lifecycle#unload() - veto in renderer (window ID ${window.id})`);
                return this.handleWindowUnloadVeto(veto);
            }
            // then check for vetos in the main side
            veto = await this.onBeforeUnloadWindowInMain(window, windowUnloadReason);
            if (veto) {
                this.logService.trace(`Lifecycle#unload() - veto in main (window ID ${window.id})`);
                return this.handleWindowUnloadVeto(veto);
            }
            this.logService.trace(`Lifecycle#unload() - no veto (window ID ${window.id})`);
            // finally if there are no vetos, unload the renderer
            await this.onWillUnloadWindowInRenderer(window, windowUnloadReason);
            return false;
        }
        handleWindowUnloadVeto(veto) {
            if (!veto) {
                return false; // no veto
            }
            // a veto resolves any pending quit with veto
            this.resolvePendingQuitPromise(true /* veto */);
            // a veto resets the pending quit request flag
            this._quitRequested = false;
            return true; // veto
        }
        resolvePendingQuitPromise(veto) {
            if (this.pendingQuitPromiseResolve) {
                this.pendingQuitPromiseResolve(veto);
                this.pendingQuitPromiseResolve = null;
                this.pendingQuitPromise = null;
            }
        }
        onBeforeUnloadWindowInRenderer(window, reason) {
            return new Promise(c => {
                const oneTimeEventToken = this.oneTimeListenerTokenGenerator++;
                const okChannel = `vscode:ok${oneTimeEventToken}`;
                const cancelChannel = `vscode:cancel${oneTimeEventToken}`;
                electron_1.ipcMain.once(okChannel, () => {
                    c(false); // no veto
                });
                electron_1.ipcMain.once(cancelChannel, () => {
                    c(true); // veto
                });
                window.send('vscode:onBeforeUnload', { okChannel, cancelChannel, reason });
            });
        }
        onBeforeUnloadWindowInMain(window, reason) {
            const vetos = [];
            this._onBeforeWindowUnload.fire({
                reason,
                window,
                veto(value) {
                    vetos.push(value);
                }
            });
            return lifecycle_1.handleVetos(vetos, err => this.logService.error(err));
        }
        onWillUnloadWindowInRenderer(window, reason) {
            return new Promise(resolve => {
                const oneTimeEventToken = this.oneTimeListenerTokenGenerator++;
                const replyChannel = `vscode:reply${oneTimeEventToken}`;
                electron_1.ipcMain.once(replyChannel, () => resolve());
                window.send('vscode:onWillUnload', { replyChannel, reason });
            });
        }
        quit(fromUpdate) {
            if (this.pendingQuitPromise) {
                return this.pendingQuitPromise;
            }
            this.logService.trace(`Lifecycle#quit() - from update: ${fromUpdate}`);
            // Remember the reason for quit was to restart
            if (fromUpdate) {
                this.stateService.setItem(LifecycleMainService.QUIT_FROM_RESTART_MARKER, true);
            }
            this.pendingQuitPromise = new Promise(resolve => {
                // Store as field to access it from a window cancellation
                this.pendingQuitPromiseResolve = resolve;
                // Calling app.quit() will trigger the close handlers of each opened window
                // and only if no window vetoed the shutdown, we will get the will-quit event
                this.logService.trace('Lifecycle#quit() - calling app.quit()');
                electron_1.app.quit();
            });
            return this.pendingQuitPromise;
        }
        relaunch(options) {
            this.logService.trace('Lifecycle#relaunch()');
            const args = process.argv.slice(1);
            if (options && options.addArgs) {
                args.push(...options.addArgs);
            }
            if (options && options.removeArgs) {
                for (const a of options.removeArgs) {
                    const idx = args.indexOf(a);
                    if (idx >= 0) {
                        args.splice(idx, 1);
                    }
                }
            }
            let quitVetoed = false;
            electron_1.app.once('quit', () => {
                if (!quitVetoed) {
                    // Remember the reason for quit was to restart
                    this.stateService.setItem(LifecycleMainService.QUIT_FROM_RESTART_MARKER, true);
                    // Windows: we are about to restart and as such we need to restore the original
                    // current working directory we had on startup to get the exact same startup
                    // behaviour. As such, we briefly change back to the VSCODE_CWD and then when
                    // Code starts it will set it back to the installation directory again.
                    try {
                        if (platform_1.isWindows) {
                            const vscodeCwd = process.env['VSCODE_CWD'];
                            if (vscodeCwd) {
                                process.chdir(vscodeCwd);
                            }
                        }
                    }
                    catch (err) {
                        this.logService.error(err);
                    }
                    // relaunch after we are sure there is no veto
                    this.logService.trace('Lifecycle#relaunch() - calling app.relaunch()');
                    electron_1.app.relaunch({ args });
                }
            });
            // app.relaunch() does not quit automatically, so we quit first,
            // check for vetoes and then relaunch from the app.on('quit') event
            this.quit().then(veto => quitVetoed = veto);
        }
        kill(code) {
            this.logService.trace('Lifecycle#kill()');
            electron_1.app.exit(code);
        }
    };
    LifecycleMainService.QUIT_FROM_RESTART_MARKER = 'quit.from.restart'; // use a marker to find out if the session was restarted
    LifecycleMainService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, state_1.IStateService)
    ], LifecycleMainService);
    exports.LifecycleMainService = LifecycleMainService;
});
//# sourceMappingURL=lifecycleMainService.js.map