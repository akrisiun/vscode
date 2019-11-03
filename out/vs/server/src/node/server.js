define(["require", "exports", "crypto", "fs", "http", "net", "path", "querystring", "tls", "url", "util", "vs/base/common/event", "vs/base/common/extpath", "vs/base/common/network", "vs/base/common/uri", "vs/base/common/uuid", "vs/base/node/id", "vs/base/node/pfs", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/node/ipc", "vs/code/electron-browser/sharedProcess/contrib/logsDataCleaner", "vs/platform/configuration/common/configuration", "vs/platform/configuration/node/configurationService", "vs/platform/debug/common/extensionHostDebugIpc", "vs/platform/environment/common/environment", "vs/platform/environment/node/environmentService", "vs/platform/extensionManagement/common/extensionGalleryService", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementIpc", "vs/platform/extensionManagement/node/extensionManagementService", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/platform/files/node/diskFileSystemProvider", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/localizations/common/localizations", "vs/platform/localizations/node/localizations", "vs/platform/log/common/log", "vs/platform/log/common/logIpc", "vs/platform/log/node/spdlogService", "vs/platform/product/common/product", "vs/platform/product/common/productService", "vs/platform/remote/common/remoteAgentFileSystemChannel", "vs/platform/request/common/request", "vs/platform/request/common/requestIpc", "vs/platform/request/node/requestService", "vs/platform/telemetry/browser/errorTelemetry", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryService", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/telemetry/node/appInsightsAppender", "vs/platform/telemetry/node/commonProperties", "vs/platform/update/electron-main/updateIpc", "vs/server/src/common/nodeProxy", "vs/server/src/common/telemetry", "vs/server/src/common/util", "vs/server/src/node/channel", "vs/server/src/node/connection", "vs/server/src/node/insights", "vs/server/src/node/nls", "vs/server/src/node/protocol", "vs/server/src/node/update", "vs/server/src/node/util", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, crypto, fs, http, net, path, querystring, tls, url, util, event_1, extpath_1, network_1, uri_1, uuid_1, id_1, pfs_1, ipc_1, ipc_2, logsDataCleaner_1, configuration_1, configurationService_1, extensionHostDebugIpc_1, environment_1, environmentService_1, extensionGalleryService_1, extensionManagement_1, extensionManagementIpc_1, extensionManagementService_1, files_1, fileService_1, diskFileSystemProvider_1, descriptors_1, instantiationService_1, serviceCollection_1, localizations_1, localizations_2, log_1, logIpc_1, spdlogService_1, product_1, productService_1, remoteAgentFileSystemChannel_1, request_1, requestIpc_1, requestService_1, errorTelemetry_1, telemetry_1, telemetryService_1, telemetryUtils_1, appInsightsAppender_1, commonProperties_1, updateIpc_1, nodeProxy_1, telemetry_2, util_1, channel_1, connection_1, insights_1, nls_1, protocol_1, update_1, util_2, remoteAgentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const tarFs = util_2.localRequire("tar-fs/index");
    var HttpCode;
    (function (HttpCode) {
        HttpCode[HttpCode["Ok"] = 200] = "Ok";
        HttpCode[HttpCode["Redirect"] = 302] = "Redirect";
        HttpCode[HttpCode["NotFound"] = 404] = "NotFound";
        HttpCode[HttpCode["BadRequest"] = 400] = "BadRequest";
        HttpCode[HttpCode["Unauthorized"] = 401] = "Unauthorized";
        HttpCode[HttpCode["LargePayload"] = 413] = "LargePayload";
        HttpCode[HttpCode["ServerError"] = 500] = "ServerError";
    })(HttpCode = exports.HttpCode || (exports.HttpCode = {}));
    class HttpError extends Error {
        constructor(message, code) {
            super(message);
            this.code = code;
            // @ts-ignore
            this.name = this.constructor.name;
            Error.captureStackTrace(this, this.constructor);
        }
    }
    exports.HttpError = HttpError;
    class Server {
        constructor(options) {
            this.rootPath = path.resolve(__dirname, "../../../../..");
            this.serverRoot = path.join(this.rootPath, "/out/vs/server/src");
            this.allowedRequestPaths = [this.rootPath];
            this.onRequest = async (request, response) => {
                try {
                    const parsedUrl = request.url ? url.parse(request.url, true) : { query: {} };
                    const payload = await this.preHandleRequest(request, parsedUrl);
                    response.writeHead(payload.redirect ? HttpCode.Redirect : payload.code || HttpCode.Ok, Object.assign(Object.assign(Object.assign(Object.assign({ "Content-Type": payload.mime || util_2.getMediaMime(payload.filePath) }, (payload.redirect ? { Location: this.withBase(request, payload.redirect) } : {})), (request.headers["service-worker"] ? { "Service-Worker-Allowed": this.options.basePath || "/" } : {})), (payload.cache ? { "Cache-Control": "public, max-age=31536000" } : {})), payload.headers));
                    if (payload.stream) {
                        payload.stream.on("error", (error) => {
                            response.writeHead(error.code === "ENOENT" ? HttpCode.NotFound : HttpCode.ServerError);
                            response.end(error.message);
                        });
                        payload.stream.pipe(response);
                    }
                    else {
                        response.end(payload.content);
                    }
                }
                catch (error) {
                    if (error.code === "ENOENT" || error.code === "EISDIR") {
                        error = new HttpError("Not found", HttpCode.NotFound);
                    }
                    response.writeHead(typeof error.code === "number" ? error.code : HttpCode.ServerError);
                    response.end(error.message);
                }
            };
            this.onUpgrade = async (request, socket) => {
                try {
                    await this.preHandleWebSocket(request, socket);
                }
                catch (error) {
                    socket.destroy();
                    console.error(error.message);
                }
            };
            this.options = Object.assign(Object.assign({ host: options.auth === "password" && options.cert ? "0.0.0.0" : "localhost" }, options), { basePath: options.basePath ? options.basePath.replace(/\/+$/, "") : "" });
            this.protocol = this.options.cert ? "https" : "http";
            if (this.protocol === "https") {
                const httpolyglot = util_2.localRequire("httpolyglot/lib/index");
                this.server = httpolyglot.createServer({
                    cert: this.options.cert && fs.readFileSync(this.options.cert),
                    key: this.options.certKey && fs.readFileSync(this.options.certKey),
                }, this.onRequest);
            }
            else {
                this.server = http.createServer(this.onRequest);
            }
        }
        listen() {
            if (!this.listenPromise) {
                this.listenPromise = new Promise((resolve, reject) => {
                    this.server.on("error", reject);
                    this.server.on("upgrade", this.onUpgrade);
                    const onListen = () => resolve(this.address());
                    if (this.options.socket) {
                        this.server.listen(this.options.socket, onListen);
                    }
                    else {
                        this.server.listen(this.options.port, this.options.host, onListen);
                    }
                });
            }
            return this.listenPromise;
        }
        /**
         * The *local* address of the server.
         */
        address() {
            const address = this.server.address();
            const endpoint = typeof address !== "string"
                ? (address.address === "::" ? "localhost" : address.address) + ":" + address.port
                : address;
            return `${this.protocol}://${endpoint}`;
        }
        async getResource(...parts) {
            const filePath = this.ensureAuthorizedFilePath(...parts);
            return { content: await util.promisify(fs.readFile)(filePath), filePath };
        }
        async getAnyResource(...parts) {
            const filePath = path.join(...parts);
            return { content: await util.promisify(fs.readFile)(filePath), filePath };
        }
        async getTarredResource(...parts) {
            const filePath = this.ensureAuthorizedFilePath(...parts);
            return { stream: tarFs.pack(filePath), filePath, mime: "application/tar", cache: true };
        }
        ensureAuthorizedFilePath(...parts) {
            const filePath = path.join(...parts);
            if (!this.isAllowedRequestPath(filePath)) {
                throw new HttpError("Unauthorized", HttpCode.Unauthorized);
            }
            return filePath;
        }
        withBase(request, path) {
            const [, query] = request.url ? util_1.split(request.url, "?") : [];
            return `${this.protocol}://${request.headers.host}${this.options.basePath}${path}${query ? `?${query}` : ""}`;
        }
        isAllowedRequestPath(path) {
            for (let i = 0; i < this.allowedRequestPaths.length; ++i) {
                if (path.indexOf(this.allowedRequestPaths[i]) === 0) {
                    return true;
                }
            }
            return false;
        }
        async preHandleRequest(request, parsedUrl) {
            const secure = request.connection.encrypted;
            if (this.options.cert && !secure) {
                return { redirect: request.url };
            }
            const fullPath = decodeURIComponent(parsedUrl.pathname || "/");
            const match = fullPath.match(/^(\/?[^/]*)(.*)$/);
            let [/* ignore */ , base, requestPath] = match
                ? match.map((p) => p.replace(/\/+$/, ""))
                : ["", "", ""];
            if (base.indexOf(".") !== -1) { // Assume it's a file at the root.
                requestPath = base;
                base = "/";
            }
            else if (base === "") { // Happens if it's a plain `domain.com`.
                base = "/";
            }
            base = path.normalize(base);
            requestPath = path.normalize(requestPath || "/index.html");
            if (base !== "/login" || this.options.auth !== "password" || requestPath !== "/index.html") {
                this.ensureGet(request);
            }
            // Allow for a versioned static endpoint. This lets us cache every static
            // resource underneath the path based on the version without any work and
            // without adding query parameters which have their own issues.
            // REVIEW: Discuss whether this is the best option; this is sort of a quick
            // hack almost to get caching in the meantime but it does work pretty well.
            if (/^\/static-/.test(base)) {
                base = "/static";
            }
            switch (base) {
                case "/":
                    switch (requestPath) {
                        case "/favicon.ico":
                        case "/manifest.json":
                            const response = await this.getResource(this.serverRoot, "media", requestPath);
                            response.cache = true;
                            return response;
                    }
                    if (!this.authenticate(request)) {
                        return { redirect: "/login" };
                    }
                    break;
                case "/static":
                    const response = await this.getResource(this.rootPath, requestPath);
                    response.cache = true;
                    return response;
                case "/login":
                    if (this.options.auth !== "password" || requestPath !== "/index.html") {
                        throw new HttpError("Not found", HttpCode.NotFound);
                    }
                    return this.tryLogin(request);
                default:
                    if (!this.authenticate(request)) {
                        throw new HttpError("Unauthorized", HttpCode.Unauthorized);
                    }
                    break;
            }
            return this.handleRequest(base, requestPath, parsedUrl, request);
        }
        preHandleWebSocket(request, socket) {
            socket.on("error", () => socket.destroy());
            socket.on("end", () => socket.destroy());
            this.ensureGet(request);
            if (!this.authenticate(request)) {
                throw new HttpError("Unauthorized", HttpCode.Unauthorized);
            }
            else if (!request.headers.upgrade || request.headers.upgrade.toLowerCase() !== "websocket") {
                throw new Error("HTTP/1.1 400 Bad Request");
            }
            // This magic value is specified by the websocket spec.
            const magic = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
            const reply = crypto.createHash("sha1")
                .update(request.headers["sec-websocket-key"] + magic)
                .digest("base64");
            socket.write([
                "HTTP/1.1 101 Switching Protocols",
                "Upgrade: websocket",
                "Connection: Upgrade",
                `Sec-WebSocket-Accept: ${reply}`,
            ].join("\r\n") + "\r\n\r\n");
            const parsedUrl = request.url ? url.parse(request.url, true) : { query: {} };
            return this.handleWebSocket(socket, parsedUrl);
        }
        async tryLogin(request) {
            if (this.authenticate(request) && (request.method === "GET" || request.method === "POST")) {
                return { redirect: "/" };
            }
            if (request.method === "POST") {
                const data = await this.getData(request);
                if (this.authenticate(request, data)) {
                    return {
                        redirect: "/",
                        headers: { "Set-Cookie": `password=${data.password}` }
                    };
                }
                console.error("Failed login attempt", JSON.stringify({
                    xForwardedFor: request.headers["x-forwarded-for"],
                    remoteAddress: request.connection.remoteAddress,
                    userAgent: request.headers["user-agent"],
                    timestamp: Math.floor(new Date().getTime() / 1000),
                }));
                return this.getLogin("Invalid password", data);
            }
            this.ensureGet(request);
            return this.getLogin();
        }
        async getLogin(error = "", payload) {
            const filePath = path.join(this.serverRoot, "browser/login.html");
            const content = (await util.promisify(fs.readFile)(filePath, "utf8"))
                .replace("{{ERROR}}", error)
                .replace("display:none", error ? "display:block" : "display:none")
                .replace('value=""', `value="${payload && payload.password || ""}"`);
            return { content, filePath };
        }
        ensureGet(request) {
            if (request.method !== "GET") {
                throw new HttpError(`Unsupported method ${request.method}`, HttpCode.BadRequest);
            }
        }
        getData(request) {
            return request.method === "POST"
                ? new Promise((resolve, reject) => {
                    let body = "";
                    const onEnd = () => {
                        off();
                        resolve(querystring.parse(body));
                    };
                    const onError = (error) => {
                        off();
                        reject(error);
                    };
                    const onData = (d) => {
                        body += d;
                        if (body.length > 1e6) {
                            onError(new HttpError("Payload is too large", HttpCode.LargePayload));
                            request.connection.destroy();
                        }
                    };
                    const off = () => {
                        request.off("error", onError);
                        request.off("data", onError);
                        request.off("end", onEnd);
                    };
                    request.on("error", onError);
                    request.on("data", onData);
                    request.on("end", onEnd);
                })
                : Promise.resolve({});
        }
        authenticate(request, payload) {
            if (this.options.auth !== "password") {
                return true;
            }
            const safeCompare = util_2.localRequire("safe-compare/index");
            if (typeof payload === "undefined") {
                payload = this.parseCookies(request);
            }
            return !!this.options.password && safeCompare(payload.password || "", this.options.password);
        }
        parseCookies(request) {
            const cookies = {};
            if (request.headers.cookie) {
                request.headers.cookie.split(";").forEach((keyValue) => {
                    const [key, value] = util_1.split(keyValue, "=");
                    cookies[key] = decodeURI(value);
                });
            }
            return cookies;
        }
    }
    exports.Server = Server;
    class MainServer extends Server {
        constructor(options, args) {
            super(options);
            this._onDidClientConnect = new event_1.Emitter();
            this.onDidClientConnect = this._onDidClientConnect.event;
            this.ipc = new ipc_1.IPCServer(this.onDidClientConnect);
            this.maxExtraOfflineConnections = 0;
            this.connections = new Map();
            this.services = new serviceCollection_1.ServiceCollection();
            this._onProxyConnect = new event_1.Emitter();
            this.proxyPipe = path.join(util_2.tmpdir, "tls-proxy");
            this.proxyTimeout = 5000;
            this.settings = {};
            this.heartbeatInterval = 60000;
            this.lastHeartbeat = 0;
            /**
             * Since we can't pass TLS sockets to children, use this to proxy the socket
             * and pass a non-TLS socket.
             */
            this.createProxy = async (socket) => {
                if (!(socket instanceof tls.TLSSocket)) {
                    return socket;
                }
                await this.startProxyServer();
                return new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        listener.dispose();
                        socket.destroy();
                        proxy.destroy();
                        reject(new Error("TLS socket proxy timed out"));
                    }, this.proxyTimeout);
                    const listener = this._onProxyConnect.event((connection) => {
                        connection.once("data", (data) => {
                            if (!socket.destroyed && !proxy.destroyed && data.toString() === id) {
                                clearTimeout(timeout);
                                listener.dispose();
                                [[proxy, socket], [socket, proxy]].forEach(([a, b]) => {
                                    a.pipe(b);
                                    a.on("error", () => b.destroy());
                                    a.on("close", () => b.destroy());
                                    a.on("end", () => b.end());
                                });
                                resolve(connection);
                            }
                        });
                    });
                    const id = uuid_1.generateUuid();
                    const proxy = net.connect(this.proxyPipe);
                    proxy.once("connect", () => proxy.write(id));
                });
            };
            this.servicesPromise = this.initializeServices(args);
        }
        async listen() {
            const environment = this.services.get(environment_1.IEnvironmentService);
            const [address] = await Promise.all([
                super.listen(), ...[
                    environment.extensionsPath,
                ].map((p) => pfs_1.mkdirp(p).then(() => p)),
            ]);
            return address;
        }
        async handleWebSocket(socket, parsedUrl) {
            this.heartbeat();
            if (!parsedUrl.query.reconnectionToken) {
                throw new Error("Reconnection token is missing from query parameters");
            }
            const protocol = new protocol_1.Protocol(await this.createProxy(socket), {
                reconnectionToken: parsedUrl.query.reconnectionToken,
                reconnection: parsedUrl.query.reconnection === "true",
                skipWebSocketFrames: parsedUrl.query.skipWebSocketFrames === "true",
            });
            try {
                await this.connect(await protocol.handshake(), protocol);
            }
            catch (error) {
                protocol.sendMessage({ type: "error", reason: error.message });
                protocol.dispose();
                protocol.getSocket().dispose();
            }
        }
        async handleRequest(base, requestPath, parsedUrl, request) {
            this.heartbeat();
            switch (base) {
                case "/": return this.getRoot(request, parsedUrl);
                case "/resource":
                case "/vscode-remote-resource":
                    if (typeof parsedUrl.query.path === "string") {
                        return this.getAnyResource(parsedUrl.query.path);
                    }
                    break;
                case "/tar":
                    if (typeof parsedUrl.query.path === "string") {
                        return this.getTarredResource(parsedUrl.query.path);
                    }
                    break;
                case "/webview":
                    if (/^\/vscode-resource/.test(requestPath)) {
                        return this.getAnyResource(requestPath.replace(/^\/vscode-resource(\/file)?/, ""));
                    }
                    return this.getResource(this.rootPath, "out/vs/workbench/contrib/webview/browser/pre", requestPath);
            }
            throw new HttpError("Not found", HttpCode.NotFound);
        }
        async getRoot(request, parsedUrl) {
            const filePath = path.join(this.serverRoot, "browser/workbench.html");
            let [content, startPath] = await Promise.all([
                util.promisify(fs.readFile)(filePath, "utf8"),
                this.getFirstValidPath([
                    { path: parsedUrl.query.workspace, workspace: true },
                    { path: parsedUrl.query.folder, workspace: false },
                    (await this.readSettings()).lastVisited,
                    { path: this.options.openUri }
                ]),
                this.servicesPromise,
            ]);
            if (startPath) {
                this.writeSettings({
                    lastVisited: {
                        path: startPath.uri.fsPath,
                        workspace: startPath.workspace
                    },
                });
            }
            const logger = this.services.get(log_1.ILogService);
            logger.info("request.url", `"${request.url}"`);
            const remoteAuthority = request.headers.host;
            const transformer = util_2.getUriTransformer(remoteAuthority);
            const environment = this.services.get(environment_1.IEnvironmentService);
            const options = {
                WORKBENCH_WEB_CONFIGURATION: {
                    workspaceUri: startPath && startPath.workspace ? transformer.transformOutgoing(startPath.uri) : undefined,
                    folderUri: startPath && !startPath.workspace ? transformer.transformOutgoing(startPath.uri) : undefined,
                    remoteAuthority,
                    logLevel: log_1.getLogLevel(environment),
                },
                REMOTE_USER_DATA_URI: transformer.transformOutgoing(uri_1.URI.file(environment.userDataPath)),
                PRODUCT_CONFIGURATION: {
                    extensionsGallery: product_1.default.extensionsGallery,
                },
                NLS_CONFIGURATION: await nls_1.getNlsConfiguration(environment.args.locale || await nls_1.getLocaleFromConfig(environment.userDataPath), environment.userDataPath),
            };
            content = content.replace(/{{COMMIT}}/g, product_1.default.commit || "");
            for (const key in options) {
                content = content.replace(`"{{${key}}}"`, `'${JSON.stringify(options[key])}'`);
            }
            return { content, filePath };
        }
        /**
         * Choose the first valid path. If `workspace` is undefined then either a
         * workspace or a directory are acceptable. Otherwise it must be a file if a
         * workspace or a directory otherwise.
         */
        async getFirstValidPath(startPaths) {
            const logger = this.services.get(log_1.ILogService);
            const cwd = process.env.VSCODE_CWD || process.cwd();
            for (let i = 0; i < startPaths.length; ++i) {
                const startPath = startPaths[i];
                if (!startPath) {
                    continue;
                }
                const paths = typeof startPath.path === "string" ? [startPath.path] : (startPath.path || []);
                for (let j = 0; j < paths.length; ++j) {
                    const uri = uri_1.URI.file(extpath_1.sanitizeFilePath(paths[j], cwd));
                    try {
                        const stat = await util.promisify(fs.stat)(uri.fsPath);
                        if (typeof startPath.workspace === "undefined" || startPath.workspace !== stat.isDirectory()) {
                            return { uri, workspace: !stat.isDirectory() };
                        }
                    }
                    catch (error) {
                        logger.warn(error.message);
                    }
                }
            }
            return undefined;
        }
        async connect(message, protocol) {
            if (product_1.default.commit && message.commit !== product_1.default.commit) {
                throw new Error(`Version mismatch (${message.commit} instead of ${product_1.default.commit})`);
            }
            switch (message.desiredConnectionType) {
                case 2 /* ExtensionHost */:
                case 1 /* Management */:
                    if (!this.connections.has(message.desiredConnectionType)) {
                        this.connections.set(message.desiredConnectionType, new Map());
                    }
                    const connections = this.connections.get(message.desiredConnectionType);
                    const ok = async () => {
                        return message.desiredConnectionType === 2 /* ExtensionHost */
                            ? { debugPort: await this.getDebugPort() }
                            : { type: "ok" };
                    };
                    const token = protocol.options.reconnectionToken;
                    if (protocol.options.reconnection && connections.has(token)) {
                        protocol.sendMessage(await ok());
                        const buffer = protocol.readEntireBuffer();
                        protocol.dispose();
                        return connections.get(token).reconnect(protocol.getSocket(), buffer);
                    }
                    else if (protocol.options.reconnection || connections.has(token)) {
                        throw new Error(protocol.options.reconnection
                            ? "Unrecognized reconnection token"
                            : "Duplicate reconnection token");
                    }
                    protocol.sendMessage(await ok());
                    let connection;
                    if (message.desiredConnectionType === 1 /* Management */) {
                        connection = new connection_1.ManagementConnection(protocol, token);
                        this._onDidClientConnect.fire({
                            protocol, onDidClientDisconnect: connection.onClose,
                        });
                        // TODO: Need a way to match clients with a connection. For now
                        // dispose everything which only works because no extensions currently
                        // utilize long-running proxies.
                        this.services.get(nodeProxy_1.INodeProxyService)._onUp.fire();
                        connection.onClose(() => this.services.get(nodeProxy_1.INodeProxyService)._onDown.fire());
                    }
                    else {
                        const buffer = protocol.readEntireBuffer();
                        connection = new connection_1.ExtensionHostConnection(message.args ? message.args.language : "en", protocol, buffer, token, this.services.get(log_1.ILogService), this.services.get(environment_1.IEnvironmentService));
                    }
                    connections.set(token, connection);
                    connection.onClose(() => connections.delete(token));
                    this.disposeOldOfflineConnections(connections);
                    break;
                case 3 /* Tunnel */: return protocol.tunnel();
                default: throw new Error("Unrecognized connection type");
            }
        }
        disposeOldOfflineConnections(connections) {
            const offline = Array.from(connections.values())
                .filter((connection) => typeof connection.offline !== "undefined");
            for (let i = 0, max = offline.length - this.maxExtraOfflineConnections; i < max; ++i) {
                offline[i].dispose();
            }
        }
        async initializeServices(args) {
            const environmentService = new environmentService_1.EnvironmentService(args, process.execPath);
            const logService = new spdlogService_1.SpdLogService(remoteAgentService_1.RemoteExtensionLogFileName, environmentService.logsPath, log_1.getLogLevel(environmentService));
            const fileService = new fileService_1.FileService(logService);
            fileService.registerProvider(network_1.Schemas.file, new diskFileSystemProvider_1.DiskFileSystemProvider(logService));
            this.allowedRequestPaths.push(path.join(environmentService.userDataPath, "clp"), // Language packs.
            environmentService.extensionsPath, environmentService.builtinExtensionsPath, ...environmentService.extraExtensionPaths, ...environmentService.extraBuiltinExtensionPaths);
            this.ipc.registerChannel("logger", new logIpc_1.LoggerChannel(logService));
            this.ipc.registerChannel(extensionHostDebugIpc_1.ExtensionHostDebugBroadcastChannel.ChannelName, new extensionHostDebugIpc_1.ExtensionHostDebugBroadcastChannel());
            this.services.set(log_1.ILogService, logService);
            this.services.set(environment_1.IEnvironmentService, environmentService);
            this.services.set(configuration_1.IConfigurationService, new descriptors_1.SyncDescriptor(configurationService_1.ConfigurationService, [environmentService.machineSettingsResource]));
            this.services.set(request_1.IRequestService, new descriptors_1.SyncDescriptor(requestService_1.RequestService));
            this.services.set(files_1.IFileService, fileService);
            this.services.set(productService_1.IProductService, Object.assign({ _serviceBrand: undefined }, product_1.default));
            this.services.set(extensionManagement_1.IExtensionGalleryService, new descriptors_1.SyncDescriptor(extensionGalleryService_1.ExtensionGalleryService));
            this.services.set(extensionManagement_1.IExtensionManagementService, new descriptors_1.SyncDescriptor(extensionManagementService_1.ExtensionManagementService));
            if (!environmentService.args["disable-telemetry"]) {
                this.services.set(telemetry_1.ITelemetryService, new descriptors_1.SyncDescriptor(telemetryService_1.TelemetryService, [{
                        appender: telemetryUtils_1.combinedAppender(new appInsightsAppender_1.AppInsightsAppender("code-server", null, () => new insights_1.TelemetryClient(), logService), new telemetryUtils_1.LogAppender(logService)),
                        commonProperties: commonProperties_1.resolveCommonProperties(product_1.default.commit, product_1.default.codeServerVersion, await id_1.getMachineId(), [], environmentService.installSourcePath, "code-server"),
                        piiPaths: this.allowedRequestPaths,
                    }]));
            }
            else {
                this.services.set(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            }
            await new Promise((resolve) => {
                const instantiationService = new instantiationService_1.InstantiationService(this.services);
                this.services.set(localizations_1.ILocalizationsService, instantiationService.createInstance(localizations_2.LocalizationsService));
                this.services.set(nodeProxy_1.INodeProxyService, instantiationService.createInstance(channel_1.NodeProxyService));
                instantiationService.invokeFunction(() => {
                    instantiationService.createInstance(logsDataCleaner_1.LogsDataCleaner);
                    const telemetryService = this.services.get(telemetry_1.ITelemetryService);
                    this.ipc.registerChannel("extensions", new extensionManagementIpc_1.ExtensionManagementChannel(this.services.get(extensionManagement_1.IExtensionManagementService), (context) => util_2.getUriTransformer(context.remoteAuthority)));
                    this.ipc.registerChannel("remoteextensionsenvironment", new channel_1.ExtensionEnvironmentChannel(environmentService, logService, telemetryService, this.options.connectionToken || ""));
                    this.ipc.registerChannel("request", new requestIpc_1.RequestChannel(this.services.get(request_1.IRequestService)));
                    this.ipc.registerChannel("telemetry", new telemetry_2.TelemetryChannel(telemetryService));
                    this.ipc.registerChannel("nodeProxy", new nodeProxy_1.NodeProxyChannel(this.services.get(nodeProxy_1.INodeProxyService)));
                    this.ipc.registerChannel("localizations", ipc_2.createChannelReceiver(this.services.get(localizations_1.ILocalizationsService)));
                    this.ipc.registerChannel("update", new updateIpc_1.UpdateChannel(instantiationService.createInstance(update_1.UpdateService)));
                    this.ipc.registerChannel(remoteAgentFileSystemChannel_1.REMOTE_FILE_SYSTEM_CHANNEL_NAME, new channel_1.FileProviderChannel(environmentService, logService));
                    resolve(new errorTelemetry_1.default(telemetryService));
                });
            });
        }
        /**
         * TODO: implement.
         */
        async getDebugPort() {
            return undefined;
        }
        async startProxyServer() {
            if (!this._proxyServer) {
                this._proxyServer = new Promise(async (resolve) => {
                    this.proxyPipe = await this.findFreeSocketPath(this.proxyPipe);
                    await pfs_1.mkdirp(util_2.tmpdir);
                    await pfs_1.rimraf(this.proxyPipe);
                    const proxyServer = net.createServer((p) => this._onProxyConnect.fire(p));
                    proxyServer.once("listening", resolve);
                    proxyServer.listen(this.proxyPipe);
                });
            }
            return this._proxyServer;
        }
        async findFreeSocketPath(basePath, maxTries = 100) {
            const canConnect = (path) => {
                return new Promise((resolve) => {
                    const socket = net.connect(path);
                    socket.once("error", () => resolve(false));
                    socket.once("connect", () => {
                        socket.destroy();
                        resolve(true);
                    });
                });
            };
            let i = 0;
            let path = basePath;
            while (await canConnect(path) && i < maxTries) {
                path = `${basePath}-${++i}`;
            }
            return path;
        }
        /**
         * Return the file path for Coder settings.
         */
        get settingsPath() {
            const environment = this.services.get(environment_1.IEnvironmentService);
            return path.join(environment.userDataPath, "coder.json");
        }
        /**
         * Read settings from the file. On a failure return last known settings and
         * log a warning.
         *
         */
        async readSettings() {
            try {
                const raw = (await util.promisify(fs.readFile)(this.settingsPath, "utf8")).trim();
                this.settings = raw ? JSON.parse(raw) : {};
            }
            catch (error) {
                if (error.code !== "ENOENT") {
                    this.services.get(log_1.ILogService).warn(error.message);
                }
            }
            return this.settings;
        }
        /**
         * Write settings combined with current settings. On failure log a warning.
         */
        async writeSettings(newSettings) {
            this.settings = Object.assign(Object.assign({}, this.settings), newSettings);
            try {
                await util.promisify(fs.writeFile)(this.settingsPath, JSON.stringify(this.settings));
            }
            catch (error) {
                this.services.get(log_1.ILogService).warn(error.message);
            }
        }
        /**
         * Return the file path for the heartbeat file.
         */
        get heartbeatPath() {
            const environment = this.services.get(environment_1.IEnvironmentService);
            return path.join(environment.userDataPath, "heartbeat");
        }
        /**
         * Return all online connections regardless of type.
         */
        get onlineConnections() {
            const online = [];
            this.connections.forEach((connections) => {
                connections.forEach((connection) => {
                    if (typeof connection.offline === "undefined") {
                        online.push(connection);
                    }
                });
            });
            return online;
        }
        /**
         * Write to the heartbeat file if we haven't already done so within the
         * timeout and start or reset a timer that keeps running as long as there are
         * active connections. Failures are logged as warnings.
         */
        heartbeat() {
            const now = Date.now();
            if (now - this.lastHeartbeat >= this.heartbeatInterval) {
                util.promisify(fs.writeFile)(this.heartbeatPath, "").catch((error) => {
                    this.services.get(log_1.ILogService).warn(error.message);
                });
                this.lastHeartbeat = now;
                clearTimeout(this.heartbeatTimer); // We can clear undefined so ! is fine.
                this.heartbeatTimer = setTimeout(() => {
                    if (this.onlineConnections.length > 0) {
                        this.heartbeat();
                    }
                }, this.heartbeatInterval);
            }
        }
    }
    exports.MainServer = MainServer;
});
//# sourceMappingURL=server.js.map