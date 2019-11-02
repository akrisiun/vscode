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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/button/button", "vs/base/browser/ui/inputbox/inputBox", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "vs/platform/contextview/browser/contextView", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/base/common/async", "vs/base/common/types", "vs/css!./media/settingsWidgets"], function (require, exports, DOM, actionbar_1, button_1, inputBox_1, color_1, event_1, lifecycle_1, nls_1, contextView_1, colorRegistry_1, styler_1, themeService_1, async_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const $ = DOM.$;
    exports.settingsHeaderForeground = colorRegistry_1.registerColor('settings.headerForeground', { light: '#444444', dark: '#e7e7e7', hc: '#ffffff' }, nls_1.localize('headerForeground', "(For settings editor preview) The foreground color for a section header or active title."));
    exports.modifiedItemIndicator = colorRegistry_1.registerColor('settings.modifiedItemIndicator', {
        light: new color_1.Color(new color_1.RGBA(102, 175, 224)),
        dark: new color_1.Color(new color_1.RGBA(12, 125, 157)),
        hc: new color_1.Color(new color_1.RGBA(0, 73, 122))
    }, nls_1.localize('modifiedItemForeground', "(For settings editor preview) The color of the modified setting indicator."));
    // Enum control colors
    exports.settingsSelectBackground = colorRegistry_1.registerColor('settings.dropdownBackground', { dark: colorRegistry_1.selectBackground, light: colorRegistry_1.selectBackground, hc: colorRegistry_1.selectBackground }, nls_1.localize('settingsDropdownBackground', "(For settings editor preview) Settings editor dropdown background."));
    exports.settingsSelectForeground = colorRegistry_1.registerColor('settings.dropdownForeground', { dark: colorRegistry_1.selectForeground, light: colorRegistry_1.selectForeground, hc: colorRegistry_1.selectForeground }, nls_1.localize('settingsDropdownForeground', "(For settings editor preview) Settings editor dropdown foreground."));
    exports.settingsSelectBorder = colorRegistry_1.registerColor('settings.dropdownBorder', { dark: colorRegistry_1.selectBorder, light: colorRegistry_1.selectBorder, hc: colorRegistry_1.selectBorder }, nls_1.localize('settingsDropdownBorder', "(For settings editor preview) Settings editor dropdown border."));
    exports.settingsSelectListBorder = colorRegistry_1.registerColor('settings.dropdownListBorder', { dark: colorRegistry_1.editorWidgetBorder, light: colorRegistry_1.editorWidgetBorder, hc: colorRegistry_1.editorWidgetBorder }, nls_1.localize('settingsDropdownListBorder', "(For settings editor preview) Settings editor dropdown list border. This surrounds the options and separates the options from the description."));
    // Bool control colors
    exports.settingsCheckboxBackground = colorRegistry_1.registerColor('settings.checkboxBackground', { dark: colorRegistry_1.simpleCheckboxBackground, light: colorRegistry_1.simpleCheckboxBackground, hc: colorRegistry_1.simpleCheckboxBackground }, nls_1.localize('settingsCheckboxBackground', "(For settings editor preview) Settings editor checkbox background."));
    exports.settingsCheckboxForeground = colorRegistry_1.registerColor('settings.checkboxForeground', { dark: colorRegistry_1.simpleCheckboxForeground, light: colorRegistry_1.simpleCheckboxForeground, hc: colorRegistry_1.simpleCheckboxForeground }, nls_1.localize('settingsCheckboxForeground', "(For settings editor preview) Settings editor checkbox foreground."));
    exports.settingsCheckboxBorder = colorRegistry_1.registerColor('settings.checkboxBorder', { dark: colorRegistry_1.simpleCheckboxBorder, light: colorRegistry_1.simpleCheckboxBorder, hc: colorRegistry_1.simpleCheckboxBorder }, nls_1.localize('settingsCheckboxBorder', "(For settings editor preview) Settings editor checkbox border."));
    // Text control colors
    exports.settingsTextInputBackground = colorRegistry_1.registerColor('settings.textInputBackground', { dark: colorRegistry_1.inputBackground, light: colorRegistry_1.inputBackground, hc: colorRegistry_1.inputBackground }, nls_1.localize('textInputBoxBackground', "(For settings editor preview) Settings editor text input box background."));
    exports.settingsTextInputForeground = colorRegistry_1.registerColor('settings.textInputForeground', { dark: colorRegistry_1.inputForeground, light: colorRegistry_1.inputForeground, hc: colorRegistry_1.inputForeground }, nls_1.localize('textInputBoxForeground', "(For settings editor preview) Settings editor text input box foreground."));
    exports.settingsTextInputBorder = colorRegistry_1.registerColor('settings.textInputBorder', { dark: colorRegistry_1.inputBorder, light: colorRegistry_1.inputBorder, hc: colorRegistry_1.inputBorder }, nls_1.localize('textInputBoxBorder', "(For settings editor preview) Settings editor text input box border."));
    // Number control colors
    exports.settingsNumberInputBackground = colorRegistry_1.registerColor('settings.numberInputBackground', { dark: colorRegistry_1.inputBackground, light: colorRegistry_1.inputBackground, hc: colorRegistry_1.inputBackground }, nls_1.localize('numberInputBoxBackground', "(For settings editor preview) Settings editor number input box background."));
    exports.settingsNumberInputForeground = colorRegistry_1.registerColor('settings.numberInputForeground', { dark: colorRegistry_1.inputForeground, light: colorRegistry_1.inputForeground, hc: colorRegistry_1.inputForeground }, nls_1.localize('numberInputBoxForeground', "(For settings editor preview) Settings editor number input box foreground."));
    exports.settingsNumberInputBorder = colorRegistry_1.registerColor('settings.numberInputBorder', { dark: colorRegistry_1.inputBorder, light: colorRegistry_1.inputBorder, hc: colorRegistry_1.inputBorder }, nls_1.localize('numberInputBoxBorder', "(For settings editor preview) Settings editor number input box border."));
    themeService_1.registerThemingParticipant((theme, collector) => {
        const checkboxBackgroundColor = theme.getColor(exports.settingsCheckboxBackground);
        if (checkboxBackgroundColor) {
            collector.addRule(`.settings-editor > .settings-body > .settings-tree-container .setting-item-bool .setting-value-checkbox { background-color: ${checkboxBackgroundColor} !important; }`);
        }
        const checkboxForegroundColor = theme.getColor(exports.settingsCheckboxForeground);
        if (checkboxForegroundColor) {
            collector.addRule(`.settings-editor > .settings-body > .settings-tree-container .setting-item-bool .setting-value-checkbox { color: ${checkboxForegroundColor} !important; }`);
        }
        const checkboxBorderColor = theme.getColor(exports.settingsCheckboxBorder);
        if (checkboxBorderColor) {
            collector.addRule(`.settings-editor > .settings-body > .settings-tree-container .setting-item-bool .setting-value-checkbox { border-color: ${checkboxBorderColor} !important; }`);
        }
        const link = theme.getColor(colorRegistry_1.textLinkForeground);
        if (link) {
            collector.addRule(`.settings-editor > .settings-body > .settings-tree-container .setting-item-contents .setting-item-description-markdown a { color: ${link}; }`);
            collector.addRule(`.settings-editor > .settings-body > .settings-tree-container .setting-item-contents .setting-item-description-markdown a > code { color: ${link}; }`);
            collector.addRule(`.monaco-select-box-dropdown-container > .select-box-details-pane > .select-box-description-markdown a { color: ${link}; }`);
            collector.addRule(`.monaco-select-box-dropdown-container > .select-box-details-pane > .select-box-description-markdown a > code { color: ${link}; }`);
        }
        const activeLink = theme.getColor(colorRegistry_1.textLinkActiveForeground);
        if (activeLink) {
            collector.addRule(`.settings-editor > .settings-body > .settings-tree-container .setting-item-contents .setting-item-description-markdown a:hover, .settings-editor > .settings-body > .settings-tree-container .setting-item-contents .setting-item-description-markdown a:active { color: ${activeLink}; }`);
            collector.addRule(`.settings-editor > .settings-body > .settings-tree-container .setting-item-contents .setting-item-description-markdown a:hover > code, .settings-editor > .settings-body > .settings-tree-container .setting-item-contents .setting-item-description-markdown a:active > code { color: ${activeLink}; }`);
            collector.addRule(`.monaco-select-box-dropdown-container > .select-box-details-pane > .select-box-description-markdown a:hover, .monaco-select-box-dropdown-container > .select-box-details-pane > .select-box-description-markdown a:active { color: ${activeLink}; }`);
            collector.addRule(`.monaco-select-box-dropdown-container > .select-box-details-pane > .select-box-description-markdown a:hover > code, .monaco-select-box-dropdown-container > .select-box-details-pane > .select-box-description-markdown a:active > code { color: ${activeLink}; }`);
        }
        const headerForegroundColor = theme.getColor(exports.settingsHeaderForeground);
        if (headerForegroundColor) {
            collector.addRule(`.settings-editor > .settings-header > .settings-header-controls .settings-tabs-widget .action-label.checked { color: ${headerForegroundColor}; border-bottom-color: ${headerForegroundColor}; }`);
        }
        const foregroundColor = theme.getColor(colorRegistry_1.foreground);
        if (foregroundColor) {
            collector.addRule(`.settings-editor > .settings-header > .settings-header-controls .settings-tabs-widget .action-label { color: ${foregroundColor}; }`);
        }
        // List control
        const listHoverBackgroundColor = theme.getColor(colorRegistry_1.listHoverBackground);
        if (listHoverBackgroundColor) {
            collector.addRule(`.settings-editor > .settings-body > .settings-tree-container .setting-item.setting-item-list .setting-list-row:hover { background-color: ${listHoverBackgroundColor}; }`);
        }
        const listHoverForegroundColor = theme.getColor(colorRegistry_1.listHoverForeground);
        if (listHoverForegroundColor) {
            collector.addRule(`.settings-editor > .settings-body > .settings-tree-container .setting-item.setting-item-list .setting-list-row:hover { color: ${listHoverForegroundColor}; }`);
        }
        const listSelectBackgroundColor = theme.getColor(colorRegistry_1.listActiveSelectionBackground);
        if (listSelectBackgroundColor) {
            collector.addRule(`.settings-editor > .settings-body > .settings-tree-container .setting-item.setting-item-list .setting-list-row.selected:focus { background-color: ${listSelectBackgroundColor}; }`);
        }
        const listInactiveSelectionBackgroundColor = theme.getColor(colorRegistry_1.listInactiveSelectionBackground);
        if (listInactiveSelectionBackgroundColor) {
            collector.addRule(`.settings-editor > .settings-body > .settings-tree-container .setting-item.setting-item-list .setting-list-row.selected:not(:focus) { background-color: ${listInactiveSelectionBackgroundColor}; }`);
        }
        const listInactiveSelectionForegroundColor = theme.getColor(colorRegistry_1.listInactiveSelectionForeground);
        if (listInactiveSelectionForegroundColor) {
            collector.addRule(`.settings-editor > .settings-body > .settings-tree-container .setting-item.setting-item-list .setting-list-row.selected:not(:focus) { color: ${listInactiveSelectionForegroundColor}; }`);
        }
        const listSelectForegroundColor = theme.getColor(colorRegistry_1.listActiveSelectionForeground);
        if (listSelectForegroundColor) {
            collector.addRule(`.settings-editor > .settings-body > .settings-tree-container .setting-item.setting-item-list .setting-list-row.selected:focus { color: ${listSelectForegroundColor}; }`);
        }
        const codeTextForegroundColor = theme.getColor(colorRegistry_1.textPreformatForeground);
        if (codeTextForegroundColor) {
            collector.addRule(`.settings-editor > .settings-body > .settings-tree-container .setting-item .setting-item-description-markdown code { color: ${codeTextForegroundColor} }`);
            collector.addRule(`.monaco-select-box-dropdown-container > .select-box-details-pane > .select-box-description-markdown code { color: ${codeTextForegroundColor} }`);
        }
        const modifiedItemIndicatorColor = theme.getColor(exports.modifiedItemIndicator);
        if (modifiedItemIndicatorColor) {
            collector.addRule(`.settings-editor > .settings-body > .settings-tree-container .setting-item-contents > .setting-item-modified-indicator { border-color: ${modifiedItemIndicatorColor}; }`);
        }
    });
    class ListSettingListModel {
        constructor() {
            this._dataItems = [];
            this._editKey = null;
            this._selectedIdx = null;
        }
        get items() {
            const items = this._dataItems.map((item, i) => {
                const editing = typeof this._editKey === 'number' && this._editKey === i;
                return Object.assign(Object.assign({}, item), { editing, selected: i === this._selectedIdx || editing });
            });
            if (this._editKey === 'create') {
                items.push({
                    editing: true,
                    selected: true,
                    value: '',
                    sibling: ''
                });
            }
            return items;
        }
        setEditKey(key) {
            this._editKey = key;
        }
        setValue(listData) {
            this._dataItems = listData;
        }
        select(idx) {
            this._selectedIdx = idx;
        }
        getSelected() {
            return this._selectedIdx;
        }
        selectNext() {
            if (typeof this._selectedIdx === 'number') {
                this._selectedIdx = Math.min(this._selectedIdx + 1, this._dataItems.length - 1);
            }
            else {
                this._selectedIdx = 0;
            }
        }
        selectPrevious() {
            if (typeof this._selectedIdx === 'number') {
                this._selectedIdx = Math.max(this._selectedIdx - 1, 0);
            }
            else {
                this._selectedIdx = 0;
            }
        }
    }
    exports.ListSettingListModel = ListSettingListModel;
    let ListSettingWidget = class ListSettingWidget extends lifecycle_1.Disposable {
        constructor(container, themeService, contextViewService) {
            super();
            this.container = container;
            this.themeService = themeService;
            this.contextViewService = contextViewService;
            this.listDisposables = this._register(new lifecycle_1.DisposableStore());
            this.model = new ListSettingListModel();
            this._onDidChangeList = this._register(new event_1.Emitter());
            this.onDidChangeList = this._onDidChangeList.event;
            this.listElement = DOM.append(container, $('div'));
            this.getContainerClasses().forEach(c => this.listElement.classList.add(c));
            this.listElement.setAttribute('tabindex', '0');
            DOM.append(container, this.renderAddButton());
            this.renderList();
            this._register(DOM.addDisposableListener(this.listElement, DOM.EventType.CLICK, e => this.onListClick(e)));
            this._register(DOM.addDisposableListener(this.listElement, DOM.EventType.DBLCLICK, e => this.onListDoubleClick(e)));
            this._register(DOM.addStandardDisposableListener(this.listElement, 'keydown', (e) => {
                if (e.keyCode === 16 /* UpArrow */) {
                    const selectedIndex = this.model.getSelected();
                    this.model.selectPrevious();
                    if (this.model.getSelected() !== selectedIndex) {
                        this.renderList();
                    }
                    e.preventDefault();
                    e.stopPropagation();
                }
                else if (e.keyCode === 18 /* DownArrow */) {
                    const selectedIndex = this.model.getSelected();
                    this.model.selectNext();
                    if (this.model.getSelected() !== selectedIndex) {
                        this.renderList();
                    }
                    e.preventDefault();
                    e.stopPropagation();
                }
            }));
        }
        get domNode() {
            return this.listElement;
        }
        getLocalizedStrings() {
            return {
                deleteActionTooltip: nls_1.localize('removeItem', "Remove Item"),
                editActionTooltip: nls_1.localize('editItem', "Edit Item"),
                complexEditActionTooltip: nls_1.localize('editItemInSettingsJson', "Edit Item in settings.json"),
                addButtonLabel: nls_1.localize('addItem', "Add Item"),
                inputPlaceholder: nls_1.localize('itemInputPlaceholder', "String Item..."),
                siblingInputPlaceholder: nls_1.localize('listSiblingInputPlaceholder', "Sibling...")
            };
        }
        getSettingListRowLocalizedStrings(value, sibling) {
            return {
                settingListRowValueHintLabel: nls_1.localize('listValueHintLabel', "List item `{0}`", value),
                settingListRowSiblingHintLabel: nls_1.localize('listSiblingHintLabel', "List item `{0}` with sibling `${1}`", value)
            };
        }
        getContainerClasses() {
            return ['setting-list-widget'];
        }
        setValue(listData) {
            this.model.setValue(listData);
            this.renderList();
        }
        onListClick(e) {
            const targetIdx = this.getClickedItemIndex(e);
            if (targetIdx < 0) {
                return;
            }
            if (this.model.getSelected() === targetIdx) {
                return;
            }
            this.model.select(targetIdx);
            this.renderList();
            e.preventDefault();
            e.stopPropagation();
        }
        onListDoubleClick(e) {
            const targetIdx = this.getClickedItemIndex(e);
            if (targetIdx < 0) {
                return;
            }
            const item = this.model.items[targetIdx];
            if (item) {
                this.editSetting(targetIdx);
                e.preventDefault();
                e.stopPropagation();
            }
        }
        getClickedItemIndex(e) {
            if (!e.target) {
                return -1;
            }
            const actionbar = DOM.findParentWithClass(e.target, 'monaco-action-bar');
            if (actionbar) {
                // Don't handle doubleclicks inside the action bar
                return -1;
            }
            const element = DOM.findParentWithClass(e.target, 'setting-list-row');
            if (!element) {
                return -1;
            }
            const targetIdxStr = element.getAttribute('data-index');
            if (!targetIdxStr) {
                return -1;
            }
            const targetIdx = parseInt(targetIdxStr);
            return targetIdx;
        }
        renderList() {
            const focused = DOM.isAncestor(document.activeElement, this.listElement);
            DOM.clearNode(this.listElement);
            this.listDisposables.clear();
            const newMode = this.model.items.some(item => !!(item.editing && !item.value));
            DOM.toggleClass(this.container, 'setting-list-new-mode', newMode);
            this.model.items
                .map((item, i) => this.renderItem(item, i, focused))
                .forEach(itemElement => this.listElement.appendChild(itemElement));
            const listHeight = 24 * this.model.items.length;
            this.listElement.style.height = listHeight + 'px';
        }
        createDeleteAction(key, idx) {
            return {
                class: 'codicon-close',
                enabled: true,
                id: 'workbench.action.removeListItem',
                tooltip: this.getLocalizedStrings().deleteActionTooltip,
                run: () => this._onDidChangeList.fire({ originalValue: key, value: undefined, targetIndex: idx })
            };
        }
        createEditAction(idx) {
            return {
                class: 'codicon-edit',
                enabled: true,
                id: 'workbench.action.editListItem',
                tooltip: this.getLocalizedStrings().editActionTooltip,
                run: () => {
                    this.editSetting(idx);
                }
            };
        }
        editSetting(idx) {
            this.model.setEditKey(idx);
            this.renderList();
        }
        renderItem(item, idx, listFocused) {
            return item.editing ?
                this.renderEditItem(item, idx) :
                this.renderDataItem(item, idx, listFocused);
        }
        renderDataItem(item, idx, listFocused) {
            const rowElement = $('.setting-list-row');
            rowElement.setAttribute('data-index', idx + '');
            rowElement.setAttribute('tabindex', item.selected ? '0' : '-1');
            DOM.toggleClass(rowElement, 'selected', item.selected);
            const actionBar = new actionbar_1.ActionBar(rowElement);
            this.listDisposables.add(actionBar);
            const valueElement = DOM.append(rowElement, $('.setting-list-value'));
            const siblingElement = DOM.append(rowElement, $('.setting-list-sibling'));
            valueElement.textContent = item.value;
            siblingElement.textContent = item.sibling ? ('when: ' + item.sibling) : null;
            actionBar.push([
                this.createEditAction(idx),
                this.createDeleteAction(item.value, idx)
            ], { icon: true, label: false });
            rowElement.title = item.sibling
                ? this.getSettingListRowLocalizedStrings(item.value, item.sibling).settingListRowSiblingHintLabel
                : this.getSettingListRowLocalizedStrings(item.value, item.sibling).settingListRowValueHintLabel;
            if (item.selected) {
                if (listFocused) {
                    setTimeout(() => {
                        rowElement.focus();
                    }, 10);
                }
            }
            return rowElement;
        }
        renderAddButton() {
            const rowElement = $('.setting-list-new-row');
            const startAddButton = this._register(new button_1.Button(rowElement));
            startAddButton.label = this.getLocalizedStrings().addButtonLabel;
            startAddButton.element.classList.add('setting-list-addButton');
            this._register(styler_1.attachButtonStyler(startAddButton, this.themeService));
            this._register(startAddButton.onDidClick(() => {
                this.model.setEditKey('create');
                this.renderList();
            }));
            return rowElement;
        }
        renderEditItem(item, idx) {
            const rowElement = $('.setting-list-edit-row');
            const onSubmit = (edited) => {
                this.model.setEditKey('none');
                const value = valueInput.value.trim();
                if (edited && !types_1.isUndefinedOrNull(value)) {
                    this._onDidChangeList.fire({
                        originalValue: item.value,
                        value: value,
                        sibling: siblingInput && siblingInput.value.trim(),
                        targetIndex: idx
                    });
                }
                this.renderList();
            };
            const onKeydown = (e) => {
                if (e.equals(3 /* Enter */)) {
                    onSubmit(true);
                }
                else if (e.equals(9 /* Escape */)) {
                    onSubmit(false);
                    e.preventDefault();
                }
                rowElement.focus();
            };
            const valueInput = new inputBox_1.InputBox(rowElement, this.contextViewService, {
                placeholder: this.getLocalizedStrings().inputPlaceholder
            });
            valueInput.element.classList.add('setting-list-valueInput');
            this.listDisposables.add(styler_1.attachInputBoxStyler(valueInput, this.themeService, {
                inputBackground: exports.settingsTextInputBackground,
                inputForeground: exports.settingsTextInputForeground,
                inputBorder: exports.settingsTextInputBorder
            }));
            this.listDisposables.add(valueInput);
            valueInput.value = item.value;
            this.listDisposables.add(DOM.addStandardDisposableListener(valueInput.inputElement, DOM.EventType.KEY_DOWN, onKeydown));
            let siblingInput;
            if (item.sibling) {
                siblingInput = new inputBox_1.InputBox(rowElement, this.contextViewService, {
                    placeholder: this.getLocalizedStrings().siblingInputPlaceholder
                });
                siblingInput.element.classList.add('setting-list-siblingInput');
                this.listDisposables.add(siblingInput);
                this.listDisposables.add(styler_1.attachInputBoxStyler(siblingInput, this.themeService, {
                    inputBackground: exports.settingsTextInputBackground,
                    inputForeground: exports.settingsTextInputForeground,
                    inputBorder: exports.settingsTextInputBorder
                }));
                siblingInput.value = item.sibling;
                this.listDisposables.add(DOM.addStandardDisposableListener(siblingInput.inputElement, DOM.EventType.KEY_DOWN, onKeydown));
            }
            const okButton = this._register(new button_1.Button(rowElement));
            okButton.label = nls_1.localize('okButton', "OK");
            okButton.element.classList.add('setting-list-okButton');
            this.listDisposables.add(styler_1.attachButtonStyler(okButton, this.themeService));
            this.listDisposables.add(okButton.onDidClick(() => onSubmit(true)));
            const cancelButton = this._register(new button_1.Button(rowElement));
            cancelButton.label = nls_1.localize('cancelButton', "Cancel");
            cancelButton.element.classList.add('setting-list-okButton');
            this.listDisposables.add(styler_1.attachButtonStyler(cancelButton, this.themeService));
            this.listDisposables.add(cancelButton.onDidClick(() => onSubmit(false)));
            this.listDisposables.add(async_1.disposableTimeout(() => {
                valueInput.focus();
                valueInput.select();
            }));
            return rowElement;
        }
    };
    ListSettingWidget = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, contextView_1.IContextViewService)
    ], ListSettingWidget);
    exports.ListSettingWidget = ListSettingWidget;
    class ExcludeSettingWidget extends ListSettingWidget {
        getLocalizedStrings() {
            return {
                deleteActionTooltip: nls_1.localize('removeExcludeItem', "Remove Exclude Item"),
                editActionTooltip: nls_1.localize('editExcludeItem', "Edit Exclude Item"),
                complexEditActionTooltip: nls_1.localize('editExcludeItemInSettingsJson', "Edit Exclude Item in settings.json"),
                addButtonLabel: nls_1.localize('addPattern', "Add Pattern"),
                inputPlaceholder: nls_1.localize('excludePatternInputPlaceholder', "Exclude Pattern..."),
                siblingInputPlaceholder: nls_1.localize('excludeSiblingInputPlaceholder', "When Pattern Is Present...")
            };
        }
        getSettingListRowLocalizedStrings(pattern, sibling) {
            return {
                settingListRowValueHintLabel: nls_1.localize('excludePatternHintLabel', "Exclude files matching `{0}`", pattern),
                settingListRowSiblingHintLabel: nls_1.localize('excludeSiblingHintLabel', "Exclude files matching `{0}`, only when a file matching `{1}` is present", pattern, sibling)
            };
        }
        getContainerClasses() {
            return ['setting-list-exclude-widget'];
        }
    }
    exports.ExcludeSettingWidget = ExcludeSettingWidget;
});
//# sourceMappingURL=settingsWidgets.js.map