/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/base/common/platform", "vs/base/common/errors", "vs/base/browser/dom", "vs/base/common/keyCodes"], function (require, exports, nls, actions_1, platform, errors, dom, keyCodes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ClickBehavior;
    (function (ClickBehavior) {
        /**
         * Handle the click when the mouse button is pressed but not released yet.
         */
        ClickBehavior[ClickBehavior["ON_MOUSE_DOWN"] = 0] = "ON_MOUSE_DOWN";
        /**
         * Handle the click when the mouse button is released.
         */
        ClickBehavior[ClickBehavior["ON_MOUSE_UP"] = 1] = "ON_MOUSE_UP";
    })(ClickBehavior = exports.ClickBehavior || (exports.ClickBehavior = {}));
    var OpenMode;
    (function (OpenMode) {
        OpenMode[OpenMode["SINGLE_CLICK"] = 0] = "SINGLE_CLICK";
        OpenMode[OpenMode["DOUBLE_CLICK"] = 1] = "DOUBLE_CLICK";
    })(OpenMode = exports.OpenMode || (exports.OpenMode = {}));
    class KeybindingDispatcher {
        constructor() {
            this._arr = [];
        }
        has(keybinding) {
            let target = keyCodes_1.createKeybinding(keybinding, platform.OS);
            if (target !== null) {
                for (const a of this._arr) {
                    if (target.equals(a.keybinding)) {
                        return true;
                    }
                }
            }
            return false;
        }
        set(keybinding, callback) {
            this._arr.push({
                keybinding: keyCodes_1.createKeybinding(keybinding, platform.OS),
                callback: callback
            });
        }
        dispatch(keybinding) {
            // Loop from the last to the first to handle overwrites
            for (let i = this._arr.length - 1; i >= 0; i--) {
                let item = this._arr[i];
                if (keybinding.toChord().equals(item.keybinding)) {
                    return item.callback;
                }
            }
            return null;
        }
    }
    exports.KeybindingDispatcher = KeybindingDispatcher;
    class DefaultController {
        constructor(options = { clickBehavior: 0 /* ON_MOUSE_DOWN */, keyboardSupport: true, openMode: 0 /* SINGLE_CLICK */ }) {
            this.options = options;
            this.downKeyBindingDispatcher = new KeybindingDispatcher();
            this.upKeyBindingDispatcher = new KeybindingDispatcher();
            if (typeof options.keyboardSupport !== 'boolean' || options.keyboardSupport) {
                this.downKeyBindingDispatcher.set(16 /* UpArrow */, (t, e) => this.onUp(t, e));
                this.downKeyBindingDispatcher.set(18 /* DownArrow */, (t, e) => this.onDown(t, e));
                this.downKeyBindingDispatcher.set(15 /* LeftArrow */, (t, e) => this.onLeft(t, e));
                this.downKeyBindingDispatcher.set(17 /* RightArrow */, (t, e) => this.onRight(t, e));
                if (platform.isMacintosh) {
                    this.downKeyBindingDispatcher.set(2048 /* CtrlCmd */ | 16 /* UpArrow */, (t, e) => this.onLeft(t, e));
                    this.downKeyBindingDispatcher.set(256 /* WinCtrl */ | 44 /* KEY_N */, (t, e) => this.onDown(t, e));
                    this.downKeyBindingDispatcher.set(256 /* WinCtrl */ | 46 /* KEY_P */, (t, e) => this.onUp(t, e));
                }
                this.downKeyBindingDispatcher.set(11 /* PageUp */, (t, e) => this.onPageUp(t, e));
                this.downKeyBindingDispatcher.set(12 /* PageDown */, (t, e) => this.onPageDown(t, e));
                this.downKeyBindingDispatcher.set(14 /* Home */, (t, e) => this.onHome(t, e));
                this.downKeyBindingDispatcher.set(13 /* End */, (t, e) => this.onEnd(t, e));
                this.downKeyBindingDispatcher.set(10 /* Space */, (t, e) => this.onSpace(t, e));
                this.downKeyBindingDispatcher.set(9 /* Escape */, (t, e) => this.onEscape(t, e));
                this.upKeyBindingDispatcher.set(3 /* Enter */, this.onEnter.bind(this));
                this.upKeyBindingDispatcher.set(2048 /* CtrlCmd */ | 3 /* Enter */, this.onEnter.bind(this));
            }
        }
        onMouseDown(tree, element, event, origin = 'mouse') {
            if (this.options.clickBehavior === 0 /* ON_MOUSE_DOWN */ && (event.leftButton || event.middleButton)) {
                if (event.target) {
                    if (event.target.tagName && event.target.tagName.toLowerCase() === 'input') {
                        return false; // Ignore event if target is a form input field (avoids browser specific issues)
                    }
                    if (dom.findParentWithClass(event.target, 'scrollbar', 'monaco-tree')) {
                        return false;
                    }
                    if (dom.findParentWithClass(event.target, 'monaco-action-bar', 'row')) { // TODO@Joao not very nice way of checking for the action bar (implicit knowledge)
                        return false; // Ignore event if target is over an action bar of the row
                    }
                }
                // Propagate to onLeftClick now
                return this.onLeftClick(tree, element, event, origin);
            }
            return false;
        }
        onClick(tree, element, event) {
            const isMac = platform.isMacintosh;
            // A Ctrl click on the Mac is a context menu event
            if (isMac && event.ctrlKey) {
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
            if (event.target && event.target.tagName && event.target.tagName.toLowerCase() === 'input') {
                return false; // Ignore event if target is a form input field (avoids browser specific issues)
            }
            if (this.options.clickBehavior === 0 /* ON_MOUSE_DOWN */ && (event.leftButton || event.middleButton)) {
                return false; // Already handled by onMouseDown
            }
            return this.onLeftClick(tree, element, event);
        }
        onLeftClick(tree, element, eventish, origin = 'mouse') {
            const event = eventish;
            const payload = { origin: origin, originalEvent: eventish, didClickOnTwistie: this.isClickOnTwistie(event) };
            if (tree.getInput() === element) {
                tree.clearFocus(payload);
                tree.clearSelection(payload);
            }
            else {
                const isSingleMouseDown = eventish && event.browserEvent && event.browserEvent.type === 'mousedown' && event.browserEvent.detail === 1;
                if (!isSingleMouseDown) {
                    eventish.preventDefault(); // we cannot preventDefault onMouseDown with single click because this would break DND otherwise
                }
                eventish.stopPropagation();
                tree.domFocus();
                tree.setSelection([element], payload);
                tree.setFocus(element, payload);
                if (this.shouldToggleExpansion(element, event, origin)) {
                    if (tree.isExpanded(element)) {
                        tree.collapse(element).then(undefined, errors.onUnexpectedError);
                    }
                    else {
                        tree.expand(element).then(undefined, errors.onUnexpectedError);
                    }
                }
            }
            return true;
        }
        shouldToggleExpansion(element, event, origin) {
            const isDoubleClick = (origin === 'mouse' && event.detail === 2);
            return this.openOnSingleClick || isDoubleClick || this.isClickOnTwistie(event);
        }
        setOpenMode(openMode) {
            this.options.openMode = openMode;
        }
        get openOnSingleClick() {
            return this.options.openMode === 0 /* SINGLE_CLICK */;
        }
        isClickOnTwistie(event) {
            let element = event.target;
            if (!dom.hasClass(element, 'content')) {
                return false;
            }
            const twistieStyle = window.getComputedStyle(element, ':before');
            if (twistieStyle.backgroundImage === 'none' || twistieStyle.display === 'none') {
                return false;
            }
            const twistieWidth = parseInt(twistieStyle.width) + parseInt(twistieStyle.paddingRight);
            return event.browserEvent.offsetX <= twistieWidth;
        }
        onContextMenu(tree, element, event) {
            if (event.target && event.target.tagName && event.target.tagName.toLowerCase() === 'input') {
                return false; // allow context menu on input fields
            }
            // Prevent native context menu from showing up
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            return false;
        }
        onTap(tree, element, event) {
            const target = event.initialTarget;
            if (target && target.tagName && target.tagName.toLowerCase() === 'input') {
                return false; // Ignore event if target is a form input field (avoids browser specific issues)
            }
            return this.onLeftClick(tree, element, event, 'touch');
        }
        onKeyDown(tree, event) {
            return this.onKey(this.downKeyBindingDispatcher, tree, event);
        }
        onKeyUp(tree, event) {
            return this.onKey(this.upKeyBindingDispatcher, tree, event);
        }
        onKey(bindings, tree, event) {
            const handler = bindings.dispatch(event.toKeybinding());
            if (handler) {
                // TODO: TS 3.1 upgrade. Why are we checking against void?
                if (handler(tree, event)) {
                    event.preventDefault();
                    event.stopPropagation();
                    return true;
                }
            }
            return false;
        }
        onUp(tree, event) {
            const payload = { origin: 'keyboard', originalEvent: event };
            if (tree.getHighlight()) {
                tree.clearHighlight(payload);
            }
            else {
                tree.focusPrevious(1, payload);
                tree.reveal(tree.getFocus()).then(undefined, errors.onUnexpectedError);
            }
            return true;
        }
        onPageUp(tree, event) {
            const payload = { origin: 'keyboard', originalEvent: event };
            if (tree.getHighlight()) {
                tree.clearHighlight(payload);
            }
            else {
                tree.focusPreviousPage(payload);
                tree.reveal(tree.getFocus()).then(undefined, errors.onUnexpectedError);
            }
            return true;
        }
        onDown(tree, event) {
            const payload = { origin: 'keyboard', originalEvent: event };
            if (tree.getHighlight()) {
                tree.clearHighlight(payload);
            }
            else {
                tree.focusNext(1, payload);
                tree.reveal(tree.getFocus()).then(undefined, errors.onUnexpectedError);
            }
            return true;
        }
        onPageDown(tree, event) {
            const payload = { origin: 'keyboard', originalEvent: event };
            if (tree.getHighlight()) {
                tree.clearHighlight(payload);
            }
            else {
                tree.focusNextPage(payload);
                tree.reveal(tree.getFocus()).then(undefined, errors.onUnexpectedError);
            }
            return true;
        }
        onHome(tree, event) {
            const payload = { origin: 'keyboard', originalEvent: event };
            if (tree.getHighlight()) {
                tree.clearHighlight(payload);
            }
            else {
                tree.focusFirst(payload);
                tree.reveal(tree.getFocus()).then(undefined, errors.onUnexpectedError);
            }
            return true;
        }
        onEnd(tree, event) {
            const payload = { origin: 'keyboard', originalEvent: event };
            if (tree.getHighlight()) {
                tree.clearHighlight(payload);
            }
            else {
                tree.focusLast(payload);
                tree.reveal(tree.getFocus()).then(undefined, errors.onUnexpectedError);
            }
            return true;
        }
        onLeft(tree, event) {
            const payload = { origin: 'keyboard', originalEvent: event };
            if (tree.getHighlight()) {
                tree.clearHighlight(payload);
            }
            else {
                const focus = tree.getFocus();
                tree.collapse(focus).then(didCollapse => {
                    if (focus && !didCollapse) {
                        tree.focusParent(payload);
                        return tree.reveal(tree.getFocus());
                    }
                    return undefined;
                }).then(undefined, errors.onUnexpectedError);
            }
            return true;
        }
        onRight(tree, event) {
            const payload = { origin: 'keyboard', originalEvent: event };
            if (tree.getHighlight()) {
                tree.clearHighlight(payload);
            }
            else {
                const focus = tree.getFocus();
                tree.expand(focus).then(didExpand => {
                    if (focus && !didExpand) {
                        tree.focusFirstChild(payload);
                        return tree.reveal(tree.getFocus());
                    }
                    return undefined;
                }).then(undefined, errors.onUnexpectedError);
            }
            return true;
        }
        onEnter(tree, event) {
            const payload = { origin: 'keyboard', originalEvent: event };
            if (tree.getHighlight()) {
                return false;
            }
            const focus = tree.getFocus();
            if (focus) {
                tree.setSelection([focus], payload);
            }
            return true;
        }
        onSpace(tree, event) {
            if (tree.getHighlight()) {
                return false;
            }
            const focus = tree.getFocus();
            if (focus) {
                tree.toggleExpansion(focus);
            }
            return true;
        }
        onEscape(tree, event) {
            const payload = { origin: 'keyboard', originalEvent: event };
            if (tree.getHighlight()) {
                tree.clearHighlight(payload);
                return true;
            }
            if (tree.getSelection().length) {
                tree.clearSelection(payload);
                return true;
            }
            if (tree.getFocus()) {
                tree.clearFocus(payload);
                return true;
            }
            return false;
        }
    }
    exports.DefaultController = DefaultController;
    class DefaultDragAndDrop {
        getDragURI(tree, element) {
            return null;
        }
        onDragStart(tree, data, originalEvent) {
            return;
        }
        onDragOver(tree, data, targetElement, originalEvent) {
            return null;
        }
        drop(tree, data, targetElement, originalEvent) {
            return;
        }
    }
    exports.DefaultDragAndDrop = DefaultDragAndDrop;
    class DefaultFilter {
        isVisible(tree, element) {
            return true;
        }
    }
    exports.DefaultFilter = DefaultFilter;
    class DefaultSorter {
        compare(tree, element, otherElement) {
            return 0;
        }
    }
    exports.DefaultSorter = DefaultSorter;
    class DefaultAccessibilityProvider {
        getAriaLabel(tree, element) {
            return null;
        }
    }
    exports.DefaultAccessibilityProvider = DefaultAccessibilityProvider;
    class DefaultTreestyler {
        constructor(styleElement, selectorSuffix) {
            this.styleElement = styleElement;
            this.selectorSuffix = selectorSuffix;
        }
        style(styles) {
            const suffix = this.selectorSuffix ? `.${this.selectorSuffix}` : '';
            const content = [];
            if (styles.listFocusBackground) {
                content.push(`.monaco-tree${suffix}.focused .monaco-tree-rows > .monaco-tree-row.focused:not(.highlighted) { background-color: ${styles.listFocusBackground}; }`);
            }
            if (styles.listFocusForeground) {
                content.push(`.monaco-tree${suffix}.focused .monaco-tree-rows > .monaco-tree-row.focused:not(.highlighted) { color: ${styles.listFocusForeground}; }`);
            }
            if (styles.listActiveSelectionBackground) {
                content.push(`.monaco-tree${suffix}.focused .monaco-tree-rows > .monaco-tree-row.selected:not(.highlighted) { background-color: ${styles.listActiveSelectionBackground}; }`);
            }
            if (styles.listActiveSelectionForeground) {
                content.push(`.monaco-tree${suffix}.focused .monaco-tree-rows > .monaco-tree-row.selected:not(.highlighted) { color: ${styles.listActiveSelectionForeground}; }`);
            }
            if (styles.listFocusAndSelectionBackground) {
                content.push(`
				.monaco-tree-drag-image,
				.monaco-tree${suffix}.focused .monaco-tree-rows > .monaco-tree-row.focused.selected:not(.highlighted) { background-color: ${styles.listFocusAndSelectionBackground}; }
			`);
            }
            if (styles.listFocusAndSelectionForeground) {
                content.push(`
				.monaco-tree-drag-image,
				.monaco-tree${suffix}.focused .monaco-tree-rows > .monaco-tree-row.focused.selected:not(.highlighted) { color: ${styles.listFocusAndSelectionForeground}; }
			`);
            }
            if (styles.listInactiveSelectionBackground) {
                content.push(`.monaco-tree${suffix} .monaco-tree-rows > .monaco-tree-row.selected:not(.highlighted) { background-color: ${styles.listInactiveSelectionBackground}; }`);
            }
            if (styles.listInactiveSelectionForeground) {
                content.push(`.monaco-tree${suffix} .monaco-tree-rows > .monaco-tree-row.selected:not(.highlighted) { color: ${styles.listInactiveSelectionForeground}; }`);
            }
            if (styles.listHoverBackground) {
                content.push(`.monaco-tree${suffix} .monaco-tree-rows > .monaco-tree-row:hover:not(.highlighted):not(.selected):not(.focused) { background-color: ${styles.listHoverBackground}; }`);
            }
            if (styles.listHoverForeground) {
                content.push(`.monaco-tree${suffix} .monaco-tree-rows > .monaco-tree-row:hover:not(.highlighted):not(.selected):not(.focused) { color: ${styles.listHoverForeground}; }`);
            }
            if (styles.listDropBackground) {
                content.push(`
				.monaco-tree${suffix} .monaco-tree-wrapper.drop-target,
				.monaco-tree${suffix} .monaco-tree-rows > .monaco-tree-row.drop-target { background-color: ${styles.listDropBackground} !important; color: inherit !important; }
			`);
            }
            if (styles.listFocusOutline) {
                content.push(`
				.monaco-tree-drag-image																															{ border: 1px solid ${styles.listFocusOutline}; background: #000; }
				.monaco-tree${suffix} .monaco-tree-rows > .monaco-tree-row 														{ border: 1px solid transparent; }
				.monaco-tree${suffix}.focused .monaco-tree-rows > .monaco-tree-row.focused:not(.highlighted) 						{ border: 1px dotted ${styles.listFocusOutline}; }
				.monaco-tree${suffix}.focused .monaco-tree-rows > .monaco-tree-row.selected:not(.highlighted) 						{ border: 1px solid ${styles.listFocusOutline}; }
				.monaco-tree${suffix} .monaco-tree-rows > .monaco-tree-row.selected:not(.highlighted)  							{ border: 1px solid ${styles.listFocusOutline}; }
				.monaco-tree${suffix} .monaco-tree-rows > .monaco-tree-row:hover:not(.highlighted):not(.selected):not(.focused)  	{ border: 1px dashed ${styles.listFocusOutline}; }
				.monaco-tree${suffix} .monaco-tree-wrapper.drop-target,
				.monaco-tree${suffix} .monaco-tree-rows > .monaco-tree-row.drop-target												{ border: 1px dashed ${styles.listFocusOutline}; }
			`);
            }
            const newStyles = content.join('\n');
            if (newStyles !== this.styleElement.innerHTML) {
                this.styleElement.innerHTML = newStyles;
            }
        }
    }
    exports.DefaultTreestyler = DefaultTreestyler;
    class CollapseAllAction extends actions_1.Action {
        constructor(viewer, enabled) {
            super('vs.tree.collapse', nls.localize('collapse all', "Collapse All"), 'monaco-tree-action collapse-all', enabled);
            this.viewer = viewer;
        }
        run(context) {
            if (this.viewer.getHighlight()) {
                return Promise.resolve(); // Global action disabled if user is in edit mode from another action
            }
            this.viewer.collapseAll();
            this.viewer.clearSelection();
            this.viewer.clearFocus();
            this.viewer.domFocus();
            this.viewer.focusFirst();
            return Promise.resolve();
        }
    }
    exports.CollapseAllAction = CollapseAllAction;
});
//# sourceMappingURL=treeDefaults.js.map