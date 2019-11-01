/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "vs/base/common/path", "vs/base/common/normalization", "vs/base/common/objects", "vs/base/common/extpath", "vs/base/common/platform", "vs/base/common/strings", "vs/workbench/services/search/node/ripgrepSearchUtils", "vscode-ripgrep"], function (require, exports, cp, path, normalization_1, objects, extpath, platform_1, strings, ripgrepSearchUtils_1, vscode_ripgrep_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // If vscode-ripgrep is in an .asar file, then the binary is unpacked.
    const rgDiskPath = vscode_ripgrep_1.rgPath.replace(/\bnode_modules\.asar\b/, 'node_modules.asar.unpacked');
    function spawnRipgrepCmd(config, folderQuery, includePattern, excludePattern) {
        const rgArgs = getRgArgs(config, folderQuery, includePattern, excludePattern);
        const cwd = folderQuery.folder.fsPath;
        return {
            cmd: cp.spawn(rgDiskPath, rgArgs.args, { cwd }),
            siblingClauses: rgArgs.siblingClauses,
            rgArgs,
            cwd
        };
    }
    exports.spawnRipgrepCmd = spawnRipgrepCmd;
    function getRgArgs(config, folderQuery, includePattern, excludePattern) {
        const args = ['--files', '--hidden', '--case-sensitive'];
        // includePattern can't have siblingClauses
        foldersToIncludeGlobs([folderQuery], includePattern, false).forEach(globArg => {
            const inclusion = ripgrepSearchUtils_1.anchorGlob(globArg);
            args.push('-g', inclusion);
            if (platform_1.isMacintosh) {
                const normalized = normalization_1.normalizeNFD(inclusion);
                if (normalized !== inclusion) {
                    args.push('-g', normalized);
                }
            }
        });
        const rgGlobs = foldersToRgExcludeGlobs([folderQuery], excludePattern, undefined, false);
        rgGlobs.globArgs.forEach(globArg => {
            const exclusion = `!${ripgrepSearchUtils_1.anchorGlob(globArg)}`;
            args.push('-g', exclusion);
            if (platform_1.isMacintosh) {
                const normalized = normalization_1.normalizeNFD(exclusion);
                if (normalized !== exclusion) {
                    args.push('-g', normalized);
                }
            }
        });
        if (folderQuery.disregardIgnoreFiles !== false) {
            // Don't use .gitignore or .ignore
            args.push('--no-ignore');
        }
        else {
            args.push('--no-ignore-parent');
        }
        // Follow symlinks
        if (!folderQuery.ignoreSymlinks) {
            args.push('--follow');
        }
        if (config.exists) {
            args.push('--quiet');
        }
        args.push('--no-config');
        if (folderQuery.disregardGlobalIgnoreFiles) {
            args.push('--no-ignore-global');
        }
        return {
            args,
            siblingClauses: rgGlobs.siblingClauses
        };
    }
    function foldersToRgExcludeGlobs(folderQueries, globalExclude, excludesToSkip, absoluteGlobs = true) {
        const globArgs = [];
        let siblingClauses = {};
        folderQueries.forEach(folderQuery => {
            const totalExcludePattern = objects.assign({}, folderQuery.excludePattern || {}, globalExclude || {});
            const result = globExprsToRgGlobs(totalExcludePattern, absoluteGlobs ? folderQuery.folder.fsPath : undefined, excludesToSkip);
            globArgs.push(...result.globArgs);
            if (result.siblingClauses) {
                siblingClauses = objects.assign(siblingClauses, result.siblingClauses);
            }
        });
        return { globArgs, siblingClauses };
    }
    exports.foldersToRgExcludeGlobs = foldersToRgExcludeGlobs;
    function foldersToIncludeGlobs(folderQueries, globalInclude, absoluteGlobs = true) {
        const globArgs = [];
        folderQueries.forEach(folderQuery => {
            const totalIncludePattern = objects.assign({}, globalInclude || {}, folderQuery.includePattern || {});
            const result = globExprsToRgGlobs(totalIncludePattern, absoluteGlobs ? folderQuery.folder.fsPath : undefined);
            globArgs.push(...result.globArgs);
        });
        return globArgs;
    }
    exports.foldersToIncludeGlobs = foldersToIncludeGlobs;
    function globExprsToRgGlobs(patterns, folder, excludesToSkip) {
        const globArgs = [];
        const siblingClauses = {};
        Object.keys(patterns)
            .forEach(key => {
            if (excludesToSkip && excludesToSkip.has(key)) {
                return;
            }
            if (!key) {
                return;
            }
            const value = patterns[key];
            key = trimTrailingSlash(folder ? getAbsoluteGlob(folder, key) : key);
            // glob.ts requires forward slashes, but a UNC path still must start with \\
            // #38165 and #38151
            if (strings.startsWith(key, '\\\\')) {
                key = '\\\\' + key.substr(2).replace(/\\/g, '/');
            }
            else {
                key = key.replace(/\\/g, '/');
            }
            if (typeof value === 'boolean' && value) {
                if (strings.startsWith(key, '\\\\')) {
                    // Absolute globs UNC paths don't work properly, see #58758
                    key += '**';
                }
                globArgs.push(fixDriveC(key));
            }
            else if (value && value.when) {
                siblingClauses[key] = value;
            }
        });
        return { globArgs, siblingClauses };
    }
    /**
     * Resolves a glob like "node_modules/**" in "/foo/bar" to "/foo/bar/node_modules/**".
     * Special cases C:/foo paths to write the glob like /foo instead - see https://github.com/BurntSushi/ripgrep/issues/530.
     *
     * Exported for testing
     */
    function getAbsoluteGlob(folder, key) {
        return path.isAbsolute(key) ?
            key :
            path.join(folder, key);
    }
    exports.getAbsoluteGlob = getAbsoluteGlob;
    function trimTrailingSlash(str) {
        str = strings.rtrim(str, '\\');
        return strings.rtrim(str, '/');
    }
    function fixDriveC(path) {
        const root = extpath.getRoot(path);
        return root.toLowerCase() === 'c:/' ?
            path.replace(/^c:[/\\]/i, '/') :
            path;
    }
    exports.fixDriveC = fixDriveC;
});
//# sourceMappingURL=ripgrepFileSearch.js.map