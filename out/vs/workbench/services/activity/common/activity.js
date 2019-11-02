/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BaseBadge {
        constructor(descriptorFn) {
            this.descriptorFn = descriptorFn;
        }
        getDescription() {
            return this.descriptorFn(null);
        }
    }
    exports.BaseBadge = BaseBadge;
    class NumberBadge extends BaseBadge {
        constructor(number, descriptorFn) {
            super(descriptorFn);
            this.number = number;
        }
        getDescription() {
            return this.descriptorFn(this.number);
        }
    }
    exports.NumberBadge = NumberBadge;
    class TextBadge extends BaseBadge {
        constructor(text, descriptorFn) {
            super(descriptorFn);
            this.text = text;
        }
    }
    exports.TextBadge = TextBadge;
    class IconBadge extends BaseBadge {
        constructor(descriptorFn) {
            super(descriptorFn);
        }
    }
    exports.IconBadge = IconBadge;
    class ProgressBadge extends BaseBadge {
    }
    exports.ProgressBadge = ProgressBadge;
    exports.IActivityService = instantiation_1.createDecorator('activityService');
});
//# sourceMappingURL=activity.js.map