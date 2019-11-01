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
            assert(resourceTree_1.ResourceTree.isBranchNode(tree.root));
            assert.equal(tree.root.size, 0);
        });
        test('simple', function () {
            const tree = new resourceTree_1.ResourceTree(null);
            tree.add(uri_1.URI.file('/foo/bar.txt'), 'bar contents');
            assert(resourceTree_1.ResourceTree.isBranchNode(tree.root));
            assert.equal(tree.root.size, 1);
            let foo = tree.root.get('foo');
            assert(foo);
            assert(resourceTree_1.ResourceTree.isBranchNode(foo));
            assert.equal(foo.size, 1);
            let bar = foo.get('bar.txt');
            assert(bar);
            assert(!resourceTree_1.ResourceTree.isBranchNode(bar));
            assert.equal(bar.element, 'bar contents');
            tree.add(uri_1.URI.file('/hello.txt'), 'hello contents');
            assert.equal(tree.root.size, 2);
            let hello = tree.root.get('hello.txt');
            assert(hello);
            assert(!resourceTree_1.ResourceTree.isBranchNode(hello));
            assert.equal(hello.element, 'hello contents');
            tree.delete(uri_1.URI.file('/foo/bar.txt'));
            assert.equal(tree.root.size, 1);
            hello = tree.root.get('hello.txt');
            assert(hello);
            assert(!resourceTree_1.ResourceTree.isBranchNode(hello));
            assert.equal(hello.element, 'hello contents');
        });
    });
});
//# sourceMappingURL=resourceTree.test.js.map