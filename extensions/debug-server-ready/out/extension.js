"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const util = require("util");
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle();
const PATTERN = 'listening on.* (https?://\\S+|[0-9]+)'; // matches "listening on port 3000" or "Now listening on: https://localhost:5001"
const URI_PORT_FORMAT = 'http://localhost:%s';
const URI_FORMAT = '%s';
const WEB_ROOT = '${workspaceFolder}';
class ServerReadyDetector extends vscode.Disposable {
    constructor(session) {
        super(() => this.internalDispose());
        this.session = session;
        this.hasFired = false;
        this.disposables = [];
        this.regexp = new RegExp(session.configuration.serverReadyAction.pattern || PATTERN, 'i');
    }
    static start(session) {
        if (session.configuration.serverReadyAction) {
            let detector = ServerReadyDetector.detectors.get(session);
            if (!detector) {
                detector = new ServerReadyDetector(session);
                ServerReadyDetector.detectors.set(session, detector);
            }
            return detector;
        }
        return undefined;
    }
    static stop(session) {
        let detector = ServerReadyDetector.detectors.get(session);
        if (detector) {
            ServerReadyDetector.detectors.delete(session);
            detector.dispose();
        }
    }
    static rememberShellPid(session, pid) {
        let detector = ServerReadyDetector.detectors.get(session);
        if (detector) {
            detector.shellPid = pid;
        }
    }
    static async startListeningTerminalData() {
        if (!this.terminalDataListener) {
            this.terminalDataListener = vscode.window.onDidWriteTerminalData(async (e) => {
                // first find the detector with a matching pid
                const pid = await e.terminal.processId;
                for (let [, detector] of this.detectors) {
                    if (detector.shellPid === pid) {
                        detector.detectPattern(e.data);
                        return;
                    }
                }
                // if none found, try all detectors until one matches
                for (let [, detector] of this.detectors) {
                    if (detector.detectPattern(e.data)) {
                        return;
                    }
                }
            });
        }
    }
    internalDispose() {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
    detectPattern(s) {
        if (!this.hasFired) {
            const matches = this.regexp.exec(s);
            if (matches && matches.length >= 1) {
                this.openExternalWithString(this.session, matches.length > 1 ? matches[1] : '');
                this.hasFired = true;
                this.internalDispose();
                return true;
            }
        }
        return false;
    }
    openExternalWithString(session, captureString) {
        const args = session.configuration.serverReadyAction;
        let uri;
        if (captureString === '') {
            // nothing captured by reg exp -> use the uriFormat as the target uri without substitution
            // verify that format does not contain '%s'
            const format = args.uriFormat || '';
            if (format.indexOf('%s') >= 0) {
                const errMsg = localize('server.ready.nocapture.error', "Format uri ('{0}') uses a substitution placeholder but pattern did not capture anything.", format);
                vscode.window.showErrorMessage(errMsg, { modal: true }).then(_ => undefined);
                return;
            }
            uri = format;
        }
        else {
            // if no uriFormat is specified guess the appropriate format based on the captureString
            const format = args.uriFormat || (/^[0-9]+$/.test(captureString) ? URI_PORT_FORMAT : URI_FORMAT);
            // verify that format only contains a single '%s'
            const s = format.split('%s');
            if (s.length !== 2) {
                const errMsg = localize('server.ready.placeholder.error', "Format uri ('{0}') must contain exactly one substitution placeholder.", format);
                vscode.window.showErrorMessage(errMsg, { modal: true }).then(_ => undefined);
                return;
            }
            uri = util.format(format, captureString);
        }
        this.openExternalWithUri(session, uri);
    }
    openExternalWithUri(session, uri) {
        const args = session.configuration.serverReadyAction;
        switch (args.action || 'openExternally') {
            case 'openExternally':
                vscode.env.openExternal(vscode.Uri.parse(uri));
                break;
            case 'debugWithChrome':
                if (vscode.env.remoteName === 'wsl' || !!vscode.extensions.getExtension('msjsdiag.debugger-for-chrome')) {
                    vscode.debug.startDebugging(session.workspaceFolder, {
                        type: 'chrome',
                        name: 'Chrome Debug',
                        request: 'launch',
                        url: uri,
                        webRoot: args.webRoot || WEB_ROOT
                    }, session);
                }
                else {
                    const errMsg = localize('server.ready.chrome.not.installed', "The action '{0}' requires the '{1}' extension.", 'debugWithChrome', 'Debugger for Chrome');
                    vscode.window.showErrorMessage(errMsg, { modal: true }).then(_ => undefined);
                }
                break;
            default:
                // not supported
                break;
        }
    }
}
ServerReadyDetector.detectors = new Map();
function activate(context) {
    context.subscriptions.push(vscode.debug.onDidChangeActiveDebugSession(session => {
        if (session && session.configuration.serverReadyAction) {
            const detector = ServerReadyDetector.start(session);
            if (detector) {
                ServerReadyDetector.startListeningTerminalData();
            }
        }
    }));
    context.subscriptions.push(vscode.debug.onDidTerminateDebugSession(session => {
        ServerReadyDetector.stop(session);
    }));
    const trackers = new Set();
    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('*', {
        resolveDebugConfiguration(_folder, debugConfiguration) {
            if (debugConfiguration.type && debugConfiguration.serverReadyAction) {
                if (!trackers.has(debugConfiguration.type)) {
                    trackers.add(debugConfiguration.type);
                    startTrackerForType(context, debugConfiguration.type);
                }
            }
            return debugConfiguration;
        }
    }));
}
exports.activate = activate;
function startTrackerForType(context, type) {
    // scan debug console output for a PORT message
    context.subscriptions.push(vscode.debug.registerDebugAdapterTrackerFactory(type, {
        createDebugAdapterTracker(session) {
            const detector = ServerReadyDetector.start(session);
            if (detector) {
                let runInTerminalRequestSeq;
                return {
                    onDidSendMessage: m => {
                        if (m.type === 'event' && m.event === 'output' && m.body) {
                            switch (m.body.category) {
                                case 'console':
                                case 'stderr':
                                case 'stdout':
                                    if (m.body.output) {
                                        detector.detectPattern(m.body.output);
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }
                        if (m.type === 'request' && m.command === 'runInTerminal' && m.arguments) {
                            if (m.arguments.kind === 'integrated') {
                                runInTerminalRequestSeq = m.seq; // remember this to find matching response
                            }
                        }
                    },
                    onWillReceiveMessage: m => {
                        if (runInTerminalRequestSeq && m.type === 'response' && m.command === 'runInTerminal' && m.body && runInTerminalRequestSeq === m.request_seq) {
                            runInTerminalRequestSeq = undefined;
                            ServerReadyDetector.rememberShellPid(session, m.body.shellProcessId);
                        }
                    }
                };
            }
            return undefined;
        }
    }));
}
//# sourceMappingURL=extension.js.map