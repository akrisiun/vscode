/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/editor"], function (require, exports, editor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * The base editor model for the diff editor. It is made up of two editor models, the original version
     * and the modified version.
     */
    class DiffEditorModel extends editor_1.EditorModel {
        constructor(originalModel, modifiedModel) {
            super();
            this._originalModel = originalModel;
            this._modifiedModel = modifiedModel;
        }
        get originalModel() {
            if (!this._originalModel) {
                return null;
            }
            return this._originalModel;
        }
        get modifiedModel() {
            if (!this._modifiedModel) {
                return null;
            }
            return this._modifiedModel;
        }
        async load() {
            await Promise.all([
                this._originalModel ? this._originalModel.load() : Promise.resolve(undefined),
                this._modifiedModel ? this._modifiedModel.load() : Promise.resolve(undefined),
            ]);
            return this;
        }
        isResolved() {
            return this.originalModel instanceof editor_1.EditorModel && this.originalModel.isResolved() && this.modifiedModel instanceof editor_1.EditorModel && this.modifiedModel.isResolved();
        }
        dispose() {
            // Do not propagate the dispose() call to the two models inside. We never created the two models
            // (original and modified) so we can not dispose them without sideeffects. Rather rely on the
            // models getting disposed when their related inputs get disposed from the diffEditorInput.
            super.dispose();
        }
    }
    exports.DiffEditorModel = DiffEditorModel;
});
//# sourceMappingURL=diffEditorModel.js.map