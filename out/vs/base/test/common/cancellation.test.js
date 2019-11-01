define(["require", "exports", "assert", "vs/base/common/cancellation"], function (require, exports, assert, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('CancellationToken', function () {
        test('None', () => {
            assert.equal(cancellation_1.CancellationToken.None.isCancellationRequested, false);
            assert.equal(typeof cancellation_1.CancellationToken.None.onCancellationRequested, 'function');
        });
        test('cancel before token', function (done) {
            const source = new cancellation_1.CancellationTokenSource();
            assert.equal(source.token.isCancellationRequested, false);
            source.cancel();
            assert.equal(source.token.isCancellationRequested, true);
            source.token.onCancellationRequested(function () {
                assert.ok(true);
                done();
            });
        });
        test('cancel happens only once', function () {
            let source = new cancellation_1.CancellationTokenSource();
            assert.equal(source.token.isCancellationRequested, false);
            let cancelCount = 0;
            function onCancel() {
                cancelCount += 1;
            }
            source.token.onCancellationRequested(onCancel);
            source.cancel();
            source.cancel();
            assert.equal(cancelCount, 1);
        });
        test('cancel calls all listeners', function () {
            let count = 0;
            let source = new cancellation_1.CancellationTokenSource();
            source.token.onCancellationRequested(function () {
                count += 1;
            });
            source.token.onCancellationRequested(function () {
                count += 1;
            });
            source.token.onCancellationRequested(function () {
                count += 1;
            });
            source.cancel();
            assert.equal(count, 3);
        });
        test('token stays the same', function () {
            let source = new cancellation_1.CancellationTokenSource();
            let token = source.token;
            assert.ok(token === source.token); // doesn't change on get
            source.cancel();
            assert.ok(token === source.token); // doesn't change after cancel
            source.cancel();
            assert.ok(token === source.token); // doesn't change after 2nd cancel
            source = new cancellation_1.CancellationTokenSource();
            source.cancel();
            token = source.token;
            assert.ok(token === source.token); // doesn't change on get
        });
        test('dispose calls no listeners', function () {
            let count = 0;
            let source = new cancellation_1.CancellationTokenSource();
            source.token.onCancellationRequested(function () {
                count += 1;
            });
            source.dispose();
            source.cancel();
            assert.equal(count, 0);
        });
        test('parent cancels child', function () {
            let parent = new cancellation_1.CancellationTokenSource();
            let child = new cancellation_1.CancellationTokenSource(parent.token);
            let count = 0;
            child.token.onCancellationRequested(() => count += 1);
            parent.cancel();
            assert.equal(count, 1);
            assert.equal(child.token.isCancellationRequested, true);
            assert.equal(parent.token.isCancellationRequested, true);
        });
    });
});
//# sourceMappingURL=cancellation.test.js.map