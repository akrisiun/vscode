"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const dispose_1 = require("./util/dispose");
const arrays = require("./util/arrays");
const resolveExtensionResource = (extension, resourcePath) => {
    return vscode.Uri.file(path.join(extension.extensionPath, resourcePath));
};
const resolveExtensionResources = (extension, resourcePaths) => {
    const result = [];
    if (Array.isArray(resourcePaths)) {
        for (const resource of resourcePaths) {
            try {
                result.push(resolveExtensionResource(extension, resource));
            }
            catch (e) {
                // noop
            }
        }
    }
    return result;
};
var MarkdownContributions;
(function (MarkdownContributions) {
    MarkdownContributions.Empty = {
        previewScripts: [],
        previewStyles: [],
        previewResourceRoots: [],
        markdownItPlugins: new Map()
    };
    function merge(a, b) {
        return {
            previewScripts: [...a.previewScripts, ...b.previewScripts],
            previewStyles: [...a.previewStyles, ...b.previewStyles],
            previewResourceRoots: [...a.previewResourceRoots, ...b.previewResourceRoots],
            markdownItPlugins: new Map([...a.markdownItPlugins.entries(), ...b.markdownItPlugins.entries()]),
        };
    }
    MarkdownContributions.merge = merge;
    function uriEqual(a, b) {
        return a.toString() === b.toString();
    }
    function equal(a, b) {
        return arrays.equals(a.previewScripts, b.previewScripts, uriEqual)
            && arrays.equals(a.previewStyles, b.previewStyles, uriEqual)
            && arrays.equals(a.previewResourceRoots, b.previewResourceRoots, uriEqual)
            && arrays.equals(Array.from(a.markdownItPlugins.keys()), Array.from(b.markdownItPlugins.keys()));
    }
    MarkdownContributions.equal = equal;
    function fromExtension(extension) {
        const contributions = extension.packageJSON && extension.packageJSON.contributes;
        if (!contributions) {
            return MarkdownContributions.Empty;
        }
        const previewStyles = getContributedStyles(contributions, extension);
        const previewScripts = getContributedScripts(contributions, extension);
        const previewResourceRoots = previewStyles.length || previewScripts.length ? [vscode.Uri.file(extension.extensionPath)] : [];
        const markdownItPlugins = getContributedMarkdownItPlugins(contributions, extension);
        return {
            previewScripts,
            previewStyles,
            previewResourceRoots,
            markdownItPlugins
        };
    }
    MarkdownContributions.fromExtension = fromExtension;
    function getContributedMarkdownItPlugins(contributes, extension) {
        const map = new Map();
        if (contributes['markdown.markdownItPlugins']) {
            map.set(extension.id, extension.activate().then(() => {
                if (extension.exports && extension.exports.extendMarkdownIt) {
                    return (md) => extension.exports.extendMarkdownIt(md);
                }
                return (md) => md;
            }));
        }
        return map;
    }
    function getContributedScripts(contributes, extension) {
        return resolveExtensionResources(extension, contributes['markdown.previewScripts']);
    }
    function getContributedStyles(contributes, extension) {
        return resolveExtensionResources(extension, contributes['markdown.previewStyles']);
    }
})(MarkdownContributions = exports.MarkdownContributions || (exports.MarkdownContributions = {}));
class VSCodeExtensionMarkdownContributionProvider extends dispose_1.Disposable {
    constructor(extensionPath) {
        super();
        this.extensionPath = extensionPath;
        this._onContributionsChanged = this._register(new vscode.EventEmitter());
        this.onContributionsChanged = this._onContributionsChanged.event;
        vscode.extensions.onDidChange(() => {
            const currentContributions = this.getCurrentContributions();
            const existingContributions = this._contributions || MarkdownContributions.Empty;
            if (!MarkdownContributions.equal(existingContributions, currentContributions)) {
                this._contributions = currentContributions;
                this._onContributionsChanged.fire(this);
            }
        }, undefined, this._disposables);
    }
    get contributions() {
        if (!this._contributions) {
            this._contributions = this.getCurrentContributions();
        }
        return this._contributions;
    }
    getCurrentContributions() {
        return vscode.extensions.all
            .map(MarkdownContributions.fromExtension)
            .reduce(MarkdownContributions.merge, MarkdownContributions.Empty);
    }
}
function getMarkdownExtensionContributions(context) {
    return new VSCodeExtensionMarkdownContributionProvider(context.extensionPath);
}
exports.getMarkdownExtensionContributions = getMarkdownExtensionContributions;
//# sourceMappingURL=markdownExtensions.js.map