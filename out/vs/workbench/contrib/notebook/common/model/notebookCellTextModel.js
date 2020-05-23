/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBufferBuilder"], function (require, exports, event_1, pieceTreeTextBufferBuilder_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookCellTextModel = void 0;
    class NotebookCellTextModel {
        constructor(uri, handle, _source, _language, cellKind, outputs, metadata) {
            this.uri = uri;
            this.handle = handle;
            this._source = _source;
            this._language = _language;
            this.cellKind = cellKind;
            this._onDidChangeOutputs = new event_1.Emitter();
            this.onDidChangeOutputs = this._onDidChangeOutputs.event;
            this._onDidChangeContent = new event_1.Emitter();
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidChangeMetadata = new event_1.Emitter();
            this.onDidChangeMetadata = this._onDidChangeMetadata.event;
            this._onDidChangeLanguage = new event_1.Emitter();
            this.onDidChangeLanguage = this._onDidChangeLanguage.event;
            this._buffer = null;
            this._outputs = outputs;
            this._metadata = metadata;
        }
        get outputs() {
            return this._outputs;
        }
        get source() {
            return this._source;
        }
        set source(newValue) {
            this._source = newValue;
            this._buffer = null;
        }
        get metadata() {
            return this._metadata;
        }
        set metadata(newMetadata) {
            this._metadata = newMetadata;
            this._onDidChangeMetadata.fire();
        }
        get language() {
            return this._language;
        }
        set language(newLanguage) {
            this._language = newLanguage;
            this._onDidChangeLanguage.fire(newLanguage);
        }
        contentChange() {
            this._onDidChangeContent.fire();
        }
        spliceNotebookCellOutputs(splices) {
            splices.reverse().forEach(splice => {
                this.outputs.splice(splice[0], splice[1], ...splice[2]);
            });
            this._onDidChangeOutputs.fire(splices);
        }
        resolveTextBufferFactory() {
            if (this._buffer) {
                return this._buffer;
            }
            let builder = new pieceTreeTextBufferBuilder_1.PieceTreeTextBufferBuilder();
            builder.acceptChunk(this.source.join('\n'));
            this._buffer = builder.finish(true);
            return this._buffer;
        }
    }
    exports.NotebookCellTextModel = NotebookCellTextModel;
});
//# sourceMappingURL=notebookCellTextModel.js.map