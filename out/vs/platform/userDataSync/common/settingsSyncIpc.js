/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SettingsMergeChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            throw new Error(`Event not found: ${event}`);
        }
        call(context, command, args) {
            switch (command) {
                case 'merge': return this.service.merge(args[0], args[1], args[2], args[3]);
                case 'computeRemoteContent': return this.service.computeRemoteContent(args[0], args[1], args[2]);
            }
            throw new Error('Invalid call');
        }
    }
    exports.SettingsMergeChannel = SettingsMergeChannel;
    class SettingsMergeChannelClient {
        constructor(channel) {
            this.channel = channel;
        }
        merge(localContent, remoteContent, baseContent, ignoredSettings) {
            return this.channel.call('merge', [localContent, remoteContent, baseContent, ignoredSettings]);
        }
        computeRemoteContent(localContent, remoteContent, ignoredSettings) {
            return this.channel.call('computeRemoteContent', [localContent, remoteContent, ignoredSettings]);
        }
    }
    exports.SettingsMergeChannelClient = SettingsMergeChannelClient;
});
//# sourceMappingURL=settingsSyncIpc.js.map