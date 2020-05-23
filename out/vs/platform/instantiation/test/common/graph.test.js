define(["require", "exports", "assert", "vs/platform/instantiation/common/graph"], function (require, exports, assert, graph_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Graph', () => {
        let graph;
        setup(() => {
            graph = new graph_1.Graph(s => s);
        });
        test('is possible to lookup nodes that don\'t exist', function () {
            assert.deepEqual(graph.lookup('ddd'), null);
        });
        test('inserts nodes when not there yet', function () {
            assert.deepEqual(graph.lookup('ddd'), null);
            assert.deepEqual(graph.lookupOrInsertNode('ddd').data, 'ddd');
            assert.deepEqual(graph.lookup('ddd').data, 'ddd');
        });
        test('can remove nodes and get length', function () {
            assert.ok(graph.isEmpty());
            assert.deepEqual(graph.lookup('ddd'), null);
            assert.deepEqual(graph.lookupOrInsertNode('ddd').data, 'ddd');
            assert.ok(!graph.isEmpty());
            graph.removeNode('ddd');
            assert.deepEqual(graph.lookup('ddd'), null);
            assert.ok(graph.isEmpty());
        });
        test('root', () => {
            graph.insertEdge('1', '2');
            let roots = graph.roots();
            assert.equal(roots.length, 1);
            assert.equal(roots[0].data, '2');
            graph.insertEdge('2', '1');
            roots = graph.roots();
            assert.equal(roots.length, 0);
        });
        test('root complex', function () {
            graph.insertEdge('1', '2');
            graph.insertEdge('1', '3');
            graph.insertEdge('3', '4');
            let roots = graph.roots();
            assert.equal(roots.length, 2);
            assert(['2', '4'].every(n => roots.some(node => node.data === n)));
        });
    });
});
//# sourceMappingURL=graph.test.js.map