/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/nls", "vs/platform/jsonschemas/common/jsonContributionRegistry"], function (require, exports, instantiation_1, contextkey_1, platform_1, configurationRegistry_1, nls_1, jsonContributionRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DEFAULT_IGNORED_SETTINGS = [
        'configurationSync.enable',
        'configurationSync.enableSettings',
        'configurationSync.enableExtensions',
    ];
    function registerConfiguration() {
        const ignoredSettingsSchemaId = 'vscode://schemas/ignoredSettings';
        const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        configurationRegistry.registerConfiguration({
            id: 'configurationSync',
            order: 30,
            title: nls_1.localize('configurationSync', "Configuration Sync"),
            type: 'object',
            properties: {
                'configurationSync.enable': {
                    type: 'boolean',
                    description: nls_1.localize('configurationSync.enable', "When enabled, synchronises configuration that includes Settings and Extensions."),
                    default: true,
                    scope: 1 /* APPLICATION */
                },
                'configurationSync.enableSettings': {
                    type: 'boolean',
                    description: nls_1.localize('configurationSync.enableSettings', "When enabled settings are synchronised while synchronizing configuration."),
                    default: true,
                    scope: 1 /* APPLICATION */,
                },
                'configurationSync.enableExtensions': {
                    type: 'boolean',
                    description: nls_1.localize('configurationSync.enableExtensions', "When enabled extensions are synchronised while synchronizing configuration."),
                    default: true,
                    scope: 1 /* APPLICATION */,
                },
                'configurationSync.extensionsToIgnore': {
                    'type': 'array',
                    description: nls_1.localize('configurationSync.extensionsToIgnore', "Configure extensions to be ignored while syncing."),
                    'default': [],
                    'scope': 1 /* APPLICATION */,
                    uniqueItems: true
                },
                'configurationSync.settingsToIgnore': {
                    'type': 'array',
                    description: nls_1.localize('configurationSync.settingsToIgnore', "Configure settings to be ignored while syncing. \nDefault Ignored Settings:\n\n{0}", exports.DEFAULT_IGNORED_SETTINGS.sort().map(setting => `- ${setting}`).join('\n')),
                    'default': [],
                    'scope': 1 /* APPLICATION */,
                    $ref: ignoredSettingsSchemaId,
                    additionalProperties: true,
                    uniqueItems: true
                },
                'configurationSync.enableAuth': {
                    'type': 'boolean',
                    description: nls_1.localize('configurationSync.enableAuth', "Enables authentication and requires VS Code restart when changed"),
                    'default': false,
                    'scope': 1 /* APPLICATION */
                }
            }
        });
        const registerIgnoredSettingsSchema = () => {
            const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
            const ignoredSettingsSchema = {
                items: {
                    type: 'string',
                    enum: [...Object.keys(configurationRegistry_1.allSettings.properties).filter(setting => exports.DEFAULT_IGNORED_SETTINGS.indexOf(setting) === -1), ...exports.DEFAULT_IGNORED_SETTINGS.map(setting => `-${setting}`)]
                }
            };
            jsonRegistry.registerSchema(ignoredSettingsSchemaId, ignoredSettingsSchema);
        };
        return configurationRegistry.onDidUpdateConfiguration(() => registerIgnoredSettingsSchema());
    }
    exports.registerConfiguration = registerConfiguration;
    var UserDataSyncStoreErrorCode;
    (function (UserDataSyncStoreErrorCode) {
        UserDataSyncStoreErrorCode["Unauthroized"] = "Unauthroized";
        UserDataSyncStoreErrorCode["Rejected"] = "Rejected";
        UserDataSyncStoreErrorCode["Unknown"] = "Unknown";
    })(UserDataSyncStoreErrorCode = exports.UserDataSyncStoreErrorCode || (exports.UserDataSyncStoreErrorCode = {}));
    class UserDataSyncStoreError extends Error {
        constructor(message, code) {
            super(message);
            this.code = code;
        }
    }
    exports.UserDataSyncStoreError = UserDataSyncStoreError;
    exports.IUserDataSyncStoreService = instantiation_1.createDecorator('IUserDataSyncStoreService');
    var SyncSource;
    (function (SyncSource) {
        SyncSource[SyncSource["Settings"] = 1] = "Settings";
        SyncSource[SyncSource["Extensions"] = 2] = "Extensions";
    })(SyncSource = exports.SyncSource || (exports.SyncSource = {}));
    var SyncStatus;
    (function (SyncStatus) {
        SyncStatus["Uninitialized"] = "uninitialized";
        SyncStatus["Idle"] = "idle";
        SyncStatus["Syncing"] = "syncing";
        SyncStatus["HasConflicts"] = "hasConflicts";
    })(SyncStatus = exports.SyncStatus || (exports.SyncStatus = {}));
    exports.IUserDataSyncService = instantiation_1.createDecorator('IUserDataSyncService');
    exports.ISettingsMergeService = instantiation_1.createDecorator('ISettingsMergeService');
    exports.IUserDataSyncLogService = instantiation_1.createDecorator('IUserDataSyncLogService');
    exports.CONTEXT_SYNC_STATE = new contextkey_1.RawContextKey('syncStatus', "uninitialized" /* Uninitialized */);
});
//# sourceMappingURL=userDataSync.js.map