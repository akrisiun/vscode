/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/glob", "vs/base/common/uri", "./extHost.protocol", "./extHostTypeConverters", "./extHostTypes"], function (require, exports, arrays_1, event_1, glob_1, uri_1, extHost_protocol_1, typeConverter, extHostTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FileSystemWatcher {
        constructor(dispatcher, globPattern, ignoreCreateEvents, ignoreChangeEvents, ignoreDeleteEvents) {
            this._onDidCreate = new event_1.Emitter();
            this._onDidChange = new event_1.Emitter();
            this._onDidDelete = new event_1.Emitter();
            this._config = 0;
            if (ignoreCreateEvents) {
                this._config += 0b001;
            }
            if (ignoreChangeEvents) {
                this._config += 0b010;
            }
            if (ignoreDeleteEvents) {
                this._config += 0b100;
            }
            const parsedPattern = glob_1.parse(globPattern);
            const subscription = dispatcher(events => {
                if (!ignoreCreateEvents) {
                    for (let created of events.created) {
                        const uri = uri_1.URI.revive(created);
                        if (parsedPattern(uri.fsPath)) {
                            this._onDidCreate.fire(uri);
                        }
                    }
                }
                if (!ignoreChangeEvents) {
                    for (let changed of events.changed) {
                        const uri = uri_1.URI.revive(changed);
                        if (parsedPattern(uri.fsPath)) {
                            this._onDidChange.fire(uri);
                        }
                    }
                }
                if (!ignoreDeleteEvents) {
                    for (let deleted of events.deleted) {
                        const uri = uri_1.URI.revive(deleted);
                        if (parsedPattern(uri.fsPath)) {
                            this._onDidDelete.fire(uri);
                        }
                    }
                }
            });
            this._disposable = extHostTypes_1.Disposable.from(this._onDidCreate, this._onDidChange, this._onDidDelete, subscription);
        }
        get ignoreCreateEvents() {
            return Boolean(this._config & 0b001);
        }
        get ignoreChangeEvents() {
            return Boolean(this._config & 0b010);
        }
        get ignoreDeleteEvents() {
            return Boolean(this._config & 0b100);
        }
        dispose() {
            this._disposable.dispose();
        }
        get onDidCreate() {
            return this._onDidCreate.event;
        }
        get onDidChange() {
            return this._onDidChange.event;
        }
        get onDidDelete() {
            return this._onDidDelete.event;
        }
    }
    class ExtHostFileSystemEventService {
        constructor(mainContext, _extHostDocumentsAndEditors, _mainThreadTextEditors = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadTextEditors)) {
            this._extHostDocumentsAndEditors = _extHostDocumentsAndEditors;
            this._mainThreadTextEditors = _mainThreadTextEditors;
            this._onFileEvent = new event_1.Emitter();
            this._onDidRenameFile = new event_1.Emitter();
            this._onWillRenameFile = new event_1.AsyncEmitter();
            this.onDidRenameFile = this._onDidRenameFile.event;
            //
        }
        createFileSystemWatcher(globPattern, ignoreCreateEvents, ignoreChangeEvents, ignoreDeleteEvents) {
            return new FileSystemWatcher(this._onFileEvent.event, globPattern, ignoreCreateEvents, ignoreChangeEvents, ignoreDeleteEvents);
        }
        $onFileEvent(events) {
            this._onFileEvent.fire(events);
        }
        $onFileRename(oldUri, newUri) {
            this._onDidRenameFile.fire(Object.freeze({ oldUri: uri_1.URI.revive(oldUri), newUri: uri_1.URI.revive(newUri) }));
        }
        getOnWillRenameFileEvent(extension) {
            return (listener, thisArg, disposables) => {
                const wrappedListener = ((e) => {
                    listener.call(thisArg, e);
                });
                wrappedListener.extension = extension;
                return this._onWillRenameFile.event(wrappedListener, undefined, disposables);
            };
        }
        $onWillRename(oldUriDto, newUriDto) {
            const oldUri = uri_1.URI.revive(oldUriDto);
            const newUri = uri_1.URI.revive(newUriDto);
            const edits = [];
            return Promise.resolve(this._onWillRenameFile.fireAsync((bucket, _listener) => {
                return {
                    oldUri,
                    newUri,
                    waitUntil: (thenable) => {
                        if (Object.isFrozen(bucket)) {
                            throw new TypeError('waitUntil cannot be called async');
                        }
                        const index = bucket.length;
                        const wrappedThenable = Promise.resolve(thenable).then(result => {
                            // ignore all results except for WorkspaceEdits. Those
                            // are stored in a spare array
                            if (result instanceof extHostTypes_1.WorkspaceEdit) {
                                edits[index] = result;
                            }
                        });
                        bucket.push(wrappedThenable);
                    }
                };
            }).then(() => {
                if (edits.length === 0) {
                    return undefined;
                }
                // flatten all WorkspaceEdits collected via waitUntil-call
                // and apply them in one go.
                const allEdits = new Array();
                for (let edit of edits) {
                    if (edit) { // sparse array
                        let { edits } = typeConverter.WorkspaceEdit.from(edit, this._extHostDocumentsAndEditors);
                        allEdits.push(edits);
                    }
                }
                return this._mainThreadTextEditors.$tryApplyWorkspaceEdit({ edits: arrays_1.flatten(allEdits) });
            }));
        }
    }
    exports.ExtHostFileSystemEventService = ExtHostFileSystemEventService;
});
//# sourceMappingURL=extHostFileSystemEventService.js.map