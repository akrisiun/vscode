/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/actions"], function (require, exports, nls, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class CollapseAllAction extends actions_1.Action {
        constructor(viewer, enabled) {
            super('vs.tree.collapse', nls.localize('collapse all', "Collapse All"), 'monaco-tree-action collapse-all', enabled);
            this.viewer = viewer;
        }
        run(context) {
            this.viewer.collapseAll();
            this.viewer.setSelection([]);
            this.viewer.setFocus([]);
            this.viewer.domFocus();
            this.viewer.focusFirst();
            return Promise.resolve();
        }
    }
    exports.CollapseAllAction = CollapseAllAction;
});
//# sourceMappingURL=treeDefaults.js.map