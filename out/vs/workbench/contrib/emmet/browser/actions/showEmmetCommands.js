/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/editor/browser/editorExtensions", "vs/platform/quickOpen/common/quickOpen", "vs/editor/common/editorContextKeys"], function (require, exports, nls, editorExtensions_1, quickOpen_1, editorContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const EMMET_COMMANDS_PREFIX = '>Emmet: ';
    class ShowEmmetCommandsAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'workbench.action.showEmmetCommands',
                label: nls.localize('showEmmetCommands', "Show Emmet Commands"),
                alias: 'Show Emmet Commands',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                menubarOpts: {
                    menuId: 14 /* MenubarEditMenu */,
                    group: '5_insert',
                    title: nls.localize({ key: 'miShowEmmetCommands', comment: ['&& denotes a mnemonic'] }, "E&&mmet..."),
                    order: 4
                }
            });
        }
        run(accessor, editor) {
            const quickOpenService = accessor.get(quickOpen_1.IQuickOpenService);
            quickOpenService.show(EMMET_COMMANDS_PREFIX);
            return Promise.resolve(undefined);
        }
    }
    editorExtensions_1.registerEditorAction(ShowEmmetCommandsAction);
});
//# sourceMappingURL=showEmmetCommands.js.map