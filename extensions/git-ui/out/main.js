"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const cp = require("child_process");
async function deactivate() {
}
exports.deactivate = deactivate;
async function activate(context) {
    context.subscriptions.push(vscode_1.commands.registerCommand('git.credential', async (data) => {
        try {
            const { stdout, stderr } = await exec(`git credential ${data.command}`, {
                stdin: data.stdin,
                env: Object.assign(process.env, { GIT_TERMINAL_PROMPT: '0' })
            });
            return { stdout, stderr, code: 0 };
        }
        catch ({ stdout, stderr, error }) {
            const code = error.code || 0;
            if (stderr.indexOf('terminal prompts disabled') !== -1) {
                stderr = '';
            }
            return { stdout, stderr, code };
        }
    }));
}
exports.activate = activate;
function exec(command, options = {}) {
    return new Promise((resolve, reject) => {
        const child = cp.exec(command, options, (error, stdout, stderr) => {
            (error ? reject : resolve)({ error, stdout, stderr });
        });
        if (options.stdin) {
            child.stdin.write(options.stdin, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                child.stdin.end((err) => {
                    if (err) {
                        reject(err);
                    }
                });
            });
        }
    });
}
exports.exec = exec;
//# sourceMappingURL=main.js.map