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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/platform/registry/common/platform", "vs/workbench/browser/editor", "vs/workbench/services/layout/browser/layoutService", "vs/platform/instantiation/common/instantiation", "vs/platform/progress/common/progress", "vs/workbench/browser/parts/editor/editor", "vs/base/common/event", "vs/base/common/types"], function (require, exports, lifecycle_1, dom_1, platform_1, editor_1, layoutService_1, instantiation_1, progress_1, editor_2, event_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let EditorControl = class EditorControl extends lifecycle_1.Disposable {
        constructor(parent, groupView, layoutService, instantiationService, editorProgressService) {
            super();
            this.parent = parent;
            this.groupView = groupView;
            this.layoutService = layoutService;
            this.instantiationService = instantiationService;
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidSizeConstraintsChange = this._register(new event_1.Emitter());
            this._activeControl = null;
            this.controls = [];
            this.activeControlDisposables = this._register(new lifecycle_1.DisposableStore());
            this.editorOperation = this._register(new progress_1.LongRunningOperation(editorProgressService));
        }
        get minimumWidth() { return this._activeControl ? this._activeControl.minimumWidth : editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.width; }
        get minimumHeight() { return this._activeControl ? this._activeControl.minimumHeight : editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.height; }
        get maximumWidth() { return this._activeControl ? this._activeControl.maximumWidth : editor_2.DEFAULT_EDITOR_MAX_DIMENSIONS.width; }
        get maximumHeight() { return this._activeControl ? this._activeControl.maximumHeight : editor_2.DEFAULT_EDITOR_MAX_DIMENSIONS.height; }
        get onDidSizeConstraintsChange() { return this._onDidSizeConstraintsChange.event; }
        get activeControl() {
            return this._activeControl;
        }
        async openEditor(editor, options) {
            // Editor control
            const descriptor = platform_1.Registry.as(editor_1.Extensions.Editors).getEditor(editor);
            if (!descriptor) {
                throw new Error('No editor descriptor found');
            }
            const control = this.doShowEditorControl(descriptor);
            // Set input
            const editorChanged = await this.doSetInput(control, editor, options);
            return { control, editorChanged };
        }
        doShowEditorControl(descriptor) {
            // Return early if the currently active editor control can handle the input
            if (this._activeControl && descriptor.describes(this._activeControl)) {
                return this._activeControl;
            }
            // Hide active one first
            this.doHideActiveEditorControl();
            // Create editor
            const control = this.doCreateEditorControl(descriptor);
            // Set editor as active
            this.doSetActiveControl(control);
            // Show editor
            const container = types_1.assertIsDefined(control.getContainer());
            this.parent.appendChild(container);
            dom_1.show(container);
            // Indicate to editor that it is now visible
            control.setVisible(true, this.groupView);
            // Layout
            if (this.dimension) {
                control.layout(this.dimension);
            }
            return control;
        }
        doCreateEditorControl(descriptor) {
            // Instantiate editor
            const control = this.doInstantiateEditorControl(descriptor);
            // Create editor container as needed
            if (!control.getContainer()) {
                const controlInstanceContainer = document.createElement('div');
                dom_1.addClass(controlInstanceContainer, 'editor-instance');
                controlInstanceContainer.setAttribute('data-editor-id', descriptor.getId());
                control.create(controlInstanceContainer);
            }
            return control;
        }
        doInstantiateEditorControl(descriptor) {
            // Return early if already instantiated
            const existingControl = this.controls.filter(control => descriptor.describes(control))[0];
            if (existingControl) {
                return existingControl;
            }
            // Otherwise instantiate new
            const control = this._register(descriptor.instantiate(this.instantiationService));
            this.controls.push(control);
            return control;
        }
        doSetActiveControl(control) {
            this._activeControl = control;
            // Clear out previous active control listeners
            this.activeControlDisposables.clear();
            // Listen to control changes
            if (control) {
                this.activeControlDisposables.add(control.onDidSizeConstraintsChange(e => this._onDidSizeConstraintsChange.fire(e)));
                this.activeControlDisposables.add(control.onDidFocus(() => this._onDidFocus.fire()));
            }
            // Indicate that size constraints could have changed due to new editor
            this._onDidSizeConstraintsChange.fire(undefined);
        }
        async doSetInput(control, editor, options) {
            var _a;
            // If the input did not change, return early and only apply the options
            // unless the options instruct us to force open it even if it is the same
            const forceReload = (_a = options) === null || _a === void 0 ? void 0 : _a.forceReload;
            const inputMatches = control.input && control.input.matches(editor);
            if (inputMatches && !forceReload) {
                // Forward options
                control.setOptions(options);
                // Still focus as needed
                const focus = !options || !options.preserveFocus;
                if (focus) {
                    control.focus();
                }
                return false;
            }
            // Show progress while setting input after a certain timeout. If the workbench is opening
            // be more relaxed about progress showing by increasing the delay a little bit to reduce flicker.
            const operation = this.editorOperation.start(this.layoutService.isRestored() ? 800 : 3200);
            // Call into editor control
            const editorWillChange = !inputMatches;
            try {
                await control.setInput(editor, options, operation.token);
                // Focus (unless prevented or another operation is running)
                if (operation.isCurrent()) {
                    const focus = !options || !options.preserveFocus;
                    if (focus) {
                        control.focus();
                    }
                }
                return editorWillChange;
            }
            finally {
                operation.stop();
            }
        }
        doHideActiveEditorControl() {
            if (!this._activeControl) {
                return;
            }
            // Stop any running operation
            this.editorOperation.stop();
            // Remove control from parent and hide
            const controlInstanceContainer = this._activeControl.getContainer();
            if (controlInstanceContainer) {
                this.parent.removeChild(controlInstanceContainer);
                dom_1.hide(controlInstanceContainer);
            }
            // Indicate to editor control
            this._activeControl.clearInput();
            this._activeControl.setVisible(false, this.groupView);
            // Clear active control
            this.doSetActiveControl(null);
        }
        closeEditor(editor) {
            if (this._activeControl && editor.matches(this._activeControl.input)) {
                this.doHideActiveEditorControl();
            }
        }
        setVisible(visible) {
            if (this._activeControl) {
                this._activeControl.setVisible(visible, this.groupView);
            }
        }
        layout(dimension) {
            this.dimension = dimension;
            if (this._activeControl && this.dimension) {
                this._activeControl.layout(this.dimension);
            }
        }
    };
    EditorControl = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, progress_1.IEditorProgressService)
    ], EditorControl);
    exports.EditorControl = EditorControl;
});
//# sourceMappingURL=editorControl.js.map