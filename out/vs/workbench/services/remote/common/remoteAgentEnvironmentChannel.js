/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/common/uri", "vs/base/common/network"], function (require, exports, platform, uri_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RemoteExtensionEnvironmentChannelClient {
        constructor(channel) {
            this.channel = channel;
        }
        async getEnvironmentData(remoteAuthority, extensionDevelopmentPath) {
            const args = {
                language: platform.language,
                remoteAuthority,
                extensionDevelopmentPath
            };
            const data = await this.channel.call('getEnvironmentData', args);
            network_1.RemoteAuthorities.setConnectionToken(remoteAuthority, data.connectionToken);
            return {
                pid: data.pid,
                connectionToken: data.connectionToken,
                appRoot: uri_1.URI.revive(data.appRoot),
                appSettingsHome: uri_1.URI.revive(data.appSettingsHome),
                settingsPath: uri_1.URI.revive(data.settingsPath),
                logsPath: uri_1.URI.revive(data.logsPath),
                extensionsPath: uri_1.URI.revive(data.extensionsPath),
                extensionHostLogsPath: uri_1.URI.revive(data.extensionHostLogsPath),
                globalStorageHome: uri_1.URI.revive(data.globalStorageHome),
                userHome: uri_1.URI.revive(data.userHome),
                extensions: data.extensions.map(ext => { ext.extensionLocation = uri_1.URI.revive(ext.extensionLocation); return ext; }),
                os: data.os
            };
        }
        getDiagnosticInfo(options) {
            return this.channel.call('getDiagnosticInfo', options);
        }
        disableTelemetry() {
            return this.channel.call('disableTelemetry');
        }
        logTelemetry(eventName, data) {
            return this.channel.call('logTelemetry', { eventName, data });
        }
        flushTelemetry() {
            return this.channel.call('flushTelemetry');
        }
    }
    exports.RemoteExtensionEnvironmentChannelClient = RemoteExtensionEnvironmentChannelClient;
});
//# sourceMappingURL=remoteAgentEnvironmentChannel.js.map