/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/platform", "vs/base/common/types", "vs/base/parts/quickopen/browser/quickOpenViewer", "vs/base/browser/ui/inputbox/inputBox", "vs/base/common/severity", "vs/base/parts/tree/browser/treeImpl", "vs/base/browser/ui/progressbar/progressbar", "vs/base/browser/keyboardEvent", "vs/base/parts/tree/browser/treeDefaults", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/common/color", "vs/base/common/objects", "vs/base/browser/mouseEvent", "vs/css!./quickopen"], function (require, exports, nls, platform, types, quickOpenViewer_1, inputBox_1, severity_1, treeImpl_1, progressbar_1, keyboardEvent_1, treeDefaults_1, DOM, lifecycle_1, color_1, objects_1, mouseEvent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class QuickOpenController extends treeDefaults_1.DefaultController {
        onContextMenu(tree, element, event) {
            if (platform.isMacintosh) {
                return this.onLeftClick(tree, element, event); // https://github.com/Microsoft/vscode/issues/1011
            }
            return super.onContextMenu(tree, element, event);
        }
        onMouseMiddleClick(tree, element, event) {
            return this.onLeftClick(tree, element, event);
        }
    }
    exports.QuickOpenController = QuickOpenController;
    var HideReason;
    (function (HideReason) {
        HideReason[HideReason["ELEMENT_SELECTED"] = 0] = "ELEMENT_SELECTED";
        HideReason[HideReason["FOCUS_LOST"] = 1] = "FOCUS_LOST";
        HideReason[HideReason["CANCELED"] = 2] = "CANCELED";
    })(HideReason = exports.HideReason || (exports.HideReason = {}));
    const defaultStyles = {
        background: color_1.Color.fromHex('#1E1E1E'),
        foreground: color_1.Color.fromHex('#CCCCCC'),
        pickerGroupForeground: color_1.Color.fromHex('#0097FB'),
        pickerGroupBorder: color_1.Color.fromHex('#3F3F46'),
        widgetShadow: color_1.Color.fromHex('#000000'),
        progressBarBackground: color_1.Color.fromHex('#0E70C0')
    };
    const DEFAULT_INPUT_ARIA_LABEL = nls.localize('quickOpenAriaLabel', "Quick picker. Type to narrow down results.");
    class QuickOpenWidget extends lifecycle_1.Disposable {
        constructor(container, callbacks, options) {
            super();
            this.isDisposed = false;
            this.container = container;
            this.callbacks = callbacks;
            this.options = options;
            this.styles = options || Object.create(null);
            objects_1.mixin(this.styles, defaultStyles, false);
            this.model = null;
        }
        getElement() {
            return this.element;
        }
        getModel() {
            return this.model;
        }
        setCallbacks(callbacks) {
            this.callbacks = callbacks;
        }
        create() {
            // Container
            this.element = document.createElement('div');
            DOM.addClass(this.element, 'monaco-quick-open-widget');
            this.container.appendChild(this.element);
            this._register(DOM.addDisposableListener(this.element, DOM.EventType.CONTEXT_MENU, e => DOM.EventHelper.stop(e, true))); // Do this to fix an issue on Mac where the menu goes into the way
            this._register(DOM.addDisposableListener(this.element, DOM.EventType.FOCUS, e => this.gainingFocus(), true));
            this._register(DOM.addDisposableListener(this.element, DOM.EventType.BLUR, e => this.loosingFocus(e), true));
            this._register(DOM.addDisposableListener(this.element, DOM.EventType.KEY_DOWN, e => {
                const keyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (keyboardEvent.keyCode === 9 /* Escape */) {
                    DOM.EventHelper.stop(e, true);
                    this.hide(2 /* CANCELED */);
                }
                else if (keyboardEvent.keyCode === 2 /* Tab */ && !keyboardEvent.altKey && !keyboardEvent.ctrlKey && !keyboardEvent.metaKey) {
                    const stops = e.currentTarget.querySelectorAll('input, .monaco-tree, .monaco-tree-row.focused .action-label.icon');
                    if (keyboardEvent.shiftKey && keyboardEvent.target === stops[0]) {
                        DOM.EventHelper.stop(e, true);
                        stops[stops.length - 1].focus();
                    }
                    else if (!keyboardEvent.shiftKey && keyboardEvent.target === stops[stops.length - 1]) {
                        DOM.EventHelper.stop(e, true);
                        stops[0].focus();
                    }
                }
            }));
            // Progress Bar
            this.progressBar = this._register(new progressbar_1.ProgressBar(this.element, { progressBarBackground: this.styles.progressBarBackground }));
            this.progressBar.hide();
            // Input Field
            this.inputContainer = document.createElement('div');
            DOM.addClass(this.inputContainer, 'quick-open-input');
            this.element.appendChild(this.inputContainer);
            this.inputBox = this._register(new inputBox_1.InputBox(this.inputContainer, undefined, {
                placeholder: this.options.inputPlaceHolder || '',
                ariaLabel: DEFAULT_INPUT_ARIA_LABEL,
                inputBackground: this.styles.inputBackground,
                inputForeground: this.styles.inputForeground,
                inputBorder: this.styles.inputBorder,
                inputValidationInfoBackground: this.styles.inputValidationInfoBackground,
                inputValidationInfoForeground: this.styles.inputValidationInfoForeground,
                inputValidationInfoBorder: this.styles.inputValidationInfoBorder,
                inputValidationWarningBackground: this.styles.inputValidationWarningBackground,
                inputValidationWarningForeground: this.styles.inputValidationWarningForeground,
                inputValidationWarningBorder: this.styles.inputValidationWarningBorder,
                inputValidationErrorBackground: this.styles.inputValidationErrorBackground,
                inputValidationErrorForeground: this.styles.inputValidationErrorForeground,
                inputValidationErrorBorder: this.styles.inputValidationErrorBorder
            }));
            this.inputElement = this.inputBox.inputElement;
            this.inputElement.setAttribute('role', 'combobox');
            this.inputElement.setAttribute('aria-haspopup', 'false');
            this.inputElement.setAttribute('aria-autocomplete', 'list');
            this._register(DOM.addDisposableListener(this.inputBox.inputElement, DOM.EventType.INPUT, (e) => this.onType()));
            this._register(DOM.addDisposableListener(this.inputBox.inputElement, DOM.EventType.KEY_DOWN, (e) => {
                const keyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                const shouldOpenInBackground = this.shouldOpenInBackground(keyboardEvent);
                // Do not handle Tab: It is used to navigate between elements without mouse
                if (keyboardEvent.keyCode === 2 /* Tab */) {
                    return;
                }
                // Pass tree navigation keys to the tree but leave focus in input field
                else if (keyboardEvent.keyCode === 18 /* DownArrow */ || keyboardEvent.keyCode === 16 /* UpArrow */ || keyboardEvent.keyCode === 12 /* PageDown */ || keyboardEvent.keyCode === 11 /* PageUp */) {
                    DOM.EventHelper.stop(e, true);
                    this.navigateInTree(keyboardEvent.keyCode, keyboardEvent.shiftKey);
                    // Position cursor at the end of input to allow right arrow (open in background)
                    // to function immediately unless the user has made a selection
                    if (this.inputBox.inputElement.selectionStart === this.inputBox.inputElement.selectionEnd) {
                        this.inputBox.inputElement.selectionStart = this.inputBox.value.length;
                    }
                }
                // Select element on Enter or on Arrow-Right if we are at the end of the input
                else if (keyboardEvent.keyCode === 3 /* Enter */ || shouldOpenInBackground) {
                    DOM.EventHelper.stop(e, true);
                    const focus = this.tree.getFocus();
                    if (focus) {
                        this.elementSelected(focus, e, shouldOpenInBackground ? 2 /* OPEN_IN_BACKGROUND */ : 1 /* OPEN */);
                    }
                }
            }));
            // Result count for screen readers
            this.resultCount = document.createElement('div');
            DOM.addClass(this.resultCount, 'quick-open-result-count');
            this.resultCount.setAttribute('aria-live', 'polite');
            this.resultCount.setAttribute('aria-atomic', 'true');
            this.element.appendChild(this.resultCount);
            // Tree
            this.treeContainer = document.createElement('div');
            DOM.addClass(this.treeContainer, 'quick-open-tree');
            this.element.appendChild(this.treeContainer);
            const createTree = this.options.treeCreator || ((container, config, opts) => new treeImpl_1.Tree(container, config, opts));
            this.tree = this._register(createTree(this.treeContainer, {
                dataSource: new quickOpenViewer_1.DataSource(this),
                controller: new QuickOpenController({ clickBehavior: 1 /* ON_MOUSE_UP */, keyboardSupport: this.options.keyboardSupport }),
                renderer: (this.renderer = new quickOpenViewer_1.Renderer(this, this.styles)),
                filter: new quickOpenViewer_1.Filter(this),
                accessibilityProvider: new quickOpenViewer_1.AccessibilityProvider(this)
            }, {
                twistiePixels: 11,
                indentPixels: 0,
                alwaysFocused: true,
                verticalScrollMode: 3 /* Visible */,
                horizontalScrollMode: 2 /* Hidden */,
                ariaLabel: nls.localize('treeAriaLabel', "Quick Picker"),
                keyboardSupport: this.options.keyboardSupport,
                preventRootFocus: false
            }));
            this.treeElement = this.tree.getHTMLElement();
            // Handle Focus and Selection event
            this._register(this.tree.onDidChangeFocus(event => {
                this.elementFocused(event.focus, event);
            }));
            this._register(this.tree.onDidChangeSelection(event => {
                if (event.selection && event.selection.length > 0) {
                    const mouseEvent = event.payload && event.payload.originalEvent instanceof mouseEvent_1.StandardMouseEvent ? event.payload.originalEvent : undefined;
                    const shouldOpenInBackground = mouseEvent ? this.shouldOpenInBackground(mouseEvent) : false;
                    this.elementSelected(event.selection[0], event, shouldOpenInBackground ? 2 /* OPEN_IN_BACKGROUND */ : 1 /* OPEN */);
                }
            }));
            this._register(DOM.addDisposableListener(this.treeContainer, DOM.EventType.KEY_DOWN, e => {
                const keyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                // Only handle when in quick navigation mode
                if (!this.quickNavigateConfiguration) {
                    return;
                }
                // Support keyboard navigation in quick navigation mode
                if (keyboardEvent.keyCode === 18 /* DownArrow */ || keyboardEvent.keyCode === 16 /* UpArrow */ || keyboardEvent.keyCode === 12 /* PageDown */ || keyboardEvent.keyCode === 11 /* PageUp */) {
                    DOM.EventHelper.stop(e, true);
                    this.navigateInTree(keyboardEvent.keyCode);
                }
            }));
            this._register(DOM.addDisposableListener(this.treeContainer, DOM.EventType.KEY_UP, e => {
                const keyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                const keyCode = keyboardEvent.keyCode;
                // Only handle when in quick navigation mode
                if (!this.quickNavigateConfiguration) {
                    return;
                }
                // Select element when keys are pressed that signal it
                const quickNavKeys = this.quickNavigateConfiguration.keybindings;
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
                if (wasTriggerKeyPressed) {
                    const focus = this.tree.getFocus();
                    if (focus) {
                        this.elementSelected(focus, e);
                    }
                }
            }));
            // Support layout
            if (this.layoutDimensions) {
                this.layout(this.layoutDimensions);
            }
            this.applyStyles();
            // Allows focus to switch to next/previous entry after tab into an actionbar item
            this._register(DOM.addDisposableListener(this.treeContainer, DOM.EventType.KEY_DOWN, (e) => {
                const keyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                // Only handle when not in quick navigation mode
                if (this.quickNavigateConfiguration) {
                    return;
                }
                if (keyboardEvent.keyCode === 18 /* DownArrow */ || keyboardEvent.keyCode === 16 /* UpArrow */ || keyboardEvent.keyCode === 12 /* PageDown */ || keyboardEvent.keyCode === 11 /* PageUp */) {
                    DOM.EventHelper.stop(e, true);
                    this.navigateInTree(keyboardEvent.keyCode, keyboardEvent.shiftKey);
                    this.treeElement.focus();
                }
            }));
            return this.element;
        }
        style(styles) {
            this.styles = styles;
            this.applyStyles();
        }
        applyStyles() {
            if (this.element) {
                const foreground = this.styles.foreground ? this.styles.foreground.toString() : null;
                const background = this.styles.background ? this.styles.background.toString() : '';
                const borderColor = this.styles.borderColor ? this.styles.borderColor.toString() : '';
                const widgetShadow = this.styles.widgetShadow ? this.styles.widgetShadow.toString() : '';
                this.element.style.color = foreground;
                this.element.style.backgroundColor = background;
                this.element.style.borderColor = borderColor;
                this.element.style.borderWidth = borderColor ? '1px' : '';
                this.element.style.borderStyle = borderColor ? 'solid' : '';
                this.element.style.boxShadow = widgetShadow ? `0 5px 8px ${widgetShadow}` : '';
            }
            if (this.progressBar) {
                this.progressBar.style({
                    progressBarBackground: this.styles.progressBarBackground
                });
            }
            if (this.inputBox) {
                this.inputBox.style({
                    inputBackground: this.styles.inputBackground,
                    inputForeground: this.styles.inputForeground,
                    inputBorder: this.styles.inputBorder,
                    inputValidationInfoBackground: this.styles.inputValidationInfoBackground,
                    inputValidationInfoForeground: this.styles.inputValidationInfoForeground,
                    inputValidationInfoBorder: this.styles.inputValidationInfoBorder,
                    inputValidationWarningBackground: this.styles.inputValidationWarningBackground,
                    inputValidationWarningForeground: this.styles.inputValidationWarningForeground,
                    inputValidationWarningBorder: this.styles.inputValidationWarningBorder,
                    inputValidationErrorBackground: this.styles.inputValidationErrorBackground,
                    inputValidationErrorForeground: this.styles.inputValidationErrorForeground,
                    inputValidationErrorBorder: this.styles.inputValidationErrorBorder
                });
            }
            if (this.tree && !this.options.treeCreator) {
                this.tree.style(this.styles);
            }
            if (this.renderer) {
                this.renderer.updateStyles(this.styles);
            }
        }
        shouldOpenInBackground(e) {
            // Keyboard
            if (e instanceof keyboardEvent_1.StandardKeyboardEvent) {
                if (e.keyCode !== 17 /* RightArrow */) {
                    return false; // only for right arrow
                }
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
                    return false; // no modifiers allowed
                }
                // validate the cursor is at the end of the input and there is no selection,
                // and if not prevent opening in the background such as the selection can be changed
                const element = this.inputBox.inputElement;
                return element.selectionEnd === this.inputBox.value.length && element.selectionStart === element.selectionEnd;
            }
            // Mouse
            return e.middleButton;
        }
        onType() {
            const value = this.inputBox.value;
            // Adjust help text as needed if present
            if (this.helpText) {
                if (value) {
                    DOM.hide(this.helpText);
                }
                else {
                    DOM.show(this.helpText);
                }
            }
            // Send to callbacks
            this.callbacks.onType(value);
        }
        navigate(next, quickNavigate) {
            if (this.isVisible()) {
                // Transition into quick navigate mode if not yet done
                if (!this.quickNavigateConfiguration && quickNavigate) {
                    this.quickNavigateConfiguration = quickNavigate;
                    this.tree.domFocus();
                }
                // Navigate
                this.navigateInTree(next ? 18 /* DownArrow */ : 16 /* UpArrow */);
            }
        }
        navigateInTree(keyCode, isShift) {
            const model = this.tree.getInput();
            const entries = model ? model.entries : [];
            const oldFocus = this.tree.getFocus();
            // Normal Navigation
            switch (keyCode) {
                case 18 /* DownArrow */:
                    this.tree.focusNext();
                    break;
                case 16 /* UpArrow */:
                    this.tree.focusPrevious();
                    break;
                case 12 /* PageDown */:
                    this.tree.focusNextPage();
                    break;
                case 11 /* PageUp */:
                    this.tree.focusPreviousPage();
                    break;
                case 2 /* Tab */:
                    if (isShift) {
                        this.tree.focusPrevious();
                    }
                    else {
                        this.tree.focusNext();
                    }
                    break;
            }
            let newFocus = this.tree.getFocus();
            // Support cycle-through navigation if focus did not change
            if (entries.length > 1 && oldFocus === newFocus) {
                // Up from no entry or first entry goes down to last
                if (keyCode === 16 /* UpArrow */ || (keyCode === 2 /* Tab */ && isShift)) {
                    this.tree.focusLast();
                }
                // Down from last entry goes to up to first
                else if (keyCode === 18 /* DownArrow */ || keyCode === 2 /* Tab */ && !isShift) {
                    this.tree.focusFirst();
                }
            }
            // Reveal
            newFocus = this.tree.getFocus();
            if (newFocus) {
                this.tree.reveal(newFocus);
            }
        }
        elementFocused(value, event) {
            if (!value || !this.isVisible()) {
                return;
            }
            // ARIA
            const arivaActiveDescendant = this.treeElement.getAttribute('aria-activedescendant');
            if (arivaActiveDescendant) {
                this.inputElement.setAttribute('aria-activedescendant', arivaActiveDescendant);
            }
            else {
                this.inputElement.removeAttribute('aria-activedescendant');
            }
            const context = { event: event, keymods: this.extractKeyMods(event), quickNavigateConfiguration: this.quickNavigateConfiguration };
            this.model.runner.run(value, 0 /* PREVIEW */, context);
        }
        elementSelected(value, event, preferredMode) {
            let hide = true;
            // Trigger open of element on selection
            if (this.isVisible()) {
                let mode = preferredMode || 1 /* OPEN */;
                const context = { event, keymods: this.extractKeyMods(event), quickNavigateConfiguration: this.quickNavigateConfiguration };
                hide = this.model.runner.run(value, mode, context);
            }
            // Hide if command was run successfully
            if (hide) {
                this.hide(0 /* ELEMENT_SELECTED */);
            }
        }
        extractKeyMods(event) {
            return {
                ctrlCmd: event && (event.ctrlKey || event.metaKey || (event.payload && event.payload.originalEvent && (event.payload.originalEvent.ctrlKey || event.payload.originalEvent.metaKey))),
                alt: event && (event.altKey || (event.payload && event.payload.originalEvent && event.payload.originalEvent.altKey))
            };
        }
        show(param, options) {
            this.visible = true;
            this.isLoosingFocus = false;
            this.quickNavigateConfiguration = options ? options.quickNavigateConfiguration : undefined;
            // Adjust UI for quick navigate mode
            if (this.quickNavigateConfiguration) {
                DOM.hide(this.inputContainer);
                DOM.show(this.element);
                this.tree.domFocus();
            }
            // Otherwise use normal UI
            else {
                DOM.show(this.inputContainer);
                DOM.show(this.element);
                this.inputBox.focus();
            }
            // Adjust Help text for IE
            if (this.helpText) {
                if (this.quickNavigateConfiguration || types.isString(param)) {
                    DOM.hide(this.helpText);
                }
                else {
                    DOM.show(this.helpText);
                }
            }
            // Show based on param
            if (types.isString(param)) {
                this.doShowWithPrefix(param);
            }
            else {
                if (options && options.value) {
                    this.restoreLastInput(options.value);
                }
                this.doShowWithInput(param, options && options.autoFocus ? options.autoFocus : {});
            }
            // Respect selectAll option
            if (options && options.inputSelection && !this.quickNavigateConfiguration) {
                this.inputBox.select(options.inputSelection);
            }
            if (this.callbacks.onShow) {
                this.callbacks.onShow();
            }
        }
        restoreLastInput(lastInput) {
            this.inputBox.value = lastInput;
            this.inputBox.select();
            this.callbacks.onType(lastInput);
        }
        doShowWithPrefix(prefix) {
            this.inputBox.value = prefix;
            this.callbacks.onType(prefix);
        }
        doShowWithInput(input, autoFocus) {
            this.setInput(input, autoFocus);
        }
        setInputAndLayout(input, autoFocus) {
            this.treeContainer.style.height = `${this.getHeight(input)}px`;
            this.tree.setInput(null).then(() => {
                this.model = input;
                // ARIA
                this.inputElement.setAttribute('aria-haspopup', String(input && input.entries && input.entries.length > 0));
                return this.tree.setInput(input);
            }).then(() => {
                // Indicate entries to tree
                this.tree.layout();
                const entries = input ? input.entries.filter(e => this.isElementVisible(input, e)) : [];
                this.updateResultCount(entries.length);
                // Handle auto focus
                if (entries.length) {
                    this.autoFocus(input, entries, autoFocus);
                }
            });
        }
        isElementVisible(input, e) {
            if (!input.filter) {
                return true;
            }
            return input.filter.isVisible(e);
        }
        autoFocus(input, entries, autoFocus = {}) {
            // First check for auto focus of prefix matches
            if (autoFocus.autoFocusPrefixMatch) {
                let caseSensitiveMatch;
                let caseInsensitiveMatch;
                const prefix = autoFocus.autoFocusPrefixMatch;
                const lowerCasePrefix = prefix.toLowerCase();
                for (const entry of entries) {
                    const label = input.dataSource.getLabel(entry) || '';
                    if (!caseSensitiveMatch && label.indexOf(prefix) === 0) {
                        caseSensitiveMatch = entry;
                    }
                    else if (!caseInsensitiveMatch && label.toLowerCase().indexOf(lowerCasePrefix) === 0) {
                        caseInsensitiveMatch = entry;
                    }
                    if (caseSensitiveMatch && caseInsensitiveMatch) {
                        break;
                    }
                }
                const entryToFocus = caseSensitiveMatch || caseInsensitiveMatch;
                if (entryToFocus) {
                    this.tree.setFocus(entryToFocus);
                    this.tree.reveal(entryToFocus, 0.5);
                    return;
                }
            }
            // Second check for auto focus of first entry
            if (autoFocus.autoFocusFirstEntry) {
                this.tree.focusFirst();
                this.tree.reveal(this.tree.getFocus());
            }
            // Third check for specific index option
            else if (typeof autoFocus.autoFocusIndex === 'number') {
                if (entries.length > autoFocus.autoFocusIndex) {
                    this.tree.focusNth(autoFocus.autoFocusIndex);
                    this.tree.reveal(this.tree.getFocus());
                }
            }
            // Check for auto focus of second entry
            else if (autoFocus.autoFocusSecondEntry) {
                if (entries.length > 1) {
                    this.tree.focusNth(1);
                }
            }
            // Finally check for auto focus of last entry
            else if (autoFocus.autoFocusLastEntry) {
                if (entries.length > 1) {
                    this.tree.focusLast();
                }
            }
        }
        refresh(input, autoFocus) {
            if (!this.isVisible()) {
                return;
            }
            if (!input) {
                input = this.tree.getInput();
            }
            if (!input) {
                return;
            }
            // Apply height & Refresh
            this.treeContainer.style.height = `${this.getHeight(input)}px`;
            this.tree.refresh().then(() => {
                // Indicate entries to tree
                this.tree.layout();
                const entries = input ? input.entries.filter(e => this.isElementVisible(input, e)) : [];
                this.updateResultCount(entries.length);
                // Handle auto focus
                if (autoFocus) {
                    if (entries.length) {
                        this.autoFocus(input, entries, autoFocus);
                    }
                }
            });
        }
        getHeight(input) {
            const renderer = input.renderer;
            if (!input) {
                const itemHeight = renderer.getHeight(null);
                return this.options.minItemsToShow ? this.options.minItemsToShow * itemHeight : 0;
            }
            let height = 0;
            let preferredItemsHeight;
            if (this.layoutDimensions && this.layoutDimensions.height) {
                preferredItemsHeight = (this.layoutDimensions.height - 50 /* subtract height of input field (30px) and some spacing (drop shadow) to fit */) * 0.4 /* max 40% of screen */;
            }
            if (!preferredItemsHeight || preferredItemsHeight > QuickOpenWidget.MAX_ITEMS_HEIGHT) {
                preferredItemsHeight = QuickOpenWidget.MAX_ITEMS_HEIGHT;
            }
            const entries = input.entries.filter(e => this.isElementVisible(input, e));
            const maxEntries = this.options.maxItemsToShow || entries.length;
            for (let i = 0; i < maxEntries && i < entries.length; i++) {
                const entryHeight = renderer.getHeight(entries[i]);
                if (height + entryHeight <= preferredItemsHeight) {
                    height += entryHeight;
                }
                else {
                    break;
                }
            }
            return height;
        }
        updateResultCount(count) {
            this.resultCount.textContent = nls.localize({ key: 'quickInput.visibleCount', comment: ['This tells the user how many items are shown in a list of items to select from. The items can be anything. Currently not visible, but read by screen readers.'] }, "{0} Results", count);
        }
        hide(reason) {
            if (!this.isVisible()) {
                return;
            }
            this.visible = false;
            DOM.hide(this.element);
            this.element.blur();
            // Clear input field and clear tree
            this.inputBox.value = '';
            this.tree.setInput(null);
            // ARIA
            this.inputElement.setAttribute('aria-haspopup', 'false');
            // Reset Tree Height
            this.treeContainer.style.height = `${this.options.minItemsToShow ? this.options.minItemsToShow * 22 : 0}px`;
            // Clear any running Progress
            this.progressBar.stop().hide();
            // Clear Focus
            if (this.tree.isDOMFocused()) {
                this.tree.domBlur();
            }
            else if (this.inputBox.hasFocus()) {
                this.inputBox.blur();
            }
            // Callbacks
            if (reason === 0 /* ELEMENT_SELECTED */) {
                this.callbacks.onOk();
            }
            else {
                this.callbacks.onCancel();
            }
            if (this.callbacks.onHide) {
                this.callbacks.onHide(reason);
            }
        }
        getQuickNavigateConfiguration() {
            return this.quickNavigateConfiguration;
        }
        setPlaceHolder(placeHolder) {
            if (this.inputBox) {
                this.inputBox.setPlaceHolder(placeHolder);
            }
        }
        setValue(value, selectionOrStableHint) {
            if (this.inputBox) {
                this.inputBox.value = value;
                if (selectionOrStableHint === null) {
                    // null means stable-selection
                }
                else if (Array.isArray(selectionOrStableHint)) {
                    const [start, end] = selectionOrStableHint;
                    this.inputBox.select({ start, end });
                }
                else {
                    this.inputBox.select();
                }
            }
        }
        setPassword(isPassword) {
            if (this.inputBox) {
                this.inputBox.inputElement.type = isPassword ? 'password' : 'text';
            }
        }
        setInput(input, autoFocus, ariaLabel) {
            if (!this.isVisible()) {
                return;
            }
            // If the input changes, indicate this to the tree
            if (!!this.getInput()) {
                this.onInputChanging();
            }
            // Adapt tree height to entries and apply input
            this.setInputAndLayout(input, autoFocus);
            // Apply ARIA
            if (this.inputBox) {
                this.inputBox.setAriaLabel(ariaLabel || DEFAULT_INPUT_ARIA_LABEL);
            }
        }
        onInputChanging() {
            if (this.inputChangingTimeoutHandle) {
                clearTimeout(this.inputChangingTimeoutHandle);
                this.inputChangingTimeoutHandle = null;
            }
            // when the input is changing in quick open, we indicate this as CSS class to the widget
            // for a certain timeout. this helps reducing some hectic UI updates when input changes quickly
            DOM.addClass(this.element, 'content-changing');
            this.inputChangingTimeoutHandle = setTimeout(() => {
                DOM.removeClass(this.element, 'content-changing');
            }, 500);
        }
        getInput() {
            return this.tree.getInput();
        }
        showInputDecoration(decoration) {
            if (this.inputBox) {
                this.inputBox.showMessage({ type: decoration === severity_1.default.Info ? 1 /* INFO */ : decoration === severity_1.default.Warning ? 2 /* WARNING */ : 3 /* ERROR */, content: '' });
            }
        }
        clearInputDecoration() {
            if (this.inputBox) {
                this.inputBox.hideMessage();
            }
        }
        focus() {
            if (this.isVisible() && this.inputBox) {
                this.inputBox.focus();
            }
        }
        accept() {
            if (this.isVisible()) {
                const focus = this.tree.getFocus();
                if (focus) {
                    this.elementSelected(focus);
                }
            }
        }
        getProgressBar() {
            return this.progressBar;
        }
        getInputBox() {
            return this.inputBox;
        }
        setExtraClass(clazz) {
            const previousClass = this.element.getAttribute('quick-open-extra-class');
            if (previousClass) {
                DOM.removeClasses(this.element, previousClass);
            }
            if (clazz) {
                DOM.addClasses(this.element, clazz);
                this.element.setAttribute('quick-open-extra-class', clazz);
            }
            else if (previousClass) {
                this.element.removeAttribute('quick-open-extra-class');
            }
        }
        isVisible() {
            return this.visible;
        }
        layout(dimension) {
            this.layoutDimensions = dimension;
            // Apply to quick open width (height is dynamic by number of items to show)
            const quickOpenWidth = Math.min(this.layoutDimensions.width * 0.62 /* golden cut */, QuickOpenWidget.MAX_WIDTH);
            if (this.element) {
                // quick open
                this.element.style.width = `${quickOpenWidth}px`;
                this.element.style.marginLeft = `-${quickOpenWidth / 2}px`;
                // input field
                this.inputContainer.style.width = `${quickOpenWidth - 12}px`;
            }
        }
        gainingFocus() {
            this.isLoosingFocus = false;
        }
        loosingFocus(e) {
            if (!this.isVisible()) {
                return;
            }
            const relatedTarget = e.relatedTarget;
            if (!this.quickNavigateConfiguration && DOM.isAncestor(relatedTarget, this.element)) {
                return; // user clicked somewhere into quick open widget, do not close thereby
            }
            this.isLoosingFocus = true;
            setTimeout(() => {
                if (!this.isLoosingFocus || this.isDisposed) {
                    return;
                }
                const veto = this.callbacks.onFocusLost && this.callbacks.onFocusLost();
                if (!veto) {
                    this.hide(1 /* FOCUS_LOST */);
                }
            }, 0);
        }
        dispose() {
            super.dispose();
            this.isDisposed = true;
        }
    }
    exports.QuickOpenWidget = QuickOpenWidget;
    QuickOpenWidget.MAX_WIDTH = 600; // Max total width of quick open widget
    QuickOpenWidget.MAX_ITEMS_HEIGHT = 20 * 22; // Max height of item list below input field
});
//# sourceMappingURL=quickOpenWidget.js.map