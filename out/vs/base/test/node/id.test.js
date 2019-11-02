define(["require", "exports", "assert", "vs/base/node/id", "vs/base/node/macAddress"], function (require, exports, assert, id_1, macAddress_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ID', () => {
        test('getMachineId', function () {
            this.timeout(20000);
            return id_1.getMachineId().then(id => {
                assert.ok(id);
            });
        });
        test('getMac', () => {
            return macAddress_1.getMac().then(macAddress => {
                assert.ok(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(macAddress), `Expected a MAC address, got: ${macAddress}`);
            });
        });
    });
});
//# sourceMappingURL=id.test.js.map