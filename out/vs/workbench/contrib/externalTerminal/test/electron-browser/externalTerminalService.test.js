/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/externalTerminal/node/externalTerminalService"], function (require, exports, assert_1, externalTerminalService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExternalTerminalService', () => {
        let mockOnExit;
        let mockOnError;
        let mockConfig;
        setup(() => {
            mockConfig = {
                terminal: {
                    explorerKind: 'external',
                    external: {
                        windowsExec: 'testWindowsShell',
                        osxExec: 'testOSXShell',
                        linuxExec: 'testLinuxShell'
                    }
                }
            };
            mockOnExit = (s) => s;
            mockOnError = (e) => e;
        });
        test(`WinTerminalService - uses terminal from configuration`, done => {
            let testShell = 'cmd';
            let testCwd = 'path/to/workspace';
            let mockSpawner = {
                spawn: (command, args, opts) => {
                    // assert
                    assert_1.equal(command, testShell, 'shell should equal expected');
                    assert_1.equal(args[args.length - 1], mockConfig.terminal.external.windowsExec, 'terminal should equal expected');
                    assert_1.equal(opts.cwd, testCwd, 'opts.cwd should equal expected');
                    done();
                    return {
                        on: (evt) => evt
                    };
                }
            };
            let testService = new externalTerminalService_1.WindowsExternalTerminalService(mockConfig);
            testService.spawnTerminal(mockSpawner, mockConfig, testShell, testCwd, mockOnExit, mockOnError);
        });
        test(`WinTerminalService - uses default terminal when configuration.terminal.external.windowsExec is undefined`, done => {
            let testShell = 'cmd';
            let testCwd = 'path/to/workspace';
            let mockSpawner = {
                spawn: (command, args, opts) => {
                    // assert
                    assert_1.equal(args[args.length - 1], externalTerminalService_1.WindowsExternalTerminalService.getDefaultTerminalWindows(), 'terminal should equal expected');
                    done();
                    return {
                        on: (evt) => evt
                    };
                }
            };
            mockConfig.terminal.external.windowsExec = undefined;
            let testService = new externalTerminalService_1.WindowsExternalTerminalService(mockConfig);
            testService.spawnTerminal(mockSpawner, mockConfig, testShell, testCwd, mockOnExit, mockOnError);
        });
        test(`WinTerminalService - uses default terminal when configuration.terminal.external.windowsExec is undefined`, done => {
            let testShell = 'cmd';
            let testCwd = 'c:/foo';
            let mockSpawner = {
                spawn: (command, args, opts) => {
                    // assert
                    assert_1.equal(opts.cwd, 'C:/foo', 'cwd should be uppercase regardless of the case that\'s passed in');
                    done();
                    return {
                        on: (evt) => evt
                    };
                }
            };
            let testService = new externalTerminalService_1.WindowsExternalTerminalService(mockConfig);
            testService.spawnTerminal(mockSpawner, mockConfig, testShell, testCwd, mockOnExit, mockOnError);
        });
        test(`WinTerminalService - cmder should be spawned differently`, done => {
            let testShell = 'cmd';
            mockConfig.terminal.external.windowsExec = 'cmder';
            let testCwd = 'c:/foo';
            let mockSpawner = {
                spawn: (command, args, opts) => {
                    // assert
                    assert_1.deepEqual(args, ['C:/foo']);
                    assert_1.equal(opts, undefined);
                    done();
                    return { on: (evt) => evt };
                }
            };
            let testService = new externalTerminalService_1.WindowsExternalTerminalService(mockConfig);
            testService.spawnTerminal(mockSpawner, mockConfig, testShell, testCwd, mockOnExit, mockOnError);
        });
        test(`MacTerminalService - uses terminal from configuration`, done => {
            let testCwd = 'path/to/workspace';
            let mockSpawner = {
                spawn: (command, args, opts) => {
                    // assert
                    assert_1.equal(args[1], mockConfig.terminal.external.osxExec, 'terminal should equal expected');
                    done();
                    return {
                        on: (evt) => evt
                    };
                }
            };
            let testService = new externalTerminalService_1.MacExternalTerminalService(mockConfig);
            testService.spawnTerminal(mockSpawner, mockConfig, testCwd, mockOnExit, mockOnError);
        });
        test(`MacTerminalService - uses default terminal when configuration.terminal.external.osxExec is undefined`, done => {
            let testCwd = 'path/to/workspace';
            let mockSpawner = {
                spawn: (command, args, opts) => {
                    // assert
                    assert_1.equal(args[1], externalTerminalService_1.DEFAULT_TERMINAL_OSX, 'terminal should equal expected');
                    done();
                    return {
                        on: (evt) => evt
                    };
                }
            };
            mockConfig.terminal.external.osxExec = undefined;
            let testService = new externalTerminalService_1.MacExternalTerminalService(mockConfig);
            testService.spawnTerminal(mockSpawner, mockConfig, testCwd, mockOnExit, mockOnError);
        });
        test(`LinuxTerminalService - uses terminal from configuration`, done => {
            let testCwd = 'path/to/workspace';
            let mockSpawner = {
                spawn: (command, args, opts) => {
                    // assert
                    assert_1.equal(command, mockConfig.terminal.external.linuxExec, 'terminal should equal expected');
                    assert_1.equal(opts.cwd, testCwd, 'opts.cwd should equal expected');
                    done();
                    return {
                        on: (evt) => evt
                    };
                }
            };
            let testService = new externalTerminalService_1.LinuxExternalTerminalService(mockConfig);
            testService.spawnTerminal(mockSpawner, mockConfig, testCwd, mockOnExit, mockOnError);
        });
        test(`LinuxTerminalService - uses default terminal when configuration.terminal.external.linuxExec is undefined`, done => {
            externalTerminalService_1.LinuxExternalTerminalService.getDefaultTerminalLinuxReady().then(defaultTerminalLinux => {
                let testCwd = 'path/to/workspace';
                let mockSpawner = {
                    spawn: (command, args, opts) => {
                        // assert
                        assert_1.equal(command, defaultTerminalLinux, 'terminal should equal expected');
                        done();
                        return {
                            on: (evt) => evt
                        };
                    }
                };
                mockConfig.terminal.external.linuxExec = undefined;
                let testService = new externalTerminalService_1.LinuxExternalTerminalService(mockConfig);
                testService.spawnTerminal(mockSpawner, mockConfig, testCwd, mockOnExit, mockOnError);
            });
        });
    });
});
//# sourceMappingURL=externalTerminalService.test.js.map