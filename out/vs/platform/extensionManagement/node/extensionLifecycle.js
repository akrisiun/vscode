/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "child_process", "vs/base/common/errorMessage", "vs/base/common/path", "vs/base/common/async", "vs/base/common/event", "vs/base/common/network", "vs/base/node/pfs"], function (require, exports, lifecycle_1, child_process_1, errorMessage_1, path_1, async_1, event_1, network_1, pfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExtensionsLifecycle extends lifecycle_1.Disposable {
        constructor(environmentService, logService) {
            super();
            this.environmentService = environmentService;
            this.logService = logService;
            this.processesLimiter = new async_1.Limiter(5); // Run max 5 processes in parallel
        }
        async postUninstall(extension) {
            const script = this.parseScript(extension, 'uninstall');
            if (script) {
                this.logService.info(extension.identifier.id, extension.manifest.version, `Running post uninstall script`);
                await this.processesLimiter.queue(() => this.runLifecycleHook(script.script, 'uninstall', script.args, true, extension)
                    .then(() => this.logService.info(extension.identifier.id, extension.manifest.version, `Finished running post uninstall script`), err => this.logService.error(extension.identifier.id, extension.manifest.version, `Failed to run post uninstall script: ${err}`)));
            }
            return pfs_1.rimraf(this.getExtensionStoragePath(extension)).then(undefined, e => this.logService.error('Error while removing extension storage path', e));
        }
        parseScript(extension, type) {
            const scriptKey = `vscode:${type}`;
            if (extension.location.scheme === network_1.Schemas.file && extension.manifest && extension.manifest['scripts'] && typeof extension.manifest['scripts'][scriptKey] === 'string') {
                const script = extension.manifest['scripts'][scriptKey].split(' ');
                if (script.length < 2 || script[0] !== 'node' || !script[1]) {
                    this.logService.warn(extension.identifier.id, extension.manifest.version, `${scriptKey} should be a node script`);
                    return null;
                }
                return { script: path_1.join(extension.location.fsPath, script[1]), args: script.slice(2) || [] };
            }
            return null;
        }
        runLifecycleHook(lifecycleHook, lifecycleType, args, timeout, extension) {
            return new Promise((c, e) => {
                const extensionLifecycleProcess = this.start(lifecycleHook, lifecycleType, args, extension);
                let timeoutHandler;
                const onexit = (error) => {
                    if (timeoutHandler) {
                        clearTimeout(timeoutHandler);
                        timeoutHandler = null;
                    }
                    if (error) {
                        e(error);
                    }
                    else {
                        c(undefined);
                    }
                };
                // on error
                extensionLifecycleProcess.on('error', (err) => {
                    onexit(errorMessage_1.toErrorMessage(err) || 'Unknown');
                });
                // on exit
                extensionLifecycleProcess.on('exit', (code, signal) => {
                    onexit(code ? `post-${lifecycleType} process exited with code ${code}` : undefined);
                });
                if (timeout) {
                    // timeout: kill process after waiting for 5s
                    timeoutHandler = setTimeout(() => {
                        timeoutHandler = null;
                        extensionLifecycleProcess.kill();
                        e('timed out');
                    }, 5000);
                }
            });
        }
        start(uninstallHook, lifecycleType, args, extension) {
            const opts = {
                silent: true,
                execArgv: undefined
            };
            const extensionUninstallProcess = child_process_1.fork(uninstallHook, [`--type=extension-post-${lifecycleType}`, ...args], opts);
            extensionUninstallProcess.stdout.setEncoding('utf8');
            extensionUninstallProcess.stderr.setEncoding('utf8');
            const onStdout = event_1.Event.fromNodeEventEmitter(extensionUninstallProcess.stdout, 'data');
            const onStderr = event_1.Event.fromNodeEventEmitter(extensionUninstallProcess.stderr, 'data');
            // Log output
            onStdout(data => this.logService.info(extension.identifier.id, extension.manifest.version, `post-${lifecycleType}`, data));
            onStderr(data => this.logService.error(extension.identifier.id, extension.manifest.version, `post-${lifecycleType}`, data));
            const onOutput = event_1.Event.any(event_1.Event.map(onStdout, o => ({ data: `%c${o}`, format: [''] })), event_1.Event.map(onStderr, o => ({ data: `%c${o}`, format: ['color: red'] })));
            // Debounce all output, so we can render it in the Chrome console as a group
            const onDebouncedOutput = event_1.Event.debounce(onOutput, (r, o) => {
                return r
                    ? { data: r.data + o.data, format: [...r.format, ...o.format] }
                    : { data: o.data, format: o.format };
            }, 100);
            // Print out output
            onDebouncedOutput(data => {
                console.group(extension.identifier.id);
                console.log(data.data, ...data.format);
                console.groupEnd();
            });
            return extensionUninstallProcess;
        }
        getExtensionStoragePath(extension) {
            return path_1.join(this.environmentService.globalStorageHome, extension.identifier.id.toLowerCase());
        }
    }
    exports.ExtensionsLifecycle = ExtensionsLifecycle;
});
//# sourceMappingURL=extensionLifecycle.js.map