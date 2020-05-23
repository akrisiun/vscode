/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "url", "vs/base/common/types"], function (require, exports, url_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getProxyAgent = void 0;
    function getSystemProxyURI(requestURL) {
        if (requestURL.protocol === 'http:') {
            return process.env.HTTP_PROXY || process.env.http_proxy || null;
        }
        else if (requestURL.protocol === 'https:') {
            return process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy || null;
        }
        return null;
    }
    async function getProxyAgent(rawRequestURL, options = {}) {
        const requestURL = url_1.parse(rawRequestURL);
        const proxyURL = options.proxyUrl || getSystemProxyURI(requestURL);
        if (!proxyURL) {
            return null;
        }
        const proxyEndpoint = url_1.parse(proxyURL);
        if (!/^https?:$/.test(proxyEndpoint.protocol || '')) {
            return null;
        }
        const opts = {
            host: proxyEndpoint.hostname || '',
            port: proxyEndpoint.port || (proxyEndpoint.protocol === 'https' ? '443' : '80'),
            auth: proxyEndpoint.auth,
            rejectUnauthorized: types_1.isBoolean(options.strictSSL) ? options.strictSSL : true,
        };
        return requestURL.protocol === 'http:'
            ? new (await new Promise((resolve_1, reject_1) => { require(['http-proxy-agent'], resolve_1, reject_1); }))(opts)
            : new (await new Promise((resolve_2, reject_2) => { require(['https-proxy-agent'], resolve_2, reject_2); }))(opts);
    }
    exports.getProxyAgent = getProxyAgent;
});
//# sourceMappingURL=proxy.js.map