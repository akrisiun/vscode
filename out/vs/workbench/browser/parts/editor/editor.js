/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/editor", "vs/base/browser/dom", "vs/base/common/objects", "vs/editor/browser/editorBrowser"], function (require, exports, editor_1, dom_1, objects_1, editorBrowser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EDITOR_TITLE_HEIGHT = 35;
    exports.DEFAULT_EDITOR_MIN_DIMENSIONS = new dom_1.Dimension(220, 70);
    exports.DEFAULT_EDITOR_MAX_DIMENSIONS = new dom_1.Dimension(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    exports.DEFAULT_EDITOR_PART_OPTIONS = {
        showTabs: true,
        highlightModifiedTabs: false,
        tabCloseButton: 'right',
        tabSizing: 'fit',
        focusRecentEditorAfterClose: true,
        showIcons: true,
        enablePreview: true,
        openPositioning: 'right',
        openSideBySideDirection: 'right',
        closeEmptyGroups: true,
        labelFormat: 'default',
        iconTheme: 'vs-seti'
    };
    function impactsEditorPartOptions(event) {
        return event.affectsConfiguration('workbench.editor') || event.affectsConfiguration('workbench.iconTheme');
    }
    exports.impactsEditorPartOptions = impactsEditorPartOptions;
    function getEditorPartOptions(config) {
        const options = objects_1.assign(Object.create(null), exports.DEFAULT_EDITOR_PART_OPTIONS);
        if (!config || !config.workbench) {
            return options;
        }
        if (typeof config.workbench.iconTheme === 'string') {
            options.iconTheme = config.workbench.iconTheme;
        }
        if (config.workbench.editor) {
            objects_1.assign(options, config.workbench.editor);
        }
        return options;
    }
    exports.getEditorPartOptions = getEditorPartOptions;
    function getActiveTextEditorOptions(group, expectedActiveEditor, presetOptions) {
        const activeGroupCodeEditor = group.activeControl ? editorBrowser_1.getCodeEditor(group.activeControl.getControl()) : undefined;
        if (activeGroupCodeEditor) {
            if (!expectedActiveEditor || expectedActiveEditor.matches(group.activeEditor)) {
                return editor_1.TextEditorOptions.fromEditor(activeGroupCodeEditor, presetOptions);
            }
        }
        return presetOptions || new editor_1.EditorOptions();
    }
    exports.getActiveTextEditorOptions = getActiveTextEditorOptions;
});
//# sourceMappingURL=editor.js.map