/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "net", "vscode-minimist", "vs/base/common/errors", "vs/base/parts/ipc/common/ipc.net", "vs/base/parts/ipc/node/ipc.net", "vs/platform/product/common/product", "vs/workbench/services/extensions/common/extensionHostProtocol", "vs/workbench/services/extensions/common/extensionHostMain", "vs/base/common/buffer", "vs/base/common/uriIpc", "vs/base/node/pfs", "vs/base/node/extpath", "vs/base/common/async", "vs/workbench/api/node/extHost.services"], function (require, exports, net, minimist, errors_1, ipc_net_1, ipc_net_2, product_1, extensionHostProtocol_1, extensionHostMain_1, buffer_1, uriIpc_1, pfs_1, extpath_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const args = minimist(process.argv.slice(2), {
        string: [
            'uriTransformerPath'
        ]
    });
    // With Electron 2.x and node.js 8.x the "natives" module
    // can cause a native crash (see https://github.com/nodejs/node/issues/19891 and
    // https://github.com/electron/electron/issues/10905). To prevent this from
    // happening we essentially blocklist this module from getting loaded in any
    // extension by patching the node require() function.
    (function () {
        const Module = require.__$__nodeRequire('module');
        const originalLoad = Module._load;
        Module._load = function (request) {
            if (request === 'natives') {
                throw new Error('Either the extension or a NPM dependency is using the "natives" node module which is unsupported as it can cause a crash of the extension host. Click [here](https://go.microsoft.com/fwlink/?linkid=871887) to find out more');
            }
            return originalLoad.apply(this, arguments);
        };
    })();
    // custom process.exit logic...
    const nativeExit = process.exit.bind(process);
    function patchProcess(allowExit) {
        process.exit = function (code) {
            if (allowExit) {
                nativeExit(code);
            }
            else {
                const err = new Error('An extension called process.exit() and this was prevented.');
                console.warn(err.stack);
            }
        };
        // override Electron's process.crash() method
        process.crash = function () {
            const err = new Error('An extension called process.crash() and this was prevented.');
            console.warn(err.stack);
        };
    }
    // This calls exit directly in case the initialization is not finished and we need to exit
    // Otherwise, if initialization completed we go to extensionHostMain.terminate()
    let onTerminate = function () {
        nativeExit();
    };
    function _createExtHostProtocol() {
        if (process.env.VSCODE_EXTHOST_WILL_SEND_SOCKET) {
            return new Promise((resolve, reject) => {
                let protocol = null;
                let timer = setTimeout(() => {
                    reject(new Error('VSCODE_EXTHOST_IPC_SOCKET timeout'));
                }, 60000);
                const reconnectionGraceTime = 10800000 /* ReconnectionGraceTime */;
                const reconnectionShortGraceTime = 300000 /* ReconnectionShortGraceTime */;
                const disconnectRunner1 = new async_1.RunOnceScheduler(() => onTerminate(), reconnectionGraceTime);
                const disconnectRunner2 = new async_1.RunOnceScheduler(() => onTerminate(), reconnectionShortGraceTime);
                process.on('message', (msg, handle) => {
                    if (msg && msg.type === 'VSCODE_EXTHOST_IPC_SOCKET') {
                        const initialDataChunk = buffer_1.VSBuffer.wrap(Buffer.from(msg.initialDataChunk, 'base64'));
                        let socket;
                        if (msg.skipWebSocketFrames) {
                            socket = new ipc_net_2.NodeSocket(handle);
                        }
                        else {
                            socket = new ipc_net_2.WebSocketNodeSocket(new ipc_net_2.NodeSocket(handle));
                        }
                        if (protocol) {
                            // reconnection case
                            disconnectRunner1.cancel();
                            disconnectRunner2.cancel();
                            protocol.beginAcceptReconnection(socket, initialDataChunk);
                            protocol.endAcceptReconnection();
                        }
                        else {
                            clearTimeout(timer);
                            protocol = new ipc_net_1.PersistentProtocol(socket, initialDataChunk);
                            protocol.onClose(() => onTerminate());
                            resolve(protocol);
                            // Wait for rich client to reconnect
                            protocol.onSocketClose(() => {
                                // The socket has closed, let's give the renderer a certain amount of time to reconnect
                                disconnectRunner1.schedule();
                            });
                        }
                    }
                    if (msg && msg.type === 'VSCODE_EXTHOST_IPC_REDUCE_GRACE_TIME') {
                        if (disconnectRunner2.isScheduled()) {
                            // we are disconnected and already running the short reconnection timer
                            return;
                        }
                        if (disconnectRunner1.isScheduled()) {
                            // we are disconnected and running the long reconnection timer
                            disconnectRunner2.schedule();
                        }
                    }
                });
                // Now that we have managed to install a message listener, ask the other side to send us the socket
                const req = { type: 'VSCODE_EXTHOST_IPC_READY' };
                if (process.send) {
                    process.send(req);
                }
            });
        }
        else {
            const pipeName = process.env.VSCODE_IPC_HOOK_EXTHOST;
            return new Promise((resolve, reject) => {
                const socket = net.createConnection(pipeName, () => {
                    socket.removeListener('error', reject);
                    resolve(new ipc_net_1.PersistentProtocol(new ipc_net_2.NodeSocket(socket)));
                });
                socket.once('error', reject);
            });
        }
    }
    async function createExtHostProtocol() {
        const protocol = await _createExtHostProtocol();
        return new class {
            constructor() {
                this._onMessage = new ipc_net_1.BufferedEmitter();
                this.onMessage = this._onMessage.event;
                this._terminating = false;
                protocol.onMessage((msg) => {
                    if (extensionHostProtocol_1.isMessageOfType(msg, 2 /* Terminate */)) {
                        this._terminating = true;
                        onTerminate();
                    }
                    else {
                        this._onMessage.fire(msg);
                    }
                });
            }
            send(msg) {
                if (!this._terminating) {
                    protocol.send(msg);
                }
            }
        };
    }
    function connectToRenderer(protocol) {
        return new Promise((c) => {
            // Listen init data message
            const first = protocol.onMessage(raw => {
                first.dispose();
                const initData = JSON.parse(raw.toString());
                const rendererCommit = initData.commit;
                const myCommit = product_1.default.commit;
                if (rendererCommit && myCommit) {
                    // Running in the built version where commits are defined
                    if (rendererCommit !== myCommit) {
                        nativeExit(55);
                    }
                }
                // Print a console message when rejection isn't handled within N seconds. For details:
                // see https://nodejs.org/api/process.html#process_event_unhandledrejection
                // and https://nodejs.org/api/process.html#process_event_rejectionhandled
                const unhandledPromises = [];
                process.on('unhandledRejection', (reason, promise) => {
                    unhandledPromises.push(promise);
                    setTimeout(() => {
                        const idx = unhandledPromises.indexOf(promise);
                        if (idx >= 0) {
                            promise.catch(e => {
                                unhandledPromises.splice(idx, 1);
                                console.warn(`rejected promise not handled within 1 second: ${e}`);
                                if (e && e.stack) {
                                    console.warn(`stack trace: ${e.stack}`);
                                }
                                errors_1.onUnexpectedError(reason);
                            });
                        }
                    }, 1000);
                });
                process.on('rejectionHandled', (promise) => {
                    const idx = unhandledPromises.indexOf(promise);
                    if (idx >= 0) {
                        unhandledPromises.splice(idx, 1);
                    }
                });
                // Print a console message when an exception isn't handled.
                process.on('uncaughtException', function (err) {
                    errors_1.onUnexpectedError(err);
                });
                // Kill oneself if one's parent dies. Much drama.
                setInterval(function () {
                    try {
                        process.kill(initData.parentPid, 0); // throws an exception if the main process doesn't exist anymore.
                    }
                    catch (e) {
                        onTerminate();
                    }
                }, 1000);
                // In certain cases, the event loop can become busy and never yield
                // e.g. while-true or process.nextTick endless loops
                // So also use the native node module to do it from a separate thread
                let watchdog;
                try {
                    watchdog = require.__$__nodeRequire('native-watchdog');
                    watchdog.start(initData.parentPid);
                }
                catch (err) {
                    // no problem...
                    errors_1.onUnexpectedError(err);
                }
                // Tell the outside that we are initialized
                protocol.send(extensionHostProtocol_1.createMessageOfType(0 /* Initialized */));
                c({ protocol, initData });
            });
            // Tell the outside that we are ready to receive messages
            protocol.send(extensionHostProtocol_1.createMessageOfType(1 /* Ready */));
        });
    }
    async function startExtensionHostProcess() {
        const protocol = await createExtHostProtocol();
        const renderer = await connectToRenderer(protocol);
        const { initData } = renderer;
        // setup things
        patchProcess(!!initData.environment.extensionTestsLocationURI); // to support other test frameworks like Jasmin that use process.exit (https://github.com/Microsoft/vscode/issues/37708)
        // host abstraction
        const hostUtils = new class NodeHost {
            exit(code) { nativeExit(code); }
            exists(path) { return pfs_1.exists(path); }
            realpath(path) { return extpath_1.realpath(path); }
        };
        // Attempt to load uri transformer
        let uriTransformer = null;
        if (initData.remote.authority && args.uriTransformerPath) {
            try {
                const rawURITransformerFactory = require.__$__nodeRequire(args.uriTransformerPath);
                const rawURITransformer = rawURITransformerFactory(initData.remote.authority);
                uriTransformer = new uriIpc_1.URITransformer(rawURITransformer);
            }
            catch (e) {
                console.error(e);
            }
        }
        const extensionHostMain = new extensionHostMain_1.ExtensionHostMain(renderer.protocol, initData, hostUtils, uriTransformer);
        // rewrite onTerminate-function to be a proper shutdown
        onTerminate = () => extensionHostMain.terminate();
    }
    exports.startExtensionHostProcess = startExtensionHostProcess;
});
//# sourceMappingURL=extensionHostProcessSetup.js.map