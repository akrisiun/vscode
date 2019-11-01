/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/base/browser/ui/iconLabel/iconLabel", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/base/browser/dom", "vs/base/browser/ui/keybindingLabel/keybindingLabel", "vs/base/common/platform", "vs/base/common/arrays"], function (require, exports, nls, types, iconLabel_1, actionbar_1, highlightedLabel_1, DOM, keybindingLabel_1, platform_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let IDS = 0;
    class QuickOpenItemAccessorClass {
        getItemLabel(entry) {
            return types.withUndefinedAsNull(entry.getLabel());
        }
        getItemDescription(entry) {
            return types.withUndefinedAsNull(entry.getDescription());
        }
        getItemPath(entry) {
            const resource = entry.getResource();
            return resource ? resource.fsPath : undefined;
        }
    }
    exports.QuickOpenItemAccessorClass = QuickOpenItemAccessorClass;
    exports.QuickOpenItemAccessor = new QuickOpenItemAccessorClass();
    class QuickOpenEntry {
        constructor(highlights = []) {
            this.id = (IDS++).toString();
            this.labelHighlights = highlights;
            this.descriptionHighlights = [];
        }
        /**
         * A unique identifier for the entry
         */
        getId() {
            return this.id;
        }
        /**
         * The label of the entry to identify it from others in the list
         */
        getLabel() {
            return undefined;
        }
        /**
         * The options for the label to use for this entry
         */
        getLabelOptions() {
            return undefined;
        }
        /**
         * The label of the entry to use when a screen reader wants to read about the entry
         */
        getAriaLabel() {
            return arrays_1.coalesce([this.getLabel(), this.getDescription(), this.getDetail()])
                .join(', ');
        }
        /**
         * Detail information about the entry that is optional and can be shown below the label
         */
        getDetail() {
            return undefined;
        }
        /**
         * The icon of the entry to identify it from others in the list
         */
        getIcon() {
            return undefined;
        }
        /**
         * A secondary description that is optional and can be shown right to the label
         */
        getDescription() {
            return undefined;
        }
        /**
         * A tooltip to show when hovering over the entry.
         */
        getTooltip() {
            return undefined;
        }
        /**
         * A tooltip to show when hovering over the description portion of the entry.
         */
        getDescriptionTooltip() {
            return undefined;
        }
        /**
         * An optional keybinding to show for an entry.
         */
        getKeybinding() {
            return undefined;
        }
        /**
         * A resource for this entry. Resource URIs can be used to compare different kinds of entries and group
         * them together.
         */
        getResource() {
            return undefined;
        }
        /**
         * Allows to reuse the same model while filtering. Hidden entries will not show up in the viewer.
         */
        isHidden() {
            return !!this.hidden;
        }
        /**
         * Allows to reuse the same model while filtering. Hidden entries will not show up in the viewer.
         */
        setHidden(hidden) {
            this.hidden = hidden;
        }
        /**
         * Allows to set highlight ranges that should show up for the entry label and optionally description if set.
         */
        setHighlights(labelHighlights, descriptionHighlights, detailHighlights) {
            this.labelHighlights = labelHighlights;
            this.descriptionHighlights = descriptionHighlights;
            this.detailHighlights = detailHighlights;
        }
        /**
         * Allows to return highlight ranges that should show up for the entry label and description.
         */
        getHighlights() {
            return [this.labelHighlights, this.descriptionHighlights, this.detailHighlights];
        }
        /**
         * Called when the entry is selected for opening. Returns a boolean value indicating if an action was performed or not.
         * The mode parameter gives an indication if the element is previewed (using arrow keys) or opened.
         *
         * The context parameter provides additional context information how the run was triggered.
         */
        run(mode, context) {
            return false;
        }
        /**
         * Determines if this quick open entry should merge with the editor history in quick open. If set to true
         * and the resource of this entry is the same as the resource for an editor history, it will not show up
         * because it is considered to be a duplicate of an editor history.
         */
        mergeWithEditorHistory() {
            return false;
        }
    }
    exports.QuickOpenEntry = QuickOpenEntry;
    class QuickOpenEntryGroup extends QuickOpenEntry {
        constructor(entry, groupLabel, withBorder) {
            super();
            this.entry = entry;
            this.groupLabel = groupLabel;
            this.withBorder = withBorder;
        }
        /**
         * The label of the group or null if none.
         */
        getGroupLabel() {
            return this.groupLabel;
        }
        setGroupLabel(groupLabel) {
            this.groupLabel = groupLabel;
        }
        /**
         * Whether to show a border on top of the group entry or not.
         */
        showBorder() {
            return !!this.withBorder;
        }
        setShowBorder(showBorder) {
            this.withBorder = showBorder;
        }
        getLabel() {
            return this.entry ? this.entry.getLabel() : super.getLabel();
        }
        getLabelOptions() {
            return this.entry ? this.entry.getLabelOptions() : super.getLabelOptions();
        }
        getAriaLabel() {
            return this.entry ? this.entry.getAriaLabel() : super.getAriaLabel();
        }
        getDetail() {
            return this.entry ? this.entry.getDetail() : super.getDetail();
        }
        getResource() {
            return this.entry ? this.entry.getResource() : super.getResource();
        }
        getIcon() {
            return this.entry ? this.entry.getIcon() : super.getIcon();
        }
        getDescription() {
            return this.entry ? this.entry.getDescription() : super.getDescription();
        }
        getEntry() {
            return this.entry;
        }
        getHighlights() {
            return this.entry ? this.entry.getHighlights() : super.getHighlights();
        }
        isHidden() {
            return this.entry ? this.entry.isHidden() : super.isHidden();
        }
        setHighlights(labelHighlights, descriptionHighlights, detailHighlights) {
            this.entry ? this.entry.setHighlights(labelHighlights, descriptionHighlights, detailHighlights) : super.setHighlights(labelHighlights, descriptionHighlights, detailHighlights);
        }
        setHidden(hidden) {
            this.entry ? this.entry.setHidden(hidden) : super.setHidden(hidden);
        }
        run(mode, context) {
            return this.entry ? this.entry.run(mode, context) : super.run(mode, context);
        }
    }
    exports.QuickOpenEntryGroup = QuickOpenEntryGroup;
    class NoActionProvider {
        hasActions(tree, element) {
            return false;
        }
        getActions(tree, element) {
            return null;
        }
    }
    const templateEntry = 'quickOpenEntry';
    const templateEntryGroup = 'quickOpenEntryGroup';
    class Renderer {
        constructor(actionProvider = new NoActionProvider(), actionRunner) {
            this.actionProvider = actionProvider;
            this.actionRunner = actionRunner;
        }
        getHeight(entry) {
            if (entry.getDetail()) {
                return 44;
            }
            return 22;
        }
        getTemplateId(entry) {
            if (entry instanceof QuickOpenEntryGroup) {
                return templateEntryGroup;
            }
            return templateEntry;
        }
        renderTemplate(templateId, container, styles) {
            const entryContainer = document.createElement('div');
            DOM.addClass(entryContainer, 'sub-content');
            container.appendChild(entryContainer);
            // Entry
            const row1 = DOM.$('.quick-open-row');
            const row2 = DOM.$('.quick-open-row');
            const entry = DOM.$('.quick-open-entry', undefined, row1, row2);
            entryContainer.appendChild(entry);
            // Icon
            const icon = document.createElement('span');
            row1.appendChild(icon);
            // Label
            const label = new iconLabel_1.IconLabel(row1, { supportHighlights: true, supportDescriptionHighlights: true, supportOcticons: true });
            // Keybinding
            const keybindingContainer = document.createElement('span');
            row1.appendChild(keybindingContainer);
            DOM.addClass(keybindingContainer, 'quick-open-entry-keybinding');
            const keybinding = new keybindingLabel_1.KeybindingLabel(keybindingContainer, platform_1.OS);
            // Detail
            const detailContainer = document.createElement('div');
            row2.appendChild(detailContainer);
            DOM.addClass(detailContainer, 'quick-open-entry-meta');
            const detail = new highlightedLabel_1.HighlightedLabel(detailContainer, true);
            // Entry Group
            let group;
            if (templateId === templateEntryGroup) {
                group = document.createElement('div');
                DOM.addClass(group, 'results-group');
                container.appendChild(group);
            }
            // Actions
            DOM.addClass(container, 'actions');
            const actionBarContainer = document.createElement('div');
            DOM.addClass(actionBarContainer, 'primary-action-bar');
            container.appendChild(actionBarContainer);
            const actionBar = new actionbar_1.ActionBar(actionBarContainer, {
                actionRunner: this.actionRunner
            });
            return {
                container,
                entry,
                icon,
                label,
                detail,
                keybinding,
                group,
                actionBar
            };
        }
        renderElement(entry, templateId, data, styles) {
            // Action Bar
            if (this.actionProvider.hasActions(null, entry)) {
                DOM.addClass(data.container, 'has-actions');
            }
            else {
                DOM.removeClass(data.container, 'has-actions');
            }
            data.actionBar.context = entry; // make sure the context is the current element
            const actions = this.actionProvider.getActions(null, entry);
            if (data.actionBar.isEmpty() && actions && actions.length > 0) {
                data.actionBar.push(actions, { icon: true, label: false });
            }
            else if (!data.actionBar.isEmpty() && (!actions || actions.length === 0)) {
                data.actionBar.clear();
            }
            // Entry group class
            if (entry instanceof QuickOpenEntryGroup && entry.getGroupLabel()) {
                DOM.addClass(data.container, 'has-group-label');
            }
            else {
                DOM.removeClass(data.container, 'has-group-label');
            }
            // Entry group
            if (entry instanceof QuickOpenEntryGroup) {
                const group = entry;
                const groupData = data;
                // Border
                if (group.showBorder()) {
                    DOM.addClass(groupData.container, 'results-group-separator');
                    if (styles.pickerGroupBorder) {
                        groupData.container.style.borderTopColor = styles.pickerGroupBorder.toString();
                    }
                }
                else {
                    DOM.removeClass(groupData.container, 'results-group-separator');
                    groupData.container.style.borderTopColor = null;
                }
                // Group Label
                const groupLabel = group.getGroupLabel() || '';
                if (groupData.group) {
                    groupData.group.textContent = groupLabel;
                    if (styles.pickerGroupForeground) {
                        groupData.group.style.color = styles.pickerGroupForeground.toString();
                    }
                }
            }
            // Normal Entry
            if (entry instanceof QuickOpenEntry) {
                const [labelHighlights, descriptionHighlights, detailHighlights] = entry.getHighlights();
                // Icon
                const iconClass = entry.getIcon() ? ('quick-open-entry-icon ' + entry.getIcon()) : '';
                data.icon.className = iconClass;
                // Label
                const options = entry.getLabelOptions() || Object.create(null);
                options.matches = labelHighlights || [];
                options.title = entry.getTooltip();
                options.descriptionTitle = entry.getDescriptionTooltip() || entry.getDescription(); // tooltip over description because it could overflow
                options.descriptionMatches = descriptionHighlights || [];
                data.label.setLabel(types.withNullAsUndefined(entry.getLabel()), entry.getDescription(), options);
                // Meta
                data.detail.set(entry.getDetail(), detailHighlights);
                // Keybinding
                data.keybinding.set(entry.getKeybinding());
            }
        }
        disposeTemplate(templateId, templateData) {
            templateData.actionBar.dispose();
            templateData.actionBar = null;
            templateData.container = null;
            templateData.entry = null;
            templateData.keybinding = null;
            templateData.detail = null;
            templateData.group = null;
            templateData.icon = null;
            templateData.label.dispose();
            templateData.label = null;
        }
    }
    class QuickOpenModel {
        constructor(entries = [], actionProvider = new NoActionProvider()) {
            this._entries = entries;
            this._dataSource = this;
            this._renderer = new Renderer(actionProvider);
            this._filter = this;
            this._runner = this;
            this._accessibilityProvider = this;
        }
        get entries() { return this._entries; }
        get dataSource() { return this._dataSource; }
        get renderer() { return this._renderer; }
        get filter() { return this._filter; }
        get runner() { return this._runner; }
        get accessibilityProvider() { return this._accessibilityProvider; }
        set entries(entries) {
            this._entries = entries;
        }
        /**
         * Adds entries that should show up in the quick open viewer.
         */
        addEntries(entries) {
            if (types.isArray(entries)) {
                this._entries = this._entries.concat(entries);
            }
        }
        /**
         * Set the entries that should show up in the quick open viewer.
         */
        setEntries(entries) {
            if (types.isArray(entries)) {
                this._entries = entries;
            }
        }
        /**
         * Get the entries that should show up in the quick open viewer.
         *
         * @visibleOnly optional parameter to only return visible entries
         */
        getEntries(visibleOnly) {
            if (visibleOnly) {
                return this._entries.filter((e) => !e.isHidden());
            }
            return this._entries;
        }
        getId(entry) {
            return entry.getId();
        }
        getLabel(entry) {
            return types.withUndefinedAsNull(entry.getLabel());
        }
        getAriaLabel(entry) {
            const ariaLabel = entry.getAriaLabel();
            if (ariaLabel) {
                return nls.localize('quickOpenAriaLabelEntry', "{0}, picker", entry.getAriaLabel());
            }
            return nls.localize('quickOpenAriaLabel', "picker");
        }
        isVisible(entry) {
            return !entry.isHidden();
        }
        run(entry, mode, context) {
            return entry.run(mode, context);
        }
    }
    exports.QuickOpenModel = QuickOpenModel;
});
//# sourceMappingURL=quickOpenModel.js.map