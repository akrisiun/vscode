/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/node/pfs", "fs", "vs/base/common/path"], function (require, exports, pfs_1, fs_1, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function buildTelemetryMessage(appRoot, extensionsPath) {
        const mergedTelemetry = Object.create(null);
        // Simple function to merge the telemetry into one json object
        const mergeTelemetry = (contents, dirName) => {
            const telemetryData = JSON.parse(contents);
            mergedTelemetry[dirName] = telemetryData;
        };
        if (extensionsPath) {
            // Gets all the directories inside the extension directory
            const dirs = pfs_1.readdirSync(extensionsPath).filter(files => {
                // This handles case where broken symbolic links can cause statSync to throw and error
                try {
                    return fs_1.statSync(path_1.join(extensionsPath, files)).isDirectory();
                }
                catch (_a) {
                    return false;
                }
            });
            const telemetryJsonFolders = [];
            dirs.forEach((dir) => {
                const files = pfs_1.readdirSync(path_1.join(extensionsPath, dir)).filter(file => file === 'telemetry.json');
                // We know it contains a telemetry.json file so we add it to the list of folders which have one
                if (files.length === 1) {
                    telemetryJsonFolders.push(dir);
                }
            });
            telemetryJsonFolders.forEach((folder) => {
                const contents = fs_1.readFileSync(path_1.join(extensionsPath, folder, 'telemetry.json')).toString();
                mergeTelemetry(contents, folder);
            });
        }
        let contents = fs_1.readFileSync(path_1.join(appRoot, 'telemetry-core.json')).toString();
        mergeTelemetry(contents, 'vscode-core');
        contents = fs_1.readFileSync(path_1.join(appRoot, 'telemetry-extensions.json')).toString();
        mergeTelemetry(contents, 'vscode-extensions');
        return JSON.stringify(mergedTelemetry, null, 4);
    }
    exports.buildTelemetryMessage = buildTelemetryMessage;
});
//# sourceMappingURL=telemetry.js.map