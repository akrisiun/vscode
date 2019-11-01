/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/files/common/files", "vs/workbench/api/common/extHostCustomers", "../common/extHost.protocol", "vs/workbench/services/textfile/common/textfiles"], function (require, exports, lifecycle_1, files_1, extHostCustomers_1, extHost_protocol_1, textfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let MainThreadFileSystemEventService = class MainThreadFileSystemEventService {
        constructor(extHostContext, fileService, textfileService) {
            this._listener = new Array();
            const proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostFileSystemEventService);
            // file system events - (changes the editor and other make)
            const events = {
                created: [],
                changed: [],
                deleted: []
            };
            fileService.onFileChanges(event => {
                for (let change of event.changes) {
                    switch (change.type) {
                        case 1 /* ADDED */:
                            events.created.push(change.resource);
                            break;
                        case 0 /* UPDATED */:
                            events.changed.push(change.resource);
                            break;
                        case 2 /* DELETED */:
                            events.deleted.push(change.resource);
                            break;
                    }
                }
                proxy.$onFileEvent(events);
                events.created.length = 0;
                events.changed.length = 0;
                events.deleted.length = 0;
            }, undefined, this._listener);
            // file operation events - (changes the editor makes)
            fileService.onAfterOperation(e => {
                if (e.isOperation(2 /* MOVE */)) {
                    proxy.$onFileRename(e.resource, e.target.resource);
                }
            }, undefined, this._listener);
            textfileService.onWillMove(e => {
                const promise = proxy.$onWillRename(e.oldResource, e.newResource);
                e.waitUntil(promise);
            }, undefined, this._listener);
        }
        dispose() {
            lifecycle_1.dispose(this._listener);
        }
    };
    MainThreadFileSystemEventService = __decorate([
        extHostCustomers_1.extHostCustomer,
        __param(1, files_1.IFileService),
        __param(2, textfiles_1.ITextFileService)
    ], MainThreadFileSystemEventService);
    exports.MainThreadFileSystemEventService = MainThreadFileSystemEventService;
});
//# sourceMappingURL=mainThreadFileSystemEventService.js.map