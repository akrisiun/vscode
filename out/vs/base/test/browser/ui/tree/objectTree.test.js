/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/tree/objectTree", "vs/base/common/iterator"], function (require, exports, assert, objectTree_1, iterator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ObjectTree', function () {
        suite('TreeNavigator', function () {
            let tree;
            let filter = (_) => true;
            setup(() => {
                const container = document.createElement('div');
                container.style.width = '200px';
                container.style.height = '200px';
                const delegate = new class {
                    getHeight() { return 20; }
                    getTemplateId() { return 'default'; }
                };
                const renderer = new class {
                    constructor() {
                        this.templateId = 'default';
                    }
                    renderTemplate(container) {
                        return container;
                    }
                    renderElement(element, index, templateData) {
                        templateData.textContent = `${element.element}`;
                    }
                    disposeTemplate() { }
                };
                tree = new objectTree_1.ObjectTree('test', container, delegate, [renderer], { filter: { filter: (el) => filter(el) } });
                tree.layout(200);
            });
            teardown(() => {
                tree.dispose();
                filter = (_) => true;
            });
            test('should be able to navigate', () => {
                tree.setChildren(null, iterator_1.Iterator.fromArray([
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
                const navigator = tree.navigate();
                assert.equal(navigator.current(), null);
                assert.equal(navigator.next(), 0);
                assert.equal(navigator.current(), 0);
                assert.equal(navigator.next(), 10);
                assert.equal(navigator.current(), 10);
                assert.equal(navigator.next(), 11);
                assert.equal(navigator.current(), 11);
                assert.equal(navigator.next(), 12);
                assert.equal(navigator.current(), 12);
                assert.equal(navigator.next(), 1);
                assert.equal(navigator.current(), 1);
                assert.equal(navigator.next(), 2);
                assert.equal(navigator.current(), 2);
                assert.equal(navigator.previous(), 1);
                assert.equal(navigator.current(), 1);
                assert.equal(navigator.previous(), 12);
                assert.equal(navigator.previous(), 11);
                assert.equal(navigator.previous(), 10);
                assert.equal(navigator.previous(), 0);
                assert.equal(navigator.previous(), null);
                assert.equal(navigator.next(), 0);
                assert.equal(navigator.next(), 10);
                assert.equal(navigator.first(), 0);
                assert.equal(navigator.last(), 2);
            });
            test('should skip collapsed nodes', () => {
                tree.setChildren(null, iterator_1.Iterator.fromArray([
                    {
                        element: 0, collapsed: true, children: iterator_1.Iterator.fromArray([
                            { element: 10 },
                            { element: 11 },
                            { element: 12 },
                        ])
                    },
                    { element: 1 },
                    { element: 2 }
                ]));
                const navigator = tree.navigate();
                assert.equal(navigator.current(), null);
                assert.equal(navigator.next(), 0);
                assert.equal(navigator.next(), 1);
                assert.equal(navigator.next(), 2);
                assert.equal(navigator.next(), null);
                assert.equal(navigator.previous(), 2);
                assert.equal(navigator.previous(), 1);
                assert.equal(navigator.previous(), 0);
                assert.equal(navigator.previous(), null);
                assert.equal(navigator.next(), 0);
                assert.equal(navigator.first(), 0);
                assert.equal(navigator.last(), 2);
            });
            test('should skip filtered elements', () => {
                filter = el => el % 2 === 0;
                tree.setChildren(null, iterator_1.Iterator.fromArray([
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
                const navigator = tree.navigate();
                assert.equal(navigator.current(), null);
                assert.equal(navigator.next(), 0);
                assert.equal(navigator.next(), 10);
                assert.equal(navigator.next(), 12);
                assert.equal(navigator.next(), 2);
                assert.equal(navigator.next(), null);
                assert.equal(navigator.previous(), 2);
                assert.equal(navigator.previous(), 12);
                assert.equal(navigator.previous(), 10);
                assert.equal(navigator.previous(), 0);
                assert.equal(navigator.previous(), null);
                assert.equal(navigator.next(), 0);
                assert.equal(navigator.next(), 10);
                assert.equal(navigator.first(), 0);
                assert.equal(navigator.last(), 2);
            });
            test('should be able to start from node', () => {
                tree.setChildren(null, iterator_1.Iterator.fromArray([
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
                const navigator = tree.navigate(1);
                assert.equal(navigator.current(), 1);
                assert.equal(navigator.next(), 2);
                assert.equal(navigator.current(), 2);
                assert.equal(navigator.previous(), 1);
                assert.equal(navigator.current(), 1);
                assert.equal(navigator.previous(), 12);
                assert.equal(navigator.previous(), 11);
                assert.equal(navigator.previous(), 10);
                assert.equal(navigator.previous(), 0);
                assert.equal(navigator.previous(), null);
                assert.equal(navigator.next(), 0);
                assert.equal(navigator.next(), 10);
                assert.equal(navigator.first(), 0);
                assert.equal(navigator.last(), 2);
            });
        });
        test('traits are preserved according to string identity', function () {
            const container = document.createElement('div');
            container.style.width = '200px';
            container.style.height = '200px';
            const delegate = new class {
                getHeight() { return 20; }
                getTemplateId() { return 'default'; }
            };
            const renderer = new class {
                constructor() {
                    this.templateId = 'default';
                }
                renderTemplate(container) {
                    return container;
                }
                renderElement(element, index, templateData) {
                    templateData.textContent = `${element.element}`;
                }
                disposeTemplate() { }
            };
            const identityProvider = new class {
                getId(element) {
                    return `${element % 100}`;
                }
            };
            const tree = new objectTree_1.ObjectTree('test', container, delegate, [renderer], { identityProvider });
            tree.layout(200);
            tree.setChildren(null, [{ element: 0 }, { element: 1 }, { element: 2 }, { element: 3 }]);
            tree.setFocus([1]);
            assert.deepStrictEqual(tree.getFocus(), [1]);
            tree.setChildren(null, [{ element: 100 }, { element: 101 }, { element: 102 }, { element: 103 }]);
            assert.deepStrictEqual(tree.getFocus(), [101]);
        });
    });
    function toArray(list) {
        const result = [];
        list.forEach(node => result.push(node));
        return result;
    }
    suite('CompressibleObjectTree', function () {
        class Delegate {
            getHeight() { return 20; }
            getTemplateId() { return 'default'; }
        }
        class Renderer {
            constructor() {
                this.templateId = 'default';
            }
            renderTemplate(container) {
                return container;
            }
            renderElement(node, _, templateData) {
                templateData.textContent = `${node.element}`;
            }
            renderCompressedElements(node, _, templateData) {
                templateData.textContent = `${node.element.elements.join('/')}`;
            }
            disposeTemplate() { }
        }
        test('empty', function () {
            const container = document.createElement('div');
            container.style.width = '200px';
            container.style.height = '200px';
            const tree = new objectTree_1.CompressibleObjectTree('test', container, new Delegate(), [new Renderer()]);
            tree.layout(200);
            const rows = toArray(container.querySelectorAll('.monaco-tl-contents'));
            assert.equal(rows.length, 0);
        });
        test('simple', function () {
            const container = document.createElement('div');
            container.style.width = '200px';
            container.style.height = '200px';
            const tree = new objectTree_1.CompressibleObjectTree('test', container, new Delegate(), [new Renderer()]);
            tree.layout(200);
            tree.setChildren(null, [
                {
                    element: 0, children: [
                        { element: 10 },
                        { element: 11 },
                        { element: 12 },
                    ]
                },
                { element: 1 },
                { element: 2 }
            ]);
            const rows = toArray(container.querySelectorAll('.monaco-tl-contents')).map(row => row.textContent);
            assert.deepEqual(rows, ['0', '10', '11', '12', '1', '2']);
        });
        test('compressed', () => {
            const container = document.createElement('div');
            container.style.width = '200px';
            container.style.height = '200px';
            const tree = new objectTree_1.CompressibleObjectTree('test', container, new Delegate(), [new Renderer()]);
            tree.layout(200);
            tree.setChildren(null, iterator_1.Iterator.fromArray([
                {
                    element: 1, children: iterator_1.Iterator.fromArray([{
                            element: 11, children: iterator_1.Iterator.fromArray([{
                                    element: 111, children: iterator_1.Iterator.fromArray([
                                        { element: 1111 },
                                        { element: 1112 },
                                        { element: 1113 },
                                    ])
                                }])
                        }])
                }
            ]));
            let rows = toArray(container.querySelectorAll('.monaco-tl-contents')).map(row => row.textContent);
            assert.deepEqual(rows, ['1/11/111', '1111', '1112', '1113']);
            tree.setChildren(11, iterator_1.Iterator.fromArray([
                { element: 111 },
                { element: 112 },
                { element: 113 },
            ]));
            rows = toArray(container.querySelectorAll('.monaco-tl-contents')).map(row => row.textContent);
            assert.deepEqual(rows, ['1/11', '111', '112', '113']);
            tree.setChildren(113, iterator_1.Iterator.fromArray([
                { element: 1131 }
            ]));
            rows = toArray(container.querySelectorAll('.monaco-tl-contents')).map(row => row.textContent);
            assert.deepEqual(rows, ['1/11', '111', '112', '113/1131']);
            tree.setChildren(1131, iterator_1.Iterator.fromArray([
                { element: 1132 }
            ]));
            rows = toArray(container.querySelectorAll('.monaco-tl-contents')).map(row => row.textContent);
            assert.deepEqual(rows, ['1/11', '111', '112', '113/1131/1132']);
            tree.setChildren(1131, iterator_1.Iterator.fromArray([
                { element: 1132 },
                { element: 1133 },
            ]));
            rows = toArray(container.querySelectorAll('.monaco-tl-contents')).map(row => row.textContent);
            assert.deepEqual(rows, ['1/11', '111', '112', '113/1131', '1132', '1133']);
        });
        test('enableCompression', () => {
            const container = document.createElement('div');
            container.style.width = '200px';
            container.style.height = '200px';
            const tree = new objectTree_1.CompressibleObjectTree('test', container, new Delegate(), [new Renderer()]);
            tree.layout(200);
            assert.equal(tree.isCompressionEnabled(), true);
            tree.setChildren(null, iterator_1.Iterator.fromArray([
                {
                    element: 1, children: iterator_1.Iterator.fromArray([{
                            element: 11, children: iterator_1.Iterator.fromArray([{
                                    element: 111, children: iterator_1.Iterator.fromArray([
                                        { element: 1111 },
                                        { element: 1112 },
                                        { element: 1113 },
                                    ])
                                }])
                        }])
                }
            ]));
            let rows = toArray(container.querySelectorAll('.monaco-tl-contents')).map(row => row.textContent);
            assert.deepEqual(rows, ['1/11/111', '1111', '1112', '1113']);
            tree.setCompressionEnabled(false);
            rows = toArray(container.querySelectorAll('.monaco-tl-contents')).map(row => row.textContent);
            assert.deepEqual(rows, ['1', '11', '111', '1111', '1112', '1113']);
            tree.setCompressionEnabled(true);
            rows = toArray(container.querySelectorAll('.monaco-tl-contents')).map(row => row.textContent);
            assert.deepEqual(rows, ['1/11/111', '1111', '1112', '1113']);
        });
    });
});
//# sourceMappingURL=objectTree.test.js.map