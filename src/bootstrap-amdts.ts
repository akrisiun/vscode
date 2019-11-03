/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// @ - no ts-check
'use strict';

import loader from './vs/loader';
import bootstrap from './bootstrap';

// Bootstrap: NLS
const nlsConfig = bootstrap.setupNLS();

// Bootstrap: Loader
loader.config({
	baseUrl: bootstrap.uriFromPath(__dirname),
	catchError: true,
	nodeRequire: require,
	nodeMain: __filename,
	'vs/nls': nlsConfig
});

// Running in Electron
if (process.env['ELECTRON_RUN_AS_NODE'] || process.versions['electron']) {
	loader.define('fs', ['original-fs'], function (originalFS) {
		return originalFS;  // replace the patched electron fs with the original node fs for all AMD code
	});
}

// Pseudo NLS support
if (nlsConfig.pseudo) {
	loader(['vs/nls'], function (nlsPlugin) {
		nlsPlugin.setPseudoTranslation(nlsConfig.pseudo);
	});
}

export class Amd {
// exports.load =
   public load(entrypoint: string, onLoad?: any, onError?: any): any {
		if (!entrypoint) {
			return null;
		}

		// cached data config
		if (process.env['VSCODE_NODE_CACHED_DATA_DIR']) {
			loader.config({
				nodeCachedData: {
					path: process.env['VSCODE_NODE_CACHED_DATA_DIR'],
					seed: entrypoint
				}
			});
		}

		onLoad = onLoad || function () { };
		onError = onError || function (err) { console.error(err); };

		return loader([entrypoint], onLoad, onError);
	}
}