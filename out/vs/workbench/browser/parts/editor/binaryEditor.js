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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/workbench/browser/parts/editor/baseEditor", "vs/workbench/common/editor/binaryEditorModel", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/workbench/browser/parts/editor/resourceViewer", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/platform/storage/common/storage", "vs/workbench/services/environment/common/environmentService", "vs/base/common/types"], function (require, exports, nls, event_1, baseEditor_1, binaryEditorModel_1, scrollableElement_1, resourceViewer_1, dom_1, lifecycle_1, storage_1, environmentService_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /*
     * This class is only intended to be subclassed and not instantiated.
     */
    let BaseBinaryResourceEditor = class BaseBinaryResourceEditor extends baseEditor_1.BaseEditor {
        constructor(id, callbacks, telemetryService, themeService, environmentService, storageService) {
            super(id, telemetryService, themeService, storageService);
            this.environmentService = environmentService;
            this._onMetadataChanged = this._register(new event_1.Emitter());
            this.onMetadataChanged = this._onMetadataChanged.event;
            this._onDidOpenInPlace = this._register(new event_1.Emitter());
            this.onDidOpenInPlace = this._onDidOpenInPlace.event;
            this.callbacks = callbacks;
        }
        getTitle() {
            return this.input ? this.input.getName() : nls.localize('binaryEditor', "Binary Viewer");
        }
        createEditor(parent) {
            // Container for Binary
            this.binaryContainer = document.createElement('div');
            this.binaryContainer.className = 'binary-container';
            this.binaryContainer.style.outline = 'none';
            this.binaryContainer.tabIndex = 0; // enable focus support from the editor part (do not remove)
            // Custom Scrollbars
            this.scrollbar = this._register(new scrollableElement_1.DomScrollableElement(this.binaryContainer, { horizontal: 1 /* Auto */, vertical: 1 /* Auto */ }));
            parent.appendChild(this.scrollbar.getDomNode());
        }
        async setInput(input, options, token) {
            await super.setInput(input, options, token);
            const model = await input.resolve();
            // Check for cancellation
            if (token.isCancellationRequested) {
                return;
            }
            // Assert Model instance
            if (!(model instanceof binaryEditorModel_1.BinaryEditorModel)) {
                throw new Error('Unable to open file as binary');
            }
            // Render Input
            if (this.resourceViewerContext) {
                this.resourceViewerContext.dispose();
            }
            const [binaryContainer, scrollbar] = types_1.assertAllDefined(this.binaryContainer, this.scrollbar);
            this.resourceViewerContext = resourceViewer_1.ResourceViewer.show({ name: model.getName(), resource: model.getResource(), size: model.getSize(), etag: model.getETag(), mime: model.getMime() }, binaryContainer, scrollbar, {
                openInternalClb: () => this.handleOpenInternalCallback(input, options),
                openExternalClb: this.environmentService.configuration.remoteAuthority ? undefined : resource => this.callbacks.openExternal(resource),
                metadataClb: meta => this.handleMetadataChanged(meta)
            });
        }
        async handleOpenInternalCallback(input, options) {
            await this.callbacks.openInternal(input, options);
            // Signal to listeners that the binary editor has been opened in-place
            this._onDidOpenInPlace.fire();
        }
        handleMetadataChanged(meta) {
            this.metadata = meta;
            this._onMetadataChanged.fire();
        }
        getMetadata() {
            return this.metadata;
        }
        clearInput() {
            // Clear Meta
            this.handleMetadataChanged(undefined);
            // Clear the rest
            if (this.binaryContainer) {
                dom_1.clearNode(this.binaryContainer);
            }
            lifecycle_1.dispose(this.resourceViewerContext);
            this.resourceViewerContext = undefined;
            super.clearInput();
        }
        layout(dimension) {
            // Pass on to Binary Container
            const [binaryContainer, scrollbar] = types_1.assertAllDefined(this.binaryContainer, this.scrollbar);
            dom_1.size(binaryContainer, dimension.width, dimension.height);
            scrollbar.scanDomNode();
            if (this.resourceViewerContext && this.resourceViewerContext.layout) {
                this.resourceViewerContext.layout(dimension);
            }
        }
        focus() {
            const binaryContainer = types_1.assertIsDefined(this.binaryContainer);
            binaryContainer.focus();
        }
        dispose() {
            if (this.binaryContainer) {
                this.binaryContainer.remove();
            }
            lifecycle_1.dispose(this.resourceViewerContext);
            this.resourceViewerContext = undefined;
            super.dispose();
        }
    };
    BaseBinaryResourceEditor = __decorate([
        __param(4, environmentService_1.IWorkbenchEnvironmentService),
        __param(5, storage_1.IStorageService)
    ], BaseBinaryResourceEditor);
    exports.BaseBinaryResourceEditor = BaseBinaryResourceEditor;
});
//# sourceMappingURL=binaryEditor.js.map