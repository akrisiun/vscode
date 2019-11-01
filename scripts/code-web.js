#!/usr/bin/env node

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// @ts-check

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const util = require('util');
const opn = require('opn');
const minimist = require('vscode-minimist');

const APP_ROOT = path.dirname(__dirname);

// inspect-brk=10298
// const APP_ROOT = path.dirname("e:/Beta/js");
// C:\Program Files (x86)\Yarn\bin\yarn.cmd web --inspect-brk=10298

const WEB_MAIN = path.join(APP_ROOT, 'src', 'vs', 'code', 'browser', 'workbench', 'workbench-dev.html');
const PORT = 8088;

const args = minimist(process.argv, {
	string: [
		'no-launch'
	]
});

console.log('Press any key to exit');

// 'vscode-textmate': `${window.location.origin}/static/remote/web/node_modules/vscode-textmate/release/main`,
// 'onigasm-umd': `${window.location.origin}/static/remote/web/node_modules/onigasm-umd/release/main`,
// 'xterm': `${window.location.origin}/static/remote/web/node_modules/xterm/lib/xterm.js`,
// 'xterm-addon-search': `${window.location.origin}/static/remote/web/node_modules/xterm-addon-search/lib/xterm-addon-search.js`,
// 'xterm-addon-web-links': `${window.location.origin}/static/remote/web/node_modules/xterm-addon-web-links/lib/xterm-addon-web-links.js`,
// 'semver-umd': `${window.location.origin}/static/remote/web/node_modules/semver-umd/lib/semver-umd.js`,

const server = http.createServer((req, res) => {
	const parsedUrl = url.parse(req.url, true);
	const pathname = parsedUrl.pathname;

	try {
		if (pathname === '/favicon.ico') {
			// favicon
			return serveFile(req, res, path.join(APP_ROOT, 'resources', 'win32', 'code.ico'));
		}

		// /out/vs/workbench/browser/workbench.js
		// E:\Beta\js\vscode-web\src\vs\code\browser\workbench\workbench.ts:0
		// http://localhost:8088/static/out/vs/workbench/browser/workbench.js

		// console.log("web:", pathname);
		if ("/manifest.json" === pathname) {
			return handleStatic(req, res, parsedUrl);
		}
		if (/^\/static\//.test(pathname)) {
			// static requests
			return handleStatic(req, res, parsedUrl);
		}
		if (/^\/static-extension\//.test(pathname)) {
			// static extension requests
			return handleStaticExtension(req, res, parsedUrl);
		}
		if (pathname === '/') {
			// main web
			return handleRoot(req, res);
		}

		return serveError(req, res, 404, 'Not found.');
	} catch (error) {
		console.error(error.toString());

		return serveError(req, res, 500, 'Internal Server Error.');
	}
});

let isListen = false;
function listen() {
	if (!isListen) {
		isListen = true;

		server.listen(PORT, () => {
			console.log(`Web UI available at http://localhost:${PORT}`);
		});
	}
}

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on("keypress", function(chunk, key) {
	if(key && key.name === "c" && key.ctrl) {
	  console.log(" bye bye");
	  process.exit();
	}
  });

process.stdin.on('data', (args) => {
		listen();
		// process.exit.bind(process, 0);
	}
);


server.on('error', err => {
	console.error(`Error occurred in server:`);
	console.error(err);
});

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {import('url').UrlWithParsedQuery} parsedUrl
 */
function handleStatic(req, res, parsedUrl) {

	// Strip `/static/` from the path
	const relativeFilePath = path.normalize(decodeURIComponent(parsedUrl.pathname.substr('/static/'.length)));

	return serveFile(req, res, path.join(APP_ROOT, relativeFilePath));
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {import('url').UrlWithParsedQuery} parsedUrl
 */
function handleStaticExtension(req, res, parsedUrl) {

	// Strip `/static-extension/` from the path
	const relativeFilePath = path.normalize(decodeURIComponent(parsedUrl.pathname.substr('/static-extension/'.length)));

	const filePath = path.join(APP_ROOT, 'extensions', relativeFilePath);

	return serveFile(req, res, filePath);
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
async function handleRoot(req, res) {
	const extensionFolders = await util.promisify(fs.readdir)(path.join(APP_ROOT, 'extensions'));
	const mapExtensionFolderToExtensionPackageJSON = new Map();

	await Promise.all(extensionFolders.map(async extensionFolder => {
		try {
			const packageJSON = JSON.parse((await util.promisify(fs.readFile)(path.join(APP_ROOT, 'extensions', extensionFolder, 'package.json'))).toString());
			if (packageJSON.main && packageJSON.name !== 'vscode-api-tests') {
				return; // unsupported
			}

			if (packageJSON.name === 'scss') {
				return; // seems to fail to JSON.parse()?!
			}

			packageJSON.extensionKind = 'web'; // enable for Web

			mapExtensionFolderToExtensionPackageJSON.set(extensionFolder, packageJSON);
		} catch (error) {
			return null;
		}
	}));

	const staticExtensions = [];

	// Built in extensions
	mapExtensionFolderToExtensionPackageJSON.forEach((packageJSON, extensionFolder) => {
		staticExtensions.push({
			packageJSON,
			extensionLocation: { scheme: 'http', authority: `localhost:${PORT}`, path: `/static-extension/${extensionFolder}` }
		});
	});

	const data = (await util.promisify(fs.readFile)(WEB_MAIN)).toString()
		/* ankr: TODO
		.replace('{{WORKBENCH_WEB_CONFIGURATION}}', escapeAttribute(JSON.stringify({
			staticExtensions,
			folderUri: { scheme: 'memfs', path: `/` }
		})))  */
		.replace('{{WEBVIEW_ENDPOINT}}', '')
		.replace('{{REMOTE_USER_DATA_URI}}', '');

	res.writeHead(200, { 'Content-Type': 'text/html' });
	return res.end(data);
}

/**
 * @param {string} value
 */
function escapeAttribute(value) {
	return value.replace(/"/g, '&quot;');
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {string} errorMessage
 */
function serveError(req, res, errorCode, errorMessage) {
	res.writeHead(errorCode, { 'Content-Type': 'text/plain' });
	res.end(errorMessage);
}

const textMimeType = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.json': 'application/json',
	'.css': 'text/css',
	'.svg': 'image/svg+xml',
};

const mapExtToMediaMimes = {
	'.bmp': 'image/bmp',
	'.gif': 'image/gif',
	'.ico': 'image/x-icon',
	'.jpe': 'image/jpg',
	'.jpeg': 'image/jpg',
	'.jpg': 'image/jpg',
	'.png': 'image/png',
	'.tga': 'image/x-tga',
	'.tif': 'image/tiff',
	'.tiff': 'image/tiff',
	'.woff': 'application/font-woff'
};

/**
 * @param {string} forPath
 */
function getMediaMime(forPath) {
	const ext = path.extname(forPath);

	return mapExtToMediaMimes[ext.toLowerCase()];
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {string} filePath
 */
async function serveFile(req, res, filePath, responseHeaders = Object.create(null)) {
	try {
		const stat = await util.promisify(fs.stat)(filePath);

		// Check if file modified since
		const etag = `W/"${[stat.ino, stat.size, stat.mtime.getTime()].join('-')}"`;
		// weak validator (https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag)
		if (req.headers['if-none-match'] === etag) {
			res.writeHead(304);
			return res.end();
		}

		// Headers
		responseHeaders['Content-Type'] = textMimeType[path.extname(filePath)] || getMediaMime(filePath) || 'text/plain';
		responseHeaders['Etag'] = etag;

		res.writeHead(200, responseHeaders);

		// Data
		fs.createReadStream(filePath).pipe(res);
	} catch (error) {
		console.error(error.toString());
		res.writeHead(404, { 'Content-Type': 'text/plain' });
		return res.end('Not found');
	}
}

if (args.launch !== false) {
	opn(`http://localhost:${PORT}`);
}
