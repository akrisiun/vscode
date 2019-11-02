/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/platform/instantiation/common/instantiation", "vs/base/common/strings", "vs/base/common/resources", "vs/base/common/types"], function (require, exports, path_1, instantiation_1, strings_1, resources_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IFileService = instantiation_1.createDecorator('fileService');
    var FileType;
    (function (FileType) {
        FileType[FileType["Unknown"] = 0] = "Unknown";
        FileType[FileType["File"] = 1] = "File";
        FileType[FileType["Directory"] = 2] = "Directory";
        FileType[FileType["SymbolicLink"] = 64] = "SymbolicLink";
    })(FileType = exports.FileType || (exports.FileType = {}));
    var FileSystemProviderCapabilities;
    (function (FileSystemProviderCapabilities) {
        FileSystemProviderCapabilities[FileSystemProviderCapabilities["FileReadWrite"] = 2] = "FileReadWrite";
        FileSystemProviderCapabilities[FileSystemProviderCapabilities["FileOpenReadWriteClose"] = 4] = "FileOpenReadWriteClose";
        FileSystemProviderCapabilities[FileSystemProviderCapabilities["FileFolderCopy"] = 8] = "FileFolderCopy";
        FileSystemProviderCapabilities[FileSystemProviderCapabilities["PathCaseSensitive"] = 1024] = "PathCaseSensitive";
        FileSystemProviderCapabilities[FileSystemProviderCapabilities["Readonly"] = 2048] = "Readonly";
        FileSystemProviderCapabilities[FileSystemProviderCapabilities["Trash"] = 4096] = "Trash";
    })(FileSystemProviderCapabilities = exports.FileSystemProviderCapabilities || (exports.FileSystemProviderCapabilities = {}));
    function hasReadWriteCapability(provider) {
        return !!(provider.capabilities & 2 /* FileReadWrite */);
    }
    exports.hasReadWriteCapability = hasReadWriteCapability;
    function hasFileFolderCopyCapability(provider) {
        return !!(provider.capabilities & 8 /* FileFolderCopy */);
    }
    exports.hasFileFolderCopyCapability = hasFileFolderCopyCapability;
    function hasOpenReadWriteCloseCapability(provider) {
        return !!(provider.capabilities & 4 /* FileOpenReadWriteClose */);
    }
    exports.hasOpenReadWriteCloseCapability = hasOpenReadWriteCloseCapability;
    var FileSystemProviderErrorCode;
    (function (FileSystemProviderErrorCode) {
        FileSystemProviderErrorCode["FileExists"] = "EntryExists";
        FileSystemProviderErrorCode["FileNotFound"] = "EntryNotFound";
        FileSystemProviderErrorCode["FileNotADirectory"] = "EntryNotADirectory";
        FileSystemProviderErrorCode["FileIsADirectory"] = "EntryIsADirectory";
        FileSystemProviderErrorCode["NoPermissions"] = "NoPermissions";
        FileSystemProviderErrorCode["Unavailable"] = "Unavailable";
        FileSystemProviderErrorCode["Unknown"] = "Unknown";
    })(FileSystemProviderErrorCode = exports.FileSystemProviderErrorCode || (exports.FileSystemProviderErrorCode = {}));
    class FileSystemProviderError extends Error {
        constructor(message, code) {
            super(message);
            this.code = code;
        }
    }
    exports.FileSystemProviderError = FileSystemProviderError;
    function createFileSystemProviderError(error, code) {
        const providerError = new FileSystemProviderError(error.toString(), code);
        markAsFileSystemProviderError(providerError, code);
        return providerError;
    }
    exports.createFileSystemProviderError = createFileSystemProviderError;
    function markAsFileSystemProviderError(error, code) {
        error.name = code ? `${code} (FileSystemError)` : `FileSystemError`;
        return error;
    }
    exports.markAsFileSystemProviderError = markAsFileSystemProviderError;
    function toFileSystemProviderErrorCode(error) {
        // Guard against abuse
        if (!error) {
            return FileSystemProviderErrorCode.Unknown;
        }
        // FileSystemProviderError comes with the code
        if (error instanceof FileSystemProviderError) {
            return error.code;
        }
        // Any other error, check for name match by assuming that the error
        // went through the markAsFileSystemProviderError() method
        const match = /^(.+) \(FileSystemError\)$/.exec(error.name);
        if (!match) {
            return FileSystemProviderErrorCode.Unknown;
        }
        switch (match[1]) {
            case FileSystemProviderErrorCode.FileExists: return FileSystemProviderErrorCode.FileExists;
            case FileSystemProviderErrorCode.FileIsADirectory: return FileSystemProviderErrorCode.FileIsADirectory;
            case FileSystemProviderErrorCode.FileNotADirectory: return FileSystemProviderErrorCode.FileNotADirectory;
            case FileSystemProviderErrorCode.FileNotFound: return FileSystemProviderErrorCode.FileNotFound;
            case FileSystemProviderErrorCode.NoPermissions: return FileSystemProviderErrorCode.NoPermissions;
            case FileSystemProviderErrorCode.Unavailable: return FileSystemProviderErrorCode.Unavailable;
        }
        return FileSystemProviderErrorCode.Unknown;
    }
    exports.toFileSystemProviderErrorCode = toFileSystemProviderErrorCode;
    function toFileOperationResult(error) {
        // FileSystemProviderError comes with the result already
        if (error instanceof FileOperationError) {
            return error.fileOperationResult;
        }
        // Otherwise try to find from code
        switch (toFileSystemProviderErrorCode(error)) {
            case FileSystemProviderErrorCode.FileNotFound:
                return 1 /* FILE_NOT_FOUND */;
            case FileSystemProviderErrorCode.FileIsADirectory:
                return 0 /* FILE_IS_DIRECTORY */;
            case FileSystemProviderErrorCode.NoPermissions:
                return 6 /* FILE_PERMISSION_DENIED */;
            case FileSystemProviderErrorCode.FileExists:
                return 4 /* FILE_MOVE_CONFLICT */;
            case FileSystemProviderErrorCode.FileNotADirectory:
            default:
                return 10 /* FILE_OTHER_ERROR */;
        }
    }
    exports.toFileOperationResult = toFileOperationResult;
    var FileOperation;
    (function (FileOperation) {
        FileOperation[FileOperation["CREATE"] = 0] = "CREATE";
        FileOperation[FileOperation["DELETE"] = 1] = "DELETE";
        FileOperation[FileOperation["MOVE"] = 2] = "MOVE";
        FileOperation[FileOperation["COPY"] = 3] = "COPY";
    })(FileOperation = exports.FileOperation || (exports.FileOperation = {}));
    class FileOperationEvent {
        constructor(resource, operation, target) {
            this.resource = resource;
            this.operation = operation;
            this.target = target;
        }
        isOperation(operation) {
            return this.operation === operation;
        }
    }
    exports.FileOperationEvent = FileOperationEvent;
    /**
     * Possible changes that can occur to a file.
     */
    var FileChangeType;
    (function (FileChangeType) {
        FileChangeType[FileChangeType["UPDATED"] = 0] = "UPDATED";
        FileChangeType[FileChangeType["ADDED"] = 1] = "ADDED";
        FileChangeType[FileChangeType["DELETED"] = 2] = "DELETED";
    })(FileChangeType = exports.FileChangeType || (exports.FileChangeType = {}));
    class FileChangesEvent {
        constructor(changes) {
            this._changes = changes;
        }
        get changes() {
            return this._changes;
        }
        /**
         * Returns true if this change event contains the provided file with the given change type (if provided). In case of
         * type DELETED, this method will also return true if a folder got deleted that is the parent of the
         * provided file path.
         */
        contains(resource, type) {
            if (!resource) {
                return false;
            }
            const checkForChangeType = !types_1.isUndefinedOrNull(type);
            return this._changes.some(change => {
                if (checkForChangeType && change.type !== type) {
                    return false;
                }
                // For deleted also return true when deleted folder is parent of target path
                if (change.type === 2 /* DELETED */) {
                    return resources_1.isEqualOrParent(resource, change.resource);
                }
                return resources_1.isEqual(resource, change.resource);
            });
        }
        /**
         * Returns the changes that describe added files.
         */
        getAdded() {
            return this.getOfType(1 /* ADDED */);
        }
        /**
         * Returns if this event contains added files.
         */
        gotAdded() {
            return this.hasType(1 /* ADDED */);
        }
        /**
         * Returns the changes that describe deleted files.
         */
        getDeleted() {
            return this.getOfType(2 /* DELETED */);
        }
        /**
         * Returns if this event contains deleted files.
         */
        gotDeleted() {
            return this.hasType(2 /* DELETED */);
        }
        /**
         * Returns the changes that describe updated files.
         */
        getUpdated() {
            return this.getOfType(0 /* UPDATED */);
        }
        /**
         * Returns if this event contains updated files.
         */
        gotUpdated() {
            return this.hasType(0 /* UPDATED */);
        }
        getOfType(type) {
            return this._changes.filter(change => change.type === type);
        }
        hasType(type) {
            return this._changes.some(change => {
                return change.type === type;
            });
        }
    }
    exports.FileChangesEvent = FileChangesEvent;
    function isParent(path, candidate, ignoreCase) {
        if (!path || !candidate || path === candidate) {
            return false;
        }
        if (candidate.length > path.length) {
            return false;
        }
        if (candidate.charAt(candidate.length - 1) !== path_1.sep) {
            candidate += path_1.sep;
        }
        if (ignoreCase) {
            return strings_1.startsWithIgnoreCase(path, candidate);
        }
        return path.indexOf(candidate) === 0;
    }
    exports.isParent = isParent;
    class FileOperationError extends Error {
        constructor(message, fileOperationResult, options) {
            super(message);
            this.fileOperationResult = fileOperationResult;
            this.options = options;
        }
        static isFileOperationError(obj) {
            return obj instanceof Error && !types_1.isUndefinedOrNull(obj.fileOperationResult);
        }
    }
    exports.FileOperationError = FileOperationError;
    var FileOperationResult;
    (function (FileOperationResult) {
        FileOperationResult[FileOperationResult["FILE_IS_DIRECTORY"] = 0] = "FILE_IS_DIRECTORY";
        FileOperationResult[FileOperationResult["FILE_NOT_FOUND"] = 1] = "FILE_NOT_FOUND";
        FileOperationResult[FileOperationResult["FILE_NOT_MODIFIED_SINCE"] = 2] = "FILE_NOT_MODIFIED_SINCE";
        FileOperationResult[FileOperationResult["FILE_MODIFIED_SINCE"] = 3] = "FILE_MODIFIED_SINCE";
        FileOperationResult[FileOperationResult["FILE_MOVE_CONFLICT"] = 4] = "FILE_MOVE_CONFLICT";
        FileOperationResult[FileOperationResult["FILE_READ_ONLY"] = 5] = "FILE_READ_ONLY";
        FileOperationResult[FileOperationResult["FILE_PERMISSION_DENIED"] = 6] = "FILE_PERMISSION_DENIED";
        FileOperationResult[FileOperationResult["FILE_TOO_LARGE"] = 7] = "FILE_TOO_LARGE";
        FileOperationResult[FileOperationResult["FILE_INVALID_PATH"] = 8] = "FILE_INVALID_PATH";
        FileOperationResult[FileOperationResult["FILE_EXCEED_MEMORY_LIMIT"] = 9] = "FILE_EXCEED_MEMORY_LIMIT";
        FileOperationResult[FileOperationResult["FILE_OTHER_ERROR"] = 10] = "FILE_OTHER_ERROR";
    })(FileOperationResult = exports.FileOperationResult || (exports.FileOperationResult = {}));
    exports.AutoSaveConfiguration = {
        OFF: 'off',
        AFTER_DELAY: 'afterDelay',
        ON_FOCUS_CHANGE: 'onFocusChange',
        ON_WINDOW_CHANGE: 'onWindowChange'
    };
    exports.HotExitConfiguration = {
        OFF: 'off',
        ON_EXIT: 'onExit',
        ON_EXIT_AND_WINDOW_CLOSE: 'onExitAndWindowClose'
    };
    exports.CONTENT_CHANGE_EVENT_BUFFER_DELAY = 1000;
    exports.FILES_ASSOCIATIONS_CONFIG = 'files.associations';
    exports.FILES_EXCLUDE_CONFIG = 'files.exclude';
    var FileKind;
    (function (FileKind) {
        FileKind[FileKind["FILE"] = 0] = "FILE";
        FileKind[FileKind["FOLDER"] = 1] = "FOLDER";
        FileKind[FileKind["ROOT_FOLDER"] = 2] = "ROOT_FOLDER";
    })(FileKind = exports.FileKind || (exports.FileKind = {}));
    /**
     * A hint to disable etag checking for reading/writing.
     */
    exports.ETAG_DISABLED = '';
    function etag(stat) {
        if (typeof stat.size !== 'number' || typeof stat.mtime !== 'number') {
            return undefined;
        }
        return stat.mtime.toString(29) + stat.size.toString(31);
    }
    exports.etag = etag;
});
//# sourceMappingURL=files.js.map