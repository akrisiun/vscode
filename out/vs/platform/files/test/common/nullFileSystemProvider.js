/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event"], function (require, exports, lifecycle_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class NullFileSystemProvider {
        constructor(disposableFactory = () => lifecycle_1.Disposable.None) {
            this.disposableFactory = disposableFactory;
            this.capabilities = 2048 /* Readonly */;
            this.onDidChangeCapabilities = event_1.Event.None;
            this.onDidChangeFile = event_1.Event.None;
        }
        watch(resource, opts) { return this.disposableFactory(); }
        stat(resource) { return Promise.resolve(undefined); }
        mkdir(resource) { return Promise.resolve(undefined); }
        readdir(resource) { return Promise.resolve(undefined); }
        delete(resource, opts) { return Promise.resolve(undefined); }
        rename(from, to, opts) { return Promise.resolve(undefined); }
        copy(from, to, opts) { return Promise.resolve(undefined); }
        readFile(resource) { return Promise.resolve(undefined); }
        writeFile(resource, content, opts) { return Promise.resolve(undefined); }
        open(resource, opts) { return Promise.resolve(undefined); }
        close(fd) { return Promise.resolve(undefined); }
        read(fd, pos, data, offset, length) { return Promise.resolve(undefined); }
        write(fd, pos, data, offset, length) { return Promise.resolve(undefined); }
    }
    exports.NullFileSystemProvider = NullFileSystemProvider;
});
//# sourceMappingURL=nullFileSystemProvider.js.map