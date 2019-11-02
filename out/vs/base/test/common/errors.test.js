define(["require", "exports", "assert", "vs/base/common/errorMessage"], function (require, exports, assert, errorMessage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Errors', () => {
        test('Get Error Message', function () {
            assert.strictEqual(errorMessage_1.toErrorMessage('Foo Bar'), 'Foo Bar');
            assert.strictEqual(errorMessage_1.toErrorMessage(new Error('Foo Bar')), 'Foo Bar');
            let error = new Error();
            error = new Error();
            error.detail = {};
            error.detail.exception = {};
            error.detail.exception.message = 'Foo Bar';
            assert.strictEqual(errorMessage_1.toErrorMessage(error), 'Foo Bar');
            assert(errorMessage_1.toErrorMessage());
            assert(errorMessage_1.toErrorMessage(null));
            assert(errorMessage_1.toErrorMessage({}));
        });
    });
});
//# sourceMappingURL=errors.test.js.map