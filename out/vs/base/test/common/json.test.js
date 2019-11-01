define(["require", "exports", "assert", "vs/base/common/json", "vs/base/common/jsonErrorMessages"], function (require, exports, assert, json_1, jsonErrorMessages_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function assertKinds(text, ...kinds) {
        let scanner = json_1.createScanner(text);
        let kind;
        while ((kind = scanner.scan()) !== 17 /* EOF */) {
            assert.equal(kind, kinds.shift());
        }
        assert.equal(kinds.length, 0);
    }
    function assertScanError(text, expectedKind, scanError) {
        let scanner = json_1.createScanner(text);
        scanner.scan();
        assert.equal(scanner.getToken(), expectedKind);
        assert.equal(scanner.getTokenError(), scanError);
    }
    function assertValidParse(input, expected, options) {
        let errors = [];
        let actual = json_1.parse(input, errors, options);
        if (errors.length !== 0) {
            assert(false, jsonErrorMessages_1.getParseErrorMessage(errors[0].error));
        }
        assert.deepEqual(actual, expected);
    }
    function assertInvalidParse(input, expected, options) {
        let errors = [];
        let actual = json_1.parse(input, errors, options);
        assert(errors.length > 0);
        assert.deepEqual(actual, expected);
    }
    function assertTree(input, expected, expectedErrors = [], options) {
        let errors = [];
        let actual = json_1.parseTree(input, errors, options);
        assert.deepEqual(errors.map(e => e.error, expected), expectedErrors);
        let checkParent = (node) => {
            if (node.children) {
                for (let child of node.children) {
                    assert.equal(node, child.parent);
                    delete child.parent; // delete to avoid recursion in deep equal
                    checkParent(child);
                }
            }
        };
        checkParent(actual);
        assert.deepEqual(actual, expected);
    }
    suite('JSON', () => {
        test('tokens', () => {
            assertKinds('{', 1 /* OpenBraceToken */);
            assertKinds('}', 2 /* CloseBraceToken */);
            assertKinds('[', 3 /* OpenBracketToken */);
            assertKinds(']', 4 /* CloseBracketToken */);
            assertKinds(':', 6 /* ColonToken */);
            assertKinds(',', 5 /* CommaToken */);
        });
        test('comments', () => {
            assertKinds('// this is a comment', 12 /* LineCommentTrivia */);
            assertKinds('// this is a comment\n', 12 /* LineCommentTrivia */, 14 /* LineBreakTrivia */);
            assertKinds('/* this is a comment*/', 13 /* BlockCommentTrivia */);
            assertKinds('/* this is a \r\ncomment*/', 13 /* BlockCommentTrivia */);
            assertKinds('/* this is a \ncomment*/', 13 /* BlockCommentTrivia */);
            // unexpected end
            assertKinds('/* this is a', 13 /* BlockCommentTrivia */);
            assertKinds('/* this is a \ncomment', 13 /* BlockCommentTrivia */);
            // broken comment
            assertKinds('/ ttt', 16 /* Unknown */, 15 /* Trivia */, 16 /* Unknown */);
        });
        test('strings', () => {
            assertKinds('"test"', 10 /* StringLiteral */);
            assertKinds('"\\""', 10 /* StringLiteral */);
            assertKinds('"\\/"', 10 /* StringLiteral */);
            assertKinds('"\\b"', 10 /* StringLiteral */);
            assertKinds('"\\f"', 10 /* StringLiteral */);
            assertKinds('"\\n"', 10 /* StringLiteral */);
            assertKinds('"\\r"', 10 /* StringLiteral */);
            assertKinds('"\\t"', 10 /* StringLiteral */);
            assertKinds('"\\v"', 10 /* StringLiteral */);
            assertKinds('"\u88ff"', 10 /* StringLiteral */);
            assertKinds('"​\u2028"', 10 /* StringLiteral */);
            // unexpected end
            assertKinds('"test', 10 /* StringLiteral */);
            assertKinds('"test\n"', 10 /* StringLiteral */, 14 /* LineBreakTrivia */, 10 /* StringLiteral */);
            // invalid characters
            assertScanError('"\t"', 10 /* StringLiteral */, 6 /* InvalidCharacter */);
            assertScanError('"\t "', 10 /* StringLiteral */, 6 /* InvalidCharacter */);
        });
        test('numbers', () => {
            assertKinds('0', 11 /* NumericLiteral */);
            assertKinds('0.1', 11 /* NumericLiteral */);
            assertKinds('-0.1', 11 /* NumericLiteral */);
            assertKinds('-1', 11 /* NumericLiteral */);
            assertKinds('1', 11 /* NumericLiteral */);
            assertKinds('123456789', 11 /* NumericLiteral */);
            assertKinds('10', 11 /* NumericLiteral */);
            assertKinds('90', 11 /* NumericLiteral */);
            assertKinds('90E+123', 11 /* NumericLiteral */);
            assertKinds('90e+123', 11 /* NumericLiteral */);
            assertKinds('90e-123', 11 /* NumericLiteral */);
            assertKinds('90E-123', 11 /* NumericLiteral */);
            assertKinds('90E123', 11 /* NumericLiteral */);
            assertKinds('90e123', 11 /* NumericLiteral */);
            // zero handling
            assertKinds('01', 11 /* NumericLiteral */, 11 /* NumericLiteral */);
            assertKinds('-01', 11 /* NumericLiteral */, 11 /* NumericLiteral */);
            // unexpected end
            assertKinds('-', 16 /* Unknown */);
            assertKinds('.0', 16 /* Unknown */);
        });
        test('keywords: true, false, null', () => {
            assertKinds('true', 8 /* TrueKeyword */);
            assertKinds('false', 9 /* FalseKeyword */);
            assertKinds('null', 7 /* NullKeyword */);
            assertKinds('true false null', 8 /* TrueKeyword */, 15 /* Trivia */, 9 /* FalseKeyword */, 15 /* Trivia */, 7 /* NullKeyword */);
            // invalid words
            assertKinds('nulllll', 16 /* Unknown */);
            assertKinds('True', 16 /* Unknown */);
            assertKinds('foo-bar', 16 /* Unknown */);
            assertKinds('foo bar', 16 /* Unknown */, 15 /* Trivia */, 16 /* Unknown */);
        });
        test('trivia', () => {
            assertKinds(' ', 15 /* Trivia */);
            assertKinds('  \t  ', 15 /* Trivia */);
            assertKinds('  \t  \n  \t  ', 15 /* Trivia */, 14 /* LineBreakTrivia */, 15 /* Trivia */);
            assertKinds('\r\n', 14 /* LineBreakTrivia */);
            assertKinds('\r', 14 /* LineBreakTrivia */);
            assertKinds('\n', 14 /* LineBreakTrivia */);
            assertKinds('\n\r', 14 /* LineBreakTrivia */, 14 /* LineBreakTrivia */);
            assertKinds('\n   \n', 14 /* LineBreakTrivia */, 15 /* Trivia */, 14 /* LineBreakTrivia */);
        });
        test('parse: literals', () => {
            assertValidParse('true', true);
            assertValidParse('false', false);
            assertValidParse('null', null);
            assertValidParse('"foo"', 'foo');
            assertValidParse('"\\"-\\\\-\\/-\\b-\\f-\\n-\\r-\\t"', '"-\\-/-\b-\f-\n-\r-\t');
            assertValidParse('"\\u00DC"', 'Ü');
            assertValidParse('9', 9);
            assertValidParse('-9', -9);
            assertValidParse('0.129', 0.129);
            assertValidParse('23e3', 23e3);
            assertValidParse('1.2E+3', 1.2E+3);
            assertValidParse('1.2E-3', 1.2E-3);
            assertValidParse('1.2E-3 // comment', 1.2E-3);
        });
        test('parse: objects', () => {
            assertValidParse('{}', {});
            assertValidParse('{ "foo": true }', { foo: true });
            assertValidParse('{ "bar": 8, "xoo": "foo" }', { bar: 8, xoo: 'foo' });
            assertValidParse('{ "hello": [], "world": {} }', { hello: [], world: {} });
            assertValidParse('{ "a": false, "b": true, "c": [ 7.4 ] }', { a: false, b: true, c: [7.4] });
            assertValidParse('{ "lineComment": "//", "blockComment": ["/*", "*/"], "brackets": [ ["{", "}"], ["[", "]"], ["(", ")"] ] }', { lineComment: '//', blockComment: ['/*', '*/'], brackets: [['{', '}'], ['[', ']'], ['(', ')']] });
            assertValidParse('{ "hello": [], "world": {} }', { hello: [], world: {} });
            assertValidParse('{ "hello": { "again": { "inside": 5 }, "world": 1 }}', { hello: { again: { inside: 5 }, world: 1 } });
            assertValidParse('{ "foo": /*hello*/true }', { foo: true });
        });
        test('parse: arrays', () => {
            assertValidParse('[]', []);
            assertValidParse('[ [],  [ [] ]]', [[], [[]]]);
            assertValidParse('[ 1, 2, 3 ]', [1, 2, 3]);
            assertValidParse('[ { "a": null } ]', [{ a: null }]);
        });
        test('parse: objects with errors', () => {
            assertInvalidParse('{,}', {});
            assertInvalidParse('{ "foo": true, }', { foo: true }, { allowTrailingComma: false });
            assertInvalidParse('{ "bar": 8 "xoo": "foo" }', { bar: 8, xoo: 'foo' });
            assertInvalidParse('{ ,"bar": 8 }', { bar: 8 });
            assertInvalidParse('{ ,"bar": 8, "foo" }', { bar: 8 });
            assertInvalidParse('{ "bar": 8, "foo": }', { bar: 8 });
            assertInvalidParse('{ 8, "foo": 9 }', { foo: 9 });
        });
        test('parse: array with errors', () => {
            assertInvalidParse('[,]', []);
            assertInvalidParse('[ 1, 2, ]', [1, 2], { allowTrailingComma: false });
            assertInvalidParse('[ 1 2, 3 ]', [1, 2, 3]);
            assertInvalidParse('[ ,1, 2, 3 ]', [1, 2, 3]);
            assertInvalidParse('[ ,1, 2, 3, ]', [1, 2, 3], { allowTrailingComma: false });
        });
        test('parse: disallow commments', () => {
            let options = { disallowComments: true };
            assertValidParse('[ 1, 2, null, "foo" ]', [1, 2, null, 'foo'], options);
            assertValidParse('{ "hello": [], "world": {} }', { hello: [], world: {} }, options);
            assertInvalidParse('{ "foo": /*comment*/ true }', { foo: true }, options);
        });
        test('parse: trailing comma', () => {
            // default is allow
            assertValidParse('{ "hello": [], }', { hello: [] });
            let options = { allowTrailingComma: true };
            assertValidParse('{ "hello": [], }', { hello: [] }, options);
            assertValidParse('{ "hello": [] }', { hello: [] }, options);
            assertValidParse('{ "hello": [], "world": {}, }', { hello: [], world: {} }, options);
            assertValidParse('{ "hello": [], "world": {} }', { hello: [], world: {} }, options);
            assertValidParse('{ "hello": [1,] }', { hello: [1] }, options);
            options = { allowTrailingComma: false };
            assertInvalidParse('{ "hello": [], }', { hello: [] }, options);
            assertInvalidParse('{ "hello": [], "world": {}, }', { hello: [], world: {} }, options);
        });
        test('tree: literals', () => {
            assertTree('true', { type: 'boolean', offset: 0, length: 4, value: true });
            assertTree('false', { type: 'boolean', offset: 0, length: 5, value: false });
            assertTree('null', { type: 'null', offset: 0, length: 4, value: null });
            assertTree('23', { type: 'number', offset: 0, length: 2, value: 23 });
            assertTree('-1.93e-19', { type: 'number', offset: 0, length: 9, value: -1.93e-19 });
            assertTree('"hello"', { type: 'string', offset: 0, length: 7, value: 'hello' });
        });
        test('tree: arrays', () => {
            assertTree('[]', { type: 'array', offset: 0, length: 2, children: [] });
            assertTree('[ 1 ]', { type: 'array', offset: 0, length: 5, children: [{ type: 'number', offset: 2, length: 1, value: 1 }] });
            assertTree('[ 1,"x"]', {
                type: 'array', offset: 0, length: 8, children: [
                    { type: 'number', offset: 2, length: 1, value: 1 },
                    { type: 'string', offset: 4, length: 3, value: 'x' }
                ]
            });
            assertTree('[[]]', {
                type: 'array', offset: 0, length: 4, children: [
                    { type: 'array', offset: 1, length: 2, children: [] }
                ]
            });
        });
        test('tree: objects', () => {
            assertTree('{ }', { type: 'object', offset: 0, length: 3, children: [] });
            assertTree('{ "val": 1 }', {
                type: 'object', offset: 0, length: 12, children: [
                    {
                        type: 'property', offset: 2, length: 8, colonOffset: 7, children: [
                            { type: 'string', offset: 2, length: 5, value: 'val' },
                            { type: 'number', offset: 9, length: 1, value: 1 }
                        ]
                    }
                ]
            });
            assertTree('{"id": "$", "v": [ null, null] }', {
                type: 'object', offset: 0, length: 32, children: [
                    {
                        type: 'property', offset: 1, length: 9, colonOffset: 5, children: [
                            { type: 'string', offset: 1, length: 4, value: 'id' },
                            { type: 'string', offset: 7, length: 3, value: '$' }
                        ]
                    },
                    {
                        type: 'property', offset: 12, length: 18, colonOffset: 15, children: [
                            { type: 'string', offset: 12, length: 3, value: 'v' },
                            {
                                type: 'array', offset: 17, length: 13, children: [
                                    { type: 'null', offset: 19, length: 4, value: null },
                                    { type: 'null', offset: 25, length: 4, value: null }
                                ]
                            }
                        ]
                    }
                ]
            });
            assertTree('{  "id": { "foo": { } } , }', {
                type: 'object', offset: 0, length: 27, children: [
                    {
                        type: 'property', offset: 3, length: 20, colonOffset: 7, children: [
                            { type: 'string', offset: 3, length: 4, value: 'id' },
                            {
                                type: 'object', offset: 9, length: 14, children: [
                                    {
                                        type: 'property', offset: 11, length: 10, colonOffset: 16, children: [
                                            { type: 'string', offset: 11, length: 5, value: 'foo' },
                                            { type: 'object', offset: 18, length: 3, children: [] }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }, [3 /* PropertyNameExpected */, 4 /* ValueExpected */], { allowTrailingComma: false });
        });
    });
});
//# sourceMappingURL=json.test.js.map