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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/base/common/map", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "./webviewEditorInput", "vs/platform/workspace/common/workspace", "vs/platform/instantiation/common/extensions", "vs/platform/editor/common/editor"], function (require, exports, arrays_1, lifecycle_1, map_1, instantiation_1, webview_1, editorGroupsService_1, editorService_1, webviewEditorInput_1, workspace_1, extensions_1, editor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IWebviewEditorService = instantiation_1.createDecorator('webviewEditorService');
    function areWebviewInputOptionsEqual(a, b) {
        return a.enableCommandUris === b.enableCommandUris
            && a.enableFindWidget === b.enableFindWidget
            && a.allowScripts === b.allowScripts
            && a.retainContextWhenHidden === b.retainContextWhenHidden
            && a.tryRestoreScrollPosition === b.tryRestoreScrollPosition
            && (a.localResourceRoots === b.localResourceRoots || (Array.isArray(a.localResourceRoots) && Array.isArray(b.localResourceRoots) && arrays_1.equals(a.localResourceRoots, b.localResourceRoots, (a, b) => a.toString() === b.toString())))
            && (a.portMapping === b.portMapping || (Array.isArray(a.portMapping) && Array.isArray(b.portMapping) && arrays_1.equals(a.portMapping, b.portMapping, (a, b) => a.extensionHostPort === b.extensionHostPort && a.webviewPort === b.webviewPort)));
    }
    exports.areWebviewInputOptionsEqual = areWebviewInputOptionsEqual;
    function canRevive(reviver, webview) {
        if (webview.isDisposed()) {
            return false;
        }
        return reviver.canResolve(webview);
    }
    class RevivalPool {
        constructor() {
            this._awaitingRevival = [];
        }
        add(input, resolve) {
            this._awaitingRevival.push({ input, resolve });
        }
        reviveFor(reviver) {
            const toRevive = this._awaitingRevival.filter(({ input }) => canRevive(reviver, input));
            this._awaitingRevival = this._awaitingRevival.filter(({ input }) => !canRevive(reviver, input));
            for (const { input, resolve } of toRevive) {
                reviver.resolveWebview(input).then(resolve);
            }
        }
    }
    let WebviewEditorService = class WebviewEditorService {
        constructor(_editorService, _instantiationService, _editorGroupService, _webviewService, _contextService) {
            this._editorService = _editorService;
            this._instantiationService = _instantiationService;
            this._editorGroupService = _editorGroupService;
            this._webviewService = _webviewService;
            this._contextService = _contextService;
            this._revivers = new Set();
            this._revivalPool = new RevivalPool();
        }
        createWebview(id, viewType, title, showOptions, options, extension) {
            const webview = this.createWebiew(id, extension, options);
            const webviewInput = this._instantiationService.createInstance(webviewEditorInput_1.WebviewInput, id, viewType, title, new lifecycle_1.UnownedDisposable(webview), undefined);
            this._editorService.openEditor(webviewInput, {
                pinned: true,
                preserveFocus: showOptions.preserveFocus,
                // preserve pre 1.38 behaviour to not make group active when preserveFocus: true
                // but make sure to restore the editor to fix https://github.com/microsoft/vscode/issues/79633
                activation: showOptions.preserveFocus ? editor_1.EditorActivation.RESTORE : undefined
            }, showOptions.group);
            return webviewInput;
        }
        revealWebview(webview, group, preserveFocus) {
            if (webview.group === group.id) {
                this._editorService.openEditor(webview, {
                    preserveFocus,
                    // preserve pre 1.38 behaviour to not make group active when preserveFocus: true
                    // but make sure to restore the editor to fix https://github.com/microsoft/vscode/issues/79633
                    activation: preserveFocus ? editor_1.EditorActivation.RESTORE : undefined
                }, webview.group);
            }
            else {
                const groupView = this._editorGroupService.getGroup(webview.group);
                if (groupView) {
                    groupView.moveEditor(webview, group, { preserveFocus });
                }
            }
        }
        reviveWebview(id, viewType, title, iconPath, state, options, extension, group) {
            const webview = this.createWebiew(id, extension, options);
            webview.state = state;
            const webviewInput = new webviewEditorInput_1.RevivedWebviewEditorInput(id, viewType, title, async (webview) => {
                const didRevive = await this.tryRevive(webview);
                if (didRevive) {
                    return Promise.resolve(undefined);
                }
                // A reviver may not be registered yet. Put into pool and resolve promise when we can revive
                let resolve;
                const promise = new Promise(r => { resolve = r; });
                this._revivalPool.add(webview, resolve);
                return promise;
            }, new lifecycle_1.UnownedDisposable(webview));
            webviewInput.iconPath = iconPath;
            if (typeof group === 'number') {
                webviewInput.updateGroup(group);
            }
            return webviewInput;
        }
        registerResolver(reviver) {
            this._revivers.add(reviver);
            this._revivalPool.reviveFor(reviver);
            return lifecycle_1.toDisposable(() => {
                this._revivers.delete(reviver);
            });
        }
        shouldPersist(webview) {
            if (map_1.values(this._revivers).some(reviver => canRevive(reviver, webview))) {
                return true;
            }
            // Revived webviews may not have an actively registered reviver but we still want to presist them
            // since a reviver should exist when it is actually needed.
            return webview instanceof webviewEditorInput_1.RevivedWebviewEditorInput;
        }
        async tryRevive(webview) {
            for (const reviver of map_1.values(this._revivers)) {
                if (canRevive(reviver, webview)) {
                    await reviver.resolveWebview(webview);
                    return true;
                }
            }
            return false;
        }
        async resolveWebview(webview) {
            const didRevive = await this.tryRevive(webview);
            if (!didRevive) {
                let resolve;
                const promise = new Promise(r => { resolve = r; });
                this._revivalPool.add(webview, resolve);
                return promise;
            }
        }
        createWebiew(id, extension, options) {
            const webview = this._webviewService.createWebviewEditorOverlay(id, {
                enableFindWidget: options.enableFindWidget,
                retainContextWhenHidden: options.retainContextWhenHidden
            }, Object.assign(Object.assign({}, options), { localResourceRoots: options.localResourceRoots || this.getDefaultLocalResourceRoots(extension) }));
            webview.extension = extension;
            return webview;
        }
        getDefaultLocalResourceRoots(extension) {
            const rootPaths = this._contextService.getWorkspace().folders.map(x => x.uri);
            if (extension) {
                rootPaths.push(extension.location);
            }
            return rootPaths;
        }
    };
    WebviewEditorService = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, webview_1.IWebviewService),
        __param(4, workspace_1.IWorkspaceContextService)
    ], WebviewEditorService);
    exports.WebviewEditorService = WebviewEditorService;
    extensions_1.registerSingleton(exports.IWebviewEditorService, WebviewEditorService, true);
});
//# sourceMappingURL=webviewEditorService.js.map