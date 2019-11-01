/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "vs/base/common/platform", "vs/workbench/contrib/terminal/node/terminal", "vs/workbench/contrib/externalTerminal/node/externalTerminalService"], function (require, exports, cp, env, terminal_1, externalTerminalService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let externalTerminalService = undefined;
    function runInExternalTerminal(args, configProvider) {
        if (!externalTerminalService) {
            if (env.isWindows) {
                externalTerminalService = new externalTerminalService_1.WindowsExternalTerminalService(undefined);
            }
            else if (env.isMacintosh) {
                externalTerminalService = new externalTerminalService_1.MacExternalTerminalService(undefined);
            }
            else if (env.isLinux) {
                externalTerminalService = new externalTerminalService_1.LinuxExternalTerminalService(undefined);
            }
        }
        if (externalTerminalService) {
            const config = configProvider.getConfiguration('terminal');
            externalTerminalService.runInTerminal(args.title, args.cwd, args.args, args.env || {}, config.external || {});
        }
    }
    exports.runInExternalTerminal = runInExternalTerminal;
    function hasChildProcesses(processId) {
        if (processId) {
            try {
                // if shell has at least one child process, assume that shell is busy
                if (env.isWindows) {
                    const result = cp.spawnSync('wmic', ['process', 'get', 'ParentProcessId']);
                    if (result.stdout) {
                        const pids = result.stdout.toString().split('\r\n');
                        if (!pids.some(p => parseInt(p) === processId)) {
                            return false;
                        }
                    }
                }
                else {
                    const result = cp.spawnSync('/usr/bin/pgrep', ['-lP', String(processId)]);
                    if (result.stdout) {
                        const r = result.stdout.toString().trim();
                        if (r.length === 0 || r.indexOf(' tmux') >= 0) { // ignore 'tmux'; see #43683
                            return false;
                        }
                    }
                }
            }
            catch (e) {
                // silently ignore
            }
        }
        // fall back to safe side
        return true;
    }
    exports.hasChildProcesses = hasChildProcesses;
    var ShellType;
    (function (ShellType) {
        ShellType[ShellType["cmd"] = 0] = "cmd";
        ShellType[ShellType["powershell"] = 1] = "powershell";
        ShellType[ShellType["bash"] = 2] = "bash";
    })(ShellType || (ShellType = {}));
    function prepareCommand(args, shell, configProvider) {
        let shellType = env.isWindows ? 0 /* cmd */ : 2 /* bash */; // pick a good default
        if (shell) {
            const config = configProvider.getConfiguration('terminal');
            // get the shell configuration for the current platform
            const shell_config = config.integrated.shell;
            if (env.isWindows) {
                shell = shell_config.windows || terminal_1.getSystemShell(3 /* Windows */);
            }
            else if (env.isLinux) {
                shell = shell_config.linux || terminal_1.getSystemShell(2 /* Linux */);
            }
            else if (env.isMacintosh) {
                shell = shell_config.osx || terminal_1.getSystemShell(1 /* Mac */);
            }
            else {
                throw new Error('Unknown platform');
            }
        }
        // try to determine the shell type
        shell = shell.trim().toLowerCase();
        if (shell.indexOf('powershell') >= 0 || shell.indexOf('pwsh') >= 0) {
            shellType = 1 /* powershell */;
        }
        else if (shell.indexOf('cmd.exe') >= 0) {
            shellType = 0 /* cmd */;
        }
        else if (shell.indexOf('bash') >= 0) {
            shellType = 2 /* bash */;
        }
        else if (shell.indexOf('git\\bin\\bash.exe') >= 0) {
            shellType = 2 /* bash */;
        }
        let quote;
        let command = '';
        switch (shellType) {
            case 1 /* powershell */:
                quote = (s) => {
                    s = s.replace(/\'/g, '\'\'');
                    if (s.length > 0 && s.charAt(s.length - 1) === '\\') {
                        return `'${s}\\'`;
                    }
                    return `'${s}'`;
                };
                if (args.cwd) {
                    command += `cd '${args.cwd}'; `;
                }
                if (args.env) {
                    for (let key in args.env) {
                        const value = args.env[key];
                        if (value === null) {
                            command += `Remove-Item env:${key}; `;
                        }
                        else {
                            command += `\${env:${key}}='${value}'; `;
                        }
                    }
                }
                if (args.args && args.args.length > 0) {
                    const cmd = quote(args.args.shift());
                    command += (cmd[0] === '\'') ? `& ${cmd} ` : `${cmd} `;
                    for (let a of args.args) {
                        command += `${quote(a)} `;
                    }
                }
                break;
            case 0 /* cmd */:
                quote = (s) => {
                    s = s.replace(/\"/g, '""');
                    return (s.indexOf(' ') >= 0 || s.indexOf('"') >= 0 || s.length === 0) ? `"${s}"` : s;
                };
                if (args.cwd) {
                    command += `cd ${quote(args.cwd)} && `;
                }
                if (args.env) {
                    command += 'cmd /C "';
                    for (let key in args.env) {
                        let value = args.env[key];
                        if (value === null) {
                            command += `set "${key}=" && `;
                        }
                        else {
                            value = value.replace(/[\^\&]/g, s => `^${s}`);
                            command += `set "${key}=${value}" && `;
                        }
                    }
                }
                for (let a of args.args) {
                    command += `${quote(a)} `;
                }
                if (args.env) {
                    command += '"';
                }
                break;
            case 2 /* bash */:
                quote = (s) => {
                    s = s.replace(/([\"\\])/g, '\\$1');
                    return (s.indexOf(' ') >= 0 || s.length === 0) ? `"${s}"` : s;
                };
                const hardQuote = (s) => {
                    return /[^\w@%\/+=,.:^-]/.test(s) ? `'${s.replace(/'/g, '\'\\\'\'')}'` : s;
                };
                if (args.cwd) {
                    command += `cd ${quote(args.cwd)} ; `;
                }
                if (args.env) {
                    command += 'env';
                    for (let key in args.env) {
                        const value = args.env[key];
                        if (value === null) {
                            command += ` -u ${hardQuote(key)}`;
                        }
                        else {
                            command += ` ${hardQuote(`${key}=${value}`)}`;
                        }
                    }
                    command += ' ';
                }
                for (let a of args.args) {
                    command += `${quote(a)} `;
                }
                break;
        }
        return command;
    }
    exports.prepareCommand = prepareCommand;
});
//# sourceMappingURL=terminals.js.map