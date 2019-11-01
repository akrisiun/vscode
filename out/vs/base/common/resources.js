/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/extpath", "vs/base/common/path", "vs/base/common/uri", "vs/base/common/strings", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/glob", "vs/base/common/map"], function (require, exports, extpath, paths, uri_1, strings_1, network_1, platform_1, glob_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getComparisonKey(resource) {
        return hasToIgnoreCase(resource) ? resource.toString().toLowerCase() : resource.toString();
    }
    exports.getComparisonKey = getComparisonKey;
    function hasToIgnoreCase(resource) {
        // A file scheme resource is in the same platform as code, so ignore case for non linux platforms
        // Resource can be from another platform. Lowering the case as an hack. Should come from File system provider
        return resource && resource.scheme === network_1.Schemas.file ? !platform_1.isLinux : true;
    }
    exports.hasToIgnoreCase = hasToIgnoreCase;
    function basenameOrAuthority(resource) {
        return basename(resource) || resource.authority;
    }
    exports.basenameOrAuthority = basenameOrAuthority;
    /**
     * Tests whether a `candidate` URI is a parent or equal of a given `base` URI.
     * @param base A uri which is "longer"
     * @param parentCandidate A uri which is "shorter" then `base`
     */
    function isEqualOrParent(base, parentCandidate, ignoreCase = hasToIgnoreCase(base)) {
        if (base.scheme === parentCandidate.scheme) {
            if (base.scheme === network_1.Schemas.file) {
                return extpath.isEqualOrParent(originalFSPath(base), originalFSPath(parentCandidate), ignoreCase);
            }
            if (isEqualAuthority(base.authority, parentCandidate.authority)) {
                return extpath.isEqualOrParent(base.path, parentCandidate.path, ignoreCase, '/');
            }
        }
        return false;
    }
    exports.isEqualOrParent = isEqualOrParent;
    /**
     * Tests wheter the two authorities are the same
     */
    function isEqualAuthority(a1, a2) {
        return a1 === a2 || strings_1.equalsIgnoreCase(a1, a2);
    }
    exports.isEqualAuthority = isEqualAuthority;
    function isEqual(first, second, ignoreCase = hasToIgnoreCase(first)) {
        if (first === second) {
            return true;
        }
        if (!first || !second) {
            return false;
        }
        if (first.scheme !== second.scheme || !isEqualAuthority(first.authority, second.authority)) {
            return false;
        }
        const p1 = first.path || '/', p2 = second.path || '/';
        return p1 === p2 || ignoreCase && strings_1.equalsIgnoreCase(p1 || '/', p2 || '/');
    }
    exports.isEqual = isEqual;
    function basename(resource) {
        return paths.posix.basename(resource.path);
    }
    exports.basename = basename;
    function extname(resource) {
        return paths.posix.extname(resource.path);
    }
    exports.extname = extname;
    /**
     * Return a URI representing the directory of a URI path.
     *
     * @param resource The input URI.
     * @returns The URI representing the directory of the input URI.
     */
    function dirname(resource) {
        if (resource.path.length === 0) {
            return resource;
        }
        if (resource.scheme === network_1.Schemas.file) {
            return uri_1.URI.file(paths.dirname(originalFSPath(resource)));
        }
        let dirname = paths.posix.dirname(resource.path);
        if (resource.authority && dirname.length && dirname.charCodeAt(0) !== 47 /* Slash */) {
            console.error(`dirname("${resource.toString})) resulted in a relative path`);
            dirname = '/'; // If a URI contains an authority component, then the path component must either be empty or begin with a CharCode.Slash ("/") character
        }
        return resource.with({
            path: dirname
        });
    }
    exports.dirname = dirname;
    /**
     * Join a URI path with path fragments and normalizes the resulting path.
     *
     * @param resource The input URI.
     * @param pathFragment The path fragment to add to the URI path.
     * @returns The resulting URI.
     */
    function joinPath(resource, ...pathFragment) {
        let joinedPath;
        if (resource.scheme === network_1.Schemas.file) {
            joinedPath = uri_1.URI.file(paths.join(originalFSPath(resource), ...pathFragment)).path;
        }
        else {
            joinedPath = paths.posix.join(resource.path || '/', ...pathFragment);
        }
        return resource.with({
            path: joinedPath
        });
    }
    exports.joinPath = joinPath;
    /**
     * Normalizes the path part of a URI: Resolves `.` and `..` elements with directory names.
     *
     * @param resource The URI to normalize the path.
     * @returns The URI with the normalized path.
     */
    function normalizePath(resource) {
        if (!resource.path.length) {
            return resource;
        }
        let normalizedPath;
        if (resource.scheme === network_1.Schemas.file) {
            normalizedPath = uri_1.URI.file(paths.normalize(originalFSPath(resource))).path;
        }
        else {
            normalizedPath = paths.posix.normalize(resource.path);
        }
        return resource.with({
            path: normalizedPath
        });
    }
    exports.normalizePath = normalizePath;
    /**
     * Returns the fsPath of an URI where the drive letter is not normalized.
     * See #56403.
     */
    function originalFSPath(uri) {
        let value;
        const uriPath = uri.path;
        if (uri.authority && uriPath.length > 1 && uri.scheme === network_1.Schemas.file) {
            // unc path: file://shares/c$/far/boo
            value = `//${uri.authority}${uriPath}`;
        }
        else if (platform_1.isWindows
            && uriPath.charCodeAt(0) === 47 /* Slash */
            && extpath.isWindowsDriveLetter(uriPath.charCodeAt(1))
            && uriPath.charCodeAt(2) === 58 /* Colon */) {
            value = uriPath.substr(1);
        }
        else {
            // other path
            value = uriPath;
        }
        if (platform_1.isWindows) {
            value = value.replace(/\//g, '\\');
        }
        return value;
    }
    exports.originalFSPath = originalFSPath;
    /**
     * Returns true if the URI path is absolute.
     */
    function isAbsolutePath(resource) {
        return !!resource.path && resource.path[0] === '/';
    }
    exports.isAbsolutePath = isAbsolutePath;
    /**
     * Returns true if the URI path has a trailing path separator
     */
    function hasTrailingPathSeparator(resource, sep = paths.sep) {
        if (resource.scheme === network_1.Schemas.file) {
            const fsp = originalFSPath(resource);
            return fsp.length > extpath.getRoot(fsp).length && fsp[fsp.length - 1] === sep;
        }
        else {
            const p = resource.path;
            return p.length > 1 && p.charCodeAt(p.length - 1) === 47 /* Slash */; // ignore the slash at offset 0
        }
    }
    exports.hasTrailingPathSeparator = hasTrailingPathSeparator;
    /**
     * Removes a trailing path separator, if there's one.
     * Important: Doesn't remove the first slash, it would make the URI invalid
     */
    function removeTrailingPathSeparator(resource, sep = paths.sep) {
        if (hasTrailingPathSeparator(resource, sep)) {
            return resource.with({ path: resource.path.substr(0, resource.path.length - 1) });
        }
        return resource;
    }
    exports.removeTrailingPathSeparator = removeTrailingPathSeparator;
    /**
     * Adds a trailing path separator to the URI if there isn't one already.
     * For example, c:\ would be unchanged, but c:\users would become c:\users\
     */
    function addTrailingPathSeparator(resource, sep = paths.sep) {
        let isRootSep = false;
        if (resource.scheme === network_1.Schemas.file) {
            const fsp = originalFSPath(resource);
            isRootSep = ((fsp !== undefined) && (fsp.length === extpath.getRoot(fsp).length) && (fsp[fsp.length - 1] === sep));
        }
        else {
            sep = '/';
            const p = resource.path;
            isRootSep = p.length === 1 && p.charCodeAt(p.length - 1) === 47 /* Slash */;
        }
        if (!isRootSep && !hasTrailingPathSeparator(resource, sep)) {
            return resource.with({ path: resource.path + '/' });
        }
        return resource;
    }
    exports.addTrailingPathSeparator = addTrailingPathSeparator;
    /**
     * Returns a relative path between two URIs. If the URIs don't have the same schema or authority, `undefined` is returned.
     * The returned relative path always uses forward slashes.
     */
    function relativePath(from, to, ignoreCase = hasToIgnoreCase(from)) {
        if (from.scheme !== to.scheme || !isEqualAuthority(from.authority, to.authority)) {
            return undefined;
        }
        if (from.scheme === network_1.Schemas.file) {
            const relativePath = paths.relative(from.path, to.path);
            return platform_1.isWindows ? extpath.toSlashes(relativePath) : relativePath;
        }
        let fromPath = from.path || '/', toPath = to.path || '/';
        if (ignoreCase) {
            // make casing of fromPath match toPath
            let i = 0;
            for (const len = Math.min(fromPath.length, toPath.length); i < len; i++) {
                if (fromPath.charCodeAt(i) !== toPath.charCodeAt(i)) {
                    if (fromPath.charAt(i).toLowerCase() !== toPath.charAt(i).toLowerCase()) {
                        break;
                    }
                }
            }
            fromPath = toPath.substr(0, i) + fromPath.substr(i);
        }
        return paths.posix.relative(fromPath, toPath);
    }
    exports.relativePath = relativePath;
    /**
     * Resolves a absolute or relative path against a base URI.
     */
    function resolvePath(base, path) {
        if (base.scheme === network_1.Schemas.file) {
            const newURI = uri_1.URI.file(paths.resolve(originalFSPath(base), path));
            return base.with({
                authority: newURI.authority,
                path: newURI.path
            });
        }
        return base.with({
            path: paths.posix.resolve(base.path, path)
        });
    }
    exports.resolvePath = resolvePath;
    function distinctParents(items, resourceAccessor) {
        const distinctParents = [];
        for (let i = 0; i < items.length; i++) {
            const candidateResource = resourceAccessor(items[i]);
            if (items.some((otherItem, index) => {
                if (index === i) {
                    return false;
                }
                return isEqualOrParent(candidateResource, resourceAccessor(otherItem));
            })) {
                continue;
            }
            distinctParents.push(items[i]);
        }
        return distinctParents;
    }
    exports.distinctParents = distinctParents;
    /**
     * Data URI related helpers.
     */
    var DataUri;
    (function (DataUri) {
        DataUri.META_DATA_LABEL = 'label';
        DataUri.META_DATA_DESCRIPTION = 'description';
        DataUri.META_DATA_SIZE = 'size';
        DataUri.META_DATA_MIME = 'mime';
        function parseMetaData(dataUri) {
            const metadata = new Map();
            // Given a URI of:  data:image/png;size:2313;label:SomeLabel;description:SomeDescription;base64,77+9UE5...
            // the metadata is: size:2313;label:SomeLabel;description:SomeDescription
            const meta = dataUri.path.substring(dataUri.path.indexOf(';') + 1, dataUri.path.lastIndexOf(';'));
            meta.split(';').forEach(property => {
                const [key, value] = property.split(':');
                if (key && value) {
                    metadata.set(key, value);
                }
            });
            // Given a URI of:  data:image/png;size:2313;label:SomeLabel;description:SomeDescription;base64,77+9UE5...
            // the mime is: image/png
            const mime = dataUri.path.substring(0, dataUri.path.indexOf(';'));
            if (mime) {
                metadata.set(DataUri.META_DATA_MIME, mime);
            }
            return metadata;
        }
        DataUri.parseMetaData = parseMetaData;
    })(DataUri = exports.DataUri || (exports.DataUri = {}));
    class ResourceGlobMatcher {
        constructor(globalExpression, rootExpressions) {
            this.expressionsByRoot = map_1.TernarySearchTree.forPaths();
            this.globalExpression = glob_1.parse(globalExpression);
            for (const expression of rootExpressions) {
                this.expressionsByRoot.set(expression.root.toString(), { root: expression.root, expression: glob_1.parse(expression.expression) });
            }
        }
        matches(resource) {
            const rootExpression = this.expressionsByRoot.findSubstr(resource.toString());
            if (rootExpression) {
                const path = relativePath(rootExpression.root, resource);
                if (path && !!rootExpression.expression(path)) {
                    return true;
                }
            }
            return !!this.globalExpression(resource.path);
        }
    }
    exports.ResourceGlobMatcher = ResourceGlobMatcher;
    function toLocalResource(resource, authority) {
        if (authority) {
            let path = resource.path;
            if (path && path[0] !== paths.posix.sep) {
                path = paths.posix.sep + path;
            }
            return resource.with({ scheme: network_1.Schemas.vscodeRemote, authority, path });
        }
        return resource.with({ scheme: network_1.Schemas.file });
    }
    exports.toLocalResource = toLocalResource;
});
//# sourceMappingURL=resources.js.map