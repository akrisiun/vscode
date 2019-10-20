define(["require", "exports", "assert", "vs/platform/configuration/common/configuration"], function (require, exports, assert, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Configuration', () => {
        test('simple merge', () => {
            let base = { 'a': 1, 'b': 2 };
            configuration_1.merge(base, { 'a': 3, 'c': 4 }, true);
            assert.deepEqual(base, { 'a': 3, 'b': 2, 'c': 4 });
            base = { 'a': 1, 'b': 2 };
            configuration_1.merge(base, { 'a': 3, 'c': 4 }, false);
            assert.deepEqual(base, { 'a': 1, 'b': 2, 'c': 4 });
        });
        test('removeFromValueTree: remove a non existing key', () => {
            let target = { 'a': { 'b': 2 } };
            configuration_1.removeFromValueTree(target, 'c');
            assert.deepEqual(target, { 'a': { 'b': 2 } });
        });
        test('removeFromValueTree: remove a multi segmented key from an object that has only sub sections of the key', () => {
            let target = { 'a': { 'b': 2 } };
            configuration_1.removeFromValueTree(target, 'a.b.c');
            assert.deepEqual(target, { 'a': { 'b': 2 } });
        });
        test('removeFromValueTree: remove a single segmented key', () => {
            let target = { 'a': 1 };
            configuration_1.removeFromValueTree(target, 'a');
            assert.deepEqual(target, {});
        });
        test('removeFromValueTree: remove a single segmented key when its value is undefined', () => {
            let target = { 'a': undefined };
            configuration_1.removeFromValueTree(target, 'a');
            assert.deepEqual(target, {});
        });
        test('removeFromValueTree: remove a multi segmented key when its value is undefined', () => {
            let target = { 'a': { 'b': 1 } };
            configuration_1.removeFromValueTree(target, 'a.b');
            assert.deepEqual(target, {});
        });
        test('removeFromValueTree: remove a multi segmented key when its value is array', () => {
            let target = { 'a': { 'b': [1] } };
            configuration_1.removeFromValueTree(target, 'a.b');
            assert.deepEqual(target, {});
        });
        test('removeFromValueTree: remove a multi segmented key first segment value is array', () => {
            let target = { 'a': [1] };
            configuration_1.removeFromValueTree(target, 'a.0');
            assert.deepEqual(target, { 'a': [1] });
        });
        test('removeFromValueTree: remove when key is the first segmenet', () => {
            let target = { 'a': { 'b': 1 } };
            configuration_1.removeFromValueTree(target, 'a');
            assert.deepEqual(target, {});
        });
        test('removeFromValueTree: remove a multi segmented key when the first node has more values', () => {
            let target = { 'a': { 'b': { 'c': 1 }, 'd': 1 } };
            configuration_1.removeFromValueTree(target, 'a.b.c');
            assert.deepEqual(target, { 'a': { 'd': 1 } });
        });
        test('removeFromValueTree: remove a multi segmented key when in between node has more values', () => {
            let target = { 'a': { 'b': { 'c': { 'd': 1 }, 'd': 1 } } };
            configuration_1.removeFromValueTree(target, 'a.b.c.d');
            assert.deepEqual(target, { 'a': { 'b': { 'd': 1 } } });
        });
        test('removeFromValueTree: remove a multi segmented key when the last but one node has more values', () => {
            let target = { 'a': { 'b': { 'c': 1, 'd': 1 } } };
            configuration_1.removeFromValueTree(target, 'a.b.c');
            assert.deepEqual(target, { 'a': { 'b': { 'd': 1 } } });
        });
    });
});
//# sourceMappingURL=configuration.test.js.map