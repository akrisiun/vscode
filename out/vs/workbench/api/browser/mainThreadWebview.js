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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/uri", "vs/nls", "vs/platform/opener/common/opener", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/shared/editor", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/contrib/customEditor/browser/customEditorInput", "vs/workbench/contrib/webview/browser/webviewEditorInput", "vs/workbench/contrib/webview/browser/webviewEditorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions", "../common/extHostCustomers"], function (require, exports, errors_1, lifecycle_1, platform_1, strings_1, uri_1, nls_1, opener_1, productService_1, telemetry_1, extHost_protocol_1, editor_1, diffEditorInput_1, customEditorInput_1, webviewEditorInput_1, webviewEditorService_1, editorGroupsService_1, editorService_1, extensions_1, extHostCustomers_1) {
    "use strict";
    var MainThreadWebviews_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    "use strict";
    /**
     * Bi-directional map between webview handles and inputs.
     */
    class WebviewHandleStore {
        constructor() {
            this._handlesToInputs = new Map();
            this._inputsToHandles = new Map();
        }
        add(handle, input) {
            this._handlesToInputs.set(handle, input);
            this._inputsToHandles.set(input, handle);
        }
        getHandleForInput(input) {
            return this._inputsToHandles.get(input);
        }
        getInputForHandle(handle) {
            return this._handlesToInputs.get(handle);
        }
        delete(handle) {
            const input = this.getInputForHandle(handle);
            this._handlesToInputs.delete(handle);
            if (input) {
                this._inputsToHandles.delete(input);
            }
        }
        get size() {
            return this._handlesToInputs.size;
        }
    }
    let MainThreadWebviews = MainThreadWebviews_1 = class MainThreadWebviews extends lifecycle_1.Disposable {
        constructor(context, extensionService, _editorGroupService, _editorService, _webviewEditorService, _openerService, _telemetryService, _productService) {
            super();
            this._editorGroupService = _editorGroupService;
            this._editorService = _editorService;
            this._webviewEditorService = _webviewEditorService;
            this._openerService = _openerService;
            this._telemetryService = _telemetryService;
            this._productService = _productService;
            this._webviewEditorInputs = new WebviewHandleStore();
            this._revivers = new Map();
            this._editorProviders = new Map();
            this._proxy = context.getProxy(extHost_protocol_1.ExtHostContext.ExtHostWebviews);
            this._register(_editorService.onDidActiveEditorChange(this.updateWebviewViewStates, this));
            this._register(_editorService.onDidVisibleEditorsChange(this.updateWebviewViewStates, this));
            // This reviver's only job is to activate webview panel extensions
            // This should trigger the real reviver to be registered from the extension host side.
            this._register(_webviewEditorService.registerResolver({
                canResolve: (webview) => {
                    if (webview.getTypeId() === customEditorInput_1.CustomFileEditorInput.typeId) {
                        extensionService.activateByEvent(`onWebviewEditor:${webview.viewType}`);
                        return false;
                    }
                    const viewType = this.fromInternalWebviewViewType(webview.viewType);
                    if (typeof viewType === 'string') {
                        extensionService.activateByEvent(`onWebviewPanel:${viewType}`);
                    }
                    return false;
                },
                resolveWebview: () => { throw new Error('not implemented'); }
            }));
        }
        $createWebviewPanel(handle, viewType, title, showOptions, options, extensionId, extensionLocation) {
            const mainThreadShowOptions = Object.create(null);
            if (showOptions) {
                mainThreadShowOptions.preserveFocus = !!showOptions.preserveFocus;
                mainThreadShowOptions.group = editor_1.viewColumnToEditorGroup(this._editorGroupService, showOptions.viewColumn);
            }
            const webview = this._webviewEditorService.createWebview(handle, this.getInternalWebviewViewType(viewType), title, mainThreadShowOptions, reviveWebviewOptions(options), {
                location: uri_1.URI.revive(extensionLocation),
                id: extensionId
            });
            this.hookupWebviewEventDelegate(handle, webview);
            this._webviewEditorInputs.add(handle, webview);
            /* __GDPR__
                "webviews:createWebviewPanel" : {
                    "extensionId" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            this._telemetryService.publicLog('webviews:createWebviewPanel', { extensionId: extensionId.value });
        }
        $disposeWebview(handle) {
            const webview = this.getWebviewEditorInput(handle);
            webview.dispose();
        }
        $setTitle(handle, value) {
            const webview = this.getWebviewEditorInput(handle);
            webview.setName(value);
        }
        $setState(handle, state) {
            const webview = this.getWebviewEditorInput(handle);
            if (webview instanceof customEditorInput_1.CustomFileEditorInput) {
                webview.setState(state);
            }
        }
        $setIconPath(handle, value) {
            const webview = this.getWebviewEditorInput(handle);
            webview.iconPath = reviveWebviewIcon(value);
        }
        $setHtml(handle, value) {
            const webview = this.getWebviewEditorInput(handle);
            webview.webview.html = value;
        }
        $setOptions(handle, options) {
            const webview = this.getWebviewEditorInput(handle);
            webview.webview.contentOptions = reviveWebviewOptions(options /*todo@mat */);
        }
        $setExtension(handle, extensionId, extensionLocation) {
            const webview = this.getWebviewEditorInput(handle);
            webview.webview.extension = { id: extensionId, location: uri_1.URI.revive(extensionLocation) };
        }
        $reveal(handle, showOptions) {
            const webview = this.getWebviewEditorInput(handle);
            if (webview.isDisposed()) {
                return;
            }
            const targetGroup = this._editorGroupService.getGroup(editor_1.viewColumnToEditorGroup(this._editorGroupService, showOptions.viewColumn)) || this._editorGroupService.getGroup(webview.group || 0);
            if (targetGroup) {
                this._webviewEditorService.revealWebview(webview, targetGroup, !!showOptions.preserveFocus);
            }
        }
        async $postMessage(handle, message) {
            const webview = this.getWebviewEditorInput(handle);
            webview.webview.sendMessage(message);
            return true;
        }
        $registerSerializer(viewType) {
            if (this._revivers.has(viewType)) {
                throw new Error(`Reviver for ${viewType} already registered`);
            }
            this._revivers.set(viewType, this._webviewEditorService.registerResolver({
                canResolve: (webviewEditorInput) => {
                    return webviewEditorInput.viewType === this.getInternalWebviewViewType(viewType);
                },
                resolveWebview: async (webviewEditorInput) => {
                    const viewType = this.fromInternalWebviewViewType(webviewEditorInput.viewType);
                    if (!viewType) {
                        webviewEditorInput.webview.html = MainThreadWebviews_1.getDeserializationFailedContents(webviewEditorInput.viewType);
                        return;
                    }
                    const handle = webviewEditorInput.id;
                    this._webviewEditorInputs.add(handle, webviewEditorInput);
                    this.hookupWebviewEventDelegate(handle, webviewEditorInput);
                    let state = undefined;
                    if (webviewEditorInput.webview.state) {
                        try {
                            state = JSON.parse(webviewEditorInput.webview.state);
                        }
                        catch (_a) {
                            // noop
                        }
                    }
                    try {
                        await this._proxy.$deserializeWebviewPanel(handle, viewType, webviewEditorInput.getTitle(), state, editor_1.editorGroupToViewColumn(this._editorGroupService, webviewEditorInput.group || 0), webviewEditorInput.webview.options);
                    }
                    catch (error) {
                        errors_1.onUnexpectedError(error);
                        webviewEditorInput.webview.html = MainThreadWebviews_1.getDeserializationFailedContents(viewType);
                    }
                }
            }));
        }
        $unregisterSerializer(viewType) {
            const reviver = this._revivers.get(viewType);
            if (!reviver) {
                throw new Error(`No reviver for ${viewType} registered`);
            }
            reviver.dispose();
            this._revivers.delete(viewType);
        }
        $registerEditorProvider(viewType) {
            if (this._editorProviders.has(viewType)) {
                throw new Error(`Provider for ${viewType} already registered`);
            }
            this._editorProviders.set(viewType, this._webviewEditorService.registerResolver({
                canResolve: (webviewEditorInput) => {
                    return webviewEditorInput.getTypeId() !== webviewEditorInput_1.WebviewInput.typeId && webviewEditorInput.viewType === viewType;
                },
                resolveWebview: async (webview) => {
                    const handle = webview.id;
                    this._webviewEditorInputs.add(handle, webview);
                    this.hookupWebviewEventDelegate(handle, webview);
                    if (webview instanceof customEditorInput_1.CustomFileEditorInput) {
                        webview.onWillSave(e => {
                            e.waitUntil(this._proxy.$save(handle));
                        });
                    }
                    try {
                        await this._proxy.$resolveWebviewEditor(webview.getResource(), handle, viewType, webview.getTitle(), webview.webview.state, editor_1.editorGroupToViewColumn(this._editorGroupService, webview.group || 0), webview.webview.options);
                    }
                    catch (error) {
                        errors_1.onUnexpectedError(error);
                        webview.webview.html = MainThreadWebviews_1.getDeserializationFailedContents(viewType);
                    }
                }
            }));
        }
        $unregisterEditorProvider(viewType) {
            const provider = this._editorProviders.get(viewType);
            if (!provider) {
                throw new Error(`No provider for ${viewType} registered`);
            }
            provider.dispose();
            this._editorProviders.delete(viewType);
        }
        getInternalWebviewViewType(viewType) {
            return `mainThreadWebview-${viewType}`;
        }
        fromInternalWebviewViewType(viewType) {
            if (!strings_1.startsWith(viewType, 'mainThreadWebview-')) {
                return undefined;
            }
            return viewType.replace(/^mainThreadWebview-/, '');
        }
        hookupWebviewEventDelegate(handle, input) {
            input.webview.onDidClickLink((uri) => this.onDidClickLink(handle, uri));
            input.webview.onMessage((message) => this._proxy.$onMessage(handle, message));
            input.onDispose(() => {
                this._proxy.$onDidDisposeWebviewPanel(handle).finally(() => {
                    this._webviewEditorInputs.delete(handle);
                });
            });
            input.webview.onDidUpdateState((newState) => {
                const webview = this.tryGetWebviewEditorInput(handle);
                if (!webview || webview.isDisposed()) {
                    return;
                }
                webview.webview.state = newState;
            });
            input.webview.onMissingCsp((extension) => this._proxy.$onMissingCsp(handle, extension.value));
        }
        updateWebviewViewStates() {
            if (!this._webviewEditorInputs.size) {
                return;
            }
            const activeInput = this._editorService.activeControl && this._editorService.activeControl.input;
            const viewStates = {};
            const updateViewStatesForInput = (group, topLevelInput, editorInput) => {
                if (!(editorInput instanceof webviewEditorInput_1.WebviewInput)) {
                    return;
                }
                editorInput.updateGroup(group.id);
                const handle = this._webviewEditorInputs.getHandleForInput(editorInput);
                if (handle) {
                    viewStates[handle] = {
                        visible: topLevelInput === group.activeEditor,
                        active: topLevelInput === activeInput,
                        position: editor_1.editorGroupToViewColumn(this._editorGroupService, group.id),
                    };
                }
            };
            for (const group of this._editorGroupService.groups) {
                for (const input of group.editors) {
                    if (input instanceof diffEditorInput_1.DiffEditorInput) {
                        updateViewStatesForInput(group, input, input.master);
                        updateViewStatesForInput(group, input, input.details);
                    }
                    else {
                        updateViewStatesForInput(group, input, input);
                    }
                }
            }
            if (Object.keys(viewStates).length) {
                this._proxy.$onDidChangeWebviewPanelViewStates(viewStates);
            }
        }
        onDidClickLink(handle, link) {
            const webview = this.getWebviewEditorInput(handle);
            if (this.isSupportedLink(webview, link)) {
                this._openerService.open(link);
            }
        }
        isSupportedLink(webview, link) {
            if (MainThreadWebviews_1.standardSupportedLinkSchemes.has(link.scheme)) {
                return true;
            }
            if (!platform_1.isWeb && this._productService.urlProtocol === link.scheme) {
                return true;
            }
            return !!webview.webview.contentOptions.enableCommandUris && link.scheme === 'command';
        }
        getWebviewEditorInput(handle) {
            const webview = this.tryGetWebviewEditorInput(handle);
            if (!webview) {
                throw new Error('Unknown webview handle:' + handle);
            }
            return webview;
        }
        tryGetWebviewEditorInput(handle) {
            return this._webviewEditorInputs.getInputForHandle(handle);
        }
        static getDeserializationFailedContents(viewType) {
            return `<!DOCTYPE html>
		<html>
			<head>
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none';">
			</head>
			<body>${nls_1.localize('errorMessage', "An error occurred while restoring view:{0}", viewType)}</body>
		</html>`;
        }
    };
    MainThreadWebviews.standardSupportedLinkSchemes = new Set([
        'http',
        'https',
        'mailto',
        'vscode',
        'vscode-insider',
    ]);
    MainThreadWebviews = MainThreadWebviews_1 = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadWebviews),
        __param(1, extensions_1.IExtensionService),
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, editorService_1.IEditorService),
        __param(4, webviewEditorService_1.IWebviewEditorService),
        __param(5, opener_1.IOpenerService),
        __param(6, telemetry_1.ITelemetryService),
        __param(7, productService_1.IProductService)
    ], MainThreadWebviews);
    exports.MainThreadWebviews = MainThreadWebviews;
    function reviveWebviewOptions(options) {
        return Object.assign(Object.assign({}, options), { allowScripts: options.enableScripts, localResourceRoots: Array.isArray(options.localResourceRoots) ? options.localResourceRoots.map(r => uri_1.URI.revive(r)) : undefined });
    }
    function reviveWebviewIcon(value) {
        if (!value) {
            return undefined;
        }
        return {
            light: uri_1.URI.revive(value.light),
            dark: uri_1.URI.revive(value.dark)
        };
    }
});
//# sourceMappingURL=mainThreadWebview.js.map