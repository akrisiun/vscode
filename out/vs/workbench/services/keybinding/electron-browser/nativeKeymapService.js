/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "native-keymap", "vs/base/common/lifecycle", "vs/workbench/services/keybinding/common/keymapInfo", "vs/platform/instantiation/common/extensions", "vs/workbench/services/keybinding/common/keyboardMapper", "vs/base/common/event", "vs/workbench/services/keybinding/common/macLinuxFallbackKeyboardMapper", "vs/base/common/platform", "vs/workbench/services/keybinding/common/windowsKeyboardMapper", "vs/workbench/services/keybinding/common/macLinuxKeyboardMapper"], function (require, exports, nativeKeymap, lifecycle_1, keymapInfo_1, extensions_1, keyboardMapper_1, event_1, macLinuxFallbackKeyboardMapper_1, platform_1, windowsKeyboardMapper_1, macLinuxKeyboardMapper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class KeyboardMapperFactory {
        constructor() {
            this._onDidChangeKeyboardMapper = new event_1.Emitter();
            this.onDidChangeKeyboardMapper = this._onDidChangeKeyboardMapper.event;
            this._layoutInfo = null;
            this._rawMapping = null;
            this._keyboardMapper = null;
            this._initialized = false;
        }
        _onKeyboardLayoutChanged() {
            if (this._initialized) {
                this._setKeyboardData(nativeKeymap.getCurrentKeyboardLayout(), nativeKeymap.getKeyMap());
            }
        }
        getKeyboardMapper(dispatchConfig) {
            if (!this._initialized) {
                this._setKeyboardData(nativeKeymap.getCurrentKeyboardLayout(), nativeKeymap.getKeyMap());
            }
            if (dispatchConfig === 1 /* KeyCode */) {
                // Forcefully set to use keyCode
                return new macLinuxFallbackKeyboardMapper_1.MacLinuxFallbackKeyboardMapper(platform_1.OS);
            }
            return this._keyboardMapper;
        }
        getCurrentKeyboardLayout() {
            if (!this._initialized) {
                this._setKeyboardData(nativeKeymap.getCurrentKeyboardLayout(), nativeKeymap.getKeyMap());
            }
            return this._layoutInfo;
        }
        static _isUSStandard(_kbInfo) {
            if (platform_1.OS === 3 /* Linux */) {
                const kbInfo = _kbInfo;
                return (kbInfo && kbInfo.layout === 'us');
            }
            if (platform_1.OS === 2 /* Macintosh */) {
                const kbInfo = _kbInfo;
                return (kbInfo && kbInfo.id === 'com.apple.keylayout.US');
            }
            if (platform_1.OS === 1 /* Windows */) {
                const kbInfo = _kbInfo;
                return (kbInfo && kbInfo.name === '00000409');
            }
            return false;
        }
        getRawKeyboardMapping() {
            if (!this._initialized) {
                this._setKeyboardData(nativeKeymap.getCurrentKeyboardLayout(), nativeKeymap.getKeyMap());
            }
            return this._rawMapping;
        }
        _setKeyboardData(layoutInfo, rawMapping) {
            this._layoutInfo = layoutInfo;
            if (this._initialized && KeyboardMapperFactory._equals(this._rawMapping, rawMapping)) {
                // nothing to do...
                return;
            }
            this._initialized = true;
            this._rawMapping = rawMapping;
            this._keyboardMapper = new keyboardMapper_1.CachedKeyboardMapper(KeyboardMapperFactory._createKeyboardMapper(this._layoutInfo, this._rawMapping));
            this._onDidChangeKeyboardMapper.fire();
        }
        static _createKeyboardMapper(layoutInfo, rawMapping) {
            const isUSStandard = KeyboardMapperFactory._isUSStandard(layoutInfo);
            if (platform_1.OS === 1 /* Windows */) {
                return new windowsKeyboardMapper_1.WindowsKeyboardMapper(isUSStandard, rawMapping);
            }
            if (Object.keys(rawMapping).length === 0) {
                // Looks like reading the mappings failed (most likely Mac + Japanese/Chinese keyboard layouts)
                return new macLinuxFallbackKeyboardMapper_1.MacLinuxFallbackKeyboardMapper(platform_1.OS);
            }
            if (platform_1.OS === 2 /* Macintosh */) {
                const kbInfo = layoutInfo;
                if (kbInfo.id === 'com.apple.keylayout.DVORAK-QWERTYCMD') {
                    // Use keyCode based dispatching for DVORAK - QWERTY ⌘
                    return new macLinuxFallbackKeyboardMapper_1.MacLinuxFallbackKeyboardMapper(platform_1.OS);
                }
            }
            return new macLinuxKeyboardMapper_1.MacLinuxKeyboardMapper(isUSStandard, rawMapping, platform_1.OS);
        }
        static _equals(a, b) {
            if (platform_1.OS === 1 /* Windows */) {
                return windowsKeyboardMapper_1.windowsKeyboardMappingEquals(a, b);
            }
            return macLinuxKeyboardMapper_1.macLinuxKeyboardMappingEquals(a, b);
        }
    }
    exports.KeyboardMapperFactory = KeyboardMapperFactory;
    KeyboardMapperFactory.INSTANCE = new KeyboardMapperFactory();
    class NativeKeymapService extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onDidChangeKeyboardMapper = new event_1.Emitter();
            this.onDidChangeKeyboardMapper = this._onDidChangeKeyboardMapper.event;
            this._register(KeyboardMapperFactory.INSTANCE.onDidChangeKeyboardMapper(() => {
                this._onDidChangeKeyboardMapper.fire();
            }));
        }
        getKeyboardMapper(dispatchConfig) {
            return KeyboardMapperFactory.INSTANCE.getKeyboardMapper(dispatchConfig);
        }
        getCurrentKeyboardLayout() {
            return KeyboardMapperFactory.INSTANCE.getCurrentKeyboardLayout();
        }
        getAllKeyboardLayouts() {
            return [];
        }
        getRawKeyboardMapping() {
            return KeyboardMapperFactory.INSTANCE.getRawKeyboardMapping();
        }
        validateCurrentKeyboardMapping(keyboardEvent) {
            return;
        }
    }
    extensions_1.registerSingleton(keymapInfo_1.IKeymapService, NativeKeymapService, true);
});
//# sourceMappingURL=nativeKeymapService.js.map