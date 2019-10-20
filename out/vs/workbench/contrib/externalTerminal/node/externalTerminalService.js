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
define(["require", "exports", "child_process", "vs/base/common/path", "vs/base/node/processes", "vs/nls", "vs/base/node/pfs", "vs/base/common/platform", "vs/base/common/objects", "vs/workbench/contrib/externalTerminal/common/externalTerminal", "vs/platform/configuration/common/configuration", "vs/base/common/amd", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/extensions", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/instantiation"], function (require, exports, cp, path, processes, nls, pfs, env, objects_1, externalTerminal_1, configuration_1, amd_1, configurationRegistry_1, extensions_1, platform_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const TERMINAL_TITLE = nls.localize('console.title', "VS Code Console");
    exports.DEFAULT_TERMINAL_OSX = 'Terminal.app';
    let WindowsExternalTerminalService = class WindowsExternalTerminalService {
        constructor(_configurationService) {
            this._configurationService = _configurationService;
        }
        openTerminal(cwd) {
            if (this._configurationService) {
                const configuration = this._configurationService.getValue();
                this.spawnTerminal(cp, configuration, processes.getWindowsShell(), cwd);
            }
        }
        runInTerminal(title, dir, args, envVars, settings) {
            const exec = settings.windowsExec || WindowsExternalTerminalService.getDefaultTerminalWindows();
            return new Promise((resolve, reject) => {
                const title = `"${dir} - ${TERMINAL_TITLE}"`;
                const command = `""${args.join('" "')}" & pause"`; // use '|' to only pause on non-zero exit code
                const cmdArgs = [
                    '/c', 'start', title, '/wait', exec, '/c', command
                ];
                // merge environment variables into a copy of the process.env
                const env = objects_1.assign({}, process.env, envVars);
                // delete environment variables that have a null value
                Object.keys(env).filter(v => env[v] === null).forEach(key => delete env[key]);
                const options = {
                    cwd: dir,
                    env: env,
                    windowsVerbatimArguments: true
                };
                const cmd = cp.spawn(WindowsExternalTerminalService.CMD, cmdArgs, options);
                cmd.on('error', err => {
                    reject(improveError(err));
                });
                resolve(undefined);
            });
        }
        spawnTerminal(spawner, configuration, command, cwd) {
            const terminalConfig = configuration.terminal.external;
            const exec = terminalConfig.windowsExec || WindowsExternalTerminalService.getDefaultTerminalWindows();
            // Make the drive letter uppercase on Windows (see #9448)
            if (cwd && cwd[1] === ':') {
                cwd = cwd[0].toUpperCase() + cwd.substr(1);
            }
            // cmder ignores the environment cwd and instead opts to always open in %USERPROFILE%
            // unless otherwise specified
            const basename = path.basename(exec).toLowerCase();
            if (basename === 'cmder' || basename === 'cmder.exe') {
                spawner.spawn(exec, cwd ? [cwd] : undefined);
                return Promise.resolve(undefined);
            }
            const cmdArgs = ['/c', 'start', '/wait'];
            if (exec.indexOf(' ') >= 0) {
                // The "" argument is the window title. Without this, exec doesn't work when the path
                // contains spaces
                cmdArgs.push('""');
            }
            cmdArgs.push(exec);
            return new Promise((c, e) => {
                const env = cwd ? { cwd: cwd } : undefined;
                const child = spawner.spawn(command, cmdArgs, env);
                child.on('error', e);
                child.on('exit', () => c());
            });
        }
        static getDefaultTerminalWindows() {
            if (!WindowsExternalTerminalService._DEFAULT_TERMINAL_WINDOWS) {
                const isWoW64 = !!process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
                WindowsExternalTerminalService._DEFAULT_TERMINAL_WINDOWS = `${process.env.windir ? process.env.windir : 'C:\\Windows'}\\${isWoW64 ? 'Sysnative' : 'System32'}\\cmd.exe`;
            }
            return WindowsExternalTerminalService._DEFAULT_TERMINAL_WINDOWS;
        }
    };
    WindowsExternalTerminalService.CMD = 'cmd.exe';
    WindowsExternalTerminalService = __decorate([
        __param(0, instantiation_1.optional(configuration_1.IConfigurationService))
    ], WindowsExternalTerminalService);
    exports.WindowsExternalTerminalService = WindowsExternalTerminalService;
    let MacExternalTerminalService = class MacExternalTerminalService {
        constructor(_configurationService) {
            this._configurationService = _configurationService;
        }
        openTerminal(cwd) {
            if (this._configurationService) {
                const configuration = this._configurationService.getValue();
                this.spawnTerminal(cp, configuration, cwd);
            }
        }
        runInTerminal(title, dir, args, envVars, settings) {
            const terminalApp = settings.osxExec || exports.DEFAULT_TERMINAL_OSX;
            return new Promise((resolve, reject) => {
                if (terminalApp === exports.DEFAULT_TERMINAL_OSX || terminalApp === 'iTerm.app') {
                    // On OS X we launch an AppleScript that creates (or reuses) a Terminal window
                    // and then launches the program inside that window.
                    const script = terminalApp === exports.DEFAULT_TERMINAL_OSX ? 'TerminalHelper' : 'iTermHelper';
                    const scriptpath = amd_1.getPathFromAmdModule(require, `vs/workbench/contrib/externalTerminal/node/${script}.scpt`);
                    const osaArgs = [
                        scriptpath,
                        '-t', title || TERMINAL_TITLE,
                        '-w', dir,
                    ];
                    for (let a of args) {
                        osaArgs.push('-a');
                        osaArgs.push(a);
                    }
                    if (envVars) {
                        for (let key in envVars) {
                            const value = envVars[key];
                            if (value === null) {
                                osaArgs.push('-u');
                                osaArgs.push(key);
                            }
                            else {
                                osaArgs.push('-e');
                                osaArgs.push(`${key}=${value}`);
                            }
                        }
                    }
                    let stderr = '';
                    const osa = cp.spawn(MacExternalTerminalService.OSASCRIPT, osaArgs);
                    osa.on('error', err => {
                        reject(improveError(err));
                    });
                    osa.stderr.on('data', (data) => {
                        stderr += data.toString();
                    });
                    osa.on('exit', (code) => {
                        if (code === 0) { // OK
                            resolve(undefined);
                        }
                        else {
                            if (stderr) {
                                const lines = stderr.split('\n', 1);
                                reject(new Error(lines[0]));
                            }
                            else {
                                reject(new Error(nls.localize('mac.terminal.script.failed', "Script '{0}' failed with exit code {1}", script, code)));
                            }
                        }
                    });
                }
                else {
                    reject(new Error(nls.localize('mac.terminal.type.not.supported', "'{0}' not supported", terminalApp)));
                }
            });
        }
        spawnTerminal(spawner, configuration, cwd) {
            const terminalConfig = configuration.terminal.external;
            const terminalApp = terminalConfig.osxExec || exports.DEFAULT_TERMINAL_OSX;
            return new Promise((c, e) => {
                const args = ['-a', terminalApp];
                if (cwd) {
                    args.push(cwd);
                }
                const child = spawner.spawn('/usr/bin/open', args);
                child.on('error', e);
                child.on('exit', () => c());
            });
        }
    };
    MacExternalTerminalService.OSASCRIPT = '/usr/bin/osascript'; // osascript is the AppleScript interpreter on OS X
    MacExternalTerminalService = __decorate([
        __param(0, instantiation_1.optional(configuration_1.IConfigurationService))
    ], MacExternalTerminalService);
    exports.MacExternalTerminalService = MacExternalTerminalService;
    let LinuxExternalTerminalService = class LinuxExternalTerminalService {
        constructor(_configurationService) {
            this._configurationService = _configurationService;
        }
        openTerminal(cwd) {
            if (this._configurationService) {
                const configuration = this._configurationService.getValue();
                this.spawnTerminal(cp, configuration, cwd);
            }
        }
        runInTerminal(title, dir, args, envVars, settings) {
            const execPromise = settings.linuxExec ? Promise.resolve(settings.linuxExec) : LinuxExternalTerminalService.getDefaultTerminalLinuxReady();
            return new Promise((resolve, reject) => {
                let termArgs = [];
                //termArgs.push('--title');
                //termArgs.push(`"${TERMINAL_TITLE}"`);
                execPromise.then(exec => {
                    if (exec.indexOf('gnome-terminal') >= 0) {
                        termArgs.push('-x');
                    }
                    else {
                        termArgs.push('-e');
                    }
                    termArgs.push('bash');
                    termArgs.push('-c');
                    const bashCommand = `${quote(args)}; echo; read -p "${LinuxExternalTerminalService.WAIT_MESSAGE}" -n1;`;
                    termArgs.push(`''${bashCommand}''`); // wrapping argument in two sets of ' because node is so "friendly" that it removes one set...
                    // merge environment variables into a copy of the process.env
                    const env = objects_1.assign({}, process.env, envVars);
                    // delete environment variables that have a null value
                    Object.keys(env).filter(v => env[v] === null).forEach(key => delete env[key]);
                    const options = {
                        cwd: dir,
                        env: env
                    };
                    let stderr = '';
                    const cmd = cp.spawn(exec, termArgs, options);
                    cmd.on('error', err => {
                        reject(improveError(err));
                    });
                    cmd.stderr.on('data', (data) => {
                        stderr += data.toString();
                    });
                    cmd.on('exit', (code) => {
                        if (code === 0) { // OK
                            resolve(undefined);
                        }
                        else {
                            if (stderr) {
                                const lines = stderr.split('\n', 1);
                                reject(new Error(lines[0]));
                            }
                            else {
                                reject(new Error(nls.localize('linux.term.failed', "'{0}' failed with exit code {1}", exec, code)));
                            }
                        }
                    });
                });
            });
        }
        spawnTerminal(spawner, configuration, cwd) {
            const terminalConfig = configuration.terminal.external;
            const execPromise = terminalConfig.linuxExec ? Promise.resolve(terminalConfig.linuxExec) : LinuxExternalTerminalService.getDefaultTerminalLinuxReady();
            return new Promise((c, e) => {
                execPromise.then(exec => {
                    const env = cwd ? { cwd } : undefined;
                    const child = spawner.spawn(exec, [], env);
                    child.on('error', e);
                    child.on('exit', () => c());
                });
            });
        }
        static getDefaultTerminalLinuxReady() {
            if (!LinuxExternalTerminalService._DEFAULT_TERMINAL_LINUX_READY) {
                LinuxExternalTerminalService._DEFAULT_TERMINAL_LINUX_READY = new Promise(c => {
                    if (env.isLinux) {
                        Promise.all([pfs.exists('/etc/debian_version'), Promise.resolve(process.lazyEnv) || Promise.resolve(undefined)]).then(([isDebian]) => {
                            if (isDebian) {
                                c('x-terminal-emulator');
                            }
                            else if (process.env.DESKTOP_SESSION === 'gnome' || process.env.DESKTOP_SESSION === 'gnome-classic') {
                                c('gnome-terminal');
                            }
                            else if (process.env.DESKTOP_SESSION === 'kde-plasma') {
                                c('konsole');
                            }
                            else if (process.env.COLORTERM) {
                                c(process.env.COLORTERM);
                            }
                            else if (process.env.TERM) {
                                c(process.env.TERM);
                            }
                            else {
                                c('xterm');
                            }
                        });
                        return;
                    }
                    c('xterm');
                });
            }
            return LinuxExternalTerminalService._DEFAULT_TERMINAL_LINUX_READY;
        }
    };
    LinuxExternalTerminalService.WAIT_MESSAGE = nls.localize('press.any.key', "Press any key to continue...");
    LinuxExternalTerminalService = __decorate([
        __param(0, instantiation_1.optional(configuration_1.IConfigurationService))
    ], LinuxExternalTerminalService);
    exports.LinuxExternalTerminalService = LinuxExternalTerminalService;
    /**
     * tries to turn OS errors into more meaningful error messages
     */
    function improveError(err) {
        if ('errno' in err && err['errno'] === 'ENOENT' && 'path' in err && typeof err['path'] === 'string') {
            return new Error(nls.localize('ext.term.app.not.found', "can't find terminal application '{0}'", err['path']));
        }
        return err;
    }
    /**
     * Quote args if necessary and combine into a space separated string.
     */
    function quote(args) {
        let r = '';
        for (let a of args) {
            if (a.indexOf(' ') >= 0) {
                r += '"' + a + '"';
            }
            else {
                r += a;
            }
            r += ' ';
        }
        return r;
    }
    if (env.isWindows) {
        extensions_1.registerSingleton(externalTerminal_1.IExternalTerminalService, WindowsExternalTerminalService, true);
    }
    else if (env.isMacintosh) {
        extensions_1.registerSingleton(externalTerminal_1.IExternalTerminalService, MacExternalTerminalService, true);
    }
    else if (env.isLinux) {
        extensions_1.registerSingleton(externalTerminal_1.IExternalTerminalService, LinuxExternalTerminalService, true);
    }
    LinuxExternalTerminalService.getDefaultTerminalLinuxReady().then(defaultTerminalLinux => {
        let configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        configurationRegistry.registerConfiguration({
            id: 'externalTerminal',
            order: 100,
            title: nls.localize('terminalConfigurationTitle', "External Terminal"),
            type: 'object',
            properties: {
                'terminal.explorerKind': {
                    type: 'string',
                    enum: [
                        'integrated',
                        'external'
                    ],
                    enumDescriptions: [
                        nls.localize('terminal.explorerKind.integrated', "Use VS Code's integrated terminal."),
                        nls.localize('terminal.explorerKind.external', "Use the configured external terminal.")
                    ],
                    description: nls.localize('explorer.openInTerminalKind', "Customizes what kind of terminal to launch."),
                    default: 'integrated'
                },
                'terminal.external.windowsExec': {
                    type: 'string',
                    description: nls.localize('terminal.external.windowsExec', "Customizes which terminal to run on Windows."),
                    default: WindowsExternalTerminalService.getDefaultTerminalWindows(),
                    scope: 1 /* APPLICATION */
                },
                'terminal.external.osxExec': {
                    type: 'string',
                    description: nls.localize('terminal.external.osxExec', "Customizes which terminal application to run on macOS."),
                    default: exports.DEFAULT_TERMINAL_OSX,
                    scope: 1 /* APPLICATION */
                },
                'terminal.external.linuxExec': {
                    type: 'string',
                    description: nls.localize('terminal.external.linuxExec', "Customizes which terminal to run on Linux."),
                    default: defaultTerminalLinux,
                    scope: 1 /* APPLICATION */
                }
            }
        });
    });
});
//# sourceMappingURL=externalTerminalService.js.map