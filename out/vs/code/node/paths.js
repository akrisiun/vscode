/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/arrays", "vs/base/common/strings", "vs/base/common/extpath", "vs/base/common/platform", "vs/base/common/types"], function (require, exports, path, arrays, strings, extpath, platform, types) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function validatePaths(args) {
        // Track URLs if they're going to be used
        if (args['open-url']) {
            args._urls = args._;
            args._ = [];
        }
        if (!args['remote']) {
            // Normalize paths and watch out for goto line mode
            const paths = doValidatePaths(args._, args.goto);
            args._ = paths;
        }
        return args;
    }
    exports.validatePaths = validatePaths;
    function doValidatePaths(args, gotoLineMode) {
        const cwd = process.env['VSCODE_CWD'] || process.cwd();
        const result = args.map(arg => {
            let pathCandidate = String(arg);
            let parsedPath = undefined;
            if (gotoLineMode) {
                parsedPath = parseLineAndColumnAware(pathCandidate);
                pathCandidate = parsedPath.path;
            }
            if (pathCandidate) {
                pathCandidate = preparePath(cwd, pathCandidate);
            }
            const sanitizedFilePath = extpath.sanitizeFilePath(pathCandidate, cwd);
            const basename = path.basename(sanitizedFilePath);
            if (basename /* can be empty if code is opened on root */ && !extpath.isValidBasename(basename)) {
                return null; // do not allow invalid file names
            }
            if (gotoLineMode && parsedPath) {
                parsedPath.path = sanitizedFilePath;
                return toPath(parsedPath);
            }
            return sanitizedFilePath;
        });
        const caseInsensitive = platform.isWindows || platform.isMacintosh;
        const distinct = arrays.distinct(result, e => e && caseInsensitive ? e.toLowerCase() : (e || ''));
        return arrays.coalesce(distinct);
    }
    function preparePath(cwd, p) {
        // Trim trailing quotes
        if (platform.isWindows) {
            p = strings.rtrim(p, '"'); // https://github.com/Microsoft/vscode/issues/1498
        }
        // Trim whitespaces
        p = strings.trim(strings.trim(p, ' '), '\t');
        if (platform.isWindows) {
            // Resolve the path against cwd if it is relative
            p = path.resolve(cwd, p);
            // Trim trailing '.' chars on Windows to prevent invalid file names
            p = strings.rtrim(p, '.');
        }
        return p;
    }
    function parseLineAndColumnAware(rawPath) {
        const segments = rawPath.split(':'); // C:\file.txt:<line>:<column>
        let path = null;
        let line = null;
        let column = null;
        segments.forEach(segment => {
            const segmentAsNumber = Number(segment);
            if (!types.isNumber(segmentAsNumber)) {
                path = !!path ? [path, segment].join(':') : segment; // a colon can well be part of a path (e.g. C:\...)
            }
            else if (line === null) {
                line = segmentAsNumber;
            }
            else if (column === null) {
                column = segmentAsNumber;
            }
        });
        if (!path) {
            throw new Error('Format for `--goto` should be: `FILE:LINE(:COLUMN)`');
        }
        return {
            path: path,
            line: line !== null ? line : undefined,
            column: column !== null ? column : line !== null ? 1 : undefined // if we have a line, make sure column is also set
        };
    }
    exports.parseLineAndColumnAware = parseLineAndColumnAware;
    function toPath(p) {
        const segments = [p.path];
        if (types.isNumber(p.line)) {
            segments.push(String(p.line));
        }
        if (types.isNumber(p.column)) {
            segments.push(String(p.column));
        }
        return segments.join(':');
    }
});
//# sourceMappingURL=paths.js.map