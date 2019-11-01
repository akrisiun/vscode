/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/keybinding/common/keybindingsRegistry", "vs/base/browser/ui/list/listWidget", "vs/platform/list/browser/listService", "vs/base/browser/ui/list/listPaging", "vs/base/common/arrays", "vs/platform/contextkey/common/contextkey", "vs/base/browser/ui/tree/objectTree", "vs/base/browser/ui/tree/asyncDataTree", "vs/base/browser/ui/tree/dataTree", "vs/platform/commands/common/commands"], function (require, exports, keybindingsRegistry_1, listWidget_1, listService_1, listPaging_1, arrays_1, contextkey_1, objectTree_1, asyncDataTree_1, dataTree_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function ensureDOMFocus(widget) {
        // it can happen that one of the commands is executed while
        // DOM focus is within another focusable control within the
        // list/tree item. therefor we should ensure that the
        // list/tree has DOM focus again after the command ran.
        if (widget && widget.getHTMLElement() !== document.activeElement) {
            widget.domFocus();
        }
    }
    function focusDown(accessor, arg2, loop = false) {
        const focused = accessor.get(listService_1.IListService).lastFocusedList;
        const count = typeof arg2 === 'number' ? arg2 : 1;
        // Ensure DOM Focus
        ensureDOMFocus(focused);
        // List
        if (focused instanceof listWidget_1.List || focused instanceof listPaging_1.PagedList) {
            const list = focused;
            list.focusNext(count);
            const listFocus = list.getFocus();
            if (listFocus.length) {
                list.reveal(listFocus[0]);
            }
        }
        // ObjectTree
        else if (focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
            const tree = focused;
            const fakeKeyboardEvent = new KeyboardEvent('keydown');
            tree.focusNext(count, loop, fakeKeyboardEvent);
            const listFocus = tree.getFocus();
            if (listFocus.length) {
                tree.reveal(listFocus[0]);
            }
        }
        // Tree
        else if (focused) {
            const tree = focused;
            tree.focusNext(count, { origin: 'keyboard' });
            tree.reveal(tree.getFocus());
        }
    }
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusDown',
        weight: 200 /* WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 18 /* DownArrow */,
        mac: {
            primary: 18 /* DownArrow */,
            secondary: [256 /* WinCtrl */ | 44 /* KEY_N */]
        },
        handler: (accessor, arg2) => focusDown(accessor, arg2)
    });
    function expandMultiSelection(focused, previousFocus) {
        // List
        if (focused instanceof listWidget_1.List || focused instanceof listPaging_1.PagedList) {
            const list = focused;
            const focus = list.getFocus() ? list.getFocus()[0] : undefined;
            const selection = list.getSelection();
            if (selection && typeof focus === 'number' && selection.indexOf(focus) >= 0) {
                list.setSelection(selection.filter(s => s !== previousFocus));
            }
            else {
                if (typeof focus === 'number') {
                    list.setSelection(selection.concat(focus));
                }
            }
        }
        // ObjectTree
        else if (focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
            const list = focused;
            const focus = list.getFocus() ? list.getFocus()[0] : undefined;
            if (previousFocus === focus) {
                return;
            }
            const selection = list.getSelection();
            const fakeKeyboardEvent = new KeyboardEvent('keydown', { shiftKey: true });
            if (selection && selection.indexOf(focus) >= 0) {
                list.setSelection(selection.filter(s => s !== previousFocus), fakeKeyboardEvent);
            }
            else {
                list.setSelection(selection.concat(focus), fakeKeyboardEvent);
            }
        }
        // Tree
        else if (focused) {
            const tree = focused;
            const focus = tree.getFocus();
            const selection = tree.getSelection();
            if (selection && selection.indexOf(focus) >= 0) {
                tree.setSelection(selection.filter(s => s !== previousFocus));
            }
            else {
                tree.setSelection(selection.concat(focus));
            }
        }
    }
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.expandSelectionDown',
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(listService_1.WorkbenchListFocusContextKey, listService_1.WorkbenchListSupportsMultiSelectContextKey),
        primary: 1024 /* Shift */ | 18 /* DownArrow */,
        handler: (accessor, arg2) => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            // List
            if (focused instanceof listWidget_1.List || focused instanceof listPaging_1.PagedList || focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
                const list = focused;
                // Focus down first
                const previousFocus = list.getFocus() ? list.getFocus()[0] : undefined;
                focusDown(accessor, arg2, false);
                // Then adjust selection
                expandMultiSelection(focused, previousFocus);
            }
            // Tree
            else if (focused) {
                const tree = focused;
                // Focus down first
                const previousFocus = tree.getFocus();
                focusDown(accessor, arg2);
                // Then adjust selection
                expandMultiSelection(focused, previousFocus);
            }
        }
    });
    function focusUp(accessor, arg2, loop = false) {
        const focused = accessor.get(listService_1.IListService).lastFocusedList;
        const count = typeof arg2 === 'number' ? arg2 : 1;
        // Ensure DOM Focus
        ensureDOMFocus(focused);
        // List
        if (focused instanceof listWidget_1.List || focused instanceof listPaging_1.PagedList) {
            const list = focused;
            list.focusPrevious(count);
            const listFocus = list.getFocus();
            if (listFocus.length) {
                list.reveal(listFocus[0]);
            }
        }
        // ObjectTree
        else if (focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
            const tree = focused;
            const fakeKeyboardEvent = new KeyboardEvent('keydown');
            tree.focusPrevious(count, loop, fakeKeyboardEvent);
            const listFocus = tree.getFocus();
            if (listFocus.length) {
                tree.reveal(listFocus[0]);
            }
        }
        // Tree
        else if (focused) {
            const tree = focused;
            tree.focusPrevious(count, { origin: 'keyboard' });
            tree.reveal(tree.getFocus());
        }
    }
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusUp',
        weight: 200 /* WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 16 /* UpArrow */,
        mac: {
            primary: 16 /* UpArrow */,
            secondary: [256 /* WinCtrl */ | 46 /* KEY_P */]
        },
        handler: (accessor, arg2) => focusUp(accessor, arg2)
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.expandSelectionUp',
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(listService_1.WorkbenchListFocusContextKey, listService_1.WorkbenchListSupportsMultiSelectContextKey),
        primary: 1024 /* Shift */ | 16 /* UpArrow */,
        handler: (accessor, arg2) => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            // List
            if (focused instanceof listWidget_1.List || focused instanceof listPaging_1.PagedList || focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
                const list = focused;
                // Focus up first
                const previousFocus = list.getFocus() ? list.getFocus()[0] : undefined;
                focusUp(accessor, arg2, false);
                // Then adjust selection
                expandMultiSelection(focused, previousFocus);
            }
            // Tree
            else if (focused) {
                const tree = focused;
                // Focus up first
                const previousFocus = tree.getFocus();
                focusUp(accessor, arg2);
                // Then adjust selection
                expandMultiSelection(focused, previousFocus);
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.collapse',
        weight: 200 /* WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 15 /* LeftArrow */,
        mac: {
            primary: 15 /* LeftArrow */,
            secondary: [2048 /* CtrlCmd */ | 16 /* UpArrow */]
        },
        handler: (accessor) => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            // Tree only
            if (focused && !(focused instanceof listWidget_1.List || focused instanceof listPaging_1.PagedList)) {
                if (focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
                    const tree = focused;
                    const focusedElements = tree.getFocus();
                    if (focusedElements.length === 0) {
                        return;
                    }
                    const focus = focusedElements[0];
                    if (!tree.collapse(focus)) {
                        const parent = tree.getParentElement(focus);
                        if (parent) {
                            const fakeKeyboardEvent = new KeyboardEvent('keydown');
                            tree.setFocus([parent], fakeKeyboardEvent);
                            tree.reveal(parent);
                        }
                    }
                }
                else {
                    const tree = focused;
                    const focus = tree.getFocus();
                    tree.collapse(focus).then(didCollapse => {
                        if (focus && !didCollapse) {
                            tree.focusParent({ origin: 'keyboard' });
                            return tree.reveal(tree.getFocus());
                        }
                        return undefined;
                    });
                }
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.collapseAll',
        weight: 200 /* WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 2048 /* CtrlCmd */ | 15 /* LeftArrow */,
        mac: {
            primary: 2048 /* CtrlCmd */ | 15 /* LeftArrow */,
            secondary: [2048 /* CtrlCmd */ | 1024 /* Shift */ | 16 /* UpArrow */]
        },
        handler: (accessor) => {
            const focusedTree = accessor.get(listService_1.IListService).lastFocusedList;
            if (focusedTree && !(focusedTree instanceof listWidget_1.List || focusedTree instanceof listPaging_1.PagedList)) {
                focusedTree.collapseAll();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusParent',
        weight: 200 /* WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        handler: (accessor) => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            if (!focused || focused instanceof listWidget_1.List || focused instanceof listPaging_1.PagedList) {
                return;
            }
            if (focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
                const tree = focused;
                const focusedElements = tree.getFocus();
                if (focusedElements.length === 0) {
                    return;
                }
                const focus = focusedElements[0];
                const parent = tree.getParentElement(focus);
                if (parent) {
                    const fakeKeyboardEvent = new KeyboardEvent('keydown');
                    tree.setFocus([parent], fakeKeyboardEvent);
                    tree.reveal(parent);
                }
            }
            else {
                const tree = focused;
                tree.focusParent({ origin: 'keyboard' });
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.expand',
        weight: 200 /* WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 17 /* RightArrow */,
        handler: (accessor) => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            // Tree only
            if (focused && !(focused instanceof listWidget_1.List || focused instanceof listPaging_1.PagedList)) {
                if (focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree) {
                    // TODO@Joao: instead of doing this here, just delegate to a tree method
                    const tree = focused;
                    const focusedElements = tree.getFocus();
                    if (focusedElements.length === 0) {
                        return;
                    }
                    const focus = focusedElements[0];
                    if (!tree.expand(focus)) {
                        const child = tree.getFirstElementChild(focus);
                        if (child) {
                            const node = tree.getNode(child);
                            if (node.visible) {
                                const fakeKeyboardEvent = new KeyboardEvent('keydown');
                                tree.setFocus([child], fakeKeyboardEvent);
                                tree.reveal(child);
                            }
                        }
                    }
                }
                else if (focused instanceof asyncDataTree_1.AsyncDataTree) {
                    // TODO@Joao: instead of doing this here, just delegate to a tree method
                    const tree = focused;
                    const focusedElements = tree.getFocus();
                    if (focusedElements.length === 0) {
                        return;
                    }
                    const focus = focusedElements[0];
                    tree.expand(focus).then(didExpand => {
                        if (focus && !didExpand) {
                            const child = tree.getFirstElementChild(focus);
                            if (child) {
                                const node = tree.getNode(child);
                                if (node.visible) {
                                    const fakeKeyboardEvent = new KeyboardEvent('keydown');
                                    tree.setFocus([child], fakeKeyboardEvent);
                                    tree.reveal(child);
                                }
                            }
                        }
                    });
                }
                else {
                    const tree = focused;
                    const focus = tree.getFocus();
                    tree.expand(focus).then(didExpand => {
                        if (focus && !didExpand) {
                            tree.focusFirstChild({ origin: 'keyboard' });
                            return tree.reveal(tree.getFocus());
                        }
                        return undefined;
                    });
                }
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusPageUp',
        weight: 200 /* WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 11 /* PageUp */,
        handler: (accessor) => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            // Ensure DOM Focus
            ensureDOMFocus(focused);
            // List
            if (focused instanceof listWidget_1.List || focused instanceof listPaging_1.PagedList) {
                const list = focused;
                list.focusPreviousPage();
                list.reveal(list.getFocus()[0]);
            }
            // ObjectTree
            else if (focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
                const list = focused;
                const fakeKeyboardEvent = new KeyboardEvent('keydown');
                list.focusPreviousPage(fakeKeyboardEvent);
                list.reveal(list.getFocus()[0]);
            }
            // Tree
            else if (focused) {
                const tree = focused;
                tree.focusPreviousPage({ origin: 'keyboard' });
                tree.reveal(tree.getFocus());
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusPageDown',
        weight: 200 /* WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 12 /* PageDown */,
        handler: (accessor) => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            // Ensure DOM Focus
            ensureDOMFocus(focused);
            // List
            if (focused instanceof listWidget_1.List || focused instanceof listPaging_1.PagedList) {
                const list = focused;
                list.focusNextPage();
                list.reveal(list.getFocus()[0]);
            }
            // ObjectTree
            else if (focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
                const list = focused;
                const fakeKeyboardEvent = new KeyboardEvent('keydown');
                list.focusNextPage(fakeKeyboardEvent);
                list.reveal(list.getFocus()[0]);
            }
            // Tree
            else if (focused) {
                const tree = focused;
                tree.focusNextPage({ origin: 'keyboard' });
                tree.reveal(tree.getFocus());
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusFirst',
        weight: 200 /* WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 14 /* Home */,
        handler: accessor => listFocusFirst(accessor)
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusFirstChild',
        weight: 200 /* WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 0,
        handler: accessor => listFocusFirst(accessor, { fromFocused: true })
    });
    function listFocusFirst(accessor, options) {
        const focused = accessor.get(listService_1.IListService).lastFocusedList;
        // Ensure DOM Focus
        ensureDOMFocus(focused);
        // List
        if (focused instanceof listWidget_1.List || focused instanceof listPaging_1.PagedList) {
            const list = focused;
            list.setFocus([0]);
            list.reveal(0);
        }
        // ObjectTree
        else if (focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
            const tree = focused;
            const fakeKeyboardEvent = new KeyboardEvent('keydown');
            tree.focusFirst(fakeKeyboardEvent);
            const focus = tree.getFocus();
            if (focus.length > 0) {
                tree.reveal(focus[0]);
            }
        }
        // Tree
        else if (focused) {
            const tree = focused;
            tree.focusFirst({ origin: 'keyboard' }, options && options.fromFocused ? tree.getFocus() : undefined);
            tree.reveal(tree.getFocus());
        }
    }
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusLast',
        weight: 200 /* WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 13 /* End */,
        handler: accessor => listFocusLast(accessor)
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusLastChild',
        weight: 200 /* WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 0,
        handler: accessor => listFocusLast(accessor, { fromFocused: true })
    });
    function listFocusLast(accessor, options) {
        const focused = accessor.get(listService_1.IListService).lastFocusedList;
        // Ensure DOM Focus
        ensureDOMFocus(focused);
        // List
        if (focused instanceof listWidget_1.List || focused instanceof listPaging_1.PagedList) {
            const list = focused;
            list.setFocus([list.length - 1]);
            list.reveal(list.length - 1);
        }
        // ObjectTree
        else if (focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
            const tree = focused;
            const fakeKeyboardEvent = new KeyboardEvent('keydown');
            tree.focusLast(fakeKeyboardEvent);
            const focus = tree.getFocus();
            if (focus.length > 0) {
                tree.reveal(focus[0]);
            }
        }
        // Tree
        else if (focused) {
            const tree = focused;
            tree.focusLast({ origin: 'keyboard' }, options && options.fromFocused ? tree.getFocus() : undefined);
            tree.reveal(tree.getFocus());
        }
    }
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.select',
        weight: 200 /* WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 3 /* Enter */,
        mac: {
            primary: 3 /* Enter */,
            secondary: [2048 /* CtrlCmd */ | 18 /* DownArrow */]
        },
        handler: (accessor) => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            // List
            if (focused instanceof listWidget_1.List || focused instanceof listPaging_1.PagedList) {
                const list = focused;
                list.setSelection(list.getFocus());
                list.open(list.getFocus());
            }
            // ObjectTree
            else if (focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
                const list = focused;
                const fakeKeyboardEvent = listService_1.getSelectionKeyboardEvent('keydown', false);
                const focus = list.getFocus();
                if (focus.length > 0) {
                    let toggleCollapsed = true;
                    if (list.expandOnlyOnTwistieClick === true) {
                        toggleCollapsed = false;
                    }
                    else if (typeof list.expandOnlyOnTwistieClick !== 'boolean' && list.expandOnlyOnTwistieClick(focus[0])) {
                        toggleCollapsed = false;
                    }
                    if (toggleCollapsed) {
                        list.toggleCollapsed(focus[0]);
                    }
                }
                list.setSelection(focus, fakeKeyboardEvent);
                list.open(focus, fakeKeyboardEvent);
            }
            // Tree
            else if (focused) {
                const tree = focused;
                const focus = tree.getFocus();
                if (focus) {
                    tree.setSelection([focus], { origin: 'keyboard' });
                }
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.selectAll',
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(listService_1.WorkbenchListFocusContextKey, listService_1.WorkbenchListSupportsMultiSelectContextKey),
        primary: 2048 /* CtrlCmd */ | 31 /* KEY_A */,
        handler: (accessor) => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            // List
            if (focused instanceof listWidget_1.List || focused instanceof listPaging_1.PagedList) {
                const list = focused;
                list.setSelection(arrays_1.range(list.length));
            }
            // Trees
            else if (focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
                const tree = focused;
                const focus = tree.getFocus();
                const selection = tree.getSelection();
                // Which element should be considered to start selecting all?
                let start = undefined;
                if (focus.length > 0 && (selection.length === 0 || selection.indexOf(focus[0]) === -1)) {
                    start = focus[0];
                }
                if (!start && selection.length > 0) {
                    start = selection[0];
                }
                // What is the scope of select all?
                let scope = undefined;
                if (!start) {
                    scope = undefined;
                }
                else {
                    scope = tree.getParentElement(start);
                }
                const newSelection = [];
                const visit = (node) => {
                    for (const child of node.children) {
                        if (child.visible) {
                            newSelection.push(child.element);
                            if (!child.collapsed) {
                                visit(child);
                            }
                        }
                    }
                };
                // Add the whole scope subtree to the new selection
                visit(tree.getNode(scope));
                // If the scope isn't the tree root, it should be part of the new selection
                if (scope && selection.length === newSelection.length) {
                    newSelection.unshift(scope);
                }
                const fakeKeyboardEvent = new KeyboardEvent('keydown');
                tree.setSelection(newSelection, fakeKeyboardEvent);
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.toggleExpand',
        weight: 200 /* WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 10 /* Space */,
        handler: (accessor) => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            // Tree only
            if (focused && !(focused instanceof listWidget_1.List || focused instanceof listPaging_1.PagedList)) {
                if (focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
                    const tree = focused;
                    const focus = tree.getFocus();
                    if (focus.length === 0) {
                        return;
                    }
                    tree.toggleCollapsed(focus[0]);
                }
                else {
                    const tree = focused;
                    const focus = tree.getFocus();
                    if (focus) {
                        tree.toggleExpansion(focus);
                    }
                }
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.clear',
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(listService_1.WorkbenchListFocusContextKey, listService_1.WorkbenchListHasSelectionOrFocus),
        primary: 9 /* Escape */,
        handler: (accessor) => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            // List
            if (focused instanceof listWidget_1.List || focused instanceof listPaging_1.PagedList) {
                const list = focused;
                list.setSelection([]);
                list.setFocus([]);
            }
            // ObjectTree
            else if (focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
                const list = focused;
                const fakeKeyboardEvent = new KeyboardEvent('keydown');
                list.setSelection([], fakeKeyboardEvent);
                list.setFocus([], fakeKeyboardEvent);
            }
            // Tree
            else if (focused) {
                const tree = focused;
                tree.clearSelection({ origin: 'keyboard' });
                tree.clearFocus({ origin: 'keyboard' });
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'list.toggleKeyboardNavigation',
        handler: (accessor) => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            // List
            if (focused instanceof listWidget_1.List || focused instanceof listPaging_1.PagedList) {
                const list = focused;
                list.toggleKeyboardNavigation();
            }
            // ObjectTree
            else if (focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
                const tree = focused;
                tree.toggleKeyboardNavigation();
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'list.toggleFilterOnType',
        handler: (accessor) => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            // List
            if (focused instanceof listWidget_1.List || focused instanceof listPaging_1.PagedList) {
                // TODO@joao
            }
            // ObjectTree
            else if (focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
                const tree = focused;
                tree.updateOptions({ filterOnType: !tree.filterOnType });
            }
        }
    });
});
//# sourceMappingURL=listCommands.js.map