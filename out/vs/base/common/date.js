/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./strings"], function (require, exports, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function toLocalISOString(date) {
        return date.getFullYear() +
            '-' + strings_1.pad(date.getMonth() + 1, 2) +
            '-' + strings_1.pad(date.getDate(), 2) +
            'T' + strings_1.pad(date.getHours(), 2) +
            ':' + strings_1.pad(date.getMinutes(), 2) +
            ':' + strings_1.pad(date.getSeconds(), 2) +
            '.' + (date.getMilliseconds() / 1000).toFixed(3).slice(2, 5) +
            'Z';
    }
    exports.toLocalISOString = toLocalISOString;
});
//# sourceMappingURL=date.js.map