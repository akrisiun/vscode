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
define(["require", "exports", "assert", "vs/workbench/browser/parts/editor/baseEditor", "vs/workbench/common/editor", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/descriptors", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/test/workbenchTestServices", "vs/workbench/common/editor/resourceEditorInput", "vs/platform/theme/test/common/testThemeService", "vs/base/common/uri", "vs/workbench/browser/editor", "vs/base/common/cancellation"], function (require, exports, assert, baseEditor_1, editor_1, instantiationServiceMock_1, Platform, descriptors_1, telemetry_1, telemetryUtils_1, workbenchTestServices_1, resourceEditorInput_1, testThemeService_1, uri_1, editor_2, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const NullThemeService = new testThemeService_1.TestThemeService();
    let EditorRegistry = Platform.Registry.as(editor_2.Extensions.Editors);
    let EditorInputRegistry = Platform.Registry.as(editor_1.Extensions.EditorInputFactories);
    let MyEditor = class MyEditor extends baseEditor_1.BaseEditor {
        constructor(telemetryService) {
            super('MyEditor', telemetryUtils_1.NullTelemetryService, NullThemeService, new workbenchTestServices_1.TestStorageService());
        }
        getId() { return 'myEditor'; }
        layout() { }
        createEditor() { }
    };
    MyEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService)
    ], MyEditor);
    exports.MyEditor = MyEditor;
    let MyOtherEditor = class MyOtherEditor extends baseEditor_1.BaseEditor {
        constructor(telemetryService) {
            super('myOtherEditor', telemetryUtils_1.NullTelemetryService, NullThemeService, new workbenchTestServices_1.TestStorageService());
        }
        getId() { return 'myOtherEditor'; }
        layout() { }
        createEditor() { }
    };
    MyOtherEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService)
    ], MyOtherEditor);
    exports.MyOtherEditor = MyOtherEditor;
    class MyInputFactory {
        serialize(input) {
            return input.toString();
        }
        deserialize(instantiationService, raw) {
            return {};
        }
    }
    class MyInput extends editor_1.EditorInput {
        getPreferredEditorId(ids) {
            return ids[1];
        }
        getTypeId() {
            return '';
        }
        resolve() {
            return null;
        }
    }
    class MyOtherInput extends editor_1.EditorInput {
        getTypeId() {
            return '';
        }
        resolve() {
            return null;
        }
    }
    class MyResourceInput extends resourceEditorInput_1.ResourceEditorInput {
    }
    suite('Workbench base editor', () => {
        test('BaseEditor API', async () => {
            let e = new MyEditor(telemetryUtils_1.NullTelemetryService);
            let input = new MyOtherInput();
            let options = new editor_1.EditorOptions();
            assert(!e.isVisible());
            assert(!e.input);
            assert(!e.options);
            await e.setInput(input, options, cancellation_1.CancellationToken.None);
            assert.strictEqual(input, e.input);
            assert.strictEqual(options, e.options);
            const group = new workbenchTestServices_1.TestEditorGroup(1);
            e.setVisible(true, group);
            assert(e.isVisible());
            assert.equal(e.group, group);
            input.onDispose(() => {
                assert(false);
            });
            e.dispose();
            e.clearInput();
            e.setVisible(false, group);
            assert(!e.isVisible());
            assert(!e.input);
            assert(!e.options);
            assert(!e.getControl());
        });
        test('EditorDescriptor', () => {
            let d = new editor_2.EditorDescriptor(MyEditor, 'id', 'name');
            assert.strictEqual(d.getId(), 'id');
            assert.strictEqual(d.getName(), 'name');
        });
        test('Editor Registration', function () {
            let d1 = new editor_2.EditorDescriptor(MyEditor, 'id1', 'name');
            let d2 = new editor_2.EditorDescriptor(MyOtherEditor, 'id2', 'name');
            let oldEditorsCnt = EditorRegistry.getEditors().length;
            let oldInputCnt = EditorRegistry.getEditorInputs().length;
            EditorRegistry.registerEditor(d1, [new descriptors_1.SyncDescriptor(MyInput)]);
            EditorRegistry.registerEditor(d2, [new descriptors_1.SyncDescriptor(MyInput), new descriptors_1.SyncDescriptor(MyOtherInput)]);
            assert.equal(EditorRegistry.getEditors().length, oldEditorsCnt + 2);
            assert.equal(EditorRegistry.getEditorInputs().length, oldInputCnt + 3);
            assert.strictEqual(EditorRegistry.getEditor(new MyInput()), d2);
            assert.strictEqual(EditorRegistry.getEditor(new MyOtherInput()), d2);
            assert.strictEqual(EditorRegistry.getEditorById('id1'), d1);
            assert.strictEqual(EditorRegistry.getEditorById('id2'), d2);
            assert(!EditorRegistry.getEditorById('id3'));
        });
        test('Editor Lookup favors specific class over superclass (match on specific class)', function () {
            let d1 = new editor_2.EditorDescriptor(MyEditor, 'id1', 'name');
            let d2 = new editor_2.EditorDescriptor(MyOtherEditor, 'id2', 'name');
            let oldEditors = EditorRegistry.getEditors();
            EditorRegistry.setEditors([]);
            EditorRegistry.registerEditor(d2, [new descriptors_1.SyncDescriptor(resourceEditorInput_1.ResourceEditorInput)]);
            EditorRegistry.registerEditor(d1, [new descriptors_1.SyncDescriptor(MyResourceInput)]);
            let inst = new instantiationServiceMock_1.TestInstantiationService();
            const editor = EditorRegistry.getEditor(inst.createInstance(MyResourceInput, 'fake', '', uri_1.URI.file('/fake'), undefined)).instantiate(inst);
            assert.strictEqual(editor.getId(), 'myEditor');
            const otherEditor = EditorRegistry.getEditor(inst.createInstance(resourceEditorInput_1.ResourceEditorInput, 'fake', '', uri_1.URI.file('/fake'), undefined)).instantiate(inst);
            assert.strictEqual(otherEditor.getId(), 'myOtherEditor');
            EditorRegistry.setEditors(oldEditors);
        });
        test('Editor Lookup favors specific class over superclass (match on super class)', function () {
            let d1 = new editor_2.EditorDescriptor(MyOtherEditor, 'id1', 'name');
            let oldEditors = EditorRegistry.getEditors();
            EditorRegistry.setEditors([]);
            EditorRegistry.registerEditor(d1, [new descriptors_1.SyncDescriptor(resourceEditorInput_1.ResourceEditorInput)]);
            let inst = new instantiationServiceMock_1.TestInstantiationService();
            const editor = EditorRegistry.getEditor(inst.createInstance(MyResourceInput, 'fake', '', uri_1.URI.file('/fake'), undefined)).instantiate(inst);
            assert.strictEqual('myOtherEditor', editor.getId());
            EditorRegistry.setEditors(oldEditors);
        });
        test('Editor Input Factory', function () {
            workbenchTestServices_1.workbenchInstantiationService().invokeFunction(accessor => EditorInputRegistry.start(accessor));
            EditorInputRegistry.registerEditorInputFactory('myInputId', MyInputFactory);
            let factory = EditorInputRegistry.getEditorInputFactory('myInputId');
            assert(factory);
        });
        test('EditorMemento - basics', function () {
            const testGroup0 = new workbenchTestServices_1.TestEditorGroup(0);
            const testGroup1 = new workbenchTestServices_1.TestEditorGroup(1);
            const testGroup4 = new workbenchTestServices_1.TestEditorGroup(4);
            const editorGroupService = new workbenchTestServices_1.TestEditorGroupsService([
                testGroup0,
                testGroup1,
                new workbenchTestServices_1.TestEditorGroup(2)
            ]);
            const rawMemento = Object.create(null);
            let memento = new baseEditor_1.EditorMemento('id', 'key', rawMemento, 3, editorGroupService);
            let res = memento.loadEditorState(testGroup0, uri_1.URI.file('/A'));
            assert.ok(!res);
            memento.saveEditorState(testGroup0, uri_1.URI.file('/A'), { line: 3 });
            res = memento.loadEditorState(testGroup0, uri_1.URI.file('/A'));
            assert.ok(res);
            assert.equal(res.line, 3);
            memento.saveEditorState(testGroup1, uri_1.URI.file('/A'), { line: 5 });
            res = memento.loadEditorState(testGroup1, uri_1.URI.file('/A'));
            assert.ok(res);
            assert.equal(res.line, 5);
            // Ensure capped at 3 elements
            memento.saveEditorState(testGroup0, uri_1.URI.file('/B'), { line: 1 });
            memento.saveEditorState(testGroup0, uri_1.URI.file('/C'), { line: 1 });
            memento.saveEditorState(testGroup0, uri_1.URI.file('/D'), { line: 1 });
            memento.saveEditorState(testGroup0, uri_1.URI.file('/E'), { line: 1 });
            assert.ok(!memento.loadEditorState(testGroup0, uri_1.URI.file('/A')));
            assert.ok(!memento.loadEditorState(testGroup0, uri_1.URI.file('/B')));
            assert.ok(memento.loadEditorState(testGroup0, uri_1.URI.file('/C')));
            assert.ok(memento.loadEditorState(testGroup0, uri_1.URI.file('/D')));
            assert.ok(memento.loadEditorState(testGroup0, uri_1.URI.file('/E')));
            // Save at an unknown group
            memento.saveEditorState(testGroup4, uri_1.URI.file('/E'), { line: 1 });
            assert.ok(memento.loadEditorState(testGroup4, uri_1.URI.file('/E'))); // only gets removed when memento is saved
            memento.saveEditorState(testGroup4, uri_1.URI.file('/C'), { line: 1 });
            assert.ok(memento.loadEditorState(testGroup4, uri_1.URI.file('/C'))); // only gets removed when memento is saved
            memento.saveState();
            memento = new baseEditor_1.EditorMemento('id', 'key', rawMemento, 3, editorGroupService);
            assert.ok(memento.loadEditorState(testGroup0, uri_1.URI.file('/C')));
            assert.ok(memento.loadEditorState(testGroup0, uri_1.URI.file('/D')));
            assert.ok(memento.loadEditorState(testGroup0, uri_1.URI.file('/E')));
            // Check on entries no longer there from invalid groups
            assert.ok(!memento.loadEditorState(testGroup4, uri_1.URI.file('/E')));
            assert.ok(!memento.loadEditorState(testGroup4, uri_1.URI.file('/C')));
            memento.clearEditorState(uri_1.URI.file('/C'), testGroup4);
            memento.clearEditorState(uri_1.URI.file('/E'));
            assert.ok(!memento.loadEditorState(testGroup4, uri_1.URI.file('/C')));
            assert.ok(memento.loadEditorState(testGroup0, uri_1.URI.file('/D')));
            assert.ok(!memento.loadEditorState(testGroup0, uri_1.URI.file('/E')));
        });
        test('EditoMemento - use with editor input', function () {
            const testGroup0 = new workbenchTestServices_1.TestEditorGroup(0);
            class TestEditorInput extends editor_1.EditorInput {
                constructor(resource, id = 'testEditorInput') {
                    super();
                    this.resource = resource;
                    this.id = id;
                }
                getTypeId() { return 'testEditorInput'; }
                resolve() { return Promise.resolve(null); }
                matches(other) {
                    return other && this.id === other.id && other instanceof TestEditorInput;
                }
                getResource() {
                    return this.resource;
                }
            }
            const rawMemento = Object.create(null);
            let memento = new baseEditor_1.EditorMemento('id', 'key', rawMemento, 3, new workbenchTestServices_1.TestEditorGroupsService());
            const testInputA = new TestEditorInput(uri_1.URI.file('/A'));
            let res = memento.loadEditorState(testGroup0, testInputA);
            assert.ok(!res);
            memento.saveEditorState(testGroup0, testInputA, { line: 3 });
            res = memento.loadEditorState(testGroup0, testInputA);
            assert.ok(res);
            assert.equal(res.line, 3);
            // State removed when input gets disposed
            testInputA.dispose();
            res = memento.loadEditorState(testGroup0, testInputA);
            assert.ok(!res);
        });
        return {
            MyEditor: MyEditor,
            MyOtherEditor: MyOtherEditor
        };
    });
});
//# sourceMappingURL=baseEditor.test.js.map