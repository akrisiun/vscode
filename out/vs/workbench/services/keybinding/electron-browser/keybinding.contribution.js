/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "os", "vs/base/common/platform", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry"], function (require, exports, nls, os_1, platform_1, platform_2, configurationRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const configurationRegistry = platform_2.Registry.as(configurationRegistry_1.Extensions.Configuration);
    const keyboardConfiguration = {
        'id': 'keyboard',
        'order': 15,
        'type': 'object',
        'title': nls.localize('keyboardConfigurationTitle', "Keyboard"),
        'overridable': true,
        'properties': {
            'keyboard.touchbar.enabled': {
                'type': 'boolean',
                'default': true,
                'description': nls.localize('touchbar.enabled', "Enables the macOS touchbar buttons on the keyboard if available."),
                'included': platform_1.OS === 2 /* Macintosh */ && parseFloat(os_1.release()) >= 16 // Minimum: macOS Sierra (10.12.x = darwin 16.x)
            },
            'keyboard.touchbar.ignored': {
                'type': 'array',
                'items': {
                    'type': 'string'
                },
                'default': [],
                'description': nls.localize('touchbar.ignored', 'A set of identifiers for entries in the touchbar that should not show up (for example `workbench.action.navigateBack`.'),
                'included': platform_1.OS === 2 /* Macintosh */ && parseFloat(os_1.release()) >= 16 // Minimum: macOS Sierra (10.12.x = darwin 16.x)
            }
        }
    };
    configurationRegistry.registerConfiguration(keyboardConfiguration);
});
//# sourceMappingURL=keybinding.contribution.js.map