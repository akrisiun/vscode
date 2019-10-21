/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/request/node/requestService", "vs/base/common/objects", "electron"], function (require, exports, requestService_1, objects_1, electron_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getRawRequest(options) {
        return electron_1.net.request;
    }
    class RequestMainService extends requestService_1.RequestService {
        request(options, token) {
            return super.request(objects_1.assign({}, options || {}, { getRawRequest }), token);
        }
    }
    exports.RequestMainService = RequestMainService;
});
//# sourceMappingURL=requestMainService.js.map