/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/test/workbenchTestServices", "vs/platform/workspace/test/common/testWorkspace", "vs/base/common/uri", "vs/base/common/path", "vs/base/common/platform", "vs/workbench/services/label/common/labelService"], function (require, exports, assert, workbenchTestServices_1, testWorkspace_1, uri_1, path_1, platform_1, labelService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('URI Label', () => {
        let labelService;
        setup(() => {
            labelService = new labelService_1.LabelService(workbenchTestServices_1.TestEnvironmentService, new workbenchTestServices_1.TestContextService());
        });
        test('file scheme', function () {
            labelService.registerFormatter({
                scheme: 'file',
                formatting: {
                    label: '${path}',
                    separator: path_1.sep,
                    tildify: !platform_1.isWindows,
                    normalizeDriveLetter: platform_1.isWindows
                }
            });
            const uri1 = testWorkspace_1.TestWorkspace.folders[0].uri.with({ path: testWorkspace_1.TestWorkspace.folders[0].uri.path.concat('/a/b/c/d') });
            assert.equal(labelService.getUriLabel(uri1, { relative: true }), platform_1.isWindows ? 'a\\b\\c\\d' : 'a/b/c/d');
            assert.equal(labelService.getUriLabel(uri1, { relative: false }), platform_1.isWindows ? 'C:\\testWorkspace\\a\\b\\c\\d' : '/testWorkspace/a/b/c/d');
            assert.equal(labelService.getUriBasenameLabel(uri1), 'd');
            const uri2 = uri_1.URI.file('c:\\1/2/3');
            assert.equal(labelService.getUriLabel(uri2, { relative: false }), platform_1.isWindows ? 'C:\\1\\2\\3' : '/c:\\1/2/3');
            assert.equal(labelService.getUriBasenameLabel(uri2), '3');
        });
        test('custom scheme', function () {
            labelService.registerFormatter({
                scheme: 'vscode',
                formatting: {
                    label: 'LABEL/${path}/${authority}/END',
                    separator: '/',
                    tildify: true,
                    normalizeDriveLetter: true
                }
            });
            const uri1 = uri_1.URI.parse('vscode://microsoft.com/1/2/3/4/5');
            assert.equal(labelService.getUriLabel(uri1, { relative: false }), 'LABEL//1/2/3/4/5/microsoft.com/END');
            assert.equal(labelService.getUriBasenameLabel(uri1), 'END');
        });
        test('separator', function () {
            labelService.registerFormatter({
                scheme: 'vscode',
                formatting: {
                    label: 'LABEL\\${path}\\${authority}\\END',
                    separator: '\\',
                    tildify: true,
                    normalizeDriveLetter: true
                }
            });
            const uri1 = uri_1.URI.parse('vscode://microsoft.com/1/2/3/4/5');
            assert.equal(labelService.getUriLabel(uri1, { relative: false }), 'LABEL\\\\1\\2\\3\\4\\5\\microsoft.com\\END');
            assert.equal(labelService.getUriBasenameLabel(uri1), 'END');
        });
        test('custom authority', function () {
            labelService.registerFormatter({
                scheme: 'vscode',
                authority: 'micro*',
                formatting: {
                    label: 'LABEL/${path}/${authority}/END',
                    separator: '/'
                }
            });
            const uri1 = uri_1.URI.parse('vscode://microsoft.com/1/2/3/4/5');
            assert.equal(labelService.getUriLabel(uri1, { relative: false }), 'LABEL//1/2/3/4/5/microsoft.com/END');
            assert.equal(labelService.getUriBasenameLabel(uri1), 'END');
        });
        test('mulitple authority', function () {
            labelService.registerFormatter({
                scheme: 'vscode',
                authority: 'not_matching_but_long',
                formatting: {
                    label: 'first',
                    separator: '/'
                }
            });
            labelService.registerFormatter({
                scheme: 'vscode',
                authority: 'microsof*',
                formatting: {
                    label: 'second',
                    separator: '/'
                }
            });
            labelService.registerFormatter({
                scheme: 'vscode',
                authority: 'mi*',
                formatting: {
                    label: 'third',
                    separator: '/'
                }
            });
            // Make sure the most specific authority is picked
            const uri1 = uri_1.URI.parse('vscode://microsoft.com/1/2/3/4/5');
            assert.equal(labelService.getUriLabel(uri1, { relative: false }), 'second');
            assert.equal(labelService.getUriBasenameLabel(uri1), 'second');
        });
        test('custom query', function () {
            labelService.registerFormatter({
                scheme: 'vscode',
                formatting: {
                    label: 'LABEL${query.prefix}: ${query.path}/END',
                    separator: '/',
                    tildify: true,
                    normalizeDriveLetter: true
                }
            });
            const uri1 = uri_1.URI.parse(`vscode://microsoft.com/1/2/3/4/5?${encodeURIComponent(JSON.stringify({ prefix: 'prefix', path: 'path' }))}`);
            assert.equal(labelService.getUriLabel(uri1, { relative: false }), 'LABELprefix: path/END');
        });
        test('custom query without value', function () {
            labelService.registerFormatter({
                scheme: 'vscode',
                formatting: {
                    label: 'LABEL${query.prefix}: ${query.path}/END',
                    separator: '/',
                    tildify: true,
                    normalizeDriveLetter: true
                }
            });
            const uri1 = uri_1.URI.parse(`vscode://microsoft.com/1/2/3/4/5?${encodeURIComponent(JSON.stringify({ path: 'path' }))}`);
            assert.equal(labelService.getUriLabel(uri1, { relative: false }), 'LABEL: path/END');
        });
        test('custom query without query json', function () {
            labelService.registerFormatter({
                scheme: 'vscode',
                formatting: {
                    label: 'LABEL${query.prefix}: ${query.path}/END',
                    separator: '/',
                    tildify: true,
                    normalizeDriveLetter: true
                }
            });
            const uri1 = uri_1.URI.parse('vscode://microsoft.com/1/2/3/4/5?path=foo');
            assert.equal(labelService.getUriLabel(uri1, { relative: false }), 'LABEL: /END');
        });
        test('custom query without query', function () {
            labelService.registerFormatter({
                scheme: 'vscode',
                formatting: {
                    label: 'LABEL${query.prefix}: ${query.path}/END',
                    separator: '/',
                    tildify: true,
                    normalizeDriveLetter: true
                }
            });
            const uri1 = uri_1.URI.parse('vscode://microsoft.com/1/2/3/4/5');
            assert.equal(labelService.getUriLabel(uri1, { relative: false }), 'LABEL: /END');
        });
    });
});
//# sourceMappingURL=label.test.js.map