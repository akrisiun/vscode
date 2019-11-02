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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/platform/contextkey/common/contextkey", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/baseEditor", "vs/workbench/browser/parts/editor/editorPart", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webview/browser/webviewEditorInput", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/host/browser/host"], function (require, exports, DOM, event_1, lifecycle_1, platform_1, contextkey_1, storage_1, telemetry_1, themeService_1, baseEditor_1, editorPart_1, webview_1, webviewEditorInput_1, editorGroupsService_1, editorService_1, host_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let WebviewEditor = class WebviewEditor extends baseEditor_1.BaseEditor {
        constructor(telemetryService, themeService, storageService, _contextKeyService, _editorService, _editorGroupsService, _hostService) {
            super(WebviewEditor.ID, telemetryService, themeService, storageService);
            this._contextKeyService = _contextKeyService;
            this._editorService = _editorService;
            this._editorGroupsService = _editorGroupsService;
            this._hostService = _hostService;
            this._scopedContextKeyService = this._register(new lifecycle_1.MutableDisposable());
            this._webviewVisibleDisposables = this._register(new lifecycle_1.DisposableStore());
            this._onFocusWindowHandler = this._register(new lifecycle_1.MutableDisposable());
            this._onDidFocusWebview = this._register(new event_1.Emitter());
            this._findWidgetVisible = webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_VISIBLE.bindTo(_contextKeyService);
        }
        get onDidFocus() { return this._onDidFocusWebview.event; }
        get isWebviewEditor() {
            return true;
        }
        createEditor(parent) {
            this._editorFrame = parent;
            this._content = document.createElement('div');
            parent.appendChild(this._content);
        }
        dispose() {
            if (this._content) {
                this._content.remove();
                this._content = undefined;
            }
            super.dispose();
        }
        showFind() {
            this.withWebview(webview => {
                webview.showFind();
                this._findWidgetVisible.set(true);
            });
        }
        hideFind() {
            this._findWidgetVisible.reset();
            this.withWebview(webview => webview.hideFind());
        }
        find(previous) {
            this.withWebview(webview => {
                webview.runFindAction(previous);
            });
        }
        reload() {
            this.withWebview(webview => webview.reload());
        }
        layout(dimension) {
            this._dimension = dimension;
            if (this.input && this.input instanceof webviewEditorInput_1.WebviewInput) {
                this.synchronizeWebviewContainerDimensions(this.input.webview, dimension);
            }
        }
        focus() {
            super.focus();
            if (!this._onFocusWindowHandler.value && !platform_1.isWeb) {
                // Make sure we restore focus when switching back to a VS Code window
                this._onFocusWindowHandler.value = this._hostService.onDidChangeFocus(focused => {
                    if (focused && this._editorService.activeControl === this) {
                        this.focus();
                    }
                });
            }
            this.withWebview(webview => webview.focus());
        }
        withWebview(f) {
            if (this.input && this.input instanceof webviewEditorInput_1.WebviewInput) {
                f(this.input.webview);
            }
        }
        setEditorVisible(visible, group) {
            if (this.input instanceof webviewEditorInput_1.WebviewInput) {
                const webview = this.input.webview;
                if (visible) {
                    webview.claim(this);
                }
                else {
                    webview.release(this);
                }
                this.claimWebview(this.input);
            }
            super.setEditorVisible(visible, group);
        }
        clearInput() {
            if (this.input && this.input instanceof webviewEditorInput_1.WebviewInput) {
                this.input.webview.release(this);
                this._webviewVisibleDisposables.clear();
            }
            super.clearInput();
        }
        async setInput(input, options, token) {
            if (input.matches(this.input)) {
                return;
            }
            if (this.input && this.input instanceof webviewEditorInput_1.WebviewInput) {
                this.input.webview.release(this);
            }
            await super.setInput(input, options, token);
            await input.resolve();
            if (token.isCancellationRequested) {
                return;
            }
            if (input instanceof webviewEditorInput_1.WebviewInput) {
                if (this.group) {
                    input.updateGroup(this.group.id);
                }
                this.claimWebview(input);
                if (this._dimension) {
                    this.layout(this._dimension);
                }
            }
        }
        claimWebview(input) {
            input.webview.claim(this);
            if (input.webview.options.enableFindWidget) {
                this._scopedContextKeyService.value = this._contextKeyService.createScoped(input.webview.container);
                this._findWidgetVisible = webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_VISIBLE.bindTo(this._scopedContextKeyService.value);
            }
            if (this._content) {
                this._content.setAttribute('aria-flowto', input.webview.container.id);
            }
            this._webviewVisibleDisposables.clear();
            // Webviews are not part of the normal editor dom, so we have to register our own drag and drop handler on them.
            if (this._editorGroupsService instanceof editorPart_1.EditorPart) {
                this._webviewVisibleDisposables.add(this._editorGroupsService.createEditorDropTarget(input.webview.container, {
                    groupContainsPredicate: (group) => { var _a; return ((_a = this.group) === null || _a === void 0 ? void 0 : _a.id) === group.group.id; }
                }));
            }
            this._webviewVisibleDisposables.add(DOM.addDisposableListener(window, DOM.EventType.DRAG_START, () => {
                if (this.input instanceof webviewEditorInput_1.WebviewInput) {
                    this.input.webview.windowDidDragStart();
                }
            }));
            const onDragEnd = () => {
                if (this.input instanceof webviewEditorInput_1.WebviewInput) {
                    this.input.webview.windowDidDragEnd();
                }
            };
            this._webviewVisibleDisposables.add(DOM.addDisposableListener(window, DOM.EventType.DRAG_END, onDragEnd));
            this._webviewVisibleDisposables.add(DOM.addDisposableListener(window, DOM.EventType.MOUSE_MOVE, currentEvent => {
                if (currentEvent.buttons === 0) {
                    onDragEnd();
                }
            }));
            this.synchronizeWebviewContainerDimensions(input.webview);
            this._webviewVisibleDisposables.add(this.trackFocus(input.webview));
        }
        synchronizeWebviewContainerDimensions(webview, dimension) {
            if (this._editorFrame) {
                webview.layoutWebviewOverElement(this._editorFrame, dimension);
            }
        }
        trackFocus(webview) {
            const store = new lifecycle_1.DisposableStore();
            // Track focus in webview content
            const webviewContentFocusTracker = DOM.trackFocus(webview.container);
            store.add(webviewContentFocusTracker);
            store.add(webviewContentFocusTracker.onDidFocus(() => this._onDidFocusWebview.fire()));
            // Track focus in webview element
            store.add(webview.onDidFocus(() => this._onDidFocusWebview.fire()));
            return store;
        }
    };
    WebviewEditor.ID = 'WebviewEditor';
    WebviewEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, themeService_1.IThemeService),
        __param(2, storage_1.IStorageService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, editorService_1.IEditorService),
        __param(5, editorGroupsService_1.IEditorGroupsService),
        __param(6, host_1.IHostService)
    ], WebviewEditor);
    exports.WebviewEditor = WebviewEditor;
});
//# sourceMappingURL=webviewEditor.js.map