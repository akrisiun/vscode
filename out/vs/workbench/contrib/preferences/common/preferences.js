/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey"], function (require, exports, instantiation_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IPreferencesSearchService = instantiation_1.createDecorator('preferencesSearchService');
    exports.CONTEXT_SETTINGS_EDITOR = new contextkey_1.RawContextKey('inSettingsEditor', false);
    exports.CONTEXT_SETTINGS_JSON_EDITOR = new contextkey_1.RawContextKey('inSettingsJSONEditor', false);
    exports.CONTEXT_SETTINGS_SEARCH_FOCUS = new contextkey_1.RawContextKey('inSettingsSearch', false);
    exports.CONTEXT_TOC_ROW_FOCUS = new contextkey_1.RawContextKey('settingsTocRowFocus', false);
    exports.CONTEXT_KEYBINDINGS_EDITOR = new contextkey_1.RawContextKey('inKeybindings', false);
    exports.CONTEXT_KEYBINDINGS_SEARCH_FOCUS = new contextkey_1.RawContextKey('inKeybindingsSearch', false);
    exports.CONTEXT_KEYBINDING_FOCUS = new contextkey_1.RawContextKey('keybindingFocus', false);
    exports.SETTINGS_EDITOR_COMMAND_SEARCH = 'settings.action.search';
    exports.SETTINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS = 'settings.action.clearSearchResults';
    exports.SETTINGS_EDITOR_COMMAND_FOCUS_NEXT_SETTING = 'settings.action.focusNextSetting';
    exports.SETTINGS_EDITOR_COMMAND_FOCUS_PREVIOUS_SETTING = 'settings.action.focusPreviousSetting';
    exports.SETTINGS_EDITOR_COMMAND_FOCUS_FILE = 'settings.action.focusSettingsFile';
    exports.SETTINGS_EDITOR_COMMAND_EDIT_FOCUSED_SETTING = 'settings.action.editFocusedSetting';
    exports.SETTINGS_EDITOR_COMMAND_FOCUS_SETTINGS_FROM_SEARCH = 'settings.action.focusSettingsFromSearch';
    exports.SETTINGS_EDITOR_COMMAND_FOCUS_SETTINGS_LIST = 'settings.action.focusSettingsList';
    exports.SETTINGS_EDITOR_COMMAND_SHOW_CONTEXT_MENU = 'settings.action.showContextMenu';
    exports.SETTINGS_EDITOR_COMMAND_SWITCH_TO_JSON = 'settings.switchToJSON';
    exports.SETTINGS_EDITOR_COMMAND_FILTER_MODIFIED = 'settings.filterByModified';
    exports.SETTINGS_EDITOR_COMMAND_FILTER_ONLINE = 'settings.filterByOnline';
    exports.KEYBINDINGS_EDITOR_COMMAND_SEARCH = 'keybindings.editor.searchKeybindings';
    exports.KEYBINDINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS = 'keybindings.editor.clearSearchResults';
    exports.KEYBINDINGS_EDITOR_COMMAND_RECORD_SEARCH_KEYS = 'keybindings.editor.recordSearchKeys';
    exports.KEYBINDINGS_EDITOR_COMMAND_SORTBY_PRECEDENCE = 'keybindings.editor.toggleSortByPrecedence';
    exports.KEYBINDINGS_EDITOR_COMMAND_DEFINE = 'keybindings.editor.defineKeybinding';
    exports.KEYBINDINGS_EDITOR_COMMAND_DEFINE_WHEN = 'keybindings.editor.defineWhenExpression';
    exports.KEYBINDINGS_EDITOR_COMMAND_REMOVE = 'keybindings.editor.removeKeybinding';
    exports.KEYBINDINGS_EDITOR_COMMAND_RESET = 'keybindings.editor.resetKeybinding';
    exports.KEYBINDINGS_EDITOR_COMMAND_COPY = 'keybindings.editor.copyKeybindingEntry';
    exports.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND = 'keybindings.editor.copyCommandKeybindingEntry';
    exports.KEYBINDINGS_EDITOR_COMMAND_SHOW_SIMILAR = 'keybindings.editor.showConflicts';
    exports.KEYBINDINGS_EDITOR_COMMAND_FOCUS_KEYBINDINGS = 'keybindings.editor.focusKeybindings';
    exports.KEYBINDINGS_EDITOR_CLEAR_INPUT = 'keybindings.editor.showDefaultKeybindings';
    exports.KEYBINDINGS_EDITOR_SHOW_DEFAULT_KEYBINDINGS = 'keybindings.editor.showDefaultKeybindings';
    exports.KEYBINDINGS_EDITOR_SHOW_USER_KEYBINDINGS = 'keybindings.editor.showUserKeybindings';
    exports.DEFAULT_SETTINGS_EDITOR_SETTING = 'workbench.settings.openDefaultSettings';
    exports.MODIFIED_SETTING_TAG = 'modified';
    exports.EXTENSION_SETTING_TAG = 'ext:';
    exports.SETTINGS_COMMAND_OPEN_SETTINGS = 'workbench.action.openSettings';
    exports.KEYBOARD_LAYOUT_OPEN_PICKER = 'workbench.action.openKeyboardLayoutPicker';
});
//# sourceMappingURL=preferences.js.map