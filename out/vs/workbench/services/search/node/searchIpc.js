/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchChannelClient = exports.SearchChannel = void 0;
    class SearchChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event, arg) {
            switch (event) {
                case 'fileSearch': return this.service.fileSearch(arg);
                case 'textSearch': return this.service.textSearch(arg);
            }
            throw new Error('Event not found');
        }
        call(_, command, arg) {
            switch (command) {
                case 'clearCache': return this.service.clearCache(arg);
            }
            throw new Error('Call not found');
        }
    }
    exports.SearchChannel = SearchChannel;
    class SearchChannelClient {
        constructor(channel) {
            this.channel = channel;
        }
        fileSearch(search) {
            return this.channel.listen('fileSearch', search);
        }
        textSearch(search) {
            return this.channel.listen('textSearch', search);
        }
        clearCache(cacheKey) {
            return this.channel.call('clearCache', cacheKey);
        }
    }
    exports.SearchChannelClient = SearchChannelClient;
});
//# sourceMappingURL=searchIpc.js.map