/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "assert", "vs/base/common/platform", "vs/base/common/uri", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/core/stringBuilder", "vs/editor/common/model/textModel", "vs/editor/common/services/modelServiceImpl", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService"], function (require, exports, assert, platform, uri_1, editOperation_1, range_1, stringBuilder_1, textModel_1, modelServiceImpl_1, configuration_1, testConfigurationService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const GENERATE_TESTS = false;
    suite('ModelService', () => {
        let modelService;
        setup(() => {
            const configService = new testConfigurationService_1.TestConfigurationService();
            configService.setUserConfiguration('files', { 'eol': '\n' });
            configService.setUserConfiguration('files', { 'eol': '\r\n' }, uri_1.URI.file(platform.isWindows ? 'c:\\myroot' : '/myroot'));
            modelService = new modelServiceImpl_1.ModelServiceImpl(configService, new TestTextResourcePropertiesService(configService));
        });
        teardown(() => {
            modelService.dispose();
        });
        test('EOL setting respected depending on root', () => {
            const model1 = modelService.createModel('farboo', null);
            const model2 = modelService.createModel('farboo', null, uri_1.URI.file(platform.isWindows ? 'c:\\myroot\\myfile.txt' : '/myroot/myfile.txt'));
            const model3 = modelService.createModel('farboo', null, uri_1.URI.file(platform.isWindows ? 'c:\\other\\myfile.txt' : '/other/myfile.txt'));
            assert.equal(model1.getOptions().defaultEOL, 1 /* LF */);
            assert.equal(model2.getOptions().defaultEOL, 2 /* CRLF */);
            assert.equal(model3.getOptions().defaultEOL, 1 /* LF */);
        });
        test('_computeEdits no change', function () {
            const model = textModel_1.TextModel.createFromString([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ].join('\n'));
            const textBuffer = textModel_1.createTextBuffer([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ].join('\n'), 1 /* LF */);
            const actual = modelServiceImpl_1.ModelServiceImpl._computeEdits(model, textBuffer);
            assert.deepEqual(actual, []);
        });
        test('_computeEdits first line changed', function () {
            const model = textModel_1.TextModel.createFromString([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ].join('\n'));
            const textBuffer = textModel_1.createTextBuffer([
                'This is line One',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ].join('\n'), 1 /* LF */);
            const actual = modelServiceImpl_1.ModelServiceImpl._computeEdits(model, textBuffer);
            assert.deepEqual(actual, [
                editOperation_1.EditOperation.replaceMove(new range_1.Range(1, 1, 2, 1), 'This is line One\n')
            ]);
        });
        test('_computeEdits EOL changed', function () {
            const model = textModel_1.TextModel.createFromString([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ].join('\n'));
            const textBuffer = textModel_1.createTextBuffer([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ].join('\r\n'), 1 /* LF */);
            const actual = modelServiceImpl_1.ModelServiceImpl._computeEdits(model, textBuffer);
            assert.deepEqual(actual, []);
        });
        test('_computeEdits EOL and other change 1', function () {
            const model = textModel_1.TextModel.createFromString([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ].join('\n'));
            const textBuffer = textModel_1.createTextBuffer([
                'This is line One',
                'and this is line number two',
                'It is followed by #3',
                'and finished with the fourth.',
            ].join('\r\n'), 1 /* LF */);
            const actual = modelServiceImpl_1.ModelServiceImpl._computeEdits(model, textBuffer);
            assert.deepEqual(actual, [
                editOperation_1.EditOperation.replaceMove(new range_1.Range(1, 1, 4, 1), [
                    'This is line One',
                    'and this is line number two',
                    'It is followed by #3',
                    ''
                ].join('\r\n'))
            ]);
        });
        test('_computeEdits EOL and other change 2', function () {
            const model = textModel_1.TextModel.createFromString([
                'package main',
                'func foo() {',
                '}' // 3
            ].join('\n'));
            const textBuffer = textModel_1.createTextBuffer([
                'package main',
                'func foo() {',
                '}',
                ''
            ].join('\r\n'), 1 /* LF */);
            const actual = modelServiceImpl_1.ModelServiceImpl._computeEdits(model, textBuffer);
            assert.deepEqual(actual, [
                editOperation_1.EditOperation.replaceMove(new range_1.Range(3, 2, 3, 2), '\r\n')
            ]);
        });
        test('generated1', () => {
            const file1 = ['pram', 'okctibad', 'pjuwtemued', 'knnnm', 'u', ''];
            const file2 = ['tcnr', 'rxwlicro', 'vnzy', '', '', 'pjzcogzur', 'ptmxyp', 'dfyshia', 'pee', 'ygg'];
            assertComputeEdits(file1, file2);
        });
        test('generated2', () => {
            const file1 = ['', 'itls', 'hrilyhesv', ''];
            const file2 = ['vdl', '', 'tchgz', 'bhx', 'nyl'];
            assertComputeEdits(file1, file2);
        });
        test('generated3', () => {
            const file1 = ['ubrbrcv', 'wv', 'xodspybszt', 's', 'wednjxm', 'fklajt', 'fyfc', 'lvejgge', 'rtpjlodmmk', 'arivtgmjdm'];
            const file2 = ['s', 'qj', 'tu', 'ur', 'qerhjjhyvx', 't'];
            assertComputeEdits(file1, file2);
        });
        test('generated4', () => {
            const file1 = ['ig', 'kh', 'hxegci', 'smvker', 'pkdmjjdqnv', 'vgkkqqx', '', 'jrzeb'];
            const file2 = ['yk', ''];
            assertComputeEdits(file1, file2);
        });
        test('does insertions in the middle of the document', () => {
            const file1 = [
                'line 1',
                'line 2',
                'line 3'
            ];
            const file2 = [
                'line 1',
                'line 2',
                'line 5',
                'line 3'
            ];
            assertComputeEdits(file1, file2);
        });
        test('does insertions at the end of the document', () => {
            const file1 = [
                'line 1',
                'line 2',
                'line 3'
            ];
            const file2 = [
                'line 1',
                'line 2',
                'line 3',
                'line 4'
            ];
            assertComputeEdits(file1, file2);
        });
        test('does insertions at the beginning of the document', () => {
            const file1 = [
                'line 1',
                'line 2',
                'line 3'
            ];
            const file2 = [
                'line 0',
                'line 1',
                'line 2',
                'line 3'
            ];
            assertComputeEdits(file1, file2);
        });
        test('does replacements', () => {
            const file1 = [
                'line 1',
                'line 2',
                'line 3'
            ];
            const file2 = [
                'line 1',
                'line 7',
                'line 3'
            ];
            assertComputeEdits(file1, file2);
        });
        test('does deletions', () => {
            const file1 = [
                'line 1',
                'line 2',
                'line 3'
            ];
            const file2 = [
                'line 1',
                'line 3'
            ];
            assertComputeEdits(file1, file2);
        });
        test('does insert, replace, and delete', () => {
            const file1 = [
                'line 1',
                'line 2',
                'line 3',
                'line 4',
                'line 5',
            ];
            const file2 = [
                'line 0',
                'line 1',
                'replace line 2',
                'line 3',
                // delete line 4
                'line 5',
            ];
            assertComputeEdits(file1, file2);
        });
    });
    function assertComputeEdits(lines1, lines2) {
        const model = textModel_1.TextModel.createFromString(lines1.join('\n'));
        const textBuffer = textModel_1.createTextBuffer(lines2.join('\n'), 1 /* LF */);
        // compute required edits
        // let start = Date.now();
        const edits = modelServiceImpl_1.ModelServiceImpl._computeEdits(model, textBuffer);
        // console.log(`took ${Date.now() - start} ms.`);
        // apply edits
        model.pushEditOperations([], edits, null);
        assert.equal(model.getValue(), lines2.join('\n'));
    }
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    function getRandomString(minLength, maxLength) {
        let length = getRandomInt(minLength, maxLength);
        let t = stringBuilder_1.createStringBuilder(length);
        for (let i = 0; i < length; i++) {
            t.appendASCII(getRandomInt(97 /* a */, 122 /* z */));
        }
        return t.build();
    }
    function generateFile(small) {
        let lineCount = getRandomInt(1, small ? 3 : 10000);
        let lines = [];
        for (let i = 0; i < lineCount; i++) {
            lines.push(getRandomString(0, small ? 3 : 10000));
        }
        return lines;
    }
    if (GENERATE_TESTS) {
        let number = 1;
        while (true) {
            console.log('------TEST: ' + number++);
            const file1 = generateFile(true);
            const file2 = generateFile(true);
            console.log('------TEST GENERATED');
            try {
                assertComputeEdits(file1, file2);
            }
            catch (err) {
                console.log(err);
                console.log(`
const file1 = ${JSON.stringify(file1).replace(/"/g, '\'')};
const file2 = ${JSON.stringify(file2).replace(/"/g, '\'')};
assertComputeEdits(file1, file2);
`);
                break;
            }
        }
    }
    let TestTextResourcePropertiesService = class TestTextResourcePropertiesService {
        constructor(configurationService) {
            this.configurationService = configurationService;
        }
        getEOL(resource, language) {
            const filesConfiguration = this.configurationService.getValue('files', { overrideIdentifier: language, resource });
            if (filesConfiguration && filesConfiguration.eol) {
                if (filesConfiguration.eol !== 'auto') {
                    return filesConfiguration.eol;
                }
            }
            return (platform.isLinux || platform.isMacintosh) ? '\n' : '\r\n';
        }
    };
    TestTextResourcePropertiesService = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], TestTextResourcePropertiesService);
});
//# sourceMappingURL=modelService.test.js.map