/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/modes"], function (require, exports, modes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewLineTokenFactory = exports.ViewLineTokens = exports.ViewLineToken = void 0;
    /**
     * A token on a line.
     */
    class ViewLineToken {
        constructor(endIndex, metadata) {
            this.endIndex = endIndex;
            this._metadata = metadata;
        }
        getForeground() {
            return modes_1.TokenMetadata.getForeground(this._metadata);
        }
        getType() {
            return modes_1.TokenMetadata.getClassNameFromMetadata(this._metadata);
        }
        getInlineStyle(colorMap) {
            return modes_1.TokenMetadata.getInlineStyleFromMetadata(this._metadata, colorMap);
        }
        static _equals(a, b) {
            return (a.endIndex === b.endIndex
                && a._metadata === b._metadata);
        }
        static equalsArr(a, b) {
            const aLen = a.length;
            const bLen = b.length;
            if (aLen !== bLen) {
                return false;
            }
            for (let i = 0; i < aLen; i++) {
                if (!this._equals(a[i], b[i])) {
                    return false;
                }
            }
            return true;
        }
    }
    exports.ViewLineToken = ViewLineToken;
    class ViewLineTokens {
        constructor(actual) {
            this._actual = actual;
        }
        equals(other) {
            if (other instanceof ViewLineTokens) {
                return ViewLineToken.equalsArr(this._actual, other._actual);
            }
            return false;
        }
        getCount() {
            return this._actual.length;
        }
        getForeground(tokenIndex) {
            return this._actual[tokenIndex].getForeground();
        }
        getEndOffset(tokenIndex) {
            return this._actual[tokenIndex].endIndex;
        }
        getClassName(tokenIndex) {
            return this._actual[tokenIndex].getType();
        }
        getInlineStyle(tokenIndex, colorMap) {
            return this._actual[tokenIndex].getInlineStyle(colorMap);
        }
        findTokenIndexAtOffset(offset) {
            throw new Error('Not implemented');
        }
    }
    exports.ViewLineTokens = ViewLineTokens;
    class ViewLineTokenFactory {
        static inflateArr(tokens) {
            const tokensCount = (tokens.length >>> 1);
            let result = new Array(tokensCount);
            for (let i = 0; i < tokensCount; i++) {
                const endOffset = tokens[i << 1];
                const metadata = tokens[(i << 1) + 1];
                result[i] = new ViewLineToken(endOffset, metadata);
            }
            return result;
        }
    }
    exports.ViewLineTokenFactory = ViewLineTokenFactory;
});
//# sourceMappingURL=viewLineToken.js.map