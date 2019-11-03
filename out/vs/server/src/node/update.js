var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "child_process", "os", "path", "util", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/uri", "vs/base/node/pfs", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/product/common/product", "vs/platform/request/common/request", "vs/platform/update/common/update", "vs/platform/update/electron-main/abstractUpdateService", "vs/server/src/node/ipc", "vs/server/src/node/marketplace", "vs/server/src/node/util", "zlib"], function (require, exports, cp, os, path, util, buffer_1, cancellation_1, uri_1, pfs, configuration_1, environment_1, files_1, log_1, product_1, request_1, update_1, abstractUpdateService_1, ipc_1, marketplace_1, util_1, zlib) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let UpdateService = class UpdateService extends abstractUpdateService_1.AbstractUpdateService {
        constructor(configurationService, environmentService, requestService, logService, fileService) {
            super(null, configurationService, environmentService, requestService, logService);
            this.fileService = fileService;
        }
        async isLatestVersion(latest) {
            if (!latest) {
                latest = await this.getLatestVersion();
            }
            if (latest) {
                const latestMajor = parseInt(latest.name);
                const currentMajor = parseInt(product_1.default.codeServerVersion);
                return !isNaN(latestMajor) && !isNaN(currentMajor) &&
                    currentMajor <= latestMajor && latest.name === product_1.default.codeServerVersion;
            }
            return true;
        }
        buildUpdateFeedUrl(quality) {
            return `${product_1.default.updateUrl}/${quality}`;
        }
        async doQuitAndInstall() {
            ipc_1.ipcMain.relaunch();
        }
        async doCheckForUpdates(context) {
            this.setState(update_1.State.CheckingForUpdates(context));
            try {
                const update = await this.getLatestVersion();
                if (!update || this.isLatestVersion(update)) {
                    this.setState(update_1.State.Idle(1 /* Archive */));
                }
                else {
                    this.setState(update_1.State.AvailableForDownload({
                        version: update.name,
                        productVersion: update.name,
                    }));
                }
            }
            catch (error) {
                this.onRequestError(error, !!context);
            }
        }
        async getLatestVersion() {
            const data = await this.requestService.request({
                url: this.url,
                headers: { "User-Agent": "code-server" },
            }, cancellation_1.CancellationToken.None);
            return request_1.asJson(data);
        }
        async doDownloadUpdate(state) {
            this.setState(update_1.State.Downloading(state.update));
            const target = os.platform();
            const releaseName = await this.buildReleaseName(state.update.version);
            const url = "https://github.com/cdr/code-server/releases/download/"
                + `${state.update.version}/${releaseName}`
                + `.${target === "darwin" ? "zip" : "tar.gz"}`;
            const downloadPath = path.join(util_1.tmpdir, `${state.update.version}-archive`);
            const extractPath = path.join(util_1.tmpdir, state.update.version);
            try {
                await pfs.mkdirp(util_1.tmpdir);
                const context = await this.requestService.request({ url }, cancellation_1.CancellationToken.None);
                // Decompress the gzip as we download. If the gzip encoding is set then
                // the request service already does this.
                // HACK: This uses knowledge of the internals of the request service.
                if (target !== "darwin" && context.res.headers["content-encoding"] !== "gzip") {
                    const stream = context.res;
                    stream.removeAllListeners();
                    context.stream = buffer_1.toVSBufferReadableStream(stream.pipe(zlib.createGunzip()));
                }
                await this.fileService.writeFile(uri_1.URI.file(downloadPath), context.stream);
                await marketplace_1.extract(downloadPath, extractPath, undefined, cancellation_1.CancellationToken.None);
                const newBinary = path.join(extractPath, releaseName, "code-server");
                if (!pfs.exists(newBinary)) {
                    throw new Error("No code-server binary in extracted archive");
                }
                await pfs.unlink(process.argv[0]); // Must unlink first to avoid ETXTBSY.
                await pfs.move(newBinary, process.argv[0]);
                this.setState(update_1.State.Ready(state.update));
            }
            catch (error) {
                this.onRequestError(error, true);
            }
            await Promise.all([downloadPath, extractPath].map((p) => pfs.rimraf(p)));
        }
        onRequestError(error, showNotification) {
            this.logService.error(error);
            this.setState(update_1.State.Idle(1 /* Archive */, showNotification ? (error.message || error.toString()) : undefined));
        }
        async buildReleaseName(release) {
            let target = os.platform();
            if (target === "linux") {
                const result = await util.promisify(cp.exec)("ldd --version").catch((error) => ({
                    stderr: error.message,
                    stdout: "",
                }));
                if (/musl/.test(result.stderr) || /musl/.test(result.stdout)) {
                    target = "alpine";
                }
            }
            let arch = os.arch();
            if (arch === "x64") {
                arch = "x86_64";
            }
            return `code-server${release}-${target}-${arch}`;
        }
    };
    UpdateService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, environment_1.IEnvironmentService),
        __param(2, request_1.IRequestService),
        __param(3, log_1.ILogService),
        __param(4, files_1.IFileService)
    ], UpdateService);
    exports.UpdateService = UpdateService;
});
//# sourceMappingURL=update.js.map