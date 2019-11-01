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
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/test/common/utils", "vs/workbench/contrib/files/common/editors/fileEditorInput", "vs/workbench/services/editor/common/editorService", "vs/workbench/test/workbenchTestServices", "vs/workbench/services/textfile/common/textfiles", "vs/platform/files/common/files", "vs/editor/common/services/modelService", "vs/base/common/async", "vs/editor/common/modes/modesRegistry"], function (require, exports, assert, uri_1, utils_1, fileEditorInput_1, editorService_1, workbenchTestServices_1, textfiles_1, files_1, modelService_1, async_1, modesRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ServiceAccessor = class ServiceAccessor {
        constructor(editorService, textFileService, modelService) {
            this.editorService = editorService;
            this.textFileService = textFileService;
            this.modelService = modelService;
        }
    };
    ServiceAccessor = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, textfiles_1.ITextFileService),
        __param(2, modelService_1.IModelService)
    ], ServiceAccessor);
    suite('Files - FileEditorInput', () => {
        let instantiationService;
        let accessor;
        setup(() => {
            instantiationService = workbenchTestServices_1.workbenchInstantiationService();
            accessor = instantiationService.createInstance(ServiceAccessor);
        });
        test('Basics', async function () {
            let input = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar/file.js'), undefined, undefined);
            const otherInput = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, 'foo/bar/otherfile.js'), undefined, undefined);
            const otherInputSame = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, 'foo/bar/file.js'), undefined, undefined);
            assert(input.matches(input));
            assert(input.matches(otherInputSame));
            assert(!input.matches(otherInput));
            assert(!input.matches(null));
            assert.ok(input.getName());
            assert.ok(input.getDescription());
            assert.ok(input.getTitle(0 /* SHORT */));
            assert.strictEqual('file.js', input.getName());
            assert.strictEqual(utils_1.toResource.call(this, '/foo/bar/file.js').fsPath, input.getResource().fsPath);
            assert(input.getResource() instanceof uri_1.URI);
            input = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar.html'), undefined, undefined);
            const inputToResolve = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar/file.js'), undefined, undefined);
            const sameOtherInput = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar/file.js'), undefined, undefined);
            let resolved = await inputToResolve.resolve();
            assert.ok(inputToResolve.isResolved());
            const resolvedModelA = resolved;
            resolved = await inputToResolve.resolve();
            assert(resolvedModelA === resolved); // OK: Resolved Model cached globally per input
            const otherResolved = await sameOtherInput.resolve();
            assert(otherResolved === resolvedModelA); // OK: Resolved Model cached globally per input
            inputToResolve.dispose();
            resolved = await inputToResolve.resolve();
            assert(resolvedModelA === resolved); // Model is still the same because we had 2 clients
            inputToResolve.dispose();
            sameOtherInput.dispose();
            resolvedModelA.dispose();
            resolved = await inputToResolve.resolve();
            assert(resolvedModelA !== resolved); // Different instance, because input got disposed
            const stat = resolved.getStat();
            resolved = await inputToResolve.resolve();
            await async_1.timeout(0);
            assert(stat !== resolved.getStat()); // Different stat, because resolve always goes to the server for refresh
        });
        test('preferred mode', async function () {
            const mode = 'file-input-test';
            modesRegistry_1.ModesRegistry.registerLanguage({
                id: mode,
            });
            const input = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar/file.js'), undefined, mode);
            assert.equal(input.getPreferredMode(), mode);
            const model = await input.resolve();
            assert.equal(model.textEditorModel.getModeId(), mode);
            input.setMode('text');
            assert.equal(input.getPreferredMode(), 'text');
            assert.equal(model.textEditorModel.getModeId(), modesRegistry_1.PLAINTEXT_MODE_ID);
            const input2 = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar/file.js'), undefined, undefined);
            input2.setPreferredMode(mode);
            const model2 = await input2.resolve();
            assert.equal(model2.textEditorModel.getModeId(), mode);
        });
        test('matches', function () {
            const input1 = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar/updatefile.js'), undefined, undefined);
            const input2 = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar/updatefile.js'), undefined, undefined);
            const input3 = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar/other.js'), undefined, undefined);
            const input2Upper = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar/UPDATEFILE.js'), undefined, undefined);
            assert.strictEqual(input1.matches(null), false);
            assert.strictEqual(input1.matches(input1), true);
            assert.strictEqual(input1.matches(input2), true);
            assert.strictEqual(input1.matches(input3), false);
            assert.strictEqual(input1.matches(input2Upper), false);
        });
        test('getEncoding/setEncoding', async function () {
            const input = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar/updatefile.js'), undefined, undefined);
            input.setEncoding('utf16', 0 /* Encode */);
            assert.equal(input.getEncoding(), 'utf16');
            const resolved = await input.resolve();
            assert.equal(input.getEncoding(), resolved.getEncoding());
            resolved.dispose();
        });
        test('save', async function () {
            const input = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar/updatefile.js'), undefined, undefined);
            const resolved = await input.resolve();
            resolved.textEditorModel.setValue('changed');
            assert.ok(input.isDirty());
            await input.save();
            assert.ok(!input.isDirty());
            resolved.dispose();
        });
        test('revert', async function () {
            const input = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar/updatefile.js'), undefined, undefined);
            const resolved = await input.resolve();
            resolved.textEditorModel.setValue('changed');
            assert.ok(input.isDirty());
            await input.revert();
            assert.ok(!input.isDirty());
            resolved.dispose();
        });
        test('resolve handles binary files', async function () {
            const input = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar/updatefile.js'), undefined, undefined);
            accessor.textFileService.setResolveTextContentErrorOnce(new textfiles_1.TextFileOperationError('error', 0 /* FILE_IS_BINARY */));
            const resolved = await input.resolve();
            assert.ok(resolved);
            resolved.dispose();
        });
        test('resolve handles too large files', async function () {
            const input = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar/updatefile.js'), undefined, undefined);
            accessor.textFileService.setResolveTextContentErrorOnce(new files_1.FileOperationError('error', 7 /* FILE_TOO_LARGE */));
            const resolved = await input.resolve();
            assert.ok(resolved);
            resolved.dispose();
        });
    });
});
//# sourceMappingURL=fileEditorInput.test.js.map