/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/notebook/common/notebookCommon", "./extHostTypes", "vs/workbench/api/common/extHostDocumentData", "vs/base/common/types"], function (require, exports, errors_1, event_1, lifecycle_1, uri_1, extHost_protocol_1, notebookCommon_1, extHostTypes_1, extHostDocumentData_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostNotebookController = exports.ExtHostNotebookOutputRenderer = exports.ExtHostNotebookEditor = exports.NotebookEditorCellEdit = exports.ExtHostNotebookDocument = exports.ExtHostCell = void 0;
    function getObservable(obj) {
        const onDidChange = new event_1.Emitter();
        const proxy = new Proxy(obj, {
            set(target, p, value, _receiver) {
                target[p] = value;
                onDidChange.fire();
                return true;
            }
        });
        return {
            proxy,
            onDidChange: onDidChange.event
        };
    }
    class ExtHostCell extends lifecycle_1.Disposable {
        constructor(viewType, documentUri, handle, uri, content, cellKind, language, outputs, _metadata, _proxy) {
            super();
            this.viewType = viewType;
            this.documentUri = documentUri;
            this.handle = handle;
            this.uri = uri;
            this.cellKind = cellKind;
            this.language = language;
            this._proxy = _proxy;
            this._onDidChangeOutputs = new event_1.Emitter();
            this.onDidChangeOutputs = this._onDidChangeOutputs.event;
            // private _textDocument: vscode.TextDocument | undefined;
            // private _initalVersion: number = -1;
            this._outputMapping = new Set();
            this._documentData = new extHostDocumentData_1.ExtHostDocumentData(new class extends types_1.NotImplementedProxy('document') {
            }, uri, content.split(/\r|\n|\r\n/g), '\n', language, 0, false);
            this._outputs = outputs;
            const observableMetadata = getObservable(_metadata || {});
            this._metadata = observableMetadata.proxy;
            this._metadataChangeListener = this._register(observableMetadata.onDidChange(() => {
                this.updateMetadata();
            }));
        }
        get document() {
            return this._documentData.document;
        }
        get source() {
            // todo@jrieken remove this
            return this._documentData.getText();
        }
        get outputs() {
            return this._outputs;
        }
        set outputs(newOutputs) {
            let diffs = notebookCommon_1.diff(this._outputs || [], newOutputs || [], (a) => {
                return this._outputMapping.has(a);
            });
            diffs.forEach(diff => {
                for (let i = diff.start; i < diff.start + diff.deleteCount; i++) {
                    this._outputMapping.delete(this._outputs[i]);
                }
                diff.toInsert.forEach(output => {
                    this._outputMapping.add(output);
                });
            });
            this._outputs = newOutputs;
            this._onDidChangeOutputs.fire(diffs);
        }
        get metadata() {
            return this._metadata;
        }
        set metadata(newMetadata) {
            // Don't apply metadata defaults here, 'undefined' means 'inherit from document metadata'
            this._metadataChangeListener.dispose();
            const observableMetadata = getObservable(newMetadata);
            this._metadata = observableMetadata.proxy;
            this._metadataChangeListener = this._register(observableMetadata.onDidChange(() => {
                this.updateMetadata();
            }));
            this.updateMetadata();
        }
        updateMetadata() {
            return this._proxy.$updateNotebookCellMetadata(this.viewType, this.documentUri, this.handle, this._metadata);
        }
        attachTextDocument(document) {
            this._documentData = document;
            // this._initalVersion = this._documentData.version;
        }
        detachTextDocument() {
            // no-op? keep stale document until new comes along?
            // if (this._textDocument && this._textDocument.version !== this._initalVersion) {
            // 	this.originalSource = this._textDocument.getText().split(/\r|\n|\r\n/g);
            // }
            // this._textDocument = undefined;
            // this._initalVersion = -1;
        }
    }
    exports.ExtHostCell = ExtHostCell;
    let ExtHostNotebookDocument = /** @class */ (() => {
        class ExtHostNotebookDocument extends lifecycle_1.Disposable {
            constructor(_proxy, _documentsAndEditors, viewType, uri, renderingHandler) {
                super();
                this._proxy = _proxy;
                this._documentsAndEditors = _documentsAndEditors;
                this.viewType = viewType;
                this.uri = uri;
                this.renderingHandler = renderingHandler;
                this.handle = ExtHostNotebookDocument._handlePool++;
                this._cells = [];
                this._cellDisposableMapping = new Map();
                this._languages = [];
                this._metadata = notebookCommon_1.notebookDocumentMetadataDefaults;
                this._displayOrder = [];
                this._versionId = 0;
                const observableMetadata = getObservable(notebookCommon_1.notebookDocumentMetadataDefaults);
                this._metadata = observableMetadata.proxy;
                this._metadataChangeListener = this._register(observableMetadata.onDidChange(() => {
                    this.updateMetadata();
                }));
            }
            get cells() {
                return this._cells;
            }
            get languages() {
                return this._languages = [];
            }
            set languages(newLanguages) {
                this._languages = newLanguages;
                this._proxy.$updateNotebookLanguages(this.viewType, this.uri, this._languages);
            }
            get metadata() {
                return this._metadata;
            }
            set metadata(newMetadata) {
                this._metadataChangeListener.dispose();
                newMetadata = Object.assign(Object.assign({}, notebookCommon_1.notebookDocumentMetadataDefaults), newMetadata);
                if (this._metadataChangeListener) {
                    this._metadataChangeListener.dispose();
                }
                const observableMetadata = getObservable(newMetadata);
                this._metadata = observableMetadata.proxy;
                this._metadataChangeListener = this._register(observableMetadata.onDidChange(() => {
                    this.updateMetadata();
                }));
                this.updateMetadata();
            }
            get displayOrder() {
                return this._displayOrder;
            }
            set displayOrder(newOrder) {
                this._displayOrder = newOrder;
            }
            get versionId() {
                return this._versionId;
            }
            updateMetadata() {
                this._proxy.$updateNotebookMetadata(this.viewType, this.uri, this._metadata);
            }
            dispose() {
                super.dispose();
                this._cellDisposableMapping.forEach(cell => cell.dispose());
            }
            get fileName() { return this.uri.fsPath; }
            get isDirty() { return false; }
            accpetModelChanged(event) {
                if (event.kind === notebookCommon_1.NotebookCellsChangeType.ModelChange) {
                    this.$spliceNotebookCells(event.changes);
                }
                else if (event.kind === notebookCommon_1.NotebookCellsChangeType.Move) {
                    this.$moveCell(event.index, event.newIdx);
                }
                else if (event.kind === notebookCommon_1.NotebookCellsChangeType.CellClearOutput) {
                    this.$clearCellOutputs(event.index);
                }
                else if (event.kind === notebookCommon_1.NotebookCellsChangeType.CellsClearOutput) {
                    this.$clearAllCellOutputs();
                }
                else if (event.kind === notebookCommon_1.NotebookCellsChangeType.ChangeLanguage) {
                    this.$changeCellLanguage(event.index, event.language);
                }
                this._versionId = event.versionId;
            }
            $spliceNotebookCells(splices) {
                if (!splices.length) {
                    return;
                }
                splices.reverse().forEach(splice => {
                    var _a;
                    let cellDtos = splice[2];
                    let newCells = cellDtos.map(cell => {
                        const extCell = new ExtHostCell(this.viewType, this.uri, cell.handle, uri_1.URI.revive(cell.uri), cell.source.join('\n'), cell.cellKind, cell.language, cell.outputs, cell.metadata, this._proxy);
                        const documentData = this._documentsAndEditors.getDocument(uri_1.URI.revive(cell.uri));
                        if (documentData) {
                            extCell.attachTextDocument(documentData);
                        }
                        if (!this._cellDisposableMapping.has(extCell.handle)) {
                            this._cellDisposableMapping.set(extCell.handle, new lifecycle_1.DisposableStore());
                        }
                        let store = this._cellDisposableMapping.get(extCell.handle);
                        store.add(extCell.onDidChangeOutputs((diffs) => {
                            this.eventuallyUpdateCellOutputs(extCell, diffs);
                        }));
                        return extCell;
                    });
                    for (let j = splice[0]; j < splice[0] + splice[1]; j++) {
                        (_a = this._cellDisposableMapping.get(this.cells[j].handle)) === null || _a === void 0 ? void 0 : _a.dispose();
                        this._cellDisposableMapping.delete(this.cells[j].handle);
                    }
                    this.cells.splice(splice[0], splice[1], ...newCells);
                });
            }
            $moveCell(index, newIdx) {
                const cells = this.cells.splice(index, 1);
                this.cells.splice(newIdx, 0, ...cells);
            }
            $clearCellOutputs(index) {
                const cell = this.cells[index];
                cell.outputs = [];
            }
            $clearAllCellOutputs() {
                this.cells.forEach(cell => cell.outputs = []);
            }
            $changeCellLanguage(index, language) {
                const cell = this.cells[index];
                cell.language = language;
            }
            eventuallyUpdateCellOutputs(cell, diffs) {
                let renderers = new Set();
                let outputDtos = diffs.map(diff => {
                    let outputs = diff.toInsert;
                    let transformedOutputs = outputs.map(output => {
                        if (output.outputKind === extHost_protocol_1.CellOutputKind.Rich) {
                            const ret = this.transformMimeTypes(output);
                            if (ret.orderedMimeTypes[ret.pickedMimeTypeIndex].isResolved) {
                                renderers.add(ret.orderedMimeTypes[ret.pickedMimeTypeIndex].rendererId);
                            }
                            return ret;
                        }
                        else {
                            return output;
                        }
                    });
                    return [diff.start, diff.deleteCount, transformedOutputs];
                });
                this._proxy.$spliceNotebookCellOutputs(this.viewType, this.uri, cell.handle, outputDtos, Array.from(renderers));
            }
            transformMimeTypes(output) {
                let mimeTypes = Object.keys(output.data);
                // TODO@rebornix, the document display order might be assigned a bit later. We need to postpone sending the outputs to the core side.
                let coreDisplayOrder = this.renderingHandler.outputDisplayOrder;
                const sorted = notebookCommon_1.sortMimeTypes(mimeTypes, (coreDisplayOrder === null || coreDisplayOrder === void 0 ? void 0 : coreDisplayOrder.userOrder) || [], this._displayOrder, (coreDisplayOrder === null || coreDisplayOrder === void 0 ? void 0 : coreDisplayOrder.defaultOrder) || []);
                let orderMimeTypes = [];
                sorted.forEach(mimeType => {
                    let handlers = this.renderingHandler.findBestMatchedRenderer(mimeType);
                    if (handlers.length) {
                        let renderedOutput = handlers[0].render(this, output, mimeType);
                        orderMimeTypes.push({
                            mimeType: mimeType,
                            isResolved: true,
                            rendererId: handlers[0].handle,
                            output: renderedOutput
                        });
                        for (let i = 1; i < handlers.length; i++) {
                            orderMimeTypes.push({
                                mimeType: mimeType,
                                isResolved: false,
                                rendererId: handlers[i].handle
                            });
                        }
                        if (notebookCommon_1.mimeTypeSupportedByCore(mimeType)) {
                            orderMimeTypes.push({
                                mimeType: mimeType,
                                isResolved: false,
                                rendererId: -1
                            });
                        }
                    }
                    else {
                        orderMimeTypes.push({
                            mimeType: mimeType,
                            isResolved: false
                        });
                    }
                });
                return {
                    outputKind: output.outputKind,
                    data: output.data,
                    orderedMimeTypes: orderMimeTypes,
                    pickedMimeTypeIndex: 0
                };
            }
            getCell(cellHandle) {
                return this.cells.find(cell => cell.handle === cellHandle);
            }
            attachCellTextDocument(textDocument) {
                let cell = this.cells.find(cell => cell.uri.toString() === textDocument.document.uri.toString());
                if (cell) {
                    cell.attachTextDocument(textDocument);
                }
            }
            detachCellTextDocument(textDocument) {
                let cell = this.cells.find(cell => cell.uri.toString() === textDocument.document.uri.toString());
                if (cell) {
                    cell.detachTextDocument();
                }
            }
        }
        ExtHostNotebookDocument._handlePool = 0;
        return ExtHostNotebookDocument;
    })();
    exports.ExtHostNotebookDocument = ExtHostNotebookDocument;
    class NotebookEditorCellEdit {
        constructor(editor) {
            this.editor = editor;
            this._finalized = false;
            this._collectedEdits = [];
            this._renderers = new Set();
            this._documentVersionId = editor.document.versionId;
        }
        finalize() {
            this._finalized = true;
            return {
                documentVersionId: this._documentVersionId,
                edits: this._collectedEdits,
                renderers: Array.from(this._renderers)
            };
        }
        _throwIfFinalized() {
            if (this._finalized) {
                throw new Error('Edit is only valid while callback runs');
            }
        }
        insert(index, content, language, type, outputs, metadata) {
            this._throwIfFinalized();
            const sourceArr = Array.isArray(content) ? content : content.split(/\r|\n|\r\n/g);
            let cell = {
                source: sourceArr,
                language,
                cellKind: type,
                outputs: outputs,
                metadata
            };
            const transformedOutputs = outputs.map(output => {
                if (output.outputKind === extHost_protocol_1.CellOutputKind.Rich) {
                    const ret = this.editor.document.transformMimeTypes(output);
                    if (ret.orderedMimeTypes[ret.pickedMimeTypeIndex].isResolved) {
                        this._renderers.add(ret.orderedMimeTypes[ret.pickedMimeTypeIndex].rendererId);
                    }
                    return ret;
                }
                else {
                    return output;
                }
            });
            cell.outputs = transformedOutputs;
            this._collectedEdits.push({
                editType: notebookCommon_1.CellEditType.Insert,
                index,
                cells: [cell]
            });
        }
        delete(index) {
            this._throwIfFinalized();
            this._collectedEdits.push({
                editType: notebookCommon_1.CellEditType.Delete,
                index,
                count: 1
            });
        }
    }
    exports.NotebookEditorCellEdit = NotebookEditorCellEdit;
    class ExtHostNotebookEditor extends lifecycle_1.Disposable {
        constructor(viewType, id, uri, _proxy, _onDidReceiveMessage, document, _documentsAndEditors) {
            super();
            this.viewType = viewType;
            this.id = id;
            this.uri = uri;
            this._proxy = _proxy;
            this._onDidReceiveMessage = _onDidReceiveMessage;
            this.document = document;
            this._documentsAndEditors = _documentsAndEditors;
            this.selection = undefined;
            this.onDidReceiveMessage = this._onDidReceiveMessage.event;
            this._register(this._documentsAndEditors.onDidAddDocuments(documents => {
                for (const documentData of documents) {
                    let data = notebookCommon_1.CellUri.parse(documentData.document.uri);
                    if (data) {
                        if (this.document.uri.toString() === data.notebook.toString()) {
                            document.attachCellTextDocument(documentData);
                        }
                    }
                }
            }));
            this._register(this._documentsAndEditors.onDidRemoveDocuments(documents => {
                for (const documentData of documents) {
                    let data = notebookCommon_1.CellUri.parse(documentData.document.uri);
                    if (data) {
                        if (this.document.uri.toString() === data.notebook.toString()) {
                            document.detachCellTextDocument(documentData);
                        }
                    }
                }
            }));
        }
        edit(callback) {
            const edit = new NotebookEditorCellEdit(this);
            callback(edit);
            return this._applyEdit(edit);
        }
        _applyEdit(editBuilder) {
            const editData = editBuilder.finalize();
            // return when there is nothing to do
            if (editData.edits.length === 0) {
                return Promise.resolve(true);
            }
            let compressedEdits = [];
            let compressedEditsIndex = -1;
            for (let i = 0; i < editData.edits.length; i++) {
                if (compressedEditsIndex < 0) {
                    compressedEdits.push(editData.edits[i]);
                    compressedEditsIndex++;
                    continue;
                }
                let prevIndex = compressedEditsIndex;
                let prev = compressedEdits[prevIndex];
                if (prev.editType === notebookCommon_1.CellEditType.Insert && editData.edits[i].editType === notebookCommon_1.CellEditType.Insert) {
                    if (prev.index === editData.edits[i].index) {
                        prev.cells.push(...editData.edits[i].cells);
                        continue;
                    }
                }
                if (prev.editType === notebookCommon_1.CellEditType.Delete && editData.edits[i].editType === notebookCommon_1.CellEditType.Delete) {
                    if (prev.index === editData.edits[i].index) {
                        prev.count += editData.edits[i].count;
                        continue;
                    }
                }
                compressedEdits.push(editData.edits[i]);
                compressedEditsIndex++;
            }
            return this._proxy.$tryApplyEdits(this.viewType, this.uri, editData.documentVersionId, compressedEdits, editData.renderers);
        }
        get viewColumn() {
            return this._viewColumn;
        }
        set viewColumn(value) {
            throw errors_1.readonly('viewColumn');
        }
        async postMessage(message) {
            return this._proxy.$postMessage(this.document.handle, message);
        }
    }
    exports.ExtHostNotebookEditor = ExtHostNotebookEditor;
    let ExtHostNotebookOutputRenderer = /** @class */ (() => {
        class ExtHostNotebookOutputRenderer {
            constructor(type, filter, renderer) {
                this.type = type;
                this.filter = filter;
                this.renderer = renderer;
                this.handle = ExtHostNotebookOutputRenderer._handlePool++;
            }
            matches(mimeType) {
                if (this.filter.subTypes) {
                    if (this.filter.subTypes.indexOf(mimeType) >= 0) {
                        return true;
                    }
                }
                return false;
            }
            render(document, output, mimeType) {
                let html = this.renderer.render(document, output, mimeType);
                return html;
            }
        }
        ExtHostNotebookOutputRenderer._handlePool = 0;
        return ExtHostNotebookOutputRenderer;
    })();
    exports.ExtHostNotebookOutputRenderer = ExtHostNotebookOutputRenderer;
    let ExtHostNotebookController = /** @class */ (() => {
        class ExtHostNotebookController {
            constructor(mainContext, commands, _documentsAndEditors) {
                this._documentsAndEditors = _documentsAndEditors;
                this._notebookProviders = new Map();
                this._documents = new Map();
                this._editors = new Map();
                this._notebookOutputRenderers = new Map();
                this._onDidChangeNotebookDocument = new event_1.Emitter();
                this.onDidChangeNotebookDocument = this._onDidChangeNotebookDocument.event;
                this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadNotebook);
                commands.registerArgumentProcessor({
                    processArgument: arg => {
                        var _a;
                        if (arg && arg.$mid === 12) {
                            const documentHandle = (_a = arg.notebookEditor) === null || _a === void 0 ? void 0 : _a.notebookHandle;
                            const cellHandle = arg.cell.handle;
                            for (let value of this._editors) {
                                if (value[1].editor.document.handle === documentHandle) {
                                    const cell = value[1].editor.document.getCell(cellHandle);
                                    if (cell) {
                                        return cell;
                                    }
                                }
                            }
                        }
                        return arg;
                    }
                });
            }
            get outputDisplayOrder() {
                return this._outputDisplayOrder;
            }
            get activeNotebookDocument() {
                return this._activeNotebookDocument;
            }
            get activeNotebookEditor() {
                return this._activeNotebookEditor;
            }
            registerNotebookOutputRenderer(type, extension, filter, renderer) {
                let extHostRenderer = new ExtHostNotebookOutputRenderer(type, filter, renderer);
                this._notebookOutputRenderers.set(extHostRenderer.handle, extHostRenderer);
                this._proxy.$registerNotebookRenderer({ id: extension.identifier, location: extension.extensionLocation }, type, filter, extHostRenderer.handle, renderer.preloads || []);
                return new extHostTypes_1.Disposable(() => {
                    this._notebookOutputRenderers.delete(extHostRenderer.handle);
                    this._proxy.$unregisterNotebookRenderer(extHostRenderer.handle);
                });
            }
            findBestMatchedRenderer(mimeType) {
                let matches = [];
                for (let renderer of this._notebookOutputRenderers) {
                    if (renderer[1].matches(mimeType)) {
                        matches.push(renderer[1]);
                    }
                }
                return matches;
            }
            registerNotebookProvider(extension, viewType, provider) {
                if (this._notebookProviders.has(viewType)) {
                    throw new Error(`Notebook provider for '${viewType}' already registered`);
                }
                this._notebookProviders.set(viewType, { extension, provider });
                this._proxy.$registerNotebookProvider({ id: extension.identifier, location: extension.extensionLocation }, viewType);
                return new extHostTypes_1.Disposable(() => {
                    this._notebookProviders.delete(viewType);
                    this._proxy.$unregisterNotebookProvider(viewType);
                });
            }
            async $resolveNotebook(viewType, uri) {
                let provider = this._notebookProviders.get(viewType);
                if (provider) {
                    if (!this._documents.has(uri_1.URI.revive(uri).toString())) {
                        let document = new ExtHostNotebookDocument(this._proxy, this._documentsAndEditors, viewType, uri_1.URI.revive(uri), this);
                        await this._proxy.$createNotebookDocument(document.handle, viewType, uri);
                        this._documents.set(uri_1.URI.revive(uri).toString(), document);
                    }
                    const onDidReceiveMessage = new event_1.Emitter();
                    let editor = new ExtHostNotebookEditor(viewType, `${ExtHostNotebookController._handlePool++}`, uri_1.URI.revive(uri), this._proxy, onDidReceiveMessage, this._documents.get(uri_1.URI.revive(uri).toString()), this._documentsAndEditors);
                    this._editors.set(uri_1.URI.revive(uri).toString(), { editor, onDidReceiveMessage });
                    await provider.provider.resolveNotebook(editor);
                    // await editor.document.$updateCells();
                    return editor.document.handle;
                }
                return Promise.resolve(undefined);
            }
            async $executeNotebook(viewType, uri, cellHandle, token) {
                let provider = this._notebookProviders.get(viewType);
                if (!provider) {
                    return;
                }
                let document = this._documents.get(uri_1.URI.revive(uri).toString());
                if (!document) {
                    return;
                }
                let cell = cellHandle !== undefined ? document.getCell(cellHandle) : undefined;
                return provider.provider.executeCell(document, cell, token);
            }
            async $saveNotebook(viewType, uri) {
                let provider = this._notebookProviders.get(viewType);
                let document = this._documents.get(uri_1.URI.revive(uri).toString());
                if (provider && document) {
                    return await provider.provider.save(document);
                }
                return false;
            }
            async $updateActiveEditor(viewType, uri) {
                var _a;
                this._activeNotebookDocument = this._documents.get(uri_1.URI.revive(uri).toString());
                this._activeNotebookEditor = (_a = this._editors.get(uri_1.URI.revive(uri).toString())) === null || _a === void 0 ? void 0 : _a.editor;
            }
            async $destoryNotebookDocument(viewType, uri) {
                let provider = this._notebookProviders.get(viewType);
                if (!provider) {
                    return false;
                }
                let document = this._documents.get(uri_1.URI.revive(uri).toString());
                if (document) {
                    document.dispose();
                    this._documents.delete(uri_1.URI.revive(uri).toString());
                }
                let editor = this._editors.get(uri_1.URI.revive(uri).toString());
                if (editor) {
                    editor.editor.dispose();
                    editor.onDidReceiveMessage.dispose();
                    this._editors.delete(uri_1.URI.revive(uri).toString());
                }
                return true;
            }
            $acceptDisplayOrder(displayOrder) {
                this._outputDisplayOrder = displayOrder;
            }
            $onDidReceiveMessage(uri, message) {
                let editor = this._editors.get(uri_1.URI.revive(uri).toString());
                if (editor) {
                    editor.onDidReceiveMessage.fire(message);
                }
            }
            $acceptModelChanged(uriComponents, event) {
                let editor = this._editors.get(uri_1.URI.revive(uriComponents).toString());
                if (editor) {
                    editor.editor.document.accpetModelChanged(event);
                    this._onDidChangeNotebookDocument.fire({
                        document: editor.editor.document,
                        changes: [event]
                    });
                }
            }
            $acceptEditorPropertiesChanged(uriComponents, data) {
                let editor = this._editors.get(uri_1.URI.revive(uriComponents).toString());
                if (!editor) {
                    return;
                }
                if (data.selections) {
                    const cells = editor.editor.document.cells;
                    if (data.selections.selections.length) {
                        const firstCell = data.selections.selections[0];
                        editor.editor.selection = cells.find(cell => cell.handle === firstCell);
                    }
                    else {
                        editor.editor.selection = undefined;
                    }
                }
            }
        }
        ExtHostNotebookController._handlePool = 0;
        return ExtHostNotebookController;
    })();
    exports.ExtHostNotebookController = ExtHostNotebookController;
});
//# sourceMappingURL=extHostNotebook.js.map