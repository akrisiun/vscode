/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "fs", "child_process", "vs/platform/environment/node/argv", "vs/platform/environment/node/argvHelper", "vs/platform/environment/node/waitMarkerFile", "vs/platform/product/common/product", "vs/base/common/path", "vs/base/node/pfs", "vs/base/node/ports", "vs/base/common/platform", "vs/base/common/types", "vs/platform/environment/node/stdin"], function (require, exports, os, fs, child_process_1, argv_1, argvHelper_1, waitMarkerFile_1, product_1, paths, pfs_1, ports_1, platform_1, types_1, stdin_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.main = void 0;
    function shouldSpawnCliProcess(argv) {
        return !!argv['install-source']
            || !!argv['list-extensions']
            || !!argv['install-extension']
            || !!argv['uninstall-extension']
            || !!argv['locate-extension']
            || !!argv['telemetry'];
    }
    async function main(argv) {
        let args;
        try {
            args = argvHelper_1.parseCLIProcessArgv(argv);
        }
        catch (err) {
            console.error(err.message);
            return;
        }
        // Help
        if (args.help) {
            const executable = `${product_1.default.applicationName}${os.platform() === 'win32' ? '.exe' : ''}`;
            console.log(argv_1.buildHelpMessage(product_1.default.nameLong, executable, product_1.default.version, argv_1.OPTIONS));
        }
        // Version Info
        else if (args.version) {
            console.log(argv_1.buildVersionMessage(product_1.default.version, product_1.default.commit));
        }
        // Extensions Management
        else if (shouldSpawnCliProcess(args)) {
            const cli = await new Promise((c, e) => require(['vs/code/node/cliProcessMain'], c, e));
            await cli.main(args);
            return;
        }
        // Write File
        else if (args['file-write']) {
            const source = args._[0];
            const target = args._[1];
            // Validate
            if (!source || !target || source === target || // make sure source and target are provided and are not the same
                !paths.isAbsolute(source) || !paths.isAbsolute(target) || // make sure both source and target are absolute paths
                !fs.existsSync(source) || !fs.statSync(source).isFile() || // make sure source exists as file
                !fs.existsSync(target) || !fs.statSync(target).isFile() // make sure target exists as file
            ) {
                throw new Error('Using --file-write with invalid arguments.');
            }
            try {
                // Check for readonly status and chmod if so if we are told so
                let targetMode = 0;
                let restoreMode = false;
                if (!!args['file-chmod']) {
                    targetMode = fs.statSync(target).mode;
                    if (!(targetMode & 128) /* readonly */) {
                        fs.chmodSync(target, targetMode | 128);
                        restoreMode = true;
                    }
                }
                // Write source to target
                const data = fs.readFileSync(source);
                if (platform_1.isWindows) {
                    // On Windows we use a different strategy of saving the file
                    // by first truncating the file and then writing with r+ mode.
                    // This helps to save hidden files on Windows
                    // (see https://github.com/Microsoft/vscode/issues/931) and
                    // prevent removing alternate data streams
                    // (see https://github.com/Microsoft/vscode/issues/6363)
                    fs.truncateSync(target, 0);
                    pfs_1.writeFileSync(target, data, { flag: 'r+' });
                }
                else {
                    pfs_1.writeFileSync(target, data);
                }
                // Restore previous mode as needed
                if (restoreMode) {
                    fs.chmodSync(target, targetMode);
                }
            }
            catch (error) {
                error.message = `Error using --file-write: ${error.message}`;
                throw error;
            }
        }
        // Just Code
        else {
            const env = Object.assign(Object.assign({}, process.env), { 'VSCODE_CLI': '1', 'ELECTRON_NO_ATTACH_CONSOLE': '1' });
            if (args['force-user-env']) {
                env['VSCODE_FORCE_USER_ENV'] = '1';
            }
            delete env['ELECTRON_RUN_AS_NODE'];
            const processCallbacks = [];
            const verbose = args.verbose || args.status;
            if (verbose) {
                env['ELECTRON_ENABLE_LOGGING'] = '1';
                processCallbacks.push(async (child) => {
                    child.stdout.on('data', (data) => console.log(data.toString('utf8').trim()));
                    child.stderr.on('data', (data) => console.log(data.toString('utf8').trim()));
                    await new Promise(c => child.once('exit', () => c()));
                });
            }
            const hasReadStdinArg = args._.some(a => a === '-');
            if (hasReadStdinArg) {
                // remove the "-" argument when we read from stdin
                args._ = args._.filter(a => a !== '-');
                argv = argv.filter(a => a !== '-');
            }
            let stdinFilePath;
            if (stdin_1.hasStdinWithoutTty()) {
                // Read from stdin: we require a single "-" argument to be passed in order to start reading from
                // stdin. We do this because there is no reliable way to find out if data is piped to stdin. Just
                // checking for stdin being connected to a TTY is not enough (https://github.com/Microsoft/vscode/issues/40351)
                if (args._.length === 0) {
                    if (hasReadStdinArg) {
                        stdinFilePath = stdin_1.getStdinFilePath();
                        // returns a file path where stdin input is written into (write in progress).
                        try {
                            stdin_1.readFromStdin(stdinFilePath, !!verbose); // throws error if file can not be written
                            // Make sure to open tmp file
                            argvHelper_1.addArg(argv, stdinFilePath);
                            // Enable --wait to get all data and ignore adding this to history
                            argvHelper_1.addArg(argv, '--wait');
                            argvHelper_1.addArg(argv, '--skip-add-to-recently-opened');
                            args.wait = true;
                            console.log(`Reading from stdin via: ${stdinFilePath}`);
                        }
                        catch (e) {
                            console.log(`Failed to create file to read via stdin: ${e.toString()}`);
                            stdinFilePath = undefined;
                        }
                    }
                    else {
                        // If the user pipes data via stdin but forgot to add the "-" argument, help by printing a message
                        // if we detect that data flows into via stdin after a certain timeout.
                        processCallbacks.push(_ => stdin_1.stdinDataListener(1000).then(dataReceived => {
                            if (dataReceived) {
                                if (platform_1.isWindows) {
                                    console.log(`Run with '${product_1.default.applicationName} -' to read output from another program (e.g. 'echo Hello World | ${product_1.default.applicationName} -').`);
                                }
                                else {
                                    console.log(`Run with '${product_1.default.applicationName} -' to read from stdin (e.g. 'ps aux | grep code | ${product_1.default.applicationName} -').`);
                                }
                            }
                        }));
                    }
                }
            }
            // If we are started with --wait create a random temporary file
            // and pass it over to the starting instance. We can use this file
            // to wait for it to be deleted to monitor that the edited file
            // is closed and then exit the waiting process.
            let waitMarkerFilePath;
            if (args.wait) {
                waitMarkerFilePath = waitMarkerFile_1.createWaitMarkerFile(verbose);
                if (waitMarkerFilePath) {
                    argvHelper_1.addArg(argv, '--waitMarkerFilePath', waitMarkerFilePath);
                }
            }
            // If we have been started with `--prof-startup` we need to find free ports to profile
            // the main process, the renderer, and the extension host. We also disable v8 cached data
            // to get better profile traces. Last, we listen on stdout for a signal that tells us to
            // stop profiling.
            if (args['prof-startup']) {
                const portMain = await ports_1.findFreePort(ports_1.randomPort(), 10, 3000);
                const portRenderer = await ports_1.findFreePort(portMain + 1, 10, 3000);
                const portExthost = await ports_1.findFreePort(portRenderer + 1, 10, 3000);
                // fail the operation when one of the ports couldn't be accquired.
                if (portMain * portRenderer * portExthost === 0) {
                    throw new Error('Failed to find free ports for profiler. Make sure to shutdown all instances of the editor first.');
                }
                const filenamePrefix = paths.join(os.homedir(), 'prof-' + Math.random().toString(16).slice(-4));
                argvHelper_1.addArg(argv, `--inspect-brk=${portMain}`);
                argvHelper_1.addArg(argv, `--remote-debugging-port=${portRenderer}`);
                argvHelper_1.addArg(argv, `--inspect-brk-extensions=${portExthost}`);
                argvHelper_1.addArg(argv, `--prof-startup-prefix`, filenamePrefix);
                argvHelper_1.addArg(argv, `--no-cached-data`);
                pfs_1.writeFileSync(filenamePrefix, argv.slice(-6).join('|'));
                processCallbacks.push(async (_child) => {
                    class Profiler {
                        static async start(name, filenamePrefix, opts) {
                            const profiler = await new Promise((resolve_1, reject_1) => { require(['v8-inspect-profiler'], resolve_1, reject_1); });
                            let session;
                            try {
                                session = await profiler.startProfiling(opts);
                            }
                            catch (err) {
                                console.error(`FAILED to start profiling for '${name}' on port '${opts.port}'`);
                            }
                            return {
                                async stop() {
                                    if (!session) {
                                        return;
                                    }
                                    let suffix = '';
                                    let profile = await session.stop();
                                    if (!process.env['VSCODE_DEV']) {
                                        // when running from a not-development-build we remove
                                        // absolute filenames because we don't want to reveal anything
                                        // about users. We also append the `.txt` suffix to make it
                                        // easier to attach these files to GH issues
                                        profile = profiler.rewriteAbsolutePaths(profile, 'piiRemoved');
                                        suffix = '.txt';
                                    }
                                    await profiler.writeProfile(profile, `${filenamePrefix}.${name}.cpuprofile${suffix}`);
                                }
                            };
                        }
                    }
                    try {
                        // load and start profiler
                        const mainProfileRequest = Profiler.start('main', filenamePrefix, { port: portMain });
                        const extHostProfileRequest = Profiler.start('extHost', filenamePrefix, { port: portExthost, tries: 300 });
                        const rendererProfileRequest = Profiler.start('renderer', filenamePrefix, {
                            port: portRenderer,
                            tries: 200,
                            target: function (targets) {
                                return targets.filter(target => {
                                    if (!target.webSocketDebuggerUrl) {
                                        return false;
                                    }
                                    if (target.type === 'page') {
                                        return target.url.indexOf('workbench/workbench.html') > 0;
                                    }
                                    else {
                                        return true;
                                    }
                                })[0];
                            }
                        });
                        const main = await mainProfileRequest;
                        const extHost = await extHostProfileRequest;
                        const renderer = await rendererProfileRequest;
                        // wait for the renderer to delete the
                        // marker file
                        await pfs_1.whenDeleted(filenamePrefix);
                        // stop profiling
                        await main.stop();
                        await renderer.stop();
                        await extHost.stop();
                        // re-create the marker file to signal that profiling is done
                        pfs_1.writeFileSync(filenamePrefix, '');
                    }
                    catch (e) {
                        console.error('Failed to profile startup. Make sure to quit Code first.');
                    }
                });
            }
            const jsFlags = args['js-flags'];
            if (types_1.isString(jsFlags)) {
                const match = /max_old_space_size=(\d+)/g.exec(jsFlags);
                if (match && !args['max-memory']) {
                    argvHelper_1.addArg(argv, `--max-memory=${match[1]}`);
                }
            }
            const options = {
                detached: true,
                env
            };
            if (!verbose) {
                options['stdio'] = 'ignore';
            }
            if (platform_1.isLinux) {
                argvHelper_1.addArg(argv, '--no-sandbox'); // Electron 6 introduces a chrome-sandbox that requires root to run. This can fail. Disable sandbox via --no-sandbox
            }
            const child = child_process_1.spawn(process.execPath, argv.slice(2), options);
            if (args.wait && waitMarkerFilePath) {
                return new Promise(c => {
                    // Complete when process exits
                    child.once('exit', () => c(undefined));
                    // Complete when wait marker file is deleted
                    pfs_1.whenDeleted(waitMarkerFilePath).then(c, c);
                }).then(() => {
                    // Make sure to delete the tmp stdin file if we have any
                    if (stdinFilePath) {
                        fs.unlinkSync(stdinFilePath);
                    }
                });
            }
            return Promise.all(processCallbacks.map(callback => callback(child)));
        }
    }
    exports.main = main;
    function eventuallyExit(code) {
        setTimeout(() => process.exit(code), 0);
    }
    main(process.argv)
        .then(() => eventuallyExit(0))
        .then(null, err => {
        console.error(err.message || err.stack || err);
        eventuallyExit(1);
    });
});
//# sourceMappingURL=cli.js.map