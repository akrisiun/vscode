/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "crypto", "vs/base/common/functional"], function (require, exports, fs, crypto, functional_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function checksum(path, sha1hash) {
        const promise = new Promise((c, e) => {
            const input = fs.createReadStream(path);
            const hash = crypto.createHash('sha1');
            const hashStream = hash;
            input.pipe(hashStream);
            const done = functional_1.once((err, result) => {
                input.removeAllListeners();
                hashStream.removeAllListeners();
                if (err) {
                    e(err);
                }
                else {
                    c(result);
                }
            });
            input.once('error', done);
            input.once('end', done);
            hashStream.once('error', done);
            hashStream.once('data', (data) => done(undefined, data.toString('hex')));
        });
        return promise.then(hash => {
            if (hash !== sha1hash) {
                return Promise.reject(new Error('Hash mismatch'));
            }
            return Promise.resolve();
        });
    }
    exports.checksum = checksum;
});
//# sourceMappingURL=crypto.js.map