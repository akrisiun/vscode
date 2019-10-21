/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "http", "https", "tls", "url", "os", "fs", "child_process", "vs/base/common/objects", "vs/base/common/strings", "vscode-proxy-agent", "vs/base/common/errorMessage", "vs/base/common/uri", "util"], function (require, exports, http, https, tls, nodeurl, os, fs, cp, objects_1, strings_1, vscode_proxy_agent_1, errorMessage_1, uri_1, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function connectProxyResolver(extHostWorkspace, configProvider, extensionService, extHostLogService, mainThreadTelemetry) {
        const resolveProxy = setupProxyResolution(extHostWorkspace, configProvider, extHostLogService, mainThreadTelemetry);
        const lookup = createPatchedModules(configProvider, resolveProxy);
        return configureModuleLoading(extensionService, lookup);
    }
    exports.connectProxyResolver = connectProxyResolver;
    const maxCacheEntries = 5000; // Cache can grow twice that much due to 'oldCache'.
    function setupProxyResolution(extHostWorkspace, configProvider, extHostLogService, mainThreadTelemetry) {
        const env = process.env;
        let settingsProxy = proxyFromConfigURL(configProvider.getConfiguration('http')
            .get('proxy'));
        configProvider.onDidChangeConfiguration(e => {
            settingsProxy = proxyFromConfigURL(configProvider.getConfiguration('http')
                .get('proxy'));
        });
        let envProxy = proxyFromConfigURL(env.https_proxy || env.HTTPS_PROXY || env.http_proxy || env.HTTP_PROXY); // Not standardized.
        let envNoProxy = noProxyFromEnv(env.no_proxy || env.NO_PROXY); // Not standardized.
        let cacheRolls = 0;
        let oldCache = new Map();
        let cache = new Map();
        function getCacheKey(url) {
            // Expecting proxies to usually be the same per scheme://host:port. Assuming that for performance.
            return nodeurl.format(Object.assign(Object.assign({}, url), { pathname: undefined, search: undefined, hash: undefined }));
        }
        function getCachedProxy(key) {
            let proxy = cache.get(key);
            if (proxy) {
                return proxy;
            }
            proxy = oldCache.get(key);
            if (proxy) {
                oldCache.delete(key);
                cacheProxy(key, proxy);
            }
            return proxy;
        }
        function cacheProxy(key, proxy) {
            cache.set(key, proxy);
            if (cache.size >= maxCacheEntries) {
                oldCache = cache;
                cache = new Map();
                cacheRolls++;
                extHostLogService.trace('ProxyResolver#cacheProxy cacheRolls', cacheRolls);
            }
        }
        let timeout;
        let count = 0;
        let duration = 0;
        let errorCount = 0;
        let cacheCount = 0;
        let envCount = 0;
        let settingsCount = 0;
        let localhostCount = 0;
        let envNoProxyCount = 0;
        let results = [];
        function logEvent() {
            timeout = undefined;
            mainThreadTelemetry.$publicLog2('resolveProxy', { count, duration, errorCount, cacheCount, cacheSize: cache.size, cacheRolls, envCount, settingsCount, localhostCount, envNoProxyCount, results });
            count = duration = errorCount = cacheCount = envCount = settingsCount = localhostCount = envNoProxyCount = 0;
            results = [];
        }
        function resolveProxy(flags, req, opts, url, callback) {
            if (!timeout) {
                timeout = setTimeout(logEvent, 10 * 60 * 1000);
            }
            useSystemCertificates(extHostLogService, flags.useSystemCertificates, opts, () => {
                useProxySettings(flags.useProxySettings, req, opts, url, callback);
            });
        }
        function useProxySettings(useProxySettings, req, opts, url, callback) {
            if (!useProxySettings) {
                callback('DIRECT');
                return;
            }
            const parsedUrl = nodeurl.parse(url); // Coming from Node's URL, sticking with that.
            const hostname = parsedUrl.hostname;
            if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '::ffff:127.0.0.1') {
                localhostCount++;
                callback('DIRECT');
                extHostLogService.trace('ProxyResolver#resolveProxy localhost', url, 'DIRECT');
                return;
            }
            if (typeof hostname === 'string' && envNoProxy(hostname, String(parsedUrl.port || opts.agent.defaultPort))) {
                envNoProxyCount++;
                callback('DIRECT');
                extHostLogService.trace('ProxyResolver#resolveProxy envNoProxy', url, 'DIRECT');
                return;
            }
            if (settingsProxy) {
                settingsCount++;
                callback(settingsProxy);
                extHostLogService.trace('ProxyResolver#resolveProxy settings', url, settingsProxy);
                return;
            }
            if (envProxy) {
                envCount++;
                callback(envProxy);
                extHostLogService.trace('ProxyResolver#resolveProxy env', url, envProxy);
                return;
            }
            const key = getCacheKey(parsedUrl);
            const proxy = getCachedProxy(key);
            if (proxy) {
                cacheCount++;
                collectResult(results, proxy, parsedUrl.protocol === 'https:' ? 'HTTPS' : 'HTTP', req);
                callback(proxy);
                extHostLogService.trace('ProxyResolver#resolveProxy cached', url, proxy);
                return;
            }
            const start = Date.now();
            extHostWorkspace.resolveProxy(url) // Use full URL to ensure it is an actually used one.
                .then(proxy => {
                if (proxy) {
                    cacheProxy(key, proxy);
                    collectResult(results, proxy, parsedUrl.protocol === 'https:' ? 'HTTPS' : 'HTTP', req);
                }
                callback(proxy);
                extHostLogService.debug('ProxyResolver#resolveProxy', url, proxy);
            }).then(() => {
                count++;
                duration = Date.now() - start + duration;
            }, err => {
                errorCount++;
                callback();
                extHostLogService.error('ProxyResolver#resolveProxy', errorMessage_1.toErrorMessage(err));
            });
        }
        return resolveProxy;
    }
    function collectResult(results, resolveProxy, connection, req) {
        const proxy = resolveProxy ? String(resolveProxy).trim().split(/\s+/, 1)[0] : 'EMPTY';
        req.on('response', res => {
            const code = `HTTP_${res.statusCode}`;
            const result = findOrCreateResult(results, proxy, connection, code);
            result.count++;
        });
        req.on('error', err => {
            const code = err && typeof err.code === 'string' && err.code || 'UNKNOWN_ERROR';
            const result = findOrCreateResult(results, proxy, connection, code);
            result.count++;
        });
    }
    function findOrCreateResult(results, proxy, connection, code) {
        for (const result of results) {
            if (result.proxy === proxy && result.connection === connection && result.code === code) {
                return result;
            }
        }
        const result = { proxy, connection, code, count: 0 };
        results.push(result);
        return result;
    }
    function proxyFromConfigURL(configURL) {
        const url = (configURL || '').trim();
        const i = url.indexOf('://');
        if (i === -1) {
            return undefined;
        }
        const scheme = url.substr(0, i).toLowerCase();
        const proxy = url.substr(i + 3);
        if (scheme === 'http') {
            return 'PROXY ' + proxy;
        }
        else if (scheme === 'https') {
            return 'HTTPS ' + proxy;
        }
        else if (scheme === 'socks') {
            return 'SOCKS ' + proxy;
        }
        return undefined;
    }
    function noProxyFromEnv(envValue) {
        const value = (envValue || '')
            .trim()
            .toLowerCase();
        if (value === '*') {
            return () => true;
        }
        const filters = value
            .split(',')
            .map(s => s.trim().split(':', 2))
            .map(([name, port]) => ({ name, port }))
            .filter(filter => !!filter.name)
            .map(({ name, port }) => {
            const domain = name[0] === '.' ? name : `.${name}`;
            return { domain, port };
        });
        if (!filters.length) {
            return () => false;
        }
        return (hostname, port) => filters.some(({ domain, port: filterPort }) => {
            return strings_1.endsWith(`.${hostname.toLowerCase()}`, domain) && (!filterPort || port === filterPort);
        });
    }
    function createPatchedModules(configProvider, resolveProxy) {
        const proxySetting = {
            config: configProvider.getConfiguration('http')
                .get('proxySupport') || 'off'
        };
        configProvider.onDidChangeConfiguration(e => {
            proxySetting.config = configProvider.getConfiguration('http')
                .get('proxySupport') || 'off';
        });
        const certSetting = {
            config: !!configProvider.getConfiguration('http')
                .get('systemCertificates')
        };
        configProvider.onDidChangeConfiguration(e => {
            certSetting.config = !!configProvider.getConfiguration('http')
                .get('systemCertificates');
        });
        return {
            http: {
                off: objects_1.assign({}, http, patches(http, resolveProxy, { config: 'off' }, certSetting, true)),
                on: objects_1.assign({}, http, patches(http, resolveProxy, { config: 'on' }, certSetting, true)),
                override: objects_1.assign({}, http, patches(http, resolveProxy, { config: 'override' }, certSetting, true)),
                onRequest: objects_1.assign({}, http, patches(http, resolveProxy, proxySetting, certSetting, true)),
                default: objects_1.assign(http, patches(http, resolveProxy, proxySetting, certSetting, false)) // run last
            },
            https: {
                off: objects_1.assign({}, https, patches(https, resolveProxy, { config: 'off' }, certSetting, true)),
                on: objects_1.assign({}, https, patches(https, resolveProxy, { config: 'on' }, certSetting, true)),
                override: objects_1.assign({}, https, patches(https, resolveProxy, { config: 'override' }, certSetting, true)),
                onRequest: objects_1.assign({}, https, patches(https, resolveProxy, proxySetting, certSetting, true)),
                default: objects_1.assign(https, patches(https, resolveProxy, proxySetting, certSetting, false)) // run last
            },
            tls: objects_1.assign(tls, tlsPatches(tls))
        };
    }
    function patches(originals, resolveProxy, proxySetting, certSetting, onRequest) {
        return {
            get: patch(originals.get),
            request: patch(originals.request)
        };
        function patch(original) {
            function patched(url, options, callback) {
                if (typeof url !== 'string' && !(url && url.searchParams)) {
                    callback = options;
                    options = url;
                    url = null;
                }
                if (typeof options === 'function') {
                    callback = options;
                    options = null;
                }
                options = options || {};
                if (options.socketPath) {
                    return original.apply(null, arguments);
                }
                const optionsPatched = options.agent instanceof vscode_proxy_agent_1.ProxyAgent;
                const config = onRequest && (options._vscodeProxySupport || /* LS */ options._vscodeSystemProxy) || proxySetting.config;
                const useProxySettings = !optionsPatched && (config === 'override' || config === 'on' && !options.agent);
                const useSystemCertificates = !optionsPatched && certSetting.config && originals === https && !options.ca;
                if (useProxySettings || useSystemCertificates) {
                    if (url) {
                        const parsed = typeof url === 'string' ? new nodeurl.URL(url) : url;
                        const urlOptions = {
                            protocol: parsed.protocol,
                            hostname: parsed.hostname.lastIndexOf('[', 0) === 0 ? parsed.hostname.slice(1, -1) : parsed.hostname,
                            port: parsed.port,
                            path: `${parsed.pathname}${parsed.search}`
                        };
                        if (parsed.username || parsed.password) {
                            options.auth = `${parsed.username}:${parsed.password}`;
                        }
                        options = Object.assign(Object.assign({}, urlOptions), options);
                    }
                    else {
                        options = Object.assign({}, options);
                    }
                    options.agent = new vscode_proxy_agent_1.ProxyAgent({
                        resolveProxy: resolveProxy.bind(undefined, { useProxySettings, useSystemCertificates }),
                        defaultPort: originals === https ? 443 : 80,
                        originalAgent: options.agent
                    });
                    return original(options, callback);
                }
                return original.apply(null, arguments);
            }
            return patched;
        }
    }
    function tlsPatches(originals) {
        return {
            createSecureContext: patch(originals.createSecureContext)
        };
        function patch(original) {
            return function (details) {
                const context = original.apply(null, arguments);
                const certs = details._vscodeAdditionalCaCerts;
                if (certs) {
                    for (const cert of certs) {
                        context.context.addCACert(cert);
                    }
                }
                return context;
            };
        }
    }
    function configureModuleLoading(extensionService, lookup) {
        return extensionService.getExtensionPathIndex()
            .then(extensionPaths => {
            const node_module = require.__$__nodeRequire('module');
            const original = node_module._load;
            node_module._load = function load(request, parent, isMain) {
                if (request === 'tls') {
                    return lookup.tls;
                }
                if (request !== 'http' && request !== 'https') {
                    return original.apply(this, arguments);
                }
                const modules = lookup[request];
                const ext = extensionPaths.findSubstr(uri_1.URI.file(parent.filename).fsPath);
                if (ext && ext.enableProposedApi) {
                    return modules[ext.proxySupport] || modules.onRequest;
                }
                return modules.default;
            };
        });
    }
    function useSystemCertificates(extHostLogService, useSystemCertificates, opts, callback) {
        if (useSystemCertificates) {
            getCaCertificates(extHostLogService)
                .then(caCertificates => {
                if (caCertificates) {
                    if (caCertificates.append) {
                        opts._vscodeAdditionalCaCerts = caCertificates.certs;
                    }
                    else {
                        opts.ca = caCertificates.certs;
                    }
                }
                callback();
            })
                .catch(err => {
                extHostLogService.error('ProxyResolver#useSystemCertificates', errorMessage_1.toErrorMessage(err));
            });
        }
        else {
            callback();
        }
    }
    let _caCertificates;
    async function getCaCertificates(extHostLogService) {
        if (!_caCertificates) {
            _caCertificates = readCaCertificates()
                .then(res => res && res.certs.length ? res : undefined)
                .catch(err => {
                extHostLogService.error('ProxyResolver#getCertificates', errorMessage_1.toErrorMessage(err));
                return undefined;
            });
        }
        return _caCertificates;
    }
    async function readCaCertificates() {
        if (process.platform === 'win32') {
            return readWindowsCaCertificates();
        }
        if (process.platform === 'darwin') {
            return readMacCaCertificates();
        }
        if (process.platform === 'linux') {
            return readLinuxCaCertificates();
        }
        return undefined;
    }
    async function readWindowsCaCertificates() {
        const winCA = await new Promise((resolve_1, reject_1) => { require(['vscode-windows-ca-certs'], resolve_1, reject_1); });
        let ders = [];
        const store = winCA();
        try {
            let der;
            while (der = store.next()) {
                ders.push(der);
            }
        }
        finally {
            store.done();
        }
        const certs = new Set(ders.map(derToPem));
        return {
            certs: Array.from(certs),
            append: true
        };
    }
    async function readMacCaCertificates() {
        const stdout = await new Promise((resolve, reject) => {
            const child = cp.spawn('/usr/bin/security', ['find-certificate', '-a', '-p']);
            const stdout = [];
            child.stdout.setEncoding('utf8');
            child.stdout.on('data', str => stdout.push(str));
            child.on('error', reject);
            child.on('exit', code => code ? reject(code) : resolve(stdout.join('')));
        });
        const certs = new Set(stdout.split(/(?=-----BEGIN CERTIFICATE-----)/g)
            .filter(pem => !!pem.length));
        return {
            certs: Array.from(certs),
            append: true
        };
    }
    const linuxCaCertificatePaths = [
        '/etc/ssl/certs/ca-certificates.crt',
        '/etc/ssl/certs/ca-bundle.crt',
    ];
    async function readLinuxCaCertificates() {
        for (const certPath of linuxCaCertificatePaths) {
            try {
                const content = await util_1.promisify(fs.readFile)(certPath, { encoding: 'utf8' });
                const certs = new Set(content.split(/(?=-----BEGIN CERTIFICATE-----)/g)
                    .filter(pem => !!pem.length));
                return {
                    certs: Array.from(certs),
                    append: false
                };
            }
            catch (err) {
                if (err.code !== 'ENOENT') {
                    throw err;
                }
            }
        }
        return undefined;
    }
    function derToPem(blob) {
        const lines = ['-----BEGIN CERTIFICATE-----'];
        const der = blob.toString('base64');
        for (let i = 0; i < der.length; i += 64) {
            lines.push(der.substr(i, 64));
        }
        lines.push('-----END CERTIFICATE-----', '');
        return lines.join(os.EOL);
    }
});
//# sourceMappingURL=proxyResolver.js.map