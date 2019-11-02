/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/tree/objectTreeModel", "vs/base/common/iterator"], function (require, exports, assert, objectTreeModel_1, iterator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function toSpliceable(arr) {
        return {
            splice(start, deleteCount, elements) {
                arr.splice(start, deleteCount, ...elements);
            }
        };
    }
    function toArray(list) {
        return list.map(i => i.element);
    }
    suite('ObjectTreeModel', function () {
        test('ctor', () => {
            const list = [];
            const model = new objectTreeModel_1.ObjectTreeModel('test', toSpliceable(list));
            assert(model);
            assert.equal(list.length, 0);
            assert.equal(model.size, 0);
        });
        test('flat', () => {
            const list = [];
            const model = new objectTreeModel_1.ObjectTreeModel('test', toSpliceable(list));
            model.setChildren(null, iterator_1.Iterator.fromArray([
                { element: 0 },
                { element: 1 },
                { element: 2 }
            ]));
            assert.deepEqual(toArray(list), [0, 1, 2]);
            assert.equal(model.size, 3);
            model.setChildren(null, iterator_1.Iterator.fromArray([
                { element: 3 },
                { element: 4 },
                { element: 5 },
            ]));
            assert.deepEqual(toArray(list), [3, 4, 5]);
            assert.equal(model.size, 3);
            model.setChildren(null, iterator_1.Iterator.empty());
            assert.deepEqual(toArray(list), []);
            assert.equal(model.size, 0);
        });
        test('nested', () => {
            const list = [];
            const model = new objectTreeModel_1.ObjectTreeModel('test', toSpliceable(list));
            model.setChildren(null, iterator_1.Iterator.fromArray([
                {
                    element: 0, children: iterator_1.Iterator.fromArray([
                        { element: 10 },
                        { element: 11 },
                        { element: 12 },
                    ])
                },
                { element: 1 },
                { element: 2 }
            ]));
            assert.deepEqual(toArray(list), [0, 10, 11, 12, 1, 2]);
            assert.equal(model.size, 6);
            model.setChildren(12, iterator_1.Iterator.fromArray([
                { element: 120 },
                { element: 121 }
            ]));
            assert.deepEqual(toArray(list), [0, 10, 11, 12, 120, 121, 1, 2]);
            assert.equal(model.size, 8);
            model.setChildren(0, iterator_1.Iterator.empty());
            assert.deepEqual(toArray(list), [0, 1, 2]);
            assert.equal(model.size, 3);
            model.setChildren(null, iterator_1.Iterator.empty());
            assert.deepEqual(toArray(list), []);
            assert.equal(model.size, 0);
        });
        test('setChildren on collapsed node', () => {
            const list = [];
            const model = new objectTreeModel_1.ObjectTreeModel('test', toSpliceable(list));
            model.setChildren(null, iterator_1.Iterator.fromArray([
                { element: 0, collapsed: true }
            ]));
            assert.deepEqual(toArray(list), [0]);
            model.setChildren(0, iterator_1.Iterator.fromArray([
                { element: 1 },
                { element: 2 }
            ]));
            assert.deepEqual(toArray(list), [0]);
            model.setCollapsed(0, false);
            assert.deepEqual(toArray(list), [0, 1, 2]);
        });
        test('setChildren on expanded, unrevealed node', () => {
            const list = [];
            const model = new objectTreeModel_1.ObjectTreeModel('test', toSpliceable(list));
            model.setChildren(null, [
                {
                    element: 1, collapsed: true, children: [
                        { element: 11, collapsed: false }
                    ]
                },
                { element: 2 }
            ]);
            assert.deepEqual(toArray(list), [1, 2]);
            model.setChildren(11, [
                { element: 111 },
                { element: 112 }
            ]);
            assert.deepEqual(toArray(list), [1, 2]);
            model.setCollapsed(1, false);
            assert.deepEqual(toArray(list), [1, 11, 111, 112, 2]);
        });
        test('collapse state is preserved with strict identity', () => {
            const list = [];
            const model = new objectTreeModel_1.ObjectTreeModel('test', toSpliceable(list), { collapseByDefault: true });
            const data = [{ element: 'father', children: [{ element: 'child' }] }];
            model.setChildren(null, data);
            assert.deepEqual(toArray(list), ['father']);
            model.setCollapsed('father', false);
            assert.deepEqual(toArray(list), ['father', 'child']);
            model.setChildren(null, data);
            assert.deepEqual(toArray(list), ['father', 'child']);
            const data2 = [{ element: 'father', children: [{ element: 'child' }] }, { element: 'uncle' }];
            model.setChildren(null, data2);
            assert.deepEqual(toArray(list), ['father', 'child', 'uncle']);
            model.setChildren(null, [{ element: 'uncle' }]);
            assert.deepEqual(toArray(list), ['uncle']);
            model.setChildren(null, data2);
            assert.deepEqual(toArray(list), ['father', 'uncle']);
            model.setChildren(null, data);
            assert.deepEqual(toArray(list), ['father']);
        });
        test('sorter', () => {
            let compare = (a, b) => a < b ? -1 : 1;
            const list = [];
            const model = new objectTreeModel_1.ObjectTreeModel('test', toSpliceable(list), { sorter: { compare(a, b) { return compare(a, b); } } });
            const data = [
                { element: 'cars', children: [{ element: 'sedan' }, { element: 'convertible' }, { element: 'compact' }] },
                { element: 'airplanes', children: [{ element: 'passenger' }, { element: 'jet' }] },
                { element: 'bicycles', children: [{ element: 'dutch' }, { element: 'mountain' }, { element: 'electric' }] },
            ];
            model.setChildren(null, data);
            assert.deepEqual(toArray(list), ['airplanes', 'jet', 'passenger', 'bicycles', 'dutch', 'electric', 'mountain', 'cars', 'compact', 'convertible', 'sedan']);
        });
        test('resort', () => {
            let compare = () => 0;
            const list = [];
            const model = new objectTreeModel_1.ObjectTreeModel('test', toSpliceable(list), { sorter: { compare(a, b) { return compare(a, b); } } });
            const data = [
                { element: 'cars', children: [{ element: 'sedan' }, { element: 'convertible' }, { element: 'compact' }] },
                { element: 'airplanes', children: [{ element: 'passenger' }, { element: 'jet' }] },
                { element: 'bicycles', children: [{ element: 'dutch' }, { element: 'mountain' }, { element: 'electric' }] },
            ];
            model.setChildren(null, data);
            assert.deepEqual(toArray(list), ['cars', 'sedan', 'convertible', 'compact', 'airplanes', 'passenger', 'jet', 'bicycles', 'dutch', 'mountain', 'electric']);
            // lexicographical
            compare = (a, b) => a < b ? -1 : 1;
            // non-recursive
            model.resort(null, false);
            assert.deepEqual(toArray(list), ['airplanes', 'passenger', 'jet', 'bicycles', 'dutch', 'mountain', 'electric', 'cars', 'sedan', 'convertible', 'compact']);
            // recursive
            model.resort();
            assert.deepEqual(toArray(list), ['airplanes', 'jet', 'passenger', 'bicycles', 'dutch', 'electric', 'mountain', 'cars', 'compact', 'convertible', 'sedan']);
            // reverse
            compare = (a, b) => a < b ? 1 : -1;
            // scoped
            model.resort('cars');
            assert.deepEqual(toArray(list), ['airplanes', 'jet', 'passenger', 'bicycles', 'dutch', 'electric', 'mountain', 'cars', 'sedan', 'convertible', 'compact']);
            // recursive
            model.resort();
            assert.deepEqual(toArray(list), ['cars', 'sedan', 'convertible', 'compact', 'bicycles', 'mountain', 'electric', 'dutch', 'airplanes', 'passenger', 'jet']);
        });
        test('expandTo', () => {
            const list = [];
            const model = new objectTreeModel_1.ObjectTreeModel('test', toSpliceable(list), { collapseByDefault: true });
            model.setChildren(null, [
                {
                    element: 0, children: [
                        { element: 10, children: [{ element: 100, children: [{ element: 1000 }] }] },
                        { element: 11 },
                        { element: 12 },
                    ]
                },
                { element: 1 },
                { element: 2 }
            ]);
            assert.deepEqual(toArray(list), [0, 1, 2]);
            model.expandTo(1000);
            assert.deepEqual(toArray(list), [0, 10, 100, 1000, 11, 12, 1, 2]);
        });
    });
});
//# sourceMappingURL=objectTreeModel.test.js.map