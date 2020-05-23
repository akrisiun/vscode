"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = exports.startServer = exports.createTerminateServer = exports.assertIsDefined = exports.isUndefinedOrNull = exports.isUndefined = void 0;
const http = require("http");
const url = require("url");
const fs = require("fs");
const path = require("path");
const _typeof = {
    number: 'number',
    string: 'string',
    undefined: 'undefined',
    object: 'object',
    function: 'function'
};
/**
 * @returns whether the provided parameter is undefined.
 */
function isUndefined(obj) {
    return typeof (obj) === _typeof.undefined;
}
exports.isUndefined = isUndefined;
/**
 * @returns whether the provided parameter is undefined or null.
 */
function isUndefinedOrNull(obj) {
    return isUndefined(obj) || obj === null;
}
exports.isUndefinedOrNull = isUndefinedOrNull;
/**
 * Asserts that the argument passed in is neither undefined nor null.
 */
function assertIsDefined(arg) {
    if (isUndefinedOrNull(arg)) {
        throw new Error('Assertion Failed: argument is undefined or null');
    }
    return arg;
}
exports.assertIsDefined = assertIsDefined;
function createTerminateServer(server) {
    const sockets = {};
    let socketCount = 0;
    server.on('connection', socket => {
        const id = socketCount++;
        sockets[id] = socket;
        socket.on('close', () => {
            delete sockets[id];
        });
    });
    return async () => {
        const result = new Promise(resolve => server.close(resolve));
        for (const id in sockets) {
            sockets[id].destroy();
        }
        return result;
    };
}
exports.createTerminateServer = createTerminateServer;
async function startServer(server) {
    let portTimer;
    function cancelPortTimer() {
        clearTimeout(portTimer);
    }
    const port = new Promise((resolve, reject) => {
        portTimer = setTimeout(() => {
            reject(new Error('Timeout waiting for port'));
        }, 5000);
        server.on('listening', () => {
            const address = server.address();
            if (typeof address === 'string') {
                resolve(address);
            }
            else {
                resolve(assertIsDefined(address).port.toString());
            }
        });
        server.on('error', _ => {
            reject(new Error('Error listening to server'));
        });
        server.on('close', () => {
            reject(new Error('Closed'));
        });
        server.listen(0);
    });
    port.then(cancelPortTimer, cancelPortTimer);
    return port;
}
exports.startServer = startServer;
function sendFile(res, filepath, contentType) {
    fs.readFile(filepath, (err, body) => {
        if (err) {
            console.error(err);
            res.writeHead(404);
            res.end();
        }
        else {
            res.writeHead(200, {
                'Content-Length': body.length,
                'Content-Type': contentType
            });
            res.end(body);
        }
    });
}
async function callback(nonce, reqUrl) {
    const query = reqUrl.query;
    if (!query || typeof query === 'string') {
        throw new Error('No query received.');
    }
    let error = query.error_description || query.error;
    if (!error) {
        const state = query.state || '';
        const receivedNonce = (state.split(',')[1] || '').replace(/ /g, '+');
        if (receivedNonce !== nonce) {
            error = 'Nonce does not match.';
        }
    }
    const code = query.code;
    if (!error && code) {
        return code;
    }
    throw new Error(error || 'No code received.');
}
function createServer(nonce) {
    let deferredRedirect;
    const redirectPromise = new Promise((resolve, reject) => deferredRedirect = { resolve, reject });
    let deferredCode;
    const codePromise = new Promise((resolve, reject) => deferredCode = { resolve, reject });
    const codeTimer = setTimeout(() => {
        deferredCode.reject(new Error('Timeout waiting for code'));
    }, 5 * 60 * 1000);
    function cancelCodeTimer() {
        clearTimeout(codeTimer);
    }
    const server = http.createServer(function (req, res) {
        const reqUrl = url.parse(req.url, /* parseQueryString */ true);
        switch (reqUrl.pathname) {
            case '/signin':
                const receivedNonce = (reqUrl.query.nonce || '').replace(/ /g, '+');
                if (receivedNonce === nonce) {
                    deferredRedirect.resolve({ req, res });
                }
                else {
                    const err = new Error('Nonce does not match.');
                    deferredRedirect.resolve({ err, res });
                }
                break;
            case '/':
                sendFile(res, path.join(__dirname, '../media/auth.html'), 'text/html; charset=utf-8');
                break;
            case '/auth.css':
                sendFile(res, path.join(__dirname, '../media/auth.css'), 'text/css; charset=utf-8');
                break;
            case '/callback':
                deferredCode.resolve(callback(nonce, reqUrl)
                    .then(code => ({ code, res }), err => ({ err, res })));
                break;
            default:
                res.writeHead(404);
                res.end();
                break;
        }
    });
    codePromise.then(cancelCodeTimer, cancelCodeTimer);
    return {
        server,
        redirectPromise,
        codePromise
    };
}
exports.createServer = createServer;
//# sourceMappingURL=authServer.js.map