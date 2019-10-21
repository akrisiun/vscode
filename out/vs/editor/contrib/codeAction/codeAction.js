/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/uri", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/modes", "vs/editor/common/services/modelService", "./codeActionTrigger", "vs/editor/browser/core/editorState", "vs/base/common/lifecycle"], function (require, exports, arrays_1, cancellation_1, errors_1, uri_1, editorExtensions_1, range_1, selection_1, modes_1, modelService_1, codeActionTrigger_1, editorState_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ManagedCodeActionSet extends lifecycle_1.Disposable {
        constructor(actions, disposables) {
            super();
            this._register(disposables);
            this.actions = arrays_1.mergeSort([...actions], ManagedCodeActionSet.codeActionsComparator);
        }
        static codeActionsComparator(a, b) {
            if (arrays_1.isNonEmptyArray(a.diagnostics)) {
                if (arrays_1.isNonEmptyArray(b.diagnostics)) {
                    return a.diagnostics[0].message.localeCompare(b.diagnostics[0].message);
                }
                else {
                    return -1;
                }
            }
            else if (arrays_1.isNonEmptyArray(b.diagnostics)) {
                return 1;
            }
            else {
                return 0; // both have no diagnostics
            }
        }
        get hasAutoFix() {
            return this.actions.some(fix => !!fix.kind && codeActionTrigger_1.CodeActionKind.QuickFix.contains(new codeActionTrigger_1.CodeActionKind(fix.kind)) && !!fix.isPreferred);
        }
    }
    function getCodeActions(model, rangeOrSelection, trigger, token) {
        const filter = trigger.filter || {};
        const codeActionContext = {
            only: filter.kind ? filter.kind.value : undefined,
            trigger: trigger.type === 'manual' ? 2 /* Manual */ : 1 /* Automatic */
        };
        const cts = new editorState_1.TextModelCancellationTokenSource(model, token);
        const providers = getCodeActionProviders(model, filter);
        const disposables = new lifecycle_1.DisposableStore();
        const promises = providers.map(provider => {
            return Promise.resolve(provider.provideCodeActions(model, rangeOrSelection, codeActionContext, cts.token)).then(providedCodeActions => {
                if (cts.token.isCancellationRequested || !providedCodeActions) {
                    return [];
                }
                disposables.add(providedCodeActions);
                return providedCodeActions.actions.filter(action => action && codeActionTrigger_1.filtersAction(filter, action));
            }, (err) => {
                if (errors_1.isPromiseCanceledError(err)) {
                    throw err;
                }
                errors_1.onUnexpectedExternalError(err);
                return [];
            });
        });
        const listener = modes_1.CodeActionProviderRegistry.onDidChange(() => {
            const newProviders = modes_1.CodeActionProviderRegistry.all(model);
            if (!arrays_1.equals(newProviders, providers)) {
                cts.cancel();
            }
        });
        return Promise.all(promises)
            .then(arrays_1.flatten)
            .then(actions => new ManagedCodeActionSet(actions, disposables))
            .finally(() => {
            listener.dispose();
            cts.dispose();
        });
    }
    exports.getCodeActions = getCodeActions;
    function getCodeActionProviders(model, filter) {
        return modes_1.CodeActionProviderRegistry.all(model)
            // Don't include providers that we know will not return code actions of interest
            .filter(provider => {
            if (!provider.providedCodeActionKinds) {
                // We don't know what type of actions this provider will return.
                return true;
            }
            return provider.providedCodeActionKinds.some(kind => codeActionTrigger_1.mayIncludeActionsOfKind(filter, new codeActionTrigger_1.CodeActionKind(kind)));
        });
    }
    editorExtensions_1.registerLanguageCommand('_executeCodeActionProvider', async function (accessor, args) {
        const { resource, rangeOrSelection, kind } = args;
        if (!(resource instanceof uri_1.URI)) {
            throw errors_1.illegalArgument();
        }
        const model = accessor.get(modelService_1.IModelService).getModel(resource);
        if (!model) {
            throw errors_1.illegalArgument();
        }
        const validatedRangeOrSelection = selection_1.Selection.isISelection(rangeOrSelection)
            ? selection_1.Selection.liftSelection(rangeOrSelection)
            : range_1.Range.isIRange(rangeOrSelection)
                ? model.validateRange(rangeOrSelection)
                : undefined;
        if (!validatedRangeOrSelection) {
            throw errors_1.illegalArgument();
        }
        const codeActionSet = await getCodeActions(model, validatedRangeOrSelection, { type: 'manual', filter: { includeSourceActions: true, kind: kind && kind.value ? new codeActionTrigger_1.CodeActionKind(kind.value) : undefined } }, cancellation_1.CancellationToken.None);
        setTimeout(() => codeActionSet.dispose(), 100);
        return codeActionSet.actions;
    });
});
//# sourceMappingURL=codeAction.js.map