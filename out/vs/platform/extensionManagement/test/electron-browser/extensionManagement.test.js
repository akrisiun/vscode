define(["require", "exports", "assert", "vs/platform/extensionManagement/common/extensionManagement"], function (require, exports, assert, extensionManagement_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Extension Identifier Pattern', () => {
        test('extension identifier pattern', () => {
            const regEx = new RegExp(extensionManagement_1.EXTENSION_IDENTIFIER_PATTERN);
            assert.equal(true, regEx.test('publisher.name'));
            assert.equal(true, regEx.test('publiSher.name'));
            assert.equal(true, regEx.test('publisher.Name'));
            assert.equal(true, regEx.test('PUBLISHER.NAME'));
            assert.equal(true, regEx.test('PUBLISHEr.NAMe'));
            assert.equal(true, regEx.test('PUBLISHEr.N-AMe'));
            assert.equal(true, regEx.test('PUBLISH12Er90.N-A54Me123'));
            assert.equal(true, regEx.test('111PUBLISH12Er90.N-1111A54Me123'));
            assert.equal(false, regEx.test('publishername'));
            assert.equal(false, regEx.test('-publisher.name'));
            assert.equal(false, regEx.test('publisher.-name'));
            assert.equal(false, regEx.test('-publisher.-name'));
            assert.equal(false, regEx.test('publ_isher.name'));
            assert.equal(false, regEx.test('publisher._name'));
        });
    });
});
//# sourceMappingURL=extensionManagement.test.js.map