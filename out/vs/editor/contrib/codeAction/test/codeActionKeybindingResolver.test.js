/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/keyCodes", "vs/editor/contrib/codeAction/codeAction", "vs/editor/contrib/codeAction/types", "vs/editor/contrib/codeAction/codeActionMenu", "vs/platform/keybinding/common/resolvedKeybindingItem", "vs/platform/keybinding/common/usLayoutResolvedKeybinding"], function (require, exports, assert, keyCodes_1, codeAction_1, types_1, codeActionMenu_1, resolvedKeybindingItem_1, usLayoutResolvedKeybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('CodeActionKeybindingResolver', () => {
        const refactorKeybinding = createCodeActionKeybinding(31 /* KEY_A */, codeAction_1.refactorCommandId, { kind: types_1.CodeActionKind.Refactor.value });
        const refactorExtractKeybinding = createCodeActionKeybinding(32 /* KEY_B */, codeAction_1.refactorCommandId, { kind: types_1.CodeActionKind.Refactor.append('extract').value });
        const organizeImportsKeybinding = createCodeActionKeybinding(33 /* KEY_C */, codeAction_1.organizeImportsCommandId, undefined);
        test('Should match refactor keybindings', async function () {
            const resolver = new codeActionMenu_1.CodeActionKeybindingResolver({
                getKeybindings: () => {
                    return [refactorKeybinding];
                },
            }).getResolver();
            assert.equal(resolver({ title: '' }), undefined);
            assert.equal(resolver({ title: '', kind: types_1.CodeActionKind.Refactor.value }), refactorKeybinding.resolvedKeybinding);
            assert.equal(resolver({ title: '', kind: types_1.CodeActionKind.Refactor.append('extract').value }), refactorKeybinding.resolvedKeybinding);
            assert.equal(resolver({ title: '', kind: types_1.CodeActionKind.QuickFix.value }), undefined);
        });
        test('Should prefer most specific keybinding', async function () {
            const resolver = new codeActionMenu_1.CodeActionKeybindingResolver({
                getKeybindings: () => {
                    return [refactorKeybinding, refactorExtractKeybinding, organizeImportsKeybinding];
                },
            }).getResolver();
            assert.equal(resolver({ title: '', kind: types_1.CodeActionKind.Refactor.value }), refactorKeybinding.resolvedKeybinding);
            assert.equal(resolver({ title: '', kind: types_1.CodeActionKind.Refactor.append('extract').value }), refactorExtractKeybinding.resolvedKeybinding);
        });
        test('Organize imports should still return a keybinding even though it does not have args', async function () {
            const resolver = new codeActionMenu_1.CodeActionKeybindingResolver({
                getKeybindings: () => {
                    return [refactorKeybinding, refactorExtractKeybinding, organizeImportsKeybinding];
                },
            }).getResolver();
            assert.equal(resolver({ title: '', kind: types_1.CodeActionKind.SourceOrganizeImports.value }), organizeImportsKeybinding.resolvedKeybinding);
        });
    });
    function createCodeActionKeybinding(keycode, command, commandArgs) {
        return new resolvedKeybindingItem_1.ResolvedKeybindingItem(new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding(new keyCodes_1.ChordKeybinding([new keyCodes_1.SimpleKeybinding(false, true, false, false, keycode)]), 3 /* Linux */), command, commandArgs, undefined, false);
    }
});
//# sourceMappingURL=codeActionKeybindingResolver.test.js.map