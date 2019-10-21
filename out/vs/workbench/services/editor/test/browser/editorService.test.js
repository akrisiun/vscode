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
define(["require", "exports", "assert", "vs/platform/editor/common/editor", "vs/base/common/uri", "vs/workbench/browser/parts/editor/baseEditor", "vs/workbench/common/editor", "vs/workbench/test/workbenchTestServices", "vs/workbench/common/editor/resourceEditorInput", "vs/platform/theme/test/common/testThemeService", "vs/workbench/services/editor/browser/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/browser/parts/editor/editorPart", "vs/platform/instantiation/common/serviceCollection", "vs/workbench/services/editor/common/editorService", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/browser/editor", "vs/platform/instantiation/common/descriptors", "vs/platform/registry/common/platform", "vs/workbench/contrib/files/common/editors/fileEditorInput", "vs/workbench/common/editor/untitledEditorInput", "vs/base/common/async", "vs/base/test/common/utils", "vs/platform/files/common/files", "vs/base/common/lifecycle", "vs/editor/common/modes/modesRegistry", "vs/platform/files/test/common/nullFileSystemProvider"], function (require, exports, assert, editor_1, uri_1, baseEditor_1, editor_2, workbenchTestServices_1, resourceEditorInput_1, testThemeService_1, editorService_1, editorGroupsService_1, editorPart_1, serviceCollection_1, editorService_2, telemetry_1, telemetryUtils_1, editor_3, descriptors_1, platform_1, fileEditorInput_1, untitledEditorInput_1, async_1, utils_1, files_1, lifecycle_1, modesRegistry_1, nullFileSystemProvider_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TestEditorControl = class TestEditorControl extends baseEditor_1.BaseEditor {
        constructor(telemetryService) { super('MyTestEditorForEditorService', telemetryUtils_1.NullTelemetryService, new testThemeService_1.TestThemeService(), new workbenchTestServices_1.TestStorageService()); }
        async setInput(input, options, token) {
            super.setInput(input, options, token);
            await input.resolve();
        }
        getId() { return 'MyTestEditorForEditorService'; }
        layout() { }
        createEditor() { }
    };
    TestEditorControl = __decorate([
        __param(0, telemetry_1.ITelemetryService)
    ], TestEditorControl);
    exports.TestEditorControl = TestEditorControl;
    class TestEditorInput extends editor_2.EditorInput {
        constructor(resource) {
            super();
            this.resource = resource;
            this.gotDisposed = false;
            this.fails = false;
        }
        getTypeId() { return 'testEditorInputForEditorService'; }
        resolve() { return !this.fails ? Promise.resolve(null) : Promise.reject(new Error('fails')); }
        matches(other) { return other && other.resource && this.resource.toString() === other.resource.toString() && other instanceof TestEditorInput; }
        setEncoding(encoding) { }
        getEncoding() { return undefined; }
        setPreferredEncoding(encoding) { }
        setMode(mode) { }
        setPreferredMode(mode) { }
        getResource() { return this.resource; }
        setForceOpenAsBinary() { }
        setFailToOpen() {
            this.fails = true;
        }
        dispose() {
            super.dispose();
            this.gotDisposed = true;
        }
    }
    exports.TestEditorInput = TestEditorInput;
    let FileServiceProvider = class FileServiceProvider extends lifecycle_1.Disposable {
        constructor(scheme, fileService) {
            super();
            this._register(fileService.registerProvider(scheme, new nullFileSystemProvider_1.NullFileSystemProvider()));
        }
    };
    FileServiceProvider = __decorate([
        __param(1, files_1.IFileService)
    ], FileServiceProvider);
    suite('EditorService', () => {
        function registerTestEditorInput() {
            platform_1.Registry.as(editor_3.Extensions.Editors).registerEditor(new editor_3.EditorDescriptor(TestEditorControl, 'MyTestEditorForEditorService', 'My Test Editor For Next Editor Service'), [new descriptors_1.SyncDescriptor(TestEditorInput)]);
        }
        registerTestEditorInput();
        test('basics', async () => {
            const partInstantiator = workbenchTestServices_1.workbenchInstantiationService();
            const part = partInstantiator.createInstance(editorPart_1.EditorPart);
            part.create(document.createElement('div'));
            part.layout(400, 300);
            const testInstantiationService = partInstantiator.createChild(new serviceCollection_1.ServiceCollection([editorGroupsService_1.IEditorGroupsService, part]));
            const service = testInstantiationService.createInstance(editorService_1.EditorService);
            const input = testInstantiationService.createInstance(TestEditorInput, uri_1.URI.parse('my://resource-basics'));
            const otherInput = testInstantiationService.createInstance(TestEditorInput, uri_1.URI.parse('my://resource2-basics'));
            let activeEditorChangeEventCounter = 0;
            const activeEditorChangeListener = service.onDidActiveEditorChange(() => {
                activeEditorChangeEventCounter++;
            });
            let visibleEditorChangeEventCounter = 0;
            const visibleEditorChangeListener = service.onDidVisibleEditorsChange(() => {
                visibleEditorChangeEventCounter++;
            });
            let didCloseEditorListenerCounter = 0;
            const didCloseEditorListener = service.onDidCloseEditor(editor => {
                didCloseEditorListenerCounter++;
            });
            await part.whenRestored;
            // Open input
            let editor = await service.openEditor(input, { pinned: true });
            assert.ok(editor instanceof TestEditorControl);
            assert.equal(editor, service.activeControl);
            assert.equal(input, service.activeEditor);
            assert.equal(service.visibleControls.length, 1);
            assert.equal(service.visibleControls[0], editor);
            assert.ok(!service.activeTextEditorWidget);
            assert.equal(service.visibleTextEditorWidgets.length, 0);
            assert.equal(service.isOpen(input), true);
            assert.equal(service.getOpened({ resource: input.getResource() }), input);
            assert.equal(service.isOpen(input, part.activeGroup), true);
            assert.equal(activeEditorChangeEventCounter, 1);
            assert.equal(visibleEditorChangeEventCounter, 1);
            // Close input
            await editor.group.closeEditor(input);
            assert.equal(didCloseEditorListenerCounter, 1);
            assert.equal(activeEditorChangeEventCounter, 2);
            assert.equal(visibleEditorChangeEventCounter, 2);
            assert.ok(input.gotDisposed);
            // Open again 2 inputs
            await service.openEditor(input, { pinned: true });
            editor = await service.openEditor(otherInput, { pinned: true });
            assert.equal(service.visibleControls.length, 1);
            assert.equal(service.isOpen(input), true);
            assert.equal(service.isOpen(otherInput), true);
            assert.equal(activeEditorChangeEventCounter, 4);
            assert.equal(visibleEditorChangeEventCounter, 4);
            activeEditorChangeListener.dispose();
            visibleEditorChangeListener.dispose();
            didCloseEditorListener.dispose();
        });
        test('openEditors() / replaceEditors()', async () => {
            const partInstantiator = workbenchTestServices_1.workbenchInstantiationService();
            const part = partInstantiator.createInstance(editorPart_1.EditorPart);
            part.create(document.createElement('div'));
            part.layout(400, 300);
            const testInstantiationService = partInstantiator.createChild(new serviceCollection_1.ServiceCollection([editorGroupsService_1.IEditorGroupsService, part]));
            const service = testInstantiationService.createInstance(editorService_1.EditorService);
            const input = testInstantiationService.createInstance(TestEditorInput, uri_1.URI.parse('my://resource-openEditors'));
            const otherInput = testInstantiationService.createInstance(TestEditorInput, uri_1.URI.parse('my://resource2-openEditors'));
            const replaceInput = testInstantiationService.createInstance(TestEditorInput, uri_1.URI.parse('my://resource3-openEditors'));
            await part.whenRestored;
            // Open editors
            await service.openEditors([{ editor: input }, { editor: otherInput }]);
            assert.equal(part.activeGroup.count, 2);
            // Replace editors
            await service.replaceEditors([{ editor: input, replacement: replaceInput }], part.activeGroup);
            assert.equal(part.activeGroup.count, 2);
            assert.equal(part.activeGroup.getIndexOfEditor(replaceInput), 0);
        });
        test('caching', function () {
            const instantiationService = workbenchTestServices_1.workbenchInstantiationService();
            const service = instantiationService.createInstance(editorService_1.EditorService);
            // Cached Input (Files)
            const fileResource1 = utils_1.toResource.call(this, '/foo/bar/cache1.js');
            const fileInput1 = service.createInput({ resource: fileResource1 });
            assert.ok(fileInput1);
            const fileResource2 = utils_1.toResource.call(this, '/foo/bar/cache2.js');
            const fileInput2 = service.createInput({ resource: fileResource2 });
            assert.ok(fileInput2);
            assert.notEqual(fileInput1, fileInput2);
            const fileInput1Again = service.createInput({ resource: fileResource1 });
            assert.equal(fileInput1Again, fileInput1);
            fileInput1Again.dispose();
            assert.ok(fileInput1.isDisposed());
            const fileInput1AgainAndAgain = service.createInput({ resource: fileResource1 });
            assert.notEqual(fileInput1AgainAndAgain, fileInput1);
            assert.ok(!fileInput1AgainAndAgain.isDisposed());
            // Cached Input (Resource)
            const resource1 = uri_1.URI.from({ scheme: 'custom', path: '/foo/bar/cache1.js' });
            const input1 = service.createInput({ resource: resource1 });
            assert.ok(input1);
            const resource2 = uri_1.URI.from({ scheme: 'custom', path: '/foo/bar/cache2.js' });
            const input2 = service.createInput({ resource: resource2 });
            assert.ok(input2);
            assert.notEqual(input1, input2);
            const input1Again = service.createInput({ resource: resource1 });
            assert.equal(input1Again, input1);
            input1Again.dispose();
            assert.ok(input1.isDisposed());
            const input1AgainAndAgain = service.createInput({ resource: resource1 });
            assert.notEqual(input1AgainAndAgain, input1);
            assert.ok(!input1AgainAndAgain.isDisposed());
        });
        test('createInput', async function () {
            const instantiationService = workbenchTestServices_1.workbenchInstantiationService();
            const service = instantiationService.createInstance(editorService_1.EditorService);
            const mode = 'create-input-test';
            modesRegistry_1.ModesRegistry.registerLanguage({
                id: mode,
            });
            // Untyped Input (file)
            let input = service.createInput({ resource: utils_1.toResource.call(this, '/index.html'), options: { selection: { startLineNumber: 1, startColumn: 1 } } });
            assert(input instanceof fileEditorInput_1.FileEditorInput);
            let contentInput = input;
            assert.strictEqual(contentInput.getResource().fsPath, utils_1.toResource.call(this, '/index.html').fsPath);
            // Untyped Input (file, encoding)
            input = service.createInput({ resource: utils_1.toResource.call(this, '/index.html'), encoding: 'utf16le', options: { selection: { startLineNumber: 1, startColumn: 1 } } });
            assert(input instanceof fileEditorInput_1.FileEditorInput);
            contentInput = input;
            assert.equal(contentInput.getPreferredEncoding(), 'utf16le');
            // Untyped Input (file, mode)
            input = service.createInput({ resource: utils_1.toResource.call(this, '/index.html'), mode });
            assert(input instanceof fileEditorInput_1.FileEditorInput);
            contentInput = input;
            assert.equal(contentInput.getPreferredMode(), mode);
            // Untyped Input (file, different mode)
            input = service.createInput({ resource: utils_1.toResource.call(this, '/index.html'), mode: 'text' });
            assert(input instanceof fileEditorInput_1.FileEditorInput);
            contentInput = input;
            assert.equal(contentInput.getPreferredMode(), 'text');
            // Untyped Input (untitled)
            input = service.createInput({ options: { selection: { startLineNumber: 1, startColumn: 1 } } });
            assert(input instanceof untitledEditorInput_1.UntitledEditorInput);
            // Untyped Input (untitled with contents)
            input = service.createInput({ contents: 'Hello Untitled', options: { selection: { startLineNumber: 1, startColumn: 1 } } });
            assert(input instanceof untitledEditorInput_1.UntitledEditorInput);
            let model = await input.resolve();
            assert.equal(model.textEditorModel.getValue(), 'Hello Untitled');
            // Untyped Input (untitled with mode)
            input = service.createInput({ mode, options: { selection: { startLineNumber: 1, startColumn: 1 } } });
            assert(input instanceof untitledEditorInput_1.UntitledEditorInput);
            model = await input.resolve();
            assert.equal(model.getMode(), mode);
            // Untyped Input (untitled with file path)
            input = service.createInput({ resource: uri_1.URI.file('/some/path.txt'), forceUntitled: true, options: { selection: { startLineNumber: 1, startColumn: 1 } } });
            assert(input instanceof untitledEditorInput_1.UntitledEditorInput);
            assert.ok(input.hasAssociatedFilePath);
            // Untyped Input (untitled with untitled resource)
            input = service.createInput({ resource: uri_1.URI.parse('untitled://Untitled-1'), forceUntitled: true, options: { selection: { startLineNumber: 1, startColumn: 1 } } });
            assert(input instanceof untitledEditorInput_1.UntitledEditorInput);
            assert.ok(!input.hasAssociatedFilePath);
            // Untyped Input (untitled with custom resource)
            const provider = instantiationService.createInstance(FileServiceProvider, 'untitled-custom');
            input = service.createInput({ resource: uri_1.URI.parse('untitled-custom://some/path'), forceUntitled: true, options: { selection: { startLineNumber: 1, startColumn: 1 } } });
            assert(input instanceof untitledEditorInput_1.UntitledEditorInput);
            assert.ok(input.hasAssociatedFilePath);
            provider.dispose();
            // Untyped Input (resource)
            input = service.createInput({ resource: uri_1.URI.parse('custom:resource') });
            assert(input instanceof resourceEditorInput_1.ResourceEditorInput);
        });
        test('delegate', function (done) {
            const instantiationService = workbenchTestServices_1.workbenchInstantiationService();
            class MyEditor extends baseEditor_1.BaseEditor {
                constructor(id) {
                    super(id, undefined, new testThemeService_1.TestThemeService(), new workbenchTestServices_1.TestStorageService());
                }
                getId() {
                    return 'myEditor';
                }
                layout() { }
                createEditor() { }
            }
            const ed = instantiationService.createInstance(MyEditor, 'my.editor');
            const inp = instantiationService.createInstance(resourceEditorInput_1.ResourceEditorInput, 'name', 'description', uri_1.URI.parse('my://resource-delegate'), undefined);
            const delegate = instantiationService.createInstance(editorService_1.DelegatingEditorService);
            delegate.setEditorOpenHandler((delegate, group, input, options) => {
                assert.strictEqual(input, inp);
                done();
                return Promise.resolve(ed);
            });
            delegate.openEditor(inp);
        });
        test('close editor does not dispose when editor opened in other group', async () => {
            const partInstantiator = workbenchTestServices_1.workbenchInstantiationService();
            const part = partInstantiator.createInstance(editorPart_1.EditorPart);
            part.create(document.createElement('div'));
            part.layout(400, 300);
            const testInstantiationService = partInstantiator.createChild(new serviceCollection_1.ServiceCollection([editorGroupsService_1.IEditorGroupsService, part]));
            const service = testInstantiationService.createInstance(editorService_1.EditorService);
            const input = testInstantiationService.createInstance(TestEditorInput, uri_1.URI.parse('my://resource-close1'));
            const rootGroup = part.activeGroup;
            const rightGroup = part.addGroup(rootGroup, 3 /* RIGHT */);
            await part.whenRestored;
            // Open input
            await service.openEditor(input, { pinned: true });
            await service.openEditor(input, { pinned: true }, rightGroup);
            const editors = service.editors;
            assert.equal(editors.length, 2);
            assert.equal(editors[0], input);
            assert.equal(editors[1], input);
            // Close input
            await rootGroup.closeEditor(input);
            assert.equal(input.isDisposed(), false);
            await rightGroup.closeEditor(input);
            assert.equal(input.isDisposed(), true);
        });
        test('open to the side', async () => {
            const partInstantiator = workbenchTestServices_1.workbenchInstantiationService();
            const part = partInstantiator.createInstance(editorPart_1.EditorPart);
            part.create(document.createElement('div'));
            part.layout(400, 300);
            const testInstantiationService = partInstantiator.createChild(new serviceCollection_1.ServiceCollection([editorGroupsService_1.IEditorGroupsService, part]));
            const service = testInstantiationService.createInstance(editorService_1.EditorService);
            const input1 = testInstantiationService.createInstance(TestEditorInput, uri_1.URI.parse('my://resource1-openside'));
            const input2 = testInstantiationService.createInstance(TestEditorInput, uri_1.URI.parse('my://resource2-openside'));
            const rootGroup = part.activeGroup;
            await part.whenRestored;
            await service.openEditor(input1, { pinned: true }, rootGroup);
            let editor = await service.openEditor(input1, { pinned: true, preserveFocus: true }, editorService_2.SIDE_GROUP);
            assert.equal(part.activeGroup, rootGroup);
            assert.equal(part.count, 2);
            assert.equal(editor.group, part.groups[1]);
            // Open to the side uses existing neighbour group if any
            editor = await service.openEditor(input2, { pinned: true, preserveFocus: true }, editorService_2.SIDE_GROUP);
            assert.equal(part.activeGroup, rootGroup);
            assert.equal(part.count, 2);
            assert.equal(editor.group, part.groups[1]);
        });
        test('editor group activation', async () => {
            const partInstantiator = workbenchTestServices_1.workbenchInstantiationService();
            const part = partInstantiator.createInstance(editorPart_1.EditorPart);
            part.create(document.createElement('div'));
            part.layout(400, 300);
            const testInstantiationService = partInstantiator.createChild(new serviceCollection_1.ServiceCollection([editorGroupsService_1.IEditorGroupsService, part]));
            const service = testInstantiationService.createInstance(editorService_1.EditorService);
            const input1 = testInstantiationService.createInstance(TestEditorInput, uri_1.URI.parse('my://resource1-openside'));
            const input2 = testInstantiationService.createInstance(TestEditorInput, uri_1.URI.parse('my://resource2-openside'));
            const rootGroup = part.activeGroup;
            await part.whenRestored;
            await service.openEditor(input1, { pinned: true }, rootGroup);
            let editor = await service.openEditor(input2, { pinned: true, preserveFocus: true, activation: editor_1.EditorActivation.ACTIVATE }, editorService_2.SIDE_GROUP);
            const sideGroup = editor.group;
            assert.equal(part.activeGroup, sideGroup);
            editor = await service.openEditor(input1, { pinned: true, preserveFocus: true, activation: editor_1.EditorActivation.PRESERVE }, rootGroup);
            assert.equal(part.activeGroup, sideGroup);
            editor = await service.openEditor(input1, { pinned: true, preserveFocus: true, activation: editor_1.EditorActivation.ACTIVATE }, rootGroup);
            assert.equal(part.activeGroup, rootGroup);
            editor = await service.openEditor(input2, { pinned: true, activation: editor_1.EditorActivation.PRESERVE }, sideGroup);
            assert.equal(part.activeGroup, rootGroup);
            editor = await service.openEditor(input2, { pinned: true, activation: editor_1.EditorActivation.ACTIVATE }, sideGroup);
            assert.equal(part.activeGroup, sideGroup);
            part.arrangeGroups(0 /* MINIMIZE_OTHERS */);
            editor = await service.openEditor(input1, { pinned: true, preserveFocus: true, activation: editor_1.EditorActivation.RESTORE }, rootGroup);
            assert.equal(part.activeGroup, sideGroup);
        });
        test('active editor change / visible editor change events', async function () {
            const partInstantiator = workbenchTestServices_1.workbenchInstantiationService();
            const part = partInstantiator.createInstance(editorPart_1.EditorPart);
            part.create(document.createElement('div'));
            part.layout(400, 300);
            const testInstantiationService = partInstantiator.createChild(new serviceCollection_1.ServiceCollection([editorGroupsService_1.IEditorGroupsService, part]));
            const service = testInstantiationService.createInstance(editorService_1.EditorService);
            const input = testInstantiationService.createInstance(TestEditorInput, uri_1.URI.parse('my://resource-active'));
            const otherInput = testInstantiationService.createInstance(TestEditorInput, uri_1.URI.parse('my://resource2-active'));
            let activeEditorChangeEventFired = false;
            const activeEditorChangeListener = service.onDidActiveEditorChange(() => {
                activeEditorChangeEventFired = true;
            });
            let visibleEditorChangeEventFired = false;
            const visibleEditorChangeListener = service.onDidVisibleEditorsChange(() => {
                visibleEditorChangeEventFired = true;
            });
            function assertActiveEditorChangedEvent(expected) {
                assert.equal(activeEditorChangeEventFired, expected, `Unexpected active editor change state (got ${activeEditorChangeEventFired}, expected ${expected})`);
                activeEditorChangeEventFired = false;
            }
            function assertVisibleEditorsChangedEvent(expected) {
                assert.equal(visibleEditorChangeEventFired, expected, `Unexpected visible editors change state (got ${visibleEditorChangeEventFired}, expected ${expected})`);
                visibleEditorChangeEventFired = false;
            }
            async function closeEditorAndWaitForNextToOpen(group, input) {
                await group.closeEditor(input);
                await async_1.timeout(0); // closing an editor will not immediately open the next one, so we need to wait
            }
            await part.whenRestored;
            // 1.) open, open same, open other, close
            let editor = await service.openEditor(input, { pinned: true });
            const group = editor.group;
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            editor = await service.openEditor(input);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            editor = await service.openEditor(otherInput);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            await closeEditorAndWaitForNextToOpen(group, otherInput);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            await closeEditorAndWaitForNextToOpen(group, input);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 2.) open, open same (forced open)
            editor = await service.openEditor(input);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            editor = await service.openEditor(input, { forceReload: true });
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await closeEditorAndWaitForNextToOpen(group, input);
            // 3.) open, open inactive, close
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            editor = await service.openEditor(otherInput, { inactive: true });
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await group.closeAllEditors();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 4.) open, open inactive, close inactive
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            editor = await service.openEditor(otherInput, { inactive: true });
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await closeEditorAndWaitForNextToOpen(group, otherInput);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await group.closeAllEditors();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 5.) add group, remove group
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            let rightGroup = part.addGroup(part.activeGroup, 3 /* RIGHT */);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            rightGroup.focus();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(false);
            part.removeGroup(rightGroup);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(false);
            await group.closeAllEditors();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 6.) open editor in inactive group
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            rightGroup = part.addGroup(part.activeGroup, 3 /* RIGHT */);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await rightGroup.openEditor(otherInput);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            await closeEditorAndWaitForNextToOpen(rightGroup, otherInput);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            await group.closeAllEditors();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 7.) activate group
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            rightGroup = part.addGroup(part.activeGroup, 3 /* RIGHT */);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await rightGroup.openEditor(otherInput);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            group.focus();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(false);
            await closeEditorAndWaitForNextToOpen(rightGroup, otherInput);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(true);
            await group.closeAllEditors();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 8.) move editor
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            editor = await service.openEditor(otherInput, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            group.moveEditor(otherInput, group, { index: 0 });
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await group.closeAllEditors();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 9.) close editor in inactive group
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            rightGroup = part.addGroup(part.activeGroup, 3 /* RIGHT */);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await rightGroup.openEditor(otherInput);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            await closeEditorAndWaitForNextToOpen(group, input);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(true);
            // cleanup
            activeEditorChangeListener.dispose();
            visibleEditorChangeListener.dispose();
        });
        test('openEditor returns NULL when opening fails or is inactive', async function () {
            const partInstantiator = workbenchTestServices_1.workbenchInstantiationService();
            const part = partInstantiator.createInstance(editorPart_1.EditorPart);
            part.create(document.createElement('div'));
            part.layout(400, 300);
            const testInstantiationService = partInstantiator.createChild(new serviceCollection_1.ServiceCollection([editorGroupsService_1.IEditorGroupsService, part]));
            const service = testInstantiationService.createInstance(editorService_1.EditorService);
            const input = testInstantiationService.createInstance(TestEditorInput, uri_1.URI.parse('my://resource-active'));
            const otherInput = testInstantiationService.createInstance(TestEditorInput, uri_1.URI.parse('my://resource2-inactive'));
            const failingInput = testInstantiationService.createInstance(TestEditorInput, uri_1.URI.parse('my://resource3-failing'));
            failingInput.setFailToOpen();
            await part.whenRestored;
            let editor = await service.openEditor(input, { pinned: true });
            assert.ok(editor);
            let otherEditor = await service.openEditor(otherInput, { inactive: true });
            assert.ok(!otherEditor);
            let failingEditor = await service.openEditor(failingInput);
            assert.ok(!failingEditor);
        });
    });
});
//# sourceMappingURL=editorService.test.js.map