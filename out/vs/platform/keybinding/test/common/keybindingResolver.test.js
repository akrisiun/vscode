define(["require", "exports", "assert", "vs/base/common/keyCodes", "vs/base/common/platform", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingResolver", "vs/platform/keybinding/common/resolvedKeybindingItem", "vs/platform/keybinding/common/usLayoutResolvedKeybinding"], function (require, exports, assert, keyCodes_1, platform_1, contextkey_1, keybindingResolver_1, resolvedKeybindingItem_1, usLayoutResolvedKeybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createContext(ctx) {
        return {
            getValue: (key) => {
                return ctx[key];
            }
        };
    }
    suite('KeybindingResolver', () => {
        function kbItem(keybinding, command, commandArgs, when, isDefault) {
            const resolvedKeybinding = (keybinding !== 0 ? new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding(keyCodes_1.createKeybinding(keybinding, platform_1.OS), platform_1.OS) : undefined);
            return new resolvedKeybindingItem_1.ResolvedKeybindingItem(resolvedKeybinding, command, commandArgs, when, isDefault);
        }
        function getDispatchStr(runtimeKb) {
            return usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding.getDispatchStr(runtimeKb);
        }
        test('resolve key', function () {
            let keybinding = 2048 /* CtrlCmd */ | 1024 /* Shift */ | 56 /* KEY_Z */;
            let runtimeKeybinding = keyCodes_1.createSimpleKeybinding(keybinding, platform_1.OS);
            let contextRules = contextkey_1.ContextKeyExpr.equals('bar', 'baz');
            let keybindingItem = kbItem(keybinding, 'yes', null, contextRules, true);
            assert.equal(keybindingResolver_1.KeybindingResolver.contextMatchesRules(createContext({ bar: 'baz' }), contextRules), true);
            assert.equal(keybindingResolver_1.KeybindingResolver.contextMatchesRules(createContext({ bar: 'bz' }), contextRules), false);
            let resolver = new keybindingResolver_1.KeybindingResolver([keybindingItem], []);
            assert.equal(resolver.resolve(createContext({ bar: 'baz' }), null, getDispatchStr(runtimeKeybinding)).commandId, 'yes');
            assert.equal(resolver.resolve(createContext({ bar: 'bz' }), null, getDispatchStr(runtimeKeybinding)), null);
        });
        test('resolve key with arguments', function () {
            let commandArgs = { text: 'no' };
            let keybinding = 2048 /* CtrlCmd */ | 1024 /* Shift */ | 56 /* KEY_Z */;
            let runtimeKeybinding = keyCodes_1.createSimpleKeybinding(keybinding, platform_1.OS);
            let contextRules = contextkey_1.ContextKeyExpr.equals('bar', 'baz');
            let keybindingItem = kbItem(keybinding, 'yes', commandArgs, contextRules, true);
            let resolver = new keybindingResolver_1.KeybindingResolver([keybindingItem], []);
            assert.equal(resolver.resolve(createContext({ bar: 'baz' }), null, getDispatchStr(runtimeKeybinding)).commandArgs, commandArgs);
        });
        test('KeybindingResolver.combine simple 1', function () {
            let defaults = [
                kbItem(31 /* KEY_A */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true)
            ];
            let overrides = [
                kbItem(32 /* KEY_B */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), false)
            ];
            let actual = keybindingResolver_1.KeybindingResolver.combine(defaults, overrides);
            assert.deepEqual(actual, [
                kbItem(31 /* KEY_A */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                kbItem(32 /* KEY_B */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), false),
            ]);
        });
        test('KeybindingResolver.combine simple 2', function () {
            let defaults = [
                kbItem(31 /* KEY_A */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                kbItem(32 /* KEY_B */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
            ];
            let overrides = [
                kbItem(33 /* KEY_C */, 'yes3', null, contextkey_1.ContextKeyExpr.equals('3', 'c'), false)
            ];
            let actual = keybindingResolver_1.KeybindingResolver.combine(defaults, overrides);
            assert.deepEqual(actual, [
                kbItem(31 /* KEY_A */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                kbItem(32 /* KEY_B */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true),
                kbItem(33 /* KEY_C */, 'yes3', null, contextkey_1.ContextKeyExpr.equals('3', 'c'), false),
            ]);
        });
        test('KeybindingResolver.combine removal with not matching when', function () {
            let defaults = [
                kbItem(31 /* KEY_A */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                kbItem(32 /* KEY_B */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
            ];
            let overrides = [
                kbItem(31 /* KEY_A */, '-yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'b'), false)
            ];
            let actual = keybindingResolver_1.KeybindingResolver.combine(defaults, overrides);
            assert.deepEqual(actual, [
                kbItem(31 /* KEY_A */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                kbItem(32 /* KEY_B */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
            ]);
        });
        test('KeybindingResolver.combine removal with not matching keybinding', function () {
            let defaults = [
                kbItem(31 /* KEY_A */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                kbItem(32 /* KEY_B */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
            ];
            let overrides = [
                kbItem(32 /* KEY_B */, '-yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), false)
            ];
            let actual = keybindingResolver_1.KeybindingResolver.combine(defaults, overrides);
            assert.deepEqual(actual, [
                kbItem(31 /* KEY_A */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                kbItem(32 /* KEY_B */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
            ]);
        });
        test('KeybindingResolver.combine removal with matching keybinding and when', function () {
            let defaults = [
                kbItem(31 /* KEY_A */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                kbItem(32 /* KEY_B */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
            ];
            let overrides = [
                kbItem(31 /* KEY_A */, '-yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), false)
            ];
            let actual = keybindingResolver_1.KeybindingResolver.combine(defaults, overrides);
            assert.deepEqual(actual, [
                kbItem(32 /* KEY_B */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
            ]);
        });
        test('KeybindingResolver.combine removal with unspecified keybinding', function () {
            let defaults = [
                kbItem(31 /* KEY_A */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                kbItem(32 /* KEY_B */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
            ];
            let overrides = [
                kbItem(0, '-yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), false)
            ];
            let actual = keybindingResolver_1.KeybindingResolver.combine(defaults, overrides);
            assert.deepEqual(actual, [
                kbItem(32 /* KEY_B */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
            ]);
        });
        test('KeybindingResolver.combine removal with unspecified when', function () {
            let defaults = [
                kbItem(31 /* KEY_A */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                kbItem(32 /* KEY_B */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
            ];
            let overrides = [
                kbItem(31 /* KEY_A */, '-yes1', null, null, false)
            ];
            let actual = keybindingResolver_1.KeybindingResolver.combine(defaults, overrides);
            assert.deepEqual(actual, [
                kbItem(32 /* KEY_B */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
            ]);
        });
        test('KeybindingResolver.combine removal with unspecified when and unspecified keybinding', function () {
            let defaults = [
                kbItem(31 /* KEY_A */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                kbItem(32 /* KEY_B */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
            ];
            let overrides = [
                kbItem(0, '-yes1', null, null, false)
            ];
            let actual = keybindingResolver_1.KeybindingResolver.combine(defaults, overrides);
            assert.deepEqual(actual, [
                kbItem(32 /* KEY_B */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
            ]);
        });
        test('issue #612#issuecomment-222109084 cannot remove keybindings for commands with ^', function () {
            let defaults = [
                kbItem(31 /* KEY_A */, '^yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                kbItem(32 /* KEY_B */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
            ];
            let overrides = [
                kbItem(31 /* KEY_A */, '-yes1', null, null, false)
            ];
            let actual = keybindingResolver_1.KeybindingResolver.combine(defaults, overrides);
            assert.deepEqual(actual, [
                kbItem(32 /* KEY_B */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
            ]);
        });
        test('contextIsEntirelyIncluded', () => {
            const assertIsIncluded = (a, b) => {
                assert.equal(keybindingResolver_1.KeybindingResolver.whenIsEntirelyIncluded(contextkey_1.ContextKeyExpr.deserialize(a), contextkey_1.ContextKeyExpr.deserialize(b)), true);
            };
            const assertIsNotIncluded = (a, b) => {
                assert.equal(keybindingResolver_1.KeybindingResolver.whenIsEntirelyIncluded(contextkey_1.ContextKeyExpr.deserialize(a), contextkey_1.ContextKeyExpr.deserialize(b)), false);
            };
            assertIsIncluded('key1', null);
            assertIsIncluded('key1', '');
            assertIsIncluded('key1', 'key1');
            assertIsIncluded('!key1', '');
            assertIsIncluded('!key1', '!key1');
            assertIsIncluded('key2', '');
            assertIsIncluded('key2', 'key2');
            assertIsIncluded('key1 && key1 && key2 && key2', 'key2');
            assertIsIncluded('key1 && key2', 'key2');
            assertIsIncluded('key1 && key2', 'key1');
            assertIsIncluded('key1 && key2', '');
            assertIsIncluded('key1', 'key1 || key2');
            assertIsIncluded('key1 || !key1', 'key2 || !key2');
            assertIsIncluded('key1', 'key1 || key2 && key3');
            assertIsNotIncluded('key1', '!key1');
            assertIsNotIncluded('!key1', 'key1');
            assertIsNotIncluded('key1 && key2', 'key3');
            assertIsNotIncluded('key1 && key2', 'key4');
            assertIsNotIncluded('key1', 'key2');
            assertIsNotIncluded('key1 || key2', 'key2');
            assertIsNotIncluded('', 'key2');
            assertIsNotIncluded(null, 'key2');
        });
        test('resolve command', function () {
            function _kbItem(keybinding, command, when) {
                return kbItem(keybinding, command, null, when, true);
            }
            let items = [
                // This one will never match because its "when" is always overwritten by another one
                _kbItem(54 /* KEY_X */, 'first', contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('key1', true), contextkey_1.ContextKeyExpr.notEquals('key2', false))),
                // This one always overwrites first
                _kbItem(54 /* KEY_X */, 'second', contextkey_1.ContextKeyExpr.equals('key2', true)),
                // This one is a secondary mapping for `second`
                _kbItem(56 /* KEY_Z */, 'second', null),
                // This one sometimes overwrites first
                _kbItem(54 /* KEY_X */, 'third', contextkey_1.ContextKeyExpr.equals('key3', true)),
                // This one is always overwritten by another one
                _kbItem(2048 /* CtrlCmd */ | 55 /* KEY_Y */, 'fourth', contextkey_1.ContextKeyExpr.equals('key4', true)),
                // This one overwrites with a chord the previous one
                _kbItem(keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 55 /* KEY_Y */, 56 /* KEY_Z */), 'fifth', null),
                // This one has no keybinding
                _kbItem(0, 'sixth', null),
                _kbItem(keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 51 /* KEY_U */), 'seventh', null),
                _kbItem(keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 41 /* KEY_K */), 'seventh', null),
                _kbItem(keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 51 /* KEY_U */), 'uncomment lines', null),
                _kbItem(keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 33 /* KEY_C */), 'comment lines', null),
                _kbItem(keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 37 /* KEY_G */, 2048 /* CtrlCmd */ | 33 /* KEY_C */), 'unreachablechord', null),
                _kbItem(2048 /* CtrlCmd */ | 37 /* KEY_G */, 'eleven', null)
            ];
            let resolver = new keybindingResolver_1.KeybindingResolver(items, []);
            let testKey = (commandId, expectedKeys) => {
                // Test lookup
                let lookupResult = resolver.lookupKeybindings(commandId);
                assert.equal(lookupResult.length, expectedKeys.length, 'Length mismatch @ commandId ' + commandId + '; GOT: ' + JSON.stringify(lookupResult, null, '\t'));
                for (let i = 0, len = lookupResult.length; i < len; i++) {
                    const expected = new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding(keyCodes_1.createKeybinding(expectedKeys[i], platform_1.OS), platform_1.OS);
                    assert.equal(lookupResult[i].resolvedKeybinding.getUserSettingsLabel(), expected.getUserSettingsLabel(), 'value mismatch @ commandId ' + commandId);
                }
            };
            let testResolve = (ctx, _expectedKey, commandId) => {
                const expectedKey = keyCodes_1.createKeybinding(_expectedKey, platform_1.OS);
                let previousPart = null;
                for (let i = 0, len = expectedKey.parts.length; i < len; i++) {
                    let part = getDispatchStr(expectedKey.parts[i]);
                    let result = resolver.resolve(ctx, previousPart, part);
                    if (i === len - 1) {
                        // if it's the final part, then we should find a valid command,
                        // and there should not be a chord.
                        assert.ok(result !== null, `Enters chord for ${commandId} at part ${i}`);
                        assert.equal(result.commandId, commandId, `Enters chord for ${commandId} at part ${i}`);
                        assert.equal(result.enterChord, false, `Enters chord for ${commandId} at part ${i}`);
                    }
                    else {
                        // if it's not the final part, then we should not find a valid command,
                        // and there should be a chord.
                        assert.ok(result !== null, `Enters chord for ${commandId} at part ${i}`);
                        assert.equal(result.commandId, null, `Enters chord for ${commandId} at part ${i}`);
                        assert.equal(result.enterChord, true, `Enters chord for ${commandId} at part ${i}`);
                    }
                    previousPart = part;
                }
            };
            testKey('first', []);
            testKey('second', [56 /* KEY_Z */, 54 /* KEY_X */]);
            testResolve(createContext({ key2: true }), 54 /* KEY_X */, 'second');
            testResolve(createContext({}), 56 /* KEY_Z */, 'second');
            testKey('third', [54 /* KEY_X */]);
            testResolve(createContext({ key3: true }), 54 /* KEY_X */, 'third');
            testKey('fourth', []);
            testKey('fifth', [keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 55 /* KEY_Y */, 56 /* KEY_Z */)]);
            testResolve(createContext({}), keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 55 /* KEY_Y */, 56 /* KEY_Z */), 'fifth');
            testKey('seventh', [keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 41 /* KEY_K */)]);
            testResolve(createContext({}), keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 41 /* KEY_K */), 'seventh');
            testKey('uncomment lines', [keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 51 /* KEY_U */)]);
            testResolve(createContext({}), keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 51 /* KEY_U */), 'uncomment lines');
            testKey('comment lines', [keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 33 /* KEY_C */)]);
            testResolve(createContext({}), keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 33 /* KEY_C */), 'comment lines');
            testKey('unreachablechord', []);
            testKey('eleven', [2048 /* CtrlCmd */ | 37 /* KEY_G */]);
            testResolve(createContext({}), 2048 /* CtrlCmd */ | 37 /* KEY_G */, 'eleven');
            testKey('sixth', []);
        });
    });
});
//# sourceMappingURL=keybindingResolver.test.js.map