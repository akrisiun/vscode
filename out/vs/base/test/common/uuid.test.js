define(["require", "exports", "assert", "vs/base/common/uuid"], function (require, exports, assert, uuid) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('UUID', () => {
        test('generation', () => {
            const asHex = uuid.v4().asHex();
            assert.equal(asHex.length, 36);
            assert.equal(asHex[14], '4');
            assert.ok(asHex[19] === '8' || asHex[19] === '9' || asHex[19] === 'a' || asHex[19] === 'b');
        });
        test('parse', () => {
            const id = uuid.v4();
            const asHext = id.asHex();
            const id2 = uuid.parse(asHext);
            assert.equal(id.asHex(), id2.asHex());
        });
    });
});
//# sourceMappingURL=uuid.test.js.map