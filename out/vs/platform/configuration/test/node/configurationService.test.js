/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "os", "vs/base/common/path", "fs", "vs/platform/registry/common/platform", "vs/platform/configuration/node/configurationService", "vs/base/common/uuid", "vs/platform/configuration/common/configurationRegistry", "vs/base/test/node/utils", "vs/base/common/uri"], function (require, exports, assert, os, path, fs, platform_1, configurationService_1, uuid, configurationRegistry_1, utils_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ConfigurationService - Node', () => {
        test('simple', async () => {
            const res = await utils_1.testFile('config', 'config.json');
            fs.writeFileSync(res.testFile, '{ "foo": "bar" }');
            const service = new configurationService_1.ConfigurationService(uri_1.URI.file(res.testFile));
            await service.initialize();
            const config = service.getValue();
            assert.ok(config);
            assert.equal(config.foo, 'bar');
            service.dispose();
            return res.cleanUp();
        });
        test('config gets flattened', async () => {
            const res = await utils_1.testFile('config', 'config.json');
            fs.writeFileSync(res.testFile, '{ "testworkbench.editor.tabs": true }');
            const service = new configurationService_1.ConfigurationService(uri_1.URI.file(res.testFile));
            await service.initialize();
            const config = service.getValue();
            assert.ok(config);
            assert.ok(config.testworkbench);
            assert.ok(config.testworkbench.editor);
            assert.equal(config.testworkbench.editor.tabs, true);
            service.dispose();
            return res.cleanUp();
        });
        test('error case does not explode', async () => {
            const res = await utils_1.testFile('config', 'config.json');
            fs.writeFileSync(res.testFile, ',,,,');
            const service = new configurationService_1.ConfigurationService(uri_1.URI.file(res.testFile));
            await service.initialize();
            const config = service.getValue();
            assert.ok(config);
            service.dispose();
            return res.cleanUp();
        });
        test('missing file does not explode', async () => {
            const id = uuid.generateUuid();
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const newDir = path.join(parentDir, 'config', id);
            const testFile = path.join(newDir, 'config.json');
            const service = new configurationService_1.ConfigurationService(uri_1.URI.file(testFile));
            await service.initialize();
            const config = service.getValue();
            assert.ok(config);
            service.dispose();
        });
        test('trigger configuration change event', async () => {
            const res = await utils_1.testFile('config', 'config.json');
            const service = new configurationService_1.ConfigurationService(uri_1.URI.file(res.testFile));
            await service.initialize();
            return new Promise((c, e) => {
                const disposable = service.onDidChangeConfiguration(() => {
                    disposable.dispose();
                    assert.equal(service.getValue('foo'), 'bar');
                    service.dispose();
                    c();
                });
                fs.writeFileSync(res.testFile, '{ "foo": "bar" }');
            });
        });
        test('reloadConfiguration', async () => {
            const res = await utils_1.testFile('config', 'config.json');
            fs.writeFileSync(res.testFile, '{ "foo": "bar" }');
            const service = new configurationService_1.ConfigurationService(uri_1.URI.file(res.testFile));
            await service.initialize();
            let config = service.getValue();
            assert.ok(config);
            assert.equal(config.foo, 'bar');
            fs.writeFileSync(res.testFile, '{ "foo": "changed" }');
            // still outdated
            config = service.getValue();
            assert.ok(config);
            assert.equal(config.foo, 'bar');
            // force a reload to get latest
            await service.reloadConfiguration();
            config = service.getValue();
            assert.ok(config);
            assert.equal(config.foo, 'changed');
            service.dispose();
            return res.cleanUp();
        });
        test('model defaults', async () => {
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configuration.service.testSetting': {
                        'type': 'string',
                        'default': 'isSet'
                    }
                }
            });
            let serviceWithoutFile = new configurationService_1.ConfigurationService(uri_1.URI.file('__testFile'));
            await serviceWithoutFile.initialize();
            let setting = serviceWithoutFile.getValue();
            assert.ok(setting);
            assert.equal(setting.configuration.service.testSetting, 'isSet');
            return utils_1.testFile('config', 'config.json').then(async (res) => {
                fs.writeFileSync(res.testFile, '{ "testworkbench.editor.tabs": true }');
                const service = new configurationService_1.ConfigurationService(uri_1.URI.file(res.testFile));
                let setting = service.getValue();
                assert.ok(setting);
                assert.equal(setting.configuration.service.testSetting, 'isSet');
                fs.writeFileSync(res.testFile, '{ "configuration.service.testSetting": "isChanged" }');
                await service.reloadConfiguration();
                let setting_1 = service.getValue();
                assert.ok(setting_1);
                assert.equal(setting_1.configuration.service.testSetting, 'isChanged');
                service.dispose();
                serviceWithoutFile.dispose();
                return res.cleanUp();
            });
        });
        test('lookup', async () => {
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'lookup.service.testSetting': {
                        'type': 'string',
                        'default': 'isSet'
                    }
                }
            });
            const r = await utils_1.testFile('config', 'config.json');
            const service = new configurationService_1.ConfigurationService(uri_1.URI.file(r.testFile));
            service.initialize();
            let res = service.inspect('something.missing');
            assert.strictEqual(res.value, undefined);
            assert.strictEqual(res.default, undefined);
            assert.strictEqual(res.user, undefined);
            res = service.inspect('lookup.service.testSetting');
            assert.strictEqual(res.default, 'isSet');
            assert.strictEqual(res.value, 'isSet');
            assert.strictEqual(res.user, undefined);
            fs.writeFileSync(r.testFile, '{ "lookup.service.testSetting": "bar" }');
            await service.reloadConfiguration();
            res = service.inspect('lookup.service.testSetting');
            assert.strictEqual(res.default, 'isSet');
            assert.strictEqual(res.user, 'bar');
            assert.strictEqual(res.value, 'bar');
            service.dispose();
            return r.cleanUp();
        });
        test('lookup with null', async () => {
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            configurationRegistry.registerConfiguration({
                'id': '_testNull',
                'type': 'object',
                'properties': {
                    'lookup.service.testNullSetting': {
                        'type': 'null',
                    }
                }
            });
            const r = await utils_1.testFile('config', 'config.json');
            const service = new configurationService_1.ConfigurationService(uri_1.URI.file(r.testFile));
            service.initialize();
            let res = service.inspect('lookup.service.testNullSetting');
            assert.strictEqual(res.default, null);
            assert.strictEqual(res.value, null);
            assert.strictEqual(res.user, undefined);
            fs.writeFileSync(r.testFile, '{ "lookup.service.testNullSetting": null }');
            await service.reloadConfiguration();
            res = service.inspect('lookup.service.testNullSetting');
            assert.strictEqual(res.default, null);
            assert.strictEqual(res.value, null);
            assert.strictEqual(res.user, null);
            service.dispose();
            return r.cleanUp();
        });
    });
});
//# sourceMappingURL=configurationService.test.js.map