/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/browser/actions", "vs/base/common/actions"], function (require, exports, assert, actionbar_1, actions_1, actions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workbench action registry', () => {
        test('Workbench Action Bar prepareActions()', function () {
            let a1 = new actionbar_1.Separator();
            let a2 = new actionbar_1.Separator();
            let a3 = new actions_2.Action('a3');
            let a4 = new actionbar_1.Separator();
            let a5 = new actionbar_1.Separator();
            let a6 = new actions_2.Action('a6');
            let a7 = new actionbar_1.Separator();
            let actions = actions_1.prepareActions([a1, a2, a3, a4, a5, a6, a7]);
            assert.strictEqual(actions.length, 3); // duplicate separators get removed
            assert(actions[0] === a3);
            assert(actions[1] === a5);
            assert(actions[2] === a6);
        });
    });
});
//# sourceMappingURL=actionRegistry.test.js.map