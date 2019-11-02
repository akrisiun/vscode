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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/glob", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uuid", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/quickinput/common/quickInput", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/common/editor", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/contrib/customEditor/browser/extensionPoint", "vs/workbench/contrib/customEditor/common/customEditor", "vs/workbench/contrib/files/common/editors/fileEditorInput", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/services/editor/common/editorService", "./customEditorInput", "vs/platform/contextkey/common/contextkey", "vs/base/common/lazy"], function (require, exports, arrays_1, glob, lifecycle_1, network_1, resources_1, uuid_1, nls, configuration_1, instantiation_1, quickInput_1, colorRegistry, themeService_1, editor_1, diffEditorInput_1, extensionPoint_1, customEditor_1, fileEditorInput_1, webview_1, editorService_1, customEditorInput_1, contextkey_1, lazy_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const defaultEditorId = 'default';
    const defaultEditorInfo = {
        id: defaultEditorId,
        displayName: nls.localize('promptOpenWith.defaultEditor', "VS Code's standard text editor"),
        selector: [
            { filenamePattern: '*' }
        ],
        priority: "default" /* default */,
    };
    class CustomEditorStore {
        constructor() {
            this.contributedEditors = new Map();
        }
        clear() {
            this.contributedEditors.clear();
        }
        get(viewType) {
            return viewType === defaultEditorId
                ? defaultEditorInfo
                : this.contributedEditors.get(viewType);
        }
        add(info) {
            if (info.id === defaultEditorId || this.contributedEditors.has(info.id)) {
                console.log(`Custom editor with id '${info.id}' already registered`);
                return;
            }
            this.contributedEditors.set(info.id, info);
        }
        getContributedEditors(resource) {
            return Array.from(this.contributedEditors.values()).filter(customEditor => customEditor.selector.some(selector => matches(selector, resource)));
        }
    }
    exports.CustomEditorStore = CustomEditorStore;
    let CustomEditorService = class CustomEditorService extends lifecycle_1.Disposable {
        constructor(contextKeyService, configurationService, editorService, instantiationService, quickInputService, webviewService) {
            super();
            this.configurationService = configurationService;
            this.editorService = editorService;
            this.instantiationService = instantiationService;
            this.quickInputService = quickInputService;
            this.webviewService = webviewService;
            this.editors = new CustomEditorStore();
            extensionPoint_1.webviewEditorsExtensionPoint.setHandler(extensions => {
                this.editors.clear();
                for (const extension of extensions) {
                    for (const webviewEditorContribution of extension.value) {
                        this.editors.add({
                            id: webviewEditorContribution.viewType,
                            displayName: webviewEditorContribution.displayName,
                            selector: webviewEditorContribution.selector || [],
                            priority: webviewEditorContribution.priority || "default" /* default */,
                        });
                    }
                }
                this.updateContext();
            });
            this._hasCustomEditor = customEditor_1.CONTEXT_HAS_CUSTOM_EDITORS.bindTo(contextKeyService);
            this._register(this.editorService.onDidActiveEditorChange(() => this.updateContext()));
            this.updateContext();
        }
        getContributedCustomEditors(resource) {
            return this.editors.getContributedEditors(resource);
        }
        getUserConfiguredCustomEditors(resource) {
            const rawAssociations = this.configurationService.getValue(exports.customEditorsAssociationsKey) || [];
            return arrays_1.coalesce(rawAssociations
                .filter(association => matches(association, resource))
                .map(association => this.editors.get(association.viewType)));
        }
        async promptOpenWith(resource, options, group) {
            const customEditors = arrays_1.distinct([
                defaultEditorInfo,
                ...this.getUserConfiguredCustomEditors(resource),
                ...this.getContributedCustomEditors(resource),
            ], editor => editor.id);
            let currentlyOpenedEditorType;
            for (const editor of group ? group.editors : []) {
                if (editor.getResource() && resources_1.isEqual(editor.getResource(), resource)) {
                    currentlyOpenedEditorType = editor instanceof customEditorInput_1.CustomFileEditorInput ? editor.viewType : defaultEditorId;
                    break;
                }
            }
            const items = customEditors.map((editorDescriptor) => ({
                label: editorDescriptor.displayName,
                id: editorDescriptor.id,
                description: editorDescriptor.id === currentlyOpenedEditorType
                    ? nls.localize('openWithCurrentlyActive', "Currently Active")
                    : undefined
            }));
            const pick = await this.quickInputService.pick(items, {
                placeHolder: nls.localize('promptOpenWith.placeHolder', "Select editor to use for '{0}'...", resources_1.basename(resource)),
            });
            if (!pick || !pick.id) {
                return;
            }
            return this.openWith(resource, pick.id, options, group);
        }
        openWith(resource, viewType, options, group) {
            if (viewType === defaultEditorId) {
                const fileInput = this.instantiationService.createInstance(fileEditorInput_1.FileEditorInput, resource, undefined, undefined);
                return this.openEditorForResource(resource, fileInput, Object.assign(Object.assign({}, options), { ignoreOverrides: true }), group);
            }
            if (!this.editors.get(viewType)) {
                return this.promptOpenWith(resource, options, group);
            }
            const input = this.createInput(resource, viewType, group);
            return this.openEditorForResource(resource, input, options, group);
        }
        createInput(resource, viewType, group, options) {
            const id = uuid_1.generateUuid();
            const webview = new lazy_1.Lazy(() => {
                var _a;
                return new lifecycle_1.UnownedDisposable(this.webviewService.createWebviewEditorOverlay(id, { customClasses: (_a = options) === null || _a === void 0 ? void 0 : _a.customClasses }, {}));
            });
            const input = this.instantiationService.createInstance(customEditorInput_1.CustomFileEditorInput, resource, viewType, id, webview);
            if (group) {
                input.updateGroup(group.id);
            }
            return input;
        }
        async openEditorForResource(resource, input, options, group) {
            if (group) {
                const existingEditors = group.editors.filter(editor => editor.getResource() && resources_1.isEqual(editor.getResource(), resource));
                if (existingEditors.length) {
                    const existing = existingEditors[0];
                    if (!input.matches(existing)) {
                        await this.editorService.replaceEditors([{
                                editor: existing,
                                replacement: input,
                                options: options ? editor_1.EditorOptions.create(options) : undefined,
                            }], group);
                        if (existing instanceof customEditorInput_1.CustomFileEditorInput) {
                            existing.dispose();
                        }
                    }
                }
            }
            return this.editorService.openEditor(input, options, group);
        }
        updateContext() {
            const activeControl = this.editorService.activeControl;
            if (!activeControl) {
                this._hasCustomEditor.reset();
                return;
            }
            const resource = activeControl.input.getResource();
            if (!resource) {
                this._hasCustomEditor.reset();
                return;
            }
            const possibleEditors = [
                ...this.getContributedCustomEditors(resource),
                ...this.getUserConfiguredCustomEditors(resource),
            ];
            this._hasCustomEditor.set(possibleEditors.length > 0);
        }
    };
    CustomEditorService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, editorService_1.IEditorService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, webview_1.IWebviewService)
    ], CustomEditorService);
    exports.CustomEditorService = CustomEditorService;
    exports.customEditorsAssociationsKey = 'workbench.experimental.editorAssociations';
    let CustomEditorContribution = class CustomEditorContribution {
        constructor(editorService, customEditorService) {
            this.editorService = editorService;
            this.customEditorService = customEditorService;
            this.editorService.overrideOpenEditor((editor, options, group) => this.onEditorOpening(editor, options, group));
        }
        onEditorOpening(editor, options, group) {
            if (editor instanceof customEditorInput_1.CustomFileEditorInput) {
                if (editor.group === group.id) {
                    return undefined;
                }
            }
            if (editor instanceof diffEditorInput_1.DiffEditorInput) {
                return this.onDiffEditorOpening(editor, options, group);
            }
            const resource = editor.getResource();
            if (resource) {
                return this.onResourceEditorOpening(resource, editor, options, group);
            }
            return undefined;
        }
        onResourceEditorOpening(resource, editor, options, group) {
            const userConfiguredEditors = this.customEditorService.getUserConfiguredCustomEditors(resource);
            if (userConfiguredEditors.length) {
                return {
                    override: this.customEditorService.openWith(resource, userConfiguredEditors[0].id, options, group),
                };
            }
            const contributedEditors = this.customEditorService.getContributedCustomEditors(resource);
            if (!contributedEditors.length) {
                return;
            }
            // Find the single default editor to use (if any) by looking at the editor's priority and the
            // other contributed editors.
            const defaultEditor = arrays_1.find(contributedEditors, editor => {
                if (editor.priority !== "default" /* default */ && editor.priority !== "builtin" /* builtin */) {
                    return false;
                }
                return contributedEditors.every(otherEditor => otherEditor === editor || isLowerPriority(otherEditor, editor));
            });
            if (defaultEditor) {
                return {
                    override: this.customEditorService.openWith(resource, defaultEditor.id, options, group),
                };
            }
            // Open VS Code's standard editor but prompt user to see if they wish to use a custom one instead
            return {
                override: (async () => {
                    const standardEditor = await this.editorService.openEditor(editor, Object.assign(Object.assign({}, options), { ignoreOverrides: true }), group);
                    const selectedEditor = await this.customEditorService.promptOpenWith(resource, options, group);
                    if (selectedEditor && selectedEditor.input) {
                        await group.replaceEditors([{
                                editor,
                                replacement: selectedEditor.input
                            }]);
                        return selectedEditor;
                    }
                    return standardEditor;
                })()
            };
        }
        onDiffEditorOpening(editor, options, group) {
            const getCustomEditorOverrideForSubInput = (subInput, customClasses) => {
                if (subInput instanceof customEditorInput_1.CustomFileEditorInput) {
                    return undefined;
                }
                const resource = subInput.getResource();
                if (!resource) {
                    return undefined;
                }
                // Prefer default editors in the diff editor case but ultimatly always take the first editor
                const editors = arrays_1.mergeSort(arrays_1.distinct([
                    ...this.customEditorService.getUserConfiguredCustomEditors(resource),
                    ...this.customEditorService.getContributedCustomEditors(resource),
                ], editor => editor.id), (a, b) => {
                    return priorityToRank(a.priority) - priorityToRank(b.priority);
                });
                if (!editors.length) {
                    return undefined;
                }
                return this.customEditorService.createInput(resource, editors[0].id, group, { customClasses });
            };
            const modifiedOverride = getCustomEditorOverrideForSubInput(editor.modifiedInput, 'modified');
            const originalOverride = getCustomEditorOverrideForSubInput(editor.originalInput, 'original');
            if (modifiedOverride || originalOverride) {
                return {
                    override: (async () => {
                        const input = new diffEditorInput_1.DiffEditorInput(editor.getName(), editor.getDescription(), originalOverride || editor.originalInput, modifiedOverride || editor.modifiedInput);
                        return this.editorService.openEditor(input, Object.assign(Object.assign({}, options), { ignoreOverrides: true }), group);
                    })(),
                };
            }
            return undefined;
        }
    };
    CustomEditorContribution = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, customEditor_1.ICustomEditorService)
    ], CustomEditorContribution);
    exports.CustomEditorContribution = CustomEditorContribution;
    function isLowerPriority(otherEditor, editor) {
        return priorityToRank(otherEditor.priority) < priorityToRank(editor.priority);
    }
    function priorityToRank(priority) {
        switch (priority) {
            case "default" /* default */: return 3;
            case "builtin" /* builtin */: return 2;
            case "option" /* option */: return 1;
        }
    }
    function matches(selector, resource) {
        if (resource.scheme === network_1.Schemas.data) {
            if (!selector.mime) {
                return false;
            }
            const metadata = resources_1.DataUri.parseMetaData(resource);
            const mime = metadata.get(resources_1.DataUri.META_DATA_MIME);
            if (!mime) {
                return false;
            }
            return glob.match(selector.mime, mime.toLowerCase());
        }
        if (selector.filenamePattern) {
            if (glob.match(selector.filenamePattern.toLowerCase(), resources_1.basename(resource).toLowerCase())) {
                return true;
            }
        }
        return false;
    }
    themeService_1.registerThemingParticipant((theme, collector) => {
        const shadow = theme.getColor(colorRegistry.scrollbarShadow);
        if (shadow) {
            collector.addRule(`.webview.modified { box-shadow: -6px 0 5px -5px ${shadow}; }`);
        }
    });
});
//# sourceMappingURL=customEditors.js.map