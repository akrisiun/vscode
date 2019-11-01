define(["require", "exports", "assert", "vs/base/common/assert"], function (require, exports, assert, assert_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Assert', () => {
        test('ok', () => {
            assert.throws(function () {
                assert_1.ok(false);
            });
            assert.throws(function () {
                assert_1.ok(null);
            });
            assert.throws(function () {
                assert_1.ok();
            });
            assert.throws(function () {
                assert_1.ok(null, 'Foo Bar');
            }, function (e) {
                return e.message.indexOf('Foo Bar') >= 0;
            });
            assert_1.ok(true);
            assert_1.ok('foo');
            assert_1.ok({});
            assert_1.ok(5);
        });
    });
});
//# sourceMappingURL=assert.test.js.map