define(["require", "exports", "path", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/platform", "vs/base/common/uri", "vs/base/common/uriIpc", "vs/platform/extensions/common/extensions", "vs/platform/files/node/diskFileSystemProvider", "vs/platform/product/common/product", "vs/server/src/node/nls", "vs/server/src/node/util", "vs/workbench/services/extensions/node/extensionPoints"], function (require, exports, path, buffer_1, event_1, platform_1, uri_1, uriIpc_1, extensions_1, diskFileSystemProvider_1, product_1, nls_1, util_1, extensionPoints_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Extend the file provider to allow unwatching.
     */
    class Watcher extends diskFileSystemProvider_1.DiskFileSystemProvider {
        constructor() {
            super(...arguments);
            this.watches = new Map();
        }
        dispose() {
            this.watches.forEach((w) => w.dispose());
            this.watches.clear();
            super.dispose();
        }
        _watch(req, resource, opts) {
            this.watches.set(req, this.watch(resource, opts));
        }
        unwatch(req) {
            this.watches.get(req).dispose();
            this.watches.delete(req);
        }
    }
    class FileProviderChannel {
        constructor(environmentService, logService) {
            this.environmentService = environmentService;
            this.logService = logService;
            this.watchers = new Map();
            this.provider = new diskFileSystemProvider_1.DiskFileSystemProvider(this.logService);
        }
        listen(context, event, args) {
            switch (event) {
                // This is where the actual file changes are sent. The watch method just
                // adds things that will fire here. That means we have to split up
                // watchers based on the session otherwise sessions would get events for
                // other sessions. There is also no point in having the watcher unless
                // something is listening. I'm not sure there is a different way to
                // dispose, anyway.
                case "filechange":
                    const session = args[0];
                    const emitter = new event_1.Emitter({
                        onFirstListenerAdd: () => {
                            const provider = new Watcher(this.logService);
                            this.watchers.set(session, provider);
                            const transformer = util_1.getUriTransformer(context.remoteAuthority);
                            provider.onDidChangeFile((events) => {
                                emitter.fire(events.map((event) => (Object.assign(Object.assign({}, event), { resource: transformer.transformOutgoing(event.resource) }))));
                            });
                            provider.onDidErrorOccur((event) => emitter.fire(event));
                        },
                        onLastListenerRemove: () => {
                            this.watchers.get(session).dispose();
                            this.watchers.delete(session);
                        },
                    });
                    return emitter.event;
            }
            throw new Error(`Invalid listen "${event}"`);
        }
        call(_, command, args) {
            switch (command) {
                case "stat": return this.stat(args[0]);
                case "open": return this.open(args[0], args[1]);
                case "close": return this.close(args[0]);
                case "read": return this.read(args[0], args[1], args[2]);
                case "write": return this.write(args[0], args[1], args[2], args[3], args[4]);
                case "delete": return this.delete(args[0], args[1]);
                case "mkdir": return this.mkdir(args[0]);
                case "readdir": return this.readdir(args[0]);
                case "rename": return this.rename(args[0], args[1], args[2]);
                case "copy": return this.copy(args[0], args[1], args[2]);
                case "watch": return this.watch(args[0], args[1], args[2], args[3]);
                case "unwatch": return this.unwatch(args[0], args[1]);
            }
            throw new Error(`Invalid call "${command}"`);
        }
        dispose() {
            this.watchers.forEach((w) => w.dispose());
            this.watchers.clear();
        }
        async stat(resource) {
            return this.provider.stat(this.transform(resource));
        }
        async open(resource, opts) {
            return this.provider.open(this.transform(resource), opts);
        }
        async close(fd) {
            return this.provider.close(fd);
        }
        async read(fd, pos, length) {
            const buffer = buffer_1.VSBuffer.alloc(length);
            const bytesRead = await this.provider.read(fd, pos, buffer.buffer, 0, length);
            return [buffer, bytesRead];
        }
        write(fd, pos, buffer, offset, length) {
            return this.provider.write(fd, pos, buffer.buffer, offset, length);
        }
        async delete(resource, opts) {
            return this.provider.delete(this.transform(resource), opts);
        }
        async mkdir(resource) {
            return this.provider.mkdir(this.transform(resource));
        }
        async readdir(resource) {
            return this.provider.readdir(this.transform(resource));
        }
        async rename(resource, target, opts) {
            return this.provider.rename(this.transform(resource), uri_1.URI.from(target), opts);
        }
        copy(resource, target, opts) {
            return this.provider.copy(this.transform(resource), uri_1.URI.from(target), opts);
        }
        async watch(session, req, resource, opts) {
            this.watchers.get(session)._watch(req, this.transform(resource), opts);
        }
        async unwatch(session, req) {
            this.watchers.get(session).unwatch(req);
        }
        transform(resource) {
            // Used for walkthrough content.
            if (/^\/static[^/]*\//.test(resource.path)) {
                return uri_1.URI.file(this.environmentService.appRoot + resource.path.replace(/^\/static[^/]*\//, "/"));
                // Used by the webview service worker to load resources.
            }
            else if (resource.path === "/vscode-resource" && resource.query) {
                try {
                    const query = JSON.parse(resource.query);
                    if (query.requestResourcePath) {
                        return uri_1.URI.file(query.requestResourcePath);
                    }
                }
                catch (error) { /* Carry on. */ }
            }
            return uri_1.URI.from(resource);
        }
    }
    exports.FileProviderChannel = FileProviderChannel;
    class ExtensionEnvironmentChannel {
        constructor(environment, log, telemetry, connectionToken) {
            this.environment = environment;
            this.log = log;
            this.telemetry = telemetry;
            this.connectionToken = connectionToken;
        }
        listen(_, event) {
            throw new Error(`Invalid listen "${event}"`);
        }
        async call(context, command, args) {
            switch (command) {
                case "getEnvironmentData":
                    return uriIpc_1.transformOutgoingURIs(await this.getEnvironmentData(args.language), util_1.getUriTransformer(context.remoteAuthority));
                case "getDiagnosticInfo": return this.getDiagnosticInfo();
                case "disableTelemetry": return this.disableTelemetry();
            }
            throw new Error(`Invalid call "${command}"`);
        }
        async getEnvironmentData(locale) {
            console.log("environment.extensionsPath", this.environment.extensionsPath);
            return {
                pid: process.pid,
                connectionToken: this.connectionToken,
                appRoot: uri_1.URI.file(this.environment.appRoot),
                appSettingsHome: this.environment.appSettingsHome,
                settingsPath: this.environment.machineSettingsHome,
                logsPath: uri_1.URI.file(this.environment.logsPath),
                extensionsPath: uri_1.URI.file(this.environment.extensionsPath),
                extensionHostLogsPath: uri_1.URI.file(path.join(this.environment.logsPath, "extension-host")),
                globalStorageHome: uri_1.URI.file(this.environment.globalStorageHome),
                userHome: uri_1.URI.file(this.environment.userHome),
                extensions: await this.scanExtensions(locale),
                os: platform_1.OS,
            };
        }
        async scanExtensions(locale) {
            const translations = await nls_1.getTranslations(locale, this.environment.userDataPath);
            const scanMultiple = (isBuiltin, isUnderDevelopment, paths) => {
                return Promise.all(paths.map((path) => {
                    return extensionPoints_1.ExtensionScanner.scanExtensions(new extensionPoints_1.ExtensionScannerInput(product_1.default.version, product_1.default.commit, locale, !!process.env.VSCODE_DEV, path, isBuiltin, isUnderDevelopment, translations), this.log);
                }));
            };
            const scanBuiltin = async () => {
                return scanMultiple(true, false, [this.environment.builtinExtensionsPath, ...this.environment.extraBuiltinExtensionPaths]);
            };
            const scanInstalled = async () => {
                return scanMultiple(false, true, [this.environment.extensionsPath, ...this.environment.extraExtensionPaths]);
            };
            return Promise.all([scanBuiltin(), scanInstalled()]).then((allExtensions) => {
                const uniqueExtensions = new Map();
                allExtensions.forEach((multipleExtensions) => {
                    multipleExtensions.forEach((extensions) => {
                        extensions.forEach((extension) => {
                            const id = extensions_1.ExtensionIdentifier.toKey(extension.identifier);
                            if (uniqueExtensions.has(id)) {
                                const oldPath = uniqueExtensions.get(id).extensionLocation.fsPath;
                                const newPath = extension.extensionLocation.fsPath;
                                this.log.warn(`${oldPath} has been overridden ${newPath}`);
                            }
                            uniqueExtensions.set(id, extension);
                        });
                    });
                });
                return Array.from(uniqueExtensions.values());
            });
        }
        getDiagnosticInfo() {
            throw new Error("not implemented");
        }
        async disableTelemetry() {
            this.telemetry.setEnabled(false);
        }
    }
    exports.ExtensionEnvironmentChannel = ExtensionEnvironmentChannel;
    class NodeProxyService {
        constructor() {
            this._serviceBrand = undefined;
            this._onMessage = new event_1.Emitter();
            this.onMessage = this._onMessage.event;
            this._$onMessage = new event_1.Emitter();
            this.$onMessage = this._$onMessage.event;
            this._onDown = new event_1.Emitter();
            this.onDown = this._onDown.event;
            this._onUp = new event_1.Emitter();
            this.onUp = this._onUp.event;
            // Unused because the server connection will never permanently close.
            this._onClose = new event_1.Emitter();
            this.onClose = this._onClose.event;
            // TODO: down/up
            const { Server } = util_1.localRequire("@coder/node-browser/out/server/server");
            this.server = new Server({
                onMessage: this.$onMessage,
                onClose: this.onClose,
                onDown: this.onDown,
                onUp: this.onUp,
                send: (message) => {
                    this._onMessage.fire(message);
                }
            });
        }
        send(message) {
            this._$onMessage.fire(message);
        }
    }
    exports.NodeProxyService = NodeProxyService;
});
//# sourceMappingURL=channel.js.map