
const verbose = 1;
define(["require", "exports", "child_process", "os", "path", "vs/base/common/errors", "vs/code/node/cliProcessMain", "vs/code/node/paths", "vs/platform/environment/node/argv", "vs/platform/environment/node/argvHelper", "vs/platform/product/common/product", "vs/server/src/node/ipc", "vs/server/src/node/marketplace", "vs/server/src/node/server", "vs/server/src/node/util"], function (require, exports, cp, os, path, errors_1, cliProcessMain_1, paths_1, argv_1, argvHelper_1, product_1, ipc_1, marketplace_1, server_1, util_1) {
    "use strict";

    console.log("server/cli starting...");

    Object.defineProperty(exports, "__esModule", { value: true });
    const { logger } = util_1.localRequire("@coder/logger/out/index");
    errors_1.setUnexpectedErrorHandler((error) => logger.warn(error.message));
    const getArgs = () => {
        // Remove options that won't work or don't make sense.
        for (let key in argv_1.OPTIONS) {
            switch (key) {
                case "add":
                case "diff":
                case "file-uri":
                case "folder-uri":
                case "goto":
                case "new-window":
                case "reuse-window":
                case "wait":
                case "disable-gpu":
                // TODO: pretty sure these don't work but not 100%.
                case "max-memory":
                case "prof-startup":
                case "inspect-extensions":
                case "inspect-brk-extensions":
                    delete argv_1.OPTIONS[key];
                    break;
            }
        }
        const options = argv_1.OPTIONS;
        options["base-path"] = { type: "string", cat: "o", description: "Base path of the URL at which code-server is hosted (used for login redirects)." };
        options["cert"] = { type: "string", cat: "o", description: "Path to certificate. If the path is omitted, both this and --cert-key will be generated." };
        options["cert-key"] = { type: "string", cat: "o", description: "Path to the certificate's key if one was provided." };
        options["format"] = { type: "string", cat: "o", description: `Format for the version. ${util_1.buildAllowedMessage(util_1.FormatType)}.` };
        options["host"] = { type: "string", cat: "o", description: "Host for the server." };
        options["auth"] = { type: "string", cat: "o", description: `The type of authentication to use. ${util_1.buildAllowedMessage(util_1.AuthType)}.` };
        options["open"] = { type: "boolean", cat: "o", description: "Open in the browser on startup." };
        options["port"] = { type: "string", cat: "o", description: "Port for the main server." };
        options["socket"] = { type: "string", cat: "o", description: "Listen on a socket instead of host:port." };
        const args = argvHelper_1.parseMainProcessArgv(process.argv);
        if (!args["user-data-dir"]) {
            args["user-data-dir"] = path.join(process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local/share"), "code-server");
        }
        if (!args["extensions-dir"]) {
            args["extensions-dir"] = path.join(args["user-data-dir"], "extensions");
        }
        if (!args.verbose && !args.log && process.env.LOG_LEVEL) {
            args.log = process.env.LOG_LEVEL;
        }
        return paths_1.validatePaths(args);
    };
    const startVscode = async () => {
        const args = getArgs();
        const extra = args["_"] || [];
        const options = {
            auth: args.auth || util_1.AuthType.Password,
            basePath: args["base-path"],
            cert: args.cert,
            certKey: args["cert-key"],
            openUri: extra.length > 1 ? extra[extra.length - 1] : undefined,
            host: args.host,
            password: process.env.PASSWORD,
        };
        if (util_1.enumToArray(util_1.AuthType).filter((t) => t === options.auth).length === 0) {
            throw new Error(`'${options.auth}' is not a valid authentication type.`);
        }
        else if (options.auth === "password" && !options.password) {
            options.password = await util_1.generatePassword();
        }
        if (!options.certKey && typeof options.certKey !== "undefined") {
            throw new Error(`--cert-key cannot be blank`);
        }
        else if (options.certKey && !options.cert) {
            throw new Error(`--cert-key was provided but --cert was not`);
        }
        if (!options.cert && typeof options.cert !== "undefined") {
            const { cert, certKey } = await util_1.generateCertificate();
            options.cert = cert;
            options.certKey = certKey;
        }
        marketplace_1.enableCustomMarketplace();
        const server = new server_1.MainServer(Object.assign(Object.assign({}, options), { port: typeof args.port !== "undefined" ? parseInt(args.port, 10) : 8080, socket: args.socket }), args);
        const [serverAddress,] = await Promise.all([
            server.listen(),
            util_1.unpackExecutables(),
        ]);
        logger.info(`Server listening on ${serverAddress}`);
        if (options.auth === "password" && !process.env.PASSWORD) {
            logger.info(`  - Password is ${options.password}`);
            logger.info("    - To use your own password, set the PASSWORD environment variable");
            if (!args.auth) {
                logger.info("    - To disable use `--auth none`");
            }
        }
        else if (options.auth === "password") {
            logger.info("  - Using custom password for authentication");
        }
        else {
            logger.info("  - No authentication");
        }
        if (server.protocol === "https") {
            logger.info(args.cert
                ? `  - Using provided certificate${args["cert-key"] ? " and key" : ""} for HTTPS`
                : `  - Using generated certificate and key for HTTPS`);
        }
        else {
            logger.info("  - Not serving HTTPS");
        }
        if (!server.options.socket && args.open) {
            // The web socket doesn't seem to work if browsing with 0.0.0.0.
            // const openAddress = serverAddress.replace(/:\/\/0.0.0.0/, "://localhost");
            const openAddress = serverAddress;
            await util_1.open(openAddress).catch(console.error);
            logger.info(`  - Opened ${openAddress}`);
        }
    };
    const startCli = () => {
        const args = getArgs();

        if (verbose > 0)
            console.log("startCli args:", args);

        if (args.help) {
            const executable = `${product_1.default.applicationName}${os.platform() === "win32" ? ".exe" : ""}`;
            console.log(argv_1.buildHelpMessage(product_1.default.nameLong, executable, product_1.default.codeServerVersion, argv_1.OPTIONS, false));
            return true;
        }
        if (args.version) {
            if (args.format === "json") {
                console.log(JSON.stringify({
                    codeServerVersion: product_1.default.codeServerVersion,
                    commit: product_1.default.commit,
                    vscodeVersion: product_1.default.version,
                }));
            }
            else {
                argv_1.buildVersionMessage(product_1.default.codeServerVersion, product_1.default.commit).split("\n").map((line) => logger.info(line));
            }
            return true;
        }
        const shouldSpawnCliProcess = () => {
            return !!args["install-source"]
                || !!args["list-extensions"]
                || !!args["install-extension"]
                || !!args["uninstall-extension"]
                || !!args["locate-extension"]
                || !!args["telemetry"];
        };
        if (shouldSpawnCliProcess()) {
            marketplace_1.enableCustomMarketplace();
            return cliProcessMain_1.main(args);
        }
        return false;
    };
    class WrapperProcess {
        constructor() {
            ipc_1.ipcMain.onMessage(async (message) => {
                switch (message) {
                    case "relaunch":
                        logger.info("Relaunching...");
                        this.started = undefined;
                        if (this.process) {
                            this.process.removeAllListeners();
                            this.process.kill();
                        }
                        try {
                            await this.start();
                        }
                        catch (error) {
                            logger.error(error.message);
                            process.exit(typeof error.code === "number" ? error.code : 1);
                        }
                        break;
                    default:
                        logger.error(`Unrecognized message ${message}`);
                        break;
                }
            });
        }
        start() {

            console.log("Wrapper main start.. ");
            if (!this.started) {
                const child = this.spawn();
                this.started = ipc_1.ipcMain.handshake(child).then(() => {
                    child.once("exit", (code) => exit(code));
                });
                this.process = child;
            }
            return this.started;
        }
        spawn() {
            return cp.spawn(process.argv[0], process.argv.slice(1), {
                env: Object.assign(Object.assign({}, process.env), { LAUNCH_VSCODE: "true", VSCODE_PARENT_PID: process.pid.toString() }),
                stdio: ["inherit", "inherit", "inherit", "ipc"],
            });
        }
    }

    if (verbose > 1)
        console.log("server/cli WrapperProcess...");

    exports.WrapperProcess = WrapperProcess;
    const main = async () => {

        console.log("server/cli main...");
        if (process.env.LAUNCH_VSCODE) {
            await ipc_1.ipcMain.handshake();
            return startVscode();
        }
        return startCli() || new WrapperProcess().start();
    };

    const exit = process.exit;
    process.exit = function (code) {
        const err = new Error(`process.exit() was prevented: ${code || "unknown code"}.`);
        console.warn(err.stack);
    };
    // Copy the extension host behavior of killing oneself if the parent dies. This
    // also exists in bootstrap-fork.js but spawning with that won't work because we
    // override process.exit.
    if (typeof process.env.VSCODE_PARENT_PID !== "undefined") {
        const parentPid = parseInt(process.env.VSCODE_PARENT_PID, 10);
        setInterval(() => {
            try {
                process.kill(parentPid, 0); // Throws an exception if the process doesn't exist anymore.
            }
            catch (e) {
                exit();
            }
        }, 5000);
    }
    // It's possible that the pipe has closed (for example if you run code-server
    // --version | head -1). Assume that means we're done.
    if (!process.stdout.isTTY) {
        process.stdout.on("error", () => exit());
    }
    main().catch((error) => {
        logger.error(error.message);
        console.log("main cli error", error.message, error.stack);
        exit(typeof error.code === "number" ? error.code : 1);
    });
});
//# sourceMappingURL=cli.js.map
