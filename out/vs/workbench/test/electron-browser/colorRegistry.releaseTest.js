/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/platform/theme/common/colorRegistry", "vs/platform/request/common/request", "vs/base/node/pfs", "vs/base/common/path", "assert", "vs/base/common/amd", "vs/base/common/cancellation", "vs/platform/request/node/requestService", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/log/common/log", "vs/workbench/workbench.desktop.main"], function (require, exports, platform_1, colorRegistry_1, request_1, pfs, path, assert, amd_1, cancellation_1, requestService_1, testConfigurationService_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.experimental = []; // 'settings.modifiedItemForeground', 'editorUnnecessary.foreground' ];
    suite('Color Registry', function () {
        test('all colors documented in theme-color.md', async function () {
            const reqContext = await new requestService_1.RequestService(new testConfigurationService_1.TestConfigurationService(), new log_1.NullLogService()).request({ url: 'https://raw.githubusercontent.com/microsoft/vscode-docs/vnext/api/references/theme-color.md' }, cancellation_1.CancellationToken.None);
            const content = (await request_1.asText(reqContext));
            const expression = /\-\s*\`([\w\.]+)\`: (.*)/g;
            let m;
            let colorsInDoc = Object.create(null);
            let nColorsInDoc = 0;
            while (m = expression.exec(content)) {
                colorsInDoc[m[1]] = { description: m[2], offset: m.index, length: m.length };
                nColorsInDoc++;
            }
            assert.ok(nColorsInDoc > 0, 'theme-color.md contains to color descriptions');
            let missing = Object.create(null);
            let descriptionDiffs = Object.create(null);
            let themingRegistry = platform_1.Registry.as(colorRegistry_1.Extensions.ColorContribution);
            for (let color of themingRegistry.getColors()) {
                if (!colorsInDoc[color.id]) {
                    if (!color.deprecationMessage) {
                        missing[color.id] = getDescription(color);
                    }
                }
                else {
                    let docDescription = colorsInDoc[color.id].description;
                    let specDescription = getDescription(color);
                    if (docDescription !== specDescription) {
                        descriptionDiffs[color.id] = { docDescription, specDescription };
                    }
                    delete colorsInDoc[color.id];
                }
            }
            let colorsInExtensions = await getColorsFromExtension();
            for (let colorId in colorsInExtensions) {
                if (!colorsInDoc[colorId]) {
                    missing[colorId] = colorsInExtensions[colorId];
                }
                else {
                    delete colorsInDoc[colorId];
                }
            }
            for (let colorId of exports.experimental) {
                if (missing[colorId]) {
                    delete missing[colorId];
                }
                if (colorsInDoc[colorId]) {
                    assert.fail(`Color ${colorId} found in doc but marked experimental. Please remove from experimental list.`);
                }
            }
            let undocumentedKeys = Object.keys(missing).map(k => `\`${k}\`: ${missing[k]}`);
            assert.deepEqual(undocumentedKeys, [], 'Undocumented colors ids');
            let superfluousKeys = Object.keys(colorsInDoc);
            assert.deepEqual(superfluousKeys, [], 'Colors ids in doc that do not exist');
        });
    });
    function getDescription(color) {
        let specDescription = color.description;
        if (color.deprecationMessage) {
            specDescription = specDescription + ' ' + color.deprecationMessage;
        }
        return specDescription;
    }
    async function getColorsFromExtension() {
        let extPath = amd_1.getPathFromAmdModule(require, '../../../../../extensions');
        let extFolders = await pfs.readDirsInDir(extPath);
        let result = Object.create(null);
        for (let folder of extFolders) {
            try {
                let packageJSON = JSON.parse((await pfs.readFile(path.join(extPath, folder, 'package.json'))).toString());
                let contributes = packageJSON['contributes'];
                if (contributes) {
                    let colors = contributes['colors'];
                    if (colors) {
                        for (let color of colors) {
                            let colorId = color['id'];
                            if (colorId) {
                                result[colorId] = colorId['description'];
                            }
                        }
                    }
                }
            }
            catch (e) {
                // ignore
            }
        }
        return result;
    }
});
//# sourceMappingURL=colorRegistry.releaseTest.js.map