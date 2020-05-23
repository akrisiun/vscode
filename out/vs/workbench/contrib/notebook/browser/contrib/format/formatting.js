/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/nls", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/contrib/coreActions", "vs/workbench/services/editor/common/editorService", "vs/editor/common/services/resolverService", "vs/base/common/lifecycle", "vs/editor/contrib/format/format", "vs/editor/common/services/editorWorkerService", "vs/base/common/cancellation", "vs/editor/browser/services/bulkEditService", "vs/editor/common/editorContextKeys"], function (require, exports, actions_1, contextkey_1, nls_1, notebookBrowser_1, coreActions_1, editorService_1, resolverService_1, lifecycle_1, format_1, editorWorkerService_1, cancellation_1, bulkEditService_1, editorContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.format',
                title: nls_1.localize('format.title', 'Format Notebook'),
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                precondition: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_IS_ACTIVE_EDITOR),
                keybinding: {
                    when: editorContextKeys_1.EditorContextKeys.editorTextFocus.toNegated(),
                    primary: 1024 /* Shift */ | 512 /* Alt */ | 36 /* KEY_F */,
                    linux: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 39 /* KEY_I */ },
                    weight: 200 /* WorkbenchContrib */
                },
                f1: true
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const textModelService = accessor.get(resolverService_1.ITextModelService);
            const editorWorkerService = accessor.get(editorWorkerService_1.IEditorWorkerService);
            const bulkEditService = accessor.get(bulkEditService_1.IBulkEditService);
            const editor = coreActions_1.getActiveNotebookEditor(editorService);
            if (!editor || !editor.viewModel) {
                return;
            }
            const notebook = editor.viewModel.notebookDocument;
            const dispoables = new lifecycle_1.DisposableStore();
            try {
                const edits = [];
                for (let cell of notebook.cells) {
                    const ref = await textModelService.createModelReference(cell.uri);
                    dispoables.add(ref);
                    const model = ref.object.textEditorModel;
                    const formatEdits = await format_1.getDocumentFormattingEditsUntilResult(editorWorkerService, model, model.getOptions(), cancellation_1.CancellationToken.None);
                    if (formatEdits) {
                        formatEdits.forEach(edit => edits.push({
                            edit,
                            resource: model.uri,
                            modelVersionId: model.getVersionId()
                        }));
                    }
                }
                await bulkEditService.apply({ edits }, { label: nls_1.localize('label', "Format Notebook") });
            }
            finally {
                dispoables.dispose();
            }
        }
    });
});
//# sourceMappingURL=formatting.js.map