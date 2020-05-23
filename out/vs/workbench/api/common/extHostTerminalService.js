/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/workbench/api/common/extHost.protocol", "vs/platform/instantiation/common/instantiation", "vs/base/common/uri", "vs/workbench/contrib/terminal/common/terminal", "vs/base/common/async", "vs/workbench/api/common/extHostRpcService", "vs/workbench/contrib/terminal/common/terminalDataBuffering", "vs/base/common/lifecycle", "./extHostTypes"], function (require, exports, event_1, extHost_protocol_1, instantiation_1, uri_1, terminal_1, async_1, extHostRpcService_1, terminalDataBuffering_1, lifecycle_1, extHostTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkerExtHostTerminalService = exports.EnvironmentVariableCollection = exports.BaseExtHostTerminalService = exports.ExtHostPseudoterminal = exports.ExtHostTerminal = exports.BaseExtHostTerminal = exports.IExtHostTerminalService = void 0;
    exports.IExtHostTerminalService = instantiation_1.createDecorator('IExtHostTerminalService');
    class BaseExtHostTerminal {
        constructor(_proxy, id) {
            this._proxy = _proxy;
            this._disposed = false;
            this._queuedRequests = [];
            this._idPromise = new Promise(c => {
                if (id !== undefined) {
                    this._id = id;
                    c(id);
                }
                else {
                    this._idPromiseComplete = c;
                }
            });
        }
        dispose() {
            if (!this._disposed) {
                this._disposed = true;
                this._queueApiRequest(this._proxy.$dispose, []);
            }
        }
        _checkDisposed() {
            if (this._disposed) {
                throw new Error('Terminal has already been disposed');
            }
        }
        _queueApiRequest(callback, args) {
            const request = new ApiRequest(callback, args);
            if (!this._id) {
                this._queuedRequests.push(request);
                return;
            }
            request.run(this._proxy, this._id);
        }
        _runQueuedRequests(id) {
            this._id = id;
            if (this._idPromiseComplete) {
                this._idPromiseComplete(id);
                this._idPromiseComplete = undefined;
            }
            this._queuedRequests.forEach((r) => {
                r.run(this._proxy, id);
            });
            this._queuedRequests.length = 0;
        }
    }
    exports.BaseExtHostTerminal = BaseExtHostTerminal;
    class ExtHostTerminal extends BaseExtHostTerminal {
        constructor(proxy, _creationOptions, _name, id) {
            super(proxy, id);
            this._creationOptions = _creationOptions;
            this._name = _name;
            this.isOpen = false;
            this._creationOptions = Object.freeze(this._creationOptions);
            this._pidPromise = new Promise(c => this._pidPromiseComplete = c);
        }
        async create(shellPath, shellArgs, cwd, env, waitOnExit, strictEnv, hideFromUser) {
            const result = await this._proxy.$createTerminal({ name: this._name, shellPath, shellArgs, cwd, env, waitOnExit, strictEnv, hideFromUser });
            this._name = result.name;
            this._runQueuedRequests(result.id);
        }
        async createExtensionTerminal() {
            const result = await this._proxy.$createTerminal({ name: this._name, isExtensionTerminal: true });
            this._name = result.name;
            this._runQueuedRequests(result.id);
            return result.id;
        }
        get name() {
            return this._name || '';
        }
        set name(name) {
            this._name = name;
        }
        get exitStatus() {
            return this._exitStatus;
        }
        get dimensions() {
            if (this._cols === undefined || this._rows === undefined) {
                return undefined;
            }
            return {
                columns: this._cols,
                rows: this._rows
            };
        }
        setExitCode(code) {
            this._exitStatus = Object.freeze({ code });
        }
        setDimensions(cols, rows) {
            if (cols === this._cols && rows === this._rows) {
                // Nothing changed
                return false;
            }
            this._cols = cols;
            this._rows = rows;
            return true;
        }
        get processId() {
            return this._pidPromise;
        }
        get creationOptions() {
            return this._creationOptions;
        }
        sendText(text, addNewLine = true) {
            this._checkDisposed();
            this._queueApiRequest(this._proxy.$sendText, [text, addNewLine]);
        }
        show(preserveFocus) {
            this._checkDisposed();
            this._queueApiRequest(this._proxy.$show, [preserveFocus]);
        }
        hide() {
            this._checkDisposed();
            this._queueApiRequest(this._proxy.$hide, []);
        }
        _setProcessId(processId) {
            // The event may fire 2 times when the panel is restored
            if (this._pidPromiseComplete) {
                this._pidPromiseComplete(processId);
                this._pidPromiseComplete = undefined;
            }
            else {
                // Recreate the promise if this is the nth processId set (e.g. reused task terminals)
                this._pidPromise.then(pid => {
                    if (pid !== processId) {
                        this._pidPromise = Promise.resolve(processId);
                    }
                });
            }
        }
    }
    exports.ExtHostTerminal = ExtHostTerminal;
    class ApiRequest {
        constructor(callback, args) {
            this._callback = callback;
            this._args = args;
        }
        run(proxy, id) {
            this._callback.apply(proxy, [id].concat(this._args));
        }
    }
    class ExtHostPseudoterminal {
        constructor(_pty) {
            this._pty = _pty;
            this._onProcessData = new event_1.Emitter();
            this.onProcessData = this._onProcessData.event;
            this._onProcessExit = new event_1.Emitter();
            this.onProcessExit = this._onProcessExit.event;
            this._onProcessReady = new event_1.Emitter();
            this._onProcessTitleChanged = new event_1.Emitter();
            this.onProcessTitleChanged = this._onProcessTitleChanged.event;
            this._onProcessOverrideDimensions = new event_1.Emitter();
        }
        get onProcessReady() { return this._onProcessReady.event; }
        get onProcessOverrideDimensions() { return this._onProcessOverrideDimensions.event; }
        shutdown() {
            this._pty.close();
        }
        input(data) {
            if (this._pty.handleInput) {
                this._pty.handleInput(data);
            }
        }
        resize(cols, rows) {
            if (this._pty.setDimensions) {
                this._pty.setDimensions({ columns: cols, rows });
            }
        }
        getInitialCwd() {
            return Promise.resolve('');
        }
        getCwd() {
            return Promise.resolve('');
        }
        getLatency() {
            return Promise.resolve(0);
        }
        startSendingEvents(initialDimensions) {
            // Attach the listeners
            this._pty.onDidWrite(e => this._onProcessData.fire(e));
            if (this._pty.onDidClose) {
                this._pty.onDidClose((e = undefined) => {
                    this._onProcessExit.fire(e === void 0 ? undefined : e);
                });
            }
            if (this._pty.onDidOverrideDimensions) {
                this._pty.onDidOverrideDimensions(e => this._onProcessOverrideDimensions.fire(e ? { cols: e.columns, rows: e.rows } : e));
            }
            this._pty.open(initialDimensions ? initialDimensions : undefined);
            this._onProcessReady.fire({ pid: -1, cwd: '' });
        }
    }
    exports.ExtHostPseudoterminal = ExtHostPseudoterminal;
    let BaseExtHostTerminalService = /** @class */ (() => {
        let BaseExtHostTerminalService = class BaseExtHostTerminalService {
            constructor(extHostRpc) {
                this._terminals = [];
                this._terminalProcesses = {};
                this._terminalProcessDisposables = {};
                this._extensionTerminalAwaitingStart = {};
                this._getTerminalPromises = {};
                this._linkHandlers = new Set();
                this._onDidCloseTerminal = new event_1.Emitter();
                this._onDidOpenTerminal = new event_1.Emitter();
                this._onDidChangeActiveTerminal = new event_1.Emitter();
                this._onDidChangeTerminalDimensions = new event_1.Emitter();
                this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadTerminalService);
                this._bufferer = new terminalDataBuffering_1.TerminalDataBufferer(this._proxy.$sendProcessData);
                this._onDidWriteTerminalData = new event_1.Emitter({
                    onFirstListenerAdd: () => this._proxy.$startSendingDataEvents(),
                    onLastListenerRemove: () => this._proxy.$stopSendingDataEvents()
                });
            }
            get activeTerminal() { return this._activeTerminal; }
            get terminals() { return this._terminals; }
            get onDidCloseTerminal() { return this._onDidCloseTerminal && this._onDidCloseTerminal.event; }
            get onDidOpenTerminal() { return this._onDidOpenTerminal && this._onDidOpenTerminal.event; }
            get onDidChangeActiveTerminal() { return this._onDidChangeActiveTerminal && this._onDidChangeActiveTerminal.event; }
            get onDidChangeTerminalDimensions() { return this._onDidChangeTerminalDimensions && this._onDidChangeTerminalDimensions.event; }
            get onDidWriteTerminalData() { return this._onDidWriteTerminalData && this._onDidWriteTerminalData.event; }
            createExtensionTerminal(options) {
                const terminal = new ExtHostTerminal(this._proxy, options, options.name);
                const p = new ExtHostPseudoterminal(options.pty);
                terminal.createExtensionTerminal().then(id => {
                    const disposable = this._setupExtHostProcessListeners(id, p);
                    this._terminalProcessDisposables[id] = disposable;
                });
                this._terminals.push(terminal);
                return terminal;
            }
            attachPtyToTerminal(id, pty) {
                const terminal = this._getTerminalByIdEventually(id);
                if (!terminal) {
                    throw new Error(`Cannot resolve terminal with id ${id} for virtual process`);
                }
                const p = new ExtHostPseudoterminal(pty);
                const disposable = this._setupExtHostProcessListeners(id, p);
                this._terminalProcessDisposables[id] = disposable;
            }
            async $acceptActiveTerminalChanged(id) {
                const original = this._activeTerminal;
                if (id === null) {
                    this._activeTerminal = undefined;
                    if (original !== this._activeTerminal) {
                        this._onDidChangeActiveTerminal.fire(this._activeTerminal);
                    }
                    return;
                }
                const terminal = await this._getTerminalByIdEventually(id);
                if (terminal) {
                    this._activeTerminal = terminal;
                    if (original !== this._activeTerminal) {
                        this._onDidChangeActiveTerminal.fire(this._activeTerminal);
                    }
                }
            }
            async $acceptTerminalProcessData(id, data) {
                const terminal = await this._getTerminalByIdEventually(id);
                if (terminal) {
                    this._onDidWriteTerminalData.fire({ terminal, data });
                }
            }
            async $acceptTerminalDimensions(id, cols, rows) {
                const terminal = await this._getTerminalByIdEventually(id);
                if (terminal) {
                    if (terminal.setDimensions(cols, rows)) {
                        this._onDidChangeTerminalDimensions.fire({
                            terminal: terminal,
                            dimensions: terminal.dimensions
                        });
                    }
                }
            }
            async $acceptTerminalMaximumDimensions(id, cols, rows) {
                var _a;
                await this._getTerminalByIdEventually(id);
                if (this._terminalProcesses[id]) {
                    // Extension pty terminal only - when virtual process resize fires it means that the
                    // terminal's maximum dimensions changed
                    (_a = this._terminalProcesses[id]) === null || _a === void 0 ? void 0 : _a.resize(cols, rows);
                }
            }
            async $acceptTerminalTitleChange(id, name) {
                await this._getTerminalByIdEventually(id);
                const extHostTerminal = this._getTerminalObjectById(this.terminals, id);
                if (extHostTerminal) {
                    extHostTerminal.name = name;
                }
            }
            async $acceptTerminalClosed(id, exitCode) {
                await this._getTerminalByIdEventually(id);
                const index = this._getTerminalObjectIndexById(this.terminals, id);
                if (index !== null) {
                    const terminal = this._terminals.splice(index, 1)[0];
                    terminal.setExitCode(exitCode);
                    this._onDidCloseTerminal.fire(terminal);
                }
            }
            $acceptTerminalOpened(id, name, shellLaunchConfigDto) {
                const index = this._getTerminalObjectIndexById(this._terminals, id);
                if (index !== null) {
                    // The terminal has already been created (via createTerminal*), only fire the event
                    this._onDidOpenTerminal.fire(this.terminals[index]);
                    this.terminals[index].isOpen = true;
                    return;
                }
                const creationOptions = {
                    name: shellLaunchConfigDto.name,
                    shellPath: shellLaunchConfigDto.executable,
                    shellArgs: shellLaunchConfigDto.args,
                    cwd: typeof shellLaunchConfigDto.cwd === 'string' ? shellLaunchConfigDto.cwd : uri_1.URI.revive(shellLaunchConfigDto.cwd),
                    env: shellLaunchConfigDto.env
                };
                const terminal = new ExtHostTerminal(this._proxy, creationOptions, name, id);
                this._terminals.push(terminal);
                this._onDidOpenTerminal.fire(terminal);
                terminal.isOpen = true;
            }
            async $acceptTerminalProcessId(id, processId) {
                const terminal = await this._getTerminalByIdEventually(id);
                if (terminal) {
                    terminal._setProcessId(processId);
                }
            }
            async $startExtensionTerminal(id, initialDimensions) {
                // Make sure the ExtHostTerminal exists so onDidOpenTerminal has fired before we call
                // Pseudoterminal.start
                const terminal = await this._getTerminalByIdEventually(id);
                if (!terminal) {
                    return;
                }
                // Wait for onDidOpenTerminal to fire
                let openPromise;
                if (terminal.isOpen) {
                    openPromise = Promise.resolve();
                }
                else {
                    openPromise = new Promise(r => {
                        // Ensure open is called after onDidOpenTerminal
                        const listener = this.onDidOpenTerminal(async (e) => {
                            if (e === terminal) {
                                listener.dispose();
                                r();
                            }
                        });
                    });
                }
                await openPromise;
                if (this._terminalProcesses[id]) {
                    this._terminalProcesses[id].startSendingEvents(initialDimensions);
                }
                else {
                    // Defer startSendingEvents call to when _setupExtHostProcessListeners is called
                    this._extensionTerminalAwaitingStart[id] = { initialDimensions };
                }
            }
            _setupExtHostProcessListeners(id, p) {
                const disposables = new lifecycle_1.DisposableStore();
                disposables.add(p.onProcessReady((e) => this._proxy.$sendProcessReady(id, e.pid, e.cwd)));
                disposables.add(p.onProcessTitleChanged(title => this._proxy.$sendProcessTitle(id, title)));
                // Buffer data events to reduce the amount of messages going to the renderer
                this._bufferer.startBuffering(id, p.onProcessData);
                disposables.add(p.onProcessExit(exitCode => this._onProcessExit(id, exitCode)));
                if (p.onProcessOverrideDimensions) {
                    disposables.add(p.onProcessOverrideDimensions(e => this._proxy.$sendOverrideDimensions(id, e)));
                }
                this._terminalProcesses[id] = p;
                const awaitingStart = this._extensionTerminalAwaitingStart[id];
                if (awaitingStart && p instanceof ExtHostPseudoterminal) {
                    p.startSendingEvents(awaitingStart.initialDimensions);
                    delete this._extensionTerminalAwaitingStart[id];
                }
                return disposables;
            }
            $acceptProcessInput(id, data) {
                var _a;
                (_a = this._terminalProcesses[id]) === null || _a === void 0 ? void 0 : _a.input(data);
            }
            $acceptProcessResize(id, cols, rows) {
                var _a;
                try {
                    (_a = this._terminalProcesses[id]) === null || _a === void 0 ? void 0 : _a.resize(cols, rows);
                }
                catch (error) {
                    // We tried to write to a closed pipe / channel.
                    if (error.code !== 'EPIPE' && error.code !== 'ERR_IPC_CHANNEL_CLOSED') {
                        throw (error);
                    }
                }
            }
            $acceptProcessShutdown(id, immediate) {
                var _a;
                (_a = this._terminalProcesses[id]) === null || _a === void 0 ? void 0 : _a.shutdown(immediate);
            }
            $acceptProcessRequestInitialCwd(id) {
                var _a;
                (_a = this._terminalProcesses[id]) === null || _a === void 0 ? void 0 : _a.getInitialCwd().then(initialCwd => this._proxy.$sendProcessInitialCwd(id, initialCwd));
            }
            $acceptProcessRequestCwd(id) {
                var _a;
                (_a = this._terminalProcesses[id]) === null || _a === void 0 ? void 0 : _a.getCwd().then(cwd => this._proxy.$sendProcessCwd(id, cwd));
            }
            $acceptProcessRequestLatency(id) {
                return id;
            }
            registerLinkHandler(handler) {
                this._linkHandlers.add(handler);
                if (this._linkHandlers.size === 1) {
                    this._proxy.$startHandlingLinks();
                }
                return new extHostTypes_1.Disposable(() => {
                    this._linkHandlers.delete(handler);
                    if (this._linkHandlers.size === 0) {
                        this._proxy.$stopHandlingLinks();
                    }
                });
            }
            async $handleLink(id, link) {
                const terminal = this._getTerminalById(id);
                if (!terminal) {
                    return false;
                }
                // Call each handler synchronously so multiple handlers aren't triggered at once
                const it = this._linkHandlers.values();
                let next = it.next();
                while (!next.done) {
                    const handled = await next.value.handleLink(terminal, link);
                    if (handled) {
                        return true;
                    }
                    next = it.next();
                }
                return false;
            }
            _onProcessExit(id, exitCode) {
                this._bufferer.stopBuffering(id);
                // Remove process reference
                delete this._terminalProcesses[id];
                delete this._extensionTerminalAwaitingStart[id];
                // Clean up process disposables
                const processDiposable = this._terminalProcessDisposables[id];
                if (processDiposable) {
                    processDiposable.dispose();
                    delete this._terminalProcessDisposables[id];
                }
                // Send exit event to main side
                this._proxy.$sendProcessExit(id, exitCode);
            }
            // TODO: This could be improved by using a single promise and resolve it when the terminal is ready
            _getTerminalByIdEventually(id, retries = 5) {
                if (!this._getTerminalPromises[id]) {
                    this._getTerminalPromises[id] = this._createGetTerminalPromise(id, retries);
                }
                return this._getTerminalPromises[id];
            }
            _createGetTerminalPromise(id, retries = 5) {
                return new Promise(c => {
                    if (retries === 0) {
                        c(undefined);
                        return;
                    }
                    const terminal = this._getTerminalById(id);
                    if (terminal) {
                        c(terminal);
                    }
                    else {
                        // This should only be needed immediately after createTerminalRenderer is called as
                        // the ExtHostTerminal has not yet been iniitalized
                        async_1.timeout(terminal_1.EXT_HOST_CREATION_DELAY * 2).then(() => c(this._createGetTerminalPromise(id, retries - 1)));
                    }
                });
            }
            _getTerminalById(id) {
                return this._getTerminalObjectById(this._terminals, id);
            }
            _getTerminalObjectById(array, id) {
                const index = this._getTerminalObjectIndexById(array, id);
                return index !== null ? array[index] : null;
            }
            _getTerminalObjectIndexById(array, id) {
                let index = null;
                array.some((item, i) => {
                    const thisId = item._id;
                    if (thisId === id) {
                        index = i;
                        return true;
                    }
                    return false;
                });
                return index;
            }
        };
        BaseExtHostTerminalService = __decorate([
            __param(0, extHostRpcService_1.IExtHostRpcService)
        ], BaseExtHostTerminalService);
        return BaseExtHostTerminalService;
    })();
    exports.BaseExtHostTerminalService = BaseExtHostTerminalService;
    class EnvironmentVariableCollection {
        constructor(serialized) {
            this.map = new Map();
            this._persistent = true;
            this._onDidChangeCollection = new event_1.Emitter();
            this.map = new Map(serialized);
        }
        get persistent() { return this._persistent; }
        set persistent(value) {
            this._persistent = value;
            this._onDidChangeCollection.fire();
        }
        get onDidChangeCollection() { return this._onDidChangeCollection && this._onDidChangeCollection.event; }
        get size() {
            return this.map.size;
        }
        replace(variable, value) {
            this._setIfDiffers(variable, { value, type: extHostTypes_1.EnvironmentVariableMutatorType.Replace });
        }
        append(variable, value) {
            this._setIfDiffers(variable, { value, type: extHostTypes_1.EnvironmentVariableMutatorType.Append });
        }
        prepend(variable, value) {
            this._setIfDiffers(variable, { value, type: extHostTypes_1.EnvironmentVariableMutatorType.Prepend });
        }
        _setIfDiffers(variable, mutator) {
            const current = this.map.get(variable);
            if (!current || current.value !== mutator.value || current.type !== mutator.type) {
                this.map.set(variable, mutator);
                this._onDidChangeCollection.fire();
            }
        }
        get(variable) {
            return this.map.get(variable);
        }
        forEach(callback, thisArg) {
            this.map.forEach((value, key) => callback.call(thisArg, key, value, this));
        }
        delete(variable) {
            this.map.delete(variable);
            this._onDidChangeCollection.fire();
        }
        clear() {
            this.map.clear();
            this._onDidChangeCollection.fire();
        }
    }
    exports.EnvironmentVariableCollection = EnvironmentVariableCollection;
    class WorkerExtHostTerminalService extends BaseExtHostTerminalService {
        createTerminal(name, shellPath, shellArgs) {
            throw new Error('Not implemented');
        }
        createTerminalFromOptions(options) {
            throw new Error('Not implemented');
        }
        getDefaultShell(useAutomationShell, configProvider) {
            throw new Error('Not implemented');
        }
        getDefaultShellArgs(useAutomationShell, configProvider) {
            throw new Error('Not implemented');
        }
        $spawnExtHostProcess(id, shellLaunchConfigDto, activeWorkspaceRootUriComponents, cols, rows, isWorkspaceShellAllowed) {
            throw new Error('Not implemented');
        }
        $getAvailableShells() {
            throw new Error('Not implemented');
        }
        async $getDefaultShellAndArgs(useAutomationShell) {
            throw new Error('Not implemented');
        }
        $acceptWorkspacePermissionsChanged(isAllowed) {
            // No-op for web worker ext host as workspace permissions aren't used
        }
        getEnvironmentVariableCollection(extension, persistent) {
            // This is not implemented so worker ext host extensions cannot influence terminal envs
            throw new Error('Not implemented');
        }
        $initEnvironmentVariableCollections(collections) {
            // No-op for web worker ext host as collections aren't used
        }
    }
    exports.WorkerExtHostTerminalService = WorkerExtHostTerminalService;
});
//# sourceMappingURL=extHostTerminalService.js.map