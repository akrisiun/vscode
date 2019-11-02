define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/common/marshalling"], function (require, exports, assert, uri_1, marshalling_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Marshalling', () => {
        test('RegExp', () => {
            let value = /foo/img;
            let raw = marshalling_1.stringify(value);
            let clone = marshalling_1.parse(raw);
            assert.equal(value.source, clone.source);
            assert.equal(value.global, clone.global);
            assert.equal(value.ignoreCase, clone.ignoreCase);
            assert.equal(value.multiline, clone.multiline);
        });
        test('URI', () => {
            const value = uri_1.URI.from({ scheme: 'file', authority: 'server', path: '/shares/c#files', query: 'q', fragment: 'f' });
            const raw = marshalling_1.stringify(value);
            const clone = marshalling_1.parse(raw);
            assert.equal(value.scheme, clone.scheme);
            assert.equal(value.authority, clone.authority);
            assert.equal(value.path, clone.path);
            assert.equal(value.query, clone.query);
            assert.equal(value.fragment, clone.fragment);
        });
        test('Bug 16793:# in folder name => mirror models get out of sync', () => {
            const uri1 = uri_1.URI.file('C:\\C#\\file.txt');
            assert.equal(marshalling_1.parse(marshalling_1.stringify(uri1)).toString(), uri1.toString());
        });
    });
});
//# sourceMappingURL=marshalling.test.js.map