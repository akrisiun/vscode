/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/resourceTree", "vs/base/common/uri"], function (require, exports, assert, resourceTree_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ResourceTree', function () {
        test('ctor', function () {
            const tree = new resourceTree_1.ResourceTree(null);
            assert.equal(tree.root.childrenCount, 0);
        });
        test('simple', function () {
            const tree = new resourceTree_1.ResourceTree(null);
            tree.add(uri_1.URI.file('/foo/bar.txt'), 'bar contents');
            assert.equal(tree.root.childrenCount, 1);
            let foo = tree.root.get('foo');
            assert(foo);
            assert.equal(foo.childrenCount, 1);
            let bar = foo.get('bar.txt');
            assert(bar);
            assert.equal(bar.element, 'bar contents');
            tree.add(uri_1.URI.file('/hello.txt'), 'hello contents');
            assert.equal(tree.root.childrenCount, 2);
            let hello = tree.root.get('hello.txt');
            assert(hello);
            assert.equal(hello.element, 'hello contents');
            tree.delete(uri_1.URI.file('/foo/bar.txt'));
            assert.equal(tree.root.childrenCount, 1);
            hello = tree.root.get('hello.txt');
            assert(hello);
            assert.equal(hello.element, 'hello contents');
        });
        test('folders with data', function () {
            const tree = new resourceTree_1.ResourceTree(null);
            assert.equal(tree.root.childrenCount, 0);
            tree.add(uri_1.URI.file('/foo'), 'foo');
            assert.equal(tree.root.childrenCount, 1);
            assert.equal(tree.root.get('foo').element, 'foo');
            tree.add(uri_1.URI.file('/bar'), 'bar');
            assert.equal(tree.root.childrenCount, 2);
            assert.equal(tree.root.get('bar').element, 'bar');
            tree.add(uri_1.URI.file('/foo/file.txt'), 'file');
            assert.equal(tree.root.childrenCount, 2);
            assert.equal(tree.root.get('foo').element, 'foo');
            assert.equal(tree.root.get('bar').element, 'bar');
            assert.equal(tree.root.get('foo').get('file.txt').element, 'file');
            tree.delete(uri_1.URI.file('/foo'));
            assert.equal(tree.root.childrenCount, 1);
            assert(!tree.root.get('foo'));
            assert.equal(tree.root.get('bar').element, 'bar');
            tree.delete(uri_1.URI.file('/bar'));
            assert.equal(tree.root.childrenCount, 0);
            assert(!tree.root.get('foo'));
            assert(!tree.root.get('bar'));
        });
    });
});
//# sourceMappingURL=resourceTree.test.js.map