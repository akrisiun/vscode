/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays"], function (require, exports, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MarkdownString {
        constructor(value = '', isTrusted = false) {
            this._value = value;
            this._isTrusted = isTrusted;
        }
        get value() { return this._value; }
        get isTrusted() { return this._isTrusted; }
        appendText(value) {
            // escape markdown syntax tokens: http://daringfireball.net/projects/markdown/syntax#backslash
            this._value += value
                .replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&')
                .replace('\n', '\n\n');
            return this;
        }
        appendMarkdown(value) {
            this._value += value;
            return this;
        }
        appendCodeblock(langId, code) {
            this._value += '\n```';
            this._value += langId;
            this._value += '\n';
            this._value += code;
            this._value += '\n```\n';
            return this;
        }
    }
    exports.MarkdownString = MarkdownString;
    function isEmptyMarkdownString(oneOrMany) {
        if (isMarkdownString(oneOrMany)) {
            return !oneOrMany.value;
        }
        else if (Array.isArray(oneOrMany)) {
            return oneOrMany.every(isEmptyMarkdownString);
        }
        else {
            return true;
        }
    }
    exports.isEmptyMarkdownString = isEmptyMarkdownString;
    function isMarkdownString(thing) {
        if (thing instanceof MarkdownString) {
            return true;
        }
        else if (thing && typeof thing === 'object') {
            return typeof thing.value === 'string'
                && (typeof thing.isTrusted === 'boolean' || thing.isTrusted === undefined);
        }
        return false;
    }
    exports.isMarkdownString = isMarkdownString;
    function markedStringsEquals(a, b) {
        if (!a && !b) {
            return true;
        }
        else if (!a || !b) {
            return false;
        }
        else if (Array.isArray(a) && Array.isArray(b)) {
            return arrays_1.equals(a, b, markdownStringEqual);
        }
        else if (isMarkdownString(a) && isMarkdownString(b)) {
            return markdownStringEqual(a, b);
        }
        else {
            return false;
        }
    }
    exports.markedStringsEquals = markedStringsEquals;
    function markdownStringEqual(a, b) {
        if (a === b) {
            return true;
        }
        else if (!a || !b) {
            return false;
        }
        else {
            return a.value === b.value && a.isTrusted === b.isTrusted;
        }
    }
    function removeMarkdownEscapes(text) {
        if (!text) {
            return text;
        }
        return text.replace(/\\([\\`*_{}[\]()#+\-.!])/g, '$1');
    }
    exports.removeMarkdownEscapes = removeMarkdownEscapes;
    function parseHrefAndDimensions(href) {
        const dimensions = [];
        const splitted = href.split('|').map(s => s.trim());
        href = splitted[0];
        const parameters = splitted[1];
        if (parameters) {
            const heightFromParams = /height=(\d+)/.exec(parameters);
            const widthFromParams = /width=(\d+)/.exec(parameters);
            const height = heightFromParams ? heightFromParams[1] : '';
            const width = widthFromParams ? widthFromParams[1] : '';
            const widthIsFinite = isFinite(parseInt(width));
            const heightIsFinite = isFinite(parseInt(height));
            if (widthIsFinite) {
                dimensions.push(`width="${width}"`);
            }
            if (heightIsFinite) {
                dimensions.push(`height="${height}"`);
            }
        }
        return { href, dimensions };
    }
    exports.parseHrefAndDimensions = parseHrefAndDimensions;
});
//# sourceMappingURL=htmlContent.js.map