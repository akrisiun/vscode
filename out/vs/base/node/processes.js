/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "fs", "util", "child_process", "vs/nls", "vs/base/common/types", "vs/base/common/objects", "vs/base/common/extpath", "vs/base/common/platform", "vs/base/node/decoder", "vs/base/common/amd"], function (require, exports, path, fs, util_1, cp, nls, Types, Objects, extpath, Platform, decoder_1, amd_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getWindowsCode(status) {
        switch (status) {
            case 0:
                return 0 /* Success */;
            case 1:
                return 2 /* AccessDenied */;
            case 128:
                return 3 /* ProcessNotFound */;
            default:
                return 1 /* Unknown */;
        }
    }
    function terminateProcess(process, cwd) {
        if (Platform.isWindows) {
            try {
                const options = {
                    stdio: ['pipe', 'pipe', 'ignore']
                };
                if (cwd) {
                    options.cwd = cwd;
                }
                const killProcess = cp.execFile('taskkill', ['/T', '/F', '/PID', process.pid.toString()], options);
                return new Promise((resolve, reject) => {
                    killProcess.once('error', (err) => {
                        resolve({ success: false, error: err });
                    });
                    killProcess.once('exit', (code, signal) => {
                        if (code === 0) {
                            resolve({ success: true });
                        }
                        else {
                            resolve({ success: false, code: code !== null ? code : 1 /* Unknown */ });
                        }
                    });
                });
            }
            catch (err) {
                return Promise.resolve({ success: false, error: err, code: err.status ? getWindowsCode(err.status) : 1 /* Unknown */ });
            }
        }
        else if (Platform.isLinux || Platform.isMacintosh) {
            try {
                const cmd = amd_1.getPathFromAmdModule(require, 'vs/base/node/terminateProcess.sh');
                return new Promise((resolve, reject) => {
                    cp.execFile(cmd, [process.pid.toString()], { encoding: 'utf8', shell: true }, (err, stdout, stderr) => {
                        if (err) {
                            resolve({ success: false, error: err });
                        }
                        else {
                            resolve({ success: true });
                        }
                    });
                });
            }
            catch (err) {
                return Promise.resolve({ success: false, error: err });
            }
        }
        else {
            process.kill('SIGKILL');
        }
        return Promise.resolve({ success: true });
    }
    function getWindowsShell() {
        return process.env['comspec'] || 'cmd.exe';
    }
    exports.getWindowsShell = getWindowsShell;
    class AbstractProcess {
        constructor(arg1, arg2, arg3, arg4) {
            if (arg2 !== undefined && arg3 !== undefined && arg4 !== undefined) {
                this.cmd = arg1;
                this.args = arg2;
                this.shell = arg3;
                this.options = arg4;
            }
            else {
                const executable = arg1;
                this.cmd = executable.command;
                this.shell = executable.isShellCommand;
                this.args = executable.args.slice(0);
                this.options = executable.options || {};
            }
            this.childProcess = null;
            this.childProcessPromise = null;
            this.terminateRequested = false;
            if (this.options.env) {
                const newEnv = Object.create(null);
                Object.keys(process.env).forEach((key) => {
                    newEnv[key] = process.env[key];
                });
                Object.keys(this.options.env).forEach((key) => {
                    newEnv[key] = this.options.env[key];
                });
                this.options.env = newEnv;
            }
        }
        getSanitizedCommand() {
            let result = this.cmd.toLowerCase();
            const index = result.lastIndexOf(path.sep);
            if (index !== -1) {
                result = result.substring(index + 1);
            }
            if (AbstractProcess.WellKnowCommands[result]) {
                return result;
            }
            return 'other';
        }
        start(pp) {
            if (Platform.isWindows && ((this.options && this.options.cwd && extpath.isUNC(this.options.cwd)) || !this.options && extpath.isUNC(process.cwd()))) {
                return Promise.reject(new Error(nls.localize('TaskRunner.UNC', 'Can\'t execute a shell command on a UNC drive.')));
            }
            return this.useExec().then((useExec) => {
                let cc;
                let ee;
                const result = new Promise((c, e) => {
                    cc = c;
                    ee = e;
                });
                if (useExec) {
                    let cmd = this.cmd;
                    if (this.args) {
                        cmd = cmd + ' ' + this.args.join(' ');
                    }
                    this.childProcess = cp.exec(cmd, this.options, (error, stdout, stderr) => {
                        this.childProcess = null;
                        const err = error;
                        // This is tricky since executing a command shell reports error back in case the executed command return an
                        // error or the command didn't exist at all. So we can't blindly treat an error as a failed command. So we
                        // always parse the output and report success unless the job got killed.
                        if (err && err.killed) {
                            ee({ killed: this.terminateRequested, stdout: stdout.toString(), stderr: stderr.toString() });
                        }
                        else {
                            this.handleExec(cc, pp, error, stdout, stderr);
                        }
                    });
                }
                else {
                    let childProcess = null;
                    const closeHandler = (data) => {
                        this.childProcess = null;
                        this.childProcessPromise = null;
                        this.handleClose(data, cc, pp, ee);
                        const result = {
                            terminated: this.terminateRequested
                        };
                        if (Types.isNumber(data)) {
                            result.cmdCode = data;
                        }
                        cc(result);
                    };
                    if (this.shell && Platform.isWindows) {
                        const options = Objects.deepClone(this.options);
                        options.windowsVerbatimArguments = true;
                        options.detached = false;
                        let quotedCommand = false;
                        let quotedArg = false;
                        const commandLine = [];
                        let quoted = this.ensureQuotes(this.cmd);
                        commandLine.push(quoted.value);
                        quotedCommand = quoted.quoted;
                        if (this.args) {
                            this.args.forEach((elem) => {
                                quoted = this.ensureQuotes(elem);
                                commandLine.push(quoted.value);
                                quotedArg = quotedArg && quoted.quoted;
                            });
                        }
                        const args = [
                            '/s',
                            '/c',
                        ];
                        if (quotedCommand) {
                            if (quotedArg) {
                                args.push('"' + commandLine.join(' ') + '"');
                            }
                            else if (commandLine.length > 1) {
                                args.push('"' + commandLine[0] + '"' + ' ' + commandLine.slice(1).join(' '));
                            }
                            else {
                                args.push('"' + commandLine[0] + '"');
                            }
                        }
                        else {
                            args.push(commandLine.join(' '));
                        }
                        childProcess = cp.spawn(getWindowsShell(), args, options);
                    }
                    else {
                        if (this.cmd) {
                            childProcess = cp.spawn(this.cmd, this.args, this.options);
                        }
                    }
                    if (childProcess) {
                        this.childProcess = childProcess;
                        this.childProcessPromise = Promise.resolve(childProcess);
                        if (this.pidResolve) {
                            this.pidResolve(Types.isNumber(childProcess.pid) ? childProcess.pid : -1);
                            this.pidResolve = undefined;
                        }
                        childProcess.on('error', (error) => {
                            this.childProcess = null;
                            ee({ terminated: this.terminateRequested, error: error });
                        });
                        if (childProcess.pid) {
                            this.childProcess.on('close', closeHandler);
                            this.handleSpawn(childProcess, cc, pp, ee, true);
                        }
                    }
                }
                return result;
            });
        }
        handleClose(data, cc, pp, ee) {
            // Default is to do nothing.
        }
        ensureQuotes(value) {
            if (AbstractProcess.regexp.test(value)) {
                return {
                    value: '"' + value + '"',
                    quoted: true
                };
            }
            else {
                return {
                    value: value,
                    quoted: value.length > 0 && value[0] === '"' && value[value.length - 1] === '"'
                };
            }
        }
        get pid() {
            if (this.childProcessPromise) {
                return this.childProcessPromise.then(childProcess => childProcess.pid, err => -1);
            }
            else {
                return new Promise((resolve) => {
                    this.pidResolve = resolve;
                });
            }
        }
        terminate() {
            if (!this.childProcessPromise) {
                return Promise.resolve({ success: true });
            }
            return this.childProcessPromise.then((childProcess) => {
                this.terminateRequested = true;
                return terminateProcess(childProcess, this.options.cwd).then(response => {
                    if (response.success) {
                        this.childProcess = null;
                    }
                    return response;
                });
            }, (err) => {
                return { success: true };
            });
        }
        useExec() {
            return new Promise((c, e) => {
                if (!this.shell || !Platform.isWindows) {
                    return c(false);
                }
                const cmdShell = cp.spawn(getWindowsShell(), ['/s', '/c']);
                cmdShell.on('error', (error) => {
                    return c(true);
                });
                cmdShell.on('exit', (data) => {
                    return c(false);
                });
            });
        }
    }
    exports.AbstractProcess = AbstractProcess;
    AbstractProcess.WellKnowCommands = {
        'ant': true,
        'cmake': true,
        'eslint': true,
        'gradle': true,
        'grunt': true,
        'gulp': true,
        'jake': true,
        'jenkins': true,
        'jshint': true,
        'make': true,
        'maven': true,
        'msbuild': true,
        'msc': true,
        'nmake': true,
        'npm': true,
        'rake': true,
        'tsc': true,
        'xbuild': true
    };
    AbstractProcess.regexp = /^[^"].* .*[^"]/;
    class LineProcess extends AbstractProcess {
        constructor(arg1, arg2, arg3, arg4) {
            super(arg1, arg2, arg3, arg4);
            this.stdoutLineDecoder = null;
            this.stderrLineDecoder = null;
        }
        handleExec(cc, pp, error, stdout, stderr) {
            [stdout, stderr].forEach((buffer, index) => {
                const lineDecoder = new decoder_1.LineDecoder();
                const lines = lineDecoder.write(buffer);
                lines.forEach((line) => {
                    pp({ line: line, source: index === 0 ? 0 /* stdout */ : 1 /* stderr */ });
                });
                const line = lineDecoder.end();
                if (line) {
                    pp({ line: line, source: index === 0 ? 0 /* stdout */ : 1 /* stderr */ });
                }
            });
            cc({ terminated: this.terminateRequested, error: error });
        }
        handleSpawn(childProcess, cc, pp, ee, sync) {
            const stdoutLineDecoder = new decoder_1.LineDecoder();
            const stderrLineDecoder = new decoder_1.LineDecoder();
            childProcess.stdout.on('data', (data) => {
                const lines = stdoutLineDecoder.write(data);
                lines.forEach(line => pp({ line: line, source: 0 /* stdout */ }));
            });
            childProcess.stderr.on('data', (data) => {
                const lines = stderrLineDecoder.write(data);
                lines.forEach(line => pp({ line: line, source: 1 /* stderr */ }));
            });
            this.stdoutLineDecoder = stdoutLineDecoder;
            this.stderrLineDecoder = stderrLineDecoder;
        }
        handleClose(data, cc, pp, ee) {
            const stdoutLine = this.stdoutLineDecoder ? this.stdoutLineDecoder.end() : null;
            if (stdoutLine) {
                pp({ line: stdoutLine, source: 0 /* stdout */ });
            }
            const stderrLine = this.stderrLineDecoder ? this.stderrLineDecoder.end() : null;
            if (stderrLine) {
                pp({ line: stderrLine, source: 1 /* stderr */ });
            }
        }
    }
    exports.LineProcess = LineProcess;
    // Wrapper around process.send() that will queue any messages if the internal node.js
    // queue is filled with messages and only continue sending messages when the internal
    // queue is free again to consume messages.
    // On Windows we always wait for the send() method to return before sending the next message
    // to workaround https://github.com/nodejs/node/issues/7657 (IPC can freeze process)
    function createQueuedSender(childProcess) {
        let msgQueue = [];
        let useQueue = false;
        const send = function (msg) {
            if (useQueue) {
                msgQueue.push(msg); // add to the queue if the process cannot handle more messages
                return;
            }
            const result = childProcess.send(msg, (error) => {
                if (error) {
                    console.error(error); // unlikely to happen, best we can do is log this error
                }
                useQueue = false; // we are good again to send directly without queue
                // now send all the messages that we have in our queue and did not send yet
                if (msgQueue.length > 0) {
                    const msgQueueCopy = msgQueue.slice(0);
                    msgQueue = [];
                    msgQueueCopy.forEach(entry => send(entry));
                }
            });
            if (!result || Platform.isWindows /* workaround https://github.com/nodejs/node/issues/7657 */) {
                useQueue = true;
            }
        };
        return { send };
    }
    exports.createQueuedSender = createQueuedSender;
    var win32;
    (function (win32) {
        async function findExecutable(command, cwd, paths) {
            // If we have an absolute path then we take it.
            if (path.isAbsolute(command)) {
                return command;
            }
            if (cwd === undefined) {
                cwd = process.cwd();
            }
            const dir = path.dirname(command);
            if (dir !== '.') {
                // We have a directory and the directory is relative (see above). Make the path absolute
                // to the current working directory.
                return path.join(cwd, command);
            }
            if (paths === undefined && Types.isString(process.env.PATH)) {
                paths = process.env.PATH.split(path.delimiter);
            }
            // No PATH environment. Make path absolute to the cwd.
            if (paths === undefined || paths.length === 0) {
                return path.join(cwd, command);
            }
            // We have a simple file name. We get the path variable from the env
            // and try to find the executable on the path.
            for (let pathEntry of paths) {
                // The path entry is absolute.
                let fullPath;
                if (path.isAbsolute(pathEntry)) {
                    fullPath = path.join(pathEntry, command);
                }
                else {
                    fullPath = path.join(cwd, pathEntry, command);
                }
                if (await util_1.promisify(fs.exists)(fullPath)) {
                    return fullPath;
                }
                let withExtension = fullPath + '.com';
                if (await util_1.promisify(fs.exists)(withExtension)) {
                    return withExtension;
                }
                withExtension = fullPath + '.exe';
                if (await util_1.promisify(fs.exists)(withExtension)) {
                    return withExtension;
                }
            }
            return path.join(cwd, command);
        }
        win32.findExecutable = findExecutable;
    })(win32 = exports.win32 || (exports.win32 = {}));
});
//# sourceMappingURL=processes.js.map