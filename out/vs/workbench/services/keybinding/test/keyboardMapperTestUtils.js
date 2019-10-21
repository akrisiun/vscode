/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/path", "vs/base/common/amd", "vs/base/node/pfs"], function (require, exports, assert, path, amd_1, pfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function toIResolvedKeybinding(kb) {
        return {
            label: kb.getLabel(),
            ariaLabel: kb.getAriaLabel(),
            electronAccelerator: kb.getElectronAccelerator(),
            userSettingsLabel: kb.getUserSettingsLabel(),
            isWYSIWYG: kb.isWYSIWYG(),
            isChord: kb.isChord(),
            dispatchParts: kb.getDispatchParts(),
        };
    }
    function assertResolveKeybinding(mapper, keybinding, expected) {
        let actual = mapper.resolveKeybinding(keybinding).map(toIResolvedKeybinding);
        assert.deepEqual(actual, expected);
    }
    exports.assertResolveKeybinding = assertResolveKeybinding;
    function assertResolveKeyboardEvent(mapper, keyboardEvent, expected) {
        let actual = toIResolvedKeybinding(mapper.resolveKeyboardEvent(keyboardEvent));
        assert.deepEqual(actual, expected);
    }
    exports.assertResolveKeyboardEvent = assertResolveKeyboardEvent;
    function assertResolveUserBinding(mapper, parts, expected) {
        let actual = mapper.resolveUserBinding(parts).map(toIResolvedKeybinding);
        assert.deepEqual(actual, expected);
    }
    exports.assertResolveUserBinding = assertResolveUserBinding;
    function readRawMapping(file) {
        return pfs_1.readFile(amd_1.getPathFromAmdModule(require, `vs/workbench/services/keybinding/test/${file}.js`)).then((buff) => {
            let contents = buff.toString();
            let func = new Function('define', contents);
            let rawMappings = null;
            func(function (value) {
                rawMappings = value;
            });
            return rawMappings;
        });
    }
    exports.readRawMapping = readRawMapping;
    function assertMapping(writeFileIfDifferent, mapper, file) {
        const filePath = path.normalize(amd_1.getPathFromAmdModule(require, `vs/workbench/services/keybinding/test/${file}`));
        return pfs_1.readFile(filePath).then((buff) => {
            let expected = buff.toString();
            const actual = mapper.dumpDebugInfo();
            if (actual !== expected && writeFileIfDifferent) {
                const destPath = filePath.replace(/vscode[\/\\]out[\/\\]vs/, 'vscode/src/vs');
                pfs_1.writeFile(destPath, actual);
            }
            assert.deepEqual(actual.split(/\r\n|\n/), expected.split(/\r\n|\n/));
        });
    }
    exports.assertMapping = assertMapping;
});
//# sourceMappingURL=keyboardMapperTestUtils.js.map