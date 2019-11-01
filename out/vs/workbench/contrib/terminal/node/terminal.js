/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/base/common/platform", "vs/base/node/processes", "vs/base/node/pfs", "vs/workbench/contrib/terminal/common/terminal", "vs/base/common/arrays", "vs/base/common/path"], function (require, exports, os, platform, processes, pfs_1, terminal_1, arrays_1, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Gets the detected default shell for the _system_, not to be confused with VS Code's _default_
     * shell that the terminal uses by default.
     * @param p The platform to detect the shell of.
     */
    function getSystemShell(p) {
        if (p === 3 /* Windows */) {
            if (platform.isWindows) {
                return getSystemShellWindows();
            }
            // Don't detect Windows shell when not on Windows
            return processes.getWindowsShell();
        }
        // Only use $SHELL for the current OS
        if (platform.isLinux && p === 1 /* Mac */ || platform.isMacintosh && p === 2 /* Linux */) {
            return '/bin/bash';
        }
        return getSystemShellUnixLike();
    }
    exports.getSystemShell = getSystemShell;
    let _TERMINAL_DEFAULT_SHELL_UNIX_LIKE = null;
    function getSystemShellUnixLike() {
        if (!_TERMINAL_DEFAULT_SHELL_UNIX_LIKE) {
            let unixLikeTerminal = 'sh';
            if (!platform.isWindows && process.env.SHELL) {
                unixLikeTerminal = process.env.SHELL;
                // Some systems have $SHELL set to /bin/false which breaks the terminal
                if (unixLikeTerminal === '/bin/false') {
                    unixLikeTerminal = '/bin/bash';
                }
            }
            if (platform.isWindows) {
                unixLikeTerminal = '/bin/bash'; // for WSL
            }
            _TERMINAL_DEFAULT_SHELL_UNIX_LIKE = unixLikeTerminal;
        }
        return _TERMINAL_DEFAULT_SHELL_UNIX_LIKE;
    }
    let _TERMINAL_DEFAULT_SHELL_WINDOWS = null;
    function getSystemShellWindows() {
        if (!_TERMINAL_DEFAULT_SHELL_WINDOWS) {
            const isAtLeastWindows10 = platform.isWindows && parseFloat(os.release()) >= 10;
            const is32ProcessOn64Windows = process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
            const powerShellPath = `${process.env.windir}\\${is32ProcessOn64Windows ? 'Sysnative' : 'System32'}\\WindowsPowerShell\\v1.0\\powershell.exe`;
            _TERMINAL_DEFAULT_SHELL_WINDOWS = isAtLeastWindows10 ? powerShellPath : processes.getWindowsShell();
        }
        return _TERMINAL_DEFAULT_SHELL_WINDOWS;
    }
    let detectedDistro = terminal_1.LinuxDistro.Unknown;
    if (platform.isLinux) {
        const file = '/etc/os-release';
        pfs_1.fileExists(file).then(exists => {
            if (!exists) {
                return;
            }
            pfs_1.readFile(file).then(b => {
                const contents = b.toString();
                if (/NAME="?Fedora"?/.test(contents)) {
                    detectedDistro = terminal_1.LinuxDistro.Fedora;
                }
                else if (/NAME="?Ubuntu"?/.test(contents)) {
                    detectedDistro = terminal_1.LinuxDistro.Ubuntu;
                }
            });
        });
    }
    exports.linuxDistro = detectedDistro;
    function getWindowsBuildNumber() {
        const osVersion = (/(\d+)\.(\d+)\.(\d+)/g).exec(os.release());
        let buildNumber = 0;
        if (osVersion && osVersion.length === 4) {
            buildNumber = parseInt(osVersion[3]);
        }
        return buildNumber;
    }
    exports.getWindowsBuildNumber = getWindowsBuildNumber;
    function detectAvailableShells() {
        return platform.isWindows ? detectAvailableWindowsShells() : detectAvailableUnixShells();
    }
    exports.detectAvailableShells = detectAvailableShells;
    async function detectAvailableWindowsShells() {
        // Determine the correct System32 path. We want to point to Sysnative
        // when the 32-bit version of VS Code is running on a 64-bit machine.
        // The reason for this is because PowerShell's important PSReadline
        // module doesn't work if this is not the case. See #27915.
        const is32ProcessOn64Windows = process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
        const system32Path = `${process.env['windir']}\\${is32ProcessOn64Windows ? 'Sysnative' : 'System32'}`;
        let useWSLexe = false;
        if (getWindowsBuildNumber() >= 16299) {
            useWSLexe = true;
        }
        const expectedLocations = {
            'Command Prompt': [`${system32Path}\\cmd.exe`],
            PowerShell: [`${system32Path}\\WindowsPowerShell\\v1.0\\powershell.exe`],
            'PowerShell Core': [await getShellPathFromRegistry('pwsh')],
            'WSL Bash': [`${system32Path}\\${useWSLexe ? 'wsl.exe' : 'bash.exe'}`],
            'Git Bash': [
                `${process.env['ProgramW6432']}\\Git\\bin\\bash.exe`,
                `${process.env['ProgramW6432']}\\Git\\usr\\bin\\bash.exe`,
                `${process.env['ProgramFiles']}\\Git\\bin\\bash.exe`,
                `${process.env['ProgramFiles']}\\Git\\usr\\bin\\bash.exe`,
                `${process.env['LocalAppData']}\\Programs\\Git\\bin\\bash.exe`,
            ],
        };
        const promises = [];
        Object.keys(expectedLocations).forEach(key => promises.push(validateShellPaths(key, expectedLocations[key])));
        return Promise.all(promises).then(arrays_1.coalesce);
    }
    async function detectAvailableUnixShells() {
        const contents = await pfs_1.readFile('/etc/shells', 'utf8');
        const shells = contents.split('\n').filter(e => e.trim().indexOf('#') !== 0 && e.trim().length > 0);
        return shells.map(e => {
            return {
                label: path_1.basename(e),
                path: e
            };
        });
    }
    async function validateShellPaths(label, potentialPaths) {
        if (potentialPaths.length === 0) {
            return Promise.resolve(undefined);
        }
        const current = potentialPaths.shift();
        if (current === '') {
            return validateShellPaths(label, potentialPaths);
        }
        try {
            const result = await pfs_1.stat(path_1.normalize(current));
            if (result.isFile || result.isSymbolicLink) {
                return {
                    label,
                    path: current
                };
            }
        }
        catch ( /* noop */_a) { /* noop */ }
        return validateShellPaths(label, potentialPaths);
    }
    async function getShellPathFromRegistry(shellName) {
        const Registry = await new Promise((resolve_1, reject_1) => { require(['vscode-windows-registry'], resolve_1, reject_1); });
        try {
            const shellPath = Registry.GetStringRegKey('HKEY_LOCAL_MACHINE', `SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\${shellName}.exe`, '');
            return shellPath ? shellPath : '';
        }
        catch (error) {
            return '';
        }
    }
});
//# sourceMappingURL=terminal.js.map