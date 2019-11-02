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
define(["require", "exports", "os", "vs/base/common/path", "vs/base/common/platform", "node-pty", "fs", "vs/base/common/event", "vs/workbench/contrib/terminal/node/terminal", "vs/base/common/lifecycle", "vs/workbench/contrib/terminal/common/terminal", "child_process", "vs/platform/log/common/log", "vs/base/node/pfs", "vs/workbench/contrib/terminal/node/terminalEnvironment", "vs/base/common/uri"], function (require, exports, os, path, platform, pty, fs, event_1, terminal_1, lifecycle_1, terminal_2, child_process_1, log_1, pfs_1, terminalEnvironment_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TerminalProcess = class TerminalProcess extends lifecycle_1.Disposable {
        constructor(shellLaunchConfig, cwd, cols, rows, env, windowsEnableConpty, _logService) {
            super();
            this._logService = _logService;
            this._currentTitle = '';
            this._isDisposed = false;
            this._titleInterval = null;
            this._onProcessData = this._register(new event_1.Emitter());
            this._onProcessExit = this._register(new event_1.Emitter());
            this._onProcessReady = this._register(new event_1.Emitter());
            this._onProcessTitleChanged = this._register(new event_1.Emitter());
            let shellName;
            if (os.platform() === 'win32') {
                shellName = path.basename(shellLaunchConfig.executable || '');
            }
            else {
                // Using 'xterm-256color' here helps ensure that the majority of Linux distributions will use a
                // color prompt as defined in the default ~/.bashrc file.
                shellName = 'xterm-256color';
            }
            this._initialCwd = cwd;
            const useConpty = windowsEnableConpty && process.platform === 'win32' && terminal_1.getWindowsBuildNumber() >= 18309;
            const options = {
                name: shellName,
                cwd,
                env,
                cols,
                rows,
                experimentalUseConpty: useConpty,
                // This option will force conpty to not redraw the whole viewport on launch
                conptyInheritCursor: useConpty && !!shellLaunchConfig.initialText
            };
            const cwdVerification = pfs_1.stat(cwd).then(async (stat) => {
                if (!stat.isDirectory()) {
                    return Promise.reject(terminal_2.SHELL_CWD_INVALID_EXIT_CODE);
                }
            }, async (err) => {
                if (err && err.code === 'ENOENT') {
                    // So we can include in the error message the specified CWD
                    shellLaunchConfig.cwd = cwd;
                    return Promise.reject(terminal_2.SHELL_CWD_INVALID_EXIT_CODE);
                }
            });
            const executableVerification = pfs_1.stat(shellLaunchConfig.executable).then(async (stat) => {
                if (!stat.isFile() && !stat.isSymbolicLink()) {
                    return Promise.reject(stat.isDirectory() ? terminal_2.SHELL_PATH_DIRECTORY_EXIT_CODE : terminal_2.SHELL_PATH_INVALID_EXIT_CODE);
                }
            }, async (err) => {
                if (err && err.code === 'ENOENT') {
                    let cwd = shellLaunchConfig.cwd instanceof uri_1.URI ? shellLaunchConfig.cwd.path : shellLaunchConfig.cwd;
                    // Try to get path
                    const envPaths = (shellLaunchConfig.env && shellLaunchConfig.env.PATH) ? shellLaunchConfig.env.PATH.split(path.delimiter) : undefined;
                    const executable = await terminalEnvironment_1.findExecutable(shellLaunchConfig.executable, cwd, envPaths);
                    if (!executable) {
                        return Promise.reject(terminal_2.SHELL_PATH_INVALID_EXIT_CODE);
                    }
                }
            });
            Promise.all([cwdVerification, executableVerification]).then(() => {
                this.setupPtyProcess(shellLaunchConfig, options);
            }).catch((exitCode) => {
                return this._launchFailed(exitCode);
            });
        }
        get onProcessData() { return this._onProcessData.event; }
        get onProcessExit() { return this._onProcessExit.event; }
        get onProcessReady() { return this._onProcessReady.event; }
        get onProcessTitleChanged() { return this._onProcessTitleChanged.event; }
        _launchFailed(exitCode) {
            this._exitCode = exitCode;
            this._queueProcessExit();
            this._processStartupComplete = Promise.resolve(undefined);
        }
        setupPtyProcess(shellLaunchConfig, options) {
            const args = shellLaunchConfig.args || [];
            this._logService.trace('IPty#spawn', shellLaunchConfig.executable, args, options);
            const ptyProcess = pty.spawn(shellLaunchConfig.executable, args, options);
            this._ptyProcess = ptyProcess;
            this._processStartupComplete = new Promise(c => {
                this.onProcessReady(() => c());
            });
            ptyProcess.on('data', data => {
                this._onProcessData.fire(data);
                if (this._closeTimeout) {
                    clearTimeout(this._closeTimeout);
                    this._queueProcessExit();
                }
            });
            ptyProcess.on('exit', code => {
                this._exitCode = code;
                this._queueProcessExit();
            });
            this._setupTitlePolling(ptyProcess);
            // TODO: We should no longer need to delay this since pty.spawn is sync
            setTimeout(() => {
                this._sendProcessId(ptyProcess);
            }, 500);
        }
        dispose() {
            this._isDisposed = true;
            if (this._titleInterval) {
                clearInterval(this._titleInterval);
            }
            this._titleInterval = null;
            this._onProcessData.dispose();
            this._onProcessExit.dispose();
            this._onProcessReady.dispose();
            this._onProcessTitleChanged.dispose();
            super.dispose();
        }
        _setupTitlePolling(ptyProcess) {
            // Send initial timeout async to give event listeners a chance to init
            setTimeout(() => {
                this._sendProcessTitle(ptyProcess);
            }, 0);
            // Setup polling for non-Windows, for Windows `process` doesn't change
            if (!platform.isWindows) {
                this._titleInterval = setInterval(() => {
                    if (this._currentTitle !== ptyProcess.process) {
                        this._sendProcessTitle(ptyProcess);
                    }
                }, 200);
            }
        }
        // Allow any trailing data events to be sent before the exit event is sent.
        // See https://github.com/Tyriar/node-pty/issues/72
        _queueProcessExit() {
            if (this._closeTimeout) {
                clearTimeout(this._closeTimeout);
            }
            this._closeTimeout = setTimeout(() => this._kill(), 250);
        }
        _kill() {
            // Wait to kill to process until the start up code has run. This prevents us from firing a process exit before a
            // process start.
            this._processStartupComplete.then(() => {
                if (this._isDisposed) {
                    return;
                }
                // Attempt to kill the pty, it may have already been killed at this
                // point but we want to make sure
                try {
                    if (this._ptyProcess) {
                        this._logService.trace('IPty#kill');
                        this._ptyProcess.kill();
                    }
                }
                catch (ex) {
                    // Swallow, the pty has already been killed
                }
                this._onProcessExit.fire(this._exitCode || 0);
                this.dispose();
            });
        }
        _sendProcessId(ptyProcess) {
            this._onProcessReady.fire({ pid: ptyProcess.pid, cwd: this._initialCwd });
        }
        _sendProcessTitle(ptyProcess) {
            if (this._isDisposed) {
                return;
            }
            this._currentTitle = ptyProcess.process;
            this._onProcessTitleChanged.fire(this._currentTitle);
        }
        shutdown(immediate) {
            if (immediate) {
                this._kill();
            }
            else {
                this._queueProcessExit();
            }
        }
        input(data) {
            if (this._isDisposed || !this._ptyProcess) {
                return;
            }
            this._logService.trace('IPty#write', `${data.length} characters`);
            this._ptyProcess.write(data);
        }
        resize(cols, rows) {
            if (this._isDisposed) {
                return;
            }
            if (typeof cols !== 'number' || typeof rows !== 'number' || isNaN(cols) || isNaN(rows)) {
                return;
            }
            // Ensure that cols and rows are always >= 1, this prevents a native
            // exception in winpty.
            if (this._ptyProcess) {
                cols = Math.max(cols, 1);
                rows = Math.max(rows, 1);
                this._logService.trace('IPty#resize', cols, rows);
                try {
                    this._ptyProcess.resize(cols, rows);
                }
                catch (e) {
                    // Swallow error if the pty has already exited
                    if (this._exitCode !== undefined) {
                        throw e;
                    }
                }
            }
        }
        getInitialCwd() {
            return Promise.resolve(this._initialCwd);
        }
        getCwd() {
            if (platform.isMacintosh) {
                return new Promise(resolve => {
                    if (!this._ptyProcess) {
                        resolve(this._initialCwd);
                        return;
                    }
                    this._logService.trace('IPty#pid');
                    child_process_1.exec('lsof -OPl -p ' + this._ptyProcess.pid + ' | grep cwd', (error, stdout, stderr) => {
                        if (stdout !== '') {
                            resolve(stdout.substring(stdout.indexOf('/'), stdout.length - 1));
                        }
                    });
                });
            }
            if (platform.isLinux) {
                return new Promise(resolve => {
                    if (!this._ptyProcess) {
                        resolve(this._initialCwd);
                        return;
                    }
                    this._logService.trace('IPty#pid');
                    fs.readlink('/proc/' + this._ptyProcess.pid + '/cwd', (err, linkedstr) => {
                        if (err) {
                            resolve(this._initialCwd);
                        }
                        resolve(linkedstr);
                    });
                });
            }
            return new Promise(resolve => {
                resolve(this._initialCwd);
            });
        }
        getLatency() {
            return Promise.resolve(0);
        }
    };
    TerminalProcess = __decorate([
        __param(6, log_1.ILogService)
    ], TerminalProcess);
    exports.TerminalProcess = TerminalProcess;
});
//# sourceMappingURL=terminalProcess.js.map