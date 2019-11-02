/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ElementsDragAndDropData {
        constructor(elements) {
            this.elements = elements;
        }
        update(dataTransfer) {
            // no-op
        }
        getData() {
            return this.elements;
        }
    }
    exports.ElementsDragAndDropData = ElementsDragAndDropData;
    class ExternalElementsDragAndDropData {
        constructor(elements) {
            this.elements = elements;
        }
        update(dataTransfer) {
            // no-op
        }
        getData() {
            return this.elements;
        }
    }
    exports.ExternalElementsDragAndDropData = ExternalElementsDragAndDropData;
    class DesktopDragAndDropData {
        constructor() {
            this.types = [];
            this.files = [];
        }
        update(dataTransfer) {
            if (dataTransfer.types) {
                this.types = [];
                Array.prototype.push.apply(this.types, dataTransfer.types);
            }
            if (dataTransfer.files) {
                this.files = [];
                Array.prototype.push.apply(this.files, dataTransfer.files);
                this.files = this.files.filter(f => f.size || f.type);
            }
        }
        getData() {
            return {
                types: this.types,
                files: this.files
            };
        }
    }
    exports.DesktopDragAndDropData = DesktopDragAndDropData;
});
//# sourceMappingURL=treeDnd.js.map