/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/files/common/files", "vs/base/common/resources", "vs/base/common/strings", "vs/platform/environment/common/environment"], function (require, exports, event_1, lifecycle_1, files_1, resources, strings_1, environment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FileUserDataProvider extends lifecycle_1.Disposable {
        constructor(fileSystemUserDataHome, fileSystemBackupsHome, fileSystemProvider, environmentService) {
            super();
            this.fileSystemUserDataHome = fileSystemUserDataHome;
            this.fileSystemBackupsHome = fileSystemBackupsHome;
            this.fileSystemProvider = fileSystemProvider;
            this.capabilities = this.fileSystemProvider.capabilities;
            this.onDidChangeCapabilities = event_1.Event.None;
            this._onDidChangeFile = this._register(new event_1.Emitter());
            this.onDidChangeFile = this._onDidChangeFile.event;
            this.userDataHome = environmentService.userRoamingDataHome;
            // Assumption: This path always exists
            this._register(this.fileSystemProvider.watch(this.fileSystemUserDataHome, { recursive: false, excludes: [] }));
            this._register(this.fileSystemProvider.onDidChangeFile(e => this.handleFileChanges(e)));
        }
        watch(resource, opts) {
            return this.fileSystemProvider.watch(this.toFileSystemResource(resource), opts);
        }
        stat(resource) {
            return this.fileSystemProvider.stat(this.toFileSystemResource(resource));
        }
        mkdir(resource) {
            return this.fileSystemProvider.mkdir(this.toFileSystemResource(resource));
        }
        rename(from, to, opts) {
            return this.fileSystemProvider.rename(this.toFileSystemResource(from), this.toFileSystemResource(to), opts);
        }
        readFile(resource) {
            if (files_1.hasReadWriteCapability(this.fileSystemProvider)) {
                return this.fileSystemProvider.readFile(this.toFileSystemResource(resource));
            }
            throw new Error('not supported');
        }
        readdir(resource) {
            return this.fileSystemProvider.readdir(this.toFileSystemResource(resource));
        }
        writeFile(resource, content, opts) {
            if (files_1.hasReadWriteCapability(this.fileSystemProvider)) {
                return this.fileSystemProvider.writeFile(this.toFileSystemResource(resource), content, opts);
            }
            throw new Error('not supported');
        }
        open(resource, opts) {
            if (files_1.hasOpenReadWriteCloseCapability(this.fileSystemProvider)) {
                return this.fileSystemProvider.open(this.toFileSystemResource(resource), opts);
            }
            throw new Error('not supported');
        }
        close(fd) {
            if (files_1.hasOpenReadWriteCloseCapability(this.fileSystemProvider)) {
                return this.fileSystemProvider.close(fd);
            }
            throw new Error('not supported');
        }
        read(fd, pos, data, offset, length) {
            if (files_1.hasOpenReadWriteCloseCapability(this.fileSystemProvider)) {
                return this.fileSystemProvider.read(fd, pos, data, offset, length);
            }
            throw new Error('not supported');
        }
        write(fd, pos, data, offset, length) {
            if (files_1.hasOpenReadWriteCloseCapability(this.fileSystemProvider)) {
                return this.fileSystemProvider.write(fd, pos, data, offset, length);
            }
            throw new Error('not supported');
        }
        delete(resource, opts) {
            return this.fileSystemProvider.delete(this.toFileSystemResource(resource), opts);
        }
        handleFileChanges(changes) {
            const userDataChanges = [];
            for (const change of changes) {
                const userDataResource = this.toUserDataResource(change.resource);
                if (userDataResource) {
                    userDataChanges.push({
                        resource: userDataResource,
                        type: change.type
                    });
                }
            }
            if (userDataChanges.length) {
                this._onDidChangeFile.fire(userDataChanges);
            }
        }
        toFileSystemResource(userDataResource) {
            const relativePath = resources.relativePath(this.userDataHome, userDataResource);
            if (strings_1.startsWith(relativePath, environment_1.BACKUPS)) {
                return resources.joinPath(resources.dirname(this.fileSystemBackupsHome), relativePath);
            }
            return resources.joinPath(this.fileSystemUserDataHome, relativePath);
        }
        toUserDataResource(fileSystemResource) {
            if (resources.isEqualOrParent(fileSystemResource, this.fileSystemUserDataHome)) {
                const relativePath = resources.relativePath(this.fileSystemUserDataHome, fileSystemResource);
                return relativePath ? resources.joinPath(this.userDataHome, relativePath) : this.userDataHome;
            }
            if (resources.isEqualOrParent(fileSystemResource, this.fileSystemBackupsHome)) {
                const relativePath = resources.relativePath(this.fileSystemBackupsHome, fileSystemResource);
                return relativePath ? resources.joinPath(this.userDataHome, environment_1.BACKUPS, relativePath) : resources.joinPath(this.userDataHome, environment_1.BACKUPS);
            }
            return null;
        }
    }
    exports.FileUserDataProvider = FileUserDataProvider;
});
//# sourceMappingURL=fileUserDataProvider.js.map