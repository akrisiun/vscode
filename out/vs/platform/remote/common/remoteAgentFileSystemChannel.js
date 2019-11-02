/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/common/uuid", "vs/base/common/buffer"], function (require, exports, event_1, lifecycle_1, uri_1, uuid_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.REMOTE_FILE_SYSTEM_CHANNEL_NAME = 'remotefilesystem';
    class RemoteExtensionsFileSystemProvider extends lifecycle_1.Disposable {
        constructor(channel, environment) {
            super();
            this.channel = channel;
            this.session = uuid_1.generateUuid();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChangeFile = this._onDidChange.event;
            this._onDidWatchErrorOccur = this._register(new event_1.Emitter());
            this.onDidErrorOccur = this._onDidWatchErrorOccur.event;
            this._onDidChangeCapabilities = this._register(new event_1.Emitter());
            this.onDidChangeCapabilities = this._onDidChangeCapabilities.event;
            this.setCaseSensitive(true);
            environment.then(remoteAgentEnvironment => this.setCaseSensitive(!!(remoteAgentEnvironment && remoteAgentEnvironment.os === 3 /* Linux */)));
            this.registerListeners();
        }
        get capabilities() { return this._capabilities; }
        registerListeners() {
            this._register(this.channel.listen('filechange', [this.session])((eventsOrError) => {
                if (Array.isArray(eventsOrError)) {
                    const events = eventsOrError;
                    this._onDidChange.fire(events.map(event => ({ resource: uri_1.URI.revive(event.resource), type: event.type })));
                }
                else {
                    const error = eventsOrError;
                    this._onDidWatchErrorOccur.fire(error);
                }
            }));
        }
        setCaseSensitive(isCaseSensitive) {
            let capabilities = (2 /* FileReadWrite */
                | 4 /* FileOpenReadWriteClose */
                | 8 /* FileFolderCopy */);
            if (isCaseSensitive) {
                capabilities |= 1024 /* PathCaseSensitive */;
            }
            this._capabilities = capabilities;
            this._onDidChangeCapabilities.fire(undefined);
        }
        // --- forwarding calls
        stat(resource) {
            return this.channel.call('stat', [resource]);
        }
        open(resource, opts) {
            return this.channel.call('open', [resource, opts]);
        }
        close(fd) {
            return this.channel.call('close', [fd]);
        }
        async read(fd, pos, data, offset, length) {
            const [bytes, bytesRead] = await this.channel.call('read', [fd, pos, length]);
            // copy back the data that was written into the buffer on the remote
            // side. we need to do this because buffers are not referenced by
            // pointer, but only by value and as such cannot be directly written
            // to from the other process.
            data.set(bytes.buffer.slice(0, bytesRead), offset);
            return bytesRead;
        }
        async readFile(resource) {
            const buff = await this.channel.call('readFile', [resource]);
            return buff.buffer;
        }
        write(fd, pos, data, offset, length) {
            return this.channel.call('write', [fd, pos, buffer_1.VSBuffer.wrap(data), offset, length]);
        }
        writeFile(resource, content, opts) {
            return this.channel.call('writeFile', [resource, buffer_1.VSBuffer.wrap(content), opts]);
        }
        delete(resource, opts) {
            return this.channel.call('delete', [resource, opts]);
        }
        mkdir(resource) {
            return this.channel.call('mkdir', [resource]);
        }
        readdir(resource) {
            return this.channel.call('readdir', [resource]);
        }
        rename(resource, target, opts) {
            return this.channel.call('rename', [resource, target, opts]);
        }
        copy(resource, target, opts) {
            return this.channel.call('copy', [resource, target, opts]);
        }
        watch(resource, opts) {
            const req = Math.random();
            this.channel.call('watch', [this.session, req, resource, opts]);
            return lifecycle_1.toDisposable(() => this.channel.call('unwatch', [this.session, req]));
        }
    }
    exports.RemoteExtensionsFileSystemProvider = RemoteExtensionsFileSystemProvider;
});
//# sourceMappingURL=remoteAgentFileSystemChannel.js.map