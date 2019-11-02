/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "os", "fs"], function (require, exports, path, os, fs) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createWaitMarkerFile(verbose) {
        const randomWaitMarkerPath = path.join(os.tmpdir(), Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10));
        try {
            fs.writeFileSync(randomWaitMarkerPath, ''); // use built-in fs to avoid dragging in more dependencies
            if (verbose) {
                console.log(`Marker file for --wait created: ${randomWaitMarkerPath}`);
            }
            return randomWaitMarkerPath;
        }
        catch (err) {
            if (verbose) {
                console.error(`Failed to create marker file for --wait: ${err}`);
            }
            return undefined;
        }
    }
    exports.createWaitMarkerFile = createWaitMarkerFile;
});
//# sourceMappingURL=waitMarkerFile.js.map