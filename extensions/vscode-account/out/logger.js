"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
var Level;
(function (Level) {
    Level["Trace"] = "trace";
    Level["Info"] = "Info";
})(Level || (Level = {}));
class Log {
    constructor() {
        this.output = vscode.window.createOutputChannel('Microsoft Authentication');
        this.level = vscode.workspace.getConfiguration('microsoftAccount').get('logLevel') || Level.Info;
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('microsoftAccount.logLevel')) {
                this.level = vscode.workspace.getConfiguration('microsoftAccount').get('logLevel') || Level.Info;
            }
        });
    }
    data2String(data) {
        if (data instanceof Error) {
            return data.stack || data.message;
        }
        if (data.success === false && data.message) {
            return data.message;
        }
        return data.toString();
    }
    info(message, data) {
        this.logLevel('Info', message, data);
    }
    error(message, data) {
        this.logLevel('Error', message, data);
    }
    trace(message, data) {
        if (this.level === Level.Trace) {
            this.logLevel('Trace', message, data);
        }
    }
    logLevel(level, message, data) {
        this.output.appendLine(`[${level}  - ${this.now()}] ${message}`);
        if (data) {
            this.output.appendLine(this.data2String(data));
        }
    }
    now() {
        const now = new Date();
        return padLeft(now.getUTCHours() + '', 2, '0')
            + ':' + padLeft(now.getMinutes() + '', 2, '0')
            + ':' + padLeft(now.getUTCSeconds() + '', 2, '0') + '.' + now.getMilliseconds();
    }
}
function padLeft(s, n, pad = ' ') {
    return pad.repeat(Math.max(0, n - s.length)) + s;
}
const Logger = new Log();
exports.default = Logger;
//# sourceMappingURL=logger.js.map