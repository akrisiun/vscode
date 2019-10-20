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
define(["require", "exports", "vs/base/browser/dom", "vs/platform/registry/common/platform", "vs/workbench/browser/parts/editor/baseEditor", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/browser/editor", "vs/base/browser/ui/splitview/splitview", "vs/base/common/event", "vs/platform/storage/common/storage", "vs/base/common/types"], function (require, exports, DOM, platform_1, baseEditor_1, telemetry_1, instantiation_1, themeService_1, colorRegistry_1, editor_1, splitview_1, event_1, storage_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let SideBySideEditor = class SideBySideEditor extends baseEditor_1.BaseEditor {
        constructor(telemetryService, instantiationService, themeService, storageService) {
            super(SideBySideEditor.ID, telemetryService, themeService, storageService);
            this.instantiationService = instantiationService;
            this.dimension = new DOM.Dimension(0, 0);
            this.onDidCreateEditors = this._register(new event_1.Emitter());
            this._onDidSizeConstraintsChange = this._register(new event_1.Relay());
            this.onDidSizeConstraintsChange = event_1.Event.any(this.onDidCreateEditors.event, this._onDidSizeConstraintsChange.event);
        }
        get minimumMasterWidth() { return this.masterEditor ? this.masterEditor.minimumWidth : 0; }
        get maximumMasterWidth() { return this.masterEditor ? this.masterEditor.maximumWidth : Number.POSITIVE_INFINITY; }
        get minimumMasterHeight() { return this.masterEditor ? this.masterEditor.minimumHeight : 0; }
        get maximumMasterHeight() { return this.masterEditor ? this.masterEditor.maximumHeight : Number.POSITIVE_INFINITY; }
        get minimumDetailsWidth() { return this.detailsEditor ? this.detailsEditor.minimumWidth : 0; }
        get maximumDetailsWidth() { return this.detailsEditor ? this.detailsEditor.maximumWidth : Number.POSITIVE_INFINITY; }
        get minimumDetailsHeight() { return this.detailsEditor ? this.detailsEditor.minimumHeight : 0; }
        get maximumDetailsHeight() { return this.detailsEditor ? this.detailsEditor.maximumHeight : Number.POSITIVE_INFINITY; }
        // these setters need to exist because this extends from BaseEditor
        set minimumWidth(value) { }
        set maximumWidth(value) { }
        set minimumHeight(value) { }
        set maximumHeight(value) { }
        get minimumWidth() { return this.minimumMasterWidth + this.minimumDetailsWidth; }
        get maximumWidth() { return this.maximumMasterWidth + this.maximumDetailsWidth; }
        get minimumHeight() { return this.minimumMasterHeight + this.minimumDetailsHeight; }
        get maximumHeight() { return this.maximumMasterHeight + this.maximumDetailsHeight; }
        createEditor(parent) {
            DOM.addClass(parent, 'side-by-side-editor');
            const splitview = this.splitview = this._register(new splitview_1.SplitView(parent, { orientation: 1 /* HORIZONTAL */ }));
            this._register(this.splitview.onDidSashReset(() => splitview.distributeViewSizes()));
            this.detailsEditorContainer = DOM.$('.details-editor-container');
            this.splitview.addView({
                element: this.detailsEditorContainer,
                layout: size => this.detailsEditor && this.detailsEditor.layout(new DOM.Dimension(size, this.dimension.height)),
                minimumSize: 220,
                maximumSize: Number.POSITIVE_INFINITY,
                onDidChange: event_1.Event.None
            }, splitview_1.Sizing.Distribute);
            this.masterEditorContainer = DOM.$('.master-editor-container');
            this.splitview.addView({
                element: this.masterEditorContainer,
                layout: size => this.masterEditor && this.masterEditor.layout(new DOM.Dimension(size, this.dimension.height)),
                minimumSize: 220,
                maximumSize: Number.POSITIVE_INFINITY,
                onDidChange: event_1.Event.None
            }, splitview_1.Sizing.Distribute);
            this.updateStyles();
        }
        async setInput(newInput, options, token) {
            const oldInput = this.input;
            await super.setInput(newInput, options, token);
            return this.updateInput(oldInput, newInput, options, token);
        }
        setOptions(options) {
            if (this.masterEditor) {
                this.masterEditor.setOptions(options);
            }
        }
        setEditorVisible(visible, group) {
            if (this.masterEditor) {
                this.masterEditor.setVisible(visible, group);
            }
            if (this.detailsEditor) {
                this.detailsEditor.setVisible(visible, group);
            }
            super.setEditorVisible(visible, group);
        }
        clearInput() {
            if (this.masterEditor) {
                this.masterEditor.clearInput();
            }
            if (this.detailsEditor) {
                this.detailsEditor.clearInput();
            }
            this.disposeEditors();
            super.clearInput();
        }
        focus() {
            if (this.masterEditor) {
                this.masterEditor.focus();
            }
        }
        layout(dimension) {
            this.dimension = dimension;
            const splitview = types_1.assertIsDefined(this.splitview);
            splitview.layout(dimension.width);
        }
        getControl() {
            if (this.masterEditor) {
                return this.masterEditor.getControl();
            }
            return undefined;
        }
        getMasterEditor() {
            return this.masterEditor;
        }
        getDetailsEditor() {
            return this.detailsEditor;
        }
        async updateInput(oldInput, newInput, options, token) {
            if (!newInput.matches(oldInput)) {
                if (oldInput) {
                    this.disposeEditors();
                }
                return this.setNewInput(newInput, options, token);
            }
            if (!this.detailsEditor || !this.masterEditor) {
                return;
            }
            await Promise.all([
                this.detailsEditor.setInput(newInput.details, undefined, token),
                this.masterEditor.setInput(newInput.master, options, token)
            ]);
        }
        setNewInput(newInput, options, token) {
            const detailsEditor = this.doCreateEditor(newInput.details, types_1.assertIsDefined(this.detailsEditorContainer));
            const masterEditor = this.doCreateEditor(newInput.master, types_1.assertIsDefined(this.masterEditorContainer));
            return this.onEditorsCreated(detailsEditor, masterEditor, newInput.details, newInput.master, options, token);
        }
        doCreateEditor(editorInput, container) {
            const descriptor = platform_1.Registry.as(editor_1.Extensions.Editors).getEditor(editorInput);
            if (!descriptor) {
                throw new Error('No descriptor for editor found');
            }
            const editor = descriptor.instantiate(this.instantiationService);
            editor.create(container);
            editor.setVisible(this.isVisible(), this.group);
            return editor;
        }
        async onEditorsCreated(details, master, detailsInput, masterInput, options, token) {
            this.detailsEditor = details;
            this.masterEditor = master;
            this._onDidSizeConstraintsChange.input = event_1.Event.any(event_1.Event.map(details.onDidSizeConstraintsChange, () => undefined), event_1.Event.map(master.onDidSizeConstraintsChange, () => undefined));
            this.onDidCreateEditors.fire(undefined);
            await Promise.all([
                this.detailsEditor.setInput(detailsInput, undefined, token),
                this.masterEditor.setInput(masterInput, options, token)
            ]);
        }
        updateStyles() {
            super.updateStyles();
            if (this.masterEditorContainer) {
                this.masterEditorContainer.style.boxShadow = `-6px 0 5px -5px ${this.getColor(colorRegistry_1.scrollbarShadow)}`;
            }
        }
        disposeEditors() {
            if (this.detailsEditor) {
                this.detailsEditor.dispose();
                this.detailsEditor = undefined;
            }
            if (this.masterEditor) {
                this.masterEditor.dispose();
                this.masterEditor = undefined;
            }
            if (this.detailsEditorContainer) {
                DOM.clearNode(this.detailsEditorContainer);
            }
            if (this.masterEditorContainer) {
                DOM.clearNode(this.masterEditorContainer);
            }
        }
        dispose() {
            this.disposeEditors();
            super.dispose();
        }
    };
    SideBySideEditor.ID = 'workbench.editor.sidebysideEditor';
    SideBySideEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, themeService_1.IThemeService),
        __param(3, storage_1.IStorageService)
    ], SideBySideEditor);
    exports.SideBySideEditor = SideBySideEditor;
});
//# sourceMappingURL=sideBySideEditor.js.map