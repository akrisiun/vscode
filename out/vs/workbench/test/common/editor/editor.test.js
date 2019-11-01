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
define(["require", "exports", "assert", "vs/workbench/common/editor", "vs/workbench/common/editor/diffEditorInput", "vs/base/common/uri", "vs/workbench/services/untitled/common/untitledEditorService", "vs/workbench/test/workbenchTestServices", "vs/base/common/network"], function (require, exports, assert, editor_1, diffEditorInput_1, uri_1, untitledEditorService_1, workbenchTestServices_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ServiceAccessor = class ServiceAccessor {
        constructor(untitledEditorService) {
            this.untitledEditorService = untitledEditorService;
        }
    };
    ServiceAccessor = __decorate([
        __param(0, untitledEditorService_1.IUntitledEditorService)
    ], ServiceAccessor);
    class FileEditorInput extends editor_1.EditorInput {
        constructor(resource) {
            super();
            this.resource = resource;
        }
        getTypeId() {
            return 'editorResourceFileTest';
        }
        getResource() {
            return this.resource;
        }
        resolve() {
            return Promise.resolve(null);
        }
    }
    suite('Workbench editor', () => {
        let instantiationService;
        let accessor;
        setup(() => {
            instantiationService = workbenchTestServices_1.workbenchInstantiationService();
            accessor = instantiationService.createInstance(ServiceAccessor);
        });
        teardown(() => {
            accessor.untitledEditorService.revertAll();
            accessor.untitledEditorService.dispose();
        });
        test('toResource', () => {
            const service = accessor.untitledEditorService;
            assert.ok(!editor_1.toResource(null));
            const untitled = service.createOrGet();
            assert.equal(editor_1.toResource(untitled).toString(), untitled.getResource().toString());
            assert.equal(editor_1.toResource(untitled, { supportSideBySide: editor_1.SideBySideEditor.MASTER }).toString(), untitled.getResource().toString());
            assert.equal(editor_1.toResource(untitled, { filterByScheme: network_1.Schemas.untitled }).toString(), untitled.getResource().toString());
            assert.equal(editor_1.toResource(untitled, { filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).toString(), untitled.getResource().toString());
            assert.ok(!editor_1.toResource(untitled, { filterByScheme: network_1.Schemas.file }));
            const file = new FileEditorInput(uri_1.URI.file('/some/path.txt'));
            assert.equal(editor_1.toResource(file).toString(), file.getResource().toString());
            assert.equal(editor_1.toResource(file, { supportSideBySide: editor_1.SideBySideEditor.MASTER }).toString(), file.getResource().toString());
            assert.equal(editor_1.toResource(file, { filterByScheme: network_1.Schemas.file }).toString(), file.getResource().toString());
            assert.equal(editor_1.toResource(file, { filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).toString(), file.getResource().toString());
            assert.ok(!editor_1.toResource(file, { filterByScheme: network_1.Schemas.untitled }));
            const diffEditorInput = new diffEditorInput_1.DiffEditorInput('name', 'description', untitled, file);
            assert.ok(!editor_1.toResource(diffEditorInput));
            assert.ok(!editor_1.toResource(diffEditorInput, { filterByScheme: network_1.Schemas.file }));
            assert.equal(editor_1.toResource(file, { supportSideBySide: editor_1.SideBySideEditor.MASTER }).toString(), file.getResource().toString());
            assert.equal(editor_1.toResource(file, { supportSideBySide: editor_1.SideBySideEditor.MASTER, filterByScheme: network_1.Schemas.file }).toString(), file.getResource().toString());
            assert.equal(editor_1.toResource(file, { supportSideBySide: editor_1.SideBySideEditor.MASTER, filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).toString(), file.getResource().toString());
        });
    });
});
//# sourceMappingURL=editor.test.js.map