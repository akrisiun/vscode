define(["require", "exports", "child_process", "crypto", "fs", "os", "path", "util", "vscode-ripgrep", "vs/base/common/amd", "vs/base/common/mime", "vs/base/common/path", "vs/base/common/uriIpc", "vs/base/node/pfs"], function (require, exports, cp, crypto, fs, os, path, util, rg, amd_1, mime_1, path_1, uriIpc_1, pfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AuthType;
    (function (AuthType) {
        AuthType["Password"] = "password";
        AuthType["None"] = "none";
    })(AuthType = exports.AuthType || (exports.AuthType = {}));
    var FormatType;
    (function (FormatType) {
        FormatType["Json"] = "json";
    })(FormatType = exports.FormatType || (exports.FormatType = {}));
    exports.tmpdir = path.join(os.tmpdir(), "code-server");
    exports.generateCertificate = async () => {
        const paths = {
            cert: path.join(exports.tmpdir, "self-signed.cert"),
            certKey: path.join(exports.tmpdir, "self-signed.key"),
        };
        const exists = await Promise.all([
            util.promisify(fs.exists)(paths.cert),
            util.promisify(fs.exists)(paths.certKey),
        ]);
        if (!exists[0] || !exists[1]) {
            const pem = exports.localRequire("pem/lib/pem");
            const certs = await new Promise((resolve, reject) => {
                pem.createCertificate({ selfSigned: true }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            });
            await pfs_1.mkdirp(exports.tmpdir);
            await Promise.all([
                util.promisify(fs.writeFile)(paths.cert, certs.certificate),
                util.promisify(fs.writeFile)(paths.certKey, certs.serviceKey),
            ]);
        }
        return paths;
    };
    exports.uriTransformerPath = amd_1.getPathFromAmdModule(require, "vs/server/src/node/uriTransformer");
    exports.getUriTransformer = (remoteAuthority) => {
        const rawURITransformerFactory = require.__$__nodeRequire(exports.uriTransformerPath);
        const rawURITransformer = rawURITransformerFactory(remoteAuthority);
        return new uriIpc_1.URITransformer(rawURITransformer);
    };
    exports.generatePassword = async (length = 24) => {
        const buffer = Buffer.alloc(Math.ceil(length / 2));
        await util.promisify(crypto.randomFill)(buffer);
        return buffer.toString("hex").substring(0, length);
    };
    exports.getMediaMime = (filePath) => {
        return filePath && (mime_1.getMediaMime(filePath) || {
            ".css": "text/css",
            ".html": "text/html",
            ".js": "application/javascript",
            ".json": "application/json",
        }[path_1.extname(filePath)]) || "text/plain";
    };
    exports.isWsl = async () => {
        return process.platform === "linux"
            && os.release().toLowerCase().indexOf("microsoft") !== -1
            || (await util.promisify(fs.readFile)("/proc/version", "utf8"))
                .toLowerCase().indexOf("microsoft") !== -1;
    };
    exports.open = async (url) => {
        const args = [];
        const options = {};
        const platform = await exports.isWsl() ? "wsl" : process.platform;
        let command = platform === "darwin" ? "open" : "xdg-open";
        if (platform === "win32" || platform === "wsl") {
            command = platform === "wsl" ? "cmd.exe" : "cmd";
            args.push("/c", "start", '""', "/b");
            url = url.replace(/&/g, "^&");
        }
        const proc = cp.spawn(command, [...args, url], options);
        await new Promise((resolve, reject) => {
            proc.on("error", reject);
            proc.on("close", (code) => {
                return code !== 0
                    ? reject(new Error(`Failed to open with code ${code}`))
                    : resolve();
            });
        });
    };
    /**
     * Extract executables to the temporary directory. This is required since we
     * can't execute binaries stored within our binary.
     */
    exports.unpackExecutables = async () => {
        const rgPath = rg.binaryRgPath;
        const destination = path.join(exports.tmpdir, path.basename(rgPath || ""));
        if (rgPath && !(await util.promisify(fs.exists)(destination))) {
            await pfs_1.mkdirp(exports.tmpdir);
            await util.promisify(fs.writeFile)(destination, await util.promisify(fs.readFile)(rgPath));
            await util.promisify(fs.chmod)(destination, "755");
        }
    };
    exports.enumToArray = (t) => {
        const values = [];
        for (const k in t) {
            values.push(t[k]);
        }
        return values;
    };
    exports.buildAllowedMessage = (t) => {
        const values = exports.enumToArray(t);
        return `Allowed value${values.length === 1 ? " is" : "s are"} ${values.map((t) => `'${t}'`).join(", ")}`;
    };
    /**
     * Require a local module. This is necessary since VS Code's loader only looks
     * at the root for Node modules.
     */
    exports.localRequire = (modulePath) => {
        return require.__$__nodeRequire(path.resolve(__dirname, "../../node_modules", modulePath));
    };
});
//# sourceMappingURL=util.js.map