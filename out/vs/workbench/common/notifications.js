/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/notification/common/notification", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/errors", "vs/base/common/actions", "vs/base/common/errorsWithActions", "vs/base/common/strings", "vs/nls", "vs/base/common/arrays"], function (require, exports, notification_1, errorMessage_1, event_1, lifecycle_1, errors_1, actions_1, errorsWithActions_1, strings_1, nls_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var NotificationChangeType;
    (function (NotificationChangeType) {
        NotificationChangeType[NotificationChangeType["ADD"] = 0] = "ADD";
        NotificationChangeType[NotificationChangeType["CHANGE"] = 1] = "CHANGE";
        NotificationChangeType[NotificationChangeType["REMOVE"] = 2] = "REMOVE";
    })(NotificationChangeType = exports.NotificationChangeType || (exports.NotificationChangeType = {}));
    var StatusMessageChangeType;
    (function (StatusMessageChangeType) {
        StatusMessageChangeType[StatusMessageChangeType["ADD"] = 0] = "ADD";
        StatusMessageChangeType[StatusMessageChangeType["REMOVE"] = 1] = "REMOVE";
    })(StatusMessageChangeType = exports.StatusMessageChangeType || (exports.StatusMessageChangeType = {}));
    class NotificationHandle {
        constructor(item, closeItem) {
            this.item = item;
            this.closeItem = closeItem;
            this._onDidClose = new event_1.Emitter();
            this.onDidClose = this._onDidClose.event;
            this.registerListeners();
        }
        registerListeners() {
            event_1.Event.once(this.item.onDidClose)(() => {
                this._onDidClose.fire();
                this._onDidClose.dispose();
            });
        }
        get progress() {
            return this.item.progress;
        }
        updateSeverity(severity) {
            this.item.updateSeverity(severity);
        }
        updateMessage(message) {
            this.item.updateMessage(message);
        }
        updateActions(actions) {
            this.item.updateActions(actions);
        }
        close() {
            this.closeItem(this.item);
            this._onDidClose.dispose();
        }
    }
    exports.NotificationHandle = NotificationHandle;
    class NotificationsModel extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidNotificationChange = this._register(new event_1.Emitter());
            this.onDidNotificationChange = this._onDidNotificationChange.event;
            this._onDidStatusMessageChange = this._register(new event_1.Emitter());
            this.onDidStatusMessageChange = this._onDidStatusMessageChange.event;
            this._onDidFilterChange = this._register(new event_1.Emitter());
            this.onDidFilterChange = this._onDidFilterChange.event;
            this._notifications = [];
            this.filter = notification_1.NotificationsFilter.OFF;
        }
        get notifications() { return this._notifications; }
        get statusMessage() { return this._statusMessage; }
        setFilter(filter) {
            this.filter = filter;
            this._onDidFilterChange.fire(filter);
        }
        addNotification(notification) {
            const item = this.createViewItem(notification);
            if (!item) {
                return NotificationsModel.NO_OP_NOTIFICATION; // return early if this is a no-op
            }
            // Deduplicate
            const duplicate = this.findNotification(item);
            if (duplicate) {
                duplicate.close();
            }
            // Add to list as first entry
            this._notifications.splice(0, 0, item);
            // Events
            this._onDidNotificationChange.fire({ item, index: 0, kind: 0 /* ADD */ });
            // Wrap into handle
            return new NotificationHandle(item, item => this.closeItem(item));
        }
        closeItem(item) {
            const liveItem = this.findNotification(item);
            if (liveItem && liveItem !== item) {
                liveItem.close(); // item could have been replaced with another one, make sure to close the live item
            }
            else {
                item.close(); // otherwise just close the item that was passed in
            }
        }
        findNotification(item) {
            return arrays_1.find(this._notifications, notification => notification.equals(item));
        }
        createViewItem(notification) {
            const item = NotificationViewItem.create(notification, this.filter);
            if (!item) {
                return undefined;
            }
            // Item Events
            const onItemChangeEvent = () => {
                const index = this._notifications.indexOf(item);
                if (index >= 0) {
                    this._onDidNotificationChange.fire({ item, index, kind: 1 /* CHANGE */ });
                }
            };
            const itemExpansionChangeListener = item.onDidExpansionChange(() => onItemChangeEvent());
            const itemLabelChangeListener = item.onDidLabelChange(e => {
                // a label change in the area of actions or the message is a change that potentially has an impact
                // on the size of the notification and as such we emit a change event so that viewers can redraw
                if (e.kind === 2 /* ACTIONS */ || e.kind === 1 /* MESSAGE */) {
                    onItemChangeEvent();
                }
            });
            event_1.Event.once(item.onDidClose)(() => {
                itemExpansionChangeListener.dispose();
                itemLabelChangeListener.dispose();
                const index = this._notifications.indexOf(item);
                if (index >= 0) {
                    this._notifications.splice(index, 1);
                    this._onDidNotificationChange.fire({ item, index, kind: 2 /* REMOVE */ });
                }
            });
            return item;
        }
        showStatusMessage(message, options) {
            const item = StatusMessageViewItem.create(message, options);
            if (!item) {
                return lifecycle_1.Disposable.None;
            }
            // Remember as current status message and fire events
            this._statusMessage = item;
            this._onDidStatusMessageChange.fire({ kind: 0 /* ADD */, item });
            return lifecycle_1.toDisposable(() => {
                // Only reset status message if the item is still the one we had remembered
                if (this._statusMessage === item) {
                    this._statusMessage = undefined;
                    this._onDidStatusMessageChange.fire({ kind: 1 /* REMOVE */, item });
                }
            });
        }
    }
    exports.NotificationsModel = NotificationsModel;
    NotificationsModel.NO_OP_NOTIFICATION = new notification_1.NoOpNotification();
    function isNotificationViewItem(obj) {
        return obj instanceof NotificationViewItem;
    }
    exports.isNotificationViewItem = isNotificationViewItem;
    var NotificationViewItemLabelKind;
    (function (NotificationViewItemLabelKind) {
        NotificationViewItemLabelKind[NotificationViewItemLabelKind["SEVERITY"] = 0] = "SEVERITY";
        NotificationViewItemLabelKind[NotificationViewItemLabelKind["MESSAGE"] = 1] = "MESSAGE";
        NotificationViewItemLabelKind[NotificationViewItemLabelKind["ACTIONS"] = 2] = "ACTIONS";
        NotificationViewItemLabelKind[NotificationViewItemLabelKind["PROGRESS"] = 3] = "PROGRESS";
    })(NotificationViewItemLabelKind = exports.NotificationViewItemLabelKind || (exports.NotificationViewItemLabelKind = {}));
    class NotificationViewItemProgress extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._state = Object.create(null);
        }
        get state() {
            return this._state;
        }
        infinite() {
            if (this._state.infinite) {
                return;
            }
            this._state.infinite = true;
            this._state.total = undefined;
            this._state.worked = undefined;
            this._state.done = undefined;
            this._onDidChange.fire();
        }
        done() {
            if (this._state.done) {
                return;
            }
            this._state.done = true;
            this._state.infinite = undefined;
            this._state.total = undefined;
            this._state.worked = undefined;
            this._onDidChange.fire();
        }
        total(value) {
            if (this._state.total === value) {
                return;
            }
            this._state.total = value;
            this._state.infinite = undefined;
            this._state.done = undefined;
            this._onDidChange.fire();
        }
        worked(value) {
            if (typeof this._state.worked === 'number') {
                this._state.worked += value;
            }
            else {
                this._state.worked = value;
            }
            this._state.infinite = undefined;
            this._state.done = undefined;
            this._onDidChange.fire();
        }
    }
    exports.NotificationViewItemProgress = NotificationViewItemProgress;
    class NotificationViewItem extends lifecycle_1.Disposable {
        constructor(_severity, _sticky, _silent, _message, _source, actions) {
            super();
            this._severity = _severity;
            this._sticky = _sticky;
            this._silent = _silent;
            this._message = _message;
            this._source = _source;
            this._onDidExpansionChange = this._register(new event_1.Emitter());
            this.onDidExpansionChange = this._onDidExpansionChange.event;
            this._onDidClose = this._register(new event_1.Emitter());
            this.onDidClose = this._onDidClose.event;
            this._onDidLabelChange = this._register(new event_1.Emitter());
            this.onDidLabelChange = this._onDidLabelChange.event;
            this.setActions(actions);
        }
        static create(notification, filter = notification_1.NotificationsFilter.OFF) {
            if (!notification || !notification.message || errors_1.isPromiseCanceledError(notification.message)) {
                return undefined; // we need a message to show
            }
            let severity;
            if (typeof notification.severity === 'number') {
                severity = notification.severity;
            }
            else {
                severity = notification_1.Severity.Info;
            }
            const message = NotificationViewItem.parseNotificationMessage(notification.message);
            if (!message) {
                return undefined; // we need a message to show
            }
            let actions;
            if (notification.actions) {
                actions = notification.actions;
            }
            else if (errorsWithActions_1.isErrorWithActions(notification.message)) {
                actions = { primary: notification.message.actions };
            }
            return new NotificationViewItem(severity, notification.sticky, notification.silent || filter === notification_1.NotificationsFilter.SILENT || (filter === notification_1.NotificationsFilter.ERROR && notification.severity !== notification_1.Severity.Error), message, notification.source, actions);
        }
        static parseNotificationMessage(input) {
            let message;
            if (input instanceof Error) {
                message = errorMessage_1.toErrorMessage(input, false);
            }
            else if (typeof input === 'string') {
                message = input;
            }
            if (!message) {
                return undefined; // we need a message to show
            }
            const raw = message;
            // Make sure message is in the limits
            if (message.length > NotificationViewItem.MAX_MESSAGE_LENGTH) {
                message = `${message.substr(0, NotificationViewItem.MAX_MESSAGE_LENGTH)}...`;
            }
            // Remove newlines from messages as we do not support that and it makes link parsing hard
            message = message.replace(/(\r\n|\n|\r)/gm, ' ').trim();
            // Parse Links
            const links = [];
            message.replace(NotificationViewItem.LINK_REGEX, (matchString, name, href, title, offset) => {
                let massagedTitle;
                if (title && title.length > 0) {
                    massagedTitle = title;
                }
                else if (strings_1.startsWith(href, 'command:')) {
                    massagedTitle = nls_1.localize('executeCommand', "Click to execute command '{0}'", href.substr('command:'.length));
                }
                else {
                    massagedTitle = href;
                }
                links.push({ name, href, title: massagedTitle, offset, length: matchString.length });
                return matchString;
            });
            return { raw, value: message, links, original: input };
        }
        setActions(actions = { primary: [], secondary: [] }) {
            if (!Array.isArray(actions.primary)) {
                actions.primary = [];
            }
            if (!Array.isArray(actions.secondary)) {
                actions.secondary = [];
            }
            this._actions = actions;
            this._expanded = actions.primary.length > 0;
        }
        get canCollapse() {
            return !this.hasPrompt();
        }
        get expanded() {
            return !!this._expanded;
        }
        get severity() {
            return this._severity;
        }
        get sticky() {
            if (this._sticky) {
                return true; // explicitly sticky
            }
            const hasPrompt = this.hasPrompt();
            if ((hasPrompt && this._severity === notification_1.Severity.Error) || // notification errors with actions are sticky
                (!hasPrompt && this._expanded) || // notifications that got expanded are sticky
                (this._progress && !this._progress.state.done) // notifications with running progress are sticky
            ) {
                return true;
            }
            return false; // not sticky
        }
        get silent() {
            return !!this._silent;
        }
        hasPrompt() {
            if (!this._actions) {
                return false;
            }
            if (!this._actions.primary) {
                return false;
            }
            return this._actions.primary.length > 0;
        }
        hasProgress() {
            return !!this._progress;
        }
        get progress() {
            if (!this._progress) {
                this._progress = this._register(new NotificationViewItemProgress());
                this._register(this._progress.onDidChange(() => this._onDidLabelChange.fire({ kind: 3 /* PROGRESS */ })));
            }
            return this._progress;
        }
        get message() {
            return this._message;
        }
        get source() {
            return this._source;
        }
        get actions() {
            return this._actions;
        }
        updateSeverity(severity) {
            this._severity = severity;
            this._onDidLabelChange.fire({ kind: 0 /* SEVERITY */ });
        }
        updateMessage(input) {
            const message = NotificationViewItem.parseNotificationMessage(input);
            if (!message) {
                return;
            }
            this._message = message;
            this._onDidLabelChange.fire({ kind: 1 /* MESSAGE */ });
        }
        updateActions(actions) {
            this.setActions(actions);
            this._onDidLabelChange.fire({ kind: 2 /* ACTIONS */ });
        }
        expand() {
            if (this._expanded || !this.canCollapse) {
                return;
            }
            this._expanded = true;
            this._onDidExpansionChange.fire();
        }
        collapse(skipEvents) {
            if (!this._expanded || !this.canCollapse) {
                return;
            }
            this._expanded = false;
            if (!skipEvents) {
                this._onDidExpansionChange.fire();
            }
        }
        toggle() {
            if (this._expanded) {
                this.collapse();
            }
            else {
                this.expand();
            }
        }
        close() {
            this._onDidClose.fire();
            this.dispose();
        }
        equals(other) {
            if (this.hasProgress() || other.hasProgress()) {
                return false;
            }
            if (this._source !== other.source) {
                return false;
            }
            if (this._message.value !== other.message.value) {
                return false;
            }
            const primaryActions = (this._actions && this._actions.primary) || [];
            const otherPrimaryActions = (other.actions && other.actions.primary) || [];
            return arrays_1.equals(primaryActions, otherPrimaryActions, (a, b) => (a.id + a.label) === (b.id + b.label));
        }
    }
    exports.NotificationViewItem = NotificationViewItem;
    NotificationViewItem.MAX_MESSAGE_LENGTH = 1000;
    // Example link: "Some message with [link text](http://link.href)."
    // RegEx: [, anything not ], ], (, http://|https://|command:, no whitespace)
    NotificationViewItem.LINK_REGEX = /\[([^\]]+)\]\(((?:https?:\/\/|command:)[^\)\s]+)(?: "([^"]+)")?\)/gi;
    class ChoiceAction extends actions_1.Action {
        constructor(id, choice) {
            super(id, choice.label, undefined, true, () => {
                // Pass to runner
                choice.run();
                // Emit Event
                this._onDidRun.fire();
                return Promise.resolve();
            });
            this._onDidRun = new event_1.Emitter();
            this.onDidRun = this._onDidRun.event;
            this._keepOpen = !!choice.keepOpen;
        }
        get keepOpen() {
            return this._keepOpen;
        }
        dispose() {
            super.dispose();
            this._onDidRun.dispose();
        }
    }
    exports.ChoiceAction = ChoiceAction;
    class StatusMessageViewItem {
        static create(notification, options) {
            if (!notification || errors_1.isPromiseCanceledError(notification)) {
                return undefined; // we need a message to show
            }
            let message;
            if (notification instanceof Error) {
                message = errorMessage_1.toErrorMessage(notification, false);
            }
            else if (typeof notification === 'string') {
                message = notification;
            }
            if (!message) {
                return undefined; // we need a message to show
            }
            return { message, options };
        }
    }
});
//# sourceMappingURL=notifications.js.map