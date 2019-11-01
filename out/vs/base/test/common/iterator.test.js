/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/iterator"], function (require, exports, assert, iterator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Iterator', () => {
        test('concat', () => {
            const first = iterator_1.Iterator.fromArray([1, 2, 3]);
            const second = iterator_1.Iterator.fromArray([4, 5, 6]);
            const third = iterator_1.Iterator.fromArray([7, 8, 9]);
            const actualIterator = iterator_1.Iterator.concat(first, second, third);
            const actual = iterator_1.Iterator.collect(actualIterator);
            assert.deepEqual(actual, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });
    });
});
//# sourceMappingURL=iterator.test.js.map