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
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/test/workbenchTestServices", "vs/workbench/contrib/files/common/files", "vs/workbench/services/textfile/common/textfiles", "vs/platform/files/common/files"], function (require, exports, assert, uri_1, workbenchTestServices_1, files_1, textfiles_1, files_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ServiceAccessor = class ServiceAccessor {
        constructor(fileService) {
            this.fileService = fileService;
        }
    };
    ServiceAccessor = __decorate([
        __param(0, files_2.IFileService)
    ], ServiceAccessor);
    suite('Files - FileOnDiskContentProvider', () => {
        let instantiationService;
        let accessor;
        setup(() => {
            instantiationService = workbenchTestServices_1.workbenchInstantiationService();
            accessor = instantiationService.createInstance(ServiceAccessor);
        });
        test('provideTextContent', async () => {
            const provider = instantiationService.createInstance(files_1.TextFileContentProvider);
            const uri = uri_1.URI.parse('testFileOnDiskContentProvider://foo');
            const content = await provider.provideTextContent(uri.with({ scheme: 'conflictResolution', query: JSON.stringify({ scheme: uri.scheme }) }));
            assert.equal(textfiles_1.snapshotToString(content.createSnapshot()), 'Hello Html');
            assert.equal(accessor.fileService.getLastReadFileUri().toString(), uri.toString());
        });
    });
});
//# sourceMappingURL=fileOnDiskProvider.test.js.map