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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/glob", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uuid", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/quickinput/common/quickInput", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/common/editor", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/contrib/customEditor/browser/extensionPoint", "vs/workbench/contrib/customEditor/common/customEditor", "vs/workbench/contrib/files/common/editors/fileEditorInput", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/services/editor/common/editorService", "./customEditorInput"], function (require, exports, arrays_1, glob, lifecycle_1, network_1, resources_1, types_1, uuid_1, nls, configuration_1, instantiation_1, quickInput_1, colorRegistry, themeService_1, editor_1, diffEditorInput_1, extensionPoint_1, customEditor_1, fileEditorInput_1, webview_1, editorService_1, customEditorInput_1) {
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
    let CustomEditorService = class CustomEditorService {
        constructor(configurationService, editorService, instantiationService, quickInputService, webviewService) {
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
            });
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
            const pick = await this.quickInputService.pick(customEditors.map((editorDescriptor) => ({
                label: editorDescriptor.displayName,
                id: editorDescriptor.id,
            })), {
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
            const webview = this.webviewService.createWebviewEditorOverlay(id, { customClasses: options ? options.customClasses : undefined }, {});
            const input = this.instantiationService.createInstance(customEditorInput_1.CustomFileEditorInput, resource, viewType, id, new lifecycle_1.UnownedDisposable(webview));
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
    };
    CustomEditorService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, editorService_1.IEditorService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, webview_1.IWebviewService)
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
            const contributedEditors = this.customEditorService.getContributedCustomEditors(resource);
            if (!userConfiguredEditors.length) {
                if (!contributedEditors.length) {
                    return;
                }
                const defaultEditors = contributedEditors.filter(editor => editor.priority === "default" /* default */);
                if (defaultEditors.length === 1) {
                    return {
                        override: this.customEditorService.openWith(resource, defaultEditors[0].id, options, group),
                    };
                }
            }
            for (const input of group.editors) {
                if (input instanceof customEditorInput_1.CustomFileEditorInput && resources_1.isEqual(input.getResource(), resource)) {
                    return {
                        override: group.openEditor(input, options).then(types_1.withNullAsUndefined)
                    };
                }
            }
            if (userConfiguredEditors.length) {
                return {
                    override: this.customEditorService.openWith(resource, userConfiguredEditors[0].id, options, group),
                };
            }
            // Open default editor but prompt user to see if they wish to use a custom one instead
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
                const editors = arrays_1.distinct([
                    ...this.customEditorService.getUserConfiguredCustomEditors(resource),
                    ...this.customEditorService.getContributedCustomEditors(resource),
                ], editor => editor.id);
                if (!editors.length) {
                    return undefined;
                }
                // Always prefer the first editor in the diff editor case
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