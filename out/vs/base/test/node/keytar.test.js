define(["require", "exports", "assert", "vs/base/common/platform"], function (require, exports, assert, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Keytar', () => {
        test('loads and is functional', function (done) {
            if (platform.isLinux) {
                // Skip test due to set up issue with Travis.
                this.skip();
                return;
            }
            (async () => {
                const keytar = await new Promise((resolve_1, reject_1) => { require(['keytar'], resolve_1, reject_1); });
                const name = `VSCode Test ${Math.floor(Math.random() * 1e9)}`;
                try {
                    await keytar.setPassword(name, 'foo', 'bar');
                    assert.equal(await keytar.findPassword(name), 'bar');
                    assert.equal((await keytar.findCredentials(name)).length, 1);
                    assert.equal(await keytar.getPassword(name, 'foo'), 'bar');
                    await keytar.deletePassword(name, 'foo');
                    assert.equal(await keytar.getPassword(name, 'foo'), undefined);
                }
                catch (err) {
                    // try to clean up
                    try {
                        await keytar.deletePassword(name, 'foo');
                    }
                    finally {
                        // tslint:disable-next-line: no-unsafe-finally
                        throw err;
                    }
                }
            })().then(done, done);
        });
    });
});
//# sourceMappingURL=keytar.test.js.map