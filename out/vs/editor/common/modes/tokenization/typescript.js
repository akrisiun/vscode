/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parse = void 0;
    class ParserContext {
        constructor(text) {
            this.text = text;
            this.len = this.text.length;
            this.tokens = [];
            this.pos = 0;
            this.currentTokenStartOffset = 0;
            this.currentTokenType = 0 /* Other */;
        }
        _safeCharCodeAt(index) {
            if (index >= this.len) {
                return 0 /* Null */;
            }
            return this.text.charCodeAt(index);
        }
        peek(distance = 0) {
            return this._safeCharCodeAt(this.pos + distance);
        }
        next() {
            const result = this._safeCharCodeAt(this.pos);
            this.pos++;
            return result;
        }
        advance(distance) {
            this.pos += distance;
        }
        eof() {
            return this.pos >= this.len;
        }
        beginToken(tokenType, deltaPos = 0) {
            this.currentTokenStartOffset = this.pos + deltaPos;
            this.currentTokenType = tokenType;
        }
        endToken(deltaPos = 0) {
            const length = this.pos + deltaPos - this.currentTokenStartOffset;
            // check if it is touching previous token
            if (this.tokens.length > 0) {
                const previousStartOffset = this.tokens[this.tokens.length - 3];
                const previousLength = this.tokens[this.tokens.length - 2];
                const previousTokenType = this.tokens[this.tokens.length - 1];
                const previousEndOffset = previousStartOffset + previousLength;
                if (this.currentTokenStartOffset === previousEndOffset && previousTokenType === this.currentTokenType) {
                    // extend previous token
                    this.tokens[this.tokens.length - 2] += length;
                    return;
                }
            }
            this.tokens.push(this.currentTokenStartOffset, length, this.currentTokenType);
        }
    }
    function parse(text) {
        const ctx = new ParserContext(text);
        while (!ctx.eof()) {
            parseRoot(ctx);
        }
        return ctx.tokens;
    }
    exports.parse = parse;
    function parseRoot(ctx) {
        let curlyCount = 0;
        while (!ctx.eof()) {
            const ch = ctx.peek();
            switch (ch) {
                case 39 /* SingleQuote */:
                    parseSimpleString(ctx, 39 /* SingleQuote */);
                    break;
                case 34 /* DoubleQuote */:
                    parseSimpleString(ctx, 34 /* DoubleQuote */);
                    break;
                case 96 /* BackTick */:
                    parseInterpolatedString(ctx);
                    break;
                case 47 /* Slash */:
                    parseSlash(ctx);
                    break;
                case 123 /* OpenCurlyBrace */:
                    ctx.advance(1);
                    curlyCount++;
                    break;
                case 125 /* CloseCurlyBrace */:
                    ctx.advance(1);
                    curlyCount--;
                    if (curlyCount < 0) {
                        return;
                    }
                    break;
                default:
                    ctx.advance(1);
            }
        }
    }
    function parseSimpleString(ctx, closingQuote) {
        ctx.beginToken(2 /* String */);
        // skip the opening quote
        ctx.advance(1);
        while (!ctx.eof()) {
            const ch = ctx.next();
            if (ch === 92 /* Backslash */) {
                // skip \r\n or any other character following a backslash
                const advanceCount = (ctx.peek() === 13 /* CarriageReturn */ && ctx.peek(1) === 10 /* LineFeed */ ? 2 : 1);
                ctx.advance(advanceCount);
            }
            else if (ch === closingQuote) {
                // hit end quote, so stop
                break;
            }
        }
        ctx.endToken();
    }
    function parseInterpolatedString(ctx) {
        ctx.beginToken(2 /* String */);
        // skip the opening quote
        ctx.advance(1);
        while (!ctx.eof()) {
            const ch = ctx.next();
            if (ch === 92 /* Backslash */) {
                // skip \r\n or any other character following a backslash
                const advanceCount = (ctx.peek() === 13 /* CarriageReturn */ && ctx.peek(1) === 10 /* LineFeed */ ? 2 : 1);
                ctx.advance(advanceCount);
            }
            else if (ch === 96 /* BackTick */) {
                // hit end quote, so stop
                break;
            }
            else if (ch === 36 /* DollarSign */) {
                if (ctx.peek() === 123 /* OpenCurlyBrace */) {
                    ctx.advance(1);
                    ctx.endToken();
                    parseRoot(ctx);
                    ctx.beginToken(2 /* String */, -1);
                }
            }
        }
        ctx.endToken();
    }
    function parseSlash(ctx) {
        const nextCh = ctx.peek(1);
        if (nextCh === 42 /* Asterisk */) {
            parseMultiLineComment(ctx);
            return;
        }
        if (nextCh === 47 /* Slash */) {
            parseSingleLineComment(ctx);
            return;
        }
        if (tryParseRegex(ctx)) {
            return;
        }
        ctx.advance(1);
    }
    function tryParseRegex(ctx) {
        // See https://www.ecma-international.org/ecma-262/10.0/index.html#prod-RegularExpressionLiteral
        // TODO: avoid regex...
        let contentBefore = ctx.text.substr(ctx.pos - 100, 100);
        if (/[a-zA-Z0-9](\s*)$/.test(contentBefore)) {
            // Cannot start after an identifier
            return false;
        }
        let pos = 0;
        let len = ctx.len - ctx.pos;
        let inClass = false;
        // skip /
        pos++;
        while (pos < len) {
            const ch = ctx.peek(pos++);
            if (ch === 13 /* CarriageReturn */ || ch === 10 /* LineFeed */) {
                return false;
            }
            if (ch === 92 /* Backslash */) {
                const nextCh = ctx.peek();
                if (nextCh === 13 /* CarriageReturn */ || nextCh === 10 /* LineFeed */) {
                    return false;
                }
                // skip next character
                pos++;
                continue;
            }
            if (inClass) {
                if (ch === 93 /* CloseSquareBracket */) {
                    inClass = false;
                    continue;
                }
            }
            else {
                if (ch === 47 /* Slash */) {
                    // cannot be directly followed by a /
                    if (ctx.peek(pos) === 47 /* Slash */) {
                        return false;
                    }
                    // consume flags
                    do {
                        let nextCh = ctx.peek(pos);
                        if (nextCh >= 97 /* a */ && nextCh <= 122 /* z */) {
                            pos++;
                            continue;
                        }
                        else {
                            break;
                        }
                    } while (true);
                    // TODO: avoid regex...
                    if (/^(\s*)(\.|;|\/|,|\)|\]|\}|$)/.test(ctx.text.substr(ctx.pos + pos))) {
                        // Must be followed by an operator of kinds
                        ctx.beginToken(4 /* RegEx */);
                        ctx.advance(pos);
                        ctx.endToken();
                        return true;
                    }
                    return false;
                }
                if (ch === 91 /* OpenSquareBracket */) {
                    inClass = true;
                    continue;
                }
            }
        }
        return false;
    }
    function parseMultiLineComment(ctx) {
        ctx.beginToken(1 /* Comment */);
        // skip the /*
        ctx.advance(2);
        while (!ctx.eof()) {
            const ch = ctx.next();
            if (ch === 42 /* Asterisk */) {
                if (ctx.peek() === 47 /* Slash */) {
                    ctx.advance(1);
                    break;
                }
            }
        }
        ctx.endToken();
    }
    function parseSingleLineComment(ctx) {
        ctx.beginToken(1 /* Comment */);
        // skip the //
        ctx.advance(2);
        while (!ctx.eof()) {
            const ch = ctx.next();
            if (ch === 13 /* CarriageReturn */ || ch === 10 /* LineFeed */) {
                break;
            }
        }
        ctx.endToken();
    }
});
//# sourceMappingURL=typescript.js.map