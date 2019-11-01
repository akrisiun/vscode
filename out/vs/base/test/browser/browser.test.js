define(["require", "exports", "assert", "vs/base/common/platform"], function (require, exports, assert, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Browsers', () => {
        test('all', () => {
            assert(!(platform_1.isWindows && platform_1.isMacintosh));
        });
    });
});
//# sourceMappingURL=browser.test.js.map