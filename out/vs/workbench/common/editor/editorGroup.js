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
define(["require", "exports", "vs/base/common/event", "vs/workbench/common/editor", "vs/platform/instantiation/common/instantiation", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/platform/registry/common/platform", "vs/base/common/map", "vs/base/common/arrays"], function (require, exports, event_1, editor_1, instantiation_1, configuration_1, lifecycle_1, platform_1, map_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const EditorOpenPositioning = {
        LEFT: 'left',
        RIGHT: 'right',
        FIRST: 'first',
        LAST: 'last'
    };
    function isSerializedEditorGroup(obj) {
        const group = obj;
        return obj && typeof obj === 'object' && Array.isArray(group.editors) && Array.isArray(group.mru);
    }
    exports.isSerializedEditorGroup = isSerializedEditorGroup;
    let EditorGroup = class EditorGroup extends lifecycle_1.Disposable {
        constructor(labelOrSerializedGroup, instantiationService, configurationService) {
            super();
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            //#region events
            this._onDidEditorActivate = this._register(new event_1.Emitter());
            this.onDidEditorActivate = this._onDidEditorActivate.event;
            this._onDidEditorOpen = this._register(new event_1.Emitter());
            this.onDidEditorOpen = this._onDidEditorOpen.event;
            this._onDidEditorClose = this._register(new event_1.Emitter());
            this.onDidEditorClose = this._onDidEditorClose.event;
            this._onDidEditorDispose = this._register(new event_1.Emitter());
            this.onDidEditorDispose = this._onDidEditorDispose.event;
            this._onDidEditorBecomeDirty = this._register(new event_1.Emitter());
            this.onDidEditorBecomeDirty = this._onDidEditorBecomeDirty.event;
            this._onDidEditorLabelChange = this._register(new event_1.Emitter());
            this.onDidEditorLabelChange = this._onDidEditorLabelChange.event;
            this._onDidEditorMove = this._register(new event_1.Emitter());
            this.onDidEditorMove = this._onDidEditorMove.event;
            this._onDidEditorPin = this._register(new event_1.Emitter());
            this.onDidEditorPin = this._onDidEditorPin.event;
            this._onDidEditorUnpin = this._register(new event_1.Emitter());
            this.onDidEditorUnpin = this._onDidEditorUnpin.event;
            this.editors = [];
            this.mru = [];
            this.mapResourceToEditorCount = new map_1.ResourceMap();
            this.preview = null; // editor in preview state
            this.active = null; // editor in active state
            if (isSerializedEditorGroup(labelOrSerializedGroup)) {
                this._id = this.deserialize(labelOrSerializedGroup);
            }
            else {
                this._id = EditorGroup.IDS++;
            }
            this.onConfigurationUpdated();
            this.registerListeners();
        }
        get id() { return this._id; }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(e)));
        }
        onConfigurationUpdated(event) {
            this.editorOpenPositioning = this.configurationService.getValue('workbench.editor.openPositioning');
            this.focusRecentEditorAfterClose = this.configurationService.getValue('workbench.editor.focusRecentEditorAfterClose');
        }
        get count() {
            return this.editors.length;
        }
        getEditors(mru) {
            return mru ? this.mru.slice(0) : this.editors.slice(0);
        }
        getEditor(arg1) {
            var _a;
            if (typeof arg1 === 'number') {
                return this.editors[arg1];
            }
            const resource = arg1;
            if (!this.contains(resource)) {
                return undefined; // fast check for resource opened or not
            }
            for (const editor of this.editors) {
                const editorResource = editor_1.toResource(editor, { supportSideBySide: editor_1.SideBySideEditor.MASTER });
                if (((_a = editorResource) === null || _a === void 0 ? void 0 : _a.toString()) === resource.toString()) {
                    return editor;
                }
            }
            return undefined;
        }
        get activeEditor() {
            return this.active;
        }
        isActive(editor) {
            return this.matches(this.active, editor);
        }
        get previewEditor() {
            return this.preview;
        }
        isPreview(editor) {
            return this.matches(this.preview, editor);
        }
        openEditor(editor, options) {
            var _a, _b;
            const index = this.indexOf(editor);
            const makePinned = (_a = options) === null || _a === void 0 ? void 0 : _a.pinned;
            const makeActive = ((_b = options) === null || _b === void 0 ? void 0 : _b.active) || !this.activeEditor || (!makePinned && this.matches(this.preview, this.activeEditor));
            // New editor
            if (index === -1) {
                let targetIndex;
                const indexOfActive = this.indexOf(this.active);
                // Insert into specific position
                if (options && typeof options.index === 'number') {
                    targetIndex = options.index;
                }
                // Insert to the BEGINNING
                else if (this.editorOpenPositioning === EditorOpenPositioning.FIRST) {
                    targetIndex = 0;
                }
                // Insert to the END
                else if (this.editorOpenPositioning === EditorOpenPositioning.LAST) {
                    targetIndex = this.editors.length;
                }
                // Insert to the LEFT of active editor
                else if (this.editorOpenPositioning === EditorOpenPositioning.LEFT) {
                    if (indexOfActive === 0 || !this.editors.length) {
                        targetIndex = 0; // to the left becoming first editor in list
                    }
                    else {
                        targetIndex = indexOfActive; // to the left of active editor
                    }
                }
                // Insert to the RIGHT of active editor
                else {
                    targetIndex = indexOfActive + 1;
                }
                // Insert into our list of editors if pinned or we have no preview editor
                if (makePinned || !this.preview) {
                    this.splice(targetIndex, false, editor);
                }
                // Handle preview
                if (!makePinned) {
                    // Replace existing preview with this editor if we have a preview
                    if (this.preview) {
                        const indexOfPreview = this.indexOf(this.preview);
                        if (targetIndex > indexOfPreview) {
                            targetIndex--; // accomodate for the fact that the preview editor closes
                        }
                        this.replaceEditor(this.preview, editor, targetIndex, !makeActive);
                    }
                    this.preview = editor;
                }
                // Listeners
                this.registerEditorListeners(editor);
                // Event
                this._onDidEditorOpen.fire(editor);
                // Handle active
                if (makeActive) {
                    this.setActive(editor);
                }
            }
            // Existing editor
            else {
                // Pin it
                if (makePinned) {
                    this.pin(editor);
                }
                // Activate it
                if (makeActive) {
                    this.setActive(editor);
                }
                // Respect index
                if (options && typeof options.index === 'number') {
                    this.moveEditor(editor, options.index);
                }
            }
        }
        registerEditorListeners(editor) {
            const listeners = new lifecycle_1.DisposableStore();
            // Re-emit disposal of editor input as our own event
            const onceDispose = event_1.Event.once(editor.onDispose);
            listeners.add(onceDispose(() => {
                if (this.indexOf(editor) >= 0) {
                    this._onDidEditorDispose.fire(editor);
                }
            }));
            // Re-Emit dirty state changes
            listeners.add(editor.onDidChangeDirty(() => {
                this._onDidEditorBecomeDirty.fire(editor);
            }));
            // Re-Emit label changes
            listeners.add(editor.onDidChangeLabel(() => {
                this._onDidEditorLabelChange.fire(editor);
            }));
            // Clean up dispose listeners once the editor gets closed
            listeners.add(this.onDidEditorClose(event => {
                if (event.editor.matches(editor)) {
                    lifecycle_1.dispose(listeners);
                }
            }));
        }
        replaceEditor(toReplace, replaceWith, replaceIndex, openNext = true) {
            const event = this.doCloseEditor(toReplace, openNext, true); // optimization to prevent multiple setActive() in one call
            // We want to first add the new editor into our model before emitting the close event because
            // firing the close event can trigger a dispose on the same editor that is now being added.
            // This can lead into opening a disposed editor which is not what we want.
            this.splice(replaceIndex, false, replaceWith);
            if (event) {
                this._onDidEditorClose.fire(event);
            }
        }
        closeEditor(editor, openNext = true) {
            const event = this.doCloseEditor(editor, openNext, false);
            if (event) {
                this._onDidEditorClose.fire(event);
                return event.index;
            }
            return undefined;
        }
        doCloseEditor(editor, openNext, replaced) {
            const index = this.indexOf(editor);
            if (index === -1) {
                return null; // not found
            }
            // Active Editor closed
            if (openNext && this.matches(this.active, editor)) {
                // More than one editor
                if (this.mru.length > 1) {
                    let newActive;
                    if (this.focusRecentEditorAfterClose) {
                        newActive = this.mru[1]; // active editor is always first in MRU, so pick second editor after as new active
                    }
                    else {
                        if (index === this.editors.length - 1) {
                            newActive = this.editors[index - 1]; // last editor is closed, pick previous as new active
                        }
                        else {
                            newActive = this.editors[index + 1]; // pick next editor as new active
                        }
                    }
                    this.setActive(newActive);
                }
                // One Editor
                else {
                    this.active = null;
                }
            }
            // Preview Editor closed
            if (this.matches(this.preview, editor)) {
                this.preview = null;
            }
            // Remove from arrays
            this.splice(index, true);
            // Event
            return { editor, replaced, index, groupId: this.id };
        }
        closeEditors(except, direction) {
            const index = this.indexOf(except);
            if (index === -1) {
                return; // not found
            }
            // Close to the left
            if (direction === 0 /* LEFT */) {
                for (let i = index - 1; i >= 0; i--) {
                    this.closeEditor(this.editors[i]);
                }
            }
            // Close to the right
            else if (direction === 1 /* RIGHT */) {
                for (let i = this.editors.length - 1; i > index; i--) {
                    this.closeEditor(this.editors[i]);
                }
            }
            // Both directions
            else {
                this.mru.filter(e => !this.matches(e, except)).forEach(e => this.closeEditor(e));
            }
        }
        closeAllEditors() {
            // Optimize: close all non active editors first to produce less upstream work
            this.mru.filter(e => !this.matches(e, this.active)).forEach(e => this.closeEditor(e));
            if (this.active) {
                this.closeEditor(this.active);
            }
        }
        moveEditor(editor, toIndex) {
            const index = this.indexOf(editor);
            if (index < 0) {
                return;
            }
            // Move
            this.editors.splice(index, 1);
            this.editors.splice(toIndex, 0, editor);
            // Event
            this._onDidEditorMove.fire(editor);
        }
        setActive(editor) {
            const index = this.indexOf(editor);
            if (index === -1) {
                return; // not found
            }
            if (this.matches(this.active, editor)) {
                return; // already active
            }
            this.active = editor;
            // Bring to front in MRU list
            this.setMostRecentlyUsed(editor);
            // Event
            this._onDidEditorActivate.fire(editor);
        }
        pin(editor) {
            const index = this.indexOf(editor);
            if (index === -1) {
                return; // not found
            }
            if (!this.isPreview(editor)) {
                return; // can only pin a preview editor
            }
            // Convert the preview editor to be a pinned editor
            this.preview = null;
            // Event
            this._onDidEditorPin.fire(editor);
        }
        unpin(editor) {
            const index = this.indexOf(editor);
            if (index === -1) {
                return; // not found
            }
            if (!this.isPinned(editor)) {
                return; // can only unpin a pinned editor
            }
            // Set new
            const oldPreview = this.preview;
            this.preview = editor;
            // Event
            this._onDidEditorUnpin.fire(editor);
            // Close old preview editor if any
            if (oldPreview) {
                this.closeEditor(oldPreview);
            }
        }
        isPinned(arg1) {
            let editor;
            let index;
            if (typeof arg1 === 'number') {
                editor = this.editors[arg1];
                index = arg1;
            }
            else {
                editor = arg1;
                index = this.indexOf(editor);
            }
            if (index === -1 || !editor) {
                return false; // editor not found
            }
            if (!this.preview) {
                return true; // no preview editor
            }
            return !this.matches(this.preview, editor);
        }
        splice(index, del, editor) {
            const editorToDeleteOrReplace = this.editors[index];
            const args = [index, del ? 1 : 0];
            if (editor) {
                args.push(editor);
            }
            // Perform on editors array
            this.editors.splice.apply(this.editors, args);
            // Add
            if (!del && editor) {
                this.mru.push(editor); // make it LRU editor
                this.updateResourceMap(editor, false /* add */); // add new to resource map
            }
            // Remove / Replace
            else {
                const indexInMRU = this.indexOf(editorToDeleteOrReplace, this.mru);
                // Remove
                if (del && !editor) {
                    this.mru.splice(indexInMRU, 1); // remove from MRU
                    this.updateResourceMap(editorToDeleteOrReplace, true /* delete */); // remove from resource map
                }
                // Replace
                else if (del && editor) {
                    this.mru.splice(indexInMRU, 1, editor); // replace MRU at location
                    this.updateResourceMap(editor, false /* add */); // add new to resource map
                    this.updateResourceMap(editorToDeleteOrReplace, true /* delete */); // remove replaced from resource map
                }
            }
        }
        updateResourceMap(editor, remove) {
            const resource = editor_1.toResource(editor, { supportSideBySide: editor_1.SideBySideEditor.MASTER });
            if (resource) {
                // It is possible to have the same resource opened twice (once as normal input and once as diff input)
                // So we need to do ref counting on the resource to provide the correct picture
                const counter = this.mapResourceToEditorCount.get(resource) || 0;
                // Add
                let newCounter;
                if (!remove) {
                    newCounter = counter + 1;
                }
                // Delete
                else {
                    newCounter = counter - 1;
                }
                if (newCounter > 0) {
                    this.mapResourceToEditorCount.set(resource, newCounter);
                }
                else {
                    this.mapResourceToEditorCount.delete(resource);
                }
            }
        }
        indexOf(candidate, editors = this.editors) {
            if (!candidate) {
                return -1;
            }
            for (let i = 0; i < editors.length; i++) {
                if (this.matches(editors[i], candidate)) {
                    return i;
                }
            }
            return -1;
        }
        contains(editorOrResource, supportSideBySide) {
            if (editorOrResource instanceof editor_1.EditorInput) {
                const index = this.indexOf(editorOrResource);
                if (index >= 0) {
                    return true;
                }
                if (supportSideBySide && editorOrResource instanceof editor_1.SideBySideEditorInput) {
                    const index = this.indexOf(editorOrResource.master);
                    if (index >= 0) {
                        return true;
                    }
                }
                return false;
            }
            const counter = this.mapResourceToEditorCount.get(editorOrResource);
            return typeof counter === 'number' && counter > 0;
        }
        setMostRecentlyUsed(editor) {
            const index = this.indexOf(editor);
            if (index === -1) {
                return; // editor not found
            }
            const mruIndex = this.indexOf(editor, this.mru);
            // Remove old index
            this.mru.splice(mruIndex, 1);
            // Set editor to front
            this.mru.unshift(editor);
        }
        matches(editorA, editorB) {
            return !!editorA && !!editorB && editorA.matches(editorB);
        }
        clone() {
            const group = this.instantiationService.createInstance(EditorGroup, undefined);
            group.editors = this.editors.slice(0);
            group.mru = this.mru.slice(0);
            group.mapResourceToEditorCount = this.mapResourceToEditorCount.clone();
            group.preview = this.preview;
            group.active = this.active;
            group.editorOpenPositioning = this.editorOpenPositioning;
            return group;
        }
        serialize() {
            const registry = platform_1.Registry.as(editor_1.Extensions.EditorInputFactories);
            // Serialize all editor inputs so that we can store them.
            // Editors that cannot be serialized need to be ignored
            // from mru, active and preview if any.
            let serializableEditors = [];
            let serializedEditors = [];
            let serializablePreviewIndex;
            this.editors.forEach(e => {
                const factory = registry.getEditorInputFactory(e.getTypeId());
                if (factory) {
                    const value = factory.serialize(e);
                    if (typeof value === 'string') {
                        serializedEditors.push({ id: e.getTypeId(), value });
                        serializableEditors.push(e);
                        if (this.preview === e) {
                            serializablePreviewIndex = serializableEditors.length - 1;
                        }
                    }
                }
            });
            const serializableMru = this.mru.map(e => this.indexOf(e, serializableEditors)).filter(i => i >= 0);
            return {
                id: this.id,
                editors: serializedEditors,
                mru: serializableMru,
                preview: serializablePreviewIndex,
            };
        }
        deserialize(data) {
            const registry = platform_1.Registry.as(editor_1.Extensions.EditorInputFactories);
            if (typeof data.id === 'number') {
                this._id = data.id;
                EditorGroup.IDS = Math.max(data.id + 1, EditorGroup.IDS); // make sure our ID generator is always larger
            }
            else {
                this._id = EditorGroup.IDS++; // backwards compatibility
            }
            this.editors = arrays_1.coalesce(data.editors.map(e => {
                const factory = registry.getEditorInputFactory(e.id);
                if (factory) {
                    const editor = factory.deserialize(this.instantiationService, e.value);
                    if (editor) {
                        this.registerEditorListeners(editor);
                        this.updateResourceMap(editor, false /* add */);
                    }
                    return editor;
                }
                return null;
            }));
            this.mru = data.mru.map(i => this.editors[i]);
            this.active = this.mru[0];
            if (typeof data.preview === 'number') {
                this.preview = this.editors[data.preview];
            }
            return this._id;
        }
    };
    EditorGroup.IDS = 0;
    EditorGroup = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, configuration_1.IConfigurationService)
    ], EditorGroup);
    exports.EditorGroup = EditorGroup;
});
//# sourceMappingURL=editorGroup.js.map