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
define(["require", "exports", "vs/base/common/map", "vs/base/common/marshalling", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/workbench/browser/editor", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/contrib/notebook/browser/notebookEditor", "vs/workbench/contrib/notebook/browser/notebookEditorInput", "vs/workbench/contrib/notebook/browser/notebookService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/services/editor/common/editorService", "vs/platform/configuration/common/configuration", "vs/workbench/services/editor/common/editorAssociationsSetting", "vs/base/common/arrays", "vs/workbench/contrib/customEditor/common/customEditor", "vs/workbench/contrib/notebook/browser/contrib/coreActions", "vs/workbench/contrib/notebook/browser/contrib/find/findController", "vs/workbench/contrib/notebook/browser/contrib/fold/folding", "vs/workbench/contrib/notebook/browser/contrib/format/formatting", "vs/workbench/contrib/notebook/browser/contrib/toc/tocProvider", "vs/workbench/contrib/notebook/browser/view/output/transforms/streamTransform", "vs/workbench/contrib/notebook/browser/view/output/transforms/errorTransform", "vs/workbench/contrib/notebook/browser/view/output/transforms/richTransform"], function (require, exports, map_1, marshalling_1, resources_1, types_1, uri_1, modelService_1, modeService_1, resolverService_1, nls, configurationRegistry_1, descriptors_1, extensions_1, instantiation_1, platform_1, editor_1, contributions_1, editor_2, notebookEditor_1, notebookEditorInput_1, notebookService_1, notebookCommon_1, editorService_1, configuration_1, editorAssociationsSetting_1, arrays_1, customEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookContribution = void 0;
    /*--------------------------------------------------------------------------------------------- */
    platform_1.Registry.as(editor_1.Extensions.Editors).registerEditor(editor_1.EditorDescriptor.create(notebookEditor_1.NotebookEditor, notebookEditor_1.NotebookEditor.ID, 'Notebook Editor'), [
        new descriptors_1.SyncDescriptor(notebookEditorInput_1.NotebookEditorInput)
    ]);
    platform_1.Registry.as(editor_2.Extensions.EditorInputFactories).registerEditorInputFactory(notebookEditorInput_1.NotebookEditorInput.ID, class {
        canSerialize() {
            return true;
        }
        serialize(input) {
            types_1.assertType(input instanceof notebookEditorInput_1.NotebookEditorInput);
            return JSON.stringify({
                resource: input.resource,
                name: input.name,
                viewType: input.viewType,
            });
        }
        deserialize(instantiationService, raw) {
            const data = marshalling_1.parse(raw);
            if (!data) {
                return undefined;
            }
            const { resource, name, viewType } = data;
            if (!data || !uri_1.URI.isUri(resource) || typeof name !== 'string' || typeof viewType !== 'string') {
                return undefined;
            }
            return notebookEditorInput_1.NotebookEditorInput.getOrCreate(instantiationService, resource, name, viewType);
        }
    });
    function getFirstNotebookInfo(notebookService, uri) {
        return notebookService.getContributedNotebookProviders(uri)[0];
    }
    let NotebookContribution = /** @class */ (() => {
        let NotebookContribution = class NotebookContribution {
            constructor(editorService, notebookService, instantiationService, configurationService) {
                this.editorService = editorService;
                this.notebookService = notebookService;
                this.instantiationService = instantiationService;
                this.configurationService = configurationService;
                this._resourceMapping = new map_1.ResourceMap();
                this.editorService.overrideOpenEditor({
                    getEditorOverrides: (resource, options, group) => {
                        const currentEditorForResource = group === null || group === void 0 ? void 0 : group.editors.find(editor => resources_1.isEqual(editor.resource, resource));
                        const associatedEditors = arrays_1.distinct([
                            ...this.getUserAssociatedNotebookEditors(resource),
                            ...this.getContributedEditors(resource)
                        ], editor => editor.id);
                        return associatedEditors.map(info => {
                            return {
                                label: info.displayName,
                                id: info.id,
                                active: currentEditorForResource instanceof notebookEditorInput_1.NotebookEditorInput && currentEditorForResource.viewType === info.id,
                                detail: info.providerDisplayName
                            };
                        });
                    },
                    open: (editor, options, group, id) => this.onEditorOpening(editor, options, group, id)
                });
                this.editorService.onDidActiveEditorChange(() => {
                    if (this.editorService.activeEditor && this.editorService.activeEditor instanceof notebookEditorInput_1.NotebookEditorInput) {
                        let editorInput = this.editorService.activeEditor;
                        this.notebookService.updateActiveNotebookDocument(editorInput.viewType, editorInput.resource);
                    }
                });
            }
            getUserAssociatedEditors(resource) {
                const rawAssociations = this.configurationService.getValue(editorAssociationsSetting_1.customEditorsAssociationsSettingId) || [];
                return arrays_1.coalesce(rawAssociations
                    .filter(association => customEditor_1.CustomEditorInfo.selectorMatches(association, resource)));
            }
            getUserAssociatedNotebookEditors(resource) {
                const rawAssociations = this.configurationService.getValue(editorAssociationsSetting_1.customEditorsAssociationsSettingId) || [];
                return arrays_1.coalesce(rawAssociations
                    .filter(association => customEditor_1.CustomEditorInfo.selectorMatches(association, resource))
                    .map(association => this.notebookService.getContributedNotebookProvider(association.viewType)));
            }
            getContributedEditors(resource) {
                return this.notebookService.getContributedNotebookProviders(resource);
            }
            onEditorOpening(originalInput, options, group, id) {
                let resource = originalInput.resource;
                if (!resource) {
                    return undefined;
                }
                if (id === undefined) {
                    const existingEditors = group.editors.filter(editor => editor.resource && resources_1.isEqual(editor.resource, resource) && !(editor instanceof notebookEditorInput_1.NotebookEditorInput));
                    if (existingEditors.length) {
                        return undefined;
                    }
                    const userAssociatedEditors = this.getUserAssociatedEditors(resource);
                    const notebookEditor = userAssociatedEditors.filter(association => this.notebookService.getContributedNotebookProvider(association.viewType));
                    if (userAssociatedEditors.length && !notebookEditor.length) {
                        // user pick a non-notebook editor for this resource
                        return undefined;
                    }
                }
                if (this._resourceMapping.has(resource)) {
                    const input = this._resourceMapping.get(resource);
                    if (!input.isDisposed()) {
                        return { override: this.editorService.openEditor(input, new notebookEditor_1.NotebookEditorOptions(options || {}).with({ ignoreOverrides: true }), group) };
                    }
                }
                let info;
                const data = notebookCommon_1.CellUri.parse(resource);
                if (data) {
                    const infos = this.getContributedEditors(data.notebook);
                    if (infos.length) {
                        const info = id === undefined ? infos[0] : (infos.find(info => info.id === id) || infos[0]);
                        // cell-uri -> open (container) notebook
                        const name = resources_1.basename(data.notebook);
                        let input = this._resourceMapping.get(data.notebook);
                        if (!input || input.isDisposed()) {
                            input = notebookEditorInput_1.NotebookEditorInput.getOrCreate(this.instantiationService, data.notebook, name, info.id);
                            this._resourceMapping.set(data.notebook, input);
                        }
                        return { override: this.editorService.openEditor(input, new notebookEditor_1.NotebookEditorOptions(Object.assign(Object.assign({}, options), { forceReload: true, cellOptions: { resource, options } })), group) };
                    }
                }
                const infos = this.notebookService.getContributedNotebookProviders(resource);
                info = id === undefined ? infos[0] : infos.find(info => info.id === id);
                if (!info) {
                    return undefined;
                }
                const input = notebookEditorInput_1.NotebookEditorInput.getOrCreate(this.instantiationService, resource, originalInput.getName(), info.id);
                this._resourceMapping.set(resource, input);
                return { override: this.editorService.openEditor(input, options, group) };
            }
        };
        NotebookContribution = __decorate([
            __param(0, editorService_1.IEditorService),
            __param(1, notebookService_1.INotebookService),
            __param(2, instantiation_1.IInstantiationService),
            __param(3, configuration_1.IConfigurationService)
        ], NotebookContribution);
        return NotebookContribution;
    })();
    exports.NotebookContribution = NotebookContribution;
    let CellContentProvider = /** @class */ (() => {
        let CellContentProvider = class CellContentProvider {
            constructor(textModelService, _modelService, _modeService, _notebookService) {
                this._modelService = _modelService;
                this._modeService = _modeService;
                this._notebookService = _notebookService;
                this._registration = textModelService.registerTextModelContentProvider('vscode-notebook', this);
            }
            dispose() {
                this._registration.dispose();
            }
            async provideTextContent(resource) {
                const existing = this._modelService.getModel(resource);
                if (existing) {
                    return existing;
                }
                const data = notebookCommon_1.CellUri.parse(resource);
                // const data = parseCellUri(resource);
                if (!data) {
                    return null;
                }
                const info = getFirstNotebookInfo(this._notebookService, data.notebook);
                if (!info) {
                    return null;
                }
                const notebook = await this._notebookService.resolveNotebook(info.id, data.notebook);
                if (!notebook) {
                    return null;
                }
                for (let cell of notebook.cells) {
                    if (cell.uri.toString() === resource.toString()) {
                        const bufferFactory = cell.resolveTextBufferFactory();
                        const language = cell.cellKind === notebookCommon_1.CellKind.Markdown ? this._modeService.create('markdown') : (cell.language ? this._modeService.create(cell.language) : this._modeService.createByFilepathOrFirstLine(resource, cell.source[0]));
                        return this._modelService.createModel(bufferFactory, language, resource);
                    }
                }
                return null;
            }
        };
        CellContentProvider = __decorate([
            __param(0, resolverService_1.ITextModelService),
            __param(1, modelService_1.IModelService),
            __param(2, modeService_1.IModeService),
            __param(3, notebookService_1.INotebookService)
        ], CellContentProvider);
        return CellContentProvider;
    })();
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(NotebookContribution, 1 /* Starting */);
    workbenchContributionsRegistry.registerWorkbenchContribution(CellContentProvider, 1 /* Starting */);
    extensions_1.registerSingleton(notebookService_1.INotebookService, notebookService_1.NotebookService);
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        id: 'notebook',
        order: 100,
        title: nls.localize('notebookConfigurationTitle', "Notebook"),
        type: 'object',
        properties: {
            'notebook.displayOrder': {
                markdownDescription: nls.localize('notebook.displayOrder.description', "Priority list for output mime types"),
                type: ['array'],
                items: {
                    type: 'string'
                },
                default: []
            }
        }
    });
});
//# sourceMappingURL=notebook.contribution.js.map