/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/browser/panel", "vs/workbench/common/editor", "vs/base/common/map", "vs/base/common/event", "vs/base/common/types", "vs/workbench/browser/parts/editor/editor"], function (require, exports, panel_1, editor_1, map_1, event_1, types_1, editor_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * The base class of editors in the workbench. Editors register themselves for specific editor inputs.
     * Editors are layed out in the editor part of the workbench in editor groups. Multiple editors can be
     * open at the same time. Each editor has a minimized representation that is good enough to provide some
     * information about the state of the editor data.
     *
     * The workbench will keep an editor alive after it has been created and show/hide it based on
     * user interaction. The lifecycle of a editor goes in the order create(), setVisible(true|false),
     * layout(), setInput(), focus(), dispose(). During use of the workbench, a editor will often receive a
     * clearInput, setVisible, layout and focus call, but only one create and dispose call.
     *
     * This class is only intended to be subclassed and not instantiated.
     */
    class BaseEditor extends panel_1.Panel {
        constructor(id, telemetryService, themeService, storageService) {
            super(id, telemetryService, themeService, storageService);
            this.minimumWidth = editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.width;
            this.maximumWidth = editor_2.DEFAULT_EDITOR_MAX_DIMENSIONS.width;
            this.minimumHeight = editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.height;
            this.maximumHeight = editor_2.DEFAULT_EDITOR_MAX_DIMENSIONS.height;
            this.onDidSizeConstraintsChange = event_1.Event.None;
        }
        get input() {
            return this._input;
        }
        get options() {
            return this._options;
        }
        get group() {
            return this._group;
        }
        /**
         * Note: Clients should not call this method, the workbench calls this
         * method. Calling it otherwise may result in unexpected behavior.
         *
         * Sets the given input with the options to the editor. The input is guaranteed
         * to be different from the previous input that was set using the input.matches()
         * method.
         *
         * The provided cancellation token should be used to test if the operation
         * was cancelled.
         */
        setInput(input, options, token) {
            this._input = input;
            this._options = options;
            return Promise.resolve();
        }
        /**
         * Called to indicate to the editor that the input should be cleared and
         * resources associated with the input should be freed.
         */
        clearInput() {
            this._input = undefined;
            this._options = undefined;
        }
        /**
         * Note: Clients should not call this method, the workbench calls this
         * method. Calling it otherwise may result in unexpected behavior.
         *
         * Sets the given options to the editor. Clients should apply the options
         * to the current input.
         */
        setOptions(options) {
            this._options = options;
        }
        create(parent) {
            super.create(parent);
            // Create Editor
            this.createEditor(parent);
        }
        setVisible(visible, group) {
            super.setVisible(visible);
            // Propagate to Editor
            this.setEditorVisible(visible, group);
        }
        /**
         * Indicates that the editor control got visible or hidden in a specific group. A
         * editor instance will only ever be visible in one editor group.
         *
         * @param visible the state of visibility of this editor
         * @param group the editor group this editor is in.
         */
        setEditorVisible(visible, group) {
            this._group = group;
        }
        getEditorMemento(editorGroupService, key, limit = 10) {
            const mementoKey = `${this.getId()}${key}`;
            let editorMemento = BaseEditor.EDITOR_MEMENTOS.get(mementoKey);
            if (!editorMemento) {
                editorMemento = new EditorMemento(this.getId(), key, this.getMemento(1 /* WORKSPACE */), limit, editorGroupService);
                BaseEditor.EDITOR_MEMENTOS.set(mementoKey, editorMemento);
            }
            return editorMemento;
        }
        saveState() {
            // Save all editor memento for this editor type
            BaseEditor.EDITOR_MEMENTOS.forEach(editorMemento => {
                if (editorMemento.id === this.getId()) {
                    editorMemento.saveState();
                }
            });
            super.saveState();
        }
        dispose() {
            this._input = undefined;
            this._options = undefined;
            super.dispose();
        }
    }
    exports.BaseEditor = BaseEditor;
    BaseEditor.EDITOR_MEMENTOS = new Map();
    class EditorMemento {
        constructor(_id, key, memento, limit, editorGroupService) {
            this._id = _id;
            this.key = key;
            this.memento = memento;
            this.limit = limit;
            this.editorGroupService = editorGroupService;
            this.cleanedUp = false;
        }
        get id() {
            return this._id;
        }
        saveEditorState(group, resourceOrEditor, state) {
            const resource = this.doGetResource(resourceOrEditor);
            if (!resource || !group) {
                return; // we are not in a good state to save any state for a resource
            }
            const cache = this.doLoad();
            let mementoForResource = cache.get(resource.toString());
            if (!mementoForResource) {
                mementoForResource = Object.create(null);
                cache.set(resource.toString(), mementoForResource);
            }
            mementoForResource[group.id] = state;
            // Automatically clear when editor input gets disposed if any
            if (resourceOrEditor instanceof editor_1.EditorInput) {
                event_1.Event.once(resourceOrEditor.onDispose)(() => {
                    this.clearEditorState(resource);
                });
            }
        }
        loadEditorState(group, resourceOrEditor) {
            const resource = this.doGetResource(resourceOrEditor);
            if (!resource || !group) {
                return undefined; // we are not in a good state to load any state for a resource
            }
            const cache = this.doLoad();
            const mementoForResource = cache.get(resource.toString());
            if (mementoForResource) {
                return mementoForResource[group.id];
            }
            return undefined;
        }
        clearEditorState(resourceOrEditor, group) {
            const resource = this.doGetResource(resourceOrEditor);
            if (resource) {
                const cache = this.doLoad();
                if (group) {
                    const resourceViewState = cache.get(resource.toString());
                    if (resourceViewState) {
                        delete resourceViewState[group.id];
                    }
                }
                else {
                    cache.delete(resource.toString());
                }
            }
        }
        doGetResource(resourceOrEditor) {
            if (resourceOrEditor instanceof editor_1.EditorInput) {
                return resourceOrEditor.getResource();
            }
            return resourceOrEditor;
        }
        doLoad() {
            if (!this.cache) {
                this.cache = new map_1.LRUCache(this.limit);
                // Restore from serialized map state
                const rawEditorMemento = this.memento[this.key];
                if (Array.isArray(rawEditorMemento)) {
                    this.cache.fromJSON(rawEditorMemento);
                }
            }
            return this.cache;
        }
        saveState() {
            const cache = this.doLoad();
            // Cleanup once during shutdown
            if (!this.cleanedUp) {
                this.cleanUp();
                this.cleanedUp = true;
            }
            this.memento[this.key] = cache.toJSON();
        }
        cleanUp() {
            const cache = this.doLoad();
            // Remove groups from states that no longer exist
            cache.forEach((mapGroupToMemento, resource) => {
                Object.keys(mapGroupToMemento).forEach(group => {
                    const groupId = Number(group);
                    if (!this.editorGroupService.getGroup(groupId)) {
                        delete mapGroupToMemento[groupId];
                        if (types_1.isEmptyObject(mapGroupToMemento)) {
                            cache.delete(resource);
                        }
                    }
                });
            });
        }
    }
    exports.EditorMemento = EditorMemento;
});
//# sourceMappingURL=baseEditor.js.map