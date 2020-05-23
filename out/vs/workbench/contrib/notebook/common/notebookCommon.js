/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/glob", "vs/base/common/platform", "vs/base/common/uri", "vs/platform/contextkey/common/contextkey"], function (require, exports, glob, platform_1, uri_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NOTEBOOK_EDITOR_CURSOR_BOUNDARY = exports.diff = exports.sortMimeTypes = exports.mimeTypeSupportedByCore = exports.CellUri = exports.CellEditType = exports.NotebookCellsChangeType = exports.MimeTypeRendererResolver = exports.NotebookCellRunState = exports.notebookDocumentMetadataDefaults = exports.ACCESSIBLE_NOTEBOOK_DISPLAY_ORDER = exports.NOTEBOOK_DISPLAY_ORDER = exports.CellOutputKind = exports.CellKind = void 0;
    var CellKind;
    (function (CellKind) {
        CellKind[CellKind["Markdown"] = 1] = "Markdown";
        CellKind[CellKind["Code"] = 2] = "Code";
    })(CellKind = exports.CellKind || (exports.CellKind = {}));
    var CellOutputKind;
    (function (CellOutputKind) {
        CellOutputKind[CellOutputKind["Text"] = 1] = "Text";
        CellOutputKind[CellOutputKind["Error"] = 2] = "Error";
        CellOutputKind[CellOutputKind["Rich"] = 3] = "Rich";
    })(CellOutputKind = exports.CellOutputKind || (exports.CellOutputKind = {}));
    exports.NOTEBOOK_DISPLAY_ORDER = [
        'application/json',
        'application/javascript',
        'text/html',
        'image/svg+xml',
        'text/markdown',
        'image/png',
        'image/jpeg',
        'text/plain'
    ];
    exports.ACCESSIBLE_NOTEBOOK_DISPLAY_ORDER = [
        'text/markdown',
        'application/json',
        'text/plain',
        'text/html',
        'image/svg+xml',
        'image/png',
        'image/jpeg',
    ];
    exports.notebookDocumentMetadataDefaults = {
        editable: true,
        runnable: true,
        cellEditable: true,
        cellRunnable: true,
        hasExecutionOrder: true
    };
    var NotebookCellRunState;
    (function (NotebookCellRunState) {
        NotebookCellRunState[NotebookCellRunState["Running"] = 1] = "Running";
        NotebookCellRunState[NotebookCellRunState["Idle"] = 2] = "Idle";
        NotebookCellRunState[NotebookCellRunState["Success"] = 3] = "Success";
        NotebookCellRunState[NotebookCellRunState["Error"] = 4] = "Error";
    })(NotebookCellRunState = exports.NotebookCellRunState || (exports.NotebookCellRunState = {}));
    var MimeTypeRendererResolver;
    (function (MimeTypeRendererResolver) {
        MimeTypeRendererResolver[MimeTypeRendererResolver["Core"] = 0] = "Core";
        MimeTypeRendererResolver[MimeTypeRendererResolver["Active"] = 1] = "Active";
        MimeTypeRendererResolver[MimeTypeRendererResolver["Lazy"] = 2] = "Lazy";
    })(MimeTypeRendererResolver = exports.MimeTypeRendererResolver || (exports.MimeTypeRendererResolver = {}));
    var NotebookCellsChangeType;
    (function (NotebookCellsChangeType) {
        NotebookCellsChangeType[NotebookCellsChangeType["ModelChange"] = 1] = "ModelChange";
        NotebookCellsChangeType[NotebookCellsChangeType["Move"] = 2] = "Move";
        NotebookCellsChangeType[NotebookCellsChangeType["CellClearOutput"] = 3] = "CellClearOutput";
        NotebookCellsChangeType[NotebookCellsChangeType["CellsClearOutput"] = 4] = "CellsClearOutput";
        NotebookCellsChangeType[NotebookCellsChangeType["ChangeLanguage"] = 5] = "ChangeLanguage";
    })(NotebookCellsChangeType = exports.NotebookCellsChangeType || (exports.NotebookCellsChangeType = {}));
    var CellEditType;
    (function (CellEditType) {
        CellEditType[CellEditType["Insert"] = 1] = "Insert";
        CellEditType[CellEditType["Delete"] = 2] = "Delete";
    })(CellEditType = exports.CellEditType || (exports.CellEditType = {}));
    var CellUri;
    (function (CellUri) {
        CellUri.scheme = 'vscode-notebook';
        function generate(notebook, handle) {
            return notebook.with({
                path: `${notebook.path}, cell ${handle + 1}`,
                query: JSON.stringify({ cell: handle, notebook: notebook.toString() }),
                scheme: CellUri.scheme,
            });
        }
        CellUri.generate = generate;
        function parse(cell) {
            if (cell.scheme !== CellUri.scheme) {
                return undefined;
            }
            try {
                const data = JSON.parse(cell.query);
                return {
                    handle: data.cell,
                    notebook: uri_1.URI.parse(data.notebook)
                };
            }
            catch (_a) {
                return undefined;
            }
        }
        CellUri.parse = parse;
        function equal(a, b) {
            return a.path === b.path && a.query === b.query && a.scheme === b.scheme;
        }
        CellUri.equal = equal;
    })(CellUri = exports.CellUri || (exports.CellUri = {}));
    function mimeTypeSupportedByCore(mimeType) {
        if ([
            'application/json',
            'application/javascript',
            'text/html',
            'image/svg+xml',
            'text/markdown',
            'image/png',
            'image/jpeg',
            'text/plain',
            'text/x-javascript'
        ].indexOf(mimeType) > -1) {
            return true;
        }
        return false;
    }
    exports.mimeTypeSupportedByCore = mimeTypeSupportedByCore;
    // if (isWindows) {
    // 	value = value.replace(/\//g, '\\');
    // }
    function matchGlobUniversal(pattern, path) {
        if (platform_1.isWindows) {
            pattern = pattern.replace(/\//g, '\\');
            path = path.replace(/\//g, '\\');
        }
        return glob.match(pattern, path);
    }
    function getMimeTypeOrder(mimeType, userDisplayOrder, documentDisplayOrder, defaultOrder) {
        let order = 0;
        for (let i = 0; i < userDisplayOrder.length; i++) {
            if (matchGlobUniversal(userDisplayOrder[i], mimeType)) {
                return order;
            }
            order++;
        }
        for (let i = 0; i < documentDisplayOrder.length; i++) {
            if (matchGlobUniversal(documentDisplayOrder[i], mimeType)) {
                return order;
            }
            order++;
        }
        for (let i = 0; i < defaultOrder.length; i++) {
            if (matchGlobUniversal(defaultOrder[i], mimeType)) {
                return order;
            }
            order++;
        }
        return order;
    }
    function sortMimeTypes(mimeTypes, userDisplayOrder, documentDisplayOrder, defaultOrder) {
        const sorted = mimeTypes.sort((a, b) => {
            return getMimeTypeOrder(a, userDisplayOrder, documentDisplayOrder, defaultOrder) - getMimeTypeOrder(b, userDisplayOrder, documentDisplayOrder, defaultOrder);
        });
        return sorted;
    }
    exports.sortMimeTypes = sortMimeTypes;
    function diff(before, after, contains) {
        const result = [];
        function pushSplice(start, deleteCount, toInsert) {
            if (deleteCount === 0 && toInsert.length === 0) {
                return;
            }
            const latest = result[result.length - 1];
            if (latest && latest.start + latest.deleteCount === start) {
                latest.deleteCount += deleteCount;
                latest.toInsert.push(...toInsert);
            }
            else {
                result.push({ start, deleteCount, toInsert });
            }
        }
        let beforeIdx = 0;
        let afterIdx = 0;
        while (true) {
            if (beforeIdx === before.length) {
                pushSplice(beforeIdx, 0, after.slice(afterIdx));
                break;
            }
            if (afterIdx === after.length) {
                pushSplice(beforeIdx, before.length - beforeIdx, []);
                break;
            }
            const beforeElement = before[beforeIdx];
            const afterElement = after[afterIdx];
            if (beforeElement === afterElement) {
                // equal
                beforeIdx += 1;
                afterIdx += 1;
                continue;
            }
            if (contains(afterElement)) {
                // `afterElement` exists before, which means some elements before `afterElement` are deleted
                pushSplice(beforeIdx, 1, []);
                beforeIdx += 1;
            }
            else {
                // `afterElement` added
                pushSplice(beforeIdx, 0, [afterElement]);
                afterIdx += 1;
            }
        }
        return result;
    }
    exports.diff = diff;
    exports.NOTEBOOK_EDITOR_CURSOR_BOUNDARY = new contextkey_1.RawContextKey('notebookEditorCursorAtBoundary', 'none');
});
//# sourceMappingURL=notebookCommon.js.map