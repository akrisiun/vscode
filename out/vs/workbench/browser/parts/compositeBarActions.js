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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/commands/common/commands", "vs/base/common/lifecycle", "vs/platform/contextview/browser/contextView", "vs/platform/theme/common/themeService", "vs/workbench/services/activity/common/activity", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/colorRegistry", "vs/base/browser/dnd", "vs/platform/keybinding/common/keybinding", "vs/base/common/event", "vs/workbench/browser/dnd"], function (require, exports, nls, actions_1, dom, actionbar_1, commands_1, lifecycle_1, contextView_1, themeService_1, activity_1, instantiation_1, colorRegistry_1, dnd_1, keybinding_1, event_1, dnd_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ActivityAction extends actions_1.Action {
        constructor(_activity) {
            super(_activity.id, _activity.name, _activity.cssClass);
            this._activity = _activity;
            this._onDidChangeActivity = new event_1.Emitter();
            this.onDidChangeActivity = this._onDidChangeActivity.event;
            this._onDidChangeBadge = new event_1.Emitter();
            this.onDidChangeBadge = this._onDidChangeBadge.event;
        }
        get activity() {
            return this._activity;
        }
        set activity(activity) {
            this._activity = activity;
            this._onDidChangeActivity.fire(this);
        }
        activate() {
            if (!this.checked) {
                this._setChecked(true);
            }
        }
        deactivate() {
            if (this.checked) {
                this._setChecked(false);
            }
        }
        getBadge() {
            return this.badge;
        }
        getClass() {
            return this.clazz;
        }
        setBadge(badge, clazz) {
            this.badge = badge;
            this.clazz = clazz;
            this._onDidChangeBadge.fire(this);
        }
        dispose() {
            this._onDidChangeActivity.dispose();
            this._onDidChangeBadge.dispose();
            super.dispose();
        }
    }
    exports.ActivityAction = ActivityAction;
    let ActivityActionViewItem = class ActivityActionViewItem extends actionbar_1.BaseActionViewItem {
        constructor(action, options, themeService) {
            super(null, action, options);
            this.themeService = themeService;
            this.badgeDisposable = this._register(new lifecycle_1.MutableDisposable());
            this._register(this.themeService.onThemeChange(this.onThemeChange, this));
            this._register(action.onDidChangeActivity(this.updateActivity, this));
            this._register(action.onDidChangeBadge(this.updateBadge, this));
        }
        get activity() {
            return this._action.activity;
        }
        updateStyles() {
            const theme = this.themeService.getTheme();
            const colors = this.options.colors(theme);
            if (this.label) {
                if (this.options.icon) {
                    const foreground = this._action.checked ? colors.activeBackgroundColor || colors.activeForegroundColor : colors.inactiveBackgroundColor || colors.inactiveForegroundColor;
                    this.label.style.backgroundColor = foreground ? foreground.toString() : null;
                }
                else {
                    const foreground = this._action.checked ? colors.activeForegroundColor : colors.inactiveForegroundColor;
                    const borderBottomColor = this._action.checked ? colors.activeBorderBottomColor : null;
                    this.label.style.color = foreground ? foreground.toString() : null;
                    this.label.style.borderBottomColor = borderBottomColor ? borderBottomColor.toString() : null;
                }
            }
            // Badge
            if (this.badgeContent) {
                const badgeForeground = colors.badgeForeground;
                const badgeBackground = colors.badgeBackground;
                const contrastBorderColor = theme.getColor(colorRegistry_1.contrastBorder);
                this.badgeContent.style.color = badgeForeground ? badgeForeground.toString() : null;
                this.badgeContent.style.backgroundColor = badgeBackground ? badgeBackground.toString() : null;
                this.badgeContent.style.borderStyle = contrastBorderColor ? 'solid' : null;
                this.badgeContent.style.borderWidth = contrastBorderColor ? '1px' : null;
                this.badgeContent.style.borderColor = contrastBorderColor ? contrastBorderColor.toString() : null;
            }
        }
        render(container) {
            super.render(container);
            this.container = container;
            // Make the container tab-able for keyboard navigation
            this.container.tabIndex = 0;
            this.container.setAttribute('role', this.options.icon ? 'button' : 'tab');
            // Try hard to prevent keyboard only focus feedback when using mouse
            this._register(dom.addDisposableListener(this.container, dom.EventType.MOUSE_DOWN, () => {
                dom.addClass(this.container, 'clicked');
            }));
            this._register(dom.addDisposableListener(this.container, dom.EventType.MOUSE_UP, () => {
                if (this.mouseUpTimeout) {
                    clearTimeout(this.mouseUpTimeout);
                }
                this.mouseUpTimeout = setTimeout(() => {
                    dom.removeClass(this.container, 'clicked');
                }, 800); // delayed to prevent focus feedback from showing on mouse up
            }));
            // Label
            this.label = dom.append(this.element, dom.$('a'));
            // Badge
            this.badge = dom.append(this.element, dom.$('.badge'));
            this.badgeContent = dom.append(this.badge, dom.$('.badge-content'));
            dom.hide(this.badge);
            this.updateActivity();
            this.updateStyles();
        }
        onThemeChange(theme) {
            this.updateStyles();
        }
        updateActivity() {
            this.updateLabel();
            this.updateTitle(this.activity.name);
            this.updateBadge();
        }
        updateBadge() {
            const action = this.getAction();
            if (!this.badge || !this.badgeContent || !(action instanceof ActivityAction)) {
                return;
            }
            const badge = action.getBadge();
            const clazz = action.getClass();
            this.badgeDisposable.clear();
            dom.clearNode(this.badgeContent);
            dom.hide(this.badge);
            if (badge) {
                // Number
                if (badge instanceof activity_1.NumberBadge) {
                    if (badge.number) {
                        let number = badge.number.toString();
                        if (badge.number > 999) {
                            const noOfThousands = badge.number / 1000;
                            const floor = Math.floor(noOfThousands);
                            if (noOfThousands > floor) {
                                number = `${floor}K+`;
                            }
                            else {
                                number = `${noOfThousands}K`;
                            }
                        }
                        this.badgeContent.textContent = number;
                        dom.show(this.badge);
                    }
                }
                // Text
                else if (badge instanceof activity_1.TextBadge) {
                    this.badgeContent.textContent = badge.text;
                    dom.show(this.badge);
                }
                // Text
                else if (badge instanceof activity_1.IconBadge) {
                    dom.show(this.badge);
                }
                // Progress
                else if (badge instanceof activity_1.ProgressBadge) {
                    dom.show(this.badge);
                }
                if (clazz) {
                    dom.addClasses(this.badge, clazz);
                    this.badgeDisposable.value = lifecycle_1.toDisposable(() => dom.removeClasses(this.badge, clazz));
                }
            }
            // Title
            let title;
            if (badge && badge.getDescription()) {
                if (this.activity.name) {
                    title = nls.localize('badgeTitle', "{0} - {1}", this.activity.name, badge.getDescription());
                }
                else {
                    title = badge.getDescription();
                }
            }
            else {
                title = this.activity.name;
            }
            this.updateTitle(title);
        }
        updateLabel() {
            this.label.className = 'action-label';
            if (this.activity.cssClass) {
                dom.addClass(this.label, this.activity.cssClass);
            }
            if (!this.options.icon) {
                this.label.textContent = this.getAction().label;
            }
        }
        updateTitle(title) {
            [this.label, this.badge, this.container].forEach(element => {
                if (element) {
                    element.setAttribute('aria-label', title);
                    element.title = title;
                }
            });
        }
        dispose() {
            super.dispose();
            if (this.mouseUpTimeout) {
                clearTimeout(this.mouseUpTimeout);
            }
            this.badge.remove();
        }
    };
    ActivityActionViewItem = __decorate([
        __param(2, themeService_1.IThemeService)
    ], ActivityActionViewItem);
    exports.ActivityActionViewItem = ActivityActionViewItem;
    class CompositeOverflowActivityAction extends ActivityAction {
        constructor(showMenu) {
            super({
                id: 'additionalComposites.action',
                name: nls.localize('additionalViews', "Additional Views"),
                cssClass: 'toggle-more'
            });
            this.showMenu = showMenu;
        }
        run(event) {
            this.showMenu();
            return Promise.resolve(true);
        }
    }
    exports.CompositeOverflowActivityAction = CompositeOverflowActivityAction;
    let CompositeOverflowActivityActionViewItem = class CompositeOverflowActivityActionViewItem extends ActivityActionViewItem {
        constructor(action, getOverflowingComposites, getActiveCompositeId, getBadge, getCompositeOpenAction, colors, contextMenuService, themeService) {
            super(action, { icon: true, colors }, themeService);
            this.getOverflowingComposites = getOverflowingComposites;
            this.getActiveCompositeId = getActiveCompositeId;
            this.getBadge = getBadge;
            this.getCompositeOpenAction = getCompositeOpenAction;
            this.contextMenuService = contextMenuService;
        }
        showMenu() {
            if (this.actions) {
                lifecycle_1.dispose(this.actions);
            }
            this.actions = this.getActions();
            this.contextMenuService.showContextMenu({
                getAnchor: () => this.element,
                getActions: () => this.actions,
                onHide: () => lifecycle_1.dispose(this.actions)
            });
        }
        getActions() {
            return this.getOverflowingComposites().map(composite => {
                const action = this.getCompositeOpenAction(composite.id);
                action.radio = this.getActiveCompositeId() === action.id;
                const badge = this.getBadge(composite.id);
                let suffix;
                if (badge instanceof activity_1.NumberBadge) {
                    suffix = badge.number;
                }
                else if (badge instanceof activity_1.TextBadge) {
                    suffix = badge.text;
                }
                if (suffix) {
                    action.label = nls.localize('numberBadge', "{0} ({1})", composite.name, suffix);
                }
                else {
                    action.label = composite.name;
                }
                return action;
            });
        }
        dispose() {
            super.dispose();
            if (this.actions) {
                this.actions = lifecycle_1.dispose(this.actions);
            }
        }
    };
    CompositeOverflowActivityActionViewItem = __decorate([
        __param(6, contextView_1.IContextMenuService),
        __param(7, themeService_1.IThemeService)
    ], CompositeOverflowActivityActionViewItem);
    exports.CompositeOverflowActivityActionViewItem = CompositeOverflowActivityActionViewItem;
    let ManageExtensionAction = class ManageExtensionAction extends actions_1.Action {
        constructor(commandService) {
            super('activitybar.manage.extension', nls.localize('manageExtension', "Manage Extension"));
            this.commandService = commandService;
        }
        run(id) {
            return this.commandService.executeCommand('_extensions.manage', id);
        }
    };
    ManageExtensionAction = __decorate([
        __param(0, commands_1.ICommandService)
    ], ManageExtensionAction);
    class DraggedCompositeIdentifier {
        constructor(_compositeId) {
            this._compositeId = _compositeId;
        }
        get id() {
            return this._compositeId;
        }
    }
    exports.DraggedCompositeIdentifier = DraggedCompositeIdentifier;
    let CompositeActionViewItem = class CompositeActionViewItem extends ActivityActionViewItem {
        constructor(compositeActivityAction, toggleCompositePinnedAction, contextMenuActionsProvider, colors, icon, compositeBar, contextMenuService, keybindingService, instantiationService, themeService) {
            super(compositeActivityAction, { draggable: true, colors, icon }, themeService);
            this.compositeActivityAction = compositeActivityAction;
            this.toggleCompositePinnedAction = toggleCompositePinnedAction;
            this.contextMenuActionsProvider = contextMenuActionsProvider;
            this.compositeBar = compositeBar;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.compositeTransfer = dnd_2.LocalSelectionTransfer.getInstance();
            if (!CompositeActionViewItem.manageExtensionAction) {
                CompositeActionViewItem.manageExtensionAction = instantiationService.createInstance(ManageExtensionAction);
            }
            this._register(compositeActivityAction.onDidChangeActivity(() => { this.compositeActivity = undefined; this.updateActivity(); }, this));
        }
        get activity() {
            if (!this.compositeActivity) {
                let activityName;
                const keybinding = typeof this.compositeActivityAction.activity.keybindingId === 'string' ? this.getKeybindingLabel(this.compositeActivityAction.activity.keybindingId) : null;
                if (keybinding) {
                    activityName = nls.localize('titleKeybinding', "{0} ({1})", this.compositeActivityAction.activity.name, keybinding);
                }
                else {
                    activityName = this.compositeActivityAction.activity.name;
                }
                this.compositeActivity = {
                    id: this.compositeActivityAction.activity.id,
                    cssClass: this.compositeActivityAction.activity.cssClass,
                    name: activityName
                };
            }
            return this.compositeActivity;
        }
        getKeybindingLabel(id) {
            const kb = this.keybindingService.lookupKeybinding(id);
            if (kb) {
                return kb.getLabel();
            }
            return null;
        }
        render(container) {
            super.render(container);
            this.updateChecked();
            this.updateEnabled();
            this._register(dom.addDisposableListener(this.container, dom.EventType.CONTEXT_MENU, e => {
                dom.EventHelper.stop(e, true);
                this.showContextMenu(container);
            }));
            // Allow to drag
            this._register(dom.addDisposableListener(this.container, dom.EventType.DRAG_START, (e) => {
                e.dataTransfer.effectAllowed = 'move';
                // Registe as dragged to local transfer
                this.compositeTransfer.setData([new DraggedCompositeIdentifier(this.activity.id)], DraggedCompositeIdentifier.prototype);
                // Trigger the action even on drag start to prevent clicks from failing that started a drag
                if (!this.getAction().checked) {
                    this.getAction().run();
                }
            }));
            this._register(new dnd_2.DragAndDropObserver(this.container, {
                onDragEnter: e => {
                    if (this.compositeTransfer.hasData(DraggedCompositeIdentifier.prototype) && this.compositeTransfer.getData(DraggedCompositeIdentifier.prototype)[0].id !== this.activity.id) {
                        this.updateFromDragging(container, true);
                    }
                },
                onDragLeave: e => {
                    if (this.compositeTransfer.hasData(DraggedCompositeIdentifier.prototype)) {
                        this.updateFromDragging(container, false);
                    }
                },
                onDragEnd: e => {
                    if (this.compositeTransfer.hasData(DraggedCompositeIdentifier.prototype)) {
                        this.updateFromDragging(container, false);
                        this.compositeTransfer.clearData(DraggedCompositeIdentifier.prototype);
                    }
                },
                onDrop: e => {
                    dom.EventHelper.stop(e, true);
                    if (this.compositeTransfer.hasData(DraggedCompositeIdentifier.prototype)) {
                        const draggedCompositeId = this.compositeTransfer.getData(DraggedCompositeIdentifier.prototype)[0].id;
                        if (draggedCompositeId !== this.activity.id) {
                            this.updateFromDragging(container, false);
                            this.compositeTransfer.clearData(DraggedCompositeIdentifier.prototype);
                            this.compositeBar.move(draggedCompositeId, this.activity.id);
                        }
                    }
                }
            }));
            // Activate on drag over to reveal targets
            [this.badge, this.label].forEach(b => this._register(new dnd_1.DelayedDragHandler(b, () => {
                if (!this.compositeTransfer.hasData(DraggedCompositeIdentifier.prototype) && !this.getAction().checked) {
                    this.getAction().run();
                }
            })));
            this.updateStyles();
        }
        updateFromDragging(element, isDragging) {
            const theme = this.themeService.getTheme();
            const dragBackground = this.options.colors(theme).dragAndDropBackground;
            element.style.backgroundColor = isDragging && dragBackground ? dragBackground.toString() : null;
        }
        showContextMenu(container) {
            const actions = [this.toggleCompositePinnedAction];
            if (this.compositeActivityAction.activity.extensionId) {
                actions.push(new actionbar_1.Separator());
                actions.push(CompositeActionViewItem.manageExtensionAction);
            }
            const isPinned = this.compositeBar.isPinned(this.activity.id);
            if (isPinned) {
                this.toggleCompositePinnedAction.label = nls.localize('hide', "Hide");
                this.toggleCompositePinnedAction.checked = false;
            }
            else {
                this.toggleCompositePinnedAction.label = nls.localize('keep', "Keep");
            }
            const otherActions = this.contextMenuActionsProvider();
            if (otherActions.length) {
                actions.push(new actionbar_1.Separator());
                actions.push(...otherActions);
            }
            const elementPosition = dom.getDomNodePagePosition(container);
            const anchor = {
                x: Math.floor(elementPosition.left + (elementPosition.width / 2)),
                y: elementPosition.top + elementPosition.height
            };
            this.contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                getActionsContext: () => this.activity.id,
                getActions: () => actions
            });
        }
        focus() {
            this.container.focus();
        }
        updateChecked() {
            if (this.getAction().checked) {
                dom.addClass(this.container, 'checked');
                this.container.setAttribute('aria-label', nls.localize('compositeActive', "{0} active", this.container.title));
            }
            else {
                dom.removeClass(this.container, 'checked');
                this.container.setAttribute('aria-label', this.container.title);
            }
            this.updateStyles();
        }
        updateEnabled() {
            if (!this.element) {
                return;
            }
            if (this.getAction().enabled) {
                dom.removeClass(this.element, 'disabled');
            }
            else {
                dom.addClass(this.element, 'disabled');
            }
        }
        dispose() {
            super.dispose();
            this.compositeTransfer.clearData(DraggedCompositeIdentifier.prototype);
            this.label.remove();
        }
    };
    CompositeActionViewItem = __decorate([
        __param(6, contextView_1.IContextMenuService),
        __param(7, keybinding_1.IKeybindingService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, themeService_1.IThemeService)
    ], CompositeActionViewItem);
    exports.CompositeActionViewItem = CompositeActionViewItem;
    class ToggleCompositePinnedAction extends actions_1.Action {
        constructor(activity, compositeBar) {
            super('show.toggleCompositePinned', activity ? activity.name : nls.localize('toggle', "Toggle View Pinned"));
            this.activity = activity;
            this.compositeBar = compositeBar;
            this.checked = !!this.activity && this.compositeBar.isPinned(this.activity.id);
        }
        run(context) {
            const id = this.activity ? this.activity.id : context;
            if (this.compositeBar.isPinned(id)) {
                this.compositeBar.unpin(id);
            }
            else {
                this.compositeBar.pin(id);
            }
            return Promise.resolve(true);
        }
    }
    exports.ToggleCompositePinnedAction = ToggleCompositePinnedAction;
});
//# sourceMappingURL=compositeBarActions.js.map