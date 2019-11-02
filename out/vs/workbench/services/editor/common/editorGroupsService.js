/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IEditorGroupsService = instantiation_1.createDecorator('editorGroupsService');
    var GroupDirection;
    (function (GroupDirection) {
        GroupDirection[GroupDirection["UP"] = 0] = "UP";
        GroupDirection[GroupDirection["DOWN"] = 1] = "DOWN";
        GroupDirection[GroupDirection["LEFT"] = 2] = "LEFT";
        GroupDirection[GroupDirection["RIGHT"] = 3] = "RIGHT";
    })(GroupDirection = exports.GroupDirection || (exports.GroupDirection = {}));
    function preferredSideBySideGroupDirection(configurationService) {
        const openSideBySideDirection = configurationService.getValue('workbench.editor.openSideBySideDirection');
        if (openSideBySideDirection === 'down') {
            return 1 /* DOWN */;
        }
        return 3 /* RIGHT */;
    }
    exports.preferredSideBySideGroupDirection = preferredSideBySideGroupDirection;
    var GroupOrientation;
    (function (GroupOrientation) {
        GroupOrientation[GroupOrientation["HORIZONTAL"] = 0] = "HORIZONTAL";
        GroupOrientation[GroupOrientation["VERTICAL"] = 1] = "VERTICAL";
    })(GroupOrientation = exports.GroupOrientation || (exports.GroupOrientation = {}));
    var GroupLocation;
    (function (GroupLocation) {
        GroupLocation[GroupLocation["FIRST"] = 0] = "FIRST";
        GroupLocation[GroupLocation["LAST"] = 1] = "LAST";
        GroupLocation[GroupLocation["NEXT"] = 2] = "NEXT";
        GroupLocation[GroupLocation["PREVIOUS"] = 3] = "PREVIOUS";
    })(GroupLocation = exports.GroupLocation || (exports.GroupLocation = {}));
    var GroupsArrangement;
    (function (GroupsArrangement) {
        /**
         * Make the current active group consume the maximum
         * amount of space possible.
         */
        GroupsArrangement[GroupsArrangement["MINIMIZE_OTHERS"] = 0] = "MINIMIZE_OTHERS";
        /**
         * Size all groups evenly.
         */
        GroupsArrangement[GroupsArrangement["EVEN"] = 1] = "EVEN";
        /**
         * Will behave like MINIMIZE_OTHERS if the active
         * group is not already maximized and EVEN otherwise
         */
        GroupsArrangement[GroupsArrangement["TOGGLE"] = 2] = "TOGGLE";
    })(GroupsArrangement = exports.GroupsArrangement || (exports.GroupsArrangement = {}));
    var MergeGroupMode;
    (function (MergeGroupMode) {
        MergeGroupMode[MergeGroupMode["COPY_EDITORS"] = 0] = "COPY_EDITORS";
        MergeGroupMode[MergeGroupMode["MOVE_EDITORS"] = 1] = "MOVE_EDITORS";
    })(MergeGroupMode = exports.MergeGroupMode || (exports.MergeGroupMode = {}));
    var GroupsOrder;
    (function (GroupsOrder) {
        /**
         * Groups sorted by creation order (oldest one first)
         */
        GroupsOrder[GroupsOrder["CREATION_TIME"] = 0] = "CREATION_TIME";
        /**
         * Groups sorted by most recent activity (most recent active first)
         */
        GroupsOrder[GroupsOrder["MOST_RECENTLY_ACTIVE"] = 1] = "MOST_RECENTLY_ACTIVE";
        /**
         * Groups sorted by grid widget order
         */
        GroupsOrder[GroupsOrder["GRID_APPEARANCE"] = 2] = "GRID_APPEARANCE";
    })(GroupsOrder = exports.GroupsOrder || (exports.GroupsOrder = {}));
    var EditorsOrder;
    (function (EditorsOrder) {
        /**
         * Editors sorted by most recent activity (most recent active first)
         */
        EditorsOrder[EditorsOrder["MOST_RECENTLY_ACTIVE"] = 0] = "MOST_RECENTLY_ACTIVE";
        /**
         * Editors sorted by sequential order
         */
        EditorsOrder[EditorsOrder["SEQUENTIAL"] = 1] = "SEQUENTIAL";
    })(EditorsOrder = exports.EditorsOrder || (exports.EditorsOrder = {}));
    var GroupChangeKind;
    (function (GroupChangeKind) {
        /* Group Changes */
        GroupChangeKind[GroupChangeKind["GROUP_ACTIVE"] = 0] = "GROUP_ACTIVE";
        GroupChangeKind[GroupChangeKind["GROUP_INDEX"] = 1] = "GROUP_INDEX";
        /* Editor Changes */
        GroupChangeKind[GroupChangeKind["EDITOR_OPEN"] = 2] = "EDITOR_OPEN";
        GroupChangeKind[GroupChangeKind["EDITOR_CLOSE"] = 3] = "EDITOR_CLOSE";
        GroupChangeKind[GroupChangeKind["EDITOR_MOVE"] = 4] = "EDITOR_MOVE";
        GroupChangeKind[GroupChangeKind["EDITOR_ACTIVE"] = 5] = "EDITOR_ACTIVE";
        GroupChangeKind[GroupChangeKind["EDITOR_LABEL"] = 6] = "EDITOR_LABEL";
        GroupChangeKind[GroupChangeKind["EDITOR_PIN"] = 7] = "EDITOR_PIN";
        GroupChangeKind[GroupChangeKind["EDITOR_DIRTY"] = 8] = "EDITOR_DIRTY";
    })(GroupChangeKind = exports.GroupChangeKind || (exports.GroupChangeKind = {}));
});
//# sourceMappingURL=editorGroupsService.js.map