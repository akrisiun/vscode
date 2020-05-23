/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "os"], function (require, exports, child_process_1, os) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveTerminalEncoding = void 0;
    const windowsTerminalEncodings = {
        '437': 'cp437',
        '850': 'cp850',
        '852': 'cp852',
        '855': 'cp855',
        '857': 'cp857',
        '860': 'cp860',
        '861': 'cp861',
        '863': 'cp863',
        '865': 'cp865',
        '866': 'cp866',
        '869': 'cp869',
        '936': 'cp936',
        '1252': 'cp1252' // West European Latin
    };
    function toIconvLiteEncoding(encodingName) {
        const normalizedEncodingName = encodingName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const mapped = JSCHARDET_TO_ICONV_ENCODINGS[normalizedEncodingName];
        return mapped || normalizedEncodingName;
    }
    const JSCHARDET_TO_ICONV_ENCODINGS = {
        'ibm866': 'cp866',
        'big5': 'cp950'
    };
    const UTF8 = 'utf8';
    async function resolveTerminalEncoding(verbose) {
        let rawEncodingPromise;
        // Support a global environment variable to win over other mechanics
        const cliEncodingEnv = process.env['VSCODE_CLI_ENCODING'];
        if (cliEncodingEnv) {
            if (verbose) {
                console.log(`Found VSCODE_CLI_ENCODING variable: ${cliEncodingEnv}`);
            }
            rawEncodingPromise = Promise.resolve(cliEncodingEnv);
        }
        // Windows: educated guess
        else if (os.platform() === 'win32') {
            rawEncodingPromise = new Promise(resolve => {
                if (verbose) {
                    console.log('Running "chcp" to detect terminal encoding...');
                }
                child_process_1.exec('chcp', (err, stdout, stderr) => {
                    if (stdout) {
                        const windowsTerminalEncodingKeys = Object.keys(windowsTerminalEncodings);
                        for (const key of windowsTerminalEncodingKeys) {
                            if (stdout.indexOf(key) >= 0) {
                                return resolve(windowsTerminalEncodings[key]);
                            }
                        }
                    }
                    return resolve(undefined);
                });
            });
        }
        // Linux/Mac: use "locale charmap" command
        else {
            rawEncodingPromise = new Promise(resolve => {
                if (verbose) {
                    console.log('Running "locale charmap" to detect terminal encoding...');
                }
                child_process_1.exec('locale charmap', (err, stdout, stderr) => resolve(stdout));
            });
        }
        const rawEncoding = await rawEncodingPromise;
        if (verbose) {
            console.log(`Detected raw terminal encoding: ${rawEncoding}`);
        }
        if (!rawEncoding || rawEncoding.toLowerCase() === 'utf-8' || rawEncoding.toLowerCase() === UTF8) {
            return UTF8;
        }
        return toIconvLiteEncoding(rawEncoding);
    }
    exports.resolveTerminalEncoding = resolveTerminalEncoding;
});
//# sourceMappingURL=terminalEncoding.js.map