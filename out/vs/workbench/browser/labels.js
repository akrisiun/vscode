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
define(["require", "exports", "vs/base/common/resources", "vs/base/browser/ui/iconLabel/iconLabel", "vs/workbench/services/extensions/common/extensions", "vs/editor/common/services/modeService", "vs/workbench/common/editor", "vs/editor/common/modes/modesRegistry", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/editor/common/services/modelService", "vs/workbench/services/untitled/common/untitledEditorService", "vs/workbench/services/decorations/browser/decorations", "vs/base/common/network", "vs/platform/files/common/files", "vs/platform/theme/common/themeService", "vs/base/common/event", "vs/platform/label/common/label", "vs/editor/common/services/getIconClasses", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/base/common/types"], function (require, exports, resources, iconLabel_1, extensions_1, modeService_1, editor_1, modesRegistry_1, workspace_1, configuration_1, modelService_1, untitledEditorService_1, decorations_1, network_1, files_1, themeService_1, event_1, label_1, getIconClasses_1, lifecycle_1, instantiation_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DEFAULT_LABELS_CONTAINER = {
        onDidChangeVisibility: event_1.Event.None
    };
    let ResourceLabels = class ResourceLabels extends lifecycle_1.Disposable {
        constructor(container, instantiationService, extensionService, configurationService, modelService, decorationsService, themeService, fileService, labelService) {
            super();
            this.instantiationService = instantiationService;
            this.extensionService = extensionService;
            this.configurationService = configurationService;
            this.modelService = modelService;
            this.decorationsService = decorationsService;
            this.themeService = themeService;
            this.fileService = fileService;
            this.labelService = labelService;
            this._widgets = [];
            this._labels = [];
            this.registerListeners(container);
        }
        registerListeners(container) {
            // notify when visibility changes
            this._register(container.onDidChangeVisibility(visible => {
                this._widgets.forEach(widget => widget.notifyVisibilityChanged(visible));
            }));
            // notify when extensions are registered with potentially new languages
            this._register(this.extensionService.onDidRegisterExtensions(() => this._widgets.forEach(widget => widget.notifyExtensionsRegistered())));
            // notify when model mode changes
            this._register(this.modelService.onModelModeChanged(e => {
                if (!e.model.uri) {
                    return; // we need the resource to compare
                }
                if (this.fileService.canHandleResource(e.model.uri) && e.oldModeId === modesRegistry_1.PLAINTEXT_MODE_ID) {
                    return; // ignore transitions in files from no mode to specific mode because this happens each time a model is created
                }
                this._widgets.forEach(widget => widget.notifyModelModeChanged(e.model));
            }));
            // notify when model is added
            this._register(this.modelService.onModelAdded(model => {
                if (!model.uri) {
                    return; // we need the resource to compare
                }
                this._widgets.forEach(widget => widget.notifyModelAdded(model));
            }));
            // notify when file decoration changes
            this._register(this.decorationsService.onDidChangeDecorations(e => this._widgets.forEach(widget => widget.notifyFileDecorationsChanges(e))));
            // notify when theme changes
            this._register(this.themeService.onThemeChange(() => this._widgets.forEach(widget => widget.notifyThemeChange())));
            // notify when files.associations changes
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(files_1.FILES_ASSOCIATIONS_CONFIG)) {
                    this._widgets.forEach(widget => widget.notifyFileAssociationsChange());
                }
            }));
            this._register(this.labelService.onDidChangeFormatters(() => {
                this._widgets.forEach(widget => widget.notifyFormattersChange());
            }));
        }
        get(index) {
            return this._labels[index];
        }
        create(container, options) {
            const widget = this.instantiationService.createInstance(ResourceLabelWidget, container, options);
            // Only expose a handle to the outside
            const label = {
                element: widget.element,
                onDidRender: widget.onDidRender,
                setLabel: (label, description, options) => widget.setLabel(label, description, options),
                setResource: (label, options) => widget.setResource(label, options),
                setEditor: (editor, options) => widget.setEditor(editor, options),
                setFile: (resource, options) => widget.setFile(resource, options),
                clear: () => widget.clear(),
                dispose: () => this.disposeWidget(widget)
            };
            // Store
            this._labels.push(label);
            this._widgets.push(widget);
            return label;
        }
        disposeWidget(widget) {
            const index = this._widgets.indexOf(widget);
            if (index > -1) {
                this._widgets.splice(index, 1);
                this._labels.splice(index, 1);
            }
            lifecycle_1.dispose(widget);
        }
        clear() {
            this._widgets = lifecycle_1.dispose(this._widgets);
            this._labels = [];
        }
        dispose() {
            super.dispose();
            this.clear();
        }
    };
    ResourceLabels = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, extensions_1.IExtensionService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, modelService_1.IModelService),
        __param(5, decorations_1.IDecorationsService),
        __param(6, themeService_1.IThemeService),
        __param(7, files_1.IFileService),
        __param(8, label_1.ILabelService)
    ], ResourceLabels);
    exports.ResourceLabels = ResourceLabels;
    /**
     * Note: please consider to use ResourceLabels if you are in need
     * of more than one label for your widget.
     */
    let ResourceLabel = class ResourceLabel extends ResourceLabels {
        constructor(container, options, instantiationService, extensionService, configurationService, modelService, decorationsService, themeService, fileService, labelService) {
            super(exports.DEFAULT_LABELS_CONTAINER, instantiationService, extensionService, configurationService, modelService, decorationsService, themeService, fileService, labelService);
            this._label = this._register(this.create(container, options));
        }
        get element() {
            return this._label;
        }
    };
    ResourceLabel = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, extensions_1.IExtensionService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, modelService_1.IModelService),
        __param(6, decorations_1.IDecorationsService),
        __param(7, themeService_1.IThemeService),
        __param(8, files_1.IFileService),
        __param(9, label_1.ILabelService)
    ], ResourceLabel);
    exports.ResourceLabel = ResourceLabel;
    var Redraw;
    (function (Redraw) {
        Redraw[Redraw["Basic"] = 1] = "Basic";
        Redraw[Redraw["Full"] = 2] = "Full";
    })(Redraw || (Redraw = {}));
    let ResourceLabelWidget = class ResourceLabelWidget extends iconLabel_1.IconLabel {
        constructor(container, options, modeService, modelService, decorationsService, labelService, untitledEditorService, contextService) {
            super(container, options);
            this.modeService = modeService;
            this.modelService = modelService;
            this.decorationsService = decorationsService;
            this.labelService = labelService;
            this.untitledEditorService = untitledEditorService;
            this.contextService = contextService;
            this._onDidRender = this._register(new event_1.Emitter());
            this.onDidRender = this._onDidRender.event;
            this.renderDisposables = this._register(new lifecycle_1.DisposableStore());
            this.isHidden = false;
        }
        notifyVisibilityChanged(visible) {
            if (visible === this.isHidden) {
                this.isHidden = !visible;
                if (visible && this.needsRedraw) {
                    this.render(this.needsRedraw === Redraw.Basic ? false : true);
                    this.needsRedraw = undefined;
                }
            }
        }
        notifyModelModeChanged(model) {
            this.handleModelEvent(model);
        }
        notifyModelAdded(model) {
            this.handleModelEvent(model);
        }
        handleModelEvent(model) {
            if (!this.label || !this.label.resource) {
                return; // only update if label exists
            }
            if (model.uri.toString() === this.label.resource.toString()) {
                if (this.lastKnownDetectedModeId !== model.getModeId()) {
                    this.render(true); // update if the language id of the model has changed from our last known state
                }
            }
        }
        notifyFileDecorationsChanges(e) {
            if (!this.options || !this.label || !this.label.resource) {
                return;
            }
            if (this.options.fileDecorations && e.affectsResource(this.label.resource)) {
                this.render(false);
            }
        }
        notifyExtensionsRegistered() {
            this.render(true);
        }
        notifyThemeChange() {
            this.render(false);
        }
        notifyFileAssociationsChange() {
            this.render(true);
        }
        notifyFormattersChange() {
            this.render(false);
        }
        setResource(label, options) {
            const hasPathLabelChanged = this.hasPathLabelChanged(label, options);
            const clearIconCache = this.clearIconCache(label, options);
            this.label = label;
            this.options = options;
            if (hasPathLabelChanged) {
                this.computedPathLabel = undefined; // reset path label due to resource change
            }
            this.render(clearIconCache);
        }
        clearIconCache(newLabel, newOptions) {
            const newResource = newLabel ? newLabel.resource : undefined;
            const oldResource = this.label ? this.label.resource : undefined;
            const newFileKind = newOptions ? newOptions.fileKind : undefined;
            const oldFileKind = this.options ? this.options.fileKind : undefined;
            if (newFileKind !== oldFileKind) {
                return true; // same resource but different kind (file, folder)
            }
            if (newResource && oldResource) {
                return newResource.toString() !== oldResource.toString();
            }
            if (!newResource && !oldResource) {
                return false;
            }
            return true;
        }
        hasPathLabelChanged(newLabel, newOptions) {
            const newResource = newLabel ? newLabel.resource : undefined;
            return !!newResource && this.computedPathLabel !== this.labelService.getUriLabel(newResource);
        }
        setEditor(editor, options) {
            this.setResource({
                resource: editor_1.toResource(editor, { supportSideBySide: editor_1.SideBySideEditor.MASTER }),
                name: types_1.withNullAsUndefined(editor.getName()),
                description: editor.getDescription(options ? options.descriptionVerbosity : undefined)
            }, options);
        }
        setFile(resource, options) {
            const hideLabel = options && options.hideLabel;
            let name;
            if (!hideLabel) {
                if (options && options.fileKind === files_1.FileKind.ROOT_FOLDER) {
                    const workspaceFolder = this.contextService.getWorkspaceFolder(resource);
                    if (workspaceFolder) {
                        name = workspaceFolder.name;
                    }
                }
                if (!name) {
                    name = resources.basenameOrAuthority(resource);
                }
            }
            let description;
            const hidePath = (options && options.hidePath) || (resource.scheme === network_1.Schemas.untitled && !this.untitledEditorService.hasAssociatedFilePath(resource));
            if (!hidePath) {
                description = this.labelService.getUriLabel(resources.dirname(resource), { relative: true });
            }
            this.setResource({ resource, name, description }, options);
        }
        clear() {
            this.label = undefined;
            this.options = undefined;
            this.lastKnownDetectedModeId = undefined;
            this.computedIconClasses = undefined;
            this.computedPathLabel = undefined;
            this.setLabel();
        }
        render(clearIconCache) {
            if (this.isHidden) {
                if (!this.needsRedraw) {
                    this.needsRedraw = clearIconCache ? Redraw.Full : Redraw.Basic;
                }
                if (this.needsRedraw === Redraw.Basic && clearIconCache) {
                    this.needsRedraw = Redraw.Full;
                }
                return;
            }
            if (this.label) {
                const detectedModeId = this.label.resource ? types_1.withNullAsUndefined(getIconClasses_1.detectModeId(this.modelService, this.modeService, this.label.resource)) : undefined;
                if (this.lastKnownDetectedModeId !== detectedModeId) {
                    clearIconCache = true;
                    this.lastKnownDetectedModeId = detectedModeId;
                }
            }
            if (clearIconCache) {
                this.computedIconClasses = undefined;
            }
            if (!this.label) {
                return;
            }
            this.renderDisposables.clear();
            const iconLabelOptions = {
                title: '',
                italic: this.options && this.options.italic,
                matches: this.options && this.options.matches,
                extraClasses: []
            };
            const resource = this.label.resource;
            const label = this.label.name;
            if (this.options && typeof this.options.title === 'string') {
                iconLabelOptions.title = this.options.title;
            }
            else if (resource && resource.scheme !== network_1.Schemas.data /* do not accidentally inline Data URIs */) {
                if (!this.computedPathLabel) {
                    this.computedPathLabel = this.labelService.getUriLabel(resource);
                }
                iconLabelOptions.title = this.computedPathLabel;
            }
            if (this.options && !this.options.hideIcon) {
                if (!this.computedIconClasses) {
                    this.computedIconClasses = getIconClasses_1.getIconClasses(this.modelService, this.modeService, resource, this.options && this.options.fileKind);
                }
                iconLabelOptions.extraClasses = this.computedIconClasses.slice(0);
            }
            if (this.options && this.options.extraClasses) {
                iconLabelOptions.extraClasses.push(...this.options.extraClasses);
            }
            if (this.options && this.options.fileDecorations && resource) {
                const deco = this.decorationsService.getDecoration(resource, this.options.fileKind !== files_1.FileKind.FILE);
                if (deco) {
                    this.renderDisposables.add(deco);
                    if (deco.tooltip) {
                        iconLabelOptions.title = `${iconLabelOptions.title} • ${deco.tooltip}`;
                    }
                    if (this.options.fileDecorations.colors) {
                        iconLabelOptions.extraClasses.push(deco.labelClassName);
                    }
                    if (this.options.fileDecorations.badges) {
                        iconLabelOptions.extraClasses.push(deco.badgeClassName);
                    }
                }
            }
            this.setLabel(label, this.label.description, iconLabelOptions);
            this._onDidRender.fire();
        }
        dispose() {
            super.dispose();
            this.label = undefined;
            this.options = undefined;
            this.lastKnownDetectedModeId = undefined;
            this.computedIconClasses = undefined;
            this.computedPathLabel = undefined;
        }
    };
    ResourceLabelWidget = __decorate([
        __param(2, modeService_1.IModeService),
        __param(3, modelService_1.IModelService),
        __param(4, decorations_1.IDecorationsService),
        __param(5, label_1.ILabelService),
        __param(6, untitledEditorService_1.IUntitledEditorService),
        __param(7, workspace_1.IWorkspaceContextService)
    ], ResourceLabelWidget);
});
//# sourceMappingURL=labels.js.map