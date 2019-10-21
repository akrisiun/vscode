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
define(["require", "exports", "vs/nls", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/editor/browser/services/codeEditorService", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration", "vs/platform/storage/common/storage", "./referencesWidget", "vs/editor/common/core/range", "vs/editor/common/core/position", "vs/platform/notification/common/notification"], function (require, exports, nls, errors_1, lifecycle_1, codeEditorService_1, instantiation_1, contextkey_1, configuration_1, storage_1, referencesWidget_1, range_1, position_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ctxReferenceSearchVisible = new contextkey_1.RawContextKey('referenceSearchVisible', false);
    let ReferencesController = class ReferencesController {
        constructor(_defaultTreeKeyboardSupport, editor, contextKeyService, _editorService, _notificationService, _instantiationService, _storageService, _configurationService) {
            this._defaultTreeKeyboardSupport = _defaultTreeKeyboardSupport;
            this._editorService = _editorService;
            this._notificationService = _notificationService;
            this._instantiationService = _instantiationService;
            this._storageService = _storageService;
            this._configurationService = _configurationService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._requestIdPool = 0;
            this._ignoreModelChangeEvent = false;
            this._editor = editor;
            this._referenceSearchVisible = exports.ctxReferenceSearchVisible.bindTo(contextKeyService);
        }
        static get(editor) {
            return editor.getContribution(ReferencesController.ID);
        }
        dispose() {
            this._referenceSearchVisible.reset();
            lifecycle_1.dispose(this._disposables);
            if (this._widget) {
                lifecycle_1.dispose(this._widget);
                this._widget = undefined;
            }
            if (this._model) {
                lifecycle_1.dispose(this._model);
                this._model = undefined;
            }
        }
        toggleWidget(range, modelPromise, options) {
            // close current widget and return early is position didn't change
            let widgetPosition;
            if (this._widget) {
                widgetPosition = this._widget.position;
            }
            this.closeWidget();
            if (!!widgetPosition && range.containsPosition(widgetPosition)) {
                return;
            }
            this._referenceSearchVisible.set(true);
            // close the widget on model/mode changes
            this._disposables.add(this._editor.onDidChangeModelLanguage(() => { this.closeWidget(); }));
            this._disposables.add(this._editor.onDidChangeModel(() => {
                if (!this._ignoreModelChangeEvent) {
                    this.closeWidget();
                }
            }));
            const storageKey = 'peekViewLayout';
            const data = referencesWidget_1.LayoutData.fromJSON(this._storageService.get(storageKey, 0 /* GLOBAL */, '{}'));
            this._widget = this._instantiationService.createInstance(referencesWidget_1.ReferenceWidget, this._editor, this._defaultTreeKeyboardSupport, data);
            this._widget.setTitle(nls.localize('labelLoading', "Loading..."));
            this._widget.show(range);
            this._disposables.add(this._widget.onDidClose(() => {
                modelPromise.cancel();
                if (this._widget) {
                    this._storageService.store(storageKey, JSON.stringify(this._widget.layoutData), 0 /* GLOBAL */);
                    this._widget = undefined;
                }
                this.closeWidget();
            }));
            this._disposables.add(this._widget.onDidSelectReference(event => {
                let { element, kind } = event;
                switch (kind) {
                    case 'open':
                        if (event.source === 'editor'
                            && this._configurationService.getValue('editor.stablePeek')) {
                            // when stable peek is configured we don't close
                            // the peek window on selecting the editor
                            break;
                        }
                    case 'side':
                        if (element) {
                            this.openReference(element, kind === 'side');
                        }
                        break;
                    case 'goto':
                        if (element) {
                            if (options.onGoto) {
                                options.onGoto(element);
                            }
                            else {
                                this._gotoReference(element);
                            }
                        }
                        break;
                }
            }));
            const requestId = ++this._requestIdPool;
            modelPromise.then(model => {
                // still current request? widget still open?
                if (requestId !== this._requestIdPool || !this._widget) {
                    return undefined;
                }
                if (this._model) {
                    this._model.dispose();
                }
                this._model = model;
                // show widget
                return this._widget.setModel(this._model).then(() => {
                    if (this._widget && this._model && this._editor.hasModel()) { // might have been closed
                        // set title
                        this._widget.setMetaTitle(options.getMetaTitle(this._model));
                        // set 'best' selection
                        let uri = this._editor.getModel().uri;
                        let pos = new position_1.Position(range.startLineNumber, range.startColumn);
                        let selection = this._model.nearestReference(uri, pos);
                        if (selection) {
                            return this._widget.setSelection(selection);
                        }
                    }
                    return undefined;
                });
            }, error => {
                this._notificationService.error(error);
            });
        }
        async goToNextOrPreviousReference(fwd) {
            if (!this._editor.hasModel() || !this._model || !this._widget) {
                // can be called while still resolving...
                return;
            }
            const currentPosition = this._widget.position;
            if (!currentPosition) {
                return;
            }
            const source = this._model.nearestReference(this._editor.getModel().uri, currentPosition);
            if (!source) {
                return;
            }
            const target = this._model.nextOrPreviousReference(source, fwd);
            const editorFocus = this._editor.hasTextFocus();
            await this._widget.setSelection(target);
            await this._gotoReference(target);
            if (editorFocus) {
                this._editor.focus();
            }
        }
        closeWidget() {
            if (this._widget) {
                lifecycle_1.dispose(this._widget);
                this._widget = undefined;
            }
            this._referenceSearchVisible.reset();
            this._disposables.clear();
            if (this._model) {
                lifecycle_1.dispose(this._model);
                this._model = undefined;
            }
            this._editor.focus();
            this._requestIdPool += 1; // Cancel pending requests
        }
        _gotoReference(ref) {
            if (this._widget) {
                this._widget.hide();
            }
            this._ignoreModelChangeEvent = true;
            const range = range_1.Range.lift(ref.range).collapseToStart();
            return this._editorService.openCodeEditor({
                resource: ref.uri,
                options: { selection: range }
            }, this._editor).then(openedEditor => {
                this._ignoreModelChangeEvent = false;
                if (!openedEditor || openedEditor !== this._editor) {
                    // TODO@Alex TODO@Joh
                    // when opening the current reference we might end up
                    // in a different editor instance. that means we also have
                    // a different instance of this reference search controller
                    // and cannot hold onto the widget (which likely doesn't
                    // exist). Instead of bailing out we should find the
                    // 'sister' action and pass our current model on to it.
                    this.closeWidget();
                    return;
                }
                if (this._widget) {
                    this._widget.show(range);
                    this._widget.focus();
                }
            }, (err) => {
                this._ignoreModelChangeEvent = false;
                errors_1.onUnexpectedError(err);
            });
        }
        openReference(ref, sideBySide) {
            // clear stage
            if (!sideBySide) {
                this.closeWidget();
            }
            const { uri, range } = ref;
            this._editorService.openCodeEditor({
                resource: uri,
                options: { selection: range }
            }, this._editor, sideBySide);
        }
    };
    ReferencesController.ID = 'editor.contrib.referencesController';
    ReferencesController = __decorate([
        __param(2, contextkey_1.IContextKeyService),
        __param(3, codeEditorService_1.ICodeEditorService),
        __param(4, notification_1.INotificationService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, storage_1.IStorageService),
        __param(7, configuration_1.IConfigurationService)
    ], ReferencesController);
    exports.ReferencesController = ReferencesController;
});
//# sourceMappingURL=referencesController.js.map