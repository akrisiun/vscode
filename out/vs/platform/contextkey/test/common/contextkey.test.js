define(["require", "exports", "assert", "vs/platform/contextkey/common/contextkey"], function (require, exports, assert, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createContext(ctx) {
        return {
            getValue: (key) => {
                return ctx[key];
            }
        };
    }
    suite('ContextKeyExpr', () => {
        test('ContextKeyExpr.equals', () => {
            let a = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('a1'), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('and.a')), contextkey_1.ContextKeyExpr.has('a2'), contextkey_1.ContextKeyExpr.regex('d3', /d.*/), contextkey_1.ContextKeyExpr.regex('d4', /\*\*3*/), contextkey_1.ContextKeyExpr.equals('b1', 'bb1'), contextkey_1.ContextKeyExpr.equals('b2', 'bb2'), contextkey_1.ContextKeyExpr.notEquals('c1', 'cc1'), contextkey_1.ContextKeyExpr.notEquals('c2', 'cc2'), contextkey_1.ContextKeyExpr.not('d1'), contextkey_1.ContextKeyExpr.not('d2'));
            let b = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('b2', 'bb2'), contextkey_1.ContextKeyExpr.notEquals('c1', 'cc1'), contextkey_1.ContextKeyExpr.not('d1'), contextkey_1.ContextKeyExpr.regex('d4', /\*\*3*/), contextkey_1.ContextKeyExpr.notEquals('c2', 'cc2'), contextkey_1.ContextKeyExpr.has('a2'), contextkey_1.ContextKeyExpr.equals('b1', 'bb1'), contextkey_1.ContextKeyExpr.regex('d3', /d.*/), contextkey_1.ContextKeyExpr.has('a1'), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('and.a', true)), contextkey_1.ContextKeyExpr.not('d2'));
            assert(a.equals(b), 'expressions should be equal');
        });
        test('normalize', () => {
            let key1IsTrue = contextkey_1.ContextKeyExpr.equals('key1', true);
            let key1IsNotFalse = contextkey_1.ContextKeyExpr.notEquals('key1', false);
            let key1IsFalse = contextkey_1.ContextKeyExpr.equals('key1', false);
            let key1IsNotTrue = contextkey_1.ContextKeyExpr.notEquals('key1', true);
            assert.ok(key1IsTrue.equals(contextkey_1.ContextKeyExpr.has('key1')));
            assert.ok(key1IsNotFalse.equals(contextkey_1.ContextKeyExpr.has('key1')));
            assert.ok(key1IsFalse.equals(contextkey_1.ContextKeyExpr.not('key1')));
            assert.ok(key1IsNotTrue.equals(contextkey_1.ContextKeyExpr.not('key1')));
        });
        test('evaluate', () => {
            /* tslint:disable:triple-equals */
            let context = createContext({
                'a': true,
                'b': false,
                'c': '5',
                'd': 'd'
            });
            function testExpression(expr, expected) {
                // console.log(expr + ' ' + expected);
                let rules = contextkey_1.ContextKeyExpr.deserialize(expr);
                assert.equal(rules.evaluate(context), expected, expr);
            }
            function testBatch(expr, value) {
                testExpression(expr, !!value);
                testExpression(expr + ' == true', !!value);
                testExpression(expr + ' != true', !value);
                testExpression(expr + ' == false', !value);
                testExpression(expr + ' != false', !!value);
                testExpression(expr + ' == 5', value == '5');
                testExpression(expr + ' != 5', value != '5');
                testExpression('!' + expr, !value);
                testExpression(expr + ' =~ /d.*/', /d.*/.test(value));
                testExpression(expr + ' =~ /D/i', /D/i.test(value));
            }
            testBatch('a', true);
            testBatch('b', false);
            testBatch('c', '5');
            testBatch('d', 'd');
            testBatch('z', undefined);
            testExpression('a && !b', true && !false);
            testExpression('a && b', true && false);
            testExpression('a && !b && c == 5', true && !false && '5' == '5');
            testExpression('d =~ /e.*/', false);
            /* tslint:enable:triple-equals */
            // precedence test: false && true || true === true because && is evaluated first
            testExpression('b && a || a', true);
            testExpression('a || b', true);
            testExpression('b || b', false);
            testExpression('b && a || a && b', false);
        });
        test('negate', () => {
            function testNegate(expr, expected) {
                const actual = contextkey_1.ContextKeyExpr.deserialize(expr).negate().serialize();
                assert.strictEqual(actual, expected);
            }
            testNegate('a', '!a');
            testNegate('a && b || c', '!a && !c || !b && !c');
            testNegate('a && b || c || d', '!a && !c && !d || !b && !c && !d');
            testNegate('!a && !b || !c && !d', 'a && c || a && d || b && c || b && d');
            testNegate('!a && !b || !c && !d || !e && !f', 'a && c && e || a && c && f || a && d && e || a && d && f || b && c && e || b && c && f || b && d && e || b && d && f');
        });
    });
});
//# sourceMappingURL=contextkey.test.js.map