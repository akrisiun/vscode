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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/platform/list/browser/listService", "vs/platform/instantiation/common/instantiation", "vs/base/common/codicon", "vs/base/common/comparers", "vs/base/common/event", "vs/base/common/objects", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/iconLabel/iconLabel", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/base/common/decorators", "vs/base/common/arrays", "vs/base/common/platform", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/workbench/browser/parts/quickinput/quickInputUtils", "vs/base/common/types", "vs/css!./media/quickInput"], function (require, exports, dom, lifecycle_1, listService_1, instantiation_1, codicon_1, comparers_1, event_1, objects_1, keyboardEvent_1, iconLabel_1, highlightedLabel_1, decorators_1, arrays_1, platform, colorRegistry_1, themeService_1, actionbar_1, actions_1, quickInputUtils_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const $ = dom.$;
    class ListElement {
        constructor(init) {
            this.hidden = false;
            this._onChecked = new event_1.Emitter();
            this.onChecked = this._onChecked.event;
            objects_1.assign(this, init);
        }
        get checked() {
            return !!this._checked;
        }
        set checked(value) {
            if (value !== this._checked) {
                this._checked = value;
                this._onChecked.fire(value);
            }
        }
    }
    class ListElementRenderer {
        get templateId() {
            return ListElementRenderer.ID;
        }
        renderTemplate(container) {
            const data = Object.create(null);
            data.toDisposeElement = [];
            data.toDisposeTemplate = [];
            data.entry = dom.append(container, $('.quick-input-list-entry'));
            // Checkbox
            const label = dom.append(data.entry, $('label.quick-input-list-label'));
            data.checkbox = dom.append(label, $('input.quick-input-list-checkbox'));
            data.checkbox.type = 'checkbox';
            data.toDisposeTemplate.push(dom.addStandardDisposableListener(data.checkbox, dom.EventType.CHANGE, e => {
                data.element.checked = data.checkbox.checked;
            }));
            // Rows
            const rows = dom.append(label, $('.quick-input-list-rows'));
            const row1 = dom.append(rows, $('.quick-input-list-row'));
            const row2 = dom.append(rows, $('.quick-input-list-row'));
            // Label
            data.label = new iconLabel_1.IconLabel(row1, { supportHighlights: true, supportDescriptionHighlights: true, supportCodicons: true });
            // Detail
            const detailContainer = dom.append(row2, $('.quick-input-list-label-meta'));
            data.detail = new highlightedLabel_1.HighlightedLabel(detailContainer, true);
            // Separator
            data.separator = dom.append(data.entry, $('.quick-input-list-separator'));
            // Actions
            data.actionBar = new actionbar_1.ActionBar(data.entry);
            data.actionBar.domNode.classList.add('quick-input-list-entry-action-bar');
            data.toDisposeTemplate.push(data.actionBar);
            return data;
        }
        renderElement(element, index, data) {
            data.toDisposeElement = lifecycle_1.dispose(data.toDisposeElement);
            data.element = element;
            data.checkbox.checked = element.checked;
            data.toDisposeElement.push(element.onChecked(checked => data.checkbox.checked = checked));
            const { labelHighlights, descriptionHighlights, detailHighlights } = element;
            // Label
            const options = Object.create(null);
            options.matches = labelHighlights || [];
            options.descriptionTitle = element.saneDescription;
            options.descriptionMatches = descriptionHighlights || [];
            options.extraClasses = element.item.iconClasses;
            data.label.setLabel(element.saneLabel, element.saneDescription, options);
            // Meta
            data.detail.set(element.saneDetail, detailHighlights);
            // ARIA label
            data.entry.setAttribute('aria-label', [element.saneLabel, element.saneDescription, element.saneDetail]
                .map(s => s && codicon_1.parseCodicons(s).text)
                .filter(s => !!s)
                .join(', '));
            // Separator
            if (element.separator && element.separator.label) {
                data.separator.textContent = element.separator.label;
                data.separator.style.display = '';
            }
            else {
                data.separator.style.display = 'none';
            }
            if (element.separator) {
                dom.addClass(data.entry, 'quick-input-list-separator-border');
            }
            else {
                dom.removeClass(data.entry, 'quick-input-list-separator-border');
            }
            // Actions
            data.actionBar.clear();
            const buttons = element.item.buttons;
            if (buttons && buttons.length) {
                data.actionBar.push(buttons.map((button, index) => {
                    const action = new actions_1.Action(`id-${index}`, '', button.iconClass || (button.iconPath ? quickInputUtils_1.getIconClass(button.iconPath) : undefined), true, () => {
                        element.fireButtonTriggered({
                            button,
                            item: element.item
                        });
                        return Promise.resolve();
                    });
                    action.tooltip = button.tooltip || '';
                    return action;
                }), { icon: true, label: false });
                dom.addClass(data.entry, 'has-actions');
            }
            else {
                dom.removeClass(data.entry, 'has-actions');
            }
        }
        disposeElement(element, index, data) {
            data.toDisposeElement = lifecycle_1.dispose(data.toDisposeElement);
        }
        disposeTemplate(data) {
            data.toDisposeElement = lifecycle_1.dispose(data.toDisposeElement);
            data.toDisposeTemplate = lifecycle_1.dispose(data.toDisposeTemplate);
        }
    }
    ListElementRenderer.ID = 'listelement';
    class ListElementDelegate {
        getHeight(element) {
            return element.saneDetail ? 44 : 22;
        }
        getTemplateId(element) {
            return ListElementRenderer.ID;
        }
    }
    let QuickInputList = class QuickInputList {
        constructor(parent, id, instantiationService) {
            this.parent = parent;
            this.instantiationService = instantiationService;
            this.elements = [];
            this.elementsToIndexes = new Map();
            this.matchOnDescription = false;
            this.matchOnDetail = false;
            this.matchOnLabel = true;
            this._onChangedAllVisibleChecked = new event_1.Emitter();
            this.onChangedAllVisibleChecked = this._onChangedAllVisibleChecked.event;
            this._onChangedCheckedCount = new event_1.Emitter();
            this.onChangedCheckedCount = this._onChangedCheckedCount.event;
            this._onChangedVisibleCount = new event_1.Emitter();
            this.onChangedVisibleCount = this._onChangedVisibleCount.event;
            this._onChangedCheckedElements = new event_1.Emitter();
            this.onChangedCheckedElements = this._onChangedCheckedElements.event;
            this._onButtonTriggered = new event_1.Emitter();
            this.onButtonTriggered = this._onButtonTriggered.event;
            this._onLeave = new event_1.Emitter();
            this.onLeave = this._onLeave.event;
            this._fireCheckedEvents = true;
            this.elementDisposables = [];
            this.disposables = [];
            this.id = id;
            this.container = dom.append(this.parent, $('.quick-input-list'));
            const delegate = new ListElementDelegate();
            this.list = this.instantiationService.createInstance(listService_1.WorkbenchList, 'QuickInput', this.container, delegate, [new ListElementRenderer()], {
                identityProvider: { getId: element => element.saneLabel },
                openController: { shouldOpen: () => false },
                setRowLineHeight: false,
                multipleSelectionSupport: false,
                horizontalScrolling: false
            });
            this.list.getHTMLElement().id = id;
            this.disposables.push(this.list);
            this.disposables.push(this.list.onKeyDown(e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                switch (event.keyCode) {
                    case 10 /* Space */:
                        this.toggleCheckbox();
                        break;
                    case 31 /* KEY_A */:
                        if (platform.isMacintosh ? e.metaKey : e.ctrlKey) {
                            this.list.setFocus(arrays_1.range(this.list.length));
                        }
                        break;
                    case 16 /* UpArrow */:
                    case 11 /* PageUp */:
                        const focus1 = this.list.getFocus();
                        if (focus1.length === 1 && focus1[0] === 0) {
                            this._onLeave.fire();
                        }
                        break;
                    case 18 /* DownArrow */:
                    case 12 /* PageDown */:
                        const focus2 = this.list.getFocus();
                        if (focus2.length === 1 && focus2[0] === this.list.length - 1) {
                            this._onLeave.fire();
                        }
                        break;
                }
            }));
            this.disposables.push(this.list.onMouseDown(e => {
                if (e.browserEvent.button !== 2) {
                    // Works around / fixes #64350.
                    e.browserEvent.preventDefault();
                }
            }));
            this.disposables.push(dom.addDisposableListener(this.container, dom.EventType.CLICK, e => {
                if (e.x || e.y) { // Avoid 'click' triggered by 'space' on checkbox.
                    this._onLeave.fire();
                }
            }));
        }
        get onDidChangeFocus() {
            return event_1.Event.map(this.list.onFocusChange, e => e.elements.map(e => e.item));
        }
        get onDidChangeSelection() {
            return event_1.Event.map(this.list.onSelectionChange, e => e.elements.map(e => e.item));
        }
        getAllVisibleChecked() {
            return this.allVisibleChecked(this.elements, false);
        }
        allVisibleChecked(elements, whenNoneVisible = true) {
            for (let i = 0, n = elements.length; i < n; i++) {
                const element = elements[i];
                if (!element.hidden) {
                    if (!element.checked) {
                        return false;
                    }
                    else {
                        whenNoneVisible = true;
                    }
                }
            }
            return whenNoneVisible;
        }
        getCheckedCount() {
            let count = 0;
            const elements = this.elements;
            for (let i = 0, n = elements.length; i < n; i++) {
                if (elements[i].checked) {
                    count++;
                }
            }
            return count;
        }
        getVisibleCount() {
            let count = 0;
            const elements = this.elements;
            for (let i = 0, n = elements.length; i < n; i++) {
                if (!elements[i].hidden) {
                    count++;
                }
            }
            return count;
        }
        setAllVisibleChecked(checked) {
            try {
                this._fireCheckedEvents = false;
                this.elements.forEach(element => {
                    if (!element.hidden) {
                        element.checked = checked;
                    }
                });
            }
            finally {
                this._fireCheckedEvents = true;
                this.fireCheckedEvents();
            }
        }
        setElements(inputElements) {
            this.elementDisposables = lifecycle_1.dispose(this.elementDisposables);
            const fireButtonTriggered = (event) => this.fireButtonTriggered(event);
            this.inputElements = inputElements;
            this.elements = inputElements.reduce((result, item, index) => {
                if (item.type !== 'separator') {
                    const previous = index && inputElements[index - 1];
                    result.push(new ListElement({
                        index,
                        item,
                        saneLabel: item.label && item.label.replace(/\r?\n/g, ' '),
                        saneDescription: item.description && item.description.replace(/\r?\n/g, ' '),
                        saneDetail: item.detail && item.detail.replace(/\r?\n/g, ' '),
                        checked: false,
                        separator: previous && previous.type === 'separator' ? previous : undefined,
                        fireButtonTriggered
                    }));
                }
                return result;
            }, []);
            this.elementDisposables.push(...this.elements.map(element => element.onChecked(() => this.fireCheckedEvents())));
            this.elementsToIndexes = this.elements.reduce((map, element, index) => {
                map.set(element.item, index);
                return map;
            }, new Map());
            this.list.splice(0, this.list.length); // Clear focus and selection first, sending the events when the list is empty.
            this.list.splice(0, this.list.length, this.elements);
            this._onChangedVisibleCount.fire(this.elements.length);
        }
        getFocusedElements() {
            return this.list.getFocusedElements()
                .map(e => e.item);
        }
        setFocusedElements(items) {
            this.list.setFocus(items
                .filter(item => this.elementsToIndexes.has(item))
                .map(item => this.elementsToIndexes.get(item)));
            if (items.length > 0) {
                this.list.reveal(this.list.getFocus()[0]);
            }
        }
        getActiveDescendant() {
            return this.list.getHTMLElement().getAttribute('aria-activedescendant');
        }
        getSelectedElements() {
            return this.list.getSelectedElements()
                .map(e => e.item);
        }
        setSelectedElements(items) {
            this.list.setSelection(items
                .filter(item => this.elementsToIndexes.has(item))
                .map(item => this.elementsToIndexes.get(item)));
        }
        getCheckedElements() {
            return this.elements.filter(e => e.checked)
                .map(e => e.item);
        }
        setCheckedElements(items) {
            try {
                this._fireCheckedEvents = false;
                const checked = new Set();
                for (const item of items) {
                    checked.add(item);
                }
                for (const element of this.elements) {
                    element.checked = checked.has(element.item);
                }
            }
            finally {
                this._fireCheckedEvents = true;
                this.fireCheckedEvents();
            }
        }
        set enabled(value) {
            this.list.getHTMLElement().style.pointerEvents = value ? null : 'none';
        }
        focus(what) {
            if (!this.list.length) {
                return;
            }
            if ((what === 'Next' || what === 'NextPage') && this.list.getFocus()[0] === this.list.length - 1) {
                what = 'First';
            }
            if ((what === 'Previous' || what === 'PreviousPage') && this.list.getFocus()[0] === 0) {
                what = 'Last';
            }
            this.list['focus' + what]();
            this.list.reveal(this.list.getFocus()[0]);
        }
        clearFocus() {
            this.list.setFocus([]);
        }
        domFocus() {
            this.list.domFocus();
        }
        layout() {
            this.list.layout();
        }
        filter(query) {
            if (!(this.matchOnLabel || this.matchOnDescription || this.matchOnDetail)) {
                return;
            }
            query = query.trim();
            // Reset filtering
            if (!query) {
                this.elements.forEach(element => {
                    element.labelHighlights = undefined;
                    element.descriptionHighlights = undefined;
                    element.detailHighlights = undefined;
                    element.hidden = false;
                    const previous = element.index && this.inputElements[element.index - 1];
                    element.separator = previous && previous.type === 'separator' ? previous : undefined;
                });
            }
            // Filter by value (since we support codicons, use codicon aware fuzzy matching)
            else {
                this.elements.forEach(element => {
                    const labelHighlights = this.matchOnLabel ? types_1.withNullAsUndefined(codicon_1.matchesFuzzyCodiconAware(query, codicon_1.parseCodicons(element.saneLabel))) : undefined;
                    const descriptionHighlights = this.matchOnDescription ? types_1.withNullAsUndefined(codicon_1.matchesFuzzyCodiconAware(query, codicon_1.parseCodicons(element.saneDescription || ''))) : undefined;
                    const detailHighlights = this.matchOnDetail ? types_1.withNullAsUndefined(codicon_1.matchesFuzzyCodiconAware(query, codicon_1.parseCodicons(element.saneDetail || ''))) : undefined;
                    if (labelHighlights || descriptionHighlights || detailHighlights) {
                        element.labelHighlights = labelHighlights;
                        element.descriptionHighlights = descriptionHighlights;
                        element.detailHighlights = detailHighlights;
                        element.hidden = false;
                    }
                    else {
                        element.labelHighlights = undefined;
                        element.descriptionHighlights = undefined;
                        element.detailHighlights = undefined;
                        element.hidden = !element.item.alwaysShow;
                    }
                    element.separator = undefined;
                });
            }
            const shownElements = this.elements.filter(element => !element.hidden);
            // Sort by value
            if (query) {
                const normalizedSearchValue = query.toLowerCase();
                shownElements.sort((a, b) => {
                    return compareEntries(a, b, normalizedSearchValue);
                });
            }
            this.elementsToIndexes = shownElements.reduce((map, element, index) => {
                map.set(element.item, index);
                return map;
            }, new Map());
            this.list.splice(0, this.list.length, shownElements);
            this.list.setFocus([]);
            this.list.layout();
            this._onChangedAllVisibleChecked.fire(this.getAllVisibleChecked());
            this._onChangedVisibleCount.fire(shownElements.length);
        }
        toggleCheckbox() {
            try {
                this._fireCheckedEvents = false;
                const elements = this.list.getFocusedElements();
                const allChecked = this.allVisibleChecked(elements);
                for (const element of elements) {
                    element.checked = !allChecked;
                }
            }
            finally {
                this._fireCheckedEvents = true;
                this.fireCheckedEvents();
            }
        }
        display(display) {
            this.container.style.display = display ? '' : 'none';
        }
        isDisplayed() {
            return this.container.style.display !== 'none';
        }
        dispose() {
            this.elementDisposables = lifecycle_1.dispose(this.elementDisposables);
            this.disposables = lifecycle_1.dispose(this.disposables);
        }
        fireCheckedEvents() {
            if (this._fireCheckedEvents) {
                this._onChangedAllVisibleChecked.fire(this.getAllVisibleChecked());
                this._onChangedCheckedCount.fire(this.getCheckedCount());
                this._onChangedCheckedElements.fire(this.getCheckedElements());
            }
        }
        fireButtonTriggered(event) {
            this._onButtonTriggered.fire(event);
        }
    };
    __decorate([
        decorators_1.memoize
    ], QuickInputList.prototype, "onDidChangeFocus", null);
    __decorate([
        decorators_1.memoize
    ], QuickInputList.prototype, "onDidChangeSelection", null);
    QuickInputList = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], QuickInputList);
    exports.QuickInputList = QuickInputList;
    function compareEntries(elementA, elementB, lookFor) {
        const labelHighlightsA = elementA.labelHighlights || [];
        const labelHighlightsB = elementB.labelHighlights || [];
        if (labelHighlightsA.length && !labelHighlightsB.length) {
            return -1;
        }
        if (!labelHighlightsA.length && labelHighlightsB.length) {
            return 1;
        }
        return comparers_1.compareAnything(elementA.saneLabel, elementB.saneLabel, lookFor);
    }
    themeService_1.registerThemingParticipant((theme, collector) => {
        // Override inactive focus background with active focus background for single-pick case.
        const listInactiveFocusBackground = theme.getColor(colorRegistry_1.listFocusBackground);
        if (listInactiveFocusBackground) {
            collector.addRule(`.quick-input-list .monaco-list .monaco-list-row.focused { background-color:  ${listInactiveFocusBackground}; }`);
            collector.addRule(`.quick-input-list .monaco-list .monaco-list-row.focused:hover { background-color:  ${listInactiveFocusBackground}; }`);
        }
        const activeContrast = theme.getColor(colorRegistry_1.activeContrastBorder);
        if (activeContrast) {
            collector.addRule(`.quick-input-list .monaco-list .monaco-list-row.focused { border: 1px dotted ${activeContrast}; }`);
            collector.addRule(`.quick-input-list .monaco-list .monaco-list-row { border: 1px solid transparent; }`);
            collector.addRule(`.quick-input-list .monaco-list .quick-input-list-entry { padding: 0 5px; height: 18px; align-items: center; }`);
            collector.addRule(`.quick-input-list .monaco-list .quick-input-list-entry-action-bar { margin-top: 0; }`);
        }
        const pickerGroupBorderColor = theme.getColor(colorRegistry_1.pickerGroupBorder);
        if (pickerGroupBorderColor) {
            collector.addRule(`.quick-input-list .quick-input-list-entry { border-top-color:  ${pickerGroupBorderColor}; }`);
        }
        const pickerGroupForegroundColor = theme.getColor(colorRegistry_1.pickerGroupForeground);
        if (pickerGroupForegroundColor) {
            collector.addRule(`.quick-input-list .quick-input-list-separator { color:  ${pickerGroupForegroundColor}; }`);
        }
    });
});
//# sourceMappingURL=quickInputList.js.map