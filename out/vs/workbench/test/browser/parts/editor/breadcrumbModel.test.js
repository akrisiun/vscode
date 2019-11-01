/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/platform/workspace/common/workspace", "vs/workbench/browser/parts/editor/breadcrumbsModel", "vs/workbench/test/workbenchTestServices", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/files/common/files"], function (require, exports, assert, uri_1, workspace_1, breadcrumbsModel_1, workbenchTestServices_1, testConfigurationService_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Breadcrumb Model', function () {
        const workspaceService = new workbenchTestServices_1.TestContextService(new workspace_1.Workspace('ffff', [new workspace_1.WorkspaceFolder({ uri: uri_1.URI.parse('foo:/bar/baz/ws'), name: 'ws', index: 0 })]));
        const configService = new class extends testConfigurationService_1.TestConfigurationService {
            getValue(...args) {
                if (args[0] === 'breadcrumbs.filePath') {
                    return 'on';
                }
                if (args[0] === 'breadcrumbs.symbolPath') {
                    return 'on';
                }
                return super.getValue(...args);
            }
        };
        test('only uri, inside workspace', function () {
            let model = new breadcrumbsModel_1.EditorBreadcrumbsModel(uri_1.URI.parse('foo:/bar/baz/ws/some/path/file.ts'), undefined, workspaceService, configService);
            let elements = model.getElements();
            assert.equal(elements.length, 3);
            let [one, two, three] = elements;
            assert.equal(one.kind, files_1.FileKind.FOLDER);
            assert.equal(two.kind, files_1.FileKind.FOLDER);
            assert.equal(three.kind, files_1.FileKind.FILE);
            assert.equal(one.uri.toString(), 'foo:/bar/baz/ws/some');
            assert.equal(two.uri.toString(), 'foo:/bar/baz/ws/some/path');
            assert.equal(three.uri.toString(), 'foo:/bar/baz/ws/some/path/file.ts');
        });
        test('only uri, outside workspace', function () {
            let model = new breadcrumbsModel_1.EditorBreadcrumbsModel(uri_1.URI.parse('foo:/outside/file.ts'), undefined, workspaceService, configService);
            let elements = model.getElements();
            assert.equal(elements.length, 2);
            let [one, two] = elements;
            assert.equal(one.kind, files_1.FileKind.FOLDER);
            assert.equal(two.kind, files_1.FileKind.FILE);
            assert.equal(one.uri.toString(), 'foo:/outside');
            assert.equal(two.uri.toString(), 'foo:/outside/file.ts');
        });
    });
});
//# sourceMappingURL=breadcrumbModel.test.js.map