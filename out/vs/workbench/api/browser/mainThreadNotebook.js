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
define(["require", "exports", "vs/workbench/api/common/extHostCustomers", "../common/extHost.protocol", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/contrib/notebook/browser/notebookService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/notebook/common/model/notebookTextModel", "vs/workbench/services/editor/common/editorService", "vs/platform/accessibility/common/accessibility"], function (require, exports, extHostCustomers_1, extHost_protocol_1, lifecycle_1, uri_1, notebookService_1, notebookCommon_1, configuration_1, notebookTextModel_1, editorService_1, accessibility_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadNotebookController = exports.MainThreadNotebooks = exports.MainThreadNotebookDocument = void 0;
    class MainThreadNotebookDocument extends lifecycle_1.Disposable {
        constructor(_proxy, handle, viewType, uri) {
            super();
            this._proxy = _proxy;
            this.handle = handle;
            this.viewType = viewType;
            this.uri = uri;
            this._textModel = new notebookTextModel_1.NotebookTextModel(handle, viewType, uri);
            this._register(this._textModel.onDidModelChange(e => {
                this._proxy.$acceptModelChanged(this.uri, e);
            }));
            this._register(this._textModel.onDidSelectionChange(e => {
                const selectionsChange = e ? { selections: e } : null;
                this._proxy.$acceptEditorPropertiesChanged(uri, { selections: selectionsChange });
            }));
        }
        get textModel() {
            return this._textModel;
        }
        applyEdit(modelVersionId, edits) {
            return this._textModel.applyEdit(modelVersionId, edits);
        }
        updateRenderers(renderers) {
            this._textModel.updateRenderers(renderers);
        }
        dispose() {
            this._textModel.dispose();
            super.dispose();
        }
    }
    exports.MainThreadNotebookDocument = MainThreadNotebookDocument;
    let MainThreadNotebooks = /** @class */ (() => {
        let MainThreadNotebooks = class MainThreadNotebooks extends lifecycle_1.Disposable {
            constructor(extHostContext, _notebookService, configurationService, editorService, accessibilityService) {
                super();
                this._notebookService = _notebookService;
                this.configurationService = configurationService;
                this.editorService = editorService;
                this.accessibilityService = accessibilityService;
                this._notebookProviders = new Map();
                this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostNotebook);
                this.registerListeners();
            }
            async $tryApplyEdits(viewType, resource, modelVersionId, edits, renderers) {
                let controller = this._notebookProviders.get(viewType);
                if (controller) {
                    return controller.tryApplyEdits(resource, modelVersionId, edits, renderers);
                }
                return false;
            }
            registerListeners() {
                this._register(this._notebookService.onDidChangeActiveEditor(e => {
                    this._proxy.$updateActiveEditor(e.viewType, e.uri);
                }));
                const updateOrder = () => {
                    let userOrder = this.configurationService.getValue('notebook.displayOrder');
                    this._proxy.$acceptDisplayOrder({
                        defaultOrder: this.accessibilityService.isScreenReaderOptimized() ? notebookCommon_1.ACCESSIBLE_NOTEBOOK_DISPLAY_ORDER : notebookCommon_1.NOTEBOOK_DISPLAY_ORDER,
                        userOrder: userOrder
                    });
                };
                updateOrder();
                this._register(this.configurationService.onDidChangeConfiguration(e => {
                    if (e.affectedKeys.indexOf('notebook.displayOrder') >= 0) {
                        updateOrder();
                    }
                }));
                this._register(this.accessibilityService.onDidChangeScreenReaderOptimized(() => {
                    updateOrder();
                }));
            }
            async $registerNotebookRenderer(extension, type, selectors, handle, preloads) {
                this._notebookService.registerNotebookRenderer(handle, extension, type, selectors, preloads.map(uri => uri_1.URI.revive(uri)));
            }
            async $unregisterNotebookRenderer(handle) {
                this._notebookService.unregisterNotebookRenderer(handle);
            }
            async $registerNotebookProvider(extension, viewType) {
                let controller = new MainThreadNotebookController(this._proxy, this, viewType);
                this._notebookProviders.set(viewType, controller);
                this._notebookService.registerNotebookController(viewType, extension, controller);
                return;
            }
            async $unregisterNotebookProvider(viewType) {
                this._notebookProviders.delete(viewType);
                this._notebookService.unregisterNotebookProvider(viewType);
                return;
            }
            async $createNotebookDocument(handle, viewType, resource) {
                let controller = this._notebookProviders.get(viewType);
                if (controller) {
                    controller.createNotebookDocument(handle, viewType, resource);
                }
                return;
            }
            async $updateNotebookLanguages(viewType, resource, languages) {
                let controller = this._notebookProviders.get(viewType);
                if (controller) {
                    controller.updateLanguages(resource, languages);
                }
            }
            async $updateNotebookMetadata(viewType, resource, metadata) {
                let controller = this._notebookProviders.get(viewType);
                if (controller) {
                    controller.updateNotebookMetadata(resource, metadata);
                }
            }
            async $updateNotebookCellMetadata(viewType, resource, handle, metadata) {
                let controller = this._notebookProviders.get(viewType);
                if (controller) {
                    controller.updateNotebookCellMetadata(resource, handle, metadata);
                }
            }
            async resolveNotebook(viewType, uri) {
                let handle = await this._proxy.$resolveNotebook(viewType, uri);
                return handle;
            }
            async $spliceNotebookCellOutputs(viewType, resource, cellHandle, splices, renderers) {
                let controller = this._notebookProviders.get(viewType);
                controller === null || controller === void 0 ? void 0 : controller.spliceNotebookCellOutputs(resource, cellHandle, splices, renderers);
            }
            async executeNotebook(viewType, uri, token) {
                return this._proxy.$executeNotebook(viewType, uri, undefined, token);
            }
            async $postMessage(handle, value) {
                var _a;
                const activeEditorPane = this.editorService.activeEditorPane;
                if (activeEditorPane === null || activeEditorPane === void 0 ? void 0 : activeEditorPane.isNotebookEditor) {
                    const notebookEditor = activeEditorPane;
                    if (((_a = notebookEditor.viewModel) === null || _a === void 0 ? void 0 : _a.handle) === handle) {
                        notebookEditor.postMessage(value);
                        return true;
                    }
                }
                return false;
            }
        };
        MainThreadNotebooks = __decorate([
            extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadNotebook),
            __param(1, notebookService_1.INotebookService),
            __param(2, configuration_1.IConfigurationService),
            __param(3, editorService_1.IEditorService),
            __param(4, accessibility_1.IAccessibilityService)
        ], MainThreadNotebooks);
        return MainThreadNotebooks;
    })();
    exports.MainThreadNotebooks = MainThreadNotebooks;
    class MainThreadNotebookController {
        constructor(_proxy, _mainThreadNotebook, _viewType) {
            this._proxy = _proxy;
            this._mainThreadNotebook = _mainThreadNotebook;
            this._viewType = _viewType;
            this._mapping = new Map();
        }
        async resolveNotebook(viewType, uri) {
            // TODO: resolve notebook should wait for all notebook document destory operations to finish.
            let mainthreadNotebook = this._mapping.get(uri_1.URI.from(uri).toString());
            if (mainthreadNotebook) {
                return mainthreadNotebook.textModel;
            }
            let notebookHandle = await this._mainThreadNotebook.resolveNotebook(viewType, uri);
            if (notebookHandle !== undefined) {
                mainthreadNotebook = this._mapping.get(uri_1.URI.from(uri).toString());
                if (mainthreadNotebook && mainthreadNotebook.textModel.cells.length === 0) {
                    // it's empty, we should create an empty template one
                    const mainCell = mainthreadNotebook.textModel.createCellTextModel([''], mainthreadNotebook.textModel.languages.length ? mainthreadNotebook.textModel.languages[0] : '', notebookCommon_1.CellKind.Code, [], undefined);
                    mainthreadNotebook.textModel.insertTemplateCell(mainCell);
                }
                return mainthreadNotebook === null || mainthreadNotebook === void 0 ? void 0 : mainthreadNotebook.textModel;
            }
            return undefined;
        }
        async tryApplyEdits(resource, modelVersionId, edits, renderers) {
            let mainthreadNotebook = this._mapping.get(uri_1.URI.from(resource).toString());
            if (mainthreadNotebook) {
                mainthreadNotebook.updateRenderers(renderers);
                return mainthreadNotebook.applyEdit(modelVersionId, edits);
            }
            return false;
        }
        spliceNotebookCellOutputs(resource, cellHandle, splices, renderers) {
            let mainthreadNotebook = this._mapping.get(uri_1.URI.from(resource).toString());
            mainthreadNotebook === null || mainthreadNotebook === void 0 ? void 0 : mainthreadNotebook.textModel.updateRenderers(renderers);
            mainthreadNotebook === null || mainthreadNotebook === void 0 ? void 0 : mainthreadNotebook.textModel.$spliceNotebookCellOutputs(cellHandle, splices);
        }
        async executeNotebook(viewType, uri, token) {
            this._mainThreadNotebook.executeNotebook(viewType, uri, token);
        }
        onDidReceiveMessage(uri, message) {
            this._proxy.$onDidReceiveMessage(uri, message);
        }
        // Methods for ExtHost
        async createNotebookDocument(handle, viewType, resource) {
            let document = new MainThreadNotebookDocument(this._proxy, handle, viewType, uri_1.URI.revive(resource));
            this._mapping.set(uri_1.URI.revive(resource).toString(), document);
        }
        updateLanguages(resource, languages) {
            let document = this._mapping.get(uri_1.URI.from(resource).toString());
            document === null || document === void 0 ? void 0 : document.textModel.updateLanguages(languages);
        }
        updateNotebookMetadata(resource, metadata) {
            let document = this._mapping.get(uri_1.URI.from(resource).toString());
            document === null || document === void 0 ? void 0 : document.textModel.updateNotebookMetadata(metadata);
        }
        updateNotebookCellMetadata(resource, handle, metadata) {
            let document = this._mapping.get(uri_1.URI.from(resource).toString());
            document === null || document === void 0 ? void 0 : document.textModel.updateNotebookCellMetadata(handle, metadata);
        }
        updateNotebookRenderers(resource, renderers) {
            let document = this._mapping.get(uri_1.URI.from(resource).toString());
            document === null || document === void 0 ? void 0 : document.textModel.updateRenderers(renderers);
        }
        async executeNotebookCell(uri, handle, token) {
            return this._proxy.$executeNotebook(this._viewType, uri, handle, token);
        }
        async destoryNotebookDocument(notebook) {
            let document = this._mapping.get(uri_1.URI.from(notebook.uri).toString());
            if (!document) {
                return;
            }
            let removeFromExtHost = await this._proxy.$destoryNotebookDocument(this._viewType, notebook.uri);
            if (removeFromExtHost) {
                document.dispose();
                this._mapping.delete(uri_1.URI.from(notebook.uri).toString());
            }
        }
        async save(uri) {
            return this._proxy.$saveNotebook(this._viewType, uri);
        }
    }
    exports.MainThreadNotebookController = MainThreadNotebookController;
});
//# sourceMappingURL=mainThreadNotebook.js.map