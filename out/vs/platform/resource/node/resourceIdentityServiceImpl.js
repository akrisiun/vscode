/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "crypto", "vs/base/node/pfs", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/lifecycle", "vs/base/common/map"], function (require, exports, crypto_1, pfs_1, network_1, platform_1, lifecycle_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeResourceIdentityService = void 0;
    class NativeResourceIdentityService extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.cache = new map_1.ResourceMap();
        }
        resolveResourceIdentity(resource) {
            let promise = this.cache.get(resource);
            if (!promise) {
                promise = this.createIdentity(resource);
                this.cache.set(resource, promise);
            }
            return promise;
        }
        async createIdentity(resource) {
            // Return early the folder is not local
            if (resource.scheme !== network_1.Schemas.file) {
                return crypto_1.createHash('md5').update(resource.toString()).digest('hex');
            }
            const fileStat = await pfs_1.stat(resource.fsPath);
            let ctime;
            if (platform_1.isLinux) {
                ctime = fileStat.ino; // Linux: birthtime is ctime, so we cannot use it! We use the ino instead!
            }
            else if (platform_1.isMacintosh) {
                ctime = fileStat.birthtime.getTime(); // macOS: birthtime is fine to use as is
            }
            else if (platform_1.isWindows) {
                if (typeof fileStat.birthtimeMs === 'number') {
                    ctime = Math.floor(fileStat.birthtimeMs); // Windows: fix precision issue in node.js 8.x to get 7.x results (see https://github.com/nodejs/node/issues/19897)
                }
                else {
                    ctime = fileStat.birthtime.getTime();
                }
            }
            // we use the ctime as extra salt to the ID so that we catch the case of a folder getting
            // deleted and recreated. in that case we do not want to carry over previous state
            return crypto_1.createHash('md5').update(resource.fsPath).update(ctime ? String(ctime) : '').digest('hex');
        }
    }
    exports.NativeResourceIdentityService = NativeResourceIdentityService;
});
//# sourceMappingURL=resourceIdentityServiceImpl.js.map