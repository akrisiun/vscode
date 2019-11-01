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
define(["require", "exports", "vs/workbench/common/component", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/layout/browser/layoutService", "vs/base/browser/dom", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/common/theme", "vs/platform/quickOpen/common/quickOpen", "vs/base/common/cancellation", "./quickInputList", "./quickInputBox", "vs/base/browser/keyboardEvent", "vs/nls", "vs/platform/configuration/common/configuration", "vs/workbench/browser/quickopen", "vs/base/browser/ui/countBadge/countBadge", "vs/platform/theme/common/styler", "vs/platform/environment/common/environment", "vs/base/browser/ui/progressbar/progressbar", "vs/base/common/event", "vs/base/browser/ui/button/button", "vs/base/common/lifecycle", "vs/base/common/severity", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/contextkey/common/contextkey", "vs/workbench/browser/parts/quickopen/quickopen", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/base/common/uri", "vs/platform/keybinding/common/keybinding", "vs/base/common/arrays", "vs/base/common/async", "vs/workbench/browser/parts/quickinput/quickInputUtils", "vs/platform/storage/common/storage", "vs/platform/accessibility/common/accessibility", "vs/platform/instantiation/common/extensions", "vs/base/common/amd", "vs/css!./media/quickInput"], function (require, exports, component_1, quickInput_1, layoutService_1, dom, instantiation_1, themeService_1, colorRegistry_1, theme_1, quickOpen_1, cancellation_1, quickInputList_1, quickInputBox_1, keyboardEvent_1, nls_1, configuration_1, quickopen_1, countBadge_1, styler_1, environment_1, progressbar_1, event_1, button_1, lifecycle_1, severity_1, editorGroupsService_1, contextkey_1, quickopen_2, actionbar_1, actions_1, uri_1, keybinding_1, arrays_1, async_1, quickInputUtils_1, storage_1, accessibility_1, extensions_1, amd_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const $ = dom.$;
    const backButton = {
        iconPath: {
            dark: uri_1.URI.parse(amd_1.registerAndGetAmdImageURL('vs/workbench/browser/parts/quickinput/media/arrow-left-dark.svg')),
            light: uri_1.URI.parse(amd_1.registerAndGetAmdImageURL('vs/workbench/browser/parts/quickinput/media/arrow-left-light.svg'))
        },
        tooltip: nls_1.localize('quickInput.back', "Back"),
        handle: -1 // TODO
    };
    class QuickInput extends lifecycle_1.Disposable {
        constructor(ui) {
            super();
            this.ui = ui;
            this.visible = false;
            this._enabled = true;
            this._busy = false;
            this._ignoreFocusOut = false;
            this._buttons = [];
            this.buttonsUpdated = false;
            this.onDidTriggerButtonEmitter = this._register(new event_1.Emitter());
            this.onDidHideEmitter = this._register(new event_1.Emitter());
            this.visibleDisposables = this._register(new lifecycle_1.DisposableStore());
            this.onDidTriggerButton = this.onDidTriggerButtonEmitter.event;
            this.onDidHide = this.onDidHideEmitter.event;
        }
        get title() {
            return this._title;
        }
        set title(title) {
            this._title = title;
            this.update();
        }
        get step() {
            return this._steps;
        }
        set step(step) {
            this._steps = step;
            this.update();
        }
        get totalSteps() {
            return this._totalSteps;
        }
        set totalSteps(totalSteps) {
            this._totalSteps = totalSteps;
            this.update();
        }
        get enabled() {
            return this._enabled;
        }
        set enabled(enabled) {
            this._enabled = enabled;
            this.update();
        }
        get contextKey() {
            return this._contextKey;
        }
        set contextKey(contextKey) {
            this._contextKey = contextKey;
            this.update();
        }
        get busy() {
            return this._busy;
        }
        set busy(busy) {
            this._busy = busy;
            this.update();
        }
        get ignoreFocusOut() {
            return this._ignoreFocusOut;
        }
        set ignoreFocusOut(ignoreFocusOut) {
            this._ignoreFocusOut = ignoreFocusOut;
            this.update();
        }
        get buttons() {
            return this._buttons;
        }
        set buttons(buttons) {
            this._buttons = buttons;
            this.buttonsUpdated = true;
            this.update();
        }
        show() {
            if (this.visible) {
                return;
            }
            this.visibleDisposables.add(this.ui.onDidTriggerButton(button => {
                if (this.buttons.indexOf(button) !== -1) {
                    this.onDidTriggerButtonEmitter.fire(button);
                }
            }));
            this.ui.show(this);
            this.visible = true;
            this.update();
        }
        hide() {
            if (!this.visible) {
                return;
            }
            this.ui.hide();
        }
        didHide() {
            this.visible = false;
            this.visibleDisposables.clear();
            this.onDidHideEmitter.fire();
        }
        update() {
            if (!this.visible) {
                return;
            }
            const title = this.getTitle();
            if (this.ui.title.textContent !== title) {
                this.ui.title.textContent = title;
            }
            if (this.busy && !this.busyDelay) {
                this.busyDelay = new async_1.TimeoutTimer();
                this.busyDelay.setIfNotSet(() => {
                    if (this.visible) {
                        this.ui.progressBar.infinite();
                    }
                }, 800);
            }
            if (!this.busy && this.busyDelay) {
                this.ui.progressBar.stop();
                this.busyDelay.cancel();
                this.busyDelay = null;
            }
            if (this.buttonsUpdated) {
                this.buttonsUpdated = false;
                this.ui.leftActionBar.clear();
                const leftButtons = this.buttons.filter(button => button === backButton);
                this.ui.leftActionBar.push(leftButtons.map((button, index) => {
                    const action = new actions_1.Action(`id-${index}`, '', button.iconClass || quickInputUtils_1.getIconClass(button.iconPath), true, () => {
                        this.onDidTriggerButtonEmitter.fire(button);
                        return Promise.resolve(null);
                    });
                    action.tooltip = button.tooltip || '';
                    return action;
                }), { icon: true, label: false });
                this.ui.rightActionBar.clear();
                const rightButtons = this.buttons.filter(button => button !== backButton);
                this.ui.rightActionBar.push(rightButtons.map((button, index) => {
                    const action = new actions_1.Action(`id-${index}`, '', button.iconClass || quickInputUtils_1.getIconClass(button.iconPath), true, () => {
                        this.onDidTriggerButtonEmitter.fire(button);
                        return Promise.resolve(null);
                    });
                    action.tooltip = button.tooltip || '';
                    return action;
                }), { icon: true, label: false });
            }
            this.ui.ignoreFocusOut = this.ignoreFocusOut;
            this.ui.setEnabled(this.enabled);
            this.ui.setContextKey(this.contextKey);
        }
        getTitle() {
            if (this.title && this.step) {
                return `${this.title} (${this.getSteps()})`;
            }
            if (this.title) {
                return this.title;
            }
            if (this.step) {
                return this.getSteps();
            }
            return '';
        }
        getSteps() {
            if (this.step && this.totalSteps) {
                return nls_1.localize('quickInput.steps', "{0}/{1}", this.step, this.totalSteps);
            }
            if (this.step) {
                return String(this.step);
            }
            return '';
        }
        showMessageDecoration(severity) {
            this.ui.inputBox.showDecoration(severity);
            if (severity === severity_1.default.Error) {
                const styles = this.ui.inputBox.stylesForType(severity);
                this.ui.message.style.backgroundColor = styles.background ? `${styles.background}` : null;
                this.ui.message.style.border = styles.border ? `1px solid ${styles.border}` : null;
                this.ui.message.style.paddingBottom = '4px';
            }
            else {
                this.ui.message.style.backgroundColor = '';
                this.ui.message.style.border = '';
                this.ui.message.style.paddingBottom = '';
            }
        }
        dispose() {
            this.hide();
            super.dispose();
        }
    }
    class QuickPick extends QuickInput {
        constructor() {
            super(...arguments);
            this._value = '';
            this.onDidChangeValueEmitter = this._register(new event_1.Emitter());
            this.onDidAcceptEmitter = this._register(new event_1.Emitter());
            this.onDidCustomEmitter = this._register(new event_1.Emitter());
            this._items = [];
            this.itemsUpdated = false;
            this._canSelectMany = false;
            this._matchOnDescription = false;
            this._matchOnDetail = false;
            this._matchOnLabel = true;
            this._autoFocusOnList = true;
            this._activeItems = [];
            this.activeItemsUpdated = false;
            this.activeItemsToConfirm = [];
            this.onDidChangeActiveEmitter = this._register(new event_1.Emitter());
            this._selectedItems = [];
            this.selectedItemsUpdated = false;
            this.selectedItemsToConfirm = [];
            this.onDidChangeSelectionEmitter = this._register(new event_1.Emitter());
            this.onDidTriggerItemButtonEmitter = this._register(new event_1.Emitter());
            this.valueSelectionUpdated = true;
            this.onDidChangeValue = this.onDidChangeValueEmitter.event;
            this.onDidAccept = this.onDidAcceptEmitter.event;
            this.onDidCustom = this.onDidCustomEmitter.event;
            this.onDidChangeActive = this.onDidChangeActiveEmitter.event;
            this.onDidChangeSelection = this.onDidChangeSelectionEmitter.event;
            this.onDidTriggerItemButton = this.onDidTriggerItemButtonEmitter.event;
        }
        get value() {
            return this._value;
        }
        set value(value) {
            this._value = value || '';
            this.update();
        }
        get placeholder() {
            return this._placeholder;
        }
        set placeholder(placeholder) {
            this._placeholder = placeholder;
            this.update();
        }
        get items() {
            return this._items;
        }
        set items(items) {
            this._items = items;
            this.itemsUpdated = true;
            this.update();
        }
        get canSelectMany() {
            return this._canSelectMany;
        }
        set canSelectMany(canSelectMany) {
            this._canSelectMany = canSelectMany;
            this.update();
        }
        get matchOnDescription() {
            return this._matchOnDescription;
        }
        set matchOnDescription(matchOnDescription) {
            this._matchOnDescription = matchOnDescription;
            this.update();
        }
        get matchOnDetail() {
            return this._matchOnDetail;
        }
        set matchOnDetail(matchOnDetail) {
            this._matchOnDetail = matchOnDetail;
            this.update();
        }
        get matchOnLabel() {
            return this._matchOnLabel;
        }
        set matchOnLabel(matchOnLabel) {
            this._matchOnLabel = matchOnLabel;
            this.update();
        }
        get autoFocusOnList() {
            return this._autoFocusOnList;
        }
        set autoFocusOnList(autoFocusOnList) {
            this._autoFocusOnList = autoFocusOnList;
            this.update();
        }
        get activeItems() {
            return this._activeItems;
        }
        set activeItems(activeItems) {
            this._activeItems = activeItems;
            this.activeItemsUpdated = true;
            this.update();
        }
        get selectedItems() {
            return this._selectedItems;
        }
        set selectedItems(selectedItems) {
            this._selectedItems = selectedItems;
            this.selectedItemsUpdated = true;
            this.update();
        }
        get keyMods() {
            return this.ui.keyMods;
        }
        set valueSelection(valueSelection) {
            this._valueSelection = valueSelection;
            this.valueSelectionUpdated = true;
            this.update();
        }
        get validationMessage() {
            return this._validationMessage;
        }
        set validationMessage(validationMessage) {
            this._validationMessage = validationMessage;
            this.update();
        }
        get customButton() {
            return this._customButton;
        }
        set customButton(showCustomButton) {
            this._customButton = showCustomButton;
            this.update();
        }
        get customLabel() {
            return this._customButtonLabel;
        }
        set customLabel(label) {
            this._customButtonLabel = label;
            this.update();
        }
        get customHover() {
            return this._customButtonHover;
        }
        set customHover(hover) {
            this._customButtonHover = hover;
            this.update();
        }
        get ok() {
            return this._ok;
        }
        set ok(showOkButton) {
            this._ok = showOkButton;
            this.update();
        }
        inputHasFocus() {
            return this.visible ? this.ui.inputBox.hasFocus() : false;
        }
        trySelectFirst() {
            if (this.autoFocusOnList) {
                if (!this.ui.isScreenReaderOptimized() && !this.canSelectMany) {
                    this.ui.list.focus('First');
                }
            }
        }
        show() {
            if (!this.visible) {
                this.visibleDisposables.add(this.ui.inputBox.onDidChange(value => {
                    if (value === this.value) {
                        return;
                    }
                    this._value = value;
                    this.ui.list.filter(this.ui.inputBox.value);
                    this.trySelectFirst();
                    this.onDidChangeValueEmitter.fire(value);
                }));
                this.visibleDisposables.add(this.ui.inputBox.onMouseDown(event => {
                    if (!this.autoFocusOnList) {
                        this.ui.list.clearFocus();
                    }
                }));
                this.visibleDisposables.add(this.ui.inputBox.onKeyDown(event => {
                    switch (event.keyCode) {
                        case 18 /* DownArrow */:
                            this.ui.list.focus('Next');
                            if (this.canSelectMany) {
                                this.ui.list.domFocus();
                            }
                            event.preventDefault();
                            break;
                        case 16 /* UpArrow */:
                            if (this.ui.list.getFocusedElements().length) {
                                this.ui.list.focus('Previous');
                            }
                            else {
                                this.ui.list.focus('Last');
                            }
                            if (this.canSelectMany) {
                                this.ui.list.domFocus();
                            }
                            event.preventDefault();
                            break;
                        case 12 /* PageDown */:
                            if (this.ui.list.getFocusedElements().length) {
                                this.ui.list.focus('NextPage');
                            }
                            else {
                                this.ui.list.focus('First');
                            }
                            if (this.canSelectMany) {
                                this.ui.list.domFocus();
                            }
                            event.preventDefault();
                            break;
                        case 11 /* PageUp */:
                            if (this.ui.list.getFocusedElements().length) {
                                this.ui.list.focus('PreviousPage');
                            }
                            else {
                                this.ui.list.focus('Last');
                            }
                            if (this.canSelectMany) {
                                this.ui.list.domFocus();
                            }
                            event.preventDefault();
                            break;
                    }
                }));
                this.visibleDisposables.add(this.ui.onDidAccept(() => {
                    if (!this.canSelectMany && this.activeItems[0]) {
                        this._selectedItems = [this.activeItems[0]];
                        this.onDidChangeSelectionEmitter.fire(this.selectedItems);
                    }
                    this.onDidAcceptEmitter.fire(undefined);
                }));
                this.visibleDisposables.add(this.ui.onDidCustom(() => {
                    this.onDidCustomEmitter.fire(undefined);
                }));
                this.visibleDisposables.add(this.ui.list.onDidChangeFocus(focusedItems => {
                    if (this.activeItemsUpdated) {
                        return; // Expect another event.
                    }
                    if (this.activeItemsToConfirm !== this._activeItems && arrays_1.equals(focusedItems, this._activeItems, (a, b) => a === b)) {
                        return;
                    }
                    this._activeItems = focusedItems;
                    this.onDidChangeActiveEmitter.fire(focusedItems);
                }));
                this.visibleDisposables.add(this.ui.list.onDidChangeSelection(selectedItems => {
                    if (this.canSelectMany) {
                        if (selectedItems.length) {
                            this.ui.list.setSelectedElements([]);
                        }
                        return;
                    }
                    if (this.selectedItemsToConfirm !== this._selectedItems && arrays_1.equals(selectedItems, this._selectedItems, (a, b) => a === b)) {
                        return;
                    }
                    this._selectedItems = selectedItems;
                    this.onDidChangeSelectionEmitter.fire(selectedItems);
                    if (selectedItems.length) {
                        this.onDidAcceptEmitter.fire(undefined);
                    }
                }));
                this.visibleDisposables.add(this.ui.list.onChangedCheckedElements(checkedItems => {
                    if (!this.canSelectMany) {
                        return;
                    }
                    if (this.selectedItemsToConfirm !== this._selectedItems && arrays_1.equals(checkedItems, this._selectedItems, (a, b) => a === b)) {
                        return;
                    }
                    this._selectedItems = checkedItems;
                    this.onDidChangeSelectionEmitter.fire(checkedItems);
                }));
                this.visibleDisposables.add(this.ui.list.onButtonTriggered(event => this.onDidTriggerItemButtonEmitter.fire(event)));
                this.visibleDisposables.add(this.registerQuickNavigation());
                this.valueSelectionUpdated = true;
            }
            super.show(); // TODO: Why have show() bubble up while update() trickles down? (Could move setComboboxAccessibility() here.)
        }
        registerQuickNavigation() {
            return dom.addDisposableListener(this.ui.container, dom.EventType.KEY_UP, e => {
                if (this.canSelectMany || !this.quickNavigate) {
                    return;
                }
                const keyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                const keyCode = keyboardEvent.keyCode;
                // Select element when keys are pressed that signal it
                const quickNavKeys = this.quickNavigate.keybindings;
                const wasTriggerKeyPressed = keyCode === 3 /* Enter */ || quickNavKeys.some(k => {
                    const [firstPart, chordPart] = k.getParts();
                    if (chordPart) {
                        return false;
                    }
                    if (firstPart.shiftKey && keyCode === 4 /* Shift */) {
                        if (keyboardEvent.ctrlKey || keyboardEvent.altKey || keyboardEvent.metaKey) {
                            return false; // this is an optimistic check for the shift key being used to navigate back in quick open
                        }
                        return true;
                    }
                    if (firstPart.altKey && keyCode === 6 /* Alt */) {
                        return true;
                    }
                    if (firstPart.ctrlKey && keyCode === 5 /* Ctrl */) {
                        return true;
                    }
                    if (firstPart.metaKey && keyCode === 57 /* Meta */) {
                        return true;
                    }
                    return false;
                });
                if (wasTriggerKeyPressed && this.activeItems[0]) {
                    this._selectedItems = [this.activeItems[0]];
                    this.onDidChangeSelectionEmitter.fire(this.selectedItems);
                    this.onDidAcceptEmitter.fire(undefined);
                }
            });
        }
        update() {
            super.update();
            if (!this.visible) {
                return;
            }
            if (this.ui.inputBox.value !== this.value) {
                this.ui.inputBox.value = this.value;
            }
            if (this.valueSelectionUpdated) {
                this.valueSelectionUpdated = false;
                this.ui.inputBox.select(this._valueSelection && { start: this._valueSelection[0], end: this._valueSelection[1] });
            }
            if (this.ui.inputBox.placeholder !== (this.placeholder || '')) {
                this.ui.inputBox.placeholder = (this.placeholder || '');
            }
            if (this.itemsUpdated) {
                this.itemsUpdated = false;
                this.ui.list.setElements(this.items);
                this.ui.list.filter(this.ui.inputBox.value);
                this.ui.checkAll.checked = this.ui.list.getAllVisibleChecked();
                this.ui.visibleCount.setCount(this.ui.list.getVisibleCount());
                this.ui.count.setCount(this.ui.list.getCheckedCount());
                this.trySelectFirst();
            }
            if (this.ui.container.classList.contains('show-checkboxes') !== !!this.canSelectMany) {
                if (this.canSelectMany) {
                    this.ui.list.clearFocus();
                }
                else {
                    this.trySelectFirst();
                }
            }
            if (this.activeItemsUpdated) {
                this.activeItemsUpdated = false;
                this.activeItemsToConfirm = this._activeItems;
                this.ui.list.setFocusedElements(this.activeItems);
                if (this.activeItemsToConfirm === this._activeItems) {
                    this.activeItemsToConfirm = null;
                }
            }
            if (this.selectedItemsUpdated) {
                this.selectedItemsUpdated = false;
                this.selectedItemsToConfirm = this._selectedItems;
                if (this.canSelectMany) {
                    this.ui.list.setCheckedElements(this.selectedItems);
                }
                else {
                    this.ui.list.setSelectedElements(this.selectedItems);
                }
                if (this.selectedItemsToConfirm === this._selectedItems) {
                    this.selectedItemsToConfirm = null;
                }
            }
            if (this.validationMessage) {
                this.ui.message.textContent = this.validationMessage;
                this.showMessageDecoration(severity_1.default.Error);
            }
            else {
                this.ui.message.textContent = null;
                this.showMessageDecoration(severity_1.default.Ignore);
            }
            this.ui.customButton.label = this.customLabel;
            this.ui.customButton.element.title = this.customHover;
            this.ui.list.matchOnDescription = this.matchOnDescription;
            this.ui.list.matchOnDetail = this.matchOnDetail;
            this.ui.list.matchOnLabel = this.matchOnLabel;
            this.ui.setComboboxAccessibility(true);
            this.ui.inputBox.setAttribute('aria-label', QuickPick.INPUT_BOX_ARIA_LABEL);
            this.ui.setVisibilities(this.canSelectMany ? { title: !!this.title || !!this.step, checkAll: true, inputBox: true, visibleCount: true, count: true, ok: true, list: true, message: !!this.validationMessage } : { title: !!this.title || !!this.step, inputBox: true, visibleCount: true, list: true, message: !!this.validationMessage, customButton: this.customButton, ok: this.ok });
        }
    }
    QuickPick.INPUT_BOX_ARIA_LABEL = nls_1.localize('quickInputBox.ariaLabel', "Type to narrow down results.");
    class InputBox extends QuickInput {
        constructor() {
            super(...arguments);
            this._value = '';
            this.valueSelectionUpdated = true;
            this._password = false;
            this.noValidationMessage = InputBox.noPromptMessage;
            this.onDidValueChangeEmitter = this._register(new event_1.Emitter());
            this.onDidAcceptEmitter = this._register(new event_1.Emitter());
            this.onDidChangeValue = this.onDidValueChangeEmitter.event;
            this.onDidAccept = this.onDidAcceptEmitter.event;
        }
        get value() {
            return this._value;
        }
        set value(value) {
            this._value = value || '';
            this.update();
        }
        set valueSelection(valueSelection) {
            this._valueSelection = valueSelection;
            this.valueSelectionUpdated = true;
            this.update();
        }
        get placeholder() {
            return this._placeholder;
        }
        set placeholder(placeholder) {
            this._placeholder = placeholder;
            this.update();
        }
        get password() {
            return this._password;
        }
        set password(password) {
            this._password = password;
            this.update();
        }
        get prompt() {
            return this._prompt;
        }
        set prompt(prompt) {
            this._prompt = prompt;
            this.noValidationMessage = prompt
                ? nls_1.localize('inputModeEntryDescription', "{0} (Press 'Enter' to confirm or 'Escape' to cancel)", prompt)
                : InputBox.noPromptMessage;
            this.update();
        }
        get validationMessage() {
            return this._validationMessage;
        }
        set validationMessage(validationMessage) {
            this._validationMessage = validationMessage;
            this.update();
        }
        show() {
            if (!this.visible) {
                this.visibleDisposables.add(this.ui.inputBox.onDidChange(value => {
                    if (value === this.value) {
                        return;
                    }
                    this._value = value;
                    this.onDidValueChangeEmitter.fire(value);
                }));
                this.visibleDisposables.add(this.ui.onDidAccept(() => this.onDidAcceptEmitter.fire(undefined)));
                this.valueSelectionUpdated = true;
            }
            super.show();
        }
        update() {
            super.update();
            if (!this.visible) {
                return;
            }
            if (this.ui.inputBox.value !== this.value) {
                this.ui.inputBox.value = this.value;
            }
            if (this.valueSelectionUpdated) {
                this.valueSelectionUpdated = false;
                this.ui.inputBox.select(this._valueSelection && { start: this._valueSelection[0], end: this._valueSelection[1] });
            }
            if (this.ui.inputBox.placeholder !== (this.placeholder || '')) {
                this.ui.inputBox.placeholder = (this.placeholder || '');
            }
            if (this.ui.inputBox.password !== this.password) {
                this.ui.inputBox.password = this.password;
            }
            if (!this.validationMessage && this.ui.message.textContent !== this.noValidationMessage) {
                this.ui.message.textContent = this.noValidationMessage;
                this.showMessageDecoration(severity_1.default.Ignore);
            }
            if (this.validationMessage && this.ui.message.textContent !== this.validationMessage) {
                this.ui.message.textContent = this.validationMessage;
                this.showMessageDecoration(severity_1.default.Error);
            }
            this.ui.setVisibilities({ title: !!this.title || !!this.step, inputBox: true, message: true });
        }
    }
    InputBox.noPromptMessage = nls_1.localize('inputModeEntry', "Press 'Enter' to confirm your input or 'Escape' to cancel");
    let QuickInputService = class QuickInputService extends component_1.Component {
        constructor(environmentService, configurationService, instantiationService, quickOpenService, editorGroupService, keybindingService, contextKeyService, themeService, storageService, accessibilityService, layoutService) {
            super(QuickInputService.ID, themeService, storageService);
            this.environmentService = environmentService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.quickOpenService = quickOpenService;
            this.editorGroupService = editorGroupService;
            this.keybindingService = keybindingService;
            this.contextKeyService = contextKeyService;
            this.accessibilityService = accessibilityService;
            this.layoutService = layoutService;
            this.idPrefix = 'quickInput_'; // Constant since there is still only one.
            this.comboboxAccessibility = false;
            this.enabled = true;
            this.inQuickOpenWidgets = {};
            this.contexts = new Map();
            this.onDidAcceptEmitter = this._register(new event_1.Emitter());
            this.onDidCustomEmitter = this._register(new event_1.Emitter());
            this.onDidTriggerButtonEmitter = this._register(new event_1.Emitter());
            this.keyMods = { ctrlCmd: false, alt: false };
            this.controller = null;
            this.backButton = backButton;
            this.inQuickOpenContext = quickopen_2.InQuickOpenContextKey.bindTo(contextKeyService);
            this._register(this.quickOpenService.onShow(() => this.inQuickOpen('quickOpen', true)));
            this._register(this.quickOpenService.onHide(() => this.inQuickOpen('quickOpen', false)));
            this._register(this.layoutService.onLayout(dimension => this.layout(dimension)));
            this.registerKeyModsListeners();
        }
        inQuickOpen(widget, open) {
            if (open) {
                this.inQuickOpenWidgets[widget] = true;
            }
            else {
                delete this.inQuickOpenWidgets[widget];
            }
            if (Object.keys(this.inQuickOpenWidgets).length) {
                if (!this.inQuickOpenContext.get()) {
                    this.inQuickOpenContext.set(true);
                }
            }
            else {
                if (this.inQuickOpenContext.get()) {
                    this.inQuickOpenContext.reset();
                }
            }
        }
        setContextKey(id) {
            let key;
            if (id) {
                key = this.contexts.get(id);
                if (!key) {
                    key = new contextkey_1.RawContextKey(id, false)
                        .bindTo(this.contextKeyService);
                    this.contexts.set(id, key);
                }
            }
            if (key && key.get()) {
                return; // already active context
            }
            this.resetContextKeys();
            if (key) {
                key.set(true);
            }
        }
        resetContextKeys() {
            this.contexts.forEach(context => {
                if (context.get()) {
                    context.reset();
                }
            });
        }
        registerKeyModsListeners() {
            const workbench = this.layoutService.getWorkbenchElement();
            this._register(dom.addDisposableListener(workbench, dom.EventType.KEY_DOWN, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                switch (event.keyCode) {
                    case 5 /* Ctrl */:
                    case 57 /* Meta */:
                        this.keyMods.ctrlCmd = true;
                        break;
                    case 6 /* Alt */:
                        this.keyMods.alt = true;
                        break;
                }
            }));
            this._register(dom.addDisposableListener(workbench, dom.EventType.KEY_UP, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                switch (event.keyCode) {
                    case 5 /* Ctrl */:
                    case 57 /* Meta */:
                        this.keyMods.ctrlCmd = false;
                        break;
                    case 6 /* Alt */:
                        this.keyMods.alt = false;
                        break;
                }
            }));
        }
        create() {
            if (this.ui) {
                return;
            }
            const workbench = this.layoutService.getWorkbenchElement();
            const container = dom.append(workbench, $('.quick-input-widget.show-file-icons'));
            container.tabIndex = -1;
            container.style.display = 'none';
            this.titleBar = dom.append(container, $('.quick-input-titlebar'));
            const leftActionBar = this._register(new actionbar_1.ActionBar(this.titleBar));
            leftActionBar.domNode.classList.add('quick-input-left-action-bar');
            const title = dom.append(this.titleBar, $('.quick-input-title'));
            const rightActionBar = this._register(new actionbar_1.ActionBar(this.titleBar));
            rightActionBar.domNode.classList.add('quick-input-right-action-bar');
            const headerContainer = dom.append(container, $('.quick-input-header'));
            const checkAll = dom.append(headerContainer, $('input.quick-input-check-all'));
            checkAll.type = 'checkbox';
            this._register(dom.addStandardDisposableListener(checkAll, dom.EventType.CHANGE, e => {
                const checked = checkAll.checked;
                list.setAllVisibleChecked(checked);
            }));
            this._register(dom.addDisposableListener(checkAll, dom.EventType.CLICK, e => {
                if (e.x || e.y) { // Avoid 'click' triggered by 'space'...
                    inputBox.setFocus();
                }
            }));
            const extraContainer = dom.append(headerContainer, $('.quick-input-and-message'));
            this.filterContainer = dom.append(extraContainer, $('.quick-input-filter'));
            const inputBox = this._register(new quickInputBox_1.QuickInputBox(this.filterContainer));
            inputBox.setAttribute('aria-describedby', `${this.idPrefix}message`);
            this.visibleCountContainer = dom.append(this.filterContainer, $('.quick-input-visible-count'));
            this.visibleCountContainer.setAttribute('aria-live', 'polite');
            this.visibleCountContainer.setAttribute('aria-atomic', 'true');
            const visibleCount = new countBadge_1.CountBadge(this.visibleCountContainer, { countFormat: nls_1.localize({ key: 'quickInput.visibleCount', comment: ['This tells the user how many items are shown in a list of items to select from. The items can be anything. Currently not visible, but read by screen readers.'] }, "{0} Results") });
            this.countContainer = dom.append(this.filterContainer, $('.quick-input-count'));
            this.countContainer.setAttribute('aria-live', 'polite');
            const count = new countBadge_1.CountBadge(this.countContainer, { countFormat: nls_1.localize({ key: 'quickInput.countSelected', comment: ['This tells the user how many items are selected in a list of items to select from. The items can be anything.'] }, "{0} Selected") });
            this._register(styler_1.attachBadgeStyler(count, this.themeService));
            this.okContainer = dom.append(headerContainer, $('.quick-input-action'));
            this.ok = new button_1.Button(this.okContainer);
            styler_1.attachButtonStyler(this.ok, this.themeService);
            this.ok.label = nls_1.localize('ok', "OK");
            this._register(this.ok.onDidClick(e => {
                this.onDidAcceptEmitter.fire();
            }));
            this.customButtonContainer = dom.append(headerContainer, $('.quick-input-action'));
            const customButton = new button_1.Button(this.customButtonContainer);
            styler_1.attachButtonStyler(customButton, this.themeService);
            customButton.label = nls_1.localize('custom', "Custom");
            this._register(customButton.onDidClick(e => {
                this.onDidCustomEmitter.fire();
            }));
            const message = dom.append(extraContainer, $(`#${this.idPrefix}message.quick-input-message`));
            const progressBar = new progressbar_1.ProgressBar(container);
            dom.addClass(progressBar.getContainer(), 'quick-input-progress');
            this._register(styler_1.attachProgressBarStyler(progressBar, this.themeService));
            const list = this._register(this.instantiationService.createInstance(quickInputList_1.QuickInputList, container, this.idPrefix + 'list'));
            this._register(list.onChangedAllVisibleChecked(checked => {
                checkAll.checked = checked;
            }));
            this._register(list.onChangedVisibleCount(c => {
                visibleCount.setCount(c);
            }));
            this._register(list.onChangedCheckedCount(c => {
                count.setCount(c);
            }));
            this._register(list.onLeave(() => {
                // Defer to avoid the input field reacting to the triggering key.
                setTimeout(() => {
                    inputBox.setFocus();
                    if (this.controller instanceof QuickPick && this.controller.canSelectMany) {
                        list.clearFocus();
                    }
                }, 0);
            }));
            this._register(list.onDidChangeFocus(() => {
                if (this.comboboxAccessibility) {
                    this.ui.inputBox.setAttribute('aria-activedescendant', this.ui.list.getActiveDescendant() || '');
                }
            }));
            const focusTracker = dom.trackFocus(container);
            this._register(focusTracker);
            this._register(focusTracker.onDidBlur(() => {
                if (!this.ui.ignoreFocusOut && !this.environmentService.args['sticky-quickopen'] && this.configurationService.getValue(quickopen_1.CLOSE_ON_FOCUS_LOST_CONFIG)) {
                    this.hide(true);
                }
            }));
            this._register(dom.addDisposableListener(container, dom.EventType.FOCUS, (e) => {
                inputBox.setFocus();
            }));
            this._register(dom.addDisposableListener(container, dom.EventType.KEY_DOWN, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                switch (event.keyCode) {
                    case 3 /* Enter */:
                        dom.EventHelper.stop(e, true);
                        this.onDidAcceptEmitter.fire();
                        break;
                    case 9 /* Escape */:
                        dom.EventHelper.stop(e, true);
                        this.hide();
                        break;
                    case 2 /* Tab */:
                        if (!event.altKey && !event.ctrlKey && !event.metaKey) {
                            const selectors = ['.action-label.codicon'];
                            if (container.classList.contains('show-checkboxes')) {
                                selectors.push('input');
                            }
                            else {
                                selectors.push('input[type=text]');
                            }
                            if (this.ui.list.isDisplayed()) {
                                selectors.push('.monaco-list');
                            }
                            const stops = container.querySelectorAll(selectors.join(', '));
                            if (event.shiftKey && event.target === stops[0]) {
                                dom.EventHelper.stop(e, true);
                                stops[stops.length - 1].focus();
                            }
                            else if (!event.shiftKey && event.target === stops[stops.length - 1]) {
                                dom.EventHelper.stop(e, true);
                                stops[0].focus();
                            }
                        }
                        break;
                }
            }));
            this._register(this.quickOpenService.onShow(() => this.hide(true)));
            this.ui = {
                container,
                leftActionBar,
                title,
                rightActionBar,
                checkAll,
                inputBox,
                visibleCount,
                count,
                message,
                customButton,
                progressBar,
                list,
                onDidAccept: this.onDidAcceptEmitter.event,
                onDidCustom: this.onDidCustomEmitter.event,
                onDidTriggerButton: this.onDidTriggerButtonEmitter.event,
                ignoreFocusOut: false,
                keyMods: this.keyMods,
                isScreenReaderOptimized: () => this.isScreenReaderOptimized(),
                show: controller => this.show(controller),
                hide: () => this.hide(),
                setVisibilities: visibilities => this.setVisibilities(visibilities),
                setComboboxAccessibility: enabled => this.setComboboxAccessibility(enabled),
                setEnabled: enabled => this.setEnabled(enabled),
                setContextKey: contextKey => this.setContextKey(contextKey),
            };
            this.updateStyles();
        }
        pick(picks, options = {}, token = cancellation_1.CancellationToken.None) {
            return new Promise((doResolve, reject) => {
                let resolve = (result) => {
                    resolve = doResolve;
                    if (options.onKeyMods) {
                        options.onKeyMods(input.keyMods);
                    }
                    doResolve(result);
                };
                if (token.isCancellationRequested) {
                    resolve(undefined);
                    return;
                }
                const input = this.createQuickPick();
                let activeItem;
                const disposables = [
                    input,
                    input.onDidAccept(() => {
                        if (input.canSelectMany) {
                            resolve(input.selectedItems.slice());
                            input.hide();
                        }
                        else {
                            const result = input.activeItems[0];
                            if (result) {
                                resolve(result);
                                input.hide();
                            }
                        }
                    }),
                    input.onDidChangeActive(items => {
                        const focused = items[0];
                        if (focused && options.onDidFocus) {
                            options.onDidFocus(focused);
                        }
                    }),
                    input.onDidChangeSelection(items => {
                        if (!input.canSelectMany) {
                            const result = items[0];
                            if (result) {
                                resolve(result);
                                input.hide();
                            }
                        }
                    }),
                    input.onDidTriggerItemButton(event => options.onDidTriggerItemButton && options.onDidTriggerItemButton(Object.assign(Object.assign({}, event), { removeItem: () => {
                            const index = input.items.indexOf(event.item);
                            if (index !== -1) {
                                const items = input.items.slice();
                                items.splice(index, 1);
                                input.items = items;
                            }
                        } }))),
                    input.onDidChangeValue(value => {
                        if (activeItem && !value && (input.activeItems.length !== 1 || input.activeItems[0] !== activeItem)) {
                            input.activeItems = [activeItem];
                        }
                    }),
                    token.onCancellationRequested(() => {
                        input.hide();
                    }),
                    input.onDidHide(() => {
                        lifecycle_1.dispose(disposables);
                        resolve(undefined);
                    }),
                ];
                input.canSelectMany = !!options.canPickMany;
                input.placeholder = options.placeHolder;
                input.ignoreFocusOut = !!options.ignoreFocusLost;
                input.matchOnDescription = !!options.matchOnDescription;
                input.matchOnDetail = !!options.matchOnDetail;
                input.matchOnLabel = (options.matchOnLabel === undefined) || options.matchOnLabel; // default to true
                input.autoFocusOnList = (options.autoFocusOnList === undefined) || options.autoFocusOnList; // default to true
                input.quickNavigate = options.quickNavigate;
                input.contextKey = options.contextKey;
                input.busy = true;
                Promise.all([picks, options.activeItem])
                    .then(([items, _activeItem]) => {
                    activeItem = _activeItem;
                    input.busy = false;
                    input.items = items;
                    if (input.canSelectMany) {
                        input.selectedItems = items.filter(item => item.type !== 'separator' && item.picked);
                    }
                    if (activeItem) {
                        input.activeItems = [activeItem];
                    }
                });
                input.show();
                Promise.resolve(picks).then(undefined, err => {
                    reject(err);
                    input.hide();
                });
            });
        }
        input(options = {}, token = cancellation_1.CancellationToken.None) {
            return new Promise((resolve, reject) => {
                if (token.isCancellationRequested) {
                    resolve(undefined);
                    return;
                }
                const input = this.createInputBox();
                const validateInput = options.validateInput || (() => Promise.resolve(undefined));
                const onDidValueChange = event_1.Event.debounce(input.onDidChangeValue, (last, cur) => cur, 100);
                let validationValue = options.value || '';
                let validation = Promise.resolve(validateInput(validationValue));
                const disposables = [
                    input,
                    onDidValueChange(value => {
                        if (value !== validationValue) {
                            validation = Promise.resolve(validateInput(value));
                            validationValue = value;
                        }
                        validation.then(result => {
                            if (value === validationValue) {
                                input.validationMessage = result || undefined;
                            }
                        });
                    }),
                    input.onDidAccept(() => {
                        const value = input.value;
                        if (value !== validationValue) {
                            validation = Promise.resolve(validateInput(value));
                            validationValue = value;
                        }
                        validation.then(result => {
                            if (!result) {
                                resolve(value);
                                input.hide();
                            }
                            else if (value === validationValue) {
                                input.validationMessage = result;
                            }
                        });
                    }),
                    token.onCancellationRequested(() => {
                        input.hide();
                    }),
                    input.onDidHide(() => {
                        lifecycle_1.dispose(disposables);
                        resolve(undefined);
                    }),
                ];
                input.value = options.value || '';
                input.valueSelection = options.valueSelection;
                input.prompt = options.prompt;
                input.placeholder = options.placeHolder;
                input.password = !!options.password;
                input.ignoreFocusOut = !!options.ignoreFocusLost;
                input.show();
            });
        }
        createQuickPick() {
            this.create();
            return new QuickPick(this.ui);
        }
        createInputBox() {
            this.create();
            return new InputBox(this.ui);
        }
        show(controller) {
            this.create();
            this.quickOpenService.close();
            const oldController = this.controller;
            this.controller = controller;
            if (oldController) {
                oldController.didHide();
            }
            this.setEnabled(true);
            this.ui.leftActionBar.clear();
            this.ui.title.textContent = '';
            this.ui.rightActionBar.clear();
            this.ui.checkAll.checked = false;
            // this.ui.inputBox.value = ''; Avoid triggering an event.
            this.ui.inputBox.placeholder = '';
            this.ui.inputBox.password = false;
            this.ui.inputBox.showDecoration(severity_1.default.Ignore);
            this.ui.visibleCount.setCount(0);
            this.ui.count.setCount(0);
            this.ui.message.textContent = '';
            this.ui.progressBar.stop();
            this.ui.list.setElements([]);
            this.ui.list.matchOnDescription = false;
            this.ui.list.matchOnDetail = false;
            this.ui.list.matchOnLabel = true;
            this.ui.ignoreFocusOut = false;
            this.setComboboxAccessibility(false);
            this.ui.inputBox.removeAttribute('aria-label');
            const keybinding = this.keybindingService.lookupKeybinding(BackAction.ID);
            backButton.tooltip = keybinding ? nls_1.localize('quickInput.backWithKeybinding', "Back ({0})", keybinding.getLabel()) : nls_1.localize('quickInput.back', "Back");
            this.inQuickOpen('quickInput', true);
            this.resetContextKeys();
            this.ui.container.style.display = '';
            this.updateLayout();
            this.ui.inputBox.setFocus();
        }
        setVisibilities(visibilities) {
            this.ui.title.style.display = visibilities.title ? '' : 'none';
            this.ui.checkAll.style.display = visibilities.checkAll ? '' : 'none';
            this.filterContainer.style.display = visibilities.inputBox ? '' : 'none';
            this.visibleCountContainer.style.display = visibilities.visibleCount ? '' : 'none';
            this.countContainer.style.display = visibilities.count ? '' : 'none';
            this.okContainer.style.display = visibilities.ok ? '' : 'none';
            this.customButtonContainer.style.display = visibilities.customButton ? '' : 'none';
            this.ui.message.style.display = visibilities.message ? '' : 'none';
            this.ui.list.display(!!visibilities.list);
            this.ui.container.classList[visibilities.checkAll ? 'add' : 'remove']('show-checkboxes');
            this.updateLayout(); // TODO
        }
        setComboboxAccessibility(enabled) {
            if (enabled !== this.comboboxAccessibility) {
                this.comboboxAccessibility = enabled;
                if (this.comboboxAccessibility) {
                    this.ui.inputBox.setAttribute('role', 'combobox');
                    this.ui.inputBox.setAttribute('aria-haspopup', 'true');
                    this.ui.inputBox.setAttribute('aria-autocomplete', 'list');
                    this.ui.inputBox.setAttribute('aria-activedescendant', this.ui.list.getActiveDescendant() || '');
                }
                else {
                    this.ui.inputBox.removeAttribute('role');
                    this.ui.inputBox.removeAttribute('aria-haspopup');
                    this.ui.inputBox.removeAttribute('aria-autocomplete');
                    this.ui.inputBox.removeAttribute('aria-activedescendant');
                }
            }
        }
        isScreenReaderOptimized() {
            const detected = this.accessibilityService.getAccessibilitySupport() === 2 /* Enabled */;
            const config = this.configurationService.getValue('editor').accessibilitySupport;
            return config === 'on' || (config === 'auto' && detected);
        }
        setEnabled(enabled) {
            if (enabled !== this.enabled) {
                this.enabled = enabled;
                for (const item of this.ui.leftActionBar.viewItems) {
                    item.getAction().enabled = enabled;
                }
                for (const item of this.ui.rightActionBar.viewItems) {
                    item.getAction().enabled = enabled;
                }
                this.ui.checkAll.disabled = !enabled;
                // this.ui.inputBox.enabled = enabled; Avoid loosing focus.
                this.ok.enabled = enabled;
                this.ui.list.enabled = enabled;
            }
        }
        hide(focusLost) {
            const controller = this.controller;
            if (controller) {
                this.controller = null;
                this.inQuickOpen('quickInput', false);
                this.resetContextKeys();
                this.ui.container.style.display = 'none';
                if (!focusLost) {
                    this.editorGroupService.activeGroup.focus();
                }
                controller.didHide();
            }
        }
        focus() {
            if (this.isDisplayed()) {
                this.ui.inputBox.setFocus();
            }
        }
        toggle() {
            if (this.isDisplayed() && this.controller instanceof QuickPick && this.controller.canSelectMany) {
                this.ui.list.toggleCheckbox();
            }
        }
        navigate(next, quickNavigate) {
            if (this.isDisplayed() && this.ui.list.isDisplayed()) {
                this.ui.list.focus(next ? 'Next' : 'Previous');
                if (quickNavigate && this.controller instanceof QuickPick) {
                    this.controller.quickNavigate = quickNavigate;
                }
            }
        }
        accept() {
            this.onDidAcceptEmitter.fire();
            return Promise.resolve(undefined);
        }
        back() {
            this.onDidTriggerButtonEmitter.fire(this.backButton);
            return Promise.resolve(undefined);
        }
        cancel() {
            this.hide();
            return Promise.resolve(undefined);
        }
        layout(dimension) {
            this.updateLayout();
        }
        updateLayout() {
            if (this.ui) {
                const titlebarOffset = this.layoutService.getTitleBarOffset();
                this.ui.container.style.top = `${titlebarOffset}px`;
                const style = this.ui.container.style;
                const width = Math.min(this.layoutService.dimension.width * 0.62 /* golden cut */, QuickInputService.MAX_WIDTH);
                style.width = width + 'px';
                style.marginLeft = '-' + (width / 2) + 'px';
                this.ui.inputBox.layout();
                this.ui.list.layout();
            }
        }
        updateStyles() {
            const theme = this.themeService.getTheme();
            if (this.ui) {
                // TODO
                const titleColor = { dark: 'rgba(255, 255, 255, 0.105)', light: 'rgba(0,0,0,.06)', hc: 'black' }[theme.type];
                this.titleBar.style.backgroundColor = titleColor ? titleColor.toString() : null;
                this.ui.inputBox.style(theme);
                const quickInputBackground = theme.getColor(theme_1.QUICK_INPUT_BACKGROUND);
                this.ui.container.style.backgroundColor = quickInputBackground ? quickInputBackground.toString() : null;
                const quickInputForeground = theme.getColor(theme_1.QUICK_INPUT_FOREGROUND);
                this.ui.container.style.color = quickInputForeground ? quickInputForeground.toString() : null;
                const contrastBorderColor = theme.getColor(colorRegistry_1.contrastBorder);
                this.ui.container.style.border = contrastBorderColor ? `1px solid ${contrastBorderColor}` : null;
                const widgetShadowColor = theme.getColor(colorRegistry_1.widgetShadow);
                this.ui.container.style.boxShadow = widgetShadowColor ? `0 5px 8px ${widgetShadowColor}` : null;
            }
        }
        isDisplayed() {
            return this.ui && this.ui.container.style.display !== 'none';
        }
    };
    QuickInputService.ID = 'workbench.component.quickinput';
    QuickInputService.MAX_WIDTH = 600; // Max total width of quick open widget
    QuickInputService = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, quickOpen_1.IQuickOpenService),
        __param(4, editorGroupsService_1.IEditorGroupsService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, themeService_1.IThemeService),
        __param(8, storage_1.IStorageService),
        __param(9, accessibility_1.IAccessibilityService),
        __param(10, layoutService_1.IWorkbenchLayoutService)
    ], QuickInputService);
    exports.QuickInputService = QuickInputService;
    exports.QuickPickManyToggle = {
        id: 'workbench.action.quickPickManyToggle',
        weight: 200 /* WorkbenchContrib */,
        when: quickopen_2.inQuickOpenContext,
        primary: 0,
        handler: accessor => {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            quickInputService.toggle();
        }
    };
    let BackAction = class BackAction extends actions_1.Action {
        constructor(id, label, quickInputService) {
            super(id, label);
            this.quickInputService = quickInputService;
        }
        run() {
            this.quickInputService.back();
            return Promise.resolve();
        }
    };
    BackAction.ID = 'workbench.action.quickInputBack';
    BackAction.LABEL = nls_1.localize('back', "Back");
    BackAction = __decorate([
        __param(2, quickInput_1.IQuickInputService)
    ], BackAction);
    exports.BackAction = BackAction;
    extensions_1.registerSingleton(quickInput_1.IQuickInputService, QuickInputService, true);
});
//# sourceMappingURL=quickInput.js.map