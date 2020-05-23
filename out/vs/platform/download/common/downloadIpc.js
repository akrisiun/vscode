/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri"], function (require, exports, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DownloadServiceChannelClient = exports.DownloadServiceChannel = void 0;
    class DownloadServiceChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event, arg) {
            throw new Error('Invalid listen');
        }
        call(context, command, args) {
            switch (command) {
                case 'download': return this.service.download(uri_1.URI.revive(args[0]), uri_1.URI.revive(args[1]));
            }
            throw new Error('Invalid call');
        }
    }
    exports.DownloadServiceChannel = DownloadServiceChannel;
    class DownloadServiceChannelClient {
        constructor(channel, getUriTransformer) {
            this.channel = channel;
            this.getUriTransformer = getUriTransformer;
        }
        async download(from, to) {
            const uriTransfomer = this.getUriTransformer();
            if (uriTransfomer) {
                from = uriTransfomer.transformOutgoingURI(from);
                to = uriTransfomer.transformOutgoingURI(to);
            }
            await this.channel.call('download', [from, to]);
        }
    }
    exports.DownloadServiceChannelClient = DownloadServiceChannelClient;
});
//# sourceMappingURL=downloadIpc.js.map