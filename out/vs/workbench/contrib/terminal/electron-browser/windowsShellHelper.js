/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/common/event", "vs/workbench/contrib/terminal/common/terminal", "vs/base/common/lifecycle"], function (require, exports, platform, event_1, terminal_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const SHELL_EXECUTABLES = [
        'cmd.exe',
        'powershell.exe',
        'bash.exe',
        'wsl.exe',
        'ubuntu.exe',
        'ubuntu1804.exe',
        'kali.exe',
        'debian.exe',
        'opensuse-42.exe',
        'sles-12.exe'
    ];
    let windowsProcessTree;
    class WindowsShellHelper extends lifecycle_1.Disposable {
        constructor(_rootProcessId, _terminalInstance, _xterm) {
            super();
            this._rootProcessId = _rootProcessId;
            this._terminalInstance = _terminalInstance;
            this._xterm = _xterm;
            this._onCheckShell = this._register(new event_1.Emitter());
            this._newLineFeed = false;
            if (!platform.isWindows) {
                throw new Error(`WindowsShellHelper cannot be instantiated on ${platform.platform}`);
            }
            this._isDisposed = false;
            (new Promise((resolve_1, reject_1) => { require(['windows-process-tree'], resolve_1, reject_1); })).then(mod => {
                if (this._isDisposed) {
                    return;
                }
                windowsProcessTree = mod;
                // The debounce is necessary to prevent multiple processes from spawning when
                // the enter key or output is spammed
                event_1.Event.debounce(this._onCheckShell.event, (l, e) => e, 150, true)(() => {
                    setTimeout(() => {
                        this.checkShell();
                    }, 50);
                });
                // We want to fire a new check for the shell on a linefeed, but only
                // when parsing has finished which is indicated by the cursormove event.
                // If this is done on every linefeed, parsing ends up taking
                // significantly longer due to resetting timers. Note that this is
                // private API.
                this._xterm.onLineFeed(() => this._newLineFeed = true);
                this._xterm.onCursorMove(() => {
                    if (this._newLineFeed) {
                        this._onCheckShell.fire(undefined);
                        this._newLineFeed = false;
                    }
                });
                // Fire a new check for the shell when any key is pressed.
                this._xterm.onKey(() => this._onCheckShell.fire(undefined));
            });
        }
        checkShell() {
            if (platform.isWindows && this._terminalInstance.isTitleSetByProcess) {
                this.getShellName().then(title => {
                    if (!this._isDisposed) {
                        this._terminalInstance.setTitle(title, terminal_1.TitleEventSource.Process);
                    }
                });
            }
        }
        traverseTree(tree) {
            if (!tree) {
                return '';
            }
            if (SHELL_EXECUTABLES.indexOf(tree.name) === -1) {
                return tree.name;
            }
            if (!tree.children || tree.children.length === 0) {
                return tree.name;
            }
            let favouriteChild = 0;
            for (; favouriteChild < tree.children.length; favouriteChild++) {
                const child = tree.children[favouriteChild];
                if (!child.children || child.children.length === 0) {
                    break;
                }
                if (child.children[0].name !== 'conhost.exe') {
                    break;
                }
            }
            if (favouriteChild >= tree.children.length) {
                return tree.name;
            }
            return this.traverseTree(tree.children[favouriteChild]);
        }
        dispose() {
            this._isDisposed = true;
            super.dispose();
        }
        /**
         * Returns the innermost shell executable running in the terminal
         */
        getShellName() {
            if (this._isDisposed) {
                return Promise.resolve('');
            }
            // Prevent multiple requests at once, instead return current request
            if (this._currentRequest) {
                return this._currentRequest;
            }
            this._currentRequest = new Promise(resolve => {
                windowsProcessTree.getProcessTree(this._rootProcessId, (tree) => {
                    const name = this.traverseTree(tree);
                    this._currentRequest = undefined;
                    resolve(name);
                });
            });
            return this._currentRequest;
        }
    }
    exports.WindowsShellHelper = WindowsShellHelper;
});
//# sourceMappingURL=windowsShellHelper.js.map