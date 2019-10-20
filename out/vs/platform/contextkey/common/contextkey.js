/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/platform/instantiation/common/instantiation"], function (require, exports, strings_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ContextKeyExprType;
    (function (ContextKeyExprType) {
        ContextKeyExprType[ContextKeyExprType["Defined"] = 1] = "Defined";
        ContextKeyExprType[ContextKeyExprType["Not"] = 2] = "Not";
        ContextKeyExprType[ContextKeyExprType["Equals"] = 3] = "Equals";
        ContextKeyExprType[ContextKeyExprType["NotEquals"] = 4] = "NotEquals";
        ContextKeyExprType[ContextKeyExprType["And"] = 5] = "And";
        ContextKeyExprType[ContextKeyExprType["Regex"] = 6] = "Regex";
        ContextKeyExprType[ContextKeyExprType["NotRegex"] = 7] = "NotRegex";
        ContextKeyExprType[ContextKeyExprType["Or"] = 8] = "Or";
    })(ContextKeyExprType = exports.ContextKeyExprType || (exports.ContextKeyExprType = {}));
    class ContextKeyExpr {
        static has(key) {
            return ContextKeyDefinedExpr.create(key);
        }
        static equals(key, value) {
            return ContextKeyEqualsExpr.create(key, value);
        }
        static notEquals(key, value) {
            return ContextKeyNotEqualsExpr.create(key, value);
        }
        static regex(key, value) {
            return ContextKeyRegexExpr.create(key, value);
        }
        static not(key) {
            return ContextKeyNotExpr.create(key);
        }
        static and(...expr) {
            return ContextKeyAndExpr.create(expr);
        }
        static or(...expr) {
            return ContextKeyOrExpr.create(expr);
        }
        static deserialize(serialized, strict = false) {
            if (!serialized) {
                return undefined;
            }
            return this._deserializeOrExpression(serialized, strict);
        }
        static _deserializeOrExpression(serialized, strict) {
            let pieces = serialized.split('||');
            return ContextKeyOrExpr.create(pieces.map(p => this._deserializeAndExpression(p, strict)));
        }
        static _deserializeAndExpression(serialized, strict) {
            let pieces = serialized.split('&&');
            return ContextKeyAndExpr.create(pieces.map(p => this._deserializeOne(p, strict)));
        }
        static _deserializeOne(serializedOne, strict) {
            serializedOne = serializedOne.trim();
            if (serializedOne.indexOf('!=') >= 0) {
                let pieces = serializedOne.split('!=');
                return ContextKeyNotEqualsExpr.create(pieces[0].trim(), this._deserializeValue(pieces[1], strict));
            }
            if (serializedOne.indexOf('==') >= 0) {
                let pieces = serializedOne.split('==');
                return ContextKeyEqualsExpr.create(pieces[0].trim(), this._deserializeValue(pieces[1], strict));
            }
            if (serializedOne.indexOf('=~') >= 0) {
                let pieces = serializedOne.split('=~');
                return ContextKeyRegexExpr.create(pieces[0].trim(), this._deserializeRegexValue(pieces[1], strict));
            }
            if (/^\!\s*/.test(serializedOne)) {
                return ContextKeyNotExpr.create(serializedOne.substr(1).trim());
            }
            return ContextKeyDefinedExpr.create(serializedOne);
        }
        static _deserializeValue(serializedValue, strict) {
            serializedValue = serializedValue.trim();
            if (serializedValue === 'true') {
                return true;
            }
            if (serializedValue === 'false') {
                return false;
            }
            let m = /^'([^']*)'$/.exec(serializedValue);
            if (m) {
                return m[1].trim();
            }
            return serializedValue;
        }
        static _deserializeRegexValue(serializedValue, strict) {
            if (strings_1.isFalsyOrWhitespace(serializedValue)) {
                if (strict) {
                    throw new Error('missing regexp-value for =~-expression');
                }
                else {
                    console.warn('missing regexp-value for =~-expression');
                }
                return null;
            }
            let start = serializedValue.indexOf('/');
            let end = serializedValue.lastIndexOf('/');
            if (start === end || start < 0 /* || to < 0 */) {
                if (strict) {
                    throw new Error(`bad regexp-value '${serializedValue}', missing /-enclosure`);
                }
                else {
                    console.warn(`bad regexp-value '${serializedValue}', missing /-enclosure`);
                }
                return null;
            }
            let value = serializedValue.slice(start + 1, end);
            let caseIgnoreFlag = serializedValue[end + 1] === 'i' ? 'i' : '';
            try {
                return new RegExp(value, caseIgnoreFlag);
            }
            catch (e) {
                if (strict) {
                    throw new Error(`bad regexp-value '${serializedValue}', parse error: ${e}`);
                }
                else {
                    console.warn(`bad regexp-value '${serializedValue}', parse error: ${e}`);
                }
                return null;
            }
        }
    }
    exports.ContextKeyExpr = ContextKeyExpr;
    function cmp(a, b) {
        let aType = a.getType();
        let bType = b.getType();
        if (aType !== bType) {
            return aType - bType;
        }
        switch (aType) {
            case 1 /* Defined */:
                return a.cmp(b);
            case 2 /* Not */:
                return a.cmp(b);
            case 3 /* Equals */:
                return a.cmp(b);
            case 4 /* NotEquals */:
                return a.cmp(b);
            case 6 /* Regex */:
                return a.cmp(b);
            case 7 /* NotRegex */:
                return a.cmp(b);
            case 5 /* And */:
                return a.cmp(b);
            default:
                throw new Error('Unknown ContextKeyExpr!');
        }
    }
    class ContextKeyDefinedExpr {
        constructor(key) {
            this.key = key;
        }
        static create(key) {
            return new ContextKeyDefinedExpr(key);
        }
        getType() {
            return 1 /* Defined */;
        }
        cmp(other) {
            if (this.key < other.key) {
                return -1;
            }
            if (this.key > other.key) {
                return 1;
            }
            return 0;
        }
        equals(other) {
            if (other instanceof ContextKeyDefinedExpr) {
                return (this.key === other.key);
            }
            return false;
        }
        evaluate(context) {
            return (!!context.getValue(this.key));
        }
        serialize() {
            return this.key;
        }
        keys() {
            return [this.key];
        }
        map(mapFnc) {
            return mapFnc.mapDefined(this.key);
        }
        negate() {
            return ContextKeyNotExpr.create(this.key);
        }
    }
    exports.ContextKeyDefinedExpr = ContextKeyDefinedExpr;
    class ContextKeyEqualsExpr {
        constructor(key, value) {
            this.key = key;
            this.value = value;
        }
        static create(key, value) {
            if (typeof value === 'boolean') {
                if (value) {
                    return ContextKeyDefinedExpr.create(key);
                }
                return ContextKeyNotExpr.create(key);
            }
            return new ContextKeyEqualsExpr(key, value);
        }
        getType() {
            return 3 /* Equals */;
        }
        cmp(other) {
            if (this.key < other.key) {
                return -1;
            }
            if (this.key > other.key) {
                return 1;
            }
            if (this.value < other.value) {
                return -1;
            }
            if (this.value > other.value) {
                return 1;
            }
            return 0;
        }
        equals(other) {
            if (other instanceof ContextKeyEqualsExpr) {
                return (this.key === other.key && this.value === other.value);
            }
            return false;
        }
        evaluate(context) {
            /* tslint:disable:triple-equals */
            // Intentional ==
            return (context.getValue(this.key) == this.value);
            /* tslint:enable:triple-equals */
        }
        serialize() {
            return this.key + ' == \'' + this.value + '\'';
        }
        keys() {
            return [this.key];
        }
        map(mapFnc) {
            return mapFnc.mapEquals(this.key, this.value);
        }
        negate() {
            return ContextKeyNotEqualsExpr.create(this.key, this.value);
        }
    }
    exports.ContextKeyEqualsExpr = ContextKeyEqualsExpr;
    class ContextKeyNotEqualsExpr {
        constructor(key, value) {
            this.key = key;
            this.value = value;
        }
        static create(key, value) {
            if (typeof value === 'boolean') {
                if (value) {
                    return ContextKeyNotExpr.create(key);
                }
                return ContextKeyDefinedExpr.create(key);
            }
            return new ContextKeyNotEqualsExpr(key, value);
        }
        getType() {
            return 4 /* NotEquals */;
        }
        cmp(other) {
            if (this.key < other.key) {
                return -1;
            }
            if (this.key > other.key) {
                return 1;
            }
            if (this.value < other.value) {
                return -1;
            }
            if (this.value > other.value) {
                return 1;
            }
            return 0;
        }
        equals(other) {
            if (other instanceof ContextKeyNotEqualsExpr) {
                return (this.key === other.key && this.value === other.value);
            }
            return false;
        }
        evaluate(context) {
            /* tslint:disable:triple-equals */
            // Intentional !=
            return (context.getValue(this.key) != this.value);
            /* tslint:enable:triple-equals */
        }
        serialize() {
            return this.key + ' != \'' + this.value + '\'';
        }
        keys() {
            return [this.key];
        }
        map(mapFnc) {
            return mapFnc.mapNotEquals(this.key, this.value);
        }
        negate() {
            return ContextKeyEqualsExpr.create(this.key, this.value);
        }
    }
    exports.ContextKeyNotEqualsExpr = ContextKeyNotEqualsExpr;
    class ContextKeyNotExpr {
        constructor(key) {
            this.key = key;
        }
        static create(key) {
            return new ContextKeyNotExpr(key);
        }
        getType() {
            return 2 /* Not */;
        }
        cmp(other) {
            if (this.key < other.key) {
                return -1;
            }
            if (this.key > other.key) {
                return 1;
            }
            return 0;
        }
        equals(other) {
            if (other instanceof ContextKeyNotExpr) {
                return (this.key === other.key);
            }
            return false;
        }
        evaluate(context) {
            return (!context.getValue(this.key));
        }
        serialize() {
            return '!' + this.key;
        }
        keys() {
            return [this.key];
        }
        map(mapFnc) {
            return mapFnc.mapNot(this.key);
        }
        negate() {
            return ContextKeyDefinedExpr.create(this.key);
        }
    }
    exports.ContextKeyNotExpr = ContextKeyNotExpr;
    class ContextKeyRegexExpr {
        constructor(key, regexp) {
            this.key = key;
            this.regexp = regexp;
            //
        }
        static create(key, regexp) {
            return new ContextKeyRegexExpr(key, regexp);
        }
        getType() {
            return 6 /* Regex */;
        }
        cmp(other) {
            if (this.key < other.key) {
                return -1;
            }
            if (this.key > other.key) {
                return 1;
            }
            const thisSource = this.regexp ? this.regexp.source : '';
            const otherSource = other.regexp ? other.regexp.source : '';
            if (thisSource < otherSource) {
                return -1;
            }
            if (thisSource > otherSource) {
                return 1;
            }
            return 0;
        }
        equals(other) {
            if (other instanceof ContextKeyRegexExpr) {
                const thisSource = this.regexp ? this.regexp.source : '';
                const otherSource = other.regexp ? other.regexp.source : '';
                return (this.key === other.key && thisSource === otherSource);
            }
            return false;
        }
        evaluate(context) {
            let value = context.getValue(this.key);
            return this.regexp ? this.regexp.test(value) : false;
        }
        serialize() {
            const value = this.regexp
                ? `/${this.regexp.source}/${this.regexp.ignoreCase ? 'i' : ''}`
                : '/invalid/';
            return `${this.key} =~ ${value}`;
        }
        keys() {
            return [this.key];
        }
        map(mapFnc) {
            return mapFnc.mapRegex(this.key, this.regexp);
        }
        negate() {
            return ContextKeyNotRegexExpr.create(this);
        }
    }
    exports.ContextKeyRegexExpr = ContextKeyRegexExpr;
    class ContextKeyNotRegexExpr {
        constructor(_actual) {
            this._actual = _actual;
            //
        }
        static create(actual) {
            return new ContextKeyNotRegexExpr(actual);
        }
        getType() {
            return 7 /* NotRegex */;
        }
        cmp(other) {
            return this._actual.cmp(other._actual);
        }
        equals(other) {
            if (other instanceof ContextKeyNotRegexExpr) {
                return this._actual.equals(other._actual);
            }
            return false;
        }
        evaluate(context) {
            return !this._actual.evaluate(context);
        }
        serialize() {
            throw new Error('Method not implemented.');
        }
        keys() {
            return this._actual.keys();
        }
        map(mapFnc) {
            return new ContextKeyNotRegexExpr(this._actual.map(mapFnc));
        }
        negate() {
            return this._actual;
        }
    }
    exports.ContextKeyNotRegexExpr = ContextKeyNotRegexExpr;
    class ContextKeyAndExpr {
        constructor(expr) {
            this.expr = expr;
        }
        static create(_expr) {
            const expr = ContextKeyAndExpr._normalizeArr(_expr);
            if (expr.length === 0) {
                return undefined;
            }
            if (expr.length === 1) {
                return expr[0];
            }
            return new ContextKeyAndExpr(expr);
        }
        getType() {
            return 5 /* And */;
        }
        cmp(other) {
            if (this.expr.length < other.expr.length) {
                return -1;
            }
            if (this.expr.length > other.expr.length) {
                return 1;
            }
            for (let i = 0, len = this.expr.length; i < len; i++) {
                const r = cmp(this.expr[i], other.expr[i]);
                if (r !== 0) {
                    return r;
                }
            }
            return 0;
        }
        equals(other) {
            if (other instanceof ContextKeyAndExpr) {
                if (this.expr.length !== other.expr.length) {
                    return false;
                }
                for (let i = 0, len = this.expr.length; i < len; i++) {
                    if (!this.expr[i].equals(other.expr[i])) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        }
        evaluate(context) {
            for (let i = 0, len = this.expr.length; i < len; i++) {
                if (!this.expr[i].evaluate(context)) {
                    return false;
                }
            }
            return true;
        }
        static _normalizeArr(arr) {
            let expr = [];
            if (arr) {
                for (let i = 0, len = arr.length; i < len; i++) {
                    let e = arr[i];
                    if (!e) {
                        continue;
                    }
                    if (e instanceof ContextKeyAndExpr) {
                        expr = expr.concat(e.expr);
                        continue;
                    }
                    if (e instanceof ContextKeyOrExpr) {
                        // Not allowed, because we don't have parens!
                        throw new Error(`It is not allowed to have an or expression here due to lack of parens!`);
                    }
                    expr.push(e);
                }
                expr.sort(cmp);
            }
            return expr;
        }
        serialize() {
            return this.expr.map(e => e.serialize()).join(' && ');
        }
        keys() {
            const result = [];
            for (let expr of this.expr) {
                result.push(...expr.keys());
            }
            return result;
        }
        map(mapFnc) {
            return new ContextKeyAndExpr(this.expr.map(expr => expr.map(mapFnc)));
        }
        negate() {
            let result = [];
            for (let expr of this.expr) {
                result.push(expr.negate());
            }
            return ContextKeyOrExpr.create(result);
        }
    }
    exports.ContextKeyAndExpr = ContextKeyAndExpr;
    class ContextKeyOrExpr {
        constructor(expr) {
            this.expr = expr;
        }
        static create(_expr) {
            const expr = ContextKeyOrExpr._normalizeArr(_expr);
            if (expr.length === 0) {
                return undefined;
            }
            if (expr.length === 1) {
                return expr[0];
            }
            return new ContextKeyOrExpr(expr);
        }
        getType() {
            return 8 /* Or */;
        }
        equals(other) {
            if (other instanceof ContextKeyOrExpr) {
                if (this.expr.length !== other.expr.length) {
                    return false;
                }
                for (let i = 0, len = this.expr.length; i < len; i++) {
                    if (!this.expr[i].equals(other.expr[i])) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        }
        evaluate(context) {
            for (let i = 0, len = this.expr.length; i < len; i++) {
                if (this.expr[i].evaluate(context)) {
                    return true;
                }
            }
            return false;
        }
        static _normalizeArr(arr) {
            let expr = [];
            if (arr) {
                for (let i = 0, len = arr.length; i < len; i++) {
                    let e = arr[i];
                    if (!e) {
                        continue;
                    }
                    if (e instanceof ContextKeyOrExpr) {
                        expr = expr.concat(e.expr);
                        continue;
                    }
                    expr.push(e);
                }
                expr.sort(cmp);
            }
            return expr;
        }
        serialize() {
            return this.expr.map(e => e.serialize()).join(' || ');
        }
        keys() {
            const result = [];
            for (let expr of this.expr) {
                result.push(...expr.keys());
            }
            return result;
        }
        map(mapFnc) {
            return new ContextKeyOrExpr(this.expr.map(expr => expr.map(mapFnc)));
        }
        negate() {
            let result = [];
            for (let expr of this.expr) {
                result.push(expr.negate());
            }
            const terminals = (node) => {
                if (node instanceof ContextKeyOrExpr) {
                    return node.expr;
                }
                return [node];
            };
            // We don't support parens, so here we distribute the AND over the OR terminals
            // We always take the first 2 AND pairs and distribute them
            while (result.length > 1) {
                const LEFT = result.shift();
                const RIGHT = result.shift();
                const all = [];
                for (const left of terminals(LEFT)) {
                    for (const right of terminals(RIGHT)) {
                        all.push(ContextKeyExpr.and(left, right));
                    }
                }
                result.unshift(ContextKeyExpr.or(...all));
            }
            return result[0];
        }
    }
    exports.ContextKeyOrExpr = ContextKeyOrExpr;
    class RawContextKey extends ContextKeyDefinedExpr {
        constructor(key, defaultValue) {
            super(key);
            this._defaultValue = defaultValue;
        }
        bindTo(target) {
            return target.createKey(this.key, this._defaultValue);
        }
        getValue(target) {
            return target.getContextKeyValue(this.key);
        }
        toNegated() {
            return ContextKeyExpr.not(this.key);
        }
        isEqualTo(value) {
            return ContextKeyExpr.equals(this.key, value);
        }
        notEqualsTo(value) {
            return ContextKeyExpr.notEquals(this.key, value);
        }
    }
    exports.RawContextKey = RawContextKey;
    exports.IContextKeyService = instantiation_1.createDecorator('contextKeyService');
    exports.SET_CONTEXT_COMMAND_ID = 'setContext';
});
//# sourceMappingURL=contextkey.js.map