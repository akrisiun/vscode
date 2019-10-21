define(["require", "exports", "assert", "vs/platform/environment/node/argv"], function (require, exports, assert, argv_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('formatOptions', () => {
        function o(description) {
            return {
                description, type: 'string'
            };
        }
        test('Text should display small columns correctly', () => {
            assert.deepEqual(argv_1.formatOptions({
                'add': o('bar')
            }, 80), ['  --add bar']);
            assert.deepEqual(argv_1.formatOptions({
                'add': o('bar'),
                'wait': o('ba'),
                'trace': o('b')
            }, 80), [
                '  --add   bar',
                '  --wait  ba',
                '  --trace b'
            ]);
        });
        test('Text should wrap', () => {
            assert.deepEqual(argv_1.formatOptions({
                'add': o('bar '.repeat(9))
            }, 40), [
                '  --add bar bar bar bar bar bar bar bar',
                '        bar'
            ]);
        });
        test('Text should revert to the condensed view when the terminal is too narrow', () => {
            assert.deepEqual(argv_1.formatOptions({
                'add': o('bar '.repeat(9))
            }, 30), [
                '  --add',
                '      bar bar bar bar bar bar bar bar bar '
            ]);
        });
        test('addArg', () => {
            assert.deepEqual(argv_1.addArg([], 'foo'), ['foo']);
            assert.deepEqual(argv_1.addArg([], 'foo', 'bar'), ['foo', 'bar']);
            assert.deepEqual(argv_1.addArg(['foo'], 'bar'), ['foo', 'bar']);
            assert.deepEqual(argv_1.addArg(['--wait'], 'bar'), ['--wait', 'bar']);
            assert.deepEqual(argv_1.addArg(['--wait', '--', '--foo'], 'bar'), ['--wait', 'bar', '--', '--foo']);
            assert.deepEqual(argv_1.addArg(['--', '--foo'], 'bar'), ['bar', '--', '--foo']);
        });
    });
});
//# sourceMappingURL=argv.test.js.map