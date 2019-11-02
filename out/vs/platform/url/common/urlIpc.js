/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/base/common/arrays"], function (require, exports, uri_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class URLHandlerChannel {
        constructor(handler) {
            this.handler = handler;
        }
        listen(_, event) {
            throw new Error(`Event not found: ${event}`);
        }
        call(_, command, arg) {
            switch (command) {
                case 'handleURL': return this.handler.handleURL(uri_1.URI.revive(arg));
            }
            throw new Error(`Call not found: ${command}`);
        }
    }
    exports.URLHandlerChannel = URLHandlerChannel;
    class URLHandlerChannelClient {
        constructor(channel) {
            this.channel = channel;
        }
        handleURL(uri, options) {
            return this.channel.call('handleURL', uri.toJSON());
        }
    }
    exports.URLHandlerChannelClient = URLHandlerChannelClient;
    class URLHandlerRouter {
        constructor(next) {
            this.next = next;
        }
        async routeCall(hub, command, arg, cancellationToken) {
            if (command !== 'handleURL') {
                throw new Error(`Call not found: ${command}`);
            }
            if (arg) {
                const uri = uri_1.URI.revive(arg);
                if (uri && uri.query) {
                    const match = /\bwindowId=(\d+)/.exec(uri.query);
                    if (match) {
                        const windowId = match[1];
                        const regex = new RegExp(`window:${windowId}`);
                        const connection = arrays_1.first(hub.connections, c => regex.test(c.ctx));
                        if (connection) {
                            return connection;
                        }
                    }
                }
            }
            return this.next.routeCall(hub, command, arg, cancellationToken);
        }
        routeEvent(_, event) {
            throw new Error(`Event not found: ${event}`);
        }
    }
    exports.URLHandlerRouter = URLHandlerRouter;
});
//# sourceMappingURL=urlIpc.js.map