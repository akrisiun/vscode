/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/uri", "vs/editor/common/core/range", "vs/editor/browser/editorExtensions", "vs/editor/common/services/modelService", "vs/base/common/cancellation", "vs/editor/common/services/resolverService", "vs/editor/contrib/documentSymbols/outlineModel", "vs/base/common/collections"], function (require, exports, errors_1, uri_1, range_1, editorExtensions_1, modelService_1, cancellation_1, resolverService_1, outlineModel_1, collections_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    async function getDocumentSymbols(document, flat, token) {
        const model = await outlineModel_1.OutlineModel.create(document, token);
        const roots = [];
        for (const child of collections_1.values(model.children)) {
            if (child instanceof outlineModel_1.OutlineElement) {
                roots.push(child.symbol);
            }
            else {
                roots.push(...collections_1.values(child.children).map(child => child.symbol));
            }
        }
        let flatEntries = [];
        if (token.isCancellationRequested) {
            return flatEntries;
        }
        if (flat) {
            flatten(flatEntries, roots, '');
        }
        else {
            flatEntries = roots;
        }
        return flatEntries.sort(compareEntriesUsingStart);
    }
    exports.getDocumentSymbols = getDocumentSymbols;
    function compareEntriesUsingStart(a, b) {
        return range_1.Range.compareRangesUsingStarts(a.range, b.range);
    }
    function flatten(bucket, entries, overrideContainerLabel) {
        for (let entry of entries) {
            bucket.push({
                kind: entry.kind,
                tags: entry.tags,
                name: entry.name,
                detail: entry.detail,
                containerName: entry.containerName || overrideContainerLabel,
                range: entry.range,
                selectionRange: entry.selectionRange,
                children: undefined,
            });
            if (entry.children) {
                flatten(bucket, entry.children, entry.name);
            }
        }
    }
    editorExtensions_1.registerLanguageCommand('_executeDocumentSymbolProvider', function (accessor, args) {
        const { resource } = args;
        if (!(resource instanceof uri_1.URI)) {
            throw errors_1.illegalArgument('resource');
        }
        const model = accessor.get(modelService_1.IModelService).getModel(resource);
        if (model) {
            return getDocumentSymbols(model, false, cancellation_1.CancellationToken.None);
        }
        return accessor.get(resolverService_1.ITextModelService).createModelReference(resource).then(reference => {
            return new Promise((resolve, reject) => {
                try {
                    const result = getDocumentSymbols(reference.object.textEditorModel, false, cancellation_1.CancellationToken.None);
                    resolve(result);
                }
                catch (err) {
                    reject(err);
                }
            }).finally(() => {
                reference.dispose();
            });
        });
    });
});
//# sourceMappingURL=quickOpen.js.map