/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/base/common/extpath", "vs/base/common/resources", "vs/base/common/strings", "vs/editor/common/core/range", "vs/base/common/platform", "vs/base/common/network"], function (require, exports, uri_1, extpath, resources, strings, range_1, platform_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class OutputLinkComputer {
        constructor(ctx, createData) {
            this.ctx = ctx;
            this.patterns = new Map();
            this.computePatterns(createData);
        }
        computePatterns(createData) {
            // Produce patterns for each workspace root we are configured with
            // This means that we will be able to detect links for paths that
            // contain any of the workspace roots as segments.
            const workspaceFolders = createData.workspaceFolders.map(r => uri_1.URI.parse(r));
            workspaceFolders.forEach(workspaceFolder => {
                const patterns = OutputLinkComputer.createPatterns(workspaceFolder);
                this.patterns.set(workspaceFolder, patterns);
            });
        }
        getModel(uri) {
            const models = this.ctx.getMirrorModels();
            for (const model of models) {
                if (model.uri.toString() === uri) {
                    return model;
                }
            }
            return null;
        }
        computeLinks(uri) {
            const model = this.getModel(uri);
            if (!model) {
                return Promise.resolve([]);
            }
            const links = [];
            const lines = model.getValue().split(/\r\n|\r|\n/);
            // For each workspace root patterns
            this.patterns.forEach((folderPatterns, folderUri) => {
                const resourceCreator = {
                    toResource: (folderRelativePath) => {
                        if (typeof folderRelativePath === 'string') {
                            return resources.joinPath(folderUri, folderRelativePath);
                        }
                        return null;
                    }
                };
                for (let i = 0, len = lines.length; i < len; i++) {
                    links.push(...OutputLinkComputer.detectLinks(lines[i], i + 1, folderPatterns, resourceCreator));
                }
            });
            return Promise.resolve(links);
        }
        static createPatterns(workspaceFolder) {
            const patterns = [];
            const workspaceFolderPath = workspaceFolder.scheme === network_1.Schemas.file ? workspaceFolder.fsPath : workspaceFolder.path;
            const workspaceFolderVariants = [workspaceFolderPath];
            if (platform_1.isWindows && workspaceFolder.scheme === network_1.Schemas.file) {
                workspaceFolderVariants.push(extpath.toSlashes(workspaceFolderPath));
            }
            workspaceFolderVariants.forEach(workspaceFolderVariant => {
                const validPathCharacterPattern = '[^\\s\\(\\):<>"]';
                const validPathCharacterOrSpacePattern = `(?:${validPathCharacterPattern}| ${validPathCharacterPattern})`;
                const pathPattern = `${validPathCharacterOrSpacePattern}+\\.${validPathCharacterPattern}+`;
                const strictPathPattern = `${validPathCharacterPattern}+`;
                // Example: /workspaces/express/server.js on line 8, column 13
                patterns.push(new RegExp(strings.escapeRegExpCharacters(workspaceFolderVariant) + `(${pathPattern}) on line ((\\d+)(, column (\\d+))?)`, 'gi'));
                // Example: /workspaces/express/server.js:line 8, column 13
                patterns.push(new RegExp(strings.escapeRegExpCharacters(workspaceFolderVariant) + `(${pathPattern}):line ((\\d+)(, column (\\d+))?)`, 'gi'));
                // Example: /workspaces/mankala/Features.ts(45): error
                // Example: /workspaces/mankala/Features.ts (45): error
                // Example: /workspaces/mankala/Features.ts(45,18): error
                // Example: /workspaces/mankala/Features.ts (45,18): error
                // Example: /workspaces/mankala/Features Special.ts (45,18): error
                patterns.push(new RegExp(strings.escapeRegExpCharacters(workspaceFolderVariant) + `(${pathPattern})(\\s?\\((\\d+)(,(\\d+))?)\\)`, 'gi'));
                // Example: at /workspaces/mankala/Game.ts
                // Example: at /workspaces/mankala/Game.ts:336
                // Example: at /workspaces/mankala/Game.ts:336:9
                patterns.push(new RegExp(strings.escapeRegExpCharacters(workspaceFolderVariant) + `(${strictPathPattern})(:(\\d+))?(:(\\d+))?`, 'gi'));
            });
            return patterns;
        }
        /**
         * Detect links. Made public static to allow for tests.
         */
        static detectLinks(line, lineIndex, patterns, resourceCreator) {
            const links = [];
            patterns.forEach(pattern => {
                pattern.lastIndex = 0; // the holy grail of software development
                let match;
                let offset = 0;
                while ((match = pattern.exec(line)) !== null) {
                    // Convert the relative path information to a resource that we can use in links
                    const folderRelativePath = strings.rtrim(match[1], '.').replace(/\\/g, '/'); // remove trailing "." that likely indicate end of sentence
                    let resourceString;
                    try {
                        const resource = resourceCreator.toResource(folderRelativePath);
                        if (resource) {
                            resourceString = resource.toString();
                        }
                    }
                    catch (error) {
                        continue; // we might find an invalid URI and then we dont want to loose all other links
                    }
                    // Append line/col information to URI if matching
                    if (match[3]) {
                        const lineNumber = match[3];
                        if (match[5]) {
                            const columnNumber = match[5];
                            resourceString = strings.format('{0}#{1},{2}', resourceString, lineNumber, columnNumber);
                        }
                        else {
                            resourceString = strings.format('{0}#{1}', resourceString, lineNumber);
                        }
                    }
                    const fullMatch = strings.rtrim(match[0], '.'); // remove trailing "." that likely indicate end of sentence
                    const index = line.indexOf(fullMatch, offset);
                    offset += index + fullMatch.length;
                    const linkRange = {
                        startColumn: index + 1,
                        startLineNumber: lineIndex,
                        endColumn: index + 1 + fullMatch.length,
                        endLineNumber: lineIndex
                    };
                    if (links.some(link => range_1.Range.areIntersectingOrTouching(link.range, linkRange))) {
                        return; // Do not detect duplicate links
                    }
                    links.push({
                        range: linkRange,
                        url: resourceString
                    });
                }
            });
            return links;
        }
    }
    exports.OutputLinkComputer = OutputLinkComputer;
    function create(ctx, createData) {
        return new OutputLinkComputer(ctx, createData);
    }
    exports.create = create;
});
//# sourceMappingURL=outputLinkComputer.js.map