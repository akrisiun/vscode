/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, path, platform, uri_1, extensions_1, instantiation_1, remoteAgentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const REMOTE_PATH_SERVICE_ID = 'remotePath';
    exports.IRemotePathService = instantiation_1.createDecorator(REMOTE_PATH_SERVICE_ID);
    /**
     * Provides the correct IPath implementation for dealing with paths that refer to locations in the extension host
     */
    let RemotePathService = class RemotePathService {
        constructor(remoteAgentService) {
            this.remoteAgentService = remoteAgentService;
            this._extHostOS = remoteAgentService.getEnvironment().then(remoteEnvironment => {
                return remoteEnvironment ? remoteEnvironment.os : platform.OS;
            });
        }
        get path() {
            return this._extHostOS.then(os => {
                return os === 1 /* Windows */ ?
                    path.win32 :
                    path.posix;
            });
        }
        async fileURI(_path) {
            let authority = '';
            // normalize to fwd-slashes on windows,
            // on other systems bwd-slashes are valid
            // filename character, eg /f\oo/ba\r.txt
            if ((await this._extHostOS) === 1 /* Windows */) {
                _path = _path.replace(/\\/g, '/');
            }
            // check for authority as used in UNC shares
            // or use the path as given
            if (_path[0] === '/' && _path[1] === '/') {
                const idx = _path.indexOf('/', 2);
                if (idx === -1) {
                    authority = _path.substring(2);
                    _path = '/';
                }
                else {
                    authority = _path.substring(2, idx);
                    _path = _path.substring(idx) || '/';
                }
            }
            // return new _URI('file', authority, path, '', '');
            return uri_1.URI.from({
                scheme: 'file',
                authority,
                path: _path,
                query: '',
                fragment: ''
            });
        }
    };
    RemotePathService = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService)
    ], RemotePathService);
    exports.RemotePathService = RemotePathService;
    extensions_1.registerSingleton(exports.IRemotePathService, RemotePathService, true);
});
//# sourceMappingURL=remotePathService.js.map