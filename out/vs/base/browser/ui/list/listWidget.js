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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/types", "vs/base/common/arrays", "vs/base/common/decorators", "vs/base/browser/dom", "vs/base/common/platform", "vs/base/browser/touch", "vs/base/browser/keyboardEvent", "vs/base/common/event", "vs/base/browser/event", "./list", "./listView", "vs/base/common/color", "vs/base/common/objects", "vs/base/browser/ui/list/splice", "vs/base/common/numbers", "vs/base/common/filters", "vs/css!./list"], function (require, exports, nls_1, lifecycle_1, types_1, arrays_1, decorators_1, DOM, platform, touch_1, keyboardEvent_1, event_1, event_2, list_1, listView_1, color_1, objects_1, splice_1, numbers_1, filters_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TraitRenderer {
        constructor(trait) {
            this.trait = trait;
            this.renderedElements = [];
        }
        get templateId() {
            return `template:${this.trait.trait}`;
        }
        renderTemplate(container) {
            return container;
        }
        renderElement(element, index, templateData) {
            const renderedElementIndex = arrays_1.firstIndex(this.renderedElements, el => el.templateData === templateData);
            if (renderedElementIndex >= 0) {
                const rendered = this.renderedElements[renderedElementIndex];
                this.trait.unrender(templateData);
                rendered.index = index;
            }
            else {
                const rendered = { index, templateData };
                this.renderedElements.push(rendered);
            }
            this.trait.renderIndex(index, templateData);
        }
        splice(start, deleteCount, insertCount) {
            const rendered = [];
            for (const renderedElement of this.renderedElements) {
                if (renderedElement.index < start) {
                    rendered.push(renderedElement);
                }
                else if (renderedElement.index >= start + deleteCount) {
                    rendered.push({
                        index: renderedElement.index + insertCount - deleteCount,
                        templateData: renderedElement.templateData
                    });
                }
            }
            this.renderedElements = rendered;
        }
        renderIndexes(indexes) {
            for (const { index, templateData } of this.renderedElements) {
                if (indexes.indexOf(index) > -1) {
                    this.trait.renderIndex(index, templateData);
                }
            }
        }
        disposeTemplate(templateData) {
            const index = arrays_1.firstIndex(this.renderedElements, el => el.templateData === templateData);
            if (index < 0) {
                return;
            }
            this.renderedElements.splice(index, 1);
        }
    }
    class Trait {
        constructor(_trait) {
            this._trait = _trait;
            this.indexes = [];
            this.sortedIndexes = [];
            this._onChange = new event_1.Emitter();
            this.onChange = this._onChange.event;
        }
        get trait() { return this._trait; }
        get renderer() {
            return new TraitRenderer(this);
        }
        splice(start, deleteCount, elements) {
            const diff = elements.length - deleteCount;
            const end = start + deleteCount;
            const indexes = [
                ...this.sortedIndexes.filter(i => i < start),
                ...elements.map((hasTrait, i) => hasTrait ? i + start : -1).filter(i => i !== -1),
                ...this.sortedIndexes.filter(i => i >= end).map(i => i + diff)
            ];
            this.renderer.splice(start, deleteCount, elements.length);
            this._set(indexes, indexes);
        }
        renderIndex(index, container) {
            DOM.toggleClass(container, this._trait, this.contains(index));
        }
        unrender(container) {
            DOM.removeClass(container, this._trait);
        }
        /**
         * Sets the indexes which should have this trait.
         *
         * @param indexes Indexes which should have this trait.
         * @return The old indexes which had this trait.
         */
        set(indexes, browserEvent) {
            return this._set(indexes, [...indexes].sort(numericSort), browserEvent);
        }
        _set(indexes, sortedIndexes, browserEvent) {
            const result = this.indexes;
            const sortedResult = this.sortedIndexes;
            this.indexes = indexes;
            this.sortedIndexes = sortedIndexes;
            const toRender = disjunction(sortedResult, indexes);
            this.renderer.renderIndexes(toRender);
            this._onChange.fire({ indexes, browserEvent });
            return result;
        }
        get() {
            return this.indexes;
        }
        contains(index) {
            return arrays_1.binarySearch(this.sortedIndexes, index, numericSort) >= 0;
        }
        dispose() {
            lifecycle_1.dispose(this._onChange);
        }
    }
    __decorate([
        decorators_1.memoize
    ], Trait.prototype, "renderer", null);
    class FocusTrait extends Trait {
        constructor() {
            super('focused');
        }
        renderIndex(index, container) {
            super.renderIndex(index, container);
            if (this.contains(index)) {
                container.setAttribute('aria-selected', 'true');
            }
            else {
                container.removeAttribute('aria-selected');
            }
        }
    }
    /**
     * The TraitSpliceable is used as a util class to be able
     * to preserve traits across splice calls, given an identity
     * provider.
     */
    class TraitSpliceable {
        constructor(trait, view, identityProvider) {
            this.trait = trait;
            this.view = view;
            this.identityProvider = identityProvider;
        }
        splice(start, deleteCount, elements) {
            if (!this.identityProvider) {
                return this.trait.splice(start, deleteCount, elements.map(() => false));
            }
            const pastElementsWithTrait = this.trait.get().map(i => this.identityProvider.getId(this.view.element(i)).toString());
            const elementsWithTrait = elements.map(e => pastElementsWithTrait.indexOf(this.identityProvider.getId(e).toString()) > -1);
            this.trait.splice(start, deleteCount, elementsWithTrait);
        }
    }
    function isInputElement(e) {
        return e.tagName === 'INPUT' || e.tagName === 'TEXTAREA';
    }
    class KeyboardController {
        constructor(list, view, options) {
            this.list = list;
            this.view = view;
            this.disposables = new lifecycle_1.DisposableStore();
            const multipleSelectionSupport = options.multipleSelectionSupport !== false;
            this.openController = options.openController || DefaultOpenController;
            const onKeyDown = event_1.Event.chain(event_2.domEvent(view.domNode, 'keydown'))
                .filter(e => !isInputElement(e.target))
                .map(e => new keyboardEvent_1.StandardKeyboardEvent(e));
            onKeyDown.filter(e => e.keyCode === 3 /* Enter */).on(this.onEnter, this, this.disposables);
            onKeyDown.filter(e => e.keyCode === 16 /* UpArrow */).on(this.onUpArrow, this, this.disposables);
            onKeyDown.filter(e => e.keyCode === 18 /* DownArrow */).on(this.onDownArrow, this, this.disposables);
            onKeyDown.filter(e => e.keyCode === 11 /* PageUp */).on(this.onPageUpArrow, this, this.disposables);
            onKeyDown.filter(e => e.keyCode === 12 /* PageDown */).on(this.onPageDownArrow, this, this.disposables);
            onKeyDown.filter(e => e.keyCode === 9 /* Escape */).on(this.onEscape, this, this.disposables);
            if (multipleSelectionSupport) {
                onKeyDown.filter(e => (platform.isMacintosh ? e.metaKey : e.ctrlKey) && e.keyCode === 31 /* KEY_A */).on(this.onCtrlA, this, this.disposables);
            }
        }
        onEnter(e) {
            e.preventDefault();
            e.stopPropagation();
            this.list.setSelection(this.list.getFocus(), e.browserEvent);
            if (this.openController.shouldOpen(e.browserEvent)) {
                this.list.open(this.list.getFocus(), e.browserEvent);
            }
        }
        onUpArrow(e) {
            e.preventDefault();
            e.stopPropagation();
            this.list.focusPrevious(1, false, e.browserEvent);
            this.list.reveal(this.list.getFocus()[0]);
            this.view.domNode.focus();
        }
        onDownArrow(e) {
            e.preventDefault();
            e.stopPropagation();
            this.list.focusNext(1, false, e.browserEvent);
            this.list.reveal(this.list.getFocus()[0]);
            this.view.domNode.focus();
        }
        onPageUpArrow(e) {
            e.preventDefault();
            e.stopPropagation();
            this.list.focusPreviousPage(e.browserEvent);
            this.list.reveal(this.list.getFocus()[0]);
            this.view.domNode.focus();
        }
        onPageDownArrow(e) {
            e.preventDefault();
            e.stopPropagation();
            this.list.focusNextPage(e.browserEvent);
            this.list.reveal(this.list.getFocus()[0]);
            this.view.domNode.focus();
        }
        onCtrlA(e) {
            e.preventDefault();
            e.stopPropagation();
            this.list.setSelection(arrays_1.range(this.list.length), e.browserEvent);
            this.view.domNode.focus();
        }
        onEscape(e) {
            e.preventDefault();
            e.stopPropagation();
            this.list.setSelection([], e.browserEvent);
            this.view.domNode.focus();
        }
        dispose() {
            this.disposables.dispose();
        }
    }
    var TypeLabelControllerState;
    (function (TypeLabelControllerState) {
        TypeLabelControllerState[TypeLabelControllerState["Idle"] = 0] = "Idle";
        TypeLabelControllerState[TypeLabelControllerState["Typing"] = 1] = "Typing";
    })(TypeLabelControllerState || (TypeLabelControllerState = {}));
    exports.DefaultKeyboardNavigationDelegate = new class {
        mightProducePrintableCharacter(event) {
            if (event.ctrlKey || event.metaKey || event.altKey) {
                return false;
            }
            return (event.keyCode >= 31 /* KEY_A */ && event.keyCode <= 56 /* KEY_Z */)
                || (event.keyCode >= 21 /* KEY_0 */ && event.keyCode <= 30 /* KEY_9 */)
                || (event.keyCode >= 93 /* NUMPAD_0 */ && event.keyCode <= 102 /* NUMPAD_9 */)
                || (event.keyCode >= 80 /* US_SEMICOLON */ && event.keyCode <= 90 /* US_QUOTE */);
        }
    };
    class TypeLabelController {
        constructor(list, view, keyboardNavigationLabelProvider, delegate) {
            this.list = list;
            this.view = view;
            this.keyboardNavigationLabelProvider = keyboardNavigationLabelProvider;
            this.delegate = delegate;
            this.enabled = false;
            this.state = TypeLabelControllerState.Idle;
            this.automaticKeyboardNavigation = true;
            this.triggered = false;
            this.enabledDisposables = new lifecycle_1.DisposableStore();
            this.disposables = new lifecycle_1.DisposableStore();
            this.updateOptions(list.options);
        }
        updateOptions(options) {
            const enableKeyboardNavigation = typeof options.enableKeyboardNavigation === 'undefined' ? true : !!options.enableKeyboardNavigation;
            if (enableKeyboardNavigation) {
                this.enable();
            }
            else {
                this.disable();
            }
            if (typeof options.automaticKeyboardNavigation !== 'undefined') {
                this.automaticKeyboardNavigation = options.automaticKeyboardNavigation;
            }
        }
        toggle() {
            this.triggered = !this.triggered;
        }
        enable() {
            if (this.enabled) {
                return;
            }
            const onChar = event_1.Event.chain(event_2.domEvent(this.view.domNode, 'keydown'))
                .filter(e => !isInputElement(e.target))
                .filter(() => this.automaticKeyboardNavigation || this.triggered)
                .map(event => new keyboardEvent_1.StandardKeyboardEvent(event))
                .filter(e => this.delegate.mightProducePrintableCharacter(e))
                .forEach(e => { e.stopPropagation(); e.preventDefault(); })
                .map(event => event.browserEvent.key)
                .event;
            const onClear = event_1.Event.debounce(onChar, () => null, 800);
            const onInput = event_1.Event.reduce(event_1.Event.any(onChar, onClear), (r, i) => i === null ? null : ((r || '') + i));
            onInput(this.onInput, this, this.enabledDisposables);
            this.enabled = true;
            this.triggered = false;
        }
        disable() {
            if (!this.enabled) {
                return;
            }
            this.enabledDisposables.clear();
            this.enabled = false;
            this.triggered = false;
        }
        onInput(word) {
            if (!word) {
                this.state = TypeLabelControllerState.Idle;
                this.triggered = false;
                return;
            }
            const focus = this.list.getFocus();
            const start = focus.length > 0 ? focus[0] : 0;
            const delta = this.state === TypeLabelControllerState.Idle ? 1 : 0;
            this.state = TypeLabelControllerState.Typing;
            for (let i = 0; i < this.list.length; i++) {
                const index = (start + i + delta) % this.list.length;
                const label = this.keyboardNavigationLabelProvider.getKeyboardNavigationLabel(this.view.element(index));
                const labelStr = label && label.toString();
                if (typeof labelStr === 'undefined' || filters_1.matchesPrefix(word, labelStr)) {
                    this.list.setFocus([index]);
                    this.list.reveal(index);
                    return;
                }
            }
        }
        dispose() {
            this.disable();
            this.enabledDisposables.dispose();
            this.disposables.dispose();
        }
    }
    class DOMFocusController {
        constructor(list, view) {
            this.list = list;
            this.view = view;
            this.disposables = new lifecycle_1.DisposableStore();
            const onKeyDown = event_1.Event.chain(event_2.domEvent(view.domNode, 'keydown'))
                .filter(e => !isInputElement(e.target))
                .map(e => new keyboardEvent_1.StandardKeyboardEvent(e));
            onKeyDown.filter(e => e.keyCode === 2 /* Tab */ && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey)
                .on(this.onTab, this, this.disposables);
        }
        onTab(e) {
            if (e.target !== this.view.domNode) {
                return;
            }
            const focus = this.list.getFocus();
            if (focus.length === 0) {
                return;
            }
            const focusedDomElement = this.view.domElement(focus[0]);
            if (!focusedDomElement) {
                return;
            }
            const tabIndexElement = focusedDomElement.querySelector('[tabIndex]');
            if (!tabIndexElement || !(tabIndexElement instanceof HTMLElement) || tabIndexElement.tabIndex === -1) {
                return;
            }
            const style = window.getComputedStyle(tabIndexElement);
            if (style.visibility === 'hidden' || style.display === 'none') {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            tabIndexElement.focus();
        }
        dispose() {
            this.disposables.dispose();
        }
    }
    function isSelectionSingleChangeEvent(event) {
        return platform.isMacintosh ? event.browserEvent.metaKey : event.browserEvent.ctrlKey;
    }
    exports.isSelectionSingleChangeEvent = isSelectionSingleChangeEvent;
    function isSelectionRangeChangeEvent(event) {
        return event.browserEvent.shiftKey;
    }
    exports.isSelectionRangeChangeEvent = isSelectionRangeChangeEvent;
    function isMouseRightClick(event) {
        return event instanceof MouseEvent && event.button === 2;
    }
    const DefaultMultipleSelectionController = {
        isSelectionSingleChangeEvent,
        isSelectionRangeChangeEvent
    };
    const DefaultOpenController = {
        shouldOpen: (event) => {
            if (event instanceof MouseEvent) {
                return !isMouseRightClick(event);
            }
            return true;
        }
    };
    class MouseController {
        constructor(list) {
            this.list = list;
            this.disposables = new lifecycle_1.DisposableStore();
            this.multipleSelectionSupport = !(list.options.multipleSelectionSupport === false);
            if (this.multipleSelectionSupport) {
                this.multipleSelectionController = list.options.multipleSelectionController || DefaultMultipleSelectionController;
            }
            this.openController = list.options.openController || DefaultOpenController;
            this.mouseSupport = typeof list.options.mouseSupport === 'undefined' || !!list.options.mouseSupport;
            if (this.mouseSupport) {
                list.onMouseDown(this.onMouseDown, this, this.disposables);
                list.onContextMenu(this.onContextMenu, this, this.disposables);
                list.onMouseDblClick(this.onDoubleClick, this, this.disposables);
                list.onTouchStart(this.onMouseDown, this, this.disposables);
                this.disposables.add(touch_1.Gesture.addTarget(list.getHTMLElement()));
            }
            list.onMouseClick(this.onPointer, this, this.disposables);
            list.onMouseMiddleClick(this.onPointer, this, this.disposables);
            list.onTap(this.onPointer, this, this.disposables);
        }
        isSelectionSingleChangeEvent(event) {
            if (this.multipleSelectionController) {
                return this.multipleSelectionController.isSelectionSingleChangeEvent(event);
            }
            return platform.isMacintosh ? event.browserEvent.metaKey : event.browserEvent.ctrlKey;
        }
        isSelectionRangeChangeEvent(event) {
            if (this.multipleSelectionController) {
                return this.multipleSelectionController.isSelectionRangeChangeEvent(event);
            }
            return event.browserEvent.shiftKey;
        }
        isSelectionChangeEvent(event) {
            return this.isSelectionSingleChangeEvent(event) || this.isSelectionRangeChangeEvent(event);
        }
        onMouseDown(e) {
            if (document.activeElement !== e.browserEvent.target) {
                this.list.domFocus();
            }
        }
        onContextMenu(e) {
            const focus = typeof e.index === 'undefined' ? [] : [e.index];
            this.list.setFocus(focus, e.browserEvent);
        }
        onPointer(e) {
            if (!this.mouseSupport) {
                return;
            }
            if (isInputElement(e.browserEvent.target)) {
                return;
            }
            let reference = this.list.getFocus()[0];
            const selection = this.list.getSelection();
            reference = reference === undefined ? selection[0] : reference;
            const focus = e.index;
            if (typeof focus === 'undefined') {
                this.list.setFocus([], e.browserEvent);
                this.list.setSelection([], e.browserEvent);
                return;
            }
            if (this.multipleSelectionSupport && this.isSelectionRangeChangeEvent(e)) {
                return this.changeSelection(e, reference);
            }
            if (this.multipleSelectionSupport && this.isSelectionChangeEvent(e)) {
                return this.changeSelection(e, reference);
            }
            this.list.setFocus([focus], e.browserEvent);
            if (!isMouseRightClick(e.browserEvent)) {
                this.list.setSelection([focus], e.browserEvent);
                if (this.openController.shouldOpen(e.browserEvent)) {
                    this.list.open([focus], e.browserEvent);
                }
            }
        }
        onDoubleClick(e) {
            if (isInputElement(e.browserEvent.target)) {
                return;
            }
            if (this.multipleSelectionSupport && this.isSelectionChangeEvent(e)) {
                return;
            }
            const focus = this.list.getFocus();
            this.list.setSelection(focus, e.browserEvent);
            this.list.pin(focus);
        }
        changeSelection(e, reference) {
            const focus = e.index;
            if (this.isSelectionRangeChangeEvent(e) && reference !== undefined) {
                const min = Math.min(reference, focus);
                const max = Math.max(reference, focus);
                const rangeSelection = arrays_1.range(min, max + 1);
                const selection = this.list.getSelection();
                const contiguousRange = getContiguousRangeContaining(disjunction(selection, [reference]), reference);
                if (contiguousRange.length === 0) {
                    return;
                }
                const newSelection = disjunction(rangeSelection, relativeComplement(selection, contiguousRange));
                this.list.setSelection(newSelection, e.browserEvent);
            }
            else if (this.isSelectionSingleChangeEvent(e)) {
                const selection = this.list.getSelection();
                const newSelection = selection.filter(i => i !== focus);
                this.list.setFocus([focus]);
                if (selection.length === newSelection.length) {
                    this.list.setSelection([...newSelection, focus], e.browserEvent);
                }
                else {
                    this.list.setSelection(newSelection, e.browserEvent);
                }
            }
        }
        dispose() {
            this.disposables.dispose();
        }
    }
    exports.MouseController = MouseController;
    class DefaultStyleController {
        constructor(styleElement, selectorSuffix) {
            this.styleElement = styleElement;
            this.selectorSuffix = selectorSuffix;
        }
        style(styles) {
            const suffix = this.selectorSuffix ? `.${this.selectorSuffix}` : '';
            const content = [];
            if (styles.listFocusBackground) {
                content.push(`.monaco-list${suffix}:focus .monaco-list-row.focused { background-color: ${styles.listFocusBackground}; }`);
                content.push(`.monaco-list${suffix}:focus .monaco-list-row.focused:hover { background-color: ${styles.listFocusBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listFocusForeground) {
                content.push(`.monaco-list${suffix}:focus .monaco-list-row.focused { color: ${styles.listFocusForeground}; }`);
            }
            if (styles.listActiveSelectionBackground) {
                content.push(`.monaco-list${suffix}:focus .monaco-list-row.selected { background-color: ${styles.listActiveSelectionBackground}; }`);
                content.push(`.monaco-list${suffix}:focus .monaco-list-row.selected:hover { background-color: ${styles.listActiveSelectionBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listActiveSelectionForeground) {
                content.push(`.monaco-list${suffix}:focus .monaco-list-row.selected { color: ${styles.listActiveSelectionForeground}; }`);
            }
            if (styles.listFocusAndSelectionBackground) {
                content.push(`
				.monaco-drag-image,
				.monaco-list${suffix}:focus .monaco-list-row.selected.focused { background-color: ${styles.listFocusAndSelectionBackground}; }
			`);
            }
            if (styles.listFocusAndSelectionForeground) {
                content.push(`
				.monaco-drag-image,
				.monaco-list${suffix}:focus .monaco-list-row.selected.focused { color: ${styles.listFocusAndSelectionForeground}; }
			`);
            }
            if (styles.listInactiveFocusBackground) {
                content.push(`.monaco-list${suffix} .monaco-list-row.focused { background-color:  ${styles.listInactiveFocusBackground}; }`);
                content.push(`.monaco-list${suffix} .monaco-list-row.focused:hover { background-color:  ${styles.listInactiveFocusBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listInactiveSelectionBackground) {
                content.push(`.monaco-list${suffix} .monaco-list-row.selected { background-color:  ${styles.listInactiveSelectionBackground}; }`);
                content.push(`.monaco-list${suffix} .monaco-list-row.selected:hover { background-color:  ${styles.listInactiveSelectionBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listInactiveSelectionForeground) {
                content.push(`.monaco-list${suffix} .monaco-list-row.selected { color: ${styles.listInactiveSelectionForeground}; }`);
            }
            if (styles.listHoverBackground) {
                content.push(`.monaco-list${suffix}:not(.drop-target) .monaco-list-row:hover:not(.selected):not(.focused) { background-color:  ${styles.listHoverBackground}; }`);
            }
            if (styles.listHoverForeground) {
                content.push(`.monaco-list${suffix} .monaco-list-row:hover:not(.selected):not(.focused) { color:  ${styles.listHoverForeground}; }`);
            }
            if (styles.listSelectionOutline) {
                content.push(`.monaco-list${suffix} .monaco-list-row.selected { outline: 1px dotted ${styles.listSelectionOutline}; outline-offset: -1px; }`);
            }
            if (styles.listFocusOutline) {
                content.push(`
				.monaco-drag-image,
				.monaco-list${suffix}:focus .monaco-list-row.focused { outline: 1px solid ${styles.listFocusOutline}; outline-offset: -1px; }
			`);
            }
            if (styles.listInactiveFocusOutline) {
                content.push(`.monaco-list${suffix} .monaco-list-row.focused { outline: 1px dotted ${styles.listInactiveFocusOutline}; outline-offset: -1px; }`);
            }
            if (styles.listHoverOutline) {
                content.push(`.monaco-list${suffix} .monaco-list-row:hover { outline: 1px dashed ${styles.listHoverOutline}; outline-offset: -1px; }`);
            }
            if (styles.listDropBackground) {
                content.push(`
				.monaco-list${suffix}.drop-target,
				.monaco-list${suffix} .monaco-list-row.drop-target { background-color: ${styles.listDropBackground} !important; color: inherit !important; }
			`);
            }
            if (styles.listFilterWidgetBackground) {
                content.push(`.monaco-list-type-filter { background-color: ${styles.listFilterWidgetBackground} }`);
            }
            if (styles.listFilterWidgetOutline) {
                content.push(`.monaco-list-type-filter { border: 1px solid ${styles.listFilterWidgetOutline}; }`);
            }
            if (styles.listFilterWidgetNoMatchesOutline) {
                content.push(`.monaco-list-type-filter.no-matches { border: 1px solid ${styles.listFilterWidgetNoMatchesOutline}; }`);
            }
            if (styles.listMatchesShadow) {
                content.push(`.monaco-list-type-filter { box-shadow: 1px 1px 1px ${styles.listMatchesShadow}; }`);
            }
            const newStyles = content.join('\n');
            if (newStyles !== this.styleElement.innerHTML) {
                this.styleElement.innerHTML = newStyles;
            }
        }
    }
    exports.DefaultStyleController = DefaultStyleController;
    const defaultStyles = {
        listFocusBackground: color_1.Color.fromHex('#7FB0D0'),
        listActiveSelectionBackground: color_1.Color.fromHex('#0E639C'),
        listActiveSelectionForeground: color_1.Color.fromHex('#FFFFFF'),
        listFocusAndSelectionBackground: color_1.Color.fromHex('#094771'),
        listFocusAndSelectionForeground: color_1.Color.fromHex('#FFFFFF'),
        listInactiveSelectionBackground: color_1.Color.fromHex('#3F3F46'),
        listHoverBackground: color_1.Color.fromHex('#2A2D2E'),
        listDropBackground: color_1.Color.fromHex('#383B3D'),
        treeIndentGuidesStroke: color_1.Color.fromHex('#a9a9a9')
    };
    const DefaultOptions = {
        keyboardSupport: true,
        mouseSupport: true,
        multipleSelectionSupport: true,
        dnd: {
            getDragURI() { return null; },
            onDragStart() { },
            onDragOver() { return false; },
            drop() { }
        },
        ariaRootRole: list_1.ListAriaRootRole.TREE
    };
    // TODO@Joao: move these utils into a SortedArray class
    function getContiguousRangeContaining(range, value) {
        const index = range.indexOf(value);
        if (index === -1) {
            return [];
        }
        const result = [];
        let i = index - 1;
        while (i >= 0 && range[i] === value - (index - i)) {
            result.push(range[i--]);
        }
        result.reverse();
        i = index;
        while (i < range.length && range[i] === value + (i - index)) {
            result.push(range[i++]);
        }
        return result;
    }
    /**
     * Given two sorted collections of numbers, returns the intersection
     * between them (OR).
     */
    function disjunction(one, other) {
        const result = [];
        let i = 0, j = 0;
        while (i < one.length || j < other.length) {
            if (i >= one.length) {
                result.push(other[j++]);
            }
            else if (j >= other.length) {
                result.push(one[i++]);
            }
            else if (one[i] === other[j]) {
                result.push(one[i]);
                i++;
                j++;
                continue;
            }
            else if (one[i] < other[j]) {
                result.push(one[i++]);
            }
            else {
                result.push(other[j++]);
            }
        }
        return result;
    }
    /**
     * Given two sorted collections of numbers, returns the relative
     * complement between them (XOR).
     */
    function relativeComplement(one, other) {
        const result = [];
        let i = 0, j = 0;
        while (i < one.length || j < other.length) {
            if (i >= one.length) {
                result.push(other[j++]);
            }
            else if (j >= other.length) {
                result.push(one[i++]);
            }
            else if (one[i] === other[j]) {
                i++;
                j++;
                continue;
            }
            else if (one[i] < other[j]) {
                result.push(one[i++]);
            }
            else {
                j++;
            }
        }
        return result;
    }
    const numericSort = (a, b) => a - b;
    class PipelineRenderer {
        constructor(_templateId, renderers) {
            this._templateId = _templateId;
            this.renderers = renderers;
        }
        get templateId() {
            return this._templateId;
        }
        renderTemplate(container) {
            return this.renderers.map(r => r.renderTemplate(container));
        }
        renderElement(element, index, templateData, height) {
            let i = 0;
            for (const renderer of this.renderers) {
                renderer.renderElement(element, index, templateData[i++], height);
            }
        }
        disposeElement(element, index, templateData, height) {
            let i = 0;
            for (const renderer of this.renderers) {
                if (renderer.disposeElement) {
                    renderer.disposeElement(element, index, templateData[i], height);
                }
                i += 1;
            }
        }
        disposeTemplate(templateData) {
            let i = 0;
            for (const renderer of this.renderers) {
                renderer.disposeTemplate(templateData[i++]);
            }
        }
    }
    class AccessibiltyRenderer {
        constructor(accessibilityProvider) {
            this.accessibilityProvider = accessibilityProvider;
            this.templateId = 'a18n';
        }
        renderTemplate(container) {
            return container;
        }
        renderElement(element, index, container) {
            const ariaLabel = this.accessibilityProvider.getAriaLabel(element);
            if (ariaLabel) {
                container.setAttribute('aria-label', ariaLabel);
            }
            else {
                container.removeAttribute('aria-label');
            }
            const ariaLevel = this.accessibilityProvider.getAriaLevel && this.accessibilityProvider.getAriaLevel(element);
            if (typeof ariaLevel === 'number') {
                container.setAttribute('aria-level', `${ariaLevel}`);
            }
            else {
                container.removeAttribute('aria-level');
            }
        }
        disposeTemplate(templateData) {
            // noop
        }
    }
    class ListViewDragAndDrop {
        constructor(list, dnd) {
            this.list = list;
            this.dnd = dnd;
        }
        getDragElements(element) {
            const selection = this.list.getSelectedElements();
            const elements = selection.indexOf(element) > -1 ? selection : [element];
            return elements;
        }
        getDragURI(element) {
            return this.dnd.getDragURI(element);
        }
        getDragLabel(elements) {
            if (this.dnd.getDragLabel) {
                return this.dnd.getDragLabel(elements);
            }
            return undefined;
        }
        onDragStart(data, originalEvent) {
            if (this.dnd.onDragStart) {
                this.dnd.onDragStart(data, originalEvent);
            }
        }
        onDragOver(data, targetElement, targetIndex, originalEvent) {
            return this.dnd.onDragOver(data, targetElement, targetIndex, originalEvent);
        }
        drop(data, targetElement, targetIndex, originalEvent) {
            this.dnd.drop(data, targetElement, targetIndex, originalEvent);
        }
    }
    class List {
        constructor(user, container, virtualDelegate, renderers, _options = DefaultOptions) {
            this.user = user;
            this._options = _options;
            this.eventBufferer = new event_1.EventBufferer();
            this.disposables = new lifecycle_1.DisposableStore();
            this._onDidOpen = new event_1.Emitter();
            this.onDidOpen = this._onDidOpen.event;
            this._onDidPin = new event_1.Emitter();
            this.onDidPin = this._onDidPin.event;
            this.didJustPressContextMenuKey = false;
            this._onDidDispose = new event_1.Emitter();
            this.onDidDispose = this._onDidDispose.event;
            this.focus = new FocusTrait();
            this.selection = new Trait('selected');
            objects_1.mixin(_options, defaultStyles, false);
            const baseRenderers = [this.focus.renderer, this.selection.renderer];
            if (_options.accessibilityProvider) {
                baseRenderers.push(new AccessibiltyRenderer(_options.accessibilityProvider));
            }
            renderers = renderers.map(r => new PipelineRenderer(r.templateId, [...baseRenderers, r]));
            const viewOptions = Object.assign(Object.assign({}, _options), { dnd: _options.dnd && new ListViewDragAndDrop(this, _options.dnd) });
            this.view = new listView_1.ListView(container, virtualDelegate, renderers, viewOptions);
            this.updateAriaRole();
            this.styleElement = DOM.createStyleSheet(this.view.domNode);
            this.styleController = _options.styleController || new DefaultStyleController(this.styleElement, this.view.domId);
            this.spliceable = new splice_1.CombinedSpliceable([
                new TraitSpliceable(this.focus, this.view, _options.identityProvider),
                new TraitSpliceable(this.selection, this.view, _options.identityProvider),
                this.view
            ]);
            this.disposables.add(this.focus);
            this.disposables.add(this.selection);
            this.disposables.add(this.view);
            this.disposables.add(this._onDidDispose);
            this.onDidFocus = event_1.Event.map(event_2.domEvent(this.view.domNode, 'focus', true), () => null);
            this.onDidBlur = event_1.Event.map(event_2.domEvent(this.view.domNode, 'blur', true), () => null);
            this.disposables.add(new DOMFocusController(this, this.view));
            if (typeof _options.keyboardSupport !== 'boolean' || _options.keyboardSupport) {
                const controller = new KeyboardController(this, this.view, _options);
                this.disposables.add(controller);
            }
            if (_options.keyboardNavigationLabelProvider) {
                const delegate = _options.keyboardNavigationDelegate || exports.DefaultKeyboardNavigationDelegate;
                this.typeLabelController = new TypeLabelController(this, this.view, _options.keyboardNavigationLabelProvider, delegate);
                this.disposables.add(this.typeLabelController);
            }
            this.disposables.add(this.createMouseController(_options));
            this.onFocusChange(this._onFocusChange, this, this.disposables);
            this.onSelectionChange(this._onSelectionChange, this, this.disposables);
            if (_options.ariaLabel) {
                this.view.domNode.setAttribute('aria-label', nls_1.localize('aria list', "{0}. Use the navigation keys to navigate.", _options.ariaLabel));
            }
            this.style(_options);
        }
        get onFocusChange() {
            return event_1.Event.map(this.eventBufferer.wrapEvent(this.focus.onChange), e => this.toListEvent(e));
        }
        get onSelectionChange() {
            return event_1.Event.map(this.eventBufferer.wrapEvent(this.selection.onChange), e => this.toListEvent(e));
        }
        get domId() { return this.view.domId; }
        get onDidScroll() { return this.view.onDidScroll; }
        get onMouseClick() { return this.view.onMouseClick; }
        get onMouseDblClick() { return this.view.onMouseDblClick; }
        get onMouseMiddleClick() { return this.view.onMouseMiddleClick; }
        get onMouseUp() { return this.view.onMouseUp; }
        get onMouseDown() { return this.view.onMouseDown; }
        get onMouseOver() { return this.view.onMouseOver; }
        get onMouseMove() { return this.view.onMouseMove; }
        get onMouseOut() { return this.view.onMouseOut; }
        get onTouchStart() { return this.view.onTouchStart; }
        get onTap() { return this.view.onTap; }
        get onContextMenu() {
            const fromKeydown = event_1.Event.chain(event_2.domEvent(this.view.domNode, 'keydown'))
                .map(e => new keyboardEvent_1.StandardKeyboardEvent(e))
                .filter(e => this.didJustPressContextMenuKey = e.keyCode === 58 /* ContextMenu */ || (e.shiftKey && e.keyCode === 68 /* F10 */))
                .filter(e => { e.preventDefault(); e.stopPropagation(); return false; })
                .event;
            const fromKeyup = event_1.Event.chain(event_2.domEvent(this.view.domNode, 'keyup'))
                .filter(() => {
                const didJustPressContextMenuKey = this.didJustPressContextMenuKey;
                this.didJustPressContextMenuKey = false;
                return didJustPressContextMenuKey;
            })
                .filter(() => this.getFocus().length > 0 && !!this.view.domElement(this.getFocus()[0]))
                .map(browserEvent => {
                const index = this.getFocus()[0];
                const element = this.view.element(index);
                const anchor = this.view.domElement(index);
                return { index, element, anchor, browserEvent };
            })
                .event;
            const fromMouse = event_1.Event.chain(this.view.onContextMenu)
                .filter(() => !this.didJustPressContextMenuKey)
                .map(({ element, index, browserEvent }) => ({ element, index, anchor: { x: browserEvent.clientX + 1, y: browserEvent.clientY }, browserEvent }))
                .event;
            return event_1.Event.any(fromKeydown, fromKeyup, fromMouse);
        }
        get onKeyDown() { return event_2.domEvent(this.view.domNode, 'keydown'); }
        get onKeyUp() { return event_2.domEvent(this.view.domNode, 'keyup'); }
        get onKeyPress() { return event_2.domEvent(this.view.domNode, 'keypress'); }
        createMouseController(options) {
            return new MouseController(this);
        }
        updateOptions(optionsUpdate = {}) {
            this._options = Object.assign(Object.assign({}, this._options), optionsUpdate);
            if (this.typeLabelController) {
                this.typeLabelController.updateOptions(this._options);
            }
        }
        get options() {
            return this._options;
        }
        splice(start, deleteCount, elements = []) {
            if (start < 0 || start > this.view.length) {
                throw new list_1.ListError(this.user, `Invalid start index: ${start}`);
            }
            if (deleteCount < 0) {
                throw new list_1.ListError(this.user, `Invalid delete count: ${deleteCount}`);
            }
            if (deleteCount === 0 && elements.length === 0) {
                return;
            }
            this.eventBufferer.bufferEvents(() => this.spliceable.splice(start, deleteCount, elements));
        }
        updateWidth(index) {
            this.view.updateWidth(index);
        }
        rerender() {
            this.view.rerender();
        }
        element(index) {
            return this.view.element(index);
        }
        get length() {
            return this.view.length;
        }
        get contentHeight() {
            return this.view.contentHeight;
        }
        get onDidChangeContentHeight() {
            return this.view.onDidChangeContentHeight;
        }
        get scrollTop() {
            return this.view.getScrollTop();
        }
        set scrollTop(scrollTop) {
            this.view.setScrollTop(scrollTop);
        }
        get scrollLeft() {
            return this.view.getScrollLeft();
        }
        set scrollLeft(scrollLeft) {
            this.view.setScrollLeft(scrollLeft);
        }
        get scrollHeight() {
            return this.view.scrollHeight;
        }
        get renderHeight() {
            return this.view.renderHeight;
        }
        get firstVisibleIndex() {
            return this.view.firstVisibleIndex;
        }
        get lastVisibleIndex() {
            return this.view.lastVisibleIndex;
        }
        domFocus() {
            this.view.domNode.focus();
        }
        layout(height, width) {
            this.view.layout(height, width);
        }
        toggleKeyboardNavigation() {
            if (this.typeLabelController) {
                this.typeLabelController.toggle();
            }
        }
        setSelection(indexes, browserEvent) {
            for (const index of indexes) {
                if (index < 0 || index >= this.length) {
                    throw new list_1.ListError(this.user, `Invalid index ${index}`);
                }
            }
            this.selection.set(indexes, browserEvent);
        }
        getSelection() {
            return this.selection.get();
        }
        getSelectedElements() {
            return this.getSelection().map(i => this.view.element(i));
        }
        setFocus(indexes, browserEvent) {
            for (const index of indexes) {
                if (index < 0 || index >= this.length) {
                    throw new list_1.ListError(this.user, `Invalid index ${index}`);
                }
            }
            this.focus.set(indexes, browserEvent);
        }
        focusNext(n = 1, loop = false, browserEvent, filter) {
            if (this.length === 0) {
                return;
            }
            const focus = this.focus.get();
            const index = this.findNextIndex(focus.length > 0 ? focus[0] + n : 0, loop, filter);
            if (index > -1) {
                this.setFocus([index], browserEvent);
            }
        }
        focusPrevious(n = 1, loop = false, browserEvent, filter) {
            if (this.length === 0) {
                return;
            }
            const focus = this.focus.get();
            const index = this.findPreviousIndex(focus.length > 0 ? focus[0] - n : 0, loop, filter);
            if (index > -1) {
                this.setFocus([index], browserEvent);
            }
        }
        focusNextPage(browserEvent, filter) {
            let lastPageIndex = this.view.indexAt(this.view.getScrollTop() + this.view.renderHeight);
            lastPageIndex = lastPageIndex === 0 ? 0 : lastPageIndex - 1;
            const lastPageElement = this.view.element(lastPageIndex);
            const currentlyFocusedElement = this.getFocusedElements()[0];
            if (currentlyFocusedElement !== lastPageElement) {
                const lastGoodPageIndex = this.findPreviousIndex(lastPageIndex, false, filter);
                if (lastGoodPageIndex > -1 && currentlyFocusedElement !== this.view.element(lastGoodPageIndex)) {
                    this.setFocus([lastGoodPageIndex], browserEvent);
                }
                else {
                    this.setFocus([lastPageIndex], browserEvent);
                }
            }
            else {
                const previousScrollTop = this.view.getScrollTop();
                this.view.setScrollTop(previousScrollTop + this.view.renderHeight - this.view.elementHeight(lastPageIndex));
                if (this.view.getScrollTop() !== previousScrollTop) {
                    // Let the scroll event listener run
                    setTimeout(() => this.focusNextPage(browserEvent, filter), 0);
                }
            }
        }
        focusPreviousPage(browserEvent, filter) {
            let firstPageIndex;
            const scrollTop = this.view.getScrollTop();
            if (scrollTop === 0) {
                firstPageIndex = this.view.indexAt(scrollTop);
            }
            else {
                firstPageIndex = this.view.indexAfter(scrollTop - 1);
            }
            const firstPageElement = this.view.element(firstPageIndex);
            const currentlyFocusedElement = this.getFocusedElements()[0];
            if (currentlyFocusedElement !== firstPageElement) {
                const firstGoodPageIndex = this.findNextIndex(firstPageIndex, false, filter);
                if (firstGoodPageIndex > -1 && currentlyFocusedElement !== this.view.element(firstGoodPageIndex)) {
                    this.setFocus([firstGoodPageIndex], browserEvent);
                }
                else {
                    this.setFocus([firstPageIndex], browserEvent);
                }
            }
            else {
                const previousScrollTop = scrollTop;
                this.view.setScrollTop(scrollTop - this.view.renderHeight);
                if (this.view.getScrollTop() !== previousScrollTop) {
                    // Let the scroll event listener run
                    setTimeout(() => this.focusPreviousPage(browserEvent, filter), 0);
                }
            }
        }
        focusLast(browserEvent, filter) {
            if (this.length === 0) {
                return;
            }
            const index = this.findPreviousIndex(this.length - 1, false, filter);
            if (index > -1) {
                this.setFocus([index], browserEvent);
            }
        }
        focusFirst(browserEvent, filter) {
            if (this.length === 0) {
                return;
            }
            const index = this.findNextIndex(0, false, filter);
            if (index > -1) {
                this.setFocus([index], browserEvent);
            }
        }
        findNextIndex(index, loop = false, filter) {
            for (let i = 0; i < this.length; i++) {
                if (index >= this.length && !loop) {
                    return -1;
                }
                index = index % this.length;
                if (!filter || filter(this.element(index))) {
                    return index;
                }
                index++;
            }
            return -1;
        }
        findPreviousIndex(index, loop = false, filter) {
            for (let i = 0; i < this.length; i++) {
                if (index < 0 && !loop) {
                    return -1;
                }
                index = (this.length + (index % this.length)) % this.length;
                if (!filter || filter(this.element(index))) {
                    return index;
                }
                index--;
            }
            return -1;
        }
        getFocus() {
            return this.focus.get();
        }
        getFocusedElements() {
            return this.getFocus().map(i => this.view.element(i));
        }
        reveal(index, relativeTop) {
            if (index < 0 || index >= this.length) {
                throw new list_1.ListError(this.user, `Invalid index ${index}`);
            }
            const scrollTop = this.view.getScrollTop();
            const elementTop = this.view.elementTop(index);
            const elementHeight = this.view.elementHeight(index);
            if (types_1.isNumber(relativeTop)) {
                // y = mx + b
                const m = elementHeight - this.view.renderHeight;
                this.view.setScrollTop(m * numbers_1.clamp(relativeTop, 0, 1) + elementTop);
            }
            else {
                const viewItemBottom = elementTop + elementHeight;
                const wrapperBottom = scrollTop + this.view.renderHeight;
                if (elementTop < scrollTop) {
                    this.view.setScrollTop(elementTop);
                }
                else if (viewItemBottom >= wrapperBottom) {
                    this.view.setScrollTop(viewItemBottom - this.view.renderHeight);
                }
            }
        }
        /**
         * Returns the relative position of an element rendered in the list.
         * Returns `null` if the element isn't *entirely* in the visible viewport.
         */
        getRelativeTop(index) {
            if (index < 0 || index >= this.length) {
                throw new list_1.ListError(this.user, `Invalid index ${index}`);
            }
            const scrollTop = this.view.getScrollTop();
            const elementTop = this.view.elementTop(index);
            const elementHeight = this.view.elementHeight(index);
            if (elementTop < scrollTop || elementTop + elementHeight > scrollTop + this.view.renderHeight) {
                return null;
            }
            // y = mx + b
            const m = elementHeight - this.view.renderHeight;
            return Math.abs((scrollTop - elementTop) / m);
        }
        isDOMFocused() {
            return this.view.domNode === document.activeElement;
        }
        getHTMLElement() {
            return this.view.domNode;
        }
        open(indexes, browserEvent) {
            for (const index of indexes) {
                if (index < 0 || index >= this.length) {
                    throw new list_1.ListError(this.user, `Invalid index ${index}`);
                }
            }
            this._onDidOpen.fire({ indexes, elements: indexes.map(i => this.view.element(i)), browserEvent });
        }
        pin(indexes, browserEvent) {
            for (const index of indexes) {
                if (index < 0 || index >= this.length) {
                    throw new list_1.ListError(this.user, `Invalid index ${index}`);
                }
            }
            this._onDidPin.fire({ indexes, elements: indexes.map(i => this.view.element(i)), browserEvent });
        }
        style(styles) {
            this.styleController.style(styles);
        }
        toListEvent({ indexes, browserEvent }) {
            return { indexes, elements: indexes.map(i => this.view.element(i)), browserEvent };
        }
        _onFocusChange() {
            const focus = this.focus.get();
            if (focus.length > 0) {
                this.view.domNode.setAttribute('aria-activedescendant', this.view.getElementDomId(focus[0]));
            }
            else {
                this.view.domNode.removeAttribute('aria-activedescendant');
            }
            this.updateAriaRole();
            DOM.toggleClass(this.view.domNode, 'element-focused', focus.length > 0);
        }
        updateAriaRole() {
            if (typeof this.options.ariaRole !== 'string') {
                this.view.domNode.setAttribute('role', list_1.ListAriaRootRole.TREE);
            }
            else {
                this.view.domNode.setAttribute('role', this.options.ariaRole);
            }
        }
        _onSelectionChange() {
            const selection = this.selection.get();
            DOM.toggleClass(this.view.domNode, 'selection-none', selection.length === 0);
            DOM.toggleClass(this.view.domNode, 'selection-single', selection.length === 1);
            DOM.toggleClass(this.view.domNode, 'selection-multiple', selection.length > 1);
        }
        dispose() {
            this._onDidDispose.fire();
            this.disposables.dispose();
            this._onDidOpen.dispose();
            this._onDidPin.dispose();
            this._onDidDispose.dispose();
        }
    }
    __decorate([
        decorators_1.memoize
    ], List.prototype, "onFocusChange", null);
    __decorate([
        decorators_1.memoize
    ], List.prototype, "onSelectionChange", null);
    __decorate([
        decorators_1.memoize
    ], List.prototype, "onContextMenu", null);
    exports.List = List;
});
//# sourceMappingURL=listWidget.js.map