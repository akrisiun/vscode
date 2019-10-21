/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey"], function (require, exports, event_1, platform_1, instantiation_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Mime type used by the output editor.
     */
    exports.OUTPUT_MIME = 'text/x-code-output';
    /**
     * Output resource scheme.
     */
    exports.OUTPUT_SCHEME = 'output';
    /**
     * Id used by the output editor.
     */
    exports.OUTPUT_MODE_ID = 'Log';
    /**
     * Mime type used by the log output editor.
     */
    exports.LOG_MIME = 'text/x-code-log-output';
    /**
     * Log resource scheme.
     */
    exports.LOG_SCHEME = 'log';
    /**
     * Id used by the log output editor.
     */
    exports.LOG_MODE_ID = 'log';
    /**
     * Output panel id
     */
    exports.OUTPUT_PANEL_ID = 'workbench.panel.output';
    exports.Extensions = {
        OutputChannels: 'workbench.contributions.outputChannels'
    };
    exports.OUTPUT_SERVICE_ID = 'outputService';
    exports.MAX_OUTPUT_LENGTH = 10000 /* Max. number of output lines to show in output */ * 100 /* Guestimated chars per line */;
    exports.CONTEXT_IN_OUTPUT = new contextkey_1.RawContextKey('inOutput', false);
    exports.CONTEXT_ACTIVE_LOG_OUTPUT = new contextkey_1.RawContextKey('activeLogOutput', false);
    exports.IOutputService = instantiation_1.createDecorator(exports.OUTPUT_SERVICE_ID);
    class OutputChannelRegistry {
        constructor() {
            this.channels = new Map();
            this._onDidRegisterChannel = new event_1.Emitter();
            this.onDidRegisterChannel = this._onDidRegisterChannel.event;
            this._onDidRemoveChannel = new event_1.Emitter();
            this.onDidRemoveChannel = this._onDidRemoveChannel.event;
        }
        registerChannel(descriptor) {
            if (!this.channels.has(descriptor.id)) {
                this.channels.set(descriptor.id, descriptor);
                this._onDidRegisterChannel.fire(descriptor.id);
            }
        }
        getChannels() {
            const result = [];
            this.channels.forEach(value => result.push(value));
            return result;
        }
        getChannel(id) {
            return this.channels.get(id);
        }
        removeChannel(id) {
            this.channels.delete(id);
            this._onDidRemoveChannel.fire(id);
        }
    }
    platform_1.Registry.add(exports.Extensions.OutputChannels, new OutputChannelRegistry());
});
//# sourceMappingURL=output.js.map