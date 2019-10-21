var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/test/workbenchTestServices", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/untitled/common/untitledEditorService", "vs/platform/files/common/files", "vs/base/common/network", "vs/platform/instantiation/common/serviceCollection", "vs/base/node/pfs", "vs/base/common/lifecycle", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/base/test/node/testUtils", "os", "vs/platform/files/node/diskFileSystemProvider", "vs/base/common/uuid", "vs/base/common/path", "vs/base/common/amd", "vs/base/node/encoding", "vs/workbench/services/textfile/electron-browser/nativeTextFileService", "vs/editor/common/model/textModel", "vs/base/common/platform", "fs", "vs/base/test/node/encoding/encoding.test"], function (require, exports, assert, uri_1, workbenchTestServices_1, textfiles_1, untitledEditorService_1, files_1, network_1, serviceCollection_1, pfs_1, lifecycle_1, fileService_1, log_1, testUtils_1, os_1, diskFileSystemProvider_1, uuid_1, path_1, amd_1, encoding_1, nativeTextFileService_1, textModel_1, platform_1, fs_1, encoding_test_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ServiceAccessor = class ServiceAccessor {
        constructor(textFileService, untitledEditorService) {
            this.textFileService = textFileService;
            this.untitledEditorService = untitledEditorService;
        }
    };
    ServiceAccessor = __decorate([
        __param(0, textfiles_1.ITextFileService),
        __param(1, untitledEditorService_1.IUntitledEditorService)
    ], ServiceAccessor);
    class TestNativeTextFileService extends nativeTextFileService_1.NativeTextFileService {
        get encoding() {
            if (!this._testEncoding) {
                this._testEncoding = this._register(this.instantiationService.createInstance(TestEncodingOracle));
            }
            return this._testEncoding;
        }
    }
    class TestEncodingOracle extends nativeTextFileService_1.EncodingOracle {
        get encodingOverrides() {
            return [
                { extension: 'utf16le', encoding: encoding_1.UTF16le },
                { extension: 'utf16be', encoding: encoding_1.UTF16be },
                { extension: 'utf8bom', encoding: encoding_1.UTF8_with_bom }
            ];
        }
        set encodingOverrides(overrides) { }
    }
    suite('Files - TextFileService i/o', () => {
        const parentDir = testUtils_1.getRandomTestPath(os_1.tmpdir(), 'vsctests', 'textfileservice');
        let accessor;
        const disposables = new lifecycle_1.DisposableStore();
        let service;
        let testDir;
        setup(async () => {
            const instantiationService = workbenchTestServices_1.workbenchInstantiationService();
            accessor = instantiationService.createInstance(ServiceAccessor);
            const logService = new log_1.NullLogService();
            const fileService = new fileService_1.FileService(logService);
            const fileProvider = new diskFileSystemProvider_1.DiskFileSystemProvider(logService);
            disposables.add(fileService.registerProvider(network_1.Schemas.file, fileProvider));
            disposables.add(fileProvider);
            const collection = new serviceCollection_1.ServiceCollection();
            collection.set(files_1.IFileService, fileService);
            service = instantiationService.createChild(collection).createInstance(TestNativeTextFileService);
            const id = uuid_1.generateUuid();
            testDir = path_1.join(parentDir, id);
            const sourceDir = amd_1.getPathFromAmdModule(require, './fixtures');
            await pfs_1.copy(sourceDir, testDir);
        });
        teardown(async () => {
            accessor.textFileService.models.clear();
            accessor.textFileService.models.dispose();
            accessor.untitledEditorService.revertAll();
            disposables.clear();
            await pfs_1.rimraf(parentDir, pfs_1.RimRafMode.MOVE);
        });
        test('create - no encoding - content empty', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small_new.txt'));
            await service.create(resource);
            assert.equal(await pfs_1.exists(resource.fsPath), true);
        });
        test('create - no encoding - content provided', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small_new.txt'));
            await service.create(resource, 'Hello World');
            assert.equal(await pfs_1.exists(resource.fsPath), true);
            assert.equal((await pfs_1.readFile(resource.fsPath)).toString(), 'Hello World');
        });
        test('create - UTF 16 LE - no content', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small_new.utf16le'));
            await service.create(resource);
            assert.equal(await pfs_1.exists(resource.fsPath), true);
            const detectedEncoding = await encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF16le);
        });
        test('create - UTF 16 LE - content provided', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small_new.utf16le'));
            await service.create(resource, 'Hello World');
            assert.equal(await pfs_1.exists(resource.fsPath), true);
            const detectedEncoding = await encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF16le);
        });
        test('create - UTF 16 BE - no content', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small_new.utf16be'));
            await service.create(resource);
            assert.equal(await pfs_1.exists(resource.fsPath), true);
            const detectedEncoding = await encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF16be);
        });
        test('create - UTF 16 BE - content provided', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small_new.utf16be'));
            await service.create(resource, 'Hello World');
            assert.equal(await pfs_1.exists(resource.fsPath), true);
            const detectedEncoding = await encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF16be);
        });
        test('create - UTF 8 BOM - no content', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small_new.utf8bom'));
            await service.create(resource);
            assert.equal(await pfs_1.exists(resource.fsPath), true);
            const detectedEncoding = await encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF8);
        });
        test('create - UTF 8 BOM - content provided', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small_new.utf8bom'));
            await service.create(resource, 'Hello World');
            assert.equal(await pfs_1.exists(resource.fsPath), true);
            const detectedEncoding = await encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF8);
        });
        test('create - UTF 8 BOM - empty content - snapshot', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small_new.utf8bom'));
            await service.create(resource, textModel_1.TextModel.createFromString('').createSnapshot());
            assert.equal(await pfs_1.exists(resource.fsPath), true);
            const detectedEncoding = await encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF8);
        });
        test('create - UTF 8 BOM - content provided - snapshot', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small_new.utf8bom'));
            await service.create(resource, textModel_1.TextModel.createFromString('Hello World').createSnapshot());
            assert.equal(await pfs_1.exists(resource.fsPath), true);
            const detectedEncoding = await encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF8);
        });
        test('write - use encoding (UTF 16 BE) - small content as string', async () => {
            await testEncoding(uri_1.URI.file(path_1.join(testDir, 'small.txt')), encoding_1.UTF16be, 'Hello\nWorld', 'Hello\nWorld');
        });
        test('write - use encoding (UTF 16 BE) - small content as snapshot', async () => {
            await testEncoding(uri_1.URI.file(path_1.join(testDir, 'small.txt')), encoding_1.UTF16be, textModel_1.TextModel.createFromString('Hello\nWorld').createSnapshot(), 'Hello\nWorld');
        });
        test('write - use encoding (UTF 16 BE) - large content as string', async () => {
            await testEncoding(uri_1.URI.file(path_1.join(testDir, 'lorem.txt')), encoding_1.UTF16be, 'Hello\nWorld', 'Hello\nWorld');
        });
        test('write - use encoding (UTF 16 BE) - large content as snapshot', async () => {
            await testEncoding(uri_1.URI.file(path_1.join(testDir, 'lorem.txt')), encoding_1.UTF16be, textModel_1.TextModel.createFromString('Hello\nWorld').createSnapshot(), 'Hello\nWorld');
        });
        async function testEncoding(resource, encoding, content, expectedContent) {
            await service.write(resource, content, { encoding });
            const detectedEncoding = await encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding);
            const resolved = await service.readStream(resource);
            assert.equal(resolved.encoding, encoding);
            assert.equal(textfiles_1.snapshotToString(resolved.value.create(platform_1.isWindows ? 2 /* CRLF */ : 1 /* LF */).createSnapshot(false)), expectedContent);
        }
        test('write - use encoding (cp1252)', async () => {
            const filePath = path_1.join(testDir, 'some_cp1252.txt');
            const contents = await pfs_1.readFile(filePath, 'utf8');
            const eol = /\r\n/.test(contents) ? '\r\n' : '\n';
            await testEncodingKeepsData(uri_1.URI.file(filePath), 'cp1252', ['ObjectCount = LoadObjects("Öffentlicher Ordner");', '', 'Private = "Persönliche Information"', ''].join(eol));
        });
        test('write - use encoding (shiftjis)', async () => {
            await testEncodingKeepsData(uri_1.URI.file(path_1.join(testDir, 'some_shiftjs.txt')), 'shiftjis', '中文abc');
        });
        test('write - use encoding (gbk)', async () => {
            await testEncodingKeepsData(uri_1.URI.file(path_1.join(testDir, 'some_gbk.txt')), 'gbk', '中国abc');
        });
        test('write - use encoding (cyrillic)', async () => {
            await testEncodingKeepsData(uri_1.URI.file(path_1.join(testDir, 'some_cyrillic.txt')), 'cp866', 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя');
        });
        test('write - use encoding (big5)', async () => {
            await testEncodingKeepsData(uri_1.URI.file(path_1.join(testDir, 'some_big5.txt')), 'cp950', '中文abc');
        });
        async function testEncodingKeepsData(resource, encoding, expected) {
            let resolved = await service.readStream(resource, { encoding });
            const content = textfiles_1.snapshotToString(resolved.value.create(platform_1.isWindows ? 2 /* CRLF */ : 1 /* LF */).createSnapshot(false));
            assert.equal(content, expected);
            await service.write(resource, content, { encoding });
            resolved = await service.readStream(resource, { encoding });
            assert.equal(textfiles_1.snapshotToString(resolved.value.create(2 /* CRLF */).createSnapshot(false)), content);
            await service.write(resource, textModel_1.TextModel.createFromString(content).createSnapshot(), { encoding });
            resolved = await service.readStream(resource, { encoding });
            assert.equal(textfiles_1.snapshotToString(resolved.value.create(2 /* CRLF */).createSnapshot(false)), content);
        }
        test('write - no encoding - content as string', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            const content = (await pfs_1.readFile(resource.fsPath)).toString();
            await service.write(resource, content);
            const resolved = await service.readStream(resource);
            assert.equal(resolved.value.getFirstLineText(999999), content);
        });
        test('write - no encoding - content as snapshot', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            const content = (await pfs_1.readFile(resource.fsPath)).toString();
            await service.write(resource, textModel_1.TextModel.createFromString(content).createSnapshot());
            const resolved = await service.readStream(resource);
            assert.equal(resolved.value.getFirstLineText(999999), content);
        });
        test('write - encoding preserved (UTF 16 LE) - content as string', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'some_utf16le.css'));
            const resolved = await service.readStream(resource);
            assert.equal(resolved.encoding, encoding_1.UTF16le);
            await testEncoding(uri_1.URI.file(path_1.join(testDir, 'some_utf16le.css')), encoding_1.UTF16le, 'Hello\nWorld', 'Hello\nWorld');
        });
        test('write - encoding preserved (UTF 16 LE) - content as snapshot', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'some_utf16le.css'));
            const resolved = await service.readStream(resource);
            assert.equal(resolved.encoding, encoding_1.UTF16le);
            await testEncoding(uri_1.URI.file(path_1.join(testDir, 'some_utf16le.css')), encoding_1.UTF16le, textModel_1.TextModel.createFromString('Hello\nWorld').createSnapshot(), 'Hello\nWorld');
        });
        test('write - UTF8 variations - content as string', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'index.html'));
            let detectedEncoding = await encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, null);
            const content = (await pfs_1.readFile(resource.fsPath)).toString() + 'updates';
            await service.write(resource, content, { encoding: encoding_1.UTF8_with_bom });
            detectedEncoding = await encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF8);
            // ensure BOM preserved
            await service.write(resource, content, { encoding: encoding_1.UTF8 });
            detectedEncoding = await encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF8);
            // allow to remove BOM
            await service.write(resource, content, { encoding: encoding_1.UTF8, overwriteEncoding: true });
            detectedEncoding = await encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, null);
            // BOM does not come back
            await service.write(resource, content, { encoding: encoding_1.UTF8 });
            detectedEncoding = await encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, null);
        });
        test('write - UTF8 variations - content as snapshot', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'index.html'));
            let detectedEncoding = await encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, null);
            const model = textModel_1.TextModel.createFromString((await pfs_1.readFile(resource.fsPath)).toString() + 'updates');
            await service.write(resource, model.createSnapshot(), { encoding: encoding_1.UTF8_with_bom });
            detectedEncoding = await encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF8);
            // ensure BOM preserved
            await service.write(resource, model.createSnapshot(), { encoding: encoding_1.UTF8 });
            detectedEncoding = await encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF8);
            // allow to remove BOM
            await service.write(resource, model.createSnapshot(), { encoding: encoding_1.UTF8, overwriteEncoding: true });
            detectedEncoding = await encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, null);
            // BOM does not come back
            await service.write(resource, model.createSnapshot(), { encoding: encoding_1.UTF8 });
            detectedEncoding = await encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, null);
        });
        test('write - preserve UTF8 BOM - content as string', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'some_utf8_bom.txt'));
            let detectedEncoding = await encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF8);
            await service.write(resource, 'Hello World');
            detectedEncoding = await encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF8);
        });
        test('write - ensure BOM in empty file - content as string', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            await service.write(resource, '', { encoding: encoding_1.UTF8_with_bom });
            let detectedEncoding = await encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF8);
        });
        test('write - ensure BOM in empty file - content as snapshot', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            await service.write(resource, textModel_1.TextModel.createFromString('').createSnapshot(), { encoding: encoding_1.UTF8_with_bom });
            let detectedEncoding = await encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF8);
        });
        test('readStream - small text', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            await testReadStream(resource);
        });
        test('readStream - large text', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'lorem.txt'));
            await testReadStream(resource);
        });
        async function testReadStream(resource) {
            const result = await service.readStream(resource);
            assert.equal(result.name, path_1.basename(resource.fsPath));
            assert.equal(result.size, fs_1.statSync(resource.fsPath).size);
            assert.equal(textfiles_1.snapshotToString(result.value.create(1 /* LF */).createSnapshot(false)), textfiles_1.snapshotToString(textModel_1.TextModel.createFromString(fs_1.readFileSync(resource.fsPath).toString()).createSnapshot(false)));
        }
        test('read - small text', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            await testRead(resource);
        });
        test('read - large text', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'lorem.txt'));
            await testRead(resource);
        });
        async function testRead(resource) {
            const result = await service.read(resource);
            assert.equal(result.name, path_1.basename(resource.fsPath));
            assert.equal(result.size, fs_1.statSync(resource.fsPath).size);
            assert.equal(result.value, fs_1.readFileSync(resource.fsPath).toString());
        }
        test('readStream - encoding picked up (CP1252)', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'some_small_cp1252.txt'));
            const encoding = 'windows1252';
            const result = await service.readStream(resource, { encoding });
            assert.equal(result.encoding, encoding);
            assert.equal(result.value.getFirstLineText(999999), 'Private = "Persönlicheß Information"');
        });
        test('read - encoding picked up (CP1252)', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'some_small_cp1252.txt'));
            const encoding = 'windows1252';
            const result = await service.read(resource, { encoding });
            assert.equal(result.encoding, encoding);
            assert.equal(result.value, 'Private = "Persönlicheß Information"');
        });
        test('read - encoding picked up (binary)', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'some_small_cp1252.txt'));
            const encoding = 'binary';
            const result = await service.read(resource, { encoding });
            assert.equal(result.encoding, encoding);
            assert.equal(result.value, 'Private = "Persönlicheß Information"');
        });
        test('read - encoding picked up (base64)', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'some_small_cp1252.txt'));
            const encoding = 'base64';
            const result = await service.read(resource, { encoding });
            assert.equal(result.encoding, encoding);
            assert.equal(result.value, btoa('Private = "Persönlicheß Information"'));
        });
        test('readStream - user overrides BOM', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'some_utf16le.css'));
            const result = await service.readStream(resource, { encoding: 'windows1252' });
            assert.equal(result.encoding, 'windows1252');
        });
        test('readStream - BOM removed', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'some_utf8_bom.txt'));
            const result = await service.readStream(resource);
            assert.equal(result.value.getFirstLineText(999999), 'This is some UTF 8 with BOM file.');
        });
        test('readStream - invalid encoding', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'index.html'));
            const result = await service.readStream(resource, { encoding: 'superduper' });
            assert.equal(result.encoding, 'utf8');
        });
        test('readStream - encoding override', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'some.utf16le'));
            const result = await service.readStream(resource, { encoding: 'windows1252' });
            assert.equal(result.encoding, 'utf16le');
            assert.equal(result.value.getFirstLineText(999999), 'This is some UTF 16 with BOM file.');
        });
        test('readStream - large Big5', async () => {
            await testLargeEncoding('big5', '中文abc');
        });
        test('readStream - large CP1252', async () => {
            await testLargeEncoding('cp1252', 'öäüß');
        });
        test('readStream - large Cyrillic', async () => {
            await testLargeEncoding('cp866', 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя');
        });
        test('readStream - large GBK', async () => {
            await testLargeEncoding('gbk', '中国abc');
        });
        test('readStream - large ShiftJS', async () => {
            await testLargeEncoding('shiftjis', '中文abc');
        });
        test('readStream - large UTF8 BOM', async () => {
            await testLargeEncoding('utf8bom', 'öäüß');
        });
        test('readStream - large UTF16 LE', async () => {
            await testLargeEncoding('utf16le', 'öäüß');
        });
        test('readStream - large UTF16 BE', async () => {
            await testLargeEncoding('utf16be', 'öäüß');
        });
        async function testLargeEncoding(encoding, needle) {
            const resource = uri_1.URI.file(path_1.join(testDir, `lorem_${encoding}.txt`));
            const result = await service.readStream(resource, { encoding });
            assert.equal(result.encoding, encoding);
            const contents = textfiles_1.snapshotToString(result.value.create(1 /* LF */).createSnapshot(false));
            assert.equal(contents.indexOf(needle), 0);
            assert.ok(contents.indexOf(needle, 10) > 0);
        }
        test('readStream - UTF16 LE (no BOM)', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'utf16_le_nobom.txt'));
            const result = await service.readStream(resource);
            assert.equal(result.encoding, 'utf16le');
        });
        test('readStream - UTF16 BE (no BOM)', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'utf16_be_nobom.txt'));
            const result = await service.readStream(resource);
            assert.equal(result.encoding, 'utf16be');
        });
        test('readStream - autoguessEncoding', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'some_cp1252.txt'));
            const result = await service.readStream(resource, { autoGuessEncoding: true });
            assert.equal(result.encoding, 'windows1252');
        });
        test('readStream - FILE_IS_BINARY', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'binary.txt'));
            let error = undefined;
            try {
                await service.readStream(resource, { acceptTextOnly: true });
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
            assert.equal(error.textFileOperationResult, 0 /* FILE_IS_BINARY */);
            const result = await service.readStream(uri_1.URI.file(path_1.join(testDir, 'small.txt')), { acceptTextOnly: true });
            assert.equal(result.name, 'small.txt');
        });
        test('read - FILE_IS_BINARY', async () => {
            const resource = uri_1.URI.file(path_1.join(testDir, 'binary.txt'));
            let error = undefined;
            try {
                await service.read(resource, { acceptTextOnly: true });
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
            assert.equal(error.textFileOperationResult, 0 /* FILE_IS_BINARY */);
            const result = await service.read(uri_1.URI.file(path_1.join(testDir, 'small.txt')), { acceptTextOnly: true });
            assert.equal(result.name, 'small.txt');
        });
    });
});
//# sourceMappingURL=textFileService.io.test.js.map