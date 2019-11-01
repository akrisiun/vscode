/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keyCodes", "vs/base/common/scanCode", "vs/workbench/services/keybinding/common/macLinuxFallbackKeyboardMapper", "vs/workbench/services/keybinding/test/keyboardMapperTestUtils"], function (require, exports, keyCodes_1, scanCode_1, macLinuxFallbackKeyboardMapper_1, keyboardMapperTestUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('keyboardMapper - MAC fallback', () => {
        let mapper = new macLinuxFallbackKeyboardMapper_1.MacLinuxFallbackKeyboardMapper(2 /* Macintosh */);
        function _assertResolveKeybinding(k, expected) {
            keyboardMapperTestUtils_1.assertResolveKeybinding(mapper, keyCodes_1.createKeybinding(k, 2 /* Macintosh */), expected);
        }
        test('resolveKeybinding Cmd+Z', () => {
            _assertResolveKeybinding(2048 /* CtrlCmd */ | 56 /* KEY_Z */, [{
                    label: '⌘Z',
                    ariaLabel: 'Command+Z',
                    electronAccelerator: 'Cmd+Z',
                    userSettingsLabel: 'cmd+z',
                    isWYSIWYG: true,
                    isChord: false,
                    dispatchParts: ['meta+Z'],
                }]);
        });
        test('resolveKeybinding Cmd+K Cmd+=', () => {
            _assertResolveKeybinding(keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 81 /* US_EQUAL */), [{
                    label: '⌘K ⌘=',
                    ariaLabel: 'Command+K Command+=',
                    electronAccelerator: null,
                    userSettingsLabel: 'cmd+k cmd+=',
                    isWYSIWYG: true,
                    isChord: true,
                    dispatchParts: ['meta+K', 'meta+='],
                }]);
        });
        test('resolveKeyboardEvent Cmd+Z', () => {
            keyboardMapperTestUtils_1.assertResolveKeyboardEvent(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: false,
                shiftKey: false,
                altKey: false,
                metaKey: true,
                keyCode: 56 /* KEY_Z */,
                code: null
            }, {
                label: '⌘Z',
                ariaLabel: 'Command+Z',
                electronAccelerator: 'Cmd+Z',
                userSettingsLabel: 'cmd+z',
                isWYSIWYG: true,
                isChord: false,
                dispatchParts: ['meta+Z'],
            });
        });
        test('resolveUserBinding empty', () => {
            keyboardMapperTestUtils_1.assertResolveUserBinding(mapper, [], []);
        });
        test('resolveUserBinding Cmd+[Comma] Cmd+/', () => {
            keyboardMapperTestUtils_1.assertResolveUserBinding(mapper, [
                new scanCode_1.ScanCodeBinding(false, false, false, true, 60 /* Comma */),
                new keyCodes_1.SimpleKeybinding(false, false, false, true, 85 /* US_SLASH */),
            ], [{
                    label: '⌘, ⌘/',
                    ariaLabel: 'Command+, Command+/',
                    electronAccelerator: null,
                    userSettingsLabel: 'cmd+, cmd+/',
                    isWYSIWYG: true,
                    isChord: true,
                    dispatchParts: ['meta+,', 'meta+/'],
                }]);
        });
        test('resolveKeyboardEvent Modifier only Meta+', () => {
            keyboardMapperTestUtils_1.assertResolveKeyboardEvent(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: false,
                shiftKey: false,
                altKey: false,
                metaKey: true,
                keyCode: 57 /* Meta */,
                code: null
            }, {
                label: '⌘',
                ariaLabel: 'Command+',
                electronAccelerator: null,
                userSettingsLabel: 'cmd+',
                isWYSIWYG: true,
                isChord: false,
                dispatchParts: [null],
            });
        });
    });
    suite('keyboardMapper - LINUX fallback', () => {
        let mapper = new macLinuxFallbackKeyboardMapper_1.MacLinuxFallbackKeyboardMapper(3 /* Linux */);
        function _assertResolveKeybinding(k, expected) {
            keyboardMapperTestUtils_1.assertResolveKeybinding(mapper, keyCodes_1.createKeybinding(k, 3 /* Linux */), expected);
        }
        test('resolveKeybinding Ctrl+Z', () => {
            _assertResolveKeybinding(2048 /* CtrlCmd */ | 56 /* KEY_Z */, [{
                    label: 'Ctrl+Z',
                    ariaLabel: 'Control+Z',
                    electronAccelerator: 'Ctrl+Z',
                    userSettingsLabel: 'ctrl+z',
                    isWYSIWYG: true,
                    isChord: false,
                    dispatchParts: ['ctrl+Z'],
                }]);
        });
        test('resolveKeybinding Ctrl+K Ctrl+=', () => {
            _assertResolveKeybinding(keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 81 /* US_EQUAL */), [{
                    label: 'Ctrl+K Ctrl+=',
                    ariaLabel: 'Control+K Control+=',
                    electronAccelerator: null,
                    userSettingsLabel: 'ctrl+k ctrl+=',
                    isWYSIWYG: true,
                    isChord: true,
                    dispatchParts: ['ctrl+K', 'ctrl+='],
                }]);
        });
        test('resolveKeyboardEvent Ctrl+Z', () => {
            keyboardMapperTestUtils_1.assertResolveKeyboardEvent(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: true,
                shiftKey: false,
                altKey: false,
                metaKey: false,
                keyCode: 56 /* KEY_Z */,
                code: null
            }, {
                label: 'Ctrl+Z',
                ariaLabel: 'Control+Z',
                electronAccelerator: 'Ctrl+Z',
                userSettingsLabel: 'ctrl+z',
                isWYSIWYG: true,
                isChord: false,
                dispatchParts: ['ctrl+Z'],
            });
        });
        test('resolveUserBinding Ctrl+[Comma] Ctrl+/', () => {
            keyboardMapperTestUtils_1.assertResolveUserBinding(mapper, [
                new scanCode_1.ScanCodeBinding(true, false, false, false, 60 /* Comma */),
                new keyCodes_1.SimpleKeybinding(true, false, false, false, 85 /* US_SLASH */),
            ], [{
                    label: 'Ctrl+, Ctrl+/',
                    ariaLabel: 'Control+, Control+/',
                    electronAccelerator: null,
                    userSettingsLabel: 'ctrl+, ctrl+/',
                    isWYSIWYG: true,
                    isChord: true,
                    dispatchParts: ['ctrl+,', 'ctrl+/'],
                }]);
        });
        test('resolveUserBinding Ctrl+[Comma]', () => {
            keyboardMapperTestUtils_1.assertResolveUserBinding(mapper, [
                new scanCode_1.ScanCodeBinding(true, false, false, false, 60 /* Comma */),
            ], [{
                    label: 'Ctrl+,',
                    ariaLabel: 'Control+,',
                    electronAccelerator: 'Ctrl+,',
                    userSettingsLabel: 'ctrl+,',
                    isWYSIWYG: true,
                    isChord: false,
                    dispatchParts: ['ctrl+,'],
                }]);
        });
        test('resolveKeyboardEvent Modifier only Ctrl+', () => {
            keyboardMapperTestUtils_1.assertResolveKeyboardEvent(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: true,
                shiftKey: false,
                altKey: false,
                metaKey: false,
                keyCode: 5 /* Ctrl */,
                code: null
            }, {
                label: 'Ctrl+',
                ariaLabel: 'Control+',
                electronAccelerator: null,
                userSettingsLabel: 'ctrl+',
                isWYSIWYG: true,
                isChord: false,
                dispatchParts: [null],
            });
        });
    });
});
//# sourceMappingURL=macLinuxFallbackKeyboardMapper.test.js.map