/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey"], function (require, exports, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = {
        MARKERS_PANEL_ID: 'workbench.panel.markers',
        MARKER_COPY_ACTION_ID: 'problems.action.copy',
        MARKER_COPY_MESSAGE_ACTION_ID: 'problems.action.copyMessage',
        RELATED_INFORMATION_COPY_MESSAGE_ACTION_ID: 'problems.action.copyRelatedInformationMessage',
        FOCUS_PROBLEMS_FROM_FILTER: 'problems.action.focusProblemsFromFilter',
        MARKERS_PANEL_FOCUS_FILTER: 'problems.action.focusFilter',
        MARKERS_PANEL_SHOW_MULTILINE_MESSAGE: 'problems.action.showMultilineMessage',
        MARKERS_PANEL_SHOW_SINGLELINE_MESSAGE: 'problems.action.showSinglelineMessage',
        MARKER_OPEN_SIDE_ACTION_ID: 'problems.action.openToSide',
        MARKER_SHOW_PANEL_ID: 'workbench.action.showErrorsWarnings',
        MARKER_SHOW_QUICK_FIX: 'problems.action.showQuickFixes',
        MarkerPanelFocusContextKey: new contextkey_1.RawContextKey('problemsViewFocus', false),
        MarkerFocusContextKey: new contextkey_1.RawContextKey('problemFocus', false),
        MarkerPanelFilterFocusContextKey: new contextkey_1.RawContextKey('problemsFilterFocus', false),
        RelatedInformationFocusContextKey: new contextkey_1.RawContextKey('relatedInformationFocus', false)
    };
});
//# sourceMappingURL=constants.js.map