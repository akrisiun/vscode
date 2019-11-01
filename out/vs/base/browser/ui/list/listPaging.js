/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/arrays", "./listWidget", "vs/base/common/event", "vs/base/common/cancellation", "vs/css!./list"], function (require, exports, lifecycle_1, arrays_1, listWidget_1, event_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class PagedRenderer {
        constructor(renderer, modelProvider) {
            this.renderer = renderer;
            this.modelProvider = modelProvider;
        }
        get templateId() { return this.renderer.templateId; }
        renderTemplate(container) {
            const data = this.renderer.renderTemplate(container);
            return { data, disposable: lifecycle_1.Disposable.None };
        }
        renderElement(index, _, data, height) {
            if (data.disposable) {
                data.disposable.dispose();
            }
            if (!data.data) {
                return;
            }
            const model = this.modelProvider();
            if (model.isResolved(index)) {
                return this.renderer.renderElement(model.get(index), index, data.data, height);
            }
            const cts = new cancellation_1.CancellationTokenSource();
            const promise = model.resolve(index, cts.token);
            data.disposable = { dispose: () => cts.cancel() };
            this.renderer.renderPlaceholder(index, data.data);
            promise.then(entry => this.renderer.renderElement(entry, index, data.data, height));
        }
        disposeTemplate(data) {
            if (data.disposable) {
                data.disposable.dispose();
                data.disposable = undefined;
            }
            if (data.data) {
                this.renderer.disposeTemplate(data.data);
                data.data = undefined;
            }
        }
    }
    class PagedList {
        constructor(user, container, virtualDelegate, renderers, options = {}) {
            const pagedRenderers = renderers.map(r => new PagedRenderer(r, () => this.model));
            this.list = new listWidget_1.List(user, container, virtualDelegate, pagedRenderers, options);
        }
        getHTMLElement() {
            return this.list.getHTMLElement();
        }
        isDOMFocused() {
            return this.list.getHTMLElement() === document.activeElement;
        }
        domFocus() {
            this.list.domFocus();
        }
        get onDidFocus() {
            return this.list.onDidFocus;
        }
        get onDidBlur() {
            return this.list.onDidBlur;
        }
        get widget() {
            return this.list;
        }
        get onDidDispose() {
            return this.list.onDidDispose;
        }
        get onFocusChange() {
            return event_1.Event.map(this.list.onFocusChange, ({ elements, indexes }) => ({ elements: elements.map(e => this._model.get(e)), indexes }));
        }
        get onOpen() {
            return event_1.Event.map(this.list.onDidOpen, ({ elements, indexes, browserEvent }) => ({ elements: elements.map(e => this._model.get(e)), indexes, browserEvent }));
        }
        get onSelectionChange() {
            return event_1.Event.map(this.list.onSelectionChange, ({ elements, indexes }) => ({ elements: elements.map(e => this._model.get(e)), indexes }));
        }
        get onPin() {
            return event_1.Event.map(this.list.onDidPin, ({ elements, indexes }) => ({ elements: elements.map(e => this._model.get(e)), indexes }));
        }
        get onContextMenu() {
            return event_1.Event.map(this.list.onContextMenu, ({ element, index, anchor, browserEvent }) => (typeof element === 'undefined' ? { element, index, anchor, browserEvent } : { element: this._model.get(element), index, anchor, browserEvent }));
        }
        get model() {
            return this._model;
        }
        set model(model) {
            this._model = model;
            this.list.splice(0, this.list.length, arrays_1.range(model.length));
        }
        get length() {
            return this.list.length;
        }
        get scrollTop() {
            return this.list.scrollTop;
        }
        set scrollTop(scrollTop) {
            this.list.scrollTop = scrollTop;
        }
        open(indexes, browserEvent) {
            this.list.open(indexes, browserEvent);
        }
        setFocus(indexes) {
            this.list.setFocus(indexes);
        }
        focusNext(n, loop) {
            this.list.focusNext(n, loop);
        }
        focusPrevious(n, loop) {
            this.list.focusPrevious(n, loop);
        }
        focusNextPage() {
            this.list.focusNextPage();
        }
        focusPreviousPage() {
            this.list.focusPreviousPage();
        }
        getFocus() {
            return this.list.getFocus();
        }
        setSelection(indexes) {
            this.list.setSelection(indexes);
        }
        getSelection() {
            return this.list.getSelection();
        }
        layout(height, width) {
            this.list.layout(height, width);
        }
        toggleKeyboardNavigation() {
            this.list.toggleKeyboardNavigation();
        }
        reveal(index, relativeTop) {
            this.list.reveal(index, relativeTop);
        }
        style(styles) {
            this.list.style(styles);
        }
        dispose() {
            this.list.dispose();
        }
    }
    exports.PagedList = PagedList;
});
//# sourceMappingURL=listPaging.js.map