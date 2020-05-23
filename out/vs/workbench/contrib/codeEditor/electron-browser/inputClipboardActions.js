/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/keybinding/common/keybindingsRegistry", "vs/base/common/platform"], function (require, exports, keybindingsRegistry_1, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    if (platform.isMacintosh) {
        // On the mac, cmd+x, cmd+c and cmd+v do not result in cut / copy / paste
        // We therefore add a basic keybinding rule that invokes document.execCommand
        // This is to cover <input>s...
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'execCut',
            primary: 2048 /* CtrlCmd */ | 54 /* KEY_X */,
            handler: bindExecuteCommand('cut'),
            weight: 0,
            when: undefined,
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'execCopy',
            primary: 2048 /* CtrlCmd */ | 33 /* KEY_C */,
            handler: bindExecuteCommand('copy'),
            weight: 0,
            when: undefined,
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'execPaste',
            primary: 2048 /* CtrlCmd */ | 52 /* KEY_V */,
            handler: bindExecuteCommand('paste'),
            weight: 0,
            when: undefined,
        });
        function bindExecuteCommand(command) {
            return () => {
                document.execCommand(command);
            };
        }
    }
});
//# sourceMappingURL=inputClipboardActions.js.map