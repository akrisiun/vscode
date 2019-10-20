/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform"], function (require, exports, nls, configurationRegistry_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function registerShellConfiguration(getSystemShell) {
        const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        configurationRegistry.registerConfiguration({
            id: 'terminal',
            order: 100,
            title: nls.localize('terminalIntegratedConfigurationTitle', "Integrated Terminal"),
            type: 'object',
            properties: {
                'terminal.integrated.shell.linux': {
                    markdownDescription: getSystemShell
                        ? nls.localize('terminal.integrated.shell.linux', "The path of the shell that the terminal uses on Linux (default: {0}). [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_configuration).", getSystemShell(2 /* Linux */))
                        : nls.localize('terminal.integrated.shell.linux.noDefault', "The path of the shell that the terminal uses on Linux. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_configuration)."),
                    type: ['string', 'null'],
                    default: null
                },
                'terminal.integrated.shell.osx': {
                    markdownDescription: getSystemShell
                        ? nls.localize('terminal.integrated.shell.osx', "The path of the shell that the terminal uses on macOS (default: {0}). [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_configuration).", getSystemShell(1 /* Mac */))
                        : nls.localize('terminal.integrated.shell.osx.noDefault', "The path of the shell that the terminal uses on macOS. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_configuration)."),
                    type: ['string', 'null'],
                    default: null
                },
                'terminal.integrated.shell.windows': {
                    markdownDescription: getSystemShell
                        ? nls.localize('terminal.integrated.shell.windows', "The path of the shell that the terminal uses on Windows (default: {0}). [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_configuration).", getSystemShell(3 /* Windows */))
                        : nls.localize('terminal.integrated.shell.windows.noDefault', "The path of the shell that the terminal uses on Windows. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_configuration)."),
                    type: ['string', 'null'],
                    default: null
                }
            }
        });
    }
    exports.registerShellConfiguration = registerShellConfiguration;
});
//# sourceMappingURL=terminalShellConfig.js.map