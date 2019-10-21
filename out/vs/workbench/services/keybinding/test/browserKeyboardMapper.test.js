define(["require", "exports", "assert", "vs/workbench/services/keybinding/browser/keyboardLayouts/_.contribution", "../browser/keymapService", "../common/keymapInfo", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/notification/common/notification", "vs/platform/commands/common/commands", "vs/platform/storage/common/storage", "vs/workbench/test/workbenchTestServices", "vs/platform/notification/test/common/testNotificationService", "vs/workbench/services/keybinding/browser/keyboardLayouts/en.darwin", "vs/workbench/services/keybinding/browser/keyboardLayouts/de.darwin"], function (require, exports, assert, __contribution_1, keymapService_1, keymapInfo_1, instantiationServiceMock_1, notification_1, commands_1, storage_1, workbenchTestServices_1, testNotificationService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestKeyboardMapperFactory extends keymapService_1.BrowserKeyboardMapperFactoryBase {
        constructor(notificationService, storageService, commandService) {
            // super(notificationService, storageService, commandService);
            super();
            const keymapInfos = __contribution_1.KeyboardLayoutContribution.INSTANCE.layoutInfos;
            this._keymapInfos.push(...keymapInfos.map(info => (new keymapInfo_1.KeymapInfo(info.layout, info.secondaryLayouts, info.mapping, info.isUserKeyboardLayout))));
            this._mru = this._keymapInfos;
            this._initialized = true;
            this.onKeyboardLayoutChanged();
            const usLayout = this.getUSStandardLayout();
            if (usLayout) {
                this.setActiveKeyMapping(usLayout.mapping);
            }
        }
    }
    suite('keyboard layout loader', () => {
        let instantiationService = new instantiationServiceMock_1.TestInstantiationService();
        let notitifcationService = instantiationService.stub(notification_1.INotificationService, new testNotificationService_1.TestNotificationService());
        let storageService = instantiationService.stub(storage_1.IStorageService, new workbenchTestServices_1.TestStorageService());
        let commandService = instantiationService.stub(commands_1.ICommandService, {});
        let instance = new TestKeyboardMapperFactory(notitifcationService, storageService, commandService);
        test('load default US keyboard layout', () => {
            assert.notEqual(instance.activeKeyboardLayout, null);
        });
        test('isKeyMappingActive', () => {
            instance.setUSKeyboardLayout();
            assert.equal(instance.isKeyMappingActive({
                KeyA: {
                    value: 'a',
                    valueIsDeadKey: false,
                    withShift: 'A',
                    withShiftIsDeadKey: false,
                    withAltGr: 'å',
                    withAltGrIsDeadKey: false,
                    withShiftAltGr: 'Å',
                    withShiftAltGrIsDeadKey: false
                }
            }), true);
            assert.equal(instance.isKeyMappingActive({
                KeyA: {
                    value: 'a',
                    valueIsDeadKey: false,
                    withShift: 'A',
                    withShiftIsDeadKey: false,
                    withAltGr: 'å',
                    withAltGrIsDeadKey: false,
                    withShiftAltGr: 'Å',
                    withShiftAltGrIsDeadKey: false
                },
                KeyZ: {
                    value: 'z',
                    valueIsDeadKey: false,
                    withShift: 'Z',
                    withShiftIsDeadKey: false,
                    withAltGr: 'Ω',
                    withAltGrIsDeadKey: false,
                    withShiftAltGr: '¸',
                    withShiftAltGrIsDeadKey: false
                }
            }), true);
            assert.equal(instance.isKeyMappingActive({
                KeyZ: {
                    value: 'y',
                    valueIsDeadKey: false,
                    withShift: 'Y',
                    withShiftIsDeadKey: false,
                    withAltGr: '¥',
                    withAltGrIsDeadKey: false,
                    withShiftAltGr: 'Ÿ',
                    withShiftAltGrIsDeadKey: false
                },
            }), false);
        });
        test('Switch keymapping', () => {
            instance.setActiveKeyMapping({
                KeyZ: {
                    value: 'y',
                    valueIsDeadKey: false,
                    withShift: 'Y',
                    withShiftIsDeadKey: false,
                    withAltGr: '¥',
                    withAltGrIsDeadKey: false,
                    withShiftAltGr: 'Ÿ',
                    withShiftAltGrIsDeadKey: false
                }
            });
            assert.equal(!!instance.activeKeyboardLayout.isUSStandard, false);
            assert.equal(instance.isKeyMappingActive({
                KeyZ: {
                    value: 'y',
                    valueIsDeadKey: false,
                    withShift: 'Y',
                    withShiftIsDeadKey: false,
                    withAltGr: '¥',
                    withAltGrIsDeadKey: false,
                    withShiftAltGr: 'Ÿ',
                    withShiftAltGrIsDeadKey: false
                },
            }), true);
            instance.setUSKeyboardLayout();
            assert.equal(instance.activeKeyboardLayout.isUSStandard, true);
        });
        test('Switch keyboard layout info', () => {
            instance.setKeyboardLayout('com.apple.keylayout.German');
            assert.equal(!!instance.activeKeyboardLayout.isUSStandard, false);
            assert.equal(instance.isKeyMappingActive({
                KeyZ: {
                    value: 'y',
                    valueIsDeadKey: false,
                    withShift: 'Y',
                    withShiftIsDeadKey: false,
                    withAltGr: '¥',
                    withAltGrIsDeadKey: false,
                    withShiftAltGr: 'Ÿ',
                    withShiftAltGrIsDeadKey: false
                },
            }), true);
            instance.setUSKeyboardLayout();
            assert.equal(instance.activeKeyboardLayout.isUSStandard, true);
        });
    });
});
//# sourceMappingURL=browserKeyboardMapper.test.js.map