/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/preferences/browser/keybindingsEditorContribution"], function (require, exports, assert, keybindingsEditorContribution_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('KeybindingsEditorContribution', () => {
        function assertUserSettingsFuzzyEquals(a, b, expected) {
            const actual = keybindingsEditorContribution_1.KeybindingEditorDecorationsRenderer._userSettingsFuzzyEquals(a, b);
            const message = expected ? `${a} == ${b}` : `${a} != ${b}`;
            assert.equal(actual, expected, 'fuzzy: ' + message);
        }
        function assertEqual(a, b) {
            assertUserSettingsFuzzyEquals(a, b, true);
        }
        function assertDifferent(a, b) {
            assertUserSettingsFuzzyEquals(a, b, false);
        }
        test('_userSettingsFuzzyEquals', () => {
            assertEqual('a', 'a');
            assertEqual('a', 'A');
            assertEqual('ctrl+a', 'CTRL+A');
            assertEqual('ctrl+a', ' CTRL+A ');
            assertEqual('ctrl+shift+a', 'shift+ctrl+a');
            assertEqual('ctrl+shift+a ctrl+alt+b', 'shift+ctrl+a alt+ctrl+b');
            assertDifferent('ctrl+[KeyA]', 'ctrl+a');
            // issue #23335
            assertEqual('cmd+shift+p', 'shift+cmd+p');
            assertEqual('cmd+shift+p', 'shift-cmd-p');
        });
    });
});
//# sourceMappingURL=keybindingsEditorContribution.test.js.map