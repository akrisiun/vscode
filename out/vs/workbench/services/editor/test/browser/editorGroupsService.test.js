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
define(["require", "exports", "assert", "vs/workbench/browser/parts/editor/editorPart", "vs/workbench/test/workbenchTestServices", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor", "vs/base/common/uri", "vs/platform/registry/common/platform", "vs/workbench/browser/editor", "vs/workbench/browser/parts/editor/baseEditor", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/theme/test/common/testThemeService", "vs/platform/instantiation/common/descriptors"], function (require, exports, assert, editorPart_1, workbenchTestServices_1, instantiation_1, editor_1, uri_1, platform_1, editor_2, baseEditor_1, telemetry_1, telemetryUtils_1, testThemeService_1, descriptors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TestEditorControl = class TestEditorControl extends baseEditor_1.BaseEditor {
        constructor(telemetryService) { super('MyFileEditorForEditorGroupService', telemetryUtils_1.NullTelemetryService, new testThemeService_1.TestThemeService(), new workbenchTestServices_1.TestStorageService()); }
        async setInput(input, options, token) {
            super.setInput(input, options, token);
            await input.resolve();
        }
        getId() { return 'MyFileEditorForEditorGroupService'; }
        layout() { }
        createEditor() { }
    };
    TestEditorControl = __decorate([
        __param(0, telemetry_1.ITelemetryService)
    ], TestEditorControl);
    exports.TestEditorControl = TestEditorControl;
    class TestEditorInput extends editor_1.EditorInput {
        constructor(resource) {
            super();
            this.resource = resource;
        }
        getTypeId() { return 'testEditorInputForEditorGroupService'; }
        resolve() { return Promise.resolve(null); }
        matches(other) { return other && this.resource.toString() === other.resource.toString() && other instanceof TestEditorInput; }
        setEncoding(encoding) { }
        getEncoding() { return null; }
        setPreferredEncoding(encoding) { }
        setMode(mode) { }
        setPreferredMode(mode) { }
        getResource() { return this.resource; }
        setForceOpenAsBinary() { }
    }
    exports.TestEditorInput = TestEditorInput;
    suite('EditorGroupsService', () => {
        function registerTestEditorInput() {
            class TestEditorInputFactory {
                serialize(editorInput) {
                    const testEditorInput = editorInput;
                    const testInput = {
                        resource: testEditorInput.getResource().toString()
                    };
                    return JSON.stringify(testInput);
                }
                deserialize(instantiationService, serializedEditorInput) {
                    const testInput = JSON.parse(serializedEditorInput);
                    return new TestEditorInput(uri_1.URI.parse(testInput.resource));
                }
            }
            (platform_1.Registry.as(editor_1.Extensions.EditorInputFactories)).registerEditorInputFactory('testEditorInputForGroupsService', TestEditorInputFactory);
            (platform_1.Registry.as(editor_2.Extensions.Editors)).registerEditor(new editor_2.EditorDescriptor(TestEditorControl, 'MyTestEditorForGroupsService', 'My Test File Editor'), [new descriptors_1.SyncDescriptor(TestEditorInput)]);
        }
        registerTestEditorInput();
        function createPart() {
            const instantiationService = workbenchTestServices_1.workbenchInstantiationService();
            const part = instantiationService.createInstance(editorPart_1.EditorPart);
            part.create(document.createElement('div'));
            part.layout(400, 300);
            return part;
        }
        test('groups basics', async function () {
            const part = createPart();
            let activeGroupChangeCounter = 0;
            const activeGroupChangeListener = part.onDidActiveGroupChange(() => {
                activeGroupChangeCounter++;
            });
            let groupAddedCounter = 0;
            const groupAddedListener = part.onDidAddGroup(() => {
                groupAddedCounter++;
            });
            let groupRemovedCounter = 0;
            const groupRemovedListener = part.onDidRemoveGroup(() => {
                groupRemovedCounter++;
            });
            let groupMovedCounter = 0;
            const groupMovedListener = part.onDidMoveGroup(() => {
                groupMovedCounter++;
            });
            // always a root group
            const rootGroup = part.groups[0];
            assert.equal(part.groups.length, 1);
            assert.equal(part.count, 1);
            assert.equal(rootGroup, part.getGroup(rootGroup.id));
            assert.ok(part.activeGroup === rootGroup);
            assert.equal(rootGroup.label, 'Group 1');
            let mru = part.getGroups(1 /* MOST_RECENTLY_ACTIVE */);
            assert.equal(mru.length, 1);
            assert.equal(mru[0], rootGroup);
            const rightGroup = part.addGroup(rootGroup, 3 /* RIGHT */);
            assert.equal(rightGroup, part.getGroup(rightGroup.id));
            assert.equal(groupAddedCounter, 1);
            assert.equal(part.groups.length, 2);
            assert.equal(part.count, 2);
            assert.ok(part.activeGroup === rootGroup);
            assert.equal(rootGroup.label, 'Group 1');
            assert.equal(rightGroup.label, 'Group 2');
            mru = part.getGroups(1 /* MOST_RECENTLY_ACTIVE */);
            assert.equal(mru.length, 2);
            assert.equal(mru[0], rootGroup);
            assert.equal(mru[1], rightGroup);
            assert.equal(activeGroupChangeCounter, 0);
            let rootGroupActiveChangeCounter = 0;
            const rootGroupChangeListener = rootGroup.onDidGroupChange(e => {
                if (e.kind === 0 /* GROUP_ACTIVE */) {
                    rootGroupActiveChangeCounter++;
                }
            });
            let rightGroupActiveChangeCounter = 0;
            const rightGroupChangeListener = rightGroup.onDidGroupChange(e => {
                if (e.kind === 0 /* GROUP_ACTIVE */) {
                    rightGroupActiveChangeCounter++;
                }
            });
            part.activateGroup(rightGroup);
            assert.ok(part.activeGroup === rightGroup);
            assert.equal(activeGroupChangeCounter, 1);
            assert.equal(rootGroupActiveChangeCounter, 1);
            assert.equal(rightGroupActiveChangeCounter, 1);
            rootGroupChangeListener.dispose();
            rightGroupChangeListener.dispose();
            mru = part.getGroups(1 /* MOST_RECENTLY_ACTIVE */);
            assert.equal(mru.length, 2);
            assert.equal(mru[0], rightGroup);
            assert.equal(mru[1], rootGroup);
            const downGroup = part.addGroup(rightGroup, 1 /* DOWN */);
            let didDispose = false;
            downGroup.onWillDispose(() => {
                didDispose = true;
            });
            assert.equal(groupAddedCounter, 2);
            assert.equal(part.groups.length, 3);
            assert.ok(part.activeGroup === rightGroup);
            assert.ok(!downGroup.activeControl);
            assert.equal(rootGroup.label, 'Group 1');
            assert.equal(rightGroup.label, 'Group 2');
            assert.equal(downGroup.label, 'Group 3');
            mru = part.getGroups(1 /* MOST_RECENTLY_ACTIVE */);
            assert.equal(mru.length, 3);
            assert.equal(mru[0], rightGroup);
            assert.equal(mru[1], rootGroup);
            assert.equal(mru[2], downGroup);
            const gridOrder = part.getGroups(2 /* GRID_APPEARANCE */);
            assert.equal(gridOrder.length, 3);
            assert.equal(gridOrder[0], rootGroup);
            assert.equal(gridOrder[0].index, 0);
            assert.equal(gridOrder[1], rightGroup);
            assert.equal(gridOrder[1].index, 1);
            assert.equal(gridOrder[2], downGroup);
            assert.equal(gridOrder[2].index, 2);
            part.moveGroup(downGroup, rightGroup, 1 /* DOWN */);
            assert.equal(groupMovedCounter, 1);
            part.removeGroup(downGroup);
            assert.ok(!part.getGroup(downGroup.id));
            assert.equal(didDispose, true);
            assert.equal(groupRemovedCounter, 1);
            assert.equal(part.groups.length, 2);
            assert.ok(part.activeGroup === rightGroup);
            assert.equal(rootGroup.label, 'Group 1');
            assert.equal(rightGroup.label, 'Group 2');
            mru = part.getGroups(1 /* MOST_RECENTLY_ACTIVE */);
            assert.equal(mru.length, 2);
            assert.equal(mru[0], rightGroup);
            assert.equal(mru[1], rootGroup);
            let rightGroupInstantiator;
            part.activeGroup.invokeWithinContext(accessor => {
                rightGroupInstantiator = accessor.get(instantiation_1.IInstantiationService);
            });
            let rootGroupInstantiator;
            rootGroup.invokeWithinContext(accessor => {
                rootGroupInstantiator = accessor.get(instantiation_1.IInstantiationService);
            });
            assert.ok(rightGroupInstantiator);
            assert.ok(rootGroupInstantiator);
            assert.ok(rightGroupInstantiator !== rootGroupInstantiator);
            part.removeGroup(rightGroup);
            assert.equal(groupRemovedCounter, 2);
            assert.equal(part.groups.length, 1);
            assert.ok(part.activeGroup === rootGroup);
            mru = part.getGroups(1 /* MOST_RECENTLY_ACTIVE */);
            assert.equal(mru.length, 1);
            assert.equal(mru[0], rootGroup);
            part.removeGroup(rootGroup); // cannot remove root group
            assert.equal(part.groups.length, 1);
            assert.equal(groupRemovedCounter, 2);
            assert.ok(part.activeGroup === rootGroup);
            part.setGroupOrientation(part.orientation === 0 /* HORIZONTAL */ ? 1 /* VERTICAL */ : 0 /* HORIZONTAL */);
            activeGroupChangeListener.dispose();
            groupAddedListener.dispose();
            groupRemovedListener.dispose();
            groupMovedListener.dispose();
            part.dispose();
        });
        test('groups index / labels', function () {
            const part = createPart();
            const rootGroup = part.groups[0];
            const rightGroup = part.addGroup(rootGroup, 3 /* RIGHT */);
            const downGroup = part.addGroup(rightGroup, 1 /* DOWN */);
            let groupIndexChangedCounter = 0;
            const groupIndexChangedListener = part.onDidGroupIndexChange(() => {
                groupIndexChangedCounter++;
            });
            let indexChangeCounter = 0;
            const labelChangeListener = downGroup.onDidGroupChange(e => {
                if (e.kind === 1 /* GROUP_INDEX */) {
                    indexChangeCounter++;
                }
            });
            assert.equal(rootGroup.index, 0);
            assert.equal(rightGroup.index, 1);
            assert.equal(downGroup.index, 2);
            assert.equal(rootGroup.label, 'Group 1');
            assert.equal(rightGroup.label, 'Group 2');
            assert.equal(downGroup.label, 'Group 3');
            part.removeGroup(rightGroup);
            assert.equal(rootGroup.index, 0);
            assert.equal(downGroup.index, 1);
            assert.equal(rootGroup.label, 'Group 1');
            assert.equal(downGroup.label, 'Group 2');
            assert.equal(indexChangeCounter, 1);
            assert.equal(groupIndexChangedCounter, 1);
            part.moveGroup(downGroup, rootGroup, 0 /* UP */);
            assert.equal(downGroup.index, 0);
            assert.equal(rootGroup.index, 1);
            assert.equal(downGroup.label, 'Group 1');
            assert.equal(rootGroup.label, 'Group 2');
            assert.equal(indexChangeCounter, 2);
            assert.equal(groupIndexChangedCounter, 3);
            const newFirstGroup = part.addGroup(downGroup, 0 /* UP */);
            assert.equal(newFirstGroup.index, 0);
            assert.equal(downGroup.index, 1);
            assert.equal(rootGroup.index, 2);
            assert.equal(newFirstGroup.label, 'Group 1');
            assert.equal(downGroup.label, 'Group 2');
            assert.equal(rootGroup.label, 'Group 3');
            assert.equal(indexChangeCounter, 3);
            assert.equal(groupIndexChangedCounter, 6);
            labelChangeListener.dispose();
            groupIndexChangedListener.dispose();
            part.dispose();
        });
        test('copy/merge groups', async () => {
            const part = createPart();
            let groupAddedCounter = 0;
            const groupAddedListener = part.onDidAddGroup(() => {
                groupAddedCounter++;
            });
            let groupRemovedCounter = 0;
            const groupRemovedListener = part.onDidRemoveGroup(() => {
                groupRemovedCounter++;
            });
            const rootGroup = part.groups[0];
            let rootGroupDisposed = false;
            const disposeListener = rootGroup.onWillDispose(() => {
                rootGroupDisposed = true;
            });
            const input = new TestEditorInput(uri_1.URI.file('foo/bar'));
            await rootGroup.openEditor(input, editor_1.EditorOptions.create({ pinned: true }));
            const rightGroup = part.addGroup(rootGroup, 3 /* RIGHT */, { activate: true });
            const downGroup = part.copyGroup(rootGroup, rightGroup, 1 /* DOWN */);
            assert.equal(groupAddedCounter, 2);
            assert.equal(downGroup.count, 1);
            assert.ok(downGroup.activeEditor instanceof TestEditorInput);
            part.mergeGroup(rootGroup, rightGroup, { mode: 0 /* COPY_EDITORS */ });
            assert.equal(rightGroup.count, 1);
            assert.ok(rightGroup.activeEditor instanceof TestEditorInput);
            part.mergeGroup(rootGroup, rightGroup, { mode: 1 /* MOVE_EDITORS */ });
            assert.equal(rootGroup.count, 0);
            part.mergeGroup(rootGroup, downGroup);
            assert.equal(groupRemovedCounter, 1);
            assert.equal(rootGroupDisposed, true);
            groupAddedListener.dispose();
            groupRemovedListener.dispose();
            disposeListener.dispose();
            part.dispose();
        });
        test('whenRestored', async () => {
            const part = createPart();
            await part.whenRestored;
            assert.ok(true);
            part.dispose();
        });
        test('options', () => {
            const part = createPart();
            let oldOptions;
            let newOptions;
            part.onDidEditorPartOptionsChange(event => {
                oldOptions = event.oldPartOptions;
                newOptions = event.newPartOptions;
            });
            const currentOptions = part.partOptions;
            assert.ok(currentOptions);
            part.enforcePartOptions({ showTabs: false });
            assert.equal(part.partOptions.showTabs, false);
            assert.equal(newOptions.showTabs, false);
            assert.equal(oldOptions, currentOptions);
            part.dispose();
        });
        test('editor basics', async function () {
            const part = createPart();
            const group = part.activeGroup;
            assert.equal(group.isEmpty, true);
            await part.whenRestored;
            let editorWillOpenCounter = 0;
            const editorWillOpenListener = group.onWillOpenEditor(() => {
                editorWillOpenCounter++;
            });
            let activeEditorChangeCounter = 0;
            let editorDidOpenCounter = 0;
            let editorCloseCounter1 = 0;
            let editorPinCounter = 0;
            const editorGroupChangeListener = group.onDidGroupChange(e => {
                if (e.kind === 2 /* EDITOR_OPEN */) {
                    assert.ok(e.editor);
                    editorDidOpenCounter++;
                }
                else if (e.kind === 5 /* EDITOR_ACTIVE */) {
                    assert.ok(e.editor);
                    activeEditorChangeCounter++;
                }
                else if (e.kind === 3 /* EDITOR_CLOSE */) {
                    assert.ok(e.editor);
                    editorCloseCounter1++;
                }
                else if (e.kind === 7 /* EDITOR_PIN */) {
                    assert.ok(e.editor);
                    editorPinCounter++;
                }
            });
            let editorCloseCounter2 = 0;
            const editorCloseListener = group.onDidCloseEditor(() => {
                editorCloseCounter2++;
            });
            let editorWillCloseCounter = 0;
            const editorWillCloseListener = group.onWillCloseEditor(() => {
                editorWillCloseCounter++;
            });
            const input = new TestEditorInput(uri_1.URI.file('foo/bar'));
            const inputInactive = new TestEditorInput(uri_1.URI.file('foo/bar/inactive'));
            await group.openEditor(input, editor_1.EditorOptions.create({ pinned: true }));
            await group.openEditor(inputInactive, editor_1.EditorOptions.create({ inactive: true }));
            assert.equal(group.isActive(input), true);
            assert.equal(group.isActive(inputInactive), false);
            assert.equal(group.isOpened(input), true);
            assert.equal(group.isOpened(inputInactive), true);
            assert.equal(group.isEmpty, false);
            assert.equal(group.count, 2);
            assert.equal(editorWillOpenCounter, 2);
            assert.equal(editorDidOpenCounter, 2);
            assert.equal(activeEditorChangeCounter, 1);
            assert.equal(group.getEditor(0), input);
            assert.equal(group.getEditor(1), inputInactive);
            assert.equal(group.getIndexOfEditor(input), 0);
            assert.equal(group.getIndexOfEditor(inputInactive), 1);
            assert.equal(group.previewEditor, inputInactive);
            assert.equal(group.isPinned(inputInactive), false);
            group.pinEditor(inputInactive);
            assert.equal(editorPinCounter, 1);
            assert.equal(group.isPinned(inputInactive), true);
            assert.ok(!group.previewEditor);
            assert.equal(group.activeEditor, input);
            assert.ok(group.activeControl instanceof TestEditorControl);
            assert.equal(group.editors.length, 2);
            const mru = group.getEditors(0 /* MOST_RECENTLY_ACTIVE */);
            assert.equal(mru[0], input);
            assert.equal(mru[1], inputInactive);
            await group.openEditor(inputInactive);
            assert.equal(activeEditorChangeCounter, 2);
            assert.equal(group.activeEditor, inputInactive);
            await group.openEditor(input);
            await group.closeEditor(inputInactive);
            assert.equal(activeEditorChangeCounter, 3);
            assert.equal(editorCloseCounter1, 1);
            assert.equal(editorCloseCounter2, 1);
            assert.equal(editorWillCloseCounter, 1);
            assert.equal(group.activeEditor, input);
            editorCloseListener.dispose();
            editorWillCloseListener.dispose();
            editorWillOpenListener.dispose();
            editorGroupChangeListener.dispose();
            part.dispose();
        });
        test('openEditors / closeEditors', async () => {
            const part = createPart();
            const group = part.activeGroup;
            assert.equal(group.isEmpty, true);
            const input = new TestEditorInput(uri_1.URI.file('foo/bar'));
            const inputInactive = new TestEditorInput(uri_1.URI.file('foo/bar/inactive'));
            await group.openEditors([{ editor: input, options: { pinned: true } }, { editor: inputInactive }]);
            assert.equal(group.count, 2);
            assert.equal(group.getEditor(0), input);
            assert.equal(group.getEditor(1), inputInactive);
            await group.closeEditors([input, inputInactive]);
            assert.equal(group.isEmpty, true);
            part.dispose();
        });
        test('closeEditors (except one)', async () => {
            const part = createPart();
            const group = part.activeGroup;
            assert.equal(group.isEmpty, true);
            const input1 = new TestEditorInput(uri_1.URI.file('foo/bar1'));
            const input2 = new TestEditorInput(uri_1.URI.file('foo/bar2'));
            const input3 = new TestEditorInput(uri_1.URI.file('foo/bar3'));
            await group.openEditors([{ editor: input1, options: { pinned: true } }, { editor: input2, options: { pinned: true } }, { editor: input3 }]);
            assert.equal(group.count, 3);
            assert.equal(group.getEditor(0), input1);
            assert.equal(group.getEditor(1), input2);
            assert.equal(group.getEditor(2), input3);
            await group.closeEditors({ except: input2 });
            assert.equal(group.count, 1);
            assert.equal(group.getEditor(0), input2);
            part.dispose();
        });
        test('closeEditors (saved only)', async () => {
            const part = createPart();
            const group = part.activeGroup;
            assert.equal(group.isEmpty, true);
            const input1 = new TestEditorInput(uri_1.URI.file('foo/bar1'));
            const input2 = new TestEditorInput(uri_1.URI.file('foo/bar2'));
            const input3 = new TestEditorInput(uri_1.URI.file('foo/bar3'));
            await group.openEditors([{ editor: input1, options: { pinned: true } }, { editor: input2, options: { pinned: true } }, { editor: input3 }]);
            assert.equal(group.count, 3);
            assert.equal(group.getEditor(0), input1);
            assert.equal(group.getEditor(1), input2);
            assert.equal(group.getEditor(2), input3);
            await group.closeEditors({ savedOnly: true });
            assert.equal(group.count, 0);
            part.dispose();
        });
        test('closeEditors (direction: right)', async () => {
            const part = createPart();
            const group = part.activeGroup;
            assert.equal(group.isEmpty, true);
            const input1 = new TestEditorInput(uri_1.URI.file('foo/bar1'));
            const input2 = new TestEditorInput(uri_1.URI.file('foo/bar2'));
            const input3 = new TestEditorInput(uri_1.URI.file('foo/bar3'));
            await group.openEditors([{ editor: input1, options: { pinned: true } }, { editor: input2, options: { pinned: true } }, { editor: input3 }]);
            assert.equal(group.count, 3);
            assert.equal(group.getEditor(0), input1);
            assert.equal(group.getEditor(1), input2);
            assert.equal(group.getEditor(2), input3);
            await group.closeEditors({ direction: 1 /* RIGHT */, except: input2 });
            assert.equal(group.count, 2);
            assert.equal(group.getEditor(0), input1);
            assert.equal(group.getEditor(1), input2);
            part.dispose();
        });
        test('closeEditors (direction: left)', async () => {
            const part = createPart();
            const group = part.activeGroup;
            assert.equal(group.isEmpty, true);
            const input1 = new TestEditorInput(uri_1.URI.file('foo/bar1'));
            const input2 = new TestEditorInput(uri_1.URI.file('foo/bar2'));
            const input3 = new TestEditorInput(uri_1.URI.file('foo/bar3'));
            await group.openEditors([{ editor: input1, options: { pinned: true } }, { editor: input2, options: { pinned: true } }, { editor: input3 }]);
            assert.equal(group.count, 3);
            assert.equal(group.getEditor(0), input1);
            assert.equal(group.getEditor(1), input2);
            assert.equal(group.getEditor(2), input3);
            await group.closeEditors({ direction: 0 /* LEFT */, except: input2 });
            assert.equal(group.count, 2);
            assert.equal(group.getEditor(0), input2);
            assert.equal(group.getEditor(1), input3);
            part.dispose();
        });
        test('closeAllEditors', async () => {
            const part = createPart();
            const group = part.activeGroup;
            assert.equal(group.isEmpty, true);
            const input = new TestEditorInput(uri_1.URI.file('foo/bar'));
            const inputInactive = new TestEditorInput(uri_1.URI.file('foo/bar/inactive'));
            await group.openEditors([{ editor: input, options: { pinned: true } }, { editor: inputInactive }]);
            assert.equal(group.count, 2);
            assert.equal(group.getEditor(0), input);
            assert.equal(group.getEditor(1), inputInactive);
            await group.closeAllEditors();
            assert.equal(group.isEmpty, true);
            part.dispose();
        });
        test('moveEditor (same group)', async () => {
            const part = createPart();
            const group = part.activeGroup;
            assert.equal(group.isEmpty, true);
            const input = new TestEditorInput(uri_1.URI.file('foo/bar'));
            const inputInactive = new TestEditorInput(uri_1.URI.file('foo/bar/inactive'));
            let editorMoveCounter = 0;
            const editorGroupChangeListener = group.onDidGroupChange(e => {
                if (e.kind === 4 /* EDITOR_MOVE */) {
                    assert.ok(e.editor);
                    editorMoveCounter++;
                }
            });
            await group.openEditors([{ editor: input, options: { pinned: true } }, { editor: inputInactive }]);
            assert.equal(group.count, 2);
            assert.equal(group.getEditor(0), input);
            assert.equal(group.getEditor(1), inputInactive);
            group.moveEditor(inputInactive, group, { index: 0 });
            assert.equal(editorMoveCounter, 1);
            assert.equal(group.getEditor(0), inputInactive);
            assert.equal(group.getEditor(1), input);
            editorGroupChangeListener.dispose();
            part.dispose();
        });
        test('moveEditor (across groups)', async () => {
            const part = createPart();
            const group = part.activeGroup;
            assert.equal(group.isEmpty, true);
            const rightGroup = part.addGroup(group, 3 /* RIGHT */);
            const input = new TestEditorInput(uri_1.URI.file('foo/bar'));
            const inputInactive = new TestEditorInput(uri_1.URI.file('foo/bar/inactive'));
            await group.openEditors([{ editor: input, options: { pinned: true } }, { editor: inputInactive }]);
            assert.equal(group.count, 2);
            assert.equal(group.getEditor(0), input);
            assert.equal(group.getEditor(1), inputInactive);
            group.moveEditor(inputInactive, rightGroup, { index: 0 });
            assert.equal(group.count, 1);
            assert.equal(group.getEditor(0), input);
            assert.equal(rightGroup.count, 1);
            assert.equal(rightGroup.getEditor(0), inputInactive);
            part.dispose();
        });
        test('copyEditor (across groups)', async () => {
            const part = createPart();
            const group = part.activeGroup;
            assert.equal(group.isEmpty, true);
            const rightGroup = part.addGroup(group, 3 /* RIGHT */);
            const input = new TestEditorInput(uri_1.URI.file('foo/bar'));
            const inputInactive = new TestEditorInput(uri_1.URI.file('foo/bar/inactive'));
            await group.openEditors([{ editor: input, options: { pinned: true } }, { editor: inputInactive }]);
            assert.equal(group.count, 2);
            assert.equal(group.getEditor(0), input);
            assert.equal(group.getEditor(1), inputInactive);
            group.copyEditor(inputInactive, rightGroup, { index: 0 });
            assert.equal(group.count, 2);
            assert.equal(group.getEditor(0), input);
            assert.equal(group.getEditor(1), inputInactive);
            assert.equal(rightGroup.count, 1);
            assert.equal(rightGroup.getEditor(0), inputInactive);
            part.dispose();
        });
        test('replaceEditors', async () => {
            const part = createPart();
            const group = part.activeGroup;
            assert.equal(group.isEmpty, true);
            const input = new TestEditorInput(uri_1.URI.file('foo/bar'));
            const inputInactive = new TestEditorInput(uri_1.URI.file('foo/bar/inactive'));
            await group.openEditor(input);
            assert.equal(group.count, 1);
            assert.equal(group.getEditor(0), input);
            await group.replaceEditors([{ editor: input, replacement: inputInactive }]);
            assert.equal(group.count, 1);
            assert.equal(group.getEditor(0), inputInactive);
            part.dispose();
        });
        test('find neighbour group (left/right)', function () {
            const part = createPart();
            const rootGroup = part.activeGroup;
            const rightGroup = part.addGroup(rootGroup, 3 /* RIGHT */);
            assert.equal(rightGroup, part.findGroup({ direction: 3 /* RIGHT */ }, rootGroup));
            assert.equal(rootGroup, part.findGroup({ direction: 2 /* LEFT */ }, rightGroup));
            part.dispose();
        });
        test('find neighbour group (up/down)', function () {
            const part = createPart();
            const rootGroup = part.activeGroup;
            const downGroup = part.addGroup(rootGroup, 1 /* DOWN */);
            assert.equal(downGroup, part.findGroup({ direction: 1 /* DOWN */ }, rootGroup));
            assert.equal(rootGroup, part.findGroup({ direction: 0 /* UP */ }, downGroup));
            part.dispose();
        });
        test('find group by location (left/right)', function () {
            const part = createPart();
            const rootGroup = part.activeGroup;
            const rightGroup = part.addGroup(rootGroup, 3 /* RIGHT */);
            const downGroup = part.addGroup(rightGroup, 1 /* DOWN */);
            assert.equal(rootGroup, part.findGroup({ location: 0 /* FIRST */ }));
            assert.equal(downGroup, part.findGroup({ location: 1 /* LAST */ }));
            assert.equal(rightGroup, part.findGroup({ location: 2 /* NEXT */ }, rootGroup));
            assert.equal(rootGroup, part.findGroup({ location: 3 /* PREVIOUS */ }, rightGroup));
            assert.equal(downGroup, part.findGroup({ location: 2 /* NEXT */ }, rightGroup));
            assert.equal(rightGroup, part.findGroup({ location: 3 /* PREVIOUS */ }, downGroup));
            part.dispose();
        });
    });
});
//# sourceMappingURL=editorGroupsService.test.js.map